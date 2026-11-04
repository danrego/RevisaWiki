'use strict';
const assert=require('node:assert/strict'),api=require('./layout_helpers.cjs')(),cfg={...api.defaults,namespaceNumber:1,contentModel:'wikitext',pageTitle:'Discussão:Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0;
function test(source,expected,label,options=cfg){const p=api.v2216TalkPlan(source,options);checks++;assert.equal(p.text,expected,label);checks++;assert(api.v2216TalkProof(source,p.text,p,options),label+' proof');checks++;assert.equal(api.v2216TalkPlan(p.text,options).text,p.text,label+' idempotence');checks++;assert(!api.v2216TalkProof(source,p.text+'X',p,options),label+' mutation');}
for(const alias of ['PD','pd','pD','Pd','Cabeçalho de discussão','Página de discussão','PW-Alvo','BPV','Bpv','Coisas a não fazer','Discussão de portal','Página de discussão/Arquivo 1','Portais-aviso'])test('{{'+alias+'}}\n{{PD}}\n== Assunto ==\nMensagem.','{{PD}}\n== Assunto ==\nMensagem.','header alias '+alias);
test('{{PD}}{{pd}}\nMensagem.','{{PD}}\nMensagem.','adjacent headers');
test('{{PD|aviso=primeiro}}\n{{pd|detalhe=segundo}}\nMensagem.','{{PD|aviso=primeiro|detalhe=segundo}}\nMensagem.','compatible header options');
test('{{PD}}\n{{Marca de projeto|?|Ciência|?}}\n{{Marca de projeto|?|Tecnologia|?|Física|?}}','{{PD}}\n{{Marca de projeto|?|Ciência|?|Tecnologia|?|Física|?}}\n','projects merge');
test('{{PD}}\n{{Marca de projeto|2|Ciência|3|rev=20260102|motivo=Texto humano}}\n{{Marca de projeto|?|Ciência|?|Tecnologia|?}}','{{PD}}\n{{Marca de projeto|2|Ciência|3|Tecnologia|?|rev=20260102|motivo=Texto humano}}\n','human quality and date retained');
test('{{PD}}\n{{Traduzido|en|Example|oldid=123456789|data=4 de novembro de 2026}}','{{PD}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123456789|data=4 de novembro de 2026}}','native translation slots');
test('{{PD}}\n{{Traduzido|fr|Exemple|NV|oldid=123|data=2026-01-02|oldid_tradução=456}}','{{PD}}\n{{Traduzido|página=Exemple|cód_idioma=fr|3=NV|oldid=123|data=2026-01-02|oldid_tradução=456}}','source review status retained');
for(const content of ['<nowiki>{{PD}}{{pd}}</nowiki>','<!--{{PD}}{{pd}}-->','{{Exemplo|{{PD}}|{{pd}}}}','* {{PD}}','Texto cita {{PD}} no meio.']){
 const source='{{PD}}\n'+content;test(source,source,'literal discussion example');
}
for(const source of [
 '{{PD|aviso=primeiro}}\n{{pd|aviso=segundo}}\nMensagem.',
 '{{PD}}\n{{Marca de projeto|2|Ciência|?}}\n{{Marca de projeto|3|Física|?}}',
 '{{PD}}\n{{Marca de projeto|?|Ciência|2}}\n{{Marca de projeto|?|Ciência|3}}',
 '{{PD}}\n{{Traduzido|en|Example|página=Outra página|oldid=123}}',
 '{{PD}}\n{{Traduzido|en|Example|cód_idioma=de|oldid=123}}',
 '{{PD}}\n{{Marca de projeto|?|Ciência|?|rev=20260102}}',
 '{{PD}}\n{{Marca de projeto|3|Ciência|2|rev=20260102}}'
])test(source,source,'conflicts and provenance-free ratings untouched');
const bot='{{PD}}\n{{Marca de projeto|2|Ciência|?|rev=20260102|motivo=Conservado}}';
const raw=bot.slice(bot.indexOf('{{Marca'));const hash=api.v2216LayoutHash;
const evidence={sourceHash:hash(bot),templateHash:hash(raw),templateStart:bot.indexOf(raw),quality:{value:'2',confirmedBot:true},reviewDate:{value:'20260102',confirmedBot:true}};
test(bot,'{{PD}}\n{{Marca de projeto|?|Ciência|?|motivo=Conservado}}','verified bot lineage cleared',{...cfg,v2216ConfirmedBotAssessments:[evidence]});
for(const change of [{sourceHash:'wrong'},{templateHash:'wrong'},{templateStart:0},{quality:{value:'2',confirmedBot:false},reviewDate:{value:'20260102',confirmedBot:false}}])test(bot,bot,'stale or unverified evidence rejected',{...cfg,v2216ConfirmedBotAssessments:[{...evidence,...change}]});
for(const options of [{namespaceNumber:0},{namespaceNumber:2},{sectionOnly:true},{pageRedirect:true},{contentModel:'javascript'}])test('{{pd}}\n{{PD}}','{{pd}}\n{{PD}}','outside discussion scope',{...cfg,...options});


for(const source of ['{{PD}}\n<!-- Comentário -->\n{{pd}}\nTexto.','{{PD}}\n<!-- Comentário -->\n{{Página de discussão}}\nTexto.'])test(source,'{{PD}}\n<!-- Comentário -->\nTexto.','removed banner line leaves comment spacing intact');
for(const [source,count] of [['{{PD}}\n{{pd}}\n{{Página de discussão}}',2],['{{pd}}\n{{PD}}',2],['Texto.\n{{PD}}',1]]){const p=api.v2216TalkPlan(source,cfg);assert.equal(p.edits[0].count,count);checks++;}
const createSource='{{pd}}\n{{Marca de projeto|?|Física|?}}\n{{Marca de projeto|?|Ciência|?}}\n{{Traduzido|en|Example|oldid=123|data=2026-01-02}}\n== Conversa ==\nMensagem.',create=api.v25TalkPreparationPlan(createSource,'{{Portal3|Tecnologia}}',cfg);
assert.equal(create.source,createSource);assert.equal((create.text.match(/\{\{PD\}\}/g)||[]).length,1);assert.equal((create.text.match(/\{\{Marca de projeto/g)||[]).length,1);assert(create.text.includes('Tecnologia'));assert(create.text.includes('|página=Example|cód_idioma=en'));assert(create.text.endsWith('== Conversa ==\nMensagem.'));assert.equal(create.summary,'{{PD}}{{Marca de projeto}}');checks+=7;
console.log(JSON.stringify({suite:'talk-2.21.6',checks,passed:true}));
