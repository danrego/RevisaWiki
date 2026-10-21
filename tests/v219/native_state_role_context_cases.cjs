'use strict';
// Native CS1 aliases below have identical roles in configuration 73016847.
// These are comparison-only contracts, not permission to rewrite valid keys.
// Every expected positive keeps the exact role value and publication binding.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x)),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'native-url-state-role-context-proof',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
const families=[['Cite web','Citar web'],['Cite news','Citar jornal'],['Cite book','Citar livro'],['Cite journal','Citar periódico'],['Cite magazine','Citar revista'],['Cite press release','Citar comunicado de imprensa'],['Citation','Citation'],['Cite conference','Citar conferência'],['Cite report','Citar relatório'],['Cite video','Citar vídeo'],['Cite encyclopedia','Citar enciclopédia'],['Cite thesis','Citar tese']];
const pairs=[['title',"'Título literal' e outro",'título'],['publisher','Casa editorial literal','publicado'],['work','Publicação literal','obra'],['access-date','13 de dezembro de 2022','acessodata'],['archive-date','20 de fevereiro de 2024','arquivodata'],['archive-url','https://example.invalid/arquivo','arquivourl'],['date','12 de dezembro de 2022','data'],['first','Nome literal','primeiro'],['last','Autoria literal','último'],['language','en-US','língua'],['author2','Autoria secundária','autor2'],['first2','Nome secundário','primeiro2'],['editor2','Edição secundária','editor-sobrenome2'],['editor-link2','Destino secundário','editorlink2']];
for(const file of files){
 const bytes=fs.readFileSync(file),a=require(file),bundle=path.basename(file),cfg={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,referenceColumns:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false};report.bundles.push({bundle,sha256:sha(bytes),version:a.version});
 function test(id,source,expected,accept=true,options=cfg){
  const row={bundle,id,evidenceKind:'native-comparison-only',sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(canonical(options))),intentSha256:sha(JSON.stringify({id,accept})),status:'passed'};
  try{const audit=a.preservationAudit(source,expected,options),composition=a.safeComposition(source,expected,options);if(accept){eq(audit,[],'Exact native aliases keep the same complete citation context');eq(composition,'','Native role-equivalent state context composes');}else{ok(audit.some(x=>x.code==='lost-citation-metadata'),'A changed role/value/index or alias precedence loses the bound state context');ok(Boolean(composition),'The complete composition guard rejects that mutation');}}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}report.cases.push(row);
 }
 for(const [alias,native]of families)for(const [index,[english,value,portuguese]]of pairs.entries())for(const state of ['url-status=live','urlmorta=no','li=sim','urlmorta=']){
  const title=english==='title'?'':"|title='Título literal' e outro",nativeTitle=english==='title'?'':"|título='Título literal' e outro",before='{{'+alias+title+'|url=https://example.invalid/fonte|'+english+'='+value+'|'+state+'}}',after='{{'+native+nativeTitle+'|url=https://example.invalid/fonte|'+portuguese+'='+value+'|'+state+'}}';
  test('equivalent-'+alias+'-'+index+'-'+state,before,after);test('changed-value-'+alias+'-'+index+'-'+state,before,after.replace('|'+portuguese+'='+value,'|'+portuguese+'='+value+' alterado'),false);
 }
 for(const alias of ['cite web','Template:Cite web','Predefinição:Cite web'])test('native-title-alias-'+alias,"{{"+alias+"|title='Título literal'|publisher=Casa literal|url-status=live}}","{{Citar web|título='Título literal'|publicado=Casa literal|url-status=live}}");
 for(const alias of ['citar_web','Citar_web',' citar_web ','\nCitar_web\r\n','Citar  web']){
  const source='{{'+alias+'|título=Fonte literal|url=https://example.invalid/|data=2001-03-18|urlmorta=sim}}',
   target='{{Citar web|título=Fonte literal|url=https://example.invalid/|data=18 de março de 2001|urlmorta=sim}}';
  test('native-space-underscore-'+JSON.stringify(alias),source,target);
  for(const [id,changed]of [['state',target.replace('urlmorta=sim','url-status=dead')],['day',target.replace('18 de março','19 de março')],['title',target.replace('Fonte literal','Outra fonte')]])
   test('native-space-underscore-'+id+'-'+JSON.stringify(alias),source,changed,false);
 }
 for(const key of ['enciclopedia','enciclopédia','encyclopedia','encyclopaedia']){
  const source='{{Citar enciclopédia|título=Entrada literal|url=https://example.invalid/|'+key+'=Obra literal|url-status=live}}',
   target=source.replace('|'+key+'=','|enciclopedia=');
  test('same-two-native-roles-'+key,source,target);
  test('changed-two-role-value-'+key,source,target.replace('Obra literal','Outra obra'),false);
  for(const competitor of ['work','obra','encyclopedia'])for(const value of ['', 'Outra obra']){
   const competing=source.replace('|url-status','|'+competitor+'='+value+'|url-status');
   if(key!=='enciclopedia')test('two-role-priority-'+key+'-'+competitor+'-'+value,competing,competing.replace('|'+key+'=Obra literal','|enciclopedia=Obra literal'),false);
  }
 }
 for(const [alias,native]of families)for(const index of ['', '2'])for(const state of ['url-status=live','urlmorta=no']){
  const source="{{"+alias+"|title=Publicação d'água|url=https://example.invalid/fonte|editor"+index+'=[[Destino literal|Pessoa literal]]|'+state+'}}',
   expected="{{"+native+"|título=Publicação d'água|url=https://example.invalid/fonte|editor"+index+'=Pessoa literal|'+state+'|editorlink'+index+'=Destino literal}}';
  test('native-editor-link-'+alias+'-'+index+'-'+state,source,expected);
  test('native-editor-target-'+alias+'-'+index+'-'+state,source,expected.replace('=Destino literal}}','=Outro destino}}'),false);
  test('native-editor-name-'+alias+'-'+index+'-'+state,source,expected.replace('=Pessoa literal|','=Outra pessoa|'),false);
  test('native-editor-index-'+alias+'-'+index+'-'+state,source,expected.replace('|editorlink'+index+'=','|editorlink3='),false);
  test('native-editor-mask-'+alias+'-'+index+'-'+state,source,expected.replace('}}','|editor-mascara'+index+'=1}}'),false);
 }
 for(const [alias,native]of families)for(const [name,code]of [['inglês','en'],['Checo','cs'],['sueco','sv'],['GREGO','el']])for(const key of ['língua','language']){
  const before="{{"+alias+"|title='Título literal' e outro|url=https://example.invalid/fonte|"+key+'='+name+'|url-status=live}}',
   after="{{"+native+"|título='Título literal' e outro|url=https://example.invalid/fonte|"+key+'='+code+'|url-status=live}}';
  test('native-language-'+alias+'-'+key+'-'+name,before,after);
  test('native-language-changed-'+alias+'-'+key+'-'+name,before,after.replace('='+code+'|','=xx|'),false);
 }
 for(const [alias,native]of families)for(const [key,blank]of [['arquivodata','arquivo-data'],['archive-date','arquivo-data'],['acessodata','access-date'],['data','date']])for(const written of ['18-03-2007','18/03/2007','2007-03-18']){
  const before="{{"+alias+"|title=Publicação d'água|url=https://example.invalid/fonte|"+key+'='+written+'|'+blank+'=|url-status=live}}',after="{{"+native+"|título=Publicação d'água|url=https://example.invalid/fonte|"+key+'=18 de março de 2007|'+blank+'=|url-status=live}}';
  test('same-day-with-explicit-blank-'+alias+'-'+key+'-'+written,before,after);
  test('changed-day-with-explicit-blank-'+alias+'-'+key+'-'+written,before,after.replace('18 de março','19 de março'),false);
  test('dropped-blank-date-override-'+alias+'-'+key+'-'+written,before,after.replace('|'+blank+'=',''),false);
  test('date-key-blank-priority-swap-'+alias+'-'+key+'-'+written,before,after.replace('|'+key+'=18 de março de 2007|'+blank+'=','|'+blank+'=18 de março de 2007|'+key+'='),false);
  test('date-format-option-off-'+alias+'-'+key+'-'+written,before,after,false,{...cfg,dates:false});
 }
 for(const [alias,native]of families){
  for(const written of ['1ª EDIÇÃO','2nd edition','3 ed.']){const number=written.match(/^\d+/)[0],source='{{'+alias+'|title=Fonte literal|url=https://example.invalid/|edição='+written+'|url-status=live}}',expected='{{'+native+'|título=Fonte literal|url=https://example.invalid/|edição='+number+'|url-status=live}}';
   test('native-numeric-edition-reader-'+alias+'-'+written,source,expected);
   test('changed-edition-number-'+alias+'-'+written,source,expected.replace('|edição='+number+'|','|edição=99|'),false);
   test('edition-option-off-'+alias+'-'+written,source,expected,false,{...cfg,citations:false});
  }
  const source='{{'+alias+'|title=Fonte literal|url=https://example.invalid/|arquivodata=28 de junho de 2019|arquivodata=28 de junho de 2019|url-status=live}}',expected='{{'+native+'|título=Fonte literal|url=https://example.invalid/|arquivodata=28 de junho de 2019|url-status=live}}';
  test('identical-date-duplicate-reader-'+alias,source,expected);
  test('identical-date-duplicate-changed-day-'+alias,source,expected.replace('28 de junho','29 de junho'),false);
  test('unequal-date-duplicate-removal-'+alias,source.replace('arquivodata=28 de junho de 2019|arquivodata','arquivodata=27 de junho de 2019|arquivodata'),expected,false);
 }
 for(const [alias,native]of families)for(const [leading,trailing]of [['\n','\r\n'],[' \t\n','\n \t'],['\r\n','\r\n'],[' '.repeat(5000)+'\n','\n']]){
  const before='{{'+leading+alias+trailing+'|title=Fonte literal|url=https://example.invalid/|author=Pessoa literal|url-status=live}}',after='{{'+native+'|título=Fonte literal|url=https://example.invalid/|autor=Pessoa literal|url-status=live}}';
  test('outer-header-whitespace-'+alias+'-'+JSON.stringify([leading,trailing]),before,after);
  test('outer-header-whitespace-state-mutation-'+alias+'-'+JSON.stringify([leading,trailing]),before,after.replace('url-status=live','urlmorta=não'),false);
  test('outer-header-whitespace-person-mutation-'+alias+'-'+JSON.stringify([leading,trailing]),before,after.replace('Pessoa literal','Outra pessoa'),false);
 }
 const call=(fields,state='url-status=live')=>"{{Citar web|título='Título literal' e outro|url=https://example.invalid/fonte|"+fields+'|'+state+'}}';
 for(const [id,beforeFields,afterFields]of [
  ['publisher-periodical-swap','publisher=Casa A|work=Casa B','publicado=Casa B|obra=Casa A'],
  ['author-editor-swap','author=Pessoa A|editor=Pessoa B','autor=Pessoa B|editor=Pessoa A'],
  ['edition-volume-swap','edition=2|volume=3','edição=3|volume=2'],
  ['url-archive-role-swap','archive-url=https://example.invalid/arquivo','arquivourl=https://example.invalid/fonte'],
  ['author-number-swap','author2=Pessoa A|author3=Pessoa B','autor2=Pessoa B|autor3=Pessoa A'],
  ['editor-number-swap','editor2=Pessoa A|editor3=Pessoa B','editor-sobrenome2=Pessoa B|editor-sobrenome3=Pessoa A'],
  ['publisher-alias-priority','publisher=Casa A|editora=Casa B','publicado=Casa A|editora=Casa B'],
  ['publisher-blank-competition','publisher=Casa A|publicado=','publisher=Casa A'],
  ['same-key-last-blank','publisher=Casa A|publisher=','publisher=Casa A'],
  ['unknown-role-activation','chave-desconhecida=Casa A','publicado=Casa A']
 ])test(id,call(beforeFields),call(afterFields),false);
 for(const [id,beforeFields,afterFields]of [
  ['language-competing-alias','língua=inglês|language=fr','língua=en|language=fr'],
  ['language-blank-competition','língua=inglês|language=','língua=en|language='],
  ['language-same-key-blank','língua=inglês|língua=','língua=en|língua='],
  ['language-unproved-punctuation','língua=inglês.','língua=en'],
  ['language-unproved-list','língua=inglês, francês','língua=en, fr'],
  ['language-unknown-key','idioma-desconhecido=inglês','língua=en']
 ])test(id,call(beforeFields),call(afterFields),false);
 test('unknown-canonical-family-does-not-become-native',call('publicador=Casa A'),call('publicado=Casa A'),false,{...cfg,automaticParameterNames:false,automaticSourceCompatibility:false});
 eq(sha(fs.readFileSync(file)),sha(bytes),'The native tested bundle remains immutable');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
