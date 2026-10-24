'use strict';
// Independent literal endpoints for the approved consumer and alias predicates.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {api,cfg,full}=require('./citation_contracts.cjs');
const cases=[],add=(id,before,after=before)=>cases.push({id,before,after}),url='https://example.org/a',
 archive='https://web.archive.org/web/20200101000000/'+url,
 state=tail=>'{{Citar web|url='+url+'|título=Obra|arquivourl='+archive+'|arquivodata=2020-01-01|'+tail+'}}';
const links=['link-autor','linkautor','link-autor1','linkautor1'];
for(let i=0;i<links.length;i++)for(let j=0;j<links.length;j++)if(i!==j){
 for(const value of ['Outra pessoa',' ','{{Valor fictício}}'])add('author-import-peers-'+i+'-'+j+'-'+value,
  '{{Citar livro|título=Obra|autor=Pessoa|'+links[i]+'=Destino|'+links[j]+'='+value+'}}');
}
for(const native of ['autorlink','autorlink1','author-link','author-link1','authorlink','authorlink1'])
 for(const value of ['Outra pessoa',' '])add('author-native-peer-'+native+'-'+value,
  '{{Citar livro|título=Obra|autor=Pessoa|link-autor=Destino|'+native+'='+value+'}}');
for(const authors of ['author=|autor=Alice','autor=Alice|author=','author=Bob|autor=Alice','author=|autor=',
 'author=','autor=','author={{Valor fictício}}'])add('tweet-author-binding-'+authors,
 '{{Citar tweet|'+authors+'|user=exemplo|number=123|date=2020-01-01|title=Mensagem|link-autor=Pessoa}}');
for(const authors of ['autor=Alice','author=Alice'])add('tweet-single-effective-'+authors,
 '{{Citar tweet|'+authors+'|user=exemplo|number=123|date=2020-01-01|title=Mensagem|link-autor=Pessoa}}',
 '{{Citar tweet|'+authors+'|user=exemplo|number=123|date=2020-01-01|title=Mensagem|autorlink=Pessoa}}');
const surnames=['ultimo-editor','último-editor','editor-ultimo','editor-último','ultimo-editor1','último-editor1',
 'editor-ultimo1','editor-último1','editor1-ultimo','editor1-último'];
for(let i=0;i<surnames.length;i++)for(let j=0;j<surnames.length;j++)if(i!==j)
 for(const value of ['Souza',' '])add('editor-import-peers-'+i+'-'+j+'-'+value,
  '{{Citar livro|título=Obra|'+surnames[i]+'=Silva|'+surnames[j]+'='+value+'}}');
for(const first of ['primeiro-editor','primeiro-editor1'])for(const second of ['primeiro-editor','primeiro-editor1'])if(first!==second)
 add('editor-first-index-one-peers-'+first,'{{Citar livro|título=Obra|editor-sobrenome=Silva|'+first+'=Ana|'+second+'=Maria}}');
for(const native of ['editor-sobrenome','editor-sobrenome1','editor-last','editor-last1'])
 for(const value of ['Outro',' '])add('editor-native-peer-'+native+'-'+value,
  '{{Citar livro|título=Obra|editor1-ultimo=Silva|'+native+'='+value+'}}');
add('two-distinct-editors','{{Citar livro|título=Obra|ultimo-editor=Silva|editor2-ultimo=Souza}}',
 '{{Citar livro|título=Obra|editor-sobrenome=Silva|editor-sobrenome2=Souza}}');
add('first-and-last-distinct-roles','{{Citar livro|título=Obra|ultimo-editor=Silva|primeiro-editor=Ana}}',
 '{{Citar livro|título=Obra|editor-sobrenome=Silva|editor-nome=Ana}}');
const stateAliases=['statusurl','urlmorto','urlmorta','dead-url','deadurl','datali','li','ligação inativa','ligação inactiva'];
for(const alias of stateAliases)for(const value of ['',' ','sim','{{Estado fictício}}']){
 add('state-empty-peers-after-'+alias+'-'+value,state('url-status=live|'+alias+'='+value));
 add('state-empty-peers-before-'+alias+'-'+value,state(alias+'='+value+'|url-status=live'));
}
for(const alias of stateAliases)add('archive-coupled-state-peer-'+alias,
 '{{Citar web|url='+url+'|título=Obra|arquivurl='+archive+'|dataarquivo=2020-01-01|url-status=live|'+alias+'=}}');
