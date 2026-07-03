import { detectCapabilities } from "./capability-detector.js";
import { analyzeRisk } from "./risk-analyzer.js";
import { getChangedFiles } from "../utils/git.js";
import type { CommitAction, CommitOptions } from "../types/policy.js";
import { loadConfig } from "./config-loader.js";
import { matchRepoGlob } from "../utils/path-match.js";

export async function getCommitOptions(
  root: string,
  input: { task?: string; paths?: string[] } = {},
): Promise<CommitOptions> {
  const [capabilities, loaded] = await Promise.all([
    detectCapabilities(root),
    loadConfig(root),
  ]);
  const changedFiles = input.paths?.length ? input.paths : await getChangedFiles(root);
  const risk = await analyzeRisk(root, { task: input.task, paths: changedFiles });
  const reviewPatterns = loaded.commitPolicy.require_review_request_for ?? [];
  const reviewMatches = changedFiles.flatMap((file) =>
    reviewPatterns
      .filter((pattern) => matchRepoGlob(file, pattern))
      .map((pattern) => ({ file, pattern })),
  );
  const documentationOnly =
    changedFiles.length > 0 &&
    changedFiles.every((file) => /(^|\/)(readme[^/]*|docs?\/)|\.md$/i.test(file));
  const testsOnly =
    changedFiles.length > 0 &&
    changedFiles.every((file) => /(^|\/)(tests?|__tests__)(\/|$)|\.(test|spec)\./i.test(file));
  const directCategory = documentationOnly
    ? "docs"
    : testsOnly
      ? "low_risk_tests"
      : risk.level === "low"
        ? "low_risk_code"
        : undefined;
  const directAllowedByPolicy =
    Boolean(directCategory) &&
    (loaded.commitPolicy.allow_direct_commit_for ?? []).includes(directCategory!);
  const effectiveRisk =
    reviewMatches.length > 0 && risk.level !== "blocked" ? "high" : risk.level;
  const reasons = [...risk.reasons];
  if (reviewMatches.length) {
    reasons.push(
      ...reviewMatches.map(
        ({ file, pattern }) =>
          `${file} 命中提交审核策略 ${pattern}。`,
      ),
    );
  }
  if (loaded.commitPolicy.always_ask_before_commit) {
    reasons.push("项目策略要求任何提交前都必须确认。");
  }
  let allowedActions: CommitAction[];
  let recommendedAction: CommitAction;

  if (effectiveRisk === "blocked") {
    allowedActions = ["keep_local"];
    recommendedAction = "keep_local";
  } else if (!capabilities.git) {
    allowedActions = ["keep_local", "create_patch"];
    recommendedAction = effectiveRisk === "low" ? "keep_local" : "create_patch";
  } else if (effectiveRisk === "high") {
    allowedActions = ["keep_local", "create_review_request", "create_patch"];
    recommendedAction = "create_review_request";
  } else if (effectiveRisk === "medium") {
    allowedActions = [
      "keep_local",
      ...(directAllowedByPolicy ? ["direct_commit" as const] : []),
      "create_review_request",
      "create_patch",
    ];
    recommendedAction = "keep_local";
  } else {
    allowedActions = [
      "keep_local",
      ...(directAllowedByPolicy ? ["direct_commit" as const] : []),
      "create_review_request",
      "create_patch",
    ];
    recommendedAction =
      loaded.commitPolicy.default_mode === "keep_local" || !directAllowedByPolicy
        ? "keep_local"
        : "direct_commit";
  }

  const descriptions: Record<CommitAction, string> = {
    keep_local: "保留本地变更，继续验证。",
    direct_commit: "用户明确确认后创建本地提交。",
    create_review_request: "将变更交给仓库审核流程。",
    create_patch: "生成不依赖代码托管平台的可移植补丁。",
  };
  return {
    allowedActions,
    recommendedAction,
    riskLevel: effectiveRisk,
    changedFiles,
    reasons,
    requiredReviewLenses:
      effectiveRisk === "blocked" || effectiveRisk === "high"
        ? [
            ...(input.task && /auth|oauth|security|permission/i.test(input.task)
              ? ["security"]
              : []),
            ...(changedFiles.some((file) => file.includes("database/migrations"))
              ? ["database"]
              : []),
            "testing",
          ]
        : effectiveRisk === "medium"
          ? ["testing"]
          : [],
    options: (Object.keys(descriptions) as CommitAction[]).map((action) => ({
      action,
      available: allowedActions.includes(action),
      reason: descriptions[action],
    })),
  };
}
