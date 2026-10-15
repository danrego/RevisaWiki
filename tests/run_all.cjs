'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const core=path.join(root,'dist/2.6.0/RevisaWiki_v2_6.js'),full=path.join(root,'dist/2.6.0/RevisaWiki_v2_6_completo.js');
function run(name,env={}){const r=spawnSync(process.execPath,[path.join(__dirname,name)],{cwd:root,env:{...process.env,...env},stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
run('check_release.cjs');run('v26_legacy_regressions.cjs');
for(const script of [core,full])for(const suite of ['v26_legacy/run_all.cjs','v26_gallery/run_all.cjs','v26_baseline/run_all.cjs'])run(suite,{REVISAWIKI_QA_SCRIPT:script});

run('run_additions_v26.cjs');
