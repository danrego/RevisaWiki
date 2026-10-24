    // Read-only evidence belongs to one exact draft. Failed or unavailable
    // lookups leave the affected field untouched and do not interrupt editing.
    async function v221PrepareEvidence(task,options) {
        const cfg={...options,pageTitle:task.title,revisionId:task.base??options.revisionId??null};
        delete cfg.v221InfoboxEntityProof;delete cfg.v221StructureExternalProof;
        cfg.v221DOITitleProofs=[];task.preflightRequests||=[];
        if(cfg.namespaceNumber!==0||cfg.sectionOnly||task.section!==null||
            mw.config.get('wgIsRedirect')||mw.config.get('wgIsDisambiguationPage'))return cfg;
        const source=task.source,external=v221StructureExternalRequests(source,cfg),properties=v221InfoboxEntityRequests(source,cfg),
            item=mw.config.get('wgWikibaseItemId');
        const read=async request=>{
            task.preflightRequests.push(request);
            try{const response=await request;task.guard();return response;}
            finally{task.preflightRequests=task.preflightRequests.filter(p=>p!==request);}
        };
        if((cfg.links!==false&&external.interwiki.length||properties.length)&&/^Q[1-9]\d*$/.test(item||'')){
            try{
                const key='v221-full-entity:'+item;let cached=endMatterReadCache.get(key);
                if(!cached||Date.now()-cached.time>=120000){
                    const client=new mw.ForeignApi('https://www.wikidata.org/w/api.php',{anonymous:true,ajax:{timeout:6000}});
                    const response=await read(client.get({action:'wbgetentities',formatversion:2,ids:item,props:'info|claims|sitelinks'}));
                    cached={time:Date.now(),data:response.entities?.[item]};
                    if(endMatterReadCache.size>=25)endMatterReadCache.clear();endMatterReadCache.set(key,cached);
                }
                const entity=cached.data;
                if(entity?.id===item&&entity.sitelinks?.ptwiki?.title===task.title&&Number.isSafeInteger(entity.lastrevid)&&entity.lastrevid>0){
                    if(properties.length&&v221BioCompleteClaimsMap(entity.claims))cfg.v221InfoboxEntityProof={source,title:task.title,namespace:0,fullPage:true,
                        redirect:false,disambiguation:false,claimsComplete:true,entityId:item,entity};
                    cfg.v221StructureExternalProof={sourceHash:external.sourceHash,pageTitle:task.title,revisionId:cfg.revisionId,
                        checkedAt:new Date().toISOString(),interwiki:external.interwiki.map(row=>({...row,
                            matched:entity.sitelinks?.[row.language+'wiki']?.title===row.title})),files:[]};
                }
            }catch(error){task.guard();}
        }
        if(cfg.images!==false&&external.files.length){
            try{
                const titles=[...new Set(external.files.flatMap(row=>[row.originalTitle,row.correctedTitle]))].slice(0,40),
                    client=new mw.Api({ajax:{timeout:6000}}),response=await read(client.get({action:'query',formatversion:2,
                        prop:'imageinfo',iiprop:'url',titles:titles.join('|')})),pages=response.query?.pages;
                if(Array.isArray(pages)){
                    const exists=title=>{
                        let normalized=title;const seen=new Set();
                        for(let round=0;round<5;round++){
                            if(seen.has(normalized))return null;seen.add(normalized);
                            const matches=(response.query.normalized||[]).filter(row=>row.from===normalized);
                            if(matches.length>1||matches.length===1&&typeof matches[0].to!=='string')return null;
                            if(!matches.length){const matches=pages.filter(page=>page.title===normalized);return matches.length===1?matches[0]:null;}
                            normalized=matches[0].to;
                        }
                        return null;
                    },proof=cfg.v221StructureExternalProof||{
                        sourceHash:external.sourceHash,pageTitle:task.title,revisionId:cfg.revisionId,checkedAt:new Date().toISOString(),interwiki:[],files:[]};
                    for(const row of external.files){
                        const a=exists(row.originalTitle),b=exists(row.correctedTitle);
                        if(a&&b&&(a.missing===true||a.invalid===true)&&!a.imageinfo?.length&&a.imagerepository!=='shared'&&
                            b.imageinfo?.length&&b.invalid!==true)proof.files.push({...row,originalExists:false,correctedExists:true});
                    }
                    cfg.v221StructureExternalProof=proof;
                }
            }catch(error){task.guard();}
        }
        if(cfg.registryDoiCheck!==false&&cfg.citations!==false){
            for(const request of v221CitationTitleRequests(source,cfg).slice(0,4)){
                try{
                    const raw=await read($.ajax({url:'https://api.crossref.org/works/'+encodeURIComponent(request.doi),
                        type:'GET',dataType:'text',timeout:6000})),proof=v221CitationTitleMetadataProof(source,request,raw);
                    if(proof)cfg.v221DOITitleProofs.push(proof);
                }catch(error){task.guard();}
            }
        }
        return cfg;
    }
