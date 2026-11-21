'use strict';
// These tests exercise only the finite qualification policy with fictional data.
// Product behavior is tested separately on both exact manifest-pinned bundles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const q = require('./regular_legacy_qualification.cjs');
const metadata = q.loadMetadata(), clone = value => JSON.parse(JSON.stringify(value));
let checks = 0;
function yes(value, label) { checks++; assert(value, label); }
function no(value, label) { yes(!value, label); }
function throws(fn, label) { checks++; assert.throws(fn, label); }

const sample = metadata.writer.find(row => row.id === 'native-accepted-aliases-stay');
const roles = { 'editor-last': ['EditorList-Last:1'], 'editor-sobrenome': ['EditorList-Last:1'],
    'editor-first': ['EditorList-First:1'], 'editor-nome': ['EditorList-First:1'],
    'editor-nome1': ['EditorList-First:1'], 'chapter-url': ['ChapterURL'], 'capítulourl': ['ChapterURL'],
    chapter: ['Chapter'], 'capítulo': ['Chapter'] };
const api = {
    version: '2.22.1',
    v218CitationNativeContext() { return { profile: { title: 'Citar livro', accepted: ['url-status'],
        dependencies: [{ title: 'Módulo:Citação/CS1', oldid: 72936771 }] } }; },
    v2215CitationReader() { return { module: 'Módulo:Citar livro', oldid: 49448102 }; },
    v222CitationRoles(key) { return roles[key] || []; },
    v222Fields(text) {
        const parts = text.slice(2, -2).split('|');
        return { header: parts[0], fields: parts.slice(1).map(part => {
            const equal = part.indexOf('=');
            return { key: part.slice(0, equal), value: part.slice(equal + 1) };
        }) };
    },
};
const result = { text: sample.allowedOutput, preservation: [], changes: [{ id: 'v221Repair' }] };
const gate = { accepted: true };
const writer = (data = metadata, row = { id: sample.id }, source = sample.source,
    expected = sample.expected, current = result, safety = gate, engine = api) =>
    q.qualifyWriter(data, row, source, expected, current, safety, engine);
yes(writer(), 'The exact fictional source/old expectation/new endpoint and native roles qualify');
no(writer(metadata, { id: 'unknown-case' }), 'An unlisted id does not qualify');
no(writer(metadata, { id: sample.id }, sample.source + ' '), 'Even a whitespace source mutation is refused');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected + ' '), 'An altered old endpoint is refused');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected, { ...result, text: sample.allowedOutput.replace('Silva', 'Souza') }), 'An author-value mutation is refused');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected, { ...result, text: sample.allowedOutput + '\n' }), 'There is no broad margin or terminal-newline waiver');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected, { ...result, preservation: ['held'] }), 'A refused preservation result cannot qualify');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected, result, { accepted: false }), 'A rejected final gate cannot qualify');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected, { ...result, changes: [{ id: 'unreviewed-stage' }] }), 'An unrelated stage does not qualify');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected, result, gate, { ...api, version: '2.22.0' }), 'An older engine is refused');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected, result, gate,
    { ...api, v2215CitationReader() { return { module: 'Módulo:Citar livro', oldid: 49448103 }; } }), 'A changed native-reader revision is refused');
no(writer(metadata, { id: sample.id }, sample.source, sample.expected, result, gate,
    { ...api, v222CitationRoles(key) { return key === 'editor-nome' ? ['AuthorList-First:1'] : roles[key] || []; } }), 'A changed person role is refused');
const spacing = metadata.writer.find(row => row.proofKinds.length === 1 && row.exactValuePairs.length);
const spacingResult = { text: spacing.allowedOutput, preservation: [], changes: [{ id: 'v2215ParameterSpacing' }] };
yes(q.qualifyWriter(metadata, { id: spacing.id }, spacing.source, spacing.expected, spacingResult, gate, api),
    'An enumerated literal value pair qualifies without a general trim');
