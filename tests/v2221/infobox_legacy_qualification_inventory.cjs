'use strict';
// Diagnostic assertion inventory. Intercepting a failed assertion never turns
// its historical suite into a pass. Originals and their raw outcomes stay intact.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Module=require('node:module'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function inventory(bundle){
 const file=path.resolve(bundle),api=require(file);assert.equal(api.version,'2.22.1');
 const suites=['tests/v2217/infobox_cases.cjs','tests/v2217/infobox_integrated.cjs','tests/v2217/portal_cases.cjs','tests/v2217/portal_field_priority.cjs','tests/v2217/portal_destination.cjs','tests/v2220/infobox_cases.cjs','tests/v2220/infobox_unicode_fields_integration.cjs','tests/v2220/native_syntax_integration.cjs'],results=[];
 for(const suite of suites){
  const filename=path.join(root,suite),source=fs.readFileSync(filename,'utf8'),failures=[],logs=[];let assertions=0,exception=null;
  const record=(method,args)=>{assertions++;try{return method==='call'?assert(...args):assert[method](...args);}catch(error){const frames=(error.stack||'').split('\n').filter(line=>line.includes(filename)).map(line=>line.replaceAll(filename,suite));failures.push({assertion:assertions,method,message:args.at(-1),frames,actual:error.actual,expected:error.expected});}};
  const diagnostic=(...args)=>record('call',args);Object.assign(diagnostic,assert);for(const method of ['ok','equal','strictEqual','deepEqual','deepStrictEqual','notEqual','notStrictEqual','notDeepEqual','notDeepStrictEqual','throws','doesNotThrow'])diagnostic[method]=(...args)=>record(method,args);
  const local=Module.createRequire(filename),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',sectionOnly:false,autoPreview:false,registryDoiCheck:false},env={...process.env,REVISAWIKI_CURRENT_CORE:file};delete env.REVISAWIKI_TEST_RECEIPT;
  const context={require(name){if(name==='node:assert/strict'||name==='assert/strict')return diagnostic;if(name==='./harness.cjs'&&suite.startsWith('tests/v2220/'))return {root,file,api,cfg,sha,sourceSha:sha(fs.readFileSync(file))};return local(name);},module:{exports:{}},exports:{},__dirname:path.dirname(filename),__filename:filename,process:{env,version:process.version},console:{log(value){try{const result=typeof value==='string'?JSON.parse(value):value;logs.push({checks:result.checks,calculations:result.calculations,cases:result.cases});}catch{logs.push({nonJsonLog:true});}}},URL,URLSearchParams,TextEncoder,TextDecoder,setTimeout,clearTimeout,performance};
  try{vm.runInNewContext(source,context,{filename,timeout:60000});}catch(error){exception={message:error.message,name:error.name};}
  results.push({suite,testSha256:sha(source),assertions,passedAssertions:assertions-failures.length,failures,exception,reportedCounters:logs,historicalStatusUnmodified:true,status:failures.length||exception?'diagnostic-found-failures-not-a-pass':'all-original-assertions-passed'});
 }
 return {kind:'read-only-historical-assertion-inventory-not-qualification',runtimeSha256:sha(fs.readFileSync(file)),runtimeVersion:api.version,results,wikipediaWrites:0,networkRequests:0,historicalFilesModified:false};
}
if(require.main===module){assert(process.env.REVISAWIKI_CURRENT_CORE);const result=inventory(process.env.REVISAWIKI_CURRENT_CORE);if(process.env.REVISAWIKI_QUALIFICATION_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_QUALIFICATION_RECEIPT,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({kind:result.kind,results:result.results.map(row=>({suite:row.suite,assertions:row.assertions,failures:row.failures.length,exception:row.exception}))},null,2));}
module.exports={inventory};
