'use strict';
// Synthetic modules prove matching through file/directory aliases and VM loads.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const helper=path.resolve(__dirname,'legacy_calculation_deadline.cjs'),{boundedCall}=require(helper),sha=raw=>crypto.createHash('sha256').update(raw).digest('hex'),
 temp=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-deadline-identity-')),actual=path.join(temp,'actual'),aliasDir=path.join(temp,'directory-alias');fs.mkdirSync(actual);fs.symlinkSync(actual,aliasDir,'dir');
const source=path.join(actual,'synthetic-runtime.cjs'),alias=path.join(temp,'runtime-alias.cjs'),other=path.join(actual,'unselected.cjs'),
 code='module.exports={marker:"original",calculate(job){return {text:job.source,marker:this.marker}}};\n';
fs.writeFileSync(source,code);fs.writeFileSync(other,code);fs.symlinkSync(source,alias);
const runner=path.join(temp,'run.cjs'),vmRunner=path.join(temp,'vm.cjs');
fs.writeFileSync(runner,'const api=require(process.argv[2]);process.stdout.write(JSON.stringify(api.calculate({source:"Texto literal."})));\n');
fs.writeFileSync(vmRunner,'const fs=require("node:fs"),vm=require("node:vm"),file=process.argv[2],code=fs.readFileSync(file,"utf8"),sandbox={module:{exports:{}}};vm.runInNewContext(code,sandbox);const api=require('+JSON.stringify(helper)+').traceExportedCalculate(sandbox.module.exports,file,code);process.stdout.write(JSON.stringify(api.calculate({source:"Texto literal."})));\n');
const report={kind:'test-only-deadline-path-and-vm-controls',status:'passed',checks:0,cases:[],failures:[],helperSha256:sha(fs.readFileSync(helper)),wikipediaWrites:0};
function check(value,message){report.checks++;assert(value,message);}
function run(id,targets,loaded,{vmLoad=false,preserve=false,preload=true,expectedCalls=1,expectFailure=false}={}){
 const receipt=path.join(temp,id+'.json'),args=[...(preserve?['--preserve-symlinks']:[]),...(preload?['--require',helper]:[]),vmLoad?vmRunner:runner,loaded],
  env={...process.env,REVISAWIKI_DEADLINE_RECEIPT:receipt};
 if(preload)env.REVISAWIKI_DEADLINE_FILES=JSON.stringify(targets);else delete env.REVISAWIKI_DEADLINE_FILES;
 const child=cp.spawnSync(process.execPath,args,{env,encoding:'utf8',timeout:15000});
 if(expectFailure){check(child.status!==0,id+' rejects an unavailable or unselected target');report.cases.push({id,status:'passed',expectedRefusal:true});return;}
 check(child.status===0,id+' child completes: '+child.stderr);check(JSON.stringify(JSON.parse(child.stdout))===JSON.stringify({text:'Texto literal.',marker:'original'}),id+' output and receiver are unchanged');
 if(preload){const record=JSON.parse(fs.readFileSync(receipt));check(record.targetResolution==='realpath',id+' physical identity is explicit');check(record.records.reduce((n,row)=>n+row.calls,0)===expectedCalls,id+' exact exported calls are observed');check(record.records.every(row=>row.milliseconds===60000&&row.timeouts===0),id+' fixed deadline and no timeout');if(expectedCalls)check(record.records.every(row=>row.sourceFileSha256===sha(code)&&row.compiledProgramSha256===sha(code)),id+' actual source and compiled bytes are bound');report.cases.push({id,status:'passed',calls:expectedCalls,uniqueTargets:record.uniqueTargets,modes:[...new Set(record.records.map(row=>row.mode))]});}
 else report.cases.push({id,status:'passed',standaloneVmDeadline:true});
}
try{
 run('target-file-alias-require-real',[alias],source);
 run('target-real-compile-file-alias',[source],alias,{preserve:true});
 run('target-directory-alias-require-real',[path.join(aliasDir,path.basename(source))],source);
 run('target-real-compile-directory-alias',[source],path.join(aliasDir,path.basename(source)),{preserve:true});
 run('duplicate-target-aliases-are-not-double-counted',[source,alias,path.join(aliasDir,path.basename(source))],source);
 run('unselected-same-bytes-module-is-not-wrapped',[source],other,{expectedCalls:0});
 run('missing-selected-target-is-refused',[path.join(temp,'missing.cjs')],source,{expectFailure:true});
 run('vm-real-file-is-explicitly-wrapped',[source],source,{vmLoad:true});
 run('vm-alias-file-is-explicitly-wrapped',[source],alias,{vmLoad:true});
 run('vm-standalone-still-has-deadline',[],source,{vmLoad:true,preload:false});
 run('vm-unselected-explicit-target-is-refused',[source],other,{vmLoad:true,expectFailure:true});
 for(const milliseconds of [0,60001]){assert.throws(()=>boundedCall(()=>null,milliseconds));report.checks++;}
 assert.throws(()=>boundedCall(()=>{while(true){}},20)(),error=>error.code==='ERR_SCRIPT_EXECUTION_TIMEOUT');report.checks++;
 check(fs.readFileSync(source,'utf8')===code&&fs.readFileSync(other,'utf8')===code,'Every original synthetic module remains byte-identical');
}catch(error){report.status='failed';report.failures.push(String(error.message));}
finally{fs.rmSync(temp,{recursive:true,force:true});}
if(process.env.REVISAWIKI_DEADLINE_PATH_REPORT)fs.writeFileSync(process.env.REVISAWIKI_DEADLINE_PATH_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
