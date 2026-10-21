'use strict';
// Comparison-only equivalences must admit the existing exact repair while
// retaining every identifier association, biography field and protected byte.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(value=>path.join(root,'dist/2.19.0',value)));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),
 helperFile=path.join(root,'src/v2_19/preservation_equivalence.js'),helper=fs.readFileSync(helperFile),
 report={schemaVersion:1,kind:'comparison-only-preservation-equivalence',status:'passed',
  runnerSha256:sha(fs.readFileSync(__filename)),helperSha256:sha(helper),bundles:[],cases:[],checks:0,failures:[],
  helperInjection:false,networkRequests:0,wikipediaWrites:0};
const equal=(actual,expected,message)=>{report.checks++;assert.deepEqual(actual,expected,message);},
 truth=(actual,message)=>{report.checks++;assert.ok(actual,message);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);
 for(const name of ['v219IdentifierPreservationPlan','v219IdentifierPreservationProof','v219ProseExpectedSource','v219CitationAccessDateIdentity',
  'v219BiographyImageInventoryValue','v219BiographyInventoryBody','v219TableCellMediaPlan','v219TableCellMediaProof',
  'v219TableCellInventoryBody','v219ReferenceMarkupPlan','v219ReferenceMarkupProof'])assert.equal(typeof api[name],'function','The built runtime must export '+name);
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 const base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,
  pageTitle:'Tema fictício',contentModel:'wikitext',now:Date.UTC(2026,9,17,12),autoPreview:false},
  citationCfg={...base,citations:true,multilingual:true,links:true},
  spellCfg={...base,automaticSpelling:true};
 let endpointEvidence=[];
 function recordEndpoint(source,expected,options,calculated,intent){
  assert.equal(calculated.text,expected,'An independently specified complete-action endpoint must match exactly');report.checks++;
  const optionsSha256=sha(JSON.stringify(Object.fromEntries(Object.entries(options).sort(([a],[b])=>a.localeCompare(b))))),
   sourceSha256=sha(source),expectedEndpointSha256=sha(expected);
  endpointEvidence.push({evidenceKind:'actual-full-action-exact-endpoint',sourceSha256,expectedEndpointSha256,optionsSha256,
   intentSha256:sha(JSON.stringify({kind:'adjust',intent,sourceSha256,expectedEndpointSha256,optionsSha256})),
   appliedRuleIds:[...new Set((calculated.changes||[]).map(change=>change.id))],
   actualChanges:(calculated.changes||[]).map(({id,count})=>({id,count}))});
 }
 function test(id,fn){endpointEvidence=[];try{fn();report.cases.push({bundle,id,status:'passed',
  evidenceKind:endpointEvidence.length?'actual-full-action-exact-endpoint':'helper-or-invariant-only',fullActionEvidence:endpointEvidence});}catch(error){report.status='failed';
  report.cases.push({bundle,id,status:'failed',fullActionEvidence:endpointEvidence});report.failures.push({bundle,id,message:error.message});}}
 function rejected(before,after,cfg,id){test(id,()=>{truth(api.preservationAudit(before,after,cfg).length>0,
  'A changed identifier, association or prose word must still fail the independent guard');});}
 const ids=[
  ['isbn','ISBN 0-521-79540-0','0-521-79540-0'],['isbn','ISBN-10: 0-521-79540-0','0-521-79540-0'],
  ['isbn','ISBN-13 978-0-306-40615-7','978-0-306-40615-7'],
  ['doi','doi:10.1000/example','10.1000/example'],['doi','https://doi.org/10.1000/example','10.1000/example'],
  ['doi','http://dx.doi.org/10.1000/example','10.1000/example'],
  ['pmid','PMID:19876543','19876543'],['pmid','https://pubmed.ncbi.nlm.nih.gov/19876543/','19876543'],
  ['pmc','PMC1234567','1234567'],['pmc','PMC:1234567','1234567']
 ];
 for(const template of ['Citar livro','citar livro','Citar periódico','Citar web','Citation','citation',
  'Predefinição:Citation','Template:citation','Cite book'])
 for(const [key,value,canonical]of ids)test('typed-'+template+'-'+key+'-'+value,()=>{
  const english=/[Cc]itation$|Cite book/.test(template),title=english?'title':'título',
   before='{{'+template+'|'+title+'=Publicação literal|'+key+'='+value+'}}',
   expectedProjection=before.replace(key+'='+value,key+'='+canonical),
   plan=api.v219IdentifierPreservationPlan(before,citationCfg),result=api.calculate({kind:'adjust',source:before,options:citationCfg});
  equal(plan.text,expectedProjection,'Only the typed source field is projected to the validated exact identifier');
  equal(plan.edits.length,1,'The comparison projection has one unique literal field witness');
  truth(api.v219IdentifierPreservationProof(before,plan.text,plan,citationCfg),'The original complete source binds the comparison plan');
  truth(!api.v219IdentifierPreservationProof(before,plan.text+'x',plan,citationCfg),'A changed endpoint cannot reuse the proof');
  truth(!api.v219IdentifierPreservationProof(before+'x',plan.text,plan,citationCfg),'A changed source cannot reuse the proof');
  truth(result.text.includes(key+'='+canonical),'The real action still performs the existing typed normalization');
  equal(result.preservation||[],[],'The real action has no false identifier finding');
  equal(api.preservationAudit(before,result.text,citationCfg),[],'Standalone guard admits only the exact normalized identifier');
  equal(api.safeComposition(before,result.text,citationCfg),'','Citation association checks still admit the exact endpoint');
  equal(api.calculate({kind:'adjust',source:result.text,options:citationCfg}).text,result.text,'The actual pipeline is idempotent');
  equal(api.v219IdentifierPreservationPlan(plan.text,citationCfg).edits,[],'The comparison projection itself is idempotent');
 });
 const literal='{{Citar livro|título=Publicação literal|isbn=ISBN 0-521-79540-0}}';
 for(const [label,change]of [
  ['quoted-title',s=>s.replace('Publicação literal','"Publicação literal"')],
  ['later-open-quote',s=>s+'\nTexto "aberto'],
  ['later-open-template',s=>s+'\n{{Incompleta'],
  ['reference-body',s=>'Fato literal.<ref>'+s+'</ref>'],
  ['inline-field-quote',s=>s.replace('Publicação literal','Publicação "literal" de exemplo')]
 ])test('typed-local-context-'+label,()=>{
  const source=change(literal),expected=source.replace('isbn=ISBN 0-521-79540-0','isbn=0-521-79540-0'),
   projection=api.v219IdentifierPreservationPlan(source,citationCfg);
  equal(projection.text,expected,'Only the complete unprotected typed field is projected, independent of a different title or later tail');
  truth(api.v219IdentifierPreservationProof(source,projection.text,projection,citationCfg),'The complete original page binds the local context proof');
  equal(api.preservationAudit(source,expected,citationCfg),[],'The exact permitted prefix cleanup does not produce a false loss warning');
 });
 for(const [label,wrap]of [
  ['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!-- '+s+' -->'],['code',s=>'<code>'+s+'</code>'],
  ['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],
  ['markdown',s=>'```wikitext\n'+s+'\n```'],['quotation',s=>'"'+s+'"']
 ])test('typed-protected-'+label,()=>{const source=wrap(literal);equal(api.v219IdentifierPreservationPlan(source,citationCfg).text,
  source,'A protected example cannot authorize identifier equivalence');});
 for(const [label,change]of [
  ['unknown-template',s=>s.replace('Citar livro','Modelo desconhecido')],
  ['unknown-field',s=>s.replace('|isbn=','|identificador=')],
  ['unequal-duplicate',s=>s.replace('}}','|isbn=978-0-306-40615-7}}')],
  ['empty-duplicate',s=>s.replace('}}','|isbn=}}')],
  ['same-duplicate',s=>s.replace('}}','|isbn=ISBN 0-521-79540-0}}')],
  ['nested-identifier',s=>s.replace('ISBN 0-521-79540-0','{{ISBN|0-521-79540-0}}')],
  ['invalid-isbn',s=>s.replace('0-521-79540-0','0-521-79540-1')],
  ['dynamic-identifier',s=>s.replace('ISBN 0-521-79540-0','{{{isbn|ISBN 0-521-79540-0}}}')],
  ['incomplete-template',s=>s.slice(0,-2)]
 ])test('typed-refusal-'+label,()=>{const source=change(literal);equal(api.v219IdentifierPreservationPlan(source,citationCfg).text,
  source,'Only a complete known call with one validated typed role can establish equivalence');});
 for(const [label,source]of [
  ['generic-internal-case','{{CITATION|title=Publicação literal|isbn=ISBN 0-521-79540-0}}'],
  ['generic-patent-selector','{{Citation|title=Publicação literal|isbn=ISBN 0-521-79540-0|inventor=Pessoa literal}}'],
  ['generic-unknown-field','{{Citation|title=Publicação literal|isbn=ISBN 0-521-79540-0|campo_inexistente=Valor}}'],
  ['generic-id-role-collision','{{Citation|title=Publicação literal|isbn=ISBN 0-521-79540-0|ISBN=978-0-306-40615-7}}'],
  ['quoted-id-value','{{Citar livro|título=Publicação literal|isbn="ISBN 0-521-79540-0"}}'],
  ['quoted-entire-call','"'+literal+'"'],
  ['unclosed-enclosing-call','{{Incompleta|conteúdo='+literal],
  ['invalid-doi','{{Citar livro|título=Publicação literal|doi=doi:identificador inválido}}'],
  ['invalid-pmid','{{Citar livro|título=Publicação literal|pmid=PMID:0000}}'],
  ['invalid-pmc','{{Citar livro|título=Publicação literal|pmc=PMCABC123}}']
 ])test('typed-local-refusal-'+label,()=>{equal(api.v219IdentifierPreservationPlan(source,citationCfg).text,source,
  'An unverified identity, role collision or protected value cannot establish equivalence');});
 for(const [key,value]of [['citations',false],['namespaceNumber',10],['contentModel','javascript']])test('typed-scope-'+key,()=>{
  equal(api.v219IdentifierPreservationPlan(literal,{...citationCfg,[key]:value}).text,literal,'The option or definition context disables the projection');});
 for(const template of ['Citar livro','Citation'])for(const key of ['isbn','doi','pmid','pmc']){
  const row=ids.find(entry=>entry[0]===key),before='{{Citar livro|título=Publicação literal|'+key+'='+row[1]+'}}',
   plain='{{Citar livro|título=Publicação literal|'+key+'='+row[2]+'}}',s=before.replace('Citar livro',template),t=plain.replace('Citar livro',template);
  rejected(s,t.replace(row[2],key==='isbn'?'978-0-306-40615-7':key==='doi'?'10.1000/other':'12345678'),citationCfg,'typed-value-tamper-'+template+'-'+key);
  rejected(s,'{{'+template+'|título=Publicação literal}}',citationCfg,'typed-field-deletion-'+template+'-'+key);
  rejected(s,t.replace('Publicação literal','Outra publicação'),citationCfg,'typed-title-tamper-'+template+'-'+key);
 }
 for(const template of ['Citar livro','Citation'])for(const key of ['isbn','doi','pmid','pmc']){
  const values=key==='isbn'?['0-521-79540-0','978-0-306-40615-7']:key==='doi'?['10.1000/alpha','10.1000/beta']:['1234567','7654321'],
   a='{{'+template+'|título=Publicação A|'+key+'='+values[0]+'}}',b='{{'+template+'|título=Publicação B|'+key+'='+values[1]+'}}',
   after=a.replace(values[0],values[1])+'\n'+b.replace(values[1],values[0]);
  rejected(a+'\n'+b,after,citationCfg,'typed-cross-citation-swap-'+template+'-'+key);
 }
 for(const [wrong,correct]of [['filosófos','filósofos'],['substituida','substituída'],['necessario','necessário'],
  ['diferênça','diferença'],['analizavam','analisavam']]){
  const before='O texto contém '+wrong+' no trecho literal.',after=before.replace(wrong,correct);
  test('spelling-exact-'+wrong,()=>{
   equal(api.v219ProseExpectedSource(before,spellCfg),after,'Only the existing exact automatic spelling rule projects the source');
   const result=api.calculate({kind:'adjust',source:before,options:spellCfg});equal(result.text,after,'The actual action still applies that rule');
   recordEndpoint(before,after,spellCfg,result,'one finite spelling rule in unprotected prose');
   equal(result.preservation||[],[],'The action has no false lost-prose warning');
   equal(api.preservationAudit(before,after,spellCfg),[],'The standalone guard admits the same exact spelling rule');
   equal(api.calculate({kind:'adjust',source:after,options:spellCfg}).text,after,'The action is idempotent');
  });
  for(const [label,options]of [['option-off',{automaticSpelling:false}],['allowlist',{spellingAllowedWords:[wrong]}],
   ['title',{pageTitle:wrong}],['ignored-rule',{spellingIgnoredRules:['word:'+wrong]}]])test('spelling-boundary-'+wrong+'-'+label,()=>{
   const cfg={...spellCfg,...options};equal(api.v219ProseExpectedSource(before,cfg),before,'The exact existing allowlist and option boundaries remain in force');
   truth(api.preservationAudit(before,after,cfg).some(finding=>finding.code==='lost-prose'),'An unapproved prose rewrite does not gain equivalence');
  });
  for(const [label,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['code',s=>'<code>'+s+'</code>'],
   ['pre',s=>'<pre>'+s+'</pre>'],['comment',s=>'<!-- '+s+' -->'],['italics',s=>"''"+s+"''"],
   ['quotation',s=>'"'+s+'"'],['citation',s=>'{{Citar livro|título='+s+'}}'],['proper-name',s=>"'''"+wrong+"''' "+s]])
   test('spelling-protected-'+wrong+'-'+label,()=>{const source=wrap(before);equal(api.v219ProseExpectedSource(source,spellCfg),source,
    'Protected words and explicit proper names cannot be normalized for comparison');});
  rejected(before,after.replace(correct,'trocaindevida'),spellCfg,'spelling-wrong-endpoint-'+wrong);
  rejected(before,after.replace('trecho literal',''),spellCfg,'spelling-extra-deletion-'+wrong);
  rejected(after,before,spellCfg,'spelling-new-typo-'+wrong);
 }
 const reachCfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
  authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,registryDoiCheck:false},
  unreachable='{{Modelo fictício|campo=</small>}}\nTexto com refêrencia literal.\n{{Modelo incompleto';
 test('spelling-unreachable-whole-cleanup',()=>{
  equal(api.syntaxRepairPrefix(unreachable,reachCfg).end,0,'The earlier stray syntax leaves no independently complete prefix');
  equal(api.v219ProseExpectedSource(unreachable,reachCfg),unreachable,'An unreachable spelling is not made mandatory for comparison');
  equal(api.preservationAudit(unreachable,unreachable,reachCfg),[],'Exact source identity does not produce a fabricated lost corrected word');
  const first=api.calculate({kind:'adjust',source:unreachable,options:reachCfg});
  equal(first.text,unreachable,'The actual cleanup preserves the unresolved complete source');
  recordEndpoint(unreachable,unreachable,reachCfg,first,'unchanged source after the actual unreachable cleanup bailout');
  equal(first.preservation||[],[],'The unchanged actual action has no false lost-prose finding');
 });
 const partial='Texto necessario no trecho completo.\n\n{{Modelo incompleto|campo=refêrencia',
  partialExpected=partial.replace('necessario','necessário');
 test('spelling-partial-prefix-only',()=>{
  const cut=api.syntaxRepairPrefix(partial,reachCfg).end;
  truth(cut>0&&cut<partial.length,'The source has an independently complete prefix and an unresolved tail');
  equal(api.v219ProseExpectedSource(partial,reachCfg),partialExpected,'Only the spelling reachable in the real prefix is projected');
  const first=api.calculate({kind:'adjust',source:partial,options:reachCfg});
  equal(first.text,partialExpected,'The actual partial cleanup reaches the same bounded spelling');
  recordEndpoint(partial,partialExpected,reachCfg,first,'finite spelling in the independently complete prefix only');
  equal(first.preservation||[],[],'A partially edited source has no false lost-prose finding');
  equal(api.calculate({kind:'adjust',source:first.text,options:reachCfg}).text,first.text,'The partial action is idempotent');
  truth(api.preservationAudit(partial,partialExpected.replace('trecho completo',''),reachCfg).some(f=>f.code==='lost-prose'),
   'The partial source proof cannot hide an unrelated deleted word');
  truth(api.preservationAudit(partialExpected,partial,reachCfg).some(f=>f.code==='lost-prose'),
   'An introduced typo remains a lost-prose failure');
 });
 for(const [label,source]of [['unclosed-template','Texto necessario. {{Modelo incompleto'],
  ['malformed-ref','Texto necessario.<ref><ref>Fonte literal.</ref>'],
  ['unclosed-opaque','Texto necessário.\n<nowiki>refêrencia literal']])test('spelling-early-exit-'+label,()=>{
  const cfg={...spellCfg,partialSyntaxRecovery:false},result=api.calculate({kind:'adjust',source,options:cfg});
  equal(api.v219ProseExpectedSource(source,cfg),source,'The exact early return or opaque tail cannot gain spelling equivalence');
  equal(result.text,source,'The actual disabled-recovery or opaque source is retained');
  recordEndpoint(source,source,cfg,result,'preserved disabled-recovery or opaque source');
  equal(result.preservation||[],[],'Preserving that source introduces no lost corrected word');
 });
 const accessBefore='{{Citar periódico|título=Título literal " incompleto|url=https://example.invalid/documento|acessodata=2025-1-14}}',
  accessAfter=accessBefore.replace('2025-1-14','2025-01-14'),accessCfg={...citationCfg,dates:true};
 test('access-date-literal-native-identity',()=>{
  equal(api.v219CitationAccessDateIdentity('2025-1-14',accessCfg),api.v219CitationAccessDateIdentity('2025-01-14',accessCfg),
   'Only the same validated calendar day gains access-date comparison identity');
  truth(api.v281CitationRetention(accessBefore,accessAfter,accessCfg).accepted,
   'An unrelated unmatched title quote cannot turn ISO padding into lost access-date metadata');
  truth(!api.v281CitationRetention(accessBefore,accessAfter,{...accessCfg,dates:false}).accepted,
   'Option-off does not authorize a changed date spelling');
 });
 for(const [label,change]of [['day',s=>s.replace('2025-01-14','2025-01-15')],['month',s=>s.replace('2025-01-14','2025-02-14')],
  ['deletion',s=>s.replace('|acessodata=2025-01-14','')],['title',s=>s.replace('Título literal','Outro título')],
  ['url',s=>s.replace('/documento','/outro')],['invalid-date',s=>s.replace('2025-01-14','2025-02-31')]])
  test('access-date-association-tamper-'+label,()=>{truth(!api.v281CitationRetention(accessBefore,change(accessAfter),accessCfg).accepted,
   'A changed or deleted day, title, target or invalid calendar date is still rejected');});
 const slash='\\'.repeat(3);
 for(const key of ['ref','pbo','pbi','pbb','not','nla'])test('shortcut-source-projection-'+key,()=>{
  const before=slash+key,after=api.shortcuts[key],cfg={...base,shortcuts:true};
  equal(api.v219ProseExpectedSource(before,cfg),after,'The comparison uses the exact explicit shortcut destination');
  equal(api.preservationAudit(before,after,cfg),[],'Explicit editor shortcuts have no false lost-prose finding');
  equal(api.v219ProseExpectedSource(before,{...cfg,shortcuts:false}),before,'Shortcut option-off preserves the literal source');
  equal(api.v219ProseExpectedSource('<nowiki>'+before+'</nowiki>',cfg),'<nowiki>'+before+'</nowiki>','Shortcut examples remain protected');
 });
 for(const [before,after]of [['__SOMMAIRE__','__TDC__'],['#REDIRECTION [[Tema fictício]]','#REDIRECIONAMENTO [[Tema fictício]]'],
  ['{{NOMBASEDEPAGE}}','{{NOMEDAPAGINABASE}}']])test('magic-source-projection-'+before,()=>{
  const cfg={...base,multilingual:true,links:true,auxiliaryTemplates:true};
  equal(api.v219ProseExpectedSource(before,cfg),after,'Only the exact source-bound native magic-word plan is projected');
  equal(api.preservationAudit(before,after,cfg),[],'Native-equivalent magic words do not remove visible prose');
  equal(api.calculate({kind:'adjust',source:before,options:cfg}).text,after,'The actual enabled action reaches the same endpoint');
  equal(api.v219ProseExpectedSource(before,{...cfg,multilingual:false}),before,'Magic-word option-off preserves the source');
 });
 for(const template of ['Citar web','Citar livro','Citar periódico','Citation'])for(const key of ['publicado','obra','website','editora','work','publisher'])
  for(const delimiter of ["''","'''"])test('reference-native-publication-emphasis-'+template+'-'+key+'-'+delimiter.length,()=>{
   const before='{{'+template+'|título=Publicação literal|'+key+'=[[Destino literal|'+delimiter+'Rótulo literal'+delimiter+']]}}',
    after=before.replace('[[Destino literal|'+delimiter+'Rótulo literal'+delimiter+']]',delimiter+'[[Destino literal|Rótulo literal]]'+delimiter),
    cfg={...citationCfg,markup:true},plan=api.v219ReferenceMarkupPlan(before,cfg);
   equal(plan.text,after,'The publication-field projection retains the exact target, label and emphasis delimiter');
   equal(plan.edits.length,1,'One literal publication link has one exact comparison witness');
   truth(api.v219ReferenceMarkupProof(before,after,plan,cfg),'The whole reference body binds the comparison-only plan');
   truth(!api.v219ReferenceMarkupProof(before,after.replace('Rótulo literal','Outro rótulo'),plan,cfg),'A changed label cannot reuse the proof');
   equal(api.v219ReferenceMarkupPlan(after,cfg).text,after,'The reference-markup projection is idempotent');
   equal(api.v218ReferenceBodyInventory(before,cfg),api.v218ReferenceBodyInventory(after,cfg),
    'The installed reference inventory reaches the same exact semantic field value');
  });
 const pubBefore="{{Citar web|título=Publicação literal|publicado=[[Destino literal|''Rótulo literal'']]}}",
  pubAfter="{{Citar web|título=Publicação literal|publicado=''[[Destino literal|Rótulo literal]]''}}",pubCfg={...citationCfg,markup:true};
 for(const [id,change]of [['target',s=>s.replace('Destino literal','Outro destino')],['label',s=>s.replace('Rótulo literal','Outro rótulo')],
  ['emphasis',s=>s.replace(/''/g,"'''")],['field',s=>s.replace('publicado=','url=')]])test('reference-emphasis-tamper-'+id,()=>{
   truth(api.v218ReferenceBodyInventory(pubBefore,pubCfg)!==api.v218ReferenceBodyInventory(change(pubAfter),pubCfg),
    'A different target, visible label, delimiter or semantic field is never equivalent');
  });
 for(const [id,wrap]of [['unknown-owner',s=>'{{Modelo desconhecido|conteúdo='+s+'}}'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],
  ['comment',s=>'<!-- '+s+' -->'],['quoted-call',s=>'"'+s+'"'],['code',s=>'<code>'+s+'</code>']])
  test('reference-emphasis-protected-'+id,()=>{const source=wrap(pubBefore);equal(api.v219ReferenceMarkupPlan(source,pubCfg).text,source,
   'Unknown enclosing templates and protected examples do not gain publication-field equivalence');});
 for(const key of ['markup','citations'])test('reference-emphasis-option-'+key,()=>{
  equal(api.v219ReferenceMarkupPlan(pubBefore,{...pubCfg,[key]:false}).text,pubBefore,'The finite field projection respects its option gates');
 });
 const nestedQuote='"{{Citar web|titulo=Publicação literal|publicado={{Citar livro|titulo=Livro literal|isbn=ISBN 0-521-79540-0}}}}"';
 for(const [label,source,options]of [
  ['nested-double-quoted-template',nestedQuote,{}],['nested-italic-quoted-template',"''"+nestedQuote+"''",{}],
  ['nested-comment-quoted-template','<!-- '+nestedQuote+' -->',{}],
  ['signed-talk-overlap','Comentário '+nestedQuote+' 00h00min de 1 de janeiro de 2020 (UTC)',{namespaceNumber:1,discussionPage:true,pageTitle:'Discussão:Tema fictício'}],
  ['unsigned-talk-overlap','Comentário '+nestedQuote,{namespaceNumber:1,discussionPage:true,pageTitle:'Discussão:Tema fictício'}],
  ['definition-quote-overlap','<noinclude>'+nestedQuote+'</noinclude>',{namespaceNumber:10,pageTitle:'Predefinição:Modelo fictício'}]
 ])test('protected-range-union-'+label,()=>{
  const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
   authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,...options},
   first=api.calculate({kind:'adjust',source,options:cfg});
  equal(first.text,source,'Nested quoted-template and discussion protections must compose without overlapping-edit errors or source mutations');
  recordEndpoint(source,source,cfg,first,'exact complete quoted object and discussion protection');
  equal(first.preservation||[],[],'A protected literal has no fabricated content-loss finding');
  equal(api.calculate({kind:'adjust',source:first.text,options:cfg}).text,first.text,'Repeated protected-source actions remain idempotent');
 });
 const imageCfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa fictícia',autoPreview:false,
  authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,registryDoiCheck:false},
  original='[[File:Exemplo.jpg|thumb|300px|alt=Descrição literal|Legenda literal|centro ]]',
  canonical='[[Imagem:Exemplo.jpg|miniaturadaimagem|300px|alt=Descrição literal|Legenda literal|centro ]]';
 for(const namespace of ['File','Image','Arquivo','Ficheiro','Imagem'])for(const option of ['thumb','thumbnail','miniatura','miniaturadaimagem'])
  test('image-finite-alias-'+namespace+'-'+option,()=>{
   const source=original.replace('File:',namespace+':').replace('|thumb|','|'+option+'|');
   equal(api.v219BiographyImageInventoryValue(source,imageCfg,'imagem','info/biografia'),canonical,
    'Only finite native namespace/thumbnail aliases are canonicalized');
   equal(api.v219BiographyInventoryBody(source,imageCfg,'imagem','info/biografia'),
    api.v219BiographyInventoryBody(canonical,imageCfg,'imagem','info/biografia'),'Equivalent native image fields compare exactly');
  });
 for(const [label,cfg,field,template]of [['links-off',{...imageCfg,links:false},'imagem','info/biografia'],
  ['multilingual-off',{...imageCfg,multilingual:false},'imagem','info/biografia'],['non-image',imageCfg,'nome','info/biografia'],
  ['unknown-box',imageCfg,'imagem','info/desconhecida']])test('image-boundary-'+label,()=>{
  equal(api.v219BiographyImageInventoryValue(original,cfg,field,template),original,'An unverified field or option cannot gain image equivalence');
 });
 const source='{{Info/Biografia|nome=Pessoa fictícia|imagem='+original+'|data_nascimento=1 de janeiro de 1980}}',
  safe=api.v25SafeRepairPlan(source,imageCfg),calculated=api.calculate({kind:'adjust',source,options:imageCfg}),
  proofContext={safe,cfg:imageCfg};
 test('image-real-biography-plan',()=>{
  truth(safe.steps.some(step=>step.name.startsWith('v216-')),'A real source-derived biography stage supplies the object-proof context');
  equal(calculated.text,safe.text,'A native File namespace and thumbnail option remain accepted without cosmetic rewriting');
  truth(calculated.text.includes(original),'The full action preserves the exact native image object');
  equal(api.preservationAudit(source,calculated.text,imageCfg),[],'The complete real action preserves the biography');
  equal(calculated.preservation||[],[],'The actual action reports no spurious biography guard');
  truth(api.v216BiographyObjectProof(proofContext,safe.text,calculated.text).accepted,'Object retention admits the exact native aliases');
  equal(api.calculate({kind:'adjust',source:calculated.text,options:imageCfg}).text,calculated.text,'The full biography action is idempotent');
 });
 for(const [label,change]of [['filename',s=>s.replace('Exemplo.jpg','Outro.jpg')],['caption',s=>s.replace('Legenda literal','Outra legenda')],
  ['width',s=>s.replace('300px','400px')],['alt',s=>s.replace('Descrição literal','Outra descrição')],
  ['leading-colon',s=>s.replace('[[File:', '[[:File:')],['image-link-target',s=>s.replace('|centro','|link=Outro destino|centro')],
  ['subject-name',s=>s.replace('nome=Pessoa fictícia','nome=Outra pessoa')],['date',s=>s.replace('|1|1|1980','|2|1|1980')]])
  test('image-object-tamper-'+label,()=>{
   const changed=change(calculated.text);truth(changed!==calculated.text,'The attack changes an actual retained source byte');
   truth(!api.v216BiographyObjectProof(proofContext,safe.text,changed).accepted,'The existing object guard still rejects altered names, dates, captions, widths and media targets');
  });
 const cell='Texto literal [[Image:Exemplo.svg|15px|alt=Descrição literal|Legenda literal.]] fim.',
  cellExpected=cell.replace('[[Image:','[[Imagem:');
 for(const namespace of ['File','Image','Arquivo','Ficheiro','Imagem'])test('table-cell-native-namespace-'+namespace,()=>{
  const value=cell.replace('Image:',namespace+':'),plan=api.v219TableCellMediaPlan(value,imageCfg);
  equal(plan.text,cellExpected,'Only the native file namespace changes in the cell comparison');
  truth(api.v219TableCellMediaProof(value,plan.text,plan,imageCfg),'The comparison endpoint is bound to the original complete cell');
  equal(api.v219TableCellInventoryBody(value,imageCfg),api.v219TableCellInventoryBody(cellExpected,imageCfg),
   'Exact filename, caption, alt, width, surrounding prose and option order remain equal');
 });
 for(const padding of [' ','  ','\t',' \t '])test('table-cell-initial-padding-'+JSON.stringify(padding),()=>{
  const value=padding+cell,plan=api.v219TableCellMediaPlan(value,imageCfg);
  equal(plan.text,padding+cellExpected,'Only padding on the first table-cell line is interpreted in its separator context');
  truth(api.v219TableCellMediaProof(value,plan.text,plan,imageCfg),'The original padding and adjusted source offsets remain proved');
 });
 for(const [label,value,cfg]of [['leading-colon',cell.replace('[[Image:','[[:Image:'),imageCfg],
  ['foreign-namespace',cell.replace('[[Image:','[[Datei:'),imageCfg],
  ['unknown-owner','{{Modelo fictício|imagem='+cell+'}}',imageCfg],
  ['nested-caption',cell.replace('Legenda literal.','[[Rótulo literal]]'),imageCfg],
  ['comment','<!-- '+cell+' -->',imageCfg],['nowiki','<nowiki>'+cell+'</nowiki>',imageCfg],
  ['quotation','"'+cell+'"',imageCfg],['markdown','```wikitext\n'+cell+'\n```',imageCfg],
  ['incomplete',cell+' {{Incompleta',imageCfg],['links-off',cell,{...imageCfg,links:false}],
  ['later-indented-code','Texto literal.\n '+cell,imageCfg],
  ['multilingual-off',cell,{...imageCfg,multilingual:false}],['definition',cell,{...imageCfg,namespaceNumber:10,pageTitle:'Predefinição:Modelo fictício'}]
 ])test('table-cell-media-boundary-'+label,()=>{
  equal(api.v219TableCellMediaPlan(value,cfg).text,value,'An unproved or protected cell receives no namespace projection');
 });
 const tableSource='{| class="wikitable"\n! Classe !! Imagem\n|-\n| Valor literal || '+cell+'\n|-\n|}\n',
  tableSafe=api.v25SafeRepairPlan(tableSource,imageCfg),
  tableCalculated=api.calculate({kind:'adjust',source:tableSource,options:imageCfg}),
  tableContext={safe:tableSafe,cfg:imageCfg};
 test('table-cell-real-action-composition',()=>{
  truth(tableSafe.steps.some(step=>step.name==='v210-table-syntax'),'The complete source generates an independently witnessed table repair');
  truth(tableCalculated.text.includes(cell),'The table repair preserves the already accepted native Image object exactly');
  truth(api.v210TableObjectProof(tableContext,tableSafe.text,tableCalculated.text).accepted,
   'The table object guard admits only the exact native namespace difference');
  equal(tableCalculated.preservation||[],[],'The actual pipeline reports no fabricated cell loss');
  equal(api.safeComposition(tableSource,tableCalculated.text,imageCfg),'','Independent syntax and media operations compose safely');
  equal(api.calculate({kind:'adjust',source:tableCalculated.text,options:imageCfg}).text,tableCalculated.text,
   'The actual complete action is idempotent');
 });
 for(const [label,change]of [['filename',s=>s.replace('Exemplo.svg','Outro.svg')],
  ['caption-period',s=>s.replace('Legenda literal.','Legenda literal')],['caption',s=>s.replace('Legenda literal.','Outra legenda.')],
  ['alt',s=>s.replace('Descrição literal','Outra descrição')],['width',s=>s.replace('15px','25px')],
  ['leading-colon',s=>s.replace('[[Image:','[[:Image:')],['media-target',s=>s.replace('|15px','|link=Outro destino|15px')],
  ['option-order',s=>s.replace('|15px|alt=Descrição literal','|alt=Descrição literal|15px')],
  ['cell-text',s=>s.replace('Valor literal','Outro valor')],['cell-span',s=>s.replace('| Valor literal','| colspan="2" | Valor literal')]
 ])test('table-cell-object-tamper-'+label,()=>{
  const changed=change(tableCalculated.text);truth(changed!==tableCalculated.text,'The attack changes an actual table byte');
  truth(!api.v210TableObjectProof(tableContext,tableSafe.text,changed).accepted,
   'Table retention still rejects changed content, targets, rendering type, attributes and option order');
 });
 equal(sha(fs.readFileSync(file)),sha(bytes),'The tested runtime bytes remain unchanged during the suite');
}
report.caseCount=report.cases.length;
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(report.status!=='passed')process.exitCode=1;