const changedPairs = clone(metadata);
changedPairs.writer.find(row => row.id === spacing.id).exactValuePairs[0].after += ' ';
no(q.qualifyWriter(changedPairs, { id: spacing.id }, spacing.source, spacing.expected, spacingResult, gate, api),
    'A changed literal value-pair proof is refused');

const c = metadata.collector[0], row = { id: c.id, source: c.source, expectation: 'preserve-without-unconfirmed-rendering' };
const plan = { text: c.source, edits: [] }, calculated = { text: c.allowedOutput, preservation: [] };
yes(q.qualifyCollector(metadata, row, plan, calculated, gate, c.allowedOutput, api), 'The exact fictional formatting-only box can qualify');
no(q.qualifyCollector(metadata, row, { ...plan, edits: [{}] }, calculated, gate, c.allowedOutput, api), 'Any collector producer edit is refused');
no(q.qualifyCollector(metadata, row, { ...plan, text: c.source + '\n' }, calculated, gate, c.allowedOutput, api), 'An altered producer endpoint is refused');
no(q.qualifyCollector(metadata, row, plan, { text: c.allowedOutput + '\n{{Referências}}' }, gate, c.allowedOutput + '\n{{Referências}}', api), 'A new collector cannot use the formatting qualification');
no(q.qualifyCollector(metadata, row, plan, { text: c.allowedOutput.replace('Fonte.', 'Outra fonte.') }, gate,
    c.allowedOutput.replace('Fonte.', 'Outra fonte.'), api), 'A changed reference body is refused');
no(q.qualifyCollector(metadata, { ...row, id: 'unlisted-box' }, plan, calculated, gate, c.allowedOutput, api), 'An unlisted box source is refused');

const a = metadata.archive[0];
yes(q.qualifyArchive(metadata, a.source, a.expected, a.allowedOutput, a.label, api), 'Only the listed valid native field is preserved');
no(q.qualifyArchive(metadata, a.source, a.expected, a.allowedOutput, 'Another assertion', api), 'A different assertion label is refused');
no(q.qualifyArchive(metadata, a.source, a.expected, a.allowedOutput.replace('url-status=dead', 'url-status=live'), a.label, api), 'Another native state is not silently accepted');
no(q.qualifyArchive(metadata, a.source.replace('free', 'unlisted'), a.expected, a.allowedOutput, a.label, api), 'An unlisted access value is refused');
no(q.qualifyArchive(metadata, a.source, a.expected, a.allowedOutput, a.label,
    { ...api, v218CitationNativeContext() { return { profile: { accepted: [], dependencies: [] } }; } }), 'A different native consumer cannot qualify');

for (const id of ['first-peers-108', 'first-peers-114']) {
    const row = metadata.writer.find(row => row.id === id);
    const result = { text: row.allowedOutput, preservation: [], changes: [{ id: 'v221Repair' }] };
    const call = (source = row.source, expected = row.expected, value = result, engine = api) =>
        q.qualifyWriter(metadata, { id }, source, expected, value, gate, engine);
    yes(call(), 'Only the listed empty editor-nome1 ASCII margin can use its additional actual stage id');
    no(call(row.source.replace('Ana', 'Eva')), 'A changed ignored name is outside the exact empty-margin endpoint');
    no(call(row.source.replace('editor-nome1= ', 'editor-nome1=Eva')), 'A filled native name cannot use an empty-field qualification');
    no(call(row.source.replace('editor-nome1= ', 'editor-nome1=\u00a0')), 'Unicode whitespace is outside the exact ASCII pair');
    no(call(row.source, row.expected, { ...result, text: result.text.replace('Silva', 'Souza') }), 'Another name remains protected');
    no(call(row.source, row.expected, { ...result, changes: [{ id: 'unlisted-stage' }] }), 'An unrelated stage still fails');
    no(call(row.source, row.expected, result, { ...api, v222CitationRoles() { return []; } }), 'The unchanged-key empty value must have its proved consumed native role');
}

