'use strict';
// Add discussion-specific local scenarios to the same exact native UI harness.
// The production bundles, options, API transport and safety functions stay intact.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const base=path.join(__dirname,'browser_ui.cjs');let source=fs.readFileSync(base,'utf8');
const anchor="  for(const bundle of ['core','complete']){\n   await test(bundle+'-automatic-only-count-bytes-minor-summary-undo',async()=>{";assert.equal(source.split(anchor).length,2);
const extra=String.raw`
  report.additionalRunnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
  report.baseRunnerSha256=sha(fs.readFileSync(${JSON.stringify(base)}));
  for(const bundle of ['core','complete']){
   await test(bundle+'-talk-extra-adjust-canonical-existing-header',async()=>{
    const source='{{pd}}\n{{Página de discussão}}\n== Conversa ==\nTexto literal preservado.\n';
    await load(bundle,'talk','classic',{v2212Source:JSON.stringify(source),nativeWitness:'1',preview:'1'});await adjust();
    eq(await read('__rw219UI.read()'),'{{PD}}\n== Conversa ==\nTexto literal preservado.\n','The ordinary adjustment action normalizes only the duplicate discussion banners');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores all original discussion bytes');await noReviewUI();
   });
   await test(bundle+'-talk-extra-create-code-with-existing-aliases',async()=>{
    const source='{{pd}}\n{{Página de discussão}}\n== Conversa ==\nTexto literal preservado.\n';
    await load(bundle,'talk','classic',{v2212Source:JSON.stringify(source)});await click('.ajg-prepare-talk');
    await waitFor('/Código criado/.test(document.querySelector(".ajg-status").textContent)','The discussion code is created and inserted in one action');await settled();
    const text=await read('__rw219UI.read()');ok(text.startsWith('{{PD}}\n'),'PD remains the first line');
    eq((text.match(/\{\{PD(?:\||}})/g)||[]).length,1,'Valid redirect variants produce only one canonical banner');
    ok(text.includes('{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}'),'Verified article portals supply the project names');
    ok(text.endsWith('== Conversa ==\nTexto literal preservado.\n'),'The existing conversation remains exact');
    eq(await read('__rw219UI.summary()'),'{{PD}}{{Marca de projeto}}','The dedicated discussion action retains its agreed summary');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores aliases, conversation and original spacing');await noReviewUI();
   });
  }
`;
source=source.replace(anchor,extra+anchor);process.env.REVISAWIKI_UI_CASE_FILTER='talk-extra';delete process.env.REVISAWIKI_UI_REAL_WATCHDOG;
const child=new Module(base,module);child.filename=base;child.paths=Module._nodeModulePaths(__dirname);child._compile(source,base);
