'use strict';
// The release worker installs its own calculate protocol, without wiki UI.
importScripts('../RevisaWiki_v2_20_0_completo.js');
const articleHandler=self.onmessage;
self.onmessage=event=>{
    const request=event.data;
    if(request?.type!=='calculate'||request.job?.kind!=='talk-example'){articleHandler(event);return;}
    try{
        const plan=self.RevisaWiki.v25TalkPreparationPlan(request.job.source,request.job.articleSource||'',request.job.options);
        self.postMessage({type:'result',id:request.id,result:{text:plan.text,preservation:[]}});
    }catch(error){self.postMessage({type:'error',id:request.id,message:String(error.message)});}
};
