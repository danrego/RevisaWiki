'use strict';
// Actual local copy controls; clipboard destinations exist only in memory.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const args=Object.fromEntries(process.argv.slice(2).map(v=>{const i=v.indexOf('=');return[v.slice(0,i),v.slice(i+1)];}));
const sha=v=>crypto.createHash('sha256').update(v).digest('hex'),pin=v=>({bytes:v.length,sha256:sha(v)});
assert(args['--plan']&&args['--plan-sha256']&&args['--registration']&&args['--registration-sha256']&&args['--report'],'Supply exact approved private inputs and a fresh report');
assert(!fs.existsSync(args['--report']),'Preserve earlier reports');
const planBytes=fs.readFileSync(args['--plan']),registrationBytes=fs.readFileSync(args['--registration']);
assert.equal(sha(planBytes),args['--plan-sha256']);assert.equal(sha(registrationBytes),args['--registration-sha256']);
const plan=JSON.parse(planBytes),registration=JSON.parse(registrationBytes),repo=path.resolve(__dirname,'../..'),origin=args['--origin']||'http://127.0.0.1:8780';
assert(['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname)&&new URL(origin).protocol==='http:','Local service only');
assert.equal(plan.version,'2.22.0');assert.equal(registration.status,'passed');assert.equal(registration.plan.sha256,sha(planBytes));assert.equal(plan.targets.length,9);
const {NativeChrome}=require(path.join(repo,'tests/v261/browser/native_driver.cjs')),driver=new NativeChrome();
const report={kind:'native-local-nine-artifact-copy-control-validation',version:plan.version,status:'running',planSha256:sha(planBytes),registrationSha256:sha(registrationBytes),artifacts:[],components:[],requests:[],blockedRequests:[],sourcePins:{},checks:0,osClipboardWrites:0,appWrites:0,wikipediaWrites:0};
function eq(a,b,m){report.checks++;assert.deepEqual(a,b,m);}function ok(v,m){report.checks++;assert(v,m);}
async function get(route,raw=false){const r=await fetch(origin+route,{signal:AbortSignal.timeout(20000)});assert(r.ok,'Local GET failed '+r.status);return raw?Buffer.from(await r.arrayBuffer()):r.json();}
const appFiles=['web/app.js','web/ux165.js','web/editorial1691.js','web/saved-copy1692c.js','web/delivery1695.js'];
(async()=>{let current;
try{
 for(const file of appFiles)report.sourcePins[file]=pin(fs.readFileSync(path.join(plan.app_root,file)));
 await driver.start(origin);report.browserVersion=driver.version;await driver.context.unroute('**/*');
 await driver.context.route('**/*',route=>{const r=route.request(),url=r.url(),method=r.method();let same=false;try{same=new URL(url).origin===origin;}catch{}if(!same||method!=='GET'){report.blockedRequests.push({method,url});return route.abort('blockedbyclient');}report.requests.push({method,url});return route.continue();});
 await driver.context.addInitScript(()=>{
  const captures=[];Object.defineProperty(window,'__rwReleaseCopy',{value:{captures}});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>captures.push(String(text)),write:async items=>{for(const item of items){if(!item.types.includes('text/plain'))throw Error('Plain text required');captures.push(await(await item.getType('text/plain')).text());}},read:async()=>{throw Error('No clipboard reads');},readText:async()=>{throw Error('No clipboard reads');}},configurable:false});
  const original=document.execCommand.bind(document);document.execCommand=function(command,...rest){const key=String(command).toLowerCase();if(key==='copy'){const el=document.activeElement;captures.push(el&&typeof el.value==='string'?el.value.slice(el.selectionStart||0,el.selectionEnd??el.value.length):String(window.getSelection()));return true;}if(key==='cut'||key==='paste')throw Error('No clipboard mutation');return original(command,...rest);};
  window.open=()=>{throw Error('No new windows');};if(navigator.serviceWorker)navigator.serviceWorker.register=async()=>{throw Error('No service worker registration');};
 });
 for(const item of plan.targets){
  current={role:item.role,id:item.id};const workspace=await get('/api/artifacts/'+item.id+'/workspace'),artifact=workspace.artifact,selected=workspace.selected_package,meta=typeof artifact.metadata==='string'?JSON.parse(artifact.metadata):artifact.metadata||{},body=await get('/api/artifacts/'+item.id+'/content',true),frozen=fs.readFileSync(item.source.file);
  eq(artifact.version,item.expected_version,'Exact saved version');eq(meta.release_version,plan.version,'Release metadata');eq(artifact.work_state,'draft','Saved draft');eq(artifact.review_state,'unreviewed','No approval manufactured');eq(artifact.publication_state,'unpublished','Not wiki-published');eq(pin(body),{bytes:item.source.bytes,sha256:item.source.sha256},'Exact frozen source hash');eq(body,frozen,'Frozen payload bytes');ok(selected&&selected.id===workspace.current_package_id&&!workspace.read_only_history,'Current package selected');eq(selected.source_version,item.expected_version,'Current package version');eq(selected.content_sha256,item.source.sha256,'Current package hash');eq(Buffer.from(selected.content),body,'Current package content');eq(selected.edit_summary,item.edit_summary,'Frozen summary');
  report.artifacts.push({role:item.role,id:item.id,version:artifact.version,sourceSha256:artifact.sha256,packageId:selected.id,packageSha256:selected.package_sha256});
  await driver.navigate(origin+'/#artifact?id='+encodeURIComponent(item.id));await driver.page.waitForFunction(id=>!!document.querySelector('[data-action="editorial-copy"][data-editorial-artifact="'+id+'"][data-editorial-component="content"]'),item.id,{timeout:45000});
  for(const component of ['content','edit_summary']){
   current={role:item.role,id:item.id,component};const selector='[data-action="editorial-copy"][data-editorial-artifact="'+item.id+'"][data-editorial-package="'+selected.id+'"][data-editorial-component="'+component+'"]',buttons=driver.page.locator(selector);ok(await buttons.count()>0,'Actual current-package copy control exists');const button=buttons.first();ok(await button.isVisible(),'Visible copy control');ok(!await button.isDisabled(),'Enabled copy control');const before=await driver.page.evaluate(()=>window.__rwReleaseCopy.captures.length);await button.click();await driver.page.waitForFunction(n=>window.__rwReleaseCopy.captures.length>n,before,{timeout:30000});const copies=await driver.page.evaluate(()=>window.__rwReleaseCopy.captures);eq(copies.length,before+1,'One click, one copied value');const actual=Buffer.from(copies.at(-1)),expected=component==='content'?frozen:Buffer.from(item.edit_summary);eq(actual,expected,'Whole text/summary clipboard bytes');const head=await get('/api/artifacts/'+item.id+'/workspace/head');ok(head.effective_is_current,'Package stays current');eq(head.current_package.id,selected.id,'Copy did not select history');eq(head.current_artifact.sha256,item.source.sha256,'Copy did not mutate source');report.components.push({role:item.role,id:item.id,component,status:'passed',...pin(actual),sourceVersion:item.expected_version,packageId:selected.id});
  }
 }
 eq(report.components.length,18,'Nine text plus nine summary controls');eq(report.blockedRequests,[],'No non-GET or external request');eq(driver.errors,[],'No page runtime errors');for(const file of appFiles)eq(pin(fs.readFileSync(path.join(plan.app_root,file))),report.sourcePins[file],'Application source unchanged');report.status='passed';
}catch(error){report.status='failed';report.failure={current,message:String(error.message),stack:String(error.stack||'')};process.exitCode=1;}
finally{try{await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.closeFailure=String(error.message);report.status='failed';process.exitCode=1;}fs.mkdirSync(path.dirname(args['--report']),{recursive:true});fs.writeFileSync(args['--report'],JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,artifacts:report.artifacts.length,components:report.components.length,checks:report.checks,osClipboardWrites:0,appWrites:0,wikipediaWrites:0}));}
})();
