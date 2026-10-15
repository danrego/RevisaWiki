'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir=__dirname,script=path.resolve(process.argv[2]||process.env.REVISAWIKI_QA_SCRIPT||path.join(dir,'../../../dist/2.5.0/RevisaWiki_v2_5_completo.js')),
 api=require(script),fixtures=JSON.parse(fs.readFileSync(path.join(dir,'fixtures.json'),'utf8')),rows=[];
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');let checks=0;
const eq=(a,b,message)=>{checks++;assert.deepEqual(a,b,message)},ok=(value,message)=>{checks++;assert(value,message)};
function test(name,fn){const start=checks;try{fn();rows.push({name,passed:true,checks:checks-start})}catch(error){rows.push({name,passed:false,checks:checks-start,message:error.message})}}
for(const fixture of fixtures.cases)test(fixture.name,()=>{
 const cfg={namespaceNumber:0,infoboxes:true,markup:true,contentModel:'wikitext',...fixture.options},plan=api.v25InfoboxAlignmentPlan(fixture.source,cfg);
 eq(plan.text,fixture.expected,'frozen independent expected spacing');
 eq(api.v25InfoboxAlignmentPlan(plan.text,cfg).text,plan.text,'second click stable');
 eq(plan.text.replace(/[ \t]+=/g,'='),fixture.source.replace(/[ \t]+=/g,'='),'all non-padding bytes retained');
 ok(plan.edits.every(edit=>/^[ \t]*$/.test(fixture.source.slice(edit.start,edit.end))&&/^ +$/.test(edit.text)),'each edit changes only horizontal padding');
 ok(api.v25InfoboxAlignmentSourceProof(fixture.source,plan.text,cfg).accepted,'exact source-bound result accepted');
 if(plan.text!==fixture.source){
  const mutated=plan.text.replace(/=(?![\s\S]*?\}\}[\s\S]*?\{\{)/,'=CHANGED ');
  ok(mutated!==plan.text&&!api.v25InfoboxAlignmentSourceProof(fixture.source,mutated,cfg).accepted,'changed field value cannot borrow spacing proof');
  let count=0;eq(api.automaticInfoboxAlignment(fixture.source,cfg,()=>count++),fixture.expected,'automatic helper matches planned result');eq(count,plan.boxes.length,'one report counter per box');
 }
});
const tatiOld=fs.readFileSync(path.join(dir,'tati_old_full.wiki'),'utf8'),tatiNew=fs.readFileSync(path.join(dir,'tati_new_full.wiki'),'utf8'),oldBox=fs.readFileSync(path.join(dir,'tati_old_infobox.wiki'),'utf8'),newBox=fs.readFileSync(path.join(dir,'tati_new_infobox.wiki'),'utf8'),expectedBox=fs.readFileSync(path.join(dir,'tati_old_infobox_expected.wiki'),'utf8');
test('Tati complete original article preserves remainder',()=>{eq(sha(tatiOld),fixtures.publicSource.oldSourceSha256,'frozen old source');const p=api.v25InfoboxAlignmentPlan(tatiOld,{namespaceNumber:0});eq(p.text,expectedBox+tatiOld.slice(oldBox.length),'only independently aligned first box changes');eq(p.text.slice(expectedBox.length),tatiOld.slice(oldBox.length),'complete remainder byte-for-byte');ok(!p.text.slice(0,expectedBox.length).includes('|cônjuge'),'no unrelated biography addition from later editor');});
test('Tati complete latest article already aligned',()=>{eq(sha(tatiNew),fixtures.publicSource.newSourceSha256,'frozen latest source');eq(api.v25InfoboxAlignmentPlan(tatiNew,{namespaceNumber:0}).text,tatiNew,'entire latest source unchanged');eq(newBox,fs.readFileSync(path.join(dir,'tati_new_infobox.wiki'),'utf8'),'no fixture rewrite');});
if(process.argv.includes('--integrated')){
 const source=fixtures.cases.find(f=>f.name==='simple two named fields').source,expected=fixtures.cases.find(f=>f.name==='simple two named fields').expected,
 options={namespaceNumber:0,pageTitle:'Nome',authorityControl:false,portals:false,biographyPortal:false,automaticBiographyPortals:false,endTemplateOrder:false,endSectionOrder:false,automaticSpelling:false,review:false,autoPreview:false,registryDoiCheck:false};
 test('complete pipeline accepts exact alignment and reports it',()=>{const r=api.calculate({kind:'adjust',source,originalSource:source,options});eq(r.text,expected,'exact separately specified full result');eq(r.preservation,[],'source preservation passes');ok(r.changes.some(c=>c.id==='infoboxAlignment'),'new rule actually executes');ok(api.summaryTopics(source,r.text,r.changes.map(c=>c.id)).includes('infocaixas'),'accurate edit summary topic');eq(api.cleanup(r.text,options).text,r.text,'pipeline second click stable');const diff=api.comparison(source,r);eq(api.composeChanges(source,diff),r.text,'accept-all reproduces exact result');eq(api.composeChanges(source,diff.map(h=>({...h,accepted:false}))),source,'reject-all restores exact source');});
 for(const [name,disabled]of [['infobox option off',{infoboxes:false}],['markup option off',{markup:false}],['section edit',{sectionOnly:true}],['talk page',{namespaceNumber:1,discussionPage:true}]])test('integrated alignment disabled '+name,()=>{const r=api.calculate({kind:'adjust',source,originalSource:source,options:{...options,...disabled}});eq(r.text,source,'no isolated formatter effect');ok(!r.changes.some(c=>c.id==='infoboxAlignment'),'no alignment report when disabled');});
}
const report={version:api.version,script:path.basename(script),scriptSha256:sha(fs.readFileSync(script)),fixtureSha256:sha(fs.readFileSync(path.join(dir,'fixtures.json'))),cases:rows.length,checks,passed:rows.filter(row=>row.passed).length,failed:rows.filter(row=>!row.passed).length,tests:rows,wikipediaWrites:0,networkRequests:0};
const output=process.env.REVISAWIKI_QA_OUTPUT||path.join(dir,'artifacts');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,path.basename(script).replace(/\.js$/,'')+'_infobox_alignment.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,tests:rows.filter(row=>!row.passed)}));if(report.failed)process.exitCode=1;
