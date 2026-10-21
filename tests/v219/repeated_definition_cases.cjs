'use strict';
// A repeated same-name definition must not delay the separately proved
// native name merger until a second complete action.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(value=>path.resolve(value)),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'exact-repeated-named-reference-definition',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),
 helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/reference_collectors.js'))),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
const eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(value,message)=>{report.checks++;assert.ok(value,message);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,
  pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,biographyPortal:false,
  automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false};
 for(const name of ['v219RepeatedNamedDefinitionEdits','v219RepeatedNamedDefinitionPlan','v219RepeatedNamedDefinitionProof'])
  assert.equal(typeof api[name],'function','The installed runtime must export '+name);
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 let endpointEvidence=[];
 function recordEndpoint(source,expected,options,calculated,intent){
  assert.equal(calculated.text,expected,'An independently specified complete-action endpoint must match exactly');report.checks++;
  const optionsSha256=sha(JSON.stringify(Object.fromEntries(Object.entries(options).sort(([a],[b])=>a.localeCompare(b))))),
   sourceSha256=sha(source),expectedEndpointSha256=sha(expected);
  endpointEvidence.push({evidenceKind:'actual-full-action-exact-endpoint',sourceSha256,expectedEndpointSha256,optionsSha256,
   intentSha256:sha(JSON.stringify({kind:'adjust',intent,sourceSha256,expectedEndpointSha256,optionsSha256})),
   appliedRuleIds:[...new Set((calculated.changes||[]).map(change=>change.id))],
   actualChanges:(calculated.changes||[]).map(({id,count})=>({id,count}))});
 }
 function test(id,fn){endpointEvidence=[];try{fn();report.cases.push({bundle,id,status:'passed',
  evidenceKind:endpointEvidence.length?'actual-full-action-exact-endpoint':'helper-or-invariant-only',fullActionEvidence:endpointEvidence});}catch(error){report.status='failed';
  report.cases.push({bundle,id,status:'failed',fullActionEvidence:endpointEvidence});report.failures.push({bundle,id,message:error.message});}}
 const sample=(name,group,body,repeats)=>Array.from({length:repeats},(_,index)=>'Fato '+index+'.<ref name="'+name+'"'+
  (group?' group="'+group+'"':'')+'>'+body+'</ref>').join('\n')+'\nOutra afirmação.<ref name="beta"'+
  (group?' group="'+group+'"':'')+'>'+body+'</ref>\n'+(group?'{{Referências|grupo='+group+'}}':'{{Referências}}');
 for(const group of ['','n','nota','Nota','0','custom'])for(const body of ['Fonte literal.',
  '{{Citar web|título=Publicação literal|url=https://example.invalid/fonte}}'])for(const repeats of [2,3,5])
  test('same-name-then-name-merge-'+group+'-'+body.length+'-'+repeats,()=>{
   const source=sample('alpha',group,body,repeats),plan=api.v219RepeatedNamedDefinitionPlan(source,cfg),
    first=plan.edits[0]?.proof;
   eq(plan.edits.length,repeats-1,'Only the exact redundant same-name definitions become calls');
   ok(first&&plan.text.includes(first.retained),'The first complete definition stays byte-identical');
   ok(plan.edits.every(edit=>edit.proof.body===body&&edit.proof.group===group&&edit.proof.name==='alpha'),
    'Every edit binds the exact original name, case-sensitive group and body');
   ok(api.v219RepeatedNamedDefinitionProof(source,plan.text,plan,cfg),'The local transaction is bound to the original complete page');
   eq(api.v219RepeatedNamedDefinitionPlan(plan.text,cfg).edits,[],'The local helper is idempotent');
   const result=api.calculate({kind:'adjust',source,options:cfg});
   ok(!/<ref\b[^>]*\bname\s*=\s*["']?beta\b/i.test(result.text),'The existing name-merging stage now reaches its first-pass endpoint');
   eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'The complete action is idempotent');
   eq(result.preservation||[],[],'The complete action has no false retention finding');
   eq(api.preservationAudit(source,result.text,cfg),[],'The independent existing preservation guard retains every logical reference');
   eq(api.safeComposition(source,result.text,cfg),'','The body/name merger composes only after the exact same-name consolidation');
  });
 test('full-action-exact-repeated-definition-then-native-merger',()=>{
  const options={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,
   pageTitle:'Tema fictício',contentModel:'wikitext',now:Date.UTC(2026,9,17,12),references:true,
   syntaxRepairs:true,structuralRepairs:true,automaticIdenticalReferences:true,automaticParameterDuplicates:true},
   source='A.<ref name="alpha">Fonte literal.</ref>\nB.<ref name="alpha">Fonte literal.</ref>\nC.<ref name="beta">Fonte literal.</ref>\n{{Referências}}',
   expected='A.<ref name="alpha">Fonte literal.</ref>\nB.<ref name="alpha" />\nC.<ref name="alpha" />\n{{Referências}}',
   result=api.calculate({kind:'adjust',source,options});
  recordEndpoint(source,expected,options,result,'exact redundant same-name definition followed by existing identical-body name merger');
  eq(result.preservation||[],[],'The exact complete endpoint retains all logical source bindings');
  eq(api.calculate({kind:'adjust',source:expected,options}).text,expected,'The independently specified endpoint is idempotent');
 });
 const source=sample('alpha','','Fonte literal.',2),negative=[
  ['different-body',s=>s.replace('Fato 1.<ref name="alpha">Fonte literal.', 'Fato 1.<ref name="alpha">Outra fonte.')],
  ['whitespace-body-difference',s=>s.replace('Fato 1.<ref name="alpha">Fonte literal.', 'Fato 1.<ref name="alpha"> Fonte literal.')],
  ['different-group',s=>s.replace('Fato 1.<ref name="alpha">', 'Fato 1.<ref name="alpha" group="n">')],
  ['collector-boundary',s=>s.replace('Fato 1.', '{{Referências}}\nFato 1.')],
  ['numeric-name',s=>s.replace(/alpha/g,'123')],
  ['dynamic-name',s=>s.replace(/name="alpha"/g,'name="{{Nome}}"')],
  ['extra-attribute',s=>s.replace('Fato 1.<ref name="alpha"', 'Fato 1.<ref dir="rtl" name="alpha"')],
  ['follow-attribute',s=>s+'\n<ref follow="alpha">Complemento.</ref>'],
  ['details-attribute',s=>s.replace('Fato 1.<ref name="alpha"', 'Fato 1.<ref details="1" name="alpha"')],
  ['native-bank',s=>s.replace('{{Referências}}','{{Referências|refs=<ref name="banco">Outra fonte.</ref>}}')],
  ['raw-bank',s=>s.replace('{{Referências}}','<references><ref name="banco">Outra fonte.</ref></references>')],
  ['nested-unknown-body',s=>s.replace(/Fonte literal\./g,'{{Modelo desconhecido|texto=Fonte literal.}}')],
  ['nested-reference-template',s=>'{{Modelo|conteúdo='+s+'}}'],
  ['quoted-source',s=>'"'+s+'"'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!-- '+s+' -->'],
  ['markdown',s=>'```wikitext\n'+s+'\n```'],['unfinished-source',s=>s+'\n{{Incompleta'],
  ['native-note-emitter',s=>s+'\n{{nota de rodapé|Nota literal.}}'],['native-call-emitter',s=>s+'\n{{r|alpha}}'],
  ['native-short-citation-emitter',s=>s+'\n{{sfn|Autoria literal|2020}}']
 ];
 for(const [id,change]of negative)test('refuse-'+id,()=>{const value=change(source),plan=api.v219RepeatedNamedDefinitionPlan(value,cfg);
  eq(plan.text,value,'Unproved definitions, contexts, banks or implicit bindings keep their exact source bytes');
  eq(plan.edits,[],'The strict preliminary stage adds no speculative edit or alert');
 });
 for(const [key,value]of [['references',false],['automaticIdenticalReferences',false],['syntaxRepairs',false],
  ['structuralRepairs',false],['namespaceNumber',1],['namespaceNumber',10],['discussionPage',true],['sectionOnly',true],['contentModel','javascript']])
  test('scope-'+key,()=>{eq(api.v219RepeatedNamedDefinitionPlan(source,{...cfg,[key]:value}).text,source,'The existing source and family gates remain explicit');});
 test('proof-tampering',()=>{
  const plan=api.v219RepeatedNamedDefinitionPlan(source,cfg);
  for(const changed of [plan.text.replace('name="alpha"','name="changed"'),plan.text.replace('Fonte literal.','Outra fonte.'),plan.text+'x'])
   eq(api.v219RepeatedNamedDefinitionProof(source,changed,plan,cfg),false,'A different name, body or endpoint cannot reuse the proof');
  eq(api.v219RepeatedNamedDefinitionProof(source+' ',plan.text,plan,cfg),false,'A different source cannot reuse the proof');
  eq(api.v219RepeatedNamedDefinitionProof(source,plan.text,{...plan,edits:[]},cfg),false,'The exact edit list participates in the proof');
 });
 eq(sha(fs.readFileSync(file)),sha(bytes),'The runtime snapshot remains immutable during the suite');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
