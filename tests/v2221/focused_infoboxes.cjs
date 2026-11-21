'use strict';
const assert=require('node:assert/strict'),{api,receipt}=require('./focused_infoboxes_harness.cjs').load();
const cfg={namespaceNumber:0,contentModel:'wikitext',pageTitle:'Assunto de teste'};
let cases=0,checks=0;const results=[];
function ok(value,label){checks++;assert(value,label);}
function equal(actual,expected,label){checks++;assert.deepEqual(JSON.parse(JSON.stringify(actual)),JSON.parse(JSON.stringify(expected)),label);}
function test(name,fn){fn();cases++;results.push(name);}
function plan(source,options={}){const result=api.v2221FocusedInfoboxPlan(source,{...cfg,...options});ok(api.v2221FocusedInfoboxProof(source,result.text,result,{...cfg,...options}),'source-bound infobox proof');equal(api.v2221FocusedInfoboxPlan(result.text,{...cfg,...options}).text,result.text,'idempotent native repair');return result;}
function portals(source,options={}){const result=api.v2221FocusedPortalsPlan(source,{...cfg,...options});ok(api.v2221FocusedPortalsProof(source,result.text,result,{...cfg,...options}),'source-bound portal proof');equal(api.v2221FocusedPortalsPlan(result.text,{...cfg,...options}).text,result.text,'idempotent portal addition');return result;}
function article(box,lead="'''Assunto''' é um assunto de teste.",footer=''){return box+'\n'+lead+'\n\n{{Referências}}\n'+footer;}

