'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
if (process.argv[2] === '--worker') {
  const row = JSON.parse(fs.readFileSync(0, 'utf8'));
  const api = require(path.resolve(process.argv[3]));
  const cfg = {namespaceNumber: 0, contentModel: 'wikitext', pageTitle: 'Caso congelado', revisionId: row.revid};
  assert.equal(sha(row.source), row.sourceSha256);
  const result = api.calculate({kind: 'adjust', source: row.source, originalSource: row.source, options: cfg});
  const safety = api.v219AutomaticResultSafety(row.source, result);
  assert.equal(safety.accepted, true, JSON.stringify(safety));
  assert.ok(result.text.includes('== ' + row.heading + ' =='), 'Existing heading remains exact');
  const change = result.changes.find(c => c.id === 'v221CompatibleBibliographyColumns');
  assert.equal(change?.count, 1, 'One proved final bibliography layout');
  assert.equal(api.calculate({kind: 'adjust', source: result.text, options: cfg}).text, result.text, 'Complete action idempotence');
  assert.equal(api.preservationAudit(row.source, result.text, cfg).length, 0);
  assert.equal(api.safeComposition(row.source, result.text, cfg), '');
  console.log(JSON.stringify({status: 'passed', revid: row.revid, sourceSha256: row.sourceSha256,
    appliedSha256: sha(result.text), expectedEntries: row.items, columnAdjustments: change.count,
    finalGate: safety.code, calculateCalls: 2, checks: 7}));
  process.exit(0);
}
assert.equal(process.argv.length, 5, 'Supply bundle, immutable JSON cases and fresh output path');
const bundle = path.resolve(process.argv[2]), input = path.resolve(process.argv[3]), output = path.resolve(process.argv[4]);
assert.equal(fs.existsSync(output), false, 'Preserve previous receipts');
const rows = JSON.parse(fs.readFileSync(input, 'utf8')), before = sha(fs.readFileSync(bundle)), results = [];
for (const row of rows) {
  const child = cp.spawnSync(process.execPath, [__filename, '--worker', bundle],
    {input: JSON.stringify(row), encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024});
  let result;
  try { result = JSON.parse(child.stdout); } catch (_) {
    result = {status: child.error?.code === 'ETIMEDOUT' ? 'timeout-not-retried' : 'failed', revid: row.revid,
      sourceSha256: row.sourceSha256, exitCode: child.status, signal: child.signal, error: String(child.error || child.stderr)};
  }
  if (child.status !== 0) result.status = result.status === 'passed' ? 'failed-process' : result.status;
  results.push(result);
}
assert.equal(sha(fs.readFileSync(bundle)), before, 'Executed runtime remains exact');
const report = {kind: 'frozen-accepted-output-current-candidate-structure-regression',
  status: results.every(r => r.status === 'passed') ? 'passed' : 'incomplete', bundleSha256: before,
  inputSha256: sha(fs.readFileSync(input)), cases: results, deadlineMilliseconds: 60000, retries: 0,
  wikipediaWrites: 0, priorResultsPreserved: true};
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status: report.status, cases: results.length,
  passed: results.filter(r => r.status === 'passed').length, bundleSha256: before}));
if (report.status !== 'passed') process.exitCode = 1;
