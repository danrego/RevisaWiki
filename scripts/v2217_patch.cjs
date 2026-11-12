'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function patch(source,helpers){
 const initial=sha(source),helperTree=parser.parse(helpers);assert(helperTree.program.body.every(n=>['FunctionDeclaration','VariableDeclaration'].includes(n.type)));
 const functions=helperTree.program.body.filter(n=>n.type==='FunctionDeclaration'),names=new Set(functions.map(n=>n.id.name)),changes=[];
 function alter(name,change){const found=[];walk(parser.parse(source),n=>{if(n.type==='FunctionDeclaration'&&n.id.name===name)found.push(n);});assert.equal(found.length,1,name);const n=found[0],old=source.slice(n.start,n.end),next=change(old);assert.notEqual(old,next,name);source=source.slice(0,n.start)+next+source.slice(n.end);changes.push({name,beforeSha256:sha(old),afterSha256:sha(next)});}
 const early=[['delimiters','v2217DelimiterPlan','v2217DelimiterProof'],['structure','v2217StructurePlan','v2217StructureProof'],['source-layout','v2217SourceLayoutPlan','v2217SourceLayoutProof'],['infobox','v2217InfoboxPlan','v2217InfoboxProof'],['references','v2217ReferencePlan','v2217ReferenceProof'],['reference-collector','v221MissingDefaultCollectorPlan','v221MissingDefaultCollectorProof'],['portals','v2217PortalPlan','v2217PortalProof'],['talk','v2217TalkPlan','v2217TalkProof']].filter(([family,name,proof])=>family==='reference-collector'||names.has(name)&&names.has(proof));
 if(early.length)alter('v221RepairPlan',raw=>{const initial="apply('2.21.6-layout-initial'",final="apply('2.21.5-whitespace-final'";assert(raw.includes(initial)&&raw.includes(final));const calls=when=>early.map(([family,make,prove])=>"apply('2.21.7-"+family+'-'+when+"',"+make+','+prove+');').join('');return raw.replace(initial,calls('initial')+initial).replace(final,calls('final')+final);});
 if(names.has('v2217TalkPreparationPlan'))alter('prepareTalkHeader',raw=>{assert(raw.includes('v25TalkPreparationPlan(source,slot.content,assessmentOptions)'));return raw.replace('v25TalkPreparationPlan(source,slot.content,assessmentOptions)','v2217TalkPreparationPlan(source,slot.content,assessmentOptions)');});
 if(names.has('pageContextOptions'))alter('prepareTalkHeader',raw=>{const anchor="rememberEdit(adapter,source,plan.text,'discussion','Cabeçalho e marcas de projeto');";assert.equal(raw.split(anchor).length,2);return raw.replace(anchor,anchor+'syncMinorResult({text:plan.text,uiContext:context,minorCheck:minorEligibility(source,plan.text,currentOptions(false))});');});
 if(names.has('v2217ReferenceOwnedCollectorEdit'))alter('v2215ReferenceCollectorPlan',raw=>{
  const anchor='if(start!==row.start||target!==row.raw)edits.push',original="if(row.head==='Notas e Referências'&&row.entries.length===0)edits.push({start:row.start,end:row.end,text:'{{Notas e referências}}',kind:'preferred-reference-collector'});";
  assert.equal(raw.split(anchor).length,2,'Unique preferred-collector emit point');assert.equal(raw.split(original).length,2,'Unique combined alias emit point');
  return raw.replace(anchor,'({start,target}=v2217ReferenceOwnedCollectorEdit(text,row,start,target,cfg));'+anchor).replace(original,"if(row.head==='Notas e Referências'&&row.entries.length===0){const owned=v2217ReferenceOwnedCollectorEdit(text,row,row.start,'{{Notas e referências}}',cfg);if(owned.start!==row.start||owned.target!==row.raw)edits.push({start:owned.start,end:row.end,text:owned.target,kind:'preferred-reference-collector'});}");
 });
 if(names.has('v2217ReferenceCombinedAllowed'))alter('v2215ReferenceCollectorPlan',raw=>{
  const original="if(!hasCombinedHeading||heading.level===2)stage('unified-notes-references',[{start:hasCombinedHeading?heading.start:notes[0].start,end:refs[0].end,text:'{{Notas e referências'+(custom?'|grupo='+notes[0].group:'')+'}}',kind:'unified-note-collector'}]);";
  assert.equal(raw.split(original).length,2,'Unique combined-collector stage');
  return raw.replace(original,"if(!hasCombinedHeading||heading.level===2){const combinedEdit={start:hasCombinedHeading?heading.start:notes[0].start,end:refs[0].end,text:'{{Notas e referências'+(custom?'|grupo='+notes[0].group:'')+'}}',kind:'unified-note-collector'};if(v2217ReferenceCombinedAllowed(text,notes[0],refs[0],combinedEdit,cfg))stage('unified-notes-references',[combinedEdit]);}");
 });
 if(names.has('v2217ReferenceOwnedCollectorTarget'))alter('v2215ReferenceSingleGroupPlan',raw=>{const anchor="const row=notes[0],text='{{Notas}}';";assert.equal(raw.split(anchor).length,2,'Unique atomic single-note collector initializer');return raw.replace(anchor,"const row=notes[0],text=v2217ReferenceOwnedCollectorTarget(source,row,row.start,'{{Notas}}',cfg);if(text===row.raw)return empty;");});
 if(names.has('v2217AnchorRawAudit')){
  for(const [name,needle,insert]of [
   ['v221RepairPlan',"if(!part||typeof part.text!=='string'||part.text===before)return;",'if(v2217AnchorRawAudit(before,part.text,cfg).length)return;'],
   ['v220RepairPlan',"if(!part||typeof part.text!=='string'||part.text===before)continue;",'if(v2217AnchorRawAudit(before,part.text,cfg).length)continue;'],
   ['v2212BaselineRepairPlan','if(part.text===before)continue;','if(v2217AnchorRawAudit(before,part.text,cfg).length)continue;']
  ])alter(name,raw=>{assert.equal(raw.split(needle).length,2,'Unique authored-Cite write admission '+name);return raw.replace(needle,needle+insert);});
 }

 if(names.has('v2217HeadingInventory')){
  const calls=[];function locate(n,owner=null){if(!n||typeof n!=='object')return;const own=/Function/.test(n.type)?n:owner;if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&n.callee.name==='cleanHeadings')calls.push({node:n,owner:own});for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>locate(x,own));else if(v&&typeof v==='object')locate(v,own);}}locate(parser.parse(source));assert.equal(calls.length,5,'Frozen original clean-heading call count');
  const callEdits=[];for(const{node:n,owner}of calls){const bindings=[];function bind(x){if(!x||typeof x!=='object')return;if(x!==owner&&/Function/.test(x.type))return;if(x.type==='VariableDeclarator'&&x.id.type==='Identifier'&&x.id.name==='cfg')bindings.push(x);for(const[k,v]of Object.entries(x)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(bind);else if(v&&typeof v==='object')bind(v);}}bind(owner);assert.equal(bindings.length,1);assert(bindings[0].start<n.start);assert.equal(owner.params[0]?.name,'source');assert.equal(n.arguments.length,3);const before=source.slice(n.start,n.end),after=before.slice(0,-1)+',{...cfg,v2217HeadingSource:source})';callEdits.push({start:n.start,end:n.end,text:after});changes.push({name:'immutable-source-clean-heading-call',owner:owner.id.name,beforeSha256:sha(before),afterSha256:sha(after),cfgBindingSha256:sha(source.slice(bindings[0].start,bindings[0].end)),sourceParameter:'source'});}
  for(const e of callEdits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);
 }
 const ast=parser.parse(source),nodes={},variables={},api=[];
 walk(ast,n=>{if(n.type==='FunctionDeclaration'&&n.id)(nodes[n.id.name]??=[]).push(n);if(n.type==='VariableDeclarator'&&n.id?.type==='Identifier'){(variables[n.id.name]??=[]).push(n);if(n.id.name==='api')api.push(n);}});
 assert.equal(api.length,1);assert.equal(api[0].init.type,'ObjectExpression');
 const edits=[],declarations=[],proof=[];
 for(const n of helperTree.program.body){const raw=helpers.slice(n.start,n.end);
  if(n.type==='FunctionDeclaration'){
   const found=nodes[n.id.name]||[];assert(found.length<=1,'Unique override '+n.id.name);
   if(found.length){const old=found[0],alias='v2217Previous_'+n.id.name;assert(!nodes[alias]);edits.push({start:old.id.start,end:old.id.end,text:alias});proof.push({kind:'retained-baseline-and-override',name:n.id.name,baselineAlias:alias,beforeSha256:sha(source.slice(old.start,old.end)),afterSha256:sha(raw)});}
   else proof.push({kind:'new-helper',name:n.id.name,sha256:sha(raw)});
   declarations.push(raw);
  }else{assert.equal(n.kind,'const');assert.equal(n.declarations.length,1);const d=n.declarations[0],found=variables[d.id.name]||[];assert(found.length<=1);if(found.length)edits.push({start:found[0].init.start,end:found[0].init.end,text:helpers.slice(d.init.start,d.init.end)});else declarations.push(raw);}
 }
 const existing=new Set(api[0].init.properties.map(p=>p.key?.name??p.key?.value)),added=functions.map(n=>n.id.name).filter(name=>!existing.has(name));
 if(added.length)edits.push({start:api[0].init.start+1,end:api[0].init.start+1,text:added.join(',')+','});
 const at=source.lastIndexOf('const api',api[0].start);assert(at>=0);if(declarations.length)edits.push({start:at,end:at,text:declarations.join('\n')+'\n'});
 edits.sort((a,b)=>b.start-a.start||b.end-a.end);let previous=source.length;for(const e of edits){assert(e.end<=previous,'Nonoverlapping overlay');source=source.slice(0,e.start)+e.text+source.slice(e.end);previous=e.start;}
 parser.parse(source);return{code:source,proof:{method:'Explicit AST overlay with retained baseline aliases',sourceSha256:initial,helperSha256:sha(helpers),stageHooks:early,changes,helpers:proof,exportsAdded:added}};
}
if(require.main===module){const[input,helper,output,receipt]=process.argv.slice(2),r=patch(fs.readFileSync(input,'utf8'),fs.readFileSync(helper,'utf8'));fs.writeFileSync(output,r.code);fs.writeFileSync(receipt,JSON.stringify(r.proof,null,2)+'\n');}
module.exports={patch};
