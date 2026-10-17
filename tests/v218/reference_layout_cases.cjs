'use strict';
// Literal synthetic fixtures keep editorial research outside the public suite.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),
    assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),helperFile=path.join(root,'src/v2_18/reference_layout.js'),
    helper=fs.readFileSync(helperFile,'utf8'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const explicit=process.argv.slice(2).filter(value=>!value.startsWith('--'));
const files=explicit.length?explicit.map(value=>path.resolve(value)):
    ['RevisaWiki_v2_17_0.js','RevisaWiki_v2_17_0_completo.js'].map(name=>path.join(root,'dist/2.17.0',name));
const names=['v218GeneratedReferenceStyle','v218ReferenceLayoutScope','v218ReferenceColumnPlans',
    'v218ReferenceLayoutEdits','v218ReferenceLayoutPlan','v218ReferenceLayoutProof'];
function load(file){
    const bytes=fs.readFileSync(file),native=require(file);
    if(names.every(name=>typeof native[name]==='function'))return {api:native,preview:false,bytes};
    let source=bytes.toString('utf8'),marker='    const api = {';
    assert.equal(source.split(marker).length,2,'The immutable runtime has one export boundary');
    source=source.replace('function v211ReferenceColumnPlans(source,options={},legacyOnly=false) {',
        'function v218PreviousReferenceColumnPlans(source,options={},legacyOnly=false) {');
    assert.ok(source.includes('function v218PreviousReferenceColumnPlans('),'The preview delegates one original column planner');
    source=source.replace(marker,helper+'\n    function v211ReferenceColumnPlans(source,options={},legacyOnly=false) {return v218ReferenceColumnPlans(source,options,legacyOnly);}\n'+
        marker+names.join(',')+',');
    const nativeRequire=createRequire(file),freshRequire=request=>{
        if(/^\.\/RevisaWiki_.*_dados\.js$/.test(request)){
            const dataModule={exports:{}},dataSource=fs.readFileSync(path.resolve(path.dirname(file),request),'utf8');
            vm.runInNewContext(dataSource,{module:dataModule,exports:dataModule.exports},{timeout:30000});
            return dataModule.exports;
        }
        return nativeRequire(request);
    };
    const sandbox={module:{exports:{}},exports:{},require:freshRequire,__dirname:path.dirname(file),
        __filename:file,console,Buffer,setTimeout,clearTimeout,TextEncoder,URL};
    vm.runInNewContext(source,sandbox,{filename:path.basename(file)+'.local-preview',timeout:30000});
    return {api:sandbox.module.exports,preview:true,bytes};
}
const report={kind:'responsive-reference-layout',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),
    helperSha256:sha(helper),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,message)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),message);},
    ok=(value,message)=>{report.checks++;assert.ok(value,message);};
