'use strict';
// These expected fixtures were written before reading the implementation.
// No production helper is used to construct expected output.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=__dirname,root=path.resolve(dir,'../..');
const script=process.env.REVISAWIKI_QA_SCRIPT||path.join(root,'dist/2.3.0/RevisaWiki_v2_3_completo.js');
const artifacts=path.join(dir,'artifacts');fs.mkdirSync(artifacts,{recursive:true});
const api=require(script),rows=[];let checks=0;
const defaults={namespaceNumber:0,pageTitle:'Ikv 91',authorityControl:false,endTemplateOrder:false,review:false,autoPreview:false,registryDoiCheck:false};
const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},ok=(x,m)=>{checks++;assert(x,m)};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function test(name,fn){let start=checks;try{fn();rows.push({name,passed:true,checks:checks-start})}catch(e){rows.push({name,passed:false,checks:checks-start,error:e.stack})}}
const white=s=>s.replace(/^[ \t]+|[ \t]+$/gm,'').replace(/\n{2,}/g,'\n').trim();
function sourceRefs(s){return [...s.matchAll(/<ref\b[^>]*\/\s*>|<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi)].map(m=>m[0]);}
const fixtures=JSON.parse(fs.readFileSync(path.join(dir,'fixtures.json')));
for(const f of fixtures)test(f.name,()=>{
 const cfg={...defaults,...f.options},bumps=[],warnings=[];
 const helper=f.component==='residues'?api.removeKnownTranslationResidues:api.automaticStructureCleanup;
 const actual=helper(f.source,cfg,(id,n)=>bumps.push({id,n}),x=>warnings.push(x));
 if(f.expected===f.source)eq(actual,f.source,'Ambiguous or protected source must remain byte identical');
 else eq(white(actual),white(f.expected),'Exact expected structural change, disregarding only blank space');
 const twice=helper(actual,cfg,()=>{},()=>{});eq(twice,actual,'Structural helper is idempotent');
 eq(sourceRefs(actual),sourceRefs(f.expected),'Exact expected ref tags and bodies, not just reference count');
 ok(!api.syntaxAudit(actual).some(x=>x.severity==='error'&&!api.syntaxAudit(f.source).some(y=>JSON.stringify(y)===JSON.stringify(x))),'No new local syntax errors');
 if(actual!==f.source)ok(bumps.length>0,'Every actual structural change has a report counter');
});
for(const revision of [73212697,73212811,73212817])test('frozen incident revision '+revision,()=>{
 const source=fs.readFileSync(path.join(root,'tests/fixtures/v23',revision+'.wiki'),'utf8');
 const r=api.calculate({kind:'adjust',source,originalSource:source,options:defaults});
 eq((r.text.match(/\{\{Info\/Arma\b/gi)||[]).length,1,'One surviving infobox');
 eq((r.text.match(/\{\{Refer[eê]ncias\b/gi)||[]).length,1,'One global references renderer');
 const lead=r.text.indexOf("O '''infanterikanonvagn 91'''");ok(lead>=0,'Literal lead preserved');
 ok(!/\{\{(?:Referências|Reflist)|==[^\n]*Referências/.test(r.text.slice(0,lead)),'No reference list heading before lead');
 eq(sourceRefs(r.text),sourceRefs(api.cleanup(source,{...defaults,structuralRepairs:false}).text),'Reference changes limited to existing formatting pipeline');
 eq(api.cleanup(r.text,defaults).text,r.text,'Whole pipeline is idempotent');
 const hunks=api.comparison(source,r);eq(api.composeChanges(source,hunks),r.text,'Accept-all diff yields exact candidate');eq(api.composeChanges(source,hunks.map(h=>({...h,accepted:false}))),source,'Reject-all diff yields original source');
 eq(r.byteMetrics.delta,Buffer.byteLength(r.text)-Buffer.byteLength(source),'Displayed byte delta matches UTF-8 source bytes');eq(r.byteMetrics.added-r.byteMetrics.removed,r.byteMetrics.delta,'Colored additions/removals sum to exact byte delta');
 eq(r.preservation,[],'Source preservation gate passes actual incident');
 const beforeDefs=sourceRefs(source).filter(x=>!/^<ref[^>]*\/>$/.test(x)),afterDefs=sourceRefs(r.text).filter(x=>!/^<ref[^>]*\/>$/.test(x));eq(beforeDefs.length,afterDefs.length,'All original source definitions retained');
 ok(r.changes.some(x=>/repeatedInfoboxes|relocatedReferenceList|redundantReferenceLists/.test(x.id)),'Structural removal visible in report');
 ok(api.summaryTopics(source,r.text,r.changes.map(x=>x.id)).includes('referências'),'Actual refs change in summary');
 if(revision!==73212817)ok(api.summaryTopics(source,r.text,r.changes.map(x=>x.id)).includes('infocaixas'),'Actual infobox change in summary');
 eq(r.minorCheck.eligible,false,'Substantial structural repair not auto minor');
 fs.writeFileSync(path.join(artifacts,revision+'_candidate.wiki'),r.text);
});
// An unclosed literal tail can hide a legitimate collector. Never append a
// second collector into that tail, and do not disable safe prefix repairs.
for(const open of ['<q>','<!--','<code>','<blockquote>'])test('opaque unclosed tail '+open,()=>{
 const prefix='O veículo tinha uma excessão.<ref name=\"a\">Fonte A.</ref>\n';
 const tail=open+'Trecho literal preservado.\n{{Referências}}\n[[Categoria:Tanques da Suécia]]\n';
 const source=prefix+tail,r=api.calculate({kind:'adjust',source,originalSource:source,options:defaults});
 eq(r.text.slice(r.text.indexOf(open)),tail,'Every byte in the opaque tail remains literal');
 eq((r.text.match(/\{\{Refer[eê]ncias\b/gi)||[]).length,1,'No additional hidden references renderer is appended');
 ok(r.text.slice(0,r.text.indexOf(open)).includes('exceção'),'Valid prefix spelling fix remains enabled');
 eq(api.cleanup(r.text,defaults).text,r.text,'Second click remains stable despite malformed opaque tail');
 eq(r.preservation,[],'Opaque literal and reference source preservation');
 ok(r.warnings.some(w=>/sem fechamento/.test(w)),'The unresolved malformed boundary remains visible to the editor');
 const repeated=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:defaults});eq(repeated.text,r.text,'Repeated full calculate has no appended hidden renderer');
});
for(const pair of [['<q>','</q>'],['<!--','-->'],['<code>','</code>'],['<blockquote>','</blockquote>']])test('closed literal control '+pair[0],()=>{
 const source='Texto.<ref name=\"a\">Fonte A.</ref>\n'+pair[0]+'Trecho literal.'+pair[1]+'\n[[Categoria:Tanques da Suécia]]\n';
 const r=api.cleanup(source,defaults);
 eq((r.text.match(/\{\{Refer[eê]ncias\b/gi)||[]).length,1,'Ordinary missing collector recovery remains enabled when literal block is closed');
 ok(r.text.indexOf('{{Referências}}')>r.text.indexOf(pair[1]),'Recovered list appears outside closed protected block');
 eq(api.cleanup(r.text,defaults).text,r.text,'Closed control remains stable');
});
const realOpaquePath=path.join(root,'tests/fixtures/v23/72309806.wiki');
assert(fs.existsSync(realOpaquePath),'Bundled mathematical-inequality fixture is required');test('actual math inequality lookalike tail 72309806',()=>{
 const source=fs.readFileSync(realOpaquePath,'utf8'),at=source.indexOf('< q < 1,3 AU');ok(at>0,'Frozen real mathematical inequality exists');
 const r=api.calculate({kind:'adjust',source,originalSource:source,options:{...defaults,pageTitle:'Objetos próximos da Terra'}});
 const newAt=r.text.indexOf('< q < 1,3 AU');ok(newAt>0,'Mathematical inequality text retained');eq(r.text.slice(newAt,r.text.indexOf('\n\n',newAt)),source.slice(at,source.indexOf('\n\n',at)),'Full mathematical sentence remains byte identical');
 for(const fact of ['Unusual Minor Planets',"Planetary Resources' Arkyd-6 prototype imaging satellite has left the building",'One year after Planetary Resource faded into history, space mining retails its appeal','Rosetta lands on 67P in grand finale to two year comet mission'])ok(r.text.includes(fact),'Manually reviewed bibliographic title after inequality retained: '+fact);
 ok(!r.warnings.some(w=>/Bloco <q> sem fechamento/.test(w)),'Plain inequality does not emit a false unclosed-quotation warning');
 eq((r.text.match(/\{\{Refer[eê]ncias\b/gi)||[]).length,(source.match(/\{\{Refer[eê]ncias\b/gi)||[]).length,'No additional collector in actual 135KB article');
 eq(api.cleanup(r.text,{...defaults,pageTitle:'Objetos próximos da Terra'}).text,r.text,'Actual article stable on second click');
 eq(r.preservation,[],'Actual source-preservation gate passes');
 fs.writeFileSync(path.join(artifacts,'72309806_opaque_candidate.wiki'),r.text);
});
for(const fragment of ['< q <','< a <','< x <','< Q <','< q<','<\tq\t<','<  x  <'])test('plain mathematical inequality not HTML '+JSON.stringify(fragment),()=>{
 const sentence='A distância satisfaz 1,017 UA '+fragment+' 1,3 AU.';
 const source='Texto.<ref name=\"a\">Fonte A.</ref>\n'+sentence+'\n{{Referências}}\n[[Categoria:Tanques da Suécia]]\n';
 const r=api.calculate({kind:'adjust',source,originalSource:source,options:defaults});
 ok(r.text.includes(sentence),'Inequality byte sequence preserved');ok(!r.warnings.some(w=>/Bloco <[qax]> sem fechamento/.test(w)),'No false protected-tag warning');
 eq((r.text.match(/\{\{Refer[eê]ncias\b/gi)||[]).length,1,'No repeated collector');eq(api.cleanup(r.text,defaults).text,r.text,'One-click idempotence');eq(r.preservation,[],'Plain mathematical prose retained');
});
test('genuine attributed q body remains protected',()=>{
 const body='<q class=\"literal\">Texto com excessão. {{Referências}} [[Categoria:!Artigos com descrição curta]]</q>';
 const source='Texto.<ref name=\"a\">Fonte A.</ref>\n'+body+'\n';const r=api.cleanup(source,defaults);
 ok(r.text.includes(body),'Real q content preserved literally');ok(r.text.lastIndexOf('{{Referências}}')>r.text.indexOf('</q>'),'Required real collector recovered outside closed quote');eq(api.cleanup(r.text,defaults).text,r.text,'Protected attributed quote stable');
});
// Content losses not attributable to exact source-safe normalization stay blocked.
for(const [name,before,after,code] of [
 ['ordinary prose loss','Texto com detalhe preservado.','Texto com detalhe.','lost-prose'],
 ['URL loss','Texto. [https://example.invalid/a Fonte]','Texto.','lost-url'],
 ['image loss','Texto. [[Imagem:Imagem.jpg|miniatura|Figura]]','Texto.','lost-image'],
 ['literal protected loss','Texto. <nowiki>{{Exemplo|a=b}}</nowiki>','Texto.','lost-protected'],
 ['DOI loss','Texto.<ref>{{Citar periódico|doi=10.1234/teste|titulo=Fonte}}</ref>','Texto.','lost-identifier']
])test('preservation still rejects '+name,()=>ok(api.preservationAudit(before,after).some(x=>x.code===code),'Existing preservation gate remains strict'));
const report={version:api.version,script,path:script,scriptSha256:sha(fs.readFileSync(script)),fixtureSha256:sha(fs.readFileSync(path.join(dir,'fixtures.json'))),cases:rows.length,checks,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,wikipediaWrites:0,networkRequests:0,tests:rows};
fs.writeFileSync(process.env.REVISAWIKI_QA_REPORT||path.join(artifacts,'independent_contract_results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,tests:rows.filter(x=>!x.passed)}));process.exitCode=report.failed?1:0;
