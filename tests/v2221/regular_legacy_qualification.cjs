'use strict';
// Execute frozen inherited programs twice: original, then exact-site qualified.
// No production function, old test file or historical receipt is replaced.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const metadataPath = path.join(__dirname, 'regular_legacy_qualification_cases.json');
const metadataPin = 'e74be9733fa37e4daf59928ce8abdcb6ef8fd064488d0a71ae26724d730e0410';
const sha = raw => crypto.createHash('sha256').update(raw).digest('hex');
const pin = raw => ({ bytes: Buffer.byteLength(raw), sha256: sha(raw) });
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object' ?
    '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
const suites = {
    writer: 'tests/v221/citation_writer_guards.cjs',
    collector: 'tests/v221/citation_collector_scope.cjs',
    archive: 'tests/v221_integrity/archive_state_activation.cjs',
    biography: 'tests/v221/biography_cases.cjs',
};

function validateMetadata(metadata) {
    assert.equal(metadata.schema, 1);
    assert.equal(metadata.version, '2.22.1');
    assert.deepEqual([metadata.writer.length, metadata.collector.length, metadata.archive.length], [87, 3, 25]);
    assert.equal(metadata.archiveFull.length, 1);
    assert.equal(metadata.biography.length, 2);
    for (const kind of [...Object.keys(suites), 'archiveFull']) {
        const ids = new Set();
        for (const row of metadata[kind]) {
            assert.equal(typeof row.id, 'string');
            assert(!ids.has(row.id), 'Duplicate finite qualification id');
            ids.add(row.id);
            for (const [text, hash] of [['source', 'sourceSha256'], ['expected', 'expectedSha256'], ['allowedOutput', 'allowedOutputSha256']]) {
                assert.equal(typeof row[text], 'string');
                assert.equal(sha(row[text]), row[hash], 'Every literal endpoint has its own exact pin');
            }
            if (kind === 'writer') {
                assert(Array.isArray(row.exactValuePairs));
                const fields = new Set();
                for (const pair of row.exactValuePairs) {
                    assert(Number.isInteger(pair.fieldIndex) && pair.fieldIndex >= 0 && !fields.has(pair.fieldIndex));
                    fields.add(pair.fieldIndex);
                    assert.equal(typeof pair.before, 'string');
                    assert.equal(typeof pair.after, 'string');
                    assert.notEqual(pair.before, pair.after);
                }
            }
            if (kind === 'biography') {
                assert(['map-108-alias-filled-morte_país', 'map-108-alias-filled-paisdamorte'].includes(row.id));
                assert.equal(row.optionsSha256, '492f5379f2f7604f6f6deb1be65d603842f77939a892eaec66f98a03a7356a74');
                assert.equal(row.owner, 'Info/Futebolista'); assert.equal(row.from, 'cidade_morte'); assert.equal(row.to, 'morte_cidade');
                assert.equal(row.id, 'map-108-alias-filled-' + row.countryKey); assert.equal(row.countryValue, 'Outro');
                assert.equal(row.expected, row.source); assert.equal(row.allowedOutput, row.source.replace('|cidade_morte=', '|morte_cidade='));
                assert.equal(row.fieldValue, 'Valor preservado<ref name="A">Fonte.</ref>');
                assert.equal(row.nativeConsumer.native.title, 'Predefinição:Info/Futebolista');
                assert.equal(row.nativeConsumer.native.revision, 73340185);
                assert.equal(row.nativeConsumer.native.sha256, '9a2ef626202052d72c6f0348f4d53026095592e4b7aadc2eac1f4d35b4ac4524');
                assert.deepEqual(row.nativeConsumer.reader.conditions, { absentKeys: ['morte_local'], selectedNonempty: [['morte_país', 'paisdamorte']] });
                assert.equal(row.requiresOriginalSourceBoundProof, true); assert.equal(row.requiresOneExactKeyEdit, true); assert.equal(row.allValuesMustRemainExact, true);
            }
        }
    }
    assert.deepEqual(metadata.explicitlyNotQualified, ['tests/v221_integrity/frozen_runtime_guards.cjs']);
    return metadata;
}

function loadMetadata() {
    const raw = fs.readFileSync(metadataPath);
    assert.equal(sha(raw), metadataPin, 'The reviewed finite qualification metadata remains frozen');
    return validateMetadata(JSON.parse(raw));
}

