'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {api,cfg,file,sourceSha}=require('./harness.cjs');
let checks=0;const cases=[];
function eq(a,b,message){checks++;assert.equal(a,b,message);}
function test(id,source,expected,options={}){
 const settings={...cfg,...options},plan=api.v222ReferencePlan(source,settings);
 eq(plan.text,expected,id);eq(api.v222ReferenceProof(source,plan.text,plan,settings),true,id+' proof');
 eq(api.v222ReferencePlan(plan.text,settings).text,plan.text,id+' idempotence');
 eq(api.v222ReferenceProof(source,plan.text,{...plan,sourceHash:'changed'},settings),false,id+' hash tamper');
 eq(api.v222ReferenceProof(source,plan.text,{...plan,edits:[{start:0,end:source.length+1,text:''}]},settings),false,id+' span tamper');
 for(let i=1;i<plan.edits.length;i++)eq(plan.edits[i].start>=plan.edits[i-1].end,true,id+' nonoverlap');
 if(plan.edits.length)eq(plan.edits.every(e=>Number.isInteger(e.count)&&e.count>0),true,id+' real counts');
 cases.push({id,changed:source!==plan.text,count:plan.edits.reduce((n,e)=>n+e.count,0)});return plan;
}
test('translated-ref-attributes','A<ref nome="a" grupo="nota">Fonte.</ref> B<ref nome="a" grupo="nota"/>','A<ref name="a" group="nota">Fonte.</ref> B<ref name="a" group="nota"/>');
for(const operator of [':','=='])test('ref-operator-'+operator,'A<ref name'+operator+'"a">Fonte.</ref> B<ref name'+operator+'"a"/>','A<ref name="a">Fonte.</ref> B<ref name="a"/>');
test('single-quoted-attribute','A<ref nome=\'a\'>Fonte.</ref> B<ref nome=\'a\'/>','A<ref name=\'a\'>Fonte.</ref> B<ref name=\'a\'/>');
test('unquoted-attribute','A<ref nome=a>Fonte.</ref> B<ref nome=a/>','A<ref name=a>Fonte.</ref> B<ref name=a/>');
test('conflicting-family-independent-repair','A<ref name="a">Fonte A.</ref> B<ref nome="a">Fonte B.</ref> C<ref nome="b">Outra.</ref>','A<ref name="a">Fonte A.</ref> B<ref nome="a">Fonte B.</ref> C<ref name="b">Outra.</ref>');
for(const source of ['A<ref nome="a">Sem fechamento','A<ref nome="a"/>','A<ref name="a" nome="b">Fonte.</ref>','A<ref nome="{{Nome}}">Fonte.</ref>','A<ref nome="a" follow="b">Fonte.</ref>','<nowiki><ref nome="a">Fonte.</ref></nowiki>','<pre><ref name:"a">Fonte.</ref></pre>','"<ref name:"a">Fonte.</ref>"','{{Modelo|x=<ref nome="a">Fonte.</ref>}}'])test('attribute-negative-'+cases.length,source,source);
test('named-definition-later','A<ref name="a"/> B<ref name="a">Fonte.</ref>','A<ref name="a"/> B<ref name="a">Fonte.</ref>');
test('orphan-removal-keeps-prose','Texto<ref name="ausente"/> continua.','Texto continua.');
test('numeric-name-is-not-special','Texto<ref name="2"/> continua.','Texto continua.');
test('orphan-group-specific','Texto<ref name="a" group="nota"/> B<ref name="a">Fonte.</ref>','Texto B<ref name="a">Fonte.</ref>');
for(const source of ['Texto<ref name="a"/>{{Desconhecido}}','Texto<ref name="a"/>{{refn|name=a|Fonte.}}','Texto<ref name="a"/>{{R|a}}<ref name="a">Fonte.</ref>','Texto<ref name="a"/><references><ref name="a">Fonte.</ref></references>','Texto<ref name="a"/>{{Referências|refs=<ref name="a">Fonte.</ref>}}','Texto<ref name="a"/>{{sfn|Autor|2020}}','Texto<ref name="a"/>{{{banco}}}']){
 const result=api.v222ReferencePlan(source,cfg);eq(result.text.includes('<ref name="a"/>'),true,'possible producer preserved '+cases.length);eq(api.v222ReferenceProof(source,result.text,result,cfg),true,'producer proof');cases.push({id:'possible-producer-'+cases.length,changed:result.text!==source});
}
test('outer-whitespace-anonymous','A<ref> Fonte. </ref> B<ref>Fonte.</ref>','A<ref name="ref-auto-1"> Fonte. </ref> B<ref name="ref-auto-1" />');
test('outer-whitespace-same-group','A<ref group="nota"> Fonte. </ref> B<ref group="nota">Fonte.</ref>','A<ref name="ref-auto-1" group="nota"> Fonte. </ref> B<ref name="ref-auto-1" group="nota" />');
for(const source of ['A<ref group="nota"> Fonte. </ref> B<ref>Fonte.</ref>','A<ref>Fonte A.</ref> B<ref>Fonte B.</ref>','A<ref>\n* Item\n</ref> B<ref>* Item</ref>','A<ref> Fonte. </ref>\n{{Referências}}\nB<ref>Fonte.</ref>']){
 const p=api.v222ReferencePlan(source,cfg);eq(!p.text.includes('ref-auto-'),true,'dedup boundary '+cases.length);cases.push({id:'dedup-boundary-'+cases.length,changed:p.text!==source});
}
const four='{{Notas}}\n{{Notelist|30em}}\n\n{{Referências}}\n{{Reflist|30em}}',content='Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>\n\n';
test('four-common-collectors',content+four,content+'{{Notas e referências}}');
test('four-no-note', 'Texto<ref>Fonte.</ref>\n\n'+four,'Texto<ref>Fonte.</ref>\n\n{{Referências}}');
test('reverse-collector-order',content+'{{Referências}}\n{{Notas}}',content+'{{Notas e referências}}');
test('correlatos-and-seealso-no-block','== Ver também ==\n{{Correlatos}}\n\n'+content+four,'== Ver também ==\n{{Correlatos}}\n\n'+content+'{{Notas e referências}}');
const literalCorrelatos='{{Correlatos|título=Tema fictício|commonscat=Example|wikinoticiascat=Exemplo|wikcionario=exemplo|wikidata=Q1}}';
test('literal-correlatos-arguments-retained','== Ver também ==\n'+literalCorrelatos+'\n\n'+content+four,'== Ver também ==\n'+literalCorrelatos+'\n\n'+content+'{{Notas e referências}}');
for(const raw of ['{{Correlatos}}',literalCorrelatos,'{{Correlatos\n|título=Tema fictício\n|commonscat=Example\n}}'])eq(api.v222ReferenceHeadingFreeCorrelatos(raw),true,'known native headless Correlatos shape');
for(const raw of ['{{Correlato}}','{{Correlatos|desconhecido=valor}}','{{Correlatos|título=[[Tema]]}}','{{Correlatos|título={{Nome}}}}','{{Correlatos|título=Primeira\nsegunda}}','{{Correlatos|título=Um|título=Dois}}','{{Correlatos|Tema}}','{{Correlatos|largura=250px}}','{{Correlatos|título=<h2>Tema</h2>}}']){
 eq(api.v222ReferenceHeadingFreeCorrelatos(raw),false,'unproved Correlatos remains opaque');const p=api.v222ReferenceCollectorsPlan('== Ver também ==\n'+raw+'\n\n'+content+four,cfg);eq(p.text.includes('{{Notas e referências}}'),false,'opaque Correlatos cannot close heading inventory');cases.push({id:'correlatos-heading-negative-'+cases.length,changed:p.edits.length>0});
}
const manyNonCorrelatos=Array.from({length:128},(_,i)=>'{{Val|'+i+'}}').join('\n')+'\n== Fontes ==\n';
eq(JSON.stringify(api.v222ReferenceManualOwner(manyNonCorrelatos,manyNonCorrelatos.length)),JSON.stringify(api.v2217ReferenceManualSection(manyNonCorrelatos,manyNonCorrelatos.length,api.protectedView(manyNonCorrelatos))),'many unrelated nodes retain exact legacy owner');cases.push({id:'many-noncorrelatos-owner-equivalence',changed:false});
const html='== Notas ==\n<div class="references"><references group=lower-alpha/></div>\n\n== Referência ==\n<references />';
const colHtml=test('COL-HTML-01',content+html,content+'{{Notas e referências}}');eq(colHtml.edits[0].count,5,'COL-HTML-01 two collectors two headings one wrapper');
test('COL-HTML-01-both-note-groups','Texto<ref group="nota">N.</ref><ref group="lower-alpha">A.</ref><ref>F.</ref>\n\n'+html,'Texto<ref group="nota">N.</ref><ref group="lower-alpha">A.</ref><ref>F.</ref>\n\n{{Notas e referências}}');
for(const wrapper of ['<div id="notas" class="references"><references group=lower-alpha/></div>','<div class="references" style="color:red"><references group=lower-alpha/></div>','<div class="references other"><references group=lower-alpha/></div>','<div class="references">Texto<references group=lower-alpha/></div>','<div class="references"><references group=lower-alpha><ref name="a">Def.</ref></references></div>']){
 const s=content+'== Notas ==\n'+wrapper+'\n\n== Referência ==\n<references />',p=api.v222ReferencePlan(s,cfg);eq(p.text.includes(wrapper),true,'wrapper content retained');eq(!p.text.includes('{{Notas e referências}}'),true,'wrapper not converged');cases.push({id:'wrapper-negative-'+cases.length,changed:p.text!==s});
}
for(const source of [content+'{{Notas|refs=<ref group="lower-alpha" name="a">Nota.</ref>}}\n{{Referências}}',content+'{{Notelist|30em|refs=<ref name="a">Nota.</ref>}}\n{{Referências}}',content+'{{Notas}}\nTexto entre coletores.\n{{Referências}}',content+'{{Notelist|group=upper-alpha}}\n{{Referências}}','{{UnknownNoteProducer}}\n'+content+four,content+'[[#Notas]]\n'+html]){
 const p=api.v222ReferencePlan(source,cfg);eq(!p.text.includes('{{Notas e referências}}'),true,'collector condition '+cases.length);eq(api.v222ReferenceProof(source,p.text,p,cfg),true,'collector held proof');cases.push({id:'collector-held-'+cases.length,changed:p.text!==source});
}
test('custom-reflist-width-preserved','Texto<ref>Fonte.</ref>\n\n== Referências ==\n{{Reflist|30em}}','Texto<ref>Fonte.</ref>\n\n== Referências ==\n{{Reflist|30em}}');
test('custom-heading-level-suppressed','Texto.<ref name="a">Fonte.</ref>\n\n== Fontes ==\n{{Reflist|2}}\n\n== Bibliografia ==\n* Obra.\n','Texto.<ref name="a">Fonte.</ref>\n\n== Fontes ==\n{{Referências|nível=0}}\n\n== Bibliografia ==\n* Obra.\n');
test('manual-owner-with-paragraph','Texto.<ref>Fonte.</ref>\n\n== Fontes ==\nTexto da seção.\n{{Reflist}}','Texto.<ref>Fonte.</ref>\n\n== Fontes ==\nTexto da seção.\n{{Referências|nível=0}}');
test('effective-notelist-width-retained',content+'{{Notelist|30em}}\n{{Referências}}',content+'{{Notelist|30em}}\n{{Referências}}');
test('custom-notes-owner-retained',content+'== Notas explicativas ==\n{{Notelist}}\n\n{{Referências}}',content+'== Notas explicativas ==\n\n{{Notelist}}\n\n{{Referências}}');
test('preserve-notas-positional-title','{{Notas|30em}}','{{Notas|30em}}');
test('preserve-reference-positional-title','{{Referências|30em}}','{{Referências|30em}}');
test('collector-own-line-one-blank','Texto.\n{{Referências}}\nDepois.','Texto.\n\n{{Referências}}\n\nDepois.');
test('no-leading-empty-line','{{Referências}}','{{Referências}}');
test('empty-notas-alone','Texto.\n{{Notas}}','Texto.\n');
test('empty-notas-standard-heading','Texto.\n== Notas ==\n{{Notas}}','Texto.\n');
test('empty-notas-custom-heading-preserved','Texto.\n== Notas explicativas ==\n{{Notas}}','Texto.\n== Notas explicativas ==\n');
test('empty-notas-section-prose-preserved','Texto.\n== Notas ==\nExplicação conservada.\n{{Notas}}','Texto.\n== Notas ==\nExplicação conservada.\n');
for(const source of ['Texto.\n{{Desconhecido}}\n\n{{Notas}}','Texto.<ref group="nota">Nota.</ref>\n\n{{Notas}}','Texto.\n{{Notas|Título próprio}}','Veja [[#Notas]].\n== Notas ==\n{{Notas}}','Texto.\n{{sfn|Autor|2020}}\n\n{{Notas}}'])test('empty-notas-negative-'+cases.length,source,source);
test('only-notas-needs-default-renderer','Texto<ref>Fonte.</ref>\n{{Notas}}','Texto<ref>Fonte.</ref>\n\n{{Referências}}');
test('only-notas-needs-combined-renderer','Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}','Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n\n{{Notas e referências}}');
test('only-notas-lower-alpha-needs-combined','Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}','Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>\n\n{{Notas e referências}}');
test('only-notas-standard-empty-heading','Texto<ref>Fonte.</ref>\n== Notas ==\n{{Notas}}','Texto<ref>Fonte.</ref>\n\n{{Referências}}');
for(const source of ['Texto<ref>Fonte.</ref>\n{{Desconhecido}}\n\n{{Notas}}','Texto<ref>Fonte.</ref>\n\n{{Notas|refs=<ref>Banco.</ref>}}','Texto<ref>Fonte.</ref>\n\n{{Notas|Título próprio}}','Texto<ref group="x">Nota.</ref><ref>Fonte.</ref>\n\n{{Notas}}','Texto<ref>Fonte.</ref>\n== Fontes ==\n{{Notas}}','Texto<ref>Fonte.</ref>\n\n{{Notas}}\nDepois<ref>Posterior.</ref>']){const p=api.v222ReferenceCollectorsPlan(source,cfg);eq(p.text,source,'missing renderer unproved dependent group retained');cases.push({id:'only-notas-renderer-negative-'+cases.length,changed:false});}
test('short-cite-horizontal-gap','Texto. {{sfn|Autor|2020}}','Texto.{{sfn|Autor|2020}}');
test('short-cite-no-newline-consumption','Texto.\n{{sfn|Autor|2020}}','Texto.\n{{sfn|Autor|2020}}');
test('prose-punctuation','Uma frase , outra .','Uma frase, outra.');
test('prose-parentheses','Uma frase ( palavra ) segue.','Uma frase (palavra) segue.');
for(const source of ['Número 2 , 3.','Fórmula E = mc , outra.','x , y','( x )','"Título , especial ."','{{Citar livro|título=Uma frase , outra .}}','[[Uma frase , outra .]]','https://example.org/uma , outra.','<nowiki>Uma frase , outra .</nowiki>','<math>a , b</math>'])test('prose-negative-'+cases.length,source,source);
for(const options of [{references:false},{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{pageRedirect:true},{contentModel:'javascript'}])test('scope-negative-'+cases.length,'Texto , outro.<ref nome="a">Fonte.</ref>','Texto , outro.<ref nome="a">Fonte.</ref>',options);
const draft={namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'};
test('recognized-draft-collectors',content+html,content+'{{Notas e referências}}',draft);
test('recognized-draft-orphan','Texto<ref name="ausente"/> continua.','Texto continua.',draft);
for(const pageTitle of ['Usuário:Conta de Teste','Usuário:Conta de Teste/PU','Usuário:Conta de Teste/Testes/Predefinição:Exemplo'])test('non-draft-user-page-'+cases.length,content+html,content+html,{namespaceNumber:2,pageTitle});
eq(api.v222ReferenceProof('', '', null,cfg),false,'null proof');
for(const [name,source] of [['Attributes','A<ref nome="a">Fonte.</ref> B<ref nome="a"/>'],['Dedup','A<ref> Fonte. </ref> B<ref>Fonte.</ref>'],['Orphans','Texto<ref name="ausente"/>.'],['Collectors',content+html],['CollectorSpacing','Texto.\n{{Referências}}\nDepois.'],['ShortGap','Texto. {{sfn|Autor|2020}}'],['ProseSpacing','Texto , outro.']]){
 const make=api['v222Reference'+name+'Plan'],prove=api['v222Reference'+name+'Proof'],p=make(source,cfg);eq(p.text!==source,true,name+' real substep');eq(prove(source,p.text,p,cfg),true,name+' independent proof');eq(prove(source+'x',p.text,p,cfg),false,name+' exact current source');
}
const report={suite:'v2220-references',runtime:file,runtimeSha256:sourceSha,checks,cases:cases.length,results:cases,passed:true};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({suite:report.suite,checks,cases:cases.length,passed:true}));
