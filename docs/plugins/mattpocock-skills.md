# mattpocock-skills 安装与使用

**来源**：[Matt Pocock Skills](https://github.com/mattpocock/skills)，第三方外链接入。

这个插件提供规划、TDD、调试、领域建模、代码审查等工程工作流 Skills，不包含 MCP，也没有强制的外部 CLI。

## 安装

先按根目录 [README](../../README.md#安装) 添加 `agent-forge` 市场，再执行：

```bash
codex plugin add mattpocock-skills@agent-forge
codex plugin list --marketplace agent-forge
```

Claude Code 用户改用 `/plugin install mattpocock-skills@agent-forge`（先执行一次
`/plugin marketplace add wei-3/agent-forge`）。

安装后新建一个 Codex 任务，让新任务加载 Skills。

## 首次配置项目

每个项目首次使用时，在 Codex 中明确要求：

> 使用 `mattpocock-skills:setup-matt-pocock-skills` 配置当前仓库。

向导会选择 issue tracker、triage labels 和领域文档，并可能写入
`AGENTS.md`、`CLAUDE.md` 或 `docs/agents/`；执行前先审阅拟写内容。

- 选择 GitHub tracker 时，另行安装并登录 `gh`。
- 选择 GitLab tracker 时，另行安装并登录 `glab`。
- 选择本地 Markdown 时，不需要额外 CLI。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。
