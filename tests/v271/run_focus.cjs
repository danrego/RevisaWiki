'use strict';
// Independent patch contracts. No packages or network requests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const report={kind:'independent-reference-alias-parser-migration',runnerSha256:sha(fs.readFileSync(__filename)),networkRequests:0,wikipediaWrites:0,cases:[],checks:0,bundles:[]};
const candidate=require('./candidate.cjs'),isBaseline=process.argv.includes('--baseline');
const files=candidate.bundleFiles(isBaseline);
function check(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function run(api,name,fn){const before=report.checks,started=performance.now();try{fn();report.cases.push({bundle:api.__qaBundle,name,status:'passed',checks:report.checks-before,milliseconds:Math.round(performance.now()-started)});}catch(e){report.cases.push({bundle:api.__qaBundle,name,status:'failed',checks:report.checks-before,message:candidate.sanitized(e.message).slice(0,800),milliseconds:Math.round(performance.now()-started)});}}
for(const argument of files){
 const file=path.resolve(argument),bytes=fs.readFileSync(file),api=require(file);assert.equal(api.version,isBaseline?candidate.manifest.baseVersion:candidate.manifest.runtimeVersion,'Exact manifest release version');api.__qaBundle=path.basename(file);
 report.bundles.push({file:path.basename(file),version:api.version,sha256:sha(bytes),bytes:bytes.length});
 const inactive=Object.fromEntries(Object.entries(api.defaults).map(([k,v])=>[k,typeof v==='boolean'?false:v]));
 const minimal={...inactive,namespaceNumber:0,pageTitle:'Teste técnico',references:true,endMatter:true,multilingual:true,auxiliaryTemplates:true,links:true,partialSyntaxRecovery:true};
 const integrated={namespaceNumber:0,pageTitle:'Teste técnico',authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,livingBirthAge:false,registryDoiCheck:false,autoPreview:false,autoMinor:false,automaticSpelling:false,referenceColumns:false,unifiedNotesReferences:false};
 const calculate=(source,options=minimal)=>api.calculate({kind:'adjust',source,originalSource:source,options});
 function stable(source,expected,options=minimal){const result=calculate(source,options);check(result.text,expected,'Exact independent expected text');check(calculate(result.text,options).text,result.text,'A second click is byte-identical');check(result.preservation||[],[],'No unsupported source loss');check(api.safeComposition(source,result.text,options),'','Entire change is safely composable');const metrics=result.byteMetrics;check(metrics.delta,Buffer.byteLength(result.text)-Buffer.byteLength(source),'Exact UTF-8 byte delta');return result;}
 for(const name of ['Referência','referência','Referencia'])run(api,'singular default collector '+name,()=>{const before='Texto documentado.<ref name="a">Fonte íntegra.</ref>\n{{'+name+'}}\n';const after=before.replace('{{'+name+'}}','{{Referências}}');stable(before,after);});
 run(api,'canonical collector stays literal',()=>stable('Texto.<ref>Fonte.</ref>\n{{Referências}}\n','Texto.<ref>Fonte.</ref>\n{{Referências}}\n'));
 for(const wrap of [['nowiki','<nowiki>','</nowiki>'],['syntaxhighlight','<syntaxhighlight lang="wikitext">','</syntaxhighlight>'],['pre','<pre>','</pre>'],['comment','<!-- ',' -->'],['math','<math>','</math>']])run(api,'protected singular collector '+wrap[0],()=>{const source=wrap[1]+'{{Referência}}'+wrap[2];stable(source,source);});
 for(const raw of ['{{Referência bibliográfica|Tema}}','{{Referência/Exemplo}}','{{Referencia desconocida|1=Tema}}'])run(api,'near-name collector retained '+raw.split('|')[0],()=>stable(raw,raw));
 for(const alias of ['AP','Main']){
  for(const suffix of ['|Tema','|Tema|Outro tema','|vt=s|Tema','|1=Tema|2=Outro tema'])run(api,'hatnote '+alias+suffix,()=>{const raw='{{'+alias+suffix+'}}\nTexto contínuo.';const allowed=[
    '{{Artigo principal'+suffix+'}}\nTexto contínuo.',
    '{{Artigo principal'+suffix.replace('|1=Tema|2=Outro tema','|Tema|Outro tema')+'}}\nTexto contínuo.'
   ];const observed=calculate(raw).text;check(allowed.includes(observed),true,'Only independently specified equivalent positional spellings are accepted');stable(raw,allowed.find(x=>x===observed));});
  run(api,'explicit positional equality '+alias,()=>{const raw='{{'+alias+'|1=Tema=A|2=Outro}}\nTexto.';const r=calculate(raw);check(/\{\{Artigo principal\|(?:1=Tema=A\|(?:2=)?Outro|(?:2=Outro\|)?1=Tema=A)/.test(r.text),true,'An equals sign cannot turn a positional title into a named parameter');check(calculate(r.text).text,r.text,'Equality-containing title is stable');check(r.preservation||[],[],'Equals-bearing title is not discarded');});
  run(api,'nested title preserved '+alias,()=>{const raw='{{'+alias+'|Tema {{!}} parte|Outro tema}}\nTexto.';stable(raw,raw.replace('{{'+alias+'|','{{Artigo principal|'));});
  run(api,'unknown named field retained '+alias,()=>{const raw='{{'+alias+'|Tema|campo_não_confirmado=valor intacto}}';stable(raw,raw.replace('{{'+alias+'|','{{Artigo principal|'));});
  run(api,'all label and positional bytes retained '+alias,()=>{const raw='{{'+alias+'| 1 = Tema=A \n|l1=Um rótulo|2=Outra página|vazio=|3= |campo=conteúdo}}';stable(raw,raw.replace('{{'+alias,'{{Artigo principal'));});
 }
 for(const raw of ['{{Mainly|Tema}}','{{AP/Exemplo|Tema}}','{{Main:Exemplo|Tema}}','{{subst:Main|Tema}}','{{safesubst:AP|Tema}}'])run(api,'near-name hatnote retained '+raw.split('|')[0],()=>stable(raw,raw));
 for(const wrap of [['nowiki','<nowiki>','</nowiki>'],['syntaxhighlight','<syntaxhighlight lang="wikitext">','</syntaxhighlight>'],['pre','<pre>','</pre>'],['comment','<!-- ',' -->'],['math','<math>','</math>']])run(api,'protected hatnote '+wrap[0],()=>{const source=wrap[1]+'{{Main|Tema}} {{AP|Outro}}'+wrap[2];stable(source,source);});
 const quoteContexts=[
  '<div align="center">\'\'\'Texto em destaque</div>\'\'\'\n{{Main|Tema}}',
  '[[Imagem:Exemplo.svg|miniatura|<div align="center">\'\'\'Legenda</div>\'\'\']]\n{{AP|Tema}}',
  '<div data-note="the author\'s label">Texto</div>\n{{Main|Tema}}',
  'A expressão "don\'t" e o nome d\'Ávila ficam intactos.\n{{Main|Tema}}',
  '<div data-note=\'a "quoted" label\'>Texto</div>\n{{AP|Tema}}',
  '<div><span>Texto com \" e apóstrofo \'</span></div>\n{{Main|Tema}}',
  '<div title="{{Exemplo|texto=apóstrofo \' literal}}">Texto</div>\n{{Main|Tema}}'
 ];
 quoteContexts.forEach((source,i)=>run(api,'legitimate quote context '+i,()=>{const expected=source.replace(/\{\{(?:Main|AP)\|Tema\}\}/g,'{{Artigo principal|Tema}}');const r=stable(source,expected,integrated);check((r.warnings||[]).some(x=>x.includes('código incompleto')),false,'Valid markup produces no false incomplete-code warning');}));
 const opaqueTails=['{{Incompleta|texto=valor sem fechamento','<ref>Fonte sem fechamento.\nParágrafo que não deve virar referência.','{| class="wikitable"\n! A !! B\n|-\n| 1 || 2\nTexto ambíguo.'];
 opaqueTails.forEach((tail,i)=>run(api,'real unresolved tail retained '+i,()=>{const source='{{Main|Tema}}\nTexto com evidência.<ref name="fonte">Fonte imutável.</ref>\n'+tail;const r=calculate(source,integrated);check(r.text.includes('{{Artigo principal|Tema}}'),true,'Independent complete hatnote before the boundary is migrated');check(r.text.endsWith(tail),true,'Every byte in genuinely unresolved tail survives');check((r.warnings||[]).some(x=>x.includes('O código incompleto e tudo o que vem depois dele')),false,'Routine isolation message is absent from headline warnings');check(calculate(r.text,integrated).text,r.text,'Ambiguous tail never accumulates changes');check(r.preservation||[],[],'No content loss under partial isolation');}));
 const fixtureDir=path.join(candidate.root,'tests/v261/fixtures'),provenance=JSON.parse(fs.readFileSync(path.join(fixtureDir,'source_revisions.json'),'utf8'));
 for(const entry of provenance)run(api,'pinned public snapshot '+entry.oldid,()=>{const source=fs.readFileSync(path.join(fixtureDir,entry.file),'utf8');check(sha(Buffer.from(source)),entry.sha256,'Pinned public source bytes');const options={...integrated,pageTitle:entry.title},r=calculate(source,options);check(calculate(r.text,options).text,r.text,'Entire real page is idempotent');check((r.warnings||[]).some(x=>x.includes('O código incompleto e tudo o que vem depois dele')),false,'No frightening generic preservation warning');check(r.preservation||[],[],'Entire real page passes source preservation');check(api.safeComposition(source,r.text,options),'','Complete real-page diff is composable');
  if(entry.file==='article_reference_alias.wiki'){check(/\{\{Referência\}\}/.test(r.text),false,'Broken singular renderer removed');check((r.text.match(/\{\{[Rr]eferências(?:\||\}\})/g)||[]).length,1,'Exactly one default canonical collector');}
  else {check((r.text.match(/\{\{(?:AP|Main)\|/g)||[]).length,0,'All five supplied hatnotes migrate');for(const match of source.matchAll(/\{\{(?:AP|Main)(\|[^{}]+)\}\}/g))check(r.text.includes('{{Artigo principal'+match[1]+'}}'),true,'Every actual title and option stays byte-identical');check((r.localReports?.translation||[]).some(x=>x.code==='foreign-template'&&/\b(?:AP|Main)\b/.test(x.message)),false,'No redundant migration finding remains');}
 });
}
report.passed=report.cases.filter(x=>x.status==='passed').length;report.failed=report.cases.length-report.passed;report.baseline=isBaseline;report.status=report.failed?'failed':'passed';
const output=process.env.REVISAWIKI_QA_REPORT||path.join(candidate.artifactDirectory(),isBaseline?'focused_baseline.json':'focused_candidate.json');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({kind:report.kind,runnerSha256:report.runnerSha256,status:report.status,baseline:isBaseline,bundles:report.bundles,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.cases.filter(x=>x.status==='failed'),networkRequests:0,wikipediaWrites:0}));
if(report.failed&&!isBaseline)process.exitCode=1;
