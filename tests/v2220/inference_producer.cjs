'use strict';
const assert=require('node:assert/strict'),{load}=require('./inference_harness.cjs');
const{api:a,testContext}=load(),cfg={namespaceNumber:0,pageTitle:'Exemplo',contentModel:'wikitext'},url='https://example.org/source';let assertions=0,cases=0;
function ok(v,label){assert(v,label);assertions++;}function eq(x,y,label){assert.equal(x,y,label);assertions++;}
function snak(property,value){return {snaktype:'value',property,datatype:'wikibase-item',datavalue:{value:{id:value},type:'wikibase-entityid'}};}
function statement(property,value){return {rank:'normal',mainsnak:snak(property,value),references:[{snaks:{P854:[{snaktype:'value',property:'P854',datatype:'url',datavalue:{value:url,type:'string'}}]}}]};}
function scenario(contract){
 const auto=contract.automatic;
 const source=auto.property==='P19'
  ? '{{Info/Biografia|nome=Pessoa|local_nascimento=[['+auto.topicTitle+']]<ref>{{citar web|url='+url+'|titulo=Local}}</ref>}}\n'+"'''Pessoa''' é escritora."
  : "'''Objeto''' é um [["+auto.topicTitle+']].<ref>{{citar web|url='+url+'|titulo=Classe}}</ref>';
 const body=auto.property==='P19'
  ? 'Esta categoria reúne artigos de pessoas nascidas em [['+auto.topicTitle+']].'
  : auto.criterion==='literal-category-main-topic'?'{{Cat main|'+auto.topicTitle+'}}':'Esta categoria contém páginas sobre [['+auto.topicTitle+']].';
 const meta={query:{pages:[
  {pageid:1,ns:0,title:'Exemplo',pageprops:{wikibase_item:'Q111'}},
  {pageid:2,ns:0,title:auto.topicTitle,pageprops:{wikibase_item:'Q222'}}
 ]}};
 const native={parse:{title:'Exemplo',pageid:1,categories:[],parsewarnings:[]}};
 const category={query:{pages:[{pageid:3,ns:14,title:contract.targetCategory,pageprops:{},revisions:[{revid:123,slots:{main:{contentmodel:'wikitext',content:body}}}],categories:[]}]}};
 const claims=auto.property==='P19'?{P31:[statement('P31','Q5')],P19:[statement('P19','Q222')]}:{P31:[statement('P31','Q222')]};
 const entities={entities:{
  Q111:{id:'Q111',lastrevid:99,labels:{pt:{value:auto.property==='P19'?'Pessoa':'Objeto'}},claims,sitelinks:{ptwiki:{title:'Exemplo'}}},
  Q222:{id:'Q222',lastrevid:101,claims:{},sitelinks:{ptwiki:{title:auto.topicTitle}}}
 }};
 const state={contract,source,meta,native,category,entities,calls:[],guardCalls:0,portalFailure:false};
 state.api={cache:new Map(),guard(){state.guardCalls++;},async request(site,params,details){
  state.calls.push({site,params,details});
  if(params.action==='parse')return state.native;
  if(params.action==='wbgetentities')return state.entities;
  if(params.prop==='pageprops')return state.meta;
  if(params.prop==='pageprops|revisions|categories')return state.category;
  if(params.prop==='info'){
   if(state.portalFailure)throw Error('unavailable');
   return {query:{pages:params.titles.split('|').map((title,i)=>({title,pageid:50+i,ns:100}))}};
  }
  throw Error('Unexpected request');
 }};
 return state;
}
async function run(state,options=cfg){const before=JSON.stringify(options),prepared=await a.v222PrepareCategoryEvidence(state.source,options,state.api);eq(JSON.stringify(options),before,'Caller options untouched');ok(state.calls.every(x=>['query','parse','wbgetentities'].includes(x.params.action)),'Only read actions');ok(state.calls.every(x=>x.details.method===(x.params.action==='parse'?'POST':'GET')),'POST only unsaved parse');return prepared;}
(async()=>{
 for(const contract of a.v222CategoryAutomaticTargets()){const state=scenario(contract),options=await run(state);ok(options.v222CategoryContext?.generatedCategoriesChecked,'Exact native parse checked');ok(options.v222CategoryProofs?.some(x=>x.criterionHash===contract.criterionHash),'Current criterion, item, source and URL reconciled');ok(options.v222CategoryProofs.every(x=>x.specificityScope?.cataloguedAutomaticContracts===171&&x.specificityScope.globalTaxonomyTraversed===false&&x.specificityScope.currentParentListsChecked.includes(contract.targetCategory)),'Specificity is explicitly bounded to the complete eligible pool and parent responses');const plan=a.v222InferencePlan(state.source,options);ok(plan.text.includes('[['+contract.targetCategory+']]'),'Producer reaches actual category action');ok(a.v222InferenceProof(state.source,plan.text,plan,options),'Action proof replays');ok(state.calls.length>=4&&state.guardCalls>=state.calls.length*2,'Bounded guarded reads');const n=state.calls.length;await run(state);eq(state.calls.length,n,'Exact repeat reuses bounded read cache');cases++;}
 const science=a.v222CategoryAutomaticTargets().find(x=>x.automatic.property==='P31'),birth=a.v222CategoryAutomaticTargets().find(x=>x.automatic.property==='P19');
 const faults=[s=>s.native.parse.categories.push({category:'Ciência'}),s=>s.native.parse.parsewarnings.push('warning'),s=>s.meta.query.pages[0].pageprops.wikibase_item='Q999',s=>s.meta.query.pages[1].pageprops.disambiguation='',s=>s.entities.entities.Q111.sitelinks.ptwiki.title='Outro',s=>s.entities.entities.Q222.sitelinks.ptwiki.title='Outro',s=>s.entities.entities.Q111.claims.P31[0].references=[],s=>s.entities.entities.Q111.claims.P31[0].rank='deprecated',s=>s.entities.entities.Q111.claims.P31[0].qualifiers={P580:[{value:2000}]},s=>s.entities.entities.Q111.claims.P31.push(statement('P31','Q999')),s=>s.entities.entities.Q111.claims.P31[0].references[0].snaks.P854[0].datavalue.value='https://example.org/unrelated',s=>s.category.query.pages[0].revisions[0].slots.main.content='{{Cat main|Outra classe}}',s=>s.category.query.pages[0].revisions[0].slots.main.content+='\n{{Redirecionamento de categoria|Outra}}',s=>s.category.query.pages[0].pageprops.hiddencat='',s=>s.category.query.pages[0].title='Categoria:Outro destino',s=>s.category.continue={clcontinue:'next'},s=>s.category.query.pages[0].missing=true,s=>delete s.category.query.pages[0].categories,s=>s.category.query.pages[0].categories=[{title:'Unverified parent'}]];
 for(const mutate of faults){const state=scenario(science);mutate(state);const options=await run(state);ok(!options.v222CategoryProofs?.length,'Unknown/conflicting input is not an attestation');eq(a.v222InferencePlan(state.source,options).text,state.source,'No inferred classification from failed evidence');cases++;}
 for(const mutate of [s=>s.entities.entities.Q111.claims.P19.push(statement('P19','Q999')),s=>s.entities.entities.Q111.claims.P31=[statement('P31','Q999')],s=>s.entities.entities.Q111.claims.P19[0].references=[],s=>s.category.query.pages[0].revisions[0].slots.main.content='Esta categoria contém páginas sobre [['+s.contract.automatic.topicTitle+']].']){const state=scenario(birth);mutate(state);const options=await run(state);ok(!options.v222CategoryProofs?.length,'Birthplace is not citizenship/unsupported geography');cases++;}
 for(const source of ['Texto sem referência.',"'''Objeto''' é um [[Anã branca]].",'<nowiki>'+scenario(science).source+'</nowiki>',scenario(science).source+'\n[[Categoria:Botânica]]']){const state=scenario(science);state.source=source;await run(state);eq(state.calls.length,0,'Ineligible source causes no extra network');cases++;}
 const unavailable=scenario(science);unavailable.portalFailure=true;const partial=await run(unavailable,{...cfg,v2212PortalProofRequired:true,v2212OriginalDraftHash:a.v222InferenceEmpty(unavailable.source).sourceHash,v2212PortalAvailability:{sourceHash:a.v222InferenceEmpty(unavailable.source).sourceHash,exists:[]}});ok(partial.v222CategoryProofs?.length,'A later portal lookup failure keeps verified category');ok(a.v222InferencePlan(unavailable.source,partial).text.includes('[['+science.targetCategory+']]'),'Local failure does not veto independent verified action');
 const missingItem=scenario(science);delete missingItem.meta.query.pages[0].pageprops.wikibase_item;await run(missingItem);eq(missingItem.calls.length,1,'No item means no further acquisition');
 const changedName=scenario(science);changedName.entities.entities.Q111.labels.pt.value='Outra identidade';let altered=await run(changedName);ok(!altered.v222CategoryProofs?.length,'Different draft subject name cannot borrow existing page item');
 const aliases=scenario(birth);aliases.category.query.pages[0].revisions[0].slots.main.content='{{cat2|as pessoas naturais da cidade de '+"'''[[Alias do lugar]]'''"+'}}';aliases.meta.query.redirects=[{from:'Alias do lugar',to:birth.automatic.topicTitle}];const aliasProof=await run(aliases);ok(aliasProof.v222CategoryProofs?.length,'Current category-definition alias reconciles to exact same item');
 const ambiguous=scenario(birth);ambiguous.category.query.pages[0].revisions[0].slots.main.content='{{cat2|as pessoas naturais da cidade de [[Outro lugar]]}}';ambiguous.meta.query.pages.push({pageid:8,ns:0,title:'Outro lugar',pageprops:{wikibase_item:'Q999'}});ok(!(await run(ambiguous)).v222CategoryProofs?.length,'A different native category topic is not a birthplace alias');
 const quoted=scenario(birth);quoted.category.query.pages[0].revisions[0].slots.main.content='<nowiki>{{cat2|as pessoas naturais da cidade de [['+birth.automatic.topicTitle+']]}}</nowiki>';ok(!(await run(quoted)).v222CategoryProofs?.length,'A literal category-definition example is not the criterion');
 const transport=scenario(science),oldFetch=testContext.fetch,fetchCalls=[];
 try{testContext.fetch=async function(endpoint,options){fetchCalls.push({endpoint,options});eq(options.credentials,'omit','No account credentials');eq(options.cache,'no-store','No stale HTTP draft cache');eq(options.redirect,'error','Do not follow an unexpected service redirect');const parsed=new URL(endpoint),params=Object.fromEntries((options.method==='POST'?options.body:new URLSearchParams(parsed.search)).entries());ok(['query','parse','wbgetentities'].includes(params.action),'Default transport read actions only');ok(['pt.wikipedia.org','www.wikidata.org'].includes(parsed.hostname),'Fixed Wikimedia endpoints');const data=await transport.api.request(parsed.hostname==='www.wikidata.org'?'wikidata':'ptwiki',params,{method:options.method});return {ok:true,text:async()=>JSON.stringify(data)};};const prepared=await a.v222PrepareCategoryEvidence(transport.source,cfg,{cache:new Map()});ok(prepared.v222CategoryProofs?.length,'Default anonymous transport reaches a verified proof');ok(fetchCalls.some(x=>x.options.method==='POST'&&!x.endpoint.includes('text=')),'Draft parse uses the unsaved POST body');}finally{if(oldFetch===undefined)delete testContext.fetch;else testContext.fetch=oldFetch;}
 console.log(JSON.stringify({assertions,cases:cases+7,positiveProducerContracts:171,readOnlyMockTransport:true,realNetworkRequests:0,noSourceClaimsAudited:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
