import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  cp,
  mkdir,
  readFile,
  realpath,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { exists, writeFileExclusive } from "../utils/fs.js";
import { normalizeRepoPath } from "../utils/path-match.js";
import { readYaml, stringifyYaml } from "../utils/yaml.js";
import { CliError } from "../errors.js";
import { VERSION } from "../index.js";
import {
  compareVersions,
  loadUpgradePackage,
  resolveMigrationChain,
  type UpgradeMigration,
  type UpgradePackage,
} from "../core/upgrade-package.js";
import { ensureManagedGitignore } from "../core/gitignore-manager.js";
import { validateProject } from "./validate.js";
import { parse } from "yaml";
import { containsPossibleSecret } from "../core/secret-redactor.js";
import { relativeAssetPath, resolveAssetRoot } from "../core/asset-root.js";

const execFileAsync = promisify(execFile);

interface UpgradeLock {
  version?: number;
  repo_agent?: Record<string, unknown>;
  generated_at?: string;
  updated_at?: string;
  applied_migrations?: Array<Record<string, unknown>>;
  managed_assets?: Record<string, Record<string, unknown>>;
  upgrade?: Record<string, unknown>;
}

export interface UpgradePlan {
  ok: true;
  command: "upgrade";
  action: "status" | "plan" | "apply";
  source: string;
  sourceKind: "zip" | "directory";
  currentVersion: string;
  targetVersion: string;
  toolVersion: string;
  upgradeAvailable: boolean;
  migrationChain: string[];
  createDirectories: string[];
  createFiles: string[];
  skippedFiles: string[];
  conflicts: Array<{ path: string; reason: string }>;
  configProposals: Array<{ file: string; path: string; value: unknown }>;
  upgradeCandidates: Array<{
    path: string;
    target: string;
    kind: "skill" | "fix_pattern";
    source: string;
  }>;
  gitignoreAction: string;
  reviewRequired: boolean;
  upgradeState: string;
  pendingReview: string[];
  dirtyGovernanceFiles: string[];
  warnings: string[];
  dryRun?: boolean;
  applied?: boolean;
  runId?: string;
  reportPath?: string;
  journalPath?: string;
  toolStagedPath?: string;
  toolSwitched?: boolean;
  nextCommand?: string;
}

interface Journal {
  runId: string;
  from: string;
  to: string;
  createdFiles: Array<{ path: string; sha256: string }>;
  backups: Array<{ path: string; existed: boolean; contentBase64: string }>;
  createdAt: string;
  status: "completed" | "rolled_back";
  tool?: {
    switched: boolean;
    toolRoot: string;
    backupRoot?: string;
    stagedRoot: string;
  };
}

function sha256(content: Uint8Array | string): string {
  return createHash("sha256").update(content).digest("hex");
}

function currentAssetVersion(lock: UpgradeLock): string {
  const repoAgent = lock.repo_agent ?? {};
  const version = repoAgent.template_version ?? repoAgent.asset_version;
  if (typeof version !== "string") {
    throw new CliError("E_CONFIG_SCHEMA", "lock.yaml 缺少项目资产版本。");
  }
  return version;
}

async function loadLock(root: string): Promise<UpgradeLock> {
  const assetRoot = await resolveAssetRoot(root);
  const lockPath = path.join(assetRoot.path, "lock.yaml");
  if (!(await exists(lockPath))) {
    throw new CliError(
      "E_PROJECT_NOT_INITIALIZED",
      "项目尚未初始化，无法升级。",
      relativeAssetPath(assetRoot, "lock.yaml"),
    );
  }
  return readYaml<UpgradeLock>(lockPath);
}

