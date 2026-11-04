'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),core=process.env.REVISAWIKI_CURRENT_CORE;
assert.ok(core,'Select the candidate with REVISAWIKI_CURRENT_CORE');
const a=require(path.resolve(core)),sha=s=>crypto.createHash('sha256').update(s).digest('hex'),
    cfg={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false},failures=[],rows=[];
let checks=0;
function eq(actual,expected,id){checks++;try{assert.deepEqual(actual,expected);}catch{failures.push({id,actual,expected});}}
const cases=[
    {id:'named-punctuation',source:'Texto<ref name="a">Fonte</ref>.\n{{Referências}}',test:s=>s.includes('Texto.<ref')&&!s.includes('</ref>.')},
    {id:'named-chain',source:'Texto<ref name="a">Fonte A</ref><ref name="b">Fonte B</ref>.\n{{Referências}}',test:s=>s.includes('Texto.<ref')&&!s.includes('</ref>.')},
    {id:'inline-isolation',source:'Texto.<ref>Fonte</ref>{{Referências}}',test:s=>/<\/ref>\n\n?\{\{Referências/.test(s)},
    {id:'native-collector',source:'Texto.<ref>Fonte</ref>\n== Referências ==\n<references/>',test:s=>s.includes('{{Referências}}')&&!s.includes('== Referências ==')&&!s.includes('<references')},
    {id:'numbered-reflist',source:'Texto.<ref>Fonte</ref>\n== Referências ==\n{{Reflist|2}}',test:s=>s.includes('{{Referências}}')&&!/Reflist|== Referências ==/i.test(s)},
    {id:'notes-combination',source:'Texto.<ref>Fonte</ref><ref group="nota">Nota</ref>\n{{Notas}}\n{{Referências}}',test:s=>s.includes('{{Notas e referências}}')&&!s.includes('{{Notas}}')&&!s.includes('{{Referências}}')},
    {id:'dead-link-date',source:'Texto.<ref>{{Citar web|url=https://example.org|titulo=Fonte|wayb=https://web.archive.org/web/20260101/https://example.org}}{{Ligação inativa|data=outubro de 2026}}</ref>\n{{Referências}}',test:s=>s.includes('|datali=outubro de 2026')&&!s.includes('{{Ligação inativa')&&s.includes('https://web.archive.org/web/20260101/https://example.org')},
    {id:'infobox-independent-cleanup',source:'{{Info/Biografia|nome=Exemplo|ref=<ref>Interna</ref>}}\nTexto.<ref>{{citar web|url=https://example.org|titulo=Fonte}}</ref> Outro.<ref>{{citar web|url=https://example.org|titulo=Fonte}}</ref>\n{{Referências}}',test:s=>s.includes('Interna')&&a.v2216ReferenceGraph(s).refs.filter(r=>r.body?.includes('example.org')).length===1},
    {id:'adjacent-definition-reuse',source:'Texto.<ref name="a">Fonte</ref><ref name="a"/>\n{{Referências}}',test:s=>a.v2216ReferenceGraph(s).refs.length===1&&s.includes('Fonte')},
    {id:'opaque-helper-target-reserved',source:'Texto.<ref>Fonte</ref> Outro.<ref>Fonte</ref> {{Modelo desconhecido|referencia=ref-auto-1}}\n{{Referências}}',test:s=>s.includes('{{Modelo desconhecido|referencia=ref-auto-1}}')&&!a.v2216ReferenceGraph(s).refs.some(r=>r.name==='ref-auto-1')&&a.v2216ReferenceGraph(s).refs.filter(r=>r.body==='Fonte').length===1},
    {id:'dead-link-conflict-retained',source:'Texto.<ref>{{Citar web|url=https://example.org|titulo=Fonte|datali=outubro de 2025}}{{Ligação inativa|data=outubro de 2026}}</ref>\n{{Referências}}',test:s=>s.includes('outubro de 2025')&&s.includes('outubro de 2026')&&s.includes('Ligação inativa')}
];
for(const row of cases){
    const result=a.calculate({kind:'adjust',source:row.source,originalSource:row.source,options:cfg}),verdict=a.v219AutomaticResultSafety(row.source,result);
    eq(verdict.accepted,true,row.id+' accepted');eq(result.preservation||[],[],row.id+' source integrity');eq(row.test(result.text),true,row.id+' producer applied');
    const repeated=a.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});eq(repeated.text,result.text,row.id+' complete idempotence');
    rows.push({id:row.id,sourceSha256:sha(row.source),resultSha256:sha(result.text),edits:result.changes?.length??null});
}
const receipt={suite:'reference-full-calculation-2.21.6',runtimeSha256:sha(fs.readFileSync(core)),checks,rows,failures};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({suite:receipt.suite,checks,cases:rows.length,failures}));assert.equal(failures.length,0,'The final writer retains the independently proved reference edits');
