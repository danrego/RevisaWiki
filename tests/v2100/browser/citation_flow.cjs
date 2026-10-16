'use strict';
// Additive native-browser cases. Assertions inspect actual editor text and
// real Worker results; they never use the production normalizer as an oracle.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
module.exports=async function citationFlow({origin,driver,evaluate,report,hash,save}){
 const base=path.resolve(__dirname,'../../corpus_v281'),manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json')));
 const cases=manifest.articles.filter(row=>[73221157,73221177].includes(row.oldid)).map(row=>{const packed=fs.readFileSync(path.join(base,row.file)),raw=zlib.gunzipSync(packed);assert.equal(hash(packed),row.gzipSha256);assert.equal(hash(raw),row.sha256);return {id:'NBC News '+row.oldid,source:raw.toString(),sha256:row.sha256,title:row.title,generic:row.oldid===73221177?22:(raw.toString().match(/\{\{\s*Citation\s*\|/gi)||[]).length,historical:row.oldid===73221177};});
 cases.push({id:'archive URL and access date',source:'Texto.<ref>{{Citar web|titulo=Fonte de teste|archive-url=https://example.test/arquivo|arquivodata=2020-01-01|acessodata=2020-01-02}}</ref>\n{{Referências}}\n',generic:0,fragments:['https://example.test/arquivo','2020-01-01','2020-01-02'],web:true});
 cases.push({id:'explicit namespace news',source:'Texto.<ref>{{Template:Cite news|title=Reportagem de teste|url=https://example.test/noticia|date=2020-01-01|access-date=2020-01-02}}</ref>\n{{Referências}}\n',generic:0,fragments:['{{Citar jornal|','2020-01-01','2020-01-02']});
 cases.push({id:'legitimate generic and native web remain distinct',source:'Texto.<ref name="a">{{Citation|titulo=Fonte de teste|url=https://example.test/fonte|ano=2000|ref=harv}}</ref> Outro.<ref name="b">{{Citar web|titulo=Fonte de teste|url=https://example.test/fonte|ano=2000|ref=harv}}</ref>\n{{Referências}}\n',generic:1,web:true,fragments:['ref=harv','name="a"','name="b"']});
 for(const item of cases){const started=Date.now();try{
  await driver.navigate(origin+'/fixture.html?mode=loader-shared&scenario=native-editor&title='+encodeURIComponent(item.title||'Teste de referências'));
  await evaluate('await wait(()=>window.RevisaWiki&&document.querySelector(".ajg-run"));window.__citationSource='+JSON.stringify(item.source)+';const box=document.getElementById("wpTextbox1");box.value=__citationSource;box.dispatchEvent(new Event("input",{bubbles:true}));clean();');
  await driver.click('.ajg-run');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);window.__citationActual=document.getElementById('wpTextbox1').value;assert(RevisaWiki.processing.engine==='worker'&&!RevisaWiki.processing.workerFailure,'Citations run in a real Worker');assert((__rw26QA.workerResults.at(-1).result.preservation||[]).length===0,'No source-loss exception is needed');clean();`);
  const actual=await driver.evaluate('__citationActual');
  assert.equal((actual.match(/\{\{\s*Citation\s*\|/gi)||[]).length,item.generic,'The expected generic citation count is exact');
  if(item.web)assert(/\{\{\s*Citar web\s*\|/i.test(actual),'Explicit native web family is retained');
  if(item.historical){for(const [name,count]of [['Citar web',139],['Citar jornal',29],['Citar revista',2]])assert.equal((actual.match(new RegExp('\\{\\{\\s*'+name+'\\s*\\|','gi'))||[]).length,count,'Exact reviewed native-family count: '+name);assert.equal((actual.match(/\{\{\s*Citar livro\s*\|/gi)||[]).length,9,'All nine book references stay in their family');assert.equal((actual.match(/<ref\b/gi)||[]).length,(item.source.match(/<ref\b/gi)||[]).length,'Every original reference occurrence remains');}
  for(const fragment of item.fragments||[])assert(actual.includes(fragment),'Metadata or native target is retained: '+fragment);
  const firstChanged=item.source!==actual;
  await driver.click('.ajg-run');await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__citationActual,'Citation adjustment is stable on the second click');assert(__rw26QA.workerResults.at(-1).result.changes.length===0,'No new second-click adjustment');clean();`);
  if(firstChanged){await driver.click('.ajg-undo');await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__citationSource,'Undo restores every source byte');clean();`);}
  assert.equal(await driver.evaluate("document.getElementById('wpTextbox1').value"),item.source,'Exact original editor text remains after Undo or no-op');
  const assertions=await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;
  report.tests.push({name:'citation family '+item.id,passed:true,assertions,evidence:{inputSha256:hash(Buffer.from(item.source)),outputSha256:hash(Buffer.from(actual)),expectedGenericCalls:item.generic,actualGenericCalls:(actual.match(/\{\{\s*Citation\s*\|/gi)||[]).length,realWorker:true,idempotent:true,exactUndo:true},milliseconds:Date.now()-started});
 }catch(error){report.tests.push({name:'citation family '+item.id,passed:false,error:String(error.message),milliseconds:Date.now()-started});}save();console.log(JSON.stringify(report.tests.at(-1)));}
};