const canonical='column-count:2;column-width:30em;column-gap:2em;max-width:62em;';
const references=count=>Array.from({length:count},(_,index)=>'Fato '+index+'.<ref name="fonte-'+index+'">Fonte literal '+index+'.</ref>').join('\n');
for(const file of files){
    const {api,preview,bytes}=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,
        pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,biographyPortal:false,
        automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false,minorBaseConfirmed:true};
    report.bundles.push({bundle,runtimeVersion:api.version,runtimeSha256:sha(bytes),bytes:bytes.length,
        sourceStable:true,helperPreview:preview});
    function test(id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){
        report.status='failed';report.failures.push({bundle,id,message:error.message});report.cases.push({bundle,id,status:'failed'});}}
    const apply=(source,override={})=>api.v218ReferenceLayoutPlan(source,{...cfg,...override}),
        calculate=(source,override={})=>api.calculate({kind:'adjust',source,options:{...cfg,...override}});
    for(const count of [0,1,9,10,11,13,80])test('no-inline-columns-added-'+count,()=>{
        const source=references(count)+'\n\n{{Referências}}';eq(apply(source).text,source,'A native renderer receives no forced inline layout');
        eq(api.referenceColumnPlans(source,cfg),[],'The installed public column planner does not reintroduce the removed style');
        const result=calculate(source);eq(result.text,source,'The complete adjustment action preserves the native renderer');
    });
    const generatedVariants=[canonical,canonical.slice(0,-1),' '+canonical+' ',
        ' max-width: 62em; column-gap: 2em; COLUMN-WIDTH: 30EM; column-count: 2; '];
    for(const [index,value]of generatedVariants.entries())test('complete-generated-footprint-'+index,()=>{
        ok(api.v218GeneratedReferenceStyle(value),'Only the complete four-property generated footprint is recognized');
        const before=references(13)+'\n\n{{Referências|estilo='+value+'}}',after=references(13)+'\n\n{{Referências}}',plan=apply(before);
        eq(plan.text,after,'The exact generated wrapper style is removed');eq(plan.edits.length,1,'One style field forms one operation');
        ok(api.v218ReferenceLayoutProof(before,after,plan,cfg),'The source-bound proof reproduces the exact endpoint');
        eq(apply(after).text,after,'The local plan is idempotent');eq(calculate(before).text,after,'The production adjustment pipeline reaches the same endpoint');
        eq(calculate(after).text,after,'The whole pipeline is idempotent');
        eq(api.preservationAudit(before,after,cfg),[],'The independent preservation guard retains reference payloads');
        eq(api.safeComposition(before,after,cfg),'','The selectable composition guard admits only the proved endpoint');
        const retained=api.v211RetainedAdjustments(before,after,[],cfg);
        eq(retained.exact,true,'The retained adjustment count has exact source witnesses');
        eq(retained.count,1,'Removing one generated style field counts as one adjustment');
        eq(api.summaryForTopics(api.summaryTopics(before,after)),'Ajustes de referências com RevisaWiki.','The edit summary names the actual reference-layout change');
        eq(api.minorEligibility(before,after,cfg).eligible,true,'The existing mechanical minor plan accepts the exact layout-only cleanup');
    });
    test('all-other-arguments-and-bank-remain-literal',()=>{
        const before='Fato.<ref name="a" group="nota" />\n{{Referências|título=Fontes e notas|nível=3|grupo=nota|estilolista=lower-alpha|refs=<ref name="a">Fonte literal.</ref>|extra=Texto extra.|estilo='+canonical+'}}',
            after=before.replace('|estilo='+canonical,'');
        eq(apply(before).text,after,'Group, heading, extra text, list type and the named-reference bank remain byte-identical');
        eq(calculate(before,{unifiedNotesReferences:false}).text,after,'The source-bound cleanup works with a grouped reference bank');
    });
    test('explicit-native-fifth-argument',()=>{
        const before='{{Referências|1=Fontes|2=3|5='+canonical+'}}';
        eq(apply(before).text,'{{Referências|1=Fontes|2=3}}','Removing an explicitly numbered fifth parameter cannot renumber later arguments');
    });
    const custom=[
        'column-count:2;', 'column-width:30em;',canonical+'color:red;', 'color:red;'+canonical,
        canonical.replace('62em','70em'),canonical.replace('30em','35em'),canonical.replace('2em','1em'),
        canonical.replace('column-count:2','column-count:3'),canonical+'column-count:2;',canonical+';',
        canonical+'/* comentário */',canonical.replace('column-count:2','column-count:{{{n|2}}}'),
        canonical.replace('62em','62em!important'),canonical.replace('column-count','-moz-column-count'),
        canonical.replace('column-count:2','columns:2'),canonical.replace('column-width:30em;',''),
        canonical.replace(';column-width',';\ncolumn-width'),canonical.replace('column-count:2','column-count:02')
    ];
    for(const [index,value]of custom.entries())test('custom-style-is-preserved-'+index,()=>{
        eq(api.v218GeneratedReferenceStyle(value),false,'A different or expanded style cannot authorize the generated-style repair');
        const source='{{Referências|estilo='+value+'}}';eq(apply(source).text,source,'The complete custom style retains its bytes');
    });
    const ambiguous=[
        '{{Referências|estilo='+canonical+'|estilo='+canonical+'}}',
        '{{Referências|estilo='+canonical+'|5=}}',
        '{{Referências|estilo=|5='+canonical+'}}',
        '{{Referências|Fontes|2|Texto|Outro|'+canonical+'|Sexto}}',
        '{{Referências|style='+canonical+'}}',
        '{{Referências|ESTILO='+canonical+'}}',
        '{{Notas|estilo='+canonical+'}}',
        '{{Notas e referências|estilo='+canonical+'}}',
        '{{Reflist|estilo='+canonical+'}}',
        '{{Outra|{{Referências|estilo='+canonical+'}}}}',
        '<div>{{Referências|estilo='+canonical+'}}</div>',
        '{|\n| {{Referências|estilo='+canonical+'}}\n|}',
        '{{Referências|estilo='+canonical+'}}\n{{Incompleta',
        '<nowiki>{{Referências|estilo='+canonical+'}}</nowiki>',
        '<pre>{{Referências|estilo='+canonical+'}}</pre>',
        '<syntaxhighlight lang="wikitext">{{Referências|estilo='+canonical+'}}</syntaxhighlight>',
        '<!-- {{Referências|estilo='+canonical+'}} -->'
    ];
    for(const [index,source]of ambiguous.entries())test('unproved-or-protected-context-'+index,()=>{
        eq(apply(source).text,source,'An unproved template, container, duplicate field or protected source is preserved');
    });
    for(const [key,value]of [['namespaceNumber',1],['namespaceNumber',10],['namespaceNumber',2],['sectionOnly',true],
        ['contentModel','javascript'],['referenceColumns',false],['references',false]])test('scope-'+key+'-'+String(value),()=>{
        const source='{{Referências|estilo='+canonical+'}}';eq(apply(source,{[key]:value}).text,source,'Disabled or nonarticle scopes preserve the original bytes');
    });
    test('literal-legacy-columns-can-be-removed-without-changing-custom-style',()=>{
        const source='{{Referências|col=2|largcol=30em|estilo=color:red;|grupo=nota|refs=<ref name="a">Fonte literal.</ref>}}',
            plans=api.v218ReferenceColumnPlans(source,cfg,true);
        eq(plans.length,1,'Ignored legacy arguments form one bounded template transaction');
        eq(plans[0].after,'{{Referências|estilo=color:red;|grupo=nota|refs=<ref name="a">Fonte literal.</ref>}}','All native payload arguments and the full custom style remain exact');
        eq(plans[0].proof.changeRules.length,2,'Both removed literal fields have separate count witnesses');
    });
    test('source-and-output-tampering-is-refused',()=>{
        const source=references(13)+'\n{{Referências|estilo='+canonical+'}}',plan=apply(source),after=plan.text;
        eq(api.v218ReferenceLayoutProof(source,after.replace('Fonte literal 2','Fonte alterada 2'),plan,cfg),false,'The proof cannot conceal reference-content edits');
        eq(api.v218ReferenceLayoutProof(source+' ',after,plan,cfg),false,'A plan cannot authorize a different input snapshot');
        eq(api.v218ReferenceLayoutProof(source,after,{...plan,sourceHash:'wrong'},cfg),false,'A stale or forged source digest cannot authorize the repair');
    });
    eq(sha(fs.readFileSync(file)),sha(bytes),'The runtime file remains immutable during the suite');
}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
