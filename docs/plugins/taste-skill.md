# Taste Skill 安装与使用

**来源**：[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)，从第三方上游仓库加载，采用 MIT 许可证。

Taste Skill 帮助编程助手设计和改版网站、落地页、仪表盘等界面，指导布局、字体、配色和图片选择，再通过浏览器检查与截图评审修正效果。审查或改版已有项目时，会沿用现有技术栈，并保留内容和功能。

安装时使用插件名 `taste-skill`，使用时可指定其中的 `design-taste-frontend` 技能。

## 前置条件

- Node.js 22 或更新版本，且代理的非交互 shell 能找到 `node`。可运行 `node --version` 检查。
- 已安装 Chrome、Edge 或 Chromium，供浏览器检查脚本使用。
- 搜索和下载图片需要联网，无须 API Key。外部图片有各自的许可证，使用时保留技能生成的来源及署名。

Node.js 和浏览器需自行安装。该插件不依赖 agent-browser，也不需要额外配置 MCP。

## 安装插件

先按根目录 [README](../../README.md#安装) 添加 `agent-forge` 市场。

Codex：

```bash
codex plugin add taste-skill@agent-forge
codex plugin list --marketplace agent-forge
```

安装后新建 Codex 任务，以加载技能。

Claude Code：

```text
/plugin install taste-skill@agent-forge
/reload-plugins
```

验证尚未发布的市场改动时，请按 [README：本地开发](../../README.md#本地开发) 从本地仓库安装。

## 使用与验证

安装后，在新任务中确认技能可以加载，并检查运行环境：

> 使用 taste-skill 的 design-taste-frontend 技能，确认技能已加载，检查 Node.js 版本和可用浏览器；先不要修改项目。

正式使用时给出页面目标、现有技术栈和品牌约束，例如：

> 使用 taste-skill 设计这个产品的落地页，保留现有框架、品牌字体与配色。完成后检查桌面、平板和手机布局，提供截图评审结果及图片来源。

> 使用 taste-skill 审查当前仪表盘，只报告视觉与可用性问题，不修改代码。

完整页面流程包括选择设计方向、收集素材、实现页面、运行检查和评审截图。默认检查宽度为 1440、768 和 390 像素；仪表盘等应用界面采用单独的检查规则。工作文件和截图保存在目标项目的 `.taste-skill/` 目录。

完成设计或审查后，应能查看浏览器检查结果、各尺寸截图和仍需处理的问题。技能加载成功只说明安装可用，不能代替这些检查。

若缺少 Node.js 22 或支持的浏览器，可按上游降级流程使用 Node.js 18+ 运行源码检查，再用其他可用浏览器工具截图。报告中应明确说明上游浏览器检查脚本（`inspect.mjs`）未运行，以及哪些检查未完成。

## 使用边界

该技能对字体、配色、装饰和动效有较强的设计偏好，页面和应用界面采用不同规则。已有品牌或设计系统时，应明确哪些规范必须保留，避免为了通过视觉规则而改变产品要求。

完整构建包含多轮截图与修正，耗时和 token 消耗通常高于普通样式修改。[上游 README](https://github.com/Leonxlnx/taste-skill#how-v2-works) 估计一次构建约需 30–45 分钟及数十万 tokens；这是上游估计，实际消耗取决于任务和模型。只需局部调整时，应明确指定组件和修改范围。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。上游调整 manifest、技能路径或运行依赖可能影响后续安装，更新后重新验证技能加载和浏览器检查。

市场已提供技能，无需再通过 `npx skills add` 或上游 `install.sh` 重复安装。

## 维护说明

两端均外链上游仓库，不复制源码：

- Codex 使用上游 `.codex-plugin/plugin.json` 中的技能声明。
- Claude Code 由本市场设置 `strict: false`，并通过 `skills: ["./skills/taste-skill"]` 声明技能，无需上游提供独立的 Claude Code 插件 manifest。

上游技能目录为 `skills/taste-skill`，其中声明的技能名为 `design-taste-frontend`。维护市场配置时，应使用目录路径，不能按技能名替换路径。
