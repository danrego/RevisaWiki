'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),script=require('./harness.cjs').apiPath;
const a=require(script),old=require(path.join(root,'tests/inherited/fixtures/baselines/RevisaWiki_v1_9.js'));
const none=Object.fromEntries(Object.keys(a.defaults).map(k=>[k,false]));
const cfg={...none,portals:true,endMatter:true,automaticBiographyPortals:true,namespaceNumber:0};
const dateCfg={...none,birthDates:true,namespaceNumber:0};
const results=[];
function test(name,fn){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack});}}
function source(portal,place='[[Uberlândia]], [[Brasil]]',box='Info/Político',extra=''){
  return '{{'+box+'|nome=Ana|local_nascimento='+place+extra+'}}\nTexto.\n\n'+portal;
}
function equal(before,after,options=cfg){
  const r=a.calculate({kind:'adjust',source:before,originalSource:before,options});
  assert.equal(r.text,after);assert.equal(a.cleanup(r.text,options).text,r.text,'idempotence');
  assert.deepEqual(r.preservation,[],'content preservation');return r;
}
const wellingtonPortal='{{Portal3|Biografias|Política|Goiás|Cristianismo}}';
test('original reported bug reproduced on1.9.0',()=>assert(old.cleanup(source(wellingtonPortal),cfg).text.endsWith('{{Portal3|Biografias|Política|Goiás|Cristianismo|5=Brasil}}')));
test('Wellington portal stays exact without Brasil or index',()=>equal(source(wellingtonPortal),source(wellingtonPortal)));
for(const alias of a.brazilStatePortalAliases){
  test('state alias suppresses automatic Brasil: '+alias,()=>equal(source('{{Portal3|Biografias|Política|'+alias+'}}'),source('{{Portal3|Biografias|Política|'+alias+'}}')));
  test('explicit slots retain state and suppress Brasil: '+alias,()=>equal(source('{{Portal3|1=Biografias|2=Política|4='+alias+'}}'),source('{{Portal3|1=Biografias|2=Política|4='+alias+'}}')));
}
test('no state still adds positional Brasil',()=>equal(source('{{Portal3|Biografias|Política|Cristianismo}}'),source('{{Portal3|Biografias|Política|Cristianismo|Brasil}}')));
test('Brazil already present remains, even with state',()=>equal(source('{{Portal3|Biografias|Política|Goiás|Brasil}}'),source('{{Portal3|Biografias|Política|Goiás|Brasil}}')));
test('multiple positional additions update implicit index',()=>equal(source('{{Portal3|Biografias}}','[[Paris]], [[França]]','Info/Tenista'),source('{{Portal3|Biografias|Esportes|Ténis|França}}','[[Paris]], [[França]]','Info/Tenista')));
test('state suppresses Brasil while subject portal is appended',()=>equal(source('{{Portal3|Biografias|Goiás}}'),source('{{Portal3|Biografias|Goiás|Política}}')));
test('other birth country is not suppressed by Brazilian state',()=>equal(source('{{Portal3|Biografias|Política|Goiás}}','[[Paris]], [[França]]'),source('{{Portal3|Biografias|Política|Goiás|França}}','[[Paris]], [[França]]')));
test('city name containing state label is not guessed',()=>equal(source('{{Portal3|Biografias|Política|São Paulo (cidade)}}'),source('{{Portal3|Biografias|Política|São Paulo (cidade)|Brasil}}')));
test('indexed call retains numbering',()=>equal(source('{{Portal3|1=Biografias|2=Política}}','[[Paris]], [[França]]'),source('{{Portal3|1=Biografias|2=Política|3=França}}','[[Paris]], [[França]]')));
test('numbered gap is filled without moving original slot',()=>equal(source('{{Portal3|1=Biografias|4=Política}}','[[Paris]], [[França]]'),source('{{Portal3|1=Biografias|4=Política|2=França}}','[[Paris]], [[França]]')));
test('mixed numbered call cannot overwrite existing numbered slots',()=>equal(source('{{Portal3|Biografias|3=Política}}','[[Paris]], [[França]]','Info/Político','|profissão=médico'),source('{{Portal3|Biografias|3=Política|2=Medicina|4=França}}','[[Paris]], [[França]]','Info/Político','|profissão=médico')));
test('empty positional slot is filled and next stays positional',()=>equal(source('{{Portal3|Biografias||Política}}','[[Paris]], [[França]]','Info/Político','|profissão=médico'),source('{{Portal3|Biografias|Medicina|Política|França}}','[[Paris]], [[França]]','Info/Político','|profissão=médico')));
for(const portal of ['{{Portal3|Biografias|Política|a|b|c|d|e|f|g|h}}','{{Portal3|Biografias|1=Política}}','{{Portal3|Biografias|{{Nome de portal}}}}'])
  test('capacity or unsafe call preserved '+portal,()=>equal(source(portal),source(portal)));
