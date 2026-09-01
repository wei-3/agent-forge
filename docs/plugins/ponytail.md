# Ponytail 安装与使用

**来源**：[Ponytail](https://github.com/DietrichGebert/ponytail)，第三方外链接入。

Ponytail 提供偏向 YAGNI、最小正确实现和反过度设计的 Skills，并通过 Codex lifecycle hooks 持续注入工作方式。

## 前置检查与安装

hooks 由 Node.js 脚本执行，先确认 `node` 位于 Codex 非交互 shell 的 `PATH`：

```bash
node --version
codex plugin add ponytail@agent-forge
```

Claude Code 用户改用 `/plugin install ponytail@agent-forge`（先执行一次
`/plugin marketplace add wei-3/agent-forge`），随后在启用插件时按提示审核其声明的 hooks。

安装后：

1. Codex Desktop 完全重启；CLI 则重新启动 `codex`。
2. 输入 `/hooks`，逐项审核并信任该插件列出的 lifecycle hooks。
3. 新建任务，使用 `@ponytail-help` 或 `@ponytail-review` 验证。

没有 Node.js 时 Skills 仍可被调用，但自动常驻激活不会工作。使用 nvm 或 Nix 时，尤其要确认非交互 shell 也能找到 `node`。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。更新后重新审核 hooks，并新建任务。
