'use strict';
const assert=require('node:assert/strict'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function once(source,needle,replacement){assert.equal(source.split(needle).length,2,needle);return source.replace(needle,replacement);}
function patch(source){let code=source;const changes=[];
 function alter(name,change){const nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id?.name===name)nodes.push(n);for(const[k,v]of Object.entries(n)){if(['start','end','loc','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(parser.parse(code));assert.equal(nodes.length,1,name);const n=nodes[0],before=code.slice(n.start,n.end),after=change(before);assert.notEqual(after,before);code=code.slice(0,n.start)+after+code.slice(n.end);changes.push({name,beforeSha256:sha(before),afterSha256:sha(after)});}
 alter('v2217Previous_v221MissingDefaultCollectorPlan',raw=>{
  let text=once(raw,'function v2217Previous_v221MissingDefaultCollectorPlan(source,cfg={})','function v2217Previous_v221MissingDefaultCollectorPlan(source,cfg={},activation=null)');
  text=once(text,'const observed=v219NativeReferenceObserver(source)',"const activationVerified=!!activation&&typeof v2221FocusedActivatedReferenceAllows==='function'&&v2221FocusedActivatedReferenceAllows(source,cfg,activation)===true;const observed=v219NativeReferenceObserver(source)");
  text=once(text,'if(ancestors.length){if(!box',"if(ancestors.length){const activatedOwner=activationVerified&&ancestors.length===1&&v2221FocusedActivatedReferenceAllows(source,cfg,activation,{start:ancestors[0].start,end:ancestors[0].end})===true;if(!activatedOwner){if(!box");
  text=once(text,'if(!box.native.consumed.includes(owners[0].key))return empty;}else{','if(!box.native.consumed.includes(owners[0].key))return empty;}}else{');
  text=once(text,'if(!visibleLiteralReference||uses.some','if((!visibleLiteralReference&&!activationVerified)||uses.some');
  text=once(text,'node.end<ref.end))continue;','node.end<ref.end)||activationVerified&&v2221FocusedActivatedReferenceAllows(source,cfg,activation,{start:node.start,end:node.end})===true)continue;');
  text=once(text,'condition:V221_LITERAL_VALUES_221.helper_condition2','...(activationVerified?{activatedNativeOwner:{sourceHash:activation.sourceHash,mappedHash:activation.mappedHash,owner:activation.owner,referenceInventoryHash:activation.referenceInventoryHash}}:{}),condition:V221_LITERAL_VALUES_221.helper_condition2');
  return text;
 });
 alter('v221MissingDefaultCollectorPlan',raw=>once(once(raw,'function v221MissingDefaultCollectorPlan(source,cfg={})','function v221MissingDefaultCollectorPlan(source,cfg={},activation=null)'),'v2217Previous_v221MissingDefaultCollectorPlan(source,cfg)','v2217Previous_v221MissingDefaultCollectorPlan(source,cfg,activation)'));
 alter('v221MissingDefaultCollectorProof',raw=>once(once(raw,'function v221MissingDefaultCollectorProof(before,after,plan,cfg={})','function v221MissingDefaultCollectorProof(before,after,plan,cfg={},activation=null)'),'const fresh=v221MissingDefaultCollectorPlan(before,cfg);','const fresh=v221MissingDefaultCollectorPlan(before,cfg,activation);'));
 parser.parse(code);return{code,receipt:{kind:'optional-source-proved-native-field-renderer-prerequisite',sourceSha256:sha(source),outputSha256:sha(code),changes,ordinaryCallsKeepOriginalGuards:true,ownerSpanRevalidated:true,visibleAndOwnerExceptionsRequireActivationProof:true,remainingRendererGuardsRetained:true}};
}
module.exports={patch};
