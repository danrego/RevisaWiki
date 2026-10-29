'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const api=require(process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.2/RevisaWiki_v2_21_2.js'));
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Assunto de teste',autoPreview:false,registryDoiCheck:false};
const a='{{Citar web|url=https://example.org/one|título=Documento um|língua=en}}';
const b='{{Citar web|url=https://example.org/two|título=Documento dois}}';
const before='Texto<ref name="a" />. Outra afirmação<ref>'+b+'</ref>. Definição<ref name="a">'+a+'</ref>.\n{{Referências}}';
const after='Texto<ref name="a">'+a+'</ref>. Outra afirmação<ref>'+b+'</ref>. Definição<ref name="a" />.\n{{Referências}}';
const proof=api.v2212CitationLanguageMoveCertificate(before,after,cfg);
assert.ok(proof);assert.equal(typeof proof.sourceHash,'string');assert.equal(proof.families.length,1);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after.replace('língua=en','língua=pt'),cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after.replace('https://example.org/one','https://example.org/other'),cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after.replace('Documento um','Outro documento'),cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after.replace('name="a"','name="b"'),cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after.replace('língua=en',''),cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after,cfgWith({moveNamedRefs:false})),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after,cfgWith({references:false})),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after,cfgWith({namespaceNumber:1})),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after+'<ref>Outra fonte</ref>',cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,after.replace('<ref>'+b+'</ref>','<ref>'+a+'</ref>'),cfg),null);
const c='{{Citar web|url=https://example.org/three|título=Documento três|língua=fr}}';
const mixedBefore='Texto<ref name="a" />. Outro<ref>'+b+'</ref>. Fonte A<ref name="a">'+a+'</ref>. Fonte B<ref name="b" />. Definição B<ref name="b">'+c+'</ref>.\n{{Referências}}';
const mixedAfter='Texto<ref name="a">'+a+'</ref>. Outro<ref>'+b+'</ref>. Fonte A<ref name="a" />. Fonte B<ref name = "b" />. Definição B<ref name = "b">'+c+'</ref>.\n{{Referências}}';
assert.ok(api.v2212CitationLanguageMoveCertificate(mixedBefore,mixedAfter,cfg));
assert.equal(api.v219CitationLanguageRetention(mixedBefore,mixedAfter,cfg).accepted,true);
assert.equal(api.v219CosmeticBaseNamedRetention(mixedBefore,mixedAfter,cfg).accepted,true);
assert.equal(api.v2212CitationLanguageMoveCertificate(mixedBefore,mixedAfter.replace('língua=fr','língua=de'),cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(mixedBefore,mixedAfter.replace('https://example.org/three','https://example.org/changed'),cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(before,before.replace('name="a" />','name="a">'+a+'</ref>'),cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(mixedBefore,mixedAfter+'<ref name="new">Fonte</ref>',cfg),null);
assert.equal(api.v2212CitationLanguageMoveCertificate(mixedBefore,mixedAfter,cfgWith({section:'1'})),null);
for(const altered of [
 mixedAfter.replace('língua=en','língua=pt'),
 mixedAfter.replace('língua=fr','língua=de'),
 mixedAfter.replace('https://example.org/one','https://example.org/changed'),
 mixedAfter.replace('https://example.org/three','https://example.org/changed'),
 mixedAfter.replace('Documento um','Outro documento'),
 mixedAfter.replace('Documento três','Outro documento'),
 mixedAfter.replace('name="a"','name="different"'),
 mixedAfter+'<ref name="new">Fonte adicional</ref>'
])assert.equal(api.v219CitationLanguageRetention(mixedBefore,altered,cfg).accepted,false);
function cfgWith(options){return {...cfg,...options};}
console.log(JSON.stringify({suite:'v2212-citations-language',checks:29,passed:true}));

