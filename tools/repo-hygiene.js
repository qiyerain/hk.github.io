'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const allowedRootFiles = new Set([
  '.env.local',
  '.gitignore',
  '.node-version',
  'AGENTS.md',
  'CLAUDE.md',
  'db.json',
  '_config.anzhiyu.yml',
  '_config.fluid.yml',
  '_config.shoka.yml',
  '_config.yml',
  'md2wechat.yaml',
  'package-lock.json',
  'package.json',
  'skills-lock.json',
  'vercel.json'
]);
const forbiddenPattern = /(^|\/)(?:__pycache__|\.cache)(?:\/|$)|\.(?:bak|log|orig|pid|rej|tmp|py[co])$/i;
const misplacedRootPattern = /^run_.*\.sh$/i;

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const problems = [];
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!allowedRootFiles.has(entry.name)) {
    const destination = /\.(?:md|png|jpe?g|webp)$/i.test(entry.name) ? 'docs/design/' : 'scripts/, tools/, or .cache/';
    problems.push(`${entry.name}: move to ${destination}`);
  }
  if (misplacedRootPattern.test(entry.name)) problems.push(`${entry.name}: reusable wrappers belong in scripts/`);
}

let tracked = [];
try {
  tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
} catch (error) {
  problems.push(`git ls-files failed: ${error.message}`);
}
tracked.filter(file => fs.existsSync(path.join(root, file)) && forbiddenPattern.test(file))
  .forEach(file => problems.push(`${file}: forbidden tracked temporary artifact`));

walk(path.join(root, 'public'))
  .map(file => path.relative(root, file))
  .filter(file => forbiddenPattern.test(file))
  .forEach(file => problems.push(`${file}: forbidden generated artifact`));

if (problems.length) {
  console.error('Repository hygiene audit failed:');
  [...new Set(problems)].forEach(problem => console.error(`  - ${problem}`));
  process.exit(1);
}

console.log('Repository hygiene audit passed.');
