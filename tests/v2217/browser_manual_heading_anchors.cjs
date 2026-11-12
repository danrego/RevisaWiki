'use strict';
// Synthetic drafts run through the production source editor; no remote requests.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const base=path.join(__dirname,'browser_ui.cjs');let source=fs.readFileSync(base,'utf8');
const anchor="  for(const bundle of ['core','complete']){\n   await test(bundle+'-automatic-only-count-bytes-minor-summary-undo',async()=>{";assert.equal(source.split(anchor).length,2);
const extra=String.raw`
  report.additionalRunnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
  report.baseRunnerSha256=sha(fs.readFileSync(${JSON.stringify(base)}));
  report.manualHeadingAnchorScope='Real Worker and staged source-editor writers preserve linked old heading identities while applying independent source repairs. Local APIs do not certify live native heading resolution.';
  report.manualHeadingAnchorObservations=[];
  for(const bundle of ['core','complete'])for(const engine of ['worker','staged']){
   await test(bundle+'-manual-heading-anchor-extra-basic-'+engine,async()=>{
    const body='Veja [[#See_also|a lista]].\n\n== See also ==\n* [[Brasil]]\n',original='{{Descrição curta|Exemplo}}\n'+body;
    await setup(bundle,original,{},engine);await adjust();const text=await read('__rw219UI.read()');
    eq(text,body,'The linked old title and authored link remain exact while the independent removal applies');
    eq(await read('RevisaWiki.processing.engine'),engine,'The selected real production writer executes');
    eq(await read('__rw219UI.summary()'),'Minúcias','The source summary remains exact');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The retained source edit is minor');
    eq(await read('document.querySelector(".ajg-result-count").textContent'),'1 ajuste aplicado','Only the retained removal counts');
    await noReviewUI();report.manualHeadingAnchorObservations.push({bundle,engine,fixture:'basic',sourceSha256:sha(original),outputSha256:sha(text),actualUIWriter:true});
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores the complete original draft');
   });
   await test(bundle+'-manual-heading-anchor-extra-masked-url-'+engine,async()=>{
    const original='{{Descrição curta|Exemplo}}\nVeja {{URL|1=pt.wikipedia.org/wiki/Teste_de_seções#See_also|2=a lista}}.\n\n== See also ==\n* [[Brasil]]\n\n== External links ==\n* [https://example.invalid Exemplo]\n',expected=original.replace('{{Descrição curta|Exemplo}}\n','').replace('== External links ==','== Ligações externas ==');
    await setup(bundle,original,{},engine);await adjust();const text=await read('__rw219UI.read()');
    eq(text,expected,'A masked native URL helper keeps its old target while the unrelated heading and description are adjusted');
    eq(await read('RevisaWiki.processing.engine'),engine,'The selected masked-input production writer executes');
    eq(await read('__rw219UI.summary()'),'Minúcias','The retained summary stays exact');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The independent changes are minor');
    eq(await read('document.querySelector(".ajg-result-count").textContent'),'2 ajustes aplicados','Both actual independent changes count');
    await noReviewUI();report.manualHeadingAnchorObservations.push({bundle,engine,fixture:'masked-url',sourceSha256:sha(original),outputSha256:sha(text),actualUIWriter:true});
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores the exact full URL-helper draft');
   });
   await test(bundle+'-manual-heading-anchor-extra-numbered-refs-'+engine,async()=>{
    const original='{{Descrição curta|Exemplo}}\nTexto.<ref name=":0">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n=== Seção<ref name=":0"/> ===\n# Primeiro item\n# [[Ficheiro:Exemplo.png|miniatura|Legenda.]]Segundo item\n\n== Referências ==\n{{Reflist}}\n',expected='Texto.<ref name="Exemplo2020-1">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n=== Seção<ref name="Exemplo2020-1" /> ===\n# Primeiro item\n# [[Ficheiro:Exemplo.png|miniatura|Legenda.]]Segundo item\n\n{{Referências}}\n';
    await setup(bundle,original,{},engine);await adjust();const text=await read('__rw219UI.read()');
    eq(text,expected,'Only actual numbered-list prefixes are ignored while reference names and the preferred collector are repaired');
    eq(await read('RevisaWiki.processing.engine'),engine,'The selected real numbered-list writer executes');
    eq(await read('__rw219UI.summary()'),'Minúcias','The numbered-list edit summary remains exact');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The retained reference repairs are minor');
    ok(await read('/^[1-9]\\d* ajustes? aplicados?$/.test(document.querySelector(".ajg-result-count").textContent)'),'The UI reports only a positive numeric applied-adjustment count');
    await noReviewUI();report.manualHeadingAnchorObservations.push({bundle,engine,fixture:'numbered-refs',sourceSha256:sha(original),outputSha256:sha(text),actualUIWriter:true});
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores the complete numbered-list draft including its exact image and caption');
   });
   await test(bundle+'-manual-heading-anchor-extra-partial-'+engine,async()=>{
    const original='{{Descrição curta|Exemplo}}\n==See also==\n* [[Brasil]]\n',expected='== See also ==\n* [[Brasil]]\n';
    await setup(bundle,original,{section:'1'},engine);await adjust();const text=await read('__rw219UI.read()');
    eq(text,expected,'A real partial editor retains the old heading identity and still permits safe padding and removal');
    eq(await read('RevisaWiki.processing.engine'),engine,'The selected partial source path executes');
    if(engine==='worker')ok(await read('__rw219UI.nativeWitnessJobs.some(m=>m.job?.options?.sectionOnly===true)'),'The actual Worker job receives the supported partial-source flag');
    eq(await read('__rw219UI.summary()'),'Minúcias','The partial source summary stays exact');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The retained partial changes are minor');
    eq(await read('document.querySelector(".ajg-result-count").textContent'),'2 ajustes aplicados','Only the two retained partial source changes count');
    await noReviewUI();report.manualHeadingAnchorObservations.push({bundle,engine,fixture:'partial',sourceSha256:sha(original),outputSha256:sha(text),actualUIWriter:true});
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),original,'Undo restores the exact partial draft');
   });
  }
`;
source=source.replace(anchor,extra+anchor);process.env.REVISAWIKI_UI_CASE_FILTER='manual-heading-anchor-extra';delete process.env.REVISAWIKI_UI_REAL_WATCHDOG;
const child=new Module(base,module);child.filename=base;child.paths=Module._nodeModulePaths(__dirname);child._compile(source,base);
