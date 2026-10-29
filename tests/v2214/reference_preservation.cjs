'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.4/RevisaWiki_v2_21_4.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Programa de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-29'};
let checks=0,calculations=0;const failures=[],rows=[],eq=(a,b,label)=>{checks++;try{assert.deepEqual(a,b,label);}catch(e){failures.push({label,actual:a,expected:b});}};
const body='{{cite press release|title=Comunicado de teste|url=https://example.org/fonte|author=<!--Sem assinatura individual.-->|publisher=Organização de teste|id=DOC-1|date=12 de outubro 1993|access-date=12 de março 2018}}';
const wrap=(b,tail='')=>'Texto de teste<ref name="fonte">'+b+'</ref>'+tail+'\n{{Referências}}';
const source=wrap(body),plan=api.v2214ReferenceCitationPlan(source,cfg);
eq(plan.edits.length,1,'A single complete named citation is projected');
eq(api.v2214ReferenceCitationProof(source,plan.text,plan,cfg),true,'The projection is rederived from the exact source');
eq(plan.text.includes('<!--Sem assinatura individual.-->'),true,'The source comment is retained byte for byte');
eq(plan.text.includes('{{Citar comunicado de imprensa|'),true,'Only the pinned local redirect supplies the native title');
eq(plan.text.includes('date=12 de outubro de 1993'),true,'The existing calendar-valid date writer supplies the value');
eq(api.v219NamedReferenceRetention(source,plan.text,cfg).accepted,true,'The unchanged source association is recognized');
eq(api.v2214ReferenceCitationProof(source,plan.text,{...plan,sourceHash:'other'},cfg),false,'A stale source hash is refused');
eq(api.v2214ReferenceCitationProof(source,plan.text,{...plan,edits:[]},cfg),false,'A forged empty edit list is refused');
eq(api.v2214ReferenceCitationProof(source,plan.text+' ',plan,cfg),false,'A different output is refused');
for(const delta of [{citations:false},{multilingual:false},{namespaceNumber:10},{contentModel:'javascript'}]){
 const local={...cfg,...delta},p=api.v2214ReferenceCitationPlan(source,local);
 eq(p.text,source,'Disabled or definition contexts add no equivalence');
 eq(api.v2214ReferenceCitationProof(source,plan.text,plan,local),false,'A proof cannot be borrowed across a disabled option');
}
const noDates={...cfg,automaticCitationDateValues:false},noDatePlan=api.v2214ReferenceCitationPlan(source,noDates);
eq(noDatePlan.text.includes('date=12 de outubro 1993'),true,'A disabled date writer preserves the original date bytes');
eq(api.v219NamedReferenceRetention(source,noDatePlan.text,noDates).accepted,true,'The independently enabled local redirect still works');
const badDate=source.replace('12 de outubro 1993','31 de fevereiro de 1993'),badPlan=api.v2214ReferenceCitationPlan(badDate,cfg);
eq(badPlan.text.includes('31 de fevereiro de 1993'),true,'An invalid date receives no invented date correction');
const controls=[
 ['no-comment',source.replace('<!--Sem assinatura individual.-->','')],
 ['unknown-template',source.replace('cite press release','Modelo não certificado')],
 ['header-comment',source.replace('cite press release','cite<!--x--> press release')],
 ['unclosed-comment',source.replace('-->','')],
 ['unclosed-ref',source.replace('</ref>','')],
 ['extra-ref-attribute',source.replace('name="fonte"','name="fonte" follow="outra"')],
 ['nested-unknown-template',source.replace('Comunicado de teste','{{Modelo de exemplo}}')],
 ['literal-example','<syntaxhighlight lang="wikitext">'+source+'</syntaxhighlight>'],
 ['nowiki-example','<nowiki>'+source+'</nowiki>'],
 ['anonymous-reference',source.replace(' name="fonte"','')]
];
for(const [id,text]of controls){eq(api.v2214ReferenceCitationPlan(text,cfg).text,text,'No new projection outside the strict contract: '+id);rows.push({id,kind:'negative-control'});}
const mutations=[
 ['url',s=>s.replace('https://example.org/fonte','https://example.net/outra')],
 ['title',s=>s.replace('Comunicado de teste','Outro comunicado')],
 ['publisher',s=>s.replace('Organização de teste','Outra organização')],
 ['identifier',s=>s.replace('DOC-1','DOC-2')],
 ['comment',s=>s.replace('Sem assinatura individual.','Outro comentário.')],
 ['author',s=>s.replace('author=<!--','author=Pessoa não informada<!--')],
 ['publication-day',s=>s.replace('date=12 de outubro de 1993','date=13 de outubro de 1993')],
 ['access-day',s=>s.replace('access-date=12 de março de 2018','access-date=13 de março de 2018')],
 ['name',s=>s.replace('name="fonte"','name="outra"')],
 ['group',s=>s.replace('name="fonte"','name="fonte" group="nota"')],
 ['missing-definition',s=>s.replace(/<ref[\s\S]*?<\/ref>/,'<ref name="fonte"/>')],
 ['removed-field',s=>s.replace('|publisher=Organização de teste','')],
 ['added-duplicate-field',s=>s.replace('|publisher=Organização de teste','|publisher=Organização de teste|publisher=Outra organização')]
];
for(const [id,mutate]of mutations){const candidate=mutate(plan.text);eq(api.v219NamedReferenceRetention(source,candidate,cfg).accepted,false,'The complete guard refuses unproved mutation: '+id);rows.push({id,kind:'adversarial'});}
const collisionCases=[
 ['date-aliases',source.replace('|date=12 de outubro 1993','|date=12 de outubro 1993|data=13 de outubro de 1993')],
 ['publisher-aliases',source.replace('|publisher=Organização de teste','|publisher=Organização de teste|publicado=Outra organização')],
 ['url-aliases',source.replace('|url=https://example.org/fonte','|url=https://example.org/fonte|URL=https://example.net/outra')],
 ['author-aliases',source.replace('|author=<!--Sem assinatura individual.-->','|author=<!--Sem assinatura individual.-->|autor=Pessoa de teste')]
];
for(const [id,text]of collisionCases){
 const projected=api.v2214ReferenceCitationPlan(text,cfg);
 eq(projected.edits.length,1,'The header-only local redirect retains even competing raw arguments: '+id);
 const a=api.v219NativeReferenceObserver(text).refs[0].body,b=api.v219NativeReferenceObserver(projected.text).refs[0].body;
 eq(b.includes(a.slice(a.indexOf('|'),a.indexOf('|date='))),true,'Competing original role values are not merged or dropped: '+id);
 const mutated=projected.text.replace(/https:\/\/example\.org\/fonte/,'https://example.org/alterada');
 eq(api.v219NamedReferenceRetention(text,mutated,cfg).accepted,false,'An alias collision does not waive the URL binding: '+id);
 const removed=projected.text.replace(/\|(?:data=13 de outubro de 1993|publicado=Outra organização|URL=https:\/\/example\.net\/outra|autor=Pessoa de teste)/,'');
 eq(api.v219NamedReferenceRetention(text,removed,cfg).accepted,false,'An alias collision does not authorize dropping the competing value: '+id);
 rows.push({id,kind:'alias-conflict-control'});
}
const two=source.replace('\n{{Referências}}',' e <ref name="segunda">{{Citar web|título=Outra fonte|url=https://example.org/outra}}</ref>\n{{Referências}}'),twoPlan=api.v2214ReferenceCitationPlan(two,cfg),read=api.v219NativeReferenceObserver(twoPlan.text).refs;
const first=twoPlan.text.slice(read[0].start,read[0].end),second=twoPlan.text.slice(read[1].start,read[1].end),swapped=twoPlan.text.replace(first,'@@REF@@').replace(second,first).replace('@@REF@@',second);
eq(api.v219NamedReferenceRetention(two,swapped,cfg).accepted,false,'Changing the order and source association remains forbidden');
const peers=wrap(body,' outra chamada<ref name="fonte">'+body+'</ref>'),peerPlan=api.v2214ReferenceCitationPlan(peers,cfg),split=peerPlan.text.replace('{{Citar comunicado de imprensa','{{cite press release');
eq(api.v219NamedReferenceRetention(peers,split,cfg).accepted,false,'One identical named family cannot be split by partial cleanup');
for(const text of [source,peers,two,'{{Descrição curta|Programa de teste}}\n'+source]){
 const r=api.calculate({kind:'adjust',source:text,originalSource:text,options:cfg});calculations++;
 eq(api.v219AutomaticResultSafety(text,r).accepted,true,'The full candidate passes all preservation checks');
 if(text===peers)eq(r.text,text,'An opaque duplicate family retains the existing conservative abstention');
 else eq(r.text.includes('{{Citar comunicado de imprensa|'),true,'The existing header correction reaches the final candidate');
 eq(r.text.includes('<!--Sem assinatura individual.-->'),true,'The complete writer keeps the comment');
 const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});calculations++;
 eq(again.text,r.text,'The accepted candidate is idempotent');
 rows.push({id:'complete-'+calculations,kind:'full-calculation',sourceSha256:sha(text),candidateSha256:sha(r.text)});
}
const receipt={suite:'commented-native-citation-preservation-2.21.4',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'All association and metadata guards must remain effective');
