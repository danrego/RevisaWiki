const path=require('path'),{spawnSync}=require('child_process');
for(const name of ['check_release.cjs','year_section_contracts.cjs','v22_contracts.cjs','v23_both_distributions.cjs']){const r=spawnSync(process.execPath,[path.join(__dirname,name)],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
