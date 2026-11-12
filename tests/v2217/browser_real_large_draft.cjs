'use strict';
// Bounded observation of a real cached input. No article body, title or user
// identity is embedded in this test or its public receipt. Product code, clocks
// and Worker messages are unchanged; no completed result is held or fabricated.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),Module=require('node:module'),assert=require('node:assert/strict');
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex'),selectionPath=process.env.REVISAWIKI_PRIVATE_LARGE_MANIFEST;
assert(selectionPath,'A private, read-only selection manifest is required');
const selectionRaw=fs.readFileSync(selectionPath),selection=JSON.parse(selectionRaw);assert.equal(selection.sourceVerificationComplete,true);assert.equal(selection.pages.length,30);
let largest=null;
for(const row of selection.pages){
 const packed=fs.readFileSync(row.sourcePath);if(row.gzipSha256)assert.equal(sha(packed),row.gzipSha256);
 const raw=packed[0]===0x1f&&packed[1]===0x8b?zlib.gunzipSync(packed):packed;assert.equal(raw.length,row.bytes);assert.equal(sha(raw),row.sha256);
 if(!largest||raw.length>largest.raw.length)largest={row,raw};
}
assert(largest.raw.length>=1800000);assert(Buffer.from(largest.raw.toString('utf8')).equals(largest.raw));
const base=path.join(__dirname,'browser_ui.cjs');let source=fs.readFileSync(base,'utf8');
const largeAnchor="const largeSource=Array.from({length:350},()=>plain).join('\\n'),largeExpected=Array.from({length:350},()=>clean).join('\\n');";
assert.equal(source.split(largeAnchor).length,2);
source=source.replace(largeAnchor,"const largeSource=Buffer.from('"+largest.raw.toString('base64')+"','base64').toString('utf8'),largeExpected=largeSource;");
const fixtureAnchor="localFiles['current_fixture.js']=()=>Buffer.from(adaptedFixture);";assert.equal(source.split(fixtureAnchor).length,2);
const observer=String.raw`
 qa.realLargeJobs=[];qa.largeHeartbeat=0;qa.largePulseClicks=0;
 qa.largeHeartbeatTimer=setInterval(()=>qa.largeHeartbeat++,100);
 const pulse=document.createElement('button');pulse.type='button';pulse.id='rw-large-ui-pulse';pulse.textContent='Controle local de resposta';pulse.addEventListener('click',()=>qa.largePulseClicks++);document.body.prepend(pulse);
 const RealLargeWorker=window.Worker;
 if(typeof RealLargeWorker==='function')window.Worker=class extends RealLargeWorker{
  constructor(...args){super(...args);this.addEventListener('message',event=>{
   if(event.data?.type!=='result')return;
   const job=[...qa.realLargeJobs].reverse().find(row=>row.id===event.data.id&&!row.completed);
   if(job){job.completed=true;job.completedAt=performance.now();job.preservationCount=Array.isArray(event.data.result?.preservation)?event.data.result.preservation.length:null;}
  });}
  postMessage(message,...rest){if(message?.type==='calculate')qa.realLargeJobs.push({id:message.id,kind:message.job?.kind,checkpoint:message.job?.v2215Checkpoint===true,sourceMatches:message.job?.source===source,characters:message.job?.source?.length,postedAt:performance.now(),completed:false});return super.postMessage(message,...rest);}
 };
`;
source=source.replace(fixtureAnchor,'adaptedFixture=adaptedFixture.replace(fixtureEnd,'+JSON.stringify(observer)+'+fixtureEnd);'+fixtureAnchor);
const anchor="  for(const bundle of ['core','complete']){\n   await test(bundle+'-automatic-only-count-bytes-minor-summary-undo',async()=>{";assert.equal(source.split(anchor).length,2);
const metadata={bytes:largest.raw.length,sha256:largest.row.sha256,gzipSha256:largest.row.gzipSha256,selectionManifestSha256:sha(selectionRaw),verifiedInputs:selection.pages.length};
const titleEncoded=Buffer.from(JSON.stringify(largest.row.title)).toString('base64');
const extra=String.raw`
  report.kind='bounded-real-large-worker-native-ui-preservation';
  report.scope='Actual final engine and native browser with the verified largest cached source. The local editor and read-only API responses are test adapters. Production Worker computation, writer, clock and preservation checks are unchanged.';
  report.executionBundle='core with frozen data catalogue';
  report.fixtureAdapterChanges=['A verified real input is read from a private frozen cache and supplied before product startup.','Only the editor bridge, read-only API responses and exact loopback host boundaries are local adapters.','A pass-through Worker observer records dispatch/completion metadata without changing messages, results or timing.','A separate local heartbeat and control observe main-thread response without changing the draft.'];
  report.largeInput=${JSON.stringify(metadata)};
  report.targetedRunnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
  report.largeInput.selection='Largest input by independently verified decompressed byte length among the frozen private selection.';
  report.largeInput.publicBodyOrTitleIncluded=false;
  report.realLargeObservation={syntheticResultHold:false,artificialComputationDelay:false,productionClockUnmodified:true,observationTargetMilliseconds:65000,externalTestBudgetMilliseconds:85000,samples:[]};
  await test('core-real-large-worker-ui-preservation',async()=>{
   let budget;
   const deadline=new Promise((_,reject)=>{budget=setTimeout(()=>reject(new Error('The bounded local UI observation exceeded its external test budget')),85000);});
   async function scenario(){
    const privateTitle=JSON.parse(Buffer.from('${titleEncoded}','base64').toString('utf8'));
    await load('core','normal','classic',{v2212SourceKey:'large',preview:'1',v2215Title:privateTitle});
    eq(await read('__rw219UI.read()===__rw219UI.source'),true,'The real cached draft is exact before adjustment');
    const loaded=await read('(async()=>{const raw=new TextEncoder().encode(__rw219UI.read()),hash=await crypto.subtle.digest("SHA-256",raw);return{bytes:raw.length,sha256:[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("")}})()');
    eq(loaded,{bytes:report.largeInput.bytes,sha256:report.largeInput.sha256},'The editor contains the verified largest source bytes');
    await read('__rw219UI.setSummary("Resumo local preservado.")');
    eq(await read('document.getElementById("wpMinoredit").checked'),false,'The initial minor choice is recorded');
    const started=Date.now();await click('.ajg-run');let lastSample=null,nextSample=0,pulsed=false;
    while(true){
     const callStart=Date.now(),state=await read('(()=>{const q=__rw219UI,e=document.getElementById("wpTextbox1"),p=document.querySelector("#revisawiki-ptwiki"),icon=p.querySelector(".ajg-progress-indicator"),style=icon?getComputedStyle(icon):null;return{busy:p.getAttribute("aria-busy")==="true",processingActive:RevisaWiki.processing.active,sourceExact:q.read()===q.source,editable:!e.disabled&&!e.readOnly,summaryExact:q.summary()==="Resumo local preservado.",minor:document.getElementById("wpMinoredit").checked,heartbeat:q.largeHeartbeat,workerStarts:q.workerStarts,liveRealJobs:q.realLargeJobs.filter(j=>j.sourceMatches&&!j.completed).map(j=>({kind:j.kind,checkpoint:j.checkpoint})),completedRealJobs:q.realLargeJobs.filter(j=>j.sourceMatches&&j.completed).length,activityCueVisible:!!icon&&!icon.hidden&&style.display!=="none",animationName:style?.animationName,animationDuration:style?.animationDuration,reducedMotion:matchMedia("(prefers-reduced-motion:reduce)").matches,heldResults:q.heldActualResults||0,heldMainResults:q.heldMainResults||0}})()');
     const elapsed=Date.now()-started,latency=Date.now()-callStart;lastSample={elapsedMilliseconds:elapsed,roundTripMilliseconds:latency,...state};
     if(elapsed>=nextSample||!state.busy){report.realLargeObservation.samples.push(lastSample);nextSample=elapsed+10000;}
     ok(latency<5000,'The editor main thread answers while the real large computation runs');
     eq(state.heldResults+state.heldMainResults,0,'No Worker result is held by the fixture');
     ok(state.editable,'The source editor remains enabled and writable');
     if(!state.busy&&!state.processingActive)break;
     if(state.sourceExact){eq(state.summaryExact,true,'Pending analysis preserves the manual summary');eq(state.minor,false,'Pending analysis preserves the prior minor choice');}
     if(!pulsed&&elapsed>=10000){await click('#rw-large-ui-pulse');eq(await read('__rw219UI.largePulseClicks'),1,'A real independent button event responds during computation');pulsed=true;}
     if(elapsed>=65000)break;
     await delay(250);
    }
    report.realLargeObservation.observedMilliseconds=Date.now()-started;
    report.realLargeObservation.realJobs=await read('__rw219UI.realLargeJobs');
    ok(report.realLargeObservation.realJobs.some(j=>j.kind==="adjust"&&j.sourceMatches),'The actual Worker received the real large input for adjustment');
    let cancelled=false;
    if(lastSample.busy||lastSample.processingActive){
     ok(lastSample.sourceExact,'The complete original draft remains exact before cancellation');
     ok(lastSample.activityCueVisible,'The actual activity cue remains visible during real computation');
     ok(lastSample.liveRealJobs.length>0,'A real source-matched Worker job is still computing');
     ok(lastSample.elapsedMilliseconds>=60000,'The real analysis remains active past the former sixty-second boundary');
     if(!lastSample.reducedMotion)ok(lastSample.animationName!=='none'&&parseFloat(lastSample.animationDuration)>0,'The normal activity cue has a running animation');
     cancelled=await read('(()=>{const b=document.querySelector(".ajg-stop");if(b&&!b.hidden&&!b.disabled){b.click();return true;}return false})()');
     ok(cancelled,'Cancellation uses the actual analysis control');await settled();
     eq(await read('__rw219UI.read()===__rw219UI.source'),true,'Cancellation preserves every original draft character');
     ok(await read('__rw219UI.workerTerminates>0'),'Cancellation terminates the real computing Worker');
     report.realLargeObservation.outcome='real-worker-cancelled-after-boundary';
    }else{
     report.realLargeObservation.outcome='real-completion-before-observation-boundary';
     const changed=await read('__rw219UI.read()!==__rw219UI.source');report.realLargeObservation.actualEndpointChanged=changed;
     if(changed){
      ok(await read('__rw219UI.workerResults.some(r=>r.result?.text===__rw219UI.read()&&Array.isArray(r.result.preservation)&&r.result.preservation.length===0&&r.result.localCompositionSafety?.accepted!==false)'),'The actual written endpoint matches a completed result with accepted production preservation');
      const after=await read('__rw219UI.read()');report.realLargeObservation.endpointSha256=sha(after);report.realLargeObservation.endpointBytes=Buffer.byteLength(after);
      await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()===__rw219UI.source'),true,'Undo restores the exact real input after actual completion');
     }else eq(await read('__rw219UI.read()===__rw219UI.source'),true,'An unchanged real endpoint is preserved exactly');
    }
    eq(await read('__rw219UI.summary()'),'Resumo local preservado.','The summary is restored or retained exactly');
    eq(await read('document.getElementById("wpMinoredit").checked'),false,'The prior minor choice is restored or retained exactly');
    ok(await read('!document.querySelector(".ajg-run").disabled&&!document.getElementById("wpTextbox1").disabled&&!document.getElementById("wpTextbox1").readOnly'),'Normal editing controls remain usable');
    await read('(()=>{const e=document.getElementById("wpTextbox1");e.focus();e.setSelectionRange(e.value.length,e.value.length);return true})()');
    const marker=' [teste local]';
    if(browserName==='Chrome')await driver.page.keyboard.insertText(marker);
    else if(browserName==='Firefox')await driver.command('input.performActions',{context:driver.context,actions:[{type:'key',id:'qa-large-native-edit',actions:[...marker].flatMap(value=>[{type:'keyDown',value},{type:'keyUp',value}])}]});
    else{const found=await driver.request('POST','/session/'+driver.session+'/element',{using:'css selector',value:'#wpTextbox1'}),id=found['element-6066-11e4-a52e-4f735466cecf'];await driver.request('POST','/session/'+driver.session+'/element/'+id+'/value',{text:marker,value:[...marker]});}
    eq(await read('__rw219UI.read()===__rw219UI.source+" [teste local]"'),true,'Native keyboard input can continue editing the entire preserved draft');
    await delay(2000);eq(await read('__rw219UI.read()===__rw219UI.source+" [teste local]"'),true,'No late real result overwrites the newer manual text during the observation grace');
    eq(await read('__rw219UI.summary()'),'Resumo local preservado.','Later manual editing retains the summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Later manual editing retains the minor choice');
    await read('(()=>{clearInterval(__rw219UI.largeHeartbeatTimer);__rw219UI.write(__rw219UI.source);return true})()');
    eq(await read('__rw219UI.read()===__rw219UI.source'),true,'The local test closes with the exact original draft restored');
    report.realLargeObservation.manualNativeEditPreserved=true;report.realLargeObservation.lateResultGraceMilliseconds=2000;report.realLargeObservation.syntheticLateResultInjected=false;
    report.realLargeObservation.cancelled=cancelled;await noReviewUI();
   }
   try{await Promise.race([scenario(),deadline]);}finally{clearTimeout(budget);}
  });
`;
source=source.replace(anchor,extra+anchor);process.env.REVISAWIKI_UI_CASE_FILTER='real-large-worker-ui-preservation';delete process.env.REVISAWIKI_UI_NO_DEADLINE_REAL;
const compiled=new Module(base,module);compiled.filename=base;compiled.paths=Module._nodeModulePaths(__dirname);compiled._compile(source,base);
