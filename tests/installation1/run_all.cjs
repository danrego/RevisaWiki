'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),runtime='dist/2.21.1-installation.1',pinName='tests/expected_release_v2211_installation1.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),pin=fs.readFileSync(path.join(root,pinName)),manifest=JSON.parse(pin);
assert.equal(manifest.version,'2.21.1');assert.equal(manifest.distributionRevision,'2.21.1-installation.1');
for(const[name,value]of Object.entries(manifest.files)){const bytes=fs.readFileSync(path.join(root,runtime,name));assert.equal(bytes.length,value.bytes);assert.equal(sha(bytes),value.sha256);}
const suites=[
 {file:'tests/installation1/columns_adapter.cjs',args:[]},
 {file:'tests/v2211/independent_columns.cjs',args:[runtime+'/RevisaWiki_v2_21_1.js',runtime+'/RevisaWiki_v2_21_1_completo.js']},
 {file:'tests/v2211/worker_snapshot.cjs',args:['--runtime='+runtime]}
];
for(const suffix of['','_completo'])suites.push({file:'tests/v221_integrity/frozen_runtime_guards.cjs',args:[path.join(root,runtime,'RevisaWiki_v2_21_1'+suffix+'.js')]});
let checks=0,currentCalculations=0,baselineCalculations=0;const rows=[];
for(const suite of suites){
 const result=cp.spawnSync(process.execPath,[path.join(root,suite.file),...suite.args],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,timeout:180000});
 assert.equal(result.status,0,suite.file+'\n'+result.stderr);const report=JSON.parse(result.stdout);assert.equal(report.status,'passed');
 const calculations=report.actualCalculations??report.calculations??report.workerMessageCalculations??0;checks+=report.checks;currentCalculations+=calculations;baselineCalculations+=report.baselineCalculations??0;
 rows.push({suite:suite.file,sourceSha256:sha(fs.readFileSync(path.join(root,suite.file))),checks:report.checks,currentCalculations:calculations,baselineCalculations:report.baselineCalculations??0,resultSha256:sha(result.stdout)});
}
const unitSuites=[];
for(const name of['test_serialization.py','test_presave_gate.py','test_current_presave.py']){
 const result=cp.spawnSync(process.env.REVISAWIKI_PYTHON||'python3',['-m','unittest','discover','-s','tests/installation1','-p',name],{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024,timeout:180000});
 assert.equal(result.status,0,name+'\n'+result.stderr);const match=result.stderr.match(/Ran (\d+) tests? in /);assert.ok(match,'The actual unit test count is required');
 unitSuites.push({suite:'tests/installation1/'+name,cases:Number(match[1]),status:'passed',sourceSha256:sha(fs.readFileSync(path.join(root,'tests/installation1',name))),resultSha256:sha(result.stdout+result.stderr)});
}
console.log(JSON.stringify({kind:'safe-installation-current-regression',version:'2.21.1',distributionRevision:manifest.distributionRevision,status:'passed',runtimeManifestSha256:sha(pin),runtimeFiles:manifest.files,suites:rows,unitSuites,checks,currentCalculations,baselineCalculations,wikipediaWrites:0}));
