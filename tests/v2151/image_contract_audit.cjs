'use strict';
// Only the private test module exposes profile replacement. Production bundle
// bytes remain unchanged and the resulting report contains no source pages.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const report={kind:'pinned-biography-image-contract-boundaries',status:'passed',cases:[],checks:0,networkRequests:0,wikipediaWrites:0,bundles:[]};
const names=['info/biografia','info/autor','info/cientista','info/escritor','info/jornalista'];
for(const filename of ['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js']){
 const file=path.join(root,'dist/2.15.1',filename),source=fs.readFileSync(file,'utf8');
 const injected=source.replace('    const api = {','    const api = {__profileGet:name=>INFOBOX_CATALOG[name],__profileSet:(name,value)=>{INFOBOX_CATALOG[name]=value;},');
 const compiled=new Module(file,module);compiled.filename=file;compiled.paths=module.paths;compiled._compile(injected,file);const api=compiled.exports;
 report.bundles.push({file:filename,sha256:crypto.createHash('sha256').update(source).digest('hex')});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',contentModel:'wikitext'};
 const run=(name,label,mutate,expected)=>{
  const original=api.__profileGet(name),profile=JSON.parse(JSON.stringify(original));if(mutate)mutate(profile);api.__profileSet(name,profile);
  const raw='{{'+profile.title+'|nome=Pessoa de teste|imagem=[[Ficheiro:Retrato.jpg|thumb|200px|alt=Uma pessoa|Legenda exata.]]}}\n'+"'''Pessoa de teste''' é uma pessoa.";
  try{
   const plan=api.v2151BiographyImageAltPlan(raw,cfg);report.checks++;assert.equal(plan.edits.length,expected);
   report.checks++;assert.equal(plan.text===raw,expected===0);report.checks++;assert.equal(api.v2151BiographyImageAltProof(raw,plan.text,plan,cfg),true);
   report.cases.push({bundle:filename,profile:name,boundary:label,status:'passed'});
  }catch(error){report.status='failed';report.cases.push({bundle:filename,profile:name,boundary:label,status:'failed',message:String(error.message)});}
  finally{api.__profileSet(name,original);}
 };
 for(const name of names){
  run(name,'exact pinned profile',null,1);
  run(name,'changed native definition',profile=>profile.oldid=72993801,0);
  run(name,'missing dependency proof',profile=>profile.dependencies=[],0);
  run(name,'changed image module',profile=>profile.dependencies=profile.dependencies.map(item=>item.title==='Módulo:InfoboxImage'?{...item,oldid:72932633}:item),0);
  run(name,'unaccepted ALT destination',profile=>profile.accepted=profile.accepted.filter(key=>key!=='alt'),0);
  run(name,'unaccepted size destination',profile=>profile.accepted=profile.accepted.filter(key=>key!=='imagem_tamanho'),0);
  run(name,'unaccepted caption destination',profile=>profile.accepted=profile.accepted.filter(key=>key!=='imagem_legenda'),0);
 }
 run('info/senador do império do brasil','inherited family with different native definition',null,0);
 run('info/senador do império do brasil','unlisted name even with forged matching native pin',profile=>profile.oldid=72993800,0);
}
const output=path.join(root,'artifacts/v2151/image_contract_audit.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.cases.filter(item=>item.status!=='passed')}));if(report.status!=='passed')process.exitCode=1;
