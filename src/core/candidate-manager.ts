import path from "node:path";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { exists, listFiles, writeFileExclusive } from "../utils/fs.js";
import { readYaml, stringifyYaml } from "../utils/yaml.js";
import { containsPossibleSecret } from "./secret-redactor.js";
import { CliError } from "../errors.js";
import { getGitCommit } from "../utils/git.js";
import {
  privateAssetPath,
  relativeAssetPath,
  resolveAssetRoot,
} from "./asset-root.js";

export type CandidateKind = "memory" | "skill" | "fix_pattern";
export type CandidateVisibility = "private" | "team";
export type CandidateReviewAction =
  | "approve"
  | "reject"
  | "archive"
  | "merge";

const locations: Record<CandidateKind, string> = {
  memory: "memory_candidates",
  skill: "skills/candidates",
  fix_pattern: "fix_patterns/candidates",
};

const prefixes: Record<CandidateKind, string> = {
  memory: "memory.",
  skill: "skill.",
  fix_pattern: "fix.",
};

function validateId(kind: CandidateKind, id: string): void {
  const expression = /^(memory|skill|fix)\.[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
  if (!expression.test(id) || !id.startsWith(prefixes[kind])) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      `${kind} id 无效，请使用 ${prefixes[kind]}<scope>.<short-slug> 格式。`,
    );
  }
}

function dateParts(): { iso: string; compact: string; time: string } {
  const now = new Date();
  return {
    iso: now.toISOString(),
    compact: now.toISOString().slice(0, 10).replaceAll("-", ""),
    time: now.toISOString().slice(11, 19).replaceAll(":", ""),
  };
}

function candidateFingerprint(
  kind: CandidateKind,
  id: string,
  value: string,
): string {
  return createHash("sha256")
    .update(`${kind}\n${id}\n${value.toLowerCase().replace(/\s+/g, " ").trim()}`)
    .digest("hex");
}

function containsPromptInjection(value: string): boolean {
  return /(忽略|绕过|覆盖).{0,12}(policy|规则|指令|system)|读取.{0,12}(密钥|token|secret)|ignore.{0,12}(previous|system)|reveal.{0,12}(secret|token)/iu.test(
    value,
  );
}

async function approvedTarget(
  root: string,
  kind: CandidateKind,
  id: string,
): Promise<{ relativePath: string; sha256?: string }> {
  const assetRoot = await resolveAssetRoot(root);
  const slug = id.split(".").slice(1).join(".");
  const relativePath = kind === "memory"
    ? relativeAssetPath(assetRoot, "memories", `${slug}.md`)
    : kind === "skill"
      ? relativeAssetPath(assetRoot, "skills", "approved", `${slug}.yaml`)
      : relativeAssetPath(
        assetRoot,
        "fix_patterns",
        "approved",
        `${slug}.yaml`,
      );
  const target = path.join(root, relativePath);
  return {
    relativePath,
    ...(await exists(target)
      ? {
          sha256: createHash("sha256")
            .update(await readFile(target))
            .digest("hex"),
        }
      : {}),
  };
}

export async function listCandidates(root: string, kind: CandidateKind) {
  const assetRoot = await resolveAssetRoot(root);
  const roots: Array<{ directory: string; visibility: CandidateVisibility }> = [
    {
      directory: path.join(assetRoot.path, locations[kind]),
      visibility: "team",
    },
    {
      directory: privateAssetPath(root, locations[kind]),
      visibility: "private",
    },
    {
      directory: privateAssetPath(root, "quarantine", locations[kind]),
      visibility: "private",
    },
  ];
  const files = (
    await Promise.all(roots.map(async ({ directory, visibility }) =>
      (await listFiles(directory))
        .filter((file) => /\.ya?ml$/i.test(file))
        .map((file) => ({ file, visibility }))
    ))
  ).flat();
  return Promise.all(
    files.map(async ({ file, visibility }) => ({
      source: path.relative(root, file).replaceAll("\\", "/"),
      visibility,
      candidate: await readYaml<Record<string, unknown>>(file),
    })),
  );
}

