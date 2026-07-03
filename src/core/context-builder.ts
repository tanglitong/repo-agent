import path from "node:path";
import { readFile } from "node:fs/promises";
import { scanProject } from "./project-scanner.js";
import { detectCapabilities } from "./capability-detector.js";
import { loadConfig } from "./config-loader.js";
import {
  readCandidateSuggestions,
  readFixPatterns,
  readMemories,
  readSkills,
} from "./asset-reader.js";
import { analyzeRisk } from "./risk-analyzer.js";
import { listFiles } from "../utils/fs.js";
import { redactSecrets } from "./secret-redactor.js";
import type { ContextItem, ContextPack } from "../types/context.js";
import { recommendRecurringErrors } from "./recurring-error-detector.js";
import { evaluateMemory } from "./memory-gate.js";
import { resolveAssetRoot } from "./asset-root.js";

async function readInstructions(root: string): Promise<ContextItem[]> {
  const assetRoot = await resolveAssetRoot(root);
  const files = [
    path.join(assetRoot.path, "config.yaml"),
    path.join(assetRoot.path, "hooks", "routes.yaml"),
    ...(await listFiles(path.join(assetRoot.path, "policies"))).filter((file) =>
      /\.ya?ml$/i.test(file),
    ),
  ];
  const items: ContextItem[] = [];
  for (const file of files) {
    try {
      items.push({
        source: path.relative(root, file).replaceAll("\\", "/"),
        trusted: true,
        content: redactSecrets(await readFile(file, "utf8")),
        reason: "仓库正式事实源。",
      });
    } catch {
      // Optional instruction sources are represented by warnings elsewhere.
    }
  }
  return items;
}

