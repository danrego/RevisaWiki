'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',contentModel:'wikitext',sectionOnly:false,autoPreview:false,registryDoiCheck:false};
let checks=0,calculations=0;const rows=[],yes=(x,m)=>{checks++;assert.ok(x,m);},portals=s=>(s.match(/\{\{Portal3(?:\||\}\})/g)||[]).length;
const box='{{Info/Biografia|nome=Pessoa de teste|nacionalidade=França}}\n';
const lead="'''Pessoa de teste''' é uma pessoa.\n";
const tails=[['template','{{Modelo desconhecido\n'],['reference','<ref>Fonte sem fechamento.\n'],['table','{| class="wikitable"\n| Dado\n'],['link','[[Destino incompleto\n'],['external','[https://example.invalid/ Ligação incompleta\n'],['comment','<!-- comentário incompleto\n']];
for(const [kind,tail]of tails){
 const source=box+lead+tail,plan=api.v2217PortalPlan(source,cfg);yes(plan.text===source,kind+': decline only the unsafe portal destination');yes(plan.edits.length===0,kind+': no credited portal addition');rows.push({kind,status:'passed',sourceHash:sha(source),planChanged:false});
}
for(const tail of ['{{Modelo desconhecido\n','<ref>Fonte sem fechamento.\n','{| class="wikitable"\n| Dado\n','[[Destino incompleto\n']){
 const source=box+lead+tail+'{{Portal3|Biografias}}\n',plan=api.v2217PortalPlan(source,cfg);yes(plan.text===source,'an existing portal inside incomplete syntax is not a valid insertion anchor');yes(portals(plan.text)===1,'existing nested portal bytes remain single and unchanged');
}
for(const source of [box+lead,box+lead+'{{Portal3|Biografias}}\n',box+lead+'<!-- {{Exemplo incompleto -->\n',box+lead+'<nowiki>{{Modelo incompleto [[Ligação</nowiki>\n',box+lead+'{{Começa caixa}}\n{{Fim}}\n']){
 const plan=api.v2217PortalPlan(source,cfg);yes(plan.text!==source,'complete independent destination still gains confirmed portals');yes(portals(plan.text)===1,'complete result has one portal call');yes(api.v2217PortalProof(source,plan.text,plan,cfg),'positive destination has exact portal proof');yes(api.v2217PortalPlan(plan.text,cfg).text===plan.text,'positive portal plan is idempotent');
}
{
 const source=box+lead+'{{Portal3|Biografias}}\n{{Modelo desconhecido\n',plan=api.v2217PortalPlan(source,cfg);yes(api.v2217PortalProof(source,plan.text,plan,cfg),'independent existing portal before incomplete tail retains exact proof');yes(plan.text.endsWith('{{Modelo desconhecido\n'),'incomplete tail is not repaired by guessing');yes(portals(plan.text)===1,'independent existing portal is preserved without another call');yes(api.v2217PortalPlan(plan.text,cfg).text===plan.text,'independent existing portal is idempotent');
}
for(const source of [box+lead+'{{Modelo desconhecido\n',box+lead+'{{Portal3|Biografias}}\n{{Modelo desconhecido\n',box+lead+'<nowiki>{{Modelo incompleto [[Ligação</nowiki>\n']){
 const first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});calculations++;yes(api.v219AutomaticResultSafety(source,first).accepted,'actual action retains preservation gate');yes(second.text===first.text,'actual second action makes no additional portal change');yes(portals(first.text)<=1,'actual action never multiplies portal calls');yes(/\|nome\s*=Pessoa de teste/.test(first.text),'independent infobox field formatting still applies');
}
const receipt={suite:'portal_destination',version:api.version,passed:true,checks,calculations,runtimeSha256:sha(fs.readFileSync(file)),rows,wikipediaWrites:0,networkRequests:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
