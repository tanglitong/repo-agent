import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { privateAssetPath } from "./asset-root.js";
import { containsPossibleSecret, redactSecrets } from "./secret-redactor.js";
import { exists, listFiles } from "../utils/fs.js";
import {
  listCandidates,
  proposeCandidate,
  type CandidateKind,
} from "./candidate-manager.js";
import { stringifyYaml } from "../utils/yaml.js";
import { loadConfig } from "./config-loader.js";

export type ObservationKind =
  | "correction"
  | "successful_resolution"
  | "failed_attempt"
  | "repeated_workflow"
  | "project_convention"
  | "security_boundary";

export interface AtomicObservation {
  version: 1;
  observationId: string;
  projectId: string;
  preflightId: string;
  sessionId: string;
  observedAt: string;
  kind: ObservationKind;
  trigger: string;
  action: string;
  outcome: string;
  scope: "project" | "personal";
  evidence: {
    changedFiles: string[];
    tests: string[];
    auditId?: string;
    toolEventIds: string[];
  };
  redactionStatus: "clean" | "redacted" | "rejected";
}

export function compactObservationText(value: string, maximum: number) {
  const normalized = value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= maximum) return normalized;
  const draft = normalized.slice(0, Math.max(1, maximum - 1));
  const boundaries = [
    draft.lastIndexOf("。"),
    draft.lastIndexOf("！"),
    draft.lastIndexOf("？"),
    draft.lastIndexOf(". "),
    draft.lastIndexOf("; "),
    draft.lastIndexOf("；"),
    draft.lastIndexOf(" "),
  ];
  const boundary = Math.max(...boundaries);
  const safe = boundary >= maximum * 0.6
    ? draft.slice(0, boundary + 1)
    : draft;
  return `${safe.replace(/[[({`*_]+$/g, "").trimEnd()}…`;
}

const compact = compactObservationText;

export function projectId(root: string) {
  return createHash("sha256").update(path.resolve(root)).digest("hex").slice(0, 12);
}

export function observationFingerprint(input: Pick<AtomicObservation, "kind" | "trigger" | "action" | "scope">) {
  return createHash("sha256")
    .update(
      `${input.kind}\n${compact(input.trigger, 240).toLowerCase()}\n${compact(input.action, 480).toLowerCase()}\n${input.scope}`,
    )
    .digest("hex")
    .slice(0, 20);
}

function classify(
  task: string,
  outcome: string,
  outcomeStatus: "success" | "failure" | "partial",
): ObservationKind {
  const text = `${task} ${outcome}`.toLowerCase();
  if (/(禁止|不得|must not|security boundary|安全边界)/.test(text)) {
    return "security_boundary";
  }
  if (/(纠正|不要再|应该改为|correction|instead)/.test(text)) return "correction";
  if (outcomeStatus === "failure") return "failed_attempt";
  if (/(约定|convention|必须覆盖|测试映射)/.test(text)) {
    return "project_convention";
  }
  if (/(先.+再|步骤[:：]|step\s+\d|重复执行)/i.test(text)) {
    return "repeated_workflow";
  }
  return "successful_resolution";
}

export async function captureObservation(input: {
  root: string;
  preflightId: string;
  sessionId: string;
  task: string;
  outcome: string;
  outcomeStatus: "success" | "failure" | "partial";
  changedFiles?: string[];
  tests?: string[];
  auditId?: string;
  toolEventIds?: string[];
}) {
  const raw = `${input.task}\n${input.outcome}`;
  const hasSecret = containsPossibleSecret(raw);
  const trigger = compact(redactSecrets(input.task), 240);
  const action = compact(redactSecrets(input.outcome), 480);
  const observation: AtomicObservation = {
    version: 1,
    observationId: randomUUID(),
    projectId: projectId(input.root),
    preflightId: input.preflightId,
    sessionId: input.sessionId,
    observedAt: new Date().toISOString(),
    kind: classify(input.task, input.outcome, input.outcomeStatus),
    trigger,
    action,
    outcome: input.outcomeStatus,
    scope: "project",
    evidence: {
      changedFiles: input.changedFiles ?? [],
      tests: input.tests ?? [],
      ...(input.auditId ? { auditId: input.auditId } : {}),
      toolEventIds: input.toolEventIds ?? [],
    },
    redactionStatus: hasSecret ? "redacted" : "clean",
  };
  const file = privateAssetPath(
    input.root,
    "observations",
    observation.projectId,
    `${new Date().toISOString().slice(0, 10)}.jsonl`,
  );
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(observation)}\n`, "utf8");
  return observation;
}

