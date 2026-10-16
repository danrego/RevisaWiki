'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {NativeChrome,NativeFirefox,NativeSafari}=require('../v261/browser/native_driver.cjs');
const root=path.resolve(__dirname,'../..'),directory=path.join(__dirname,'fixtures/reference_column_geometry');
const browserName=process.argv[2]||'Chrome',Driver={Chrome:NativeChrome,Firefox:NativeFirefox,Safari:NativeSafari}[browserName];assert(Driver,'A supported installed browser is selected');
const bound=process.argv.includes('--bind-release'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const bytes=fs.readFileSync(path.join(directory,'manifest.json')),manifest=JSON.parse(bytes.toString());
assert.equal(sha(bytes),'49bf7c506d8369676b8bd3c3f07a2df1c9e4494daee3453610ca933c7545e617','Independent native render and stylesheet manifest');
assert.equal(manifest.method,'GET');assert.equal(manifest.credentials,'omit');assert.equal(manifest.wikipediaWrites,0);
assert.equal(manifest.style,'column-count:2;column-width:30em;column-gap:2em;max-width:62em;');
function asset(name,hash,length){const file=path.resolve(directory,name);assert(file.startsWith(directory+path.sep));const raw=fs.readFileSync(file);assert.equal(sha(raw),hash);assert.equal(raw.length,length);return raw.toString();}
const captures=manifest.captures.map(entry=>({...entry,source:asset(entry.sourceFile,entry.sourceSha256,entry.sourceBytes),html:asset(entry.renderFile,entry.renderSha256,entry.renderBytes)}));
const styles=manifest.styles.map(entry=>({...entry,source:asset(entry.file,entry.sha256,entry.bytes)}));
assert.equal(captures.length,8);assert.deepEqual(styles.map(entry=>entry.id),['cite','site']);
for(const entry of captures){assert.equal(entry.nativeListItems,entry.count);assert.equal(entry.nativeColumnWrapper,entry.count>10);assert(!/<script\b/i.test(entry.html),'Frozen render has no scripts');}
assert(styles.find(entry=>entry.id==='cite').source.includes('.mw-references-columns'),'Actual native Cite multicolumn rules are present');
const report={version:'2.11.1',kind:'native-reference-column-responsive-geometry',status:'passed',browser:browserName,runnerSha256:sha(fs.readFileSync(__filename)),fixtureManifestSha256:sha(bytes),style:manifest.style,
 method:'Anonymous native parse HTML and captured real Cite/siteCSS, measured in local installed browser frames. Logical leaf columns use reference-item fragment coordinates, not the computed column-count property.',
 scope:manifest.scope,captureLimitations:manifest.captureLimitations,releaseBinding:bound?'requested':'not-requested',screenshots:0,clipboardOperations:0,wikipediaWrites:0,networkRequestsToWikipedia:0,cases:[],checks:0,failures:[]};
function equal(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function ok(value,label){report.checks++;assert(value,label);}
if(bound){
 const candidate=require('./candidate.cjs'),release=candidate.verify(),file=path.join(release.dist,'RevisaWiki_v2_11_1.js'),api=require(file);
 report.candidateSha256=sha(fs.readFileSync(file));report.releaseManifestSha256=sha(fs.readFileSync(path.join(root,'tests/expected_release_v2111.json')));report.frozenFiles=release.files;equal(api.version,'2.11.1','The frozen production candidate is used');
 for(const count of [10,11,30]){
  const plain=captures.find(entry=>entry.mode==='plain'&&entry.count===count),styled=captures.find(entry=>entry.mode==='styled'&&entry.count===count);
  const cfg={...api.defaults,namespaceNumber:0,pageTitle:'RevisaWiki/Teste de colunas',sectionOnly:false};
  const output=api.referenceColumns(plain.source,cfg,()=>{});
  equal(output,styled.source,'The actual exported rule produces the exact independently rendered '+count+'-entry source');
  equal(api.calculate({kind:'adjust',source:plain.source,options:{...cfg,autoPreview:false,authorityControl:false}}).text,styled.source,'The complete adjustment path retains that exact native-rendered source');
 }
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'RevisaWiki/Teste de colunas',sectionOnly:false},plain=captures.find(entry=>entry.mode==='plain'&&entry.count===11).source;
 for(const original of ['column-count:3;column-width:20em;','columns:2 24em;','-webkit-column-count:2;']){
  const existing=plain.replace('{{Referências}}','{{Referências|estilo='+original+'}}');
  equal(api.referenceColumns(existing,cfg,()=>{}),existing,'An existing explicit column style is preserved exactly');
 }
 const custom='color:navy; border:0;';
 ok(api.referenceColumns(plain.replace('{{Referências}}','{{Referências|estilo='+custom+'}}'),cfg,()=>{}).includes('|estilo='+custom),'Existing unrelated style declarations retain their exact bytes');
 report.releaseBinding='checked';
}
const rows=[];for(const width of [320,375,768,1024,1920])for(const context of ['standard','limited'])for(const entry of captures)rows.push({width,context,id:entry.id,count:entry.count,mode:entry.mode});
const css=styles.map(entry=>entry.source).join('\n');
function page(row){const entry=captures.find(value=>value.id===row.id),classes='skin-vector'+(row.context==='limited'?' vector-feature-limited-width-clientpref-1':'');
 return '<!doctype html><html class="'+classes+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><style>html,body{margin:0;padding:0;font-family:Arial,sans-serif;font-size:16px;line-height:1.5}main{box-sizing:border-box;width:100%;padding:16px}</style></head><body><main class="mw-body-content">'+entry.html+'</main></body></html>';
}
async function main(){
 const requests=[];const server=http.createServer((req,res)=>{requests.push({method:req.method,path:req.url});if(req.method!=='GET'){res.writeHead(403).end();return;}res.writeHead(200,{'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; frame-src 'self' about:; img-src 'none'; font-src 'none'; connect-src 'none'; form-action 'none'"});res.end('<!doctype html><meta charset="utf-8"><title>Local reference-column geometry</title><div id="frames"></div>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port,driver=new Driver();
 try{
  await driver.start(origin);report.browserVersion=driver.version;await driver.navigate(origin+'/');
  await driver.evaluate('(()=>{window.columnGeometryPages='+JSON.stringify(rows.map(page))+';return true})()');
  for(let index=0;index<rows.length;index++){
   const row=rows[index];try{
    const result=JSON.parse(await driver.evaluate('(async()=>{let frame=document.querySelector("iframe");if(frame)frame.remove();frame=document.createElement("iframe");frame.style.cssText="display:block;border:0;width:'+row.width+'px;height:800px";frame.srcdoc=window.columnGeometryPages['+index+'];const ready=new Promise(resolve=>frame.addEventListener("load",resolve,{once:true}));document.querySelector("#frames").append(frame);await ready;const d=frame.contentDocument,w=frame.contentWindow;await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));const items=[...d.querySelectorAll("ol.references > li")],rects=items.flatMap(item=>[...item.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({id:item.id,left:r.left,top:r.top,width:r.width,height:r.height}))),xs=[];for(const r of rects.sort((a,b)=>a.left-b.left))if(!xs.some(x=>Math.abs(x-r.left)<2))xs.push(r.left);const outer=d.querySelector(".reflist"),inner=d.querySelector(".mw-references-wrap"),outerStyle=w.getComputedStyle(outer),innerStyle=w.getComputedStyle(inner);return JSON.stringify({viewport:w.innerWidth,contentViewport:d.documentElement.clientWidth,pageWidth:d.documentElement.scrollWidth,bodyWidth:d.body.scrollWidth,leafColumns:xs.length,leafX:xs,itemIds:items.map(item=>item.id),texts:items.map(item=>item.querySelector(".reference-text").textContent),rects,outer:{width:outer.getBoundingClientRect().width,columnCount:outerStyle.columnCount,columnWidth:outerStyle.columnWidth,maxWidth:outerStyle.maxWidth,style:outer.getAttribute("style")},inner:{nativeColumns:inner.classList.contains("mw-references-columns"),width:inner.getBoundingClientRect().width,columnCount:innerStyle.columnCount,columnWidth:innerStyle.columnWidth}});})()'));
    equal(result.viewport,row.width,'The frame has the requested viewport');equal(result.itemIds.length,row.count,'Every reference list item remains');equal(new Set(result.itemIds).size,row.count,'Every reference list item remains unique');
    equal(result.itemIds,Array.from({length:row.count},(_,i)=>'cite_note-r'+(i+1)+'-'+(i+1)),'Native item order remains unchanged');
    equal(result.texts,Array.from({length:row.count},(_,i)=>'Fonte '+(i+1)+'. Texto preservado para medir a largura e a ordem das entradas nesta lista.'),'Every original reference body remains unchanged');
    equal(result.inner.nativeColumns,row.count>10,'The eleven-entry Cite wrapper is included in the measured DOM');
    ok(result.rects.length>=row.count,'Every item has at least one physical fragment');
    if(row.mode==='styled'){
     ok(result.leafColumns>=1&&result.leafColumns<=2,'Actual reference-item fragments form at most two leaf columns');
     if(row.width<=375)equal(result.leafColumns,1,'Narrow screens form one readable column');
     if(row.width===1920)equal(result.leafColumns,2,'A wide screen actually forms two columns');
     ok(result.pageWidth<=result.contentViewport+1&&result.bodyWidth<=result.contentViewport+1,'No horizontal document overflow');
     ok(result.rects.every(r=>r.left>=-1&&r.left+r.width<=result.contentViewport+1),'Every physical reference fragment fits the viewport');
    }
    const expectedInline=captures.find(entry=>entry.id===row.id).html.match(/<div class="reflist" style="([^"]*)"/)[1];equal(result.outer.style,expectedInline,'The native inline style is not rewritten by this layout test');
    report.cases.push({...row,...result,textsSha256:sha(Buffer.from(JSON.stringify(result.texts))),status:'passed'});
   }catch(error){report.status='failed';report.failures.push({...row,message:String(error.message).replaceAll(root,'<repository>')});}
  }
  const styled=report.cases.filter(row=>row.mode==='styled');equal(styled.length,30,'All styled viewport/context combinations are measured');
  const negative=report.cases.filter(row=>row.mode==='old');report.negativeControls={narrowForcedColumns:negative.filter(row=>row.width<=375&&row.leafColumns>1).length,wideNestedColumns:negative.filter(row=>row.width===1920&&row.leafColumns>2).length,maxObservedLeafColumns:Math.max(...negative.map(row=>row.leafColumns))};
  ok(report.negativeControls.narrowForcedColumns>0,'The previous fixed-count style reproduces multiple columns on narrow screens');
  report.browserErrors=driver.errors||[];report.blockedExternalRequests=(driver.blocked||[]).length;equal(report.browserErrors,[],'The local browser execution has no JavaScript errors');
  await driver.evaluate('(()=>{document.querySelector("iframe")?.remove();delete window.columnGeometryPages;return true})()');
 }catch(error){report.status='failed';report.failures.push({name:'browser-workflow',message:String(error.message).replaceAll(root,'<repository>')});}
 finally{await driver.close();await new Promise(resolve=>server.close(resolve));}
 report.localRequests=requests;equal(requests.every(request=>request.method==='GET'),true,'The local server received only GET requests');
 const out=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2111/reference_column_geometry'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,browserName.toLowerCase()+'.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,browser:browserName,cases:report.cases.length,checks:report.checks,releaseBinding:report.releaseBinding,negativeControls:report.negativeControls,failures:report.failures}));if(report.status!=='passed')process.exitCode=1;
}
main().catch(error=>{console.error(String(error.message).replaceAll(root,'<repository>'));process.exitCode=1;});
