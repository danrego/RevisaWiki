'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
assert(process.env.REVISAWIKI_REAL_INFOBOX_CATALOG,'Provide the finite reviewed real catalogue');
const catalog=JSON.parse(fs.readFileSync(process.env.REVISAWIKI_REAL_INFOBOX_CATALOG,'utf8')),code=fs.readFileSync(path.resolve(__dirname,'../../src/v2_22_1/foreign_infobox_registry.js'),'utf8'),names=[...code.matchAll(/^function (v2221Infobox\w+)\(/gm)].map(x=>x[1]),api=vm.runInNewContext(code+'\n({'+names.join(',')+'})');
let cases=0,checks=0;const results=[];
function ok(value,label){checks++;assert(value,label);}
function equal(actual,expected,label){checks++;assert.deepEqual(JSON.parse(JSON.stringify(actual)),JSON.parse(JSON.stringify(expected)),label);}
function test(name,fn){fn();cases++;results.push(name);}
function run(raw,context={}){const r=api.v2221InfoboxMigrate(raw,catalog,context);ok(api.v2221InfoboxProof(raw,r.text,r,catalog,context));return r;}
function preserved(raw,context={}){const r=run(raw,context);equal(r.text,raw);equal(r.count,0);return r;}

test('real records validate without any disabled evidence becoming an active profile',()=>{const v=api.v2221InfoboxCatalogValidate(catalog);ok(v.valid);equal(v.recordErrors,[]);equal(v.activeRecords,4);equal(v.records.filter(r=>r.state!=='active').length,1);});
test('unique football header converts a complete supported literal biography and preserves references',()=>{
 const ref='<ref name="é">Fonte</ref><ref name="é"/>',raw='{{Infobox football biography|name=Pessoa|full_name=Nome completo|birth_date=2000-02-29|birth_place=[[Paris]], [[França]]|image=Example.jpg|caption=Legenda'+ref+'|position=Forward}}',r=run(raw);
 equal(r.status,'converted');ok(r.text.startsWith('{{Info/Futebolista|nome=Pessoa|nomecompleto=Nome completo|data_nascimento=29 de fevereiro de 2000'));ok(r.text.includes('|posição=atacante'));ok(r.text.includes(ref));ok(r.count>=7);equal(run(r.text).text,r.text);
});
test('career compound fields are not flattened or silently discarded',()=>{for(const field of ['clubs1=[[Clube]]','years1=2000–2001','caps1=20','goals1=3','height=1.80 m','currentclub=retired','unknown=','birth_name=Nome de nascimento'])preserved('{{Infobox football biography|name=Pessoa|'+field+'}}');});
test('football image, caption, dates and duplicate aliases need the exact supported context',()=>{
 for(const fields of ['image=Example.jpg','caption=Legenda','image=File:Example.jpg|caption=Legenda','image=[[File:Example.jpg]]|caption=Legenda','birth_date=February 29, 2000','birth_date=2001-02-29','birth_date={{birth date and age|2000|2|29}}','full_name=A|fullname=B','position=unknown','embed=yes'])preserved('{{Infobox football biography|name=Pessoa|'+fields+'}}');
 preserved('{{Infobox football biography|name=Pessoa|position=Forward}}',{embedded:true});
});
test('four canonical football playing positions translate only the exact vetted literals',()=>{for(const [source,target]of [['Goalkeeper','goleiro'],['Defender','defensor'],['Midfielder','meio-campista'],['Forward','atacante']]){const r=run('{{Infobox football biography|name=Pessoa|position='+source+'}}');equal(r.status,'converted');ok(r.text.includes('|posição='+target));}preserved('{{Infobox football biography|name=Pessoa|position=Forward / Midfielder}}');});
test('native biography recovers ignored foreign keys without changing existing accepted facts',()=>{
 const raw='{{Info/Biografia|name=Pessoa|image=Example.jpg|caption=Legenda|occupation=escritor|parents=Genitores|local_nascimento=[[Paris]]}}',r=run(raw);
 equal(r.status,'converted');ok(r.text.includes('|nome=Pessoa'));ok(r.text.includes('|progenitores=Genitores'));ok(r.text.includes('|local_nascimento=[[Paris]]'));equal(r.edits.filter(e=>e.kind==='owner').length,0);
});
test('native conflicts, unknown keys, birth-name semantics and empty title suppression are preserved',()=>{
 for(const fields of ['name=Outro|nome=Pessoa','name=Pessoa|birth_name=Nome de nascimento','name=Pessoa|unknown=','name=Pessoa|ocupação=escritor|occupation=ator','name=','name={{lang|en|Pessoa}}','name=Pessoa|birth_date=2001'])preserved('{{Info/Biografia|'+fields+'}}');
 const native='{{Info/Biografia|nome=Pessoa|nacionalidade=[[França]]}}';equal(run(native).status,'already-native');equal(run(native).text,native);
});
test('native wrapper is a distinct page and unknown origin preserves its Catalan collision',()=>{
 const raw='{{Infobox person|name=Pessoa|occupation=escritor}}';equal(preserved(raw).status,'unresolved');
 const en=run(raw,{sourceWiki:'en'}),pt=run(raw,{sourceWiki:'pt'});equal(en.status,'converted');equal(pt.status,'converted');equal(en.text,'{{Info/Biografia|nome=Pessoa|ocupação=escritor}}');equal(pt.text,en.text);
});
test('actual native wrapper birth-name and parents forwarding is not treated as EN intent',()=>{
 const raw='{{Infobox person|name=Pessoa|birth_name=Nome de nascimento|parents=Genitores}}',pt=run(raw,{sourceWiki:'pt'});equal(pt.status,'converted');ok(pt.text.includes('|nome_de_batismo=Nome de nascimento'));ok(pt.text.includes('|parentesco=Genitores'));
 preserved(raw,{sourceWiki:'en'});preserved(raw);
 const en=run('{{Infobox person|name=Pessoa|parents=Genitores}}',{sourceWiki:'en'});equal(en.status,'converted');ok(en.text.includes('|progenitores=Genitores'));
});
test('unsupported source editions and native embedded modes never borrow an EN contract',()=>{
 for(const wiki of ['es','fr','de','ca','it'])preserved('{{Infobox football biography|name=Pessoa|position=Forward}}',{sourceWiki:wiki});
 preserved('{{Infobox person|name=Pessoa|occupation=ator}}',{sourceWiki:'en',embedded:true});
});
test('every modified scalar stays exact except the declared date or literal transform',()=>{
 for(let n=0;n<64;n++){const value=' Pessoa '+n+' é Á &nbsp; <ref name="R'+n+'">Texto</ref> ',r=run('{{Info/Futebolista|nome='+value+'}}');equal(r.text,'{{Info/Futebolista|nome='+value+'}}');
  const raw='{{Infobox football biography|name=Pessoa|full_name='+value+'}}',converted=run(raw);equal(converted.status,'converted');ok(converted.text.includes('|nomecompleto='+value));}
});
if(process.env.REVISAWIKI_REAL_SOURCE_DIR)test('pinned source bodies and direct native consumers match the reviewed catalogue',()=>{
 const directory=process.env.REVISAWIKI_REAL_SOURCE_DIR,sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
 const files=[['en-3382507-1377571195.private.wiki','cc45e87d74d05111aca4a333291854320a264553a3f7a6b227d14ff8be244ef1'],['pt-3607182-63097825.private.wiki','8837c3d380be59d1fad2ef5f710b4529f14ed263414e15d82d25d6bf0e9d1e89'],['pt-native-biography-73325613.private.wiki','3cfd020fb6674b0f637d15e167b1654cf7977c778331371804974924d8bf489d'],['en-41732321-1375474059.private.wiki','82f2de1249f37b830a8ea72555e8007a7fa5810a4a37ac9c0fef80800c2e589a'],['pt-334999-70095373.private.wiki','25df2174220fbaa5aeffa9a4a3eff35a1fdaa440986d789b62f6bebe864981b4']];
 for(const[file,expected]of files)equal(sha(fs.readFileSync(path.join(directory,file))),expected);
 const native=fs.readFileSync(path.join(directory,'pt-native-biography-73325613.private.wiki'),'utf8');for(const key of ['progenitores','nome_de_batismo','nome_completo','ocupação','nascimento_data','morte_data'])ok(native.includes('{{{'+key+'|'));
 const wrapper=fs.readFileSync(path.join(directory,'pt-3607182-63097825.private.wiki'),'utf8');ok(/\|parentesco\s*= \{\{\{parents\|\}\}\}/.test(wrapper));ok(/\|nome_de_batismo\s*= \{\{\{birth_name\|\}\}\}/.test(wrapper));
});
console.log(JSON.stringify({status:'passed',cases,checks,catalogueSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.REVISAWIKI_REAL_INFOBOX_CATALOG)).digest('hex'),groups:results},null,2));
