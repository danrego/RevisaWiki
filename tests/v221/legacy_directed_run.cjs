'use strict';
// Candidate regression uses immutable original leaves and explicit artifact bindings.
// Baseline governance checks keep their original release identity and receive no candidate coverage credit.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const at = arg.indexOf('='); assert.ok(arg.startsWith('--') && at > 2, 'Use --name=value');
  return [arg.slice(2, at), arg.slice(at + 1)];
}));
assert.ok(args.dist && args.output, 'Explicit immutable snapshot and fresh output required');
const dist = path.resolve(args.dist), output = path.resolve(args.output), sha = raw => crypto.createHash('sha256').update(raw).digest('hex');
assert.notEqual(dist, path.join(root, 'dist/2.21.0'), 'Use a frozen snapshot, not a mutable build directory');
fs.mkdirSync(output, {recursive: true}); assert.equal(fs.existsSync(path.join(output, 'SUMMARY.json')), false);
const manifestRaw = fs.readFileSync(path.join(dist, 'MANIFESTO_RUNTIME.json')), manifest = JSON.parse(manifestRaw);
assert.equal(manifest.version, '2.21.0');
const names = ['RevisaWiki_v2_21_0.js', 'RevisaWiki_v2_21_0_completo.js', 'RevisaWiki_v2_21_0_dados.js'];
const pins = names.map(file => ({file, path: path.join(dist, file), ...manifest.files[file]}));
for (const pin of pins) assert.deepEqual({bytes: fs.statSync(pin.path).size, sha256: sha(fs.readFileSync(pin.path))}, {bytes: pin.bytes, sha256: pin.sha256});
const bundles = pins.slice(0, 2).map(pin => pin.path), tasks = [];
const add = (id, file, bundleArgs = bundles, scope = 'candidate-runtime-regression', env = {}) => tasks.push({id, file, bundleArgs, scope, env});
for (const [id, file] of [['compact', 'compact_cases.cjs'], ['approved-scope-registry', 'coverage_registry_cases.cjs'],
  ['legacy-image-contract-derivation', 'bio_legacy_image_governance.cjs'], ['release-demonstration-baseline', 'demonstration_release_cases.cjs']])
  add(id, 'tests/v220/' + file, file === 'demonstration_release_cases.cjs' ? ['dist/2.20.0/RevisaWiki_v2_20_0.js', 'dist/2.20.0/RevisaWiki_v2_20_0_completo.js'] : [], 'immutable-baseline-governance');
add('ui-baseline-fixture-compile', 'tests/v221/legacy_ui_compile.cjs', [], 'immutable-baseline-governance');
for (const [id, file] of [['integration', 'integration_cases.cjs'], ['transport', 'ui_transport_cases.cjs'],
  ['citations', 'citation_cases.cjs'], ['heading-references', 'citation_heading_cases.cjs'], ['whole-action-citations', 'citation_whole_action_cases.cjs'],
  ['adjacent-reference-boundaries', 'citation_adjacent_boundary_cases.cjs'], ['hidden-reference-attribute-boundaries', 'citation_hidden_attribute_cases.cjs'],
  ['double-opening-owner-boundaries', 'citation_double_open_owner_cases.cjs'], ['glued-citation-parameter-boundaries', 'citation_glued_parameter_cases.cjs'],
  ['whole-action-structure', 'structure_whole_action.cjs'], ['legacy-key-value-boundaries', 'structure_legacy_key_boundary.cjs'],
  ['legacy-key-kind-families', 'structure_legacy_key_family.cjs'], ['legacy-key-action-composition', 'structure_key_composition.cjs'],
  ['legacy-key-source-prerequisite', 'structure_key_prerequisite.cjs'], ['structure-campaign', 'structure_campaign.cjs'], ['native-structure', 'structure_native.cjs']])
  add(id, 'tests/v220/' + file);
