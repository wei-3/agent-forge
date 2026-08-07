# Context7 安装与使用

Context7 是原生 Codex MCP 插件，用于查询版本相关的最新库文档。它直接连接远程 MCP，不需要额外安装 Node.js 或 Context7 CLI。

## 安装与认证

```bash
codex plugin add context7@agent-forge
codex mcp login context7
codex mcp list
```

首次连接通常会自动打开 OAuth；只有未自动弹出或需要重新登录时，才手动执行 `codex mcp login context7`。安装后新建任务，例如要求：

> 使用 Context7 查询 React `useEffect` 的最新文档。

## 更新与注意事项

市场插件的更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。市场已经注册 Context7 MCP，不要再执行 `npx ctx7 setup --codex` 或
`codex mcp add context7 ...`。
