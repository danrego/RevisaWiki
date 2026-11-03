'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false},talk={...cfg,namespaceNumber:1,pageTitle:'Discussão:Exemplo'};
let checks=0,calculations=0;const failures=[],rows=[];
function eq(a,b,label){checks++;try{assert.deepEqual(a,b,label);}catch(e){failures.push({label,actual:a,expected:b});}}
function integrated(source,options,assertion){const r=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;
 eq(api.v219AutomaticResultSafety(source,r).accepted,true,'The whole candidate has a source-bound preservation certificate');
 eq(r.preservation,[],'No preservation check is weakened or waived');assertion(r.text,r);
 const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options});calculations++;
 eq(again.text,r.text,'The full result is idempotent');rows.push({sourceSha256:sha(source),candidateSha256:sha(r.text)});return r;}
const aliases=['PD','pd','pD','Pd','Cabeçalho de discussão','cabeçalho de discussão','Página de discussão','página de discussão','PW-Alvo','BPV','Bpv','Coisas a não fazer','Discussão de portal','Página de discussão/Arquivo 1','Portais-aviso'];
for(const name of aliases){
 const source='{{'+name+'}}\n{{PD}}\n{{Marca de projeto|?|Ciência|?}}\n== Conversa ==\nTexto inalterado. ~~~~';
 const plan=api.v2215PdPlan(source,talk),expected='{{PD}}\n{{Marca de projeto|?|Ciência|?}}\n== Conversa ==\nTexto inalterado. ~~~~';
 eq(plan.text,expected,'Verified native alias is canonicalized and deduplicated: '+name);
 eq(api.v2215PdProof(source,expected,plan,talk),true,'The exact PD edit list is independently rederived');
 eq(api.v2215PdProof(source,expected+' ',plan,talk),false,'An altered discussion body is refused');
 integrated(source,talk,text=>eq(text,expected,'The complete automatic action retains a single banner at the top'));
}
for(const source of ['{{PD}}{{pd}}\nTexto','{{PD}}\n== Conversa ==\nTexto\n{{Página de discussão}}','\n \n{{pd}}\r\n{{PD}}\r\nTexto']){
 integrated(source,talk,text=>{eq(text.startsWith('{{PD}}'),true,'The canonical header is first');eq((text.match(/\{\{PD\}\}/g)||[]).length,1,'Only one active canonical banner remains');});
}
const pdControls=[
 '{{PD|aviso=primeiro}}\n{{Página de discussão|aviso=segundo}}\nTexto',
 '<nowiki>{{PD}}{{pd}}</nowiki>',
 '<syntaxhighlight lang="wikitext">{{PD}}\n{{pd}}</syntaxhighlight>',
 '<!--{{PD}} {{pd}}-->',
 ':{{PD}}\n*{{pd}}',
 '{{Exemplo|{{PD}}|{{pd}}}}',
 '{{Página De Discussão}}\nTexto',
 '{{página de discussão incorreta}}',
 '{|\n| {{PD}}\n| {{pd}}\n|}',
 'Menciona {{PD}} no meio da frase.',
 '<blockquote>{{PD}}\n{{pd}}</blockquote>'
];
for(const source of pdControls)eq(api.v2215PdPlan(source,talk).text,source,'Parameters, examples, misspellings and quoted/nested banners are retained');
for(const delta of [{namespaceNumber:0},{namespaceNumber:2},{sectionOnly:true},{section:'1'},{contentModel:'javascript'},{auxiliaryTemplates:false},{pageRedirect:true}])eq(api.v2215PdPlan('{{PD}}\n{{pd}}',{...talk,...delta}).text,'{{PD}}\n{{pd}}','Discussion scope is explicit');
const prep=api.v25TalkPreparationPlan('{{Página de discussão}}\n{{PD}}\nTexto','{{Portal3|Física|Ciência}}',talk);
eq(prep.source,'{{Página de discussão}}\n{{PD}}\nTexto','Create code preserves the original input identity');eq(prep.text.startsWith('{{PD}}\n'),true,'Create code shares the same canonicalization');eq((prep.text.match(/\{\{PD\}\}/g)||[]).length,1,'Create code cannot duplicate the banner');
for(const prefix of ['Image','File','image','FILE','Imagem','Arquivo','Ficheiro'])for(const flag of ['thumb','thumbnail','miniaturadaimagem']){
 const source='[['+prefix+':Example.jpg|'+flag+'|230px|alt=Descrição alternativa|link=Exemplo|Legenda com [[Exemplo|ligação]].]]',
  expected='[['+(/^(image|file)$/i.test(prefix)?'Imagem':prefix)+':Example.jpg|miniatura|230px|alt=Descrição alternativa|link=Exemplo|Legenda com [[Exemplo|ligação]].]]',plan=api.v2215AliasPlan(source,cfg);
 eq(plan.text,expected,'Only image namespace and thumbnail syntax are localized');eq(api.v2215AliasProof(source,expected,plan,cfg),true,'Image syntax plan is rederived');
 integrated(source,cfg,text=>eq(text,expected,'Caption, dimensions, alternate text and link target remain exact'));
}
for(const source of ['<nowiki>[[Image:Example.jpg|thumb|Caption]]</nowiki>','<syntaxhighlight>[[Image:Example.jpg|thumb|Caption]]</syntaxhighlight>','<!--[[Image:Example.jpg|thumb|Caption]]-->','{{Uncertified|[[Image:Example.jpg|thumb|Caption]]}}','[[:Image:Example.jpg|thumb]]','[[Image:Unclosed.jpg|thumb','[[Image:Example.jpg|Caption with thumb inside]]']){
 const p=api.v2215AliasPlan(source,cfg);
 if(source==='[[Image:Example.jpg|Caption with thumb inside]]')eq(p.text,'[[Imagem:Example.jpg|Caption with thumb inside]]','A word inside a caption is never replaced');
 else eq(p.text,source,'Image example, link or incomplete object is preserved');
}
const fields={title:['título','Título de teste'],date:['data','8 February 2003'],'access-date':['acessodata','2005-01-02'],publisher:['publicado','Editora de teste'],website:['obra','Site de teste'],language:['língua','en'],year:['ano','2003'],page:['página','5'],pages:['páginas','5–8'],last:['ultimo','Sobrenome'],first:['primeiro','Nome'],author:['autor','Nome completo'],'archive-url':['arquivourl','https://example.org/arquivo'],'archive-date':['arquivodata','2005-01-02']};
for(const [key,[target,value]]of Object.entries(fields)){
 const source='{{Citar web|'+key+'= '+value+'|url=https://example.org}}',plan=api.v2215AliasPlan(source,cfg);
 eq(plan.text,'{{Citar web|'+target+'='+(key==='date'?'8 de fevereiro de 2003':value)+'|url=https://example.org}}','An accepted English citation alias is localized: '+key);
 eq(api.v2215AliasProof(source,plan.text,plan,cfg),true,'Citation alias and padding plan is rederived');
 integrated(source,cfg,text=>{eq(text.includes('|'+target+'='),true,'The Portuguese key reaches the complete result');eq(text.includes('https://example.org'),true,'The supplied URL remains intact');});
}
for(const key of ['last','first','author'])for(const n of ['1','2','12']){
 const target={last:'ultimo',first:'primeiro',author:'autor'}[key]+n,source='{{Citar web|'+key+n+'=Nome de teste|title=T}}';
 eq(api.v2215AliasPlan(source,cfg).text.includes('|'+target+'='),true,'Numbered names keep their supplied index');
}
for(const source of ['{{Citar web|title=Inglês|titulo=Português|url=https://example.org}}','{{Citar web|last=Um|ultimo=Outro}}','{{Citar web|website=A|work=B}}','{{Citar web|title=A|title=B}}']){
 const plan=api.v2215AliasPlan(source,cfg);eq(plan.text,source,'Competing alias precedence is not changed');
}
for(const source of ['{{Uncertified|title= T|date= 8 February 2003}}','<nowiki>{{Citar web|title= T}}</nowiki>','<pre>{{Info/Biografia|nome= Pessoa}}</pre>','{{#if:1|title= T}}','{{Exemplo|{{Citar web|title= T}}}}'])eq(api.v2215AliasPlan(source,cfg).text,source,'Opaque owners and source examples are retained');
integrated('{{Info/Biografia\n |nome = Pessoa de teste\n |website = https://example.org\n |imagem_legenda = Legenda exata\n}}',cfg,text=>{eq(text.includes('=Pessoa de teste'),true,'Named argument horizontal padding is removed');eq(text.includes('|site'),true,'A verified native website alias is localized');eq(text.includes('=Legenda exata'),true,'Caption bytes are retained after padding');});
const collision='{{Info/Biografia|website=https://example.org/a|site=https://example.org/b}}';eq(api.v2215AliasPlan(collision,cfg).text,collision,'Website alias precedence remains untouched');
const disabled='{{Citar web|title=T}}';eq(api.v2215AliasPlan(disabled,{...cfg,automaticParameterNames:false}).text,disabled,'Key preference honors its switch');eq(api.v2215AliasPlan(disabled,{...cfg,citations:false}).text,disabled,'Disabled citations are preserved');

