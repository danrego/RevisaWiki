'use strict';
const assert = require('node:assert/strict');
const {loadStructureUnit} = require('./structure_harness.cjs');
const api = loadStructureUnit();
const cfg = {namespaceNumber: 0, contentModel: 'wikitext', pageTitle: 'Artigo de teste', revisionId: 321};
let checks = 0;
function check(source, expected, options = {}) {
  const c = {...cfg, ...options};
  const plan = api.v221StructurePlan(source, c);
  assert.equal(plan.text, expected, source);
  assert.equal(api.v221StructureProof(source, plan.text, plan, c), true);
  assert.equal(api.v221StructurePlan(plan.text, c).text, plan.text, 'idempotence: ' + source);
  if (plan.edits.length) {
    const forged = JSON.parse(JSON.stringify(plan));
    forged.edits[0].proof.condition += ' changed';
    assert.equal(api.v221StructureProof(source, plan.text, forged, c), false);
    assert.equal(api.v221StructureProof(source + 'x', plan.text, plan, c), false);
  }
  checks++;
  return plan;
}
const keep = (source, options) => check(source, source, options);
check('Texto [[https://example.org Página]] final.', 'Texto [https://example.org Página] final.');
check('<ref>[https://example.org Fonte]]</ref>', '<ref>[https://example.org Fonte]</ref>');
check('Texto [[Artigo&#124;rótulo]] final.', 'Texto [[Artigo|rótulo]] final.');
keep('[[Imagem:Arquivo.jpg|miniatura|[https://example.org Fonte]]]');
keep('<nowiki>[[https://example.org Página]]</nowiki>');
keep('{{Exemplo|[[https://example.org Página]]}}');
keep('Texto [[https://example.org [[Artigo]]]] final.');
keep('[[Artigo|[https://example.org Fonte]]]');
keep('[[Artigo&#124;rótulo&#124;outro]]');
check('Texto [https//example.org/x?a=2#b Fonte] final.', 'Texto [https://example.org/x?a=2#b Fonte] final.');
check('{{Citar web|url=https: //example.org/x?a=2#b|titulo=Uma fonte}}', '{{Citar web|url=https://example.org/x?a=2#b|titulo=Uma fonte}}');
for (const value of ['http//example.org/a', 'https//example.org/a', 'htps://example.org/a']) {
  check('{{Citar web|url=' + value + '}}', '{{Citar web|url=' + (value.startsWith('http//') ? 'http' : 'https') + '://example.org/a}}');
}
keep('{{Citar web|url=https//|titulo=Uma fonte}}');
keep('{{Citar web|titulo=https//example.org/a}}');
keep('{{Outro|url=https//example.org/a}}');
keep('<code>[https//example.org Fonte]</code>');
keep('{{Citar web|url=https://archive.example.org/http://example.org/a?sig=abc}}');
check('Texto final.\n\n{{Controle de autoridade}}\n{{Controle de autoridade}}\n[[Categoria:Exemplos]]',
  'Texto final.\n\n{{Controle de autoridade}}\n[[Categoria:Exemplos]]');
keep('Texto final.\n\n{{Controle de autoridade|VIAF=1}}\n{{Controle de autoridade|VIAF=2}}');
keep('{{Outro|{{Controle de autoridade}}\n{{Controle de autoridade}}}}');
check('Primeiro parágrafo.\n\n&nbsp;\n\nSegundo parágrafo.', 'Primeiro parágrafo.\n\nSegundo parágrafo.');
check('Primeiro parágrafo.\n\n\u00a0\n\nSegundo parágrafo.', 'Primeiro parágrafo.\n\nSegundo parágrafo.');
keep('12&nbsp;km');
keep('* Primeiro\n\n&nbsp;\n\n* Segundo');
keep('{{Outro|Primeiro parágrafo.\n\n&nbsp;\n\nSegundo parágrafo.}}');
check('Primeiro parágrafo.\n\n\n<!-- Comentário preservado. -->\n\n\nSegundo parágrafo.',
  'Primeiro parágrafo.\n<!-- Comentário preservado. -->\n\nSegundo parágrafo.');
