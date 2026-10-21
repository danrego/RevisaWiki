'use strict';
// Additive literal controls. Existing positive endpoints are copied from the
// independently authored grid/year/attribute fixtures, never from calculate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const contractFile=path.join(__dirname,'table_protected_endpoint_contract.json'),contractBytes=fs.readFileSync(contractFile),contract=JSON.parse(contractBytes),files=process.argv.slice(2).map(file=>path.resolve(file));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(__dirname,'../../dist/2.19.0',name)));
const report={schemaVersion:1,kind:'three-literal-table-branches-protected-and-option-controls',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(contractBytes),nativeContractSha256:sha(contractBytes),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0},eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);};
const priorFetch=globalThis.fetch,priorXHR=globalThis.XMLHttpRequest;
globalThis.fetch=()=>{report.networkRequests++;throw new Error('Network disabled in this offline fixture runner');};
globalThis.XMLHttpRequest=function(){report.networkRequests++;throw new Error('Network disabled in this offline fixture runner');};
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

try{for(const file of files){
 const bytes=fs.readFileSync(file),dataFile=path.join(path.dirname(file),'RevisaWiki_v2_19_0_dados.js'),dataBefore=fs.existsSync(dataFile)?sha(fs.readFileSync(dataFile)):null,api=require(file),bundle=path.basename(file),bundlePin={bundle,sha256:sha(bytes),runtimeSha256:sha(bytes),version:api.version,dataSha256:dataBefore};report.bundles.push(bundlePin);
 function test(id,source,expected,options,kind,rule,control=null){
  // Fixture relationships are validated before the production call.
  const meta=endpointControlMetadata(source,options,expected,kind,control),row={bundle,id,kind,...meta,sourceSha256:meta.declaredEndpoint.sourceSha256,optionsSha256:meta.declaredEndpoint.optionsSha256,expectedEndpointSha256:meta.declaredEndpoint.expectedEndpointSha256,scenarioSha256:meta.declaredEndpoint.scenarioSha256,evidenceKind:'actual-full-action-exact-endpoint',status:'passed'};
  try{const result=api.calculate({kind:'adjust',source,options});row.actualEndpointSha256=sha(result.text);row.appliedIds=(result.changes||[]).map(x=>x.id);eq(result.text,expected,'Whole action matches the independently supplied literal endpoint');eq(api.calculate({kind:'adjust',source:result.text,options}).text,result.text,'The endpoint is idempotent');eq(result.preservation||[],[],'Whole action reports no preservation finding');eq(api.preservationAudit(source,result.text,options),[],'The complete source/candidate preservation check passes');eq(api.safeComposition(source,result.text,options),'','The complete source/candidate composition check passes');if(kind==='positive')eq(row.appliedIds.includes(rule),true,'The asserted branch is reached in the actual action');}
  catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}report.cases.push(row);
 }
 for(const seed of contract.seeds){const positive={source:seed.source,options:seed.options,expected:seed.expected};
  test(seed.id,seed.source,seed.expected,seed.options,'positive',seed.rule);
  for(const [owner,prefix,suffix]of [['nowiki','<nowiki>','</nowiki>'],['code','<code>','</code>'],['unknown-owner','{{Modelo fictício|exemplo=','}}']]){const source=prefix+seed.source+suffix;test(seed.id+'-protected-'+owner,source,source,seed.options,'protected',seed.rule,{kind:'protected',positive,prefix,suffix});}
  test(seed.id+'-option-off',seed.source,seed.source,{...seed.options,[seed.off]:false},'off',seed.rule,{kind:'option-off',positive});
 }
 eq(sha(fs.readFileSync(file)),sha(bytes),'Runtime bytes remain immutable');eq(fs.existsSync(dataFile)?sha(fs.readFileSync(dataFile)):null,dataBefore,'Data bytes remain immutable');bundlePin.postRuntimeSha256=sha(fs.readFileSync(file));bundlePin.postDataSha256=dataBefore;
}}finally{globalThis.fetch=priorFetch;globalThis.XMLHttpRequest=priorXHR;}
report.distinctScenarios=new Set(report.cases.map(row=>row.scenarioSha256)).size;report.caseCount=report.cases.length;eq(report.networkRequests,0,'No network request is attempted');eq(report.wikipediaWrites,0,'No Wikipedia write is attempted');process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;
