'use strict';
// Current-contract coordinator. Original failures and exact qualification
// receipts remain separate; no production safety guard is disabled.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict');
const policy = require('./regular_legacy_qualification.cjs');
const root = path.resolve(__dirname, '../..');
const rawRunner = path.join(__dirname, 'legacy_regression.cjs');
const qualifier = path.join(__dirname, 'regular_legacy_qualification.cjs');
const metadataFile = path.join(__dirname, 'regular_legacy_qualification_cases.json');
const supported = new Map([
    ['tests/v221/citation_writer_guards.cjs', 'writer'],
    ['tests/v221/citation_collector_scope.cjs', 'collector'],
    ['tests/v221_integrity/archive_state_activation.cjs', 'archive'],
    ['tests/v221/biography_cases.cjs', 'biography'],
]);
const bundles = ['RevisaWiki_v2_22_1.js', 'RevisaWiki_v2_22_1_completo.js'];
const rawSuites = [
    'tests/v221/citation_writer_guards.cjs', 'tests/v221/citation_editions.cjs',
    'tests/v221/citation_collector_prerequisite.cjs', 'tests/v221/citation_collector_end_to_end.cjs',
    'tests/v221/citation_collector_scope.cjs', 'tests/v221/citation_ui_preflight.cjs',
    'tests/v221/biography_cases.cjs', 'tests/v221/biography_ui_preflight.cjs',
    'tests/v221/structure_ui_preflight.cjs', 'tests/v221_integrity/frozen_runtime_guards.cjs',
    'tests/v221_integrity/literal_transfer.cjs', 'tests/v221_integrity/archive_state_activation.cjs',
    'tests/v221_integrity/worker_condition_snapshot.cjs', 'tests/v221_integrity/inline_infobox.cjs',
    'tests/v221_integrity/native_refusal_adapter_controls.cjs', 'tests/v221_integrity/run_current_controls.cjs',
];

function assess(raw, qualified, metadata, manifest, manifestSha256) {
    const unqualified = [], covered = [], passed = [];
    assert.equal(raw.kind, 'current-release-inherited-behavioral-regression');
    assert.equal(raw.version, '2.22.1');
    assert.equal(raw.historicalStatusesRewritten, false);
    assert.equal(raw.runtimeManifestSha256, manifestSha256, 'Raw regression uses the selected runtime manifest');
    assert.equal(qualified.manifestSha256, manifestSha256, 'Exact qualification uses the same manifest');
    assert.equal(raw.tasks.length, 32, 'All original regular legacy tasks must finish');
    assert.equal(qualified.qualifiedTasks.length, 8, 'Every exact qualified suite runs on both bundles');
    assert.equal(qualified.originalTasks.length, 8, 'Every original qualification program runs on both bundles');
    const seen = new Set();
    for (const task of raw.tasks) {
        const id = task.bundle + ':' + task.suite;
        assert(!seen.has(id), 'Duplicate raw task'); seen.add(id);
        assert(bundles.includes(task.bundle), 'Only the two selected real bundles are allowed');
        assert(rawSuites.includes(task.suite), 'Only the complete original regular legacy suite set is allowed');
        assert.equal(task.runtimeSha256, manifest.files[task.bundle].sha256, 'Every raw task is bound to the same runtime bytes');
        if (!task.testUnchanged || !['passed', 'failed'].includes(task.status) || ![0, 1].includes(task.exitCode) ||
            task.status === 'passed' && task.exitCode !== 0 || task.status === 'failed' && task.exitCode !== 1) {
            unqualified.push({ ...task, reason: 'Interrupted, changed, timed-out or unexpected raw task' }); continue;
        }
        if (task.status === 'passed' && task.exitCode === 0) { passed.push(id); continue; }
        const kind = supported.get(task.suite);
        const current = qualified.qualifiedTasks.find(row => row.kind === kind && row.bundle === task.bundle);
        const original = qualified.originalTasks.find(row => row.kind === kind && row.bundle === task.bundle);
        if (!kind || !current || !original || current.status !== 'passed' || current.subsequentOriginalAssertionsExecuted !== true ||
            original.status !== 'failed' ||
            original.sourceSha256 !== task.testSha256 || original.runtimeSha256 !== task.runtimeSha256 ||
            metadata.suitePins[task.suite]?.sha256 !== task.testSha256) {
            unqualified.push({ ...task, reason: 'No complete exact current-contract qualification for this raw failure' }); continue;
        }
        const allowed = new Set([...metadata[kind], ...(kind === 'archive' ? metadata.archiveFull : [])].map(row => row.id));
        if (!current.qualifiedIds.length || new Set(current.qualifiedIds).size !== current.qualifiedIds.length ||
            current.qualifiedIds.some(id => !allowed.has(id))) {
            unqualified.push({ ...task, reason: 'Qualification ids are missing, duplicated or outside the finite reviewed set' }); continue;
        }
        if (kind === 'biography' && (current.checks !== 13765 || current.cases !== 4009 ||
            current.qualifiedIds.length !== 2 || metadata.biography.some(row => !current.qualifiedIds.includes(row.id)))) {
            unqualified.push({ ...task, reason: 'The two exact biography endpoints or all original assertions are incomplete' }); continue;
        }
        covered.push({ id, originalStatus: task.status, exactQualificationStatus: current.status,
            kind, qualifiedIds: current.qualifiedIds, allOtherOriginalAssertionsExecuted: true });
    }
    assert.deepEqual([...seen].sort(), bundles.flatMap(bundle => rawSuites.map(suite => bundle + ':' + suite)).sort(),
        'Every original suite, including frozen runtime guards, must execute on both bundles');
    for (const bundle of bundles) {
        for (const kind of ['writer', 'collector', 'archive', 'biography']) {
            const matches = qualified.qualifiedTasks.filter(row => row.bundle === bundle && row.kind === kind);
            if (matches.length !== 1 || matches[0].status !== 'passed') unqualified.push({ bundle, kind, reason: 'Exact qualification program did not pass completely' });
            if (qualified.originalTasks.filter(row => row.bundle === bundle && row.kind === kind).length !== 1)
                unqualified.push({ bundle, kind, reason: 'Original qualification program is missing or duplicated' });
        }
    }
    if (qualified.status !== 'passed') unqualified.push({ reason: 'The exact qualification aggregate failed' });
    assert.equal(qualified.frozenRuntimeGuardsQualified, false, 'Actual frozen runtime safety failures never receive a waiver');
    assert.equal(qualified.preservationGuardsModified, false);
    assert.equal(qualified.rawHistoricalStatusesRewritten, false);
    return { status: unqualified.length ? 'failed' : 'passed-current-contract', rawStatus: raw.status,
        rawTasksPassingUnchanged: passed.length, rawFailedTasksExactlyQualified: covered.length,
        unqualifiedFailuresRemaining: unqualified.length, covered, unqualified };
}

