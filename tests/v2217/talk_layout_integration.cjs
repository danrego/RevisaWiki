'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(bundle);
const base={...api.defaults,contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,sectionOnly:false};let checks=0,calculations=0;
global.fetch=()=>{throw Error('No network in integration tests');};
function calculate(source,namespaceNumber=0){const options={...base,namespaceNumber,pageTitle:namespaceNumber===1?'Discussão:Exemplo':'Exemplo'},r=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;assert.equal(api.v219AutomaticResultSafety(source,r).accepted,true);checks++;return{r,options};}
const talk='{{pd}}\n{{Marca de projeto|1|História militar|?|bot=?/20131103|rev=20140530}}\n== Assunto ==\nMensagem.\n\n{{fusões a avaliar|Tema A|Tema B}}\n{{Traduzido|en|Example|oldid=123|data=2026-01-02}}\n';
const t=calculate(talk,1).r.text;
assert(t.startsWith('{{PD}}\n{{Traduzido|'));checks++;
assert.equal((t.match(/\{\{PD\}\}/g)||[]).length,1);checks++;
assert.equal((t.match(/\{\{Marca de projeto/g)||[]).length,1);checks++;
assert(!/\|(?:bot|rev)=/.test(t));checks++;
assert(t.includes('{{Marca de projeto|?|História militar|?}}'));checks++;
assert(t.indexOf('{{Marca de projeto')<t.indexOf('{{fusões a avaliar'));checks++;
assert(t.includes('== Assunto ==\nMensagem.'));checks++;
assert.equal(calculate(t,1).r.text,t);checks++;
const human='{{PD}}\n{{Marca de projeto|3|Ciência|2|rev=20260102}}\nMensagem.\n';
assert(calculate(human,1).r.text.includes('|3|Ciência|2|rev=20260102'));checks++;
const marker=human.slice(human.indexOf('{{Marca'),human.indexOf('\nMensagem')),stale={sourceHash:api.v2216LayoutHash(human),templateHash:api.v2216LayoutHash(marker),templateStart:human.indexOf(marker),quality:{value:'3',confirmedBot:true},reviewDate:{value:'20260102',confirmedBot:true}};
const staleResult=api.calculate({kind:'adjust',source:human,originalSource:human,options:{...base,namespaceNumber:1,pageTitle:'Discussão:Exemplo',v2216ConfirmedBotAssessments:[stale]}});calculations++;
assert(staleResult.text.includes('|3|Ciência|2|rev=20260102'));checks++;
const source='Texto de exemplo.\n[[Ficheiro:Exemplo.jpg]] [[Ficheiro:Exemplo2.jpg]]Outro texto.\n';
const a=calculate(source).r.text;
assert(a.includes('Texto de exemplo.\n\n[[Ficheiro:Exemplo.jpg]]\n[[Ficheiro:Exemplo2.jpg]]\n\nOutro texto.'));checks++;
assert.equal(calculate(a).r.text,a);checks++;
for(const source of ['<noinclude><!-- Comentário --></noinclude>\nTexto.\n','<nowiki>[[Ficheiro:Exemplo.jpg]]{{Em construção}}{{Evento atual}}</nowiki>\nTexto.\n']){
 const {r}=calculate(source);assert(r.text.includes(source.trimEnd()));checks++;
}
const empty='<noinclude>\n </noinclude>\n\nTexto de exemplo.\n';assert.equal(calculate(empty).r.text,'Texto de exemplo.\n');checks++;
const r=calculate('{{Em construção}}{{Evento atual|Este artigo}}{{Info/conflito civil|título=Exemplo}}\nTexto de exemplo.\n').r.text;
assert(r.includes('{{Em construção}}\n{{Evento atual|Este artigo}}\n{{Info/conflito civil'));checks++;
for(const source of ['A cor é {{Info/Música/artista/cor|cantor_solo}}.\n','Um componente {{Info/Modelo fictício/componente|valor}} segue na frase.\n']){
 assert.equal(calculate(source).r.text,source);checks++;
}
const receipt={suite:'talk-layout-integration-2.21.7',bundle,checks,calculations,passed:true};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
