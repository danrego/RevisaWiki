'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.3/RevisaWiki_v2_21_3.js'),api=require(core),{box}=require('./fixtures.cjs');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-28'};
const ref='<ref name=fonte>{{Citar web|url=https://example.org/biografia|título=Biografia}}</ref>',date='{{DataExt|2|1|1980}}',childDate='{{DataExt|4|3|1920}}';
let checks=0,calculations=0;const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};const rows=[];
for(const name of ['Biografia','Cientista','Escritor'])for(const flags of ['child=sim','child=não','child=incerto',''])for(const blank of [false,true]){
 const nested='{{Info/Cientista|'+(flags?flags+'|':'')+'nome=Outra pessoa|nascimento_data='+childDate+'|nascimento_local=[[Lisboa]]}}',fields=(blank?'nascimento_data=|data_nascimento=':'nascimento_data=')+date+ref+'|'+(blank?'local_nascimento=|localnasc=':'local_nascimento=')+'[[Paris]]<ref name=fonte/>|módulo='+nested,
 source=box(fields,name)+'\n{{Referências}}',plan=api.v2151BiographyLeadPlan(source,cfg),r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg}),qualified=flags==='child=sim';calculations++;
 eq(plan.edits.length,qualified?1:0,'Only native child certification enables parent lead transfer');
 eq(!!api.v28PrincipalPersonBox(source,cfg),qualified,'Primary person reader excludes only a certified native child');
 eq(api.v219AutomaticResultSafety(source,r).accepted,true,'Full parent fact transfer keeps original preservation gates');
 const opening=r.text.slice(r.text.indexOf("'''Pessoa de teste'''"));eq(opening.includes(date),qualified,'Only the parent date can reach the opening');eq(opening.includes('[[Lisboa]]'),false,'Child birthplace never supplies the parent opening');eq(opening.includes(childDate),false,'Child date never supplies the parent opening');
 eq(r.text.includes(nested),true,'Child source fields stay exact');eq(r.text.includes(ref),true,'Complete source citation stays exact in the infobox');
 const second=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});calculations++;eq(second.text,r.text,'Cited parent/child transfer is idempotent');rows.push({name,flags:flags||'missing',blank,qualified});
}
const receipt={suite:'biography-parent-lead-scope-2.21.3',runtimeSha256:crypto.createHash('sha256').update(fs.readFileSync(core)).digest('hex'),checks,calculations,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
