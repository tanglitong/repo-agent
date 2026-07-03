import path from "node:path";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { privateAssetPath, resolveAssetRoot } from "./asset-root.js";
import { readFixPatterns, readMemories, readSkills } from "./asset-reader.js";
import { listCandidates } from "./candidate-manager.js";
import { listInbox } from "./learning-inbox.js";
import {
  materializeEvidence,
  summarizeAssetEvidence,
  type AssetEvidenceSummary,
} from "./evidence-manager.js";
import { exists, listFiles } from "../utils/fs.js";
import { readYaml, stringifyYaml } from "../utils/yaml.js";
import { CliError } from "../errors.js";
import { loadConfig } from "./config-loader.js";

export type LifecycleProposalAction = "archive" | "delete" | "restore";

export interface LifecycleProposal {
  version: 1;
  proposal_id: string;
  asset_id: string;
  action: LifecycleProposalAction;
  status: "pending_review" | "applied" | "rejected";
  source: string;
  replacement_id: string | null;
  health: number;
  threshold_since: string;
  generated_at: string;
  review: {
    required: true;
    reviewer: string | null;
    reviewed_at: string | null;
  };
}

const DAY = 86_400_000;
const defaults = {
  staleHealth: 0.45,
  archiveHealth: 0.3,
  staleDays: 90,
  archiveDays: 180,
  deleteDays: 180,
  privateRetentionDays: 180,
};

function protectedAsset(source: string): boolean {
  return /\/(policies|workflows|review_lenses)\//.test(source) ||
    /security/i.test(source);
}

function proposalId(assetId: string, action: LifecycleProposalAction) {
  return `lifecycle.${action}.${createHash("sha256")
    .update(`${assetId}\n${action}`)
    .digest("hex")
    .slice(0, 20)}`;
}

async function proposalDirectory(root: string) {
  const assetRoot = await resolveAssetRoot(root);
  return path.join(assetRoot.path, "lifecycle_proposals");
}

async function writeProposal(
  root: string,
  proposal: LifecycleProposal,
  dryRun: boolean,
) {
  const directory = await proposalDirectory(root);
  const target = path.join(directory, `${proposal.proposal_id}.yaml`);
  if (!dryRun) {
    await mkdir(directory, { recursive: true });
    if (!(await exists(target))) {
      await writeFile(target, stringifyYaml(proposal), "utf8");
    }
  }
  return path.relative(root, target).replaceAll("\\", "/");
}

export async function listLifecycleProposals(root: string) {
  const directory = await proposalDirectory(root);
  const files = (await listFiles(directory)).filter((file) =>
    /\.ya?ml$/i.test(file)
  );
  return Promise.all(files.map(async (file) => ({
    source: path.relative(root, file).replaceAll("\\", "/"),
    proposal: await readYaml<LifecycleProposal>(file),
  })));
}

export async function proposeLifecycleRestore(
  root: string,
  assetId: string,
  dryRun = false,
) {
  const history = (await listLifecycleProposals(root)).find(
    ({ proposal }) =>
      proposal.asset_id === assetId && proposal.action === "archive",
  );
  if (!history) {
    throw new CliError("E_INVALID_CANDIDATE", `未找到资产 ${assetId} 的归档记录。`);
  }
  const proposal: LifecycleProposal = {
    ...history.proposal,
    proposal_id: proposalId(assetId, "restore"),
    action: "restore",
    status: "pending_review",
    generated_at: new Date().toISOString(),
    review: { required: true, reviewer: null, reviewed_at: null },
  };
  return {
    command: "lifecycle-restore-propose",
    dryRun,
    path: await writeProposal(root, proposal, dryRun),
    proposal,
  };
}

