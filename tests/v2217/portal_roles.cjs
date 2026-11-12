'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa Exemplo',contentModel:'wikitext',sectionOnly:false};let checks=0;
const source=fs.readFileSync(path.resolve(__dirname,'../../src/v2_21_7/portals.js'),'utf8'),marker='const V2217_PERSON_NAMES = new Set(',start=source.indexOf(marker)+marker.length,roles=JSON.parse(source.slice(start,source.indexOf(');',start))),metadata=new Set(api.v2217BiographyRoleNames());
for(const name of roles){
 const article='{{'+name+'|nome=Pessoa Exemplo|cidadania=France}}\n\n\'\'\'Pessoa Exemplo\'\'\' é uma pessoa.\n';
 for(const [value,message]of [[metadata.has(name),'role metadata contains verified family'],[!!api.biographyDetection(article,cfg),'verified family recognized as biography'],[api.v2217PortalCandidates(article,cfg).includes('Biografias'),'verified family reaches automatic biography portal'],[api.v2217StandaloneInfobox('{{'+name+'}}'),'verified full box is a standalone block']]){checks++;assert.ok(value,message+': '+name);}
}
const receipt={suite:'portal_roles',checks,verifiedHumanFamilyAndAliasNames:roles.length,passed:true,bundle:file,coverageMeaning:'classification and eligible portal dispatch for the shipped verified human role names; not a certification of every foreign field mapping',wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
