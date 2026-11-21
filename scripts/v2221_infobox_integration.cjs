'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const[key,value]of Object.entries(node)){if(['loc','start','end','extra'].includes(key))continue;if(Array.isArray(value))value.forEach(child=>walk(child,fn));else if(value&&typeof value==='object')walk(value,fn);}}
function transformFunction(source,name,fn){const matches=[];walk(parser.parse(source),node=>{if(node.type==='FunctionDeclaration'&&node.id.name===name)matches.push(node);});assert.equal(matches.length,1,name);const node=matches[0],before=source.slice(node.start,node.end),after=fn(before);assert.notEqual(after,before,name);return {source:source.slice(0,node.start)+after+source.slice(node.end),change:{name,beforeSha256:sha(before),afterSha256:sha(after)}};}
function once(source,before,after){assert.equal(source.split(before).length,2,before);return source.replace(before,after);}
function patch(source,helpers){
 const changes=[];let code=source,helperCode=helpers;
 const alter=(name,fn)=>{const result=transformFunction(code,name,fn);code=result.source;changes.push(result.change);};
 alter('v222PreviousAuditRepairPlan',raw=>once(raw,"apply('2.22.0-inference-initial'","apply('2.22.1-foreign-infobox-initial',v2221InfoboxPipelinePlan,v2221InfoboxPipelineProof);apply('2.22.0-inference-initial'"));
 alter('prepareAutomaticProofs',raw=>once(raw,'task.preflightRequests||=[];','Object.assign(cfg,await v2221PrepareInfoboxEvidence(task,cfg));task.guard();task.preflightRequests||=[];'));
 alter('serializableOptions',raw=>once(once(raw,"'v222CategoryProofs']","'v222CategoryProofs','v2221InfoboxCatalogJson']"),"['contentModel',","['v2221InfoboxCatalogJson','contentModel',"));
 for(const name of ['v2217InfoboxPersonMigration','v2217InfoboxEthnicMigration','v2217InfoboxForeignPersonMigration'])alter(name,raw=>once(raw,') {',') {\n if(v2221InfoboxGoverned(raw,cfg))return null;'));
 alter('v221BaselineMigrateForeignTemplate',raw=>once(raw,'{const gaia=','{if(v2221InfoboxGoverned(raw,cfg))return {profile:translationProfile(raw),candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:{kind:\'source-bound-infobox-registry\'}};const gaia='));
 const stages=transformFunction(helperCode,'v222CoreStages',raw=>once(raw,'const rows=[',"const rows=[['foreign-infobox','v2221InfoboxPipelinePlan','v2221InfoboxPipelineProof'],"));
 helperCode=stages.source;changes.push(stages.change);
 parser.parse(code);parser.parse(helperCode);
 return {code,helpers:helperCode,receipt:{sourceSha256:sha(source),helpersSha256:sha(helpers),changes,wikipediaWrites:0}};
}
if(require.main===module){const[input,helpers,out,helpersOut,receipt]=process.argv.slice(2),result=patch(fs.readFileSync(input,'utf8'),fs.readFileSync(helpers,'utf8'));fs.writeFileSync(out,result.code);fs.writeFileSync(helpersOut,result.helpers);fs.writeFileSync(receipt,JSON.stringify(result.receipt,null,2)+'\n');}
module.exports={patch};
