'use strict';
// Replaces only the old release-loading/report helper in a temporary test copy.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const candidate=require('./candidate.cjs'),{sha,load}=candidate;
function report(kind){return {version:candidate.manifest.version,kind,actualDistributions:true,frozenFiles:candidate.manifest.files,startedAt:new Date().toISOString(),checks:0,cases:[],failures:[]};}
function finish(value,name){
 value.completedAt=new Date().toISOString();
 for(const failure of value.failures||[])if(failure.stack)failure.stack=candidate.sanitized(failure.stack);
 fs.writeFileSync(path.join(candidate.artifactDirectory(),name+'.json'),JSON.stringify(value,null,2)+'\n');
 console.log(JSON.stringify({status:value.status,kind:value.kind,cases:value.cases.length,checks:value.checks,failures:value.failures}));return value;
}
module.exports={fs,path,assert,sha,load,report,finish};
