'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(p=>path.resolve(p));if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.join(root,'dist/2.19.0',n)));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),report={kind:'immutable-bounded-syntax-protection-cache',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);};
for(const file of files){const raw=fs.readFileSync(file),api=require(file);report.bundles.push({sha256:sha(raw),version:api.version,bytes:raw.length});
 const run=(id,fn)=>{report.cases++;try{fn();}catch(e){report.status='failed';if(report.failures.length<50)report.failures.push({id,message:e.message});}};
 const pieces=['Texto simples.','{{Modelo|1=Texto}}','{{{campo|valor}}}','[[Tema|Rótulo]]','[[File:Figura.png|thumb|Legenda.]]','<ref name="fonte">Fonte</ref>','<references/>','{|\n! Coluna\n|-\n| Dado\n|}','"{{Exemplo|1=Texto}}"',"''{{Exemplo|1=Texto}}''",'<div>Texto</div>','<!-- {{Exemplo}} -->','<nowiki>{{Exemplo}}</nowiki>','<code>[[Tema]]</code>'];
 for(let a=0;a<pieces.length;a++)for(let b=0;b<pieces.length;b++)for(const tail of ['', '\n Texto pré-formatado\n', '\n{{Aberto', '\n"aberto'])run('context-'+a+'-'+b+'-'+sha(tail).slice(0,8),()=>{
  const source=pieces[a]+'\n'+pieces[b]+tail,expected=api.v219LegacySyntaxProtected(source),first=api.v219ProtectedSyntax(source);
  eq(first,expected,'Cached and uncached syntax protection have identical exact offsets and masks');
  first.ranges.push({start:0,end:source.length,kind:'tampered'});if(first.unclosed[0])first.unclosed[0].start=-1;
  if(first.ranges[0])first.ranges[0].kind='tampered';first.view='tampered';
  eq(api.v219ProtectedSyntax(source),expected,'A caller cannot mutate the shared cached parse');
  const changed='Prefixo\n'+source;eq(api.v219ProtectedSyntax(changed),api.v219LegacySyntaxProtected(changed),'Changed source obtains independently recomputed offsets');
 });
 for(const [tag,close]of [['nowiki','nowiki'],['code','code'],['pre','pre'],['syntaxhighlight','syntaxhighlight']])run('independent-literal-'+tag,()=>{
  const source='<'+tag+'>{{Modelo}}\n[[Tema]]</'+close+'>',result=api.v219ProtectedSyntax(source);
  eq(result.ranges,[{start:0,end:source.length,kind:tag}],'The complete literal block has the independently specified boundaries');
  eq(result.view,source.replace(/[^\r\n]/g,' '),'Every literal character is masked while line endings retain offsets');eq(result.unclosed,[],'A complete literal has no invented unclosed range');
 });
 run('cache-budget',()=>{
  for(let n=0;n<50;n++){const source='Texto '+n+'\n'+Array.from({length:500},(_,i)=>'{{Modelo|1='+i+'}}').join('\n');api.v219ProtectedSyntax(source);}
  const status=api.parserCacheStatus();eq(status.accountingConsistent,true,'Shared cache accounting is consistent');eq(status.estimatedBytes<=status.maximumEstimatedBytes,true,'Protection views and ranges fit the shared cache bound');
 });
 eq(sha(fs.readFileSync(file)),sha(raw),'The actual runtime is immutable');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
