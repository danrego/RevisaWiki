'use strict';
// Exercise runner preconditions with a driver that cannot launch a browser.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-runner-guards-'));
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const fixtureRaw=fs.readFileSync(path.join(root,'tests/v220/demo_examples.json')),examples=JSON.parse(fixtureRaw);
const report={kind:'delivery-browser-runner-guards',status:'passed',checks:0,tests:0,failures:[],browserLaunches:0,syntheticDriver:true,networkRequests:0,wikipediaWrites:0};
const equal=(actual,expected,message)=>{report.checks++;assert.deepEqual(actual,expected,message);};
async function test(name,body){report.tests++;try{await body();}catch(error){report.status='failed';report.failures.push({name,message:error.message});}}
function fixture(name){
 const base=path.join(temporary,name),release=path.join(base,'release'),fakeRoot=path.join(base,'repository'),receipt=path.join(base,'receipt.json');
 fs.mkdirSync(path.join(release,'Demonstracao'),{recursive:true});fs.mkdirSync(path.join(fakeRoot,'tests/v220'),{recursive:true});
 fs.writeFileSync(path.join(fakeRoot,'tests/v220/demo_examples.json'),fixtureRaw);
 const engine=Buffer.from('// Fictional engine for runner guards.\n'),filename='RevisaWiki_v2_20_0_completo.js';
 fs.writeFileSync(path.join(release,filename),engine);
 fs.writeFileSync(path.join(fakeRoot,'tests/expected_release_v2200.json'),JSON.stringify({files:{[filename]:{bytes:engine.length,sha256:sha(engine)}}}));
 const book={version:'2.20.0',engineSha256:sha(engine),fixtureSha256:sha(fixtureRaw),examples};
 fs.writeFileSync(path.join(release,'Demonstracao/exemplos.json'),JSON.stringify(book));
 const html=Buffer.from('<!doctype html><title>Fictional runner fixture</title>\n');
 fs.writeFileSync(path.join(release,'Demonstracao_RevisaWiki_v2_20_0.html'),html);
 fs.writeFileSync(path.join(release,'INICIO.html'),html);fs.writeFileSync(path.join(release,'MANIFESTO.json'),'{}\n');
 return {base,release,fakeRoot,receipt,book,html,starts:0,closes:0,served:html};
}
async function run(state,kind){
 class InertDriver{
  async start(){state.starts++;throw Error('Fictional driver deliberately cannot launch a browser');}
  async close(){state.closes++;}
 }
 const isDemo=kind==='demo',filename=path.join(root,isDemo?'tests/v220/browser/demonstration_release.cjs':'tests/v220/delivery_browser.cjs');
 const context={Buffer,URL,AbortSignal,setTimeout,clearTimeout,
  __dirname:path.join(state.fakeRoot,isDemo?'tests/v220/browser':'tests/v220'),
  require:name=>name.endsWith('/native_driver.cjs')?{NativeChrome:InertDriver,NativeFirefox:InertDriver,NativeSafari:InertDriver,delay:async()=>{}}:require(name),
  console:{log:()=>{}},process:{argv:['node',filename,'chrome',isDemo?'portable':'http://127.0.0.1:1/INICIO.html'],env:{
   REVISAWIKI_DEMONSTRATION_DIRECTORY:state.release,REVISAWIKI_BROWSER_REPORT:state.receipt,
   REVISAWIKI_DELIVERY_INDEX:path.join(state.release,'INICIO.html'),REVISAWIKI_DELIVERY_REPORT:state.receipt,
  }},
  fetch:async()=>({ok:true,arrayBuffer:async()=>state.served}),
 };
 await vm.runInNewContext(fs.readFileSync(filename,'utf8'),context,{filename});
 return JSON.parse(fs.readFileSync(state.receipt));
}
(async()=>{try{
 await test('current independent example set reaches the inert driver',async()=>{
  const state=fixture('all-current-examples'),value=await run(state,'demo');
  equal(value.plannedExamples,examples.length,'Every current example is planned');equal(value.fixtureSha256,sha(fixtureRaw),'The current fixture hash is retained');
  equal(state.starts,1,'Preconditions pass before the inert driver refuses to start');equal(state.closes,1,'Cleanup still executes');
  equal(value.status,'infrastructure-unavailable','This guard test cannot qualify a native browser');equal(value.cases.length,0,'No browser example ran');
 });
 await test('an omitted demonstration endpoint is rejected before driver start',async()=>{
  const state=fixture('missing-endpoint');state.book.examples=examples.slice(1);fs.writeFileSync(path.join(state.release,'Demonstracao/exemplos.json'),JSON.stringify(state.book));
  await assert.rejects(()=>run(state,'demo'),/Every independently authored/);report.checks++;
  equal(state.starts,0,'A different example book never reaches the driver');equal(fs.existsSync(state.receipt),false,'No native receipt is fabricated');
 });
 for(const kind of ['demo','index'])await test(kind+' preserves an existing failed receipt',async()=>{
  const state=fixture(kind+'-existing-receipt'),prior=Buffer.from('{"status":"failed","fictional":true}\n');fs.writeFileSync(state.receipt,prior);
  await assert.rejects(()=>run(state,kind),/Preserve old receipts/);report.checks++;
  equal(fs.readFileSync(state.receipt),prior,'The failed receipt remains byte-identical');equal(state.starts,0,'A duplicate receipt path never reaches the driver');
 });
 await test('an exact served index reaches the inert driver',async()=>{
  const state=fixture('index-exact-served'),value=await run(state,'index');
  equal(state.starts,1,'The exact served bytes pass the guard');equal(value.indexSha256,sha(state.html),'The report is bound to the actual index');
  equal(value.manifestSha256,sha(Buffer.from('{}\n')),'The report is bound to its manifest');equal(value.artifactClass,'local-preview','An unspecified run remains a local preview');
  equal(value.status,'infrastructure-unavailable','This guard test cannot qualify a native browser');equal(value.automationClosed,true,'Cleanup is recorded');
 });
 await test('a different served index is rejected before driver start',async()=>{
  const state=fixture('index-wrong-served');state.served=Buffer.from('Different index.');const value=await run(state,'index');
  equal(state.starts,0,'Different served bytes never reach the driver');equal(value.status,'infrastructure-unavailable','The guard failure is not a browser pass');
  equal(/byte-identical/.test(value.message),true,'The receipt explains the failed identity check');
 });
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
 console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
