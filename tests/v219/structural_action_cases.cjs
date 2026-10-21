'use strict';
// Independently specified complete-action endpoints. No expected text is
// obtained from a repair helper or from the current transformation result.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(f=>path.resolve(f)),sha=v=>crypto.createHash('sha256').update(v).digest('hex'),canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.join(root,'dist/2.19.0',n)));
const seeds=[],add=(id,source,expected,gates,extra={},reason=null)=>seeds.push({id,source,expected,gates,extra,reason}),
 table=row=>'{| class="wikitable"\n! scope="col" | Primeiro !! scope="col" | Segundo\n|-\n'+row+'\n| Outro valor\n|-\n| Terceiro valor\n|}\n',
 simple=row=>'{| class="wikitable sortable"\n! scope="col" | Primeiro !! scope="col" | Segundo\n|-\n'+row+'\n|-\n| Terceiro || Quarto\n|}\n',
 ref=body=>'Texto.'+body+'\n\n{{Referências}}';
for(const [id,before,after]of [
 ['missing-double-quote','| rowspan="2 | Primeiro valor','| rowspan="2" | Primeiro valor'],
 ['missing-single-quote',"| rowspan='2 | Primeiro valor","| rowspan='2' | Primeiro valor"],
 ['extra-double-quote','| rowspan="2"" | Primeiro valor','| rowspan="2" | Primeiro valor'],
 ['extra-single-quote',"| rowspan='2'' | Primeiro valor","| rowspan='2' | Primeiro valor"],
 ['span-key-typo','| rowpsan="2" | Primeiro valor','| rowspan="2" | Primeiro valor'],
 
 ['span-equals-missing','| rowspan"2" | Primeiro valor','| rowspan="2" | Primeiro valor'],
 ['span-typographic-quotes','| rowspan=“2” | Primeiro valor','| rowspan="2" | Primeiro valor'],
 ['span-opposite-quotes',"| rowspan='2\" | Primeiro valor","| rowspan='2' | Primeiro valor"],
 
 ['identical-rowspan','| rowspan="2" rowspan="2" | Primeiro valor','| rowspan="2" | Primeiro valor']
])add('table-'+id,table(before),table(after),['automaticTableRepairs','tableChecks','syntaxRepairs','structuralRepairs','markup']);
for(const [id,before,after]of [
 ['identical-cell-class','| class="numero" class="numero" | Primeiro || Segundo','| class="numero" | Primeiro || Segundo'],
 ['identical-cell-style','| style="text-align:right" style="text-align:right" | Primeiro || Segundo','| style="text-align:right" | Primeiro || Segundo'],
 ['sort-value-key','| data-sort-vaule="2" | Primeiro || Segundo','| data-sort-value="2" | Primeiro || Segundo'],
 ['identical-sort-value','| data-sort-value="2" data-sort-value="2" | Primeiro || Segundo','| data-sort-value="2" | Primeiro || Segundo'],
 ['mixed-table-closer','| Primeiro || Segundo\n|-\n| Terceiro || Quarto','| Primeiro || Segundo\n|-\n| Terceiro || Quarto']
]){if(id==='mixed-table-closer'){const good=simple('| Primeiro || Segundo');add('table-'+id,good.replace('|}\n','</table>\n'),good,['automaticTableRepairs','tableChecks','syntaxRepairs','structuralRepairs','markup']);}else add('table-'+id,simple(before),simple(after),['automaticTableRepairs','tableChecks','syntaxRepairs','structuralRepairs','markup']);}
add('table-empty-row-marker',simple('| Primeiro || Segundo').replace('|-\n| Terceiro','|-\n|-\n| Terceiro'),simple('| Primeiro || Segundo'),['automaticTableRepairs','tableChecks','syntaxRepairs','structuralRepairs','markup']);
for(const [id,before,after]of [
 ['empty-ref','<ref></ref>',''],
 ['empty-ref-spaces','<ref> \t </ref>',''],
 ['extra-ref-close','<ref>Fonte literal.</ref></ref>','<ref>Fonte literal.</ref>'],
 ['ref-closing-slash','<ref>Fonte literal.</ref/>','<ref>Fonte literal.</ref>'],
 ['ref-tag-spacing','<refname="origem">Fonte literal.</ref>','<ref name="origem">Fonte literal.</ref>'],
 ['ref-attribute-duplicate','<ref name="origem" name="origem">Fonte literal.</ref>','<ref name="origem">Fonte literal.</ref>'],
 ['ref-attribute-mixed','<ref name="origem">Fonte literal.</ref> Outra frase.<ref name="origem">Fonte literal.</ref>','<ref name="origem">Fonte literal.</ref> Outra frase.<ref name="origem" />'],
 ['reference-body-reuse','<ref name="origem">Fonte literal.</ref> Outra frase.<ref>Fonte literal.</ref>','<ref name="origem">Fonte literal.</ref> Outra frase.<ref name="origem" />']
])add(id,ref(before),ref(after),['references']);
for(const [id,source]of [['unproved-double-equals',table('| rowspan=="2" | Primeiro valor')],['unproved-reversed-curly',table('| rowspan=”2“ | Primeiro valor')],['unproved-bracket-table-closer',simple('| Primeiro || Segundo').replace('|}\n',']]\n')],['ambiguous-opening-selfclose',ref('<ref>Fonte literal.<ref/>')],['unsupported-spaced-tag',ref('< ref >Fonte literal.< / ref >')]])add(id,source,source,[],{},'Outside the reviewed finite native repair grammar; no inferred intent.');
const report={schemaVersion:1,kind:'complete-structural-action-endpoints',runnerSha256:sha(fs.readFileSync(__filename)),status:'passed',bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);};
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
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',markup:true,syntaxRepairs:true,structuralRepairs:true,tableChecks:true,automaticTableRepairs:true,tableSyntaxRepairs:true,references:true,automaticReferenceRepairs:true,referenceGraphRepairs:true,automaticIdenticalReferences:true,moveNamedRefs:true};
 report.bundles.push({bundle,sha256:sha(bytes),version:api.version,bytes:bytes.length});
 const run=(seed,id,source,expected,options,kind)=>{
  const positive={source:seed.source,options:{...base,...seed.extra},expected:seed.expected},control=kind==='off'?{kind:'option-off',positive}:kind==='protected'?protectedEndpointControl(source,positive):null;
  const scenarioSha256=sha(JSON.stringify(canonical({source,expected,options,kind:'adjust'}))),row={id,bundle,scenarioSha256,sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(canonical(options))),intentSha256:sha(seed.id),kind,expectedRepair:source!==expected,status:'passed',gates:seed.gates,boundary:seed.reason,...endpointControlMetadata(source,options,expected,kind,control)};report.cases.push(row);
  try{const r=api.calculate({kind:'adjust',source,options});eq(r.text,expected,'Exact independently specified whole-action endpoint');eq(api.calculate({kind:'adjust',source:r.text,options}).text,r.text,'The first action completes all eligible work');eq(r.preservation||[],[],'No visible or relational content loss');eq(api.preservationAudit(source,r.text,options),[],'Production preservation remains active');eq(api.safeComposition(source,r.text,options),'','Complete atomic source transaction');row.actualEndpointSha256=sha(r.text);row.appliedIds=(r.changes||[]).filter(c=>c.count>0).map(c=>c.id);}catch(e){row.status='failed';report.status='failed';if(report.failures.length<120)report.failures.push({bundle,id,message:e.message});}
 };
 for(const seed of seeds){const options={...base,...seed.extra};run(seed,seed.id+'-positive',seed.source,seed.expected,options,seed.source===seed.expected?'boundary':'positive');
  for(const gate of seed.gates)run(seed,seed.id+'-off-'+gate,seed.source,seed.source,{...options,[gate]:false},'off');
  for(const [kind,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!--'+s+'-->'],['code',s=>'<code>'+s+'</code>'],['fence',s=>'```wikitext\n'+s+'\n```'],['template',s=>'{{Modelo fictício|exemplo='+s+'}}']]){const s=wrap(seed.source);run(seed,seed.id+'-protected-'+kind,s,s,options,'protected');}
 }
 eq(sha(fs.readFileSync(file)),sha(bytes),'Actual runtime remains immutable');
}
report.distinctScenarios=new Set(report.cases.map(r=>r.scenarioSha256)).size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
