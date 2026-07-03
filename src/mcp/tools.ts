import { buildContextPack } from "../core/context-builder.js";
import { checkPolicy } from "../core/policy-engine.js";
import { getCommitOptions } from "../core/commit-policy.js";
import { scanProject } from "../core/project-scanner.js";
import {
  listApproved,
  proposeCandidate,
  detectDuplicateCandidates,
  promoteCandidate,
  type CandidateKind,
} from "../core/candidate-manager.js";
import { classifyLearning } from "../core/learning-router.js";
import { recordTrace } from "../core/audit-writer.js";
import { CliError } from "../errors.js";
import { redactSecrets } from "../core/secret-redactor.js";
import { localPolicyConflicts } from "../core/conflict-resolver.js";
import { generatePatchSummary } from "../core/patch-writer.js";
import {
  readLatestPreflight,
  recordRuntimeActivity,
} from "../core/hook-runtime.js";
import { resolveLocalConfigPath } from "../core/asset-root.js";
import { exists } from "../utils/fs.js";
import { readYaml } from "../utils/yaml.js";
import {
  analyzeRecurringErrors,
  listRecurringErrors,
  proposeFromRecurring,
  recommendRecurringErrors,
} from "../core/recurring-error-detector.js";
import { closureDiagnostics } from "../core/closure-engine.js";
import { recoverLatestClosure } from "../core/hook-runtime.js";
import { explainEvidence } from "../core/evidence-manager.js";
import { healthCheck } from "../commands/health.js";
import type { RepoAgentToolName } from "../core/tool-manifest.js";

type Params = Record<string, unknown>;

function requiredString(params: Params, name: string): string {
  const value = params[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new CliError("E_INVALID_CANDIDATE", `参数 ${name} 必须是非空字符串。`);
  }
  return value;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function propose(root: string, kind: CandidateKind, params: Params) {
  const valueName = kind === "memory" ? "content" : kind === "skill" ? "description" : "pattern";
  return proposeCandidate({
    root,
    kind,
    id: requiredString(params, "id"),
    value: requiredString(params, valueName),
    task: typeof params.task === "string" ? params.task : undefined,
    scope: stringArray(params.scope),
    dryRun: params.dryRun === true,
  });
}

type ToolHandler = (root: string, params: Params) => unknown | Promise<unknown>;

const toolHandlers = {
  get_context_pack: (root, params) =>
    buildContextPack(
      root,
      requiredString(params, "task"),
      params.executionEnvironment &&
          typeof params.executionEnvironment === "object"
        ? params.executionEnvironment as Record<string, unknown>
        : undefined,
    ),
  get_latest_preflight: (root, params) =>
    readLatestPreflight(
      root,
      typeof params.sessionId === "string" ? params.sessionId : undefined,
    ),
  get_closure_status: (root) => closureDiagnostics(root),
  recover_closure: (root, params) =>
    recoverLatestClosure(
      root,
      typeof params.sessionId === "string" ? params.sessionId : undefined,
      params.dryRun === true,
    ),
  get_asset_evidence: (root, params) =>
    explainEvidence(root, requiredString(params, "assetId")),
  search_assets: async (root, params) => {
    const pack = await buildContextPack(root, requiredString(params, "task"));
    return {
      trustedAssets: pack.trustedAssets,
      untrustedAdvisories: pack.untrustedAdvisories,
    };
  },
  promote_candidate: (root, params) =>
    promoteCandidate({
      root,
      id: requiredString(params, "candidateId"),
      reviewer: typeof params.reviewer === "string"
        ? params.reviewer
        : undefined,
      dryRun: params.dryRun === true,
    }),
  get_health_metrics: async (root) =>
    healthCheck(root, await listRecurringErrors(root), true),
  check_policy: (root, params) =>
    checkPolicy(root, {
      paths: stringArray(params.paths),
      command: typeof params.command === "string"
        ? params.command
        : undefined,
      toolId: typeof params.toolId === "string" ? params.toolId : undefined,
    }),
  recommend_tests: async (root) => {
    const profile = await scanProject(root);
    return {
      tests: Object.values(profile.testCommands).filter(Boolean),
      warning: profile.testCommands.unit ? null : "未检测到测试命令。",
    };
  },
  get_commit_options: async (root, params) => {
    const result = await getCommitOptions(root, {
      task: typeof params.task === "string" ? params.task : undefined,
      paths: stringArray(params.paths),
    });
    if (typeof params.sessionId === "string") {
      await recordRuntimeActivity(root, params.sessionId, "get_commit_options");
    }
    return result;
  },
  propose_memory: (root, params) => propose(root, "memory", params),
  propose_skill: (root, params) => propose(root, "skill", params),
  propose_fix_pattern: (root, params) =>
    propose(root, "fix_pattern", params),
  classify_learning: (_root, params) =>
    classifyLearning(
      requiredString(params, "task"),
      requiredString(params, "observation"),
    ),
  record_trace: async (root, params) => {
    const result = await recordTrace(root, params);
    if (typeof params.sessionId === "string") {
      await recordRuntimeActivity(root, params.sessionId, "record_trace");
    }
    return result;
  },
  list_skills: (root) => listApproved(root, "skill"),
  list_fix_patterns: (root) => listApproved(root, "fix_pattern"),
  list_recurring_errors: (root) => listRecurringErrors(root),
  analyze_recurring_errors: (root, params) =>
    analyzeRecurringErrors(root, params.dryRun === true),
  recommend_for_recurring_errors: (root, params) =>
    recommendRecurringErrors(root, requiredString(params, "task")),
  propose_fix_pattern_from_recurring_error: (root, params) =>
    proposeFromRecurring(
      root,
      requiredString(params, "id"),
      params.dryRun === true,
    ),
  detect_duplicates: async (root) => ({
    duplicates: await detectDuplicateCandidates(root),
  }),
  redact_secrets: (_root, params) => ({
    redacted: redactSecrets(requiredString(params, "input")),
  }),
  resolve_conflicts: async (root) => {
    const localPath = await resolveLocalConfigPath(root);
    const local = await exists(localPath)
      ? await readYaml<Record<string, unknown>>(localPath)
      : {};
    return {
      conflicts: [
        ...localPolicyConflicts(local),
        ...(await detectDuplicateCandidates(root)).map((duplicate) => ({
          type: "candidate_duplicate",
          winner: "manual_review",
          loser: duplicate.sources.join(", "),
          reason: `有多个候选指向 ${duplicate.id}。`,
          suggestedAction: "manual_review",
        })),
      ],
    };
  },
  generate_patch_summary: (root) => generatePatchSummary(root),
} satisfies Record<RepoAgentToolName, ToolHandler>;

export async function invokeTool(
  root: string,
  method: string,
  params: Params = {},
) {
  const handler = toolHandlers[method as RepoAgentToolName];
  if (!handler) {
    throw new CliError("E_UNKNOWN_COMMAND", `未知的 MCP 工具：${method}`);
  }
  return handler(root, params);
}
