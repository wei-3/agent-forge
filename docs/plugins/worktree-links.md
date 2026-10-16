# worktree-links

`worktree-links` 是 Agent Forge 自有插件，同时支持 Codex 与 Claude Code。源码位于
[wei-3/agent-forge](https://github.com/wei-3/agent-forge)，不接入或依赖其他插件市场。

## 依赖

- Node.js
- git

不需要安装 npm 依赖。

## 安装

```bash
codex plugin add worktree-links@agent-forge
```

```text
/plugin install worktree-links@agent-forge
```

## 使用

安装后新建一个任务，在主工作区让 `$worktree-links` 执行：

```bash
node <插件目录>/scripts/worktree-links.mjs init notes.local private/settings.local
```

随后可执行：

```bash
node <插件目录>/scripts/worktree-links.mjs fix [target]
node <插件目录>/scripts/worktree-links.mjs fixall [target]
node <插件目录>/scripts/worktree-links.mjs check [--verbose] [target]
```

配置只写入当前仓库本地 Git 配置的 `agentforge-worktree-links.file` 与
`agentforge-worktree-links.main`。`init` 只接受明确指定的普通文件，且文件必须位于主工作区内、已存在、未被 Git 跟踪，并被 gitignore
规则忽略。脚本只在目标路径不存在时补建链接，不覆盖已有内容。

## 自动补链的条件与限制

插件只注册 `SessionStart` hook，Codex 与 Claude Code 共用同一份 `hooks/hooks.json`（插件根路径
统一写 `${CLAUDE_PLUGIN_ROOT}`，Codex 为兼容同时接受这个变量名）。进入已有的关联
worktree 并启动或恢复会话时会自动补链；会话中途新建 worktree 后需运行 `fix` 或
`fixall`。两端都会在 hook 之前读取指令文件，因此不要主要依靠此插件同步需要在首次会话中生效的 `AGENTS.md`
等指令文件。

`check` 只读，问题状态为 `MISSING`、`SOURCE_MISSING`、`DANGLING`、`MISTARGET` 和
`DIVERGED`。默认只输出问题；增加 `--verbose` 后还会列出每个健康链接及其绝对目标。
软链接使用绝对路径，主工作区移动后应重新执行 `init`。

若 `init` 报 `INIT_BUSY`，先确认没有其他初始化进程；确认后可删除当前仓库
`.git/agentforge-worktree-links.lock` 再重试。脚本不会自动删除已有文件、错误链接或悬空链接。