for(const [value,expected]of [['8 February 2003','8 de fevereiro de 2003'],['February 8, 2003','8 de fevereiro de 2003'],['2003-02-08','2003-02-08'],['31 February 2003','31 February 2003'],['03/04/2003','03/04/2003']]){
 const source='{{cite web|date='+value+'|accessdate=22 February 2014|archive-date=17 February 2019|url=https://example.org/a|archive-url=https://example.org/archive|url-status=dead|title=T}}',plan=api.v2215AliasPlan(source,cfg);
 eq(plan.text.includes('|data='+expected+'|'),true,'Date normalization retains calendar validity and precision');
 integrated(source,cfg,text=>{eq(text.includes('https://example.org/a'),true,'The original URL is retained');eq(text.includes('https://example.org/archive'),true,'The archive URL is retained');eq(text.includes('17 de fevereiro de 2019'),true,'The complete archive date is retained');});
}
const dated='{{cite web|date=8 February 2003|title=T}}';eq(api.v2215AliasPlan(dated,{...cfg,dates:false}).text.includes('8 February 2003'),true,'Date conversion respects its independent switch');


for(const namespaceNumber of [1,3,5,7,9,11,15,101])eq(api.v2215PdPlan('{{pd}}\n{{PD}}',{...talk,namespaceNumber}).text,'{{PD}}\n','Every full discussion namespace shares the banner normalizer');
for(const prefix of ['Predefinição:','Template:','PRE:'])eq(api.v2215PdPlan('{{'+prefix+'PD}}\n{{pd}}',talk).text,'{{PD}}\n','A verified template namespace alias is accepted');
eq(api.v2215PdPlan('#REDIRECIONAMENTO [[Discussão:Destino]]\n{{PD}}\n{{pd}}',talk).edits.length,0,'A literal redirect is never converted into a normal discussion');
const noMarkupKeys=api.v2215AliasPlan('{{cite web|title=T|date=8 February 2003}}',{...cfg,markup:false});
eq(noMarkupKeys.text,'{{cite web|título=T|data=8 de fevereiro de 2003}}','Citation keys and dates remain independent of the markup family');
for(const [source,options,expected]of [
 ['[[Image:Example.jpg|thumb|Caption]]',cfg,2],
 ['{{Citar web|title= T|date= 8 February 2003|publisher= P}}',cfg,7],
 ['{{PD}}\n{{pd}}\nTexto',talk,1]]){
 const r=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;
 const count=api.v211RetainedAdjustments(source,r.text,r.changes.map(x=>x.id),options);
 eq(count.exact,true,'The applied count is exact');eq(count.count,expected,'Every retained syntax operation is counted');
}


