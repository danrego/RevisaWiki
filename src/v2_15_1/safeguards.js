    function v2151LeadPunctuationCanonical(raw) {
        if(typeof raw!=='string'||raw.length>16384)return null;
        const refs=refTokens(raw),edits=[];
        for(let index=0;index<refs.length;index++){
            const ref=refs[index];if(raw[ref.start-1]!==',')continue;
            // normalizeRefs can move the comma just before a run of source
            // calls. Read that finite layout as the same place attachment.
            let end=ref.end;
            while(index+1<refs.length&&refs[index+1].start===end)end=refs[++index].end;
            edits.push({start:ref.start-1,end,text:raw.slice(ref.start,end)+','});
        }
        return v24SyntaxApply(raw,edits);
    }
    function v2151LeadProofTuple(raw,source,cfg={}) {
        const canonical=v2151LeadPunctuationCanonical(raw);if(canonical===null)return null;
        return v2151LeadTuple(canonical,source);
    }
    function v2151LeadReferenceBindings(value,source,cfg={}) {
        const refs=refTokens(value),definitions=new Map();
        for(const ref of refTokens(protectedView(source))){
            const attrs=attrsOf(ref.attrs);if(!attrs||!attrs.name||ref.body===null)continue;
            const key=JSON.stringify([attrs.group||'',attrs.name]),body=v24InventoryBody(ref.body,cfg);
            if(!definitions.has(key))definitions.set(key,new Set());definitions.get(key).add(body);
        }
        const bindings=[];
        for(const ref of refs){
            const attrs=attrsOf(ref.attrs);if(!attrs||Object.keys(attrs).some(key=>!['name','group'].includes(key)))return null;
            const group=attrs.group||'',name=attrs.name||'',bodies=ref.body===null?definitions.get(JSON.stringify([group,name])):new Set([v24InventoryBody(ref.body,cfg)]);
            if(!bodies||bodies.size!==1)return null;
            bindings.push([group,name,[...bodies][0]]);
        }
        return bindings;
    }
    function v2151LeadTupleBinding(tuple,source,cfg={}) {
        const result=[];
        for(const kind of ['birth','death']){
            const part=tuple[kind];if(!part){result.push(null);continue;}
            const date=v2151LeadReferenceBindings(part.date.raw,source,cfg),place=part.place?v2151LeadReferenceBindings(part.place.raw,source,cfg):[],
                suffix=v2151LeadReferenceBindings(part.suffix||'',source,cfg);
            if(date===null||place===null||suffix===null)return null;
            result.push([part.date.identity,part.place?.identity||null,part.reversed,date,place,suffix]);
        }
        return result;
    }
    function v2151LeadObjectProof(plan,expected,actual) {
        const steps=(plan.safe?.steps||[]).filter(step=>step.name==='v2151-biography-lead');
        if(!steps.length)return {accepted:true,reason:''};
        const cfg=plan.cfg||{},a=v2151LeadOpening(expected,cfg),b=v2151LeadOpening(actual,cfg),
            reject=()=>({accepted:false,reason:'A identificação inicial perdeu ou alterou dados fora dos ajustes confirmados.'});
        if(!a||!b||a.body!==b.body||a.bold!==b.bold||a.selfLink!==b.selfLink)return reject();
        const changedDates=steps.some(step=>step.edits.some(edit=>edit.proof?.scope==='biography-dates'));
        if(!changedDates)return {accepted:true,reason:''};
        if(!a.tuple||!b.tuple)return reject();
        const left=v2151LeadProofTuple(a.tuple.raw,expected,cfg),right=v2151LeadProofTuple(b.tuple.raw,actual,cfg);
        if(!left||!right)return reject();
        const wanted=v2151LeadTupleBinding(left,expected,cfg),retained=v2151LeadTupleBinding(right,actual,cfg);
        return wanted!==null&&retained!==null&&JSON.stringify(wanted)===JSON.stringify(retained)?
            {accepted:true,reason:''}:reject();
    }
    function v2151IdentificationChanged(before,after) {
        const cfg=v2151RetainedContext(before,after,{});
        if(!cfg?.pageTitle)return false;
        let a=v2151LeadOpening(before,cfg);const b=v2151LeadOpening(after,cfg);
        if(!a&&b){
            const prepared=v2151BiographyPreparationPlan(before,cfg);
            if(prepared.edits.length&&v2151BiographyPreparationProof(before,prepared.text,prepared,cfg))a=v2151LeadOpening(prepared.text,cfg);
        }
        return !!a&&!!b&&a.body===b.body&&(a.nameRaw!==b.nameRaw||a.tuple?.raw!==b.tuple?.raw);
    }
    function v2151MechanicalPresentation(source,cfg={}) {
        let text=source;
        for(let round=0;round<3;round++){
            const before=text;
            const lead=v2151BiographyLeadEdits(text,cfg).filter(edit=>!edit.proof?.copiedFacts?.length);
            text=v24SyntaxApply(text,lead);
            text=v2151InfoboxOrderPlan(text,cfg).text;
            text=v2151FieldSyntaxPlan(text,cfg).text;
            text=v2151BiographyImageAltPlan(text,cfg).text;
            text=v2151BiographyPreparationPlan(text,cfg).text;
            if(text===before)break;
        }
        return text;
    }
