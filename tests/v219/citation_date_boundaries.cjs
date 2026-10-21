'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=v=>crypto.createHash('sha256').update(v).digest('hex'),files=process.argv.slice(2).filter(v=>!v.startsWith('--')).map(v=>path.resolve(v));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.join(root,'dist/2.19.0',n)));
const report={schemaVersion:1,kind:'typed-citation-date-boundaries',runnerSha256:sha(fs.readFileSync(__filename)),status:'passed',bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);};
const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const calendarValid=(day,month,year)=>day>=1&&month>=1&&month<=12&&year>=1000&&year<=9999&&day<=[31,year%4===0&&(year%100!==0||year%400===0)?29:28,31,30,31,30,31,31,30,31,30,31][month-1];
for(const file of files){
 const raw=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),citations:true,dates:true,automaticCitationDateValues:true,syntaxRepairs:true,structuralRepairs:true,markup:true,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',now:Date.UTC(2026,9,17)};
 report.bundles.push({bundle,version:api.version,sha256:sha(raw),bytes:raw.length});
 const test=(id,source,expected,options={})=>{report.cases++;try{
  const cfg={...base,...options},r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
  eq(r.text,expected,'The actual action reaches the independently specified exact date');eq(api.calculate({kind:'adjust',source:r.text,options:cfg}).text,r.text,'The complete action is idempotent');
  eq(r.preservation||[],[],'The pipeline preserves the date facts');eq(api.preservationAudit(source,r.text,cfg),[],'Independent inventory keeps the same typed precision');eq(api.safeComposition(source,r.text,cfg),'','The complete date transaction composes');
 }catch(error){report.status='failed';if(report.failures.length<100)report.failures.push({bundle,id,message:error.message});}};
 const call=(value,key='data')=>'{{Citar web|título=Documento literal|'+key+'='+value+'}}';
 for(const year of [1000,1600,1900,2000,2001,2004,2100,2400,9999])for(let month=1;month<=12;month++)for(const day of [1,5,15,28,29,30,31]){
  const value=String(year)+String(month).padStart(2,'0')+String(day).padStart(2,'0'),iso=year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  test('basic-iso-'+value,call(value),call(calendarValid(day,month,year)?iso:value));
 }
 for(const [before,after]of [
  ['[[2001]]','2001'],['[[2001-3-5]]','2001-03-05'],['15 - 03 - 2001','15 de março de 2001'],
  ['05DEMarDE2001','5 de março de 2001'],['Settembre 2001','setembro de 2001'],
  ['5 a 7 março de 2001','5–7 de março de 2001'],['March a April 2001','março–abril de 2001'],
  ['2001-2003','2001–2003'],['2001 a 2003','2001–2003']
 ]){
  test('literal-'+before,call(before),call(after));
  for(const wrap of [x=>'"'+x+'"',x=>'«'+x+'»',x=>'<nowiki>'+x+'</nowiki>',x=>'<!-- '+x+' -->',x=>'<code>'+x+'</code>',x=>'{{Modelo desconhecido|1='+x+'}}',x=>'```wikitext\n'+x+'\n```'])test('opaque-'+report.cases,wrap(call(before)),wrap(call(before)));
  test('dates-off-'+before,call(before),call(before),{dates:false});
  for(const competitor of ['data=1999','date=1999','data=']){
   const source=call(before).slice(0,-2)+'|'+competitor+'}}';test('collision-'+report.cases,source,source);
  }
 }
 for(const value of ['03 - 05 - 2001','20010005','20011305','20010229','19000229','20010300','00010305','200103005','2001-2001','2003-2001','2001-2003 a.C.','20010305?','[[20010305|Outra data]]','[[20010305#Trecho]]','1DEmDE2001','051DEMarDE2001','5 a 3 março de 2001','29 a 31 fevereiro de 2001','5 a 7 mês de 2001','{{Valor dinâmico}}'])test('refusal-'+value,call(value),call(value));
 for(const key of ['acessodata','arquivodata'])for(const value of ['[[2001]]','Settembre 2001','5 a 7 março de 2001','2001-2003'])test('precision-'+key+'-'+value,call(value,key),call(value,key));
 const body='O código 20010305 pertence ao documento.\n\n{{Modelo desconhecido|data=20010305}}';test('not-a-known-citation-field',body,body);
 eq(sha(fs.readFileSync(file)),sha(raw),'Runtime bytes remain stable during execution');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