function checkOptionalBiography(files, manifest) {
    if (!files.length) return { status: 'not-included-run-separately', included: false, finalHeavyBiographyPassClaimed: false, reports: [] };
    const accepted = new Set(bundles.map(name => manifest.files[name].sha256));
    const reports = files.map(filename => {
        const raw = fs.readFileSync(filename), report = JSON.parse(raw);
        assert.equal(report.kind, 'v2221-heavy-biography-exact-stage-diagnostic-qualification');
        assert.equal(report.status, 'passed-with-exact-diagnostic-replacements');
        assert(accepted.has(report.runtimeSha256), 'Optional biography evidence must match an exact current bundle');
        assert.equal(report.allOtherOriginalAssertionsUnchanged, true);
        assert.equal(report.productionCorrectorsReplaced, false);
        assert.equal(report.historicalStatusesRewritten, false);
        assert.equal(report.qualifierSha256, policy.sha(fs.readFileSync(path.join(__dirname, 'biography_whole_legacy_qualification.cjs'))),
            'Optional biography evidence uses the current exact qualifier');
        return { file: path.basename(filename), sha256: policy.sha(raw), runtimeSha256: report.runtimeSha256,
            status: report.status, reexecutedCases: report.reexecutedCases };
    });
    const complete = accepted.size === new Set(reports.map(row => row.runtimeSha256)).size;
    return { status: complete ? 'actual-current-reports-for-both-bundles' : 'partial-current-reports',
        included: true, finalHeavyBiographyPassClaimed: complete, reports };
}

function runChild(script, output, prefix, env) {
    const stdout = fs.openSync(prefix + '.stdout', 'wx'), stderr = fs.openSync(prefix + '.stderr', 'wx');
    let result;
    try { result = cp.spawnSync(process.execPath, [script, output], { cwd: root, env, stdio: ['ignore', stdout, stderr] }); }
    finally { fs.closeSync(stdout); fs.closeSync(stderr); }
    return { exitCode: result.status, signal: result.signal, error: result.error ? String(result.error) : null,
        stdoutSha256: policy.sha(fs.readFileSync(prefix + '.stdout')), stderrSha256: policy.sha(fs.readFileSync(prefix + '.stderr')) };
}

