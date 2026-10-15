'use strict';
/* Offline execution against immutable local Wikipedia revisions; no browser/network/account API. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'../..');
const options=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...rest]=value.replace(/^--/,'').split('=');return [key,rest.join('=')||true];}));
const runName=String(options.run||('run_'+new Date().toISOString().replace(/[:.]/g,'-')));
if(!/^[A-Za-z0-9_-]+$/.test(runName))throw new Error('Invalid local run name');
const runDir=path.join(__dirname,runName);if(fs.existsSync(runDir))throw new Error('Run folder already exists, refusing to overwrite evidence');fs.mkdirSync(runDir,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const distributionDir=path.join(root,'dist/2.3.0');
const names=['RevisaWiki_v2_3.js','RevisaWiki_v2_3_dados.js','RevisaWiki_v2_3_completo.js'];
const sourceDistributionDir=options['frozen-dir']?path.resolve(String(options['frozen-dir'])):distributionDir;
const frozenDir=path.join(runDir,'frozen_distribution');fs.mkdirSync(frozenDir);
const frozenFiles=names.map(name=>{const file=path.join(sourceDistributionDir,name),raw=fs.readFileSync(file);fs.writeFileSync(path.join(frozenDir,name),raw);return {name,bytes:raw.length,sha256:sha(raw),sourceFile:path.relative(root,file)};});
for(const file of frozenFiles)assert.equal(sha(fs.readFileSync(path.join(sourceDistributionDir,file.name))),file.sha256,'All three distribution files stable while captured');
fs.writeFileSync(path.join(runDir,'frozen_files.json'),JSON.stringify(frozenFiles,null,2)+'\n');
const core=require(path.join(frozenDir,names[0])),complete=require(path.join(frozenDir,names[2]));assert.equal(core.version,'2.3.0');assert.equal(complete.version,core.version);
const corpora=[{name:'new',directory:path.join(__dirname,'inputs/new')},{name:'old',directory:path.join(__dirname,'inputs/old')}];
const manifestMetadata=corpora.map(c=>{c.manifestFile=path.join(c.directory,'manifest.json');const raw=fs.readFileSync(c.manifestFile);c.entries=JSON.parse(raw);assert.equal(c.entries.length,1000);assert.equal(new Set(c.entries.map(e=>e.title)).size,1000);return {name:c.name,articles:c.entries.length,manifestSha256:sha(raw),manifestFile:path.relative(root,c.manifestFile)};});
const allInputs=corpora.flatMap(c=>c.entries.map(item=>({...item,corpus:c.name,sourceFile:path.join(c.directory,item.file)})));
assert.equal(new Set(allInputs.map(i=>i.revid)).size,2000);assert.equal(new Set(allInputs.map(i=>i.title.normalize('NFC').replace(/_/g,' ').toLocaleLowerCase('pt-BR'))).size,2000);
const limit=options.limit?Number(options.limit):allInputs.length;assert(Number.isInteger(limit)&&limit>0&&limit<=2000);
const stride=Number(options.stride||1),startIndex=Number(options.start||0);assert(Number.isInteger(stride)&&stride>0&&Number.isInteger(startIndex)&&startIndex>=0&&startIndex<stride);
const selected=allInputs.slice(0,limit).filter((_,index)=>index%stride===startIndex),cfg={authorityControl:false,endTemplateOrder:false,namespaceNumber:0,minorBaseConfirmed:false};
const qualifiedWarnings=JSON.parse(fs.readFileSync(path.join(__dirname,'qualified_source_warnings.json'))).entries;
const report={version:core.version,run:runName,startedAt:new Date().toISOString(),frozenFiles,manifests:manifestMetadata,totalArticles:selected.length,logicalCorpusArticles:allInputs.length,shard:{index:startIndex,stride},options:cfg,checks:0,networkRequests:0,wikipediaWrites:0,articles:[]};
const errors=issues=>issues.filter(x=>x.severity==='error').reduce((o,x)=>{const k=x.code||x.type||'uncoded';o[k]=(o[k]||0)+1;return o;},{});
let totalStarted=performance.now();
function save(){report.completed=report.articles.length;report.passed=report.articles.filter(a=>a.passed).length;report.failed=report.completed-report.passed;report.failedArticles=report.articles.filter(a=>!a.passed).map(a=>({title:a.title,revid:a.revid,corpus:a.corpus,failures:a.failures}));fs.writeFileSync(path.join(runDir,'results.json'),JSON.stringify(report,null,2)+'\n');}
function check(row,name,callback){report.checks++;row.checks++;try{callback();}catch(error){row.failures.push({check:name,message:error.message,stack:error.stack});}}
for(const [index,item]of selected.entries()){
 const started=performance.now(),row={title:item.title,revid:item.revid,corpus:item.corpus,inputBytes:item.bytes,inputSha256:item.sha256,passed:false,checks:0,failures:[],modes:{}};
 const source=fs.readFileSync(item.sourceFile,'utf8');check(row,'frozen source SHA-256',()=>assert.equal(sha(source),item.sha256));check(row,'frozen source UTF-8 bytes',()=>assert.equal(Buffer.byteLength(source),item.bytes));
 const modeOutputs={};
 for(const [mode,api]of [['core',core],['complete',complete]]){
  const mstart=performance.now(),local={passed:false};row.modes[mode]=local;
  try{
   const settings={...cfg,pageTitle:item.title};
   const result=api.calculate({kind:'adjust',source,originalSource:source,options:settings});
   modeOutputs[mode]=result;local.outputSha256=sha(result.text);local.bytesAfter=Buffer.byteLength(result.text);local.delta=local.bytesAfter-Buffer.byteLength(source);local.hunks=result.hunks.length;local.changes=result.changes;local.preservation=result.preservation;local.warningCounts=errors(result.warnings||[]);local.summaryTopics=api.summaryTopics(source,result.text,result.changes.map(x=>x.id));local.byteMetrics=result.byteMetrics;local.minorCheck={eligible:result.minorCheck.eligible,reason:result.minorCheck.reason};
   check(row,mode+' UTF-8 byte delta',()=>assert.equal(result.byteMetrics.delta,local.delta));
   check(row,mode+' byte-accounting consistency',()=>{assert.equal(result.byteMetrics.before,Buffer.byteLength(source));assert.equal(result.byteMetrics.after,local.bytesAfter);assert.equal(result.byteMetrics.added-result.byteMetrics.removed,local.delta);assert.equal(result.byteMetrics.consistent,true);});
   check(row,mode+' source preservation',()=>{
    if(result.preservation.length){const known=qualifiedWarnings.find(x=>x.revid===item.revid&&x.inputSha256===item.sha256);assert(known,'Only a previously documented source-bound warning can remain');assert.deepEqual(result.preservation,known.expectedPreservationWarnings);if(known.expectedOutputSha256)assert.equal(local.outputSha256,known.expectedOutputSha256);local.knownSourcePresentationWarning=true;local.qualifiedWarningTitle=known.title;}
    else assert.deepEqual(result.preservation,[]);
   });
   const repeated=api.cleanup(result.text,settings);local.secondSha256=sha(repeated.text);
   check(row,mode+' idempotence',()=>assert(repeated.text===result.text,'Second cleanup changed the first transformed output; second.wiki saved for inspection'));
   const referenceBefore=errors(api.referenceAudit(source,settings)),referenceAfter=errors(api.referenceAudit(result.text,settings));local.referenceErrorsBefore=referenceBefore;local.referenceErrorsAfter=referenceAfter;
   check(row,mode+' no introduced reference errors',()=>{for(const [code,count]of Object.entries(referenceAfter))assert(count<=(referenceBefore[code]||0),'Introduced '+code+' ('+(referenceBefore[code]||0)+' -> '+count+')');});
   const syntaxBefore=errors(api.syntaxAudit(source)),syntaxAfter=errors(api.syntaxAudit(result.text));local.syntaxErrorsBefore=syntaxBefore;local.syntaxErrorsAfter=syntaxAfter;
   check(row,mode+' no introduced syntax errors',()=>{for(const [code,count]of Object.entries(syntaxAfter))assert(count<=(syntaxBefore[code]||0),'Introduced '+code+' ('+(syntaxBefore[code]||0)+' -> '+count+')');});
   const cache=api.parserCacheStatus();local.cacheBytes=cache.estimatedBytes;
   check(row,mode+' bounded parser cache',()=>{assert.equal(cache.accountingConsistent,true);assert(cache.estimatedBytes<=cache.maximumEstimatedBytes);});
   check(row,mode+' no unconfirmed automatic minor edit',()=>assert.equal(result.minorCheck.eligible,false));
   const outputDir=path.join(runDir,'core_transformed',item.corpus);if(mode==='core'){fs.mkdirSync(outputDir,{recursive:true});fs.writeFileSync(path.join(outputDir,item.revid+'.wiki'),result.text);}
   if(repeated.text!==result.text){const dir=path.join(runDir,'failures',item.corpus);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,item.revid+'_'+mode+'_second.wiki'),repeated.text);}
   local.passed=!row.failures.some(f=>f.check.startsWith(mode+' '));
  }catch(error){row.failures.push({check:mode+' calculation',message:error.message,stack:error.stack});}
  local.milliseconds=+(performance.now()-mstart).toFixed(1);
 }
 if(modeOutputs.core&&modeOutputs.complete){
  check(row,'modular/complete exact text equivalence',()=>assert(modeOutputs.core.text===modeOutputs.complete.text,'Complete and modular transformed text differs'));
  check(row,'modular/complete changes equivalence',()=>assert.deepEqual(modeOutputs.core.changes,modeOutputs.complete.changes));
  check(row,'modular/complete byte metrics equivalence',()=>assert.deepEqual(modeOutputs.core.byteMetrics,modeOutputs.complete.byteMetrics));
  check(row,'modular/complete summaries equivalence',()=>assert.deepEqual(row.modes.core.summaryTopics,row.modes.complete.summaryTopics));
  check(row,'modular/complete minor eligibility equivalence',()=>assert.deepEqual(modeOutputs.core.minorCheck,modeOutputs.complete.minorCheck));
  check(row,'modular/complete preservation equivalence',()=>assert.deepEqual(modeOutputs.core.preservation,modeOutputs.complete.preservation));
 }
 row.passed=row.failures.length===0;row.milliseconds=+(performance.now()-started).toFixed(1);report.articles.push(row);
 if((index+1)%10===0||!row.passed||index+1===selected.length){save();console.log(JSON.stringify({completed:index+1,total:selected.length,passed:report.passed,failed:report.failed,milliseconds:row.milliseconds,...(!row.passed?{title:item.title,revid:item.revid,failures:row.failures.map(f=>({check:f.check,message:f.message.slice(0,500)}))}:{})}));}
}
report.finishedAt=new Date().toISOString();report.totalMilliseconds=+(performance.now()-totalStarted).toFixed(1);report.distributionsStillMatchCurrent=frozenFiles.every(file=>sha(fs.readFileSync(path.join(distributionDir,file.name)))===file.sha256);report.sourceManifestsStillMatch=manifestMetadata.every(file=>sha(fs.readFileSync(path.join(root,file.manifestFile)))===file.manifestSha256);report.knownSourcePresentationWarnings=report.articles.filter(row=>row.modes.core.knownSourcePresentationWarning).length;
report.perCorpus=Object.fromEntries(corpora.map(c=>{const rows=report.articles.filter(a=>a.corpus===c.name);return [c.name,{articles:rows.length,passed:rows.filter(r=>r.passed).length,failed:rows.filter(r=>!r.passed).length,changed:rows.filter(r=>r.modes.core.delta!==0).length}];}));
report.performance={coreMilliseconds:report.articles.reduce((sum,row)=>sum+row.modes.core.milliseconds,0),completeMilliseconds:report.articles.reduce((sum,row)=>sum+row.modes.complete.milliseconds,0),slowest:report.articles.slice().sort((a,b)=>b.milliseconds-a.milliseconds).slice(0,20).map(({title,revid,corpus,inputBytes,milliseconds})=>({title,revid,corpus,inputBytes,milliseconds}))};
save();console.log(JSON.stringify({version:report.version,completed:report.completed,passed:report.passed,failed:report.failed,checks:report.checks,distributionsStillMatchCurrent:report.distributionsStillMatchCurrent,totalMilliseconds:report.totalMilliseconds,perCorpus:report.perCorpus}));process.exitCode=report.failed?1:0;