const portalAliases={danse:'Dança',Belgique:'Bélgica','Segunda Gerra Mundial':'Segunda Guerra Mundial','Fármacia':'Farmácia',Lietratura:'Literatura'};
for(const [from,to]of Object.entries(portalAliases))for(const template of ['Portal','Portal3']){
 const source='{{'+template+'| '+from+' |Ciência}}',expected='{{'+template+'| '+to+' |Ciência}}',plan=api.v2215AliasPlan(source,cfg);
 eq(plan.text,expected,'A literal certified portal spelling receives its exact native destination');
 eq(api.v2215AliasProof(source,expected,plan,cfg),true,'Portal alias proof is rederived');
 integrated(source,cfg,text=>eq(text.includes(to),true,'The full automatic action retains the intended portal'));
}
for(const source of ['{{Portal3|nome=Lietratura}}','{{Portal3|Lietratura extra}}','{{Portal3|{{Exemplo|Lietratura}}}}','{{Exemplo|{{Portal3|Lietratura}}}}','<nowiki>{{Portal3|Lietratura}}</nowiki>','<!--{{Portal3|Lietratura}}-->'])eq(api.v2215AliasPlan(source,cfg).text,source,'No portal spelling is guessed in names, nested calls or source examples');
eq(api.v2215AliasPlan('{{Portal3|Lietratura}}',{...cfg,portals:false}).text,'{{Portal3|Lietratura}}','Portal aliases honor their independent option');


for(const source of ['{{PD|aviso=valor}}\n{{Página de discussão}}\nTexto','{{pd}}\n{{Página de discussão|aviso=valor}}\n{{PD|aviso=valor}}\nTexto']){
 const plan=api.v2215PdPlan(source,talk);
 eq(plan.text,'{{PD|aviso=valor}}\nTexto','One configured banner keeps every argument while plain and identical peers are removed');
 integrated(source,talk,text=>eq(text,plan.text,'Configured banner deduplication reaches the full candidate'));
}

const receipt={suite:'native-alias-and-discussion-canonicalization-2.21.5',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'All aliases and preservation controls pass');
