'use strict';
// This standalone local UI contract reuses the native browser adapter. Only
// the exact loopback-host allowlist and synthetic read replies are adapted.
// Run it after any other native browser suite has released its session.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const here=__dirname,currentPath=path.resolve(here,'../v219/browser/current_ui.cjs'),current=fs.readFileSync(currentPath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(current.split(anchor).length!==2)throw new Error('The exact native browser harness entry point changed');
let prefix=current.slice(0,current.indexOf(anchor)).replaceAll('2.19.0','2.21.0').replaceAll('2_19_0','2_21_0').replaceAll('expected_release_v2190.json','expected_release_v2210.json');
prefix=prefix.replaceAll('source:window.__rw219UI?.read(),','source:window.__rw219UI?.read(),foreignReads:window.__rw219UI?.foreignReads,');
prefix=prefix.replaceAll("path.join(__dirname,'current_fixture.js')","path.join(__dirname,'../../v221/biography_ui_fixture.js')");

const hostStart=prefix.indexOf('const guard='),hostEnd=prefix.indexOf('const talkCatalogPath=',hostStart);
if(hostStart<0||hostEnd<0)throw new Error('The exact host-adapter boundary changed');
prefix=prefix.slice(0,hostStart)+String.raw`
const guardPairs=[
 ["if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;","if (host ? !['pt.wikipedia.org','127.0.0.1'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;"],
 ["if(host?host!=='pt.wikipedia.org':root.mw.config.get('wgDBname')!=='ptwiki')return;","if(host?!['pt.wikipedia.org','127.0.0.1'].includes(host):root.mw.config.get('wgDBname')!=='ptwiki')return;"]
];
for(const kind of ['core','complete']){const pairs=guardPairs.filter(pair=>scripts[kind].includes(pair[0]));assert.equal(pairs.length,1);const[from,to]=pairs[0];assert.equal(scripts[kind].split(from).length,2);scripts[kind]=scripts[kind].replace(from,to);}
const modulePairs=[
 ["if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;","if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;"],
 ["if(!root.mw?.loader||(root.location?.hostname||root.mw.config?.get('wgServerName'))!=='pt.wikipedia.org')return;","if(!root.mw?.loader||!['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname||root.mw.config?.get('wgServerName')))return;"]
];
const modulePair=modulePairs.filter(pair=>scripts.core.includes(pair[0]));assert.equal(modulePair.length,1);assert.equal(scripts.core.split(modulePair[0][0]).length,2);scripts.core=scripts.core.replace(modulePair[0][0],modulePair[0][1]);
`+prefix.slice(hostEnd);

