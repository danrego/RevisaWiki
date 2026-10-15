    // Each removal is regenerated from the exact complete source. Ambiguous
    // parameters, renderer boundaries and protected examples remain untouched.
    Object.assign(GROUP_LABELS,{
        v27EmptyInfoboxParameters:'Campos vazios repetidos da infocaixa',
        v27DuplicateDefaultsort:'Chaves de ordenação idênticas repetidas',
        v27DuplicatePortalSlots:'Entradas idênticas repetidas em Portal3',
        v27NamedReferences:'Referências nomeadas com conteúdo idêntico'
    });
    function v27SafeMarkdownRanges(source) {
        const ranges=[];let fence=null;
        for(const match of source.matchAll(/^[ \t]{0,3}(`{3,}|~{3,})([^\r\n]*)(?:\r?\n|$)/gm)){
            if(!fence)fence={start:match.index,char:match[1][0],length:match[1].length};
            else if(match[1][0]===fence.char&&match[1].length>=fence.length&&!match[2].trim()){ranges.push({start:fence.start,end:match.index+match[0].length});fence=null;}
        }
        if(fence)ranges.push({start:fence.start,end:source.length});return ranges;
    }
    const v27SafeContextCache=new Map();
    function v27SafeContext(source,cfg={}) {
        if(!v24SyntaxScope(cfg))return null;
        if(v27SafeContextCache.has(source))return v27SafeContextCache.get(source);
        let context=null;
        if(!v24SyntaxScan(source).issues.length){const shield=v24SyntaxProtected(source);
            if(!shield.unclosed.length){shield.ranges=shield.ranges.concat(v27SafeMarkdownRanges(source));context={shield,view:shield.view,nodes:topNodes(shield.view),renderers:rendererRanges(shield.view)};}}
        v27SafeContextCache.set(source,context);
        if(v27SafeContextCache.size>4)v27SafeContextCache.delete(v27SafeContextCache.keys().next().value);
        return context;
    }
    function v27SafeLiteral(value,empty=false) {
        return typeof value==='string'&&(empty||!!value.trim())&&!/[{}\[\]<>|&\uE000-\uF8FF\r\n]/.test(value);
    }
    function v27SafeOverlap(start,end,ranges) {return ranges.some(r=>r.start<end&&r.end>start);}
    function v27SafeInfoboxEdits(source,cfg,context) {
        if(cfg.infoboxes===false||cfg.automaticParameterDuplicates===false)return [];
        const edits=[];
        for(const node of context.nodes){
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw);
            if(!Object.prototype.hasOwnProperty.call(INFOBOX_CATALOG,p.name)||v27SafeOverlap(node.start,node.end,context.shield.ranges))continue;
            const parts=v24SyntaxParts(raw.slice(2,-2)),fields=[];if(!parts)continue;let ambiguous=false;
            for(const part of parts.slice(1)){
                const m=/^([ \t\r\n]*)([^=]+?)\s*=([\s\S]*)$/.exec(part.text);
                if(!m||!/^\p{L}[\p{L}\p{N} _/-]*$/u.test(m[2].trim())){ambiguous=true;break;}
                fields.push({key:m[2].trim(),value:m[3],start:node.start+2+part.start-1,end:node.start+2+part.end});
            }
            if(ambiguous)continue;
            const byKey=new Map();for(const field of fields){if(!byKey.has(field.key))byKey.set(field.key,[]);byKey.get(field.key).push(field);}
            for(const [key,group] of byKey){
                if(group.length<2)continue;const last=group[group.length-1];
                if(!v27SafeLiteral(last.value.trim())||group.some(f=>f.value.trim()&&(!v27SafeLiteral(f.value.trim())||f.value.trim()!==last.value.trim())))continue;
                for(const f of group.slice(0,-1)){if(!/^\s*$/.test(f.value))continue;
                    edits.push({start:f.start,end:f.end,text:'',ruleId:'v27EmptyInfoboxParameters',proof:{template:p.name,key,finalStart:last.start,finalValue:last.value,removed:source.slice(f.start,f.end)}});
                }
            }
        }
        return edits;
    }
    function v27SafeDefaultsortEdits(source,cfg,context) {
        if(cfg.categories===false||cfg.endMatter===false)return [];
        const sorts=context.nodes.filter(n=>/^\{\{\s*DEFAULTSORT\s*:/i.test(source.slice(n.start,n.end)));
        if(sorts.length<2)return [];
        const footer=footerTokens(source,cfg.footerProfiles||{});
        if(!footer.tokens.length||footer.tokens.some(t=>!t.role)||sorts.some(n=>!footer.tokens.some(t=>t.start===n.start&&t.end===n.end)))return [];
        const raw=source.slice(sorts[0].start,sorts[0].end),match=/^\{\{\s*DEFAULTSORT\s*:([^{}|\r\n]+)\}\}$/i.exec(raw);
        if(!match||!v27SafeLiteral(match[1])||sorts.some(n=>source.slice(n.start,n.end)!==raw||v27SafeOverlap(n.start,n.end,context.shield.ranges)))return [];
        const last=sorts[sorts.length-1];return sorts.slice(0,-1).map(n=>{
            const line=source.lastIndexOf('\n',n.start-1)+1,nl=source.indexOf('\n',n.end),end=nl<0?source.length:nl+1;
            return {start:line,end,text:'',ruleId:'v27DuplicateDefaultsort',proof:{raw,finalStart:last.start,key:match[1]}};
        });
    }
    function v27SafePortalEdits(source,cfg,context) {
        if(cfg.portals===false)return [];
        const edits=[];
        for(const node of context.nodes){const raw=source.slice(node.start,node.end),p=parsedTemplate(raw);
            const migrated=p.name==='portal';
            if(!['portal3','portal'].includes(p.name)||p.parts.length<3||p.parts.length>11||v27SafeOverlap(node.start,node.end,context.shield.ranges))continue;
            const originalSlots=p.parts.slice(1),slots=migrated?originalSlots.map(s=>s.trim()):originalSlots;
            if(slots.some(s=>!v27SafeLiteral(s)||s.includes('=')))continue;
            const seen=new Set(),kept=slots.filter(s=>{if(seen.has(s))return false;seen.add(s);return true;});
            if(kept.length===slots.length)continue;
            edits.push({start:node.start,end:node.end,text:'{{'+(migrated?'Portal3':p.parts[0])+'|'+kept.join('|')+'}}',ruleId:'v27DuplicatePortalSlots',proof:{slots,originalSlots,kept,raw,migrated}});
        }
        return edits;
    }
    function v27SafeReferenceName(value) {return v27SafeLiteral(value)&&value===value.trim()&&!/["'=]/.test(value)&&!numericReferenceName(value);}
    function v27SafeReferenceBody(body,cfg={}) {
        // This is the existing citation equivalence normalizer, applied only
        // inside complete bodies. No source text is rewritten by this key.
        const c={...DEFAULTS,...cfg},noop=()=>{};
        if(c.bareReferences){const converted=refTokens(simpleReferences('<ref>'+body+'</ref>',noop));if(converted.length===1&&converted[0].body!==null)body=converted[0].body;}
        const nodes=templates(body).nodes;
        if(nodes.some(n=>!CITE_NAMES[parsedTemplate(body.slice(n.start,n.end)).name]||n.depth>0))return null;
        let invalid=false;
        let result=mapTemplateTree(body,raw=>{const converted=v24InventoryTemplate(raw,c),p=parsedTemplate(converted);if(!CITE_NAMES[p.name])return raw;
            const entries=foreignEntries(p),keys=entries.map(e=>parameterFamily(e.key));
            if(entries.some(e=>e.positional)||new Set(keys).size!==keys.length){invalid=true;return raw;}
            return JSON.stringify([norm(CITE_NAMES[p.name]),entries.map((e,i)=>[keys[i],e.value])]);});
        if(c.links){result=wikiURLs(result,noop);result=cleanLinks(result,noop);}
        return invalid?null:result;
    }
    function v27SafeNamedReferenceEdits(source,cfg,context) {
        if(cfg.references===false||cfg.automaticIdenticalReferences===false)return [];
        const parsed=v25SafeCompleteReferences(source);if(!parsed)return [];
        const refs=parsed.refs,renderers=context.renderers;
        const region=at=>renderers.filter(r=>r.end<=at).length;
        const blockedNames=new Set(),ambiguousNames=new Set(),defs=new Map(),uses=new Map(),identity=(g,n)=>JSON.stringify([g,n]);
        const rawNodes=templates(context.view).nodes;
        if(rawNodes.some(n=>['refn','nre','efn','#tag:ref'].includes(parsedTemplate(source.slice(n.start,n.end)).name)))return [];
        for(const ref of refs){const attrs=ref.attrs;if(!attrs||!attrs.name)continue;const key=identity(ref.group||'',attrs.name);
            if(!uses.has(key))uses.set(key,[]);uses.get(key).push({start:ref.start,ref,region:region(ref.start)});
            if(!v27SafeReferenceName(attrs.name)||!v27SafeLiteral(ref.group||'',true)||ref.container||inRange(ref.start,renderers)||v27SafeOverlap(ref.start,ref.end,context.shield.ranges)){blockedNames.add(key);continue;}
            if(ref.body!==null){if(!defs.has(key))defs.set(key,[]);defs.get(key).push(ref);}
        }
        const rUses=rReferenceUses(source);
        for(const use of rUses){const key=identity(use.group||'',use.value),owner=rawNodes.find(n=>n.start===use.ownerStart&&n.end===use.ownerEnd);
            if(!uses.has(key))uses.set(key,[]);uses.get(key).push({...use,helper:true,region:region(use.start)});
            if(!owner||rawNodes.some(n=>n.start<owner.start&&n.end>=owner.end)||v27SafeOverlap(owner.start,owner.end,context.shield.ranges)){blockedNames.add(key);ambiguousNames.add(use.value);continue;}
            const p=parsedTemplate(source.slice(owner.start,owner.end)),options=templateEntries(p),pos=p.parts.slice(1).filter(part=>!biographyNamedPart(part));
            if(!pos.length||pos.some(s=>!v27SafeReferenceName(s.trim()))||options.some(e=>/^\d+$/.test(e.key)||!v27SafeLiteral(e.value,true))||options.filter(e=>['group','grupo','g'].includes(norm(e.key))).length>1){blockedNames.add(key);ambiguousNames.add(use.value);}
        }
        const families=new Map();
        for(const [key,list] of defs){if(list.length!==1||blockedNames.has(key)||ambiguousNames.has(list[0].attrs.name))continue;const ref=list[0],all=uses.get(key)||[],r=region(ref.start);
            if(!ref.body.trim()||all.some(u=>u.region!==r))continue;
            const body=v27SafeReferenceBody(ref.body,cfg);if(body===null)continue;const family=JSON.stringify([ref.group||'',r,body]);
            if(!families.has(family))families.set(family,[]);families.get(family).push({key,ref,all,body});
        }
        const edits=[],nameSpans=referenceNameUses(source);
        for(const family of families.values()){
            if(family.length<2)continue;family.sort((a,b)=>Math.min(...a.all.map(u=>u.start))-Math.min(...b.all.map(u=>u.start)));
            const keeper=family[0],name=keeper.ref.attrs.name;
            if(family.slice(1).some(member=>member.all.some(use=>{const at=use.helper?use.ownerStart:use.ref.start;return !nameSpans.some(s=>s.ownerStart===at&&s.key==='name'&&s.value===member.ref.attrs.name&&(!use.helper||s.start===use.start));})))continue;
            const proof={group:keeper.ref.group||'',region:region(keeper.ref.start),name,normalizedBody:keeper.body,names:family.map(f=>f.ref.attrs.name),bodies:family.map(f=>f.ref.body)};
            // Every name must have one complete definition and every use must
            // belong to this same renderer interval. The first body stays exact.
            for(const member of family.slice(1)){
                const ref=member.ref,opening=tagAt(source,ref.start),span=nameSpans.find(u=>u.ownerStart===ref.start&&u.key==='name');
                if(!opening||!span)continue;
                let opener=source.slice(ref.start,opening.end),local=span.start-ref.start;
                const quoted=/["']/.test(source[span.start-1]||'');
                opener=opener.slice(0,local)+(quoted?name:'"'+name+'"')+opener.slice(local+(span.end-span.start));
                opener=opener.replace(/\s*>$/,' />');
                edits.push({start:ref.start,end:ref.end,text:opener,ruleId:'v27NamedReferences',proof});
                for(const use of member.all){if(use.ref&&use.ref.body!==null)continue;
                    const target=nameSpans.find(s=>s.ownerStart===(use.helper?use.ownerStart:use.ref.start)&&s.start===(use.helper?use.start:s.start)&&s.key==='name'&&s.value===member.ref.attrs.name);
                    if(!target)continue;
                    const quoted=!use.helper&&/["']/.test(source[target.start-1]||'');
                    edits.push({start:target.start,end:target.end,text:use.helper||quoted?name:'"'+name+'"',ruleId:'v27NamedReferences',proof});
                }
            }
        }
        return edits;
    }
    function v27SafeAutomationEdits(source,cfg={},kind) {
        const context=v27SafeContext(source,cfg);if(!context)return [];
        const rules={infobox:v27SafeInfoboxEdits,defaultsort:v27SafeDefaultsortEdits,portal:v27SafePortalEdits,references:v27SafeNamedReferenceEdits};
        return rules[kind]?rules[kind](source,cfg,context):[];
    }
    function v27SafeAutomationPlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};
        for(const kind of ['infobox','defaultsort','portal','references']){const before=plan.text,edits=v27SafeAutomationEdits(before,cfg,kind);if(!edits.length)continue;
            plan.text=v24SyntaxApply(before,edits);plan.steps.push({kind,before,after:plan.text,edits});plan.edits.push(...edits);}
        return plan;
    }
    function v27SafeAutomationProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const fresh=v27SafeAutomationPlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
    }
    function v27SafeObjectProof(plan,expected,actual) {
        const reject=reason=>({accepted:false,reason}),cfg=plan.cfg,steps=plan.safe.steps;
        if(steps.some(s=>s.name==='v27-portal')){
            const slots=source=>v24InventoryCount(v24InventoryTemplates(source,cfg).filter(x=>x.kind==='portal-slot').map(x=>x.key));
            const wanted=new Map([...slots(expected)].map(([key])=>[key,1]));
            if(!v24InventoryContains(wanted,slots(actual)))return reject('Uma entrada de portal foi retirada fora da repetição confirmada.');
        }
        if(steps.some(s=>s.name==='v27-defaultsort')){
            const keys=source=>v24InventoryCount(topNodes(protectedView(source)).map(n=>source.slice(n.start,n.end)).filter(raw=>/^\{\{\s*DEFAULTSORT\s*:[^{}|\r\n]+\}\}$/i.test(raw)).map(raw=>raw.match(/:([^{}|\r\n]+)\}\}$/)[1].trim()));
            if(!v24InventoryContains(keys(expected),keys(actual)))return reject('A chave de ordenação mantida pelo ajuste foi retirada ou alterada.');
        }
        const wanted=new Set(steps.filter(s=>s.name==='v27-infobox').flatMap(s=>s.edits.map(e=>e.proof.template)));
        if(wanted.size){
            const fields=source=>{
                const noop=()=>{};let text=mapTemplateTree(source,raw=>{const p=parsedTemplate(raw);return Object.prototype.hasOwnProperty.call(INFOBOX_CATALOG,p.name)?infobox(automaticParameters(raw,cfg,noop),noop,noop):v24InventoryTemplate(raw,cfg);});
                text=occupationCase(livingBirthAge(text,cfg,noop),cfg,noop);
                const out=[];for(const n of topNodes(protectedView(text))){const p=parsedTemplate(text.slice(n.start,n.end));if(!wanted.has(p.name))continue;
                    for(const e of templateEntries(p))if(e.value.trim())out.push(JSON.stringify([p.name,e.key,v24InventoryBody(e.value,cfg)]));}
                return v24InventoryCount(out);
            };
            const wantedFields=new Map([...fields(expected)].map(([key])=>[key,1]));
            if(!v24InventoryContains(wantedFields,fields(actual)))return reject('Uma infocaixa perdeu um campo preenchido fora da repetição vazia confirmada.');
        }
        return {accepted:true,reason:''};
    }
