# Humanizer 安装与使用

**来源**：[Humanizer](https://github.com/blader/humanizer)，第三方外链接入，MIT 许可证。

Humanizer 用于润色 AI 风格文本，减少套话、夸张措辞和机械句式，同时保留原意和事实。它面向人类读者改善表达，不保证绕过 AI 检测器。

## 前置检查与安装

无需额外 CLI、MCP 服务、API Key 或登录。先按 [README](../../README.md#安装) 添加 Agent Forge 市场。

Codex：

```bash
codex plugin add humanizer@agent-forge
```

安装后新建任务，让任务加载 Skill。市场显式加载上游根目录中的 `SKILL.md`。

Claude Code：

```text
/plugin install humanizer@agent-forge
/reload-plugins
```

上游要求 Claude Code 2.1.142 或更新版本；Claude 端直接使用上游原生插件 manifest。

## 使用与验证

在新任务中明确要求：“使用 humanizer 润色以下文本，保留原意、数字、引用和技术术语：[粘贴文本]”。Claude Code 也可以使用 `/humanizer:humanizer`。

可提供自己的写作样本以匹配语气，或指定需要润色的文件路径。检查改写是否保留原文事实，并减少空泛表达；安装成功不代表无需人工校对。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。上游目录或 manifest 调整可能影响后续安装。
