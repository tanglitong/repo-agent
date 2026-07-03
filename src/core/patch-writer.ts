import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { CliError } from "../errors.js";
import { relativeAssetPath, resolveAssetRoot } from "./asset-root.js";

const execFileAsync = promisify(execFile);

export async function createPatch(root: string, dryRun = false) {
  const assetRoot = await resolveAssetRoot(root);
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync("git", ["diff", "--binary", "HEAD"], {
      cwd: root,
      maxBuffer: 20 * 1024 * 1024,
    }));
  } catch {
    try {
      ({ stdout } = await execFileAsync("git", ["diff", "--binary"], { cwd: root }));
    } catch {
      throw new CliError("E_WRITE_FAILED", "Git diff 不可用，无法创建补丁。");
    }
  }
  let untrackedFiles: string[] = [];
  try {
    const { stdout: untracked } = await execFileAsync(
      "git",
      ["ls-files", "--others", "--exclude-standard", "-z"],
      { cwd: root },
    );
    untrackedFiles = untracked.split("\0").filter(Boolean);
    const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
    for (const file of untrackedFiles) {
      try {
        await execFileAsync(
          "git",
          ["diff", "--binary", "--no-index", "--", nullDevice, file],
          { cwd: root, maxBuffer: 20 * 1024 * 1024 },
        );
      } catch (error) {
        const diff = (error as { stdout?: string }).stdout;
        if (diff) stdout += `${stdout && !stdout.endsWith("\n") ? "\n" : ""}${diff}`;
      }
    }
  } catch {
    // Tracked changes are still returned when untracked discovery is unavailable.
  }
  const name = `repo-agent_${new Date().toISOString().replace(/[:.]/g, "-")}.patch`;
  const relativePath = relativeAssetPath(assetRoot, "generated", "patches", name);
  if (!dryRun) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, stdout, "utf8");
  }
  return {
    dryRun,
    path: relativePath,
    bytes: Buffer.byteLength(stdout),
    empty: stdout.length === 0,
    untrackedFiles,
  };
}

export async function generatePatchSummary(root: string) {
  try {
    const [{ stdout: stat }, { stdout: names }] = await Promise.all([
      execFileAsync("git", ["diff", "--stat", "HEAD"], { cwd: root }),
      execFileAsync("git", ["diff", "--name-only", "HEAD"], { cwd: root }),
    ]);
    const { stdout: untracked } = await execFileAsync(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      { cwd: root },
    );
    const changedFiles = [
      ...new Set([...names.split("\n"), ...untracked.split("\n")].filter(Boolean)),
    ];
    return {
      changedFiles,
      fileCount: changedFiles.length,
      stat: stat.trim(),
      generatedPatch: false,
    };
  } catch {
    return { changedFiles: [], fileCount: 0, stat: "", generatedPatch: false };
  }
}
