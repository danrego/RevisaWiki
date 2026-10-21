'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),inventoryPath=path.join(__dirname,'three_script_inventory.json'),inventory=JSON.parse(fs.readFileSync(inventoryPath)),args=process.argv.slice(2),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const originalAt=args.indexOf('--original-dir'),originalDir=originalAt>=0?path.resolve(args[originalAt+1]):null;if(originalAt>=0)args.splice(originalAt,2);
const files=args.filter(x=>!x.startsWith('--')).map(x=>path.resolve(x));if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'three-script-production-and-original-witnesses',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),inventorySha256:sha(fs.readFileSync(inventoryPath)),
    sourceRevisions:inventory.sources,declaredRules:inventory.declaredRules,activeRules:inventory.activeRules,matchingWitnesses:inventory.matchingWitnesses,
    dispositions:inventory.dispositionCounts,originalPureExecution:false,originalSources:[],bundles:[],cases:[],checks:0,failures:[],
    legacyGuardObservations:[],originalPipelines:0,originalPipelineDefects:[],originalValidation:[],
    originalPipelineScope:'Pinned pure text feature order and original iteration limits. Original brace validation is replayed separately in a capability-free stub; editor widgets, notification writes and submission code are never evaluated.',
    networkRequests:0,domWrites:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(e){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:e.message});}}
const config=api=>({...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
    authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false,
    referenceColumns:false,externalLinkColumns:false,endMatterColumns:false});
