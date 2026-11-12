"use strict";
// Native local browsers execute unchanged production Worker and staged paths.
// Fixtures are synthetic. No publication, account access or remote requests.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const base=path.join(__dirname,'browser_ui.cjs');let source=fs.readFileSync(base,'utf8');
const anchor="  for(const bundle of ['core','complete']){\n   await test(bundle+'-automatic-only-count-bytes-minor-summary-undo',async()=>{";assert.equal(source.split(anchor).length,2);
const extra=String.raw`
  report.additionalRunnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
  report.baseRunnerSha256=sha(fs.readFileSync(${JSON.stringify(base)}));
  report.manualCiteAnchorScope='Real production Worker and staged source-editor paths retain authored note identities while applying independent corrections. Local synthetic APIs do not certify live rendered Wikipedia fragment resolution.';
  report.manualCiteAnchorObservations=[];
  for(const bundle of ['core','complete'])for(const engine of ['worker','staged']){
   await test(bundle+'-manual-cite-anchor-extra-basic-'+engine,async()=>{
    const body='Texto.<ref name=":0">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite_note-:0-1|a nota]].\n\n{{Referências}}\n',original='{{Descrição curta|Exemplo}}\n'+body;
    await setup(bundle,original,{},engine);await adjust();const text=await read('__rw219UI.read()');
    eq(text,body,'The exact authored link and original reference source remain; only obsolete description removed');
    eq(await read('RevisaWiki.processing.engine'),engine,'The requested real production path executed');
    eq(await read('__rw219UI.summary()'),'Minúcias','The default source-edit summary stays exact');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The actual safe source edit is minor');
    eq(await read('document.querySelector(".ajg-result-count").textContent'),'1 ajuste aplicado','Only the actual retained change counts');
    await noReviewUI();report.manualCiteAnchorObservations.push({bundle,engine,fixture:'basic',sourceSha256:sha(original),outputSha256:sha(text),actualUIWriter:true});
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores the exact complete source');
   });
   for(const [carrier,consumer] of [
    ['bare-url','https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1'],
    ['named-url-helper','{{URL|1=pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|2=a nota}}']
   ])await test(bundle+'-manual-cite-anchor-extra-'+carrier+'-'+engine,async()=>{
    const body='Texto.<ref name=":0">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja '+consumer+'.\n\n{{Referências}}\n',original='{{Descrição curta|Exemplo}}\n'+body;
    await setup(bundle,original,{},engine);await adjust();const text=await read('__rw219UI.read()');
    eq(text,body,'The literal consumer and reference identity remain exact while independent removal applies');
    eq(await read('RevisaWiki.processing.engine'),engine,'The requested production writer executed');
    eq(await read('__rw219UI.summary()'),'Minúcias','The summary remains exact');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The retained source correction is minor');
    eq(await read('document.querySelector(".ajg-result-count").textContent'),'1 ajuste aplicado','Only the retained independent correction counts');
    await noReviewUI();report.manualCiteAnchorObservations.push({bundle,engine,fixture:carrier,sourceSha256:sha(original),outputSha256:sha(text),actualUIWriter:true});
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores the complete authored source');
   });
   await test(bundle+'-manual-cite-anchor-extra-nested-box-'+engine,async()=>{
    const original='{{Descrição curta|Exemplo}}\n{{Info/Biografia|nome=Pessoa Exemplo|imagem=Exemplo.jpg|ocupação=Ator|notas=<ref name=":0">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>}}\n\nTexto, <ref name=":0"/> veja [[#cite_note-:0-1|a nota]].\n\n{{Referências}}\n';
    await setup(bundle,original,{},engine);await adjust();const text=await read('__rw219UI.read()');
    ok(text.includes('{{Info/Biografia\n'),'Independent infobox formatting remains enabled');
    ok(/\|ocupação\s*=\s*ator/.test(text),'Independent occupation capitalization correction remains enabled');
    ok(!text.includes('{{Descrição curta'),'Independent obsolete description removal remains enabled');
    ok(text.includes('<ref name=":0">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>'),'The complete nested literal reference stays byte-exact');
    ok(text.includes('<ref name=":0"/>')&&text.includes('[[#cite_note-:0-1|a nota]]'),'Reuse and authored target remain exact');
    eq(await read('RevisaWiki.processing.engine'),engine,'The requested production path executed');
    await noReviewUI();report.manualCiteAnchorObservations.push({bundle,engine,fixture:'nested-box',sourceSha256:sha(original),outputSha256:sha(text),actualUIWriter:true});
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores every nested source byte');
   });
   await test(bundle+'-manual-cite-anchor-extra-partial-source-'+engine,async()=>{
    const original='{{Descrição curta|Exemplo}}\nTexto.<ref name=":0">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n{{Referências}}\n';
    await setup(bundle,original,{section:'1'},engine);await adjust();const text=await read('__rw219UI.read()');
    ok(text.includes('<ref name=":0">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>'),'A real partial editor does not rename a note whose manual links may be outside the section');
    ok(!text.includes('{{Descrição curta'),'The independent local correction still reaches the editor');
    eq(await read('RevisaWiki.processing.engine'),engine,'The requested partial-source production path executed');
    if(engine==='worker')ok(await read('__rw219UI.nativeWitnessJobs.some(m=>m.job?.options?.sectionOnly===true)'),'The real UI dispatch explicitly identifies partial source');
    await noReviewUI();report.manualCiteAnchorObservations.push({bundle,engine,fixture:'partial-source',sourceSha256:sha(original),outputSha256:sha(text),actualUIWriter:true});
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores the exact partial draft');
   });
  }
`;
source=source.replace(anchor,extra+anchor);process.env.REVISAWIKI_UI_CASE_FILTER='manual-cite-anchor-extra';delete process.env.REVISAWIKI_UI_REAL_WATCHDOG;
const child=new Module(base,module);child.filename=base;child.paths=Module._nodeModulePaths(__dirname);child._compile(source,base);
