# Obsidian 安装与使用

**来源**：[Obsidian Skills](https://github.com/kepano/obsidian-skills)，第三方外链接入。

这个插件提供 Obsidian Markdown、Bases、JSON Canvas、Obsidian CLI 和网页正文提取 Skills。直接处理 Markdown、Base 和 Canvas 文件时不需要外部 CLI。

## 安装

```bash
codex plugin add obsidian@agent-forge
codex plugin list --marketplace agent-forge
```

安装后新建一个 Codex 任务。

## 可选外部工具

使用 `obsidian-cli` Skill 时：

1. 安装 Obsidian 桌面版 1.12.7 或更高版本。
2. 在 Obsidian 的 `Settings → General` 打开 `Command line interface`，按提示注册命令。
3. 验证：

```bash
obsidian version
```

CLI 会连接正在运行的 Obsidian；若未运行，首条命令会启动应用。

仅使用 `defuddle` Skill 时，需要 Node.js，并安装：

```bash
npm install -g defuddle@0.19.2
defuddle --help
```

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。Obsidian 桌面版通过其官方渠道更新；`defuddle` 的当前审核基线为 0.19.2，升级前先审核新版本并更新这里的精确版本。
