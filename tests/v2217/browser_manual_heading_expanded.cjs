'use strict';
// Expanded local native-browser probe. Expected full endpoints and effective
// heading outlines are separate frozen fixtures, not product detector output.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const base=path.join(__dirname,'browser_ui.cjs'),fixtureFile=path.join(__dirname,'browser_manual_heading_expanded_fixtures.json');let source=fs.readFileSync(base,'utf8');
const anchor="  for(const bundle of ['core','complete']){\n   await test(bundle+'-automatic-only-count-bytes-minor-summary-undo',async()=>{";assert.equal(source.split(anchor).length,2);
const extra=String.raw`
 report.additionalRunnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
 report.baseRunnerSha256=sha(fs.readFileSync(${JSON.stringify(base)}));
 const fixtureBytes=fs.readFileSync(${JSON.stringify(fixtureFile)}),fixtureBook=JSON.parse(fixtureBytes);report.manualHeadingFixtureSha256=sha(fixtureBytes);
 report.manualHeadingObservations=[];report.actualManualHeadingAdjustmentActions=0;
 report.manualHeadingScope='Eighteen synthetic cases per bundle use actual production Workers, exact complete endpoints, independently authored effective native/wiki/HTML heading outlines and parent paths, summary/minor ownership, undo and a fresh idempotent second session. Fourteen overlap separately verified native-source fixtures; four are bounded chain/container controls.';
 function effectiveOutline(source){
  let view=source.replace(/<!--[\s\S]*?-->/g,m=>' '.repeat(m.length));
  view=view.replace(/<(nowiki|pre|syntaxhighlight|source|math|chem|ce|score|ref)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,m=>' '.repeat(m.length));const events=[];
  for(const m of view.matchAll(/^(={1,6})[ \t]*([^\r\n]*?)[ \t]*\1[ \t]*$/gm))events.push({at:m.index,level:m[1].length,title:m[2].trim()});
  for(const m of view.matchAll(/<h([1-6])\b(?:[^>"']|"[^"]*"|'[^']*')*>([\s\S]*?)<\/h\1\s*>/gi))events.push({at:m.index,level:+m[1],title:m[2].replace(/<[^>]*>/g,'').trim()});
  for(const m of view.matchAll(/\{\{(Referências|Referencias|References|Listaref|Notas e referências|Notas)(\|[^{}]*?)?\}\}/g)){
   const fields=new Map;let pos=1;for(const part of(m[2]||'').split('|').slice(1)){const at=part.indexOf('=');if(at<0)fields.set(String(pos++),part);else fields.set(part.slice(0,at).trim(),part.slice(at+1));}
   const head=m[1],get=k=>fields.get(k)?.trim();if(head==='Notas e referências'){events.push({at:m.index,level:2,title:'Notas e referências'},{at:m.index+.01,level:3,title:'Notas'},{at:m.index+.02,level:3,title:'Referências'});continue;}
   const notes=head==='Notas',levelKey=fields.has('nível')?'nível':'2',suppressKey=fields.has('nível')?'nível':notes?'2':'3';if(get(suppressKey)==='0')continue;
   const literal=get(levelKey)||'',level=/^[1-5]$/.test(literal)?+literal:2,title=get('título')??get('1')??(notes?'Notas':'Referências');events.push({at:m.index,level,title});
  }
  events.sort((a,b)=>a.at-b.at);const stack=[];return events.map(e=>{while(stack.length&&stack.at(-1).level>=e.level)stack.pop();const row={level:e.level,title:e.title,parent:stack.map(x=>x.title)};stack.push(e);return row;});
 }
 async function headingAction(bundle,initial,fixture,pass){
  await setup(bundle,initial);const oldSummary=await read('__rw219UI.summary()'),oldMinor=await read('document.getElementById("wpMinoredit").checked');
  await adjust();report.actualManualHeadingAdjustmentActions++;const text=await read('__rw219UI.read()'),changed=text!==initial;
  eq(text,fixture.expected,'The entire actual Worker/editor endpoint matches the separately frozen expected text');
  eq(effectiveOutline(text),fixture.expectedOutline,'Actual effective native/wiki/HTML heading levels and parent paths match the independent contract');
  eq(await read('RevisaWiki.processing.engine'),'worker','The current production Worker executes this action');ok(await read('__rw219UI.workerStarts>0'),'A real Worker started in the fresh session');
  if(changed){
   ok(await read('__rw219UI.workerResults.some(row=>row.result?.text===__rw219UI.read()&&Array.isArray(row.result.preservation)&&row.result.preservation.length===0&&row.result.localCompositionSafety?.accepted!==false)'),'The written endpoint came through the actual production preservation protocol');
   eq(await read('__rw219UI.summary()'),'Minúcias','Automatic syntax adjustment uses the agreed summary');eq(await read('document.getElementById("wpMinoredit").checked'),true,'Automatic syntax adjustment is minor');
  }else{eq(await read('__rw219UI.summary()'),oldSummary,'An unchanged endpoint preserves the prior summary');eq(await read('document.getElementById("wpMinoredit").checked'),oldMinor,'An unchanged endpoint preserves the prior minor preference');}
  await noReviewUI();if(changed){await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),initial,'Undo restores every original source byte');eq(await read('__rw219UI.summary()'),oldSummary,'Undo restores the owned summary');eq(await read('document.getElementById("wpMinoredit").checked'),oldMinor,'Undo restores the original minor preference');}
  return{text,changed};
 }
 for(const bundle of ['core','complete'])for(const fixture of fixtureBook.rows){
  await test(bundle+'-manual-heading-expanded-'+fixture.id,async()=>{
   eq(sha(fixture.source),fixture.sourceSha256,'Frozen source hash');eq(sha(fixture.expected),fixture.expectedSha256,'Frozen expected endpoint hash');eq(effectiveOutline(fixture.expected),fixture.expectedOutline,'Independent expected endpoint has the authored native outline');
   const first=await headingAction(bundle,fixture.source,fixture,1),second=await headingAction(bundle,first.text,fixture,2);eq(second.text,first.text,'A fresh second actual action is idempotent');eq(second.changed,false,'The second action does not claim another adjustment');
   report.manualHeadingObservations.push({bundle,fixture:fixture.id,sourceSha256:fixture.sourceSha256,firstOutputSha256:sha(first.text),secondOutputSha256:sha(second.text),expectedSha256:fixture.expectedSha256,expectedOutline:fixture.expectedOutline,firstChanged:first.changed,secondChanged:second.changed,freshSessions:2,actualWorker:true,exactEndpoint:true,effectiveOutlineAndParentContract:true,secondIdempotent:true});
  });
 }
`;
source=source.replace(anchor,extra+anchor);process.env.REVISAWIKI_UI_CASE_FILTER='manual-heading-expanded';delete process.env.REVISAWIKI_UI_REAL_WATCHDOG;
const child=new Module(base,module);child.filename=base;child.paths=Module._nodeModulePaths(__dirname);child._compile(source,base);
