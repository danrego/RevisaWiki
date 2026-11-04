'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),
    core=process.env.REVISAWIKI_CURRENT_CORE,manifest=process.env.REVISAWIKI_REFERENCE_FIXTURE_MANIFEST,sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.ok(core&&manifest,'Select the built candidate and a private frozen-fixture manifest');
const a=require(path.resolve(core)),cases=JSON.parse(fs.readFileSync(manifest,'utf8')),
    cfg={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false},rows=[];
let checks=0;const failures=[];
function eq(actual,expected,id){checks++;try{assert.deepEqual(actual,expected);}catch{failures.push({id,actual,expected});}}
for(const row of cases){
    const source=fs.readFileSync(row.file,'utf8'),p=a.v2216ReferencePlan(source,cfg),before=a.v2216ReferenceGraph(source),after=a.v2216ReferenceGraph(p.text),
        step=p.steps.find(s=>s.name===row.step),count=step?.edits.length||0;
    eq(count,row.expectedEdits,row.id+' reproduced producer coverage');eq(a.v2216ReferenceProof(source,p.text,p,cfg),true,row.id+' source proof');
    eq(a.v2216ReferencePlan(p.text,cfg).text,p.text,row.id+' helper idempotence');
    if(row.kind!=='dead-link')eq([...new Set(before.refs.filter(r=>r.body!==null).map(r=>r.body))].sort(),[...new Set(after.refs.filter(r=>r.body!==null).map(r=>r.body))].sort(),row.id+' all raw source bodies survive');
    if(row.expectedDefinitionDrop!==undefined)eq(before.refs.filter(r=>r.body!==null).length-after.refs.filter(r=>r.body!==null).length,row.expectedDefinitionDrop,row.id+' definition count');
    if(row.expectedMarkerDrop!==undefined)eq(before.refs.length-after.refs.length,row.expectedMarkerDrop,row.id+' marker count');
    rows.push({id:row.id,sourceSha256:sha(source),candidateSha256:sha(p.text),inputBytes:Buffer.byteLength(source),edits:count,steps:p.steps.map(s=>({name:s.name,edits:s.edits.length}))});
    if(process.env.REVISAWIKI_REFERENCE_FULL_REPLAY==='1'){
        const result=a.calculate({kind:'adjust',source,originalSource:source,options:cfg}),verdict=a.v219AutomaticResultSafety(source,result);
        eq(verdict.accepted,true,row.id+' full writer accepted');eq(result.preservation||[],[],row.id+' full writer preservation');
        const remaining=a.v2216ReferencePlan(result.text,cfg).steps.find(s=>s.name===row.step)?.edits.length||0;
        eq(remaining,0,row.id+' full writer does not leave verified edits unapplied');
    }
}
const receipt={suite:'reference-frozen-private-replays-2.21.6',runtimeSha256:sha(fs.readFileSync(core)),checks,rows,failures};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({suite:receipt.suite,checks,cases:rows.length,failures}));assert.equal(failures.length,0,'Frozen source cases retain raw bodies and reach the complete writer');
