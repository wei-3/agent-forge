import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(PLUGIN_ROOT, 'scripts/worktree-links.mjs');
const ROUTING_ENV = new Set([
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_COMMON_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_CEILING_DIRECTORIES',
]);
const CLEAN_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !ROUTING_ENV.has(name)),
);

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: CLEAN_ENV }).trim();
}

function run(cwd, args = [], options = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...CLEAN_ENV, ...options.env },
    input: options.input,
  });
}

function runAsync(cwd, args) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      cwd,
      env: CLEAN_ENV,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolveRun({ status, stderr }));
  });
}

function fixture(t, { files = ['notes.local'], worktrees = 1 } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'agentforge-worktree-links-')));
  const main = join(root, 'main');
  mkdirSync(main);
  git(main, 'init', '-b', 'main');
  git(main, 'config', 'user.name', 'Worktree Links Test');
  git(main, 'config', 'user.email', 'worktree-links@example.invalid');
  writeFileSync(join(main, '.gitignore'), '*.local\nprivate/\n');
  writeFileSync(join(main, 'tracked.txt'), 'tracked\n');
  git(main, 'add', '.gitignore', 'tracked.txt');
  git(main, 'commit', '-m', 'fixture');

  for (const file of files) {
    mkdirSync(dirname(join(main, file)), { recursive: true });
    writeFileSync(join(main, file), `${file}\n`);
  }

  const linked = [];
  for (let index = 1; index <= worktrees; index += 1) {
    const target = join(root, `linked-${index}`);
    git(main, 'worktree', 'add', '-b', `linked-${index}`, target);
    linked.push(target);
  }
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, main, linked };
}

function init(main, ...files) {
  const result = run(main, ['init', ...files]);
  assert.equal(result.status, 0, result.stderr);
}

test('init stores an isolated local manifest and fix creates absolute links', (t) => {
  const { main, linked: [target] } = fixture(t, {
    files: ['notes.local', 'private/settings.local'],
  });

  init(main, 'notes.local', 'private/settings.local');
  assert.deepEqual(
    git(main, 'config', '--local', '--get-all', 'agentforge-worktree-links.file').split('\n'),
    ['notes.local', 'private/settings.local'],
  );
  assert.equal(
    git(main, 'config', '--local', '--get', 'agentforge-worktree-links.main'),
    main,
  );

  const result = run(main, ['fix', target]);
  assert.equal(result.status, 0, result.stderr);
  for (const file of ['notes.local', 'private/settings.local']) {
    const destination = join(target, file);
    assert.ok(lstatSync(destination).isSymbolicLink());
    assert.equal(readlinkSync(destination), join(main, file));
  }

  init(main, 'notes.local');
  assert.equal(
    git(main, 'config', '--local', '--get-all', 'agentforge-worktree-links.file'),
    'notes.local',
  );
  assert.equal(run(target, ['fix']).status, 0);
});

test('init accepts only existing ignored untracked ordinary files from the main worktree', (t) => {
  const { root, main, linked: [target] } = fixture(t, { files: ['plain.txt'] });
  mkdirSync(join(main, 'folder.local'));
  symlinkSync(join(main, 'plain.txt'), join(main, 'source-link.local'));
  const cases = [
    ['tracked.txt', 'TRACKED'],
    ['missing.local', 'SOURCE_MISSING'],
    ['plain.txt', 'NOT_IGNORED'],
    ['folder.local', 'SOURCE_NOT_FILE'],
    ['source-link.local', 'SOURCE_SYMLINK'],
    ['../outside.local', 'INVALID_PATH'],
    [join(root, 'absolute.local'), 'INVALID_PATH'],
    ['*.local', 'INVALID_PATH'],
    ['bad\nname.local', 'INVALID_PATH'],
  ];

  for (const [file, diagnostic] of cases) {
    const result = run(main, ['init', file]);
    assert.equal(result.status, 1, `${file}: ${result.stderr}`);
    assert.match(result.stderr, new RegExp(diagnostic), file);
  }

  const fromLinked = run(target, ['init', 'plain.txt']);
  assert.equal(fromLinked.status, 1);
  assert.match(fromLinked.stderr, /MAIN_ONLY/u);
});

test('init treats leading-colon filenames literally when checking gitignore', (t) => {
  const { main } = fixture(t, { files: [':(top)literal-target'] });
  writeFileSync(join(main, '.gitignore'), '*.local\nprivate/\nliteral-target\n');

  const result = run(main, ['init', ':(top)literal-target']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /NOT_IGNORED/u);
});

