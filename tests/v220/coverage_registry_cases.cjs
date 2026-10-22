'use strict';
// Trace the approved scope without treating a catalogue entry as an execution.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const report={kind:'approved-decision-coverage-registry',status:'passed',checks:0,files:[],releasedAutomationClaim:false,networkRequests:0,wikipediaWrites:0};
const read=name=>{const file=path.join(__dirname,name),raw=fs.readFileSync(file);report.files.push({file:'tests/v220/'+name,sha256:sha(raw)});return JSON.parse(raw);};
const expected=read('approved_decision_ids.json'),bio=read('bio_coverage.json'),citations=read('citation_coverage.json'),structure=read('structure_coverage.json'),cross=read('crosscutting_coverage.json');
const check=(value,message)=>{report.checks++;assert(value,message);};
const rows=[...bio.proposals.map(row=>({...row,id:row.proposalId})),...citations.cards,...structure.cards,...cross.cards];
check(expected.length===52&&new Set(expected).size===52,'The approval inventory contains exactly fifty-two distinct decisions');
check(rows.length===52&&new Set(rows.map(row=>row.id)).size===52,'Each decision has exactly one coverage record');
check(JSON.stringify(rows.map(row=>row.id).sort())===JSON.stringify(expected),'No approved decision is omitted or replaced');
const withheld=new Set(['legacy-center-elements','legacy-font-elements','legacy-big-elements']);
for(const row of rows){
 check(Array.isArray(row.conditions)&&(withheld.has(row.id)?row.conditions.length===0:row.conditions.length>0),'Active conditions or explicit withdrawal are recorded: '+row.id);
 check(Array.isArray(row.limits)&&row.limits.length>0,'Limitations are explicit: '+row.id);
 check(Array.isArray(row.suites)&&row.suites.length>0,'Each decision has declared tests: '+row.id);
 for(const supplied of row.suites){const relative=supplied.startsWith('tests/')?supplied:'tests/v220/'+supplied;
  check(!relative.includes('..')&&fs.existsSync(path.join(root,relative)),'Declared test file exists: '+relative);}
 if(withheld.has(row.id))check(Array.isArray(row.entryPoints)&&row.entryPoints.length===0,'The withdrawn HTML study has no active new writer');
}
check(cross.cards.length===2,'The two crosscutting contracts are not counted as separate content writers');
report.approvedDecisions=rows.length;report.withheldHtmlStudies=withheld.size;report.otherRepairOrPreservationDecisions=rows.length-withheld.size;
console.log(JSON.stringify(report,null,2));
