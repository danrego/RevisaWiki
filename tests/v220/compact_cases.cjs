'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {compact}=require('../../scripts/v220_compact.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const sources=[
 '(function(){return 7;})()',
 '(function(){return\n {value:7};})()',
 '(function(){let x=1;return x\n ++x;})()',
 '(function(){let x=3;return x\n --x;})()',
 '(function(){let x=1;return x + ++x;})()',
 '(function(){let x=3;return x - --x;})()',
 '(function(){return /a/.test("a");})()',
 '(function(){return /a/.source + /b/.source;})()',
 '(function(){return 8 / 2 / 2;})()',
 '(function(){return 1 .toString();})()',
 '(function(){return 1..toString();})()',
 '(function(){let café=2;return café;})()',
 '(function(){let \\u0061=2;return a;})()',
 '(function(){return " a  b ";})()',
 '(function(){return ` a  b ${1 + 2} `;})()',
 '(function(){return /a  b/gi.source;})()',
 '(function(){/* license: retain  a  b */return 2;})()',
 '(function(){// retain this comment\nreturn 2;})()',
 '(function(){return (null ?? (2 || 3));})()',
 '(function(){return ({a:2})?.a;})()',
 '(function(){return (class { #x=2; get(){return this.#x;} });})() .name',
 '(function(){const f=(x)=>({value:x});return f(2).value;})()',
 '(function(){let out=0;for(let i=0;i<4;i++)out+=i;return out;})()',
 '(function(){try{throw 2;}catch(e){return e;}finally{void 0;}})()',
 '(function(){return typeof (void 0);})()',
 '(function(){return ! ! 2;})()',
 '(function(){const x={...{a:2}};return x.a;})()',
 '(function(){const [a,...rest]=[1,2,3];return rest.length+a;})()',
 '(function(){return 2 ** 3 ** 2;})()',
 '(function(){return (-2) ** 2;})()',
 '(function(){return 4 < 5 && 6 > 2;})()',
 '(function(){let a=0; a ||= 2; a ??= 4; return a;})()',
 '/* retained header */\n(function(){return 2;})()\n// retained trailer',
 '\uFEFF(function(){return "retained";})()',
 '(function(){return\u2028 4;})()',
 '(function(){return\u2029 4;})()'
];
const report={kind:'token-preserving-build-formatting',status:'passed',cases:[],checks:0,networkRequests:0,wikipediaWrites:0,
 limits:['These are JavaScript build controls, not article or semantic-scenario counts.','Every production build independently checks the complete program, all tokens and all comments.']};
for(const source of sources)for(const eol of ['\n','\r\n']){
 const input=source.replace(/\n/g,eol),r=compact(input),row={sourceSha256:hash(input),outputSha256:hash(r.code),status:'passed'};
 report.cases.push(row);
 try{
  report.checks++;assert.equal(vm.runInNewContext(r.code),vm.runInNewContext(input),'Observable result is retained');
  report.checks++;assert.equal(compact(r.code).code,r.code,'Formatting converges after one pass');
  report.checks++;assert.equal(r.proof.sourceSha256,hash(input),'Proof binds the exact build input');
  report.checks++;assert.equal(r.proof.outputSha256,hash(r.code),'Proof binds the exact build output');
 }catch(error){row.status='failed';row.error=error.message;report.status='failed';}
}
for(const input of ['export default await Promise.resolve(2);','async function f(x){return [...await x];}','#!/usr/bin/env node\nconsole.log("example");']){
 const r=compact(input);report.cases.push({sourceSha256:hash(input),outputSha256:hash(r.code),status:'passed',parseOnly:true});
 report.checks++;assert.equal(compact(r.code).code,r.code,'Module, await-spread and interpreter syntax remain stable');
}
report.runnerSha256=hash(fs.readFileSync(__filename));console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
