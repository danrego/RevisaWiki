'use strict';
// Local native-browser regression for the existing collector-heading contract.
// Only synthetic source/editor fixtures are used. Production Workers, writers,
// clocks, source ownership and preservation checks remain unchanged.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const base=path.join(__dirname,'browser_ui.cjs');let source=fs.readFileSync(base,'utf8');
const anchor="  for(const bundle of ['core','complete']){\n   await test(bundle+'-automatic-only-count-bytes-minor-summary-undo',async()=>{";
assert.equal(source.split(anchor).length,2);
const extra=String.raw`
  report.additionalRunnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
  report.baseRunnerSha256=sha(fs.readFileSync(${JSON.stringify(base)}));
  report.manualHeadingObservations=[];
  report.manualHeadingScope='Four synthetic collector cases per bundle execute actual production Workers in fresh editor sessions. Unknown manual parent titles and later bibliography headings retain their roles; canonical reference headings keep one rendered title.';
  report.actualManualHeadingAdjustmentActions=0;
  const sourcePrefix='Texto.<ref name=":0">{{Citar livro|título=Obra|data=1992-4-5|editora=Editora|isbn=9780306406157|}}</ref>\n\n';
  const fixtureCases=[
   {id:'plain-legacy',renderer:'{{Reflist}}',source:sourcePrefix+'== Fontes ==\n{{Reflist}}\n\n== Referências ==\n* Obra bibliográfica.\n',manual:true},
   {id:'plain-native',renderer:'<references/>',source:sourcePrefix+'== Fontes ==\n<references/>\n\n== Referências ==\n* Obra bibliográfica.\n',manual:true},
   {id:'numeric-legacy',renderer:'{{Reflist|2}}',source:sourcePrefix+'== Fontes ==\n{{Reflist|2}}\n\n== Referências ==\n* Obra bibliográfica.\n',manual:true},
   {id:'canonical-manual-control',renderer:'{{Reflist|2}}',source:'Texto.<ref>Fonte.</ref>\n\n== Referências ==\n{{Reflist|2}}\n',manual:false}
  ];
  function headingContract(text,fixture,requireConverted){
   if(fixture.manual){
    eq((text.match(/^== Fontes ==$/gm)||[]).length,1,'The original manual parent title remains exactly once');
    eq((text.match(/^== Referências ==$/gm)||[]).length,1,'The later bibliography title remains exactly once');
    ok(text.endsWith('== Referências ==\n* Obra bibliográfica.\n'),'The bibliography section and its content remain exact');
    const start=text.indexOf('== Fontes ==\n')+'== Fontes ==\n'.length,end=text.indexOf('\n== Referências ==',start),block=text.slice(start,end).trim();
    ok(end>start,'The two original section boundaries retain their order');
    const converted=block==='{{Referências|nível=0}}';
    ok(converted||block===fixture.renderer,'An original collector or its exact heading-free replacement occupies the manual section');
    if(requireConverted)ok(converted,'A fresh second session reaches the exact nível=0 replacement');
    if(block!==fixture.renderer)eq(block,'{{Referências|nível=0}}','Whenever conversion occurs, it cannot introduce another automatic title');
    ok(!/Referências_2|Refer.C3.AAncias_2/.test(text),'No duplicate-title suffix is introduced into source links');
    return{converted,manualHeadings:2,collectorBlockSha256:sha(block)};
   }
   const headings=(text.match(/^== Referências ==$/gm)||[]).length;
   const explicit=(text.match(/\{\{Referências\|nível=0}}/g)||[]).length;
   const automatic=(text.match(/\{\{Referências}}/g)||[]).length;
   const original=(text.match(/\{\{Reflist\|2}}/g)||[]).length;
   eq(headings+automatic,1,'The canonical manual control has exactly one effective section title');
   eq(explicit+automatic+original,1,'The canonical control retains exactly one collector');
   if(requireConverted)eq(original,0,'The canonical control completes its retained conversion path');
   if(automatic)eq(headings,0,'An automatic canonical title replaces, rather than duplicates, the matching manual title');
   return{converted:original===0,manualHeadings:headings,automaticHeadings:automatic};
  }
  async function actualAction(bundle,initial,fixture,pass){
   await setup(bundle,initial);
   const oldSummary=await read('__rw219UI.summary()'),oldMinor=await read('document.getElementById("wpMinoredit").checked');
   await adjust();report.actualManualHeadingAdjustmentActions++;
   const text=await read('__rw219UI.read()'),changed=text!==initial;
   const contract=headingContract(text,fixture,pass>=2);
   eq(await read('RevisaWiki.processing.engine'),'worker','The current production Worker executes this fresh-session adjustment');
   ok(await read('__rw219UI.workerStarts>0'),'A real Worker was started in the current editor session');
   ok(text.startsWith('Texto.<ref'),'The original prose/reference opening remains present');
   if(changed){
    ok(await read('__rw219UI.workerResults.some(row=>row.result?.text===__rw219UI.read()&&Array.isArray(row.result.preservation)&&row.result.preservation.length===0&&row.result.localCompositionSafety?.accepted!==false)'),'The actual written endpoint has passed production preservation');
    eq(await read('__rw219UI.summary()'),'Minúcias','The automatic syntax correction uses the agreed summary');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'The automatic correction is marked minor');
   }else{
    eq(await read('__rw219UI.summary()'),oldSummary,'An unchanged result leaves the existing summary exact');
    eq(await read('document.getElementById("wpMinoredit").checked'),oldMinor,'An unchanged result leaves the minor preference exact');
   }
   await noReviewUI();
   if(changed){
    await click('.ajg-undo');await settled();
    eq(await read('__rw219UI.read()'),initial,'Undo restores the entire fresh-session draft');
    eq(await read('__rw219UI.summary()'),oldSummary,'Undo restores the original summary');
    eq(await read('document.getElementById("wpMinoredit").checked'),oldMinor,'Undo restores the original minor preference');
   }
   return{text,changed,contract};
  }
  for(const bundle of ['core','complete'])for(const fixture of fixtureCases){
   await test(bundle+'-manual-heading-extra-'+fixture.id,async()=>{
    const first=await actualAction(bundle,fixture.source,fixture,1);
    const second=await actualAction(bundle,first.text,fixture,2);
    const third=await actualAction(bundle,second.text,fixture,3);
    eq(third.text,second.text,'The second and third fresh-session endpoints are identical');
    eq(third.changed,false,'A third fresh session introduces no further correction');
    ok(first.changed||second.changed,'The original legacy/native fixture received its actual automatic repair');
    report.manualHeadingObservations.push({bundle,fixture:fixture.id,sourceSha256:sha(fixture.source),firstOutputSha256:sha(first.text),secondOutputSha256:sha(second.text),thirdOutputSha256:sha(third.text),firstChanged:first.changed,secondChanged:second.changed,thirdChanged:third.changed,freshSessions:3,actualWorker:true,manualHeadingRetained:fixture.manual?first.contract.manualHeadings===2&&second.contract.manualHeadings===2&&third.contract.manualHeadings===2:true,secondCollectorConverted:second.contract.converted,thirdIdempotent:second.text===third.text});
   });
  }
`;
source=source.replace(anchor,extra+anchor);
process.env.REVISAWIKI_UI_CASE_FILTER='manual-heading-extra';
delete process.env.REVISAWIKI_UI_REAL_WATCHDOG;
const child=new Module(base,module);child.filename=base;child.paths=Module._nodeModulePaths(__dirname);child._compile(source,base);
