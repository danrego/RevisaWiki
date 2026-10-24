'use strict';
// Actual UI preflight source with explicit read-only transport fixtures. This
// does not stand in for a real-browser or successful external-network test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),bundle=process.env.REVISAWIKI_V221_BUNDLE||path.join(root,'dist/2.21.0/RevisaWiki_v2_21_0.js'),api=require(bundle),
    source='Texto.<ref>{{Citar periódico|título=Exceptional boundary states at|c=1|periodico=Periódico|doi=10.1016/S0550-3213(01)00486-2}}</ref>\n{{Referências}}',
    body=fs.readFileSync(path.join(root,'src/v2_21/ui_preflights.js'),'utf8'),
    metadata=JSON.stringify({status:'ok',message:{DOI:'10.1016/S0550-3213(01)00486-2',title:['Exceptional boundary states at c=1']}});
let checks=0;
async function run({options={},task:changes={},response=metadata,transportError=false,changedDraft=false,wikiFlags={}}={}){
    const calls=[],task={source,title:'Teste de contrato',base:12,section:null,guard(){if(changedDraft)throw Error('Draft changed');},...changes},
        context={Map,Date,Number,JSON,Promise,encodeURIComponent,
            endMatterReadCache:new Map(),v221CitationTitleRequests:api.v221CitationTitleRequests,v221CitationTitleMetadataProof:api.v221CitationTitleMetadataProof,
            v221StructureExternalRequests:()=>({interwiki:[],files:[],sourceHash:'fixture'}),v221InfoboxEntityRequests:()=>[],
            mw:{config:{get:key=>wikiFlags[key]||false},Api:class{constructor(){throw Error('Unexpected wiki API call');}},ForeignApi:class{constructor(){throw Error('Unexpected foreign wiki call');}}},
            $:{ajax(request){calls.push(request);return transportError?Promise.reject(Error('Unavailable transport')):Promise.resolve(response);}}};
    vm.createContext(context);vm.runInContext(body+'\nglobalThis.prepare=v221PrepareEvidence;',context);
    const before=task.source;
    let result,error;
    try{result=await context.prepare(task,{...api.defaults,namespaceNumber:0,sectionOnly:false,...options});}catch(caught){error=String(caught);}
    assert.equal(task.source,before);checks++;
    assert.equal(task.preflightRequests.length,0);checks++;
    return {result,error,calls,task};
}
(async()=>{
    const okay=await run();assert.equal(okay.result.v221DOITitleProofs.length,1);checks++;
    assert.equal(okay.calls.length,1);checks++;
    assert.equal(okay.calls[0].type,'GET');checks++;
    assert.equal(okay.calls[0].dataType,'text');checks++;
    assert.equal(okay.calls[0].timeout,6000);checks++;
    assert.equal(okay.calls[0].url,'https://api.crossref.org/works/'+encodeURIComponent('10.1016/S0550-3213(01)00486-2'));checks++;
    assert.equal(api.v221CitationPlan(source,okay.result).text.includes('states at c=1'),true);checks++;
    for(const settings of [{transportError:true},{response:'invalid JSON'},{response:metadata.replace('c=1','c=2')},{response:metadata.replace('10.1016/S0550-3213(01)00486-2','10.1000/other')},{response:{status:'ok'}}]){
        const failed=await run(settings);assert.equal(failed.error,undefined);checks++;
        assert.equal(failed.result.v221DOITitleProofs.length,0);checks++;
        assert.equal(api.v221CitationPlan(source,failed.result).text,source);checks++;
    }
    for(const settings of [{options:{registryDoiCheck:false}},{options:{citations:false}},{options:{namespaceNumber:1}},
        {options:{sectionOnly:true}},{task:{section:'1'}},{task:{section:undefined}},
        {wikiFlags:{wgIsRedirect:true}},{wikiFlags:{wgIsDisambiguationPage:true}},
        {task:{source:'Texto sem fragmento de título.'}}]){
        const skipped=await run(settings);assert.equal(skipped.calls.length,0);checks++;
        assert.equal(skipped.result.v221DOITitleProofs.length,0);checks++;
    }
    const changed=await run({changedDraft:true});assert.match(changed.error,/Draft changed/);checks++;
    const bounded=await run({task:{source:Array.from({length:6},()=>source).join('\n')}});
    assert.equal(bounded.calls.length,4);checks++;
    assert.equal(bounded.result.v221DOITitleProofs.length,4);checks++;
    const stale=await run({task:{source:'Texto sem título separado.'},options:{v221DOITitleProofs:[{forged:true}]}});
    assert.equal(stale.result.v221DOITitleProofs.length,0);checks++;
    process.stdout.write(JSON.stringify({suite:'citation-ui-preflight',status:'passed',checks,
        scope:'Actual UI preflight with fixture transport, actual candidate requests/proof helpers; no browser or external requests'})+'\n');
})().catch(error=>{process.stderr.write(String(error.stack||error)+'\n');process.exitCode=1;});
