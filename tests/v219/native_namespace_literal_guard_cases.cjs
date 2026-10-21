'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'native-namespace-literal-visible-label-preservation',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],claim:'Guard-only mutants and actual no-op boundaries, not transformation positives.',networkRequests:0,wikipediaWrites:0},eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
for(const file of files){const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),cfg={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',links:true,categories:true};report.bundles.push({bundle,sha256:sha(bytes),version:api.version});
 const run=(id,fn)=>{try{fn();report.cases.push({bundle,id,status:'passed'});}catch(e){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:e.message});}};
 for(const head of ['File','Image','Imagem','Arquivo','Ficheiro','Categoria','Category'])for(const control of ['\t','\r','\n','\u0001'])for(const pattern of [c=>c+head+':Exemplo.svg',c=>head+c+':Exemplo.svg',c=>head+':'+c+'Exemplo.svg'])run('literal/'+sha(head+control+pattern(control)).slice(0,16),()=>{
  const link='[['+pattern(control)+'|Rótulo literal]]',source='Texto literal '+link+' em contexto.',out=api.calculate({kind:'adjust',source,options:cfg});
  eq(out.text,source,'Control-padded native namespace spellings do not activate images or categories');
  eq(api.calculate({kind:'adjust',source:out.text,options:cfg}).text,source,'A second action preserves the literal source');
  for(const mutated of [source.replace('Rótulo literal','Outro rótulo'),source.replace(link,'')])ok(api.preservationAudit(source,mutated,cfg).length>0,'A literal namespace-looking link cannot hide a changed or missing visible label');
 });
 for(const head of ['File','Image','Imagem','Arquivo','Ficheiro','Categoria','Category'])run('escaped/'+head,()=>{const source='Texto [[:'+head+':Exemplo.svg|Rótulo literal]] em contexto.';for(const mutated of [source.replace('Rótulo literal','Outro rótulo'),source.replace(/\[\[[\s\S]*?\]\]/,'')])ok(api.preservationAudit(source,mutated,cfg).length>0,'An escaped namespace remains an ordinary visible label');});
 eq(sha(fs.readFileSync(file)),sha(bytes),'Actual bundle bytes remain unchanged');}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
