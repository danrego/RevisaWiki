'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(p=>path.resolve(p));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.join(root,'dist/2.19.0',n)));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),report={kind:'independent-footer-interval-query',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
let seed=9201843;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
for(const file of files){const raw=fs.readFileSync(file),api=require(file);report.bundles.push({sha256:sha(raw),bytes:raw.length,version:api.version});
 const run=(id,fn)=>{report.cases++;try{fn();}catch(e){report.status='failed';if(report.failures.length<50)report.failures.push({id,message:e.message});}};
 for(let n=0;n<5000;n++)run('query-'+n,()=>{
  const length=[0,1,2,10,63,64,65,99,400][n%9],ranges=Array.from({length},()=>{const start=next()%2000;return {start,end:start+next()%500};}),start=next()%2000,end=start+next()%400,pos=n%2?start:next()%2500;
  // The exact prior declarative predicate supplies the independent oracle.
  const expected=ranges.some(r=>r.start<=pos&&pos<r.end&&(r.start<start||r.end>end));
  report.checks++;assert.equal(api.v219RangeOutside(pos,ranges,start,end),expected,'An indexed query has the exact declarative containment semantics');
  report.checks++;assert.equal(api.v219RangeOutside(pos,ranges,start,end),expected,'A repeated query is stable');
  report.checks++;assert.equal(api.v219RangeOutside(pos,ranges.map(r=>({...r})),start,end),expected,'Object identity does not alter the answer');
 });
 for(const count of [1,63,64,65,200])for(const mode of ['equal','inner','outer','preceding','adjacent','same-start-shorter','same-start-longer'])run('boundary-'+count+'-'+mode,()=>{
  const candidate={start:50,end:100},ranges=Array.from({length:count},(_,i)=>({start:500+i*2,end:501+i*2})),special={equal:{start:50,end:100},inner:{start:51,end:99},outer:{start:49,end:101},preceding:{start:1,end:51},adjacent:{start:1,end:50},'same-start-shorter':{start:50,end:99},'same-start-longer':{start:50,end:101}}[mode];ranges.push(special);
  report.checks++;assert.equal(api.v219RangeOutside(candidate.start,ranges,candidate.start,candidate.end),['outer','preceding','same-start-longer'].includes(mode),'Exact open/closed interval boundaries are retained');
 });
 report.checks++;assert.equal(sha(fs.readFileSync(file)),sha(raw),'Actual runtime bytes remain unchanged');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
