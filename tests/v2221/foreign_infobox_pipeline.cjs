'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bundle=process.env.REVISAWIKI_BUNDLE;assert(bundle,'Set REVISAWIKI_BUNDLE to a frozen candidate');
const api=require(path.resolve(bundle)),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
let checks=0;const rows=[];function yes(value,message){checks++;assert(value,message);}function equal(a,b,message){checks++;assert.deepEqual(a,b,message);}
const pin={revision:101,sha256:'a'.repeat(64)},proof={kind:'native-contract',defaults:'equivalent',suppressions:'equivalent',aliasPrecedence:'equivalent',dynamic:'absent',embedding:'standalone'};
const field=target=>({target,transform:'identity',evidence:{status:'verified',role:'fixture.scalar.'+target,sourceConsumed:true,targetConsumed:true,semantics:'equivalent'}});
function catalogue(){return {schema:1,snapshotId:'synthetic-pipeline-control',nativeAliases:[{title:'Info/Registro de teste',aliases:[],...pin}],records:[{id:'synthetic-control-only',state:'active',source:{wiki:'en',title:'Infobox pipeline fixture',aliases:[],...pin},target:{wiki:'pt',title:'Info/Registro de teste',accepted:['nome','texto'],...pin},proof,fields:{name:field('nome'),text:field('texto')}}]};}
const cfg={namespaceNumber:0,contentModel:'wikitext',pageTitle:'Registro de teste',autoPreview:false,endMatter:true,portals:false,authorityControl:false,spelling:false};
function options(cat=catalogue()){return {...cfg,v2221InfoboxCatalogJson:JSON.stringify(cat)};}
function plan(label,source,expected,configuration=options()){
 const result=api.v2221InfoboxPipelinePlan(source,configuration);equal(result.text,expected,label+' exact source');yes(api.v2221InfoboxPipelineProof(source,result.text,result,configuration),label+' independent replay');
 rows.push({label,sourceSha256:sha(source),outputSha256:sha(result.text),count:result.edits.reduce((n,e)=>n+e.count,0)});return result;
}
const raw='{{Infobox pipeline fixture|name=Tema|text=Valor}}',translated='{{Info/Registro de teste|nome=Tema|texto=Valor}}';
equal(plan('all represented fields',raw,translated).edits[0].count,3,'Owner and two keys are three changes');
plan('missing catalogue',raw,raw,cfg);
plan('invalid JSON',raw,raw,{...cfg,v2221InfoboxCatalogJson:'{'});
plan('unknown empty field',raw.replace('}}','|unknown=}}'),raw.replace('}}','|unknown=}}'));
plan('native target unchanged',translated,translated);
plan('nowiki protected','<nowiki>'+raw+'</nowiki>','<nowiki>'+raw+'</nowiki>');
plan('citation body protected','Texto.<ref>'+raw+'</ref>','Texto.<ref>'+raw+'</ref>');
plan('embedded standalone held','{{Outer|box='+raw+'}}','{{Outer|box='+raw+'}}');
plan('mixed independent boxes',raw+'\n'+raw.replace('Tema','Outro')+'\nTexto.',translated+'\n'+translated.replace('Tema','Outro')+'\nTexto.');
const refs='<ref name="E\u0301">{{citar livro|título=T|isbn=9780000000002}}</ref><ref name="É" />';
plan('literal reference identity',raw.replace('Valor',refs),translated.replace('Valor',refs));
for(const key of ['infoboxes','multilingual','automaticParameterNames'])plan('disabled '+key,raw,raw,{...options(),[key]:false});
const damaged=raw.replace('Tema','Tema|unknown=Unmapped');
const source=damaged+'\n\nTexto.<ref name="r">Fonte.</ref>\n== Referências ==\n<references />';
const result=api.calculate({kind:'adjust',source,options:options()});
yes(result.text.includes('{{Referências}}'),'A held infobox does not block the default reference collector');
const retainedBox=api.v2221InfoboxRead(result.text.slice(0,result.text.indexOf('}}')+2));
equal(retainedBox.fields.find(field=>field.key==='unknown')?.value.trim(),'Unmapped','The unknown infobox fact remains present');
yes(result.text.includes('<ref name="r">Fonte.</ref>'),'A definition outside the held infobox remains exact');
yes(!result.text.includes('verificação de preservação'),'No diagnostic is inserted into the draft');
const unheaded=api.calculate({kind:'adjust',source:source.replace('== Referências ==\n',''),options:options()});
yes(unheaded.text.includes('{{Referências}}'),'An unheaded common collector uses the requested bare native call');
yes(!unheaded.text.includes('== Referências =='),'The independent repair does not add a duplicate manual heading');
const after=api.calculate({kind:'adjust',source:raw+'\n\nTexto.',options:options()});
yes(after.text.includes('Info/Registro de teste'),'The production calculation applies the registered stage');
const convertedBox=api.v2221InfoboxRead(after.text.slice(0,after.text.indexOf('}}')+2));
yes(convertedBox.fields.some(field=>field.key==='nome')&&!convertedBox.fields.some(field=>field.key==='name'),'The production calculation retains key conversion');
yes(after.text.includes('Texto.'),'Outside prose remains intact');
const again=api.calculate({kind:'adjust',source:after.text,options:options()});equal(again.text,after.text,'The full calculation is idempotent');
const guarded=catalogue();guarded.records[0].source.title='Infobox person';
const heldPerson='{{Infobox person|name=Tema|occupation=Unknown contract slot}}\nTexto.<ref>Fonte.</ref>\n== Referências ==\n<references />';
const guardedResult=api.calculate({kind:'adjust',source:heldPerson,options:options(guarded)});
yes(guardedResult.text.includes('{{Infobox person'),'Legacy migrations cannot bypass a held registered interface');
yes(!guardedResult.text.includes('{{Info/Biografia'),'A partial registry proof cannot be replaced with an older translation assumption');
yes(guardedResult.text.includes('{{Referências}}'),'The interface guard remains local to its box');
const report={suite:'synthetic-foreign-infobox-production-pipeline',syntheticContracts:true,realMappingCoverage:false,runtimeSha256:sha(fs.readFileSync(bundle)),checks,cases:rows,status:'passed',wikipediaWrites:0};
if(process.env.REVISAWIKI_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report));
