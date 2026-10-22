'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const api=require(process.env.REVISAWIKI_BUNDLE||path.resolve(__dirname,'../../dist/2.20.0/RevisaWiki_v2_20_0_completo.js'));
const config={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',autoPreview:false,authorityControl:false,
 automaticBiographyLead:false,automaticInfoboxOrder:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false};
const cases=[];
const page=(type,fields,tail='Exemplo.')=>'{{'+type+'|nome=Exemplo|'+fields+'}}\n\n'+tail;
const add=(name,source,expected,options={})=>cases.push({name,source,expected,options});
const pair=(name,type,before,after,negatives)=>{
 add(name,page(type,before),page(type,after));
 for(const [suffix,fields]of negatives)add(name+' / '+suffix,page(type,fields),page(type,fields));
};
// Expected endpoints are literal native-field compositions, not planner output.
for(const type of ['Info/Biografia','Info/Cientista','Info/Escritor']){
 pair('ocupação e etnia em '+type,type,'occupation=Literal|ethnicity=Literal','ocupação=Literal|etnia=Literal',[
  ['destinos diferentes','occupation=Literal|ocupação=Outro|ethnicity=Literal|etnia=Outro'],
  ['aliases preenchidos','occupation=Literal|ocupacao=Outro|ethnicity=Literal|etnia=Outro']
 ]);
}
pair('instituição científica e ocupação ligada','Info/Cientista','campo=[[Física]]|instituições=[[Instituto Exemplo]]|ocupação=[[Investidor]], [[empreendedor]]','campo=[[Física]]|instituicao_trabalho=[[Instituto Exemplo]]|ocupação=[[investidor]], [[empreendedor]]',[
 ['trabalho já preenchido','campo=[[Física]]|instituições=[[Instituto Exemplo]]|local_trabalho=[[Outro Instituto]]'],
 ['instituições de trabalho já preenchidas','campo=[[Física]]|instituições=[[Instituto Exemplo]]|instituicoes_trabalho=[[Outro Instituto]]'],
 ['sem campo científico','instituições=[[Instituto Exemplo]]'],
 ['campo científico vazio','campo=|instituições=[[Instituto Exemplo]]']
]);
for(const type of ['Info/Biografia','Info/Empresa','Info/Organização'])add('instituições sem contexto de cientista / '+type,page(type,'instituições=[[Instituto Exemplo]]'),page(type,'instituições=[[Instituto Exemplo]]'));
for(const key of ['sepultamento','enterro','enterro_local','influenciado','influências','influenciados','companheiro','companheira'])add('alias ou lacuna nativa preservada / '+key,page('Info/Biografia',key+'=[[Pessoa ou local Exemplo]]'),page('Info/Biografia',key+'=[[Pessoa ou local Exemplo]]'));
for(const role of [['Produtor teatral, encenador e ator','produtor teatral, encenador e ator'],['[[Empreendedor]] / [[investidor]]','[[empreendedor]] / [[investidor]]'],['[[Farmacêutico|Farmacêutica-bioquímica]]','[[Farmacêutico|farmacêutica-bioquímica]]']]){
 add('ocupação composta / '+role[0],page('Info/Político','profissão='+role[0]),page('Info/Político','profissão='+role[1]));
 add('nome citado não é ocupação / '+role[0],page('Info/Biografia','nome_completo='+role[0]),page('Info/Biografia','nome_completo='+role[0]));
}
pair('mandatos numerados e nome','Info/Político','nome_completo=Exemplo Literal|antecessor2=Antes|sucessor8=Depois','nome_comp=Exemplo Literal|antes2=Antes|depois8=Depois',[
 ['destinos ocupados','nome_completo=Exemplo Literal|nome_comp=Outro|antecessor2=Antes|antes2=Outro|sucessor8=Depois|depois8=Outro'],
 ['índice sem contrato','antecessor9=Antes|sucessor9=Depois']
]);
for(const suffix of ['', '|si','|sem idade']){
 const from='outubro {{dni|||1977'+suffix+'}}',to='{{dni||10|1977'+suffix+'}}';
 add('mês e ano parciais / '+(suffix||'sem opção'),page('Info/Biografia','nascimento_data='+from),page('Info/Biografia','nascimento_data='+to));
 add('dia já preenchido / '+suffix,page('Info/Biografia','nascimento_data=outubro {{dni|5||1977'+suffix+'}}'),page('Info/Biografia','nascimento_data=outubro {{dni|5||1977'+suffix+'}}'));
}
for(const value of ['outubro de 1977','outubro ou novembro {{dni|||1977}}','outubro {{dni|||1977}} – novembro {{dni|||1977}}','{{entre|1977|1978}}','outubro {{Outra|||1977}}'])add('intervalo ou composição sem prova / '+value,page('Info/Biografia','nascimento_data='+value),page('Info/Biografia','nascimento_data='+value),{birthDates:false});
for(const type of ['Info/Empresa','Info/Organização','Info/Sítio','Info/Website','Info/Cavalo nomeado','Info/Animal']){
 const caption=['Info/Empresa','Info/Organização'].includes(type)?'imagem_legenda':'legenda',size=type==='Info/Animal'?'tamanho':'imagem_tamanho';
 add('imagem com três destinos independentes / '+type,page(type,'imagem=[[File:Example.jpg|thumb|250px|Legenda [[Exemplo]]]]'),page(type,'imagem=Example.jpg|'+size+'=250px|'+caption+'=Legenda [[Exemplo]]'));
 add('imagem com destino vazio / '+type,page(type,'imagem=[[File:Example.jpg|thumb|250px|Legenda]]|'+size+'=|'+caption+'='),page(type,'imagem=Example.jpg|'+size+'=250px|'+caption+'=Legenda'));
 for(const [label,fields]of [['legenda conflitante','imagem=[[File:Example.jpg|thumb|Legenda]]|'+caption+'=Outra'],['tamanho conflitante','imagem=[[File:Example.jpg|thumb|250px]]|'+size+'=200px'],['texto alternativo','imagem=[[File:Example.jpg|thumb|alt=Texto|Legenda]]'],['ligação própria','imagem=[[File:Example.jpg|thumb|link=Destino|Legenda]]'],['upright','imagem=[[File:Example.jpg|thumb|upright=1.2|Legenda]]'],['opção incorreta não vira legenda','imagem=[[File:Example.jpg|semmdolura|75px]]']])add('imagem preservada / '+type+' / '+label,page(type,fields),page(type,fields));
}
const address='https://www.example.invalid/ação?a=b&c=d#Fragment',bare='www.example.invalid/ação?a=b&c=d#Fragment',external='Exemplo.\n\n== Ligações externas ==\n* ['+address+' Página oficial]';
for(const [type,key]of [['Info/Empresa','website'],['Info/Organização','website'],['Info/Biografia','website'],['Info/Político','website'],['Info/Ator','site_oficial'],['Info/Sítio','url'],['Info/Website','url'],['Info/Aeroporto','website']]){
 add('endereço com query e fragmento / '+type,page(type,key+'='+bare,external),page(type,key+'=['+address+' '+bare+']',external));
 add('rótulo preservado / '+type,page(type,key+'=[[https://example.invalid/path?a=b#f|Página oficial]]'),page(type,key+'=[https://example.invalid/path?a=b#f Página oficial]'));
 add('sem prova de protocolo / '+type,page(type,key+'='+bare),page(type,key+'='+bare));
 add('caminho diferente / '+type,page(type,key+'=www.example.invalid/other',external),page(type,key+'=www.example.invalid/other',external));
 const conflicting=external+'\n* [http://www.example.invalid/ação?a=b&c=d#Fragment Site oficial]';
 add('dois protocolos já declarados / '+type,page(type,key+'='+bare,conflicting),page(type,key+'='+bare,conflicting));
}
for(const value of ['https://example.invalid/path?a=b#f','//example.invalid/path?a=b#f','[https://example.invalid/path?a=b#f Página oficial]','{{URL|1=https://example.invalid/path?a=b#f|2=Página oficial}}','hide','-'])add('site aceito preservado / '+value,page('Info/Empresa','website='+value),page('Info/Empresa','website='+value));
for(const [source,expected]of [
 ['{{URL|https://example.invalid/?a=b&c=d#f}}','{{URL|1=https://example.invalid/?a=b&c=d#f}}'],
 ['{{URL|https://example.invalid/?a=b|Rótulo preservado}}','{{URL|1=https://example.invalid/?a=b|2=Rótulo preservado}}'],
 ['{{URL|https://example.invalid/?a=b|2=Rótulo preservado}}','{{URL|1=https://example.invalid/?a=b|2=Rótulo preservado}}']
])add('argumento posicional nativo / '+source,source,expected);
for(const s of ['{{URL|1=https://example.invalid/?a=b}}','{{URL|https://example.invalid/?a=b|1=Outro}}','{{URL|https://example.invalid/?a=b|Página|Outra}}'])add('argumentos sem mudança segura / '+s,s,s);
for(const [source,expected]of [
 ['[[File:Example.jpg|thumb|width250px|Legenda]]','[[File:Example.jpg|thumb|250px|Legenda]]'],
 ['[[File:Example.jpg|thumb|vertical|Legenda]]','[[File:Example.jpg|thumb|Legenda]]'],
 ['{|\n| [[File:Example.png|semmdolura|75x75px]]\n|}','{|\n| [[File:Example.png|semmdolura|75x75px]]\n|}'],
 ['[[File:Example.jpg|thumb|vertical]]','[[File:Example.jpg|thumb|vertical]]'],
 ['[[File:Example.jpg|thumb|width1200px|Legenda]]','[[File:Example.jpg|thumb|width1200px|Legenda]]']
])add('opções de imagem em papel nativo / '+source,source,expected,{automaticTableRepairs:false,tableAccessibility:false,tableSyntaxRepairs:false});
for(const owner of ['nowiki','pre','syntaxhighlight','source','gallery','math']){
 const literal='<'+owner+'>{{Info/Cientista|nome=Exemplo|campo=Física|instituições=Instituto|occupation=Investidor|nascimento_data=outubro {{dni|||1977}}}}\n[[File:Example.jpg|thumb|vertical|Legenda]]\n{{URL|https://example.invalid/?a=b}}</'+owner+'>';
 add('dono literal protegido / '+owner,literal,literal);
}
const personal=page('Info/Cientista','campo=[[Física]]|instituições=[[Instituto Exemplo]]|occupation=Investidor|ethnicity=Literal|nascimento_data=outubro {{dni|||1977|sem idade}}|website=[[https://example.invalid|Página]]');
const personalExpected=page('Info/Cientista','campo=[[Física]]|instituicao_trabalho=[[Instituto Exemplo]]|ocupação=investidor|etnia=Literal|nascimento_data={{dni||10|1977|sem idade}}|website=[https://example.invalid Página]');
add('combinação pessoal de campos e valores',personal,personalExpected);
// Explicit portal context controls exercise the same whole-action writer.
for(const [fields,footer,want]of [['nascimento_local=[[Paris]], [[França]]','','{{Portal3|França}}'],['nascimento_local=[[Paris]]','',''],['nascimento_local=[[Paris]], [[França]]|local_nascimento=[[Lisboa]], [[Portugal]]','',''],['nascimento_local=[[São Paulo]], [[Brasil]]','{{Portal3|São Paulo}}','{{Portal3|São Paulo}}']]){
 const source=page('Info/Biografia',fields)+(footer?'\n\n'+footer:'');
 cases.push({name:'país literal, estado ou conflito / '+fields,source,options:{automaticBiographyPortals:true},mustContain:want||null,forbid:want?null:'{{Portal3|'});
}

