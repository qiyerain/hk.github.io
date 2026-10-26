'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const audit = spawnSync(process.execPath, ['tools/repo-hygiene.js'], {
  encoding: 'utf8'
});
process.stdout.write(audit.stdout || '');
process.stderr.write(audit.stderr || '');
if (audit.error) throw audit.error;
if (audit.status !== 0) process.exit(audit.status || 1);

const albumAudit = spawnSync(process.execPath, ['tools/album-maintenance.js'], {
  encoding: 'utf8'
});
process.stdout.write(albumAudit.stdout || '');
process.stderr.write(albumAudit.stderr || '');
if (albumAudit.error) throw albumAudit.error;
if (albumAudit.status !== 0) process.exit(albumAudit.status || 1);

// Hexo loads every file in scripts/ as JavaScript, including the local shell
// helper used by the WeChat workflow. Keep that helper at its documented path
// while preventing Hexo from trying to evaluate it during a site build.
const shellScript = path.resolve('scripts/wechat_draft_local.sh');
const quarantinedShellScript = path.resolve('tools/.wechat_draft_local.sh.hexo-disabled');
let shellScriptMoved = false;
if (fs.existsSync(shellScript)) {
  fs.renameSync(shellScript, quarantinedShellScript);
  shellScriptMoved = true;
}

let result;
try {
  result = spawnSync(process.execPath, ['node_modules/hexo/bin/hexo', 'generate'], {
    encoding: 'utf8'
  });
} finally {
  if (shellScriptMoved) fs.renameSync(quarantinedShellScript, shellScript);
}

const output = `${result.stdout || ''}${result.stderr || ''}`;
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');

if (result.error) {
  throw result.error;
}

if (result.status !== 0 || output.includes('ERROR Process failed:')) {
  process.exitCode = result.status || 1;
}
