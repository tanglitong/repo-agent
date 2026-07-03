# repo-agent 用户命令表

所有命令都在目标项目根目录执行。`<bundle>` 表示 `repo-agent/repo-agent.bundle.js`。

## 更新与诊断

| 操作 | 命令 | 类型 |
|---|---|---|
| 更新预演 | `node <bundle> update --dry-run --json` | 查询 |
| 更新或修复 | `node <bundle> update --yes --json` | 写入 |
| 状态 | `node <bundle> status --json` | 查询 |
| 严格校验 | `node <bundle> validate --strict --json` | 查询 |
| 环境诊断 | `node <bundle> doctor --json` | 查询 |
| 深度健康检查 | `node <bundle> health check --deep --json` | 查询 |

如果当前 Skill 来自比项目安装目录更新的离线包，更新预演和正式更新分别增加 `--source "<skill-dir>"`。

## 客户端接入

| 操作 | 命令 | 类型 |
|---|---|---|
| 握手 | `node <bundle> handshake --tool auto --json` | 查询 |
| 接入预演 | `node <bundle> activate --tool all --entry auto --dry-run --json` | 查询 |
| 接入 | `node <bundle> activate --tool all --entry auto --json` | 写入 |
| 解除预演 | `node <bundle> deactivate --tool all --dry-run --json` | 查询 |
| 解除接入 | `node <bundle> deactivate --tool all --json` | 写入 |

根据用户选择把 `all` 替换为 `codex`、`claude-code` 或 `opencode`。解除接入不删除治理资产和运行数据。

## 经验候选

候选类型为 `memory`、`skill` 或 `fix-pattern`。

| 操作 | 命令 | 类型 |
|---|---|---|
| 查看候选 | `node <bundle> <类型> list-candidates --json` | 查询 |
| 晋升预演 | `node <bundle> candidate promote <candidate-id> --reviewer "<审核者>" --dry-run --json` | 查询 |
| 晋升 | `node <bundle> candidate promote <candidate-id> --reviewer "<审核者>" --json` | 写入 |
| 审核预演 | `node <bundle> <类型> <approve|reject|archive|merge> <candidate-id> --reviewer "<审核者>" --dry-run --json` | 查询 |
| 审核 | `node <bundle> <类型> <approve|reject|archive|merge> <candidate-id> --reviewer "<审核者>" --json` | 写入 |

执行 `merge` 时还必须提供 `--merged-into <asset-id>`。

## 重复错误

| 操作 | 命令 | 类型 |
|---|---|---|
| 查看信号 | `node <bundle> recurring-errors list --json` | 查询 |
| 分析预演 | `node <bundle> recurring-errors analyze --dry-run --json` | 查询 |
| 执行分析 | `node <bundle> recurring-errors analyze --json` | 写入 |
| 当前任务建议 | `node <bundle> recurring-errors recommend --task "<任务>" --json` | 查询 |
| 修复模式提案预演 | `node <bundle> recurring-errors propose-fix-pattern <id> --dry-run --json` | 查询 |
| 生成修复模式提案 | `node <bundle> recurring-errors propose-fix-pattern <id> --json` | 写入 |

## 证据、上下文和闭环

| 操作 | 命令 | 类型 |
|---|---|---|
| 解释证据 | `node <bundle> evidence explain <asset-id> --json` | 查询 |
| 解释上下文 | `node <bundle> explain context "<任务>" --json` | 查询 |
| 闭环状态 | `node <bundle> closure status --json` | 查询 |
| 恢复预演 | `node <bundle> closure recover --session-id <session-id> --dry-run --json` | 查询 |
| 恢复闭环 | `node <bundle> closure recover --session-id <session-id> --json` | 写入 |

## 生命周期

| 操作 | 命令 | 类型 |
|---|---|---|
| 查看提案 | `node <bundle> lifecycle list --json` | 查询 |
| 生成提案预演 | `node <bundle> lifecycle propose --dry-run --json` | 查询 |
| 生成提案 | `node <bundle> lifecycle propose --json` | 写入 |
| 应用预演 | `node <bundle> lifecycle apply <proposal-id> --reviewer "<审核者>" --dry-run --json` | 查询 |
| 应用提案 | `node <bundle> lifecycle apply <proposal-id> --reviewer "<审核者>" --json` | 写入 |
| 恢复预演 | `node <bundle> lifecycle restore <asset-id> --dry-run --json` | 查询 |
| 生成恢复提案 | `node <bundle> lifecycle restore <asset-id> --json` | 写入 |
