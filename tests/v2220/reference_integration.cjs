'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');const {api,cfg,file,sourceSha,sha}=require('./harness.cjs');let checks=0;const results=[];
global.fetch=()=>{throw Error('No network in local integration suite');};
function test(id,source,verify,options={}){
 const settings={...cfg,...options},r=api.calculate({kind:'adjust',source,originalSource:source,options:settings});
 assert.equal(api.v219AutomaticResultSafety(source,r).accepted,true,id+' automatic safety');checks++;
 assert.equal(api.v2217AnchorRawAudit(source,r.text,settings).length,0,id+' anchors retained');checks++;
 assert.equal(api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:settings}).text,r.text,id+' whole-action idempotence');checks++;
 verify(r.text,r);checks++;results.push({id,inputSha256:sha(source),outputSha256:sha(r.text),changes:r.changes,changed:r.text!==source});
}
const prefix='Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>\n\n',html='== Notas ==\n<div class="references"><references group=lower-alpha/></div>\n\n== Referência ==\n<references />',four='{{Notas}}\n{{Notelist|30em}}\n\n{{Referências}}\n{{Reflist|30em}}';
test('COL-HTML-01',prefix+html,(t,r)=>{assert.equal(t,prefix+'{{Notas e referências}}');assert.equal(r.changes.reduce((n,c)=>n+c.count,0),5);});
test('four-collectors',prefix+four,t=>assert(t.includes('{{Notas e referências}}')&&!t.includes('{{Notelist')&&!t.includes('{{Reflist')));
test('reverse-order',prefix+'{{Referências}}\n{{Notas}}',t=>assert(t.includes('{{Notas e referências}}')));
test('empty-notas-without-default','Texto.\n== Notas ==\n{{Notas}}',t=>assert.equal(t,'Texto.\n'));
test('empty-notas-unknown-producer-preserved','Texto.\n{{Desconhecido}}\n{{Notas}}',t=>assert(t.includes('{{Notas}}')));
test('only-notas-default-reference-visible','Texto<ref>Fonte.</ref>\n{{Notas}}',t=>assert.equal(t,'Texto<ref>Fonte.</ref>\n\n{{Referências}}'));
test('only-notas-note-and-reference-visible','Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}',t=>assert.equal(t,'Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n\n{{Notas e referências}}'));
test('only-notas-lower-alpha-and-reference-visible','Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}',t=>assert(t.includes('group="lower-alpha"')&&t.includes('{{Notas e referências}}')));
for(const tail of ['{{Desconhecido}}\n{{Notas}}','== Fontes ==\n{{Notas}}','{{Notas|Título próprio}}','{{Notas|refs=<ref>Banco.</ref>}}'])test('only-notas-unproved-producer-'+results.length,'Texto<ref>Fonte.</ref>\n'+tail,t=>assert(!t.includes('{{Notas e referências}}')&&t.includes(tail.includes('== Fontes ==')?'== Fontes ==':'{{Notas')));
test('three-compatible-collectors-converge','Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}\n{{Reflist}}\n{{Reflist}}\n',t=>assert.equal(t,'Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n\n{{Notas e referências}}\n'));
test('attributes-and-reuses','A<ref nome="a" grupo="nota">Fonte.</ref> B<ref nome="a" grupo="nota"/>',t=>assert(!/\b(?:nome|grupo)=/.test(t)&&t.includes('group="nota"')));
test('operators-and-definition','A<ref name:"a">Fonte.</ref> B<ref name:"a"/>',t=>assert(!t.includes('name:')&&t.includes('name="a"')));
test('orphan-reuse','Texto<ref name="ausente"/> continua.',t=>assert.equal(t,'Texto continua.'));
test('outer-whitespace-dedup','A<ref> Fonte. </ref> B<ref>Fonte.</ref>',t=>assert(t.includes('<ref name="ref-auto-1"> Fonte. </ref>')&&t.includes('<ref name="ref-auto-1" />')));
test('punctuation-and-parenthesis','Uma frase , outra ( palavra ).',t=>assert.equal(t,'Uma frase, outra (palavra).'));
test('short-cite-gap','Texto. {{sfn|Autor|2020}}',t=>assert(t.includes('Texto.{{sfn|Autor|2020}}')));
test('held-collector-other-ref-substep-remains','Uma frase , outra .\nVeja [[#Notas]].\n\n'+prefix+html,t=>assert(t.startsWith('Uma frase, outra.')&&t.includes('== Notas ==')&&t.includes('<div class="references">')));
test('unknown-producer-other-substep-remains','Uma frase , outra .\nTexto<ref name="a"/>{{Desconhecido}}',t=>assert(t.startsWith('Uma frase, outra.')&&/name="a"\s*\//.test(t)&&t.includes('{{Desconhecido}}')));
test('conflicting-ref-family-independent-attribute','A<ref name="a">Fonte A.</ref> B<ref nome="a">Fonte B.</ref> C<ref nome="b">Outra.</ref>',t=>assert(t.includes('nome="a"')&&t.includes('name="b"')));
for(const attrs of ['id="notas" class="references"','class="references" style="color:red"'])test('protected-wrapper-'+results.length,prefix+html.replace('class="references"',attrs),t=>assert(t.includes('<div '+attrs+'>')));
const talk={namespaceNumber:1,discussionPage:true,pageTitle:'Discussão:Exemplo'};
test('discussion-order','{{OKA}}\n{{Traduzido|en|Example|oldid=123}}\n{{Marca de projeto|3|Mulheres|3|rev=20260101}}\n{{PD}}\n\n== Assunto ==\nMensagem.',t=>assert(t.indexOf('{{PD}}')<t.indexOf('{{Marca de projeto')&&t.indexOf('{{Marca de projeto')<t.indexOf('{{Traduzido')&&t.indexOf('{{Traduzido')<t.indexOf('{{OKA}}')&&t.includes('|3|Mulheres|3|rev=20260101')&&t.includes('== Assunto ==\nMensagem.')),talk);
test('quoted-x-preserves-importance-and-bot-absence','{{Marca de projeto|"x"|Mulheres|3}}',t=>assert(t.includes('{{Marca de projeto|?|Mulheres|3}}')&&!t.includes('bot=')),talk);
test('human-quality-and-date','{{PD}}\n{{Marca de projeto|3|Mulheres|3|rev=20260101}}',t=>assert(t.includes('|3|Mulheres|3|rev=20260101')),talk);
test('explicit-bot-existing-contract','{{PD}}\n{{Marca de projeto|3|Mulheres|3|bot=sim|rev=20260101}}',t=>assert(t.includes('|?|Mulheres|3')&&!/\|(?:bot|rev)=/.test(t)),talk);
test('authority-alias','{{Controlo de autoria|VIAF=00123}}',t=>assert.equal(t,'{{Controle de autoridade|VIAF=00123}}'));
test('custom-manual-heading-no-extra-heading','Texto.<ref name="a">Fonte.</ref>\n\n== Fontes ==\n{{Reflist|2}}\n\n== Bibliografia ==\n* Obra.\n',t=>assert(t.includes('== Fontes ==')&&t.includes('== Bibliografia ==')&&t.includes('{{Referências|nível=0}}')&&!t.includes('{{Referências}}')));
test('explicit-width-mixed-citation','\'\'\'Tema\'\'\' é um exemplo.<ref>{{Citation|titulo=Obra|publicado=Editora|ano=2005}}</ref>\n\n== Referências ==\n{{Reflist|30em}}\n',t=>assert(t.includes('{{Reflist|30em}}')&&!t.includes('{{Citation|')&&t.includes('{{Citar livro|')));
test('custom-heading-width-paragraph','Texto.<ref>Fonte.</ref>\n\n== Fontes ==\nTexto da seção.\n{{Reflist|30em}}\n\n== Bibliografia ==\n* Obra.\n',t=>assert(t.includes('== Fontes ==')&&t.includes('Texto da seção.')&&t.includes('{{Reflist|30em}}')&&!t.includes('{{Referências}}')));
for(const collector of ['{{Reflist|group=x}}','<references group="x"/>'])test('existing-custom-note-atomic-'+results.length,'Texto.<ref group="x">Nota.</ref><ref>Fonte.</ref>\n== Notas ==\n'+collector+'\n{{Reflist}}\n',t=>assert.equal(t.trim(),'Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n\n{{Notas e referências}}'));
for(const heading of ['== Fontes ==','====== Notas ======','<h2>Notas</h2>'])test('native-notes-manual-owner-'+results.length,'Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n'+heading+'\n{{Notas}}\n{{Reflist|2}}\n',t=>assert(t.includes(heading)&&!t.includes('{{Notas e referências}}')));
test('secondary-note-heading-existing-native-level','Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n=== Notas ===\n{{Notas}}\n{{Reflist|2}}\n',t=>assert.equal(t,'Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas|nível=3}}\n{{Referências|nível=0}}\n'));
test('secondary-manual-reference-level-kept','Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}\n=== Referências ===\n{{Reflist|2}}\n',t=>assert(t.includes('=== Referências ===')&&!t.includes('{{Notas e referências}}')));
test('manual-notes-prose-remains-own-section','Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n== Notas ==\nProsa preservada.\n{{Notas}}\n{{Reflist|2}}\n',t=>assert(t.includes('== Notas ==\nProsa preservada.')&&!t.includes('{{Notas e referências}}')));
test('native-notes-after-earlier-prose-section','== Ver também ==\n{{Correlatos}}\n\nTexto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>\n\n'+four,t=>assert(t.includes('== Ver também ==')&&t.includes('{{Correlatos}}')&&t.includes('{{Notas e referências}}')));
const literalCorrelatos='{{Correlatos|título=Tema fictício|commonscat=Example|wikinoticiascat=Exemplo|wikcionario=exemplo|wikidata=Q1}}';
test('literal-correlatos-native-arguments-and-collectors','== Ver também ==\n'+literalCorrelatos+'\n\n'+prefix+four,t=>assert(t.includes(literalCorrelatos)&&t.includes('{{Notas e referências}}')));
for(const s of ['"<ref name:"a">Fonte.</ref>"','<nowiki>Texto , outro.<ref nome="a">Fonte.</ref></nowiki>'])test('protected-source-'+results.length,s,t=>assert(t.includes(s)));
for(const [label,source,expected]of [['collector',prefix+html,prefix+'{{Notas e referências}}'],['orphan','Texto<ref name="ausente"/> continua.','Texto continua.'],['heading-alias','== {{Veja também}} ==','== Ver também ==']]){
 test('whole-recognized-draft-'+label,source,t=>assert.equal(t,expected),{namespaceNumber:2,pageTitle:'User:Conta de Teste/Testes'});
 // Exact unchanged 2.21.7 behavior, not an authorization for the new rules.
 const publishedPu=label==='collector'?source.replace('<references />','{{Referências}}'):label==='orphan'?'Texto<ref name="ausente" /> continua.\n\n{{Referências}}\n\n':source;
 test('whole-pu-published-baseline-'+label,source,t=>assert.equal(t,publishedPu),{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/PU'});
}
for(const box of ['{{Correlatos|título=<h2>Outra seção</h2>|commonscat=Example}}','{{Correlatos|título=<div>Outro título|commonscat=Example}}','{{Correlatos|título=\n=== Outra seção ===\n|commonscat=Example}}']){const s='== Ver também ==\n* Item anterior.\n'+box+'\nTexto posterior.';test('whole-sister-structural-value-kept-'+results.length,s,t=>assert.equal(t,s));}
test('whole-sister-opaque-model-kept','== Ver também ==\n* Item anterior.\n{{Widget desconhecido}}\n{{Correlatos}}\nTexto posterior.',t=>assert(t.indexOf('* Item anterior.')<t.indexOf('{{Correlatos}}')&&t.includes('{{Widget desconhecido}}')));
test('whole-sister-decline-independent-authority','== Ver também ==\n* Item anterior.\n{{Correlatos|título=<h2>Outra seção</h2>|commonscat=Example}}\nTexto posterior.\n\n{{Controlo de autoria|VIAF=00123}}',t=>assert(t.indexOf('* Item anterior.')<t.indexOf('{{Correlatos|')&&t.includes('título=<h2>Outra seção</h2>')&&t.includes('{{Controle de autoridade|VIAF=00123}}')));
test('whole-final-empty-external-heading','Texto.\n== Ligações externas ==\n{{Portal3|Ciência}}\n',t=>assert(!t.includes('== Ligações externas ==')&&t.includes('{{Portal3|Ciência}}')));
test('whole-empty-external-heading-after-sister-footer','Texto.\n== Ver também ==\n{{Correlatos}}\n\n== Ligações externas ==\n{{Portal3|Ciência}}\n',t=>assert(!t.includes('== Ligações externas ==')&&t.includes('{{Portal3|Ciência}}')&&t.includes('{{Correlatos}}')));
test('whole-final-empty-external-heading-draft','Texto.\n== Ligações externas ==\n{{Portal3|Ciência}}\n',t=>assert(!t.includes('== Ligações externas ==')&&t.includes('{{Portal3|Ciência}}')),{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'});
test('whole-final-empty-external-heading-with-biography-off','Texto.\n== Ligações externas ==\n{{Portal3|Ciência}}\n',t=>assert(!t.includes('== Ligações externas ==')&&t.includes('{{Portal3|Ciência}}')),{automaticBiographyFields:false});
for(const body of ['<!-- comentário preservado -->\n{{Portal3|Ciência}}','* [https://example.org Ligação]','[[Tema]]','{{Modelo desconhecido}}'])test('whole-empty-external-heading-content-held-'+results.length,'Texto.\n== Ligações externas ==\n'+body+'\n',t=>assert(t.includes('== Ligações externas ==')&&t.includes(body)));
test('whole-empty-external-heading-anchor-held','Veja [[#Ligações externas]].\n== Ligações externas ==\n{{Portal3|Ciência}}\n',t=>assert(t.includes('[[#Ligações externas]]')&&t.includes('== Ligações externas ==')));
const report={suite:'v2220-reference-talk-integration',runtime:file,runtimeSha256:sourceSha,checks,cases:results.length,syntheticCompleteActions:true,nativePreviews:0,networkRequests:0,wikipediaWrites:0,results,passed:true};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,checks,cases:results.length,passed:true}));
