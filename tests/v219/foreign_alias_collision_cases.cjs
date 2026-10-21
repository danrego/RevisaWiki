'use strict';
// Native CS1 Configuração 73016847 puts website, periódico, jornal and obra
// in the same Periodical role. Distinct literal target keys are insufficient.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={schemaVersion:1,kind:'foreign-mapping-native-role-collisions',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),nativeContract:{oldid:73016847,sha256:'4924bb13ea17c8d105e5132b9ef06dc438a6280d5d940bbf199aeb62e2cc8099',role:'Periodical',aliases:['website','periódico','jornal','obra']},bundles:[],cases:0,checks:0,failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false},eq=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),options={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',citations:true,multilingual:true,minorBaseConfirmed:true};
 report.bundles.push({bundle,sha256:hash(bytes),version:api.version});
 const fixtures=[];
 for(const name of ['шаблон:Cite journal','шаблон:Cite news','шаблон:Cite book','шаблон:Cite web'])for(const key of ['sitio web','sitioweb','sítio'])for(const values of [['Primeiro valor','Segundo valor'],['Mesmo valor','Mesmo valor'],['Primeiro valor',''],['','Segundo valor']])for(const reverse of [false,true]){
  const fields=[[key,values[0]],['website',values[1]]];if(reverse)fields.reverse();
  const source='{{'+name+fields.map(([key,value])=>'|'+key+'='+value).join('')+'}}';fixtures.push({source,expected:source});
 }
 // Local Lien web46288422 forwards the Citar web48262420 native interface unchanged.
 fixtures.push({source:'{{Lien web|titre=Fonte fictícia|volume=2|numéro=3}}',expected:'{{Citar web|titre=Fonte fictícia|volume=2|numéro=3}}'});
 for(const {source,expected}of fixtures){report.cases++;try{
  const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});
  eq(first.text,expected,'Foreign mapping cannot introduce competing native aliases, including blank overrides');eq(second.text,expected,'The accepted or refused transaction is idempotent');eq(first.preservation||[],[],'Every original value retains its role');eq(api.preservationAudit(source,expected,options),[],'Independent value retention passes');eq(api.safeComposition(source,expected,options),'','Only a full safe transaction is selectable');
 }catch(error){report.status='failed';report.failures.push({bundle,id:hash(source).slice(0,24),message:error.message});}}
 eq(hash(fs.readFileSync(file)),hash(bytes),'The runtime remains immutable');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
