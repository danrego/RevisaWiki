'use strict';
// Explicit table grids determine the expected leaf-header associations.
// Data cells and year blocks are copied literally into independent endpoints.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),hash=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={schemaVersion:1,kind:'table-grid-and-year-section-full-actions',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0},eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);};
function grid(width,tiers,scoped=false,attributes=false,multiline=false){
 const rows=[];
 for(let tier=0;tier<tiers-1;tier++){
  const span=tiers===2?2:2**(tiers-1-tier),groups=width/span;
  rows.push(Array.from({length:groups},(_,i)=>'colspan="'+span+'" | Grupo '+tier+'-'+i).join(' !! '));
 }
 rows.push(Array.from({length:width},(_,i)=>(scoped?'scope="col"'+(attributes?' ':' | '):'')+(attributes?'class="titulo" | ':'')+'Coluna '+(i+1)).join(multiline?'\n! ':' !! '));
 const header=rows.map(row=>'! '+row).join('\n|-\n'),body=Array.from({length:2},(_,r)=>'| '+Array.from({length:width},(_,i)=>'Valor '+r+'-'+i).join(' || ')).join('\n|-\n');
 return '{| class="wikitable"\n'+header+'\n|-\n'+body+'\n|}\n';
}
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
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',syntaxRepairs:true,structuralRepairs:true,markup:true,tableChecks:true,automaticTableRepairs:true,tableSyntaxRepairs:true,tableAccessibility:true};report.bundles.push({bundle,sha256:hash(bytes),version:api.version,bytes:bytes.length});
 const test=(id,source,expected,options=base,kind='positive',control=null)=>{
  const row={id,bundle,kind,scenarioSha256:hash(JSON.stringify(canonical({source,options,expected,intent:id}))),sourceSha256:hash(source),optionsSha256:hash(JSON.stringify(canonical(options))),expectedEndpointSha256:hash(expected),intentSha256:hash(id),status:'passed',evidenceKind:'actual-full-action-exact-endpoint',...endpointControlMetadata(source,options,expected,kind,control)};
  try{const result=api.calculate({kind:'adjust',source,options});eq(result.text,expected,'The whole action matches the explicit grid/year endpoint');eq(api.calculate({kind:'adjust',source:result.text,options}).text,result.text,'The whole action is idempotent');eq(api.preservationAudit(source,result.text,options),[],'All cells, references and order remain under preservation checks');eq(api.safeComposition(source,result.text,options),'','No unrelated table change is admitted');eq(result.preservation||[],[],'No blocked table change is reported as a completed adjustment');row.actualEndpointSha256=hash(result.text);row.appliedIds=(result.changes||[]).filter(change=>change.count>0).map(change=>change.id);}catch(error){row.status='failed';report.status='failed';if(report.failures.length<100)report.failures.push({bundle,id,message:error.message});}report.cases.push(row);
 };
 for(const tiers of [2,3,4])for(const width of (tiers===2?[2,4,8,16,32]:tiers===3?[4,8,16,32]:[8,16,32]))for(const attributes of [false,true])for(const multiline of [false,true])for(const eol of ['\n','\r\n']){
  const source=grid(width,tiers,false,attributes,multiline).replace(/\n/g,eol),expected=grid(width,tiers,true,attributes,multiline).replace(/\n/g,eol),id='leaf-'+[tiers,width,attributes,multiline,eol.length].join('-');
  test(id,source,expected);
  test(id+'-disabled',source,source,{...base,tableAccessibility:false},'off',{kind:'option-off',positive:{source,expected,options:base}});
 }
 const seed=grid(4,3),scoped=grid(4,3,true);
 for(const [kind,wrap]of [['code',s=>'<code>'+s+'</code>'],['comment',s=>'<!--'+s+'-->'],['fence',s=>'Exemplo:\n```wikitext\n'+s+'\n```'],['unknown',s=>'{{Modelo fictício|exemplo='+s+'}}']]){const source=wrap(seed);test('protected-grid-'+kind,source,source,base,'protected',protectedEndpointControl(source,{source:seed,expected:scoped,options:base}));}
 for(const [id,source]of [['competing-leaf-scope',seed.replace('! Coluna 1','! scope="row" | Coluna 1')],['dynamic-group',seed.replace('colspan="4"','colspan="{{Valor}}"')],['custom-header-ids',seed.replace('! Coluna 1','! id="coluna1" | Coluna 1')],['existing-rowspan',seed.replace('| Valor 0-0','| rowspan="2" | Valor 0-0')],['native-already-scoped',scoped]])test('boundary-'+id,source,source,base,'boundary');
 const open='{| class="wikitable"\n',header='! Nome !! Valor\n',row1='|-\n| Alfa || 1\n',row2='|-\n| Beta || 2\n',close='|}\n',year='|-\n| colspan="2" |\n=== 2001 ===\n',year2='|-\n| colspan="2" |\n=== 2002 ===\n',source=open+header+year+row1+year2+row2+close,expected='=== 2001 ===\n'+open+header+row1+close+'\n=== 2002 ===\n'+open+header+row2+close;
 test('two-literal-year-sections',source,expected,{...base,tableAccessibility:false,headings:true});
 test('year-sections-option-off',source,source,{...base,tableAccessibility:false,headings:false},'off',{kind:'option-off',positive:{source,expected,options:{...base,tableAccessibility:false,headings:true}}});
 for(const [id,before,after]of [
  ['missing-attribute-cell-bar','| colspan="2" Cabeçalho','| colspan="2" | Cabeçalho'],
  ['paired-typographic-span-quotes','| colspan=“2” | Cabeçalho','| colspan="2" | Cabeçalho']
 ]){const wrap=cell=>'{| class="wikitable"\n'+cell+'\n|-\n| Alfa || Beta\n|}\n';test(id,wrap(before),wrap(after),{...base,tableAccessibility:false});}
 eq(hash(fs.readFileSync(file)),hash(bytes),'Runtime stayed immutable');
}
report.distinctScenarios=new Set(report.cases.map(row=>row.scenarioSha256)).size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
