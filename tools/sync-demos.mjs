#!/usr/bin/env node
'use strict';

/**
 * Copy interactive HTML artifacts into `source/demos/<slug>/` so they are published
 * with the blog and can be opened from an article.
 *
 * The artifacts are built and owned elsewhere (a repository handbook, an Archify
 * delivery). This repository only mirrors a copy, because Hexo cannot serve a file
 * from outside `source/`. Every copy is recorded in `source/demos/manifest.json`
 * with a content hash, so a stale mirror is detectable instead of silent.
 *
 * Usage:
 *   node scripts/sync-demos.mjs learn-harness=/abs/path/to/learn-harness \
 *                                 dsh-architecture=/abs/path/to/dsh-architecture.html
 *   node scripts/sync-demos.mjs --check
 *
 * A directory source is copied recursively and must contain `index.html`.
 * A file source must be an `.html` file and is published as `index.html`.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.resolve(__dirname, '..');
const demosDir = path.join(root, 'source', 'demos');
const manifestPath = path.join(demosDir, 'manifest.json');
const slugPattern = /^[a-z0-9][a-z0-9-]*$/;
const ignoredNames = new Set(['.DS_Store', 'Thumbs.db']);

/** Hash one file with SHA-256. */
function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** List publishable files under a directory, relative and sorted. */
function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => !ignoredNames.has(entry.name))
    .flatMap(entry => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listFiles(target).map(relative => path.join(entry.name, relative));
      }
      return [entry.name];
    })
    .sort();
}

/** Hash a published demo tree: file name plus content, order-independent. */
function hashTree(directory) {
  const hash = crypto.createHash('sha256');
  for (const file of listFiles(directory)) {
    hash.update(file);
    hash.update(fs.readFileSync(path.join(directory, file)));
  }
  return hash.digest('hex');
}

/** Remove a previously published demo tree. */
function removeDirectory(directory) {
  if (fs.existsSync(directory)) fs.rmSync(directory, { recursive: true, force: true });
}

/**
 * Copy one source artifact into `source/demos/<slug>/`.
 * @param {{slug: string, source: string}} demo Slug and absolute source path.
 * @returns {{slug: string, entry: string, sourceName: string, bytes: number, sha256: string, files: number}} Manifest record.
 */
function syncDemo({ slug, source }) {
  if (!slugPattern.test(slug)) throw new Error(`invalid slug: ${slug}`);
  const stat = fs.statSync(source);
  const target = path.join(demosDir, slug);
  removeDirectory(target);
  fs.mkdirSync(target, { recursive: true });

  let entry;
  if (stat.isDirectory()) {
    if (!fs.existsSync(path.join(source, 'index.html'))) {
      throw new Error(`${slug}: directory source has no index.html`);
    }
    copyTree(source, target);
    entry = 'index.html';
  } else {
    if (path.extname(source).toLowerCase() !== '.html') {
      throw new Error(`${slug}: file source must be .html`);
    }
    fs.copyFileSync(source, path.join(target, 'index.html'));
    entry = 'index.html';
  }

  const record = {
    slug,
    entry,
    sourceName: path.basename(source),
    bytes: fs.statSync(path.join(target, entry)).size,
    files: listFiles(target).length,
    sha256: hashTree(target)
  };
  console.log(`${slug}: ${record.files} file(s), entry ${record.bytes} bytes, ${record.sha256.slice(0, 12)}`);
  return record;
}

/** Recursively copy a directory, skipping OS metadata files. */
function copyTree(source, target) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (ignoredNames.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyTree(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

/** Verify every published demo matches its manifest hash. */
function check() {
  if (!fs.existsSync(manifestPath)) {
    console.error('no manifest: run without --check after a sync');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const problems = [];
  for (const demo of manifest.demos) {
    const target = path.join(demosDir, demo.slug);
    if (!fs.existsSync(target)) {
      problems.push(`${demo.slug}: published copy is missing`);
      continue;
    }
    const actual = hashTree(target);
    if (actual !== demo.sha256) problems.push(`${demo.slug}: content changed outside the sync script`);
  }
  if (problems.length) {
    console.error('demo mirror check failed:');
    problems.forEach(problem => console.error(`  - ${problem}`));
    process.exit(1);
  }
  console.log(`demo mirror check passed: ${manifest.demos.length} demo(s)`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    check();
    return;
  }
  if (args.length === 0) {
    console.error('usage: node scripts/sync-demos.mjs <slug>=<path>... | --check');
    process.exit(2);
  }

  const previous = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')).demos
    : [];
  const bySlug = new Map(previous.map(demo => [demo.slug, demo]));

  fs.mkdirSync(demosDir, { recursive: true });
  for (const arg of args) {
    const separator = arg.indexOf('=');
    if (separator < 1) throw new Error(`invalid argument: ${arg}`);
    const slug = arg.slice(0, separator);
    const source = path.resolve(arg.slice(separator + 1));
    bySlug.set(slug, syncDemo({ slug, source }));
  }

  const syncedAt = new Date().toISOString();
  const demos = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(manifestPath, `${JSON.stringify({ syncedAt, demos }, null, 2)}\n`);
  console.log(`manifest: ${path.relative(root, manifestPath)} (${demos.length} demo(s))`);
}

main();
