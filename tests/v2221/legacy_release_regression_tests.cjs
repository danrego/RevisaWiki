'use strict';
// Synthetic receipt-policy tests; no product, browser or original suite runs.
const assert = require('node:assert/strict');
const { assess, checkOptionalBiography, rawSuites } = require('./legacy_release_regression.cjs');
const metadata = require('./regular_legacy_qualification.cjs').loadMetadata();
const clone = row => JSON.parse(JSON.stringify(row));
const bundles = ['RevisaWiki_v2_22_1.js', 'RevisaWiki_v2_22_1_completo.js'];
const manifest = { files: Object.fromEntries(bundles.map((name, i) => [name, { sha256: String(i).repeat(64) }])) };
const paths = { writer: 'tests/v221/citation_writer_guards.cjs', collector: 'tests/v221/citation_collector_scope.cjs',
    archive: 'tests/v221_integrity/archive_state_activation.cjs', biography: 'tests/v221/biography_cases.cjs' };
const raw = { kind: 'current-release-inherited-behavioral-regression', version: '2.22.1',
    status: 'failed', historicalStatusesRewritten: false, runtimeManifestSha256: 'manifest-pin', tasks: [] };
const qualified = { status: 'passed', manifestSha256: 'manifest-pin', frozenRuntimeGuardsQualified: false,
    preservationGuardsModified: false, rawHistoricalStatusesRewritten: false, originalTasks: [], qualifiedTasks: [] };
for (const bundle of bundles) {
    for (const [kind, suite] of Object.entries(paths)) {
        const sourceSha256 = metadata.suitePins[suite].sha256, runtimeSha256 = manifest.files[bundle].sha256;
        raw.tasks.push({ suite, bundle, status: 'failed', exitCode: 1, testUnchanged: true, testSha256: sourceSha256, runtimeSha256 });
        qualified.originalTasks.push({ kind, bundle, status: 'failed', sourceSha256, runtimeSha256 });
        qualified.qualifiedTasks.push({ kind, bundle, status: 'passed', subsequentOriginalAssertionsExecuted: true,
            qualifiedIds: kind === 'biography' ? metadata.biography.map(row => row.id) : [metadata[kind][0].id],
            ...(kind === 'biography' ? { checks: 13765, cases: 4009 } : {}) });
    }
    for (const suite of rawSuites.filter(suite => !Object.values(paths).includes(suite))) raw.tasks.push({ suite, bundle,
        status: 'passed', exitCode: 0, testUnchanged: true, runtimeSha256: manifest.files[bundle].sha256 });
}
let checks = 0;
function yes(value, message) { checks++; assert(value, message); }
function failed(changeRaw, changeQualified) {
    const a = clone(raw), b = clone(qualified); changeRaw?.(a); changeQualified?.(b);
    return assess(a, b, metadata, manifest, 'manifest-pin').status === 'failed';
}
const result = assess(raw, qualified, metadata, manifest, 'manifest-pin');
yes(result.status === 'passed-current-contract' && result.rawStatus === 'failed', 'An exact current-contract pass preserves the raw failure status');
yes(result.rawTasksPassingUnchanged === 24 && result.rawFailedTasksExactlyQualified === 8, 'Raw and qualified task counts remain separate');
yes(failed(a => { const row = a.tasks.find(row => row.suite === 'tests/v221_integrity/frozen_runtime_guards.cjs'); row.status = 'failed'; row.exitCode = 1; }), 'A real guard failure has no qualification');
yes(failed(a => { a.tasks[0].status = 'external-timeout'; }), 'An interrupted original suite stays failed');
yes(failed(a => { a.tasks[0].testUnchanged = false; }), 'A changed original test stays failed');
yes(failed(a => { a.tasks[0].testSha256 = 'unknown-source'; }), 'An unknown source has no qualification');
yes(failed(null, b => { b.qualifiedTasks[0].qualifiedIds = ['unlisted']; }), 'An unlisted case id is refused');
yes(failed(null, b => { b.qualifiedTasks[0].status = 'failed'; }), 'An unexpected remaining assertion failure stays failed');
yes(failed(null, b => { b.qualifiedTasks[0].subsequentOriginalAssertionsExecuted = false; }), 'An incomplete replay cannot pass');
yes(failed(null, b => { b.qualifiedTasks[0].qualifiedIds = []; }), 'A raw failure cannot be covered by an empty qualification');
yes(failed(a => { a.tasks.find(row => row.status === 'passed').exitCode = 1; }), 'A supposedly passing task with a failure exit code is refused');
yes(failed(null, b => { b.originalTasks[0].status = 'passed'; }), 'A raw observer failure cannot receive a preference qualification when the original program passed');
checks++; assert.throws(() => { const a = clone(raw); a.tasks[3].suite = 'fictional-unexpected-suite'; assess(a, qualified, metadata, manifest, 'manifest-pin'); });
checks++; assert.throws(() => { const a = clone(raw); a.tasks[3] = clone(a.tasks[4]); assess(a, qualified, metadata, manifest, 'manifest-pin'); });
yes(failed(null, b => { b.originalTasks[0] = clone(b.originalTasks[1]); }), 'Missing and duplicate original qualification programs cannot pass');
yes(failed(null, b => { b.qualifiedTasks.find(row => row.kind === 'biography').qualifiedIds.pop(); }), 'Both finite biography source ids are required');
yes(failed(null, b => { b.qualifiedTasks.find(row => row.kind === 'biography').checks--; }), 'Every subsequent original biography assertion must execute');
yes(failed(null, b => { b.qualifiedTasks.find(row => row.kind === 'biography').cases--; }), 'The complete biography case inventory must remain present');
checks++; assert.throws(() => assess({ ...raw, runtimeManifestSha256: 'old' }, qualified, metadata, manifest, 'manifest-pin'));
checks++; assert.throws(() => assess(raw, { ...qualified, frozenRuntimeGuardsQualified: true }, metadata, manifest, 'manifest-pin'));
const optional = checkOptionalBiography([], manifest);
yes(optional.finalHeavyBiographyPassClaimed === false && optional.status === 'not-included-run-separately', 'Missing heavy BIO reports do not become a pass');
console.log(JSON.stringify({ suite: 'legacy-release-coordinator-policy', checks, passed: true,
    productRuntimeExecuted: false, originalSuitesExecuted: false, wikipediaWrites: 0 }));
