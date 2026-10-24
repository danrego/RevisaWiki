'use strict';
// Actual read-only UI preflight source with fictional full entity replies.
// Native browser transport and editor actions are tested by biography_ui_native.cjs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const api=require('./biography_harness.cjs'),root=path.resolve(__dirname,'../..'),
 body=fs.readFileSync(path.join(root,'src/v2_21/ui_preflights.js'),'utf8'),
 source='{{Info/Patologia|Nome=Tema fictício|ICDO=00123}}\n\nTexto fictício.',title='Tema fictício';
const baseEntity=()=>({id:'Q123',lastrevid:12,sitelinks:{ptwiki:{title}},claims:{P31:[{rank:'normal',mainsnak:{property:'P31',snaktype:'value',datavalue:{value:{id:'Q12136'}}}}]}});
let checks=0;const rows=[];
async function run(settings={}){
 const calls=[],cache=settings.cache||new Map(),entity=settings.entity===undefined?baseEntity():settings.entity,
  task={source,title,base:34,section:null,guard(){if(settings.changedDraft)throw Error('Draft changed');},...settings.task},
  context={Map,Date,Number,JSON,Promise,encodeURIComponent,endMatterReadCache:cache,
   v221CitationTitleRequests:()=>[],v221CitationTitleMetadataProof:()=>null,
   v221StructureExternalRequests:()=>({interwiki:[],files:[],sourceHash:'fixture'}),
   v221InfoboxEntityRequests:api.v221InfoboxEntityRequests,v221BioCompleteClaimsMap:api.v221BioCompleteClaimsMap,
   mw:{config:{get:key=>key==='wgWikibaseItemId'?(settings.item===undefined?'Q123':settings.item):(settings.wikiFlags||{})[key]||false},
    ForeignApi:class{constructor(endpoint,options){this.get=parameters=>{calls.push({endpoint,options,parameters});return settings.failure?Promise.reject(Error('Unavailable')):Promise.resolve({entities:{Q123:entity}});};}},
    Api:class{constructor(){throw Error('Unexpected local read');}}},$:{ajax(){throw Error('Unexpected metadata read');}}};
 vm.createContext(context);vm.runInContext(body+'\nglobalThis.prepare=v221PrepareEvidence;',context);
 const original=task.source;let result,error;
 try{result=await context.prepare(task,{...api.defaults,namespaceNumber:0,sectionOnly:false,automaticBiographyPortals:false,
  automaticTopicPortals:false,portals:false,registryDoiCheck:false,...settings.options});}catch(e){error=e.message;}
 assert.equal(task.source,original);checks++;assert.equal(task.preflightRequests.length,0);checks++;
 for(const call of calls){assert.equal(call.endpoint,'https://www.wikidata.org/w/api.php');assert.equal(call.options.anonymous,true);
  assert.deepEqual(JSON.parse(JSON.stringify(call.parameters)),{action:'wbgetentities',formatversion:2,ids:'Q123',props:'info|claims|sitelinks'});checks+=3;}
 return{result,error,calls,cache,task};
}
(async()=>{
 let result=await run();assert.equal(result.calls.length,1);checks++;assert.equal(result.result.v221InfoboxEntityProof.claimsComplete,true);checks++;
 assert.equal(result.result.v221InfoboxEntityProof.source,source);checks++;
 assert.equal(api.v221BiographyPlan(source,result.result).text,source.replace('ICDO=','CIDO='));checks++;
 rows.push({id:'absent-fallback-property',status:'passed'});
 const match=baseEntity();match.claims.P563=[{rank:'normal',mainsnak:{property:'P563',snaktype:'value',datavalue:{value:'00123'}}}];
 result=await run({entity:match});assert.equal(api.v221BiographyPlan(source,result.result).text,source.replace('ICDO=','CIDO='));checks++;
 for(const [id,claims]of [['null',null],['array',[]],['empty-string',''],['string','not-an-object'],['false',false],['true',true],['zero',0],['one',1],['number',13]]){
  const malformed=baseEntity();malformed.claims=claims;const r=await run({entity:malformed});
  assert.equal(r.error,undefined,id+' malformed response is safely handled');checks++;
  assert.equal(r.result.v221InfoboxEntityProof,undefined,id+' cannot create complete claims evidence');checks++;
  assert.equal(api.v221BiographyPlan(source,r.result).text,source,id+' cannot authorize fallback migration');checks++;
  rows.push({id:'claims-schema-'+id,status:'passed'});
 }
 for(const [id,mutate]of [
  ['wrong-item',e=>e.id='Q999'],['wrong-title',e=>e.sitelinks.ptwiki.title='Outro tema'],
  ['missing-revision',e=>delete e.lastrevid],['invalid-revision',e=>e.lastrevid=0],
  ['missing-claims',e=>delete e.claims],['array-claims',e=>e.claims=[]],
  ['conflicting-value',e=>e.claims.P563=[{rank:'normal',mainsnak:{property:'P563',snaktype:'value',datavalue:{value:'999'}}}]],
  ['qualified-value',e=>e.claims.P563=[{rank:'normal',qualifiers:{P580:[{}]},mainsnak:{property:'P563',snaktype:'value',datavalue:{value:'00123'}}}]],
  ['wrong-property',e=>e.claims.P563=[{rank:'normal',mainsnak:{property:'P557',snaktype:'value',datavalue:{value:'00123'}}}]]
 ]){
  const e=baseEntity();mutate(e);const r=await run({entity:e});assert.equal(r.error,undefined,id);checks++;
  assert.equal(api.v221BiographyPlan(source,r.result).text,source,id);checks++;rows.push({id,status:'passed'});
 }
 for(const settings of [{failure:true},{item:null},{options:{infoboxes:false}},{options:{automaticParameterNames:false}},
  {options:{automaticBiographyFields:false}},{options:{namespaceNumber:1}},{options:{sectionOnly:true}},
  {task:{section:'1'}},{wikiFlags:{wgIsRedirect:true}},{wikiFlags:{wgIsDisambiguationPage:true}},
  {task:{source:'Texto fictício sem campo a corrigir.'}},{task:{source:'<nowiki>'+source+'</nowiki>'}}]){
  const r=await run(settings);assert.equal(r.result.v221InfoboxEntityProof,undefined);checks++;
  assert.equal(api.v221BiographyPlan(r.task.source,r.result).text,r.task.source);checks++;
 }
 const cache=new Map([['v220-human:Q123',{time:Date.now(),data:{id:'Q123',claims:{P31:[]}}}]]);
 const first=await run({cache});assert.equal(first.calls.length,1);checks++;
 const changedSource=source+'\nTexto posterior.';const second=await run({cache,task:{source:changedSource}});
 assert.equal(second.calls.length,0);checks++;assert.equal(second.result.v221InfoboxEntityProof.source,changedSource);checks++;
 assert.equal(api.v221BiographyPlan(changedSource,second.result).text,changedSource.replace('ICDO=','CIDO='));checks++;
 const stale=await run({changedDraft:true});assert.equal(stale.error,'Draft changed');checks++;
 const injected=await run({task:{source:'Texto sem campo.'},options:{v221InfoboxEntityProof:{forged:true}}});
 assert.equal(injected.result.v221InfoboxEntityProof,undefined);checks++;
 const disabledFallback=await run({task:{source:'{{Info/Software|nome=Tema fictício|qid=none|repo=https://example.invalid/repo}}'}});
 assert.equal(disabledFallback.calls.length,0);checks++;
 assert.match(api.v221BiographyPlan(disabledFallback.task.source,disabledFallback.result).text,/repositório=https:\/\/example\.invalid\/repo/);checks++;
 console.log(JSON.stringify({suite:'biography-ui-preflight',status:'passed',checks,cases:rows,
  proofScope:'Actual preflight and candidate ownership/proof helpers. Fictional read-only transport, no external request or native browser claim.'}));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
