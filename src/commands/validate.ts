import path from "node:path";
import { exists, listFiles } from "../utils/fs.js";
import { readYaml } from "../utils/yaml.js";
import { readFile } from "node:fs/promises";
import { containsPossibleSecret } from "../core/secret-redactor.js";
import { localPolicyConflicts } from "../core/conflict-resolver.js";
import { normalizeRepoPath } from "../utils/path-match.js";
import {
  relativeAssetPath,
  privateAssetPath,
  resolveAssetRoot,
  resolveLocalConfigPath,
} from "../core/asset-root.js";
import { validateHookRoutesConfig } from "../core/hook-router.js";
import { CliError } from "../errors.js";
import { validateWithSchema } from "../core/schema-validator.js";
import {
  getRepoAgentToolByHookId,
  isRepoAgentHookToolId,
} from "../core/tool-manifest.js";

export interface ValidationIssue {
  code: string;
  path?: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  command: "validate";
  mode: "normal" | "strict";
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export async function validateProject(root: string, strict = false): Promise<ValidationResult> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const assetRoot = await resolveAssetRoot(root);
  const agentRoot = assetRoot.path;
  const asset = (...segments: string[]) => relativeAssetPath(assetRoot, ...segments);
  const requiredDirectories = [
    asset("policies"),
    asset("memories"),
    asset("skills", "approved"),
    asset("fix_patterns", "approved"),
  ];
  if (!(await exists(agentRoot))) {
    return {
      ok: false,
      command: "validate",
      mode: strict ? "strict" : "normal",
      errors: [{
        code: "E_PROJECT_NOT_INITIALIZED",
        path: assetRoot.name,
        message: "项目尚未初始化。",
      }],
      warnings,
    };
  }

