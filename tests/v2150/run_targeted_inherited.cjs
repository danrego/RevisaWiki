'use strict';
// Select an existing inherited entrypoint without editing its assertions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),adapter=require('./inherited/adapter.cjs');
const name=process.argv[2],output=process.argv[3];assert(name&&output,'Choose one registered suite and a fresh report directory');
const loaded=adapter.readPlan();assert(loaded.plan.mainEntrypoints.includes(name),'The suite must belong to the immutable inherited plan');adapter.verifySourceTree(loaded.plan);
const manifestRaw=fs.readFileSync(path.join(adapter.root,'tests/expected_release_v2150.json')),pin=adapter.sha(manifestRaw);adapter.verifyCandidate(pin);
const logDirectory=path.resolve(adapter.root,output,'adapter_processes');assert(!fs.existsSync(logDirectory),'Never overwrite a targeted run');fs.mkdirSync(logDirectory,{recursive:true});
assert(!process.env.NODE_OPTIONS,'Unrecorded preload hooks are not allowed');
const result=spawnSync(process.execPath,[path.join(adapter.sourceDirectory,name)],{cwd:adapter.root,stdio:'inherit',env:{...process.env,REVISAWIKI_REPORT_DIR:path.resolve(adapter.root,output),REVISAWIKI_INHERITED_PLAN_PIN:loaded.sha256,REVISAWIKI_INHERITED_TARGET_PIN:pin,REVISAWIKI_INHERITED_LOG_DIR:logDirectory,NODE_OPTIONS:'--require='+JSON.stringify(path.join(__dirname,'inherited/preload.cjs'))}});
adapter.verifyCandidate(pin);adapter.verifySourceTree(loaded.plan);
fs.writeFileSync(path.resolve(adapter.root,output,'targeted_execution.json'),JSON.stringify({version:'2.15.0',status:result.status===0?'passed':'failed',suite:name,exitCode:result.status,releaseManifestSha256:pin,sourcePlanSha256:loaded.sha256,behavioralAssertionWaivers:[],networkRequests:0,wikipediaWrites:0},null,2)+'\n');
if(result.status!==0)process.exit(result.status||1);
