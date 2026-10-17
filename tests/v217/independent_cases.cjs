'use strict';
// Literal endpoints are independent of the production planners and counters.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const boxBefore='{{Info/Biografia|nome=Pessoa fictícia|ocupação=escritora|ocupações=|residencia=Cidade fictícia|sepultamento=[[Local fictício]]|enterro_local=Local literal}}';
const boxAfter='{{Info/Biografia|nome=Pessoa fictícia|ocupação=escritora|residência=Cidade fictícia|sepultamento=[[Local fictício]]|enterro_local=Local literal}}';
const boxAliasAfter='{{Info/Biografia|nome=Pessoa fictícia|ocupação=escritora|residencia=Cidade fictícia|sepultamento=[[Local fictício]]|enterro_local=Local literal}}';
const refBefore='\'\'\'Pessoa fictícia\'\'\' é uma escritora.<ref name="a">Fonte literal alfa.</ref> Outra chamada.<ref nome="a" />';
const refAfter='\'\'\'Pessoa fictícia\'\'\' é uma escritora.<ref name="a">Fonte literal alfa.</ref> Outra chamada.<ref name="a" />';
const tableBefore='{| class="wikitable"\n! A !! B !! C\n|-\n| colpan="2" | Celula A\n| Final A\n|-\n| colpsan="2" | Celula B\n| Final B\n|}';
const tableAfter='{| class="wikitable"\n! A !! B !! C\n|-\n| colspan="2" | Celula A\n| Final A\n|-\n| colspan="2" | Celula B\n| Final B\n|}';
const tablePartial='{| class="wikitable"\n! A !! B !! C\n|-\n| colspan="2" | Celula A\n| Final A\n|-\n| colpsan="2" | Celula B\n| Final B\n|}';
const join=(...parts)=>parts.join('\n\n'),collector='{{Referências}}';
const combinedBefore=join(boxBefore,refBefore,tableBefore,collector);
// The principal infobox may emit references through native expansion or
// Wikidata. Its presence deliberately prevents a whole-graph ref rename.
const combinedAfter=join(boxAfter,refBefore,tableAfter,collector);
const plainBefore=join(refBefore,tableBefore,collector),plainAfter=join(refAfter,tableAfter,collector);
const fixtures={boxBefore,boxAfter,boxAliasAfter,refBefore,refAfter,tableBefore,tableAfter,tablePartial,combinedBefore,combinedAfter,plainBefore,plainAfter};
module.exports=fixtures;

function options(api){return {...api.defaults,namespaceNumber:0,pageTitle:'Pessoa fictícia',autoPreview:false,registryDoiCheck:false,
 authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,minorBaseConfirmed:true,
 unifiedNotesReferences:false,referenceColumns:false,tableAccessibility:false,endTemplateOrder:false,endSectionOrder:false,headings:false,
 automaticIdenticalReferences:false,moveNamedRefs:false};}
