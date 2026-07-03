import path from "node:path";
import { minimatch } from "minimatch";

export function normalizeRepoPath(input: string): string {
  const normalized = input.replaceAll("\\", "/").replace(/^\.\/+/, "");
  if (path.posix.isAbsolute(normalized) || normalized.split("/").includes("..")) {
    throw new Error(`路径必须位于仓库内部并使用相对路径：${input}`);
  }
  return path.posix.normalize(normalized);
}

export function matchRepoGlob(input: string, pattern: string): boolean {
  const normalizedPath = normalizeRepoPath(input);
  const normalizedPattern = normalizeRepoPath(pattern);
  return minimatch(normalizedPath, normalizedPattern, {
    dot: true,
    matchBase: !normalizedPattern.includes("/"),
  });
}
