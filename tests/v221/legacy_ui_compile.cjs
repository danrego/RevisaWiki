'use strict';
// Original baseline fixture compilation is a syntax check, not a new browser run.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), files = ['tests/v220/bio_ui_preflight.cjs', 'tests/v220/bio_ui_fixture.js'],
  sha = raw => crypto.createHash('sha256').update(raw).digest('hex'), pins = files.map(file => ({file, sha256: sha(fs.readFileSync(path.join(root, file)))}));
cp.execFileSync(process.execPath, [path.join(root, files[0])], {cwd: root,
  env: {...process.env, REVISAWIKI_BIO_UI_COMPILE_ONLY: '1'}, timeout: 30000, stdio: 'pipe'});
cp.execFileSync(process.execPath, ['--check', path.join(root, files[1])], {cwd: root, timeout: 30000, stdio: 'pipe'});
for (const pin of pins) assert.equal(sha(fs.readFileSync(path.join(root, pin.file))), pin.sha256);
console.log(JSON.stringify({status: 'passed', kind: 'immutable-baseline-ui-fixture-compile-only', checks: 4,
  sources: pins, browserExecuted: false, candidateCoverageCredit: 0, networkRequests: 0, wikipediaWrites: 0}));
