'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),report={kind:'native-month-year-ascii-outer-padding-actions',status:'passed',
 runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(fs.readFileSync(path.join(__dirname,'source_month_year_padding_contract.json'))),
 bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
for(const file of files){
 const api=require(file),bundle=path.basename(file),runtimeSha256=sha(fs.readFileSync(file));report.bundles.push({bundle,runtimeSha256,version:api.version});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
  authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false,
  referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,singleLineCitations:false},
  cite=(fields,name='Citar web')=>'{{'+name+'|título=Fonte literal|url=https://example.org/fonte|'+fields+'|autor=Pessoa fictícia}}',
  calculate=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}}),
  plan=(source,extra={})=>api.v219SourceCompatibilityPlan(source,{...cfg,...extra});
 function run(id,source,expected,extra,fn){const options={...cfg,...extra};let result;
  try{result=calculate(source,extra);fn(result,options);report.cases.push({bundle,id,status:'passed',runtimeSha256,sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(options)),expectedEndpointSha256:sha(expected),actualEndpointSha256:sha(result.text),scenarioSha256:sha(JSON.stringify([source,options,expected])),intentSha256:sha(id),appliedIds:(result.changes||[]).filter(change=>change.count>0).map(change=>change.id)});}
  catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed',runtimeSha256,sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(options)),expectedEndpointSha256:sha(expected),actualEndpointSha256:result&&sha(result.text)});report.failures.push({bundle,id,message:error.message});}
 }
 function positive(id,source,expected,extra={}){run(id,source,expected,extra,(result,options)=>{
  const fresh=plan(source,extra);eq(fresh.text,expected,'The fresh source plan preserves every retained edge byte');
  ok(fresh.edits.length>0&&fresh.edits.every(edit=>edit.proof.minorSafe===false),'Supplied obsolete month activation is nonminor');
  ok(api.v219SourceCompatibilityProof(source,expected,fresh,options),'The exact date transaction replays against its original source');
  eq(result.text,expected,'The complete action reaches the independently declared padded endpoint');
  eq(calculate(result.text,extra).text,result.text,'The complete padded action converges in one click');
  eq(api.preservationAudit(source,result.text,options),[],'The actual complete result retains publication/date association');
  eq(api.safeComposition(source,result.text,options),'','The actual complete result composes safely');
  for(const changed of [expected.replace('2001','2002'),expected.replace('março','abril')]){
   eq(api.v219SourceCompatibilityProof(source,changed,{...fresh,text:changed},options),false,'A wrong month or year cannot borrow the padded repair');
   ok(api.preservationAudit(source,changed,options).length>0,'The production preservation guard rejects an altered supplied date');
   ok(!!api.safeComposition(source,changed,options),'The production composition guard independently rejects an altered supplied date');
  }
 });}
 const edges=['\n','\r\n',' \t\r\n ','\n \t','\r'];
 for(const name of ['Citar web','Citar jornal','Citar livro','Citar revista','Citar periódico'])for(const edge of edges){
  const tag=sha(name+edge).slice(0,12);
  positive('pair-'+tag,cite('ano='+edge+'2001'+edge+'|mes='+edge+'março'+edge,name),cite('data='+edge+'março de 2001'+edge,name));
  positive('range-'+tag,cite('month='+edge+'March/April'+edge+'|year='+edge+'2001'+edge,name),cite('data='+edge+'março–abril de 2001'+edge,name));
  for(const key of ['data','ano'])positive('scalar-'+key+'-'+tag,cite(key+'='+edge+'2001 March'+edge,name),cite('data='+edge+'março de 2001'+edge,name));
 }
 for(const newline of ['\n','\r\n'])for(const name of ['Citar periódico','Citar web']){
  const source='{{'+name+newline+' | autor = Pessoa fictícia'+newline+' | ano = 2001'+newline+' | mes = março'+newline+' | titulo = Fonte literal'+newline+' }}',
   expected='{{'+name+newline+' | autor = Pessoa fictícia'+newline+' | data = março de 2001'+newline+' | titulo = Fonte literal'+newline+' }}',
   flat='{{'+name+'| autor = Pessoa fictícia| data = março de 2001| titulo = Fonte literal}}',
   unchangedFlat='{{'+name+'| autor = Pessoa fictícia| ano = 2001| mes = março| titulo = Fonte literal}}';
  positive('multiline-named-'+sha(source).slice(0,12),source,expected);
  run('default-singleline-'+sha(source).slice(0,12),source,flat,{singleLineCitations:true},(result,options)=>{
   eq(result.text,flat,'Default single-line formatting and the padded date repair compose in one action');eq(calculate(result.text,{singleLineCitations:true}).text,result.text,'The default action is stable');
   eq(result.preservation||[],[],'The default action reports no date-preservation failure');eq(api.preservationAudit(source,result.text,options),[],'The guard binds the date before default line folding');
  });
  for(const off of [{automaticSourceCompatibility:false},{automaticCitationDateValues:false},{dates:false}])for(const singleLineCitations of [false,true]){
   const extra={...off,singleLineCitations},wanted=singleLineCitations?unchangedFlat:source;
   run('optout-'+sha(source+JSON.stringify(extra)).slice(0,12),source,wanted,extra,(result,options)=>{
    eq(plan(source,extra).edits,[],'An explicit date/source opt-out cannot obtain a fresh repair');eq(result.text,wanted,'An unrelated single-line option cannot bypass a date/source opt-out');
    eq(calculate(result.text,extra).text,result.text,'The opt-out has no delayed second-click repair');eq(api.preservationAudit(source,result.text,options),[],'The opted-out source remains safely preserved');
   });
  }
 }
 const negativeFields=['ano=20\n01|mes=março','ano=2001|mes=mar\nço','ano=2001|mes=March\n/April',
  'ano=2001|mes=March/\nApril','data=2001\nMarch','ano=2001\r\nMarch',
  ...['\u00a0','\v','\f','\u0085','\u2028','\u2029'].flatMap(edge=>['ano='+edge+'2001|mes=março','ano=2001|mes='+edge+'março','data='+edge+'2001 March']),
  'ano=\n2001\n|mes=\nmarço\n|year=','ano=\n2001\n|mes=\nmarço\n|mês=',
  'ano=\n2001\n|mes=\nmarço\n|data=','ano=\n2001\n|mes={{Mês fictício}}',
  'ano=\n2001\n|mes=março<!--nota-->','ano=\n2001\n|mes=março|dia='];
 for(const fields of negativeFields){const source=cite(fields);run('grammar-refusal-'+sha(fields).slice(0,12),source,source,{},(result)=>{
  eq(plan(source).text,source,'Only outer ASCII CR/LF padding extends the finite source grammar');
  eq(result.text,source,'The complete action leaves the unproved date spelling and its source bytes intact');
 });}
 for(const wrap of [s=>'"'+s+'"',s=>"''"+s+"''",s=>'<nowiki>'+s+'</nowiki>',s=>'{{Modelo fictício|codigo='+s+'}}',s=>'```wikitext\n'+s+'\n```']){
  const source=wrap(cite('ano=\r\n2001\r\n|mes=\r\nmarço\r\n'));
  run('protected-'+sha(source).slice(0,12),source,source,{},(result)=>{eq(plan(source).edits,[],'A padded code example remains outside the source repair');eq(result.text,source,'The complete action retains the entire protected example');});
 }
 const source='<ref name="alfa">'+cite('ano=2001\n |mes=março\n ')+'</ref> Texto.<ref name="alfa" />\n{{Referências}}',
  expected='<ref name="alfa">'+cite('data=março de 2001\n ')+'</ref> Texto.<ref name="alfa" />\n{{Referências}}';
 positive('named-reuse-publication-binding',source,expected);
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
