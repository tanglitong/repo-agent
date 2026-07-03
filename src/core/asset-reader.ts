import path from "node:path";
import { readFile } from "node:fs/promises";
import { listFiles } from "../utils/fs.js";
import { readYaml } from "../utils/yaml.js";
import type { ContextItem } from "../types/context.js";
import { redactSecrets } from "./secret-redactor.js";
import { resolveAssetRoot } from "./asset-root.js";
import { CliError } from "../errors.js";
import { listCandidates } from "./candidate-manager.js";

type AssetKind = "memory" | "skill" | "fix";

const defaultWeights: Record<AssetKind, number> = {
  memory: 0.7,
  skill: 0.8,
  fix: 0.7,
};

function tokens(value: string): string[] {
  const wordTokens = value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 3);
  const cjkTokens = [...value.matchAll(/[\p{Script=Han}]{2,}/gu)]
    .flatMap(([sequence]) => {
      const characters = [...sequence];
      return [
        ...characters.slice(0, -1).map((character, index) =>
          `${character}${characters[index + 1]}`
        ),
        ...characters.slice(0, -2).map((character, index) =>
          `${character}${characters[index + 1]}${characters[index + 2]}`
        ),
      ];
    });
  return [...wordTokens, ...cjkTokens];
}

function relevance(task: string, content: string): number {
  const query = tokens(task);
  const document = tokens(content);
  if (!query.length || !document.length) return 0;
  const querySet = new Set(query);
  const documentSet = new Set(document);
  const overlap = [...querySet].filter((token) => documentSet.has(token));
  if (!overlap.length) return 0;
  const termFrequency = new Map<string, number>();
  for (const token of document) {
    termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1);
  }
  const averageLength = 120;
  const k1 = 1.2;
  const b = 0.75;
  const bm25 = overlap.reduce((sum, token) => {
    const tf = termFrequency.get(token) ?? 0;
    return sum +
      (tf * (k1 + 1)) /
        (tf + k1 * (1 - b + b * document.length / averageLength));
  }, 0) / querySet.size;
  const jaccard = overlap.length /
    new Set([...querySet, ...documentSet]).size;
  const entityMatch = [...task.matchAll(/[A-Z][A-Za-z0-9_.-]{2,}|[\w./-]+\.(?:ts|js|json|ya?ml|md)/g)]
    .some(([entity]) => content.toLowerCase().includes(entity.toLowerCase()))
    ? 1
    : 0;
  return Math.min(1, 0.55 * bm25 + 0.35 * jaccard + 0.1 * entityMatch);
}

function ranked(item: ContextItem): ContextItem {
  const relevanceScore = item.relevanceScore ?? 0;
  const relevanceValue = relevanceScore;
  const qualityScore = item.finalWeight ?? item.baseWeight ?? 0.5;
  const freshnessScore = 1;
  const scopeMatch = relevanceScore > 0 ? 1 : 0;
  const diversityScore = 1;
  return {
    ...item,
    qualityScore,
    freshnessScore,
    scopeMatch,
    diversityScore,
    retrievalRank:
      0.55 * relevanceValue +
      0.2 * qualityScore +
      0.1 * freshnessScore +
      0.1 * scopeMatch +
      0.05 * diversityScore,
  };
}

function artifactContent(value: unknown): string {
  if (!value || typeof value !== "object") return String(value ?? "");
  const record = value as Record<string, unknown>;
  const selected = [
    record.title,
    record.description,
    record.content,
    record.steps,
    record.patterns,
    record.guidance,
    record.recommendation,
  ].filter(Boolean);
  return selected
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .map(String)
    .join("\n");
}

function validateApprovedArtifact(
  value: Record<string, unknown>,
  kind: AssetKind,
  relativePath: string,
): void {
  if (typeof value.id !== "string" || value.status !== "approved") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "正式资产必须包含 id 且 status 必须为 approved。",
      relativePath,
    );
  }
  if (
    kind === "skill" &&
    (!Array.isArray(value.steps) || value.steps.length === 0)
  ) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "已批准 Skill 必须包含非空 steps。",
      relativePath,
    );
  }
  if (
    kind === "fix" &&
    (
      !Array.isArray(value.patterns) ||
      value.patterns.length === 0 ||
      !Array.isArray(value.guidance) ||
      value.guidance.length === 0
    )
  ) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "已批准 Fix Pattern 必须包含非空 patterns 和 guidance。",
      relativePath,
    );
  }
}

