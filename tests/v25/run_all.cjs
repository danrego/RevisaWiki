'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),output=process.env.REVISAWIKI_QA_OUTPUT||path.join(__dirname,'artifacts');
require('node:fs').mkdirSync(output,{recursive:true});
const scripts=process.env.REVISAWIKI_QA_SCRIPT?[path.resolve(process.env.REVISAWIKI_QA_SCRIPT)]:['RevisaWiki_v2_5.js','RevisaWiki_v2_5_completo.js'].map(name=>path.join(root,'dist/2.5.0',name));
for(const script of scripts)for(const [file,...args]of [['run_release_contracts.cjs'],['real_regression_contracts.cjs'],['formatter/contracts.cjs','--integrated'],['talk_preparation/contracts.cjs'],['composition_options/contracts.cjs']]){
 const result=spawnSync(process.execPath,[path.join(__dirname,file),script,...args],{stdio:'inherit',env:{...process.env,REVISAWIKI_QA_OUTPUT:output}});if(result.status!==0)process.exit(result.status||1);
}
