import path from "node:path";
import { exists, listFiles } from "../utils/fs.js";
import { readYaml } from "../utils/yaml.js";
import { detectCapabilities } from "../core/capability-detector.js";
import { validateProject } from "./validate.js";
import { getChangedFiles } from "../utils/git.js";
import { rebuildCatalog } from "../core/catalog-builder.js";
import { resolveAssetRoot } from "../core/asset-root.js";
import { listCandidates } from "../core/candidate-manager.js";
import { closureDiagnostics } from "../core/closure-engine.js";
import { listLifecycleProposals } from "../core/asset-lifecycle.js";
import { listInbox } from "../core/learning-inbox.js";
import { VERSION } from "../index.js";

export async function getStatus(root: string, dryRun = false) {
  const assetRoot = await resolveAssetRoot(root);
  const initialized = await exists(path.join(assetRoot.path, "config.yaml"));
  if (!initialized) {
    return {
      initialized: false,
      mode: null,
      templateVersion: null,
      schemaVersion: null,
      validate: "not_initialized",
      pendingCandidates: { memory: 0, skill: 0, fixPattern: 0 },
      latestAudit: null,
      warnings: ["项目尚未初始化。"],
      capabilities: await detectCapabilities(root),
      gitDirtyFiles: (await getChangedFiles(root)).length,
    };
  }
  const [config, lock, validation, capabilities, changedFiles] = await Promise.all([
    readYaml<Record<string, unknown>>(path.join(assetRoot.path, "config.yaml")),
    readYaml<Record<string, unknown>>(path.join(assetRoot.path, "lock.yaml")),
    validateProject(root),
    detectCapabilities(root),
    getChangedFiles(root),
  ]);
  const catalog = await rebuildCatalog(root, dryRun);
  const [memory, skills, fixes, audits, adapters, closures, proposals, inbox] = await Promise.all([
    listCandidates(root, "memory"),
    listCandidates(root, "skill"),
    listCandidates(root, "fix_pattern"),
    listFiles(path.join(assetRoot.path, "generated", "audits")),
    listFiles(path.join(assetRoot.path, "adapters")),
    closureDiagnostics(root),
    listLifecycleProposals(root),
    listInbox(root),
  ]);
  const candidates = [...memory, ...skills, ...fixes];
  const privateCandidates = candidates.filter((item) => item.visibility === "private");
  const teamCandidates = candidates.filter((item) => item.visibility === "team");
  const quarantinedCandidates = candidates.filter(
    ({ candidate }) => candidate.status === "quarantined",
  );
  const repoAgent = (lock.repo_agent ?? {}) as Record<string, unknown>;
  return {
    initialized: true,
    mode: config.mode ?? null,
    templateVersion: repoAgent.template_version ?? null,
    schemaVersion: repoAgent.schema_version ?? null,
    validate: validation.ok ? "ok" : "failed",
    pendingCandidates: {
      memory: memory.length,
      skill: skills.length,
      fixPattern: fixes.length,
    },
    candidateCounts: {
      private: privateCandidates.length,
      team: teamCandidates.length,
      quarantined: quarantinedCandidates.length,
    },
    learningInbox: inbox.length,
    closure: closures.counts,
    lifecycleProposals: proposals.filter(
      ({ proposal }) => proposal.status === "pending_review",
    ).length,
    versions: {
      bundle: VERSION,
      hook: 1,
      mcp: 1,
      runtimeEvent: 1,
      schema: repoAgent.schema_version ?? null,
      template: repoAgent.template_version ?? null,
    },
    latestAudit: audits.at(-1)
      ? path.relative(root, audits.at(-1)!).replaceAll("\\", "/")
      : null,
    warnings: [
      ...assetRoot.warnings,
      ...validation.warnings.map((warning) => warning.message),
    ],
    capabilities,
    gitDirtyFiles: changedFiles.length,
    adapters: adapters
      .filter((file) => /\.ya?ml$/i.test(file))
      .map((file) => path.basename(file).replace(/\.ya?ml$/i, "")),
    catalog,
  };
}
