'use strict';
// Applies only the source-pinned technical recipe to original 2.13.0 test modules.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),{threadId}=require('node:worker_threads'),adapter=require('./adapter.cjs');
const loaded=adapter.readPlan(process.env.REVISAWIKI_INHERITED_PLAN_PIN),plan=loaded.plan;
assert(process.env.REVISAWIKI_INHERITED_PLAN_PIN,'The caller must pin the adapter recipe');
for(const row of plan.adapterFiles)assert.equal(adapter.sha(fs.readFileSync(path.join(adapter.root,row.file))),row.sha256,'The adapter implementation stays pinned in every process');
adapter.verifyCandidate(process.env.REVISAWIKI_INHERITED_TARGET_PIN);
const entries=new Map(plan.compiledFiles.map(row=>[path.join(adapter.root,row.file),row])),observed=[];
const originalJs=Module._extensions['.js'],originalCjs=Module._extensions['.cjs']||originalJs;
function compile(original){return function(module,filename){const within=path.relative(adapter.sourceDirectory,filename);if(within.startsWith('..'+path.sep)||path.isAbsolute(within)||within==='..')return original(module,filename);const row=entries.get(filename);assert(row,'An inherited module cannot execute without an exact recipe: '+within);const text=adapter.compiledSource(row);observed.push({file:row.file,sourceSha256:row.sourceSha256,compiledSha256:row.compiledSha256});module._compile(text,filename);};}
Module._extensions['.js']=compile(originalJs);Module._extensions['.cjs']=compile(originalCjs);
process.on('exit',code=>{const directory=process.env.REVISAWIKI_INHERITED_LOG_DIR;assert(directory,'The caller must choose an isolated adapter log directory');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,String(process.pid)+'_'+String(threadId)+'.json'),JSON.stringify({schema:1,version:'2.15.0',sourceVersion:'2.13.0',kind:'source-pinned-in-memory-technical-adapter',exitCode:code,adapterPlanSha256:loaded.sha256,targetReleaseManifestSha256:process.env.REVISAWIKI_INHERITED_TARGET_PIN,nodeVersion:process.versions.node,compiledModules:observed,wikipediaWrites:0,networkRequests:0},null,2)+'\n');});
