'use strict';
// Exact source/descriptor/option pins precede any generated UI calculation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'native_spouse_wrapper_setup_contract.json'));assert.equal(sha(bytes),'f407f7dd95e5a0bf79bd79e435fe1b97ee8fb2886227a59d8bae50da44683f37','Exact source-backed native wrapper adjudication');const contract=JSON.parse(bytes);
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
module.exports=fixtureBytes=>{
 assert.equal(sha(fixtureBytes),contract.historicalFixtureSha256,'Original historical spouse fixture bytes retained');
 return (item,options,mode)=>{
  assert(['generator','native-ui'].includes(mode));const row=contract.rows.find(row=>row.id===item.id);if(!row)return null;
  assert.equal(sha(Buffer.from(item.source)),row.sourceSha256,'Exact original source for native wrapper disposition');
  assert.equal(sha(Buffer.from(JSON.stringify(canonical(item)))),row.fixtureDescriptorSha256,'All original fixture descriptor fields retained');assert.equal(item.source,row.expectedSource);
  const wanted=mode==='generator'?contract.optionsOverrides:contract.nativeUIOptionsOverrides;
  for(const [key,value]of Object.entries(wanted))assert.equal(options[key],value,'Exact original wrapper context '+key);
  return row;
 };
};
