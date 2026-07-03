import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { exists, isWritable } from "../utils/fs.js";
import { scanProject } from "./project-scanner.js";
import type { RepoCapabilities } from "../types/context.js";

const execFileAsync = promisify(execFile);

export async function detectCapabilities(root: string): Promise<RepoCapabilities> {
  const profile = await scanProject(root);
  let git = false;
  if (await exists(path.join(root, ".git"))) {
    try {
      await execFileAsync("git", ["status", "--short"], { cwd: root });
      git = true;
    } catch {
      git = false;
    }
  }
  return {
    git,
    writeAccess: await isWritable(root),
    testCommands: Boolean(profile.testCommands.unit),
    packageManager: Boolean(profile.packageManager),
    openspec: profile.process.hasOpenSpec,
    adr: profile.process.hasAdr,
    node: Number.parseInt(process.versions.node.split(".")[0], 10) >= 18,
    mcpCompatible:
      await exists(path.join(root, ".codex", "config.toml")) ||
      await exists(path.join(root, ".mcp.json")) ||
      await exists(path.join(root, "opencode.json")),
  };
}
