'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const artifactDir=path.join(__dirname,'..','artifacts','reference_headers');fs.mkdirSync(artifactDir,{recursive:true});
const dir=__dirname,root=path.resolve(dir,'../../..'),script=process.env.REVISAWIKI_QA_SCRIPT||path.join(root,'dist/2.3.0/RevisaWiki_v2_3_completo.js');
const program=fs.readFileSync(script,'utf8'),probe=new Module(script,module);probe.filename=script;probe.paths=module.paths;
assert.equal(program.split('    const api = {').length,2);probe._compile(program.replace('    const api = {','    const api = {_headerQA:{normalizeLists,maskProtected},'),script);
const api=probe.exports,read=api._headerQA,rows=[];let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},ok=(x,m)=>{checks++;assert(x,m)},sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function test(name,fn){let c=checks;try{fn();rows.push({name,passed:true,checks:checks-c})}catch(e){rows.push({name,passed:false,checks:checks-c,error:e.stack})}}
function fix(s){const shield=read.maskProtected(s,()=>{});return shield.restore(read.normalizeLists(shield.text,()=>{},()=>{}));}
const urls=s=>[...s.matchAll(/https?:\/\/[^\s\]<>{}|"']+/g)].map(x=>x[0]);
for(const f of JSON.parse(fs.readFileSync(path.join(dir,'fixtures.json'))))test(f.name,()=>{const out=fix(f.source);eq(out,f.expected,'Exact expected prefix, heading and renderer result');eq(fix(out),out,'Idempotent normalization');eq(urls(out),urls(f.source),'All URL strings preserved in exact order');eq(api.preservationAudit(f.source,out),[],'Visible prose, references and source identifiers preserved');});
const file=path.join(root,'tests/fixtures/v23/72350938.wiki');
assert(fs.existsSync(file),'Bundled real regression fixture is required');test('real Tokyo skyscrapers 72350938 bibliography',()=>{
 const source=fs.readFileSync(file,'utf8'),cfg={namespaceNumber:0,pageTitle:'Lista das estruturas e edifícios mais altos de Tóquio',authorityControl:false,endTemplateOrder:false},result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
 for(const url of ['https://web.archive.org/web/20150511194438/http://www.emporis.com/statistics/tallest-buildings/city/100297/tokyo-japan','http://skyscraperpage.com/diagrams/?cityID=962','https://skyscrapercenter.com/city/tokyo'])ok(result.text.includes(url),'Exact general source URL retained: '+url);
 for(const label of ['Tóquio, Emporis.com','Diagrama dos arranha-céus de Tóquio, SkyscraperPage.com','Tóquio, The Skyscraper Center','; Gerais','; Específicas'])ok(result.text.includes(label),'Exact general bibliography label retained: '+label);
 eq(api.cleanup(result.text,cfg).text,result.text,'Real full article first-pass stable');eq(result.preservation,[],'No lost source/prose');
 const first=source.indexOf('; Gerais'),last=source.indexOf('{{Reflist}}',first),body=source.slice(first,last);ok(result.text.includes(body),'Entire general bibliography and Específicas boundary retained byte for byte');
 fs.writeFileSync(path.join(artifactDir,'72350938_candidate.wiki'),result.text);
});
const report={version:api.version,scriptSha256:sha(program),fixtureSha256:sha(fs.readFileSync(path.join(dir,'fixtures.json'))),cases:rows.length,checks,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,wikipediaWrites:0,networkRequests:0,tests:rows};fs.writeFileSync(process.env.REVISAWIKI_QA_REPORT||path.join(artifactDir,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,tests:rows.filter(x=>!x.passed).slice(0,8)}));process.exitCode=report.failed?1:0;
