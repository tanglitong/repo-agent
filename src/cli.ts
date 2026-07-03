import { doctor } from "./commands/doctor.js";
import { initializeProject, type InitMode } from "./commands/init.js";
import { validateProject } from "./commands/validate.js";
import { getStatus } from "./commands/status.js";
import { explain } from "./commands/explain.js";
import { buildContextPack } from "./core/context-builder.js";
import { getCommitOptions } from "./core/commit-policy.js";
import {
  listApproved,
  listCandidates,
  proposeCandidate,
  promoteCandidate,
  reviewCandidate,
  type CandidateKind,
} from "./core/candidate-manager.js";
import { classifyLearning } from "./core/learning-router.js";
import { runMcpServer } from "./mcp/server.js";
import { healthCheck } from "./commands/health.js";
import { buildImportPlan, scanImportSources } from "./core/import-planner.js";
import { createInbox, listInbox, triageInbox } from "./core/learning-inbox.js";
import { createPatch } from "./core/patch-writer.js";
import {
  analyzeRecurringErrors,
  listRecurringErrors,
  proposeFromRecurring,
  recommendRecurringErrors,
} from "./core/recurring-error-detector.js";
import { CliError } from "./errors.js";
import { VERSION } from "./index.js";
import { findProjectRoot } from "./utils/project-root.js";
import { createUpgradePlan, type UpgradePlan } from "./commands/upgrade.js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  activateIntegrations,
  deactivateIntegrations,
  handshake,
  type IntegrationTool,
  type EntryMode,
  type ToolSelection,
} from "./core/integration-manager.js";
import { runHook, type HookEvent, type HookInput } from "./core/hook-runtime.js";
import { recordRuntimeActivity, readLatestPreflight } from "./core/hook-runtime.js";
import { recordTrace } from "./core/audit-writer.js";
import { runUpdate } from "./commands/update.js";
import { maintainAssets } from "./core/asset-lifecycle.js";
import {
  applyLifecycleProposal,
  listLifecycleProposals,
  proposeLifecycleRestore,
} from "./core/asset-lifecycle.js";
import { closureDiagnostics } from "./core/closure-engine.js";
import { recoverLatestClosure } from "./core/hook-runtime.js";
import { explainEvidence } from "./core/evidence-manager.js";
import { runBackgroundLearningIfDue } from "./core/observation-manager.js";

interface ParsedArguments {
  positionals: string[];
  options: Record<string, string | boolean>;
}

const valueOptions = new Set([
  "mode",
  "id",
  "content",
  "description",
  "pattern",
  "task",
  "observation",
  "paths",
  "command",
  "scope",
  "source",
  "tool",
  "entry",
  "session-id",
  "outcome",
  "outcome-status",
  "visibility",
  "merged-into",
  "reviewer",
]);
const toolSelections = [
  "auto",
  "all",
  "codex",
  "claude-code",
  "opencode",
];

