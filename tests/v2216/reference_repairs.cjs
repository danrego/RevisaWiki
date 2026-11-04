'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const baselineFile=path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),
    sha=s=>crypto.createHash('sha256').update(s).digest('hex'),core=process.env.REVISAWIKI_CURRENT_CORE;
assert.equal(sha(fs.readFileSync(baselineFile)),'0e5d0f2377293ebbd863bed4a04762851ee409fae567ec1ffc5adb6e660fa92f','The comparison is the exact published baseline');
assert.ok(core,'Select the built candidate using REVISAWIKI_CURRENT_CORE');
const api=require(path.resolve(core)),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false},
    rows=[],failures=[];let checks=0;
function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({label,actual,expected});}}
function run(id,source,expected,options={}){
    const c={...cfg,...options},p=api.v2216ReferencePlan(source,c);eq(p.text,expected,id);
    eq(api.v2216ReferenceProof(source,p.text,p,c),true,id+' source-bound proof');
    eq(api.v2216ReferencePlan(p.text,c).text,p.text,id+' idempotence');
    eq(api.v2216ReferenceProof(source,p.text,{...p,sourceHash:'stale'},c),false,id+' stale source');
    eq(api.v2216ReferenceProof(source,p.text+'inventado',p,c),false,id+' output mutation');
    if(p.steps.length){const forged=JSON.parse(JSON.stringify(p));forged.steps[0].edits[0].text+='inventado';eq(api.v2216ReferenceProof(source,p.text,forged,c),false,id+' altered typed edit');}
    rows.push({id,sourceSha256:sha(source),candidateSha256:sha(p.text),steps:p.steps.map(s=>s.name),edits:p.edits.length});
}
const collector='\n{{Referências}}',body='{{citar web|url=https://example.org/fonte|titulo=Fonte|data=2026-01-01}}';
for(const mark of ['.',',',';',':','!','?']){
    run('anonymous-punctuation-'+mark,'Texto<ref>'+body+'</ref>'+mark+collector,'Texto'+mark+'<ref>'+body+'</ref>'+collector);
    run('named-punctuation-'+mark,'Texto<ref name="fonte">'+body+'</ref>'+mark+collector,'Texto'+mark+'<ref name="fonte">'+body+'</ref>'+collector);
    run('reused-punctuation-'+mark,'Antes.<ref name="fonte">'+body+'</ref>\nTexto<ref name="fonte" />'+mark+collector,'Antes.<ref name="fonte">'+body+'</ref>\nTexto'+mark+'<ref name="fonte" />'+collector);
    run('chain-punctuation-'+mark,'Texto<ref name="a">A</ref> <ref name="b">B</ref>'+mark+collector,'Texto'+mark+'<ref name="a">A</ref> <ref name="b">B</ref>'+collector);
}
run('linked-prose-punctuation','O [[tema]]<ref name="a">A</ref>.'+collector,'O [[tema]].<ref name="a">A</ref>'+collector);
run('quoted-prose-punctuation','"Texto"<ref>Fonte</ref>.'+collector,'"Texto".<ref>Fonte</ref>'+collector);
run('italic-prose-punctuation',"''Texto''<ref>Fonte</ref>."+collector,"''Texto''.<ref>Fonte</ref>"+collector);
run('parenthetical-prose-punctuation','Texto (explicação)<ref>Fonte</ref>.'+collector,'Texto (explicação).<ref>Fonte</ref>'+collector);
run('same-duplicate-punctuation','Texto.<ref>Fonte</ref>.'+collector,'Texto.<ref>Fonte</ref>'+collector);
run('pre-reference-horizontal-gap','Texto \t<ref>Fonte</ref>.'+collector,'Texto. \t<ref>Fonte</ref>'+collector);
run('inline-trailing-collector','Texto.<ref>Fonte</ref>{{Referências}}','Texto.<ref>Fonte</ref>\n\n{{Referências}}');
run('inline-raw-collector','Texto.<ref>Fonte</ref><references/>','Texto.<ref>Fonte</ref>\n\n{{Referências}}');
run('reflist-columns-two','Texto.<ref>Fonte</ref>\n== Referências ==\n{{Reflist|2}}','Texto.<ref>Fonte</ref>'+collector);
run('reflist-columns-one','Texto.<ref>Fonte</ref>\n{{Reflist|1}}','Texto.<ref>Fonte</ref>'+collector);
run('reflist-explicit-positional-two','Texto.<ref>Fonte</ref>\n{{Reflist|1=2}}','Texto.<ref>Fonte</ref>'+collector);
run('reflist-disabled-headings','Texto.<ref>Fonte</ref>\n{{Reflist|2}}','Texto.<ref>Fonte</ref>\n{{Referências|nível=0}}',{headings:false});
run('reflist-disabled-automatic-heading','Texto.<ref>Fonte</ref>\n{{Reflist|2}}','Texto.<ref>Fonte</ref>\n{{Referências|nível=0}}',{automaticReferenceCollectorHeadings:false});
run('inline-known-misspelling','Texto.<ref>Fonte</ref>{{refereencias}}','Texto.<ref>Fonte</ref>\n\n{{Referências}}');
run('combined-default','Texto<ref group="nota">Nota</ref><ref>Fonte</ref>\n{{Notas}}\n{{Referências}}','Texto<ref group="nota">Nota</ref><ref>Fonte</ref>\n{{Notas e referências}}');
run('combined-opaque-infobox','{{Info/Biografia|nome=Exemplo|ref=<ref>Interna</ref>}}\nTexto<ref group="nota">Nota</ref><ref>Fonte</ref>\n{{Notas}}\n{{Referências}}','{{Info/Biografia|nome=Exemplo|ref=<ref>Interna</ref>}}\nTexto<ref group="nota">Nota</ref><ref>Fonte</ref>\n{{Notas e referências}}');
run('adjacent-definition-reuse','Texto.<ref name="a">Fonte</ref><ref name="a"/>'+collector,'Texto.<ref name="a">Fonte</ref>'+collector);
run('adjacent-reuse-definition','Texto.<ref name="a"/><ref name="a">Fonte</ref>'+collector,'Texto.<ref name="a">Fonte</ref>'+collector);
run('adjacent-three-calls','Antes.<ref name="a">Fonte</ref>\nTexto.<ref name="a"/><ref name="a"/><ref name="a"/>'+collector,'Antes.<ref name="a">Fonte</ref>\nTexto.<ref name="a"/>'+collector);
run('separate-reuse-preserved','Antes.<ref name="a">Fonte</ref>Texto.<ref name="a"/>'+collector,'Antes.<ref name="a">Fonte</ref>Texto.<ref name="a"/>'+collector);
run('anonymous-equal-body','Texto.<ref>'+body+'</ref> Outro.<ref>'+body+'</ref>'+collector,'Texto.<ref name="ref-auto-1">'+body+'</ref> Outro.<ref name="ref-auto-1" />'+collector);
run('anonymous-reuse-disabled','Texto.<ref>'+body+'</ref> Outro.<ref>'+body+'</ref>'+collector,'Texto.<ref>'+body+'</ref> Outro.<ref>'+body+'</ref>'+collector,{automaticIdenticalReferences:false});
run('punctuation-disabled','Texto<ref>Fonte</ref>.'+collector,'Texto<ref>Fonte</ref>.'+collector,{refPunctuation:false});
run('combination-disabled','Texto.<ref group="nota">Nota</ref><ref>Fonte</ref>\n{{Notas}}\n{{Referências}}','Texto.<ref group="nota">Nota</ref><ref>Fonte</ref>\n{{Notas}}\n{{Referências}}',{unifiedNotesReferences:false});
run('anonymous-equal-plain-body','Texto.<ref>Fonte literal</ref> Outro.<ref>Fonte literal</ref>'+collector,'Texto.<ref name="ref-auto-1">Fonte literal</ref> Outro.<ref name="ref-auto-1" />'+collector);
run('anonymous-adjacent','Texto.<ref>'+body+'</ref><ref>'+body+'</ref>'+collector,'Texto.<ref name="ref-auto-1">'+body+'</ref>'+collector);
run('infobox-independent-reuse','{{Info/Biografia|nome=Exemplo|ref=<ref>Interna</ref>}}\nTexto.<ref>'+body+'</ref> Outro.<ref>'+body+'</ref>'+collector,'{{Info/Biografia|nome=Exemplo|ref=<ref>Interna</ref>}}\nTexto.<ref name="ref-auto-1">'+body+'</ref> Outro.<ref name="ref-auto-1" />'+collector);
for(const [id,helper]of [['opaque-key','{{Modelo desconhecido|referencia=ref-auto-1}}'],['opaque-positional','{{Modelo desconhecido|ref-auto-1}}'],['opaque-entity','{{Modelo desconhecido|referencia=&#114;ef-auto-1}}'],['known-helper','{{r|ref-auto-1}}']]){
    run('reserved-'+id,'Texto.<ref>Fonte</ref> Outro.<ref>Fonte</ref> '+helper+collector,'Texto.<ref name="ref-auto-2">Fonte</ref> Outro.<ref name="ref-auto-2" /> '+helper+collector);
}
eq(api.v2216ReferenceLiteralReservations('{{Modelo desconhecido|nome=Cafe\u0301|referencia=&#114;ef-auto-1}}').has('Café'),true,'Literal reservations normalize NFC');
eq(api.v2216ReferenceLiteralReservations('{{Modelo desconhecido|referencia=&#114;ef-auto-1}}').has('ref-auto-1'),true,'Literal reservations decode character entities');
run('bad-sibling-independent','Ruim.<ref name="x">Incompleta\n\nOutro.<ref>Fonte</ref>.\n{{Referências}}','Ruim.<ref name="x">Incompleta\n\nOutro.<ref>Fonte</ref>.\n{{Referências}}');
for(const kind of ['Citar web','citar jornal'])for(const gap of ['',' ','\t']){
    const cite='{{'+kind+'|url=https://example.org|titulo=Fonte|wayb=https://web.archive.org/web/20260101/https://example.org}}',marker='{{Ligação inativa|data=outubro de 2026}}';
    run('dead-link-'+kind+'-'+JSON.stringify(gap),'Texto.<ref>'+cite+gap+marker+'</ref>'+collector,'Texto.<ref>'+cite.slice(0,-2)+'|datali=outubro de 2026}}</ref>'+collector);
}
run('dead-link-same-date','Texto.<ref>{{Citar web|url=https://example.org|titulo=Fonte|datali=outubro de 2026}}{{Ligação inativa|data=outubro de 2026}}</ref>'+collector,'Texto.<ref>{{Citar web|url=https://example.org|titulo=Fonte|datali=outubro de 2026}}</ref>'+collector);
run('dead-link-citations-disabled','Texto.<ref>{{Citar web|url=https://example.org|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026}}</ref>'+collector,'Texto.<ref>{{Citar web|url=https://example.org|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026}}</ref>'+collector,{citations:false});
const inert=[
    ['already-punctuation','Texto.<ref>Fonte</ref>'],['differing-preceding-punctuation','Texto,<ref>Fonte</ref>.'],
    ['inline-collector-suffix','Texto {{Referências}} sufixo'],
    ['reference-bank','<references><ref name="a">Fonte</ref></references>'],
    ['positional-width','{{Reflist|30em}}'],['reflist-unknown','{{Reflist|2|foo=bar}}'],
    ['distinct-bodies','Texto.<ref>Fonte A</ref> Outro.<ref>Fonte B</ref>'],
    ['adjacent-distinct-groups','Texto.<ref name="a">A</ref><ref name="a" group="nota">A</ref>'],
    ['adjacent-conflicting-definition','Texto.<ref name="a">A</ref><ref name="a"/> Outro.<ref name="a">B</ref>'],
    ['missing-definition','Texto.<ref name="a"/><ref name="a"/>'],
    ['named-body-never-merge','Texto.<ref name="a">A</ref> Outro.<ref name="b">A</ref>'],
    ['infobox-reference-not-rewritten','{{Info/Biografia|nome=Exemplo|ref=<ref>A</ref> Outro<ref>A</ref>.}}'],
    ['separate-citation-regions','Texto.<ref>A</ref>\n{{Referências}}\nOutro.<ref>A</ref>'],
    ['dead-link-no-date','{{Citar web|url=https://example.org|titulo=Fonte}}{{Ligação inativa}}'],
    ['dead-link-conflicting-date','{{Citar web|url=https://example.org|titulo=Fonte|datali=outubro de 2025}}{{Ligação inativa|data=outubro de 2026}}'],
    ['dead-link-live-flag','{{Citar web|url=https://example.org|titulo=Fonte|dead-url=no}}{{Ligação inativa|data=outubro de 2026}}'],
    ['dead-link-status-flag','{{Citar web|url=https://example.org|titulo=Fonte|url-status=live}}{{Ligação inativa|data=outubro de 2026}}'],
    ['dead-link-invalid-uppercase-url','{{Citar web|URL=https://example.org|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026}}'],
    ['dead-link-invalid-uppercase-date','{{Citar web|url=https://example.org|titulo=Fonte|DATALI=outubro de 2026}}{{Ligação inativa|data=outubro de 2026}}'],
    ['dead-link-invalid-marker-date','{{Citar web|url=https://example.org|titulo=Fonte}}{{Ligação inativa|Data=outubro de 2026}}'],
    ['dead-link-invalid-url-value','{{Citar web|url=exemplo sem URL|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026}}'],
    ['dead-link-chapter-ambiguity','{{Citar web|url=https://example.org|capitulo-url=https://example.org/c|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026}}'],
    ['dead-link-own-url','{{Citar web|url=https://example.org|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026|url=https://example.org/other}}'],
    ['dead-link-unknown-useful-param','{{Citar web|url=https://example.org|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026|motivo=outro}}'],
    ['dead-link-unproved-citation-model','{{Citar livro|url=https://example.org|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026}}'],
    ['unified-separated-prose','{{Notas}}\nTexto que deve permanecer.\n{{Referências}}'],
    ['unified-bank','{{Notas|refs=<ref group="nota" name="n">Nota</ref>}}\n{{Referências}}']
];
for(const [id,s]of inert)run(id,s,s);
for(const value of ['no','não','live','false','n','sim','yes','data desconhecida','31 de fevereiro de 2026']){
    const s='Texto.<ref>{{Citar web|url=https://example.org|titulo=Fonte}}{{Ligação inativa|data='+value+'}}</ref>'+collector;
    run('invalid-dead-link-date-'+value,s,s);
}
for(const wrap of [s=>'<nowiki>'+s+'</nowiki>',s=>'<!--'+s+'-->',s=>'<pre>'+s+'</pre>',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>',s=>'```wikitext\n'+s+'\n```']){
    const s=wrap('Texto<ref name="a">Fonte</ref><ref name="a"/>.\n{{Reflist|2}}');run('protected-'+sha(s).slice(0,10),s,s);
}
for(const delta of [{references:false},{namespaceNumber:1,discussionPage:true},{namespaceNumber:10},{sectionOnly:true},{contentModel:'javascript'},{pageRedirect:true}]){
    const s='Texto<ref>Fonte</ref>.'+collector;run('disabled-'+JSON.stringify(delta),s,s,delta);
}
const control='Texto<ref name="a">Fonte</ref>.'+collector;
const baselineControl=JSON.parse(require('node:child_process').execFileSync(process.execPath,['-e',
    'const a=require('+JSON.stringify(baselineFile)+');console.log(JSON.stringify(a.v2215ReferenceCollectorPlan('+JSON.stringify(control)+','+JSON.stringify(cfg)+').text));'],{encoding:'utf8'}));
eq(baselineControl,control,'The published baseline does not perform the new punctuation repair');
const receipt={suite:'literal-reference-repairs-2.21.6',runtimeSha256:sha(fs.readFileSync(core)),checks,rows,failures};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({suite:receipt.suite,checks,cases:rows.length,failures}));assert.equal(failures.length,0,'Literal bodies, groups, names, collectors and opaque scopes remain protected');
