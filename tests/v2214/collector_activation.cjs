'use strict';
// An ignored template argument can contain an unevaluated reference tag.
// Correcting its key must not activate that tag without a following collector.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.4/RevisaWiki_v2_21_4.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de teste',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-29'};
let checks=0,calculations=0;const failures=[],rows=[],eq=(a,b,label)=>{checks++;try{assert.deepEqual(a,b,label);}catch(e){failures.push({label,actual:a,expected:b});}};
function literalCollectorFollows(text,group){const end=text.indexOf('</ref>')+6;if(end<6)return false;for(const match of text.matchAll(/\{\{Referências(?:\|grupo=([^|{}]*))?\}\}/g))if(match.index>=end&&(match[1]??'')===group)return true;return false;}
const families=[['Político','vice-título2','vice_título2'],['Biografia','occupation','ocupação'],['Filme','director','direção']],modes=[['default',{}],['no-footer',{endMatter:false}],['no-reference-writer',{references:false}],['infobox-only',{endMatter:false,references:false,portals:false,biographyPortal:false,automaticTopicPortals:false}]],collect=(group)=>'{{Referências'+(group?'|grupo='+group:'')+'}}';
for(const [box,key,target]of families)for(const named of [false,true])for(const group of ['', 'nota'])for(const collector of ['absent','matching-after','matching-before','wrong-group-after'])for(const [mode,delta]of modes){
 const ref='<ref'+(named?' name="fonte"':'')+(group?' group="'+group+'"':'')+'>Fonte preservada.</ref>',body='{{Info/'+box+'|nome=Tema de teste|'+key+'=Valor'+ref+'}}\n\nTexto preservado.\n',matching=collect(group),wrong=collect(group?'':'nota'),source='{{Descrição curta|Tema de teste}}\n'+(collector==='matching-before'?matching+'\n':'')+body+(collector==='matching-after'?matching+'\n':collector==='wrong-group-after'?wrong+'\n':''),options={...cfg,...delta},result=api.calculate({kind:'adjust',source,originalSource:source,options}),gate=api.v219AutomaticResultSafety(source,result),id=[box,named?'named':'anonymous',group||'default',collector,mode].join('/');calculations++;
 eq(gate.accepted,true,'Only the verified partial candidate reaches the editor: '+id);
 eq(result.text.includes('Fonte preservada.'),true,'Reference text is never removed: '+id);
 eq(result.text.includes('{{Descrição curta|'),false,'An independent safe correction remains available: '+id);
 if(collector==='matching-after')eq(result.text.includes('|'+target+'=Valor'),true,'A matching following collector keeps the useful migration available: '+id);
 else eq(result.text.includes('|'+key+'=Valor')||literalCollectorFollows(result.text,group),true,'A migrated field independently retains a following literal native collector of its group: '+id);
 const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options});calculations++;eq(again.text,result.text,'Another click cannot activate the refused reference: '+id);
 rows.push({id,sourceSha256:sha(source),candidateSha256:sha(result.text),accepted:gate.accepted,requiredMigration:collector==='matching-after',migrationApplied:result.text.includes('|'+target+'=Valor'),followingLiteralCollector:literalCollectorFollows(result.text,group)});
}
const unchanged='{{Info/Político|nome=Tema de teste|vice-título2=Valor<ref name="fonte">Fonte.</ref>}}\nTexto.';
for(const options of [cfg,{...cfg,endMatter:false,references:false}]){
 eq(api.v2214ReferenceActivationAudit(unchanged,unchanged,options),[],'An unchanged inherited problem is not a new activation');
 const candidate=unchanged.replace('vice-título2','vice_título2'),findings=api.v2214ReferenceActivationAudit(unchanged,candidate,options);
 eq(findings.some(f=>f.code==='reference-activation-unconfirmed'),true,'Read-only activation detection does not depend on writer preferences');
}
const nativeField='{{Info/Biografia|nome=Tema de teste|ocupação=Profissão<ref group="nota">Fonte antiga.</ref>}}\nTexto.';
const changedGroup=nativeField.replace('group="nota"','group="outro"'),added=nativeField.replace('</ref>','</ref><ref group="nota">Fonte acrescentada.</ref>');
for(const [id,candidate]of [['new-group-existing-key',changedGroup],['extra-occurrence-existing-key',added]])eq(api.v2214ReferenceActivationAudit(nativeField,candidate,cfg).some(f=>f.code==='reference-activation-unconfirmed'),true,'An existing key cannot lend its lineage to another group or occurrence: '+id);
eq(api.v2214ReferenceActivationAudit(nativeField,nativeField.replace('Fonte antiga.','Texto atualizado.'),cfg),[],'Changing an existing reference body is delegated to the independent binding guard');
eq(api.v2214ReferenceActivationAudit(nativeField,changedGroup+'\n{{Referências|grupo=outro}}',cfg),[],'A following native collector discharges the new-group activation obligation');
for(const markup of ['<references group="nota"/>','<references group="nota" responsive="1"/>','<references group="nota" responsive="0"/>']){
 const original='{{Info/Biografia|nome=Tema de teste|occupation=Profissão<ref group="nota">Fonte.</ref>}}',candidate=original.replace('|occupation=','|ocupação=')+'\n'+markup;
 eq(api.v2214ReferenceActivationAudit(original,candidate,cfg),[],'A native HTML collector with a literal layout attribute preserves its group: '+markup);
}
const receipt={suite:'ignored-template-reference-activation-2.21.4',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Correcting an ignored key cannot introduce an uncollected reference');