const full = metadata.archiveFull[0], fullResult = { text: full.allowedOutput, preservation: [] };
const fullApi = { ...api, defaults: {}, v219AutomaticResultSafety() { return gate; },
    v221CitationPlan() { return { text: full.expected }; }, v221CitationPlanProof() { return true; },
    v221CitationMigrationSafe() { return true; } };
const fullCall = (source = full.source, expected = full.expected, result = fullResult, engine = fullApi,
    label = full.label) => q.qualifyArchiveFull(metadata, source, expected, result, label, engine);
yes(fullCall(), 'The exact original archive full-calculation endpoint retains native ChapterURL/Chapter roles');
for (const [from, to] of [['título=Obra', 'título=Outra obra'], ['acessourl=registro', 'acessourl=subscription'],
    ['url-estado=dead', 'url-estado=live'], ['chapter=Parte', 'chapter=Outra parte']]) {
    no(fullCall(full.source.replace(from, to)), 'A mutated source value/state/access never receives the chapter-role qualification');
}
for (const [from, to] of [['acessourl=registro', 'acessourl=subscription'], ['urlmorta=sim', 'urlmorta=não'],
    ['capítulo=Parte', 'capítulo=Outra parte'], ['capítulourl=https://example.invalid/a', 'capítulourl=https://example.invalid/b']]) {
    no(fullCall(full.source, full.expected, { ...fullResult, text: full.allowedOutput.replace(from, to) }), 'Any actual value/state/access/address mutation fails');
}
no(fullCall(full.source, full.expected + '\n'), 'A changed original planned endpoint is refused');
no(fullCall(full.source, full.expected, fullResult, fullApi, 'Another assertion'), 'No other assertion label receives a waiver');
no(fullCall(full.source, full.expected, fullResult, { ...fullApi, v221CitationPlanProof() { return false; } }), 'The original native producer proof remains mandatory');
no(fullCall(full.source, full.expected, fullResult, { ...fullApi, v221CitationMigrationSafe() { return false; } }), 'The original native state guard remains mandatory');
no(fullCall(full.source, full.expected, fullResult, { ...fullApi, v219AutomaticResultSafety() { return { accepted: false }; } }), 'The full automatic integrity gate remains mandatory');
no(fullCall(full.source, full.expected, fullResult, { ...fullApi, v222CitationRoles(key) { return key === 'capítulo' ? ['Title'] : roles[key] || []; } }), 'A changed Chapter role fails');
no(fullCall(full.source, full.expected, fullResult, { ...fullApi, v2215CitationReader() { return { module: 'Módulo:Citar livro', oldid: 49448103 }; } }), 'A changed native reader revision fails');

