export interface ConflictNote {
  type: "candidate_duplicate" | "local_vs_project" | "config_conflict";
  winner: string;
  loser: string;
  reason: string;
  suggestedAction: "ignore_loser" | "manual_review" | "reject_candidate";
}

export function localPolicyConflicts(local: Record<string, unknown>): ConflictNote[] {
  const conflicts: ConflictNote[] = [];
  const audit = local.audit as Record<string, unknown> | undefined;
  const network = local.network as Record<string, unknown> | undefined;
  const serialized = JSON.stringify(local);
  if (
    audit?.enabled === false ||
    network?.mode === "unrestricted" ||
    /"dangerous_commands"\s*:/.test(serialized) ||
    /"protected_files"\s*:/.test(serialized)
  ) {
    conflicts.push({
      type: "local_vs_project",
      winner: "仓库正式治理策略",
      loser: "本地覆盖配置",
      reason: "个人配置只能收紧项目策略，不能放宽。",
      suggestedAction: "ignore_loser",
    });
  }
  return conflicts;
}
