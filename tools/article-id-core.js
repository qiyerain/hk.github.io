const crypto = require('node:crypto');

// 固定命名空间：算法一旦投入使用不要修改，否则同一篇文章会得到不同 ID。
const ARTICLE_NAMESPACE = '7f2f7a2e-4d4a-5b8f-8d5d-4c2f8a5f1c31';

function normalize(value) {
  return String(value ?? '').normalize('NFC').trim().replace(/\\/g, '/').replace(/\\s+/g, ' ');
}

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid article date: ${value}`);
  return date.toISOString();
}

function uuidV5(name) {
  const namespace = Buffer.from(ARTICLE_NAMESPACE.replace(/-/g, ''), 'hex');
  const digest = crypto.createHash('sha1').update(namespace).update(Buffer.from(name, 'utf8')).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function articleIdSeed({ title, date }) {
  return [normalize(title), normalizeDate(date)].join('\n');
}

function articleId(input) { return uuidV5(articleIdSeed(input)); }

module.exports = { articleId, articleIdSeed, uuidV5 };
