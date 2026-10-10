# Agent Forge

一个以 Codex 为第一支持目标、同时支持 Claude Code 的插件市场。自研插件使用本地目录，两端各带一份原生 manifest；第三方插件通过外链接入，不固定 commit SHA，重新安装时跟随上游默认分支最新版本。

## 安装

添加市场并安装需要的插件。两端各给了一个全量安装块，不必照着清单手打插件名。

### Codex

```bash
codex plugin marketplace add wei-3/agent-forge
codex plugin add <插件名>@agent-forge
```

将 `<插件名>` 替换为下方清单中的名称。安装后新建一个 Codex 任务，让新任务加载插件。

全部装齐：

```bash
codex plugin marketplace add wei-3/agent-forge
codex plugin add mattpocock-skills@agent-forge
codex plugin add obsidian@agent-forge
codex plugin add twg@agent-forge
codex plugin add context7@agent-forge
codex plugin add superpowers@agent-forge
codex plugin add postman@agent-forge
codex plugin add ponytail@agent-forge
codex plugin add codegraph@agent-forge
codex plugin add worktree-links@agent-forge
codex plugin add lark@agent-forge
codex plugin add show-me@agent-forge
```

### Claude Code

```text
/plugin marketplace add wei-3/agent-forge
/plugin install <插件名>@agent-forge
```

将 `<插件名>` 替换为下方清单中的名称，装完执行 `/reload-plugins` 生效。

全部装齐：

```text
/plugin marketplace add wei-3/agent-forge
/plugin install mattpocock-skills@agent-forge
/plugin install obsidian@agent-forge
/plugin install twg@agent-forge
/plugin install context7@agent-forge
/plugin install superpowers@agent-forge
/plugin install postman@agent-forge
/plugin install ponytail@agent-forge
/plugin install codegraph@agent-forge
/plugin install worktree-links@agent-forge
/plugin install lark@agent-forge
/plugin install show-me@agent-forge
/reload-plugins
```

## 插件清单

| 插件 | 何时用 |
| --- | --- |
| [`mattpocock-skills`](docs/plugins/mattpocock-skills.md) | 想按规划、TDD、调试、领域建模和代码评审等工程纪律推进开发时 |
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

## 外部依赖

两端安装插件时都不会安装系统级 CLI。每个插件的独立中文指南列出了外部依赖、认证、首次配置、验证和更新步骤。市场负责 Skills 与 MCP 注册；不要再运行会复制 Skills 或重复写入 MCP 的上游安装步骤。

不要把 API Key、Token 或其他凭据写入市场清单或仓库。

## 更新已安装插件

### Codex

如果 `agent-forge` 通过 Git 来源添加，先刷新市场快照，再重新安装插件。第三方插件会在重新安装时取得上游默认分支的最新提交：

```bash
codex plugin marketplace upgrade agent-forge
codex plugin add <plugin-name>@agent-forge
```

如果使用本仓库的本地 `.` 市场，直接重新安装插件：

```bash
codex plugin add <plugin-name>@agent-forge
```

更新后新建一个 Codex 任务，让新任务加载更新后的 Skills、MCP 和 hooks。

第三方上游更新不会自动进入已经安装的插件缓存。外链不固定 SHA 的代价是安装结果不可复现；上游推送、删除文件或调整目录都可能直接影响下一次安装。

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

自己编写的正式插件放在 `plugins/<plugin-name>/`，两端各带一份原生 manifest。外部第三方插件不复制到这里：

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

## 验证

项目只使用 Node.js 内置测试工具，检查市场清单、本地插件 manifest、MCP 配置和
Skill 元数据；不需要安装 Python 或 PyYAML：

```bash
node --test
```

GitHub Actions 的 [CI 工作流](.github/workflows/ci.yml) 在 PR 创建或更新、推送到
`main` 时自动运行，也支持合入默认分支后在 Actions 页面手动触发。
工作流使用 GitHub 托管的标准 `ubuntu-latest` runner 和 Node.js 24，直接执行
`node --test`，不需要安装项目依赖、注册自托管 runner 或配置 Secrets。
每次运行最多 10 分钟，同一分支的新运行会取消旧运行。

这是现有测试的 CI 检查，不包含 AI 代码审查。公开仓库的标准托管 runner 运行时间免费。
