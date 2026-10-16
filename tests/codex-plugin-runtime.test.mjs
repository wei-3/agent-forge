import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('Codex discovers the packaged humanizer skill and website', {
  skip: process.env.CODEX_RUNTIME_TESTS !== '1',
  timeout: 30000,
}, async (t) => {
  const child = spawn('codex', ['app-server', '--stdio'], {
    cwd: root,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stderr.resume();
  const lines = createInterface({ input: child.stdout });
  const pending = new Map();
  let nextId = 0;
  const failPending = (error) => {
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  };
  child.on('error', failPending);
  child.on('exit', (code) => failPending(new Error(`Codex exited: ${code}`)));
  lines.on('line', (line) => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  t.after(() => {
    lines.close();
    child.stdin.end();
    child.kill();
  });
  const call = (method, params) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
  });

  await call('initialize', {
    clientInfo: { name: 'agent-forge-runtime-test', version: '1' },
    capabilities: { experimentalApi: true },
  });
  child.stdin.write(`${JSON.stringify({ method: 'initialized' })}\n`);
  const { plugin } = await call('plugin/read', {
    marketplacePath: resolve(root, '.agents/plugins/marketplace.json'),
    pluginName: 'humanizer',
  });
  assert.equal(plugin.summary.interface.websiteUrl, 'https://github.com/blader/humanizer');
  assert.equal(plugin.skills.length, 1);
  assert.equal(plugin.skills[0].name, 'humanizer:humanizer');
  assert.equal(plugin.skills[0].enabled, true);
  assert.equal(plugin.skills[0].interface.displayName, 'Humanizer');
  assert.ok(plugin.skills[0].path.endsWith('/skills/humanizer/SKILL.md'));
});
