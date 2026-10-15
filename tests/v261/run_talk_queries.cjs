'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),candidate=require('./candidate.cjs');
candidate.verify();
const report={version:candidate.manifest.version,kind:'independent-discussion-read-proof-queries',runnerSha256:candidate.sha(fs.readFileSync(__filename)),cases:[],checks:0,bundles:[],networkRequests:0,wikipediaWrites:0};
function check(a,b,message){report.checks++;assert.deepEqual(a,b,message);}
const input='Tema remoto de teste',line='Portal de '+input;
const proof={input,requestedTitle:'Portal:'+input,title:'Portal:'+input,ns:100,pageid:123,exists:true};
function response(extra={}){return {query:{pages:[{title:'Portal:'+input,ns:100,pageid:123,...extra},{title:'Wikipédia:Projetos/'+input,ns:4,missing:true}]}};}
(async()=>{
 for(const file of candidate.bundleFiles()){
  const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({file:bundle,sha256:candidate.sha(bytes),bytes:bytes.length});
  async function test(name,fn){const before=report.checks;try{await fn();report.cases.push({bundle,name,status:'passed',checks:report.checks-before});}catch(error){report.cases.push({bundle,name,status:'failed',checks:report.checks-before,message:candidate.sanitized(error.message).slice(0,1000)});}}
  await test('one complete API page creates one bound proof',()=>check(api.v261TalkProofsFromResponse(response(),[input]),[proof],'Proof is bound to requested input/title and namespace'));
  await test('normalized title plus redirect preserves the original request',()=>{
   const original='tema remoto de teste',canonical='Tema canônico de teste';
   const received={query:{normalized:[{from:'Portal:'+original,to:'Portal:'+input}],redirects:[{from:'Portal:'+input,to:'Portal:'+canonical}],pages:[{title:'Portal:'+canonical,ns:100,pageid:777}]}};
   check(api.v261TalkProofsFromResponse(received,[original]),[{input:original,requestedTitle:'Portal:'+original,title:'Portal:'+canonical,ns:100,pageid:777,exists:true}],'Canonical target never loses its original request binding');
  });
  for(const [name,extra]of [['missing',{missing:true}],['own false missing',{missing:false}],['invalid',{invalid:''}],['remaining redirect',{redirect:false}],['empty disambiguation',{pageprops:{disambiguation:''}}],['wrong namespace',{ns:14}],['zero pageid',{pageid:0}],['string pageid',{pageid:'123'}]])await test('response rejects '+name,()=>check(api.v261TalkProofsFromResponse(response(extra),[input]),[],'Unavailable or malformed pages cannot confirm a project'));
  await test('unrelated pages never confirm an input',()=>check(api.v261TalkProofsFromResponse({query:{pages:[{title:'Portal:Outro tema',ns:100,pageid:123}]}},[input]),[],'A returned page must be reachable from the exact requested title'));
  await test('cross-namespace route cannot confirm a portal',()=>check(api.v261TalkProofsFromResponse({query:{redirects:[{from:'Portal:'+input,to:'Categoria:'+input}],pages:[{title:'Categoria:'+input,ns:14,pageid:123}]}},[input]),[],'A category is not a portal/project proof'));
  await test('redirect cycle cannot confirm a portal',()=>check(api.v261TalkProofsFromResponse({query:{redirects:[{from:'Portal:'+input,to:'Portal:Outro tema'},{from:'Portal:Outro tema',to:'Portal:'+input}],pages:[{title:'Portal:Outro tema',ns:100,pageid:123}]}},[input]),[],'A cyclic route has no confirmed canonical destination'));
  await test('conflicting redirect routes cannot choose a target',()=>check(api.v261TalkProofsFromResponse({query:{redirects:[{from:'Portal:'+input,to:'Portal:Primeiro tema'},{from:'Portal:'+input,to:'Portal:Segundo tema'}],pages:[{title:'Portal:Primeiro tema',ns:100,pageid:123},{title:'Portal:Segundo tema',ns:100,pageid:456}]}},[input]),[],'Conflicting API routes are rejected'));
  const excludedSources=[
   ['indented unknown header',' '+line],['nowiki unknown label','<nowiki>'+line+'</nowiki>'],
   ['comment unknown label','<!-- '+line+' -->'],['conversation unknown label','== Conversa ==\n'+line],
   ['nested template example','{{Exemplo|'+line+'}}'],
   ['invalid later Portal3 field','{{Portal3|'+input+'|campo_invalido=valor}}'],
   ['invalid later plain label',line+' Portal de Nome=inseguro'],
   ['duplicate PD headers','{{PD}}\n{{PD}}\n'+line]
  ];
  for(const [name,source]of excludedSources)await test('rejected source does not trigger lookup '+name,async()=>{check(api.v261TalkProjectCandidates(source,''),[],'Only committed safe header projects may become lookup candidates');let reads=0;const got=await api.v261QueryTalkProjectProofs(source,'',()=>{reads++;return response();});check(reads,0,'No read request for a rejected/example scope');check(got,[],'No leaked proof');});
  for(const article of ['<nowiki>{{Portal3|'+input+'}}</nowiki>','{{Exemplo|{{Portal3|'+input+'}}}}','{{Portal3|'+input+'|campo_invalido=valor}}'])await test('invalid article portal has no lookup '+article.slice(0,30),()=>check(api.v261TalkProjectCandidates('',article),[],'Nested/protected/partly invalid article invocation is not a candidate'));
  await test('known registry topics do not need an API request',async()=>{let reads=0;const got=await api.v261QueryTalkProjectProofs('Portal da Astronomia','{{Portal3|Aviação|Biologia}}',()=>{reads++;throw new Error('Unexpected mock read');});check(reads,0,'Registered/verified names use their existing proof');check(got,[],'No additional API proof is needed');});
  await test('uncatalogued literal uses one read-only query',async()=>{const calls=[];const got=await api.v261QueryTalkProjectProofs(line,'',parameters=>{calls.push(parameters);return Promise.resolve(response());});check(calls,[{action:'query',formatversion:2,titles:'Portal:'+input+'|Wikipédia:Projetos/'+input,prop:'info|pageprops',ppprop:'disambiguation',redirects:1}],'Exactly the documented public read query, with no edit action');check(got,[proof],'Returned proof is exact and source-bound');});
  await test('rejected mock read does not invent a project',async()=>{const got=await api.v261QueryTalkProjectProofs(line,'',()=>Promise.reject(new Error('Synthetic offline response')));check(got,[],'A failed request grants no proof');const plan=api.v25TalkPreparationPlan(line,'',{namespaceNumber:1,contentModel:'wikitext',talkProjectProofs:got});check(plan.text,'{{PD}}\n'+line,'Unconfirmed label stays in the draft');});
  await test('query count and title count stay bounded',async()=>{const article=Array.from({length:80},(_,i)=>'{{Portal3|Tema remoto '+i+'}}').join('\n'),calls=[];const got=await api.v261QueryTalkProjectProofs('',article,parameters=>{calls.push(parameters);return Promise.resolve({query:{pages:[]}});});check(api.v261TalkProjectCandidates('',article).length,64,'At most 64 literal inputs');check(calls.length,3,'At most three request batches');check(Math.max(...calls.map(x=>x.titles.split('|').length)),50,'At most fifty titles in each batch');check(got,[],'Unconfirmed pages are not guessed');});
  await test('timeout aborts a pending read without granting proof',async()=>{const original=globalThis.setTimeout,delays=[];let aborted=0;try{globalThis.setTimeout=(callback,delay,...args)=>{delays.push(delay);return original(callback,2,...args);};const got=await api.v261QueryTalkProjectProofs(line,'',()=>{const pending=new Promise(()=>{});pending.abort=()=>{aborted++;};return pending;});check(delays,[6000],'The documented timeout is six seconds');check(aborted,1,'The stale pending transport is aborted');check(got,[],'A timeout is never an existence proof');}finally{globalThis.setTimeout=original;}});
 }
 report.passed=report.cases.filter(x=>x.status==='passed').length;report.failed=report.cases.length-report.passed;report.status=report.failed?'failed':'passed';
 fs.writeFileSync(path.join(candidate.artifactDirectory(),'talk_queries_independent.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,kind:report.kind,status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.cases.filter(x=>x.status==='failed'),networkRequests:0,wikipediaWrites:0}));
 if(report.failed)process.exitCode=1;
})().catch(error=>{console.error(candidate.sanitized(error.message));process.exitCode=1;});
