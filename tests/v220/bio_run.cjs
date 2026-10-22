'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),files=['RevisaWiki_v2_20_0_completo.js','RevisaWiki_v2_20_0.js'],suites=['bio_contracts.cjs','bio_generated.cjs','bio_whole_actions.cjs','bio_campaign.cjs','bio_counts.cjs','bio_footer_boundary.cjs','bio_website_owners.cjs','bio_category_owners.cjs','bio_citation_count.cjs','bio_image_consumers.cjs','bio_official_label_cases.cjs','bio_media_option_boundary.cjs'];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const boundSources=[...suites,'bio_run.cjs','bio_ui_preflight.cjs','bio_ui_fixture.js'].map(name=>({file:path.join(__dirname,name),sha256:sha(fs.readFileSync(path.join(__dirname,name)))}));
const report={suite:'v220-biography-media-portals',version:'2.20.0',createdUTC:new Date().toISOString(),status:'passed',distributions:[],uiFixture:{compiled:false,executed:false,reason:'Native browser execution is scheduled separately.'},wikipediaWrites:0};
for(const file of files){const full=path.join(process.env.REVISAWIKI_BUNDLE_DIR||path.join(root,'dist/2.20.0'),file),row={file,sha256:sha(fs.readFileSync(full)),bytes:fs.statSync(full).size,suites:[]};
 for(const test of suites){const target=path.join(__dirname,test),sourceSha256=sha(fs.readFileSync(target)),output=execFileSync(process.execPath,[target],{env:{...process.env,REVISAWIKI_BUNDLE:full},timeout:60000,encoding:'utf8'}).trim(),result=JSON.parse(output);if(sha(fs.readFileSync(target))!==sourceSha256)throw new Error('A suite source changed while it was running');if(result.status!=='passed')throw new Error('A suite did not pass');row.suites.push({...result,sourceSha256,sourceUnchanged:true});}
 report.distributions.push(row);
}
execFileSync(process.execPath,[path.join(__dirname,'bio_ui_preflight.cjs')],{env:{...process.env,REVISAWIKI_BIO_UI_COMPILE_ONLY:'1'},timeout:30000});
execFileSync(process.execPath,['--check',path.join(__dirname,'bio_ui_fixture.js')],{timeout:30000});report.uiFixture.compiled=true;
report.uiFixture.runnerSha256=sha(fs.readFileSync(path.join(__dirname,'bio_ui_preflight.cjs')));report.uiFixture.adapterSha256=sha(fs.readFileSync(path.join(__dirname,'bio_ui_fixture.js')));
for(const row of boundSources)if(sha(fs.readFileSync(row.file))!==row.sha256)throw new Error('A bound source changed during the biography campaign');
report.sourceIntegrity={allUnchanged:true,files:boundSources.map(row=>({file:path.basename(row.file),sha256:row.sha256}))};
if(process.argv[2])fs.writeFileSync(path.resolve(process.argv[2]),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
