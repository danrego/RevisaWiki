"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'expected_release.json'),'utf8'));
const dist=path.resolve(process.env.REVISAWIKI_DIST||path.join(__dirname,'../../dist/2.6.0'));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const [name,frozen]of Object.entries(expected.files)){const bytes=fs.readFileSync(path.join(dist,name));assert.equal(bytes.length,frozen.bytes,'Frozen distribution byte count');assert.equal(sha(bytes),frozen.sha256,'Frozen distribution SHA256');}
function load(name){const file=path.join(dist,name),bytes=fs.readFileSync(file),frozen=expected.files[name];assert(frozen,'Only a manifest-approved bundle may be loaded');assert.equal(bytes.length,frozen.bytes,'Frozen bundle byte count');assert.equal(sha(bytes),frozen.sha256,'Frozen bundle SHA256');const api=require(file);assert.equal(api.version,'2.6.0','Exact release version');return {api,sha256:sha(bytes)};}
function report(kind){return {version:'2.6.0',kind,actualDistributions:true,frozenFiles:expected.files,startedAt:new Date().toISOString(),checks:0,cases:[],failures:[]};}
function finish(value,name){value.completedAt=new Date().toISOString();for(const failure of value.failures||[])if(failure.stack)for(const prefix of [__dirname,dist,process.cwd()])failure.stack=failure.stack.replaceAll(prefix,'<local-path>');if(process.env.REVISAWIKI_REPORT_DIR){const target=path.resolve(process.env.REVISAWIKI_REPORT_DIR);fs.mkdirSync(target,{recursive:true});fs.writeFileSync(path.join(target,name+'.json'),JSON.stringify(value,null,2)+'\n');}console.log(JSON.stringify({status:value.status,kind:value.kind,cases:value.cases.length,checks:value.checks,failures:value.failures}));return value;}
module.exports={fs,path,assert,sha,load,report,finish};
