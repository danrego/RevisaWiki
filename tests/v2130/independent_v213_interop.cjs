'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const baseline=require('../../dist/2.12.0/RevisaWiki_v2_12_0.js'),candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs');
const uiCases=require('./independent_v213_interop_cases.cjs');
const files=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)];
// Expected model and field endpoints are written independently of the new repair
// plan. The pinned older release verifies each already supported clean migration.
const profiles=[
 {id:'english-web',model:'cite web',target:'Citar web',title:'title',author:'author'},
 {id:'english-book',model:'cite book',target:'Citar livro',title:'title',author:'author',book:true},
 {id:'english-journal',model:'cite journal',target:'Citar periódico',title:'title',author:'author'},
 {id:'english-news',model:'cite news',target:'Citar jornal',title:'title',author:'author'},
 {id:'english-magazine',model:'cite magazine',target:'Citar revista',title:'title',author:'author'},
 {id:'french-web',model:'Lien web',target:'Citar web',title:'titre',author:'auteur'},
 {id:'french-book',model:'Ouvrage',target:'Citar livro',title:'titre',author:'auteur',book:true},
 {id:'spanish-web',model:'Cita web',target:'Citar web',title:'título',author:'autor'},
 {id:'spanish-book',model:'Cita libro',target:'Citar livro',title:'título',author:'autor',book:true},
 {id:'spanish-journal',model:'Cita publicación',target:'Citar periódico',title:'título',author:'autor'},
 {id:'german-web',model:'Internetquelle',target:'Citar web',title:'titel',author:'autor'},
 {id:'german-book',model:'Literatur',target:'Citar livro',title:'Titel',author:'Autor',book:true},
 ...['Citar web','Citar livro','Citar periódico','Citar revista','Citar jornal','citar web'].map((model,index)=>({id:'native-accepted-aliases-'+index,model,target:model,title:'title',author:'author',native:true,book:model==='Citar livro'}))
];
const remap={
 'archive-url':'arquivourl','archive-date':'arquivodata','arquivo-url':'arquivourl','arquivo-data':'arquivodata',
 'chapter-url':'capítulourl','access-date':'acessodata',date:'data',year:'ano'
};
function article(profile,fields,canonical=false){
 const model=canonical?profile.target:profile.model;
 const base=[[canonical&&!profile.native?'título':profile.title,'Fonte literal'],[canonical&&!profile.native?'autor':profile.author,'Autor literal']];
 return 'Texto.<ref>{{'+model+'|'+[...base,...fields.map(([key,value])=>[canonical&&!profile.native?(remap[key]||key):key,value])].map(([key,value])=>key+'='+value).join('|')+'}}</ref>\n{{Referências}}';
}
const cleanURL=['url','https://example.test/fonte'];
const credentialURL=['https://','name',':','secret','@','example.test','/fonte'].join('');
const operations=[
 {id:'quoted-url',feature:5,before:[['url','"https://example.test/fonte"']],after:[cleanURL],changes:1},
 {id:'quoted-url-apostrophe',feature:5,before:[['url',"'https://example.test/fonte'"]],after:[cleanURL],changes:1},
 {id:'pmid-official-link',feature:6,before:[cleanURL,['pmid','[https://pubmed.ncbi.nlm.nih.gov/12345678/]']],after:[cleanURL,['pmid','12345678']],changes:1},
 {id:'pmc-official-link',feature:6,before:[cleanURL,['pmc','[https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/]']],after:[cleanURL,['pmc','1234567']],changes:1},
 {id:'arxiv-official-link-version',feature:6,before:[cleanURL,['arxiv','[https://arxiv.org/abs/2401.01234v2]']],after:[cleanURL,['arxiv','2401.01234v2']],changes:1},
 {id:'doi-official-link',feature:6,before:[cleanURL,['doi','[https://doi.org/10.1000/182]']],after:[cleanURL,['doi','10.1000/182']],changes:1},
 {id:'nested-valid-isbn',feature:9,before:[cleanURL,['isbn','{{ISBN|978-0-306-40615-7}}']],after:[cleanURL,['isbn','978-0-306-40615-7']],changes:1},
 {id:'typed-url-extra-equals',feature:10,before:[['url','=https://example.test/fonte']],after:[cleanURL],changes:1},
 {id:'typed-date-extra-equals',feature:10,before:[cleanURL,['date','=2020-01-02']],after:[cleanURL,['date','2020-01-02']],changes:1},
 {id:'typed-access-extra-equals',feature:10,before:[cleanURL,['access-date','=2020-01-02']],after:[cleanURL,['access-date','2020-01-02']],changes:1},
 {id:'typed-doi-extra-equals',feature:10,before:[cleanURL,['doi','=10.1000/182']],after:[cleanURL,['doi','10.1000/182']],changes:1},
 {id:'typed-year-extra-equals',feature:10,before:[cleanURL,['year','=2020']],after:[cleanURL,['year','2020']],changes:1},
 {id:'triple-prefix-url',feature:14,before:[['url','https://https://https://example.test/fonte']],after:[cleanURL],changes:1},
 {id:'triple-prefix-archive',feature:14,before:[cleanURL,['archive-url','https://https://https://example.test/arquivo'],['archive-date','2020-01-02']],after:[cleanURL,['archive-url','https://example.test/arquivo'],['archive-date','2020-01-02']],changes:1},
 {id:'triple-prefix-native-archive-alias',feature:14,before:[cleanURL,['arquivo-url','https://https://https://example.test/arquivo'],['arquivo-data','2020-01-02']],after:[cleanURL,['arquivo-url','https://example.test/arquivo'],['arquivo-data','2020-01-02']],changes:1},
 {id:'book-chapter-quoted-url',feature:5,book:true,before:[cleanURL,['chapter-url','"https://example.test/capitulo"']],after:[cleanURL,['chapter-url','https://example.test/capitulo']],changes:1},
 {id:'combined-field-families',feature:'composition',before:[['url','"https://example.test/fonte"'],['arxiv','[https://arxiv.org/abs/2401.01234v2]'],['isbn','{{ISBN|978-0-306-40615-7}}'],['doi','=10.1000/182'],['arquivo-url','https://https://https://example.test/arquivo'],['arquivo-data','2020-01-02']],after:[cleanURL,['arxiv','2401.01234v2'],['isbn','978-0-306-40615-7'],['doi','10.1000/182'],['arquivo-url','https://example.test/arquivo'],['arquivo-data','2020-01-02']],changes:5}
];
const negatives=[
 {id:'quoted-credentials',fields:[['url','"'+credentialURL+'"']]},
 {id:'quoted-labelled-url',fields:[['url','"https://example.test/fonte Fonte literal"']]},
 {id:'mixed-protocols',stricterProtocolGuard:true,fields:[['url','http://https://example.test/fonte']]},
 {id:'five-prefixes',stricterProtocolGuard:true,fields:[['url','https://https://https://https://https://example.test/fonte']]},
 {id:'identifier-other-domain',fields:[cleanURL,['pmid','[https://example.test/12345678/]']]},
 {id:'identifier-labelled-link',fields:[cleanURL,['doi','[https://doi.org/10.1000/182 Fonte literal]']]},
 {id:'invalid-isbn-checksum',fields:[cleanURL,['isbn','{{ISBN|978-0-306-40615-8}}']]},
 {id:'two-isbn-values',fields:[cleanURL,['isbn','{{ISBN|978-0-306-40615-7|0-306-40615-2}}']]},
 {id:'invalid-date-extra-equals',fields:[cleanURL,['date','=2020-02-31']]},
 {id:'double-extra-equals',fields:[['url','==https://example.test/fonte']]},
 {id:'conflicting-duplicate-url',fields:[['url','"https://example.test/fonte"'],['url','https://example.test/outra']]},
 {id:'conflicting-identifier-aliases',fields:[cleanURL,['doi','[https://doi.org/10.1000/182]'],['DOI','10.1000/183']]},
 {id:'conflicting-isbn-aliases',fields:[cleanURL,['isbn','{{ISBN|978-0-306-40615-7}}'],['ISBN','0-306-40615-2']]},
 {id:'comment-inside-quoted-url',fields:[['url','"https://example.test/fonte<!--nota-->"']]},
 {id:'unknown-dynamic-field',fields:[['url','"https://example.test/fonte"'],['campo','{{Valor dinâmico}}']]}
];
const report={version:'2.13.0',kind:'independent-reference-migration-interoperability',runnerSha256:sha(fs.readFileSync(__filename)),uiOracleSha256:sha(fs.readFileSync(path.join(__dirname,'independent_v213_interop_cases.cjs'))),releaseManifestSha256:candidate?sha(fs.readFileSync(path.join(root,'tests/expected_release_v2130.json'))):null,baselineSha256:sha(fs.readFileSync(path.join(root,'dist/2.12.0/RevisaWiki_v2_12_0.js'))),bundles:[],cases:[],checks:0,failures:[],baselineLimitations:[],wikipediaWrites:0,networkRequests:0,scope:'Handwritten native and established English, French, Spanish and German citation migrations. Clean controls are compared against the pinned prior release. New field fixes must finish with migration in one action, with unchanged metadata and exact source proof.'};
const eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);};
function test(bundle,id,run){try{run();report.cases.push({bundle,id,status:'passed'});}catch(error){report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<local-path>')});}}
function options(api){return {...api.defaults,namespaceNumber:0,pageTitle:'Exemplo técnico',authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,autoPreview:false,registryDoiCheck:false,minorBaseConfirmed:true,unifiedNotesReferences:false,referenceColumns:false,tableAccessibility:false,endTemplateOrder:false,endSectionOrder:false,headings:false,automaticIdenticalReferences:false,moveNamedRefs:false};}
const baseOptions=options(baseline),baseCalculate=source=>baseline.calculate({kind:'adjust',source,options:baseOptions});
for(const file of files){
 const api=require(file),bundle=path.basename(file),cfg=options(api),calculate=source=>api.calculate({kind:'adjust',source,options:cfg});
 report.bundles.push({file:bundle,version:api.version,sha256:sha(fs.readFileSync(file))});
 for(const item of [...uiCases.cases,...uiCases.nativeControls])test(bundle,'handwritten UI endpoint '+item.id,()=>{
  if(item.legacyClean)eq(baseCalculate(item.legacyClean).text,item.expected,'The extra foreign-language key mappings are verified against the pinned clean prior release');
  const actual=calculate(item.source);eq(actual.text,item.expected,'The independent UI source reaches its exact handwritten endpoint');eq(actual.preservation,[],'The UI flow retains citation metadata');eq(calculate(item.expected).text,item.expected,'The UI source finishes in one action');const count=api.v211RetainedAdjustments(item.source,item.expected);eq(count.exact,true,'Every UI count is supported by retained syntax');eq(count.count,item.count,'The UI count matches the manual model, field and value operation count');
 });
 for(const profile of profiles)for(const operation of operations.filter(item=>!item.book||profile.book)){
  const clean=article(profile,operation.after),source=article(profile,operation.before),expected=article(profile,operation.after,true),id=profile.id+' '+operation.id;
  test(bundle,id+' prior clean migration contract',()=>{const prior=baseCalculate(clean);eq(prior.text,expected,'The handwritten model, metadata and accepted field spellings match the already supported migration');eq(prior.preservation,[],'The clean pre-existing migration has no preservation failure');});
  test(bundle,id+' one complete action',()=>{const actual=calculate(source);eq(actual.text,expected,'The new literal repair and established foreign migration finish in the same first action');eq(actual.preservation,[],'Title, author, URL, identifiers and every untouched field keep a complete source proof');eq(calculate(expected).text,expected,'A second action has no delayed field repair');eq(api.safeComposition(source,expected,cfg),'','The complete migrated endpoint has source-bound composition proof');eq(api.v211MinorMechanicalPlan(source,cfg).text,expected,'Minor proof replays the same combined migration and repair');
   const count=api.v211RetainedAdjustments(source,expected),legacyCount=baseline.v211RetainedAdjustments(clean,expected);eq(legacyCount.exact,true,'The existing migration has an independently retained syntax count');eq(count.exact,true,'Every new retained field correction has an exact occurrence');eq(count.count,legacyCount.count+operation.changes,'Legacy model/key changes and each new field repair are counted separately');
   for(const [before,after]of [['Autor literal','Autor inventado'],['Fonte literal','Fonte inventada'],['example.test/fonte','example.test/inventada'],['2401.01234v2','2401.01234v3'],['978-0-306-40615-7','978-0-306-40615-8'],['10.1000/182','10.1000/183']]){
    if(!expected.includes(before))continue;const changed=expected.replace(before,after);eq(api.preservationAudit(source,changed,cfg).length>0,true,'A valid migrated repair cannot authorize unrelated metadata, URL or identifier replacement');eq(Boolean(api.safeComposition(source,changed,cfg)),true,'The combined citation migration proof rejects unrelated content replacement');
   }
  });
 }
 for(const profile of profiles)for(const item of negatives)test(bundle,profile.id+' decline '+item.id,()=>{
  const source=article(profile,item.fields),prior=baseCalculate(source),current=calculate(source);
  if(item.stricterProtocolGuard){const expected=article(profile,item.fields,true);eq(current.text,expected,'The bounded protocol guard preserves mixed or excessive prefixes while retaining supported model migration');eq(current.preservation,[],'A declined malformed protocol still retains its exact source inventory through migration');eq(calculate(expected).text,expected,'An inadmissible protocol chain stays unchanged on the second action');report.baselineLimitations.push({bundle,id:profile.id+' '+item.id,priorChangedLiteral:prior.text!==expected,reason:'The new bounded rule deliberately declines mixed schemes and chains longer than four prefixes, including the older permissive fallback.'});}
  else{eq(current.text,prior.text,'An inadmissible field repair cannot introduce a change beyond the pinned previous migration');eq(current.preservation,prior.preservation,'A declined new field repair does not add a preservation failure');eq(calculate(current.text).text,baseCalculate(prior.text).text,'The new rule cannot add a delayed repair for inadmissible input');}
 });
 for(const profile of profiles)for(const item of operations.filter(item=>!item.book||profile.book))test(bundle,profile.id+' protected '+item.id,()=>{
  const source='<nowiki>'+article(profile,item.before)+'</nowiki>';eq(calculate(source).text,baseCalculate(source).text,'New migrated field repairs leave protected examples byte-for-byte unchanged');
 });
 for(const profile of profiles)for(const item of operations.filter(item=>['quoted-url','pmid-official-link','nested-valid-isbn','typed-doi-extra-equals'].includes(item.id)))for(const disabled of [{citations:false},{citationRepairs:false},{syntaxRepairs:false},{structuralRepairs:false},{namespaceNumber:1},{sectionOnly:true}])test(bundle,profile.id+' disabled '+item.id+' '+JSON.stringify(disabled),()=>{
  const source=article(profile,item.before),prior=baseline.calculate({kind:'adjust',source,options:{...baseOptions,...disabled}}),actual=api.calculate({kind:'adjust',source,options:{...cfg,...disabled}});eq(actual.text,prior.text,'Migration-aware inventories cannot enable a new field repair outside its original scope or settings');eq(actual.preservation,prior.preservation,'An opt-out keeps the pre-existing source-preservation behavior');
 });
}
if(candidate)test('release','final pinned files unchanged',()=>{candidate.verify();eq(sha(fs.readFileSync(path.join(root,'tests/expected_release_v2130.json'))),report.releaseManifestSha256,'Every interop endpoint remains bound to the same complete release manifest');});
report.failed=report.failures.length;report.status=report.failed?'failed':'passed';const output=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2130'));fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'independent_v213_interop.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.failures.slice(0,30)}));if(report.failed)process.exitCode=1;

