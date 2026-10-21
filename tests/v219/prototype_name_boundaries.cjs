'use strict';
// Object member names in source text are ordinary literals, not mappings.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const names=['constructor','__proto__','prototype','toString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','__defineGetter__','__defineSetter__'],sources=new Set();
for(const name of names){
 for(const value of ['Valor literal','0','{{Modelo fictício|1=Valor literal}}']){
  sources.add('{{Info/Biografia|nome=Pessoa fictícia|'+name+'='+value+'}}');
  sources.add('{{Citar web|título=Fonte literal|'+name+'='+value+'}}');
 }
 sources.add('{{Citar web|título=Fonte literal|língua='+name+'}}');
 sources.add('{{'+name+'|1={{Cite web|title=Fonte literal}}}}');
 sources.add('{{'+name+'|data=2001-02-03|ocupação=Pesquisadora}}');
}
const report={schemaVersion:1,kind:'prototype-name-source-boundaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',citations:true,infoboxes:true,authors:true,multilingual:true,automaticParameterNames:true,automaticSourceCompatibility:true,markup:true,syntaxRepairs:true,structuralRepairs:true,minorBaseConfirmed:true};
 report.bundles.push({bundle,sha256:sha(bytes),version:api.version});
 const eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);};
 for(const source of sources){
  const descriptor={sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(base)),expectedEndpointSha256:sha(source)};
  const row={id:sha(source),bundle,...descriptor,scenarioSha256:sha(JSON.stringify(descriptor)),intent:'unknown-object-member-literals-remain-unchanged',evidenceKind:'whole-action-negative-control',status:'passed'};report.cases.push(row);
  try{const first=api.calculate({kind:'adjust',source,originalSource:source,options:base}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:base});eq(first.text,source,'An unproved source name or language value stays literal');eq(second.text,source,'A repeated action remains identical');eq(first.preservation||[],[],'Unknown values cause no invented preservation failure');eq(api.safeComposition(source,source,base),'','The exact source is always retained');}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:row.id,message:error.message});}
 }
 eq(sha(fs.readFileSync(file)),sha(bytes),'Actual runtime remains immutable');
}
report.distinctSources=sources.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
