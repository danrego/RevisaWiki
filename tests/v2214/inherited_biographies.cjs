'use strict';
// Execute the same synthetic checks against both distributions. Every attempt
// keeps its log and 60-second process deadline, including failed attempts.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base=process.env.REVISAWIKI_V2214_LOG_DIR||os.tmpdir();fs.mkdirSync(base,{recursive:true});
const expected=require('../expected_release_v2214.json');
const output=fs.mkdtempSync(path.join(base,'revisawiki-v2214-')),
 suites=['compatibility','images','scope','native_fields','lead','alias_priority','legacy_pins'],bundles=['RevisaWiki_v2_21_4.js','RevisaWiki_v2_21_4_completo.js'],sha=x=>crypto.createHash('sha256').update(x).digest('hex'),attempts=[];
for(const filename of bundles){
 const bundle=path.join(root,'dist/2.21.4',filename),distribution=filename.includes('_completo')?'complete':'core',bundleSha256=sha(fs.readFileSync(bundle));
 assert.equal(bundleSha256,expected.files[filename].sha256,'Frozen release bundle hash must match before running tests');
 for(const suite of suites){
  const prefix=distribution+'-'+suite,receiptFile=path.join(output,prefix+'.json'),start=new Date().toISOString(),test=path.join(__dirname,'../v2213',suite+'.cjs'),testSha256=sha(fs.readFileSync(test));
  const r=spawnSync(process.execPath,[test],{cwd:root,env:{...process.env,REVISAWIKI_CURRENT_CORE:bundle,REVISAWIKI_TEST_RECEIPT:receiptFile},timeout:60000,maxBuffer:4*1024*1024,encoding:'utf8'});
  fs.writeFileSync(path.join(output,prefix+'.stdout'),r.stdout||'');fs.writeFileSync(path.join(output,prefix+'.stderr'),r.stderr||'');
  const unchanged=bundleSha256===sha(fs.readFileSync(bundle))&&testSha256===sha(fs.readFileSync(test)),receipt=fs.existsSync(receiptFile)?JSON.parse(fs.readFileSync(receiptFile,'utf8')):null,
   repeatedCalculations=suite==='scope'?0:(receipt?.cases||receipt?.rows||[]).length;
  attempts.push({distribution,suite,bundleSha256,testSha256,start,finished:new Date().toISOString(),deadlineMilliseconds:60000,exitStatus:r.status,signal:r.signal,error:r.error?{code:r.error.code,message:r.error.message}:null,inputsUnchanged:unchanged,passed:r.status===0&&unchanged&&!!receipt,receiptFile:path.basename(receiptFile),receiptSha256:receipt?sha(fs.readFileSync(receiptFile)):null,assertions:receipt?.checks||0,initialFixtureCalculations:(receipt?.calculations||0)-repeatedCalculations,idempotenceCalculations:repeatedCalculations});
  fs.writeFileSync(path.join(output,'RUN_SUMMARY.json'),JSON.stringify({version:'2.21.4',sameScenariosAcrossDistributions:true,uniqueCaseCount:null,note:'Initial fixture executions and idempotence executions are counted separately. Overlapping inputs across suites or bundles are not reported as additional unique cases.',attempts},null,2)+'\n');
 }
}
console.log(JSON.stringify({outputDirectory:output,attempts:attempts.length,passed:attempts.filter(a=>a.passed).length}));if(attempts.some(a=>!a.passed))process.exitCode=1;
