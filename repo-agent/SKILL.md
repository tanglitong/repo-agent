---
name: repo-agent
description: Interactively install and operate the packaged repo-agent governance system. Use only when the user explicitly invokes repo-agent to install, update, diagnose, manage client integrations, review experience candidates, analyze recurring errors, recover task closure, explain evidence, or manage asset lifecycle.
---

<!-- repo-agent managed skill v1 -->

# repo-agent 控制中心

使用中文完成交互。将当前 `SKILL.md` 所在目录记为 `<skill-dir>`，将用户当前工作的仓库根目录记为 `<project-root>`。

## 选择工作流

先检查 `<project-root>/repo-agent/repo-agent.bundle.js` 和 `<project-root>/.repo-agent/config.yaml`：

- 缺少运行程序：只提供“安装 repo-agent”和“查看安装说明”。
- 有运行程序但未初始化：提供“初始化项目”“检查环境”和“查看安装说明”。
- 已初始化：读取 [references/command-map.md](references/command-map.md)，根据用户的明确意图直接执行；没有明确意图时显示以下菜单：

  1. 更新或修复接入
  2. 状态、校验、诊断和健康检查
  3. AI 客户端接入、握手和解除接入
  4. 经验候选查看、晋升、批准、拒绝、归档和合并
  5. 重复错误分析与修复模式提案
  6. 证据和上下文解释
  7. 闭环状态与失败恢复
  8. 生命周期提案、审核、归档和恢复

优先使用客户端提供的结构化选择器；不可用时输出编号菜单并等待用户选择。

## 安装

安装前收集以下选项，推荐值放在第一位：

- 项目模式：`team` 或 `personal`
- 客户端：`all`、`codex`、`claude-code` 或 `opencode`
- 接入方式：默认 `auto`

先执行预演：

```bash
node "<skill-dir>/scripts/install.mjs" --target "<project-root>" --mode team --tool all --entry auto --dry-run
```

展示预演结果和将要执行的命令，获得用户确认后移除 `--dry-run` 执行安装。若目标已经存在 `repo-agent/`，不要覆盖，改用“更新或修复接入”。

## 执行规则

- 查询类操作可在用户选定后直接执行。
- 写入类操作必须先按命令表执行 `--dry-run`，展示影响并获得确认，再执行正式命令。
- 审核候选或应用生命周期提案前必须收集审核者名称。
- 使用 `--json` 获取稳定结果，再用中文总结成功项、警告和下一步。
- `update`、`activate` 或 `deactivate` 改变客户端配置后，明确提示用户新建客户端会话。
- 不直接修改已批准资产；只调用 CLI 提供的候选、审核和生命周期命令。
- 不提供构建、打包、发布、权限绕过或直接删除项目数据的操作。
- 不创建或修改 `AGENTS.md`、`CLAUDE.md`。