function nestedValue(value: unknown, dottedPath: string): unknown {
  let current = value;
  for (const part of dottedPath.split(".")) {
    if (!current || typeof current !== "object" || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

async function safeTarget(root: string, relativePath: string): Promise<string> {
  const normalized = normalizeRepoPath(relativePath);
  const target = path.join(root, ...normalized.split("/"));
  const rootReal = await realpath(root);
  let parent = path.dirname(target);
  while (!(await exists(parent))) {
    const next = path.dirname(parent);
    if (next === parent) break;
    parent = next;
  }
  const parentReal = await realpath(parent);
  if (parentReal !== rootReal && !parentReal.startsWith(`${rootReal}${path.sep}`)) {
    throw new CliError("E_UPGRADE_CONFLICT", `升级目标经过符号链接逃逸仓库：${relativePath}`, relativePath);
  }
  return target;
}

async function governanceChanges(root: string): Promise<string[]> {
  const assetRoot = await resolveAssetRoot(root);
  const prefix = `${assetRoot.name}/`;
  if (!(await exists(path.join(root, ".git")))) return [];
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["status", "--porcelain=v1", "-uall"],
      { cwd: root },
    );
    return stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.slice(3).replace(/^"|"$/g, "").replaceAll("\\", "/"))
      .filter((file) =>
        file === "AGENTS.md" ||
        file === ".gitignore" ||
        (file.startsWith(prefix) &&
          !file.startsWith(`${prefix}generated/`) &&
          !file.startsWith(`${prefix}catalog/`)),
      );
  } catch {
    return [];
  }
}

async function inspectMigrations(
  root: string,
  upgradePackage: UpgradePackage,
  migrations: UpgradeMigration[],
) {
  const assetRoot = await resolveAssetRoot(root);
  const activeTarget = (input: string) => normalizeRepoPath(input);
  const createDirectories = new Set<string>();
  const createFiles: string[] = [];
  const skippedFiles: string[] = [];
  const conflicts: Array<{ path: string; reason: string }> = [];
  const configProposals: Array<{ file: string; path: string; value: unknown }> = [];
  const upgradeCandidates: UpgradePlan["upgradeCandidates"] = [];
  for (const migration of migrations) {
    for (const directory of migration.create_dirs ?? []) {
      const normalized = activeTarget(directory);
      if (!(await exists(await safeTarget(root, normalized)))) createDirectories.add(normalized);
    }
    for (const item of migration.add_files_if_missing ?? []) {
      const target = activeTarget(item.target);
      const targetPath = await safeTarget(root, target);
      if (!(await exists(targetPath))) {
        createFiles.push(target);
        continue;
      }
      const current = await readFile(targetPath);
      const incoming = upgradePackage.read(item.source);
      if (sha256(current) === sha256(incoming)) skippedFiles.push(target);
      else if (item.category === "skill" || item.category === "fix_pattern") {
        const incomingText = new TextDecoder().decode(incoming);
        if (containsPossibleSecret(incomingText)) {
          conflicts.push({ path: target, reason: "新版内置资产疑似包含敏感信息，拒绝生成候选。" });
          continue;
        }
        const artifact = parse(incomingText) as Record<string, unknown>;
        const id = String(artifact.id ?? "");
        if (!id) {
          conflicts.push({ path: target, reason: "新版内置资产缺少 id，无法生成升级候选。" });
          continue;
        }
        const slug = id.replaceAll(".", "_").replace(/[^A-Za-z0-9_-]/g, "_");
        const directory = item.category === "skill"
          ? relativeAssetPath(assetRoot, "skills", "candidates")
          : relativeAssetPath(assetRoot, "fix_patterns", "candidates");
        upgradeCandidates.push({
          path: `${directory}/cand_${item.category}_upgrade_${slug}_${migration.to.replaceAll(".", "_")}.yaml`,
          target,
          kind: item.category,
          source: item.source,
        });
      } else {
        conflicts.push({ path: target, reason: "目标文件已存在且内容不同，已保留项目版本。" });
      }
    }
    for (const proposal of migration.config_defaults ?? []) {
      const file = activeTarget(proposal.file);
      const filePath = await safeTarget(root, file);
      if (!(await exists(filePath))) {
        conflicts.push({ path: file, reason: "配置文件不存在，不能自动合并字段。" });
        continue;
      }
      const current = await readYaml<Record<string, unknown>>(filePath);
      if (nestedValue(current, proposal.path) === undefined) {
        configProposals.push({ file, path: proposal.path, value: proposal.value });
      }
    }
  }
  return {
    createDirectories: [...createDirectories].sort(),
    createFiles: [...new Set(createFiles)].sort(),
    skippedFiles: [...new Set(skippedFiles)].sort(),
    conflicts,
    configProposals,
    upgradeCandidates,
  };
}

