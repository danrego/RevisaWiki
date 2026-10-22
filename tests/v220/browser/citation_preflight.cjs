'use strict';
// Reuse the independent editor adapter and native browser driver. Production
// code changes only at its exact local host allowlist; API replies are fixed
// synthetic examples rendered by the native parser, never alternate engines.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const here=__dirname,currentPath=path.resolve(here,'../../v219/browser/current_ui.cjs'),current=fs.readFileSync(currentPath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(current.split(anchor).length!==2)throw new Error('The exact browser fixture entry point changed');
let prefix=current.slice(0,current.indexOf(anchor)).replaceAll('2.19.0','2.20.0').replaceAll('2_19_0','2_20_0');
prefix=prefix.replaceAll("path.join(__dirname,'current_fixture.js')","path.join(__dirname,'../../v220/browser/citation_fixture.js')");

const hostStart=prefix.indexOf('const guard='),hostEnd=prefix.indexOf('const talkCatalogPath=',hostStart);
if(hostStart<0||hostEnd<0)throw new Error('The exact host-adapter boundary changed');
prefix=prefix.slice(0,hostStart)+String.raw`
const guardPairs=[
 ["if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;","if (host ? !['pt.wikipedia.org','127.0.0.1'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;"],
 ["if(host?host!=='pt.wikipedia.org':root.mw.config.get('wgDBname')!=='ptwiki')return;","if(host?!['pt.wikipedia.org','127.0.0.1'].includes(host):root.mw.config.get('wgDBname')!=='ptwiki')return;"]
];
for(const kind of ['core','complete']){const pairs=guardPairs.filter(pair=>scripts[kind].includes(pair[0]));assert.equal(pairs.length,1);const[from,to]=pairs[0];assert.equal(scripts[kind].split(from).length,2);scripts[kind]=scripts[kind].replace(from,to);}
const modulePairs=[
 ["if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;","if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;"],
 ["if(!root.mw?.loader||(root.location?.hostname||root.mw.config?.get('wgServerName'))!=='pt.wikipedia.org')return;","if(!root.mw?.loader||!['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname||root.mw.config?.get('wgServerName')))return;"]
];
const modulePair=modulePairs.filter(pair=>scripts.core.includes(pair[0]));assert.equal(modulePair.length,1);assert.equal(scripts.core.split(modulePair[0][0]).length,2);scripts.core=scripts.core.replace(modulePair[0][0],modulePair[0][1]);
`+prefix.slice(hostEnd);

