'use strict';
const assert=require('node:assert/strict'),{api:a,cfg,sourceSha}=require('./harness.cjs');let checks=0,cases=0;
const eq=(x,y,m)=>{checks++;assert.deepEqual(x,y,m)},book='{{cite book |título=Exemplo |url={{google books|id=ABC|plainurl=y}} |ano=2001 |língua=en}}';
for(const [from,to]of [['cite book','Citar livro'],['Cite book','Citar livro'],['cite journal','Citar periódico'],['Cite journal','Citar periódico']])for(const padding of ['', 'Consulte: ', 'Antes.\n']){
 const s=padding+book.replace('cite book',from),expected=s.replace('{{'+from,'{{'+to),p=a.v222OpaqueCitationHeaderPlan(s,cfg);cases++;
 eq(p.text,expected,'exact header only '+from);eq(p.edits.length,1,'one exact header edit');eq(a.v222OpaqueCitationHeaderProof(s,p.text,p,cfg),true,'fresh existing producer proof');
 eq(a.v222OpaqueCitationHeaderProjection(s,cfg),expected,'observer projection endpoint');eq(a.v222OpaqueCitationHeaderPlan(expected,cfg).edits.length,0,'already native unchanged');
 for(const [id,mutant]of [['URL',expected.replace('id=ABC','id=OTHER')],['language',expected.replace('língua=en','língua=fr')],['year',expected.replace('ano=2001','ano=2002')],['prose','Outra passagem. '+expected]])eq(a.v222OpaqueCitationHeaderProof(s,mutant,p,cfg),false,'no '+id+' normalization');
}
for(const s of [book.replace('cite book','CITE BOOK'),book.replace('cite book','cite unknown'),book.replace('cite book','subst:cite book'),book.replace('cite book','\u00a0cite book'),book.replace('cite book','cite book\u202f'),'<nowiki>'+book+'</nowiki>','<!--'+book+'-->','<syntaxhighlight>'+book+'</syntaxhighlight>',book.slice(0,-1),'{{Desconhecida|1='+book+'}}']){cases++;const p=a.v222OpaqueCitationHeaderPlan(s,cfg);eq(p.text,s,'unproved owner/header held');eq(p.edits.length,0,'no guessed alias');}
for(const options of [{citations:false},{multilingual:false},{namespaceNumber:2,pageTitle:'Usuário:Exemplo/PU'},{sectionOnly:true},{contentModel:'javascript'}]){cases++;const p=a.v222OpaqueCitationHeaderPlan(book,{...cfg,...options});eq(p.text,book,'disabled/outside scope stays literal');}
const web='{{cite web|url={{URL opaca|id=1}}|título=Fonte}}';eq(a.v222OpaqueCitationHeaderProjection(web,cfg),a.v2212OpaqueCiteWebHeader(web),'preexisting web projection unchanged');
console.log(JSON.stringify({suite:'v2220-source-bound-opaque-citation-header',sourceSha,cases,checks,passed:true,calculateCalls:0,wikipediaWrites:0}));
