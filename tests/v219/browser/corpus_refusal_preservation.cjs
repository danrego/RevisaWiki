'use strict';
// Real candidate refusals are tested at the native editor boundary. Source
// captures and receipts remain outside the repository and are never published.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const baselinePath=path.join(__dirname,'current_ui.cjs'),baseline=fs.readFileSync(baselinePath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(baseline.split(anchor).length!==2)throw Error('The exact current fixture entry point changed');
let prefix=baseline.slice(0,baseline.indexOf(anchor));const route="'current_fixture.js':()=>fixtureScript";
if(prefix.split(route).length!==2)throw Error('The current local fixture route changed');
prefix='let corpusFixture=null;\n'+prefix.replace(route,"'current_fixture.js':()=>corpusFixture||fixtureScript");
const body=String.raw`
const inputPath=path.resolve(process.env.REVISAWIKI_NATIVE_CORPUS),inputRaw=fs.readFileSync(inputPath),input=JSON.parse(inputRaw);
report.kind='native-real-corpus-refusal-preservation';report.privateInputSha256=sha(inputRaw);report.sourceCaseCount=input.rows.length;
report.evidenceBoundary='Real captured source and production result gate, installed native browser, explicitly local read-only MediaWiki adapter. No native Wikimedia expansion or account publication is claimed.';
report.adaptations.push('Only the local adapter initial saved source and title vary. Transformation functions, handlers, candidates and safety verdicts are unchanged. Online registry and authority queries are disabled in this offline fixture and recorded separately.');
const articleAnchor="articleTitle='Tema fictício'",sourceAnchor='const source=sources[scenario]||sources.normal,qa=';
ok(fixtureScript.toString().split(articleAnchor).length===2&&fixtureScript.toString().split(sourceAnchor).length===2,'Only exact fixture source/title anchors vary');
(async()=>{try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);
 for(const entry of input.rows)for(const bundle of ['core','complete'])await test(bundle+'-'+entry.id,async()=>{
  const nativeSource=entry.source.replace(/\r\n?/g,'\n');
  corpusFixture=Buffer.from(fixtureScript.toString().replace(articleAnchor,'articleTitle='+JSON.stringify(entry.title)).replace(sourceAnchor,'const source='+JSON.stringify(nativeSource)+',qa='));
  await load(bundle,'normal','classic',{nativeWitness:'1'});
  const options={...entry.options,autoPreview:false,registryDoiCheck:false,authorityControl:false};
  await read('window.RevisaWikiConfig='+JSON.stringify(options));
  eq(await read('__rw219UI.read()'),nativeSource,'Native saved source is exact before the tool runs');
  const before=await read('({source:__rw219UI.read(),summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked})');
  await adjust();
  const after=await read('({source:__rw219UI.read(),summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked})');
  eq(after,before,'The final editor gate preserves every source byte, summary and minor checkbox');
  const observed=await read('(()=>{const jobs=__rw219UI.nativeWitnessJobs||[],item=__rw219UI.workerResults.find(x=>jobs.some(job=>job.id===x.id&&job.job?.kind==="adjust"));return item?{id:item.id,job:jobs.find(job=>job.id===item.id).job,result:item.result}:null})()');
  ok(!!observed,'This case reached a real production adjustment result, independently of later presentation/refresh results');
  const capture=observed.result;
  eq(observed.job.source,nativeSource,'The real adjustment job used the exact native preimage');
  ok(capture.text!==nativeSource,'The runtime actually proposed a change, not an invented no-op');
  ok(capture.preservation?.length>0||capture.localCompositionSafety?.accepted===false,'A real failed source obligation is present');
  eq(capture.localCompositionSafety.source,nativeSource,'The failed verdict binds the actual saved source');
  const row={id:entry.id,bundle,sourceSha256:sha(nativeSource),fileSourceSha256:sha(entry.source),candidateSha256:sha(capture.text),actualEditorEndpointSha256:sha(after.source),preservationCodes:(capture.preservation||[]).map(x=>x.code),localCompositionAccepted:capture.localCompositionSafety.accepted,changed:false,status:'safely-refused'};
  (report.refusalCases??=[]).push(row);
  await read('__rw219UI.write('+JSON.stringify(nativeSource+'\nTexto manual de teste.')+')');
  eq(await read('__rw219UI.read()'),nativeSource+'\nTexto manual de teste.','Normal editing remains possible after the refusal');
 });
 report.pageErrors=driver.errors||[];report.blockedNetwork=driver.blocked||[];eq(report.pageErrors,[],'No browser runtime error');eq(report.actualNetworkMutations,0,'No server mutation');eq(report.clipboardWrites,0,'No clipboard writes');
}catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:error.message});}
finally{try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-cleanup',message:error.message});}await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;}})();
`;
const wrapper=new Module(__filename,module);wrapper.filename=__filename;wrapper.paths=module.paths;wrapper._compile(prefix+'\n'+body,__filename);
