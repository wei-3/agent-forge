---
name: worktree-links
description: 当需要把 Git 主工作区中选定的本地忽略文件共享到关联工作树，或需要修复、检查这些软链接时使用。
---

# Worktree 软链接

使用 Node 运行插件内置的 `scripts/worktree-links.mjs`。从当前插件根目录解析脚本路径；
脚本只依赖 Node 标准库和 Git。

## 命令

| 需求 | 命令 |
| --- | --- |
| 在主工作区初始化配置 | `node <脚本> init <文件...>` |
| 修复一个关联工作树 | `node <脚本> fix [目标]` |
| 修复全部关联工作树 | `node <脚本> fixall [目标]` |
| 只读检查链接状态 | `node <脚本> check [--verbose] [目标]` |

`init` 会替换当前仓库 local Git 配置中的 `agentforge-worktree-links.file`，并把主工作区
绝对路径缓存到 `agentforge-worktree-links.main`。每一项必须是主工作区中已存在、未被
Git 跟踪且已被 gitignore 覆盖的显式相对普通文件。目录、软链接源、通配模式、绝对路径
和路径穿越都会被拒绝。

`fix` 和 `SessionStart` hook 只补齐缺失落点，不替换任何已有文件或链接。`check` 会报告
`MISSING`、`SOURCE_MISSING`、`DANGLING`、`MISTARGET` 和 `DIVERGED`；发现任一问题时
退出码为 1。默认情况下健康链接不输出；增加 `--verbose` 后会输出每个健康链接的相对路径
和绝对目标。

## 自动覆盖范围

Codex 只会在已有的关联工作树中启动或恢复会话时运行该 hook。当前会话中途新建的工作树
需要执行 `fix`；也可以执行 `fixall` 修复整个仓库。

本技能适合不要求首个会话立即可用的本地工作流数据。Codex 会在 `SessionStart` hook 之前
读取指令文件，因此不应优先用它共享 `AGENTS.md` 等首会话指令。

## 常见错误

- `INIT_BUSY`：另一个 `init` 正在写入清单。等待其结束后重试；若确认没有 `init` 在运行，
  删除残留的 `.git/agentforge-worktree-links.lock` 后重试。
- `INVALID_MAIN`：仓库已移动，或缓存的主工作区不存在。回到主工作区重新执行 `init`。
- `DIVERGED`、`MISTARGET` 或 `DANGLING`：检查已被占用的落点；脚本不会自动删除或替换它。
