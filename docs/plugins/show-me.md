# Show Me 安装与使用

**来源**：[HumanLayer Skills](https://github.com/humanlayer/skills)，第三方外链接入。

两端均只加载上游 `plugins/show-me` 子目录，提供一个同名技能，不包含 HumanLayer 的其他插件。技能根据当前话题选择伪代码、调用树、目录树、Mermaid、结构 diff 或独立 HTML 来解释问题。

## 安装

先按根目录 [README](../../README.md#安装) 添加 `agent-forge` 市场。

Codex：

```bash
codex plugin add show-me@agent-forge
codex plugin list --marketplace agent-forge
```

安装后新建一个 Codex 任务，让新任务加载技能。

Claude Code：

```text
/plugin install show-me@agent-forge
/reload-plugins
```

## 使用与验证

上游在 Claude Code 的技能 frontmatter 和 Codex 的 `agents/openai.yaml` 中都禁用了隐式调用，需要明确选择技能。

Codex 可输入 `$show-me` 并从技能选择器选择对应技能，例如：

```text
$show-me 用调用树解释当前讨论的请求处理流程。
```

Claude Code 插件技能使用带命名空间的命令：

```text
/show-me:show-me 用调用树解释当前讨论的请求处理流程。
```

确认技能能被选择，并输出与上下文一致的图解或结构草图，即可完成基本验证。生成 HTML 时，确认文件已保存且能打开预览。

## 外部依赖与兼容性

不包含 MCP 或 hooks，不需要额外 CLI、API Key 或账号认证。生成 HTML 时需要可写的输出目录及浏览器或宿主预览能力；Mermaid 的显示效果取决于客户端是否支持渲染。

上游 HTML 示例使用 macOS 的 `open` 命令。其他系统应使用宿主预览功能或相应的文件打开方式，不要照搬该命令。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。上游目录或技能行为变化可能影响下一次安装。

市场已经提供该技能，不需要再运行上游的 `npx skills add`，以免重复安装。
