'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const scripts=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)];
const report={version:'2.10.0',kind:'independent-repair-group-boundary-adversarial-qa',status:'passed',cases:[],checks:0,failures:[],bundles:[],runnerSha256:sha(fs.readFileSync(__filename)),networkRequests:0,wikipediaWrites:0,evidence:'Finite source-derived table group subsets are exercised at object starts, ends, true EOF, neighboring tables and unknown tails. Accepted subsets must not introduce syntax errors or alter unselected content.'};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function test(bundle,name,fn){try{fn();report.cases.push({bundle,name,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,name,status:'failed'});report.failures.push({bundle,name,message:candidate?candidate.sanitized(error.message):String(error.message)});}}
const table=(label='Alfa',wide=false)=>'{| class="wikitable"'+(wide?' style="width:100%;min-width:72em;table-layout:fixed;"':'')+'\n! Nome !! Ano\n|-\n'+(wide?'':'|-\n')+'| '+label+' || Valor\n|}\n';
const errors=(api,source)=>{const out={};for(const issue of api.syntaxAudit(source))out[issue.code]=(out[issue.code]||0)+1;return out;};
for(const script of scripts){
    const api=require(script),bundle=path.basename(script),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',authorityControl:false,autoPreview:false,portals:false,dates:false,spelling:false,endTemplateOrder:false};
    report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(script)),version:api.version});
    function subsets(source){
        const plan=api.v210IndependentRepairPlan(source,cfg),originalErrors=errors(api,source);let accepted=0;
        eq(plan.groups.length<8,true,'The bounded fixture contains a small exact dependency graph');
        for(let mask=1;mask<(1<<plan.groups.length);mask++){
            const ids=plan.groups.filter((group,index)=>mask&(1<<index)).map(group=>group.id),text=api.v210IndependentProjection(plan,ids);
            eq(typeof text,'string','Every selected generated group projects to text');
            const proof=api.v210IndependentSubsetProof(source,text,cfg);
            if(!proof.accepted)continue;accepted++;
            const afterErrors=errors(api,text);for(const [code,count]of Object.entries(afterErrors))eq(count<=(originalErrors[code]||0),true,'A partial approved group cannot introduce '+code);
            eq(api.safeComposition(source,text,cfg),'','The production composition guard agrees with the accepted subset');
            eq(api.preservationAudit(source,text,cfg),[],'The production retention guard agrees with the accepted subset');
            eq(api.v210IndependentSubsetProof(source,text+'<div>',cfg).accepted,false,'A new unclosed container cannot borrow independent approval');
            eq(api.v210IndependentSubsetProof(source,text.replace('Valor','Outro valor'),cfg).accepted,false,'A changed data cell cannot borrow independent approval');
            const projectedAgain=api.v210IndependentProjection(plan,proof.groups);eq(projectedAgain,text,'The exact whole group selection reconstructs the accepted output');
        }
        return {plan,accepted};
    }
    for(const separator of ['', '\n','\nTexto entre tabelas.\n'])test(bundle,'two responsive wrappers stay paired '+JSON.stringify(separator),()=>{
        const source=table('Alfa',true)+separator+table('Beta',true),{plan}=subsets(source);
        eq(plan.groups.some(group=>group.kind==='table'),false,'A wrapper insertion at either table boundary prevents a table-only group');
        const openingOnly='<div style="max-width:100%;min-width:0;overflow-x:auto;">\n'+source;
        eq(api.v210IndependentSubsetProof(source,openingOnly,cfg).accepted,false,'The previously accepted unpaired opening wrapper is refused');
        eq(api.safeComposition(source,openingOnly,cfg).length>0,true,'The production guard also refuses the unpaired opening wrapper');
    });
    for(const order of ['wide-first','wide-last','wide-middle'])test(bundle,'wrapper and ordinary table groups '+order,()=>{
        const a=table('Alfa'),b=table('Beta'),wide=table('Larga',true),source=order==='wide-first'?wide+'\nTexto.\n'+a+'\n'+b:order==='wide-last'?a+'\n'+b+'\nTexto.\n'+wide:a+'\nTexto.\n'+wide+'\n'+b;
        const {plan,accepted}=subsets(source);eq(plan.groups.filter(group=>group.kind==='table').length,2,'Only the two wholly interior ordinary table repairs are independent');eq(accepted>0,true,'Safe ordinary table subsets remain available');
    });
    for(const tail of ['', '\nTexto final.', '\n{{Incompleta|valor=', '\n<ref>Fonte incompleta'])test(bundle,'table groups before exact EOF or unresolved tail '+sha(tail).slice(0,8),()=>{
        const source=table('Alfa')+'\nTexto.\n'+table('Beta')+tail,{plan}=subsets(source);
        for(const group of plan.groups.filter(group=>group.kind==='table')){const projected=api.v210IndependentProjection(plan,[group.id]);if(tail)eq(projected.endsWith(tail),true,'A selected complete table leaves the complete unrelated tail byte-exact');}
    });
    test(bundle,'unchanged references and protected examples remain dependency bound',()=>{
        const source=table('Alfa')+'\n<ref name="fonte">Obra preservada.</ref>\n{{Referências}}\n<nowiki>{| texto literal |}</nowiki>\n'+table('Beta'),{plan}=subsets(source);
        for(const group of plan.groups.filter(group=>group.kind==='table')){const text=api.v210IndependentProjection(plan,[group.id]);eq(text.includes('<ref name="fonte">Obra preservada.</ref>'),true,'An independent table never rewrites the interstitial named definition');eq(text.includes('<nowiki>{| texto literal |}</nowiki>'),true,'An independent table never rewrites the literal example');}
    });
    test(bundle,'unknown and duplicate group selections stay invalid',()=>{
        const source=table('Alfa')+'\n'+table('Beta'),plan=api.v210IndependentRepairPlan(source,cfg),id=plan.groups[0].id;
        eq(api.v210IndependentProjection(plan,['not-a-group']),null,'An unknown group is never a source-derived repair');eq(api.v210IndependentProjection(plan,[id,id]),null,'Repeated group IDs cannot duplicate an insertion');eq(api.v210IndependentProjection({...plan,sourceHash:'forged'},[id]),null,'A stale source digest cannot authorize a group');
    });
    test(bundle,'one changed draft never reuses an older table offset',()=>{
        api.v210ClearStructuralCache();const first=table('Alfa'),a=api.v210StructuralIndex(first),second='Cabeçalho diferente.\n\n'+first,b=api.v210StructuralIndex(second);
        eq(a.sourceLength,first.length,'The original index belongs to its exact source');eq(b.sourceLength,second.length,'The new index belongs to the changed source');eq(b.tables[0].start,second.indexOf('{|'),'The changed table start is independently derived');eq(a===b,false,'Different drafts never share a position object');eq(api.v210StructuralCacheStatus().accountingConsistent,true,'The cache accounts for both exact-source entries');
    });
}
const directory=candidate?candidate.artifactDirectory():path.resolve(process.env.REVISAWIKI_REPORT_DIR||'.');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'engine_adversarial.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.failures.length)process.exitCode=1;
