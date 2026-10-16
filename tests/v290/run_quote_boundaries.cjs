'use strict';
// Independent owner-boundary controls. All requests and Wikipedia writes remain disabled.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),candidate=require('./candidate.cjs');
const baseline=process.argv.includes('--baseline'),baselineManifest=JSON.parse(fs.readFileSync(path.join(candidate.root,'tests/expected_release_v261_hotfix_1.json'),'utf8'));
const manifest=baseline?baselineManifest:candidate.manifest;
if(!baseline)candidate.verify();
const bundleNames=baseline?['RevisaWiki_v2_6_1.js','RevisaWiki_v2_6_1_completo.js']:['RevisaWiki_v2_9_0.js','RevisaWiki_v2_9_0_completo.js'];
const dist=path.join(candidate.root,'dist',manifest.version),report={version:manifest.version,runtimeVersion:manifest.runtimeVersion||manifest.version,kind:'independent-quote-owner-boundaries',baseline,runnerSha256:candidate.sha(fs.readFileSync(__filename)),frozenFiles:manifest.files,networkRequests:0,wikipediaWrites:0,cases:[],checks:0,bundles:[],performance:[]};
const fixtureDirectory=path.join(__dirname,'fixtures/city_temperature'),revision=JSON.parse(fs.readFileSync(path.join(fixtureDirectory,'source_revision.json'),'utf8')),article=fs.readFileSync(path.join(fixtureDirectory,'article.wiki'),'utf8');
function check(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function truth(value,label){report.checks++;assert(value,label);}
function run(bundle,name,fn){const before=report.checks;try{fn();report.cases.push({bundle,name,status:'passed',checks:report.checks-before});}catch(error){report.cases.push({bundle,name,status:'failed',checks:report.checks-before,message:candidate.sanitized(error.message).slice(0,1400)});}}
const target='{{Main|Alvo confirmado}}',canonical='{{Artigo principal|Alvo confirmado}}';
const numericRows=source=>source.split(/\r?\n/).filter(line=>/^\|\s*[-−+]?\d/.test(line));
const tableLabels=source=>source.split(/\r?\n/).filter(line=>/^\|\s*style=/.test(line));
const tableInventory=source=>({openers:(source.match(/^\{\|/gm)||[]).length,closers:(source.match(/^\|\}/gm)||[]).length});
const table='{| class="wikitable"\n! Cidade !! Jan !! Fev\n|-\n| style="text-align:left" | [[Exemplo]]\n| -3,9 || 0,9\n|-\n| style="text-align:left" | [[Outro exemplo]]\n| 2,0 || 8,2\n|}';
const quotedOwners=[
 ['plain reference','<ref>"Fonte com pontuação solta.</ref>'],
 ['named reference','<ref name="fonte">"Fonte com pontuação solta.</ref>'],
 ['single quoted name attribute',"<ref name='fonte'>\"Fonte com pontuação solta.</ref>"],
 ['upper case reference','<REF NAME="fonte">"Fonte com pontuação solta.</REF>'],
 ['grouped reference','<ref group="nota">"Fonte com pontuação solta.</ref>'],
 ['direction attribute reference','<ref dir="rtl">"Fonte com pontuação solta.</ref>'],
 ['follow attribute reference','<ref follow="fonte">"Fonte com pontuação solta.</ref>'],
 ['linked reference','<ref>[https://example.org/fonte "Título com pontuação solta].</ref>'],
 ['fragment URL','<ref>[https://example.org/fonte#secao "Título com pontuação solta].</ref>'],
 ['standalone external link','[https://example.org/fonte "Título com pontuação solta]'],
 ['inline external link in cell prose','Texto [https://example.org/fonte "Título com pontuação solta] continua.'],
 ['literal apostrophe',"<ref>'Fonte com pontuação solta.</ref>"],
 ['apostrophe in linked label',"<ref>[https://example.org/fonte 'Título com pontuação solta].</ref>"],
 ['natural contraction',"<ref>The author's text doesn't need rewriting.</ref>"],
 ['HTML within reference','<ref><span title="rótulo">"Fonte com pontuação solta.</span></ref>'],
 ['quote after complete HTML','<ref><span title="rótulo">Fonte.</span> "Pontuação solta.</ref>'],
 ['literal bracket in prose','<ref>"Fonte com [comentário comum] no texto.</ref>'],
 ['two owner-local citations','<ref>"Primeira fonte.</ref> <ref>"Segunda fonte.</ref>'],
 ['balanced ordinary quote','<ref>"Fonte com aspas completas".</ref>'],
 ['balanced quote in linked label','<ref>[https://example.org/fonte "Título entre aspas"].</ref>'],
 ['typographic punctuation control','<ref>“Fonte com pontuação tipográfica.</ref>']
];
const incomplete=[
 ['unclosed reference','<ref>Fonte sem fechamento.\nParágrafo que não deve virar referência.'],
 ['unclosed reference with ordinary quote','<ref>"Fonte sem fechamento.\nParágrafo que não deve virar referência.'],
 ['unclosed named reference','<ref name="fonte">"Fonte sem fechamento.\nParágrafo que não deve virar referência.'],
 ['unclosed reference after complete link','<ref>[https://example.org/fonte "Fonte completa].\nParágrafo que não deve virar referência.'],
 ['unclosed table','{| class="wikitable"\n! A !! B\n|-\n| 1 || 2\nTexto ambíguo.'],
 ['unclosed table with complete reference','{| class="wikitable"\n! A !! B\n|-\n| 1 || 2\n| <ref>"Fonte completa.</ref>\nTexto ambíguo.'],
 ['unclosed HTML attribute','<div title="atributo sem fechamento>Texto.\n{{Main|Não alterar}}'],
 ['unclosed reference attribute','<ref name="atributo sem fechamento>Fonte.</ref>\n{{Main|Não alterar}}'],
 ['unclosed external link','[https://example.org/fonte "Rótulo sem fechamento\n{{Main|Não alterar}}'],
 ['unclosed external link inside reference','<ref>[https://example.org/fonte "Rótulo sem fechamento</ref>\n{{Main|Não alterar}}']
];
const quotedSamples=[
 ['standalone malformed template','Texto "{{Exemplo|aberto" continua.'],
 ['malformed template within reference','<ref>"{{Exemplo|aberto".</ref>'],
 ['hatnote inside quoted malformed sample','Texto "{{Main|Dentro da amostra}} {{Exemplo|aberto" continua.'],
 ['hatnote and incomplete sample within reference','<ref>"{{Main|Dentro da amostra}} {{Exemplo|aberto".</ref>'],
 ['multiline reference sample in table','{| class="wikitable"\n! A\n|-\n| <ref>"{{Main|Dentro da amostra}}\n{{Exemplo|aberto".</ref>\n|}'],
 ['quoted malformed table','Texto "{| class=wikitable\n| amostra sem fechamento" continua.'],
 ['quoted malformed tag','Texto "<ref>amostra sem fechamento" continua.'],
 ['literal nowiki sample','<nowiki>"{{Main|Dentro da amostra}} {{Exemplo|aberto</nowiki>'],
 ['literal pre sample','<pre>"{{Main|Dentro da amostra}} {{Exemplo|aberto</pre>'],
 ['literal source sample','<syntaxhighlight lang="wikitext">"{{Main|Dentro da amostra}} {{Exemplo|aberto</syntaxhighlight>'],
 ['unfinished quote in template parameter','{{Exemplo\n|campo = "Amostra de código:\n{{Portal|Biologia}]\nSem fechar aspas\n}}'],
 ['quoted parameter inside actual table','{| class="wikitable"\n| {{Exemplo\n|campo = "Amostra de código:\n{{Portal|Biologia}]\nFim da amostra"\n}}\n|}'],
 ['comment sample','<!-- "{{Main|Dentro da amostra}} {{Exemplo|aberto -->']
];
for(const [label,prefix]of [['word','Palavra"'],['colon','Exemplo:"'],['period','Exemplo."'],['parenthesis','Exemplo)"']])for(const paired of [false,true])quotedSamples.push([label+' adjacent malformed portal '+(paired?'paired':'unfinished'),prefix+'{{Portal|Biologia}]'+(paired?'"':'')]);
quotedSamples.push(
 ['period quote with attached ref and paired later paragraph','Texto."<ref>Fonte bibliográfica.</ref>\n\n{{Portal|Biologia}]"'],
 ['period quote with attached ref and unfinished later paragraph','Texto."<ref>Fonte bibliográfica.</ref>\n\n{{Portal|Biologia}]'],
 ['word quote with attached ref and paired later paragraph','Palavra"<ref>Fonte bibliográfica.</ref>\n\n{{Portal|Biologia}]"'],
 ['word quote with attached ref and unfinished later paragraph','Palavra"<ref>Fonte bibliográfica.</ref>\n\n{{Portal|Biologia}]'],
 ['paired literal spanning paragraphs','Texto "Primeiro parágrafo.\n\n{{Portal|Biologia}]"'],
 ['unfinished literal spanning paragraphs','Texto "Primeiro parágrafo.\n\n{{Portal|Biologia}]']
);
for(const name of bundleNames){
 const bytes=fs.readFileSync(path.join(dist,name)),pin=manifest.files[name];assert.equal(candidate.sha(bytes),pin.sha256,name+' pinned hash');assert.equal(bytes.length,pin.bytes,name+' pinned length');
 const api=require(path.join(dist,name));assert.equal(api.version,manifest.runtimeVersion||manifest.version);report.bundles.push({file:name,version:api.version,bytes:bytes.length,sha256:pin.sha256});
 const baseName=name.includes('_completo')?'RevisaWiki_v2_6_1_completo.js':'RevisaWiki_v2_6_1.js',baseBytes=fs.readFileSync(path.join(candidate.root,'dist/2.6.1-hotfix.1',baseName));assert.equal(candidate.sha(baseBytes),baselineManifest.files[baseName].sha256,'Pinned baseline for explicit existing-behavior controls');
 const previous=require(path.join(candidate.root,'dist/2.6.1-hotfix.1',baseName));
 const inactive=Object.fromEntries(Object.entries(api.defaults).map(([key,value])=>[key,typeof value==='boolean'?false:value]));
 const minimal={...inactive,namespaceNumber:0,pageTitle:'Teste técnico',syntaxRepairs:true,partialSyntaxRecovery:true,structuralRepairs:true,multilingual:true,auxiliaryTemplates:true,links:true};
 const full={namespaceNumber:0,pageTitle:revision.title,autoPreview:false,registryDoiCheck:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,livingBirthAge:false,autoMinor:false,automaticSpelling:false};
 const calculate=(source,options=minimal)=>api.calculate({kind:'adjust',source,originalSource:source,options});
 function preservation(source,result,options=minimal){check(result.preservation||[],[],'No lost source data');check(api.preservationAudit(source,result.text,options),[],'Independent preservation audit');check(api.safeComposition(source,result.text,options),'','Complete diff is safely composable');check(calculate(result.text,options).text,result.text,'Second pass is byte-identical');}
 for(const[label,owner]of quotedOwners)for(const position of ['before table','inside table'])run(name,label+' '+position,()=>{
  const source=(position==='before table'?owner+'\n'+table:table.replace('| 2,0 || 8,2','| 2,0 || 8,2\n| '+owner))+'\n'+target;
  const expected=source.replace(target,canonical),plan=api.syntaxRepairPlan(source,minimal),result=calculate(source);
  check(plan.unresolved||[],[],'Complete owner cannot isolate the following table or hatnote');check(plan.safePrefixEnd,source.length,'Entire complete source is available');check(result.text,expected,'Only the independently expected local alias changes');truth(result.text.includes(owner),'Every owner byte and unmatched punctuation survives');check(numericRows(result.text),numericRows(source),'Numeric rows retain order and bytes');check(tableInventory(result.text),tableInventory(source),'Table boundaries survive');preservation(source,result);
 });
 for(const[label,body]of [
  ['cell followed by same-line attribute','{| class="wikitable"\n! Cidade !! Jan\n|-\n| "Primeira || style="text-align:left" | Segunda\n|-\n| -3,9 || 0,9\n|}'],
  ['header followed by same-line scope','{| class="wikitable"\n! "Cidade !! scope="col" | Jan\n|-\n| -3,9 || 0,9\n|}']
 ])run(name,'physical table-row quote control '+label,()=>{
  const source=body+'\n'+target,plan=api.syntaxRepairPlan(source,minimal),result=calculate(source);check(plan.unresolved||[],[],'Complete physical rows do not isolate the table');check(plan.safePrefixEnd,source.length,'Complete table is available');check(result.text,body+'\n'+canonical,'Minimal adjustment preserves every physical cell and attribute byte');check(numericRows(result.text),numericRows(source),'Numeric rows stay literal');preservation(source,result);
  const normal=calculate(source,full);check(numericRows(normal.text),numericRows(source),'Normal defaults retain every numeric value and position');check(tableInventory(normal.text),tableInventory(source),'Normal defaults retain both table boundaries');check(normal.syntaxIsolation,undefined,'Normal defaults have no false isolation');preservation(source,normal,full);
 });
 for(const[label,tail]of incomplete)run(name,'conservative '+label,()=>{const source=target+'\nTexto anterior completo.\n'+tail,plan=api.syntaxRepairPlan(source,minimal),result=calculate(source);truth((plan.unresolved||[]).length>0,'Genuinely ambiguous structure remains unresolved');truth(result.text.startsWith(canonical),'Independent safe prefix can still be adjusted');truth(result.text.endsWith(tail),'Every ambiguous-tail byte survives');check(numericRows(result.text),numericRows(source),'Incomplete numeric rows are not fabricated or removed');preservation(source,result);});
 for(const[label,sample]of quotedSamples)run(name,'protected '+label,()=>{const source=sample+'\nTexto depois da amostra.',result=calculate(source);check(result.text,source,'Quoted malformed sample is not reinterpreted or rewritten');preservation(source,result);});
 for(const[label,sample]of [
  ['multiline reference','<ref>"{{Main|Dentro da amostra}}\nTexto da amostra".</ref>'],
  ['multiline table reference','{| class="wikitable"\n! A\n|-\n| <ref>"{{Main|Dentro da amostra}}\nTexto da amostra".</ref>\n|}'],
  ['HTML attribute inside literal reference','<ref>"{{Main|Dentro da amostra}} <span title="rótulo">Texto</span>".</ref>']
 ])run(name,'existing behavior, no new regression: paired complete sample '+label,()=>{const source=sample+'\n'+target,result=calculate(source),prior=previous.calculate({kind:'adjust',source,originalSource:source,options:minimal});check(result.text,prior.text,'Exactly the pinned previous release behavior, not a newly fixed case');truth(result.text!==source,'Existing migration hunks are present');truth(result.text.includes(canonical),'Independent outer hatnote still migrates');check((result.text.match(/"/g)||[]).length,(source.match(/"/g)||[]).length,'Every literal and attribute quote remains present');preservation(source,result);});
 run(name,'city snapshot has exact source and numeric inventory',()=>{check(Buffer.byteLength(article),revision.bytes,'Pinned source byte count');check(candidate.sha(article),revision.sha256,'Pinned source hash');check(numericRows(article).length,487,'487 numeric rows');check(tableLabels(article).length,974,'974 country/city label rows');check(tableInventory(article),{openers:6,closers:6},'Six complete tables');});
 run(name,'city quote does not isolate otherwise complete tables',()=>{
  const quote='"Météo Climat 1991–2020 averages for Lithuania',offset=article.indexOf(quote);truth(offset>=0,'Exact unmatched quote is present in the source');
  const start=performance.now(),plan=api.syntaxRepairPlan(article,full),result=calculate(article,full),elapsed=performance.now()-start;
  report.performance.push({bundle:name,sourceBytes:Buffer.byteLength(article),milliseconds:Math.round(elapsed),kind:'actual-city-plan-and-transformation',cpuIsolation:'not guaranteed'});
  check(plan.unresolved||[],[],'Original unmatched punctuation does not invent unclosed structures');check(plan.safePrefixEnd,article.length,'Entire 210 KB article is interpreted');truth(result.text!==article,'Expected existing maintenance rules can run');truth(result.text.includes(quote),'The unmatched ordinary quote is not deleted or completed');
  check(numericRows(result.text),numericRows(article),'Every numeric row and its position is byte-identical');check(tableLabels(result.text),tableLabels(article),'Every country/city label row and its position is byte-identical');check(tableInventory(result.text),{openers:6,closers:6},'No table boundary is fabricated or lost');check(api.syntaxAudit(result.text),[],'No new citation or table syntax issue');preservation(article,result,full);truth(elapsed<120000,'No two-minute parser stall for a 210 KB article');
  const corrected=article.slice(0,offset)+article.slice(offset+1);check(candidate.sha(baseBytes),baselineManifest.files[baseName].sha256,'Performance reference is the pinned previous release');
  const baseStart=performance.now(),basePlan=previous.syntaxRepairPlan(corrected,full),baseResult=previous.calculate({kind:'adjust',source:corrected,originalSource:corrected,options:full}),baseMilliseconds=performance.now()-baseStart;
  check(basePlan.unresolved||[],[],'The corrected previous-version reference is complete');check(numericRows(baseResult.text),numericRows(article),'Performance reference preserves the same numeric rows');
  report.performance.push({bundle:name,referenceBundle:baseName,sourceBytes:Buffer.byteLength(corrected),milliseconds:Math.round(baseMilliseconds),candidateToReferenceRatio:Number((elapsed/Math.max(1,baseMilliseconds)).toFixed(3)),kind:'previous-release-with-only-stray-quote-removed',cpuIsolation:'not guaranteed'});
 });
 for(const explicit of [false,true])run(name,'city normal defaults '+(explicit?'explicit':'implicit'),()=>{
  const options=explicit?{...api.defaults,namespaceNumber:0,pageTitle:revision.title}:undefined,result=api.calculate({kind:'adjust',source:article,originalSource:article,...(options?{options}:{})});
  truth(result.text!==article,'Normal defaults produce actual maintenance changes');truth(result.changes.some(change=>change.id==='tableHeaderScopes'),'Table-header adjustment is proposed');truth(result.changes.some(change=>change.id==='referenceColumns'),'Reference columns are proposed');
  check(numericRows(result.text),numericRows(article),'Default settings preserve every numeric row');check(tableLabels(result.text),tableLabels(article),'Default settings preserve every row label');check(result.preservation||[],[],'Default settings preserve source data');check(result.syntaxIsolation,undefined,'No false partial interpretation');
 });
 for(const mark of ['"','“'])run(name,'bounded quote scan stress '+(mark==='"'?'straight':'curly'),()=>{
  const timings=[];for(const count of [1000,4000]){const source=('<ref>'+mark+'Título comum.</ref>\n').repeat(count)+table+'\n'+target,start=performance.now(),plan=api.syntaxRepairPlan(source,minimal),elapsed=performance.now()-start;timings.push({references:count,bytes:Buffer.byteLength(source),milliseconds:Math.round(elapsed)});check(plan.unresolved||[],[],'Complete repeated refs retain their owner boundaries');check(plan.safePrefixEnd,source.length,'Every repeated ref is interpreted');truth(elapsed<15000,'No fifteen-second quote-parser stall below 160 KB');}
  report.performance.push({bundle:name,kind:'bounded-quote-scan-stress',quote:mark,timings,cpuIsolation:'not guaranteed'});
 });
}
report.passed=report.cases.filter(entry=>entry.status==='passed').length;report.failed=report.cases.length-report.passed;report.status=report.failed?'failed':'passed';
const output=path.join(candidate.artifactDirectory(),baseline?'quote_boundaries_baseline.json':'quote_boundaries.json');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version:report.version,kind:report.kind,baseline,status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.cases.filter(entry=>entry.status==='failed'),performance:report.performance,networkRequests:0,wikipediaWrites:0}));if(report.failed&&!baseline)process.exitCode=1;
