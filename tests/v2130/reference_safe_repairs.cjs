'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs'),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const files=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)],oracles=require('./independent_v213_cases.cjs');
const report={version:'2.13.0',kind:'finite-reference-fields-identities-and-closers',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function test(bundle,name,run){try{run();report.cases.push({bundle,name,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,name,error:String(error.stack).replaceAll(process.cwd(),'<local-path>').replaceAll(path.dirname(fileName||''),'<candidate-directory>')});}}
let fileName='';
for(const file of files){
 fileName=file;const api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',autoPreview:false,authorityControl:false,portals:false,automaticTopicPortals:false,dates:false,spelling:false,referenceColumns:false,tableAccessibility:false,unifiedNotesReferences:false,automaticIdenticalReferences:false,minorBaseConfirmed:true};
 report.bundles.push({file:bundle,version:api.version,sha256:sha(fs.readFileSync(file))});
 const wrap=(fields,model='Citar web')=>'Texto.<ref>{{'+model+'|titulo=Fonte literal|'+fields+'}}</ref>\n{{Referências}}\n';
 const prove=(before,expected,count=1,minorExpected=true)=>{
  const result=api.calculate({kind:'adjust',source:before,options:cfg});eq(result.text,expected,'The complete engine matches the independently written endpoint');eq(result.preservation,[],'Every source-preservation check passes');eq(api.safeComposition(before,expected,cfg),'','The exact endpoint composes safely');eq(api.preservationAudit(before,expected,cfg),[],'Independent preservation endpoint agrees');eq(api.calculate({kind:'adjust',source:expected,options:cfg}).text,expected,'A second action does not postpone another finite repair');eq(result.minorCheck.eligible,minorExpected,'Only a saved-source mechanical proof confirms the minor state');
  const ledger=api.v211RetainedAdjustments(before,expected);eq(ledger.exact,true,'The retained adjustment count is exact');eq(ledger.count,count,'Every finite field or native tag correction counts once');
 };
 for(const fixture of oracles.items.filter(item=>[5,6,7,8,9,10,11,14].includes(item.feature)))test(bundle,'independent endpoint '+fixture.id,()=>{
  const field=api.v213ReferenceFieldPlan(fixture.source,cfg),syntax=api.v213ReferenceSyntaxPlan(fixture.source,cfg);
  eq(api.v213ReferenceFieldProof(fixture.source,field.text,field,cfg),true,'Field proof regenerates from exact source');eq(api.v213ReferenceSyntaxProof(fixture.source,syntax.text,syntax,cfg),true,'Tag proof regenerates from exact source');
  if(fixture.positive)prove(fixture.source,fixture.expected,fixture.count||1);
  else{eq(field.text,fixture.source,'Ambiguous field syntax is unchanged');eq(syntax.text,fixture.source,'Ambiguous native identities and closers are unchanged');}
 });
 const urlFields=['url','URL','arquivourl','arquivo-url','urlarquivo','archive-url','archiveurl'];
 for(const model of ['Citar web','Citar jornal','Citar revista','Citar livro','Citar periódico'])for(const key of urlFields)for(const quote of ['"',"'"])test(bundle,'literal quoted URL '+JSON.stringify([model,key,quote]),()=>{
  const extra=key==='url'||key==='URL'?'':'url=https://example.test/original|arquivo-data=2020-01-02|',value='https://example.test/fonte?q=1&x=2#parte',source=wrap(extra+key+'='+quote+value+quote,model);prove(source,source.replace(key+'='+quote+value+quote,key+'='+value));
 });
 for(const model of ['Citar web','Citar jornal','Citar revista','Citar livro','Citar periódico'])for(const protocol of ['http','https'])for(const copies of [2,3,4])test(bundle,'bounded same-scheme protocol '+JSON.stringify([model,protocol,copies]),()=>{
  const source=wrap('url='+(protocol+'://').repeat(copies)+'example.test/fonte?a=1&b=2#parte',model),expected=wrap('url='+protocol+'://example.test/fonte?a=1&b=2#parte',model);prove(source,expected);
 });
 for(const value of ['https://http://example.test/fonte','https://'.repeat(5)+'example.test/fonte','https://https://'+'user'+':'+'pass'+'@'+'example.test/fonte','https://example.test/path/https://https://literal','https://example.test/?q=https://https://literal'])test(bundle,'protocol refusal '+sha(value).slice(0,8),()=>{
  const source=wrap('url='+value);eq(api.v213ReferenceFieldPlan(source,cfg).text,source,'Mixed, over-limit, authenticated and inner URL strings remain unchanged');eq(api.calculate({kind:'adjust',source,options:cfg}).text,source,'The old fallback cannot bypass the bounded protocol contract');
 });
 for(const [field,value]of [['acessodata','2020-02-29'],['arquivo-data','2020-01-02'],['data','2020-12-31'],['ano','2020'],['doi','10.1000/182'],['pmid','12345678'],['pmc','1234567'],['isbn','978-0-306-40615-7'],['arxiv','2401.01234v2']])test(bundle,'typed assignment '+field,()=>{const source=wrap('url=https://example.test/fonte|'+field+'=='+value);prove(source,source.replace(field+'==',field+'='));});
 for(const id of ['9780306406157','978-0-306-40615-7','978 0 306 40615 7','0306406152','0-306-40615-2','080442957X'])test(bundle,'checksum-valid literal ISBN '+id,()=>{eq(api.v213ISBN(id),true,'The identifier checksum is valid');const source=wrap('isbn={{ISBN|'+id+'}}','Citar livro');prove(source,source.replace('{{ISBN|'+id+'}}',id));});
 for(const id of ['9780306406158','0306406153','978030640615X','1234567890','','97803064061570'])test(bundle,'invalid ISBN checksum '+id,()=>eq(api.v213ISBN(id),false,'An invalid length, prefix or check digit never authorizes extraction'));
 for(const [kind,wrapLiteral]of [['comment',s=>'<!-- '+s+' -->'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['code',s=>'<code>'+s+'</code>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['math',s=>'<math>'+s+'</math>'],['markdown',s=>'```wikitext\n'+s+'\n```'],['unknown owner',s=>'{{Modelo desconhecido|'+s+'}}'],['noinclude',s=>'<noinclude>'+s+'</noinclude>']])for(const fixture of oracles.representative.filter(item=>[5,6,7,8,9,10,11,14].includes(item.feature)))test(bundle,'protected example '+kind+' '+fixture.feature,()=>{
  const source=wrapLiteral(fixture.source);eq(api.v213ReferenceFieldPlan(source,cfg).text,source,'The field example remains byte-identical');eq(api.v213ReferenceSyntaxPlan(source,cfg).text,source,'The native tag example remains byte-identical');
 });
 for(const changes of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:undefined},{discussionPage:true},{sectionOnly:true},{section:0},{section:'1'},{pageRedirect:true},{pageDisambiguation:true},{model:'javascript'},{contentModel:'json'},{syntaxRepairs:false},{structuralRepairs:false},{references:false},{automaticReferenceRepairs:false},{markup:false}])for(const fixture of oracles.representative.filter(item=>[5,7,8,11].includes(item.feature)))test(bundle,'source scope '+JSON.stringify(changes)+' '+fixture.feature,()=>{const options={...cfg,...changes};eq(api.v213ReferenceFieldPlan(fixture.source,options).text,fixture.source,'Only complete articles authorize automatic field repair');eq(api.v213ReferenceSyntaxPlan(fixture.source,options).text,fixture.source,'Only complete articles authorize native tag repair');});
 test(bundle,'compatible field compositions stay in one action',()=>{
  const source=wrap('url="https://https://https://example.test/fonte"|URL="https://https://https://example.test/fonte"'),expected=wrap('url=https://example.test/fonte');prove(source,expected,3);
  const plan=api.v213ReferenceFieldPlan(source,cfg);eq(api.v213ReferenceFieldProof(source+'x',plan.text,plan,cfg),false,'A stale source cannot authorize a retained field correction');eq(api.v213ReferenceFieldProof(source,plan.text,{...plan,edits:[]},cfg),false,'A forged field edit list is rejected');
 });
 for(const profile of [{model:'Citar web',title:'titulo',target:'titulo',renames:0},{model:'Cite web',title:'title',target:'título',renames:2},{model:'Lien web',title:'titre',target:'título',renames:2},{model:'Cita web',title:'título',target:'título',renames:1},{model:'Internetquelle',title:'titel',target:'título',renames:2}]){
  const literal=(fields,after=false)=>'Texto.<ref>{{'+(after?'Citar web':profile.model)+'|'+(after?profile.target:profile.title)+'=Fonte literal|'+fields+'}}</ref>\n{{Referências}}\n';
  for(const empty of ['parametro_obsoleto=','parametro_obsoleto=  ','parametro_obsoleto=|outro_campo='])test(bundle,'verified empty cleanup composition '+profile.model+' '+JSON.stringify(empty),()=>{
   const source=literal('url="https://example.test/fonte"|'+empty),expected=literal('url=https://example.test/fonte',true),removed=empty.includes('|')?2:1;prove(source,expected,profile.renames+1+removed);const changes=api.calculate({kind:'adjust',source,options:cfg}).changes;eq(changes.find(change=>change.id==='citationCleanup')?.count,removed,'Only independently proved empty-field removals use the cleanup label');eq(changes.some(change=>change.id==='duplicateParameters'||change.id==='dates'),false,'Empty cleanup is neither duplicate removal nor a date change');
  });
  for(const copies of [2,3,4])test(bundle,'typed URL and finite protocol finish together '+profile.model+' '+copies,()=>{
   const source=literal('url=='+('https://'.repeat(copies))+'example.test/fonte'),expected=literal('url=https://example.test/fonte',true);prove(source,expected,profile.renames+2);const changes=api.calculate({kind:'adjust',source,options:cfg}).changes;eq(changes.find(change=>change.id==='v213TypedEquals')?.count,1,'The extra assignment counts once');eq(changes.find(change=>change.id==='v213ProtocolChains')?.count,1,'The bounded protocol correction counts separately');
  });
  for(const fields of ['url="https://example.test/fonte"|url=','url=|url="https://example.test/fonte"','url=https://example.test/fonte|arquivo-url="https://example.test/a"|arquivourl='])test(bundle,'preverified empty role does not conflict '+profile.model+' '+sha(fields).slice(0,8),()=>{
   const archived=fields.includes('arquivo-url'),expected=archived?'url=https://example.test/fonte|'+(profile.renames?'arquivourl':'arquivo-url')+'=https://example.test/a':'url=https://example.test/fonte',source=literal(fields);prove(source,literal(expected,true),profile.renames+2+(archived&&profile.renames?1:0));eq(api.calculate({kind:'adjust',source,options:cfg}).changes.find(change=>change.id==='citationCleanup')?.count,1,'One exact empty role deletion counts as cleanup');
  });
  for(const invalid of ['url==https://'.replace('https://','https://'.repeat(5))+'example.test/fonte','url==https://http://example.test/fonte','url="https://example.test/fonte"|parametro_obsoleto=Valor literal'])test(bundle,'finite composition declines '+profile.model+' '+sha(invalid).slice(0,8),()=>{
   const source=literal(invalid);eq(api.v213ReferenceCall(source.slice(11,source.indexOf('</ref>')),cfg).changes,[],'An inadmissible protocol chain or nonempty unknown field has no finite field authority');eq(api.v213ReferenceFieldPlan(source,cfg).text,source,'A nonempty unknown field or unproved chain cannot be partially fixed');
  });
 }
 for(const key of ['pontofinal','ref','separator','separador'])test(bundle,'empty citation control flag is not ordinary cleanup '+key,()=>{
  const source=wrap('url="https://example.test/fonte"|'+key+'='),plan=api.v213ReferenceFieldPlan(source,cfg);eq(plan.text.includes('|'+key+'='),true,'An empty output-control flag is never removed by finite cleanup composition');
 });
 for(const [extra,label]of [['doi=doi:10.1000/182','identifiers'],['pages=pp. 12','identifiers'],['url-status=dead','citationParameters'],['language=English','citationParameters']])test(bundle,'legacy migration value label '+extra,()=>{
  const source='Texto.<ref>{{Cite web|title=Fonte literal|url="https://example.test/fonte"|'+extra+'}}</ref>\n{{Referências}}\n',result=api.calculate({kind:'adjust',source,options:cfg});eq(result.changes.some(change=>change.id==='dates'),false,'Only a source-proved date field can be reported as a date');eq(result.changes.some(change=>change.id===label),true,'The concrete legacy value change retains its actual field label');eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'Accurate labels do not defer an existing source correction');
 });
 test(bundle,'same source fields cannot conceal changed metadata',()=>{
  const source=wrap('url="https://example.test/fonte"|autor=Autor de controle'),plan=api.v213ReferenceFieldPlan(source,cfg);prove(source,plan.text);
  for(const changed of [plan.text.replace('Fonte literal','Outro título'),plan.text.replace('Autor de controle','Outro autor'),plan.text.replace('example.test/fonte','example.test/outra')]){eq(Boolean(api.safeComposition(source,changed,cfg)),true,'A metadata mutation cannot borrow a delimiter proof');eq(api.preservationAudit(source,changed,cfg).length>0,true,'Source loss remains visible to independent preservation checks');}
 });
 test(bundle,'localized identity proof cannot conceal a renamed target',()=>{
  const fixture=oracles.items.find(item=>item.id==='localized-ref-name'),plan=api.v213ReferenceSyntaxPlan(fixture.source,cfg);prove(fixture.source,fixture.expected);
  eq(api.v213ReferenceSyntaxProof(fixture.source+'x',plan.text,plan,cfg),false,'Stale reference identity source is rejected');eq(api.v213ReferenceSyntaxProof(fixture.source,plan.text,{...plan,steps:[]},cfg),false,'A forged graph proof is rejected');
  for(const changed of [fixture.expected.replace('Fonte literal.','Outra fonte.'),fixture.expected.replaceAll('name="localizada"','name="outra"')]){eq(Boolean(api.safeComposition(fixture.source,changed,cfg)),true,'A changed body or identity is not equivalent');eq(api.preservationAudit(fixture.source,changed,cfg).length>0,true,'Independent source-retention checks reject the mutation');}
 });
 test(bundle,'joint malformed closer and final dangling reference',()=>{
  const source='Texto.<ref>{{Citar web|titulo=Fonte A|url=https://example.test/a}}</ref/>\nOutro.<ref>{{Citar web|titulo=Fonte B|url=https://example.test/b}}\n{{Referências}}\n',expected=source.replace('</ref/>','</ref>').replace('b}}\n','b}}</ref>\n');prove(source,expected,2);
  const uncertain=source.replace('{{Citar web|titulo=Fonte B|url=https://example.test/b}}','{{Modelo desconhecido}}');eq(api.v213ReferenceSyntaxPlan(uncertain,cfg).text,uncertain,'An unknown remaining unclosed body cannot authorize either member of the joint repair');
 });
 for(const profile of [
  {model:'cite web',title:'title',author:'author',target:'Citar web'},
  {model:'cite book',title:'title',author:'author',target:'Citar livro'},
  {model:'cite journal',title:'title',author:'author',target:'Citar periódico'},
  {model:'Lien web',title:'titre',author:'auteur',target:'Citar web',standaloneMinor:false},
  {model:'Ouvrage',title:'titre',author:'auteur',target:'Citar livro',standaloneMinor:false},
  {model:'Cita web',title:'título',author:'autor',target:'Citar web',metadataChanges:1},
  {model:'Internetquelle',title:'titel',author:'autor',target:'Citar web',metadataChanges:2,standaloneMinor:false},
  {model:'Literatur',title:'Titel',author:'Autor',target:'Citar livro',standaloneMinor:false},
  {model:'Citar web',title:'title',author:'author',target:'Citar web',native:true}
 ])for(const mode of ['dangling','closer','name','group'])for(const quoted of [true,false])test(bundle,'registered migration and reference syntax '+profile.model+' '+mode+' '+quoted,()=>{
  const raw='{{'+profile.model+'|'+profile.title+'=Fonte literal|'+profile.author+'=Autor literal|url='+(quoted?'"':'')+'https://example.test/fonte'+(quoted?'"':'')+'}}',canonical='{{'+profile.target+'|'+(profile.native?profile.title:'título')+'=Fonte literal|'+(profile.native?profile.author:'autor')+'=Autor literal|url=https://example.test/fonte}}';
  let source,expected;
  if(mode==='dangling'){source='Texto.<ref>'+raw+'\n{{Referências}}\n';expected='Texto.<ref>'+canonical+'</ref>\n{{Referências}}\n';}
  else if(mode==='closer'){source='Texto.<ref>'+raw+'</ref/>\n{{Referências}}\n';expected='Texto.<ref>'+canonical+'</ref>\n{{Referências}}\n';}
  else if(mode==='name'){source='Texto.<ref nome="f">'+raw+'</ref> Outra chamada.<ref name="f" />\n{{Referências}}\n';expected='Texto.<ref name="f">'+canonical+'</ref> Outra chamada.<ref name="f" />\n{{Referências}}\n';}
  else{source='Texto.<ref name="f" grupo="nota">'+raw+'</ref> Outra chamada.<ref name="f" group="nota" />\n{{Referências|grupo=nota}}\n';expected='Texto.<ref name="f" group="nota">'+canonical+'</ref> Outra chamada.<ref name="f" group="nota" />\n{{Referências|grupo=nota}}\n';}
  prove(source,expected,(profile.native?0:profile.metadataChanges??3)+(quoted?2:1),quoted||profile.standaloneMinor!==false);eq(api.calculate({kind:'adjust',source,options:cfg}).warnings,[],'The proved combined migration adds no warning');
 });
 for(const model of ['cite web','Lien web','Cita web','Internetquelle'])test(bundle,'registered profile cannot bypass unknown enclosing source '+model,()=>{
  const source='{{Modelo desconhecido|<ref>{{'+model+'|title=Fonte literal|url=https://https://https://example.test/fonte}}</ref>}}\n{{Referências}}';
  eq(api.v213ReferenceFieldPlan(source,cfg).text,source,'The new profile proof cannot authorize a citation hidden inside an unknown expansion');eq(api.calculate({kind:'adjust',source,options:cfg}).text.includes('https://https://https://example.test/fonte'),true,'The old protocol fallback cannot apply the new rule without the whole-source proof');
 });
 test(bundle,'foreign profile proof cannot hide author or model replacement',()=>{
  const source='Texto.<ref>{{Lien web|titre=Fonte literal|auteur=Autor literal|url="https://example.test/fonte"}}</ref>\n{{Referências}}\n',expected='Texto.<ref>{{Citar web|título=Fonte literal|autor=Autor literal|url=https://example.test/fonte}}</ref>\n{{Referências}}\n';prove(source,expected,4);
  for(const changed of [expected.replace('Autor literal','Outro autor'),expected.replace('Citar web','Citar jornal'),expected.replace('Fonte literal','Outro título')]){eq(Boolean(api.safeComposition(source,changed,cfg)),true,'A known migration cannot authorize unrelated model or metadata changes');eq(api.preservationAudit(source,changed,cfg).length>0,true,'Every registered-profile mutation is independently rejected');}
 });
 test(bundle,'exact registered parameter punctuation stays compatible',()=>{
  const source='Texto.<ref>{{Ouvrage|titre=Fonte literal|numéro d\'édition=2|url="https://example.test/fonte"}}</ref>\n{{Referências}}\n',expected='Texto.<ref>{{Citar livro|título=Fonte literal|edição=2|url=https://example.test/fonte}}</ref>\n{{Referências}}\n';prove(source,expected,4);
 });
 test(bundle,'large unaffected source skips finite planning',()=>{
  const source=('Texto literal, sem resíduos de código.\n').repeat(15000);eq(api.v213ReferenceFieldTrigger(source),false,'The cheap field trigger rejects unaffected large text');eq(api.v213ReferenceFieldPlan(source,cfg).text,source,'Large unrelated prose is unchanged');eq(api.v213ReferenceSyntaxPlan(source,cfg).text,source,'Large unrelated prose does not acquire tag changes');
 });
}
const directory=candidate?candidate.artifactDirectory():path.resolve(process.env.REVISAWIKI_REPORT_DIR||'/tmp/revisawiki-reference-v213-tests');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'reference_safe_repairs.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.failures.length)process.exitCode=1;
