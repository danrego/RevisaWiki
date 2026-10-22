    async function v220PrepareHeadingReferences(task,options) {
        const cfg={...options,v220HeadingReferenceProofs:[]};
        if(cfg.autoPreview===false||cfg.references===false||cfg.namespaceNumber!==0||cfg.sectionOnly)return cfg;
        // First inspect the exact draft. A second candidate covers a nested
        // repair whose owner otherwise overlaps the heading transaction.
        let source=task.source;
        for(let round=0;round<2;round++){
            const request=v220HeadingReferenceRequests(source,cfg)[0];
            if(!request)break;
            task.guard();
            try{
                message('Conferindo referências nos títulos das seções...');
                const before=source===task.source&&task.previewBaseline?task.previewBaseline:await taskParse(task,source);
                const after=await taskParse(task,request.candidateText);
                const proof=v220HeadingReferenceHtmlProof(source,request,before.text,after.text);
                if(!proof)break;
                cfg.v220HeadingReferenceProofs.push(proof);
            }catch(error){task.guard();break;}
            const next=v220RepairPlan(source,cfg).text;
            if(next===source)break;
            source=next;
        }
        return cfg;
    }
    async function v220PrepareHumanIdentity(task,options) {
        const cfg={...options};delete cfg.v220HumanProof;
        if(!cfg.endMatter||!cfg.portals||!cfg.automaticBiographyPortals||cfg.namespaceNumber!==0||cfg.sectionOnly||
            mw.config.get('wgIsRedirect')||mw.config.get('wgIsDisambiguationPage'))return cfg;
        const shield=v24SyntaxProtected(task.source),generic=templates(shield.view).nodes.filter(n=>n.depth===0)
            .some(n=>['Info','Infocaixa'].some(name=>v220BioTitleSame(parsedTemplate(task.source.slice(n.start,n.end)).parts[0],name)));
        if(!generic)return cfg;
        const item=mw.config.get('wgWikibaseItemId');
        if(!/^Q[1-9]\d*$/.test(item||''))return cfg;
        let request;
        try{
            const key='person-entity:'+item;let cached=endMatterReadCache.get(key);
            if(!cached||Date.now()-cached.time>=120000){
                message('Conferindo se a infocaixa pertence a uma pessoa...');
                const client=new mw.ForeignApi('https://www.wikidata.org/w/api.php',{anonymous:true,ajax:{timeout:6000}});
                request=client.get({action:'wbgetentities',formatversion:2,ids:item,props:'claims|sitelinks',sitefilter:'ptwiki'});
                task.preflightRequests.push(request);
                const response=await request;task.guard();
                cached={time:Date.now(),data:response.entities?.[item]};
                if(endMatterReadCache.size>=25)endMatterReadCache.clear();endMatterReadCache.set(key,cached);
            }
            const entity=cached.data;
            if(entity){
                const proof={source:task.source,title:task.title,entityId:item,namespace:0,fullPage:task.section===null,
                    redirect:false,disambiguation:false,entity:{id:entity.id,type:entity.type,
                        claims:{P31:entity.claims?.P31},sitelinks:{ptwiki:entity.sitelinks?.ptwiki}}};
                if(v220BioHumanProof(task.source,{...cfg,pageTitle:task.title,biographyOriginalSource:task.source,v220HumanProof:proof}))cfg.v220HumanProof=proof;
            }
        }catch(error){task.guard();}
        finally{if(request)task.preflightRequests=task.preflightRequests.filter(p=>p!==request);}
        return cfg;
    }
