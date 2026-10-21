'use strict';
// Reuse the current localhost fixture and exact production host adaptation.
// Only the explicit fictional native-query response varies between cases.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const currentPath=path.join(__dirname,'current_ui.cjs'),current=fs.readFileSync(currentPath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(current.split(anchor).length!==2)throw new Error('The exact current harness entry point changed');
const prefix=current.slice(0,current.indexOf(anchor)),body=String.raw`
report.kind='native-ui-source-bound-heading-lookup';report.scope='Actual production prepareHeadingMainArticles lookup, source guard and editor action with explicitly fictional read-only native-query responses.';report.fixtureResponseMutation='Optional queryPageOverrides changes only a named fictional page response; production methods remain intact.';report.headingContractSha256=sha(fs.readFileSync(path.join(__dirname,'../heading_lookup_contract.json')));report.predecessorSourceRuleIds=['b.wikify.8','b.wikify.9'];
const target='Tema secundário',headingSource=(piped=false)=>'== [['+target+(piped?'|Título literal':'')+']] ==\nTexto preservado.',headingExpected=(piped=false)=>'== '+(piped?'Título literal':target)+' ==\n{{Artigo principal|'+target+'}}\nTexto preservado.';
const headingQueries=()=>read('__rw219UI.requests.filter(r=>r.parameters.action==="query"&&r.parameters.prop==="pageprops"&&r.parameters.titles==='+JSON.stringify(target)+')');
async function setup(bundle,text){await load(bundle);await read('__rw219UI.write('+JSON.stringify(text)+')');}
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
  for(const bundle of ['core','complete']){
   for(const piped of [false,true])await test(bundle+'-native-query-positive-'+(piped?'piped':'plain'),async()=>{
    await setup(bundle,headingSource(piped));await adjust();eq(await read('__rw219UI.read()'),headingExpected(piped),'The real preflight supplies a fresh same-target main-namespace existence proof before the exact heading/remission edit');eq((await headingQueries()).length,1,'The production query route was actually reached');eq(await read('RevisaWiki.processing.engine'),'worker','The native Worker consumes the actual source-bound lookup result');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),headingSource(piped),'Undo restores the exact original linked heading');
   });
   for(const [id,mutation]of [['missing',{pageid:-1,missing:true}],['disambiguation',{pageprops:{disambiguation:''}}],['other-namespace',{ns:10}],['invalid',{pageid:-1,invalid:true}]])await test(bundle+'-native-query-refusal-'+id,async()=>{
    await setup(bundle,headingSource());await read('__rw219UI.queryPageOverrides={'+JSON.stringify(target)+':'+JSON.stringify(mutation)+'}');await adjust();eq((await headingQueries()).length,1,'The lookup reached the controlled non-confirming response');eq(await read('__rw219UI.read()'),headingSource(),'A non-confirming target response cannot create a remission or remove the source heading link');
   });
   await test(bundle+'-native-query-failure',async()=>{await setup(bundle,headingSource());await read('__rw219UI.failQuery=true');await adjust();eq((await headingQueries()).length,1,'The real lookup attempted the explicit read failure');eq(await read('__rw219UI.read()'),headingSource(),'A failed lookup preserves the full source');});
   await test(bundle+'-self-target-refusal',async()=>{const raw='== [[Tema fictício]] ==\nTexto preservado.';await setup(bundle,raw);await adjust();eq(await read('__rw219UI.read()'),raw,'A section cannot acquire a remission to its own article');});
   for(const gate of ['headings','links'])await test(bundle+'-native-query-off-'+gate,async()=>{
    await setup(bundle,headingSource());const selector='input[data-option="'+gate+'"]';await openParents(selector);eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),true,'The explicit production preference begins enabled');await toggle(selector);await adjust();eq(await read('__rw219UI.read()'),headingSource(),'The actual disabled preference preserves the full source');eq((await headingQueries()).length,0,'The disabled route performs no heading-target lookup');
   });
   await test(bundle+'-native-query-stale-source',async()=>{
    await setup(bundle,headingSource());await read('__rw219UI.holdHeadingQueries=true');await click('.ajg-run');await waitFor('__rw219UI.heldHeadingQueries?.length>0','the actual heading query is explicitly held by the local transport');const newer=headingSource()+'\nTexto novo.';await read('__rw219UI.write('+JSON.stringify(newer)+')');eq(await read('__rw219UI.releaseHeadingQueries()'),1,'Exactly the held real preflight response is released after the draft changes');await settled();eq(await read('__rw219UI.read()'),newer,'A source change during the lookup prevents the stale proof from changing any draft byte');eq(await read('__rw219UI.workerResults.length'),0,'A stale lookup cannot dispatch a Worker result for the old source');
   });
   await test(bundle+'-protected-heading-no-query',async()=>{const raw='<code>'+headingSource()+'</code>';await setup(bundle,raw);await adjust();eq(await read('__rw219UI.read()'),raw,'A literal code example keeps every heading/link byte');eq((await headingQueries()).length,0,'A protected heading never enters the lookup route');});
  }
 }catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}
 finally{
  report.blockedNetwork=driver.blocked||[];report.pageErrors=driver.errors||[];
  try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-session-cleanup',message:String(error.message)});try{await driver.close();}catch{}}
  await new Promise(resolve=>server.close(resolve));report.fullActionCases=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
`;
const adapted=prefix+'\nreport.baselineHarnessSha256='+JSON.stringify(crypto.createHash('sha256').update(current).digest('hex'))+';\nreport.harnessAdaptation="Current fixture and exact host-only adaptation, with source-bound heading lookup cases replacing the ordinary case body.";\n'+body;
if(process.env.REVISAWIKI_HEADING_COMPILE_ONLY==='1')new(require('node:vm').Script)(adapted,{filename:__filename});
else{const compiled=new Module(__filename,module);compiled.filename=__filename;compiled.paths=module.paths;compiled._compile(adapted,__filename);}
