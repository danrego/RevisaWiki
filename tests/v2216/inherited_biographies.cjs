'use strict';
// Execute the same synthetic checks against both distributions. Every attempt
// keeps its log and 60-second process deadline, including failed attempts.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base=process.env.REVISAWIKI_V2216_LOG_DIR||process.env.REVISAWIKI_V2215_LOG_DIR||os.tmpdir();fs.mkdirSync(base,{recursive:true});
const expected=JSON.parse(fs.readFileSync(path.resolve(process.env.REVISAWIKI_RELEASE_MANIFEST||path.join(root,'tests/expected_release_v2216.json'))));
const output=fs.mkdtempSync(path.join(base,'revisawiki-v2216-')),
 suites=['compatibility','images','scope','native_fields','lead','alias_priority','legacy_pins'],bundles=['RevisaWiki_v2_21_6.js','RevisaWiki_v2_21_6_completo.js'],sha=x=>crypto.createHash('sha256').update(x).digest('hex'),attempts=[];
for(const filename of bundles){
 const bundle=path.join(process.env.REVISAWIKI_RELEASE_DIR||path.join(root,'dist/2.21.6'),filename),distribution=filename.includes('_completo')?'complete':'core',bundleSha256=sha(fs.readFileSync(bundle));
 assert.equal(bundleSha256,expected.files[filename].sha256,'Frozen release bundle hash must match before running tests');
 for(const suite of suites){
  const prefix=distribution+'-'+suite,receiptFile=path.join(output,prefix+'.json'),start=new Date().toISOString(),test=path.join(__dirname,'../v2213',suite+'.cjs'),testSha256=sha(fs.readFileSync(test));
  const r=spawnSync(process.execPath,['--require',path.join(root,'tests/v2215/legacy_minified_bindings.cjs'),test],{cwd:root,env:{...process.env,REVISAWIKI_CURRENT_CORE:bundle,REVISAWIKI_TEST_RECEIPT:receiptFile,REVISAWIKI_LEGACY_BINDING_RECEIPT:receiptFile+'.binding'},timeout:60000,maxBuffer:4*1024*1024,encoding:'utf8'});
  fs.writeFileSync(path.join(output,prefix+'.stdout'),r.stdout||'');fs.writeFileSync(path.join(output,prefix+'.stderr'),r.stderr||'');
  const unchanged=bundleSha256===sha(fs.readFileSync(bundle))&&testSha256===sha(fs.readFileSync(test)),receipt=fs.existsSync(receiptFile)?JSON.parse(fs.readFileSync(receiptFile,'utf8')):null,
   repeatedCalculations=suite==='scope'?0:(receipt?.cases||receipt?.rows||[]).length;
  attempts.push({distribution,suite,bundleSha256,testSha256,start,finished:new Date().toISOString(),deadlineMilliseconds:60000,exitStatus:r.status,signal:r.signal,error:r.error?{code:r.error.code,message:r.error.message}:null,inputsUnchanged:unchanged,passed:r.status===0&&unchanged&&!!receipt,receiptFile:path.basename(receiptFile),receiptSha256:receipt?sha(fs.readFileSync(receiptFile)):null,assertions:receipt?.checks||0,initialFixtureCalculations:(receipt?.calculations||0)-repeatedCalculations,idempotenceCalculations:repeatedCalculations});
  const row=attempts.at(-1);
  if(!row.passed&&r.status===1&&suite==='alias_priority'){
   const target=path.join(output,prefix+'.preference-qualification.json'),q=spawnSync(process.execPath,[path.join(root,'tests/v2215/legacy_preference_qualification.cjs'),bundle,test,receiptFile,target],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024,timeout:1800000});fs.writeFileSync(target+'.parent.stdout',q.stdout||'');fs.writeFileSync(target+'.parent.stderr',q.stderr||'');let detail=null;try{detail=JSON.parse(fs.readFileSync(target));}catch{}
   row.rawStatus='failed';row.qualification={status:q.status===0&&detail?.status==='passed-with-qualified-preference-expectations'?detail.status:'failed',reportSha256:fs.existsSync(target)?sha(fs.readFileSync(target)):null,qualifiedEndpoints:detail?.events.length||0};
  }
  fs.writeFileSync(path.join(output,'RUN_SUMMARY.json'),JSON.stringify({version:'2.21.6',sameScenariosAcrossDistributions:true,uniqueCaseCount:null,note:'Initial fixture executions and idempotence executions are counted separately. Overlapping inputs across suites or bundles are not reported as additional unique cases.',attempts},null,2)+'\n');
 }
}
console.log(JSON.stringify({outputDirectory:output,attempts:attempts.length,passed:attempts.filter(a=>a.passed).length,qualified:attempts.filter(a=>a.qualification?.status==='passed-with-qualified-preference-expectations').length}));if(attempts.some(a=>!a.passed&&a.qualification?.status!=='passed-with-qualified-preference-expectations'))process.exitCode=1;
