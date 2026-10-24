'use strict';
// Require the saved distribution as-is. Expected fields are source-authored;
// this observer never injects code/exports or parses source template boundaries.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const repo=path.resolve(__dirname,'../..'),runtime=process.env.REVISAWIKI_INLINE_RUNTIME||path.join(repo,'dist/2.21.0');
const moduleSource=fs.readFileSync(path.join(repo,'src/v2_21/structure_repairs.js'),'utf8'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
assert(!process.env.REVISAWIKI_INLINE_PATCH,'This suite validates saved distributions only; exploratory source overlays are not frozen-runtime evidence');
const fixtureFile=path.join(__dirname,'inline_infobox_fixtures.json'),fixtureBytes=fs.readFileSync(fixtureFile),fixtures=JSON.parse(fixtureBytes).cases;
assert.equal(sha(fixtureBytes),'143b04f18b23eccf010e0ddc128bddd8fb1a0958e43f40f6983ade8da91869f4');
assert.equal(fixtures.length,18);
let networkAttempts=0;const denyNetwork=()=>{networkAttempts++;throw Error('The inline-infobox regression is offline');};
globalThis.fetch=async()=>denyNetwork();for(const scheme of['http','https']){const client=require('node:'+scheme);client.request=denyNetwork;client.get=denyNetwork;}
function load(kind){
 const filename=path.resolve(runtime,'RevisaWiki_v2_21_0'+(kind==='full'?'_completo':'')+'.js'),bytes=fs.readFileSync(filename),pin=sha(bytes);
 delete global.RevisaWikiDataV2;delete require.cache[filename];const api=require(filename);
 for(const name of['v221InlineInfoboxEdits','v221InlineInfoboxPlan','v221InlineInfoboxProof'])assert.equal(typeof api[name],'function','The actual distribution exports the required production API');
 return {api,filename,pin,exportKeys:Object.keys(api).sort()};
}
function orderedOutputFields(text,fixture){
 // Every accepted value in this finite book fits on one physical output line.
 // The first '=' divides a field; all nested template/link pipes stay literal.
 assert.equal(typeof text,'string');assert.equal(text.endsWith(fixture.eol),false);
 const lines=text.split(fixture.eol);assert.equal(lines.length,fixture.orderedNamedFields.length+2);
 assert.equal(lines[0],fixture.header,'The exact header and optional documented selector are retained');
 assert.equal(lines.at(-1),'}}','One exact final template closer is retained');
 assert.equal(/[\r\n]/.test(text.replaceAll(fixture.eol,'')),false,'No mixed or stray physical line endings');
 const padding=new Set([' ','\t','\r','\n','\v','\0']),nativeTrim=value=>{let a=0,b=value.length;while(a<b&&padding.has(value[a]))a++;while(b>a&&padding.has(value[b-1]))b--;return value.slice(a,b);};
 return lines.slice(1,-1).map(line=>{assert(line.startsWith('| '),'Each named argument has its own physical line');const at=line.indexOf('=');assert(at>1,'Each line has an explicit named field');return[nativeTrim(line.slice(1,at)),nativeTrim(line.slice(at+1))];});
}
function calculate(api,job){
 const snapshot=job.source;calculations++;
 const result=vm.runInNewContext('api.calculate(job)',{api,job},{timeout:60000});
 assert.equal(job.source,snapshot,'The complete action preserves its input draft object');return result;
}
let checks=0,calculations=0;const reports=[],eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const rootCase=fixtures[0].source;
for(const kind of ['full','core']){
 const loaded=load(kind),{api}=loaded,cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Teste de formatação',v216CalendarUTC:'2026-10-23'};
 const positives=fixtures.map(fixture=>fixture.source);
 const nativeCases=[];
 for(const fixture of fixtures){
  const {source}=fixture;
  const edits=api.v221InlineInfoboxEdits(source,cfg);eq(edits.length,1,'One complete inline infobox is planned');
  const edit=edits[0],ordered=orderedOutputFields(edit.text,fixture);
  eq(ordered.length,fixture.orderedNamedFields.length,'The source-authored number of named field lines is retained');
  eq(ordered,fixture.orderedNamedFields,'The complete ordered trimmed field vector matches the independent expected values');
  const plan=api.v221InlineInfoboxPlan(source,cfg);eq(api.v221InlineInfoboxProof(source,plan.text,plan,cfg),true,'Source-bound proof reproduces the complete plan');
  eq(api.v221InlineInfoboxEdits(plan.text,cfg).length,0,'Reapplication adds no further line breaks');
  nativeCases.push({fixtureId:fixture.id,source:source.slice(edit.start,edit.end),after:edit.text});
 }
 const simple='{{Info/Assentamento/Marrocos|nome=Localidade|imagem=}}';
 const negatives=[
  '{{Info/Inexistente|nome=Pessoa|imagem=}}','{{Infobox person|name=Pessoa|image=}}',
  '{{Info/Biografia|Pessoa|imagem=}}','{{Info/Biografia|1=Pessoa|imagem=}}',
  '{{Info/Biografia|nome=A|nome=B}}','{{Info/Biografia|nome=A| nome =B}}',
  '{{Info/Assentamento/Marrocos|mun|nome=A|sede=B}}',
  '{{Info/Assentamento/Marrocos|com |nome=A|sede=B}}',
  '{{Info/Assentamento/Marrocos|com|outro|nome=A}}',
  '{{Info/Biografia|nome=A|{{Chave}}=B}}','{{Info/Biografia|nome=A|imagem=<ref>Texto</ref>}}',
  ' '+simple,'Texto '+simple,simple+' Texto',
  '<nowiki>'+simple+'</nowiki>','<syntaxhighlight lang="wikitext">'+simple+'</syntaxhighlight>',
  '<!--'+simple+'-->','<div>\n'+simple+'\n</div>',
  '{|\n|\n'+simple+'\n|}','{{Caixa|\n'+simple+'\n}}',
  '<ref>\n'+simple+'\n</ref>',"<pre>\n"+simple+'\n</pre>',
  '{{Info/Biografia|nome=A|imagem=\n}}','{{Info/Biografia|nome=A',
  '{{Info/Biografia|nome=A|'+('x'.repeat(49))+'=B}}'
 ].map(source=>source.replaceAll('Info/Biografia','Info/Assentamento/Marrocos'));
 for(const family of ['Info/Biografia','Info/Ator','Info/Cientista','Info/Empresa','Info/Canção'])negatives.push('{{'+family+'|nome=Pessoa|imagem=}}');
 for(const source of negatives)eq(api.v221InlineInfoboxEdits(source,cfg).length,0,'Unproved, nested, competing or literal source remains unchanged: '+source.slice(0,60));
 for(const delta of [{infoboxes:false},{infoboxAlignment:false},{alignInfoboxParameters:false},{markup:false},{namespaceNumber:1},{sectionOnly:true},{discussionPage:true},{contentModel:'javascript'},{v221StructureRepairs:false}]){
  const plan=api.v221InlineInfoboxPlan(simple,{...cfg,...delta});eq(plan.text,simple,'Disabled scope remains unchanged');
 }
 for(const source of [rootCase,...positives.slice(1,6)]){
  const result=calculate(api,{kind:'adjust',source,originalSource:source,options:cfg});
  eq(/\{\{Info\/[^\n]+\n\|/.test(result.text),true,'Complete action actually formats the infobox');
  eq(api.v219AutomaticResultSafety(source,result).accepted,true,'Final preservation gate accepts the exact complete output');
  const second=calculate(api,{kind:'adjust',source:result.text,originalSource:result.text,options:cfg});eq(second.text,result.text,'Complete action converges');
 }
 eq(sha(fs.readFileSync(loaded.filename)),loaded.pin,'The actual loaded bundle remains byte-exact');
 eq(Object.keys(api).sort(),loaded.exportKeys,'The actual runtime export surface was not altered by the test');
 reports.push({distribution:kind,bundleSha256:loaded.pin,positiveCases:positives.length,negativeCases:negatives.length,scopeControls:9,nativeCandidates:nativeCases});
}
eq(networkAttempts,0,'No network request is dispatched');
eq(sha(fs.readFileSync(fixtureFile)),sha(fixtureBytes),'The source-authored fixture book remains unchanged');
const report={status:'passed',checks,calculations,structureSha256:sha(moduleSource),testSha256:sha(fs.readFileSync(__filename)),fixtureSha256:sha(fixtureBytes),runtime,frozen:true,unmodifiedDistributionRequired:true,sourceInjection:false,productExportsAltered:false,privateTemplateParserUsed:false,calculationDeadlineMs:60000,networkRequests:networkAttempts,wikipediaWrites:0,reports};
if(process.env.REVISAWIKI_INLINE_REPORT)fs.writeFileSync(process.env.REVISAWIKI_INLINE_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,reports:reports.map(({nativeCandidates,...row})=>row)}));
