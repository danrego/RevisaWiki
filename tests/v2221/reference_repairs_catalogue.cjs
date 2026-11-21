'use strict';
// Evidence distinguishes an accepted proposal from its editorial expectation.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {api,cfg,sha,baselineSha256,helperSha256}=require('./reference_repairs_harness.cjs').load();
const file=process.env.REVISAWIKI_REFERENCE_SCOPE;if(!file)throw Error('Frozen reference scope file required');
const scope=JSON.parse(fs.readFileSync(file,'utf8')),results=[];
const selected=x=>/^REFX-(?:BIND|STRUCT)-/.test(x.id)||/^REFX2-LEG-00[1-4]$/.test(x.id)||/^REFX4-STRUCT-00[3-5]$/.test(x.id)||['REFX3-LOCAL-008','REFX3-DATA-009','REFX5-IDENT-001'].includes(x.id);
const whitespace=s=>s.replace(/\s+/g,' ').trim();
global.fetch=()=>{throw Error('Network not allowed in catalogue evidence');};
for(const item of scope.catalogueItems.filter(selected)){
 const source=item.exampleBefore;if(typeof source!=='string')continue;
 const r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg}),safety=api.v219AutomaticResultSafety(source,r),plan=api.v2221ReferencePlan(source,cfg);
 assert.equal(safety.accepted,true,item.id+' source safety');assert.equal(api.v2221ReferenceProof(source,plan.text,plan,cfg),true,item.id+' lane proof');
 const expected=typeof item.exampleAfter==='string'?item.exampleAfter:null,literalExpected=!!expected&&(expected.includes('<ref')||expected.includes('{{'))&&!/^Preservar\b/.test(expected);
 const withoutAddedCollector=!expected||/\{\{(?:Referências|Notas)/.test(expected)?r.text:r.text.replace(/\n+\{\{Referências\}\}\s*$/,'');
 results.push({id:item.id,originalStatus:item.originalStatus,reviewDisposition:item.reviewDisposition,inputSha256:sha(source),outputSha256:sha(r.text),source,expected,output:r.text,laneOutput:plan.text,laneKinds:plan.steps.map(s=>s.kind),changed:r.text!==source,accepted:safety.accepted,safetyCode:safety.code,
  expectationKind:literalExpected?'literal':'conditional-or-narrative',exactExpected:literalExpected?r.text.trim()===expected.trim():null,expectedIgnoringWhitespace:literalExpected?whitespace(r.text)===whitespace(expected):null,expectedIgnoringWhitespaceAndAddedDefaultCollector:literalExpected?whitespace(withoutAddedCollector)===whitespace(expected):null});
}
const report={kind:'reference-catalogue-semantic-evidence-not-blanket-feature-certification',baselineSha256,helperSha256,scopeSha256:sha(fs.readFileSync(file,'utf8')),cases:results.length,results,networkRequests:0,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:results.length,exact:results.filter(r=>r.exactExpected).length,whitespaceAndCollectorMatch:results.filter(r=>r.expectedIgnoringWhitespaceAndAddedDefaultCollector).length,unmatchedLiteralExpectations:results.filter(r=>r.expectationKind==='literal'&&!r.expectedIgnoringWhitespaceAndAddedDefaultCollector).map(r=>r.id)}));
