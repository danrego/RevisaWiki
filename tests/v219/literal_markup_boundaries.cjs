'use strict';
// Literal examples remain literal, while an independent outside adjustment
// must still be reachable. Valid native presentation is not normalized away.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),hash=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={schemaVersion:1,kind:'literal-fence-and-valid-native-markup-boundaries',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0},eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',links:true,markup:true,syntaxRepairs:true,structuralRepairs:true,translationResidues:true};report.bundles.push({bundle,sha256:hash(bytes),bytes:bytes.length,version:api.version});
 const test=(id,source,expected,options=base)=>{
  const row={id,bundle,scenarioSha256:hash(JSON.stringify(canonical({source,options,expected,intent:id}))),sourceSha256:hash(source),optionsSha256:hash(JSON.stringify(canonical(options))),expectedEndpointSha256:hash(expected),intentSha256:hash(id),status:'passed',evidenceKind:'actual-full-action-exact-endpoint'};
  try{const result=api.calculate({kind:'adjust',source,options});eq(result.text,expected,'Whole action reaches the separately specified endpoint');eq(api.calculate({kind:'adjust',source:result.text,options}).text,result.text,'The complete action is idempotent');eq(api.preservationAudit(source,result.text,options),[],'Preservation guard remains active');eq(api.safeComposition(source,result.text,options),'','The endpoint composes without a content-loss exemption');row.actualEndpointSha256=hash(result.text);row.appliedIds=(result.changes||[]).map(change=>change.id);}catch(error){row.status='failed';report.status='failed';if(report.failures.length<100)report.failures.push({bundle,id,message:error.message});}report.cases.push(row);
 };
 const inside=['[[ecossistema|ecossistemas]]','{{Citar web|tituol=Fonte|data=5 March 2001}}','{{NOMBASEDEPAGE}}','{{Info/Biografia|nome=Pessoa|nascimento=1 January 1900}}','ISBN 978-0-306-40615-7','<small>Legenda literal.</small>','== [[Tema]] ==','{| class="wikitable"\n! Coluna\n|-\n| Dado\n|}','{{sem fechamento','<ref name="a">sem fechamento','{|\n| Sem fechamento','"aspas sem fechamento','[[ligação sem fechamento'];
 for(const body of inside)for(const fence of ['```wikitext','```javascript','~~~wikitext','````wikitext'])for(const eol of ['\n','\r\n']){
  const closing=fence.startsWith('~')?'~~~':fence.match(/^`+/)[0],literal=('Exemplo de código:\n'+fence+'\n'+body+'\n'+closing+'\nFim do exemplo.').replace(/\n/g,eol),source=literal+eol+eol+'Texto sobre [[Brasil|Brasil]].';
  test('contextual-'+hash(body+fence+eol),source,literal+eol+eol+'Texto sobre [[Brasil]].');
 }
 for(const tag of ['nowiki','code','pre','syntaxhighlight']){
  const literal='<'+tag+'>\n```wikitext\n{{sem fechamento\n</'+tag+'>',source=literal+'\n\nTexto sobre [[Brasil|Brasil]].';
  test('fence-does-not-escape-'+tag,source,literal+'\n\nTexto sobre [[Brasil]].');
 }
 for(const content of ['Legenda literal.','Legenda com acentuação e 甲乙.','Trecho com duas frases. Outra frase.'])for(const tag of ['small','SMALL']){
  const literal='<'+tag+'>'+content+'</'+tag+'>',source=literal+'\n\nTexto sobre [[Brasil|Brasil]].';test('valid-native-small-'+hash(literal),source,literal+'\n\nTexto sobre [[Brasil]].');
 }
 const article="'''Tema fictício''' é um objeto fictício.\n\n== História ==\nTexto preservado.\n\n{{Referências}}\n[[Categoria:Temas fictícios]]\n";
 test('whole-article-wrapper-still-removed','```wikitext\n'+article+'```\n',article);
 test('whole-wrapper-disabled','```wikitext\n'+article+'```\n','```wikitext\n'+article+'```\n',{...base,translationResidues:false});
 eq(hash(fs.readFileSync(file)),hash(bytes),'Actual runtime stayed immutable');
}
report.distinctScenarios=new Set(report.cases.map(row=>row.scenarioSha256)).size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