function main() {
    const directory = path.resolve(process.env.REVISAWIKI_RELEASE_DIR || path.join(root, 'dist/2.22.1'));
    const manifestPath = path.resolve(process.env.REVISAWIKI_RELEASE_MANIFEST || path.join(root, 'tests/expected_release_v2221.json'));
    const output = path.resolve(process.argv[2] || path.join(root, 'artifacts/v2221/legacy-release-' + Date.now()));
    assert(!fs.existsSync(output), 'Use a new directory; earlier raw and qualification receipts are immutable');
    const selected = policy.verifyRuntime(directory, manifestPath), metadata = policy.loadMetadata();
    const biographyFiles = JSON.parse(process.env.REVISAWIKI_BIO_QUALIFICATION_REPORTS || '[]');
    assert(Array.isArray(biographyFiles) && biographyFiles.every(file => typeof file === 'string'));
    fs.mkdirSync(output, { recursive: true });
    const receipt = { kind: 'v2221-regular-legacy-release-coordinator', version: '2.22.1', status: 'running',
        runtimeManifestSha256: selected.manifestSha256, coordinatorSha256: policy.sha(fs.readFileSync(__filename)),
        rawRunnerSha256: policy.sha(fs.readFileSync(rawRunner)), qualifierSha256: policy.sha(fs.readFileSync(qualifier)),
        metadataSha256: policy.sha(fs.readFileSync(metadataFile)), phases: [], rawStatusesPreserved: true,
        originalTestFilesModified: false, productGuardsRemovedOrDisabled: false, frozenRuntimeGuardWaivers: 0,
        networkRequests: 0, wikipediaWrites: 0, additionalBrowserRuns: 0, failures: [] };
    try {
        const env = { ...process.env, REVISAWIKI_RELEASE_DIR: directory, REVISAWIKI_RELEASE_MANIFEST: manifestPath };
        receipt.phases.push({ phase: 'unchanged-raw-regression', ...runChild(rawRunner, path.join(output, 'raw'), path.join(output, 'raw-runner'), env) });
        // A raw preference failure is retained while the independent exact
        // qualification is still executed. No unsupported suite is skipped.
        receipt.phases.push({ phase: 'finite-current-contract-qualification', ...runChild(qualifier, path.join(output, 'qualified'), path.join(output, 'qualifier-runner'), env) });
        const rawFile = path.join(output, 'raw/SUMMARY.json'), qualifiedFile = path.join(output, 'qualified/SUMMARY.json');
        const rawBytes = fs.readFileSync(rawFile), qualifiedBytes = fs.readFileSync(qualifiedFile);
        const raw = JSON.parse(rawBytes), qualified = JSON.parse(qualifiedBytes);
        assert.equal(raw.runnerSha256, receipt.rawRunnerSha256);
        assert.equal(qualified.runnerSha256, receipt.qualifierSha256);
        assert.equal(qualified.metadataSha256, receipt.metadataSha256);
        receipt.rawReceipt = { file: 'raw/SUMMARY.json', sha256: policy.sha(rawBytes), status: raw.status };
        receipt.qualificationReceipt = { file: 'qualified/SUMMARY.json', sha256: policy.sha(qualifiedBytes), status: qualified.status };
        receipt.assessment = assess(raw, qualified, metadata, selected.manifest, selected.manifestSha256);
        receipt.heavyBiography = checkOptionalBiography(biographyFiles, selected.manifest);
        policy.verifyRuntime(directory, manifestPath);
        receipt.status = receipt.assessment.status;
        for (const phase of receipt.phases) if (phase.error || phase.signal || ![0, 1].includes(phase.exitCode)) {
            receipt.status = 'failed'; receipt.failures.push('A child program failed to complete normally: ' + phase.phase);
        }
        if (receipt.phases.find(phase => phase.phase === 'finite-current-contract-qualification').exitCode !== 0) {
            receipt.status = 'failed'; receipt.failures.push('The exact qualification process returned a failure exit code');
        }
    } catch (error) { receipt.status = 'failed'; receipt.failures.push(String(error.stack || error)); }
    fs.writeFileSync(path.join(output, 'SUMMARY.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ status: receipt.status, rawStatus: receipt.rawReceipt?.status,
        rawTasksPassingUnchanged: receipt.assessment?.rawTasksPassingUnchanged,
        exactlyQualifiedTasks: receipt.assessment?.rawFailedTasksExactlyQualified,
        unqualifiedFailuresRemaining: receipt.assessment?.unqualifiedFailuresRemaining ?? null,
        heavyBiography: receipt.heavyBiography?.status, failures: receipt.failures }));
    if (receipt.status !== 'passed-current-contract') process.exitCode = 1;
}

module.exports = { assess, checkOptionalBiography, rawSuites };
if (require.main === module) main();
