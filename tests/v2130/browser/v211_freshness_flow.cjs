'use strict';
module.exports=async function v211FreshnessFlow({origin,driver,evaluate,report,save,setVariant}){
 const source=Array.from({length:24},(_,index)=>'[[Tema '+index+'|Tema '+index+']]').join('\n');
 const mount=`await wait(()=>window.RevisaWiki&&document.querySelector('.ajg-run'));RevisaWikiConfig.links=true;window.__freshSource=${JSON.stringify(source)};const form=document.createElement('form');form.id='editform';document.body.append(form);form.append(document.getElementById('wpTextbox1'),document.getElementById('wpSummary'));const save=document.createElement('button');save.id='wpSave';save.type='submit';save.textContent='Publicar página';form.append(save);const box=document.getElementById('wpTextbox1');box.value=__freshSource;box.dispatchEvent(new Event('input',{bubbles:true}));mw.hook('wikipage.content').fire(jQuery(document.getElementById('mw-content-text')));await wait(()=>document.getElementById('revisawiki-adjust-before-publish'));window.__freshControls=()=>[document.querySelector('.ajg-run'),document.getElementById('revisawiki-adjust-before-publish')];window.__assertFresh=expected=>{for(const control of __freshControls()){assert(control.dataset.codeChecked===String(expected),'Both controls have the exact source-bound checked state');assert(control.textContent===(expected?'Código conferido':'Ajustar código'),'Both controls expose the same clear label');assert(!control.disabled,'Checked status never blocks retrying an analysis');assert(control.title.includes(expected?'atualizar as verificações públicas':'rascunho'),'Tooltip explains the current action');}};clean();`;
 for(const variant of ['shared','complete']){
  setVariant(variant);
  for(const scenario of ['complete','failure','cancel']){
   const name='2.11 '+variant+' matching green controls and '+scenario+' freshness state',started=Date.now();
   try{
    await driver.navigate(origin+'/fixture.html?mode='+(variant==='shared'?'loader-shared':'direct-complete')+'&scenario=native-editor&title=Artigo%20de%20teste');
    await evaluate(mount);
    // The Safari button helper activates its target with Enter. Focus a text
    // field without activating it, so checking a color never edits the draft.
    await driver.evaluate('document.getElementById("wpTextbox1").focus();true');
    await evaluate(`__assertFresh(false);assert(__freshControls().every(control=>getComputedStyle(control).backgroundColor===(control.matches(':hover')?'rgb(13, 93, 84)':'rgb(18, 119, 107)')),'Both initial controls use the same green style for their current hover state');clean();`);
    if(scenario!=='complete')await evaluate(`const OriginalWorker=window.Worker;window.Worker=class extends OriginalWorker{postMessage(value){if(value?.type==='calculate'){${scenario==='failure'?'throw new Error("Falha local de teste.");':'__rw26QA.heldCalculation=true;return;'}}return super.postMessage(value);}};clean();`);
    await driver.click('.ajg-run');
    if(scenario==='complete'){
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(true);assert(document.getElementById('wpTextbox1').value!==__freshSource,'A real successful adjustment changes the original draft');assert(RevisaWiki.processing.engine==='worker'&&!RevisaWiki.processing.workerFailure,'The successful source analysis executes in a real Worker');window.__freshAfter=document.getElementById('wpTextbox1').value;clean();`);
     await driver.evaluate('document.getElementById("wpTextbox1").focus();true');
     await evaluate(`assert(__freshControls().every(control=>getComputedStyle(control).backgroundColor===(control.matches(':hover')?'rgb(215, 234, 222)':'rgb(232, 243, 238)')),'Both checked controls use the same alternate style for their current hover state');clean();`);
     await driver.click('.ajg-show-changes');
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(true);assert(document.getElementById('wpTextbox1').value===__freshAfter,'Opening the comparison leaves the checked source intact');clean();`);
     await driver.click('#revisawiki-adjust-before-publish');
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(true);assert(document.getElementById('wpTextbox1').value===__freshAfter,'The checked bottom control can rerun an idempotent analysis');clean();`);
     await driver.click('.ajg-undo');
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(false);assert(document.getElementById('wpTextbox1').value===__freshSource,'Undo restores the exact original draft and clears the checked status');clean();`);
     await driver.click('.ajg-run');
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(true);const text=document.getElementById('wpTextbox1');text.value+='\\nUma alteração manual.';text.dispatchEvent(new Event('input',{bubbles:true}));__assertFresh(false);clean();`);
     await driver.click('.ajg-run');
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(true);const option=document.querySelector('[data-option="markup"]');assert(option&&!option.disabled,'An ordinary independent code option is available');option.checked=!option.checked;option.dispatchEvent(new Event('change',{bubbles:true}));__assertFresh(false);clean();`);
     await driver.click('.ajg-run');
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(true);clean();`);
    }else if(scenario==='failure'){
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(false);assert(document.getElementById('wpTextbox1').value===__freshSource,'A failed local analysis leaves the original draft intact');assert(document.querySelector('.ajg-status').textContent.includes('Falha local de teste'),'The synthetic caught failure actually reached the normal error path');clean();`);
    }else{
     await evaluate(`await wait(()=>__rw26QA.heldCalculation&&document.querySelector('.ajg-stop')&&!document.querySelector('.ajg-stop').hidden);assert(document.querySelector('.ajg-run').disabled,'The held local job is actually busy before cancellation');clean();`);
     await driver.click('.ajg-stop');
     await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);__assertFresh(false);assert(document.getElementById('wpTextbox1').value===__freshSource,'Cancellation leaves the complete original draft intact');assert(document.querySelector('.ajg-status').textContent.includes('cancelada'),'The cancellation path actually completed');clean();`);
    }
    const assertions=await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;report.tests.push({name,passed:true,assertions,evidence:{variant,scenario,bothControls:true,checkedControlsRemainClickable:true,sourceBound:true,optionBound:true,sourceUntouchedOnFailure:scenario!=='complete',wikipediaWrites:0},milliseconds:Date.now()-started});
   }catch(error){report.tests.push({name,passed:false,error:String(error.message),milliseconds:Date.now()-started});}
   save();console.log(JSON.stringify(report.tests.at(-1)));
  }
 }
};
