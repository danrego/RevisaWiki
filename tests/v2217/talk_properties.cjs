'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(bundle),cfg={...api.defaults,namespaceNumber:1,contentModel:'wikitext',pageTitle:'Discussão:Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;
function same(source,expected){const p=api.v2217TalkPlan(source,cfg);calculations++;assert.equal(p.text,expected);checks++;assert(api.v2217TalkProof(source,p.text,p,cfg));checks++;assert.equal(api.v2217TalkPlan(p.text,cfg).text,p.text);checks++;}
for(const quality of ['?','1','2','3','4'])for(const importance of ['?','1','2','3','4'])for(const bot of ['','sim','?/20131103','0','yes']){
 const source='{{PD}}\n{{Marca de projeto|'+quality+'|Ciência|'+importance+'|bot='+bot+'|rev=20260102|motivo=Conservar}}\nMensagem.\n',expected='{{PD}}\n{{Marca de projeto|?|Ciência|'+importance+'|motivo=Conservar}}\nMensagem.\n';same(source,expected);
}
for(const quality of ['?','1','2','3','4'])for(const importance of ['?','1','2','3','4']){
 const source='{{PD}}\n{{Marca de projeto|'+quality+'|Ciência|'+importance+'|rev=20260102|motivo=Conservar}}\nMensagem.\n';same(source,source);
}
function permutations(a){return a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(t=>[v,...t])):[[]];}
const calls=['{{PD}}','{{Traduzido|página=Example|cód_idioma=en|oldid=123}}','{{Marca de projeto|?|Ciência|?}}','{{fusões a avaliar|Tema A|Tema B}}'];
for(const order of permutations(calls)){
 const source=order.join('\n')+'\n== Assunto ==\nMensagem.\n',expected=calls.join('\n')+'\n== Assunto ==\nMensagem.\n';same(source,expected);
}
same('{{PD}}\n{{Marca de projeto|1|Ciência|3|bot=sim|rev=20260101}}\n{{Marca de projeto|2|Tecnologia|2|rev=20260102}}\nMensagem.\n','{{PD}}\n{{Marca de projeto|2|Ciência|3|Tecnologia|2|rev=20260102}}\nMensagem.\n');
const receipt={suite:'talk-properties-2.21.7',bundle,checks,calculations,passed:true};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
