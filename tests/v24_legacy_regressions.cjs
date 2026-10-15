'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),artifact=path.join(__dirname,'artifacts/v24_legacy');fs.mkdirSync(artifact,{recursive:true});
function run(args,env={}){const r=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,...env},stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
function runAmendedStructure(source,env){
 const proof=path.join(__dirname,'v24_legacy_expectation_amendments.json');
 const code="const fs=require('node:fs'),crypto=require('node:crypto'),Module=require('node:module');const file="+JSON.stringify(source)+",proof=require("+JSON.stringify(proof)+");let s=fs.readFileSync(file,'utf8');const sha=x=>crypto.createHash('sha256').update(x).digest('hex');if(sha(s)!==proof.sourceSha256)throw new Error('Historical source hash changed');for(const a of proof.amendments){if(s.split(a.before).length-1!==a.expectedOccurrences)throw new Error('Approved wording anchor changed');s=s.replace(a.before,a.after);}if(sha(s)!==proof.amendedSha256)throw new Error('Unexpected amended source hash');const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(s,file);";
 run(['--eval',code],env);
}
for(const name of ['RevisaWiki_v2_4.js','RevisaWiki_v2_4_completo.js']){
 const script=path.join(root,'dist/2.4.0',name);
 for(const suite of ['year_section_contracts.cjs','v22_contracts.cjs']){
  // Execute the historical assertions in memory with only the program path changed.
  const source=path.join(__dirname,suite);
  const code="const fs=require('node:fs'),Module=require('node:module');const file="+JSON.stringify(source)+";let s=fs.readFileSync(file,'utf8');const old='dist/2.3.0/RevisaWiki_v2_3.js';if(s.split(old).length!==2)throw new Error('Historical program-path anchor changed');s=s.replace(old,"+JSON.stringify('dist/2.4.0/'+name)+");const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(s,file);";
  run(['--eval',code]);
 }
 for(const [label,suite]of [['structure','run_contracts.cjs'],['punctuation','ref_punctuation/contracts.cjs'],['headers','reference_headers/contracts.cjs'],['columns','reference_columns/contracts.cjs']]){
  const source=path.join(__dirname,'v23_independent',suite),env={REVISAWIKI_QA_SCRIPT:script,REVISAWIKI_QA_REPORT:path.join(artifact,name+'_'+label+'.json')};
  if(label==='structure')runAmendedStructure(source,env);else run([source],env);
 }
}
