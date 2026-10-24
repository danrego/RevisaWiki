'use strict';
// Current focused contracts run independently of the unchanged historical regression suite.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),args=Object.fromEntries(process.argv.slice(2).map(value=>{const at=value.indexOf('=');assert(value.startsWith('--')&&at>2,'Use --name=value');return[value.slice(2,at),value.slice(at+1)];}));
const dist=path.resolve(args.dist||path.join(root,'dist/2.21.0')),
 output=path.resolve(args.output||fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-221-focused-')));
fs.mkdirSync(output,{recursive:true});assert(!fs.existsSync(path.join(output,'SUMMARY.json')),'Use a new output directory');
const manifestFile=fs.existsSync(path.join(dist,'MANIFESTO_RUNTIME.json'))?path.join(dist,'MANIFESTO_RUNTIME.json'):path.join(root,'tests/expected_release_v2210.json'),
 manifestRaw=fs.readFileSync(manifestFile),
 manifest=JSON.parse(manifestRaw);assert.equal(manifest.version,'2.21.0');
const names=['RevisaWiki_v2_21_0.js','RevisaWiki_v2_21_0_completo.js','RevisaWiki_v2_21_0_dados.js'],runtimeDir=path.join(output,'runtime');fs.mkdirSync(runtimeDir);
const pins=names.map(file=>{const raw=fs.readFileSync(path.join(dist,file)),pin={file,bytes:raw.length,sha256:sha(raw)};assert.deepEqual({bytes:pin.bytes,sha256:pin.sha256},manifest.files[file]);fs.writeFileSync(path.join(runtimeDir,file),raw,{flag:'wx'});return pin;});
fs.writeFileSync(path.join(runtimeDir,'MANIFESTO_RUNTIME.json'),manifestRaw,{flag:'wx'});
const bundles=names.slice(0,2).map(name=>path.join(runtimeDir,name)),baseline=path.join(root,'dist/2.20.0/RevisaWiki_v2_20_0_completo.js'),dependencies=new Map();
function pinDirectory(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory()){if(entry.name!=='__pycache__')pinDirectory(file);}else if(/\.(?:js|cjs|json|txt)$/.test(entry.name))dependencies.set(file,sha(fs.readFileSync(file)));}}
pinDirectory(path.join(root,'src/v2_21'));pinDirectory(__dirname);dependencies.set(baseline,sha(fs.readFileSync(baseline)));
for(const [name,pin]of Object.entries(manifest.sourceInputs||{})){const file=path.join(root,name);assert.equal(sha(fs.readFileSync(file)),pin.sha256,'Focused source inputs match the selected build: '+name);dependencies.set(file,pin.sha256);}
const tasks=[],add=(id,file,argv=[],env={},scope='current-candidate-focused')=>tasks.push({id,file,argv,env,scope});
add('orchestrator-controls','legacy_orchestrator_cases.cjs',[],{},'test-infrastructure-controls');
add('build-formatting-controls','build_formatting.cjs',[],{},'token-and-program-preserving-packaging');
add('deadline-path-identity','deadline_path_identity.cjs',[],{},'test-infrastructure-controls');
add('structure-module','structure_repairs.cjs',[],{},'new-module-contracts-on-pinned-baseline');
add('complete-claims-map-controls','biography_claims_schema.cjs',[],{},'source-producer-and-consumer-shape-controls');
add('composition-prerequisites','composition_prerequisites.cjs',bundles);
add('count-rule-migration','legacy_count_migration.cjs',bundles);
add('apostrophe-conservative-boundaries','legacy_apos_migration.cjs',bundles);
add('group-attribute-quote-migration','legacy_reference_quote_migration.cjs',bundles);
for(let index=0;index<bundles.length;index++){
 const bundle=bundles[index],env={REVISAWIKI_V221_BUNDLE:bundle,REVISAWIKI_BUNDLE:bundle};
 for(const file of ['citation_contracts.cjs','citation_predicates.cjs','citation_writer_guards.cjs','citation_end_to_end.cjs','citation_editions.cjs','citation_collector_prerequisite.cjs','citation_collector_end_to_end.cjs','citation_collector_scope.cjs',
  'citation_ui_preflight.cjs','biography_cases.cjs','biography_whole_current.cjs','biography_ui_preflight.cjs','structure_ui_preflight.cjs','structure_candidate.cjs'])
  add((index?'full-':'core-')+file.replace(/\.cjs$/,''),file,[bundle],env);
 add((index?'full-':'core-')+'citation-context-producers','citation_contexts.cjs',[bundle,'--focused'],env,'candidate-new-producer-context-contracts-no-calculation');
 add((index?'full-':'core-')+'citation-context-whole','citation_contexts.cjs',[bundle],env,'candidate-whole-owner-contexts-with-native-reviewed-raw-endpoints');
}
if(args.metadata||args.plan){assert(args.metadata&&args.plan,'Both metadata and plan are required');add('stored-metadata-contract','citation_metadata_contract.cjs',[path.resolve(args.metadata),path.resolve(args.plan)]);for(let index=0;index<bundles.length;index++)add('stored-metadata-endpoint-'+index,'citation_metadata_end_to_end.cjs',[bundles[index],path.resolve(args.metadata),path.resolve(args.plan)]);}
const selected=args.tasks?tasks.filter(task=>args.tasks.split(',').includes(task.id)):tasks;
if(args.tasks){const wanted=args.tasks.split(',');assert(wanted.length===new Set(wanted).size&&selected.length===wanted.length,'Known unique focused task names');}assert(selected.length);
const report={kind:'current-focused-221-validation',version:'2.21.0',status:'passed',complete:false,manifestSha256:sha(manifestRaw),runtime:pins,
 runnerSha256:sha(fs.readFileSync(__filename)),dependencyPins:Object.fromEntries([...dependencies].map(([file,pin])=>[path.relative(root,file),pin])),
 startedUTC:new Date().toISOString(),tasks:[],deadlineMilliseconds:60000,suiteBudgetMilliseconds:14400000,
 availableTaskCount:tasks.length,selectedTasks:selected.map(task=>task.id),completeFocusedScope:selected.length===tasks.length,
 historicalRegressionExecuted:false,knownTimeoutArticlesExecuted:0,wikipediaWrites:0,networkRequests:0,
 excludedIndependentCampaigns:['real-article corpus','native parser rendering','real browser UI','unchanged historical regression'],
 limits:['Bounded synthetic fixtures and local transport mocks are distinct from real-article, native and browser evidence.','Historical failures stay failed; supplied dispositions are checked separately and receive no automatic-fix credit.']};
