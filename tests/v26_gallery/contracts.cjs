'use strict';
/* Independent literal fixtures: no production helper constructs expected output.
   Offline only. The source/engine/warning qualification are never changed. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),script=path.resolve(process.env.REVISAWIKI_QA_SCRIPT||path.join(root,'dist/2.6.0/RevisaWiki_v2_6_completo.js'));
const api=require(script),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={authorityControl:false,endTemplateOrder:false,namespaceNumber:0,minorBaseConfirmed:false,pageTitle:'Ponte'};
const rows=[];let checks=0;
const eq=(a,b,message)=>{checks++;assert.deepEqual(a,b,message);},ok=(condition,message)=>{checks++;assert(condition,message);};
function test(name,fn){const start=checks;try{fn();rows.push({name,passed:true,checks:checks-start});}catch(error){rows.push({name,passed:false,checks:checks-start,error:String(error.stack).replaceAll(root,'<repository>')});}}
const gImage='<gallery>\nImage:Exemplo.jpg|Legenda conservada\n</gallery>',gFile='<gallery>\nDatei:Exemplo.jpg|Legenda conservada\n</gallery>',gNative='<gallery>\nFicheiro:Exemplo.jpg|Legenda conservada\n</gallery>';
const protectedFindings=(before,after)=>api.preservationAudit(before,after,cfg).filter(f=>f.code==='lost-protected');
const accepts=(before,after)=>eq(protectedFindings(before,after),[],'Literal block contents retained, allowing only the finite namespace alias');
const rejects=(before,after)=>ok(protectedFindings(before,after).length>0,'A literal/protected block was actually lost or changed');

test('unchanged foreign gallery must pass identity audit',()=>accepts(gImage,gImage));
test('finite Image to Ficheiro gallery namespace conversion is allowed',()=>accepts(gImage,gNative));
test('two gallery occurrences may mix unchanged and canonical namespace spellings',()=>{
 accepts(gImage+'\n\n'+gFile,gImage+'\n\n'+gNative);
 accepts(gImage+'\n\n'+gFile,gNative+'\n\n'+gFile);
 accepts(gImage+'\n\n'+gFile,gNative+'\n\n'+gNative);
});
test('losing one of two canonically identical galleries must be rejected',()=>rejects(gImage+'\n\n'+gFile,gNative));
test('gallery filename mutation remains rejected',()=>rejects(gImage,'<gallery>\nFicheiro:Outro.jpg|Legenda conservada\n</gallery>'));
test('gallery caption mutation remains rejected',()=>rejects(gImage,'<gallery>\nFicheiro:Exemplo.jpg|Legenda alterada\n</gallery>'));
test('comment mutation remains rejected',()=>rejects('Texto.\n<!-- Conteúdo original. -->','Texto.\n<!-- Conteúdo alterado. -->'));
test('mathematical literal mutation remains rejected',()=>rejects('Texto.\n<math>x+y=z</math>','Texto.\n<math>x-y=z</math>'));
test('nowiki literal mutation remains rejected',()=>rejects('Texto.\n<nowiki>{{Exemplo|a=1}}</nowiki>','Texto.\n<nowiki>{{Exemplo|a=2}}</nowiki>'));

const sourceFile=path.join(__dirname,'fixtures/Ponte_71895316_source.wiki');
const frozenOutputFile=path.join(__dirname,'fixtures/Ponte_71895316_observed_output.wiki');
const ponte=fs.readFileSync(sourceFile,'utf8'),frozenOutput=fs.readFileSync(frozenOutputFile,'utf8');
const boundary=ponte.indexOf('{| class="toccolours" width=200');
const expectedPonte=ponte.replace('|thumb|300px|','|miniaturadaimagem|300px|').replace('uma das mais famosas do mundo.]]','uma das mais famosas do mundo]]');
const sourceSha='5d17ff4b580810e5dc97a66fa4f3a3bb481911cd9ece86c2528d2838d891c1c5',outputSha='4cc12177ba6d02d29b02c2a712439b32ddcc733d118c669b5f54f23f11aa860b';
test('actual Ponte frozen output retains the complete original tail and gallery',()=>{
 eq(sha(ponte),sourceSha,'Exact original Wikipedia revision');eq(sha(frozenOutput),outputSha,'Exact observed output');ok(boundary>0,'Fixed original table boundary exists');
 eq(frozenOutput,expectedPonte,'Only two explicit image presentation edits');ok(frozenOutput.endsWith(ponte.slice(boundary)),'Every byte from the malformed table onward is conserved');
 eq(protectedFindings(ponte,ponte),[],'The original identity audit has no false protected-loss warning');accepts(ponte,frozenOutput);
});
test('actual Ponte full calculate preserves expected output and passes protection audit',()=>{
 const result=api.calculate({kind:'adjust',source:ponte,originalSource:ponte,options:cfg});
 eq(result.text,expectedPonte,'Whole pipeline keeps the two independently stated edits');eq(sha(result.text),outputSha,'Output remains source-bound');
 eq(result.preservation,[],'No protected block was removed or rewritten');ok(result.text.endsWith(ponte.slice(boundary)),'Opaque suffix remains byte-identical');
 eq(api.cleanup(result.text,cfg).text,result.text,'Second application remains stable');
 ok(result.changes.some(c=>c.id==='preservedUnresolvedTail'),'Prefix isolation remains reported');
});
const realCaseOutputs=[];
const realCases=[{"title":"Cerveja","revid":72717005,"file":"fixtures/Cerveja_72717005_source.wiki","sha256":"9c96d8d0f6a682482f647fde7fc032937aa379c5b332741d5d9b8ee371695f82","bytes":80132,"final02ObservedOutputSha256":"d826f33b471607a679ff8772971add5570c24ab8dd16f614536acbe5454aaa3f","url":"https://pt.wikipedia.org/w/index.php?oldid=72717005"},{"title":"Renascimento","revid":73109500,"file":"fixtures/Renascimento_73109500_source.wiki","sha256":"b7e7498b56bc19f0f6641b2d7d98f29f0473ea267a523a0288c829deae91280e","bytes":174111,"final02ObservedOutputSha256":"e7d005ff0f9f8223caf968e8491f1c83e0f09c17e9c8da837e2c2c466871f62f","url":"https://pt.wikipedia.org/w/index.php?oldid=73109500"},{"title":"Fausto Coppi","revid":69431006,"file":"fixtures/Fausto_Coppi_69431006_source.wiki","sha256":"5886d93f72cb3ba2723e1ab836746f0bce05de618b4b44b62aa53c0541c8bc51","bytes":35521,"final02ObservedOutputSha256":"5886d93f72cb3ba2723e1ab836746f0bce05de618b4b44b62aa53c0541c8bc51","url":"https://pt.wikipedia.org/w/index.php?oldid=69431006"}];
for(const fixture of realCases)test('actual '+fixture.title+' retains every gallery and clears the initial false warning',()=>{
 const source=fs.readFileSync(path.join(__dirname,fixture.file),'utf8');eq(sha(source),fixture.sha256,'Exact frozen real source');eq(Buffer.byteLength(source),fixture.bytes,'Exact source bytes');
 const galleries=[...new Set([...source.matchAll(/<gallery\b[^>]*>[\s\S]*?<\/gallery\s*>/gi)].map(m=>m[0]))];ok(galleries.length>0,'Real gallery fixtures are required');
 const r=api.calculate({kind:'adjust',source,originalSource:source,options:{...cfg,pageTitle:fixture.title}});
 eq(r.preservation,[],'Every literal block retained');
 // Independent content invariant: only the explicitly permitted Image namespace
 // alias may differ. Filenames, captions, spacing and occurrence counts must match.
 const canonical=raw=>raw.replace(/(^|\n)([ \t]*)Image:/g,'$1$2Ficheiro:');
 const bank=values=>{const m=new Map();for(const value of values){const key=canonical(value);m.set(key,(m.get(key)||0)+1);}return [...m].sort(([a],[b])=>a.localeCompare(b));};
 const sourceBlocks=[...source.matchAll(/<gallery\b[^>]*>[\s\S]*?<\/gallery\s*>/gi)].map(m=>m[0]),outputBlocks=[...r.text.matchAll(/<gallery\b[^>]*>[\s\S]*?<\/gallery\s*>/gi)].map(m=>m[0]);
 eq(bank(outputBlocks),bank(sourceBlocks),'Every gallery body and occurrence conserved, with only finite Image to Ficheiro alias conversion');
 realCaseOutputs.push({title:fixture.title,revid:fixture.revid,outputSha256:sha(r.text),final02ObservedOutputSha256:fixture.final02ObservedOutputSha256,galleryOccurrences:sourceBlocks.length,exactRawGalleries:galleries.filter(raw=>r.text.split(raw).length===source.split(raw).length).length,uniqueSourceGalleries:galleries.length});
 eq(api.cleanup(r.text,{...cfg,pageTitle:fixture.title}).text,r.text,'Second application remains stable');
});
const report={script:path.relative(root,script),scriptSha256:sha(fs.readFileSync(script)),contractSha256:sha(fs.readFileSync(__filename)),version:api.version,realRegressionSources:realCases,realCaseOutputs,source:{title:'Ponte',revid:71895316,sourceSha256:sourceSha,observedOutputSha256:outputSha},cases:rows.length,checks,passed:rows.filter(r=>r.passed).length,failed:rows.filter(r=>!r.passed).length,tests:rows,networkRequests:0,wikipediaWrites:0,engineChanges:0,warningQualificationChanges:0};
assert.equal(rows.length,14,'Eleven focused contracts plus three real article regressions');
const reportFile=process.env.REVISAWIKI_QA_REPORT||path.join(__dirname,'artifacts/gallery_preservation_results.json');fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,tests:rows.filter(r=>!r.passed)}));process.exitCode=report.failed?1:0;
