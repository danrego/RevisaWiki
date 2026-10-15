'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process'),candidate=require('./candidate.cjs');
candidate.verify();
for(const file of ['run_startup.cjs','run_focus.cjs','run_quote_boundaries.cjs','test_quotes.cjs','run_engine.cjs','summarize.cjs']){
 const result=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:candidate.root,env:process.env,stdio:'inherit'});
 if(result.status!==0){process.exitCode=result.status||1;break;}
}
