'use strict';
// Local corpus regression. Source captures and detailed results stay in an
// explicitly supplied private directory. Console output is aggregate only.
// --shards accepts 1 to 12 local workers; each uses immutable runtime snapshots.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),cp=require('node:child_process');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...rest]=value.replace(/^--/,'').split('=');return[key,rest.join('=')];}));
const ensure=(condition,message)=>{if(!condition)throw new Error(message);};
const digest=file=>sha(fs.readFileSync(file));
function difference(before,after){let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;let end=0;while(end<before.length-start&&end<after.length-start&&before[before.length-end-1]===after[after.length-end-1])end++;return {start,before:before.slice(start,before.length-end),after:after.slice(start,after.length-end)};}
function privateName(row){return String(row.pageid)+'_'+String(row.revid||0);}
function loadRuntime(file,expected){ensure(digest(file)===expected,'Runtime changed during the corpus run');const api=require(file);ensure(typeof api.calculate==='function','Runtime has no complete transformation API');return api;}
function sourceFile(manifestFile,row){const root=path.dirname(manifestFile),file=path.resolve(root,row.file);ensure(file.startsWith(root+path.sep),'Captured source path leaves the supplied corpus');return file;}
function candidateBiography(api,source,cfg){
 let confirmed=false;try{const evidence=api.biographyDetection(source,cfg);confirmed=!!evidence&&typeof evidence.infobox==='string'&&!!evidence.infobox&&evidence.eligible!==false;}catch{}
 const categories=/\[\[\s*Categoria\s*:\s*(?:Nascidos em\s+\d|Mortos em\s+\d|Pessoas vivas\s*(?:\||\]\]))/i.test(source);
 return {confirmed,candidate:confirmed||categories};
}
function inspect(api,source,row){
 const cfg={...api.defaults,namespaceNumber:row.namespace,pageTitle:row.title,contentModel:row.contentModel||'wikitext',autoPreview:false},failures=[],started=Date.now();
 const add=(check,details)=>failures.push({check,details,fingerprint:sha(JSON.stringify([check,details]))});
 let first,second,checks=0;
 checks++;try{first=api.calculate({kind:'adjust',source,options:cfg});}catch(error){add('calculate-exception',{message:String(error.message)});return {failures,checks,milliseconds:Date.now()-started};}
 checks++;if(typeof first?.text!=='string'){add('text-endpoint',{type:typeof first?.text});return {failures,checks,milliseconds:Date.now()-started};}
 checks++;try{second=api.calculate({kind:'adjust',source:first.text,options:cfg});if(second.text!==first.text){const delta=difference(first.text,second.text);add('idempotence',{removed:delta.before,added:delta.after});}}catch(error){add('second-pass-exception',{message:String(error.message)});}
 checks++;try{const value=api.preservationAudit(source,first.text,cfg);if(value.length)add('preservation-audit',value);}catch(error){add('preservation-exception',{message:String(error.message)});}
 checks++;try{const value=api.safeComposition(source,first.text,cfg);if(value)add('safe-composition',value);}catch(error){add('composition-exception',{message:String(error.message)});}
 checks++;if(first.preservation?.length)add('pipeline-preservation',first.preservation);
 return {failures,checks,milliseconds:Date.now()-started,text:first.text,textSha256:sha(first.text),bytes:Buffer.byteLength(first.text),changed:first.text!==source,
  changes:first.changes,audit:first.audit,notApplied:first.notApplied,biography:candidateBiography(api,source,cfg)};
}
if(args.worker==='1'){
 let networkAttempts=0;global.fetch=()=>{networkAttempts++;throw new Error('Network access is disabled in the local corpus runner');};
 global.XMLHttpRequest=class{constructor(){networkAttempts++;throw new Error('Network access is disabled in the local corpus runner');}};
 const settings=JSON.parse(Buffer.from(args.settings,'base64').toString());ensure(digest(__filename)===settings.runnerSha256,'Corpus runner changed during the run');const core=loadRuntime(settings.core,settings.hashes.core),complete=loadRuntime(settings.complete,settings.hashes.complete);
 let baseline,baselineComplete,jobs=0;
 process.on('message',message=>{
  if(message.type!=='job')return;
  const row=message.row,start=Date.now();process.send({type:'started',index:message.index});
  let result={index:message.index,pageid:row.pageid,revid:row.revid,title:row.title,namespace:row.namespace,sourceSha256:row.sha256,failures:[]};
  try{
   const file=sourceFile(settings.manifest,row),packed=fs.readFileSync(file),bytes=zlib.gunzipSync(packed),source=bytes.toString('utf8');
   ensure(sha(bytes)===row.sha256,'Stored revision SHA-256 mismatch');ensure(bytes.length===row.bytes,'Stored revision byte-count mismatch');
   if(row.gzipSha256)ensure(sha(packed)===row.gzipSha256,'Compressed revision SHA-256 mismatch');
   ensure(Buffer.from(source).equals(bytes),'Stored revision is not exact UTF-8');
   const first=inspect(core,source,row),second=inspect(complete,source,row);result.sourceVerified=true;
   result.checks=3+Number(!!row.gzipSha256)+first.checks+second.checks+1;
   result.core=first;result.complete=second;result.biography=first.biography||{confirmed:false,candidate:false};
   result.failures.push(...first.failures.map(f=>({...f,bundle:'core'})),...second.failures.map(f=>({...f,bundle:'complete'})));
   if(first.text!==second.text){const delta=difference(first.text||'',second.text||'');result.failures.push({check:'modular-full-parity',details:delta,fingerprint:sha(JSON.stringify(['modular-full-parity',delta.before,delta.after]))});}
   if(networkAttempts)result.failures.push({check:'network-attempt',details:{count:networkAttempts},fingerprint:'network-attempt'});
   if(result.failures.length&&settings.baseline&&settings.baselineComplete){
    baseline||=loadRuntime(settings.baseline,settings.hashes.baseline);baselineComplete||=loadRuntime(settings.baselineComplete,settings.hashes.baselineComplete);
    const oldCore=inspect(baseline,source,row),oldComplete=inspect(baselineComplete,source,row),oldFailures=[...oldCore.failures.map(f=>({...f,bundle:'core'})),...oldComplete.failures.map(f=>({...f,bundle:'complete'}))];
    if(oldCore.text!==oldComplete.text){const delta=difference(oldCore.text||'',oldComplete.text||'');oldFailures.push({check:'modular-full-parity',details:delta,fingerprint:sha(JSON.stringify(['modular-full-parity',delta.before,delta.after]))});}
    result.baseline={core:{...oldCore,text:undefined},complete:{...oldComplete,text:undefined},failures:oldFailures};
    for(const failure of result.failures){const exact=oldFailures.some(old=>old.check===failure.check&&old.bundle===failure.bundle&&old.fingerprint===failure.fingerprint),sameCheck=oldFailures.some(old=>old.check===failure.check&&old.bundle===failure.bundle);failure.classification=exact?'preexisting-exact':sameCheck?'baseline-also-fails-different-evidence':'new';}
   }else for(const failure of result.failures)failure.classification='new';
   if(result.failures.length){
    fs.writeFileSync(path.join(settings.output,'failures',privateName(row)+'.json'),JSON.stringify({...result,source,core:{...first,text:first.text},complete:{...second,text:second.text}},null,2)+'\n');
   }
   delete first.text;delete second.text;
  }catch(error){result.failures.push({check:'capture-or-run-exception',details:{message:String(error.message)},classification:'new'});fs.writeFileSync(path.join(settings.output,'failures',privateName(row)+'.json'),JSON.stringify(result,null,2)+'\n');}
  result.milliseconds=Date.now()-start;result.networkRequests=networkAttempts;
  fs.writeFileSync(path.join(settings.output,'pages',privateName(row)+'.json'),JSON.stringify(result)+'\n');
  process.send({type:'done',index:message.index,verified:result.sourceVerified===true,changed:result.core?.changed||false,biography:result.biography,
   failures:result.failures.map(f=>({check:f.check,classification:f.classification})),milliseconds:result.milliseconds,bytes:row.bytes||0,checks:result.checks||1,networkRequests:networkAttempts},()=>{if(++jobs>=75)process.exit(0);else process.send({type:'ready'});});
 });
 process.send({type:'ready'});
}else{
 (async()=>{
  ensure(args.manifest&&args.output&&args.core&&args.complete,'Supply --manifest, --output, --core and --complete explicitly');
  const manifestFile=path.resolve(args.manifest),manifestRaw=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestRaw),output=path.resolve(args.output),phase=args.phase||'preliminary';
  ensure(Array.isArray(manifest.pages),'The supplied manifest has no page capture list');ensure(manifest.historyComplete===true&&manifest.complete===true,'The source collection has not finished');
  ensure(!fs.existsSync(path.join(output,'SUMMARY.json')),'Use a fresh output directory for a reproducible run');
  const settings={manifest:manifestFile,output,core:path.resolve(args.core),complete:path.resolve(args.complete),baseline:args.baseline?path.resolve(args.baseline):null,baselineComplete:args['baseline-complete']?path.resolve(args['baseline-complete']):null,runnerSha256:digest(__filename),hashes:{}};
  for(const name of ['core','complete','baseline','baselineComplete'])if(settings[name])settings.hashes[name]=digest(settings[name]);
  if(phase==='final'){ensure(args['core-sha']&&args['complete-sha'],'A final run requires both frozen runtime SHA-256 values');ensure(settings.hashes.core===args['core-sha']&&settings.hashes.complete===args['complete-sha'],'Frozen runtime SHA-256 does not match');}
  const origins={};
  for(const name of ['core','complete','baseline','baselineComplete'])if(settings[name]){
   const group=name.startsWith('baseline')?'baseline':'current',directory=path.join(output,'runtime_snapshots',group);fs.mkdirSync(directory,{recursive:true});
   const original=settings[name],target=path.join(directory,path.basename(original));origins[name]=original;fs.copyFileSync(original,target);settings[name]=target;
   if(name==='core'||name==='baseline'){
    const data=original.replace(/\.js$/,'_dados.js');
    if(fs.existsSync(data)){const key=name+'Data';origins[key]=data;settings.hashes[key]=digest(data);fs.copyFileSync(data,path.join(directory,path.basename(data)));}
   }
  }
  const eligible=manifest.pages.filter(row=>row.namespace===0&&!row.missing&&row.file&&row.revid&&(!row.contentModel||row.contentModel==='wikitext'));
  const rows=args.limit?eligible.slice(0,Number(args.limit)):eligible,skipped=manifest.pages.length-eligible.length;
  ensure(new Set(eligible.map(row=>row.pageid)).size===eligible.length,'The source manifest contains duplicate accessible page identifiers');
  fs.mkdirSync(path.join(output,'pages'),{recursive:true});fs.mkdirSync(path.join(output,'failures'),{recursive:true});
  const report={version:'2.15.1',kind:'private-exhaustive-historical-page-corpus',phase,status:'running',corpusSha256:sha(manifestRaw),runnerSha256:settings.runnerSha256,runtimeSha256:settings.hashes,
   sourceHistoryComplete:manifest.historyComplete,sourceCollectionComplete:manifest.complete,failedCaptureEntries:Array.isArray(manifest.failed)?manifest.failed.length:0,historicalContributionEntries:manifest.historyEntries,historicalPageids:manifest.uniqueHistoricalPageids,
   manifestPages:manifest.pages.length,eligiblePages:eligible.length,excludedMissingOrOtherNamespaceOrModel:skipped,plannedPages:rows.length,completedPages:0,verifiedSourcePages:0,
   biographyBoxesConfirmed:0,biographicalCategoryCandidates:0,changedPages:0,sourceBytes:0,failures:0,newFailures:0,preexistingExactFailures:0,baselineAlsoFailsDifferentEvidence:0,
   timeoutPages:0,checks:0,networkRequests:0,wikipediaWrites:0,byCheck:{},startedUTC:new Date().toISOString(),elapsedMilliseconds:0};
  const started=Date.now(),shards=Math.max(1,Math.min(12,Number(args.shards)||4)),workers=new Set(),completed=new Set(),queue=rows.map((row,index)=>({row,index})).sort((a,b)=>(b.row.bytes||0)-(a.row.bytes||0));
  report.parallelWorkers=shards;
  fs.writeFileSync(path.join(output,'RUN_PRIVATE.json'),JSON.stringify({settings,origins,manifestSha256:report.corpusSha256,planned:rows.map(row=>({pageid:row.pageid,revid:row.revid,sha256:row.sha256}))},null,2)+'\n');
  const save=()=>{report.elapsedMilliseconds=Date.now()-started;fs.writeFileSync(path.join(output,'PROGRESS.json'),JSON.stringify(report,null,2)+'\n');};
  const account=result=>{
   if(completed.has(result.index))return;completed.add(result.index);report.completedPages++;report.verifiedSourcePages+=Number(result.verified);report.changedPages+=Number(result.changed);report.sourceBytes+=result.bytes||0;
   report.biographyBoxesConfirmed+=Number(result.biography?.confirmed||false);report.biographicalCategoryCandidates+=Number(result.biography?.candidate||false);report.networkRequests+=result.networkRequests||0;report.checks+=result.checks||1;
   for(const failure of result.failures||[]){report.failures++;report.byCheck[failure.check]=(report.byCheck[failure.check]||0)+1;if(failure.classification==='preexisting-exact')report.preexistingExactFailures++;else if(failure.classification==='baseline-also-fails-different-evidence')report.baselineAlsoFailsDifferentEvidence++;else report.newFailures++;}
   save();if(report.completedPages%50===0||report.completedPages===rows.length)console.log(JSON.stringify({phase,completed:report.completedPages,planned:rows.length,newFailures:report.newFailures,preexistingExactFailures:report.preexistingExactFailures,elapsedSeconds:Math.round(report.elapsedMilliseconds/1000)}));
  };
  await new Promise(resolve=>{
   let fatalInitialization=false;
   const maybeDone=()=>{if((completed.size===rows.length||fatalInitialization)&&workers.size===0)resolve();};
   const spawn=()=>{
    if(!queue.length){maybeDone();return;}
    const child=cp.fork(__filename,['--worker=1','--settings='+Buffer.from(JSON.stringify(settings)).toString('base64')],{stdio:['ignore','ignore','pipe','ipc']});
    const state={child,job:null,began:Date.now(),stderr:''};workers.add(state);
    child.stderr.on('data',chunk=>{state.stderr=(state.stderr+chunk).slice(-20000);});
    child.on('message',message=>{
     if(message.type==='ready'){if(queue.length){state.job=queue.shift();state.began=Date.now();child.send({type:'job',...state.job});}else child.disconnect();}
     else if(message.type==='started')state.began=Date.now();
     else if(message.type==='done'){account(message);state.job=null;}
    });
    child.on('exit',(code,signal)=>{
     workers.delete(state);
     if(!state.job&&code&&queue.length){fatalInitialization=true;queue.splice(0);report.newFailures++;report.failures++;report.byCheck['worker-initialization']=(report.byCheck['worker-initialization']||0)+1;fs.writeFileSync(path.join(output,'WORKER_INITIALIZATION_PRIVATE.json'),JSON.stringify({code,signal,stderr:state.stderr},null,2)+'\n');for(const other of workers)other.child.kill('SIGTERM');}
     if(state.job&&!completed.has(state.job.index)){
      const result={index:state.job.index,pageid:state.job.row.pageid,revid:state.job.row.revid,title:state.job.row.title,verified:false,bytes:0,failures:[{check:state.timeout?'page-timeout':'worker-exit',classification:'new',details:{code,signal,stderr:state.stderr}}]};
      fs.writeFileSync(path.join(output,'failures',privateName(state.job.row)+'.json'),JSON.stringify(result,null,2)+'\n');account(result);
     }
     if(queue.length)spawn();else maybeDone();
    });
   };
   const monitor=setInterval(()=>{
    for(const state of workers)if(state.job&&Date.now()-state.began>Math.max(60000,Number(args['timeout-ms'])||240000)){state.timeout=true;report.timeoutPages++;state.child.kill('SIGKILL');}
    save();if(completed.size===rows.length&&!workers.size){clearInterval(monitor);resolve();}
   },5000);monitor.unref();
   for(let i=0;i<Math.min(shards,rows.length);i++)spawn();if(!rows.length)resolve();
  });
  for(const [name,original] of Object.entries(origins))if(digest(original)!==settings.hashes[name]){report.newFailures++;report.failures++;report.byCheck['runtime-mutated']=(report.byCheck['runtime-mutated']||0)+1;}
  if(digest(__filename)!==settings.runnerSha256){report.newFailures++;report.failures++;report.byCheck['runner-mutated']=1;}
  if(digest(manifestFile)!==report.corpusSha256){report.newFailures++;report.failures++;report.byCheck['manifest-mutated']=1;}
  if(report.completedPages!==report.plannedPages){report.newFailures++;report.failures++;report.byCheck['incomplete-run']=1;}
  report.status=report.newFailures||report.baselineAlsoFailsDifferentEvidence?'failed':report.preexistingExactFailures?'passed-with-preexisting-findings':'passed';
  report.finishedUTC=new Date().toISOString();save();fs.writeFileSync(path.join(output,'SUMMARY.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status==='failed')process.exitCode=1;
 })().catch(error=>{console.error(String(error.message));process.exitCode=1;});
}
