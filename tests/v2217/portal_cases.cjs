'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa Exemplo',sectionOnly:false,autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;
function yes(x,m){checks++;assert.ok(x,m);}
function plan(source,options={}){calculations++;const c={...cfg,...options},p=api.v2217PortalPlan(source,c);yes(api.v2217PortalProof(source,p.text,p,c),'reproducible portal proof');yes(api.v2217PortalPlan(p.text,c).text===p.text,'portal idempotence');return p;}
function themes(text){const m=/\{\{Portal3\|([^{}]+)\}\}/.exec(text);return m?m[1].split('|'):[];}
const bio=(name,fields)=>'{{'+name+'|nome=Pessoa Exemplo|'+fields+'}}\n\n\'\'\'Pessoa Exemplo\'\'\' é uma pessoa.\n';
for(const name of ['Info/Titular de cargo','Info/Biografia/Wikidata','Info/Jornalista','Infobox person','Ficha de persona','Infobox officeholder']){
 const source=bio(name,name==='Infobox person'?'birth_place=[[Cidade Exemplo]], U.S.':'local_nascimento=[[Cidade Exemplo]], U.S.');
 yes(!!api.biographyDetection(source,cfg),'verified biography family recognized: '+name);
 const p=plan(source);yes(themes(p.text).includes('Biografias'),'biography portal in supported family');
 if(name==='Info/Biografia/Wikidata'||name==='Infobox officeholder')yes(!themes(p.text).includes('Estados Unidos'),'identity-only or zero-argument family does not prove an unconsumed country field');
 else if(name==='Infobox person'){
  const migrated=api.v2217InfoboxPlan(source,cfg).text;yes(migrated.startsWith('{{Info/Biografia'),'audited foreign country interface migrates first');yes(themes(plan(migrated).text).includes('Estados Unidos'),'native country field after certified migration');
 }else yes(themes(p.text).includes('Estados Unidos'),'country explicit abbreviation in native consumer');
}
for(const [name,country]of [['Australia','Austrália'],['Deutschland','Alemanha'],['日本','Japão'],['Россия','Rússia'],['Україна','Ucrânia'],['España','Espanha'],['France','França'],['Italia','Itália'],['대한민국','Coreia do Sul'],['中华人民共和国','China']]){
 const p=plan(bio('Info/Biografia','cidadania='+name));yes(themes(p.text).includes(country),'typed multilingual country identity: '+name);
}
for(const typo of ['Austrialia','Alemanh','Franca']){const value=api.v2217CountryValues(typo,true);yes(value.length===1,'unambiguous typed country typo');}
yes(api.v2217CountryValues('Talvez França',true).length===0,'uncertain nationality not inferred');
yes(api.v2217CountryValues('Atlanta, Georgia',false).length===0,'foreign state name does not become country');
yes(api.v2217CountryValues('Cidade Exemplo, CA',false).length===0,'ambiguous postal abbreviation not country');
yes(api.v2217CountryValues('[[Geórgia]]',false).length===0,'ambiguous geographic identity remains conservative');
let p=plan(bio('Info/Biografia','cidadania={{hlist|[[United Kingdom]]|[[Italy]]}}'));yes(themes(p.text).includes('Reino Unido')&&themes(p.text).includes('Itália'),'multiple explicit citizenships supported without dropping helper items');
p=plan(bio('Info/Biografia','cidadania=França|nacionalidade=incerta'));yes(!themes(p.text).includes('França'),'incomplete conflicting nationality context retained');
p=plan(bio('Info/Biografia','local_nascimento=[[Cidade Exemplo]], Brasil')+'\n{{Portal3|Goiás}}\n');yes(!themes(p.text).includes('Brasil'),'existing state portal suppresses redundant country');
p=plan(bio('Info/Biografia','cidadania=Australia')+'\n{{Portal3|Australia|Literatura}}\n');yes(themes(p.text).filter(x=>api.v2217CountryTarget(x)==='Austrália').length===1,'existing foreign country theme not duplicated');
const military='{{Info/Unidade Militar|nome=Unidade Exemplo|país=Austrália|guerras/batalhas=[[Segunda Guerra Mundial]]}}\n\n\'\'\'Unidade Exemplo\'\'\' foi uma unidade militar.\n';
p=plan(military);yes(JSON.stringify(themes(p.text))===JSON.stringify(['Guerra','Austrália','Segunda Guerra Mundial']),'country and explicit war supplement military topic');yes(!themes(p.text).includes('Biografias'),'military unit is not person');
p=plan(military.replace('|guerras/batalhas=[[Segunda Guerra Mundial]]','|periodo_atividade=1939–1945'));yes(!themes(p.text).includes('Segunda Guerra Mundial'),'dates do not prove war participation');
p=plan(military.replace('|país=Austrália','|imagem_legenda=Tropas na Austrália'));yes(!themes(p.text).includes('Austrália'),'caption country is not unit country');
p=plan(military.replace('[[Segunda Guerra Mundial]]','Não participou da [[Segunda Guerra Mundial]]'));yes(!themes(p.text).includes('Segunda Guerra Mundial'),'negated war claim not used');
p=plan(military+'\n{{Portal3|Guerra|Austrália|Segunda Guerra Mundial}}\n');yes((p.text.match(/\{\{Portal3/g)||[]).length===1,'already complete military portals unchanged');
for(const name of ['Info/Empresa','Info/Grupo étnico','Info/Animal','Info/Personagem fictícia']){p=plan(bio(name,'local_nascimento=França'));yes(!themes(p.text).includes('Biografias'),'nonhuman infobox excluded: '+name);}
yes(plan(military,{automaticTopicPortals:false}).text===military,'topic option honored');yes(plan(bio('Info/Biografia','cidadania=França'),{portals:false}).text===bio('Info/Biografia','cidadania=França'),'portal option honored');
const before=bio('Info/Biografia','cidadania=France'),after=plan(before).text,forged=api.v2217PortalPlan(before,cfg);forged.text=after+'Invented content';yes(!api.v2217PortalProof(before,forged.text,forged,cfg),'forged unrelated change rejected');
const receipt={suite:'portal_cases',checks,calculations,passed:true,bundle:file,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
