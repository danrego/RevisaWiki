    function v219NativeOccupationFieldAllowed(raw,key) {
        if(typeof raw!=='string'||typeof key!=='string')return false;
        const parsed=parsedTemplate(raw),profile=INFOBOX_CATALOG[parsed.name];
        // A global occupation-like key does not establish its role inside a
        // particular box. Preserve foreign interfaces and unproved arguments
        // until an independent native migration supplies that exact contract.
        return !!profile&&v215LiteralTemplateIdentity(raw,profile)&&profileAccepts(profile,key);
    }
    function v219LateOccupationValuePlan(value,cfg={}) {
        const empty={source:value,text:value,edits:[],linkSimplifications:0};
        if(typeof value!=='string')return empty;
        const view=occupationView(value),ranges=[...templates(view).nodes,...refTokens(view)],breaks=[];
        for(const match of view.matchAll(/\[\[[^\n]*?\]\]/g))ranges.push({start:match.index,end:match.index+match[0].length});
        for(const match of view.matchAll(/<br\s*\/?\s*>|\n/g))if(!inRange(match.index,ranges))breaks.push({start:match.index,end:match.index+match[0].length});
        const edits=[];let at=0;
        for(const br of [...breaks,{start:value.length,end:value.length}]){
            const chunk=value.slice(at,br.start),chunkView=view.slice(at,br.start),parts=[];let start=0;
            for(const match of chunkView.matchAll(/[,;]|\s+e\s+|\s+&\s+/g)){
                if(inRange(at+match.index,ranges))continue;
                parts.push({start,end:match.index});start=match.index+match[0].length;
            }
            parts.push({start,end:chunk.length});
            const parsed=parts.map(part=>occupationLabelEdits(chunk.slice(part.start,part.end),at+part.start));
            if(parts.length>1)parsed.filter(item=>item?.exact).forEach(item=>edits.push(...item.edits));
            else{const one=occupationLabelEdits(chunk,at);if(one)edits.push(...one.edits);}
            at=br.end;
        }
        // The unchanged original writer independently confirms the complete
        // finite case edits before any newly produced pipe is simplified.
        if(v24SyntaxApply(value,edits)!==occupationValueCase(value))return empty;
        let linkSimplifications=0;
        const final=edits.map(edit=>{
            if(cfg.links===false)return edit;
            const match=/^\[\[([^\[\]\n|]+)\|([^\[\]\n|]+)\]\]$/.exec(edit.text);
            if(!match||/[:#{}<>]/.test(match[1])||/[{}<>]/.test(match[2])||
                !COMMON_OCCUPATIONS.has(norm(match[2]))||match[2]!==match[2].trim())return edit;
            const title=match[1].trim().replace(/_/g,' '),label=match[2],lowerFirst=text=>text[0].toLocaleLowerCase('pt')+text.slice(1);
            if(!title||lowerFirst(title)!==lowerFirst(label))return edit;
            linkSimplifications++;return {...edit,text:'[['+label+']]'};
        });
        return {...empty,text:v24SyntaxApply(value,final),edits:final,linkSimplifications};
    }
    function v219LateOccupationPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||!cfg.infoboxes||!cfg.occupationCase||cfg.syntaxRepairs===false||cfg.structuralRepairs===false)return empty;
        const box=v28PrincipalPersonBox(source,cfg);
        if(!box||box.sourceRaw!==box.raw||!v215LiteralTemplateIdentity(box.raw,box.profile))return empty;
        const edits=[],fields=box.fields;
        if(fields.some(field=>fields.filter(other=>other.key===field.key).length!==1))return empty;
        for(const field of fields){
            if(!OCCUPATION_FIELDS.has(norm(field.key))||!v219NativeOccupationFieldAllowed(box.raw,field.key))continue;
            const aliases=new Set([field.key,...Object.entries({...box.profile.aliases,...box.profile.renames})
                .filter(([key,target])=>norm(key)===norm(field.key)||norm(target)===norm(field.key)).flatMap(([key,target])=>[key,target])]);
            if(fields.some(other=>other!==field&&(aliases.has(other.key)||norm(other.key)===norm(field.key))))continue;
            const value=v219LateOccupationValuePlan(field.value,cfg);
            if(value.text===field.value||!value.edits.length)continue;
            const start=box.node.start+field.start;
            for(const edit of value.edits)edits.push({start:start+edit.start,end:start+edit.end,text:edit.text,ruleId:'occupationCase',
                proof:{sourceHash:empty.sourceHash,template:box.profile.title,nativeTemplateOldid:box.profile.oldid,key:field.key,
                    valueBefore:source.slice(start+edit.start,start+edit.end),valueAfter:edit.text,
                    changeRules:['occupationCase',...(value.linkSimplifications&&/^\[\[[^|]+\]\]$/.test(edit.text)?['links']:[])],
                    condition:'only an existing finite common-occupation case edit in an exact accepted native principal person field; only a newly generated same-title pipe may be simplified; all other labels, names, facts, links and source bytes retained'}});
        }
        edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(edits.some((edit,index)=>index&&edit.start<edits[index-1].end))return empty;
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219LateOccupationProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219LateOccupationPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
