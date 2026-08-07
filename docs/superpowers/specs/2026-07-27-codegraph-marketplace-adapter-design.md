# CodeGraph、Lark 与插件指南设计

## 目标

将 CodeGraph 和 Lark 作为可发现、可安装的 Codex 插件加入 Agent Forge：
CodeGraph 使用本地薄适配层注册 MCP，Lark 直接引用官方 Skills。

市场不打包系统级 CodeGraph CLI 或 `lark-cli`。市场负责插件能力和使用指引；
指南固定已审核的外部 CLI 安装基线，用户仍自行安装、升级和卸载 CLI。

## 范围

新增以下适配插件：

```text
plugins/codegraph/
├── .codex-plugin/
│   └── plugin.json
├── .mcp.json
└── skills/
    └── codegraph/
        ├── SKILL.md
        └── agents/
            └── openai.yaml
```

市场追加一个指向 `./plugins/codegraph` 的本地 `codegraph` 条目，以及一个
固定到官方正式发布提交的远程 `lark` 条目。根目录 README 为每个市场插件
链接一份位于 `docs/plugins/` 的独立安装指南。

本次为当前全部插件创建安装指南：

```text
docs/plugins/
├── mattpocock-skills.md
├── obsidian.md
├── twg.md
├── context7.md
├── superpowers.md
├── postman.md
├── ponytail.md
├── codegraph.md
└── lark.md
```

## CodeGraph 运行流程

1. 用户通过 npm 在每台电脑上安装已审核的 CodeGraph CLI `1.5.0`：
   `npm install -g @colbymchenry/codegraph@1.5.0`。
2. 用户安装 `codegraph@agent-forge`。
3. Codex 读取适配插件的 `.mcp.json`，启动 `codegraph serve --mcp`。
4. 用户在每个希望建立索引的项目中主动执行一次 `codegraph init`。
5. CodeGraph 通过 MCP 文件监听器持续维护该项目的索引。

适配插件不得执行 `codegraph install`，因为该命令还会写入全局 Codex MCP
配置，造成与插件管理的 MCP 注册重复。

CodeGraph CLI 的安装、修复和升级使用 `codegraph upgrade <已审核版本>`，由 CLI
保持原 npm 安装渠道；当前基线为 `codegraph upgrade 1.5.0`。升级到新版本前
先完成审核，再同步更新指南中的精确版本。

## Lark 运行流程

1. 用户安装 `lark@agent-forge`，Codex 从上游 `./skills/` 加载官方 Lark
   Skills。
2. 用户在每台电脑上单独安装一次 `lark-cli`。
3. 用户首次使用时运行 `lark-cli config init`，再按所需业务域或 scope 完成
   OAuth 授权。
4. Codex 根据已加载的 Skills 调用本机 `lark-cli`。

市场不提供 MCP，不执行 CLI 安装、配置或认证，也不写入任何凭据。

## 组件

### 插件 manifest

`plugins/codegraph/.codex-plugin/plugin.json` 使用适配层自身的 `0.1.0`
版本，注明上游项目信息，并指向 `./skills/` 和 `./.mcp.json`。

manifest 不包含 hooks、apps、安装脚本或平台二进制文件；外部 CLI 不随插件打包。

### MCP 配置

`plugins/codegraph/.mcp.json` 只包含一个本地 stdio 服务：

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

配置不包含 `npx`、软件包版本、绝对可执行路径、凭据或环境变量覆盖。

### 使用 skill

简短的 `codegraph` skill 用于已经包含 `.codegraph/` 的仓库：

- 对已索引源码优先使用 CodeGraph MCP 工具；
- 没有索引或 MCP 不可用时退回 Codex 原生仓库工具；
- 未获得用户明确授权时不得初始化项目；
- 用户同意初始化后，使用外部安装的 `codegraph init`。

该 skill 不复制上游完整手册，也不包含安装脚本；精确的外部 CLI 安装基线只在
安装指南中维护。

### Lark 远程条目

Lark 使用已验证的整仓 Skills 接入方式，并按 Agent Forge 的可
复现策略固定到官方 `v1.0.77` 提交
`a7865cd0a7416655535517a2a630848fde318761`：

