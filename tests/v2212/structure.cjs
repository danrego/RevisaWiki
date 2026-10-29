'use strict';
const assert=require('node:assert/strict'),api=require('./structure_harness.cjs');
let checks=0,cases=0;const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo estrutural',autoPreview:false,registryDoiCheck:false};
function eq(a,b,m){checks++;assert.deepEqual(a,b,m);}
function test(name,source,after,prerequisite=false,options={}){
 const opts={...cfg,...options},make=prerequisite?api.v2212StructurePrerequisitePlan:api.v2212StructurePlan,prove=prerequisite?api.v2212StructurePrerequisiteProof:api.v2212StructureProof;
 const p=make(source,opts);eq(p.text,after,name);eq(prove(source,p.text,p,opts),true,name+' proof');eq(make(p.text,opts).text,p.text,name+' idempotent');
 if(p.text!==source){eq(prove(source+' ',p.text,p,opts),false,name+' stale input');const changed=JSON.parse(JSON.stringify(p));changed.edits[0].text+=' ';eq(prove(source,p.text,changed,opts),false,name+' modified plan');}
 cases++;return p;
}
test('source marker','Texto{{cn|date=September 2025}}.','Texto{{Carece de fontes|data=setembro de 2025}}.');
test('native month','Texto{{Cn|data=março de 2026}}.','Texto{{Carece de fontes|data=março de 2026}}.');
test('clarify reason','Texto{{Clarify|reason=Termo técnico|date=June 2026}}.','Texto{{Clarify|1=Termo técnico|date=June 2026}}.');
for(const [title,from,to,value]of [
 ['Imagem múltipla','widht','largura','220'],['Info/Artista','nomecompleto','nome_completo','Nome completo'],['Info/Hotel','tamanho_logo','logo_tamanho','240px'],
 ['Info/Disciplina','imagem_legenda','legenda','Legenda com [[Ligação]]'],['Info/Disciplina','campo','area','Ciência'],['Info/Estado extinto2','ano_evento_posterio','ano_evento_posterior','1695'],['Info/Droga','ATC_sufixo','sufixo_ATC','AX32']]){
 const source='{{'+title+'|'+from+'='+value+'}}';test(title+from,source,'{{'+title+'|'+to+'='+value+'}}');
 test(title+' collision','{{'+title+'|'+from+'='+value+'|'+to+'=Outro}}','{{'+title+'|'+from+'='+value+'|'+to+'=Outro}}');
}
const box='{{Info/Biografia|nome=Exemplo|notas=<ref name="fonte" group="nota">[[https://example.invalid/a?b=1]]</ref>}}';
test('literal ref in infobox',box,box.replace('[[https://example.invalid/a?b=1]]','[https://example.invalid/a?b=1]'));
const commented='{{Info/Município do Brasil\n<!-- Cabeçalho preservado -->\n|nome=Exemplo|gentílico=Texto<ref>[[https://example.invalid/]]</ref>}}';
test('commented native header',commented,commented.replace('[[https://example.invalid/]]','[https://example.invalid/]'));
const mixedDrug="{{Info/Droga|Drugs.com=|nome_IUPAC=4''H''|ATC_sufixo=AX32|desconhecido=Valor}}";
test('unrelated dotted field retained',mixedDrug,mixedDrug.replace('ATC_sufixo=','sufixo_ATC='));
const imageCaption="{{Imagem múltipla|widht=220|image1=Example.jpg|caption1=''Texto'' com [[Ligação]]}}";
test('quoted caption retained',imageCaption,imageCaption.replace('widht=','largura='));
const quote="Texto<ref name=''fonte''/> depois<ref name=''fonte''>{{Citar web|título=Fonte|url=https://example.invalid/}}</ref>\n{{Referências}}";
test('doubled name quotes',quote,quote.replaceAll("name=''fonte''",'name="fonte"'),true);
const missing='{{Info/Biografia|nome=Exemplo|notas=<ref name="fonte>{{Citar web|título=Fonte|url=https://example.invalid/}}</ref>}}';
test('missing quote in infobox',missing,missing.replace('name="fonte>','name="fonte">'),true);
const inner='<ref name="fonte">{{Citar web|título=Fonte|url=https://example.invalid/}}</ref>';
for(const group of['','nota','lower-alpha']){
 const open='<ref'+(group?' group="'+group+'"':'')+'>',source='Texto'+open+'Nota com fonte '+inner+'.</ref>\n{{Referências}}';
 test('nested '+group,source,'Texto{{Refn|1=Nota com fonte '+inner+'.'+(group?'|group='+group:'')+'}}\n{{Referências}}',true);
}
const hybrid='Texto [[https://example.invalid/a#/c](https://example.invalid/a#/c) rótulo existente].';
test('hybrid Markdown',hybrid,'Texto [https://example.invalid/a#/c rótulo existente].',true);
const file='[[https://commons.wikimedia.org/wiki/File:Example_image.jpg|thumb|240px|alt=Descrição|Legenda com [[Ligação]]]]';
const requests=api.v2212StructureFileRequests(file,cfg);eq(requests.length,1,'one file request');
test('file not confirmed',file,file);
const target='https://commons.wikimedia.org/wiki/File:Example_image.jpg', fixed='Ficheiro:Example image.jpg';
const fileProof={sourceHash:api.v24SyntaxHash(file),target,fileName:'Example image.jpg',canonicalTitle:'Ficheiro:Example image.jpg',available:true,repository:'shared',method:'imageinfo',responseSha256:'a'.repeat(64)};
test('Commons shared same canonical title',file,file.replace(target,fixed),false,{v2212VerifiedFiles:[fileProof]});
const changedDraft='Texto independente.\n'+file, originalHash=api.v24SyntaxHash(file);
test('validated original draft binding',changedDraft,changedDraft.replace(target,fixed),false,{v2212OriginalDraftHash:originalHash,v2212VerifiedFiles:[fileProof]});
test('stale proof without original context',changedDraft,changedDraft,false,{v2212VerifiedFiles:[fileProof]});
test('different target proof',file,file,false,{v2212VerifiedFiles:[{...fileProof,target:'https://de.wikipedia.org/wiki/Datei:Example_image.jpg'}]});
test('wrong original hash',changedDraft,changedDraft,false,{v2212OriginalDraftHash:'different',v2212VerifiedFiles:[fileProof]});
for(const prefix of ['File','Ficheiro','Arquivo'])for(const repository of ['shared','local']){
 const ptTarget='https://pt.wikipedia.org/wiki/'+prefix+':Example_image.jpg',source=file.replace(target,ptTarget);
 test('pt native '+prefix+' '+repository,source,source.replace(ptTarget,fixed),false,{v2212VerifiedFiles:[{...fileProof,sourceHash:api.v24SyntaxHash(source),target:ptTarget,repository}]});
}
for(const [label,patch]of [['Commons local shadow',{repository:'local'}],['Commons redirected title',{canonicalTitle:'Ficheiro:Different image.jpg'}],['Commons missing title',{canonicalTitle:undefined}],['Commons wrong namespace',{canonicalTitle:'Artigo:Example image.jpg'}],['Commons unsafe first-letter case',{canonicalTitle:'Ficheiro:example image.jpg'}]])
 test(label,file,file,false,{v2212VerifiedFiles:[{...fileProof,...patch}]});
