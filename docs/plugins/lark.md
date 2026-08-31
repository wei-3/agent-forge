# Lark / 飞书安装与使用

**来源**：[Lark CLI](https://github.com/larksuite/cli)，第三方外链接入。

这个插件从 Lark CLI 上游加载飞书 Skills。市场管理 Skills；`lark-cli`、应用配置和用户授权需要单独完成。

## 安装插件与 CLI

```bash
codex plugin add lark@agent-forge
npm install -g @larksuite/cli@1.0.91
lark-cli --version
```

Claude Code 用户改用 `/plugin install lark@agent-forge`（先执行一次
`/plugin marketplace add wei-3/agent-forge`），CLI 安装步骤相同。

不要使用 `npx @larksuite/cli install`：该安装向导还会全局安装一份 Skills，与市场重复。

## 首次配置与认证

飞书默认使用 `feishu` 品牌：

```bash
lark-cli config init --new --brand feishu
lark-cli auth login --recommend
lark-cli auth status --verify
```

国际版 Lark 将第一条的品牌改为 `--brand lark`。只需要部分能力时，可用
`--domain <domain>` 或 `--scope <scope>` 替代较宽的授权范围。配置和登录会打开浏览器，需要用户亲自完成。

如果沙箱环境无法使用系统 Keychain，只在普通终端中运行
`lark-cli config keychain-downgrade` 作为故障处理；不要由代理自动执行。

## 更新与注意事项

```bash
npm install -g @larksuite/cli@1.0.91
```

插件源码不固定 SHA；重新安装时从上游默认分支取得最新提交。更新方式见 [README：更新已安装插件](../../README.md#更新已安装插件)。CLI 当前审核基线为 1.0.91；升级前先审核新的 Lark 发布并更新这里的精确版本。不要运行 `lark-cli update` 或
`npx skills add larksuite/cli -y -g`；它们会产生第二份 Skills。
