import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { listFiles, exists } from "../utils/fs.js";
import { readYaml } from "../utils/yaml.js";
import { normalizeError } from "./error-normalizer.js";
import { redactSecrets } from "./secret-redactor.js";
import { readFixPatterns } from "./asset-reader.js";
import { proposeCandidate } from "./candidate-manager.js";
import { CliError } from "../errors.js";
import { relativeAssetPath, resolveAssetRoot } from "./asset-root.js";
import { loadConfig } from "./config-loader.js";
import { createInbox, listInbox } from "./learning-inbox.js";

export interface RecurringSignal {
  id: string;
  normalizedError: NonNullable<ReturnType<typeof normalizeError>>;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  affectedPaths: string[];
  relatedTasks: string[];
  relatedAudits: string[];
  status: "watching" | "recommend_fix_pattern" | "recommend_skill";
  existingFixPatternId?: string;
}

const outputSegments = ["generated", "recurring_errors", "recurring_errors.json"];

async function recurringSettings(root: string) {
  const policy = (await loadConfig(root)).config.recurring_error_policy;
  const positive = (value: number | undefined, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0
      ? value
      : fallback;
  return {
    enabled: policy?.enabled !== false,
    inboxThreshold: positive(policy?.thresholds?.inbox, 2),
    fixPatternThreshold: positive(policy?.thresholds?.propose_fix_pattern, 3),
    skillThreshold: positive(policy?.thresholds?.propose_skill, 5),
    highRiskMultiplier: positive(policy?.high_risk_multiplier, 0.5),
    maxContextRecommendations: Math.floor(
      positive(policy?.max_context_recommendations, 3),
    ),
  };
}

function effectiveThreshold(
  base: number,
  highRisk: boolean,
  multiplier: number,
): number {
  return Math.max(highRisk ? 2 : 1, Math.ceil(base * (highRisk ? multiplier : 1)));
}

async function sourceRecords(root: string) {
  const assetRoot = await resolveAssetRoot(root);
  const records: Array<{
    text: string;
    task: string;
    source: string;
    preflightId: string;
    at: string;
    paths: string[];
  }> = [];
  for (const file of await listFiles(path.join(assetRoot.path, "generated", "audits"))) {
    if (!file.endsWith(".json")) continue;
    try {
      const value = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
      if (value.outcome_status !== "failure") continue;
      const task = String(value.task ?? "");
      const outcome = typeof value.outcome === "string" ? value.outcome : "";
      if (!outcome.trim()) continue;
      records.push({
        text: redactSecrets(outcome),
        task,
        source: path.relative(root, file).replaceAll("\\", "/"),
        preflightId: String(value.preflight_id ?? value.id ?? file),
        at: String(value.created_at ?? new Date(0).toISOString()),
        paths: Array.isArray(value.changed_files) ? value.changed_files.map(String) : [],
      });
    } catch {
      // Invalid runtime records are ignored; strict validation reports formal assets.
    }
  }
  for (const { source, item: value } of await listInbox(root)) {
    try {
      if (value.created_by === "repo-agent-recurring") continue;
      const evidence = value.evidence && typeof value.evidence === "object"
        ? value.evidence as Record<string, unknown>
        : {};
      if (value.kind !== "failure" && evidence.failure !== true) continue;
      records.push({
        text: redactSecrets(String(value.observation ?? "")),
        task: String(value.task ?? ""),
        source,
        preflightId: String(evidence.preflight_id ?? value.id ?? source),
        at: String(value.created_at ?? new Date(0).toISOString()),
        paths: [],
      });
    } catch {
      // Ignore malformed inbox records during derived analysis.
    }
  }
  return records;
}

async function normalizeWithAliases(root: string, text: string) {
  const assetRoot = await resolveAssetRoot(root);
  const aliasesPath = path.join(assetRoot.path, "fix_patterns", "error_aliases.yaml");
  if (await exists(aliasesPath)) {
    try {
      const config = await readYaml<{
        aliases?: Record<string, { title?: string; keywords?: string[]; scope?: string[] }>;
      }>(aliasesPath);
      const lower = text.toLowerCase();
      for (const [key, alias] of Object.entries(config.aliases ?? {})) {
        const matched = alias.keywords?.filter((keyword) => lower.includes(keyword.toLowerCase())) ?? [];
        if (matched.length) {
          return {
            key,
            title: alias.title ?? key,
            rawSignals: [text],
            keywords: matched,
            scopePaths: alias.scope ?? [],
            confidence: 0.85,
          };
        }
      }
    } catch {
      // Invalid aliases are reported by validation; derived analysis falls back safely.
    }
  }
  return normalizeError(text);
}

export async function analyzeRecurringErrors(root: string, dryRun = false) {
  const assetRoot = await resolveAssetRoot(root);
  const outputPath = relativeAssetPath(assetRoot, ...outputSegments);
  const settings = await recurringSettings(root);
  if (!settings.enabled) {
    return { dryRun, path: outputPath, signals: [], disabled: true };
  }
  const groups = new Map<string, { normalized: NonNullable<ReturnType<typeof normalizeError>>; records: Awaited<ReturnType<typeof sourceRecords>> }>();
  for (const record of await sourceRecords(root)) {
    const normalized = await normalizeWithAliases(root, record.text);
    if (!normalized) continue;
    const group = groups.get(normalized.key) ?? { normalized, records: [] };
    if (!group.records.some((item) => item.preflightId === record.preflightId)) {
      group.records.push(record);
    }
    groups.set(normalized.key, group);
  }
  const approved = await readFixPatterns(root, "");
  const signals: RecurringSignal[] = [...groups.values()].map(({ normalized, records }) => {
    const dates = records.map((record) => record.at).sort();
    const highRisk = normalized.key.includes(".auth.");
    const fixPatternThreshold = effectiveThreshold(
      settings.fixPatternThreshold,
      highRisk,
      settings.highRiskMultiplier,
    );
    const skillThreshold = effectiveThreshold(
      settings.skillThreshold,
      highRisk,
      settings.highRiskMultiplier,
    );
    const existing = approved.find((item) =>
      item.content.toLowerCase().includes(normalized.title.toLowerCase()),
    );
    return {
      id: normalized.key.replace(/^error\./, "recurring."),
      normalizedError: normalized,
      occurrences: records.length,
      firstSeenAt: dates[0] ?? "",
      lastSeenAt: dates.at(-1) ?? "",
      affectedPaths: [...new Set(records.flatMap((record) => record.paths))],
      relatedTasks: [...new Set(records.map((record) => record.task).filter(Boolean))],
      relatedAudits: records.map((record) => record.source),
      status:
        records.length >= skillThreshold
          ? "recommend_skill" as const
          : records.length >= fixPatternThreshold
            ? "recommend_fix_pattern" as const
            : "watching" as const,
      ...(existing?.id ? { existingFixPatternId: existing.id } : {}),
    };
  }).filter((signal) => !signal.existingFixPatternId);
  if (!dryRun) {
    await mkdir(path.dirname(path.join(root, outputPath)), { recursive: true });
    await writeFile(path.join(root, outputPath), `${JSON.stringify({ generatedAt: new Date().toISOString(), signals }, null, 2)}\n`);
    for (const signal of signals.filter((item) => {
      const highRisk = item.normalizedError.key.includes(".auth.");
      return item.occurrences >= effectiveThreshold(
        settings.inboxThreshold,
        highRisk,
        settings.highRiskMultiplier,
      );
    })) {
      await createInbox(
        root,
        `重复错误：${signal.normalizedError.title}`,
        `${signal.normalizedError.title} 已出现 ${signal.occurrences} 次。`,
        false,
        {
          createdBy: "repo-agent-recurring",
          dedupeKey: signal.id,
        },
      );
    }
  }
  return { dryRun, path: outputPath, signals };
}

export async function listRecurringErrors(root: string): Promise<RecurringSignal[]> {
  const assetRoot = await resolveAssetRoot(root);
  const outputPath = relativeAssetPath(assetRoot, ...outputSegments);
  if (!(await exists(path.join(root, outputPath)))) return [];
  const value = JSON.parse(await readFile(path.join(root, outputPath), "utf8")) as { signals?: RecurringSignal[] };
  return value.signals ?? [];
}

export async function recommendRecurringErrors(root: string, task: string) {
  const assetRoot = await resolveAssetRoot(root);
  const outputPath = relativeAssetPath(assetRoot, ...outputSegments);
  const settings = await recurringSettings(root);
  if (!settings.enabled) return [];
  const taskLower = task.toLowerCase();
  const signals = await listRecurringErrors(root);
  return signals
    .filter((signal) =>
      signal.normalizedError.key === "error.auth.oauth-invalid-state"
        ? /oauth|state|auth/.test(taskLower)
        : signal.normalizedError.key
          .split(/[.-]/)
          .some((part) => part.length > 3 && taskLower.includes(part)),
    )
    .map((signal) => ({
      id: signal.id,
      normalizedErrorKey: signal.normalizedError.key,
      occurrences: signal.occurrences,
      summary: `${signal.normalizedError.title} 已出现 ${signal.occurrences} 次。`,
      affectedPaths: signal.affectedPaths,
      existingFixPatternId: signal.existingFixPatternId,
      suggestedSteps: signal.normalizedError.key === "error.auth.oauth-invalid-state"
        ? ["检查 state 的生成和存储。", "交换 token 前先校验 state。", "补充 invalid、missing 和 expired state 测试。"]
        : ["审核相关审计记录。", "补充针对性回归测试。"],
      recommendedTests: [],
      suggestedArtifacts: signal.existingFixPatternId ? [] : ["fix_pattern_candidate"],
      confidence: Math.min(0.95, signal.normalizedError.confidence + signal.occurrences * 0.03),
      trusted: false as const,
      source: outputPath,
    }))
    .slice(0, settings.maxContextRecommendations);
}

export async function proposeFromRecurring(root: string, recurringId: string, dryRun = false) {
  const signal = (await listRecurringErrors(root)).find((item) => item.id === recurringId);
  if (!signal) throw new CliError("E_INVALID_CANDIDATE", `未找到重复错误：${recurringId}`);
  const fixId = signal.normalizedError.key.replace(/^error\./, "fix.");
  return proposeCandidate({
    root,
    kind: "fix_pattern",
    id: fixId,
    value: signal.normalizedError.title,
    task: signal.relatedTasks[0],
    dryRun,
    recurrence: {
      occurrences: signal.occurrences,
      first_seen_at: signal.firstSeenAt,
      last_seen_at: signal.lastSeenAt,
      related_audits: signal.relatedAudits,
    },
  });
}