export async function listApproved(root: string, kind: "skill" | "fix_pattern") {
  const assetRoot = await resolveAssetRoot(root);
  const relativeDirectory =
    kind === "skill" ? "skills/approved" : "fix_patterns/approved";
  const files = (await listFiles(path.join(assetRoot.path, relativeDirectory))).filter((file) =>
    /\.ya?ml$/i.test(file),
  );
  return Promise.all(
    files.map(async (file) => ({
      source: path.relative(root, file).replaceAll("\\", "/"),
      artifact: await readYaml<Record<string, unknown>>(file),
    })),
  );
}

export async function detectDuplicateCandidates(root: string) {
  const all = (
    await Promise.all(
      (["memory", "skill", "fix_pattern"] as CandidateKind[]).map((kind) =>
        listCandidates(root, kind),
      ),
    )
  ).flat();
  const grouped = new Map<string, Array<{ source: string; fingerprint: string }>>();
  for (const { source, candidate } of all) {
    const id = String(candidate.id ?? "");
    if (!id) continue;
    grouped.set(id, [
      ...(grouped.get(id) ?? []),
      { source, fingerprint: String(candidate.fingerprint ?? "") },
    ]);
  }
  return [...grouped.entries()]
    .filter(([, items]) =>
      items.length > 1 &&
      new Set(items.map((item) => item.fingerprint)).size > 1
    )
    .map(([id, items]) => ({ id, sources: items.map((item) => item.source) }));
}

export async function proposeCandidate(options: {
  root: string;
  kind: CandidateKind;
  id: string;
  value: string;
  task?: string;
  scope?: string[];
  dryRun?: boolean;
  proposedBy?: string;
  recurrence?: Record<string, unknown>;
  visibility?: CandidateVisibility;
}) {
  validateId(options.kind, options.id);
  if (!options.value.trim()) {
    throw new CliError("E_INVALID_CANDIDATE", "候选内容不能为空。");
  }
  if (containsPossibleSecret(options.value)) {
    throw new CliError(
      "E_SECRET_DETECTED",
      "候选内容可能包含敏感信息，请移除后重试。",
    );
  }
  const quarantined = containsPromptInjection(options.value);
  const existing = await listCandidates(options.root, options.kind);
  const requestedVisibility = options.visibility ?? "private";
  if (existing.some(({ candidate, visibility }) =>
    visibility === requestedVisibility &&
    candidate.id === options.id &&
    ["candidate", "validated", "team_proposed"].includes(String(candidate.status))
  )) {
    throw new CliError("E_DUPLICATE_CANDIDATE", `${options.id} 的候选已经存在。`);
  }

  const date = dateParts();
  const assetRoot = await resolveAssetRoot(options.root);
  const visibility = quarantined ? "private" : requestedVisibility;
  const kindLabel = options.kind === "fix_pattern" ? "fix" : options.kind;
  const fingerprint = candidateFingerprint(
    options.kind,
    options.id,
    options.value,
  );
  const filename = `cand_${kindLabel}_${fingerprint.slice(0, 24)}.yaml`;
  const target = quarantined
    ? privateAssetPath(
        options.root,
        "quarantine",
        locations[options.kind],
        filename,
      )
    : visibility === "team"
    ? path.join(assetRoot.path, locations[options.kind], filename)
    : privateAssetPath(options.root, locations[options.kind], filename);
  const relativePath = path.relative(options.root, target).replaceAll("\\", "/");
  const candidateId = `candidate.${kindLabel}.${fingerprint.slice(0, 24)}`;
  const baseRevision = await approvedTarget(
    options.root,
    options.kind,
    options.id,
  );
  const common = {
    id: options.id,
    candidate_id: candidateId,
    status: quarantined
      ? "quarantined"
      : requestedVisibility === "team"
        ? "team_proposed"
        : "candidate",
    trusted: false,
    type: options.kind,
    scope: options.scope ?? [],
    base_revision: {
      path: baseRevision.relativePath,
      sha256: baseRevision.sha256 ?? null,
    },
  };
  const specific =
    options.kind === "memory"
      ? { content: options.value }
      : options.kind === "skill"
        ? { description: options.value, steps: [options.value] }
        : {
            pattern: options.value,
            recommendation: "审核错误上下文，并补充回归测试。",
            ...(options.recurrence ? { recurrence: options.recurrence } : {}),
          };
  const candidate = {
    ...common,
    fingerprint,
    ...(quarantined
      ? { quarantine_reason: "检测到提示注入或绕过治理策略的指令性文本。" }
      : {}),
    ...specific,
    evidence: {
      task: options.task ?? "",
      source: "agent",
      changed_files: [],
      tests: [],
      audit: "",
      review_request: null,
    },
    review: {
      required: true,
      reviewers: ["codeowners"],
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      merged_into: null,
      review_request: null,
    },
    score: {
      confidence: 0.5,
      usefulness: 0.5,
      freshness: 1,
      recurrence: 0,
      success_rate: 0,
      final_weight: 0.3,
    },
    proposed_by: options.proposedBy ?? "agent",
    created_at: date.iso,
  };

  if (!options.dryRun) {
    if (await exists(path.join(options.root, relativePath))) {
      throw new CliError("E_DUPLICATE_CANDIDATE", `候选路径已经存在：${relativePath}`);
    }
    await writeFileExclusive(path.join(options.root, relativePath), stringifyYaml(candidate));
  }
  return {
    kind: options.kind,
    visibility,
    dryRun: Boolean(options.dryRun),
    path: relativePath,
    candidate,
  };
}

