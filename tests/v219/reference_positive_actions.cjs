'use strict';
// Literal complete-action endpoints exercise earlier reference fixes through
// the production action. No helper is substituted and no expected text is
// calculated from the implementation under test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(value=>path.resolve(value)),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'native-reference-positive-full-actions',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
const equal=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(value,message)=>{report.checks++;assert.ok(value,message);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',now:Date.UTC(2026,9,17,12),syntaxRepairs:true,structuralRepairs:true,markup:true,citations:true,references:true,automaticReferenceRepairs:true,referenceGraphRepairs:true,citationRepairs:true};
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 function test(id,source,expected,rules=[],options=base,kind='positive',intentId=null){
  const binding={sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(canonical(options)))},row={bundle,id,kind,...binding,intentSha256:sha(JSON.stringify({kind:'adjust',id:intentId||id})),enabledBooleanOptions:Object.entries(options).filter(([,value])=>value===true).map(([key])=>key).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,section:options.section||null,sectionOnly:options.sectionOnly===true,contentModel:options.contentModel||'wikitext',pageRedirect:options.pageRedirect===true,pageDisambiguation:options.pageDisambiguation===true,pageTitleSha256:sha(options.pageTitle||'')},scenarioSha256:sha(JSON.stringify(canonical({source,expected,options,id}))),evidenceKind:'actual-full-action-exact-endpoint',status:'passed'};
  try{
   const actual=api.calculate({kind:'adjust',source,options});row.actualEndpointSha256=sha(actual.text);row.appliedIds=(actual.changes||[]).map(change=>change.id);row.actualChanges=(actual.changes||[]).map(({id,count})=>({id,count}));
   equal(actual.text,expected,'The actual action matches the independently written full endpoint');
   for(const rule of rules)ok(row.appliedIds.includes(rule),'The production change ledger includes '+rule);
   equal(actual.preservation||[],[],'The action has no retention rollback');equal(api.preservationAudit(source,expected,options),[],'The production audit independently accepts the exact endpoint');equal(api.safeComposition(source,expected,options),'','The exact complete transaction composes');
   equal(api.calculate({kind:'adjust',source:expected,options}).text,expected,'A second action is byte-identical');
  }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}
  report.cases.push(row);
  if(kind==='positive')for(const [label,wrap]of [
   ['comment',value=>'<!--'+value+'-->'],['nowiki',value=>'<nowiki>'+value+'</nowiki>'],
   ['code',value=>'<syntaxhighlight lang="wikitext">'+value+'</syntaxhighlight>'],
   ['fence',value=>'Exemplo de código:\n```wikitext\n'+value+'\n```\nFim.'],
   ['unknown-owner',value=>'{{Modelo fictício|texto='+value+'}}']
  ]){const value=wrap(source);test(id+'-protected-'+label,value,value,[],options,'protected',intentId||id);}
 }
 const refs='\n{{Referências}}\n',wrap=call=>'Texto.<ref>'+call+'</ref>'+refs;
 const bank="'''Artigo de teste''' reúne dados para uma verificação local.\n\nTexto.<ref name=\"a\" /> Outra frase.<ref name=\"b\" />\n\n{{Referências|refs=<ref name=\"a\">Fonte.</ref><ref name=\"b\">Fonte.</ref>}}";
 test('inherited-bank-identical-definitions',bank,bank.replace('<ref name="b" />','<ref name="a" />').replace('<ref name="b">Fonte.</ref>',''),['v210ReferenceBanks'],{...base,automaticIdenticalReferences:true});
 for(const key of ['group','responsive'])for(const value of key==='group'?['nota','','lower-alpha']:['0','1'])for(const quote of ['"',"'"]){
  const token=key+'='+quote+value+quote,source='Texto.\n<references '+token+' '+token+'/>',expected='Texto.\n<references '+token+'/>';
  test('native-collector-identical-attribute-'+key+'-'+value+'-'+quote,source,expected,['v212CollectorAttributes']);
 }
 for(const name of ['Referências','referências'])for(const space of ['', ' ']){
  const source='Texto.<ref group="nota">Nota.</ref>\n{{'+name+space+'|'+space+'group'+space+'='+space+'nota'+space+'}}',expected=source.replace('|'+space+'group'+space+'=','|'+space+'grupo'+space+'=');
  test('inherited-native-collector-group-'+name+'-'+space.length,source,expected,['v212CollectorGroups']);
 }
 for(const family of ['Citar web','Citar jornal']){
  const call='{{'+family+'|titulo=Fonte de controle|blog=Publicação de controle|url=https://example.test/fonte|data=2020|acessodata=2020-01-02}}';
  test('inherited-native-blog-publication-'+family,wrap(call),wrap(call.replace('|blog=','|obra=')),['v2111BlogPublication']);
 }
 for(const family of ['Citar web','Citar jornal','Citar revista','Citar livro']){
  const call='{{'+family+'|titulo=Fonte de controle|jornal=Valor|obra=Valor|url=https://example.test/fonte}}';
  test('inherited-equal-citation-alias-'+family,wrap(call),wrap(call.replace('|obra=Valor','')),['v212CitationAliases'],{...base,automaticParameterDuplicates:true});
  const url='https://example.test/fonte?q=1&x=2#parte',bracket='{{'+family+'|titulo=Fonte de controle|url=['+url+']}}';
  test('inherited-isolated-bracketed-url-'+family,wrap(bracket),wrap(bracket.replace('['+url+']',url)),['v212BracketedURLs']);
 }
 const nativeAttrs='Texto.<ref name=fonte>Fonte literal.</ref> Outra chamada.<ref name=fonte/>'+refs;
 test('native-ref-attribute-quoting',nativeAttrs,nativeAttrs.replaceAll('name=fonte','name="fonte"').replace('name="fonte"/>','name="fonte" />'),['refAttributes']);
 for(const short of ['harvnb','harv','harvtxt','sfn','sfnp']){
  const source='Texto.{{'+short+'|Alfa, Beta|2020}}\n\n== Bibliografia ==\n{{Citar livro|titulo=Publicação literal|ultimo=Alfa|ultimo2=Beta|ano=2020|ref=harv}}\n',expected=source.replace('|Alfa, Beta|','|Alfa|Beta|');
  test('short-citation-two-exact-local-authors-'+short,source,expected,['shortCitationAuthors'],{...base,shortCitationChecks:true});
 }
 // A source-identity URL correction is tested from its existing pinned local
 // fixture. The public receipt records hashes, never a live page title.
 const manifestFile=path.join(root,'src/v2_11_1/VERIFIED_CITATION_URLS.json'),manifest=JSON.parse(fs.readFileSync(manifestFile));
 report.sourceIdentityManifestSha256=sha(fs.readFileSync(manifestFile));
 for(const [index,record]of manifest.records.entries())test('inherited-exact-citation-url-'+index,wrap(record.beforeCall),wrap(record.afterCall),['v2111VerifiedCitationURL'],{...base,pageTitle:manifest.article});
 equal(sha(fs.readFileSync(file)),sha(bytes),'The tested runtime is immutable');
}
report.caseCount=report.cases.length;report.distinctScenarios=new Set(report.cases.map(row=>row.scenarioSha256)).size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
