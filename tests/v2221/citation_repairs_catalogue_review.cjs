'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {load,cfg}=require('./harness.cjs'),api=process.env.REVISAWIKI_CURRENT_CORE?require(path.resolve(process.env.REVISAWIKI_CURRENT_CORE)):load(['citation_repairs']),options={...api.defaults,...cfg};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),scope=JSON.parse(fs.readFileSync(process.env.REVISAWIKI_REFERENCE_SCOPE,'utf8')),coverage=JSON.parse(fs.readFileSync(process.env.REVISAWIKI_REFERENCE_COVERAGE,'utf8')),ids=new Set(coverage.rows.filter(r=>!r.laneRelevant).map(r=>r.id)),results=[];
global.fetch=()=>{throw Error('No network in local catalogue review');};
const compare=s=>s.replace(/\{\{[Cc]itar(?=\s)/g,'{{Citar').replace(/\s+/g,' ').trim();
for(const item of scope.catalogueItems.filter(r=>ids.has(r.id))){
 const source=item.exampleBefore;if(typeof source!=='string')continue;
 const result=api.calculate({kind:'adjust',source,originalSource:source,options}),expected=typeof item.exampleAfter==='string'?item.exampleAfter:null,literalExpected=!!expected&&(expected.includes('{{')||expected.includes('<ref'))&&!/^Preservar\b/.test(expected);
 const comparableOutput=!expected||/\{\{(?:Referências|Notas)/.test(expected)?result.text:result.text.replace(/\n+\{\{Referências\}\}\s*$/,'');
 results.push({id:item.id,title:item.title,originalStatus:item.originalStatus,originalDisposition:item.reviewDisposition,source,expected,output:result.text,inputSha256:sha(source),outputSha256:sha(result.text),changed:result.text!==source,safety:api.v219AutomaticResultSafety(source,result),literalExpected,exactExpected:literalExpected?result.text.trim()===expected.trim():null,expectationMatchesFormattingOnly:literalExpected?compare(comparableOutput)===compare(expected):null});
}
const report={kind:'citation-catalogue-semantic-observations-not-feature-certification',engineVersion:api.version,explicitCoreSha256:process.env.REVISAWIKI_CURRENT_CORE?sha(fs.readFileSync(process.env.REVISAWIKI_CURRENT_CORE,'utf8')):null,cases:results.length,results,networkRequests:0,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:results.length,unsafe:results.filter(r=>!r.safety.accepted).map(r=>r.id),exact:results.filter(r=>r.exactExpected).length,matching:results.filter(r=>r.expectationMatchesFormattingOnly).length,unmatched:results.filter(r=>r.literalExpected&&!r.expectationMatchesFormattingOnly).map(r=>r.id)}));