keep('<poem>Primeiro parágrafo.\n\n\n<!-- Comentário preservado. -->\n\n\nSegundo parágrafo.</poem>');
check('* Primeiro item\n*\n* Segundo item', '* Primeiro item\n* Segundo item');
keep('* Primeiro item\n*\n** Descendente\n* Segundo item');
keep('# Primeiro item\n#\n# Segundo item');
keep('* Primeiro item\n* <!-- nota -->\n* Segundo item');
check('Uma frase <small></small> com texto.', 'Uma frase  com texto.');
keep('Uma frase <small id="alvo"></small> com texto.');
keep('<code>Uma frase <small></small> com texto.</code>');
check('== Leia na Wikipedia ==\n* [[Primeiro]]\n* [[Segundo|Rótulo]]\n',
  '== Ver também ==\n* [[Primeiro]]\n* [[Segundo|Rótulo]]\n');
keep('== Ver Mais ==\n* [https://example.org Fonte]\n');
keep('== Lei na Wikipédia ==\n* [[Primeiro]]\n');
keep('Veja [[#Leia_na_Wikipedia]].\n\n== Leia na Wikipedia ==\n* [[Primeiro]]\n');
keep('== Ver Mais ==\n* [[Primeiro]]\n== Ver também ==\n* [[Segundo]]\n');
check('== Referências ==\n[[Categoria:Exemplos]]\n{{Referências}}\n',
  '[[Categoria:Exemplos]]\n{{Referências}}\n');
keep('== Referências ==\n[[Categoria:Exemplos]]\n{{Referências|nível=0}}\n');
keep('Veja [[#Referências_2]].\n== Referências ==\n[[Categoria:Exemplos]]\n{{Referências}}\n');
for (const heading of ['Bibliografia adicional', 'Leituras complementares']) {
  const items = Array.from({length: 6}, (_, i) => '* Obra ' + (i + 1)).join('\n');
  check('== ' + heading + ' ==\n' + items + '\n',
    '== ' + heading + ' ==\n{{Colunas-lista|2|2=\n' + items + '\n}}\n');
  keep('== ' + heading + ' ==\n* Obra 1\n* Obra 2\n');
}
check('Uma frase completa.<ref name="a">Fonte.</ref>.', 'Uma frase completa.<ref name="a">Fonte.</ref>');
check('Uma frase completa.<ref name="a">Fonte.</ref><ref name="a" />.',
  'Uma frase completa.<ref name="a">Fonte.</ref><ref name="a" />');
keep('Uma frase completa...<ref name="a">Fonte.</ref>.');
keep('Uma frase etc.<ref name="a">Fonte.</ref>.');
keep('Uma "frase" completa.<ref name="a">Fonte.</ref>.');
check('{| class="wikitable"\n! scope="column" | Coluna\n|-\n| Dado\n|}\n',
  '{| class="wikitable"\n! scope="col" | Coluna\n|-\n| Dado\n|}\n');
keep('{| class="wikitable"\n| scope="column" | Dado\n|}\n');
keep('{| class="wikitable"\n! scope="colgroup" | Coluna\n|-\n| Dado\n|}\n');
check('Uma frase.<ref name="a">Fonte.</ref><ref name="a" / />',
  'Uma frase.<ref name="a">Fonte.</ref><ref name="a" />');
keep('<ref name="a / /">Fonte.</ref>');
keep('<nowiki><ref name="a" / /></nowiki>');
keep('<ref name="a"><ref name="b" / /></ref>');
check('<gallery>\nFile:Example.jpg|thumb|Legenda completa.\nFile:Example.jpg|thumbnail|Outra legenda.\nFile:Example.jpg|thumb\n</gallery>',
  '<gallery>\nFile:Example.jpg|Legenda completa.\nFile:Example.jpg|Outra legenda.\nFile:Example.jpg|thumb\n</gallery>');