test('inventory','complete-entry-accounting',()=>{
    eq(inventory.rules.length,885,'The complete three-source declaration inventory has 885 entries');
    eq(inventory.rules.filter(x=>x.active).length,881,'Only 881 entries are in the source execution orders');
    eq(new Set(inventory.rules.map(x=>x.id)).size,885,'Every declaration has one anonymous stable identity');
    eq(inventory.rules.filter(x=>x.witness).length,884,'Every reachable declaration has a matching source witness');
    eq(inventory.rules.filter(x=>x.disposition==='inactive-source-draft').length,4,'Four inactive experiments remain separate');
    eq(inventory.rules.filter(x=>x.disposition==='unreachable-source-pattern').length,1,'One contradictory absolute-start pattern is recorded');
    ok(inventory.rules.every(x=>x.disposition&&x.reason),'Every entry states its audited boundary');
});
const frozenDate=class extends Date{constructor(...values){super(...(values.length?values:['2026-10-17T12:00:00Z']));}static now(){return Date.parse('2026-10-17T12:00:00Z');}};
if(originalDir){
    for(const source of inventory.sources){
        const file=path.join(originalDir,source.id+'_current.js'),raw=fs.readFileSync(file,'utf8'),id=source.id.slice(-1);
        test('original-'+id,'pinned-source-and-pure-definitions',()=>{
            eq(sha(raw),source.sha256,'The optional original source must equal its immutable recorded revision');
            const start=raw.indexOf(id==='b'?'const monthList =':'var mesesEn ='),end=raw.indexOf(id==='b'?'function replaceTextBox':'function validarSintaxePredefinicoes');
            ok(start>=0&&end>start,'Only the reviewed pure-definition slice is loaded');
            const pure=raw.slice(start,end);eq(/\b(?:require|process|fetch|XMLHttpRequest|importScripts)\s*[.(]/.test(pure),false,'No import, process or network operation is evaluated');
            const context=vm.createContext(Object.assign(Object.create(null),{Date:frozenDate}),{codeGeneration:{strings:false,wasm:false}});
            vm.runInContext('var novoEditor=false; var mw={notify:function(){throw Error("Unexpected UI")}};'+pure,context,{timeout:3000});
            if(id!=='b'){
                const validationStart=raw.indexOf('function validarSintaxePredefinicoes'),validationEnd=raw.indexOf('function subsTextoBox',validationStart);
                ok(validationStart>=0&&validationEnd>validationStart,'The original input validator is independently isolated from editor submission');
                vm.runInContext('var window={};var aviso=false;var localValidationWindow={document:{getElementById:function(){return {innerHTML:""}}}};'+raw.slice(validationStart,validationEnd),context,{timeout:3000});
            }
            report.originalSources.push({sourceId:source.id,sourceSha256:sha(raw),sourceOldid:source.oldid,definitionsOnly:true});
            for(const row of inventory.rules.filter(x=>x.sourceId===id))test('original-'+id,row.id,()=>{
                const expression=id==='b'?`conditions[${JSON.stringify(row.group)}].rules[${row.index}]`:row.group.startsWith('citation.')?
                    `citacoes[${JSON.stringify(row.group.split('.')[1])}].cond[${row.index}]`:row.group==='general'?`geral[${row.index}]`:`foraDePredef[${row.index}]`;
                context.fixture=row.witness?.source||'';
                const result=JSON.parse(vm.runInContext(`JSON.stringify((()=>{const rule=${expression};rule.reg.lastIndex=0;const match=fixture.match(rule.reg);return {pattern:rule.reg.source,flags:rule.reg.flags,matched:!!match,after:match?${id==='b'?'fixture.replace(rule.reg,rule.subs)':'fixture.replace(match[0],rule.subs(match))'}:fixture};})())`,context,{timeout:2000}));
                eq(sha(result.pattern+'\0'+result.flags),row.patternSha256,'The active original pattern is bound to its recorded identity');
                if(!row.witness){
                    eq(result.matched,false,'The contradictory absolute-start pattern has no match');
                    ok(!result.flags.includes('m')&&/\\s\*\)\^/.test(result.pattern),'The absolute-start assertion follows the required nonempty parameter prefix');
                }else{
                    eq(result.matched,true,'The fictional source actually matches this original declaration');
                    eq(sha(result.after),row.witness.directOriginalAfterSha256,'The pure original replacement matches its recorded source-bound output');
                    if(id!=='b'){
                        const validate=()=>JSON.parse(vm.runInContext('JSON.stringify((()=>{aviso=false;try{validarSintaxePredefinicoes(fixture,localValidationWindow);return {accepted:true,warning:aviso};}catch(error){return {accepted:false,error:String(error?.message||error)};}})())',context,{timeout:2000}));
                        const validation=validate();eq(validate(),validation,'The exact original input validator is deterministic on the fictional witness');
                        report.originalValidation.push({caseId:row.id,...validation});
                    }
                    let pipeline,error;
                    try{pipeline=vm.runInContext(id==='b'?`(()=>{let text=fixture;for(const group of conditions.sumFinal){let i=0,previous;do{if(i===30)throw Error('Nonconvergent original group '+group);i++;previous=text;text=replaceConditions(text,conditions[group].rules);}while(previous!==text);}return text;})()`:`(()=>{let text=fixture.replace(/\\{\\{[Pp]redefinição:/g,'{{');for(const group of citacoes.ordem){let i=0,previous;do{if(i===${id==='a'?6:9})throw Error('Nonconvergent original group '+group);i++;previous=text;text=substApenas(text,citacoes[group].cond,citacoes.apenas,[/\\{\\{/]);}while(previous!==text);}for(const tuple of [[foraDePredef,true,${id==='a'?20:30}],[geral,false,12]]){let i=0,previous;do{if(i===tuple[2])throw Error('Nonconvergent original general');i++;previous=text;text=tuple[1]?substComExcecao(text,tuple[0],[/\\{\\{/]):substituir(text,tuple[0]);}while(previous!==text);}return text;})()`,context,{timeout:3000});}catch(e){error=e.message;}
                    report.originalPipelines++;
                    if(row.witness.originalPipelineError){eq(error,row.witness.originalPipelineError,'A recorded defective original pipeline is reproduced without evaluating its UI');report.originalPipelineDefects.push({caseId:row.id,error});}
                    else{eq(error,undefined,'The effective original pipeline completes');eq(sha(pipeline),row.witness.originalPipelineAfterSha256,'The complete pure original feature order matches its recorded output');}

                }
            });
        });
    }
    report.originalPureExecution=report.originalSources.length===3;
}
const endpoints=new Map(),baseline=require(path.join(root,'dist/2.18.0/RevisaWiki_v2_18_0_completo.js')),baselineConfig=config(baseline),baselineCache=new Map();
for(const file of files){
    const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),cfg=config(api);
    report.bundles.push({bundle,runtimeVersion:api.version,runtimeSha256:sha(bytes),bytes:bytes.length,helperPreview:false});
    const calculate=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}}),cache=new Map();
    for(const row of inventory.rules){if(!row.witness)continue;
        const witness=row.witness,source=witness.source;
        test(bundle,'production-'+row.id,()=>{
            eq(sha(source),witness.sourceSha256,'The fictional witness is exact');
            if(!cache.has(source)){const first=calculate(source),second=calculate(first.text);cache.set(source,{first,second,
                independent:api.preservationAudit(source,first.text,cfg),composition:api.safeComposition(source,first.text,cfg)});}
            const actual=cache.get(source);eq(actual.second.text,actual.first.text,'The actual production result completes in one action');
            const key=sha(source);if(endpoints.has(key))eq(actual.first.text,endpoints.get(key),'Core and complete bundles use the same whole-source endpoint');else endpoints.set(key,actual.first.text);
            if(!baselineCache.has(source)){const before=baseline.calculate({kind:'adjust',source,options:baselineConfig});baselineCache.set(source,{preservation:baseline.preservationAudit(source,before.text,baselineConfig),composition:baseline.safeComposition(source,before.text,baselineConfig)});}
            const old=baselineCache.get(source),fingerprint=x=>JSON.stringify(x);
            ok(actual.independent.every(x=>old.preservation.some(y=>fingerprint(x)===fingerprint(y))),'No new preservation finding is introduced by a source compatibility witness');
            ok(!actual.composition||actual.composition===old.composition,'No new composition refusal is introduced by a source witness');
            eq(actual.first.preservation||[],actual.independent,'The returned audit and separate preservation check agree');
            if(actual.independent.length||actual.composition)report.legacyGuardObservations.push({bundle,caseId:row.id,
                preservationCodes:actual.independent.map(x=>x.code),composition:actual.composition,exactBaseline:true});
        });
        for(const tag of ['nowiki','pre','code','syntaxhighlight','math']){
            if(new RegExp('<\\s*\\/\\s*'+tag+'\\s*>','i').test(source))continue;
            test(bundle,'protected-'+tag+'-'+row.id,()=>{const literal='<'+tag+'>'+source+'</'+tag+'>';eq(calculate(literal).text,literal,'The complete literal protected example retains every original byte');});
        }
    }
}
report.caseCount=report.cases.length;report.uniquePrimaryWitnesses=endpoints.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