export async function createUpgradePlan(
  root: string,
  source: string,
  action: "status" | "plan" | "apply" = "plan",
): Promise<{ plan: UpgradePlan; package: UpgradePackage; migrations: UpgradeMigration[]; lock: UpgradeLock }> {
  const [lock, upgradePackage] = await Promise.all([
    loadLock(root),
    loadUpgradePackage(source),
  ]);
  const currentVersion = currentAssetVersion(lock);
  const targetVersion = upgradePackage.manifest.asset_versions.template;
  if (compareVersions(VERSION, upgradePackage.manifest.minimum_upgrader_version) < 0) {
    throw new CliError(
      "E_UPGRADE_PACKAGE_INVALID",
      `当前升级器 ${VERSION} 低于升级包要求的 ${upgradePackage.manifest.minimum_upgrader_version}。`,
    );
  }
  if (compareVersions(targetVersion, currentVersion) < 0) {
    throw new CliError("E_UPGRADE_NOT_AVAILABLE", `不支持从 ${currentVersion} 降级到 ${targetVersion}。`);
  }
  const upgradeAvailable = compareVersions(targetVersion, currentVersion) > 0;
  const migrations = upgradeAvailable
    ? resolveMigrationChain(upgradePackage.migrations, currentVersion, targetVersion)
    : [];
  const inspected = await inspectMigrations(root, upgradePackage, migrations);
  const gitignore = await ensureManagedGitignore(root, true);
  const dirtyGovernanceFiles = await governanceChanges(root);
  const migrationReview = migrations.flatMap((migration) => migration.review_required ?? []);
  const lockUpgrade = lock.upgrade ?? {};
  const pendingReview = Array.isArray(lockUpgrade.pending)
    ? lockUpgrade.pending.map(String)
    : [];
  const reviewRequired =
    inspected.conflicts.length > 0 ||
    inspected.configProposals.length > 0 ||
    inspected.upgradeCandidates.length > 0 ||
    migrationReview.length > 0 ||
    pendingReview.length > 0;
  const warnings = [
    ...(dirtyGovernanceFiles.length
      ? ["检测到未提交的治理资产；升级不会覆盖这些文件，请在升级结果中重点审核。"]
      : []),
    ...(reviewRequired ? ["部分升级内容需要人工审核，工具只应用安全的增量变更。"] : []),
    "CHECKSUMS.txt 只能验证完整性；升级包应来自可信发布渠道。",
  ];
  return {
    package: upgradePackage,
    migrations,
    lock,
    plan: {
      ok: true,
      command: "upgrade",
      action,
      source: upgradePackage.source,
      sourceKind: upgradePackage.kind,
      currentVersion,
      targetVersion,
      toolVersion: upgradePackage.manifest.tool_version,
      upgradeAvailable,
      migrationChain: migrations.map((migration) => migration.id),
      ...inspected,
      gitignoreAction: gitignore.action,
      reviewRequired,
      upgradeState: String(lockUpgrade.state ?? (upgradeAvailable ? "available" : "complete")),
      pendingReview,
      dirtyGovernanceFiles,
      warnings,
    },
  };
}

