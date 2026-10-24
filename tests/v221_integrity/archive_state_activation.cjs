'use strict';
// Synthetic regression of native archived-link access activation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function run(api){
 const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Teste de referências',v216CalendarUTC:'2026-10-23'},url='https://example.invalid/a',archive='https://web.archive.org/web/20240101000000/'+url;
 const unsafe=['subscrição','registro','registo','limitada','invalid','unknown','{{Acesso}}','hidden-error','visible-error','accessdate','bdi','cite','cite-id','format','italic-title','kern-left','kern-right','nowrap1','nowrap2','ocins','parameter','quoted-text','quoted-title','trans-italic-title','trans-quoted-title','vol-bold'];
 const safe=['free','subscription','registration','limited',''];let checks=0,calculations=0,matrixCases=0;const witnesses=[];
 const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
 const call=(family,state,access,arc='arquivourl',tail='')=>'{{'+family+'|url='+url+'|título=Obra|'+arc+'='+archive+'|arquivodata=2024-01-01|'+state+'|acessourl='+access+tail+'}}';
 const inspect=(source,expected,label)=>{const plan=api.v221CitationPlan(source,cfg);eq(plan.text,expected,label);eq(api.v221CitationPlanProof(source,plan.text,plan,cfg),true,'The producer proof remains enabled');matrixCases++;return plan.text;};
 for(const family of ['Citar web','Citar livro','Citar jornal','Citar periódico','Citar revista']){
  for(const access of unsafe)for(const state of ['url-estado=dead','url-status=dead']){
   const source=call(family,state,access),unsafeAfter=source.replace(state,'urlmorta=sim');inspect(source,source,'Unsafe native OriginalAccess branch is not activated');eq(api.v221CitationMigrationSafe(source,unsafeAfter),false,'Later migration cannot bypass state-activation guard');
  }
  for(const access of safe)for(const state of ['url-estado=dead','url-status=dead']){
   const source=call(family,state,access),expected=source.replace(state,'urlmorta=sim');inspect(source,expected,'Four actual access-format keys and empty access remain eligible');eq(api.v221CitationMigrationSafe(source,expected),true,'Proved native format remains eligible');
  }
  for(const access of unsafe){
   const source=call(family,'urlmorta=sim',access,'arquivurl'),unsafeAfter=source.replace('arquivurl=','arquivourl=');inspect(source,source,'Archive-key insertion cannot activate unsafe original access');eq(api.v221CitationMigrationSafe(source,unsafeAfter),false,'Later archive insertion is blocked too');
   const live=call(family,'url-estado=live',access);inspect(live,live.replace('url-estado=live','urlmorta=não'),'A proved live main URL remains eligible');
  }
  for(const tail of ['|url-access=registration','|url-access=','|acesso-url=limited']){
   const source=call(family,'url-estado=dead','subscrição','arquivourl',tail);inspect(source,source,'Competing access fields are retained exactly');eq(api.v221CitationMigrationSafe(source,source.replace('url-estado=dead','urlmorta=sim')),false,'Competing access aliases cannot bypass migration guard');
  }
 }
 for(const access of unsafe){
  const chapter=call('Citar livro','url-estado=dead',access,'arquivourl','|chapter-url='+url+'|chapter=Parte');inspect(chapter,chapter.replace('url-estado=dead','urlmorta=sim'),'Actual supported book chapter branch remains eligible');
  const ignored=call('Citar jornal','url-estado=dead',access,'arquivourl','|chapter-url='+url+'|chapter=Parte');inspect(ignored,ignored,'An ignored chapter field is not an exception in another native consumer');
 }
 for(const key of ['url-access','acesso-url','acessourl'])for(const access of ['subscrição','registro','limitada','invalid','{{Acesso}}']){
  const source=call('Citar web','url-estado=dead',access).replace('|acessourl=','|'+key+'=');
  inspect(source,source,'Every native access alias has the same activation restriction');
  eq(api.v221CitationMigrationSafe(source,source.replace('url-estado=dead','urlmorta=sim')),false,'The native access alias does not bypass the migration guard');
 }
 for(const archiveKey of ['arquivurl','url-arquivo'])for(const dateKey of ['dataarquivo','data-arquivo'])for(const access of ['subscrição','registro','limitada','invalid']){
  const source=call('Citar web','urlmorta=sim',access,archiveKey).replace('|arquivodata=','|'+dateKey+'=');
  inspect(source,source,'A simultaneous archive URL/date insertion keeps the original unsafe call unchanged');
  eq(api.v221CitationMigrationSafe(source,source.replace(archiveKey+'=','arquivourl=').replace(dateKey+'=','arquivodata=')),false,'A complete URL/date migration cannot activate original access');
 }
 let legacyFamilies=0;
 for(const profile of Object.values(api.templateCatalog)){
  if(!profile?.title||!profile.dependencies?.some(row=>row.title==='Módulo:Citação/CS1'&&row.oldid===72936771))continue;
  const source=call(profile.title,'url-status=dead','subscrição');
  if(!api.v218CitationNativeContext(source))continue;
  eq(api.v221CitationMigrationSafe(source,source.replace('url-status=dead','urlmorta=sim')),false,'Every pinned inherited CS1 wrapper retains the activation restriction');legacyFamilies++;
 }
 eq(legacyFamilies,29,'The pinned inherited wrapper inventory is complete');
 const bar='{{Bar box|título=Obra}}';
 eq(api.v219SourceCompatibilityPlan(bar,cfg).text,'{{Bar box|title=Obra}}','A non-citation source-compatibility writer remains active');
 eq(api.v221CitationMigrationSafe('{{Info/Biografia|nome=Exemplo}}','{{Info/Biografia|nome=Exemplo|ocupação=atividade}}'),true,'Unrelated infobox migration is outside this citation guard');
 for(const state of ['\u00a0','\u202f','\u00a0no\u00a0','\u00a0não\u00a0','\u00a0live\u00a0','NÃO','NÃo','\f']){
  const source=call('Citar web','urlmorta='+state,'subscription');
  inspect(source,source,'Unicode whitespace and case folding cannot prove a native live state');
  eq(api.v221CitationMigrationSafe(source,source.replace('acessourl=subscription','acessourl=subscrição')),false,'A later access migration uses native ASCII state boundaries');
  eq(api.v219SourceCompatibilityPlan(source,cfg).text,source,'The inherited direct writer cannot bypass native state boundaries');
 }
 for(const state of ['',' ',' \t\r\n','no','NO','No','não','NãO','nãO']){
  const source=call('Citar web','urlmorta='+state,'subscription');
  inspect(source,source.replace('acessourl=subscription','acessourl=subscrição'),'Only native ASCII trim and ASCII case folding grant the live-state exception');
 }
 for(const key of ['Chapter-url','CHAPTER-URL','\u00a0chapter-url','chapter-url\u00a0']){
  const source=call('Citar livro','url-estado=dead','subscrição','arquivourl','|'+key+'='+url+'|chapter=Parte');
  inspect(source,source,'An ignored or unproved chapter key grants no native chapter exception');
  eq(api.v221CitationMigrationSafe(source,source.replace('url-estado=dead','urlmorta=sim')),false,'Wrong-case or Unicode-padded chapter keys cannot bypass the migration gate');
 }
 for(const key of ['\u00a0urlmorta','urlmorta\u00a0','\u00a0arquivourl','\u00a0acessourl']){
  const source=call('Citar web','urlmorta=sim','subscription').replace('|'+key.trim()+'=','|'+key+'=');
  inspect(source,source,'A Unicode-padded native key is retained without inventing an accepted parameter');
 }
 const proposed=call('Citar web','urlmorta=sim','subscrição');eq(api.v221CitationMigrationSafe('{{Modelo estrangeiro|url='+url+'}}',proposed),false,'Unproved original header cannot license unsafe native result');
 const generatedURL=call('Citar periódico','url-status=dead','subscrição').replace('|url='+url,'|pmc=12345');
 eq(api.v221CitationMigrationSafe(generatedURL,generatedURL.replace('url-status=dead','urlmorta=sim')),true,'Native validation clears access before a URL may be generated from PMC');
 const duplicated=proposed.replace('urlmorta=sim','urlmorta=sim|urlmorta=sim');eq(api.v221CitationMigrationSafe(proposed,duplicated),false,'Incomplete duplicate-key consumer proof preserves original');
 const complete=[call('Citar web','url-estado=dead','subscrição'),call('Citar livro','url-status=dead','registro'),call('Citar periódico','urlmorta=sim','limitada','arquivurl'),call('Citar revista','url-estado=dead','invalid'),call('Citar jornal','url-estado=dead','{{Acesso}}'),call('Citar web','url-estado=dead','free'),call('Citar livro','url-estado=dead','subscription'),call('Citar web','url-estado=live','subscrição'),call('Citar livro','url-estado=dead','registro','arquivourl','|chapter-url='+url+'|chapter=Parte'),call('Citar web','urlmorta=\u00a0','subscription'),call('Citar livro','urlmorta=NÃO','subscription'),call('Citar web','urlmorta=sim','subscription').replace('|url='+url,'|url=\u00a0'),call('Citar web','urlmorta=sim','subscription').replace('|arquivourl='+archive,'|arquivourl=\u00a0')];
 for(const raw of complete){
  const source='Texto.<ref>'+raw+'</ref>\n\n{{Referências}}\n',planned=api.v221CitationPlan(source,cfg),result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;eq(result.text,planned.text,'Full calculation cannot reactivate a declined native transition');eq(api.v219AutomaticResultSafety(source,result).accepted,true,'Full preservation gate stays enabled');const second=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});calculations++;eq(second.text,result.text,'Repeated full calculation is stable');witnesses.push({source:raw,applied:api.v221CitationPlan(raw,cfg).text});
 }
 return {status:'passed',checks,calculations,matrixCases,legacyCS1Families:legacyFamilies,witnesses};
}
module.exports={run};
if(require.main===module){
 const file=path.resolve(process.argv[2]||path.join(__dirname,'../../dist/2.21.0/RevisaWiki_v2_21_0_completo.js')),pin=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),result=run(require(file));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),pin);const {witnesses,...report}=result;console.log(JSON.stringify({...report,bundleSha256:pin,unmodifiedDistributionRequired:true,productExportsAltered:false,networkRequests:0,wikipediaWrites:0}));
}