const body=String.raw`
report.kind='native-ui-full-infobox-entity-preflight';
report.scope='Actual UI preflight, source-bound full entity/revision proof, production Worker/staged executors, editor apply and undo. Anonymous Wikidata replies are fictional and do not establish facts about a real article.';
report.originalBrowserHarnessSha256=sha(fs.readFileSync(${JSON.stringify(currentPath)}));
report.runnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
report.fixtureScriptSha256=sha(fs.readFileSync(${JSON.stringify(path.join(here,'biography_ui_fixture.js'))}));
const bioSource='{{Info/Patologia|Nome=Tema fictício|ICDO=00123}}\n\nTexto fictício.',
 bioExpected=bioSource.replace('ICDO=','CIDO=');
async function setup(bundle,scenario='normal',flags={},source=bioSource){
 await load(bundle,scenario,'classic');await read('(()=>{__rw219UI.write('+JSON.stringify(source)+');return true})()');
 for(const [key,value]of Object.entries({authorityControl:false,automaticTopicPortals:false,biographyPortal:false,automaticBiographyPortals:false,...flags})){
  const selector='input[data-option="'+key+'"]';await openParents(selector);
  if(!await read('!!document.querySelector('+JSON.stringify(selector)+')')){
   eq(key,'automaticInfoboxValues','Only the known non-checkbox preference uses the official personal configuration');
   await read('(()=>{RevisaWikiConfig['+JSON.stringify(key)+']='+JSON.stringify(value)+';return true})()');
   (report.personalOptionOverrides||=[]).push({key,value,mechanism:'RevisaWikiConfig'});continue;
  }
  if(await read('document.querySelector('+JSON.stringify(selector)+').checked')!==value)await toggle(selector);
 }
}
async function fullForeignInvariant(){
 const rows=await read('__rw219UI.foreignReads||[]');
 ok(rows.every(r=>r.endpoint==='https://www.wikidata.org/w/api.php'&&r.anonymous&&r.method==='GET'&&r.parameters.action==='wbgetentities'&&r.parameters.ids==='Q123'&&r.parameters.props==='info|claims|sitelinks'),'Every entity read is anonymous, full and bound to the fictional item');
}
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
  await driver.start(origin);report.browserVersion=driver.version;
  for(const bundle of ['core','complete']){
   for(const engine of ['worker','staged'])await test(bundle+'-full-entity-positive-'+engine,async()=>{
    await setup(bundle,engine==='worker'?'normal':'fallback');await adjust();
    eq(await read('__rw219UI.read()'),bioExpected,'The exact native key changes while its literal identifier remains unchanged');
    eq(await read('RevisaWiki.processing.engine'),engine,'The real production executor consumes the preflight proof');
    eq(await read('(__rw219UI.foreignReads||[]).length'),1,'One anonymous full entity read confirms the fallback property');
    await fullForeignInvariant();
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),bioSource,'Undo restores every original byte');
    await adjust();eq(await read('__rw219UI.read()'),bioExpected,'Applying again refreshes the exact source binding');
    eq(await read('(__rw219UI.foreignReads||[]).length'),1,'The full read cache avoids duplicate network requests');
   });
   await test(bundle+'-full-entity-matching-property',async()=>{
    await setup(bundle);await read('(()=>{__rw219UI.humanEntity.claims.P563=[{rank:"normal",mainsnak:{property:"P563",snaktype:"value",datavalue:{value:"00123"}}}];return true})()');
    await adjust();eq(await read('__rw219UI.read()'),bioExpected,'A literally matching normal unqualified claim permits the exact migration');await fullForeignInvariant();
   });
   for(const [name,source,expected]of [
    ['clinical-database','{{Info/Patologia|Nome=Tema fictício|diseasesDB=00123}}\n\nTexto fictício.','{{Info/Patologia|Nome=Tema fictício|DiseasesDB=00123}}\n\nTexto fictício.'],
    ['clinical-field','{{Info/Patologia|Nome=Tema fictício|field=Cardiologia}}\n\nTexto fictício.','{{Info/Patologia|Nome=Tema fictício|campo=Cardiologia}}\n\nTexto fictício.'],
    ['software-repository','{{Info/Software|nome=Tema fictício|repo=https://example.invalid/repo}}\n\nTexto fictício.','{{Info/Software|nome=Tema fictício|repositório=https://example.invalid/repo}}\n\nTexto fictício.']
   ])await test(bundle+'-full-entity-'+name,async()=>{
    await setup(bundle,'normal',{},source);await adjust();eq(await read('__rw219UI.read()'),expected,'The exact consumer/property fallback path preserves the full literal value');
    eq(await read('(__rw219UI.foreignReads||[]).length'),1,'This explicit property fallback requests a full entity proof');await fullForeignInvariant();
   });
   for(const [name,mutate]of [
    ['wrong-entity','__rw219UI.humanEntity.id="Q999"'],
    ['wrong-title','__rw219UI.humanEntity.sitelinks.ptwiki.title="Outro tema"'],
    ['missing-revision','delete __rw219UI.humanEntity.lastrevid'],
    ['missing-claims','delete __rw219UI.humanEntity.claims'],
    ['null-claims','__rw219UI.humanEntity.claims=null'],
    ['array-claims','__rw219UI.humanEntity.claims=[]'],
    ['empty-string-claims','__rw219UI.humanEntity.claims=""'],
    ['string-claims','__rw219UI.humanEntity.claims="not-an-object"'],
    ['false-claims','__rw219UI.humanEntity.claims=false'],
    ['true-claims','__rw219UI.humanEntity.claims=true'],
    ['zero-claims','__rw219UI.humanEntity.claims=0'],
    ['one-claims','__rw219UI.humanEntity.claims=1'],
    ['number-claims','__rw219UI.humanEntity.claims=13'],
    ['conflicting-property','__rw219UI.humanEntity.claims.P563=[{rank:"normal",mainsnak:{property:"P563",snaktype:"value",datavalue:{value:"999"}}}]'],
    ['qualified-property','__rw219UI.humanEntity.claims.P563=[{rank:"normal",qualifiers:{P580:[{}]},mainsnak:{property:"P563",snaktype:"value",datavalue:{value:"00123"}}}]'],
    ['read-failure','__rw219UI.foreignFailure=true']
   ])await test(bundle+'-full-entity-refusal-'+name,async()=>{
    await setup(bundle);await read('(()=>{'+mutate+';return true})()');await adjust();
    eq(await read('__rw219UI.read()'),bioSource,'Unconfirmed or conflicting evidence preserves every original byte');await fullForeignInvariant();
   });
   const mapControls=JSON.parse(${JSON.stringify(JSON.stringify(require('./biography_claims_schema_cases.json')))}),existingPrimitiveControls=new Set(['null','array','string','empty-string','false','true','zero','one','number']);
   for(const row of [...mapControls.valid,...mapControls.invalid].filter(row=>!existingPrimitiveControls.has(row.id)))await test(bundle+'-full-entity-map-'+row.id,async()=>{
    await setup(bundle);await read('(()=>{__rw219UI.humanEntity.claims=JSON.parse('+JSON.stringify(JSON.stringify(row.claims))+');return true})()');await adjust();
    eq(await read('__rw219UI.read()'),row.expected?bioExpected:bioSource,'The independently typed map shape controls exact migration or original-byte preservation');await fullForeignInvariant();
   });
   await test(bundle+'-full-entity-no-item',async()=>{
    await setup(bundle);await read('mw.config.set("wgWikibaseItemId",null)');await adjust();
    eq(await read('__rw219UI.read()'),bioSource,'No item means no invented fallback proof');
    eq(await read('(__rw219UI.foreignReads||[]).length'),0,'No item is guessed or searched');
   });
   await test(bundle+'-full-entity-option-off',async()=>{
    await setup(bundle,'normal',{automaticParameterNames:false});await adjust();
    eq(await read('__rw219UI.read()'),bioSource,'The disabled migration remains unchanged');
    eq(await read('(__rw219UI.foreignReads||[]).length'),0,'The disabled option performs no full entity read');
   });
   await test(bundle+'-legacy-infobox-value-option-off',async()=>{
    const source='{{Info/Político|nome=Tema fictício|ocupacao=pesquisadora}}\n\nTexto fictício.';
    await setup(bundle,'normal',{automaticInfoboxValues:false},source);await adjust();
    eq(await read('__rw219UI.read()'),source,'A new finite mapping cannot bypass the existing disabled infobox-value option');
   });
   for(const [name,source,expected]of [
    ['native-img','{{Info/Clube de futebol|nome=Tema fictício|img=Example.jpg|legenda=Legenda preservada}}\n\nTexto fictício.','{{Info/Clube de futebol|nome=Tema fictício|img=Example.jpg|imagem_legenda=Legenda preservada}}\n\nTexto fictício.'],
    ['conflicting-image','{{Info/Ator|nome=Tema fictício|imagem=Other.jpg|image=Example.jpg|imagesize=250px}}\n\nTexto fictício.','{{Info/Ator|nome=Tema fictício|imagem=Other.jpg|image=Example.jpg|imagesize=250px}}\n\nTexto fictício.'],
    ['after-image-prerequisite','{{Info/Ator|nome=Tema fictício|image=Example.jpg|imagesize=250px}}\n\nTexto fictício.','{{Info/Ator|nome=Tema fictício|imagem=Example.jpg|imagem_tamanho=250px}}\n\nTexto fictício.']
   ])await test(bundle+'-literal-image-'+name,async()=>{
    await setup(bundle,'normal',{},source);await adjust();eq(await read('__rw219UI.read()'),expected,'Only an actual native image binding proves the dependent field; a qualified earlier repair may establish that binding');
   });
   await test(bundle+'-full-entity-stale-draft',async()=>{
    await setup(bundle);await read('__rw219UI.holdForeignRead=true');await click('.ajg-run');
    await waitFor('__rw219UI.heldForeignReads?.length>0','the real preflight read is held');
    const newer=bioSource+'\nTexto acrescentado pelo editor.';await read('__rw219UI.write('+JSON.stringify(newer)+')');
    eq(await read('__rw219UI.releaseForeignReads()'),1,'Only the held fixture read is released');
    await settled();eq(await read('__rw219UI.read()'),newer,'A stale read cannot overwrite a newer editor draft');await fullForeignInvariant();
   });
   await test(bundle+'-full-entity-protected-owner',async()=>{
    const literal='<nowiki>'+bioSource+'</nowiki>';await setup(bundle,'normal',{},literal);await adjust();
    eq(await read('__rw219UI.read()'),literal,'A literal protected template is preserved');
    eq(await read('(__rw219UI.foreignReads||[]).length'),0,'A protected example requests no entity evidence');
   });
   for(const [label,owner,fields,from,to]of [
    ['wins-total','Info/Tenista','vitorias_simples=12'],
    ['wins-pair','Info/Tenista','vitorias_simples=12–3','vitorias_simples','vitoriasderrotassimples'],
    ['doubles-pair','Info/Tenista','vitorias_duplas=12–3','vitorias_duplas','vitoriasderrotasduplas'],
    ['money-honour','Info/Tenista','premiacao=Medalha de ouro'],
    ['money-amount','Info/Tenista','premiacao=US$ 1234','premiacao','premiosganhos'],
    ['icao-iata','Info/Aeroporto','icao=GIG'],
    ['icao-code','Info/Aeroporto','icao=SBGL','icao','código_ICAO'],
    ['website-text','Info/Aeroporto','site=Página oficial'],
    ['website-link','Info/Aeroporto','site=[https://example.invalid Página oficial]','site','website'],
    ['payload-missing','Info/Foguete','carga útil-LEO=1000 kg|payload-location=Órbita baixa'],
    ['payload-pair','Info/Foguete','carga útil-LEO=1000 kg|payload=100 kg|payload-location=Órbita baixa','payload-location','carga útil-localização'],
    ['football-caption-inactive','Info/Futebolista','imagem=Example.jpg|legenda=Legenda preservada'],
    ['football-caption-active','Info/Futebolista','imagem=Example.jpg|imagem_tamanho=250px|legenda=Legenda preservada','legenda','imagem_legenda'],
    ['youth-list-mismatch','Info/Futebolista','jovemanos=2000<br/>2001|jovemclube=Clube A'],
    ['youth-list-pair','Info/Futebolista','jovemanos=2000<br/>2001|jovemclube=Clube A<br/>Clube B','jovemclube','jovemclubes'],
    ['career-list-mismatch','Info/Futebolista','ano=2000<br/>2001|clubes=Clube A<br/>Clube B|jogos (golos)=10 (1)'],
    ['career-list-pair','Info/Futebolista','ano=2000<br/>2001|clubes=Clube A<br/>Clube B|jogos (golos)=10 (1)<br/>20 (2)','jogos (golos)','jogos(golos)'],
    ['census-missing','Info/Condado dos Estados Unidos','população=100'],
    ['census-pair','Info/Condado dos Estados Unidos','censo_data=2020|população=100','população','populacao'],
    ['percent-area','Info/Condado dos Estados Unidos','área_água_p=50 km²'],
    ['percent-number','Info/Condado dos Estados Unidos','área_água_p=12.5','área_água_p','perc_água'],
    ['closure-state','Info/Canal de televisão','extinção=ativo'],
    ['closure-date','Info/Canal de televisão','extinção=2020','extinção','data_encerramento'],
    ['binomial-family','Info/Taxonomia','binominal=Canidae'],
    ['binomial-pair','Info/Taxonomia',"binominal=''Canis lupus''",'binominal','binomial'],
    ['native-occupation-alias','Info/Biografia','outros nomes=Nome novo|apelido=Nome anterior'],
    ['native-image-size-alias','Info/Ator','imagem=Example.jpg|imagesize=250px|tamanho_imagem=300px'],
    ['native-software-alias','Info/Software','developer=Nome novo|programador=Nome anterior'],
    ['original-film-empty-destination','Info/Filme','cinematography=Nome preservado|cinematografia=','cinematography','cinematografia']
   ])await test(bundle+'-approved-predicate-'+label,async()=>{
    const source='{{'+owner+'|nome=Tema fictício|'+fields+'}}\n\nTexto fictício.',
     expected=label==='original-film-empty-destination'?source.replace('|cinematografia=','').replace('|cinematography=','|cinematografia='):
      from?source.replace('|'+from+'=','|'+to+'='):source;
    await setup(bundle,'normal',{},source);await adjust();eq(await read('__rw219UI.read()'),expected,'The real editor applies only the independently qualified native endpoint');
    if(from){await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores every byte after the qualified adjustment');}
   });
   for(const [label,wrap]of [
    ['table',source=>'{| class="wikitable"\n|\n'+source+'\n|}'],
    ['html',source=>'<div class="example">\n'+source+'\n</div>'],
    ['reference',source=>'Texto<ref>\n'+source+'\n</ref>\n\n{{Referências}}']
   ])await test(bundle+'-principal-outside-owner-'+label,async()=>{
    const source=wrap('{{Info/Político|nome=Tema fictício|vice-título2=Valor preservado}}');
    await setup(bundle,'normal',{},source);await adjust();eq(await read('__rw219UI.read()'),source,'A nested infobox cannot be treated as the principal article owner');
   });
   await test(bundle+'-native-valid-tennis-fields',async()=>{
    const literal='{{Info/Tenista|nome=Tema fictício|Resultadograndslamsimples=sim|Resultadograndslamduplas=sim|Resultadograndslamsduplas=Outro}}\n\nTexto fictício.';
    await setup(bundle,'normal',{},literal);await adjust();eq(await read('__rw219UI.read()'),literal,'Already consumed native keys and conflicting switches retain every byte');
    const payload=await read('({workerResults:__rw219UI.workerResults.length,result:__rw219UI.workerResults.at(-1)?.result,reviewText:document.querySelector(".ajg-review-area")?.textContent||""})');
    ok(payload.workerResults>0&&payload.result,'The actual Worker payload is available for diagnosis');
    ok(!(payload.result.suggestions||[]).some(row=>row.reviewGroup?.kind==='unsupported-template-parameter'&&['Resultadograndslamsimples','Resultadograndslamduplas'].includes(row.reviewGroup.parameter)),'Consumed native heading switches are not reported as unknown parameters');
    eq(await read('(__rw219UI.foreignReads||[]).length'),0,'Native-valid tennis switches need no entity read');
   });
   for(const [name,args,remove]of [['owned-label','id=1234567|2=Nome fictício',true],['overridden-id','id=1234567|1=7654321',false]])await test(bundle+'-imdb-'+name,async()=>{
    const source='{{Info/Ator|nome=Tema fictício|imdb=1234567}}\n\nTexto fictício.\n\n== Ligações externas ==\n* {{IMDb nome|'+args+'}}',
     expected=remove?source.replace('|imdb=1234567',''):source;
    await setup(bundle,'normal',{},source);await adjust();eq(await read('__rw219UI.read()'),expected,'IMDb removal requires unambiguous native argument ownership');
    eq(await read('(__rw219UI.foreignReads||[]).length'),0,'Literal external identifier ownership needs no entity lookup');
   });
   for(const [label,suffix]of [['existing-renderer','\n\n{{Referências}}'],['active-body-reference','<ref name="B">Fonte no corpo.</ref>']])await test(bundle+'-infobox-reference-'+label,async()=>{
    const source='{{Info/Político|nome=Tema fictício|vice-título2=Valor preservado<ref name="A">Fonte.</ref>}}\n\nTexto fictício.'+suffix+'\n\n[[Categoria:Exemplos]]';
    await setup(bundle,'normal',{},source);await adjust();
    const output=await read('__rw219UI.read()'),payload=await read('__rw219UI.workerResults.at(-1)?.result');
    ok(payload,'An actual Worker outcome is available for the context-qualified positive');
    ok(output.includes('vice_título2=Valor preservado<ref name="A">Fonte.</ref>'),'The native target and original reference remain intact');
    ok(!output.includes('vice-título2='),'The exact unsupported alias migrates in qualified reference context');
    if(label==='existing-renderer')eq((output.match(/\{\{Referências\}\}/g)||[]).length,1,'The existing reference collector is preserved without duplication');
    else ok(output.includes('<ref name="B">Fonte no corpo.</ref>'),'The active body reference is preserved');
    ok((await read('RevisaWiki.v219AutomaticResultSafety('+JSON.stringify(source)+',__rw219UI.workerResults.at(-1).result)')).accepted,'The authoritative gate accepts the context-qualified positive');
   });
   await test(bundle+'-negative-ignored-reference-no-empty-renderer',async()=>{
    const source='{{Info/Político|nome=Tema fictício|vice-título2=Valor preservado<ref name="A">Fonte.</ref>|vice_título2=Outro}}\n\nTexto fictício.\n\n[[Categoria:Exemplos]]';
    await setup(bundle,'normal',{},source);await click('.ajg-run');await settled();
    const payload=await read('__rw219UI.workerResults.at(-1)?.result');ok(payload,'An actual Worker outcome is available');
    const gate=await read('RevisaWiki.v219AutomaticResultSafety('+JSON.stringify(source)+',__rw219UI.workerResults.at(-1).result)');
    eq(await read('__rw219UI.read()'),source,'A reference in an ignored conflicting field cannot produce an empty reference heading or change any editor byte');
    (report.negativeOriginalPreservation||=[]).push({bundle,gateAccepted:gate.accepted,gateCode:gate.code,originalSha256:sha(source),appliedSha256:sha(await read('__rw219UI.read()'))});
    ok(!(payload.changes||[]).some(c=>/^v221(?:Infobox|Specialized|RedundantImdb|ImageOption|ConfirmedPortals)/.test(c.id)),'No new BIO correction is credited on this no-op negative');
   });
   await test(bundle+'-conditional-field-reference-preserves-original-without-collector',async()=>{
    const source='{{Info/Político|nome=Tema fictício|vice-título2=Valor preservado<ref name="A">Fonte.</ref>}}\n\nTexto fictício.\n\n[[Categoria:Exemplos]]';
    await setup(bundle,'normal',{},source);await click('.ajg-run');await settled();
    eq(await read('__rw219UI.read()'),source,'An unconfirmed conditional reference cannot cause a proposed field migration and empty reference section to be applied');
    const outcomes=await read('__rw219UI.workerResults.filter(row=>typeof row.result?.text==="string").map(row=>({text:row.result.text,gate:RevisaWiki.v219AutomaticResultSafety('+JSON.stringify(source)+',row.result)}))');
    ok(outcomes.length,'The real Worker proposals are retained for diagnosis');
    ok(outcomes.some(row=>!row.gate.accepted),'At least one actual proposed endpoint is safely blocked for this unconfirmed rendering scope');
    ok(/recusados pela verificação de preservação/.test(await read('document.querySelector(".ajg-status")?.textContent||""')),'The UI records the authoritative preservation refusal');
    (report.safelyBlockedConditionalReferences||=[]).push({bundle,originalSha256:sha(source),outcomes:outcomes.map(row=>({gateCode:row.gate.code,accepted:row.gate.accepted,proposalSha256:sha(row.text)})),appliedSha256:sha(await read('__rw219UI.read()'))});
   });
  }
 }catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}
 finally{
  report.blockedNetwork=driver.blocked||[];report.pageErrors=driver.errors||[];
  try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-session-cleanup',message:String(error.message)});try{await driver.close();}catch{}}
  await new Promise(resolve=>server.close(resolve));report.fullActionCases=report.tests.length;
  process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
`;
const adapted=prefix+'\n'+body,compiled=new Module(currentPath,module);compiled.filename=currentPath;
compiled.paths=Module._nodeModulePaths(path.dirname(currentPath));
if(process.env.REVISAWIKI_BIO_UI_COMPILE_ONLY==='1')new(require('node:vm').Script)(adapted,{filename:__filename});
else compiled._compile(adapted,currentPath);

