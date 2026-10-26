#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const frontMatter = require('hexo-front-matter');
const { articleId } = require('./article-id-core');

const root = path.resolve(__dirname, '..');
const postsDir = path.join(root, 'source', '_posts');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.md') ? [file] : [];
  });
}

let changed = 0;
for (const file of walk(postsDir)) {
  const original = fs.readFileSync(file, 'utf8');
  const data = frontMatter.parse(original);
  if (data.article_id) continue;
  const relativePath = path.relative(root, file).split(path.sep).join('/');
  const id = articleId({ title: data.title, date: data.date });
  const lines = original.split('\n');
  const dateIndex = lines.findIndex((line) => /^date:\s*/.test(line));
  lines.splice(dateIndex >= 0 ? dateIndex + 1 : 1, 0, `article_id: ${id}`);
  fs.writeFileSync(file, lines.join('\n'));
  changed += 1;
  console.log(`${id} ${relativePath}`);
}
console.log(`article IDs added: ${changed}`);
