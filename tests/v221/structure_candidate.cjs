'use strict';
// Run against a completed candidate bundle. This suite never loads the browser UI or publishes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const candidatePath = process.argv[2];
assert.ok(candidatePath, 'candidate bundle path required');
const root = path.resolve(__dirname, '../..');
function load(file) {
  const context = {module: {exports: {}}, exports: {}, console, URL, TextEncoder, TextDecoder, require: require('node:module').createRequire(path.resolve(file)),
    performance, setTimeout, clearTimeout, setInterval, clearInterval};
  const compiledCode = fs.readFileSync(file, 'utf8');
  vm.runInNewContext(compiledCode, context, {timeout: 15000});
  return require('./legacy_calculation_deadline.cjs').traceExportedCalculate(context.module.exports, file, compiledCode);
}
const api = load(path.resolve(candidatePath));
const base = load(path.join(root, 'dist/2.20.0/RevisaWiki_v2_20_0_completo.js'));
const cfg = {namespaceNumber: 0, contentModel: 'wikitext', pageTitle: 'Caso estrutural', revisionId: 321};
let checks = 0;
const rows = [];
let activeCaseId = null;
process.on('uncaughtException', error => {
  const receiptAt = process.argv.indexOf('--receipt');
  const report = {kind: 'candidate-actual-calculate-structure-tests', status: 'failed', checks, cases: rows, failedCase: activeCaseId,
    bundleSha256: crypto.createHash('sha256').update(fs.readFileSync(candidatePath)).digest('hex'), message: error.message};
  if (receiptAt > 0 && !fs.existsSync(process.argv[receiptAt + 1])) fs.writeFileSync(process.argv[receiptAt + 1], JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  console.error(error.stack); process.exitCode = 1;
});
function check(id, source, expected, options = {}) {
  activeCaseId = id;
  const optionsNow = {...cfg, ...options}, expectedResult = base.calculate({kind: 'adjust', source: expected, originalSource: expected, options: optionsNow});
  const result = api.calculate({kind: 'adjust', source, originalSource: source, options: optionsNow});
  assert.equal(result.text, expectedResult.text, id + ' complete action endpoint'); checks++;
  const safety = api.v219AutomaticResultSafety(source, result);
  assert.equal(safety.accepted, true, id + ' final safety: ' + JSON.stringify(safety)); checks++;
  assert.equal(api.preservationAudit(source, result.text, optionsNow).length, 0, id + ' preservation audit'); checks++;
  assert.equal(api.safeComposition(source, result.text, optionsNow), '', id + ' composition'); checks++;
  const repeat = api.calculate({kind: 'adjust', source: result.text, originalSource: result.text, options: optionsNow});
  assert.equal(repeat.text, result.text, id + ' idempotence'); checks++;
  rows.push({id, status: 'passed', sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
    outputSha256: crypto.createHash('sha256').update(result.text).digest('hex'), changes: result.changes.map(c => ({id: c.id, count: c.count}))});
}
check('STR-01', 'Texto [[https://example.org Página]] final.', 'Texto [https://example.org Página] final.');
// The approved period repair excludes ambiguous abbreviations and proper-name endings.
for (const word of ['Exmo','Exma','Ilmo','Ilma','Srta','Univ','Depto','Ltda','univers','ltda','univ','págs','Brasil']) {
  const source='O texto se refere ao '+word+'.<ref name="A">Fonte fictícia.</ref>.\n\n{{Referências}}';
  check('EXT-REF-01-ambiguous-ending-'+word, source, source);
}

check('STR-02', 'Uma fonte.<ref>[https://example.org Fonte]]</ref>', 'Uma fonte.<ref>[https://example.org Fonte]</ref>');
check('STR-03', 'Texto [[Artigo&#124;rótulo]] final.', 'Texto [[Artigo|rótulo]] final.');
check('GEN-01', 'Texto final.\n\n{{Controle de autoridade}}\n{{Controle de autoridade}}\n[[Categoria:Exemplos]]',
  'Texto final.\n\n{{Controle de autoridade}}\n[[Categoria:Exemplos]]');
check('GEN-02', 'Texto [https//example.org/x?a=2#b Fonte] final.', 'Texto [https://example.org/x?a=2#b Fonte] final.');
check('STR-04', 'Primeiro parágrafo.\n\n&nbsp;\n\nSegundo parágrafo.', 'Primeiro parágrafo.\n\nSegundo parágrafo.');
check('STR-05', 'Primeiro parágrafo.\n\n\n<!-- Comentário preservado. -->\n\n\nSegundo parágrafo.',
  'Primeiro parágrafo.\n<!-- Comentário preservado. -->\n\nSegundo parágrafo.');
check('STR-06', '* Primeiro item\n*\n* Segundo item', '* Primeiro item\n* Segundo item');
check('STR-07', '{{Info/Biografia|nome=Pessoa|ocupação=Primeira</br>Segunda}}\nTexto.',
  '{{Info/Biografia|nome=Pessoa|ocupação=Primeira<br />Segunda}}\nTexto.');
check('STR-08', 'Uma frase <small></small> com texto.', 'Uma frase  com texto.');
check('STR-11', 'Texto com fonte.<ref>Uma fonte.</ref>\n\n== Referências ==\n[[Categoria:Exemplos]]\n{{Referências}}\n',
  'Texto com fonte.<ref>Uma fonte.</ref>\n\n[[Categoria:Exemplos]]\n{{Referências}}\n');
check('STR-AD-01', '== Leia na Wikipedia ==\n* [[Primeiro]]\n* [[Segundo|Rótulo]]\n',
  '== Ver também ==\n* [[Primeiro]]\n* [[Segundo|Rótulo]]\n');
const note = "'''''<small>Nota com [[Artigo]]</small>'''''";
check('STR-AD-02', note + '\n\n    \n\n{{Lista de mares}}\n', note + '\n\n{{Lista de mares}}\n', {footerProfiles: {'lista de mares': 'navbox'}});
const entries = Array.from({length: 6}, (_, i) => '* Obra ' + (i + 1)).join('\n');
check('STR-COMP-01', '== Bibliografia adicional ==\n' + entries + '\n',
  '== Bibliografia adicional ==\n{{Colunas-lista|2|2=\n' + entries + '\n}}\n');
check('EXT-REF-01', 'Uma frase completa.<ref name="a">Fonte.</ref>.', 'Uma frase completa.<ref name="a">Fonte.</ref>');
check('LNR-01', '{| class="wikitable"\n! scope="column" | Coluna\n|-\n| Dado\n|}\n',
  '{| class="wikitable"\n! scope="col" | Coluna\n|-\n| Dado\n|}\n');
check('LNR-02', '<gallery>\nFile:Example.jpg|thumb|Legenda completa.\nFile:Example.jpg|thumb\n</gallery>',
  '<gallery>\nFile:Example.jpg|Legenda completa.\nFile:Example.jpg|thumb\n</gallery>');
check('LNR-04', 'Uma frase.<ref name="a">Fonte.</ref><ref name="a" / />',
  'Uma frase.<ref name="a">Fonte.</ref><ref name="a" />');
const table = '{| class="wikitable" style="width:100%;min-width:900px;table-layout:fixed;font-size:90%;text-align:center;border-collapse:collapse;"\n! Coluna\n|-\n| Dado\n|}\n';
check('STR-10', table, '<div style="max-width:100%;min-width:0;overflow-x:auto;">\n' + table + '</div>\n');
check('GEN-03', '{{Info/Álbum|nome=Álbum}}\n\n== Faixas ==\n1. Primeira faixa\n\n2. Segunda faixa\n',
  '{{Info/Álbum|nome=Álbum}}\n\n== Faixas ==\n# Primeira faixa\n# Segunda faixa\n');
const categoryEof = '{{Info/Biografia|nome=Pessoa|ocupação=escritor}}\n\nPessoa é um escritor.\n\n [[Categoria:Exemplos]]';
const categoryExpected = categoryEof.slice(0, categoryEof.lastIndexOf(' [[Categoria:')) + '{{Portal3|Biografias|Literatura}}\n\n [[Categoria:Exemplos]]';
check('INT-04', categoryEof, categoryExpected);
const literalEof = categoryEof.replace(' [[Categoria:Exemplos]]', ' Texto preformatado');
const literalResult = api.calculate({kind: 'adjust', source: literalEof, options: cfg});
assert.equal(api.v219AutomaticResultSafety(literalEof, literalResult).accepted, false, 'INT-04 never relaxes a genuine literal EOF'); checks++;
const externalSource = 'Texto [https//example.org Fonte].\n[[en:Example]]\n<gallery>\nFile::Example.jpg|thumb|Legenda completa.\n</gallery>';
const externalRequests = api.v221StructureExternalRequests(externalSource, cfg), externalProof = {...externalRequests,
  checkedAt: '2026-01-01T00:00:00Z', interwiki: [{language: 'en', title: 'Example', matched: true}],
  files: [{originalTitle: 'File::Example.jpg', correctedTitle: 'File:Example.jpg', correctedExists: true, originalExists: false}]};
check('GEN-04+LNR-03-source-bound-proof', externalSource,
  'Texto [https://example.org Fonte].\n<gallery>\nFile:Example.jpg|Legenda completa.\n</gallery>', {v221StructureExternalProof: externalProof});
const combinedSource = 'Texto com fonte.<ref name=a>Fonte.</ref>\n' + externalSource + '\n{{Referências|complemento=}}';
const combinedRequests = api.v221StructureExternalRequests(combinedSource, cfg), combinedProof = {...externalProof, sourceHash: combinedRequests.sourceHash};
check('GEN-04-preserve-opaque-owner+LNR-03+earlier-reference-prerequisites', combinedSource,
  'Texto com fonte.<ref name="a">Fonte.</ref>\nTexto [https://example.org Fonte].\n[[en:Example]]\n<gallery>\nFile:Example.jpg|Legenda completa.\n</gallery>\n{{Referências}}',
  {v221StructureExternalProof: combinedProof});
// A fabricated matching sitelink cannot authorize removal in an opaque source.
for (const opaque of ['{{Exemplo}}', '{{#if:1|Texto|Outro}}', '{{{campo|Texto}}}',
  '{{Referências}}', '{{Portal3|Ciência}}', '{{noexternallanglinks|en}}', '{{sem interwikis}}',
  '<nowiki>{{Exemplo}}</nowiki>', '<!-- {{Exemplo}} -->', '{{#invoke:Exemplo|main}}']) {
  const source = opaque + '\n[[en:Example]]\n', requests = api.v221StructureExternalRequests(source, cfg);
  assert.equal(requests.interwiki.length, 0, 'GEN-04 opaque owner requests'); checks++;
  const proof = {...requests, checkedAt: externalProof.checkedAt, interwiki: externalProof.interwiki, files: []};
  check('GEN-04-preserve-opaque-' + opaque, source, source, {v221StructureExternalProof: proof});
}
// The original four-apostrophe regression must keep the complete original link boundary.
for (const source of ["O álbum foi chamado [[Álbum|''Álbum'']]'''.", "Já estava presente n'[[Obra|''A Obra'']]."]) {
  const result = api.calculate({kind: 'adjust', source, originalSource: source, options: cfg});
  assert.ok(result.text.includes(source.includes('n\'') ? "n'[[Obra|''A Obra'']]" : "[[Álbum|''Álbum'']]'''"), 'STR-INT-APOS source boundary'); checks++;
  assert.equal(api.v219AutomaticResultSafety(source, result).accepted, true); checks++;
  assert.equal(api.calculate({kind: 'adjust', source: result.text, options: cfg}).text, result.text); checks++;
  rows.push({id: 'STR-INT-APOS', status: 'passed'});
}
const safeSimple = 'Texto [[Obra|\'\'A Obra\'\']] final.';
const simple = api.calculate({kind: 'adjust', source: safeSimple, options: cfg});
assert.ok(simple.text.includes("''[[Obra|A Obra]]''"), 'Simple safe inherited emphasis still applies'); checks++;
for (let depth = 2; depth <= 6; depth++) {
  const eq = '='.repeat(depth);
  check('STR-AD-01-level-' + depth, eq + ' Leia na Wikipédia ' + eq + '\n* [[Primeiro]]\n',
    eq + ' Ver também ' + eq + '\n* [[Primeiro]]\n');
}
const excluded = [
  {id: 'heading-competing-subsection', rule: 'v221RelatedSectionHeading', source: '== Leia na Wikipédia ==\n* [[Primeiro]]\n=== Ver também ===\n* [[Segundo]]\n'},
  {id: 'heading-second-alias', rule: 'v221RelatedSectionHeading', source: '== Leia na Wikipédia ==\n* [[Primeiro]]\n=== Veja mais ===\n* [[Segundo]]\n'},
  ...['Leia_na_Wikip%C3%A9dia', 'Leia_na_Wikip.C3.A9dia'].map(anchor => ({id: 'heading-encoded-anchor-' + anchor,
    rule: 'v221RelatedSectionHeading', source: 'Veja [[#' + anchor + '|seção]].\n\n== Leia na Wikipédia ==\n* [[Primeiro]]\n'})),
  {id: 'break-nested-citation', rule: 'v221InfoboxBreak', source: '{{Info/Biografia|nome={{Citar web|título=Primeira</br>Segunda}}}}\nTexto.'},
  {id: 'break-ref-body', rule: 'v221InfoboxBreak', source: '{{Info/Biografia|nome=<ref>Primeira</br>Segunda</ref>}}\nTexto.'},
  {id: 'break-html-attribute', rule: 'v221InfoboxBreak', source: '{{Info/Biografia|nome=<span title="Primeira</br>Segunda">Nome</span>}}\nTexto.'},
  {id: 'gallery-ref-owner', rule: 'v221GalleryThumbnailOption', source: '<ref><gallery>\nFile:Example.jpg|thumb|Legenda completa.\n</gallery></ref>'},
  {id: 'url-unknown-template-ancestor', rule: 'v221UrlProtocol', source: '{{Exemplo|campo={{Citar web|url=https//example.org/a}}}}'},
  {id: 'url-wikilink-owner', rule: 'v221UrlProtocol', source: '[[Artigo|{{Citar web|url=https//example.org/a}}]]'},
  {id: 'scope-wikilink-owner', rule: 'v221TableScopeColumn', source: '[[Artigo|\n{| class="wikitable"\n! scope="column" | Coluna\n|-\n| Dado\n|}\n]]'},
  {id: 'gallery-wikilink-owner', rule: 'v221GalleryThumbnailOption', source: '[[Artigo|<gallery>\nFile:Example.jpg|thumb|Legenda completa.\n</gallery>]]'},
  {id: 'heading-unclosed-html-owner', rule: 'v221RelatedSectionHeading', source: '<div>\n== Leia na Wikipédia ==\n* [[Primeiro]]\n'},
  {id: 'columns-unclosed-table-owner', rule: 'v221CompatibleBibliographyColumns', source: '{|\n|\n== Bibliografia adicional ==\n' + entries + '\n'}
];
for (const test of excluded) {
  activeCaseId = test.id;
  const plan = api.v221StructurePlan(test.source, cfg);
  assert.equal(plan.edits.some(e => e.ruleId === test.rule), false, test.id + ' structural guard'); checks++;
  const result = api.calculate({kind: 'adjust', source: test.source, originalSource: test.source, options: cfg});
  assert.equal(result.changes.some(c => c.id === test.rule), false, test.id + ' whole-action guard'); checks++;
  assert.equal(api.v221StructureProof(test.source, plan.text, plan, cfg), true, test.id + ' exact proof'); checks++;
  rows.push({id: test.id, status: 'passed', role: 'restrictive-ownership-counterexample',
    sourceSha256: crypto.createHash('sha256').update(test.source).digest('hex'),
    outputSha256: crypto.createHash('sha256').update(result.text).digest('hex')});
}
check('GEN-02-direct-citation-with-nested-title', '{{Citar web|url=https//example.org/a|título={{lang|en|Title}}}}',
  '{{Citar web|url=https://example.org/a|título={{lang|en|Title}}}}');
check('GEN-02-direct-reference-body', 'Texto.<ref>{{Citar web|url=https//example.org/a}}</ref>',
  'Texto.<ref>{{Citar web|url=https://example.org/a}}</ref>');
const report = {kind: 'candidate-actual-calculate-structure-tests', status: 'passed', checks, cases: rows,
  bundleSha256: crypto.createHash('sha256').update(fs.readFileSync(candidatePath)).digest('hex'),
  expectedMethod: 'Independent finite target, then pinned inherited 2.20 cleanup; explicit APOS preservation and inherited positive control.',
  wikipediaWrites: 0};
const receiptAt = process.argv.indexOf('--receipt');
if (receiptAt > 0) fs.writeFileSync(process.argv[receiptAt + 1], JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({status: report.status, checks, cases: rows.length, bundleSha256: report.bundleSha256}));
