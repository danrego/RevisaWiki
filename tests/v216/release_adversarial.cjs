'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),files=process.env.REVISAWIKI_SCRIPT?
 [process.env.REVISAWIKI_SCRIPT]:['','_completo'].map(s=>path.join(root,'dist/2.16.0/RevisaWiki_v2_16_0'+s+'.js'));
const report={version:'2.16.0',kind:'independent-default-biography-adversarial',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),cases:0,checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);},ok=(a,label)=>{report.checks++;assert(a,label);},pins=[];
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file),bytes=fs.readFileSync(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de controle',contentModel:'wikitext',autoPreview:false},
  subject="'''Pessoa de controle'''",dob='{{DataExt|1|2|1980}}',dod='{{DataExt|3|4|2020}}',born='[[Cidade Alfa]]',died='[[Cidade Beta]]',tail='\n{{Referências}}\n{{Portal3|Biografias}}';
 report.bundles.push({file:bundle,sha256:sha(bytes),bytes:bytes.length});pins.push({file,sha256:sha(bytes)});
 const test=(id,run)=>{report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}};
 const page=(fields,tuple,verb='foi')=>'{{Info/Biografia|nome=Pessoa de controle'+fields+'}}\n'+subject+(tuple?' ('+tuple+')':'')+' '+verb+' uma pessoa.'+tail;
 const run=source=>{
  const result=api.calculate({kind:'adjust',source,options:cfg}),again=api.calculate({kind:'adjust',source:result.text,options:cfg});
  eq(result.preservation,[],'The complete production calculation retains every fact and reference');
  eq(api.preservationAudit(source,result.text,cfg),[],'The independent preservation audit agrees');eq(api.safeComposition(source,result.text,cfg),'','The actual default output passes composition safety');
  eq(again.text,result.text,'One default execution reaches the final byte-identical endpoint');return result;
 };
 const fields=text=>api.v28PrincipalPersonBox(text,cfg)?.fields||[],value=(text,keys)=>fields(text).filter(f=>keys.includes(f.key));
 const dateFields=['nascimento_data','data_nascimento'],placeFields=['local_nascimento','nascimento_local'],deathFields=['morte_data','data_morte'];
 for(const mode of ['anonymous','named','grouped'])for(const punctuation of ['before-comma','after-comma'])test('every fact remains bound under default transformations '+mode+' '+punctuation,()=>{
  const ref=(name,body)=>mode==='anonymous'?'<ref>'+body+'</ref>':'<ref name="'+name+'"'+(mode==='grouped'?' group="nota"':'')+'>'+body+'</ref>',
   rb=ref('data','Fonte da data inicial.'),rp=ref('lugar','Fonte do lugar inicial.'),rd=ref('morte','Fonte da data final.'),rl=ref('local','Fonte do lugar final.'),
   location=(place,reference)=>punctuation==='before-comma'?place+reference+', ':place+','+reference+' ',
   tuple=location(born,rp)+dob+rb+' – '+location(died,rl)+dod+rd,source=page('',tuple),result=run(source);
  eq(value(result.text,dateFields).length,1,'Exactly one native birth-date role is populated');eq(value(result.text,placeFields).length,1,'Exactly one native birth-place role is populated');
  eq(value(result.text,deathFields).length,1,'Exactly one native death-date role is populated');
  for(const body of ['Fonte da data inicial.','Fonte do lugar inicial.','Fonte da data final.','Fonte do lugar final.'])ok(result.text.includes(body),'Every independent source body remains present');
  eq(api.minorEligibility(source,result.text,{...cfg,minorBaseConfirmed:true}).eligible,false,'New biography display locations are not automatically minor');
  const plan=api.v25SafeRepairPlan(source,cfg),transfer=plan.steps.find(step=>step.name==='v216-biography-transfer');ok(transfer,'Actual safe pipeline retains the transfer step');
  const changed=result.text.replace(/((?:local_nascimento|nascimento_local)\s*=\s*)\[\[Cidade Alfa\]\]/,'$1[[Cidade Gama]]');
  ok(changed!==result.text&&api.safeComposition(source,changed,cfg),'Changing a copied place invalidates the proof');
  if(mode!=='anonymous'){
   const swapped=result.text.replace('Fonte da data inicial.','TEMPORARIO.').replace('Fonte do lugar inicial.','Fonte da data inicial.').replace('TEMPORARIO.','Fonte do lugar inicial.');
   ok(api.safeComposition(source,swapped,cfg),'Swapping named source definitions cannot keep the approved source bindings');
   const dateCall='<ref name="data"'+(mode==='grouped'?' group="nota"':'')+' />',placeCall='<ref name="lugar"'+(mode==='grouped'?' group="nota"':'')+' />';
   const changedCall=result.text.replace(dateCall,'MARCADOR').replace(placeCall,dateCall).replace('MARCADOR',placeCall);
   ok(changedCall!==result.text&&api.safeComposition(source,changedCall,cfg),'Swapping copied source calls is rejected');
  }
 });
 for(const [id,fieldsText,tuple]of [
  ['unreferenced opening','',born+', '+dob],['one reference does not source a location','',born+', '+dob+'<ref>Fonte da data.</ref>'],
  ['explicit empty date','|nascimento_data=',dob+'<ref>Fonte da data.</ref>'],
  ['conflicting place','|nascimento_local=[[Cidade Gama]]',born+'<ref>Fonte do local.</ref>, '+dob+'<ref>Fonte da data.</ref>'],
  ['conflicting alias','|nascimento_data=|data_nascimento={{Dni|2|3|1980}}',dob+'<ref>Fonte da data.</ref>'],
  ['source name unresolved','',dob+'<ref name="ausente" />'],
  ['source name ambiguous','',dob+'<ref name="data">Fonte A.</ref><ref name="data">Fonte B.</ref>']
 ])test('uncertain fact stays unpopulated with every option enabled '+id,()=>{
  const source=page(fieldsText,tuple),result=run(source),transfer=api.v216TransferPlan(source,cfg);
  if(id!=='one reference does not source a location')eq(transfer.edits.length,0,'An uncertain opening never authorizes a transfer');
  if(id==='unreferenced opening'||id==='source name unresolved')eq(value(result.text,dateFields).length,0,'No unsupported birth date is inserted');
  if(id==='one reference does not source a location')eq(value(result.text,placeFields).length,0,'A date source does not become a place source');
 });
 test('second principal box after body heading blocks all lead copying',()=>{
  const source=page('',dob+'<ref>Fonte da data.</ref>')+'\n== Outra pessoa ==\n{{Info/Ator|nome=Outra pessoa}}',result=run(source);
  eq(api.v216TransferPlan(source,cfg).edits.length,0,'The entire article participates in the principal-box uniqueness guard');
  ok(!/\|\s*(?:nascimento_data|data_nascimento)\s*=/.test(result.text),'The later second box prevents biography fact insertion');
 });
 for(const [birth,death]of [
  ['{{Dni|1|2|1980}}','{{Morte|3|4|2020}}'],['1980-02-01','{{Morte|3|4|2020}}'],['{{Dni|1|2|1980|si}}','2020-04-03'],
  ['1980-02-01','2020-04-03']
 ])test('packed source and dependent date routines finish in one default pass '+sha(birth+death).slice(0,12),()=>{
  const rb='<ref name="data">Fonte inicial.</ref>',rp='<ref name="lugar">Fonte do lugar.</ref>',rd='<ref name="morte">Fonte final.</ref>',
   source=page('|nascimento_data='+birth+rb+'<br />'+born+rp+'|morte_data='+death+rd,''),result=run(source);
  eq(value(result.text,placeFields).length,1,'The separately sourced location gets one native slot');
  for(const body of ['Fonte inicial.','Fonte do lugar.','Fonte final.'])ok(result.text.includes(body),'Date composition retains every complete source body');
 });
 for(const box of ['{{Info/Biografia|name=Pessoa de controle}}','{{Infobox person|name=Pessoa de controle}}'])
  test('proved existing box migration enables sourced reverse transfer in one click '+sha(box).slice(0,12),()=>{
   const source=box+'\n'+subject+' ('+dob+'<ref>Fonte inicial.</ref>) foi uma pessoa.'+tail,result=run(source);
   eq(value(result.text,dateFields).length,1,'The exact sourced birth date is populated after the already approved box migration');
   ok(result.text.includes('Fonte inicial.'),'The complete original source remains present');
  });
 for(const field of ['sepultamento','enterro','enterro_local','resting_place'])test('burial fields remain literal beside independent default repairs '+field,()=>{
  const frozen='|'+field+'=[[Lugar de controle]]<ref>Fonte de controle.</ref>',result=run(page(frozen,dob+'<ref>Fonte da data.</ref>'));
  ok(result.text.includes(frozen),'The burial parameter spelling, value and reference stay byte-identical');
 });
 for(const [key,val]of [['altura','1,80 m'],['peso','70 kg'],['nacionalidade','Nacionalidade de exemplo'],['ocupação','Ocupação popular'],['filhos','* observação * outra observação']])
  test('field-value prose is not mistaken for syntax '+key,()=>{
   const source=page('|'+key+'='+val,''),result=run(source);ok(result.text.includes('|'+key+'='+val),'A valid literal value is retained');
  });
 for(const namespace of ['Ficheiro','Arquivo','File','Image','Imagem'])test('existing equivalent file namespace does not invalidate an independent date repair '+namespace,()=>{
  const source='{{Info/Filósofo\n| morte_data = 2000-07-17\n| assinatura = [['+namespace+':Assinatura.svg|120px|alt=Traço da assinatura]]<ref name="imagem">Fonte da assinatura.</ref>\n}}\n'+subject+' foi uma pessoa.'+tail,
   result=run(source);
  ok(result.text.includes('{{DataExt|17|7|2000}}'),'The independently proved death date repair is retained');
  ok(result.text.includes('Assinatura.svg|120px|alt=Traço da assinatura]]'),'The same file, width, ALT and option order remain literal');
  ok(result.text.includes('Fonte da assinatura.'),'The complete signature reference remains present');
  for(const [before,after]of [['Assinatura.svg','Outro-arquivo.svg'],['120px','130px'],['Traço da assinatura','Outro texto alternativo']]){
   const changed=result.text.replace(before,after);ok(api.safeComposition(source,changed,cfg),'A filename, size or ALT change is not a namespace-equivalence repair');
  }
  const changed=result.text.replace(/<ref name="imagem">Fonte da assinatura\.<\/ref>/,'');
  ok(changed!==result.text&&api.safeComposition(source,changed,cfg),'The namespace proof never permits deletion of the reference');
 });
 test('large complex biography preserves its complete tail',()=>{
  const source=page('',dob+'<ref name="data">Fonte inicial.</ref>')+'\n== Dados ==\n'+('Texto com [[Ligação|rótulo]], {{lang|en|word}} e dados literais.\n'.repeat(2200))+'<ref>Fonte complementar.</ref>',result=run(source);
  eq((result.text.match(/Texto com /g)||[]).length,2200,'Every original complex body line remains');eq(value(result.text,dateFields).length,1,'The sourced birth field is retained beside the large tail');
 });
}
for(const input of pins)eq(sha(fs.readFileSync(input.file)),input.sha256,'The executed runtime remains immutable');
if(process.env.REVISAWIKI_REPORT_DIR){const folder=path.resolve(root,process.env.REVISAWIKI_REPORT_DIR);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'release_adversarial.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(report.failures.length)process.exitCode=1;
