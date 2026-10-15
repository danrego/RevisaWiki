'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),candidate=require('./candidate.cjs');
candidate.verify();
const directory=candidate.artifactDirectory(),files=['startup.json','focused_candidate.json','contracts.json','integration.json','composition-options.json','quote-lexer.json','corpus-regressions.json'];
const manifestFile=path.join(candidate.root,'tests/expected_release_v261_hotfix_1.json');
const totals={version:candidate.manifest.version,runtimeVersion:candidate.manifest.runtimeVersion,kind:'hotfix-offline-qa-summary',manifestSha256:candidate.sha(fs.readFileSync(manifestFile)),frozenFiles:candidate.manifest.files,cases:0,checks:0,failed:0,reports:[],networkRequests:0,wikipediaWrites:0};
for(const name of files){
 const bytes=fs.readFileSync(path.join(directory,name)),report=JSON.parse(bytes),cases=report.cases.length;
 assert.equal(report.status,'passed',name+' passed');
 assert.equal(report.failures?.length||report.failed||0,0,name+' no failures');
 if(report.frozenFiles)assert.deepEqual(report.frozenFiles,candidate.manifest.files,name+' exact seven-file manifest');
 if(name==='focused_candidate.json')for(const bundle of report.bundles){assert.equal(bundle.version,candidate.manifest.runtimeVersion);assert.equal(bundle.sha256,candidate.manifest.files[bundle.file].sha256);}
 totals.cases+=cases;totals.checks+=report.checks;
 totals.reports.push({file:name,sha256:candidate.sha(bytes),cases,checks:report.checks,status:'passed'});
}
const adapterBytes=fs.readFileSync(path.join(directory,'engine_adapter.json')),adapter=JSON.parse(adapterBytes);
assert.deepEqual(adapter.frozenFiles,candidate.manifest.files,'Inherited adapter exact manifest');assert.equal(adapter.complex,false,'Scoped engine adapter');
assert.equal(adapter.results.length,5,'All five unchanged engine runners finished');assert(adapter.results.every(result=>result.exitCode===0),'Every inherited runner passed');
for(const entry of adapter.originalAssertionFiles)assert.equal(candidate.sha(fs.readFileSync(path.join(candidate.root,entry.file))),entry.sha256,'Original assertion bytes remain unchanged');
totals.adapter={file:'engine_adapter.json',sha256:candidate.sha(adapterBytes),assertionFiles:adapter.originalAssertionFiles.length};
totals.runnerFiles=fs.readdirSync(__dirname).filter(name=>name.endsWith('.cjs')).sort().map(name=>({file:'tests/v261/hotfix/'+name,sha256:candidate.sha(fs.readFileSync(path.join(__dirname,name)))}));
totals.scope='Fresh installation, focused regressions and five unchanged engine suites. Historical 2.6.1 reports, native-browser results and duplicate helper smoke checks are excluded from these totals.';
totals.status='passed';fs.writeFileSync(path.join(directory,'OFFLINE_QA_SUMMARY.json'),JSON.stringify(totals,null,2)+'\n');console.log(JSON.stringify({version:totals.version,status:totals.status,cases:totals.cases,checks:totals.checks,failed:0,reports:files.length,networkRequests:0,wikipediaWrites:0}));
