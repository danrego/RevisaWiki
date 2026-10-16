'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const scripts=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)];
const report={version:'2.8.0',kind:'independent-chemical-field-guards',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),frozenFiles:candidate?candidate.manifest.files:undefined,cases:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function test(bundle,name,fn){try{fn();report.cases.push({bundle,name,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,name,status:'failed'});report.failures.push({bundle,name,error:candidate?candidate.sanitized(error.message):String(error.message)});}}
const box=(value,extra='')=>'{{Info|título=Composto de teste|rótulo1=Nome IUPAC|dados1='+value+extra+'}}';
const article=source=>source+"\n\n'''Composto de teste''' é uma substância.\n";
for(const script of scripts){
 const api=require(script),bundle=path.basename(script),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Composto de teste',authorityControl:false,autoPreview:false};
 report.bundles.push({file:bundle,version:api.version,sha256:sha(fs.readFileSync(script))});
 const controls=[
  ['complete converter',box('-{zh-hans:中文;zh-hant:中文;}-')],
  ['complete converter beside chemical text',box('-{texto}- e 2-{metil}etil')],
  ['converter flag',box('-{A|texto}-')],
  ['incomplete converter flag',box('-{A|texto}')],
  ['encoded converter map',box('-{zh&#58;texto}')],
  ['converter in prose','Texto -{zh-hans:中文;zh-hant:中文;}- e 2-{metil}etil.'],
  ['unknown chemistry box','{{Info/Experimento|nome_IUPAC=2-{metil}etil}}'],
  ['ordinary infobox field','{{Info|título=Composto|rótulo1=Descrição|dados1=2-{metil}etil}}'],
  ['wrong matched slot','{{Info|rótulo2=Nome IUPAC|dados1=2-{metil}etil}}'],
  ['computed label','{{Info|rótulo1={{Nome IUPAC}}|dados1=2-{metil}etil}}'],
  ['slot boundary','{{Info|rótulo1=Nome IUPAC|dados1=2-{metil|dados2=}etil}}'],
  ['literal chemistry nested template',box('2-{metil{{Expr}}}etil')],
  ['literal chemistry nested argument',box('2-{metil{{{1}}}}etil')],
  ['math in field',box('2-{<math>x</math>}etil')],
  ['reference in field',box('2-{metil}<ref>Fonte.</ref>etil')],
  ['comment in field',box('2-{metil<!-- texto -->}etil')],
  ['wiki link in field',box('[[2-{metil}etil]]')],
  ['external link in field',box('[https://example.test 2-{metil}etil]')],
  ['new line inside group',box('2-{metil\n}etil')],
  ['unfinished group',box('2-{metil')],
  ['additional closing brace',box('2-{metil}etil}')],
  ['no ASCII hyphen',box('2−{metil}etil')],
  ['already encoded opening',box('2-&#123;metil}etil')],
  ['duplicate effective label',box('2-{metil}etil','|rótulo1=Nome IUPAC')],
  ['duplicate effective value',box('2-{metil}etil','|dados1=3-{etil}etil')],
  ['nested box','{{Outro|valor='+box('2-{metil}etil')+'}}'],
  ['quoted box','"'+box('2-{metil}etil')+'"'],
  ['quoted template','{{Citação|'+box('2-{metil}etil')+'}}'],
  ['HTML code example','<code>'+box('2-{metil}etil')+'</code>'],
  ['nowiki example','<nowiki>'+box('2-{metil}etil')+'</nowiki>'],
  ['Markdown example','```text\n'+box('2-{metil}etil')+'\n```'],
  ['reference example','<ref>'+box('2-{metil}etil')+'</ref>']
 ];
 for(const [name,source]of controls)test(bundle,name,()=>{const input=article(source),plan=api.v271ChemicalSyntaxPlan(input,cfg);eq(plan.text,input,'Only the verified literal chemical field is eligible');eq(plan.edits.length,0,'No unapproved brace edit');});
 for(const [name,value]of [['simple','2-{metil}etil'],['nested balanced','N-{[2-(metilamino)etil]fenil}acetamida'],['two groups','2-{metil}etil-3-{amino}fenil'],['formatted','<small title="2-{outro}etil">2-{metil}etil</small>']])test(bundle,name+' exact edit',()=>{const source=article(box(value)),plan=api.v271ChemicalSyntaxPlan(source,cfg),expected=value.startsWith('<small')?source.replace('>2-{metil}','>2-&#123;metil}'):source.replaceAll('-{','-&#123;');eq(plan.text,expected,'Only chemical text opening braces are encoded');eq(api.v271ChemicalSyntaxProof(source,expected,plan,cfg),true,'Source-bound proof accepts exact plan');eq(api.v271ChemicalSyntaxPlan(expected,cfg).text,expected,'Plan idempotence');const result=api.calculate({kind:'adjust',source,options:cfg});eq(result.preservation,[],'Full preservation checks');eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'Complete cleanup idempotence');eq(api.safeComposition(source,result.text,cfg),'','Accepted full selection remains composable');});
 const chemicalBox=(title,formula)=>'{{Info|título='+title+'|rótulo1=Nome IUPAC|dados1=2-{metil}etil|rótulo2=Fórmula|dados2='+formula+'}}';
 test(bundle,'different corrected boxes retain each field relationship',()=>{const source=article(chemicalBox('Primeiro','C2H6')+'\n'+chemicalBox('Segundo','C3H8')),result=api.calculate({kind:'adjust',source,options:cfg}),swapped=result.text.replace('C2H6','__SWAP__').replace('C3H8','C2H6').replace('__SWAP__','C3H8');eq(result.preservation,[],'Two distinct corrected boxes remain valid');eq(api.syntaxRepairSourceProof(source,swapped,cfg).accepted,false,'Swapping values between distinct boxes is rejected');eq(Boolean(api.safeComposition(source,swapped,cfg)),true,'Composed selection rejects swapped box relationships');const removed=result.text.slice(result.text.indexOf('}}')+2);eq(api.syntaxRepairSourceProof(source,removed,cfg).accepted,false,'One different box cannot disappear');});
 for(const [name,mutate]of [['atom',s=>s.replace('metil','etil')],['locator',s=>s.replace('2-&#123;','3-&#123;')],['bond',s=>s.replace('2-&#123;','2&#123;')],['group closing',s=>s.replace('metil}etil','metiletil')],['other box field',s=>s.replace('C2H6','C3H8')],['field label',s=>s.replace('Fórmula','Descrição')],['slot relocation',s=>s.replace('dados1=','dados3=')]])test(bundle,'source proof rejects changed '+name,()=>{const source=article(chemicalBox('Primeiro','C2H6')),result=api.calculate({kind:'adjust',source,options:cfg}),after=mutate(result.text);eq(after===result.text,false,'Mutation changes the approved output');eq(api.syntaxRepairSourceProof(source,after,cfg).accepted,false,'Chemical repair never approves unrelated infobox mutations');eq(Boolean(api.safeComposition(source,after,cfg)),true,'Rejected mutation remains blocked during selection');});
 test(bundle,'verified duplicate-infobox consolidation still composes',()=>{const one=chemicalBox('Primeiro','C2H6'),source=article(one+'\n'+one),result=api.calculate({kind:'adjust',source,options:cfg});eq(result.preservation,[],'Known identical-box repair is compatible');eq(api.safeComposition(source,result.text,cfg),'','Only approved duplicate consolidation remains safe');eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'Combined result is idempotent');});
 for(const [name,make]of [['same boxes in separate sections',one=>'== Parte A ==\n'+one+'\n== Parte B ==\n'+one],['equivalent boxes with different source',one=>one+'\n'+one.replace('{{Info|','{{Info |')]])test(bundle,'box multiplicity '+name,()=>{const source=article(make(chemicalBox('Primeiro','C2H6'))),plan=api.v271ChemicalSyntaxPlan(source,cfg),result=api.calculate({kind:'adjust',source,options:cfg}),boxes=api.v271ChemicalBoxes(result.text,cfg);eq(result.preservation,[],'Approved pipeline retains valid occurrences');eq(boxes.length,2,'These occurrences are outside exact approved duplicate deletion');const second=boxes[1],removed=result.text.slice(0,second.nodeStart)+result.text.slice(second.nodeEnd);eq(api.syntaxRepairSourceProof(source,removed,cfg).accepted,false,'Loss of one equal normalized box is rejected');eq(Boolean(api.safeComposition(source,removed,cfg)),true,'Composed selection also preserves multiplicity');eq(api.v271ChemicalInventoryProof({safe:{steps:[{name:'v271-chemical-literal-braces',edits:plan.edits}]},cfg},result.text,removed).accepted,false,'The counted inventory itself retains occurrences');});
 for(const [name,options]of [['talk',{namespaceNumber:1}],['section',{sectionOnly:true}],['disabled',{infoboxes:false}],['non-wikitext',{contentModel:'javascript'}]])test(bundle,'ineligible '+name+' context',()=>{const source=article(box('2-{metil}etil'));eq(api.v271ChemicalSyntaxPlan(source,{...cfg,...options}).text,source,'No out-of-context chemical edit');});
 const inchi='1S/4C23H15N3O.3H2O/c4*24-15-17-8-4-5-11-20(17)21-14-18(22-12-6-7-13-25-22)16-26(23(21)27)19-9-2-1-3-10-19;;;/h4*1-14,16H;3*1H2';
 const inchiBox=(token,extra='',label='InChI')=>'{{Info|título=Composto de teste|rótulo1='+label+'|dados1='+token+extra+'}}';
 for(const template of ['Info','Infocaixa'])for(const label of ['InChI','InChI (forma hidratada)'])test(bundle,template+' '+label+' wrapper preserves raw identifier',()=>{const source=article(inchiBox(' \t'+inchi+' ', '',label).replace('{{Info|','{{'+template+'|')),plan=api.v271ChemicalSyntaxPlan(source,cfg);eq(plan.text,source.replace(inchi,'<span style="overflow-wrap:anywhere;">'+inchi+'</span>'),'Only the raw identifier receives a wrapper');eq(plan.edits.length,1,'One wrapper edit');eq(api.v271ChemicalSyntaxProof(source,plan.text,plan,cfg),true,'Exact finite wrapping proof');eq(api.v271ChemicalSyntaxPlan(plan.text,cfg).text,plan.text,'Wrapper idempotence');const result=api.calculate({kind:'adjust',source,options:cfg});eq(result.preservation,[],'Wrapper passes full source proof');eq(api.safeComposition(source,result.text,cfg),'','Wrapper remains composable');eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'Complete cleanup idempotence');eq(api.syntaxRepairSourceProof(source,result.text.replace('3*1H2','3*1H3'),cfg).accepted,false,'Identifier mutation rejected');});
 const inchiControls=[
  ['short identifier',inchiBox('1S/CH4/h1H4')],['nonstandard prefix',inchiBox(inchi.replace('1S/','1/'))],['wrong prefix case',inchiBox(inchi.replace('1S/','1s/'))],
  ['newline in token',inchiBox(inchi.replace('/h','\n/h'))],['embedded space',inchiBox(inchi.replace('/h',' /h'))],['encoded character',inchiBox(inchi.replace('C23','C&#50;3'))],
  ['existing span',inchiBox('<span>'+inchi+'</span>')],['existing small',inchiBox('<small>'+inchi+'</small>')],['internal link',inchiBox('[['+inchi+']]')],['reference suffix',inchiBox(inchi+'<ref>Fonte.</ref>')],
  ['converter syntax',inchiBox('-{'+inchi+'}-')],['unknown label',inchiBox(inchi,'','Descrição')],['InChI key label',inchiBox(inchi,'','Chave InChI')],['SMILES label',inchiBox(inchi,'','SMILES')],
  ['mismatched slot','{{Info|rótulo2=InChI|dados1='+inchi+'}}'],['duplicate label',inchiBox(inchi,'|rótulo1=InChI')],['duplicate data',inchiBox(inchi,'|dados1='+inchi)],
  ['repeated InChI label',inchiBox(inchi,'|rótulo2=InChI|dados2='+inchi)],['explicit layout',inchiBox(inchi,'|estilo=width:22em;')],['explicit class',inchiBox(inchi,'|classe=infobox')],
  ['nested field','{{Outro|valor='+inchiBox(inchi)+'}}'],['template example','<syntaxhighlight lang="wikitext">'+inchiBox(inchi)+'</syntaxhighlight>'],['quoted example','"'+inchiBox(inchi)+'"']
 ];
 for(const [name,source]of inchiControls)test(bundle,'InChI guard '+name,()=>{const input=article(source),plan=api.v271ChemicalSyntaxPlan(input,cfg);eq(plan.text,input,'No unverified or preformatted InChI wrapper');eq(plan.edits.length,0,'No edit outside the finite token scope');});
 const fixtureDirectory=path.join(__dirname,'fixtures/chemical_articles'),fixtureManifestBytes=fs.readFileSync(path.join(fixtureDirectory,'manifest.json')),fixtureManifest=JSON.parse(fixtureManifestBytes);
 for(const fixture of fixtureManifest.articles)test(bundle,'actual revision '+fixture.revisionId+' chemical data preservation',()=>{
  const compressed=fs.readFileSync(path.join(fixtureDirectory,fixture.filename)),bytes=zlib.gunzipSync(compressed),source=bytes.toString('utf8'),options={...cfg,pageTitle:fixture.title};
  eq(sha(compressed),fixture.gzipSha256,'Exact captured gzip');eq(sha(bytes),fixture.sha256,'Exact public revision bytes');eq(bytes.length,fixture.bytes,'Source byte count');
  const plan=api.v271ChemicalSyntaxPlan(source,options),normalize=value=>value.replaceAll('-&#123;','-{').replace(/<span style="overflow-wrap:anywhere;">([^<>]+)<\/span>/g,'$1');
  eq(normalize(plan.text),source,'Every source byte outside the two confirmed chemical presentations remains unchanged');
  const beforeBoxes=api.v271ChemicalBoxes(source,options),afterBoxes=api.v271ChemicalBoxes(plan.text,options);eq(afterBoxes.length,beforeBoxes.length,'No box added, removed or migrated');
  eq(afterBoxes.map(b=>[b.template,b.entries.map(e=>[e.key,normalize(e.value)])]),beforeBoxes.map(b=>[b.template,b.entries.map(e=>[e.key,e.value])]),'All labels, data rows, images and relationships retained');
  if(fixture.revisionId===73219673)eq(plan.edits.filter(e=>e.ruleId==='chemicalLiteralBraces').length,1,'The actual accidental converter has one opening-only repair');
  if(fixture.revisionId===73219717)eq(plan.edits.filter(e=>e.ruleId==='chemicalInchiWrapping').length,1,'Only the unwrapped hydrated identifier is wrapped');
  if(fixture.revisionId===73219735)eq(plan.edits.length,0,'Already formatted current box retains its layout');
  const result=api.calculate({kind:'adjust',source,options});eq(result.preservation,[],'Actual article passes complete source preservation');eq(api.safeComposition(source,result.text,options),'','Actual combined edits remain safe');eq(api.calculate({kind:'adjust',source:result.text,options}).text,result.text,'Actual article cleanup idempotence');
 });
 report.fixtureManifestSha256=sha(fixtureManifestBytes);
}
const directory=candidate?candidate.artifactDirectory():path.resolve(process.env.REVISAWIKI_REPORT_DIR||'.');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'chemical_guards.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.failures.length)process.exitCode=1;
