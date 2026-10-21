'use strict';
// The pinned implementation emits its own bullet and has distinct URL roles.
// An ignored source parameter must not become a displayed target parameter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),root=path.resolve(__dirname,'../..'),
 files=process.argv.slice(2).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const contract=fs.readFileSync(path.join(__dirname,'spanish_official_contract.json')),
 report={schemaVersion:1,kind:'spanish-official-profile-quarantine',status:'passed',contractSha256:hash(contract),cases:0,checks:0,bundles:[],failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false};
const eq=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),
 options={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,portals:false,endMatter:false,registryDoiCheck:false,minorBaseConfirmed:true};
 report.bundles.push({bundle,version:api.version,sha256:hash(bytes)});
 for(const name of ['Sitio web oficial','plantilla:Sitio web oficial'])for(const body of ['', '|name=Texto literal','|titre=Texto literal','|url=https://example.invalid/fonte','|URL=https://example.invalid/fonte','|https://example.invalid/fonte','|https://example.invalid/fonte|Texto literal','|nombre=Texto literal','|1=https://example.invalid/fonte|nombre=Texto literal|noa=1','|1=https://example.invalid/fonte|idioma=en','|1=https://example.invalid/fonte|móvil=https://example.invalid/movel'])for(const prefix of ['', '* ']){
  const source=prefix+'{{'+name+body+'}}',id=hash(source).slice(0,24);report.cases++;
  try{
   const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});
   eq(first.text,source,'The unproved foreign call retains every source role and bullet');
   eq(second.text,source,'The refusal remains idempotent');
   eq(first.preservation||[],[],'No discarded fields or invented local roles');
   eq(api.preservationAudit(source,first.text,options),[],'The independent preservation check accepts the no-op');
   eq(api.safeComposition(source,first.text,options),'','The full context admits the retained source');
  }catch(error){report.status='failed';report.failures.push({bundle,id,message:error.message});}
 }
 eq(hash(fs.readFileSync(file)),hash(bytes),'The runtime is unchanged');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
