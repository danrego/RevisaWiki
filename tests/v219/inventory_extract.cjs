'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.argv[2],runtime=process.argv[3],output=process.argv[4];
let babel;
try { const parser=require('@babel/parser');babel={babelParse:source=>parser.parse(source,{sourceType:'unambiguous',allowReturnOutsideFunction:true})}; }
catch (_) { const base=path.dirname(require.resolve('playwright/package.json'));babel=require(path.join(base,'lib/transform/babelBundle.js')); }

const source=fs.readFileSync(path.join(root,runtime),'utf8'),ast=babel.babelParse(source,'runtime.js',false),api=require(path.join(root,runtime));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const functions=[],stages=[],labels=new Map(),options=new Map(Object.keys(api.defaults).map(key=>[key,[]])),literalSites=[],finiteTables=[],tableUses=[];
const nameOf=node=>node?.type==='Identifier'?node.name:['StringLiteral','NumericLiteral'].includes(node?.type)?String(node.value):null;
const packedBindings=new Map([['V2151_LEAD_TRANSFER_CONTRACTS',['support219','leadTransferContracts']],['V214_DRUG_FIELDS',['support219','drugFieldContracts']],['V28_DATE_FIELDS',['support219','biographyDateFields']],['CS1_KEYS',['support219','cs1Keys']],['AUTHORITY_PROPERTIES',['support219','authorityProperties']],['AUTHORITY_ARGUMENTS',['support219','authorityArguments']],['V282_HISTORICAL_CITATIONS',['support219','historicalCitations']],['V219_CITATION_UNPROVED_KEYS',['support219','citationUnprovedKeys']],['V219_CITATION_UNPROVED_KEY_SOURCES',['support219','citationUnprovedSources']],['V219_CITATION_UNPROVED_CROSS_ROLES',['support219','citationCrossRoles']],['V219_CITATION_NUMBERED_TARGET_CONTRACTS',['support219','citationNumberedTargets']],['V219_CITATION_CORRECTED_URL_FIELDS',['support219','citationCorrectedURLFields']],['v219BankContractData',['support219','foreignReferenceBankContracts']],['V219_MEDIA_CONTEXT',['media219']],['V219_NATIVE_CS1_ALIAS_ROLES',['cs1roles219']],['V219_NATIVE_MAGIC_WORDS',['magicwords219']],['V219_NATIVE_IMAGE_OPTIONS',['support219','nativeImageOptions']],['V219_NATIVE_TIMED_MEDIA_OPTIONS',['support219','nativeTimedMediaOptions']],['V219_FOREIGN_IDENTITIES',['support219','foreignIdentities']],['V219_ADDITIONAL_NATIVE_CITATION_REDIRECTS',['support219','additionalCitationRedirects']],['V219_CITATION_LANGUAGE_LINKS',['support219','citationLanguageLinks']],['V219_NATIVE_AGE_FIELDS',['support219','nativeAgeFields']],['V219_NATIVE_VARIABLE_CALLS',['support219','nativeVariableCalls']],['V219_NATIVE_COLON_CALLS',['support219','nativeColonCalls']],['V219_NATIVE_HASH_CALLS',['support219','nativeHashCalls']],['V219_NUMBERED_CITATION_ROLES',['support219','numberedCitationRoles']],['V219_NATIVE_LANGUAGE_NAMES',['support219','nativeLanguageNames']],['V219_FOREIGN_LANGUAGE_NAMES',['support219','foreignLanguageNames']],['OCCUPATION_PORTALS',['support219','occupationPortals']],['COMMON_OCCUPATIONS',['support219','commonOccupations']],['MAGIC_WORDS',['support219','legacyMagicWords']],['V261_TALK_REGISTERED_PROJECTS',['support219','talkRegisteredProjects']]]);
const orderedTableValues=new Map();
// Only two reviewed ordered-pair constructors gain this inventory read path.
// Delivered program code is never evaluated by this new DATA reader.
function orderedPackedTable(node,owner){
 const approved={GROUP_LABELS:'groupLabels',PORTAL_IDENTITY_ALIASES:'portalIdentityAliases'},key=approved[node.id?.name];
 if(!key)return null;
 let value=node.init,own=false;
 if(node.id.name==='PORTAL_IDENTITY_ALIASES'&&value?.type==='CallExpression'&&value.callee?.type==='Identifier'&&value.callee.name==='ownDictionary'&&value.arguments.length===1){own=true;value=value.arguments[0];}
 // Original full/old-core literal forms continue through the unchanged parser.
 if(value?.type==='ObjectExpression')return null;
 if(own!==(node.id.name==='PORTAL_IDENTITY_ALIASES')||value?.type!=='CallExpression'||value.arguments.length!==1||value.callee?.type!=='MemberExpression'||value.callee.computed||value.callee.object?.type!=='Identifier'||value.callee.object.name!=='Object'||value.callee.property?.name!=='fromEntries'||JSON.stringify(packedReference(value.arguments[0]))!==JSON.stringify(['support219',key]))throw Error('Unproved ordered packed table constructor: '+node.id.name);
 const runtimeFile=path.join(root,runtime),dataFile=path.join(path.dirname(runtimeFile),path.basename(runtime).replace(/(?:_completo)?\.js$/,'_dados.js')),manifestFile=path.join(root,'tests/expected_release_v2190.json'),manifest=JSON.parse(fs.readFileSync(manifestFile)),dataRaw=fs.readFileSync(dataFile),runtimeRaw=fs.readFileSync(runtimeFile);
 const bound=(file,raw)=>{const record=manifest.files?.[path.basename(file)];if(!record||record.bytes!==raw.length||record.sha256!==sha(raw))throw Error('Ordered table input is not release-manifest bound: '+file);};
 if(manifest.version!=='2.19.0')throw Error('Unproved ordered table release');bound(runtimeFile,runtimeRaw);bound(dataFile,dataRaw);
 const prefix='/* RevisaWiki 2.19.0, dados. CC BY-SA 4.0. */\n(function(root){const data=',suffix=';if(typeof module === "object" && module.exports) module.exports=data;else root.RevisaWikiDataV2=data;})(typeof globalThis !== "undefined" ? globalThis : this);\n',text=dataRaw.toString('utf8');
 if(!text.startsWith(prefix)||!text.endsWith(suffix))throw Error('Unproved ordered DATA JSON envelope');
 const data=JSON.parse(text.slice(prefix.length,-suffix.length)),pairs=data.packed?.support219?.[key],seen=new Set();
 if(data.version!=='2.19.0'||data.schema!==1||!Array.isArray(pairs)||pairs.some(pair=>!Array.isArray(pair)||pair.length!==2||pair.some(v=>typeof v!=='string')||pair[0]==='__proto__'||seen.has(pair[0])||!seen.add(pair[0])))throw Error('Invalid ordered flat-string pairs: '+key);
 orderedTableValues.set(node.start,pairs);
 return{name:node.id.name,kind:(own?'own-dictionary/':'')+'ordered-entry-pairs-to-object/external-packed-data',container:'ObjectExpression',topLevelEntries:pairs.length,entryKeys:pairs.map(pair=>pair[0]),start:node.start,end:node.end,line:node.loc.start.line,sha256:sha(source.slice(node.start,node.end)),owner:owner?.id||null,externalData:{filename:path.basename(dataFile),sha256:sha(dataRaw),valueSha256:sha(JSON.stringify(pairs)),key:'packed.support219.'+key,orderedPairs:true,releaseManifestSha256:sha(fs.readFileSync(manifestFile))},executionClaim:false};
}