test('album date role changes independently of unknown and obsolete nonempty values',()=>{
 const source=article('{{Info/Álbum|nome=Nome|lançamento=19 de maio de 2016|formato=CD|desconhecido=Manter}}'),r=plan(source);
 ok(/\|lançado\s+= 19 de maio de 2016/.test(r.text));ok(/\|formato\s+= CD/.test(r.text));ok(/\|desconhecido\s+= Manter/.test(r.text));ok(r.edits[0].count>=4);
 for(const input of ['|lançado=Outra data','|Lançado=Outra data','|lançamento=Duplicada']){const text=plan(article('{{Info/Álbum|lançamento=Uma data'+input+'}}')).text;ok(text.includes('|lançamento'));}
 for(const value of ['',' '])ok(!plan(article('{{Info/Álbum|nome=Nome|formato='+value+'}}')).text.includes('|formato'));
});
test('museum location does not merge foundation and inauguration or lose unmapped fields',()=>{
 const source=article('{{Info/Museu|nome=Museu|localidade=Local|fundação=2000|inauguração=12 de novembro de 2023|fundador=Pessoa|acervo=100|nome_local=Nome local}}'),text=plan(source).text;
 ok(/\|localização\s+= Local/.test(text));for(const [key,value]of [['fundação','2000'],['inauguração','12 de novembro de 2023'],['fundador','Pessoa'],['acervo','100'],['nome_local','Nome local']])ok(new RegExp('\\|'+key+'\\s+= '+value).test(text));
 ok(plan(article('{{Info/Museu|localidade=A|localização=B}}')).text.includes('|localidade'));
});
test('aircraft labels retain dates, units, references and unsupported state/operator fields',()=>{
 const ref='<ref name="RÉf">{{citar livro|título=T|página=1}}</ref>',source=article('{{Info/Aeronave|nome=Avião|tipo=Transporte|introducao=1950'+ref+'|aposentadoria=2000|producao=1940–1960|estado=Preservar|usuario=Operador|envergadura=10 m}}'),text=plan(source).text;
 for(const [key,value]of [['missao','Transporte'],['integraçao','1950'+ref],['aposentado','2000'],['produção','1940–1960'],['estado','Preservar'],['usuario','Operador'],['envergadura','10 m']])ok(text.includes(value)&&text.includes('|'+key));ok(text.includes(ref));
});
test('generic labels are dynamic native keys without invented topical semantics',()=>{
 for(const owner of ['Info','Infocaixa']){const text=plan(article('{{'+owner+'|rotulo12=Instituição|dados12=Texto|estilo_titulo=color:red|campo_novo=Outro}}')).text;ok(text.includes('|rótulo12'));ok(text.includes('|título-estilo'));ok(text.includes('Outro'));}
 ok(plan(article('{{Info|rotulo1=A|rótulo1=B}}')).text.includes('|rotulo1'));ok(plan(article('{{Info|rotulo201=A}}')).text.includes('|rotulo201'));
 const text=plan(article('{{Info/Comuna da Itália|habitantes=Olbiesi|população=51045}}')).text;ok(text.includes('Olbiesi'));ok(text.includes('51045'));ok(text.includes('|habitantes'));
});
test('obsolete IMDb preserves filled identifiers except an exact existing visible duplicate',()=>{
 for(const key of ['código-IMDB','imdb_id','imdb','IMDb']){
  const source=article('{{Info/Filme|nome=Filme|'+key+'=0012345}}');ok(plan(source).text.includes('0012345'));
  const unrelated=source+'\n== Ligações externas ==\n* [https://www.imdb.com/title/tt7654321/ Ficha]\n';ok(plan(unrelated).text.includes('|'+key));
  const duplicate=source+'\n== Ligações externas ==\n* [https://www.imdb.com/title/tt0012345/ Ficha]\n',r=plan(duplicate);ok(!r.text.includes('|'+key));ok(r.text.includes('https://www.imdb.com/title/tt0012345/'));
 }
 const protectedRef=article('{{Info/Filme|código-IMDB=0012345}}')+'<ref>[https://www.imdb.com/title/tt0012345/ Ficha]</ref>';ok(plan(protectedRef).text.includes('|código-IMDB'));
});
test('website repair is owner-specific and preserves valid helpers and distinct sites',()=>{
 const r=plan(article('{{Info/Empresa|nome=Empresa|website=[[https://example.invalid/?x=1&y=2|Sítio]]|fundador=Pessoa}}'));ok(/\|site\s+= \[https:\/\/example.invalid\/\?x=1&y=2 Sítio\]/.test(r.text));ok(r.text.includes('Pessoa'));
 for(const value of ['{{URL|https://example.invalid/|Sítio}}','[https://example.invalid/ Sítio]','https://example.invalid/'])ok(plan(article('{{Info/Empresa|site='+value+'}}')).text.includes(value));
 const conflict=plan(article('{{Info/Empresa|website=https://a.invalid/|site=https://b.invalid/}}')).text;ok(conflict.includes('|website'));ok(conflict.includes('https://a.invalid/'));ok(conflict.includes('https://b.invalid/'));
});
test('infobox formatting has one post-equals space, no empty padding, preserves multiline and nested helpers',()=>{
 const source=article('{{Info/Biografia|nome=Nome|ocupação= escritor |vazio=  |texto=* Um\n* Dois\n|website={{URL|https://example.invalid/?x=1&y=2|Sítio}}}}'),text=plan(source).text;
 ok(/\|nome\s+= Nome\n/.test(text));ok(/\|vazio\s+=\n/.test(text));ok(text.includes('{{URL|https://example.invalid/?x=1&y=2|Sítio}}'));ok(text.includes('* Um\n* Dois'));
 const multiline=plan(article('{{Info/Biografia|nome=Nome|filhos=\n* Primeiro\n* Segundo\n}}')).text;ok(/\|filhos\s+=\n\* Primeiro/.test(multiline));
 equal(api.v2221FocusedInfoboxSpacingValue('  '),'');equal(api.v2221FocusedInfoboxSpacingValue(' nome '),' nome');
});
test('earlier whitespace pass agrees with infobox writer and keeps citation padding separate',()=>{
 const source='{{Info/Biografia\n|nome                  = Pessoa\n|ocupação              = escritor\n}}',settings={...api.defaults,...cfg};
 const preferred=api.v2215PreferredCall(source,settings);equal(preferred.text,source);equal(preferred.edits.length,0);
 const citation=api.v2215PreferredCall('{{citar web|título= Fonte|url= https://example.invalid/}}',settings);ok(!citation.text.includes('= Fonte'));ok(!citation.text.includes('= https://'));
});
test('linked occupation case changes the label while retaining link target and ref bodies',()=>{
 const ref='<ref name="ocupação">[[Maquiagem|Maquilhadora]]</ref>',source=article('{{Info/Biografia|nome=Pessoa|ocupação=[[Maquiagem|Maquilhadora]], [[empresário|empresária]], [[influenciador digital|influenciadora digital]]'+ref+'}}'),text=plan(source).text;
 ok(text.includes('[[Maquiagem|maquilhadora]]'));ok(text.includes(ref));
 const names=plan(article('{{Info/Biografia|nome=Pessoa|ocupação=[[Artista|Maria da Silva]]}}')).text;ok(names.includes('[[Artista|Maria da Silva]]'));
});
test('embedded native boxes format recursively without modifying helper/ref template bodies',()=>{
 const ref='<ref>{{Info/Álbum|lançamento=2016|nome=Não tocar}}</ref>',source=article('{{Info/Biografia|nome=Pessoa|módulo={{Info/Álbum|nome=Álbum|lançamento=2016}}|texto='+ref+'}}'),text=plan(source).text;
 ok(text.includes('|lançado'));ok(text.includes(ref));ok(text.includes('|módulo'));
 equal(plan('<nowiki>{{Info/Álbum|lançamento=2016}}</nowiki>').text,'<nowiki>{{Info/Álbum|lançamento=2016}}</nowiki>');
});
test('explicit native biography keys recover foreign fields without renaming birth-name facts or overwriting aliases',()=>{
 const source=article('{{Info/Biografia|name=Pessoa|birth_place=[[Paris]], [[França]]|occupation=escritor|parents=Genitores|birth_name=Nome de nascimento|campo_desconhecido=Preservar}}'),text=plan(source).text;
 for(const key of ['nome','local_nascimento','ocupação','progenitores'])ok(text.includes('|'+key));ok(text.includes('|birth_name'));ok(text.includes('Nome de nascimento'));ok(text.includes('Preservar'));
 const conflict=plan(article('{{Info/Biografia|name=Outro|nome=Nome local|parents=Genitores|mãe=Pessoa}}')).text;ok(conflict.includes('|name'));ok(conflict.includes('|parents'));ok(conflict.includes('Nome local'));
 for(const value of ['','{{lang|en|Pessoa}}'])ok(plan(article('{{Info/Biografia|name='+value+'}}')).text.includes('|name'));
});
test('native wrestler aliases keep their actual reader roles and activate the missed personal family',()=>{
 const source=article('{{Info/Lutador de wrestling profissional|name=Pessoa|birth_name=Nome completo|birth_place=[[Paris]], [[França]]|image=Example.jpg|caption=Legenda|height=1.80 m|billed=[[França]]|debut=2000|retired=2020|website=https://example.invalid/}}',"'''Pessoa''' é um lutador profissional."),r=plan(source);
 for(const key of ['nome','nome_nascimento','nascimento_local','imagem','legenda','altura','anunciado de','estreia','aposentadoria','site'])ok(r.text.includes('|'+key));ok(api.biographyDetection(r.text,cfg));
 const conflict=plan(article('{{Info/Lutador de wrestling profissional|name=A|nome=B|birth_name=C|nome_completo=D}}')).text;ok(conflict.includes('|name'));ok(conflict.includes('|birth_name'));
 const machine=article('{{Info/Lutador de wrestling profissional|name=Máquina}}',"'''Máquina''' é um equipamento experimental.");equal(api.biographyDetection(machine,cfg),null);
});
test('the existing single literal native redirect name repair does not depend on a refused foreign continuation',()=>{
 const source=article('{{Ficha de persona|nombre=Pessoa Exemplo}}'),text=plan(source).text;ok(text.startsWith('{{Info/Biografia\n'));ok(/\|nome\s+= Pessoa Exemplo\n/.test(text));
 for(const fields of ['nombre=[[Pessoa Exemplo]]','nombre=Pessoa Exemplo<ref>Fonte.</ref>','nome=Pessoa A|nombre=Pessoa B','nombre=Pessoa A|nombre=Pessoa B','nombre=Pessoa|novo=Outro']){const source=article('{{Ficha de persona|'+fields+'}}'),result=plan(source).text;ok(result.startsWith('{{Ficha de persona'));ok(result.includes('Pessoa'));}
});
test('country interpretation trims only ASCII named margins before shielding and preserves ambiguity',()=>{
 for(const value of ['[[Cidade Exemplo]], França',' [[Cidade Exemplo]], França',' [[Cidade Exemplo]], França\n','\t\n[[Cidade Exemplo]], França\r\n'])equal(api.v2217CountryValues(value,false),['França']);
 for(const value of [' Talvez França\n',' [[Geórgia]]\n',' Atlanta, Georgia\n',' Cidade Exemplo, CA\n',' <nowiki>França</nowiki>\n'])equal(api.v2217CountryValues(value,false),[]);
});
test('named margins do not hide linked occupations or embedded infoboxes from typed readers',()=>{
 const ref='<ref name="P">[[Maquiagem|Maquilhadora]]</ref>',protectedText='<nowiki>[[Maquiagem|Maquilhadora]]</nowiki>';
 for(const margin of [' ','\t','\n',' \r\n']){
  const value=margin+'[[Maquiagem|Maquilhadora]] '+ref+' '+protectedText,r=api.v2221FocusedOccupation(value);
  ok(r.text.startsWith(margin+'[[Maquiagem|maquilhadora]]'));ok(r.text.includes(ref));ok(r.text.includes(protectedText));equal(r.count,1);
  const nested=plan(article('{{Info/Biografia|nome=Pessoa|módulo='+margin+'{{Info/Álbum|nome=Álbum|lançamento=2016}}|texto='+ref+'}}')).text;
  ok(/\|lançado\s+= 2016/.test(nested));ok(nested.includes(ref));
 }
 for(const value of [' [[Artista|Maria da Silva]]',' <code>[[Maquiagem|Maquilhadora]]</code>',' <nowiki>[[Maquiagem|Maquilhadora]]</nowiki>'])equal(api.v2221FocusedOccupation(value).text,value);
 const unicode='\u00a0[[Maquiagem|Maquilhadora]]';equal(api.v2221FocusedOccupation(unicode).text.slice(0,1),'\u00a0');
});
test('offset-preserving named view retains code shields and native URL helper values',()=>{
 for(const margin of [' ','\t','\r\n  ']){
  const value=margin+'{{URL|https://example.invalid/?x=1&y=2|Office website}}',view=api.v2221FocusedValueView(value);equal(view.length,value.length);equal(view.indexOf('{{URL'),margin.length);
  const text=api.v2217InfoboxPlan(article('{{Info/Biografia|nome=Pessoa|site='+value+'}}'),cfg).text;ok(text.includes('{{URL|https://example.invalid/?x=1&y=2|Sítio oficial}}'));
 }
 const opaque='<nowiki>{{URL|https://example.invalid/|Office website}}</nowiki>',text=api.v2217InfoboxPlan(article('{{Info/Biografia|nome=Pessoa|site= '+opaque+'}}'),cfg).text;ok(text.includes(opaque));
});
test('military country and explicit world war remain visible after native value padding',()=>{
 const source=article('{{Info/Unidade Militar\n|nome = Unidade\n|país = Austrália\n|guerras/batalhas = [[Segunda Guerra Mundial]]\n}}',"'''Unidade''' foi uma unidade militar."),r=api.v2217PortalCandidates(source,{...api.defaults,...cfg});ok(r.includes('Austrália'));ok(r.includes('Segunda Guerra Mundial'));
 for(const value of [' <nowiki>[[Segunda Guerra Mundial]]</nowiki>',' Não participou da [[Segunda Guerra Mundial]]',' 1939–1945','<code>[[Segunda Guerra Mundial]]</code>'])ok(!api.v2217PortalCandidates(article('{{Info/Unidade Militar|nome=Unidade|guerras/batalhas='+value+'}}'),{...api.defaults,...cfg}).includes('Segunda Guerra Mundial'));
});
test('country flag reader ignores only named ASCII margins while preserving labels and exceptions',()=>{
 const options={...api.defaults,...cfg},ref='<ref name="flag">{{Flag|USA}}</ref>';
 for(const margin of ['',' ','\t','\r\n '])for(const [call,target]of [['{{Flag|BRA}}','[[Brasil|BRA]]'],['{{BRA}}','[[Brasil]]']]){
  const source=article('{{Info/Biografia|nome=Pessoa|nacionalidade='+margin+call+ref+'}}'),result=api.v222FlagPlan(source,options);ok(result.text.includes(margin+target+ref));ok(api.v222FlagProof(source,result.text,result,options));equal(api.v222FlagPlan(result.text,options).text,result.text);
 }
 for(const value of [' <nowiki>{{Flag|BRA}}</nowiki>',' <code>{{Flag|BRA}}</code>',' <ref>{{Flag|BRA}}</ref>']){const source=article('{{Info/Biografia|nome=Pessoa|nacionalidade='+value+'}}');equal(api.v222FlagPlan(source,options).text,source);}
 for(const occupation of ['general','futebolista']){const source=article('{{Info/Biografia|nome=Pessoa|nacionalidade= {{Flag|BRA}}|ocupação='+occupation+'}}');equal(api.v222FlagPlan(source,options).text,source);}
});
test('scopes, option switches and unsupported ambiguities preserve the source',()=>{
 const source=article('{{Info/Álbum|lançamento=2016}}');for(const options of [{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{contentModel:'javascript'},{pageRedirect:true},{infoboxes:false}])equal(plan(source,options).text,source);
 const malformed='{{Info/Álbum|lançamento=2016';equal(plan(malformed).text,malformed);
 const unknown='{{Modelo desconhecido|nome=Nome}}';equal(plan(unknown).text,unknown);
});
test('album and comic artist provide exact theme evidence, film explicit production country adds Slovakia',()=>{
 for(const [box,portal]of [['{{Info/Álbum|nome=Álbum}}','Música'],['{{Info/Artista de histórias em quadrinhos|Título=Artista}}','Banda desenhada']])ok(portals(article(box)).text.includes(portal));
 const text=portals(article('{{Info/Filme|nome=Filme|país=[[Eslováquia]]|idioma=[[Língua inglesa]]}}')).text;ok(text.includes('Cinema'));ok(text.includes('Eslováquia'));ok(!text.includes('Portal3|Estados Unidos'));
 ok(!portals(article('{{Info/Filme|nome=Filme|idioma=[[Língua eslovaca]]}}')).text.includes('Eslováquia'));
});
test('an explicitly nonmusical album contradicts only that infobox theme proof',()=>{
 for(const kind of ['fotográfico','de fotografias','de fotos','de figurinhas','de cromos','de banda desenhada','de histórias em quadrinhos']){
  const source=article('{{Info/Álbum|nome=Álbum|lançamento=2016}}',"'''Álbum''' é um álbum "+kind+'.'),text=portals(source).text;equal(text,source);ok(plan(source).text.includes('|lançado'));
 }
 for(const lead of ["'''Álbum''' é um álbum musical sobre banda desenhada.","'''Álbum''' é um álbum com fotografias de sua gravação.","'''Artista''' é um músico que também se dedica à fotografia."])ok(portals(article('{{Info/Álbum|nome=Álbum}}',lead)).text.includes('{{Portal3|Música}}'));
 const existing=article('{{Info/Álbum|nome=Álbum}}',"'''Álbum''' é um álbum fotográfico.",'{{Portal3|Música}}\n');equal(portals(existing).text,existing);
});
test('legacy album opening reader distinguishes comics from a musical band',()=>{
 const options={...api.defaults,...cfg,v2212PortalProofRequired:false};
 for(const kind of ['fotográfico','de figurinhas','de banda desenhada']){
  const source=article('{{Info/Álbum|nome=Álbum}}',"'''Álbum''' é um álbum "+kind+'.'),result=api.v2212PortalPlan(source,options);ok(!/\{\{Portal3\|[^}]*Música/.test(result.text));ok(api.v2212PortalProof(source,result.text,result,options));
 }
 for(const [fields,lead]of [['nome=Álbum|gênero=Rock',"'''Álbum''' é um álbum de banda desenhada."],['nome=Álbum',"'''Álbum''' é um álbum musical sobre banda desenhada."]])ok(/\{\{Portal3\|[^}]*Música/.test(api.v2212PortalPlan(article('{{Info/Álbum|'+fields+'}}',lead),options).text));
});
test('hidden, table, helper and citation infoboxes or stubs are not principal topic evidence',()=>{
 for(const wrap of [box=>'<div style="display:none">'+box+'</div>',box=>'{| class="wikitable"\n| '+box+'\n|}',box=>'<table><tr><td>'+box+'</td></tr></table>',box=>'{{Modelo desconhecido|caixa='+box+'}}',box=>'<ref>'+box+'</ref>'])for(const raw of ['{{Info/Álbum|nome=Álbum}}','{{Esboço-botânica}}']){
  const source=article(wrap(raw),"'''Pessoa''' é um escritor.");equal(portals(source).text,source);
 }
});
test('portals append without duplicate identities and retain country/state redundancy rule',()=>{
 const source=article('{{Info/Álbum|nome=Álbum}}',undefined,'{{Portal3|Música|Brasil}}\n');equal(portals(source).text,source);
 const film=article('{{Info/Filme|nome=Filme|país=[[Brasil]]}}',undefined,'{{Portal3|Goiás}}\n'),text=portals(film).text;ok(text.includes('Cinema'));ok(!text.includes('|Brasil'));
 const r=portals(article('{{Info/Álbum|nome=Álbum}}'));ok(!/\n\n\n/.test(r.text));
});
test('verified single specific stubs add themes but generic/parameterized/conflicting stubs do not',()=>{
 for(const [stub,portal]of [['botânica','Botânica'],['ecologia','Ecologia'],['matemática','Matemática'],['física','Física'],['política','Política'],['informática','Tecnologias de informação'],['música','Música'],['livro','Literatura']])ok(portals(article('',undefined,'{{Esboço-'+stub+'}}\n')).text.includes('{{Portal3|'+portal+'}}'));
 for(const footer of ['{{Esboço}}','{{Esboço-botânica|uma coisa}}','{{Esboço-botânica}}{{Esboço-desconhecido}}','{{Esboço-desconhecido}}'])equal(portals(article('',undefined,footer)).text,article('',undefined,footer));
});
test('foreign equipment placed in a person box cannot imply biography while real human engineer is allowed',()=>{
 const nonhuman=article('{{Info/Biografia|nome=Modelo|ocupação=Engenharia}}',"'''Modelo''' é um radar de defesa.");ok(api.v2221FocusedBiographyConflict(nonhuman,cfg));ok(api.v222InferenceSubjectConflict(nonhuman,cfg));equal(api.biographyDetection(nonhuman,cfg),null);
 const person=article('{{Info/Biografia|nome=Pessoa|ocupação=engenheiro}}',"'''Pessoa''' foi um engenheiro que trabalhou com radar.");ok(!api.v2221FocusedBiographyConflict(person,cfg));ok(api.biographyDetection(person,cfg));
 const settings={...api.defaults,...cfg,v2212PortalProofRequired:false,authorityControl:false};
 const negative=api.v219LatePortalPass(nonhuman,settings,()=>{},()=>{});ok(!/\{\{Portal3\|[^}]*Biografias/.test(negative),'late masking cannot erase the nonhuman proof');
 const positive=api.v219LatePortalPass(person,settings,()=>{},()=>{});ok(/\{\{Portal3\|[^}]*Biografias/.test(positive),'the proof is local to the nonhuman call');ok(!Object.hasOwn(settings,'v2221KnownNonhumanSubject'));
});
test('tampered output/proof is rejected and no raw reference identity is normalized',()=>{
 const source=article('{{Info/Álbum|nome=Nome|lançamento=2016|texto=<ref name="Á">Original</ref><ref name="Á"/>}}'),r=plan(source);
 ok(!api.v2221FocusedInfoboxProof(source,r.text.replace('Original','Alterado'),r,cfg));ok(r.text.includes('<ref name="Á">Original</ref><ref name="Á"/>'));
});
console.log(JSON.stringify({status:'passed',mode:receipt.mode,runtimeSha256:receipt.runtimeSha256||null,cases,checks,groups:results,legacyPatchChanges:receipt.changes.map(row=>row.name)},null,2));
