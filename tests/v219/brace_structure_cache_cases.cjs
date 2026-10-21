'use strict';
// Differential reader checks are not automatic-repair semantic witnesses.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
function readerSourceIdentity(source){
 const tree=parser.parse(source,{sourceType:'script',tokens:true}),tokens=tree.tokens.map(token=>source.slice(token.start,token.end)),comments=tree.comments.map(comment=>[comment.type,comment.value]);
 return {lines:source.split('\n').map(line=>line.replace(/^[ \t]+/,'')),tokens,comments};
}
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const baselineFile=path.join(root,'dist/2.18.0/RevisaWiki_v2_18_0_completo.js'),baselineBytes=fs.readFileSync(baselineFile),baselineManifest=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release_v2180.json'))),baseline=require(baselineFile);
assert.equal(sha(baselineBytes),baselineManifest.files[path.basename(baselineFile)].sha256);
const report={schemaVersion:1,kind:'immutable-exact-source-brace-reader-cache',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),baselineRuntimeSha256:sha(baselineBytes),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0,helperInjection:false,limits:['Reader equivalence and cache isolation are not proof of a successful automatic repair.']};
const tokens=['Texto literal','{{Modelo|a=b}}','{{{nome|valor}}}','{{{{{modelo|}}}|a=b}}','{{Modelo|[[Destino|rótulo]]}}','<!-- {{literal}} -->','<nowiki>{{literal}}</nowiki>','<math>{x}</math>','[[Destino|{{Modelo}}]]','{{Modelo','{{{valor','[[Aberta','<nowiki>{{','<span title="{{literal}}">Texto</span>','}}}{{','[[]]','{{A|{{B|x}}}}','{{A|x=<ref>{{Fonte}}</ref>}}'];
const sources=new Set(['',...tokens,'\u0000{{Modelo|x=\ud800}}\udfff','😀{{Modelo|x=Ω漢字}}\r\n']);
for(let a=0;a<tokens.length;a++)for(let b=0;b<tokens.length;b++)for(const separator of ['', '\n','\r\n'])sources.add(tokens[a]+separator+tokens[b]);
let random=0x219501;
const next=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random;};
for(let count=0;count<3000;count++)sources.add(Array.from({length:1+next()%8},()=>tokens[next()%tokens.length]).join(next()%2?'\n':' '));
for(const length of [8191,8192,8193,65535,65536])sources.add('x'.repeat(length)+'{{Modelo|a={{Outro}}}}');
sources.add('{{'.repeat(1000)+'literal'+'}}'.repeat(1000));
sources.add('x'.repeat(4194305)+'{{Modelo}}');
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
 report.bundles.push({bundle,sha256:sha(bytes),version:api.version});
 eq(readerSourceIdentity(api.v219LegacyBraceStructure.toString().replace('v219LegacyBraceStructure','v215BraceStructure')),readerSourceIdentity(baseline.v215BraceStructure.toString()),'The baseline reader keeps every executable token, literal and comment; only generated line indentation may differ');
 function run(id,fn){const row={id,bundle,status:'passed',evidenceKind:'reader-differential'};report.cases.push(row);try{fn();}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}}
 for(const source of sources)run('source-'+sha(source),()=>{
  const expected=baseline.v215BraceStructure(source),first=api.v215BraceStructure(source),second=api.v215BraceStructure(source);
  eq(first,expected,'Cold read preserves all baseline fields, order and UTF-16 offsets');eq(second,expected,'Warm read equals the independent baseline reader');
  eq(first===second,false,'Returned containers do not alias');
  for(const key of ['nodes','unclosed','unclosedLinks','opaque']){eq(Object.isFrozen(first[key]),false,'The caller receives its own mutable list');if(first[key][0]){eq(Object.isFrozen(first[key][0]),false,'Rows remain mutable for the caller');first[key][0].start=-1000;}first[key].push({start:-2000});}
  delete first.opaque;
  eq(api.v215BraceStructure(source),expected,'Caller mutation cannot alter a later read of the exact source');
  eq(api.v215BraceStructure(source+' '),baseline.v215BraceStructure(source+' '),'A source change gets its own offsets and unfinished-state result');
 });
 run('bounded-eviction',()=>{
  for(let index=0;index<1400;index++)api.v215BraceStructure('{{Modelo|n='+index+'}}');
  for(let index=0;index<8;index++)api.v215BraceStructure('Texto '+index+'\n'+'x'.repeat(90000)+'{{Modelo}}');
  for(const value of Object.values(api.v219BraceStructureCacheStatus())){eq(value.entries<=value.maximumEntries,true,'Every entry-count limit is retained');eq(value.bytes<=value.maximumBytes,true,'Every accounted-memory limit is retained');}
  const source='{{Modelo|a={{Outro}}}}';eq(api.v215BraceStructure(source),baseline.v215BraceStructure(source),'Eviction changes neither source grammar nor the endpoint');
 });
 eq(sha(fs.readFileSync(file)),sha(bytes),'Actual runtime remains immutable');
}
report.distinctReaderInputs=sources.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
