const path=require('node:path'),{spawnSync}=require('node:child_process');
for(const name of ['check_release.cjs','v24_legacy_regressions.cjs','v24/run_all.cjs','v24_gallery/run_all.cjs']){const r=spawnSync(process.execPath,[path.join(__dirname,name)],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
