'use strict';
// Independent boundary controls use only the released public entry points.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const files = process.argv.slice(2).filter(x => !x.startsWith('--'));
if (!files.length) files.push('dist/2.21.1/RevisaWiki_v2_21_1.js', 'dist/2.21.1/RevisaWiki_v2_21_1_completo.js');
const cases = [];
const list = (n, eol = '\n') => Array.from({length: n}, (_, i) => '* Item ' + (i + 1)).join(eol);
const template = (body, first = '2', name = 'Colunas-lista') => '{{' + name + '|' + first + '|2=' + body + '}}';
const pair = (body, first = '{{Div col|colunas=2}}', last = '{{Div col fim}}') => first + '\n' + body + '\n' + last;
const add = (id, content, expected, options = {}, whole = true) => cases.push({id, content, expected, options, whole});
const keep = (id, content, options = {}, whole = true) => add(id, content, content, options, whole);
const prefix = '== Bibliografia adicional ==\n';
for (const first of ['2', '1=2', ' 1 = 2 ', '\n1=2\n']) {
  const body = '\n' + list(7) + '\n';
  add('exact-count-field-' + JSON.stringify(first), prefix + template(body, first) + '\n', prefix + body + '\n');
}
for (const [id, first] of [['nbsp-key', '\u00a01=2'], ['emspace-key', '\u20031=2'], ['nbsp-value', '1=2\u00a0'], ['nbsp-positional', '2\u00a0'], ['vertical-tab', '\v1=2'], ['form-feed', '\f1=2']]) {
  keep('unknown-count-' + id, prefix + template('\n' + list(7) + '\n', first) + '\n');
}
for (const eol of ['\n', '\r\n']) {
  const head = '== Bibliografia complementar ==' + eol;
  const body = eol + list(3, eol) + eol;
  add('body-bytes-' + eol.length, head + template(body) + eol, head + body + eol);
}
const descendantBody = '\n* Parent one\n** Child one\n*# Child two\n*: Child three\n*; Child four\n* Parent two\n';
add('descendants-retained-not-counted', prefix + template(descendantBody) + '\n', prefix + descendantBody + '\n');
for (const n of [8, 9]) keep('existing-layout-at-boundary-' + n, prefix + template('\n' + list(n) + '\n') + '\n');
keep('empty-wrapper', prefix + template('\n') + '\n');
for (const argument of ['estilo=', 'tamanho=', 'pequeno=', 'colunas=2', '3=', '1=2', '2=']) {
  keep('extra-argument-' + argument, prefix + '{{Colunas-lista|2|2=\n' + list(3) + '\n|' + argument + '}}\n');
}
for (const body of [
  '\n* Item\n\nProse.\n', '\n* Item\n== Another heading ==\n* Item\n',
  '\n* Item<ref>Reference.</ref>\n', '\n* Item<ref group="note">Reference.</ref>\n',
  '\n* Item {{sfn|Example|2000}}\n', '\n* Item {{Citar web|url=https://example.invalid/|titulo=Source}}\n',
  '\n* Item<nowiki>literal</nowiki>\n', '\n* Item\n[[Categoria:Example]]\n',
  '\n* Item\n{|\n| Cell\n|}\n', '\n* Item {{Unknown|x=\n* Fake one\n* Fake two}}\n'
]) keep('nonliteral-list-' + cases.length, prefix + template(body) + '\n');
for (const name of ['COLUNAS-LISTA', 'Colunas-Lista', 'subst:Colunas-lista', 'Template:Colunas-lista']) {
  keep('unconfirmed-name-' + name, prefix + template('\n' + list(7) + '\n', '2', name) + '\n');
}
for (const heading of ['Ligações externas', 'Bibliografia', 'Bibliografia complementar', 'Bibliografia adicional', 'Leituras complementares']) {
  const head = '== ' + heading + ' ==\n';
  const body = list(7);
  add('simple-pair-' + heading, head + pair(body) + '\n', head + '\n' + body + '\n\n');
  for (const first of ['{{Div col|colunas\u00a0=2}}', '{{Div col|colunas=2\u00a0}}', '{{Div col|colunas=2|estilo=}}']) {
    keep('pair-uncertain-field-' + heading + '-' + cases.length, head + pair(body, first) + '\n');
  }
  keep('pair-note-scope-' + heading, head + pair(body + '<ref group="note">Reference.</ref>') + '\n');
}
for (const options of [{endMatter: false}, {endMatterColumns: false}, {sectionOnly: true}, {markup: false}, {namespaceNumber: 1}]) {
  keep('disabled-or-owner-' + JSON.stringify(options), prefix + template('\n' + list(7) + '\n') + '\n', options, false);
}
const rows = [], failures = [];
let checks = 0, calculations = 0;
for (const filename of files) {
  const full = path.resolve(root, filename);
  const api = require(full);
  const cfg = {...Object.fromEntries(Object.keys(api.defaults).map(k => [k, false])), markup: true, structuralRepairs: true,
    namespaceNumber: 0, contentModel: 'wikitext', pageTitle: 'Fictional subject', endMatter: true, endMatterColumns: true,
    autoPreview: false, registryDoiCheck: false};
  for (const c of cases) {
    const opts = {...cfg, ...c.options};
    let bumps = 0;
    const direct = api.endMatterColumns(c.content, opts, () => bumps++);
    const pass = direct === c.expected;
    checks++;
    if (!pass) failures.push({bundle: path.basename(filename), id: c.id, entry: 'endMatterColumns', beforeSha256: hash(c.content), expectedSha256: hash(c.expected), actualSha256: hash(direct)});
    const second = api.endMatterColumns(direct, opts, () => {});
    checks++;
    if (second !== direct) failures.push({bundle: path.basename(filename), id: c.id, entry: 'idempotence'});
    if (c.whole) {
      const result = api.calculate({kind: 'adjust', source: c.content, options: opts});
      calculations++;
      const beforeHas = c.content.includes('{{Colunas-lista') || c.content.includes('{{Div col');
      const expectedHas = c.expected.includes('{{Colunas-lista') || c.expected.includes('{{Div col');
      const actualHas = result.text.includes('{{Colunas-lista') || result.text.includes('{{Div col');
      checks++;
      if (beforeHas && actualHas !== expectedHas) failures.push({bundle: path.basename(filename), id: c.id, entry: 'calculate-layout-boundary', expectedWrapped: expectedHas, actualWrapped: actualHas});
    }
    rows.push({bundle: path.basename(filename), id: c.id, directPass: pass, bumps});
  }
}
function hash(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
const report = {kind: 'independent-literal-short-columns-boundary-controls', version: '2.21.1', cases: cases.length,
  checks, calculations, failures, failed: failures.length, status: failures.length ? 'failed' : 'passed', rows,
  productFilesChanged: 0, wikipediaWrites: 0};
console.log(JSON.stringify(report));
process.exitCode = failures.length ? 1 : 0;
