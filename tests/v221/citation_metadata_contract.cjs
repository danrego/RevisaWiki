'use strict';
// Reuse retained public metadata, with its saved checksums. No network request.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {api,cfg}=require('./citation_contracts.cjs');
if(process.argv.length!==4)throw Error('Usage: node citation_metadata_contract.cjs metadata-directory frozen-plan.json');
const metadataRoot=path.resolve(process.argv[2]),plan=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),
    rows=plan.candidates.find(row=>row.id==='C3REF-EXT-TITLE').sourceEvidence,
    index=JSON.parse(fs.readFileSync(path.join(metadataRoot,'INDEX.json'),'utf8')),cases=[];
let checks=0;
for(const row of rows){
    const entry=index.find(item=>item.doi.toLowerCase()===row.doi.toLowerCase());assert.ok(entry);checks++;
    assert.equal(path.basename(entry.file),entry.file);checks++;
    const raw=fs.readFileSync(path.join(metadataRoot,entry.file),'utf8');
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),row.metadataSha256);checks++;
    const source='{{Citar periódico|título='+row.capturedTitle+'|'+row.followingUnknownArgument+'|periodico=Periódico|doi='+row.doi+'}}',
        request=api.v221CitationTitleRequests(source,cfg)[0];assert.ok(request);checks++;
    const proof=api.v221CitationTitleMetadataProof(source,request,raw);assert.ok(proof);checks++;
    const output=api.v221CitationPlan(source,{...cfg,v221DOITitleProofs:[proof]});
    assert.equal(output.text,'{{Citar periódico|título='+row.confirmedTitle+'|periodico=Periódico|doi='+row.doi+'}}');checks++;
    assert.equal(api.v221CitationPlanProof(source,output.text,output,{...cfg,v221DOITitleProofs:[proof]}),true);checks++;
    assert.equal(api.v221CitationPlan(source,cfg).text,source);checks++;
    const other=JSON.parse(raw);other.message.DOI='10.1000/another-work';
    assert.equal(api.v221CitationTitleMetadataProof(source,request,JSON.stringify(other)),null);checks++;
    cases.push({id:'doi-exact-title-'+cases.length,before:source,after:output.text,metadataSha256:entry.sha256,
        scope:'Source-bound fragment from an audited revision, not a full-article runtime replay'});
}
process.stdout.write(JSON.stringify({suite:'citation-real-metadata',checks,status:'passed',networkRequests:0,cases},null,2)+'\n');
