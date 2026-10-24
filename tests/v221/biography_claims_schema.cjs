'use strict';
// Completeness is a map-shape assertion, not a whitelist of Wikidata values.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const api=require('./biography_harness.cjs'),root=path.resolve(__dirname,'../..'),
 preflight=fs.readFileSync(path.join(root,'src/v2_21/ui_preflights.js'),'utf8'),
 source='{{Info/Patologia|Nome=Tema fictício|ICDO=00123}}\n\nTexto fictício.',title='Tema fictício',
 cfg={...api.defaults,namespaceNumber:0,pageTitle:title,automaticBiographyPortals:false,automaticTopicPortals:false,portals:false,registryDoiCheck:false};
const fixture=require('./biography_claims_schema_cases.json'),valid=fixture.valid.map(row=>[row.id,row.claims]),invalid=fixture.invalid.map(row=>[row.id,row.claims]);
let checks=0;const rows=[];
async function run(id,claims,expected){
 const original=structuredClone(claims),entity={id:'Q123',lastrevid:12,sitelinks:{ptwiki:{title}},claims},
  proof={source,title,namespace:0,fullPage:true,redirect:false,disambiguation:false,claimsComplete:true,entityId:'Q123',entity};
 assert.equal(api.v221BioCompleteClaimsMap(claims),expected,id+' map guard');checks++;
 const direct=api.v221BiographyPlan(source,{...cfg,v221InfoboxEntityProof:proof}),want=expected?source.replace('ICDO=','CIDO='):source;
 assert.equal(direct.text,want,id+' forged completeness cannot bypass consumer');checks++;
 assert.equal(api.v221BiographyProof(source,direct.text,direct,{...cfg,v221InfoboxEntityProof:proof}),true,id+' exact proof');checks++;
 const task={source,title,base:34,section:null,guard(){}};let calls=0;
 const context={Map,Date,Number,JSON,Promise,encodeURIComponent,endMatterReadCache:new Map(),
  v221CitationTitleRequests:()=>[],v221CitationTitleMetadataProof:()=>null,
  v221StructureExternalRequests:()=>({interwiki:[],files:[],sourceHash:'fixture'}),
  v221InfoboxEntityRequests:api.v221InfoboxEntityRequests,v221BioCompleteClaimsMap:api.v221BioCompleteClaimsMap,
  mw:{config:{get:key=>key==='wgWikibaseItemId'?'Q123':false},ForeignApi:class{constructor(endpoint,options){
   assert.equal(endpoint,'https://www.wikidata.org/w/api.php');assert.equal(options.anonymous,true);checks+=2;
   this.get=request=>{assert.equal(request.props,'info|claims|sitelinks');checks++;calls++;return Promise.resolve({entities:{Q123:entity}});};
  }}},$:{ajax(){throw Error('Unexpected metadata read');}}};
 vm.createContext(context);vm.runInContext(preflight+'\nglobalThis.prepare=v221PrepareEvidence;',context);
 const produced=await context.prepare(task,cfg);
 assert.equal(calls,1,id+' one read-only request');assert.equal(!!produced.v221InfoboxEntityProof,expected,id+' producer completeness');
 assert.equal(api.v221BiographyPlan(source,produced).text,want,id+' producer and consumer');
 assert.equal(task.source,source,id+' draft unchanged');assert.deepEqual(claims,original,id+' metadata unchanged');checks+=5;
 // Structural sitelink evidence is independent of statement-map completeness.
 assert.equal(!!produced.v221StructureExternalProof,true,id+' independent sitelink proof retained');checks++;
 rows.push({id,expected,passed:true});
}
(async()=>{
 for(const[id,claims]of valid)await run(id,claims,true);
 for(const[id,claims]of invalid)await run(id,claims,false);
 console.log(JSON.stringify({kind:'biography-complete-claims-map',status:'passed',cases:rows.length,checks,rows,
  runtime:api.__biographyTestHarness,proofScope:'Actual map guard, local ownership proof and read-only UI producer with fictional JSON replies. No live reads, publication or native browser claim.',networkRequests:0,wikipediaWrites:0}));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