async function readApprovedDirectory(
  root: string,
  relativeDirectory: string,
  kind: AssetKind,
  task: string,
): Promise<ContextItem[]> {
  const assetRoot = await resolveAssetRoot(root);
  const base = path.join(assetRoot.path, relativeDirectory);
  const files = (await listFiles(base)).filter((file) => /\.(md|ya?ml)$/i.test(file));
  const items = await Promise.all(
    files.map(async (file): Promise<ContextItem> => {
      const relativePath = path.relative(root, file).replaceAll("\\", "/");
      if (/\.md$/i.test(file)) {
        const content = redactSecrets(await readFile(file, "utf8"));
        const id = relativePath.replace(/^\.repo-agent\/memories\//, "memory.")
          .replace(/\.md$/, "")
          .replaceAll("/", ".");
        return {
          id,
          source: relativePath,
          trusted: true,
          content,
          baseWeight: defaultWeights[kind],
          finalWeight: defaultWeights[kind],
          relevanceScore: relevance(task, content),
          reason: "仓库中的已批准资产。",
        };
      }
      const value = await readYaml<Record<string, unknown>>(file);
      validateApprovedArtifact(value, kind, relativePath);
      const id = typeof value.id === "string" ? value.id : undefined;
      const configuredWeight =
        typeof (value.score as Record<string, unknown> | undefined)?.final_weight === "number"
          ? ((value.score as Record<string, number>).final_weight)
          : defaultWeights[kind];
      const content = redactSecrets(artifactContent(value));
      return {
        id,
        source: relativePath,
        trusted: true,
        content,
        baseWeight: configuredWeight,
        finalWeight: configuredWeight,
        relevanceScore: relevance(task, content),
        reason: "仓库中的已批准资产。",
      };
    }),
  );
  return items.map(ranked).sort((a, b) => {
    const relevanceDifference = relevance(task, b.content) - relevance(task, a.content);
    return relevanceDifference || (b.finalWeight ?? 0) - (a.finalWeight ?? 0);
  });
}

export const readMemories = (root: string, task: string) =>
  readApprovedDirectory(root, "memories", "memory", task);
export const readSkills = (root: string, task: string) =>
  readApprovedDirectory(root, "skills/approved", "skill", task);
export const readFixPatterns = (root: string, task: string) =>
  readApprovedDirectory(root, "fix_patterns/approved", "fix", task);

export async function readCandidateSuggestions(
  root: string,
  task: string,
  limit: number,
): Promise<ContextItem[]> {
  const candidates = (
    await Promise.all(
      (["memory", "skill", "fix_pattern"] as const).map((kind) =>
        listCandidates(root, kind)
      ),
    )
  ).flat();
  const injectionPattern =
    /(忽略.{0,8}(规则|指令)|ignore.{0,8}(instruction|policy)|读取.{0,8}(密钥|secret)|绕过.{0,8}(策略|policy))/i;
  const items = await Promise.all(
    candidates
      .filter(({ candidate }) =>
        ["candidate", "validated", "team_proposed"].includes(
          String(candidate.status),
        )
      )
      .map(async ({ source, candidate: value }): Promise<ContextItem> => {
        const content = redactSecrets(artifactContent(value));
        const quarantined = injectionPattern.test(content);
        return ranked({
          id:
            typeof value.candidate_id === "string"
              ? value.candidate_id
              : typeof value.id === "string"
                ? value.id
                : undefined,
          source,
          trusted: false,
          content: quarantined
            ? "该候选包含疑似提示注入内容，已隔离。"
            : content,
          finalWeight:
            typeof (value.score as Record<string, unknown> | undefined)?.final_weight === "number"
              ? (value.score as Record<string, number>).final_weight
              : 0.3,
          relevanceScore: relevance(task, content),
          reason: quarantined
            ? "候选已隔离，不得作为建议执行。"
            : "尚未审核的候选内容，仅供参考。",
        });
      }),
  );
  return items
    .filter((item) =>
      !item.reason?.includes("已隔离") && (item.relevanceScore ?? 0) > 0
    )
    .sort((a, b) => (b.retrievalRank ?? 0) - (a.retrievalRank ?? 0))
    .slice(0, limit);
}
