# Postman 安装与使用

**来源**：[Postman Claude Code Plugin](https://github.com/Postman-Devrel/postman-claude-code-plugin)，第三方外链接入。

这个插件提供 11 个 API 与 Flows 工作流 Skills，并注册 Postman US Full MCP。MCP 与可选 Postman CLI 的登录彼此独立。

源码直接来自 Postman 官方仓库。Codex 通过市场清单显式列出技能路径，目前包含 `deploy-flow`、`get-flow-run`、`list-flows`、`trigger-flow` 四个 Flows 技能；上游新增技能时，需要同步这份清单。Claude Code 直接加载官方插件整包。

## 安装与 MCP 认证

```bash
codex plugin add postman@agent-forge
codex mcp login postman
codex mcp list
```

Claude Code 用户改用 `/plugin install postman@agent-forge`（先执行一次
`/plugin marketplace add wei-3/agent-forge`），随后按插件提示完成 MCP 授权。

OAuth 完成后新建任务，可让 Codex“列出我的 Postman workspaces”验证连接。当前市场固定 US MCP 端点；Postman EU MCP 不支持这套 OAuth，EU 用户需要单独的 API Key 适配，不能直接照搬此配置。

## 可选 Postman CLI

只有 `send-request`、`run-collection` 等 CLI 工作流需要安装：

```bash
npm install -g postman-cli@1.45.0
postman --version
postman login
```

交互式 `postman login` 会打开浏览器。CI 才优先使用
`postman login --with-api-key ...`，不要把 API Key 写进仓库或市场清单。

## 更新与注意事项

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。Postman CLI 的当前审核基线为 1.45.0，升级前先审核新版本并更新这里的精确版本。

市场已经注册 Postman MCP，不要再执行 `codex mcp add postman ...`。
