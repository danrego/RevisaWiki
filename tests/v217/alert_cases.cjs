'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const fixtures=[
 {id:'unconfirmed-short-citation',source:'Texto.{{Harvnb|Autor|1980}}\n{{Referências}}',baseline:1,current:0,unchanged:true},
 {id:'valid-follow-attribute',source:'Texto.<ref name="a">Fonte.</ref><ref follow="a">Nota.</ref>\n{{Referências}}',baseline:1,current:0,unchanged:true},
 {id:'valid-details-attribute',source:'Texto.<ref name="a" details="p. 2">Fonte.</ref>\n{{Referências}}',baseline:1,current:0,unchanged:true},
 {id:'valid-separate-note-groups',source:'Texto.<ref group="a">Nota.</ref><ref group="b">Fonte.</ref>\n== Notas ==\n<references group="a" />\n== Notas ==\n<references group="b" />\n{{Referências}}',baseline:2,current:0,unchanged:true},
 {id:'blocked-catalog-only-migration',source:'{{Lien web|titre=Fonte|url=https://example.test|champ_inconnu=valor}}',baseline:5,current:0,unchanged:true},
 {id:'catalog-only-native-parameter',source:'{{Citar web|titulo=Fonte|url=https://example.test|campo_desconhecido=valor preservado}}',baseline:1,current:0,unchanged:true},
 {id:'biography-conflict-one-family',source:"{{Info/Biografia|nome=Pessoa de controle|nascimento_data={{Dni|1|2|1980}}}}\n'''Pessoa de controle''' ({{DataExt|3|4|1981}}) é uma escritora.",baseline:2,current:1,unchanged:true},
 {id:'confirmed-isbn-failure',source:'{{Citar livro|titulo=Fonte|isbn=123}}',baseline:1,current:1,unchanged:true},
 {id:'conflicting-field-one-choice',source:'{{Citar web|titulo=Fonte|titulo=Outra fonte}}',baseline:2,current:1,unchanged:true},
 {id:'protected-literal',source:'<nowiki>{{Citar livro|titulo=Fonte|isbn=123}} {{Harvnb|Autor|1980}} <ref name="ausente" /></nowiki>',baseline:0,current:0,unchanged:true},
 {id:'actual-missing-definition',source:'Texto.<ref name="ausente" />\n{{Referências}}',kind:'audit',baseline:1,current:1,unchanged:true},
 {id:'actual-reference-conflict',source:'Texto.<ref name="a">Fonte.</ref><ref name="a">Outra fonte.</ref>\n{{Referências}}',kind:'audit',baseline:1,current:1,unchanged:true},
];
function options(api){return {...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',autoPreview:false,authorityControl:false,portals:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false};}
function run(api,baselineApi,output){
 const cfg=options(api),report={kind:'independent-visible-alert-contract',version:api.version,status:'passed',cases:[],checks:0,wikipediaWrites:0,networkRequests:0};
 const equal=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
 const test=(name,fn)=>{try{fn();report.cases.push({name,passed:true});}catch(error){report.status='failed';report.cases.push({name,passed:false,error:String(error.message)});}};
 for(const fixture of fixtures)test(fixture.id,()=>{
  const job={kind:fixture.kind||'adjust',source:fixture.source,options:cfg},result=api.calculate(job),baseline=baselineApi.calculate({...job,options:options(baselineApi)}),snapshot=JSON.stringify(result);
  const before=api.v217BaselineVisibleReviewPlan({result:baseline,source:baseline.text,options:cfg}),after=api.v217VisibleReviewPlan({result,source:result.text,options:cfg});
  equal(before.headerCount,fixture.baseline,'Independent baseline header count');equal(after.headerCount,fixture.current,'Independent current header count');
  if(fixture.unchanged)equal(result.text,fixture.source,'Review projection does not alter source bytes');
  equal(result.preservation||[],baseline.preservation||[],'Protection audit remains active and unchanged');
  equal(JSON.stringify(result),snapshot,'Visible projection never mutates technical producer records');
  equal(after.headerCount,after.findingFamilies+after.proposalGroups+after.recoveryEntries,'Pure count matches existing review header contract');
  if(fixture.id==='blocked-catalog-only-migration'){equal(result.suggestions.length,1,'Raw migration candidate remains available to technical QA');equal(result.warnings.length,3,'All raw local warnings remain available');equal(result.localReports.translation.length,1,'Raw final translation audit is retained');}
 });
 test('many-inconclusive-short-citations-do-not-exploit-row-cap',()=>{
  const source=Array.from({length:100},(_,n)=>'{{Harvnb|Autor'+n+'|1980}}').join('\n'),result=api.calculate({kind:'adjust',source,options:cfg}),before=api.v217BaselineVisibleReviewPlan({result,source:result.text,options:cfg}),after=api.v217VisibleReviewPlan({result,source:result.text,options:cfg});
  equal(before.headerCount,80,'The baseline retains its eighty producer findings');equal(before.findingEntries,60,'The baseline actual DOM row cap is explicit');equal(after.headerCount,0,'No unconfirmed citation entry remains');equal(after.renderedEntries,0,'Actual rendered finding/proposal entry reduction is measured');equal(result.localReports.references.length,80,'No raw citation diagnostic is deleted');
 });
 test('confirmed-repeated-family-is-one-entry-with-count',()=>{
  const source=Array.from({length:12},(_,n)=>'{{Citar livro|titulo=Fonte '+n+'|isbn='+(123+n)+'}}').join('\n'),result=api.calculate({kind:'adjust',source,options:cfg}),after=api.v217VisibleReviewPlan({result,source:result.text,options:cfg});
  equal(after.findings.length,1,'A repeated confirmed identifier failure has one row');equal(after.findings[0].occurrences,12,'The row reports all confirmed occurrences');equal(new Set(result.warnings).size>=12,true,'Raw technical warning identities remain separate');
 });
 test('repeated-proposal-family-retains-every-source-choice',()=>{
  const source=Array.from({length:5},(_,n)=>'{{Citar web|titulo=Fonte '+n+'|titulo=Outra '+n+'}}').join('\n'),result=api.calculate({kind:'adjust',source,options:cfg}),plan=api.v217VisibleReviewPlan({result,source:result.text,options:cfg}),group=plan.groups[0];
  equal(plan.headerCount,1,'A repeated conflict family occupies one existing report entry');equal(plan.proposalEntries,5,'Every independent choice remains accessible inside the existing group');equal(group.occurrences,5,'Its summary counts all five occurrences');equal(group.allProposals.length,5,'All original source-bound choices remain in the pure technical plan');
  const changed=api.applySuggestion(source,group.proposals[3],0);equal(changed.split('titulo=Outra').length-1,4,'A nonfirst choice affects only its verified occurrence');equal(changed.startsWith('{{Citar web|titulo=Fonte 0|titulo=Outra 0}}'),true,'The first independent conflict is untouched');
 });
 test('stale-source-and-invalid-proposal-coordinates-are-quiet',()=>{
  const result=api.calculate({kind:'adjust',source:fixtures[8].source,options:cfg});
  equal(api.v217VisibleReviewPlan({result,source:result.text+'\nTexto novo.',options:cfg}).headerCount,0,'An old calculation cannot decorate a new draft');
  for(const patch of [{start:-1},{end:999999},{before:'texto diferente'}])equal(api.v217VisibleReviewPlan({result:{...result,suggestions:result.suggestions.map(item=>({...item,...patch}))},source:result.text,options:cfg}).proposalEntries,0,'Stale source coordinates cannot offer an edit');
 });
 test('final-draft-rescan-removes-precleanup-and-rollback-residue',()=>{
  const source='Texto sem referências.',old=api.calculate({kind:'audit',source:fixtures[10].source,options:cfg}),result={...old,text:source,warnings:old.localReports.references.map(item=>item.message),suggestions:[]};
  equal(api.v217VisibleReviewPlan({result,source,options:cfg}).headerCount,0,'A raw old audit is rescanned against the actual final source');
  const bad=fixtures[10].source,restored={...old,text:bad};equal(api.v217VisibleReviewPlan({result:restored,source:bad,options:cfg}).headerCount,1,'An actual defect remaining in the restored final source is retained');
 });
 test('outside-section-dependency-is-quiet-with-protection-unchanged',()=>{
  const source='Texto da seção.',findings=[{domain:'references',source,state:'pending',code:'missing-definition',start:-1,severity:'error',message:'Dependência fora da seção.'},{domain:'preservation',source,state:'pending',code:'lost-prose',start:-1,severity:'warning',message:'Texto retirado.'}];
  const plan=api.v217VisibleReviewPlan({source,findings,options:cfg});equal(plan.headerCount,1,'Only the actual preservation guard remains');equal(plan.findings[0].code,'lost-prose','Global protection errors are not mistaken for outside-section dependencies');
 });
 test('positive-errors-are-not-classified-by-warning-words',()=>{
  const source='Texto.',findings=[{domain:'syntax',source,state:'pending',code:'unclosed-link',severity:'error',message:'Valor preservado sem confirmação. Confira o catálogo.'},{domain:'checks',source,state:'pending',code:'local-incomplete',message:'Cálculo não concluído.'},{domain:'preview-availability',source,state:'pending',code:'preview-unavailable',message:'Rede indisponível.'}];
  const plan=api.v217VisibleReviewPlan({source,findings,options:cfg});equal(plan.headerCount,2,'Structured confirmed errors and calculation failures remain despite inconclusive-looking prose');equal(plan.findings.map(item=>item.code),['unclosed-link','local-incomplete'],'Optional preview network availability is quiet');
 });
 test('same-table-defect-is-one-family-across-domains',()=>{
  const source='{|\n| texto',findings=[{domain:'syntax',source,state:'pending',code:'unclosed-table',start:0,message:'Tabela sem fechamento.'},{domain:'tables',source,state:'pending',code:'table-unclosed',start:0,severity:'error',message:'Tabela sem fechamento |}.'}];
  const plan=api.v217VisibleReviewPlan({source,findings,options:cfg});equal(plan.headerCount,1,'Two independent detectors share one current defect family');equal(plan.findings[0].severity,'error','Grouping retains the stronger safety severity');equal(plan.findings[0].members.length,2,'Original technical detections remain intact');
 });
 test('fresh-catalog-information-never-invites-value-deletion',()=>{
  const result=api.calculate({kind:'adjust',source:fixtures[5].source,options:cfg}),plan=api.v217VisibleReviewPlan({result,source:result.text,options:cfg});equal(result.suggestions.some(item=>item.choices.some(choice=>choice.label==='Remover o parâmetro e o seu valor')),true,'Legacy producer metadata remains available for QA');equal(plan.groups.length,0,'Catalog absence alone never exposes a removal choice');
 });
 test('pure-count-model-mirrors-exact-issue-store-identity',()=>{
  const source='Texto.',one={code:'unclosed-tag',message:'Etiqueta sem fechamento.',start:0,severity:'warning'},result={kind:'audit',text:source,warnings:[],suggestions:[],localReports:{references:[],syntax:[one,{...one,start:3}],translation:[],tables:[],biographies:[],dates:[]}};
  equal(api.v217BaselineVisibleReviewPlan({result,source,options:cfg}).headerCount,1,'Two identical producer messages install one actual baseline issue-store row');
 });
 test('computed-identifier-values-remain-inconclusive',()=>{
  const source='{{Citar livro|titulo=Fonte|isbn={{Valor de controle}}|doi={{Outro valor}}}}',result=api.calculate({kind:'adjust',source,options:cfg});
  equal(api.v217VisibleReviewPlan({result,source:result.text,options:cfg}).headerCount,0,'An unexpanded identifier cannot be declared invalid');equal(result.text,source,'Computed values remain exact');
 });
 test('option-changes-rebind-the-current-core-audit',()=>{
  const source=fixtures[6].source,raw=api.calculate({kind:'audit',source,options:cfg}),result=api.v217FinalReviewResult(raw,cfg),findings=api.v217ResultFindings(result,source,cfg),changed={...cfg,biographyStyleChecks:false};
  equal(api.v217VisibleReviewPlan({result,source,options:cfg,findings}).headerCount,1,'The enabled final biography audit is visible');
  equal(api.v217VisibleReviewPlan({result,source,options:changed,findings}).headerCount,0,'An old same-source audit cannot survive a changed checking option');
  equal(api.v217FinalReviewResult(result,changed).reviewBinding===result.reviewBinding,false,'Final evidence is bound to options as well as source and the UTC day');
 });
 test('late-core-errors-must-match-the-final-draft',()=>{
  const source='Texto completo.',result={kind:'audit',text:source,warnings:[],suggestions:[]},findings=[{domain:'syntax',source,state:'pending',code:'unclosed-link',start:0,severity:'error',message:'Ligação sem fechamento.'}];
  equal(api.v217VisibleReviewPlan({result,source,options:cfg,findings}).headerCount,0,'A stale asynchronous core error cannot label a complete current draft');
 });
 test('spelling-after-protected-source-keeps-native-coordinates',()=>{
  const source='<nowiki>excessão</nowiki>\nUma excessão.',result=api.calculate({kind:'spelling',source,options:cfg}),plan=api.v217VisibleReviewPlan({result,source,options:cfg});
  equal(result.suggestions.length>0,true,'The controlled unprotected spelling candidate exists');equal(plan.proposalEntries,result.suggestions.length,'Spelling uses its exact native sourceStart/sourceEnd coordinates');equal(result.text,source,'A spelling report never changes protected or ordinary source');
 });
 test('identical-independent-choices-have-distinct-ignore-identities',()=>{
  const source=Array(2).fill('{{Citar web|titulo=Fonte|língua=pt|língua=en}}').join('\n'),result=api.calculate({kind:'adjust',source,options:cfg}),plan=api.v217VisibleReviewPlan({result,source:result.text,options:cfg}),keys=plan.groups[0].proposals.map(api.v217ProposalKey);
  equal(new Set(keys).size,2,'Identical source snippets retain their independent source coordinates');equal(api.v217VisibleReviewPlan({result,source:result.text,options:cfg,ignoredSuggestionKeys:[keys[0]]}).proposalEntries,1,'Ignoring one identical occurrence cannot hide its independent sibling');
 });
 if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'alerts.json'),JSON.stringify(report,null,2)+'\n');}
 return report;
}
module.exports={fixtures,options,run};
if(require.main===module){
 const file=path.resolve(process.env.REVISAWIKI_SCRIPT||process.argv[2]),baselineFile=path.resolve(process.env.REVISAWIKI_BASELINE_SCRIPT||'dist/2.16.0/RevisaWiki_v2_16_0_completo.js'),api=require(file),report=run(api,require(baselineFile),path.resolve(process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2170/alerts'));
 report.runtimeSha256=sha(fs.readFileSync(file));console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
}
