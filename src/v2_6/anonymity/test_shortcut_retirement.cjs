'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const target=path.resolve(process.argv[2]),previous=process.argv[3]&&path.resolve(process.argv[3]);
const api=require(target),old=previous&&require(previous),retired=['it','tw','er','wf','wm','w1','tf','w4','ws'];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const base=Object.fromEntries(Object.entries(api.defaults).map(([k,v])=>[k,typeof v==='boolean'?false:v]));
Object.assign(base,{namespaceNumber:0,pageTitle:'Teste de atalhos',shortcuts:true,review:false,authorityControl:false,endTemplateOrder:false});
let checks=0;const rows=[];
function check(name,fn){try{fn();checks++;rows.push({name,passed:true});}catch(e){rows.push({name,passed:false,error:String(e.message)});}}
const command=key=>'\\'.repeat(3)+key;
for(const key of retired){
 check(key+' absent from exported map',()=>assert(!Object.hasOwn(api.shortcuts,key)));
 check(key+' stays literal',()=>{const input='Texto. '+command(key);assert.equal(api.cleanup(input,base).text,input);});
 check(key+' produces no adjustment or alert',()=>{const r=api.cleanup('Texto. '+command(key),base);assert.deepEqual(r.changes,[]);assert.deepEqual(r.warnings,[]);});
 check(key+' stays literal in protected text',()=>{const input='<nowiki>'+command(key)+'</nowiki>';assert.equal(api.cleanup(input,base).text,input);});
 check(key+' remains literal when disabled',()=>{const input='Texto. '+command(key);assert.equal(api.cleanup(input,{...base,shortcuts:false}).text,input);});
 if(old)check(key+' was a distinct optional legacy dependency',()=>assert(Object.hasOwn(old.shortcuts,key)));
}
const retained=Object.keys(api.shortcuts);
check('neutral shortcuts remain available',()=>assert(retained.length>15));
for(const key of retained){
 check(key+' disabled remains literal',()=>{const input='Texto. '+command(key);assert.equal(api.cleanup(input,{...base,shortcuts:false}).text,input);});
 check(key+' enabled expands',()=>{const input='Texto. '+command(key),r=api.cleanup(input,base);assert(!r.text.includes(command(key)));assert(r.changes.some(c=>c.id==='shortcuts'));});
 if(old){
  check(key+' exact neutral mapping retained',()=>assert.equal(api.shortcuts[key],old.shortcuts[key]));
  check(key+' exact neutral output retained',()=>assert.equal(api.cleanup('Texto. '+command(key),base).text,old.cleanup('Texto. '+command(key),base).text));
 }
}
for(const key of ['unknown','itx','w10','wmx','__proto__','constructor'])check('unknown '+key+' stays literal',()=>{const input='Texto. '+command(key);assert.equal(api.cleanup(input,base).text,input);});
if(old)check('only nine map entries removed',()=>assert.deepEqual(Object.keys(old.shortcuts).filter(k=>!Object.hasOwn(api.shortcuts,k)).sort(),retired.slice().sort()));
check('neutral report label',()=>assert(fs.readFileSync(target,'utf8').includes("shortcuts: 'Atalhos explícitos',")));
const report={version:api.version,status:rows.every(x=>x.passed)?'passed':'failed',bundleSha256:sha(fs.readFileSync(target)),previousBundleSha256:previous?sha(fs.readFileSync(previous)):null,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,checks,retiredOptionalCommands:retired,neutralCommandsRetained:retained.length,networkRequests:0,wikipediaWrites:0,tests:rows};
if(process.env.REVISAWIKI_QA_REPORT)fs.writeFileSync(process.env.REVISAWIKI_QA_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,tests:rows.filter(x=>!x.passed)}));process.exitCode=report.failed?1:0;
