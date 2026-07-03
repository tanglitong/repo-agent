import path from "node:path";
import { realpath } from "node:fs/promises";
import { exists } from "./fs.js";

const projectMarkers = [
  ".repo-agent",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
];

export async function findProjectRoot(start: string): Promise<string> {
  const resolvedStart = await realpath(path.resolve(start)).catch(() => path.resolve(start));
  let current = resolvedStart;
  let nearestProject: string | undefined;

  while (true) {
    if (await exists(path.join(current, ".git"))) return current;
    if (!nearestProject) {
      for (const marker of projectMarkers) {
        if (await exists(path.join(current, marker))) {
          nearestProject = current;
          break;
        }
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return nearestProject ?? resolvedStart;
}
