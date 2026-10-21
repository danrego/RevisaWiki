const qa = require('./harness.cjs');
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const apiPath = qa.apiPath;
const api = require(apiPath);

// Additive causal metadata is authored from the supplied source/options/expected.
// It never changes a product option, fixture endpoint or proof.
function cc9Pair(report,id,option,role,source,onOptions,offOptions,onExpected,offExpected,proof=null){
 const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
 const h=v=>require('node:crypto').createHash('sha256').update(typeof v==='string'?v:JSON.stringify(canon(v))).digest('hex');
 const keys=[...new Set([...Object.keys(onOptions),...Object.keys(offOptions)])].sort(),changed=keys.filter(k=>JSON.stringify(canon(onOptions[k]))!==JSON.stringify(canon(offOptions[k])));
 require('node:assert/strict').deepEqual(changed,[option]);require('node:assert/strict').equal(onOptions[option],true);require('node:assert/strict').equal(offOptions[option],false);
 (report.causalControls??=[]).push({schemaVersion:1,id,option,role,sourceSha256:h(source),onOptionsSnapshot:canon(onOptions),offOptionsSnapshot:canon(offOptions),onOptionsSha256:h(onOptions),offOptionsSha256:h(offOptions),onExpectedSha256:h(onExpected),offExpectedSha256:h(offExpected),proofSha256:proof?h(proof):null,identicalProofAcrossPair:!!proof,writerPositiveCredit:0});
}

