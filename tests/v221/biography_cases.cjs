'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const a=require('./biography_harness.cjs'),cfg={...a.defaults,namespaceNumber:0,pageTitle:'Exemplo',automaticBiographyPortals:false,automaticTopicPortals:false,portals:false};
const report={kind:'v221-biography-finite-contracts',runtime:a.__biographyTestHarness,checks:0,cases:[],failures:[],wikipediaWrites:0};
const wholeCases=[];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function test(id,source,expected=source,options={},exactWholeExpected){
 const c={...cfg,...options};let p;wholeCases.push({id,source,expected:exactWholeExpected??expected,options:c,...(exactWholeExpected!==undefined?{exactWholeExpected}:{})});
 try{p=a.v221BiographyPlan(source,c);assert.equal(p.text,expected,id);report.checks++;
  assert(a.v221BiographyProof(source,p.text,p,c),id+' proof');report.checks++;
  assert.equal(a.v221BiographyPlan(p.text,c).text,p.text,id+' idempotent');report.checks++;
  if(source!==expected){assert.equal(a.v221BiographyProof(source,expected+'X',p,c),false);report.checks++;
   const forged=structuredClone(p);forged.edits[0].proof.owner='Other';assert.equal(a.v221BiographyProof(source,expected,forged,c),false);report.checks++;}
  report.cases.push({id,status:'passed',sourceSha256:hash(source),outputSha256:hash(p.text),ruleIds:[...new Set(p.edits.map(e=>e.ruleId))]});
 }catch(error){report.failures.push({id,error:error.message});report.cases.push({id,status:'failed'});}
 return p;
}
const box=(owner,fields,tail='Exemplo.\n\n[[Categoria:Exemplos]]')=>'{{'+owner+'|nome=Exemplo|'+fields+'}}\n\n'+tail;
function entity(source,claims={}){return {source,title:'Exemplo',namespace:0,fullPage:true,redirect:false,disambiguation:false,claimsComplete:true,
 entityId:'Q123',entity:{id:'Q123',lastrevid:1,sitelinks:{ptwiki:{title:'Exemplo'}},claims}};}
