# Agent Browser 安装与使用

**来源**：[Vercel Agent Browser](https://github.com/vercel-labs/agent-browser)，从第三方上游仓库加载；[官方文档](https://agent-browser.dev)。

Agent Browser 通过 CLI 自动化操作浏览器，可用于网页测试、表单填写、截图和数据抽取。插件提供 Skills，CLI 和浏览器需要另行安装。

## 安装插件

先按根目录 [README](../../README.md#安装) 添加 `agent-forge` 市场。

Codex：

```bash
codex plugin add agent-browser@agent-forge
codex plugin list --marketplace agent-forge
```

安装后新建 Codex 任务，让插件生效。

Claude Code：

```text
/plugin install agent-browser@agent-forge
/reload-plugins
```

Codex 中的插件版本会显示为 `local`，这是上游未提供独立插件 manifest 所致，不影响技能加载。

## 安装 CLI 与浏览器

本机已有 Node.js 和 npm 时，执行：

```bash
npm install -g agent-browser
agent-browser install
agent-browser --version
```

`agent-browser install` 会下载 Chrome for Testing，需要联网。Linux 若提示缺少系统库，可执行 `agent-browser install --with-deps`；它会通过系统包管理器安装依赖，可能需要管理员权限。

macOS 也可以使用 Homebrew：

```bash
brew install agent-browser
agent-browser install
```

本地使用不需要 API Key。使用云浏览器等可选服务时，再按对应文档配置。插件没有 MCP 或 hooks。

## 使用与验证

上游的 `SKILL.md` 用于引导代理读取 CLI 自带的操作说明。先确认说明可以正常加载：

```bash
agent-browser skills get core
```

若提示子命令不存在，先更新 CLI。随后在新任务中输入：

> 使用 agent-browser 打开 https://example.com，读取标题并截图，然后关闭浏览器。

也可以在终端中验证。以下命令使用独立会话，最后一条会关闭该会话的浏览器：

```bash
agent-browser --session agent-forge-check open https://example.com
agent-browser --session agent-forge-check get title
agent-browser --session agent-forge-check snapshot -i
agent-browser --session agent-forge-check screenshot /tmp/agent-forge-browser-check.png
agent-browser --session agent-forge-check close
```

确认标题为 `Example Domain`，截图能正常打开。`snapshot -i` 只显示可交互元素，这个示例页的输出较少。操作其他网页时，先从快照中取得元素引用；页面变化后，重新获取快照。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。操作步骤见 [README：更新已安装插件](../../README.md#更新已安装插件)。上游调整目录或技能后，可能影响下一次安装。

CLI 需要单独更新：通过 npm 安装的执行 `npm install -g agent-browser@latest`，通过 Homebrew 安装的执行 `brew upgrade agent-browser`。更新后，按上游提示运行 `agent-browser install`。

市场已提供 Skills，无需再运行 `npx skills add vercel-labs/agent-browser`，以免重复安装。两端的外链接入参考 [agent-soulmate](https://github.com/qishaoyumu/agent-soulmate)。