for(const [origin,prefix]of [['en.wikipedia.org','File'],['es.wikipedia.org','Archivo'],['de.wikipedia.org','Datei'],['fr.wikipedia.org','Fichier'],['commons.wikimedia.org','Ficheiro']])for(const repository of ['shared','local']){
 const foreignTarget='https://'+origin+'/wiki/'+prefix+':Example_image.jpg',source=file.replace(target,foreignTarget);
 test('unproven origin '+origin+' '+prefix+' '+repository,source,source,false,{v2212VerifiedFiles:[{...fileProof,sourceHash:api.v24SyntaxHash(source),target:foreignTarget,repository}]});
}
const decomposed='https://commons.wikimedia.org/wiki/File:Cafe%CC%81_image.jpg',accentFile=file.replace(target,decomposed);
test('Commons NFC basename equality',accentFile,accentFile.replace(decomposed,'Ficheiro:Café image.jpg'),false,{v2212VerifiedFiles:[{...fileProof,sourceHash:api.v24SyntaxHash(accentFile),target:decomposed,fileName:'Café image.jpg',canonicalTitle:'Ficheiro:Café_image.jpg'}]});
const negatives=[
 '{{CN|date=September 2025}}','{{cn}}','{{cn|t=上海|date=September 2025}}','{{cn|date=09/10/2025}}','{{cn|date=September 2025|reason=Outro}}',
 '{{cn|date=September 2025|date=October 2025}}','{{Clarify|1=Motivo|reason=Outro}}','{{Clarify|reason={{Modelo}}}}','{{Clarify|reason=}}',
 '{{Info/Futebolista|nomecompleto=Nome}}','{{Info/Museu|imagem=Foto.jpg|legenda=Legenda}}','{{Imagem múltipla|widht=220|width=220}}','{{Info/Hotel|tamanho_logo=240|logo-tamanho=240}}',
 '{{Info/Artista|nomecompleto=Nome|nomecompleto=Outro}}','{{Info/Droga|atc_sufixo=AX32}}','{{Info/Estado extinto2|ano_evento_posterio1=1695}}',
 '{{Citar web|título={{cn|date=September 2025}}|url=https://example.invalid}}',
 '<ref name="fonte">Texto</ref><ref name="fonte"/><ref name="outra">Texto</ref>',
 "Texto<ref name=''fonte''>Fonte</ref>", "<ref name=fonte>Existente</ref><ref name=''fonte''/><ref name=''fonte''>Outra</ref>", "Texto<ref name=''fonte''/><ref name='fonte'>Fonte</ref><ref name=''fonte''>Outra</ref>",
 '<ref name="fonte>texto sem consumidor bibliográfico</ref>', '<ref name="fonte data=x>{{Citar web|título=Fonte}}</ref>',
 '<ref name="nota">Nota '+inner+'</ref>', '<ref group="nota" follow="x">Nota '+inner+'</ref>', '<ref group="nota">Nota | literal '+inner+'</ref>',
 '<ref>Nota '+inner, '<ref>Nota</ref> texto <ref>Outra</ref>', '<ref>Nota <ref>Interna <ref>Terceira</ref></ref></ref>',
 '[[Ligação|[[https://example.invalid/a](https://example.invalid/a) label]]]', '[[Ligação|{{cn|date=January 2026}}]]',
 '[[https://example.invalid/a](https://example.invalid/b) label]', '[[https://example.invalid/a(x)](https://example.invalid/a(x)) label]',
 '[[https://en.wikipedia.org.evil.invalid/wiki/File:Example.jpg|thumb|Legenda]]','[[https://en.wikipedia.org/wiki/File:Example.jpg?x=1|thumb|Legenda]]',
 '[[https://en.wikipedia.org/wiki/File:Example.jpg|Página de descrição]]', '[[https://en.wikipedia.org/wiki/File:Example.jpg#section|thumb|Legenda]]'
];
for(const [i,s]of negatives.entries()){test('negative '+i,s,s);test('prerequisite negative '+i,s,s,true);}
const repairable=['{{cn|date=January 2026}}','{{Info/Artista|nomecompleto=Nome}}',quote,missing,'<ref>Nota '+inner+'</ref>',hybrid,box];
for(const s of repairable){const pref=' '+s;test('preformatted',pref,pref);test('preformatted prerequisite',pref,pref,true);}
for(const tag of['nowiki','pre','syntaxhighlight','source','code','math'])for(const s of repairable){const source='<'+tag+'>'+s+'</'+tag+'>';test('protected '+tag,source,source);test('protected prerequisite '+tag,source,source,true);}
for(const option of[{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{discussionPage:true},{pageRedirect:true},{pageDisambiguation:true},{markup:false},{structuralRepairs:false},{v2212StructureRepairs:false},{contentModel:'javascript'}]){
 for(const s of repairable){test('excluded context '+JSON.stringify(option),s,s,false,option);test('excluded prerequisite '+JSON.stringify(option),s,s,true,option);}
}
for(const s of['<math>E=mc^2</math>\n{{cn|date=January 2026}}','<math>\\int f(x) dx</math>\n'+hybrid]){
 const p=api.v2212StructurePlan(s,cfg),q=api.v2212StructurePrerequisitePlan(s,cfg);eq(p.text.match(/<math>[\s\S]*?<\/math>/)[0],s.match(/<math>[\s\S]*?<\/math>/)[0],'formula preserved');eq(q.text.match(/<math>[\s\S]*?<\/math>/)[0],s.match(/<math>[\s\S]*?<\/math>/)[0],'formula preserved prerequisite');
}
process.stdout.write(JSON.stringify({kind:'structure-family-unit-tests',checks,cases,passed:true,publicFixtures:'synthetic',wikipediaWrites:0})+'\n');
