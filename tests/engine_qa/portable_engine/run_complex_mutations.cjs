'use strict';
// Offline, opt-in large-source regression suite. Only Node built-ins are used.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=__dirname,argv=Object.fromEntries(process.argv.slice(2).map(x=>{const [k,...v]=x.replace(/^--/,'').split('=');return [k,v.join('=')];}));
const shard=Number(argv.shard||0),shards=Number(argv.shards||1),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
assert(Number.isInteger(shard)&&Number.isInteger(shards)&&shards>0&&shard>=0&&shard<shards,'Valid --shard and --shards');
const coreArgument=argv.core||process.env.REVISAWIKI_CORE,completeArgument=argv.complete||process.env.REVISAWIKI_COMPLETE;
if(!coreArgument||!completeArgument)throw new Error('Pass --core=path/RevisaWiki_v2_4.js and --complete=path/RevisaWiki_v2_4_completo.js, or REVISAWIKI_CORE/REVISAWIKI_COMPLETE.');
const coreFile=path.resolve(coreArgument),completeFile=path.resolve(completeArgument),dataFile=path.join(path.dirname(coreFile),'RevisaWiki_v2_4_dados.js');
const files=[coreFile,completeFile,...(fs.existsSync(dataFile)?[dataFile]:[])],frozen=Object.fromEntries(files.map(file=>[file,sha(fs.readFileSync(file))]));
const core=require(coreFile),complete=require(completeFile);assert.equal(core.version,'2.4.0');assert.equal(complete.version,core.version);
const report={status:'running',shard,shards,frozen,runnerSha256:sha(fs.readFileSync(__filename)),manifestSha256:sha(fs.readFileSync(path.join(__dirname,'selected_sources.json'))),startedAt:new Date().toISOString(),checks:0,selected:[],cases:[],failures:[]};
const cfg={namespaceNumber:0,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,livingBirthAge:false,autoMinor:false,autoPreview:false,registryDoiCheck:false,captureTrace:true};
const check=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
const calculate=(api,source,options=cfg)=>api.calculate({kind:'adjust',source,options});
const errors=api=>source=>api.syntaxAudit(source).map(f=>f.code+':'+f.message);
function multiset(values){const out=new Map();for(const value of values)out.set(value,(out.get(value)||0)+1);return out;}
function literals(source){return source.match(/<math\b[^>]*>[\s\S]*?<\/math\s*>|<nowiki\b[^>]*>[\s\S]*?<\/nowiki\s*>|<!--[\s\S]*?-->/gi)||[];}
function preserveMultiset(before,after,label){const a=multiset(before),b=multiset(after);for(const [key,n]of a)check((b.get(key)||0)>=n,true,label+' '+key.slice(0,100));}
function complex(){
    const manifestPath=path.join(__dirname,'selected_sources.json'),corpus=path.dirname(manifestPath),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    const selected=manifest.map(entry=>({...entry,source:fs.readFileSync(path.join(corpus,entry.file),'utf8')}));
    check(selected.length,16,'sixteen balanced large mathematics/physics sources');
    for(let index=0;index<selected.length;index++){
        if(index%shards!==shard)continue;const entry=selected[index],source=entry.source;check(sha(source),entry.sha256,'frozen source '+entry.title);check(Buffer.byteLength(source)>=100000,true,'large source '+entry.title);
        report.selected.push({title:entry.title,revid:entry.revid,bytes:Buffer.byteLength(source),sha256:entry.sha256,source:path.relative(root,path.join(corpus,entry.file)),mathTags:entry.mathTags});
        const baseline=calculate(core,source),baselineErrors=new Set(errors(core)(baseline.text));
        const tag='rw24-'+index,body='{{Citar web|url=https://example.invalid/'+tag+'|titulo=Fonte técnica 中文 '+tag+'|doi=10.1234/'+tag+'}}',start=source+'\n\n';
        const table='{| class="wikitable"\n! Grandeza !! Valor\n|-\n| Energia '+tag+' || 10⁻⁶ 中文';
        const variants=[{kind:'ref-eof',source:start+'<ref name="'+tag+'">'+body,expected:start+'<ref name="'+tag+'">'+body+'</ref>',rule:'syntaxReferenceClosers'},
            {kind:'backslash-ref',source:start+'<ref name="'+tag+'">'+body+'<\\ref>',expected:start+'<ref name="'+tag+'">'+body+'</ref>',rule:'syntaxTagTypos'},
            {kind:'table-eof',source:start+table,expected:start+table+'\n|}',rule:'syntaxTableClosers'}];
        for(const variant of variants){const t=performance.now();const name=entry.title+' / '+variant.kind,p=core.syntaxRepairPlan(variant.source,cfg);check(p.text,variant.expected,name+' exact minimal syntax repair');check(p.edits.some(e=>e.ruleIds.includes(variant.rule)),true,name+' correct visible rule');check(core.syntaxRepairEquivalence(variant.source,variant.expected,p,cfg),true,name+' exact source proof');
            const first=calculate(core,variant.source),second=calculate(core,first.text),fullFirst=calculate(complete,variant.source),fullSecond=calculate(complete,fullFirst.text);
            check(first.text,fullFirst.text,name+' core/complete first');check(second.text,fullSecond.text,name+' core/complete second');check(first.text,second.text,name+' idempotent');
            check(first.changes.some(e=>e.id===variant.rule),true,name+' repair retained by full pipeline');
            const sourceProof=core.syntaxRepairSourceProof(variant.source,first.text,cfg);check(sourceProof.accepted,true,name+' source/object inventory: '+sourceProof.reason);
            check(first.preservation.some(e=>e.code==='lost-repaired-reference'),false,name+' preservation proof');
            const serious=new Set((baseline.preservation||[]).filter(e=>/^lost-(?:url|image|identifier|protected)$/.test(e.code)).map(e=>e.code+':'+e.message));
            check(first.preservation.filter(e=>/^lost-(?:url|image|identifier|protected)$/.test(e.code)&&!serious.has(e.code+':'+e.message)),[],name+' no new loss');
            preserveMultiset(literals(source),literals(first.text),name+' literal math/comment');
            const doiPattern=/\b10\.\d{4,9}\/[A-Za-z0-9._;()/:+-]+/g;
            preserveMultiset([...new Set(source.match(doiPattern)||[])],[...new Set(first.text.match(doiPattern)||[])],name+' original DOI identifier values');
            // Existing duplicate-reference normalization may retain one DOI
            // definition for repeated calls. Preserve that proven baseline's
            // occurrence count as well as every original identifier value.
            preserveMultiset(baseline.text.match(doiPattern)||[],first.text.match(doiPattern)||[],name+' baseline DOI occurrences');
            check(errors(core)(first.text).filter(x=>!baselineErrors.has(x)),[],name+' no introduced syntax errors');
            check(core.safeComposition(variant.source,first.text),'',name+' safe composition');
            report.cases.push({title:entry.title,revid:entry.revid,name,kind:variant.kind,sourceBytes:Buffer.byteLength(variant.source),resultBytes:Buffer.byteLength(first.text),sourceSha256:sha(variant.source),resultSha256:sha(first.text),edits:p.edits.length,mathBlocks:literals(source).filter(x=>/^<math\b/i.test(x)).length,ms:Math.round(performance.now()-t),status:'passed'});
        }
        console.log(JSON.stringify({title:entry.title,shard,mutationsPassed:report.cases.length,checks:report.checks}));
    }
}
try{complex();for(const file of files)check(sha(fs.readFileSync(file)),frozen[file],'engine remained frozen '+file);for(const entry of report.selected)check(sha(fs.readFileSync(path.join(root,entry.source))),entry.sha256,'fixture remained frozen '+entry.title);report.status='passed';}catch(error){report.status='failed';report.failures.push({message:error.message,stack:error.stack});process.exitCode=1;}
report.completedAt=new Date().toISOString();const outputDirectory=path.resolve(argv.output||path.join(__dirname,'artifacts',new Date().toISOString().replace(/[:.]/g,'-')));fs.mkdirSync(outputDirectory,{recursive:true});const output=path.join(outputDirectory,'complex_mutations_shard_'+shard+'.json');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures,output}));