for(const [lead,addEngineering]of [["'''Exemplo''' é uma [[Engenheiro|engenheira civil]].",true],["'''Outra pessoa''' é uma [[engenheira civil]].",false],["'''Exemplo''' é uma [[engenheira civil|escritora]].",false]]){
 const source=page('Info/Cientista','campo=[[Engenharia]]',lead);cases.push({name:'identidade e rótulo da profissão / '+lead,source,options:{automaticBiographyPortals:true},mustContain:addEngineering?'|Engenharia':null,forbid:addEngineering?null:'|Engenharia'});
}

function human(source){return {source,title:'Exemplo',namespace:0,fullPage:true,redirect:false,disambiguation:false,entityId:'Q123',entity:{id:'Q123',type:'item',sitelinks:{ptwiki:{title:'Exemplo'}},claims:{P31:[{rank:'normal',qualifiers:{},mainsnak:{snaktype:'value',datatype:'wikibase-item',datavalue:{type:'wikibase-entityid',value:{'entity-type':'item',id:'Q5'}}}}]}}};}
const generic=page('Info','rótulo1=Nome|dados1=Exemplo');
for(const [label,mutate]of [['válida',p=>{}],['fonte antiga',p=>{p.source+=' ';}],['título diferente',p=>{p.title='Outro';}],['sitelink diferente',p=>{p.entity.sitelinks.ptwiki.title='Outro';}],['entidade não humana',p=>{p.entity.claims.P31[0].mainsnak.datavalue.value.id='Q43229';}],['declaração obsoleta',p=>{p.entity.claims.P31[0].rank='deprecated';}],['declaração qualificada',p=>{p.entity.claims.P31[0].qualifiers={P580:[{}]};}]]){
 const proof=human(generic);mutate(proof);cases.push({name:'prova de pessoa / '+label,source:generic,options:{automaticBiographyPortals:true,v220HumanProof:proof},mustContain:label==='válida'?'{{Portal3|Biografias}}':null,forbid:label==='válida'?null:'{{Portal3|'});
}
let checks=0;
(async()=>{
 for(const c of cases){const opts={...config,...c.options},r=await api.calculate({kind:'adjust',source:c.source,originalSource:c.source,options:opts}),decision=api.v219AutomaticResultSafety(c.source,r);assert(decision.accepted,JSON.stringify({name:c.name,decision}));checks++;assert.equal(r.preservation.length,0,c.name);checks++;
  if(c.expected!==undefined){assert.equal(r.text.trimEnd(),c.expected.trimEnd(),JSON.stringify({name:c.name,actual:r.text,expected:c.expected}));checks++;}
  if(c.mustContain){assert(r.text.includes(c.mustContain),JSON.stringify({name:c.name,text:r.text,want:c.mustContain}));checks++;}
  if(c.forbid){assert(!r.text.includes(c.forbid),JSON.stringify({name:c.name,text:r.text,forbid:c.forbid}));checks++;}
 }
 console.log(JSON.stringify({suite:'v220-bio-campaign',cases:cases.length,checks,status:'passed'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
