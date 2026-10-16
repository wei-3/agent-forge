# Humanizer 安装与使用

**来源**：[Humanizer](https://github.com/blader/humanizer)，MIT 许可证。Codex 使用 Agent Forge 的本地兼容包装；Claude Code 直接加载上游原生插件。

Humanizer 润色 AI 风格文本，减少套话和机械句式，同时保留原意与事实。它用于改善阅读体验，不保证绕过 AI 检测器。

## 安装与验证

无需额外 CLI、MCP 服务、API Key 或登录。先按 [README](../../README.md#安装) 添加 Agent Forge 市场。

Codex：

```bash
codex plugin add humanizer@agent-forge
```

以前直接安装上游版本的用户也需重新安装，以替换旧缓存。安装后新建任务，在技能选择器选择 `humanizer:humanizer`，或输入 `$humanizer` 并选择该技能，再提供待润色文本。插件详情应列出 Humanizer Skill，网站应指向上游仓库。

Claude Code：

```text
/plugin install humanizer@agent-forge
/reload-plugins
/humanizer:humanizer
```

上游要求 Claude Code 2.1.142 或更新版本。Claude 端不使用本地兼容包。

## 兼容包装与来源

Codex CLI 0.153.4 实测忽略上游 manifest 中的 `skills: ["./"]`：能安装却没有技能。本地包将技能放入 `skills/humanizer/SKILL.md`，以原生 Codex manifest 声明技能目录和网站。

- 上游版本：`3.1.0`；兼容包版本：`3.1.0-agent-forge.1`。
- 上游提交：[225a6f39ac85f76ee48dbad772ea4abe4ed6c9d8](https://github.com/blader/humanizer/commit/225a6f39ac85f76ee48dbad772ea4abe4ed6c9d8)。
- 规则正文保持上游原样。为通过本仓库的平面元数据校验，frontmatter 中的多行 description 改用带转义的字符串，metadata 改用行内映射，内容含义不变。
- `agents/openai.yaml` 与 MIT `LICENSE` 原样保留；许可证版权归 Siqi Chen。
- [upstream.json](../../plugins/humanizer/upstream.json) 记录上游来源、版本、提交、正文及附件 SHA-256，测试防止意外修改。

该兼容包由 Agent Forge 维护，不属于上游官方 Codex 插件，也不自动追踪上游更新。

## 更新与手动同步

Codex 用户按 [README：更新已安装插件](../../README.md#更新已安装插件) 刷新市场并重新安装，取得本市场已同步的兼容包。

维护者同步时：

1. 检出明确的上游提交，审阅 `SKILL.md`、`agents/openai.yaml` 与 `LICENSE` 的差异。
2. 更新本地对应文件，保留规则正文；将 frontmatter 按上述方式转成等价格式。
3. 更新 `upstream.json` 的版本、提交与 SHA-256，并更新 Codex manifest 的兼容包版本和本指南。上游版本变动时用 `<上游版本>-agent-forge.1`；同版包装修订递增末尾序号。
4. 运行 `node --test`，再用 Codex 实际加载器检查 Skill 和网站，重新安装并在新任务中试用。

Claude Code 插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。两端可能因同步节奏不同而使用不同版本。
