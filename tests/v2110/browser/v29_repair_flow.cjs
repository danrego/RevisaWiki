'use strict';
// The editor and real Worker run the frozen release. Expected local source
// fragments below are written independently of the production repair plans.
const assert=require('node:assert/strict');
module.exports=async function v29RepairFlow({origin,driver,evaluate,report,hash,save,setVariant}){
 const article=body=>"'''Artigo de teste''' reúne dados para uma verificação local.\n\n"+body+'\n\n{{Referências}}\n';
 const span=cell=>'{| class="wikitable"\n! scope="col" | Ano !! scope="col" | Resultado\n|-\n'+cell+'\n|}';
 const tier=leaf=>'{| class="wikitable"\n! colspan="2" | Resultados\n|-\n'+leaf+'\n|-\n| 2000 || Dez\n|}';
 const positives=[
  {id:'mixed-reference',api:'v29ReferenceRepairPlan',rule:'v29MixedReferences',body:'Texto.<ref name="a">Fonte exata.</ref> Outra frase.<ref>Fonte exata.</ref>',expected:'Texto.<ref name="a">Fonte exata.</ref> Outra frase.<ref name="a" />'},
  {id:'anchor-reference',api:'v29ReferenceRepairPlan',rule:'v29AnchorReferences',body:'Texto.<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref><ref name="a" />',expected:'Texto.<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref>'},
  {id:'empty-reference',api:'v29ReferenceRepairPlan',rule:'v29EmptyReferences',body:'Texto.<ref /> Outra frase.<ref></ref>',expected:'Texto. Outra frase.'},
  {id:'extra-reference-closer',api:'v29ReferenceRepairPlan',rule:'v29ReferenceClosers',body:'Texto.<ref>Fonte A.</ref></ref>',expected:'Texto.<ref>Fonte A.</ref>'},
  {id:'official-identifier-url',api:'v29IdentifierPlan',rule:'v29IdentifierUrls',body:'Texto.<ref>{{Citar periódico|titulo=Fonte|pmc=https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/|arxiv=https://arxiv.org/abs/2401.12345v2}}</ref>',expected:'Texto.<ref>{{Citar periódico|titulo=Fonte|pmc=1234567|arxiv=2401.12345v2}}</ref>'},
  {id:'duplicate-cell-attribute',api:'v29TableRepairPlan',rule:'tableDuplicateAttributes',body:span('| colspan="2" colspan="2" | Resultado preservado'),expected:span('| colspan="2" | Resultado preservado')},
  {id:'extra-numeric-quote',api:'v29TableRepairPlan',rule:'tableExtraAttributeQuotes',body:span('| colspan="2"" | Resultado preservado'),expected:span('| colspan="2" | Resultado preservado')},
  {id:'two-tier-leaf-scope',api:'v29TableRepairPlan',rule:'tableLeafHeaderScopes',body:tier('! Ano !! Resultado'),expected:tier('! scope="col" | Ano !! scope="col" | Resultado')}
 ];
 const negatives=[
  {id:'mixed-distinct-body',api:'v29ReferenceRepairPlan',body:'Texto.<ref name="a">Fonte exata.</ref> Outra frase.<ref>Outra fonte.</ref>'},
  {id:'separate-reference-anchors',api:'v29ReferenceRepairPlan',body:'Texto.<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref> e outra frase.<ref name="a" />'},
  {id:'named-empty-reference',api:'v29ReferenceRepairPlan',body:'Texto.<ref group="nota" />'},
  {id:'ambiguous-closer-chain',api:'v29ReferenceRepairPlan',body:'Texto.<ref>Fonte A.</ref></ref></ref>'},
  {id:'nonliteral-identifier-url',api:'v29IdentifierPlan',body:'Texto.<ref>{{Citar periódico|titulo=Fonte|pmc=https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/?download=1|arxiv=https://arxiv.org/abs/2401.12345v0}}</ref>'},
  {id:'conflicting-cell-attribute',api:'v29TableRepairPlan',body:span('| colspan="2" colspan="3" | Resultado preservado')},
  {id:'ambiguous-numeric-quotes',api:'v29TableRepairPlan',body:span('| colspan="2""" | Resultado preservado')},
  {id:'conflicting-leaf-scope',api:'v29TableRepairPlan',body:tier('! scope="row" | Ano !! Resultado')}
 ];
 for(const variant of ['shared','complete'])for(const positive of [true,false]){
  setVariant(variant);const items=positive?positives:negatives,name='2.9 '+variant+' '+(positive?'eight safe automatic repairs':'eight guarded false positives'),started=Date.now(),evidence=[];let checks=0;
  try{for(const item of items){const source=article(item.body),expected=positive?article(item.expected):source;
    await driver.navigate(origin+'/fixture.html?mode='+(variant==='shared'?'loader-shared':'direct-complete')+'&scenario=native-editor&title=Artigo%20de%20teste');
    await evaluate(`await wait(()=>window.RevisaWiki&&document.querySelector('.ajg-run'));window.__v29Source=${JSON.stringify(source)};window.__v29Expected=${JSON.stringify(expected)};const box=document.getElementById('wpTextbox1');box.value=__v29Source;box.dispatchEvent(new Event('input',{bubbles:true}));const cfg={...RevisaWiki.defaults,namespaceNumber:0,pageTitle:'Artigo de teste',authorityControl:false,endTemplateOrder:false,links:false};const plan=RevisaWiki[${JSON.stringify(item.api)}](__v29Source,cfg);assert(${positive?'plan.edits.length>0':'plan.edits.length===0'},'Independent feature case has the expected finite plan eligibility');${positive?'assert(plan.text===__v29Expected,"Pure plan matches the independently written local source output");':''}clean();`);
    await driver.click('.ajg-run');
    await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);window.__v29Actual=document.getElementById('wpTextbox1').value;const result=__rw26QA.workerResults.at(-1).result;assert(RevisaWiki.processing.engine==='worker'&&!RevisaWiki.processing.workerFailure,'Frozen release executes in a real Worker');assert((result.preservation||[]).length===0,'Normal source guards accept the result');assert(__rw26QA.foreignRequests.length===0,'Local syntax repair performs no entity request');${positive?'assert(__v29Actual===__v29Expected,"Actual editor receives the independent exact expected source");assert(result.changes.some(change=>change.id==='+JSON.stringify(item.rule)+'),"Native report identifies the rule that changed source");':'assert(__v29Actual.includes('+JSON.stringify(item.body)+'),"Ambiguous local source remains byte exact");'}window.__v29First=__v29Actual;clean();`);
    const actual=await driver.evaluate('__v29Actual');
    if(positive&&item===items[0]){await driver.click('.ajg-show-changes');await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled&&document.querySelectorAll('.ajg-change').length>0);assert(document.getElementById('wpTextbox1').value===__v29First,'Opening the real comparison keeps editor source unchanged');assert(__rw26QA.workerResults.at(-1).result.hunks.length>0,'Comparison contains actual source hunks');clean();`);}
    await driver.click('.ajg-run');await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__v29First,'Second native click is byte stable');assert(__rw26QA.workerResults.at(-1).result.changes.length===0,'Second click reports no new automatic adjustment');clean();`);
    if(source!==actual){await driver.click('.ajg-undo');await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__v29Source,'Undo restores every original source byte');assert(document.getElementById('wpSummary').value==='','Undo restores the original summary');clean();`);}
    assert.equal(await driver.evaluate("document.getElementById('wpTextbox1').value"),source,'Exact original input remains after Undo or no-op');
    const assertions=await driver.evaluate('__rw26QA.assertions');checks+=assertions;evidence.push({id:item.id,rule:item.rule||null,positive,inputSha256:hash(Buffer.from(source)),expectedSha256:hash(Buffer.from(expected)),outputSha256:hash(Buffer.from(actual)),realWorker:true,idempotent:true,exactUndo:true,assertions});
   }
   report.assertions+=checks;report.tests.push({name,passed:true,assertions:checks,evidence:{cases:evidence,bundle:variant==='shared'?'modular-core':'complete',realWorker:true,wikipediaWrites:0},milliseconds:Date.now()-started});
  }catch(error){report.tests.push({name,passed:false,error:String(error.message),completedCaseEvidence:evidence,milliseconds:Date.now()-started});}
  save();console.log(JSON.stringify(report.tests.at(-1)));
 }
 setVariant('shared');
};
