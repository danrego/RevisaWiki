'use strict';
// Existing native citation fixes must survive unrelated collector limitations.
// Every public example is synthetic; original field values stay source-bound.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),file=process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Teste de regressão',contentModel:'wikitext',sectionOnly:false,autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-11-05'};
let checks=0,calls=0;const rows=[],failures=[];function check(value,message){checks++;assert(value,message);}
const url='https://example.invalid/fonte',archive='https://web.archive.org/web/20070405201701/'+url,
 imported='{{Cita web|url='+url+'|titolo=Fonte de exemplo|accesso=8 agosto 2006|dataarchivio=5 aprile 2007|urlarchivio='+archive+'|urlmorto=sì}}',
 migrated='{{Citar web|url='+url+'|título=Fonte de exemplo|acessodata=2006-08-08|arquivodata=2007-04-05|arquivourl='+archive+'|urlmorta=sim}}';
const citationCases=[
 ['custom-empty-group','Texto.<ref>'+imported+'</ref>\n\n== Notas ==\n<references group="grupo particular"/>',true],
 ['custom-empty-group-with-heading-normalization','= Tema de exemplo =\nTexto.<ref>'+imported+'</ref>\n\n== Nota ==\n<references group="grupo particular"/>',true],
 ['custom-empty-group-with-historical-date','O fato ocorreu em 581 a.C.<ref>'+imported+'</ref>\n\n== Nota ==\n<references group="grupo particular"/>',true],
 ['ordinary-default-collector','Texto.<ref>'+imported+'</ref>\n\n{{Referências}}',true],
 ['matching-custom-group','Texto.<ref group="grupo particular">'+imported+'</ref>\n\n<references group="grupo particular"/>',true],
 ['conflicting-archive-target','Texto.<ref>'+imported.replace(archive,archive+'-different')+'</ref>\n\n{{Referências}}',false],
 ['invalid-access-date','Texto.<ref>'+imported.replace('8 agosto 2006','31 febbraio 2006')+'</ref>\n\n{{Referências}}',false],
 ['filled-unknown-field','Texto.<ref>'+imported.slice(0,-2)+'|campo-desconhecido=preservar}}</ref>\n\n{{Referências}}',false],
 ['conflicting-native-title','Texto.<ref>'+imported.slice(0,-2)+'|título=Outro título}}</ref>\n\n{{Referências}}',false]
];
for(const[id,source,expected]of citationCases){const row={id,sourceSha256:sha(source)};try{
 const first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calls++;check(api.v219AutomaticResultSafety(source,first).accepted,id+' accepted action');
 if(expected){check(first.text.includes(migrated),id+' exact existing native migration');check(!first.text.includes('|titolo='),id+' supported field is not silently left behind');}
 else{const body=source.match(/<ref\b[^>]*>([\s\S]*?)<\/ref>/)[1],expectedBody=body.replace(/^\{\{Cita web(?=\|)/,'{{Citar web');check(first.text.includes(expectedBody),id+' all conflicting parameter bytes retained with only the established header alias');}
 const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});calls++;check(first.text===second.text,id+' idempotent');row.outputSha256=sha(first.text);row.status='passed';
 }catch(error){row.status='failed';row.error=String(error.stack||error);failures.push(row);}rows.push(row);}
const headingCases=[];
for(const gap of ['[[Categoria:Exemplos]]\n','<!-- comentário preservado -->\n[[Categoria:Exemplos| ]]\n','[[Category:Examples]]\n\n','<!-- comentário preservado -->\n']){
 headingCases.push(['default-category-gap-'+headingCases.length,'== Referências ==\n'+gap+'<references/>','== Referências ==\n'+gap+'{{Referências|nível=0}}']);
 headingCases.push(['notes-category-gap-'+headingCases.length,'Texto<ref group="nt">Nota.</ref>\n== Notas ==\n'+gap+'<references group="nt"/>','Texto<ref group="nt">Nota.</ref>\n== Notas ==\n'+gap+'{{Referências|grupo=nt|nível=0}}']);
}
for(const[id,source,expected]of headingCases){const row={id,sourceSha256:sha(source)};try{const p=api.v2217ReferencePlan(source,cfg);check(p.text===expected,id+' explicit heading retained without a second generated heading');check(api.v2217ReferenceProof(source,p.text,p,cfg),id+' source-bound proof');check(api.v2217ReferencePlan(p.text,cfg).text===p.text,id+' idempotent');row.outputSha256=sha(p.text);row.status='passed';}catch(error){row.status='failed';row.error=String(error.stack||error);failures.push(row);}rows.push(row);}
for(const gap of ['Texto explicativo.\n','[[Exemplo]]\n','{{Exemplo}}\n','<div>Conteúdo.</div>\n','{|\n| Célula\n|}\n','<!-- comentário incompleto\n','[[Categoria:Exemplos]\n']){
 const id='uncertain-gap-preserved-'+rows.length,source='== Referências ==\n'+gap+'<references/>',row={id,sourceSha256:sha(source)};
 try{const p=api.v2217ReferencePlan(source,cfg),complete=!gap.includes('<!-- comentário incompleto')&&!gap.includes('[[Categoria:Exemplos]');if(complete){check(p.text===source.replace('<references/>','{{Referências|nível=0}}'),id+' exact retained section and all intervening content');check(p.text.includes('== Referências ==\n'+gap),id+' original heading and content unchanged');check(!p.text.includes('{{Referências}}'),id+' native level0 adds no second heading (63785697)');}else check(p.text===source,id+' incomplete source not inferred or changed');check(api.v2217ReferenceProof(source,p.text,p,cfg),id+' source-bound proof');row.outputSha256=sha(p.text);row.status='passed';}catch(error){row.status='failed';row.error=String(error.stack||error);failures.push(row);}rows.push(row);
}
for(const options of [{headings:false},{automaticReferenceCollectorHeadings:false}]){
 const id='heading-options-'+rows.length,source='== Referências ==\n[[Categoria:Exemplos]]\n<references/>',row={id,sourceSha256:sha(source)};
 try{const p=api.v2217ReferencePlan(source,{...cfg,...options});check(p.text==='== Referências ==\n[[Categoria:Exemplos]]\n{{Referências|nível=0}}',id+' one explicit level control');check(!p.text.includes('|nível=0|nível=0'),id+' no duplicate level argument');row.status='passed';}catch(error){row.status='failed';row.error=String(error.stack||error);failures.push(row);}rows.push(row);
}
const report={kind:'existing-citation-and-manual-heading-composition-regression',bundle:path.basename(file),bundleSha256:sha(fs.readFileSync(file)),cases:rows.length,checks,calculateCalls:calls,failures:failures.length,rows,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({cases:rows.length,checks,calculateCalls:calls,failures:failures.length}));if(failures.length)process.exitCode=1;