function reportText(plan: UpgradePlan): string {
  const lines = (values: string[]) => values.map((value) => `- ${value}`).join("\n") || "- 无";
  return `# repo-agent 升级报告

## 版本

- 项目资产：${plan.currentVersion} → ${plan.targetVersion}
- 工具版本：${plan.toolVersion}
- 运行 ID：${plan.runId}

## Migration

${lines(plan.migrationChain)}

## 新增目录

${lines(plan.createDirectories)}

## 新增文件

${lines(plan.createFiles)}

## 保留的已有文件

${lines(plan.skippedFiles)}

## 配置合并建议

${lines(plan.configProposals.map((item) => `${item.file}: ${item.path}`))}

## 生成的升级候选

${lines(plan.upgradeCandidates.map((item) => item.path))}

## 冲突

${lines(plan.conflicts.map((item) => `${item.path}: ${item.reason}`))}

## Git 忽略规则

- ${plan.gitignoreAction}

## 状态

- ${plan.reviewRequired ? "安全增量已应用，仍有内容需要人工审核。" : "升级完成。"}
`;
}

async function backupFile(root: string, relativePath: string) {
  const target = await safeTarget(root, relativePath);
  const fileExists = await exists(target);
  return {
    path: relativePath,
    existed: fileExists,
    contentBase64: fileExists ? (await readFile(target)).toString("base64") : "",
  };
}

function upgradeCandidateContent(
  item: UpgradePlan["upgradeCandidates"][number],
  upgradePackage: UpgradePackage,
  targetVersion: string,
  now: string,
): string {
  const incoming = parse(
    new TextDecoder().decode(upgradePackage.read(item.source)),
  ) as Record<string, unknown>;
  const id = String(incoming.id);
  const common = {
    id,
    candidate_id: `candidate.${item.kind}.upgrade.${targetVersion.replaceAll(".", "-")}.${id.replaceAll(".", "-")}`,
    status: "candidate",
    trusted: false,
    type: item.kind,
    scope: [item.target],
    evidence: {
      task: `repo-agent ${targetVersion} 资产升级`,
      source: "upgrade",
      changed_files: [item.target],
      tests: [],
      audit: "",
      review_request: null,
    },
    review: {
      required: true,
      reviewers: ["codeowners"],
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      merged_into: null,
      review_request: null,
    },
    score: {
      confidence: 1,
      usefulness: 0.5,
      freshness: 1,
      recurrence: 0,
      success_rate: 0,
      final_weight: 0.5,
    },
    proposed_by: "repo-agent-upgrade",
    created_at: now,
  };
  const specific = item.kind === "skill"
    ? {
        description: String(incoming.description ?? `升级 ${id}`),
        steps: Array.isArray(incoming.steps) ? incoming.steps : [`审核 ${id} 的新版内容。`],
      }
    : {
        pattern: Array.isArray(incoming.patterns)
          ? incoming.patterns.map(String).join("\n")
          : String(incoming.pattern ?? id),
        recommendation: Array.isArray(incoming.guidance)
          ? incoming.guidance.map(String).join("\n")
          : String(incoming.recommendation ?? `审核 ${id} 的新版内容。`),
      };
  return stringifyYaml({ ...common, ...specific });
}

async function rollbackInMemory(
  root: string,
  createdFiles: Array<{ path: string; sha256: string }>,
  backups: Array<{ path: string; existed: boolean; contentBase64: string }>,
): Promise<void> {
  for (const item of [...createdFiles].reverse()) {
    const target = await safeTarget(root, item.path);
    if (!(await exists(target))) continue;
    if (sha256(await readFile(target)) === item.sha256) await unlink(target);
  }
  for (const backup of [...backups].reverse()) {
    const target = await safeTarget(root, backup.path);
    if (backup.existed) {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, Buffer.from(backup.contentBase64, "base64"));
    } else if (await exists(target)) {
      await unlink(target);
    }
  }
}