keep('<nowiki><gallery>\nFile:Example.jpg|thumb|Legenda completa.\n</gallery></nowiki>');
const table = '{| class="wikitable" style="width:100%;min-width:900px;table-layout:fixed;font-size:90%;text-align:center;border-collapse:collapse;"\n! Coluna\n|-\n| Dado\n|}\n';
check(table, '<div style="max-width:100%;min-width:0;overflow-x:auto;">\n' + table + '</div>\n');
keep('<div>\n' + table + '</div>\n');
keep(table.replace('font-size:90%;', 'float:left;'));
keep(table.replace('900px', '300px'));
keep(table.replace('wikitable', 'infobox'));
check('{{Info/Álbum|nome=Álbum}}\n\n== Faixas ==\n1. Primeira faixa\n\n2. Segunda faixa\n',
  '{{Info/Álbum|nome=Álbum}}\n\n== Faixas ==\n# Primeira faixa\n# Segunda faixa\n');
keep('== Faixas ==\n1. Primeira faixa\n\n2. Segunda faixa\n');
keep('{{Info/Álbum|nome=Álbum}}\n\n== Faixas ==\n01. Primeira faixa\n02. Segunda faixa\n');
check('{{Info/Biografia|nome=Pessoa|ocupação=Primeira</br>Segunda}}\nTexto.',
  '{{Info/Biografia|nome=Pessoa|ocupação=Primeira<br />Segunda}}\nTexto.');
keep('{{Info/Biografia|nome=Pessoa|campo_desconhecido=Primeira</br>Segunda}}\nTexto.');
keep('{{Outro|nome=Primeira</br>Segunda}}');
const original = '[[en:Example]]\n<gallery>\nFile::Example.jpg|Legenda.\n</gallery>';
const req = api.v221StructureExternalRequests(original, cfg);
assert.equal(req.interwiki.length, 1); assert.equal(req.files.length, 1); checks += 2;
keep(original);
const external = {...req, checkedAt: '2026-01-01T00:00:00Z',
  interwiki: [{language: 'en', title: 'Example', matched: true}],
  files: [{originalTitle: 'File::Example.jpg', correctedTitle: 'File:Example.jpg', correctedExists: true, originalExists: false}]};
check(original, '<gallery>\nFile:Example.jpg|Legenda.\n</gallery>', {v221StructureExternalProof: external});
keep(original, {v221StructureExternalProof: {...external, sourceHash: 'mismatch'}});
// Presence of any opaque transclusion prevents a claim that interwiki suppression is absent.
for (const opaque of ['{{Exemplo}}', '{{#if:1|Texto|Outro}}', '{{{campo|Texto}}}',
  '{{Referências}}', '{{Portal3|Ciência}}', '{{noexternallanglinks|en}}', '{{sem interwikis}}',
  '<nowiki>{{Exemplo}}</nowiki>', '<!-- {{Exemplo}} -->', '{{Exemplo', '{{#invoke:Exemplo|main}}']) {
  const source = opaque + '\n[[en:Example]]\n';
  const requests = api.v221StructureExternalRequests(source, cfg);
  assert.equal(requests.interwiki.length, 0, 'opaque suppression contract: ' + opaque); checks++;
  keep(source, {footerProfiles: {exemplo: 'navbox'}, v221StructureExternalProof: {...requests,
    checkedAt: external.checkedAt, interwiki: external.interwiki, files: []}});
}

keep('[[en:Example#Fragment]]\n');
for (const before of ['Texto ', "n'", "''", "'''", "'''''"]) {
  const link = "[[Alvo|''rótulo'']]", source = before + link + '.';
  assert.equal(api.v221LinkEmphasisBoundarySafe(source, before.length, before.length + link.length, "''"), before === 'Texto '); checks++;
}
for (const options of [{namespaceNumber: 1}, {sectionOnly: true}, {pageRedirect: true},
  {discussionPage: true}, {v221StructureRepairs: false}, {markup: false}])
  keep('Texto [[https://example.org Página]] final.', options);
