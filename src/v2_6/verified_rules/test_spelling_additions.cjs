'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,bundle=path.resolve(process.env.REVISAWIKI_BUNDLE||[path.join(root,'../../dist/2.6.0/RevisaWiki_v2_6.js'),path.join(root,'patched_v25.js')].find(p=>fs.existsSync(p))||'missing-release.js'),api=require(bundle),additions=JSON.parse(fs.readFileSync(path.join(root,'spelling_additions.json'),'utf8'));
const base={namespaceNumber:0,pageTitle:'Artigo técnico',automaticSpelling:true,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,livingBirthAge:false,registryDoiCheck:false,autoPreview:false,autoMinor:false};
let cases=0,checks=0;const failures=[],records=[],fixtures=[];
function test(name,source,expected,options={}){cases++;try{const cfg={...base,...options},actual=api.automaticSpelling(source,cfg,()=>{},()=>{});assert.equal(actual,expected);checks++;assert.equal(api.automaticSpelling(actual,cfg,()=>{},()=>{}),actual);checks++;fixtures.push({name,source,expected,options});records.push({name,status:'passed'});}catch(e){failures.push({name,message:e.message});}}
for(const rule of additions){const {wrong,correct}=rule;
 test(wrong+' prose','Ele usou '+wrong+' em sua análise.','Ele usou '+correct+' em sua análise.');
 test(wrong+' punctuation','Eram '+wrong+', ou outros profissionais.','Eram '+correct+', ou outros profissionais.');
 test(wrong+' option off','Ele era '+wrong+'.','Ele era '+wrong+'.',{automaticSpelling:false});
 test(wrong+' allowed','Ele era '+wrong+'.','Ele era '+wrong+'.',{spellingAllowedWords:[wrong]});
 test(wrong+' ignored','Ele era '+wrong+'.','Ele era '+wrong+'.',{spellingIgnoredRules:['word:'+wrong]});
 test(wrong+' proper subject','Ele era '+wrong+'.','Ele era '+wrong+'.',{pageTitle:wrong});
 test(wrong+' bold subject',"'''"+wrong+"''' era o assunto.","'''"+wrong+"''' era o assunto.");
 test(wrong+' upper case',wrong[0].toUpperCase()+wrong.slice(1)+' foi usado.',wrong[0].toUpperCase()+wrong.slice(1)+' foi usado.');
 test(wrong+' longer token',wrong+'x foi usado.',wrong+'x foi usado.');
 test(wrong+' hyphenated token','pré-'+wrong+' foi usado.','pré-'+wrong+' foi usado.');
 for(const [kind,source]of [
  ['reference','<ref>Ele era '+wrong+'.</ref>'],['citation','{{Citar livro|título='+wrong+'|autor=Pessoa}}'],
  ['quote','"Ele era '+wrong+'."'],['apostrophe',"'Ele era "+wrong+".'"],['curly','“Ele era '+wrong+'.”'],
  ['entity quote','&quot;Ele era '+wrong+'.&quot;'],['italic',"''Ele era "+wrong+".''"],['parentheses','Ele era ('+wrong+').'],
  ['link','[['+wrong+']]'],['pipe label','[[Pessoa|'+wrong+']]'],['nowiki','<nowiki>'+wrong+'</nowiki>'],
  ['comment','<!-- '+wrong+' -->'],['code','<code>'+wrong+'</code>'],['foreign','{{lang|fr|'+wrong+'}}'],
  ['heading','== '+wrong+' =='],['bibliography','== Bibliografia ==\n* '+wrong+' foi usado.'],
  ['meta','A palavra '+wrong+' foi usada.'],['url','https://example.invalid/'+wrong],['template','{{Exemplo|'+wrong+'}}']
 ])test(wrong+' protected '+kind,source,source);
 const result=api.calculate({kind:'adjust',source:'Ele era '+wrong+'.',options:base});assert.equal(result.text.includes(correct),true);checks++;assert.equal(result.preservation.filter(x=>/^lost-/.test(x.code||'')).length,0);checks++;
}
for(const text of ['Eu filosofo com meus colegas.','Ela filosofa com seus colegas.','O filósofo escreveu um texto.','Os filósofos escreveram textos.','Ela era uma jurisconsulta.','O exemplo foi explicado.','É um acto de investigação.','É um fato da investigação.'])test('Valid '+text,text,text);
const report={version:'2.6.0',kind:'verified-spelling-additions',bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),cases,checks,failures,status:failures.length?'failed':'passed',records,wikipediaWrites:0,networkRequests:0};if(process.env.REVISAWIKI_UPDATE_FIXTURES==='1')fs.writeFileSync(path.join(root,'spelling_addition_fixtures.json'),JSON.stringify(fixtures,null,2)+'\n');if(process.env.REVISAWIKI_REPORT_DIR){fs.mkdirSync(process.env.REVISAWIKI_REPORT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.REVISAWIKI_REPORT_DIR,'spelling_addition_test_report.json'),JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify({status:report.status,cases,checks,failures}));if(failures.length)process.exitCode=1;
