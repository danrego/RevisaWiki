'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const raw=fs.readFileSync(path.join(root,'tests/expected_release_v2180.json')),manifest=JSON.parse(raw),manifestSha=sha(raw);
const out=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2180/final'));
fs.mkdirSync(out,{recursive:true});assert.equal(manifest.version,'2.18.0');
function pins(){for(const [name,pin]of Object.entries(manifest.files)){const value=fs.readFileSync(path.join(root,'dist/2.18.0',name));assert.equal(value.length,pin.bytes);assert.equal(sha(value),pin.sha256);}}
for(const name of ['REVISAWIKI_PROSE_GAP_TEST_LOADER','REVISAWIKI_HELPER_PATH'])assert(!process.env[name],'A frozen release run cannot use a helper loader');
pins();const record={version:'2.18.0',kind:'frozen-finite-release-execution',status:'running',releaseManifestSha256:manifestSha,frozenFiles:manifest.files,runs:[],wikipediaWrites:0};
const save=()=>fs.writeFileSync(path.join(out,'execution.json'),JSON.stringify(record,null,2)+'\n');save();
function run(suite,args,folder,environment={},expectedBundles=[]){
 const file=path.join(root,suite),sourceSha=sha(fs.readFileSync(file)),directory=path.join(out,folder);fs.mkdirSync(directory,{recursive:true});
 const env={...process.env,...environment,REVISAWIKI_REPORT_DIR:directory,REVISAWIKI_REPORT:path.join(directory,'result.json')};
 if(expectedBundles.length===2&&!Object.hasOwn(environment,'REVISAWIKI_SCRIPT'))delete env.REVISAWIKI_SCRIPT;
 const result=cp.spawnSync(process.execPath,[file,...args],{cwd:root,env,encoding:'utf8',maxBuffer:100*1024*1024});
 fs.writeFileSync(path.join(directory,'PRIVATE_STDOUT.log'),result.stdout||'');fs.writeFileSync(path.join(directory,'PRIVATE_STDERR.log'),result.stderr||'');
 const row={suite,runnerSha256:sourceSha,args:args.map(value=>value.startsWith(root+path.sep)?path.relative(root,value):value),status:result.status===0&&!result.error?'passed':'failed',exitCode:result.status,bundles:expectedBundles.map(name=>({file:name,...manifest.files[name]})),outputSha256:sha(result.stdout||''),sourceUnchanged:sha(fs.readFileSync(file))===sourceSha};
 assert(row.sourceUnchanged);pins();
 if(result.status===0){try{const parsed=JSON.parse(result.stdout);assert(!parsed.failures?.length);assert(parsed.status===undefined||parsed.status==='passed');row.result=parsed;}catch(error){if(fs.existsSync(path.join(directory,'result.json'))){row.result=JSON.parse(fs.readFileSync(path.join(directory,'result.json')));assert(!row.result.failures?.length);assert(!row.result.failed);assert(row.result.status===undefined||row.result.status==='passed');}else if(suite!=='tests/v218/previous.cjs')throw error;}}
 if(row.result){assert(row.result.helperOnly!==true,'A helper-only result is not final pipeline QA');for(const item of row.result.bundles||[])assert(item.helperInjected!==true&&item.helperPreview!==true&&item.injectedHelper!==true,'The published runtime must supply every tested helper');}
 if(row.result)fs.writeFileSync(path.join(directory,'bound_result.json'),JSON.stringify({...row.result,execution:{suite,runnerSha256:sourceSha,releaseManifestSha256:manifestSha,bundles:row.bundles,sourceUnchanged:true}},null,2)+'\n');
 record.runs.push(row);save();process.stdout.write(JSON.stringify({suite,folder,status:row.status})+'\n');
}
const both=['RevisaWiki_v2_18_0.js','RevisaWiki_v2_18_0_completo.js'];
if(!process.argv.includes('--previous-only')){
 for(const suite of ['prose_gap_cases','reference_layout_cases','citation_island_cases'])run('tests/v218/'+suite+'.cjs',both.map(name=>path.join(root,'dist/2.18.0',name)),suite,{},both);
 const extras=process.argv.slice(2).filter(value=>value.startsWith('--extra=')).map(value=>value.slice('--extra='.length));
 assert.equal(new Set(extras).size,extras.length,'An extra suite may be selected only once');
 for(const name of extras){assert.match(name,/^[a-z][a-z0-9_]*\.cjs$/,'An explicit extra suite must be a local tests/v218 filename');assert(!['prose_gap_cases.cjs','reference_layout_cases.cjs','citation_island_cases.cjs','run_all.cjs','previous.cjs'].includes(name),'Extra suite duplicates an existing run or runner');run('tests/v218/'+name,both.map(name=>path.join(root,'dist/2.18.0',name)),name.slice(0,-4),{},both);}
}
if(!process.argv.includes('--focused'))for(const [index,mode]of ['modular','complete'].entries()){
 const env={REVISAWIKI_SCRIPT:path.join(root,'dist/2.18.0',both[index])};
 if(index===0)for(const suite of ['reference_table_cases','infobox_cases','independent_cases'])run('tests/v218/previous.cjs',['v217',suite], 'v217-'+suite,{},both);
 run('tests/v218/previous.cjs',['v217','alert_cases'],mode+'/v217-alerts',{...env,REVISAWIKI_BASELINE_SCRIPT:path.join(root,'dist/2.16.0/RevisaWiki_v2_16_0_completo.js')},[both[index]]);
 for(const suite of ['transfer_cases','field_value_cases','integration_cases','independent_cases','release_adversarial'])run('tests/v218/previous.cjs',['v216',suite],mode+'/v216-'+suite,env,[both[index]]);
 for(const suite of ['infobox_order_cases','field_syntax_cases','image_alt_cases','biography_lead_cases','retained_count_cases','independent_cases','adversarial_release','safeguard_cases','native_image_cases'])run('tests/v218/previous.cjs',[suite],mode+'/previous-'+suite,env,[both[index]]);
 for(const suite of ['reader_test','reader_native','reader_independent','template_test','style_test','identity_boundary'])run('tests/v218/previous.cjs',[suite],mode+'/'+suite,env,[both[index]]);
 for(const suite of ['quote_alignment','prose_spacing','quote_native','spacing_native','nsrw_test','drug_fields','drug_import_fields','drug_composition_case','ui_report','spacing_independent'])run('tests/v218/previous.cjs',['previous_release',suite],mode+'/'+suite,env,[both[index]]);
}
pins();assert.equal(sha(fs.readFileSync(path.join(root,'tests/expected_release_v2180.json'))),manifestSha);
record.status=record.runs.every(row=>row.status==='passed')?'passed':'failed';save();if(record.status!=='passed')process.exitCode=1;
