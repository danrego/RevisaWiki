'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),artifacts=path.join(__dirname,'artifacts');fs.mkdirSync(artifacts,{recursive:true});
const scripts=process.env.REVISAWIKI_QA_SCRIPT?[path.resolve(process.env.REVISAWIKI_QA_SCRIPT)]:['RevisaWiki_v2_4.js','RevisaWiki_v2_4_completo.js'].map(n=>path.join(root,'dist/2.4.0',n));
for(const script of scripts){const report=path.join(artifacts,path.basename(script)+'.json');const r=spawnSync(process.execPath,[path.join(__dirname,'contracts.cjs')],{stdio:'inherit',env:{...process.env,REVISAWIKI_QA_SCRIPT:script,REVISAWIKI_QA_REPORT:report}});if(r.status!==0)process.exit(r.status||1);}
