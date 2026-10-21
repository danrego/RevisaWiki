'use strict';
// Names hidden from an editing pass remain occupied in the original source.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(value=>path.resolve(value)),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'original-source-reference-name-reservation',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,wikipediaWrites:0,networkRequests:0};
const eq=(actual,expected,note)=>{report.checks++;assert.deepEqual(actual,expected,note);},ok=(value,note)=>{report.checks++;assert.ok(value,note);};
for(const file of files){const bytes=fs.readFileSync(file),a=require(file),bundle=path.basename(file),cfg={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,endMatter:false,endSectionOrder:false,unifiedNotesReferences:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,automaticBiographyPortals:false,automaticTopicPortals:false,authorityControl:false,registryDoiCheck:false};report.bundles.push({bundle,sha256:sha(bytes),version:a.version});
 function run(id,source,expected,options=cfg){const row={bundle,id,evidenceKind:'actual-full-action-exact-endpoint',sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(options)),intentSha256:sha(JSON.stringify({id,action:'adjust',reserveOriginalNames:true})),status:'passed'};try{const actual=a.calculate({kind:'adjust',source,options});row.actualEndpointSha256=sha(actual.text);row.appliedRuleIds=actual.changes.map(change=>change.id);eq(actual.text,expected,'The existing source identity cannot be allocated to another body');eq(actual.preservation,[],'The successful action needs no preservation warning');eq(a.preservationAudit(source,expected,options),[],'The independently specified endpoint retains all obligations');eq(a.safeComposition(source,expected,options),'','Source reservation and proof use the same occupied names');eq(a.calculate({kind:'adjust',source:actual.text,options}).text,actual.text,'A second action does not rename the endpoint again');}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}report.cases.push(row);}
 function probe(id,fn){const row={bundle,id,evidenceKind:'helper-only',status:'passed'};try{fn();}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}report.cases.push(row);}
 const wrappers=[['blockquote',value=>'<blockquote>'+value+'</blockquote>'],['code',value=>'<code>'+value+'</code>'],['unknown',value=>'{{Modelo desconhecido|'+value+'}}'],['quoted',value=>'"'+value+'"']];
 for(const [owner,wrap]of wrappers){
  for(const kind of ['anonymous','numeric','neutral','conflict','dynamic']){
   const reserved=kind==='numeric'?'ref-1':kind==='conflict'?'alpha-2':'ref-auto-1',hidden=wrap('<ref name="'+reserved+'">Fonte protegida.</ref>');
   const raw=kind==='anonymous'?'A.<ref>Outra fonte.</ref> B.<ref>Outra fonte.</ref>':kind==='numeric'?'A.<ref name="1">Outra fonte.</ref> B.<ref name="1" />':kind==='neutral'?'A.<ref name="RevisaWiki-auto-1">Outra fonte.</ref> B.<ref name="RevisaWiki-auto-1" />':kind==='conflict'?'A.<ref name="alpha">Fonte A.</ref> B.<ref name="alpha">Fonte B.</ref>':'A.<ref name="{{Nome calculado}}">Fonte dinâmica.</ref> B.<ref>Outra fonte.</ref> C.<ref>Outra fonte.</ref>';
   // An unknown emitter cannot prove a closed namespace for newly generated
   // anonymous names. Existing literal renames still reserve occupied names.
   const fixed=kind==='anonymous'&&owner!=='unknown'?'A.<ref name="ref-auto-2">Outra fonte.</ref> B.<ref name="ref-auto-2" />':kind==='numeric'?raw.replaceAll('name="1"','name="ref-1-2"'):kind==='neutral'?raw.replaceAll('RevisaWiki-auto-1','ref-auto-1-2'):kind==='conflict'&&owner!=='unknown'?raw.replace('name="alpha">Fonte B.','name="alpha-3">Fonte B.'):raw;
   run(owner+'-'+kind,hidden+'\n'+raw+'\n{{Referências}}',hidden+'\n'+fixed+'\n{{Referências}}');
  }
 }
 const encoded='<blockquote><ref name="ref-auto-&#49;">Fonte protegida.</ref></blockquote>',raw='A.<ref>Outra fonte.</ref> B.<ref>Outra fonte.</ref>',fixed='A.<ref name="ref-auto-2">Outra fonte.</ref> B.<ref name="ref-auto-2" />';
 run('verified-numeric-entity-reservation',encoded+'\n'+raw+'\n{{Referências}}',encoded+'\n'+fixed+'\n{{Referências}}');
 run('caller-cannot-subtract-original-reservation','<code><ref name="ref-auto-1">Fonte protegida.</ref></code>\n'+raw+'\n{{Referências}}','<code><ref name="ref-auto-1">Fonte protegida.</ref></code>\n'+fixed+'\n{{Referências}}',{...cfg,v219ReferenceReservation:{names:[],dynamic:false}});
 const dynamic='<code><ref name="{{Nome calculado}}">Fonte protegida.</ref></code>\n'+raw+'\n[[Tema fictício|Tema fictício]]\n{{Referências}}';
 run('hidden-dynamic-reservation-keeps-outside-link',dynamic,dynamic.replace('[[Tema fictício|Tema fictício]]','[[Tema fictício]]'));
 for(const use of ['{{r|ref-auto-1}}','{{refn|name=ref-auto-1|Fonte fornecida.}}','<ref follow="ref-auto-1">Continuação.</ref>'])
  run('indirect-literal-reservation-'+sha(use).slice(0,12),use+'\n'+raw+'\n{{Referências}}',use+'\n'+fixed+'\n{{Referências}}');
 for(const tail of ['[https://example.invalid/incompleto Rótulo\n<ref name="ref-auto-1">Fonte protegida.</ref>','{{Modelo incompleto\n<ref name="ref-auto-1">Fonte protegida.</ref>']){
  const source=raw+'\n\n'+tail;run('partial-tail-conservative-identity-'+sha(tail).slice(0,12),source,source);
 }
 probe('unclosed-tail-and-native-raw-exclusion',()=>{const source='A.<ref>Outra fonte.</ref>\n<ref name="ref-auto-9">Cauda';ok(a.v219ReferenceNameReservation(source,cfg).names.includes('ref-auto-9'),'The opening name in a partial tail is reserved');eq(a.v219ReferenceNameReservation('<nowiki><ref name="ref-auto-9">Exemplo.</ref></nowiki>',cfg).names,[],'A true native raw example does not reserve a real reference name');const merged=a.v219ReferenceNameReservation('<ref name="local">Fonte.</ref>',{...cfg,v219ReferenceReservation:{names:['extra'],dynamic:true}});ok(merged.dynamic&&merged.names.includes('extra')&&merged.names.includes('local'),'Internal reservations can only add occupied names and dynamic uncertainty');});
 eq(sha(fs.readFileSync(file)),sha(bytes),'The immutable runtime has not changed');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
