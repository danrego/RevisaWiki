'use strict';
// Only synthetic syntax specimens are sent to this anonymous read-only API.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const manifestFile=path.join(root,'tests/expected_release_v2120.json'),manifestBytes=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestBytes);
const fixturesFile=path.join(root,'tests/v2120/fixtures/structure_render_cases.json'),fixturesBytes=fs.readFileSync(fixturesFile),fixtures=JSON.parse(fixturesBytes);
const priorRunner=fs.readFileSync(path.join(root,'scripts/verify_repairs_render_v290.cjs'),'utf8'),snapshot=/const PYTHON_HTML_SNAPSHOT=String.raw`([\s\S]*?)`;/m.exec(priorRunner)[1];
const cache=path.join(root,'tests/v2120/fixtures/native_replies/structure');
const report={version:'2.12.0',status:'passed',kind:'synthetic-native-structure-repairs',releaseManifestSha256:sha(manifestBytes),frozenFiles:manifest.files,fixtureSha256:sha(fixturesBytes),runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0,accountsUsed:0,method:'Offline verification of stored anonymous GET action=parse replies for synthetic specimens, retaining capture dates and response hashes. No network fallback.'};
const checked=(value,label)=>{report.checks++;assert.ok(value,label);},eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};let lastRead=0;
async function read(source){
 const query={action:'parse',format:'json',formatversion:'2',contentmodel:'wikitext',title:'Artigo de teste',prop:'text|parsewarnings',disableeditsection:'1',disablelimitreport:'1',text:source};
 const url='https://pt.wikipedia.org/w/api.php?'+new URLSearchParams(query),file=path.join(cache,sha(url)+'.json');
 if(fs.existsSync(file)){const value=JSON.parse(fs.readFileSync(file));if(value.urlSha256===sha(url)&&value.responseSha256===sha(JSON.stringify(value.response))&&Number.isFinite(Date.parse(value.checkedAt)))return value;}
 throw new Error('The pinned native reply is absent or invalid; no network fallback.');
}
function census(html){const run=spawnSync('python3',['-c',snapshot],{input:html,encoding:'utf8',maxBuffer:16777216});if(run.status!==0)throw new Error('Independent HTML census failed');return JSON.parse(run.stdout);}
function cells(data,scopes=false){return data.tables.map(table=>table.rows.map(row=>row.cells.map(cell=>scopes?cell:{...cell,scope:''})));}
async function main(){
 const apis=['RevisaWiki_v2_12_0.js','RevisaWiki_v2_12_0_completo.js'].map(name=>{const raw=fs.readFileSync(path.join(root,'dist/2.12.0',name));eq(sha(raw),manifest.files[name].sha256,'Exact final production bundle');return {name,api:require(path.join(root,'dist/2.12.0',name))};});
 const nativeFixtures=[];
 for(const row of fixtures.cases){const item={id:row.id,status:'passed',kind:row.kind,sourceSha256:sha(row.source),outputSha256:sha(row.expected)};
  try{
   for(const {api}of apis){const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Artigo de teste',authorityControl:false,autoPreview:false};
    if(row.api==='native-harvard'){const candidates=api.v210HarvardAnchorCandidates(row.source,cfg);eq(candidates.length,1,'One exact local Harvard work candidate');eq(row.source.slice(0,candidates[0].start)+candidates[0].after+row.source.slice(candidates[0].end),row.expected,'The local target proposal matches the independent specimen');}
    else {const plan=api[row.api](row.source,cfg);eq(plan.text,row.expected,row.id+' exact source oracle');checked(plan.edits.length>0,row.id+' actual repair');eq(api[row.api](row.expected,cfg).text,row.expected,row.id+' second click is stable');}
   }
   const before=await read(row.source),after=await read(row.expected),a=census(before.response.parse.text),b=census(after.response.parse.text);
   item.beforeResponseSha256=before.responseSha256;item.afterResponseSha256=after.responseSha256;item.beforeCheckedAt=before.checkedAt;item.afterCheckedAt=after.checkedAt;
   checked(b.text.includes('Texto de abertura.')&&b.text.includes('Texto de encerramento.'),row.id+' prose survives native rendering');eq(b.errors,[],row.id+' no resulting native error');
   if(['table','scope','responsive'].includes(row.kind)){eq(cells(b),cells(a),row.id+' ordered native cell contents and attributes survive');eq(b.references,a.references,row.id+' native reference bindings survive');}
   if(row.kind==='label'){eq(b.tables[0].rows[0].cells[0].payload,'Nome','The intended heading is rendered without literal attribute text');eq(b.tables[0].rows[0].cells[0].scope,'col','The intended native column scope is parsed');eq(b.tables[0].rows.slice(1),a.tables[0].rows.slice(1),'Every body row remains exact');}
   if(row.kind==='span'){eq(b.tables[0].rows[1].cells[0].colspan,'2','Native span is the explicitly encoded number');eq(b.tables[0].rows.map(row=>row.cells.map(cell=>cell.payload)),a.tables[0].rows.map(row=>row.cells.map(cell=>cell.payload)),'Span quote repair preserves cell payloads');}
   if(row.kind==='closer'){eq(b.tables.length,1,'Exactly one native wikitable remains');eq(b.tables[0].rows.map(row=>row.cells.map(cell=>cell.payload)),[['Nome','Ano'],['Alfa','Beta'],['Gama','Delta']],'The native grid closes after the declared final row');checked(!JSON.stringify(b.tables).includes('Texto de encerramento.'),'Following prose stays outside the closed table');}
   if(row.kind==='scope'){eq(b.tables[0].rows[2].cells.map(cell=>cell.scope),['col','col','col','col'],'Only the lower leaf headings receive column scopes');eq(b.tables[0].rows.slice(0,2).map(row=>row.cells.map(cell=>cell.scope)),[[''],['','']],'Upper grouping headings are unchanged');}
   if(row.kind==='refs')eq(b.references,a.references,'All ordered native reference bodies and links survive bank consolidation');
   if(row.kind==='conflict')eq(b.references.map(ref=>ref.body),['Fonte A, p. 1.','Fonte B, p. 2.'],'Both explicitly supplied sources resolve after conflicting names are separated');
   if(row.kind==='ref-tag')eq(b.references.map(ref=>ref.body),['Fonte A, p. 1.'],'The finite opening-tag typo becomes one complete native reference');
   if(row.kind==='harvard'){
    const beforeIds=[...before.response.parse.text.matchAll(/\bid="([^"]+)"/g)].filter(match=>match[1]==='CITEREFSilva2004'),afterIds=[...after.response.parse.text.matchAll(/\bid="([^"]+)"/g)].filter(match=>match[1]==='CITEREFSilva2004');
    item.oldTargetCount=beforeIds.length;item.newTargetCount=afterIds.length;eq(afterIds.length,1,'Native parser provides exactly one Harvard destination');
    nativeFixtures.push({id:row.id,source:row.source,expected:row.expected,beforeHtml:before.response.parse.text,afterHtml:after.response.parse.text,beforeResponseSha256:before.responseSha256,afterResponseSha256:after.responseSha256});
   }
   item.nativeRenderingChecked=true;
  }catch(error){report.status='failed';item.status='failed';report.failures.push({id:row.id,error:String(error.message).replaceAll(root,'<local-path>')});}
  report.cases.push(item);
 }
 report.nativeComparisons=report.cases.filter(item=>item.status==='passed'&&item.nativeRenderingChecked).length;report.checkedAt=new Date().toISOString();
 fs.writeFileSync(path.join(root,'tests/v2120/NATIVE_STRUCTURE_RENDER_PROOF.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(root,'tests/v2120/fixtures/native_harvard_render.json'),JSON.stringify({version:'2.12.0',syntheticOnly:true,cases:nativeFixtures},null,2)+'\n');
 console.log(JSON.stringify({version:report.version,status:report.status,nativeComparisons:report.nativeComparisons,checks:report.checks,failures:report.failures}));if(report.failures.length)process.exitCode=1;
}
main().catch(error=>{console.error(String(error.message).replaceAll(root,'<local-path>'));process.exitCode=1;});
