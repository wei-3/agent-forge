# CodeGraph 安装与使用

这个插件是薄适配层：市场负责 Skill 和 `codegraph serve --mcp` 注册，外部 CodeGraph CLI 与每个项目的 `.codegraph/` 索引由用户管理。

## 安装插件

```bash
codex plugin add codegraph@agent-forge
codex plugin list --marketplace agent-forge
```

## 安装 CLI

使用 npm 安装已审核的 CLI：

```bash
npm install -g @colbymchenry/codegraph@1.5.0
codegraph --version
```

不要运行裸 `codegraph` 或 `codegraph install` 进入 agent installer；它会另行写入全局 Codex MCP 配置和 `AGENTS.md`，与市场插件重复。

如果旧版本曾通过 agent installer 注册过 MCP，先执行
`codegraph uninstall --target codex --keep-cli`，在交互中选择原来的安装位置，只移除旧 Codex agent 配置，再安装市场插件；不要执行
`codegraph uninit`，它会删除项目的 `.codegraph/` 索引。

## 每个项目首次初始化

在项目根目录显式执行一次：

```bash
codegraph init
codegraph status
```

`init` 已创建 `.codegraph/` 并完成首次完整索引，不需要紧接着执行
`codegraph index`。随后新建 Codex 任务，插件会自动启动 MCP。

日常由 MCP watcher 同步；仅在 watcher 未运行时使用 `codegraph sync`。确认需要完整重建时才执行 `codegraph index`，`--force` 应留给已确认损坏的索引。

## 更新

```bash
codegraph upgrade --check
codegraph upgrade 1.5.0
```

当前审核基线保持为 1.5.0。升级到新版本前先审核上游发布，再同步更新本指南中的精确版本。市场插件的更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。匿名遥测可用 `codegraph telemetry off` 关闭。
