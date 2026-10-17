    // Native template revision 63785697 passes estilo to the outer wrapper.
    // The reference extension supplies its own responsive inner wrapper.
    // Style-guide revision 69333097 no longer requires explicit column counts.
    const V218_REFERENCE_LAYOUT_PROPERTIES=Object.freeze({
        'column-count':'2','column-width':'30em','column-gap':'2em','max-width':'62em'
    });
    function v218GeneratedReferenceStyle(value) {
        if(typeof value!=='string'||!value.trim()||/[{}<>\uE000\r\n]|\/\*|\*\//.test(value))return false;
        const declarations=value.split(';');
        if(!declarations[declarations.length-1].trim())declarations.pop();
        if(declarations.length!==4)return false;
        const seen=new Set();
        for(const declaration of declarations){
            const match=declaration.match(/^\s*([a-z-]+)\s*:\s*([a-z0-9.]+)\s*$/i);
            if(!match)return false;
            const property=match[1].toLowerCase(),value=match[2].toLowerCase();
            if(seen.has(property)||!Object.hasOwn(V218_REFERENCE_LAYOUT_PROPERTIES,property)||
                V218_REFERENCE_LAYOUT_PROPERTIES[property]!==value)return false;
            seen.add(property);
        }
        return seen.size===4;
    }
    function v218ReferenceLayoutScope(source,options={}) {
        const cfg={...DEFAULTS,...options};
        return typeof source==='string'&&source.length<=4194304&&cfg.references!==false&&
            cfg.referenceColumns!==false&&!cfg.sectionOnly&&cfg.namespaceNumber===0&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&v20AutomationAllowed(source,cfg)&&
            !v24SyntaxScan(source).issues.length;
    }
    function v218ReferenceColumnPlans(source,options={},legacyOnly=false) {
        const cfg={...DEFAULTS,...options};if(!v218ReferenceLayoutScope(source,cfg))return [];
        const view=protectedView(source),ranges=structuralRanges(view),plans=[];
        for(const row of v211ReferenceCollectorCounts(source)){
            if(!['referências','referencias'].includes(row.template)||
                !v211ReferenceCollectorContext(source,row,ranges))continue;
            const raw=source.slice(row.start,row.end),parsed=parsedTemplate(raw),entries=foreignEntries(parsed),
                old=entries.filter(entry=>LEGACY_REFERENCE_COLUMNS.has(norm(entry.key))),
                styles=entries.filter(entry=>norm(entry.key)==='estilo'||entry.key==='5'),
                changeRules=[];
            if(legacyOnly){
                // These legacy fields are ignored by the pinned native template.
                // A custom estilo argument retains its exact bytes.
                for(const entry of old){entry.remove=true;changeRules.push('legacyReferenceColumns');}
            }else{
                if(old.length||styles.length!==1||!['estilo','5'].includes(styles[0].key)||
                    !v218GeneratedReferenceStyle(styles[0].value))continue;
                // Removing a positional argument would renumber later arguments.
                if(styles[0].positional)continue;
                styles[0].remove=true;changeRules.push('v218ResponsiveReferenceLayout');
            }
            if(!changeRules.length)continue;
            const after=translatedEntries(parsed,entries);if(after===raw)continue;
            plans.push({start:row.start,end:row.end,before:raw,after,group:row.group,
                count:row.count,confirmed:row.confirmed,code:'',message:'',
                proof:{sourceHash:v24SyntaxHash(source),raw,canonical:after,changeRules,
                    nativeTemplateOldid:63785697,styleGuideOldid:69333097,
                    method:legacyOnly?'ignored-legacy-column-fields':'exact-generated-wrapper-style',
                    retainedReferencePayloads:true,minorSafe:true}});
        }
        return plans;
    }
    function v218ReferenceLayoutEdits(source,options={}) {
        return v218ReferenceColumnPlans(source,options).map(plan=>({start:plan.start,end:plan.end,
            text:plan.after,ruleId:'v218ResponsiveReferenceLayout',proof:plan.proof}));
    }
    function v218ReferenceLayoutPlan(source,options={}) {
        const edits=v218ReferenceLayoutEdits(source,options);
        return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v218ReferenceLayoutProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v218ReferenceLayoutPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