export async function listObservations(root: string) {
  const files = (await listFiles(privateAssetPath(root, "observations")))
    .filter((file) => file.endsWith(".jsonl"));
  const observations: AtomicObservation[] = [];
  for (const file of files) {
    for (const line of (await readFile(file, "utf8")).split("\n").filter(Boolean)) {
      try {
        observations.push(JSON.parse(line) as AtomicObservation);
      } catch {
        // Health owns corruption reporting.
      }
    }
  }
  return observations;
}

export async function analyzeObservations(root: string) {
  const growth = (await loadConfig(root)).config.automatic_growth_policy;
  const requiredPreflights = growth?.validated_preflights ?? 3;
  const requiredDays = growth?.validated_days ?? 2;
  const observations = await listObservations(root);
  const groups = new Map<string, AtomicObservation[]>();
  for (const item of observations) {
    const match = [...groups.entries()].find(([, values]) =>
      observationSimilarity(values[0], item) >= 0.82
    );
    const key = match?.[0] ?? observationFingerprint(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()].map(([fingerprint, items]) => {
    const distinctPreflights = new Set(items.map((item) => item.preflightId)).size;
    const distinctDays = new Set(items.map((item) => item.observedAt.slice(0, 10))).size;
    const hasEvidence = items.some((item) =>
      item.evidence.changedFiles.length > 0 ||
      item.evidence.tests.length > 0 ||
      Boolean(item.evidence.auditId)
    );
    return {
      fingerprint,
      observations: items,
      distinctPreflights,
      distinctDays,
      status:
        distinctPreflights >= requiredPreflights && distinctDays >= requiredDays
          ? hasEvidence ? "team_proposed" : "validated"
          : "candidate",
    };
  });
}

function observationSimilarity(
  left: AtomicObservation,
  right: AtomicObservation,
) {
  const words = (value: string) =>
    new Set(value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  const ngrams = (value: string) => {
    const values = new Set<string>();
    for (const [sequence] of value.matchAll(/[\p{Script=Han}]{2,}/gu)) {
      const characters = [...sequence];
      for (const size of [2, 3]) {
        for (let index = 0; index <= characters.length - size; index += 1) {
          values.add(characters.slice(index, index + size).join(""));
        }
      }
    }
    return values;
  };
  const jaccard = (a: Set<string>, b: Set<string>) => {
    const union = new Set([...a, ...b]);
    if (!union.size) return 0;
    return [...a].filter((item) => b.has(item)).length / union.size;
  };
  const leftText = `${left.trigger} ${left.action}`;
  const rightText = `${right.trigger} ${right.action}`;
  const lexical = jaccard(words(leftText), words(rightText));
  const leftNgrams = ngrams(leftText);
  const rightNgrams = ngrams(rightText);
  const cjk = jaccard(leftNgrams, rightNgrams);
  const structure =
    (left.kind === right.kind ? 0.6 : 0) +
    (left.scope === right.scope ? 0.4 : 0);
  const cjkAvailable = leftNgrams.size > 0 && rightNgrams.size > 0;
  const weighted = 0.4 * lexical + (cjkAvailable ? 0.3 * cjk : 0) +
    0.2 * structure;
  return weighted / (cjkAvailable ? 0.9 : 0.6);
}

export async function materializeObservationCandidates(
  root: string,
  dryRun = false,
) {
  const groups = await analyzeObservations(root);
  const results: Array<Record<string, unknown>> = [];
  for (const group of groups) {
    const first = group.observations[0];
    const kind: CandidateKind = first.kind === "failed_attempt"
      ? "fix_pattern"
      : first.kind === "repeated_workflow"
        ? "skill"
        : "memory";
    const prefix = kind === "fix_pattern" ? "fix" : kind;
    const id = `${prefix}.learned.${group.fingerprint}`;
    const value = [
      `触发：${first.trigger}`,
      `行动：${first.action}`,
      `结果：${first.outcome}`,
    ].join("\n");
    const existing = (await listCandidates(root, kind)).find(
      ({ visibility, candidate }) =>
        visibility === "private" && candidate.id === id,
    );
    if (dryRun) {
      results.push({ id, kind, status: group.status, wouldWrite: !existing });
      continue;
    }
    let source: string;
    let candidate: Record<string, unknown>;
    if (existing) {
      source = existing.source;
      candidate = existing.candidate;
    } else {
      try {
        const proposed = await proposeCandidate({
          root,
          kind,
          id,
          value,
          task: first.trigger,
          proposedBy: "repo-agent-learning",
          visibility: "private",
        });
        source = proposed.path;
        candidate = proposed.candidate;
        if (candidate.status === "quarantined") {
          results.push({ id, kind, status: "quarantined", path: source });
          continue;
        }
      } catch (error) {
        results.push({
          id,
          kind,
          status: "quarantined",
          reason: (error as Error).message,
        });
        continue;
      }
    }
    const preflightIds = [...new Set(group.observations.map((item) => item.preflightId))];
    const observedDates = [...new Set(
      group.observations.map((item) => item.observedAt.slice(0, 10)),
    )];
    const currentEvidence = candidate.evidence &&
        typeof candidate.evidence === "object"
      ? candidate.evidence as Record<string, unknown>
      : {};
    const updated = {
      ...candidate,
      status: group.status === "candidate" ? "candidate" : "validated",
      evidence: {
        ...currentEvidence,
        occurrences: group.observations.length,
        preflight_ids: preflightIds,
        observed_dates: observedDates,
        changed_files: [...new Set(group.observations.flatMap((item) => item.evidence.changedFiles))],
        tests: [...new Set(group.observations.flatMap((item) => item.evidence.tests))],
        audit_ids: [...new Set(group.observations.map((item) => item.evidence.auditId).filter(Boolean))],
      },
      promotion_eligible: group.status === "team_proposed",
      updated_at: new Date().toISOString(),
    };
    await writeFile(path.join(root, source), stringifyYaml(updated), "utf8");
    results.push({ id, kind, status: updated.status, path: source });
  }
  return { command: "learning-analyze", dryRun, groups: results };
}

export async function runBackgroundLearningIfDue(
  root: string,
  force = false,
  dryRun = false,
) {
  const growth = (await loadConfig(root)).config.automatic_growth_policy;
  if (!force && growth?.enabled === false) {
    return {
      command: "learning-analyze",
      analyzed: false,
      reason: "后台学习已禁用。",
    };
  }
  const observationThreshold = growth?.background_observation_threshold ?? 20;
  const maximumAgeHours = growth?.background_max_age_hours ?? 24;
  const marker = privateAssetPath(root, "learning", "last-analysis.json");
  const observations = await listObservations(root);
  let lastCount = 0;
  if (await exists(marker)) {
    try {
      const value = JSON.parse(await readFile(marker, "utf8")) as {
        analyzedAt?: string;
        observationCount?: number;
      };
      lastCount = value.observationCount ?? 0;
    } catch {
      // 损坏会由 Health 报告，此处按需要重新分析处理。
    }
  }
  const dueByCount =
    observations.length - lastCount >= observationThreshold;
  const pendingObservations = observations.slice(lastCount);
  const oldestPendingAt = Math.min(
    ...pendingObservations
      .map((item) => Date.parse(item.observedAt))
      .filter(Number.isFinite),
  );
  const dueByAge = pendingObservations.length > 0 &&
    Number.isFinite(oldestPendingAt) &&
    Date.now() - oldestPendingAt >= maximumAgeHours * 3_600_000;
  if (!force && !dueByCount && !dueByAge) {
    return { command: "learning-analyze", analyzed: false, reason: "尚未达到后台分析阈值。" };
  }
  const result = await materializeObservationCandidates(root, dryRun);
  if (!dryRun) {
    await mkdir(path.dirname(marker), { recursive: true });
    await writeFile(marker, `${JSON.stringify({
      version: 1,
      analyzedAt: new Date().toISOString(),
      observationCount: observations.length,
    }, null, 2)}\n`, "utf8");
  }
  return { ...result, analyzed: true };
}
