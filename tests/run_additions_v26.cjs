'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),src=path.join(root,'src/v2_6');
const suites=['verified_rules/test_linked_names.cjs','verified_rules/test_spelling_additions.cjs','matriz/test_harvard_aliases.cjs','portals/test_portal_evidence.cjs','quiet_review/test_quiet_columns.cjs','fundo/test_fundo.cjs','baryons/test_prime_diagnostic.cjs'];
function run(file,args,env={}){const result=spawnSync(process.execPath,[file,...args],{cwd:root,env:{...process.env,...env},stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
for(const bundle of ['RevisaWiki_v2_6.js','RevisaWiki_v2_6_completo.js']){
 const file=path.join(root,'dist/2.6.0',bundle);
 for(const suite of suites){const target=path.join(root,'artifacts/v26_additions',bundle,path.basename(suite,'.cjs'));fs.mkdirSync(target,{recursive:true});run(path.join(src,suite),[],{REVISAWIKI_BUNDLE:file,REVISAWIKI_REPORT_DIR:target});}
 run(path.join(src,'inline/test_section_contracts.cjs'),[file]);
}
run(path.join(src,'inline/test_draft_preservation.cjs'),[path.join(src,'inline/inline_controller.js'),path.join(root,'dist/2.6.0/RevisaWiki_v2_6_completo.js')]);

run(path.join(src,'inline/test_read_launcher.cjs'),[path.join(src,'inline/read_launcher.js'),path.join(root,'dist/2.6.0/RevisaWiki_v2_6.js')]);
