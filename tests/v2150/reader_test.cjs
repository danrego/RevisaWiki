'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:[path.join(root,'dist/2.15.0/RevisaWiki_v2_15_0_completo.js')];
const oracle=JSON.parse(fs.readFileSync(path.join(__dirname,'reader_official_contracts.json'))),report={version:null,kind:'template-reader-context-and-identity',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),oracleSha256:sha(fs.readFileSync(path.join(__dirname,'reader_official_contracts.json'))),bundles:[],cases:0,checks:0,failures:[],performance:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function okay(value,label){report.checks++;assert(value,label);}
function test(bundle,id,run){try{run();report.cases++;}catch(error){report.status='failed';report.failures.push({bundle,id,message:error.message});}}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file);report.version=api.version;report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file)),version:api.version});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',autoPreview:false,minorBaseConfirmed:true,
  authorityControl:false,automaticSpelling:false,portals:false,automaticTopicPortals:false,automaticBiographyPortals:false,dates:false};
 const adjust=(source,options={})=>api.calculate({kind:'adjust',source,options:{...cfg,...options}});
 const roleInventory=source=>{const parsed=api.v215BraceStructure(source);return parsed.nodes.slice().sort((a,b)=>a.start-b.start||b.end-a.end).map(n=>({size:n.size,depth:n.depth-parsed.unclosed.filter(u=>u.start<n.start).length}));};
 for(const row of oracle.cases)test(bundle,'official role tree '+row.id,()=>{
  eq(sha(row.source),row.sourceSha256,'The exact independently authored input is retained');
  eq(roleInventory(row.source),row.expectedRoles,'Template/parameter roles agree with the official native test oracle');
 });
 for(let open=2;open<=12;open++)for(let close=2;close<=12;close++)test(bundle,'uneven brace conservation '+open+'/'+close,()=>{
  const source='{'.repeat(open)+'x'+'}'.repeat(close),parsed=api.v215BraceStructure(source);
  for(const node of parsed.nodes){eq(source.slice(node.start,node.start+node.size),'{'.repeat(node.size),'Every node starts at its actual opening');eq(source.slice(node.end-node.size,node.end),'}'.repeat(node.size),'Every node ends at its actual closer');}
  eq(adjust(source,{namespaceNumber:10,pageTitle:'Predefinição:Controle/Testes'}).text,source,'No inferred brace balancing is applied to a test example');
 });
 for(const source of ['{{{{{1}}}}}','{{{{{2}}}x|{{{1}}}}}','{{{{{name|Navbox}}}|title=Teste|list1=A}}'])test(bundle,'dynamic name '+sha(source).slice(0,10),()=>{
  eq(api.syntaxAudit(source),[],'A valid dynamic call is not diagnosed as unclosed');
  eq(api.templateTargets(source),[],'Parameter names and defaults cannot invent static template dependencies');
  eq(adjust(source).text,source,'The complete article pipeline retains the dynamic call');
 });
 const calls=[
  ['{{Navbox|title=Teste|list1=A|list1=A}}',true],['{{navbox|title=Teste|list1=A|list1=A}}',true],
  ['{{Template:Navbox|title=Teste|list1=A|list1=A}}',true],['{{Predefinição:Navbox|title=Teste|list1=A|list1=A}}',true],
  ['{{NAVBOX|title=Teste|list1=A|list1=A}}',false],['{{NavBox|title=Teste|list1=A|list1=A}}',false],
  ['{{Navbox|title=Teste}}',true],['{{Info/Biografia|nome=Pessoa}}',true],['{{info/Biografia|nome=Pessoa}}',true],
  ['{{Info/biografia|nome=Pessoa}}',false],['{{INFO/BIOGRAFIA|nome=Pessoa}}',false],
  ['{{Citar web|titulo=Fonte}}',true],['{{Citar_web|titulo=Fonte}}',true],['{{CITAR WEB|titulo=Fonte}}',false],
  ['{{Cite web|title=Fonte}}',true],['{{CITE WEB|title=Fonte}}',false],['{{Cite Web|title=Fonte}}',false],
  ['{{Lien web|titre=Fonte}}',true],['{{Modèle:Lien web|titre=Fonte}}',true],['{{LIEN WEB|titre=Fonte}}',false],
  ['{{#if:{{{x|}}}|a|b}}',false],['{{subst:Navbox|title=Teste}}',false],['{{safesubst:Navbox|title=Teste}}',false],
  ['{{ {{{nome|Navbox}}} |title=Teste}}',false],['{{:Navbox|title=Teste}}',false],['{{Modelo sem contrato|x=}}',false]
 ];
 for(const [source,expected]of calls)test(bundle,'literal identity '+sha(source).slice(0,10),()=>{
  eq(api.v215LiteralTemplateIdentity(source),expected,'Only a verified literal spelling receives its native contract');
  if(!expected&&/NAVBOX|NavBox/.test(source)){
   eq(adjust(source).text,source,'Arbitrary case does not authorize parameter deletion');
   eq(api.templateTargets(source).filter(x=>x.dependency),[],'An unverified case spelling does not inherit module dependencies');
  }
 });
 for(const [source,expected]of [['{{Navbox|title=Teste|list1=A|list1=A}}','{{Navbox|title=Teste|list1=A}}'],
  ['{{Cite web|title=Fonte|url=https://example.org/}}','{{Citar web|título=Fonte|url=https://example.org/}}']])test(bundle,'mainspace retained correction '+sha(source).slice(0,10),()=>{
  const result=adjust(source);eq(result.text,expected,'Previously supported verified article calls retain their correction');
  eq(adjust(result.text).text,result.text,'The result is idempotent');
  eq(result.preservation,[],'The correction retains all protected source data');
 });
 for(const source of ['{{DNI|1|1|2000}}','{{CITAR WEB|tituol=Fonte|url=https://example.org/}}','{{NASCIMENTO|1|1|2000}}','{{BIRTH DATE|2000|1|1}}'])test(bundle,'legacy identity cannot bypass guarded rebuilding '+sha(source).slice(0,10),()=>{
  eq(adjust(source).text,source,'An unverified title spelling cannot reach the independent legacy date or typo fixer');
 });
 for(const [source,expected]of [['{{dni|1|1|2000}}','{{dni|1|1|2000}}'],['{{Dni|1|1|2000}}','{{Dni|1|1|2000}}'],
  ['{{Nascimento|1|1|2000}}','{{Dni|1|1|2000|si}}'],['{{Birth_date|2000|1|1}}','{{Dni|1|1|2000|si}}']])test(bundle,'audited legacy alias remains supported '+sha(source).slice(0,10),()=>{
  eq(api.v215LiteralTemplateIdentity(source),true,'The retained alias has a pinned native or obsolete-source title');
  eq(adjust(source).text,expected,'Audited first-letter and underscore variants keep their accepted behavior');
 });
 const uppercaseCitationNames=['CITAR WEB','CITE WEB','CITE NEWS','CITAR JORNAL','CITATION'],legacyFields=[
  'title=Fonte|url=https://example.org/','tituol=Fonte|url=https://example.org/',
  'pmc=https://pmc.ncbi.nlm.nih.gov/articles/PMC12345/|título=Fonte','arxiv=https://arxiv.org/abs/2001.00001|título=Fonte',
  'data=2026/01/01|título=Fonte','pmid=PMID12345|título=Fonte','url=https://example.org/|url=https://example.org/|título=Fonte',
  'pagina=pp. 1|título=Fonte','numero-autores=et al.|autor=A, B, C|título=Fonte'];
 for(const name of uppercaseCitationNames)for(const fields of legacyFields)for(const wrapped of [false,true])test(bundle,'legacy invalid-case parameter matrix '+sha(name+fields+wrapped).slice(0,12),()=>{
  const raw='{{'+name+'|'+fields+'}}',source=wrapped?'Texto.<ref>'+raw+'</ref>\n{{Referências}}\n':raw;
  eq(adjust(source).text,source,'Unknown internal title case cannot authorize a legacy identifier, date, duplicate or field-name rewrite');
 });
 for(const source of ['{{PORTAL|Física}}','{{PORTAL3|Física|Física}}','{{INFO/BIOGRAFIA|nome=A|ocupação=Jornalista}}',
  '{{INFO/BIOGRAFIA|nome=|nome=A}}','{{SHORT DESCRIPTION|Literal}}\nTexto.','{{DESCRIÇÃO CURTA|Literal}}\nTexto.',
  '{{REFERÊNCIAS}}','{{REFERENCIAS}}','{{REFLIST}}'])test(bundle,'central identity covers whole-engine consumers '+sha(source).slice(0,12),()=>{
  eq(adjust(source,{portals:true}).text,source,'A known normalized lookup cannot authorize an unverified literal title');
 });
 const nativeProfiles=new Map();
 for(const profile of [...Object.values(api.templateCatalog),...Object.values(api.infoboxCatalog)])if(profile.title)nativeProfiles.set(profile.title,profile);
 for(const [title,profile]of nativeProfiles)for(const variant of [title,title[0].toLocaleLowerCase('pt')+title.slice(1),title.replace(/ /g,'_'),'Predefinição:'+title])test(bundle,'catalog native identity '+sha(variant).slice(0,12),()=>{
  const source='{{'+variant+'}}';eq(api.v215LiteralTemplateIdentity(source),true,'Every catalogued original title and its accepted first-letter, underscore and namespace form keeps its identity');
  const normalized=title.trim().replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('pt');
  eq(api.v215TemplateLookupName(source,normalized),normalized,'The central lookup retains every independently catalogued positive spelling');
 });
 for(const title of nativeProfiles.keys()){
  const variant=title[0]+title.slice(1).toLocaleUpperCase('pt'),source='{{'+variant+'}}';
  if(variant===title||api.v215LiteralTemplateIdentity(source))continue;
  test(bundle,'catalog unverified internal case '+sha(variant).slice(0,12),()=>{
   const normalized=title.trim().replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('pt');
   eq(api.v215TemplateLookupName(source,normalized),'unverified-template-title:'+normalized,'The same normalized key cannot bypass an unverified internal title case');
  });
 }
 for(const [raw,normalized]of [['{{ModeloInventado|x=A}}','modeloinventado'],['{{#IF:{{{x|}}}|A|B}}','#if:{{{x|}}}'],['{{PAGENAME}}','pagename'],['{{{{{nome}}}}}','{{{nome}}}']])test(bundle,'unknown dynamic and magic lookup '+sha(raw).slice(0,12),()=>{
  eq(api.v215TemplateLookupName(raw,normalized),normalized,'Names outside the finite known-profile check keep their previous lookup semantics');
 });
 const documentation='{{Descrição curta|Exemplo}}\n== Documentação ==\n{{Cite web|title=Exemplo|url=https://example.org/}}\n[[Alvo|Alvo]]\n[[Ficheiro:Exemplo.svg|link=Alvo]]\n{{Portal3|Ciência}}\n[[Categoria:Exemplos]]\n';
 for(const subpage of ['doc','Doc','documentação','documentacao','Documentação','Testes','testes','test','tests','testcases','sandbox','Sandbox','Demonstração','doc/Testes','doc/mais'])test(bundle,'documentation and test context '+subpage,()=>{
  const options={namespaceNumber:10,pageTitle:'Predefinição:Controle/'+subpage};const context=api.v215TemplatePageContext(options),actual=adjust(documentation,options);
  okay(context.documentation||context.test,'The subpage belongs to an explicit protected documentation/test context');
  eq(actual.text,documentation,'Prose, active demonstrations, categories and article-like examples remain byte-identical');
  eq(actual.changes,[],'No cosmetic changes are claimed in a protected example');
  const configured=api.pageContextOptions({...cfg,...options});eq(configured.autoMinor,false,'Template pages never get article minor-edit inference');
  eq(configured.links,false,'Legacy link cosmetics are disabled');eq(configured.markup,false,'Legacy list/italic cosmetics are disabled');
 });
 const definition='{{Navbox\n|title=Teste\n|list1=* Um\n:* Dois\n|list3={{#if:{{{x|}}}|[[Alvo|\'\'rótulo\'\']]|}}\n}}\n[[Ficheiro:Exemplo.svg|link=Alvo]]\n<noinclude>{{Cite web|title=Exemplo|url=https://example.org/}}\n{{Documentação}}\n[[Categoria:Exemplos]]</noinclude>';
 test(bundle,'definition literal preservation',()=>{
  const options={namespaceNumber:10,pageTitle:'Predefinição:Controle'},context=api.v215TemplatePageContext(options),actual=adjust(definition,options);
  eq(context.kind,'definition','The actual definition has a distinct context');
  eq(actual.text,definition,'Legacy cleanup cannot rebuild dedicated definition-stage output or alter list/newline semantics');
  const ranges=api.v215DefinitionProtectedRanges(definition,options);eq(ranges.length,1,'The existing documentation block has one protected range');
  eq(definition.slice(ranges[0].start,ranges[0].end),definition.slice(definition.indexOf('<noinclude>')),'The exact noinclude source is protected');
 });
 for(const key of ['templateDefinitionRepairs','syntaxRepairs','structuralRepairs','markup'])test(bundle,'original definition opt-out '+key,()=>{
  const options={...cfg,namespaceNumber:10,pageTitle:'Predefinição:Controle/doc',[key]:false};
  eq(api.pageContextOptions(options).templateDefinitionInputEnabled,false,'The dedicated definition stage retains the original user opt-out');
 });
 test(bundle,'definition enablement before legacy guards',()=>{
  const options={...cfg,namespaceNumber:10,pageTitle:'Predefinição:Controle/doc'},configured=api.pageContextOptions(options);
  eq(configured.templateDefinitionInputEnabled,true,'The explicit typed definition stage can inspect enabled original input');
  eq(configured.markup,false,'The original enablement does not re-enable legacy documentation cosmetics');
  eq(api.pageContextOptions(configured).templateDefinitionInputEnabled,true,'Internal normalization remains stable');
 });
 for(const enabled of [true,false])test(bundle,'definition Worker option round trip '+enabled,()=>{
  const original={...cfg,namespaceNumber:10,pageTitle:'Predefinição:Controle/doc',templateDefinitionRepairs:enabled},configured=api.pageContextOptions(original),serialized=api.v210SerializableOptions(configured),restored=api.pageContextOptions(serialized);
  eq(serialized.templateDefinitionInputEnabled,enabled,'The original opt-in or opt-out survives structured Worker options');
  eq(restored.templateDefinitionInputEnabled,enabled,'The Worker reuses the exact original enablement');
  eq(restored.markup,false,'Worker execution keeps legacy documentation cosmetics disabled');
 });
 test(bundle,'definition enablement affects freshness',()=>{
  eq(api.v211FreshnessKey({...cfg,templateDefinitionInputEnabled:true})===api.v211FreshnessKey({...cfg,templateDefinitionInputEnabled:false}),false,'A changed original definition opt-in permits a fresh run');
 });
 for(const wrap of [s=>'<!--'+s+'-->',s=>'<nowiki>'+s+'</nowiki>',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>',s=>'<templatedata>{"description":"'+s+'"}</templatedata>'])test(bundle,'literal curly example '+sha(wrap('x')).slice(0,10),()=>{
  const source=wrap('{{{{{2}}}x|{{{1}}}}}');eq(api.v215BraceStructure(source).nodes,[],'Literal examples cannot create callable nodes');
 });
 test(bundle,'ten thousand calls remain bounded',()=>{
  const source=Array.from({length:10000},(_,i)=>'{{Modelo|a={{{p'+i+'|}}}|b='+i+'}}').join('\n'),start=performance.now(),parsed=api.v215BraceStructure(source),elapsed=performance.now()-start;
  eq(parsed.nodes.length,20000,'Every template and parameter is accounted for');eq(parsed.unclosed,[],'The large document remains balanced');
  okay(elapsed<10000,'The reader stays within the generous offline time budget');report.performance.push({bundle,kind:'ten-thousand-calls',bytes:Buffer.byteLength(source),nodes:parsed.nodes.length,elapsedMs:Math.round(elapsed)});
 });
 test(bundle,'deep braces remain iterative',()=>{
  const source='{'.repeat(12000)+'x'+'}'.repeat(12000),start=performance.now(),parsed=api.v215BraceStructure(source),elapsed=performance.now()-start;
  eq(parsed.nodes.length,4000,'Deep brace groups do not recurse');eq(parsed.unclosed,[],'The deep input has no invented missing closer');
  okay(elapsed<10000,'Deep grouping stays bounded');report.performance.push({bundle,kind:'four-thousand-nested-parameters',bytes:Buffer.byteLength(source),nodes:parsed.nodes.length,elapsedMs:Math.round(elapsed)});
 });
 for(const [kind,source]of [['unterminated-angle-tail','<unclosed'.repeat(10000)],['scientific-inequalities','x < q < 1,3\n'.repeat(10000)]])test(bundle,'bounded angle reader '+kind,()=>{
  const start=performance.now(),parsed=api.v215BraceStructure(source),elapsed=performance.now()-start;
  eq(parsed.nodes,[],'Inequalities and incomplete tags cannot create template calls');eq(parsed.unclosed,[],'No curly delimiters are invented');
  okay(elapsed<10000,'A known absence of greater-than tokens is cached within the read');report.performance.push({bundle,kind,bytes:Buffer.byteLength(source),elapsedMs:Math.round(elapsed)});
 });
}
const output=process.env.REVISAWIKI_REPORT;if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
