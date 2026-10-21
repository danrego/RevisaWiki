'use strict';
const {assert,load,report,finish}=require('./engine_helper.cjs'),candidate=require('./candidate.cjs');
const out=report('exact-source-shared-structure-and-independent-groups');out.status='passed';

// Additive causal metadata is authored from the supplied source/options/expected.
// It never changes a product option, fixture endpoint or proof.
function cc9Pair(report,id,option,role,source,onOptions,offOptions,onExpected,offExpected,proof=null){
 const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
 const h=v=>require('node:crypto').createHash('sha256').update(typeof v==='string'?v:JSON.stringify(canon(v))).digest('hex');
 const keys=[...new Set([...Object.keys(onOptions),...Object.keys(offOptions)])].sort(),changed=keys.filter(k=>JSON.stringify(canon(onOptions[k]))!==JSON.stringify(canon(offOptions[k])));
 require('node:assert/strict').deepEqual(changed,[option]);require('node:assert/strict').equal(onOptions[option],true);require('node:assert/strict').equal(offOptions[option],false);
 (report.causalControls??=[]).push({schemaVersion:1,id,option,role,sourceSha256:h(source),onOptionsSnapshot:canon(onOptions),offOptionsSnapshot:canon(offOptions),onOptionsSha256:h(onOptions),offOptionsSha256:h(offOptions),onExpectedSha256:h(onExpected),offExpectedSha256:h(offExpected),proofSha256:proof?h(proof):null,identicalProofAcrossPair:!!proof,writerPositiveCredit:0});
}

