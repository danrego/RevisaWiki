'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(p=>path.resolve(p));if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.join(root,'dist/2.19.0',n)));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),report={kind:'unchanged-native-display-atom-guard',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);};
for(const file of files){const bytes=fs.readFileSync(file),api=require(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,biographyPortals:false};report.bundles.push({sha256:sha(bytes),version:api.version});
 const box='{{Info/Taxonomia\n|nome=Organismo fictício\n|subdivisão=\n<center>Ver texto\n}}',table='\n\n{| class="wikitable"\n! Coluna\n|-\n| Dado\n|-\n|}\n',source=box+table;
 const run=(id,fn)=>{report.cases++;try{fn();}catch(e){report.status='failed';report.failures.push({id,message:e.message});}};
 run('whole-action-retains-exact-native-atom',()=>{
  const first=api.calculate({kind:'adjust',source,options:cfg}),second=api.calculate({kind:'adjust',source:first.text,options:cfg});
  eq(first.text.startsWith(box),true,'The complete native infobox is byte-identical');eq(first.text!==source,true,'Independent proved table cleanup still reaches the action');eq(second.text,first.text,'The action is idempotent');eq(first.preservation||[],[],'The outside action has no false incomplete-tail warning');eq(api.preservationAudit(source,first.text,cfg),[],'Independent full-text inventories still apply');eq(api.safeComposition(source,first.text,cfg),'','The exact full action composes');eq(api.v219NativeCenterTailProof(source,first.text,cfg),true,'The finite atom projection proves only the outside repairs');
 });
 for(const [id,change]of [
  ['native-field-changed',s=>s.replace('Ver texto','Outro texto')],['atom-moved',s=>'Texto novo\n'+s],['outside-open-tag',s=>s+'<div>aberto'],['outside-numeric-data',s=>s.replace('| Dado','| Outro dado')],['native-box-removed',s=>s.replace(box,'')]
 ])run('mutation-'+id,()=>{const candidate=change(source);eq(api.v219NativeCenterTailProof(source,candidate,cfg),false,'Changed native atom or unproved outside edit cannot use quarantine');});
 for(const [id,change]of [
  ['unknown-template',s=>s.replace('Info/Taxonomia','Modelo desconhecido')],['other-field',s=>s.replace('subdivisão=','outro=')],['center-attribute',s=>s.replace('<center>','<center class="exemplo">')],['other-tag',s=>s.replace('<center>','<div>')],['two-atoms',s=>box+'\n'+s],['unclosed-template',s=>s.replace('\n}}','\n')],['comment-example',s=>'<!--'+s+'-->'],['code-example',s=>'<code>'+s+'</code>'],['nested-unknown-owner',s=>'{{Modelo desconhecido|1='+s+'}}'],['outside-closer',s=>s+'</center>'],['tag-in-other-field',s=>s.replace('nome=Organismo fictício','nome=<center>Outro')]
 ])run('scope-'+id,()=>{const before=change(source);eq(api.v219NativeCenterQuarantine(before,before.replace('| Dado','| Outro dado'),cfg),null,'Only the precise verified native display atom is eligible');});
 for(const options of [{namespaceNumber:1},{namespaceNumber:10},{discussionPage:true},{sectionOnly:true},{contentModel:'javascript'}])run('context-'+JSON.stringify(options),()=>eq(api.v219NativeCenterQuarantine(source,source,{...cfg,...options}),null,'Nonarticle and partial contexts never use the finite display atom'));
 eq(sha(fs.readFileSync(file)),sha(bytes),'The real bundle remains immutable');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
