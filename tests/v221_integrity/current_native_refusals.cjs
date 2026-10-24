'use strict';
// Test-only expectations for four exact, natively qualified refusals.
// Original fixtures, assertions, bundles and calculation deadlines are unchanged.
// Load through NODE_OPTIONS so fixture subprocesses inherit the same restriction.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module'),assert=require('node:assert/strict');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),directory=path.resolve(__dirname,'../v221'),
 whitelistFile=path.join(__dirname,'native_refusal_expectations.json'),rawWhitelist=fs.readFileSync(whitelistFile),
 whitelistSha256='0c14c1f4ac2ac23ef60f747f6aae6e7ebe0864a8a4e9bcaf49722e6e159550de';
const adapterSourceSha256=sha(fs.readFileSync(__filename));
assert.equal(sha(rawWhitelist),whitelistSha256,'The exact native-refusal whitelist must be reviewed before it changes');
const whitelist=JSON.parse(rawWhitelist);
for(const row of whitelist.cases)Object.freeze(row);
Object.freeze(whitelist.cases);Object.freeze(whitelist.allowedBundleSha256);
const rows=new Map(whitelist.cases.map(row=>[row.file+'\0'+row.id,row])),
 targets=new Map(),active=new Set(),compiles=[],applications=[],runtimePins=new Map();
assert.equal(whitelist.schema,1);assert.equal(rows.size,4);assert.equal(whitelist.automaticFixCredit,0);
for(const [name,contract]of Object.entries(whitelist.files)){
 const file=fs.realpathSync(path.join(directory,name));assert.equal(sha(fs.readFileSync(file)),contract.sha256,'Frozen fixture stays unchanged');
 targets.set(file,{name,...contract});
}
function assertRuntime(){
 const selected=process.env.REVISAWIKI_V221_BUNDLE;
 assert.equal(typeof selected,'string','Select the exact reviewed current bundle for this adapter');
 const file=fs.realpathSync(path.resolve(selected)),pin=sha(fs.readFileSync(file));
 assert(whitelist.allowedBundleSha256.includes(pin),'The current bundle is not in the reviewed expectation scope');
 runtimePins.set(file,pin);return pin;
}
function verifyPair(file,id,before,after){
 const row=rows.get(file+'\0'+id);if(!row)return {after,qualified:false};
 assert.equal(typeof before,'string');assert.equal(typeof after,'string');
 assert.equal(before,row.before,'The retained source endpoint must match the exact native proof');
 assert.equal(after,row.historicalExpectedAfter,'The historical expected endpoint must match the exact native proof');
 assert.equal(sha(before),row.beforeSha256);assert.equal(sha(after),row.historicalExpectedAfterSha256);
 assert.equal(row.currentExpectedAfter,before);assert.equal(row.currentExpectedAfterSha256,row.beforeSha256);
 return {after:before,qualified:true};
}
function qualify(file,id,before,after){
 const result=verifyPair(file,id,before,after);if(!result.qualified)return after;
 assert(active.has(file),'A native refusal may only adapt its pinned fixture while that fixture is executing');
 const row=rows.get(file+'\0'+id),bundleSha256=assertRuntime();applications.push({file,id,fixtureSha256:row.sourceFixtureSha256,
  beforeSha256:row.beforeSha256,historicalExpectedAfterSha256:row.historicalExpectedAfterSha256,
  currentExpectedAfterSha256:row.beforeSha256,bundleSha256,disposition:'native-refusal-source-preserved',automaticFixCredit:0});
 return result.after;
}
const previous=Module.prototype._compile;
Module.prototype._compile=function(program,filename){
 let identity;try{identity=fs.realpathSync(path.resolve(filename));}catch(_){return previous.call(this,program,filename);}
 const contract=targets.get(identity);if(!contract)return previous.call(this,program,filename);
 assert.equal(sha(fs.readFileSync(identity)),contract.sha256,'Frozen fixture file changed');
 assert.equal(sha(program),contract.sha256,'Only the original pinned fixture program can be adapted');assertRuntime();
 assert.equal(program.split(contract.addDeclaration).length-1,1,'One exact fixture registration declaration');
 const call='cases.push({id,before,after})',replacement='cases.push({id,before,after:require('+JSON.stringify(__filename)+').qualify('+JSON.stringify(contract.name)+',id,before,after)})';
 assert.equal(contract.addDeclaration.split(call).length-1,1);
 const adapted=program.replace(contract.addDeclaration,contract.addDeclaration.replace(call,replacement));
 compiles.push({file:contract.name,sourceSha256:contract.sha256,compiledProgramSha256:sha(adapted),change:'one-registration-declaration-only'});
 active.add(contract.name);try{return previous.call(this,adapted,filename);}finally{active.delete(contract.name);}
};
process.on('exit',()=>{
 assert.equal(sha(fs.readFileSync(__filename)),adapterSourceSha256,'The adapter remains unchanged during execution');
 for(const [file,pin]of runtimePins)assert.equal(sha(fs.readFileSync(file)),pin,'Selected bundle remains unchanged');
 for(const [file,contract]of targets)assert.equal(sha(fs.readFileSync(file)),contract.sha256,'Frozen fixture remains unchanged');
 const out=process.env.REVISAWIKI_NATIVE_REFUSAL_ADAPTER_RECEIPT_DIR;if(!out)return;
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'native-refusals-'+process.pid+'.json'),JSON.stringify({
  kind:'four-exact-native-refusal-expectations',whitelistSha256,adapterSourceSha256,nativeQualificationReceiptSha256:whitelist.nativeQualificationReceiptSha256,
  compiles,applications,uniqueQualifiedCases:[...new Set(applications.map(row=>row.file+'::'+row.id))],
  originalExpectedEndpointsRetained:true,originalRawFailureStatusesRetained:true,originalAssertionStatementsUnchanged:true,
  originalPositiveLabelsRetainedForHistoricalIdentity:true,automaticFixCredit:0,bundleCodeModifiedByAdapter:false,
  calculationDeadlineModifiedByAdapter:false,childPreload:'NODE_OPTIONS inheritance',wikipediaWrites:0
 },null,2)+'\n',{flag:'wx'});
});
module.exports={qualify,verifyPair,whitelistSha256};
