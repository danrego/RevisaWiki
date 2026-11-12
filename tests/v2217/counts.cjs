'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||'dist/2.21.7/RevisaWiki_v2_21_7.js'),a=require(bundle),options={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',sectionOnly:false,autoPreview:false,registryDoiCheck:false};
let checks=0,calculations=0;const check=(x,y,label)=>{assert.deepEqual(x,y,label);checks++;};
for(const[source,expected]of [
 ['({Portal3|Guerra]]\n',2],
 ['[{Referências}}\n',1],
 ['{{S-bef|before=Pessoa fictícia}}\n',1],
 ['{{S-bef|before=Pessoa fictícia}}\n{{S-inc|recent}}\n',2],
 ['Texto [[China]],[[Gansu]] e[[Xinjiang]].\n',2],
 ['*Item\n**Subitem\n',2]
]){
 const result=a.calculate({kind:'adjust',source,originalSource:source,options});calculations++;
 check(a.v219AutomaticResultSafety(source,result).accepted,true,'safety');
 const count=a.v211RetainedAdjustments(source,result.text,result.changes,options);
 check(count.exact,true,source);check(count.count,expected,source);check(count.events.length,expected,'one event per retained correction');
 check(a.calculate({kind:'adjust',source:result.text,originalSource:result.text,options}).text,result.text,'idempotence');calculations++;
}
const component='A cor é {{Info/Música/artista/cor|cantor_solo}}.\n',wrapper='<div style="max-width:100%;overflow-x:auto" tabindex="0" role="region" aria-label="Exemplo">\n{{Info/Música/artista/cor|cantor_solo}}\n</div>\n';
for(const source of [component,wrapper]){const result=a.calculate({kind:'adjust',source,originalSource:source,options});calculations++;check(result.text,source,'inline component or functional wrapper preserved');check(a.v219AutomaticResultSafety(source,result).accepted,true,'component safety');}
const report={version:'2.21.7',suite:'retained-counts-and-component-integrity',checks,calculations,bundle:path.basename(bundle),bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
