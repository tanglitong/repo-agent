# repo-agent 项目使用说明

本目录由 `repo-agent init` 生成，用于在当前项目中承载治理事实源和资产。以下内容说明它是什么、包含哪些资产、常用命令，以及每次会话背后发生了什么。

## 1. repo-agent 是什么

repo-agent 是一个本地治理与知识层，通过 Hook（钩子）、Plugin（插件） 和 MCP（模型上下文协议） 与 Codex、Claude Code、OpenCode 协作：

- 每一轮任务开始时，注入受信任的策略、记忆、技能、修复模式和候选建议；
- 判定风险等级并声明必须执行的动作（如运行测试、要求确认）；
- 结束时闭环记录审计、观察、复发错误分析、资产生命周期评估和度量。

它不会替代任何 AI 客户端，只作为治理层运行；默认离线，网络策略由 `config.yaml` 控制。

## 2. `.repo-agent/` 目录说明

- `config.yaml`：项目级配置事实源（模式、风险策略、上下文预算等）。
- `commit_policy.yaml`：提交决策策略。
- `hooks/routes.yaml`：Hook 路由（会话开始 / 用户提示 / 工具调用 / 停止）。
- `policies/`：命令、权限、受保护文件等安全策略。
- `memories/`、`skills/`、`fix_patterns/`：审核通过的团队知识资产。
- `adapters/`、`tools/`：适配器与工具/权限注册表。
- `review_lenses/`、`workflows/`：审查视角与流程模板。
- `catalog/`：资产索引，用于快速检索。
- `generated/`：审计、复发错误、补丁、初始化报告等派生产物（默认不入库）。

同级还会看到：
- `.repo-agent-private/`：私有候选、观察、学习产物（本地保留）。
- `.repo-agent-runtime/`：preflight/closure/事件流/度量快照（本地状态）。

## 3. 常用命令

安装与同步：

```bash
node repo-agent/repo-agent.bundle.js init --mode team --tool all --entry auto
node repo-agent/repo-agent.bundle.js update
node repo-agent/repo-agent.bundle.js handshake --tool auto --json
```

诊断与健康：

```bash
node repo-agent/repo-agent.bundle.js doctor --json
node repo-agent/repo-agent.bundle.js validate --strict --json
node repo-agent/repo-agent.bundle.js status --json
node repo-agent/repo-agent.bundle.js health check --deep --json
```

任务闭环与审计（Stop 之后可显式补录）：

```bash
node repo-agent/repo-agent.bundle.js commit-options --session-id <会话> --json
node repo-agent/repo-agent.bundle.js record-trace --session-id <会话> --outcome-status success --json
node repo-agent/repo-agent.bundle.js closure status --session-id <会话>
```

资产治理：

```bash
node repo-agent/repo-agent.bundle.js memory list-candidates --visibility private
node repo-agent/repo-agent.bundle.js memory approve <candidate-id>
node repo-agent/repo-agent.bundle.js lifecycle propose --dry-run
node repo-agent/repo-agent.bundle.js maintain --dry-run --json
```

升级（沿用 `update`，无升级包时等价于同步）：

```bash
node repo-agent/repo-agent.bundle.js update --source ./repo-agent-node-offline.zip --dry-run
node repo-agent/repo-agent.bundle.js update --source ./repo-agent-node-offline.zip --yes
node repo-agent/repo-agent.bundle.js update --rollback [<run-id>]
```

## 4. 一轮会话背后发生了什么

1. `session-start`：Codex/Claude Code Hook 或 OpenCode Plugin 通知 repo-agent，握手确认接入状态。
2. `user-prompt-submit`：生命周期适配器路由到 `task_preflight`，构建 ContextPack（受信任指令、相关记忆/技能/修复模式、候选建议、复发错误建议）、判定风险等级、声明必须动作和推荐测试。
3. 客户端执行任务；若触及注册工具，会经过 `pre-tool-use` 进入策略引擎。
4. `stop`：Hook 路由到 `task_closure`，依次完成 `commit_advice` → `audit_recorded` → `observation_captured` → `recurring_analyzed` → `lifecycle_evaluated` → `metrics_updated`。
5. 审计写入 `.repo-agent/generated/audits/`，事件流写入 `.repo-agent-runtime/events/`，观察写入 `.repo-agent-private/observations/`，度量刷新到 `.repo-agent-runtime/metrics/latest.json`。

## 5. MCP 工具（供支持 MCP 的客户端调用）

`get_context_pack`、`get_latest_preflight`、`get_closure_status`、`recover_closure`、`get_asset_evidence`、`search_assets`、`promote_candidate`、`get_health_metrics`、`check_policy`、`recommend_tests`、`get_commit_options`、`propose_memory` / `propose_skill` / `propose_fix_pattern`、`classify_learning`、`record_trace`、`list_skills` / `list_fix_patterns`、`list_recurring_errors`、`analyze_recurring_errors`、`recommend_for_recurring_errors`、`propose_fix_pattern_from_recurring_error`、`detect_duplicates`、`redact_secrets`、`resolve_conflicts`、`generate_patch_summary`。

## 6. 后续步骤

1. 审核 `.repo-agent/config.yaml` 和 `.repo-agent/commit_policy.yaml`。
2. 团队协作模式下，将 `.repo-agent/` 中团队共享部分提交入库；`generated/`、`catalog/` 已默认忽略。
3. 客户端接入首次配置后需要新建会话（或重新打开工具）以加载新的 Hook/Plugin/MCP。
4. 更多细节请查看 `.repo-agent/generated/init_report.md`（本次初始化摘要）。
