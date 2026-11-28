'use strict';
const assert=require('node:assert/strict');

function run(api){
 const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-11-21'};
 const rows=[];let checks=0,calculations=0;
 const eq=(a,b,m)=>{checks++;assert.equal(a,b,m);},ok=(a,m)=>{checks++;assert(a,m);};
 const adjust=(source,options=cfg)=>{calculations++;return api.calculate({kind:'adjust',source,originalSource:source,options});};
 const finish=body=>body+'\n\n{{Referências}}\n';
 function endpoint(id,source,expected,count,options=cfg){
  const result=adjust(source,options);eq(result.text,expected,id+' complete authored endpoint');
  eq(adjust(result.text,options).text,result.text,id+' second application is stable');
  eq(api.preservationAudit(source,result.text,options).length,0,id+' independent preservation audit');
  eq(api.safeComposition(source,result.text,options),'',id+' independent composition');
  ok(api.v219AutomaticResultSafety(source,result).accepted,id+' actual automatic result safety');
  calculations++;const counted=api.calculate({kind:'final-count',source:result.text,originalSource:source,options});
  eq(counted.text,result.text,id+' counting never changes text');ok(counted.retainedAdjustments?.exact,id+' exact final count');
  if(count!==null)eq(counted.retainedAdjustments.count,count,id+' authored adjustment count');
  rows.push({id,passed:true,count:counted.retainedAdjustments.count});
 }
 const broken='{{Citar periódico|titulo=Artigo|jornal=Revista|ano=2000}}';
 const fixed='{{Citar periódico|título=Artigo|obra=Revista|ano=2000}}';
 const plain=finish('Trecho preservado".<ref name="fonte">'+broken+'</ref> Outra frase cita "outro valor".');
 endpoint('active-native-reference-after-closing-prose-quote',plain,plain.replace(broken,fixed),2);

 const a='{{Citar periódico|titulo=Artigo A|jornal=Revista A|ano=2000}}';
 const b='{{Citar periódico|titulo=Artigo B|jornal=Revista B|ano=2001}}';
 const c='{{Citar periódico|titulo=Artigo C|jornal=Revista C|ano=2002}}';
 const book='{{Citar livro|título=Livro|publicação=Editora|língua=en|ano=2000}}';
 const before=finish('Primeiro resultado.<ref name="a">'+a+'</ref>\n\nSegundo resultado.<ref name="b">'+b+'</ref>\n\nTerceiro resultado.<ref name="c">'+c+'</ref>\n\nUm livro.<ref>'+book+'</ref>\n\nOutra afirmação".<ref name="a">'+a+'</ref> A frase cita "outro valor".\n\nMais uma afirmação".<ref name="b">'+b+'</ref> Segue "outro valor".\n\nUma última afirmação".<ref name="c">'+c+'</ref> Aparece "outro valor".');
 const after=finish('Primeiro resultado.<ref name="a">{{Citar periódico|título=Artigo A|obra=Revista A|ano=2000}}</ref>\n\nSegundo resultado.<ref name="b">{{Citar periódico|título=Artigo B|obra=Revista B|ano=2001}}</ref>\n\nTerceiro resultado.<ref name="c">{{Citar periódico|título=Artigo C|obra=Revista C|ano=2002}}</ref>\n\nUm livro.<ref>'+book+'</ref>\n\nOutra afirmação".<ref name="a" /> A frase cita "outro valor".\n\nMais uma afirmação".<ref name="b" /> Segue "outro valor".\n\nUma última afirmação".<ref name="c" /> Aparece "outro valor".');
 endpoint('three-named-families-and-unchanged-native-book-language',before,after,9);
 for(const title of ['title','titulo'])for(const parent of ['Modelo sem contrato','Programa']){
  const protectedBody='{{Citar web|url=https://example.invalid/a|'+title+'=Fonte}}';
  const active='{{Citar web|url=https://example.invalid/b|'+title+'=Segunda fonte}}';
  const source=finish('Texto.<ref name="a">'+protectedBody+'</ref>\n\n{{'+parent+'|exemplo=<ref name="a">'+protectedBody+'</ref>}}\n\nOutra fonte.<ref>'+active+'</ref>');
  endpoint('protected-peer-does-not-block-independent-'+parent+'-'+title,source,source.replace(active,active.replace('|'+title+'=','|título=')),1);
 }
 const ref='<ref name="fonte">'+broken+'</ref>';
 const quotations=[['double','"Texto '+ref+' final"'],['curly','“Texto '+ref+' final”'],['guillemet','«Texto '+ref+' final»'],['emphasis','\'\'"Texto '+ref+' final"\'\''],['around-literal','"Texto <nowiki>"</nowiki> '+ref+' final"']];
 for(const[id,body]of quotations){
  const source=finish(body),result=adjust(source);ok(result.text.includes(body),id+' genuine quotation is retained exactly');
  ok(!result.text.includes(fixed),id+' quoted native-looking citation is not normalized');
  eq(api.v2222CitationOwnerScope(source,cfg).eligible.length,0,id+' quotation remains protected');
  rows.push({id:'preserve-genuine-quotation-'+id,passed:true,negative:true});
 }
 for(const[owner,open,close]of [['nowiki','<nowiki>','</nowiki>'],['pre','<pre>','</pre>'],['code','<code>','</code>'],['syntaxhighlight','<syntaxhighlight lang="text">','</syntaxhighlight>'],['source','<source lang="text">','</source>'],['comment','<!--','-->'],['math','<math>','</math>'],['chem','<chem>','</chem>'],['score','<score>','</score>'],['blockquote','<blockquote>','</blockquote>']]){
  const body=open+'" '+ref+' '+close,source=finish(body),result=adjust(source);
  ok(result.text.includes(body),owner+' complete opaque owner bytes retained');
  ok(!result.text.includes(fixed),owner+' citation-like program is not normalized');
  rows.push({id:'preserve-opaque-owner-'+owner,passed:true,negative:true});
 }
 for(const contentModel of ['javascript','css','json','Scribunto']){
  const source='const example = "'+ref.replaceAll('"','\\"')+'";';
  const result=adjust(source,{...cfg,contentModel});eq(result.text,source,contentModel+' declared non-wikitext input remains exact');
  rows.push({id:'declared-content-model-'+contentModel,passed:true,negative:true});
 }
 const disabled=adjust(plain,{...cfg,citations:false});ok(disabled.text.includes(broken),'disabled citation normalization remains disabled');
 rows.push({id:'disabled-citation-option',passed:true,negative:true});
 return{suite:'native-reference-quote-flow-and-independent-family-repairs',version:api.version,status:'passed',cases:rows.length,checks,calculations,negativeCases:rows.filter(r=>r.negative).length,rows,sourceGuardExemptionsAdded:0,networkRequests:0,wikipediaWrites:0};
}
module.exports={run};
if(require.main===module)console.log(JSON.stringify(run(require('./harness.cjs').load())));