add('missing-pipe-state-peer','{{Citar web|url='+url+'|título=Obra|arquivodata=2020-01-01|urlmorta=deadarchiveurl='+archive+'|deadurl=}}');
add('single-literal-state',state('url-status=live'),state('urlmorta=não'));
for(const owner of ['Citar livro','Citar web','Citar periódico'])add('consumed-at-'+owner,
 '{{'+owner+'|título=Obra|loc=§2}}','{{'+owner+'|título=Obra|em=§2}}');
add('game-at-is-overridden','{{Citar jogo eletrônico|título=Jogo|loc=§2}}');
add('game-sdata-is-consumed','{{Citar jogo eletrônico|título=Jogo|sdata=2020-01-01}}',
 '{{Citar jogo eletrônico|título=Jogo|data=2020-01-01}}');
for(const field of ['transmissão','air-date','airdate','início','began','fim','ended'])
 for(const value of ['2020-01-01','','{{Data fictícia}}'])add('episode-date-fallback-'+field+'-'+value,
  '{{Citar episódio|título=Episódio|série=Série|'+field+'='+value+'|sdata=2019-01-01}}');
add('episode-date-without-fallback','{{Citar episódio|título=Episódio|série=Série|sdata=2019-01-01}}',
 '{{Citar episódio|título=Episódio|série=Série|data=2019-01-01}}');
for(const field of ['urlconferencia','conference-url','conferência-url'])for(const value of ['inválida','',' ','{{URL fictícia}}'])
 add('conference-format-unproved-'+field+'-'+value,
  '{{Citar conferência|título=Obra|evento=Encontro|'+field+'='+value+'|formato-conferencia=PDF}}');
for(const field of ['conference-url','conferência-url'])for(const value of ['https://example.org/other','',' '])
 add('conference-format-competing-url-'+field+'-'+value,
  '{{Citar conferência|título=Obra|evento=Encontro|urlconferencia='+url+'|'+field+'='+value+'|formato-conferencia=PDF}}');
add('conference-format-qualified-transaction','{{Citar conferência|título=Obra|evento=Encontro|urlconferencia='+url+'|formato-conferencia=PDF}}',
 '{{Citar conferência|título=Obra|evento=Encontro|conference-url='+url+'|formato-conferência=PDF}}');
add('conference-format-qualified-native','{{Citar conferência|título=Obra|evento=Encontro|conference-url='+url+'|formato-conferencia=PDF}}',
 '{{Citar conferência|título=Obra|evento=Encontro|conference-url='+url+'|formato-conferência=PDF}}');
let checks=0,calculateCalls=0,gateCalls=0;const failures=[],results=[];
for(const row of cases){
 try{
  const source=full(row.before),expected=full(row.after),plan=api.v221CitationPlan(source,cfg);
  assert.equal(plan.text,expected,row.id+' independent endpoint');checks++;
  assert(api.v221CitationPlanProof(source,expected,plan,cfg));checks++;
  assert.equal(api.v221CitationPlan(expected,cfg).text,expected,row.id+' idempotence');checks++;
  assert.equal(api.v221CitationPlanProof(source,expected,{...plan,sourceHash:'forged'},cfg),false);checks++;
  if(api.version==='2.21.0'){
   const result=api.calculate({kind:'adjust',source,originalSource:source,options:{...cfg,singleLineCitations:false}});calculateCalls++;
   const gate=api.v219AutomaticResultSafety(source,result);gateCalls++;
   assert(gate.accepted,row.id+' authoritative gate');checks++;
   assert.equal(result.text,expected,row.id+' whole endpoint');checks++;
   const next=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:{...cfg,singleLineCitations:false}});calculateCalls++;
   assert.equal(next.text,result.text,row.id+' whole idempotence');checks++;
  }
  results.push({id:row.id,status:'passed'});
 }catch(error){failures.push({id:row.id,error:error.message});results.push({id:row.id,status:'failed'});}
}
const report={kind:'approved-citation-predicates',runtimeVersion:api.version,
 sourceModuleSha256:crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../../src/v2_21/citation_repairs.js'))).digest('hex'),
 cases:cases.length,checks,calculateCalls,gateCalls,failures,results,
 scope:api.version==='2.21.0'?'Actual candidate calculate and authoritative final gate':'Actual saved parser with current citation module; whole candidate validation pending',wikipediaWrites:0};
if(process.env.REVISAWIKI_CITATION_PREDICATE_REPORT)fs.writeFileSync(process.env.REVISAWIKI_CITATION_PREDICATE_REPORT,JSON.stringify(report,null,2)+'\n');
if(process.argv.includes('--fixture-cases'))console.log(JSON.stringify({cases},null,2));
else console.log(JSON.stringify({...report,results:undefined,failures:failures.slice(0,8)}));
if(failures.length)process.exitCode=1;
