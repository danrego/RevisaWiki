'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||'dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(bundle),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa Exemplo',contentModel:'wikitext',sectionOnly:false,autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;const rows=[];
function yes(v,m){checks++;assert.ok(v,m);}
function run(name,fields,expected=[],forbidden=[]){const source='{{'+name+'|nome=Pessoa Exemplo|'+fields+'}}\n\n\'\'\'Pessoa Exemplo\'\'\' é uma pessoa.\n',r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;yes(api.v219AutomaticResultSafety(source,r).accepted,'full preservation');const p=(r.text.match(/\{\{Portal3\|[^}]+\}\}/g)||[]).join();for(const v of expected)yes(p.includes('|'+v),'confirmed theme remains '+v);for(const v of forbidden)yes(!p.includes('|'+v),'ignored/conflicting source cannot supply theme '+v);rows.push({name,fields,portals:p});return r.text;}
for(const name of ['Info/Biografia','Info/Cientista','Info/Escritor']){
 run(name,'Nacionalidade=português',[],['Portugal']);
 run(name,'ocupações=Físico|Ocupacao=Escritor',[],name==='Info/Escritor'?[]:['Literatura']);
 run(name,'ocupação=Físico|ocupacao=Escritor',[],name==='Info/Escritor'?[]:['Literatura']);
 run(name,'nacionalidade=português',['Portugal']);
 const fixed=run(name,'nationality=português',['Portugal']);yes(/\|nacionalidade\s*=português/.test(fixed),'safe English-key writer activates the native field first');
 run(name,'nacionalidade=português|nacionalidade=francesa',[],['Portugal','França']);
 run(name,'Nacionalidade=português|local_nascimento=[[Cidade Exemplo]], França',['França'],['Portugal']);
 run(name,'ocupacao=escritor',['Literatura']);
 const role=run(name,'occupation=escritor',['Literatura']);yes(/\|ocupação\s*=escritor/.test(role),'safe English occupation-key correction remains eligible');
}
const correctedCountry=run('Info/Titular de cargo','Nacionalidade=português',['Portugal']);yes(/\|nacionalidade\s*=português/.test(correctedCountry),'case-only country key is eligible only after certified native writer');
run('Info/Titular de cargo','ocupação=Físico|Ocupacao=Escritor',[],['Literatura']);
run('Info/Titular de cargo','nacionalidade=francesa|Nacionalidade=português',['França'],['Portugal']);
for(const fields of ['nombre=Pessoa Exemplo','nombre=[[Pessoa Exemplo]]','nombre=Pessoa Exemplo<ref>Fonte.</ref>','nome=Pessoa A|nombre=Pessoa B','nombre=Pessoa A|nombre=Pessoa B']){
 const source='{{Ficha de persona|'+fields+'}}\n\n\'\'\'Pessoa Exemplo\'\'\' é uma pessoa.\n',r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;yes(api.v219AutomaticResultSafety(source,r).accepted,'local name branch integrity');
 if(fields==='nombre=Pessoa Exemplo'){yes(r.text.startsWith('{{Info/Biografia'),'existing certified name migration before layout');yes(/\|nome\s*=Pessoa Exemplo/.test(r.text),'native supplied name remains');}
 else{yes(r.text.startsWith('{{Ficha de persona'),'uncertified supplied name stays local alias');yes(r.text.includes(fields.includes('[[Pessoa')?'[[Pessoa Exemplo]]':fields.includes('<ref>')?'Pessoa Exemplo<ref>Fonte.</ref>':'Pessoa B'),'uncertain name values retained');}
}
const report={suite:'portal-effective-native-field-priority',checks,calculations,rows,passed:true,bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
