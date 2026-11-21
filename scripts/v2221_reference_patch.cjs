'use strict';
// Build-time adapters only. Historical files and validation gates stay intact.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function replaceFunction(code,name,make,changes){const found=[];walk(parser.parse(code),n=>{if(n.type==='FunctionDeclaration'&&n.id.name===name)found.push(n);});assert.equal(found.length,1,name);const n=found[0],before=code.slice(n.start,n.end),after=make(before);assert.notEqual(before,after,name);changes.push({name,beforeSha256:sha(before),afterSha256:sha(after)});return code.slice(0,n.start)+after+code.slice(n.end);}
function patchRuntime(source){
 let code=source;const changes=[],re=/apply\('2\.22\.0-ref-orphans-(initial|final)',v222ReferenceOrphansPlan,v222ReferenceOrphansProof\)/g,matches=[...code.matchAll(re)];
 assert.equal(matches.length,2,'Exactly initial/final source-bound reference entry points');
 code=code.replace(re,(_,phase)=>`apply('2.22.1-reference-punctuation-${phase}',v2221ReferencePunctuationPlan,v2221ReferencePunctuationProof);apply('2.22.1-reference-definitions-${phase}',v2221ReferenceDefinitionsPlan,v2221ReferenceDefinitionsProof);apply('2.22.1-references-${phase}',v2221ReferencePlan,v2221ReferenceProof)`);
 changes.push({name:'initial-final-reference-stages',occurrences:matches.length});
 code=replaceFunction(code,'v2217ReferenceOwnedCollectorEdit',raw=>{
  const needle='const owner=v2217ReferenceManualSection(source,row.start,protectedView(source));';assert.equal(raw.split(needle).length,2);
  return raw.replace(needle,'const owner=v2221ReferenceLegacyManualOwner(source,row.start);');
 },changes);
 code=replaceFunction(code,'v27SafeNamedReferenceEdits',raw=>{
  const needle='return edits;';assert.equal(raw.split(needle).length,2,'One exact v27 alias producer return');
  // The producer and every proof projection share the same stronger source
  // precondition. No integrity finding or citation/collector guard is removed.
  return raw.replace(needle,'return edits.filter(edit=>v2221ReferenceAliasProofAllows(source,edit.proof,cfg));');
 },changes);
 code=replaceFunction(code,'v218ReferenceColumnPlans',raw=>{
  const needle="if(legacyOnly){for(const entry of old){entry.remove=true;changeRules.push('legacyReferenceColumns');}}";
  assert.equal(raw.split(needle).length,2,'One exact legacy column removal producer');
  return raw.replace(needle,"if(legacyOnly){if(!v2221ReferenceLegacyColumnsAllowed(old))continue;for(const entry of old){entry.remove=true;changeRules.push('legacyReferenceColumns');}}");
 },changes);
 code=replaceFunction(code,'v2216AutonamePlan',raw=>{
  const needle="if(typeof source!=='string'||!v2215ReferenceCollectorScope(source,cfg)||cfg.neutralReferenceNames===false||cfg.references===false)return plan;";
  assert.equal(raw.split(needle).length,2,'One exact descriptive-name source precondition');
  return raw.replace(needle,needle.replace(')return plan;',"||!v2221ReferenceRekeyClosed(source))return plan;"));
 },changes);
 parser.parse(code);return {code,receipt:{kind:'reference-entry-and-owner-adapters',sourceSha256:sha(source),outputSha256:sha(code),changes,validationGuardsRemoved:0,legacyColumnRemovalFunctionsDisabled:0}};
}
function patchHelpers(source){
 let code=source;const changes=[];
 const delegates={v222ReferenceOrphanEdits:['source','return v2221ReferenceOrphanEdits(source);'],
  v222ReferenceOrphansPlan:['source,cfg={}','return v2221ReferenceOrphansPlan(source,cfg);'],
  v222ReferenceOrphansProof:['before,after,plan,cfg={}','return v2221ReferenceOrphansProof(before,after,plan,cfg);'],
  v222ReferenceAttributesPlan:['source,cfg={}','return v2221ReferenceAttributesPlan(source,cfg);'],
  v222ReferenceAttributesProof:['before,after,plan,cfg={}','return v2221ReferenceAttributesProof(before,after,plan,cfg);'],
  v222ReferenceCollectorsPlan:['source,cfg={}','return v2221ReferenceCollectorsPlan(source,cfg);'],
  v222ReferenceCollectorsProof:['before,after,plan,cfg={}','return v2221ReferenceCollectorsProof(before,after,plan,cfg);'],
  v222ReferenceCollectorSpacingPlan:['source,cfg={}','return v2221ReferenceSpacingPlan(source,cfg);'],
  v222ReferenceCollectorSpacingProof:['before,after,plan,cfg={}','return v2221ReferenceSpacingProof(before,after,plan,cfg);']};
 for(const[name,[args,body]]of Object.entries(delegates))code=replaceFunction(code,name,()=>`function ${name}(${args}){${body}}`,changes);
 parser.parse(code);return {code,receipt:{kind:'source-bound-reference-helper-adapters',sourceSha256:sha(source),outputSha256:sha(code),changes,protectionsRemoved:0}};
}
module.exports={patch:patchRuntime,patchRuntime,patchHelpers};
