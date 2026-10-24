'use strict';
// Keep the original runner and fixture assertions intact. Four exact native
// refusals use the separately reviewed source-bound expectation adapter.
const path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
function invocation(argv,environment=process.env){
 assert(Array.isArray(argv)&&argv.every(value=>typeof value==='string'),'Pass the original runner arguments as strings');
 const adapter=path.join(__dirname,'current_native_refusals.cjs');
 const existing=environment.NODE_OPTIONS||'';
 assert.equal(typeof existing,'string');
 return {command:process.execPath,args:[path.join(root,'tests/v221/run_all.cjs'),...argv],options:{cwd:root,
  env:{...environment,NODE_OPTIONS:[existing,'--require='+JSON.stringify(adapter)].filter(Boolean).join(' ')},stdio:'inherit'}};
}
function run(argv,environment=process.env,spawn=cp.spawnSync){
 const job=invocation(argv,environment),result=spawn(job.command,job.args,job.options);
 if(result.error||result.signal||!Number.isInteger(result.status))return 1;
 return result.status;
}
if(require.main===module)process.exitCode=run(process.argv.slice(2));
module.exports={invocation,run};
