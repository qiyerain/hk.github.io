import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import yaml from 'js-yaml';

const root = process.cwd();
const mode = process.env.KNOWLEDGE_SYNC_MODE || 'incremental';
const apiBase = String(process.env.BLOG_API_BASE_URL || '').replace(/\/$/, '');
const token = process.env.BLOG_SYNC_TOKEN || '';
const localRun = !process.env.GITHUB_ACTIONS && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(apiBase);
const localStatePath = path.join(root, '.cache/knowledge-sync-state.json');

if (!apiBase) throw new Error('BLOG_API_BASE_URL is required');
if (!token && !localRun) throw new Error('BLOG_SYNC_TOKEN is required outside localhost');

if (!['full', 'incremental'].includes(mode)) throw new Error('Invalid KNOWLEDGE_SYNC_MODE');

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z', 'source/_posts'], { encoding: 'utf8' }).split('\0');
}

function changedFiles() {
  if (mode === 'full') return trackedFiles();
  let base = process.env.GITHUB_EVENT_BEFORE;
  if (!base && localRun && fs.existsSync(localStatePath)) {
    try { base = JSON.parse(fs.readFileSync(localStatePath, 'utf8')).lastSuccessfulCommit; } catch { /* first local sync */ }
  }
  const sha = process.env.GITHUB_SHA || 'HEAD';
  // Shallow CI checkouts may not contain the previous commit. Full upsert is safe;
  // unchanged content retains existing vectors on the backend.
  if (!base || /^0+$/.test(base)) return trackedFiles();
  try {
    const committed = execFileSync('git', ['diff', '--diff-filter=ACMR', '--name-only', '-z', base, sha, '--', 'source/_posts'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).split('\0');
    if (!localRun) return committed;
    const working = execFileSync('git', ['diff', '--diff-filter=ACMR', '--name-only', '-z', 'HEAD', '--', 'source/_posts'], { encoding: 'utf8' }).split('\0');
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z', 'source/_posts'], { encoding: 'utf8' }).split('\0');
    return [...committed, ...working, ...untracked];
  } catch {
    console.warn('Incremental base unavailable; submitting tracked posts in bounded batches.');
    return trackedFiles();
  }
}

function parsePost(file) {
  const raw = fs.readFileSync(file);
  const text = raw.toString('utf8').replace(/^\uFEFF?[\t \r\n]*/, '');
  const match = text.match(/^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`missing front matter: ${file}`);
  const front = yaml.load(match[1]) || {};
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const sourcePath = relative;
  const basename = path.basename(file, '.md');
  const dateText = (front.date instanceof Date ? front.date.toISOString() : String(front.date || '')).slice(0, 10).replaceAll('-', '/');
  const slug = String(front.slug || (dateText ? `${dateText}/${basename}` : basename)).replace(/^\/+|\/+$/g, '');
  const canonicalPath = `/${slug}/`;
  const articleId = String(front.article_id || '');
  if (!articleId) throw new Error(`missing article_id: ${file}`);
  const title = String(front.title || basename);
  return {
    articleId,
    sourcePath,
    title,
    slug,
    canonicalPath,
    coverKey: front.cover || null,
    categories: [front.categories || []].flat().map(String),
    tags: [front.tags || []].flat().map(String),
    updatedAt: new Date(execFileSync('git', ['log', '-1', '--format=%cI', '--', relative], { encoding: 'utf8' }).trim()).toISOString(),
    contentMarkdown: text,
    contentHash: crypto.createHash('sha256').update(raw).digest('hex'),
  };
}

const files = [...new Set(changedFiles().filter((file) => file.startsWith('source/_posts/') && file.endsWith('.md')))].map((file) => path.resolve(root, file));
if (files.length === 0) {
  console.log('No Markdown changes to synchronize.');
  process.exit(0);
}

async function submit(documents) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-Admin-Token'] = token;
  const response = await fetch(`${apiBase}/api/v1/admin/knowledge/sync-jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode, source: 'hexo', documents }),
    signal: AbortSignal.timeout(60000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`knowledge sync failed (${response.status}): ${body}`);
  console.log(`Queued ${documents.length} articles: ${body}`);
}

let documents = [];
let characters = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const document = parsePost(file);
  const length = document.contentMarkdown.length;
  if (length > 200000) throw new Error(`Article exceeds 200000 characters: ${document.sourcePath}`);
  if (documents.length >= 100 || characters + length > 2000000) {
    await submit(documents);
    documents = [];
    characters = 0;
  }
  documents.push(document);
  characters += length;
}
if (documents.length) await submit(documents);

if (localRun) {
  fs.mkdirSync(path.dirname(localStatePath), { recursive: true });
  fs.writeFileSync(localStatePath, `${JSON.stringify({ lastSuccessfulCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), syncedAt: new Date().toISOString() }, null, 2)}\n`);
}
