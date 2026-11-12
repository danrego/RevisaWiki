'use strict';
// One real interval test on the exact release, with the unmodified production
// clock, Worker and writer. Only the completed-result fixture transport waits.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const base=path.join(__dirname,'browser_ui.cjs');let source=fs.readFileSync(base,'utf8');
const anchor="report.noFixedDeadline={elapsedMilliseconds:Date.now()-started,actualWorkerResultHeld:true,productionClockAndCodeUnmodified:true,draftPreservedWhileWaiting:true};await noReviewUI();";
assert.equal(source.split(anchor).length,2);
const extra=String.raw`
   report.targetedRunnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
   report.targetedBaseRunnerSha256=sha(fs.readFileSync(${JSON.stringify(base)}));
   eq(await read('document.getElementById("wpMinoredit").checked'),true,'The verified result retains the ordinary automatic minor behavior');
   report.intervalSubcases=[{id:'actual-interval-result-commit',status:'passed',elapsedMilliseconds:report.noFixedDeadline.elapsedMilliseconds}];
   await click('.ajg-undo');await settled();
   eq(await read('__rw219UI.read()'),plain,'Undo restores all original bytes after the real interval');
   eq(await read('__rw219UI.summary()'),'Resumo anterior.','Undo retains the preexisting manual summary');
   eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores the prior minor flag');
   report.intervalSubcases.push({id:'interval-result-undo',status:'passed'});
   await setup('core',plain,{v2212HoldWorker:'1'});await click('.ajg-run');
   await waitFor('(__rw219UI.heldActualResults||0)===1','A real completed result is pending before cancellation');
   await click('.ajg-stop');await settled();
   eq(await read('__rw219UI.read()'),plain,'Cancellation preserves the complete draft');
   eq(await read('__rw219UI.summary()'),'','Cancellation does not populate a summary');
   eq(await read('document.getElementById("wpMinoredit").checked'),false,'Cancellation does not claim a minor edit');
   await read('__rw219UI.releaseActualResult()');await delay(200);await settled();
   eq(await read('__rw219UI.read()'),plain,'The late actual result cannot overwrite a cancelled draft');
   report.intervalSubcases.push({id:'cancelled-real-result-source-guard',status:'passed'});
   await setup('core',plain,{v2212HoldWorker:'1'});await click('.ajg-run');
   await waitFor('(__rw219UI.heldActualResults||0)===1','A real completed result is pending before a manual edit');
   const manual=plain+'\nAlteração manual posterior.';
   await read('__rw219UI.write('+JSON.stringify(manual)+')');
   await read('__rw219UI.releaseActualResult()');await settled();
   eq(await read('__rw219UI.read()'),manual,'A stale completed result cannot replace a later manual draft');
   eq(await read('__rw219UI.summary()'),'','A rejected stale result does not claim a summary');
   eq(await read('document.getElementById("wpMinoredit").checked'),false,'A rejected stale result does not claim a minor edit');
   report.intervalSubcases.push({id:'manually-edited-draft-source-guard',status:'passed'});
   await noReviewUI();
`;
source=source.replace(anchor,anchor+extra);process.env.REVISAWIKI_UI_CASE_FILTER='actual-worker-result-after-previous-60-second-boundary';process.env.REVISAWIKI_UI_NO_DEADLINE_REAL='1';
const child=new Module(base,module);child.filename=base;child.paths=Module._nodeModulePaths(__dirname);child._compile(source,base);
