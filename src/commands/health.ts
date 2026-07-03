import { scanProject } from "../core/project-scanner.js";
import { getStatus } from "./status.js";
import { validateProject } from "./validate.js";
import { closureDiagnostics } from "../core/closure-engine.js";
import { exists, listFiles } from "../utils/fs.js";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  readEvidenceEvents,
  summarizeAssetEvidence,
} from "../core/evidence-manager.js";
import { listCandidates } from "../core/candidate-manager.js";
import { loadConfig } from "../core/config-loader.js";

export async function healthCheck(
  root: string,
  recurringErrors: unknown[] = [],
  deep = false,
) {
  const [profile, status, validation, closure, loaded] = await Promise.all([
    scanProject(root),
    getStatus(root),
    validateProject(root, true),
    closureDiagnostics(root),
    loadConfig(root),
  ]);
  const warnings: string[] = [];
  const issues: Array<{
    severity: "error" | "warning" | "advisory";
    code: string;
    message: string;
  }> = [];
  const addIssue = (
    severity: "error" | "warning" | "advisory",
    code: string,
    message: string,
  ) => {
    issues.push({ severity, code, message });
    if (severity !== "advisory") warnings.push(message);
  };
  const good: string[] = [];
  if (profile.process.hasAgents) good.push("已找到 AGENTS.md");
  if (validation.ok) good.push("严格校验通过");
  else {
    addIssue(
      "error",
      "validation_failed",
      `严格校验发现 ${validation.errors.length} 个问题`,
    );
  }
  if (!profile.process.hasSecurity) {
    addIssue("warning", "security_doc_missing", "未检测到 SECURITY.md");
  }
  if (!profile.testCommands.typecheck) {
    addIssue("warning", "typecheck_missing", "未检测到类型检查命令");
  }
  const pending = status.pendingCandidates;
  const pendingTotal = pending.memory + pending.skill + pending.fixPattern;
  if (pendingTotal) {
    addIssue(
      "advisory",
      "candidate_backlog",
      `有 ${pendingTotal} 个候选等待审核`,
    );
  }
  const now = Date.now();
  const terminalStatuses = new Set([
    "closed",
    "retryable_failed",
    "abandoned",
  ]);
  const activeStatuses = new Set([
    "opened",
    "executing",
    "closure_pending",
  ]);
  const terminalClosure = (windowMs: number) => {
    const terminal = closure.receipts.filter(
      (item) =>
        terminalStatuses.has(item.status) &&
        Date.parse(item.openedAt) >= now - windowMs,
    );
    const closed = terminal.filter((item) => item.status === "closed").length;
    return {
      rate: terminal.length ? closed / terminal.length : 1,
      total: terminal.length,
      closed,
    };
  };
  const activePreflights = closure.receipts.filter((item) =>
    activeStatuses.has(item.status)
  );
  const abandonAfterHours =
    loaded.config.closure_policy?.abandon_after_hours ?? 24;
  const overduePreflights = activePreflights.filter((item) => {
    const updatedAt = Date.parse(item.updatedAt);
    return Number.isFinite(updatedAt) &&
      now - updatedAt >= abandonAfterHours * 3_600_000;
  });
  const preflightFiles = deep
    ? (await listFiles(path.join(root, ".repo-agent-runtime", "preflights")))
      .filter((file) => /^preflight\..+\.json$/.test(path.basename(file)))
    : [];
  let estimatedTokens = 0;
  let recalledAssets = 0;
  let unrelatedAssets = 0;
  for (const file of preflightFiles) {
    try {
      const value = JSON.parse(await readFile(file, "utf8")) as {
        contextPack?: { contextBudget?: { estimatedTokens?: number } };
      };
      estimatedTokens += value.contextPack?.contextBudget?.estimatedTokens ?? 0;
      const assets = [
        ...(value.contextPack as { trustedAssets?: Array<{ relevanceScore?: number }> } | undefined)
          ?.trustedAssets ?? [],
        ...(value.contextPack as { untrustedAdvisories?: Array<{ relevanceScore?: number }> } | undefined)
          ?.untrustedAdvisories ?? [],
      ];
      recalledAssets += assets.length;
      unrelatedAssets += assets.filter((item) => (item.relevanceScore ?? 0) < 0.15).length;
    } catch {
      addIssue(
        "error",
        "preflight_corrupt",
        `运行时 Preflight 损坏：${path.basename(file)}`,
      );
    }
  }
  if (closure.eventWarnings.length) {
    addIssue(
      "error",
      "event_integrity",
      `Event Store 发现 ${closure.eventWarnings.length} 个完整性问题`,
    );
  }
  const lockFiles = deep
    ? await listFiles(path.join(root, ".repo-agent-runtime", "locks"))
    : [];
  const staleLocks: string[] = [];
  for (const file of lockFiles) {
    try {
      if (now - (await stat(file)).mtimeMs > 60_000) {
        staleLocks.push(path.relative(root, file).replaceAll("\\", "/"));
      }
    } catch {
      // 并发完成后锁文件可能已正常消失。
    }
  }
  if (staleLocks.length) {
    addIssue(
      "warning",
      "stale_runtime_lock",
      `发现 ${staleLocks.length} 个陈旧运行时锁`,
    );
  }
  const checksumFile = path.join(root, "repo-agent", "CHECKSUMS.txt");
  const checksumProblems: string[] = [];
  if (deep && await exists(checksumFile)) {
    for (const line of (await readFile(checksumFile, "utf8")).trim().split("\n")) {
      const [expected, relative] = line.split(/  /);
      try {
        const actual = createHash("sha256")
          .update(await readFile(path.join(root, "repo-agent", relative)))
          .digest("hex");
        if (actual !== expected) checksumProblems.push(relative);
      } catch {
        checksumProblems.push(relative);
      }
    }
  }
  if (checksumProblems.length) {
    addIssue(
      "error",
      "checksum_mismatch",
      `安装包 Checksum 发现 ${checksumProblems.length} 个问题`,
    );
  }
  if (overduePreflights.length) {
    addIssue(
      "warning",
      "closure_overdue",
      `发现 ${overduePreflights.length} 个超过 ${abandonAfterHours} 小时仍未闭环的 Preflight`,
    );
  }
  const completedSteps = closure.receipts.reduce(
    (sum, item) => sum + item.completedSteps.length,
    0,
  );
  const failedSteps = closure.receipts.reduce(
    (sum, item) => sum + item.failedSteps.length,
    0,
  );
  const closedDurations = closure.receipts
    .filter((item) => item.status === "closed")
    .map((item) => Date.parse(item.updatedAt) - Date.parse(item.openedAt))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const evidenceEvents = await readEvidenceEvents(root);
  const evidenceAssetIds = [...new Set(evidenceEvents.map((item) => item.assetId))];
  const evidenceSummaries = evidenceAssetIds.map((assetId) =>
    summarizeAssetEvidence(
      assetId,
      evidenceEvents,
      now,
      loaded.config.evidence_policy?.freshness_half_life_days ?? 180,
    )
  );
  const allCandidates = (
    await Promise.all(
      (["memory", "skill", "fix_pattern"] as const).map((kind) =>
        listCandidates(root, kind)
      ),
    )
  ).flat();
  const reviewedCandidates = allCandidates.filter(({ candidate }) =>
    ["approved", "rejected"].includes(String(candidate.status))
  );
  const readTimestamp = async (file: string, key: string) => {
    if (!(await exists(file))) return null;
    try {
      return (JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>)[key] ?? null;
    } catch {
      return null;
    }
  };
  const closure24h = terminalClosure(24 * 3_600_000);
  const closure7d = terminalClosure(7 * 24 * 3_600_000);
  const score = Math.max(0, 100 -
    issues.filter((item) => item.severity === "error").length * 20 -
    issues.filter((item) => item.severity === "warning").length * 8);
  return {
    score,
    good,
    warnings,
    advisories: issues
      .filter((item) => item.severity === "advisory")
      .map((item) => item.message),
    issues,
    actions: [
      ...(pendingTotal ? ["审核待处理候选。"] : []),
      ...(!profile.process.hasSecurity ? ["补充 SECURITY.md。"] : []),
      ...(!profile.testCommands.typecheck ? ["补充类型检查命令。"] : []),
      ...(overduePreflights.length
        ? ["执行 closure recover，并检查 Stop Hook 接入。"]
        : []),
    ],
    recurringErrors,
    validation,
    deep,
    metrics: {
      closureRate24h: closure24h.rate,
      closureRate7d: closure7d.rate,
      terminalPreflights24h: closure24h.total,
      terminalPreflights7d: closure7d.total,
      activePreflights: activePreflights.length,
      overduePreflights: overduePreflights.length,
      abandonAfterHours,
      closureSteps: completedSteps,
      closureStepSuccessRate:
        completedSteps + failedSteps
          ? completedSteps / (completedSteps + failedSteps)
          : 1,
      averageClosureDurationMs: closedDurations.length
        ? closedDurations.reduce((sum, item) => sum + item, 0) / closedDurations.length
        : 0,
      failedPreflights: closure.counts.retryable_failed ?? 0,
      abandonedPreflights: closure.counts.abandoned ?? 0,
      orphanedPreflights: Math.max(0, preflightFiles.length - closure.receipts.length),
      tokenEstimate: estimatedTokens,
      unrelatedAssetRecallRate: recalledAssets
        ? unrelatedAssets / recalledAssets
        : 0,
      candidateMisclassificationRate: reviewedCandidates.length
        ? reviewedCandidates.filter(({ candidate }) => candidate.status === "rejected").length /
          reviewedCandidates.length
        : 0,
      weightSaturationRate: evidenceSummaries.length
        ? evidenceSummaries.filter((item) => item.lifecycleHealth >= 0.95).length /
          evidenceSummaries.length
        : 0,
      privateCandidateBacklog: status.candidateCounts?.private ?? 0,
      teamCandidateBacklog: status.candidateCounts?.team ?? 0,
      lifecycleProposalBacklog: status.lifecycleProposals ?? 0,
      eventIntegrityWarnings: closure.eventWarnings,
      staleLocks,
      checksumProblems,
      versionConsistency:
        status.versions?.bundle === status.versions?.schema &&
        status.versions?.bundle === status.versions?.template,
      lastLearningAt: await readTimestamp(
        path.join(root, ".repo-agent-private", "learning", "last-analysis.json"),
        "analyzedAt",
      ),
      lastMaintenanceAt: await readTimestamp(
        path.join(root, ".repo-agent-private", "lifecycle", "maintenance.json"),
        "generatedAt",
      ),
    },
  };
}
