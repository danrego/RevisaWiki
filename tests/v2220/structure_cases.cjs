'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');const {api,cfg,file,sourceSha,sha}=require('./harness.cjs');let checks=0;const results=[],failures=[];
function eq(actual,expected,id){checks++;if(actual!==expected)failures.push({id,actual,expected});}
function test(id,source,expected,options={}){
 try{
  const settings={...cfg,...options},p=api.v222StructurePlan(source,settings);eq(p.text,expected,id);eq(api.v222StructureProof(source,p.text,p,settings),true,id+' proof');eq(api.v222StructurePlan(p.text,settings).text,p.text,id+' idempotence');eq(api.v222StructureProof(source,p.text,{...p,sourceHash:'tampered'},settings),false,id+' source tamper');eq(api.v222StructureProof(source,p.text,{...p,edits:[{start:0,end:source.length+1,text:''}]},settings),false,id+' span tamper');
  let text='',end=0;for(const e of p.edits){eq(e.start>=end,true,id+' nonoverlap');eq(Number.isInteger(e.count)&&e.count>0,true,id+' count');text+=source.slice(end,e.start)+e.text;end=e.end;}text+=source.slice(end);eq(text,p.text,id+' original-offset replay');results.push({id,sourceSha256:sha(source),outputSha256:sha(p.text),changed:p.text!==source,count:p.edits.reduce((n,e)=>n+e.count,0)});
 }catch(error){failures.push({id,error:String(error.stack)});}
}
test('category-adjacent','[[Categoria:Alfa]][[Categoria:Beta]]','[[Categoria:Alfa]]\n[[Categoria:Beta]]');
test('category-one-line','[[Categoria:Alfa]]\n\n[[Categoria:Beta| Chave ]]','[[Categoria:Alfa]]\n[[Categoria:Beta| Chave ]]');
test('category-preserves-blank-sort-key','[[Categoria:Alfa|]][[Categoria:Beta| ]]','[[Categoria:Alfa|]]\n[[Categoria:Beta| ]]');
test('stub-category-boundary','{{Esboço-livro}}[[Categoria:Alfa]]','{{Esboço-livro}}\n[[Categoria:Alfa]]');
for(const s of ['[[:Categoria:Alfa]][[:Categoria:Beta]]','<nowiki>[[Categoria:Alfa]][[Categoria:Beta]]</nowiki>','{{Exemplo|[[Categoria:Alfa]][[Categoria:Beta]]}}','[[Categoria:Alfa]]\n<!-- ordem -->\n[[Categoria:Beta]]'])test('category-negative-'+results.length,s,s);
const gallery='<gallery>\nFicheiro:Exemplo.svg|Legenda.\n</gallery>\n';
test('gallery-dangling-empty-bullet',gallery+'*\n\n{{Referências}}',gallery+'{{Referências}}');
test('gallery-empty-before-heading',gallery+'*\n\n== Referências ==',gallery+'== Referências ==');
for(const s of [gallery+'*\n** Subitem.\n{{Referências}}',gallery+'*\n* Item normal.','*\n{{Referências}}',gallery+'* Texto.\n{{Referências}}','<nowiki>'+gallery+'*\n{{Referências}}</nowiki>'])test('gallery-negative-'+results.length,s,s);
test('ordinary-bullet-br','* Alfa<br>\n* Beta','* Alfa\n* Beta');
test('numbered-list-br','# Alfa<br />\n# Beta','# Alfa\n# Beta');
for(const s of ['*: Alfa<br>\n* Beta','*; Alfa<br>\n* Beta','* Alfa<br>\n** Subitem','* Alfa<br>\n*: Continuação','* Alfa<br>\n\n* Beta','<poem>* Alfa<br>\n* Beta</poem>','{|\n|* Alfa<br>\n* Beta\n|}'])test('list-br-negative-'+results.length,s,s);
test('image-fullwidth','[[Ficheiro:Exemplo.svg|３００px|Legenda ３００]]','[[Ficheiro:Exemplo.svg|300px|Legenda ３００]]');
test('image-fullwidth-two-dimensions','[[Imagem:Exemplo.svg|３００x２００px]]','[[Imagem:Exemplo.svg|300x200px]]');
for(const s of ['[[Ficheiro:３００.svg|300px]]','[[Ficheiro:Exemplo.svg|tamanho=３００px]]','[[Ficheiro:Exemplo.svg|Legenda ３００px]]','[[Ficheiro:Exemplo.svg|０px]]','<gallery>\nFicheiro:Exemplo.svg|３００px\n</gallery>','Texto ３００px.'])test('image-negative-'+results.length,s,s);
test('small-close','<small>Texto<small/>','<small>Texto</small>');
test('small-opening-attributes-retained','<small class="nota">Texto<small/>','<small class="nota">Texto</small>');
for(const s of ['<small>Texto<small class="nota"/>','<small>Texto<small/>\n\nOutro</small>','<small><small>Texto<small/>','<small/>','<nowiki><small>Texto<small/></nowiki>','<small>Texto<small/>\n<small>Outra</small>'])test('small-negative-'+results.length,s,s);
test('table-close-attributes','<table><tr><td>Texto</td class="copiado"></tr></table>','<table><tr><td>Texto</td></tr></table>');
test('table-opening-attributes-retained','<table class="wikitable"><tr><td class="dado">Texto</td style="x"></tr></table>','<table class="wikitable"><tr><td class="dado">Texto</td></tr></table>');
for(const s of ['</td class="copiado">','<table><tr><th>Texto</td class="copiado"></tr></table>','<nowiki><table><tr><td>Texto</td class="copiado"></tr></table></nowiki>'])test('table-negative-'+results.length,s,s);
test('duplicate-protocol-link','[https://https://example.invalid/a?id=2#sec Rótulo]','[https://example.invalid/a?id=2#sec Rótulo]');
test('duplicate-protocol-citation','{{Citar web|url=https://https://example.invalid/a?id=2#sec|título=Obra}}','{{Citar web|url=https://example.invalid/a?id=2#sec|título=Obra}}');
test('duplicate-protocol-ascii-key-padding','{{Citar web| \turl \t=https://https://example.invalid/a|título=Obra}}','{{Citar web| \turl \t=https://example.invalid/a|título=Obra}}');
for(const [name,edge]of [['NBSP','\u00a0'],['NNBSP','\u202f'],['IDEOGRAPHIC','\u3000'],['BOM','\ufeff'],['ZWS','\u200b'],['LINE_SEPARATOR','\u2028']]){
 for(const side of ['leading','trailing']){
  const key=side==='leading'?edge+'url':'url'+edge,s='{{Citar web|'+key+'=https://https://example.invalid/a|título=Obra}}';test('protocol-unicode-key-held-'+name+'-'+side,s,s);
 }
 const held='{{Citar web|'+edge+'url=https://https://example.invalid/opaque|título=Obra}}',known='{{Citar web|url=https://https://example.invalid/known|título=Outra}}';
 test('protocol-unicode-owner-keeps-independent-ascii-'+name,held+'\n'+known,held+'\n'+known.replace('https://https://','https://'));
}
for(const s of ['[http://https://example.invalid/a Rótulo]','[https://https://web.archive.org/web/2020/https://example.invalid/a Rótulo]','{{Citar web|archive-url=https://https://example.invalid/a|título=Obra}}','{{Outro|url=https://https://example.invalid/a}}','<nowiki>[https://https://example.invalid/a Rótulo]</nowiki>','[https://https://example.invalid/a?sig=x&url=https://outro.invalid Rótulo]'])test('protocol-negative-'+results.length,s,s);
test('youtube-video-title','{{YouTube|abcdefghijk|título=Exemplo}}','{{YouTube|abcdefghijk|titulo=Exemplo}}');
for(const s of ['{{YouTube|abcdefghijk|título=Exemplo|canal=outro}}','{{YouTube|abcdefghijk|título=Exemplo|titulo=Outro}}','{{YouTube|abcdefghijk|título=Exemplo|playlist=x}}','{{YouTube|canal|título=Exemplo}}','<nowiki>{{YouTube|abcdefghijk|título=Exemplo}}</nowiki>'])test('youtube-negative-'+results.length,s,s);
test('copied-isbn','[[ISBN]] [[Special:BookSources/9780306406157|978-0-306-40615-7]]','{{ISBN|978-0-306-40615-7}}');
test('copied-isbn-10','[[International Standard Book Number|ISBN]] [[Special:BookSources/0306406152|0-306-40615-2]]','{{ISBN|0-306-40615-2}}');
for(const s of ['[[ISBN]] [[Special:BookSources/9780306406157|9780306406158]]','[[ISBN]] [[Special:BookSources/9780306406158|9780306406158]]','<nowiki>[[ISBN]] [[Special:BookSources/9780306406157|9780306406157]]</nowiki>'])test('isbn-negative-'+results.length,s,s);
for(let level=2;level<=6;level++)test('literal-html-heading-'+level,'Texto.\n<h'+level+'>Seção simples</h'+level+'>\nTexto.','Texto.\n'+'='.repeat(level)+' Seção simples '+'='.repeat(level)+'\nTexto.');
test('html-heading-linked-anchor','Veja [[#Seção_simples|seção]].\n<h2>Seção simples</h2>\nTexto.','Veja [[#Seção_simples|seção]].\n== Seção simples ==\nTexto.');
for(const s of ['<h1>Seção simples</h1>','<h2 id="outro">Seção simples</h2>','<h2>[[Seção simples]]</h2>','<h2>{{Seção simples}}</h2>','<h2>Seção simples</h2>\n== Seção simples ==','<h2>Seção simples</h2>\n<h3>Seção simples</h3>','<nowiki><h2>Seção simples</h2></nowiki>','{|\n|<h2>Seção simples</h2>\n|}','{{Exemplo|<h2>Seção simples</h2>}}'])test('html-heading-negative-'+results.length,s,s);
for(const [a,b] of [['[[Hist%C3%B3ria|história]]','[[História|história]]'],['[[Ci%C3%AAncia|ciência]]','[[Ciência|ciência]]'],['[[Brasil#Hist%C3%B3ria|história]]','[[Brasil#História|história]]'],['[[Hist%C3%B3ria#Idade_M%C3%A9dia|Idade Média]]','[[História#Idade_Média|Idade Média]]']])test('native-percent-link-'+results.length,a,b);
for(const s of ['[[Hist%C3%B3ria]]','[[Hist%C3%B3ria|]]','[[Ficheiro:Hist%C3%B3ria.svg|história]]','[[Categoria:Hist%C3%B3ria|história]]','[[de:Hist%C3%B3ria|história]]','[[Hist%C3%B3ria%20local|história]]','[[Hist%C3%B3ria%23local|história]]','[[Hist%C3%B3ria%7Clocal|história]]','[[Hist%C3%FF|história]]','[[Hist%C3|história]]','[[Hist%C3%B3ria%ZZ|história]]','<nowiki>[[Hist%C3%B3ria|história]]</nowiki>','{{Exemplo|[[Hist%C3%B3ria|história]]}}'])test('percent-link-negative-'+results.length,s,s);
test('heading-template-see-also','Texto.\n== {{Veja também}} ==\n* Tema.','Texto.\n== Ver também ==\n* Tema.');
test('heading-template-external','Texto.\n== {{Links externos}} ==\n* Ligação.','Texto.\n== Ligações externas ==\n* Ligação.');
for(const s of ['== {{Veja também|Tema}} ==','== Antes {{Veja também}} ==','== {{Referências}} ==','<nowiki>== {{Veja também}} ==</nowiki>'])test('heading-template-negative-'+results.length,s,s);
test('simple-list-empty-gap','Texto.\n* item1\n\n* item2\n','Texto.\n* item1\n* item2\n');
test('simple-list-CRLF','Texto.\r\n* item1\r\n\r\n* item2\r\n','Texto.\r\n* item1\r\n* item2\r\n');
test('simple-list-multiple-gaps','* item1\n\n* item2\n\n\n* item3','* item1\n* item2\n* item3');
for(const s of ['# item1\n\n# item2','* item1\n\n** subitem','* item1\n\n* item2\n** subitem','* item1\n\n* {{Exemplo}}','* item1\n\n* "item2"','* item1\n\n Texto de continuação\n* item2','<nowiki>* item1\n\n* item2</nowiki>'])test('simple-list-negative-'+results.length,s,s);
test('known-citation-namespace-prefix','{{Predefinição:Citar livro|título=Obra}}','{{Citar livro|título=Obra}}');
test('known-infobox-namespace-prefix','{{Template:Info/Biografia|nome=Pessoa}}','{{Info/Biografia|nome=Pessoa}}');
test('prefix-keeps-namecase-and-spaces','{{ Predefinição:  Citar livro |título=Obra }}','{{   Citar livro |título=Obra }}');
test('citation-prefix-in-ref','Texto<ref>{{Predefinição:Citar livro|título=Obra}}</ref>','Texto<ref>{{Citar livro|título=Obra}}</ref>');
for(const s of ['{{Template:DEFAULTSORT:Exemplo}}','{{Predefinição:CURRENTYEAR}}','{{Template:Desconhecido|a=b}}','<nowiki>{{Predefinição:Citar livro|título=Obra}}</nowiki>'])test('prefix-negative-'+results.length,s,s);
const combined='[[Ficheiro:Exemplo.svg|３００px]]\n* Alfa<br>\n* Beta\n<small>Texto<small/>\n[[Categoria:Alfa]][[Categoria:Beta]]';
test('sequential-original-coordinate-replay',combined,'[[Ficheiro:Exemplo.svg|300px]]\n* Alfa\n* Beta\n<small>Texto</small>\n[[Categoria:Alfa]]\n[[Categoria:Beta]]');
for(const options of [{markup:false},{structuralRepairs:false},{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{pageRedirect:true},{contentModel:'javascript'}])test('scope-'+results.length,combined,combined,options);
test('recognized-article-draft-heading','== {{Veja também}} ==','== Ver também ==',{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'});
for(const pageTitle of ['Usuário:Conta de Teste','Usuário:Conta de Teste/PU','Usuário:Conta de Teste/Testes/Predefinição:Exemplo'])test('user-page-not-article-draft-'+results.length,'== {{Veja também}} ==','== {{Veja também}} ==',{namespaceNumber:2,pageTitle});
test('images-option-off','[[Ficheiro:Exemplo.svg|３００px]]','[[Ficheiro:Exemplo.svg|３００px]]',{images:false});
test('categories-option-off','[[Categoria:Alfa]][[Categoria:Beta]]','[[Categoria:Alfa]][[Categoria:Beta]]',{categories:false});
test('auxiliary-option-off','{{YouTube|abcdefghijk|título=Exemplo}}','{{YouTube|abcdefghijk|título=Exemplo}}',{auxiliaryTemplates:false});
test('links-option-off','[[ISBN]] [[Special:BookSources/9780306406157|9780306406157]]','[[ISBN]] [[Special:BookSources/9780306406157|9780306406157]]',{links:false});
test('citations-option-off','{{Citar web|url=https://https://example.invalid/a|título=Obra}}','{{Citar web|url=https://https://example.invalid/a|título=Obra}}',{citations:false});
eq(api.v222StructureProof('','',null,cfg),false,'null proof');
for(const native of ['{{Notas}}','{{Referências}}','{{Notas e referências}}']){const label=native==='{{Referências}}'?'Referências':'Notas',source='<h2>'+label+'</h2>\n'+native;test('html-heading-native-producer-duplicate-'+results.length,source,source);}
const directCases=results.length;
function integrated(id,source,verify){try{const p=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});eq(api.v219AutomaticResultSafety(source,p).accepted,true,id+' admission');eq(api.v2217AnchorRawAudit(source,p.text,cfg).length,0,id+' anchors');eq(api.calculate({kind:'adjust',source:p.text,originalSource:p.text,options:cfg}).text,p.text,id+' integrated idempotence');verify(p.text);checks++;results.push({id,phase:'complete-synthetic-action',sourceSha256:sha(source),outputSha256:sha(p.text),changed:p.text!==source});}catch(error){failures.push({id,error:String(error.stack)});}}
integrated('whole-category-boundary','{{Esboço-livro}}[[Categoria:Alfa]][[Categoria:Beta]]',t=>assert(t.includes('{{Esboço-livro}}\n')&&t.includes('[[Categoria:Alfa]]\n[[Categoria:Beta]]')));
integrated('whole-gallery-tail',gallery+'*\n\n{{Referências}}',t=>assert(t.includes(gallery)&&!/^\*[ \t]*$/m.test(t)));
integrated('whole-fullwidth','[[Ficheiro:Exemplo.svg|３００px|Legenda ３００]]',t=>assert(t.includes('Ficheiro:Exemplo.svg|300px|Legenda ３００')));
integrated('whole-protocol','[https://https://example.invalid/a?id=2#sec Rótulo]',t=>assert(t.includes('[https://example.invalid/a?id=2#sec Rótulo]')));
integrated('whole-youtube','{{YouTube|abcdefghijk|título=Exemplo}}',t=>assert(t.includes('|titulo=Exemplo')&&!t.includes('|título=')));
integrated('whole-small-and-categories',combined,t=>assert(t.includes('<small>Texto</small>')&&t.includes('[[Categoria:Alfa]]\n[[Categoria:Beta]]')));
integrated('whole-isbn','[[ISBN]] [[Special:BookSources/9780306406157|978-0-306-40615-7]]',t=>assert(t.includes('{{ISBN|978-0-306-40615-7}}')));
integrated('whole-ambiguous-small-independent-link','<small>Texto<small class="nota"/>\n\n[https://https://example.invalid/a Rótulo]',t=>assert(t.includes('<small class="nota"/>')));
integrated('whole-html-heading-anchor','Veja [[#Seção_simples|seção]].\n<h2>Seção simples</h2>\nTexto.',t=>assert(t.includes('== Seção simples ==')&&t.includes('[[#Seção_simples|seção]]')));
integrated('whole-percent-link','[[Hist%C3%B3ria#Idade_M%C3%A9dia|Idade Média]]',t=>assert(t.includes('[[História#Idade_Média|Idade Média]]')));
integrated('whole-heading-template','Texto.\n== {{Veja também}} ==\n* [[Brasil]]\n',t=>assert(t.includes('== Ver também ==')&&!t.includes('{{Veja também}}')));
integrated('whole-simple-list-gap','Texto.\n* item1\n\n* item2\n',t=>assert(t.includes('* item1\n* item2')));
const report={suite:'v2220-structure',runtime:file,runtimeSha256:sourceSha,checks,cases:results.length,directCases,completeSyntheticActions:results.length-directCases,results,failures,passed:!failures.length};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');assert.equal(failures.length,0,JSON.stringify(failures,null,2));console.log(JSON.stringify({suite:report.suite,checks,cases:results.length,directCases,completeSyntheticActions:results.length-directCases,passed:true}));
