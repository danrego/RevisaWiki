'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function visit(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>visit(x,fn));else if(v&&typeof v==='object')visit(v,fn);}}
function once(s,a,b){assert.equal(s.split(a).length,2,'Unique infobox anchor: '+a.slice(0,90));return s.replace(a,b);}
function selected(code,name,change,proof){const found=[];visit(parser.parse(code),n=>{if(n.type==='FunctionDeclaration'&&n.id?.name===name)found.push(n);});assert.equal(found.length,1,'One selected '+name);const n=found[0],before=code.slice(n.start,n.end),after=change(before);assert.notEqual(after,before,name);proof.push({name,beforeSha256:sha(before),afterSha256:sha(after)});return code.slice(0,n.start)+after+code.slice(n.end);}
const stages=[['infobox-v2222','v2222InfoboxPlan','v2222InfoboxProof']];
function applyRuntimePatches(source){let code=source;const changes=[];
 code=selected(code,'v222PreviousAuditRepairPlan',s=>once(once(s,"apply('2.22.1-foreign-infobox-initial'","apply('2.22.2-infobox-initial',v2222InfoboxPlan,v2222InfoboxProof);apply('2.22.1-foreign-infobox-initial'"),'return plan;',"apply('2.22.2-infobox-final',v2222InfoboxPlan,v2222InfoboxProof);return plan;"),changes);
 code=selected(code,'v221BaselineMigrateForeignTemplate',s=>once(s,'e.key=mapped;e.positional=false;',"if(profile.kind==='infobox'&&nativeSourceProfile&&!v2222InfoboxLegacyMapAllowed(cfg.biographyOriginalSource||cfg.citationOriginalSource||raw,{name:nativeSourceProfile.title,fields:nativeInfoboxFields||foreignEntries(p)},{from:e.key,to:mapped},cfg))continue;e.key=mapped;e.positional=false;"),changes);
 code=selected(code,'v220BioFieldEdits',s=>once(s,'const rename=(field,target,blockers)=>{','const rename=(field,target,blockers)=>{if(!v2222InfoboxLegacyMapAllowed(source,box,{from:field.key,to:target},cfg))return;'),changes);
 code=selected(code,'v221BioMappingEdits',s=>once(s,'for(const mapping of maps){','for(const mapping of maps){if(!v2222InfoboxLegacyMapAllowed(source,box,mapping,cfg))continue;'),changes);
 code=selected(code,'v2217NativePersonFieldPlan',s=>once(s,'const family=aliases.find','if(!v2222InfoboxLegacyMapAllowed(cfg.v2222InfoboxCurrentSource||raw,{name:profile.title,fields},{from:field.key,to:target},cfg))continue;const family=aliases.find'),changes);
 code=selected(code,'v2217InfoboxPlan',s=>once(s,'raw,{...cfg,v2217DeceasedContext:','raw,{...cfg,v2222InfoboxCurrentSource:text,v2217DeceasedContext:'),changes);
 parser.parse(code);return{code,proof:{schema:1,sourceSha256:sha(source),outputSha256:sha(code),changes,preservationGuardsRemoved:0,wikipediaWrites:0}};
}
function applyHelperPatches(source){let code=source;const changes=[];
 code=selected(code,'v222CoreStages',s=>once(once(s,'const rows=[','const rows='+JSON.stringify(stages).slice(0,-1)+','),'return rows.filter','rows.push(...'+JSON.stringify(stages)+');return rows.filter'),changes);
 code=selected(code,'v2221FocusedInfoboxTransform',s=>once(s,"const field=found[0];add(","const field=found[0];if(!v2222InfoboxLegacyMapAllowed(source,{name:owner.title,fields},{from:field.key,to:rule.target},cfg))continue;add("),changes);
 code=selected(code,'v222FlagPlan',s=>once(s,'box&&V222_INFERENCE_FLAG_FIELDS[box.name]','box&&(V2222_IB.civilFlagFields[box.name]||V222_INFERENCE_FLAG_FIELDS[box.name])'),changes);
 code=selected(code,'v2221InfoboxPipelinePlan',s=>once(s,"const parsed=v2221InfoboxRead(node.raw);","if(!v2222InfoboxForeignReferenceGuard(node.raw,source)||!v2222InfoboxForeignStructuralGuard(node.raw,source,cfg))continue;const parsed=v2221InfoboxRead(node.raw);"),changes);
 parser.parse(code);return{code,proof:{schema:1,sourceSha256:sha(source),outputSha256:sha(code),changes,writerProjectionAligned:true,preservationGuardsRemoved:0,wikipediaWrites:0}};
}
module.exports={applyRuntimePatches,applyHelperPatches};
