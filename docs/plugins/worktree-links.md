# worktree-links

`worktree-links` 是 Agent Forge 自有的 Codex-only 插件。源码位于
[wei-3/agent-forge](https://github.com/wei-3/agent-forge)，不接入或依赖其他插件市场。

## 依赖

- Node.js
- git

不需要安装 npm 依赖。

## 使用

安装后新建 Codex 任务，在主工作区让 `$worktree-links` 执行：

```bash
node <插件目录>/scripts/worktree-links.mjs init notes.local private/settings.local
```

随后可执行：

```bash
node <插件目录>/scripts/worktree-links.mjs fix [target]
node <插件目录>/scripts/worktree-links.mjs fixall [target]
node <插件目录>/scripts/worktree-links.mjs check [--verbose] [target]
```

配置只写入当前仓库 local git config 的 `agentforge-worktree-links.file` 与
`agentforge-worktree-links.main`。`init` 仅接受主工作区内已存在、未跟踪、被 gitignore
覆盖的显式普通文件。脚本只补缺，不覆盖任何占位。

## 自动层边界

插件只挂 Codex `SessionStart`。进入已有 linked worktree 并启动或恢复会话时会自动补链；
会话中途新建 worktree 后需运行 `fix` 或 `fixall`。Codex 在 hook 之前读取指令文件，
因此不要把依赖首会话生效的 `AGENTS.md` 等文件作为主要使用场景。

`check` 只读，问题状态为 `MISSING`、`SOURCE_MISSING`、`DANGLING`、`MISTARGET` 和
`DIVERGED`。默认只输出问题；增加 `--verbose` 后还会列出每个健康链接及其绝对目标。
软链接使用绝对路径，主工作区移动后应重新执行 `init`。

若 `init` 报 `INIT_BUSY`，先确认没有其他初始化进程；确认后可删除当前仓库
`.git/agentforge-worktree-links.lock` 再重试。脚本不会自动删除已有文件、错误链接或悬空链接。
