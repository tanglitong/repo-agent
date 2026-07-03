import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { loadConfig } from "./config-loader.js";
import { redactSecretValues } from "./secret-redactor.js";
import { normalizeRepoPath } from "../utils/path-match.js";
import { CliError } from "../errors.js";
import { relativeAssetPath, resolveAssetRoot } from "./asset-root.js";

export async function recordTrace(
  root: string,
  input: Record<string, unknown>,
): Promise<{
  command: "record-trace";
  recorded: boolean;
  dryRun?: boolean;
  path?: string;
  auditId?: string;
}> {
  const loaded = await loadConfig(root);
  const assetRoot = await resolveAssetRoot(root);
  if (loaded.config.audit?.enabled === false) {
    return { command: "record-trace", recorded: false };
  }
  const now = new Date();
  const rawOutcomeStatus = input.outcomeStatus ?? input.outcome_status ?? "success";
  if (!["success", "failure", "partial"].includes(String(rawOutcomeStatus))) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "outcomeStatus 只能是 success、failure 或 partial。",
    );
  }
  const outcomeStatus = String(rawOutcomeStatus) as
    | "success"
    | "failure"
    | "partial";
  const auditId = `audit.${now.toISOString().slice(0, 10).replaceAll("-", "")}.${now
    .toISOString()
    .slice(11, 23)
    .replaceAll(":", "")
    .replace(".", "")}.${randomUUID()}`;
  let relativeDirectory: string;
  try {
    relativeDirectory = normalizeRepoPath(
      loaded.config.audit?.write_to ?? relativeAssetPath(assetRoot, "generated", "audits"),
    );
  } catch {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "audit.write_to 必须是仓库相对路径，且不能包含 `..`。",
      relativeAssetPath(assetRoot, "config.yaml"),
    );
  }
  const relativePath = `${relativeDirectory}/${auditId}.json`;
  const audit = {
    id: auditId,
    created_at: now.toISOString(),
    preflight_id: input.preflightId ?? input.preflight_id ?? null,
    session_id: input.sessionId ?? input.session_id ?? null,
    task: input.task ?? "",
    changed_files: input.changedFiles ?? [],
    used_memories: input.usedMemories ?? [],
    used_skills: input.usedSkills ?? [],
    used_fix_patterns: input.usedFixPatterns ?? [],
    policy_checks: input.policyChecks ?? [],
    risk_result: input.risk ?? null,
    commit_options: input.commitOptions ?? null,
    generated_candidates: input.generatedCandidates ?? [],
    conflict_notes: input.conflictNotes ?? [],
    secret_redaction_note: "疑似敏感值已脱敏。",
    team_shared_assets_used: input.teamSharedAssetsUsed ?? [],
    personal_settings_used: input.personalSettingsUsed ?? [],
    outcome_status: outcomeStatus,
    outcome: input.outcome ?? null,
  };
  if (input.dryRun === true) {
    return {
      command: "record-trace",
      recorded: false,
      dryRun: true,
      path: relativePath,
      auditId,
    };
  }
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(
    target,
    `${JSON.stringify(redactSecretValues(audit), null, 2)}\n`,
    "utf8",
  );
  return {
    command: "record-trace",
    recorded: true,
    path: relativePath,
    auditId,
  };
}
