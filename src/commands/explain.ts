import { buildContextPack } from "../core/context-builder.js";
import { getCommitOptions } from "../core/commit-policy.js";
import { loadConfig } from "../core/config-loader.js";
import { CliError } from "../errors.js";

export async function explain(
  root: string,
  target: string,
  task = "",
): Promise<Record<string, unknown>> {
  if (target === "context") {
    const context = await buildContextPack(root, task);
    return {
      target,
      task,
      selectedMemories: context.relevantMemories.map((item) => ({
        id: item.id,
        source: item.source,
        reason: item.reason,
      })),
      selectedSkills: context.relevantSkills.map((item) => ({
        id: item.id,
        source: item.source,
        reason: item.reason,
      })),
      selectedFixPatterns: context.recommendedFixPatterns.map((item) => ({
        id: item.id,
        source: item.source,
        reason: item.reason,
      })),
      risk: context.risk,
      candidateRule: "候选内容仅供参考，trusted=false，且不能覆盖已批准资产。",
    };
  }
  if (target === "commit-options") {
    return { target, ...(await getCommitOptions(root, { task })) };
  }
  const config = await loadConfig(root);
  if (target === "config") {
    return {
      target,
      precedence: [
        "safety_baseline",
        "organization_rules",
        "spec_and_adr",
        "policies",
        "commit_policy",
        "config",
        "AGENTS.md",
        "approved_artifacts",
        "candidates",
        "local_config",
        "AI_inference",
      ],
      effective: config.config,
    };
  }
  if (target === "policy") {
    return {
      target,
      protectedFiles: config.protectedFiles.protected_files ?? [],
      dangerousCommands: config.commandPolicy.dangerous_commands ?? [],
      explanation: "受保护文件需要审核或阻止；危险命令将被阻止。",
    };
  }
  throw new CliError("E_UNKNOWN_COMMAND", `未知的 explain 目标：${target}`);
}