export async function buildContextPack(
  root: string,
  task: string,
  executionEnvironment?: Record<string, unknown>,
): Promise<ContextPack> {
  const [projectProfile, capabilities, loaded] = await Promise.all([
    scanProject(root),
    detectCapabilities(root),
    loadConfig(root),
  ]);
  const includeCandidates =
    loaded.config.context?.include_candidate_suggestions ?? true;
  const candidateLimit = Math.min(
    loaded.config.context?.max_candidate_suggestions ?? 1,
    1,
  );
  const [
    relevantInstructions,
    relevantMemories,
    relevantSkills,
    recommendedFixPatterns,
    candidateSuggestions,
    recurringRecommendations,
    risk,
  ] = await Promise.all([
    readInstructions(root),
    readMemories(root, task),
    readSkills(root, task),
    readFixPatterns(root, task),
    includeCandidates
      ? readCandidateSuggestions(root, task, candidateLimit)
      : Promise.resolve([]),
    loaded.config.recurring_error_policy?.include_in_context === false
      ? Promise.resolve([])
      : recommendRecurringErrors(root, task),
    analyzeRisk(root, { task, executionEnvironment }),
  ]);
  const maxItems = loaded.config.context?.max_items;
  const truncatedItems: string[] = [];
  const limit = (items: ContextItem[], maximum: number | undefined, label: string) => {
    if (maximum === undefined || items.length <= maximum) return items;
    truncatedItems.push(...items.slice(maximum).map((item) => item.id ?? `${label}:${item.source}`));
    return items.slice(0, maximum);
  };
  const minRelevance = loaded.config.context?.min_relevance ?? 0.15;
  const relevant = (item: ContextItem) =>
    (item.relevanceScore ?? 0) >= minRelevance;
  const diverse = (items: ContextItem[]) => {
    const selected: ContextItem[] = [];
    for (const item of items) {
      const words = new Set(
        item.content.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean),
      );
      const duplicate = selected.some((current) => {
        const currentWords = new Set(
          current.content.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean),
        );
        const intersection = [...words].filter((word) => currentWords.has(word)).length;
        const union = new Set([...words, ...currentWords]).size;
        return union > 0 && intersection / union >= 0.85;
      });
      if (!duplicate) selected.push(item);
    }
    return selected;
  };
  const admittedMemories = relevantMemories.filter((memory) =>
    evaluateMemory(memory).admitted && relevant(memory)
  );
  const limitedMemories = limit(diverse(admittedMemories), maxItems?.memories ?? 8, "memory");
  const limitedSkills = limit(
    diverse(relevantSkills.filter((item) =>
      (item.finalWeight ?? 0.8) >= 0.3 && relevant(item)
    )),
    maxItems?.skills ?? 4,
    "skill",
  );
  const limitedFixes = limit(
    diverse(recommendedFixPatterns.filter((item) =>
      (item.finalWeight ?? 0.7) >= 0.3 && relevant(item)
    )),
    maxItems?.fix_patterns ?? 4,
    "fix",
  );
  const limitedCandidates = limit(
    candidateSuggestions.filter(relevant),
    maxItems?.candidate_suggestions ?? candidateLimit,
    "candidate",
  );
  const maxChars = loaded.config.context?.budget?.max_chars ?? 24000;
  const maxTokensEstimate =
    loaded.config.context?.budget?.max_tokens_estimate ?? 6000;
  const allItems = [
    ...relevantInstructions,
    ...limitedMemories,
    ...limitedSkills,
    ...limitedFixes,
    ...limitedCandidates,
  ];
  const fixedContextChars = JSON.stringify({
    task,
    projectProfile,
    capabilities,
    recurringRecommendations,
    executionEnvironment,
    risk,
  }).length;
  const estimatedChars =
    allItems.reduce((sum, item) => sum + item.content.length, 0) +
    fixedContextChars;
  const estimateTokens = () => {
    const serialized = JSON.stringify({
      task,
      projectProfile,
      capabilities,
      recurringRecommendations,
      executionEnvironment,
      risk,
      items: allItems,
    });
    const cjk = [...serialized.matchAll(/[\p{Script=Han}]/gu)].length;
    const latin = serialized.length - cjk;
    return Math.ceil((cjk + Math.ceil(latin / 4)) * 1.2);
  };
  let estimatedTokens = estimateTokens();
  const removablePools = [
    limitedCandidates,
    limitedFixes,
    limitedSkills,
    limitedMemories,
  ];
  for (const pool of removablePools) {
    while (estimatedTokens > maxTokensEstimate && pool.length) {
      const removed = pool.pop()!;
      truncatedItems.push(removed.id ?? removed.source);
      const index = allItems.indexOf(removed);
      if (index >= 0) allItems.splice(index, 1);
      estimatedTokens = estimateTokens();
    }
  }
  const trustedInstructionsExceedBudget =
    estimatedChars > maxChars || estimatedTokens > maxTokensEstimate;

  const recommendedTests = Object.values(projectProfile.testCommands).filter(
    (command): command is string => Boolean(command),
  );
  const warnings: string[] = [];
  const assetRoot = await resolveAssetRoot(root);
  warnings.push(...assetRoot.warnings);
  if (!capabilities.testCommands) warnings.push("未检测到测试命令。");
  if (!capabilities.openspec) warnings.push("OpenSpec 不可用，将使用后备流程。");
  if (!capabilities.git) warnings.push("Git 不可用，提交建议将采用安全降级模式。");
  if (trustedInstructionsExceedBudget) {
    warnings.push(
      "强制策略和基础治理元数据超过上下文预算；可信指令已完整保留。",
    );
  }
  const summarizeApproved = (item: ContextItem): ContextItem => ({
    ...item,
    content: item.content.length > 800
      ? `${item.content.slice(0, 800)}\n…（已按默认摘要策略截断）`
      : item.content,
  });
  const summarizedMemories = limitedMemories.map(summarizeApproved);
  const summarizedSkills = limitedSkills.map(summarizeApproved);
  const summarizedFixes = limitedFixes.map(summarizeApproved);
  const trustedAssets = [
    ...summarizedMemories,
    ...summarizedSkills,
    ...summarizedFixes,
  ];

  return {
    task,
    projectProfile,
    capabilities,
    mandatoryInstructions: relevantInstructions,
    trustedAssets,
    untrustedAdvisories: limitedCandidates,
    relevantInstructions,
    relevantMemories: summarizedMemories,
    relevantSkills: summarizedSkills,
    recommendedFixPatterns: summarizedFixes,
    candidateSuggestions: limitedCandidates,
    recurringErrorRecommendations: recurringRecommendations,
    contextBudget: {
      maxChars,
      estimatedChars,
      maxTokensEstimate,
      estimatedTokens,
      truncated: truncatedItems.length > 0,
      exceeded:
        estimatedChars > maxChars ||
        estimatedTokens > maxTokensEstimate,
      truncatedItems,
    },
    executionEnvironment,
    recommendedWorkflow: /security|auth|oauth|permission/i.test(task)
      ? "workflow.security-change"
      : /bug|fix|error|修复|错误/i.test(task)
        ? "workflow.bugfix"
        : "workflow.feature",
    recommendedTests,
    risk,
    policyNotes: [
      `当前网络策略：${loaded.config.network?.mode ?? "offline"}。`,
      "候选内容默认不可信，不能覆盖已批准资产。",
    ],
    conflictNotes: [],
    warnings,
    nextSteps: [
      ...(risk.requiresResearch ? risk.requiredVerifications : []),
      ...(recommendedTests.length ? ["修改完成后运行推荐测试。"] : []),
      "发布变更前获取提交建议。",
    ],
  };
}