let n=0;
for(const m of a.V221_INFOBOX_MAPPINGS){
 const dimension=['BIO-X08','IBX-06','IBX-10','IBX-22'].includes(m.family)&&/(?:tamanho|largura|Width|image_size|imagesize|igmw)/i.test(m.from),
  caption=['BIO-X09','IBX-06','IBX-07','IBH-07'].includes(m.family)&&/(?:legenda|imagem-alt)/i.test(m.from);
 const value=m.family==='BIO-X13'&&/^vitorias_/.test(m.from)?'12–3':m.from==='premiacao'?'US$ 1234<ref name="A">Fonte.</ref>':
  m.from==='icao'?'SBGL<ref name="A">Fonte.</ref>':m.owner==='Info/Aeroporto'&&m.from==='site'?'https://example.invalid<ref name="A">Fonte.</ref>':
  m.family==='IBH-05'&&m.to==='populacao'?'1234<ref name="A">Fonte.</ref>':m.to==='perc_água'?'12.5<ref name="A">Fonte.</ref>':
  m.family==='IBH-08'&&['data_lançamento','data_encerramento'].includes(m.to)?'2020<ref name="A">Fonte.</ref>':
  m.property?'00123':m.family==='IBH-04'?'12.34':m.family==='BIO-X12'&&/^Resultadograndslam/.test(m.to)?'sim':m.to==='logo'?'Example.svg':m.to==='censo_data'?'2020':dimension?'250px':'Valor preservado<ref name="A">Fonte.</ref>';
 const prefix=(dimension||caption?'imagem=Example.jpg|':'')+(m.family==='BIO-X09'&&m.owner==='Info/Futebolista'?'imagem_tamanho=250px|':'')+
  (m.family==='BIO-X11'?(m.to==='jovemclubes'?'jovemanos=2020|':'ano=2020|clubes=Clube exemplo|'):'')+
  (m.from==='payload-location'?'carga útil-LEO=1000 kg|payload=100 kg|':'')+(m.family==='IBH-05'&&m.to==='populacao'?'censo_data=2020|':''),
  source=box(m.owner,prefix+m.from+'='+value).replace(m.aliases.includes('nome')?'|nome=Exemplo':'NONMATCH',''),
  expected=source.replace('|'+m.from+'=','|'+m.to+'='),options=m.property?{v221InfoboxEntityProof:entity(source)}:{};
 test('map-'+(++n)+'-'+m.family+'-'+m.from,source,expected,options);
 if(/<ref\b/.test(source)){
  const withRenderer=source.replace('[[Categoria:Exemplos]]','{{Referências}}\n\n[[Categoria:Exemplos]]'),
   withBodyReference=source.replace('Exemplo.\n\n[[Categoria:Exemplos]]','Exemplo com fonte no corpo.<ref name="B">Fonte no corpo.</ref>\n\n[[Categoria:Exemplos]]');
  test('map-'+n+'-reference-existing-renderer',withRenderer,withRenderer.replace('|'+m.from+'=','|'+m.to+'='),m.property?{v221InfoboxEntityProof:entity(withRenderer)}:{});
  test('map-'+n+'-reference-active-body',withBodyReference,withBodyReference.replace('|'+m.from+'=','|'+m.to+'='),m.property?{v221InfoboxEntityProof:entity(withBodyReference)}:{});
 }
 test('map-'+n+'-filled-destination',source.replace('}}\n\n','|'+m.to+'=Outro}}\n\n'),undefined,{});

 for(const alias of m.aliases.filter(alias=>alias!==m.from&&alias!==m.to)){
  const conflict=source.replace('}}\n\n','|'+alias+'=Outro}}\n\n');test('map-'+n+'-alias-filled-'+alias,conflict);
  const emptyAlias=source.replace('}}\n\n','|'+alias+'= }}\n\n');test('map-'+n+'-alias-empty-'+alias,emptyAlias,a.V221_INFOBOX_CONTRACTS[m.owner].consumed.includes(alias)?emptyAlias:emptyAlias.replace('|'+m.from+'=','|'+m.to+'='),m.property?{v221InfoboxEntityProof:entity(emptyAlias)}:{});
 }
 const repeated=source.replace('}}\n\n','|'+m.from+'=Outro}}\n\n');test('map-'+n+'-duplicate-source',repeated);
 test('map-'+n+'-wrong-owner',box('Info/Unknown',m.from+'='+value));
 test('map-'+n+'-disabled',source,source,{...options,infoboxes:false});
 if(['Info/Ator','Info/Político'].includes(m.owner)&&m.from==='ocupacao'&&m.to==='ocupação')
  test('map-'+n+'-legacy-value-option-off',source,source,{...options,automaticInfoboxValues:false});
 test('map-'+n+'-talk-namespace',source,source,{...options,namespaceNumber:1});
 test('map-'+n+'-section-only',source,source,{...options,sectionOnly:true});
 test('map-'+n+'-nested-owner','{{Outro|'+source+'}}');
 test('map-'+n+'-table-owner','{| class="wikitable"\n|\n'+source+'\n|}');
 test('map-'+n+'-html-owner','<div class="example">\n'+source+'\n</div>');
 test('map-'+n+'-reference-owner','Texto<ref>\n'+source+'\n</ref>\n\n{{Referências}}');
 test('map-'+n+'-embedded-owner',source.replace('|'+m.from+'=','|child=yes|'+m.from+'='));
 test('map-'+n+'-commented-owner','<!--'+source+'-->');
 const protectedSource='<nowiki>'+source+'</nowiki>';test('map-'+n+'-literal',protectedSource);
 if(!m.property){const empty=source.replace('}}\n\n','|'+m.to+'= \n}}\n\n');test('map-'+n+'-empty-target',empty,expected);}
 else{test('map-'+n+'-no-entity-proof',source);const wrong=entity(source);wrong.source+=' ';test('map-'+n+'-stale-proof',source,source,{v221InfoboxEntityProof:wrong});
  const claim={rank:'normal',mainsnak:{property:m.property,snaktype:'value',datavalue:{value:'999'}}};test('map-'+n+'-conflicting-entity',source,source,{v221InfoboxEntityProof:entity(source,{[m.property]:[claim]})});}
}
test('same-key-empty-before',box('Info/Biografia','ocupação= \n|ocupação=[[Ator]]'),box('Info/Biografia','ocupação=[[Ator]]'));
test('same-key-identical-header-comment','{{Info/Biografia<!-- manter -->|nome=Exemplo|ocupação=Ator|ocupação=Ator}}\nExemplo.','{{Info/Biografia<!-- manter -->|nome=Exemplo|ocupação=Ator}}\nExemplo.');
test('same-key-comment-value-preserved',box('Info/Biografia','ocupação=<!-- manter -->|ocupação=Ator'));
test('same-key-different-values-preserved',box('Info/Biografia','ocupação=Ator|ocupação=Escritor'));
test('same-key-calls-preserved',box('Info/Biografia','ocupação={{Outro}}|ocupação={{Outro}}'));
const immediate="{{Info/Político|nome=Exemplo}}'''Exemplo''' foi uma pessoa.";
test('box-immediately-before-lead',immediate,immediate.replace("}}'''","}}\n'''"));
test('box-inline-normal-text','Texto {{Info/Político|nome=Exemplo}} exemplo.');
for(const typo of ['miniaturada','miniaturada-imagem','miniaturada imagem','thump','rigth','lefth']){
 const source='[[Ficheiro:Example.jpg|'+typo+"|220px|Cena de ''Filme exemplo'']]",want=source.replace(typo,typo==='rigth'?'direita':typo==='lefth'?'esquerda':'miniatura');
 test('image-'+typo,source,want);
 test('image-'+typo+'-caption-only','[[Ficheiro:Example.jpg|'+typo+']]');
 test('image-'+typo+'-unbalanced',source.replace("Filme exemplo''","Filme exemplo'"));
 test('image-'+typo+'-inside-template','{{Outro|'+source+'}}');
 test('image-'+typo+'-competing',source.replace('|220px','|left|right|220px'));
}
for(const owner of ['Info/Galáxia','Info/Estrela','Info/Asteroide']){
 const source=box(owner,'id=123'),o={portals:true,automaticTopicPortals:true};test('astronomy-'+owner,source,source.replace('[[Categoria:Exemplos]]','{{Portal3|Astronomia}}\n[[Categoria:Exemplos]]'),o);
 test('astronomy-'+owner+'-qid',box(owner,'qid=Q1'),undefined,o);
 test('astronomy-'+owner+'-second-box',source+'\n{{Info/Filme}}',undefined,o);
}
for(const stub of ['Esboço-ator','Esboço-empresa','Esboço-pintor']){
 const source=box('Info/Empresa','nome_empresa=Exemplo','Exemplo.\n\n{{'+stub+'}}\n[[Categoria:Exemplos]]'),o={portals:true,automaticTopicPortals:true};
 test('footer-'+stub,source,source.replace('[[Categoria:Exemplos]]','\n{{Portal3|Empresas}}\n[[Categoria:Exemplos]]'),o);
}
for(const owner of ['Info/Ator','Info/Filme']){
 const type=owner==='Info/Ator'?'nome':'título',source=box(owner,'imdb=1234567','Exemplo.\n\n== Ligações externas ==\n* {{IMDb '+type+'|1234567}}');
 test('redundant-imdb-'+owner,source,source.replace('|imdb=1234567',''));
 test('imdb-ref-retained-'+owner,source.replace('imdb=1234567','imdb=1234567<ref>Fonte.</ref>'));
 test('imdb-mismatch-'+owner,source.replace('IMDb '+type+'|1234567','IMDb '+type+'|7654321'));
 for(const args of ['id=1234567|1=7654321','1234567|1=7654321','id=1234567|id=7654321','id=1234567|7654321',
  '1=1234567|7654321','1234567|id=1234567','1234567|nome=A|name=B'])
  test('imdb-conflicting-external-binding-'+owner+'-'+args,source.replace('IMDb '+type+'|1234567','IMDb '+type+'|'+args));
 for(const args of ['id=1234567','1=1234567','1234567|Nome fictício','1234567|2=Nome fictício','id=1234567|2=Nome fictício','id=1234567|nome=Nome fictício','1=1234567|name=Nome fictício']){
  const labeled=source.replace('IMDb '+type+'|1234567','IMDb '+type+'|'+args);
  test('imdb-owned-external-binding-'+owner+'-'+args,labeled,labeled.replace('|imdb=1234567',''));
 }
}