keep('{{Citar web|capitulo-url=https//example.org/a}}');
keep('{{Citar web|capítulo-url=https//example.org/a}}');
check('{{Citar livro|capítulo-url=https//example.org/a}}', '{{Citar livro|capítulo-url=https://example.org/a}}');
keep('{{Info/Biografia|website=https//example.org/a}}', {infoboxes: false});
keep('{{Info/Biografia|nome=Primeira</br>Segunda}}', {automaticFieldSyntax: false});
keep('== Leia na Wikipedia ==\n* [[Primeiro]]\n', {headings: false});
keep('Uma frase completa.<ref name="a">Fonte.</ref>.', {automaticReferenceRepairs: false});
keep('<ref name="a" / />', {automaticReferenceRepairs: false});
keep('{{Info/Cientista|nome=Pessoa|instituições=Primeira</br>Segunda}}\nTexto.');
const note = "'''''<small>Nota com [[Artigo]]</small>'''''";
check(note + '\n\n    \n\n{{Lista de mares}}\n', note + '\n\n{{Lista de mares}}\n', {footerProfiles: {'lista de mares': 'navbox'}});
keep(note + '\n\n    \n\n{{Consumidor desconhecido}}\n');
keep('<div>\n' + note + '\n\n    \n\n{{Lista de mares}}\n</div>', {footerProfiles: {'lista de mares': 'navbox'}});
keep('{{Exemplo|<gallery>\nFile:Example.jpg|thumb|Legenda completa.\n</gallery>}}');
keep('{{Citar web|url=https//example.org/a}}', {citations: false});
keep('{{Info/Biografia|website=https//example.org/a}}', {links: false});
keep('== Bibliografia adicional ==\n* Obra 1\n* Obra 2\n* Obra 3\n* Obra 4\n* Obra 5\n* Obra 6\n{{Portal3|Ciência}}\nTexto de outra função.');
const categoryOriginal = '{{Info/Biografia|nome=Pessoa|ocupação=escritor}}\n\nPessoa é um escritor.\n\n [[Categoria:Exemplos]]';
const withFooter = categoryOriginal + '\n\n{{Portal3|Biografias|Literatura}}\n';
check(withFooter, categoryOriginal.slice(0, categoryOriginal.lastIndexOf(' [[Categoria:')) + '{{Portal3|Biografias|Literatura}}\n\n [[Categoria:Exemplos]]', {biographyOriginalSource: categoryOriginal});
keep(withFooter, {biographyOriginalSource: categoryOriginal + '\n'});
keep(categoryOriginal.replace(' [[Categoria:Exemplos]]', ' Texto preformatado') + '\n\n{{Portal3|Biografias}}\n', {biographyOriginalSource: categoryOriginal.replace(' [[Categoria:Exemplos]]', ' Texto preformatado')});
keep(withFooter + 'Outro texto.', {biographyOriginalSource: categoryOriginal});
keep(withFooter.replace('{{Portal3|Biografias|Literatura}}', '{{Portal3|Biografias|Literatura}}\n{{Outro}}'), {biographyOriginalSource: categoryOriginal});
for (const prefix of ['<nowiki>\n', ' Texto literal\n', '<div>\n', '{{Exemplo|\n']) {
  const original = prefix + ' [[Categoria:Exemplos]]';
  const changed = original + '\n\n{{Portal3|Biografias}}\n';
  keep(changed, {biographyOriginalSource: original});
}
for (const caption of ['Uma legenda completa.', 'Uma legenda etc.', 'Uma legenda...', '"Uma frase."']) keep('[[Ficheiro:Example.jpg|miniatura|' + caption + ']]');
for (const gap of [' ', '  ', '\t', '\n']) keep('Texto' + gap + '<ref>Fonte.</ref>');
// Cross-product controls exercise actual implemented readers, not diagnostic inventories.
const protectedSamples = [
  'Texto [[https://example.org Página]] final.',
  '<ref>[https://example.org Fonte]]</ref>',
  'Texto [[Artigo&#124;rótulo]] final.',
  'Texto [https//example.org Fonte] final.',
  'Primeiro parágrafo.\n\n&nbsp;\n\nSegundo parágrafo.',
  'Primeiro parágrafo.\n\n\n<!-- nota -->\n\n\nSegundo parágrafo.',
  '* Primeiro\n*\n* Segundo',
  'Uma frase <small></small> com texto.',
  '== Leia na Wikipedia ==\n* [[Primeiro]]\n',
  '== Referências ==\n[[Categoria:Exemplos]]\n{{Referências}}\n',
  'Uma frase completa.<ref name="a">Fonte.</ref>.',
  '<ref name="a" / />',
  '<gallery>\nFile:Example.jpg|thumb|Legenda completa.\n</gallery>',
  table,
  '{{Info/Álbum|nome=Álbum}}\n\n== Faixas ==\n1. Primeira faixa\n\n2. Segunda faixa\n',
  '{{Info/Biografia|nome=Pessoa|ocupação=Primeira</br>Segunda}}\nTexto.'
];
for (const sample of protectedSamples) {
  for (const tag of ['nowiki', 'pre', 'syntaxhighlight', 'code', 'poem', 'blockquote', 'math'])
    keep('<' + tag + '>' + sample + '</' + tag + '>');
  keep('{{Exemplo|campo=' + sample + '}}');
  keep('<!-- ' + sample.replace(/<!--/g, 'nota ').replace(/-->/g, ' fim') + ' -->');
}
for (const protocol of ['http//', 'https//', 'htps://', 'https: //'])
  for (const host of ['example.org', 'www.example.org', 'sub.example.org'])
    for (const suffix of ['/a', '/a?x=1&y=2', '/a#seção', '/archive/http://origin.example.org/a?sig=abc']) {
      const wrong = protocol + host + suffix, right = (protocol === 'http//' ? 'http://' : 'https://') + host + suffix;
      check('{{Citar web|url=' + wrong + '}}', '{{Citar web|url=' + right + '}}');
      keep('{{Citar web|titulo=' + wrong + '}}');
      keep('{{Outro|url=' + wrong + '}}');
    }
