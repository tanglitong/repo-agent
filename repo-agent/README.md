# repo-agent 1.0.0 离线安装包

repo-agent 是随仓库交付的 AI 编程治理与知识进化系统。它为 Codex、Claude Code 和 OpenCode 自动注入项目规则与历史经验、拦截风险操作，并把有效开发经验逐步沉淀为团队记忆、修复模式和 Skill。

本包默认离线运行，需要 Node.js 18 或更高版本。

## 安装方式一：直接执行命令

把压缩包解压到目标项目根目录，然后执行：

```bash
node repo-agent/repo-agent.bundle.js init --mode team --tool all --entry auto
```

个人项目可将 `team` 改为 `personal`。配置完成后必须新建 AI 客户端会话。

## 安装方式二：使用 Skill

将本包作为 Agent Skill 加载后：

- Codex：使用 `$repo-agent`，或通过 `/skills` 选择 repo-agent。
- Claude Code：使用 `/repo-agent`。
- OpenCode：首次安装后使用 `/repo-agent`。

Skill 会显示安装、更新、诊断、接入、经验审核、重复错误、闭环恢复和生命周期菜单，底层仍调用同一个 `repo-agent.bundle.js`。

## 验证

```bash
node repo-agent/repo-agent.bundle.js validate --strict
node repo-agent/repo-agent.bundle.js doctor
node repo-agent/repo-agent.bundle.js health check --deep
node repo-agent/repo-agent.bundle.js handshake --tool auto
```

## 更新与解除接入

```bash
node repo-agent/repo-agent.bundle.js update
node repo-agent/repo-agent.bundle.js deactivate --tool all
```

`deactivate` 只解除 AI 客户端接入，不删除治理资产、私人经验或运行记录。

完整操作说明见 [使用文档](./使用文档.md)。

## 许可证

repo-agent 使用 MIT License，完整条款见 [LICENSE](./LICENSE)。
运行时依赖的许可证与版权声明见
[THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES)。
