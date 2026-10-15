'use strict';
require('node:fs').mkdirSync(require('node:path').resolve(__dirname,'../../artifacts'),{recursive:true});
// Independent, exact expected column changes. Raw reference banks stay literal.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=__dirname,root=path.resolve(dir,'../../../..'),script=process.env.REVISAWIKI_QA_SCRIPT||path.join(root,'outputs/revisawiki_v2_4/RevisaWiki_v2_4_completo.js'),api=require(script),rows=[];
let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},ok=(x,m)=>{checks++;assert(x,m)},sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function test(name,fn){let c=checks;try{fn();rows.push({name,passed:true,checks:checks-c})}catch(e){rows.push({name,passed:false,checks:checks-c,error:e.stack})}}
const defs=s=>[...s.matchAll(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi)].map(x=>x[0]);
const opts={namespaceNumber:0,pageTitle:'Conferência local',authorityControl:false,endTemplateOrder:false,endMatter:false};
for(const f of JSON.parse(fs.readFileSync(path.join(dir,'fixtures.json'))))test(f.name,()=>{
 const cfg={...opts,...f.options},out=api.referenceColumns(f.source,cfg,()=>{});
 eq(out,f.expected,'Exact external parameter only, or fully literal ambiguous bank');
 eq(api.referenceColumns(out,cfg,()=>{}),out,'No repeated style/column parameter after second click');
 eq(defs(out),defs(f.source),'Every original reference bank definition stays byte identical');
 eq(api.preservationAudit(f.source,out),[],'No source field or prose loss');
});
const realFile=path.join(dir,'../source_files/1000_72221307.wiki');
assert(fs.existsSync(realFile),'Required frozen real source must exist');test('actual Occupy 72221307 entity-closed title in reference bank',()=>{
 const source=fs.readFileSync(realFile,'utf8'),cfg={...opts,pageTitle:'Lista dos locais de protesto do movimento Occupy'},result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
 ok(source.includes('[ZDJĘCIA&#93;'),'Frozen source includes bracket closed by entity, not a raw close bracket');
 ok(result.text.includes("'Oburzeni' w Warszawie? Przyszło tylko 100-200 osób. Dziś marsze na całym świecie [ZDJĘCIA&#93;"),'Exact bibliographic title retained');
 eq((result.text.match(/\|estilo=/g)||[]).length,(source.match(/\|estilo=/g)||[]).length,'No guessed style insertion into the ambiguously parsed bank');
 eq(api.cleanup(result.text,cfg).text,result.text,'Actual 125KB article stable on first click');
 eq(result.preservation,[],'Full article source preservation');
 const hunks=api.comparison(source,result);eq(api.composeChanges(source,hunks),result.text,'Accept-all exact');eq(api.composeChanges(source,hunks.map(h=>({...h,accepted:false}))),source,'Reject-all exact');
 fs.writeFileSync(path.join(dir,'../../artifacts/72221307_candidate.wiki'),result.text);
});
const report={version:api.version,scriptSha256:sha(fs.readFileSync(script)),fixtureSha256:sha(fs.readFileSync(path.join(dir,'fixtures.json'))),cases:rows.length,checks,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,wikipediaWrites:0,networkRequests:0,tests:rows};
fs.writeFileSync(process.env.REVISAWIKI_QA_REPORT||path.join(dir,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,tests:rows.filter(x=>!x.passed).slice(0,8)}));process.exitCode=report.failed?1:0;
