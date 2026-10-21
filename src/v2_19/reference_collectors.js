    // Referências 63785697 emits an H2 unless its heading is overridden.
    // This plan repairs a literal redundant parent section. It never merges,
    // removes, renames or changes the contents of a reference collector.
    const V219_NATIVE_REFERENCE_COLLECTOR_ALIASES=Object.freeze({
        'Referências':63785697,'Referencias':53514607,'References':57539382,
        'Referência':46305837,'Referencia':68804251
    });
    function v219NativeReferenceCollectorAlias(rawName) {
        if(typeof rawName!=='string')return null;
        const literal=rawName.replace(/_/g,' ').trim().replace(/^(?:predefinição|template)\s*:\s*/i,''),
            name=literal.slice(0,1).toUpperCase()+literal.slice(1),
            oldid=Object.hasOwn(V219_NATIVE_REFERENCE_COLLECTOR_ALIASES,name)?
                V219_NATIVE_REFERENCE_COLLECTOR_ALIASES[name]:null;
        return oldid?{name,oldid,target:'Referências',targetOldid:63785697}:null;
    }
    function v219NativeReflistIdentity(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
        const head=splitParts(raw.slice(2,-2))[0].trim().replace(/_/g,' ')
            .replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
        return /^[Rr]eflist$/.test(head);
    }
    function v219BankBaseNativeReflistCall(raw,cfg={}) {
        if(!v219NativeReflistIdentity(raw))return null;
        const result={source:raw,text:raw,handled:true,converted:false,blocked:true,quietNativeRefusal:true,
            issues:[],nativeSourceOldid:56151616,nativeTargetOldid:63785697};
        if(cfg.references===false||raw.length>4194304||/[\uE000-\uF8FF]|\{\{\{/.test(raw))return result;
        const parsed=templates(raw),syntax=v24SyntaxScan(raw);
        if(parsed.unclosed.length||syntax.issues.length)return result;
        const roots=parsed.nodes.filter(node=>node.depth===0);
        if(roots.length!==1||roots[0].start!==0||roots[0].end!==raw.length)return result;
        const p=parsedTemplate(raw),entries=foreignEntries(p),seen=new Set(),values=[],families=new Set(),
            targets={group:'grupo',grupo:'grupo',refs:'refs',liststyle:'estilolista',
                estilolista:'estilolista',listaestilo:'estilolista'};
        for(const entry of entries) {
            // Native column fields alter width or responsive behavior. The
            // current target cannot inherit them by simply dropping a field.
            if(entry.positional||/^\d+$/.test(entry.key)||!Object.hasOwn(targets,entry.key)||seen.has(entry.key))return result;
            seen.add(entry.key);
            const target=targets[entry.key];
            // The native alias fallback honors explicit blank values. Retain
            // collisions literally instead of guessing which value to expose.
            if(families.has(target))return result;
            families.add(target);
            if(target!=='refs'&&/[{}<>\r\n]/.test(entry.value))return result;
            values.push(target+'='+entry.value);
        }
        const text='{{Referências'+(values.length?'|'+values.join('|'):'')+'|nível=0}}';
        return {...result,text,converted:text!==raw,blocked:false,
            condition:'native Reflist 56151616 is always headingless; native Referências 63785697 preserves its unique literal selected group, exact reference bank and list style only with explicit nível=0; column fields, alias collisions, duplicate keys and dynamic identities remain unchanged'};
    }
    function v219NativeReflistProof(before,after,cfg={}) {
        const fresh=v219NativeReflistCall(before,cfg);
        return !!fresh&&fresh.converted&&typeof after==='string'&&fresh.text===after;
    }
    function v219UncertainReferenceIdentity(value) {
        if(typeof value!=='string')return false;
        if(/[\u0000-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/.test(value)||
            /&(?:nbsp|ensp|emsp|thinsp|ZeroWidthSpace);/i.test(value))return true;
        for(const hit of value.matchAll(/&([a-z][a-z\d]*);/gi))
            if(!['amp','quot','apos','lt','gt'].includes(hit[1]))return true;
        for(const hit of value.matchAll(/&#(?:x([\da-f]+)|(\d+));/gi)){
            const scalar=hit[1]?parseInt(hit[1],16):Number(hit[2]);
            if(!Number.isSafeInteger(scalar)||scalar<32||scalar>=127&&scalar<=159||
                [0xA0,0x1680,0x2028,0x2029,0x202F,0x205F,0x3000,0xFEFF].includes(scalar)||
                scalar>=0x2000&&scalar<=0x200B||scalar>=0xD800&&scalar<=0xDFFF||scalar>0x10FFFF)return true;
        }
        return false;
    }
    function v219ReferenceIdentityQuarantine(source,cfg={},collectAll=false) {
        const empty={opaque:false,ranges:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            !/<ref\b|<references\b|\{\{/i.test(source)||
            !collectAll&&!(/[&\u007F-\u009F\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/.test(source)||
                /(?:name|group|grupo)\s*=[^\r\n>|}]*[\u0000-\u001F]/i.test(source)||
                /\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:r(?:\/ref)?|referências[ _]+múltiplas|refn|nre|efn|sfn(?:p|m|mp)?|harvref|#tag\s*:\s*ref)(?=[\s_|}])/i.test(source)))return empty;
        const observed=v219NativeReferenceObserver(source),generatedBoundary=v219GeneratedReferenceBoundary(source,observed),renderers=rendererRanges(observed.view),
            uncertainList=renderers.some(range=>{
                const raw=source.slice(range.start,range.end),tag=v24SyntaxTag(raw,0);
                if(tag?.name==='references')return v219UncertainReferenceIdentity(v24SyntaxAttrs(tag.attrs)?.group||'');
                return foreignEntries(parsedTemplate(raw)).some(field=>['group','grupo'].includes(field.key)&&
                    v219UncertainReferenceIdentity(field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'')));
            });
        const partial=[...observed.unclosed,...observed.empties],helperUses=referenceNameUses(observed.view),
            uncertainHelper=observed.helpers.some(helper=>!helper.eligible&&!(helper.helperKind==='generated-note'&&generatedBoundary.safe))||helperUses.some(use=>v219UncertainReferenceIdentity(use.value)||v219UncertainReferenceIdentity(use.group||''))||
                templates(observed.view).nodes.some(node=>{const p=parsedTemplate(source.slice(node.start,node.end));
                    if(!['r','refn','nre','efn','#tag:ref'].includes(p.name))return false;
                    return foreignEntries(p).some(field=>(['name','nome','follow','group','grupo'].includes(field.key)||p.name==='r'&&(field.positional||/^\d+$/.test(field.key)||field.key==='g'))&&
                        v219UncertainReferenceIdentity(field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'')));});
        const opaque=uncertainList||uncertainHelper||[...observed.refs,...partial].some(ref=>ref.attrs&&['name','group'].some(key=>
            Object.hasOwn(ref.attrs,key)&&v219UncertainReferenceIdentity(ref.attrs[key])));
        if(!opaque&&!collectAll)return empty;
        // An unproved native alias can refer to a literal definition or list
        // anywhere on the page. Freeze this subsystem rather than invent an
        // entity decoder or generate a name conflicting with a hidden source.
        const ranges=[...[...observed.refs,...partial].map(ref=>({start:ref.start,end:ref.end,kind:'uncertain-reference-identity'})),
            ...renderers.map(range=>({...range,kind:'uncertain-reference-collector'})),
            ...observed.helpers.map(helper=>({start:helper.start,end:helper.end,kind:'uncertain-reference-emitter'})),
            ...templates(observed.view).nodes.filter(node=>{
                const name=parsedTemplate(source.slice(node.start,node.end)).name;
                return STRUCTURAL_NOTE_CALLS.has(name)||['sfnmp','notetag','nota de rodapé','harvref','#tag:ref'].includes(name);
            }).map(node=>({...node,kind:'uncertain-reference-emitter'}))];
        const unique=new Map();for(const range of ranges)if(!unique.has(range.start+':'+range.end))unique.set(range.start+':'+range.end,range);
        return {opaque,ranges:[...unique.values()].sort((a,b)=>a.start-b.start||a.end-b.end)};
    }
    function v219UncertainReferenceRanges(source,cfg={}) {
        return v219ReferenceIdentityQuarantine(source,cfg).ranges;
    }
    function v219PartialReferenceQuarantineRanges(source,prefixEnd,cfg={}) {
        if(typeof source!=='string'||!Number.isInteger(prefixEnd)||prefixEnd<=0||prefixEnd>=source.length)return [];
        // The unedited tail can contain the identity which makes the whole
        // reference subsystem opaque. Observe that exact full source before
        // masking its prefix, retaining its original UTF-16 offsets.
        const ranges=v219UncertainReferenceRanges(source,cfg),observed=v219NativeReferenceObserver(source);
        for(const ref of observed.refs){
            if(ref.body===null||ref.end>prefixEnd)continue;
            let frozen=!ref.valid||!ref.renderer.valid||ref.container&&!ref.container.valid||ref.body.length>65536;
            if(!frozen){
                const first=ref.body.indexOf('{{');
                if(first>=0&&ref.body.indexOf('{{',first+2)>=0){
                    const syntax=v24SyntaxTemplates(ref.body),roots=syntax.nodes.filter(node=>node.depth===0&&node.size===2);
                    frozen=roots.length>1&&v219NativeBankBodyIdentity(ref.body,cfg)===null;
                }
            }
            if(frozen)ranges.push({start:ref.start,end:ref.end,kind:'partial-reference-native-owner'});
        }
        return ranges.filter(range=>range.start<prefixEnd)
            .map(range=>({...range,end:Math.min(range.end,prefixEnd)})).sort((a,b)=>a.start-b.start||a.end-b.end);
    }
    function v219UncertainReferenceInventory(source,cfg={},collectAll=false) {
        return v219ReferenceIdentityQuarantine(source,cfg,collectAll).ranges.map(range=>{
            const raw=source.slice(range.start,range.end);
            return [range.kind,raw];
        });
    }
    function v219CosmeticBaseUncertainRetention(before,after,cfg={}) {
        let originalFrozen=false;
        const compare=source=>{
            const generated=v219CosmeticBaseGeneratedRetention(source,after,cfg);
            if(!generated.accepted)return generated;
            const original=v219UncertainReferenceInventory(source,cfg);
            if(source===before)originalFrozen=original.length>0;
            if(!original.length)return {accepted:true,reason:''};
            const actual=v219UncertainReferenceInventory(after,cfg,true);
            return JSON.stringify(original)===JSON.stringify(actual)?{accepted:true,reason:''}:
                {accepted:false,reason:'Referências com identidade não confirmada ou suas listas tiveram o código original alterado.'};
        },original=compare(before);
        if(original.accepted&&!originalFrozen)return original;
        // A fresh approved literal category-key repair can remove the sole
        // unknown owner before reference cleanup. Never require it when the
        // original action was unchanged or conservatively refused.
        const plan=v219GeneratedDefaultSortPlan(before,cfg);
        if(!plan.edits.length||!v219GeneratedDefaultSortProof(before,plan.text,plan,cfg))return original;
        if(original.accepted){
            const pending=value=>value.edits.map(edit=>edit.proof.before).sort(),remaining=v219GeneratedDefaultSortPlan(after,cfg);
            if(JSON.stringify(pending(plan))===JSON.stringify(pending(remaining)))return original;
        }
        return compare(plan.text);
    }
    function v219AtomicNamedReferenceEdits(source,edits,cfg={}) {
        if(typeof source!=='string'||!Array.isArray(edits)||!edits.length||!/<ref\b/i.test(source))return edits;
        const named=refTokens(source).filter(ref=>{
            const attrs=v24SyntaxAttrs(ref.attrs);
            return ref.body!==null&&attrs?.name&&Object.keys(attrs).every(key=>['name','group'].includes(key));
        });
        const peers=v219ReferenceDefinitionPeerRanges(source,named,cfg),classes=new Map();
        for(const peer of peers){
            const key=peer.identity+'\u0000'+peer.bodyHash;
            if(!classes.has(key))classes.set(key,[]);
            if(!classes.get(key).some(ref=>ref.start===peer.start&&ref.end===peer.end))
                classes.get(key).push(peer);
        }
        const blocked=[];
        for(const peers of classes.values()){
            if(peers.length<2)continue;
            const endpoints=[];let changed=false,crossed=false;
            for(const peer of peers){
                const ref=named.find(ref=>ref.start===peer.start&&ref.end===peer.end);
                if(!ref){crossed=true;break;}
                const start=ref.openEnd,end=start+ref.body.length,local=[];
                for(const edit of edits){
                    if(edit.end<=ref.start||edit.start>=ref.end)continue;
                    changed=true;
                    if(edit.start<start||edit.end>end){crossed=true;break;}
                    local.push({...edit,start:edit.start-start,end:edit.end-start});
                }
                if(crossed)break;
                endpoints.push(v24SyntaxApply(ref.body,local));
            }
            if(changed&&(crossed||endpoints.some(value=>value!==endpoints[0])))blocked.push(...peers);
        }
        // The preflight affects only these proposed source spans. It never
        // rewrites a peer, chooses a value or rolls back an unrelated edit.
        // Across multiple native lists this can preserve more than necessary,
        // which is intentional until each independent interval is proved.
        return blocked.length?edits.filter(edit=>!blocked.some(ref=>edit.start<ref.end&&edit.end>ref.start)):edits;
    }
    function v219ReferenceDefinitionPeerRanges(source,alreadyProtected=[],cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!/<ref\b/i.test(source)||
            !Array.isArray(alreadyProtected)||
            cfg.contentModel&&cfg.contentModel!=='wikitext')return [];
        const ranges=alreadyProtected.filter(range=>Number.isInteger(range.start)&&Number.isInteger(range.end)&&
            range.start>=0&&range.end>range.start&&range.end<=source.length);
        // The finite reference writers also exclude prose quotations and
        // emphasized quotations. Only seed affected name classes here, rather
        // than changing the page's general editing protection.
        ranges.push(...v24SyntaxProtected(source).ranges.filter(range=>
            ['quotation','quotation-markup','quotation-template'].includes(range.kind)));
        // Do not use the editing view here: it deliberately hides quotation
        // owners and Markdown examples. A literal ref in one of those owners
        // can still share a native name with a visible copy. Exclude only
        // comments and native raw-content extensions, then use the existing
        // complete ref-token and renderer-group readers without rewriting.
        const opaque=[],literal=new Set(['nowiki','pre','syntaxhighlight','source','math','chem','ce','score']),
            hardTags=new Set(['nowiki','pre','syntaxhighlight','source','code','math','blockquote','q',
                'chem','score','timeline','graph','templatedata','poem','gallery','hiero','imagemap',
                'mapframe','maplink','inputbox']);
        for(let at=source.indexOf('<');at>=0&&at<source.length;){
            if(source.slice(at,at+4)==='<!--'){const close=source.indexOf('-->',at+4);if(close<0)return [];
                opaque.push({start:at,end:close+3});at=source.indexOf('<',close+3);continue;}
            const tag=v24SyntaxTag(source,at);if(!tag){at=source.indexOf('<',at+1);continue;}
            if(!tag.close&&hardTags.has(tag.name)&&!tag.self){const end=new RegExp('<\\s*\\/\\s*'+tag.name+'\\s*>','gi');end.lastIndex=tag.end;
                if(!end.exec(source))return [];
                const range={start:tag.start,end:end.lastIndex};ranges.push(range);
                if(literal.has(tag.name))opaque.push(range);
                at=source.indexOf('<',end.lastIndex);continue;}
            if(!tag.close&&hardTags.has(tag.name)){
                const range={start:tag.start,end:tag.end};ranges.push(range);
                if(literal.has(tag.name))opaque.push(range);
            }
            at=source.indexOf('<',tag.end);
        }
        // The legacy cleanup also preserves indented source lines outside
        // template calls. Read that boundary at original source offsets,
        // after hiding the same complete hard owners and explicit ranges.
        const lineView=v24SyntaxMaskRanges(source,ranges),lineNodes=templates(lineView).nodes;
        let lineStart=0;
        for(const line of source.match(/[^\n]*(?:\n|$)/g)||[]){
            if(!line)continue;
            if(/^[ \t]+\S/.test(line)&&!inRange(lineStart,lineNodes))
                ranges.push({start:lineStart,end:lineStart+line.length});
            lineStart+=line.length;
        }
        if(!ranges.length)return [];
        const view=v24SyntaxMaskRanges(source,opaque),nodes=v24SyntaxTemplates(view),containers=[],stack=[];
        for(let at=view.indexOf('<');at>=0&&at<view.length;){const tag=v24SyntaxTag(view,at);if(!tag){at=view.indexOf('<',at+1);continue;}at=view.indexOf('<',tag.end);
            if(tag.name!=='references'||tag.self)continue;
            if(!tag.close){const attrs=v24SyntaxAttrs(tag.attrs);stack.push({start:tag.start,end:source.length,
                valid:!!attrs&&Object.keys(attrs).every(key=>['group','responsive'].includes(key))&&v24SyntaxLiteralIdentity(attrs),group:attrs?.group||''});}
            else if(stack.length){const container=stack.pop();containers.push({...container,end:tag.end});}
        }
        if(stack.length)return [];
        const collectorAncestors=nodes.nodes.filter(node=>{
            const parts=v24SyntaxParts(source.slice(node.start+2,node.end-2));
            return !!parts&&V24_SYNTAX_RENDERERS.has(v24SyntaxName(parts[0].text));
        }),families=new Map();
        let uncertainEntities=false;
        for(const ref of refTokens(view)){
            const attrs=v24SyntaxAttrs(ref.attrs),renderer=v24SyntaxRendererContext(view,ref.start,nodes),
                container=containers.filter(item=>item.start<ref.start&&item.end>ref.end).at(-1),
                unresolvedCollector=!renderer.valid&&collectorAncestors.some(node=>node.start<ref.start&&ref.end<node.end);
            // This reader only adds protection. A quoted literal name can
            // contain a pipe without authorizing any writer to reinterpret it.
            const literalIdentity=attrs&&Object.values(attrs).every(value=>typeof value==='string'&&
                (value.trim()===value||v219UncertainReferenceIdentity(value))&&!/[{}\[\]<>]/.test(value));
            if(!attrs?.name||!literalIdentity||Object.keys(attrs).some(key=>!['name','group'].includes(key))||
                container&&!container.valid||unresolvedCollector||nodes.unclosed.some(node=>node.start<ref.start))continue;
            // Ordinary template owners are opaque to writers, not a reason
            // to overlook a literal named definition sharing the same source
            // body. With no native collector ancestor, conservatively protect
            // its literal explicit/default group class. No expansion result
            // or authority to rewrite the owner is inferred. Native collector
            // inheritance still requires the strict renderer proof above.
            const group=decodedReferenceName(attrs.group??container?.group??renderer.group??''),
                name=decodedReferenceName(attrs.name),
                identity=JSON.stringify([group,name]),body=ref.body===null?null:source.slice(ref.openEnd,ref.openEnd+ref.body.length);
            const uncertainEntity=Object.values(attrs).some(value=>v219UncertainReferenceIdentity(value)||value.includes('&')&&value.replace(
                /&(?:#\d+|#x[\da-f]+|[a-z][a-z\d]+);/gi,
                entity=>decodedReferenceName(entity)!==entity?'':entity).includes('&'));
            uncertainEntities||=uncertainEntity;
            if(!families.has(identity))families.set(identity,[]);
            families.get(identity).push({...ref,body,uncertainEntity});
        }
        for(const helper of [...v219NativeRProfiles(view),...v219NativeNoteProfiles(view)])if(helper.eligible)for(const call of helper.calls){
            const identity=JSON.stringify([call.group,call.value]);
            if(!families.has(identity))families.set(identity,[]);
            families.get(identity).push({start:helper.start,end:helper.end,body:call.body??null,helper:true});
        }
        const protectedPeers=[],sourceHash=v24SyntaxHash(source);
        for(const [identity,members]of families){
            const definitions=members.filter(ref=>ref.body!==null);
            if(members.some(ref=>(ref.body===null||ref.helper)&&ranges.some(range=>range.start<ref.end&&range.end>ref.start))){
                const bodyHash=v24SyntaxHash(JSON.stringify(definitions.map(ref=>ref.body)));
                for(const ref of members)protectedPeers.push({start:ref.start,end:ref.end,kind:'reference-definition-peer',
                    sourceHash,identity,bodyHash,definitions:definitions.length,protectedNamedCall:true});
                continue;
            }
            if(definitions.length<2||!definitions[0].body.trim()||
                definitions.some(ref=>ref.body!==definitions[0].body)||
                !definitions.some(ref=>ranges.some(range=>range.start<ref.end&&range.end>ref.start)))continue;
            const bodyHash=v24SyntaxHash(definitions[0].body);
            for(const ref of definitions)protectedPeers.push({start:ref.start,end:ref.end,kind:'reference-definition-peer',
                sourceHash,identity,bodyHash,definitions:definitions.length});
        }
        // Unknown entity spellings do not authorize a new decoder or an
        // identity equivalence. Preserve the exact raw-body class instead if
        // it contains both an uncertain identity and a protected definition.
        // This is deliberately conservative on either side of that boundary.
        if(uncertainEntities){
            const bodies=new Map();
            for(const definitions of families.values())for(const ref of definitions){
                if(ref.body===null)continue;
                if(!bodies.has(ref.body))bodies.set(ref.body,[]);
                bodies.get(ref.body).push(ref);
            }
            for(const [body,definitions]of bodies){
                if(definitions.length<2||!body.trim()||!definitions.some(ref=>ref.uncertainEntity)||
                    !definitions.some(ref=>ranges.some(range=>range.start<ref.end&&range.end>ref.start)))continue;
                const bodyHash=v24SyntaxHash(body),identity='uncertain-entity-body:'+bodyHash;
                for(const ref of definitions)protectedPeers.push({start:ref.start,end:ref.end,
                    kind:'reference-definition-peer',sourceHash,identity,bodyHash,definitions:definitions.length,
                    conservativeUnknownEntity:true});
            }
        }
        // A protected copy cannot be rewritten to match an unprotected one.
        // Preserve its complete byte-identical name/group class before any
        // writer runs, so partial date/key/space changes cannot create a new
        // conflicting named definition. This is a protection range only.
        const seen=new Set();
        return protectedPeers.sort((a,b)=>a.start-b.start||a.end-b.end).filter(range=>{
            const key=range.start+':'+range.end;if(seen.has(key))return false;seen.add(key);return true;
        });
    }
    function v219RepeatedNamedDefinitionEdits(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||cfg.references===false||
            cfg.automaticIdenticalReferences===false||!/<ref\b/i.test(source))return [];
        const context=v27SafeContext(source,cfg),parsed=context&&v25SafeCompleteReferences(source);
        if(!context||!parsed)return [];
        const nodes=templates(context.view).nodes,emitters=new Set(['refn','nre','efn','#tag:ref','r','sfn','sfnm',
            'harvref','nota de rodapé','nota de rodape','notetag']);
        if(nodes.some(node=>emitters.has(parsedTemplate(source.slice(node.start,node.end)).name)))return [];
        const refs=parsed.refs,region=at=>context.renderers.filter(renderer=>renderer.end<=at).length,
            families=new Map(),blocked=new Set(),key=ref=>JSON.stringify([ref.group||'',ref.attrs.name||'']);
        // A list-defined bank can inherit a group not written on its ref tag.
        // This rule handles only ordinary explicit definitions and calls.
        if(refs.some(ref=>ref.container||inRange(ref.start,context.renderers)||
            Object.hasOwn(ref.attrs,'follow')||Object.hasOwn(ref.attrs,'details')))return [];
        for(const ref of refs) {
            if(!ref.attrs.name)continue;
            const identity=key(ref);
            if(!v27SafeReferenceName(ref.attrs.name)||!v27SafeLiteral(ref.group||'',true)||
                Object.keys(ref.attrs).some(field=>!['name','group'].includes(field))||
                inRange(ref.start,nodes)||v27SafeOverlap(ref.start,ref.end,context.shield.ranges)) {
                blocked.add(identity);continue;
            }
            if(!families.has(identity))families.set(identity,[]);
            families.get(identity).push(ref);
        }
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const [identity,uses] of families) {
            if(blocked.has(identity))continue;
            const definitions=uses.filter(ref=>ref.body!==null),first=definitions[0];
            if(definitions.length<2||!first.body.trim()||
                definitions.some(ref=>ref.body!==first.body)||
                uses.some(ref=>region(ref.start)!==region(first.start))||
                !v24SyntaxBodySafe(first.body)||v27SafeReferenceBody(first.body,cfg)===null)continue;
            const crossings=[];
            for(const ref of definitions.slice(1))crossings.push({start:first.end,end:ref.start});
            if(!v219CitationLanguageNamedMoveCrossingSafe(source,refs,nodes,crossings))continue;
            const retained=source.slice(first.start,first.end);
            for(const ref of definitions.slice(1)) {
                const opening=v24SyntaxTag(source,ref.start);
                if(!opening||opening.close||opening.self||opening.typo||opening.name!=='ref')continue;
                const text=opening.raw.replace(/\s*>$/,' />');
                edits.push({start:ref.start,end:ref.end,text,ruleId:'v219RepeatedNamedDefinitions',
                    proof:{sourceHash,identity,name:first.attrs.name,group:first.group||'',region:region(first.start),
                        retainedStart:first.start,retainedEnd:first.end,retained,body:first.body,
                        changeRules:['v219RepeatedNamedDefinitions'],retainedReferencePayloads:true,minorSafe:true,
                        condition:'complete mainspace source; one literal group/name family in one collector interval; exact byte-identical nonempty known bodies; attributes name/group only; no bank, protected or nested reference, conflicting definition, follow/details or implicit reference emitter; every definition crossing has the existing Source reference-free certificate; first definition unchanged and only redundant same-name definitions become same-name calls'}});
            }
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v219RepeatedNamedDefinitionPlan(source,cfg={}) {
        const edits=v219RepeatedNamedDefinitionEdits(source,cfg);
        return {source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,edits,
            text:typeof source==='string'?v24SyntaxApply(source,edits):source};
    }
    function v219RepeatedNamedDefinitionProof(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219RepeatedNamedDefinitionPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219NativeCollectorGroupCall(raw,cfg={}) {
        const empty={source:raw,text:raw,changes:[]};
        if(!v212ReferenceFieldScope(cfg)||cfg.automaticParameterDuplicates===false||typeof raw!=='string'||
            /<!--|[<>\uE000-\uF8FF]|\{\{\{|\{\{[^{}]*\{\{/.test(raw)||!raw.startsWith('{{')||!raw.endsWith('}}'))return empty;
        const p=parsedTemplate(raw),alias=v219NativeReferenceCollectorAlias(p.parts[0]),fields=foreignEntries(p),
            groups=fields.filter(field=>field.key==='group');
        if(!alias||groups.length<2||fields.some(field=>field.positional||/^\d+$/.test(field.key)||field.key==='grupo')||
            !groups[0].value.trim()||groups.some(field=>field.value!==groups[0].value))return empty;
        const duplicateIndexes=new Set(groups.slice(0,-1).map(field=>field.index)),
            retained=fields.map(field=>({...field,remove:duplicateIndexes.has(field.index)})),
            middle=translatedEntries(p,retained),repaired=v212CollectorGroupCall(middle,cfg);
        if(repaired.changes.length!==1||repaired.text===middle)return empty;
        const rules=groups.slice(1).map(()=>'parameterDuplicates').concat('v212CollectorGroups');
        return {source:raw,text:repaired.text,middle,alias,changes:rules.map(ruleId=>({ruleId})),
            condition:'one pinned native collector; identical nonempty literal English group fields; no native grupo or positional override; equal duplicates removed and the surviving field repaired by the unchanged native group-field contract; unequal or empty values and nested banks refused'};
    }
    function v219NativeCollectorGroupEdits(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v212ReferenceFieldScope(cfg)||
            cfg.automaticParameterDuplicates===false||!/[|]\s*group\s*=/.test(source))return [];
        const shield=v24SyntaxProtected(source),scan=v24SyntaxScan(source),markdown=v27SafeMarkdownRanges(source);
        if(shield.unclosed.length||scan.issues.length||
            /<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return [];
        const parsed=templates(shield.view),edits=[],sourceHash=v24SyntaxHash(source);
        if(parsed.unclosed.length)return [];
        for(const node of parsed.nodes) {
            if(node.depth!==0||[...shield.ranges,...markdown].some(range=>range.start<node.end&&range.end>node.start))continue;
            const raw=source.slice(node.start,node.end),plan=v219NativeCollectorGroupCall(raw,cfg);
            if(plan.text===raw||!v219BankCollectorGroupIntent(source,node,plan,cfg))continue;
            edits.push({start:node.start,end:node.end,text:plan.text,ruleId:'v219NativeCollectorGroups',
                proof:{sourceHash,raw,middle:plan.middle,canonical:plan.text,nativeAliasOldid:plan.alias.oldid,
                    nativeTargetOldid:plan.alias.targetOldid,condition:plan.condition,
                    changeRules:plan.changes.map(change=>change.ruleId),retainedReferencePayloads:true,minorSafe:true}});
        }
        return edits;
    }
    function v219NativeCollectorGroupPlan(source,cfg={}) {
        const edits=v219NativeCollectorGroupEdits(source,cfg);
        return {source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,edits,
            text:typeof source==='string'?v24SyntaxApply(source,edits):source};
    }
    function v219NativeCollectorGroupProof(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219NativeCollectorGroupPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219BankBaseNativeCollectorGroups(raw) {
        const empty={recognized:false,groups:[],bankGroups:[],ambiguous:false};
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return empty;
        const p=parsedTemplate(raw),head=p.parts[0].replace(/_/g,' ').trim().replace(/^(?:predefinição|template)\s*:\s*/i,''),
            alias=v219NativeReferenceCollectorAlias(head),notes=/^[Nn]otas$/.test(head),
            combined=/^[Nn]otas e referências$/.test(head),reflist=/^[Rr]eflist$/.test(head);
        if(!alias&&!notes&&!combined&&!reflist)return empty;
        const fields=foreignEntries(p),selected=key=>fields.filter(field=>field.key===key).at(-1),
            field=reflist?(selected('group')||selected('grupo')):selected('grupo'),
            value=field?.value.trim()??(notes?'nota':combined?'Nota':''),
            literal=value===''||v29ReferenceName(value),fixed=combined?['nota','lower-alpha','nt','']:notes?['lower-alpha']:[],
            groups=[...new Set(literal?(combined?['nota','lower-alpha',value,'nt','']:notes?[value,'lower-alpha']:[value]):fixed)];
        // The first Notas list consumes its bank definitions. Native rendering
        // does not define those same names again in its second lower-alpha
        // list. The combined helper defines refs only in its final common
        // list. Explicit empty grupo stays empty.
        const bankGroups=combined?['']:literal?[value]:[];
        return {recognized:true,groups,bankGroups,ambiguous:!literal,explicit:!!field,selectedGroup:literal?value:null,
            kind:combined?'combined':notes?'notes':reflist?'reflist':'references',
            nativeOldid:combined?73218466:notes?59102402:reflist?56151616:alias.oldid};
    }
    function v219ReferenceCollectorScope(source,cfg={}) {
        return typeof source==='string'&&source.length<=4194304&&
            cfg.automaticReferenceCollectorHeadings!==false&&cfg.references!==false&&
            cfg.headings!==false&&cfg.namespaceNumber===0&&!cfg.sectionOnly&&
            !cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&
            v24SyntaxScope(cfg)&&v20AutomationAllowed(source,cfg);
    }
    function v219ReferenceCollectorFragment(value) {
        let decoded=String(value).replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,decimal)=>{
            const point=parseInt(hex||decimal,hex?16:10);
            return point>0&&point<=1114111?String.fromCodePoint(point):'\uFFFD';
        }).replace(/&ecirc;/gi,'ê').replace(/&lowbar;/gi,'_');
        const percent=value=>value.replace(/(?:%[0-9a-f]{2})+/gi,run=>{
            try{return decodeURIComponent(run);}catch(_){return run;}
        });
        // Decode each escape run independently. A stray percent sign in an
        // unrelated URL cannot hide an encoded link to the removed heading.
        for(let pass=0;pass<2;pass++)decoded=percent(decoded.replace(/(?:\.[0-9a-f]{2})+/gi,
            run=>percent(run.replace(/\./g,'%'))));
        return norm(decoded).normalize('NFC');
    }
    function v219ReferenceCollectorTargeted(source) {
        // The old second default heading loses its automatic _2 identifier.
        // Explicit fragment links, HTML IDs and anchor calls must be retained.
        const normal=v219ReferenceCollectorFragment(source);
        return /referências[ _]+2(?:[^\p{L}\p{N}_]|$)/u.test(normal);
    }
    function v219ReferenceCollectorGap(value) {
        return !value.replace(/<!--[\s\S]*?-->/g,'').trim();
    }
    function v219ReferenceCollectorDefault(raw) {
        if(typeof raw!=='string'||/<!--|\{\{\{|[\uE000-\uF8FF]/.test(raw))return false;
        const p=parsedTemplate(raw);
        // Even a harmless-looking explicit title/level requires a different
        // heading proof. The initial rule covers only the native default call.
        return !!v219NativeReferenceCollectorAlias(p.parts[0])&&p.parts.length===1;
    }
    function v219ReferenceCollectorNoHeadingCall(raw) {
        const p=parsedTemplate(raw),head=p.parts[0].replace(/_/g,' ').trim().replace(/^(?:predefinição|template)\s*:\s*/i,'');
        if(CITE_NAMES[p.name])return v215LiteralTemplateIdentity(raw)&&
            !/\{\{[\s\S]*\{\{|(?:^|\r?\n)[ \t]*={1,6}/.test(raw);
        if(/^[Ll]ink$/.test(head)) {
            // Link 72099361 forwards these fields to Citar web. Literal fields
            // cannot emit another section or change reference-list scope.
            const allowed=new Set(['idioma','língua','1','url','2','título','titulo','3','descr','notas','4',
                'wayb','datali','urlmorta','ligação inativa','li','acessodata','acesso_data','acdt']);
            const fields=foreignEntries(p);
            return fields.length>0&&fields.every(field=>allowed.has(field.key)&&
                !/[{}<>\r\n\uE000-\uF8FF]/.test(field.value))&&
                new Set(fields.map(field=>field.key)).size===fields.length;
        }
        if(/^[Dd]iv col(?: fim)?$/.test(head)) {
            return p.name==='div col fim'?p.parts.length===1:
                foreignEntries(p).every(field=>['colunas','largura'].includes(field.key)&&
                    /^(?:[1-4]|\d{1,2}(?:em|px))$/.test(field.value.trim()));
        }
        if(!v219NativeReferenceCollectorAlias(p.parts[0])&&!/^[Nn]otas$/.test(head))return false;
        const fields=foreignEntries(p),level=fields.filter(field=>field.key==='nível');
        return level.length===1&&level[0].value.trim()==='0'&&
            fields.every(field=>['nível','grupo'].includes(field.key)&&
                !/[{}<>\r\n\uE000-\uF8FF]/.test(field.value))&&
            new Set(fields.map(field=>field.key)).size===fields.length;
    }
    function v219ReferenceCollectorHeadings(source,cfg={}) {
        if(!v219ReferenceCollectorScope(source,cfg)||
            !/^==[ \t]*Referências[ \t]*==[ \t]*\r?$/mi.test(source))return null;
        const shield=v24SyntaxProtected(source),scan=v24SyntaxScan(source);
        if(shield.unclosed.length||scan.issues.length||
            /<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view)||
            v219ReferenceCollectorTargeted(shield.view))return null;
        const parsed=templates(shield.view),ranges=structuralRanges(shield.view),headings=[],
            boundaries=new Set(scan.boundaries);
        if(parsed.unclosed.length)return null;
        for(const match of shield.view.matchAll(/^(={2,6})[ \t]*([^=\r\n]+?)[ \t]*\1[ \t]*(?:\r?\n|$)/gm)) {
            if(inRange(match.index,ranges))continue;
            // Use the original full-source scan. Rescanning an already masked
            // prefix can reinterpret quote delimiters in an earlier table.
            if(!boundaries.has(match.index))continue;
            headings.push({start:match.index,end:match.index+match[0].length,
                level:match[1].length,title:norm(match[2]),raw:source.slice(match.index,match.index+match[0].length)});
        }
        return {shield,parsed,ranges,headings,boundaries};
    }
    function v219ReferenceCollectorEdits(source,cfg={}) {
        const read=v219ReferenceCollectorHeadings(source,cfg);if(!read)return [];
        const {shield,parsed,headings}=read,parents=headings.filter(h=>h.level===2&&h.title==='referências');
        if(parents.length!==1)return [];
        const parent=parents[0],next=headings.find(h=>h.start>parent.start&&h.level===2),end=next?.start??source.length,
            children=headings.filter(h=>h.start>=parent.end&&h.start<end);
        if(children.length<1||children.length>2||children.some(h=>h.level!==3||!['notas','bibliografia'].includes(h.title))||
            new Set(children.map(h=>h.title)).size!==children.length||
            !v219ReferenceCollectorGap(source.slice(parent.end,children[0].start)))return [];
        const regionNodes=parsed.nodes.filter(node=>node.depth===0&&node.start>=parent.end&&node.end<=end),
            defaults=regionNodes.filter(node=>v219ReferenceCollectorDefault(source.slice(node.start,node.end)));
        if(defaults.length!==1)return [];
        const collector=defaults[0],lineStart=source.lastIndexOf('\n',collector.start-1)+1,
            lineEnd=source.indexOf('\n',collector.end),afterLine=lineEnd<0?source.length:lineEnd;
        if(collector.start<=children[children.length-1].end||
            !/^[ \t]*$/.test(source.slice(lineStart,collector.start))||
            !/^[ \t\r]*$/.test(source.slice(collector.end,afterLine))||
            !v219ReferenceCollectorGap(source.slice(collector.end,end)))return [];
        // No other default collector or explicit default reference heading can
        // participate in a split list or alter the removed duplicate ID.
        if(parsed.nodes.filter(node=>node.depth===0&&
            v219ReferenceCollectorDefault(source.slice(node.start,node.end))).length!==1||
            headings.some(h=>h!==parent&&h.title==='referências'))return [];
        if(!read.boundaries.has(lineStart))return [];
        let columns=0;
        for(const node of regionNodes) {
            if(node===collector)continue;
            if(!v219ReferenceCollectorNoHeadingCall(source.slice(node.start,node.end)))return [];
            const name=parsedTemplate(source.slice(node.start,node.end)).name;
            if(name==='div col') {
                if(columns||children.some(child=>node.start<child.start&&child.start<collector.start&&
                    !regionNodes.some(later=>later.start>node.start&&later.start<child.start&&
                        parsedTemplate(source.slice(later.start,later.end)).name==='div col fim')))return [];
                columns++;
            } else if(name==='div col fim') {
                if(!columns)return [];columns--;
            }
        }
        if(columns)return [];
        const sourceHash=v24SyntaxHash(source),transaction=sourceHash+':reference-section-tree',
            common={sourceHash,transaction,parentStart:parent.start,parentEnd:parent.end,
                childStarts:children.map(h=>h.start),collectorStart:collector.start,collectorEnd:collector.end,
                nativeTemplateOldid:63785697,nativeDocumentationOldid:69160731,
                nativeLinkOldid:72099361,styleGuideOldid:73204357,
                condition:'one redundant literal H2 parent; no parent prose; one or two unique literal H3 notes or bibliography children; one terminal default native H2 collector; no explicit second-heading target; all collector payloads, groups, bibliography entry sequence and note contents retained',
                retainedReferencePayloads:true,minorSafe:true};
        const gap=source.slice(parent.end,children[0].start),removeEnd=/^[ \t\r\n]*$/.test(gap)?children[0].start:parent.end,
            edits=[{start:parent.start,end:removeEnd,text:'',ruleId:'v219ReferenceSectionTree',
                proof:{...common,changeRules:['v219ReferenceSectionTree'],heading:parent.raw,
                    removedPlainGap:source.slice(parent.end,removeEnd),operation:'remove-redundant-parent'}}];
        const bibliography=children[children.length-1],moved=bibliography.title==='bibliografia'&&
            cfg.endMatter!==false&&cfg.endSectionOrder!==false&&
            !refTokens(source.slice(bibliography.start,lineStart)).length&&
            !parsed.nodes.some(node=>node.start>=bibliography.start&&node.end<=lineStart&&
                STRUCTURAL_NOTE_CALLS.has(parsedTemplate(source.slice(node.start,node.end)).name))&&
            !shield.ranges.some(range=>range.start<lineStart&&range.end>bibliography.start)&&
            !/[<]|__[A-Z][A-Z_]*__/.test(source.slice(bibliography.start,lineStart));
        if(moved){
            const chunk=source.slice(bibliography.start,lineStart),eol=/\r\n|\n/.exec(chunk)?.[0]||'\n',
                promoted=chunk.replace(/^===/,'==').replace(/===(?=[ \t]*(?:\r?\n|$))/,'==').replace(/(?:\r?\n)+$/,'');
            edits.push({start:bibliography.start,end:collector.end,
                text:source.slice(lineStart,collector.end)+eol+eol+promoted,ruleId:'v219ReferenceSectionTree',
                proof:{...common,changeRules:['v219ReferenceSectionTree'],operation:'uncited-bibliography-after-native-collector',
                    bibliographyBefore:chunk,collector:source.slice(lineStart,collector.end),
                    condition:'same complete heading transaction; final bibliography child has no reference marker, note template, protected span, HTML or dynamic control; exact bibliography entries and native collector call retained; only heading level, plain boundary gaps and relative placement change'}});
        }
        for(const child of children) {
            if(moved&&child===bibliography)continue;
            const fixed=child.raw.replace(/^===/,'==').replace(/===(?=[ \t]*(?:\r?\n|$))/,'==');
            if(fixed===child.raw)return [];
            edits.push({start:child.start,end:child.end,text:fixed,ruleId:'v219ReferenceSectionTree',
                proof:{...common,changeRules:['v219ReferenceSectionTree'],heading:child.raw,operation:'promote-direct-child'}});
        }
        return edits;
    }
    function v219ReferenceCollectorPlan(source,cfg={}) {
        const edits=v219ReferenceCollectorEdits(source,cfg);
        return {source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,
            edits,text:typeof source==='string'?v24SyntaxApply(source,edits):source};
    }
    function v219ReferenceCollectorProof(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219ReferenceCollectorPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
