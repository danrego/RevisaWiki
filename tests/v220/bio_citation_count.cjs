'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const a=require(process.env.REVISAWIKI_BUNDLE||path.resolve(__dirname,'../../dist/2.20.0/RevisaWiki_v2_20_0_completo.js'));
const cfg={...a.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',authorityControl:false,autoPreview:false,automaticBiographyPortals:false,automaticTopicPortals:false};
let checks=0,cases=0;
const book=(id='',extra='')=>'{{Citar livro|titulo=Título '+id+' | Ciência em foco |páginas-total=342'+extra+'}}';
const fixed=(id='',extra='')=>'{{Citar livro|titulo=Título '+id+' {{!}} Ciência em foco |total-páginas=342'+extra+'}}';
const article=raw=>'Um fato.<ref>'+raw+'</ref>\n\n{{Referências}}';
const metadata=(before,after,options=cfg)=>a.v219UIPresentationMetadata({source:after,originalSource:before,presentationKinds:['syntax'],options}).presentation.retained;
function positive(id,source,expected,count,options=cfg){cases++;const r=a.calculate({kind:'adjust',source,originalSource:source,options}),p=metadata(source,r.text,options);
 assert.equal(r.text,expected,id+' endpoint escrito pelo contrato');checks++;
 assert(a.v219AutomaticResultSafety(source,r).accepted,id+' guardas');checks++;
 assert.equal(p.count,count,id+' número exibido');checks++;assert.equal(p.exact,true,id+' exatidão');checks++;
 assert.equal(p.events.length,count,id+' componentes mantidos');checks++;assert.equal(p.text,count+' '+(count===1?'ajuste aplicado':'ajustes aplicados'),id+' texto exibido');checks++;
 const again=a.calculate({kind:'adjust',source:r.text,originalSource:r.text,options});assert.equal(again.text,r.text,id+' estável');checks++;assert.equal(metadata(r.text,again.text,options).count,0,id+' não soma ações anteriores');checks++;
 return {r,p};}
const pair=positive('pipe e nome do parâmetro',article(book()),article(fixed()),2);
positive('outro campo com valor igual',article(book('','|volume=342')),article(fixed('','|volume=342')),2);
positive('valor próprio por referência',article(book('A'))+'\n'+article(book('B').replace('342','200')),article(fixed('A'))+'\n'+article(fixed('B').replace('342','200')),4);
const oldExtra='|layurl=https://example.invalid/resumo|laysource=Publicação|laydate=2024',newExtra='|lay-url=https://example.invalid/resumo|resumo-fonte=Publicação|resumo-data=2024';
positive('cinco operações independentes',article(book('A',oldExtra)),article(fixed('A',newExtra)),5);
positive('duas referências com cinco operações',article(book('A',oldExtra))+'\n'+article(book('B',oldExtra)),article(fixed('A',newExtra))+'\n'+article(fixed('B',newExtra)),10);
positive('dois nomes e valores iguais em chamadas distintas',article(book())+' Outro.<ref>'+book()+'</ref>',article(fixed())+' Outro.<ref>'+fixed()+'</ref>',4);
positive('apenas o nome, sem pipe',article('{{Citar livro|titulo=Obra|páginas-total=342}}'),article('{{Citar livro|titulo=Obra|total-páginas=342}}'),1);
positive('apenas pipe',article('{{Citar livro|titulo=Título | Ciência em foco }}'),article('{{Citar livro|titulo=Título {{!}} Ciência em foco }}'),1);
cases++;const duplicateSource=article(book('','|páginas-total=342')),duplicateTarget=article(fixed());assert(!metadata(duplicateSource,duplicateTarget).events.some(e=>e.countProof?.kind==='v220-composed-native-total-pages'),'nenhuma prova de par com nomes duplicados na origem');checks++;
const duplicateAction=a.calculate({kind:'adjust',source:duplicateSource,originalSource:duplicateSource,options:cfg}),duplicateUI=metadata(duplicateSource,duplicateAction.text);assert.equal(duplicateAction.text,duplicateTarget,'limpeza herdada mantém um único valor idêntico');checks++;assert(a.v219AutomaticResultSafety(duplicateSource,duplicateAction).accepted,'ação de duplicado ainda passa pelas guardas');checks++;assert.equal(duplicateUI.count,null,'duplicado sem contagem numérica falsa');checks++;assert.equal(duplicateUI.exact,false,'duplicado mantém incerteza explícita');checks++;assert.equal(duplicateUI.text,'Ajustes aplicados, confira a comparação','duplicado sem número no texto exibido');checks++;
for(const key of ['citations','citationRepairs','automaticParameterNames']){cases++;const options={...cfg,[key]:false},r=a.calculate({kind:'adjust',source:article(book()),originalSource:article(book()),options}),p=metadata(article(book()),r.text,options);assert(!p.events.some(e=>e.countProof?.kind==='v220-composed-native-total-pages'),key+' desligado');checks++;}
for(const [id,source,target]of [
 ['destino alterado',article(book()),article(fixed().replace('Ciência em foco','Outro texto'))],
 ['origem alterada',article(book().replace('342','200')),article(fixed())],
 ['outro campo alterado',article(book('','|volume=342')),article(fixed('','|volume=200'))]
]){cases++;const p=metadata(source,target);assert(!p.events.some(e=>e.countProof?.kind==='v220-composed-native-total-pages'),id+' não certifica par adulterado');checks++;assert(p.count!==2||p.exact!==true,id+' sem falsa precisão de duas operações');checks++;}
const legacy=Array.from({length:12},(_,i)=>'<ref>{{Citar livro|titulo=Obra '+i+'|laydate=2024}}</ref>').join(' '),legacyExpected=legacy.replaceAll('laydate=','resumo-data=');positive('doze campos herdados sem pipe',legacy+'\n\n{{Referências}}',legacyExpected+'\n\n{{Referências}}',12);
const merged=pair.p.events.find(e=>e.countProof);assert(merged,'prova do nome completo');checks++;assert.equal(merged.before,'páginas-total');checks++;assert.equal(merged.after,'total-páginas');checks++;assert(merged.fragments.length>=2);checks++;
console.log(JSON.stringify({suite:'v220-composed-citation-count',status:'passed',cases,checks}));