// Only these three independently approved inert literals gain a new inventory path.
// The parsed DATA object's prototype is not a measurement of the program's constructor.
function reviewedInertPackedTable(node,owner){
 const approved={"COUNTRY_PORTALS":{"key":"countryPortals","entries":46,"kind":"own-dictionary","valueSha256":"da768c1f37996e715d67899e2622e719b0edd27bc0a39d3e600e029d346a17d8"},"NATIONALITY_PORTALS":{"key":"nationalityPortals","entries":90,"kind":"own-dictionary","valueSha256":"216414a017941448efe6dfaa71c4b7c6ce9971bb83002e2c3e9413549d70db7b"},"OBSOLETE_CATALOG":{"key":"obsoleteCatalog","entries":33,"kind":"own-dictionary/fresh-json-graph-copy","valueSha256":"0603c48d721a3dc9bdca0aaf8d0313fad1e409282b68e9c99b6ad7a4a445151a"}},contract=approved[node.id?.name];
 if(!contract)return null;
 let value=node.init;
 if(value?.type!=='CallExpression'||value.callee?.type!=='Identifier'||value.callee.name!=='ownDictionary'||value.arguments.length!==1)throw Error('Unproved reviewed inert constructor: '+node.id.name);
 value=value.arguments[0];
 // Full/old-core literal forms retain the original generic parser and output schema.
 if(value?.type==='ObjectExpression')return null;
 if(node.id.name==='OBSOLETE_CATALOG'){
  const isJSON=(n,name)=>n?.type==='CallExpression'&&n.arguments.length===1&&n.callee?.type==='MemberExpression'&&!n.callee.computed&&n.callee.object?.type==='Identifier'&&n.callee.object.name==='JSON'&&n.callee.property?.type==='Identifier'&&n.callee.property.name===name;
  if(!isJSON(value,'parse')||!isJSON(value.arguments[0],'stringify'))throw Error('Unproved reviewed inert graph copy: '+node.id.name);
  value=value.arguments[0].arguments[0];
 }
 if(JSON.stringify(packedReference(value))!==JSON.stringify(['support219',contract.key]))throw Error('Unproved reviewed inert field: '+node.id.name);
 const runtimeFile=path.join(root,runtime),dataFile=path.join(path.dirname(runtimeFile),path.basename(runtime).replace(/(?:_completo)?\.js$/,'_dados.js')),manifestFile=path.join(root,'tests/expected_release_v2190.json'),manifestRaw=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestRaw),dataRaw=fs.readFileSync(dataFile),runtimeRaw=fs.readFileSync(runtimeFile);
 const bound=(file,raw)=>{const record=manifest.files?.[path.basename(file)];if(!record||record.bytes!==raw.length||record.sha256!==sha(raw))throw Error('Reviewed inert input is not release-manifest bound: '+file);};
 if(manifest.version!=='2.19.0')throw Error('Unproved reviewed inert release');bound(runtimeFile,runtimeRaw);bound(dataFile,dataRaw);
 const prefix='/* RevisaWiki 2.19.0, dados. CC BY-SA 4.0. */\n(function(root){const data=',suffix=';if(typeof module === "object" && module.exports) module.exports=data;else root.RevisaWikiDataV2=data;})(typeof globalThis !== "undefined" ? globalThis : this);\n',text=dataRaw.toString('utf8');
 if(!text.startsWith(prefix)||!text.endsWith(suffix))throw Error('Unproved reviewed inert DATA JSON envelope');
 const data=JSON.parse(text.slice(prefix.length,-suffix.length)),packed=data.packed?.support219?.[contract.key];
 if(data.version!=='2.19.0'||data.schema!==1||!packed||Array.isArray(packed)||Object.getPrototypeOf(packed)!==Object.prototype||Object.keys(packed).length!==contract.entries||sha(JSON.stringify(packed))!==contract.valueSha256)throw Error('Reviewed inert literal contract differs: '+node.id.name);
 if(node.id.name!=='OBSOLETE_CATALOG'&&Object.entries(packed).some(([key,value])=>key==='__proto__'||typeof value!=='string'))throw Error('Reviewed inert dictionary is not flat-string: '+node.id.name);
 return{name:node.id.name,kind:contract.kind+'/external-packed-data',container:'ObjectExpression',topLevelEntries:Object.keys(packed).length,entryKeys:Object.keys(packed),start:node.start,end:node.end,line:node.loc.start.line,sha256:sha(source.slice(node.start,node.end)),owner:owner?.id||null,externalData:{filename:path.basename(dataFile),sha256:sha(dataRaw),valueSha256:sha(JSON.stringify(packed)),key:'packed.support219.'+contract.key},executionClaim:false};
}

