'use strict';
// Offline distribution checks, with optional independently captured GET evidence.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const candidate=require('./candidate.cjs'),root=candidate.root;
const args=process.argv.slice(2);
function option(name){const prefix='--'+name+'=';return args.find(value=>value.startsWith(prefix))?.slice(prefix.length);}
const primaryDirectory=option('primary-dir')||path.join(__dirname,'fixtures/install_diagnosis/primary'),liveDirectory=option('live-dir')||path.join(__dirname,'fixtures/install_diagnosis/live');
const pinnedPrimaryManifest='fcff579d9fc8f670acd0c021a92f022690d1c4a2b686f82cb8605f446108f799',pinnedLiveManifest='95063e310f38b04c6e7cb9e3bb5ff8f604922f03f101155dfc9369e156d391ac';
const report={version:'2.11.0',kind:'installation-size-diagnosis',runnerSha256:candidate.sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0,
 scope:{release:'checked',primary:'requested',live:'requested'}};
function equal(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function ok(value,label){report.checks++;assert(value,label);}
function test(name,run){try{run();report.cases.push({name,status:'passed'});}catch(error){report.failures.push({name,message:candidate.sanitized(error.message,[primaryDirectory||'',liveDirectory||''])});report.cases.push({name,status:'failed'});}}
const {dist}=candidate.verify(),manifest=candidate.manifest;
report.releaseManifestSha256=candidate.sha(fs.readFileSync(path.join(root,'tests/expected_release_v2110.json')));
report.frozenFiles=manifest.files;
const source=name=>fs.readFileSync(path.join(dist,name),'utf8');
const coreName='RevisaWiki_v2_11_0.js',dataName='RevisaWiki_v2_11_0_dados.js',completeName='RevisaWiki_v2_11_0_completo.js';
const core=source(coreName),dataSource=source(dataName);
test('core and data retain the complete independently pinned distribution bytes',()=>{
 for(const name of [coreName,dataName,completeName]){
  const bytes=fs.readFileSync(path.join(dist,name)),proof=manifest.files[name];
  equal(bytes.length,proof.bytes,name+' exact byte count');equal(candidate.sha(bytes),proof.sha256,name+' exact SHA-256');
  ok(bytes.length>102400,name+' exceeds only the syntax-colouring threshold');
  new vm.Script(bytes.toString('utf8'),{filename:name});report.checks++;
 }
});
test('the two installable modules remain within the ordinary two-MiB page limit',()=>{
 for(const name of [coreName,dataName])ok(manifest.files[name].bytes<2097152,name+' fits the existing ordinary page-size gate');
 ok(manifest.files[completeName].bytes>2097152,'The complete local bundle is not offered as a single wiki-page install');
});
test('the complete data packet has the expected version and canonical digest',()=>{
 const data=require(path.join(dist,dataName));
 function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';return JSON.stringify(value);}
 equal(data.version,'2.11.0','Data release');equal(data.schema,1,'Data schema');
 equal(candidate.sha(Buffer.from(canonical(data.packed))),manifest.packedCatalogSha256,'The complete catalog payload remains intact');
 ok(Array.isArray(data.packed.translations.records)&&Array.isArray(data.packed.spelling.rows),'Catalog collections remain present');
});
test('the two published common.js bootstrap variants remain permanently unchanged',()=>{
 for(const name of ['Chamada_fixa_RevisaWiki_common.js','Chamada_fixa_RevisaWiki_copia_propria.js']){
  const bytes=fs.readFileSync(path.join(dist,name));
  equal(candidate.sha(bytes),manifest.baseFiles[name].sha256,name+' matches the preceding stable bootstrap');
  equal(bytes.length,manifest.baseFiles[name].bytes,name+' retains every byte');
 }
});
test('runtime loading requests raw JavaScript and never a rendered code-page view',()=>{
 ok(core.includes("'&action=raw&ctype=text/javascript&v='"),'The catalog is requested as raw JavaScript');
 for(const name of ['Carregador_common_js_RevisaWiki_v2_11_0.js','Carregador_comunitario_RevisaWiki_v2_11_0.js']){
  const loader=source(name);ok(loader.includes('&action=raw&ctype=text/javascript&v='),'Core source uses the raw endpoint');
  ok(loader.includes("expectedVersion = '2.11.0'"),'Loader expects the correct release');
 }
 equal(core.includes('syntaxhighlight-error-exceeds-size-limit'),false,'The rendering warning is not inserted into runtime source');
 equal(dataSource.includes('syntaxhighlight-error-exceeds-size-limit'),false,'The rendering warning is not inserted into data source');
});
test('full modules still initialize the same functional API',()=>{
 const modular=require(path.join(dist,coreName)),complete=require(path.join(dist,completeName));
 equal(modular.version,'2.11.0','Modular runtime version');equal(complete.version,'2.11.0','Complete runtime version');
 const before='Texto com [[Exemplo|Exemplo]].',options={...modular.defaults,namespaceNumber:0,pageTitle:'Exemplo',autoPreview:false,authorityControl:false,automaticTopicPortals:false,automaticBiographyPortals:false,biographyPortal:false};
 const first=modular.calculate({kind:'adjust',source:before,options}),second=complete.calculate({kind:'adjust',source:before,options});
 equal(first.text,second.text,'Distribution forms retain the same result');ok(first.text.includes('[[Exemplo]]'),'The actual adjustment engine runs');
});
if(primaryDirectory){
 test('pinned primary source identifies SyntaxHighlight as a display-only warning',()=>{
  const directory=path.resolve(primaryDirectory),manifestBytes=fs.readFileSync(path.join(directory,'manifest.json')),proof=JSON.parse(manifestBytes.toString('utf8'));
  equal(candidate.sha(manifestBytes),pinnedPrimaryManifest,'The primary-source projection manifest is independently pinned');
  ok(/^[a-f0-9]{40}$/.test(proof.commit),'The upstream source is pinned to an immutable commit');
  ok(Array.isArray(proof.files),'Primary source manifest has a finite file list');
  const files=new Map();
  for(const entry of proof.files){
   const absolute=path.resolve(directory,entry.file);ok(absolute.startsWith(directory+path.sep),'Primary source path is contained');
   const bytes=fs.readFileSync(absolute);equal(candidate.sha(bytes),entry.sha256,'Captured primary source digest');
   const url=new URL(entry.url);equal(url.origin,'https://raw.githubusercontent.com','Official upstream raw source');
   ok(url.pathname.includes('/wikimedia/mediawiki-extensions-SyntaxHighlight_GeSHi/'+proof.commit+'/'),'URL is pinned to the official repository revision');
   ok(/^[a-f0-9]{64}$/.test(entry.upstreamSha256),'The full upstream source has a separate immutable digest');
   const projection=JSON.parse(bytes.toString('utf8'));
   const excerpts=projection.excerpts?Object.values(projection.excerpts):[projection.excerpt];
   for(const excerpt of excerpts){ok(Number.isInteger(excerpt.lineStart)&&excerpt.lineStart>0&&Number.isInteger(excerpt.lineEnd)&&excerpt.lineEnd>=excerpt.lineStart,'An excerpt has an exact upstream line range');equal(candidate.sha(Buffer.from(excerpt.text)),excerpt.sha256,'Exact copied excerpt bytes');equal(excerpt.text.split('\n').length-1,excerpt.lineEnd-excerpt.lineStart+1,'Upstream line count');}
   files.set(entry.role,projection);
  }
  const config=files.get('config'),messages=files.get('messages'),implementation=files.get('implementation'),php=Object.values(implementation.excerpts).map(excerpt=>excerpt.text).join('\n');
  equal(config.SyntaxHighlightMaxBytes.value,102400,'This exact threshold belongs to the syntax highlighter');
  equal(implementation.license,'GPL-2.0-or-later','The copied implementation fragments retain their upstream license');
  ok(implementation.licenseNotice.includes('GNU General Public License'),'The existing implementation license notice is preserved');
  equal(messages['syntaxhighlight-error-exceeds-size-limit'],'O tamanho do código, $1 {{PLURAL:$1|bytes}}, excede o máximo permitido, $2 {{PLURAL:$2|bytes}}','The reported Portuguese text has the exact upstream message key');
  const guard=php.match(/if\s*\(\s*strlen\(\s*\$code\s*\)\s*>\s*\$this->maxBytes\s*\)\s*\{([\s\S]*?)\n\s*\}/);
  ok(guard,'The size guard checks the highlighter input');ok(guard[1].includes('$lexer = null;'),'Oversize input disables the lexer');
  ok(/\$status->warning\(\s*'syntaxhighlight-error-exceeds-size-limit'/.test(guard[1]),'The condition adds a warning, not a save failure');
  equal(/\b(?:throw|fatal|die|exit)\b/.test(guard[1]),false,'The guard does not reject content storage');
  ok(/if\s*\(\s*\$lexer\s*===\s*null\s*\)\s*\{[\s\S]*?plainCodeWrap\(\s*\$code\s*,\s*\$isInline\s*\)[\s\S]*?return\s+\$status\s*;/.test(php),'Fallback renders the same source as plain code');
  report.scope.primary='checked';report.primary={commit:proof.commit,files:proof.files.map(entry=>({role:entry.role,sha256:entry.sha256,upstreamSha256:entry.upstreamSha256,url:entry.url}))};
 });
}
if(liveDirectory){
 test('anonymous GET evidence separates saved JavaScript source from its rendered warning',()=>{
  const directory=path.resolve(liveDirectory),manifestBytes=fs.readFileSync(path.join(directory,'manifest.json')),proof=JSON.parse(manifestBytes.toString('utf8'));
  equal(candidate.sha(manifestBytes),pinnedLiveManifest,'The anonymous source-capture manifest is independently pinned');
  equal(proof.method,'GET','The capture used read-only requests');equal(proof.credentials,'omit','No account authentication was used');equal(proof.wikipediaWrites,0,'No Wikipedia write actions');
  ok(Array.isArray(proof.pages)&&proof.pages.length>=2,'Both existing source pages are represented');
  const checked=[];
  for(const entry of proof.pages){
   equal(entry.contentModel,'javascript','The saved page uses the JavaScript content model');ok(Number.isInteger(entry.revisionId)&&entry.revisionId>0,'Exact saved revision');
   ok(entry.rawBytes>102400&&entry.rawBytes<2097152,'Saved JavaScript exceeds the highlighter threshold while fitting the page limit');
   equal(entry.rawBytes,entry.apiBytes,'The raw and revision API byte counts agree');equal(entry.rawSha256,entry.apiSha256,'Raw and revision source have the same SHA-256');
   const baseline=path.resolve(root,entry.baselineFile);ok(baseline.startsWith(path.join(root,'dist')+path.sep),'Only a known immutable distribution is used as a comparator');
   const bytes=fs.readFileSync(baseline),raw=entry.trailingLfStripped&&bytes[bytes.length-1]===10?bytes.subarray(0,-1):bytes;
   equal(raw.length,entry.rawBytes,'The saved page retains every distribution byte except the declared final newline');equal(candidate.sha(raw),entry.rawSha256,'The complete raw body matches a frozen release');
   new vm.Script(raw.toString('utf8'),{filename:path.basename(baseline)});report.checks++;
   const url=new URL(entry.rawUrl);equal(url.origin,'https://pt.wikipedia.org','Only the technical wiki origin is captured');equal(url.searchParams.get('action'),'raw','The runtime raw view bypasses syntax colouring');equal(url.searchParams.get('ctype'),'text/javascript','The raw view explicitly requests JavaScript');
   checked.push({revisionId:entry.revisionId,contentModel:entry.contentModel,bytes:entry.rawBytes,sha256:entry.rawSha256,rawUrl:entry.rawUrl});
  }
  report.scope.live='checked';report.live={method:'GET',credentials:'omit',pages:checked};
 });
}
report.status=report.failures.length?'failed':'passed';report.passed=report.cases.filter(item=>item.status==='passed').length;report.failed=report.failures.length;
fs.writeFileSync(path.join(candidate.artifactDirectory(),'install_size_diagnosis.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,scope:report.scope,failures:report.failures}));if(report.failed)process.exitCode=1;
