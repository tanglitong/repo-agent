import path from "node:path";
import { CliError } from "../errors.js";
import { exists } from "../utils/fs.js";
import { readYaml } from "../utils/yaml.js";

export type HookRouteEvent =
  | "session-start"
  | "user-prompt-submit"
  | "pre-tool-use"
  | "stop";
export type ContextSource =
  | "instructions"
  | "memories"
  | "skills"
  | "fix_patterns"
  | "candidates"
  | "recurring_errors";
export type ClosureActivity =
  | "commit_advice"
  | "audit_recorded"
  | "observation_captured"
  | "recurring_analyzed"
  | "lifecycle_evaluated"
  | "metrics_updated";

export interface SessionHandshakeRoute {
  handler: "session_handshake";
}

export interface TaskPreflightRoute {
  handler: "task_preflight";
  context_sources: ContextSource[];
  block_on_risk: Array<"low" | "medium" | "high" | "blocked">;
}

export interface TaskClosureRoute {
  handler: "task_closure";
  closure_steps: ClosureActivity[];
}

export interface ToolPolicyRoute {
  handler: "tool_policy";
}

export interface HookRoutesConfig {
  version: 1;
  routes: {
    "session-start": SessionHandshakeRoute;
    "user-prompt-submit": TaskPreflightRoute;
    "pre-tool-use": ToolPolicyRoute;
    stop: TaskClosureRoute;
  };
}

const allowedContextSources = new Set<ContextSource>([
  "instructions",
  "memories",
  "skills",
  "fix_patterns",
  "candidates",
  "recurring_errors",
]);
const allowedRiskLevels = new Set(["low", "medium", "high", "blocked"]);
const allowedActivities = new Set<ClosureActivity>([
  "commit_advice",
  "audit_recorded",
  "observation_captured",
  "recurring_analyzed",
  "lifecycle_evaluated",
  "metrics_updated",
]);

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function validateHookRoutesConfig(value: unknown): HookRoutesConfig {
  if (!value || typeof value !== "object") {
    throw new CliError("E_CONFIG_SCHEMA", "Hook Router 配置必须是对象。");
  }
  const config = value as Record<string, unknown>;
  const routes = config.routes as Record<string, unknown> | undefined;
  if (config.version !== 1 || !routes || typeof routes !== "object") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "Hook Router 配置必须包含 version=1 和 routes。",
    );
  }

  const session = routes["session-start"] as Record<string, unknown> | undefined;
  const prompt = routes["user-prompt-submit"] as Record<string, unknown> | undefined;
  const stop = routes.stop as Record<string, unknown> | undefined;
  const tool = routes["pre-tool-use"] as Record<string, unknown> | undefined;
  if (session?.handler !== "session_handshake") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "session-start 必须路由到 session_handshake。",
    );
  }
  if (prompt?.handler !== "task_preflight") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "user-prompt-submit 必须路由到 task_preflight。",
    );
  }
  if (stop?.handler !== "task_closure") {
    throw new CliError("E_CONFIG_SCHEMA", "stop 必须路由到 task_closure。");
  }
  if (tool && tool.handler !== "tool_policy") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "pre-tool-use 必须路由到 tool_policy。",
    );
  }

  const contextSources = stringArray(prompt.context_sources);
  if (
    !contextSources.length ||
    contextSources.some((source) => !allowedContextSources.has(source as ContextSource))
  ) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "task_preflight.context_sources 包含无效来源或为空。",
    );
  }
  const blockOnRisk = stringArray(prompt.block_on_risk);
  if (
    !blockOnRisk.length ||
    blockOnRisk.some((level) => !allowedRiskLevels.has(level))
  ) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "task_preflight.block_on_risk 包含无效风险等级或为空。",
    );
  }
  const requiredActivities = stringArray(stop.closure_steps);
  if (
    requiredActivities.length !== allowedActivities.size ||
    requiredActivities.some(
      (activity) => !allowedActivities.has(activity as ClosureActivity),
    ) ||
    new Set(requiredActivities).size !== requiredActivities.length
  ) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "task_closure.closure_steps 必须完整且不能重复。",
    );
  }

  return {
    version: 1,
    routes: {
      "session-start": { handler: "session_handshake" },
      "user-prompt-submit": {
        handler: "task_preflight",
        context_sources: [...new Set(contextSources)] as ContextSource[],
        block_on_risk: [...new Set(blockOnRisk)] as TaskPreflightRoute["block_on_risk"],
      },
      "pre-tool-use": { handler: "tool_policy" },
      stop: {
        handler: "task_closure",
        closure_steps: [...new Set(requiredActivities)] as ClosureActivity[],
      },
    },
  };
}

export async function loadHookRoutes(root: string): Promise<HookRoutesConfig> {
  const routePath = path.join(root, ".repo-agent", "hooks", "routes.yaml");
  if (!(await exists(routePath))) {
    throw new CliError(
      "E_PROJECT_NOT_INITIALIZED",
      "缺少 Hook Router 配置，请运行 `repo-agent init`。",
      ".repo-agent/hooks/routes.yaml",
    );
  }
  try {
    return validateHookRoutesConfig(
      await readYaml<Record<string, unknown>>(routePath),
    );
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError(
      "E_CONFIG_PARSE",
      `无法解析 Hook Router 配置：${(error as Error).message}`,
      ".repo-agent/hooks/routes.yaml",
    );
  }
}
