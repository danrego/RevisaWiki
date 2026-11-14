'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');const {api,cfg,file,sourceSha}=require('./harness.cjs');let checks=0;const cases=[];
function eq(a,b,m){checks++;assert.equal(a,b,m);}
function test(id,source,expected,options={}){
 const settings={...cfg,...options},plan=api.v222TalkFooterPlan(source,settings);eq(plan.text,expected,id);eq(api.v222TalkFooterProof(source,plan.text,plan,settings),true,id+' proof');eq(api.v222TalkFooterPlan(plan.text,settings).text,plan.text,id+' idempotence');eq(api.v222TalkFooterProof(source,plan.text,{...plan,sourceHash:'tampered'},settings),false,id+' tamper');eq(api.v222TalkFooterProof(source,plan.text,{...plan,edits:[{start:0,end:source.length+1,text:''}]},settings),false,id+' bad spans');cases.push({id,changed:source!==plan.text,count:plan.edits.reduce((n,e)=>n+e.count,0)});return plan;
}
const talk={namespaceNumber:1,pageTitle:'Discussão:Exemplo',discussionPage:true};
test('quoted-x-first-only','{{Marca de projeto|"x"|Mulheres|3}}','{{Marca de projeto|?|Mulheres|3}}',talk);
test('bare-x-first-only','{{Marca de projeto|x|Mulheres|3}}','{{Marca de projeto|?|Mulheres|3}}',talk);
test('padded-x-keeps-padding','{{Marca de projeto| x |Mulheres|3|rev=20260101}}','{{Marca de projeto| ? |Mulheres|3|rev=20260101}}',talk);
test('named-first-x','{{Marca de projeto|1="x"|2=Mulheres|3=3}}','{{Marca de projeto|1=?|2=Mulheres|3=3}}',talk);
for(const quality of ['?','1','2','3','4','5','6','AB','AD','"3"','X','desconhecida','']){const s='{{Marca de projeto|'+quality+'|Mulheres|3}}';test('assessment-preserved-'+quality,s,s,talk);}
for(const s of ['{{Marca de projeto|x|Mulheres|3|qualidade=3}}','{{Marca de projeto|x|1=3|Mulheres|3}}','{{Marca de projeto|{{Valor}}|Mulheres|3}}','{{Marca de projeto|x|Mulheres|3|bot=sim}}','<nowiki>{{Marca de projeto|x|Mulheres|3}}</nowiki>','Texto {{Marca de projeto|x|Mulheres|3}} segue.'])test('assessment-held-'+cases.length,s,s,talk);
const ordered='{{PD}}\n{{Marca de projeto|3|Mulheres|3|rev=20260101}}\n{{Traduzido|en|Example|oldid=123|data=2026-01-02}}\n{{OKA|exemplo}}';
test('metadata-order','{{OKA|exemplo}}\n{{Traduzido|en|Example|oldid=123|data=2026-01-02}}\n{{Marca de projeto|3|Mulheres|3|rev=20260101}}\n{{PD}}',ordered,talk);
test('metadata-one-per-line','{{PD}}{{Marca de projeto|?|Mulheres|3}}{{Traduzido|en|Example}}{{OKA}}','{{PD}}\n{{Marca de projeto|?|Mulheres|3}}\n{{Traduzido|en|Example}}\n{{OKA}}',talk);
test('pd-alias','{{Página de discussão}}\n{{Marca de projeto|?|Mulheres|3}}','{{PD}}\n{{Marca de projeto|?|Mulheres|3}}',talk);
test('conversation-remains-byte-exact','{{Traduzido|en|Example}}\n{{PD}}\n\n== Assunto ==\nMensagem. --~~~~\n<!-- comentário -->','{{PD}}\n{{Traduzido|en|Example}}\n\n== Assunto ==\nMensagem. --~~~~\n<!-- comentário -->',talk);
for(const s of ['<!-- comentário -->\n{{Traduzido|en|Example}}\n{{PD}}','Assinatura ~~~~\n{{Traduzido|en|Example}}\n{{PD}}','{{Traduzido|en|Example}}\n<!-- limite -->\n{{PD}}','{{Traduzido|en|Example}}\n{{Aviso desconhecido}}\n{{PD}}'])test('ordering-boundary-'+cases.length,s,s,talk);
test('authority-autoria-alias','{{Controlo de autoria|VIAF=123|WORLDCATID=456}}','{{Controle de autoridade|VIAF=123|WORLDCATID=456}}');
test('authority-argument-preservation','{{Controlo de autoria\n|VIAF=00123\n|mostrar=não\n}}','{{Controle de autoridade\n|VIAF=00123\n|mostrar=não\n}}');
test('distinct-parameters-retained','{{Controle de autoridade|VIAF=123}}\n{{Controlo de autoria|VIAF=456}}','{{Controle de autoridade|VIAF=123}}\n{{Controle de autoridade|VIAF=456}}');
test('identical-authority-dedup','{{Controle de autoridade|VIAF=123}}\n{{Controlo de autoria|VIAF=123}}','{{Controle de autoridade|VIAF=123}}\n');
for(const s of ['{{NM|Exemplo|Outro|Chave}}','{{NF|Exemplo|Outro|Chave}}','<nowiki>{{Controlo de autoria}}</nowiki>','Texto {{Controlo de autoria}}.'])test('authority-preserved-'+cases.length,s,s);
const footer={footerProfiles:{'Navegação exemplo':'navbox','navegação exemplo':'navbox'}};
test('taxonbar-native-footer-order','{{Taxonbar|from=Q1}}\n{{Navegação exemplo}}\n{{Portal3|Ciência}}','{{Navegação exemplo}}\n{{Taxonbar|from=Q1}}\n{{Portal3|Ciência}}',footer);
test('authority-native-footer-order','{{Portal3|Ciência}}\n{{Navegação exemplo}}\n{{Controlo de autoria|VIAF=123}}','{{Navegação exemplo}}\n{{Controle de autoridade|VIAF=123}}\n{{Portal3|Ciência}}',footer);
test('authority-and-taxonbar-distinct','{{Portal3|Ciência}}\n{{Taxonbar|from=Q1}}\n{{Controle de autoridade|VIAF=123}}','{{Taxonbar|from=Q1}}\n{{Controle de autoridade|VIAF=123}}\n{{Portal3|Ciência}}');
for(const s of ['{{Taxonbar|from=Q1}}\nTexto.\n{{Portal3|Ciência}}','{{Taxonbar|from=Q1}}\n{{Navegação desconhecida}}\n{{Portal3|Ciência}}','{{Portal3|Ciência}}\n{{Taxonbar|from=Q1}}\n{{NM|A|B|Chave}}'])test('footer-boundary-'+cases.length,s,s,footer);
test('correlatos-section-start','== Ver também ==\n* Tema.\n{{Correlatos}}\n\n== Referências ==\n{{Referências}}','== Ver também ==\n{{Correlatos}}\n* Tema.\n\n== Referências ==\n{{Referências}}');
for(const box of ['{{Correlatos|título=Tema fictício|commonscat=Example}}','{{Commonscat|Example}}'])test('literal-sister-section-start-'+cases.length,'== Ver também ==\n* Item anterior.\n'+box+'\nTexto posterior.','== Ver também ==\n'+box+'\n* Item anterior.\nTexto posterior.');
for(const box of ['{{Correlatos|título=<h2>Outra seção</h2>|commonscat=Example}}','{{Correlatos|título=<div>Outro título|commonscat=Example}}','{{Correlatos|título=<span>Título</span>|commonscat=Example}}','{{Correlatos|título=\n=== Outra seção ===\n|commonscat=Example}}','{{Correlatos|título={{Nome dinâmico}}|commonscat=Example}}','{{Correlatos|título=__TOC__|commonscat=Example}}','{{Commonscat|Example|<h2>Outra seção</h2>}}']){const s='== Ver também ==\n* Item anterior.\n'+box+'\nTexto posterior.';test('sister-structural-value-preserved-'+cases.length,s,s);}
for(const middle of ['<h3>Outra seção</h3>\n','<div>Conteúdo\n','{{Widget desconhecido}}\n','{{Commonscat|Example|<h2>Outra seção</h2>}}\n']){const s='== Ver também ==\n* Item anterior.\n'+middle+'{{Correlatos}}\nTexto posterior.';test('sister-dependent-section-preserved-'+cases.length,s,s);}
const localSisterDecline='== Ver também ==\n* Item anterior.\n{{Correlatos|título=<h2>Outra seção</h2>|commonscat=Example}}\nTexto posterior.\n\n{{Controlo de autoria|VIAF=00123}}';
test('sister-decline-keeps-independent-authority',localSisterDecline,localSisterDecline.replace('Controlo de autoria','Controle de autoridade'));
for(const options of [{namespaceNumber:10},{sectionOnly:true},{pageRedirect:true},{contentModel:'javascript'}])test('scope-negative-'+cases.length,'{{Controlo de autoria}}','{{Controlo de autoria}}',options);
test('auxiliary-option-off','{{Marca de projeto|x|Mulheres|3}}','{{Marca de projeto|x|Mulheres|3}}',{...talk,auxiliaryTemplates:false});
test('end-matter-option-off','{{Controlo de autoria}}','{{Controlo de autoria}}',{endMatter:false});
test('authority-option-off','{{Portal3|Ciência}}\n{{Controlo de autoria}}','{{Portal3|Ciência}}\n{{Controlo de autoria}}',{authorityControl:false});
const emptyExternal=test('final-empty-canonical-external-heading','Texto.\n== Ligações externas ==\n{{Portal3|Ciência}}\n','Texto.\n{{Portal3|Ciência}}\n');eq(emptyExternal.edits[0].count,1,'one actual empty heading removal');
test('final-empty-external-heading-only','Texto.\n== Ligações externas ==\n','Texto.\n');
test('final-empty-external-heading-native-metadata','Texto.\n== Ligações externas ==\n{{Controle de autoridade}}\n{{Portal3|Ciência}}\n[[Categoria:Tema]]\n','Texto.\n{{Controle de autoridade}}\n{{Portal3|Ciência}}\n[[Categoria:Tema]]\n');
test('final-empty-external-heading-crlf','Texto.\r\n== Ligações externas ==\r\n{{Portal3|Ciência}}\r\n','Texto.\r\n{{Portal3|Ciência}}\r\n');
test('final-empty-external-heading-draft','Texto.\n== Ligações externas ==\n{{Portal3|Ciência}}\n','Texto.\n{{Portal3|Ciência}}\n',{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'});
for(const body of ['<!-- manter -->\n{{Portal3|Ciência}}','* [https://example.org Ligação]','[[Tema]]','{{Modelo desconhecido}}','{{Portal3|{{Nome}}}}','<div>{{Portal3|Ciência}}</div>','=== Subtítulo ===\n{{Portal3|Ciência}}']){const s='Texto.\n== Ligações externas ==\n'+body+'\n';test('empty-external-heading-content-held-'+cases.length,s,s);}
for(const heading of ['Ligações externas úteis','Links externos','Leitura adicional']){const s='Texto.\n== '+heading+' ==\n{{Portal3|Ciência}}\n';test('empty-external-heading-title-held-'+cases.length,s,s);}
const linkedEmptyHeading='Veja [[#Ligações externas]].\n== Ligações externas ==\n{{Portal3|Ciência}}\n';test('empty-external-heading-anchor-held',linkedEmptyHeading,linkedEmptyHeading);
test('empty-external-heading-draft-anchor-held',linkedEmptyHeading,linkedEmptyHeading,{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'});
test('empty-external-heading-independent-of-biography-option','Texto.\n== Ligações externas ==\n{{Portal3|Ciência}}\n','Texto.\n{{Portal3|Ciência}}\n',{automaticBiographyFields:false});
for(const options of [{headings:false},{endMatter:false},{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/PU'}]){const s='Texto.\n== Ligações externas ==\n{{Portal3|Ciência}}\n';test('empty-external-heading-option-held-'+cases.length,s,s,options);}
eq(api.v222TalkFooterProof('','',null,cfg),false,'null proof');
const report={suite:'v2220-talk-footer',runtime:file,runtimeSha256:sourceSha,checks,cases:cases.length,results:cases,passed:true};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,checks,cases:cases.length,passed:true}));
