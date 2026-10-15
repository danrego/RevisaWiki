'use strict';
const path=require('node:path'),fs=require('node:fs'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'tests/artifacts/v25_inherited');fs.mkdirSync(out,{recursive:true});
const proof=require('./PROVENANCE.json');for(const s of proof.suites){const r=cp.spawnSync(process.execPath,[path.join(__dirname,s.name+'.cjs')],{cwd:root,env:{...process.env,REVISAWIKI_SCRIPT:path.join(root,'dist/2.5.0/RevisaWiki_v2_5.js'),REVISAWIKI_EXPECTED_VERSION:'2.5.0',REVISAWIKI_FILE_VERSION:'v2_5',REVISAWIKI_OUTDIR:out},stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
