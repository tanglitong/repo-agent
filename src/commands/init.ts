import path from "node:path";
import { mkdir } from "node:fs/promises";
import { scanProject } from "../core/project-scanner.js";
import { renderTemplate } from "../core/template-renderer.js";
import { templates } from "../templates.js";
import { exists, isWritable, writeFileExclusive } from "../utils/fs.js";
import { CliError } from "../errors.js";
import { VERSION } from "../index.js";
import type { ProjectProfile } from "../types/project.js";
import {
  ensureManagedGitignore,
  gitignoreSuggestion,
} from "../core/gitignore-manager.js";
import {
  activateIntegrations,
  validateIntegrationSelection,
  type ActivationResult,
  type EntryMode,
  type ToolSelection,
} from "../core/integration-manager.js";
import { loadHookRoutes } from "../core/hook-router.js";

export type InitMode = "personal" | "team";

export interface InitResult {
  ok: true;
  command: "init";
  mode: InitMode;
  dryRun: boolean;
  root: string;
  created: string[];
  updated: string[];
  skipped: string[];
  wouldCreate: string[];
  wouldUpdate: string[];
  detectedProject: ProjectProfile;
  warnings: string[];
  activation: ActivationResult;
}

const directories = [
  ".repo-agent/policies",
  ".repo-agent/hooks",
  ".repo-agent/memories/modules",
  ".repo-agent/memory_candidates",
  ".repo-agent/skills/approved",
  ".repo-agent/skills/candidates",
  ".repo-agent/fix_patterns/approved",
  ".repo-agent/fix_patterns/candidates",
  ".repo-agent/evals",
  ".repo-agent/adapters",
  ".repo-agent/tools",
  ".repo-agent/learning_inbox",
  ".repo-agent/catalog",
  ".repo-agent/review_lenses",
  ".repo-agent/workflows",
  ".repo-agent/generated/audits",
  ".repo-agent/generated/context_packs",
  ".repo-agent/generated/patches",
  ".repo-agent/generated/review_summaries",
  ".repo-agent/generated/stale_candidates",
  ".repo-agent/generated/tmp",
  ".repo-agent/generated/recurring_errors",
];

const display = (values: string[]): string => values.length ? values.join(", ") : "未检测到";

function initReport(
  profile: ProjectProfile,
  generated: string[],
  updated: string[],
  warnings: string[],
): string {
  const test = profile.testCommands;
  return `# repo-agent 初始化报告

生成时间：${new Date().toISOString()}

## 项目检测结果

- 语言：${display(profile.language)}
- 框架：${display(profile.framework)}
- 包管理器：${profile.packageManager ?? "未检测到"}
- 测试命令：${test.unit ?? "未检测到"}
- 类型检查命令：${test.typecheck ?? "未检测到"}
- Lint 命令：${test.lint ?? "未检测到"}

## 流程检测结果

- OpenSpec：${profile.process.hasOpenSpec ? "是" : "否"}
- ADR：${profile.process.hasAdr ? "是" : "否"}
- AGENTS.md：${profile.process.hasAgents ? "是" : "否"}
- SECURITY.md：${profile.process.hasSecurity ? "是" : "否"}
- CI 工作流：${profile.process.hasCiWorkflows ? "是" : "否"}

## 生成的文件

${generated.map((item) => `- ${item}`).join("\n") || "- 无（已保留现有文件）"}

## 更新的文件

${updated.map((item) => `- ${item}`).join("\n") || "- 无"}

## 高风险路径

${profile.riskPaths.map((item) => `- ${item}`).join("\n")}

## 警告

${warnings.map((item) => `- ${item}`).join("\n") || "- 无"}

## 后续步骤

1. 审核 .repo-agent/config.yaml。
2. 审核 .repo-agent/commit_policy.yaml。
3. 审核 .repo-agent/hooks/routes.yaml 中的 Hook Router（钩子路由）。
4. .gitignore 已自动区分团队资产与本地、私有、派生文件，无需手工维护。
5. 团队共享资产审核通过后再提交。
`;
}

