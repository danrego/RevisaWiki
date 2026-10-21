'use strict';
// Historical source and assertions stay immutable. Only an explicit runtime
// address is redirected. There is no expected-result or assertion amendment.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto'),os=require('node:os');
const runtime=process.env.REVISAWIKI_HISTORICAL_RUNTIME,receipt=process.env.REVISAWIKI_HISTORICAL_BINDING;
if(!runtime||!receipt)throw new Error('The historical preload requires an explicit actual runtime and private receipt');
const actual=path.resolve(runtime),root=path.resolve(__dirname,'../..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const originalRead=fs.readFileSync.bind(fs),originalWrite=fs.writeFileSync.bind(fs),originalLoad=Module._load;
const bytes=originalRead(actual),binding={schemaVersion:1,runtimeSha256:hash(bytes),runtimeBytes:bytes.length,runtimeLoads:0,addressRedirects:[],sourceReads:[],blockedNetwork:0,blockedRepositoryWrites:0,blockedSubprocesses:0,dynamicExecutions:[],expectationAdapters:[],orchestratorAssertionRewrites:0,orchestratorExpectedResultRewrites:0};
function runtimeAddress(value){
 if(typeof value!=='string'&&!Buffer.isBuffer(value))return null;
 const name=path.basename(String(value));
 return /^RevisaWiki_v2(?:_\d+)+(?:_completo)?\.js$/.test(name)?actual:null;
}
Module._load=function(request,parent,isMain){
 const target=runtimeAddress(request);
 if(target){binding.runtimeLoads++;binding.addressRedirects.push({requested:path.basename(request),target:path.basename(actual)});return originalLoad.call(this,target,parent,false);}
 if(/(?:adapter|harness)\.cjs$/.test(request))try{const resolved=Module._resolveFilename(request,parent),code=originalRead(resolved,'utf8');if(/oracleAdditions|runAmendedStructure/.test(code))binding.expectationAdapters.push({file:path.basename(resolved),sha256:hash(code)});}catch{}
 return originalLoad.call(this,request,parent,isMain);
};
fs.readFileSync=function(file,...tail){const target=runtimeAddress(file);if(target){binding.sourceReads.push({requested:path.basename(String(file)),target:path.basename(actual)});return originalRead(target,...tail);}return originalRead(file,...tail);};
// These leaves are local tests. A test needing a new live capture belongs to a
// separate primary-source retrieval step, rather than this immutable run.
const local=value=>{try{return ['localhost','127.0.0.1','::1','[::1]'].includes(new URL(value).hostname);}catch{return false;}};
if(globalThis.fetch){const fetch=globalThis.fetch;globalThis.fetch=function(input,options){const url=typeof input==='string'?input:input?.url;if(!local(url)){binding.blockedNetwork++;return Promise.reject(new Error('Historical offline campaign blocked a nonlocal request'));}return fetch(input,options);};}
for(const scheme of ['node:http','node:https']){
 const transport=require(scheme);
 for(const name of ['request','get']){const original=transport[name];transport[name]=function(input,...tail){let allowed;if(typeof input==='string'||input instanceof URL)allowed=local(String(input));else allowed=['localhost','127.0.0.1','::1'].includes(input?.hostname||input?.host);if(!allowed){binding.blockedNetwork++;throw new Error('Historical offline campaign blocked a nonlocal transport');}return original.call(this,input,...tail);};}
}
const net=require('node:net');for(const name of ['connect','createConnection']){const original=net[name];net[name]=function(...args){const object=typeof args[0]==='object'?args[0]:null,host=object?.host||typeof args[1]==='string'&&args[1]||'localhost';if(!['localhost','127.0.0.1','::1'].includes(host)){binding.blockedNetwork++;throw new Error('Historical offline campaign blocked a nonlocal socket');}return original.apply(this,args);};}
const allowedRoots=[path.dirname(receipt),os.tmpdir(),process.env.NODE_V8_COVERAGE].filter(Boolean).map(value=>path.resolve(value));
const writable=value=>{if(typeof value==='number')return true;const resolved=path.resolve(String(value));return resolved!==root&&!resolved.startsWith(root+path.sep)&&allowedRoots.some(base=>resolved===base||resolved.startsWith(base+path.sep));};
for(const name of ['writeFileSync','appendFileSync','unlinkSync','rmSync','renameSync','copyFileSync','mkdirSync','rmdirSync']){
 const original=fs[name];fs[name]=function(...args){const destinations=name==='renameSync'||name==='copyFileSync'?[args[1]]:[args[0]];if(destinations.some(value=>!writable(value))){binding.blockedRepositoryWrites++;throw new Error('Historical execution cannot change repository source or fixtures');}return original.apply(this,args);};
}
for(const name of ['writeFile','appendFile','unlink','rm','rename','copyFile','mkdir','rmdir']){
 const callbackOriginal=fs[name];if(callbackOriginal)fs[name]=function(...args){const destinations=name==='rename'||name==='copyFile'?[args[1]]:[args[0]];if(destinations.some(value=>!writable(value))){binding.blockedRepositoryWrites++;const callback=args.at(-1);if(typeof callback==='function'){process.nextTick(()=>callback(new Error('Historical execution cannot change repository source or fixtures')));return;}throw new Error('Historical execution cannot change repository source or fixtures');}return callbackOriginal.apply(this,args);};
 const original=fs.promises[name];if(!original)continue;fs.promises[name]=async function(...args){const destinations=name==='rename'||name==='copyFile'?[args[1]]:[args[0]];if(destinations.some(value=>!writable(value))){binding.blockedRepositoryWrites++;throw new Error('Historical execution cannot change repository source or fixtures');}return original.apply(this,args);};
}
for(const name of ['createWriteStream','openSync']){const original=fs[name];fs[name]=function(...args){const mutates=name==='createWriteStream'||/[wa+]/.test(String(args[1]));if(mutates&&!writable(args[0])){binding.blockedRepositoryWrites++;throw new Error('Historical execution cannot create a repository write stream');}return original.apply(this,args);};}
const child=require('node:child_process');for(const name of ['spawn','spawnSync','execFile','execFileSync','fork','exec','execSync']){const original=child[name];child[name]=function(command,...tail){if(name==='exec'||name==='execSync'||name!=='fork'&&path.resolve(String(command))!==path.resolve(process.execPath)){binding.blockedSubprocesses++;throw new Error('Historical offline campaign permits only guarded Node subprocesses');}return original.call(this,command,...tail);};}
// Dynamic execution is recorded separately. Its source hash cannot borrow the
// published runtime's exact-byte binding if a historical helper adds exports.
const vm=require('node:vm');for(const name of ['runInContext','runInNewContext','runInThisContext']){const original=vm[name];vm[name]=function(code,...tail){if(typeof code==='string'&&/RevisaWiki|module\.exports|exports\s*=/.test(code))binding.dynamicExecutions.push({kind:name,sha256:hash(code),exactRuntime:hash(code)===binding.runtimeSha256});return original.call(this,code,...tail);};}
const OriginalScript=vm.Script;vm.Script=new Proxy(OriginalScript,{construct(Target,args,newTarget){const code=args[0];if(typeof code==='string'&&/RevisaWiki|module\.exports|exports\s*=/.test(code))binding.dynamicExecutions.push({kind:'Script',sha256:hash(code),exactRuntime:hash(code)===binding.runtimeSha256});return Reflect.construct(Target,args,newTarget);}});
const originalCompile=Module.prototype._compile;Module.prototype._compile=function(code,filename){if(runtimeAddress(filename)&&hash(code)!==binding.runtimeSha256)binding.dynamicExecutions.push({kind:'module-compile',sha256:hash(code),exactRuntime:false});return originalCompile.call(this,code,filename);};
process.on('exit',()=>{binding.runtimeBytesUnchanged=hash(originalRead(actual))===binding.runtimeSha256;binding.nonexactDynamicExecutionDetected=binding.dynamicExecutions.some(value=>!value.exactRuntime);originalWrite(receipt+'.'+process.pid+'.json',JSON.stringify(binding,null,2)+'\n');});
