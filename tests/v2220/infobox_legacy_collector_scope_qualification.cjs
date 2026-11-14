'use strict';
// A separate qualification, never a rewrite of the historical raw failure.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [bundle,rawFile,outFile]=process.argv.slice(2);assert(bundle&&rawFile&&outFile,'bundle raw-report fresh-output');
const file=path.resolve(bundle),rawPath=path.resolve(rawFile),rawBytes=fs.readFileSync(rawPath),raw=JSON.parse(rawBytes),api=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),pin=sha(fs.readFileSync(file));
assert.equal(raw.bundleSha256,pin,'same exact raw-failure candidate');
const cases=new Map([
 ['conditional-consumed-alone','{{Info/Político|nome=Tema fictício|vice_título2=Rótulo<ref name="A">Fonte.</ref>}}'],
 ['ignored-alias-conflict-alone','{{Info/Político|nome=Tema fictício|vice-título2=Rótulo<ref name="A">Fonte.</ref>|vice_título2=Outro}}'],
 ['visible-native-field-alone','{{Info/Biografia|nome=Tema fictício|ocupação=Profissão<ref name="A">Fonte.</ref>}}']
]);
assert.deepEqual(raw.failures.map(x=>x.id).sort(),[...cases.keys()].sort(),'only the three independently reviewed raw failures');
const asciiTrim=x=>x.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
// These exact finite fixtures contain no nested brace programs or pipe-bearing
// values. Parse named arguments independently of every product parser/formatter.
function ast(source){
 assert(source.startsWith('{{Info/'));const end=source.indexOf('}}');assert(end>1);const body=source.slice(2,end),parts=body.split('|');
 assert(!/[{}]/.test(body));const header=asciiTrim(parts.shift()),fields=parts.map(part=>{const eq=part.indexOf('=');assert(eq>0);const key=asciiTrim(part.slice(0,eq)),value=asciiTrim(part.slice(eq+1));assert(key&&!/[\n\r]/.test(key));return{key,value};});
 return{node:{type:'native-infobox',header,fields},outside:source.slice(end+2)};
}
function opaque(source){return{refs:[...source.matchAll(/<ref\b[^>]*>([\s\S]*?)<\/ref\s*>|<ref\b[^>]*\/\s*>/gi)].map(x=>x[0]),images:[...source.matchAll(/\[\[(?:Ficheiro|Imagem|Arquivo|File|Image):[^\r\n]*?\]\]/gi)].map(x=>x[0]),formulas:[...source.matchAll(/<(math|chem|ce|score)\b[^>]*>[\s\S]*?<\/\1\s*>/gi)].map(x=>x[0])};}
function collectors(source){return(source.match(/\{\{(?:Referências|Notas|Notas e referências|Reflist|Notelist)(?=[|}])|<references\b/gi)||[]).length;}
function equivalent(before,after){try{return JSON.stringify(ast(before))===JSON.stringify(ast(after))&&JSON.stringify(opaque(before))===JSON.stringify(opaque(after))&&collectors(before)===0&&collectors(after)===0;}catch{return false;}}
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',v216CalendarUTC:'2026-10-22'},rows=[];let checks=0,calls=0;
function check(value,message){checks++;assert.ok(value,message);}
for(const [id,box]of cases){
 const before=box+'\n\nTexto.\n\n[[Categoria:Exemplos]]',rawCase=raw.failures.find(x=>x.id===id);check(sha(before)===rawCase.sourceSha256,id+' original exact source');
 const request={kind:'adjust',source:before,originalSource:before,options:cfg};calls++;const result=api.calculate(request),after=result.text;
 check(sha(after)===rawCase.appliedSha256,id+' exact raw failed endpoint reproduced');check(request.source===before&&request.originalSource===before,id+' draft unchanged');
 check(api.v219AutomaticResultSafety(before,result).accepted,id+' complete preservation accepted');check(equivalent(before,after),id+' only named-argument ASCII whitespace changed');
 check(collectors(after)===0,id+' no new reference collector');check(api.v221MissingDefaultCollectorPlan(before,cfg).text===before,id+' unconfirmed reference collector still withheld');
 for(const mutant of [after.replace('Fonte.','Outra fonte.'),after.replace('Tema fictício','Tema alterado'),after+'\n{{Referências}}',after+'\n[[Ficheiro:Outro.jpg]]',after+'\n<math>x^2</math>'])check(!equivalent(before,mutant),id+' unrelated content mutation rejected');
 if(after.includes('vice-título2'))check(!equivalent(before,after.replace('vice-título2','vice_título2')),id+' ignored alias cannot be silently activated');
 rows.push({id,sourceSha256:sha(before),outputSha256:sha(after),independentAstSha256:sha(JSON.stringify(ast(before))),collectorCount:0,rawRefsImagesFormulasExact:true,qualification:'approved-native-named-argument-layout-only'});
}
check(sha(fs.readFileSync(file))===pin,'runtime unchanged');check(sha(fs.readFileSync(rawPath))===sha(rawBytes),'raw failed report unchanged');
const report={status:'qualified-layout-only-with-original-raw-failures-retained',bundle:path.basename(file),bundleSha256:pin,rawFailureReportSha256:sha(rawBytes),rawFailureCount:raw.failures.length,qualifiedCases:rows.length,checks,calculateCalls:calls,rows,oldAssertionsModified:false,broadNormalizationUsed:false,wikipediaWrites:0};fs.writeFileSync(outFile,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...report,rows:undefined}));
