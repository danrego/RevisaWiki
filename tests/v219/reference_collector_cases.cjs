'use strict';
// Fictional examples exercise heading transactions without redistributing
// captured articles. A preview must be requested explicitly during development.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),
    assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),helperFile=path.join(root,'src/v2_19/reference_collectors.js'),
    helper=fs.readFileSync(helperFile,'utf8'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const args=process.argv.slice(2),previewAllowed=args.includes('--allow-preview'),
    files=args.filter(value=>!value.startsWith('--')).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const names=['v219NativeReferenceCollectorAlias','v219NativeCollectorGroupCall','v219NativeCollectorGroupEdits',
    'v219NativeCollectorGroupPlan','v219NativeCollectorGroupProof','v219NativeCollectorGroups',
    'v219ReferenceCollectorScope','v219ReferenceCollectorFragment','v219ReferenceCollectorTargeted',
    'v219ReferenceCollectorGap','v219ReferenceCollectorDefault','v219ReferenceCollectorNoHeadingCall',
    'v219ReferenceCollectorHeadings','v219ReferenceCollectorEdits','v219ReferenceCollectorPlan','v219ReferenceCollectorProof'];
function load(file) {
    const bytes=fs.readFileSync(file),native=require(file);
    if(names.every(name=>typeof native[name]==='function'))return {api:native,preview:false,bytes};
    assert.ok(previewAllowed,'A final run requires the installed helper exports; previews need --allow-preview');
    const source=bytes.toString('utf8'),marker='    const api = {';
    assert.equal(source.split(marker).length,2,'One immutable runtime export boundary');
    const nativeRequire=createRequire(file),freshRequire=request=>{
        if(/^\.\/RevisaWiki_.*_dados\.js$/.test(request)) {
            const module={exports:{}};
            vm.runInNewContext(fs.readFileSync(path.resolve(path.dirname(file),request),'utf8'),{module,exports:module.exports},{timeout:30000});
            return module.exports;
        }
        return nativeRequire(request);
    };
    const sandbox={module:{exports:{}},exports:{},require:freshRequire,__dirname:path.dirname(file),__filename:file,
        console,Buffer,setTimeout,clearTimeout,TextEncoder,URL};
    const preview=source.replace("if(!/^[Rr]eferências$/.test(head))return result;",
        'if(!v219NativeReferenceCollectorAlias(head))return result;');
    vm.runInNewContext(preview.replace(marker,helper+'\n'+marker+names.join(',')+','),sandbox,
        {filename:path.basename(file)+'.explicit-local-preview',timeout:30000});
    return {api:sandbox.module.exports,preview:true,bytes};
}
const report={kind:'reference-collector-section-tree',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),
    helperSha256:sha(helper),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,message)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),message);},
    ok=(a,message)=>{report.checks++;assert.ok(a,message);};
const lead='Fato com fonte.<ref name="fonte-a">Fonte A.</ref>\nOutro fato.<ref name="fonte-b">Fonte B.</ref>\n\n',
    notes='<div class="references"><references group="n"/></div>',
    bibliography='* {{Citar livro|autor=Autoria literal|título=Livro de exemplo|ano=2024|isbn=9780123456786}}',
    suffix='\n\n== Ligações externas ==\n* [https://example.invalid/ Página de exemplo]\n',
    sample=lead+'== Referências ==\n\n=== Notas ===\n'+notes+'\n\n=== Bibliografia ===\n'+bibliography+'\n\n{{Referências}}'+suffix,
    expected=lead+'== Notas ==\n'+notes+'\n\n== Bibliografia ==\n'+bibliography+'\n\n{{Referências}}'+suffix;
