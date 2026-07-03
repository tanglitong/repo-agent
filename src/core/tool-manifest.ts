export type ToolApprovalMode = "approve" | "prompt";
export type ToolSideEffect = "none" | "runtime" | "candidate" | "team_candidate";
export type ToolRisk = "low" | "medium" | "high";

export interface RepoAgentToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  approvalMode: ToolApprovalMode;
  risk: ToolRisk;
  sideEffect: ToolSideEffect;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
}

const commonProperties = {
  sessionId: { type: "string" },
  turnId: { type: "string" },
  preflightId: { type: "string" },
  outcomeStatus: { enum: ["success", "failure", "partial"] },
  dryRun: { type: "boolean" },
};

function objectSchema(
  required: string[] = [],
  properties: Record<string, unknown> = {},
) {
  return {
    type: "object",
    ...(required.length ? { required } : {}),
    properties: { ...commonProperties, ...properties },
    additionalProperties: false,
  };
}

const nonEmptyString = { type: "string", minLength: 1 };
const stringArray = { type: "array", items: { type: "string" } };

function tool<const Name extends string>(
  definition: Omit<RepoAgentToolDefinition, "annotations" | "name"> & {
    name: Name;
    readOnly?: boolean;
    destructive?: boolean;
    idempotent?: boolean;
  },
): RepoAgentToolDefinition & { name: Name } {
  const {
    readOnly = definition.sideEffect === "none",
    destructive = false,
    idempotent = definition.sideEffect === "none",
    ...value
  } = definition;
  return {
    ...value,
    annotations: {
      readOnlyHint: readOnly,
      destructiveHint: destructive,
      idempotentHint: idempotent,
      openWorldHint: false,
    },
  };
}

export const REPO_AGENT_TOOLS = [
  tool({
    name: "get_context_pack",
    description: "根据任务生成项目上下文包、风险和建议。",
    inputSchema: objectSchema(["task"], {
      task: nonEmptyString,
      executionEnvironment: { type: "object" },
    }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "get_latest_preflight",
    description: "按当前工具会话读取最近一次 Hook preflight。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "get_closure_status",
    description: "读取闭环状态、失败步骤和 Event Store 完整性。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "recover_closure",
    description: "幂等恢复当前会话最近一次未完成闭环。",
    inputSchema: objectSchema(),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "runtime",
    idempotent: true,
  }),
  tool({
    name: "get_asset_evidence",
    description: "解释资产 Evidence 与生命周期健康分。",
    inputSchema: objectSchema(["assetId"], { assetId: nonEmptyString }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "search_assets",
    description: "按任务检索可信资产和不可信建议。",
    inputSchema: objectSchema(["task"], { task: nonEmptyString }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "promote_candidate",
    description: "将达到条件的私人 Candidate 提议为团队 Candidate。",
    inputSchema: objectSchema(["candidateId"], {
      candidateId: nonEmptyString,
      reviewer: { type: "string" },
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "team_candidate",
  }),
  tool({
    name: "get_health_metrics",
    description: "读取深度健康指标和闭环率。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "check_policy",
    description: "检查路径、命令或工具是否符合项目策略。",
    inputSchema: objectSchema([], {
      paths: stringArray,
      command: { type: "string" },
      toolId: { type: "string" },
    }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "recommend_tests",
    description: "根据项目配置推荐测试命令。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "get_commit_options",
    description: "根据风险和提交策略返回可选提交方式。",
    inputSchema: objectSchema([], {
      task: { type: "string" },
      paths: stringArray,
    }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "runtime",
    readOnly: false,
    idempotent: true,
  }),
  tool({
    name: "propose_memory",
    description: "创建 memory 候选，不直接修改已批准资产。",
    inputSchema: objectSchema(["id", "content"], {
      id: nonEmptyString,
      content: nonEmptyString,
      task: { type: "string" },
      scope: stringArray,
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate",
  }),
  tool({
    name: "propose_skill",
    description: "创建 skill 候选，不直接修改已批准资产。",
    inputSchema: objectSchema(["id", "description"], {
      id: nonEmptyString,
      description: nonEmptyString,
      task: { type: "string" },
      scope: stringArray,
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate",
  }),
  tool({
    name: "propose_fix_pattern",
    description: "创建 fix pattern 候选，不直接修改已批准资产。",
    inputSchema: objectSchema(["id", "pattern"], {
      id: nonEmptyString,
      pattern: nonEmptyString,
      task: { type: "string" },
      scope: stringArray,
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate",
  }),
  tool({
    name: "classify_learning",
    description: "判断学习结果应沉淀为哪类候选。",
    inputSchema: objectSchema(["task", "observation"], {
      task: nonEmptyString,
      observation: nonEmptyString,
    }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "record_trace",
    description: "记录经过脱敏的本地任务审计。",
    inputSchema: objectSchema(["task"], {
      task: nonEmptyString,
      outcome: { type: "string" },
      usedMemories: stringArray,
      usedSkills: stringArray,
      usedFixPatterns: stringArray,
      commitOptions: { type: "object" },
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "runtime",
  }),
  tool({
    name: "list_skills",
    description: "列出已批准的 skill。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "list_fix_patterns",
    description: "列出已批准的 fix pattern。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "list_recurring_errors",
    description: "列出已识别的重复错误。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "analyze_recurring_errors",
    description: "重新分析审计和 Learning Inbox 中的重复错误。",
    inputSchema: objectSchema(),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate",
    idempotent: true,
  }),
  tool({
    name: "recommend_for_recurring_errors",
    description: "针对当前任务推荐相关重复错误处理方法。",
    inputSchema: objectSchema(["task"], { task: nonEmptyString }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "propose_fix_pattern_from_recurring_error",
    description: "根据重复错误生成 fix pattern 候选。",
    inputSchema: objectSchema(["id"], { id: nonEmptyString }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate",
  }),
  tool({
    name: "detect_duplicates",
    description: "检测重复候选。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "redact_secrets",
    description: "对文本中的疑似敏感信息进行脱敏。",
    inputSchema: objectSchema(["input"], { input: nonEmptyString }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "resolve_conflicts",
    description: "检测个人配置和候选资产冲突。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
  tool({
    name: "generate_patch_summary",
    description: "生成当前 Git 变更摘要，不写入补丁。",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none",
  }),
] as const;

export type RepoAgentToolName = (typeof REPO_AGENT_TOOLS)[number]["name"];

const toolByName = new Map<string, RepoAgentToolDefinition>(
  REPO_AGENT_TOOLS.map((item) => [item.name, item]),
);

export function getRepoAgentTool(name: string) {
  return toolByName.get(name);
}

export function repoAgentHookToolId(name: string) {
  return `mcp__repo_agent__${name}`;
}

export function getRepoAgentToolByHookId(toolId: string) {
  const prefix = "mcp__repo_agent__";
  return toolId.startsWith(prefix)
    ? getRepoAgentTool(toolId.slice(prefix.length))
    : undefined;
}

export function isRepoAgentHookToolId(toolId: string) {
  return toolId.startsWith("mcp__repo_agent__");
}
