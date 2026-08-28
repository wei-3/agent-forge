#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  closeSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  symlinkSync,
  unlinkSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const FILE_KEY = 'agentforge-worktree-links.file';
const MAIN_KEY = 'agentforge-worktree-links.main';
const ROUTING_ENV = new Set([
  'GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE', 'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_CEILING_DIRECTORIES',
]);

class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const gitEnv = () => Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !ROUTING_ENV.has(name)),
);

function git(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: gitEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw new AppError('GIT_FAILED', result.error.code ?? result.error.message);
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function gitValue(cwd, args, code = 'GIT_FAILED') {
  const result = git(cwd, args);
  if (result.status !== 0) {
    throw new AppError(code, result.stderr.trim() || `git exited ${result.status}`);
  }
  return result.stdout.replace(/\n$/u, '');
}

function real(path, code) {
  try {
    return realpathSync(path);
  } catch (error) {
    throw new AppError(code, `${path}: ${error.code ?? error.message}`);
  }
}

function stat(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function within(root, path) {
  const rel = relative(root, path);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function repo(target) {
  const requested = real(resolve(target), 'NOT_REPO');
  const root = real(gitValue(requested, ['rev-parse', '--show-toplevel'], 'NOT_REPO'), 'NOT_REPO');
  const gitDir = real(resolve(root, gitValue(root, ['rev-parse', '--git-dir'], 'NOT_REPO')), 'NOT_REPO');
  const commonDir = real(
    resolve(root, gitValue(root, ['rev-parse', '--git-common-dir'], 'NOT_REPO')),
    'NOT_REPO',
  );
  return { root, commonDir, isMain: gitDir === commonDir };
}

function validPath(entry) {
  if (
    !entry || entry.includes('\0') || /[\r\n\\*?[\]]/u.test(entry) || isAbsolute(entry) ||
    /^[A-Za-z]:[\\/]/u.test(entry)
  ) return false;
  return entry.split('/').every((part) => part && part !== '.' && part !== '..');
}

function inspectSource(main, entry) {
  if (!validPath(entry)) return { code: 'INVALID_PATH' };
  const source = join(main.root, entry);
  const sourceStat = stat(source);
  if (sourceStat === null) return { code: 'SOURCE_MISSING' };
  if (sourceStat.isSymbolicLink()) return { code: 'SOURCE_SYMLINK' };
  if (!sourceStat.isFile()) return { code: 'SOURCE_NOT_FILE' };
  const sourceReal = real(source, 'SOURCE_MISSING');
  if (!within(main.root, sourceReal)) return { code: 'PATH_ESCAPE' };

  const tracked = git(main.root, ['--literal-pathspecs', 'ls-files', '--error-unmatch', '--', entry]);
  if (tracked.status === 0) return { code: 'TRACKED' };
  if (tracked.status !== 1) {
    throw new AppError('GIT_FAILED', tracked.stderr.trim() || 'tracked-path query failed');
  }
  const ignored = git(main.root, ['check-ignore', '--quiet', '--no-index', '--', `./${entry}`]);
  if (ignored.status === 1) return { code: 'NOT_IGNORED' };
  if (ignored.status !== 0) {
    throw new AppError('GIT_FAILED', ignored.stderr.trim() || 'gitignore query failed');
  }
  return { code: 'OK', source: sourceReal };
}

function readManifest(context, missingIsEmpty = false) {
  const files = git(context.root, ['config', '--local', '-z', '--get-all', FILE_KEY]);
  if (files.status === 1) {
    if (missingIsEmpty) {
      const main = git(context.root, ['config', '--local', '--get', MAIN_KEY]);
      if (main.status === 1) return null;
      if (main.status === 0) {
        throw new AppError('INVALID_MANIFEST', `${MAIN_KEY} exists without ${FILE_KEY}`);
      }
      throw new AppError('GIT_FAILED', main.stderr.trim() || `git exited ${main.status}`);
    }
    throw new AppError('NOT_CONFIGURED', `${FILE_KEY} is not configured`);
  }
  if (files.status !== 0) {
    throw new AppError('GIT_FAILED', files.stderr.trim() || `git exited ${files.status}`);
  }
  const entries = files.stdout.split('\0').filter(Boolean);
  if (entries.length === 0) throw new AppError('INVALID_MANIFEST', `${FILE_KEY} is empty`);
  const mainPath = gitValue(context.root, ['config', '--local', '--get', MAIN_KEY], 'INVALID_MAIN');
  if (!isAbsolute(mainPath)) throw new AppError('INVALID_MAIN', `${MAIN_KEY} must be absolute`);
  let main;
  try {
    main = repo(mainPath);
  } catch (error) {
    throw new AppError('INVALID_MAIN', `${mainPath}: ${error.message}`);
  }
  if (!main.isMain || main.commonDir !== context.commonDir) {
    throw new AppError('INVALID_MAIN', `${mainPath} is not this repository's main worktree`);
  }
  return { entries, main };
}

function writeManifest(context, entries) {
  const lockPath = join(context.commonDir, 'agentforge-worktree-links.lock');
  let lock;
  // ponytail: SIGKILL can leave this lock behind; add PID/stale-lock recovery if it occurs in practice.
  try {
    lock = openSync(lockPath, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') throw new AppError('INIT_BUSY', 'another init is running');
    throw new AppError('LOCK_FAILED', error.code ?? error.message);
  }

  try {
    for (const [index, entry] of entries.entries()) {
      gitValue(context.root, ['config', '--local', index === 0 ? '--replace-all' : '--add', FILE_KEY, entry]);
    }
    gitValue(context.root, ['config', '--local', '--replace-all', MAIN_KEY, context.root]);
  } finally {
    try {
      closeSync(lock);
    } finally {
      unlinkSync(lockPath);
    }
  }
}

function classifyDestination(destination, source) {
  const destinationStat = stat(destination);
  if (destinationStat === null) return 'MISSING';
  if (!destinationStat.isSymbolicLink()) return 'DIVERGED';
  const link = readlinkSync(destination);
  if (link === source) return 'OK';
  return stat(resolve(dirname(destination), link)) === null ? 'DANGLING' : 'MISTARGET';
}

function ensureParent(root, entry, create = false) {
  let current = root;
  for (const part of dirname(entry).split('/').filter((value) => value !== '.')) {
    current = join(current, part);
    let currentStat = stat(current);
    if (currentStat === null) {
      if (!create) return;
      try {
        mkdirSync(current);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      currentStat = stat(current);
    }
    if (!currentStat?.isDirectory() || currentStat.isSymbolicLink()) {
      throw new AppError('PATH_ESCAPE', `${current} is not a real directory`);
    }
  }
  if (!within(root, real(current, 'PATH_ESCAPE'))) {
    throw new AppError('PATH_ESCAPE', `${current} escapes ${root}`);
  }
}

function safeDestinationState(root, entry, source) {
  ensureParent(root, entry);
  return classifyDestination(join(root, entry), source);
}

const report = (code, entry, detail = '') => process.stderr.write(
  `worktree-links: ${code}${entry ? ` ${entry}` : ''}${detail ? ` ${detail}` : ''}\n`,
);

function fixOne(target, { hook = false } = {}) {
  const context = repo(target);
  if (context.isMain) return 0;
  const configured = readManifest(context, hook);
  if (configured === null) return 0;
  let issues = 0;

  for (const entry of configured.entries) {
    const source = inspectSource(configured.main, entry);
    if (source.code !== 'OK') {
      report(source.code, entry);
      issues += 1;
      continue;
    }
    const destination = join(context.root, entry);
    let state;
    try {
      state = safeDestinationState(context.root, entry, source.source);
    } catch (error) {
      report(error.code === 'PATH_ESCAPE' ? 'PATH_ESCAPE' : 'LINK_FAILED', entry, error.message);
      issues += 1;
      continue;
    }
    if (state === 'OK') continue;
    if (state !== 'MISSING') {
      report(state, entry);
      issues += 1;
      continue;
    }
    try {
      ensureParent(context.root, entry, true);
      const previousCwd = process.cwd();
      try {
        process.chdir(dirname(destination));
        const parent = real('.', 'PATH_ESCAPE');
        if (!within(context.root, parent)) {
          throw new AppError('PATH_ESCAPE', `${parent} escapes ${context.root}`);
        }
        const name = basename(destination);
        symlinkSync(source.source, name);
        const linkedParent = real('.', 'PATH_ESCAPE');
        if (!within(context.root, linkedParent)) {
          unlinkSync(name);
          throw new AppError('PATH_ESCAPE', `${linkedParent} escapes ${context.root}`);
        }
      } finally {
        process.chdir(previousCwd);
      }
    } catch (error) {
      if (
        error.code === 'EEXIST' &&
        safeDestinationState(context.root, entry, source.source) === 'OK'
      ) continue;
      report(error.code === 'PATH_ESCAPE' ? 'PATH_ESCAPE' : 'LINK_FAILED', entry, error.message);
      issues += 1;
    }
  }
  return issues === 0 ? 0 : 1;
}

function check(target, { verbose = false } = {}) {
  const context = repo(target);
  if (context.isMain) return 0;
  const configured = readManifest(context);
  let findings = 0;
  for (const entry of configured.entries) {
    const source = inspectSource(configured.main, entry);
    if (source.code === 'SOURCE_MISSING') {
      process.stdout.write(`SOURCE_MISSING ${entry}\n`);
      findings += 1;
      continue;
    }
    if (source.code !== 'OK') {
      report(source.code, entry);
      findings += 1;
      continue;
    }
    let state;
    try {
      state = safeDestinationState(context.root, entry, source.source);
    } catch (error) {
      report(error.code === 'PATH_ESCAPE' ? 'PATH_ESCAPE' : 'CHECK_FAILED', entry, error.message);
      findings += 1;
      continue;
    }
    if (state === 'OK' && verbose) {
      process.stdout.write(`OK ${entry} -> ${source.source}\n`);
    } else if (state !== 'OK') {
      process.stdout.write(`${state} ${entry}\n`);
      findings += 1;
    }
  }
  return findings === 0 ? 0 : 1;
}

function init(target, entries) {
  const context = repo(target);
  if (!context.isMain) throw new AppError('MAIN_ONLY', 'init must run in the main worktree');
  const failures = entries
    .map((entry) => [inspectSource(context, entry).code, entry])
    .filter(([code]) => code !== 'OK');
  if (failures.length > 0) {
    for (const [code, entry] of failures) report(code, entry);
    return 1;
  }
  writeManifest(context, entries);
  return 0;
}

function worktreePaths(context) {
  return gitValue(context.root, ['worktree', 'list', '--porcelain', '-z'])
    .split('\0\0')
    .map((record) => record.split('\0')[0])
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length));
}

function fixAll(target) {
  const context = repo(target);
  let issues = 0;
  for (const path of worktreePaths(context)) {
    let candidate;
    try {
      candidate = repo(path);
    } catch {
      continue;
    }
    if (candidate.commonDir !== context.commonDir) {
      report('FOREIGN_WORKTREE', path);
      issues = 1;
      continue;
    }
    if (!candidate.isMain && fixOne(candidate.root) !== 0) issues = 1;
  }
  return issues === 0 ? 0 : 1;
}

function payloadTarget() {
  let payload = {};
  try {
    if (!process.stdin.isTTY) payload = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    payload = {};
  }
  return typeof payload.cwd === 'string' ? payload.cwd : process.cwd();
}

function usage() {
  process.stderr.write(
    'worktree-links: USAGE worktree-links.mjs init <file...> | fix [target] | fixall [target] | check [--verbose] [target]\n',
  );
  return 2;
}

const [command, ...args] = process.argv.slice(2);
const hook = command === undefined;

try {
  if (hook) {
    try {
      process.exitCode = fixOne(payloadTarget(), { hook: true });
    } catch (error) {
      if (error.code === 'NOT_REPO' || error.code === 'NOT_CONFIGURED') process.exitCode = 0;
      else throw error;
    }
  } else if (command === 'init') {
    process.exitCode = args.length === 0 ? usage() : init(process.cwd(), args);
  } else if (command === 'fix' && args.length <= 1) {
    process.exitCode = fixOne(args[0] ?? process.cwd());
  } else if (command === 'fixall' && args.length <= 1) {
    process.exitCode = fixAll(args[0] ?? process.cwd());
  } else if (command === 'check') {
    const verbose = args[0] === '--verbose';
    const checkArgs = verbose ? args.slice(1) : args;
    process.exitCode = checkArgs.length <= 1
      ? check(checkArgs[0] ?? process.cwd(), { verbose })
      : usage();
  } else {
    process.exitCode = usage();
  }
} catch (error) {
  report(error.code ?? 'UNEXPECTED', '', error.message);
  process.exitCode = 1;
}
