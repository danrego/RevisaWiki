'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');let endpoint=null;
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function transform(source,name,fn){const nodes=[];walk(parser.parse(source),n=>{if(n.type==='FunctionDeclaration'&&n.id.name===name)nodes.push(n);});assert.equal(nodes.length,1,name);const n=nodes[0],before=source.slice(n.start,n.end),after=fn(before);return{code:source.slice(0,n.start)+after+source.slice(n.end),receipt:{name,beforeSha256:sha(before),afterSha256:sha(after)}};}
function once(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
function pureEndpointKernel(raw){
 const tree=parser.parse(raw),fn=tree.program.body.find(n=>n.type==='FunctionDeclaration');assert(fn,'Endpoint declaration');
 const producers=new Set(['v218ProseGapEdits','v214ProseSpacingEdits','v214NSRWCall','v213TableCountWitnesses','v217ReferenceAttributeCountGroups','v213ReferenceCountCall','v212CitationAliasCall']);
 const dependent=new Set(['v213TableWitnesses','v213DuplicateGroups']),edits=[],removed=[];
 for(const statement of fn.body.body){const calls=new Set(),names=new Set();walk(statement,n=>{if(n.type==='CallExpression'&&n.callee.type==='Identifier')calls.add(n.callee.name);if(n.type==='Identifier')names.add(n.name);});
  const cause=[...calls].filter(n=>producers.has(n)),derived=[...names].filter(n=>dependent.has(n));if(cause.length||derived.length){edits.push({start:statement.start,end:statement.end,text:''});removed.push({calls:cause,dependentBindings:derived,sha256:sha(raw.slice(statement.start,statement.end))});}
 }
 let code=raw;for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);
 code=once(code,'const inner=v211RetainedAdjustments(r.body,target.body);',"const inner=v2222EndpointCount(r.body,target.body,[],{...options,v2222EndpointDepth:(options.v2222EndpointDepth||0)+1});");
 code=once(code,"if(typeof before!=='string'||typeof after!=='string')","if((options.v2222EndpointDepth||0)>16)return {count:null,exact:false,events:[],unresolved:[]};if(typeof before!=='string'||typeof after!=='string')");
 code=once(code,'v.options===v211FreshnessKey(options)',"v.options===v211FreshnessKey(options)+'|finalBody:'+String(options.v2222FinalBodyCount===true)");
 code=once(code,'options:v211FreshnessKey(options),result',"options:v211FreshnessKey(options)+'|finalBody:'+String(options.v2222FinalBodyCount===true),result");
 const remaining=[];walk(parser.parse(code),n=>{if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&(producers.has(n.callee.name)||['v211RetainedAdjustments','v222RetainedAdjustments','v25SafeRepairPlan','normalizeRefs'].includes(n.callee.name)))remaining.push(n.callee.name);});assert.deepEqual(remaining,[],'Pure endpoint kernel never invokes a repair producer or retained-stage replay');
 pureEndpointKernel.lastReceipt={removedProducerBlocks:removed,nestedReferenceCount:'bounded same pure endpoint kernel',maximumNestedDepth:16,memoModeDiscrimination:true};return code;
}
function applyRuntimePatches(source){
 let code=source;const receipts=[];const alter=(name,fn)=>{const r=transform(code,name,fn);code=r.code;receipts.push(r.receipt);};
 alter('v220BaselineRetainedAdjustments',raw=>{endpoint=raw.replace('function v220BaselineRetainedAdjustments(','function v2222EndpointCount(');const a=endpoint.indexOf('if(!options.v218RetainedCountSkip)'),b=endpoint.indexOf('const old=v211CountUnits(before)',a);assert(a>=0&&b>a);endpoint=endpoint.slice(0,a)+endpoint.slice(b);endpoint=once(endpoint,"const topics=v27RetainedTypes(before,after,kinds).topics,sourceHash=","const topics=[],sourceHash=");endpoint=once(endpoint,"edits=v212CountStructuralDiff(before,after,v27RawDiff(before,after),fresh)","edits=options.v2222FinalBodyCount?v2222FinalLexicalDiff(before,after):v212CountStructuralDiff(before,after,v27RawDiff(before,after),fresh)");endpoint=pureEndpointKernel(endpoint);return raw;});
 alter('v221RepairPlan',raw=>once(raw,'return result;','v2222RememberOperations(source,result);return result;'));
 alter('calculationSteps',raw=>{raw=once(raw,'function*calculationSteps(job){',"function*calculationSteps(job){if(job.kind==='final-count')return v2222FinalCountJob(job);");const at=raw.lastIndexOf('return result;');assert(at>=0);return raw.slice(0,at)+'return v2222RetainedMetadata(job,result);'+raw.slice(at+'return result;'.length);});
 alter('v2215QuickResult',raw=>{const at=raw.lastIndexOf('return result;');assert(at>=0);return raw.slice(0,at)+'return v2222RetainedMetadata(job,result);'+raw.slice(at+'return result;'.length);});
 alter('v2214OperationalMessage',raw=>once(raw,'A análise atingiu o limite de 60 segundos.','A análise não terminou.'));
 const ui=fs.readFileSync(path.join(__dirname,'../src/v2_22_2_ui/runtime.js'),'utf8'),tree=parser.parse(ui),insert=[];
 for(const n of tree.program.body){const raw=ui.slice(n.start,n.end);if(n.type==='FunctionDeclaration'){
   const found=[];walk(parser.parse(code),x=>{if(x.type==='FunctionDeclaration'&&x.id.name===n.id.name)found.push(x);});
   if(found.length){assert.equal(found.length,1,n.id.name);alter(n.id.name,()=>raw);}else insert.push(raw);
  }else {assert.equal(n.type,'VariableDeclaration');insert.push(raw);}}
 const marker=code.lastIndexOf('const api=');assert(marker>=0);code=code.slice(0,marker)+insert.join('\n')+'\n'+code.slice(marker);
 alter('run',raw=>{raw=once(raw,'try{\n  const proofs=','try{\n  await v2222EnsureLoadedBase(task);\n  const proofs=');raw=raw.replaceAll("rememberEdit(adapter,before,result.text,'syntax',result.changes.map(c=>c.label).join(', '));","rememberEdit(adapter,before,result.text,'syntax',result.changes.map(c=>c.label).join(', '),result.retainedAdjustments,result.byteMetrics);");raw=once(raw,'comparisonPlan=null;showReport(result);','v2222WatchPage(adapter);v2222FillDiscussionSummary(adapter,before,result.text);comparisonPlan=null;showReport(result);');raw=raw.replaceAll("rememberEdit(adapter,before,candidate.text,'syntax',candidate.changes.map(c=>c.label).join(', '));","rememberEdit(adapter,before,candidate.text,'syntax',candidate.changes.map(c=>c.label).join(', '),candidate.retainedAdjustments,candidate.byteMetrics);");raw=once(raw,'comparisonPlan=null;showReport(candidate);', 'v2222WatchPage(adapter);v2222FillDiscussionSummary(adapter,before,candidate.text);comparisonPlan=null;showReport(candidate);');return raw;});
 alter('undo',raw=>once(raw,"message('Texto anterior ao ajuste restaurado.');","v2222FillDiscussionSummary(adapter,previous.before,previous.before);message('Texto anterior ao ajuste restaurado.');"));
 alter('beginLocalAnalysis',raw=>once(raw,'const task={','v2222StopCount();const task={'));
 alter('undo',raw=>once(raw,'const previous=last;','v2222StopCount();const previous=last;'));
 alter('run',raw=>once(raw,'finishLocalAnalysis(task);','finishLocalAnalysis(task);updateAppliedResult();'));
 parser.parse(code);return{code,receipt:{changes:receipts,sourceSha256:sha(source)}};
}
function applyHelperPatches(helpers){if(!endpoint)throw Error('Apply the runtime patch before extracting its endpoint counter');const code=helpers+'\n'+endpoint+'\n';parser.parse(code);return{code,receipt:{endpointCounterSha256:sha(endpoint),repairStageReplayRemoved:true,pureEndpoint: pureEndpointKernel.lastReceipt}};}
module.exports={applyRuntimePatches,applyHelperPatches,pureEndpointKernel};
