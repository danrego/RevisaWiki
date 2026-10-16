    const birthCategoryReadCache=new Map();
    function birthCategoryRuntimeContext() {
        if(inlineController?.context()||editingSection()!==null)return null;
        return v283BirthCategoryContext({pageTitle:currentTitle(),namespaceNumber:Number(mw.config.get('wgNamespaceNumber')),pageId:Number(mw.config.get('wgArticleId')),revisionId:baseRevision(),section:null});
    }
    function birthCategoryRuntimeOptions(options) {
        const cfg={...options},context=birthCategoryRuntimeContext();
        delete cfg.birthCategoryContext;delete cfg.birthCategoryProof;
        if(!context)return cfg;
        cfg.birthCategoryContext=context;
        const key=JSON.stringify(context),proof=birthCategoryReadCache.get(key);
        if(proof&&proof.expiresAt>Date.now())cfg.birthCategoryProof=proof;
        else if(proof)birthCategoryReadCache.delete(key);
        return cfg;
    }
    async function prepareBirthCategory(task,options) {
        const cfg=birthCategoryRuntimeOptions(options),context=cfg.birthCategoryContext;
        if(!context||typeof root.fetch!=='function')return cfg;
        const candidate=v283BirthCategoryCandidate(task.source,cfg);
        if(!candidate)return cfg;
        if(v283BirthCategoryEdits(task.source,cfg).length)return cfg;
        delete cfg.birthCategoryProof;
        const query=new root.URLSearchParams({action:'parse',format:'json',formatversion:'2',title:context.pageTitle,text:candidate.renderSource,contentmodel:'wikitext',prop:'categories|parsewarnings',origin:'*'});
        const url='https://pt.wikipedia.org/w/api.php?'+query.toString();
        if(url.length>V283_BIRTH_CATEGORY_GET_LIMIT)return cfg;
        const controller=typeof root.AbortController==='function'?new root.AbortController():null;
        const pending={abort(){controller?.abort();}},requests=task.preflightRequests||(task.preflightRequests=[]);
        requests.push(pending);let timer;
        try {
            message('Conferindo a categoria de nascimento...');
            const response=await Promise.race([
                (async()=>{const reply=await root.fetch(url,{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',...(controller?{signal:controller.signal}:{})});if(!reply.ok)throw new Error('Category preview unavailable');const text=await reply.text();if(text.length>262144)throw new Error('Category preview too large');return JSON.parse(text);})(),
                new Promise((_,reject)=>{timer=root.setTimeout(()=>{pending.abort();reject(new Error('Category preview timeout'));},4000);})
            ]);
            task.guard();
            if(JSON.stringify(birthCategoryRuntimeContext())!==JSON.stringify(context))return cfg;
            const proof=v283BirthCategoryProof(candidate,response,context);
            if(proof){if(birthCategoryReadCache.size>=4)birthCategoryReadCache.clear();birthCategoryReadCache.set(JSON.stringify(context),proof);cfg.birthCategoryProof=proof;}
        }catch(_){task.guard();}
        finally{root.clearTimeout(timer);task.preflightRequests=(task.preflightRequests||[]).filter(request=>request!==pending);}
        return cfg;
    }
