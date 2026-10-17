'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),manifestFile=path.join(root,'tests/expected_release_v2151.json'),raw=fs.readFileSync(manifestFile),manifest=JSON.parse(raw),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
assert.equal(manifest.version,'2.15.1');for(const [name,pin]of Object.entries(manifest.files)){const data=fs.readFileSync(path.join(root,'dist/2.15.1',name));assert.equal(data.length,pin.bytes);assert.equal(sha(data),pin.sha256);}
const focused=process.argv.includes('--focused'),previousOnly=process.argv.includes('--previous-only'),report=process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2151/final';
function run(file,args=[],environment={}){const result=spawnSync(process.execPath,[file,...args],{cwd:root,env:{...process.env,...environment},stdio:'inherit'});assert.equal(result.status,0,file+' completed successfully');}
for(const suffix of ['','_completo']){
 const mode=suffix?'complete':'modular',bundle=path.join(root,'dist/2.15.1/RevisaWiki_v2_15_1'+suffix+'.js'),folder=path.join(report,mode),environment={REVISAWIKI_SCRIPT:bundle,REVISAWIKI_REPORT_DIR:folder};
 if(!previousOnly)for(const suite of ['infobox_order_cases','field_syntax_cases','image_alt_cases','biography_lead_cases','retained_count_cases','independent_cases','adversarial_release','safeguard_cases','native_image_cases']) {
  if(!fs.existsSync(path.join(root,'tests/v2151/'+suite+'.cjs')))continue;
  run('tests/v2151/'+suite+'.cjs',[],{...environment,REVISAWIKI_REPORT:path.join(folder,suite+'.json')});
 }
 if(!focused){
  for(const suite of ['reader_test','reader_native','reader_independent','template_test','style_test','identity_boundary'])run('tests/v2151/previous.cjs',[suite],{...environment,REVISAWIKI_REPORT_DIR:path.join(folder,suite),REVISAWIKI_REPORT:path.join(folder,suite,'result.json')});
  for(const suite of ['quote_alignment','prose_spacing','quote_native','spacing_native','nsrw_test','drug_fields','drug_import_fields','drug_composition_case','ui_report','spacing_independent'])run('tests/v2151/previous.cjs',['previous_release',suite],{...environment,REVISAWIKI_REPORT_DIR:path.join(folder,suite),REVISAWIKI_REPORT:path.join(folder,suite,'result.json')});
 }
}
assert.equal(sha(fs.readFileSync(manifestFile)),sha(raw),'Tests preserve the frozen runtime manifest');

if(!previousOnly)for(const suite of ['image_contract_audit','contract_composition'])run('tests/v2151/'+suite+'.cjs');
