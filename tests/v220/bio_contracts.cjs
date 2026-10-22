'use strict';
const assert=require('node:assert/strict');
const api=require('./bio_harness.cjs');
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo'};
const isolated={...cfg,automaticBiographyPortals:false,automaticTopicPortals:false};
let checks=0;
function plan(s,options={}){const p=api.v220BiographyPlan(s,{...cfg,...options});assert(api.v220BiographyProof(s,p.text,p,{...cfg,...options}));checks++;assert.equal(api.v220BiographyPlan(p.text,{...cfg,...options,biographyOriginalSource:s}).text,p.text);checks++;return p;}
function has(s,piece,options={}){const p=plan(s,options);assert(p.text.includes(piece),JSON.stringify({s,piece,actual:p.text}));checks++;return p;}
function no(s,options={}){const p=plan(s,options);assert.equal(p.text,s);checks++;return p;}
function box(name,fields='',tail='Exemplo.\n\n[[Categoria:Exemplos]]'){return '{{'+name+'|nome=Exemplo'+(fields?'|'+fields:'')+'}}\n\n'+tail;}
const topicCases=[['Info/Empresa','Empresas'],['Info/Empresa/Wikidata','Empresas'],['Info/Astro','Astronomia'],['Info/Jogo de cartas','Jogos'],['Info/Jogo de tabuleiro','Jogos'],['Info/Jogo eletrônico','Jogos'],['Info/Episódios de The Simpsons','Televisão|Entretenimento'],['Info/Filme/Wikidata','Cinema|Entretenimento'],['Info/Parque de diversão','Entretenimento'],['Info/Assentamento/Marrocos','Geografia|Marrocos'],['Info/Unidade militar','Guerra'],['Info/Unidade Militar','Guerra'],['Info/Alimento','Alimentos'],['Info/Bebida','Alimentos'],['Info/Biografia/Wikidata','Biografias']];
for(const [name,portals]of topicCases){has(box(name,name.endsWith('/Marrocos')?'com':''),'{{Portal3|'+portals+'}}');no(box(name,'qid=Q1'));no(box(name),{sectionOnly:true});no(box(name),{namespaceNumber:1});no(box(name),{pageRedirect:true});no(box(name),{pageDisambiguation:true});no('<nowiki>'+box(name)+'</nowiki>');no('<!--'+box(name)+'-->');no(box(name),{portals:false});no(box(name),name==='Info/Biografia/Wikidata'?{automaticBiographyPortals:false}:{automaticTopicPortals:false});}
no(box('Info/empresa')); // Only the first title character is case-insensitive on the native wiki.
no(box('Info/Empresa','nome=Outro')); // Duplicate bindings are not normalized.
no(box('Info/Empresa','child=sim'));
no(box('Info/Empresa')+'\n'+box('Info/Organização'));
no('== História ==\n'+box('Info/Empresa'));
no(box('Info/Empresa')+'\n', {pageTitle:'Lista de exemplos'});
no(box('Info/Empresa'),{structuralRepairs:false});
has(box('Info/Assentamento/Marrocos','com'),'{{Portal3|Geografia|Marrocos}}');
no(box('Info/Assentamento/Marrocos','com|1=mun'));
has('{{Starbox begin|name=Exemplo}}\n{{Starbox end}}\n\nExemplo.','{{Portal3|Astronomia}}');
no('{{Starbox begin}}\n\nExemplo.');
no('{{Starbox begin}}\n== Seção ==\n{{Starbox end}}');
no('{{Starbox begin}}\n{{Starbox begin}}\n{{Starbox end}}');
no('{{Starbox begin|child=yes}}\n{{Starbox end}}',{automaticTopicPortals:false});
has('Exemplo.\n\n[[Categoria:Méis]]','{{Portal3|Alimentos}}');
no('Exemplo.\n\n[[Categoria:Mel]]');
no('Exemplo.\n\n[[:Categoria:Méis]]');
no('Exemplo.\n\n<nowiki>[[Categoria:Méis]]</nowiki>');
has(box('Info/Biografia','nascimento_local=[[Lisboa]], [[Portugal]]'),'{{Portal3|Portugal}}');
no(box('Info/Biografia','nascimento_local=[[Lisboa]]'));
no(box('Info/Biografia','nascimento_local=[[Lisboa]], [[Portugal]]|local_nascimento=[[Paris]], [[França]]'));
has(box('Info/Cientista','campo=[[Engenharia]]',"'''Exemplo''' é uma [[engenheira mecânica]] brasileira.\n\n[[Categoria:Exemplos]]"),'{{Portal3|Engenharia}}');
no(box('Info/Cientista','campo=[[Engenharia]]',"'''Exemplo''' escreveu sobre uma [[engenheira mecânica]]."));
no(box('Info/Cientista','campo=[[Engenharia]]',"'''Exemplo''' não é uma [[engenheira mecânica]]."));
no(box('Info/Cientista','campo=[[Engenharia]]',"'''Outra pessoa''' é uma [[engenheira civil]]."));
no(box('Info/Cientista','campo=[[Engenharia]]',"'''Exemplo''' é uma [[engenheira civil|escritora]]."));
has(box('Info/Cientista','campo=[[Engenharia]]',"'''Exemplo''' é uma [[Engenheiro|engenheira civil]]."),'{{Portal3|Engenharia}}');

