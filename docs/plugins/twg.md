# TWG 安装与使用

这个插件提供 Atlassian Teamwork Graph Skills。市场只管理 Skills，TWG CLI 和 OAuth 登录需要单独完成。

## 安装插件

```bash
codex plugin add twg@agent-forge
codex plugin list --marketplace agent-forge
```

## 安装 CLI 并登录

官方安装器默认也会安装 Skills，因此必须跳过这一部分，避免和市场重复。下载后先校验本次审核的脚本 SHA-256，再固定安装 CLI 1.1.1：

```bash
(
  set -eu
  installer="$(mktemp "${TMPDIR:-/tmp}/twg-install.XXXXXX")"
  trap 'rm -f "$installer"' EXIT
  curl -fsSLo "$installer" https://teamwork-graph.atlassian.com/cli/install
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s  %s\n' '8468bb52cb23b897217dd4cfe537cb0f8ea989c4cbdf2c3befe92d17022fc9a0' "$installer" | sha256sum -c -
  else
    printf '%s  %s\n' '8468bb52cb23b897217dd4cfe537cb0f8ea989c4cbdf2c3befe92d17022fc9a0' "$installer" | shasum -a 256 -c -
  fi
  bash "$installer" --version 1.1.1 --skip-skills --skip-login
)
twg login
twg doctor
```

需要指定 Atlassian 站点时使用 `twg login --site <site>`。`twg doctor` 会检查本地版本、认证解析和 API 连通性。

## 更新

当前审核基线保持为 1.1.1。升级前先审核新安装器与 CLI，并同步替换上一节的 SHA-256 和 `--version`；仅需修复当前版本时可原样重跑该命令。市场插件的更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)，完成后运行 `twg doctor`。

不要运行 `twg setup` 或 `twg skills install`；它们会再安装一份 Skills。`twg update` 也可能刷新 Skills，市场模式下不作为默认更新方式。
