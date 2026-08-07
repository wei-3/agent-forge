import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MARKETPLACE_PATH = join(REPO_ROOT, '.agents/plugins/marketplace.json');
const README_PATH = join(REPO_ROOT, 'README.md');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GIT_SHA = /^[0-9a-f]{40}$/;
const HTTPS_GIT_URL = /^https:\/\/github\.com\/[^/]+\/[^/]+\.git$/;
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const INSTALLATION_POLICIES = new Set([
  'NOT_AVAILABLE',
  'AVAILABLE',
  'INSTALLED_BY_DEFAULT',
]);
const AUTHENTICATION_POLICIES = new Set(['ON_INSTALL', 'ON_USE']);
// Freeze local manifests to the fields accepted by the bundled plugin validator.
const LOCAL_MANIFEST_FIELDS = new Set([
  'id',
  'name',
  'version',
  'description',
  'skills',
  'apps',
  'mcpServers',
  'interface',
  'author',
  'homepage',
  'repository',
  'license',
  'keywords',
]);
const THIRD_PARTY_PLUGINS = {
  'mattpocock-skills': {
    source: {
      source: 'url',
      url: 'https://github.com/mattpocock/skills.git',
      sha: 'ed37663cc5fbef691ddfecd080dff42f7e7e350d',
    },
    authentication: 'ON_INSTALL',
    category: 'Developer Tools',
  },
  obsidian: {
    source: {
      source: 'url',
      url: 'https://github.com/kepano/obsidian-skills.git',
      sha: 'a1dc48e68138490d522c04cbf5822214c6eb1202',
    },
    authentication: 'ON_INSTALL',
    category: 'Productivity',
  },
  twg: {
    source: {
      source: 'url',
      url: 'https://github.com/atlassian/twg-cli.git',
      sha: 'bbc5ac76bbef7d9b16bfeb9a60c6135ff0d890a9',
    },
    authentication: 'ON_INSTALL',
    category: 'Productivity',
  },
  context7: {
    source: {
      source: 'git-subdir',
      url: 'https://github.com/upstash/context7.git',
      path: './plugins/codex/context7',
      sha: '305dd3ca10341fd0190825417bbd7a0c861490c9',
    },
    authentication: 'ON_USE',
    category: 'Developer Tools',
  },
  superpowers: {
    source: {
      source: 'url',
      url: 'https://github.com/obra/superpowers.git',
      sha: '3dcbd5c4b48e02263fbf4a3c01e3fe4f81d584d9',
    },
    authentication: 'ON_INSTALL',
    category: 'Developer Tools',
  },
  postman: {
    source: {
      source: 'git-subdir',
      url: 'https://github.com/Postman-Devrel/postman-claude-code-plugin.git',
      path: './skills',
      sha: 'b7b3c7a83486ee088844a96278411690523d389f',
    },
    authentication: 'ON_INSTALL',
    category: 'Developer Tools',
  },
  ponytail: {
    source: {
      source: 'url',
      url: 'https://github.com/DietrichGebert/ponytail.git',
      sha: '16f29800fd2681bdf24f3eb4ccffe38be3baec6b',
    },
    authentication: 'ON_INSTALL',
    category: 'Productivity',
  },
  lark: {
    source: {
      source: 'url',
      url: 'https://github.com/larksuite/cli.git',
      sha: 'a7865cd0a7416655535517a2a630848fde318761',
    },
    authentication: 'ON_INSTALL',
    category: 'Productivity',
  },
};
const APPROVED_REMOTE_URLS = new Set(
  Object.values(THIRD_PARTY_PLUGINS).map((plugin) => plugin.source.url),
);
const POSTMAN_SKILLS = [
  './agent-ready-apis',
  './generate-spec',
  './postman-cli',
  './postman-context',
  './postman-knowledge',
  './run-collection',
  './send-request',
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeLineEndings(contents) {
  return contents.replace(/\r\n?/gu, '\n');
}

function parseFlatYaml(contents, label) {
  const result = {};

  for (const [index, line] of normalizeLineEndings(contents).split('\n').entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    const match = /^([a-z][a-z0-9_-]*):(.*)$/u.exec(line);
    assert.ok(match, `${label} line ${index + 1} must be a flat YAML key/value`);

    const [, key, rawValue] = match;
    assert.equal(result[key], undefined, `${label} field ${key} must be unique`);
    const scalar = rawValue.trimStart();
    if (scalar.startsWith('"')) {
      const quoted = /^("(?:[^"\\]|\\.)*")(?:\s+#.*)?$/u.exec(scalar);
      assert.ok(quoted, `${label} line ${index + 1} has an invalid quoted string`);
      try {
        result[key] = JSON.parse(quoted[1]);
      } catch {
        assert.fail(`${label} line ${index + 1} has an invalid quoted string`);
      }
      continue;
    }
    if (scalar.startsWith("'")) {
      const quoted = /^'((?:[^']|'')*)'(?:\s+#.*)?$/u.exec(scalar);
      assert.ok(quoted, `${label} line ${index + 1} has an invalid quoted string`);
      result[key] = quoted[1].replaceAll("''", "'");
      continue;
    }

    const value = scalar.replace(/(?:^|\s+)#.*$/u, '').trim();
    assert.ok(
      value && !/^(?:null|~)$/iu.test(value),
      `${label} line ${index + 1} must contain a string value`,
    );
    result[key] = value;
  }

  return result;
}

