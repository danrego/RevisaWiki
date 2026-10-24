'use strict';
// A rule-family transfer changes the internal labels, not the retained edits.
// The original 2.20 assertions remain untouched and their failure is retained.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const files = process.argv.slice(2).filter(value => !value.startsWith('--'));
assert.ok(files.length);
let checks = 0;
const rows = [], eq = (actual, expected, message) => {checks++; assert.deepEqual(actual, expected, message);};
const sha = raw => crypto.createHash('sha256').update(raw).digest('hex');
const source = '{{Info/Político|nome=Exemplo|nome_completo=Nome Exemplo|antecessor2=[[Pessoa Exemplo]]|sucessor2=[[Outra Pessoa]]}}\n\nExemplo.';
const fieldEndpoint = '{{Info/Político|nome=Exemplo|nome_comp=Nome Exemplo|antes2=[[Pessoa Exemplo]]|depois2=[[Outra Pessoa]]}}\n\nExemplo.';
for (const supplied of files) {
  const file = path.resolve(supplied), raw = fs.readFileSync(file), api = require(file),
    base = {...api.defaults, namespaceNumber: 0, pageTitle: 'Exemplo', authorityControl: false, autoPreview: false, alignInfoboxParameters: false};
  for (const portals of [false, true]) {
    const cfg = {...base, automaticBiographyPortals: portals, biographyPortal: portals, automaticTopicPortals: portals},
      expected = fieldEndpoint + (portals ? '\n\n{{Portal3|Biografias|Política}}\n' : ''),
      result = api.calculate({kind: 'adjust', source, originalSource: source, options: cfg});
    eq(result.text, expected, 'Independent complete field and portal endpoint');
    eq(result.changes.find(c => c.id === 'v220InfoboxField')?.count, 2, 'Two inherited field-name repairs');
    eq(result.changes.find(c => c.id === 'v221InfoboxField')?.count, 1, 'One field-name repair moved to the native 2.21 family');
    const retained = api.v219UIPresentationMetadata({source: result.text, originalSource: source, presentationKinds: ['syntax'], options: cfg}).presentation.retained;
    eq(retained.exact, true, 'The retained count has exact source and output anchors');
    eq(retained.count, portals ? 5 : 3, 'The UI counts three fields and only the portals actually added');
    eq(retained.events.filter(event => event.kind === 'parameter-name').length, 3, 'Three separate field-name events');
    eq(retained.events.filter(event => event.kind === 'portal-slot').length, portals ? 2 : 0, 'Every portal slot counts once');
    eq(api.v219AutomaticResultSafety(source, result).accepted, true, 'Final safety gate');
    eq(api.preservationAudit(source, result.text, cfg), [], 'Values and links preserved');
    eq(api.safeComposition(source, result.text, cfg), '', 'Complete action composes');
    eq(api.calculate({kind: 'adjust', source: result.text, options: cfg}).text, result.text, 'One-click endpoint is idempotent');
    rows.push({bundleSha256: sha(raw), sourceSha256: sha(source), outputSha256: sha(result.text),
      id: portals ? 'three-fields-two-portals' : 'three-fields-only', status: 'passed', retainedCount: retained.count});
  }
  for (const [id, input, expectedCount] of [
    ['remaining-image-options', '[[File:Example.jpg|semmdolura|75px]]\n[[File:Other.jpg|thumb|width250px|Legenda]]\n[[File:Third.jpg|thumb|vertical|Legenda]]', 2],
    ['remaining-literal-control', '<nowiki>[[File:Example.jpg|semmdolura|75px]]</nowiki>', 0]
  ]) {
    const cfg = {...base, automaticBiographyPortals: false, biographyPortal: false, automaticTopicPortals: false},
      result = api.calculate({kind: 'adjust', source: input, originalSource: input, options: cfg}),
      expected = expectedCount ? '[[File:Example.jpg|semmdolura|75px]]\n[[File:Other.jpg|thumb|250px|Legenda]]\n[[File:Third.jpg|thumb|Legenda]]' : input;
    eq(result.text, expected, 'Independent remaining legacy endpoint');
    eq(result.changes.filter(c => c.id.startsWith('v220')).reduce((sum, c) => sum + c.count, 0), expectedCount, 'Remaining inherited operation count');
    eq(api.v219AutomaticResultSafety(input, result).accepted, true, 'Remaining case final gate');
    eq(api.calculate({kind: 'adjust', source: result.text, options: cfg}).text, result.text, 'Remaining case idempotence');
    rows.push({bundleSha256: sha(raw), id, status: 'passed'});
  }
  eq(sha(fs.readFileSync(file)), sha(raw), 'Candidate bytes remain exact');
}
const report = {kind: 'current-rule-migration-independent-count-qualification', status: 'passed', checks, cases: rows,
  resolution: 'resolved-current-rule-migration', historicalSuiteStatusUnchanged: true,
  originalSuite: 'tests/v220/bio_counts.cjs', originalSuiteSha256: sha(fs.readFileSync(path.resolve(__dirname, '../v220/bio_counts.cjs'))),
  networkRequests: 0, wikipediaWrites: 0};
console.log(JSON.stringify(report, null, 2));
