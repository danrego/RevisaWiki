'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs'),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const files=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)];
const contracts=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/citation_native_contract.json'))),urls=JSON.parse(fs.readFileSync(path.join(__dirname,'../../src/v2_11_1/VERIFIED_CITATION_URLS.json')));
const report={version:'2.11.1',kind:'native-citation-publication-and-verified-url-fields',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,message){report.checks++;assert.deepEqual(a,b,message);}
function test(bundle,name,run){try{run();report.cases.push({bundle,name,status:'passed'});}catch(e){report.status='failed';report.failures.push({bundle,name,error:candidate?candidate.sanitized(e.stack):String(e.stack).replaceAll(process.cwd(),'<local-path>')});}}
const article=raw=>'Texto.<ref>'+raw+'</ref>\n\n{{Referências}}\n';
for(const file of files){
 const api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',autoPreview:false,authorityControl:false,automaticTopicPortals:false,portals:false,dates:false,spelling:false,minorBaseConfirmed:true};
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file)),version:api.version});
 const source=(key='blog',value='Publicação de controle')=>'{{Citar jornal|titulo=Fonte de controle|'+key+'='+value+'|url=https://example.test/fonte|data=2020|acessodata=2020-01-02}}';
 const stable=(before,after,options=cfg,pipelineExpected=after)=>{
  eq(api.v2111CitationFieldPlan(before,options).text,after,'The finite plan reproduces the expected exact-source change');
  const result=api.calculate({kind:'adjust',source:before,options});eq(result.text,pipelineExpected,'The complete engine preserves values alongside pre-existing finite name equivalences');eq(result.preservation,[],'The complete preservation audit accepts the finite equivalence');
  eq(api.safeComposition(before,pipelineExpected,options),'','The original reference identity and content compose safely');eq(api.calculate({kind:'adjust',source:pipelineExpected,options}).text,pipelineExpected,'A second click is unchanged');
  eq(api.v211RetainedAdjustments(before,after).count,1,'The new changed field alone is one retained adjustment');eq(result.minorCheck.eligible,true,'A source-confirmed equivalent metadata correction qualifies as mechanical');
  return result;
 };
 for(const name of ['Citar web','citar web','Citar jornal','citar jornal','Predefinição:Citar web','Predefinição:Citar jornal','Template:Citar web','Template:Citar jornal','Citar_web','Citar_jornal'])for(const key of ['blog',' blog ','\nblog '])test(bundle,'one accepted native publication field '+JSON.stringify([name,key]),()=>{
  const before=article(source().replace('Citar jornal',name).replace('|blog=','|'+key+'=')).replace(/(?<=\|data=)2020(?=\|)/,'2020'),after=before.replace(/(?<=\|)(\s*)blog(\s*)=/,'$1obra$2=');
  eq(api.v2111CitationFieldCall(before.match(/\{\{[\s\S]*?\}\}/)[0],cfg).changes.map(v=>v.ruleId),['v2111BlogPublication'],'The declared native source class remains unchanged');
  const legacyAlias=/[:_]/.test(name),pipelineExpected=legacyAlias?after.replace('{{'+name+'|','{{'+(/jornal$/.test(name)?'Citar jornal':'Citar web')+'|').replace('|titulo=','|título='):after;
  const result=stable(before,after,cfg,pipelineExpected);eq(result.changes.find(v=>v.id==='v2111BlogPublication')?.count,1,'The production summary records the actual rule once');
 });
 for(const alias of contracts.publicationAliases)for(const value of ['', ' ', 'Outra publicação','Publicação de controle'])test(bundle,'every competing Periodical alias blocks the new migration '+JSON.stringify([alias,value]),()=>{
  const raw=source().replace('}}','|'+alias+'='+value+'}}'),before=article(raw);eq(api.v2111CitationFieldPlan(before,cfg).text,before,'Even empty and equal publication aliases block this new field migration');eq(api.v2111CitationFieldCall(raw,cfg).text,raw,'No alias is overwritten or selected');
 });
 for(const raw of [source().replace('}}','|blog=Outra publicação}}'),source().replace('}}','|blog=Publicação de controle}}'),source().replace('}}','|blog=}}'),source('blog',''),source('blog','  '),source('blog','{{Publicação}}'),source('blog','{{{publicação|Blog}}}'),source().replace('|data=2020','|Fragmento sem nome'),source().replace('|data=2020','|{{Nome}}=2020'),source().replace('|data=2020','|data=2020<ref>Outra fonte</ref>')])test(bundle,'ambiguous or dynamic citation is retained '+sha(raw).slice(0,12),()=>{
  const before=article(raw);eq(api.v2111CitationFieldPlan(before,cfg).text,before,'An ambiguous duplicate, expansion, nameless field or nested markup cannot authorize the new rule');eq(api.v2111CitationFieldCall(raw,cfg).text,raw,'The citation body remains byte-exact under the standalone rule');
 });
 for(const name of ['Cite web','Cite news','Citation','Citar livro','Citar revista','Citar blog','Modelo','CITAR WEB','citar Jornal','Citar Web'])test(bundle,'unreviewed source family is not reclassified '+name,()=>{
  const before=article(source().replace('Citar jornal',name));eq(api.v2111CitationFieldPlan(before,cfg).text,before,'Only exact recognized native families receive this new field equivalence');
 });
 for(const [name,wrap]of [['comment',s=>'<!-- '+s+' -->'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['code',s=>'<code>'+s+'</code>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['math',s=>'<math>'+s+'</math>'],['markdown',s=>'```wikitext\n'+s+'\n```'],['unknown template',s=>'{{Exemplo|'+s+'}}'],['includeonly',s=>'<includeonly>'+s+'</includeonly>'],['noinclude',s=>'<noinclude>'+s+'</noinclude>']])test(bundle,'protected or expanding context '+name,()=>{
  const before=wrap(source());eq(api.v2111CitationFieldPlan(before,cfg).text,before,'A literal example or unknown enclosing template does not receive an active citation repair');
 });
 for(const options of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:828},{namespaceNumber:undefined},{discussionPage:true},{sectionOnly:true},{section:0},{section:'0'},{section:1},{contentModel:'javascript'},{model:'json'},{pageRedirect:true},{pageDisambiguation:true},{citations:false},{citationRepairs:false},{syntaxRepairs:false},{structuralRepairs:false},{markup:false}])test(bundle,'new-rule scope guard '+JSON.stringify(options),()=>{
  const before=article(source()),settings={...cfg,...options};eq(api.v2111CitationFieldPlan(before,settings).text,before,'A disabled, partial, nonarticle or nonwikitext context cannot authorize the new migration');
 });
 test(bundle,'plan and preservation reject unrelated mutations',()=>{
  const before=article(source()),plan=api.v2111CitationFieldPlan(before,cfg);eq(api.v2111CitationFieldProof(before,plan.text,plan,cfg),true,'The exact plan is independently regenerated');eq(api.v2111CitationFieldProof(before+'x',plan.text,plan,cfg),false,'A stale source cannot borrow an earlier proof');eq(api.v2111CitationFieldProof(before,plan.text,{...plan,edits:[]},cfg),false,'An altered edit list cannot borrow proof');
  for(const changed of [plan.text.replace('obra=Publicação','obra=Outra publicação'),plan.text.replace('Citar jornal','Citar web'),plan.text.replace('|data=2020',''),plan.text.replace('titulo=Fonte','titulo=Outra fonte')]){
   eq(Boolean(api.safeComposition(before,changed,cfg)),true,'Changed values, family, date or title cannot borrow the safe field equivalence');eq(api.preservationAudit(before,changed,cfg).some(f=>/^lost-/.test(f.code)),true,'The independent preservation path detects the mutation');eq(api.minorEligibility(before,changed,cfg).eligible,false,'An unsupported citation mutation is not a minor edit');
  }
 });
 const record=urls.records[0],urlCfg={...cfg,pageTitle:urls.article};
 test(bundle,'verified trailing period uses exact citation proof',()=>{
  eq(sha(record.beforeCall),record.beforeCallSha256,'The complete original call is pinned');eq(sha(record.afterCall),record.afterCallSha256,'The complete repaired call is pinned');eq(record.afterCall,record.beforeCall.replace(record.oldUrl,record.newUrl),'The manifest changes only the proved address');
  eq(record.proof.originalStatus,404,'The exact original failed anonymously');eq(record.proof.replacementStatus,200,'The replacement succeeded anonymously');eq(record.proof.canonicalURL,record.newUrl,'The replacement is its exact canonical URL');eq(record.proof.uniquePostHeadline,record.citationTitle,'The unique post headline agrees with the existing citation title');
  const result=stable(article(record.beforeCall),article(record.afterCall),urlCfg);eq(result.text.includes('|formato=PDF '),true,'Existing format metadata remains byte-exact');eq(result.changes.find(v=>v.id==='v2111VerifiedCitationURL')?.count,1,'The exact URL rule appears once in the production summary');
 });
 const otherURLs=['https://example.test/asset.html.','https://example.test/file.','https://example.test/?q=sentence.','https://example.test/file.html.?signature=abc.','https://example.test/file.html.#part','https://example.test/file.html..','https://example.test/file%2E','https://example.test/?url='+record.oldUrl,record.oldUrl+'?m=1',record.oldUrl+'#anchor',record.oldUrl.replace('https:','http:'),record.oldUrl.replace('almaacreana','outroblog'),record.oldUrl.replace('.html.','.html')];
 for(const url of otherURLs)test(bundle,'legitimate or unproved punctuation is never stripped '+sha(url).slice(0,12),()=>{
  const before=article(record.beforeCall.replace(record.oldUrl,url));eq(api.v2111CitationFieldPlan(before,urlCfg).text,before,'No general punctuation heuristic rewrites an unverified URL');
 });
 for(const raw of [record.beforeCall.replace('titulo=UM','titulo=Outra fonte UM'),record.beforeCall.replace('|data=2011','|data=2012'),record.beforeCall.replace('publicado=Alma Acreana','publicado=Outra publicação'),record.beforeCall.replace('|formato=PDF ',''),record.beforeCall.replace('citar web ','Citar web '),record.beforeCall.replace('}}','|url='+record.oldUrl+'}}'),record.beforeCall.replace('|titulo=','|titulo=Outro título|titulo=')])test(bundle,'changed metadata cannot reuse exact URL evidence '+sha(raw).slice(0,12),()=>eq(api.v2111CitationFieldPlan(article(raw),urlCfg).text,article(raw),'Only the complete demonstrated citation identity receives the URL repair'));
 for(const title of ['Outro artigo','Lista de aeroclubes do Brasil/Arquivo','Discussão:Lista de aeroclubes do Brasil',''])test(bundle,'other article title cannot reuse URL evidence '+title,()=>eq(api.v2111CitationFieldPlan(article(record.beforeCall),{...urlCfg,pageTitle:title}).text,article(record.beforeCall),'A known destination does not authorize changing another article or draft identity'));
 for(const options of [{sectionOnly:true},{section:'1'},{namespaceNumber:1},{citations:false},{citationRepairs:false},{syntaxRepairs:false},{markup:false}])test(bundle,'URL evidence respects partial and opt-out contexts '+JSON.stringify(options),()=>eq(api.v2111CitationFieldPlan(article(record.beforeCall),{...urlCfg,...options}).text,article(record.beforeCall),'The exact old URL remains when context proof is absent'));
 test(bundle,'URL repair does not invent a missing title or alter metadata',()=>{
  const raw='{{Citar jornal|url=https://www.exabitscenery.com.br/cenario/aeroclube-da-bahia-airport|jornal=Jornal de controle|autor=Autoria de controle|data=2020}}',before=article(raw);eq(api.v2111CitationFieldPlan(before,cfg).text,before,'Contradictory untitled source metadata remains for editorial review');const result=api.calculate({kind:'adjust',source:before,options:cfg});eq(result.text,before,'The complete engine never scrapes or invents a title for this source');
 });
 test(bundle,'two independent citation fields count twice',()=>{
  const before=article(source())+'\n'+article(record.beforeCall),expected=before.replace('|blog=','|obra=').replace(record.oldUrl,record.newUrl),result=api.calculate({kind:'adjust',source:before,options:{...urlCfg,referenceColumns:false}});eq(result.text,expected.replace(/\n\n\{\{Referências\}\}\n\nTexto\./,'\n\n{{Referências}}\n\nTexto.'),'Both source-bound fields survive the complete pipeline');eq(api.v211RetainedAdjustments(before,result.text).count,2,'Each retained field correction is counted separately');
 });
}
const directory=candidate?candidate.artifactDirectory():path.resolve(process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2111');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'citation_fields.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.failures.length)process.exitCode=1;
