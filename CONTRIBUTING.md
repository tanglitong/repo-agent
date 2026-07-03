# 贡献指南

感谢你参与 repo-agent。项目欢迎缺陷修复、文档改进、测试补充和边界清晰的新功能。

## 开始之前

- 先搜索现有 Issue，避免重复工作。
- 普通缺陷和建议使用 GitHub Issue。
- 安全问题按照 [SECURITY.md](./SECURITY.md) 私下报告，不要创建公开 Issue。
- 参与项目即表示同意遵守 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。

## 本地开发

需要 Node.js 18 或更高版本。

```bash
git clone https://github.com/tanglitong/repo-agent.git
cd repo-agent
npm ci
npm run typecheck
npm test
```

主要目录：

- `src/`：命令行、Hook（钩子）、MCP（模型上下文协议）和治理运行时源码。
- `tests/`：CLI、闭环、打包、升级和跨平台测试。
- `docs/zh-CN/`：源码仓库的完整中文文档。
- `packaging/`：离线包和 Agent Skill 的发布源文件。
- `repo-agent/`：经过发布流程同步的可提交安装目录。

## 修改要求

- 修改公开命令、配置或行为时，同步更新 README、使用文档和架构文档。
- 说明文字以中文为主；命令、配置键、错误码、状态值保持源码原文。
- 不要让安装流程创建或修改 `AGENTS.md`、`CLAUDE.md`。
- 不要提交 `.repo-agent-private/`、`.repo-agent-runtime/`、生成报告、日志或密钥。
- 不要直接编辑 `repo-agent/` 中的生成文件；修改事实源后运行发布准备命令。

## 验证

普通改动至少运行：

```bash
npm run typecheck
npm test
```

涉及文档、打包或发布内容时还要运行：

```bash
npm run release:prepare
npm run release:verify
(cd repo-agent && shasum -a 256 -c CHECKSUMS.txt)
unzip -t release/repo-agent-node-offline.zip
git diff --check
```

## Pull Request

Pull Request 应当：

- 只处理一个清晰目标，说明动机、实现和用户影响。
- 关联对应 Issue；没有 Issue 时说明背景。
- 列出执行过的验证命令及结果。
- 对行为变化补充测试和文档。
- 保持提交中不含敏感信息、个人运行数据和无关修改。

维护者可能要求拆分过大的变更。合并方式由维护者根据历史清晰度决定。

## 贡献许可

除非你明确书面说明并得到维护者同意，你提交并被项目接收的贡献将按照
[MIT License](./LICENSE) 授权，不附加额外条款。
