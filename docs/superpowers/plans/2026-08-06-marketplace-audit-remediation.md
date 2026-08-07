# Marketplace Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复全量审查发现的插件迁移、供应链文档、契约测试和许可证问题。

**Architecture:** 保持单文件 Node.js 零依赖契约测试；通过小型可调用校验函数覆盖真实 YAML、manifest companion 和路径边界。外部 CLI 不进入插件包或 MCP 配置，安装指南固定已审核版本并移除直接执行可变脚本的命令。

**Tech Stack:** Node.js `node:test`、JSON、YAML 子集、Markdown、Codex 插件 manifest。

## Global Constraints

- 不修改 `.agents/plugins/marketplace.json` 中已审核的第三方 commit SHA。
- 不修改 `plugins/codegraph/.mcp.json` 的 `codegraph serve --mcp` 边界。
- 不增加 npm 或运行时依赖。
- CodeGraph 安装基线固定为 `1.5.0`；Lark CLI 固定为 `1.0.77`。
- TWG 安装器固定 SHA-256 `8468bb52cb23b897217dd4cfe537cb0f8ea989c4cbdf2c3befe92d17022fc9a0`，CLI 固定为 `1.1.1`。
- Postman CLI 固定为 `1.45.0`；Defuddle 固定为 `0.19.2`。
- 不自动提交或推送。

---

### Task 1: 强化契约测试

**Files:**
- Modify: `tests/marketplace-contracts.test.mjs`

**Interfaces:**
- Produces: `parseFlatYaml(contents, label)`，拒绝空值和 YAML null。
- Produces: `assertSafeGitSubdirPath(path, label)`，拒绝反斜杠和逃逸分段。
- Produces: 本地 manifest companion 路径校验，目标必须存在且位于插件目录内。

- [x] **Step 1: 将现有 Skill 校验提取成可调用函数并确认基线仍绿**

  保持现有断言不变，只把 frontmatter、`agents/openai.yaml` 和 manifest 路径校验移动到同文件 helper。

- [x] **Step 2: 添加四个回归测试**

  ```js
  assert.throws(() => parseFlatYaml('display_name: # YAML null', 'fixture'));
  assert.deepEqual(parseFlatYaml('display_name: "CodeGraph"\r\n', 'fixture'), {
    display_name: 'CodeGraph',
  });
  assert.throws(() => assertSafeGitSubdirPath('./plugins\\..\\outside', 'fixture'));
  assert.throws(() => validateManifestComponents(fixtureRoot, {
    apps: './missing-app.json',
  }, 'fixture'));
  ```

- [x] **Step 3: 运行测试并确认 RED**

  Run: `node --test tests/marketplace-contracts.test.mjs`

  Expected: 新增回归测试因当前解析和路径校验行为而失败。

- [x] **Step 4: 写入最小修复**

  ```js
  const normalized = contents.replace(/\r\n?/gu, '\n');
  const unquoted = raw.replace(/\s+#.*$/u, '').trim();
  assert.ok(unquoted && !/^(?:null|~)$/iu.test(unquoted));
  ```

  companion 字符串路径必须以 `./` 开头、拒绝 `\\`、解析后仍位于插件根目录，并且目标存在。

- [x] **Step 5: 运行测试并确认 GREEN**

  Run: `node --test tests/marketplace-contracts.test.mjs`

  Expected: 全部测试通过。

### Task 2: 修复安装、迁移与升级指南

**Files:**
- Modify: `README.md`
- Modify: `docs/plugins/codegraph.md`
- Modify: `docs/plugins/twg.md`
- Modify: `docs/plugins/lark.md`
- Modify: `docs/plugins/obsidian.md`
- Modify: `docs/plugins/postman.md`
- Modify: `docs/superpowers/specs/2026-07-27-codegraph-marketplace-adapter-design.md`

**Interfaces:**
- Consumes: Global Constraints 中的精确版本和 TWG installer SHA-256。
- Produces: 不删除外部 CLI、不直接执行可变脚本、不会混用升级渠道的可复制命令。

- [x] **Step 1: 修复 CodeGraph 迁移和版本基线**

  将迁移命令统一改为：

  ```bash
  codegraph uninstall --target codex --keep-cli
  ```

  安装使用 `npm install -g @colbymchenry/codegraph@1.5.0`；删除 `main/install.sh` 和错误的 Node `engines` 说明；升级使用 `codegraph upgrade 1.5.0`，新版本审核后再替换精确版本。

- [x] **Step 2: 固定并校验 TWG 安装器**

  ```bash
  (
    set -eu
    installer="$(mktemp "${TMPDIR:-/tmp}/twg-install.XXXXXX")"
    trap 'rm -f "$installer"' EXIT
    curl -fsSLo "$installer" https://teamwork-graph.atlassian.com/cli/install
    if command -v sha256sum >/dev/null 2>&1; then
      actual_sha="$(sha256sum "$installer" | awk '{print $1}')"
    else
      actual_sha="$(shasum -a 256 "$installer" | awk '{print $1}')"
    fi
    test "$actual_sha" = '8468bb52cb23b897217dd4cfe537cb0f8ea989c4cbdf2c3befe92d17022fc9a0'
    bash "$installer" --version 1.1.1 --skip-skills --skip-login
  )
  ```

- [x] **Step 3: 固定其他可选 CLI**

  使用 `@larksuite/cli@1.0.77`、`defuddle@0.19.2` 和 `postman-cli@1.45.0`；升级时显式修改版本并重新审核。

- [x] **Step 4: 同步设计文档**

  将“市场不固定外部 CLI”改为“插件不打包 CLI，指南固定已审核安装基线”，并同步 CodeGraph npm-only 安装与原渠道升级边界。

### Task 3: 补充许可证

**Files:**
- Create: `LICENSE`

**Interfaces:**
- Produces: 与 CodeGraph 本地适配器 `license: MIT` 一致的仓库级授权文本。

- [x] **Step 1: 添加 MIT License**

  版权行使用 `Copyright (c) 2026 Agent Forge contributors`，不覆盖第三方上游各自许可证。

### Task 4: 全量验证

**Files:**
- Verify: all changed files

- [x] **Step 1: 运行 Node 测试**

  Run: `node --test`

- [x] **Step 2: 运行官方 CodeGraph plugin validator**

  Expected: `Plugin validation passed`。

- [x] **Step 3: 运行格式、敏感信息和链接检查**

  检查尾随空格、CRLF、私钥/Token 模式和 Markdown 本地链接。

- [x] **Step 4: 检查最终 diff 和 Git 状态**

  确认只改计划列出的文件，`.idea/` 仍被忽略，未提交、未推送。