const biographyOptions = require('./biography_native_holds.json').options;
for (const row of metadata.biography) {
    const native = row.nativeConsumer, plan = { text: row.allowedOutput, edits: [{ start: row.source.indexOf('|cidade_morte=') + 1,
        end: row.source.indexOf('|cidade_morte=') + 1 + row.from.length, text: row.to, ruleId: 'v221InfoboxField',
        proof: { owner: row.owner, from: row.from, to: row.to, value: row.fieldValue } }] };
    const engine = { version: '2.22.1', v222Catalog() { return { focusedInfoboxes: { nativeReferenceConsumers: [native] } }; },
        v221BioPrincipal() { return { name: row.owner, raw: 'inert parser metadata', fields: [{ key: row.from, value: row.fieldValue }] }; },
        v2221InfoboxRead() { return {}; }, v2221FocusedReferenceConsumer() { return true; },
        V221_INFOBOX_MAPPINGS: [{ owner: row.owner, from: row.from, to: row.to, aliases: [...native.aliases, 'morte_país', 'paisdamorte'] }],
        v2221FocusedNativeMapping() { return { aliases: native.aliases }; },
        v221BiographyProof(source, output, value) { return source === row.source && output === row.allowedOutput && value.edits[0].proof.owner === row.owner; } };
    const call = (source = row.source, expected = row.expected, current = plan, options = biographyOptions, api = engine, id = row.id) =>
        q.qualifyBiography(metadata, id, source, expected, current, options, api);
    yes(call(), 'Only the exact native city repair with its separately supplied country qualifies');
    for (const source of [row.source + ' ', row.source.replace('Outro', 'Brasil'), row.source.replace('nome=Exemplo', 'nome=Outro'),
        row.source.replace('Fonte.', 'Outra fonte.'), row.source.replace('name="A"', 'name="B"'),
        row.source.replace('<ref name="A">', '<ref name="A" group="nota">'), row.source.replace('|nome=', '|morte_local=')])
        no(call(source), 'A changed name, country, body, group, source context or byte cannot use the two-id policy');
    no(call(row.source, row.expected + '\n'), 'The old expected bytes remain exact');
    no(call(row.source, row.expected, { ...plan, text: plan.text + '\n' }), 'No generic margin or newline qualification exists');
    no(call(row.source, row.expected, plan, { ...biographyOptions, references: false }), 'Every original option remains source bound');
    no(call(row.source, row.expected, plan, biographyOptions, engine, 'unlisted-biography-source'), 'No other biography id qualifies');
    no(call(row.source, row.expected, { ...plan, edits: [] }), 'A claimed repair without the original edit is rejected');
    const changed = clone(plan); changed.edits[0].proof.value = 'Alterado';
    no(call(row.source, row.expected, changed), 'The original value witness remains exact');
    no(call(row.source, row.expected, plan, biographyOptions, { ...engine, v221BiographyProof() { return false; } }), 'Original source-bound producer proof remains mandatory');
    no(call(row.source, row.expected, plan, biographyOptions, { ...engine, v2221FocusedReferenceConsumer() { return false; } }), 'Native conditional consumption is mandatory');
    const stale = clone(native); stale.native.revision++;
    no(call(row.source, row.expected, plan, biographyOptions, { ...engine, v222Catalog() { return { focusedInfoboxes: { nativeReferenceConsumers: [stale] } }; } }), 'A different native reader revision is rejected');
    no(call(row.source, row.expected, plan, biographyOptions, { ...engine, v2221FocusedNativeMapping() { return { aliases: [...native.aliases, row.countryKey] }; } }), 'Country cannot remain a competing city alias');
}

for (const kind of ['writer', 'collector', 'archive', 'biography']) {
    const changed = clone(metadata);
    changed[kind][0].sourceSha256 = '0'.repeat(64);
    throws(() => q.validateMetadata(changed), 'A changed source pin is refused');
    const duplicate = clone(metadata);
    duplicate[kind][1].id = duplicate[kind][0].id;
    throws(() => q.validateMetadata(duplicate), 'Duplicate ids are refused');
    const filename = path.resolve(__dirname, '../..', Object.keys(metadata.suitePins).find(file => file.includes(
        kind === 'writer' ? 'citation_writer_guards' : kind === 'collector' ? 'citation_collector_scope' : kind === 'biography' ? 'biography_cases' : 'archive_state_activation')));
    const source = fs.readFileSync(filename, 'utf8');
    yes(q.patchSuite(kind, source, metadata) !== source, 'One frozen inherited assertion site is instrumented');
    throws(() => q.patchSuite(kind, source + '\n', metadata), 'A changed inherited program cannot be instrumented');
}
throws(() => q.patchSuite('frozen-runtime-guards', '', metadata), 'The actual integrity guard has no qualification');
q.executeNativeRealm("const assert=require('node:assert/strict');assert.deepEqual({items:[1,2]},expected);seen();",
    { require, expected: { items: [1, 2] }, seen() { checks++; } }, 'same-realm-fictional-control.cjs');
console.log(JSON.stringify({ suite: 'regular-legacy-finite-qualification-policy', checks, passed: true,
    productRuntimeExecuted: false, sameNodeRealmControl: true, sourceCasesAreFictional: true, wikipediaWrites: 0 }));
