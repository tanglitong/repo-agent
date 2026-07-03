import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { buildContextPack } from "./context-builder.js";
import { handshake, type IntegrationTool } from "./integration-manager.js";
import { exists } from "../utils/fs.js";

import {
  loadHookRoutes,
  type HookRouteEvent,
  type TaskClosureRoute,
  type TaskPreflightRoute,
} from "./hook-router.js";
import { getCommitOptions } from "./commit-policy.js";
import { recordTrace } from "./audit-writer.js";
import { analyzeRecurringErrors } from "./recurring-error-detector.js";
import { maintainAssets } from "./asset-lifecycle.js";
import { checkPolicy } from "./policy-engine.js";
import {
  abandonExpiredClosures,
  ensureClosure,
  markClosureStep,
  openClosure,
  readClosureReceipt,
  type ClosureStep,
} from "./closure-engine.js";
import { appendRuntimeEvent, writeRuntimeSnapshot } from "./event-store.js";
import { appendEvidence } from "./evidence-manager.js";
import { captureObservation } from "./observation-manager.js";
import { runBackgroundLearningIfDue } from "./observation-manager.js";

export type HookEvent = HookRouteEvent;

export interface HookInput {
  session_id?: string;
  turn_id?: string;
  preflight_id?: string;
  cwd?: string;
  hook_event_name?: string;
  prompt?: string;
  stop_hook_active?: boolean;
  last_assistant_message?: string | null;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  outcome_status?: "success" | "failure" | "partial";
  used_asset_ids?: string[];
  [key: string]: unknown;
}

interface PreflightRecord {
  version: 1;
  id: string;
  tool: IntegrationTool;
  sessionId: string;
  turnId: string;
  createdAt: string;
  task: string;
  contextPack: Awaited<ReturnType<typeof buildContextPack>>;
}

function safeId(value: string | undefined, fallback: string): string {
  const normalized = value?.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return normalized || fallback;
}

function runtimeRoot(root: string): string {
  return path.join(root, ".repo-agent-runtime");
}

async function writeJsonAtomic(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

function hookContext(
  record: PreflightRecord,
  route: TaskPreflightRoute,
  closureRoute: TaskClosureRoute,
): string {
  const pack = record.contextPack;
  const sources = new Set(route.context_sources);
  const summary: Record<string, number> = {};
  if (sources.has("instructions")) summary.instructions = pack.relevantInstructions.length;
  if (sources.has("memories")) summary.memories = pack.relevantMemories.length;
  if (sources.has("skills")) summary.skills = pack.relevantSkills.length;
  if (sources.has("fix_patterns")) summary.fixPatterns = pack.recommendedFixPatterns.length;
  if (sources.has("candidates")) summary.candidates = pack.candidateSuggestions.length;
  if (sources.has("recurring_errors")) {
    summary.recurringErrors = pack.recurringErrorRecommendations.length;
  }
  const sourceLine = Object.keys(summary).length
    ? Object.entries(summary).map(([key, value]) => `${key}=${value}`).join(", ")
    : "无";
  return [
    `repo-agent preflight: ${record.id}`,
    `Hook Router: ${route.handler}`,
    `风险等级: ${pack.risk.level}`,
    `必须执行: ${pack.risk.requiredActions.join(", ") || "无"}`,
    `推荐测试: ${pack.recommendedTests.join(", ") || "未检测到"}`,
    `闭环活动: ${closureRoute.closure_steps.join(", ")}`,
    `会话标识: ${record.sessionId}；preflight 标识: ${record.id}。执行闭环活动时传入 sessionId。`,
    `已注入上下文来源: ${sourceLine}（详情请通过 MCP get_latest_preflight 查询）。`,
    "修改前必须遵循以下可信治理上下文：",
    "（已省略明细以控制提示词预算；调用 get_latest_preflight 获取完整 ContextPack。）",
  ].join("\n");
}

function nativeOutput(
  eventName: "SessionStart" | "UserPromptSubmit" | "PreToolUse" | "Stop",
  additionalContext: string,
): Record<string, unknown> {
  return {
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext,
    },
  };
}

export async function readLatestPreflight(
  root: string,
  sessionId?: string,
): Promise<PreflightRecord | null> {
  const session = safeId(sessionId, "manual");
  const pointer = path.join(runtimeRoot(root), "preflights", "sessions", session, "latest.json");
  if (!(await exists(pointer))) return null;
  return JSON.parse(await readFile(pointer, "utf8")) as PreflightRecord;
}

