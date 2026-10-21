    // An ignored invalid identifier does not authorize its own activation.
    // These exceptions retain it byte for byte and expose only one fresh,
    // independently proved operation to the existing protected-stage filter.
    function v219IgnoredCitationIdentifierContext(raw) {
        if(typeof raw!=='string'||!raw.includes('isbn10'))return null;
        const context=v219NormalizedNativeCitationContext(raw),fields=context&&v2151FieldSyntaxParts(raw);
        if(!fields||!v219SourceNativeContract(raw,context)||
            fields.some(field=>field.key!==field.plain||field.separator!=='='))return null;
        let ignored=false;
        for(const field of fields){
            if(typeof V219_CITATION_UNPROVED_KEYS[norm(field.key)]!=='string'||
                nativeCitationAccepts(context.native,field.key))continue;
            if(field.key!=='isbn10'||v219NativeIdentifierMappingAllowed(raw,field.key,'isbn',field.value))return null;
            ignored=true;
        }
        const refusal=v219CitationUnprovedKeyRefusal(raw,translationProfile(raw));
        return ignored&&refusal?.proof?.sourceKey==='isbn10'?{context,fields}:null;
    }
    // A pinned local redirect may forward its unchanged opaque arguments.
    // This owner permission is header-only; it never exposes parameter repairs.
    function v219IgnoredCitationHeaderContext(raw) {
        const identifier=v219IgnoredCitationIdentifierContext(raw);if(identifier)return identifier;
        if(typeof raw!=='string'||!/[|][\s_]*langue[\s_]*=/iu.test(raw)||!v219LocalCitationRedirectProfile(raw))return null;
        const context=v219NormalizedNativeCitationContext(raw),call=context&&v219CitationLanguageCall(raw),
            fields=v2151FieldSyntaxParts(raw);
        if(!fields?.length||fields.some(field=>field.key!==field.plain||field.separator!=='='||
            /[{}\[\]<>&|"'\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\uFEFF\uE000-\uF8FF]/u.test(
                field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''))))return null;
        return context&&v219SourceNativeContract(raw,context)&&call?.opaque&&!call.foreign&&call.opaqueIdentity?
            {context,fields:[],opaqueLangue:true}:null;
    }
    function v219IgnoredCitationHeaderPlan(source,options={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]},
            cfg={...DEFAULTS,...options};
        if(typeof source!=='string'||source.length>4194304||!v24SyntaxScope(cfg)||cfg.citations===false||cfg.multilingual===false||
            cfg.namespaceNumber!==0||cfg.pageRedirect||cfg.pageDisambiguation||cfg.discussionPage||cfg.sectionOnly||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||!v20AutomationAllowed(source,cfg)||
            !source.includes('isbn10')&&!/[|][\s_]*langue[\s_]*=/iu.test(source)||!/\{\{[\s_]*(?:(?:Template|Predefinição)[\s_]*:[\s_]*)?Cite[\s_]+(?:web|news|book|journal|magazine)(?=[\s_]*(?:\||\}\}))/i.test(source)||
            v24SyntaxScan(source).issues.length)return empty;
        const shield=v219SourceCompatibilityShield(source),nodes=templates(shield.view),edits=[];
        if(shield.unclosed.length||nodes.unclosed.length)return empty;
        for(const node of nodes.nodes){
            if(nodes.nodes.some(parent=>parent.start<node.start&&parent.end>=node.end)||
                shield.ranges.some(range=>range.start<node.end&&range.end>node.start))continue;
            const raw=source.slice(node.start,node.end),local=v219LocalCitationRedirectProfile(raw),
                contract=local&&V219_NATIVE_CITATION_REDIRECTS.find(row=>row.oldid===local.nativeAliasOldid),
                ignored=contract&&v219IgnoredCitationHeaderContext(raw);
            if(!ignored||ignored.opaqueLangue&&!translationEnabled(local,cfg)||!v215SameTemplateTitle(ignored.context.parsed.parts[0],contract.title)||
                local.target!==ignored.context.profile.title||local.nativeTemplateOldid!==ignored.context.profile.oldid)continue;
            const header=ignored.context.parsed.parts[0],padding=/^([ \t\r\n]*)[\s\S]*?([ \t\r\n]*)$/.exec(header),
                text=padding[1]+local.target+padding[2];
            edits.push({start:node.start+2,end:node.start+2+header.length,text,ruleId:'translatedTemplates',proof:{
                sourceHash:empty.sourceHash,kind:ignored.opaqueLangue?'native-header-with-opaque-langue':'native-header-with-ignored-identifier',ownerStart:node.start,ownerEnd:node.end,
                nativeAliasOldid:local.nativeAliasOldid,nativeTemplateOldid:local.nativeTemplateOldid,
                nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,headerBefore:header,headerAfter:text,
                changeRules:['translatedTemplates'],minorSafe:true,
                method:'exact original local CS1 redirect; header only; every raw argument and ignored field byte retained'}});
        }
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219IgnoredCitationHeaderProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219IgnoredCitationHeaderPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219IgnoredCitationStageOwners(source,edits,name,cfg={}) {
        const header=name==='v219-ignored-citation-header',page=name==='v219-source-compatibility';
        if(!header&&!page||!edits.some(edit=>header?['native-header-with-ignored-identifier','native-header-with-opaque-langue'].includes(edit.proof?.kind):edit.proof?.kind==='page'))return [];
        const plan=header?v219IgnoredCitationHeaderPlan(source,cfg):v219SourceCompatibilityPlan(source,cfg),
            verified=header?v219IgnoredCitationHeaderProof(source,plan.text,plan,cfg):v219SourceCompatibilityProof(source,plan.text,plan,cfg);
        if(!verified||JSON.stringify(plan.edits)!==JSON.stringify(edits))return [];
        const owners=[];
        for(const node of templates(source).nodes){
            const raw=source.slice(node.start,node.end),ignored=header?v219IgnoredCitationHeaderContext(raw):v219IgnoredCitationIdentifierContext(raw);
            if(!ignored)continue;
            const contained=edits.filter(edit=>node.start<=edit.start&&edit.end<=node.end);
            if(!contained.length||contained.some(edit=>{
                const proof=edit.proof||{};
                if(proof.nativeConfigOldid!==73016847||proof.nativeWhitelistOldid!==71860752||
                    proof.nativeTemplateOldid!==ignored.context.profile.oldid||proof.sourceHash!==plan.sourceHash)return true;
                if(header)return proof.kind!==(ignored.opaqueLangue?'native-header-with-opaque-langue':'native-header-with-ignored-identifier')||proof.ownerStart!==node.start||
                    proof.ownerEnd!==node.end||edit.start!==node.start+2||edit.end!==node.start+2+proof.headerBefore.length||
                    source.slice(edit.start,edit.end)!==proof.headerBefore||edit.text!==proof.headerAfter;
                const field=ignored.fields.find(field=>node.start+field.keyStart===edit.start&&node.start+field.keyEnd===edit.end),
                    rule=field&&v219SourceCompatibilityRule(field.key);
                return !field||rule?.kind!=='page'||proof.kind!=='page'||proof.sourceKey!==field.key||
                    proof.targetKey!==rule.target||edit.text!==rule.target||proof.value!==field.value;
            }))continue;
            owners.push({start:node.start,end:node.end});
        }
        return owners;
    }
