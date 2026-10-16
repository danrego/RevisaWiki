'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):['RevisaWiki_v2_14_0.js','RevisaWiki_v2_14_0_completo.js'].map(name=>path.join(root,'dist/2.14.0',name));
const report={version:'2.14.0',kind:'ordinary-prose-empty-line-boundaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function test(bundle,id,run){try{run();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file);
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file)),version:api.version});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',autoPreview:false,minorBaseConfirmed:true,
  spelling:false,dates:false,portals:false,automaticTopicPortals:false,automaticBiographyPortals:false,
  authorityControl:false,referenceColumns:false,unifiedNotesReferences:false,multilingual:false};
 for(const newline of ['\n','\r\n'])for(const count of [3,4,5,8,32])for(const pair of [
  ['Primeiro parágrafo com informação.','Segundo parágrafo com informação.'],
  ['Primeiro parágrafo.','== Outra seção =='],['== Outra seção ==','Parágrafo sob a seção.'],
  ["Texto com ''ênfase'' preservada.",'Outro texto com [[ligação]] preservada.']
 ])test(bundle,'ordinary prose '+JSON.stringify([newline,count,pair]),()=>{
  const source=pair.join(newline.repeat(count))+newline,expected=pair.join(newline.repeat(2))+newline,
   plan=api.v214ProseSpacingPlan(source,cfg),result=api.calculate({kind:'adjust',source,options:cfg});
  eq(plan.text,expected,'Exactly one empty line remains');eq(plan.edits.length,1,'One spacing operation per gap');
  eq(api.v214ProseSpacingProof(source,expected,plan,cfg),true,'The exact source authorizes only its spacing repair');
  eq(result.text,expected,'The complete engine applies the safe endpoint');eq(result.preservation,[],'No retained object was lost');
  eq(api.calculate({kind:'adjust',source:expected,options:cfg}).text,expected,'A second action changes nothing');
  eq(api.safeComposition(source,expected,cfg),'','The spacing composes safely');
  eq(api.v211RetainedAdjustments(source,expected).count,1,'One exact adjustment is counted for this retained gap');
  eq(api.v214ProseSpacingProof(source+'x',expected,plan,cfg),false,'A stale source cannot borrow this proof');
  eq(api.v214ProseSpacingProof(source,expected,{...plan,edits:[]},cfg),false,'A forged empty plan cannot borrow the proof');
  if(newline==='\n')eq(result.minorCheck.eligible,true,'Confirmed formatting-only spacing is eligible as minor');
 });
 const gap='Texto preservado.\n\n\n\nOutro texto preservado.';
 for(const [id,wrap]of [
  ['template',s=>'{{Modelo|texto='+s+'}}'],['triple argument',s=>'{{{argumento|'+s+'}}}'],
  ['multiline triple argument',s=>'{{{argumento|\n'+s+'\n}}}'],
  ['reference',s=>'<ref name="x">'+s+'</ref>\n{{Referências}}'],['reference list',s=>'<references>'+s+'</references>'],
  ['wiki link',s=>'[[Destino|'+s+']]'],['external link',s=>'[https://example.test/ '+s+']'],
  ...['ftp','mailto','irc','tel','HTTPS','custom+scheme'].map(scheme=>['external scheme '+scheme,s=>'['+scheme+':example.test/ rótulo\n'+s+'\n]']),
  ['table',s=>'{| class="wikitable"\n| '+s+'\n|}'],['comment',s=>'<!--'+s+'-->'],
  ['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],['poem',s=>'<poem>'+s+'</poem>'],
  ['code',s=>'<code>'+s+'</code>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],
  ['source',s=>'<source lang="text">'+s+'</source>'],['math',s=>'<math>'+s+'</math>'],['chem',s=>'<chem>'+s+'</chem>'],
  ['gallery',s=>'<gallery>'+s+'</gallery>'],['blockquote',s=>'<blockquote>'+s+'</blockquote>'],
  ['quote template',s=>'{{Caixa de citação|citação='+s+'}}'],['quoted prose',s=>'"'+s+'"'],
  ['styled HTML',s=>'<div style="white-space:pre-wrap">'+s+'</div>'],['inline HTML',s=>'<span>'+s+'</span>'],
  ['fence',s=>'```wikitext\n'+s+'\n```'],['inclusion',s=>'<noinclude>'+s+'</noinclude>'],
  ['unclosed HTML',s=>'<div>'+s],['unclosed template',s=>'{{Modelo|'+s],['unclosed comment',s=>'<!--'+s]
 ])test(bundle,'protected '+id,()=>{const source=wrap(gap);eq(api.v214ProseSpacingPlan(source,cfg).text,source,'The entire structural or literal example keeps every byte');});
 for(const before of [' texto','\ttexto','* item','# item',': resposta','; definição','| célula','! cabeçalho','{{Modelo}}','[[Categoria:Tema]]','----','<br />'])for(const order of [0,1])test(bundle,'nonprose boundary '+JSON.stringify([before,order]),()=>{
  const source=order?'Texto.\n\n\n'+before:before+'\n\n\nTexto.';eq(api.v214ProseSpacingPlan(source,cfg).text,source,'Layout, list and preformatted boundaries remain unchanged');
 });
 for(const delta of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:undefined},{discussionPage:true},{sectionOnly:true},{section:0},{section:'1'},{pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'},{model:'json'},{syntaxRepairs:false},{structuralRepairs:false},{markup:false}])test(bundle,'scope '+JSON.stringify(delta),()=>eq(api.v214ProseSpacingPlan(gap,{...cfg,...delta}).text,gap,'Only complete eligible wikitext articles authorize the repair'));
 for(const source of ['Texto.\n\nOutro texto.','Texto.\nOutro texto.','Texto.\n \n\nOutro texto.','Texto.\n\t\n\nOutro texto.','\n\n\nTexto.','Texto.\n\n\n','Texto.\r\n\n\r\nOutro texto.'])test(bundle,'preserve existing or ambiguous whitespace '+sha(source).slice(0,10),()=>eq(api.v214ProseSpacingPlan(source,cfg).text,source,'No single paragraph break, leading/trailing gap, space-bearing line or mixed newline is rewritten'));
 test(bundle,'protected middle with independent prose gaps',()=>{
  const source=gap+'\n\n{{Caixa de citação|citação='+gap+'}}\n\n'+gap,expected=gap.replace(/\n{3,}/g,'\n\n')+'\n\n{{Caixa de citação|citação='+gap+'}}\n\n'+gap.replace(/\n{3,}/g,'\n\n');
  const plan=api.v214ProseSpacingPlan(source,cfg);eq(plan.text,expected,'Only the two independent prose gaps change');eq(plan.edits.length,2,'Every independent gap counts once');
  eq(api.calculate({kind:'adjust',source,options:cfg}).text,expected,'Protected quote and ordinary prose compose together');
  eq(api.v211RetainedAdjustments(source,expected).count,2,'Two independent retained gaps count twice');
 });
 for(const newline of ['\n','\r\n'])test(bundle,'residue cleanup exposes a gap '+JSON.stringify(newline),()=>{
  const token=':contentReference[oaicite:0]{index=0}',cite='\uE200cite\uE202turn0search0\uE201',file='\uE200filecite\uE202turn0file0\uE201',
   source='Texto'+token+newline+newline+cite+newline+newline+file+'seguinte.',expected='Texto'+newline+newline+'seguinte.';
  const first=api.calculate({kind:'adjust',source,options:cfg}),second=api.calculate({kind:'adjust',source:first.text,options:cfg});
  eq(first.text,expected,'Safe residue removal and resulting prose spacing finish in one action');eq(first.preservation,[],'Every real prose word remains present');eq(second.text,first.text,'The newly exposed spacing cannot require a second click');eq(second.changes,[],'The second click invents no new correction');
 });
 for(const obsolete of ['{{Descrição curta|Descrição literal}}','{{Sem interwiki}}'])test(bundle,'template removal exposes a gap '+obsolete,()=>{
  const source='Primeiro parágrafo.\n\n'+obsolete+'\n\nSegundo parágrafo.',expected='Primeiro parágrafo.\n\nSegundo parágrafo.',first=api.calculate({kind:'adjust',source,options:cfg});
  eq(first.text,expected,'The final pass sees gaps created by an approved template removal');eq(first.preservation,[],'No paragraph or bibliographic source is lost');eq(api.calculate({kind:'adjust',source:first.text,options:cfg}).text,expected,'Template removal and spacing compose idempotently');
 });
}
report.failed=report.failures.length;const directory=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2140'));fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'prose_spacing.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.failures.slice(0,8)}));if(report.failed)process.exitCode=1;
