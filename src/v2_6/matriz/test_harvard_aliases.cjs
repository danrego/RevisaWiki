'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,bundle=path.resolve(process.env.REVISAWIKI_BUNDLE||[path.join(root,'../../dist/2.6.0/RevisaWiki_v2_6.js'),path.join(root,'patched_v26.js')].find(p=>fs.existsSync(p))||'missing-release.js'),api=require(bundle);
let cases=0,checks=0;const failures=[],records=[],fixtures=[];
function run(name,source,codes){cases++;try{const original=Buffer.from(source),actual=api.shortCitationAudit(source);assert.deepEqual(actual.map(x=>x.code),codes);checks++;assert.equal(Buffer.compare(original,Buffer.from(source)),0);checks++;assert.deepEqual(api.shortCitationAudit(source),actual);checks++;records.push({name,status:'passed'});fixtures.push({name,source,codes});}catch(e){failures.push({name,message:e.message});}}
const good=[
 ['English last unindexed','{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}','{{harvtxt|Axler|2024}}'],
 ['English last indexed','{{Citar livro|last1=Boyd|last2=Vandenberghe|date=8 de março de 2004|title=Livro|ref=harv}}','{{harvtxt|Boyd|Vandenberghe|2004}}'],
 ['Portuguese indexed','{{Citar livro|último1=Horn|último2=Johnson|ano=2013|título=Livro|ref=harv}}','{{harvtxt|Horn|Johnson|2013}}'],
 ['Portuguese aliases','{{Citar livro|sobrenome1=Horn|sobrenome2=Johnson|ano=2013|titulo=Livro|ref=harv}}','{{harvtxt|Horn|Johnson|2013}}'],
 ['Mixed accepted fields','{{Citar livro|last1=Horn|último2=Johnson|year=2013|título=Livro|ref=harv}}','{{harvtxt|Horn|Johnson|2013}}'],
 ['English cite book','{{Cite book|last=Axler|date=2024|title=Livro|ref=harv}}','{{harvtxt|Axler|2024}}'],
 ['English author','{{Citar livro|author=Axler|year=2024|title=Livro|ref=harv}}','{{harvtxt|Axler|2024}}'],
 ['Explicit anchor ref','{{Citar livro|last=Axler|year=2024|title=Livro|ref=origem}}','{{harvtxt|Axler|2024|ref=origem}}'],
 ['Explicit HTML anchor','<span id="CITEREFAxler2024"></span>','{{harvtxt|Axler|2024}}'],
 ['Anchor template','{{âncora|CITEREFAxler2024}}','{{harvtxt|Axler|2024}}'],
 ['Nested harvid','{{Citar livro|last=Axler|year=2024|title=Livro|ref={{harvid|Axler|2024}}}}','{{harvtxt|Axler|2024}}'],
 ['Nested sfnref','{{Citar livro|last=Axler|year=2024|title=Livro|ref={{sfnref|Axler|2024}}}}','{{harvtxt|Axler|2024}}'],
 ['Duplicate same work','{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}\n{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}','{{harvtxt|Axler|2024}}'],
 ['Dynamic short call','{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}','{{harvtxt|{{Nome variável}}|2024}}'],
 ['Ref none call','{{Citar livro|last=Axler|year=2024|title=Livro|ref=none}}','{{harvtxt|Axler|2024|ref=none}}'],
 ['Year letter','{{Citar livro|last=Axler|year=2024a|title=Livro|ref=harv}}','{{harvtxt|Axler|2024a}}'],
 ['Four indexed authors','{{Citar livro|last1=A|last2=B|last3=C|last4=D|year=2024|title=Livro|ref=harv}}','{{harvtxt|A|B|C|D|2024}}'],
 ['Both aliases equal','{{Citar livro|last=Axler|último=Axler|year=2024|ano=2024|title=Livro|ref=harv}}','{{harvtxt|Axler|2024}}']
];
for(const [name,definition,call]of good)run(name,call+'\n'+definition,[]);
const missing=[
 ['No definition','{{harvtxt|Ausente|2024}}'],
 ['Wrong year','{{harvtxt|Axler|2023}}\n{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}'],
 ['Wrong surname','{{harvtxt|Ausente|2024}}\n{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}'],
 ['Definition ref none','{{harvtxt|Axler|2024}}\n{{Citar livro|last=Axler|year=2024|title=Livro|ref=none}}'],
 ['Different literal ref','{{harvtxt|Axler|2024|ref=outro}}\n{{Citar livro|last=Axler|year=2024|title=Livro|ref=origem}}'],
 ['Explicit anchor differs','{{harvtxt|Axler|2024}}\n{{âncora|CITEREFOutra2024}}'],
 ['Author conflict','{{harvtxt|Axler|2024}}\n{{Citar livro|last=Axler|último=Outro|year=2024|title=Livro|ref=harv}}'],
 ['Year conflict','{{harvtxt|Axler|2024}}\n{{Citar livro|last=Axler|year=2024|ano=2023|title=Livro|ref=harv}}'],
 ['Quoted definition opaque','{{harvtxt|Axler|2024}}\n<nowiki>{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}</nowiki>'],
 ['Unverified transliteration','{{harvtxt|Axlér|2024}}\n{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}']
];for(const [name,source]of missing)run(name,source,['short-citation-unconfirmed']);
for(const name of ['harvtxt','harvnb','harv','sfnp','sfn'])run('Ambiguous '+name,'{{'+name+'|Axler|2024}}\n{{Citar livro|last=Axler|year=2024|title=Livro A|ref=harv}}\n{{Citar livro|último=Axler|ano=2024|título=Livro B|ref=harv}}',['short-citation-ambiguous']);
for(const name of ['harvtxt','harvnb','harv','sfnp','sfn'])run('Resolved '+name,'{{'+name+'|Axler|2024}}\n{{Citar livro|last=Axler|year=2024|title=Livro|ref=harv}}',[]);
run('Unknown dynamic year remains unconfirmed','{{harvtxt|Axler|2024}}\n{{Citar livro|last=Axler|year={{Ano de publicação}}|title=Livro|ref=harv}}',['short-citation-unconfirmed']);
run('Unknown dynamic author remains unconfirmed','{{harvtxt|Horn|Johnson|2013}}\n{{Citar livro|last1=Horn|last2={{Coautor}}|year=2013|title=Livro|ref=harv}}',['short-citation-unconfirmed']);
run('Dynamic definition does not hide different person','{{harvtxt|Ausente|2024}}\n{{Citar livro|last=Axler|year={{Ano de publicação}}|title=Livro|ref=harv}}',['short-citation-unconfirmed']);
run('Dynamic second author does not hide different year','{{harvtxt|Horn|Johnson|2024}}\n{{Citar livro|last1=Horn|last2={{Coautor}}|year=2013|title=Livro|ref=harv}}',['short-citation-unconfirmed']);
run('Dynamic irrelevant title is not identity','{{harvtxt|Ausente|2024}}\n{{Citar livro|last=Axler|year=2024|title={{Título}}|ref=harv}}',['short-citation-unconfirmed']);
run('Unqualified dynamic first author remains unconfirmed','{{harvtxt|Ausente|2024}}\n{{Citar livro|last={{Autor}}|year=2024|title=Livro|ref=harv}}',['short-citation-unconfirmed']);
run('Unqualified dynamic ref remains unconfirmed','{{harvtxt|Ausente|2024}}\n{{Citar livro|last=Axler|year=2024|title=Livro|ref={{Identificador}}}}',['short-citation-unconfirmed']);
run('Dynamic year refnone cannot supply default anchor','{{harvtxt|Axler|2024}}\n{{Citar livro|last=Axler|year={{Ano}}|title=Livro|ref=none}}',['short-citation-unconfirmed']);
run('Dynamic year customref cannot supply default anchor','{{harvtxt|Axler|2024}}\n{{Citar livro|last=Axler|year={{Ano}}|title=Livro|ref=origem}}',['short-citation-unconfirmed']);
run('Surname prefix is not same person','{{harvtxt|Smithson|2024}}\n{{Citar livro|last=Smith|year={{Ano}}|title=Livro|ref=harv}}',['short-citation-unconfirmed']);
run('Explicit ref is not dynamic surname proof','{{harvtxt|Outro|2024|ref=CITEREFSmithson2024}}\n{{Citar livro|last=Smith|year={{Ano}}|title=Livro|ref=harv}}',['short-citation-unconfirmed']);
const real=fs.readFileSync(path.join(root,'source.wiki'),'utf8');run('Real Matriz definida oldid73217323',real,[]);const actual=api.calculate({kind:'adjust',source:real,options:{namespaceNumber:0,pageTitle:'Matriz definida',autoPreview:false}});assert.equal(actual.text,real);checks++;assert.equal(actual.warnings.some(x=>x.includes('Citação abreviada sem destino local confirmado')),false);checks++;
const report={version:'2.6.0',kind:'harvard-accepted-field-aliases',bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),sourceSha256:crypto.createHash('sha256').update(real).digest('hex'),cases,checks,status:failures.length?'failed':'passed',failures,records,wikipediaWrites:0,networkRequests:0};
if(process.env.REVISAWIKI_REPORT_DIR){fs.mkdirSync(process.env.REVISAWIKI_REPORT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.REVISAWIKI_REPORT_DIR,'harvard_alias_test_report.json'),JSON.stringify(report,null,2)+'\n');}if(process.env.REVISAWIKI_UPDATE_FIXTURES==='1')fs.writeFileSync(path.join(root,'harvard_alias_fixtures.json'),JSON.stringify(fixtures,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases,checks,failures}));if(failures.length)process.exitCode=1;
