import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import {
  appendFile,
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { privateAssetPath } from "./asset-root.js";
import { exists } from "../utils/fs.js";
import { loadConfig } from "./config-loader.js";

export type EvidenceType =
  | "retrieved"
  | "applied"
  | "validated_success"
  | "validated_failure"
  | "contradicted"
  | "review_approved";

export interface EvidenceEvent {
  version: 1;
  evidenceId: string;
  assetId: string;
  preflightId: string;
  sessionId: string;
  occurredAt: string;
  type: EvidenceType;
  outcomeSource: "test" | "user" | "agent" | "review";
  confidence: number;
}

export interface AssetEvidenceSummary {
  assetId: string;
  retrieved: number;
  applied: number;
  validatedSuccess: number;
  validatedFailure: number;
  contradicted: number;
  reviewApproved: number;
  distinctValidatedUse: number;
  lastAppliedAt?: string;
  qualityLowerBound: number;
  freshness: number;
  reviewTrust: number;
  lifecycleHealth: number;
}

const eventsPath = (root: string) =>
  privateAssetPath(root, "evidence", "events.jsonl");
const materializedPath = (root: string) =>
  privateAssetPath(root, "evidence", "materialized.json");

export function evidenceId(input: {
  assetId: string;
  preflightId: string;
  type: EvidenceType;
}) {
  return createHash("sha256")
    .update(`${input.preflightId}\n${input.assetId}\n${input.type}`)
    .digest("hex");
}

export async function readEvidenceEvents(root: string): Promise<EvidenceEvent[]> {
  const file = eventsPath(root);
  if (!(await exists(file))) return [];
  const events: EvidenceEvent[] = [];
  for (const line of (await readFile(file, "utf8")).split("\n").filter(Boolean)) {
    try {
      const event = JSON.parse(line) as EvidenceEvent;
      if (event.version === 1 && event.evidenceId) events.push(event);
    } catch {
      // Health performs the explicit corruption reporting.
    }
  }
  return events;
}

async function withLock<T>(root: string, operation: () => Promise<T>) {
  const lock = privateAssetPath(root, "evidence", "events.lock");
  await mkdir(path.dirname(lock), { recursive: true });
  let handle;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      handle = await open(lock, "wx");
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  if (!handle) throw new Error("Evidence 账本正被其他进程占用。");
  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink(lock).catch(() => undefined);
  }
}

export async function appendEvidence(
  root: string,
  inputs: Array<Omit<EvidenceEvent, "version" | "evidenceId" | "occurredAt"> & {
    evidenceId?: string;
    occurredAt?: string;
  }>,
) {
  if (!inputs.length) return { appended: 0, duplicates: 0 };
  return withLock(root, async () => {
    const existing = await readEvidenceEvents(root);
    const seen = new Set(existing.map((item) => item.evidenceId));
    const additions: EvidenceEvent[] = [];
    let duplicates = 0;
    for (const input of inputs) {
      const id = input.evidenceId ?? evidenceId(input);
      if (seen.has(id)) {
        duplicates += 1;
        continue;
      }
      seen.add(id);
      additions.push({
        version: 1,
        evidenceId: id,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        assetId: input.assetId,
        preflightId: input.preflightId,
        sessionId: input.sessionId,
        type: input.type,
        outcomeSource: input.outcomeSource,
        confidence: Math.max(0, Math.min(1, input.confidence)),
      });
    }
    if (additions.length) {
      const file = eventsPath(root);
      await mkdir(path.dirname(file), { recursive: true });
      await appendFile(
        file,
        additions.map((item) => JSON.stringify(item)).join("\n") + "\n",
        "utf8",
      );
      await materializeEvidence(root, [...existing, ...additions]);
    }
    return { appended: additions.length, duplicates };
  });
}

function logGamma(value: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];
  if (value < 0.5) {
    return Math.log(Math.PI) -
      Math.log(Math.sin(Math.PI * value)) -
      logGamma(1 - value);
  }
  let x = 0.9999999999998099;
  const shifted = value - 1;
  for (const [index, coefficient] of coefficients.entries()) {
    x += coefficient / (shifted + index + 1);
  }
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) +
    (shifted + 0.5) * Math.log(t) -
    t +
    Math.log(x);
}