async function writePackageFiles(
  upgradePackage: UpgradePackage,
  destination: string,
): Promise<void> {
  await mkdir(destination, { recursive: true });
  for (const [relativePath, content] of upgradePackage.files) {
    const target = path.join(destination, ...normalizeRepoPath(relativePath).split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}

async function stageToolPackage(
  root: string,
  runId: string,
  upgradePackage: UpgradePackage,
) {
  const version = upgradePackage.manifest.tool_version;
  const stagedRelative = `.repo-agent-runtime/versions/${version}`;
  const stagedRoot = await safeTarget(root, stagedRelative);
  await rm(stagedRoot, { recursive: true, force: true });
  await writePackageFiles(upgradePackage, stagedRoot);
  const stagedBundle = path.join(stagedRoot, "repo-agent.bundle.js");
  const { stdout } = await execFileAsync(process.execPath, [stagedBundle, "--version"], {
    cwd: root,
  });
  if (stdout.trim() !== version) {
    throw new CliError(
      "E_UPGRADE_PACKAGE_INVALID",
      `升级包 bundle 版本 ${stdout.trim()} 与清单版本 ${version} 不一致。`,
    );
  }

  const toolRoot = path.join(root, "repo-agent");
  const invokedBundlePath = path.resolve(process.argv[1] ?? "");
  const invokedBundle = await realpath(invokedBundlePath).catch(() => invokedBundlePath);
  const toolRootResolved = await realpath(toolRoot).catch(() => path.resolve(toolRoot));
  const runningInsideToolRoot =
    invokedBundle === toolRootResolved ||
    invokedBundle.startsWith(`${toolRootResolved}${path.sep}`);
  const installedToolExists = await exists(path.join(toolRoot, "repo-agent.bundle.js"));
  if (!runningInsideToolRoot && !installedToolExists) {
    return {
      switched: false,
      toolRoot: "repo-agent",
      stagedRoot: stagedRelative,
      nextCommand: `node ${stagedRelative}/repo-agent.bundle.js`,
    };
  }

  const backupRelative = `.repo-agent-runtime/backups/${runId}/repo-agent`;
  const backupRoot = await safeTarget(root, backupRelative);
  await rm(backupRoot, { recursive: true, force: true });
  if (await exists(toolRoot)) await cp(toolRoot, backupRoot, { recursive: true, force: true });
  try {
    await writePackageFiles(upgradePackage, toolRoot);
    const switched = await execFileAsync(
      process.execPath,
      [path.join(toolRoot, "repo-agent.bundle.js"), "--version"],
      { cwd: root },
    );
    if (switched.stdout.trim() !== version) {
      throw new Error(`切换后的 bundle 版本为 ${switched.stdout.trim()}`);
    }
  } catch (error) {
    if (await exists(backupRoot)) {
      await rm(toolRoot, { recursive: true, force: true });
      await cp(backupRoot, toolRoot, { recursive: true, force: true });
    }
    throw new CliError("E_WRITE_FAILED", `切换新版工具失败：${(error as Error).message}`);
  }
  return {
    switched: true,
    toolRoot: "repo-agent",
    backupRoot: backupRelative,
    stagedRoot: stagedRelative,
    nextCommand: "node repo-agent/repo-agent.bundle.js",
  };
}

async function restoreTool(root: string, tool: Journal["tool"]): Promise<void> {
  if (!tool?.switched || !tool.backupRoot) return;
  const toolRoot = await safeTarget(root, tool.toolRoot);
  const backupRoot = await safeTarget(root, tool.backupRoot);
  if (!(await exists(backupRoot))) {
    throw new CliError("E_UPGRADE_ROLLBACK_FAILED", "找不到旧工具备份，无法回滚工具版本。");
  }
  await rm(toolRoot, { recursive: true, force: true });
  await cp(backupRoot, toolRoot, { recursive: true, force: true });
}

export async function applyUpgrade(options: {
  root: string;
  source: string;
  dryRun: boolean;
  confirmed: boolean;
}): Promise<UpgradePlan> {
  const assetRoot = await resolveAssetRoot(options.root);
  const activeTarget = (input: string) => normalizeRepoPath(input);
  const prepared = await createUpgradePlan(options.root, options.source, "apply");
  const plan = { ...prepared.plan, dryRun: options.dryRun, applied: false };
  if (!plan.upgradeAvailable) return plan;
  if (options.dryRun) return plan;
  if (!options.confirmed) {
    throw new CliError(
      "E_UPGRADE_CONFIRMATION_REQUIRED",
      "升级计划已生成；请确认后重试，或使用 --yes。",
    );
  }

  const runId = `${Date.now()}-${plan.currentVersion}-to-${plan.targetVersion}`;
  const reportPath = relativeAssetPath(assetRoot, "generated", "upgrades", runId, "upgrade_report.md");
  const journalPath = relativeAssetPath(assetRoot, "generated", "upgrades", runId, "journal.json");
  const createdFiles: Array<{ path: string; sha256: string }> = [];
  const backups = await Promise.all([
    backupFile(options.root, ".gitignore"),
    backupFile(options.root, relativeAssetPath(assetRoot, "lock.yaml")),
  ]);
  let tool: Journal["tool"];
  try {
    for (const directory of plan.createDirectories) {
      await mkdir(await safeTarget(options.root, directory), { recursive: true });
    }
    for (const migration of prepared.migrations) {
      for (const item of migration.add_files_if_missing ?? []) {
        const target = activeTarget(item.target);
        if (!plan.createFiles.includes(target)) continue;
        const targetPath = await safeTarget(options.root, target);
        await mkdir(path.dirname(targetPath), { recursive: true });
        const content = prepared.package.read(item.source);
        const result = await writeFileExclusive(targetPath, content);
        if (result !== "created") {
          throw new CliError("E_UPGRADE_CONFLICT", `升级期间目标文件被创建：${target}`, target);
        }
        createdFiles.push({ path: target, sha256: sha256(content) });
      }
    }
    const now = new Date().toISOString();
    for (const item of plan.upgradeCandidates) {
      const target = await safeTarget(options.root, item.path);
      if (await exists(target)) continue;
      await mkdir(path.dirname(target), { recursive: true });
      const content = upgradeCandidateContent(
        item,
        prepared.package,
        plan.targetVersion,
        now,
      );
      const result = await writeFileExclusive(target, content);
      if (result !== "created") {
        throw new CliError("E_UPGRADE_CONFLICT", `升级候选路径已存在：${item.path}`, item.path);
      }
      createdFiles.push({ path: item.path, sha256: sha256(content) });
    }
    await ensureManagedGitignore(options.root, false);

    const repoAgent = prepared.lock.repo_agent ?? {};
    const appliedMigrations = [
      ...(prepared.lock.applied_migrations ?? []),
      ...prepared.migrations.map((migration) => ({
        id: migration.id,
        from: migration.from,
        to: migration.to,
        applied_at: now,
      })),
    ];
    const nextLock: UpgradeLock = {
      ...prepared.lock,
      version: 1,
      repo_agent: {
        ...repoAgent,
        asset_version: plan.targetVersion,
        template_version: prepared.package.manifest.asset_versions.template,
        schema_version: prepared.package.manifest.asset_versions.schema,
        builtin_policy_version: prepared.package.manifest.asset_versions.builtin_policy,
        builtin_skill_version: prepared.package.manifest.asset_versions.builtin_skill,
        builtin_fix_pattern_version: prepared.package.manifest.asset_versions.builtin_fix_pattern,
      },
      updated_at: now,
      applied_migrations: appliedMigrations,
      managed_assets: {
        ...(prepared.lock.managed_assets ?? {}),
        ...Object.fromEntries(createdFiles.map((item) => [
          item.path,
          { installed_version: plan.targetVersion, installed_sha256: item.sha256 },
        ])),
      },
      upgrade: {
        state: plan.reviewRequired ? "pending_review" : "complete",
        target_version: plan.targetVersion,
        pending: [
          ...plan.configProposals.map((item) => `${item.file}:${item.path}`),
          ...plan.conflicts.map((item) => item.path),
          ...plan.upgradeCandidates.map((item) => item.path),
          ...prepared.migrations.flatMap((migration) => migration.review_required ?? []),
        ],
        run_id: runId,
      },
    };
    await writeFile(
      await safeTarget(options.root, relativeAssetPath(assetRoot, "lock.yaml")),
      stringifyYaml(nextLock),
      "utf8",
    );
    const validation = await validateProject(options.root, true);
    if (!validation.ok) {
      throw new CliError(
        "E_UPGRADE_CONFLICT",
        `升级后严格验证失败：${validation.errors.map((item) => item.message).join(" ")}`,
      );
    }

    const finalPlan: UpgradePlan = {
      ...plan,
      applied: true,
      runId,
      reportPath,
      journalPath,
      upgradeState: plan.reviewRequired ? "pending_review" : "complete",
      pendingReview: [
        ...plan.configProposals.map((item) => `${item.file}:${item.path}`),
        ...plan.conflicts.map((item) => item.path),
        ...plan.upgradeCandidates.map((item) => item.path),
        ...prepared.migrations.flatMap((migration) => migration.review_required ?? []),
      ],
    };
    const reportTarget = await safeTarget(options.root, reportPath);
    await mkdir(path.dirname(reportTarget), { recursive: true });
    await writeFile(reportTarget, reportText(finalPlan), "utf8");
    const stagedTool = await stageToolPackage(
      options.root,
      runId,
      prepared.package,
    );
    tool = {
      switched: stagedTool.switched,
      toolRoot: stagedTool.toolRoot,
      backupRoot: stagedTool.backupRoot,
      stagedRoot: stagedTool.stagedRoot,
    };
    finalPlan.toolStagedPath = stagedTool.stagedRoot;
    finalPlan.toolSwitched = stagedTool.switched;
    finalPlan.nextCommand = stagedTool.nextCommand;
    const journal: Journal = {
      runId,
      from: plan.currentVersion,
      to: plan.targetVersion,
      createdFiles,
      backups,
      createdAt: now,
      status: "completed",
      tool,
    };
    await writeFile(
      await safeTarget(options.root, journalPath),
      `${JSON.stringify(journal, null, 2)}\n`,
      "utf8",
    );
    return finalPlan;
  } catch (error) {
    if (tool?.switched) await restoreTool(options.root, tool);
    await rollbackInMemory(options.root, createdFiles, backups);
    throw error;
  }
}

export async function rollbackUpgrade(root: string, runId: string) {
  if (!/^[0-9]+-[0-9A-Za-z.-]+-to-[0-9A-Za-z.-]+$/.test(runId)) {
    throw new CliError("E_UPGRADE_ROLLBACK_FAILED", "升级运行 ID 无效。");
  }
  const assetRoot = await resolveAssetRoot(root);
  const journalPath = relativeAssetPath(assetRoot, "generated", "upgrades", runId, "journal.json");
  const target = await safeTarget(root, journalPath);
  if (!(await exists(target))) {
    throw new CliError("E_UPGRADE_ROLLBACK_FAILED", `找不到升级日志：${runId}`);
  }
  const journal = JSON.parse(await readFile(target, "utf8")) as Journal;
  if (journal.status !== "completed") {
    throw new CliError("E_UPGRADE_ROLLBACK_FAILED", `升级 ${runId} 已回滚或状态无效。`);
  }
  for (const item of journal.createdFiles) {
    const file = await safeTarget(root, item.path);
    if (await exists(file) && sha256(await readFile(file)) !== item.sha256) {
      throw new CliError(
        "E_UPGRADE_ROLLBACK_FAILED",
        `升级创建的文件已被修改，拒绝删除：${item.path}`,
        item.path,
      );
    }
  }
  await rollbackInMemory(root, journal.createdFiles, journal.backups);
  await restoreTool(root, journal.tool);
  journal.status = "rolled_back";
  await writeFile(target, `${JSON.stringify(journal, null, 2)}\n`, "utf8");
  return {
    ok: true,
    command: "upgrade",
    action: "rollback",
    runId,
    rolledBack: true,
    restoredVersion: journal.from,
    warnings: [],
  };
}
