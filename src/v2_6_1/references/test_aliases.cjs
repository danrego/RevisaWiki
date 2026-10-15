'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bundle=path.resolve(process.argv[2]||process.env.REVISAWIKI_BUNDLE||path.join(__dirname,'../../../dist/2.6.1/RevisaWiki_v2_6_1.js'));
const api=require(bundle), cfg={...Object.fromEntries(Object.entries(api.defaults).map(([k,v])=>[k,typeof v==='boolean'?false:v])),namespaceNumber:0,contentModel:'wikitext',pageTitle:'Artigo de teste',references:true,endMatter:true};
let cases=0,checks=0;const failures=[],records=[];
const eq=(a,b,message)=>{checks++;assert.deepEqual(a,b,message);};
function test(name,fn){cases++;try{fn();records.push({name,status:'passed'});}catch(e){failures.push({name,message:e.message});}}
function integrated(name,before,expected,options={}){test(name,()=>{const settings={...cfg,...options},r=api.calculate({kind:'adjust',source:before,options:settings});eq(r.text,expected,'Exact source contract');eq(api.cleanup(r.text,settings).text,r.text,'Idempotent on the next click');eq(r.preservation.filter(x=>/^lost-/.test(x.code||'')),[],'No lost source content');eq(api.safeComposition(before,r.text,settings),'','Source composition accepted');eq(api.referenceAudit(r.text,settings).filter(f=>f.code==='missing-renderer'),[],'Every required reference group still has its list');});}
for(const alias of ['Referência','referência','Referencia','referencia','Predefinição:Referência','Template:Referencia',' Predefinição : Referência ']){
 const before='Texto.<ref>Fonte.</ref>\n{{'+alias+'}}',expected='Texto.<ref>Fonte.</ref>\n{{Referências}}';
 integrated('Bare singular redirect '+alias,before,expected);
 test('Original alias is already a default collector '+alias,()=>eq(api.referenceAudit(before,cfg).filter(f=>f.code==='missing-renderer'),[],'No false missing-list finding before normalization'));
}
for(const fields of ['|nível=0','|título=Fontes|nível=3','|estilo=column-count:3;','|ignorado=Preservar todo o conteúdo','|refs=<ref name="x">Fonte completa.</ref>','\n| refs = <ref name="x">Fonte completa.</ref>\n| título = Fontes documentais\n|nível=0\n']){
 const ref=fields.includes('refs')?'<ref name="x" />':'<ref>Fonte.</ref>';
 integrated('Every existing field preserved '+fields,'Texto.'+ref+'\n{{Referência'+fields+'}}','Texto.'+ref+'\n{{Referências'+fields+'}}');
}
for(const alias of ['Referência','Referencia']){
 const before='Texto.<ref name="x" group="nota" />\n{{'+alias+'|grupo=nota|refs=<ref name="x">Nota completa.</ref>}}';
 const expected=before.replace('{{'+alias+'|','{{Referências|');
 integrated('List-defined reference inherits the singular collector group '+alias,before,expected);
 test('Reference proof reads original inherited group '+alias,()=>{eq([...api.structuralReferenceBank(before)],[...api.structuralReferenceBank(expected)],'Equivalent source bank with inherited group');eq(api.referenceAudit(before,cfg).filter(f=>['missing-renderer','missing-definition'].includes(f.code)),[],'Original group and named source recognized');});
}
integrated('Two distinct groups remain distinct','Texto.<ref>Fonte.</ref> Nota.<ref group="nota">Nota.</ref>\n{{Referência|grupo=nota}}\n{{Referencia}}','Texto.<ref>Fonte.</ref> Nota.<ref group="nota">Nota.</ref>\n{{Referências|grupo=nota}}\n{{Referências}}');
integrated('Explicit group does not stand in for default references','Texto.<ref>Fonte.</ref>\n{{Referência|grupo=nota}}','Texto.<ref>Fonte.</ref>\n{{Referências|grupo=nota}}\n\n{{Referências}}\n\n');
integrated('Already duplicated adjacent empty lists collapse','Texto.<ref>Fonte.</ref>\n{{Referência}}\n\n{{Referências}}','Texto.<ref>Fonte.</ref>\n{{Referências}}');
integrated('Nonempty prose between collector calls remains','A.<ref>Fonte A.</ref>\n{{Referência}}\nB.<ref>Fonte B.</ref>\n{{Referências}}','A.<ref>Fonte A.</ref>\n{{Referências}}\nB.<ref>Fonte B.</ref>\n{{Referências}}');
for(const tag of ['nowiki','pre','code','syntaxhighlight','source','blockquote','q','math','templatedata']){
 const before='<'+tag+'>{{Referência|refs=<ref name="x">Fonte.</ref>}}</'+tag+'>';
 integrated('Literal or quoted example protected '+tag,before,before);
}
for(const before of ['<!-- {{Referência}} -->','"{{Referência}}"',"''{{Referência}}''",'{{Exemplo|código={{Referência}}}}','{||{{Referência}}\n|}','[[Predefinição:Referência]]','{{Referência bibliográfica|conteúdo=Fonte}}','{{ReferênciA|conteúdo=Fonte}}'])integrated('No unrelated example or target change '+before,before,before);
integrated('Explicitly disabled reference edits','Texto.<ref>Fonte.</ref>\n{{Referência}}','Texto.<ref>Fonte.</ref>\n{{Referência}}',{references:false});
integrated('Malformed singular name stays unchanged','{{Referência|refs=','{{Referência|refs=',{endMatter:false});
const fixture=path.resolve(process.env.REVISAWIKI_REFERENCE_FIXTURE||path.join(__dirname,'../fixtures/article_reference_alias.wiki'));
if(fs.existsSync(fixture))test('Pinned public article with existing singular list',()=>{const before=fs.readFileSync(fixture,'utf8'),settings={...cfg,pageTitle:'Artigo de teste'},r=api.calculate({kind:'adjust',source:before,options:settings});eq(r.text,before.replace('{{Referência}}','{{Referências}}'),'Only existing collector name changes');eq((r.text.match(/\{\{Referências(?:[|}])/g)||[]).length,1,'Exactly one default collector');eq(api.cleanup(r.text,settings).text,r.text,'Real article remains stable');eq(r.preservation.filter(x=>/^lost-/.test(x.code||'')),[],'Real article sources retained');});
const report={version:api.version,kind:'singular-reference-redirects',bundle:path.basename(bundle),bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),cases,checks,passed:cases-failures.length,failed:failures.length,failures,records,networkRequests:0,wikipediaWrites:0};
if(process.env.REVISAWIKI_REPORT_DIR){fs.mkdirSync(process.env.REVISAWIKI_REPORT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.REVISAWIKI_REPORT_DIR,'reference_alias_test_report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({...report,records:undefined}));if(failures.length)process.exitCode=1;
