'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const loaded=require('./focused_infoboxes_harness.cjs').load(),a=loaded.api,data=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../src/v2_22_1/focused_infobox_data.json'))),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const name of ['v2221FocusedReferencePrerequisitePlan','v2221FocusedReferencePrerequisiteProof','v2221FocusedReferenceActivation','v2221FocusedActivatedReferenceAllows'])assert.equal(typeof a[name],'function',name);
const cfg={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',endMatter:true,automaticBiographyPortals:false,automaticTopicPortals:false,portals:false},results=[];let checks=0;
const eq=(x,y,m)=>{checks++;assert.equal(x,y,m);},ok=(x,m)=>{checks++;assert(x,m);};
const source=(owner,key,value='Valor<ref name="A">Fonte.</ref>',extra='')=>'{{'+owner+'|nome=Exemplo|'+key+'='+value+extra+'}}\n\nExemplo.\n\n[[Categoria:Exemplos]]';
function run(id,input,wantChange,options=cfg){const plan=a.v2221FocusedReferencePrerequisitePlan(input,options);eq(plan.text!==input,wantChange,id);ok(a.v2221FocusedReferencePrerequisiteProof(input,plan.text,plan,options),id+' proof');if(wantChange){eq((plan.text.match(/\{\{Referências\}\}/g)||[]).length,1,id+' one exact native collector');eq(a.v2221FocusedReferencePrerequisitePlan(plan.text,options).text,plan.text,id+' replay');const altered=JSON.parse(JSON.stringify(plan));altered.edits[0].count++;ok(!a.v2221FocusedReferencePrerequisiteProof(input,plan.text,altered,options),id+' counter tamper');ok(!a.v2221FocusedReferencePrerequisiteProof(input,plan.text+'X',plan,options),id+' output tamper');}results.push({id,changed:wantChange,inputSha256:sha(input),outputSha256:sha(plan.text)});return plan;}
const {readerFixture}=require('./focused_native_consumer_fixtures.cjs');
for(const record of data.nativeReferenceConsumers)for(const key of record.sourceKeys){const fixture=readerFixture(record,key),plan=run(record.owner+'/'+key,fixture.text,true);ok(plan.text.includes('|'+record.key+'='+fixture.value),record.key+' exact consumed field/value');eq(plan.edits.reduce((n,e)=>n+e.count,0),2,'Exactly one key and one collector');}
const redirectedConsumer=data.nativeReferenceConsumers.find(row=>row.owner==='Info/Biografia'&&row.key==='principais_trabalhos');
for(const owner of ['Info/Escritor','Info/Cientista'])for(const key of redirectedConsumer.sourceKeys)for(const variant of ['literal','empty-target','inline-lead','definition-and-reuse','native-citation']){
 const value=variant==='definition-and-reuse'?'Valor<ref name="A">Fonte.</ref> e reutilização<ref name="A"/>':variant==='native-citation'?'Valor<ref>{{citar web|url=https://example.invalid/fonte|título=Fonte}}</ref>':'Valor<ref name="A">Fonte.</ref>';
 let input=source(owner,key,value,variant==='empty-target'?'|principais_trabalhos= \n':'');if(variant==='inline-lead')input=input.replace('}}\n\nExemplo.',"}}'''Exemplo''' foi uma pessoa.");
 const plan=run(owner+'/'+key+'/'+variant,input,true);ok(plan.text.includes('|principais_trabalhos='+value),'Redirect target keeps the exact consumed value and references');eq(plan.edits.reduce((n,e)=>n+e.count,0),variant==='empty-target'||variant==='inline-lead'?3:2,'Only the real key, prerequisite boundary/empty field and collector count');
}
for(const owner of ['Info/Escritor','Info/Cientista']){
 const proof=data.nativeReferenceRedirects.find(row=>row.source.title==='Predefinição:'+owner);ok(a.v2221FocusedReferenceRedirect(owner,redirectedConsumer.native,redirectedConsumer.key,[proof]),'One exact pinned redirect accepted');
 for(const mutate of [row=>row.source.revision++,row=>row.source.sha256='0'.repeat(64),row=>row.target.revision++,row=>row.target.sha256='0'.repeat(64),row=>row.target.title='Predefinição:Info/Filme',row=>row.chain=['Predefinição:Info/Ator','Predefinição:Info/Biografia'],row=>row.sourceText+='<noinclude/>',row=>row.status='pending']){const bad=structuredClone(proof);mutate(bad);eq(a.v2221FocusedReferenceRedirect(owner,redirectedConsumer.native,redirectedConsumer.key,[bad]),null,'Stale or wrong redirect cannot authorize a consumer');}
 eq(a.v2221FocusedReferenceRedirect(owner,redirectedConsumer.native,redirectedConsumer.key,[proof,proof]),null,'Conflicting repeated source proofs refused');
 run(owner+'/filled-priority-alias',source(owner,'obras_destaque',undefined,'|trabalhos=Outra obra'),false);
 run(owner+'/opaque-program',source(owner,'obras_destaque',undefined,'|outro={{Emissor desconhecido}}'),false);
 run(owner+'/child',source(owner,'obras_destaque',undefined,'|child=yes'),false);
 const activation=a.v2221FocusedReferenceActivation(source(owner,'obras_destaque'),cfg),packet=structuredClone(activation.packet);packet.fields[0].redirect.source.revision++;ok(!a.v2221FocusedActivatedReferenceAllows(activation.mapped,cfg,packet),'Packet cannot change pinned redirect provenance');
}
eq(a.v2221FocusedReferenceRedirect('Info/Escritor desconhecido',redirectedConsumer.native,redirectedConsumer.key,data.nativeReferenceRedirects),null,'No arbitrary redirect graph accepted');
run('wrong-case-redirect-owner',source('Info/escritor','obras_destaque'),false);
for(const[owner,key,extra]of [['Info/Empresa','fundadores','|fundador=Outra pessoa'],['Info/Empresa','pessoas_chave','|principais pessoas=Outra pessoa'],['Info/Empresa','área atendida','|area_servida=Outra área'],['Info/Televisão','form_audio','|formato_áudio=Outro formato']])run(owner+'/'+key+'/native-priority-conflict',source(owner,key,undefined,extra),false);
const basic=source('Info/Filme','cinematography');
const inline=run('certified-box-prose-boundary',basic.replace('}}\n\nExemplo.',"}}'''Exemplo''' foi um filme."),true);eq(inline.edits.reduce((n,e)=>n+e.count,0),3,'Boundary newline, key and collector each count once');
const emptyTarget=run('strictly-empty-certified-destination',source('Info/Filme','cinematography',undefined,'|cinematografia= \n'),true);eq(emptyTarget.edits.reduce((n,e)=>n+e.count,0),3,'Key, certified empty destination and collector each count once');
run('filled-destination',source('Info/Filme','cinematography',undefined,'|cinematografia=Outra pessoa'),false);
run('comment-destination',source('Info/Filme','cinematography',undefined,'|cinematografia=<!-- preservar -->'),false);
run('dynamic-destination',source('Info/Filme','cinematography',undefined,'|cinematografia={{Outro}}'),false);
run('literal-native-citation-body',source('Info/Filme','cinematography','Valor<ref>{{citar web|url=https://example.invalid/fonte|título=Fonte}}</ref>'),true);
run('duplicate-renderer-in-other-field',source('Info/Filme','cinematography',undefined,'|roteiro={{Referências}}'),false);
run('named-definition-and-reuse',source('Info/Filme','cinematography','Valor<ref name="A">Fonte.</ref> e reutilização<ref name="A"/>'),true);
run('separate-undefined-reuse',source('Info/Filme','cinematography','Valor<ref name="A">Fonte.</ref><ref name="B"/>'),false);
run('conflicting-named-definitions',source('Info/Filme','cinematography','Valor<ref name="A">Fonte.</ref><ref name="A">Outra fonte.</ref>'),false);
run('specific-group',source('Info/Filme','cinematography','Valor<ref group="note">Nota.</ref>'),false);
run('mixed-groups',source('Info/Filme','cinematography','Valor<ref>Fonte.</ref><ref group="nota">Nota.</ref>'),false);
run('unknown-ref-attribute',source('Info/Filme','cinematography','Valor<ref dir="rtl">Fonte.</ref>'),false);
run('dynamic-field-wrapper',source('Info/Filme','cinematography','{{Outro|Valor<ref>Fonte.</ref>}}'),false);
run('unknown-outside-producer',basic+'\n{{Outro}}',false);
run('unknown-same-owner-other-field',source('Info/Filme','cinematography',undefined,'|outro={{Emissor desconhecido}}'),false);
run('unknown-same-owner-native-field',source('Info/Filme','cinematography',undefined,'|roteiro={{UnknownCollector}}'),false);
run('unknown-reference-body-producer',source('Info/Filme','cinematography','Valor<ref>{{Emissor desconhecido}}</ref>'),false);
const multi=source('Info/Filme','cinematography','Diretor<ref name="A">Fonte.</ref>','|historia=História<ref name="B">Outra fonte.</ref>');
const multiPlan=run('multiple-current-native-targets',multi,true);eq(multiPlan.edits.reduce((n,e)=>n+e.count,0),3,'Two actual keys and one collector');
run('unknown-owner',source('Info/Unknown','cinematography'),false);
run('wrong-native-case',source('Info/filme','cinematography'),false);
run('multiple-boxes',basic+'\n{{Info/Biografia|nome=Outra pessoa}}',false);
run('html-wrapper','<div>'+basic+'</div>',false);
run('table-wrapper','{|\n|'+basic+'\n|}',false);
run('child-owner',source('Info/Filme','cinematography',undefined,'|child=yes'),false);
run('nowiki','<nowiki>'+basic+'</nowiki>',false);
run('comment','<!--'+basic+'-->',false);
run('existing-renderer',basic.replace('[[Categoria:Exemplos]]','{{Referências}}\n\n[[Categoria:Exemplos]]'),false);
run('independent-body-reference',basic.replace('Exemplo.','Exemplo.<ref>Fonte no corpo.</ref>'),false);
run('talk-namespace',basic,false,{...cfg,namespaceNumber:1});run('partial-section',basic,false,{...cfg,sectionOnly:true});run('redirect-context',basic,false,{...cfg,pageRedirect:true});run('disambiguation-context',basic,false,{...cfg,pageDisambiguation:true});
run('references-disabled',basic,false,{...cfg,references:false});run('endmatter-disabled',basic,false,{...cfg,endMatter:false});run('field-renames-disabled',basic,false,{...cfg,automaticParameterNames:false});
const activation=a.v2221FocusedReferenceActivation(basic,cfg);ok(activation,'Positive activation packet');ok(a.v2221FocusedActivatedReferenceAllows(activation.mapped,cfg,activation.packet),'Packet exact source');ok(a.v2221FocusedActivatedReferenceAllows(activation.mapped,cfg,activation.packet,{start:activation.packet.owner.start,end:activation.packet.owner.end}),'Owner exact span');
for(const mutate of [p=>p.sourceHash='wrong',p=>p.mappedHash='wrong',p=>p.owner.native.sha256='0'.repeat(64),p=>p.fields[0].valueHash='wrong',p=>p.ownerInventoryHash='wrong',p=>p.originalSource+=' ']){const packet=structuredClone(activation.packet);mutate(packet);ok(!a.v2221FocusedActivatedReferenceAllows(activation.mapped,cfg,packet),'Forged activation rejected');}
ok(!a.v2221FocusedActivatedReferenceAllows(null,cfg,activation.packet),'Wrong source type cannot authorize a proof');
ok(!a.v2221FocusedActivatedReferenceAllows(activation.mapped,cfg,activation.packet,{start:1,end:activation.packet.owner.end}),'Forged owner span');ok(!a.v2221FocusedActivatedReferenceAllows(activation.mapped,{...cfg,references:false},activation.packet),'Proof cannot override disabled option');
const report={kind:'native-infobox-literal-reference-prerequisite-unit',status:'passed',mode:loaded.receipt.mode,runtimeSha256:loaded.receipt.runtimeSha256||null,consumerTargets:data.nativeReferenceConsumers.length,cases:results.length,checks,results,wikipediaWrites:0,networkRequests:0};if(process.env.REVISAWIKI_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...report,results:undefined}));