for(const month of ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']){
 const n=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'].indexOf(month)+1;
 const source=box('Info/Ciclista','nascimento_data=1 de '+month+' de 1986');
 test('specialized-date-'+month,source,source.replace('1 de '+month+' de 1986','{{DataExt|1|'+n+'|1986}}'));
 test('specialized-date-disabled-'+month,source,source,{dates:false});
 const partial=box('Info/Ciclista','nascimento_data='+month+' {{dni|||1977|si}}');
 test('specialized-partial-date-'+month,partial,partial.replace(month+' {{dni|||1977|si}}','{{dni||'+n+'|1977|si}}'));
}
for(const value of ['29 de fevereiro de 2001','31 de abril de 1986','1986','janeiro de 1986','{{dni|1|1|1986|si}}','1 ou 2 de janeiro de 1986'])test('specialized-date-preserve-'+value,box('Info/Ciclista','nascimento_data='+value));
test('latitude-out-of-range',box('Info/Agência do governo','latg=120'));
test('longitude-out-of-range',box('Info/Agência do governo','longg=181'));
test('latitude-fractional-with-minutes',box('Info/Agência do governo','latg=12.3|latm=30'));
test('latitude-signed-with-hemisphere',box('Info/Agência do governo','latg=-12|latNS=N'));
test('longitude-signed-with-native-hemisphere',box('Info/Agência do governo','longg=-12|longLO=E'));
test('longitude-fractional-with-minutes',box('Info/Agência do governo','longg=12.3|longm=30'));
test('census-not-a-year',box('Info/Condado dos Estados Unidos','censo_ano=ano desconhecido'));
test('taxon-pixel-unit-not-invented',box('Info/Taxonomia','imagem=Example.jpg|imagem_tamanho=250'));
const clubAlias=box('Info/Clube de futebol','img=Example.jpg|legenda=Legenda preservada');
test('image-native-club-img-alias',clubAlias,clubAlias.replace('|legenda=','|imagem_legenda='));
test('image-native-club-competing-alias',box('Info/Clube de futebol','imagem=Example.jpg|img=Other.jpg|legenda=Legenda preservada'));
for(const key of ['Imagem','image','imagem']){
 const s=box('Info/Patologia',key+'=Example.jpg|Width=250px');test('image-pathology-native-'+key,s,s.replace('|Width=','|Largura='));
}
const ignoredImage=box('Info/Ator','image=Example.jpg|imagesize=250px');
test('image-ignored-alias-not-component-proof',ignoredImage,ignoredImage,{},ignoredImage.replace('|image=','|imagem=').replace('|imagesize=','|imagem_tamanho='));
test('image-native-plus-ignored-conflict',box('Info/Ator','imagem=Other.jpg|image=Example.jpg|imagesize=250px'));
const nativePhoto=box('Info/Biografia','foto=Example.jpg|tamanho_imagem=250px');
test('image-native-biography-photo-alias',nativePhoto,nativePhoto.replace('|tamanho_imagem=','|imagem_tamanho='));
test('comment-prefix-owner','<!-- manter -->'+box('Info/Biografia','nome completo=Pessoa'),('<!-- manter -->'+box('Info/Biografia','nome_completo=Pessoa')));
test('comment-in-template-header','{{Info/Biografia<!-- manter -->|nome completo=Pessoa}}\nExemplo.','{{Info/Biografia<!-- manter -->|nome_completo=Pessoa}}\nExemplo.');
test('image-existing-thumbnail-italic',"[[Ficheiro:Example.jpg|thumb|miniaturada|220px|Cena de ''Filme'']]", "[[Ficheiro:Example.jpg|thumb|220px|Cena de ''Filme'']]");


