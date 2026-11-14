'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),api=process.env.REVISAWIKI_CURRENT_CORE?require('./harness.cjs').api:require('./citation_harness.cjs').load(),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo'};
let checks=0,cases=0;function yes(x,m){checks++;assert.ok(x,m);}
const chars=['\u00a0','\u202f','\u3000','\ufeff','\u200b','\u2028'];
function spans(source){for(const field of api.v222Fields(source).fields){yes(source.slice(field.keyStart,field.keyEnd)===field.key,'literal key span exact');yes(source.slice(field.valueStart,field.end)===field.value,'literal value span exact');}}
for(const char of chars)for(const side of ['leading','trailing']){
 const key=word=>side==='leading'?char+word:word+char;
 let source='{{Info/Empresa|nome=Exemplo|'+key('website')+'=https://example.invalid}}';cases++;spans(source);const p=api.v222InfoboxPlan(source,cfg);yes(p.text===source,'Unicode-padded website is not activated/corrupted');yes(api.v222InfoboxProof(source,p.text,p,cfg),'source-bound infobox proof');yes(!api.v222InfoboxProof(source,source.replace(key('website'),'sitee'),p,cfg),'partial key corruption rejected');
 source='{{Info/Empresa|nome=Exemplo|'+key('website')+'=https://example.invalid|homepage=https://secondary.invalid}}';cases++;spans(source);const q=api.v222InfoboxPlan(source,cfg);yes(q.text.includes('|'+key('website')+'=https://example.invalid'),'opaque key and value exact');yes(q.text.includes('|site=https://secondary.invalid'),'independent ASCII site alias still corrected');
 for(const [template,field,value]of [['Citar web','url','http://http://example.org/a?x=1#part'],['Citar livro','isbn','ISBN ISBN: 9780306406157']]){
  source='{{'+template+'|title=Fonte|publisher=Instituição|'+key(field)+'='+value+'}}';cases++;spans(source);const c=api.v222CitationsPlan(source,cfg);yes(c.text.includes('|'+key(field)+'='+value),'ignored literal field/value stays exact');yes(c.text.includes('|título=Fonte|publicado=Instituição'),'independent safe keys survive');yes(api.v222CitationsProof(source,c.text,c,cfg),'source-bound citation proof');
 }
}
for(const source of ['{{Citar web| title =Fonte|publisher=Instituição}}','{{Citar web|\t title\t=Fonte|\tpublisher \t=Instituição}}','{{Citar web|\n title =Fonte|\n publisher =Instituição}}']){cases++;spans(source);const p=api.v222CitationsPlan(source,cfg);yes(p.text.includes('título'),'known ASCII layout retains migration');yes(!p.text.includes('title'),'whole key replaced with correct span');}
const receipt={suite:'v222-literal-unicode-parameter-keys',cases,checks,passed:true,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
