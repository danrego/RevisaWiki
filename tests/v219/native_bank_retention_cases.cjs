'use strict';
// Native list-defined references keep their text and selected associations.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'native-reference-bank-retention',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),
 helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/preservation_equivalence.js'))),bundles:[],cases:[],checks:0,failures:[],
 helperInjection:false,networkRequests:0,wikipediaWrites:0};
const equal=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(x,message)=>{report.checks++;assert.ok(x,message);};
for(const file of files){const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);
 for(const name of ['v219NativeBankBodyIdentity','v219NativeBankSource','v219NativeBankRetention'])assert.equal(typeof api[name],'function','The actual runtime must export '+name);
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
  authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false};
 function test(id,fn){try{fn();report.cases.push({bundle,id,status:'passed',evidenceKind:'guard-only-explicit-endpoint'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:error.message});report.cases.push({bundle,id,status:'failed'});}}
 const bank=(name,group,body)=>'Fato.<ref'+(group?' group="'+group+'"':'')+' name="a"/>'+
  '{{'+name+'|'+(group?(name.toLowerCase()==='reflist'?'group=':'grupo=')+group+'|':'')+'refs=<ref name="a">'+body+'</ref>}}';
 for(const [name,group]of [['Reflist','n'],['Referências','n'],['Referência','n'],['References','n'],['Notas','nota'],['Notas e referências','']])
 for(const body of ['Fonte literal.','{{Citar web|título=Publicação literal|url=https://example.invalid/fonte|autor=Autoria literal}}'])
 test('exact-native-source-'+name+'-'+body.length,()=>{
  const before=bank(name,group,body),source=api.v219NativeBankSource(before,cfg);
  equal(source.eligible,true,'The demonstrated complete top-level native bank is within the finite guard scope');
  equal(source.complete,true,'No source identity, group, body or bank field is ambiguous');
  equal(source.obligations.size,1,'One exact unique definition is retained as an obligation');
  const after=before+'\nTexto acrescentado.';
  equal(api.v219NativeBankRetention(before,after,cfg).accepted,true,'An unrelated edit does not invent bank loss');
  equal(api.v219NativeBankRetention(before,after,cfg).checked,1,'The bank obligation was actually checked');
  equal(api.preservationAudit(before,after,cfg).filter(x=>x.code==='lost-native-reference-bank'),[],'The installed global audit admits the retained bank');
  for(const [id,changed]of [['body',after.replace('Fonte literal.','Fonte alterada.').replace('Publicação literal','Outra publicação')],
   ['delete',after.replace(/<ref name="a">[\s\S]*?<\/ref>/,'')],['name',after.replace('name="a">','name="b">')],
   ['unknown-owner','{{Modelo fictício|texto='+after+'}}'],['unknown-bank',after.replace('|refs=','|refs={{Modelo fictício}}')]]){
   equal(api.v219NativeBankRetention(before,changed,cfg).accepted,false,'A changed '+id+' cannot reuse an exact native bank obligation');
   ok(api.preservationAudit(before,changed,cfg).some(x=>x.code==='lost-native-reference-bank'),'The installed global audit reports the changed '+id);
   ok(api.safeComposition(before,changed,cfg)!=='','The actual composition guard rejects the changed '+id);
  }
  if(group)equal(api.v219NativeBankRetention(before,after.replace('group='+group,'group=outro').replace('grupo='+group,'grupo=outro'),cfg).accepted,false,'The selected native group remains associated with the same source definition');
  const result=api.calculate({kind:'adjust',source:before,options:cfg});
  equal(result.preservation||[],[],'The complete actual action has no new native-bank false finding');
  equal(api.v219NativeBankRetention(before,result.text,cfg).accepted,true,'The real first endpoint retains the bank obligations');
  equal(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'The complete actual native bank result is idempotent');
 });
 const dateBefore=bank('Reflist','n','{{Citar web|título=Publicação literal|url=https://example.invalid/fonte|data=31/12/2020|acessodata=2025-1-14}}'),
  dateAfter=dateBefore.replace('31/12/2020','31 de dezembro de 2020').replace('2025-1-14','2025-01-14');
 test('finite-date-normalization',()=>{equal(api.v219NativeBankRetention(dateBefore,dateAfter,cfg).accepted,true,'Finite native date spelling preserves the full citation and date');
  equal(api.v219NativeBankRetention(dateBefore,dateAfter.replace('2025-01-14','2025-01-15'),cfg).accepted,false,'A different citation day is still rejected');
  equal(api.v219NativeBankRetention(dateBefore,dateAfter,{...cfg,dates:false}).accepted,false,'A disabled date preference cannot authorize that rewrite');});
 const imageBefore=bank('Reflist','n','[[File:Exemplo.svg|20px|alt=Descrição literal]]'),imageAfter=imageBefore.replace('[[File:','[[Imagem:');
 test('finite-native-file-namespace',()=>{equal(api.v219NativeBankRetention(imageBefore,imageAfter,cfg).accepted,true,'An exact native file namespace alias preserves the body');
  for(const changed of [imageAfter.replace('Exemplo.svg','Outro.svg'),imageAfter.replace('Descrição literal','Descrição alterada'),imageAfter.replace('[[Imagem:','[[:Imagem:')])
   equal(api.v219NativeBankRetention(imageBefore,changed,cfg).accepted,false,'A file, alt text or embedding type cannot hide in namespace equivalence');});
 test('url-state-roles-remain-distinct',()=>{
  const before=bank('Reflist','n','{{Citar web|título=Publicação literal|url=https://example.invalid/fonte|arquivourl=https://example.invalid/arquivo|urlmorta=no}}');
  for(const replacement of ['url-status=live','urlmorta=live','urlmorta=yes'])equal(api.v219NativeBankRetention(before,before.replace('urlmorta=no',replacement),cfg).accepted,false,'Distinct native URL state roles and values remain literal obligations');
 });
 for(const name of ['Referências','Reflist'])test('minimal-external-reference-has-no-invented-state-'+name,()=>{
  const before=bank(name,'n','[https://example.invalid/fonte Título literal]'),
   after=bank(name,'n','{{Citar web|url=https://example.invalid/fonte|título=Título literal}}');
  equal(api.v219NativeBankRetention(before,after,cfg).accepted,true,'A citation without a URL-state field contributes no state obligation');
  equal(api.preservationAudit(before,after,cfg),[],'The installed global guard preserves the same minimal external reference');
  equal(api.safeComposition(before,after,cfg),'','The bank and minimal-reference proofs compose without an empty state placeholder');
  for(const [id,changed]of [['url',after.replace('/fonte','/outra')],['title',after.replace('Título literal','Título alterado')],
   ['name',after.replace('name="a">','name="b">')],['group',after.replace('grupo=n','grupo=m').replace('group=n','group=m')],
   ['state',after.replace('|título=Título literal','|url-status=dead|título=Título literal')]]){
   equal(api.v219NativeBankRetention(before,changed,cfg).accepted,false,'A different '+id+' cannot borrow the stateless minimal-reference identity');
   ok(api.preservationAudit(before,changed,cfg).length>0,'The actual guard rejects a changed '+id+' in the bank');
   ok(api.safeComposition(before,changed,cfg)!=='','The actual composition guard rejects a changed '+id+' in the bank');
  }
 });
 for(const [alias,native]of [['Cite web','Citar web'],['Cite news','Citar jornal'],['Cite book','Citar livro'],['Cite journal','Citar periódico'],['Cite magazine','Citar revista'],['Cite press release','Citar comunicado de imprensa'],['Cite conference','Citar conferência'],['Cite report','Citar relatório'],['Cite video','Citar vídeo'],['Cite encyclopedia','Citar enciclopédia'],['Cite thesis','Citar tese']])
 for(const state of ['', '|url-status=live'])test('exact-native-forwarding-fields-in-bank-'+alias+'-'+state,()=>{
  const before=bank('Referências','','{{'+alias+'|title=Publicação literal|url=https://example.invalid/fonte|last=Pessoa literal|first=Nome literal|publisher=Casa literal|date=2001-03-18'+state+'}}'),
   after=bank('Referências','','{{'+native+'|título=Publicação literal|url=https://example.invalid/fonte|último=Pessoa literal|primeiro=Nome literal|publicado=Casa literal|data=18 de março de 2001'+state+'}}');
  equal(api.v219NativeBankRetention(before,after,cfg).accepted,true,'Pinned local forwarding and the same accepted native roles retain the complete bank body');
  equal(api.preservationAudit(before,after,cfg),[],'The installed guard admits exact native field identities in a bank');
  equal(api.safeComposition(before,after,cfg),'','The native field identity and bank proof compose');
  for(const [id,changed]of [['person',after.replace('Pessoa literal','Outra pessoa')],['publisher',after.replace('Casa literal','Outra casa')],['day',after.replace('18 de março','19 de março')],
   ['title',after.replace('Publicação literal','Outra publicação')],['url',after.replace('/fonte','/outra')],['name',after.replace('name="a">','name="b">')],
   ['unknown',after.replace('|publicado=Casa literal','|campo-desconhecido=Casa literal')],['state',state?after.replace('url-status=live','urlmorta=não'):after.replace('|publicado=Casa literal','|url-status=live|publicado=Casa literal')]]){
   equal(api.v219NativeBankRetention(before,changed,cfg).accepted,false,'A changed '+id+' is not the same native bank obligation');
   ok(api.preservationAudit(before,changed,cfg).length>0,'The actual guard rejects a changed '+id+' after native forwarding');
   ok(api.safeComposition(before,changed,cfg)!=='','The actual composition guard rejects a changed '+id+' after native forwarding');
  }
 });
 test('source-association-swap',()=>{
  const before='A.<ref group="n" name="a"/> B.<ref group="m" name="b"/>'+bank('Reflist','n','Fonte A.')+
   '{{Referências|grupo=m|refs=<ref name="b">Fonte B.</ref>}}',after=before.replace('Fonte A.','Fonte B.').replace('name="b">Fonte B.','name="b">Fonte A.');
  equal(api.v219NativeBankRetention(before,after,cfg).accepted,false,'A body retained under the wrong group/name does not satisfy its original obligation');
 });
 test('exact-source-bound-identical-bank-name-merge',()=>{
  const before='A.<ref name="a"/> B.<ref name="b"/>{{Referências|refs=<ref name="a">Fonte literal.</ref><ref name="b">Fonte literal.</ref>}}',
   after='A.<ref name="a"/> B.<ref name="a" />{{Referências|refs=<ref name="a">Fonte literal.</ref>}}';
  equal(api.v219NativeBankRetention(before,after,cfg).accepted,true,'An exact pre-existing bank graph transaction may consolidate identical named definitions');
  equal(api.v219NativeBankRetention(before,after,{...cfg,automaticIdenticalReferences:false}).accepted,false,'The source-bound merge remains option-sensitive');
  for(const changed of [after.replace('Fonte literal.','Outra fonte.'),after.replace('B.<ref name="a" />','B.<ref name="b" />'),
   after.replace('B.<ref name="a" />','B.'),after.replace('B.<ref name="a" />','B.<ref group="n" name="a" />'),
   after.replaceAll('name="a"','name="outro"')]){
   equal(api.v219NativeBankRetention(before,changed,cfg).accepted,false,'A changed body, unresolved call, missing use, group or unrelated name cannot borrow the merger');
   ok(api.preservationAudit(before,changed,cfg).some(x=>x.code==='lost-native-reference-bank'),'The installed global audit retains the exact bank transaction boundary');
  }
  const distinct=before.replace('name="b">Fonte literal.','name="b">Outra fonte.');
  equal(api.v219NativeBankRetention(distinct,after,cfg).accepted,false,'Different source bodies cannot be merged through a former identical-body proof');
  equal(api.v219NativeBankRetention(before+' C.<ref name="b"/>',after,cfg).accepted,false,'A stale source with another use cannot reuse the original merge count');
 });
 for(const [id,change]of [['unknown-owner',s=>'{{Modelo fictício|texto='+s+'}}'],['quote',s=>'"'+s+'"'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],
  ['comment',s=>'<!-- '+s+' -->'],['markdown',s=>'```wikitext\n'+s+'\n```'],
  ['dynamic-group',s=>s.replace('group=n','group={{Grupo}}')],['duplicate-bank',s=>s.replace('|refs=','|refs=<ref name="b">Outra fonte.</ref>|refs=')],
  ['duplicate-group',s=>s.replace('|group=n','|group=n|group=m')],['numeric-name',s=>s.replace(/name="a"/g,'name="123"')],
  ['conflicting-inline',s=>'<ref group="n" name="a">Fonte conflitante.</ref>'+s],['unknown-body',s=>s.replace('Fonte literal.','{{Modelo fictício|texto=Fonte literal.}}')],
  ['ambiguous-body-fields',s=>s.replace('Fonte literal.','{{Citar web|título=A|titulo=B|url=https://example.invalid/}}')],
  ['unfinished-tail',s=>s+'\n{{Incompleta']])test('quietly-unproved-source-'+id,()=>{
  const before=change(bank('Reflist','n','Fonte literal.')),changed=before.replace('Fonte literal.','Fonte alterada.');
  equal(api.v219NativeBankRetention(before,changed,cfg).checked,0,'An unproved source bank is outside this finite contract and is not claimed as checked');
 });
 test('stale-source-obligation',()=>{const before=bank('Reflist','n','Fonte literal.'),changed=before.replace('Fonte literal.','Fonte alterada.');
  equal(api.v219NativeBankRetention(changed,before,cfg).accepted,false,'The retained source is recomputed rather than reusing a stale body proof');});
 equal(sha(fs.readFileSync(file)),sha(bytes),'The actual bundle remains immutable');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
