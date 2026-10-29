'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||process.argv[2]||'dist/2.21.4/RevisaWiki_v2_21_4.js'),api=require(file),sha=raw=>crypto.createHash('sha256').update(raw).digest('hex'),runtime=sha(fs.readFileSync(file));
let checks=0;const eq=(a,b,message)=>{checks++;assert.deepEqual(a,b,message);},ok=(value,message)=>{checks++;assert.ok(value,message);};
const names=['syntax','prose','citations','references','tables','biography','footer'],requested={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema sintético',autoPreview:false,registryDoiCheck:false,proofPayload:{source:'Fonte sintética',value:[1,2,3]}},source='Texto sintético.',context='contexto-sintético-selado';
for(let length=0;length<=names.length;length++){
 const enabled=names.slice(0,length),cfg=api.v2214RecoveryOptions(requested,enabled);ok(cfg,'A finite ordered subset exists');
 eq(cfg.proofPayload,requested.proofPayload,'Preflight values never change');eq(cfg.namespaceNumber,0,'Page context never changes');
 for(const[key,value]of Object.entries(cfg))if(value!==requested[key]&&key!=='proofPayload')ok(requested[key]===true&&value===false,'Only an existing true boolean can become false: '+key);
 const proof=api.v219CompositionSafetyVerdict(source,source,cfg,JSON.stringify(cfg),context),certificate=api.v2214RecoveryCertificate(source,requested,cfg,enabled,context),result={text:source,preservation:[],localCompositionSafety:proof,automaticRecovery:certificate};
 ok(certificate,'A certificate binds the original and effective snapshots');eq(api.v2214EffectiveResultOptions(source,result,requested,context),cfg,'The certificate rederives the exact subset');
 const job={kind:'adjust',source,options:requested,localSafetyOptionsSnapshot:JSON.stringify(requested),localSafetyContext:context};ok(api.v219BindLocalResultSafety(job,result),'The actual result binder accepts an exact restricted snapshot');const forged=structuredClone(result);forged.automaticRecovery.effectiveOptionsSnapshot+=' ';let refused=false;try{api.v219BindLocalResultSafety(job,forged);}catch{refused=true;}ok(refused,'The actual result binder refuses altered effective options');
 eq(api.v2214EffectiveResultOptions(source+'x',result,requested,context),null,'Another source cannot borrow the certificate');eq(api.v2214EffectiveResultOptions(source,result,requested,context+'x'),null,'Another editor context cannot borrow the certificate');
 for(const mutate of [r=>{r.automaticRecovery.effectiveOptionsSnapshot+=' ';},r=>{r.automaticRecovery.requestedOptionsSnapshot+=' ';},r=>{r.automaticRecovery.enabledGroups.push('unknown');},r=>{r.localCompositionSafety.optionsSnapshot+=' ';},r=>{r.localCompositionSafety.candidate+='x';}]){const bad=structuredClone(result);mutate(bad);eq(api.v2214EffectiveResultOptions(source,bad,requested,context),null,'A mutated request/result cannot acquire a subset proof');}
}
for(const value of [['prose','syntax'],['syntax','syntax'],['unknown'],null])eq(api.v2214RecoveryOptions(requested,value),null,'Malformed/noncanonical group selections are refused');
const partial=api.v2214RecoveryOptions({namespaceNumber:0},[]);eq(partial.namespaceNumber,0,'An explicitly supplied context is unchanged');eq(partial.links,false,'A default-true writer can be disabled without enabling a new writer');
const off=api.v2214RecoveryOptions({...requested,links:false},names);eq(off.links,false,'An explicit user opt-out never becomes true');
for(const extra of [{explicitChoice:{}},{semanticHistory:{}},{originalSource:source+'x'},{safetySource:source+'x'},{localSafetyOptionsSnapshot:'not-the-request'},{options:{...requested,v2212OriginalDraftHash:'wrong'}}])eq(api.v2214RecoveryJobAllowed({kind:'adjust',source,options:requested,...extra}),false,'Historical/manual/stale inputs never enter automatic subset recovery');
for(const enabled of [[],['tables'],['biography'],['prose']]){
 const cfg=api.v2214RecoveryOptions(requested,enabled),s='Texto.<ref name="a">Fonte A.</ref>\nOutro.<ref name="a"/>\n{{Referências}}';
 for(const t of [s.replace('name="a"','name="b"'),s.replace('Fonte A.','Fonte B.')]){
  ok(api.preservationAudit(s,t,cfg).some(f=>f.code==='lost-reference-binding'),'Disabling reference writers never disables reference binding retention');
  ok(api.safeComposition(s,t,cfg).length>0,'The full composition guard still rejects a changed reference');
 }
 ok(api.preservationAudit('Texto original.','Texto alterado.',cfg).some(f=>f.code==='lost-prose'),'The retained source prose is protected under restricted configurations');
}
eq(sha(fs.readFileSync(file)),runtime,'The runtime file remains unchanged');
const result={kind:'restricted-recovery-certificate-contract',runtimeSha256:runtime,checks,articleCalculations:0,networkRequests:0,wikipediaWrites:0,status:'passed'};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
