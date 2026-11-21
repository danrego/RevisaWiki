'use strict';
// Observe inherited exported calls without adding a product or VM deadline.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),target=fs.realpathSync(process.env.REVISAWIKI_CURRENT_CORE),compile=Module.prototype._compile;
const records=[],wrapped=new WeakSet();let networkAttempts=0;
const deny=()=>{networkAttempts++;throw Error('Inherited regression is offline');};
globalThis.fetch=async()=>deny();for(const name of ['node:http','node:https']){const client=require(name);client.request=deny;client.get=deny;}
Module.prototype._compile=function(code,filename){
 const value=compile.call(this,code,filename);let identity;try{identity=fs.realpathSync(filename);}catch{return value;}
 if(identity!==target||typeof this.exports?.calculate!=='function'||wrapped.has(this.exports))return value;
 const raw=this.exports,record={runtimeSha256:sha(fs.readFileSync(identity)),compiledProgramSha256:sha(code),calls:0,draftInputsPreserved:true,milliseconds:0};records.push(record);
 const api={...raw,calculate:function(...args){const source=args[0]?.source,started=performance.now();record.calls++;record.activeSourceSha256=typeof source==='string'?sha(source):null;
  if(process.env.REVISAWIKI_OBSERVER_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_OBSERVER_RECEIPT+'.'+process.pid+'.progress.json',JSON.stringify({records,networkAttempts,wikipediaWrites:0}));
  try{return Reflect.apply(raw.calculate,this,args);}finally{record.milliseconds+=performance.now()-started;record.activeSourceSha256=null;if(typeof source==='string'&&args[0].source!==source){record.draftInputsPreserved=false;throw Error('Calculation mutated its source argument');}}}};
 wrapped.add(raw);wrapped.add(api);this.exports=api;return value;
};
process.on('exit',()=>{if(process.env.REVISAWIKI_OBSERVER_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_OBSERVER_RECEIPT+'.'+process.pid+'.json',JSON.stringify({kind:'inherited-call-observer',fixedVmDeadline:false,records,networkAttempts,wikipediaWrites:0},null,2)+'\n',{flag:'wx'});});
