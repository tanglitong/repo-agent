import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { readFixPatterns, readMemories, readSkills } from "./asset-reader.js";
import { listCandidates } from "./candidate-manager.js";
import { stringifyYaml } from "../utils/yaml.js";
import { relativeAssetPath, resolveAssetRoot } from "./asset-root.js";

export async function rebuildCatalog(root: string, dryRun = false) {
  const assetRoot = await resolveAssetRoot(root);
  const [memories, skills, fixes, memoryCandidates, skillCandidates, fixCandidates] =
    await Promise.all([
      readMemories(root, ""),
      readSkills(root, ""),
      readFixPatterns(root, ""),
      listCandidates(root, "memory"),
      listCandidates(root, "skill"),
      listCandidates(root, "fix_pattern"),
    ]);
  const files: Record<string, unknown> = {
    "memories.index.yaml": {
      memories: memories.map((item) => ({ id: item.id, source: item.source, status: "approved", weight: item.finalWeight })),
    },
    "skills.index.yaml": {
      skills: skills.map((item) => ({ id: item.id, source: item.source, status: "approved", weight: item.finalWeight })),
    },
    "fix_patterns.index.yaml": {
      fix_patterns: fixes.map((item) => ({ id: item.id, source: item.source, status: "approved", weight: item.finalWeight })),
    },
    "candidates.index.yaml": {
      candidates: [...memoryCandidates, ...skillCandidates, ...fixCandidates].map(({ source, candidate }) => ({
        id: candidate.candidate_id,
        target_id: candidate.id,
        source,
        status: candidate.status,
      })),
    },
  };
  if (!dryRun) {
    const directory = path.join(assetRoot.path, "catalog");
    await mkdir(directory, { recursive: true });
    await Promise.all(
      Object.entries(files).map(([name, value]) =>
        writeFile(path.join(directory, name), stringifyYaml(value), "utf8"),
      ),
    );
  }
  return {
    dryRun,
    files: Object.keys(files).map((name) => relativeAssetPath(assetRoot, "catalog", name)),
  };
}
