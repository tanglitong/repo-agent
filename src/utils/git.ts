import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function getChangedFiles(root: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-c", "core.quotepath=false", "status", "--porcelain=v1", "-uall"],
      { cwd: root },
    );
    return stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => line.slice(3))
      .map((file) => file.includes(" -> ") ? file.split(" -> ").at(-1)! : file)
      .map((file) => file.replace(/^"|"$/g, "").replaceAll("\\", "/"))
      .filter(
        (file) =>
          !file.startsWith(".repo-agent/generated/") &&
          !file.startsWith(".repo-agent/catalog/"),
      );
  } catch {
    return [];
  }
}

export async function getGitCommit(root: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      cwd: root,
    });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}
