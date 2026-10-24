'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),
    focused=process.argv.includes('--focused'),file=focused?null:path.resolve(process.argv[2]||process.env.REVISAWIKI_V221_BUNDLE||''),
    sha=value=>crypto.createHash('sha256').update(value).digest('hex');
let api,cases;
if(focused){const contracts=require('./citation_contracts.cjs');api=contracts.api;cases=contracts.cases;}
else{
    cases=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'citation_contracts.cjs'),'--fixture-cases'],
        {encoding:'utf8',timeout:30000,env:{...process.env,REVISAWIKI_V221_BUNDLE:file}})).cases;
    api=require(file);
}
const bundleSha=file?sha(fs.readFileSync(file)):null,cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',
    contentModel:'wikitext',v216CalendarUTC:'2026-10-22',autoPreview:false,registryDoiCheck:false,authorityControl:false,
    biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,referenceColumns:false,
    externalLinkColumns:false,endMatterColumns:false},results=[],failures=[],outside='\n\nTexto sobre [[Brasil|Brasil]].',
    outsideExpected='\n\nTexto sobre [[Brasil]].';
let checks=0,calculations=0,gates=0;
const wraps=[
    ['unknown-owner',raw=>'{{Modelo fictício|1='+raw+'}}'],
    ['unknown-owner-reference',raw=>'{{Modelo fictício|1=Texto.<ref>'+raw+'</ref>\n{{Referências}}}}'],
    ['native-unproved-field',raw=>'{{Info/Biografia|nome=Tema fictício|notas='+raw+'}}'],
    ['native-citation-argument',raw=>'{{Citar livro|título=Obra exterior|aspas='+raw+'}}'],
    ['quoted-owner',raw=>'{{Quotation|1='+raw+'}}'],
    ['nowiki',raw=>'<nowiki>'+raw+'</nowiki>'],
    ['code',raw=>'<code>'+raw+'</code>'],
    ['html',raw=>'<span>'+raw+'</span>'],
    ['html-attribute',raw=>'<span title="'+raw+'">Texto.</span>'],
    ['wikilink-label',raw=>'[[Tema|'+raw+']]'],
    ['external-label',raw=>'[https://example.invalid/ '+raw+']'],
    ['comment',raw=>'<!--'+raw+'-->']
];
// These six complete calls have independently reviewed native before/after
// pairs. The whole pipeline already repairs them in these precise contexts;
// the new producer remains conservative there. Do not infer other endpoints
// from a current calculate result or extend this by parameter similarity.
const legacyNativeEndpoints=Object.freeze({
    'editor-key-último-editor':{
        before:'{{Citar livro|título=Obra|último-editor=Silva}}',
        after:'{{Citar livro|título=Obra|editor-sobrenome=Silva}}',
        contexts:['html','wikilink-label','external-label']},
    'editor-key-editor-último':{
        before:'{{Citar livro|título=Obra|editor-último=Silva}}',
        after:'{{Citar livro|título=Obra|editor-sobrenome=Silva}}',
        contexts:['native-unproved-field','native-citation-argument','html','wikilink-label','external-label']},
    'editor-key-último-editor2':{
        before:'{{Citar livro|título=Obra|editor-sobrenome1=Anterior|último-editor2=Silva}}',
        after:'{{Citar livro|título=Obra|editor-sobrenome1=Anterior|editor-sobrenome2=Silva}}',
        contexts:['html','wikilink-label','external-label']},
    'legacy-urlaccess-registration':{
        before:'{{Citar web|url=https://example.invalid/a|título=Obra|urlaccess=registration}}',
        after:'{{Citar web|url=https://example.invalid/a|título=Obra|acessourl=registration}}',
        contexts:['html','wikilink-label','external-label']},
    'legacy-urlaccess-limited':{
        before:'{{Citar web|url=https://example.invalid/a|título=Obra|urlaccess=limited}}',
        after:'{{Citar web|url=https://example.invalid/a|título=Obra|acessourl=limited}}',
        contexts:['html','wikilink-label','external-label']},
    'legacy-urlaccess-subscription':{
        before:'{{Citar web|url=https://example.invalid/a|título=Obra|urlaccess=subscription}}',
        after:'{{Citar web|url=https://example.invalid/a|título=Obra|acessourl=subscrição}}',
        contexts:['html','wikilink-label','external-label']}
});
for(const row of cases){
    for(const [kind,wrap]of [['plain',raw=>raw],['ref',raw=>'Texto.<ref>'+raw+'</ref>\n{{Referências}}'],
        ['table',raw=>'{| class="wikitable"\n|-\n|'+raw+'\n|}']]){
        const source=wrap(row.before),plan=api.v221CitationPlan(source,cfg),record={id:row.id+'-'+kind,expectation:'qualified-positive'};
        checks++;if(!plan.text.includes(row.after))record.failure='qualified-repair-not-reached';
        checks++;if(!api.v221CitationPlanProof(source,plan.text,plan,cfg))record.failure='plan-proof-refused';
        if(!focused){
            const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg}),gate=api.v219AutomaticResultSafety(source,result);calculations++;gates++;
            record.accepted=gate.accepted===true;record.gate=gate;
            if(!record.accepted||!result.text.includes(row.after))record.failure='actual-qualified-repair-not-reached';
        }
        if(record.failure)failures.push(record);results.push(record);
    }
    for(const [kind,wrap]of wraps){
        const literal=wrap(row.before),source=literal+outside,record={id:row.id+'-'+kind,expectation:'literal-owner-preservation'};
        for(const name of ['v221CitationPlan','v221CitationHeaderPlan','v221CitationEditionAliasPlan']){
            checks++;if(api[name](source,cfg).text!==source)record.failure='producer-crossed-literal-owner:'+name;
        }
        checks++;if(api.v221CitationTitleRequests(source,cfg).length)record.failure='metadata-request-crossed-literal-owner';
        if(!focused){
            const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg}),gate=api.v219AutomaticResultSafety(source,result);calculations++;gates++;
            record.accepted=gate.accepted===true;record.gate=gate;
            const endpoint=legacyNativeEndpoints[row.id],qualified=endpoint?.before===row.before&&endpoint.contexts.includes(kind),
                expected=qualified?wrap(endpoint.after)+outsideExpected:literal+outsideExpected;
            record.qualifiedLegacyNativeEndpoint=qualified===true;
            if(!record.accepted||result.text!==expected)record.failure='actual-literal-owner-mutated-or-independent-fix-blocked';
        }
        if(record.failure)failures.push(record);results.push(record);
    }
}
const extraCalls=[
    ['header','{{Cite book|título=Obra|data-acesso=2024-01-01}}'],
    ['edition-duplicates','{{Citar livro|título=Obra|edicao=1ª ed.|edição=1ª ed.}}'],
    ['doi-title','{{Citar periódico|título=Exceptional boundary states at|c=1|periodico=Periódico|doi=10.1016/S0550-3213(01)00486-2}}'],
    ['missing-ref-quote','Texto.<ref name="fonte>Fonte.</ref> Reuso.<ref name=fonte />\n{{Referências}}'],
    ['curly-ref-name','Texto.<ref name="“fonte”">Fonte.</ref> Reuso.<ref name="fonte" />\n{{Referências}}']
];
for(const [id,raw]of extraCalls)for(const [kind,wrap]of wraps){
    const source=wrap(raw),record={id:id+'-'+kind,expectation:'all-entry-point-preservation'};
    for(const name of ['v221CitationPlan','v221CitationHeaderPlan','v221CitationEditionAliasPlan']){
        checks++;if(api[name](source,cfg).text!==source)record.failure='entry-point-crossed-literal-owner:'+name;
    }
    checks++;if(api.v221CitationTitleRequests(source,cfg).length)record.failure='metadata-request-crossed-literal-owner';
    if(record.failure)failures.push(record);results.push(record);
}
if(file&&sha(fs.readFileSync(file))!==bundleSha)throw Error('Candidate bytes changed during execution');
process.stdout.write(JSON.stringify({suite:'citation-source-owner-contexts',mode:focused?'source-module-with-saved-baseline-helpers':'actual-unmodified-candidate',
    version:api.version,bundleSha256:bundleSha,caseCount:results.length,checks,actualCalculateCalls:calculations,
    actualFinalGateCalls:gates,status:failures.length?'investigation-required':'passed',failures,results,
    scope:'Explicit complete references and native table cells are eligible; unproved enclosing templates, links, literal code and HTML remain unchanged. No browser/native claim.'},null,2)+'\n');
if(failures.length)process.exitCode=1;
