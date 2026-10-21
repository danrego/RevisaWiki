'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const report={kind:'named-reference-bindings-independent-of-new-repair',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,wikipediaWrites:0,networkRequests:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
for(const file of files){const bytes=fs.readFileSync(file),a=require(file),bundle=path.basename(file),cfg={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',autoPreview:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,endSectionOrder:false,unifiedNotesReferences:false,endMatter:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false};report.bundles.push({bundle,sha256:sha(bytes),version:a.version});
 function check(id,source,target,accepted,overrides={}){const options={...cfg,...overrides};const row={bundle,id,evidenceKind:'guard-only-exact-endpoint',sourceSha256:sha(source),targetSha256:sha(target),status:'passed'};try{const result=a.v219NamedReferenceRetention(source,target,options);eq(result.accepted,accepted,'Per-group/per-collector source and body association must determine this decision');if(accepted){eq(a.preservationAudit(source,target,options),[],'A legitimate finite reference repair keeps all content obligations');eq(a.safeComposition(source,target,options),'','A legitimate finite transaction remains available');}else{ok(a.preservationAudit(source,target,options).length>0,'The production preservation guard rejects a wrong binding without a prerequisite repair');ok(a.safeComposition(source,target,options)!=='','The production composition guard rejects the same wrong binding');}}catch(e){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:e.message});}report.cases.push(row);}
 function probe(id,fn){const row={bundle,id,evidenceKind:'native-observer-only',status:'passed'};try{fn();}catch(e){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:e.message});}report.cases.push(row);}
 const full=(n,b,g='')=>'<ref name="'+n+'"'+(g?' group="'+g+'"':'')+'>'+b+'</ref>',call=(n,g='')=>'<ref name="'+n+'"'+(g?' group="'+g+'"':'')+' />',list=(defs,g='')=>'{{Referências'+(g?'|grupo='+g:'')+(defs?'|refs='+defs:'')+'}}';
 for(const group of ['', 'nota', 'grupo literal']){
  const before='A.'+full('alpha','Fonte A.',group)+' B.'+full('beta','Fonte B.',group)+' C.'+call('alpha',group)+' D.'+call('beta',group)+list('',group),
   after='A.'+full('beta','Fonte A.',group)+' B.'+full('alpha','Fonte B.',group)+' C.'+call('alpha',group)+' D.'+call('beta',group)+list('',group);
  check('inline-name-body-swap-'+group,before,after,false);
  const bank='A.'+call('alpha',group)+' B.'+call('beta',group)+list(full('alpha','Fonte A.',group)+full('beta','Fonte B.',group),group),
   swapped='A.'+call('alpha',group)+' B.'+call('beta',group)+list(full('beta','Fonte A.',group)+full('alpha','Fonte B.',group),group);
  check('list-defined-name-body-swap-'+group,bank,swapped,false);
  const first='A.'+call('alpha',group)+list(full('alpha','Fonte A.',group),group),second='B.'+call('alpha',group)+list(full('alpha','Fonte B.',group),group),
   changedFirst='A.'+call('alpha',group)+list(full('alpha','Fonte B.',group),group),changedSecond='B.'+call('alpha',group)+list(full('alpha','Fonte A.',group),group);
  check('same-name-two-collector-banks-'+group,first+'\n'+second,changedFirst+'\n'+changedSecond,false);
  check('same-name-two-inline-collectors-'+group,'A.'+full('alpha','Fonte A.',group)+call('alpha',group)+list('',group)+'\nB.'+full('alpha','Fonte B.',group)+call('alpha',group)+list('',group),'A.'+full('alpha','Fonte B.',group)+call('alpha',group)+list('',group)+'\nB.'+full('alpha','Fonte A.',group)+call('alpha',group)+list('',group),false);
  check('unchanged-bank-'+group,bank,bank,true);
  const translated='A.'+full('alpha','{{Cite web|title=Fonte literal|url=https://example.invalid/fonte|date=2001-03-05}}',group)+' B.'+call('alpha',group)+list('',group),native=translated.replace('Cite web|title=','Citar web|título=').replace('|date=','|data=');
  check('known-native-header-and-fields-'+group,translated,native,true);
  for(const [id,from,to]of [['title','Fonte literal','Outra fonte'],['url','example.invalid/fonte','example.invalid/outra'],['date','2001-03-05','2002-03-05']])check('changed-'+id+'-'+group,translated,native.replace(from,to),false);
 }
 const adjacent='Texto.'+full('alpha','Fonte literal.')+call('alpha')+list('');check('declared-adjacent-selfcall',adjacent,adjacent.replace(call('alpha'),''),true);
 const moved='Texto.'+call('alpha')+' Outro.'+full('alpha','Fonte literal.')+list(''),movedTarget='Texto.'+full('alpha','Fonte literal.')+' Outro.'+call('alpha')+list('');check('definition-at-first-use',moved,movedTarget,true);
 const noRepair='Texto.'+full('alpha','Fonte literal.')+' Outro.'+call('alpha')+list('');check('manual-call-name-change-without-repair',noRepair,noRepair.replace(call('alpha'),call('beta')),false);
 const two='A.'+full('alpha','Fonte A.')+' B.'+full('beta','Fonte B.')+' C.'+call('alpha')+' D.'+call('beta')+list(''),
  swapped=two.replace('name="alpha">Fonte A.','name="beta">Fonte A.').replace('name="beta">Fonte B.','name="alpha">Fonte B.');
 for(const [id,tail]of [['external','\n[https://example.invalid/incompleto'],['template','\n{{Modelo incompleto'],['raw-tag','\n<nowiki>Trecho incompleto']]){
  check('partial-'+id+'-identity',two+tail,two+tail,true);
  check('partial-'+id+'-name-body-swap',two+tail,swapped+tail,false);
  check('partial-'+id+'-body-change',two+tail,(two+tail).replace('Fonte A.','Outra fonte.'),false);
  check('partial-'+id+'-outside-change',two+'\nTexto literal.  '+tail,two+'\nTexto literal. '+tail,true);
 }
 check('references-option-off-swap',two,swapped,false,{references:false});
 check('references-option-off-identity',two,two,true,{references:false});
 const emptyBoundary=list('')+'\nA.'+full('alpha','Fonte A.')+' B.'+call('alpha')+list('');
 check('remove-empty-leading-collector',emptyBoundary,emptyBoundary.slice(list('').length+1).replace(list(''),'\n\n'+list('')+'\n\n'),true,{structuralRepairs:true});
 const emptyRetained='A.'+full('alpha','Fonte A.')+list('')+' B.'+list('')+' C.'+full('beta','Fonte B.')+list('');
 check('retained-empty-boundary-does-not-authorize-marker-move',emptyRetained,emptyRetained.replace(' B.'+list('')+' C.'+full('beta','Fonte B.'),' B.'+full('beta','Fonte B.')+list('')+' C.'),false);
 const collision='A.'+full('alpha','Fonte A.')+call('alpha')+list('')+'\nB.'+full('alpha','Fonte B.')+call('alpha')+list('');
 check('occupied-collector-call-body-swap',collision,collision.replace('Fonte A.','TEMP.').replace('Fonte B.','Fonte A.').replace('TEMP.','Fonte B.'),false);
 const anonymous='A.<ref>Fonte anônima.</ref>'+list('')+' B.'+full('alpha','Fonte A.')+call('alpha')+list('');
 check('anonymous-occupied-region-retained',anonymous,anonymous.replace('A.<ref>Fonte anônima.</ref>'+list(''),'A.'+list('')+'<ref>Fonte anônima.</ref>'),false);
 const duplicateParts='A.'+full('alpha','{{Citar web||título=Fonte literal||url=https://example.invalid/fonte}}')+' B.'+call('alpha')+list(''),
  repairedParts=duplicateParts.replace('web||','web|').replace('literal||','literal|');
 check('declared-empty-parts-source-baseline',duplicateParts,repairedParts,true);
 check('empty-parts-title-mutation',duplicateParts,repairedParts.replace('Fonte literal','Outra fonte'),false);
 const nested='A.'+full('alpha','{{Citar livro|título={{Cite book|title=Livro interior|date=2001-03-05}}|ano=}}')+' B.'+call('alpha')+list(''),
  nestedTarget=nested.replace('Cite book|','Citar livro|');
 check('nested-native-publication-role-projection',nested,nestedTarget,true);
 for(const [id,from,to]of [['title','Livro interior','Outro livro'],['year','2001-03-05','2002-03-05']])
  check('nested-native-publication-'+id+'-mutation',nested,nestedTarget.replace(from,to),false);
 const maintenance='A.'+full('alpha','Fonte literal.{{Dead link|date=January 2001|outro=valor literal}}')+' B.'+call('alpha')+list(''),
  maintenanceTarget=maintenance.replace('Dead link|','Ligação inativa|');
 check('native-maintenance-header-only',maintenance,maintenanceTarget,true);
 check('native-maintenance-argument-mutation',maintenance,maintenanceTarget.replace('valor literal','outro valor'),false);
 const duplicateBody='A.'+full('alpha','Fonte literal.')+' B.'+full('beta','Fonte literal.')+' C.'+call('alpha')+' D.'+call('beta')+list(''),
  mergedBody='A.'+full('alpha','Fonte literal.')+' B.'+call('alpha')+' C.'+call('alpha')+' D.'+call('alpha')+list('');
 check('declared-identical-body-name-merge',duplicateBody,mergedBody,true);
 const partialAliases='A.'+full('alpha','{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|idioma=inglês}}')+' B.'+call('alpha')+'\n{{Modelo incompleto';
 check('partial-native-language-role',partialAliases,partialAliases.replace('idioma=inglês','idioma=en'),true);
 check('partial-native-language-title-mutation',partialAliases,partialAliases.replace('idioma=inglês','idioma=en').replace('Fonte literal','Outra fonte'),false);
 const pipeName='A.'+full('nome|literal','{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|lingua=português}}')+' B.'+call('nome|literal')+'\n{{Modelo incompleto';
 check('literal-pipe-name-observation',pipeName,pipeName.replace('lingua=português','lingua=pt'),true);
 check('literal-pipe-name-mutation',pipeName,pipeName.replace('lingua=português','lingua=pt').replaceAll('nome|literal','nome|outro'),false);
 const partialDuplicates='A.'+full('alpha','{{Cite web|title=Fonte literal|url=https://example.invalid/fonte}}')+' B.'+full('alpha','{{Cite web|title=Fonte literal|url=https://example.invalid/fonte}}')+'\n{{Modelo incompleto';
 check('partial-raw-identical-class-split',partialDuplicates,partialDuplicates.replace('Cite web|title=','Citar web|título='),false);
 check('partial-entire-class-remains-identical',partialDuplicates,partialDuplicates.replaceAll('Cite web|title=','Citar web|título='),true);
 const opaque='A.'+full('alpha','Fonte A.')+' B.'+call('alpha')+'\n{{Modelo desconhecido|'+full('beta','Fonte B.')+'}}\n{{Incompleto';
 check('partial-unknown-owner-identity',opaque,opaque,true);
 check('partial-unknown-owner-name-mutation',opaque,opaque.replace('name="beta"','name="outro"'),false);
 for(const name of ['Referência','Referencias','References','Notas','Notas e referências']){
  const combined=name==='Notas e referências',group=combined?'':'n',bank='Fato.'+call('alpha',group)+'{{'+name+'|grupo=n|refs='+full('alpha','Fonte literal.')+'}}',target=bank.replace('{{'+name+'|','{{'+(name==='Referência'||name==='Referencias'||name==='References'?'Referências':name)+'|');
  check('native-bank-selected-group-'+name,bank,target,true);
  check('native-bank-selected-body-mutation-'+name,bank,target.replace('Fonte literal.','Outra fonte.'),false);
 }
 const bareCfg={...Object.fromEntries(Object.keys(a.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',bareReferences:true},bare='Texto com "uma abertura que atravessa uma fronteira.\n\nOutra frase.<ref name="fonte">[https://example.invalid/fonte "Título literal"]</ref>',bareTarget=bare.replace('[https://example.invalid/fonte "Título literal"]','{{Citar web|url=https://example.invalid/fonte|título="Título literal"}}');
 check('bare-reference-independent-master-option',bare,bareTarget,true,bareCfg);
 for(const [id,from,to]of [['title','Título literal','Outro título'],['url','example.invalid/fonte','example.invalid/outra'],['name','name="fonte"','name="outra"']])check('bare-independent-'+id+'-mutation',bare,bareTarget.replace(from,to),false,bareCfg);
 check('bare-independent-option-disabled',bare,bareTarget,false,{...bareCfg,bareReferences:false});
 probe('native-bank-observer-selected-fields-and-cache',()=>{
  for(const [head,field,group]of [['Referência','grupo=n','n'],['Predefinição:Referência','grupo=n','n'],['Referências','group=n',''],['Notas','','nota'],['Notas','grupo=',''],['Notas e referências','grupo=n',''],['Reflist','group=n','n']]){
   const source='{{'+head+'|'+(field?field+'|':'')+'refs='+full('alpha','Fonte A.')+full('beta','Fonte B.')+'}}',observed=a.v219NativeReferenceObserver(source);
   eq(observed.refs.map(ref=>[ref.valid,ref.group]),[[true,group],[true,group]],'Native field priority and list-specific bank group stay exact for every cached definition');
  }
  for(const source of ['{{Modelo desconhecido|refs='+full('alpha','Fonte A.')+'}}','{{Referência|refs='+full('alpha','Fonte A.')+'|refs='+full('beta','Fonte B.')+'}}','{{Modelo desconhecido|{{Referência|refs='+full('alpha','Fonte A.')+'}}}}'])
   ok(a.v219NativeReferenceObserver(source).refs.every(ref=>!ref.valid),'Unknown or competing inherited bank scopes cannot borrow a native alias proof');
 });
 eq(sha(fs.readFileSync(file)),sha(bytes),'Runtime remains immutable');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
