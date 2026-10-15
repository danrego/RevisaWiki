const qa = require('./harness.cjs');
'use strict';
const assert=require('node:assert/strict');
const {cleanup,infoboxCatalog}=qa.api;
let passed=0,failed=0;
function check(label,input,expected,warningPattern,options){
 try{const r=cleanup(input,options);assert.equal(r.text,expected);assert.equal(cleanup(r.text,options).text,r.text,'Not idempotent');if(warningPattern)assert.ok(r.warnings.some(w=>warningPattern.test(w)),'Expected warning '+warningPattern);passed++;}
 catch(e){failed++;console.log('FAIL',label,e.message);}
}
check('Music instruments typo','{{Info/Música/artista|instrumentos notáveis=[[Contrabaixo]]}}','{{Info/Música/artista|instrumentos_notáveis=[[Contrabaixo]]}}');
check('Music instruments conflict retained','{{Info/Música/artista|instrumentos notáveis=Violino|instrumentos_notáveis=Piano}}','{{Info/Música/artista|instrumentos notáveis=Violino|instrumentos_notáveis=Piano}}',/conflita/);
check('Music instruments equal dedup','{{Info/Música/artista|instrumentos notáveis=Violino|instrumentos_notáveis=Violino}}','{{Info/Música/artista|instrumentos_notáveis=Violino}}');
check('Music instruments canonical empty filled','{{Info/Música/artista|instrumentos notáveis=Violino|instrumentos_notáveis=}}','{{Info/Música/artista|instrumentos_notáveis=Violino}}');
check('Music instruments source empty removed','{{Info/Música/artista|instrumentos notáveis=|instrumentos_notáveis=Violino}}','{{Info/Música/artista|instrumentos_notáveis=Violino}}');
check('Music legacy alias unchanged','{{Info/Música/artista|falecimento=1 de janeiro de 2000}}','{{Info/Música/artista|falecimento=1 de janeiro de 2000}}');
check('Music date and place not collapsed','{{Info/Música/artista|falecimento=São Paulo|morte_local=São Paulo}}','{{Info/Música/artista|falecimento=São Paulo|morte_local=São Paulo}}');
check('Music equal date aliases dedup','{{Info/Música/artista|falecimento=1 de janeiro de 2000|morte_data=1 de janeiro de 2000}}','{{Info/Música/artista|falecimento=1 de janeiro de 2000}}');
check('Music conflicting date aliases retain','{{Info/Música/artista|falecimento=1 de janeiro de 2000|morte_data=2 de janeiro de 2000}}','{{Info/Música/artista|falecimento=1 de janeiro de 2000|morte_data=2 de janeiro de 2000}}',/valores diferentes/);
check('Biography dialect not flattened','{{Info/Biografia|género=Poesia|gênero=Poesia|pseudónimo=X|pseudônimo=X}}','{{Info/Biografia|género=Poesia|gênero=Poesia|pseudónimo=X|pseudônimo=X}}');
check('Biography accepted alias unchanged','{{Info/Biografia|data_nascimento=1 de janeiro de 2000|foto=A.jpg}}','{{Info/Biografia|data_nascimento=1 de janeiro de 2000|foto=A.jpg}}');
check('Biography unknown accented typo corrected','{{Info/Biografia|ocupacoes=Músico}}','{{Info/Biografia|ocupação=músico}}');
check('Biography accepted conflict preserved','{{Info/Biografia|data_nascimento=A|nascimento_data=B}}','{{Info/Biografia|data_nascimento=A|nascimento_data=B}}',/valores diferentes/);
assert.ok(infoboxCatalog['info/biografia'].partial);
check('Partial Biography profile preserves unconfirmed honorific without a verdict','{{Info/Biografia|prefixo_honorário=Dr.}}','{{Info/Biografia|prefixo_honorário=Dr.}}');
check('Assentamento scale migration','{{Info/Assentamento|coord_escala=250000}}','{{Info/Assentamento|coord_sufixo=scale:250000}}');
check('Assentamento scale conflict retained','{{Info/Assentamento|coord_escala=250000|coord_sufixo=type:city}}','{{Info/Assentamento|coord_escala=250000|coord_sufixo=type:city}}',/conflita/);
check('Assentamento scale empty destination filled','{{Info/Assentamento|coord_escala=250000|coord_sufixo=}}','{{Info/Assentamento|coord_sufixo=scale:250000}}');
check('Assentamento scale invalid preserved','{{Info/Assentamento|coord_escala=1:250000}}','{{Info/Assentamento|coord_escala=1:250000}}',/inteiro positivo/);
check('Marrocos scale preserved','{{Info/Assentamento/Marrocos|com|nome=Chahda|coord_escala=250000}}','{{Info/Assentamento/Marrocos|com|nome=Chahda|coord_escala=250000}}');
check('Film runtime minutes','{{Info/Filme|runtime=134 minutes}}','{{Info/Filme|duração=134}}');
check('Film runtime Portuguese minutes','{{Info/Filme|runtime=134 minutos}}','{{Info/Filme|duração=134}}');
check('Film runtime unit-less','{{Info/Filme|runtime=134}}','{{Info/Filme|duração=134}}');
check('Film runtime hours preserves','{{Info/Filme|runtime=2 hours}}','{{Info/Filme|runtime=2 hours}}',/unidade/);
check('Film runtime list preserves','{{Info/Filme|runtime=134 min (Japão), 120 min (Brasil)}}','{{Info/Filme|runtime=134 min (Japão), 120 min (Brasil)}}',/unidade/);
check('Film runtime conflict preserves','{{Info/Filme|runtime=134 minutes|duração=120}}','{{Info/Filme|runtime=134 minutes|duração=120}}',/conflita/);
check('Film runtime destination empty filled','{{Info/Filme|runtime=134 minutes|duração=}}','{{Info/Filme|duração=134}}');
check('Film duplicate actual runtime preserves','{{Info/Filme|runtime=134 minutes|runtime=134 minutes}}','{{Info/Filme|duração=134}}');
check('Info Cidade warning only','{{Info/Cidade|nome=X|população=100}}','{{Info/Cidade|nome=X|população=100}}',/obsoleta/);
check('Info Pessoa missing warning only','{{Info/Pessoa|nome=X|imagem=A.jpg}}','{{Info/Pessoa|nome=X|imagem=A.jpg}}',/não existia/);
check('Uncatalogued infobox retains','{{Info/Outra coisa|name=X}}','{{Info/Outra coisa|name=X}}',/fora do catálogo/);
check('Obsolete templates in nowiki retained','<nowiki>{{Birth date|1983|1|9}}</nowiki>','<nowiki>{{Birth date|1983|1|9}}</nowiki>');
check('Plain dni keeps default age and accepted spelling','{{dni|9|1|1983}}','{{dni|9|1|1983}}');
check('Plain dni explicit si preserves accepted spelling','{{dni|9|1|1983|si}}','{{dni|9|1|1983|si}}');
check('User nowrap dni migration preserves visible age and accepted spelling','{{nowrap|{{dni|lang=br|9|1|1983}}}}','{{dni|9|1|1983}}');
for(const [name,p] of Object.entries(infoboxCatalog)){
 for(const [source,target] of Object.entries(p.renames||{})){
  try{assert.ok(p.accepted.includes(target),`Unknown map target ${name} ${source}→${target}`);passed++;}catch(e){failed++;console.log('FAIL',e.message);}
 }
 for(const key of Object.keys(p.aliases||{})){
  if(!p.accepted.includes(key))continue;
  const title=p.title;
  check(`Legacy alias retained ${name} ${key}`,`{{${title}|${key}=VALUE}}`,`{{${title}|${key}=VALUE}}`);
 }
}
require('node:fs').writeFileSync(__dirname+'/'+'catalog_audit_results.json',JSON.stringify({passed,failed}));console.log(JSON.stringify({passed,failed}));process.exitCode=failed?1:0;