  const requiredFiles = [
    asset("config.yaml"),
    asset("commit_policy.yaml"),
    asset("lock.yaml"),
    asset("policies", "protected_files.yaml"),
    asset("policies", "command_policy.yaml"),
    asset("policies", "permissions.yaml"),
    asset("hooks", "routes.yaml"),
    asset("tools", "registry.yaml"),
    asset("tools", "permissions.yaml"),
  ];
  for (const relativePath of requiredFiles) {
    const file = path.join(root, relativePath);
    if (!(await exists(file))) {
      errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "缺少必需文件。" });
      continue;
    }
    try {
      const value = await readYaml<Record<string, unknown>>(file);
      const schemaName = relativePath === asset("config.yaml")
        ? "config.schema.json"
        : relativePath === asset("commit_policy.yaml")
          ? "commit_policy.schema.json"
          : relativePath.endsWith("hooks/routes.yaml")
            ? "hook_routes.schema.json"
            : relativePath.includes("/policies/")
              ? "policy.schema.json"
              : undefined;
      if (schemaName) await validateWithSchema(root, schemaName, value);
      const validVersion = value?.version === 1;
      if (!value || !validVersion) {
        errors.push({
          code: "E_CONFIG_SCHEMA",
          path: relativePath,
          message: "version 必须为 1。",
        });
      }
      if (
        relativePath === asset("config.yaml") &&
        (value.mode !== "team" && value.mode !== "personal")
      ) {
        errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "mode 只能是 team 或 personal。" });
      }
      if (relativePath === asset("config.yaml")) {
        const network = value.network as Record<string, unknown> | undefined;
        const networkModes = ["offline", "internal_only", "explicit_allow", "unrestricted"];
        if (!networkModes.includes(String(network?.mode ?? ""))) {
          errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "network.mode 无效。" });
        }
        const audit = value.audit as Record<string, unknown> | undefined;
        if (typeof audit?.write_to !== "string") {
          errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "缺少 audit.write_to。" });
        } else {
          try {
            normalizeRepoPath(audit.write_to);
          } catch {
            errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "audit.write_to 必须位于仓库内部。" });
          }
        }
      }
      if (
        relativePath === asset("commit_policy.yaml") &&
        (value.default_mode !== "ask" && value.default_mode !== "keep_local")
      ) {
        errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "default_mode 无效。" });
      }
      if (
        relativePath.endsWith("protected_files.yaml") &&
        !Array.isArray(value.protected_files)
      ) {
        errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "protected_files 必须是数组。" });
      }
      if (
        relativePath.endsWith("command_policy.yaml") &&
        !Array.isArray(value.dangerous_commands)
      ) {
        errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "dangerous_commands 必须是数组。" });
      }
      if (relativePath.endsWith("hooks/routes.yaml")) {
        validateHookRoutesConfig(value);
      }
      if (relativePath.endsWith("tools/registry.yaml")) {
        const tools = value.tools;
        if (!Array.isArray(tools)) {
          errors.push({
            code: "E_TOOL_REGISTRY",
            path: relativePath,
            message: "tools 必须是数组。",
          });
        } else {
          const seen = new Set<string>();
          for (const entry of tools) {
            const tool = entry && typeof entry === "object"
              ? entry as Record<string, unknown>
              : {};
            const id = typeof tool.id === "string" ? tool.id : "";
            if (!id) {
              errors.push({
                code: "E_TOOL_REGISTRY",
                path: relativePath,
                message: "工具注册项必须包含非空 id。",
              });
              continue;
            }
            if (seen.has(id)) {
              errors.push({
                code: "E_TOOL_REGISTRY",
                path: relativePath,
                message: `工具 id 重复：${id}。`,
              });
            }
            seen.add(id);
            if (
              isRepoAgentHookToolId(id) &&
              !getRepoAgentToolByHookId(id)
            ) {
              errors.push({
                code: "E_TOOL_MANIFEST_DRIFT",
                path: relativePath,
                message: `repo-agent 工具未在 Tool Manifest 中声明：${id}。`,
              });
            }
          }
        }
      }
      if (
        relativePath.endsWith("tools/permissions.yaml") &&
        (
          !Array.isArray(value.blocked) ||
          !Array.isArray(value.requires_confirmation)
        )
      ) {
        errors.push({
          code: "E_TOOL_PERMISSIONS",
          path: relativePath,
          message: "blocked 和 requires_confirmation 必须是数组。",
        });
      }
    } catch (error) {
      errors.push({
        code: error instanceof CliError ? error.code : "E_CONFIG_PARSE",
        path: relativePath,
        message: (error as Error).message,
      });
    }
  }
  for (const relativePath of requiredDirectories) {
    if (!(await exists(path.join(root, relativePath)))) {
      errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "缺少必需目录。" });
    }
  }

  const policyFiles = (await listFiles(path.join(agentRoot, "policies"))).filter((file) =>
    /\.ya?ml$/i.test(file),
  );
  if (!policyFiles.length) {
    warnings.push({ code: "W_NO_POLICIES", path: asset("policies"), message: "未找到策略文件。" });
  }

  const candidateDirectories = [
    path.join(root, asset("memory_candidates")),
    path.join(root, asset("skills", "candidates")),
    path.join(root, asset("fix_patterns", "candidates")),
    privateAssetPath(root, "memory_candidates"),
    privateAssetPath(root, "skills", "candidates"),
    privateAssetPath(root, "fix_patterns", "candidates"),
  ];
  const allowedStatuses = new Set([
    "candidate",
    "validated",
    "team_proposed",
    "approved",
    "rejected",
    "quarantined",
    "superseded",
    "merged",
    "stale",
    "archived",
  ]);
  for (const directory of candidateDirectories) {
    const files = (await listFiles(directory)).filter((file) => /\.ya?ml$/i.test(file));
    for (const file of files) {
      const relativePath = path.relative(root, file).replaceAll("\\", "/");
      try {
        if (strict && containsPossibleSecret(await readFile(file, "utf8"))) {
          errors.push({ code: "E_SECRET_DETECTED", path: relativePath, message: "候选内容可能包含敏感信息。" });
        }
        const candidate = await readYaml<Record<string, unknown>>(file);
        const candidateSchema = candidate.type === "memory"
          ? "memory_candidate.schema.json"
          : candidate.type === "skill"
            ? "skill_candidate.schema.json"
            : candidate.type === "fix_pattern"
              ? "fix_pattern_candidate.schema.json"
              : undefined;
        if (candidateSchema) {
          await validateWithSchema(root, candidateSchema, candidate);
        }
        const required = ["id", "candidate_id", "status", "evidence", "review", "score", "proposed_by", "created_at"];
        const missing = required.filter((key) => candidate[key] === undefined);
        const type = String(candidate.type ?? "");
        if (
          (type === "memory" && typeof candidate.content !== "string") ||
          (type === "skill" &&
            (typeof candidate.description !== "string" || !Array.isArray(candidate.steps))) ||
          (type === "fix_pattern" &&
            (typeof candidate.pattern !== "string" || typeof candidate.recommendation !== "string")) ||
          !["memory", "skill", "fix_pattern"].includes(type)
        ) {
          missing.push("类型对应的内容字段");
        }
        if (
          !candidate.evidence ||
          typeof candidate.evidence !== "object" ||
          !candidate.review ||
          typeof candidate.review !== "object" ||
          !candidate.score ||
          typeof candidate.score !== "object"
        ) {
          missing.push("结构化 evidence/review/score");
        }
        if (missing.length || !allowedStatuses.has(String(candidate.status))) {
          errors.push({
            code: "E_INVALID_CANDIDATE",
            path: relativePath,
            message: missing.length
              ? `缺少必需字段：${missing.join("、")}。`
              : `候选状态无效：${String(candidate.status)}。`,
          });
        }
      } catch (error) {
        errors.push({
          code: error instanceof CliError ? error.code : "E_CONFIG_PARSE",
          path: relativePath,
          message: (error as Error).message,
        });
      }
    }
  }
  if (strict) {
    const formalConfigFiles = [
      asset("config.yaml"),
      asset("commit_policy.yaml"),
      asset("lock.yaml"),
      ...(await listFiles(path.join(assetRoot.path, "policies"))).map((file) =>
        path.relative(root, file).replaceAll("\\", "/"),
      ),
    ];
    for (const relativePath of formalConfigFiles) {
      const file = path.join(root, relativePath);
      if (await exists(file) && containsPossibleSecret(await readFile(file, "utf8"))) {
        errors.push({
          code: "E_SECRET_DETECTED",
          path: relativePath,
          message: "正式配置可能包含敏感信息。",
        });
      }
    }
    const artifactDirectories = [
      path.join(root, asset("skills", "approved")),
      path.join(root, asset("fix_patterns", "approved")),
    ];
    const seenIds = new Map<string, Partial<Record<"candidate" | "approved", string>>>();
    const seenCandidateFingerprints = new Map<string, string>();
    const indexedFiles = [
      ...(await Promise.all(
        [...candidateDirectories, ...artifactDirectories].map((directory) =>
          listFiles(directory),
        ),
      )).flat(),
    ].filter((file) => /\.ya?ml$/i.test(file) && !file.endsWith("error_aliases.yaml"));
    for (const file of indexedFiles) {
      const relativePath = path.relative(root, file).replaceAll("\\", "/");
      try {
        const raw = await readFile(file, "utf8");
        if (containsPossibleSecret(raw)) {
          errors.push({ code: "E_SECRET_DETECTED", path: relativePath, message: "已批准资产或候选资产可能包含敏感信息。" });
        }
        const artifact = await readYaml<Record<string, unknown>>(file);
        const id = typeof artifact.id === "string" ? artifact.id : undefined;
        const assetClass = relativePath.includes("/candidates/") ||
          relativePath.includes("/memory_candidates/")
          ? "candidate"
          : "approved";
        if (!id) {
          errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "资产必须包含 id。" });
        } else if (
          seenIds.get(id)?.[assetClass] &&
          !(
            assetClass === "candidate" &&
            typeof artifact.fingerprint === "string" &&
            seenCandidateFingerprints.get(id) === artifact.fingerprint
          )
        ) {
          errors.push({
            code: "E_DUPLICATE_CANDIDATE",
            path: relativePath,
            message: `同类资产 id ${id} 重复；首次出现于 ${seenIds.get(id)?.[assetClass]}。`,
          });
        } else {
          seenIds.set(id, { ...(seenIds.get(id) ?? {}), [assetClass]: relativePath });
          if (assetClass === "candidate" && typeof artifact.fingerprint === "string") {
            seenCandidateFingerprints.set(id, artifact.fingerprint);
          }
        }
        if (relativePath.includes("/skills/approved/")) {
          await validateWithSchema(root, "skill.schema.json", artifact);
          if (
            artifact.status !== "approved" ||
            !Array.isArray(artifact.steps) ||
            artifact.steps.length === 0
          ) {
            errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "已批准 skill 必须满足 status=approved 且 steps 非空。" });
          }
        }
        if (relativePath.includes("/fix_patterns/approved/")) {
          await validateWithSchema(root, "fix_pattern.schema.json", artifact);
          if (
            artifact.status !== "approved" ||
            !Array.isArray(artifact.patterns) ||
            !Array.isArray(artifact.guidance) ||
            artifact.patterns.length === 0 ||
            artifact.guidance.length === 0
          ) {
            errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "已批准 fix pattern 必须包含 status=approved、patterns 和 guidance。" });
          }
        }
      } catch (error) {
        errors.push({
          code: error instanceof CliError ? error.code : "E_CONFIG_PARSE",
          path: relativePath,
          message: (error as Error).message,
        });
      }
    }
    for (const file of await listFiles(path.join(assetRoot.path, "memories"))) {
      if (!/\.md$/i.test(file)) continue;
      const relativePath = path.relative(root, file).replaceAll("\\", "/");
      if (containsPossibleSecret(await readFile(file, "utf8"))) {
        errors.push({ code: "E_SECRET_DETECTED", path: relativePath, message: "已批准 memory 可能包含敏感信息。" });
      }
    }
    const aliasesPath = path.join(assetRoot.path, "fix_patterns", "error_aliases.yaml");
    if (await exists(aliasesPath)) {
      try {
        const aliases = await readYaml<Record<string, unknown>>(aliasesPath);
        if (aliases.version !== 1 || !aliases.aliases || typeof aliases.aliases !== "object") {
          errors.push({ code: "E_CONFIG_SCHEMA", path: asset("fix_patterns", "error_aliases.yaml"), message: "错误别名配置必须包含 version=1 和 aliases 映射。" });
        }
      } catch (error) {
        errors.push({ code: "E_CONFIG_PARSE", path: asset("fix_patterns", "error_aliases.yaml"), message: (error as Error).message });
      }
    }
    const tombstonedIds = new Set<string>();
    for (const file of await listFiles(path.join(assetRoot.path, "tombstones"))) {
      if (!/\.ya?ml$/i.test(file)) continue;
      try {
        const value = await readYaml<Record<string, unknown>>(file);
        if (typeof value.asset_id === "string") tombstonedIds.add(value.asset_id);
      } catch (error) {
        errors.push({
          code: "E_CONFIG_PARSE",
          path: path.relative(root, file).replaceAll("\\", "/"),
          message: (error as Error).message,
        });
      }
    }
    for (const id of tombstonedIds) {
      if (seenIds.get(id)?.approved) {
        errors.push({
          code: "E_UPGRADE_CONFLICT",
          path: seenIds.get(id)?.approved,
          message: `资产 ${id} 已有 Tombstone，禁止旧分支重新引入。`,
        });
      }
    }
    const localPath = await resolveLocalConfigPath(root);
    const localRelativePath = path.relative(root, localPath).replaceAll("\\", "/");
    if (await exists(localPath)) {
      try {
        const local = await readYaml<Record<string, unknown>>(localPath);
        const conflicts = localPolicyConflicts(local);
        if (conflicts.length) {
          errors.push({
            code: "E_LOCAL_CONFIG_RELAXES_POLICY",
            path: localRelativePath,
            message: conflicts.map((conflict) => conflict.reason).join(" "),
          });
        }
      } catch (error) {
        errors.push({ code: "E_CONFIG_PARSE", path: localRelativePath, message: (error as Error).message });
      }
    }
  }
  return {
    ok: errors.length === 0,
    command: "validate",
    mode: strict ? "strict" : "normal",
    errors,
    warnings,
  };
}
