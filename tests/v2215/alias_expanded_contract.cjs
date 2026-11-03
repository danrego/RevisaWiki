'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const runtime=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(runtime),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false},talk={...cfg,namespaceNumber:1,pageTitle:'Discussão:Exemplo'},keys=require('./citation_key_preferences.json'),portals=require('./portal_key_preferences.json');
let checks=0,calculations=0;const failures=[],counts={keySpellings:0,numberedSpellings:0,portalVariants:0,pdCombinations:0};
function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch(e){failures.push({label,actual,expected});}}
function integrated(source,options,callback){const r=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;
 eq(r.preservation,[],'The integrated result retains the original preservation checks');eq(api.v219AutomaticResultSafety(source,r).accepted,true,'The returned source certificate is valid');callback(r.text,r);
 const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options});calculations++;eq(again.text,r.text,'The retained complete result is idempotent');return r;}
const nativeModels=['Citar arXiv','Citar comunicado de imprensa','Citar conferência','Citar discurso','Citar tese','Citar enciclopédia','Citar entrevista','Citar episódio','Citar grupo de notícias','Citar jogo eletrônico','Citar periódico','Citar lista de discussão','Citar livro','Citar mapa','Citar vídeo','Citar relatório','Citar relatório técnico','Citar série','Citar web'];
for(const [from,to]of Object.entries(keys.exact)){
 eq(api.v2215PortugueseCitationKey(from),to,'The finite key policy is loaded exactly');counts.keySpellings++;
 for(const model of nativeModels){
  const source='{{'+model+'|'+from+'=Teste}}',p=api.v2215AliasPlan(source,cfg);
  eq(api.v2215AliasProof(source,p.text,p,cfg),true,'Every key/model candidate has a deterministic literal proof');
  eq(api.v2215NativeCitationReadAudit(source,p.text,cfg),[],'The native reader bindings are not activated or lost by a preferred key');
  eq(api.v2215AliasPlan(p.text,cfg).text,p.text,'Every key/model candidate is locally idempotent');
  eq(p.text.endsWith('=Teste}}'),true,'A key preference cannot change its literal value');
 }
}
for(const [from,to]of Object.entries(keys.numbered))for(const index of ['1','2','12','123']){
 const key=from.replace('#',index),target=to.replace('#',index),source='{{Citar web|'+key+'=Nome}}',p=api.v2215AliasPlan(source,cfg);counts.numberedSpellings++;
 eq(api.v2215PortugueseCitationKey(key),target,'A finite numbered key retains its exact index');
 eq(p.text,'{{Citar web|'+target+'=Nome}}','Every numbered native name binding receives its verified Portuguese alias');
}
for(const [source,expected]of [
 ['{{Citar livro|title=Livro|issue=3}}','{{Citar livro|título=Livro|issue=3}}'],
 ['{{Cite book|title=Livro|number=3}}','{{Cite book|título=Livro|number=3}}'],
 ['{{Citar relatório técnico|title=Relatório|number=3}}','{{Citar relatório técnico|título=Relatório|número=3}}'],
 ['{{Citar relatório técnico|title=Relatório|issue=3}}','{{Citar relatório técnico|título=Relatório|issue=3}}'],
 ['{{Citar jogo eletrônico|title=Jogo|version=3}}','{{Citar jogo eletrônico|título=Jogo|versão=3}}'],
 ['{{Citar mapa|title=Mapa|map-url=https://example.org/map}}','{{Citar mapa|título=Mapa|map-url=https://example.org/map}}'],
 ['{{Citar mapa|title=Mapa|map-format=PDF}}','{{Citar mapa|título=Mapa|map-format=PDF}}'],
 ['{{Citar periódico|title=Texto|month=May}}','{{Citar periódico|título=Texto|month=May}}'],
 ['{{Citar web|a-new-unknown-field=Não inventar|title=Texto}}','{{Citar web|a-new-unknown-field=Não inventar|título=Texto}}'],
 ['{{Citar web|scale=1:5000|title=Mapa}}','{{Citar web|escala=1:5000|título=Mapa}}'],
 ['{{Citar web|title=Inglês|título=Português}}','{{Citar web|title=Inglês|título=Português}}'],
 ['{{Citar web|author2-last=A|ultimo2=B}}','{{Citar web|author2-last=A|ultimo2=B}}']
]){
 eq(api.v2215AliasPlan(source,cfg).text,expected,'The specific native model and collision precedence decide the key');
 integrated(source,cfg,text=>{eq(api.v2215NativeCitationReadAudit(source,text,cfg),[],'The full pipeline retains model-sensitive bindings');eq(text.includes('=Teste'),false,'No test sentinel is introduced');});
}
const badNative=[
 ['{{Citar livro|title=Livro|issue=3}}','{{Citar livro|título=Livro|número=3}}'],
 ['{{Cite book|title=Livro|issue=3}}','{{Citar livro|título=Livro|número=3}}'],
 ['{{Citar relatório técnico|issue=3}}','{{Citar relatório técnico|número=3}}'],
 ['{{Citar jogo eletrônico|version=3}}','{{Citar jogo eletrônico|série=3}}'],
 ['{{Citar mapa|map-url=https://example.org/map}}','{{Citar mapa|mapa-url=https://example.org/map}}'],
 ['{{Citar mapa|map-format=PDF}}','{{Citar mapa|mapa-formato=PDF}}'],
 ['{{Citar periódico|month=May}}','{{Citar periódico|mês=May}}']
];
for(const [before,after]of badNative)for(const options of [cfg,{...cfg,citations:false,automaticParameterNames:false}])eq(api.v2215NativeCitationReadAudit(before,after,options).length,1,'Native read integrity is independent of the automatic writer switch');
eq(api.v2215NativeCitationReadAudit('{{Citar periódico|month=May|year=2003}}','{{Citar periódico|data=maio de 2003}}',cfg),[],'A separately proven typed month/year conversion remains available');
for(const [from,to,normalized]of [['date','data','8 de fevereiro de 2003'],['access-date','acessodata','8 de fevereiro de 2003'],['archive-date','arquivodata','8 de fevereiro de 2003'],['publication-date','data-publicação','8 de fevereiro de 2003'],['doi-inactive-date','doi-incorrecto','8 de fevereiro de 2003'],['laydate','resumo-data','8 de fevereiro de 2003'],['embargo','embargo','2003-02-08'],['airdate','airdate','8 de fevereiro de 2003']])for(const model of ['Citar web','Citar episódio']){
 const source='{{'+model+'|'+from+'=8 February 2003}}';eq(api.v2215AliasPlan(source,cfg).text,'{{'+model+'|'+to+'='+normalized+'}}','Only roles passed to the native date validator use the complete-calendar normalizer');
 integrated(source,cfg,text=>eq(text.includes(normalized),true,'The complete supported date survives the full pipeline'));
}
for(const value of ['February 2003','2003','31 February 2003','03/04/2003','8–10 February 2003'])eq(api.v2215AliasPlan('{{Citar web|embargo='+value+'}}',cfg).text,'{{Citar web|embargo='+value+'}}','An embargo never gains guessed precision or an invalid localized format');
for(const [from,to]of Object.entries(portals.aliases))for(const template of ['Portal','Portal3'])for(const slot of ['', '1=', '10=']){
 const source='{{'+template+'| '+slot+from.toLocaleUpperCase('pt')+' |Ciência|posição=direita}}',expected='{{'+template+'| '+slot+to+' |Ciência|posição=direita}}',p=api.v2215AliasPlan(source,cfg);counts.portalVariants++;
 eq(p.text,expected,'Every verified portal spelling maps to the same native destination and preserves slot/options');eq(api.v2215AliasProof(source,expected,p,cfg),true,'The portal edit has an exact source-bound proof');
}
for(const value of ['Football','Georgia','Britain','Korea','Congo','America','Space','Unknown'])eq(api.v2215AliasPlan('{{Portal3|'+value+'}}',cfg).text,'{{Portal3|'+value+'}}','An ambiguous or absent portal spelling is not guessed');
for(const source of ['{{Portal3|nome=Science}}','{{Portal3|11=Science}}','{{Portal3|1={{Exemplo|Science}}}}','{{Exemplo|{{Portal3|Science}}}}','<nowiki>{{Portal3|Science}}</nowiki>','<!--{{Portal3|Science}}-->'])eq(api.v2215AliasPlan(source,cfg).text,source,'Names, unsupported positions and examples do not become portal slots');
for(const source of ['{{Portal3|Biography|Women|France}}','{{Portal|Science|Physics}}','{{Portal3|United States|History|Politics}}'])integrated(source,cfg,text=>{for(const foreign of ['Biography','Women','France','Science','Physics','United States','History','Politics'])eq(text.includes('|'+foreign),false,'A verified English portal no longer survives the full pipeline');});
const aliases=['PD','pd','Página de discussão','Cabeçalho de discussão','PW-Alvo','Portais-aviso','Predefinição:PD','Template:Página de discussão'],comments=['<!--comentário-->','<!-- a\n b -->','<!-- {{Exemplo}} -->'];
for(const a of aliases)for(const b of aliases)for(const comment of comments)for(const [left,right]of [
 ['{{'+a+'}}'+comment+'\n{{'+b+'}}\nTexto','{{PD}}\n'+comment+'\nTexto'],
 [comment+'{{'+a+'}}\n{{'+b+'}}\nTexto','{{PD}}\n'+comment+'\nTexto'],
 ['{{'+a+'}}'+comment+'{{'+b+'}}\nTexto','{{PD}}\n'+comment+'\nTexto']
]){
 counts.pdCombinations++;const p=api.v2215PdPlan(left,talk);eq(p.text,right,'Comment-masked eligibility deduplicates banner aliases while preserving all comment bytes');eq(api.v2215PdProof(left,right,p,talk),true,'Comment-bearing discussion edits have the same deterministic proof');
}
for(const ns of [1,3,5,7,9,11,15,101])for(const source of ['{{PD}}<!--comentário-->\n{{pd}}\nTexto','<!--comentário-->{{Página de discussão}}\n{{PD}}\nTexto']){
 integrated(source,{...talk,namespaceNumber:ns},text=>eq(text,'{{PD}}\n<!--comentário-->\nTexto','Every discussion action keeps one top header and preserves the body/comment'));
 const prep=api.v25TalkPreparationPlan(source,'',{...talk,namespaceNumber:ns});eq(prep.text,'{{PD}}\n<!--comentário-->\nTexto','Create code uses the same comment-safe banner preparation');
}
for(const source of ['Mensagem {{PD}} exemplo.\n{{pd}}','{{PD|aviso=um}}\n{{pd|aviso=dois}}'])eq(api.v2215PdPlan(source,talk).text,source,'A prose/configuration conflict cannot create another banner');
eq(api.v2215PdPlan('<blockquote>{{PD}}</blockquote>\n{{pd}}',talk).text,'{{PD}}\n<blockquote>{{PD}}</blockquote>\n','A quoted banner stays byte-identical while the eligible active header is moved');
for(const model of ['Citar web','Citar livro','Citar periódico'])for(const [value,target]of [['subscription','subscrição'],['registration','registro'],['limited','limitada'],['free','free']]){
 const source='{{'+model+'|title=Texto|url=https://example.org|url-access='+value+'}}';
 integrated(source,cfg,text=>{eq(text.includes('|acessourl='+target),true,'A proven URL-access enum keeps the same access meaning and native lock');eq(text.includes('https://example.org'),true,'The URL is retained during access normalization');});
}
const draftSource='{{Citar web|title= Exemplo|date= 8 February 2003}}\n[[Image:Example.jpg|thumb|200px|Legenda]]\n{{Portal3|Biography|Women|France}}';
for(const title of ['Usuário:Conta de Teste/Testes','Usuário(a):Conta de Teste/Testes/Artigo','Usuária:Conta de Teste/Rascunho','User:Example test account/Rascunho/Artigo']){
 const options={...cfg,namespaceNumber:2,pageTitle:title};
 eq(api.v2215ArticleDraftContext(options,draftSource),true,'A full generic article draft has an explicit bounded scope');
 eq(api.v2215AliasPlan(draftSource,options).text,api.v2215AliasPlan(draftSource,cfg).text,'The same article receives the same alias fixes in mainspace and a bounded draft');
 integrated(draftSource,options,text=>{eq(text.includes('=Exemplo'),true,'Draft fields receive the verified alias and spacing fixes');eq(text.includes('8 de fevereiro de 2003'),true,'Draft bibliography dates retain their literal calendar');eq(text.includes('[[Imagem:Example.jpg|miniatura|200px|Legenda]]'),true,'Draft image syntax is localized without changing the caption');eq(text.includes('Biografias|Mulheres|França'),true,'Draft portal names use the verified destinations');});
}
for(const [title,delta]of [
 ['Usuário:Conta de Teste',{}],['Usuário:Conta de Teste/PU',{}],['Usuário:Conta de Teste/Perfil',{}],['Usuário:Conta de Teste/common.js',{}],['Usuário:Conta de Teste/Testes/common.js',{}],['Usuário:Conta de Teste/Testes/model.css',{}],['Usuário:Conta de Teste/Rascunho/model.json/doc',{}],['Usuário:Conta de Teste/Testes/Predefinição:Modelo',{}],['Usuário:Conta de Teste/Rascunho/Módulo:Modelo',{}],['Usuário:Conta de Teste/Testes',{contentModel:'javascript'}],['Usuário:Conta de Teste/Testes',{sectionOnly:true}],['Usuário:Conta de Teste/Testes',{section:'1'}],['Usuário:Conta de Teste/Testes',{templateDefinition:true}]
]){
 const options={...cfg,namespaceNumber:2,pageTitle:title,...delta};eq(api.v2215ArticleDraftContext(options,draftSource),false,'An ordinary profile, code page, template definition or section is excluded');eq(api.v2215AliasPlan(draftSource,options).text,draftSource,'Excluded user-page contexts do not receive the new alias preferences');
}
for(const source of ['<noinclude>'+draftSource+'</noinclude>','<includeonly>'+draftSource+'</includeonly>','{{{1|'+draftSource+'}}}'])eq(api.v2215ArticleDraftContext({...cfg,namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'},source),false,'Active template-definition syntax cannot turn a sandbox into an article context');
eq(api.v2215ArticleDraftContext({...cfg,namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'},'<nowiki>{{{1|Exemplo}}}</nowiki>\n'+draftSource),true,'A protected example does not masquerade as an active model definition');
const receipt={suite:'expanded-native-reader-and-portal-contracts-2.21.5',runtimeSha256:sha(fs.readFileSync(runtime)),checks,calculations,counts,failures};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'All expanded native and false-positive contracts pass');
