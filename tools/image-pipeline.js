'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const queueDirectory = process.env.IMAGE_PIPELINE_QUEUE_DIR
  ? path.resolve(process.env.IMAGE_PIPELINE_QUEUE_DIR)
  : path.join(root, '.cache', 'image-upload-queue');
const queueFile = path.join(queueDirectory, 'queue.json');
const allowedFormats = new Set(['jpeg', 'png', 'webp', 'avif', 'tiff']);

function argumentsToObject(values) {
  const result = { _: [] };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) {
      result._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = values[index + 1];
    result[key] = next && !next.startsWith('--') ? values[++index] : true;
  }
  return result;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function validateImage(file) {
  const metadata = await sharp(file, { failOn: 'error' }).metadata();
  if (!metadata.format || !allowedFormats.has(metadata.format)) {
    throw new Error(`Unsupported image MIME/format: ${metadata.format || 'unknown'}`);
  }
  if (!metadata.width || !metadata.height) throw new Error('Image dimensions are unavailable');
  return metadata;
}

async function prepare(input, output, type) {
  const metadata = await validateImage(input);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (type === 'cover') {
    let quality = 82;
    let bytes = 0;
    do {
      await sharp(input)
        .rotate()
        .resize(1600, 900, { fit: 'cover', position: 'centre' })
        .webp({ quality, effort: 5 })
        .toFile(output);
      bytes = fs.statSync(output).size;
      quality -= 4;
    } while (bytes > 250 * 1024 && quality >= 46);
    if (bytes > 250 * 1024) throw new Error(`Cover remains over 250 KB: ${bytes} bytes`);
  } else if (type === 'album') {
    await sharp(input)
      .rotate()
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(output);
  } else {
    throw new Error(`Unknown derivative type: ${type}`);
  }
  const result = {
    input: path.resolve(input),
    output: path.resolve(output),
    type,
    sourceFormat: metadata.format,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    bytes: fs.statSync(output).size,
    hash: sha256(output),
  };
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

function loadQueue() {
  if (!fs.existsSync(queueFile)) return [];
  const data = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  return Array.isArray(data) ? data : [];
}

function saveQueue(items) {
  fs.mkdirSync(queueDirectory, { recursive: true });
  fs.writeFileSync(queueFile, `${JSON.stringify(items, null, 2)}\n`);
}

function enqueue(options) {
  if (!options.file || !fs.existsSync(options.file)) throw new Error('--file must reference an existing derivative');
  const hash = options.hash || sha256(options.file);
  const items = loadQueue();
  const previous = items.find(item => item.hash === hash);
  const now = new Date().toISOString();
  const entry = {
    id: previous ? previous.id : crypto.randomUUID(),
    file: path.resolve(options.file),
    source: options.source || '',
    sourcePage: options['source-page'] || '',
    license: options.license || '',
    hash,
    category: options.category || '',
    type: options.type || 'album',
    attempts: previous ? previous.attempts + 1 : 1,
    lastError: options.error || 'Upload failed',
    target: options.target || '',
    createdAt: previous ? previous.createdAt : now,
    updatedAt: now,
  };
  const next = previous ? items.map(item => item.hash === hash ? entry : item) : items.concat(entry);
  saveQueue(next);
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

async function verifyRemoteImage(url) {
  const allowHttpForTests = process.env.IMAGE_PIPELINE_ALLOW_HTTP === '1';
  if (!/^https:\/\//i.test(url) && !(allowHttpForTests && /^http:\/\/127\.0\.0\.1(?::\d+)?\//i.test(url))) {
    throw new Error('PicGo did not return an HTTPS URL');
  }
  const response = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-31' }, signal: AbortSignal.timeout(15000) });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok && response.status !== 206) throw new Error(`OSS verification returned HTTP ${response.status}`);
  if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`OSS verification returned ${contentType || 'no content type'}`);
  return url;
}

async function upload(file, server) {
  const response = await fetch(`${server.replace(/\/$/, '')}/upload`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ list: [path.resolve(file)] }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`PicGo returned HTTP ${response.status}`);
  const data = await response.json();
  const url = data.success && Array.isArray(data.result) ? data.result[0] : null;
  return verifyRemoteImage(url || '');
}

async function retry(server) {
  const items = loadQueue();
  const remaining = [];
  const uploaded = [];
  for (const item of items) {
    try {
      if (!fs.existsSync(item.file)) throw new Error('Queued derivative is missing');
      const url = await upload(item.file, server);
      uploaded.push({ ...item, url });
    } catch (error) {
      remaining.push({ ...item, attempts: item.attempts + 1, lastError: error.message, updatedAt: new Date().toISOString() });
    }
  }
  saveQueue(remaining);
  process.stdout.write(`${JSON.stringify({ uploaded, remaining: remaining.length }, null, 2)}\n`);
  if (remaining.length) process.exitCode = 1;
}

async function main() {
  const [command, ...values] = process.argv.slice(2);
  const options = argumentsToObject(values);
  if (command === 'prepare') {
    if (!options.input || !options.output) throw new Error('prepare requires --input and --output');
    await prepare(options.input, options.output, options.type || 'cover');
  } else if (command === 'queue') {
    enqueue(options);
  } else if (command === 'retry') {
    await retry(options.server || process.env.PICGO_SERVER || 'http://127.0.0.1:36677');
  } else {
    throw new Error('Usage: image-pipeline.js prepare|queue|retry [options]');
  }
}

main().catch(error => {
  process.stderr.write(`Image pipeline failed: ${error.message}\n`);
  process.exitCode = 1;
});