export async function recordRuntimeActivity(
  root: string,
  sessionId: string,
  activity: "get_commit_options" | "record_trace",
): Promise<void> {
  const session = safeId(sessionId, "manual");
  const latest = await readLatestPreflight(root, session);
  const preflightId = safeId(latest?.id, "unscoped");
  await writeJsonAtomic(
    path.join(
      runtimeRoot(root),
      "sessions",
      session,
      "activities",
      preflightId,
      `${activity}.${Date.now()}.${randomUUID()}.json`,
    ),
    {
      activity,
      sessionId: session,
      preflightId: latest?.id ?? null,
      turnId: latest?.turnId ?? null,
      recordedAt: new Date().toISOString(),
    },
  );
  if (latest) {
    const step = activity === "get_commit_options"
      ? "commit_advice"
      : "audit_recorded";
    await markClosureStep({
      root,
      sessionId: session,
      turnId: latest.turnId,
      preflightId: latest.id,
      step,
      producer: "mcp",
      payload: { legacyActivity: activity },
    });
  }
}

export async function runHook(options: {
  root: string;
  tool: IntegrationTool;
  event: HookEvent;
  input: HookInput;
  task?: string;
}): Promise<Record<string, unknown>> {
  const sessionId = safeId(options.input.session_id, `manual-${randomUUID()}`);
  const turnId = safeId(options.input.turn_id, randomUUID());
  const routes = await loadHookRoutes(options.root);
  const route = routes.routes[options.event];

  if (route.handler === "session_handshake") {
    await abandonExpiredClosures(options.root);
    const pending = await readLatestPreflight(options.root, sessionId);
    if (pending) {
      const receipt = await readClosureReceipt(
        options.root,
        pending.sessionId,
        pending.id,
      );
      if (receipt && receipt.status !== "closed" && receipt.status !== "abandoned") {
        await runHook({
          root: options.root,
          tool: pending.tool,
          event: "stop",
          input: {
            session_id: pending.sessionId,
            turn_id: pending.turnId,
            stop_hook_active: true,
            last_assistant_message: "SessionStart 自动恢复上一轮未完成闭环。",
            outcome_status: "partial",
          },
        });
      }
    }
    const state = await handshake({
      root: options.root,
      tool: options.tool,
      hook: "session-start",
    });
    await writeJsonAtomic(
      path.join(runtimeRoot(options.root), "tools", `${options.tool}.json`),
      {
        version: 1,
        tool: options.tool,
        sessionId,
        observedAt: new Date().toISOString(),
        status: state.status,
      },
    );
    return nativeOutput(
      "SessionStart",
      state.status === "active"
        ? "repo-agent 接入状态：active。任务开始时治理 preflight 将自动注入。"
        : `repo-agent 接入状态：${state.status}。请先完成初始化或修复接入，再开始治理任务。`,
    );
  }

  if (route.handler === "tool_policy") {
    const command = typeof options.input.tool_input?.command === "string"
      ? options.input.tool_input.command
      : undefined;
    const candidatePath = options.input.tool_input?.file_path ??
      options.input.tool_input?.path;
    const paths = typeof candidatePath === "string" ? [candidatePath] : [];
    const policy = await checkPolicy(options.root, {
      command,
      paths,
      toolId: options.input.tool_name,
    });
    const latest = await readLatestPreflight(options.root, sessionId);
    if (latest) {
      await appendRuntimeEvent(options.root, {
        eventType: policy.blocked ? "tool_blocked" : "tool_allowed",
        sessionId,
        turnId: latest.turnId,
        preflightId: latest.id,
        producer: "hook",
        idempotencyKey:
          `${latest.id}:tool:${String(options.input.tool_name ?? "unknown")}:${randomUUID()}`,
        payload: {
          toolName: options.input.tool_name ?? null,
          blocked: policy.blocked,
          requiresReview: policy.requiresReview,
          reasons: policy.reasons,
        },
      });
    }
    if (policy.blocked) {
      return {
        decision: "block",
        reason: policy.reasons.join(" "),
      };
    }
    if (policy.requiresReview && options.tool === "claude-code") {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason: policy.reasons.join(" "),
        },
      };
    }
    return nativeOutput(
      "PreToolUse",
      policy.requiresReview
        ? `repo-agent：该工具调用交由客户端原生审批策略处理。${policy.reasons.join(" ")}`
        : "repo-agent：工具调用未命中阻止策略。",
    );
  }

  if (route.handler === "task_preflight") {
    const pending = await readLatestPreflight(options.root, sessionId);
    if (pending) {
      const receipt = await readClosureReceipt(
        options.root,
        pending.sessionId,
        pending.id,
      );
      if (receipt && receipt.status !== "closed" && receipt.status !== "abandoned") {
        await runHook({
          root: options.root,
          tool: pending.tool,
          event: "stop",
          input: {
            session_id: pending.sessionId,
            turn_id: pending.turnId,
            stop_hook_active: true,
            last_assistant_message: "新任务开始前自动恢复上一轮未完成闭环。",
            outcome_status: "partial",
          },
        });
      }
    }
    const task = options.task ?? (typeof options.input.prompt === "string"
      ? options.input.prompt
      : "");
    if (!task.trim()) {
      return {
        decision: "block",
        reason: "repo-agent：UserPromptSubmit hook 缺少 prompt，无法生成 preflight。",
      };
    }
    const id = `preflight.${Date.now()}.${options.tool}.${randomUUID()}`;
    const contextPack = await buildContextPack(options.root, task, {
      tool: options.tool,
      sessionId,
      turnId,
      preflightId: id,
      hook: true,
    });
    const record: PreflightRecord = {
      version: 1,
      id,
      tool: options.tool,
      sessionId,
      turnId,
      createdAt: new Date().toISOString(),
      task,
      contextPack,
    };
    const file = path.join(runtimeRoot(options.root), "preflights", `${id}.json`);
    await writeJsonAtomic(file, record);
    await writeJsonAtomic(
      path.join(runtimeRoot(options.root), "preflights", "sessions", sessionId, "latest.json"),
      record,
    );
    await openClosure({
      root: options.root,
      sessionId,
      turnId,
      preflightId: id,
      openedAt: record.createdAt,
    });
    await appendRuntimeEvent(options.root, {
      eventType: "preflight_opened",
      sessionId,
      turnId,
      preflightId: id,
      producer: "hook",
      idempotencyKey: `${id}:preflight_opened`,
      payload: { task, tool: options.tool, risk: contextPack.risk.level },
    });
    await appendRuntimeEvent(options.root, {
      eventType: "context_built",
      sessionId,
      turnId,
      preflightId: id,
      producer: "hook",
      idempotencyKey: `${id}:context_built`,
      payload: {
        trustedAssetIds: contextPack.trustedAssets
          .map((item) => item.id)
          .filter(Boolean),
        advisoryIds: contextPack.untrustedAdvisories
          .map((item) => item.id)
          .filter(Boolean),
        estimatedTokens: contextPack.contextBudget.estimatedTokens,
      },
    });
    await appendEvidence(
      options.root,
      [...contextPack.trustedAssets, ...contextPack.untrustedAdvisories]
        .map((item) => item.id)
        .filter((assetId): assetId is string => Boolean(assetId))
        .map((assetId) => ({
          assetId,
          preflightId: id,
          sessionId,
          type: "retrieved" as const,
          outcomeSource: "agent" as const,
          confidence: 0.5,
        })),
    );
    if (route.block_on_risk.includes(contextPack.risk.level)) {
      return {
        decision: "block",
        reason: contextPack.risk.reasons.join(" "),
      };
    }
    return nativeOutput(
      "UserPromptSubmit",
      hookContext(record, route, routes.routes.stop),
    );
  }

  const latest = await readLatestPreflight(options.root, sessionId);
  if (!latest) {
    const message = "repo-agent：本轮未发现关联 preflight，请检查 Hook 接入状态。";
    return options.input.stop_hook_active
      ? { systemMessage: message }
      : { decision: "block", reason: message };
  }
  if (
    (options.input.turn_id && safeId(options.input.turn_id, "") !== latest.turnId) ||
    (options.input.preflight_id &&
      safeId(options.input.preflight_id, "") !== latest.id) ||
    latest.sessionId !== sessionId
  ) {
    const message = "repo-agent：Session、Turn 或 Preflight 标识不一致，已 Fail Closed。";
    return options.input.stop_hook_active
      ? { systemMessage: message }
      : { decision: "block", reason: message };
  }
  const outcome = typeof options.input.last_assistant_message === "string"
    ? options.input.last_assistant_message
    : "任务轮次结束，未提供最终结果摘要。";
  const outcomeStatus = ["success", "failure", "partial"].includes(
    String(options.input.outcome_status),
  )
    ? options.input.outcome_status as "success" | "failure" | "partial"
    : "partial";
  let commitOptions: Awaited<ReturnType<typeof getCommitOptions>> | undefined;
  let auditId: string | undefined;
  const credited = <T extends { id?: string }>(items: T[]) =>
    items.map((item) => item.id).filter((id): id is string => Boolean(id));
  try {
    const closure = await ensureClosure({
      root: options.root,
      sessionId,
      turnId: latest.turnId,
      preflightId: latest.id,
      producer: "hook",
      handlers: {
        commit_advice: async () => {
          commitOptions = await getCommitOptions(options.root, {
            task: latest.task,
          });
          return { recommendedAction: commitOptions.recommendedAction };
        },
        audit_recorded: async () => {
          commitOptions ??= await getCommitOptions(options.root, {
            task: latest.task,
          });
          const audit = await recordTrace(options.root, {
            task: latest.task,
            outcome,
            outcomeStatus,
            commitOptions,
            usedMemories: credited(latest.contextPack.relevantMemories),
            usedSkills: credited(latest.contextPack.relevantSkills),
            usedFixPatterns: credited(
              latest.contextPack.recommendedFixPatterns,
            ),
            sessionId,
            preflightId: latest.id,
          });
          auditId = audit.auditId;
          return { auditId: audit.auditId ?? null };
        },
        observation_captured: async () => {
          const observation = await captureObservation({
            root: options.root,
            preflightId: latest.id,
            sessionId,
            task: latest.task,
            outcome,
            outcomeStatus,
            changedFiles: commitOptions?.changedFiles,
            tests: latest.contextPack.recommendedTests,
            auditId,
          });
          return { observationId: observation.observationId };
        },
        recurring_analyzed: async () => {
          const result = await analyzeRecurringErrors(options.root);
          return { signals: result.signals.length };
        },
        lifecycle_evaluated: async () => {
          const learning = await runBackgroundLearningIfDue(options.root);
          const result = await maintainAssets(options.root);
          return {
            transitions: result.transitions.length,
            sharedAssetsDeleted: result.sharedAssetsDeleted,
            learningAnalyzed: learning.analyzed,
          };
        },
        metrics_updated: async () => {
          await writeRuntimeSnapshot(options.root, "metrics/latest.json", {
            version: 1,
            updatedAt: new Date().toISOString(),
            preflightId: latest.id,
            outcomeStatus,
          });
          return { updated: true };
        },
      } satisfies Record<ClosureStep, () => Promise<Record<string, unknown>>>,
    });
    if (closure.receipt.status !== "closed") {
      const reason =
        `repo-agent：本轮闭环未完成：${closure.failedNow.map((item) => `${item.step}: ${item.message}`).join("; ")}`;
      return options.input.stop_hook_active
        ? { systemMessage: reason }
        : { decision: "block", reason };
    }
    const appliedAssetIds = Array.isArray(options.input.used_asset_ids)
      ? [...new Set(options.input.used_asset_ids.filter((item) => typeof item === "string" && item))]
      : [];
    if (appliedAssetIds.length) {
      await appendEvidence(options.root, appliedAssetIds.flatMap((assetId) => [
        {
          assetId,
          preflightId: latest.id,
          sessionId,
          type: "applied" as const,
          outcomeSource: "agent" as const,
          confidence: 0.6,
        },
        ...(outcomeStatus === "partial"
          ? []
          : [{
              assetId,
              preflightId: latest.id,
              sessionId,
              type: outcomeStatus === "success"
                ? "validated_success" as const
                : "validated_failure" as const,
              outcomeSource: "agent" as const,
              confidence: 0.6,
            }]),
      ]));
    }
    return {
      systemMessage:
        `repo-agent：本轮 preflight=${latest.id}，闭环步骤完整：${closure.receipt.completedSteps.join(", ")}。`,
    };
  } catch (error) {
    const reason = `repo-agent：本轮闭环失败：${(error as Error).message}`;
    return options.input.stop_hook_active
      ? { systemMessage: reason }
      : { decision: "block", reason };
  }
}

export async function recoverLatestClosure(
  root: string,
  sessionId?: string,
  dryRun = false,
) {
  const latest = await readLatestPreflight(root, sessionId);
  if (!latest) return { command: "closure-recover", recovered: false, reason: "没有可恢复的 Preflight。" };
  const receipt = await readClosureReceipt(root, latest.sessionId, latest.id);
  if (!receipt || receipt.status === "closed" || receipt.status === "abandoned") {
    return { command: "closure-recover", recovered: false, receipt };
  }
  if (dryRun) return { command: "closure-recover", recovered: false, dryRun: true, receipt };
  const result = await runHook({
    root,
    tool: latest.tool,
    event: "stop",
    input: {
      session_id: latest.sessionId,
      turn_id: latest.turnId,
      stop_hook_active: true,
      last_assistant_message: "手工恢复未完成闭环。",
      outcome_status: "partial",
    },
  });
  return {
    command: "closure-recover",
    recovered: true,
    result,
    receipt: await readClosureReceipt(root, latest.sessionId, latest.id),
  };
}
