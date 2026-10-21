'use strict';
// Every API invocation retains a 60 s deadline. Streaming receipts change
// storage only; no product stage or preservation check is omitted.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),zlib=require('node:zlib');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),args=Object.fromEntries(process.argv.slice(2).map(x=>{const[k,...r]=x.replace(/^--/,'').split('=');return[k,r.join('=')];}));
if(args.child==='1'){
 let networkAttempts=0;global.fetch=()=>{networkAttempts++;throw Error('Network disabled');};global.XMLHttpRequest=class{constructor(){networkAttempts++;throw Error('Network disabled');}};
 const engines={core:require(args.core),complete:require(args.complete)};
 process.on('message',job=>{const began=performance.now();try{const api=engines[job.bundle];let value;
  if(job.method==='calculate'){const r=api.calculate({kind:'adjust',source:job.source,originalSource:job.source,options:job.options});value={text:r.text,preservation:r.preservation,minorCheck:r.minorCheck,automaticResultSafety:api.v219AutomaticResultSafety(job.source,r),localCompositionAccepted:r.localCompositionSafety?.accepted,changeIds:(r.changes||[]).map(c=>[c.id,c.count]),version:api.version};}
  else if(job.method==='preservationAudit')value=api.preservationAudit(job.source,job.target,job.options);
  else if(job.method==='safeComposition')value=api.safeComposition(job.source,job.target,job.options);
  else throw Error('Unknown actual API method');
  process.send({id:job.id,ok:true,value,milliseconds:performance.now()-began,networkAttempts});
 }catch(error){process.send({id:job.id,ok:false,error:String(error.stack),milliseconds:performance.now()-began,networkAttempts});}});
 process.send({ready:true,defaults:engines.core.defaults});
}else (async()=>{
 const output=path.resolve(args.output),manifestFile=path.resolve(args.manifest),manifestRaw=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestRaw),sourceRoot=path.dirname(manifestFile),workers=Math.min(12,Math.max(1,Number(args.workers)||1));
 if(fs.existsSync(output))throw Error('A fresh output directory is required');
 const eligible=manifest.pages.filter(r=>r.namespace===0&&!r.missing&&r.file&&r.revid&&(!r.contentModel||r.contentModel==='wikitext')),ids=args.ids?new Set(args.ids.split(',').map(Number)):null;
 const selectedRows=eligible.filter(r=>(!ids||ids.has(r.pageid))&&(!args['max-bytes']||r.bytes<Number(args['max-bytes']))&&(!args['min-bytes']||r.bytes>=Number(args['min-bytes']))),rows=args.limit?selectedRows.slice(0,Number(args.limit)):selectedRows;
 if(rows.some(r=>r.bytes>=1800000))throw Error('The excluded known-extreme size scope cannot be repeated by this runner');
 if(!rows.length||new Set(rows.map(r=>r.pageid)).size!==rows.length)throw Error('No unique captured source selection');
 const snapshot=path.join(output,'runtime');for(const folder of [snapshot,path.join(output,'pages'),path.join(output,'core_transformed')])fs.mkdirSync(folder,{recursive:true});
 const originalFiles={core:path.resolve(args.core),complete:path.resolve(args.complete)},files={},pins={},hashes={};originalFiles.coreData=originalFiles.core.replace(/\.js$/,'_dados.js');
 for(const [key,file]of Object.entries(originalFiles)){const raw=fs.readFileSync(file),dest=path.join(snapshot,path.basename(file));fs.writeFileSync(dest,raw);files[key]=dest;pins[key]={sha256:sha(raw),bytes:raw.length};hashes[key]=sha(raw);}
 const report={kind:'streamed-per-api-deadline-corpus',status:'running',candidateFindingsDoNotProveEditorMutation:true,runtime:pins,manifestSha256:sha(manifestRaw),runnerSha256:sha(fs.readFileSync(__filename)),apiDeadlineMilliseconds:60000,previousResultsReclassified:false,uiMinorPreference:true,knownExtremeRepeated:false,wikipediaWrites:0,networkRequests:0,plannedPages:rows.length,completedPages:0,passedPages:0,failedPages:0,timeoutPages:0,changedPages:0,completedApiCalls:0,failedApiCalls:0,safelyRefusedPages:0,acceptedPages:0,acceptanceProtocolFailures:0,failureObligations:0,sourceBytes:0,workers,sourceSelectionSha256:sha(JSON.stringify(rows.map(r=>[r.pageid,r.revid,r.sha256]))),selection:{limit:args.limit?Number(args.limit):null,minimumBytes:Number(args['min-bytes'])||0,maximumBytesExclusive:Number(args['max-bytes'])||null},startedUTC:new Date().toISOString()};
 const runReceipt={settings:{...files,hashes,runnerSha256:report.runnerSha256},sourceManifestSha256:sha(manifestRaw),selected:rows.map(r=>[r.pageid,r.revid,r.sha256]),apiDeadlineMilliseconds:60000,uiMinorPreference:true,wikipediaWrites:0};fs.writeFileSync(path.join(output,'RUN_PRIVATE.json'),JSON.stringify(runReceipt,null,2)+'\n');
 const save=()=>fs.writeFileSync(path.join(output,'PROGRESS.json'),JSON.stringify(report,null,2)+'\n');save();const pending=rows.slice().sort((a,b)=>a.bytes-b.bytes),completed=new Set();let sequence=0;
 async function worker(){let child,ready,defaults,waiting;
  function start(){ready=new Promise((resolve,reject)=>{const owned=child=cp.fork(__filename,['--child=1','--core='+files.core,'--complete='+files.complete],{stdio:['ignore','ignore','ignore','ipc']});let booted=false;const bootstrapTimer=setTimeout(()=>{owned.kill('SIGKILL');reject(Error('Local test worker bootstrap did not complete'));},30000);
   owned.on('message',message=>{if(message.ready){booted=true;clearTimeout(bootstrapTimer);defaults=message.defaults;resolve();}else if(waiting&&waiting.owner===owned&&message.id===waiting.id){const current=waiting;waiting=null;clearTimeout(current.timer);current.resolve(message);}});
   owned.on('error',error=>{clearTimeout(bootstrapTimer);reject(error);});owned.on('exit',(code,signal)=>{if(!booted){clearTimeout(bootstrapTimer);reject(Error('Local test worker exited before readiness'));}if(waiting?.owner===owned){const current=waiting;waiting=null;clearTimeout(current.timer);current.resolve({ok:false,error:'Worker exited '+code+'/'+signal});}});
  });return ready;}
  async function invoke(job){await ready;const id=++sequence;return new Promise(resolve=>{const owner=child,timer=setTimeout(()=>{if(waiting?.id===id)waiting=null;owner.kill('SIGKILL');resolve({ok:false,timeout:true,error:'Individual API call reached 60000 ms',milliseconds:60000});},60000);waiting={id,owner,timer,resolve};owner.send({...job,id});});}
  await start();let jobs=0;
  while(pending.length){const row=pending.shift(),capture=row.pageid+'_'+row.revid,result={pageid:row.pageid,revid:row.revid,sourceSha256:row.sha256,status:'passed',calls:[],failures:[],sourceVerified:false};let source,coreEndpoint,fullEndpoint;
   try{const file=path.resolve(sourceRoot,row.file);if(!file.startsWith(sourceRoot+path.sep))throw Error('Captured source leaves its root');const packed=fs.readFileSync(file),raw=zlib.gunzipSync(packed);source=raw.toString();if(sha(raw)!==row.sha256||raw.length!==row.bytes||row.gzipSha256&&sha(packed)!==row.gzipSha256||!Buffer.from(source).equals(raw))throw Error('Captured source binding changed');result.sourceVerified=true;
    const options={...defaults,namespaceNumber:0,pageTitle:row.title,contentModel:row.contentModel||'wikitext',autoPreview:false,minorAllToolChanges:true,minorBaseConfirmed:true};result.optionsSha256=sha(JSON.stringify(options));
    for(const bundle of ['core','complete']){let first;for(const method of ['calculate','idempotence','preservationAudit','safeComposition']){const response=await invoke({bundle,method:method==='idempotence'?'calculate':method,source:method==='idempotence'?first.text:source,target:first?.text,options});const call={bundle,method,ok:response.ok,timeout:!!response.timeout,milliseconds:response.milliseconds,error:response.error};result.calls.push(call);report.completedApiCalls++;report.networkRequests+=Number(response.networkAttempts||0);if(!response.ok){report.failedApiCalls++;result.failures.push({bundle,method,error:response.error});if(response.timeout)await start();break;}
      const value=response.value;if(method==='calculate'){first=value;if(typeof value.text!=='string')throw Error('Actual action has no text');if(bundle==='core')coreEndpoint=value.text;else fullEndpoint=value.text;if(value.preservation?.length)result.failures.push({bundle,method,details:value.preservation});result[bundle]={changed:value.text!==source,version:value.version,minorCheck:value.minorCheck,automaticResultSafety:value.automaticResultSafety,localCompositionAccepted:value.localCompositionAccepted,changeIds:value.changeIds};}
      else if(method==='idempotence'&&value.text!==first.text)result.failures.push({bundle,method,details:'Second actual action changed the endpoint'});
      else if(method==='preservationAudit'&&value.length)result.failures.push({bundle,method,details:value});
      else if(method==='safeComposition'&&value!=='')result.failures.push({bundle,method,details:value});
      if(response.networkAttempts)result.failures.push({bundle,method,details:'Blocked network attempt'});
    }}
    if(typeof coreEndpoint==='string'&&typeof fullEndpoint==='string'&&coreEndpoint!==fullEndpoint)result.failures.push({method:'distribution-parity'});
    if(typeof coreEndpoint==='string'){const raw=Buffer.from(coreEndpoint),packed=zlib.gzipSync(raw),file='core_transformed/'+capture+'.wiki.gz';fs.writeFileSync(path.join(output,file),packed);result.output={file,bytes:raw.length,sha256:sha(raw),gzipSha256:sha(packed),actualCoreVersion:result.core.version,actualCompleteVersion:result.complete?.version??null};}
   }catch(error){result.failures.push({method:'capture-or-controller',error:String(error.stack)});}
   result.candidateStatus=result.failures.length?'failed':'passed';
   const gates=['core','complete'].map(bundle=>result[bundle]?.automaticResultSafety),refused=gates.length===2&&gates.every(gate=>gate?.accepted===false),accepted=gates.every(gate=>gate?.accepted===true),transport=result.calls.some(call=>!call.ok);
   if(refused&&!transport&&typeof coreEndpoint==='string'&&coreEndpoint===fullEndpoint){result.status='safely-refused-by-production-gate';report.safelyRefusedPages++;}
   else if(result.failures.length||!accepted){result.status='failed';report.failedPages++;report.acceptanceProtocolFailures+=Number(!transport&&!accepted);}
   else{report.passedPages++;report.acceptedPages++;}
   report.failureObligations+=result.failures.length;
   report.timeoutPages+=Number(result.calls.some(r=>r.timeout));report.changedPages+=Number(typeof coreEndpoint==='string'&&coreEndpoint!==source);report.sourceBytes+=row.bytes;report.completedPages++;if(completed.has(capture))throw Error('Duplicate completed capture');completed.add(capture);
   fs.writeFileSync(path.join(output,'pages',capture+'.json'),JSON.stringify(result)+'\n');fs.appendFileSync(path.join(output,'rows.jsonl'),JSON.stringify({pageid:row.pageid,revid:row.revid,status:result.status,candidateStatus:result.candidateStatus,sourceSha256:row.sha256,outputSha256:result.output?.sha256,timeout:result.calls.some(r=>r.timeout)})+'\n');if(result.failures.length)fs.appendFileSync(path.join(output,'FAILURES_PRIVATE.jsonl'),JSON.stringify(result)+'\n');save();if(report.completedPages%100===0)console.log(JSON.stringify({completed:report.completedPages,planned:rows.length,failed:report.failedPages,timeouts:report.timeoutPages}));
   if(++jobs%100===0&&pending.length){child.disconnect();await start();}
  }
  child.disconnect();
 }
 await Promise.all(Array.from({length:Math.min(workers,rows.length)},worker));
 for(const [key,file]of Object.entries(files))if(sha(fs.readFileSync(file))!==hashes[key])throw Error('Runtime snapshot changed');if(sha(fs.readFileSync(manifestFile))!==report.manifestSha256||sha(fs.readFileSync(__filename))!==report.runnerSha256)throw Error('An input changed during the campaign');
 if(report.completedPages!==rows.length||completed.size!==rows.length)throw Error('Incomplete actual source coverage');report.status=report.failedPages?'failed':report.safelyRefusedPages?'completed-with-safe-refusals':'passed';report.finishedUTC=new Date().toISOString();save();fs.writeFileSync(path.join(output,'RESULT.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.failedPages)process.exitCode=1;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
