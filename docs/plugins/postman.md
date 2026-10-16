# Postman 安装与使用

**来源**：[Postman Plugin](https://github.com/postmanlabs/postman-plugin)，第三方外链接入。

统一安装入口为 `postman@agent-forge`，两端使用同一官方仓库，但接入方式不同：

- Codex 只安装上游 `skills` 子目录，市场显式列出 17 个技能，单独注册直接 HTTP MCP 和简短内联 hook；不引入上游原生 manifest 或 `.app.json`，无需连接 ChatGPT Postman App。
- Claude Code 仍从仓库根目录加载官方原生插件，使用其技能、MCP 和 hooks。

## 安装与认证

先按 [README：安装](../../README.md#安装) 注册 `agent-forge` 市场，再安装：

```bash
codex plugin add postman@agent-forge
codex mcp login postman
codex mcp list
```

Claude Code 用户执行：

```text
/plugin install postman@agent-forge
```

安装后按宿主中的插件/MCP 连接提示完成授权，并在新会话中执行“列出我的 Postman workspaces”等只读查询验证连接。上游 MCP 配置中的服务键为 `postman`，端点为 `https://mcp.postman.com/mcp`；宿主可能为插件服务添加命名空间，应以实际显示的名称和认证入口为准，不另行手工注册相同 MCP。

插件安装、MCP 授权与 Postman CLI 登录是独立步骤，不能以其中一步成功推断其余步骤完成。Codex 使用 ChatGPT 账号登录也不替代 Postman MCP 授权。其他区域的端点和认证方式须按上游说明单独核实。

## 启动行为与外部依赖

Codex 由市场维护简短内联 SessionStart hook，在会话启动、清空和压缩后提示：非平凡 API 工程任务先加载 `postman:api-engineer`，具体任务可直接进入对应专用技能，用户指令优先。该 hook 只输出指令，不访问网络或修改文件。它不是上游完整 hook 的复制，也不会自动跟随上游 hook 更新；Claude Code 继续使用官方完整 hook。

Codex 安装或启用插件不会自动信任其 hook。首次使用时，在交互式 CLI 中打开 `/hooks`，审阅并信任当前 Postman hook，再新建会话验证；未信任的 hook 会被跳过。后续更新若改变 hook 定义，需要重新审阅。参见 [官方 hook 信任说明](https://developers.openai.com/plugins/build/plugins#bundled-hooks)。

Codex 内联 hook 使用 shell 的 `echo`，不依赖上游脚本路径；Claude Code 官方 hook 使用 Bash。技能子目录没有原生 manifest，Codex 安装版本可能显示为 `local`，这不表示源码来自本地，也不能与 Claude Code 的插件版本号直接比较。

## 按需使用 Postman CLI

MCP 工作流不要求先安装 CLI。需要本地 CLI 命令时，按 [官方 CLI 安装说明](https://github.com/postmanlabs/postman-plugin/blob/main/skills/bootstrap/reference/cli_installation.md) 安装，再检查实际版本与所用命令：

```bash
postman --version
postman --help
```

上游未声明全插件统一的 CLI 最低版本，旧文档的 `1.45.0` 不再作为审核基线。按对应技能及命令帮助核实功能要求；例如 [API simulation](https://github.com/postmanlabs/postman-plugin/blob/main/skills/api-simulation/SKILL.md) 要求 CLI 至少为 `1.70.0`。不要把这一功能门槛当作所有技能的统一要求。

本地文件操作不要求普通登录；`postman init` 使用 agent-scoped session，访问已有工作区时按 [bootstrap 指引](https://github.com/postmanlabs/postman-plugin/blob/main/skills/bootstrap/SKILL.md) 登录。需要普通登录时执行 `postman login`，不要把 API Key 写进仓库或市场清单。CLI 登录不代表 MCP 已认证。

绑定工作区后的部分 CLI 操作会向 Postman 上报产物或活动；支持时可用 `--report-events=false` 控制单次 CLI 上报，但它不控制 MCP 请求。执行前应核对命令行为，不能把“本地优先”理解为所有数据仅保留本地。

## 更新与验收边界

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。已安装缓存不会因上游提交而即时更新。

Codex 的 17 项技能路径和内联 hook 由本市场维护；上游新增、删除或重命名技能时，需要同步市场清单和契约测试。不能用 `skills: "./"` 代替路径数组，Codex 会拒绝这个路径。只安装 `skills` 不会带入上游 hooks、MCP 或 App 文件，所以也不能引用 `../hooks`。Claude Code 的技能和 hooks 随官方整包更新。

本仓库静态测试检查两端来源、Codex 的技能列表与直接 MCP、内联 hook 输出、无 App 声明，以及 Claude Code 不覆盖原生组件；不下载上游，也不证明 OAuth 授权成功。

2026-10-15 的临时目录验证使用 Codex CLI 0.153.4 和 Claude Code 2.1.292，上游快照为 `92e8500e13af060080d0d946d7f34f6f5c98477d`，不代表固定后续安装版本或已发布远端市场：

- Codex 的 skills-only 候选配置实际安装成功，17 个技能在新会话可见；内联测试 hook 成功注入上下文。ChatGPT 登录后直接 `postman` MCP 仍可见，并到达官方服务，返回需要认证。最终内联指令另由仓库测试实际执行检查。
- Claude Code 官方原生插件 2.1.0 安装成功，初始化事件列出 17 个技能，SessionStart 执行成功；宿主未登录，MCP 健康检查返回 `Needs authentication`。

Codex 新会话 hook 验证对已审阅的测试指令使用了单次 `--dangerously-bypass-hook-trust`，不代表完成正常用户的持久信任流程；正常安装仍通过 `/hooks` 审阅。未清理或更改日常插件配置，临时宿主登录副本已移除。

待补充：两端 Postman OAuth 授权和代表性只读查询、Claude Code 登录后的模型响应、Windows 上的 hook，以及清空和压缩事件实测。当前不宣称完整运行验收通过，也不要求另行安装或授权 Postman App。