function packedReference(node){const fields=[];while(node?.type==='MemberExpression'&&!node.computed&&node.property?.type==='Identifier'){fields.unshift(node.property.name);node=node.object;}return node?.type==='Identifier'&&node.name==='root'&&fields[0]==='RevisaWikiDataV2'&&fields[1]==='packed'?fields.slice(2):null;}
function packedBinding(node,name){const expected=packedBindings.get(name),actual=packedReference(node);return expected&&JSON.stringify(actual)===JSON.stringify(expected)?expected:null;}
function walk(node,ancestors=[],parent=null){
 if(!node||typeof node!=='object'||typeof node.type!=='string')return;
 const functionNode=['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression','ObjectMethod','ClassMethod'].includes(node.type);
 let owner=ancestors[ancestors.length-1];
 if(functionNode){
  let name=node.id?.name||nameOf(node.key)||null;
  if(!name&&node.__variableName)name=node.__variableName;
  owner={id:(owner?owner.id+'/':'')+(name||'<anonymous>')+'@'+node.start,name:name||'<anonymous>',start:node.start,end:node.end,line:node.loc.start.line,endLine:node.loc.end.line,options:new Set(),directCalls:new Set(),transformations:new Set(),branches:[],nested:[],parent:owner?.id||null};
  if(ancestors.length)ancestors[ancestors.length-1].nested.push(owner.id);
  functions.push(owner);ancestors=[...ancestors,owner];
 }
 if(node.type==='VariableDeclarator'&&(/^[A-Z][A-Z0-9_]+$/.test(node.id?.name||'')||node.id?.name==='v219BankContractData')){
  const ordered=reviewedInertPackedTable(node,owner)||orderedPackedTable(node,owner);
  if(ordered)finiteTables.push(ordered);else{
  let value=node.init,kind='literal';
  const wrappers=[];
  for(let depth=0;depth<8;depth++){
   if(['V2151_LEAD_TRANSFER_CONTRACTS','V214_DRUG_FIELDS','V28_DATE_FIELDS'].includes(node.id.name)&&value?.type==='CallExpression'&&value.arguments.length===1&&value.callee?.type==='MemberExpression'&&!value.callee.computed&&value.callee.object?.type==='Identifier'&&value.callee.object.name==='JSON'&&value.callee.property?.name==='parse'){
    const inner=value.arguments[0];if(inner?.type!=='CallExpression'||inner.arguments.length!==1||inner.callee?.type!=='MemberExpression'||inner.callee.computed||inner.callee.object?.type!=='Identifier'||inner.callee.object.name!=='JSON'||inner.callee.property?.name!=='stringify'||!packedBinding(inner.arguments[0],node.id.name))throw Error('Unproved inert-table graph copy');
    wrappers.push('fresh-json-graph-copy');value=inner.arguments[0];continue;
   }
   if(value?.type==='CallExpression'&&value.callee?.type==='MemberExpression'&&value.callee.object?.name==='Object'&&value.callee.property?.name==='freeze'){wrappers.push('frozen');value=value.arguments[0];continue;}
   if(value?.type==='CallExpression'&&value.callee?.type==='Identifier'&&value.callee.name==='ownDictionary'&&value.arguments.length===1){wrappers.push('own-dictionary');value=value.arguments[0];continue;}
   if(value?.type==='CallExpression'&&value.callee?.type==='MemberExpression'&&value.callee.object?.name==='Object'&&value.callee.property?.name==='assign'&&value.arguments.length===2&&value.arguments[0]?.type==='CallExpression'&&value.arguments[0].callee?.object?.name==='Object'&&value.arguments[0].callee?.property?.name==='create'&&value.arguments[0].arguments[0]?.type==='NullLiteral'){wrappers.push('null-prototype');value=value.arguments[1];continue;}
   if(value?.type==='CallExpression'&&value.callee?.type==='MemberExpression'&&!value.callee.computed&&value.callee.property?.name==='slice'&&value.arguments.length===0&&packedBinding(value.callee.object,node.id.name)){wrappers.push('source-array-copy');value=value.callee.object;continue;}
   if(node.id.name==='V282_HISTORICAL_CITATIONS'&&value?.type==='CallExpression'&&value.callee?.name==='v282HistoricalFreeze'&&value.arguments.length===1){wrappers.push('historical-deep-freeze');value=value.arguments[0];continue;}
   if(value?.type==='NewExpression'&&['Set','Map'].includes(value.callee?.name)){wrappers.push(value.callee.name);value=value.arguments[0];continue;}
   break;
  }
  if(wrappers.length)kind=wrappers.join('/');
  if(['ObjectExpression','ArrayExpression'].includes(value?.type)){
   const entries=value.type==='ObjectExpression'?value.properties:value.elements,keys=value.type==='ObjectExpression'?entries.map(entry=>nameOf(entry.key)).filter(key=>key!==null):[];
   finiteTables.push({name:node.id.name,kind,container:value.type,topLevelEntries:entries.length,entryKeys:keys,start:node.start,end:node.end,line:node.loc.start.line,sha256:sha(source.slice(node.start,node.end)),owner:owner?.id||null,executionClaim:false});
  }else if(value?.type==='CallExpression'&&value.callee?.type==='MemberExpression'&&!value.callee.computed&&value.callee.property?.name==='split'&&value.callee.object?.type==='StringLiteral'&&value.arguments.length===1&&value.arguments[0]?.type==='StringLiteral'){
   const decoded=value.callee.object.value.split(value.arguments[0].value);
   finiteTables.push({name:node.id.name,kind:kind+'/literal-string-split',container:'ArrayExpression',topLevelEntries:decoded.length,entryKeys:[],start:node.start,end:node.end,line:node.loc.start.line,sha256:sha(source.slice(node.start,node.end)),decodedValueSha256:sha(JSON.stringify(decoded)),owner:owner?.id||null,executionClaim:false});
  }else if(packedBinding(value,node.id.name)){
   const dataFile=path.join(path.dirname(path.join(root,runtime)),path.basename(runtime).replace(/(?:_completo)?\.js$/,'_dados.js')),
    packedPath=packedBinding(value,node.id.name),packedKey=packedPath.join('.'),packed=packedPath.reduce((object,key)=>object?.[key],require(dataFile).packed);
   if(!packed||typeof packed!=='object')throw new Error('The source-bound external packed table is absent: '+packedKey);
   finiteTables.push({name:node.id.name,kind:kind+'/external-packed-data',container:Array.isArray(packed)?'ArrayExpression':'ObjectExpression',topLevelEntries:Object.keys(packed).length,entryKeys:Array.isArray(packed)?[]:Object.keys(packed),start:node.start,end:node.end,line:node.loc.start.line,sha256:sha(source.slice(node.start,node.end)),owner:owner?.id||null,externalData:{filename:path.basename(dataFile),sha256:sha(fs.readFileSync(dataFile)),valueSha256:sha(JSON.stringify(packed)),key:'packed.'+packedKey},executionClaim:false});
  }else if(packedReference(value)&&!(node.id.name==='PACKED_PTWIKI_CATALOG'&&JSON.stringify(packedReference(value))===JSON.stringify(['ptwiki']))){throw new Error('Unassigned external packed constant: '+node.id.name+' -> '+packedReference(value).join('.'));}
  }
 }
 if(owner&&node.type==='Identifier'&&(/^[A-Z][A-Z0-9_]+$/.test(node.name)||node.name==='v219BankContractData')&&!(parent?.type==='VariableDeclarator'&&parent.id===node))tableUses.push({name:node.name,owner:owner.id,start:node.start,line:node.loc.start.line});
 if(owner&&node.type==='MemberExpression'&&['cfg','options','config','DEFAULTS'].includes(node.object?.name)){
  const key=node.computed?nameOf(node.property):node.property?.name;
  if(options.has(key)){owner.options.add(key);options.get(key).push({function:owner.id,line:node.loc.start.line});}
 }
 if(owner&&['IfStatement','ConditionalExpression','LogicalExpression','SwitchCase','ForStatement','ForOfStatement','ForInStatement','WhileStatement','DoWhileStatement','CatchClause'].includes(node.type)){const test=node.test||node.left||null;owner.branches.push({type:node.type,start:node.start,end:node.end,line:node.loc.start.line,test:test?{start:test.start,end:test.end,sha256:sha(source.slice(test.start,test.end))}:null,consequent:node.consequent?{start:node.consequent.start,end:node.consequent.end}:null,alternate:node.alternate?{start:node.alternate.start,end:node.alternate.end}:null,requiresIndependentPositiveAndVetoWitness:true});}
 if(owner&&node.type==='CallExpression'){
  const call=nameOf(node.callee)||((node.callee.type==='MemberExpression'||node.callee.type==='OptionalMemberExpression')?nameOf(node.callee.property):null);
  if(call)owner.directCalls.add(call);
  if(call==='bump'&&node.arguments[0]?.type==='StringLiteral')owner.transformations.add(node.arguments[0].value);
  if(call==='stage'&&node.arguments[0]?.type==='StringLiteral'){const callback=node.arguments[1],slice=callback&&source.slice(callback.start,callback.end)||'';stages.push({name:node.arguments[0].value,owner:owner.id,line:node.loc.start.line,start:node.start,end:node.end,callbackSha256:sha(slice),calls:[...new Set([...slice.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map(match=>match[1]))],binding:'Static callback identifier candidates, not executed reachability.'});}
  if(call==='assign'&&node.arguments[0]?.name==='GROUP_LABELS')for(const p of node.arguments[1]?.properties||[])if(p.type==='ObjectProperty'&&p.value?.type==='StringLiteral')labels.set(nameOf(p.key),p.value.value);
 }
 if(owner&&node.type==='ObjectProperty'&&nameOf(node.key)==='ruleId'&&node.value?.type==='StringLiteral')owner.transformations.add(node.value.value);
 if(owner&&node.type==='StringLiteral')literalSites.push({value:node.value,owner:owner.id,line:node.loc.start.line,start:node.start,end:node.end,role:parent?.type==='CallExpression'?'call-argument':parent?.type==='ObjectProperty'?'object-'+nameOf(parent.key):parent?.type||'literal'});
 if(node.type==='VariableDeclarator'&&node.id?.name==='GROUP_LABELS'){
  if(node.init.type==='ObjectExpression'){for(const p of node.init.properties)if(p.value?.type==='StringLiteral')labels.set(nameOf(p.key),p.value.value);}
  else{const entries=orderedTableValues.get(node.start);if(!entries)throw Error('Unproved packed group labels');for(const [key,value]of entries)labels.set(key,value);}
 }
 for(const [key,value]of Object.entries(node)){
  if(['loc','start','end','extra','comments','leadingComments','trailingComments','innerComments','tokens','__variableName'].includes(key))continue;
  if(value&&typeof value==='object'){
   if(node.type==='VariableDeclarator'&&key==='init'&&value.type&&['FunctionExpression','ArrowFunctionExpression'].includes(value.type))value.__variableName=nameOf(node.id);
   if(Array.isArray(value)){for(const child of value)walk(child,ancestors,node);}else walk(value,ancestors,node);
  }
 }
}
walk(ast);
const registeredIds=new Set([...labels.keys(),...functions.flatMap(f=>[...f.transformations])]);
for(const site of literalSites)if(registeredIds.has(site.value)){const owner=functions.find(f=>f.id===site.owner);owner.transformations.add(site.value);}
const fnNames=new Map();for(const f of functions)if(f.name!=='<anonymous>'){if(!fnNames.has(f.name))fnNames.set(f.name,[]);fnNames.get(f.name).push(f);}
for(const f of functions){f.options=[...f.options].sort();f.directCalls=[...f.directCalls].sort();f.transformations=[...f.transformations].sort();}
const tests=[];function files(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory()&&!['evidence','fixtures','native','browser','anonymous'].includes(entry.name))files(p);else if(entry.isFile()&&/\.(?:cjs|js|py)$/.test(p))tests.push({path:path.relative(root,p),source:fs.readFileSync(p,'utf8')});}}
files(path.join(root,'tests'));
const transformations=[...new Set([...labels.keys(),...functions.flatMap(f=>f.transformations)])].sort().map(id=>{
 const owners=functions.filter(f=>f.transformations.includes(id));
 const named=owners.filter(f=>f.name!=='<anonymous>');
 return {id,label:labels.get(id)||null,functions:owners.map(f=>f.id),sites:literalSites.filter(site=>site.value===id).map(({value,...site})=>site),directOptions:[...new Set(owners.flatMap(f=>f.options))].sort(),existingTestCandidates:tests.filter(t=>new RegExp('(?:[^A-Za-z0-9_]|^)'+id+'(?:[^A-Za-z0-9_]|$)').test(t.source)||named.some(f=>new RegExp('\\b'+f.name+'\\b').test(t.source))).map(t=>({path:t.path,sha256:sha(t.source)})),candidateStatus:'Static token binding only. No executed branch coverage is inferred.'};
});
const result={schemaVersion:1,runtime:{path:runtime,sha256:sha(source),bytes:Buffer.byteLength(source),version:api.version},counts:{options:options.size,functions:functions.length,namedFunctions:functions.filter(f=>f.name!=='<anonymous>').length,transformationIds:transformations.length,stageCalls:stages.length,controlFlowNodes:functions.reduce((sum,f)=>sum+f.branches.length,0),internalFiniteTables:finiteTables.length},internalFiniteTables:finiteTables.map(table=>({...table,uses:tableUses.filter(use=>use.name===table.name),evidenceStatus:'Source inventory only. Enumerated entry-level contracts and active consumer paths still require executed endpoint witnesses.'})),options:[...options].map(([name,uses])=>({name,default:api.defaults[name],uses})),transformations,stages,functions,testCandidateFiles:tests.map(t=>({path:t.path,sha256:sha(t.source)})),apiNames:Object.keys(api).sort(),coverageSemantics:{staticCandidateIsExecution:false,requiresActualRuntimeSha256:true,requiresPositiveNegativeAndGuardPaths:true,requiredEvidence:'Private V8 block coverage joined by exact source hash and actual assertion receipts. Runtime block execution alone is not semantic assertion coverage.'}};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.counts));
