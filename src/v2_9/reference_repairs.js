    // 2.9: literal reference repairs with an exact source-bound plan.
    function v29ReferenceScope(source,cfg={}) {
        return typeof source==='string'&&source.length<=4194304&&cfg.references!==false&&cfg.automaticReferenceRepairs!==false&&v24SyntaxScope(cfg)&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            !/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(protectedView(source));
    }
    function v29ReferenceShield(source) {
        const shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),ranges=[...shield.ranges,...markdown];
        return {...shield,ranges,view:v24SyntaxMaskRanges(shield.view,markdown)};
    }
    function v29ReferenceOverlap(start,end,ranges) {
        if(!ranges.length)return false;const index=rangeIndex(ranges),at=rangePosition(end-1,index);return at>=0&&index.max[at]>start;
    }
    function v29ReferenceName(value) {
        return typeof value==='string'&&value.length>0&&value===value.trim()&&!/[{}\[\]<>|&\r\n"'=\u0000-\u001f\uE000-\uF8FF]/.test(value);
    }
    function v29ReferenceTag(source,ref) {
        const opening=v24SyntaxTag(source,ref.start);
        return !!opening&&/^<ref\b/i.test(opening.raw)&&!/\/\s+>$/.test(opening.raw)&&
            (!ref.close||/^<\/ref\s*>$/i.test(ref.close.raw));
    }
    function v29ReferenceBody(value) {
        if(typeof value!=='string'||!value.trim()||!v24SyntaxBodySafe(value)||/<!--|<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(value))return false;
        const shield=v29ReferenceShield(value);if(shield.unclosed.length||shield.ranges.length)return false;
        const nodes=templates(value);if(nodes.unclosed.length)return false;
        // Unknown templates may emit references or depend on expansion order.
        return nodes.nodes.every(node=>!!CITE_NAMES[parsedTemplate(value.slice(node.start,node.end)).name]);
    }
    function v29ReferenceContext(source,cfg={}) {
        if(!v29ReferenceScope(source,cfg)||!/<\s*ref\b/i.test(source))return null;
        const shield=v29ReferenceShield(source);if(shield.unclosed.length||v24SyntaxScan(source).issues.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return null;
        const parsed=v24SyntaxReferences(source);if(parsed.unclosed.length||parsed.empties.length)return null;
        const nodes=templates(shield.view);if(nodes.unclosed.length)return null;
        if(nodes.nodes.some(node=>['refn','nre','efn','r','#tag:ref'].includes(parsedTemplate(source.slice(node.start,node.end)).name)))return null;
        const renderers=rendererRanges(shield.view),refs=parsed.refs,region=at=>renderers.filter(renderer=>renderer.end<=at).length;
        if(refs.some(ref=>!ref.valid||!ref.attrs||!v29ReferenceTag(source,ref)||!v24SyntaxLiteralIdentity(ref.attrs)||ref.container||!ref.renderer.valid||inRange(ref.start,renderers)))return null;
        const blocked=ref=>v29ReferenceOverlap(ref.start,ref.end,shield.ranges)||inRange(ref.start,nodes.nodes);
        const definitions=new Map(),uses=new Map(),key=(group,name)=>JSON.stringify([group,name]);
        const bodyProofs=new Map(),bodySignature=value=>{if(!bodyProofs.has(value))bodyProofs.set(value,v29ReferenceBody(value)?v27SafeReferenceBody(value,cfg):null);return bodyProofs.get(value);};
        for(const ref of refs){if(!ref.attrs.name)continue;const group=ref.group||'',name=ref.attrs.name,identity=key(group,name);
            if(!uses.has(identity))uses.set(identity,[]);uses.get(identity).push(ref);
            if(ref.body!==null&&ref.body.trim()){if(!definitions.has(identity))definitions.set(identity,[]);definitions.get(identity).push(ref);}}
        const families=new Map();for(const [identity,list]of definitions){const first=list[0],all=uses.get(identity)||[],at=region(first.start),bodies=new Set(list.map(ref=>ref.body));
            if(!v29ReferenceName(first.attrs.name)||!v29ReferenceName(first.group||'x')||bodies.size!==1||all.some(ref=>blocked(ref)||region(ref.start)!==at))continue;
            const signature=bodySignature(first.body);if(signature===null)continue;
            families.set(identity,{identity,name:first.attrs.name,group:first.group||'',body:first.body,signature,definition:first,definitions:list,uses:all,region:at});}
        return {source,shield,refs,renderers,nodes,definitions,uses,families,region,blocked,key,bodySignature};
    }
    function v29ReferenceSyntaxEdits(source,cfg={}) {
        if(!v29ReferenceScope(source,cfg)||cfg.syntaxRepairs===false||!/<\s*\/\s*ref\s*>[ \t]*<\s*\/\s*ref\s*>/i.test(source))return [];
        const shield=v29ReferenceShield(source);if(shield.unclosed.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return [];
        const parsed=templates(shield.view);if(parsed.unclosed.length)return [];
        const scan=v24SyntaxScan(source),refs=v24SyntaxReferences(source),edits=[],byClose=new Map(refs.refs.filter(ref=>ref.close).map(ref=>[ref.close.start,ref]));
        if(!scan.issues.length||scan.issues.some(issue=>issue.code!=='syntax-stray-tag')||refs.unclosed.length||refs.empties.length)return [];
        const tokens=scan.tokens;
        for(let index=1;index<tokens.length;index++){const duplicate=tokens[index],first=tokens[index-1];
            if(duplicate.name!=='ref'||!duplicate.close||duplicate.typo||duplicate.self||duplicate.attrs.trim()||!/^<\/ref\s*>$/i.test(duplicate.raw)||first.name!=='ref'||!first.close||first.typo||first.attrs.trim()||!/^\s*$/.test(source.slice(first.end,duplicate.start))||/[\r\n]/.test(source.slice(first.end,duplicate.start)))continue;
            const ref=byClose.get(first.start);
            if(!ref||!ref.valid||!v29ReferenceTag(source,ref)||!v24SyntaxLiteralIdentity(ref.attrs)||!v29ReferenceBody(ref.body)||ref.container||!ref.renderer.valid||inRange(ref.start,parsed.nodes)||v29ReferenceOverlap(ref.start,duplicate.end,shield.ranges))continue;
            // One duplicated closing token is finite. Longer chains are left intact.
            const next=tokens[index+1];if(next?.name==='ref'&&next.close&&/^[ \t]*$/.test(source.slice(duplicate.end,next.start)))continue;
            edits.push({start:duplicate.start,end:duplicate.end,text:'',ruleId:'v29ReferenceClosers',proof:{sourceHash:v24SyntaxHash(source),openingStart:ref.start,firstCloseStart:first.start,body:ref.body,condition:'one adjacent extra closer after one complete literal nonnested reference'}});
        }
        const positions=new Set(edits.map(edit=>edit.start));if(!edits.length||scan.issues.length!==edits.length||scan.issues.some(issue=>!positions.has(issue.start)))return [];
        const after=v24SyntaxApply(source,edits);return v24SyntaxScan(after).issues.length?[]:edits;
    }
    function v29ReferenceSyntaxPlan(source,cfg={}) {
        const edits=v29ReferenceSyntaxEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),text:v24SyntaxApply(source,edits),edits};
    }
    function v29ReferenceRepairEdits(source,cfg={}) {
        const context=v29ReferenceContext(source,cfg);if(!context)return [];
        const actions=new Map(),virtual=new Map(),{refs,families,key,blocked,region,bodySignature}=context,hash=v24SyntaxHash(source),merge=cfg.automaticIdenticalReferences!==false;
        const set=(ref,text,ruleId,proof)=>actions.set(ref.start,{start:ref.start,end:ref.end,text,ruleId,proof:{sourceHash:hash,...proof}});
        const bodyFamilies=new Map();if(merge)for(const family of families.values()){
            // Complete definitions in this family have one exact body. The
            // existing normalizer may later retain only its first occurrence.
            const signature=JSON.stringify([family.group,family.region,family.signature]);if(!bodyFamilies.has(signature))bodyFamilies.set(signature,[]);bodyFamilies.get(signature).push(family);}
        for(const list of bodyFamilies.values())list.sort((a,b)=>a.definition.start-b.definition.start);
        for(const ref of refs){if(blocked(ref))continue;const attrs=ref.attrs,group=ref.group||'';
            if(!Object.keys(attrs).length&&(ref.body===null||/^[ \t\r\n]*$/.test(ref.body))){
                set(ref,'','v29EmptyReferences',{condition:'no attributes and no source content',body:ref.body});virtual.set(ref.start,{removed:true});continue;}
            if(!merge||Object.keys(attrs).some(attribute=>attribute!=='group')||ref.body===null)continue;
            const signature=bodySignature(ref.body);if(signature===null)continue;
            const matches=bodyFamilies.get(JSON.stringify([group,region(ref.start),signature]))||[],family=matches[0];if(!family)continue;
            const text='<ref name="'+family.name+'"'+(group?' group="'+group+'"':'')+' />';
            set(ref,text,'v29MixedReferences',{name:family.name,group,body:ref.body,definitionBody:family.body,normalizedBody:signature,definitionStart:family.definition.start,condition:'every complete body field matches after existing deterministic citation normalization; existing unambiguous named definition; same literal group and collector interval'});
            virtual.set(ref.start,{name:family.name,group,body:null,family});
        }
        if(merge){let previous=null,seen=new Set();const remainingDefinitions=new Map([...families].map(([identity,family])=>[identity,family.definitions.length]));
            for(const ref of refs){if(previous&&!/^[ \t]*$/.test(source.slice(previous.end,ref.start)))seen=new Set();previous=ref;
                const item=virtual.get(ref.start);if(item?.removed)continue;
                if(blocked(ref)){seen=new Set();continue;}
                const name=item?.name??ref.attrs.name,group=item?.group??ref.group??'',identity=name?key(group,name):null,family=identity?families.get(identity):null,body=item?item.body:ref.body;
                if(!family){seen=new Set();continue;}
                const definition=body!==null&&!!body.trim(),canRemove=!definition||(remainingDefinitions.get(identity)||0)>1;
                if(seen.has(identity)&&canRemove){
                    set(ref,'','v29AnchorReferences',{name,group,body:family.body,definitionStart:family.definition.start,condition:'repeated identical binding inside one uninterrupted reference cluster; at least one complete definition remains'});
                    if(definition)remainingDefinitions.set(identity,remainingDefinitions.get(identity)-1);
                }else seen.add(identity);
            }
        }
        return [...actions.values()].sort((a,b)=>a.start-b.start);
    }
    function v29ReferenceRepairPlan(source,cfg={}) {
        if(typeof source!=='string')throw new TypeError('O texto precisa ser uma string.');
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};
        for(const [name,find]of [['v29-reference-closers',v29ReferenceSyntaxEdits],['v29-reference-repairs',v29ReferenceRepairEdits]]){
            const before=plan.text,edits=find(before,cfg);if(!edits.length)continue;const after=v24SyntaxApply(before,edits);
            plan.steps.push({name,before,after,edits});plan.edits.push(...edits);plan.text=after;
        }
        return plan;
    }
    function v29ReferenceRepairProjection(source,cfg={}) {return v29ReferenceRepairPlan(source,cfg).text;}
    function v29ReferenceRepairProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v29ReferenceRepairPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v29ReferenceRepairInventory(source,cfg={}) {
        const value=v25ReferenceProofNormalization(source,cfg),bodies=v24InventoryReferences(value,cfg);
        return JSON.stringify({bodies:[...bodies].sort((a,b)=>a[0].localeCompare(b[0])),bindings:v25ReferenceBindingSequence(value,cfg),literals:[...v25ProtectedLiteralInventory(source)].sort((a,b)=>a[0].localeCompare(b[0]))});
    }
    function v29ReferenceRepairRetention(before,after,cfg={}) {
        const plan=v29ReferenceRepairPlan(before,cfg);if(!plan.edits.length)return {accepted:true,reason:''};
        // Remaining independent repairs can still be unchecked in the diff.
        // Project only those same finite rules before comparing the objects.
        const actual=v29ReferenceRepairInventory(v29ReferenceRepairProjection(after,cfg),cfg),expected=v29ReferenceRepairInventory(plan.text,cfg);
        return actual===expected?{accepted:true,reason:''}:{accepted:false,reason:'Uma referência perdeu conteúdo, nome, grupo ou uma chamada além dos ajustes confirmados.'};
    }
