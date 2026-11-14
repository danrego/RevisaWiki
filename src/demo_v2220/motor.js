'use strict';
// The browser release verifies its inline rules asynchronously before creating API.
importScripts('../RevisaWiki_v2_22_0_completo.js');
const post=self.postMessage.bind(self),queued=[],snapshots=new Map();
self.onmessage=event=>queued.push(event);
Promise.resolve(self.RevisaWikiRulesBootPromise).then(()=>{
    if(self.RevisaWiki?.version!=='2.22.0'||typeof self.onmessage!=='function')throw Error('Motor indisponível');
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
        if(request.job?.kind==='talk-example'){
            try{
                const plan=self.RevisaWiki.v25TalkPreparationPlan(request.job.source,request.job.articleSource||'',request.job.options);
                post({type:'result',id:request.id,result:{text:plan.text,preservation:[],demoSafety:{accepted:true,code:'talk-plan'}}});
            }catch(error){post({type:'error',id:request.id,message:String(error.message)});}
            return;
        }
        if(request.job?.kind==='category-offline-example'){
            // No synthetic Wikidata statement is used. An unavailable read returns
            // no proof, leaving only the ordinary offline calculation available.
            try{
                const options=await self.RevisaWiki.v222PrepareCategoryEvidence(request.job.source,request.job.options,{cache:new Map(),request:async()=>null});
                if(options.v222CategoryProofs?.length)throw Error('A prova externa não pode ser simulada nesta demonstração');
                snapshots.set(request.id,request.job.source);
                articleHandler({data:{...request,job:{...request.job,kind:'adjust',options}}});
            }catch(error){post({type:'error',id:request.id,message:String(error.message)});}
            return;
        }
        if(request.job?.kind==='adjust'&&typeof request.job.source==='string')snapshots.set(request.id,request.job.source);
        articleHandler(event);
    };
    for(const event of queued.splice(0))self.onmessage(event);
}).catch(()=>{
    self.onmessage=event=>post({type:'error',id:event.data?.id,message:'O motor da demonstração não terminou de carregar.'});
    for(const event of queued.splice(0))self.onmessage(event);
});