const body=String.raw`
report.kind='native-ui-citation-heading-preflight';report.scope='Actual prepareHeadingReferences, paired native HTML proof, production Worker/staged engine and exact editor transaction. API responses are controlled native parser captures for fictional text.';
report.originalBrowserHarnessSha256=sha(fs.readFileSync(${JSON.stringify(currentPath)}));
report.runnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
report.fixtureScriptSha256=sha(fs.readFileSync(${JSON.stringify(path.join(here,'citation_fixture.js'))}));
report.nativeContractSha256=sha(fs.readFileSync(${JSON.stringify(path.resolve(here,'../citation_heading_native.json'))}));
const native=JSON.parse(fs.readFileSync(${JSON.stringify(path.resolve(here,'../citation_heading_native.json'))})),baseMap={[native.source]:native.beforeHtml,[native.candidate]:native.candidateHtml,[native.finalSource]:native.finalHtml};
const overlap=JSON.parse(fs.readFileSync(${JSON.stringify(path.join(here,'citation_overlap_native.json'))}));report.overlapContractSha256=sha(fs.readFileSync(${JSON.stringify(path.join(here,'citation_overlap_native.json'))}));
const parseReads=()=>read('__rw219UI.requests.filter(r=>r.parameters.action==="parse")');
async function setup(bundle,scenario='normal',options={}){await load(bundle,scenario,'classic',{preview:'1',nativeWitness:'1'});await read('(()=>{__rw219UI.nativeParseMap='+JSON.stringify(baseMap)+';__rw219UI.write('+JSON.stringify(native.source)+');return true})()');for(const [key,value]of Object.entries(options)){const selector='input[data-option="'+key+'"]';await openParents(selector);if(await read('document.querySelector('+JSON.stringify(selector)+').checked')!==value)await toggle(selector);}}
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
  for(const bundle of ['core','complete']){
   for(const engine of ['worker','staged'])await test(bundle+'-nested-citation-paired-parse-'+engine,async()=>{
    await setup(bundle,engine==='worker'?'normal':'fallback');const map=Object.fromEntries(Object.keys(overlap.sources).map(key=>[overlap.sources[key],overlap.html[key]]));await read('(()=>{__rw219UI.nativeParseMap='+JSON.stringify(map)+';__rw219UI.write('+JSON.stringify(overlap.sources.original)+');return true})()');await adjust();eq(await read('__rw219UI.read()'),overlap.sources.final,'A nested citation key is repaired first, then a fresh native proof permits moving its enclosing heading reference');eq(await read('RevisaWiki.processing.engine'),engine,'The actual executor receives both source-bound proofs');
    const requests=await parseReads();for(const key of ['original','originalCandidate','repaired','repairedCandidate','final'])ok(requests.some(r=>r.parameters.text===overlap.sources[key]),'The actual preflight/preview requested the native '+key+' source');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),overlap.sources.original,'Undo restores both the initial key and the original heading placement');
   });
   for(const engine of ['worker','staged'])await test(bundle+'-paired-parse-positive-'+engine,async()=>{
    await setup(bundle,engine==='worker'?'normal':'fallback');await adjust();(report.preflightFlows??=[]).push(await read('({requests:__rw219UI.requests,workerJobs:__rw219UI.nativeWitnessJobs,previewChecked:document.querySelector("input[data-option=autoPreview]")?.checked})'));eq(await read('__rw219UI.read()'),native.finalSource,'The exact source-bound paired parse permits moving the citation with all old heading anchors retained');eq(await read('RevisaWiki.processing.engine'),engine,'The actual production executor consumes the proof');
    const requests=await parseReads();ok(requests.some(r=>r.parameters.text===native.source),'The before source reached the actual parse route');ok(requests.some(r=>r.parameters.text===native.candidate),'The candidate reached the actual parse route');ok(requests.some(r=>r.parameters.text===native.finalSource),'The final result with explicit spans reached native preview validation');
    const ids=await read('(()=>{const p=new DOMParser(),a=p.parseFromString('+JSON.stringify(native.beforeHtml)+',"text/html"),b=p.parseFromString('+JSON.stringify(native.finalHtml)+',"text/html");return{before:[...a.querySelectorAll("[id]")].map(n=>n.id),after:[...b.querySelectorAll("[id]")].map(n=>n.id)}})()');ok(ids.before.every(id=>ids.after.includes(id)),'The actually parsed final HTML retains all original effective native IDs');eq(new Set(ids.after).size,ids.after.length,'No final effective ID is duplicated');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),native.source,'Undo restores the exact original draft and citation placement');
   });
   await test(bundle+'-paired-parse-reference-id-refusal',async()=>{
    await setup(bundle);await read('__rw219UI.nativeParseMap['+JSON.stringify(native.candidate)+']='+JSON.stringify(native.candidateHtml.replace('cite&#95;note-nota-a-1','cite&#95;note-nota-a-2')));await adjust();eq(await read('__rw219UI.read()'),native.source,'A deliberately non-equivalent reference ID refuses the move');ok((await parseReads()).some(r=>r.parameters.text===native.candidate),'The refusal occurs after the real candidate request');
   });
   await test(bundle+'-paired-parse-read-failure',async()=>{
    await setup(bundle);await read('__rw219UI.failParse=true');await adjust();eq(await read('__rw219UI.read()'),native.source,'A failed native parse cannot produce a source-bound heading proof');
   });
   await test(bundle+'-paired-parse-stale-draft',async()=>{
    await setup(bundle);await read('__rw219UI.holdNativeParses=true');await click('.ajg-run');await waitFor('__rw219UI.heldNativeParses?.length>0','the actual native parse is held');const newer=native.source+'\nTexto acrescentado pelo editor.';await read('__rw219UI.write('+JSON.stringify(newer)+')');eq(await read('__rw219UI.releaseNativeParses()'),1,'Only the held read is released');await settled();eq(await read('__rw219UI.read()'),newer,'A changed draft rejects the old proof without changing any new byte');eq(await read('__rw219UI.workerResults.length'),0,'No stale source is sent through a completed Worker action');
   });
   for(const flag of ['references','headings','autoPreview'])await test(bundle+'-paired-parse-option-off-'+flag,async()=>{
    await setup(bundle,'normal',{[flag]:false});await adjust();eq(await read('__rw219UI.read()'),native.source,'The disabled preference preserves citation placement');ok(!(await parseReads()).some(r=>r.parameters.text===native.candidate),'The disabled heading path never requests a candidate parse');
   });
   await test(bundle+'-protected-heading-no-candidate',async()=>{
    await setup(bundle,'normal',{autoPreview:false});const source='<nowiki>'+native.source+'</nowiki>';await read('__rw219UI.write('+JSON.stringify(source)+')');await adjust();eq(await read('__rw219UI.read()'),source,'A literal example remains exact');eq((await parseReads()).length,0,'No native heading parse is requested for a protected example');
   });
  }
 }catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}
 finally{
  report.blockedNetwork=driver.blocked||[];report.pageErrors=driver.errors||[];
  try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-session-cleanup',message:String(error.message)});try{await driver.close();}catch{}}
  await new Promise(resolve=>server.close(resolve));report.fullActionCases=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
`;
const adapted=prefix+'\n'+body,compiled=new Module(currentPath,module);compiled.filename=currentPath;compiled.paths=Module._nodeModulePaths(path.dirname(currentPath));
if(process.env.REVISAWIKI_CITATION_COMPILE_ONLY==='1')new(require('node:vm').Script)(adapted,{filename:__filename});
else compiled._compile(adapted,currentPath);
