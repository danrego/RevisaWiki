'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),file=process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-11-05'},box='{{Info/Biografia|nome=Tema fictício|ocupação=Profissão<ref name="A">Fonte.</ref>}}',body='Texto.<ref>Fonte visível no corpo.</ref>',wrap=(a,b=body)=>a+'\n\n'+b+'\n\n[[Categoria:Exemplos]]';
const positive=wrap(box),formatted=api.v2217InfoboxProjection(positive,cfg),cases=[
 ['visible-body-inline-box',positive,true],['visible-body-formatted-box',formatted,true],
 ['visible-body-without-infobox',body+'\n\n[[Categoria:Exemplos]]',true],
 ['infobox-only-no-body-reference',wrap(box,'Texto.'),false],
 ['conditional-infobox-only',wrap('{{Info/Político|nome=Tema fictício|vice_título2=Rótulo<ref name="A">Fonte.</ref>}}','Texto.'),false],
 ['ignored-infobox-alias',wrap('{{Info/Político|nome=Tema fictício|vice-título2=Rótulo<ref name="A">Fonte.</ref>}}','Texto.'),false],
 ['unknown-infobox-consumer',wrap('{{Info/Consumidor fictício|nome=Tema|campo=Valor<ref name="A">Fonte.</ref>}}'),false],
 ['existing-default-collector',positive+'\n\n{{Referências}}',false],
 ['existing-ref-bank','Texto.<ref name="A"/>\n\n{{Referências|refs=<ref name="A">Fonte.</ref>}}',false],
 ['existing-custom-width','Texto.<ref>Fonte.</ref>\n\n{{Reflist|30em}}',false],
 ['existing-custom-group','Texto.<ref group="nota">Nota.</ref>\n\n<references group="nota"/>',false],
 ['unrendered-custom-group','Texto.<ref group="nota">Nota.</ref>\n\n'+body,false],
 ['undefined-named-reference','Texto.<ref name="sem-fonte"/>',false],
 ['conflicting-definitions','Texto.<ref name="A">Fonte1.</ref> Outro.<ref name="A">Fonte2.</ref>',false],
 ['opaque-reference-helper','Texto.{{sfn|Exemplo|2000}}\n\n'+body,false],
 ['unknown-outside-consumer','{{Consumidor fictício|x=1}}\n\n'+body,false],
 ['quoted-example-plus-visible-body','<nowiki><ref>Exemplo literal.</ref></nowiki>\n\n'+body,true],
 ['incomplete-reference','Texto.<ref>Fonte incompleta.',false],
 ['notes-producer-and-default-body','Texto.<ref group="nota">Nota.</ref> Outra.<ref>Fonte.</ref>',false],
 ['existing-combined-collector','Texto.<ref>Fonte.</ref>\n\n{{Notas e referências}}',false]
];
let checks=0;const rows=[],failures=[];function check(value,message){checks++;assert(value,message);}
for(const [id,source,expected]of cases){const row={id,sourceSha256:sha(source),expectedDefaultInsertion:expected};try{
 const plan=api.v221MissingDefaultCollectorPlan(source,cfg);row.producerEdits=plan.edits.length;check((plan.edits.length===1)===expected,id+' exact existing producer selection');
 if(expected){check(api.v221MissingDefaultCollectorProof(source,plan.text,plan,cfg),id+' source-bound proof');check(!api.v221MissingDefaultCollectorProof(source+' ',plan.text,plan,cfg),id+' stale-source refusal');const portal=api.v2217PortalPlan(plan.text,cfg);check(api.v2217PortalProof(plan.text,portal.text,portal,cfg),id+' portal proof after default collector');}
 else check(plan.text===source,id+' no unrelated template/group/bank conversion');
 if(expected&&process.env.REVISAWIKI_COLLECTOR_DIRECT_ONLY!=='1'){
  const first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});row.resultSha256=sha(first.text);row.collectors=(first.text.match(/\{\{Referências(?:\||}})/g)||[]).length;row.safetyAccepted=api.v219AutomaticResultSafety(source,first).accepted;
  check(row.safetyAccepted,id+' full action safety');check(row.collectors===1,id+' full action inserts one default collector');
  if(id!=='visible-body-without-infobox'&&id!=='quoted-example-plus-visible-body')check(first.text.includes('{{Portal3|Biografias}}'),id+' independent biography portal is retained');
  const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});check(second.text===first.text,id+' integrated idempotence');
 }
 row.status='passed';
 }catch(error){row.status='failed';row.error=String(error.stack||error);failures.push(row);}rows.push(row);
}
const report={kind:'existing-default-collector-prerequisite-order',bundle:path.basename(file),bundleSha256:sha(fs.readFileSync(file)),directOnly:process.env.REVISAWIKI_COLLECTOR_DIRECT_ONLY==='1',cases:rows.length,checks,failures:failures.length,rows,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({cases:rows.length,checks,failures:failures.length,directOnly:report.directOnly}));if(failures.length)process.exitCode=1;