export async function upsertLearningCandidate(options: {
  root: string;
  classification: "memory_candidate" | "skill_candidate" | "fix_pattern_candidate";
  task: string;
  observation: string;
  teamPromotionThreshold?: number;
}) {
  const kind: CandidateKind =
    options.classification === "memory_candidate"
      ? "memory"
      : options.classification === "skill_candidate"
        ? "skill"
        : "fix_pattern";
  const digest = createHash("sha256")
    .update(
      `${options.classification}\n${options.observation
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()}`,
    )
    .digest("hex")
    .slice(0, 16);
  const id = `${prefixes[kind]}learned.${digest}`;
  const candidates = await listCandidates(options.root, kind);
  let privateMatch = candidates.find(
    ({ visibility, candidate }) =>
      visibility === "private" &&
      candidate.id === id &&
      candidate.status === "candidate",
  );
  if (!privateMatch) {
    const proposed = await proposeCandidate({
      root: options.root,
      kind,
      id,
      value: options.observation,
      task: options.task,
      proposedBy: "repo-agent-learning",
      visibility: "private",
    });
    privateMatch = {
      source: proposed.path,
      visibility: "private",
      candidate: proposed.candidate,
    };
  }
  const now = new Date().toISOString();
  const previousScore =
    privateMatch.candidate.score &&
      typeof privateMatch.candidate.score === "object"
      ? privateMatch.candidate.score as Record<string, unknown>
      : {};
  const previousEvidence =
    privateMatch.candidate.evidence &&
      typeof privateMatch.candidate.evidence === "object"
      ? privateMatch.candidate.evidence as Record<string, unknown>
      : {};
  const occurrences = Math.max(
    0,
    Number(previousEvidence.occurrences ?? previousScore.recurrence ?? 0),
  ) + 1;
  const updated = {
    ...privateMatch.candidate,
    score: {
      ...previousScore,
      confidence: Math.min(0.95, 0.5 + occurrences * 0.05),
      usefulness: Math.min(0.9, 0.5 + occurrences * 0.04),
      recurrence: occurrences,
      final_weight: Math.min(0.8, 0.3 + occurrences * 0.05),
    },
    evidence: {
      ...previousEvidence,
      task: options.task,
      occurrences,
      last_seen_at: now,
    },
    updated_at: now,
  };
  await writeFile(
    path.join(options.root, privateMatch.source),
    stringifyYaml(updated),
    "utf8",
  );

  const threshold = Math.max(1, options.teamPromotionThreshold ?? 3);
  return {
    kind,
    id,
    occurrences,
    privatePath: privateMatch.source,
    promotionEligible: occurrences >= threshold,
    teamPath: undefined,
  };
}

