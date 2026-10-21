    function v219ReferenceLegacyCollectorPlan(source,options={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,steps:[]},cfg={...DEFAULTS,...options};
        if(typeof source!=='string'||source.length>4194304||cfg.references===false||cfg.namespaceNumber!==0||
            cfg.sectionOnly||cfg.discussionPage||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            v24SyntaxScan(source).issues.length||!v20AutomationAllowed(source,cfg))return empty;
        const normal=mergeEditorialRanges([...v219QuotedTemplateRanges(source),...v219UnknownTemplateRanges(source,cfg),
            ...v219UncertainReferenceRanges(source,cfg)]),shield=maskProtected(source,()=>{},mergeEditorialRanges([
                ...normal,...v219ReferenceDefinitionPeerRanges(source,normal,cfg)]));
        const steps=[];let text=shield.text;
        const columns=automaticLegacyReferenceColumns(text,cfg,()=>{});
        if(columns!==text){steps.push({kind:'existing-ignored-native-column-fields',beforeHash:v24SyntaxHash(text),afterHash:v24SyntaxHash(columns)});text=columns;}
        const edits=[];
        for(const node of topNodes(text)){
            const raw=text.slice(node.start,node.end),parsed=parsedTemplate(raw);
            if(parsed.parts.length!==1||!v219OriginalTemplateHeaderAllowed(parsed.parts[0])||
                !v215SameTemplateTitle(parsed.parts[0],'Referências')||!v215LiteralTemplateIdentity(raw))continue;
            const candidate=normalizeLists(raw,()=>{},()=>{});
            if(candidate!=='{{Referências}}'||candidate===raw)continue;
            edits.push({start:node.start,end:node.end,text:candidate});
        }
        if(edits.length){const next=v24SyntaxApply(text,edits);steps.push({kind:'existing-bare-native-collector-first-letter',
            beforeHash:v24SyntaxHash(text),afterHash:v24SyntaxHash(next),count:edits.length});text=next;}
        return steps.length?{...empty,steps,text:shield.restore(text)}:empty;
    }
    function v219ReferenceLegacyCollectorProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219ReferenceLegacyCollectorPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
    }
    function v219ReferenceQuotationIssueInventory(source,originalBodies) {
        const parsed=v219NativeReferenceObserver(source),issues=v24SyntaxScan(source).issues,inventory=[];
        if(!issues.length||parsed.unclosed.length||parsed.empties.length||parsed.shield.unclosed.length)return null;
        for(const issue of issues){
            if(issue.kind!=='quotation'||issue.code!=='syntax-opaque-unclosed'||source[issue.start]!=='"')return null;
            const owner=parsed.refs.find(ref=>ref.valid&&ref.body!==null&&ref.close&&
                ref.close.start-ref.body.length<=issue.start&&issue.start<ref.close.start);
            if(!owner||!originalBodies.has(owner.body))return null;
            inventory.push([issue.kind,issue.code,owner.attrs,owner.body,issue.start-(owner.close.start-owner.body.length),issue.end===source.length]);
        }
        return inventory;
    }
    function v219ReferenceQuotationRecoveryRetention(before,after,options={}) {
        const reject={accepted:false,reason:'A recuperação de leitura não comprovou a mesma referência e a mesma lista.'},cfg={...DEFAULTS,...options},
            original=v219ReferenceBindingState(before,cfg),actual=v219ReferenceBindingState(after,cfg);
        if(!original.eligible||actual.eligible||v24SyntaxScan(before).issues.length)return reject;
        const rawAfter=v219RawNamedReferenceClasses(after);
        for(const [key,bodies]of v219RawNamedReferenceClasses(before))
            if(bodies.size===1&&(rawAfter.get(key)?.size||0)>1)return reject;
        const plan=v219ReferenceLegacyCollectorPlan(before,cfg);
        if(!plan.steps.length||!v219ReferenceLegacyCollectorProof(before,plan.text,plan,cfg))return reject;
        let expected=v25ApprovedSyntaxPlan(plan.text,cfg).text;
        expected=cfg.references===false?v219BareReferenceSourceProjection(expected,cfg):v25ReferenceProofNormalization(expected,cfg);
        if(v219ReferenceBindingState(expected,cfg).eligible)return reject;
        const bodies=new Set(v219NativeReferenceObserver(before).refs.filter(ref=>ref.body!==null).map(ref=>ref.body)),
            expectedIssues=v219ReferenceQuotationIssueInventory(expected,bodies),actualIssues=v219ReferenceQuotationIssueInventory(after,bodies);
        if(!expectedIssues||!actualIssues||JSON.stringify(expectedIssues)!==JSON.stringify(actualIssues))return reject;
        const retained=v219PartialReferenceRetention(before,expected,after,cfg);
        return retained.accepted?{...retained,sourceQuotationRecovery:true}:reject;
    }