```json
{
  "name": "lark",
  "source": {
    "source": "url",
    "url": "https://github.com/larksuite/cli.git",
    "sha": "a7865cd0a7416655535517a2a630848fde318761"
  },
  "skills": "./skills/",
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

不创建 `plugins/lark/`，不复制上游 Skills，不添加 MCP、hooks 或安装脚本。
外部 CLI 使用 `npm install -g @larksuite/cli@1.0.77` 独立安装；升级继续使用 npm
这一原安装渠道，并在审核新的精确版本后更新指南。

文档不得推荐 `npx @larksuite/cli install` 或 `lark-cli update`：前者
会额外安装全局 Skills，后者也会同步全局 Skills，都会与市场插件重复。

### 安装文档

每个 `docs/plugins/<name>.md` 文件使用市场插件名作为文件名，并只说明
该插件：

- 市场安装命令；
- 必需的外部 CLI 或运行环境；
- 认证和初始化步骤；
- 最小验证命令或检查方式；
- 必要的重复注册和兼容性警告。

根目录 README 保持为简短目录，并把每个插件名链接到对应指南。市场的
通用添加、更新和已有环境切换步骤只保留在根目录 README，不在每份指南中重复。

市场契约要求每个插件条目都存在同名安装指南，确保以后新增插件时不会
遗漏文档。不额外创建模板文件，已有指南就是后续新增文档的范例。

### 文档语言

本次新增或修改的说明性文档统一使用中文。命令、JSON 字段、文件路径、
产品名和必要的技术术语保留原文，避免翻译后无法直接搜索或执行。

## 故障处理

- 缺少 `codegraph` 可执行程序：MCP 启动失败；指南提供已审核的 npm CLI
  前置条件，适配插件不自动下载软件。
- 缺少 `.codegraph/`：使用 Codex 原生文件工具，并可询问用户是否初始化。
- 已存在全局 CodeGraph MCP：提醒用户不要同时启用两份注册，绝不自动修改
  用户的全局 Codex 配置。
- 索引异常：先建议 `codegraph status`，再使用 `codegraph sync`；明确需要
  完整重建时使用 `codegraph index`，只有确认索引损坏时才增加 `--force`。
- 缺少 `lark-cli`：Lark Skills 不可执行；指南提供独立的 CLI-only 安装命令。
- 已从其他市场安装同名 Lark 插件或全局 Lark Skills：要求只保留一个 Skills 来源，
  不自动卸载用户现有插件或全局文件。
- Codex 沙箱无法访问 macOS Keychain：仅在故障排查中提示用户从普通终端
  运行上游提供的降级命令，不由插件自动执行。

## 验证

实现遵循红绿测试流程：

1. 扩展市场契约测试，要求存在本地 `codegraph` 条目、manifest、skill 路径、
   精确的 `.mcp.json` 命令，并要求远程 `lark` 条目使用精确 SHA 和
   `./skills/`；同时要求每个市场插件都有对应的 `docs/plugins/<name>.md`，
   在实现和文档尚未添加时确认测试失败。
2. 在没有新 skill 的情况下运行基线场景，记录 agent 是否会擅自初始化未
   索引仓库，或在已有索引时忽略 CodeGraph。
3. 添加最小适配插件和 skill。
4. 使用 `plugin-creator` 的验证器检查插件，并使用 skill 验证器检查 skill。
5. 检查 README 中的每个插件目录链接都能解析到对应指南。
6. 带上新 skill 重新运行场景，并执行 `node --test`。

测试不得安装 CodeGraph、初始化真实项目、修改全局 Codex 配置或依赖网络。

## 非目标

- 打包或复制 CodeGraph 源码及各平台二进制文件。
- 通过 `npx` 安装 CodeGraph。
- 自动执行 `codegraph init`。
- 打包、安装、配置或认证 `lark-cli`。
- 创建本地 Lark 适配插件、MCP、hooks 或上游 Skills 副本。
- 在本次变更中添加 Claude Code 市场文件。
- 修改用户现有的全局 CodeGraph、Lark 安装或 Codex 配置。

未来的 Claude Code 适配层可以复用同一个 `.mcp.json`，但只在正式实现
Claude Code 市场支持时再设计。
