'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
async function main(){
 const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||process.env.REVISAWIKI_BUNDLE||path.join(root,'dist/2.22.2/RevisaWiki_v2_22_2.js')),directory=path.dirname(bundle),api=require(bundle);assert.equal(api.version,'2.22.2');
 const inherited=path.join(root,'tests/v2221/focused_infoboxes_preflight_build.cjs'),original=fs.readFileSync(inherited,'utf8');let selected=original;
 const changes=[['RevisaWiki_v2_22_1_regras.js','RevisaWiki_v2_22_2_regras.js'],["first.catalog.records.filter(row=>row.state==='active').length,4","first.catalog.records.filter(row=>row.state==='active').length,5"]];
 for(const [before,after]of changes){assert.equal(selected.split(before).length,2,'One explicit release expectation');selected=selected.replace(before,after);}
 const env={...process.env,REVISAWIKI_BUNDLE:bundle};delete env.REVISAWIKI_RECEIPT;
 const oldRun=cp.spawnSync(process.execPath,['-e',selected],{cwd:root,env,encoding:'utf8',timeout:30000});assert.equal(oldRun.status,0,oldRun.stderr||oldRun.stdout);
 const inheritedReport=JSON.parse(oldRun.stdout.trim().split('\n').at(-1));assert.equal(inheritedReport.status,'passed');
 const baseline=require('../../src/v2_22_1/infobox_registry_data.json'),catalog=require('../../src/v2_22_2/infobox_registry_data.json'),index=require(path.join(directory,'RevisaWiki_v2_22_2_regras.js')).infoboxManifest;
 assert.equal(catalog.records.length,6);assert.equal(catalog.records.filter(r=>r.state==='active').length,5);assert.equal(catalog.records.filter(r=>r.state==='unresolved').length,1);
 const same=[];for(const old of baseline.records){const row=catalog.records.find(r=>r.id===old.id);assert(row,'No historical record removed');assert.deepEqual(row.source,old.source,'Original source contract preserved');assert.equal(row.state,old.state);assert.deepEqual(row.fields&&Object.fromEntries(Object.keys(old.fields||{}).map(k=>[k,row.fields[k]])),old.fields,'Every original field mapping unchanged');
  if(['pt-native-biography-foreign-key-repair','pt-native-person-wrapper','ca-internal-person-header-collision'].includes(old.id))assert.deepEqual(row,old,'Original native or unresolved contract unchanged');
  else{assert.deepEqual(row.proof,old.proof);assert.equal(row.target.title,old.target.title);for(const key of old.target.accepted)assert(row.target.accepted.includes(key));if(old.id==='en-football-literal-subset'){assert.equal(row.target.revision,73340185);assert.equal(row.target.sha256,'9a2ef626202052d72c6f0348f4d53026095592e4b7aadc2eac1f4d35b4ac4524');}else{assert.equal(row.target.revision,old.target.revision);assert.equal(row.target.sha256,old.target.sha256);}}
  same.push(old.id);
 }
 const newRecord=catalog.records.find(r=>r.id==='en-scientist-explicit-subset');assert.equal(newRecord.source.wiki,'en');assert.equal(newRecord.target.title,'Predefinição:Info/Biografia');assert.equal(newRecord.fields.workplaces.target,'instituicoes_trabalho');assert.equal(newRecord.fields.doctoral_advisor.target,'orientador');assert.equal(newRecord.fields.doctoral_students.target,'orientados');assert(!newRecord.fields.module,'Wrapper module remap is not borrowed from generic person');
 const shards=[];for(const desc of index.data.shards){const raw=fs.readFileSync(path.join(directory,'Infocaixas',desc.id+'.json'),'utf8');assert.equal(sha(api.v2221InfoboxCanonical(JSON.parse(raw))),desc.sha256,'Installed canonical shard digest');shards.push({id:desc.id,sha256:desc.sha256});}
 const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',v2221InfoboxCatalogJson:JSON.stringify(catalog),v2221InfoboxSourceWiki:'en'};
 const fixtures=[
  ['scientist-fields','{{Infobox scientist|name=Exemplo|workplaces=Instituição|doctoral_advisor=Pessoa A|doctoral_students=Pessoa B}}',true],
  ['scientist-unknown-field','{{Infobox scientist|name=Exemplo|workplaces=Instituição|unknown=Guardar}}',false],
  ['scientist-role-conflict','{{Infobox scientist|name=Exemplo|field=Física|fields=Química}}',false],
  ['scientist-unsupported-embedding','{{Infobox scientist|name=Exemplo|child=yes|workplaces=Instituição}}',false]
 ];const rows=[];
 for(const [id,raw,convert]of fixtures){const source=raw+'\nTexto.<ref>Fonte.</ref>\n\n{{Referências}}',r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});assert.equal(/\{\{Info\/Biografia[|\n]/.test(r.text),convert,id);assert(r.text.includes('Instituição')||r.text.includes('Física'));assert(r.text.includes('<ref>Fonte.</ref>'));assert(api.v219AutomaticResultSafety(source,r).accepted);rows.push({id,status:'passed',beforeSha256:sha(source),afterSha256:sha(r.text)});}
 const report={suite:'current-infobox-registry-and-inherited-preflight-qualification',status:'passed',runtimeSha256:sha(fs.readFileSync(bundle)),inheritedTestSha256:sha(original),inheritedAssertions:inheritedReport.checks,releaseExpectationChanges:changes.map(([before,after])=>({before,after})),historicalContractsPreserved:same,catalogue:{records:6,active:5,unresolved:1},shards,rows,networkRequests:0,wikipediaWrites:0};
 if(process.env.REVISAWIKI_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
