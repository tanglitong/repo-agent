import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MINIMUM_NODE_MAJOR, VERSION } from "../index.js";
import { exists, isWritable } from "../utils/fs.js";
import { scanProject } from "../core/project-scanner.js";
import { relativeAssetPath, resolveAssetRoot } from "../core/asset-root.js";

const execFileAsync = promisify(execFile);

export interface DoctorResult {
  ok: boolean;
  command: "doctor";
  version: string;
  node: {
    current: string;
    minimum: string;
    supported: boolean;
  };
  project: {
    root: string;
    initialized: boolean;
    hasAgents: boolean;
    hasGit: boolean;
    writeAccess: boolean;
  };
  capabilities: {
    node: boolean;
    git: boolean;
    writeAccess: boolean;
    testCommands: boolean;
    packageManager: boolean;
    openspec: boolean;
    adr: boolean;
    mcpCompatible: boolean;
  };
  checks: Array<{ id: string; ok: boolean; message: string }>;
  warnings: string[];
}

async function hasWorkingGit(root: string): Promise<boolean> {
  if (!(await exists(path.join(root, ".git")))) return false;
  try {
    await execFileAsync("git", ["status", "--short"], { cwd: root });
    return true;
  } catch {
    return false;
  }
}

export async function doctor(root: string): Promise<DoctorResult> {
  const profile = await scanProject(root);
  const assetRoot = await resolveAssetRoot(root);
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  const nodeSupported = major >= MINIMUM_NODE_MAJOR;
  const initialized = await exists(path.join(assetRoot.path, "config.yaml"));
  const writeAccess = await isWritable(root);
  const git = await hasWorkingGit(root);
  const mcpCompatible =
    await exists(path.join(root, ".codex", "config.toml")) ||
    await exists(path.join(root, ".mcp.json")) ||
    await exists(path.join(root, "opencode.json"));
  const warnings: string[] = [];
  if (!initialized) warnings.push("项目尚未初始化，请运行 `repo-agent init`。");
  if (!git) warnings.push("Git 能力不可用；依赖 Git 的功能将采用安全降级模式。");
  if (!profile.testCommands.unit) warnings.push("未检测到测试命令。");
  if (!profile.packageManager) warnings.push("未检测到包管理器。");

  const checks = [
    {
      id: "node",
      ok: nodeSupported,
      message: nodeSupported
        ? `Node.js ${process.versions.node} 版本受支持。`
        : `需要 Node.js >= ${MINIMUM_NODE_MAJOR}。`,
    },
    {
      id: "write_access",
      ok: writeAccess,
      message: writeAccess ? "项目根目录可写。" : "项目根目录不可写。",
    },
    {
      id: "project_structure",
      ok: initialized,
      message: initialized
        ? `已找到 ${relativeAssetPath(assetRoot, "config.yaml")}。`
        : `缺少 ${relativeAssetPath(assetRoot, "config.yaml")}。`,
    },
  ];

  return {
    ok: nodeSupported && writeAccess && initialized,
    command: "doctor",
    version: VERSION,
    node: {
      current: process.versions.node,
      minimum: `${MINIMUM_NODE_MAJOR}.0.0`,
      supported: nodeSupported,
    },
    project: {
      root,
      initialized,
      hasAgents: profile.process.hasAgents,
      hasGit: git,
      writeAccess,
    },
    capabilities: {
      node: nodeSupported,
      git,
      writeAccess,
      testCommands: Boolean(profile.testCommands.unit),
      packageManager: Boolean(profile.packageManager),
      openspec: profile.process.hasOpenSpec,
      adr: profile.process.hasAdr,
      mcpCompatible,
    },
    checks,
    warnings: [...assetRoot.warnings, ...warnings],
  };
}
