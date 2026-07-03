export const templates = {
  config: `version: 1
mode: {{MODE}}

network:
  mode: offline
  allow:
    - localhost
    - "*.internal"
  deny:
    - "*"

audit:
  enabled: true
  write_to: .repo-agent/generated/audits

context:
  include_candidate_suggestions: true
  max_candidate_suggestions: 1
  min_relevance: 0.15
  max_items:
    memories: 8
    skills: 4
    fix_patterns: 4
    candidate_suggestions: 1
  budget:
    max_chars: 24000
    max_tokens_estimate: 6000

recurring_error_policy:
  enabled: true
  thresholds:
    inbox: 2
    propose_fix_pattern: 3
    propose_skill: 5
  high_risk_multiplier: 0.5
  include_in_context: true
  max_context_recommendations: 3

automatic_growth_policy:
  enabled: true
  validated_preflights: 3
  validated_days: 2
  background_observation_threshold: 20
  background_max_age_hours: 24

asset_lifecycle_policy:
  enabled: true
  private_automatic_cleanup: true
  team_proposal_only: true
  thresholds:
    stale: 0.45
    archive: 0.30
  durations_days:
    stale: 90
    archive: 180
    delete: 180
    private_retention: 180

closure_policy:
  abandon_after_hours: 24
  max_events_per_preflight: 10000
  max_event_bytes: 262144

evidence_policy:
  freshness_half_life_days: 180
`,
  teamCommitPolicy: `version: 1
default_mode: ask

allow_direct_commit_for:
  - docs
  - comments
  - formatting
  - low_risk_tests

require_review_request_for:
  - src/auth/**
  - src/billing/**
  - database/migrations/**
  - .github/workflows/**
  - infra/**
  - terraform/**
  - .repo-agent/policies/**
  - .repo-agent/skills/approved/**
  - .repo-agent/memories/**
  - .repo-agent/fix_patterns/approved/**
  - .openspec/**
  - docs/adr/**

always_ask_before_commit: true
allow_direct_commit_memory_candidates: true
require_review_for_approved_memory: true
require_review_for_approved_skill: true
require_review_for_approved_fix_pattern: true
`,
  personalCommitPolicy: `version: 1
default_mode: keep_local

allow_direct_commit_for:
  - docs
  - comments
  - formatting
  - low_risk_tests
  - low_risk_code

require_review_request_for:
  - src/auth/**
  - src/billing/**
  - database/migrations/**
  - .github/workflows/**
  - infra/**
  - terraform/**
  - .repo-agent/policies/**
  - .repo-agent/skills/approved/**
  - .repo-agent/memories/**
  - .repo-agent/fix_patterns/approved/**
  - .openspec/**
  - docs/adr/**

always_ask_before_commit: true
allow_direct_commit_memory_candidates: true
require_review_for_approved_memory: true
require_review_for_approved_skill: true
require_review_for_approved_fix_pattern: true
`,
  protectedFiles: `version: 1
protected_files:
  - .env*
  - "*.pem"
  - "*.key"
  - id_rsa
  - id_ed25519
  - secrets.*
  - .github/workflows/**
  - infra/**
  - terraform/**
  - k8s/production/**
  - database/migrations/**
`,
  commandPolicy: `version: 1
dangerous_commands:
  - "rm -rf"
  - sudo
  - "curl * | sh"
  - "wget * | sh"
  - "terraform apply"
  - "kubectl apply"
  - "docker --privileged"
  - "gh secret"
default_action: require_confirmation
`,
  permissions: `version: 1
defaults:
  network: deny
  shell: allow_safe
  git_write: require_confirmation
`,
  memory: (title: string, description: string) => `# ${title}

${description}

本文件只记录经过审核的项目知识，不得写入敏感信息。
`,
  skill: `id: skill.bugfix.red-green-refactor
version: 1
status: approved
title: 红-绿-重构缺陷修复
steps:
  - 先用回归测试复现失败。
  - 实施最小且安全的修改。
  - 运行针对性测试和相关的更广泛检查。
`,
  fixPattern: `id: fix.auth.oauth-invalid-state
version: 1
status: approved
title: OAuth state 无效
patterns:
  - invalid oauth state
  - oauth callback state mismatch
guidance:
  - 检查缺失、无效、过期和重放 state 的处理。
  - 修改行为前先补充负向回归测试。
recurrence:
  occurrences: 0
`,
  usageGuide: `# repo-agent 项目使用说明

本目录由 \`repo-agent init\` 生成，用于在当前项目中承载治理事实源和资产。以下内容说明它是什么、包含哪些资产、常用命令，以及每次会话背后发生了什么。

## 1. repo-agent 是什么

repo-agent 是一个本地治理与知识层，通过 Hook（钩子）、Plugin（插件） 和 MCP（模型上下文协议） 与 Codex、Claude Code、OpenCode 协作：

- 每一轮任务开始时，注入受信任的策略、记忆、技能、修复模式和候选建议；
- 判定风险等级并声明必须执行的动作（如运行测试、要求确认）；
- 结束时闭环记录审计、观察、复发错误分析、资产生命周期评估和度量。

它不会替代任何 AI 客户端，只作为治理层运行；默认离线，网络策略由 \`config.yaml\` 控制。

## 2. \`.repo-agent/\` 目录说明

- \`config.yaml\`：项目级配置事实源（模式、风险策略、上下文预算等）。
- \`commit_policy.yaml\`：提交决策策略。
- \`hooks/routes.yaml\`：Hook 路由（会话开始 / 用户提示 / 工具调用 / 停止）。
- \`policies/\`：命令、权限、受保护文件等安全策略。
- \`memories/\`、\`skills/\`、\`fix_patterns/\`：审核通过的团队知识资产。
- \`adapters/\`、\`tools/\`：适配器与工具/权限注册表。
- \`review_lenses/\`、\`workflows/\`：审查视角与流程模板。
- \`catalog/\`：资产索引，用于快速检索。
- \`generated/\`：审计、复发错误、补丁、初始化报告等派生产物（默认不入库）。

同级还会看到：
- \`.repo-agent-private/\`：私有候选、观察、学习产物（本地保留）。
- \`.repo-agent-runtime/\`：preflight/closure/事件流/度量快照（本地状态）。

## 3. 常用命令

交互入口：

- Codex：使用 \`$repo-agent\`，或在 \`/skills\` 中选择 repo-agent。
- Claude Code：使用 \`/repo-agent\`。
- OpenCode：使用 \`/repo-agent\`。

交互菜单可完成更新、诊断、接入、经验审核、重复错误分析、闭环恢复和生命周期管理。查询操作可直接执行；写操作会先预演并请求确认。Skill 只调用下列 CLI，不提供构建、打包或发布功能。

安装与同步：

\`\`\`bash
node repo-agent/repo-agent.bundle.js init --mode team --tool all --entry auto
node repo-agent/repo-agent.bundle.js update
node repo-agent/repo-agent.bundle.js handshake --tool auto --json
\`\`\`

诊断与健康：

\`\`\`bash
node repo-agent/repo-agent.bundle.js doctor --json
node repo-agent/repo-agent.bundle.js validate --strict --json
node repo-agent/repo-agent.bundle.js status --json
node repo-agent/repo-agent.bundle.js health check --deep --json
\`\`\`

任务闭环与审计（Stop 之后可显式补录）：

\`\`\`bash
node repo-agent/repo-agent.bundle.js commit-options --session-id <会话> --json
node repo-agent/repo-agent.bundle.js record-trace --session-id <会话> --outcome-status success --json
node repo-agent/repo-agent.bundle.js closure status --session-id <会话>
\`\`\`

资产治理：

\`\`\`bash
node repo-agent/repo-agent.bundle.js memory list-candidates --visibility private
node repo-agent/repo-agent.bundle.js memory approve <candidate-id>
node repo-agent/repo-agent.bundle.js lifecycle propose --dry-run
node repo-agent/repo-agent.bundle.js maintain --dry-run --json
\`\`\`

升级（沿用 \`update\`，无升级包时等价于同步）：

\`\`\`bash
node repo-agent/repo-agent.bundle.js update --source ./repo-agent-node-offline.zip --dry-run
node repo-agent/repo-agent.bundle.js update --source ./repo-agent-node-offline.zip --yes
node repo-agent/repo-agent.bundle.js update --rollback [<run-id>]
\`\`\`

## 4. 一轮会话背后发生了什么

1. \`session-start\`：Codex/Claude Code Hook 或 OpenCode Plugin 通知 repo-agent，握手确认接入状态。
2. \`user-prompt-submit\`：生命周期适配器路由到 \`task_preflight\`，构建 ContextPack（受信任指令、相关记忆/技能/修复模式、候选建议、复发错误建议）、判定风险等级、声明必须动作和推荐测试。
3. 客户端执行任务；若触及注册工具，会经过 \`pre-tool-use\` 进入策略引擎。
4. \`stop\`：Hook 路由到 \`task_closure\`，依次完成 \`commit_advice\` → \`audit_recorded\` → \`observation_captured\` → \`recurring_analyzed\` → \`lifecycle_evaluated\` → \`metrics_updated\`。
5. 审计写入 \`.repo-agent/generated/audits/\`，事件流写入 \`.repo-agent-runtime/events/\`，观察写入 \`.repo-agent-private/observations/\`，度量刷新到 \`.repo-agent-runtime/metrics/latest.json\`。

## 5. MCP 工具（供支持 MCP 的客户端调用）

\`get_context_pack\`、\`get_latest_preflight\`、\`get_closure_status\`、\`recover_closure\`、\`get_asset_evidence\`、\`search_assets\`、\`promote_candidate\`、\`get_health_metrics\`、\`check_policy\`、\`recommend_tests\`、\`get_commit_options\`、\`propose_memory\` / \`propose_skill\` / \`propose_fix_pattern\`、\`classify_learning\`、\`record_trace\`、\`list_skills\` / \`list_fix_patterns\`、\`list_recurring_errors\`、\`analyze_recurring_errors\`、\`recommend_for_recurring_errors\`、\`propose_fix_pattern_from_recurring_error\`、\`detect_duplicates\`、\`redact_secrets\`、\`resolve_conflicts\`、\`generate_patch_summary\`。

## 6. 后续步骤

1. 审核 \`.repo-agent/config.yaml\` 和 \`.repo-agent/commit_policy.yaml\`。
2. 团队协作模式下，将 \`.repo-agent/\` 中团队共享部分提交入库；\`generated/\`、\`catalog/\` 已默认忽略。
3. 客户端接入首次配置后需要新建会话（或重新打开工具）以加载新的 Hook/Plugin/MCP。
4. Skill 或命令入口由 repo-agent 管理；\`update\` 可修复，\`deactivate\` 可移除。
5. 更多细节请查看 \`.repo-agent/generated/init_report.md\`（本次初始化摘要）。
`,
};
