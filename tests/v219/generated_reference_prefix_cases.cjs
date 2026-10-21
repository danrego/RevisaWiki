'use strict';
// Exact source-pinned namespace boundaries. No generated name/body is guessed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),files=process.argv.slice(2).map(file=>path.resolve(file));
if(!files.length)throw new Error('Pass immutable actual core and complete runtimes');
const report={kind:'native-generated-reference-prefix-boundary',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),primaryContracts:['native_note_emitter_contract.json','native_short_reference_prefix_contract.json','native_short_citation_author_repair_contract.json','native_nested_short_reference_repair_contract.json'].map(name=>({name,sha256:sha(fs.readFileSync(path.join(__dirname,name)))})),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
const eq=(a,b,n)=>{report.checks++;assert.deepEqual(a,b,n);},ok=(a,n)=>{report.checks++;assert.ok(a,n);};
for(const file of files){
 const bytes=fs.readFileSync(file),a=require(file),bundle=path.basename(file),cfg={...Object.fromEntries(Object.keys(a.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',references:true,shortCitationChecks:true},base={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',endMatter:false,endSectionOrder:false,unifiedNotesReferences:false,automaticTopicPortals:false,automaticBiographyPortals:false,authorityControl:false,registryDoiCheck:false,autoPreview:false};
 report.bundles.push({bundle,sha256:sha(bytes),version:a.version});
 const book='{{Citar livro|titulo=Publicação literal|ultimo=Alfa|ultimo2=Beta|ano=2020|ref=harv}}',wrap=note=>'Texto.'+note+'\n\n== Bibliografia ==\n'+book+'\n',def=(name,body='Fonte literal.')=>'<ref name="'+name+'">'+body+'</ref>';
 function probe(id,fn){const row={bundle,id,status:'passed',evidenceKind:'source-bound-reader-or-guard'};try{fn();}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}report.cases.push(row);}
 function action(id,source,expected,options=cfg){const row={bundle,id,status:'passed',evidenceKind:'actual-full-action-exact-endpoint',sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(options)),intentSha256:sha(JSON.stringify({id,action:'adjust',nativePrefix:true}))};try{const result=a.calculate({kind:'adjust',source,options});row.actualEndpointSha256=sha(result.text);row.appliedIds=result.changes.map(change=>change.id);eq(result.text,expected,'The original independently written endpoint is reached');eq(result.preservation,[],'The complete action has no false retention warning');eq(a.preservationAudit(source,expected,options),[],'The exact source transaction preserves its obligations');eq(a.safeComposition(source,expected,options),'','The exact transaction composes');eq(a.calculate({kind:'adjust',source:expected,options}).text,expected,'The complete action converges after one click');}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}report.cases.push(row);}
 for(const head of ['sfn','sfnp']){
  const source=wrap('{{'+head+'|Alfa, Beta|2020}}'),expected=source.replace('|Alfa, Beta|','|Alfa|Beta|');
  action('original-local-author-endpoint-'+head,source,expected);
  action('original-local-author-endpoint-defaults-'+head,source,expected,base);
  for(const options of [{...cfg,references:false},{...cfg,shortCitationChecks:false}])action('original-option-off-'+head+'-'+sha(JSON.stringify(options)).slice(0,8),source,source,options);
  for(const [bad,good]of [['ULTIMO','último'],['Titulo','título'],['títlo','titulo']]){
   const original=source.replace(bad==='ULTIMO'?'ultimo=':'titulo=',bad+'='),target=expected.replace(bad==='ULTIMO'?'ultimo=':'titulo=',good+'=');
   action('native-key-repair-composition-'+head+'-'+bad,original,target,base);
  }
  probe('author-anchor-mutations-'+head,()=>{for(const bad of [expected.replace('ultimo=Alfa','ultimo=Gama'),expected.replace('ano=2020','ano=2021'),expected.replace('Publicação literal','Outra publicação')]){ok(a.preservationAudit(source,bad,cfg).length>0,'Author repair cannot change local anchor/publication');ok(a.safeComposition(source,bad,cfg)!=='','Composition preserves publication identity');}});
 }
 const nested='<ref>{{sfn|Nome|2001}}</ref>',nestedExpected='{{sfn|Nome|2001}}\n\n{{Referências}}\n\n';
 action('original-nested-wrapper-endpoint',nested,nestedExpected,{...base,endMatter:true,endSectionOrder:true});
 const normal='A.'+def('alpha')+' B.'+def('beta')+' C.<ref name="beta" /> D.{{sfn|Exemplo|2001}}\n{{Referências}}',sameBodyMutant=normal.replace('name="beta"','name="FOOTNOTEExemplo2001"').replace('name="beta"','name="FOOTNOTEExemplo2001"');
 probe('risk-introduced-after-independent-body-identity',()=>{eq(a.v219GeneratedReferenceBoundary(normal).safe,true,'Ordinary literal names are disjoint from native prefix');eq(a.v219ReferenceIdentityQuarantine(normal,cfg).opaque,false,'A finite safe page is not globally reference-opaque');for(const bad of [sameBodyMutant,normal.replace('name="beta"','name="&#70;OOTNOTEExemplo2001"'),normal.replace('|2001}}','|2001|name=}}'),normal.replace('|2001}}','|2001|nome=literal}}'),normal+'\n{{Modelo desconhecido|Dado}}',normal+'\n[[#FOOTNOTEExemplo2001|Nota]]',normal+'\n{{Refn|name=FOOTNOTEExemplo2001}}']){ok(!a.v219UncertainReferenceRetention(normal,bad,cfg).accepted,'After-only dependencies are rejected');ok(a.preservationAudit(normal,bad,cfg).length>0,'The public audit rejects an introduced dependency');ok(a.safeComposition(normal,bad,cfg)!=='','Composition rejects an introduced dependency');}});
 probe('unchanged-generated-helper-cannot-cross-native-events',()=>{for(const bad of [normal.replace(' D.{{sfn|Exemplo|2001}}','').replace(' B.', ' {{sfn|Exemplo|2001}} B.'),normal.replace(' D.{{sfn|Exemplo|2001}}','')+'\n{{sfn|Exemplo|2001}}',normal.replace(' C.<ref name="beta" />','').replace(' D.{{sfn|Exemplo|2001}}',' D.{{sfn|Exemplo|2001}} C.<ref name="beta" />')]){ok(a.preservationAudit(normal,bad,cfg).length>0,'Unchanged helper bytes cannot cross marker/list boundaries');ok(a.safeComposition(normal,bad,cfg)!=='','Composition preserves symbolic event order');}});
 for(const suffix of ['|name=','|nome=','|name=externa','|p={{Local calculado}}']){
  const source=normal.replace('|Exemplo|2001}}','|Exemplo|2001'+suffix+'}}');
  probe('explicit-or-dynamic-risk-'+sha(suffix).slice(0,10),()=>ok(a.v219ReferenceIdentityQuarantine(source,cfg).opaque,'Explicit blank/dynamic names remain opaque'));
 }
 const two=wrap('{{sfn|Alfa, Beta|2020}}')+'{{Sfnp|Alfa|Beta|2020}}\n';
 action('second-generated-helper-refuses-author-rename',two,two);
 for(const [id,source]of [['ignored-field',wrap('{{sfn|Alfa, Beta|2020}}').replace('ultimo=Alfa','ULTIMO=Alfa')],['invalid-header',wrap('{{sfn|Alfa, Beta|2020}}').replace('Citar livro','CITAR LIVRO')],['blank-alias',wrap('{{sfn|Alfa, Beta|2020}}').replace('ultimo=Alfa','last=|ultimo=Alfa')],['unknown-owner',wrap('{{sfn|Alfa, Beta|2020}}')+'{{Modelo desconhecido|Dado}}']])action('no-original-anchor-authority-'+id,source,source);
 for(const wrapOwner of [value=>'<code>'+value+'</code>',value=>'"Trecho '+value+' citado."',value=>'{{Modelo desconhecido|'+value+'}}']){const source=wrap(wrapOwner('{{sfn|Alfa, Beta|2020}}'));action('protected-author-remains-source-'+sha(source).slice(0,10),source,source);}
 for(const head of ['Sfn','Sfnp','HarvRef','Sfnm','Sfnmp'])probe('pinned-prefix-'+head,()=>{const source='Texto.{{'+head+'|Exemplo|2001}}\n{{Referências}}';eq(a.v219GeneratedReferenceBoundary(source).safe,true,'Only the pinned immutable prefix is used');eq(a.v219ReferenceIdentityQuarantine(source,cfg).opaque,false,'An unreferenced generated suffix need not freeze independent named refs');});
 for(const head of ['Sfn','HarvRef','Sfnmp']){
  const source='Texto.{{'+head+'|Alfa|2001}} <ref name="a">Fonte literal.</ref>\n\n{{Referências}}\n\n{{Referências}}\n\n',expected=source.replace('\n\n{{Referências}}\n\n{{Referências}}','\n\n{{Referências}}');
  action('adjacent-redundant-collector-'+head,source,expected,base);
  const ordinary='A.<ref name="a">Fonte literal.</ref><ref name="a" /> {{'+head+'|Alfa|2001}}\n{{Referências}}';
  action('adjacent-named-marker-source-proof-'+head,ordinary,ordinary.replace('<ref name="a" />',''),base);
  probe('physical-native-list-window-'+head,()=>{const before='Texto.{{'+head+'|Alfa|2001}}\n{{Referências}}',bad=before.replace('Texto.','{{Referências}}\nTexto.').replace(/\n\{\{Referências}}$/,'');ok(a.preservationAudit(before,bad,base).length>0,'A collector cannot cross a pinned helper omitted by a legacy counter');ok(a.safeComposition(before,bad,base)!=='','The same native event window is retained');});
 }
 const minimal='Texto.{{Sfn|Alfa|2001}} <ref name="a">Fonte literal.</ref>\n{{Referências}}\n{{Referências}}';
 action('original-minimal-redundant-collector-source',minimal,minimal.replace('\n{{Referências}}\n{{Referências}}','\n{{Referências}}'),base);
 for(const head of ['HarvRef','Sfnmp'])probe('minimal-collector-original-integration-'+head,()=>{const source=minimal.replace('Sfn|',head+'|'),result=a.calculate({kind:'adjust',source,options:base}),minimalEndpoint=source.replace('\n{{Referências}}\n{{Referências}}','\n{{Referências}}'),formattedEndpoint=minimalEndpoint.replace('\n{{Referências}}','\n\n{{Referências}}\n\n');ok([minimalEndpoint,formattedEndpoint].includes(result.text),'Only literal collapse or independently standard list-boundary spacing is allowed');eq((result.text.match(/\{\{Referências}}/g)||[]).length,1,'Exactly one original default collector remains');ok(result.text.includes('<ref name="a">Fonte literal.</ref>'),'The complete original reference body and name remain exact');eq(result.preservation,[],'The original minimal source has no false retention warning');eq(a.preservationAudit(source,result.text,base),[],'The exact allowed native event transaction is retained');eq(a.safeComposition(source,result.text,base),'','The original minimal source transaction composes');eq(a.calculate({kind:'adjust',source:result.text,options:base}).text,result.text,'The exact allowed source endpoint converges');});
 for(const [head,field]of [['Sfn','group'],['Sfn','grupo'],['Sfnp','group'],['HarvRef','grupo']]){
  const source='Texto.{{'+head+'|Nome|2001|'+field+'=n}}';
  action('custom-generated-group-no-invented-default-'+head+'-'+field,source,source,{...base,endMatter:true,endSectionOrder:true});
  const nestedCustom='<ref>{{'+head+'|Nome|2001|'+field+'=n}}</ref>';
  if(['Sfn','HarvRef'].includes(head))action('custom-generated-nested-no-invented-default-'+head+'-'+field,nestedCustom,nestedCustom,{...base,endMatter:true,endSectionOrder:true});
 }
 for(const head of ['Sfn','HarvRef']){
  const source='<ref>{{'+head+'|Nome|2001|group=n}}</ref>\n{{Referências|grupo=n}}',expected='{{'+head+'|Nome|2001|group=n}}\n{{Referências|grupo=n}}';
  action('nested-custom-group-existing-matching-collector-'+head,source,expected,base);
 }
 probe('protected-outer-wrapper-no-proof-only-activation',()=>{const source='<code><ref>{{sfn|Nome|2001}}</ref></code>',changed='<code>{{sfn|Nome|2001}}</code>';ok(!a.v219UncertainReferenceRetention(source,changed,base).accepted,'The ordinary nested-wrapper contract cannot authorize a protected edit');ok(a.preservationAudit(source,changed,base).length>0,'Protected payload stays exact');ok(a.safeComposition(source,changed,base)!=='','The new generated proof retains source permission');});
 probe('default-group-blank-precedence',()=>{for(const [raw,group]of [['{{Sfn|Nome|2001|group=|grupo=n}}',''],['{{Sfn|Nome|2001|grupo=n}}','n'],['{{Sfnm|Nome|2001|group=n}}',''],['{{Sfnmp|Nome|2001|grupo=n}}','']]){const boundary=a.v219GeneratedReferenceBoundary(raw);eq(boundary.safe,true,'Only finite literal group selection is observed');eq(boundary.generated[0].nativeGroup,group,'Native explicit-blank priority is retained');eq(a.v219GeneratedDefaultCollectorAllowed(raw,base),group==='','A default list is allowed only for a default marker');}});
 for(const alias of ['ORDENACAOPADRAO','ORDENAÇÃOPADRÃO','ORDEMPADRAO','ORDEMPADRÃO','DEFAULTSORT','DEFAULTSORTKEY','DEFAULTCATEGORYSORT']){
  const source='Texto.<ref>{{Citar web|títlo=Fonte literal|url=https://example.org/fonte}}</ref>\nNota.{{Sfn|Nome|2001}}\n{{Referências}}\n{{'+alias+':Chave literal}}',expected=source.replace('|títlo=','|titulo=');
  action('literal-native-sort-disjoint-reference-repair-'+alias,source,expected,base);
  probe('literal-sort-does-not-rewrite-generated-helper-'+alias,()=>{eq(a.v219GeneratedReferenceBoundary(source).safe,true,'The exact literal built-in has no reference output');ok(!a.v219ReferenceIdentityQuarantine(source,base).opaque,'A proved literal category key does not freeze disjoint native citations');});
 }
 for(const macro of ['{{defaultsort:Chave literal}}','{{ORDENAÇÃO:Chave literal}}','{{DEFAULTSORT:{{Chave calculada}}}}','{{DEFAULTSORT:Chave|outro}}','{{DEFAULTSORT:Chave<ref>Fonte.</ref>}}','{{DEFAULTSORT:Chave&amp;literal}}']){
  const source='Texto.<ref>{{Citar web|títlo=Fonte literal|url=https://example.org/fonte}}</ref>\nNota.{{Sfn|Nome|2001}}\n{{Referências}}\n'+macro;
  probe('unproved-sort-owner-'+sha(macro).slice(0,10),()=>ok(a.v219ReferenceIdentityQuarantine(source,base).opaque,'Wrong case, guessed alias or expandable owner retains the reference subsystem'));
 }
 probe('finite-footer-and-inert-example',()=>{const source=wrap('{{sfn|Alfa|Beta|2020}}');ok(a.v219GeneratedReferenceBoundary(source+'{{Portal3|Literatura}}').safe,'The literal finite portal chain emits no reference');ok(a.v219UncertainReferenceRetention(source,source+'{{Portal3|Literatura}}',cfg).accepted,'A verified automatic footer introduces no dependency');ok(a.v219GeneratedReferenceBoundary(source+'<nowiki>[[#FOOTNOTEExemplo|nota]] {{Modelo desconhecido}}</nowiki>').safe,'Native inert text creates no dependency');for(const target of ['{{Portal3|{{Portal calculado}}}}','{{Controle de autoridade}}','{{Modelo desconhecido}}'])ok(!a.v219GeneratedReferenceBoundary(source+target).safe,'No unproved footer owner is certified reference-free');});
 eq(sha(fs.readFileSync(file)),sha(bytes),'The actual runtime remains immutable');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
