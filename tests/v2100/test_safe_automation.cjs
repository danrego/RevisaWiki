'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const candidate=require('./candidate.cjs');
const scripts=process.env.REVISAWIKI_SCRIPT?[path.resolve(process.env.REVISAWIKI_SCRIPT)]:candidate.bundleFiles();
if(!process.env.REVISAWIKI_SCRIPT)candidate.verify();
const report={version:'2.10.0',kind:'safe-automatic-duplicate-rules',status:'passed',cases:[],checks:0,assertions:0,failures:[],bundles:[],frozenFiles:process.env.REVISAWIKI_SCRIPT?undefined:candidate.manifest.files,networkRequests:0,wikipediaWrites:0};
const base={namespaceNumber:0,pageTitle:'Exemplo',authorityControl:false,autoPreview:false};
function eq(actual,expected,label){report.checks++;report.assertions++;assert.deepEqual(actual,expected,label);}
function test(bundle,name,fn){try{fn();report.cases.push({bundle,name,passed:true});}catch(error){report.status='failed';report.cases.push({bundle,name,passed:false});report.failures.push({bundle,name,error:candidate.sanitized(error.message)});}}
const cases=[
 ['infobox: empty earlier field','infobox','{{Info/Biografia|nome=|nome=Exemplo}}','{{Info/Biografia|nome=Exemplo}}'],
 ['infobox: multiple earlier empty fields','infobox','{{Info/Biografia|nome=|nome= |nome=Exemplo|ocupação=artista}}','{{Info/Biografia|nome=Exemplo|ocupação=artista}}'],
 ['infobox: literal surviving whitespace','infobox','{{Info/Biografia\n|nome= \n|nome= Exemplo\n}}','{{Info/Biografia\n|nome= Exemplo\n}}'],
 ['infobox: empty final preserves earlier value','infobox','{{Info/Biografia|nome=Exemplo|nome=}}'],
 ['infobox: conflicting filled values','infobox','{{Info/Biografia|nome=|nome=A|nome=B}}'],
 ['infobox: repeated filled values retained','infobox','{{Info/Biografia|nome=A|nome=A}}'],
 ['infobox: commented empty field retained','infobox','{{Info/Biografia|nome=<!-- comentário -->|nome=A}}'],
 ['infobox: dynamic final retained','infobox','{{Info/Biografia|nome=|nome={{PAGENAME}}}}'],
 ['infobox: positional ambiguity retained','infobox','{{Info/Biografia|posição|nome=|nome=A}}'],
 ['infobox: explicit numeric ambiguity retained','infobox','{{Info/Biografia|1=posição|nome=|nome=A}}'],
 ['infobox: exact case-sensitive keys','infobox','{{Info/Biografia|nome=|Nome=A}}'],
 ['infobox: unknown box retained','infobox','{{Info/Inexistente|nome=|nome=A}}'],
 ['infobox: quoted literal retained','infobox','"{{Info/Biografia|nome=|nome=A}}"'],
 ['infobox: nowiki retained','infobox','<nowiki>{{Info/Biografia|nome=|nome=A}}</nowiki>'],
 ['sort: confirmed footer keeps last','defaultsort','Texto.\n{{DEFAULTSORT:Exemplo}}\n{{Portal3|Brasil}}\n{{DEFAULTSORT:Exemplo}}\n[[Categoria:Teste]]','Texto.\n{{Portal3|Brasil}}\n{{DEFAULTSORT:Exemplo}}\n[[Categoria:Teste]]'],
 ['sort: different key retained','defaultsort','Texto.\n{{DEFAULTSORT:A}}\n{{DEFAULTSORT:B}}\n[[Categoria:Teste]]'],
 ['sort: flag retained','defaultsort','{{DEFAULTSORT:A|noerror}}\n{{DEFAULTSORT:A|noerror}}'],
 ['sort: nested key retained','defaultsort','{{DEFAULTSORT:{{PAGENAME}}}}\n{{DEFAULTSORT:{{PAGENAME}}}}'],
 ['sort: body call retained','defaultsort','{{DEFAULTSORT:A}}\nTexto.\n{{DEFAULTSORT:A}}\n[[Categoria:Teste]]'],
 ['sort: unknown footer template retained','defaultsort','{{DEFAULTSORT:A}}\n{{Desconhecida}}\n{{DEFAULTSORT:A}}'],
 ['sort: raw whitespace distinction retained','defaultsort','{{DEFAULTSORT:A}}\n{{DEFAULTSORT: A}}'],
 ['sort: literal example retained','defaultsort','<pre>{{DEFAULTSORT:A}}\n{{DEFAULTSORT:A}}</pre>'],
 ['portal: existing literal migration composes before deduplication','portal','{{Portal|Brasil|Brasil}}','{{Portal3|Brasil}}'],
 ['portal: existing migration trims anonymous slots first','portal','{{Portal|Brasil| Brasil }}','{{Portal3|Brasil}}'],
 ['portal: repeated anonymous slots','portal','{{Portal3|Brasil|Cinema|Brasil|Biografias|Cinema}}','{{Portal3|Brasil|Cinema|Biografias}}'],
 ['portal: explicit numeric slot retained','portal','{{Portal3|Brasil|2=Cinema|3=Brasil}}'],
 ['portal: option retained','portal','{{Portal3|Brasil|Brasil|cor=azul}}'],
 ['portal: hole retained','portal','{{Portal3|Brasil||Brasil}}'],
 ['portal: dynamic slot retained','portal','{{Portal3|Brasil|{{PAGENAME}}|Brasil}}'],
 ['portal: more than ten slots retained','portal','{{Portal3|A|B|C|D|E|F|G|H|I|J|A}}'],
 ['portal: unequal whitespace retained','portal','{{Portal3|Brasil| Brasil}}'],
 ['portal: literal sample retained','portal','"{{Portal3|Brasil|Brasil}}"'],
 ['references: exact named body and all calls','references','A<ref name="a">Fonte.</ref> B<ref name="b">Fonte.</ref> C<ref name=b />\n{{Referências}}','A<ref name="a">Fonte.</ref> B<ref name="a" /> C<ref name="a" />\n{{Referências}}'],
 ['references: first call chooses surviving name','references','A<ref name="b"/> B<ref name="a">Fonte.</ref> C<ref name="b">Fonte.</ref>\n{{Referências}}','A<ref name="b"/> B<ref name="b" /> C<ref name="b">Fonte.</ref>\n{{Referências}}'],
 ['references: group preserved','references','A<ref name="a" group="n">Fonte.</ref> B<ref name="b" group="n">Fonte.</ref> C<ref group="n" name="b" />\n{{Referências|grupo=n}}','A<ref name="a" group="n">Fonte.</ref> B<ref name="a" group="n" /> C<ref group="n" name="a" />\n{{Referências|grupo=n}}'],
 ['references: helper page locator survives','references','A<ref name="a">Fonte.</ref> B<ref name="b">Fonte.</ref> C{{r|b|p=17}}\n{{Referências}}','A<ref name="a">Fonte.</ref> B<ref name="a" /> C{{r|a|p=17}}\n{{Referências}}'],
 ['references: helper multiple names and locators','references','A<ref name="a">Fonte.</ref> B<ref name="b">Fonte.</ref> C{{r|a|b|pp=17–19|loc=Tabela 2}}\n{{Referências}}','A<ref name="a">Fonte.</ref> B<ref name="a" /> C{{r|a|a|pp=17–19|loc=Tabela 2}}\n{{Referências}}'],
 ['references: names with spaces quote safely','references','A<ref name="Fonte comum">Fonte.</ref> B<ref name=b>Fonte.</ref> C<ref name=b/>\n{{Referências}}','A<ref name="Fonte comum">Fonte.</ref> B<ref name="Fonte comum" /> C<ref name="Fonte comum"/>\n{{Referências}}'],
 ['references: different pages not merged','references','A<ref name=a>{{Citar livro|titulo=Fonte|p=2}}</ref> B<ref name=b>{{Citar livro|titulo=Fonte|p=3}}</ref>\n{{Referências}}'],
 ['references: different bodies not merged','references','A<ref name=a>Fonte. p. 2.</ref> B<ref name=b>Fonte. p. 3.</ref>\n{{Referências}}'],
 ['references: differing punctuation retained','references','A<ref name=a>Fonte.</ref> B<ref name=b>Fonte!</ref>\n{{Referências}}'],
 ['references: shared URL insufficient','references','A<ref name=a>[https://example.test Fonte A]</ref> B<ref name=b>[https://example.test Fonte B]</ref>\n{{Referências}}'],
 ['references: different groups retained','references','A<ref name=a group=n>Fonte.</ref> B<ref name=b>Fonte.</ref>\n{{Referências}}'],
 ['references: multiple definitions retained','references','A<ref name=a>Fonte.</ref> B<ref name=b>Fonte.</ref> C<ref name=b>Fonte.</ref>\n{{Referências}}'],
 ['references: conflicting definition retained','references','A<ref name=a>Fonte.</ref> B<ref name=b>Fonte.</ref> C<ref name=b>Outra.</ref>\n{{Referências}}'],
 ['references: renderer separates regions','references','A<ref name=a>Fonte.</ref>\n{{Referências}}\nB<ref name=b>Fonte.</ref>\n{{Referências}}'],
 ['references: later cross-renderer call blocks family','references','A<ref name=a>Fonte.</ref> B<ref name=b>Fonte.</ref>\n{{Referências}}\nC<ref name=b/>\n{{Referências}}'],
 ['references: renderer definitions retained','references','A<ref name=a/> B<ref name=b/>\n<references><ref name=a>Fonte.</ref><ref name=b>Fonte.</ref></references>'],
 ['references: follow retained','references','A<ref name=a>Fonte.</ref> B<ref name=b>Fonte.</ref><ref follow=b>Mais.</ref>\n{{Referências}}'],
 ['references: dynamic name retained','references','A<ref name="{{PAGENAME}}">Fonte.</ref> B<ref name=b>Fonte.</ref>\n{{Referências}}'],
 ['references: dynamic body retained','references','A<ref name=a>{{#if:1|Fonte}}</ref> B<ref name=b>{{#if:1|Fonte}}</ref>\n{{Referências}}'],
 ['references: quoted example retained','references','"<ref name=a>Fonte.</ref> <ref name=b>Fonte.</ref>"\n{{Referências}}'],
 ['references: nowiki example retained','references','<nowiki><ref name=a>Fonte.</ref> <ref name=b>Fonte.</ref></nowiki>'],
 ['references: numeric names left to existing normalizer','references','A<ref name=1>Fonte.</ref> B<ref name=2>Fonte.</ref>\n{{Referências}}'],
 ['references: ambiguous numeric helper retained','references','A<ref name=a>Fonte.</ref> B<ref name=b>Fonte.</ref> C{{r|1=b|p=2}}\n{{Referências}}'],
 ['references: ambiguous helper group blocks all namesakes','references','A<ref name=a group=m>Fonte.</ref> B<ref name=b group=m>Fonte.</ref> C{{r|b|group=n|grupo=m|p=2}}\n{{Referências|grupo=m}}'],
 ['references: dynamic helper group blocks all namesakes','references','A<ref name=a group=m>Fonte.</ref> B<ref name=b group=m>Fonte.</ref> C{{r|b|group={{Grupo}}|p=2}}\n{{Referências|grupo=m}}'],
 ['references: helper inside conditional retained','references','A<ref name=a>Fonte.</ref> B<ref name=b>Fonte.</ref> C{{#if:1|{{r|b|p=2}}}}\n{{Referências}}'],
 ['references: duplicate citation aliases retained','references','A<ref name=a>{{Citar web|titulo=X|título=Y}}</ref> B<ref name=b>{{Citar web|titulo=X|título=Y}}</ref>\n{{Referências}}'],
 ['all: genuine incomplete context retained','portal','{{Portal3|Brasil|Brasil}}\n<ref>Sem fim'],
];
for(const script of scripts){const api=require(script),bundle=path.basename(script);report.bundles.push({file:bundle,version:api.version,sha256:candidate.sha(fs.readFileSync(script))});
 for(const [name,kind,source,expected=source]of cases)test(bundle,name,()=>{const cfg={...base},edits=api.v27SafeAutomationEdits(source,cfg,kind);let after=source;for(const edit of edits.slice().sort((a,b)=>b.start-a.start))after=after.slice(0,edit.start)+edit.text+after.slice(edit.end);eq(after,expected,'Exact finite rule output');const plan=api.v27SafeAutomationPlan(source,cfg);eq(api.v27SafeAutomationProof(source,plan.text,plan,cfg),true,'Source-bound plan proof');eq(api.v27SafeAutomationProof(source,plan.text+'!',plan,cfg),false,'Unapproved change refused');eq(api.v27SafeAutomationPlan(plan.text,cfg).text,plan.text,'Finite plan idempotence');});
 for(const [name,kind,source,expected]of cases.filter(row=>row[3]!==undefined))test(bundle,name+' composes with full cleanup',()=>{const result=api.calculate({kind:'adjust',source,originalSource:source,options:base});eq(result.preservation,[],'No content-loss findings');eq(api.calculate({kind:'adjust',source:result.text,options:base}).text,result.text,'Full pipeline idempotence');eq(api.safeComposition(source,result.text,base),'','Composition accepted');});
 for(const source of ['Texto.\n{{Portal3|Brasil|Brasil}}\n{{Portal3|Brasil}}','{{Info/Biografia|nome=|nome=Exemplo}}\n{{Info/Biografia|nome=Exemplo}}\nTexto.'])test(bundle,'duplicate removal composes with existing structural cleanup '+source.slice(0,24),()=>{const result=api.calculate({kind:'adjust',source,options:base});eq(result.preservation,[],'Confirmed structural duplicate removal accepted');eq(api.calculate({kind:'adjust',source:result.text,options:base}).text,result.text,'Structural cleanup idempotent');});
 test(bundle,'surviving infobox value protected from partial selection',()=>{const source='{{Info/Biografia|nome=|nome=Exemplo|ocupação=Artista}}',plan=api.v27SafeAutomationPlan(source,base);eq(api.syntaxRepairSourceProof(source,plan.text.replace('Exemplo','Outra'),base).accepted,false,'Filled field mutation refused');});
 test(bundle,'surviving portal protected from partial selection',()=>{const source='{{Portal3|Brasil|Cinema|Brasil}}',plan=api.v27SafeAutomationPlan(source,base);eq(api.syntaxRepairSourceProof(source,'{{Portal3|Brasil}}',base).accepted,false,'Unique portal removal refused');});
 test(bundle,'final sort key protected from partial selection',()=>{const source='{{DEFAULTSORT:Exemplo}}\n{{DEFAULTSORT:Exemplo}}\n[[Categoria:Teste]]',plan=api.v27SafeAutomationPlan(source,base);eq(api.syntaxRepairSourceProof(source,plan.text.replace('{{DEFAULTSORT:Exemplo}}',''),base).accepted,false,'Final sort removal refused');});
 test(bundle,'bare reference conversion composes before named merging',()=>{const source='A<ref name=a>[https://example.test Fonte]</ref> B<ref name=b>{{Citar web|url=https://example.test|titulo=Fonte}}</ref>\n{{Referências}}';const plan=api.v27SafeAutomationPlan(source,base);eq(plan.text.includes('[https://example.test Fonte]'),true,'First original bare-link body retained in approved plan');eq(plan.text.includes('name=b'),false,'Equivalent named definition consolidated in first plan');const result=api.calculate({kind:'adjust',source,options:base});eq(result.preservation,[],'Existing bare-reference normalization accepted');eq(api.calculate({kind:'adjust',source:result.text,options:base}).text,result.text,'Bare-reference composition idempotent');eq(api.v27SafeAutomationEdits(source,{...base,bareReferences:false},'references'),[],'Disabled bare-reference conversion does not establish equivalence');});
 test(bundle,'mixed citation aliases merge on first run without losing fields',()=>{const source='A<ref name="a">{{Cite web|url=https://example.test/a|title=Fonte|date=2020-01-01}}</ref> B<ref name="b">{{Citar web|url=https://example.test/a|titulo=Fonte|data=2020-01-01}}</ref> C{{r|b|p=17}}\n{{Referências}}';const plan=api.v27SafeAutomationPlan(source,base);eq(plan.text.includes('name="b"'),false,'Second definition consolidated');eq(plan.text.includes('{{Cite web|url=https://example.test/a|title=Fonte|date=2020-01-01}}'),true,'First original body exact in plan');eq(plan.text.includes('{{r|a|p=17}}'),true,'Helper locator retained');const result=api.calculate({kind:'adjust',source,options:base});eq(result.preservation,[],'Alias conversion preservation');eq(api.calculate({kind:'adjust',source:result.text,options:base}).text,result.text,'Aliases idempotent in same click');});
 for(const options of [{namespaceNumber:1},{sectionOnly:true},{infoboxes:false},{automaticParameterDuplicates:false}])test(bundle,'infobox opt-out '+JSON.stringify(options),()=>{eq(api.v27SafeAutomationEdits('{{Info/Biografia|nome=|nome=A}}',{...base,...options},'infobox'),[],'Opt-out preserved');});
 test(bundle,'proof rejects forged removal and stale source',()=>{const source='{{Portal3|Brasil|Brasil}}',plan=api.v27SafeAutomationPlan(source,base);eq(api.v27SafeAutomationProof(source,'',plan,base),false,'All content deletion refused');eq(api.v27SafeAutomationProof(source+'x',plan.text,plan,base),false,'Stale source refused');eq(api.v27SafeAutomationProof(source,plan.text,{...plan,steps:[]},base),false,'Forged plan refused');});
}
const out=path.join(candidate.artifactDirectory(),'safe_automation.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.failures.length)process.exitCode=1;