for (const title of ['Leia na Wikipedia', 'Leia na Wikipédia', 'Leia mais na Wikipedia', 'Leia mais na Wikipédia', 'Ver Mais', 'Veja mais'])
  for (const suffix of ['', ' histórico', ': mais']) {
    const source = '== ' + title + suffix + ' ==\n* [[Primeiro]]\n';
    check(source, suffix ? source : '== Ver também ==\n* [[Primeiro]]\n');
  }
for (const tag of ['</br>', '<br/ />', '<br/ >'])
  for (const field of ['nome', 'ocupação', 'alma_mater']) {
    const source = '{{Info/Biografia|' + field + '=Primeira' + tag + 'Segunda}}\nTexto.';
    check(source, source.replace(tag, '<br />'));
    keep(source, {infoboxes: false});
  }
for (const eol of ['\n', '\r\n'])
  for (const whitespace of ['', ' ', '  ', '\t'])
    for (const empty of ['&nbsp;', '&#160;', '&#xA0;', '\u00a0']) {
      const source = 'Primeiro parágrafo.' + eol + whitespace + eol + empty + eol + whitespace + eol + 'Segundo parágrafo.';
      check(source, 'Primeiro parágrafo.' + eol + eol + 'Segundo parágrafo.');
      if (whitespace) keep(source.replace(empty, whitespace + empty));
    }
for (const attrs of ['name="a"', "name='a'", 'name=a', 'group="nota" name="a"', 'name="a" group="nota"'])
  for (const space of [' ', '  ', '\t']) {
    const source = 'Uma frase.<ref ' + attrs + ' /' + space + '/>';
    check(source, source.replace('/' + space + '/>', '/>'));
    keep('"' + source + '"');
  }
for (const text of ["[[Alvo|''rótulo'']]", "[[Alvo|'''rótulo''']]"])
  for (const before of ['Texto ', "n'", "''", "'''", "''''", "'''''"])
    for (const after of ['.', "'", "''", "'''", "''''", "'''''"]) {
      const source = before + text + after, delimiter = text.includes("'''") ? "'''" : "''";
      assert.equal(api.v221LinkEmphasisBoundarySafe(source, before.length, before.length + text.length, delimiter),
        before === 'Texto ' && after === '.', source); checks++;
    }