for(const key of ['nometenista','nomecompleto','Resultadograndslamsimples','Resultadograndslamduplas']){assert(a.v221InfoboxKnownField('Info/Tenista',key),key);report.checks++;}
assert(a.v221InfoboxKnownField('Info/Biografia','nascimento_cidade'));report.checks++;
assert.equal(a.v221InfoboxKnownField('Info/Tenista','not-a-parameter'),false);report.checks++;
const clinical=box('Info/Patologia','ICDO=00123'),proof=entity(clinical);assert.deepEqual(a.v221InfoboxEntityRequests(clinical,{...cfg}),['P563']);report.checks++;
for(const [label,mutate] of [['wrong-title',x=>x.title='Outro'],['wrong-entity',x=>x.entity.id='Q9'],['no-revision',x=>delete x.entity.lastrevid],['incomplete-claims',x=>x.claimsComplete=false],['wrong-sitelink',x=>x.entity.sitelinks.ptwiki.title='Outro']]){const wrong=structuredClone(proof);mutate(wrong);test('entity-'+label,clinical,clinical,{v221InfoboxEntityProof:wrong});}
const sameClaim={rank:'normal',mainsnak:{property:'P563',snaktype:'value',datavalue:{value:'00123'}}};test('entity-same-literal',clinical,clinical.replace('ICDO=','CIDO='),{v221InfoboxEntityProof:entity(clinical,{P563:[sameClaim]})});
// Absence of a property is evidence only within a complete claims object.
// JSON primitives, including truthy values, cannot prove that absence.
for(const [label,claims]of [['null',null],['array',[]],['empty-string',''],['string','not-an-object'],['false',false],['true',true],['zero',0],['one',1],['number',13]]){
 const malformed=entity(clinical,claims);test('entity-claims-schema-'+label,clinical,clinical,{v221InfoboxEntityProof:malformed});
}
test('entity-claims-schema-valid-empty-object',clinical,clinical.replace('ICDO=','CIDO='),{v221InfoboxEntityProof:entity(clinical,{})});
for(const [label,mutate] of [['qualified',x=>x.qualifiers={P580:[{}]}],['deprecated',x=>x.rank='deprecated'],['unknown-value',x=>x.mainsnak.snaktype='somevalue'],['other-property',x=>x.mainsnak.property='P557']]){const bad=structuredClone(sameClaim);mutate(bad);test('entity-claim-'+label,clinical,clinical,{v221InfoboxEntityProof:entity(clinical,{P563:[bad]})});}
// These cases are authored from native consumer expressions and the approved
// plan, independently of the runtime's own mapping/alias lists.
for(const row of require('./biography_predicate_legacy_counterexamples.json'))
 test('original-unqualified-positive-now-preserved-'+row.id,row.source,row.source,row.options);
