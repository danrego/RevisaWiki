'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const candidate=require('./candidate.cjs');
candidate.verify();
async function run(bundle) {
const {api}=candidate.load(path.basename(bundle));
const cfg={namespaceNumber:1,sectionOnly:false,contentModel:'wikitext'},records=[],failures=[];let cases=0,checks=0;
const eq=(a,b,message)=>{checks++;assert.deepEqual(a,b,message);};
async function test(name,fn){cases++;try{await fn();records.push({name,status:'passed'});}catch(e){failures.push({name,message:candidate.sanitized(e.message)});}}
const plan=(source,article='',extra={})=>api.v25TalkPreparationPlan(source,article,{...cfg,...extra});
const proof=(input='Tema de teste',extra={})=>({input,requestedTitle:'Portal:'+input,title:'Portal:'+input,ns:100,pageid:123,exists:true,...extra});
const response=(input='Tema de teste',extra={})=>({query:{pages:[{title:'Portal:'+input,ns:100,pageid:123,...extra},{title:'Wikipédia:Projetos/'+input,ns:4,missing:true}]}});
 const registered=JSON.parse(fs.readFileSync(path.join(candidate.root,'src/v2_6_1/all_portals/registered_projects.json'),'utf8'));
 let ordinal=0;
 for(const [input,canonical]of Object.entries(registered))await test('Complete registered project entry '+(++ordinal),()=>{
  const expected=['biografia','biografias'].includes(input)?'Biografia':canonical;
  const plain=plan('Portal de '+input),template=plan('{{Portal3|'+input+'}}');
  eq(plain.projects,[expected],'Registered plain name resolves to canonical project');eq(template.projects,[expected],'Registered Portal3 name resolves identically');
  eq(plain.removedPortals,1,'Complete recognized plain line consumed');eq(template.removedPortals,1,'Recognized Portal3 consumed');
  eq(api.v261TalkProjectCandidates('Portal de '+input,''),[],'Registered names never trigger a live request');
  eq(plan(plain.text).text,plain.text,'Canonical output is stable');
 });
 await test('Several unrelated registered projects on one line',()=>{const r=plan('Portal da astronomia Portal da aviação Portal da biologia Portal da química Portal da ecologia');eq(r.text,'{{PD}}\n{{Marca de projeto|?|Astronomia|?|Aviação|?|Biologia|?|Química|?|Ecologia|?}}\n','Every topic is converted');eq(r.projects.length,5,'All five retained');});
 await test('Article Portal3 uses the same full registry',()=>eq(plan('','{{Portal3|Geologia|Medicina|Economia|São Paulo|Minas Gerais|África}}').projects,['Geologia','Medicina','Economia','São Paulo','Minas Gerais','África'],'No limited list of sample topics'));
 await test('Existing registered alias and grade preserved',()=>{const r=plan('{{Marca de projeto|?|Informática|3}}\nPortal da ciência da computação');eq(r.text,'{{PD}}\n{{Marca de projeto|?|Informática|3}}\n','Existing alias and grade stay byte-exact');eq(r.projects,['Ciência da computação'],'Canonical deduplication');});
 await test('Pure proof admits an uncatalogued valid portal',()=>{const r=plan('Portal do Tema de teste','',{talkProjectProofs:[proof()]});eq(r.text,'{{PD}}\n{{Marca de projeto|?|Tema de teste|?}}\n','Verified portal consumed');eq(r.removedPortals,1,'Original label removed');});
 await test('Pure proof admits an uncatalogued project',()=>{const p=proof('Tema de teste',{requestedTitle:'Wikipédia:Projetos/Tema de teste',title:'Wikipédia:Projetos/Tema de teste',ns:4});eq(plan('{{Portal3|Tema de teste}}','',{talkProjectProofs:[p]}).projects,['Tema de teste'],'Project fallback matches module behavior');});
 await test('Both candidate namespaces prefer a project',()=>{const p=proof('Tema de teste',{requestedTitle:'Wikipédia:Projetos/Tema de teste',title:'Wikipédia:Projetos/Projeto canônico',ns:4});eq(plan('Portal do Tema de teste','',{talkProjectProofs:[proof(),p]}).projects,['Projeto canônico'],'Project lookup precedes portal lookup');});
 await test('Conflicting canonical proofs are ambiguous',()=>{const r=plan('Portal do Tema de teste','',{talkProjectProofs:[proof(),proof('Tema de teste',{title:'Portal:Outro tema'})]});eq(r.removedPortals,0,'Ambiguous line is not consumed');eq(r.projects,[],'No arbitrary canonical name selected');});
 await test('Duplicate identical proofs are harmless',()=>eq(plan('Portal do Tema de teste','',{talkProjectProofs:[proof(),proof()]}).projects,['Tema de teste'],'One canonical project remains'));
 for(const extra of [{input:'Outro tema'},{requestedTitle:'Portal:Outro tema'},{exists:false},{pageid:0},{pageid:1.5},{ns:0},{ns:4},{missing:true},{invalid:true},{redirect:true},{disambiguation:true},{title:'Wikipédia:Projetos/Tema de teste'},{title:'Portal:Nome|injetado'},{title:'Portal:Nome=valor'},{title:'Portal:Nome\nnovo'},{title:'Portal:{{Modelo}}'},{title:'Portal:Nome#Seção'}])await test('Invalid or unbound proof rejected '+JSON.stringify(extra),()=>{const r=plan('Portal do Tema de teste','',{talkProjectProofs:[proof('Tema de teste',extra)]});eq(r.removedPortals,0,'Original unknown line preserved');eq(r.projects,[],'No unsupported project invented');eq(r.text,'{{PD}}\nPortal do Tema de teste','Only missing PD may be added');});
 await test('Inherited proof fields rejected',()=>eq(api.v261TalkProofProject('Tema de teste',Object.create(proof())),null,'Own fields required'));
 await test('Unknown mixed-topic line stays complete',()=>{const before='Portal da Astronomia Portal de Tema desconhecido',r=plan(before);eq(r.removedPortals,0,'No partial line consumption');eq(r.text,'{{PD}}\n'+before,'Known words are not deleted from an unknown complete line');});
 for(const source of ['<nowiki>Portal da Astronomia</nowiki>','<blockquote>Portal da Astronomia</blockquote>','<!-- Portal da Astronomia -->','== Conversa ==\nPortal da Astronomia','{{Exemplo|Portal da Astronomia}}',' Portal da Astronomia'])await test('Protected or nonheader labels '+source,()=>{eq(plan(source).projects,[],'Example never chooses a project');eq(api.v261TalkProjectCandidates(source,''),[],'No request for protected text');});
 for(const source of ['<nowiki>Portal de Tema remoto desconhecido</nowiki>','<blockquote>Portal de Tema remoto desconhecido</blockquote>','<!-- Portal de Tema remoto desconhecido -->','== Conversa ==\nPortal de Tema remoto desconhecido','{{Exemplo|Portal de Tema remoto desconhecido}}',' Portal de Tema remoto desconhecido','{{Portal3|Tema remoto desconhecido|parametro_invalido=valor}}','Portal de Tema remoto desconhecido Portal de Nome=inseguro'])await test('Unregistered protected or rejected input '+source,()=>eq(api.v261TalkProjectCandidates(source,''),[],'A rejected header never triggers a lookup'));
 await test('Simple positive read-only response becomes source-bound proof',()=>{const got=api.v261TalkProofsFromResponse(response(),['Tema de teste']);eq(got,[proof()],'Exact proof object contract');});
 await test('Normalized case and redirect chain bind to original request',()=>{const got=api.v261TalkProofsFromResponse({query:{normalized:[{from:'Portal:tema de teste',to:'Portal:Tema de teste'}],redirects:[{from:'Portal:Tema de teste',to:'Portal:Tema canônico'}],pages:[{title:'Portal:Tema canônico',ns:100,pageid:555}]}},['tema de teste']);eq(got,[proof('tema de teste',{title:'Portal:Tema canônico',pageid:555})],'Resolved title is safe and request-bound');});
 for(const extra of [{missing:true},{invalid:true},{redirect:true},{pageprops:{disambiguation:''}},{ns:0},{pageid:0}])await test('Read-only response with invalid page rejected '+JSON.stringify(extra),()=>eq(api.v261TalkProofsFromResponse(response('Tema de teste',extra),['Tema de teste']),[],'No valid proof'));
 await test('Crossnamespace redirects rejected',()=>eq(api.v261TalkProofsFromResponse({query:{redirects:[{from:'Portal:Tema de teste',to:'Usuário:Teste'}],pages:[{title:'Usuário:Teste',ns:2,pageid:123}]}},['Tema de teste']),[],'No user page can confirm a portal'));
 await test('Redirect loops rejected',()=>eq(api.v261TalkProofsFromResponse({query:{redirects:[{from:'Portal:Tema de teste',to:'Portal:Outro'},{from:'Portal:Outro',to:'Portal:Tema de teste'}],pages:[{title:'Portal:Outro',ns:100,pageid:123}]}},['Tema de teste']),[],'No cyclic proof'));
 await test('Conflicting redirect routes rejected',()=>eq(api.v261TalkProofsFromResponse({query:{redirects:[{from:'Portal:Tema de teste',to:'Portal:Primeiro'},{from:'Portal:Tema de teste',to:'Portal:Segundo'}],pages:[{title:'Portal:Segundo',ns:100,pageid:123}]}},['Tema de teste']),[],'No arbitrary route selected'));
 await test('Candidate discovery reads all unknown article and header names',()=>eq(api.v261TalkProjectCandidates('Portal de Tema A Portal de Tema B','{{Portal3|Astronomia|Tema C}}'),['Tema A','Tema B','Tema C'],'Every safely parsed input receives a lookup'));
 await test('Known names cause no additional network calls',async()=>{let calls=0;eq(await api.v261QueryTalkProjectProofs('Portal da Astronomia','{{Portal3|Aviação}}',()=>{calls++;throw Error('Unexpected');}),[],'No proof needed');eq(calls,0,'No request made');});
 await test('Uncatalogued name gets a GET-compatible query and exact proof',async()=>{const calls=[];const got=await api.v261QueryTalkProjectProofs('Portal do Tema de teste','',async params=>{calls.push(params);return response();});eq(calls.length,1,'One batched read');eq(calls[0],{action:'query',formatversion:2,titles:'Portal:Tema de teste|Wikipédia:Projetos/Tema de teste',prop:'info|pageprops',ppprop:'disambiguation',redirects:1},'Read-only public API parameters');eq(got,[proof()],'Query proof is input-bound');});
 await test('Failed lookup preserves unknown labels without guessing',async()=>{const proofs=await api.v261QueryTalkProjectProofs('Portal do Tema de teste','',async()=>{throw Error('Offline');});eq(proofs,[],'Failure provides no existence proof');eq(plan('Portal do Tema de teste','',{talkProjectProofs:proofs}).removedPortals,0,'Original labels retained');});
 await test('Live discovery has a bounded query budget',async()=>{const article=Array.from({length:80},(_,i)=>'{{Portal3|Tema remoto '+i+'}}').join('\n'),calls=[];const got=await api.v261QueryTalkProjectProofs('',article,async p=>{calls.push(p);return {query:{pages:[]}};});eq(api.v261TalkProjectCandidates('',article).length,64,'At most 64 inputs');eq(calls.length,3,'At most three batches');eq(Math.max(...calls.map(p=>p.titles.split('|').length)),50,'At most 50 requested titles per batch');eq(got,[],'Unconfirmed values stay unknown');});
 const report={version:api.version,kind:'complete-project-and-portal-resolution',bundle:path.basename(bundle),bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),cases,checks,passed:cases-failures.length,failed:failures.length,failures,records,networkRequests:0,wikipediaWrites:0};
 return report;
}
(async()=>{
 const sourceDirectory=path.join(candidate.root,'src/v2_6_1/all_portals');
 const provenance=JSON.parse(fs.readFileSync(path.join(sourceDirectory,'provenance.json'),'utf8'));
 for(const [file,expected]of [['registered_projects.json',provenance.registeredProjects.catalogSha256],['verified_portals.json',provenance.verifiedPortalAliases.catalogSha256]])
  assert.equal(candidate.sha(fs.readFileSync(path.join(sourceDirectory,file))),expected,'Source catalog matches its verified provenance');
 const results=[];
 for(const bundle of candidate.bundleFiles())results.push(await run(bundle));
 const report={version:candidate.manifest.version,kind:'complete-project-registry-and-portal-proofs',
  runnerSha256:candidate.sha(fs.readFileSync(__filename)),frozenFiles:candidate.manifest.files,
  cases:results.reduce((total,result)=>total+result.cases,0),checks:results.reduce((total,result)=>total+result.checks,0),
  passed:results.reduce((total,result)=>total+result.passed,0),failed:results.reduce((total,result)=>total+result.failed,0),
  bundles:results,networkRequests:0,wikipediaWrites:0};
 report.status=report.failed?'failed':'passed';
 fs.writeFileSync(path.join(candidate.artifactDirectory(),'registry_complete.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,kind:report.kind,status:report.status,cases:report.cases,checks:report.checks,failed:report.failed,failures:results.flatMap(result=>result.failures),networkRequests:0,wikipediaWrites:0}));
 if(report.failed)process.exitCode=1;
})().catch(error=>{console.error(candidate.sanitized(error.message));process.exitCode=1;});
