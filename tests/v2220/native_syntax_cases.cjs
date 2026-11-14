'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=process.env.REVISAWIKI_CURRENT_CORE?require('./harness.cjs').api:require('./citation_harness.cjs').load(),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo'},data=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../src/v2_22/syntax_data.json'),'utf8'));let checks=0,plans=0;
function yes(v,m){checks++;assert.ok(v,m);}
function run(source,expected,options={}){plans++;const c={...cfg,...options},p=api.v222NativeSyntaxPlan(source,c);yes(p.text===expected,source+' -> '+p.text+' expected '+expected);yes(api.v222NativeSyntaxProof(source,p.text,p,c),'exact proof');yes(api.v222NativeSyntaxPlan(p.text,c).text===p.text,'idempotence');if(p.edits.length)yes(!api.v222NativeSyntaxProof(source,p.text+'x',p,c),'tampered result rejected');return p;}
for(const [source,target,id,kind]of data.magic){
 let before,after;
 if(kind==='behavior-switch'){before=source;after=target;}
 else if(kind==='redirect-directive'){before=source+' [[Destino]]';after=target+' [[Destino]]';}
 else if(kind==='switch-default-branch-marker'){before='{{#switch:valor|a=A|'+source+'=Outro}}';after='{{#switch:valor|a=A|'+target+'=Outro}}';}
 else if(kind==='colon-parser-function'||kind==='parser-function'||['defaultsort','displaytitle'].includes(id)){before='{{'+source+':Valor|opção=inalterada}}';after='{{'+target+':Valor|opção=inalterada}}';}
 else if(data.magicVariableIds.includes(id)){before='{{'+source+'}}';after='{{'+target+'}}';}
 else {before='{{'+source+':Valor}}';after=data.magicColonIds.includes(id)?'{{'+target+':Valor}}':before;}
 run(before,after);
}
for(const alias of ['DEFAULTSORT','DEFAULTSORTKEY','DEFAULTCATEGORYSORT','ORDENACAOPADRAO','ORDEMPADRAO','ORDEMPADRÃO'])run('{{'+alias+':Chave, Exemplo|noerror|noreplace}}','{{ORDENAÇÃOPADRÃO:Chave, Exemplo|noerror|noreplace}}');
run("{{DISPLAYTITLE:''Exemplo'' parcial|noerror}}","{{EXIBETÍTULO:''Exemplo'' parcial|noerror}}");
run('{{subst:DEFAULTSORT:{{PAGENAME}}|noreplace}}','{{subst:ORDENAÇÃOPADRÃO:{{NOMEDAPÁGINA}}|noreplace}}');
run('Um {{CURRENTYEAR}} inline.','Um {{ANOATUAL}} inline.');
run('{{#invoke:Módulo|função|PAGENAME=Texto}}','{{#invocar:Módulo|função|PAGENAME=Texto}}');
for(const text of ['{{DEFAULTSORT|Chave}}','{{currentyear}}','{{CURRENTYEAR:Exemplo}}','{{NUMBERINGROUP}}','{{PAGESINCATEGORY}}','{{#len:abc}}','{{#expr:2+2}}','{{#switch:valor|#padrão=Outro}}','{{Nome|#default=Texto}}','__FORCARTDC__','{{NOMEDAPÁGINA}}','{{ORDENAÇÃOPADRÃO:Chave}}','{{DISPLAYTITLE|Valor}}','http://example.org/CURRENTYEAR','https://example.org/__NOTOC__','Um texto CURRENTYEAR.'])run(text,text);
for(const [from,to]of data.image){
 const value=from.startsWith('link')?'':from.startsWith('thumb')?'Mini.jpg':from.startsWith('page')?'2':'1.25',a=from.replace('$1',value),b=to.replace('$1',value);
 run('[[Ficheiro:Imagem.jpg|'+a+'|Legenda]]','[[Ficheiro:Imagem.jpg|'+b+'|Legenda]]');
}
run('[[Image:Imagem.jpg|thumb|right|upright=0.85|link=|alt=Texto|Legenda [[Example|link]]]]','[[Ficheiro:Imagem.jpg|miniatura|direita|superiordireito=0.85|ligação=|alt=Texto|Legenda [[Example|link]]]]');
for(const [from,to]of data.namespaces)run('[[:'+from+'Exemplo#Âncora|Rótulo]]','[[:'+to+'Exemplo#Âncora|Rótulo]]');
run('{{Template:Nome|title=Valor}}','{{Predefinição:Nome|title=Valor}}');
for(const text of ['[[Ficheiro:Imagem.jpg|miniaturadaimagem|superiordireito=1.2|Legenda]]','[[Imagem:Imagem.jpg|miniatura|Legenda]]','[[Arquivo:Imagem.jpg|miniatura|Legenda]]','[[:File:Imagem.jpg|thumb]]','[[:en:File:Imagem.jpg|thumb]]','[[en:Image:Imagem.jpg|thumb]]','[[Ficheiro:Imagem.jpg|Thumb|RIGHT|Legenda]]','<gallery>File:Imagem.jpg|thumb</gallery>','{{Caixa|imagem=Image:Imagem.jpg|alinhamento=right}}','[[Portal talk:Exemplo]]']){
 const expected=text==='[[:File:Imagem.jpg|thumb]]'?'[[:Ficheiro:Imagem.jpg|thumb]]':text;run(text,expected);
}
for(const wrap of [x=>'<nowiki>'+x+'</nowiki>',x=>'<!--'+x+'-->',x=>'<syntaxhighlight lang="wikitext">'+x+'</syntaxhighlight>',x=>'"'+x+'"',x=>'<math>'+x+'</math>']){const text=wrap('{{CURRENTYEAR}} [[File:E.jpg|thumb]] __FORCETOC__');run(text,text);}
run('{{CURRENTYEAR}}','{{CURRENTYEAR}}',{multilingual:false});
run('{{CURRENTYEAR}}','{{CURRENTYEAR}}',{namespaceNumber:1});
const receipt={suite:'v222-native-syntax',checks,plans,passed:true,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
