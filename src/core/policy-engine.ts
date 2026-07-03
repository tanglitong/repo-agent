import { loadConfig } from "./config-loader.js";
import { matchRepoGlob, normalizeRepoPath } from "../utils/path-match.js";
import type { PolicyCheckResult } from "../types/policy.js";
import path from "node:path";
import { exists } from "../utils/fs.js";
import { readYaml } from "../utils/yaml.js";
import { resolveAssetRoot } from "./asset-root.js";
import {
  getRepoAgentToolByHookId,
  isRepoAgentHookToolId,
} from "./tool-manifest.js";

const sensitivePatterns = [".env*", "*.pem", "*.key", "id_rsa", "id_ed25519", "secrets.*"];

function commandMatches(command: string, pattern: string): boolean {
  const normalized = command.trim().toLowerCase();
  const expression = pattern
    .toLowerCase()
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll("*", ".*");
  return new RegExp(expression).test(normalized);
}

export async function checkPolicy(
  root: string,
  input: { paths?: string[]; command?: string; toolId?: string },
): Promise<PolicyCheckResult> {
  const loaded = await loadConfig(root);
  const reasons: string[] = [];
  const matchedRules: string[] = [];
  let blocked = false;
  let requiresReview = false;

  if (input.toolId) {
    const assetRoot = await resolveAssetRoot(root);
    const registryPath = path.join(assetRoot.path, "tools", "registry.yaml");
    const permissionsPath = path.join(assetRoot.path, "tools", "permissions.yaml");
    const builtin = getRepoAgentToolByHookId(input.toolId);
    if (builtin?.approvalMode === "prompt") {
      requiresReview = true;
      matchedRules.push(`tool_manifest:${builtin.name}:prompt`);
      reasons.push(`工具 ${input.toolId} 需要客户端原生审批。`);
    } else if (!builtin && isRepoAgentHookToolId(input.toolId)) {
      blocked = true;
      matchedRules.push("tool_manifest:unknown_repo_agent_tool");
      reasons.push(`repo-agent 内置工具 ${input.toolId} 未在 Tool Manifest 中声明。`);
    }
    if (await exists(registryPath)) {
      const registry = await readYaml<{ tools?: Array<Record<string, unknown>> }>(registryPath);
      const tool = registry.tools?.find((item) => item.id === input.toolId);
      if (!tool && !builtin && !isRepoAgentHookToolId(input.toolId)) {
        requiresReview = true;
        reasons.push(`工具 ${input.toolId} 未注册。`);
      } else if (tool?.allowed === false) {
        blocked = true;
        reasons.push(`工具 ${input.toolId} 已被注册表禁用。`);
      } else if (tool?.requires_confirmation === true) {
        requiresReview = true;
        reasons.push(`工具 ${input.toolId} 被项目注册表要求确认。`);
      }
    }
    if (await exists(permissionsPath)) {
      const permissions = await readYaml<{ blocked?: string[]; requires_confirmation?: string[] }>(permissionsPath);
      if (permissions.blocked?.includes(input.toolId)) {
        blocked = true;
        reasons.push(`工具 ${input.toolId} 已被工具权限策略阻止。`);
      }
      if (permissions.requires_confirmation?.includes(input.toolId)) {
        requiresReview = true;
        reasons.push(`工具 ${input.toolId} 需要确认后才能使用。`);
      }
    }
  }

  for (const rawPath of input.paths ?? []) {
    const repoPath = normalizeRepoPath(rawPath);
    for (const pattern of loaded.protectedFiles.protected_files ?? []) {
      if (!matchRepoGlob(repoPath, pattern)) continue;
      matchedRules.push(`protected_files:${pattern}`);
      if (sensitivePatterns.includes(pattern)) {
        blocked = true;
        reasons.push(`${repoPath} 命中敏感保护规则 ${pattern}。`);
      } else {
        requiresReview = true;
        reasons.push(`${repoPath} 命中受保护路径规则 ${pattern}。`);
      }
    }
  }
  if (input.command) {
    for (const pattern of loaded.commandPolicy.dangerous_commands ?? []) {
      if (!commandMatches(input.command, pattern)) continue;
      blocked = true;
      matchedRules.push(`dangerous_commands:${pattern}`);
      reasons.push(`命令命中危险命令规则：${pattern}。`);
    }
  }
  if (!reasons.length) reasons.push("未命中阻止或强制审核策略。");
  return {
    allowed: !blocked,
    requiresReview: requiresReview || blocked,
    blocked,
    reasons,
    matchedRules,
  };
}
