# Postman 安装与使用

这个插件提供 7 个 API 工作流 Skills，并注册 Postman US Full MCP。MCP 与可选 Postman CLI 的登录彼此独立。

## 安装与 MCP 认证

```bash
codex plugin add postman@agent-forge
codex mcp login postman
codex mcp list
```

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

市场插件的更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。Postman CLI 的当前审核基线为 1.45.0，升级前先审核新版本并更新这里的精确版本。

市场已经注册 Postman MCP，不要再执行 `codex mcp add postman ...`。
