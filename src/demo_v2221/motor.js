'use strict';
// Only the actual distributed worker computes example results.
importScripts('../RevisaWiki_v2_22_1_completo.js');
const post=self.postMessage.bind(self),queued=[],snapshots=new Map();
self.onmessage=event=>queued.push(event);
Promise.resolve(self.RevisaWikiRulesBootPromise).then(()=>{
    if(self.RevisaWiki?.version!=='2.22.1'||typeof self.onmessage!=='function')throw Error('Motor indisponível');
    const articleHandler=self.onmessage;
    self.postMessage=(response,...transfer)=>{
        const source=snapshots.get(response?.id);
        if(response?.type==='result'&&typeof source==='string'){
            let gate;
            try{gate=self.RevisaWiki.v219AutomaticResultSafety(source,response.result);}
            catch(_){gate={accepted:false,code:'demo-safety-error'};}
            const result=gate.accepted?response.result:{...response.result,text:source,preservation:[],changes:[]};
            response={...response,result:{...result,demoSafety:{accepted:gate.accepted,code:gate.code}}};
            snapshots.delete(response.id);
        }else if(response?.type==='error')snapshots.delete(response.id);
        post(response,...transfer);
    };
    self.onmessage=async event=>{
        const request=event.data;
        if(request?.type!=='calculate'){articleHandler(event);return;}
        let job=request.job;
        if(job?.kind==='talk-example'){
            // This is the same adjustment action used by the discussion editor.
            // No legacy header writer or fabricated external proof is involved.
            job={...job,kind:'adjust',options:{...job.options,namespaceNumber:1,discussionPage:true,v2221TalkArticleSource:typeof job.articleSource==='string'?job.articleSource:''}};
        }else if(job?.kind==='category-offline-example'){
            try{
                const options=await self.RevisaWiki.v222PrepareCategoryEvidence(job.source,job.options,{cache:new Map(),request:async()=>null});
                if(options.v222CategoryProofs?.length)throw Error('A prova externa não pode ser simulada nesta demonstração');
                job={...job,kind:'adjust',options};
            }catch(error){post({type:'error',id:request.id,message:String(error.message)});return;}
        }
        if(job?.kind==='adjust'&&typeof job.source==='string')snapshots.set(request.id,job.source);
        articleHandler({data:{...request,job}});
    };
    for(const event of queued.splice(0))self.onmessage(event);
}).catch(()=>{
    self.onmessage=event=>post({type:'error',id:event.data?.id,message:'O motor da demonstração não terminou de carregar.'});
    for(const event of queued.splice(0))self.onmessage(event);
});