function assertSafeGitSubdirPath(path, label) {
  assert.ok(
    isNonEmptyString(path) &&
      path.startsWith('./') &&
      !path.includes('\\') &&
      !path.split('/').includes('..'),
    `${label} git-subdir path must be a safe relative path`,
  );
}

function assertMcpServerMap(servers, label) {
  assert.ok(
    servers !== null && typeof servers === 'object' && !Array.isArray(servers),
    `${label} must be an object`,
  );
  for (const [name, server] of Object.entries(servers)) {
    assert.ok(isNonEmptyString(name), `${label} names must be non-empty`);
    assert.ok(
      server !== null && typeof server === 'object' && !Array.isArray(server),
      `${label} server ${name} must be an object`,
    );
    assert.ok(
      isNonEmptyString(server.command) || isNonEmptyString(server.url),
      `${label} server ${name} must define command or url`,
    );
    if (server.args !== undefined) {
      assert.ok(
        Array.isArray(server.args) && server.args.every(isNonEmptyString),
        `${label} server ${name} args must be strings`,
      );
    }
  }
}

function validateManifestComponents(pluginRoot, manifest, label) {
  for (const field of Object.keys(manifest)) {
    assert.ok(LOCAL_MANIFEST_FIELDS.has(field), `${label} has unsupported field ${field}`);
  }

  const normalizeContractPath = (field, expected) => {
    const value = manifest[field];
    assert.ok(isNonEmptyString(value), `${label} ${field} must be a relative path`);
    assert.ok(!value.includes('\\'), `${label} ${field} must use POSIX path separators`);
    const normalized = value.replace(/^\.\//u, '').replace(/\/+$/u, '');
    assert.equal(normalized, expected, `${label} ${field} must resolve to ${expected}`);
    return resolve(pluginRoot, value);
  };

  const skillsRoot = normalizeContractPath('skills', 'skills');
  assert.ok(
    existsSync(skillsRoot) && statSync(skillsRoot).isDirectory(),
    `${label} skills directory does not exist`,
  );

  for (const [field, expected] of [
    ['apps', '.app.json'],
    ['mcpServers', '.mcp.json'],
  ]) {
    const component = manifest[field];
    if (component === undefined) {
      continue;
    }
    if (field === 'mcpServers' && typeof component === 'object') {
      assertMcpServerMap(component, `${label} mcpServers`);
      continue;
    }
    const companionPath = normalizeContractPath(field, expected);
    assert.ok(
      existsSync(companionPath) && statSync(companionPath).isFile(),
      `${label} ${field} companion file is missing`,
    );
    const companion = readJson(companionPath);
    assert.ok(
      companion && typeof companion === 'object' && !Array.isArray(companion),
      `${label} ${field} companion must contain a JSON object`,
    );
    if (field === 'mcpServers') {
      assertMcpServerMap(companion.mcpServers, `${label} .mcp.json mcpServers`);
    }
  }

  return skillsRoot;
}

function parseSkillFrontmatter(contents, label) {
  const frontmatterMatch = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(normalizeLineEndings(contents));
  assert.ok(frontmatterMatch, `${label} has invalid frontmatter`);
  return parseFlatYaml(frontmatterMatch[1], label);
}

function parseAgentInterface(contents, label) {
  const interfaceMatch = /^interface:\n((?: {2}.+(?:\n|$))+)\s*$/u.exec(
    normalizeLineEndings(contents),
  );
  assert.ok(interfaceMatch, `${label} has invalid agent metadata`);
  return parseFlatYaml(interfaceMatch[1].replace(/^ {2}/gmu, ''), `${label} agent interface`);
}

function validateLocalPluginSkills(pluginRoot, manifest, pluginName) {
  const skillsRoot = validateManifestComponents(pluginRoot, manifest, pluginName);

  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const label = `${pluginName}/${entry.name}`;
    const skillRoot = join(skillsRoot, entry.name);
    const frontmatter = parseSkillFrontmatter(
      readFileSync(join(skillRoot, 'SKILL.md'), 'utf8'),
      label,
    );
    assert.equal(frontmatter.name, entry.name);
    assert.match(frontmatter.name, SLUG);
    assert.ok(frontmatter.name.length <= 64);
    assert.ok(isNonEmptyString(frontmatter.description));
    assert.ok(frontmatter.description.length <= 1024);
    assert.doesNotMatch(frontmatter.description, /[<>]/u);

    const agentPath = join(skillRoot, 'agents/openai.yaml');
    if (!existsSync(agentPath)) continue;

    const agentInterface = parseAgentInterface(readFileSync(agentPath, 'utf8'), label);
    assert.ok(isNonEmptyString(agentInterface.display_name));
    assert.ok(isNonEmptyString(agentInterface.short_description));
    if (agentInterface.default_prompt !== undefined) {
      assert.ok(isNonEmptyString(agentInterface.default_prompt));
    }
  }
}

