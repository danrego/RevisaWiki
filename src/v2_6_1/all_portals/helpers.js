    const V261_TALK_PROJECT_INPUTS = Symbol('talk-project-inputs');
    function v261TalkLiteralProject(value) {
        if(typeof value!=='string')return null;
        const name=value.normalize('NFC').replace(/_/g,' ').trim().replace(/[ \t]+/g,' ');
        return name&&name.length<=180&&!/[{}\[\]|<>#:=\u0000-\u001f\u007f\uE000\uE001]/u.test(name)?name:null;
    }
    function v261TalkProjectKey(value) {
        const name=v261TalkLiteralProject(value);
        return name?name.toLocaleLowerCase('pt'):null;
    }
    function v261TalkProofProject(value,proof) {
        if(!proof||typeof proof!=='object'||Array.isArray(proof))return null;
        const own=key=>Object.prototype.hasOwnProperty.call(proof,key);
        for(const key of ['input','requestedTitle','title','ns','pageid','exists'])if(!own(key))return null;
        const input=v261TalkLiteralProject(value);
        if(!input||proof.input!==input||proof.exists!==true||!Number.isSafeInteger(proof.pageid)||proof.pageid<1||
            ['missing','invalid','redirect','disambiguation'].some(own)||
            proof.pageprops&&Object.prototype.hasOwnProperty.call(proof.pageprops,'disambiguation'))return null;
        const prefix=proof.ns===100?'Portal:':proof.ns===4?'Wikipédia:Projetos/':null;
        if(!prefix||proof.requestedTitle!==prefix+input||typeof proof.title!=='string'||!proof.title.startsWith(prefix))return null;
        const canonical=v261TalkLiteralProject(proof.title.slice(prefix.length));
        return canonical&&proof.title===prefix+canonical?canonical:null;
    }
    function v261TalkProjectCandidates(source,article='') {
        const inputs=new Set();
        const plan=v25TalkPreparationPlan(source,article,{namespaceNumber:1,sectionOnly:false,contentModel:'wikitext',
            [V261_TALK_PROJECT_INPUTS]:inputs});
        if(!plan.changed)return [];
        const committed=new Set(plan.projects.map(v261TalkProjectKey));
        return [...inputs].filter(value=>committed.has(v261TalkProjectKey(value))&&!v25TalkProject(value)).slice(0,64);
    }
    function v261TalkProofsFromResponse(response,inputs) {
        if(!response||typeof response!=='object'||!response.query||!Array.isArray(response.query.pages)||!Array.isArray(inputs))return [];
        const query=response.query,routes=new Map(),ambiguousRoutes=new Set(),pages=new Map(),proofs=[];
        const title=value=>typeof value==='string'?value.normalize('NFC').replace(/_/g,' '):null;
        for(const list of [query.normalized,query.redirects])for(const entry of Array.isArray(list)?list:[]){
            const from=title(entry?.from),to=title(entry?.to);
            if(from&&to&&from!==to){
                if(routes.has(from)&&routes.get(from)!==to)ambiguousRoutes.add(from);
                routes.set(from,to);
            }
        }
        for(const page of query.pages)if(page&&typeof page==='object'&&typeof page.title==='string')pages.set(title(page.title),page);
        function resolved(requested){
            let current=requested;const seen=new Set();
            for(let step=0;step<10;step++){
                if(seen.has(current)||ambiguousRoutes.has(current))return null;seen.add(current);
                if(!routes.has(current))return current;current=routes.get(current);
            }
            return null;
        }
        for(const raw of inputs.slice(0,64)){
            const input=v261TalkLiteralProject(raw);if(!input)continue;
            for(const [prefix,ns]of [['Wikipédia:Projetos/',4],['Portal:',100]]){
                const requestedTitle=prefix+input,finalTitle=resolved(requestedTitle),page=finalTitle&&pages.get(finalTitle);
                if(!page||page.ns!==ns||!Number.isSafeInteger(page.pageid)||page.pageid<1||
                    ['missing','invalid','redirect'].some(key=>Object.prototype.hasOwnProperty.call(page,key))||
                    page.pageprops&&Object.prototype.hasOwnProperty.call(page.pageprops,'disambiguation'))continue;
                const proof={input,requestedTitle,title:page.title,ns,pageid:page.pageid,exists:true};
                if(v261TalkProofProject(input,proof))proofs.push(proof);
            }
        }
        return proofs;
    }
    async function v261QueryTalkProjectProofs(source,article,request) {
        if(typeof request!=='function')return [];
        const inputs=v261TalkProjectCandidates(source,article),batches=[];
        for(let index=0;index<inputs.length;index+=25)batches.push(inputs.slice(index,index+25));
        const responses=await Promise.allSettled(batches.map(async values=>{
            const titles=values.flatMap(input=>['Portal:'+input,'Wikipédia:Projetos/'+input]);
            let timer=null,pending=null;
            try {
                return {values,response:await Promise.race([
                    Promise.resolve().then(()=>{pending=request({action:'query',formatversion:2,titles:titles.join('|'),
                        prop:'info|pageprops',ppprop:'disambiguation',redirects:1});return pending;}),
                    new Promise((resolve,reject)=>{timer=root.setTimeout(()=>{pending?.abort?.();reject(new Error('Consulta encerrada.'));},6000);})
                ])};
            } finally {if(timer!==null)root.clearTimeout(timer);}
        }));
        return responses.flatMap(result=>result.status==='fulfilled'?v261TalkProofsFromResponse(result.value.response,result.value.values):[]);
    }
