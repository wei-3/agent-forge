# Postman 安装与使用

**来源**：[Postman Plugin](https://github.com/postmanlabs/postman-plugin)，从第三方上游仓库加载。

安装入口为 `postman@agent-forge`，两端使用同一官方仓库，但接入方式不同：

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

Codex 使用市场维护的简短内联 SessionStart hook。它在会话启动、清空和压缩后提示：涉及实质性工作的 API 工程任务先加载 `postman:api-engineer`，具体任务可直接使用对应的专用技能，用户指令优先。

该 hook 只输出指令，不访问网络或修改文件。它与上游完整 hook 不同，也不会自动跟随上游 hook 更新。Claude Code 使用官方完整 hook。

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

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。已安装缓存不会因上游提交而即时更新。

Codex 的 17 项技能路径和内联 hook 由本市场维护；上游技能发生变化后，需要等待市场同步。Claude Code 的技能和 hooks 随官方整包更新。