function filesFromArgs(){
 const args=process.argv.slice(2),files=[];
 for(let index=0;index<args.length;index++){
  if(['--core','--complete'].includes(args[index])){assert.ok(args[index+1],'A bundle path must follow '+args[index]);files.push(path.resolve(args[++index]));}
  else {assert.ok(!args[index].startsWith('--'),'Use --core FILE and --complete FILE');files.push(path.resolve(args[index]));}
 }
 if(!files.length&&process.env.REVISAWIKI_SCRIPT)files.push(path.resolve(process.env.REVISAWIKI_SCRIPT));
 if(!files.length)files.push(...['RevisaWiki_v2_17_0.js','RevisaWiki_v2_17_0_completo.js'].map(name=>path.join(root,'dist/2.17.0',name)));
 return [...new Set(files)];
}
function run(){
 const start=process.hrtime.bigint(),runnerBytes=fs.readFileSync(__filename),files=filesFromArgs();
 const report={kind:'independent-composed-safe-repairs',status:'passed',runnerSha256:sha(runnerBytes),nodeVersion:process.version,
  bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
 const eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(value,message)=>{report.checks++;assert.ok(value,message);};
 for(const file of files){
  const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),cfg=options(api);
  report.bundles.push({file:bundle,runtimeVersion:api.version,runtimeSha256:sha(bytes),bytes:bytes.length});
  const test=(id,fn)=>{const at=process.hrtime.bigint();try{fn();report.cases.push({bundle,id,status:'passed',milliseconds:Number(process.hrtime.bigint()-at)/1e6});}catch(error){report.status='failed';const message=String(error.message).replaceAll(root,'<checkout>');report.cases.push({bundle,id,status:'failed',message});report.failures.push({bundle,id,message});}};
  const calculate=(source,override={})=>api.calculate({kind:'adjust',source,options:{...cfg,...override}});
  function count(source,expected,number,settings=cfg){
   const retained=api.v211RetainedAdjustments(source,expected,[],settings);eq(retained.exact,true,'Retained source components have exact witnesses');eq(retained.count,number,'Each retained native operation is counted once');eq(retained.events.length,number,'Count and operation witnesses agree');eq(new Set(retained.events.map(event=>event.id)).size,number,'Operation identities remain unique');return retained;
  }
  function pipeline(source,expected,number,summary,minor,override={}){
   const settings={...cfg,...override},result=calculate(source,override);eq(result.text,expected,'The production endpoint matches literal expected wikitext');eq(result.preservation,[],'The production preservation guard permits the exact endpoint');eq(api.preservationAudit(source,expected,settings),[],'The separate preservation audit retains facts and references');eq(api.safeComposition(source,expected,settings),'','Selectable composition permits the complete proved repair');eq(calculate(expected,override).text,expected,'The complete action is idempotent');count(source,expected,number,settings);eq(api.summaryForTopics(api.summaryTopics(source,expected)),summary,'The edit summary names the actual changed domains');eq(result.minorCheck.eligible,minor,'The pipeline minor decision follows the source proof');eq(api.minorEligibility(source,expected,settings).eligible,minor,'The separately computed minor decision agrees');return result;
  }
  test('combined-native-infobox-keeps-transclusion-reference-guard',()=>{
   const result=pipeline(combinedBefore,combinedAfter,4,'Ajustes de infocaixas e tabelas com RevisaWiki.',false);
   eq(api.v217NativeRefAttributeEdits(combinedBefore,cfg),[],'A native infobox cannot prove absence of expansion-generated references');
   eq(api.v217InfoboxValuePlan(combinedBefore,cfg).edits.flatMap(edit=>edit.proof.changeRules).slice().sort(),['v217InfoboxEmptyAliases','v217InfoboxParameterAccents'],'The two infobox operations have independent source witnesses');
   eq(api.v217TableFiniteRepairPlan(combinedBefore,cfg).edits.length,2,'Both necessary span spellings form one table transaction');
   eq(result.text.includes('<ref nome="a" />'),true,'An unproved reference correction remains untouched');
   eq(result.text.includes('|sepultamento=[[Local fictício]]|enterro_local=Local literal'),true,'Both existing burial fields retain their exact bytes');
  });
  test('reference-and-table-repairs-compose-without-an-unknown-emitter',()=>{
   pipeline(plainBefore,plainAfter,3,'Ajustes de referências e tabelas com RevisaWiki.',true);
   eq(api.v211MinorMechanicalPlan(plainBefore,cfg).text,plainAfter,'Mechanical replay completes the three source-bound operations');
  });
  const groupedBefore=join('Texto.<ref nome="a" grupo="n">Fonte literal alfa.</ref> Outra chamada.<ref name="a" group="n" />',tableBefore,'<references group="n" />');
  const groupedAfter=join('Texto.<ref name="a" group="n">Fonte literal alfa.</ref> Outra chamada.<ref name="a" group="n" />',tableAfter,'<references group="n" />');
  test('dual-reference-keys-and-table-keys-count-separately',()=>pipeline(groupedBefore,groupedAfter,4,'Ajustes de referências e tabelas com RevisaWiki.',true));
  for(const [name,prefix]of [['nowiki','<nowiki><ref nome="ignorada" /> | colpan="2" |</nowiki>\n'],['comment','<!-- <ref nome="ignorada" /> | colpan="2" | -->\n']]){
   test('protected-prefix-keeps-active-reference-transaction-'+name,()=>{pipeline(prefix+plainBefore,prefix+plainAfter,3,'Ajustes de referências e tabelas com RevisaWiki.',true);eq(calculate(prefix+plainBefore).text.slice(0,prefix.length),prefix,'The opaque prefix remains byte-identical');});
   test('protected-prefix-keeps-active-infobox-transaction-'+name,()=>pipeline(prefix+combinedBefore,prefix+combinedAfter,4,'Ajustes de infocaixas e tabelas com RevisaWiki.',false));
  }
  test('known-literal-reference-free-prefix-retains-native-graph-proof',()=>{const prefix='{{Commonscat|Categoria fictícia}}\n';pipeline(prefix+plainBefore,prefix+plainAfter,3,'Ajustes de referências e tabelas com RevisaWiki.',true);});
  test('unknown-prefix-does-not-borrow-a-reference-graph-proof',()=>{const prefix='{{Modelo fictício}}\n',expected=prefix+join(refBefore,tableAfter,collector);pipeline(prefix+plainBefore,expected,2,'Ajustes de tabelas com RevisaWiki.',true);eq(api.v217NativeRefAttributeEdits(prefix+plainBefore,cfg),[],'Unknown transclusions retain the global ambiguity guard');});
  for(const [name,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!--'+s+'-->'],['code',s=>'<code>'+s+'</code>'],['enclosing-template',s=>'{{Modelo fictício|conteúdo='+s+'}}']])test('fully-protected-composition-'+name,()=>{
   const source=wrap(combinedBefore),expected=name==='enclosing-template'?source+'\n\n{{Referências}}\n\n':source;eq(calculate(source).text,expected,'Enclosing source bytes remain intact, with the established missing-list recovery outside an unknown template');eq(api.v217NativeRefAttributeEdits(source,cfg),[],'Reference repair remains blocked');eq(api.v217InfoboxValuePlan(source,cfg).edits,[],'Infobox repair remains blocked');eq(api.v217TableFiniteRepairPlan(source,cfg).edits,[],'Table repair remains blocked');
  });
  for(const override of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:undefined},{sectionOnly:true},{section:'2'},{discussionPage:true},{contentModel:'javascript'},{model:'Scribunto'},{syntaxRepairs:false},{structuralRepairs:false},{markup:false}])test('disabled-composition-scope-'+JSON.stringify(override),()=>{
   const settings={...cfg,...override};eq(api.v217NativeRefAttributeEdits(combinedBefore,settings),[],'Reference helper rejects another source scope');eq(api.v217InfoboxValuePlan(combinedBefore,settings).edits,[],'Infobox helper rejects another source scope');eq(api.v217TableFiniteRepairPlan(combinedBefore,settings).edits,[],'Table helper rejects another source scope');eq(calculate(combinedBefore,override).text,combinedBefore,'The whole pipeline honors the disabled scope');
  });
  for(const override of [{automaticInfoboxValues:false},{automaticBiographyFields:false}])test('infobox-opt-out-preserves-independent-table-fixes-'+JSON.stringify(override),()=>pipeline(combinedBefore,join(boxBefore,refBefore,tableAfter,collector),2,'Ajustes de tabelas com RevisaWiki.',true,override));
  test('reference-opt-out-preserves-independent-table-fixes',()=>pipeline(plainBefore,join(refBefore,tableAfter,collector),2,'Ajustes de tabelas com RevisaWiki.',true,{references:false}));
  test('table-opt-out-preserves-independent-reference-fix',()=>pipeline(plainBefore,join(refAfter,tableBefore,collector),1,'Ajustes de referências com RevisaWiki.',true,{automaticTableRepairs:false}));
  test('production-default-feature-flags-remain-enabled',()=>{
   eq(api.defaults.automaticInfoboxValues,true,'The new automatic field stage is enabled by default');eq(api.defaults.automaticBiographyFields,true,'Its established biography scope remains enabled');eq(api.defaults.automaticReferenceRepairs,true,'Native reference repairs retain their established default');eq(api.defaults.tableSyntaxRepairs,true,'Finite table syntax repairs retain their established default');
   const defaults={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa fictícia',autoPreview:false,registryDoiCheck:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,minorBaseConfirmed:true};
   const result=api.calculate({kind:'adjust',source:combinedBefore,options:defaults});eq(result.text,combinedAfter,'Untoggled production feature defaults reach the same literal bounded endpoint');count(combinedBefore,combinedAfter,4,defaults);
  });
  const aliasBox='{{Info/Biografia|nome=Pessoa fictícia|ocupacao=escritora|conjuge=Pessoa de exemplo|agencia=Agência literal|premio=Prêmio literal|residencia=Cidade fictícia|sepultamento=[[Local fictício]]|enterro_local=Local literal}}';
  const aliasExpected='{{Info/Biografia|nome=Pessoa fictícia|ocupacao=escritora|conjuge=Pessoa de exemplo|agencia=Agência literal|premio=Prêmio literal|residência=Cidade fictícia|sepultamento=[[Local fictício]]|enterro_local=Local literal}}';
  test('accepted-native-aliases-retain-their-original-spelling',()=>pipeline(join(aliasBox,refBefore,tableBefore,collector),join(aliasExpected,refBefore,tableAfter,collector),3,'Ajustes de infocaixas e tabelas com RevisaWiki.',false));
  const collisions=[
   ['different-nonempty-aliases','{{Info/Biografia|nome=Pessoa fictícia|ocupação=escritora|ocupações=editora|residencia=Cidade fictícia}}','{{Info/Biografia|nome=Pessoa fictícia|ocupação=escritora|ocupações=editora|residência=Cidade fictícia}}'],
   ['intentional-empty-higher-priority','{{Info/Biografia|nome=Pessoa fictícia|ocupação=|ocupações=escritora|residencia=Cidade fictícia}}','{{Info/Biografia|nome=Pessoa fictícia|ocupação=|ocupações=escritora|residência=Cidade fictícia}}'],
   ['accent-target-collision','{{Info/Biografia|nome=Pessoa fictícia|ocupação=escritora|ocupações=|residencia=Cidade A|residência=Cidade B}}','{{Info/Biografia|nome=Pessoa fictícia|ocupação=escritora|residencia=Cidade A|residência=Cidade B}}']
  ];
  for(const [id,sourceBox,expectedBox]of collisions)test('independent-collision-control-'+id,()=>pipeline(join(sourceBox,refBefore,tableBefore,collector),join(expectedBox,refBefore,tableAfter,collector),3,'Ajustes de infocaixas e tabelas com RevisaWiki.',id==='accent-target-collision'));
  for(const [id,expected,number,summary,minor]of [
   ['table-only',join(boxBefore,refBefore,tableAfter,collector),2,'Ajustes de tabelas com RevisaWiki.',true],
   ['complete-infobox-only',join(boxAfter,refBefore,tableBefore,collector),2,'Ajustes de infocaixas com RevisaWiki.',false]
  ])test('retained-complete-independent-subset-'+id,()=>{
   eq(api.safeComposition(combinedBefore,expected,cfg),'','A complete independent transaction may be retained by itself');eq(api.v210IndependentSubsetProof(combinedBefore,expected,cfg).accepted,true,'The source-bound subset proof accepts this complete group');count(combinedBefore,expected,number);eq(api.summaryForTopics(api.summaryTopics(combinedBefore,expected)),summary,'A retained subset summary names only its changed domain');eq(api.minorEligibility(combinedBefore,expected,cfg).eligible,minor,'Subset minor status follows the operations actually retained');eq(api.preservationAudit(combinedBefore,expected,cfg),[],'Omitted independent fixes do not weaken preservation');
   const direct=api.v217RetainedCount(combinedBefore,expected,[],[],cfg);if(id==='table-only')eq(direct,null,'The new infobox counter cannot claim an independently selected table');else{eq(direct.count,2,'The narrow dependency selection counts its two actual infobox operations');ok(direct.events.every(event=>event.witness.selection?.groups.length===1&&event.witness.selection.groups[0]==='dependencies'),'Each selected operation retains the exact complete dependency-group witness');}
  });
  for(const [id,expected]of [['one-table-key',join(boxBefore,refBefore,tablePartial,collector)],['half-infobox-transaction',join(boxAliasAfter,refBefore,tableBefore,collector)]])test('incomplete-dependent-subset-is-refused-'+id,()=>{
   ok(Boolean(api.safeComposition(combinedBefore,expected,cfg)),'An incomplete dependent repair cannot be retained');eq(api.syntaxRepairSourceProof(combinedBefore,expected,cfg).accepted,false,'The exact source proof rejects a partial transaction');eq(api.v210IndependentSubsetProof(combinedBefore,expected,cfg).accepted,false,'The independent subset matcher rejects the partial group');eq(api.minorEligibility(combinedBefore,expected,cfg).eligible,false,'A partial group is not a mechanical edit');
   eq(api.v217RetainedCount(combinedBefore,expected,[],[],cfg),null,'The narrow retained counter cannot certify a split transaction');
  });
  for(const [id,expected]of [['changed-cell',join(boxAfter,refBefore,tableBefore,collector).replace('Celula A','Celula inventada')],['changed-prose',join(boxAfter,refBefore,tableBefore,collector).replace('é uma escritora','é uma artista')]])test('dependency-subset-counter-rejects-extra-mutation-'+id,()=>{
   eq(api.v217RetainedCount(combinedBefore,expected,[],[],cfg),null,'A selected dependency witness cannot count an unrelated mutation');eq(api.v210IndependentSubsetProof(combinedBefore,expected,cfg).accepted,false,'The subset matcher remains exact about all unchanged bytes');ok(Boolean(api.safeComposition(combinedBefore,expected,cfg)),'Composition retains its independent mutation guard');
  });
  test('dependency-subset-counter-requires-every-other-dependency',()=>{
   const extra='{{Citar web|título=Fonte literal|url="https://example.test/fonte"}}',source=join(combinedBefore,extra),incomplete=join(boxAfter,refBefore,tableBefore,collector,extra);
   eq(api.v217RetainedCount(source,incomplete,[],[],cfg),null,'Omitting another pending non-table dependency prevents the narrow count projection');eq(api.v210IndependentSubsetProof(source,incomplete,cfg).accepted,false,'The production dependency group remains atomic');ok(Boolean(api.safeComposition(source,incomplete,cfg)),'Composition rejects an incomplete group despite two valid infobox changes');
  });
  for(const [id,mutate]of [['source-body',s=>s.replace('Fonte literal alfa.','Fonte inventada.')],['table-payload',s=>s.replace('Celula A','Celula inventada')],['burial-value',s=>s.replace('[[Local fictício]]','[[Local inventado]]')],['populated-infobox-value',s=>s.replace('Cidade fictícia','Cidade inventada')]])test('invalid-mutation-remains-rejected-after-quiet-report-'+id,()=>{
   const altered=mutate(combinedAfter);ok(altered!==combinedAfter,'The adversarial endpoint changes a real retained value');const original=calculate(combinedBefore),snapshot=JSON.stringify(original),before=api.syntaxRepairSourceProof(combinedBefore,altered,cfg);eq(before.accepted,false,'Source proof rejects the unrelated mutation');ok(Boolean(api.safeComposition(combinedBefore,altered,cfg)),'Selective comparison rejects the unrelated mutation');ok(api.preservationAudit(combinedBefore,altered,cfg).length>0,'Independent preservation detects the changed value');
   api.v217VisibleReviewPlan({result:original,source:original.text,options:cfg});eq(JSON.stringify(original),snapshot,'Quiet presentation does not mutate technical producer results');eq(api.syntaxRepairSourceProof(combinedBefore,altered,cfg),before,'Quiet presentation cannot weaken the original source proof');eq(api.minorEligibility(combinedBefore,altered,cfg).eligible,false,'The changed value cannot qualify as mechanical');
  });
  test('source-profile-revision-mismatch-cannot-reuse-a-field-witness',()=>{
   const source=join(boxBefore,refBefore,tableBefore,collector),plan=api.v217InfoboxValuePlan(source,cfg),profile=api.infoboxCatalog['info/biografia'],oldid=profile.oldid;
   eq(plan.edits.length,1,'The original reviewed template revision has one infobox transaction');
   try{profile.oldid=-1;eq(api.v217InfoboxValuePlan(source,cfg).edits,[],'An unreviewed source revision cannot borrow the native field contract');eq(api.v217InfoboxValueProof(source,plan.text,plan,cfg),false,'The old witness is stale under another native source revision');}finally{profile.oldid=oldid;}
   eq(api.v217InfoboxValuePlan(source,cfg).text,plan.text,'Restoring the public catalog restores the original helper contract');
  });
  test('quiet-report-keeps-confirmed-reference-errors-and-source-guards',()=>{
   const source='Texto.<ref name="ausente" />\n{{Referências}}',result=api.calculate({kind:'audit',source,options:cfg}),snapshot=JSON.stringify(result),view=api.v217VisibleReviewPlan({result,source:result.text,options:cfg});
   eq(result.text,source,'Audit and report projection do not change the source');ok(view.headerCount>=1,'A confirmed missing native definition remains visible');ok(view.findings.some(finding=>finding.code==='missing-definition'),'The visible error retains its source-bound diagnostic kind');eq(JSON.stringify(result),snapshot,'All original technical diagnostics remain available');eq(api.v217NativeRefAttributeEdits(combinedBefore,cfg),[],'Quieting does not turn an unproved transclusion graph into a repair');
  });
  test('runtime-and-runner-bytes-stay-stable',()=>{eq(sha(fs.readFileSync(file)),sha(bytes),'The tested bundle was not rewritten');eq(sha(fs.readFileSync(__filename)),report.runnerSha256,'The independently executed runner was not rewritten');});
 }
 report.caseCount=report.cases.length;report.elapsedMilliseconds=Number(process.hrtime.bigint()-start)/1e6;
 const dir=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2170/independent'));fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'independent_cases.json'),JSON.stringify(report,null,2)+'\n');
 process.stdout.write(JSON.stringify({status:report.status,cases:report.caseCount,checks:report.checks,failures:report.failures,elapsedMilliseconds:report.elapsedMilliseconds})+'\n');if(report.failures.length)process.exitCode=1;
 return report;
}
if(require.main===module)run();