function human(source){return {source,title:'Exemplo',namespace:0,fullPage:true,redirect:false,disambiguation:false,entityId:'Q123',entity:{id:'Q123',type:'item',sitelinks:{ptwiki:{title:'Exemplo'}},claims:{P31:[{rank:'normal',qualifiers:{},mainsnak:{snaktype:'value',datatype:'wikibase-item',datavalue:{type:'wikibase-entityid',value:{'entity-type':'item',id:'Q5'}}}}]}}};}
for(const native of ['Info','Infocaixa']){const s=box(native,'rótulo1=Nome|dados1=Exemplo');has(s,'{{Portal3|Biografias}}',{v220HumanProof:human(s)});no(s);const wrong=human(s);wrong.source+=' ';no(s,{v220HumanProof:wrong});const wrongItem=human(s);wrongItem.entity.claims.P31[0].mainsnak.datavalue.value.id='Q43229';no(s,{v220HumanProof:wrongItem});const qualified=human(s);qualified.entity.claims.P31[0].qualifiers={P580:[{}]};no(s,{v220HumanProof:qualified});no(s,{v220HumanProof:human(s),automaticBiographyPortals:false});}
for(const [value,want]of [['[[Investidor]], [[empreendedor]]','[[investidor]], [[empreendedor]]'],['[[Empreendedor]] / [[investidor]]','[[empreendedor]] / [[investidor]]'],['[[Farmacêutico|Farmacêutica-bioquímica]]','[[Farmacêutico|farmacêutica-bioquímica]]'],['Produtor teatral, encenador e ator','produtor teatral, encenador e ator'],['Ativista político','ativista político']])for(const name of ['Info/Biografia','Info/Cientista','Info/Escritor','Info/Ator','Info/Político'])has(box(name,'ocupação='+value),'ocupação='+want,isolated);
for(const value of ['CEO','NASA','[[Investidor X|Investidor]]','[[Doutor|Produtor teatral]]','"Produtor teatral"','<nowiki>Produtor teatral</nowiki>','Produtor Teatral','{{lang|en|Investor}}','Ativista político conhecido'])no(box('Info/Biografia','ocupação='+value),isolated);
no(box('Info/Biografia','ocupação=Investidor|ocupacoes=Ator'),isolated);
has(box('Info/Político','profissão=[[Farmacêutico|Farmacêutica-bioquímica]]'),'profissão=[[Farmacêutico|farmacêutica-bioquímica]]',isolated);
has(box('Info/Música/artista','fundo=cantor_solo|ocupação=Produtor teatral'),'ocupação=produtor teatral',isolated);
no(box('Info/Música/artista','fundo=banda|ocupação=Produtor teatral'),isolated);
for(const month of ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']){
 const n=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'].indexOf(month)+1;
 has(box('Info/Biografia','nascimento_data='+month+' {{dni|||1977|sem idade}}<ref>Fonte.</ref>'),'nascimento_data={{dni||'+n+'|1977|sem idade}}<ref>Fonte.</ref>',isolated);
}
for(const value of ['outubro {{Dni|1||1977}}','outubro {{Dni||10|1977}}','outubro {{Dni|||1977|idade}}','outubro {{Outra|||1977}}','outubro {{dni|||0}}','outubro {{dni|||1977}} ou novembro','outubro {{dni|||1977}}<ref>Fonte</ref> texto'])no(box('Info/Biografia','nascimento_data='+value),isolated);
for(const name of ['Info/Biografia','Info/Cientista','Info/Escritor'])for(const field of ['occupation','ethnicity'])has(box(name,field+'=Literal'),(field==='occupation'?'ocupação':'etnia')+'=Literal',isolated);
has(box('Info/Cientista','campo=[[Física]]|instituições=[[Instituto Exemplo]]'),'instituicao_trabalho=[[Instituto Exemplo]]',isolated);
for(const fields of ['instituições=[[Instituto Exemplo]]','campo=[[Física]]|instituições=[[Instituto Exemplo]]|instituicao_trabalho=Outro','campo=[[Física]]|instituições=[[Instituto Exemplo]]|local_trabalho=Outro','campo=[[Física]]|instituições=[[Instituto Exemplo]]|instituicoes_trabalho=Outro'])no(box('Info/Biografia',fields),isolated);
no(box('Info/Cientista','campo=[[Física]]|instituições=Exemplo|local_trabalho=Outro'),isolated);
for(const field of ['influenciado','influências','influenciado_por','influenciados','sepultamento','enterro','enterro_local','companheiro','nascimento_país'])no(box('Info/Biografia',field+'=Literal'),isolated);
for(const [from,to]of [['nome_completo','nome_comp'],['antecessor2','antes2'],['sucessor8','depois8']]){has(box('Info/Político',from+'=Literal'),to+'=Literal',isolated);no(box('Info/Político',from+'=Literal|'+to+'=Outro'),isolated);no(box('Info/Biografia',from+'=Literal'),isolated);}
for(const name of ['Info/Cavalo nomeado','Info/Animal','Info/Empresa','Info/Organização','Info/Sítio']){
 const caption=name==='Info/Empresa'||name==='Info/Organização'?'imagem_legenda':'legenda';
 has(box(name,'imagem=[[File:Example.jpg|thumb|250px|Legenda [[Exemplo]]]]'),'imagem=Example.jpg',isolated);
 has(box(name,'imagem=[[File:Example.jpg|thumb|250px|Legenda [[Exemplo]]]]'),caption+'=Legenda [[Exemplo]]',isolated);
 for(const bad of ['[[File:Example.jpg|thumb|alt=Texto|Legenda]]','[[File:Example.jpg|thumb|upright=1.2|Legenda]]','[[File:Example.jpg|thumb|link=Outro|Legenda]]','[[File:Example.jpg|thumb|600px|Legenda]]','[[File:Example.jpg|thumb|Legenda|Outra legenda]]','{{Imagem múltipla|image1=Example.jpg}}'])no(box(name,'imagem='+bad),isolated);
}
no(box('Info/Cavalo nomeado','imagem=[[File:Example.jpg|thumb|Legenda]]|legenda=Outra'),isolated);
no(box('Info/Cavalo nomeado','imagem=[[File:Example.jpg|semmdolura|75px]]'),isolated);
no(box('Info/Cavalo nomeado','imagem=[[File:Example.jpg|thumb|width250px]]'),isolated);
no(box('Info/Cavalo nomeado','imagem=[[File:Example.jpg|thumb|250px]]|imagem_tamanho=200px'),isolated);
has(box('Info/Evento de MMA','image={{Imagem múltipla|image1=Example.jpg|image2=Other.jpg}}'),'imagem={{Imagem múltipla|image1=Example.jpg|image2=Other.jpg}}',isolated);
no(box('Info/Evento de MMA','image=Example.jpg|imagem=Other.jpg'),isolated);
for(const ns of ['Ficheiro','Imagem','Arquivo','File','Image']){no('[[ '+ns+':Example.png|semmdolura|75x75px]]'.replace('[[ ','[['),isolated);has('[['+ns+':Example.jpg|thumb|width250px|Legenda]]','|250px|Legenda',isolated);has('[['+ns+':Example.jpg|thumb|vertical|Legenda]]','|thumb|Legenda',isolated);no('[['+ns+':Example.jpg|thumb|vertical]]',isolated);}
no('[[File:Example.jpg|thumb|upright|Legenda]]',isolated);
no('[[File:Example.jpg|thumb|width250px]]',isolated);
no('[[File:Example.jpg|thumb|width1200px|Legenda]]',isolated);
no(box('Info/Empresa')+'\n{{Info/Outro}}', {automaticBiographyPortals:true});
no(box('Info/Cavalo nomeado','imagem=[[File:Example.jpg|thumb|Legenda]]'),{...isolated,automaticInfoboxImages:false});
no('[[File:Example.png|semmdolura]]',isolated);
no('{{Exemplo|[[File:Example.png|semmdolura|75px]]}}',isolated);
no('<ref>[[File:Example.png|semmdolura|75px]]</ref>',isolated);
for(const wrap of [s=>'<nowiki>'+s+'</nowiki>',s=>'<!--'+s+'-->',s=>'<pre>'+s+'</pre>',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'])no(wrap('[[File:Example.jpg|thumb|vertical|Legenda]]'),isolated);
no('{|\n| [[File:Example.png|semmdolura|75px]]\n|}',isolated);
const websiteNames=[['Info/Empresa','website'],['Info/Organização','website'],['Info/Biografia','website'],['Info/Ator','site_oficial'],['Info/Político','website'],['Info/Futebolista','site'],['Info/Sítio','url'],['Info/Website','url'],['Info/Aeroporto','website'],['Info/Música/artista','website']];
const official='Exemplo.\n\n== Ligações externas ==\n* [https://www.example.invalid Página oficial]';
for(const [name,key]of websiteNames){
 for(const [bad,want]of [['www.example.invalid','[https://www.example.invalid www.example.invalid]'],['[[www.example.invalid]]','[https://www.example.invalid www.example.invalid]'],['<<https://www.example.invalid/>>','https://www.example.invalid/'],['[[https://example.invalid|Página]]','[https://example.invalid Página]'],['https://https://example.invalid','https://example.invalid']])has(box(name,key+'='+bad,official),key+'='+want,isolated);
 for(const good of ['https://www.example.invalid','//www.example.invalid','[https://www.example.invalid/ Página]','{{URL|https://www.example.invalid}}','hide','-','<!-- oculto -->','https://example.invalid/?a=b&c=d#Fragment','https://exemplo.invalid/a%20b','https://exemplo.invalid/ação','[https://example.invalid Primeira] [https://example.invalid/segunda Segunda]'])no(box(name,key+'='+good,official),isolated);
 no(box(name,key+'=www.example.invalid'),isolated);
 no(box(name,key+'=www.example.invalid','Exemplo.\n* [http://www.example.invalid Site oficial]\n* [https://www.example.invalid Site oficial]'),isolated);
 no(box(name,key+'=www.example.invalid/blog',official),isolated);
}
no(box('Info/Revista científica','sítio=https://example.invalid'),isolated);
no('{{citar web|url=https://example.invalid|website=BBC News|titulo=Exemplo}}',isolated);
no('[[Globo.com]] e [[www.example.invalid]].',isolated);
for(const [before,after]of [['{{URL|https://example.invalid/?a=b&c=d#Frag}}','{{URL|1=https://example.invalid/?a=b&c=d#Frag}}'],['{{URL|https://example.invalid/?a=b|Página}}','{{URL|1=https://example.invalid/?a=b|2=Página}}'],['{{URL|https://example.invalid/?a=b|2=Página}}','{{URL|1=https://example.invalid/?a=b|2=Página}}']])assert.equal(plan(before,isolated).text,after),checks++;
for(const value of ['{{URL|1=https://example.invalid/?a=b}}','{{URL|https://example.invalid}}','{{URL|https://example.invalid/?a=b|1=Outra}}','{{URL|https://example.invalid/?a=b|2=Página|3=Extra}}','{{url|https://example.invalid/?a=b}}','{{URL|{{Outro|url}}}}','{{URL|https://example.invalid/?a=b|Página|Outra}}','<nowiki>{{URL|https://example.invalid/?a=b}}</nowiki>'])no(value,isolated);
for(const [before,after]of [['{{Portal3|Economia|Economia e Negócios}}','{{Portal3|Economia}}'],['{{Portal3|Portal3|Física}}','{{Portal3|Física}}'],['{{Portal3|RondôniaBrasil}}','{{Portal3|Rondônia}}'],['{{Portal3|Biografias}}\n{{Portal3|Biografias|Futebol}}','\n{{Portal3|Biografias|Futebol}}']])assert.equal(plan(before).text,after),checks++;
for(const good of ['{{Portal3|  Física }}','{{Portal3|1=Física}}','{{Portal3|Economia e Negócios}}','{{Portal3|Portal3}}','{{Portal3|Física|cor=azul}}','{{Portal3|Física}}\nTexto.\n{{Portal3|Física|Ciência}}'])no(good);
const original=box('Info/Empresa');const p=plan(original);const tampered=JSON.parse(JSON.stringify(p));tampered.stages[0].edits[0].text+='X';assert(!api.v220BiographyProof(original,p.text,tampered,cfg));checks++;
console.log(JSON.stringify({suite:'v220-bio-contracts',checks,status:'passed'}));
