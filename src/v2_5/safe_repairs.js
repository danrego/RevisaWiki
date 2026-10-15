    // 2.5: source-bound corrections for complete, literal references and tags.
    // This helper is inserted inside RevisaWikiBoot, after the 2.4 parsers.
    const V25_SAFE_TABLE_ATTRIBUTES = new Set(['class','style','border','cellpadding','cellspacing','width','align']);
    const V25_SAFE_REFERENCE_ATTRIBUTES = new Set(['name','group']);
    const v25SafePlanCache=[];let v25SafePlanCacheBytes=0;
    function v25SafeCacheOptions(cfg) {
        return JSON.stringify(Object.keys(DEFAULTS).map(key=>[key,cfg[key]===undefined?DEFAULTS[key]:cfg[key]]));
    }
    function v25SafeRemember(plan,options,allowCache=true) {
        const seen=new Set(),measure=value=>{if(typeof value==='string')return value.length*2+32;if(value&&typeof value==='object'){if(seen.has(value))return 0;seen.add(value);return 160+Object.entries(value).reduce((n,[key,item])=>n+key.length*2+measure(item),0);}return 16;};
        const weight=measure(plan)+plan.source.length*2+options.length*2+256;
        const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};freeze(plan);
        if(allowCache&&weight<=16777216){v25SafePlanCache.push({source:plan.source,options,plan,weight});v25SafePlanCacheBytes+=weight;
            while(v25SafePlanCache.length>6||v25SafePlanCacheBytes>16777216)v25SafePlanCacheBytes-=v25SafePlanCache.shift().weight;}
        return plan;
    }
    function v25SafeRepairCacheStatus() {return {entries:v25SafePlanCache.length,bytes:v25SafePlanCacheBytes,maxEntries:6,maxBytes:16777216};}
    function v25SafeAttributeEntries(raw) {
        const entries=[],re=/\s+([a-z][a-z0-9-]*)\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'|([^\s"'=<>`]+))/gi;let m,last=0;
        while((m=re.exec(raw))){if(raw.slice(last,m.index).trim())return null;entries.push({key:m[1].toLowerCase(),value:m[2]??m[3]??m[4],start:m.index,end:re.lastIndex});last=re.lastIndex;}
        return raw.slice(last).trim()?null:entries;
    }
    function v25SafeAttributes(raw,allowed) {
        const entries=v25SafeAttributeEntries(raw);if(!entries||entries.some(e=>!allowed.has(e.key)||/[{}\[\]<>|&\r\n\uE000-\uF8FF]/.test(e.value)))return null;
        const values=new Map(),duplicates=[];
        for(const e of entries){if(values.has(e.key)){if(values.get(e.key)!==e.value)return null;duplicates.push(e);}else values.set(e.key,e.value);}
        return {entries,values,duplicates};
    }
    function v25SafeDuplicateAttributeEdits(source,cfg={}) {
        if(v24SyntaxScan(source).issues.length)return [];
        const protectedRanges=v24SyntaxProtected(source).ranges,edits=[];
        for(let i=0;i<source.length;){const t=v24SyntaxTag(source,i);if(!t){i++;continue;}i=t.end;
            if(t.close||!['ref','table'].includes(t.name)||t.name==='ref'&&cfg.references===false||t.name==='table'&&(cfg.automaticTableRepairs===false||cfg.tableChecks===false)||protectedRanges.some(r=>r.start<t.end&&r.end>t.start))continue;
            const parsed=v25SafeAttributes(t.attrs,t.name==='ref'?V25_SAFE_REFERENCE_ATTRIBUTES:V25_SAFE_TABLE_ATTRIBUTES);if(!parsed?.duplicates.length)continue;
            const at=t.start+t.raw.indexOf(t.attrs);for(const duplicate of parsed.duplicates)edits.push({start:at+duplicate.start,end:at+duplicate.end,text:'',ruleId:'safeDuplicateAttributes',proof:{tag:t.name,key:duplicate.key,value:duplicate.value,openingStart:t.start,condition:'all attributes literal; repeated keys have exactly equal values'}});
        }
        // Wikitext table headers use the same finite attribute grammar.
        if(cfg.automaticTableRepairs===false||cfg.tableChecks===false)return edits;
        const re=/^\{\|([^\r\n]*)(?:\r?$)/gm;let m;
        while((m=re.exec(source))){const start=m.index,end=start+m[0].length;if(protectedRanges.some(r=>r.start<end&&r.end>start))continue;
            const parsed=v25SafeAttributes(m[1],V25_SAFE_TABLE_ATTRIBUTES);if(!parsed?.duplicates.length)continue;
            for(const duplicate of parsed.duplicates)edits.push({start:start+2+duplicate.start,end:start+2+duplicate.end,text:'',ruleId:'safeDuplicateAttributes',proof:{tag:'wikitable',key:duplicate.key,value:duplicate.value,openingStart:start,condition:'literal table opening; repeated keys have exactly equal values'}});
        }
        return edits;
    }
    function v25SafeMixedTemplateEdits(source) {
        const shield=v24SyntaxProtected(source),view=shield.view,edits=[],re=/\{\{([^{}]*?)(\}\]|\]\})(?=[ \t]*(?:<\s*[/\\]\s*(?:ref|references)\s*>|\r?$))/gm;let m;
        while((m=re.exec(view))){const start=m.index,end=re.lastIndex,body=m[1],profile=v24SyntaxTemplateProfile(body);if(!profile||shield.ranges.some(r=>r.start<end&&r.end>start))continue;
            const prefix=v24SyntaxApply(view.slice(0,start),edits),context=v24SyntaxContext(prefix,prefix.length);if(context.templates.length||context.tables.length||context.links.length||context.external.length||context.html.some(t=>!['ref','references'].includes(t.name)))continue;
            const lineStart=view.lastIndexOf('\n',start-1)+1,before=view.slice(lineStart,start),refPrefix=/^\s*(?:<\s*references\b[^>]*>\s*)?<\s*ref\b[^>]*>\s*$/i.test(before);
            const refBodyStart=profile.kind==='citation'&&context.html.at(-1)?.name==='ref'&&!prefix.slice(context.html.at(-1).end).trim()&&context.html.filter(t=>t.name==='ref').length===1;
            if(before.trim()&&!refPrefix&&!refBodyStart)continue;
            const suffix=view.slice(end).match(/^[ \t]*/)[0].length,follow=v24SyntaxTag(view,end+suffix),inline=!!follow&&follow.close&&['ref','references'].includes(follow.name);
            if(inline&&profile.kind!=='citation'||inline&&follow.name==='references'&&!(context.html.at(-1)?.name==='ref'&&context.html.at(-2)?.name==='references'))continue;
            if(body.includes('\n')&&body.trim().split(/\r?\n/).slice(1).some(line=>line.trim()&&!/^\s*\|/.test(line)))continue;
            edits.push({start:end-2,end,text:'}}',ruleId:'safeMixedTemplateClosers',proof:{template:profile.name,profile:profile.kind,condition:'finite literal profile and the same explicit boundaries as the 2.4 repair'}});
        }
        return edits;
    }
    function v25SafeCompleteReferences(source) {
        const scan=v24SyntaxScan(source);if(scan.issues.length)return null;
        const parsed=v24SyntaxReferences(source);if(parsed.unclosed.length||parsed.empties.length||parsed.refs.some(r=>!r.valid||!r.attrs||!v24SyntaxLiteralIdentity(r.attrs)||r.container&&!r.container.valid))return null;
        return parsed;
    }
    function v25SafeAdjacentReferenceEdits(source) {
        const parsed=v25SafeCompleteReferences(source);if(!parsed)return [];
        const definitions=new Map(),blocked=new Set(),key=r=>JSON.stringify([r.group,r.attrs.name]);
        for(const r of parsed.refs){if(!r.attrs.name||r.body===null)continue;const k=key(r);if(!r.body.trim()||!v24SyntaxBodySafe(r.body)){blocked.add(k);continue;}if(!definitions.has(k))definitions.set(k,new Set());definitions.get(k).add(r.body);}
        const edits=[];let previous=null;
        for(const r of parsed.refs){const k=key(r),valid=r.body===null&&r.attrs.name&&definitions.get(k)?.size===1&&!blocked.has(k)&&!r.container;
            if(valid&&previous&&key(previous)===k&&/^[ \t]*$/.test(source.slice(previous.end,r.start))&&previous.renderer.valid&&r.renderer.valid){edits.push({start:r.start,end:r.end,text:'',ruleId:'safeAdjacentReferenceCalls',proof:{name:r.attrs.name,group:r.group,definitionBodies:1,condition:'consecutive calls with equal literal identity and one nonconflicting definition body'}});}
            previous=valid?r:null;
        }
        return edits;
    }
    function v25SafeCitationSignature(body,cfg={}) {
        const c={...DEFAULTS,...cfg},noop=()=>{};let original=body.trim();if(/[<>\uE000-\uF8FF]/.test(original))return null;
        if(c.bareReferences&&original.startsWith('[')&&!original.startsWith('[[')){const refs=refTokens(simpleReferences('<ref>'+original+'</ref>',noop));if(refs.length===1&&refs[0].body!==null)original=refs[0].body;}
        if(!original.startsWith('{{')||!original.endsWith('}}')||/[{}]/.test(original.slice(2,-2)))return null;
        const originalParts=v24SyntaxParts(original.slice(2,-2));if(!originalParts)return null;
        // Use the same conversion as ordinary citation cleanup. Only its
        // resulting complete field set is compared. The first original body
        // remains unchanged until that existing cleanup pass runs.
        let raw=v24InventoryTemplate(original,c);if(c.links){raw=wikiURLs(raw,noop);raw=cleanLinks(raw,noop);}if(!raw.startsWith('{{')||!raw.endsWith('}}')||/[<>\uE000-\uF8FF]/.test(raw))return null;
        const inner=raw.slice(2,-2);if(/[{}]/.test(inner))return null;const parts=v24SyntaxParts(inner);if(!parts||parts.length<3)return null;
        const name=v24SyntaxName(parts[0].text),canonical=CITE_NAMES[name];if(!canonical)return null;
        const entries=[],seen=new Set();for(const part of parts.slice(1)){const at=part.text.indexOf('=');if(at<1)return null;const key=part.text.slice(0,at).trim(),value=part.text.slice(at+1).trim();
            // Resulting parameter names and values remain exact. No further
            // equivalence between publisher/editor or other families is guessed.
            if(!/^[\p{L}\p{N} _-]+$/u.test(key)||!value||seen.has(key)||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))return null;
            seen.add(key);entries.push([key,value]);}
        if(!entries.some(([key])=>['title','titulo','título'].includes(key)))return null;
        return JSON.stringify([v24SyntaxName(canonical),entries.sort((a,b)=>a[0].localeCompare(b[0]))]);
    }
    function v25SafeCitationReferenceEdits(source,cfg={}) {
        const parsed=v25SafeCompleteReferences(source);if(!parsed)return [];
        const uses=referenceNameUses(source);if(uses.some(u=>/[{}\uE000-\uF8FF]/.test(u.value)))return [];
        const names=new Set(uses.map(u=>decodedReferenceName(u.value))),families=new Map(),renderers=rendererRanges(parsed.view),outerTemplates=v24SyntaxTemplates(parsed.view).nodes;
        // A malformed or computed ref helper can reserve names unseen by the
        // literal ref parser. Decline this naming pass in that whole source.
        if(/\{\{\{/.test(parsed.view)||/\{\{\s*#tag\s*:\s*ref\b/i.test(parsed.view))return [];
        for(const r of parsed.refs){if(r.attrs.name||r.body===null||r.container||Object.keys(r.attrs).some(k=>k!=='group')||outerTemplates.some(n=>n.start<r.start&&r.start<n.end))continue;
            const signature=v25SafeCitationSignature(r.body,cfg);if(!signature)continue;const region=renderers.filter(n=>n.end<=r.start).length,k=JSON.stringify([r.group,region,signature]);
            if(!families.has(k))families.set(k,[]);families.get(k).push(r);}
        const edits=[];let counter=1;
        for(const family of families.values()){if(family.length<2)continue;let name;do{name='ref-auto-'+counter++;}while(names.has(name));names.add(name);
            const group=family[0].group?' group="'+family[0].group+'"':'';family.forEach((r,index)=>edits.push({start:r.start,end:r.end,text:'<ref name="'+name+'"'+group+(index?' />':'>'+r.body+'</ref>'),ruleId:'safeEquivalentCitations',proof:{name,group:r.group,signature:v25SafeCitationSignature(r.body,cfg),originalBody:r.body,definitionStart:family[0].start,occurrences:family.length,condition:'complete equal field sets after the existing citation conversion; same literal group and collector region'}}));}
        return edits;
    }
    function v25SafeCollectorEdits(source) {
        const scan=v24SyntaxScan(source);if(scan.issues.length)return [];
        const collectors=[];for(let i=0;i<scan.tokens.length;i++){const t=scan.tokens[i];if(t.name!=='references'||t.close||t.templateDepth||t.linkDepth||t.tableDepth)continue;
            const attrs=v24SyntaxAttrs(t.attrs);if(!attrs||!attrs.group||Object.keys(attrs).some(k=>!['group','responsive'].includes(k))||Object.values(attrs).some(v=>!v.trim()||v!==v.trim()||/[{}<>\[\]|&\r\n]/.test(v)))continue;
            if(t.self)collectors.push({...t,key:JSON.stringify(Object.entries(attrs).sort())});else {const close=scan.tokens[i+1];if(close?.name==='references'&&close.close&&!close.typo&&!close.attrs.trim()&&!source.slice(t.end,close.start).trim()){collectors.push({...t,end:close.end,key:JSON.stringify(Object.entries(attrs).sort())});i++;}}}
        const edits=[];let previous=null;for(const c of collectors){if(previous&&previous.key===c.key&&/^\s*$/.test(source.slice(previous.end,c.start)))edits.push({start:c.start,end:c.end,text:'',ruleId:'safeAdjacentCollectors',proof:{attributes:c.key,condition:'adjacent empty collectors; identical complete literal attribute sets; no intervening content'}});previous=c;}
        return edits;
    }
    function v25SafeRepairPlan(source,cfg={}) {
        if(typeof source!=='string')throw new TypeError('O texto precisa ser uma string.');const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};
        if(!v24SyntaxScope(cfg))return {...plan,disabled:true};
        // Registry proofs have an expiry time. Do not cache a plan that uses
        // them, so a later call must check the existing proof conditions again.
        const allowCache=!Array.isArray(cfg.doiRepairProofs)||cfg.doiRepairProofs.length===0,cacheOptions=v25SafeCacheOptions(cfg),cachedIndex=allowCache?v25SafePlanCache.findIndex(item=>item.source===source&&item.options===cacheOptions):-1;
        if(cachedIndex>=0){const [cached]=v25SafePlanCache.splice(cachedIndex,1);v25SafePlanCache.push(cached);return cached.plan;}
        const stage=(name,find)=>{const edits=find(plan.text);if(!edits.length)return;const before=plan.text,after=v24SyntaxApply(before,edits);if(before===after)return;plan.steps.push({name,before,after,edits});plan.edits.push(...edits);plan.text=after;};
        stage('mixed-template-closers',s=>{const edits=v25SafeMixedTemplateEdits(s);if(!edits.length)return edits;
            const candidate=v24SyntaxApply(s,edits),legacy=syntaxRepairPlan(candidate,cfg);if(!legacy.unresolved.length)return edits;
            // Both mixed replacements keep their two-character width. The
            // legacy plan's safe-prefix offset therefore still belongs to s.
            // Never repair a token inside an enclosing unresolved tail.
            if(cfg.partialSyntaxRecovery===false)return [];
            return edits.filter(e=>e.start<legacy.safePrefixEnd&&e.end<=legacy.safePrefixEnd);});
        stage('duplicate-literal-attributes',s=>v25SafeDuplicateAttributeEdits(s,cfg));
        if(cfg.references!==false){stage('equivalent-complete-citations',cfg.automaticIdenticalReferences===false?()=>[]:s=>v25SafeCitationReferenceEdits(s,cfg));stage('consecutive-named-reference-calls',v25SafeAdjacentReferenceEdits);stage('adjacent-empty-collectors',v25SafeCollectorEdits);}
        return v25SafeRemember(plan,cacheOptions,allowCache);
    }
    function automaticSafeRepairs(source,cfg={},bump=()=>{}) {
        const plan=v25SafeRepairPlan(source,cfg);for(const step of plan.steps)for(const edit of step.edits)bump(edit.ruleId);return plan.text;
    }
    function v25SafeRepairEquivalence(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const fresh=v25SafeRepairPlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
    }
