'use strict';
// This standalone local UI contract reuses the native browser adapter. Only
// the exact loopback-host allowlist and synthetic read replies are adapted.
// Run it after any other native browser suite has released its session.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const here=__dirname,currentPath=path.resolve(here,'../v219/browser/current_ui.cjs'),current=fs.readFileSync(currentPath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(current.split(anchor).length!==2)throw new Error('The exact native browser harness entry point changed');
let prefix=current.slice(0,current.indexOf(anchor)).replaceAll('2.19.0','2.20.0').replaceAll('2_19_0','2_20_0').replaceAll('expected_release_v2190.json','expected_release_v2200.json');
prefix=prefix.replaceAll('source:window.__rw219UI?.read(),','source:window.__rw219UI?.read(),foreignReads:window.__rw219UI?.foreignReads,');
prefix=prefix.replaceAll("path.join(__dirname,'current_fixture.js')","path.join(__dirname,'../../v220/bio_ui_fixture.js')");

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
report.kind='native-ui-generic-infobox-person-preflight';
report.scope='Actual UI preflight, bioSource-bound Q5 proof, production Worker/staged engine, editor apply and undo. The fictional Wikidata reply follows the public entity schema; it is not evidence about any real article.';
report.originalBrowserHarnessSha256=sha(fs.readFileSync(${JSON.stringify(currentPath)}));
report.runnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
report.fixtureScriptSha256=sha(fs.readFileSync(${JSON.stringify(path.join(here,'bio_ui_fixture.js'))}));
const bioSource='{{Info|título=Pessoa fictícia|rótulo1=Nome|dados1=Pessoa fictícia}}\n\nTexto fictício.';
const bioExpected=bioSource+'\n\n{{Portal3|Biografias}}\n';
async function setup(bundle,scenario='normal',flags={}){
 await load(bundle,scenario,'classic');await read('(()=>{__rw219UI.write('+JSON.stringify(bioSource)+');return true})()');
 for(const [key,value]of Object.entries({authorityControl:false,automaticTopicPortals:false,biographyPortal:false,...flags})){
  const selector='input[data-option="'+key+'"]';await openParents(selector);if(await read('document.querySelector('+JSON.stringify(selector)+').checked')!==value)await toggle(selector);
 }
}
async function foreignInvariant(){
 const rows=await read('__rw219UI.foreignReads||[]');
 ok(rows.every(r=>r.endpoint==='https://www.wikidata.org/w/api.php'&&r.anonymous&&r.method==='GET'&&r.parameters.action==='wbgetentities'&&r.parameters.ids==='Q123'),'All foreign-API adapter requests are anonymous entity reads for the bound fictional item');
}
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
  for(const bundle of ['core','complete']){
   for(const engine of ['worker','staged'])await test(bundle+'-generic-person-positive-'+engine,async()=>{
    await setup(bundle,engine==='worker'?'normal':'fallback');await adjust();eq(await read('__rw219UI.read()'),bioExpected,'The exact independently written endpoint includes the biography portal');eq(await read('RevisaWiki.processing.engine'),engine,'The production executor consumes the UI-created proof');
    const rows=await read('__rw219UI.foreignReads||[]');eq(rows.length,1,'Exactly one anonymous entity read confirms the person');await foreignInvariant();
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),bioSource,'Undo restores the exact original draft');
    await adjust();eq(await read('__rw219UI.read()'),bioExpected,'A second application receives a new proof for the exact restored draft');eq(await read('(__rw219UI.foreignReads||[]).length'),1,'The read-only entity cache avoids a duplicate request while the bioSource binding is refreshed');
   });
   for(const [name,mutate]of [
    ['nonhuman','__rw219UI.humanEntity.claims.P31[0].mainsnak.datavalue.value={"entity-type":"item",id:"Q43229","numeric-id":43229}'],
    ['wrong-sitelink','__rw219UI.humanEntity.sitelinks.ptwiki.title="Outro tema"'],
    ['deprecated','__rw219UI.humanEntity.claims.P31[0].rank="deprecated"'],
    ['qualified','__rw219UI.humanEntity.claims.P31[0].qualifiers={P580:[{}]}'],
    ['read-failure','__rw219UI.foreignFailure=true']
   ])await test(bundle+'-generic-person-refusal-'+name,async()=>{
    await setup(bundle);await read('(()=>{'+mutate+';return true})()');await adjust();eq(await read('__rw219UI.read()'),bioSource,'Unconfirmed identity leaves every bioSource byte intact');await foreignInvariant();
   });
   await test(bundle+'-generic-person-no-item',async()=>{
    await setup(bundle);await read('mw.config.set("wgWikibaseItemId",null)');await adjust();eq(await read('__rw219UI.read()'),bioSource,'No linked item means no invented person proof');eq(await read('(__rw219UI.foreignReads||[]).length'),0,'No entity is guessed or searched');
   });
   await test(bundle+'-generic-person-option-off',async()=>{
    await setup(bundle,'normal',{automaticBiographyPortals:false});await adjust();eq(await read('__rw219UI.read()'),bioSource,'The disabled preference preserves the bioSource');eq(await read('(__rw219UI.foreignReads||[]).length'),0,'The disabled path performs no identity read');
   });
   await test(bundle+'-generic-person-stale-draft',async()=>{
    await setup(bundle);await read('__rw219UI.holdForeignRead=true');await click('.ajg-run');await waitFor('__rw219UI.heldForeignReads?.length>0','the actual identity read is held');
    const newer=bioSource+'\nTexto acrescentado pelo editor.';await read('__rw219UI.write('+JSON.stringify(newer)+')');eq(await read('__rw219UI.releaseForeignReads()'),1,'Only the owned held read is released');await settled();eq(await read('__rw219UI.read()'),newer,'A stale identity result never overwrites the new draft or adds a portal');await foreignInvariant();
   });
   await test(bundle+'-generic-person-protected-owner',async()=>{
    await setup(bundle);const literal='<nowiki>'+bioSource+'</nowiki>';await read('__rw219UI.write('+JSON.stringify(literal)+')');await adjust();eq(await read('__rw219UI.read()'),literal,'A protected template example remains exact');eq(await read('(__rw219UI.foreignReads||[]).length'),0,'A protected example does not request a person lookup');
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
if(process.env.REVISAWIKI_BIO_UI_COMPILE_ONLY==='1')new(require('node:vm').Script)(adapted,{filename:__filename});
else compiled._compile(adapted,currentPath);
