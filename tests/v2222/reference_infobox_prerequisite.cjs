'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function run(api){const options={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false},cases=[
 ['ship-mapped','{{Info/Navio|nome=Exemplo|propulsao=Vapor<ref name="a">Fonte.</ref>}}\nTexto.','propulsão'],
 ['ship-already-native','{{Info/Navio|nome=Exemplo|propulsão=Vapor<ref name="a">Fonte.</ref>}}\nTexto.','propulsão'],
 ['computer-mapped','{{Info/Computador|nome=Exemplo|soc=Chip<ref name="a">Fonte.</ref>|obs=}}\nTexto.','SoC: Chip'],
 ['computer-already-native','{{Info/Computador|nome=Exemplo|obs=SoC: Chip<ref name="a">Fonte.</ref>}}\nTexto.','SoC: Chip']
 ],rows=[];let calculations=0;
 for(const[id,source,field]of cases){const result=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;assert(result.text.includes(field),id+' target');assert.equal((result.text.match(/\{\{Referências\}\}/g)||[]).length,1,id+' exactly one native collector');assert(result.text.includes('<ref name="a">Fonte.</ref>'),id+' literal definition retained');const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options});calculations++;assert.equal(again.text,result.text,id+' idempotence');let retained=result.retainedAdjustments;if(api.version==='2.22.2'&&retained?.pending){const counted=api.calculate({kind:'final-count',source:result.text,originalSource:source,options});calculations++;assert.equal(counted.text,result.text,id+' readonly final count');retained=counted.retainedAdjustments;}if(api.version==='2.22.2')assert(retained?.exact,id+' exact retained count');const activation=api.v2222ReferenceInfoboxActivation(source,options);assert(activation,id+' activation');const packet=JSON.parse(JSON.stringify(activation.packet));packet.referenceInventoryHash+='changed';assert.equal(api.v2222ReferenceInfoboxAllows(activation.mapped,options,packet),false,id+' modified certificate rejected');rows.push({id,passed:true,count:retained?.count??null,pendingPrimary:result.retainedAdjustments?.pending===true});}
 const negatives=[
 ['unconsumed-field','{{Info/Navio|nome=Exemplo|desconhecido=Vapor<ref name="a">Fonte.</ref>}}\nTexto.'],
 ['custom-note-group','{{Info/Navio|nome=Exemplo|propulsao=Vapor<ref group="especial">Nota.</ref>}}\nTexto.'],
 ['unresolved-name','{{Info/Navio|nome=Exemplo|propulsao=Vapor<ref name="ausente" />}}\nTexto.'],
 ['unclosed-ref','{{Info/Navio|nome=Exemplo|propulsao=Vapor<ref name="a">Fonte.}}\nTexto.']
 ];
 for(const[id,source]of negatives){const plan=api.v2222ReferenceInfoboxPlan(source,options);assert.equal(plan.text,source,id+' no unproved collector activation');rows.push({id,passed:true});}
 const existing=cases[0][1]+'\n\n{{Referências}}',result=api.calculate({kind:'adjust',source:existing,originalSource:existing,options});calculations++;assert.equal((result.text.match(/\{\{Referências\}\}/g)||[]).length,1,'existing collector not duplicated');rows.push({id:'existing-collector',passed:true});
 return{kind:'source-bound-native-infobox-renderer-prerequisite',version:api.version,cases:rows.length,calculations,results:rows,scope:'two directly proved native fields; generic unknown fields stay opaque',wikipediaWrites:0};}
if(require.main===module){const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.22.2/RevisaWiki_v2_22_2.js'),report=run(require(file));if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
module.exports={run};
