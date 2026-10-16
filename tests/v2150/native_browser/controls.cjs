'use strict';
// These cases exercise the new native-control contract. They do not emulate a
// remote diff renderer, submit the editor or use a Wikimedia account.
module.exports=async({origin,driver,evaluate,report,hash,save,setVariant})=>{
 const cases=[['direct-button',true],['direct-input',true],['widget-button',true],['widget-input',true],['missing',false],['wrong-name',false],['wrong-type',false],['outside-form',false],['wrong-form',false],['disabled',false,true]];
 for(const variant of ['shared','complete']){
  setVariant(variant);
  for(const [mode,valid,disabled]of cases){const started=Date.now(),name='2.15 native diff control '+variant+' '+mode;
   try{
    await driver.navigate(origin+'/fixture.html?mode='+(variant==='shared'?'loader-shared':'direct-complete')+'&scenario=native-editor&nativeControl='+mode+'&title=Artigo%20de%20teste');
    await evaluate(`await wait(()=>window.RevisaWiki&&document.querySelector('.ajg-run'));window.RevisaWikiConfig={...RevisaWikiConfig,links:true};window.__nativeSource='[[Tema|Tema]]';const editor=document.getElementById('wpTextbox1');editor.value=__nativeSource;editor.dispatchEvent(new Event('input',{bubbles:true}));clean();`);
    await driver.click('.ajg-run');
    await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value==='[[Tema]]','The native-control case uses a handwritten exact source endpoint');assert(RevisaWiki.processing.engine==='worker'&&!RevisaWiki.processing.workerFailure,'The real Worker processes the ordinary source action');const shortcut=document.querySelector('.ajg-show-changes');assert(!!shortcut,'The ordinary action row contains the native shortcut');assert(${disabled?'shortcut.hidden||shortcut.disabled':valid?'!shortcut.hidden&&!shortcut.disabled':'shortcut.hidden'},'The shortcut is available only for a confirmed enabled native diff submit control');assert(document.querySelectorAll('#revisawiki-ptwiki').length===1,'Only one tool panel is mounted');assert(!document.querySelector('.ajg-comparison,.ajg-diff,.ajg-change-choice,.ajg-select-changes'),'Retired custom comparison and selective controls are absent');assert(__rwNativeUI.diffClicks===0&&__rwNativeUI.saveClicks===0&&__rwNativeUI.formSubmits===0,'Adjustment itself activates no native form action');clean();`);
    if(valid){await driver.click('.ajg-show-changes');await evaluate(`assert(__rwNativeUI.diffClicks===1,'The shortcut activates the confirmed native diff control exactly once');assert(document.getElementById('wpTextbox1').value==='[[Tema]]','The native shortcut preserves the complete source endpoint');assert(__rwNativeUI.saveClicks===0&&__rwNativeUI.formSubmits===0,'The shortcut never activates publish or submits the form');clean();`);await driver.click(mode.startsWith('widget')?'#wpDiffWidget [name="wpDiff"]':'#wpDiff');await evaluate(`assert(__rwNativeUI.diffClicks===2,'The ordinary native diff control remains independently usable');assert(__rwNativeUI.saveClicks===0&&__rwNativeUI.formSubmits===0,'Independent native diff activation also remains local');clean();`);}
    await driver.click('.ajg-undo');await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__nativeSource,'Undo restores every original source byte');assert(document.getElementById('wpSummary').value==='','Undo restores the original empty summary');assert(__rwNativeUI.saveClicks===0&&__rwNativeUI.formSubmits===0,'All native-control cases leave publication untouched');clean();`);
    const assertions=Number(await driver.evaluate('__rw26QA.assertions'));report.assertions+=assertions;report.tests.push({name,passed:true,assertions,evidence:{variant,mode,validNativeControl:valid,sourceSha256:hash(Buffer.from('[[Tema|Tema]]')),expectedSha256:hash(Buffer.from('[[Tema]]')),nativeDiffClickStub:true,nativeRemoteDiffRenderingTested:false,exactUndo:true,wikipediaWrites:0},milliseconds:Date.now()-started});
   }catch(error){report.tests.push({name,passed:false,error:String(error.message),milliseconds:Date.now()-started});}
   save();console.log(JSON.stringify(report.tests.at(-1)));
  }
 }
};