for(const file of files) {
    const {api,preview,bytes}=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,
        pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,minorBaseConfirmed:true,
        authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,
        registryDoiCheck:false};
    report.bundles.push({bundle,runtimeVersion:api.version,runtimeSha256:sha(bytes),bytes:bytes.length,helperPreview:preview,sourceStable:true});
    const plan=(source,override={})=>api.v219ReferenceCollectorPlan(source,{...cfg,...override});
    let endpointEvidence=[];
    function recordEndpoint(source,expected,options,calculated,intent) {
        eq(calculated.text,expected,'An independently specified complete-action endpoint must match exactly');
        const optionsSha256=sha(JSON.stringify(Object.fromEntries(Object.entries(options).sort(([a],[b])=>a.localeCompare(b))))),
            sourceSha256=sha(source),expectedEndpointSha256=sha(expected);
        endpointEvidence.push({evidenceKind:'actual-full-action-exact-endpoint',scenario:intent,sourceSha256,expectedEndpointSha256,
            actualEndpointSha256:sha(calculated.text),
            optionsSha256,intentSha256:sha(JSON.stringify({kind:'adjust',intent,sourceSha256,expectedEndpointSha256,optionsSha256})),
            appliedRuleIds:[...new Set((calculated.changes||[]).map(change=>change.id))],
            actualChanges:(calculated.changes||[]).map(({id,count})=>({id,count}))});
    }
    function test(id,fn) {endpointEvidence=[];try{fn();report.cases.push({bundle,id,status:'passed',
        evidenceKind:endpointEvidence.length?'actual-full-action-exact-endpoint':'helper-or-invariant-only',fullActionEvidence:endpointEvidence});}catch(error){report.status='failed';
        report.failures.push({bundle,id,message:error.message});report.cases.push({bundle,id,status:'failed',fullActionEvidence:endpointEvidence});}}
    function positive(id,source,after,count) {test(id,()=>{
        const isolated={...cfg,endSectionOrder:false,endMatterColumns:false,markup:false,automaticProseGaps:false,automaticTableRepairs:false},
            result=api.v219ReferenceCollectorPlan(source,isolated);eq(result.text,after,'Only the exact parent/child heading bytes change');
        eq(result.edits.length,count,'Each removed or promoted heading is a separate operation');
        ok(result.edits.every(edit=>edit.proof.retainedReferencePayloads&&edit.proof.changeRules.length===1),
            'Every heading edit binds a complete reference-retention transaction');
        eq(new Set(result.edits.map(edit=>edit.proof.transaction)).size,1,'All headings form one atomic source transaction');
        ok(api.v219ReferenceCollectorProof(source,after,result,isolated),'The exact source-bound endpoint is proved');
        eq(plan(after).text,after,'The helper is idempotent');
        eq(api.preservationAudit(source,after,isolated),[],'The independent content/reference guard retains the payloads');
        eq(api.safeComposition(source,after,isolated),'','The reference composition guard admits the literal hierarchy repair');
        if(!preview) {
            const calculated=api.calculate({kind:'adjust',source,options:isolated}),
                canonical=after.replace(/\{\{[^{}\r\n]*\}\}/g,raw=>api.v219ReferenceCollectorDefault(raw)?'{{Referências}}':raw);
            eq(calculated.text,canonical,'The actual adjustment applies the heading transaction and the existing exact native default-name normalization');
            recordEndpoint(source,canonical,isolated,calculated,'literal reference parent removal, exact child promotions and native default collector alias');
            eq(api.calculate({kind:'adjust',source:calculated.text,options:isolated}).text,
                calculated.text,'The complete pipeline is idempotent');
            eq(calculated.preservation,[],'The pipeline reports no content-retention failure');
            const combined=api.calculate({kind:'adjust',source,options:cfg});
            ok(combined.text!==source,'The normal complete action reaches the heading repair without isolated options');
            eq(api.v219ReferenceCollectorPlan(combined.text,cfg).edits,[],
                'The normal complete result has no remaining redundant reference parent');
            eq(api.preservationAudit(source,combined.text,cfg),[],
                'Normal gap, layout and end-section stages compose with the heading transaction');
            eq(api.safeComposition(source,combined.text,cfg),'',
                'The default pipeline admits only the combined source-proved operations');
            eq(api.calculate({kind:'adjust',source:combined.text,options:cfg}).text,combined.text,
                'The complete default action is idempotent');
        }
    });}
    function negative(id,source,override={}) {test(id,()=>{
        eq(plan(source,override).text,source,'An unproved heading tree keeps every source byte');
        eq(plan(source,override).edits,[],'The local plan adds no speculative repair or alert');
    });}
    positive('two-native-subsections',sample,expected,3);
    test('default-native-heading-order-and-one-blank-gap',()=>{
        const after=lead+'== Notas ==\n'+notes+'\n\n{{Referências}}\n\n== Bibliografia ==\n'+bibliography+suffix,
            out=api.calculate({kind:'adjust',source:sample,options:cfg});
        eq(out.text,after,'The native headful collector precedes uncited bibliography and the removed parent leaves one blank line');
        recordEndpoint(sample,after,cfg,out,'native style order, reference collector flow and one plain boundary gap');
        eq(api.calculate({kind:'adjust',source:out.text,options:cfg}).text,after,'The native section order needs no second click');
        eq(api.preservationAudit(sample,out.text,cfg),[],'All bibliography and note contents remain intact');
        eq(api.safeComposition(sample,out.text,cfg),'','The source-proved collector and bibliography move composes safely');
    });
    for(const marker of ['<ref>Fonte da obra.</ref>','{{sfn|Autoria|2024}}','{{nota|Nota da obra.}}','<span>Texto literal.</span>','__TOC__'])test('bibliography-flow-veto-'+sha(marker).slice(0,12),()=>{
        const source=sample.replace(bibliography,bibliography+marker),p=api.v219ReferenceCollectorPlan(source,cfg);
        ok(!p.edits.some(edit=>edit.proof.operation==='uncited-bibliography-after-native-collector'),
            'References, protected markup, note calls and dynamic controls cannot cross the native collector');
    });

    for(const eol of ['\n','\r\n'])for(const title of ['Referências','referências','REFERÊNCIAS'])
        for(const collector of ['{{Referências}}','{{referências}}','{{Referencias}}','{{References}}',
            '{{Referência}}','{{Referencia}}','{{Predefinição:References}}','{{Template:Referencia}}','{{ Referências }}']) {
            const source=sample.replace('== Referências ==','== '+title+' ==').replace('{{Referências}}',collector).replace(/\n/g,eol),
                after=expected.replace('{{Referências}}',collector).replace(/\n/g,eol);
            positive('literal-variant-'+report.cases.length,source,after,3);
        }
    for(const child of ['Notas','Bibliografia']) {
        const body=child==='Notas'?notes:bibliography,source=lead+'== Referências ==\n\n=== '+child+' ===\n'+body+'\n\n{{Referências}}'+suffix,
            after=lead+'== '+child+' ==\n'+body+'\n\n{{Referências}}'+suffix;
        positive('one-child-'+child,source,after,2);
    }
    positive('comment-gap-preserved',sample.replace('== Referências ==\n','== Referências ==\n<!-- Comentário literal. -->\n'),
        expected.replace(lead,lead+'<!-- Comentário literal. -->\n\n'),3);
    positive('literal-bibliography-links',sample.replace(bibliography,
        '* {{Link|1=pt|2=https://example.invalid/|3=Documento}}\n'+bibliography),
        expected.replace(bibliography,'* {{Link|1=pt|2=https://example.invalid/|3=Documento}}\n'+bibliography),3);
    positive('native-group-and-reference-bank-retained',sample.replace(notes,
        '<references group="n"><ref name="nota">Texto literal.</ref></references>'),
        expected.replace(notes,'<references group="n"><ref name="nota">Texto literal.</ref></references>'),3);
    positive('headingless-native-note-template',sample.replace(notes,'{{Referências|nível=0|grupo=n}}'),
        expected.replace(notes,'{{Referências|nível=0|grupo=n}}'),3);
    positive('complete-bibliography-column-wrapper',sample.replace(bibliography,
        '{{Div col|colunas=2}}\n'+bibliography+'\n{{Div col fim}}'),
        expected.replace(bibliography,'{{Div col|colunas=2}}\n'+bibliography+'\n{{Div col fim}}'),3);
    positive('same-hierarchy-at-eof',sample.replace(suffix,''),expected.replace(suffix,''),3);
    const earlierTable='== Quadro ==\n{| class="wikitable sortable"; text-align:right; font-size:80%;"\n'+
        '|+ style="font-size:120%" |Quadro de exemplo\n|-\n! coluna\n|-\n| Dado {{nota de rodapé|grupo=n|Nota do dado.}}\n|}\n\n';
    positive('full-source-context-after-earlier-attribute-quote',earlierTable+sample,earlierTable+expected,3);
    const changes=[
        ['introductory-prose',s=>s.replace('== Referências ==\n','== Referências ==\nTexto de apresentação.\n')],
        ['arbitrary-child',s=>s.replace('=== Notas ===','=== Fontes primárias ===')],
        ['third-child',s=>s.replace('=== Bibliografia ===','=== Bibliografia ===\nTexto.\n=== Notas ===')],
        ['deeper-child',s=>s.replace('=== Bibliografia ===','==== Bibliografia ====')],
        ['duplicate-child',s=>s.replace('=== Bibliografia ===','=== Notas ===')],
        ['no-child',s=>s.replace(/=== (Notas|Bibliografia) ===\n/g,'')],
        ['only-raw-renderer',s=>s.replace('{{Referências}}','<references/>')],
        ['native-headingless-final',s=>s.replace('{{Referências}}','{{Referências|nível=0}}')],
        ['native-explicit-level',s=>s.replace('{{Referências}}','{{Referências|nível=2}}')],
        ['native-level-alias',s=>s.replace('{{Referências}}','{{Referências|2=2}}')],
        ['native-explicit-title',s=>s.replace('{{Referências}}','{{Referências|título=Referências}}')],
        ['native-group-final',s=>s.replace('{{Referências}}','{{Referências|grupo=n}}')],
        ['native-definition-bank-final',s=>s.replace('{{Referências}}','{{Referências|refs=<ref name="x">Fonte X.</ref>}}')],
        ['foreign-no-heading-final',s=>s.replace('{{Referências}}','{{Reflist}}')],
        ['combined-final',s=>s.replace('{{Referências}}','{{Notas e referências}}')],
        ['duplicate-final-collector',s=>s.replace('{{Referências}}','{{Referências}}\n{{Referências}}')],
        ['separate-default-list',s=>s.replace(lead,lead+'{{Referências}}\n')],
        ['intermediate-reference',s=>s.replace('{{Referências}}','{{Referências}}\nFato posterior.<ref>Outra fonte.</ref>')],
        ['trailing-prose',s=>s.replace('{{Referências}}','{{Referências}}\nTexto posterior.')],
        ['inline-final',s=>s.replace('{{Referências}}','Texto {{Referências}}')],
        ['unknown-expansion',s=>s.replace(bibliography,bibliography+'\n{{Modelo desconhecido}}')],
        ['unknown-uppercase-native-looking-expansion',s=>s.replace(bibliography,bibliography+'\n{{CITAR LIVRO|título=Livro}}')],
        ['unknown-uppercase-link-expansion',s=>s.replace(bibliography,bibliography+'\n{{LINK|1=pt|2=https://example.invalid/|3=Documento}}')],
        ['unknown-uppercase-note-expansion',s=>s.replace(notes,'{{NOTAS|nível=0}}')],
        ['native-heading-note-template',s=>s.replace(notes,'{{Notas}}')],
        ['native-custom-note-template',s=>s.replace(notes,'{{Notas|título=Outras notas|nível=0}}')],
        ['unclosed-column-wrapper',s=>s.replace(bibliography,'{{Div col}}\n'+bibliography)],
        ['stray-column-close',s=>s.replace(bibliography,bibliography+'\n{{Div col fim}}')],
        ['crossing-column-wrapper',s=>s.replace('=== Notas ===','=== Notas ===\n{{Div col}}').replace(bibliography,bibliography+'\n{{Div col fim}}')],
        ['nested-column-wrapper',s=>s.replace(bibliography,'{{Div col}}\n{{Div col}}\n'+bibliography+'\n{{Div col fim}}\n{{Div col fim}}')],
        ['dynamic-citation-title',s=>s.replace('Livro de exemplo','{{Modelo de título}}')],
        ['generated-citation-heading',s=>s.replace('Livro de exemplo','Livro\n== Subtítulo ==\n')],
        ['dynamic-link-call',s=>s.replace(bibliography,'{{Link|url={{Endereço}}|título=Documento}}')],
        ['unclosed-source-tail',s=>s+'\n{{Incompleta'],
        ['unclosed-reference',s=>s.replace('</ref>','')],
        ['unclosed-comment',s=>s+'\n<!--'],
        ['explicit-local-fragment',s=>s.replace(lead,lead+'[[#Referências_2|Ir às referências]]\n')],
        ['encoded-local-fragment',s=>s.replace(lead,lead+'[[#Refer%C3%AAncias_2|Ir às referências]]\n')],
        ['legacy-local-fragment',s=>s.replace(lead,lead+'[[#Refer.C3.AAncias_2|Ir às referências]]\n')],
        ['entity-local-fragment',s=>s.replace(lead,lead+'[[#Refer&#234;ncias_2|Ir às referências]]\n')],
        ['named-entity-local-fragment',s=>s.replace(lead,lead+'[[#Refer&ecirc;ncias_2|Ir às referências]]\n')],
        ['malformed-percent-outside-encoded-fragment',s=>s.replace(lead,lead+'Endereço: https://example.invalid/%.\n[[#Refer%C3%AAncias_2|Ir às referências]]\n')],
        ['malformed-percent-outside-legacy-fragment',s=>s.replace(lead,lead+'Endereço: https://example.invalid/%zz.\n[[#Refer.C3.AAncias_2|Ir às referências]]\n')],
        ['double-encoded-local-fragment',s=>s.replace(lead,lead+'[[#Refer%25C3%25AAncias_2|Ir às referências]]\n')],
        ['explicit-anchor',s=>s.replace(lead,lead+'{{Âncora|Referências_2}}\n')],
        ['explicit-id',s=>s.replace(lead,lead+'<span id="Referências_2"></span>\n')],
        ['quoted-whole-tree',s=>'"'+s+'"'],
        ['comment-whole-tree',s=>'<!--\n'+s+'\n-->'],
        ['literal-whole-tree',s=>'<nowiki>\n'+s+'\n</nowiki>'],
        ['table-whole-tree',s=>'{|\n|\n'+s+'\n|}'],
        ['container-whole-tree',s=>'<div>\n'+s+'\n</div>'],
        ['template-whole-tree',s=>'{{Modelo|conteúdo=\n'+s+'\n}}'],
        ['blockquote-whole-tree',s=>'<blockquote>\n'+s+'\n</blockquote>'],
        ['quote-template-whole-tree',s=>'{{Citação|\n'+s+'\n}}'],
        ['unclosed-quote-prefix',s=>'Texto "aberto\n'+s],
        ['manual-duplicate-heading-elsewhere',s=>'== Referências ==\nTexto.\n== Corpo ==\n'+s],
        ['another-level-reference-heading',s=>'=== Referências ===\nTexto.\n== Corpo ==\n'+s]
    ];
    for(const [id,change]of changes)negative(id,change(sample));
    for(const [key,value]of [['references',false],['headings',false],['automaticReferenceCollectorHeadings',false],
        ['namespaceNumber',1],['namespaceNumber',2],['namespaceNumber',10],['sectionOnly',true],
        ['discussionPage',true],['pageRedirect',true],['pageDisambiguation',true],['contentModel','javascript'],
        ['syntaxRepairs',false],['structuralRepairs',false]])negative('scope-'+key+'-'+value,sample,{[key]:value});
    const aliases=['Referências','referências','Referencias','referencias','References','references',
        'Referência','referência','Referencia','referencia'];
    for(const prefix of ['', 'Predefinição:', 'Template:', ' Predefinição : '])for(const alias of aliases)
        for(const group of ['0','n','nota','Nota','grupo com espaços'])test('native-collector-alias-group-'+report.cases.length,()=>{
            const name=prefix+alias,raw='{{'+name+'|group='+group+'}}',direct=api.v212CollectorGroupCall(raw,cfg),
                expected=raw.replace('|group=','|grupo='),source='Fato.<ref group="'+group+'">Fonte literal.</ref>\n'+raw;
            ok(api.v219NativeReferenceCollectorAlias(name),'Only a pinned native name enables the group-field repair');
            eq(direct.text,expected,'The direct field repair preserves the accepted native alias and every value');
            eq(direct.changes.length,1,'One literal group-field spelling is one adjustment');
            const adjusted=api.calculate({kind:'adjust',source,options:{...cfg,unifiedNotesReferences:false}}),after=adjusted.text;
            ok(after.includes('|grupo='+group),'The complete action repairs the group on its first pass');
            eq(api.calculate({kind:'adjust',source:after,options:{...cfg,unifiedNotesReferences:false}}).text,after,
                'The complete action reaches an idempotent endpoint for every native alias');
            eq(api.referenceAudit(after,{shortCitationChecks:false}).filter(f=>f.severity==='error'),[],
                'A grouped reference never falls back to an ignored English-key default list');
            eq(api.preservationAudit(source,after,cfg),[],'The source-proved group-field repair retains the reference payload');
            eq(api.safeComposition(source,after,cfg),'','The alias repair composes with existing normalizations');
        });
    const refusedAliases=['REFERÊNCIAS','REFERENCES','ReferencEs','Referência bibliográfica','Reference',
        'Reflist','Referencias/Exemplo','Modelo:References','subst:References','constructor','toString','__proto__'];
    for(const name of refusedAliases)test('unknown-collector-alias-'+report.cases.length,()=>{
        eq(api.v219NativeReferenceCollectorAlias(name),null,'A similar-looking unproved name is not a native-alias contract');
        const raw='{{'+name+'|group=n}}';eq(api.v212CollectorGroupCall(raw,cfg).text,raw,
            'The native group-field rule does not reinterpret an unknown template');
    });
    for(const fields of ['|group=','|group=n|grupo=n','|group=n|grupo=','|group=n|group=n','|group={{Grupo}}',
        '|group=n|refs=<ref name="x">Fonte.</ref>','|group=n|refs={{Outra}}','|group=n|1=Texto',
        '|group=n|grupo=Nota','|group=n|título={{Título}}'])for(const alias of ['Referência','References','Referencias'])
        test('ambiguous-native-alias-fields-'+report.cases.length,()=>{
            const raw='{{'+alias+fields+'}}';eq(api.v212CollectorGroupCall(raw,cfg).text,raw,
                'Existing field collisions, blank groups, positional overrides and nested banks stay protected');
        });
    for(const alias of aliases)for(const group of ['0','n','nota','Nota','grupo com espaços'])for(const repeats of [2,3,5])
        test('identical-collector-group-transaction-'+report.cases.length,()=>{
            const raw='{{'+alias+('|group='+group).repeat(repeats)+'}}',expected='{{'+alias+'|grupo='+group+'}}',
                direct=api.v219NativeCollectorGroupCall(raw,cfg),source='Fato.<ref group="'+group+'">Fonte literal.</ref>\n'+raw,
                local=api.v219NativeCollectorGroupPlan(source,cfg);
            eq(direct.text,expected,'Only identical nonempty ignored group fields compose with the native group repair');
            eq(direct.changes.length,repeats,'Each duplicate removal and the surviving field repair count separately');
            eq(local.text,source.replace(raw,expected),'The staged projection changes only the one native collector');
            ok(api.v219NativeCollectorGroupProof(source,local.text,local,cfg),'The complete duplicate-plus-field transaction is source-bound');
            eq(api.v219NativeCollectorGroupPlan(local.text,cfg).text,local.text,'The source-bound group plan is idempotent');
            eq(api.v219NativeCollectorGroupCall(raw,{...cfg,automaticParameterDuplicates:false}).text,raw,
                'The duplicate-parameter preference remains an explicit gate');
            if(!preview) {
                const options={...cfg,unifiedNotesReferences:false},first=api.calculate({kind:'adjust',source,options});
                ok(first.text.includes('|grupo='+group),'The actual pipeline repairs the surviving field on its first pass');
                const completeExpected=['Referência','referência','Referencia','referencia'].includes(alias)?
                    expected.replace('{{'+alias,'{{Referências'):expected;
                recordEndpoint(source,source.replace(raw,completeExpected),options,first,
                    'identical duplicate ignored group fields, exact native grupo repair and existing literal obsolete-name alias');
                eq(api.calculate({kind:'adjust',source:first.text,options}).text,first.text,
                    'The complete duplicate-plus-native-field action is idempotent');
                eq(api.preservationAudit(source,first.text,options),[],'The independently checked reference payloads remain');
                eq(api.safeComposition(source,first.text,options),'','The complete group transaction composes safely');
            }
        });
    for(const fields of ['|group=n|group=','|group=|group=n','|group=n|group=nota','|group=|group=',
        '|group=n|group=n|grupo=n','|group=n|group=n|grupo=','|group=n|group=n|refs=<ref name="x">Fonte.</ref>',
        '|group=n|group=n|1=Texto','|group={{Grupo}}|group={{Grupo}}'])for(const alias of aliases)
        test('unproved-collector-duplicate-transaction-'+report.cases.length,()=>{
            const raw='{{'+alias+fields+'}}';eq(api.v219NativeCollectorGroupCall(raw,cfg).text,raw,
                'Unequal or blank duplicate values, native overrides and nested banks cannot enter the staged repair');
        });
    if(!preview)for(const alias of aliases)for(const fields of ['|group=n|group=','|group=|group=n',
        '|grupo=n|grupo=','|grupo=|grupo=n'])test('installed-empty-duplicate-precedence-'+report.cases.length,()=>{
            const source='{{'+alias+fields+'}}',first=api.calculate({kind:'adjust',source,options:cfg}),
                allowed=new Set([source,'{{Referências'+fields+'}}']);
            ok(allowed.has(first.text),'The actual writer must retain both unequal fields, including an explicit empty override');
            eq(api.calculate({kind:'adjust',source:first.text,options:cfg}).text,first.text,
                'Preserving native parameter precedence is idempotent');
            eq(api.preservationAudit(source,first.text,cfg),[],
                'The retained conflicting fields have no fabricated group repair');
        });
    const selectedValues=['','n','nota','Nota','nt','lower-alpha','custom','grupo com espaços'];
    for(const value of selectedValues)for(const prefix of ['', 'Predefinição:', 'Template:']) {
        test('current-combined-selector-'+report.cases.length,()=>{
            const raw='{{'+prefix+'Notas e referências|grupo='+value+'}}',contract=api.v219NativeCollectorGroups(raw),
                expected=[...new Set(['nota','lower-alpha',value,'nt',''])];
            eq(contract.groups,expected,'Only the current native selected group replaces its previous uppercase default');
            eq(contract.bankGroups,[''],'Combined-bank definitions belong to its common reference list only');
            eq(contract.nativeOldid,73218466,'The added selector is bound to the current native implementation');
            eq(contract.ambiguous,false,'Every tested selector is a literal case-sensitive native group');
            for(const group of ['nota','lower-alpha','Nota','n','nt','']) {
                const source='Fato.<ref'+(group?' group="'+group+'"':'')+'>Fonte literal.</ref>\n'+raw,
                    missing=api.referenceAudit(source,{shortCitationChecks:false}).filter(f=>f.code==='missing-renderer');
                if(!preview)eq(missing.length,expected.includes(group)?0:1,
                    'The installed audit cannot invent an uppercase default or hide a genuinely missing selected group');
            }
        });
        test('native-notes-selector-'+report.cases.length,()=>{
            const raw='{{'+prefix+'Notas|grupo='+value+'}}',contract=api.v219NativeCollectorGroups(raw);
            eq(contract.groups,[...new Set([value,'lower-alpha'])],'Native notes have their selected group and lower-alpha');
            eq(contract.bankGroups,[value],'A note bank defines names only in its first selected group');
        });
    }
    for(const raw of ['{{Notas e referências}}','{{Notas e referências|group=n}}'])test('combined-unchanged-native-default-'+report.cases.length,()=>{
        eq(api.v219NativeCollectorGroups(raw).groups,['nota','lower-alpha','Nota','nt',''],
            'An absent native selector retains every old default, while ignored English group cannot override it');
    });
    for(const raw of ['{{Notas e referências|grupo={{Grupo}}}}','{{Notas e referências|grupo=<nowiki>n</nowiki>}}'])
        test('dynamic-native-selector-'+report.cases.length,()=>{
            const contract=api.v219NativeCollectorGroups(raw);eq(contract.ambiguous,true,'A dynamic selector remains unconfirmed');
            eq(contract.groups,['nota','lower-alpha','nt',''],'Only the independently fixed native groups are confirmed');
            eq(contract.bankGroups,[''],'The common reference bank remains independent of the dynamic note selector');
        });
    for(const [raw,group]of [['{{Reflist|grupo=nota|group=n}}','n'],['{{Reflist|group=n|grupo=nota}}','n'],
        ['{{Reflist|grupo=nota|group=}}',''],['{{Reflist|group=n|group=Nota}}','Nota'],
        ['{{Referências|group=n}}',''],['{{References|group=n}}',''],['{{Referências|grupo=}}','']])
        test('exact-native-key-priority-'+report.cases.length,()=>{
            const contract=api.v219NativeCollectorGroups(raw);eq(contract.groups,[group],
                'Native group spelling, priority and explicit empty override are modeled exactly');
            eq(contract.bankGroups,[group],'The definition-bank group follows that same native selector');
        });
    if(!preview)test('fresh-current-combined-profile',()=>{
        const profile=api.templateCatalog['notas e referências'];eq(profile.oldid,73218466,
            'The current native implementation replaces the stale fixed-group profile');
        ok(profile.accepted.includes('grupo'),'The explicit group selector is now accepted by the recorded native profile');
    });
    // Every supported group remains a separate list. The new helper is a
    // heading-tree repair, never a license to merge lists with similar names.
    for(const group of ['', 'n','nota','Nota','nt','lower-alpha','upper-alpha','lower-roman','custom','custom-2']) {
        const source='Fato.<ref'+(group?' group="'+group+'"':'')+'>Texto literal.</ref>\n'+
            (group?'{{Referências|grupo='+group+'}}':'{{Referências}}');
        negative('single-valid-group-'+(group||'default'),source);
        negative('valid-separated-group-'+(group||'default'),source+'\nOutro fato.<ref'+(group?' group="'+group+'"':'')+
            '>Segundo texto literal.</ref>\n'+(group?'{{Referências|grupo='+group+'}}':'{{Referências}}'));
    }
    // Exercise the installed reference pipeline as well as the new heading
    // planner. Case-sensitive groups, list-defined banks and intermediate
    // collectors are independent contracts, even when a heading looks repeated.
    const groupNames=['','n','nota','Nota','nt','lower-alpha','upper-alpha','lower-greek','lower-roman','upper-roman','custom','custom-2'],
        nativeCollectors=['template','tag','tag-pair'],names=['a','A','fonte-1','citação','fonte_2'];
    function rendering(group,kind,bank='') {
        if(kind==='template')return '{{Referências'+(group?'|grupo='+group:'')+(bank?'|refs='+bank:'')+'}}';
        return '<references'+(group?' group="'+group+'"':'')+(bank?'>'+bank+'</references>':kind==='tag-pair'?'></references>':'/>');
    }
    for(const group of groupNames)for(const kind of nativeCollectors)for(const name of names) {
        const attr=(group?' group="'+group+'"':'')+' name="'+name+'"',source='Fato A.<ref'+attr+'>Fonte literal A.</ref>\n'+
            'Fato B.<ref'+attr+'/>\n'+rendering(group,kind),label='installed-group-identity-'+report.cases.length;
        test(label,()=>{
            const adjusted=api.calculate({kind:'adjust',source,options:{...cfg,unifiedNotesReferences:false}}),after=adjusted.text;
            eq(plan(source).edits,[],'A valid collector is outside the new heading transaction');
            eq(api.referenceAudit(after,{shortCitationChecks:false}).filter(f=>f.severity==='error'),[],
                'The complete pipeline keeps every named-reference definition and matching group');
            eq(api.preservationAudit(source,after,cfg),[],'The reference identity/payload preservation guard passes');
            eq(api.safeComposition(source,after,cfg),'','The complete result keeps a valid reference composition');
            eq(api.calculate({kind:'adjust',source:after,options:{...cfg,unifiedNotesReferences:false}}).text,after,
                'The full installed pipeline is idempotent for the collector family');
        });
        for(const bankKind of ['named','inherited'])test('installed-definition-bank-'+report.cases.length,()=>{
            const bank='<ref name="'+name+'"'+(bankKind==='named'&&group?' group="'+group+'"':'')+'>Fonte literal A.</ref>',
                source='Fato A.<ref'+attr+'/>\n'+rendering(group,kind,bank),
                adjusted=api.calculate({kind:'adjust',source,options:{...cfg,unifiedNotesReferences:false}}),after=adjusted.text;
            eq(api.referenceAudit(after,{shortCitationChecks:false}).filter(f=>f.severity==='error'),[],
                'Explicit or inherited reference-bank groups keep their definitions');
            eq(api.preservationAudit(source,after,cfg),[],'The definition-bank payloads are retained');
            eq(api.safeComposition(source,after,cfg),'','The bank composition has no introduced reference error');
            eq(api.calculate({kind:'adjust',source:after,options:{...cfg,unifiedNotesReferences:false}}).text,after,
                'The complete bank adjustment is idempotent');
        });
        test('installed-intermediate-list-'+report.cases.length,()=>{
            const first='Primeiro fato.<ref'+attr+'>Fonte da primeira parte.</ref>\n'+rendering(group,kind),
                second='Segundo fato.<ref'+attr+'>Fonte da segunda parte.</ref>\n'+rendering(group,kind),
                source=first+'\n\n== Segunda parte ==\n'+second,
                adjusted=api.calculate({kind:'adjust',source,options:{...cfg,unifiedNotesReferences:false}}),after=adjusted.text;
            eq(plan(source).edits,[],'Two literal list regions cannot become a redundant heading-tree repair');
            ok(after.includes('Fonte da primeira parte.')&&after.includes('Fonte da segunda parte.'),
                'Distinct definitions across list intervals are never discarded');
            eq(api.preservationAudit(source,after,cfg),[],'All region-specific reference definitions retain their data');
            eq(api.safeComposition(source,after,cfg),'','Intermediate collectors retain their composition');
        });
    }
    test('source-endpoint-and-proof-tampering',()=>{
        const result=plan(sample);ok(result.edits.length>0,'The source creates a nonempty heading transaction');
        for(const changed of [expected.replace('Fonte A.','Outra fonte.'),expected.replace('group="n"','group="m"'),
            expected.replace('fonte-a','outro-nome'),expected.replace('{{Referências}}',''),expected+'x'])
            eq(api.v219ReferenceCollectorProof(sample,changed,result,cfg),false,'A different payload or endpoint cannot reuse the heading proof');
        eq(api.v219ReferenceCollectorProof(sample+' ',expected,result,cfg),false,'A different source cannot reuse the proof');
        eq(api.v219ReferenceCollectorProof(sample,expected,{...result,sourceHash:'wrong'},cfg),false,'A forged source hash is refused');
        eq(api.v219ReferenceCollectorProof(sample,expected,{...result,edits:result.edits.slice(1)},cfg),false,'A partial transaction is refused');
        for(const value of [null,undefined,12,{},[]]) {
            eq(plan(value).text,value,'A nonstring input cannot become a source edit');
            eq(api.v219ReferenceCollectorProof(value,expected,result,cfg),false,'A nonstring proof source is refused without throwing');
            eq(api.v219ReferenceCollectorProof(sample,value,result,cfg),false,'A nonstring proof endpoint is refused without throwing');
        }
    });
    eq(sha(fs.readFileSync(file)),sha(bytes),'The runtime remains immutable throughout the suite');
}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
