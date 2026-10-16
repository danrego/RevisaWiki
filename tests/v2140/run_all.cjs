'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),bytes=fs.readFileSync(path.join(root,'tests/expected_release_v2140.json')),manifest=JSON.parse(bytes),pin=crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.version,'2.14.0');
for(const [name,proof]of Object.entries(manifest.files)){const content=fs.readFileSync(path.join(root,'dist/2.14.0',name));assert.equal(content.length,proof.bytes);assert.equal(crypto.createHash('sha256').update(content).digest('hex'),proof.sha256);}
const args=process.argv.slice(2);assert(args.every(arg=>['--focused','--complex','--large','--inherited'].includes(arg)));assert(args.length<=1);
const report=process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2140/reproduction-'+Date.now(),env={...process.env,REVISAWIKI_REPORT_DIR:report};
function run(script,argv=[],scope={}){const result=spawnSync(process.execPath,[script,...argv],{cwd:root,env:{...env,...scope},stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
const inherited=stage=>run('scripts/run_inherited_v2140.cjs',['--stage='+stage,'--final-pin='+pin,'--report-dir='+report,...(stage==='large'?['--corpus-pin=0f213292c4fcfd2c68df1c0d363946848e82a2d8457e2f47d14179ffede23256','--run=reproduction']:[])]);
if(args[0]==='--complex')inherited('complex');
else if(args[0]==='--large')inherited('large');
else{
 if(args[0]!=='--focused')inherited('main');
 if(args[0]!=='--inherited'){
  for(const name of ['quote_alignment','prose_spacing','quote_native','spacing_native','nsrw_native_test'])run('tests/v2140/'+name+'.cjs');
  for(const bundle of ['RevisaWiki_v2_14_0.js','RevisaWiki_v2_14_0_completo.js'])for(const name of ['nsrw_test','drug_fields','drug_import_fields','drug_composition_case','drug_native_test','ui_report']){
   const suffix=bundle.includes('_completo')?'complete':'modular';run('tests/v2140/'+name+'.cjs',[],{REVISAWIKI_SCRIPT:path.join(root,'dist/2.14.0',bundle),REVISAWIKI_REPORT_DIR:path.join(report,suffix)});
  }
  if(fs.existsSync(path.join(__dirname,'spacing_independent.cjs')))run('tests/v2140/spacing_independent.cjs');
 }
}
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'tests/expected_release_v2140.json'))).digest('hex'),pin,'The release manifest remains unchanged');