test('flat YAML rejects null values hidden by inline comments', () => {
  assert.throws(
    () => parseFlatYaml('display_name: # YAML null', 'fixture'),
    /fixture line 1/u,
  );
  assert.throws(
    () => parseFlatYaml('display_name: null # YAML null', 'fixture'),
    /fixture line 1/u,
  );
});

test('flat YAML accepts comments after quoted strings', () => {
  assert.deepEqual(parseFlatYaml('display_name: "CodeGraph" # UI label', 'fixture'), {
    display_name: 'CodeGraph',
  });
});

test('flat YAML accepts escapes inside double-quoted strings', () => {
  assert.deepEqual(parseFlatYaml('description: "Use \\"CodeGraph\\""', 'fixture'), {
    description: 'Use "CodeGraph"',
  });
});

test('local skill metadata accepts CRLF line endings', () => {
  const frontmatter = parseSkillFrontmatter(
    '---\r\nname: codegraph\r\ndescription: Explore indexed repositories.\r\n---\r\n',
    'fixture',
  );
  assert.equal(frontmatter.name, 'codegraph');

  const agentInterface = parseAgentInterface(
    'interface:\r\n  display_name: "CodeGraph"\r\n  short_description: "Explore repositories"\r\n',
    'fixture',
  );
  assert.equal(agentInterface.display_name, 'CodeGraph');
});

test('git-subdir paths reject Windows path separators', () => {
  assert.throws(
    () => assertSafeGitSubdirPath('./plugins\\..\\..\\private', 'fixture'),
    /safe relative path/u,
  );
});

test('local manifests reject missing companion files', () => {
  assert.throws(
    () =>
      validateManifestComponents(
        join(REPO_ROOT, 'plugins/codegraph'),
        {
          skills: './skills/',
          apps: './.app.json',
        },
        'fixture',
      ),
    /apps/u,
  );
});

test('local manifests reject unsupported fields', () => {
  assert.throws(
    () =>
      validateManifestComponents(
        join(REPO_ROOT, 'plugins/codegraph'),
        {
          skills: './skills/',
          unsupportedField: true,
        },
        'fixture',
      ),
    /unsupportedField/u,
  );
});

test('local manifests reject invalid inline MCP server maps', () => {
  assert.throws(
    () =>
      validateManifestComponents(
        join(REPO_ROOT, 'plugins/codegraph'),
        {
          skills: './skills/',
          mcpServers: null,
        },
        'fixture',
      ),
    /mcpServers/u,
  );
});

