# Ponytail 安装与使用

**来源**：[Ponytail](https://github.com/DietrichGebert/ponytail)，从第三方上游仓库加载。

Ponytail 的 Skills 遵循 YAGNI：只实现当前需要的功能，在保证正确性的前提下减少代码和设计复杂度。插件通过 Codex 生命周期 hooks 持续加载这些开发规则。

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
2. 输入 `/hooks`，逐项审核并信任该插件列出的生命周期 hooks。
3. 新建任务，使用 `@ponytail-help` 或 `@ponytail-review` 验证。

没有 Node.js 时 Skills 仍可被调用，但无法自动保持激活。使用 nvm 或 Nix 时，尤其要确认非交互 shell 也能找到 `node`。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。更新后重新审核 hooks，并新建任务。