test('protected state example cannot suppress Brasil',()=>{
  const s=source('{{Portal3|Biografias|Política}}').replace('Texto.','<nowiki>{{Portal3|Goiás}}</nowiki>\nTexto.');
  equal(s,s.replace('{{Portal3|Biografias|Política}}','{{Portal3|Biografias|Política|Brasil}}'));
});
for(const options of [{automaticBiographyPortals:false},{portals:false},{namespaceNumber:1},{sectionOnly:true}])
  test('portal guard '+JSON.stringify(options),()=>equal(source('{{Portal3|Biografias|Política}}'),source('{{Portal3|Biografias|Política}}'),{...cfg,...options}));
for(const name of ['dni','Dni',' dni ','Predefinição:dni','Template:Dni'])for(const suffix of ['', '|si']){
  const value='{{'+name+'|1|6|1980'+suffix+'}}';
  test('accepted template title retained '+name+suffix,()=>equal(value,value,dateCfg));
}
for(const name of ['dni','Dni']){
  const value='{{'+name+'|1|6|1980|si}}';
  test('known obsolete lang argument removed without title case change '+name,()=>equal('{{'+name+'|lang=br|1|6|1980|si}}',value,dateCfg));
  test('nowrap unwrap retains accepted spelling '+name,()=>equal('{{nowrap|'+value+'}}',value,dateCfg));
  const bio='{{Info/Biografia|nome=Ana|data_nascimento='+value+'<ref name="dob">Fonte da data.</ref>}}\n{{Referências}}';
  test('confirmed living age keeps accepted title '+name,()=>equal(bio,bio.replace('|si',''),{...dateCfg,livingBirthAge:true,livingCategoryConfirmed:true}));
  test('unconfirmed living date remains '+name,()=>equal(bio,bio,{...dateCfg,livingBirthAge:true}));
}
for(const protect of [s=>'<nowiki>'+s+'</nowiki>',s=>'<code>'+s+'</code>',s=>'<!-- '+s+' -->',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'])
  test('protected Dni example '+protect('X'),()=>equal(protect('{{dni|1|6|1980}}'),protect('{{dni|1|6|1980}}'),dateCfg));
test('name-only cleanup produces no changes or summary',()=>{
  const r=equal('{{dni|1|6|1980}}','{{dni|1|6|1980}}',{...dateCfg,autoSummary:true});
  assert.equal(r.hunks.length,0);assert.equal(r.changes.length,0);
});
test('conversion of foreign birth template still works',()=>equal('{{birth date and age|1980|6|1}}','{{Dni|1|6|1980}}',{...dateCfg,obsoleteTemplates:true}));
const live=fs.readFileSync(path.join(root,'tests/inherited/fixtures/Wellington_73200493.wiki'),'utf8');
test('live Wellington revision preserves exact portal',()=>{
  const r=a.calculate({kind:'adjust',source:live,originalSource:live,options:{namespaceNumber:0,pageTitle:'Wellington Martins Cardoso',authorityControl:false,endTemplateOrder:false}});
  assert(r.text.includes(wellingtonPortal));assert(!r.text.includes('|5=Brasil'));assert.deepEqual(r.preservation,[]);
  assert.equal(a.cleanup(r.text,{namespaceNumber:0,pageTitle:'Wellington Martins Cardoso',authorityControl:false,endTemplateOrder:false}).text,r.text);
  fs.writeFileSync(path.join(__dirname,'Wellington_v1_9_1_result.wiki'),r.text);
});
const report={version:a.version,scriptSha256:crypto.createHash('sha256').update(fs.readFileSync(script)).digest('hex'),passed:results.filter(t=>t.passed).length,failed:results.filter(t=>!t.passed).length,results};
fs.writeFileSync(path.join(__dirname,'compatibility_patch_results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,failed:report.failed,failures:results.filter(t=>!t.passed)},null,2));
process.exitCode=report.failed?1:0;
