'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
assert(process.env.REVISAWIKI_BUNDLE,'Provide the exact modular or complete candidate');
const file=path.resolve(process.env.REVISAWIKI_BUNDLE),directory=path.dirname(file),api=require(file),index=require(path.join(directory,'RevisaWiki_v2_22_1_regras.js')).infoboxManifest,sha=text=>crypto.createHash('sha256').update(text).digest('hex');
let checks=0,fetches=0;const rows=[];function ok(value,message){checks++;assert(value,message);}function equal(a,b,message){checks++;assert.deepEqual(a,b,message);}
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Assunto sintético',autoPreview:false,portals:false,authorityControl:false,spelling:false};
async function main(){
 equal(api.v2221InfoboxManifestValidate(index.data).errors,[],'real normalized manifest');
 for(const key of Object.keys(index.data.headers))equal(api.v2221InfoboxTitle(key),key,'namespace-free exact MediaWiki header');
 equal(sha(api.v2221InfoboxCanonical(index.data)),index.sha256,'canonical manifest digest');
 const manifestBefore=JSON.stringify(index),adapters={async fetchShard(descriptor){fetches++;return fs.readFileSync(path.join(directory,'Infocaixas',descriptor.id+'.json'),'utf8');},async verifySha256(text,expected){return sha(text)===expected;}};
 const headers=['Template:infobox_football_biography','Predefinição:Info/Biografia','Infobox person','Modelo desconhecido'];
 const first=await api.v2221InfoboxPreflight(headers,index.data,adapters,{expectedManifestSha256:index.sha256});equal(first.status,'ready');equal(first.failures,[]);equal(first.selectedShards.length,1);equal(fetches,1);rows.push({id:'real-multilingual-header-prefetch',status:first.status,selectedShards:first.selectedShards,fetches});
 equal(first.catalog.records.filter(row=>row.state==='active').length,4);equal(first.catalog.records.filter(row=>row.state==='unresolved').length,1);
 equal(api.v2221InfoboxCatalogValidate(first.catalog).recordErrors,[]);equal(JSON.stringify(index),manifestBefore,'caller manifest remains unchanged');
 const raw='{{Infobox football biography|name=Pessoa|position=Forward}}',settings={...cfg,v2221InfoboxCatalogJson:JSON.stringify(first.catalog)},plan=api.v2221InfoboxPipelinePlan(raw,settings);ok(plan.text.includes('{{Info/Futebolista|nome=Pessoa|posição=atacante}}'));ok(api.v2221InfoboxPipelineProof(raw,plan.text,plan,settings));
 const wrapper='{{Infobox person|name=Pessoa|occupation=escritor}}';equal(api.v2221InfoboxPipelinePlan(wrapper,settings).text,wrapper,'CA header collision survives prefetch');
 const again=await api.v2221InfoboxPreflight(headers,index.data,adapters,{expectedManifestSha256:index.sha256});equal(fetches,1);equal(again.cachedShards.length,1);rows.push({id:'real-authenticated-memo',status:again.status,fetches});
 const unavailable=await api.v2221InfoboxPreflight(headers,index.data,{fetchShard:async()=>{throw Error('Unavailable local fixture');},verifySha256:adapters.verifySha256},{expectedManifestSha256:index.sha256});equal(unavailable.status,'partial');ok(unavailable.blockedTitles.includes('Infobox football biography'));ok(unavailable.blockedTitles.includes('Infobox person'));
 const partialCfg={...cfg,v2221InfoboxCatalogJson:JSON.stringify(unavailable.catalog)},article=raw+"\n'''Pessoa''' é um futebolista.<ref>Fonte.</ref>\n== Referências ==\n<references />",result=api.calculate({kind:'adjust',source:article,options:partialCfg});ok(result.text.includes('{{Infobox football biography'),'failed shard cannot activate an older migration');ok(result.text.includes('{{Referências}}'),'local reference fixes remain available');ok(result.text.includes('<ref>Fonte.</ref>'));rows.push({id:'real-missing-shard-isolation',status:unavailable.status,blocked:unavailable.blockedTitles});
 const mutated=JSON.parse(JSON.stringify(index.data)),id=mutated.headers['Infobox football biography'];delete mutated.headers['Infobox football biography'];mutated.headers['Template:Infobox football biography']=id;
 let touched=false;const invalid=await api.v2221InfoboxPreflight(headers,mutated,{fetchShard:async()=>{touched=true;return '';},verifySha256:async()=>true},{expectedManifestSha256:'a'.repeat(64)});equal(invalid.status,'unavailable');ok(!touched,'un-normalized builder index is rejected before a shard request');
 const report={suite:'real-infobox-built-manifest-preflight',status:'passed',runtimeSha256:sha(fs.readFileSync(file)),manifestSha256:index.sha256,checks,rows,networkRequests:0,wikipediaWrites:0};if(process.env.REVISAWIKI_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
