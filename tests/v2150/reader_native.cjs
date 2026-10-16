'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const fixturePath=path.join(__dirname,'reader_native_contracts.json');
function roles(xml){
 const stack=[],out=[];let m;const pattern=/<(\/)?(template|tplarg)(?:\s[^>]*)?>/g;
 while((m=pattern.exec(xml))){if(m[1]){assert.equal(stack.pop(),m[2],'The captured native role tree is balanced');}else{out.push({size:m[2]==='template'?2:3,depth:stack.length});stack.push(m[2]);}}
 assert.equal(stack.length,0);return out;
}
const custom=[
 ['dynamic-argument','{{{{{1}}}}}'],['dynamic-suffix','{{{{{2}}}x|{{{1}}}}}'],
 ['dynamic-default','{{{{{name|Navbox}}}|title=Teste|list1=A}}'],
 ['parameter-fallback','{{{a|{{{b|}}}}}}'],['parameter-two-empty-defaults','{{{a||}}}'],
 ['if-empty','{{#if:{{{x|}}}|sim|não}}'],['if-zero','{{#if:{{{x|0}}}|sim|não}}'],
 ['switch-fallthrough','{{#switch:{{{x|}}}|a|b=mesmo|c=|#default=outro}}'],
 ['switch-dynamic-name','{{#switch:{{{x|}}}|a={{ {{{name|Small}}} |texto}}|#default=}}'],
 ['explicit-call-around-parameter','{{ {{{name|Small}}} |1=texto}}'],
 ['explicit-parameter-around-call','{{{ {{Small|nome}} |padrão}}}'],
 ['pair-inside-three','{{{{ }} }}}'],['three-inside-pair','{{ {{{ }}} }}'],
 ['pipe-in-inner-default','{{X|a={{{x|a|b}}}|b=B}}'],
 ['escaped-pipe','{{X|a=A{{!}}B|b=B}}'],['escaped-equals','{{X|A{{=}}B|b=B}}'],
 ['internal-link','{{X|a=[[Alvo|rótulo]]|b=B}}'],
 ['external-query','{{X|a=[https://example.org/?a=b rótulo]|b=B}}'],
 ['quoted-attribute','{{X|a=<span title="a|b">C</span>|b=B}}'],
 ['comment-parameter','{{X|a=<!-- {{{x|y}}} -->A|b=B}}'],
 ['nowiki-parameter','{{X|a=<nowiki>{{{x|y}}}</nowiki>|b=B}}'],
 ['empty-vs-undefined','{{#ifeq:{{{x|a}}}|{{{x|b}}}|definido|ausente}}']
];
async function capture(){
 const output=process.argv[process.argv.indexOf('--capture-out')+1];
 assert(process.argv.includes('--capture-out')&&output&&path.resolve(output)!==fixturePath,'Capture requires a separate reviewed output path');
 const cases=[];for(let open=2;open<=12;open++)for(let close=2;close<=12;close++)cases.push(['brace-'+open+'-'+close,'{'.repeat(open)+'x'+'}'.repeat(close)]);
 cases.push(...custom);const rows=[];let requests=0;
 const fixture={schema:1,kind:'native-mediawiki-template-role-tree',endpoint:'https://pt.wikipedia.org/w/api.php',action:'expandtemplates',method:'GET',credentials:'omit',capturedAt:new Date().toISOString(),requests:0,wikipediaWrites:0,captureComplete:false,plannedMatrixCases:cases.length,cases:rows};
 for(const [id,source]of cases){
  const url=new URL('https://pt.wikipedia.org/w/api.php');url.search=new URLSearchParams({action:'expandtemplates',text:source,title:'Predefinição:RevisaWiki/Teste',prop:'parsetree',format:'json',formatversion:'2',maxlag:'5'});
  const response=await fetch(url,{credentials:'omit',headers:{'User-Agent':'RevisaWiki read-only parser verification'}});requests++;fixture.requests=requests;
  if(response.status!==200){fixture.stoppedStatus=response.status;fs.writeFileSync(output,JSON.stringify(fixture,null,2)+'\n');}
  assert.equal(response.status,200,'Only successful anonymous GET evidence is saved');const data=await response.json();
  assert.equal(typeof data.expandtemplates?.parsetree,'string','The native preprocessor returns its role tree');
  const tree=data.expandtemplates.parsetree;rows.push({id,source,sourceSha256:sha(source),tree,treeSha256:sha(tree),roles:roles(tree)});
  fs.writeFileSync(output,JSON.stringify(fixture,null,2)+'\n');
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 fixture.captureComplete=true;fs.writeFileSync(output,JSON.stringify(fixture,null,2)+'\n');console.log(JSON.stringify({captured:rows.length,requests,file:path.basename(output)}));
}
function verify(file){
 const api=require(path.resolve(file)),fixture=JSON.parse(fs.readFileSync(fixturePath)),report={version:api.version,kind:'template-reader-native-differential',status:'passed',bundles:[{file:path.basename(file),version:api.version,sha256:sha(fs.readFileSync(file))}],runnerSha256:sha(fs.readFileSync(__filename)),fixtureSha256:sha(fs.readFileSync(fixturePath)),evidenceScope:'Replay of successful actual native responses only',capturedCases:fixture.cases.length,fullPlannedMatrixCaptured:fixture.captureComplete===true,captureLimitation:fixture.captureLimitation||null,cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
 function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
 for(const row of fixture.cases){try{
  eq(sha(row.source),row.sourceSha256,'The native input is immutable');eq(sha(row.tree),row.treeSha256,'The native tree is immutable');eq(roles(row.tree),row.roles,'The saved native role inventory is reproducible');
  const parsed=api.v215BraceStructure(row.source),actual=parsed.nodes.slice().sort((a,b)=>a.start-b.start||b.end-a.end).map(n=>({size:n.size,depth:n.depth}));
  const unresolved=parsed.unclosed.map(n=>n.start);
  const normalized=parsed.nodes.slice().sort((a,b)=>a.start-b.start||b.end-a.end).map(n=>({size:n.size,depth:n.depth-unresolved.filter(start=>start<n.start).length}));
  eq(normalized,row.roles,'Closed call/parameter roles match native preprocessing');
  if(!parsed.unclosed.length)eq(actual,row.roles,'Complete source has identical native nesting');
  const cfg={...api.defaults,namespaceNumber:10,pageTitle:'Predefinição:Controle',autoPreview:false};
  eq(api.calculate({kind:'adjust',source:row.source,options:cfg}).text,row.source,'Reading a native syntactic example never rewrites its values or branches');
  report.cases++;
 }catch(error){report.status='failed';report.failures.push({id:row.id,message:error.message});}}
 const output=process.env.REVISAWIKI_REPORT;if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
}
if(process.argv.includes('--capture'))capture().catch(error=>{console.error(error.message);process.exitCode=1;});
else verify(process.argv[2]||process.env.REVISAWIKI_SCRIPT||path.join(root,'dist/2.15.0/RevisaWiki_v2_15_0_completo.js'));