export async function promoteCandidate(options: {
  root: string;
  id: string;
  reviewer?: string;
  dryRun?: boolean;
}) {
  const all = (
    await Promise.all(
      (["memory", "skill", "fix_pattern"] as CandidateKind[]).map((kind) =>
        listCandidates(options.root, kind).then((items) =>
          items.map((item) => ({ ...item, kind }))
        )
      ),
    )
  ).flat();
  const match = all.find(({ visibility, candidate }) =>
    visibility === "private" &&
    (candidate.candidate_id === options.id || candidate.id === options.id)
  );
  if (!match) {
    throw new CliError("E_INVALID_CANDIDATE", `未找到私人候选：${options.id}`);
  }
  const evidence = match.candidate.evidence &&
      typeof match.candidate.evidence === "object"
    ? match.candidate.evidence as Record<string, unknown>
    : {};
  const occurrences = Number(evidence.occurrences ?? 0);
  const distinctPreflights = Array.isArray(evidence.preflight_ids)
    ? new Set(evidence.preflight_ids.map(String)).size
    : occurrences;
  const dates = Array.isArray(evidence.observed_dates)
    ? new Set(evidence.observed_dates.map(String)).size
    : 0;
  if (distinctPreflights < 3 || dates < 2) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "候选尚未达到晋升条件：需要 3 个不同 Preflight 且覆盖 2 个日期。",
    );
  }
  const assetRoot = await resolveAssetRoot(options.root);
  const fingerprint = String(match.candidate.fingerprint ??
    createHash("sha256").update(String(match.candidate.id)).digest("hex"));
  const target = path.join(
    assetRoot.path,
    locations[match.kind],
    `cand_${match.kind === "fix_pattern" ? "fix" : match.kind}_${fingerprint.slice(0, 24)}.yaml`,
  );
  const relative = path.relative(options.root, target).replaceAll("\\", "/");
  const promoted = {
    ...match.candidate,
    status: "team_proposed",
    trusted: false,
    promoted_from: match.source,
    promoted_by: options.reviewer ?? "manual-promotion",
    promoted_at: new Date().toISOString(),
    single_author: true,
  };
  if (!options.dryRun) {
    if (await exists(target)) {
      const current = await readYaml<Record<string, unknown>>(target);
      if (current.fingerprint !== match.candidate.fingerprint) {
        throw new CliError("E_UPGRADE_CONFLICT", `团队候选内容冲突：${relative}`);
      }
    } else {
      await writeFileExclusive(target, stringifyYaml(promoted));
    }
  }
  return { command: "candidate-promote", dryRun: Boolean(options.dryRun), path: relative, candidate: promoted };
}

