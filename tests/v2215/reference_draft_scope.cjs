'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-11-03'};
let checks=0,calculations=0;const failures=[],rows=[];function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({label,actual,expected});}}
// Fictional context labels test the path boundary; they identify no editor.
const owner=['fixture','article'].join('-'),title=(prefix,path)=>prefix+':'+owner+(path?'/'+path:'');
const sources=[
 ['ordinary','Antes.\n \nDepois.\n== Referências ==\n<references/>'],
 ['notes','Texto<ref group="xyz">Nota.</ref><ref>Fonte.</ref>\n== Notas ==\n<references group="xyz"/>\n\n== Referências ==\n<references/>'],
 ['citation','Texto.\n\n\nTexto<ref>{{Citar web|title=Fonte de teste|url=https://example.org/fonte}}</ref>\n== Referências ==\n<references/>'],
 ['protected-example','<nowiki>{{{exemplo}}}</nowiki>\n\n\nTexto.\n== Referências ==\n<references/>']
];
for(const prefix of ['User','Usuário','Usuária','Usuário(a)'])for(const draft of ['Testes','Rascunho','Testes/Subrascunho'])for(const[id,source]of sources){
 const local={...cfg,namespaceNumber:2,pageTitle:title(prefix,draft)},mainRefs=api.v2215ReferenceCollectorPlan(source,cfg),mainWhite=api.v2215WhitespacePlan(source,cfg),refs=api.v2215ReferenceCollectorPlan(source,local),white=api.v2215WhitespacePlan(source,local);
 eq(api.v2215ArticleDraftContext(local,source),true,'Recognized full-page fictional article draft');
 eq(refs.text,mainRefs.text,id+' reference plan matches article behavior');
 eq(white.text,mainWhite.text,id+' whitespace plan matches article behavior');
 eq(api.v2215ReferenceCollectorProof(source,refs.text,refs,local),true,id+' draft reference proof stays bound');
 eq(api.v2215WhitespaceProof(source,white.text,white,local),true,id+' draft whitespace proof stays bound');
 rows.push({id:prefix+'-'+draft+'-'+id,kind:'positive-draft',sourceSha256:sha(source)});
}
const negative=[
 {namespaceNumber:2,pageTitle:title('User','')},
 {namespaceNumber:2,pageTitle:title('User','PU')},
 {namespaceNumber:2,pageTitle:title('User','Biografia')},
 {namespaceNumber:2,pageTitle:title('User','common.js'),contentModel:'javascript'},
 {namespaceNumber:2,pageTitle:title('User','Testes.js')},
 {namespaceNumber:2,pageTitle:title('User','Testes/estilo.css')},
 {namespaceNumber:2,pageTitle:title('User','Rascunho/dados.json')},
 {namespaceNumber:2,pageTitle:title('User','Testes/Template/Exemplo')},
 {namespaceNumber:2,pageTitle:title('User','Rascunho/Módulo:Exemplo')},
 {namespaceNumber:2,pageTitle:title('User','Testes'),contentModel:'javascript'},
 {namespaceNumber:2,pageTitle:title('User','Testes'),sectionOnly:true},
 {namespaceNumber:2,pageTitle:title('User','Testes'),section:0},
 {namespaceNumber:2,pageTitle:title('User','Testes'),templateDefinition:true},
 {namespaceNumber:2,pageTitle:title('User','Testes'),contentModel:undefined,model:undefined},
 {namespaceNumber:3,pageTitle:title('User talk','Testes'),discussionPage:true},
 {namespaceNumber:10,pageTitle:'Template:Testes'},
 {namespaceNumber:828,pageTitle:'Module:Testes'}
];
const source='Antes.\n \nDepois.\n== Referências ==\n<references/>';
for(const delta of negative){const local={...cfg,...delta};eq(api.v2215ArticleDraftContext(local,source),false,'A personal, code, definition, section or non-article context is excluded');eq(api.v2215ReferenceCollectorPlan(source,local).text,source,'No new reference normalization outside the bounded draft context');eq(api.v2215WhitespacePlan(source,local).text,source,'No new whitespace normalization outside the bounded draft context');}
for(const body of ['<includeonly>Antes.\n\n\nDepois.</includeonly>','{{{parâmetro|Texto}}}\n\n\nTexto.']){const local={...cfg,namespaceNumber:2,pageTitle:title('User','Testes')};eq(api.v2215ArticleDraftContext(local,body),false,'An active transclusion definition is not an article draft');eq(api.v2215WhitespacePlan(body,local).text,body,'Definition whitespace remains exact');}
for(const[id,source]of sources.slice(0,3)){
 const local={...cfg,namespaceNumber:2,pageTitle:title('User','Testes')},main=api.calculate({kind:'adjust',source,originalSource:source,options:cfg}),draft=api.calculate({kind:'adjust',source,originalSource:source,options:local});calculations+=2;
 eq(api.v219AutomaticResultSafety(source,draft).accepted,true,id+' complete draft calculation is source-verified');eq(draft.text,main.text,id+' complete draft result matches main-article result');
 const again=api.calculate({kind:'adjust',source:draft.text,originalSource:draft.text,options:local});calculations++;eq(again.text,draft.text,id+' draft is idempotent');
}
const receipt={suite:'bounded-article-draft-reference-whitespace-scope-2.21.5',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Only explicitly recognized article draft contexts receive the new article repairs');
