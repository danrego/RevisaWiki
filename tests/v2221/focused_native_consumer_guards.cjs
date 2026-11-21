'use strict';
// Fixed source controls for native reader conditions and the coupled collector.
// Predicate-only schema controls do not add or activate native consumer records.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dataFile=path.resolve(__dirname,'../../src/v2_22_1/focused_infobox_data.json'),dataRaw=fs.readFileSync(dataFile),data=JSON.parse(dataRaw);
const loaded=require('./focused_infoboxes_harness.cjs').load(),a=loaded.api,sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const independentRaw=fs.readFileSync(path.join(__dirname,'native_unknown_caption_collector_proof.json')),independentEvidence=JSON.parse(independentRaw);assert.equal(sha(independentRaw),'62a20e286dbce209947c1b75daaf5d30d924be11961f4371d784ff79ac83a50f','Exact reviewed native independent collector evidence');
for(const name of ['v2221FocusedReferenceConsumer','v2221FocusedReferenceActivation','v2221FocusedReferencePrerequisitePlan','v2221FocusedReferencePrerequisiteProof','v2221FocusedActivatedReferenceAllows'])assert.equal(typeof a[name],'function','Missing native consumer API: '+name);
const cfg={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',endMatter:true,autoPreview:false,registryDoiCheck:false,automaticBiographyPortals:false,automaticTopicPortals:false,portals:false};
const value='Valor preservado<ref name="A">Fonte.</ref>',rows=[],failures=[];let checks=0,calculations=0;
const eq=(actual,expected,label)=>{checks++;assert.equal(actual,expected,label);},ok=(actual,label)=>{checks++;assert(actual,label);};
const copy=x=>JSON.parse(JSON.stringify(x)),asciiCore=x=>x.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
function record(owner,key){const found=data.nativeReferenceConsumers.filter(row=>row.owner===owner&&row.key===key);assert.equal(found.length,1,'One finite reader record for '+owner+'/'+key);return found[0];}
function source(owner,key,extra='',literal=value){return '{{'+owner+'|nome=Exemplo|'+key+'='+literal+extra+'}}\n\nExemplo.\n\n[[Categoria:Exemplos]]';}
function boxFor(input){const raw=input.slice(0,input.indexOf('}}\n\n')+2),parsed=a.v2221InfoboxRead(raw);assert(parsed,'Complete fixture owner');return {raw,name:parsed.title,fields:parsed.fields};}
function fieldFor(text,owner,key){const node=a.v2221FocusedNodes(text,cfg).find(n=>a.v2221InfoboxRead(text.slice(n.start,n.end))?.title===owner);ok(node,'Native owner retained');const parsed=a.v2221InfoboxRead(text.slice(node.start,node.end)),fields=parsed.fields.filter(f=>f.key===key);eq(fields.length,1,'One exact field '+key);return fields[0];}
function capture(id,kind,input,body){try{const result=body();rows.push({id,kind,status:'passed',...(input?{inputSha256:sha(input)}:{}),...result});}catch(error){const failure={id,kind,status:'failed',...(input?{inputSha256:sha(input)}:{}),error:String(error.stack||error)};rows.push(failure);failures.push(failure);}}
function fixture(id,owner,key,extra,wantChange,options=cfg,literal=value,withoutNome=false){
 const original=source(owner,key,extra,literal),input=withoutNome?original.replace('|nome=Exemplo',''):original,native=data.nativeReferenceConsumers.find(r=>r.owner===owner&&r.sourceKeys.includes(key));assert(native,'Fixed fixture has a finite current source key: '+id);
 capture(id,'source-plan-and-proof',input,()=>{
  const plan=a.v2221FocusedReferencePrerequisitePlan(input,options);
  eq(plan.text!==input,wantChange,id+' coupled eligibility');ok(a.v2221FocusedReferencePrerequisiteProof(input,plan.text,plan,options),id+' source-bound proof');
  if(wantChange){
   eq(asciiCore(fieldFor(plan.text,owner,native.key).value),literal,id+' exact value bytes');eq((plan.text.match(/\{\{Referências\}\}/g)||[]).length,1,id+' one native collector');
   eq(a.v2221FocusedReferencePrerequisitePlan(plan.text,options).text,plan.text,id+' planner replay');
   const activation=a.v2221FocusedReferenceActivation(input,options);ok(activation,id+' activation');ok(a.v2221FocusedActivatedReferenceAllows(activation.mapped,options,activation.packet),id+' fresh packet accepted');
   const binding=activation.packet.fields.find(f=>f.from===key&&f.to===native.key);ok(binding,id+' exact source/target binding');eq(binding.consumption.role,native.role,id+' finite native role');
   if(native.role==='native-caption-reference-registration')eq(binding.consumption.role,'native-caption-reference-registration',id+' argument evaluation is not claimed direct-visible');
   const forged=copy(plan);forged.edits[0].count++;ok(!a.v2221FocusedReferencePrerequisiteProof(input,plan.text,forged,options),id+' forged count rejected');ok(!a.v2221FocusedReferencePrerequisiteProof(input,plan.text+'X',plan,options),id+' changed endpoint rejected');
  }else{eq(plan.text,input,id+' held source exact');eq(plan.edits.length,0,id+' no speculative writes');}
  return {changed:wantChange,outputSha256:sha(plan.text),owner,key,target:native.key};
 });
 if(loaded.receipt.mode==='actual-current-complete-API')capture(id+'/calculate','actual-complete-action-and-replay',input,()=>{
  const request={kind:'adjust',source:input,originalSource:input,options},requestBytes=JSON.stringify(request),result=a.calculate(request);calculations++;
  eq(JSON.stringify(request),requestBytes,id+' request preserved');eq(a.v219AutomaticResultSafety(input,result).accepted,true,id+' authoritative result gate');eq(JSON.stringify(a.v2217AnchorRawAudit(input,result.text,options)),'[]',id+' raw reference bytes retained');
  if(wantChange){eq(asciiCore(fieldFor(result.text,owner,native.key).value),literal,id+' complete exact value');eq((result.text.match(/\{\{Referências\}\}/g)||[]).length,1,id+' complete one collector');}
  else{
   eq(asciiCore(fieldFor(result.text,owner,key).value),literal,id+' held source key/value retained');
   if(id==='unknown-reference-body-producer-held'){
    // The field is held. The inherited end-matter stage separately collects a
    // Cite registration already observed in both exact unsaved native parses.
    eq(sha(input),independentEvidence.sourceSha256,'Only the exact native-proved synthetic source');eq(owner,independentEvidence.heldOwner,'Exact owner');eq(key,independentEvidence.heldKey,'Exact held key');eq(independentEvidence.creditedAtomicFieldRepairs,0,'No repair credit for the held binding');
    const reader=data.nativeReferenceConsumers.find(r=>r.owner===owner&&r.key===native.key);eq(JSON.stringify(reader.native),JSON.stringify(independentEvidence.ownerNativePin),'Current pinned native caption reader');eq(JSON.stringify({title:independentEvidence.nativeCheckerPin.title,...data.nativeReferenceDependencyPins[independentEvidence.nativeCheckerPin.title]}),JSON.stringify(independentEvidence.nativeCheckerPin),'Current pinned argument checker');
    for(const preview of independentEvidence.nativePreviews){eq(JSON.stringify(preview.citeNoteIds),'["cite_note-1"]','Native reference really registered');eq(JSON.stringify(preview.backlinks),'[{"href":"#cite_ref-1"}]','Native backlink retained');eq(JSON.stringify(preview.referenceTexts),'["Predefinição:Produtor desconhecido"]','Native unknown body retained');eq(JSON.stringify(preview.errors),'[]','No native Cite error');}
    eq(a.v2221FocusedReferenceActivation(input,options),null,'Unknown body cannot authorize field activation');const held=a.v2221FocusedReferencePrerequisitePlan(input,options);eq(held.text,input,'Atomic operation remains held');eq(held.edits.length,0,'No atomic field or collector repair credit');eq((result.text.match(/\{\{Referências\}\}/g)||[]).length,1,'One independently proved native collector');eq(result.text.includes(independentEvidence.rawReference),true,'Exact opaque raw reference retained');
    const events=[],warnings=[],stage=a.endMatterPass(input,(...event)=>events.push(event),(...warning)=>warnings.push(warning),options);eq(stage,input.replace('\n\n[[Categoria:Exemplos]]','\n\n{{Referências}}\n\n[[Categoria:Exemplos]]'),'The inherited stage adds only the existing collector');eq(JSON.stringify(events),'[["endMatter"]]','One actual end-matter operation');eq(JSON.stringify(warnings),'[]','No fabricated stage warning');
    for(const override of [{references:false},{endMatter:false},{automaticParameterNames:false}]){const branch={...options,...override},controlled=a.calculate({kind:'adjust',source:input,originalSource:input,options:branch});calculations++;eq(a.v219AutomaticResultSafety(input,controlled).accepted,true,'Independent collector control result gate');eq(asciiCore(fieldFor(controlled.text,owner,key).value),literal,'Every control retains the unproved key and raw value');eq(JSON.stringify(a.v2217AnchorRawAudit(input,controlled.text,branch)),'[]','Every control retains raw reference bytes');eq((controlled.text.match(/\{\{Referências\}\}/g)||[]).length,override.automaticParameterNames===false?1:0,'Independent collector obeys its own flags');}
   }else eq((result.text.match(/\{\{Referências\}\}/g)||[]).length,0,id+' no unproved collector');
  }
  const replay=a.calculate({kind:'adjust',source:result.text,originalSource:result.text,options});calculations++;eq(replay.text,result.text,id+' complete replay bytes');eq(replay.changes.reduce((n,c)=>n+c.count,0),0,id+' no ghost writes on replay');
  return {changed:result.text!==input,outputSha256:sha(result.text),replaySha256:sha(replay.text)};
 });
}

// Native defaults choose the first present key: an empty primary blocks fallback.
fixture('football-death-country-primary','Info/Futebolista','cidade_morte','|morte_país=Brasil',true);
fixture('football-death-country-fallback','Info/Futebolista','cidade_morte','|paisdamorte=Brasil',true);
fixture('football-death-country-required','Info/Futebolista','cidade_morte','',false);
fixture('football-death-empty-primary-masks-country','Info/Futebolista','cidade_morte','|morte_país= |paisdamorte=Brasil',false);
fixture('football-death-empty-higher-location','Info/Futebolista','cidade_morte','|morte_país=Brasil|morte_local= ',false);
fixture('football-death-filled-higher-location','Info/Futebolista','cidade_morte','|morte_país=Brasil|morte_local=Outro local',false);
fixture('football-birth-city-direct','Info/Futebolista','nascimentocidade','',true);
fixture('football-birth-empty-location-masks-city','Info/Futebolista','nascimentocidade','|nascimento_local= ',false);
fixture('football-birth-empty-older-city-masks-city','Info/Futebolista','nascimentocidade','|cidadenatal= ',false);
fixture('football-birth-filled-location-masks-city','Info/Futebolista','nascimentocidade','|nascimento_local=Outro local',false);

fixture('software-date-explicit-release','Info/Software','latest release date','|última_versão=1.0',true);
fixture('software-date-fallback-release','Info/Software','latest release date','|última versão=1.0',true);
fixture('software-date-no-release','Info/Software','latest release date','',false);
fixture('software-date-empty-first-release','Info/Software','latest release date','|última_versão= |última versão=1.0',true);
fixture('software-date-empty-layout-is-not-absent','Info/Software','latest release date','|última_versão=1.0|layout_versão= ',false);
fixture('software-date-explicit-layout-held','Info/Software','latest release date','|última_versão=1.0|layout_versão=empilhado',false);
fixture('software-date-empty-discontinued-is-not-absent','Info/Software','latest release date','|última_versão=1.0|descontinuado= ',false);
fixture('software-date-discontinued-held','Info/Software','latest release date','|última_versão=1.0|descontinuado=sim',false);
fixture('software-beta-date-explicit-version','Info/Software','data_da_versão_beta','|versão_beta=2.0-beta',true);
fixture('software-beta-date-fallback-version','Info/Software','data_da_versão_beta','|versão beta=2.0-beta',true);
fixture('software-beta-date-no-version','Info/Software','data_da_versão_beta','',false);
fixture('software-beta-empty-first-version','Info/Software','data_da_versão_beta','|versão_beta= |versão beta=2.0-beta',true);

fixture('vice-label-has-data','Info/Político','vice-título2','|vice2=Pessoa',true);
fixture('vice-label-without-data','Info/Político','vice-título2','',false);
fixture('vice-label-empty-first-data','Info/Político','vice-título2','|vice-presidente2= |vice2=Pessoa',false);
fixture('vice-fixed-label-with-primary-data-held','Info/Político','vice-título2','|vice-presidente2=Pessoa',false);
fixture('vice-fixed-label-masks-custom-title-held','Info/Político','vice-título2','|vice-presidente2=Pessoa|vice2=Outra pessoa',false);
fixture('vice-underscore-fixed-label-held','Info/Político','vice-título2','|vice_presidente2=Pessoa|vice2=Outra pessoa',false);
fixture('vice-empty-underscore-allows-custom-title','Info/Político','vice-título2','|vice_presidente2= |vice2=Pessoa',true);
fixture('leader-label-has-data','Info/Organização','líder_tipo','|líder_nome=Pessoa',true);
fixture('leader-label-without-data','Info/Organização','líder_tipo','',false);
fixture('leader-label-empty-data','Info/Organização','líder_tipo','|líder_nome= ',false);
fixture('taxon-binomial-authority-has-taxon','Info/Taxonomia','binomial_autoritdade','|binomial=Taxon literal',true);
fixture('taxon-binomial-authority-without-taxon','Info/Taxonomia','binomial_autoritdade','',false);
fixture('taxon-family-authority-has-taxon','Info/Taxonomia','família_autporidade','|família=Taxon literal',true);
fixture('taxon-family-authority-has-fallback-taxon','Info/Taxonomia','família_autporidade','|unranked_familia=Taxon literal',true);
fixture('taxon-family-authority-empty-primary','Info/Taxonomia','família_autporidade','|família= |unranked_familia=Taxon literal',false);
fixture('taxon-family-authority-without-taxon','Info/Taxonomia','família_autporidade','',false);
fixture('taxon-genus-authority-has-taxon','Info/Taxonomia','género_autotidade','|género=Taxon literal',true);
fixture('taxon-genus-authority-fallback-taxon','Info/Taxonomia','género_autotidade','|genus=Taxon literal',true);
fixture('taxon-genus-authority-empty-primary','Info/Taxonomia','género_autotidade','|género= |genus=Taxon literal',false);
fixture('taxon-genus-authority-without-taxon','Info/Taxonomia','género_autotidade','',false);

// These are registration contracts, including when the caption is suppressed.
for(const [owner,key]of [['Info/Filme','iamgem_legenda'],['Info/Jogo eletrônico','legenda-imagem'],['Info/Clube de futebol','legenda'],['Info/Música/artista','didascalia']]){
 fixture(owner+'/caption/no-image',owner,key,'',true);
 fixture(owner+'/caption/placeholder-image',owner,key,'|imagem=Example.jpg',true);
 fixture(owner+'/caption/literal-nonplaceholder-image',owner,key,'|imagem=Albert Einstein Head.jpg',true);
}
fixture('caption-first-nonempty-alias-conflict','Info/Filme','iamgem_legenda','|legenda=Outra legenda',false);
fixture('filled-native-destination','Info/Filme','iamgem_legenda','|imagem_legenda=Outra legenda',false);
fixture('default-group-required','Info/Filme','iamgem_legenda','',false,cfg,'Valor preservado<ref group="nota">Fonte.</ref>');
fixture('mixed-reference-groups-held','Info/Filme','iamgem_legenda','',false,cfg,value+'<ref group="nota">Nota.</ref>');
fixture('unknown-field-producer-held','Info/Filme','iamgem_legenda','|roteiro={{Produtor desconhecido}}',false);
fixture('unknown-higher-caption-alias-held','Info/Filme','iamgem_legenda','|legenda={{Produtor desconhecido}}',false);
fixture('unknown-reference-body-producer-held','Info/Filme','iamgem_legenda','',false,cfg,'Valor preservado<ref>{{Produtor desconhecido}}</ref>');
fixture('conflicting-reference-definition-held','Info/Filme','iamgem_legenda','',false,cfg,value+'<ref name="A">Outra fonte.</ref>');
fixture('reference-only-value-held','Info/Filme','iamgem_legenda','',false,cfg,'<ref name="A">Fonte.</ref>');
fixture('references-disabled','Info/Filme','iamgem_legenda','',false,{...cfg,references:false});
fixture('reference-repair-disabled','Info/Filme','iamgem_legenda','',false,{...cfg,automaticReferenceRepairs:false});
fixture('parameter-repair-disabled','Info/Filme','iamgem_legenda','',false,{...cfg,automaticParameterNames:false});
fixture('endmatter-disabled','Info/Filme','iamgem_legenda','',false,{...cfg,endMatter:false});
const incompleteCaptionMask=source('Info/Filme','iamgem_legenda','','Valor preservado<nowiki><ref name="A">Fonte.</ref>');
capture('caption-incomplete-mask-held','source-plan-and-proof',incompleteCaptionMask,()=>{
 const plan=a.v2221FocusedReferencePrerequisitePlan(incompleteCaptionMask,cfg);
 eq(plan.text,incompleteCaptionMask,'An incomplete protected caption cannot authorize a mapped field or collector');eq(plan.edits.length,0,'No writes through an incomplete caption mask');ok(a.v2221FocusedReferencePrerequisiteProof(incompleteCaptionMask,plan.text,plan,cfg),'Held incomplete source proof');eq(a.v2221FocusedReferenceActivation(incompleteCaptionMask,cfg),null,'No activation through an incomplete mask');return {changed:false,outputSha256:sha(plan.text)};
});

// Exact additional native pairs: integer text plus Cite, selector fallback,
// and title text with both canonical release fields explicitly supplied.
fixture('county-integer1234-with-census','Info/Condado dos Estados Unidos','população','|censo_data=2020',true,cfg,'1234<ref name="A">Fonte.</ref>');
fixture('county-integer4567-with-census','Info/Condado dos Estados Unidos','população','|censo_data=2020',true,cfg,'4567<ref name="A">Fonte.</ref>');
fixture('county-comma-is-not-interpreted-as-locale','Info/Condado dos Estados Unidos','população','|censo_data=2020',false,cfg,'1,234<ref name="A">Fonte.</ref>');
fixture('county-decimal-is-not-interpreted-as-locale','Info/Condado dos Estados Unidos','população','|censo_data=2020',false,cfg,'12.5<ref name="A">Fonte.</ref>');
fixture('county-area-requires-separate-density-proof','Info/Condado dos Estados Unidos','população','|censo_data=2020|área=100',false,cfg,'1234<ref name="A">Fonte.</ref>');
fixture('county-density-requires-separate-proof','Info/Condado dos Estados Unidos','população','|censo_data=2020|densidade=12',false,cfg,'1234<ref name="A">Fonte.</ref>');
fixture('county-invalid-census-held','Info/Condado dos Estados Unidos','população','|censo_data=20x0',false,cfg,'1234<ref name="A">Fonte.</ref>');
fixture('county-conflicting-census-held','Info/Condado dos Estados Unidos','população','|censo_data=2020|censo_ano=2010',false,cfg,'1234<ref name="A">Fonte.</ref>');
fixture('county-filled-population-conflict-held','Info/Condado dos Estados Unidos','população','|censo_data=2020|populacao=9876',false,cfg,'1234<ref name="A">Fonte.</ref>');
fixture('selector-native-status-fallback','Info/Taxonomia','status_system','',true);
fixture('selector-native-alternative-source-key','Info/Taxonomia','estado_sistema','',true);
fixture('selector-filled-canonical-conflict-held','Info/Taxonomia','status_system','|sistema_estado=IUCN3.1',false);
fixture('selector-specific-group-held','Info/Taxonomia','status_system','',false,cfg,'Valor preservado<ref group="nota">Fonte.</ref>');
fixture('selector-unknown-value-producer-held','Info/Taxonomia','estado_sistema','',false,cfg,'{{Produtor desconhecido}}'+value);
const title=(id,extra,want)=>fixture(id,'Info/Software','title',extra,want,cfg,value,true);
title('software-title-two-canonical-versions','|última_versão=1.0|versão_beta=2.0',true);
title('software-title-two-other-literal-versions','|última_versão=3.4|versão_beta=5.6',true);
title('software-title-missing-both-versions','',false);
title('software-title-missing-stable','|versão_beta=2.0',false);
title('software-title-missing-beta','|última_versão=1.0',false);
title('software-title-empty-stable','|última_versão= |versão_beta=2.0',false);
title('software-title-empty-beta','|última_versão=1.0|versão_beta= ',false);
title('software-title-noncanonical-stable-alias','|última versão=1.0|versão_beta=2.0',false);
title('software-title-noncanonical-beta-alias','|última_versão=1.0|versão beta=2.0',false);
title('software-title-empty-name-is-not-absent','|última_versão=1.0|versão_beta=2.0|nome= ',false);
title('software-title-filled-name-conflict','|última_versão=1.0|versão_beta=2.0|nome=Outro nome',false);
title('software-title-empty-layout-is-not-absent','|última_versão=1.0|versão_beta=2.0|layout_versão= ',false);
title('software-title-stacked-layout-held','|última_versão=1.0|versão_beta=2.0|layout_versão=empilhado',false);
title('software-title-discontinued-held','|última_versão=1.0|versão_beta=2.0|descontinuado=sim',false);
title('software-title-unknown-stable-producer','|última_versão={{Produtor desconhecido}}|versão_beta=2.0',false);
title('software-title-unknown-beta-producer','|última_versão=1.0|versão_beta={{Produtor desconhecido}}',false);

// Native #if truth differs from raw nonempty source. Se vazio can skip a known
// false value, while a parameter default selects the first physically present
// key. These cases preserve the exact raw argument bytes in the mapped plan.
function contextFixture(id,owner,key,extra,want){
 fixture(id,owner,key,extra,want);
 const input=source(owner,key,extra),native=data.nativeReferenceConsumers.find(r=>r.owner===owner&&r.sourceKeys.includes(key));
 capture(id+'/context','raw-native-context-integrity',input,()=>{
  const plan=a.v2221FocusedReferencePrerequisitePlan(input,cfg),before=boxFor(input),node=a.v2221FocusedNodes(plan.text,cfg).find(n=>a.v2221InfoboxRead(plan.text.slice(n.start,n.end))?.title===owner);
  ok(node,'Complete native owner remains');const after=a.v2221InfoboxRead(plan.text.slice(node.start,node.end));
  eq(JSON.stringify(after.fields.map(f=>[f.key,f.value])),JSON.stringify(before.fields.map(f=>[want&&f.key===key?native.key:f.key,f.value])),'All field values and unrelated keys remain byte exact');return {changed:want,outputSha256:sha(plan.text)};
 });
}
contextFixture('football-country-comment-only-false','Info/Futebolista','cidade_morte','|morte_país=<!-- vazio -->',false);
contextFixture('football-country-literal-and-comment-true','Info/Futebolista','cidade_morte','|morte_país=Brasil<!-- retido -->',true);
contextFixture('football-country-template-only-unknown','Info/Futebolista','cidade_morte','|morte_país={{Produtor desconhecido}}|paisdamorte=Brasil',false);
contextFixture('football-country-reference-only-unknown','Info/Futebolista','cidade_morte','|morte_país=<ref name="B">Outra fonte.</ref>|paisdamorte=Brasil',false);
contextFixture('football-country-reference-needs-own-consumer','Info/Futebolista','cidade_morte','|morte_país=Brasil<ref name="B">Outra fonte.</ref>',false);
contextFixture('football-country-comment-primary-does-not-select-fallback','Info/Futebolista','cidade_morte','|morte_país=<!-- vazio -->|paisdamorte=Brasil',false);
contextFixture('football-country-nowiki-empty-is-native-true','Info/Futebolista','cidade_morte','|morte_país=<nowiki/>',true);
contextFixture('football-country-entity-space-is-native-true','Info/Futebolista','cidade_morte','|morte_país=&#32;',true);
contextFixture('software-release-comment-false-uses-fallback','Info/Software','latest release date','|última_versão=<!-- vazio -->|última versão=1.0',true);
contextFixture('software-release-unknown-first-does-not-use-fallback','Info/Software','latest release date','|última_versão={{Produtor desconhecido}}|última versão=1.0',false);
contextFixture('software-beta-comment-false-uses-fallback','Info/Software','data_da_versão_beta','|versão_beta=<!-- vazio -->|versão beta=2.0',true);
contextFixture('software-beta-unknown-first-does-not-use-fallback','Info/Software','data_da_versão_beta','|versão_beta=<ref name="B">Outra fonte.</ref>|versão beta=2.0',false);
contextFixture('football-unrelated-nbsp-key-preserved','Info/Futebolista','cidade_morte','|morte_país=Brasil|desconhecido\u00a0=Literal retido',true);
contextFixture('football-nbsp-country-shadow-held','Info/Futebolista','cidade_morte','|morte_país\u00a0=Brasil',false);
contextFixture('football-nbsp-higher-location-shadow-held','Info/Futebolista','cidade_morte','|morte_país=Brasil|morte_local\u00a0=',false);
contextFixture('football-nbsp-target-shadow-held','Info/Futebolista','cidade_morte','|morte_país=Brasil|morte_cidade\u00a0=',false);
contextFixture('software-nbsp-release-shadow-held','Info/Software','latest release date','|última_versão\u00a0=1.0',false);
const unclosedCountry=source('Info/Futebolista','cidade_morte','|morte_país=<!-- vazio');
capture('football-country-unclosed-comment-held','source-plan-and-proof',unclosedCountry,()=>{const plan=a.v2221FocusedReferencePrerequisitePlan(unclosedCountry,cfg);eq(plan.text,unclosedCountry,'An unclosed native context cannot authorize repair');eq(plan.edits.length,0,'No writes through an unclosed comment');ok(a.v2221FocusedReferencePrerequisiteProof(unclosedCountry,plan.text,plan,cfg),'Held incomplete context proof');return {changed:false,outputSha256:sha(plan.text)};});
for(const [id,literal,state]of [
 ['empty',' ','false'],['comment','<!-- vazio -->','false'],['comments-only',' <!-- um --><!-- dois --> ','false'],
 ['mixed-comment','Brasil<!-- retido -->','true'],['unclosed-comment','<!-- vazio','unknown'],['stray-comment-end','-->','unknown'],
 ['empty-nowiki','<nowiki/>','true'],['numeric-space','&#32;','true'],['named-space','&nbsp;','true'],
 ['template-only','{{Produtor desconhecido}}','unknown'],['reference-only','<ref name="B">Outra fonte.</ref>','unknown'],
 ['literal-plus-reference','Brasil<ref name="B">Outra fonte.</ref>','true'],['literal-plus-template','Brasil{{Produtor desconhecido}}','true'],
 ['unclosed-nowiki','<nowiki>literal','unknown']
])capture('branch-truth/'+id,'native-branch-truth-only',literal,()=>{eq(a.v2221FocusedBranchTruth(literal).state,state,'Exact native branch state, without claiming complete composition eligibility');return {state};});

for(const [owner,key,inputKey,extra,literal,kind,role]of [
 ['Info/Condado dos Estados Unidos','populacao','população','|censo_data=2020','1234<ref name="A">Fonte.</ref>','native-integer-reference-format','native-number-reference-text'],
 ['Info/Taxonomia','sistema_estado','status_system','',value,'native-selector-literal-fallback','native-selector-reference-text']
]){
 const input=source(owner,inputKey,extra,literal),finite=record(owner,key);
 capture(owner+'/'+key+'/actual-native-value-proof-metadata','actual-finite-metadata',input,()=>{
  eq(finite.role,role,'Exact native typed role');eq(finite.reader.valueProof.kind,kind,'Exact source-backed native value proof kind');ok(/^[a-f0-9]{64}$/.test(finite.reader.valueProof.nativePairSha256),'Actual native pair has a pinned SHA256');ok(finite.reader.valueProof.dependencies.length>0,'Actual native dependencies supplied');
  const box=boxFor(input),field=box.fields.find(f=>f.key===inputKey);ok(a.v2221FocusedReferenceConsumer(finite,box,field),'Actual finite record accepts this exact fixed literal');
  for(const mutate of [r=>delete r.reader.valueProof,r=>r.reader.valueProof.kind='unproved-value-conversion',r=>r.reader.valueProof.nativePairSha256='bad',r=>r.reader.valueProof.dependencies=[],r=>r.reader.valueProof.dependencies=['Módulo:Produtor desconhecido']]){const bad=copy(finite);mutate(bad);eq(a.v2221FocusedReferenceConsumer(bad,box,field),false,'Missing/malformed kind, native hash or dependency proof refused');}
  const activation=a.v2221FocusedReferenceActivation(input,cfg);ok(activation,'Finite source-bound typed activation');const packet=copy(activation.packet);packet.fields[0].consumption.role='direct-visible-native-text';ok(!a.v2221FocusedActivatedReferenceAllows(activation.mapped,cfg,packet),'Typed role cannot be changed to an invented direct-text role');return {role,valueProofKind:kind,nativePairSha256:finite.reader.valueProof.nativePairSha256};
 });
}

// Exercise the predicate language independently of any additional field contract.
const predicateInput=source('Info/Filme','iamgem_legenda'),caption=record('Info/Filme','imagem_legenda');
function predicate(id,mutate,extra,want){capture(id,'predicate-schema-only',null,()=>{const row=copy(caption);mutate(row);const accepted=a.v2221FocusedReferenceConsumer(row,boxFor(source('Info/Filme','iamgem_legenda',extra)));eq(accepted,want,id);return {accepted};});}
predicate('predicate-absent-key-present-empty',r=>r.reader.conditions={absentKeys:['legenda']},'|legenda= ',false);
predicate('predicate-empty-or-absent-accepts-empty',r=>r.reader.conditions={emptyOrAbsentKeys:['legenda']},'|legenda= ',true);
predicate('predicate-empty-or-absent-rejects-filled',r=>r.reader.conditions={emptyOrAbsentKeys:['legenda']},'|legenda=Outra',false);
predicate('predicate-any-groups-are-and-of-or',r=>r.reader.conditions={anyNonempty:[['imagem','Imagem'],['legenda','descrição']]},'|imagem=Albert Einstein Head.jpg',false);
predicate('predicate-any-groups-both-satisfied',r=>r.reader.conditions={anyNonempty:[['imagem','Imagem'],['legenda','descrição']]},'|Imagem=Albert Einstein Head.jpg|descrição=Contexto literal',true);
predicate('predicate-first-present-empty-masks-later',r=>r.reader.conditions={selectedNonempty:[['legenda','descrição']]},'|legenda= |descrição=Contexto literal',false);
predicate('predicate-first-present-fallback-selected',r=>r.reader.conditions={selectedNonempty:[['legenda','descrição']]},'|descrição=Contexto literal',true);
predicate('predicate-first-present-comment-masks-later',r=>r.reader.conditions={selectedNonempty:[['legenda','descrição']]},'|legenda=<!-- vazio -->|descrição=Contexto literal',false);
predicate('predicate-first-present-unknown-masks-later',r=>r.reader.conditions={selectedNonempty:[['legenda','descrição']]},'|legenda={{Produtor desconhecido}}|descrição=Contexto literal',false);
predicate('predicate-first-nonempty-comment-uses-later',r=>r.reader.conditions={firstNonempty:[['legenda','descrição']]},'|legenda=<!-- vazio -->|descrição=Contexto literal',true);
predicate('predicate-first-nonempty-unknown-does-not-use-later',r=>r.reader.conditions={firstNonempty:[['legenda','descrição']]},'|legenda={{Produtor desconhecido}}|descrição=Contexto literal',false);
predicate('predicate-any-true-can-satisfy-unknown-or',r=>r.reader.conditions={anyNonempty:[['legenda','descrição']]},'|legenda={{Produtor desconhecido}}|descrição=Contexto literal',true);
predicate('predicate-any-comment-is-not-true',r=>r.reader.conditions={anyNonempty:[['legenda','descrição']]},'|legenda=<!-- vazio -->',false);
predicate('predicate-empty-or-absent-comment-is-false',r=>r.reader.conditions={emptyOrAbsentKeys:['legenda']},'|legenda=<!-- vazio -->',true);
predicate('predicate-absent-comment-is-physically-present',r=>r.reader.conditions={absentKeys:['legenda']},'|legenda=<!-- vazio -->',false);
predicate('predicate-empty-or-absent-template-is-unknown',r=>r.reader.conditions={emptyOrAbsentKeys:['legenda']},'|legenda={{Produtor desconhecido}}',false);
predicate('predicate-literal-equals-or-absent-absent',r=>r.reader.conditions={literalEqualsOrAbsent:[{key:'layout_versão',values:['simples']}]},'',true);
predicate('predicate-literal-equals-or-absent-exact',r=>r.reader.conditions={literalEqualsOrAbsent:[{key:'layout_versão',values:['simples']}]},'|layout_versão=simples',true);
predicate('predicate-literal-equals-or-absent-wrong-value',r=>r.reader.conditions={literalEqualsOrAbsent:[{key:'layout_versão',values:['simples']}]},'|layout_versão=empilhado',false);
predicate('predicate-literal-equals-or-absent-empty-not-listed',r=>r.reader.conditions={literalEqualsOrAbsent:[{key:'layout_versão',values:['simples']}]},'|layout_versão= ',false);
predicate('predicate-literal-values-are-case-sensitive',r=>r.reader.conditions={literalEqualsOrAbsent:[{key:'layout_versão',values:['simples']}]},'|layout_versão=Simples',false);
for(const [id,mutate]of [
 ['unknown-condition',r=>r.reader.conditions={unsupportedGuard:true}],['malformed-absent-keys',r=>r.reader.conditions={absentKeys:'legenda'}],['empty-any-group',r=>r.reader.conditions={anyNonempty:[[]]}],['empty-selected-chain',r=>r.reader.conditions={selectedNonempty:[[]]}],['malformed-literal-values',r=>r.reader.conditions={literalEqualsOrAbsent:[{key:'layout_versão',values:'simples'}]}],
 ['unknown-role',r=>r.role='unproved-reference-output'],['literal-reference-proof-disabled',r=>r.reader.literalDefaultRefs=false],['malformed-native-pin',r=>r.native.sha256='bad'],['missing-caption-registration-proof',r=>delete r.reader.registrationProof],['wrong-caption-registration-kind',r=>r.reader.registrationProof.kind='direct-visible-output'],['bad-caption-pair-hash',r=>r.reader.registrationProof.nativePairSha256='bad'],['missing-caption-dependencies',r=>r.reader.registrationProof.dependencies=[]],['unproved-caption-dependency',r=>r.reader.registrationProof.dependencies=['Módulo:Produtor desconhecido']]
])predicate('predicate-rejects/'+id,mutate,'',false);

capture('activation-role-and-source-packet-tamper','source-bound-activation-packet',predicateInput,()=>{
 const activation=a.v2221FocusedReferenceActivation(predicateInput,cfg);ok(activation,'Caption source activation');eq(activation.packet.fields[0].consumption.role,'native-caption-reference-registration','Exact registration role in packet');
 for(const mutate of [p=>p.fields[0].consumption.role='direct-visible-native-text',p=>p.fields[0].consumption.conditions={anyNonempty:[['imagem']]},p=>p.owner.native.revision++,p=>p.fields[0].native.sha256='0'.repeat(64),p=>p.fields[0].valueHash='wrong',p=>p.originalSource+=' ',p=>p.referenceInventoryHash='wrong']){const packet=copy(activation.packet);mutate(packet);ok(!a.v2221FocusedActivatedReferenceAllows(activation.mapped,cfg,packet),'Changed role/source/native/reference proof rejected');}
 ok(!a.v2221FocusedActivatedReferenceAllows(activation.mapped,{...cfg,references:false},activation.packet),'Packet never overrides disabled reference option');return {};
});
capture('fixture-and-contract-inputs-unchanged','input-integrity',null,()=>{eq(sha(fs.readFileSync(dataFile)),sha(dataRaw),'Native contract data unchanged during test');eq(new Set(rows.map(r=>r.id)).size,rows.length,'Unique exhaustive case IDs');return {};});
const report={kind:'finite-native-consumer-conditions-and-reference-registration-guards',status:failures.length?'failed':'passed',mode:loaded.receipt.mode,runtimeSha256:loaded.receipt.runtimeSha256||null,testSha256:sha(fs.readFileSync(__filename)),consumerDataSha256:sha(dataRaw),consumerTargets:data.nativeReferenceConsumers.length,cases:rows.length,checks,calculations,rows,failures,wikipediaWrites:0,networkRequests:0,historicalQualifications:0};
if(process.env.REVISAWIKI_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...report,rows:undefined}));if(failures.length)process.exitCode=1;
