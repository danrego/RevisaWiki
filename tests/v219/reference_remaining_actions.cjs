'use strict';
// Complete-action contracts retain the literal endpoints of the earlier syntax
// suite and the source-pinned encyclopedia expansion. New reference examples
// specify every output byte before the production action is called.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(value=>path.resolve(value)),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'native-reference-remaining-full-actions',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],dispositions:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
const eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(value,message)=>{report.checks++;assert.ok(value,message);};
const syntaxFile=path.join(root,'tests/v26_legacy/fixtures.json'),syntax=JSON.parse(fs.readFileSync(syntaxFile)),encyclopediaFile=path.join(root,'tests/v2140/nsrw_cases.cjs'),encyclopedia=require(encyclopediaFile);
report.independentOracles=[{file:'tests/v26_legacy/fixtures.json',sha256:sha(fs.readFileSync(syntaxFile))},{file:'tests/v2140/nsrw_cases.cjs',sha256:sha(fs.readFileSync(encyclopediaFile))}];
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',now:Date.UTC(2026,9,17,12),syntaxRepairs:true,structuralRepairs:true,markup:true,citations:true,references:true,automaticReferenceRepairs:true,referenceGraphRepairs:true,citationRepairs:true};
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 function test(id,source,expected,rules=[],options=base,kind='positive',intentId=null){
  const binding={sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(canonical(options)))},row={bundle,id,kind,...binding,intentSha256:sha(JSON.stringify({kind:'adjust',id:intentId||id})),enabledBooleanOptions:Object.entries(options).filter(([,value])=>value===true).map(([key])=>key).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,section:options.section||null,sectionOnly:options.sectionOnly===true,contentModel:options.contentModel||'wikitext',pageRedirect:options.pageRedirect===true,pageDisambiguation:options.pageDisambiguation===true,pageTitleSha256:sha(options.pageTitle||'')},scenarioSha256:sha(JSON.stringify(canonical({source,expected,options,id}))),evidenceKind:'actual-full-action-exact-endpoint',status:'passed'};
  try{
   const actual=api.calculate({kind:'adjust',source,options});row.actualEndpointSha256=sha(actual.text);row.appliedIds=(actual.changes||[]).map(change=>change.id);row.actualChanges=(actual.changes||[]).map(({id,count})=>({id,count}));
   eq(actual.text,expected,'The actual action reaches the independently specified complete endpoint');for(const rule of rules)ok(row.appliedIds.includes(rule),'The actual retained change ledger includes '+rule);
   eq(actual.preservation||[],[],'No final retention rollback');eq(api.preservationAudit(source,expected,options),[],'Independent production retention accepts the endpoint');eq(api.safeComposition(source,expected,options),'','The source-bound complete endpoint composes');eq(api.calculate({kind:'adjust',source:expected,options}).text,expected,'The full action finishes in one pass');
  }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}
  report.cases.push(row);
  if(kind==='positive'||kind==='preservation')for(const [label,wrap]of [['comment',x=>'<!--'+x+'-->'],['nowiki',x=>'<nowiki>'+x+'</nowiki>'],['code',x=>'<syntaxhighlight lang="wikitext">'+x+'</syntaxhighlight>'],['fence',x=>'Exemplo de código:\n```wikitext\n'+x+'\n```\nFim.'],['quote-owner',x=>'{{Citação|'+x+'}}'],['unknown-owner',x=>'{{Modelo fictício|texto='+x+'}}']]){const literal=wrap(source);test(id+'-literal-'+label,literal,literal,[],options,'protected',intentId||id);}
 }
 const active={...base,referenceColumns:true},refs='\n{{Referências}}';
 test('ignored-native-column-fields','Texto.<ref>Fonte literal.</ref>\n{{Referências|col=2|largcol=30em}}','Texto.<ref>Fonte literal.</ref>\n{{Referências}}',['legacyReferenceColumns'],active);
 const many=Array.from({length:13},(_,i)=>'Fato '+i+'.<ref>Fonte literal '+i+'.</ref>').join('\n')+refs;
 test('native-renderer-does-not-force-columns',many,many,[],active,'valid-native');
 report.dispositions.push({bundle,id:'referenceColumns',kind:'superseded-layout-writer',replacement:'v218ResponsiveReferenceLayout',reason:'Native reference lists receive no forced inline columns. A source-proved generated footprint is removed by the earlier bounded layout stage; ignored legacy fields retain their own separate ledger.'});
 const generated='column-count:2;column-width:30em;column-gap:2em;max-width:62em;';
 test('source-proved-generated-columns-retired',many.replace('{{Referências}}','{{Referências|estilo='+generated+'}}'),many,['v218ResponsiveReferenceLayout'],active);
 test('punctuation-before-reference','Fato<ref>Fonte literal.</ref>.'+refs,'Fato<ref>Fonte literal.</ref>.'+refs,[],base,'preservation');
 test('punctuation-first-after-positive','Alfa.<ref>Fonte inicial.</ref> Beta<ref>Fonte literal.</ref>.'+refs,'Alfa.<ref>Fonte inicial.</ref> Beta.<ref>Fonte literal.</ref>'+refs,['referencePunctuation']);
 test('same-anchor-call','Texto.<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref><ref name="a" />'+refs,'Texto.<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref>'+refs,['v29AnchorReferences'],{...base,automaticIdenticalReferences:true});
 const named='Fato.<ref name="a">Fonte literal.</ref>\nOutro fato.<ref name="b">Fonte literal.</ref>'+refs;
 test('named-identical-body',named,named.replace('<ref name="b">Fonte literal.</ref>','<ref name="a" />'),['v27NamedReferences'],{...base,automaticIdenticalReferences:true});
 test('global-list-before-all-markers','{{Referências}}Texto.<ref>Fonte literal.</ref>','Texto.<ref>Fonte literal.</ref>\n\n{{Referências}}\n\n',['relocatedReferenceList']);
 test('two-global-lists-before-all-markers','{{Referências}}{{Referências}}Texto.<ref>Fonte literal.</ref>','Texto.<ref>Fonte literal.</ref>\n\n{{Referências}}\n\n',['relocatedReferenceList','redundantReferenceLists']);
 for(const [source,expected]of [['{{Reflist}}','{{Referências|nível=0}}'],['{{Reflist|group=nota}}','{{Referências|grupo=nota|nível=0}}']])test('native-headless-renderer-'+sha(source).slice(0,8),source,expected,['rendererHeadingPreserved']);
 const syntaxRules={'syntax-ref-close-boundary':'syntaxReferenceClosers','syntax-empty-named-ref':'syntaxNamedRefReuse','syntax-ref-format-close':'syntaxFormattingClosers'};
 for(const [index,fixture]of syntax.entries())if(syntaxRules[fixture.rule])test('inherited-syntax-'+index,fixture.source,fixture.expected,[syntaxRules[fixture.rule]],{...base,references:false});
 for(const family of ['Citar web','Citar jornal','Citar livro','Citar revista','Citar periódico'])test('native-empty-parts-'+family,'{{'+family+'||título=Fonte literal||url=https://example.invalid/|}}','{{'+family+'|título=Fonte literal|url=https://example.invalid/}}',['v219CitationEmptyParts'],{...base,automaticSourceCompatibility:true});
 for(const [index,fixture]of encyclopedia.positives.entries())test('pinned-native-encyclopedia-'+index,fixture.source,fixture.expected,['v214NSRWCitation']);
 eq(sha(fs.readFileSync(file)),sha(bytes),'The tested runtime remains immutable');
}
report.caseCount=report.cases.length;report.distinctScenarios=new Set(report.cases.map(row=>row.scenarioSha256)).size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