// Restrictive ownership and heading-dependency controls retain ambiguous source verbatim.
for (let depth = 2; depth <= 6; depth++) {
  const eq = '='.repeat(depth);
  check(eq + ' Leia na Wikipédia ' + eq + '\n* [[Primeiro]]\n', eq + ' Ver também ' + eq + '\n* [[Primeiro]]\n');
  for (let otherDepth = 2; otherDepth <= 6; otherDepth++) {
    const other = '='.repeat(otherDepth);
    keep(eq + ' Leia na Wikipédia ' + eq + '\n* [[Primeiro]]\n' + other + ' Ver também ' + other + '\n* [[Segundo]]\n');
    keep(eq + ' Leia na Wikipédia ' + eq + '\n* [[Primeiro]]\n' + other + ' Veja mais ' + other + '\n* [[Segundo]]\n');
  }
  for (const anchor of ['Leia_na_Wikipédia', 'Leia na Wikipédia', 'Leia_na_Wikip%C3%A9dia', 'Leia_na_Wikip.C3.A9dia', 'Leia_na_Wikip%c3%a9dia'])
    keep('Veja [[#' + anchor + '|seção]].\n\n' + eq + ' Leia na Wikipédia ' + eq + '\n* [[Primeiro]]\n');
}
for (const value of ['{{Citar web|título=Primeira</br>Segunda}}', '<ref>Primeira</br>Segunda</ref>', '[[Primeira|Primeira</br>Segunda]]', '<span title="Primeira</br>Segunda">Nome</span>', '[https://example.org Primeira</br>Segunda]'])
  keep('{{Info/Biografia|nome=' + value + '}}\nTexto.');
keep('<ref>{{Info/Biografia|nome=Primeira</br>Segunda}}</ref>');
const bibliographyTail = '* Obra 1\n* Obra 2\n* Obra 3\n* Obra 4\n* Obra 5\n* Obra 6\n';
for (const owner of ['<div>\n', '{|\n|\n', '<ref>\n']) {
  keep(owner + '== Leia na Wikipédia ==\n* [[Primeiro]]\n');
  keep(owner + '== Bibliografia adicional ==\n' + bibliographyTail);
  keep('{{Info/Álbum|nome=Álbum}}\n\n' + owner + '== Faixas ==\n1. Primeira faixa\n2. Segunda faixa\n');
  keep(owner + '== Referências ==\n[[Categoria:Exemplos]]\n{{Referências}}\n');
}
for (const owner of ['ref', 'references']) {
  keep('<' + owner + '><gallery>\nFile:Example.jpg|thumb|Legenda completa.\n</gallery></' + owner + '>');
  const source = '<' + owner + '><gallery>\nFile::Example.jpg|Legenda.\n</gallery></' + owner + '>';
  const requests = api.v221StructureExternalRequests(source, cfg);
  assert.equal(requests.files.length, 0); checks++;
}
for (const wrap of [s => '{{Exemplo|campo=' + s + '}}', s => '[[Artigo|' + s + ']]', s => '[https://example.org ' + s + ']']) {
  keep(wrap('{{Citar web|url=https//example.org/a}}'));
  keep(wrap('\n{| class="wikitable"\n! scope="column" | Coluna\n|-\n| Dado\n|}\n'));
  keep(wrap('<gallery>\nFile:Example.jpg|thumb|Legenda completa.\n</gallery>'));
  const source = wrap('<gallery>\nFile::Example.jpg|Legenda.\n</gallery>');
  assert.equal(api.v221StructureExternalRequests(source, cfg).files.length, 0); checks++;
}
check('{{Citar web|url=https//example.org/a|título={{lang|en|Title}}}}', '{{Citar web|url=https://example.org/a|título={{lang|en|Title}}}}');
check('<ref>{{Citar web|url=https//example.org/a}}</ref>', '<ref>{{Citar web|url=https://example.org/a}}</ref>');
const scopeTable = '{| class="wikitable"\n! scope="column" | Coluna\n|-\n| Dado\n|}\n';
check(scopeTable, scopeTable.replace('scope="column"', 'scope="col"'));
check('<div>\n' + scopeTable + '</div>', '<div>\n' + scopeTable.replace('scope="column"', 'scope="col"') + '</div>');
keep(scopeTable.replace('Dado', '{{Exemplo}}'));
check('<div><gallery>\nFile:Example.jpg|thumb|Legenda completa.\n</gallery></div>', '<div><gallery>\nFile:Example.jpg|Legenda completa.\n</gallery></div>');
console.log(JSON.stringify({kind: 'actual-module-unit-tests', checks, result: 'passed',
  baseline: '2.20.0', candidateEndToEnd: false}));
