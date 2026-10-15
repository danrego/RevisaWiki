'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const core=path.join(root,'dist/2.5.0/RevisaWiki_v2_5.js'),full=path.join(root,'dist/2.5.0/RevisaWiki_v2_5_completo.js');
function run(name,env={}){const r=spawnSync(process.execPath,[path.join(__dirname,name)],{cwd:root,env:{...process.env,...env},stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
run('check_release.cjs');run('v25_legacy_regressions.cjs');
for(const script of [core,full])for(const suite of ['v25_legacy/run_all.cjs','v25_gallery/run_all.cjs','v25/run_all.cjs'])run(suite,{REVISAWIKI_QA_SCRIPT:script});