async function staleSince(root: string): Promise<Record<string, string>> {
  const file = privateAssetPath(root, "lifecycle", "thresholds.json");
  if (!(await exists(file))) return {};
  try {
    return JSON.parse(await readFile(file, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeStaleSince(root: string, values: Record<string, string>) {
  const file = privateAssetPath(root, "lifecycle", "thresholds.json");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(values, null, 2)}\n`, "utf8");
}

export async function restoreArchivedForTask(_root: string, _task: string) {
  // 恢复团队资产必须先生成 Restore Candidate，检索阶段不得改变团队文件。
  return [];
}

export async function maintainAssets(root: string, dryRun = false) {
  const policy = (await loadConfig(root)).config.asset_lifecycle_policy;
  if (policy?.enabled === false) {
    return {
      command: "maintain",
      dryRun,
      disabled: true,
      transitions: [],
      proposals: [],
      staleApproved: [],
      removedPrivateCandidates: [],
      removedPrivateInbox: [],
      retentionDays: policy.durations_days?.private_retention ??
        defaults.privateRetentionDays,
      sharedAssetsDeleted: false,
    };
  }
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const materialized = await materializeEvidence(root);
  const summaries = materialized.assets as Record<string, AssetEvidenceSummary>;
  const inventory = (
    await Promise.all([
      readMemories(root, ""),
      readSkills(root, ""),
      readFixPatterns(root, ""),
    ])
  ).flat().filter((item) => item.id);
  const thresholds = await staleSince(root);
  const proposals: Array<{ path: string; proposal: LifecycleProposal }> = [];
  const staleApproved: Array<{ id: string; source: string; health: number }> = [];

  for (const item of inventory) {
    const id = item.id!;
    const health = (
      summaries[id] ?? summarizeAssetEvidence(id, [])
    ).lifecycleHealth;
    const staleHealth = policy?.thresholds?.stale ?? defaults.staleHealth;
    const archiveHealth = policy?.thresholds?.archive ?? defaults.archiveHealth;
    const staleDays = policy?.durations_days?.stale ?? defaults.staleDays;
    const archiveDays = policy?.durations_days?.archive ?? defaults.archiveDays;
    if (health >= staleHealth) {
      delete thresholds[id];
      continue;
    }
    thresholds[id] ??= nowIso;
    const ageDays = Math.max(0, (now - Date.parse(thresholds[id])) / DAY);
    if (ageDays >= staleDays) {
      staleApproved.push({ id, source: item.source, health });
    }
    if (
      health < archiveHealth &&
      ageDays >= archiveDays &&
      !protectedAsset(item.source)
    ) {
      const proposal: LifecycleProposal = {
        version: 1,
        proposal_id: proposalId(id, "archive"),
        asset_id: id,
        action: "archive",
        status: "pending_review",
        source: item.source,
        replacement_id: null,
        health,
        threshold_since: thresholds[id],
        generated_at: nowIso,
        review: { required: true, reviewer: null, reviewed_at: null },
      };
      proposals.push({
        path: await writeProposal(root, proposal, dryRun),
        proposal,
      });
    }
  }
  const inventoryIds = new Set(inventory.map((item) => item.id));
  const deleteDays = policy?.durations_days?.delete ?? defaults.deleteDays;
  for (const { proposal: archived } of await listLifecycleProposals(root)) {
    if (
      archived.action !== "archive" ||
      archived.status !== "applied" ||
      !archived.review.reviewed_at ||
      !archived.replacement_id ||
      !inventoryIds.has(archived.replacement_id) ||
      protectedAsset(archived.source) ||
      (now - Date.parse(archived.review.reviewed_at)) / DAY < deleteDays
    ) {
      continue;
    }
    const proposal: LifecycleProposal = {
      ...archived,
      proposal_id: proposalId(archived.asset_id, "delete"),
      action: "delete",
      status: "pending_review",
      generated_at: nowIso,
      review: { required: true, reviewer: null, reviewed_at: null },
    };
    proposals.push({
      path: await writeProposal(root, proposal, dryRun),
      proposal,
    });
  }

  const privateRetentionDays =
    policy?.durations_days?.private_retention ?? defaults.privateRetentionDays;
  const cutoff = now - privateRetentionDays * DAY;
  const candidates = (
    await Promise.all(
      (["memory", "skill", "fix_pattern"] as const).map((kind) =>
        listCandidates(root, kind)
      ),
    )
  ).flat();
  const removablePrivateCandidates = candidates.filter(
    ({ visibility, candidate }) => {
      if (visibility !== "private") return false;
      if (candidate.manual_hold === true || candidate.status === "in_review") {
        return false;
      }
      const timestamp = Date.parse(
        String(candidate.updated_at ?? candidate.created_at ?? ""),
      );
      return Number.isFinite(timestamp) && timestamp <= cutoff;
    },
  );
  const removablePrivateInbox = (await listInbox(root)).filter(
    ({ source, item }) => {
      if (!source.startsWith(".repo-agent-private/")) return false;
      if (item.manual_hold === true || item.status === "in_review") return false;
      const timestamp = Date.parse(
        String(item.updated_at ?? item.created_at ?? ""),
      );
      return Number.isFinite(timestamp) && timestamp <= cutoff;
    },
  );
  if (!dryRun && policy?.private_automatic_cleanup !== false) {
    for (const item of removablePrivateCandidates) {
      await unlink(path.join(root, item.source)).catch(() => undefined);
    }
    for (const item of removablePrivateInbox) {
      await unlink(path.join(root, item.source)).catch(() => undefined);
    }
  }
  if (!dryRun) {
    await writeStaleSince(root, thresholds);
    const report = privateAssetPath(root, "lifecycle", "maintenance.json");
    await mkdir(path.dirname(report), { recursive: true });
    await writeFile(report, `${JSON.stringify({
      version: 1,
      generatedAt: nowIso,
      proposals: proposals.map((item) => item.path),
      removedPrivateCandidates: removablePrivateCandidates.map((item) => item.source),
      removedPrivateInbox: removablePrivateInbox.map((item) => item.source),
      sharedAssetsDeleted: false,
    }, null, 2)}\n`, "utf8");
  }
  return {
    command: "maintain",
    dryRun,
    transitions: [],
    proposals,
    staleApproved,
    removedPrivateCandidates: removablePrivateCandidates.map((item) => item.source),
    removedPrivateInbox: removablePrivateInbox.map((item) => item.source),
    retentionDays: privateRetentionDays,
    sharedAssetsDeleted: false,
  };
}

export async function applyLifecycleProposal(
  root: string,
  proposalIdValue: string,
  reviewer = "manual-review",
  dryRun = false,
) {
  const match = (await listLifecycleProposals(root)).find(
    ({ proposal }) => proposal.proposal_id === proposalIdValue,
  );
  if (!match) {
    throw new CliError("E_INVALID_CANDIDATE", `未找到生命周期提案：${proposalIdValue}`);
  }
  const proposal = match.proposal;
  if (proposal.status !== "pending_review") {
    throw new CliError("E_INVALID_CANDIDATE", "生命周期提案已处理。");
  }
  if (proposal.action === "delete" && !proposal.replacement_id) {
    throw new CliError("E_INVALID_CANDIDATE", "没有替代资产时禁止删除团队资产。");
  }
  if (protectedAsset(proposal.source)) {
    throw new CliError("E_POLICY_BLOCKED", "Policy、Security、Workflow 和 Review Lens 资产永久保护。");
  }
  const assetRoot = await resolveAssetRoot(root);
  const source = path.join(root, proposal.source);
  const archive = path.join(assetRoot.path, "archive", proposal.source.replace(/^\.repo-agent\//, ""));
  if (!dryRun) {
    if (proposal.action === "archive") {
      if (!(await exists(source))) throw new CliError("E_WRITE_FAILED", "待归档资产不存在。");
      await mkdir(path.dirname(archive), { recursive: true });
      await rename(source, archive);
    } else if (proposal.action === "restore") {
      if (!(await exists(archive))) throw new CliError("E_WRITE_FAILED", "待恢复归档资产不存在。");
      await mkdir(path.dirname(source), { recursive: true });
      await rename(archive, source);
    } else {
      if (!(await exists(archive))) throw new CliError("E_WRITE_FAILED", "待删除归档资产不存在。");
      await unlink(archive);
      const tombstone = path.join(assetRoot.path, "tombstones", `${createHash("sha256").update(proposal.asset_id).digest("hex")}.yaml`);
      await mkdir(path.dirname(tombstone), { recursive: true });
      await writeFile(tombstone, stringifyYaml({
        version: 1,
        asset_id: proposal.asset_id,
        deleted_at: new Date().toISOString(),
        replacement_id: proposal.replacement_id,
        reviewer,
      }), "utf8");
    }
    proposal.status = "applied";
    proposal.review = {
      required: true,
      reviewer,
      reviewed_at: new Date().toISOString(),
    };
    await writeFile(path.join(root, match.source), stringifyYaml(proposal), "utf8");
  }
  return { command: "lifecycle-apply", dryRun, proposal, source: match.source };
}
