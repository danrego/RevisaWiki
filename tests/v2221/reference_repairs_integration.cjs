'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {api,cfg,sha,baselineSha256,helperSha256}=require('./reference_repairs_harness.cjs').load();
let checks=0,calculations=0;const cases=[];global.fetch=()=>{throw Error('Network not allowed in local integration');};
function run(id,source,verify,options={}){
 const settings={...cfg,...options},r=api.calculate({kind:'adjust',source,originalSource:source,options:settings});calculations++;
 const safety=api.v219AutomaticResultSafety(source,r);checks++;assert.equal(safety.accepted,true,id+' source safety');
 const anchors=api.v2217AnchorRawAudit(source,r.text,settings);checks++;assert.equal(anchors.length,0,id+' anchor retention');
 checks++;verify(r.text,r);
 const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:settings});calculations++;
 checks++;assert.equal(again.text,r.text,id+' full action idempotence');
 const sourceGraph=api.v219NativeReferenceObserver(source),outputGraph=api.v219NativeReferenceObserver(r.text);
 cases.push({id,inputSha256:sha(source),outputSha256:sha(r.text),changes:r.changes,sourceReferences:sourceGraph.refs.length,outputReferences:outputGraph.refs.length,safety:safety.code});
}
const refs='Texto.<ref>Fonte preservada.</ref>',note='Texto.<ref group="nota">Nota preservada.</ref><ref>Fonte preservada.</ref>';
for(const call of ['{{Reflist|30em}}','{{Reflist|colwidth=35em}}','{{Referências|col=2}}','<references />'])run('simple-collector-'+cases.length,refs+'\n== Referências ==\n'+call,t=>assert.equal(t,refs+'\n\n{{Referências}}'));
for(const call of ['{{Colunas-lista|2|2=<references />}}','<div style="column-count:2"><references /></div>'])run('collector-only-wrapper-'+cases.length,refs+'\n== Referências ==\n'+call,t=>assert.equal(t,refs+'\n\n{{Referências}}'));
run('foreign-literal-ref-attributes','A<ref nom="a" groupe="nota">Nota preservada.</ref> B<ref nom="a" groupe="nota" />\n{{Notas}}',t=>assert(t.includes('name="a" group="nota"')&&t.includes('Nota preservada.')&&!t.includes('nom=')));
for(const tail of ['{{Notas}}\n{{Referências}}','{{Referências}}\n{{Notas}}','{{Notas}}\n{{Notelist|30em}}\n{{Referências}}\n{{Reflist|30em}}'])run('compatible-note-pair-'+cases.length,note+'\n'+tail,t=>assert(t.includes('{{Notas e referências}}')&&!t.includes('{{Reflist')));
run('single-group-projection-alignment','Texto.<ref group="x">Nota.</ref><ref>Fonte.</ref>\n== Notas ==\n{{Reflist|group=x}}\n{{Reflist}}\n',t=>assert(t.includes('group="nota"')&&t.includes('{{Notas e referências}}')&&!t.includes('group="x"')&&!t.includes('{{Referências|nível=0}}')));
for(const title of ['Exemplo',"Author's example\n"])run('foreign-citation-collector-spacing-recovery-'+cases.length,'Texto.<ref>{{citation|journal=Revista Exemplo\n|volume=8|issue=3|year=2024|pages=19–30\n|title='+title+'|first=Nome|last=Autor|first2=Outro|last2=Autor}}</ref>\n \n{{Referências}}\nObra bibliográfica.',t=>assert(t.includes('{{Referências}}\n\nObra bibliográfica.')&&t.includes('Revista Exemplo')&&t.includes(title.trim())&&t.includes('19–30')));
run('unknown-infobox-independent', '{{Info/Modelo desconhecido|nome=Tema}}\n'+note+'\n{{Notas}}\n{{Reflist|30em}}',t=>assert(t.includes('Tema')&&t.includes('Nota preservada.')&&!t.includes('{{Notas e referências}}')&&!t.includes('{{Reflist|30em}}')));
run('unknown-citation-key-independent', 'Texto.<ref>{{Citar web|url=https://example.org/fonte|título=Fonte|campo_desconhecido=Dado explícito}}</ref>\n{{Reflist|30em}}',t=>assert(t.includes('campo_desconhecido=Dado explícito')&&t.includes('{{Referências}}')));
for(const [name,group]of [['Cafe\u0301',''],['Café','Cafe\u0301']]){
 const source='Texto.<ref name="Café"'+(group?' group="Café"':'')+'>Fonte preservada.</ref> Outro.<ref name="'+name+'"'+(group?' group="'+group+'"':'')+'/>\n{{Referências}}';
 run('native-unicode-identity-'+cases.length,source,t=>{const o=api.v219NativeReferenceObserver(t);assert.equal(o.refs.length,2);assert.equal(o.refs.filter(r=>r.body===null).length,1);assert(t.includes('Fonte preservada.'));});
}
run('common-definition-bank', 'Texto.<ref name="a"/>\n<references><ref name="a">Fonte preservada.</ref></references>',t=>assert(t.includes('Texto.<ref name="a"')&&t.includes('refs=<ref name="a">Fonte preservada.</ref>')));
run('common-bank-and-notes', 'Texto.<ref name="a"/><ref group="nota">Nota.</ref>\n{{Notas}}\n{{Reflist|30em|refs=<ref name="a">Fonte preservada.</ref>}}',t=>assert(t.includes('{{Notas e referências|refs=')&&t.includes('Fonte preservada.')&&t.includes('Texto.<ref name="a"')));
run('translated-bank-key-activation','Texto.<ref name="fonte" />\n\n{{Referências|referências=<ref name="fonte">Fonte preservada.</ref>}}',t=>assert(t.includes('|refs=<ref name="fonte">Fonte preservada.</ref>')&&t.includes('Texto.<ref name="fonte"')));
run('named-efn-ordinary-group-collector','Texto{{Efn|name=nota-a|grupo=nota|reference=Explicação preservada.}}\n\n{{Notas}}',t=>assert(t.includes('{{Efn|name=nota-a|grupo=nota|reference=Explicação preservada.}}')&&t.includes('{{Referências}}')));
run('complete-citations-visual-separator','Texto.<ref>{{citar livro|título=Livro de exemplo|ano=2024|editora=Editora Exemplo}}{{citar web|título=Página de exemplo|url=https://example.org/fonte}}</ref>',t=>assert(t.includes('Editora Exemplo}}<br />{{citar web|título=Página de exemplo')));
run('functional-note-bank-kept', refs+'\n{{Notas|refs=<ref name="n">Nota bancária.</ref>}}\n{{Reflist|30em}}',t=>assert(t.includes('Nota bancária.')&&t.includes('refs=')&&!t.includes('{{Notas e referências}}')&&t.includes('{{Referências|nível=0}}')));
run('r-helper-bank-keeps-locator', 'Texto.{{R|a|p=7}}\n{{Referências|refs=<ref name="a">Fonte preservada.</ref>}}',t=>assert(t.includes('|p=7')&&t.includes('name="a"')&&t.includes('Fonte preservada.')));
run('numeric-r-helper-bank', 'Texto.{{r|1}}\n\n{{Referências|refs=<ref name="1">{{cite web|url=https://example.org/fonte|title=Fonte de exemplo|access-date=2026-11-01}}</ref>}}',t=>assert(t.includes('{{r|ref-1}}')&&t.includes('name="ref-1"')&&t.includes('https://example.org/fonte')&&t.includes('2026-11-01')));
run('native-positional-reference-title-technical-exception', 'Texto.<ref>{{Citar web|title=T|website=Site|publisher=Entidade|fechaacceso=2024-02-03}}</ref>\n{{Referências|30em}}',t=>assert(t.includes('{{Referências|30em}}')&&t.includes('T')&&t.includes('Site')&&t.includes('Entidade')&&t.includes('2024-02-03')));
run('true-orphan', 'Texto<ref name="ausente"/> continua.',t=>assert.equal(t,'Texto continua.'));
run('unknown-producer-keeps-possible-reuse', 'Texto<ref name="a"/>{{Emissor desconhecido}}\n{{Reflist|30em}}',t=>assert(t.includes('name="a"')&&t.includes('{{Emissor desconhecido}}')&&t.includes('{{Referências}}')));
run('semantic-definition-order', 'A<ref name="a">{{Citar web|url=https://example.org/a|título=Fonte}}</ref> B<ref name="a">{{Citar web|título=Fonte|url=https://example.org/a}}</ref>\n{{Referências}}',t=>assert.equal(api.v219NativeReferenceObserver(t).refs.filter(r=>r.body!==null).length,1));
run('conflicting-definitions-with-reuse-preserved', 'A<ref name="a">Fonte A.</ref> B<ref name="a">Fonte B.</ref> C<ref name="a"/>\n{{Referências}}',t=>assert(t.includes('Fonte A.')&&t.includes('Fonte B.')&&api.v219NativeReferenceObserver(t).refs.length===3));
run('named-reference-chain-punctuation', 'Texto<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref>.',t=>assert(t.startsWith('Texto.<ref')&&t.includes('Fonte A.')&&t.includes('Fonte B.')));
run('split-reference-opening', 'Texto.<\nref name="a">Fonte preservada.</ref>\n{{Reflist|30em}}',t=>assert(t.includes('<ref name="a">Fonte preservada.</ref>')&&t.includes('{{Referências}}')));
run('collector-heading-boundary', refs+'\n== Referências ==\n<references />== Ligações externas ==\n* [https://example.org Site]',t=>assert(t.includes('{{Referências}}\n\n== Ligações externas ==')&&t.includes('https://example.org')));
run('collector-navigation-boundary', refs+'\n== Referências ==\n<references />{{Navegação de exemplo}}',t=>assert(t.includes('{{Referências}}\n\n{{Navegação de exemplo}}')));
run('custom-section-anchor-preserved', 'Veja [[#Fontes]].\n'+refs+'\n== Fontes ==\n{{Reflist|30em}}',t=>assert(t.includes('[[#Fontes]]')&&t.includes('== Fontes ==')&&t.includes('{{Referências|nível=0}}')));
run('literal-example-preserved', '<nowiki>{{Reflist|30em}}<ref nome="a">Exemplo.</ref></nowiki>\n'+refs+'\n{{Reflist|30em}}',t=>assert(t.includes('<nowiki>{{Reflist|30em}}<ref nome="a">Exemplo.</ref></nowiki>')&&t.endsWith('{{Referências}}')));
const report={suite:'v2221-reference-complete-action-integration',baselineSha256,helperSha256,checks,calculations,cases:cases.length,results:cases,passed:true,networkRequests:0,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({suite:report.suite,checks,calculations,cases:cases.length,passed:true}));
