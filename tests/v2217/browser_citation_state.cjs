"use strict";
// Native browsers run the unchanged production Worker and writer. Every URL,
// source string and account-like token here is an explicit synthetic fixture.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const base=path.join(__dirname,'browser_ui.cjs');let source=fs.readFileSync(base,'utf8');
const anchor="  for(const bundle of ['core','complete']){\n   await test(bundle+'-automatic-only-count-bytes-minor-summary-undo',async()=>{";assert.equal(source.split(anchor).length,2);
const extra=String.raw`
  report.additionalRunnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
  report.baseRunnerSha256=sha(fs.readFileSync(${JSON.stringify(base)}));
  report.citationStateScope='Current native CS1 state roles and the specialized legacy tweet archive role are tested through actual production Workers and the real UI writer; all source fixtures are fictional.';
  report.citationStateObservations=[];
  for(const bundle of ['core','complete']){
   for(const state of ['live','dead']){
    await test(bundle+'-citation-state-extra-native-cs1-'+state,async()=>{
     const url='https://example.invalid/fonte',archive='https://web.archive.org/web/20240215000000/'+url;
     const original='Texto.<ref>{{cite journal|url='+url+'|title=Fonte de exemplo|archive-url='+archive+'|archive-date=15-02-2024|access-date=20-10-2026|url-status='+state+'}}</ref>\n\n{{Referências}}';
     await setup(bundle,original);await adjust();const text=await read('__rw219UI.read()');
     ok(text!==original,'Independent Portuguese citation migration reaches the actual source editor');
     ok(text.includes('|url-status='+state),'The exact native CS1 live/dead state remains');
     ok(!text.includes('|urlmorta='),'The legacy state role is not introduced into valid native CS1');
     ok(text.includes('|título=Fonte de exemplo')&&!text.includes('|title='),'The independent Portuguese title migration remains enabled');
     ok(text.includes('|arquivourl='+archive)&&text.includes('|url='+url),'Both original and archive URLs remain exact');
     ok(!text.includes('|archive-url=')&&!text.includes('|archive-date=')&&!text.includes('|access-date='),'Independent archive and access parameter migrations are not blocked');
     ok(text.startsWith('Texto.<ref>')&&text.includes('</ref>'),'The surrounding prose and reference remain present');
     eq(await read('RevisaWiki.processing.engine'),'worker','The actual Worker executed the released engine');
     ok(await read('__rw219UI.workerResults.some(row=>row.result?.text===__rw219UI.read()&&Array.isArray(row.result.preservation)&&row.result.preservation.length===0&&row.result.localCompositionSafety?.accepted!==false)'),'The written endpoint is an actually completed, preservation-approved result');
     eq(await read('__rw219UI.summary()'),'Minúcias','The automatic source adjustment uses the requested summary');
     eq(await read('document.getElementById("wpMinoredit").checked'),true,'The automatic source adjustment is minor');
     report.citationStateObservations.push({bundle,consumer:'native-cs1',state,sourceSha256:sha(original),outputSha256:sha(text),actualWorker:true});
     await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores every original citation and URL byte');
     eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores the prior minor preference');
    });
    await test(bundle+'-citation-state-extra-specialized-tweet-'+state,async()=>{
     const url='https://twitter.com/exemplo/status/1234567890',archive='https://web.archive.org/web/20240215000000/'+url,target=state==='dead'?'sim':'não';
     const original='Texto.<ref>{{Citar tweet|url='+url+'|título=Mensagem de exemplo|user=exemplo|number=1234567890|data=2024-01-01|arquivourl='+archive+'|arquivodata=2024-02-15|url-status='+state+'}}</ref>\n\n{{Referências}}';
     await setup(bundle,original);await adjust();const text=await read('__rw219UI.read()');
     ok(text!==original,'The specialized native archive-state correction reaches the actual editor');
     ok(text.includes('|urlmorta='+target)&&!text.includes('|url-status='),'Unsupported modern state delegates to the retained specialized native role');
     ok(text.includes('|url='+url)&&text.includes('|arquivourl='+archive),'Both original and archived tweet URLs remain exact');
     ok(text.includes('|user=exemplo')&&text.includes('|number=1234567890'),'The original message identity remains exact');
     ok(text.startsWith('Texto.<ref>')&&text.includes('</ref>'),'The surrounding prose and reference remain present');
     eq(await read('RevisaWiki.processing.engine'),'worker','The actual Worker executes the specialized correction');
     ok(await read('__rw219UI.workerResults.some(row=>row.result?.text===__rw219UI.read()&&Array.isArray(row.result.preservation)&&row.result.preservation.length===0&&row.result.localCompositionSafety?.accepted!==false)'),'The actual endpoint passes production preservation');
     eq(await read('__rw219UI.summary()'),'Minúcias','The requested automatic summary remains');
     eq(await read('document.getElementById("wpMinoredit").checked'),true,'The source correction is minor');
     report.citationStateObservations.push({bundle,consumer:'specialized-tweet',state,target,sourceSha256:sha(original),outputSha256:sha(text),actualWorker:true});
     await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores the entire original specialized citation');
     eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores the minor preference');
    });
   }
  }
`;
source=source.replace(anchor,extra+anchor);process.env.REVISAWIKI_UI_CASE_FILTER='citation-state-extra';delete process.env.REVISAWIKI_UI_REAL_WATCHDOG;
const child=new Module(base,module);child.filename=base;child.paths=Module._nodeModulePaths(__dirname);child._compile(source,base);
