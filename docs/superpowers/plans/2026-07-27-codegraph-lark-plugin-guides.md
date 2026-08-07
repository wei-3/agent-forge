# CodeGraph、Lark 与插件中文指南实施计划

> **For Codex:** 按 TDD 顺序执行本计划；每个实现阶段完成后运行对应验证。

**Goal:** 将 CodeGraph 本地适配器和 Lark 远程兼容条目加入 `agent-forge`，并为市场中的全部 9 个插件提供独立中文安装指南。

**Architecture:** 远程仓库继续由市场清单固定 SHA；CodeGraph 只提供本地 MCP/Skill 薄适配，CLI 与项目索引由用户显式管理；每个市场条目必须对应 `docs/plugins/<name>.md`。

**Tech Stack:** JSON、Markdown、Node.js 内置测试运行器、Codex 插件清单。

**Constraints:** 不安装外部 CLI，不执行认证或项目初始化，不修改全局 Codex 配置，不提交 Git。

**CodeGraph Skill 基线：** 无 Skill 的独立代理能正确等待初始化授权，但会在
`codegraph init` 后重复执行 `codegraph index`。因此 Skill 只需明确：`init`
已完成首次索引，优先使用插件提供的 MCP 工具；未获初始化授权时使用原生文件搜索。

### Task 1：扩展市场契约测试（RED）

**Files:**
- Modify: `tests/marketplace-contracts.test.mjs`

1. 断言最终插件集合包含 `codegraph` 与 `lark`。
2. 断言 Lark 的固定仓库、SHA 和 Skills 路径。
3. 断言 CodeGraph 的本地来源、manifest 与 MCP 启动命令。
4. 遍历全部市场插件，断言存在中文 `docs/plugins/<name>.md` 及 README 链接。
5. 运行 `node --test`，确认因实现尚不存在而失败。

### Task 2：实现 CodeGraph 本地适配器

**Files:**
- Create: `plugins/codegraph/.codex-plugin/plugin.json`
- Create: `plugins/codegraph/.mcp.json`
- Create: `plugins/codegraph/skills/codegraph/SKILL.md`
- Create: `plugins/codegraph/skills/codegraph/agents/openai.yaml`
- Modify: `.agents/plugins/marketplace.json`

1. 使用官方插件脚手架创建最小目录。
2. 将 MCP 配置设为 `codegraph serve --mcp`。
3. Skill 仅指导状态检查、显式初始化和降级到原生搜索；不得自动运行 `codegraph init`。
4. 将 CodeGraph 以本地来源写入市场。

### Task 3：加入 Lark 并编写全部中文指南

**Files:**
- Modify: `.agents/plugins/marketplace.json`
- Modify: `README.md`
- Create: `docs/plugins/mattpocock-skills.md`
- Create: `docs/plugins/obsidian.md`
- Create: `docs/plugins/twg.md`
- Create: `docs/plugins/context7.md`
- Create: `docs/plugins/superpowers.md`
- Create: `docs/plugins/postman.md`
- Create: `docs/plugins/ponytail.md`
- Create: `docs/plugins/codegraph.md`
- Create: `docs/plugins/lark.md`

1. 添加固定到 Lark v1.0.77 提交的远程条目。
2. 每份指南写清市场安装、外部依赖、首次配置、验证、升级与冲突边界。
3. README 的插件列表链接到对应指南，并移除会重复安装 Skills 的命令。
4. 运行 `node --test`，确认契约测试通过。

### Task 4：完整验证与复核

**Files:**
- Verify only: all changed files

1. 运行 CodeGraph 插件 validator。
2. 运行 CodeGraph Skill validator。
3. 运行 `node --test` 与 `git diff --check`。
4. 检查 `git status --short`，确认未触碰 `.idea/`、全局配置及无关文件。