export async function initializeProject(options: {
  root: string;
  mode: InitMode;
  dryRun: boolean;
  tool?: ToolSelection;
  entry?: EntryMode;
}): Promise<InitResult> {
  const { root, mode, dryRun } = options;
  if (!(await isWritable(root)) && !dryRun) {
    throw new CliError("E_PERMISSION_DENIED", "项目根目录不可写。", root);
  }
  await validateIntegrationSelection(
    root,
    options.tool ?? "all",
    options.entry ?? "auto",
  );
  if (await exists(path.join(root, ".repo-agent", "hooks", "routes.yaml"))) {
    await loadHookRoutes(root);
  }

  const profile = await scanProject(root);
  const warnings: string[] = [];
  if (!profile.testCommands.unit) warnings.push("未检测到测试命令。");
  if (!profile.testCommands.typecheck) warnings.push("未检测到类型检查命令。");
  if (!profile.process.hasSecurity) warnings.push("未检测到 SECURITY.md。");

  const defaultFiles = new Map<string, string>([
    [".repo-agent/config.yaml", renderTemplate(templates.config, { MODE: mode })],
    [
      ".repo-agent/commit_policy.yaml",
      mode === "team" ? templates.teamCommitPolicy : templates.personalCommitPolicy,
    ],
    [
      ".repo-agent/lock.yaml",
      `version: 1
repo_agent:
  asset_version: ${VERSION}
  template_version: ${VERSION}
  schema_version: ${VERSION}
  builtin_policy_version: ${VERSION}
  builtin_skill_version: ${VERSION}
  builtin_fix_pattern_version: ${VERSION}
generated_at: ${new Date().toISOString()}
applied_migrations: []
managed_assets: {}
upgrade:
  state: complete
  target_version: ${VERSION}
  pending: []
`,
    ],
    [".repo-agent/README.md", templates.usageGuide],
    [".repo-agent/policies/protected_files.yaml", templates.protectedFiles],
    [".repo-agent/policies/command_policy.yaml", templates.commandPolicy],
    [".repo-agent/policies/permissions.yaml", templates.permissions],
    [".repo-agent/hooks/routes.yaml", `version: 1
routes:
  session-start:
    handler: session_handshake
  user-prompt-submit:
    handler: task_preflight
    context_sources: [instructions, memories, skills, fix_patterns, candidates, recurring_errors]
    block_on_risk: [blocked]
  pre-tool-use:
    handler: tool_policy
  stop:
    handler: task_closure
    closure_steps: [commit_advice, audit_recorded, observation_captured, recurring_analyzed, lifecycle_evaluated, metrics_updated]
`],
    [".repo-agent/memories/repo.md", templates.memory("仓库", "记录仓库特有的约定和边界。")],
    [".repo-agent/memories/architecture.md", templates.memory("架构", "记录经过审核的架构决策和约束。")],
    [".repo-agent/memories/testing.md", templates.memory("测试", "记录经过审核的测试命令和回归要求。")],
    [".repo-agent/memories/security.md", templates.memory("安全", "记录经过审核的安全要求和敏感区域。")],
    [".repo-agent/skills/approved/bugfix.red-green-refactor.yaml", templates.skill],
    [".repo-agent/fix_patterns/approved/auth.oauth-invalid-state.yaml", templates.fixPattern],
    [".repo-agent/adapters/codex.yaml", `id: adapter.codex
name: Codex
version: 1
supports: { context_pack: true, hook: true, mcp: true, json_cli: true }
`],
    [".repo-agent/adapters/claude-code.yaml", `id: adapter.claude-code
name: Claude Code
version: 1
supports: { context_pack: true, hook: true, mcp: true, json_cli: true }
`],
    [".repo-agent/adapters/opencode.yaml", `id: adapter.opencode
name: OpenCode
version: 1
supports: { context_pack: true, plugin: true, mcp: true, json_cli: true }
`],
    [".repo-agent/tools/registry.yaml", `version: 1
tools:
  - { id: Read, type: read, risk: low }
  - { id: Grep, type: read, risk: low }
  - { id: Glob, type: read, risk: low }
  - { id: LS, type: read, risk: low }
  - { id: NotebookRead, type: read, risk: low }
  - { id: TodoWrite, type: planning, risk: low }
  - { id: update_plan, type: planning, risk: low }
  - { id: request_user_input, type: planning, risk: low }
  - { id: view_image, type: read, risk: low }
  - { id: tool_search_tool, type: read, risk: low }
  - { id: Task, type: planning, risk: low }
  - { id: SlashCommand, type: planning, risk: low }
  - { id: Write, type: write, risk: medium, requires_confirmation: true }
  - { id: Edit, type: write, risk: medium, requires_confirmation: true }
  - { id: NotebookEdit, type: write, risk: medium, requires_confirmation: true }
  - { id: ApplyPatch, type: write, risk: medium, requires_confirmation: true }
  - { id: Bash, type: command, risk: medium }
  - { id: BashOutput, type: command, risk: low }
  - { id: KillShell, type: command, risk: medium, requires_confirmation: true }
  - { id: WebFetch, type: network, risk: medium, requires_confirmation: true }
  - { id: WebSearch, type: network, risk: medium, requires_confirmation: true }
  - { id: tool.git.status, type: command, command: git status, risk: low }
  - { id: tool.git.commit, type: command, command: git commit, risk: medium, requires_confirmation: true }
  - { id: tool.network.fetch, type: network, risk: high, allowed: false }
`],
    [".repo-agent/tools/permissions.yaml", `version: 1
defaults: { network: deny, shell: allow_safe, git_write: require_confirmation }
blocked: [tool.network.fetch, tool.secret.read, tool.command.sudo]
requires_confirmation:
  - tool.git.commit
  - tool.git.push
  - tool.patch.apply
  - Write
  - Edit
  - NotebookEdit
  - ApplyPatch
  - KillShell
  - WebFetch
  - WebSearch
`],
    [".repo-agent/review_lenses/security.yaml", `id: review.security
applies_to: [src/auth/**, src/billing/**, .repo-agent/policies/**]
checks: [是否泄露敏感信息？, 是否可能绕过认证？, 是否包含负向测试？]
required_for: [high, blocked]
`],
    [".repo-agent/review_lenses/testing.yaml", `id: review.testing
applies_to: [src/**, tests/**]
checks: [是否包含回归测试？, 是否运行了相关测试？]
required_for: [medium, high, blocked]
`],
    [".repo-agent/review_lenses/database.yaml", `id: review.database
applies_to: [database/migrations/**]
checks: [回滚是否安全？, 是否可能丢失数据？]
required_for: [high, blocked]
`],
    [".repo-agent/workflows/bugfix.yaml", `id: workflow.bugfix
version: 1
steps: [get_context_pack, check_policy, recommend_tests, external_agent_action, record_trace, classify_learning, get_commit_options]
`],
    [".repo-agent/workflows/security-change.yaml", `id: workflow.security-change
version: 1
steps: [get_context_pack, check_policy, collect_evidence, external_agent_action, run_negative_tests, record_trace, get_commit_options]
`],
    [".repo-agent/workflows/feature.yaml", `id: workflow.feature
version: 1
steps: [get_context_pack, check_policy, recommend_tests, external_agent_action, run_tests, record_trace, get_commit_options]
`],
    [".repo-agent/fix_patterns/error_aliases.yaml", `version: 1
aliases:
  error.auth.oauth-invalid-state:
    title: OAuth state 无效
    keywords: [invalid oauth state, state mismatch, csrf state validation failed, oauth callback state mismatch]
    scope: [src/auth/**, tests/auth/**]
`],
    [".repo-agent/catalog/skills.index.yaml", `skills:
  - { id: skill.bugfix.red-green-refactor, status: approved, weight: 0.8 }
`],
    [".repo-agent/catalog/memories.index.yaml", `memories:
  - { id: memory.repo, status: approved, weight: 0.7 }
  - { id: memory.architecture, status: approved, weight: 0.7 }
  - { id: memory.testing, status: approved, weight: 0.7 }
  - { id: memory.security, status: approved, weight: 0.7 }
`],
    [".repo-agent/catalog/fix_patterns.index.yaml", `fix_patterns:
  - { id: fix.auth.oauth-invalid-state, status: approved, weight: 0.7 }
`],
    [".repo-agent/catalog/candidates.index.yaml", "candidates: []\n"],
    [".repo-agent/generated/gitignore_suggestion.txt", gitignoreSuggestion()],
  ]);
  const files = new Map(defaultFiles);

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const wouldCreate: string[] = [];
  const wouldUpdate: string[] = [];

  for (const directory of directories) {
    if (!dryRun) await mkdir(path.join(root, directory), { recursive: true });
  }

  for (const [relativePath, content] of files) {
    const target = path.join(root, relativePath);
    if (await exists(target)) {
      skipped.push(relativePath);
    } else if (dryRun) {
      wouldCreate.push(relativePath);
    } else {
      const result = await writeFileExclusive(target, content);
      (result === "created" ? created : skipped).push(relativePath);
    }
  }

  const gitignoreResult = await ensureManagedGitignore(root, dryRun);
  if (gitignoreResult.action === "created") created.push(".gitignore");
  if (gitignoreResult.action === "updated") updated.push(".gitignore");
  if (gitignoreResult.action === "skipped") skipped.push(".gitignore");
  if (gitignoreResult.action === "wouldCreate") wouldCreate.push(".gitignore");
  if (gitignoreResult.action === "wouldUpdate") wouldUpdate.push(".gitignore");
  const activation = await activateIntegrations(
    root,
    options.tool ?? "all",
    dryRun,
    options.entry ?? "auto",
  );

  const reportPath = ".repo-agent/generated/init_report.md";
  if (await exists(path.join(root, reportPath))) {
    skipped.push(reportPath);
  } else if (dryRun) {
    wouldCreate.push(reportPath);
  } else {
    const generatedReport = initReport(profile, created, updated, warnings);
    const result = await writeFileExclusive(path.join(root, reportPath), generatedReport);
    (result === "created" ? created : skipped).push(reportPath);
  }

  return {
    ok: true,
    command: "init",
    mode,
    dryRun,
    root,
    created,
    updated,
    skipped,
    wouldCreate,
    wouldUpdate,
    detectedProject: profile,
    warnings,
    activation,
  };
}