const cfg={namespaceNumber:0,pageTitle:'Artigo de teste',authorityControl:false,endTemplateOrder:false};
function eq(a,b,label){out.checks++;assert.deepEqual(a,b,label);}
function test(bundle,name,fn){try{fn();out.cases.push({bundle,name,passed:true});}catch(error){out.status='failed';out.failures.push({bundle,name,message:error.message});out.cases.push({bundle,name,passed:false});}}
const table=label=>'{| class="wikitable"\n! Primeiro !! Segundo\n|-\n|-\n| '+label+' || Valor\n|}\n';
for(const bundle of ['RevisaWiki_v2_10_0.js','RevisaWiki_v2_10_0_completo.js']){
 const {api}=load(bundle);
 test(bundle,'native anchor proofs survive the real worker option bridge',()=>{
  const proof={kind:'v210-harvard-anchor-native',sourceHash:'synthetic-source',target:'CITEREFSilva2004'},options={...cfg,harvardAnchorProofs:[proof],unrecognizedWorkerOption:'ignored'};
  const serialized=api.v210SerializableOptions(options);
  eq(serialized.harvardAnchorProofs,[proof],'The confirmed source-bound evidence reaches the worker job');
  eq(Object.hasOwn(serialized,'unrecognizedWorkerOption'),false,'Unknown configuration is still excluded');
  eq(serialized.pageTitle,cfg.pageTitle,'The page binding travels with the proof');
 });
 test(bundle,'shared exact-source structures and bounded accounting',()=>{
  api.v210ClearStructuralCache();const source=table('A'),first=api.v210StructuralIndex(source),next=api.v210StructuralIndex(source);
  eq(first===next,true,'The same unchanged draft reuses its structural read');
  eq(first.tables.length,1,'The complete table is indexed');eq(first.references.length,0,'No reference is invented');
  eq(api.v210StructuralIndex('Texto.\n'+source).tables[0].start,7,'Changed drafts receive independent offsets');
  const before=api.v210StructuralCacheStatus();eq(before.hits>0,true,'The cache reports actual reuse');
  for(let i=0;i<12;i++)api.v210StructuralIndex(('Trecho '+i+'\n').repeat(5000)+source);
  const after=api.v210StructuralCacheStatus();eq(after.entries<=4,true,'Only a bounded number of full drafts are retained');eq(after.estimatedBytes<=after.maximumEstimatedBytes,true,'Structural memory respects its own limit');eq(after.accountingConsistent,true,'All retained entries contribute to accounting');
  api.v210ClearStructuralCache();eq(api.v210StructuralCacheStatus().estimatedBytes,0,'Explicit clear removes all retained structures');
 });
 test(bundle,'two independent table repairs allow complete object subsets',()=>{
  const source=table('A')+'\nTexto entre tabelas.\n\n'+table('B'),plan=api.v210IndependentRepairPlan(source,cfg);
  eq(plan.groups.filter(group=>group.kind==='table').length,2,'Two independent complete literal tables get separate groups');
  for(const group of plan.groups){const part=api.v210IndependentProjection(plan,[group.id]);eq(part!==source,true,'A selected table receives its planned repair');eq(part!==plan.text,true,'The other table stays unmodified');eq(api.v210IndependentSubsetProof(source,part,cfg).accepted,true,'The exact complete object subset is approved');eq(api.safeComposition(source,part,cfg),'','The production composition guard accepts that subset');eq(api.preservationAudit(source,part,cfg),[],'Production retention accepts only the source-derived subset');eq(api.v210IndependentSubsetProof(source,part.replace('Valor','Alterado'),cfg).accepted,false,'A changed cell cannot borrow a valid independent repair');}
  eq(api.v210IndependentProjection(plan,['unknown']),null,'Unknown dependency groups are rejected');eq(api.v210IndependentProjection({...plan,sourceHash:'forged'},[plan.groups[0].id]),null,'Stale or forged source plans cannot authorize text');
 });
 test(bundle,'cc9-independent-complete-object-single-flag-off',()=>{
  const source="'''Artigo de teste''' reúne dados para uma verificação local.\n\n{| class=\"wikitable\"\n! scope=\"col\" Seguro !! scope=\"col\" | Valor\n|-\n| A || B\n|}\nTexto entre tabelas.\n{| class=\"wikitable\"\n! scope=\"col\" Falha !! scope=\"col\" | Valor\n|-\n| A || B\n|}\n\n{{Referências}}\n",expectedSelected="'''Artigo de teste''' reúne dados para uma verificação local.\n\n{| class=\"wikitable\"\n! scope=\"col\" | Seguro !! scope=\"col\" | Valor\n|-\n| A || B\n|}\nTexto entre tabelas.\n{| class=\"wikitable\"\n! scope=\"col\" Falha !! scope=\"col\" | Valor\n|-\n| A || B\n|}\n\n{{Referências}}\n",expectedCombined="'''Artigo de teste''' reúne dados para uma verificação local.\n\n{| class=\"wikitable\"\n! scope=\"col\" | Seguro !! scope=\"col\" | Valor\n|-\n| A || B\n|}\nTexto entre tabelas.\n{| class=\"wikitable\"\n! scope=\"col\" | Falha !! scope=\"col\" | Valor\n|-\n| A || B\n|}\n\n{{Referências}}\n",onOptions={...api.defaults,namespaceNumber:0,pageTitle:'Artigo de teste',authorityControl:false,endTemplateOrder:false,links:false},offOptions={...onOptions,independentRepairGroups:false};
  const on=api.v210IndependentRepairPlan(source,onOptions),off=api.v210IndependentRepairPlan(source,offOptions);eq(on.groups.length,2,'The unchanged native-flow source has two complete independent objects');eq(on.text,expectedCombined,'The existing independent positive proposes both literal attribute separators');
  const first=on.groups.find(g=>g.kind==='table'&&g.start===source.indexOf('{|'));eq(!!first,true,'The selected object is source-occurrence bound');eq(api.v210IndependentProjection(on,[first.id]),expectedSelected,'Explicit selection applies only the first complete object');eq(api.v210IndependentSubsetProof(source,expectedSelected,onOptions).accepted,true,'The positive is a complete native dependency subset');
  eq(off.groups,[],'The off capability offers no independent selection');eq(off.text,source,'The off plan endpoint is the original source');eq(api.v210IndependentProjection(off,[first.id]),null,'An old selected ID cannot bypass the disabled capability');
  cc9Pair(out,'independent-complete-object-selection','independentRepairGroups','helper-source-proof-selection',source,onOptions,offOptions,expectedSelected,source);
 });
 test(bundle,'references force dependency grouping across table boundaries',()=>{
  const source=table('A<ref name="fonte">Obra.</ref>')+'\n'+table('B'),plan=api.v210IndependentRepairPlan(source,cfg);
  eq(plan.groups.some(group=>group.id==='dependencies'),true,'A table containing reference dependencies is kept with the graph');eq(plan.groups.filter(group=>group.kind==='table').length,1,'Only the unreferenced literal table is independent');
 });
 test(bundle,'a partial edit within an object does not become an independent repair',()=>{
  const source=table('A')+'\n'+table('B'),plan=api.v210IndependentRepairPlan(source,cfg),group=plan.groups[0];
  if(group.edits.length>1){const edit=group.edits[0],part=source.slice(0,edit.start)+edit.text+source.slice(edit.end);eq(api.v210IndependentSubsetProof(source,part,cfg).accepted,false,'A cell or delimiter fragment cannot replace a complete dependency group');}
  eq(api.v210IndependentRepairPlan(source,{...cfg,independentRepairGroups:false}).groups.length,0,'The independent recovery option can be disabled');
 });
}
finish(out,'structural_engine');if(out.status!=='passed')process.exitCode=1;
