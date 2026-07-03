import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { exists } from "../utils/fs.js";
import { CliError } from "../errors.js";
import { syncProject } from "./sync.js";
import {
  applyUpgrade,
  createUpgradePlan,
  rollbackUpgrade,
} from "./upgrade.js";
import type { EntryMode, ToolSelection } from "../core/integration-manager.js";
import { resolveAssetRoot, relativeAssetPath } from "../core/asset-root.js";

export interface UpdateOptions {
  root: string;
  source?: string;
  tool: ToolSelection;
  entry: EntryMode;
  dryRun: boolean;
  confirmed: boolean;
  rollback: boolean;
  rollbackRunId?: string;
}

export interface UpdateResult {
  ok: boolean;
  command: "update";
  action: "refresh" | "init" | "migrate" | "rollback";
  [key: string]: unknown;
}

const RUN_ID_PATTERN = /^[0-9]+-[0-9A-Za-z.-]+-to-[0-9A-Za-z.-]+$/;

async function autoDetectSource(root: string): Promise<string | undefined> {
  const explicitZip = path.join(root, "release", "repo-agent-node-offline.zip");
  if (await exists(explicitZip)) return explicitZip;
  const installedTool = path.join(root, "repo-agent");
  if (await exists(path.join(installedTool, "repo-agent.bundle.js"))) {
    return installedTool;
  }
  return undefined;
}

async function findLatestRunId(root: string): Promise<string | undefined> {
  const assetRoot = await resolveAssetRoot(root);
  const upgradesDir = path.join(
    root,
    relativeAssetPath(assetRoot, "generated", "upgrades"),
  );
  if (!(await exists(upgradesDir))) return undefined;
  const entries = await readdir(upgradesDir);
  const candidates: Array<{ runId: string; mtimeMs: number }> = [];
  for (const entry of entries) {
    if (!RUN_ID_PATTERN.test(entry)) continue;
    const journalPath = path.join(upgradesDir, entry, "journal.json");
    if (!(await exists(journalPath))) continue;
    try {
      const raw = JSON.parse(await readFile(journalPath, "utf8")) as {
        status?: string;
      };
      if (raw.status !== "completed") continue;
      const info = await stat(journalPath);
      candidates.push({ runId: entry, mtimeMs: info.mtimeMs });
    } catch {
      continue;
    }
  }
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0].runId;
}

export async function runUpdate(options: UpdateOptions): Promise<UpdateResult> {
  if (options.rollback) {
    let runId = options.rollbackRunId;
    if (!runId) runId = await findLatestRunId(options.root);
    if (!runId) {
      throw new CliError(
        "E_UPGRADE_ROLLBACK_FAILED",
        "未找到可回滚的升级日志。",
      );
    }
    const result = await rollbackUpgrade(options.root, runId);
    return { ...result, command: "update", action: "rollback" };
  }

  const initialized = await exists(
    path.join(options.root, ".repo-agent", "config.yaml"),
  );

  const explicitSource = options.source;
  const source = explicitSource ??
    (initialized ? await autoDetectSource(options.root) : undefined);

  if (initialized && source) {
    const prepared = await createUpgradePlan(options.root, source, "plan");
    if (prepared.plan.upgradeAvailable) {
      const plan = await applyUpgrade({
        root: options.root,
        source,
        dryRun: options.dryRun,
        confirmed: options.confirmed || options.dryRun,
      });
      return { ...plan, command: "update", action: "migrate" };
    }
    if (explicitSource) {
      return { ...prepared.plan, command: "update", action: "refresh" };
    }
  }

  const sync = await syncProject({
    root: options.root,
    tool: options.tool,
    entry: options.entry,
    dryRun: options.dryRun,
  });
  return {
    ...sync,
    command: "update",
    action: sync.initializedNow || sync.wouldInitialize ? "init" : "refresh",
  };
}
