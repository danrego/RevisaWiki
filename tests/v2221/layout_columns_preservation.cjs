'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{load}=require('./layout_talk_repairs_harness.cjs');
const api=load({proseColumns:true}),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',sectionOnly:false,autoPreview:false,registryDoiCheck:false},sha=x=>crypto.createHash('sha256').update(x).digest('hex');let checks=0;const rows=[];
const list=Array.from({length:11},(_,i)=>'* [https://example.org/obra'+i+'?id='+i+' Obra preservada '+i+'] no [[Projeto de exemplo]]'+(i===10?' do {{séc|XX}}.':'.')).join('\n'),source='Texto preservado.\n\n== Ligações externas ==\n'+list+'\n';
const eq=(a,b,label)=>{checks++;assert.deepEqual(a,b,label);},ok=(value,label)=>{checks++;assert(value,label);};
for(const prefix of ['{{Colunas-lista|2|2=','{{Colunas-lista|1=2|2=','{{Colunas-lista|colunas=2|2=','{{colunas-lista|2=','{{Colunas-lista| 2 |2=']){
 const raw=prefix+'\n'+list+'\n}}',target=source.replace(list,raw);
 eq(api.v2221LayoutProseColumns(raw),'\n'+list+'\n','The explicit native body is read without rewriting');
 eq(api.lostWords(api.plainProse(source),api.plainProse(target)).length,0,'Visible linked prose and nested century remain present');
 eq(api.preservationAudit(source,target,cfg).length,0,'An exact native wrapper does not manufacture missing prose');
 const tampered=target.replace('Obra preservada 4','Obra alterada 4');
 ok(api.preservationAudit(source,tampered,cfg).some(item=>item.code==='lost-prose'),'Actually removed visible words remain rejected');
 const plan=api.v2221LayoutColumnsPlan(source,cfg);ok(api.v2221LayoutColumnsProof(source,plan.text,plan,cfg),'Actual source-bound column plan retains its proof');
 eq(api.v2221LayoutColumnsProof(source,tampered,plan,cfg),false,'A changed list is not covered by the real plan');
 rows.push({id:'native-explicit-body-'+rows.length,sourceSha256:sha(source),outputSha256:sha(target)});
}
const simple='* Texto preservado\n* Outro item';eq(api.v2221LayoutProseColumns('{{Colunas-lista|2|\n'+simple+'\n}}'),'\n'+simple+'\n','An actual anonymous body without equals is retained');rows.push({id:'unambiguous-anonymous-body'});
for(const raw of ['{{Outro modelo|2|2='+list+'}}','{{Colunas-lista|{{Número}}|2='+list+'}}','{{Colunas-lista|2|2='+list+'|2=Outro}}','{{Colunas-lista|2|3='+list+'}}','{{Colunas-lista|2|2='+list+'|campo=desconhecido}}','{{Colunas-lista|30em|2='+list+'}}','{{Colunas-lista|2|\n* [https://example.org/?id=1 Obra]\n}}']){eq(api.v2221LayoutProseColumns(raw),null,'Unproved or ambiguous native arguments are not guessed');rows.push({id:'unproved-arguments-'+rows.length});}
if(process.env.REVISAWIKI_CURRENT_CORE){
 const input='== Ver também ==\n* [[Tema relacionado]]\n\n'+source+'\n{{Commonscat|Example}}\n{{Wikiquote|Example}}\n{{Portal3|Ciência}}\n{{Controle de autoridade}}\n[[Categoria:Exemplos]]\n',first=api.calculate({kind:'adjust',source:input,originalSource:input,options:cfg});
 ok(api.v219AutomaticResultSafety(input,first).accepted,'The actual complete action passes every guard');eq(api.preservationAudit(input,first.text,cfg).length,0,'Independent preservation accepts the exact complete source');ok(!api.safeComposition(input,first.text,cfg),'Independent composition is retained');
 ok(first.text.indexOf('{{Commonscat|Example}}')<first.text.indexOf('== Ligações externas =='),'The sister box moves on the first execution');ok(first.text.includes('{{Colunas-lista|2|2='),'The qualifying resource list receives native columns');ok(first.text.indexOf('{{Controle de autoridade}}')<first.text.indexOf('{{Portal3|'),'Existing authority order is correct on the first execution');
 const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});eq(second.text,first.text,'No second click is needed');eq(api.v211RetainedAdjustments(first.text,second.text,[],cfg).count,0,'An unchanged repeat has zero adjustments');
 rows.push({id:'actual-full-action-first-click-and-replay',sourceSha256:sha(input),outputSha256:sha(first.text)});
}
const report={suite:'native-column-body-prose-preservation',cases:rows.length,checks,passed:true,actualBundle:!!process.env.REVISAWIKI_CURRENT_CORE,rows,proseGuardsRemoved:false,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
