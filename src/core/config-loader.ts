import path from "node:path";
import { exists } from "../utils/fs.js";
import { readYaml } from "../utils/yaml.js";
import { CliError } from "../errors.js";
import { relativeAssetPath, resolveAssetRoot } from "./asset-root.js";
import { stat } from "node:fs/promises";

export interface AgentConfig {
  version: number;
  mode: "personal" | "team";
  network?: { mode?: string; allow?: string[]; deny?: string[] };
  context?: {
    include_candidate_suggestions?: boolean;
    max_candidate_suggestions?: number;
    min_relevance?: number;
    max_items?: {
      memories?: number;
      skills?: number;
      fix_patterns?: number;
      candidate_suggestions?: number;
    };
    budget?: { max_chars?: number; max_tokens_estimate?: number };
  };
  audit?: {
    enabled?: boolean;
    write_to?: string;
  };
  recurring_error_policy?: {
    enabled?: boolean;
    thresholds?: {
      inbox?: number;
      propose_fix_pattern?: number;
      propose_skill?: number;
    };
    high_risk_multiplier?: number;
    include_in_context?: boolean;
    max_context_recommendations?: number;
  };
  automatic_growth_policy?: {
    enabled?: boolean;
    validated_preflights?: number;
    validated_days?: number;
    background_observation_threshold?: number;
    background_max_age_hours?: number;
  };
  asset_lifecycle_policy?: {
    enabled?: boolean;
    private_automatic_cleanup?: boolean;
    team_proposal_only?: boolean;
    thresholds?: {
      stale?: number;
      archive?: number;
    };
    durations_days?: {
      stale?: number;
      archive?: number;
      delete?: number;
      private_retention?: number;
    };
  };
  closure_policy?: {
    abandon_after_hours?: number;
    max_events_per_preflight?: number;
    max_event_bytes?: number;
  };
  evidence_policy?: {
    freshness_half_life_days?: number;
  };
}

export interface CommitPolicyConfig {
  version: number;
  default_mode: "ask" | "keep_local";
  allow_direct_commit_for?: string[];
  require_review_request_for?: string[];
  always_ask_before_commit?: boolean;
}

export interface ProtectedFilesConfig {
  version: number;
  protected_files?: string[];
}

export interface CommandPolicyConfig {
  version: number;
  dangerous_commands?: string[];
  default_action?: string;
}

export interface LoadedConfig {
  config: AgentConfig;
  commitPolicy: CommitPolicyConfig;
  protectedFiles: ProtectedFilesConfig;
  commandPolicy: CommandPolicyConfig;
}

interface CacheEntry {
  signature: string;
  value: LoadedConfig;
}

const configCache = new Map<string, CacheEntry>();

export function invalidateConfigCache(root?: string): void {
  if (root === undefined) configCache.clear();
  else configCache.delete(root);
}

async function fileSignature(target: string): Promise<string> {
  try {
    const info = await stat(target);
    return `${info.size}:${info.mtimeMs}`;
  } catch {
    return "missing";
  }
}

async function configSignature(agentRoot: string): Promise<string> {
  const targets = [
    path.join(agentRoot, "config.yaml"),
    path.join(agentRoot, "commit_policy.yaml"),
    path.join(agentRoot, "policies", "protected_files.yaml"),
    path.join(agentRoot, "policies", "command_policy.yaml"),
  ];
  const parts = await Promise.all(targets.map(fileSignature));
  return parts.join("|");
}

export async function loadConfig(root: string): Promise<LoadedConfig> {
  const assetRoot = await resolveAssetRoot(root);
  const signature = await configSignature(assetRoot.path);
  const cached = configCache.get(root);
  if (cached && cached.signature === signature) {
    return cached.value;
  }
  const value = await loadConfigUncached(root);
  configCache.set(root, { signature, value });
  return value;
}

async function loadConfigUncached(root: string): Promise<LoadedConfig> {
  const assetRoot = await resolveAssetRoot(root);
  const agentRoot = assetRoot.path;
  const configPath = path.join(agentRoot, "config.yaml");
  if (!(await exists(configPath))) {
    throw new CliError(
      "E_PROJECT_NOT_INITIALIZED",
      "项目尚未初始化，请运行 `repo-agent init`。",
      relativeAssetPath(assetRoot, "config.yaml"),
    );
  }
  return {
    config: await readYaml<AgentConfig>(configPath),
    commitPolicy: await readYaml<CommitPolicyConfig>(
      path.join(agentRoot, "commit_policy.yaml"),
    ),
    protectedFiles: await readYaml<ProtectedFilesConfig>(
      path.join(agentRoot, "policies", "protected_files.yaml"),
    ),
    commandPolicy: await readYaml<CommandPolicyConfig>(
      path.join(agentRoot, "policies", "command_policy.yaml"),
    ),
  };
}
