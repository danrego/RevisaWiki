'use strict';
// Exact public examples are fictional. No request, account or form submission
// is available to these transformation checks.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:['','_completo'].map(s=>path.join(root,'dist/2.16.0/RevisaWiki_v2_16_0'+s+'.js'));
const report={version:'2.16.0',kind:'biography-integration-and-single-pass-checks',status:'passed',bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,message){report.checks++;assert.deepEqual(a,b,message);}
function ok(a,message){report.checks++;assert(a,message);}
function test(bundle,id,run){report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:error.message});}}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file);report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file))});eq(api.version,'2.16.0','The actual requested release is loaded');
 const cfg={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),namespaceNumber:0,pageTitle:'Pessoa de controle',contentModel:'wikitext',infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticBiographyFields:true,birthDates:true};
 const name="'''Pessoa de controle'''",lead=name+' é uma escritora.',ref='<ref name="data">Fonte da data.</ref>',placeRef='<ref name="local">Fonte do local.</ref>',date='{{DataExt|1|2|1980}}';
 function pipeline(source,options={}){const settings={...cfg,...options},out=api.calculate({kind:'adjust',source,options:settings});eq(typeof out.text,'string','A complete textual endpoint is returned');eq(api.calculate({kind:'adjust',source:out.text,options:settings}).text,out.text,'One click reaches a stable endpoint');eq(api.safeComposition(source,out.text,settings),'','Selection safety accepts the complete result');eq(api.preservationAudit(source,out.text,settings),[],'No fact or reference is lost');eq(out.preservation,[],'The production pipeline accepts the content proof');return out;}
 test(bundle,'a complete standalone date is formatted without a live-age side effect',()=>{
  const before='{{Info/Biografia|nome=Pessoa de controle|nascimento_data=1980-02-01'+ref+'}}\n'+lead;
  const expected=before.replace('1980-02-01',date),out=pipeline(before);eq(out.text,expected,'The full ISO date has one exact native presentation');
  ok(!out.text.includes('{{Dni')&&!out.text.includes('Categoria:'),'Formatting does not invent an age or category');
  const counted=api.v211RetainedAdjustments(before,out.text,[],cfg);eq(counted.exact,true,'The displayed count is proved');eq(counted.count,1,'The date repair is one operation');
  eq(api.minorEligibility(before,out.text,{...cfg,minorBaseConfirmed:true}).eligible,true,'Pure date formatting can be mechanically minor');
 });
 test(bundle,'a referenced lead can complete birth fields in the existing infobox',()=>{
  const source='{{Info/Biografia|nome=Pessoa de controle}}\n'+name+' ([[Cidade de controle]]'+placeRef+', '+date+ref+') é uma escritora.';
  const out=pipeline(source);ok(out.text!==source,'The missing native fields are actually populated');
  ok(/\|\s*nascimento_data\s*=\s*\{\{DataExt\|1\|2\|1980\}\}/.test(out.text),'The exact referenced date is copied');
  ok(/\|\s*local_nascimento\s*=\s*\[\[Cidade de controle\]\]/.test(out.text),'The exact referenced place is copied');
  ok(out.text.includes('Fonte da data.')&&out.text.includes('Fonte do local.'),'Both original reference definitions remain');
  eq(api.v211RetainedAdjustments(source,out.text,[],cfg).count,2,'Each newly populated native field counts separately');
  eq(api.minorEligibility(source,out.text,{...cfg,minorBaseConfirmed:true}).eligible,false,'A new display location for biography facts is not automatically minor');
  const tampered=out.text.replace(/local_nascimento\s*=\s*\[\[Cidade de controle\]\]/,'local_nascimento=[[Outra cidade]]');
  ok(api.safeComposition(source,tampered,cfg),'A changed copied fact cannot reuse the approved selection proof');
 });
 test(bundle,'a packed birth date and place are distributed without rewriting references',()=>{
  const source='{{Info/Biografia|nome=Pessoa de controle|nascimento_data='+date+ref+'<br />[[Cidade de controle]]'+placeRef+'}}\n'+lead;
  const out=pipeline(source);ok(out.text!==source,'The packed field is repaired');
  ok(/nascimento_data\s*=\s*\{\{DataExt\|1\|2\|1980\}\}/.test(out.text),'The date stays in the original role');
  ok(/\|\s*local_nascimento\s*=\s*\[\[Cidade de controle\]\]/.test(out.text),'The place gets its actual native role');
  eq((out.text.match(/Fonte da data\./g)||[]).length,1,'The date reference body is retained exactly once');eq((out.text.match(/Fonte do local\./g)||[]).length,1,'The place reference body is retained exactly once');
 });
 for(const [id,value]of [['slash date','01/02/1980'],['partial date','fevereiro de 1980'],['approximate date','cerca de 1980'],['wrong leap date','1981-02-29'],['future date','2999-02-01'],['non-Gregorian date','1 de fevereiro de 1580']]){
  test(bundle,'standalone refusal: '+id,()=>{const s='{{Info/Biografia|nome=Pessoa de controle|nascimento_data='+value+ref+'}}\n'+lead;eq(pipeline(s).text,s,'Ambiguous or unsupported dates stay literal');});
 }
 for(const key of ['sepultamento','enterro','enterro_local','resting_place'])test(bundle,'burial field remains frozen: '+key,()=>{
  const s='{{Info/Biografia|nome=Pessoa de controle|'+key+'=[[Local de controle]]'+ref+'|nascimento_data=1980-02-01}}\n'+lead;const o=pipeline(s);ok(o.text.includes('|'+key+'=[[Local de controle]]'+ref),'The burial key, value and source remain byte-identical');
 });
 test(bundle,'a native field that expects the unit retains it',()=>{const s='{{Info/Biografia|nome=Pessoa de controle|altura=1,80 m|peso=70 kg}}\n'+lead;eq(pipeline(s).text,s,'No blanket removal applies to heights or weights');});
 test(bundle,'late cleanup removes only an actually empty end section',()=>{
  const s=lead+'\n\n== Notas ==\n\n== Bibliografia ==\n* Obra de controle.\n';
  const o=api.v216EmptyEndHeadingPlan(s,{...cfg,headings:true});ok(o.text!==s,'The empty heading can be removed');ok(!o.text.includes('== Notas =='),'The empty Notes heading is gone');ok(o.text.includes('* Obra de controle.'),'The adjacent bibliography remains');eq(api.v216EmptyEndHeadingProof(s,o.text,o,{...cfg,headings:true}),true,'The exact heading-only plan is reproducible');
 });
 for(const body of ['Uma nota de controle.','<!-- Posição escolhida pelo editor. -->','{{Modelo desconhecido}}','=== Nota específica ===\nTexto.'])test(bundle,'end-section preservation: '+body.slice(0,25),()=>{
  const s=lead+'\n\n== Notas ==\n'+body+'\n';eq(api.v216EmptyEndHeadingPlan(s,{...cfg,headings:true}).text,s,'A section owning text, comments, templates or a subsection is not empty');
 });
 test(bundle,'footer movement and empty heading finish in one execution',()=>{
  const s="'''Assunto de controle''' é um assunto.\n\n== Bibliografia ==\n* Obra de controle.\n\n== Notas ==\n{{Tradução/ref|en|Example subject|oldid=123456789}}\n\n{{Portal3|Ciência}}\n[[Categoria:Ciência]]\n";
  const options={...api.defaults,namespaceNumber:0,pageTitle:'Assunto de controle',autoPreview:false,authorityControl:false,portals:false,automaticTopicPortals:false};
  const out=api.calculate({kind:'adjust',source:s,options});eq(api.calculate({kind:'adjust',source:out.text,options}).text,out.text,'The original two-pass footer case now finishes in one click');ok(!out.text.includes('== Notas =='),'The newly emptied heading is removed');ok(out.text.includes('{{Tradução/ref|en|Example subject|oldid=123456789}}'),'The footer attribution is preserved');
 });
}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