function exactRow(metadata, kind, id, source, expected, output) {
    const row = metadata[kind].find(item => item.id === id);
    if (!row || row.source !== source || row.expected !== expected || row.allowedOutput !== output) return null;
    if (sha(source) !== row.sourceSha256 || sha(expected) !== row.expectedSha256 || sha(output) !== row.allowedOutputSha256) return null;
    return row;
}

function writerNativeProof(api, row) {
    if (api.version !== '2.22.1') return false;
    const prefix = 'Texto de controle.<ref>', suffix = '</ref>\n\n{{Referências}}\n';
    if (!row.source.startsWith(prefix) || !row.source.endsWith(suffix) || !row.allowedOutput.startsWith(prefix) || !row.allowedOutput.endsWith(suffix)) return false;
    const before = row.source.slice(prefix.length, -suffix.length), after = row.allowedOutput.slice(prefix.length, -suffix.length);
    const context = api.v218CitationNativeContext(before), reader = context && api.v2215CitationReader(context);
    if (!reader || context.profile.title !== row.reader.title || reader.module !== row.reader.module || reader.oldid !== row.reader.revision) return false;
    const left = api.v222Fields(before), right = api.v222Fields(after);
    if (!left || !right || left.header !== right.header || left.fields.length !== right.fields.length) return false;
    // Every changed value must match its reviewed literal pair. There is no
    // whitespace normalization or general margin exception in this predicate.
    for (let index = 0; index < left.fields.length; index++) {
        const old = left.fields[index], next = right.fields[index];
        if (old.key !== next.key) {
            const from = api.v222CitationRoles(old.key, reader), to = api.v222CitationRoles(next.key, reader);
            if (!from.length || JSON.stringify(from) !== JSON.stringify(to)) return false;
        }
        if (old.value !== next.value && !row.exactValuePairs.some(pair =>
            pair.fieldIndex === index && pair.before === old.value && pair.after === next.value)) return false;
    }
    for (const proof of row.nativeValueRoleProofs || []) {
        const old = left.fields[proof.fieldIndex], next = right.fields[proof.fieldIndex];
        if (!old || !next || old.key !== proof.key || next.key !== proof.key ||
            JSON.stringify(api.v222CitationRoles(proof.key, reader)) !== JSON.stringify([proof.role])) return false;
    }
    return true;
}

function qualifyWriter(metadata, row, source, expected, result, gate, api) {
    const permitted = exactRow(metadata, 'writer', row.id, source, expected, result.text);
    if (!permitted || gate.accepted !== true || result.preservation?.length || !writerNativeProof(api, permitted)) return false;
    return Array.isArray(result.changes) && result.changes.every(change => permitted.allowedChangeIds.includes(change.id));
}