test('init accepts a filename that starts with two dots but does not traverse', (t) => {
  const { main } = fixture(t, { files: ['..notes.local'] });

  const result = run(main, ['init', '..notes.local']);
  assert.equal(result.status, 0, result.stderr);
});

test('fix never overwrites an occupied destination', (t) => {
  const { main, linked: [target] } = fixture(t);
  init(main, 'notes.local');
  writeFileSync(join(target, 'notes.local'), 'worktree copy\n');

  const result = run(target, ['fix']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DIVERGED/u);
  assert.equal(readFileSync(join(target, 'notes.local'), 'utf8'), 'worktree copy\n');
});

test('check reports every unhealthy state without changing files', (t) => {
  const names = [
    'missing.local',
    'source-missing.local',
    'dangling.local',
    'mistarget.local',
    'diverged.local',
  ];
  const { root, main, linked: [target] } = fixture(t, { files: names });
  init(main, ...names);
  rmSync(join(main, 'source-missing.local'));
  symlinkSync(join(root, 'gone'), join(target, 'dangling.local'));
  writeFileSync(join(root, 'other'), 'other\n');
  symlinkSync(join(root, 'other'), join(target, 'mistarget.local'));
  writeFileSync(join(target, 'diverged.local'), 'copy\n');

  const result = run(target, ['check']);
  assert.equal(result.status, 1);
  for (const status of ['MISSING', 'SOURCE_MISSING', 'DANGLING', 'MISTARGET', 'DIVERGED']) {
    assert.match(result.stdout, new RegExp(`^${status} `, 'mu'), status);
  }
  assert.ok(lstatSync(join(target, 'dangling.local')).isSymbolicLink());
  assert.equal(readFileSync(join(target, 'diverged.local'), 'utf8'), 'copy\n');
});

