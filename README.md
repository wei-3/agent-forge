# Agent Forge

一个以 Codex 为第一支持目标的插件市场。自研插件使用本地目录，第三方插件均固定到已审核的上游 commit SHA，以保证安装来源可复现。

## 本地使用

在仓库根目录执行：

```bash
codex plugin marketplace add .
codex plugin list
```

使用市场名安装插件：

```bash
codex plugin add <plugin-name>@agent-forge
```

当前提供：

| 插件 | 接入方式 | 额外要求 |
| --- | --- | --- |
| [`mattpocock-skills`](docs/plugins/mattpocock-skills.md) | 兼容模式 | 每个项目首次运行 setup Skill |
| [`obsidian`](docs/plugins/obsidian.md) | 兼容模式 | 部分 Skills 可选 Obsidian CLI 或 Defuddle |
| [`twg`](docs/plugins/twg.md) | 兼容模式 | 单独安装 TWG CLI 并登录 |
| [`context7`](docs/plugins/context7.md) | 原生 Codex MCP 插件 | 首次使用时 OAuth |
| [`superpowers`](docs/plugins/superpowers.md) | 原生 Codex 插件 | 无 |
| [`postman`](docs/plugins/postman.md) | 兼容模式：7 个 Skills + Full MCP | MCP 使用 OAuth；部分 Skills 需要 Postman CLI |
| [`ponytail`](docs/plugins/ponytail.md) | 原生 Codex 插件 | hooks 需要 Node.js，并在 `/hooks` 中审核信任 |
| [`codegraph`](docs/plugins/codegraph.md) | 本地 MCP 适配插件 | 单独安装 CodeGraph CLI；每个项目运行一次 `codegraph init` |
| [`lark`](docs/plugins/lark.md) | 兼容模式 | 单独安装 Lark CLI、配置应用并登录 |

兼容模式表示上游没有 `.codex-plugin/plugin.json`，由市场条目声明需要加载的内容。

## 外部依赖

Codex 安装插件时不会安装系统级 CLI。每个插件的独立中文指南列出了外部依赖、认证、首次配置、验证和更新步骤。市场负责 Skills 与 MCP 注册；不要再运行会复制 Skills 或重复写入 MCP 的上游安装步骤。

不要把 API Key、Token 或其他凭据写入市场清单或仓库。

## 更新已安装插件

如果 `agent-forge` 通过 Git 来源添加，先刷新市场快照，再重新安装插件：

```bash
codex plugin marketplace upgrade agent-forge
codex plugin add <plugin-name>@agent-forge
```

如果使用本仓库的本地 `.` 市场，直接重新安装插件：

```bash
codex plugin add <plugin-name>@agent-forge
```

更新后新建一个 Codex 任务，让新任务加载更新后的 Skills、MCP 和 hooks。

## 已有环境切换到 Agent Forge

全新环境可以跳过本节。只有已经从其他来源安装过同名插件，或者手动注册过 Skills、MCP 时才需要清理。

先查看当前插件来源：

```bash
codex plugin list
```

卸载原来的同名插件，再从 Agent Forge 安装：

```bash
codex plugin remove <plugin-name>@<原市场名>
codex plugin add <plugin-name>@agent-forge
```

外部 CLI 与市场插件相互独立。切换市场时通常不需要卸载 `lark-cli`、`twg`、`postman` 或 `codegraph` CLI。

只有执行过下列手动安装时，才需要额外清理：

- 运行过 `npx skills add ...`：清理对应的全局 Skills。
- 运行过 `codex mcp add ...`：移除旧的手动 MCP 注册。
- 运行过 `codegraph install`：执行 `codegraph uninstall --target codex --keep-cli`，只移除旧 Codex 集成并保留 CLI；不要执行 `codegraph uninit`，后者会删除项目索引。

如果此前只通过 Codex 市场安装插件，没有执行上述手动命令，那么卸载原来的同名插件后重新安装即可。

## 正式插件结构

自己编写的正式插件放在 `plugins/<plugin-name>/`。外部第三方插件不复制到这里：

```text
plugins/<plugin-name>/
├── .codex-plugin/
│   └── plugin.json
├── .mcp.json                   # 仅 MCP 插件需要
├── skills/
│   └── <skill-name>/
│       ├── SKILL.md
│       └── agents/openai.yaml  # 可选的 Skill UI 元数据
└── README.md                   # 可选；用户指南统一放在 docs/plugins/
```

插件目录名、市场条目 `name` 和插件 manifest 的 `name` 必须一致。

## 验证

项目只使用 Node.js 内置测试工具，检查市场清单、本地插件 manifest、MCP 配置和
Skill 元数据；不需要安装 Python 或 PyYAML：

```bash
node --test
```

## Claude Code

当前不发布 Claude Code 市场。以后正式支持时，为市场增加
`.claude-plugin/marketplace.json`，并为实际支持 Claude Code 的插件增加
`.claude-plugin/plugin.json`。
