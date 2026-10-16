# Agent Forge

Agent Forge 是一个优先支持 Codex、同时支持 Claude Code 的插件市场。每个插件都有中文指南，说明安装、配置和使用方法。

## 安装

先添加市场，再按需安装插件。以下以 `humanizer` 为例；安装其他插件时，将 `humanizer` 替换为下方清单中的名称。

### Codex

```bash
codex plugin marketplace add wei-3/agent-forge
codex plugin add humanizer@agent-forge
```

安装后新建一个 Codex 任务以加载插件。

### Claude Code

```text
/plugin marketplace add wei-3/agent-forge
/plugin install humanizer@agent-forge
/reload-plugins
```

## 插件清单

| 插件 | 何时用 |
| --- | --- |
| [`mattpocock-skills`](docs/plugins/mattpocock-skills.md) | 按规划、TDD、调试、领域建模和代码评审流程推进开发时 |
| [`obsidian`](docs/plugins/obsidian.md) | 编辑 Obsidian Markdown、Bases、Canvas，或抽取网页正文时 |
| [`twg`](docs/plugins/twg.md) | 查询或操作 Jira、Confluence 等 Atlassian 工作数据时 |
| [`context7`](docs/plugins/context7.md) | 查询版本相关的最新库文档和代码示例时 |
| [`superpowers`](docs/plugins/superpowers.md) | 用头脑风暴、TDD、系统化调试、计划和评审流程推进开发时 |
| [`postman`](docs/plugins/postman.md) | 发现、调用、测试 API，或管理 Postman 工作流时 |
| [`ponytail`](docs/plugins/ponytail.md) | 寻找最小实现，或审查代码中的过度工程时 |
| [`codegraph`](docs/plugins/codegraph.md) | 索引并探索跨仓库代码关系、引用和调用链时 |
| [`worktree-links`](docs/plugins/worktree-links.md) | 在多个 git worktree 间共享主工作区的 gitignored 本地文件时 |
| [`lark`](docs/plugins/lark.md) | 操作飞书文档、消息、日历、多维表格、邮箱、任务和会议时 |
| [`show-me`](docs/plugins/show-me.md) | 用图解、代码结构草图或 HTML 解释当前话题时 |
| [`humanizer`](docs/plugins/humanizer.md) | 润色 AI 风格文本，在保留事实和原意的前提下让表达更自然时 |

## 外部依赖

安装插件不会自动安装系统级 CLI。请按各插件的中文指南完成依赖安装、认证和首次配置，验证与更新步骤也在指南中。

市场已负责 Skills 与 MCP 注册，请跳过上游安装步骤中复制 Skills 或重复写入 MCP 的部分。

不要把 API Key、Token 或其他凭据写入市场清单或仓库。

## 更新已安装插件

### Codex

通过 Git 添加的 `agent-forge` 市场，需要先刷新市场快照，再重新安装插件。外链插件会取得上游默认分支的最新提交；Humanizer 的 Codex 兼容包随本市场更新：

```bash
codex plugin marketplace upgrade agent-forge
codex plugin add <plugin-name>@agent-forge
```

如果使用本仓库的本地 `.` 市场，直接重新安装插件：

```bash
codex plugin add <plugin-name>@agent-forge
```

更新后新建一个 Codex 任务，以加载更新后的 Skills、MCP 和 hooks。

已安装的插件缓存不会自动同步上游更新。第三方外链不固定 commit SHA，因此不同时间安装的版本可能不同；上游推送、删除文件或调整目录都可能影响下一次安装。

### Claude Code

会话内没有单独更新一个插件的命令：在 `/plugin` 面板的 Marketplaces 里选中 `agent-forge` 触发市场更新，再执行 `/reload-plugins` 让新会话加载更新后的 Skills、MCP 和 hooks。第三方外链同样不固定 SHA，跟随上游默认分支最新提交。

## 本地开发

在仓库根目录添加本地市场：

```bash
codex plugin marketplace add .
codex plugin add <插件名>@agent-forge
```

```text
/plugin marketplace add .
/plugin install <插件名>@agent-forge
```

## 正式插件结构

自研插件放在 `plugins/<plugin-name>/`，为两端各提供一份原生 manifest。第三方插件默认通过外链接入，不复制到本地。

Humanizer 因 Codex 不兼容上游根目录 Skill，使用本地兼容包，仅提供 Codex manifest，并按记录的上游版本手动同步；Claude Code 端仍直接外链上游。来源与同步步骤见其中文指南。

自研插件的目录结构如下：

```text
plugins/<plugin-name>/
├── .codex-plugin/
│   └── plugin.json
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json                   # 仅 MCP 插件需要；两端都按约定自动加载
├── hooks/
│   └── hooks.json               # 仅需要 hooks 的插件才有；两端共用一份，
│                                 # 插件根路径变量统一写 ${CLAUDE_PLUGIN_ROOT}
│                                 # （Codex 为兼容同时接受这个变量名）
├── skills/
│   └── <skill-name>/
│       ├── SKILL.md
│       └── agents/openai.yaml  # 可选的 Skill UI 元数据
└── README.md                   # 可选；用户指南统一放在 docs/plugins/
```

插件目录名、两份市场清单里的 `name`、以及两份插件 manifest 的 `name` 必须一致。
