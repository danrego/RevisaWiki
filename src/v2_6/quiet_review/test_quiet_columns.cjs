'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bundle=path.resolve(process.env.REVISAWIKI_BUNDLE||path.join(__dirname,'../../dist/2.6.0/RevisaWiki_v2_6.js')),api=require(bundle);
const cfg={endMatter:true,endMatterColumns:true,references:true,referenceColumns:true,review:true,namespaceNumber:0};
let cases=0,checks=0;const failures=[];
const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
function test(name,fn){cases++;try{fn();}catch(error){failures.push({name,message:error.message});}}
for(const section of ['Bibliografia','Ligações externas','Leitura adicional','Leitura complementar'])for(let count=1;count<=5;count++){
 const items=Array.from({length:count},(_,i)=>'* [https://example.invalid/'+i+' Item '+i+']').join('\n');
 for(const [open,close] of [['{{InícioRef|colwidth=30em}}','{{FimRef}}'],['{{Div col|colwidth=30em}}','{{Div col fim}}'],['{{Colunas|largura=30em}}','{{Colunas fim}}']])test(section+' custom '+count+' '+open,()=>{
  const source='== '+section+' ==\n'+open+'\n'+items+'\n'+close+'\n',warnings=[];
  eq(api.endMatterColumns(source,cfg,()=>{},m=>warnings.push(m)),source,'Deliberate custom layout unchanged');eq(warnings,[],'No preservation-only warning');eq(api.notAppliedReasons(source,cfg),[],'No short/custom formatting review item');
 });
 test(section+' short plain '+count,()=>{const source='== '+section+' ==\n'+items+'\n';eq(api.notAppliedReasons(source,cfg),[],'A short list is not an error');});
}
for(const style of ['column-count:3;','column-width:30em;','color:blue;column-count:2;'])test('explicit reference style '+style,()=>{
 const source=Array.from({length:6},(_,i)=>'<ref name="r'+i+'">Fonte '+i+'</ref>').join('')+'\n{{Referências|estilo='+style+'}}';eq(api.notAppliedReasons(source,cfg),[],'Existing style not flagged');
});
test('real legacy parameters retained for actionable review',()=>{const source=Array.from({length:6},(_,i)=>'<ref>Fonte '+i+'</ref>').join('')+'\n{{Referências|colunas=2}}';eq(api.notAppliedReasons(source,cfg).map(x=>x.code),['columns-legacy'],'Ignored legacy parameters remain actionable');});
test('full-page missing reference error retained',()=>{eq(api.referenceAudit('<ref name="inexistente" />\n{{Referências}}').some(x=>x.code==='missing-definition'),true,'Not hiding missing reference');});
test('plain six-item list still receives columns',()=>{const source='== Ligações externas ==\n'+Array.from({length:6},(_,i)=>'* [https://example.invalid/'+i+' Item]').join('\n')+'\n';const after=api.endMatterColumns(source,cfg,()=>{},()=>{});eq(after.includes('{{Div col|colunas=2}}'),true,'Automatic columns still apply at six');eq(api.endMatterColumns(after,cfg,()=>{},()=>{}),after,'Automatic columns are stable');});
const report={version:api.version,bundle:path.basename(bundle),sha256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),cases,checks,passed:cases-failures.length,failed:failures.length,failures,networkRequests:0,wikipediaWrites:0};
if(process.env.REVISAWIKI_REPORT_DIR){fs.mkdirSync(process.env.REVISAWIKI_REPORT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.REVISAWIKI_REPORT_DIR,'quiet_columns.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
