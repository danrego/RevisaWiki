'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),candidate=require('./candidate.cjs');
candidate.verify();
const report={version:candidate.manifest.version,kind:'independent-discussion-project-draft',runnerSha256:candidate.sha(fs.readFileSync(__filename)),cases:[],checks:0,networkRequests:0,wikipediaWrites:0,bundles:[]};
const check=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);};
const cfg={namespaceNumber:1,contentModel:'wikitext',sectionOnly:false};
const labels='Portal da física Portal da tecnologia Portal da ciência',header='{{PD}}\n{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}\n';
const discussion='== Comentários ==\nA redação precisa de uma fonte. 12h34min de 1 de janeiro de 2026 (UTC)\n';
for(const file of candidate.bundleFiles()){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({file:bundle,sha256:candidate.sha(bytes),bytes:bytes.length});
 function test(name,fn){const before=report.checks;try{fn();report.cases.push({bundle,name,status:'passed',checks:report.checks-before});}catch(error){report.cases.push({bundle,name,status:'failed',checks:report.checks-before,message:candidate.sanitized(error.message).slice(0,1000)});}}
 function exact(name,source,expected,article='',options={}){test(name,()=>{const settings={...cfg,...options},plan=api.v25TalkPreparationPlan(source,article,settings);check(plan.source,source,'Plan remains bound to exact input');check(plan.text,expected,'Independently specified complete draft');check(plan.changed,expected!==source,'Accurate changed flag');check(api.v25TalkPreparationPlan(plan.text,article,settings).text,plan.text,'Second click is byte-identical');if(plan.changed){check(plan.summary,'{{PD}}{{Marca de projeto}}','Exact requested automatic summary');check(/^\{\{PD\}\}\r?\n/.test(plan.text),true,'PD is on the first line with the existing newline convention');}});}
 exact('requested lowercase plain portal labels',labels,header);
 exact('requested labels followed by conversation',labels+'\n'+discussion,header+discussion);
 exact('known portal template at header','{{Portal3|Física|Tecnologia|Ciência}}\n',header);
 exact('article portals create equivalent talk draft','',header,'Texto.\n{{Portal3|Física|Tecnologia|Ciência}}\n');
 exact('duplicate labels are represented once','Portal da física Portal da tecnologia Portal da física Portal da ciência',header);
 exact('comments remain exactly below new header','<!-- Conservar este comentário. -->\n'+labels+'\n'+discussion,header+'<!-- Conservar este comentário. -->\n'+discussion);
 exact('unrelated header template stays literal','{{Outro aviso|texto=literal}}\n'+labels+'\n'+discussion,header+'{{Outro aviso|texto=literal}}\n'+discussion);
 exact('CRLF labels preserve line endings',labels+'\r\n'+discussion.replaceAll('\n','\r\n'),header.replaceAll('\n','\r\n')+discussion.replaceAll('\n','\r\n'));
 const graded='{{Marca de projeto|B|Física|2|Tecnologia|3|importância=alta}}';
 exact('existing grades and named fields survive append',graded+'\n'+labels+'\n'+discussion,'{{PD}}\n'+graded.slice(0,-2)+'|Ciência|?}}\n'+discussion);
 // Expected names were independently checked against the registered-project
 // source and verified-portal source. No product resolver supplies expectations.
 const broadProjects=[['Astronomia','Astronomia'],['Aviação','Aviação'],['Biologia','Biologia'],['Química','Química'],['Ecologia','Ecologia'],['Geografia','Geografia'],['Geologia','Geologia'],['Medicina','Medicina'],['Economia','Economia'],['São Paulo','São Paulo'],['Minas Gerais','Minas Gerais'],['Rio de Janeiro','Rio de Janeiro'],['África','África'],['Filosofia','Filosofia'],['Psicologia','Psicologia'],['Informática','Ciência da computação']];
 for(const [input,canonical] of broadProjects){
  const expected='{{PD}}\n{{Marca de projeto|?|'+canonical+'|?}}\n';
  exact('broad plain portal '+input,'Portal de '+input,expected);
  exact('broad Portal3 '+input,'{{Portal3|'+input+'}}\n',expected);
  exact('broad article portal '+input,'',expected,'Texto.\n{{Portal3|'+input+'}}\n');
 }
 const remote='Tema remoto de teste',remoteLine='Portal de '+remote;
 const portalProof={input:remote,requestedTitle:'Portal:'+remote,title:'Portal:Tema canônico de teste',ns:100,pageid:123,exists:true};
 const projectProof={input:remote,requestedTitle:'Wikipédia:Projetos/'+remote,title:'Wikipédia:Projetos/Projeto canônico de teste',ns:4,pageid:456,exists:true};
 exact('synthetic valid portal proof admits an uncatalogued topic',remoteLine,'{{PD}}\n{{Marca de projeto|?|Tema canônico de teste|?}}\n','',{talkProjectProofs:[portalProof]});
 exact('synthetic valid project proof admits an uncatalogued topic','{{Portal3|'+remote+'}}\n','{{PD}}\n{{Marca de projeto|?|Projeto canônico de teste|?}}\n','',{talkProjectProofs:[projectProof]});
 exact('project namespace takes precedence over portal namespace',remoteLine,'{{PD}}\n{{Marca de projeto|?|Projeto canônico de teste|?}}\n','',{talkProjectProofs:[portalProof,projectProof]});
 exact('identical proofs do not duplicate projects',remoteLine,'{{PD}}\n{{Marca de projeto|?|Tema canônico de teste|?}}\n','',{talkProjectProofs:[portalProof,{...portalProof}]});
 const rejectedProofs=[
  ['stale input binding',{input:'Outro tema'}],['wrong requested title',{requestedTitle:'Portal:Outro tema'}],
  ['missing proof',{missing:true}],['even an own false missing flag',{missing:false}],['invalid flag',{invalid:true}],['remaining redirect flag',{redirect:true}],
  ['disambiguation flag',{disambiguation:true}],['empty disambiguation marker',{pageprops:{disambiguation:''}}],['nonexistent',{exists:false}],
  ['zero pageid',{pageid:0}],['fractional pageid',{pageid:1.5}],['string pageid',{pageid:'123'}],['wrong namespace',{ns:14}],
  ['cross-namespace target',{title:'Categoria:Tema canônico de teste'}],['pipe injection',{title:'Portal:Nome|injetado'}],
  ['equals injection',{title:'Portal:Nome=valor'}],['template injection',{title:'Portal:{{Exemplo}}'}],
  ['newline injection',{title:'Portal:Nome\nnovo'}],['fragment target',{title:'Portal:Nome#Seção'}]
 ];
 for(const [name,extra]of rejectedProofs)test('reject '+name,()=>{const options={...cfg,talkProjectProofs:[{...portalProof,...extra}]},plan=api.v25TalkPreparationPlan(remoteLine,'',options);check(plan.projects,[],'Unconfirmed topic is never invented');check(plan.removedPortals,0,'Rejected evidence cannot consume the original label');check(plan.text,'{{PD}}\n'+remoteLine,'Entire unknown label remains literal');check(api.v25TalkPreparationPlan(plan.text,'',options).text,plan.text,'Rejected proof remains stable');});
 test('inherited proof fields are never accepted',()=>check(api.v261TalkProofProject(remote,Object.create(portalProof)),null,'Required proof fields must be own properties'));
 test('conflicting canonical proofs cannot choose a target',()=>{const options={...cfg,talkProjectProofs:[portalProof,{...portalProof,title:'Portal:Outro canônico de teste'}]},plan=api.v25TalkPreparationPlan(remoteLine,'',options);check(plan.projects,[],'Conflicting canonical targets are not guessed');check(plan.text,'{{PD}}\n'+remoteLine,'Conflicting input remains intact');});
 for(const source of ['Portal da física Portal da categoria inexistente Portal da ciência','A frase Portal da física faz parte deste comentário.','<nowiki>'+labels+'</nowiki>','<syntaxhighlight lang="wikitext">'+labels+'</syntaxhighlight>'])test('ambiguous or protected labels stay literal '+source.slice(0,32),()=>{const plan=api.v25TalkPreparationPlan(source,'',cfg);check(plan.text.includes(source),true,'Unknown/protected prose is never consumed as portal choices');check(api.v25TalkPreparationPlan(plan.text,'',cfg).text,plan.text,'Preservation result is stable');});
 test('labels in conversation are not parsed as header',()=>{const source=discussion+labels+'\n',plan=api.v25TalkPreparationPlan(source,'',cfg);check(plan.text.endsWith(source),true,'Complete existing conversation stays byte-identical');check(plan.projects,[],'No project is inferred from conversation prose');});
 test('explicit existing grades stay literal',()=>{const mark='{{Marca de projeto|1=B|2=Física|3=2}}',source=mark+'\n'+labels+'\n'+discussion,plan=api.v25TalkPreparationPlan(source,'',cfg);check(plan.text.includes(mark),true,'Explicit numbered assessment is preserved');check(plan.text.endsWith(discussion),true,'Signed conversation is exact');check(plan.text.includes(labels)||plan.text.includes('|Tecnologia|?'),true,'New portal text is consumed only if the choice is retained');check(api.v25TalkPreparationPlan(plan.text,'',cfg).text,plan.text,'Repeated click never changes grade semantics');});
 for(const options of [{namespaceNumber:0},{namespaceNumber:3},{sectionOnly:true},{section:'1'},{contentModel:'Scribunto'}])test('unsupported context is untouched '+JSON.stringify(options),()=>{const plan=api.v25TalkPreparationPlan(labels,'',{...cfg,...options});check(plan.text,labels,'No article/user-talk/section/code rewrite');check(plan.changed,false,'No hidden draft change');});
}
report.passed=report.cases.filter(x=>x.status==='passed').length;report.failed=report.cases.length-report.passed;report.status=report.failed?'failed':'passed';
fs.writeFileSync(path.join(candidate.artifactDirectory(),'talk_independent.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version:report.version,kind:report.kind,status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.cases.filter(x=>x.status==='failed'),networkRequests:0,wikipediaWrites:0}));
if(report.failed)process.exitCode=1;
