'use strict';
// Portable synthetic regression entry point. No network, account, or corpus input.
// Usage: node tests/v221_integrity/citation_guards.cjs [runtime-directory]
// REVISAWIKI_RUNTIME_DIR may also select an isolated saved distribution.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const directory = path.resolve(
    process.argv[2] || process.env.REVISAWIKI_RUNTIME_DIR ||
    path.join(__dirname, '../../dist/2.21.0')
);
const results = [];
for (const [distribution, filename] of [
    ['core', 'RevisaWiki_v2_21_0.js'],
    ['full', 'RevisaWiki_v2_21_0_completo.js']
]) {
    const bundle = path.join(directory, filename);
    assert(fs.existsSync(bundle), 'The selected distribution is missing');
    for (const [suite, runnerName] of [
        ['citation-values', 'frozen_runtime_guards.cjs'],
        ['archive-state-activation', 'archive_state_activation.cjs'],
        ['native-metadata-contributions', 'metadata_contributions.cjs']
    ]) {
    const runner = path.join(__dirname, runnerName);
    const result = spawnSync(process.execPath, [runner, bundle], {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr || 'The citation guard matrix failed');
    assert.equal(result.stderr, '', 'The synthetic matrix emitted an unexpected error');
    const receipt = JSON.parse(result.stdout);
    assert.equal(receipt.status, 'passed');
    assert.equal(receipt.unmodifiedDistributionRequired, true);
    assert.equal(receipt.productExportsAltered, false);
    assert.equal(receipt.newWikipediaWrites ?? receipt.wikipediaWrites, 0);
    results.push({ distribution, suite, ...receipt });
    }
}
console.log(JSON.stringify({
    status: 'passed',
    syntheticOnly: true,
    checks: results.reduce((sum, item) => sum + item.checks, 0),
    calculations: results.reduce((sum, item) => sum + item.calculations, 0),
    archiveMatrixCases: results.reduce((sum, item) => sum + (item.archiveMatrixCases || 0), 0),
    bareReferenceCases: results.reduce((sum, item) => sum + (item.bareReferenceCases || 0), 0),
    stateAliasCases: results.reduce((sum, item) => sum + (item.stateAliasCases || 0), 0),
    archiveStateActivationCases: results.filter(item => item.suite === 'archive-state-activation').reduce((sum, item) => sum + (item.matrixCases || 0), 0),
    metadataContributionCases: results.filter(item => item.suite === 'native-metadata-contributions').reduce((sum, item) => sum + (item.matrixCases || 0), 0),
    distributions: results,
    networkRequests: 0,
    wikipediaWrites: 0
}));
