'use strict';
// Test-only observation at the exported API boundary. No deadline, algorithm,
// result, draft or protection is replaced by this counter.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),selected=process.env.REVISAWIKI_CURRENT_CORE,
 target=selected&&fs.realpathSync(selected),records=[],compile=Module.prototype._compile,seen=new WeakSet();
Module.prototype._compile=function(code,filename){
 const result=compile.call(this,code,filename);let exact;try{exact=fs.realpathSync(filename);}catch{}
 if(exact===target&&this.exports&&typeof this.exports.calculate==='function'&&!seen.has(this.exports)){
  const api=this.exports,fn=api.calculate,row={runtimeSha256:sha(fs.readFileSync(exact)),compiledProgramSha256:sha(code),calls:0,completed:0,threw:0,originalDraftMutation:0};records.push(row);seen.add(api);
  api.calculate=new Proxy(fn,{apply(call,receiver,args){
   const input=args[0],source=typeof input?.source==='string'?input.source:null;row.calls++;
   try{const value=Reflect.apply(call,receiver,args);row.completed++;return value;}
   catch(error){row.threw++;throw error;}
   finally{if(source!==null&&input.source!==source){row.originalDraftMutation++;throw Error('Exported calculation changed its original draft input');}}
  }});
 }
 return result;
};
process.on('exit',()=>{
 const name=process.env.REVISAWIKI_V2217_CALCULATION_TRACE;if(!name)return;
 fs.writeFileSync(path.resolve(name+'.'+process.pid+'.json'),JSON.stringify({kind:'test-only-exported-calculation-observer',records,
  calls:records.reduce((n,r)=>n+r.calls,0),completed:records.reduce((n,r)=>n+r.completed,0),
  threw:records.reduce((n,r)=>n+r.threw,0),originalDraftMutation:records.reduce((n,r)=>n+r.originalDraftMutation,0),
  deadlineIntroduced:false,productionFunctionBodiesChanged:false,wikipediaWrites:0},null,2)+'\n',{flag:'wx'});
});
