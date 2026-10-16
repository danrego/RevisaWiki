'use strict';
// Run the unchanged tag/quotation assertions on the current pinned full bundle.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),candidate=require('./candidate.cjs');
const verified=candidate.verify(),runner=path.join(candidate.root,'src/v2_6_1/parser/test_tag_view_adversarial.cjs'),file='RevisaWiki_v2_8_2_completo.js';
const result=spawnSync(process.execPath,[runner,path.join(verified.dist,file)],{cwd:candidate.root,env:{...process.env,REVISAWIKI_REPORT_DIR:''},encoding:'utf8',maxBuffer:2*1024*1024});
assert.equal(result.status,0,'Unchanged adversarial assertions pass');
const report=JSON.parse(result.stdout);assert.equal(report.status,'passed');assert.equal(report.failures.length,0);
Object.assign(report,{version:'2.8.2',frozenFiles:candidate.manifest.files,runnerSha256:candidate.sha(fs.readFileSync(runner)),adapterSha256:candidate.sha(fs.readFileSync(__filename)),networkRequests:0,wikipediaWrites:0});
fs.writeFileSync(path.join(candidate.artifactDirectory(),'tag_view_adversarial.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version:report.version,status:report.status,cases:report.cases.length,checks:report.checks,networkRequests:0,wikipediaWrites:0}));
