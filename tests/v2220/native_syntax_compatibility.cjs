'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{api,cfg,sourceSha}=require('./harness.cjs');let checks=0,plans=0;
function yes(v,m){checks++;assert.ok(v,m);}
for(const name of ['DEFAULTSORT','DEFAULTSORTKEY','DEFAULTCATEGORYSORT','ORDENACAOPADRAO','ORDENAÇÃOPADRÃO','ORDEMPADRAO','ORDEMPADRÃO'])yes(api.v2216LayoutSortOwner('{{'+name+':Chave}}')==='sort','native sort identity '+name);
for(const text of ['{{Template:DEFAULTSORT:Chave}}','{{DEFAULTSORT|Chave}}','{{ORDENAÇÃOPADRÃO|Chave}}'])yes(api.v2216LayoutSortOwner(text)===null,'template homonym is not a magic owner');
yes(api.v2216LayoutSortOwner('{{NM|1900|2000|Exemplo}}')==='composite','NM keeps composite effects');
yes(api.v2216LayoutSortOwner('{{NF|1900|2000|Exemplo}}')==='composite','NF keeps composite effects');
for(const text of ['{{PAGENAME}}','{{NOMEDAPÁGINA}}','{{BASEPAGENAME}}','{{NOMEDAPÁGINABASE}}','{{NOMECOMPLETODAPÁGINA}}','{{NOMEDASUBPÁGINA}}'])yes(api.v2216LayoutPureProgram(text),'same native variable is a pure program '+text);
for(const text of ['{{#PAGENAME}}','{{Template:PAGENAME}}','{{NOMEDAPÁGINA:Outra}}','{{CURRENTYEAR:Outra}}'])yes(!api.v2216LayoutPureProgram(text),'no unproved invocation '+text);
yes(api.v2216LayoutPureProgram('{{Portal3|Biografias|{{NOMEDAPÁGINABASE}}}}'),'nested valid native variable recognized');
yes(!api.v2216LayoutPureProgram('{{Portal3|Biografias|{{Nome desconhecido}}}}'),'unknown nested program preserved');
yes(api.v2216ObsoleteOwnerRemovalAllowed('{{Descrição curta|Texto {{NOMEDAPÁGINA}}}}'),'obsolete description same native variable');
yes(!api.v2216ObsoleteOwnerRemovalAllowed('{{Descrição curta|Texto {{Template:PAGENAME}}}}'),'template homonym remains opaque');
for(const label of ['{{BASEPAGENAME}}','{{NOMEDAPÁGINABASE}}']){
 const source='== Ver também ==\n{{Commonscat em linha|Examples|'+label+'}}\n',edits=api.v2216LayoutSisterInline(source,cfg);plans++;yes(edits.length===1,'sister project accepts same native label');yes(edits[0].text.includes(label),'exact label retained');
 const word='== Ver também ==\n{{Wikcionário em linha|Exemplo|'+label+'}}\n',words=api.v2216LayoutSisterInline(word,{...cfg,pageTitle:'Exemplo'});plans++;yes(words.length===1,'word-mode label identity');
}
for(const label of ['{{PAGENAME}}','{{NOMEDAPÁGINA}}'])yes(api.v2212PortalFooterRole('{{Esboço personalizado|texto=Exemplo}}\n'+label)==='stub','same native page name in stub wrapper tail');
yes(api.v2212PortalFooterRole('{{Esboço personalizado|texto=Exemplo}}\n{{Template:PAGENAME}}')===null,'tail homonym still blocks inferred wrapper role');
let p=api.v2215AliasPlan('[[File:Exemplo.jpg|thumb]]',cfg);plans++;yes(p.text==='[[Ficheiro:Exemplo.jpg|miniatura]]','legacy alias path also prefers Ficheiro');
p=api.v2215AliasPlan('[[Ficheiro:Exemplo.jpg|miniaturadaimagem]]',cfg);plans++;yes(p.text==='[[Ficheiro:Exemplo.jpg|miniaturadaimagem]]','legacy alias path preserves valid Portuguese');
const receipt={suite:'v222-legacy-native-compatibility',checks,plans,sourceSha,passed:true,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
