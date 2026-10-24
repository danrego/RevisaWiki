'use strict';
// Keep historical normalization assertions intact. This independent suite proves
// the current conservative boundary and the unrelated table cleanup separately.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const files=process.argv.slice(2),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
assert.ok(files.length,'Supply explicit frozen candidate bundle paths');
let checks=0;const rows=[];
for(const supplied of files){
 const file=path.resolve(supplied),rawBundle=fs.readFileSync(file),api=require(file),settings={markup:true,links:true,categories:true,syntaxRepairs:true,structuralRepairs:true,tableChecks:true,automaticTableRepairs:true,tableSyntaxRepairs:true},
  cfg={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa fictícia',minorBaseConfirmed:true,...settings};
 for(const target of ["Tema d'exemplo",'Tema fictício'])for(const inner of ["''","'''"])for(const surrounded of [false,true])for(const eol of ['\n','\r\n']){
  const outer=surrounded?(inner.length===2?"'''":"''"):'',link=outer+'[['+target+'|'+inner+'Rótulo literal'+inner+']]'+outer,
   normalized=(outer?"'''''":inner)+'[['+target+'|Rótulo literal]]'+(outer?"'''''":inner),table=payload=>('{| class="wikitable"\n! Campo\n|-\n| '+payload+'\n|-\n|}\n').replace(/\n/g,eol),
   source=table(link),historicalExpected=table(normalized).replace('|-'+eol+'|}'+eol,'|}'+eol),
   expected=table(surrounded?link:normalized).replace('|-'+eol+'|}'+eol,'|}'+eol),result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
  assert.equal(result.text,expected,'Complete independent endpoint');checks++;
  assert.equal(result.text.includes(surrounded?link:normalized),true,'Link target, literal label and intended emphasis bytes');checks++;
  assert.equal(result.text.includes('|-'+eol+'|}'+eol),false,'Independent empty-row cleanup remains active');checks++;
  assert.equal(api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg}).text,expected,'One-action convergence');checks++;
  assert.deepEqual(result.preservation||[],[]);checks++;
  assert.deepEqual(api.preservationAudit(source,expected,cfg),[]);checks++;
  assert.equal(api.safeComposition(source,expected,cfg),'');checks++;
  assert.equal(api.v219AutomaticResultSafety(source,result).accepted,true);checks++;
  rows.push({bundleSha256:sha(rawBundle),sourceSha256:sha(source),historicalExpectedSha256:sha(historicalExpected),
   expectedSha256:sha(expected),actualSha256:sha(result.text),surrounded,eol:eol==='\n'?'LF':'CRLF',
   classification:surrounded?'intentional-conservative-preservation':'inherited-positive-normalization',status:'passed'});
 }
 assert.equal(sha(fs.readFileSync(file)),sha(rawBundle),'Runtime remains immutable');checks++;
}
console.log(JSON.stringify({kind:'current-conservative-apostrophe-boundary-adjudication',status:'passed',checks,cases:rows,
 historicalSuiteStatusUnchanged:true,changesHistoricalAssertions:false,wikipediaWrites:0}));