function qualifyCollector(metadata, row, plan, result, gate, applied, api) {
    const permitted = exactRow(metadata, 'collector', row.id, row.source, row.source, applied);
    return !!permitted && api.version === '2.22.1' && gate.accepted === true && !result.preservation?.length &&
        row.expectation === 'preserve-without-unconfirmed-rendering' && plan.text === row.source &&
        Array.isArray(plan.edits) && plan.edits.length === 0 && result.text === applied &&
        !/\{\{Referências(?:[|}])/.test(applied);
}

function qualifyArchive(metadata, source, expected, output, label, api) {
    const candidate = metadata.archive.find(row => row.sourceSha256 === sha(source));
    const row = candidate && exactRow(metadata, 'archive', candidate.id, source, expected, output);
    if (!row || api.version !== '2.22.1' || label !== row.label || output !== source) return false;
    const context = api.v218CitationNativeContext(source);
    if (!context || !context.profile.accepted.includes(row.nativeField)) return false;
    // The original native field is retained, rather than claimed equivalent to
    // DeadURL. The pinned 2.21.7 native-preservation producer proves this branch.
    return /\|url-status=dead\|acessourl=/.test(source) &&
        context.profile.dependencies?.some(item => item.title === 'Módulo:Citação/CS1' && item.oldid === 72936771);
}

function qualifyArchiveFull(metadata, source, expected, result, label, api) {
    const candidate = metadata.archiveFull.find(row => row.sourceSha256 === sha(source));
    const row = candidate && exactRow(metadata, 'archiveFull', candidate.id, source, expected, result.text);
    if (!row || api.version !== '2.22.1' || label !== row.label || result.preservation?.length ||
        api.v219AutomaticResultSafety(source, result).accepted !== true) return false;
    const prefix = 'Texto.<ref>', suffix = '</ref>\n\n{{Referências}}\n';
    if (![source, expected, result.text].every(text => text.startsWith(prefix) && text.endsWith(suffix))) return false;
    const cfg = { ...api.defaults, namespaceNumber: 0, contentModel: 'wikitext',
        pageTitle: 'Teste de referências', v216CalendarUTC: '2026-10-23' };
    const plan = api.v221CitationPlan(source, cfg);
    if (plan.text !== expected || api.v221CitationPlanProof(source, expected, plan, cfg) !== true ||
        api.v221CitationMigrationSafe(source, expected, cfg) !== true) return false;
    const before = expected.slice(prefix.length, -suffix.length), after = result.text.slice(prefix.length, -suffix.length);
    const context = api.v218CitationNativeContext(before), reader = context && api.v2215CitationReader(context);
    if (!reader || context.profile.title !== row.reader.title || reader.module !== row.reader.module || reader.oldid !== row.reader.revision) return false;
    const left = api.v222Fields(before), right = api.v222Fields(after);
    if (!left || !right || left.header !== right.header || left.fields.length !== right.fields.length) return false;
    let changed = 0;
    for (let index = 0; index < left.fields.length; index++) {
        const old = left.fields[index], next = right.fields[index];
        if (old.value !== next.value) return false;
        if (old.key === next.key) continue;
        const pair = row.exactKeyPairs.find(item => item.fieldIndex === index && item.before === old.key && item.after === next.key);
        if (!pair || JSON.stringify(api.v222CitationRoles(old.key, reader)) !== JSON.stringify([pair.role]) ||
            JSON.stringify(api.v222CitationRoles(next.key, reader)) !== JSON.stringify([pair.role])) return false;
        changed++;
    }
    return changed === row.exactKeyPairs.length && row.allValuesMustRemainExact === true && row.originalStateProducerProofMustPass === true;
}

function qualifyBiography(metadata, id, source, expected, plan, options, api) {
    const row = exactRow(metadata, 'biography', id, source, expected, plan.text);
    if (!row || api.version !== '2.22.1' || sha(canonical(options)) !== row.optionsSha256 ||
        !Array.isArray(plan.edits) || plan.edits.length !== 1) return false;
    const current = api.v222Catalog().focusedInfoboxes.nativeReferenceConsumers.filter(item =>
        item.owner === row.owner && item.key === row.to && item.sourceKeys.includes(row.from));
    if (current.length !== 1 || canonical(current[0]) !== canonical(row.nativeConsumer)) return false;
    const box = api.v221BioPrincipal(source), parsed = box && api.v2221InfoboxRead(box.raw),
        field = box?.fields.find(item => item.key === row.from);
    if (!box || !parsed || box.name !== row.owner || !field || field.value !== row.fieldValue ||
        !api.v2221FocusedReferenceConsumer(current[0], box, field, parsed)) return false;
    const mapping = api.V221_INFOBOX_MAPPINGS.filter(item => item.owner === row.owner && item.from === row.from && item.to === row.to);
    if (mapping.length !== 1 || !mapping[0].aliases.includes(row.countryKey)) return false;
    const native = api.v2221FocusedNativeMapping(source, options, box, mapping[0]);
    if (canonical(native.aliases) !== canonical(row.nativeConsumer.aliases) || native.aliases.includes(row.countryKey)) return false;
    const edit = plan.edits[0], at = source.indexOf('|cidade_morte=') + 1;
    if (edit.ruleId !== 'v221InfoboxField' || edit.start !== at || edit.end !== at + row.from.length || edit.text !== row.to ||
        edit.proof?.owner !== row.owner || edit.proof.from !== row.from || edit.proof.to !== row.to || edit.proof.value !== row.fieldValue ||
        !api.v221BiographyProof(source, plan.text, plan, options) || api.v221BiographyProof(source, plan.text + 'X', plan, options)) return false;
    const forged = structuredClone(plan); forged.edits[0].proof.owner = 'Other';
    return api.v221BiographyProof(source, plan.text, forged, options) === false;
}

function replaceOnce(source, before, after) {
    assert.equal(source.split(before).length, 2, 'One exact frozen assertion site is required');
    return source.replace(before, after);
}

function patchSuite(kind, source, metadata) {
    assert.deepEqual(pin(source), metadata.suitePins[suites[kind]], 'Only the exact original inherited program may be qualified');
    if (kind === 'writer') return replaceOnce(source,
        "if(result.text!==expected){record.actual=result.text;throw Error('independent literal endpoint differed');}",
        "if(result.text!==expected){record.actual=result.text;if(!__qualification.writer(row,source,expected,result,gate,api))throw Error('independent literal endpoint differed');record.exactSiteQualified=true;}");
    if (kind === 'collector') return replaceOnce(source,
        "if(plan.text!==row.source||applied!==row.source)record.failure='unconfirmed-infobox-only-reference-was-applied';",
        "if((plan.text!==row.source||applied!==row.source)&&!__qualification.collector(row,plan,result,gate,applied,api))record.failure='unconfirmed-infobox-only-reference-was-applied';");
    if (kind === 'archive') {
        const inspected = replaceOnce(source, 'eq(plan.text,expected,label);',
            'if(plan.text!==expected&&__qualification.archive(source,expected,plan.text,label,api))checks++;else eq(plan.text,expected,label);');
        return replaceOnce(inspected,
            "eq(result.text,planned.text,'Full calculation cannot reactivate a declined native transition');",
            "if(result.text!==planned.text&&__qualification.archiveFull(source,planned.text,result,'Full calculation cannot reactivate a declined native transition',api))checks++;else eq(result.text,planned.text,'Full calculation cannot reactivate a declined native transition');");
    }
    if (kind === 'biography') return replaceOnce(source,
        'try{p=a.v221BiographyPlan(source,c);assert.equal(p.text,expected,id);report.checks++;',
        'try{p=a.v221BiographyPlan(source,c);assert.equal(p.text,p.text!==expected&&__qualification.biography(id,source,expected,p,c,a)?p.text:expected,id);report.checks++;');
    throw Error('This inherited suite has no approved qualification');
}

function executeNativeRealm(program, bindings, filename) {
    return vm.compileFunction(program, Object.keys(bindings), { filename })(...Object.values(bindings));
}

const biographyAPIs = new Map();
function biographyAPI(runtime, metadata) {
    if (biographyAPIs.has(runtime)) return biographyAPIs.get(runtime);
    const harness = path.join(root, 'tests/v221/biography_harness.cjs'), bridge = path.join(root, 'tests/v2215/legacy_minified_bindings.cjs');
    for (const file of [harness, bridge]) assert.deepEqual(pin(fs.readFileSync(file)), metadata.biographyLoaderPins[path.relative(root, file).split(path.sep).join('/')]);
    const original = fs.readFileSync(runtime, 'utf8');
    assert(original.includes('function v221BiographyPlan('), 'The full real runtime must contain its own producer; source injection is forbidden');
    const dataFile=runtime.replace(/(?:_completo)?\.js$/,"_dados.js"), oldData=require.cache[dataFile];
    const compile = Module.prototype._compile, oldHarness = require.cache[harness], oldBridge = require.cache[bridge],
        beforeExit = new Set(process.listeners('exit')), oldCurrent = process.env.REVISAWIKI_CURRENT_CORE, oldBundle = process.env.REVISAWIKI_BUNDLE;
    let api;
    try {
        process.env.REVISAWIKI_CURRENT_CORE = runtime; process.env.REVISAWIKI_BUNDLE = runtime;
        delete require.cache[dataFile]; delete require.cache[harness]; delete require.cache[bridge]; require(bridge);
        api = require(harness);
        assert.equal(api.version, '2.22.1'); assert.equal(api.__biographyTestHarness.fragmentInjected, false);
        assert.equal(api.__biographyTestHarness.runtimeSha256, sha(original));
    } finally {
        Module.prototype._compile = compile;
        if(oldData)require.cache[dataFile]=oldData;else delete require.cache[dataFile];
        for (const listener of process.listeners('exit')) if (!beforeExit.has(listener)) process.removeListener('exit', listener);
        if (oldHarness) require.cache[harness] = oldHarness; else delete require.cache[harness];
        if (oldBridge) require.cache[bridge] = oldBridge; else delete require.cache[bridge];
        if (oldCurrent === undefined) delete process.env.REVISAWIKI_CURRENT_CORE; else process.env.REVISAWIKI_CURRENT_CORE = oldCurrent;
        if (oldBundle === undefined) delete process.env.REVISAWIKI_BUNDLE; else process.env.REVISAWIKI_BUNDLE = oldBundle;
    }
    biographyAPIs.set(runtime, api); return api;
}

function runSuite(kind, runtime, metadata, qualified, writerReportPath) {
    const filename = path.join(root, suites[kind]), original = fs.readFileSync(filename, 'utf8');
    assert.deepEqual(pin(original), metadata.suitePins[suites[kind]]);
    const program = qualified ? patchSuite(kind, original, metadata) : original;
    const nativeRequire = Module.createRequire(filename), localModule = { exports: {}, filename }, output = [];
    function localRequire(name) {
        if (kind === 'biography' && name === './biography_harness.cjs') {
            return biographyAPI(runtime, metadata);
        }
        return nativeRequire(name);
    }
    Object.assign(localRequire, nativeRequire);
    localRequire.main = localModule;
    const localProcess = Object.create(process);
    localProcess.argv = [process.execPath, filename, runtime];
    localProcess.env = { ...process.env, REVISAWIKI_V221_BUNDLE: runtime };
    delete localProcess.env.REVISAWIKI_TEST_RECEIPT;
    if (writerReportPath) localProcess.env.REVISAWIKI_CITATION_WRITER_REPORT = writerReportPath;
    else delete localProcess.env.REVISAWIKI_CITATION_WRITER_REPORT;
    if (kind === 'biography' && writerReportPath) localProcess.env.REVISAWIKI_BIO_REPORT = writerReportPath;
    else delete localProcess.env.REVISAWIKI_BIO_REPORT;
    localProcess.exitCode = 0;
    Object.defineProperty(localProcess, 'stdout', { value: { write(text) { output.push(String(text)); return true; } } });
    const qualifications = [], hooks = {
        writer(...args) { const accepted = qualifyWriter(metadata, ...args); if (accepted) qualifications.push(args[0].id); return accepted; },
        collector(...args) { const accepted = qualifyCollector(metadata, ...args); if (accepted) qualifications.push(args[0].id); return accepted; },
        archive(...args) { const accepted = qualifyArchive(metadata, ...args); if (accepted) qualifications.push(metadata.archive.find(row => row.source === args[0]).id); return accepted; },
        archiveFull(...args) { const accepted = qualifyArchiveFull(metadata, ...args); if (accepted) qualifications.push(metadata.archiveFull.find(row => row.source === args[0]).id); return accepted; },
        biography(...args) { const accepted = qualifyBiography(metadata, ...args); if (accepted) qualifications.push(args[0]); return accepted; },
    };
    let error = null;
    try {
        executeNativeRealm(program, { require: localRequire, module: localModule, exports: localModule.exports,
            __filename: filename, __dirname: path.dirname(filename), process: localProcess,
            console: { log(...args) { output.push(args.join(' ')); }, error(...args) { output.push(args.join(' ')); } },
            __qualification: hooks }, filename);
    } catch (caught) { error = String(caught.stack || caught); }
    let report = null;
    if (writerReportPath && fs.existsSync(writerReportPath)) report = JSON.parse(fs.readFileSync(writerReportPath));
    else for (const text of [...output].reverse()) { try { report = JSON.parse(text); break; } catch {} }
    if (kind === 'biography') try {
        assert.equal(report.kind, 'v221-biography-finite-contracts');
        assert.equal(report.runtime.runtimeSha256, sha(fs.readFileSync(runtime))); assert.equal(report.runtime.fragmentInjected, false);
        assert.equal(report.cases.length, 4009); assert.equal(new Set(report.cases.map(row => row.id)).size, 4009);
        assert.equal(report.checks, qualified ? 13765 : 13759);
        assert.deepEqual(report.failures.map(row => row.id).sort(), qualified ? [] : metadata.biography.map(row => row.id).sort());
        if (qualified) assert.deepEqual(qualifications.slice().sort(), metadata.biography.map(row => row.id).sort());
    } catch (caught) { error ||= String(caught.stack || caught); }
    assert.deepEqual(pin(fs.readFileSync(filename)), metadata.suitePins[suites[kind]], 'The original source stays unchanged');
    return { kind, mode: qualified ? 'finite-exact-site-qualification' : 'original-unchanged',
        sourceSha256: sha(original), compiledProgramSha256: sha(program),
        status: !error && !localProcess.exitCode ? 'passed' : 'failed', exitCode: localProcess.exitCode || (error ? 1 : 0),
        error, qualifiedIds: qualifications, stdout: output.join('\n'), report,
        originalTestFileModified: false, sameNodeRealm: true };
}

function verifyRuntime(directory, manifestPath) {
    const manifestRaw = fs.readFileSync(manifestPath), manifest = JSON.parse(manifestRaw);
    assert.equal(manifest.version, '2.22.1');
    for (const [name, expected] of Object.entries(manifest.files)) assert.deepEqual(pin(fs.readFileSync(path.join(directory, name))), expected, 'Pinned current runtime: ' + name);
    for (const name of ['RevisaWiki_v2_22_1.js', 'RevisaWiki_v2_22_1_completo.js']) assert(manifest.files[name], 'Both real bundles must be pinned');
    return { manifest, manifestSha256: sha(manifestRaw) };
}

function main() {
    const directory = path.resolve(process.env.REVISAWIKI_RELEASE_DIR || path.join(root, 'dist/2.22.1'));
    const manifestPath = path.resolve(process.env.REVISAWIKI_RELEASE_MANIFEST || path.join(root, 'tests/expected_release_v2221.json'));
    assert(process.argv[2], 'Pass a new private output directory');
    const output = path.resolve(process.argv[2]);
    assert(!fs.existsSync(output), 'Never overwrite original or prior qualification reports');
    const metadata = loadMetadata(), runtime = verifyRuntime(directory, manifestPath);
    for (const [file, expected] of Object.entries(metadata.nativeSourcePins)) assert.deepEqual(pin(fs.readFileSync(path.join(root, file))), expected, 'The reviewed native contract source remains exact');
    fs.mkdirSync(output, { recursive: true });
    const receipt = { kind: 'v2221-regular-legacy-finite-qualification', version: '2.22.1', status: 'running',
        manifestSha256: runtime.manifestSha256, metadataSha256: metadataPin, runnerSha256: sha(fs.readFileSync(__filename)),
        originalTasks: [], qualifiedTasks: [], rawHistoricalStatusesRewritten: false,
        productionCodeModified: false, originalTestFilesModified: false, preservationGuardsModified: false,
        frozenRuntimeGuardsQualified: false, networkRequests: 0, wikipediaWrites: 0 };
    for (const bundle of ['RevisaWiki_v2_22_1.js', 'RevisaWiki_v2_22_1_completo.js']) {
        const file = path.join(directory, bundle);
        for (const kind of Object.keys(suites)) {
            const stem = kind + (bundle.includes('_completo') ? '-complete' : '-core');
            const raw = runSuite(kind, file, metadata, false, ['writer', 'biography'].includes(kind) ? path.join(output, stem + '.raw-full-report.json') : null);
            fs.writeFileSync(path.join(output, stem + '.raw.json'), JSON.stringify(raw, null, 2) + '\n', { flag: 'wx' });
            receipt.originalTasks.push({ kind, bundle, status: raw.status, error: raw.error, sourceSha256: raw.sourceSha256, runtimeSha256: runtime.manifest.files[bundle].sha256 });
            const result = runSuite(kind, file, metadata, true, ['writer', 'biography'].includes(kind) ? path.join(output, stem + '.qualified-full-report.json') : null);
            fs.writeFileSync(path.join(output, stem + '.qualified.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
            receipt.qualifiedTasks.push({ kind, bundle, status: result.status, error: result.error,
                checks: result.report?.checks ?? null, calculations: result.report?.actualCalculateCalls ?? result.report?.calculations ?? null,
                ...(kind === 'biography' ? { cases: result.report?.cases.length ?? null } : {}),
                qualifiedIds: result.qualifiedIds, subsequentOriginalAssertionsExecuted: result.status === 'passed' });
        }
    }
    verifyRuntime(directory, manifestPath);
    receipt.status = receipt.qualifiedTasks.every(row => row.status === 'passed') ? 'passed' : 'failed';
    fs.writeFileSync(path.join(output, 'SUMMARY.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ status: receipt.status, originalStatuses: receipt.originalTasks.map(row => row.status), qualifiedStatuses: receipt.qualifiedTasks.map(row => row.status) }));
    if (receipt.status !== 'passed') process.exitCode = 1;
}

module.exports = { sha, pin, validateMetadata, loadMetadata, exactRow, writerNativeProof,
    qualifyWriter, qualifyCollector, qualifyArchive, qualifyArchiveFull, qualifyBiography, patchSuite, executeNativeRealm, runSuite, verifyRuntime };
if (require.main === module) main();
