'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),
    core=process.env.REVISAWIKI_CURRENT_CORE,sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.ok(core,'Select the candidate with REVISAWIKI_CURRENT_CORE');
const a=require(path.resolve(core)),cfg={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false},failures=[];
let cases=0,checks=0;
function eq(actual,expected,label){checks++;if(actual!==expected)failures.push({label,actual,expected});}
const marks=['.',',',';',':','!','?'],bodies=['Fonte literal.','{{citar web|url=https://example.org|titulo=Fonte}}','Fonte com [[ligação|rótulo]], 123.'],
    attrs=['',' name="a"'," name='a'",' name=a',' group="nota"',' name="a" group="nota"'],gaps=['',' ','\t'];
for(const mark of marks)for(const body of bodies)for(const attr of attrs)for(const gap of gaps)for(const length of [1,2,3]){
    const refs=Array.from({length},(_,i)=>'<ref'+attr.replace(/name=(?:"a"|'a'|a)/,'name="n'+i+'"')+'>'+body+' '+i+'</ref>').join(gap),
        source='Texto '+(cases+1)+refs+mark+'\n{{Referências}}',expected='Texto '+(cases+1)+mark+refs+'\n{{Referências}}',
        c={...cfg,automaticIdenticalReferences:false},p=a.v2216ReferencePlan(source,c),id='punctuation-'+cases++;
    eq(p.text,expected,id);eq(a.v2216ReferenceProof(source,p.text,p,c),true,id+' proof');
    const original=a.v2216ReferenceGraph(source).refs.map(r=>r.body),current=a.v2216ReferenceGraph(p.text).refs.map(r=>r.body);
    eq(JSON.stringify(original),JSON.stringify(current),id+' raw bodies');
}
for(const tag of ['nowiki','pre','source','syntaxhighlight'])for(const mark of marks)for(const body of bodies){
    const source='<'+tag+'>Texto<ref>'+body+'</ref>'+mark+'\n{{Reflist|2}}</'+tag+'>',p=a.v2216ReferencePlan(source,cfg);cases++;
    eq(p.text,source,'protected-'+tag+'-'+mark+'-'+sha(body).slice(0,6));
}
for(const alias of ['datali','li','ligação inativa','ligação inactiva','urlmorta','dead-url','deadurl','url-status','urlstatus']){
    for(const value of ['no','live','yes','dead','outubro de 2025']){
        const source='Texto.<ref>{{citar web|url=https://example.org|titulo=Fonte|'+alias+'='+value+'}}{{Ligação inativa|data=outubro de 2026}}</ref>\n{{Referências}}';cases++;
        eq(a.v2216ReferencePlan(source,cfg).text,source,'conflicting-status-'+alias+'-'+value);
    }
}
for(const date of ['outubro de 2026','1 de novembro de 2026','2026-11-04','novembro 2026'])for(const model of ['citar web','Citar jornal'])for(const gap of gaps){
    const cite='{{'+model+'|url=https://example.org/a|titulo=Fonte|wayb=https://web.archive.org/web/20261104/https://example.org/a|acessodata=2026-11-04}}',
        source='Texto.<ref>'+cite+gap+'{{Ligação inativa|data='+date+'|bot=robô}}</ref>\n{{Referências}}',p=a.v2216ReferencePlan(source,cfg);cases++;
    eq(p.text,'Texto.<ref>'+cite.slice(0,-2)+'|datali='+date+'}}</ref>\n{{Referências}}','dead-link-literal-date-'+model+'-'+date+'-'+JSON.stringify(gap));
    eq(a.v2216ReferenceProof(source,p.text,p,cfg),true,'dead-link proof');
    eq(p.text.includes('https://web.archive.org/web/20261104/https://example.org/a'),true,'archive byte preservation');
}
for(const differing of [' ','\n','{{!}}','&amp;','í','i']){
    const source='Texto.<ref>Fonte A</ref> Outro.<ref>Fonte A'+differing+'</ref>\n{{Referências}}';cases++;
    eq(a.v2216ReferencePlan(source,cfg).text,source,'different-body-'+JSON.stringify(differing));
}
const mutationSource='Texto.<ref>{{citar web|url=https://example.org|titulo=Fonte}}{{Ligação inativa|data=outubro de 2026}}</ref>\n{{Referências}}',plan=a.v2216ReferencePlan(mutationSource,cfg);
for(const [needle,replacement]of [['example.org','example.net'],['Fonte','Título inventado'],['outubro de 2026','novembro de 2026'],['{{Referências}}','']]){
    const changed=plan.text.replace(needle,replacement),forged=JSON.parse(JSON.stringify(plan));forged.text=changed;cases++;
    eq(a.v2216ReferenceProof(mutationSource,changed,forged,cfg),false,'mutation-'+needle);
}
const receipt={suite:'reference-generated-properties-2.21.6',runtimeSha256:sha(fs.readFileSync(core)),cases,checks,failures};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({suite:receipt.suite,cases,checks,failures}));assert.equal(failures.length,0,'Generated syntax variations preserve source identities and opaque scopes');
