'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-11-03'};
let checks=0,calculations=0;const failures=[],rows=[];
function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({label,actual,expected});}}
const positives=[
 ['plain','Antes.\n\n\nDepois.','Antes.\n\nDepois.'],
 ['space-only','Antes.\n \nDepois.','Antes.\n\nDepois.'],
 ['tabs-only','Antes.\n\t\nDepois.','Antes.\n\nDepois.'],
 ['leading','\n \n\t\nTexto.','Texto.'],
 ['leading-before-template','\n\n{{Info/Biografia|nome=Exemplo}}\nTexto.','{{Info/Biografia|nome=Exemplo}}\nTexto.'],
 ['heading','== Título ==\n\n\nTexto.','== Título ==\n\nTexto.'],
 ['footer-template','Texto.\n\n\n{{Referências}}','Texto.\n\n{{Referências}}'],
 ['two-templates','{{Referências}}\n\n\n{{Esboço}}','{{Referências}}\n\n{{Esboço}}'],
 ['external-footer','* [https://example.org Site]\n\n\n{{Esboço}}','* [https://example.org Site]\n\n{{Esboço}}'],
 ['inline-reference','Texto<ref>Fonte.</ref>\n \nOutro parágrafo.\n{{Referências}}','Texto<ref>Fonte.</ref>\n\nOutro parágrafo.\n{{Referências}}'],
 ['list','* Primeiro\n\n\n* Segundo','* Primeiro\n\n* Segundo'],
 ['image','[[Imagem:Example.jpg|miniaturadaimagem|Legenda]]\n\n\nTexto.','[[Imagem:Example.jpg|miniaturadaimagem|Legenda]]\n\nTexto.'],
 ['closed-html','<div>Bloco.</div>\n\n\nTexto.','<div>Bloco.</div>\n\nTexto.'],
 ['tail-spaces','Texto.\n ','Texto.\n'],
 ['tail-extra','Texto.\n\n\n','Texto.\n\n'],
 ['broken-template-later','Antes.\n\n\nDepois.\n{{Incompleta','Antes.\n\nDepois.\n{{Incompleta'],
 ['broken-html-later','Antes.\n\n\nDepois.\n<div>Incompleto','Antes.\n\nDepois.\n<div>Incompleto'],
 ['broken-reference-later','Antes.\n\n\nDepois.\n<ref>Incompleto','Antes.\n\nDepois.\n<ref>Incompleto'],
 ['broken-table-later','Antes.\n\n\nDepois.\n{|\n| Tabela incompleta','Antes.\n\nDepois.\n{|\n| Tabela incompleta'],
 ['broken-link-later','Antes.\n\n\nDepois.\n[[Ligação incompleta','Antes.\n\nDepois.\n[[Ligação incompleta'],
 ['stray-html-later','Antes.\n\n\nDepois.\n</div>','Antes.\n\nDepois.\n</div>'],
 ['quoted-body-outside','Antes.\n\n\n"Texto de citação."','Antes.\n\n"Texto de citação."']
];
for(const newline of ['\n','\r\n'])for(const spaces of ['',' ','\t','  \t'])for(let count=3;count<=12;count++){
 const source='Primeiro.'+newline+(spaces+newline).repeat(count-1)+'Segundo.',expected='Primeiro.'+newline+newline+'Segundo.';
 positives.push(['gap-matrix-'+JSON.stringify(newline)+'-'+spaces.length+'-'+count,source,expected]);
}
for(const[id,source,expected]of positives){const p=api.v2215WhitespacePlan(source,cfg);eq(p.text,expected,id+' expected endpoint');eq(api.v2215WhitespaceProof(source,p.text,p,cfg),true,id+' fresh proof');eq(api.v2215WhitespacePlan(p.text,cfg).text,p.text,id+' idempotence');eq(api.v2215WhitespaceProof(source,p.text,{...p,sourceHash:'stale'},cfg),false,id+' stale proof');eq(api.v2215WhitespaceProof(source,p.text+'A',p,cfg),false,id+' added-content proof');rows.push({id,kind:'positive',sourceSha256:sha(source),candidateSha256:sha(p.text),edits:p.edits.length});}
const negatives=[
 ['already-correct','Antes.\n\nDepois.'],['no-gap','Texto.'],['blank-page','\n \n'],['nbsp-line','Antes.\n\u00a0\nDepois.'],
 ['indented-before',' Antes.\n\n\nDepois.'],['indented-after','Antes.\n\n\n Depois.'],
 ['indented-before-spaces',' Antes.\n \nDepois.'],['indented-after-spaces','Antes.\n \n Depois.'],
 ['leading-indented','\n \n Texto.'],['tail-indented',' Texto.\n '],['tab-indented','\tTexto.\n \nOutro.'],
 ['mixed-newlines','Antes.\r\n\n\nDepois.'],['bare-cr','Antes.\r\r\rDepois.'],
 ['template','{{Exemplo|valor=Antes.\n\n\nDepois.}}'],['template-spaces','{{Exemplo|valor=Antes.\n \nDepois.}}'],
 ['nested-template','{{Exemplo|{{Outro|Antes.\n\n\nDepois.}}}}'],
 ['table','{|\n| Antes.\n\n\nDepois.\n|}'],['nested-table','{|\n| {|\n| Antes.\n\n\nDepois.\n|}\n|}'],
 ['internal-link','[[Exemplo|Antes.\n\n\nDepois.]]'],['external-link','[https://example.org Antes.\n\n\nDepois.]'],
 ['reference','Texto<ref>Antes.\n\n\nDepois.</ref>\n{{Referências}}'],
 ['reference-bank','<references><ref name="n">Antes.\n\n\nDepois.</ref></references>'],
 ['html','<div>Antes.\n\n\nDepois.</div>'],['span','<span>Antes.\n \nDepois.</span>'],
 ['quote','"Antes.\n\n\nDepois."'],['comment','<!--Antes.\n\n\nDepois.-->'],
 ['unclosed-template-owner','{{Incompleta|Antes.\n\n\nDepois.'],['unclosed-reference-owner','<ref>Antes.\n\n\nDepois.'],
 ['unclosed-table-owner','{|\n| Antes.\n\n\nDepois.'],['unclosed-html-owner','<div>Antes.\n\n\nDepois.']
];
for(const tag of ['nowiki','pre','poem','code','math','chem','ce','source','syntaxhighlight','gallery','timeline','score'])negatives.push(['protected-'+tag,'<'+tag+'>Antes.\n\n\nDepois.</'+tag+'>']);
negatives.push(['fence','```wikitext\nAntes.\n\n\nDepois.\n```']);
for(const[id,source]of negatives){const p=api.v2215WhitespacePlan(source,cfg);eq(p.text,source,id+' source stays exact');eq(api.v2215WhitespaceProof(source,p.text,p,cfg),true,id+' deterministic no-op');rows.push({id,kind:'negative',sourceSha256:sha(source)});}
for(const delta of [{automaticProseGaps:false},{markup:false},{namespaceNumber:1,discussionPage:true},{namespaceNumber:10},{namespaceNumber:2},{contentModel:'javascript'},{sectionOnly:true},{pageRedirect:true},{pageDisambiguation:true}])eq(api.v2215WhitespacePlan('Antes.\n\n\nDepois.',{...cfg,...delta}).text,'Antes.\n\n\nDepois.','Disabled or non-article context');
for(const [id,source]of positives.slice(0,15)){
 const p=api.v2215WhitespacePlan(source,cfg),r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(api.v219AutomaticResultSafety(source,r).accepted,true,id+' full writer preservation');
 eq(r.text.includes('\n\n\n'),false,id+' full writer removes excessive paragraph gaps');
 const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});calculations++;eq(again.text,r.text,id+' full writer is idempotent');
 if(p.text!==source){const changed=p.text.replace('Texto.','Texto inventado.').replace('Antes.','Antes inventado.');if(changed!==p.text)eq(api.v2215WhitespaceProof(source,changed,p,cfg),false,id+' whitespace proof never authorizes a prose mutation');}
}
for(const suffix of ['{{Incompleta','<ref>Fonte incompleta','{|\n| Célula incompleta','<div>Bloco incompleto','[[Ligação incompleta']){
 const source='Antes.\n\n\nDepois.\n'+suffix,result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(api.v219AutomaticResultSafety(source,result).accepted,true,'A later incomplete owner does not reject an earlier independent gap repair');
 eq(result.text.startsWith('Antes.\n\nDepois.\n'),true,'The safe prefix repair reaches the complete writer');
 const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});calculations++;
 eq(again.text,result.text,'Safe prefix repair and existing finite syntax repairs are jointly idempotent');
}
for(const source of ['{{Descrição curta|Exemplo}}\nTexto.','{{Short description|Exemplo}}\n\nTexto.']){
 const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(api.v219AutomaticResultSafety(source,result).accepted,true,'Descriptor removal and final leading-line cleanup keep preservation');
 eq(/^[ \t]*\r?\n/.test(result.text),false,'Removing a short description leaves no leading empty line');
 eq(/Descrição curta|Short description/.test(result.text),false,'The existing descriptor repair still runs');
 const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});calculations++;
 eq(again.text,result.text,'Descriptor cleanup and whitespace are jointly idempotent');
}
const receipt={suite:'bounded-main-article-whitespace-2.21.5',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Whitespace repairs stay outside literal owners and preserve all other bytes');
