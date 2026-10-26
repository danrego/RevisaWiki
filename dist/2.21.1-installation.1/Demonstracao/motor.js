'use strict';
// This adapter applies the same final preservation gate as the article editor.
importScripts('../RevisaWiki_v2_21_1_completo.js');
const articleHandler=self.onmessage,post=self.postMessage.bind(self),snapshots=new Map();
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
self.onmessage=event=>{
    const request=event.data;
    if(request?.type!=='calculate'){articleHandler(event);return;}
    if(request.job?.kind==='talk-example'){
        try{
            // Talk preparation has its own source-bound plan, separate from
            // the article calculation/composition protocol.
            const plan=self.RevisaWiki.v25TalkPreparationPlan(request.job.source,request.job.articleSource||'',request.job.options);
            post({type:'result',id:request.id,result:{text:plan.text,preservation:[],demoSafety:{accepted:true,code:'talk-plan'}}});
        }catch(error){post({type:'error',id:request.id,message:String(error.message)});}
        return;
    }
    if(request.job?.kind==='adjust'&&typeof request.job.source==='string')snapshots.set(request.id,request.job.source);
    articleHandler(event);
};
