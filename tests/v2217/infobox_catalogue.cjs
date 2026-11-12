'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',sectionOnly:false,autoPreview:false,registryDoiCheck:false,multilingual:false,automaticBiographyFields:false,dates:false,birthDates:false};let checks=0,calculations=0,changed=0;
function yes(x,m){checks++;assert.ok(x,m);}
const asciiTrim=s=>s.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
for(const profile of Object.values(api.infoboxCatalog)){
 if(/[{}<>|\r\n]/.test(profile.title))continue;
 const keys=[...new Set((profile.accepted||[]).filter(k=>k&&!/[{}<>|=\[\]\r\n\u0000-\u001F\u200B\uFEFF]/.test(k)))].slice(0,3);
 if(!keys.length)keys.push('campo_exemplo');
 const values=['Dado com [[Ligação Exemplo|rótulo]] e {{lang|en|value}}','20,074','A<ref name="ex">Fonte.</ref>'];
 const source='{{'+profile.title+keys.map((k,i)=>'|'+k+' = '+values[i]).join('')+'}}';
 const p=api.v2217InfoboxPlan(source,cfg);calculations++;
 yes(api.v2217InfoboxProof(source,p.text,p,cfg),'proof '+profile.title);
 yes(api.v2217InfoboxPlan(p.text,cfg).text===p.text,'idempotence '+profile.title);
 const before=api.v2217InfoboxFields(source),after=api.v2217InfoboxFields(p.text);
 yes(!!before&&!!after,'reader remains complete '+profile.title);
 yes(JSON.stringify(before.fields.map(f=>[f.key,asciiTrim(f.value)]))===JSON.stringify(after.fields.map(f=>[f.key,asciiTrim(f.value)])),'effective named fields unchanged '+profile.title);
 if(p.text!==source)changed++;
}
// This campaign proves named-argument source-layout equivalence, not native
// conversion of every field or article eligibility for every catalogue entry.
const receipt={suite:'infobox_catalogue',checks,calculations,changed,passed:true,bundle:file,coverageMeaning:'synthetic named-argument source-layout equivalence across the shipped catalogue; not per-field semantic conversion certification',wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
