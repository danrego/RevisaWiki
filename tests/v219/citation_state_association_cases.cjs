'use strict';
// Native URL state belongs to the complete citation, including metadata that
// can differ between calls sharing the same publication title and URL.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'native-citation-state-association',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),
 helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/preservation_equivalence.js'))),bundles:[],cases:[],checks:0,failures:[],
 helperInjection:false,networkRequests:0,wikipediaWrites:0};
const equal=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(x,message)=>{report.checks++;assert.ok(x,message);};
for(const file of files){const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);
 assert.equal(typeof api.v219CitationUrlStateObligations,'function','The real bundle must export the state obligation reader');
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false};
 function test(id,fn){try{fn();report.cases.push({bundle,id,status:'passed',evidenceKind:'guard-only-explicit-endpoint'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:error.message});report.cases.push({bundle,id,status:'failed'});}}
 const citation=(family,extra,state)=>'{{'+family+'|título=Publicação literal|url=https://example.invalid/fonte|arquivourl=https://example.invalid/arquivo|arquivodata=2020-01-02|'+extra+'|'+state+'}}';
 for(const family of ['Citar web','Citar livro','Citar jornal','Citar periódico','Citation'])
 for(const [label,first,second]of [['author','autor=Autoria A','autor=Autoria B'],['year','ano=2020','ano=2021'],
  ['quote','citação=Trecho literal A','citação=Trecho literal B'],['work','publicado=Editora A','publicado=Editora B']])
 for(const [key,a,b]of [['urlmorta','no','yes'],['url-status','live','dead']])test('same-anchor-distinct-'+family+'-'+label+'-'+key,()=>{
  const one=citation(family,first,key+'='+a),two=citation(family,second,key+'='+b),before=one+'\n'+two,
   after=citation(family,first,key+'='+b)+'\n'+citation(family,second,key+'='+a);
  ok(api.v219CitationUrlStateObligations(one,cfg).length>0,'The actual native state is included in its complete publication context');
  ok(api.v281CitationObligation(one,cfg)!==api.v281CitationObligation(citation(family,first,key+'='+b),cfg),
   'The scalar obligation keeps a state bound to the same complete citation');
  ok(api.preservationAudit(before,after,cfg).some(x=>x.code==='lost-citation-metadata'),
   'Swapped states between identical title/URL calls still fail when author/year/quote/work differs');
  ok(api.safeComposition(before,after,cfg)!=='','The actual global composition guard rejects that association swap');
 });
 const native=citation('Citar web','autor=Autoria literal|data=31/12/2020|acessodata=2025-1-14','urlmorta=no'),
  dated=native.replace('31/12/2020','31 de dezembro de 2020').replace('2025-1-14','2025-01-14');
 test('safe-finite-date-context',()=>{
  equal(api.v219CitationUrlStateObligations(native,cfg),api.v219CitationUrlStateObligations(dated,cfg),
   'The existing proved native date spelling does not detach the unchanged state');
  equal(api.preservationAudit(native,dated,cfg),[],'A valid finite date-only endpoint remains admitted by the full global audit');
  equal(api.safeComposition(native,dated,cfg),'','The finite date-only endpoint still composes');
 });
 for(const [key,value,padded]of [['arquivodata','2009-5-16','2009-05-16'],['acessodata','2025-1-14','2025-01-14'],['data','2020-2-29','2020-02-29'],
  ['arquivodata','24/04/2022','24 de abril de 2022']])
 test('unique-day-in-otherwise-unmatched-title-quote-'+key+'-'+value,()=>{
  const before='{{Citar web|título=Trecho com "aspas sem par|url=https://example.invalid/fonte|urlmorta=sim|'+key+'='+value+'}}',
   after=before.replace(key+'='+value,key+'='+padded);
  equal(api.v219CitationUrlStateObligations(before,cfg),api.v219CitationUrlStateObligations(after,cfg),
   'One exact native calendar day retains the complete same state context despite an unrelated title quote');
  equal(api.preservationAudit(before,after,cfg),[],'The installed audit accepts only this exact native date spelling');
  equal(api.safeComposition(before,after,cfg),'','The native date-only endpoint composes');
  for(const changed of [after.replace(padded,padded.slice(0,-2)+'15'),after.replace('Trecho com','Outro trecho com'),
   after.replace('/fonte','/outra'),after.replace('urlmorta=sim','urlmorta=não')])
   ok(api.preservationAudit(before,changed,cfg).some(x=>x.code==='lost-citation-metadata'),'A different day, title, URL or state is still rejected');
  ok(JSON.stringify(api.v219CitationUrlStateObligations(before,{...cfg,dates:false}))!==JSON.stringify(api.v219CitationUrlStateObligations(after,{...cfg,dates:false})),
   'A disabled date preference cannot authorize the context projection');
 });
 test('invalid-or-ambiguous-day-does-not-borrow-context-equivalence',()=>{
  for(const key of ['data','acessodata','arquivodata'])for(const value of ['31/02/2020','2020-02-30','29/02/1900','03/04/2020']){
   const before='{{Citar web|título=Publicação literal|url=https://example.invalid/fonte|urlmorta=sim|'+key+'='+value+'}}',
    after=before.replace(key+'='+value,key+'=2020-03-04');
   ok(api.preservationAudit(before,after,cfg).some(x=>x.code==='lost-citation-metadata'),
    'An impossible or ambiguous source date cannot acquire an invented calendar day');
   ok(api.safeComposition(before,after,cfg)!=='','The actual composition guard rejects a guessed or repaired calendar value');
  }
 });
 test('safe-local-forwarding-context',()=>{
  const before='{{Cite web|title=Publicação literal|author=Autoria literal|url=https://example.invalid/fonte|urlmorta=no}}',after=before.replace('Cite web','Citar web');
  equal(api.v219CitationUrlStateObligations(before,cfg),api.v219CitationUrlStateObligations(after,cfg),
   'A pinned local citation redirect forwards accepted native fields unchanged');
  equal(api.preservationAudit(before,after,cfg),[],'The proved native citation header remains equivalent');
 });
 test('safe-typed-identifier-context',()=>{
  const before=citation('Citar livro','autor=Autoria literal|isbn=ISBN 0-521-79540-0','urlmorta=no'),after=before.replace('isbn=ISBN ','isbn=');
  equal(api.v219CitationUrlStateObligations(before,cfg),api.v219CitationUrlStateObligations(after,cfg),
   'The validated identifier normalization preserves the complete same publication context');
  equal(api.preservationAudit(before,after,cfg),[],'The known identifier endpoint retains the unchanged native state');
 });
 test('state-value-and-role-mutations',()=>{
  const before=citation('Citar web','autor=Autoria literal','urlmorta=live');
  for(const changed of [before.replace('urlmorta=live','urlmorta=não'),before.replace('urlmorta=live','url-status=live'),
   before.replace('urlmorta=live','urlmorta=LIVE'),before.replace('|urlmorta=live','')]){
   ok(api.preservationAudit(before,changed,cfg).some(x=>x.code==='lost-citation-metadata'),'A changed native role/value cannot be inferred from boolean spelling');
   ok(api.safeComposition(before,changed,cfg)!=='','The global composition guard rejects role/value mutations');
  }
 });
 test('blank-and-unequal-duplicate-precedence',()=>{
  const before=citation('Citar web','autor=Autoria literal','urlmorta=no|deadurl='),changed=before.replace('|deadurl=','');
  ok(api.preservationAudit(before,changed,cfg).some(x=>x.code==='lost-citation-metadata'),'An explicit blank native state override remains an obligation');
  const conflicted=citation('Citar web','autor=Autoria A|author=Autoria B','urlmorta=no'),reordered=conflicted.replace('autor=Autoria A|author=Autoria B','author=Autoria B|autor=Autoria A');
  ok(api.v219CitationUrlStateObligations(conflicted,cfg).toString()!==api.v219CitationUrlStateObligations(reordered,cfg).toString(),
   'Unequal native role precedence remains distinct even in a sorted canonical context');
 });
 for(const [label,original,replacement]of [
  ['alias-value-swap','li=no|urlmorta=sim','urlmorta=no|li=sim'],
  ['alias-blank-swap','li=|urlmorta=sim','urlmorta=|li=sim'],
  ['repeated-key-last-value','urlmorta=no|urlmorta=sim|urlmorta=no','urlmorta=no|urlmorta=no|urlmorta=sim'],
  ['repeated-key-last-blank','urlmorta=|urlmorta=sim|urlmorta=','urlmorta=|urlmorta=|urlmorta=sim'],
  ['same-keys-distinct-values','li=no|urlmorta=sim','li=sim|urlmorta=no']
 ])test('state-key-precedence-'+label,()=>{
  const before=citation('Citar web','autor=Autoria literal',original),after=before.replace(original,replacement);
  ok(JSON.stringify(api.v219CitationUrlStateObligations(before,cfg))!==JSON.stringify(api.v219CitationUrlStateObligations(after,cfg)),
   'Distinct native state values retain their original key and repeated-key order');
  ok(api.preservationAudit(before,after,cfg).some(x=>x.code==='lost-citation-metadata'),
   'The actual global metadata audit rejects native alias precedence changes');
  ok(api.safeComposition(before,after,cfg)!=='','The actual composition guard rejects native alias precedence changes');
 });
 test('identical-state-alias-deduplication',()=>{
  const one=citation('Citar web','autor=Autoria literal','li=no'),
   duplicate=citation('Citar web','autor=Autoria literal','li=no|urlmorta=no|li=no');
  equal(api.v219CitationUrlStateObligations(one,cfg),api.v219CitationUrlStateObligations(duplicate,cfg),
   'Identical values in one native role can still consolidate without losing precedence');
 });
 equal(sha(fs.readFileSync(file)),sha(bytes),'The actual runtime snapshot remains immutable');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
