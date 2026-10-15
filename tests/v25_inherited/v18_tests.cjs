'use strict';
const qa=require('./harness.cjs'),a=qa.api,old=require('fixtures/baselines/RevisaWiki_v1_7.js'),assert=require('node:assert/strict'),fs=require('node:fs');
const tests=[],base={endMatter:false,markup:false};
function test(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.stack});}}
const run=(s,o={})=>a.cleanup(s,{...base,...o});
// Catalog values stay identical. Their internal dictionaries now deliberately
// have no Object.prototype so unknown names cannot become inherited functions.
const catalogValues=value=>JSON.parse(JSON.stringify(value));
test('version and inherited catalog values unchanged',()=>{assert.equal(a.version,qa.expectedVersion);assert.deepEqual(catalogValues(a.translationRules),catalogValues(old.translationRules));for(const [key,p]of Object.entries(old.infoboxCatalog)){if(!p.dependencies.some(d=>d.title==='Módulo:Template wrapper'))assert.deepEqual(catalogValues(a.infoboxCatalog[key]),catalogValues(p));else assert(a.infoboxCatalog[key].partial);}assert(a.infoboxCatalog['info/astronauta'].accepted.includes('nascimento_data'));assert.deepEqual(catalogValues(a.templateCatalog),catalogValues(old.templateCatalog));});
for(const [s,expected] of [
 ['{{Navbox|nome=X|nome=X}}','{{Navbox|nome=X}}'],
 ['{{Navbox|nome=A|nome=A|nome=B}}','{{Navbox|nome=A|nome=A|nome=B}}'],
 ['{{Navbox|nome=A|NOME=B}}','{{Navbox|nome=A|NOME=B}}'],
 ['{{Navbox|NOME=A}}','{{Navbox|nome=A}}'],
 ['{{Navbox|campo_invalido=}}','{{Navbox}}'],
 ['{{Navbox|campo_invalido=Valor}}','{{Navbox|campo_invalido=Valor}}'],
 ['{{Navbox|imagem=}}','{{Navbox|imagem=}}'],
 ['{{Info/Biografia|campo_futuro=}}','{{Info/Biografia|campo_futuro=}}'],
 ['{{Futuro|NOME=A|campo_futuro=}}','{{Futuro|NOME=A|campo_futuro=}}'],
 ['{{Navbox|nome=A|nome= A}}','{{Navbox|nome= A}}'],
 ['{{Navbox|1=child|1=child}}','{{Navbox|1=child}}'],
 ['{{Navbox|1=child|2=child}}','{{Navbox|1=child|2=child}}'],
 ['{{Navbox|nome=A|título={{Pequeno|A=B}}|nome=A}}','{{Navbox|título={{Pequeno|A=B}}|nome=A}}']
])test('automatic parameters '+s,()=>{const r=run(s);assert.equal(r.text,expected);assert.equal(run(r.text).text,r.text);});
test('accepted native citation aliases retained',()=>{const s='{{citar web|titulo=X|lang=en|url=https://example.org}}';assert.equal(run(s).text,s);});
test('parameter automation switches work separately',()=>{for(const [option,s] of [['automaticParameterNames','{{Navbox|NOME=A}}'],['automaticEmptyParameters','{{Navbox|invalido=}}'],['automaticParameterDuplicates','{{Navbox|nome=A|nome=A}}']])assert.equal(run(s,{[option]:false}).text,s);});
test('literal examples and protected comments unchanged',()=>{const s='<nowiki>{{Navbox|NOME=A|invalido=}}</nowiki>\n<!-- {{Navbox|NOME=X}} -->\n{{Navbox|NOME=B}}';assert.equal(run(s).text,s.replace('{{Navbox|NOME=B}}','{{Navbox|nome=B}}'));});
test('positional parameters never removed as empty names',()=>{const s='{{Portal3|Brasil||Cinema}}';assert.equal(run(s).text,s);});
test('unknown filled values are not removed',()=>{const s='{{Navbox|invalido={{Nome|X=Y}}|future=A}}';assert.equal(run(s).text,s);});
for(const group of ['', 'nota'])test('identical anonymous refs reused '+group,()=>{const g=group?' group="nota"':'';const s='A.<ref'+g+'>Fonte p. 5.</ref> B.<ref'+g+'>Fonte p. 5.</ref>';const r=run(s);assert.equal(r.text,'A.<ref name="ref-auto-1"'+g+'>Fonte p. 5.</ref> B.<ref name="ref-auto-1"'+g+' />');assert.equal(run(r.text).text,r.text);assert(!a.referenceAudit(r.text).some(f=>f.severity==='error'));});
test('interleaved families receive non-overlapping edits',()=>{const r=run('<ref>A</ref><ref>B</ref><ref>A</ref><ref>B</ref>');assert.equal((r.text.match(/name="ref-auto-1"/g)||[]).length,2);assert.equal((r.text.match(/name="ref-auto-2"/g)||[]).length,2);assert.equal(run(r.text).text,r.text);});
test('existing ref names cannot collide',()=>{assert(run('<ref name="ref-auto-1">Z</ref><ref>A</ref><ref>A</ref>').text.includes('name="ref-auto-2"'));});
test('definition stays at the first call',()=>{const r=run('A.<ref>F</ref> B.<ref>F</ref> C.<ref>F</ref>');assert(r.text.startsWith('A.<ref name="ref-auto-1">F</ref>'));assert.equal((r.text.match(/ \/>/g)||[]).length,2);});
for(const s of ['<ref>F p. 5</ref><ref>F p. 6</ref>','<ref>F</ref><ref group="nota">F</ref>','<ref>F</ref>{{Referências}}<ref>F</ref>','{{Info/Biografia|notas=<ref>F</ref>}}<ref>F</ref>','<ref name="{{Nome}}">Z</ref><ref>F</ref><ref>F</ref>','<ref follow="x">F</ref><ref>F</ref>','<ref>{{sfn|Silva|2020}}</ref><ref>{{sfn|Silva|2020}}</ref>'])test('ref boundaries '+s,()=>{const options={referenceColumns:false,references:s.includes('sfn')?false:true};assert.equal(run(s,options).text,old.cleanup(s,{...base,...options}).text);});
test('dynamic person name does not block anonymous refs',()=>{assert(run('{{Info/Biografia|nome={{PAGENAME}}}}<ref>F</ref><ref>F</ref>').text.includes('ref-auto-1'));});
test('section and opt-out retain anonymous refs',()=>{const s='<ref>F</ref><ref>F</ref>';assert.equal(run(s,{sectionOnly:true}).text,s);assert.equal(run(s,{automaticIdenticalReferences:false}).text,s);});
test('different citation pages not merged',()=>{assert(!run('<ref>{{Citar livro|titulo=T|p=5}}</ref><ref>{{Citar livro|titulo=T|p=6}}</ref>').text.includes('RevisaWiki-auto'));});
for(const [before,after] of [['a','á'],['á','a'],['😀','😃'],['\uD800','x'],['a😀b','a😃b'],['ABC','XYZ'],['','中文'],['á中文😀','á中文😀'],['\r\n','\n']])test('UTF-8 '+JSON.stringify([before,after]),()=>{const m=a.byteMetrics(before,after);assert.equal(m.before,Buffer.byteLength(before));assert.equal(m.after,Buffer.byteLength(after));assert.equal(m.delta,Buffer.byteLength(after)-Buffer.byteLength(before));assert(m.consistent);});
test('zero net bytes still has changed-byte volume',()=>{const m=a.byteMetrics('1234','5678');assert.equal(m.delta,0);assert.equal(m.changed,8);});
test('fallback without TextEncoder',()=>{const saved=global.TextEncoder;try{global.TextEncoder=undefined;for(const text of ['á','😀','\uD800','中文'])assert.equal(a.byteMetrics('',text).after,Buffer.byteLength(text));}finally{global.TextEncoder=saved;}});
const minorOptions={...base,namespaceNumber:0,minorBaseConfirmed:true};
test('link formatting qualifies when baseline confirmed',()=>{const b='[[Ecossistema|ecossistema]]';assert(a.minorEligibility(b,run(b).text,minorOptions).eligible);});
test('identical refs can be minor without losing sources',()=>{const b='<ref>Fonte</ref><ref>Fonte</ref>';assert(a.minorEligibility(b,run(b).text,minorOptions).eligible);});
test('missing baseline never permits minor',()=>{const b='[[Ecossistema|ecossistema]]';assert(!a.minorEligibility(b,run(b).text,{...minorOptions,minorBaseConfirmed:false}).eligible);});
test('zero-net content replacement is not minor',()=>{assert(!a.minorEligibility('Foi em 2025.','Foi em 2026.',minorOptions).eligible);});
test('activating invalid parameter is not minor',()=>{const b='{{Navbox|NOME=A}}';assert(!a.minorEligibility(b,run(b).text,minorOptions).eligible);});
test('facts, destinations, sources and new templates are not minor',()=>{for(const [b,c] of [['[[A]]','[[B]]'],['<ref>F</ref>','<ref>G</ref>'],['x','x{{Portal3|Brasil}}'],['<ref>{{citar web|url=https://a.test}}</ref>','<ref>{{citar web|url=https://b.test}}</ref>']])assert(!a.minorEligibility(b,c,minorOptions).eligible);});
test('size limit uses added plus removed',()=>{const b=Array(50).fill('[[Ecossistema|ecossistema]]').join('\n'),c=run(b).text,r=a.minorEligibility(b,c,minorOptions);assert(r.metrics.changed>500);assert(!r.eligible);});
test('hunk count, section and namespace restrictions',()=>{const b='[[Ecossistema|ecossistema]]',c=run(b).text;for(const o of [{sectionOnly:true},{namespaceNumber:2},{metrics:{changed:1,hunks:6,consistent:true}}])assert(!a.minorEligibility(b,c,{...minorOptions,...o}).eligible);});
const disabled={automaticIdenticalReferences:false,automaticParameterDuplicates:false,automaticParameterNames:false,automaticEmptyParameters:false};
test('disabled rules reproduce v1.7 on nested code',()=>{const s='{{Info/Biografia|nome=A|data_nascimento={{Dni|1|1|2000|si}}}}\nA.<ref>{{citar web|titulo=X|url=https://example.org}}</ref>\n{|\n| [[Category:X]]\n|}\n<gallery>File:X.jpg|A</gallery>\n{{Referências}}';assert.equal(a.cleanup(s,disabled).text,old.cleanup(s,disabled).text);});
test('memo remains coherent over changing and reverting inputs',()=>{const values=['[[Category:x]]\n[[Categoria:X]]','<nowiki>{{Cite web}}</nowiki>\n[[Category:x]]','{{Navbox|nome=X}}','<ref>A</ref><ref>B</ref>'];for(let i=0;i<40;i++){const s=values[i%values.length];assert.equal(a.cleanup(s,disabled).text,old.cleanup(s,disabled).text);assert(a.parserCacheStatus().accountingConsistent);}});
test('cache history is bounded',()=>{for(let i=0;i<2400;i++)a.cleanup('{{Navbox|nome=unique'+i+'}}',base);const s=a.parserCacheStatus();assert(s.accountingConsistent);assert(s.estimatedBytes<=s.maximumEstimatedBytes);assert(s.smallEntries<=2048);assert(s.partsEntries<=4096);});
const report={version:a.version,scriptSha256:qa.sha256,passed:tests.filter(t=>t.passed).length,failed:tests.filter(t=>!t.passed).length,tests};fs.writeFileSync(__dirname+'/v18_results.json',JSON.stringify(report,null,2)+'\n');for(const t of tests.filter(t=>!t.passed))console.log(t.name+'\n'+t.error);console.log(JSON.stringify({passed:report.passed,failed:report.failed}));process.exitCode=report.failed?1:0;
