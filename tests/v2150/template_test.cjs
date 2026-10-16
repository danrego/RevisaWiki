'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:['RevisaWiki_v2_15_0.js','RevisaWiki_v2_15_0_completo.js'].map(name=>path.join(root,'dist/2.15.0',name));
const contract=JSON.parse(fs.readFileSync(path.join(root,'src/v2_15/template_contracts.json'))).runtime;
const report={version:'2.15.0',kind:'template-definition-automation',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function test(bundle,id,run){try{run();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file);
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file)),version:api.version});
 const cfg={...api.defaults,namespaceNumber:10,pageTitle:'Predefinição:Modelo de controle',contentModel:'wikitext',autoPreview:false,
  templateReadableFormatting:false,minorBaseConfirmed:true};
 const prove=(source,expected,amount,options={})=>{
  const settings={...cfg,...options},plan=api.v215TemplateDefinitionPlan(source,settings),result=api.calculate({kind:'adjust',source,options:settings});
  eq(plan.text,expected,'The finite source-bound plan has the independent endpoint');
  eq(api.v215TemplateDefinitionProof(source,expected,plan,settings),true,'The source and each exact edit reproduce the proof');
  eq(result.text,expected,'The full engine applies the complete correction in one action');
  eq(result.preservation,[],'No protected-content preservation error');
  eq(api.safeComposition(source,expected,settings),'','Complete composition proof accepts the exact endpoint');
  eq(api.preservationAudit(source,expected,settings),[],'Independent preservation audit accepts the exact endpoint');
  eq(api.calculate({kind:'adjust',source:expected,options:settings}).text,expected,'Second action is idempotent');
  const counts=api.v211RetainedAdjustments(source,expected);eq(counts.exact,true,'Retained component count is exact');eq(counts.count,amount,'Every finite correction is counted');
  if(source!==expected){eq(result.minorCheck.eligible,false,'Template definitions retain the existing conservative minor-edit policy');
   eq(api.v215TemplateDefinitionProof(source+' ',expected,plan,settings),false,'A changed source cannot reuse the proof');
   eq(api.v215TemplateDefinitionProof(source,expected,{...plan,edits:[]},settings),false,'A forged edit list cannot reuse the proof');}
 };
 for(const pageTitle of ['Predefinição:Modelo de controle','Predefinição:Modelo de controle/doc'])test(bundle,'Worker option roundtrip '+pageTitle,()=>{
  const source=pageTitle.endsWith('/doc')?'<templatedata>{"params":{"a":{},},}</templatedata>':'{{#if :x|A|B}}',
   expected=pageTitle.endsWith('/doc')?'<templatedata>{"params":{"a":{}}}</templatedata>':'{{#if:x|A|B}}',
   configured=api.pageContextOptions({...cfg,pageTitle}),serialized=api.v210SerializableOptions(configured);
  eq(configured.markup,false,'Legacy markup cleanup is independently protected before Worker transport');
  eq(serialized.templateDefinitionInputEnabled,true,'The original eligible definition input is retained through the actual Worker serializer');
  eq(api.pageContextOptions(serialized).templateDefinitionInputEnabled,true,'Repeated context normalization retains the captured enablement');
  eq(api.v211FreshnessKey(serialized)===api.v211FreshnessKey({...serialized,templateDefinitionInputEnabled:false}),false,'Changing the captured definition enablement invalidates the reviewed-draft freshness key');
  eq(api.calculate({kind:'adjust',source,options:serialized}).text,expected,'The Worker-side full pipeline applies its exact finite endpoint');
  const optedOut=api.v210SerializableOptions(api.pageContextOptions({...cfg,pageTitle,templateDefinitionRepairs:false}));
  eq(optedOut.templateDefinitionInputEnabled,false,'An explicit user opt-out survives Worker transport');
  eq(api.calculate({kind:'adjust',source,options:optedOut}).text,source,'The Worker cannot re-enable an opted-out repair');
 });
 for(const name of contract.functions)for(const space of [' ','\t','\n'])for(const prefix of ['','<includeonly>'])test(bundle,'function token '+name+' '+JSON.stringify([space,prefix]),()=>{
  const source=prefix+'{{#'+name+space+':{{{p|}}}|A|B}}'+(prefix?'</includeonly>':''),expected=source.replace('#'+name+space+':','#'+name+':');prove(source,expected,1);
 });
 for(const name of contract.functions)test(bundle,'native case-insensitive function '+name,()=>{
  const source='{{#'+name.toLocaleUpperCase('pt')+' :{{{p|}}}|A|B}}',expected=source.replace(' :',':');prove(source,expected,1);
 });
 for(const source of ['{{#unknown :x|A|B}}','{{#if:x|A|B}}','{{# if:x|A|B}}','{{#if:{{{p}}}|A|B}}','{{#if:{{{p|}}}|A|B}}',
  '{{#if :x|A|B}','{{#if :x|A|B}}}}','{{#if :x|A|B}}<includeonly>','{{#if :x|A|B}}<ref>incompleto'])test(bundle,'function refusal '+sha(source).slice(0,12),()=>{
  eq(api.v215TemplateDefinitionPlan(source,cfg).text,source,'Unknown, complete or ambiguous syntax remains byte-identical');
 });
 for(const [kind,wrap]of [
  ['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],['code',s=>'<code>'+s+'</code>'],
  ['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['comment',s=>'<!--'+s+'-->'],
  ['noinclude',s=>'<noinclude>Exemplo: '+s+'</noinclude>'],['quoted',s=>'"'+s+'"'],['fence',s=>'```wikitext\n'+s+'\n```']
 ])for(const raw of ['{{#if :x|A|B}}','{{Navbox|titulo=Texto}}'])test(bundle,'protected '+kind+' '+sha(raw).slice(0,8),()=>{
  const source=wrap(raw);eq(api.v215TemplateDefinitionPlan(source,cfg).text,source,'Examples, quotations and documentation are not executable repairs');
 });
 for(const [name,item]of Object.entries(contract.calls))for(const rule of item.rules)for(const spacing of ['',' ','\n'])for(const value of ['Texto literal.','{{{campo|}}}','[[Tema|rótulo]]'])test(bundle,'native field '+name+' '+rule.from+' '+JSON.stringify([spacing,value]),()=>{
  const title=item===contract.calls.info?'Info':name[0].toLocaleUpperCase('pt')+name.slice(1),source='{{'+title+'|'+spacing+rule.from+spacing+'='+spacing+value+'}}',expected=source.replace(rule.from+spacing+'=',rule.to+spacing+'=');prove(source,expected,1);
 });
 for(const [name,item]of Object.entries(contract.calls))for(const rule of item.rules)for(const other of rule.family.filter(key=>key!==rule.from))for(const value of ['','Outro valor.'])test(bundle,'competing alias '+name+' '+rule.from+' '+other+' '+value,()=>{
  const title=name[0].toLocaleUpperCase('pt')+name.slice(1),source='{{'+title+'|'+rule.from+'=Texto|'+other+'='+value+'}}';
  eq(api.v215TemplateDefinitionPlan(source,cfg).text,source,'Even an explicitly empty competing alias prevents recovery');
 });
 for(const [name,key]of [['Navbox','title'],['Navbox','título'],['Sidebar','title'],['Sidebar','título'],['Info','titulo'],['Info','título']])test(bundle,'accepted alias '+name+' '+key,()=>{
  const source='{{'+name+'|'+key+'=Texto}}';prove(source,source,0);
 });
 for(const name of ['NAVBOX','NavBox','SIDEBAR','Outro modelo','{{{modelo|Navbox}}}'])test(bundle,'wrong template identity '+name,()=>{
  const source='{{'+name+'|titulo=Texto}}';eq(api.v215TemplateDefinitionPlan(source,cfg).text,source,'A case-normalized catalog name cannot authorize a different local template');
 });
 for(const source of ['{{Navbox|{{{chave|titulo}}}=Texto|titulo=Outro}}','{{Navbox|titulo=Texto|titulo=Texto}}','{{Navbox|titulo=Texto|title=}}'])test(bundle,'dynamic or repeated spelling '+sha(source).slice(0,12),()=>{
  eq(api.v215TemplateDefinitionPlan(source,{...cfg,automaticParameterDuplicates:false}).text,source,'Dynamic and repeated names prevent spelling recovery');
 });
 for(const name of ['Navbox','Sidebar','Info'])for(const key of ['nome','título'])for(const value of ['Texto','{{{campo|}}}','[[Tema|rótulo]]'])for(const amount of [2,3,5])test(bundle,'identical repeated binding '+JSON.stringify([name,key,value,amount]),()=>{
  const source='{{'+name+Array(amount).fill('|'+key+'='+value).join('')+'}}',expected='{{'+name+'|'+key+'='+value+'}}';
  prove(source,expected,amount-1);
 });
 for(const source of ['{{Navbox|nome=A|nome=B}}','{{Navbox|1=A|1=A|subgrupo}}','{{Navbox|nome=A|A|nome=A}}','{{Navbox|desconhecido=A|desconhecido=A}}',
  '{{Navbox|nome=A<!--comentário-->|nome=A<!--comentário-->}}','{{Navbox|nome={{subst:Outro}}|nome={{subst:Outro}}}}',
  '{{Navbox|nome=<ref>Fonte.</ref>|nome=<ref>Fonte.</ref>}}'])test(bundle,'duplicate refusal '+sha(source).slice(0,12),()=>{
  eq(api.v215TemplateDuplicateEdits(source,cfg),[],'Conflicts, anonymous positions, unknown names, comments and side effects remain intact');
 });
 const functional='{{Navbox|nome=Controle|título=Texto}}',doc='{{Documentação}}',block='<noinclude>'+doc+'</noinclude>';
 for(const gap of ['','\n','\n\n'])test(bundle,'trailing documentation '+JSON.stringify(gap),()=>{
  prove(functional+gap+doc,functional+'<noinclude>'+gap+doc+'</noinclude>',1);
 });
 for(const amount of [2,3,5])test(bundle,'duplicate isolated documentation '+amount,()=>{
  prove(functional+Array(amount).fill(block).join('\n'),functional+block+'\n'.repeat(amount-1),amount-1);
 });
 for(const gap of ['',' ','\n'])test(bundle,'single duplicated noinclude closer '+JSON.stringify(gap),()=>{
  prove(functional+block+gap+'</noinclude>',functional+block+gap,1);
 });
 for(const gap of ['',' ','\n','\n\n'])test(bundle,'duplicate documentation preserves every transcluded separator '+JSON.stringify(gap),()=>{
  const source='antes'+block+gap+block+'depois',expected='antes'+block+gap+'depois';prove(source,expected,1);
  const transcluded=value=>value.replace(/<noinclude>[\s\S]*?<\/noinclude>/g,'');
  eq(transcluded(source),transcluded(expected),'Removing a duplicate documentation block cannot concatenate text or remove outside whitespace');
 });
 for(const source of [functional+block,functional+'<includeonly>'+doc+'</includeonly>',functional+'<onlyinclude>'+doc+'</onlyinclude>',
  functional+'<noinclude>'+doc,functional+block+'</noinclude></noinclude>',functional+doc+' Conteúdo posterior.',
  functional+doc+'\n'+doc,functional+'{{Documentação|conteúdo=Texto}}',functional+block+'\n<!--nota-->\n'+block,
  '<onlyinclude>'+functional+'</onlyinclude>'+doc,functional+'  \n\t'+doc])test(bundle,'documentation refusal '+sha(source).slice(0,12),()=>{
  eq(api.v215TemplateDefinitionPlan(source,cfg).text,source,'Existing or ambiguous inclusion and documentation behavior is preserved');
 });
 const td=body=>'<noinclude><templatedata>'+body+'</templatedata></noinclude>';
 for(const [source,expected,amount]of [
  ['{"params":{"a":{},},}', '{"params":{"a":{}}}',2],
  ['{"params":{"a":{"aliases":["b",],},},}', '{"params":{"a":{"aliases":["b"]}}}',4],
  ['{"description":"Literal ,} and ,]","params":{"a":{},},}', '{"description":"Literal ,} and ,]","params":{"a":{}}}',2],
  ['{"params":{"a":{},"b":{}},"paramOrder":["a","a"]}', '{"params":{"a":{},"b":{}},"paramOrder":["a","b"]}',2],
  ['{"params":{"a":{},"b":{},"c":{}},"paramOrder":["b","b","b"]}', '{"params":{"a":{},"b":{},"c":{}},"paramOrder":["b","a","c"]}',4],
  ['{"params":{"10":{},"2":{},"nome":{}},"paramOrder":["nome","nome"]}', '{"params":{"10":{},"2":{},"nome":{}},"paramOrder":["nome","10","2"]}',3],
  ['{"params":{"10":{},"\\u0032":{},"nome":{}},"paramOrder":["nome"]}', '{"params":{"10":{},"\\u0032":{},"nome":{}},"paramOrder":["nome","10","2"]}',2],
  ['{"params":{"constructor":{},"__proto__":{}},"paramOrder":["__proto__","__proto__"]}', '{"params":{"constructor":{},"__proto__":{}},"paramOrder":["__proto__","constructor"]}',2],
  ['{"params":{"a":{},"b":{}},"paramOrder":["a","a",],}', '{"params":{"a":{},"b":{}},"paramOrder":["a","b"]}',4]
 ])for(const pageTitle of ['Predefinição:Modelo de controle','Predefinição:Modelo de controle/doc'])test(bundle,'TemplateData '+sha(source).slice(0,12)+' '+pageTitle,()=>{
  prove(td(source),td(expected),amount,{pageTitle});
  eq(api.v215TemplateJSON(expected,false)!==null,true,'The corrected result is strict JSON');
 });
 test(bundle,'strict JSON retains numeric textual declaration order independently of JavaScript object enumeration',()=>{
  const parsed=api.v215TemplateJSON('{"params":{"10":{},"2":{},"nome":{}}}',false);
  eq(parsed.paramKeys,['10','2','nome'],'Root parameter names retain their exact decoded textual declaration order');
  eq(Object.keys(parsed.data.params),['2','10','nome'],'The test distinguishes JavaScript integer-key enumeration from textual source order');
  const source=td('{"params":{"10":{},"2":{}},"paramOrder":["2","10"]}');
  prove(source,source,0);
 });
 for(const body of ['{"params":{"a":{},"a":{}},}','{"params":{"a":{},"\\u0061":{}},}','{"params":{"a":{"required":"false"}},}',
  '{"params":{"a":{"aliases":["x"]},"b":{"aliases":["x"]}},}','{"params":{"a":{"aliases":["b"]},"b":{}},}',
  '{"params":{"a":{"unknown":true}},}','{"params":{"a":{"type":"inventado"}},}','{"params":{},"unknown":true,}',
  '{"params":{"a":{}},"paramOrder":["inexistente"]}','{"params":{"a":{}},"paramOrder":["inexistente"],}','{"params":{"a":{}},"paramOrder":"a"}',
  '{"params":{"a":{}},"format":"custom unsupported format",}',
  '{"params":{"a":{}},"sets":[],}','{"params":{"a":{"inherits":"b"},"b":{}},}','{"params":{,}}',
  '{"description":"bad\\q","params":{"a":{},},}','{"description":"raw\nnewline","params":{"a":{},},}',
  '{"params":{"a":{"required":1}},}','{"params":{"a":{"suggested":null}},}',
  '{"params":{"a":{},}} texto','{"params":{"a":/*comentário*/{}},}'])test(bundle,'TemplateData refusal '+sha(body).slice(0,12),()=>{
  eq(api.v215TemplateDefinitionPlan(td(body),cfg).text,td(body),'Duplicates, unsupported schema, conflicts and other JSON errors are preserved');
 });
 for(const wrap of [s=>'<nowiki>'+s+'</nowiki>',s=>'<!--'+s+'-->',s=>'<pre>'+s+'</pre>',s=>'```wikitext\n'+s+'\n```',s=>'{{Outro|'+s+'}}'])test(bundle,'TemplateData example '+sha(wrap('x')).slice(0,10),()=>{
  const source=wrap(td('{"params":{"a":{},},}'));eq(api.v215TemplateDefinitionPlan(source,cfg).text,source,'A template-data example cannot borrow the real metadata repair');
 });
 test(bundle,'audited coordinate forwarding preserves public priority',()=>{
  const source='<includeonly>{{Info/Assentamento\n|nome={{{nome|}}}\n'+contract.marrocos.before+'|país=[[Marrocos]]\n}}</includeonly>'+block,
   expected=source.replace(contract.marrocos.before,contract.marrocos.after);
  prove(source,expected,1,{pageTitle:contract.marrocos.title});
  for(const [suffix,scale,kind]of [['type:city','80000','com'],['','','reg'],['','40000','com'],['','','com']]){
   const selected=suffix.trim()?suffix:'scale:'+(scale.trim()?scale:['reg','pro','pre'].includes(kind)?'2500000':'1000000');
   eq(selected,suffix.trim()?suffix:scale.trim()?'scale:'+scale:kind==='reg'?'scale:2500000':'scale:1000000','Public suffix overrides the retained scale and defaults');
  }
  eq(api.v215TemplateDefinitionPlan(source,{...cfg,pageTitle:'Predefinição:Outro modelo'}).text,source,'No unrelated wrapper receives a geographic forwarding change');
  eq(api.v215TemplateDefinitionPlan(source.replace('2500000','3500000'),{...cfg,pageTitle:contract.marrocos.title}).text,source.replace('2500000','3500000'),'An altered default cannot reuse the audited block');
 });
 test(bundle,'literal named fields on separate lines',()=>{
  const source='{{Navbox|nome=Modelo de controle|título=Um título literal suficientemente longo|grupo1=Grupo|lista1=[[Tema|rótulo]]}}',
   expected='{{Navbox\n|nome=Modelo de controle\n|título=Um título literal suficientemente longo\n|grupo1=Grupo\n|lista1=[[Tema|rótulo]]\n}}';
  prove(source,expected,5,{templateReadableFormatting:true});
  eq(api.v215TemplateReadableEdits(source,cfg),[],'The formatting option can be disabled');
  const before=api.v215TemplateReadCall(source),after=api.v215TemplateReadCall(expected);
  eq(before.fields.map(f=>[f.key,f.value.trim()]),after.fields.map(f=>[f.key,f.value.trim()]),'Every name, literal value and order is identical after native whitespace trimming');
 });
 test(bundle,'literal formatting preserves CRLF and refuses mixed newline styles',()=>{
  const source='{{Navbox|nome=Modelo de controle|título=Um título literal suficientemente longo|grupo1=Grupo|lista1=Tema}}\r\n<noinclude>{{Documentação}}</noinclude>',
   expected='{{Navbox\r\n|nome=Modelo de controle\r\n|título=Um título literal suficientemente longo\r\n|grupo1=Grupo\r\n|lista1=Tema\r\n}}\r\n<noinclude>{{Documentação}}</noinclude>';
  prove(source,expected,5,{templateReadableFormatting:true});
  const mixed=source+'\n';eq(api.v215TemplateReadableEdits(mixed,{...cfg,templateReadableFormatting:true}),[],'Mixed newline styles do not authorize a layout rewrite');
 });
 for(const source of ['{{Navbox|subgrupo|nome=Modelo de controle|título=Um título suficientemente longo|grupo1=Grupo|lista1=Tema}}',
  '{{Navbox|nome=Modelo de controle|título={{{titulo|Um título suficientemente longo}}}|grupo1=Grupo|lista1=Tema}}',
  '{{Outro|nome=Modelo de controle|título=Um título suficientemente longo|grupo1=Grupo|lista1=Tema}}',
  '{{Navbox|nome=Modelo de controle|título=Um título suficientemente longo|grupo1=Grupo|inexistente=Tema}}'])test(bundle,'formatting refusal '+sha(source).slice(0,12),()=>{
  eq(api.v215TemplateReadableEdits(source,{...cfg,templateReadableFormatting:true}),[],'Unknown, dynamic and positional calls keep their literal source layout');
 });
 for(const delta of [{namespaceNumber:0},{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:828},{namespaceNumber:undefined},
  {pageTitle:'Predefinição:Modelo/Testes'},{pageTitle:'Predefinição:Modelo/sandbox'},{pageTitle:'Predefinição:Modelo/doc'},{sectionOnly:true},{section:'0'},
  {discussionPage:true},{contentModel:'javascript'},{contentModel:'sanitized-css'},{pageRedirect:true},{pageDisambiguation:true},
  {syntaxRepairs:false},{structuralRepairs:false},{markup:false},{templateDefinitionRepairs:false}])test(bundle,'definition scope '+JSON.stringify(delta),()=>{
  const source='{{#if :x|A|B}}';eq(api.v215TemplateDefinitionPlan(source,{...cfg,...delta}).text,source,'Only an explicitly eligible complete template definition allows executable repairs');
 });
 test(bundle,'exact object proof rejects changes to corrected definitions',()=>{
  const source='{{Navbox|titulo=Texto literal.}}',expected='{{Navbox|título=Texto literal.}}';
  for(const forged of [expected.replace('Texto literal.','Outras palavras.'),expected.replace('|título=Texto literal.',''),expected+'{{Outro}}',expected.replace('Navbox','Sidebar')]){
   eq(Boolean(api.safeComposition(source,forged,cfg)),true,'A parameter-name proof does not authorize a content change');
   eq(api.preservationAudit(source,forged,cfg).length>0,true,'The independent object check rejects an altered name or value');
  }
 });
 for(const size of [1,10,50,150])test(bundle,'many independent wrapper calls '+size,()=>{
  const source=Array.from({length:size},(_,i)=>'{{Navbox|titulo=Texto '+i+'}}').join('\n'),expected=source.replaceAll('titulo=','título=');prove(source,expected,size);
 });
}
report.failed=report.failures.length;const directory=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2150/template'));
fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'template_definition.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.failures.slice(0,12)}));if(report.failed)process.exitCode=1;
