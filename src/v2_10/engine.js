    // Exact-source structural reads share a bounded cache. A changed draft
    // always gets different positions and a different dependency graph.
    const v210StructuralMemo=new Map();
    let v210StructuralMemoBytes=0,v210StructuralHits=0,v210StructuralMisses=0;
    function v210Weight(value,seen=new Set()) {
        if(typeof value==='string')return value.length*2+32;
        if(!value||typeof value!=='object')return 16;
        if(seen.has(value))return 0;seen.add(value);
        if(value instanceof Map)return 96+[...value].reduce((n,[key,item])=>n+v210Weight(key,seen)+v210Weight(item,seen),0);
        if(value instanceof Set)return 80+[...value].reduce((n,item)=>n+v210Weight(item,seen),0);
        return 96+Object.entries(value).reduce((n,[key,item])=>n+key.length*2+v210Weight(item,seen),0);
    }
    function v210Memo(source,field,create) {
        const limit=12582912;let entry=v210StructuralMemo.get(source);
        if(entry&&entry.values.has(field)){v210StructuralHits++;v210StructuralMemo.delete(source);v210StructuralMemo.set(source,entry);return entry.values.get(field);}
        v210StructuralMisses++;const value=create();entry=v210StructuralMemo.get(source);
        const added=v210Weight(value)+field.length*2+64,base=entry?0:source.length*2+160;
        if(base+added>limit)return value;
        if(!entry){entry={values:new Map(),bytes:base};v210StructuralMemo.set(source,entry);v210StructuralMemoBytes+=base;}
        entry.values.set(field,value);entry.bytes+=added;v210StructuralMemoBytes+=added;
        while(v210StructuralMemo.size>4||v210StructuralMemoBytes>limit){const first=v210StructuralMemo.keys().next().value,old=v210StructuralMemo.get(first);v210StructuralMemo.delete(first);v210StructuralMemoBytes-=old.bytes;}
        return value;
    }
    function v210StructuralIndex(source) {
        return v210Memo(source,'index',()=>{
            const shield=v24SyntaxProtected(source),view=protectedView(source);
            return {sourceHash:v24SyntaxHash(source),sourceLength:source.length,
                protected:shield.ranges,templates:templates(view),references:refTokens(view),
                collectors:rendererRanges(view),tables:v272LiteralTables(source).tables};
        });
    }
    function v210StructuralCacheStatus() {
        return {entries:v210StructuralMemo.size,estimatedBytes:v210StructuralMemoBytes,maximumEstimatedBytes:12582912,
            hits:v210StructuralHits,misses:v210StructuralMisses,
            accountingConsistent:v210StructuralMemoBytes===[...v210StructuralMemo.values()].reduce((n,entry)=>n+entry.bytes,0)};
    }
    function v210ClearStructuralCache() {v210StructuralMemo.clear();v210StructuralMemoBytes=0;v210StructuralHits=0;v210StructuralMisses=0;}

    // Only complete literal tables without references or dynamic contents can
    // be independent here. All other repairs share one dependency group.
    function v210IndependentRepairPlan(source,cfg={}) {
        const empty={source,sourceHash:v24SyntaxHash(source),text:source,groups:[],edits:[]};
        if(cfg.independentRepairGroups===false||!v24SyntaxScope(cfg))return empty;
        const approved=v25ApprovedSyntaxPlan(source,cfg);
        if(!approved.newRepairs||approved.text===source)return empty;
        const edits=v27RawDiff(source,approved.text);
        if(edits.length>512||edits.some(edit=>edit.precise===false))return empty;
        const index=v210StructuralIndex(source),tables=index.tables.filter(table=>!table.nested&&
            !index.collectors.some(collector=>collector.start<table.end&&collector.end>table.start)&&
            !edits.some(edit=>edit.start<=table.start&&edit.end>=table.start||edit.start<=table.end&&edit.end>=table.end)&&
            !/[{}]|<\s*\/?\s*ref\b|\b(?:id|headers)\s*=/i.test(source.slice(table.start+2,table.end-2)));
        const groups=new Map();
        for(const edit of edits){
            const table=tables.find(item=>edit.start>=item.start&&edit.end<=item.end&&edit.start<item.end);
            const id=table?'table:'+table.start:'dependencies';
            if(!groups.has(id))groups.set(id,{id,kind:table?'table':'dependencies',start:table?.start??0,end:table?.end??source.length,edits:[]});
            groups.get(id).edits.push({...edit,text:edit.after});
        }
        const list=[...groups.values()],segments=[],independent=list.filter(group=>group.kind==='table').sort((a,b)=>a.start-b.start);let at=0;
        const segment=(start,end,id)=>{
            const local=edits.filter(edit=>edit.start>=start&&edit.end<=end&&(edit.start<end||end===source.length)).map(edit=>({...edit,start:edit.start-start,end:edit.end-start,text:edit.after})),before=source.slice(start,end);
            if(start===end&&!local.length)return;
            segments.push({id,before,after:v24SyntaxApply(before,local)});
        };
        for(const group of independent){segment(at,group.start,'dependencies');segment(group.start,group.end,group.id);at=group.end;}
        segment(at,source.length,'dependencies');
        if(segments.map(item=>item.before).join('')!==source||segments.map(item=>item.after).join('')!==approved.text)return empty;
        return {...empty,text:approved.text,groups:list,segments,edits:edits.map(edit=>({...edit,text:edit.after}))};
    }
    function v210IndependentProjection(plan,ids) {
        if(!plan||typeof plan.source!=='string'||plan.sourceHash!==v24SyntaxHash(plan.source)||!Array.isArray(ids))return null;
        const wanted=new Set(ids);if(wanted.size!==ids.length||[...wanted].some(id=>!plan.groups.some(group=>group.id===id)))return null;
        return v24SyntaxApply(plan.source,plan.groups.filter(group=>wanted.has(group.id)).flatMap(group=>group.edits));
    }
    function v210IndependentSubsetProof(before,after,cfg={}) {
        const no={applied:false,accepted:false,groups:[]};
        if(before===after)return no;
        const plan=v210IndependentRepairPlan(before,cfg);if(plan.groups.length<2||after===plan.text)return no;
        let states=[{at:0,selected:new Map()}];
        for(const segment of plan.segments){
            const next=[];
            for(const state of states){
                const modes=segment.before===segment.after?[null]:state.selected.has(segment.id)?[state.selected.get(segment.id)]:[false,true];
                for(const mode of modes){const text=mode?segment.after:segment.before;if(!after.startsWith(text,state.at))continue;
                    const selected=new Map(state.selected);if(mode!==null)selected.set(segment.id,mode);next.push({at:state.at+text.length,selected});}
            }
            if(!next.length||next.length>32)return no;states=next;
        }
        for(const state of states){if(state.at!==after.length)continue;const ids=[...state.selected].filter(([,enabled])=>enabled).map(([id])=>id),expected=v210IndependentProjection(plan,ids);
            if(ids.length&&expected===after){
                const counts=text=>v24SyntaxScan(text).issues.reduce((out,issue)=>(out[issue.code]=(out[issue.code]||0)+1,out),Object.create(null)),old=counts(before),current=counts(after);
                if(Object.entries(current).some(([code,count])=>count>(old[code]||0)))return no;
                return {applied:true,accepted:true,groups:ids,sourceHash:plan.sourceHash,baseline:after,repairs:plan.groups.filter(group=>ids.includes(group.id)).reduce((n,group)=>n+group.edits.length,0),reason:'',ok:true};}}
        return no;
    }

    async function v210PrepareHarvardProofs(task,cfg) {
        if(cfg.autoPreview===false||cfg.citations===false||cfg.references===false||cfg.harvardAnchorRepairs===false||
            cfg.namespaceNumber!==0||cfg.sectionOnly||typeof root.DOMParser!=='function')return cfg;
        cfg.harvardAnchorProofs=[];
        const candidates=v210HarvardAnchorCandidates(task.source,cfg);
        if(!candidates.length)return cfg;
        try {
            message('Conferindo a ligação entre a citação e a bibliografia...');
            const candidate=candidates[0],changed=task.source.slice(0,candidate.start)+candidate.after+task.source.slice(candidate.end);
            const [before,after]=await Promise.all([task.previewBaseline||taskParse(task,task.source),taskParse(task,changed)]);
            task.guard();task.previewBaseline=before;
            const proof=v210HarvardAnchorNativeProof(task.source,candidate,before.text,after.text,root.DOMParser,cfg);
            if(proof)cfg.harvardAnchorProofs.push(proof);
        }catch(error){task.guard();}
        return cfg;
    }

    async function v210VerifyIndependentGroups(task,options,before,initialDecision) {
        const plan=v210IndependentRepairPlan(task.source,options);
        if(plan.groups.length<2)return null;
        const retained=[],checked=[],rejected=[];
        // Bounded work and the existing cancellation/deadline guard keep this
        // recovery from becoming a parse request for every cell or reference.
        const groups=plan.groups.filter(group=>group.kind==='table').slice(0,4);
        const dependent=plan.groups.find(group=>group.id==='dependencies');if(dependent&&groups.length<4)groups.push(dependent);
        for(const group of groups){
            task.guard();const ids=[...retained,group.id],source=v210IndependentProjection(plan,ids);
            if(source===null||safeComposition(task.source,source,options))continue;
            try {
                const parsed=await taskParse(task,source),proof=syntaxRepairSourceProof(task.source,source,options);
                let baseline=null;
                if(proof.applied&&proof.accepted){baseline={...await taskParse(task,proof.baseline),source:proof.baseline};}
                const decision=syntaxPreviewDecision(before,baseline,parsed,root.DOMParser,task.source,source,options);
                checked.push(group.id);
                if(decision.accepted)retained.push(group.id);else rejected.push(group.id);
            }catch(error){task.guard();rejected.push(group.id);break;}
        }
        if(!retained.length)return null;
        const candidate=v210IndependentProjection(plan,retained);
        if(candidate===null||safeComposition(task.source,candidate,options))return null;
        return {candidate,key:rejected.length?'Um conjunto de ajustes':'Ajustes dependentes não confirmados',
            decision:{checked:true,accepted:true,introduced:[],resolved:[],independentGroups:{checked,retained,rejected},original:initialDecision}};
    }
