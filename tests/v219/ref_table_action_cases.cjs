'use strict';
// Earlier handwritten native grammar endpoints are exercised through the
// complete action. Their source and expected strings are not adapted.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),hash=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value,
 oracleFile=path.join(root,'tests/v2130/independent_v213_cases.cjs'),oracles=require(oracleFile);
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={schemaVersion:1,kind:'handwritten-reference-and-table-full-actions',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),oracleSha256:hash(fs.readFileSync(oracleFile)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0},eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);};
// Receipt metadata binds controls to independently supplied fixture endpoints.
// It never reads a calculate result or authorizes a production transformation.
const endpointControlMetadata=(source,options,expected,kind,control=null)=>{
 const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),snapshot=value=>JSON.parse(JSON.stringify(canonical(value))),describe=(s,o,e)=>{const d={sourceSha256:digest(s),optionsSha256:digest(JSON.stringify(canonical(o))),expectedEndpointSha256:digest(e)};return {...d,scenarioSha256:digest(JSON.stringify([d.sourceSha256,d.optionsSha256,d.expectedEndpointSha256]))};},current=describe(source,options,expected),metadata={controlMetadataSchemaVersion:1,requestedOptionsSnapshot:snapshot(options),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:snapshot(Object.fromEntries(Object.entries(options).filter(([,value])=>typeof value!=='boolean'))),declaredEndpoint:current,protectedContext:false,optionGuard:false};
 if(!control){if(source!==expected&&kind==='positive'){metadata.intentSha256=current.scenarioSha256;metadata.intentPairSha256=current.scenarioSha256;}return metadata;}
 const p=control.positive;if(p.source===p.expected)return metadata;const positive=describe(p.source,p.options,p.expected),before=snapshot(p.options),after=snapshot(options),keys=[...new Set([...Object.keys(before),...Object.keys(after)])].sort(),changed=keys.filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));
 assert.equal(expected,source,'A declared negative retains the complete literal input');
 const relation={kind:control.kind,positive,control:current,positiveOptionsSnapshot:before};
 if(control.kind==='option-off'){assert.equal(source,p.source,'An option control uses exactly the positive source');assert.equal(changed.length,1,'Exactly one complete option changes');assert.equal(before[changed[0]],true,'The positive option is enabled');assert.equal(after[changed[0]],false,'The negative option is explicitly disabled');relation.option=changed[0];metadata.optionGuard=true;}
 else if(control.kind==='protected'){assert.deepEqual(after,before,'Protected controls retain every complete positive option');assert.equal(source,control.prefix+p.source+control.suffix,'Protected bytes enclose exactly the independent positive source');relation.prefix=control.prefix;relation.suffix=control.suffix;metadata.protectedContext=true;}
 else if(control.kind==='scope-off'){assert.equal(source,p.source,'A scope control uses the exact positive input');assert(changed.length,'A scope control has an explicit context difference');relation.changedOptions=changed;metadata.optionGuard=true;}
 else throw new Error('Unknown declared fixture control relation');
 metadata.sourceBoundControl=relation;metadata.intentSha256=positive.scenarioSha256;metadata.intentPairSha256=positive.scenarioSha256;return metadata;
};
const protectedEndpointControl=(source,positive)=>{const at=source.indexOf(positive.source);assert(at>=0&&source.indexOf(positive.source,at+positive.source.length)===-1,'One literal fixture payload defines the protected relation');return {kind:'protected',positive,prefix:source.slice(0,at),suffix:source.slice(at+positive.source.length)};};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',syntaxRepairs:true,structuralRepairs:true,markup:true,citations:true,citationRepairs:true,references:true,automaticReferenceRepairs:true,referenceGraphRepairs:true,tableChecks:true,automaticTableRepairs:true,tableSyntaxRepairs:true};report.bundles.push({bundle,sha256:hash(bytes),version:api.version,bytes:bytes.length});
 const test=(id,source,expected,options=base,kind='positive',control=null)=>{
  const row={id,bundle,kind,scenarioSha256:hash(JSON.stringify(canonical({source,options,expected,intent:id}))),sourceSha256:hash(source),optionsSha256:hash(JSON.stringify(canonical(options))),expectedEndpointSha256:hash(expected),intentSha256:hash(id),status:'passed',evidenceKind:'actual-full-action-exact-endpoint',...endpointControlMetadata(source,options,expected,kind,control)};
  try{const actual=api.calculate({kind:'adjust',source,options});eq(actual.text,expected,'Actual action matches the unchanged independent native grammar endpoint');eq(api.calculate({kind:'adjust',source:actual.text,options}).text,actual.text,'All eligible work finishes in one action');eq(api.preservationAudit(source,actual.text,options),[],'Production preservation is active');eq(api.safeComposition(source,actual.text,options),'','The exact source transaction composes');eq(actual.preservation||[],[],'No pipeline rollback or content loss is hidden');row.actualEndpointSha256=hash(actual.text);row.appliedIds=(actual.changes||[]).filter(change=>change.count>0).map(change=>change.id);}catch(error){row.status='failed';report.status='failed';if(report.failures.length<150)report.failures.push({bundle,id,message:error.message});}report.cases.push(row);
 };
 const wrappers=[['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!--'+s+'-->'],['code',s=>'<code>'+s+'</code>'],['fence',s=>'Exemplo de código:\n```wikitext\n'+s+'\n```\nFim.'],['unknown-owner',s=>'{{Modelo fictício|exemplo='+s+'}}']];
 for(const seed of oracles.items.filter(item=>item.positive)){
  test(seed.id,seed.source,seed.expected);
  for(const [kind,wrap]of wrappers){const source=wrap(seed.source);test(seed.id+'-'+kind,source,source,base,'protected',protectedEndpointControl(source,{source:seed.source,expected:seed.expected,options:base}));}
 }
 // These independent literal graph cases cover transactions that a helper
 // plan alone cannot prove reachable from the user-facing action.
 const definitions='Texto.<ref name="a">Fonte literal.</ref> Outra frase.',collector='\n\n{{Referências}}';
 test('consecutive-identical-calls',definitions+'<ref name="a"/><ref name="a"/>'+collector,definitions+'<ref name="a" />'+collector,{...base,automaticIdenticalReferences:true,moveNamedRefs:true});
 const grouped='Texto.<ref group="nota">Nota literal.</ref>\n\n<references group="nota"/>\n<references group="nota"/>';
 test('adjacent-identical-empty-collectors',grouped,grouped.replace('\n<references group="nota"/>\n<references group="nota"/>','\n<references group="nota"/>\n'),{...base,automaticIdenticalReferences:true,moveNamedRefs:true});
 const quote='Texto.<ref>{{Citar web|título=Fonte literal|url=https://example.invalid/a}}</ref> Outra frase.<ref>{{Citar web|url=https://example.invalid/a|título=Fonte literal}}</ref>'+collector;
 test('equivalent-complete-citation-fields',quote,quote.replace('<ref>','<ref name="ref-auto-1">').replace('<ref>{{Citar web|url=https://example.invalid/a|título=Fonte literal}}</ref>','<ref name="ref-auto-1" />'),{...base,automaticIdenticalReferences:true,moveNamedRefs:true});
 const namedQuote=quote.replace('<ref>','<ref name="a">');
 test('existing-name-outside-anonymous-signature-grammar',namedQuote,namedQuote,{...base,automaticIdenticalReferences:true,moveNamedRefs:true},'boundary');
 // A missing-note decision here is an explicitly supplied immediate parse
 // result, not a claim that this local suite queried the live renderer.
 for(const group of ['nota','nt','lower-alpha']){
  const source='Texto.<ref group="'+group+'">Nota literal.</ref>'+collector,expected=source.replace('{{Referências}}',(group==='nota'?'{{Notas}}':'{{Notas|grupo='+group+'}}')+'\n\n{{Referências}}'),options={...base,noteRendererProofSource:source,noteRendererProofs:[{group,missing:true}]};
  test('proved-missing-note-'+group,source,expected,options);
  test('stale-missing-note-'+group,source,source,{...options,noteRendererProofSource:source+' '},'stale-proof');
  test('missing-note-disabled-'+group,source,source,{...options,references:false},'off',{kind:'option-off',positive:{source,expected,options}});
 }
 const layout='column-count:2;column-width:30em;column-gap:2em;max-width:62em;',nativeStyle='Texto.<ref>Fonte literal.</ref>\n\n{{Referências|estilo='+layout+'}}';
 test('obsolete-generated-inline-reference-layout',nativeStyle,nativeStyle.replace('|estilo='+layout,''),{...base,referenceColumns:true});
 test('custom-reference-layout-retained',nativeStyle.replace(layout,'color:red;'),nativeStyle.replace(layout,'color:red;'),{...base,referenceColumns:true},'valid-native');
 eq(hash(fs.readFileSync(file)),hash(bytes),'Actual runtime remained immutable');
}
report.distinctScenarios=new Set(report.cases.map(row=>row.scenarioSha256)).size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
