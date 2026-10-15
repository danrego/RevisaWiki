'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process'),candidate=require('./candidate.cjs');
candidate.verify();
const commands=[['run_focus.cjs'],['run_talk.cjs'],['run_talk_queries.cjs'],['run_registry.cjs'],['run_engine.cjs']];
if(process.argv.includes('--complex'))commands.push(['run_engine.cjs','--complex']);
for(const [file,...args] of commands){const result=spawnSync(process.execPath,[path.join(__dirname,file),...args],{cwd:candidate.root,env:process.env,stdio:'inherit'});if(result.status!==0){process.exitCode=result.status||1;break;}}
