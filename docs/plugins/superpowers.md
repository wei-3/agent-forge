# Superpowers 安装与使用

**来源**：[Superpowers](https://github.com/obra/superpowers)，第三方外链接入。

这个插件提供 brainstorming、TDD、系统化调试、计划执行、子代理协作和代码审查等开发流程 Skills。它没有 MCP、账号认证或必需的外部 CLI。

## 安装

```bash
codex plugin add superpowers@agent-forge
codex plugin list --marketplace agent-forge
```

Claude Code 用户改用 `/plugin install superpowers@agent-forge`（先执行一次
`/plugin marketplace add wei-3/agent-forge`）。

安装后新建一个 Codex 任务，并可明确要求：

> 使用 `superpowers:brainstorming` 帮我梳理这个功能。

插件不需要初始化；其当前 Codex manifest 也没有需要审核的 hooks。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。
