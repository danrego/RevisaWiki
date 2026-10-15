'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),candidate=require('./candidate.cjs');
candidate.verify();
const directory=candidate.artifactDirectory();
const names=['startup.json','no_section_buttons.json','focused_candidate.json','quote_boundaries.json','quotes.json','tag_view_adversarial.json','safe_automation.json','diff_reporting.json','chat_residues.json','chat_permutations.json','contracts.json','integration.json','composition-options.json','quote-lexer.json','corpus-regressions.json'];
const report={version:'2.7.0',kind:'release-offline-qa-summary',frozenFiles:candidate.manifest.files,cases:0,checks:0,failed:0,reports:[],networkRequests:0,wikipediaWrites:0};
for(const name of names){
 const raw=fs.readFileSync(path.join(directory,name)),value=JSON.parse(raw);
 assert.equal(value.status,'passed',name+' passed');
 assert.equal(value.failures?.length||value.failed||0,0,name+' no failures');
 if(value.frozenFiles)assert.deepEqual(value.frozenFiles,candidate.manifest.files,name+' executable pins');
 for(const bundle of value.bundles||[]){assert.equal(bundle.version,'2.7.0');assert.equal(bundle.sha256,candidate.manifest.files[bundle.file].sha256);}
 const cases=Array.isArray(value.cases)?value.cases.length:value.cases;
 assert.equal(typeof cases,'number',name+' explicit case count');assert.equal(typeof value.checks,'number',name+' explicit check count');
 report.cases+=cases;report.checks+=value.checks;report.reports.push({file:name,sha256:candidate.sha(raw),cases,checks:value.checks,status:'passed'});
}
const adapter=JSON.parse(fs.readFileSync(path.join(directory,'engine_adapter.json'),'utf8'));
assert.deepEqual(adapter.frozenFiles,candidate.manifest.files);
assert.equal(adapter.results.length,5);assert(adapter.results.every(row=>row.exitCode===0));
for(const file of adapter.originalAssertionFiles)assert.equal(candidate.sha(fs.readFileSync(path.join(candidate.root,file.file))),file.sha256,'Inherited assertions unchanged');
report.status='passed';report.scope='Fresh execution on pinned 2.7.0 files. Large-article, native-browser, grammar, documentation and privacy checks have separate reports.';
fs.writeFileSync(path.join(directory,'OFFLINE_QA_SUMMARY.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version:report.version,status:report.status,cases:report.cases,checks:report.checks,reports:names.length,wikipediaWrites:0}));