for(const [index,row]of require('./biography_alias_counterexamples.json').entries()){
 const dimension=/^(?:imagesize|tamanho_imagem|tamanho|imagem_tamanho)$/.test(row.from),
  image=dimension||row.from==='iamgem_legenda'||row.from==='legenda-imagem'?'imagem=Example.jpg|':'',
  source=box(row.owner,image+row.from+'='+(dimension?'250px':'Valor novo')+'|'+row.competingKey+'='+(dimension?'300px':'Valor anterior'))
   .replace(row.competingKey==='nome'?'|nome=Exemplo':'NONMATCH','');
 test('native-alias-independent-'+index,source);
}
for(const [id,owner,fields]of [
 ['binomial-family','Info/Taxonomia','binominal=Canidae'],
 ['binomial-abbreviation','Info/Taxonomia','binominal=C. lupus'],
 ['binomial-trinomial','Info/Taxonomia','binominal=Canis lupus familiaris'],
 ['binomial-computed','Info/Taxonomia','binominal={{Nome científico}}'],
 ['wins-only','Info/Tenista','vitorias_simples=12'],
 ['doubles-wins-only','Info/Tenista','vitorias_duplas=12'],
 ['money-honour','Info/Tenista','premiacao=Medalha de ouro'],
 ['money-list','Info/Tenista','premiacao=US$ 100; medalha'],
 ['money-invalid-punctuation','Info/Tenista','premiacao=US$ 1..2'],
 ['icao-three-letters','Info/Aeroporto','icao=GIG'],
 ['icao-five-letters','Info/Aeroporto','icao=SBGLA'],
 ['icao-numeric','Info/Aeroporto','icao=1234'],
 ['website-plain-text','Info/Aeroporto','site=Página oficial'],
 ['website-credential','Info/Aeroporto','site=https://user:secret@example.invalid/'],
 ['website-bare-host','Info/Aeroporto','site=example.invalid'],
 ['payload-no-pair','Info/Foguete','carga útil-LEO=1000 kg|payload-location=Órbita baixa'],
 ['payload-other-pair','Info/Foguete','carga útil-LEO=1000 kg|payload2=100 kg|payload-location=Órbita baixa'],
 ['payload-inactive-branch','Info/Foguete','payload=100 kg|payload-location=Órbita baixa'],
 ['payload-custom-capacity','Info/Foguete','capacidades=Tabela própria|payload=100 kg|payload-location=Órbita baixa'],
 ['caption-inactive-branch','Info/Futebolista','imagem=Example.jpg|legenda=Legenda preservada'],
 ['caption-invalid-size','Info/Futebolista','imagem=Example.jpg|imagem_tamanho=50%|legenda=Legenda preservada'],
 ['caption-image-wikilink','Info/Futebolista','imagem=[[Ficheiro:Example.jpg|miniatura]]|imagem_tamanho=250px|legenda=Legenda preservada'],
 ['youth-list-mismatch','Info/Futebolista','jovemanos=2000<br/>2001|jovemclube=Clube A'],
 ['youth-no-years','Info/Futebolista','jovemclube=Clube A'],
 ['career-list-mismatch','Info/Futebolista','ano=2000<br/>2001|clubes=Clube A<br/>Clube B|jogos (golos)=10 (1)'],
 ['career-computed-count','Info/Futebolista','ano={{Anos}}|clubes=Clube A|jogos (golos)=10 (1)'],
 ['career-unconsumed-years','Info/Futebolista','anos=2000|clubes=Clube A|jogos (golos)=10 (1)'],
 ['county-no-census','Info/Condado dos Estados Unidos','população=100'],
 ['county-only-estimate','Info/Condado dos Estados Unidos','censo_data_estimada=2025|população=100'],
 ['county-other-population-year','Info/Condado dos Estados Unidos','censo_data=2020|população_ano=2025|população=100'],
 ['county-percent-area','Info/Condado dos Estados Unidos','área_água_p=50 km²'],
 ['county-percent-fraction-with-unit','Info/Condado dos Estados Unidos','área_água_p=50%'],
 ['county-percent-range','Info/Condado dos Estados Unidos','área_água_p=101'],
 ['channel-not-a-date','Info/Canal de televisão','extinção=ativo'],
 ['channel-impossible-date','Info/Canal de televisão','extinção=31 de fevereiro de 2020'],
 ['channel-future-year','Info/Canal de televisão','extinção=3000']
]){
 const source=box(owner,fields),proof=entity(source);
 test('approved-predicate-negative-'+id,source,source,{v221InfoboxEntityProof:proof});
}
for(const [id,owner,fields,from,to]of [
 ['binomial','Info/Taxonomia',"binominal=''Canis lupus''",'binominal','binomial'],
 ['money-prefix','Info/Tenista','premiacao=US$ 1,234.50','premiacao','premiosganhos'],
 ['money-suffix','Info/Tenista','premiacao=1.234,50 BRL','premiacao','premiosganhos'],
 ['icao','Info/Aeroporto','icao=SBGL','icao','código_ICAO'],
 ['website','Info/Aeroporto','site=[https://example.invalid Página oficial]','site','website'],
 ['payload-pair','Info/Foguete','carga útil-LEO=1000 kg|payload=100 kg|payload-location=Órbita baixa','payload-location','carga útil-localização'],
 ['caption-active','Info/Futebolista','imagem=Example.jpg|imagem_tamanho=250px|legenda=Legenda preservada','legenda','imagem_legenda'],
 ['youth-lists','Info/Futebolista','jovemanos=2000<br/>2001|jovemclube=Clube A<br/>Clube B','jovemclube','jovemclubes'],
 ['career-lists','Info/Futebolista','ano=2000<br/>2001|clubes=Clube A<br/>Clube B|jogos (golos)=10 (1)<br/>20 (2)','jogos (golos)','jogos(golos)'],
 ['county-pair','Info/Condado dos Estados Unidos','censo_data=2020|população=100','população','populacao'],
 ['county-percent','Info/Condado dos Estados Unidos','área_água_p=12.5','área_água_p','perc_água'],
 ['channel-year','Info/Canal de televisão','extinção=2020','extinção','data_encerramento'],
 ['channel-date','Info/Canal de televisão','extinção={{DataExt|1|1|2020}}','extinção','data_encerramento']
]){const source=box(owner,fields);test('approved-predicate-positive-'+id,source,source.replace('|'+from+'=','|'+to+'='));}
for(const [from,to,property]of [['vitorias_simples','vitoriasderrotassimples','P564'],['vitorias_duplas','vitoriasderrotasduplas','P555']]){
 const source=box('Info/Tenista',from+'=12–3'),target=source.replace('|'+from+'=','|'+to+'=');
 test('wins-pair-absent-'+property,source,target,{v221InfoboxEntityProof:entity(source,{})});
 const claim={rank:'normal',mainsnak:{property,snaktype:'value',datavalue:{value:'12–3'}}};
 test('wins-pair-matching-'+property,source,target,{v221InfoboxEntityProof:entity(source,{[property]:[claim]})});
 test('wins-pair-conflicting-'+property,source,source,{v221InfoboxEntityProof:entity(source,{[property]:[{...claim,mainsnak:{...claim.mainsnak,datavalue:{value:'12–4'}}}]})});
 test('wins-pair-no-proof-'+property,source);
}
test('clinical-conditional-value',box('Info/Patologia','simtomas={{#if:x|Dor|Febre}}'));


