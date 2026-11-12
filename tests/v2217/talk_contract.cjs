'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(bundle);
assert.equal(typeof api.v2217TalkPlan,'function');
const cfg={...api.defaults,namespaceNumber:1,contentModel:'wikitext',pageTitle:'Discussão:Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;
function test(source,expected,label,options=cfg){
 const p=api.v2217TalkPlan(source,options);calculations++;assert.equal(p.text,expected,label);checks++;
 assert(api.v2217TalkProof(source,p.text,p,options),label+' proof');checks++;
 assert.equal(api.v2217TalkPlan(p.text,options).text,p.text,label+' idempotence');checks++;
 assert(!api.v2217TalkProof(source,p.text+'X',p,options),label+' mutation');checks++;
 return p;
}
for(const alias of ['PD','pd','pD','Pd','Cabeçalho de discussão','Página de discussão','PW-Alvo','BPV','Bpv','Coisas a não fazer','Discussão de portal','Página de discussão/Arquivo 1','Portais-aviso']){
 test('{{'+alias+'}}\n{{PD}}\n== Assunto ==\nMensagem.','{{PD}}\n== Assunto ==\nMensagem.','valid banner alias '+alias);
}
for(const bad of ['PDD','Página de discusão','Pagina de discussao','Page discussion']){
 const source='{{PD}}\n{{'+bad+'}}\nMensagem.';test(source,source,'unknown spelling preserved '+bad);
}
test('{{PD}}{{pd}}\nMensagem.','{{PD}}\nMensagem.','adjacent banner aliases');
test('{{PD}}\n{{Marca de projeto|1|História militar|?|Forças Armadas|?|Biografia|?|bot=?/20131103|rev=20140530}}',
 '{{PD}}\n{{Marca de projeto|?|História militar|?|Forças Armadas|?|Biografia|?}}','bot marker sufficient despite later review date');
test('{{PD}}\n{{Marca de projeto|?|Hidrografia|?|bot=?/20120224|rev=20120224}}',
 '{{PD}}\n{{Marca de projeto|?|Hidrografia|?}}','matching bot review date');
test('{{PD}}\n{{Marca de projeto|2|Ciência|3|bot=|rev=20260102|motivo=Conservar}}',
 '{{PD}}\n{{Marca de projeto|?|Ciência|3|motivo=Conservar}}','empty bot marker still present');
test('{{PD}}\n{{Marca de projeto|qualidade=2|2=Ciência|3=3|bot=sim|rev=20260102|motivo=Conservar}}',
 '{{PD}}\n{{Marca de projeto|?|Ciência|3|motivo=Conservar}}','named quality bot marker');
for(const rating of ['?','1','2','3','4']){
 const source='{{PD}}\n{{Marca de projeto|'+rating+'|Ciência|3|rev=20260102|motivo=Conservar}}';test(source,source,'botless quality and revision preserved '+rating);
}
test('{{PD}}\n{{Marca de projeto|1|Ciência|3|bot=sim|rev=20260102}}\n{{Marca de projeto|?|Tecnologia|?|Física|?}}',
 '{{PD}}\n{{Marca de projeto|?|Ciência|3|Tecnologia|?|Física|?}}\n','bot cleanup and project consolidation');
test('{{PD}}\n{{Marca de projeto|1|Ciência|3|bot=sim|rev=20260102}}\n{{Marca de projeto|3|Física|2|rev=20260103}}',
 '{{PD}}\n{{Marca de projeto|3|Ciência|3|Física|2|rev=20260103}}\n','a separate human assessment survives consolidation after bot cleanup');
test('{{PD}}\n{{Marca de projeto|3|Física|2|rev=20260103}}\n{{Marca de projeto|1|Ciência|3|bot=sim|rev=20260102}}',
 '{{PD}}\n{{Marca de projeto|3|Física|2|Ciência|3|rev=20260103}}\n','human assessment survives reversed marker order');
const talk='{{PD}}\n{{Marca de projeto|?|Antropologia|?|África|?|rev=20210319}}\n== Assunto ==\nMensagem.\n\n{{fusões a avaliar|Tema A|Tema B}}\n{{Traduzido|en|Example|oldid=123|data=2026-01-02|fontes=}}\n';
test(talk,'{{PD}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123|data=2026-01-02|fontes=}}\n{{Marca de projeto|?|Antropologia|?|África|?|rev=20210319}}\n{{fusões a avaliar|Tema A|Tema B}}\n== Assunto ==\nMensagem.\n\n','translation before projects before fusion');
test('{{PD}}\n{{Marca de projeto|?|Ciência|?}}\n{{Traduzido|en|First|oldid=123}}\n{{Traduzido|fr|Deuxième|oldid=456}}\n{{Fusão com|Tema A}}\n{{Fusão de|Tema B}}\nMensagem.',
 '{{PD}}\n{{Traduzido|página=First|cód_idioma=en|oldid=123}}\n{{Traduzido|página=Deuxième|cód_idioma=fr|oldid=456}}\n{{Marca de projeto|?|Ciência|?}}\n{{Fusão com|Tema A}}\n{{Fusão de|Tema B}}\nMensagem.','distinct attributions and mergers retained');
for(const content of ['<nowiki>{{PD}}{{pd}} {{Marca de projeto|1|Ciência|?|bot=sim|rev=20260101}}</nowiki>','<!--{{PD}}{{pd}}-->','{{Exemplo|{{PD}}|{{pd}}}}','* {{PD}}','Texto cita {{PD}} no meio.']){
 const source='{{PD}}\n'+content;test(source,source,'protected or inline discussion example');
}
for(const options of [{namespaceNumber:0},{namespaceNumber:2},{sectionOnly:true},{pageRedirect:true},{contentModel:'javascript'},{auxiliaryTemplates:false}]){
 test('{{pd}}\n{{PD}}','{{pd}}\n{{PD}}','scope guard',{...cfg,...options});
}
const human='{{PD}}\n{{Marca de projeto|2|Ciência|?|rev=20260102}}';
test(human,human,'obsolete provenance cannot clear a botless marker',{...cfg,v2216ConfirmedBotAssessments:[{sourceHash:api.v2216LayoutHash(human),templateHash:api.v2216LayoutHash(human.slice(7)),templateStart:7,quality:{value:'2',confirmedBot:true},reviewDate:{value:'20260102',confirmedBot:true}}]});
const prepare=api.v2217TalkPreparationPlan('{{pd}}\n{{Marca de projeto|1|Física|?|bot=sim|rev=20260101}}\n{{Traduzido|en|Example|oldid=123}}\nMensagem.','{{Portal3|Tecnologia|Ciência}}',cfg);
assert.equal(prepare.source,'{{pd}}\n{{Marca de projeto|1|Física|?|bot=sim|rev=20260101}}\n{{Traduzido|en|Example|oldid=123}}\nMensagem.');checks++;
assert.equal((prepare.text.match(/\{\{PD\}\}/g)||[]).length,1);checks++;
assert.equal((prepare.text.match(/\{\{Marca de projeto/g)||[]).length,1);checks++;
assert(!/\|(?:bot|rev)=/.test(prepare.text));checks++;
assert(prepare.text.includes('Tecnologia')&&prepare.text.includes('Ciência'));checks++;
assert(prepare.text.indexOf('{{Traduzido')<prepare.text.indexOf('{{Marca de projeto'));checks++;
assert.equal(prepare.summary,'{{PD}}{{Marca de projeto}}');checks++;
async function finish(){let guarded=0;global.mw={Api:class{constructor(){throw Error('No history request is permitted');}}};const prepared=await api.v2216PrepareAssessmentProvenance({source:human,guard(){guarded++;}},{...cfg,v2216ConfirmedBotAssessments:[{}]});assert.equal(guarded,1);assert(!Object.hasOwn(prepared,'v2216ConfirmedBotAssessments'));checks+=2;const receipt={suite:'talk-2.21.7',bundle,checks,calculations,passed:true};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));}
finish().catch(e=>{console.error(e);process.exitCode=1;});
