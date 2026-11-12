'use strict';
// Full-action negative controls, distinct from the pure country-name reader.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||'dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const options={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa Exemplo',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;const rows=[];
const cases=[
 ['nacionalidade=não brasileiro',[]],['nacionalidade=not French',[]],
 ['nacionalidade=talvez portuguesa',[]],['nacionalidade=possibly Russian',[]],
 ['nacionalidade=França ou Alemanha',[]],['nacionalidade=incerta',[]],
 ['local_nascimento=[[Terre Haute]], Indiana',[]],
 ['nacionalidade=estadunidense',['Estados Unidos']],['nacionalidade=indiana',['Índia']],
];
for(const [field,countries]of cases){
 const source='{{Info/Biografia|nome=Pessoa Exemplo|'+field+'}}\n\nTexto.<math>E=mc^2</math>\n',result=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;
 assert(api.v219AutomaticResultSafety(source,result).accepted);checks++;
 const themes=(result.text.match(/\{\{Portal3\|([^}]*)\}\}/)?.[1]||'').split('|').filter(Boolean);
 assert.deepEqual(themes,['Biografias',...countries]);checks++;
 assert(result.text.includes(field.slice(field.indexOf('=')+1)));checks++;
 assert(result.text.includes('<math>E=mc^2</math>'));checks++;
 const second=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options});calculations++;assert.equal(second.text,result.text);checks++;
 rows.push({sourceSha256:sha(source),outputSha256:sha(result.text),confirmedCountryThemes:countries,uncertaintyOrLocationTextPreserved:true});
}
const report={kind:'whole-action-country-uncertainty-context-controls',version:'2.21.7',passed:true,cases:cases.length,checks,calculations,bundleSha256:sha(fs.readFileSync(file)),rows,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
