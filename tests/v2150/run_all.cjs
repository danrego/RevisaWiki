'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),raw=fs.readFileSync(path.join(root,'tests/expected_release_v2150.json')),manifest=JSON.parse(raw),pin=crypto.createHash('sha256').update(raw).digest('hex');
assert.equal(manifest.version,'2.15.0');
for(const [name,proof]of Object.entries(manifest.files)){const bytes=fs.readFileSync(path.join(root,'dist/2.15.0',name));assert.equal(bytes.length,proof.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),proof.sha256);}
const args=process.argv.slice(2);assert(args.length<=1&&args.every(arg=>['--focused','--complex','--large','--inherited'].includes(arg)));
const report=process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2150/reproduction-'+Date.now(),env={...process.env,REVISAWIKI_REPORT_DIR:report};
function run(script,argv=[],extra={}){const p=spawnSync(process.execPath,[script,...argv],{cwd:root,env:{...env,...extra},stdio:'inherit'});if(p.status!==0)process.exit(p.status||1);}
const inherited=stage=>run('scripts/run_inherited_v2150.cjs',['--stage='+stage,'--final-pin='+pin,'--report-dir='+report,...(stage==='large'?['--corpus-pin=0f213292c4fcfd2c68df1c0d363946848e82a2d8457e2f47d14179ffede23256','--run=reproduction']:[])]);
if(args[0]==='--complex')inherited('complex');
else if(args[0]==='--large')inherited('large');
else{
 if(args[0]!=='--focused')inherited('main');
 if(args[0]!=='--inherited'){
  for(const suffix of ['','_completo']){
   const mode=suffix?'complete':'modular',bundle=path.join(root,'dist/2.15.0','RevisaWiki_v2_15_0'+suffix+'.js'),out=path.join(report,mode);
   for(const name of ['reader_test','reader_native','template_test','style_test','identity_boundary','reader_independent'])run('tests/v2150/'+name+'.cjs',[],{REVISAWIKI_SCRIPT:bundle,REVISAWIKI_REPORT_DIR:out,REVISAWIKI_REPORT:path.join(root,out,name+'.json')});
  }
  for(const name of ['quote_alignment','prose_spacing','quote_native','spacing_native','nsrw_native_test','spacing_independent'])run('tests/v2150/previous_release.cjs',[name],{REVISAWIKI_REPORT_DIR:path.join(report,'previous-focused')});
  for(const mode of ['modular','complete'])for(const name of ['nsrw_test','drug_fields','drug_import_fields','drug_composition_case','drug_native_test','ui_report'])run('tests/v2150/previous_release.cjs',[name],{REVISAWIKI_SCRIPT:path.join(root,'dist/2.15.0','RevisaWiki_v2_15_0'+(mode==='complete'?'_completo':'')+'.js'),REVISAWIKI_REPORT_DIR:path.join(report,'previous-focused',mode)});
 }
}
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'tests/expected_release_v2150.json'))).digest('hex'),pin,'Tests do not change the final distribution');