const disabledSoftware=box('Info/Software','qid=none|repo=https://example.invalid/source');test('software-explicitly-disabled-wikidata',disabledSoftware,disabledSoftware.replace('|repo=','|repositório='));
assert.deepEqual(a.v221InfoboxEntityRequests(disabledSoftware,{...cfg}),[]);report.checks++;

for(const key of ['sepultamento','nascimento_cidade','influenciado_por','etnicidade','tese_ano','título9','mandato_início2'])test('study-preserved-'+key,box('Info/Biografia',key+'=Valor preservado'));
for(const [owner,keys]of Object.entries({'Info/Biografia':['influências','influenciados'],'Info/Cientista':['influenciado','religiao'],
 'Info/Ator':['papéis_notáveis'],'Info/Música/artista':['influências']}))for(const key of keys){
 const source=box(owner,key+'= \n');test('empty-unknown-'+owner+'-'+key,source,box(owner,'').replace('|}}','}}'));
 test('empty-unknown-populated-'+owner+'-'+key,box(owner,key+'=Informação preservada'));
 test('empty-unknown-comment-'+owner+'-'+key,box(owner,key+'=<!-- manter -->'));
 test('empty-unknown-ref-'+owner+'-'+key,box(owner,key+'=<ref>Fonte.</ref>'));
 test('empty-unknown-disabled-'+owner+'-'+key,source,source,{automaticParameterNames:false});
}
for(const [id,owner,key]of [
 ['IBX-18','Info/Empresa','rendimento_líquido'],['IBX-STUDY-01','Info/Química','ponto_ebulição'],
 ['IBX-STUDY-02','Info/Fármaco','metabolitos'],['IBX-STUDY-03','Info/Biografia','nascimento_cidade'],
 ['IBX-STUDY-04','Info/Taxonomia','P31'],['BIO-ST2','Info/Biografia','campo_desconhecido'],
 ['BIO-ST3','Info/Biografia','influenciado_por'],['BIO-ST4','Info/Político','mandato_início9'],
 ['BIO-ST5','Info/Cientista','tese_ano'],['BIO-ST6','Info/Biografia','etnicidade'],
 ['BIO-ST7','Info/Futebolista','olímpico'],['BIO-ST8','Info/Biografia','descrição']
])test('family-study-preserved-'+id,box(owner,key+'=Informação com referência<ref>Fonte.</ref>'));
if(process.env.REVISAWIKI_BIO_REPORT)fs.writeFileSync(process.env.REVISAWIKI_BIO_REPORT,JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks,cases:report.cases.length,failures:report.failures.slice(0,10)}));if(report.failures.length)process.exitCode=1;

module.exports={cases:wholeCases};
