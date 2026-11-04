'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function patch(source,helpers){
 const changes=[];
 const changeFunction=(name,fn)=>{
  const tree=parser.parse(source),found=[];walk(tree,n=>{if(n.type==='FunctionDeclaration'&&n.id?.name===name)found.push(n);});assert.equal(found.length,1,'Unique function '+name);
  const node=found[0],old=source.slice(node.start,node.end),next=fn(old);assert.notEqual(old,next,'Expected source change '+name);source=source.slice(0,node.start)+next+source.slice(node.end);changes.push({name,beforeSha256:sha(old),afterSha256:sha(next)});
 };
 changeFunction('v211RetainedAdjustments',raw=>raw.replace('function v211RetainedAdjustments(','function v2216BaselineRetainedAdjustments('));
 changeFunction('v25TalkPreparationPlan',raw=>raw.replace('function v25TalkPreparationPlan(','function v2216BaselineTalkPreparationPlan('));
 changeFunction('footerRole',raw=>raw.replace('function footerRole(','function v2216BaselineFooterRole('));
 changeFunction('orderFooter',raw=>raw.replace('function orderFooter(','function v2216BaselineOrderFooter('));
 changeFunction('orderEndSections',raw=>raw.replace('function orderEndSections(','function v2216BaselineOrderEndSections('));
 changeFunction('structuralArticlePlan',raw=>raw.replace('function structuralArticlePlan(','function v2216BaselineStructuralArticlePlan('));
 changeFunction('v27SafeDefaultsortEdits',raw=>raw.replace('function v27SafeDefaultsortEdits(','function v2216BaselineSafeDefaultsortEdits('));
 changeFunction('v220LegacyCleanupStages',raw=>{const old="if(removable&&\n!inRangeExcept(n.start,context,n.start,n.end))";assert.equal(raw.split(old).length,2);return raw.replace(old,"if(removable&&v2216ObsoleteOwnerRemovalAllowed(shield.restore(raw))&&\n!inRangeExcept(n.start,context,n.start,n.end))");});
 changeFunction('v2214Remaining',()=>"function v2214Remaining(task){task.guard();return Infinity;}");
 changeFunction('beginLocalAnalysis',raw=>{assert(raw.includes('v2214Deadline:root.performance.now()+60000,'));return raw.replace('v2214Deadline:root.performance.now()+60000,','');});
 changeFunction('computeLocal',raw=>{
  assert(raw.includes('job={...job,v2214DeadlineEpochMs:Date.now()+v2214Remaining(task)}'));
  let next=raw.replace('job={...job,v2214DeadlineEpochMs:Date.now()+v2214Remaining(task)}','job={...job,v2214DeadlineEpochMs:null}');
  const start=next.indexOf('const timer=root.setTimeout('),end=next.indexOf(';state.pending=',start);assert(start>=0&&end>start);next=next.slice(0,start)+'const timer=null'+next.slice(end);return next;
 });
 changeFunction('v2214RecoverLocalAdjustment',raw=>{
  const start=raw.indexOf(',\ndeadline='),end=raw.indexOf(';',start);assert(start>0&&end>start);
  let next=raw.slice(0,start)+raw.slice(end);
  const check='if(Date.now()>=deadline){if(best)break;throw v2214DeadlineError();}';assert(next.includes(check));next=next.replace(check,'').replace('v2214DeadlineEpochMs:deadline','v2214DeadlineEpochMs:null');return next;
 });
 changeFunction('serializableOptions',raw=>{assert(raw.includes("'captureTrace'"));return raw.replace("'captureTrace'","'v2216ConfirmedBotAssessments','captureTrace'");});
 changeFunction('run',raw=>{const at='  const early=await computeLocal(';assert(raw.includes(at));return raw.replace(at,'  prepared=await v2216PrepareAssessmentProvenance(task,prepared);\n'+at);});
 changeFunction('v221RepairPlan',raw=>{
  const old="const part=make(before,cfg);\nif(!part||typeof part.text!=='string')throw new Error('O plano não corresponde ao rascunho.');\nif(part.text===before)return;\nif(!prove(before,part.text,part,cfg))throw new Error('A conferência do reparo falhou. O rascunho foi preservado.');";
  const next="let part;try{part=make(before,cfg);}catch{return;}\nif(!part||typeof part.text!=='string'||part.text===before)return;\nlet verified=false;try{verified=prove(before,part.text,part,cfg)===true;}catch{}\nif(!verified)return;";
  assert(raw.includes(old));return raw.replace(old,next);
 });
 changeFunction('prepareTalkHeader',raw=>{
  const start=raw.indexOf('const plan=v25TalkPreparationPlan(source,slot.content,'),end=raw.indexOf(');if(!plan.changed)',start);assert(start>=0&&end>start);
  const options=raw.slice(start+'const plan=v25TalkPreparationPlan(source,slot.content,'.length,end);
  const guard="if(localBusy||onlineBusy||panel!==openedPanel||!v219UIContextSame(context,localEditorContext(editor()))||adapter.read()!==source)throw new Error('O texto mudou durante a consulta.');";
  const next="const assessmentTask={source,title:currentTitle(),base:baseRevision(),guard(){"+guard+"}},assessmentOptions=await v2216PrepareAssessmentProvenance(assessmentTask,"+options+");assessmentTask.guard();const plan=v25TalkPreparationPlan(source,slot.content,assessmentOptions)";
  return raw.slice(0,start)+next+raw.slice(end+1);
 });
 const initial="apply('2.21.5-aliases-initial',v2215AliasPlan,v2215AliasProof);";assert.equal(source.split(initial).length,2);
 source=source.replace(initial,"apply('2.21.6-layout-initial',v2216LayoutPlan,v2216LayoutProof);apply('2.21.6-references-initial',v2216ReferencePlan,v2216ReferenceProof);apply('2.21.6-talk-initial',v2216TalkPlan,v2216TalkProof);"+initial);
 const final="apply('2.21.5-whitespace-final',v2215WhitespacePlan,v2215WhitespaceProof);";assert.equal(source.split(final).length,2);
 source=source.replace(final,"apply('2.21.6-references-final',v2216ReferencePlan,v2216ReferenceProof);apply('2.21.6-reference-names',v2216AutonamePlan,v2216AutonameProof);apply('2.21.6-layout-final',v2216LayoutPlan,v2216LayoutProof);apply('2.21.6-talk-final',v2216TalkPlan,v2216TalkProof);"+final);
 const ast=parser.parse(source),nodes={},variables={},declarations=[],edits=[],proof=[];
 walk(ast,n=>{if(n.type==='FunctionDeclaration'&&n.id)(nodes[n.id.name]??=[]).push(n);if(n.type==='VariableDeclarator'&&n.id?.type==='Identifier')(variables[n.id.name]??=[]).push(n);});
 const helperTree=parser.parse(helpers);assert(helperTree.program.body.every(n=>['FunctionDeclaration','VariableDeclaration'].includes(n.type)));
 for(const n of helperTree.program.body){
  const raw=helpers.slice(n.start,n.end);
  if(n.type==='FunctionDeclaration'){
   const name=n.id.name;let found=nodes[name]||[];if(name==='mount'&&found.length>1)found=found.filter(f=>source.slice(f.start,f.end).includes('inlineController?.mount(root.document)'));assert(found.length<=1,'Ambiguous function '+name);
   if(found.length){const old=found[0];edits.push({start:old.start,end:old.end,text:raw});proof.push({kind:'function',name,beforeSha256:sha(source.slice(old.start,old.end)),afterSha256:sha(raw)});}
   else{declarations.push(raw);proof.push({kind:'new-helper',name,sha256:sha(raw)});}
  }else{
   assert.equal(n.kind,'const');assert.equal(n.declarations.length,1);const d=n.declarations[0],found=variables[d.id.name]||[];assert(found.length<=1);
   if(!found.length){declarations.push(raw);continue;}
   const old=found[0].init,value=helpers.slice(d.init.start,d.init.end);edits.push({start:old.start,end:old.end,text:value});proof.push({kind:'binding',name:d.id.name,beforeSha256:sha(source.slice(old.start,old.end)),afterSha256:sha(value)});
  }
 }
 const api=[];walk(ast,n=>{if(n.type==='VariableDeclarator'&&n.id?.name==='api')api.push(n);});assert.equal(api.length,1);assert.equal(api[0].init.type,'ObjectExpression');
 const already=new Set(api[0].init.properties.map(p=>p.key?.name??p.key?.value)),added=helperTree.program.body.filter(n=>n.type==='FunctionDeclaration'&&!already.has(n.id.name)&&!(nodes[n.id.name]||[]).length).map(n=>n.id.name);
 if(added.length)edits.push({start:api[0].init.start+1,end:api[0].init.start+1,text:added.join(',')+','});
 const declarationAt=source.lastIndexOf('const api',api[0].start);assert(declarationAt>=0);
 if(declarations.length)edits.push({start:declarationAt,end:declarationAt,text:declarations.join('\n')+'\n'});
 edits.sort((a,b)=>b.start-a.start||b.end-a.end);let previous=source.length,code=source;for(const e of edits){assert(e.end<=previous,'Overlapping patches');code=code.slice(0,e.start)+e.text+code.slice(e.end);previous=e.start;}
 const trimTree=parser.parse(code),obsolete=new Set(['snippet','suggestionKey','locateTarget','locateFinding','goToFinding','setIssues','sectionNotice','v214SyncReviewGroups','renderIssues']),candidates=new Map();
 walk(trimTree,n=>{if(n.type==='FunctionDeclaration'&&obsolete.has(n.id?.name)){assert(!candidates.has(n.id.name),'Ambiguous retired UI helper');candidates.set(n.id.name,n);}});
 const references=[],live=new Set();
 function refs(n,parent=null,key=''){
  if(!n||typeof n!=='object')return;
  if(n.type==='Identifier'&&candidates.has(n.name)){
   const declaration=parent?.type==='FunctionDeclaration'&&key==='id',member=parent?.type==='MemberExpression'&&!parent.computed&&key==='property',objectKey=parent?.type==='ObjectProperty'&&!parent.computed&&!parent.shorthand&&key==='key';
   if(!declaration&&!member&&!objectKey){const owner=[...candidates.entries()].find(([,v])=>n.start>=v.start&&n.end<=v.end)?.[0];references.push({target:n.name,owner});if(!owner)live.add(n.name);}
  }
  for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>refs(x,n,k));else if(v&&typeof v==='object')refs(v,n,k);}
 }
 refs(trimTree);let changed=true;while(changed){changed=false;for(const r of references)if(r.owner&&live.has(r.owner)&&!live.has(r.target)){live.add(r.target);changed=true;}}
 const retired=[...candidates.entries()].filter(([name])=>!live.has(name)).map(([name,n])=>({name,start:n.start,end:n.end,sha256:sha(code.slice(n.start,n.end))}));
 for(const n of retired.sort((a,b)=>b.start-a.start))code=code.slice(0,n.start)+code.slice(n.end);
 parser.parse(code);return{code,proof:{method:'Exact AST ranges, explicit helpers and unused retired UI declarations only',sourceSha256:sha(source),helperSha256:sha(helpers),unlimitedAnalysisChanges:changes,changes:proof,exportsAdded:added,retiredUnreferencedUI:retired.map(({name,sha256})=>({name,sha256})),retainedReferencedUI:[...live]}};
}
if(require.main===module){const [input,helper,output,receipt]=process.argv.slice(2),r=patch(fs.readFileSync(input,'utf8'),fs.readFileSync(helper,'utf8'));fs.writeFileSync(output,r.code);fs.writeFileSync(receipt,JSON.stringify(r.proof,null,2)+'\n');}
module.exports={patch};
