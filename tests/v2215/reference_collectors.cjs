'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-11-03'};
let checks=0,calculations=0;const failures=[],rows=[];
function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({label,actual,expected});}}
const base='Texto<ref name="fonte">Fonte.</ref>\n';
const positive=[
 ['native-bare',base+'== Referências ==\n<references/>',base+'{{Referências}}'],
 ['native-spaced',base+'==Referências==\n<references />',base+'{{Referências}}'],
 ['native-paired',base+'== Referências ==\n<references>\n</references>',base+'{{Referências}}'],
 ['native-existing-heading-level',base+'=== Referências ===\n<references/>',base+'{{Referências|nível=3}}'],
 ['native-no-heading',base+'<references/>',base+'{{Referências}}'],
 ['native-no-heading-disabled',base+'<references/>',base+'{{Referências|nível=0}}',{headings:false}],
 ['native-group-no-heading-disabled',base+'<references group="nota"/>',base+'{{Referências|grupo=nota|nível=0}}',{headings:false,automaticReferenceCollectorHeadings:false}],
 ['native-group-no-heading-collector-disabled',base+'<references group="nota"/>',base+'{{Referências|grupo=nota|nível=0}}',{automaticReferenceCollectorHeadings:false}],
 ['notelist-no-heading-disabled','Texto{{Nre|Nota.}}\n{{Notelist}}','Texto{{Nre|Nota.}}\n{{Notas|nível=0}}',{headings:false}],
 ['reflist-no-heading-disabled',base+'{{Reflist}}',base+'{{Referências|nível=0}}',{headings:false}],
 ['explicit-level-zero-alias',base+'{{references|nível=0}}',base+'{{Referências|nível=0}}',{headings:false,automaticReferenceCollectorHeadings:false}],
 ['explicit-level-zero-alias-group',base+'{{referencias|grupo=nota|nível=0}}',base+'{{Referências|grupo=nota|nível=0}}',{headings:false,automaticReferenceCollectorHeadings:false}],
 ['native-empty-group',base+'<references group=""/>',base+'{{Referências}}'],
 ['native-literal-non-note-group',base+'<references group="bibliografia"/>',base+'{{Referências|grupo=bibliografia}}'],
 ['grouped-native-reference-heading',base+'== Referências ==\n<references group="bibliografia"/>',base+'{{Referências|grupo=bibliografia}}'],
 ['grouped-alias-reference-heading',base+'== Referências ==\n{{referencias|grupo=bibliografia}}',base+'{{Referências|grupo=bibliografia}}'],
 ['grouped-native-heading-disabled',base+'== Referências ==\n<references group="bibliografia"/>',base+'== Referências ==\n{{Referências|grupo=bibliografia|nível=0}}',{headings:false}],
 ['grouped-native-heading-level',base+'=== Referências ===\n<references group="bibliografia"/>',base+'{{Referências|grupo=bibliografia|nível=3}}'],
 ['grouped-native-collector-option-disabled',base+'== Referências ==\n<references group="bibliografia"/>',base+'== Referências ==\n{{Referências|grupo=bibliografia|nível=0}}',{automaticReferenceCollectorHeadings:false}],
 ['grouped-alias-bank-retained',base+'== Referências ==\n{{referencias|grupo=bibliografia|refs=<ref name="outra">Outra fonte.</ref>}}',base+'== Referências ==\n{{Referências|grupo=bibliografia|refs=<ref name="outra">Outra fonte.</ref>}}'],
 ['canonical-case',base+'{{referências}}',base+'{{Referências}}'],
 ['unaccented-alias',base+'{{referencias}}',base+'{{Referências}}'],
 ['singular-valid-alias',base+'{{Referência}}',base+'{{Referências}}'],
 ['english-alias',base+'{{References}}',base+'{{Referências}}'],
 ['verified-reference-alias',base+'{{Listaref}}',base+'{{Referências}}'],
 ['combined-case-misspelling',base+'{{Notas e Referências}}',base+'{{Notas e referências}}'],
 ['verified-notes-alias','Texto{{Nre|Nota.}}<ref>Fonte.</ref>\n{{Listanota}}\n\n{{Referências}}','Texto{{Nre|Nota.}}<ref>Fonte.</ref>\n{{Notas e referências}}'],
 ['local-reflist',base+'{{Reflist}}',base+'{{Referências}}'],
 ['known-spelling',base+'{{refereencias}}',base+'{{Referências}}'],
 ['heading-native-alias',base+'==Referências==\n{{referencias}}',base+'{{Referências}}'],
 ['header-with-bank',base+'{{referencias|refs=<ref name="outra">Outra fonte.</ref>}}',base+'{{Referências|refs=<ref name="outra">Outra fonte.</ref>}}'],
 ['explicit-disabled-heading',base+'== Referências ==\n<references/>',base+'== Referências ==\n{{Referências|nível=0}}',{headings:false}],
 ['duplicate-simple',base+'<references/>\n{{Reflist}}',base+'{{Referências}}\n'],
 ['duplicate-three',base+'<references/>\n{{Reflist}}\n{{referências}}',base+'{{Referências}}\n\n'],
 ['duplicate-disabled-headings',base+'<references group="nota"/>\n<references group="nota"/>',base+'{{Referências|grupo=nota|nível=0}}\n',{headings:false,endMatter:false,automaticReferenceCollectorHeadings:false}],
 ['duplicate-explicit-level-zero',base+'{{Referências|grupo=nota|nível=0}}\n{{Referências|grupo=nota|nível=0}}',base+'{{Referências|grupo=nota|nível=0}}\n']
];
const noteBase=(group='xyz')=>'Texto<ref group="'+group+'" name="n">Nota.</ref><ref name="fonte">Fonte.</ref>\n';
for(const group of ['note','xyz','explicação','N','grupo-especial','2026']){
 positive.push(['single-group-'+group,noteBase(group)+'== Notas ==\n<references group="'+group+'"/>\n\n== Referências ==\n<references/>',noteBase('nota')+'{{Notas e referências}}']);
 positive.push(['single-refn-'+group,'Texto{{refn|group='+group+'|Nota {{sfn|Livro|2000}}}}<ref>Fonte.</ref>\n== Notas ==\n<references group="'+group+'"/>\n\n{{referências}}','Texto{{refn|group=nota|Nota {{sfn|Livro|2000}}}}<ref>Fonte.</ref>\n{{Notas e referências}}']);
 positive.push(['single-tag-'+group,'Texto{{#tag:ref|A = B {{sfn|Livro|2000}}|group='+group+'}}<ref>Fonte.</ref>\n== Notas ==\n<references group="'+group+'"/>\n\n{{referências}}','Texto{{#tag:ref|A = B {{sfn|Livro|2000}}|group=nota}}<ref>Fonte.</ref>\n{{Notas e referências}}']);
}
positive.push(['single-reflist-note',noteBase('note')+'== Notas ==\n{{Reflist|group=note}}\n\n{{Reflist}}',noteBase('nota')+'{{Notas e referências}}']);
positive.push(['canonical-notes',noteBase('nota')+'{{Notas}}\n\n{{Referências}}',noteBase('nota')+'{{Notas e referências}}']);
positive.push(['combined-heading',noteBase('nota')+'== Notas e referências ==\n{{Notas}}\n\n{{Referências}}',noteBase('nota')+'{{Notas e referências}}']);
positive.push(['single-group-reuse',noteBase('xyz')+'Reutilização<ref name="n" group="xyz"/>\n== Notas ==\n<references group="xyz"/>\n\n{{Referências}}',noteBase('nota')+'Reutilização<ref name="n" group="nota"/>\n{{Notas e referências}}']);
positive.push(['notes-only','Texto<ref group="xyz">Nota.</ref>\n== Notas ==\n<references group="xyz"/>','Texto<ref group="nota">Nota.</ref>\n{{Notas}}']);
positive.push(['canonical-alpha-notelist','Texto{{Nre|Nota.}}<ref>Fonte.</ref>\n{{Notelist}}\n\n{{Referências}}','Texto{{Nre|Nota.}}<ref>Fonte.</ref>\n{{Notas e referências}}']);
positive.push(['opaque-producer-preserves-group','{{Modelo não certificado}}\n'+noteBase('xyz')+'== Notas ==\n<references group="xyz"/>\n\n== Referências ==\n<references/>','{{Modelo não certificado}}\n'+noteBase('xyz')+'{{Notas e referências|grupo=xyz}}']);
positive.push(['opaque-inside-note-preserves-group','Texto{{#tag:ref|Nota {{Modelo não certificado}}.|group=xyz}}<ref>Fonte.</ref>\n== Notas ==\n<references group="xyz"/>\n\n{{Referências}}','Texto{{#tag:ref|Nota {{Modelo não certificado}}.|group=xyz}}<ref>Fonte.</ref>\n{{Notas e referências|grupo=xyz}}']);
for(const[id,source,expected,delta]of positive){const options={...cfg,...delta},p=api.v2215ReferenceCollectorPlan(source,options);eq(p.text,expected,id);eq(api.v2215ReferenceCollectorProof(source,p.text,p,options),true,id+' proof');eq(api.v2215ReferenceCollectorPlan(p.text,options).text,p.text,id+' idempotence');eq(api.v2215ReferenceCollectorProof(source,p.text,{...p,sourceHash:'stale'},options),false,id+' stale proof');eq(api.v2215ReferenceCollectorProof(source,p.text+' ',p,options),false,id+' changed-output proof');rows.push({id,kind:'positive',edits:p.edits.length,sourceSha256:sha(source),candidateSha256:sha(p.text)});}
const inert=[
 ['opaque-code','<syntaxhighlight lang="wikitext">'+base+'== Referências ==\n<references/></syntaxhighlight>'],
 ['nowiki','<nowiki>'+base+'<references/></nowiki>'],
 ['comment','<!--'+base+'<references/>-->'],
 ['inline-collector',base+'prefixo <references/> sufixo'],
 ['collector-in-template','{{Exemplo|'+base+'<references/>}}'],
 ['collector-in-table','{|\n| '+base+'<references/>\n|}'],
 ['bank-native',base+'<references><ref name="outra">Outra fonte.</ref></references>'],
 ['grouped-native-bank-heading',base+'== Referências ==\n<references group="bibliografia"><ref name="outra">Outra fonte.</ref></references>'],
 ['grouped-responsive-native-heading',base+'== Referências ==\n<references group="bibliografia" responsive="0"/>'],
 ['responsive-native',base+'<references responsive="0"/>'],
 ['unknown-native-attribute',base+'<references foo="x"/>'],
 ['unknown-template',base+'{{Referencis}}'],
 ['unproved-typo-parameters',base+'{{refereencias|colunas=2}}'],
 ['reflist-layout',base+'{{Reflist|30em}}'],
 ['custom-notelist',base+'{{Notelist|group=upper-roman}}'],
 ['unfinished-native',base+'<references>'],
 ['separate-content-between','Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}\nTexto que não pode desaparecer.\n{{Referências}}'],
 ['distinct-groups','Texto<ref group="xyz">Nota.</ref><ref group="nota">Outra nota.</ref>\n== Notas ==\n<references group="xyz"/>\n\n{{Notas}}\n\n{{Referências}}'],
 ['two-custom-groups','Texto<ref group="xyz">Nota.</ref><ref group="abc">Outra nota.</ref>\n== Notas ==\n<references group="xyz"/>\n\n<references group="abc"/>\n\n{{Referências}}'],
 ['default-plus-custom-helper','Texto{{Nre|Nota.}}{{refn|group=xyz|Outra nota.}}\n== Notas ==\n<references group="xyz"/>\n\n{{Notas}}\n\n{{Referências}}'],
 ['unknown-group-producer','Texto<ref group="xyz">Nota.</ref>{{Modelo de teste|group=xyz}}\n== Notas ==\n<references group="xyz"/>\n\n{{Referências}}'],
 ['duplicate-banks-retained',base+'{{Referências|refs=<ref name="outra">Outra fonte.</ref>}}\n{{Referências|refs=<ref name="outra">Outra fonte.</ref>}}'],
 ['duplicate-layout-values-retained',base+'{{Referências|grupo=nota|nível=3}}\n{{Referências|grupo=nota|nível=3}}'],
 ['dynamic-group','Texto{{refn|group={{Grupo}}|Nota.}}\n== Notas ==\n<references group="xyz"/>'],
 ['custom-note-attributes','Texto<ref group="xyz" follow="outra">Nota.</ref>\n== Notas ==\n<references group="xyz"/>'],
 ['explicit-duplicate-anchor','Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>[[#Referências 2]]\n{{Notas}}\n\n{{Referências}}']
];
for(const[id,source]of inert){const p=api.v2215ReferenceCollectorPlan(source,cfg),expected=id==='two-custom-groups'?source.replace('<references group="abc"/>','{{Referências|grupo=abc}}'):id==='unknown-group-producer'?'Texto<ref group="xyz">Nota.</ref>{{Modelo de teste|group=xyz}}\n{{Notas e referências|grupo=xyz}}':id==='custom-note-attributes'?'Texto<ref group="xyz" follow="outra">Nota.</ref>\n{{Notas|grupo=xyz}}':source;eq(p.text,expected,id+' preserve exact source or independent group-equivalent collector');eq(api.v2215ReferenceCollectorProof(source,p.text,p,cfg),true,id+' deterministic no-op');rows.push({id,kind:'negative',sourceSha256:sha(source)});}
for(const delta of [{references:false},{namespaceNumber:1,discussionPage:true},{namespaceNumber:10},{contentModel:'javascript'},{sectionOnly:true},{pageRedirect:true},{pageDisambiguation:true}]){const s=base+'<references/>',p=api.v2215ReferenceCollectorPlan(s,{...cfg,...delta});eq(p.text,s,'disabled or non-article context');}
const notUnified={...cfg,unifiedNotesReferences:false},ns=noteBase('xyz')+'== Notas ==\n<references group="xyz"/>\n\n== Referências ==\n<references/>';
const np=api.v2215ReferenceCollectorPlan(ns,notUnified);eq(np.text,noteBase('xyz')+'== Notas ==\n<references group="xyz"/>\n\n{{Referências}}','disabled note unification keeps custom group but canonicalizes independent bibliography');
for(const[id,source,expected]of positive.filter(x=>!x[3]).filter((x,i)=>i<17||x[0]==='single-tag-note'||x[0]==='canonical-notes')){
 const r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(api.v219AutomaticResultSafety(source,r).accepted,true,id+' full safety');
 eq(r.text.includes('{{Referências')||r.text.includes('{{Notas'),true,id+' reaches complete writer');
 eq(r.preservation,[],id+' no preservation loss');
 const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});calculations++;
 eq(again.text,r.text,id+' complete idempotence');
 const candidate=api.v2215ReferenceCollectorPlan(source,cfg).text;
 if(candidate.includes('Fonte.')){const altered=candidate.replace('Fonte.','Outra fonte inventada.');eq(api.preservationAudit(source,altered,cfg).length>0,true,id+' changing bibliography remains rejected');}
 if(candidate.includes('Nota.')){const altered=candidate.replace('Nota.','Uma nota inventada.');eq(api.preservationAudit(source,altered,cfg).length>0,true,id+' changing note body remains rejected');}
}
for(const [source,delta]of [[base+'<references group="nota"/>',{headings:false,automaticReferenceCollectorHeadings:false}],[base+'{{references|nível=0}}',{headings:false,automaticReferenceCollectorHeadings:false}],['Texto{{Nre|Nota.}}\n{{Notelist}}',{headings:false}],['Texto.<ref group="nota">Nota literal.</ref>\n\n<references group="nota"/>\n<references group="nota"/>',{headings:false,endMatter:false,automaticReferenceCollectorHeadings:false,automaticIdenticalReferences:true}]]){
 const options={...cfg,...delta},r=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;
 eq(api.v219AutomaticResultSafety(source,r).accepted,true,'Headerless collector conversion remains source-verified');
 eq(r.text.includes('|nível=0}}'),true,'A disabled heading option never creates an automatic collector heading');
 eq(api.v2215ReferenceCollectorRows(r.text).rows.length,1,'Only one identical empty collector remains after normalization');
 const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options});calculations++;
 eq(again.text,r.text,'Explicit level zero stays intact on a second application');
}
const receipt={suite:'reference-collector-preferences-2.21.5',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Collector identity, grouping, content, and source ownership are retained');
