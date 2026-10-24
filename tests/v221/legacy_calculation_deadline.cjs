'use strict';
// Test-only deadline around exported calls. Source files and algorithm remain unchanged.
const vm=require('node:vm'),Module=require('node:module'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const physicalFile=file=>{
 const identity=fs.realpathSync(path.resolve(file));
 if(!fs.statSync(identity).isFile())throw Error('A deadline target must be an existing regular file');
 return identity;
};
function boundedCall(fn,milliseconds=60000,onCall=()=>{},onTimeout=()=>{}){
 if(!Number.isInteger(milliseconds)||milliseconds<1||milliseconds>60000)throw Error('Test deadline must be between 1 and 60000 ms');
 return function(...args){
  const source=typeof args[0]?.source==='string'?args[0].source:null;
  onCall();
  try{return vm.runInNewContext('Reflect.apply(fn,receiver,args)',{fn,receiver:this,args},{timeout:milliseconds});}
  catch(error){if(error.code==='ERR_SCRIPT_EXECUTION_TIMEOUT')onTimeout();throw error;}
  finally{if(source!==null&&args[0].source!==source)throw Error('Calculation mutated the original draft input');}
 };
}
let recordExplicit=null;
const wrappedApis=new WeakMap();
function traceExportedCalculate(api,file,compiledCode=undefined){
 if(!api||typeof api.calculate!=='function')throw Error('An explicit VM deadline requires an exported calculate function');
 if(wrappedApis.has(api))return wrappedApis.get(api);
 const identity=physicalFile(file),code=compiledCode===undefined?fs.readFileSync(identity,'utf8'):compiledCode;
 if(typeof code!=='string')throw Error('A compiled deadline witness must be text');
 const record=recordExplicit?recordExplicit(identity,code,'explicit-vm'):null;
 const wrapped={...api,calculate:boundedCall(api.calculate,60000,()=>{if(record)record.calls++;},()=>{if(record)record.timeouts++;})};
 wrappedApis.set(api,wrapped);wrappedApis.set(wrapped,wrapped);return wrapped;
}
module.exports={boundedCall,traceExportedCalculate};
if(process.env.REVISAWIKI_DEADLINE_FILES){
 const targets=new Set(JSON.parse(process.env.REVISAWIKI_DEADLINE_FILES).map(physicalFile)),records=[],original=Module.prototype._compile;
 const newRecord=(identity,code,mode)=>{
  if(!targets.has(identity))throw Error('An explicit VM deadline target was not selected');
  const record={file:path.basename(identity),sourceFileSha256:sha(fs.readFileSync(identity)),compiledProgramSha256:sha(code),calls:0,timeouts:0,milliseconds:60000,mode};
  records.push(record);return record;
 };
 recordExplicit=newRecord;
 let networkAttempts=0;
 const noNetwork=()=>{networkAttempts++;throw Error('This focused test task is offline');};
 globalThis.fetch=async()=>noNetwork();
 for(const scheme of ['http','https']){const client=require('node:'+scheme);client.request=noNetwork;client.get=noNetwork;}
 Module.prototype._compile=function(code,filename){
  const result=original.call(this,code,filename);
  let identity;try{identity=physicalFile(filename);}catch(_){return result;}
  if(targets.has(identity)&&typeof this.exports?.calculate==='function'&&!wrappedApis.has(this.exports)){
   const raw=this.exports,record=newRecord(identity,code,'module-compile');
   const wrapped={...raw,calculate:boundedCall(raw.calculate,60000,()=>record.calls++,()=>record.timeouts++)};
   wrappedApis.set(raw,wrapped);wrappedApis.set(wrapped,wrapped);this.exports=wrapped;
  }
  return result;
 };
 process.on('exit',()=>{
  if(process.env.REVISAWIKI_DEADLINE_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_DEADLINE_RECEIPT,
   JSON.stringify({kind:'test-only-exported-calculation-deadline',milliseconds:60000,targetResolution:'realpath',uniqueTargets:targets.size,records,networkAttempts,
    outputsUnmodified:true,sourceFilesUnmodified:true,wikipediaWrites:0},null,2)+'\n',{flag:'wx'});
 });
}
