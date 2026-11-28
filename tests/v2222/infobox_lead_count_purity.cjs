'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function run(api){
 const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo'},body="'''Exemplo''' é um político.\n{{Referências}}",ref='<ref name="a">Fonte.</ref>',reuse='<ref name="a" />',birth='{{dni|8|1|1969}}',date='{{DataExt|8|1|1969}}',place='[[Localidade]], [[Brasil]]',tuple=' ('+place+','+reuse+' '+date+reuse+')',rows=[];
 const pair=(fields='',title='Info/Político',sourceBody=body,added=tuple)=>{const prefix='{{'+title+'|nome=Exemplo|nascimento_data='+birth+ref+'|nascimento_local='+place+reuse+fields+'}}\n\n';return[prefix+sourceBody,prefix+sourceBody.replace("'''Exemplo'''","'''Exemplo'''"+added)];};
 const check=(id,before,after,expected,options=cfg)=>{const frozen=JSON.stringify(options),r=api.v2222InfoboxCountLeadProjection(before,after,options);assert.equal(r?.count??null,expected,id);assert.equal(JSON.stringify(options),frozen,id+' options unchanged');if(expected!==null){assert.equal(r.before,before,id+' original source unchanged');assert.equal(r.after,before,id+' removes only the witnessed endpoint addition');assert.equal(r.events.length,expected,id+' one literal fact per event');}rows.push({id,expected,actual:r?.count??null,beforeSha256:sha(before),afterSha256:sha(after)});};
 const positive=(id,...args)=>check(id,...pair(...args),2);
 positive('native-two-literal-facts');
 check('native-date-only',...pair('','Info/Político',body,' ('+date+reuse+')'),1);
 for(const value of ['{{Auxiliar desconhecido|texto=Valor opaco}}','{{Small|{{Auxiliar desconhecido}}}}','casado com [[Alguém]] em 1998','https://example.invalid/?a=7&b=9'])positive('unrelated-value-opaque:'+sha(value).slice(0,8),'|campo_desconhecido='+value);
 positive('unrelated-native-alias-not-canonicalized','|occupation=ator','Info/Biografia');
 positive('certified-module-child-keeps-parent-owner','|módulo={{Info/Político|embed=sim|nome=Filha}}','Info/Biografia');
 check('unowned-module-person-is-another-principal',...pair('|módulo={{Info/Político|nome=Filha}}','Info/Biografia'),null);
 {
  const[b,a]=pair(),unknown='{{Auxiliar desconhecido|valor=7|title=Opaco}}',before=b.replace('Fonte.',unknown),after=a.replace('Fonte.',unknown);
  check('exact-unknown-reference-body-is-opaque',before,after,2);
  check('changed-unknown-reference-body-declined',before,after.replace('valor=7','valor=8'),null);
 }
 {
  const[b,a]=pair(),before=b.replace('Fonte.','Fonte <nowiki>7</nowiki>.'),after=a.replace('Fonte.','Fonte <nowiki>7</nowiki>.');
  check('protected-reference-body-is-literal-evidence',before,after,2);
  check('same-length-protected-reference-change-declined',before,after.replace('<nowiki>7</nowiki>','<nowiki>8</nowiki>'),null);
  check('protected-reference-definition-conflict-declined',before+'\n<ref name="a">Fonte <nowiki>8</nowiki>.</ref>',after+'\n<ref name="a">Fonte <nowiki>8</nowiki>.</ref>',null);
 }
 for(const key of ['calendário','calendario','calendar'])check('calendar:'+key,...pair('|'+key+'=gregoriano'),null);
 for(const key of ['embed','child','embutido','subcaixa','nested','incorporar','subbox'])check('embedded:'+key,...pair('|'+key+'=sim'),null);
 for(const key of ['embed','child'])positive('explicit-false:'+key,'|'+key+'=não');
 for(const[id,fields]of [['duplicate-date','|nascimento_data='+birth+reuse],['competing-date','|data_nascimento={{dni|9|1|1969}}'+reuse],['unknown-date-helper','|nascimento_data={{Auxiliar desconhecido}}'+reuse],['unknown-place-helper','|nascimento_local={{Auxiliar desconhecido}}'+reuse]])check(id,...pair(fields),null);
 for(const[id,title]of [['foreign-title','Infobox person'],['unknown-native-title','Info/Exemplo desconhecido'],['nonliteral-title','Info/Político<!-- opaco -->']])check(id,...pair('',title),null);
 {
  const[b,a]=pair();
  for(const[id,other]of [['multiple-principal','{{Info/Biografia|nome=Outro}}\n'],['foreign-other-box','{{Infobox person|name=Outro}}\n'],['unknown-title-modifier','{{Info/Político<!-- opaco -->|nome=Outro}}\n']])check(id,other+b,other+a,null);
  for(const[id,options]of [['namespace',{namespaceNumber:1}],['infobox-disabled',{infoboxes:false}],['markup-disabled',{markup:false}],['redirect',{pageRedirect:true}],['disambiguation',{pageDisambiguation:true}],['section-only',{sectionOnly:true}],['section-number',{section:0}],['section-name',{section:'Introdução'}],['list-title',{pageTitle:'Lista de Exemplo'}],['annex-title',{pageTitle:'Anexo:Exemplo'}],['non-wikitext',{contentModel:'json'}],['discussion',{discussionPage:true}]])check('context:'+id,b,a,null,{...cfg,...options});
  for(const[id,transform]of [['signature',x=>x+'\n~~~~'],['same-line-prefix',x=>'Texto '+x],['same-line-suffix',x=>x.replace('}}\n\n', '}} Texto\n\n')],['protected-box',x=>'<nowiki>'+x.slice(0,x.indexOf('\n\n'))+'</nowiki>'+x.slice(x.indexOf('\n\n'))],['unclosed-context',x=>x+'\n{{Aberto']])check('source:'+id,transform(b),transform(a),null);
  check('reference-body-must-match-literally',b,a.replace('Fonte.','Fonte. '),null);
  check('reference-name-must-match',b,a.replaceAll('name="a"','name="b"'),null);
  check('reference-must-remain-bound',b,a.replace(ref,'<ref name="a" />'),null);
 }
 const musicPair=extra=>pair(extra,'Info/Artista musical').map(x=>x.replace('nascimento_local=','nascimento_cidade='));
 check('music:literal-solo-source',...musicPair('|fundo=instrumentista sem vocal'),2);
 for(const[id,extra]of [['group','|fundo=grupo'],['members','|fundo=instrumentista sem vocal|integrantes=Alguém'],['missing-type',''],['duplicate-type','|fundo=instrumentista sem vocal|fundo=instrumentista sem vocal']])check('music:'+id,...musicPair(extra),null);
 {
  const fields='|morte_data={{morte|9|2|2020}}'+reuse+'|morte_local=[[Outra localidade]]'+reuse,opening=body.replace(' é ',' foi '),added=' ('+place+','+reuse+' '+date+reuse+' – [[Outra localidade]],'+reuse+' {{DataExt|9|2|2020}}'+reuse+')';
  check('four-independent-literal-birth-death-facts',...pair(fields,'Info/Político',opening,added),4);
 }
 {
  const[b,a]=pair();
  for(const[id,needle,replacement]of [['unknown-source-date',birth,'{{Auxiliar desconhecido}}'],['unknown-source-place',place,'{{Auxiliar desconhecido}}'],['foreign-source-date',birth,'{{Birth date|1969|1|8}}']])check(id,b.replace(needle,replacement),a.replace(needle,replacement),null);
  check('source-reference-ambiguity',b+'\n<ref name="a">Outra fonte.</ref>',a+'\n<ref name="a">Outra fonte.</ref>',null);
 }
 return{suite:'literal-biography-lead-count-purity',status:'passed',version:api.version,cases:rows.length,results:rows,qualifiedSemanticDifference:'Unrelated source fields remain opaque; a repairable alias does not disqualify independently proved literal native facts. Reference bodies must match literally.',adjustmentActions:0,networkRequests:0,wikipediaWrites:0};
}
if(require.main===module){const r=run(require('./harness.cjs').load());if(process.env.REVISAWIKI_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_RECEIPT,JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({suite:r.suite,status:r.status,cases:r.cases}));}
module.exports={run};
