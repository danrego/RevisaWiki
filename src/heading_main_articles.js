    const MAIN_ARTICLE_NAMES = new Set(['artigo principal','artigos principais','artigo principal2','artigo principal 2','artigoprincipal','ap','main','principal','ver artigo principal','ver artigo','ver também artigo principal','details','detalhes']);
    function headingMainArticleCandidates(source,cfg={}) {
        if(cfg.sectionOnly||cfg.discussionPage||cfg.headings===false||cfg.links===false||cfg.namespaceNumber!==0||!v20AutomationAllowed(source,cfg))return [];
        const view=protectedView(source),ranges=structuralRanges(view),out=[];
        for(const match of view.matchAll(/^(={2,6})[ \t]*\[\[([^\[\]|\n]+)(?:\|([^\[\]\n]+))?\]\][ \t]*\1[ \t]*$/gm)){
            if(inRange(match.index,ranges))continue;
            const target=v20WikiTarget(match[2]),label=(match[3]??match[2]).trim();
            if(!target||!label||/[{}<>\uE000'\[\]|]/.test(label))continue;
            const rawTail=source.slice(match.index+match[0].length),tail=rawTail.replace(/^(?:\s|<!--[\s\S]*?-->)+/,'');
            const nextHeading=tail.match(/^={2,6}/);
            if(!tail||nextHeading&&nextHeading[0].length<=match[1].length)continue;
            let existing=null;
            if(tail.startsWith('{{')){
                const first=templates(tail).nodes.find(n=>n.start===0);
                if(first){const p=parsedTemplate(tail.slice(first.start,first.end));if(MAIN_ARTICLE_NAMES.has(p.name))existing=p;}
            }
            const existingTargets=existing?existing.parts.slice(1).map(p=>p.trim().replace(/^\d+\s*=\s*/,'').split('{{!}}')[0]).map(v20WikiTarget).filter(Boolean):[];
            out.push({start:match.index,end:match.index+match[0].length,target,label,level:match[1],existing:!!existing,existingTargets});
        }
        return out;
    }
    function automaticHeadingMainArticles(source,cfg,bump=()=>{}) {
        const candidates=headingMainArticleCandidates(source,cfg),edits=[];
        const sourceBound=cfg.headingMainArticleProofSource===cfg.biographyOriginalSource;
        for(const item of candidates){
            if(item.existing){
                if(item.existingTargets.includes(item.target))edits.push({...item,text:item.level+' '+item.label+' '+item.level});
                continue;
            }
            const proof=sourceBound&&(cfg.headingMainArticleProofs||[]).find(p=>p.target===item.target&&p.exists===true&&p.namespace===0&&p.disambiguation===false);
            if(!proof)continue;
            const current=v20WikiTarget(cfg.pageTitle||'');
            if(current&&(item.target===current||v20WikiTarget(proof.title||'')===current))continue;
            const argument=(item.target.includes('=')?'1=':'')+item.target;
            edits.push({...item,text:item.level+' '+item.label+' '+item.level+'\n{{Artigo principal|'+argument+'}}'});
        }
        for(const edit of edits)bump(edit.existing?'headingLinks':'headingMainArticles');
        return applyEdits(source,edits);
    }
    async function prepareHeadingMainArticles(task,options) {
        const cfg={...options},candidates=headingMainArticleCandidates(task.source,cfg).filter(x=>!x.existing);
        if(!candidates.length)return cfg;
        cfg.headingMainArticleProofs=[];cfg.headingMainArticleProofSource=task.source;
        try{
            task.guard();task.previewSession ||= onlineSession();
            const targets=[...new Set(candidates.map(x=>x.target))].slice(0,50);
            const data=await request(task.previewSession,'get',{action:'query',prop:'pageprops',ppprop:'disambiguation',titles:targets.join('|'),redirects:1,formatversion:2});
            task.guard();
            const aliases=new Map([...(data.query?.normalized||[]),...(data.query?.redirects||[])].map(x=>[v20WikiTarget(x.from),v20WikiTarget(x.to)]));
            const pages=Array.isArray(data.query?.pages)?data.query.pages:Object.values(data.query?.pages||{});
            for(const target of targets){
                let title=target;const seen=new Set();
                while(aliases.has(title)&&!seen.has(title)){seen.add(title);title=aliases.get(title);}
                const page=pages.find(p=>v20WikiTarget(p.title||'')===title);
                if(page&&page.ns===0&&Number(page.pageid)>0&&!Object.hasOwn(page,'missing')&&!Object.hasOwn(page,'invalid')&&!Object.hasOwn(page.pageprops||{},'disambiguation'))
                    cfg.headingMainArticleProofs.push({target,title,exists:true,namespace:0,disambiguation:false});
            }
        }catch(error){task.guard();cfg.headingMainArticleProofs=[];}
        return cfg;
    }
