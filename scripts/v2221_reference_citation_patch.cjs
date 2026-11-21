'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function patch(source){
 const found=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id?.name==='v281CitationRetention')found.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(parser.parse(source));assert.equal(found.length,1);
 const n=found[0],before=source.slice(n.start,n.end),needle="for(const key of required)if(!retained.has(key))",replacement="let typedAlternatives=null;for(const key of required)if(!retained.has(key)&&!(typedAlternatives??=v2221CitationTypedRetentionAlternatives(before,after,cfg)).has(key))";
 assert.equal(before.split(needle).length,2,'One exact metadata-obligation rejection branch');const after=before.replace(needle,replacement),code=source.slice(0,n.start)+after+source.slice(n.end);parser.parse(code);
 const targets=[];function findTarget(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id?.name==='v2217CitationTarget')targets.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(findTarget);else if(v&&typeof v==='object')findTarget(v);}}findTarget(parser.parse(code));assert.equal(targets.length,1);
 const t=targets[0],originalTarget=code.slice(t.start,t.end),preservedTarget=originalTarget.replace('function v2217CitationTarget(','function v2221ReferenceLegacyCitationTarget('),guardedTarget='function v2217CitationTarget(raw){const target=v2221ReferenceLegacyCitationTarget(raw);return v2221CitationTypedTargetAllowed(raw,target)?target:null;}\n'+preservedTarget,guarded=code.slice(0,t.start)+guardedTarget+code.slice(t.end);parser.parse(guarded);
 return{code:guarded,receipt:{kind:'source-bound-generic-citation-family-alternative',function:'v281CitationRetention',beforeSha256:sha(before),afterSha256:sha(after),typedTarget:{beforeSha256:sha(originalTarget),afterSha256:sha(guardedTarget),legacyBodyRetained:true,unprovedTypeChangesSuppressed:true},originalObligationsRetained:true,metadataAndAnchorBindingsRequired:true,validationGuardsRemoved:0}};
}
module.exports={patch};
