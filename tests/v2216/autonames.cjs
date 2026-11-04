'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.6/RevisaWiki_v2_21_6.js'),api=require(core),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;const rows=[];
function eq(a,b,label){checks++;assert.deepEqual(a,b,label);}
const samples=[
 ['{{citar livro|ultimo1=Cordell|ultimo2=Grubb|ultimo3=Noonan|data=Setembro 2001|titulo=Exemplo}}','CordellGrubbNoonan2001-'],
 ['{{Citar web|ultimo=Silva|data=2026|titulo=Exemplo}}','Silva2026-'],
 ['{{cite web|last=Silva|date=2026|title=Exemplo}}','Silva2026-'],
 ['{{Citar web|url=https://example.org/fonte|data=2026}}','example.org2026-'],
 ['{{Citar web|titulo=Exemplo sintético|ano=2026}}','Exemplo_sintético2026-'],
 ['{{Citar web|ano=2026}}',null],
 ['{{Citar livro|ultimo1=Um|ultimo2=Dois|ultimo3=Três|ultimo4=Quatro|ultimo5=Cinco|ano=2020}}','UmDoisTrêsQuatro2020-'],
 ['{{Citar livro|ultimo=[[Pessoa|Sobrenome]]|ano=2020|acessodata=2026-11-01}}','Sobrenome2020-'],
 ['{{Citar web|título=Exemplo|acessodata=2026-11-01}}','Exemplo-'],
 ['{{Citar web|ultimo=Um|last=Dois|ano=2020|titulo=Exemplo}}',null],
 ['{{Citar web|ultimo={{Autor}}|ano=2020|titulo=Exemplo}}',null],
 ['{{Modelo desconhecido|titulo=Exemplo|ano=2020}}',null]
];for(const[b,v]of samples)eq(api.v2216AutonameBase(b),v,'Native priority or conservative unsupported metadata');
function run(source,opts=cfg){const plan=api.v2216AutonamePlan(source,opts);eq(api.v2216AutonameProof(source,plan.text,plan,opts),true,'The family plan has an independent literal occurrence witness');const r=api.calculate({kind:'adjust',source,originalSource:source,options:opts});calculations++;eq(api.v219AutomaticResultSafety(source,r).accepted,true,'Full original draft has a preservation certificate');eq(api.preservationAudit(source,r.text,opts),[],'No original-to-final preservation finding');const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:opts});calculations++;eq(again.text,r.text,'A descriptive name remains stable on the second action');rows.push({inputSha256:crypto.createHash('sha256').update(source).digest('hex'),outputSha256:crypto.createHash('sha256').update(r.text).digest('hex')});return r.text;}
const citation='{{Citar web|ultimo=Silva|data=2026|título=Fonte|url=https://example.org/fonte}}';
for(const old of [':0',':12','ref-auto-1','RevisaWiki-auto-3'])for(const quote of ['"',"'"]){const source='Texto<ref name='+quote+old+quote+'>'+citation+'</ref>. Outro<ref name='+quote+old+quote+'/>.\n{{Referências}}',text=run(source);eq((text.match(/name="Silva2026-1"/g)||[]).length,2,'Definition and separate reuse migrate as one complete family');eq(text.includes(citation),true,'Citation bytes remain intact');}
const conflict=run('A<ref name="Silva2026-1">Outra fonte</ref>. B<ref name=":0">'+citation+'</ref>. C<ref name=":1">'+citation.replace('Fonte','Obra diferente')+'</ref>.\n{{Referências}}');eq(conflict.includes('name="Silva2026-2"'),true,'Existing descriptive name reserves its identity');eq(conflict.includes('name="Silva2026-3"'),true,'The same author/year does not merge different works');
for(const name of ['fonte-manual','Silva2026-1','ref-123']){const source='Texto<ref name="'+name+'">'+citation+'</ref>.\n{{Referências}}';eq(api.v2216AutonamePlan(source,cfg).text,source,'Descriptive and ambiguous user-assigned names are preserved');}
for(const source of [
 '<nowiki>Texto<ref name=":0">'+citation+'</ref></nowiki>',
 '<!--<ref name=":0">'+citation+'</ref>-->',
 'A<ref name=":0">'+citation+'</ref> B<ref name=":0">Outra fonte</ref>',
 'A<ref name=":0"/>',
 'A<ref name=":0">'+citation+'</ref> {{r|:0}}',
 '{{Desconhecido|A<ref name=":0">'+citation+'</ref>}}',
 'A<ref name=":0" follow=":1">'+citation+'</ref>'
])eq(api.v2216AutonamePlan(source,cfg).text,source,'Protected, conflicting, helper-owned or incomplete name family is retained');
const groupSource='A<ref name=":0" group="especial">'+citation+'</ref> B<ref name=":0" group="especial"/>\n{{Referências|grupo=especial}}',groupPlan=api.v2216AutonamePlan(groupSource,cfg);eq((groupPlan.text.match(/group="especial"/g)||[]).length,2,'Named groups are never silently changed');
for(const mutation of [text=>text.replace('example.org/fonte','example.org/outra'),text=>text.replace('Fonte','Outra obra'),text=>text.replace(/Silva2026-1/g,'Outro2026-1'),text=>text.replace('</ref>','alteração</ref>')]){const source='A<ref name=":0">'+citation+'</ref> B<ref name=":0"/>\n{{Referências}}',plan=api.v2216AutonamePlan(source,cfg),changed=mutation(plan.text);if(changed!==plan.text)eq(api.v2216AutonameProof(source,changed,{...plan,text:changed},cfg),false,'A forged family or changed citation cannot reuse the proof');}
for(const helper of ['{{Modelo desconhecido|referencia=:0}}','{{Modelo desconhecido|:0}}','{{Modelo desconhecido|nome=&#58;0}}']){
 const source='A<ref name=":0">'+citation+'</ref> B<ref name=":0"/>\n'+helper+'\n{{Referências}}';
 eq(api.v2216AutonamePlan(source,cfg).text,source,'An opaque argument cannot retain a name while its raw family is renamed');
}
for(const occupied of ['{{Modelo desconhecido|referencia=Silva2026-1}}','<ref name="Silva2026-1">Outra fonte</ref>']){
 const source=occupied+'\nA<ref name=":0">'+citation+'</ref>\n{{Referências}}';
 eq(api.v2216AutonamePlan(source,cfg).text.includes('name="Silva2026-2"'),true,'Opaque arguments and actual names both reserve target identities');
}
const unicode='<ref name="Cafe\u03012001-1">Outra fonte</ref> A<ref name=":0">{{Citar livro|ultimo=Café|ano=2001|titulo=Obra}}</ref>\n{{Referências}}';
eq(api.v2216AutonamePlan(unicode,cfg).text.includes('name="Café2001-2"'),true,'Potential pre-save NFC equivalence cannot capture an occupied name');
for(const body of ['{{Citar web|ultimo=Silva|data=2001|ano=2002|titulo=Exemplo}}','{{Citar web|ultimo=Silva|data=2001 a 2002|titulo=Exemplo}}'])eq(api.v2216AutonameBase(body),null,'Conflicting or ranged publication years use the neutral fallback');
const r={suite:'descriptive-reference-names-2.21.6',checks,calculations,rows,runtimeSha256:crypto.createHash('sha256').update(fs.readFileSync(core)).digest('hex'),wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));
