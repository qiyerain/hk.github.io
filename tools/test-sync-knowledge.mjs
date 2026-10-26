import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./sync-knowledge.mjs', import.meta.url));

async function runFixture(count, size) {
  const root = mkdtempSync(path.join(tmpdir(), 'knowledge-sync-test-'));
  const requests = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const part of req) body += part;
    requests.push(JSON.parse(body));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ batchJobId: randomUUID(), status: 'received' }));
  });
  let child;
  try {
    mkdirSync(path.join(root, 'source/_posts'), { recursive: true });
    for (let i = 0; i < count; i++) {
      writeFileSync(path.join(root, 'source/_posts', `${i}.md`),
        `---\narticle_id: ${randomUUID()}\ntitle: Test\nslug: post-${i}\ndate: 2026-10-12\ntags: [Java]\n---\n${'x'.repeat(size)}`);
    }
    execFileSync('git', ['init', '-q', root]);
    execFileSync('git', ['add', '.'], { cwd: root });
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], { cwd: root });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    child = spawn(process.execPath, [script], { cwd: root, env: {
      ...process.env, KNOWLEDGE_SYNC_MODE: 'full', BLOG_SYNC_TOKEN: 'fixture-only',
      BLOG_API_BASE_URL: `http://127.0.0.1:${server.address().port}`,
    }, stdio: ['ignore', 'pipe', 'pipe'] });
    let errors = '';
    child.stdout.resume();
    child.stderr.on('data', data => { errors += data; });
    const [code] = await once(child, 'exit');
    assert.equal(code, 0, errors);
    assert.equal(requests.flatMap(r => r.documents).length, count);
    for (const request of requests) {
      assert.ok(request.documents.length <= 100);
      assert.ok(request.documents.reduce((sum, d) => sum + d.contentMarkdown.length, 0) <= 2000000);
      for (const d of request.documents) {
        assert.ok(d.sourcePath.startsWith('source/_posts/'));
        assert.deepEqual(d.tags, ['Java']);
        assert.ok(Number.isFinite(Date.parse(d.updatedAt)));
      }
    }
    return requests;
  } finally {
    if (child && child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
    server.closeAllConnections();
    if (server.listening) await new Promise(resolve => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  }
}

test('full sync is split at the 100-document limit', async () => {
  const requests = await runFixture(101, 100);
  assert.deepEqual(requests.map(r => r.documents.length), [100, 1]);
});

test('large posts are split by total characters before reaching document limit', async () => {
  const requests = await runFixture(12, 190000);
  assert.deepEqual(requests.map(r => r.documents.length), [10, 2]);
});
