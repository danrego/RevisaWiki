'use strict';
// Select disjoint fixture indices only. Original case objects, expectations,
// source files and every assertion in the inherited program are unchanged.
const Module=require('node:module'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const count=Number(process.env.REVISAWIKI_LEGACY_SHARDS),part=Number(process.env.REVISAWIKI_LEGACY_SHARD),target=path.resolve(__dirname,'../v221/biography_cases.cjs'),original=Module._load,sha=x=>crypto.createHash('sha256').update(x).digest('hex');
assert(Number.isInteger(count)&&count>0&&count<=32&&Number.isInteger(part)&&part>=0&&part<count);let record=null;
Module._load=function(request,parent,isMain){const result=original.call(this,request,parent,isMain);let file;try{file=Module._resolveFilename(request,parent,isMain);}catch{}if(file!==target||!Array.isArray(result?.cases))return result;
 const selected=result.cases.map((value,index)=>({value,index})).filter(x=>x.index%count===part),rows=selected.map(x=>x.value);
 record={kind:'disjoint-unchanged-inherited-fixture-selection',shards:count,shard:part,originalCaseCount:result.cases.length,selectedCaseCount:rows.length,selectedIndices:selected.map(x=>x.index),originalCasesSha256:sha(JSON.stringify(result.cases)),selectedCasesSha256:sha(JSON.stringify(rows)),sourceFileSha256:sha(fs.readFileSync(target)),expectationsChanged:false,caseObjectsChanged:false,assertionCodeChanged:false,wikipediaWrites:0};return{...result,cases:rows};
};
process.on('exit',()=>{if(process.env.REVISAWIKI_SHARD_RECEIPT&&record)fs.writeFileSync(process.env.REVISAWIKI_SHARD_RECEIPT,JSON.stringify(record,null,2)+'\n',{flag:'wx'});});
