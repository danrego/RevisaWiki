'use strict';
// External source captures remain private. The actual installed browser and
// production result gate determine the editor endpoint; no calculated text is
// used as an independently authored semantic expectation.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const baselinePath=path.join(__dirname,'current_ui.cjs'),baseline=fs.readFileSync(baselinePath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(baseline.split(anchor).length!==2)throw Error('The exact current fixture entry point changed');
let prefix=baseline.slice(0,baseline.indexOf(anchor));const route="'current_fixture.js':()=>fixtureScript";
if(prefix.split(route).length!==2)throw Error('The current local fixture route changed');
prefix='let corpusFixture=null;\n'+prefix.replace(route,"'current_fixture.js':()=>corpusFixture||fixtureScript");
const body=String.raw`
const inputPath=path.resolve(process.env.REVISAWIKI_NATIVE_CORPUS),inputRaw=fs.readFileSync(inputPath),input=JSON.parse(inputRaw),endpointDir=path.resolve(process.env.REVISAWIKI_NATIVE_ENDPOINTS);
fs.mkdirSync(endpointDir,{recursive:true});
report.kind='native-real-corpus-editor-application';report.privateInputSha256=sha(inputRaw);report.sourceCaseCount=input.rows.length;
report.evidenceBoundary='Actual installed browser and production Worker with fictional local read-only MediaWiki adapters. Independently assessed semantic results are separate from this editor-application receipt.';
report.adaptations.push('The local adapter initial saved source and title vary. Direct read-only fetch calls to the native API use the same explicitly fictional local API responses as mw.Api. Handlers, transformation functions, candidates and result gates are unchanged. Optional online preview, registry and authority queries are disabled. Mocked parser responses do not establish native Wikimedia rendering equivalence.');
const fetchAdapter='\n(()=>{const original=window.fetch.bind(window);window.fetch=(resource,init={})=>{const url=new URL(typeof resource==="string"?resource:resource.url,location.href),method=String(init.method||"GET").toUpperCase();if(url.hostname==="pt.wikipedia.org"&&url.pathname==="/w/api.php"&&method==="GET"&&["query","parse","paraminfo"].includes(url.searchParams.get("action"))){(__rw219UI.nativeFetchReadAdapters??=[]).push({method,action:url.searchParams.get("action")});return new mw.Api().get(Object.fromEntries(url.searchParams)).then(value=>new Response(JSON.stringify(value),{status:200,headers:{"Content-Type":"application/json"}}));}if(url.origin===location.origin&&method==="GET")return original(resource,init);__rw219UI.forbiddenActions.push("unmocked-fetch");return Promise.reject(new Error("Unmocked network refused"));};})();';
const articleAnchor="articleTitle='Tema fictício'",sourceAnchor='const source=sources[scenario]||sources.normal,qa=';
ok(fixtureScript.toString().split(articleAnchor).length===2&&fixtureScript.toString().split(sourceAnchor).length===2,'Only exact fixture source/title anchors vary');
(async()=>{try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
 for(const entry of input.rows)for(const bundle of ['core','complete'])await test(bundle+'-'+entry.id,async()=>{
  ok(sha(entry.source)===entry.sourceSha256,'The exact independently captured source hash is bound');
  const nativeSource=entry.source.replace(/\r\n?/g,'\n');
  corpusFixture=Buffer.from(fixtureScript.toString().replace(articleAnchor,()=> 'articleTitle='+JSON.stringify(entry.title)).replace(sourceAnchor,()=> 'const source='+JSON.stringify(nativeSource)+',qa=')+fetchAdapter);
  await load(bundle,'normal','classic',{nativeWitness:'1'});
  await read('window.RevisaWikiConfig='+JSON.stringify({...entry.options,autoPreview:false,registryDoiCheck:false,authorityControl:false,autoMinor:true}));
  const before=await read('({source:__rw219UI.read(),summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked})');
  eq(before.source,nativeSource,'The complete saved native preimage is bound before adjustment');
  const started=Date.now();await click('.ajg-run');
  await waitFor('(__rw219UI.nativeWitnessJobs||[]).some(x=>x.job?.kind==="adjust")','A real adjustment is dispatched');
  await waitFor('!RevisaWiki.processing?.active&&document.querySelector("#revisawiki-ptwiki")?.getAttribute("aria-busy")!=="true"','The unchanged production Worker deadline or calculation finishes',68000);await settled();
  const after=await read('({source:__rw219UI.read(),summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked})');
  const observed=await read('(()=>{const jobs=__rw219UI.nativeWitnessJobs||[],item=__rw219UI.workerResults.find(x=>jobs.some(job=>job.id===x.id&&job.job?.kind==="adjust"));return item?{id:item.id,job:jobs.find(job=>job.id===item.id).job,result:item.result,gate:RevisaWiki.v219AutomaticResultSafety(jobs.find(job=>job.id===item.id).job.source,item.result)}:null})()');
  const record={id:entry.id,bundle,sourceSha256:sha(nativeSource),fileSourceSha256:entry.sourceSha256,sourceBytes:Buffer.byteLength(nativeSource),actualEditorEndpointSha256:sha(after.source),milliseconds:Date.now()-started};
  if(!observed){
   eq(after,before,'A timed-out calculation preserves the complete draft, summary and checkbox');
   ok(record.milliseconds>=59500,'An absent result is only accepted at the real sixty-second production timeout');
   record.status='timeout-preserved';record.changed=false;
  }else{
   eq(observed.job.source,nativeSource,'The actual Worker used the exact preimage');
   ok(typeof observed.gate.accepted==='boolean','The actual production gate returns an explicit verdict');
   record.gate=observed.gate;record.candidateSha256=sha(observed.result.text);record.preservationCodes=(observed.result.preservation||[]).map(x=>x.code);
   if(observed.gate.accepted){
    eq(after.source,observed.result.text,'The editor receives exactly the accepted real candidate');
    record.changed=after.source!==nativeSource;record.status=record.changed?'applied':'unchanged';
    if(record.changed){eq(after.minor,true,'Every source-only RevisaWiki article adjustment is minor without size classification');ok(!!after.summary,'An actual adjustment has a summary');}
   }else{eq(after,before,'A refused real candidate leaves every draft byte and edit-form choice unchanged');record.changed=false;record.status='safely-refused';}
   fs.writeFileSync(path.join(endpointDir,bundle+'-'+entry.id+'.json'),JSON.stringify({source:nativeSource,candidate:observed.result.text,actualEditorEndpoint:after.source,record},null,2)+'\n');
  }
  if(Object.hasOwn(entry,'wholeExpected'))eq(after.source,entry.wholeExpected.replace(/\r\n?/g,'\n'),'An independently authored whole-editor endpoint is exact');
  record.mockedDirectApiReads=await read('__rw219UI.nativeFetchReadAdapters||[]');
  (report.corpusCases??=[]).push(record);
  if(record.changed){await click('.ajg-undo');eq(await read('__rw219UI.read()'),nativeSource,'Native Undo restores the complete captured source');eq(await read('__rw219UI.summary()'),before.summary,'Undo restores the owned original summary');eq(await read('document.getElementById("wpMinoredit").checked'),before.minor,'Undo restores the owned original checkbox');}
  await read('__rw219UI.write('+JSON.stringify(nativeSource+'\nTexto manual de teste.')+')');eq(await read('__rw219UI.read()'),nativeSource+'\nTexto manual de teste.','Ordinary editing remains available');
 });
 report.pageErrors=driver.errors||[];report.blockedNetwork=driver.blocked||[];eq(report.pageErrors,[],'No native browser runtime error');eq(report.actualNetworkMutations,0,'No server mutation');eq(report.clipboardWrites,0,'No clipboard writes');
}catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:error.message});}
finally{try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-cleanup',message:error.message});}await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;}})();
`;
const wrapper=new Module(__filename,module);wrapper.filename=__filename;wrapper.paths=module.paths;wrapper._compile(prefix+'\n'+body,__filename);
