'use strict';
// Compare the two real bundles with the public native catalog snapshot. This
// checks delivery consistency; native semantic proof is recorded separately.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=v=>crypto.createHash('sha256').update(v).digest('hex'),args=Object.fromEntries(process.argv.slice(2).map(v=>{const[k,...rest]=v.replace(/^--/,'').split('=');return[k,rest.join('=')];})),dist=path.resolve(args.dist||path.join(root,'dist/2.19.0'));
const nativeFile=path.join(dist,'Catalogo_ptwiki_RevisaWiki_v2_19_0.json'),nativeRaw=fs.readFileSync(nativeFile),catalog=JSON.parse(nativeRaw),reviewFile=path.join(__dirname,'catalog_revision_review.json'),reviewRaw=fs.readFileSync(reviewFile),review=JSON.parse(reviewRaw),manifestFile=fs.existsSync(path.join(dist,'MANIFESTO_RUNTIME.json'))?path.join(dist,'MANIFESTO_RUNTIME.json'):path.join(root,'tests/expected_release_v2190.json'),manifestBytes=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestBytes);
const report={schemaVersion:1,kind:'catalogue-delivery-and-reviewed-revision-consistency',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),catalogSha256:sha(nativeRaw),reviewSha256:sha(reviewRaw),manifestSha256:sha(manifestBytes),bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},test=(bundle,id,fn)=>{report.cases++;try{fn();}catch(error){report.status='failed';if(report.failures.length<100)report.failures.push({bundle,id,message:error.message});}};
for(const name of ['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js']){
 const file=path.join(dist,name),bytes=fs.readFileSync(file),api=require(file);report.bundles.push({bundle:name,sha256:sha(bytes),bytes:bytes.length,version:api.version});
 for(const [family,runtime]of [['infoboxes',api.infoboxCatalog],['templates',api.templateCatalog]])for(const[key,profile]of Object.entries(catalog[family]))test(name,family+':'+key,()=>{
  const actual=runtime[key];eq(!!actual,true,'Every declared native profile is delivered');
  for(const field of ['title','oldid','timestamp','source','accepted','patterns','aliases','renames','report','partial','dependencies'])eq(JSON.parse(JSON.stringify(actual[field])),profile[field],'Native profile field agrees with the published current snapshot: '+field);
 });
 test(name,'reviewed-native-code-field',()=>{
  const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Localidade fictícia',autoPreview:false},source='{{Info/Cidade da Rússia|nome=Localidade fictícia|cód_OKATU=12345678}}',expected='{{Info/Cidade da Rússia|nome=Localidade fictícia|cód_OKATO=12345678}}';
  const result=api.calculate({kind:'adjust',source,options:cfg});eq(result.text,expected,'The current spelling keeps the exact original code');eq(result.preservation||[],[],'The current native field repair retains all data');
  for(const value of ['87654321','']){const conflict=source.slice(0,-2)+'|cód_OKATO='+value+'}}';eq(api.calculate({kind:'adjust',source:conflict,options:cfg}).text,conflict,'A competing native code, including explicit blank, cannot be overwritten');}
 });
 test(name,'current-combined-selector',()=>{
  eq(api.templateCatalog['notas e referências'].oldid,73218466,'The current group-selector revision is delivered');eq(api.templateCatalog['notas e referências'].accepted.includes('grupo'),true,'The explicit native group selector is accepted');
  const value=api.v219NativeCollectorGroups('{{Notas e referências|grupo=grupo-literal}}');eq(new Set(value.groups),new Set(['nota','lower-alpha','grupo-literal','nt','']),'Custom group replaces the former fixed group rather than silently adding both');eq(value.bankGroups,[''],'The common reference bank stays in its native default group');
 });
 eq(sha(fs.readFileSync(file)),sha(bytes),'Runtime bytes remain unchanged');
}
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
// Evaluate a fresh standalone data file so runtime unpacking cannot mutate it.
const vm=require('node:vm'),dataFile=path.join(dist,'RevisaWiki_v2_19_0_dados.js'),sandbox={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(dataFile,'utf8'),sandbox);const data=sandbox.module.exports;
test('data','packed-integrity',()=>{eq(sha(canonical(data.packed)),manifest.packedCatalogSha256,'Current packed bytes have their own updated integrity digest');eq(data.version,'2.19.0','Data schema version matches the real runtime');eq(review.distinctPins,review.unchangedPins+review.changedPins,'Every observed implementation pin is classified');eq(review.changedPins,review.rows.length,'Every changed implementation has a source delta review');eq(review.unresolvedPins,0,'No failed request is misreported as an unchanged implementation');});
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