export async function reviewCandidate(options: {
  root: string;
  kind: CandidateKind;
  id: string;
  action: CandidateReviewAction;
  mergedInto?: string;
  reviewer?: string;
  dryRun?: boolean;
}) {
  const matches = (await listCandidates(options.root, options.kind)).filter(
    ({ candidate }) =>
      candidate.candidate_id === options.id || candidate.id === options.id,
  );
  if (matches.length === 0) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      `未找到候选资产：${options.id}`,
    );
  }
  if (matches.length > 1) {
    throw new CliError(
      "E_UPGRADE_CONFLICT",
      `候选标识不唯一，请使用 candidate_id：${options.id}`,
    );
  }
  if (options.action === "merge" && !options.mergedInto) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "merge 操作必须提供 --merged-into。",
    );
  }
  const match = matches[0];
  if (options.action === "approve" && match.visibility === "private") {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "私人 Candidate 不允许直接批准，请先执行 candidate promote。",
    );
  }
  const now = new Date().toISOString();
  const reviewer = options.reviewer ?? "manual-review";
  const gitCommit = await getGitCommit(options.root);
  if (
    options.action === "approve" &&
    String(match.candidate.proposed_by ?? "") === reviewer
  ) {
    throw new CliError("E_INVALID_CANDIDATE", "团队 Candidate 必须由非生成者审核。");
  }
  const review = match.candidate.review &&
      typeof match.candidate.review === "object"
    ? match.candidate.review as Record<string, unknown>
    : {};
  let status: string;
  let approvedPath: string | undefined;
  if (options.action === "approve") {
    status = "approved";
    const targetId = String(match.candidate.id);
    const targetRevision = await approvedTarget(
      options.root,
      options.kind,
      targetId,
    );
    const relativeTarget = targetRevision.relativePath;
    const target = path.join(options.root, relativeTarget);
    const baseRevision = match.candidate.base_revision &&
        typeof match.candidate.base_revision === "object"
      ? match.candidate.base_revision as Record<string, unknown>
      : {};
    if (
      targetRevision.sha256 &&
      baseRevision.sha256 !== targetRevision.sha256
    ) {
      throw new CliError(
        "E_UPGRADE_CONFLICT",
        `正式资产在候选创建后发生变化，必须先人工合并：${relativeTarget}`,
        relativeTarget,
      );
    }
    const approved = options.kind === "memory"
      ? `# ${targetId}\n\n${String(match.candidate.content ?? "")}\n`
      : options.kind === "skill"
        ? stringifyYaml({
            id: targetId,
            version: 1,
            status: "approved",
            title: String(
              match.candidate.description ?? targetId,
            ),
            steps: Array.isArray(match.candidate.steps)
              ? match.candidate.steps
              : [String(match.candidate.description ?? "")],
            approved_at: now,
            approved_by: reviewer,
          })
        : stringifyYaml({
            id: targetId,
            version: 1,
            status: "approved",
            title: String(match.candidate.pattern ?? targetId),
            patterns: [String(match.candidate.pattern ?? "")],
            guidance: [String(match.candidate.recommendation ?? "")],
            approved_at: now,
            approved_by: reviewer,
          });
    if (!options.dryRun) {
      if (targetRevision.sha256) {
        await writeFile(target, approved, "utf8");
      } else {
        await writeFileExclusive(target, approved);
      }
    }
    approvedPath = relativeTarget;
  } else if (options.action === "reject") {
    status = "rejected";
  } else if (options.action === "archive") {
    status = "archived";
  } else {
    const mergeTarget = await approvedTarget(
      options.root,
      options.kind,
      options.mergedInto!,
    );
    if (!(await exists(path.join(options.root, mergeTarget.relativePath)))) {
      throw new CliError("E_INVALID_CANDIDATE", "merge 目标资产不存在。");
    }
    status = "merged";
  }
  const updated = {
    ...match.candidate,
    status,
    review: {
      ...review,
      ...(options.action === "approve"
        ? {
            approved_by: reviewer,
            approved_at: now,
            git_commit: gitCommit,
            base_revision: match.candidate.base_revision ?? null,
          }
        : {}),
      ...(options.action === "reject"
        ? { rejected_by: reviewer, rejected_at: now }
        : {}),
      ...(options.action === "merge"
        ? { merged_into: options.mergedInto }
        : {}),
    },
    updated_at: now,
  };
  if (!options.dryRun) {
    await writeFile(
      path.join(options.root, match.source),
      stringifyYaml(updated),
      "utf8",
    );
  }
  return {
    action: options.action,
    dryRun: Boolean(options.dryRun),
    source: match.source,
    approvedPath,
    candidate: updated,
  };
}
