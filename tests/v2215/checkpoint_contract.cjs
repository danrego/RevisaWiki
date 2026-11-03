'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const core=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||'dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo de teste',contentModel:'wikitext',autoPreview:false,minorAllToolChanges:true},context='checkpoint-context';let checks=0,calculations=0;
const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const sources=[
 ['Texto<ref>Fonte.</ref>\n== Referências ==\n<references/>','Texto<ref>Fonte.</ref>\n{{Referências}}',2],
 ['Texto<ref group="xyz">Nota.</ref><ref>Fonte.</ref>\n== Notas ==\n<references group="xyz"/>\n\n== Referências ==\n<references/>','Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas e referências}}',5],
 ['[[Image:Example.jpg|thumb|Legenda literal.]]','[[Imagem:Example.jpg|miniatura|Legenda literal.]]',2]
];
for(const[source,expected,count]of sources){
 const job={kind:'adjust',source,originalSource:source,options:cfg,localSafetyOptionsSnapshot:JSON.stringify(cfg),localSafetyContext:context,v2215Checkpoint:true};
 const r=api.calculate(job);calculations++;eq(r.text,expected,'An early result is a complete transformation');
 eq(api.v219AutomaticResultSafety(source,r,context).accepted,true,'A source-bound preservation gate accepts the complete candidate');
 eq(r.preservation,[],'No preservation finding is suppressed');
 eq(api.v219BindLocalResultSafety(job,r).text,expected,'The real UI binder rederives the option and source proof');
 const retained=api.v211RetainedAdjustments(source,r.text,r.changes.map(c=>c.id),cfg);eq(retained.exact,true,'The count has complete source evidence');eq(retained.count,count,'Each changed original syntax component counts once');
 for(const row of retained.events){eq(Number.isSafeInteger(row.sourceAnchors[0].start),true,'Count source start is finite');eq(Number.isSafeInteger(row.sourceAnchors[0].end),true,'Count source end is finite');}
 const altered={...r,text:r.text.replace('Fonte.','Outra fonte.').replace('Legenda literal.','Outra legenda.').replace('Nota.','Outra nota.')};
 if(altered.text!==r.text)eq(api.v219AutomaticResultSafety(source,altered,context).accepted,false,'A changed value cannot reuse a complete result proof');
 eq(api.v219AutomaticResultSafety(source,r,context+'changed').accepted,false,'Another editor context cannot reuse the candidate');
 for(const delta of [{originalSource:source+'x'},{semanticHistory:{}},{explicitChoice:{}},{options:{...cfg,v2212OriginalDraftHash:'wrong'},localSafetyOptionsSnapshot:JSON.stringify({...cfg,v2212OriginalDraftHash:'wrong'})}]){
  const r2=api.calculate({...job,...delta});calculations++;eq(r2.text,source,'Unsupported historical or stale quick requests preserve the whole source');
 }
 const again=api.calculate({...job,source:r.text,originalSource:r.text});calculations++;eq(again.text,r.text,'A checkpoint is idempotent');
}
for(const[source,expected,count]of [
 ['{{Referências}}\n{{Referências}}','{{Referências}}',1],
 ['== Referências ==\n{{Referências}}','{{Referências}}',1],
 ['Texto<ref>Fonte.</ref>\n== Referências ==\n<references/>','Texto<ref>Fonte.</ref>\n{{Referências}}',2]
]){
 const p=api.v2215ReferenceCollectorPlan(source,cfg);eq(p.text.trim(),expected,'The intended collector transformation is exact');
 const c=api.v211RetainedAdjustments(source,p.text,[],cfg);eq(c.count,count,'An unchanged retained collector never counts as a correction');
 for(const e of c.events)for(const a of e.sourceAnchors){eq(a.end<=source.length,true,'Every count anchor ends inside source');if(e.kind==='reference-heading')eq(source.slice(a.start,a.end).includes('{{'),false,'A heading anchor excludes the following collector');}
}
const text='Texto sem reparos.';eq(api.calculate({kind:'adjust',source:text,originalSource:text,options:cfg,v2215Checkpoint:true}).text,text,'No-op quick analysis preserves all bytes');calculations++;
const report={version:'2.21.5',kind:'complete-checked-checkpoint-contract',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,networkRequests:0,wikipediaWrites:0,status:'passed'};console.log(JSON.stringify(report));
