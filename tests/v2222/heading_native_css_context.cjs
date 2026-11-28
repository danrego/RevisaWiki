'use strict';
const assert=require('node:assert/strict');
function run(api){
 const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};
 const cite='{{Citar web|url=https://example.org/a|titulo=Fonte|data=18 de novembro 2014|lingua=english}}';
 const tail='\nTexto.<ref>'+cite+'</ref>\n\n== Contexto <small>geral</small> ==\nTexto.\n\n{{Referências|col=2}}',rows=[];
 let checks=0,calculations=0;const ok=(x,m)=>{checks++;assert(x,m);},eq=(x,y,m)=>{checks++;assert.equal(x,y,m);};
 const adjust=source=>{calculations++;return api.calculate({kind:'adjust',source,originalSource:source,options:cfg});};
 for(const key of ['estilo','título-estilo','cabeçalho-estilo','imagem-estilo','tópico-estilo'])for(const property of ['color','background-color','background','border-color'])for(const layout of ['inline','multiline']){
  const field=property+':#F4BF92;',source=(layout==='inline'?'{{Info|título=Exemplo|'+key+'='+field+'}}':'{{Info\n | título           = Exemplo\n | '+key+'    = '+field+'\n}}')+tail,id=key+':'+property+':'+layout;
  eq(api.v2222HeadingNativeColourView(source),source.replace('#F4BF92',' F4BF92'),id+' masks only the native CSS hash in the read-only view');
  eq(api.v2217HeadingInventory(source,cfg).active,false,id+' no invented local section consumer');
  const result=adjust(source);ok(result.text.includes(field),id+' exact CSS value retained in the actual draft');ok(!result.text.includes('col=2'),id+' unrelated native collector preference reachable');ok(result.text.includes('18 de novembro de 2014'),id+' date repair reachable');ok(!result.automaticRecovery,id+' no whole-group rejection');
  eq(api.preservationAudit(source,result.text,cfg).length,0,id+' independent complete preservation audit');eq(api.safeComposition(source,result.text,cfg),'',id+' independent complete composition');eq(adjust(result.text).text,result.text,id+' stable second adjustment');
  calculations++;const counted=api.calculate({kind:'final-count',source:result.text,originalSource:source,options:cfg});eq(counted.text,result.text,id+' pure final count');ok(counted.retainedAdjustments?.exact,id+' exact retained count');rows.push({id,passed:true,count:counted.retainedAdjustments.count});
 }
 for(const[id,prefix]of [
  ['unknown-template','{{Auxiliar|tópico-estilo=background-color:#F4BF92;}}'],
  ['unknown-field','{{Info|título=Exemplo|cor=background-color:#F4BF92;}}'],
  ['misspelled-field','{{Info|título=Exemplo|topico-estilo=background-color:#F4BF92;}}'],
  ['duplicate-slot','{{Info|título=Exemplo|tópico-estilo=background-color:#F4BF92;|tópico-estilo=background-color:#F4BF92;}}'],
  ['nested-template','{{Auxiliar|texto={{Info|título=Exemplo|tópico-estilo=background-color:#F4BF92;}}}}'],
  ['dynamic-colour','{{Info|título=Exemplo|tópico-estilo=background-color:#{{Auxiliar}};}}'],
  ['fragment-payload','{{Info|título=Exemplo|tópico-estilo=background-color:#F4BF92;[[#Contexto|seção]]}}'],
  ['url-payload','{{Info|título=Exemplo|tópico-estilo=background-color:#F4BF92;url(https://example.org/#Contexto)}}'],
  ['unknown-css-property','{{Info|título=Exemplo|tópico-estilo=content:#F4BF92;}}'],
  ['unsupported-css-shape','{{Info|título=Exemplo|tópico-estilo=background-color:#F4BF;}}'],
  ['multiline-css','{{Info|título=Exemplo|tópico-estilo=background-color:\n#F4BF92;}}']
 ]){const source=prefix+tail;eq(api.v2222HeadingNativeColourView(source),source,id+' unknown or ambiguous owner is not projected');eq(api.v2217HeadingInventory(source,cfg).active,true,id+' conservative heading protection retained');rows.push({id,passed:true,negative:true});}
 for(const literal of ['<nowiki>{{Info|tópico-estilo=background-color:#F4BF92;}}</nowiki>','<!-- {{Info|tópico-estilo=background-color:#F4BF92;}} -->']){eq(api.v2222HeadingNativeColourView(literal),literal,'literal example remains byte exact');rows.push({id:'protected-example-'+rows.length,passed:true,negative:true});}
 const linked='{{Info|título=Exemplo|tópico-estilo=background-color:#F4BF92;}}\nVeja [[#Contexto|a seção]].'+tail;
 ok(api.v2217HeadingInventory(linked,cfg).active,'a real heading consumer survives the colour projection');ok(api.v2217AnchorRawAudit(linked,linked.replace('== Contexto <small>geral</small> ==','== Outro =='),cfg).length>0,'a real heading identity change remains rejected');
 const nativeTarget='Veja [[#Referências|as fontes]].\n<ref>Fonte.</ref>\n{{Referências|col=2}}';
 ok(api.v2217AnchorRawAudit(nativeTarget,nativeTarget.replace('|col=2',''),cfg).length>0,'existing explicitly targeted native-provider protection is retained');
 rows.push({id:'authored-targets-retained',passed:true,negative:true});
 return{suite:'native-css-not-a-section-target',version:api.version,status:'passed',cases:rows.length,checks,calculations,negativeCases:rows.filter(r=>r.negative).length,rows,contextProjectionOnly:true,originalGuardsRetained:true,networkRequests:0,wikipediaWrites:0};
}
module.exports={run};
if(require.main===module)console.log(JSON.stringify(run(require('./harness.cjs').load())));
