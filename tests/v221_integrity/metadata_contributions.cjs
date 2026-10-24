'use strict';
// Fictional fixtures for newly consumed native citation metadata.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function run(api){
 const cfg={...api.defaults,pageTitle:'Teste de referencias',namespaceNumber:0,contentModel:'wikitext',v216CalendarUTC:'2026-10-23'};
 let checks=0,calculations=0,matrixCases=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
 const families=['Citar web','Citar livro','Citar jornal','Citar periódico','Citar revista'];
 const unsafe=['Título','científico','Àrea','Ëxemplo','ǋome','Ωmega\u200b','Texto {{Modelo}}','Texto &iacute;','Texto &#237;','Texto <span>í</span>'];
 const safe=['Obra','Café','Ética','ação','https://example.invalid/cient%C3%ADfico'];
 const make=(family,fields)=>'{{'+family+'|url=https://example.invalid/a|título=Obra|'+fields+'}}';
 for(const family of families)for(const value of unsafe){
  const before=make(family,'campo-ignorado='+value),after=make(family,'autor='+value);
  eq(api.v221CitationMigrationSafe(before,after,cfg),false,'New unsafe author metadata remains unconsumed');matrixCases++;
 }
 for(const value of unsafe){
  const before='{{Lien web|url=https://example.invalid/a|titre='+value+'}}',after=before.replace('Lien web','Citar web').replace('|titre=','|título=');
  eq(api.v221CitationMigrationSafe(before,after,cfg),false,'A known local redirect does not prove that a foreign field was already consumed');matrixCases++;
 }
 for(const value of safe){
  const before='{{Lien web|url=https://example.invalid/a|titre='+value+'}}',after=before.replace('Lien web','Citar web').replace('|titre=','|título=');
  eq(api.v221CitationMigrationSafe(before,after,cfg),true,'A proved safe newly consumed title stays eligible');matrixCases++;
 }
 for(const value of ['Título','científico','Texto {{Modelo}}','Texto &iacute;']){
  const raw='{{Citar web|url=https://example.invalid/a|título='+value+'|data-acesso=2024-01-01}}',after=raw.replace('|data-acesso=','|acessodata=');
  eq(api.v221CitationMigrationSafe(raw,after,cfg),true,'The same existing native metadata can remain unchanged during an unrelated repair');
  eq(api.v221CitationMigrationSafe(raw,after.replace(value,value+' í'),cfg),false,'Changed unsafe metadata is not excused by the old unsafe character');matrixCases++;
 }
 for(const value of ['§ 1','§ 1-2']){
  const raw=make('Citar web','loc='+value);eq(api.v221CitationPlan(raw,cfg).text,raw,'An ignored unsafe locator is not activated');matrixCases++;
 }
 for(const ordinal of ['1ª','2º','3.ª','12.º']){
  const raw=make('Citar livro','edição='+ordinal+' ed.'),expected=raw.replace(ordinal+' ed.',ordinal),next=api.v221CitationPlan(raw,cfg);
  eq(next?.text,expected,'Only the certified ASCII edition suffix is removed');eq(api.v221CitationMigrationSafe(raw,expected,cfg),true,'The exact edition certificate survives the migration gate');matrixCases++;
 }
 for(const suffix of [' Suffix',' | Extra',' ASCII123']){
  if(suffix.includes('|'))continue;
  const raw='{{Citar web|url=https://example.invalid/a|título=Título |'+suffix+'}}',expected=raw.replace(' |',' {{!}}'),next=api.v220CitationCall(raw,cfg);
  eq(next?.text,expected,'An exact existing unsafe title can gain a certified ASCII literal-pipe suffix');eq(api.v221CitationMigrationSafe(raw,expected,cfg),true,'The exact literal-pipe certificate survives the migration gate');matrixCases++;
 }
 for(const suffix of [' científico',' &iacute;',' {{Modelo}}']){
  const raw='{{Citar web|url=https://example.invalid/a|título=Título |'+suffix+'}}';eq(api.v220CitationCall(raw,cfg),null,'A pipe repair cannot activate an unsafe or unproved suffix');matrixCases++;
 }
 for(const key of ['vauthors','vautores'])for(const value of ['Título','científico','Texto {{Modelo}}']){const before=make('Citar livro','campo-ignorado='+value),after=make('Citar livro',key+'='+value);eq(api.v221CitationMigrationSafe(before,after,cfg),false,'Free-text and Vancouver author inputs cannot newly activate unsafe metadata');matrixCases++;}
 for(const field of ['edição=1ª','local=Título','série=Título']){const raw=make('Citar web','obra=Revista|'+field),after=raw.replace('obra=Revista','obra=');eq(api.v221CitationMigrationSafe(raw,after,cfg),false,'A changed genre selector cannot newly activate an old unsafe book-only value');matrixCases++;}
 for(const key of ['contribuição','contribution']){const raw=make('Citar livro','autor=Example|contributor-last=Título|'+key+'='),after=raw.replace(key+'=',key+'=Introduction');eq(api.v221CitationMigrationSafe(raw,after,cfg),false,'A contributor selection change cannot activate an existing unsafe name');matrixCases++;}
 for(const key of ['authors','autores']){const raw=make('Citar livro','autor=Título|'+key+'=Example'),after=raw.replace(key+'=Example',key+'=');eq(api.v221CitationMigrationSafe(raw,after,cfg),false,'Removing free-text selection cannot activate an old unsafe indexed author');matrixCases++;}
 for(const title of ['Título {{Modelo}}','Título &iacute;','Título [[Example]]',"Título ''Example''"]){const raw='{{Citar web|url=https://example.invalid/a|título='+title+' | ASCII}}';eq(api.v220CitationCall(raw,cfg),null,'The finite pipe certificate does not infer an expanded old title');matrixCases++;}
 const bare='<ref>[https://example.invalid/a Obra]</ref>\n{{Referências}}';
 for(const [title,eligible] of [['Teste',true],['Teste referências',true],['Teste científico',false],['àrea',false],['ëxemplo',false],['ǌome',false],['Ética',true],['Teste {{Modelo}}',false],[undefined,false]]){
  const options={...cfg,pageTitle:title},plan=api.v219CitationLanguageBareReferencePlan(bare,options);
  eq(plan.edits.length>0,eligible,'A new wrapper requires a proved safe actual page-title context');matrixCases++;
 }
 const legacyFields=[['Colecção','coleção'],['Página','página'],['Local de publicação','local-publicação']];
 for(const [from,to]of legacyFields)for(const value of ['Título','§ 1','Café','Example']){
  const source='Texto.<ref>'+make('Citar livro',from+'='+value)+'</ref>\n{{Referências}}',eligible=['Café','Example'].includes(value),
   first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
  eq(first.text.includes('|'+(eligible?to:from)+'='+value),true,'Inherited key repair preserves unconsumed unsafe metadata and still fixes safe values');
  eq(api.v219AutomaticResultSafety(source,first).accepted,true,'Inherited key repair retains the final preservation gate');
  const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});calculations++;eq(second.text,first.text,'The inherited repair cannot reactivate on a later run');matrixCases++;
 }
 for(const quote of ['\"',"'"]){
  const raw=make('Citar livro','url='+quote+'https://example.invalid/científico'+quote).replace('|url=https://example.invalid/a',''),source='Texto.<ref>'+raw+'</ref>\n{{Referências}}',
   first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
  eq(first.text.includes('|url=https://example.invalid/científico'),true,'Exact ASCII quotes around an already native URL retain their proved repair');
  eq(api.v221CitationMigrationSafe(raw,raw.replace(quote+'https://example.invalid/científico'+quote,'https://example.invalid/científico'),cfg),true,'The exact URL quote certificate survives later migration');matrixCases++;
 }
 const fatal=make('Citar web','arquivourl=https://web.archive.org/web/20240101000000/https://example.invalid/a|arquivodata=2024-01-01|urlmorta=live|acessourl=subscrição');
 for(const [pageTitle,title,eligible]of [['Teste científico','Obra',false],['Teste','Obra',true],['Teste','Título',false]]){
  const raw=fatal.replace('|título=Obra','|título='+title),source='Texto.<ref>'+raw+'</ref>\n{{Referências}}',options={...cfg,pageTitle},first=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;
  eq(first.text.includes('|urlmorta='+(eligible?'não':'live')),true,'A failing original reader is treated as fresh metadata emission');
  eq(api.v219AutomaticResultSafety(source,first).accepted,true,'The repaired or preserved failing reader retains the final gate');
  const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});calculations++;eq(second.text,first.text,'A later writer cannot activate unsafe metadata from the failing source');matrixCases++;
 }
 for(const suffix of ['\u00a0','\u202f','\ufeff','\f']){
  const raw='{{Citar livro|título=Obra'+suffix+'|titulo=Obra|url=https://example.invalid/a}}';
  eq(api.v212CitationAliasCall(raw,cfg).text,raw,'Citation aliases use PHP native whitespace equality');
  const options={...cfg,references:false,automaticReferenceRepairs:false},source='Texto.<ref>'+raw+'</ref>\n{{Referências}}';
  eq(api.v212CitationAliasCall(raw,options).changes.length,0,'The full-action control excludes the v212 producer');
  const result=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;
  eq(result.text.includes('|titulo=Obra'),true,'Generic citation cleanup independently preserves the native unequal values');matrixCases++;
 }
 for(const raw of ['{{Citar livro|título=Título|titulo=Título}}','{{Citar livro|título=Título|título=Título}}']){
  const result=api.v212CitationAliasCall(raw,cfg);eq(result.changes.length,1,'Native-equivalent aliases and exact last-wins duplicate values remain eligible');matrixCases++;
 }
 for(const [raw,eligible]of [
  ['{{Citar livro|título=Obra|Publisher=Título}}',false],['{{Citar livro|título=Obra|Publisher=Café}}',true],
  ['{{Citar tese|título=Obra|Degree=Título}}',false],['{{Citar tese|título=Obra|Degree=Café}}',true],
  ['{{Citar mapa|título=Obra|Sheet=§ 1}}',false],['{{Citar mapa|título=Obra|Sheet=1}}',true],
  ['{{Citar livro|título=Obra|Colecção=Café|número=§ 1}}',false],['{{Citar livro|título=Obra|Colecção=Café|número=1}}',true]
 ]){
  const source='Texto.<ref>'+raw+'</ref>\n{{Referências}}',first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
  eq(first.text!==source,eligible,'A finite wrapper input activates only proved safe metadata');eq(api.v219AutomaticResultSafety(source,first).accepted,true,'Wrapper repairs retain the complete-action gate');
  if(!eligible)eq(first.changes.length,0,'A declined generic writer does not inflate the adjustment count');
  const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});calculations++;eq(second.text,first.text,'An inherited caller cannot bypass the guard on the next run');matrixCases++;
 }
 for(const badKey of ['título\u00a0','\u00a0título','título\u202f','título\ufeff']){
  const raw='{{Citar livro|'+badKey+'=Other|title=Example|url=https://example.invalid/a}}',source='Texto.<ref>'+raw+'</ref>\n{{Referências}}',
   first=api.calculate({kind:'adjust',source,originalSource:source,options:{...cfg,references:false,automaticReferenceRepairs:false}});calculations++;
  eq(first.text,source,'Unknown native argument boundaries cannot be normalized into a conflicting active alias');
  eq(first.changes.length,0,'A held extended writer contributes no adjustment callbacks');matrixCases++;
 }
 for(const raw of ['{{Citar livro|título=Obra|Publisher=Other|editora=Example}}','{{Citar livro|Titulo=Other|title=Example}}']){
  const source='Texto.<ref>'+raw+'</ref>\n{{Referências}}',first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
  eq(first.text,source,'Existing conflicting literal aliases remain unchanged');matrixCases++;
 }
 const complete=[
  ['{{Lien web|url=https://example.invalid/a|titre=Título}}',false],
  ['{{Literatur|Titel=Obra|Online=https://example.invalid/científico}}',false],
  ['{{Lien web|url=https://example.invalid/a|titre=Café}}',true],
  [make('Citar livro','edição=1ª ed.'),true],
  ['{{Citar web|url=https://example.invalid/a|título=Título | ASCII}}',true]
 ];
 for(const [raw,eligible] of complete){
  const source='Texto.<ref>'+raw+'</ref>\n{{Referências}}',first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
  eq(api.v219AutomaticResultSafety(source,first).accepted,true,'The complete action retains its final preservation gate');
  if(raw.startsWith('{{Lien web')&& !eligible)eq(first.text.includes('|titre=Título'),true,'No later writer consumes the held unsafe foreign title');
  if(raw.startsWith('{{Literatur')&&!eligible)eq(first.text.includes('|Online=https://example.invalid/científico'),true,'No later writer consumes the held unsafe foreign URI');
  if(raw.includes('1ª ed.'))eq(first.text.includes('1ª ed.'),false,'The certified edition repair remains automatic');
  if(raw.includes(' | ASCII'))eq(first.text.includes('{{!}} ASCII'),true,'The certified pipe repair remains automatic');
  const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});calculations++;eq(second.text,first.text,'A later action cannot reactivate a held metadata change');
 }
 return {status:'passed',checks,calculations,matrixCases,wikipediaWrites:0,networkRequests:0};
}
if(require.main===module){
 const selected=path.resolve(process.argv[2]||process.env.REVISAWIKI_RUNTIME_DIR||path.resolve(__dirname,'../../dist/2.21.0')),
  one=selected.endsWith('.js'),dir=one?path.dirname(selected):selected,reports=[];
 for(const kind of one?[selected.includes('_completo')?'full':'core']:['full','core']){
  const file=one?selected:path.join(dir,'RevisaWiki_v2_21_0'+(kind==='full'?'_completo':'')+'.js'),
   pin=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(kind==='core'){delete global.RevisaWikiDataV2;delete require.cache[require.resolve(path.join(dir,'RevisaWiki_v2_21_0_dados.js'))];}
  delete require.cache[require.resolve(file)];const api=require(file),result=run(api);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),pin,'Actual distribution remains unchanged');
  reports.push({distribution:kind,bundleSha256:pin,...result,unmodifiedDistributionRequired:true,productExportsAltered:false});
 }
 console.log(JSON.stringify(one?reports[0]:{status:'passed',reports}));
}
module.exports={run};
