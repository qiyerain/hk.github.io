'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const pipeline = path.join(__dirname, 'image-pipeline.js');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoao-image-pipeline-'));
const queueDirectory = path.join(temporary, 'queue');
const environment = { ...process.env, IMAGE_PIPELINE_QUEUE_DIR: queueDirectory, IMAGE_PIPELINE_ALLOW_HTTP: '1' };

function run(args, expectedCode = 0) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [pipeline].concat(args), { cwd: root, env: environment });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', code => {
      if (code !== expectedCode) reject(new Error(`${args.join(' ')} exited ${code}: ${stderr}`));
      else resolve({ stdout, stderr });
    });
  });
}

async function createImage(file, color) {
  await sharp({ create: { width: 2400, height: 1400, channels: 3, background: color } }).jpeg({ quality: 95 }).toFile(file);
}

async function main() {
  const firstSource = path.join(temporary, 'first.jpg');
  const secondSource = path.join(temporary, 'second.jpg');
  const failedSource = path.join(temporary, 'failed.jpg');
  const first = path.join(temporary, 'first.webp');
  const second = path.join(temporary, 'second.webp');
  const failed = path.join(temporary, 'fail.webp');
  await createImage(firstSource, '#386641');
  await createImage(secondSource, '#bc4749');
  await createImage(failedSource, '#6a4c93');
  await run(['prepare', '--type', 'cover', '--input', firstSource, '--output', first]);
  await run(['prepare', '--type', 'album', '--input', secondSource, '--output', second]);
  await run(['prepare', '--type', 'album', '--input', failedSource, '--output', failed]);
  const coverMetadata = await sharp(first).metadata();
  assert.deepStrictEqual([coverMetadata.width, coverMetadata.height], [1600, 900]);
  assert(fs.statSync(first).size < 250 * 1024);

  const invalid = path.join(temporary, 'invalid.txt');
  fs.writeFileSync(invalid, 'not an image');
  await run(['prepare', '--type', 'cover', '--input', invalid, '--output', `${invalid}.webp`], 1);

  await run(['queue', '--file', first, '--source', 'first', '--license', 'CC BY', '--category', 'test']);
  await run(['queue', '--file', first, '--source', 'first', '--license', 'CC BY', '--category', 'test']);
  let queue = JSON.parse(fs.readFileSync(path.join(queueDirectory, 'queue.json'), 'utf8'));
  assert.strictEqual(queue.length, 1);
  assert.strictEqual(queue[0].attempts, 2);

  await run(['queue', '--file', second, '--source', 'second', '--license', 'CC BY', '--category', 'test']);
  await run(['queue', '--file', failed, '--source', 'failed', '--license', 'CC BY', '--category', 'test']);
  const server = http.createServer((request, response) => {
    if (request.method === 'POST') {
      let body = '';
      request.on('data', chunk => { body += chunk; });
      request.on('end', () => {
        const file = JSON.parse(body).list[0];
        const suffix = file.includes('fail.webp') ? '/not-image' : '/image.webp';
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ success: true, result: [`http://127.0.0.1:${server.address().port}${suffix}`] }));
      });
      return;
    }
    if (request.url === '/image.webp') {
      response.setHeader('content-type', 'image/webp');
      response.end(fs.readFileSync(first));
    } else {
      response.setHeader('content-type', 'text/plain');
      response.end('invalid');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const partial = await run(['retry', '--server', `http://127.0.0.1:${port}`], 1);
  const partialResult = JSON.parse(partial.stdout);
  assert.strictEqual(partialResult.uploaded.length, 2);
  assert.strictEqual(partialResult.remaining, 1);
  queue = JSON.parse(fs.readFileSync(path.join(queueDirectory, 'queue.json'), 'utf8'));
  assert.strictEqual(queue[0].attempts, 2);

  fs.renameSync(failed, path.join(temporary, 'recovered.webp'));
  queue[0].file = path.join(temporary, 'recovered.webp');
  fs.writeFileSync(path.join(queueDirectory, 'queue.json'), `${JSON.stringify(queue, null, 2)}\n`);
  const success = await run(['retry', '--server', `http://127.0.0.1:${port}`]);
  assert.strictEqual(JSON.parse(success.stdout).remaining, 0);
  server.close();
  process.stdout.write('Image pipeline tests passed: transform, MIME rejection, dedupe, partial failure, retry, full success.\n');
}

main().catch(error => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
