'use strict';
const assert=require('node:assert/strict');
const {api,cfg,file,sourceSha}=require('./harness.cjs');
let checks=0;const settings={...cfg,pageTitle:'Tema'},source='A<ref name="original">Fonte original.</ref>\nB<ref>[https://example.org/a Notas de aula]</ref>\nC<ref>[https://example.org/a Notas de aula]</ref>\n{{efn|Nota.}}\n{{Notas e referências}}\n';
const bare=api.v219CitationLanguageBareReferencePlan(source,settings),reuse=api.v2216ReferencePlan(bare.text,settings),named=api.v2216AutonamePlan(reuse.text,settings),after=named.text;
const declined={accepted:false,reason:'A posição de uma definição nomeada mudou fora dos ajustes confirmados.',checked:4};
function eq(a,b,message){checks++;assert.deepEqual(a,b,message);}
eq(api.v222ReferenceBindingFallback(source,after,settings).accepted,true,'producer proof exists');
eq(api.v222OriginalReferenceBindingGuard(source,after,settings,declined),declined,'no inferred original outside audit');
const inspect=(before,target,options=settings,original=declined)=>api.v222WithOriginalAuditContext(before,target,options,(projectedBefore,projectedAfter)=>api.v222OriginalReferenceBindingGuard(projectedBefore,projectedAfter,options,original));
eq(inspect(source,after).accepted,true,'original-source proof admits only binding predicate');
eq(inspect(source,after,settings,{accepted:true,reason:'',checked:4}),{accepted:true,reason:'',checked:4},'existing success is unchanged');
eq(inspect(source,after,settings,{...declined,reason:'Uma definição nomeada passou a apontar para outra fonte, grupo ou lista.'}).accepted,false,'different failure not overridden');
eq(inspect(source,after,{...settings,references:false}).accepted,false,'disabled references respected');
eq(inspect(source,after,{...settings,sectionOnly:true}).accepted,false,'partial input held');
eq(api.v222WithOriginalAuditContext(source,after,settings,(left,right)=>api.v222OriginalReferenceBindingGuard(left,right+' ',settings,declined)),declined,'derived target must match actual audit target');
eq(api.v222WithOriginalAuditContext(source,after,settings,(left,right)=>api.v222OriginalReferenceBindingGuard('different source',right,settings,declined)),declined,'unrelated before cannot borrow evidence');
eq(api.v222WithOriginalAuditContext(source,after,settings,(left,right)=>api.v222OriginalReferenceBindingGuard(left,right,{...settings,references:false},declined)),declined,'inner policy cannot borrow evidence');
eq(api.v222WithOriginalAuditContext(source,after,settings,(left,right)=>{api.v222AuditProjectionResult(left,'forged source',settings,{});return api.v222OriginalReferenceBindingGuard('forged source',right,settings,declined);}),declined,'projection registration requires private capability');
const mutable={...settings};eq(api.v222WithOriginalAuditContext(source,after,mutable,(left,right)=>{mutable.references=false;return api.v222OriginalReferenceBindingGuard(left,right,settings,declined);}),declined,'later option mutation cannot borrow snapshot');
function nested(depth){return api.v222WithOriginalAuditContext(source,after,settings,(left,right)=>depth?nested(depth-1):api.v222OriginalReferenceBindingGuard(left,right,settings,declined));}
eq(nested(8),declined,'overflow masks the outer context');
for(const value of [new Array(3),Object.assign(['a'],{extra:'b'})]){checks++;assert.throws(()=>api.v222AuditOptionsSnapshot({value}),/audit-option-array-shape/,'non-JSON array shapes cannot borrow a snapshot');}
eq(api.v222AuditOptionsSnapshot({value:['a',undefined,null]}).value.value.length,3,'dense array shape and undefined entry retained');
for(const [id,mutant]of [['name',after.replace('name="original"','name="other"')],['body',after.replace('Fonte original.','Outra fonte.')],['helper',after.replace('Nota.','Outra nota.')],['site',after.replace('A<ref','Outra passagem.<ref')]])eq(inspect(source,mutant).accepted,false,id+' mutation rejected');
try{api.v222WithOriginalAuditContext(source,after,settings,()=>{throw Error('test interruption');});assert.fail('test interruption must propagate');}catch(error){eq(error.message,'test interruption','exception retained');}
eq(api.v222OriginalReferenceBindingGuard(source,after,settings,declined),declined,'exception leaves no context behind');
eq(api.preservationAudit(source,after,settings).length,0,'real complete audit admits proved reference family');
eq(api.safeComposition(source,after,settings),'','real complete composition admits proved reference family');
console.log(JSON.stringify({suite:'v2220-original-reference-audit-context',runtime:file,runtimeSha256:sourceSha,checks,cases:17,passed:true,wikipediaWrites:0}));
