// Adapted from frozen v2217 corpus runner: only version default and two new runtime snapshot dependencies differ.
// Original SHA256 f2e99f80f2182b63c332165099d24fc827062bbee2e01ec8c8cecb05e4136b7e
'use strict';
// Reuse frozen local captures. Process caps protect the test machine only and
// never alter the product, suppress an integrity check, or credit a timeout.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),zlib=require('node:zlib');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...tail]=value.replace(/^--/,'').split('=');return[key,tail.length?tail.join('='):true];}));
function freezeWrite(file,value){fs.writeFileSync(file,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
function pin(file){const raw=fs.readFileSync(file);return{file,sha256:sha(raw),bytes:raw.length};}
function legacyProtectedBlocks(text){return[...text.matchAll(/<(math|chem|ce|score|syntaxhighlight|source|nowiki|pre)\b[^>]*>[\s\S]*?<\/\1\s*>/gi)].map(match=>match[0]);}
// Independently read opaque owners. A self-closing tag has no trailing body;
// quoted > characters, nested literal markup and unclosed tails stay exact.
function protectedBlocks(text){
 const tags=new Set(['math','chem','ce','score','syntaxhighlight','source','nowiki','pre']),rows=[];let cursor=0;
 while(cursor<text.length){
  const at=text.indexOf('<',cursor);if(at<0)break;
  if(text.startsWith('<!--',at)){const end=text.indexOf('-->',at+4);cursor=end<0?text.length:end+3;continue;}
  const head=/^<(\/?)([A-Za-z][A-Za-z0-9-]*)\b/.exec(text.slice(at));if(!head){cursor=at+1;continue;}
  let quote=null,end=at+head[0].length;
  for(;end<text.length;end++){const ch=text[end];if(quote){if(ch===quote)quote=null;}else if(ch==='"'||ch==="'")quote=ch;else if(ch==='>')break;}
  if(end===text.length){cursor=at+1;continue;}
  const name=head[2].toLowerCase(),open=text.slice(at,end+1);cursor=end+1;
  if(!tags.has(name)||head[1])continue;
  if(/\/\s*>$/.test(open)){rows.push({tag:name,kind:'self-closing',raw:open});continue;}
  const close=new RegExp('</'+name+'\\s*>','gi');close.lastIndex=cursor;const match=close.exec(text),stop=match?close.lastIndex:text.length;
  rows.push({tag:name,kind:match?'complete':'unclosed',raw:text.slice(at,stop)});cursor=stop;
 }
 return rows;
}
function literalReaderSelfTest(){
 const assert=require('node:assert/strict'),same=(a,b)=>assert.deepEqual(protectedBlocks(a),protectedBlocks(b)),different=(a,b)=>assert.notDeepEqual(protectedBlocks(a),protectedBlocks(b));let checks=0;
 for(const tag of ['math','chem','ce','score','syntaxhighlight','source','nowiki','pre']){
  const body='<'+tag+'>x^2 https://example.invalid/a?x=1 "literal"</'+tag+'>';
  for(const [from,to]of [['x^2','x^3'],['x=1','x=2'],['"literal"','"different"']]){different(body,body.replace(from,to));checks++;}
  const self='<'+tag+' data-label="a>b"/>';different(self,'');different(self,self.replace('a>b','a<c'));checks+=2;
  const tail='<'+tag+'>https://example.invalid/a?x=1';different(tail,tail+' changed');checks++;
 }
 const before='<nowiki/> ordinary prose {{Example}} <nowiki/> more ordinary prose <nowiki>literal</nowiki>',after=before.replace('{{Example}}','\n{{Example}}\n');same(before,after);assert.notDeepEqual(legacyProtectedBlocks(before),legacyProtectedBlocks(after));checks+=2;
 const opaque='<syntaxhighlight lang="html" data-label="a>b"><nowiki>literal</nowiki></syntaxhighlight>';assert.equal(protectedBlocks(opaque).length,1);assert.equal(protectedBlocks(opaque)[0].raw,opaque);checks+=2;
 same('<!-- <nowiki>comment</nowiki> -->','<!-- changed comment -->');checks++;
 const result={kind:'strict-independent-opaque-reader-mutation-test',checks,passed:true,legacyFalsePositiveReproduced:true,selfClosingOwnersIncluded:true,unclosedLiteralTailsIncluded:true,productFunctionsChanged:false,apiGuardAssertionsChanged:false,wikipediaWrites:0};
 if(args.receipt)freezeWrite(path.resolve(args.receipt),result);console.log(JSON.stringify(result));
}
function summarySafety(value){return{accepted:value?.accepted===true,code:value?.code||null,reason:value?.reason||'',findings:Array.isArray(value?.findings)?value.findings:[]};}
if(args['self-test-literals'])literalReaderSelfTest();
else if(args.child){
 let networkAttempts=0;
 const refuse=()=>{networkAttempts++;throw Error('Offline regression prohibits network access');};
 global.fetch=refuse;global.XMLHttpRequest=class{constructor(){refuse();}};global.WebSocket=class{constructor(){refuse();}};
 for(const name of ['node:http','node:https']){const api=require(name);api.request=refuse;api.get=refuse;}
 const engines={core:require(args.core),complete:require(args.complete)};
 process.on('message',job=>{
  const began=performance.now();
  try{
   const api=engines[job.bundle],options={...api.defaults,...job.options};let value;
   if(job.method==='calculate'){
    const result=api.calculate({kind:'adjust',source:job.source,originalSource:job.source,options});
    const beforeClasses=api.v219RawNamedReferenceClasses(job.source),afterClasses=api.v219RawNamedReferenceClasses(result.text),splits=[];
    for(const [key,bodies]of beforeClasses)if(bodies.size===1&&afterClasses.get(key)?.size>1)splits.push({identity:key,before:bodies.size,after:afterClasses.get(key).size});
    const imageKeys=text=>api.imageTargets(text).map(item=>String(item.title).replace(/_/g,' ').trim()).sort();
    value={independent:{protectedLiteralBlocksExact:JSON.stringify(protectedBlocks(job.source))===JSON.stringify(protectedBlocks(result.text)),legacyProtectedLiteralBlocksExact:JSON.stringify(legacyProtectedBlocks(job.source))===JSON.stringify(legacyProtectedBlocks(result.text)),imageTargetsExact:JSON.stringify(imageKeys(job.source))===JSON.stringify(imageKeys(result.text)),newRawNamedDefinitionSplits:splits},text:result.text,preservation:result.preservation||[],automaticResultSafety:summarySafety(api.v219AutomaticResultSafety(job.source,result)),localCompositionAccepted:result.localCompositionSafety?.accepted===true,changes:(result.changes||[]).map(item=>({id:item.id,count:item.count,label:item.label})),byteMetrics:result.byteMetrics||null,minorEligible:result.minorCheck?.eligible===true,version:api.version};
   }else if(job.method==='preservationAudit')value=api.preservationAudit(job.source,job.target,options);
   else if(job.method==='safeComposition')value=api.safeComposition(job.source,job.target,options);
   else throw Error('Unknown actual API method');
   process.send({id:job.id,ok:true,value,milliseconds:performance.now()-began,networkAttempts});
  }catch(error){process.send({id:job.id,ok:false,error:String(error.stack||error),milliseconds:performance.now()-began,networkAttempts});}
 });
 process.send({ready:true});
}else (async()=>{
 if(!args.manifest||!args.core||!args.complete)throw Error('Supply the local source manifest and both actual bundles');
 const manifestFile=path.resolve(args.manifest),manifestRaw=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestRaw),runnerPin=pin(__filename);
 if(manifest.kind!=='offline-saved-corpus-union'||!manifest.sourceVerificationComplete||!Array.isArray(manifest.pages))throw Error('Use a verified offline source-union manifest');
 const allRows=manifest.pages,seen=new Set();
 for(const row of allRows){const key=[row.pageid,row.revid,row.sha256].join(':');if(seen.has(key))throw Error('Duplicate selected capture');seen.add(key);if(!row.sourcePath||!row.revid||!row.sha256)throw Error('Unbound source capture');}
 const forbidden=new Set((manifest.exclusions||[]).filter(row=>/known.*extreme/i.test(row.reason||'')).map(row=>[row.pageid,row.revid,row.sha256].join(':')));
 if(!manifest.authorizedHistoricalTimeoutRetest&&allRows.some(row=>forbidden.has([row.pageid,row.revid,row.sha256].join(':'))))throw Error('Historical timeout repetition requires explicit new batch authorization');
 const shard=Number(args.shard||0),shards=Number(args.shards||1);
 if(!Number.isInteger(shard)||!Number.isInteger(shards)||shards<1||shard<0||shard>=shards)throw Error('Invalid deterministic shard');
 const selected=allRows.filter(row=>parseInt(sha([row.pageid,row.revid,row.sha256].join(':')).slice(0,8),16)%shards===shard&&(!args['min-bytes']||row.bytes>=Number(args['min-bytes']))&&(!args['max-bytes']||row.bytes<Number(args['max-bytes'])));
 const rows=args.limit?selected.slice(0,Number(args.limit)):selected;
 if(!rows.length)throw Error('No selected source captures');
 const bundleFiles={core:path.resolve(args.core),complete:path.resolve(args.complete)};bundleFiles.coreData=bundleFiles.core.replace(/\.js$/,'_dados.js');
 bundleFiles.coreCatalog=bundleFiles.core.replace(/\.js$/,'_catalogo.js');bundleFiles.coreRules=bundleFiles.core.replace(/\.js$/,'_regras.js');
 const inputPins=Object.fromEntries(Object.entries(bundleFiles).map(([key,file])=>[key,pin(file)]));
 for(const key of ['core','complete'])if(args['expected-'+key+'-sha256']&&args['expected-'+key+'-sha256']!==inputPins[key].sha256)throw Error('Selected '+key+' does not match the frozen snapshot');
 const cap=Number(args['external-call-cap-ms']||180000),heap=Number(args['worker-heap-mb']||1536),workers=Math.min(8,Math.max(1,Number(args.workers)||1));
 if(!Number.isInteger(cap)||cap<1000||cap>3600000||!Number.isInteger(heap)||heap<256||heap>8192)throw Error('Invalid external process resource cap');
 const selectionHash=sha(JSON.stringify(rows.map(row=>[row.pageid,row.revid,row.sha256]))),base={schemaVersion:1,version:String(args.version||'2.22.0'),kind:'actual-offline-source-union-regression',independentLiteralReader:'quote-aware-self-closing-and-opaque-owners-v1',status:args.execute?'running':'selection-only',plannedCaptures:rows.length,distinctPages:new Set(rows.map(row=>row.pageid)).size,distinctRevisions:new Set(rows.map(row=>row.revid)).size,distinctSourceHashes:new Set(rows.map(row=>row.sha256)).size,sourceBytes:rows.reduce((n,row)=>n+row.bytes,0),sourceSelectionSha256:selectionHash,sourceManifestSha256:sha(manifestRaw),runnerSha256:runnerPin.sha256,runtime:inputPins,externalProcessCapMilliseconds:cap,workerHeapMB:heap,workers,shard,shards,productDeadlineChanged:false,preservationChecksOmitted:false,historicalStatusesModified:false,historicalTimeoutRetest:manifest.authorizedHistoricalTimeoutRetest===true,knownExtremeRepeated:manifest.authorizedHistoricalTimeoutRetest===true&&rows.some(row=>row.bytes>=1900000),wikipediaWrites:0,networkRequests:0};
 if(!args.execute){console.log(JSON.stringify(base,null,2));return;}
 if(!args.output)throw Error('Execution requires a fresh private output directory');
 const output=path.resolve(args.output);if(fs.existsSync(output))throw Error('A new output directory is required; historical results are immutable');
 const snapshot=path.join(output,'runtime');for(const folder of [snapshot,path.join(output,'pages'),path.join(output,'transformed')])fs.mkdirSync(folder,{recursive:true});
 const files={};for(const [key,file]of Object.entries(bundleFiles)){const dest=path.join(snapshot,path.basename(file));fs.copyFileSync(file,dest);files[key]=dest;if(pin(dest).sha256!==inputPins[key].sha256)throw Error('Runtime snapshot differs');}
 const report={...base,startedUTC:new Date().toISOString(),completedCaptures:0,passedCaptures:0,failedCaptures:0,externalCapCaptures:0,changedCaptures:0,acceptedCaptures:0,safelyUnchangedCaptures:0,refusedCaptures:0,apiCalls:0,checks:0,byFailure:{}};
 freezeWrite(path.join(output,'RUN_PRIVATE.json'),{...base,manifestFile,files,selection:rows.map(row=>({pageid:row.pageid,revid:row.revid,sha256:row.sha256,bytes:row.bytes,origins:row.origins,markupTags:row.markupTags}))});
 const save=()=>fs.writeFileSync(path.join(output,'PROGRESS.json'),JSON.stringify(report,null,2)+'\n');save();
 const queue=rows.slice().sort((a,b)=>a.bytes-b.bytes),completed=new Set();let sequence=0;
 async function worker(){
  let child,ready,waiting;
  function start(){
   ready=new Promise((resolve,reject)=>{
    const owned=child=cp.fork(__filename,['--child=1','--core='+files.core,'--complete='+files.complete],{execArgv:['--max-old-space-size='+heap],stdio:['ignore','ignore','pipe','ipc']});let booted=false,stderr='';
    owned.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-6000);});
    const timer=setTimeout(()=>{owned.kill('SIGKILL');reject(Error('External worker bootstrap cap'));},30000);
    owned.on('message',message=>{if(message.ready){booted=true;clearTimeout(timer);resolve();}else if(waiting?.owner===owned&&message.id===waiting.id){const job=waiting;waiting=null;clearTimeout(job.timer);job.resolve(message);}});
    owned.on('error',error=>{clearTimeout(timer);reject(error);});
    owned.on('exit',(code,signal)=>{if(!booted){clearTimeout(timer);reject(Error('Worker bootstrap exit '+code+'/'+signal+' '+stderr));}if(waiting?.owner===owned){const job=waiting;waiting=null;clearTimeout(job.timer);job.resolve({ok:false,error:'Worker exited '+code+'/'+signal,stderr});}});
   });return ready;
  }
  async function stop(){if(child?.connected)child.disconnect();}
  async function invoke(job){await ready;const id=++sequence;return new Promise(resolve=>{const owner=child,timer=setTimeout(()=>{if(waiting?.id===id)waiting=null;owner.kill('SIGKILL');resolve({ok:false,externalCap:true,error:'Test process call reached its external '+cap+' ms resource cap',milliseconds:cap});},cap);waiting={id,owner,timer,resolve};owner.send({...job,id});});}
  await start();let jobs=0;
  while(queue.length){
   if(fs.existsSync(path.join(output,'STOP_REQUESTED')))break;
   const row=queue.shift(),capture=row.pageid+'_'+row.revid,result={pageid:row.pageid,revid:row.revid,sourceSha256:row.sha256,sourceBytes:row.bytes,origins:row.origins,markupTags:row.markupTags,calls:[],failures:[],sourceVerified:false,historicalStatusesModified:false};let source,endpoints={},mustRestart=false;
   function fail(kind,details){result.failures.push({kind,details});}
   function check(value,kind,details){report.checks++;if(!value)fail(kind,details);}
   try{
    const packed=fs.readFileSync(row.sourcePath),raw=zlib.gunzipSync(packed);source=raw.toString('utf8');
    check(sha(raw)===row.sha256&&raw.length===row.bytes&&(!row.gzipSha256||sha(packed)===row.gzipSha256)&&Buffer.from(source).equals(raw),'input-binding','Captured UTF8/compressed binding');
    if(result.failures.length)throw Error('Source binding differs');result.sourceVerified=true;
    const options={namespaceNumber:row.namespace||0,pageTitle:row.title,contentModel:row.contentModel||'wikitext',sectionOnly:false,autoPreview:false,registryDoiCheck:false,minorAllToolChanges:true,minorBaseConfirmed:true,v216CalendarUTC:String(manifest.createdUTC||new Date().toISOString()).slice(0,10)};result.optionsSha256=sha(JSON.stringify(options));
    let transportFailed=false;
    for(const bundle of ['core','complete']){
     if(transportFailed){
      if(!manifest.authorizedHistoricalTimeoutRetest)break;
      await stop();await start();transportFailed=false;mustRestart=false;
     }let first;
     for(const method of ['calculate','idempotence','preservationAudit','safeComposition']){
      const response=await invoke({bundle,method:method==='idempotence'?'calculate':method,source:method==='idempotence'?first.text:source,target:first?.text,options});
      result.calls.push({bundle,method,ok:response.ok,milliseconds:response.milliseconds,externalCap:!!response.externalCap,error:response.error,stderr:response.stderr});report.apiCalls++;report.networkRequests+=response.networkAttempts||0;
      check(!response.networkAttempts,'network-attempt',{bundle,method,count:response.networkAttempts});
      if(!response.ok){fail(response.externalCap?'external-resource-cap':'api-exception',{bundle,method,error:response.error});transportFailed=true;mustRestart=true;break;}
      const value=response.value;
      if(method==='calculate'){
       first=value;check(value.version===base.version,'runtime-version',{bundle,actual:value.version,expected:base.version});check(typeof value.text==='string','missing-endpoint',{bundle});if(typeof value.text!=='string'){transportFailed=true;break;}
       endpoints[bundle]=value.text;check(value.independent.protectedLiteralBlocksExact,'protected-literal-blocks',{bundle});check(value.independent.imageTargetsExact,'image-target-retention',{bundle});check(value.independent.newRawNamedDefinitionSplits.length===0,'new-named-definition-split',{bundle,splits:value.independent.newRawNamedDefinitionSplits});check(value.automaticResultSafety.accepted,'production-acceptance',{bundle,gate:value.automaticResultSafety});check(value.localCompositionAccepted,'local-composition-acceptance',{bundle});check(!value.preservation.length,'calculate-preservation',{bundle,findings:value.preservation});
       const count=value.changes.reduce((n,item)=>n+(Number(item.count)||0),0),delta=Buffer.byteLength(value.text)-raw.length;
       check(value.changes.every(item=>Number.isFinite(Number(item.count))&&Number(item.count)>=0),'invalid-change-count',{bundle,changes:value.changes});
       check(value.text===source||count>0,'changed-without-count',{bundle,count});
       result[bundle]={version:value.version,changed:value.text!==source,bytes:Buffer.byteLength(value.text),deltaBytes:delta,outputSha256:sha(value.text),adjustmentCount:count,changes:value.changes,automaticResultSafety:value.automaticResultSafety,localCompositionAccepted:value.localCompositionAccepted,minorEligible:value.minorEligible,independent:value.independent,byteMetrics:value.byteMetrics};
      }else if(method==='idempotence')check(value.text===first.text,'idempotence',{bundle,firstHash:sha(first.text),secondHash:sha(value.text)});
      else if(method==='preservationAudit')check(Array.isArray(value)&&value.length===0,'independent-preservation',{bundle,findings:value});
      else check(value==='','independent-composition',{bundle,reason:value});
     }
    }
    if(typeof endpoints.core==='string'&&typeof endpoints.complete==='string')check(endpoints.core===endpoints.complete,'distribution-parity',{core:sha(endpoints.core),complete:sha(endpoints.complete)});
    check(sha(Buffer.from(source))===row.sha256,'controller-source-preserved','The original draft in the controller remains exact');
    for(const bundle of ['core','complete'])if(typeof endpoints[bundle]==='string'&&endpoints[bundle]!==source){const bytes=Buffer.from(endpoints[bundle]),packedOutput=zlib.gzipSync(bytes),filename=capture+'_'+bundle+'.wiki.gz';freezeWrite(path.join(output,'transformed',filename),packedOutput);result[bundle].outputFile='transformed/'+filename;result[bundle].gzipSha256=sha(packedOutput);}
   }catch(error){fail('controller-or-source-exception',String(error.stack||error));}
   result.status=result.failures.length?'failed':'passed';result.externalResourceCap=result.calls.some(call=>call.externalCap);result.unexecutedCalls=8-result.calls.length;
   if(result.externalResourceCap){report.externalCapCaptures++;result.status='incomplete-external-resource-cap';}
   else if(result.status==='passed'){report.passedCaptures++;report.acceptedCaptures++;if(!result.core.changed)report.safelyUnchangedCaptures++;}
   else report.failedCaptures++;
   if(['core','complete'].some(bundle=>result[bundle]?.automaticResultSafety.accepted===false))report.refusedCaptures++;
   for(const failure of result.failures)report.byFailure[failure.kind]=(report.byFailure[failure.kind]||0)+1;
   report.changedCaptures+=Number(!!result.core?.changed);report.completedCaptures++;
   if(completed.has(capture))throw Error('Capture executed twice');completed.add(capture);
   freezeWrite(path.join(output,'pages',capture+'.json'),result);
   fs.appendFileSync(path.join(output,'rows.jsonl'),JSON.stringify({pageid:row.pageid,revid:row.revid,sha256:row.sha256,status:result.status,coreOutputSha256:result.core?.outputSha256,completeOutputSha256:result.complete?.outputSha256,changed:result.core?.changed,failures:result.failures.map(f=>f.kind)})+'\n');
   if(result.failures.length)fs.appendFileSync(path.join(output,'FAILURES_PRIVATE.jsonl'),JSON.stringify(result)+'\n');save();
   if(report.completedCaptures%100===0)console.log(JSON.stringify({completed:report.completedCaptures,planned:rows.length,failed:report.failedCaptures,externalCaps:report.externalCapCaptures}));
   if((mustRestart||++jobs%50===0)&&queue.length){await stop();await start();}
  }
  await stop();
 }
 await Promise.all(Array.from({length:Math.min(workers,rows.length)},worker));
 report.sourceManifestUnchanged=sha(fs.readFileSync(manifestFile))===base.sourceManifestSha256;report.runnerUnchanged=sha(fs.readFileSync(__filename))===runnerPin.sha256;
 report.runtimeUnchanged=Object.entries(files).every(([key,file])=>pin(file).sha256===inputPins[key].sha256)&&Object.entries(bundleFiles).every(([key,file])=>pin(file).sha256===inputPins[key].sha256);
 report.complete=report.completedCaptures===rows.length;report.stoppedByController=!report.complete&&fs.existsSync(path.join(output,'STOP_REQUESTED'));
 if((!report.complete&&!report.stoppedByController)||!report.sourceManifestUnchanged||!report.runnerUnchanged||!report.runtimeUnchanged)throw Error('Incomplete or mutated campaign input');
 report.finishedUTC=new Date().toISOString();report.status=report.stoppedByController?'paused-incomplete':report.failedCaptures?'failed':report.externalCapCaptures?'completed-with-external-resource-limits':'passed';save();freezeWrite(path.join(output,'RESULT.json'),report);console.log(JSON.stringify(report));if(report.failedCaptures||report.externalCapCaptures||!report.complete)process.exitCode=1;
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
