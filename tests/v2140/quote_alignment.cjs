'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):['RevisaWiki_v2_14_0.js','RevisaWiki_v2_14_0_completo.js'].map(name=>path.join(root,'dist/2.14.0',name));
const report={version:'2.14.0',kind:'native-quote-alignment-boundaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function test(bundle,id,run){try{run();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file);
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file)),version:api.version});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',autoPreview:false,minorBaseConfirmed:true,
  spelling:false,dates:false,portals:false,automaticTopicPortals:false,automaticBiographyPortals:false,
  authorityControl:false,referenceColumns:false,unifiedNotesReferences:false,multilingual:false};
 const quote=(field,value,body='Palavras literais.',name='caixa de citação',spacing='')=>
  'Texto introdutório.\n{{'+name+'|'+spacing+field+spacing+'='+spacing+value+spacing+'|citação='+body+'|fonte=Autor literal.}}\n'+(body.includes('{{sfn|')?'{{Referências}}\n':'');
 function prove(source,expected,amount){
  const plan=api.v214QuoteAlignmentPlan(source,cfg),result=api.calculate({kind:'adjust',source,options:cfg});
  eq(plan.text,expected,'The independent endpoint changes only intended parameter names');
  eq(plan.edits.length,amount,'One source-bound edit for each renamed field');
  eq(api.v214QuoteAlignmentProof(source,expected,plan,cfg),true,'Exact source and edit proof agrees');
  eq(result.text,expected,'The complete engine applies the correction in one action');
  eq(result.preservation,[],'No preservation finding');
  eq(api.safeComposition(source,expected,cfg),'','The complete endpoint composes safely');
  eq(api.preservationAudit(source,expected,cfg),[],'Independent metadata and text retention agrees');
  eq(api.calculate({kind:'adjust',source:expected,options:cfg}).text,expected,'The next action is idempotent');
  const count=api.v211RetainedAdjustments(source,expected);eq(count.exact,true,'Exact retained operation count');eq(count.count,amount,'Every name change is counted once');
  eq(result.minorCheck.eligible,true,'Only the confirmed mechanical formatting qualifies as minor');
 }
 for(const [field,target,values]of [
  ['alinhar','posição',['direita','esquerda','centro','right','left','center','none']],
  ['alinhar_fonte','posição-autor',['direita','esquerda','centro','right','left','center']]
 ])for(const value of values)for(const name of ['caixa de citação','Caixa de citação','Predefinição:Caixa de citação','Caixa_de_citação'])for(const spacing of ['',' ','\n'])test(bundle,'native-name '+JSON.stringify([field,value,name,spacing]),()=>{
  const source=quote(field,value,'Palavras literais.',name,spacing),expected=source.replace(field+spacing+'=',target+spacing+'=');prove(source,expected,1);
 });
 for(const body of ["Palavras em ''itálico''.",'Um [[Termo|rótulo]] literal.','Uma chamada{{sfn|Autor|2020}}.','Texto com <nowiki>{{exemplo}}</nowiki>.','Uma fórmula <math>x^2</math>.','Texto com <code>nome</code>.'])test(bundle,'unchanged quote body '+sha(body).slice(0,10),()=>{
  const source=quote('alinhar','direita',body),expected=source.replace('alinhar=','posição=');prove(source,expected,1);
  eq(expected.includes(body),true,'Literal markup and references inside the quote are retained byte for byte');
 });
 for(const [field,target]of [['alinhar','posição'],['alinhar_fonte','posição-autor']])for(const value of ['','diagonal','nenhum','left;display:none','{{direção}}','direita<!--x-->','direita|'+target+'=esquerda','direita|'+field+'=direita','direita|'+(field==='alinhar'?'align':'salign')+'=direita'])test(bundle,'refusal '+JSON.stringify([field,value]),()=>{
  const source=quote(field,value);eq(api.v214QuoteAlignmentPlan(source,cfg).text,source,'Unknown, dynamic and competing field values stay unchanged');
 });
 for(const name of ['Caixa de Citação','CAIXA DE CITAÇÃO','Quote box','Outro modelo'])test(bundle,'unverified template '+name,()=>{
  const source=quote('alinhar','direita','Palavras.',name);eq(api.v214QuoteAlignmentPlan(source,cfg).text,source,'No unverified capitalization or foreign wrapper is assumed to be a native template');
 });
 const simple=quote('alinhar','direita');
 for(const [kind,wrap]of [
  ['comment',s=>'<!--'+s+'-->'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],
  ['code',s=>'<code>'+s+'</code>'],['math',s=>'<math>'+s+'</math>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],
  ['fence',s=>'```wikitext\n'+s+'```\n'],['unknown owner',s=>'{{Modelo desconhecido|'+s+'}}'],['inclusion',s=>'<noinclude>'+s+'</noinclude>']
 ])test(bundle,'protected example '+kind,()=>{const source=wrap(simple);eq(api.v214QuoteAlignmentPlan(source,cfg).text,source,'Protected examples remain byte-identical');});
 for(const delta of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:undefined},{discussionPage:true},{sectionOnly:true},{section:0},{section:'1'},{pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'},{model:'json'},{syntaxRepairs:false},{structuralRepairs:false},{auxiliaryTemplates:false},{automaticParameterNames:false}])test(bundle,'source scope '+JSON.stringify(delta),()=>{
  eq(api.v214QuoteAlignmentPlan(simple,{...cfg,...delta}).text,simple,'Only complete eligible articles authorize the finite repair');
 });
 for(const fields of ['posição=direita','align=right','posição-autor=direita','salign=right'])test(bundle,'accepted alias '+fields,()=>{
  const source='Texto.\n{{caixa de citação|'+fields+'|citação=Texto.}}\n';eq(api.v214QuoteAlignmentPlan(source,cfg).text,source,'Accepted native aliases never undergo cosmetic translation');
 });
 test(bundle,'two field one action with nested short citation',()=>{
  const source="Texto.\n{{caixa de citação|alinhar=direita|alinhar_fonte=centro|citação=Texto literal.|fonte=''Obra literal''{{sfn|Autor|2020}}}}\n{{Referências}}\n",expected=source.replace('alinhar=','posição=').replace('alinhar_fonte=','posição-autor=');prove(source,expected,2);
  eq(api.v214QuoteAlignmentProof(source+' ',expected,api.v214QuoteAlignmentPlan(source,cfg),cfg),false,'Stale sources cannot borrow the proof');
  eq(api.v214QuoteAlignmentProof(source,expected,{...api.v214QuoteAlignmentPlan(source,cfg),edits:[]},cfg),false,'A forged edit list is rejected');
 });
 test(bundle,'existing namespace migration composes honestly',()=>{
  const source=quote('alinhar','direita','Palavras literais.','Predefinição:Caixa de citação'),expected=source.replace('Predefinição:','').replace('alinhar=','posição='),options={...cfg,multilingual:true};
  const result=api.calculate({kind:'adjust',source,options});eq(result.text,expected,'The existing namespace cleanup and new field correction finish together');
  eq(api.v211RetainedAdjustments(source,expected).count,2,'The independent template-name change also counts');
  eq(api.calculate({kind:'adjust',source:expected,options}).text,expected,'The combined native conversion is idempotent');
  eq(result.preservation,[],'The existing template conversion preserves every value');
 });
 for(const count of [2,8,32,64])test(bundle,'many quote boxes '+count,()=>{
  const source=Array.from({length:count},(_,i)=>'Parágrafo '+i+'.\n{{caixa de citação|alinhar=direita|alinhar_fonte=centro|citação=Texto '+i+'.|fonte=Fonte '+i+'.}}\n').join('\n'),expected=source.replaceAll('alinhar=','posição=').replaceAll('alinhar_fonte=','posição-autor=');prove(source,expected,count*2);
 });
 test(bundle,'strict quote content and source retention',()=>{
  const source=quote('alinhar','direita'),expected=source.replace('alinhar=','posição=');
  for(const changed of [expected.replace('Palavras literais.','Outras palavras.'),expected.replace('Autor literal.','Outro autor.'),expected.replace('direita','esquerda'),expected.replace('|fonte=Autor literal.',''),expected.replace('citação=Palavras literais.','citação=')]){
   eq(Boolean(api.safeComposition(source,changed,cfg)),true,'A field-name proof never authorizes changing a quotation, source, alignment or omission');
   eq(api.preservationAudit(source,changed,cfg).length>0,true,'Independent retained-object proof rejects the forged endpoint');
  }
 });
 for(const key of ['citação','fonte','autor','estilo','largura'])test(bundle,'repeated field precedence '+key,()=>{
  const source='Texto.\n{{caixa de citação|alinhar=direita|citação=Texto literal.|'+key+'=A|'+key+'=B}}\n',
   expected=api.v214QuoteAlignmentPlan(source,cfg).text,forged=expected.replace('|'+key+'=A|'+key+'=B','|'+key+'=B|'+key+'=A');
  eq(Boolean(api.safeComposition(source,forged,cfg)),true,'Changing last-value precedence is never a formatting repair');
  eq(api.preservationAudit(source,forged,cfg).length>0,true,'Every repeated field retains its ordered values');
 });
 test(bundle,'paragraph breaks inside a quotation are data',()=>{
  const source=quote('alinhar','direita','Primeiro parágrafo.\n\nSegundo parágrafo.'),expected=api.v214QuoteAlignmentPlan(source,cfg).text;
  eq(expected.includes('Primeiro parágrafo.\n\nSegundo parágrafo.'),true,'The finite edit preserves paragraph boundaries');
  const forged=expected.replace('Primeiro parágrafo.\n\nSegundo parágrafo.','Primeiro parágrafo. Segundo parágrafo.');
  eq(Boolean(api.safeComposition(source,forged,cfg)),true,'A merged quotation paragraph cannot borrow the field-name proof');
  eq(api.preservationAudit(source,forged,cfg).length>0,true,'The independent object proof retains paragraph boundaries');
 });
}
report.failed=report.failures.length;const directory=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2140'));fs.mkdirSync(directory,{recursive:true});
fs.writeFileSync(path.join(directory,'quote_alignment.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.failures.slice(0,8)}));if(report.failed)process.exitCode=1;