let passed = 0;
const failures = [];
const results = [];
function test(name, run) {
    try {run(); passed++; results.push({name, passed: true});}
    catch (error) {failures.push({name, error: error.stack}); results.push({name, passed: false});}
}
const columnOnly = {...Object.fromEntries(Object.keys(api.defaults).map(key => [key, false])), endMatter: true, endMatterColumns: true};
const open = '{{Div col|colunas=2}}';
const close = '{{Div col fim}}';
const extraBooks='* Livro C\n* Livro D\n* Livro E\n* Livro F\n';
const extraLinks='* [https://c.example C]\n* [https://d.example D]\n* [https://e.example E]\n* [https://f.example F]\n';
const sixBooks='* Livro A\n* Livro B\n'+extraBooks;
const sixLinks='* [https://a.example A]\n* [https://b.example B]\n'+extraLinks;
function wraps(heading, entries, prefix = '', suffix = '') {
    const source = `== ${heading} ==\n${prefix}${entries}${suffix}`;
    const result = api.cleanup(source, columnOnly);
    assert.equal(result.text, `== ${heading} ==\n${prefix}${open}\n${entries.replace(/\n$/, '')}\n${close}\n${suffix}`);
    assert.equal(api.cleanup(result.text, columnOnly).text, result.text, 'columns must be idempotent');
    assert.deepEqual(api.preservationAudit(source, result.text), [], 'all citation URLs/images/prose must be retained');
    return result.text;
}
function unchanged(source) {
    assert.equal(api.cleanup(source, columnOnly).text, source);
}
test('version and default auto-column switch', () => {
    assert.equal(api.version, qa.expectedVersion); assert.equal(api.defaults.endMatterColumns, true);
});
test('additional reading six-entry citation list in two columns', () => wraps('Leitura adicional', '* {{Citar livro|título=Livro A|autor=Ana|ano=2001}}\n* {{Citar livro|título=Livro B|autor=Bruno|ano=2002}}\n'+extraBooks));
test('six-entry external list with Commons kept before and navbox/categories after', () => wraps('Ligações externas', sixLinks, '{{Commonscat|Exemplo}}\n', '{{Portal3|História}}\n{{Império Espanhol}}\n[[Categoria:História]]\n'));
test('six-entry bibliography is eligible for two columns',()=>wraps('Bibliografia',sixBooks));
test('six-entry complementary reading is eligible for two columns',()=>wraps('Leitura complementar',sixBooks));
test('two eligible sections remain independent', () => {
    const source = '== Leitura adicional ==\n'+sixBooks+'== Ligações externas ==\n'+sixLinks+'{{Controle de autoridade}}';
    const result = api.cleanup(source, columnOnly).text;
    assert.equal(result.split(open).length - 1, 2); assert.equal(result.split(close).length - 1, 2);
    assert(result.includes(close + '\n== Ligações externas =='));
    assert(result.includes(close + '\n{{Controle de autoridade}}'));
});
test('single entry never gains columns', () => {
    unchanged('== Leitura adicional ==\n* Livro único\n');
    unchanged('== Ligações externas ==\n* [https://a.example Página]\n');
});
test('reference notes and See Also lists are not automatically made into columns', () => {
    for (const title of ['Referências', 'Ver também', 'Notas']) unchanged(`== ${title} ==\n${sixBooks}`);
});
test('existing layouts including valid fixed three-column style preserved', () => {
    for (const [start, end] of [['{{Div col|colunas=3}}', close], ['{{Div col|colunas=2|colwidth=30em}}',close], ['{{InícioRef|2}}', '{{-fim}}'], ['<div style="column-count:3">', '</div>'], ['{{Colunas-lista|', '}}']]) {
        unchanged(`== Leitura adicional ==\n${start}\n* Livro A\n* Livro B\n${end}\n`);
    }
    assert.equal(api.cleanup('{{Referências|estilo=column-count:3;}}').text, '{{Referências|estilo=column-count:3;}}');
});
test('protected literal comments ref bodies and wiki tables never receive columns', () => {
    for (const protect of [s => '<nowiki>' + s + '</nowiki>', s => '<pre>' + s + '</pre>', s => '<!--' + s + '-->', s => '<ref>' + s + '</ref>', s => '{|\n|' + s + '\n|}']) {
        const source = protect('== Ligações externas ==\n'+sixLinks);
        const result = api.cleanup(source, columnOnly).text;
        assert(!result.includes(open));
        assert(result.includes(source), 'protected source body must be retained exactly');
    }
});
test('bullets with nested citation/link values preserve all source values', () => {
    const source = '== Leitura adicional ==\n* {{Citar livro|título={{Lang|es|Cortés}}|url=https://a.example|isbn=123}}\n* {{Citar livro|título=Livro B|autor=[[Ana]]|url=https://b.example}}\n'+extraBooks;
    const result = api.cleanup(source, columnOnly).text;
    assert(result.includes(open)); assert(result.includes('* {{Citar livro|título={{Lang|es|Cortés}}|url=https://a.example|isbn=123}}'));
    assert(result.includes('* {{Citar livro|título=Livro B|autor=[[Ana]]|url=https://b.example}}'));
    assert.deepEqual(api.preservationAudit(source, result), []);
});
test('paragraphs and headings are never swallowed by generated wrappers', () => {
    const source = '== Ligações externas ==\nIntrodução em prosa.\n'+sixLinks+'Conclusão em prosa.\n== Outra seção ==\nConteúdo posterior.';
    const result = api.cleanup(source, columnOnly).text;
    assert(result.includes('Introdução em prosa.')); assert(result.includes('Conclusão em prosa.')); assert(result.includes('== Outra seção ==\nConteúdo posterior.'));
    for (const match of result.matchAll(/\{\{Div col\|colunas=2\}\}([\s\S]*?)\{\{Div col fim\}\}/g)) {
        assert(!match[1].includes('Introdução em prosa.')); assert(!match[1].includes('Conclusão em prosa.')); assert(!match[1].includes('== Outra seção =='));
    }
});
test('refs retain names positions and definitions inside bibliography entries', () => {
    const source = 'A.<ref name="fonte">Fonte original.</ref>\n== Leitura adicional ==\n* Livro A.<ref name="outra">Outra fonte.</ref>\n* Livro B.<ref name="fonte" />\n'+extraBooks+'{{Referências}}\n';
    const result = api.cleanup(source, columnOnly).text;
    assert(result.startsWith('A.<ref name="fonte">Fonte original.</ref>\n'));
    assert(result.includes('* Livro A.<ref name="outra">Outra fonte.</ref>\n* Livro B.<ref name="fonte" />'));
    assert.deepEqual(api.referenceAudit(result), api.referenceAudit(source));
    assert(result.endsWith('{{Referências}}\n'));
});
test('legacy manual external-column proposal remains usable when auto mode disabled', () => {
    const source = '== Ligações externas ==\n'+sixLinks+'{{Portal3|Brasil}}';
    const result = api.cleanup(source, {endMatterColumns: false}); assert.equal(result.text, source);
    const proposal = result.suggestions.find(p => p.id.startsWith('external-columns')); assert(proposal);
    const applied = api.applySuggestion(source, proposal, 0); assert(applied.includes(open)); assert(applied.includes(close + '\n{{Portal3'));
});
for(const option of ['externalLinkColumns','review'])test('cc9-manual-external-columns-single-off-'+option,()=>{
 const source='== Ligações externas ==\n'+sixLinks+'{{Portal3|Brasil}}',onOptions={...api.defaults,endMatterColumns:false},offOptions={...onOptions,[option]:false},expected='== Ligações externas ==\n'+open+'\n'+sixLinks.replace(/\n$/,'')+'\n'+close+'\n{{Portal3|Brasil}}';
 const on=api.calculate({kind:'adjust',source,options:onOptions}),off=api.calculate({kind:'adjust',source,options:offOptions}),proposal=on.suggestions.find(p=>p.id.startsWith('external-columns'));
 assert.equal(on.text,source);assert.equal(off.text,source);assert(proposal);assert.equal(api.applySuggestion(source,proposal,0),expected);assert.equal(off.suggestions.some(p=>p.id.startsWith('external-columns')),false);
 assert.equal(onOptions.endMatterColumns,false);assert.equal(offOptions.endMatterColumns,false);const causal={};cc9Pair(causal,'manual-external-columns-'+option,option,'actual-optional-proposal-and-explicit-choice',source,onOptions,offOptions,expected,source);results.push({name:'cc9-'+option+'-causal-binding',passed:true,...causal});
});
test('ignored native column parameter removed automatically, short lists stay uncolumned', () => {
    for (const source of ['{{Referências|col=3}}', '{{Referências|col=2|colwidth=30em}}']) {
        const result = api.cleanup(source); assert.equal(result.text, '{{Referências}}');
        assert(!result.text.includes('column-count:3'));
        const manual = api.cleanup(source, {referenceColumns:false}); assert.equal(manual.text, source);
        const proposal = manual.suggestions.find(p => p.choices.some(choice => choice.label === 'Usar duas colunas nas referências'));
        assert(proposal, 'legacy renderer needs explicit review choice');
        const choice = proposal.choices.findIndex(item => item.label === 'Usar duas colunas nas referências');
        const applied = api.applySuggestion(source, proposal, choice);
        assert(applied.includes('column-count:2')); assert(!applied.includes('column-count:3')); assert(!/\|col(?:width)?=/.test(applied));
        const plainChoice = proposal.choices.findIndex(item => item.label === 'Remover configuração antiga e usar colunas automáticas');
        assert(plainChoice >= 0); assert.equal(api.applySuggestion(source, proposal, plainChoice), '{{Referências}}');
    }
});
test('new column option disabled has no accidental effect', () => {
    const source = '== Leitura adicional ==\n'+sixBooks+'== Ligações externas ==\n'+sixLinks;
    assert.equal(api.cleanup(source, {...columnOnly, endMatterColumns: false}).text, source);
});
for(const heading of ['Ligações externas','Leitura adicional','Bibliografia','Leitura complementar']) for(let n=0;n<6;n++) {
    test(heading+': '+n+' entries never gain or propose automatic columns',()=>{
        const items=Array.from({length:n},(_,i)=>'* [https://example.org/'+i+' Entrada '+i+']\n').join('');
        const source='== '+heading+' ==\n'+items;
        unchanged(source);
        assert.equal(api.externalColumnsSuggestions(source,{...api.defaults}).length,0);
        assert(!api.cleanup(source,{endMatterColumns:false}).suggestions.some(p=>p.id.startsWith('external-columns')));
    });
}
test('nested bullets do not inflate five top-level entries to six',()=>{
    const source='== Ligações externas ==\n'+Array.from({length:5},(_,i)=>'* [https://example.org/'+i+' Entrada '+i+']\n** Explicação da entrada.\n').join('');
    unchanged(source);
    assert.equal(api.externalColumnsSuggestions(source,{...api.defaults}).length,0);
});
test('separate short lists cannot combine across prose to meet the threshold',()=>{
    const threeLinks=Array.from({length:3},(_,i)=>'* [https://example.org/'+i+' Entrada '+i+']\n').join('');
    const source='== Ligações externas ==\n'+threeLinks+'Explicação entre as listas.\n'+threeLinks;
    unchanged(source);
});
for(const heading of ['Ligações externas','Bibliografia','Leitura adicional','Leitura complementar']) for(let n=1;n<6;n++) {
    test(heading+': simple old two-column wrapper around '+n+' items is safely removed',()=>{
        const items=Array.from({length:n},(_,i)=>'* Entrada '+i+'\n').join('');
        const source='== '+heading+' ==\n'+open+'\n'+items+close+'\n';
        const result=api.cleanup(source,columnOnly);
        assert.equal(result.text,'== '+heading+' ==\n\n'+items+'\n');
        assert.equal(api.cleanup(result.text,columnOnly).text,result.text);
        assert.deepEqual(api.preservationAudit(source,result.text),[]);
    });
}
test('an existing six-entry two-column wrapper remains intact',()=>{
    unchanged('== Ligações externas ==\n'+open+'\n'+sixLinks+close+'\n');
});
test('removing a simple short wrapper retains its child bullets byte-for-byte',()=>{
    const items='* Livro A\n** Explicação A\n* Livro B\n';
    const source='== Leitura adicional ==\n'+open+'\n'+items+close+'\n';
    assert.equal(api.cleanup(source,columnOnly).text,'== Leitura adicional ==\n\n'+items+'\n');
});
test('nested column layouts are not flattened by the minimum-entry rule',()=>{
    const source='== Leitura adicional ==\n'+open+'\n'+open+'\n* Livro A\n* Livro B\n'+close+'\n'+close+'\n';
    unchanged(source);
});
const report = {version: api.version, passed, failed: failures.length, failures, results,
    scriptSha256: require('node:crypto').createHash('sha256').update(fs.readFileSync(apiPath)).digest('hex')};
fs.writeFileSync(path.join(__dirname, 'endmatter_columns_results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2)); process.exitCode = failures.length ? 1 : 0;
