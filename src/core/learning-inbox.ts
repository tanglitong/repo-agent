import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { listFiles } from "../utils/fs.js";
import { readYaml, stringifyYaml } from "../utils/yaml.js";
import { classifyLearning } from "./learning-router.js";
import { containsPossibleSecret } from "./secret-redactor.js";
import { CliError } from "../errors.js";
import { privateAssetPath, resolveAssetRoot } from "./asset-root.js";

export async function listInbox(root: string) {
  const assetRoot = await resolveAssetRoot(root);
  const files = (
    await Promise.all([
      listFiles(path.join(assetRoot.path, "learning_inbox")),
      listFiles(privateAssetPath(root, "learning_inbox")),
    ])
  ).flat().filter((file) => /\.ya?ml$/i.test(file));
  return Promise.all(files.map(async (file) => ({
    source: path.relative(root, file).replaceAll("\\", "/"),
    item: await readYaml<Record<string, unknown>>(file),
  })));
}

interface CreateInboxOptions {
  createdBy?: "agent" | "repo-agent-recurring";
  dedupeKey?: string;
}

export async function createInbox(
  root: string,
  task: string,
  observation: string,
  dryRun = false,
  options: CreateInboxOptions = {},
) {
  if (containsPossibleSecret(observation)) {
    throw new CliError("E_SECRET_DETECTED", "Learning Inbox 条目可能包含敏感信息。");
  }
  const now = new Date();
  const existing = await listInbox(root);
  const duplicate = existing.find(({ item }) =>
    options.dedupeKey
      ? item.dedupe_key === options.dedupeKey
      : item.task === task && item.observation === observation
  );
  if (duplicate) {
    const updated = options.dedupeKey && duplicate.item.observation !== observation
      ? {
          ...duplicate.item,
          task,
          observation,
          updated_at: now.toISOString(),
        }
      : duplicate.item;
    if (!dryRun && updated !== duplicate.item) {
      await writeFile(path.join(root, duplicate.source), stringifyYaml(updated), "utf8");
    }
    return {
      dryRun,
      path: duplicate.source,
      item: updated,
      duplicate: true,
      updated: updated !== duplicate.item,
    };
  }
  const slug = task.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "learning";
  const unique = randomUUID();
  const id =
    `inbox.${now.toISOString().slice(0, 10).replaceAll("-", "")}.${slug}.${unique}`;
  const target = privateAssetPath(
    root,
    "learning_inbox",
    `inbox_${now.getTime()}_${slug}_${unique}.yaml`,
  );
  const relativePath = path.relative(root, target).replaceAll("\\", "/");
  const classification = classifyLearning(task, observation);
  const item = {
    id,
    status: "untriaged",
    task,
    observation,
    suggested_targets: [classification.classification],
    confidence: classification.writableAsCandidate ? 0.62 : 0.4,
    evidence: { changed_files: [], tests: [] },
    ...(options.dedupeKey ? { dedupe_key: options.dedupeKey } : {}),
    created_at: now.toISOString(),
    created_by: options.createdBy ?? "agent",
  };
  if (!dryRun) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, stringifyYaml(item), "utf8");
  }
  return { dryRun, path: relativePath, item };
}

export async function triageInbox(root: string, id: string, dryRun = false) {
  const entries = await listInbox(root);
  const match = entries.find(({ item }) => item.id === id);
  if (!match) throw new CliError("E_INVALID_CANDIDATE", `未找到 Learning Inbox 条目：${id}`);
  const task = String(match.item.task ?? "");
  const observation = String(match.item.observation ?? "");
  const classification = classifyLearning(task, observation);
  const updated = { ...match.item, status: "triaged", triage: classification, triaged_at: new Date().toISOString() };
  if (!dryRun) await writeFile(path.join(root, match.source), stringifyYaml(updated), "utf8");
  return { dryRun, source: match.source, classification, item: updated };
}
