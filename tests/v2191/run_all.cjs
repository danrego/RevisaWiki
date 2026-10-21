'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release_v2191.json')));
for(const[name,pin]of Object.entries(manifest.files)){const raw=fs.readFileSync(path.join(root,'dist/2.19.1',name));assert.equal(raw.length,pin.bytes);assert.equal(sha(raw),pin.sha256);}
const bundles=['RevisaWiki_v2_19_1.js','RevisaWiki_v2_19_1_completo.js'].map(name=>path.join(root,'dist/2.19.1',name));
const suites=['ui_context_serialization_cases.cjs','ui_context_safety_cases.cjs','ui_apply_safety_protocol_cases.cjs','tool_only_minor_cases.cjs','ui_presentation_cases.cjs'].map(name=>({file:'tests/v219/'+name,args:bundles}));
suites.push({file:'tests/v2191/demonstration_cases.cjs',args:[]});
const report={kind:'editor-context-hotfix-directed-regression',version:'2.19.1',status:'passed',checks:0,cases:0,suites:[],networkRequests:0,wikipediaWrites:0};
for(const suite of suites){const child=spawnSync(process.execPath,[path.join(root,suite.file),...suite.args],{encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(child.status,0,'Suite failed: '+suite.file);const data=JSON.parse(child.stdout);assert.equal(data.status,'passed');report.checks+=data.checks;report.cases+=data.cases.length;report.suites.push({file:suite.file,sha256:sha(fs.readFileSync(path.join(root,suite.file))),report:data});}
process.stdout.write(JSON.stringify(report,null,2)+'\n');
