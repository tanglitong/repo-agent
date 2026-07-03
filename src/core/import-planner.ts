import path from "node:path";
import { listFiles, exists } from "../utils/fs.js";
import { relativeAssetPath, resolveAssetRoot } from "./asset-root.js";

const fixedSources = [
  "AGENTS.md",
  "CLAUDE.md",
  ".github/copilot-instructions.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "README.md",
];

export async function scanImportSources(root: string) {
  const sources: string[] = [];
  for (const relativePath of fixedSources) {
    if (await exists(path.join(root, relativePath))) sources.push(relativePath);
  }
  for (const directory of ["docs/adr", ".openspec"]) {
    for (const file of await listFiles(path.join(root, directory))) {
      sources.push(path.relative(root, file).replaceAll("\\", "/"));
    }
  }
  return sources.filter((source) => !/(^|\/)\.env|\.pem$|\.key$|id_rsa|id_ed25519/i.test(source));
}

export async function buildImportPlan(root: string) {
  const assetRoot = await resolveAssetRoot(root);
  const sources = await scanImportSources(root);
  return sources.map((source) => {
    const policyLike = /security|copilot/i.test(source);
    const slug = source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      source,
      target: policyLike
        ? relativeAssetPath(assetRoot, "learning_inbox", `import_policy_${slug}.yaml`)
        : relativeAssetPath(assetRoot, "memory_candidates", `cand_memory_import_${slug}.yaml`),
      action: policyLike
        ? "propose_policy_candidate_for_review"
        : "propose_memory_candidate",
      confidence: policyLike ? 0.68 : 0.74,
      trusted: false,
    };
  });
}
