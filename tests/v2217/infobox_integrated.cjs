'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa Exemplo',sectionOnly:false,autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;const results=[];
function yes(x,m){checks++;assert.ok(x,m);}
function calc(source){calculations++;const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});yes(api.v219AutomaticResultSafety(source,result).accepted===true,'integrated preservation accepts result');results.push({source,result:result.text});return result.text;}
const lead="\n\n'''Pessoa Exemplo''' é uma pessoa.\n";
for(const fields of ['data_nascimento={{Ani|1972|5|24}}','data_nascimento={{Ani|1972|5|24}}|data_morte=1 de janeiro de 2020','data_nascimento={{Birth date and age|df=y|1972|5|24}}|data_morte=1 de janeiro de 2020']){
 const source='{{Info/Titular de cargo|nome=Pessoa Exemplo|'+fields+'}}'+lead,after=calc(source),date=fields.slice(fields.indexOf('{{'),fields.indexOf('}}')+2);
 if(fields.includes('Birth date and age')){
  // The inherited native date writer preserves a known deceased context with
  // an age-suppressed birth helper and the complete age-at-death helper.
  yes(after.includes(date)||after.includes('{{Dni|24|5|1972|si}}')&&after.includes('{{Morte|1|1|2020|24|5|1972}}'),'deceased dates remain unchanged or use the exact native deceased-date pair');
 }else yes(after.includes(date),'integrated pipeline preserves valid Ani helper');
 yes(!after.includes('{{Dni|24|5|1972}}'),'does not add a bare living-status date helper');
}
let after=calc('{{Info/Biografia|nome=Pessoa Exemplo|website=https://example.invalid/}}'+lead);yes(/\|site\s*=https:\/\/example.invalid\//.test(after),'integrated Portuguese site key survives');
after=calc('{{Infobox person|name=Pessoa Exemplo|birth_date={{birth date and age|df=y|1999|10|14}}|citizenship={{hlist|[[United Kingdom]]|[[Italy]]}}|years_active=2013–present|education=[[Example University]]|occupation=}}'+lead);yes(after.includes('{{Info/Biografia'),'integrated atomic migration applied');yes(after.includes('{{hlist|[[Reino Unido]]|[[Itália]]}}'),'integrated citizenships retain valid helper');yes(after.includes('[[Example University]]'),'integrated future-article link retained');
for(const source of ['{{Info/Biografia|nome=Pessoa Exemplo|local_nascimento=Terre Haute, Indiana}}','{{Info/Unidade Militar|nome=Unidade Exemplo|país=Indiana}}']){
 after=calc(source+lead);yes(!/\{\{Portal3\|[^}]*Índia/.test(after),'complete pipeline never mistakes a state for a nationality demonym');
}
after=calc('{{Info/Biografia|nome=Pessoa Exemplo|nacionalidade=indiana}}'+lead);yes(/\{\{Portal3\|[^}]*Índia/.test(after),'complete pipeline retains a valid demonym in explicit nationality context');
const receipt={suite:'infobox_integrated',checks,calculations,passed:true,bundle:file,results,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({...receipt,results:undefined}));