function parseResult(raw){try{return JSON.parse(raw);}catch(_){for(const line of raw.trim().split(/\r?\n/).reverse())try{return JSON.parse(line);}catch(_){}return null;}}
for(const task of selected){
 const file=path.join(__dirname,task.file),stdout=path.join(output,task.id+'.stdout.json'),stderr=path.join(output,task.id+'.stderr.txt'),deadline=path.join(output,task.id+'.deadline.json'),out=fs.openSync(stdout,'wx'),err=fs.openSync(stderr,'wx'),began=performance.now();let child;
 try{child=cp.spawnSync(process.execPath,['--require',path.join(__dirname,'legacy_calculation_deadline.cjs'),file,...task.argv],{cwd:root,
  env:{...process.env,...task.env,REVISAWIKI_DEADLINE_FILES:JSON.stringify([...bundles,baseline]),REVISAWIKI_DEADLINE_RECEIPT:deadline,
   REVISAWIKI_BIO_REPORT:path.join(output,task.id+'.bio-contracts.json'),REVISAWIKI_BIO_WHOLE_REPORT:path.join(output,task.id+'.bio-whole.json')},
  stdio:['ignore',out,err],timeout:14400000});}finally{fs.closeSync(out);fs.closeSync(err);}
 const parsed=parseResult(fs.readFileSync(stdout,'utf8')),timing=fs.existsSync(deadline)?JSON.parse(fs.readFileSync(deadline)):null,
  row={id:task.id,scope:task.scope,runnerSha256:sha(fs.readFileSync(file)),milliseconds:performance.now()-began,exitCode:child.status,signal:child.signal,
   stdoutSha256:sha(fs.readFileSync(stdout)),stderrSha256:sha(fs.readFileSync(stderr)),status:'passed',checks:Number(parsed?.checks||parsed?.assertions||0),
   deadlineReceiptSha256:timing?sha(fs.readFileSync(deadline)):null,
   calculationCalls:timing?.records?.reduce((n,value)=>n+value.calls,0)||0,calculationTimeouts:timing?.records?.reduce((n,value)=>n+value.timeouts,0)||0};
 if(child.status!==0||child.error||!parsed||parsed.status&&parsed.status!=='passed'||parsed.result&&parsed.result!=='passed'||parsed.failures?.length||!timing||timing.networkAttempts||row.calculationTimeouts){row.status='failed';row.reason=child.error?.code||'Focused task, offline guard or deadline did not pass';report.status='failed';}
 report.tasks.push(row);fs.writeFileSync(path.join(output,'PROGRESS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({task:row.id,status:row.status,checks:row.checks}));
}
if(args.dispositions){try{report.dispositions=require('./legacy_disposition_reader.cjs').readReviewedDispositions(args.dispositions,{runtimePins:pins});}catch(error){report.status='failed';report.dispositions={status:'failed',message:error.message};}}
else report.dispositions={status:'not-requested',historicalFailuresNotConverted:true};
for(const [file,pin]of dependencies)if(sha(fs.readFileSync(file))!==pin){report.status='failed';report.sourceDrift=true;}
for(const pin of pins)if(sha(fs.readFileSync(path.join(runtimeDir,pin.file)))!==pin.sha256){report.status='failed';report.runtimeDrift=true;}
report.complete=true;report.finishedUTC=new Date().toISOString();report.taskCount=report.tasks.length;report.failedTasks=report.tasks.filter(row=>row.status!=='passed').length;
fs.writeFileSync(path.join(output,'SUMMARY.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,tasks:report.taskCount,failed:report.failedTasks,knownTimeoutArticlesExecuted:0}));if(report.status!=='passed')process.exitCode=1;
