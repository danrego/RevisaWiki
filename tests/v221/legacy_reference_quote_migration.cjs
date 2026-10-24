'use strict';
// Additional source-bound quoting is checked independently; old bare-attribute
// expectations and their recorded failures are kept unchanged.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
let checks=0;const rows=[];assert(process.argv.length>2,'Supply explicit frozen candidate bundles');
for(const supplied of process.argv.slice(2)){
 const file=path.resolve(supplied),raw=fs.readFileSync(file),api=require(file),cfg={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',markup:true,syntaxRepairs:true,structuralRepairs:true,references:true,automaticReferenceRepairs:true};
 for(const count of [2,3,7])for(const eol of ['\n','\r\n']){
  const source='Texto.<ref'+' group=fonte'.repeat(count)+'>Fonte literal.</ref>'+eol+'{{Referências|grupo=fonte}}',
   expected='Texto.<ref group="fonte">Fonte literal.</ref>'+eol+'{{Referências|grupo=fonte}}',
   oldExpected='Texto.<ref group=fonte>Fonte literal.</ref>'+eol+'{{Referências|grupo=fonte}}',result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
  assert.equal(result.text,expected);checks++;
  assert.deepEqual(result.preservation||[],[]);checks++;
  assert.deepEqual(api.preservationAudit(source,expected,cfg),[]);checks++;
  assert.equal(api.safeComposition(source,expected,cfg),'');checks++;
  assert.equal(api.v219AutomaticResultSafety(source,result).accepted,true);checks++;
  assert.equal(api.calculate({kind:'adjust',source:expected,originalSource:expected,options:cfg}).text,expected);checks++;
  rows.push({bundleSha256:sha(raw),sourceSha256:sha(source),historicalExpectedSha256:sha(oldExpected),currentExpectedSha256:sha(expected),
   actualSha256:sha(result.text),classification:'resolved-current-rule-migration',count,eol:eol==='\n'?'LF':'CRLF',status:'passed'});
 }
 assert.equal(sha(fs.readFileSync(file)),sha(raw));checks++;
}
console.log(JSON.stringify({kind:'current-group-attribute-quoting-adjudication',status:'passed',checks,cases:rows,
 historicalSuiteStatusUnchanged:true,changesHistoricalAssertions:false,networkRequests:0,wikipediaWrites:0}));