function betaFraction(a: number, b: number, x: number) {
  const maximumIterations = 120;
  const epsilon = 3e-10;
  const floor = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < floor) d = floor;
  d = 1 / d;
  let h = d;
  for (let iteration = 1; iteration <= maximumIterations; iteration += 1) {
    const twice = 2 * iteration;
    let aa = iteration * (b - iteration) * x /
      ((qam + twice) * (a + twice));
    d = 1 + aa * d;
    if (Math.abs(d) < floor) d = floor;
    c = 1 + aa / c;
    if (Math.abs(c) < floor) c = floor;
    d = 1 / d;
    h *= d * c;
    aa = -(a + iteration) * (qab + iteration) * x /
      ((a + twice) * (qap + twice));
    d = 1 + aa * d;
    if (Math.abs(d) < floor) d = floor;
    c = 1 + aa / c;
    if (Math.abs(c) < floor) c = floor;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return h;
}

function regularizedBeta(x: number, a: number, b: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) +
      a * Math.log(x) + b * Math.log(1 - x),
  );
  return x < (a + 1) / (a + b + 2)
    ? front * betaFraction(a, b, x) / a
    : 1 - front * betaFraction(b, a, 1 - x) / b;
}

function lowerBound(success: number, failure: number) {
  const alpha = success + 2;
  const beta = failure + 2;
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const middle = (low + high) / 2;
    if (regularizedBeta(middle, alpha, beta) < 0.1) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function summarizeAssetEvidence(
  assetId: string,
  events: EvidenceEvent[],
  now = Date.now(),
  freshnessHalfLifeDays = 180,
): AssetEvidenceSummary {
  const selected = events.filter((item) => item.assetId === assetId);
  const count = (type: EvidenceType) =>
    selected.filter((item) => item.type === type).length;
  const successes = count("validated_success");
  const failures = count("validated_failure");
  const applied = selected.filter((item) =>
    ["applied", "validated_success", "validated_failure"].includes(item.type)
  );
  const lastAppliedAt = applied.map((item) => item.occurredAt).sort().at(-1);
  const ageDays = lastAppliedAt
    ? Math.max(0, (now - Date.parse(lastAppliedAt)) / 86_400_000)
    : 365;
  const freshness = 0.5 ** (ageDays / freshnessHalfLifeDays);
  const distinctValidatedUse = new Set(
    selected.filter((item) =>
      item.type === "validated_success" || item.type === "validated_failure"
    ).map((item) => item.preflightId),
  ).size;
  const qualityLowerBound = lowerBound(successes, failures);
  const reviewTrust = Math.min(1, count("review_approved"));
  const contradictionPenalty = Math.min(0.6, count("contradicted") * 0.15);
  const lifecycleHealth = Math.max(
    0,
    Math.min(
      1,
      0.4 * qualityLowerBound +
        0.25 * (1 - Math.exp(-distinctValidatedUse / 8)) +
        0.2 * freshness +
        0.15 * reviewTrust -
        contradictionPenalty,
    ),
  );
  return {
    assetId,
    retrieved: count("retrieved"),
    applied: count("applied"),
    validatedSuccess: successes,
    validatedFailure: failures,
    contradicted: count("contradicted"),
    reviewApproved: count("review_approved"),
    distinctValidatedUse,
    ...(lastAppliedAt ? { lastAppliedAt } : {}),
    qualityLowerBound,
    freshness,
    reviewTrust,
    lifecycleHealth,
  };
}

export async function materializeEvidence(
  root: string,
  events?: EvidenceEvent[],
) {
  const sourceEvents = events ?? (await readEvidenceEvents(root));
  const halfLifeDays =
    (await loadConfig(root)).config.evidence_policy
      ?.freshness_half_life_days ?? 180;
  const ids = [...new Set(sourceEvents.map((item) => item.assetId))];
  const value = {
    version: 1,
    generatedAt: new Date().toISOString(),
    assets: Object.fromEntries(
      ids.map((id) => [
        id,
        summarizeAssetEvidence(id, sourceEvents, Date.now(), halfLifeDays),
      ]),
    ),
  };
  const file = materializedPath(root);
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, file);
  return value;
}

export async function explainEvidence(root: string, assetId: string) {
  const events = await readEvidenceEvents(root);
  const halfLifeDays =
    (await loadConfig(root)).config.evidence_policy
      ?.freshness_half_life_days ?? 180;
  return {
    modelVersion: 1,
    summary: summarizeAssetEvidence(
      assetId,
      events,
      Date.now(),
      halfLifeDays,
    ),
    events: events.filter((item) => item.assetId === assetId),
  };
}
