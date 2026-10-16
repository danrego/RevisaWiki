'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs');
const files=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const report={version:'2.11.0',kind:'source-bound-minor-classification',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const equal=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
function test(bundle,name,run){try{run();report.cases.push({bundle,name,status:'passed'});}catch(error){report.failures.push({bundle,name,message:candidate?candidate.sanitized(error.message):String(error.message)});report.cases.push({bundle,name,status:'failed'});}}
for(const file of files){
 const api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',minorBaseConfirmed:true,autoPreview:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false};
 const check=(before,after,options={})=>{
  const settings={...cfg,...options};
  equal(api.mechanicalMinorResult(before,settings),after,'The independent expected output matches only the finite mechanical replay');
  equal(api.minorEligibility(before,after,settings).eligible,true,'The complete saved-source mechanical difference qualifies');
  equal(api.mechanicalMinorResult(after,settings),after,'The mechanical replay is idempotent');
  equal(api.minorEligibility(after,after,settings).eligible,false,'No-op and Undo do not claim a new minor edit');
 };
 const links=count=>Array.from({length:count},(_,index)=>'[[Termo '+index+'|Termo '+index+']]').join('\n');
 for(const count of [1,12,24,100,500])test(bundle,'all '+count+' equivalent links are minor regardless of count',()=>{
  const before=links(count),after=Array.from({length:count},(_,index)=>'[[Termo '+index+']]').join('\n');check(before,after);
  if(count>=100)equal(Buffer.byteLength(before)-Buffer.byteLength(after)>500,true,'The exact removed-byte count exceeds the former ceiling');
 });
 const citationBefore='A.<ref>{{Cite web|title=Fonte|url=https://example.test/fonte|access-date=2020-02-01}}</ref>\n{{Referências}}',citationAfter='A.<ref>{{Citar web|título=Fonte|url=https://example.test/fonte|acessodata=2020-02-01}}</ref>\n{{Referências}}';
 test(bundle,'equivalent citation name and parameters preserve the source',()=>{check(citationBefore,citationAfter);equal(api.calculate({kind:'adjust',source:citationBefore,options:cfg}).minorCheck.eligible,true,'The actual engine uses the same classification');});
 test(bundle,'known end heading spacing',()=>check('==Referências==\nTexto.','== Referências ==\nTexto.'));
 test(bundle,'reference punctuation',()=>check('A<ref>Fonte.</ref>.\n{{Referências}}','A.<ref>Fonte.</ref>\n{{Referências}}'));
 test(bundle,'an audited typo is minor',()=>check('Um examplo de texto.','Um exemplo de texto.'));
 test(bundle,'three equivalent italic pairs retain their content',()=>check('<i>um</i> e <em>dois</em> e <i>três</i>.',"''um'' e ''dois'' e ''três''."));
 const tableBefore='{| class="wikitable"\n|-\n|-\n! Cidade !! Nome\n|-\n| A || B\n|}\n',tableAfter='{| class="wikitable"\n|-\n! scope="col" | Cidade !! scope="col" | Nome\n|-\n| A || B\n|}\n';
 test(bundle,'verified empty table marker and column scopes',()=>{check(tableBefore,tableAfter);equal(api.calculate({kind:'adjust',source:tableBefore,options:cfg}).minorCheck.eligible,true,'Production finite table corrections qualify');});
 test(bundle,'reference collector alias is an equivalent renderer',()=>check('A.<ref>Fonte.</ref>\n{{Referência}}','A.<ref>Fonte.</ref>\n{{Referências}}'));
 test(bundle,'invalid numeric reference names move as a family',()=>{
  const before='A.<ref name="1">Fonte.</ref>\nB.<ref name="1" />\n{{Referências}}',after='A.<ref name="ref-1">Fonte.</ref>\nB.<ref name="ref-1" />\n{{Referências}}';check(before,after);
  equal(api.minorEligibility(before,before.replace('name="1">','name="ref-1">'),cfg).eligible,false,'A dangling partial rename cannot qualify as a selected subset');
 });
 test(bundle,'a selected independent correction remains minor',()=>{
  const before='[[Primeiro|Primeiro]]\nTexto mantido.\n[[Segundo|Segundo]]',after='[[Primeiro]]\nTexto mantido.\n[[Segundo|Segundo]]';
  equal(api.minorEligibility(before,after,cfg).eligible,true,'An exact accepted subset of finite units qualifies');
  equal(api.minorEligibility(before,after.replace('mantido','alterado'),cfg).eligible,false,'An unrelated manual change is excluded');
 });
 test(bundle,'selection can retain a complete reference family and reject an independent link',()=>{
  const before='A.<ref name="1">Fonte.</ref>\nB.<ref name="1" />\n[[Exemplo|Exemplo]]\n{{Referências}}',after=before.replaceAll('name="1"','name="ref-1"');
  equal(api.minorEligibility(before,after,cfg).eligible,true,'Complete dependent reference units qualify without the independent link');
 });
 test(bundle,'a large article with many purely mechanical edits qualifies',()=>{
  const before=Array.from({length:2200},(_,index)=>'Linha '+index+' contém [[Termo '+index+'|Termo '+index+']] e texto preservado.').join('\n');
  const after=before.replace(/\[\[(Termo \d+)\|\1\]\]/g,'[[$1]]');
  equal(Buffer.byteLength(before)>100000,true,'The complex positive input exceeds 100 KB');
  equal(api.minorEligibility(before,after,cfg).eligible,true,'Many exact source-preserving corrections have no semantic size ceiling');
 });
 for(const [name,source,after]of [
  ['portal addition','Texto.','Texto.\n{{Portal3|Ciência}}'],
  ['authority addition','Texto.','Texto.\n{{Controle de autoridade}}'],
  ['category addition','Texto.','Texto.\n[[Categoria:Ciência]]'],
  ['maintenance removal','{{Sem fontes}}\nTexto.','Texto.'],
  ['new factual source','Texto.','Texto.<ref>Fonte nova.</ref>'],
  ['citation title change',citationBefore,citationAfter.replace('título=Fonte','título=Outra fonte')],
  ['table data change',tableBefore,tableAfter.replace('| A || B','| C || B')],
  ['birth fact change','{{Info/Biografia|nome=Exemplo|data_nascimento=1 de janeiro de 1900}}','{{Info/Biografia|nome=Exemplo|data_nascimento=2 de janeiro de 1900}}'],
  ['arbitrary prose substitution','Texto original.','Texto alterado.'],
  ['partial link label deletion','[[Exemplo|Exemplo]]','[[Exemplo|Exempl]]']
 ])test(bundle,'substantive refusal '+name,()=>equal(api.minorEligibility(source,after,cfg).eligible,false,'A substantive or unverified retained effect never qualifies'));
 for(const options of [{minorBaseConfirmed:false},{minorBaseConfirmed:undefined},{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true}])test(bundle,'saved-revision and context guard '+JSON.stringify(options),()=>equal(api.minorEligibility('[[Exemplo|Exemplo]]','[[Exemplo]]',{...cfg,...options}).eligible,false,'The original source and full article scope must remain confirmed'));
 for(const wrapper of [['<nowiki>','</nowiki>'],['<pre>','</pre>'],['<syntaxhighlight lang="wikitext">','</syntaxhighlight>'],['<!--','-->']])test(bundle,'protected examples remain literal '+wrapper[0],()=>{
  const before=wrapper[0]+'[[Exemplo|Exemplo]]'+wrapper[1],after=wrapper[0]+'[[Exemplo]]'+wrapper[1];
  equal(api.mechanicalMinorResult(before,cfg),before,'A protected example is unchanged');
  equal(api.minorEligibility(before,after,cfg).eligible,false,'Manually changing an example cannot borrow the mechanical proof');
 });
 test(bundle,'opted-out links cannot supply a proof',()=>equal(api.minorEligibility('[[Exemplo|Exemplo]]','[[Exemplo]]',{...cfg,links:false}).eligible,false,'Only enabled rules qualify'));
 test(bundle,'coarse gross-byte metrics do not invalidate exact mechanical source proof',()=>{
  const before='[[Exemplo|Exemplo]]',after='[[Exemplo]]';
  equal(api.minorEligibility(before,after,{...cfg,metrics:{before:19,after:11,delta:-8,precise:false,consistent:false,changed:null,hunks:1}}).eligible,true,'Classification follows reproduced effects, while metrics remain descriptive');
 });
 test(bundle,'mixed automatic portal and formatting output remains ordinary',()=>{
  const before='[[Exemplo|Exemplo]]',after='[[Exemplo]]\n{{Portal3|Biografias}}';
  equal(api.minorEligibility(before,after,{...cfg,automaticTopicPortals:true,automaticBiographyPortals:true}).eligible,false,'Automatic additions do not become minor merely because formatting is also present');
 });
}
report.status=report.failures.length?'failed':'passed';report.passed=report.cases.filter(item=>item.status==='passed').length;report.failed=report.failures.length;
const directory=candidate?candidate.artifactDirectory():path.resolve(process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2110');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'minor_classification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.failures}));if(report.failed)process.exitCode=1;
