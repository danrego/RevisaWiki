    function v213ReferenceScope(cfg={}) {
        return v212ReferenceFieldScope(cfg)&&cfg.syntaxRepairs!==false&&cfg.structuralRepairs!==false;
    }
    function v213LiteralURL(value) {
        if(typeof value!=='string'||value.length>8192||!/^https?:\/\/[^\s\[\]{}<>|"'`\\]+$/.test(value)||/[\u0000-\u0020\u007f-\u009f]/.test(value))return null;
        const authority=/^https?:\/\/([^/?#]+)/.exec(value)?.[1];if(!authority||/@|%40/i.test(authority))return null;
        try{const parsed=new URL(value);if(!['http:','https:'].includes(parsed.protocol)||!parsed.hostname||parsed.username||parsed.password)return null;}catch(_){return null;}
        return value;
    }
    function v213ISBN(value) {
        if(typeof value!=='string'||!value||value!==value.trim()||!/^[0-9Xx -]+$/.test(value))return false;
        const id=value.replace(/[ -]/g,'').toUpperCase();
        if(/^\d{9}[\dX]$/.test(id))return [...id].reduce((n,c,i)=>n+(c==='X'?10:+c)*(10-i),0)%11===0;
        return /^97[89]\d{10}$/.test(id)&&[...id].reduce((n,c,i)=>n+(+c)*(i%2?3:1),0)%10===0;
    }
    function v213DOI(value) {
        return typeof value==='string'&&/^10\.\d{4,9}\/[A-Za-z0-9][A-Za-z0-9._;()/:-]*$/.test(value)&&!/[.;,:-]$/.test(value);
    }
    function v213OfficialIdentifier(key,url) {
        if(!v213LiteralURL(url)||/[?#%]/.test(url))return null;
        if(key==='pmid'){const m=/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/([1-9]\d{0,8})\/?$/.exec(url);return m?m[1]:null;}
        if(key==='pmc'||key==='arxiv')return v29IdentifierValue(key,url);
        if(key==='doi'){const m=/^https:\/\/(?:dx\.)?doi\.org\/(10\.[^\s]+)$/.exec(url);return m&&v213DOI(m[1])?m[1]:null;}
        return null;
    }
    function v213NativeCitationFields(raw) {
        if(typeof raw!=='string'||!/^\{\{\s*[^{}|\r\n]{1,160}\|/.test(raw)||!raw.endsWith('}}')||/<!--|[<>\uE000-\uF8FF]|\{\{\{/.test(raw))return null;
        const p=parsedTemplate(raw),head=p.parts[0].trim().replace(/_/g,' ').replace(/^(?:predefinição|template)\s*:\s*/i,''),native=/^[Cc]itar (?:web|jornal|revista|livro|periódico)$/.test(head),english=/^[Cc]ite (?:web|news|journal|book|magazine)$/.test(head),profile=native||english?null:translationProfile(raw),target=native||english?CITE_NAMES[p.name]:profile?.kind==='citation'?profile.target:null;
        if(!target||!['citar web','citar jornal','citar periódico','citar revista','citar livro'].includes(norm(target)))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
        const canonical={name:norm(target),parts:[target]},fields=[];
        for(const part of parts.slice(1)){
            const m=/^(\s*)([^={}\[\]<>\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);if(!m)return null;
            const key=m[2].trim();if(!/^[\p{L}\d _/-]+$/u.test(key)&&!(profile&&Object.hasOwn(profile.fields,norm(key))))return null;
            let nativeKey=key;
            if(profile){nativeKey=profile.fields[norm(key)];const numbered=/^(.*?)(\d+)$/.exec(norm(key));if(!nativeKey&&numbered&&profile.numbered?.[numbered[1]])nativeKey=profile.numbered[numbered[1]]+numbered[2];if(!nativeKey&&/^(?:doi|isbn\d*|issn\d*|pmid|pmc|oclc|jstor|bibcode|arxiv|zbl|lccn|hdl|s2cid|volume|url|ref)$/.test(norm(key)))nativeKey=norm(key);if(!nativeKey&&nativeCitationAccepts(canonical,key))nativeKey=citationParam(key,canonical.name);}
            const value=m[4],emptyCleanup=!value.trim()&&!/^(pontofinal|ref|separator|separador)$/.test(norm(key));
            if((!nativeKey||!nativeCitationAccepts(canonical,nativeKey))&&!emptyCleanup)return null;
            if(/[{}]/.test(value)&&!/^\s*\{\{ISBN\|[0-9Xx -]+\}\}\s*$/.test(value))return null;
            fields.push({key,nativeKey,value,emptyCleanup,parameterStart:1+part.start,start:2+part.start+m[1].length+m[2].length+m[3].length,end:2+part.end});
        }
        return {p:canonical,fields,profile,target,english};
    }
    function v213FieldRole(p,key) {
        for(const [role,aliases]of Object.entries(V212_URL_ROLES))if(aliases.includes(key)&&!(role==='ChapterURL'&&norm(CITE_NAMES[p.name]||p.name)!=='citar livro'))return 'url:'+role;
        const id=({doi:'doi',DOI:'doi',pmid:'pmid',PMID:'pmid',pmc:'pmc',PMC:'pmc',pmcid:'pmc',arxiv:'arxiv',ARXIV:'arxiv',eprint:'arxiv',isbn:'isbn',ISBN:'isbn',ISBN13:'isbn'})[key];if(id)return 'id:'+id;
        for(const role of ['AccessDate','ArchiveDate','Year'])if(V212_CITATION_ALIASES[role]?.includes(key))return 'date:'+role;
        return ['data','date','fecha','data-publicacao','data-publicação','publication-date'].includes(key)?'date:Date':null;
    }
    function v213TypedValue(role,value) {
        if(role.startsWith('url:')){
            const quoted=/^(["'])(https?:\/\/[\s\S]+)\1$/.exec(value),literal=quoted?quoted[2]:value;
            return v213LiteralURL(literal)!==null&&(!/^https?:\/\/https?:\/\//.test(literal)||v213ProtocolValue(literal)!==null);
        }
        if(role==='id:doi')return v213DOI(value);
        if(role==='id:isbn')return v213ISBN(value);
        if(['id:pmid','id:pmc'].includes(role))return /^[1-9]\d{0,8}$/.test(value);
        if(role==='id:arxiv')return v29IdentifierValue('arxiv','https://arxiv.org/abs/'+value)===value;
        if(role==='date:Year')return /^[1-9]\d{3}$/.test(value);
        const m=/^([1-9]\d{3})-(\d{2})-(\d{2})$/.exec(value);return !!m&&validDate(+m[3],+m[2],+m[1]);
    }
    function v213ProtocolValue(value) {
        const match=/^((?:https?:\/\/){2,4})([^\s]+)$/.exec(value);if(!match)return null;
        const protocols=match[1].match(/https?:\/\//g);if(new Set(protocols).size!==1)return null;
        const next=protocols[0]+match[2];return v213LiteralURL(next)&&!/^https?:\/\/https?:\/\//.test(next)?next:null;
    }
    function v213ReferenceFieldTrigger(source) {
        return typeof source==='string'&&/[|][ \t\r\n]*\p{L}[\p{L}\d _/-]{0,60}[ \t]*=[ \t\r\n]*(?:["']https?:\/\/|\[https?:\/\/|=\S|\{\{ISBN\||https?:\/\/https?:\/\/)/u.test(source);
    }
    function v213LegacyCitationRule(event,raw) {
        if(event.kind==='template-name')return 'citationNames';
        const parsed=v213NativeCitationFields(raw),anchors=event.sourceAnchors||[],fields=parsed?.fields.filter(field=>anchors.length&&anchors.every(anchor=>anchor.start>=(event.kind==='parameter-field'?field.parameterStart:field.start)&&anchor.end<=field.end))||[];
        if(event.kind==='parameter-field')return fields.length===1&&fields[0].emptyCleanup?'citationCleanup':'duplicateParameters';
        if(event.kind!=='parameter-value'||fields.length!==1)return 'citationParameters';
        const role=v213FieldRole(parsed.p,fields[0].nativeKey),key=norm(citationParam(fields[0].nativeKey,parsed.p.name));
        return role?.startsWith('date:')?'dates':role?.startsWith('id:')||['página','páginas'].includes(key)?'identifiers':'citationParameters';
    }
    function v213ReferenceCall(raw,cfg={}) {
        const result={text:raw,changes:[]};if(!v213ReferenceScope(cfg)||cfg.citations===false||cfg.citationRepairs===false||!v213ReferenceFieldTrigger(raw))return result;
        const parsed=v213NativeCitationFields(raw);if(!parsed)return result;
        const {p,fields}=parsed,edits=[],emptyFields=fields.filter(field=>field.emptyCleanup),activeFields=fields.filter(field=>!field.emptyCleanup);if(parsed.profile&&!translationEnabled(parsed.profile,cfg))return result;
        for(const field of emptyFields){
            const probe='{{'+parsed.target+'|'+field.key+'=}}',groups=[];
            if(extendedCitation(probe,cfg,group=>groups.push(group),()=>{})!=='{{'+parsed.target+'}}'||groups.length!==1||groups[0]!=='citationCleanup')return result;
        }
        for(const field of activeFields){
            const role=v213FieldRole(p,field.nativeKey),family=activeFields.filter(e=>v213FieldRole(p,e.nativeKey)===role);if(!role||family[0]!==field||family.some(e=>e.value.trim()!==field.value.trim()))continue;
            const literal=field.value.trim(),lead=field.value.length-field.value.trimStart().length,rules=[];let value=literal;
            if(value.startsWith('=')&&!value.startsWith('==')&&v213TypedValue(role,value.slice(1))){value=value.slice(1);rules.push('v213TypedEquals');}
            if(role.startsWith('url:')){
                const quoted=/^(["'])(https?:\/\/[\s\S]+)\1$/.exec(value);if(quoted&&v213LiteralURL(quoted[2])){value=quoted[2];rules.push('v213URLQuotes');}
                const protocol=v213ProtocolValue(value);if(protocol!==null){value=protocol;rules.push('v213ProtocolChains');}
            }
            if(role.startsWith('id:')){
                const wrapped=/^\[(https?:\/\/[^\s\[\]]+)\]$/.exec(value),id=wrapped&&v213OfficialIdentifier(role.slice(3),wrapped[1]);
                if(id){value=id;rules.push('v213IdentifierLinks');}
                if(role==='id:isbn'){const isbn=/^\{\{ISBN\|([0-9Xx -]+)\}\}$/.exec(value);if(isbn&&v213ISBN(isbn[1])){value=isbn[1];rules.push('v213NestedISBN');}}
            }
            if(value!==literal){
                edits.push({start:field.start+lead,end:field.start+lead+literal.length,text:value,ruleId:rules[0],changeRules:rules,role,before:literal,after:value});
                for(const duplicate of family.slice(1))edits.push({start:duplicate.parameterStart,end:duplicate.end,text:'',ruleId:'duplicateParameters',changeRules:['duplicateParameters'],role,before:raw.slice(duplicate.parameterStart,duplicate.end),after:''});
            }
        }
        if(!edits.length)return result;
        for(const field of emptyFields){
            edits.push({start:field.parameterStart,end:field.end,text:'',ruleId:'citationCleanup',changeRules:['citationCleanup'],role:'verified-empty-cleanup',before:raw.slice(field.parameterStart,field.end),after:''});
        }
        edits.sort((a,b)=>a.start-b.start);
        result.text=v24SyntaxApply(raw,edits);result.changes=edits;
        if(parsed.profile||parsed.english){
            const migration=parsed.english?{text:citation(result.text,cfg,()=>{},()=>{}),profile:{kind:'citation',target:parsed.target}}:migrateForeignTemplate(result.text,cfg);if(!migration||migration.blocked||migration.profile.kind!=='citation'||norm(migration.profile.target)!==p.name)return {text:raw,changes:[]};
            const legacy=v211RetainedAdjustments(result.text,migration.text);if(!legacy.exact)return {text:raw,changes:[]};
            const rules=[...edits.flatMap(edit=>edit.changeRules),...legacy.events.map(event=>v213LegacyCitationRule(event,result.text))];
            result.text=migration.text;result.changes=[{start:0,end:raw.length,text:migration.text,ruleId:edits[0].ruleId,changeRules:rules,role:'verified-migration',before:raw,after:migration.text}];
        }
        return result;
    }
    function v213ReferenceFieldEdits(source,cfg={}) {
        if(!v213ReferenceScope(cfg)||typeof source!=='string'||source.length>4194304||!v213ReferenceFieldTrigger(source))return [];
        const shield=v29ReferenceShield(source),nodes=templates(shield.view);if(shield.unclosed.length||nodes.unclosed.length||v24SyntaxScan(source).issues.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return [];
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const node of nodes.nodes){
            if(nodes.nodes.some(parent=>parent!==node&&parent.start<node.start&&parent.end>=node.end))continue;
            const raw=source.slice(node.start,node.end),plan=v213ReferenceCall(raw,cfg);
            if(shield.ranges.some(range=>range.start<node.end&&range.end>node.start&&!(range.kind==='quotation'&&plan.changes.some(change=>node.start+change.start<=range.start&&range.end<=node.start+change.end))))continue;
            for(const change of plan.changes)edits.push({start:node.start+change.start,end:node.start+change.end,text:change.text,ruleId:change.ruleId,proof:{sourceHash,before:raw,after:plan.text,changeRules:change.changeRules,role:change.role,condition:'complete native citation; unique accepted literal field; exact finite delimiter or identifier correction'}});
        }
        return edits;
    }
    function v213ReferenceFieldPlan(source,cfg={}) {const edits=v213ReferenceFieldEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};}
    function v213ReferenceFieldProof(before,after,plan,cfg={}) {if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;const fresh=v213ReferenceFieldPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);}
    function v213ReferenceCountCall(raw,cfg={}) {
        const prior=v212CitationAliasCall(raw,cfg),next=v213ReferenceCall(prior.text,cfg);
        if(!next.changes.length)return {text:raw,changes:[]};
        return {text:next.text,changes:[...prior.changes.map(change=>({ruleId:change.ruleId,kind:change.ruleId==='v212CitationAliases'?'parameter-field':'parameter-value'})),...next.changes.flatMap(change=>change.changeRules.map(ruleId=>({ruleId,kind:'parameter-value'})))]};
    }

    function v213ReferenceContext(source,cfg={}) {
        if(!v213ReferenceScope(cfg)||typeof source!=='string'||source.length>4194304||!/<ref\b/i.test(source))return null;
        const shield=v29ReferenceShield(source),nodes=templates(shield.view);if(shield.unclosed.length||nodes.unclosed.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return null;
        const blocked=(start,end)=>v29ReferenceOverlap(start,end,shield.ranges)||nodes.nodes.some(node=>node.start<start&&node.end>=end);
        return {shield,nodes,blocked};
    }
    function v213ExistingCitationMigration(raw,cfg={}) {
        const parsed=v213NativeCitationFields(raw);if(!parsed)return null;
        if(parsed.english)return {text:citation(raw,cfg,()=>{},()=>{}),profile:{kind:'citation',target:parsed.target}};
        if(!parsed.profile)return {text:raw,profile:{kind:'citation',target:parsed.target}};
        if(!translationEnabled(parsed.profile,cfg))return null;
        const migration=migrateForeignTemplate(raw,cfg);return migration&&!migration.blocked&&migration.profile.kind==='citation'&&norm(migration.profile.target)===parsed.p.name?migration:null;
    }
    function v213ReferenceBodyPlan(body,cfg={}) {
        if(v29ReferenceBody(body))return {accepted:true,changes:[]};
        if(typeof body!=='string')return {accepted:false,changes:[]};
        const raw=body.trim(),leading=body.length-body.trimStart().length,call=v213ReferenceCall(raw,cfg);
        const migration=call.changes.length?{text:call.text}:v213ExistingCitationMigration(raw,cfg);
        if(!migration||!v29ReferenceBody(migration.text))return {accepted:false,changes:[]};
        const changes=call.changes.map(change=>({...change,start:change.start+leading,end:change.end+leading})),shield=v29ReferenceShield(body);
        if(shield.unclosed.length||shield.ranges.some(range=>range.kind!=='quotation'||!changes.some(change=>change.start<=range.start&&range.end<=change.end)))return {accepted:false,changes:[]};
        return {accepted:true,changes};
    }
    function v213ReferenceGraphProjection(source,cfg={}) {
        const shield=v29ReferenceShield(source),nodes=templates(shield.view),edits=[];
        for(const node of nodes.nodes){
            if(nodes.nodes.some(parent=>parent!==node&&parent.start<node.start&&parent.end>=node.end)||v29ReferenceOverlap(node.start,node.end,shield.ranges))continue;
            const raw=source.slice(node.start,node.end),migration=v213ExistingCitationMigration(raw,cfg);if(migration&&migration.text!==raw)edits.push({start:node.start,end:node.end,text:migration.text});
        }
        return v24SyntaxApply(source,edits);
    }
    function v213ReferenceBodyBlocked(context,start,end,bodyStart,bodyPlan) {
        if(context.nodes.nodes.some(node=>node.start<start&&node.end>=end))return true;
        return context.shield.ranges.some(range=>range.start<end&&range.end>start&&!(range.kind==='quotation'&&bodyPlan.changes.some(change=>bodyStart+change.start<=range.start&&range.end<=bodyStart+change.end)));
    }
    function v213ReferenceCloserEdits(source,cfg={}) {
        if(typeof source!=='string'||!/<\/ref\s*\/>/i.test(source))return [];
        const context=v213ReferenceContext(source,cfg);if(!context)return [];
        const tags=[];for(let at=0;at<context.shield.view.length;){const t=v24SyntaxTag(context.shield.view,at);if(t){tags.push(t);at=t.end;}else at++;}
        const stack=[],edits=[],sourceHash=v24SyntaxHash(source);let unsafe=false;
        for(const tag of tags.filter(t=>t.name==='ref')){
            if(!tag.close){if(!tag.self){if(stack.length)unsafe=true;stack.push(tag);}continue;}
            const open=stack.pop();if(!open){unsafe=true;continue;}
            const body=source.slice(open.end,tag.start),bodyPlan=v213ReferenceBodyPlan(body,cfg);
            if(tag.self&&/^<\/ref\s*\/>$/i.test(tag.raw)&&!tag.attrs.trim()&&!tag.typo&&!open.typo&&bodyPlan.accepted&&!v213ReferenceBodyBlocked(context,open.start,tag.end,open.end,bodyPlan)&&v24SyntaxLiteralIdentity(v24SyntaxAttrs(open.attrs))){const start=tag.start+tag.raw.lastIndexOf('/');edits.push({start,end:start+1,text:'',ruleId:'v213RefCloserSlash',proof:{sourceHash,openingStart:open.start,closingStart:tag.start,body,condition:'one complete nonnested native reference; literal attributes and body; only stray closing slash removed'}});}
            else if(tag.self||tag.typo||tag.attrs.trim())unsafe=true;
        }
        if(unsafe||stack.length>1||!edits.length)return [];
        const after=v24SyntaxApply(source,edits),issues=v24SyntaxScan(after).issues;
        if(issues.length&&!v213DanglingReferenceEdits(after,cfg).length)return [];
        return edits;
    }
    function v213DanglingReferenceEdits(source,cfg={}) {
        if(typeof source!=='string'||!/(?:\{\{[Rr]eferências(?:\|[^{}<>]*)?\}\}|<references\b[^<>]*\/\s*>)[ \t\r\n]*$/.test(source))return [];
        const openings=source.match(/<ref\b(?![^<>]*\/\s*>)[^<>]*>/gi)||[],closings=source.match(/<\/ref\s*>/gi)||[];
        if(openings.length!==closings.length+1)return [];
        const context=v213ReferenceContext(source,cfg);if(!context)return [];
        const scan=v24SyntaxScan(source),parsed=v24SyntaxReferences(source);if(parsed.unclosed.length!==1||parsed.empties.length||!scan.issues.length||scan.issues.some(e=>e.code!=='syntax-unclosed-tag'))return [];
        const ref=parsed.unclosed[0],tag=v24SyntaxTag(source,ref.start),attrs=tag&&v24SyntaxAttrs(tag.attrs);if(!tag||tag.name!=='ref'||tag.close||tag.self||tag.typo||!v24SyntaxLiteralIdentity(attrs)||context.blocked(tag.start,tag.end))return [];
        const renderers=rendererRanges(context.shield.view);if(renderers.length!==1)return [];
        const renderer=v210ReferenceRenderer(source,renderers[0]);if(!renderer||renderer.group!==(attrs.group||'')||renderer.start<=tag.end||source.slice(renderer.end).trim())return [];
        const collector=source.slice(renderer.start,renderer.end);if(renderer.kind==='template'&&foreignEntries(parsedTemplate(collector)).some(e=>e.key==='refs')||renderer.kind==='tag'&&!/^<references\b[^<>]*\/\s*>$/i.test(collector))return [];
        const raw=source.slice(tag.end,renderer.start),body=raw.trim(),bodyPlan=v213ReferenceBodyPlan(raw,cfg);if(!body||!v213NativeCitationFields(body)||!bodyPlan.accepted)return [];
        const at=tag.end+raw.indexOf(body)+body.length;if(v213ReferenceBodyBlocked(context,tag.start,at,tag.end,bodyPlan))return [];
        const edit={start:at,end:at,text:'</ref>',ruleId:'v213DanglingRef',proof:{sourceHash:v24SyntaxHash(source),openingStart:tag.start,body,group:attrs.group||'',collectorStart:renderer.start,condition:'sole unclosed native reference; body is one complete known native citation only; immediately followed by sole final matching collector'}};
        const next=v24SyntaxApply(source,[edit]);if(v24SyntaxScan(next).issues.length)return [];
        return [edit];
    }
    function v213NativeRefAttributeEdits(source,cfg={}) {
        if(typeof source!=='string'||!/<ref\b[^<>]{0,2048}\b(?:nome|grupo)\s*=/i.test(source))return [];
        const context=v213ReferenceContext(source,cfg);if(!context||v24SyntaxScan(source).issues.length)return [];
        const refs=refTokens(source),renderers=rendererRanges(context.shield.view),edits=[],sourceHash=v24SyntaxHash(source);
        for(const ref of refs){
            const tag=v24SyntaxTag(source,ref.start),attrs=tag&&v24SyntaxAttrs(tag.attrs);if(!tag||tag.close||tag.self||ref.body===null||!v213ReferenceBodyPlan(ref.body,cfg).accepted||context.blocked(ref.start,ref.end)||!attrs||Object.keys(attrs).some(k=>!['name','group','nome','grupo'].includes(k)))continue;
            const foreign=Object.keys(attrs).filter(k=>['nome','grupo'].includes(k));if(foreign.length!==1||foreign[0]==='nome'&&Object.hasOwn(attrs,'name')||foreign[0]==='grupo'&&Object.hasOwn(attrs,'group'))continue;
            const key=foreign[0],target=key==='nome'?'name':'group',name=attrs.name||attrs.nome,group=attrs.group||attrs.grupo||'';
            if(!v29ReferenceName(name)||!v29ReferenceName(group||'main')||Object.values(attrs).some(v=>!v29ReferenceName(v)))continue;
            const hit=new RegExp('\\s('+key+')(?=\\s*=)','i').exec(tag.raw);if(!hit)continue;
            const start=tag.start+hit.index+hit[0].indexOf(hit[1]),edit={start,end:start+key.length,text:target,ruleId:'v213NativeRefAttributes',proof:{sourceHash,openingStart:tag.start,sourceKey:key,targetKey:target,name,group,body:ref.body,condition:'one literal foreign attribute; complete known source body; unique target definition and unresolved matching native call with native collector'}};
            const candidate=v24SyntaxApply(source,[edit]),projection=v213ReferenceGraphProjection(candidate,cfg),graph=v210ReferenceGraph(projection,cfg);if(!graph)continue;
            const family=graph.families.get(graph.key(group,name));if(!family||family.definitions.length!==1||v24InventoryBody(family.definitions[0].body,cfg)!==v24InventoryBody(ref.body,cfg)||!family.uses.some(item=>item.body===null))continue;
            if(!renderers.some(range=>{const renderer=v210ReferenceRenderer(source,range);return renderer?.group===group&&range.start>ref.end;}))continue;
            const calls=refs.filter(item=>{const a=attrsOf(item.attrs);return a&&Object.keys(a).every(k=>['name','group'].includes(k))&&a.name===name&&(a.group||'')===group;});
            if(calls.some(item=>item.body!==null)||!calls.some(item=>item.body===null))continue;
            edits.push(edit);
        }
        // Independent graph changes are regenerated one at a time. Two foreign
        // definitions for one identity must never authorize each other.
        if(edits.length!==1)return [];
        return edits;
    }
    function v213ReferenceSyntaxPlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[]};
        for(const [name,find]of [['closer',v213ReferenceCloserEdits],['dangling',v213DanglingReferenceEdits],['attributes',v213NativeRefAttributeEdits]]){const edits=find(plan.text,cfg);if(edits.length){const before=plan.text;plan.text=v24SyntaxApply(before,edits);plan.steps.push({name,before,after:plan.text,edits});}}
        return plan;
    }
    function v213ReferenceSyntaxProof(before,after,plan,cfg={}) {if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;const fresh=v213ReferenceSyntaxPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);}
    function v213ReferenceAttributeCountEdits(source) {
        if(typeof source!=='string'||!/<ref\b[^<>]{0,2048}\b(?:nome|grupo)\s*=/i.test(source))return [];
        const cfg={...DEFAULTS,namespaceNumber:0},direct=v213NativeRefAttributeEdits(source,cfg);if(direct.length)return direct;
        const joint=v25SafeRepairPlan(source,cfg),steps=joint.steps.filter(step=>step.name==='v213-native-ref-attributes'),edits=[];
        for(const step of steps)for(const repair of step.edits){
            const proof=repair.proof,bodyKey=v24InventoryBody(proof.body,cfg),candidates=refTokens(source).filter(ref=>{const attrs=attrsOf(ref.attrs);return attrs&&ref.body!==null&&v24InventoryBody(ref.body,cfg)===bodyKey&&(attrs.name||attrs.nome)===proof.name&&(attrs.group||attrs.grupo||'')===proof.group&&Object.hasOwn(attrs,proof.sourceKey)&&!Object.hasOwn(attrs,proof.targetKey);});
            if(candidates.length!==1)continue;const ref=candidates[0],tag=v24SyntaxTag(source,ref.start),hit=new RegExp('\\s('+proof.sourceKey+')(?=\\s*=)','i').exec(tag.raw);if(!hit)continue;
            const start=tag.start+hit.index+hit[0].indexOf(hit[1]);edits.push({start,end:start+proof.sourceKey.length,text:proof.targetKey,ruleId:repair.ruleId,proof:{...proof,sourceHash:v24SyntaxHash(source),openingStart:ref.start,jointSourceHash:joint.sourceHash}});
        }
        return edits;
    }
