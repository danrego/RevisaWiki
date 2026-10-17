'use strict';
// Independent tests execute the distributed programs as delivered. The fixtures
// are fictional, the module is never rewritten, and no network API is supplied.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js'].map(name=>path.join(base,'dist/2.15.1',name));
const report={version:'2.15.1',kind:'independent-adversarial-release',status:'passed',cases:0,checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0,runtimeInjection:[]};
const eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(value,message)=>{report.checks++;assert(value,message);};
const parity=new Map();
function check(bundle,id,run){report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(base,'<checkout>')});}}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file),title='Pessoa de controle',name="'''"+title+"'''",tail='\n\n== Biografia ==\nTexto preservado.\n\n{{Referências}}';
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:title,contentModel:'wikitext',minorBaseConfirmed:true};
 const narrow={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:title,contentModel:'wikitext',infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticParameterNames:true,automaticBiographyLead:true,automaticInfoboxOrder:true,automaticFieldSyntax:true,automaticInfoboxImages:true,minorBaseConfirmed:true};
 const birth='{{Dni|2|3|1930|si}}',death='{{Morte|5|6|2010}}',born='{{DataExt|2|3|1930}}',died='{{DataExt|5|6|2010}}',city='[[Cidade de controle]]',other='[[Outra cidade]]';
 const box=fields=>'{{Info/Biografia|nome='+title+fields+'}}',page=(fields,opening=name+' é uma escritora.')=>box(fields)+'\n'+opening+tail;
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file))});eq(api.version,'2.15.1','The candidate identifies the requested version');
 const calc=(source,options={})=>api.calculate({kind:'adjust',source,options:{...cfg,...options}});
 function valid(source,result,options={}){
  const settings={...cfg,...options};eq(api.safeComposition(source,result.text,settings),'','The complete result satisfies the selection safety gate');
  eq(result.preservation,[],'No rejected or lost content is hidden behind the result');
  eq(api.preservationAudit(source,result.text,settings),[],'The independent preservation gate also accepts the complete endpoint');
  eq(calc(result.text,options).text,result.text,'One click reaches an idempotent endpoint');
  eq(api.composeChanges(source,result.hunks),result.text,'Accepting all changes reproduces the final endpoint');
  eq(api.composeChanges(source,result.hunks.map(hunk=>({...hunk,accepted:false}))),source,'Rejecting all changes returns the exact source');
  const key=sha(source+'\0'+JSON.stringify(options)),digest=sha(result.text);if(parity.has(key))eq(digest,parity.get(key),'The two actual distributions return identical contents');else parity.set(key,digest);
 }
 function count(result,id){return result.changes.find(change=>change.id===id)?.count||0;}
 function lead(result){return result.text.slice(result.text.indexOf('\n'+name)+1).split('\n')[0];}
 const facts='|nascimento_data='+birth+'<ref name="data-nascimento">Data exata.</ref>|nascimento_local='+city+'<ref name="local-nascimento">Local exato.</ref>|morte_data='+death+'<ref name="data-morte">Data final exata.</ref>|morte_local='+other+'<ref name="local-morte">Local final exato.</ref>';
 check(bundle,'default pipeline copies four independent referenced facts',()=>{
  const source=page(facts,name+' foi uma escritora.'),result=calc(source);valid(source,result);
  eq(count(result,'biographyLeadBirth'),2,'Date and place of birth count as two distinct additions');eq(count(result,'biographyLeadDeath'),2,'Date and place of death count as two distinct additions');
  const opening=lead(result);for(const item of [born,died,city,other,'name="data-nascimento"','name="local-nascimento"','name="data-morte"','name="local-morte"'])ok(opening.includes(item),'The opening retains each individually sourced fact: '+item);
  for(const body of ['Data exata.','Local exato.','Data final exata.','Local final exato.'])eq(result.text.split(body).length-1,1,'Named source bodies remain defined exactly once');
  ok(api.v2151BiographyLeadPlan(source,cfg).text.includes(box(facts)),'The new fact-copying rule leaves its own source box byte-identical');eq(result.minorCheck.eligible,false,'Adding biographical information is never automatically marked as minor');
  const kinds=result.changes.map(change=>change.id),topics=api.summaryTopics(source,result.text,kinds);ok(topics.some(topic=>/identifica|nascimento|biogr/i.test(topic)),'The summary names the added initial identification');
  const retained=api.v211RetainedAdjustments(source,result.text,kinds);ok(retained.exact,'The displayed retained count can be proved for the complete result');eq(retained.count,result.changes.reduce((sum,change)=>sum+change.count,0),'The displayed total includes every retained atomic operation');
 });
 check(bundle,'new fact cannot be accepted through a forged reference',()=>{
  const source=page('|nascimento_data='+birth+'<ref name="origem">Fonte exata.</ref>'),result=calc(source);valid(source,result);
  for(const changed of [result.text.replace('DataExt|2|3|1930','DataExt|3|3|1930'),result.text.replace('Fonte exata.','Fonte diferente.'),result.text.replace('<ref name="origem" />','<ref name="outra" />')])ok(api.safeComposition(source,changed,cfg),'Changed copied facts and references fail the selection gate');
  const plan=api.v2151BiographyLeadPlan(source,cfg);ok(plan.edits.length,'The control actually creates a fact proof');
  eq(api.v2151BiographyLeadProof(source,plan.text,{...plan,edits:plan.edits.map(edit=>({...edit,proof:{...edit.proof,copiedFacts:[]}}))},cfg),false,'A forged fact witness cannot authorize copied information');
 });
 check(bundle,'globally valid source names cannot be exchanged between copied facts',()=>{
  const source=page(facts,name+' foi uma escritora.'),result=calc(source),at=result.text.indexOf('\n'+name),prefix=result.text.slice(0,at),opening=result.text.slice(at);
  ok(at>=0,'The control contains its actual biographical opening');
  for(const [find,replacement] of [
   ['<ref name="data-nascimento" />','<ref name="local-nascimento" />'],
   ['<ref name="data-morte" />','<ref name="local-morte" />'],
   [city,other],
   [died,'{{DataExt|6|6|2010}}']
  ]){
   ok(opening.includes(find),'The intended generated source fragment actually exists');
   const altered=prefix+opening.replace(find,replacement);ok(api.safeComposition(source,altered,cfg),'Source-bound identification refuses a forged date, place or citation association');
  }
 });
 check(bundle,'one reference at the end of an existing reversed tuple stays at its end',()=>{
  const source=page('',name+' ('+birth+', '+city+'<ref name="tupla">Fonte de toda a identificação.</ref>) é uma escritora.'),plan=api.v2151BiographyLeadPlan(source,cfg);
  const unchanged=plan.text===source,normalized=plan.text.includes(name+' ('+city+', '+birth+'<ref name="tupla">Fonte de toda a identificação.</ref>)');
  ok(unchanged||normalized,'A whole-tuple citation may be preserved or moved with the whole tuple, never narrowed to its place');
  const result=calc(source);valid(source,result);eq(result.text.match(/Fonte de toda a identificação\./g)?.length,1,'The existing source definition is never duplicated');
 });
 for(const [id,fields,opening] of [
  ['an unsourced date','|nascimento_data='+birth,name+' é uma escritora.'],
  ['a reference only for the place','|nascimento_data='+birth+'|nascimento_local='+city+'<ref>Local.</ref>',name+' é uma escritora.'],
  ['an undefined name','|nascimento_data='+birth+'<ref name="ausente" />',name+' é uma escritora.'],
  ['conflicting named sources','|nascimento_data='+birth+'<ref name="origem">A.</ref>|notas=<ref name="origem">B.</ref>',name+' é uma escritora.'],
  ['nonliteral reference name','|nascimento_data='+birth+'<ref name="{{PAGENAME}}">A.</ref>',name+' é uma escritora.'],
  ['foreign calendar','|nascimento_data='+birth+'<ref>A.</ref>|calendário=juliano',name+' é uma escritora.'],
  ['incomplete date','|nascimento_data=março de 1930<ref>A.</ref>',name+' é uma escritora.'],
  ['approximate date','|nascimento_data=cerca de 1930<ref>A.</ref>',name+' é uma escritora.'],
  ['conflicting birth alias','|nascimento_data='+birth+'<ref>A.</ref>|data_nascimento={{Dni|3|3|1930}}<ref>B.</ref>',name+' é uma escritora.'],
  ['empty higher precedence alias','|nascimento_data=|data_nascimento='+birth+'<ref>A.</ref>',name+' é uma escritora.'],
  ['contradictory death status','|nascimento_data='+birth+'<ref>A.</ref>|morte_data='+death+'<ref>B.</ref>',name+' é uma escritora.'],
  ['death before birth','|nascimento_data='+birth+'<ref>A.</ref>|morte_data={{Morte|1|1|1900}}<ref>B.</ref>',name+' foi uma escritora.'],
  ['contradictory existing date','|nascimento_data='+birth+'<ref>A.</ref>',name+' ({{DataExt|3|3|1930}}) é uma escritora.'],
  ['contradictory existing place','|nascimento_local='+city+'<ref>A.</ref>|morte_data='+death+'<ref>B.</ref>',name+' ('+other+', '+birth+') foi uma escritora.'],
  ['mixed proper name template','|nascimento_data='+birth+'<ref>A.</ref>',"'''{{lang|pt|Pessoa de controle}}''' é uma escritora."]
 ])check(bundle,'conservative factual refusal: '+id,()=>{
  const source=page(fields,opening),plan=api.v2151BiographyLeadPlan(source,cfg);eq(plan.text,source,'An unproven fact never enters the opening');
  const result=calc(source);valid(source,result);eq(count(result,'biographyLeadBirth')+count(result,'biographyLeadDeath'),0,'No copied-fact adjustment is counted when facts are not transferred');
 });
 for(const explicitName of ['Outra pessoa','Nome público diferente','Pessoa de controle da cidade','{{lang|pt|Pessoa de controle}}','[[Outra pessoa|Pessoa de controle]]'])check(bundle,'uncertain identity of the source box '+sha(explicitName).slice(0,10),()=>{
  const source=page('|nascimento_data='+birth+'<ref>Fonte exata.</ref>').replace('|nome='+title,'|nome='+explicitName),plan=api.v2151BiographyLeadPlan(source,cfg);
  eq(plan.text,source,'A name mismatch or unknown alias prevents copying one person\'s dates into another opening');
  const result=calc(source);valid(source,result);eq(count(result,'biographyLeadBirth'),0,'No birth information is copied without a confirmed person identity');
 });
 for(const key of ['nascimento_cidade','cidade natal','localnasc'])check(bundle,'accepted but undisplayed native birthplace '+key,()=>{
  const source=page('|'+key+'=[[Cidade escondida]]<ref>Fonte do campo ignorado.</ref>',name+' ('+birth+') é uma escritora.');
  eq(api.v2151BiographyLeadPlan(source,cfg).text,source,'A checker-only or condition-only birthplace does not become a newly visible biographical fact');
 });
 for(const template of ['Info/Futebol','Info/Artista marcial','Info/Enxadrista'])for(const main of ['[[Cidade de controle]]<ref>Fonte do campo prioritário.</ref>',''])check(bundle,'a native spaced place alias has precedence '+template+' '+sha(main).slice(0,6),()=>{
  const source='{{'+template+'|nome='+title+'|local de nascimento='+main+'|nascimento_local=[[Cidade escondida]]<ref>Fonte da alternativa.</ref>}}\n'+name+' ('+birth+') é uma escritora.'+tail;
  eq(api.v2151BiographyLeadPlan(source,cfg).text,source,'A present higher-priority native parameter, including an empty one, prevents copying a hidden fallback');
 });
 for(const template of ['Info/Boxeador','Info/Modelo'])check(bundle,'burial can shadow a death alias but is never a death place '+template,()=>{
  const source='{{'+template+'|nome='+title+'|enterro_local=[[Local de sepultamento]]<ref>Fonte do enterro.</ref>|local_falecimento=[[Cidade escondida]]<ref>Fonte da alternativa.</ref>}}\n'+name+' ('+birth+' – '+death+') foi uma escritora.'+tail;
  eq(api.v2151BiographyLeadPlan(source,cfg).text,source,'A burial value never authorizes a death location or a lower-priority hidden location');
 });
 for(const template of ['Info/Nadador','Info/Astronauta','Info/Ciclista','Info/Motociclista','Info/Surfista','Info/Treinador de Natação','Info/Personalidade de mídia social','Info/Arquiteto','Info/Artista'])for(const key of ['local_nascimento','nascimento_local'])check(bundle,'unproved dynamic or forwarding family does not transfer facts '+template+' '+key,()=>{
  const source='{{'+template+'|nome='+title+'|'+key+'=[[Cidade de controle]]<ref>Fonte do local.</ref>}}\n'+name+' ('+birth+') é uma escritora.'+tail;
  eq(api.v2151BiographyLeadPlan(source,cfg).text,source,'A family or accepted parameter list alone cannot authorize a wrapper-dependent factual transfer');
 });
 for(const key of ['sepultamento','enterro','enterro_local','resting_place'])check(bundle,'burial value stays unchanged while other features run: '+key,()=>{
  const frozen='|'+key+' = [[Local de controle]]<ref name="local-final">Fonte de sepultamento.</ref>',source=page('|nascimento_data='+birth+'<ref>Data.</ref>'+frozen,'Pessoa de controle é uma escritora.'),result=calc(source);valid(source,result);ok(result.text.includes(frozen),'The exact original burial parameter and value remain untouched');
 });
 for(const source of ['Pessoa de controle é uma escritora.','[[Pessoa de controle]] é uma escritora.',"'''[[Pessoa de controle]]''' é uma escritora."])
 check(bundle,'exact literal initial subject '+sha(source).slice(0,10),()=>{
  const result=calc(source,narrow);eq(result.text,name+' é uma escritora.','The precise first subject is formatted without changing the prose');valid(source,result,narrow);
  eq(count(result,'biographyLeadBold'),source.startsWith("'''")?0:1,'An already bold subject is not counted again');eq(count(result,'biographyLeadSelfLink'),source.includes('[[')?1:0,'Only an actual self-link removal is counted');
 });
 for(const source of ['Pessoa de controle, autora, publicou uma obra.','[[Outro assunto|Pessoa de controle]] é uma escritora.','{{lang|pt|Pessoa de controle}} é uma escritora.',' Pessoa de controle é uma escritora.','<nowiki>Pessoa de controle é uma escritora.</nowiki>','<syntaxhighlight lang="wikitext">Pessoa de controle é uma escritora.</syntaxhighlight>','<!-- Pessoa de controle é uma escritora. -->'])
 check(bundle,'protected initial subject '+sha(source).slice(0,10),()=>{const result=calc(source,narrow);eq(result.text,source,'Examples, alternate subjects and ambiguous grammar remain literal');valid(source,result,narrow);});
 check(bundle,'safe field syntax repair preserves a name value containing an equals sign',()=>{
  const source=box('|ocupação＝escritora = editora')+'\n'+name+' é uma escritora.',result=calc(source,narrow);eq(result.text,source.replace('ocupação＝','ocupação='),'Only the recognized field separator is changed');eq(count(result,'fieldFullwidthEquals'),1,'One repaired field separator counts once');valid(source,result,narrow);
 });
 check(bundle,'a repaired date key unlocks the opening and relocation in one click',()=>{
  const source='Pessoa de controle é uma escritora.\n\n'+box('|nascimento_\u200Bdata＝'+birth+'<ref>Data exata.</ref>')+tail,result=calc(source);
  valid(source,result);for(const id of ['biographyLeadBold','infoboxLeadOrder','fieldInvisibleKey','fieldFullwidthEquals','biographyLeadBirth'])eq(count(result,id),1,'Each completed dependent change is counted once: '+id);
  ok(result.text.startsWith(box('|nascimento_data='+birth+'<ref>Data exata.</ref>')),'The literal repaired box appears first');ok(result.text.includes(name+' ('+born+'<ref>Data exata.</ref>) é uma escritora.'),'The same click copies the individually referenced repaired date');eq(result.minorCheck.eligible,false,'Dependent formatting never hides the substantive information transfer');
 });
 for(const [id,sourceBox] of [
  ['foreign person and foreign date','{{Infobox person|name='+title+'|birth_date={{Birth date|1930|3|2}}<ref name="origem">Data original.</ref>}}'],
  ['native box and foreign date key',box('|birth_date={{Birth date|1930|3|2}}<ref name="origem">Data original.</ref>')],
  ['native key and foreign date value',box('|nascimento_data={{Birth date|1930|3|2}}<ref name="origem">Data original.</ref>')],
  ['native key and foreign age date',box('|nascimento_data={{Birth date and age|1930|3|2}}<ref name="origem">Data original.</ref>')]
 ])check(bundle,'one click prepares and copies the original bound date: '+id,()=>{
  const source=sourceBox+'\n'+name+' é uma escritora.'+tail,result=calc(source);valid(source,result);
  ok(result.text.includes(name+' ('+born+'<ref name="origem" />) é uma escritora.'),'The original exact birth date and its individual named source reach the lead immediately');
  eq(result.text.split('Data original.').length-1,1,'The imported original source body is defined once');
  eq(count(result,'biographyLeadBirth'),1,'One newly visible birth fact counts once after source preparation');
  eq(result.minorCheck.eligible,false,'Translation and syntax preparation cannot make copied biographical information minor');
  const topics=api.summaryTopics(source,result.text,result.changes.map(change=>change.id));
  ok(topics.includes('identificação inicial'),'The public summary includes the substantive initial identification after preparation');
  const plan=api.v2151BiographyPreparationPlan(source,cfg);eq(plan.edits.length,1,'A single complete source-box transaction is proved');
  eq(api.v2151BiographyPreparationProof(source,plan.text,plan,cfg),true,'The preparation proof regenerates the source-bound endpoint');
  const originalFact=plan.edits[0].proof.sourceFacts[0];eq(source.slice(originalFact.originalStart,originalFact.originalEnd),originalFact.originalValue,'The copied fact maps to its exact pre-migration original coordinates');
  const fake=result.text.replace('DataExt|2|3|1930','DataExt|3|3|1930');ok(api.safeComposition(source,fake,cfg),'The combined import route cannot authorize a forged copied date');
 });
 for(const [id,fields,person] of [
  ['conflicting native date','|birth_date={{Birth date|1930|3|2}}<ref>A.</ref>|nascimento_data={{Dni|3|3|1930}}<ref>B.</ref>',title],
  ['explicitly empty higher native date','|birth_date={{Birth date|1930|3|2}}<ref>A.</ref>|nascimento_data=',title],
  ['different subject','|birth_date={{Birth date|1930|3|2}}<ref>A.</ref>','Outra pessoa'],
  ['explicitly empty native header','|name='+title+'|nascimento_data='+birth+'<ref>A.</ref>',''],
  ['undefined original named source','|birth_date={{Birth date|1930|3|2}}<ref name="ausente" />',title],
  ['two conflicting original source definitions','|birth_date={{Birth date|1930|3|2}}<ref name="origem">A.</ref>|notas=<ref name="origem">B.</ref>',title]
 ])check(bundle,'preparation never launders an unproved fact: '+id,()=>{
  const source='{{Info/Biografia|nome='+person+fields+'}}\n'+name+' é uma escritora.'+tail;
  const plan=api.v2151BiographyPreparationPlan(source,cfg);eq(plan.text,source,'The original conflict prevents the new preparation transaction');
  const result=calc(source);valid(source,result);eq(count(result,'biographyLeadBirth'),0,'No uncertain imported fact enters the opening through a later rule');
 });
 check(bundle,'an explicitly empty native place cannot be promoted from an imported alias later',()=>{
  const source=box('|nascimento_local=|birth_place='+city+'<ref>Local oculto.</ref>')+'\n'+name+' ('+birth+') é uma escritora.'+tail,
   plan=api.v2151BiographyPreparationPlan(source,cfg);
  eq(plan.text,source,'The original empty native place blocks the competing imported place');
  const result=calc(source);valid(source,result);eq(count(result,'biographyLeadBirth'),0,'A suppressed imported birthplace never becomes a copied fact later');
 });
 for(const key of ['alt','imagem_tamanho','imagem_legenda'])check(bundle,'preparation preserves an explicit empty image destination: '+key,()=>{
  const source='{{Info/Biografia|name='+title+'|image=[[File:Retrato.jpg|200px|alt=Uma pessoa|Legenda.]]|'+key+'=}}\n'+name+' é uma escritora.'+tail,
   plan=api.v2151BiographyPreparationPlan(source,cfg);
  ok(plan.text===source||plan.text.includes('|'+key+'='),'Preparation either declines or preserves the literal explicit native destination');
  if(plan.text!==source){
   const target=api.v2151PreparationFields(plan.text.slice(0,plan.text.indexOf('}}\n')+2)).filter(field=>field.key===key);
   eq(target.length,1,'Preparation cannot erase or duplicate an explicitly present destination');
   eq(target[0].value,'','Preparation cannot replace the explicitly empty destination before its own approved image rule');
  }
  const result=calc(source);valid(source,result);eq(count(result,'biographyLeadBirth')+count(result,'biographyLeadDeath'),0,'An image-only preparatory route adds no biographical facts');
 });
 check(bundle,'alias precedence collision blocks a hidden date key repair',()=>{
  const source=box('|nascimento_\u200Bdata='+birth+'<ref>A.</ref>|data_nascimento=')+'\n'+name+' é uma escritora.',plan=api.v2151FieldSyntaxPlan(source,cfg);eq(plan.text,source,'An equivalent field family prevents repair rather than overriding precedence');
 });
 for(const template of ['Info/Futebol','Info/Artista marcial','Info/Enxadrista'])check(bundle,'hidden native place key cannot override an occupied native alternative '+template,()=>{
  const source='{{'+template+'|nome='+title+'|local de \u200Bnascimento=[[Outra cidade]]|nascimento_local=[[Cidade de controle]]}}\n'+name+' é uma escritora.';
  eq(api.v2151FieldSyntaxPlan(source,cfg).text,source,'Actual displayed-role aliases, including spaced ones, share a collision group');
 });
 check(bundle,'legacy family base cannot enable an unreviewed political size repair',()=>{
  const source='{{Info/Senador do Império do Brasil|nome='+title+'|imagem-\u200Btamanho=350px|imagem_tamanho=200px}}\n'+name+' é uma escritora.';
  eq(api.v2151FieldSyntaxPlan(source,cfg).text,source,'A legacy biography family never overrides the actual political profile size contract');
 });
 check(bundle,'ALT source moves with image caption reference without duplication',()=>{
  const source=box('|imagem=[[Ficheiro:Retrato.jpg|200px|alt=Uma pessoa|Legenda<ref name="retrato">Fonte exata.</ref>]]')+'\n'+name+' é uma escritora.',result=calc(source,narrow);valid(source,result,narrow);
  for(const part of ['|imagem=Retrato.jpg','|alt=Uma pessoa','|imagem_tamanho=200px','|imagem_legenda=Legenda<ref name="retrato">Fonte exata.</ref>'])ok(result.text.includes(part),'The finite image contract preserves '+part);
  eq(result.text.split('Fonte exata.').length-1,1,'A moved caption definition occurs once');eq(count(result,'biographyImageAlt'),4,'The filename, ALT, size and caption changes are each counted');
 });
 for(const extra of ['|alt=Outro texto','|imagem_legenda=Outra legenda','|imagem_tamanho=350px','|alt=','|landscape=sim'])check(bundle,'conflicting image destination '+sha(extra).slice(0,10),()=>{
  const source=box('|imagem=[[Ficheiro:Retrato.jpg|200px|alt=Uma pessoa|Legenda]]'+extra)+'\n'+name+' é uma escritora.',plan=api.v2151BiographyImageAltPlan(source,cfg);
  if(extra==='|alt=')ok(plan.text!==source,'An explicitly empty compatible ALT field may be filled');else eq(plan.text,source,'Conflicting field contents are never silently replaced');
 });
 for(const template of ['Info/Senador do Império do Brasil','Info/Sacerdote','Info/Teólogo Cristão','Info/Ator pornográfico'])check(bundle,'a family base does not establish the pinned ALT contract '+template,()=>{
  const source='{{'+template+'|nome='+title+'|imagem=[[Ficheiro:Retrato.jpg|200px|alt=Uma pessoa|Legenda.]]}}\n'+name+' é uma escritora.';
  eq(api.v2151BiographyImageAltPlan(source,cfg).text,source,'Only explicit verified native profile titles can receive the new ALT field migration');
 });
 for(const indent of [' ','   '])check(bundle,'indentation and infobox placement '+indent.length,()=>{
  const lead=name+' é uma escritora.',source=lead+'\n\n'+indent+box('')+tail,result=calc(source,narrow);eq(result.text,box('')+'\n\n'+lead+tail,'The exact box and prose are reordered with only accidental indentation removed');valid(source,result,narrow);eq(count(result,'infoboxLeadOrder'),1,'The relocation counts once');eq(count(result,'infoboxIndentation'),1,'The indentation removal counts separately');
 });
 for(const wrapper of [value=>'<nowiki>'+value+'</nowiki>',value=>'<syntaxhighlight lang="wikitext">'+value+'</syntaxhighlight>',value=>'<!--'+value+'-->',value=>'{|\n|'+value+'\n|}'])check(bundle,'protected biography example '+sha(wrapper.toString()).slice(0,10),()=>{
  const source=wrapper(page('|nascimento_data='+birth+'<ref>Fonte.</ref>','Pessoa de controle é uma escritora.')),result=calc(source,narrow);eq(result.text,source,'A protected example cannot trigger the new biography rules');valid(source,result,narrow);
 });
 check(bundle,'no new noisy alert is emitted by a conservative field refusal',()=>{
  const source=page('|nascimento_data=cerca de 1930<ref>Data aproximada.</ref>'),result=calc(source);eq(result.warnings,[],'An ordinary conservative refusal needs no scary warning');eq(result.notApplied,[],'No redundant declined-adjustment category is introduced');
 });
}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
