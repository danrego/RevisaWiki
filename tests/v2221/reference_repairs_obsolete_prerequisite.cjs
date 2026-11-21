'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
if(!process.env.REVISAWIKI_CURRENT_CORE)throw Error('An explicit built runtime is required');
const runtime=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),bytes=fs.readFileSync(runtime),api=require(runtime),sha=s=>crypto.createHash('sha256').update(s).digest('hex'),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false},rows=[];let checks=0,calculations=0;
const citation='{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}',body='Texto.<ref name=":0">'+citation+'</ref> Outra frase.<ref name=":0" />\n\n{{Reflist}}';
function run(id,source,options,removed,renamed){
 const result=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;const effective=JSON.parse(result.localCompositionSafety.optionsSnapshot);
 checks++;assert.equal(effective.references,true,id+' references remain enabled on the first action');checks++;assert(result.text.includes('{{Referências}}'),id+' independent collector repair is applied');checks++;assert.equal(result.text.includes('name="Exemplo2020-1"'),renamed,id+' descriptive naming follows proved source coverage');
 checks++;assert.equal(/\{\{(?:Descrição curta|Sem interwiki)\b/.test(result.text),!removed,id+' original obsolete-owner behavior is retained');checks++;assert(api.v219AutomaticResultSafety(source,result).accepted,id+' automatic guard');checks++;assert.equal(api.preservationAudit(source,result.text,options).length,0,id+' independent preservation');checks++;assert(!api.safeComposition(source,result.text,options),id+' independent composition');
 const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options});calculations++;checks++;assert.equal(again.text,result.text,id+' all approved repairs apply in one action');checks++;assert.equal(api.v211RetainedAdjustments(result.text,again.text,[],options).count,0,id+' no phantom repeated adjustments');
 rows.push({id,sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(options)),outputSha256:sha(result.text),removed,renamed});return result;
}
run('literal-description-prefix','{{Descrição curta|Exemplo}}\n'+body,cfg,true,true);
run('existing-safe-magic-description','{{Descrição curta|Exemplo {{PAGENAME}}}}\n'+body,cfg,true,true);
run('existing-obsolete-interwiki-owner','{{Sem interwiki}}\n'+body,cfg,true,true);
run('literal-description-after-prose','Introdução.\n{{Descrição curta|Exemplo}}\n'+body,cfg,true,true);
run('description-option-disabled','{{Descrição curta|Exemplo}}\n'+body,{...cfg,shortDescriptions:false},false,false);
run('obsolete-option-disabled','{{Sem interwiki}}\n'+body,{...cfg,obsoleteTemplates:false},false,false);
for(const [id,value]of [['unknown-value-program','{{Widget}}'],['reference-bearing-owner','Exemplo<ref name="B">Fonte.</ref>']]){
 const source='{{Descrição curta|'+value+'}}\n'+body,result=run(id,source,cfg,false,false);checks++;assert(result.text.includes('{{Descrição curta|'+value+'}}'),id+' exact program and value retained');checks++;assert(result.text.includes('name=":0"'),id+' existing reference identities remain exact');
}
const numbered='{{Descrição curta|Exemplo}}\nTexto.<ref name=":0">'+citation+'</ref>\n\n=== Seção<ref name=":0"/> ===\n# Primeiro item\n# [[Ficheiro:Exemplo.png|miniatura|Legenda.]]Segundo item\n\n== Referências ==\n{{Reflist}}\n',nr=run('numbered-list-heading-reference',numbered,cfg,true,true);checks++;assert(nr.text.includes('=== Seção<ref name="Exemplo2020-1" /> ==='),'Native heading reference remains associated with the same definition');checks++;assert(nr.text.includes('# [[Ficheiro:Exemplo.png|miniatura|Legenda.]]Segundo item'),'Literal numbered image item is unchanged');
assert(fs.readFileSync(runtime).equals(bytes),'Runtime bytes are immutable');
const report={suite:'obsolete-owner-reference-prerequisite-convergence',passed:true,cases:rows.length,checks,calculations,runtimeSha256:sha(bytes),rows,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,cases:rows.length,checks,calculations}));
