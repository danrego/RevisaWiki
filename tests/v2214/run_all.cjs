 'use strict';
// Each distribution runs the same contracts. Article counts, calculation calls,
// assertions and source-only UI checks remain separate quantities.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),manifestFile=path.join(root,'tests/expected_release_v2214.json'),manifestRaw=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestRaw),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const base=process.env.REVISAWIKI_V2214_LOG_DIR||os.tmpdir();fs.mkdirSync(base,{recursive:true});const output=fs.mkdtempSync(path.join(base,'revisawiki-v2214-directed-'));
const suites=['independent_recovery_contract','worker_recovery_binding','native_recovery_contract','reference_preservation','value_preservation','collector_activation','fault_injection','adversarial_independence'],attempts=[];
for(const name of ['RevisaWiki_v2_21_4.js','RevisaWiki_v2_21_4_completo.js']){
 const core=path.join(root,'dist/2.21.4',name),raw=fs.readFileSync(core);assert.deepEqual({bytes:raw.length,sha256:sha(raw)},manifest.files[name]);
 for(const suite of suites){
  const file=path.join(__dirname,suite+'.cjs'),testRaw=fs.readFileSync(file),id=(name.includes('_completo')?'complete-':'core-')+suite;
  const result=cp.spawnSync(process.execPath,[file],{cwd:root,env:{...process.env,REVISAWIKI_CURRENT_CORE:core},encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
  fs.writeFileSync(path.join(output,id+'.stdout'),result.stdout||'');fs.writeFileSync(path.join(output,id+'.stderr'),result.stderr||'');
  let parsed=null;try{parsed=JSON.parse(result.stdout);}catch{}
  const row={id,suite,bundle:name,bundleSha256:sha(raw),testSha256:sha(testRaw),passed:result.status===0,exitStatus:result.status,signal:result.signal,assertions:parsed?.checks||0,calculations:parsed?.calculations||0,sourceAndRuntimeUnchanged:sha(fs.readFileSync(file))===sha(testRaw)&&sha(fs.readFileSync(core))===sha(raw),stdoutSha256:sha(result.stdout||''),stderrSha256:sha(result.stderr||'')};
  row.passed=row.passed&&row.sourceAndRuntimeUnchanged;attempts.push(row);fs.writeFileSync(path.join(output,'PROGRESS.json'),JSON.stringify({version:'2.21.4',attempts},null,2)+'\n');
 }
}
const uiFile=path.join(__dirname,'ui_contract.cjs'),ui=cp.spawnSync(process.execPath,[uiFile],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
fs.writeFileSync(path.join(output,'source-ui.stdout'),ui.stdout||'');fs.writeFileSync(path.join(output,'source-ui.stderr'),ui.stderr||'');
const report={version:'2.21.4',runtimeManifestSha256:sha(manifestRaw),attempts,sourceOnlyUI:{passed:ui.status===0,testSha256:sha(fs.readFileSync(uiFile)),stdoutSha256:sha(ui.stdout||''),stderrSha256:sha(ui.stderr||'')},historicalOutcomesRewritten:false,wikipediaWrites:0};
assert.equal(sha(fs.readFileSync(manifestFile)),report.runtimeManifestSha256);report.passed=attempts.every(x=>x.passed)&&report.sourceOnlyUI.passed;
fs.writeFileSync(path.join(output,'SUMMARY.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({outputDirectory:output,passed:report.passed,directedGroups:attempts.length,passedGroups:attempts.filter(x=>x.passed).length,sourceOnlyUIPassed:report.sourceOnlyUI.passed}));if(!report.passed)process.exitCode=1;