test('local manifests reject inline MCP servers without a transport', () => {
  assert.throws(
    () =>
      validateManifestComponents(
        join(REPO_ROOT, 'plugins/codegraph'),
        {
          skills: './skills/',
          mcpServers: {
            broken: {},
          },
        },
        'fixture',
      ),
    /broken/u,
  );
});

test('marketplace plugins satisfy the repository contract', () => {
  const marketplace = readJson(MARKETPLACE_PATH);

  assert.equal(marketplace.name, 'agent-forge');
  assert.equal(marketplace.interface?.displayName, 'Agent Forge');
  assert.ok(Array.isArray(marketplace.plugins), 'plugins must be an array');

  const names = marketplace.plugins.map((plugin) => plugin.name);
  assert.equal(new Set(names).size, names.length, 'plugin names must be unique');
  const pluginsByName = new Map(marketplace.plugins.map((plugin) => [plugin.name, plugin]));
  const codegraph = pluginsByName.get('codegraph');

  assert.ok(codegraph, 'codegraph is missing from the marketplace');
  assert.deepEqual(codegraph.source, {
    source: 'local',
    path: './plugins/codegraph',
  });
  assert.equal(codegraph.policy?.installation, 'AVAILABLE');
  assert.equal(codegraph.policy?.authentication, 'ON_INSTALL');
  assert.equal(codegraph.category, 'Developer Tools');

  for (const [name, expected] of Object.entries(THIRD_PARTY_PLUGINS)) {
    const plugin = pluginsByName.get(name);
    assert.ok(plugin, `${name} is missing from the marketplace`);
    assert.deepEqual(plugin.source, expected.source);
    assert.equal(plugin.policy?.installation, 'AVAILABLE');
    assert.equal(plugin.policy?.authentication, expected.authentication);
    assert.equal(plugin.category, expected.category);
  }

  for (const plugin of marketplace.plugins) {
    assert.ok(isNonEmptyString(plugin.name), 'plugin name is required');
    assert.match(plugin.name, SLUG, `${plugin.name} must use kebab-case`);
    assert.ok(plugin.name.length <= 64, `${plugin.name} exceeds 64 characters`);
    assert.ok(
      INSTALLATION_POLICIES.has(plugin.policy?.installation),
      `${plugin.name} has an invalid installation policy`,
    );
    assert.ok(
      AUTHENTICATION_POLICIES.has(plugin.policy?.authentication),
      `${plugin.name} has an invalid authentication policy`,
    );
    assert.ok(isNonEmptyString(plugin.category), `${plugin.name} category is required`);

    if (plugin.source?.source !== 'local') {
      assert.ok(
        plugin.source?.source === 'url' || plugin.source?.source === 'git-subdir',
        `${plugin.name} has an unsupported remote source`,
      );
      assert.ok(isNonEmptyString(plugin.source.url), `${plugin.name} source URL is required`);
      assert.match(plugin.source.url, HTTPS_GIT_URL, `${plugin.name} must use an HTTPS Git URL`);
      assert.ok(
        APPROVED_REMOTE_URLS.has(plugin.source.url),
        `${plugin.name} source URL is not approved`,
      );
      assert.ok(isNonEmptyString(plugin.source.sha), `${plugin.name} source SHA is required`);
      assert.match(plugin.source.sha, GIT_SHA, `${plugin.name} must pin a full commit SHA`);
      assert.ok(isNonEmptyString(plugin.description), `${plugin.name} description is required`);
      assert.ok(isNonEmptyString(plugin.author?.name), `${plugin.name} author.name is required`);
      assert.ok(isNonEmptyString(plugin.repository), `${plugin.name} repository is required`);
      assert.ok(isNonEmptyString(plugin.homepage), `${plugin.name} homepage is required`);

      if (plugin.source.source === 'git-subdir') {
        assertSafeGitSubdirPath(plugin.source.path, plugin.name);
      }
      continue;
    }

    assert.deepEqual(plugin.source, {
      source: 'local',
      path: `./plugins/${plugin.name}`,
    });
    const pluginRoot = resolve(REPO_ROOT, plugin.source.path);
    const pluginRelativePath = relative(REPO_ROOT, pluginRoot);
    assert.ok(
      pluginRelativePath && !pluginRelativePath.startsWith('..') && !isAbsolute(pluginRelativePath),
      `${plugin.name} source must stay inside the marketplace`,
    );
    assert.ok(existsSync(pluginRoot), `${plugin.name} source directory does not exist`);

    const manifestPath = join(pluginRoot, '.codex-plugin/plugin.json');
    assert.ok(existsSync(manifestPath), `${plugin.name} is missing its Codex manifest`);

    const manifest = readJson(manifestPath);
    validateManifestComponents(pluginRoot, manifest, plugin.name);
    assert.equal(manifest.name, plugin.name);
    assert.match(manifest.version, SEMVER, `${plugin.name} version must be strict semver`);
    assert.ok(isNonEmptyString(manifest.description), `${plugin.name} description is required`);
    assert.ok(isNonEmptyString(manifest.author?.name), `${plugin.name} author.name is required`);
    assert.ok(manifest.interface && typeof manifest.interface === 'object');
    for (const field of [
      'displayName',
      'shortDescription',
      'longDescription',
      'developerName',
      'category',
    ]) {
      assert.ok(
        isNonEmptyString(manifest.interface[field]),
        `${plugin.name} interface.${field} is required`,
      );
    }
    assert.ok(
      Array.isArray(manifest.interface.capabilities) &&
        manifest.interface.capabilities.every(isNonEmptyString),
      `${plugin.name} interface.capabilities must be an array of strings`,
    );
    const defaultPrompts = Array.isArray(manifest.interface.defaultPrompt)
      ? manifest.interface.defaultPrompt
      : [manifest.interface.defaultPrompt];
    assert.ok(
      defaultPrompts.length <= 3 && defaultPrompts.every(isNonEmptyString),
      `${plugin.name} interface.defaultPrompt must contain up to three strings`,
    );
    assert.doesNotMatch(JSON.stringify(manifest), /\[TODO:/u);
  }

  assert.equal(pluginsByName.get('twg').skills, './skills/');
  assert.equal(
    pluginsByName.get('twg').license,
    undefined,
    'twg skill licensing must not be represented as the repository root license',
  );
  assert.deepEqual(pluginsByName.get('postman').skills, POSTMAN_SKILLS);
  assert.deepEqual(pluginsByName.get('postman').mcpServers, {
    postman: {
      type: 'http',
      url: 'https://mcp.postman.com/mcp',
    },
  });
  assert.equal(pluginsByName.get('lark').skills, './skills/');

  const codegraphRoot = join(REPO_ROOT, 'plugins/codegraph');
  const codegraphManifest = readJson(join(codegraphRoot, '.codex-plugin/plugin.json'));
  assert.equal(codegraphManifest.skills, './skills/');
  assert.ok(
    existsSync(join(codegraphRoot, 'skills/codegraph/SKILL.md')),
    'codegraph is missing its core Skill',
  );
  assert.equal(codegraphManifest.mcpServers, './.mcp.json');
  assert.deepEqual(readJson(join(codegraphRoot, '.mcp.json')), {
    mcpServers: {
      codegraph: {
        command: 'codegraph',
        args: ['serve', '--mcp'],
      },
    },
  });

  const readme = readFileSync(README_PATH, 'utf8');
  for (const name of names) {
    const guidePath = join(REPO_ROOT, 'docs/plugins', `${name}.md`);
    assert.ok(existsSync(guidePath), `${name} is missing its Chinese plugin guide`);
    assert.match(readFileSync(guidePath, 'utf8'), /[\u3400-\u9fff]/u, `${name} guide must be Chinese`);
    assert.ok(
      readme.includes(`[\`${name}\`](docs/plugins/${name}.md)`),
      `${name} is missing its README guide link`,
    );
  }
});

test('local plugin skills satisfy the repository metadata contract', () => {
  const marketplace = readJson(MARKETPLACE_PATH);

  for (const plugin of marketplace.plugins.filter(({ source }) => source?.source === 'local')) {
    const pluginRoot = resolve(REPO_ROOT, plugin.source.path);
    const manifest = readJson(join(pluginRoot, '.codex-plugin/plugin.json'));
    validateLocalPluginSkills(pluginRoot, manifest, plugin.name);
  }
});
