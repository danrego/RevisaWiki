'use strict';
// Named MediaWiki arguments ignore surrounding ASCII margins. Adding one such
// margin must not change the consumed facts, portals, flags or reference work.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const[k,...v]=s.replace(/^--/,'').split('=');return[k,v.join('=')||true];})),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function edits(api,source,padded){
 const out=[];
 for(const node of api.v2221FocusedNodes(source,{...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo'})){
  const raw=source.slice(node.start,node.end),box=api.v2221InfoboxRead(raw);if(!box||!/^(?:Info(?:\s*\/|$)|Infobox(?:[ _]|$)|Infocaixa(?:[ _]|$)|Ficha(?:[ _]|$))/i.test(box.title))continue;
  for(const field of box.fields){if(field.positional||!field.value.trim()||/^[ \t]*\r?\n/.test(field.value))continue;const margin=/^[ \t]*/.exec(field.value)[0];if((padded?' ':'' )!==margin)out.push({start:node.start+field.valueStart,end:node.start+field.valueStart+margin.length,text:padded?' ':''});}
 }
 for(const e of out.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);return source;
}
function sourceBound(value,source){if(!value||typeof value!=='object')return false;return Object.entries(value).some(([key,v])=>key==='source'&&v===source||typeof v==='string'&&/(?:source|draft|input|before)(?:Hash|Sha256)$/i.test(key)||v&&typeof v==='object'&&sourceBound(v,source));}
if(args.child){
 let networkAttempts=0;const deny=()=>{networkAttempts++;throw Error('Offline metamorphic test');};global.fetch=deny;for(const name of ['node:http','node:https']){const m=require(name);m.get=deny;m.request=deny;}
 const api=require(path.resolve(args.bundle));assert.equal(api.version,'2.22.1');
 process.on('message',row=>{try{
  const mutant=edits(api,row.source,true),cfg={...api.defaults,...row.options,autoPreview:false,registryDoiCheck:false},before={kind:'adjust',source:row.source,originalSource:row.source,options:cfg},after={...before,source:mutant,originalSource:mutant},a=api.calculate(before),b=api.calculate(after);
  const equivalent=edits(api,a.text,false)===edits(api,b.text,false),safe=api.v219AutomaticResultSafety(row.source,a).accepted&&api.v219AutomaticResultSafety(mutant,b).accepted;
  process.send({id:row.id,passed:equivalent&&safe&&before.source===row.source&&after.source===mutant,mutated:mutant!==row.source,sourceSha256:sha(row.source),mutantSha256:sha(mutant),outputSha256:sha(a.text),mutantOutputSha256:sha(b.text),checks:4,calculations:2,networkAttempts,...(!equivalent?{source:row.source,mutant,beforeOutput:a.text,afterOutput:b.text}:{}),...(!safe?{safetyFailed:true}:{})});
 }catch(error){process.send({id:row.id,passed:false,error:String(error.stack||error),networkAttempts});}});process.send({ready:true});
}else(async()=>{
 assert(args.fixtures&&args.bundle&&args.output,'Use frozen fixtures, actual bundle and a new output folder');const out=path.resolve(args.output);assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});const bundle=path.resolve(args.bundle),fixtureRaw=fs.readFileSync(args.fixtures),old=JSON.parse(fixtureRaw),demo=JSON.parse(fs.readFileSync(path.join(__dirname,'../v2220/demo_examples.json'))),rows=old.concat(demo).filter(r=>r.options?.namespaceNumber===0&&/\{\{(?:Info|Infobox|Infocaixa|Ficha)/i.test(r.source));
 const skipped=rows.filter(r=>sourceBound(r.options,r.source)),queue=rows.filter(r=>!sourceBound(r.options,r.source)).map((r,n)=>({id:String(n)+':'+r.id,source:r.source,options:r.options}));
 const report={kind:'named-infobox-argument-margin-metamorphic',version:'2.22.1',status:'running',runtimeSha256:sha(fs.readFileSync(bundle)),fixtureSha256:sha(fixtureRaw),runnerSha256:sha(fs.readFileSync(__filename)),plannedCases:queue.length,sourceBoundEvidenceCasesHeld:skipped.map(r=>({id:r.id,reason:'Changing the draft invalidates external evidence bound to its exact source; not a margin-only comparison.'})),cases:0,mutatedCases:0,noChangeControlCases:0,checks:0,calculations:0,failedCases:0,networkAttempts:0,wikipediaWrites:0};
 const log=fs.openSync(path.join(out,'RESULTS.private.jsonl'),'wx'),save=()=>fs.writeFileSync(path.join(out,'PROGRESS.json'),JSON.stringify(report,null,2)+'\n');save();
 async function worker(){const child=cp.fork(__filename,['--child=1','--bundle='+bundle],{stdio:['ignore','ignore','inherit','ipc']});let readyResolve,readyReject,waiting=null,booted=false;const ready=new Promise((a,b)=>{readyResolve=a;readyReject=b;});
  const settle=value=>{if(waiting){const job=waiting;waiting=null;clearTimeout(job.timer);job.resolve({...value,id:job.id});}};
  child.on('message',m=>{if(m.ready){booted=true;readyResolve();}else settle(m);});child.on('error',e=>{readyReject(e);settle({passed:false,error:String(e)});});child.on('exit',(code,signal)=>{if(!booted)readyReject(Error('Worker bootstrap '+code+'/'+signal));settle({passed:false,error:'Worker exited '+code+'/'+signal});});await ready;
  while(queue.length&&child.connected){const row=queue.shift(),value=await new Promise(resolve=>{const timer=setTimeout(()=>{settle({passed:false,externalResourceCap:true,error:'External test-process cap'});child.kill('SIGKILL');},120000);waiting={resolve,timer,id:row.id};child.send(row);});report.cases++;if(value.mutated)report.mutatedCases++;else report.noChangeControlCases++;report.checks+=value.checks||0;report.calculations+=value.calculations||0;report.networkAttempts+=value.networkAttempts||0;if(!value.passed)report.failedCases++;fs.writeSync(log,JSON.stringify(value)+'\n');save();}
  if(child.connected)child.disconnect();
 }
 await Promise.all(Array.from({length:Math.max(1,Math.min(8,Number(args.workers)||1))},worker));fs.closeSync(log);report.status=report.failedCases===0&&report.networkAttempts===0&&report.cases===report.plannedCases?'passed':'failed';save();fs.writeFileSync(path.join(out,'SUMMARY.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...report,sourceBoundEvidenceCasesHeld:report.sourceBoundEvidenceCasesHeld.length}));if(report.status!=='passed')process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
