'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||process.env.REVISAWIKI_BUNDLE||''),a=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),data=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../src/v2_22_1/focused_infobox_data.json')));assert.equal(a.version,'2.22.1');assert.equal(typeof a.v2221FocusedReferencePrerequisitePlan,'function');
const cfg={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',endMatter:true,autoPreview:false,registryDoiCheck:false,automaticBiographyPortals:false,automaticTopicPortals:false,portals:false},rows=[],failures=[];let checks=0,calculations=0;
const eq=(x,y,m)=>{checks++;assert.deepEqual(x,y,m);},ok=(x,m)=>{checks++;assert(x,m);};
const source=(owner,key,extra='')=>'{{'+owner+'|nome=Exemplo|'+key+'=Valor<ref name="A">Fonte.</ref>'+extra+'}}\n\nExemplo.\n\n[[Categoria:Exemplos]]';
function action(id,input,verify,options=cfg){let r;try{const request={kind:'adjust',source:input,originalSource:input,options},before=JSON.stringify(request);r=a.calculate(request);calculations++;eq(JSON.stringify(request),before,id+' draft input unchanged');eq(a.v219AutomaticResultSafety(input,r).accepted,true,id+' authoritative final gate');eq(a.v2217AnchorRawAudit(input,r.text,options),[],id+' raw reference preservation');verify(r.text,r);const replay=a.calculate({kind:'adjust',source:r.text,originalSource:r.text,options});calculations++;eq(replay.text,r.text,id+' replay bytes');eq(replay.changes.reduce((n,c)=>n+c.count,0),0,id+' replay counts');rows.push({id,status:'passed',inputSha256:sha(input),outputSha256:sha(r.text),changes:r.changes});}catch(error){failures.push({id,inputSha256:sha(input),outputSha256:r&&sha(r.text),error:String(error.stack||error)});rows.push({id,status:'failed',inputSha256:sha(input)});}}
function mappedField(text,record,value='Valor<ref name="A">Fonte.</ref>'){const node=a.v2221FocusedNodes(text,cfg).find(n=>a.v2221InfoboxRead(text.slice(n.start,n.end))?.title===record.owner);ok(node,'Actual native owner retained');const box=a.v2221InfoboxRead(text.slice(node.start,node.end)),fields=box.fields.filter(f=>f.key===record.key);eq(fields.length,1,'One current native field');eq(fields[0].value.trim(),value,'Exact literal field/reference value');eq((text.match(/\{\{Referências\}\}/g)||[]).length,1,'One standalone preferred collector');ok(/\n\n\{\{Referências\}\}\n\n/.test(text),'Collector is a separate footer block');}
const {readerFixture}=require('./focused_native_consumer_fixtures.cjs');
for(const record of data.nativeReferenceConsumers)for(const key of record.sourceKeys){
 const literal=readerFixture(record,key),empty=readerFixture(record,key,true),expected={...record,owner:literal.owner};
 action(literal.owner+'/'+key,literal.text,t=>mappedField(t,expected,literal.value));
 action(literal.owner+'/'+key+'/empty-target',empty.text,t=>mappedField(t,expected,empty.value));
}
const redirectedConsumer=data.nativeReferenceConsumers.find(row=>row.owner==='Info/Biografia'&&row.key==='principais_trabalhos');
for(const owner of ['Info/Escritor','Info/Cientista'])for(const key of redirectedConsumer.sourceKeys)for(const variant of ['literal','empty-target','inline-lead','definition-and-reuse','native-citation']){
 const value=variant==='definition-and-reuse'?'Valor<ref name="A">Fonte.</ref> e reutilização<ref name="A"/>':variant==='native-citation'?'Valor<ref>{{citar web|url=https://example.invalid/fonte|título=Fonte}}</ref>':'Valor<ref name="A">Fonte.</ref>';
 let input=source(owner,key,variant==='empty-target'?'|principais_trabalhos= \n':'').replace('Valor<ref name="A">Fonte.</ref>',value);if(variant==='inline-lead')input=input.replace('}}\n\nExemplo.',"}}'''Exemplo''' foi uma pessoa.");
 action(owner+'/'+key+'/'+variant,input,t=>mappedField(t,{...redirectedConsumer,owner},value));
}
for(const owner of ['Info/Filme','Info/Biografia','Info/Taxonomia']){const record=data.nativeReferenceConsumers.find(r=>r.owner===owner),input=source(owner,record.sourceKeys[0]);
 action(owner+'/existing-renderer',input.replace('[[Categoria:Exemplos]]','{{Referências}}\n\n[[Categoria:Exemplos]]'),t=>mappedField(t,record));
 action(owner+'/independent-body-ref',input.replace('Exemplo.','Exemplo.<ref name="B">Fonte no corpo.</ref>'),t=>mappedField(t,record));
}
const film=data.nativeReferenceConsumers.find(r=>r.owner==='Info/Filme'&&r.key==='cinematografia');
action('inline-box-and-lead',source(film.owner,film.sourceKeys[0]).replace('}}\n\nExemplo.',"}}'''Exemplo''' foi um filme."),t=>mappedField(t,film));
for(const [id,extra]of [['unknown-program','|outro={{Emissor desconhecido}}'],['native-field-unknown-program','|roteiro={{UnknownCollector}}'],['contested-alias','|cinematografia=Outra pessoa']]){
 const input=source(film.owner,film.sourceKeys[0],extra)+'\n{{DEFAULTSORT:Exemplo}}';
 action(id,input,(t)=>{eq(a.v2221FocusedReferencePrerequisitePlan(input,cfg).edits.length,0,id+' no unsafe coupled repair');ok(t.includes('Fonte.</ref>'),id+' literal source preserved');ok(!t.includes('{{Referências}}'),id+' no unproved renderer');ok(t.includes('{{ORDENAÇÃOPADRÃO:Exemplo}}'),id+' independent known adjustment survives');});
}
const report={kind:'actual-native-infobox-reference-prerequisite-complete-action',status:failures.length?'failed':'passed',runtimeSha256:sha(fs.readFileSync(file)),consumerTargets:data.nativeReferenceConsumers.length,cases:rows.length,checks,calculations,rows,failures,sourcePreserved:true,wikipediaWrites:0,networkRequests:0};if(process.env.REVISAWIKI_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...report,rows:undefined}));if(failures.length)process.exitCode=1;
