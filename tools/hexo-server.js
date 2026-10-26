'use strict';

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rawArgs = process.argv.slice(2);
const syncKnowledge = rawArgs.includes('--sync-knowledge');
const hexoArgs = rawArgs.filter((arg) => arg !== '--sync-knowledge');
const shellScript = path.join(root, 'scripts/wechat_draft_local.sh');
const quarantinedShellScript = path.join(root, 'tools/.wechat_draft_local.sh.hexo-disabled');
let shellScriptMoved = false;

if (fs.existsSync(shellScript)) {
  fs.renameSync(shellScript, quarantinedShellScript);
  shellScriptMoved = true;
}

if (syncKnowledge) {
  const sync = spawnSync(process.execPath, ['tools/sync-knowledge.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      BLOG_API_BASE_URL: process.env.BLOG_API_BASE_URL || 'http://localhost:8080',
      KNOWLEDGE_SYNC_MODE: process.env.KNOWLEDGE_SYNC_MODE || 'incremental'
    }
  });
  if (sync.status !== 0) console.warn('Local knowledge sync failed; continuing with the static development server.');
}

function restoreShellScript() {
  if (shellScriptMoved && fs.existsSync(quarantinedShellScript)) {
    fs.renameSync(quarantinedShellScript, shellScript);
    shellScriptMoved = false;
  }
}

const child = spawn(process.execPath, ['node_modules/hexo/bin/hexo', 'server', ...hexoArgs], {
  cwd: root,
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code, signal) => {
  restoreShellScript();
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

process.on('exit', restoreShellScript);
