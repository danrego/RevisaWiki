'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function run(api){const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo'},body='\n* {{IMDb título|tt1234567}}\n',paired='{{Div col|colunas=2}}'+body+'{{Div col fim}}',native='{{Colunas-lista|2|2='+body+'}}',rows=[];
 const verify=(id,before,after,count)=>{const result=api.v2222FinalSourceCount(before,after,cfg);assert(result?.exact,id+' exact final source');assert.equal(result.count,count,id+' syntax components');rows.push({id,count:result.count,exact:result.exact});};
 verify('paired-to-native-column-shell',paired,native,1);
 verify('native-column-unwrapping',native,body,1);
 verify('native-column-wrapping',body,native,1);
 verify('column-count-and-wrapper-kind',paired,'{{Colunas-lista|3|2='+body+'}}',2);
 const before='Texto<ref>{{Citar web|title=Documento|url=https://example.org/a}}</ref>.\n{{normdaten}}',after='Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a}}</ref>\n{{Controle de autoridade}}';
 verify('citation-key-punctuation-and-authority',before,after,3);
 verify('inserted-heading-list-marker-and-imdb','Texto.','Texto.\n\n== Ligações externas ==\n* {{IMDb título|tt1234567}}',3);
 const ordinal=api.v2222CountTemplateFields('{{Box|a=Sim|b=Sim}}','{{Box|c=Sim|d=Sim}}',cfg);assert(ordinal?.exact);assert.equal(ordinal.count,2,'Stable identical values retain their source ordinal');rows.push({id:'same-value-ordinal-field-names',count:ordinal.count,exact:true});
 const locatorBefore='Texto.<ref>{{Citar periódico|título=Documento|article-number=000123}}</ref>\n\n{{Referências}}',locatorAfter='Texto.<ref>{{Citar periódico|título=Documento}} Artigo 000123</ref>\n\n{{Referências}}';verify('literal-electronic-locator-retains-code',locatorBefore,locatorAfter,2);
 const definition='<ref name="a">{{Citar livro|title=Livro}}</ref>',localized='<ref name="a">{{Citar livro|título=Livro}}</ref>';verify('named-reference-body-field',definition,localized,1);
 verify('native-bank-shell-and-definition-field','<references>'+definition+'</references>','{{Referências|refs='+localized+'}}',2);
 verify('native-bible-verse-fields','Texto.<ref>{{Citar bíblia|livro=Atos|verso=28:1-10|citação=Texto}}</ref>','Texto.<ref>{{Citar bíblia|livro=Atos|verso=1|capítulo=28|verso_final=10|citação=Texto}}</ref>',3);
 const deadBefore='Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a}}\n{{Ligação inativa|data=novembro de 2026}}</ref>',deadAfter='Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a|datali=novembro de 2026}}</ref>';verify('dated-dead-marker-to-native-field',deadBefore,deadAfter,2);
 assert.equal(api.v2222CountColumnProjection('{{Colunas-lista|2|2='+body+'|extra=Texto exclusivo}}',body),null,'Extra wrapper data is not erased by a count projection');
 const unknown='Texto<ref name="a">Fonte.</ref>.',different='Texto.<ref name="b">Fonte.</ref>';assert.equal(api.v2222CountReferencePunctuation(unknown,different,cfg),null,'Changed reference identity cannot borrow punctuation pairing');
 assert.equal(api.v2222CountCitationTailProjection(locatorBefore,locatorAfter.replace('000123','000124')),null,'A different locator is not the retained source code');
 assert.equal(api.v2222CountCitationTailProjection(locatorBefore,locatorAfter.replace(' Artigo 000123</ref>','</ref> Artigo 000123')),null,'A locator outside its reference cannot borrow this partition');
 assert.equal(api.v2222CountReferenceBankProjection('<references group="note">'+definition+'</references>','{{Referências|refs='+localized+'}}',cfg),null,'Custom reference group is not an ungrouped bank');
 assert.equal(api.v2222CountReferenceBankProjection('<references>'+definition+'</references>','{{Referências|refs='+localized+'|outro=Valor}}',cfg),null,'An extra bank field stays outside the finite shell proof');
 assert.equal(api.v2222CountReferenceBodiesProjection(definition+definition,localized+localized,cfg),null,'Duplicate reference definitions do not form a unique pair');
 assert.equal(api.v2222CountDeadMarkerProjection(deadBefore,deadAfter.replace('novembro de 2026','outubro de 2026')),null,'A changed dead-link date cannot use the source marker partition');
 return{kind:'pure-final-source-column-reference-count',version:api.version,cases:rows.length,negativeCases:8,calculations:0,results:rows,repairPipelineCalls:0,wikipediaWrites:0};}
if(require.main===module){const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.22.2/RevisaWiki_v2_22_2.js'),report=run(require(file));if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
module.exports={run};
