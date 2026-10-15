const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const artifacts=path.join(__dirname,'v23_independent/artifacts');fs.mkdirSync(artifacts,{recursive:true});
const suites=[['structure','run_contracts.cjs'],['punctuation','ref_punctuation/contracts.cjs'],['headers','reference_headers/contracts.cjs'],['columns','reference_columns/contracts.cjs']];
for(const name of ['RevisaWiki_v2_3.js','RevisaWiki_v2_3_completo.js'])for(const [label,runner] of suites){const r=spawnSync(process.execPath,[path.join(__dirname,'v23_independent',runner)],{env:{...process.env,REVISAWIKI_QA_SCRIPT:path.join(__dirname,'../dist/2.3.0',name),REVISAWIKI_QA_REPORT:path.join(artifacts,name+'_'+label+'.json')},stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
