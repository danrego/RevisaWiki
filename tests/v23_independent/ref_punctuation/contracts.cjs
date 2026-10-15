'use strict';
// Independent expected cases. The compile-time probe only exports existing readers;
// it does not alter any production rule or write to a release file.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const artifactDir=path.join(__dirname,'..','artifacts','ref_punctuation');fs.mkdirSync(artifactDir,{recursive:true});
const dir=__dirname,root=path.resolve(dir,'../../..');
const script=process.env.REVISAWIKI_QA_SCRIPT||path.join(root,'dist/2.3.0/RevisaWiki_v2_3_completo.js');
const sourceCode=fs.readFileSync(script,'utf8'),probe=new Module(script,module);probe.filename=script;probe.paths=module.paths;
assert.equal(sourceCode.split('    const api = {').length,2,'Recognized test-only API export injection point');
probe._compile(sourceCode.replace('    const api = {','    const api = {_punctuationQA:{refPunctuation,maskProtected},'),script);
const api=probe.exports,read=api._punctuationQA,rows=[];let checks=0;
const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},ok=(x,m)=>{checks++;assert(x,m)},sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function test(name,fn){let c=checks;try{fn();rows.push({name,passed:true,checks:checks-c})}catch(e){rows.push({name,passed:false,checks:checks-c,error:e.stack})}}
function fix(s){const shield=read.maskProtected(s,()=>{});return shield.restore(read.refPunctuation(shield.text,()=>{},()=>{}));}
const refs=s=>[...s.matchAll(/<ref\b[^>]*\/\s*>|<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi)].map(m=>m[0]);
for(const f of JSON.parse(fs.readFileSync(path.join(dir,'fixtures.json'))))test(f.name,()=>{const out=fix(f.source);eq(out,f.expected,'Exact manually specified punctuation and space result');eq(fix(out),out,'One-click stable');eq(refs(out),refs(f.source),'Reference definitions, calls, names and group attributes stay byte identical');eq(api.preservationAudit(f.source,out),[],'No source fact or literal is lost');});
const cfg={namespaceNumber:0,pageTitle:'História da ciência',authorityControl:false,endTemplateOrder:false};
const historyFile=path.join(root,'tests/fixtures/v23/71855786.wiki');
assert(fs.existsSync(historyFile),'Bundled real regression fixture is required');test('real História da ciência 71855786 source regression',()=>{
 const before=fs.readFileSync(historyFile,'utf8'),r=api.calculate({kind:'adjust',source:before,originalSource:before,options:cfg});
 ok(before.includes('</ref>.Galileu Galilei'),'Frozen source has the original glued punctuation');
 ok(!r.text.includes('</ref>Galileu Galilei'),'First pass does not create a glued word');
 ok(/honraria\.<ref name=":7">[\s\S]{1,800}?<\/ref> Galileu Galilei/.test(r.text),'Period moves before original book ref and following name has one space');
 eq(api.cleanup(r.text,cfg).text,r.text,'Full real article stable on first pass');eq(r.preservation,[],'Real article content retained');
 for(const fact of ['As 100 maiores personalidades da história: uma classificação das pessoas que mais influenciaram a história.','Michael H.','Hart','85-7432-010-2','Galileu Galilei (1564 — 1642)'])ok(r.text.includes(fact),'Original bibliographic/prose fact retained: '+fact);
 const hunks=api.comparison(before,r);eq(api.composeChanges(before,hunks),r.text,'Accept-all exact');eq(api.composeChanges(before,hunks.map(h=>({...h,accepted:false}))),before,'Reject-all exact original');
 eq(r.byteMetrics.delta,Buffer.byteLength(r.text)-Buffer.byteLength(before),'UTF-8 report accurate');
 fs.writeFileSync(path.join(artifactDir,'71855786_candidate.wiki'),r.text);
});
for(const s of ['Texto<ref name="a">Fonte A.</ref>.Galileu','Texto<ref group="nota" name="a">Fonte A.</ref>,123','Texto<ref>{{Citar livro|título=Fonte A.|ano=2020}}</ref>!Álgebra'])test('whole-pipeline tiny case '+s,()=>{const r=api.calculate({kind:'adjust',source:s,originalSource:s,options:{...cfg,endMatter:false,structuralRepairs:false}});eq(api.cleanup(r.text,{...cfg,endMatter:false,structuralRepairs:false}).text,r.text,'Full pipeline first pass stable');eq(r.preservation,[],'Content retained in whole pipeline');ok(!/<\/ref>[\p{L}\p{N}]/u.test(r.text),'No closing reference glued to following word');});
const report={version:api.version,scriptSha256:sha(sourceCode),fixtureSha256:sha(fs.readFileSync(path.join(dir,'fixtures.json'))),cases:rows.length,checks,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,wikipediaWrites:0,networkRequests:0,tests:rows};
const out=process.env.REVISAWIKI_QA_REPORT||path.join(artifactDir,'results.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,tests:rows.filter(x=>!x.passed).slice(0,8)}));process.exitCode=report.failed?1:0;