test('check is quiet and successful after fix', (t) => {
  const { main, linked: [target] } = fixture(t);
  init(main, 'notes.local');
  assert.equal(run(target, ['fix']).status, 0);

  const result = run(target, ['check']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('check --verbose lists each healthy link and its absolute target', (t) => {
  const { main, linked: [target] } = fixture(t, {
    files: ['notes.local', 'private/settings.local'],
  });
  init(main, 'notes.local', 'private/settings.local');
  assert.equal(run(target, ['fix']).status, 0);

  const result = run(main, ['check', '--verbose', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(
    result.stdout,
    `OK notes.local -> ${join(main, 'notes.local')}\n` +
      `OK private/settings.local -> ${join(main, 'private/settings.local')}\n`,
  );
});

test('fixall repairs every linked worktree and skips the main worktree', (t) => {
  const { main, linked } = fixture(t, { worktrees: 2 });
  init(main, 'notes.local');

  const result = run(main, ['fixall']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(!lstatSync(join(main, 'notes.local')).isSymbolicLink());
  for (const target of linked) {
    assert.equal(readlinkSync(join(target, 'notes.local')), join(main, 'notes.local'));
  }
});

test('fixall continues after an earlier worktree reports a problem', (t) => {
  const { main, linked: [blocked, repairable] } = fixture(t, { worktrees: 2 });
  init(main, 'notes.local');
  writeFileSync(join(blocked, 'notes.local'), 'occupied\n');

  const result = run(main, ['fixall']);
  assert.equal(result.status, 1);
  assert.equal(readFileSync(join(blocked, 'notes.local'), 'utf8'), 'occupied\n');
  assert.equal(readlinkSync(join(repairable, 'notes.local')), join(main, 'notes.local'));
});

test('hook mode targets payload cwd and keeps successful stdout empty', (t) => {
  const { main, linked: [target] } = fixture(t);
  init(main, 'notes.local');
  mkdirSync(join(target, 'subdir'));

  const result = run(main, [], { input: JSON.stringify({ cwd: join(target, 'subdir') }) });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(readlinkSync(join(target, 'notes.local')), join(main, 'notes.local'));
});

test('hook reports an incomplete configured manifest instead of treating it as disabled', (t) => {
  const { main, linked: [target] } = fixture(t);
  git(main, 'config', '--local', '--add', 'agentforge-worktree-links.file', 'notes.local');

  const result = run(target, [], { input: JSON.stringify({ cwd: target }) });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /INVALID_MAIN/u);
});

test('hook reports a cached main without a file manifest as incomplete', (t) => {
  const { main, linked: [target] } = fixture(t);
  git(main, 'config', '--local', 'agentforge-worktree-links.main', main);

  const result = run(target, [], { input: JSON.stringify({ cwd: target }) });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /INVALID_MANIFEST/u);
});

test('hook is silent outside git, in the main worktree, and when unconfigured', (t) => {
  const outside = mkdtempSync(join(tmpdir(), 'agentforge-worktree-links-outside-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const { main, linked: [target] } = fixture(t);

  for (const cwd of [outside, main, target]) {
    const result = run(cwd, [], { input: JSON.stringify({ cwd }) });
    assert.equal(result.status, 0, `${cwd}: ${result.stderr}`);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  }
});

test('hook rejects a stale cached main worktree', (t) => {
  const { root, main, linked: [target] } = fixture(t);
  init(main, 'notes.local');
  git(main, 'config', '--local', 'agentforge-worktree-links.main', join(root, 'missing-main'));

  const result = run(target, [], { input: JSON.stringify({ cwd: target }) });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /INVALID_MAIN/u);
});

test('git routing environment variables cannot redirect an explicit target', (t) => {
  const one = fixture(t);
  const two = fixture(t);
  init(one.main, 'notes.local');

  const result = run(one.main, ['fix', one.linked[0]], {
    env: {
      GIT_DIR: join(two.main, '.git'),
      GIT_WORK_TREE: two.main,
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readlinkSync(join(one.linked[0], 'notes.local')),
    join(one.main, 'notes.local'),
  );
  assert.ok(!existsSync(join(two.linked[0], 'notes.local')));
});

test('fix fails closed when a destination parent escapes through a symlink', (t) => {
  const { root, main, linked: [target] } = fixture(t, {
    files: ['private/settings.local'],
  });
  init(main, 'private/settings.local');
  const outside = join(root, 'outside');
  mkdirSync(outside);
  symlinkSync(outside, join(target, 'private'));

  const result = run(target, ['fix']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PATH_ESCAPE/u);
  assert.ok(!existsSync(join(outside, 'settings.local')));
});

test('fix does not follow a destination parent replaced during link creation', (t) => {
  const { root, main, linked: [target] } = fixture(t, {
    files: ['private/settings.local'],
  });
  init(main, 'private/settings.local');
  const outside = join(root, 'outside');
  const parent = join(target, 'private');
  const heldParent = join(outside, 'private-original');
  const preload = join(root, 'replace-parent.mjs');
  mkdirSync(outside);
  writeFileSync(preload, `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    const symlinkSync = fs.symlinkSync;
    fs.symlinkSync = (source, destination, type) => {
      if (source === process.env.RACE_SOURCE) {
        fs.renameSync(process.env.RACE_PARENT, process.env.RACE_HELD_PARENT);
        symlinkSync(process.env.RACE_OUTSIDE, process.env.RACE_PARENT);
      }
      return symlinkSync(source, destination, type);
    };
    syncBuiltinESMExports();
  `);

  const result = spawnSync(
    process.execPath,
    ['--import', preload, SCRIPT, 'fix'],
    {
      cwd: target,
      encoding: 'utf8',
      env: {
        ...CLEAN_ENV,
        RACE_SOURCE: join(main, 'private/settings.local'),
        RACE_PARENT: parent,
        RACE_HELD_PARENT: heldParent,
        RACE_OUTSIDE: outside,
      },
    },
  );

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /PATH_ESCAPE/u);
  assert.ok(lstatSync(parent).isSymbolicLink(), 'the race did not replace the parent');
  assert.ok(
    !existsSync(join(outside, 'settings.local')),
    'fix followed the replacement parent outside the worktree',
  );
  assert.ok(
    !existsSync(join(heldParent, 'settings.local')),
    'fix created a link in the original parent after it moved outside the worktree',
  );
});

test('fix and check reject an existing correct link reached through an escaping parent', (t) => {
  const { root, main, linked: [target] } = fixture(t, {
    files: ['private/settings.local'],
  });
  init(main, 'private/settings.local');
  const outside = join(root, 'outside');
  mkdirSync(outside);
  symlinkSync(outside, join(target, 'private'));
  symlinkSync(join(main, 'private/settings.local'), join(outside, 'settings.local'));

  for (const command of ['fix', 'check']) {
    const result = run(target, [command]);
    assert.equal(result.status, 1, `${command}: ${result.stderr}`);
    assert.match(result.stderr, /PATH_ESCAPE/u, command);
  }
});

test('fixall rejects a stale worktree path reused by another repository', (t) => {
  const first = fixture(t);
  const second = fixture(t);
  init(first.main, 'notes.local');
  init(second.main, 'notes.local');

  const reused = first.linked[0];
  rmSync(reused, { recursive: true, force: true });
  git(second.main, 'worktree', 'remove', second.linked[0]);
  git(second.main, 'worktree', 'add', '-b', 'reused-path', reused);

  const result = run(first.main, ['fixall']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FOREIGN_WORKTREE/u);
  assert.ok(!existsSync(join(reused, 'notes.local')));
});

test('fix rejects unsafe values injected directly into local git config', (t) => {
  const { root, main, linked: [target] } = fixture(t);
  git(main, 'config', '--local', '--add', 'agentforge-worktree-links.file', '../escape.local');
  git(main, 'config', '--local', 'agentforge-worktree-links.main', main);

  const result = run(target, ['fix']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /INVALID_PATH/u);
  assert.ok(!existsSync(join(root, 'escape.local')));
});

test('init rejects a source that escapes through a parent symlink', (t) => {
  const { root, main } = fixture(t, { files: [] });
  const outside = join(root, 'outside-source');
  mkdirSync(outside);
  writeFileSync(join(outside, 'settings.local'), 'outside\n');
  symlinkSync(outside, join(main, 'private'));

  const result = run(main, ['init', 'private/settings.local']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PATH_ESCAPE/u);
});

test('concurrent fix calls accept EEXIST only when the winning link is correct', async (t) => {
  const { main, linked: [target] } = fixture(t);
  init(main, 'notes.local');

  const results = await Promise.all(Array.from({ length: 8 }, () => runAsync(target, ['fix'])));
  for (const result of results) assert.equal(result.status, 0, result.stderr);
  assert.equal(readlinkSync(join(target, 'notes.local')), join(main, 'notes.local'));
});

test('concurrent init calls never mix their manifests', async (t) => {
  const left = Array.from({ length: 40 }, (_, index) => `left-${index}.local`);
  const right = Array.from({ length: 40 }, (_, index) => `right-${index}.local`);
  const { main } = fixture(t, { files: [...left, ...right] });

  const results = await Promise.all([
    runAsync(main, ['init', ...left]),
    runAsync(main, ['init', ...right]),
  ]);
  assert.ok(results.some(({ status }) => status === 0), results.map(({ stderr }) => stderr).join('\n'));
  const manifest = git(
    main,
    'config',
    '--local',
    '--get-all',
    'agentforge-worktree-links.file',
  ).split('\n');
  assert.ok(
    [left, right].some((expected) => expected.length === manifest.length &&
      expected.every((entry, index) => entry === manifest[index])),
    `mixed manifest: ${manifest.join(',')}`,
  );
});

test('init refuses to write while another init holds the repository lock', (t) => {
  const { main } = fixture(t);
  writeFileSync(join(main, '.git', 'agentforge-worktree-links.lock'), 'held\n');

  const result = run(main, ['init', 'notes.local']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /INIT_BUSY/u);
  const configured = spawnSync(
    'git',
    ['config', '--local', '--get-all', 'agentforge-worktree-links.file'],
    { cwd: main, encoding: 'utf8', env: CLEAN_ENV },
  );
  assert.equal(configured.status, 1);
});

test('CLI usage errors exit 2', (t) => {
  const { main } = fixture(t);
  for (const args of [['init'], ['fix', main, 'extra'], ['unknown']]) {
    const result = run(main, args);
    assert.equal(result.status, 2, `${args.join(' ')}: ${result.stderr}`);
    assert.match(result.stderr, /USAGE/u);
  }
});

test('plugin package exposes one Codex SessionStart hook through PLUGIN_ROOT', () => {
  const manifestPath = join(PLUGIN_ROOT, '.codex-plugin/plugin.json');
  const hooksPath = join(PLUGIN_ROOT, 'hooks/hooks.json');
  assert.ok(existsSync(manifestPath), 'plugin manifest is missing');
  assert.ok(existsSync(hooksPath), 'hooks manifest is missing');

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const hooks = JSON.parse(readFileSync(hooksPath, 'utf8')).hooks;
  assert.equal(manifest.name, 'worktree-links');
  assert.equal(manifest.hooks, undefined);
  assert.deepEqual(Object.keys(hooks), ['SessionStart']);
  assert.equal(hooks.SessionStart.length, 1);
  const command = hooks.SessionStart[0].hooks[0].command;
  assert.match(command, /\$\{PLUGIN_ROOT\}/u);
  assert.doesNotMatch(command, /CLAUDE_PLUGIN_ROOT/u);
});