add('cyclic-context', 'tests/v219/ui_context_serialization_cases.cjs');
for (let index = 0; index < bundles.length; index++) {
  add('structure-unit-' + index, 'tests/v220/structure_repairs.cjs', [bundles[index]]);
  for (const file of ['bio_contracts.cjs', 'bio_generated.cjs', 'bio_whole_actions.cjs', 'bio_campaign.cjs', 'bio_counts.cjs',
    'bio_footer_boundary.cjs', 'bio_website_owners.cjs', 'bio_category_owners.cjs', 'bio_citation_count.cjs', 'bio_image_consumers.cjs',
    'bio_official_label_cases.cjs', 'bio_media_option_boundary.cjs'])
    add('biography-' + index + '-' + file.replace(/\.cjs$/, ''), 'tests/v220/' + file, [], 'candidate-runtime-regression', {REVISAWIKI_BUNDLE: bundles[index]});
}
const requested = args.tasks ? args.tasks.split(',') : tasks.map(task => task.id);
assert.equal(new Set(requested).size, requested.length);
for (const id of requested) assert.ok(tasks.some(task => task.id === id), 'Known original task: ' + id);
const shards = Number(args.shards || 1), shard = Number(args.shard || 0);
assert.ok(Number.isInteger(shards) && shards >= 1 && Number.isInteger(shard) && shard >= 0 && shard < shards);
const selected = tasks.filter(task => requested.includes(task.id)).filter((_, index) => index % shards === shard);
assert.ok(selected.length);
const dependencies = new Map();
function collect(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (/\.(?:cjs|js|json)$/.test(entry.name) && !/results/i.test(entry.name)) dependencies.set(file, sha(fs.readFileSync(file)));
  }
}
collect(path.join(root, 'tests/v220'));
for (const task of tasks) dependencies.set(path.join(root, task.file), sha(fs.readFileSync(path.join(root, task.file))));
const compat = path.join(root, 'tests/v221/legacy_compat.cjs');
dependencies.set(compat, sha(fs.readFileSync(compat)));
const report = {kind: 'immutable-original-220-directed-leaf-regression', version: '2.21.0', status: 'passed', complete: false,
  startedUTC: new Date().toISOString(), runnerSha256: sha(fs.readFileSync(__filename)), manifestSha256: sha(manifestRaw), runtime: pins.map(({path: ignored, ...pin}) => pin),
  shard: {index: shard, count: shards}, selectedTasks: selected.map(task => task.id), tasks: [],
  dependencyPins: Object.fromEntries([...dependencies].map(([file, pin]) => [path.relative(root, file), pin])),
  modifications: 'Original source, cases, expected endpoints and assertions are unchanged. Compatibility records list filename/version/layout bindings.',
  limitations: ['The flattened biography leaves preserve all original leaf assertions and source hashes. The obsolete parent 60-second aggregate suite budget is not a per-article deadline.',
    'Immutable baseline governance does not count as current-candidate functional coverage.', 'Compile-only historic UI checks are not claimed as new browser tests.']};
for (const task of selected) {
  const file = path.join(root, task.file), raw = fs.readFileSync(file), sourcePin = sha(raw),
    stdout = path.join(output, task.id + '.json'), stderr = path.join(output, task.id + '.stderr.txt'), receipt = path.join(output, task.id + '.compat.jsonl'),
    out = fs.openSync(stdout, 'wx'), err = fs.openSync(stderr, 'wx'), started = performance.now();
  let child;
  try {
    const argv = task.scope === 'immutable-baseline-governance' ? [file, ...task.bundleArgs] : [compat, file, ...task.bundleArgs];
    child = cp.spawnSync(process.execPath, argv, {cwd: root, env: {...process.env, ...task.env,
      REVISAWIKI_BUNDLE_DIR: task.scope === 'immutable-baseline-governance' ? path.join(root, 'dist/2.20.0') : dist,
      REVISAWIKI_COMPAT_RECEIPT: receipt}, stdio: ['ignore', out, err], timeout: Number(args['suite-timeout-ms']) || 14400000});
  } finally { fs.closeSync(out); fs.closeSync(err); }
  const row = {id: task.id, scope: task.scope, sourceSha256: sourcePin, status: 'failed',
    milliseconds: performance.now() - started, exitCode: child.status, signal: child.signal,
    stdoutSha256: sha(fs.readFileSync(stdout)), stderrSha256: sha(fs.readFileSync(stderr)),
    compatibilityReceiptSha256: fs.existsSync(receipt) ? sha(fs.readFileSync(receipt)) : null};
  try {
    const value = JSON.parse(fs.readFileSync(stdout, 'utf8'));
    assert.equal(child.status, 0); assert.equal(child.error, undefined); assert.equal(value.status, 'passed');
    assert.ok(!value.failures?.length);
    row.status = 'passed'; row.declaredChecks = typeof value.checks === 'number' ? value.checks : null;
    row.declaredCases = Array.isArray(value.cases) ? value.cases.length : typeof value.cases === 'number' ? value.cases : null;
    row.declaredNetworkRequests = value.networkRequests ?? null; row.declaredWikipediaWrites = value.wikipediaWrites ?? null;
  } catch (error) { row.reason = error.message; report.status = 'failed'; }
  assert.equal(sha(fs.readFileSync(file)), sourcePin, 'An original test source changed');
  for (const pin of pins) assert.equal(sha(fs.readFileSync(pin.path)), pin.sha256, 'The immutable runtime changed');
  report.tasks.push(row);
  fs.writeFileSync(path.join(output, 'PROGRESS.json'), JSON.stringify({...report, status: 'running', partialStatus: report.status}, null, 2) + '\n');
  console.log(JSON.stringify({task: row.id, scope: row.scope, status: row.status, checks: row.declaredChecks}));
}
for (const [file, pin] of dependencies) assert.equal(sha(fs.readFileSync(file)), pin, 'An original dependency changed');
assert.equal(sha(fs.readFileSync(__filename)), report.runnerSha256, 'The driver changed during execution');
report.complete = true; report.finishedUTC = new Date().toISOString();
fs.writeFileSync(path.join(output, 'SUMMARY.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status: report.status, tasks: report.tasks.length}));
if (report.status !== 'passed') process.exitCode = 1;
