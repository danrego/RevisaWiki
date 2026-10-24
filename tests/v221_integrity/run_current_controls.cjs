'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),api=require('./run_current.cjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),root=path.resolve(__dirname,'../..'),files=['tests/v221/run_all.cjs','tests/v221/citation_contracts.cjs','tests/v221/citation_predicates.cjs','tests/v221_integrity/current_native_refusals.cjs','tests/v221_integrity/native_refusal_expectations.json'],pins=Object.fromEntries(files.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));let checks=0;
const equal=(a,b)=>{checks++;assert.deepEqual(a,b);};
for(const options of [undefined,'','--max-old-space-size=4096','--require="a path/control.cjs"']){
 const environment={REVISAWIKI_CONTROL:'retained',...(options===undefined?{}:{NODE_OPTIONS:options})},before=JSON.stringify(environment),args=['--dist=/controlled path/runtime','--tasks=orchestrator-controls'],job=api.invocation(args,environment);
 equal(job.command,process.execPath);equal(job.args,[path.join(root,'tests/v221/run_all.cjs'),...args]);equal(job.options.cwd,root);equal(job.options.stdio,'inherit');equal(job.options.env.REVISAWIKI_CONTROL,'retained');equal(job.options.env.NODE_OPTIONS,[(options||''),'--require='+JSON.stringify(path.join(__dirname,'current_native_refusals.cjs'))].filter(Boolean).join(' '));equal(JSON.stringify(environment),before);equal(args,['--dist=/controlled path/runtime','--tasks=orchestrator-controls']);equal('shell' in job.options,false);equal('timeout' in job.options,false);
}
for(const value of [{status:0},{status:1},{status:7},{status:null,signal:'SIGTERM'},{status:null,error:Error('Controlled failure')},{status:null}]){
 let calls=0;const exit=api.run(['--tasks=orchestrator-controls'],{},(command,args,options)=>{calls++;equal(command,process.execPath);equal(args.at(-1),'--tasks=orchestrator-controls');equal(options.stdio,'inherit');return value;});equal(calls,1);equal(exit,Number.isInteger(value.status)&&!value.error&&!value.signal?value.status:1);
}
for(const invalid of [null,{},[1]]){checks++;assert.throws(()=>api.invocation(invalid,{}));}
for(const file of files)equal(hash(fs.readFileSync(path.join(root,file))),pins[file]);
process.stdout.write(JSON.stringify({status:'passed',checks,fixtureFilesChanged:0,productExecutions:0,networkRequests:0,wikipediaWrites:0})+'\n');
