'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),helper=fs.readFileSync(path.join(root,'src/v2_18/citation_islands.js'),'utf8');
const names=['v218CitationIslandScope','v218CitationIslandCall','v218CitationIslandPlan','v218CitationIslandProof','automaticCitationIslands'];
const args=process.argv.slice(2),inputs=args.length?args:['RevisaWiki_v2_17_0.js','RevisaWiki_v2_17_0_completo.js'].map(name=>path.join(root,'dist/2.17.0',name));
const report={kind:'source-bound-citation-islands',status:'passed',cases:0,checks:0,bundles:[],failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,msg)=>{report.checks++;assert.deepEqual(a,b,msg);},ok=(v,msg)=>{report.checks++;assert.ok(v,msg);},hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const tail='\n\nTexto “sem fechamento\n<ref name="posterior">{{Cite web|title=Não mudar|url=https://example.test/depois}}</ref>\n{{Referências}}';
function load(file){const original=fs.readFileSync(file,'utf8');let source=original,injected=false;
 if(!source.includes('function v218CitationIslandPlan(')){source=source.replace('    const api = {',helper+'\n    const api = {'+names.map(name=>name+':'+name+',').join(''));injected=true;}
 if(!injected&&!source.includes(helper.trim()))throw new Error('The release does not embed the helper bytes currently under test');
 const sandbox={module:{exports:{}},require:require('node:module').createRequire(file),console,setTimeout,clearTimeout};vm.runInNewContext(source,sandbox,{filename:path.basename(file),timeout:10000});return {api:sandbox.module.exports,injected,sha256:hash(original)};
}
for(const file0 of inputs){const file=path.resolve(file0),{api,injected,sha256}=load(file),bundle=path.basename(file);report.bundles.push({file:bundle,sha256,helperInjected:injected,helperSha256:hash(helper)});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext'};
 const test=(name,fn)=>{report.cases++;try{fn();}catch(e){report.status='failed';report.failures.push({bundle,name,message:e.message});}};
 const plan=(source,options={})=>api.v218CitationIslandPlan(source,{...cfg,...options});
 function prove(source,expected,count,options={}){const options0={...cfg,...options},p=plan(source,options);eq(p.text,expected,'Exact independently specified endpoint');eq(p.edits.length,count,'Only separately bound names and keys count');ok(api.v218CitationIslandProof(source,expected,p,options0),'The exact source plan has a witness');eq(plan(expected,options).text,expected,'The helper is idempotent');eq(p.text.slice(p.boundary+p.text.length-source.length),source.slice(p.boundary),'The entire suffix is byte-identical');if(count){eq(api.v218CitationIslandProof(source+' ',expected,p,options0),false,'Changed source invalidates proof');eq(api.v218CitationIslandProof(source,expected+' ',p,options0),false,'Changed endpoint invalidates proof');eq(api.v218CitationIslandProof(source,expected,p,{...options0,citations:false}),false,'Changed options invalidate proof');const changed=JSON.parse(JSON.stringify(p));changed.edits[0].text+='x';eq(api.v218CitationIslandProof(source,expected,changed,options0),false,'Tampered local edit invalidates proof');}return p;}
 const bodies=[
  ['Cite web','Citar web','last=Sobrenome|first=Nome|title=Título sintético|date=2001-02-03|url=https://example.test/a','último=Sobrenome|primeiro=Nome|título=Título sintético|data=2001-02-03|url=https://example.test/a',5],
  ['cite news','Citar jornal','title=Título sintético|work=Jornal de teste|access-date=2001-02-03|url=https://example.test/a','título=Título sintético|obra=Jornal de teste|acessodata=2001-02-03|url=https://example.test/a',4],
  ['cite book','Citar livro','title=Título sintético|year=2001|publisher=Editora de teste|isbn=9780140328721','título=Título sintético|ano=2001|publicado=Editora de teste|isbn=9780140328721',4],
  ['Cite journal','Citar periódico','title=Título sintético|journal=Periódico de teste|volume=2','título=Título sintético|periódico=Periódico de teste|volume=2',3],
  ['cite magazine','Citar revista','title=Título sintético|date=2001-02-03|url=https://example.test/a','título=Título sintético|data=2001-02-03|url=https://example.test/a',3]
 ];
 for(const [from,to,fields,expected,count]of bodies)for(const attrs of [' name="a"',' name="a" group=""',' group="n" name="a"'," name='a' group='n'",' name=a'])test('literal family '+from+' '+attrs,()=>{const source='Texto.<ref'+attrs+'>{{'+from+'|'+fields+'}}</ref>'+tail,want='Texto.<ref'+attrs+'>{{'+to+'|'+expected+'}}</ref>'+tail;prove(source,want,count);});
 test('all spelling and whitespace outside names stays exact',()=>{const a='Texto.<ref name="a">\n  {{ Cite web | last = Sobrenome | title = Título sintético | url = https://example.test/a }} \n</ref>'+tail,b=a.replace('Cite web','Citar web').replace('| last =','| último =').replace('| title =','| título =');prove(a,b,3);});
 for(const raw of ['{{Citar web|titulo=Título sintético|ultimo=Sobrenome|url=https://example.test/a}}','{{citar jornal|título=Título sintético|data=2001-02-03|url=https://example.test/a}}'])test('accepted native aliases untouched '+hash(raw).slice(0,8),()=>{const s='Texto.<ref name="a">'+raw+'</ref>'+tail;prove(s,s,0);});
 test('native English-key alias already accepted stays exact',()=>{const s='Texto.<ref name="a">{{Citar web|first=Nome|título=Título sintético|url=https://example.test/a}}</ref>'+tail;prove(s,s,0);});
 const source='Texto.<ref name="a">{{Cite web|title=Título sintético|url=https://example.test/a}}</ref>'+tail;
 const controls=[
  ['conflicting translated key',source.replace('|url=','|título=Outro título|url=')],['duplicate translated key',source.replace('|url=','|título=Título sintético|url=')],
  ['empty override',source.replace('|url=','|título=|url=')],['unknown field',source.replace('|url=','|campo_nao_revisado=Valor|url=')],
  ...['subscription=no','registration=no','url-access=subscription','url-access=free','url-status=unreviewed','dead-url=maybe','deadurl=unknown','subscription=maybe','registration=unknown','url-access=unknown'].map(field=>['unreviewed status value '+field,source.replace('|url=','|'+field+'|url=')]),
  ['nested dynamic value',source.replace('Título sintético','{{Modelo fictício}}')],
  ['multiple citations in one reference',source.replace('}}</ref>','}}{{Citar web|título=Outro|url=https://example.test/b}}</ref>')],
  ['prose and citation in one reference',source.replace('>{{Cite','>Comentário. {{Cite')],['unnamed native reference',source.replace('name="a"','')],
  ['follow reference',source.replace('name="a"','follow="a"')],['direction attribute',source.replace('name="a"','name="a" dir="rtl"')],
  ['dynamic reference identity',source.replace('name="a"','name="{{Modelo fictício}}"')],
  ['inherited list group','Texto.<references group="n"><ref name="a">{{Cite web|title=Título sintético|url=https://example.test/a}}</ref></references>'+tail],
  ['inside infobox','{{Info/Biografia|nome=Pessoa fictícia|nota='+source.split(tail)[0]+'}}'+tail],
  ['inside quotation','“'+source.split(tail)[0]+'”'+tail],['inside code','<code>'+source.split(tail)[0]+'</code>'+tail],
  ['inside nowiki','<nowiki>'+source.split(tail)[0]+'</nowiki>'+tail],['inside comment','<!--'+source.split(tail)[0]+'-->'+tail],
  ['inside quotation template','{{citação|'+source.split(tail)[0]+'}}'+tail],['incomplete reference',source.replace('</ref>','')],
  ['no unresolved tail',source.split(tail)[0]+'\n{{Referências}}'],['generic family remains generic',source.replace('Cite web','Citation')]
 ];
 for(const [name,s]of controls)test('conservative '+name,()=>prove(s,s,0));
 for(const override of [{automaticCitationIslands:false},{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:undefined},{discussionPage:true},{pageRedirect:true},{pageDisambiguation:true},{sectionOnly:true},{section:'2'},{contentModel:'javascript'},{model:'Scribunto'},{citations:false},{references:false},{partialSyntaxRecovery:false}])test('configuration scope '+JSON.stringify(override),()=>prove(source,source,0,override));
 test('differing definitions and all native calls keep their byte-identical identity',()=>{const first=source.split(tail)[0],second=first.replace('Título sintético','Outro título'),s=first+' Outra chamada.<ref name="a" />\n'+second+tail,w=s.split(tail)[0].replaceAll('Cite web','Citar web').replaceAll('|title=','|título=')+tail;prove(s,w,4);});
 test('source facts and native dates are never normalized',()=>{const s=source.replace('Título sintético','Pessoa, "Fato literal", 2001').replace('|url=','|date=2001-02-03|access-date=03-02-2001|url='),w=s.replace('Cite web','Citar web').replace('|title=','|título=').replace('|date=','|data=').replace('|access-date=','|acessodata=');prove(s,w,4);});
 test('unreviewed native revision cannot borrow a witness',()=>{const profile=api.templateCatalog['citar web'],oldid=profile.oldid;try{profile.oldid=-1;prove(source,source,0);}finally{profile.oldid=oldid;}});
 const safeHead='\n\n== Biografia ==\n';
 const tailRef='<ref>{{Cite news|title=Título literal|work=Jornal de teste|url=https://example.test/tail}}</ref>';
 const tailExpected=tailRef.replace('Cite news','Citar jornal').replace('|title=','|título=').replace('|work=','|obra=');
 test('later balanced section recovers a literal anonymous citation after only prose quotation uncertainty',()=>{
  const start='Texto inicial.\n\nTexto “sem fechamento.',s=start+safeHead+'Texto.'+tailRef+'\n{{Referências}}',expected=start+safeHead+'Texto.'+tailExpected+'\n{{Referências}}',p=plan(s);
  eq(p.text,expected,'Only three proven name/key operations occur in the recovered later section');eq(p.edits.length,3,'Three operations counted exactly');ok(api.v218CitationIslandProof(s,expected,p,cfg),'The section-reset plan is bound to source');eq(plan(expected).text,expected,'Recovered later sections are idempotent');eq(expected.slice(0,start.length),start,'The original unresolved prose paragraph stays byte-identical');ok(p.edits.every(edit=>JSON.stringify(edit.proof.changeRules)===JSON.stringify([edit.ruleId])),'Each physical edit declares exactly one operation');
 });
 for(const [name,start,heading]of [
  ['real unfinished template','Texto inicial.\n\n{{Modelo fictício|campo=Texto “sem fechamento.',safeHead],
  ['real unfinished parameter','Texto inicial.\n\n{{{parâmetro|Texto “sem fechamento.',safeHead],
  ['real unfinished table','Texto inicial.\n\n{| class="wikitable"\n| Texto “sem fechamento.',safeHead],
  ['real unfinished comment','Texto inicial.\n\n<!-- Texto “sem fechamento.',safeHead],
  ['real unfinished nowiki','Texto inicial.\n\n<nowiki>Texto “sem fechamento.',safeHead],
  ['real unfinished code','Texto inicial.\n\n<code>Texto “sem fechamento.',safeHead],
  ['real unfinished html','Texto inicial.\n\n<div title="Texto “sem fechamento.',safeHead],
  ['real unfinished div','Texto inicial.\n\n<div>Texto “sem fechamento.',safeHead],
  ['real unfinished link','Texto inicial.\n\n[[Ligação|Texto “sem fechamento.',safeHead],
  ['real stray link close','Texto inicial.\n\nTexto “sem fechamento. ]]',safeHead],
  ['literal example section','Texto inicial.\n\nTexto “sem fechamento.','\n\n== Exemplos de sintaxe ==\n'],
  ['no literal heading reset','Texto inicial.\n\nTexto “sem fechamento.','\n\n'],
  ['level three heading only','Texto inicial.\n\nTexto “sem fechamento.','\n\n=== Biografia ===\n']
 ])test('later section refusal '+name,()=>{const x=start+heading+'Texto.'+tailRef+'\n{{Referências}}';eq(plan(x).text,x,'The later citation remains exact when a true unresolved source scope or literal example is possible');});
 test('a quotation spanning a later section cannot expose a literal source example',()=>{const x='Texto inicial.\n\n“Texto citado'+safeHead+'Texto.'+tailRef+'”\n{{Referências}}';eq(plan(x).text,x,'A complete quotation does not authorize a new unresolved-boundary repair');});
 if(!injected)test('actual production pipeline retains fifteen independent literal citation migrations',()=>{
  const first=[];for(let index=1;index<=13;index++)first.push('Texto sintético '+index+'.<ref name="fonte'+index+'">{{Cite web|last=Sobrenome|title=Título literal '+index+'|url=https://example.test/fonte'+index+'}}</ref>');
  const paragraph='\n\nTexto “citado [[Ligação fictícia|rótulo”]] e “outro trecho".',ending='\n\n== Carreira ==\nTexto.'+tailRef+' Mais texto.'+tailRef.replace('/tail','/tail2')+'\n\n{{Referências}}';
  const input=first.join('\n\n')+paragraph+ending,want=input.replaceAll('Cite web','Citar web').replaceAll('Cite news','Citar jornal').replaceAll('|last=','|último=').replaceAll('|title=','|título=').replaceAll('|work=','|obra=');
  const options={...cfg,autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,minorBaseConfirmed:true,referenceColumns:false};
  const result=api.calculate({kind:'adjust',source:input,options});eq(result.text,want,'The actual production action migrates all fifteen citations, including two anonymous calls after a later section heading');eq(result.preservation.length,0,'The actual production guard accepts the complete endpoint');eq(api.preservationAudit(input,want,options).length,0,'The separate preservation audit retains facts and references');eq(api.safeComposition(input,want,options),'','The selectable composition accepts the exact complete transaction');
  const counts=api.v211RetainedAdjustments(input,want,[],options);eq(counts.exact,true,'The retained counter has exact source witnesses');eq(counts.count,45,'Fifteen names plus thirty independent field names count as forty-five operations');eq(counts.events.length,45,'One event per retained operation');eq(api.summaryForTopics(api.summaryTopics(input,want)),'Ajustes de referências com RevisaWiki.','The summary names the changed domain');eq(result.minorCheck.eligible,true,'Only template and field names qualify as mechanical');eq(api.calculate({kind:'adjust',source:want,options}).text,want,'The actual action is idempotent');
  const bad=want.replace('Título literal 4','Título inventado');ok(Boolean(api.safeComposition(input,bad,options)),'A changed citation title cannot borrow a mechanical transaction');ok(api.preservationAudit(input,bad,options).length>0,'A changed title is rejected independently');
 });
 test('full original quote context preserves an earlier complete named reference when truncation creates a local opener',()=>{
  const first='Texto.<ref name="a">{{Cite web|title=Fonte fictícia|url=https://example.test/a}}</ref>',rest='\n\nTexto: "Citação sem fechamento.\n\nTexto: "Outra citação fechada." Texto.\n\n{{Referências}}',input=first+rest,want=first.replace('Cite web','Citar web').replace('|title=','|título=')+rest;
  const p=prove(input,want,2);eq(p.edits.length,2,'A complete citation remains exposed under the original full-source quotation context');eq(want.slice(want.indexOf('\n\n')),rest,'All quoted prose and the uncertain tail remain byte-identical');
  if(!injected){const options={...cfg,autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,minorBaseConfirmed:true,referenceColumns:false},result=api.calculate({kind:'adjust',source:input,options});eq(result.text,want,'The actual production pipeline applies the two source-bound name changes');eq(result.preservation.length,0,'The production preservation guard accepts the exact endpoint');eq(api.safeComposition(input,want,options),'','The complete source-bound transaction composes safely');const counts=api.v211RetainedAdjustments(input,want,[],options);eq(counts.exact,true,'Count is exact for this prefix-cut regression');eq(counts.count,2,'One template name and one parameter name count separately');eq(result.minorCheck.eligible,true,'Literal native name translations remain mechanical');}
 });
 for(const [key,values]of Object.entries({'url-status':['dead','live'],'dead-url':['yes','no'],deadurl:['yes','no'],subscription:['yes'],registration:['yes'],'url-access':['registration','limited']}))for(const value of values)test('native accepted status key and value stay exact '+key+' '+value,()=>{
  const x=source.replace('|url=','|'+key+'='+value+'|url='),want=x.replace('Cite web','Citar web').replace('|title=','|título=');prove(x,want,2);ok(want.includes('|'+key+'='+value+'|'),'No enum spelling or value is translated');
 });
 for(const value of ['<!-- nota literal -->Título sintético','Título <!-- |last=Não usar --> sintético','Título <!-- {{Modelo fictício}} --> sintético','https://example.test/a<!-- nota literal -->'])test('closed comment is transparent only inside a literal citation value '+hash(value).slice(0,8),()=>{
  const x=value.startsWith('https:')?source.replace('https://example.test/a',value):source.replace('Título sintético',value),want=x.replace('Cite web','Citar web').replace('|title=','|título=');prove(x,want,2);eq((want.match(/<!--[\s\S]*?-->/g)||[]).join(''),(x.match(/<!--[\s\S]*?-->/g)||[]).join(''),'Every comment remains byte-exact');
 });
 for(const [label,raw]of [
  ['comment in name','{{Cite<!-- nota --> web|title=Título sintético|url=https://example.test/a}}'],
  ['comment in parameter name','{{Cite web|ti<!-- nota -->tle=Título sintético|url=https://example.test/a}}'],
  ['comment between name and delimiter','{{Cite web<!-- nota -->|title=Título sintético|url=https://example.test/a}}'],
  ['comment between parameter name and equals','{{Cite web|title<!-- nota -->=Título sintético|url=https://example.test/a}}'],
  ['unclosed comment','{{Cite web|title=Texto <!-- sem fechamento|url=https://example.test/a}}'],
  ['nested comment','{{Cite web|title=Texto <!-- fora <!-- dentro --> resto -->|url=https://example.test/a}}'],
  ['dynamic actual value with a comment','{{Cite web|title={{Modelo fictício}}<!-- nota -->|url=https://example.test/a}}'],
  ['comment closes outside the citation','{{Cite web|title=Texto <!-- nota|url=https://example.test/a}}']
 ])test('comment refusal '+label,()=>{const x='Texto.<ref name="a">'+raw+'</ref>'+tail;prove(x,x,0);});
 const nativeBeforeFile=path.join(root,'tests/v218/native/citation_extended_before.wiki'),nativeAfterFile=path.join(root,'tests/v218/native/citation_extended_after.wiki'),nativeProof=JSON.parse(fs.readFileSync(path.join(root,'tests/v218/native/citation_islands_extended_native_proof.json'),'utf8'));
 test('synthetic native evidence binds the independent source fixtures',()=>{eq(hash(fs.readFileSync(nativeBeforeFile)),nativeProof.sourceSha256.before,'Native before fixture hash matches the observed parse');eq(hash(fs.readFileSync(nativeAfterFile)),nativeProof.sourceSha256.after,'Native after fixture hash matches the observed parse');eq(nativeProof.comparison.acceptedCasesWithErrors,0,'All sixty-five accepted native cases are error-free');eq(nativeProof.comparison.invalidControlErrorsPreservedExactly,true,'Twenty deliberately invalid controls retain their pre-existing errors');});
 const nativeBefore=[...fs.readFileSync(nativeBeforeFile,'utf8').matchAll(/<ref name="fonte(\d+)">([\s\S]*?)<\/ref>/g)],nativeAfter=[...fs.readFileSync(nativeAfterFile,'utf8').matchAll(/<ref name="fonte(\d+)">([\s\S]*?)<\/ref>/g)];
 for(let index=0;index<nativeBefore.length;index++)test('independent native comment or enum fixture '+(index+1),()=>{eq(nativeBefore.length,85,'All native cases remain present');eq(nativeAfter.length,85,'Every before case has an independent after endpoint');const from=nativeBefore[index],to=nativeAfter[index];eq(from[1],to[1],'Reference case identity is unchanged');const call=api.v218CitationIslandCall(from[2],cfg);eq(call.text,to[2],'The actual helper reaches the independent native-rendered endpoint');eq(call.edits.length>0,from[2]!==to[2],'Invalid enum controls remain entirely unchanged');});
 if(!injected)test('actual pipeline preserves a native status alias and a literal comment without losing metadata',()=>{
  const body='{{Cite web|title=Fonte fictícia|url=https://example.test/a|archive-url=https://web.archive.org/web/20010203000000/https://example.test/a<!-- |last=Não usar -->|archive-date=2001-02-03|url-status=live}}',input='Texto.<ref name="a">'+body+'</ref>'+tail,want=input.replace('Cite web','Citar web').replace('|title=','|título=').replace('|archive-url=','|arquivourl=').replace('|archive-date=','|arquivodata=');
  const options={...cfg,autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,minorBaseConfirmed:true,referenceColumns:false},result=api.calculate({kind:'adjust',source:input,options});eq(result.text,want,'The actual action preserves every field value, status spelling and comment byte');eq(result.preservation.length,0,'No metadata is lost');eq(api.safeComposition(input,want,options),'','The complete witnessed transaction is accepted');const count=api.v211RetainedAdjustments(input,want,[],options);eq(count.exact,true,'The source-bound count remains exact with opaque field comments');eq(count.count,4,'Only the template name and three renamed fields count');eq(result.minorCheck.eligible,true,'This source-equivalent name translation remains mechanical');eq(api.calculate({kind:'adjust',source:want,options}).text,want,'The combined comment and native-status case is idempotent');
 });
 if(!injected)test('independent review of the original citation-retention guard after finite date and key projections',()=>{
  const input='<ref name="prova">{{Citar web|Título=Fonte sintética independente|url=https://example.test/independente|accessadoem=3-Fev-2001}}</ref>\n{{Referências}}',expected='<ref name="prova">{{Citar web|título=Fonte sintética independente|url=https://example.test/independente|acessodata=3 de fevereiro de 2001}}</ref>\n{{Referências}}',options={...cfg,autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,minorBaseConfirmed:true,referenceColumns:false};
  eq(api.v281CitationRetention(input,expected,options).accepted,true,'The original guard accepts only equivalent confirmed key and date normalizations');eq(api.preservationAudit(input,expected,options).length,0,'The independent preservation audit agrees for the confirmed endpoint');eq(api.safeComposition(input,expected,options),'','The complete source-bound endpoint composes safely');
  for(const [name,changed]of [
   ['lost access date',expected.replace('|acessodata=3 de fevereiro de 2001','')],['changed access date',expected.replace('3 de fevereiro de 2001','4 de fevereiro de 2001')],
   ['lost title',expected.replace('|título=Fonte sintética independente','')],['changed title',expected.replace('Fonte sintética independente','Fonte substituída')],
   ['lost URL',expected.replace('|url=https://example.test/independente','')],['changed URL',expected.replace('https://example.test/independente','https://example.test/substituido')],
   ['changed citation family',expected.replace('Citar web','Citar livro')]
  ]){eq(api.v281CitationRetention(input,changed,options).accepted,false,'The original retention guard rejects '+name);ok(Boolean(api.safeComposition(input,changed,options)),'The whole-source guard separately refuses '+name);}
  const unclosed=expected.replace('</ref>','');ok(Boolean(api.safeComposition(input,unclosed,options)),'An unclosed reference cannot borrow the finite metadata projection');eq(api.v218CitationMetadataProjection(expected,options),expected,'Canonical metadata is idempotent');
 });
 test('changed facts cannot borrow a source witness',()=>{const p=plan(source);eq(api.v218CitationIslandProof(source,p.text.replace('Título sintético','Outro fato'),p,cfg),false,'No fact edit fits the exact plan');});
}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