function parseArguments(argv: string[]): ParsedArguments {
  const positionals: string[] = [];
  const options: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }
    const name = argument.slice(2);
    if (
      name === "json" ||
      name === "dry-run" ||
      name === "help" ||
      name === "version" ||
      name === "strict" ||
      name === "yes" ||
      name === "repair" ||
      name === "without-secrets"
      || name === "deep"
      || name === "rollback"
    ) {
      options[name] = true;
      continue;
    }
    if (!valueOptions.has(name)) {
      throw new CliError("E_UNKNOWN_COMMAND", `未知选项：--${name}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new CliError("E_UNKNOWN_COMMAND", `选项 --${name} 需要提供值。`);
    }
    options[name] = value;
    index += 1;
  }
  return { positionals, options };
}

function optionString(parsed: ParsedArguments, name: string): string | undefined {
  const value = parsed.options[name];
  return typeof value === "string" ? value : undefined;
}

function requiredOption(parsed: ParsedArguments, name: string): string {
  const value = optionString(parsed, name);
  if (!value) throw new CliError("E_INVALID_CANDIDATE", `缺少必填选项 --${name}。`);
  return value;
}

function commaList(value?: string): string[] {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function helpText(): string {
  return `repo-agent ${VERSION}

P0 基础命令：
  repo-agent init [--mode team|personal] [--tool all|codex|claude-code|opencode] [--entry auto|hook|plugin|mcp-only|none] [--dry-run] [--json]
  repo-agent update [--source <zip-or-directory>] [--tool auto|all|codex|claude-code|opencode] [--entry auto|hook|plugin|mcp-only|none] [--dry-run] [--yes] [--rollback [<run-id>]] [--json]
  repo-agent doctor|validate [--json]
  repo-agent context <task> [--json]
  repo-agent commit-options [--task <task>] [--paths <a,b>] [--session-id <id>] [--json]
  repo-agent record-trace --task <task> [--outcome <text>] [--outcome-status success|failure|partial] [--session-id <id>] [--json]

P1 学习与上下文命令：
  repo-agent status [--json]
  repo-agent memory|skill|fix-pattern list-candidates|propose [--visibility private|team]
  repo-agent memory|skill|fix-pattern approve|reject|archive|merge <candidate-id>
  repo-agent learning classify --task <task> --observation <text>
  repo-agent learning analyze [--dry-run]
  repo-agent candidate promote <candidate-id> [--dry-run]
  repo-agent closure status|recover [--session-id <id>] [--dry-run]
  repo-agent evidence explain <asset-id>
  repo-agent lifecycle propose [--dry-run]
  repo-agent lifecycle list
  repo-agent lifecycle apply <proposal-id> [--reviewer <name>] [--dry-run]
  repo-agent lifecycle restore <asset-id> [--dry-run]
  repo-agent explain context <task>

P2 治理命令：
  repo-agent validate --strict --json
  repo-agent health check --json
  repo-agent maintain [--dry-run] [--json]
  repo-agent import scan|plan --json
  repo-agent recurring-errors list|analyze|recommend|propose-fix-pattern
  repo-agent learning inbox|triage
  repo-agent patch create [--dry-run]
  repo-agent mcp stdio

工具接入：
  repo-agent handshake [--tool auto|codex|claude-code|opencode]
  repo-agent activate [--repair] [--tool auto|all|codex|claude-code|opencode] [--entry auto|hook|plugin|mcp-only|none]
  repo-agent deactivate [--tool ...]
  repo-agent hook session-start|user-prompt-submit|pre-tool-use|stop --tool codex|claude-code|opencode
`;
}

const riskLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  blocked: "已阻止",
};

const actionLabels: Record<string, string> = {
  keep_local: "保留本地",
  direct_commit: "直接提交",
  create_review_request: "创建审核请求",
  create_patch: "创建补丁",
};

const modeLabels: Record<string, string> = {
  team: "团队",
  personal: "个人",
};

function successPayload(result: unknown): unknown {
  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    if ("ok" in record) {
      const { ok: _ok, warnings: _warnings, ...data } = record;
      return "data" in record ? record : { ...record, data };
    }
    return {
      ok: true,
      data: record,
      warnings: Array.isArray(record.warnings) ? record.warnings : [],
    };
  }
  return { ok: true, data: result, warnings: [] };
}

function printHuman(result: unknown): void {
  const value = result as Record<string, unknown>;
  if (value.command === "update") {
    const action = String(value.action);
    if (action === "rollback") {
      console.log(`repo-agent 升级回滚完成：${String(value.runId)}`);
      console.log(`已恢复项目资产版本：${String(value.restoredVersion)}`);
      return;
    }
    if (action === "migrate") {
      console.log("repo-agent 升级结果");
      console.log(`项目资产：${String(value.currentVersion)} → ${String(value.targetVersion)}`);
      console.log(`升级包工具版本：${String(value.toolVersion)}`);
      if ((value.pendingReview as string[]).length) {
        console.log(`待人工审核：${(value.pendingReview as string[]).length} 项`);
      }
      for (const migration of value.migrationChain as string[]) console.log(`- migration：${migration}`);
      for (const directory of value.createDirectories as string[]) console.log(`- 新增目录：${directory}`);
      for (const file of value.createFiles as string[]) console.log(`- 新增文件：${file}`);
      for (const proposal of value.configProposals as Array<{ file: string; path: string }>) {
        console.log(`- 配置建议：${proposal.file} → ${proposal.path}`);
      }
      for (const candidate of value.upgradeCandidates as Array<{ path: string }>) {
        console.log(`- 升级候选：${candidate.path}`);
      }
      for (const conflict of value.conflicts as Array<{ path: string; reason: string }>) {
        console.warn(`冲突：${conflict.path}：${conflict.reason}`);
      }
      if (value.dryRun) console.log("试运行完成，未写入任何文件。");
      if (value.applied) {
        console.log(value.reviewRequired ? "安全增量已应用，仍有内容需要人工审核。" : "升级完成。");
        if (value.reportPath) console.log(`升级报告：${String(value.reportPath)}`);
        if (value.toolSwitched === false && value.nextCommand) {
          console.log(`新版工具已暂存；后续入口：${String(value.nextCommand)}`);
        }
      }
      for (const warning of value.warnings as string[]) console.warn(`警告：${warning}`);
      return;
    }
    console.log(action === "init" ? "repo-agent 初始化完成。" : "repo-agent 同步完成。");
    const validation = value.validation as { ok?: boolean } | null;
    if (validation) {
      console.log(`团队资产校验：${validation.ok === false ? "失败" : "通过"}`);
    }
    const activation = value.activation as {
      created?: string[];
      updated?: string[];
      reloadRequired?: boolean;
    } | undefined;
    if (activation) {
      console.log(
        `接入配置：新增 ${activation.created?.length ?? 0} 项，更新 ${activation.updated?.length ?? 0} 项。`,
      );
      if (activation.reloadRequired) console.log("请新建工具会话使配置生效。");
    }
    for (const warning of value.warnings as string[]) console.warn(`警告：${warning}`);
    return;
  }
    if (value.command === "activate" || value.command === "deactivate") {
    console.log(String(value.message));
    if (value.reloadRequired) console.log("需要新建会话或重新打开开发工具；无需重启业务项目。");
    return;
  }
    if (value.command === "maintain") {
    console.log("repo-agent 资产生命周期维护完成。");
    console.log(`待审核过期资产：${(value.staleApproved as unknown[]).length} 项。`);
    console.log(`已清理私人候选：${(value.removedPrivateCandidates as unknown[]).length} 项。`);
    console.log(`已清理私人 Inbox：${(value.removedPrivateInbox as unknown[]).length} 项。`);
    console.log(`生命周期转换：${(value.transitions as unknown[]).length} 项。`);
    return;
  }
  if (value.command === "record-trace") {
    console.log(
      value.recorded
        ? `repo-agent 审计已记录：${String(value.path)}`
        : value.dryRun
          ? `试运行：将写入审计 ${String(value.path)}`
          : "项目配置已关闭审计记录。",
    );
    return;
  }
  if (
    ["approve", "reject", "archive", "merge"].includes(String(value.action)) &&
    value.candidate
  ) {
    console.log(`候选资产审核完成：${String(value.action)}。`);
    console.log(`候选文件：${String(value.source)}`);
    if (value.approvedPath) console.log(`正式资产：${String(value.approvedPath)}`);
    return;
  }
  if (value.command === "handshake") {
    console.log(`repo-agent 接入状态：${String(value.status)}`);
    for (const check of value.checks as Array<{ tool: string; status: string }>) {
      console.log(`- ${check.tool}：${check.status}`);
    }
    if (value.suggestedCommand) console.log(`建议执行：${String(value.suggestedCommand)}`);
    return;
  }
  if (value.command === "init") {
    const files = value.dryRun
      ? [...value.wouldCreate as string[], ...value.wouldUpdate as string[]]
      : [...value.created as string[], ...value.updated as string[]];
    console.log(`repo-agent 初始化（${modeLabels[String(value.mode)] ?? String(value.mode)}模式）`);
    console.log(
      value.dryRun
        ? "试运行：未写入任何文件。"
        : `已创建 ${(value.created as unknown[]).length} 个文件，更新 ${(value.updated as unknown[]).length} 个文件。`,
    );
    for (const file of files as string[]) console.log(`- ${file}`);
    const activation = value.activation as { message?: string; reloadRequired?: boolean } | undefined;
    if (!value.dryRun && activation?.message) console.log(activation.message);
    if (!value.dryRun && activation?.reloadRequired) {
      console.log("需要新建会话或重新打开开发工具；无需重启业务项目。");
    }
    for (const warning of value.warnings as string[]) console.warn(`警告：${warning}`);
    return;
  }
  if (value.command === "doctor") {
    console.log(`repo-agent 环境检查：${value.ok ? "通过" : "失败"}`);
    for (const check of value.checks as Array<{ ok: boolean; message: string }>) {
      console.log(`${check.ok ? "✓" : "✗"} ${check.message}`);
    }
    return;
  }
  if (value.command === "validate") {
    console.log(`配置校验（${value.mode === "strict" ? "严格模式" : "普通模式"}）：${value.ok ? "通过" : "失败"}`);
    for (const issue of value.errors as Array<{ code: string; path?: string; message: string }>) {
      console.log(`✗ [${issue.code}] ${issue.path ? `${issue.path}：` : ""}${issue.message}`);
    }
    for (const warning of value.warnings as Array<{ code: string; path?: string; message: string }>) {
      console.warn(`警告 [${warning.code}] ${warning.path ? `${warning.path}：` : ""}${warning.message}`);
    }
    return;
  }
  if (value.projectProfile && value.risk) {
    const risk = value.risk as { level: string; reasons: string[] };
    console.log(`任务：${String(value.task)}`);
    console.log(`风险等级：${riskLabels[risk.level] ?? risk.level}`);
    for (const reason of risk.reasons) console.log(`- ${reason}`);
    const memories = value.relevantMemories as Array<{ id?: string }>;
    const skills = value.relevantSkills as Array<{ id?: string }>;
    const fixes = value.recommendedFixPatterns as Array<{ id?: string }>;
    console.log(`相关 Memory：${memories.map((item) => item.id).filter(Boolean).join("、") || "无"}`);
    console.log(`相关 Skill：${skills.map((item) => item.id).filter(Boolean).join("、") || "无"}`);
    console.log(`推荐 Fix Pattern：${fixes.map((item) => item.id).filter(Boolean).join("、") || "无"}`);
    for (const warning of value.warnings as string[]) console.warn(`警告：${warning}`);
    return;
  }
  if (value.recommendedAction && value.allowedActions) {
    console.log(`推荐提交方式：${actionLabels[String(value.recommendedAction)] ?? String(value.recommendedAction)}`);
    console.log(`风险等级：${riskLabels[String(value.riskLevel)] ?? String(value.riskLevel)}`);
    console.log(`可选操作：${(value.allowedActions as string[]).map((action) => actionLabels[action] ?? action).join("、")}`);
    for (const reason of value.reasons as string[]) console.log(`- ${reason}`);
    return;
  }
  if ("initialized" in value && value.pendingCandidates) {
    const pending = value.pendingCandidates as { memory: number; skill: number; fixPattern: number };
    console.log(`初始化状态：${value.initialized ? "已初始化" : "未初始化"}`);
    console.log(`项目模式：${modeLabels[String(value.mode)] ?? String(value.mode ?? "未知")}`);
    const validateLabel = value.validate === "ok" ? "通过" : value.validate === "failed" ? "失败" : String(value.validate);
    console.log(`配置校验：${validateLabel}`);
    console.log(`待审核候选：memory ${pending.memory}、skill ${pending.skill}、fix pattern ${pending.fixPattern}`);
    console.log(`Git 变更文件数：${String(value.gitDirtyFiles)}`);
    return;
  }
  if (typeof value.score === "number" && Array.isArray(value.good)) {
    console.log(`仓库治理健康分：${value.score}/100`);
    for (const item of value.good as string[]) console.log(`✓ ${item}`);
    for (const warning of value.warnings as string[]) console.warn(`警告：${warning}`);
    for (const action of value.actions as string[]) console.log(`建议：${action}`);
    return;
  }
  console.log(JSON.stringify(result, null, 2));
}

function printError(error: CliError, json: boolean): void {
  const payload = {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.path ? { path: error.path } : {}),
    },
    warnings: [],
  };
  if (json) console.log(JSON.stringify(payload));
  else console.error(`[${error.code}] ${error.message}`);
}

function candidateKind(command: string): CandidateKind {
  if (command === "memory") return "memory";
  if (command === "skill") return "skill";
  return "fix_pattern";
}

async function candidateCommand(
  root: string,
  parsed: ParsedArguments,
): Promise<unknown> {
  const [command, action] = parsed.positionals;
  const kind = candidateKind(command);
  if (action === "list-candidates") return { kind, candidates: await listCandidates(root, kind) };
  if (action === "list" && kind !== "memory") return { kind, artifacts: await listApproved(root, kind) };
  if (["approve", "reject", "archive", "merge"].includes(action ?? "")) {
    const id = optionString(parsed, "id") ?? parsed.positionals[2];
    if (!id) {
      throw new CliError(
        "E_INVALID_CANDIDATE",
        `${action} 操作需要候选 ID。`,
      );
    }
    return reviewCandidate({
      root,
      kind,
      id,
      action: action as "approve" | "reject" | "archive" | "merge",
      mergedInto: optionString(parsed, "merged-into"),
      reviewer: optionString(parsed, "reviewer"),
      dryRun: parsed.options["dry-run"] === true,
    });
  }
  if (action !== "propose") {
    throw new CliError("E_UNKNOWN_COMMAND", `未知的 ${command} 操作：${action ?? ""}`);
  }
  const valueName = kind === "memory" ? "content" : kind === "skill" ? "description" : "pattern";
  const visibility = optionString(parsed, "visibility") ?? "private";
  if (visibility !== "private" && visibility !== "team") {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "--visibility 只能是 private 或 team。",
    );
  }
  return proposeCandidate({
    root,
    kind,
    id: requiredOption(parsed, "id"),
    value: requiredOption(parsed, valueName),
    task: optionString(parsed, "task"),
    scope: commaList(optionString(parsed, "scope")),
    dryRun: parsed.options["dry-run"] === true,
    visibility,
  });
}

async function confirmUpgrade(plan: UpgradePlan): Promise<boolean> {
  printHuman(plan);
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new CliError(
      "E_UPGRADE_CONFIRMATION_REQUIRED",
      "非交互环境必须使用 --yes 或 --dry-run。",
    );
  }
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await prompt.question("确认执行上述安全增量升级？输入 yes 继续：");
    return answer.trim().toLowerCase() === "yes";
  } finally {
    prompt.close();
  }
}

async function dispatch(root: string, parsed: ParsedArguments): Promise<unknown> {
  const [command, subcommand, ...rest] = parsed.positionals;
  switch (command) {
    case "init": {
      const rawMode = optionString(parsed, "mode") ?? "team";
      if (rawMode !== "team" && rawMode !== "personal") {
        throw new CliError("E_UNKNOWN_COMMAND", "--mode 只能是 `team` 或 `personal`。");
      }
      const tool = (optionString(parsed, "tool") ?? "all") as ToolSelection;
      if (!toolSelections.includes(tool)) {
        throw new CliError("E_UNKNOWN_COMMAND", `不支持的工具：${tool}`);
      }
      const entry = (optionString(parsed, "entry") ?? "auto") as EntryMode;
      if (!["auto", "hook", "plugin", "mcp-only", "none"].includes(entry)) {
        throw new CliError("E_UNSUPPORTED_ENTRY", `不支持的 entry：${entry}`);
      }
      return initializeProject({
        root,
        mode: rawMode as InitMode,
        dryRun: parsed.options["dry-run"] === true,
        tool,
        entry,
      });
    }
    case "doctor":
      return doctor(root);
    case "update": {
      const tool = (optionString(parsed, "tool") ?? "auto") as ToolSelection;
      if (!toolSelections.includes(tool)) {
        throw new CliError("E_UNKNOWN_COMMAND", `不支持的工具：${tool}`);
      }
      const entry = (optionString(parsed, "entry") ?? "auto") as EntryMode;
      if (!["auto", "hook", "plugin", "mcp-only", "none"].includes(entry)) {
        throw new CliError("E_UNSUPPORTED_ENTRY", `不支持的 entry：${entry}`);
      }
      const rollback = parsed.options.rollback === true ||
        typeof parsed.options.rollback === "string";
      const rollbackRunId = typeof parsed.options.rollback === "string"
        ? parsed.options.rollback
        : rest[0];
      const dryRun = parsed.options["dry-run"] === true;
      const source = optionString(parsed, "source");
      let confirmed = parsed.options.yes === true;
      if (!rollback && !dryRun && !confirmed && source) {
        const prepared = await createUpgradePlan(root, source, "plan");
        if (prepared.plan.upgradeAvailable) {
          if (parsed.options.json === true || !stdin.isTTY || !stdout.isTTY) {
            throw new CliError(
              "E_UPGRADE_CONFIRMATION_REQUIRED",
              "非交互环境必须使用 --yes 或 --dry-run。",
            );
          }
          confirmed = await confirmUpgrade(prepared.plan);
          if (!confirmed) {
            return {
              ...prepared.plan,
              command: "update",
              action: "migrate",
            };
          }
        }
      }
      return runUpdate({
        root,
        source,
        tool,
        entry,
        dryRun,
        confirmed,
        rollback,
        rollbackRunId,
      });
    }
    case "validate":
      return validateProject(root, parsed.options.strict === true);
    case "context": {
      const task = optionString(parsed, "task") ?? [subcommand, ...rest].filter(Boolean).join(" ");
      if (!task) throw new CliError("E_UNKNOWN_COMMAND", "context 命令需要提供任务描述。");
      return buildContextPack(root, task);
    }
    case "commit-options": {
      const sessionId = optionString(parsed, "session-id");
      const explicitTask = optionString(parsed, "task");
      let task = explicitTask;
      if (!task && sessionId) {
        const latest = await readLatestPreflight(root, sessionId);
        task = latest?.task;
      }
      const result = await getCommitOptions(root, {
        task,
        paths: commaList(optionString(parsed, "paths")),
      });
      if (sessionId) {
        await recordRuntimeActivity(root, sessionId, "get_commit_options");
      }
      return result;
    }
    case "record-trace": {
      const sessionId = optionString(parsed, "session-id");
      let task = optionString(parsed, "task");
      let latest: Awaited<ReturnType<typeof readLatestPreflight>> = null;
      if (!task && sessionId) {
        latest = await readLatestPreflight(root, sessionId);
        task = latest?.task;
      } else if (sessionId) {
        latest = await readLatestPreflight(root, sessionId);
      }
      if (!task) {
        throw new CliError("E_INVALID_CANDIDATE", "缺少必填选项 --task。");
      }
      const outcomeStatus = optionString(parsed, "outcome-status") ?? "partial";
      if (!["success", "failure", "partial"].includes(outcomeStatus)) {
        throw new CliError(
          "E_INVALID_CANDIDATE",
          "--outcome-status 只能是 success、failure 或 partial。",
        );
      }
      const result = await recordTrace(root, {
        task,
        outcome: optionString(parsed, "outcome") ?? null,
        outcomeStatus,
        usedMemories: latest?.contextPack.relevantMemories
          .filter((item) => (item.relevanceScore ?? 0) > 0)
          .map((item) => item.id).filter(Boolean),
        usedSkills: latest?.contextPack.relevantSkills
          .filter((item) => (item.relevanceScore ?? 0) > 0)
          .map((item) => item.id).filter(Boolean),
        usedFixPatterns: latest?.contextPack.recommendedFixPatterns
          .filter((item) => (item.relevanceScore ?? 0) > 0)
          .map((item) => item.id).filter(Boolean),
        dryRun: parsed.options["dry-run"] === true,
        sessionId,
        preflightId: latest?.id,
      });
      if (sessionId && parsed.options["dry-run"] !== true) {
        await recordRuntimeActivity(root, sessionId, "record_trace");
      }
      return result;
    }
    case "status":
      return getStatus(root, parsed.options["dry-run"] === true);
    case "handshake": {
      const tool = (optionString(parsed, "tool") ?? "auto") as ToolSelection;
      if (!toolSelections.includes(tool)) {
        throw new CliError("E_UNKNOWN_COMMAND", `不支持的工具：${tool}`);
      }
      return handshake({ root, tool });
    }
    case "activate": {
      const tool = (optionString(parsed, "tool") ?? "auto") as ToolSelection;
      if (!toolSelections.includes(tool)) {
        throw new CliError("E_UNKNOWN_COMMAND", `不支持的工具：${tool}`);
      }
      const entry = (optionString(parsed, "entry") ?? "auto") as EntryMode;
      if (!["auto", "hook", "plugin", "mcp-only", "none"].includes(entry)) {
        throw new CliError("E_UNSUPPORTED_ENTRY", `不支持的 entry：${entry}`);
      }
      return activateIntegrations(root, tool, parsed.options["dry-run"] === true, entry);
    }
    case "deactivate": {
      const tool = (optionString(parsed, "tool") ?? "auto") as ToolSelection;
      if (!toolSelections.includes(tool)) {
        throw new CliError("E_UNKNOWN_COMMAND", `不支持的工具：${tool}`);
      }
      return deactivateIntegrations(root, tool, parsed.options["dry-run"] === true);
    }
    case "hook": {
      if (!["session-start", "user-prompt-submit", "pre-tool-use", "stop"].includes(subcommand ?? "")) {
        throw new CliError("E_UNKNOWN_COMMAND", `不支持的 hook event：${subcommand ?? ""}`);
      }
      const tool = optionString(parsed, "tool") as IntegrationTool | undefined;
      if (!tool || !["codex", "claude-code", "opencode"].includes(tool)) {
        throw new CliError("E_UNKNOWN_COMMAND", "hook --tool 仅支持 codex、claude-code 或 opencode。");
      }
      let input: HookInput = {};
      if (!optionString(parsed, "task") && !stdin.isTTY) {
        let rawInput = "";
        for await (const chunk of stdin) rawInput += String(chunk);
        if (rawInput.trim()) {
          try {
            input = JSON.parse(rawInput) as HookInput;
          } catch {
            throw new CliError("E_HOOK_INPUT", "Hook stdin 不是有效 JSON。");
          }
        }
      }
      return runHook({
        root,
        tool,
        event: subcommand as HookEvent,
        input,
        task: optionString(parsed, "task"),
      });
    }
        case "memory":
    case "skill":
    case "fix-pattern":
      return candidateCommand(root, parsed);
    case "learning":
      if (subcommand === "classify") {
        return classifyLearning(requiredOption(parsed, "task"), requiredOption(parsed, "observation"));
      }
      if (subcommand === "inbox") {
        const task = optionString(parsed, "task");
        const observation = optionString(parsed, "observation");
        return task && observation
          ? createInbox(root, task, observation, parsed.options["dry-run"] === true)
          : { items: await listInbox(root) };
      }
      if (subcommand === "triage") {
        const id = optionString(parsed, "id") ?? rest[0];
        if (!id) throw new CliError("E_INVALID_CANDIDATE", "learning triage 需要提供 inbox ID。");
        return triageInbox(root, id, parsed.options["dry-run"] === true);
      }
      if (subcommand === "analyze") {
        return runBackgroundLearningIfDue(
          root,
          true,
          parsed.options["dry-run"] === true,
        );
      }
      throw new CliError("E_UNKNOWN_COMMAND", `未知的 learning 操作：${subcommand ?? ""}`);
    case "candidate":
      if (subcommand !== "promote") {
        throw new CliError("E_UNKNOWN_COMMAND", "请使用 candidate promote。");
      }
      return promoteCandidate({
        root,
        id: rest[0] ?? requiredOption(parsed, "id"),
        reviewer: optionString(parsed, "reviewer"),
        dryRun: parsed.options["dry-run"] === true,
      });
    case "closure":
      if (subcommand === "status") return closureDiagnostics(root);
      if (subcommand === "recover") {
        return recoverLatestClosure(
          root,
          optionString(parsed, "session-id"),
          parsed.options["dry-run"] === true,
        );
      }
      throw new CliError("E_UNKNOWN_COMMAND", "请使用 closure status 或 closure recover。");
    case "evidence":
      if (subcommand !== "explain") {
        throw new CliError("E_UNKNOWN_COMMAND", "请使用 evidence explain <asset-id>。");
      }
      if (!rest[0]) throw new CliError("E_INVALID_CANDIDATE", "缺少资产 ID。");
      return explainEvidence(root, rest[0]);
    case "lifecycle":
      if (subcommand === "propose") {
        return maintainAssets(root, parsed.options["dry-run"] === true);
      }
      if (subcommand === "apply") {
        if (!rest[0]) throw new CliError("E_INVALID_CANDIDATE", "缺少提案 ID。");
        return applyLifecycleProposal(
          root,
          rest[0],
          optionString(parsed, "reviewer"),
          parsed.options["dry-run"] === true,
        );
      }
      if (subcommand === "list") return { proposals: await listLifecycleProposals(root) };
      if (subcommand === "restore") {
        if (!rest[0]) throw new CliError("E_INVALID_CANDIDATE", "缺少资产 ID。");
        return proposeLifecycleRestore(
          root,
          rest[0],
          parsed.options["dry-run"] === true,
        );
      }
      throw new CliError("E_UNKNOWN_COMMAND", "请使用 lifecycle propose|list|apply|restore。");
    case "explain": {
      if (!subcommand) throw new CliError("E_UNKNOWN_COMMAND", "explain 命令需要提供解释目标。");
      const task = optionString(parsed, "task") ?? rest.join(" ");
      return explain(root, subcommand, task);
    }
    case "health":
      if (subcommand !== "check") throw new CliError("E_UNKNOWN_COMMAND", "请使用 health check。");
      return healthCheck(
        root,
        await listRecurringErrors(root),
        parsed.options.deep === true,
      );
    case "maintain": {
      const dryRun = parsed.options["dry-run"] === true;
      const learning = await runBackgroundLearningIfDue(root, true, dryRun);
      const lifecycle = await maintainAssets(root, dryRun);
      return { ...lifecycle, learning };
    }
    case "import":
      if (subcommand === "scan") return { sources: await scanImportSources(root) };
      if (subcommand === "plan") return { importPlan: await buildImportPlan(root), withoutSecrets: true };
      throw new CliError("E_UNKNOWN_COMMAND", `未知的 import 操作：${subcommand ?? ""}`);
    case "recurring-errors":
      if (subcommand === "list") return { signals: await listRecurringErrors(root) };
      if (subcommand === "analyze") return analyzeRecurringErrors(root, parsed.options["dry-run"] === true);
      if (subcommand === "recommend") return {
        recommendations: await recommendRecurringErrors(root, requiredOption(parsed, "task")),
      };
      if (subcommand === "propose-fix-pattern") {
        const id = rest[0] ?? optionString(parsed, "id");
        if (!id) throw new CliError("E_INVALID_CANDIDATE", "需要提供重复错误 ID。");
        return proposeFromRecurring(root, id, parsed.options["dry-run"] === true);
      }
      throw new CliError("E_UNKNOWN_COMMAND", `未知的 recurring-errors 操作：${subcommand ?? ""}`);
    case "patch":
      if (subcommand !== "create") throw new CliError("E_UNKNOWN_COMMAND", "请使用 patch create。");
      return createPatch(root, parsed.options["dry-run"] === true);
    default:
      throw new CliError("E_UNKNOWN_COMMAND", `未知命令：${command ?? ""}`);
  }
}

async function main(): Promise<void> {
  const raw = process.argv.slice(2);
  let parsed: ParsedArguments;
  try {
    parsed = parseArguments(raw);
  } catch (error) {
    printError(error as CliError, raw.includes("--json"));
    process.exitCode = 1;
    return;
  }
  if (parsed.options.version) {
    console.log(VERSION);
    return;
  }
  if (parsed.options.help || !parsed.positionals.length) {
    console.log(helpText());
    return;
  }

  const json = parsed.options.json === true;
  try {
    const root = await findProjectRoot(process.cwd());
    if (parsed.positionals[0] === "mcp" && parsed.positionals[1] === "stdio") {
      await runMcpServer(root);
      return;
    }
    const result = await dispatch(root, parsed);
    const isHookInvocation = parsed.positionals[0] === "hook";
    if (isHookInvocation) console.log(JSON.stringify(result));
    else if (json) console.log(JSON.stringify(successPayload(result)));
    else printHuman(result);
    if (!isHookInvocation && (result as { ok?: boolean }).ok === false) {
      process.exitCode = 1;
    }
  } catch (error) {
    const cliError =
      error instanceof CliError
        ? error
        : new CliError("E_WRITE_FAILED", (error as Error).message);
    if (parsed.positionals[0] === "hook") {
      console.log(JSON.stringify({
        systemMessage: `repo-agent：Hook 内部错误（${cliError.code}）：${cliError.message}`,
      }));
      return;
    }
    printError(cliError, json);
    process.exitCode = 1;
  }
}

await main();
