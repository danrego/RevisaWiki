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
   await test(bundle+'-talk-extra-bot-cleanup-header-order-no-history',async()=>{
    const source='{{pd}}\n{{Marca de projeto|1|Ciência|3|bot=?/20131103|rev=20140530}}\n== Conversa ==\nMensagem preservada.\n\n{{fusões a avaliar|Tema A|Tema B}}\n{{Traduzido|en|Example|oldid=123}}\n';
    await load(bundle,'talk','classic',{v2212Source:JSON.stringify(source),nativeWitness:'1',preview:'1'});await adjust();
    const text=await read('__rw219UI.read()');
    ok(text.startsWith('{{PD}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123}}\n{{Marca de projeto|?|Ciência|3}}\n{{fusões a avaliar|Tema A|Tema B}}\n'),'Explicit bot cleanup and requested metadata ordering reach the real editor');
    ok(!/\|(?:bot|rev)=/.test(text),'Only the explicit bot record loses assessment markers');
    ok(text.includes('== Conversa ==\nMensagem preservada.'),'The conversation text remains complete');
    eq(await read('__rw219UI.summary()'),'Minúcias','The ordinary adjustment uses the usual summary');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The automatic adjustment is minor');
    const requests=await read('__rw219UI.requests');ok(!requests.some(r=>String(r.parameters.rvlimit)==='50'||r.parameters.rcshow==='bot'||r.parameters.usprop==='groups'),'The new policy does not request assessment history or account group membership');
    await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores every original assessment field and attribution');
    eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores the original discussion minor setting');
   });
   await test(bundle+'-talk-extra-human-rating-and-date-preserved',async()=>{
    const source='{{PD}}\n{{Marca de projeto|3|Ciência|2|rev=20260102}}\nMensagem preservada.\n';
    await load(bundle,'talk','classic',{v2212Source:JSON.stringify(source),nativeWitness:'1',preview:'1'});await adjust();
    eq(await read('__rw219UI.read()'),source,'A botless human assessment and review date remain unchanged');
    await noReviewUI();
   });
   await test(bundle+'-talk-extra-create-code-bot-cleanup-and-order',async()=>{
    const source='{{pd}}\n{{Marca de projeto|1|Física|3|bot=sim|rev=20260102}}\n{{Traduzido|en|Example|oldid=123}}\n== Conversa ==\nMensagem preservada.\n';
    await load(bundle,'talk','classic',{v2212Source:JSON.stringify(source)});await click('.ajg-prepare-talk');
    await waitFor('/Código criado/.test(document.querySelector(".ajg-status").textContent)','The combined discussion action completes');await settled();
    const text=await read('__rw219UI.read()');
    ok(text.startsWith('{{PD}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123}}\n'),'The combined action retains the new header order');
    eq((text.match(/\{\{Marca de projeto/g)||[]).length,1,'Projects remain consolidated');
    ok(text.includes('Física|3')&&text.includes('Tecnologia')&&text.includes('Ciência'),'The existing project importance and added projects remain');
    ok(!/\|(?:bot|rev)=/.test(text),'The combined action follows the explicit bot policy');
    eq(await read('__rw219UI.summary()'),'{{PD}}{{Marca de projeto}}','The dedicated action keeps its own agreed summary');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The automatic header action is minor');
    (report.createCodeMinorObservations??=[]).push({bundle,checked:await read('document.getElementById("wpMinoredit").checked')});
    await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the entire original discussion');
    eq(await read('document.getElementById("wpMinoredit").checked'),false,'Header undo restores the original minor setting');
   });
   await test(bundle+'-talk-extra-explicit-minor-opt-out-preserved',async()=>{
    const source='{{pd}}\n{{PD}}\nMensagem preservada.\n';
    for(const action of ['adjust','create']){
     await load(bundle,'talk','classic',{v2212Source:JSON.stringify(source),nativeWitness:'1',preview:'1'});
     await toggle('#wpMinoredit');await toggle('#wpMinoredit');
     if(action==='adjust')await adjust();
     else{await click('.ajg-prepare-talk');await waitFor('/Código criado/.test(document.querySelector(".ajg-status").textContent)','Header generation completes after manual opt-out');await settled();}
     eq(await read('document.getElementById("wpMinoredit").checked'),false,'The explicit manual minor opt-out survives '+action);
     ok(await read('__rw219UI.read()')!==source,'The automatic metadata changes still apply after '+action+' opt-out');
     await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo still restores the original discussion after '+action);
     eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo retains the manual checkbox preference after '+action);
    }
   });
   await test(bundle+'-talk-extra-create-code-manual-summary-preserved',async()=>{
    const source='{{pd}}\nMensagem preservada.\n';
    await load(bundle,'talk','classic',{v2212Source:JSON.stringify(source)});
    await read('__rw219UI.setSummary("Resumo manual preservado.")');await click('.ajg-prepare-talk');
    await waitFor('/Código criado/.test(document.querySelector(".ajg-status").textContent)','The metadata action completes with an existing summary');await settled();
    eq(await read('__rw219UI.summary()'),'Resumo manual preservado.','A manual summary is never replaced');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The metadata-only source adjustment can still be minor');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.summary()'),'Resumo manual preservado.','Undo preserves the existing manual summary');
    eq(await read('__rw219UI.read()'),source,'Undo restores the complete source');
   });
   await test(bundle+'-talk-extra-independent-image-group-through-worker',async()=>{
    const source='Texto anterior.\n[[Ficheiro:Example.jpg|miniatura|200px|Legenda.]] [[Ficheiro:Example.jpg|miniatura|180px|Outra legenda.]]Texto posterior.\n',expected='Texto anterior.\n\n[[Ficheiro:Example.jpg|miniatura|200px|Legenda.]]\n[[Ficheiro:Example.jpg|miniatura|180px|Outra legenda.]]\n\nTexto posterior.\n';
    await setup(bundle,source);await adjust();eq(await read('__rw219UI.read()'),expected,'The exact standalone image group reaches the native editor');
    eq(await read('document.querySelector(".ajg-result-count").textContent'),'3 ajustes aplicados','Each changed image/prose boundary counts once');
    eq(await read('RevisaWiki.processing.engine'),'worker','The real production Worker applied the source layout');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The source-only adjustment is minor');
    await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores image positions, options and surrounding whitespace exactly');
   });
   await test(bundle+'-talk-extra-quoted-biography-source-preserved',async()=>{
    const source='"{{Infobox person|name=Pessoa fictícia|birth_date=21 de março de 1752|death_date=1837}}\n\'\'\'Pessoa fictícia\'\'\' foi uma inventora.\n"';
    await setup(bundle,source);await adjust();
    eq(await read('__rw219UI.read()'),source,'A quoted source-code example remains exact through the complete production Worker');
    eq(await read('document.getElementById("wpMinoredit").checked'),false,'An unchanged literal example does not acquire minor ownership');
    await noReviewUI();
   });
   await test(bundle+'-talk-extra-quoted-template-independent-fix',async()=>{
    const source='Texto sobre [[Brasil|Brasil]]. A chamada "{{Em construção}}" é um exemplo.',expected='Texto sobre [[Brasil]]. A chamada "{{Em construção}}" é um exemplo.';
    await setup(bundle,source);await adjust();
    eq(await read('__rw219UI.read()'),expected,'A quoted literal call does not block an independent safe link correction');
    await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the literal example and independent source exactly');
   });

  }
`;
source=source.replace(anchor,extra+anchor);process.env.REVISAWIKI_UI_CASE_FILTER='talk-extra';delete process.env.REVISAWIKI_UI_REAL_WATCHDOG;
const child=new Module(base,module);child.filename=base;child.paths=Module._nodeModulePaths(__dirname);child._compile(source,base);
