'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(bundle),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;
const aliases=['Ficheiro','ficheiro','Imagem','imagem','Arquivo','arquivo','File','file','Image','image'],gaps=['',' ','\n','\n\n',' \t\n\n\n'],options=['|thumb|300px|Legenda.','|miniatura|250px|[[Tema]] e {{lang|en|word}}.','|frame|Legenda com <ref>Fonte.</ref>.'];
for(const alias of aliases)for(const gap of gaps)for(const option of options)for(const count of [1,2,3]){
 const images=Array.from({length:count},(_,i)=>'[['+alias+':Example'+i+'.jpg'+option+']]'),source='Texto anterior.'+gap+images.join(gap)+gap+'Texto posterior.\n',expected='Texto anterior.\n\n'+images.join('\n')+'\n\nTexto posterior.\n';
 const p=api.v2217SourceLayoutPlan(source,cfg);calculations++;assert.equal(p.text,expected);checks++;
 assert.equal(p.text.replace(/\s/g,''),source.replace(/\s/g,''));checks++;
 assert.equal(api.v2217SourceLayoutPlan(p.text,cfg).text,p.text);checks++;
 assert(api.v2217SourceLayoutProof(source,p.text,p,cfg));checks++;
}
const wrappers=[s=>'<nowiki>'+s+'</nowiki>',s=>'<pre>'+s+'</pre>',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>',s=>'<code>'+s+'</code>',s=>'<math>'+s+'</math>',s=>'<gallery>\n'+s+'\n</gallery>',s=>'<ref>'+s+'</ref>',s=>'{{Exemplo|campo='+s+'}}',s=>'{|\n| '+s+'\n|}',s=>'<!--'+s+'-->'];
for(const alias of aliases)for(const wrap of wrappers){const body='[['+alias+':Example.png]]{{Em construção}}{{Evento atual}}',source=wrap(body)+'\n',p=api.v2217SourceLayoutPlan(source,cfg);calculations++;assert.equal(p.text,source);checks++;}
for(const inner of ['<!-- Comentário -->','<nowiki> </nowiki>','{{Exemplo}}','Texto.','<includeonly> </includeonly>']){
 const source='<noinclude>'+inner+'</noinclude>\n',p=api.v2217SourceLayoutPlan(source,cfg);calculations++;assert.equal(p.text,source);checks++;
}
const receipt={suite:'source-layout-properties-2.21.7',bundle,checks,calculations,passed:true};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
