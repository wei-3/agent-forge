# TWG 安装与使用

**来源**：[Atlassian TWG CLI](https://github.com/atlassian/twg-cli)，从第三方上游仓库加载。

这个插件提供 Atlassian Teamwork Graph Skills。市场只管理 Skills，TWG CLI 和 OAuth 登录需要单独完成。

## 安装插件

```bash
codex plugin add twg@agent-forge
codex plugin list --marketplace agent-forge
```

Claude Code 用户改用 `/plugin install twg@agent-forge`（先执行一次
`/plugin marketplace add wei-3/agent-forge`）。

## 安装 CLI 并登录

使用 [官方安装器](https://atlassian.github.io/twg-cli/getting-started/installation/) 安装当前稳定版。安装器会校验下载的 CLI 二进制文件。传入 `--skip-skills` 避免重复安装市场已提供的 Skills，传入 `--skip-login` 将登录留到安装完成后。

```bash
(
  set -eu
  installer="$(mktemp "${TMPDIR:-/tmp}/twg-install.XXXXXX")"
  trap 'rm -f "$installer"' EXIT
  curl -fsSLo "$installer" https://teamwork-graph.atlassian.com/cli/install
  bash "$installer" --skip-skills --skip-login
)
```

安装成功后，按安装器提示重新打开终端，再检查版本并登录。

```bash
twg --version
twg login
twg doctor
```

需要指定 Atlassian 站点时使用 `twg login --site <site>`。`twg doctor` 会检查本地版本、认证解析和 API 连通性。

## 更新

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。升级 CLI 时先查看 [官方变更日志](https://atlassian.github.io/twg-cli/changelog/)，再重跑上一节的安装命令，完成后运行 `twg doctor`。

不要运行 `twg setup` 或 `twg skills install`；它们会再安装一份 Skills。`twg update` 也可能刷新 Skills，市场模式下不作为默认更新方式。
