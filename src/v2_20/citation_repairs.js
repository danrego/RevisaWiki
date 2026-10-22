    // Finite native citation contracts. Unknown fields and ambiguous ownership
    // remain literal. These readers do not fetch, publish or invent metadata.
    const V220_CITATION_CONTRACTS=Object.freeze({
        harvnb:{title:'Harvnb',oldid:50774774},
        book:{title:'Citar livro',oldid:48159689,moduleOldid:49448102},
        tweet:{title:'Citar tweet',oldid:69618888},
        cs1:{configurationOldid:73016847,whitelistOldid:71860752},
        columns:{title:'Colunas-lista',oldid:69474033},
        footnote:{title:'Nota de rodapé',oldid:60322761},
        refn:{title:'Refn',oldid:57056787},
        nre:{title:'Nre',oldid:68628864},efn:{title:'Efn',oldid:68628877}
    });
    function v220CitationScope(source,cfg={}) {
        return typeof source==='string'&&source.length<=4194304&&
            (cfg.namespaceNumber===undefined||cfg.namespaceNumber===0)&&!cfg.sectionOnly&&
            !cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
    }
    function v220RawReferenceAttributeBoundary(source,referenceStart) {
        if(typeof source!=='string')return false;
        const header=/<\/?\s*([a-z][a-z0-9:_-]*)\b/iy,
            reference=/<\s*[/\\]?\s*ref(?=[\s/>]|(?:name|group)\s*=)/iy;
        for(let at=source.indexOf('<');at>=0;){
            if(source.startsWith('<!--',at)){
                const end=source.indexOf('-->',at+4);
                if(end<0)return false;
                at=source.indexOf('<',end+3);continue;
            }
            header.lastIndex=at;const match=header.exec(source);
            if(!match){at=source.indexOf('<',at+1);continue;}
            let quote='',end=header.lastIndex;
            for(;end<source.length;end++){
                const char=source[end];
                // Cite extension recognition precedes ordinary HTML parsing.
                // The old reference tokenizer also accepts malformed closers
                // here. Canonicalizing one can activate a different boundary.
                if(char==='<'){
                    reference.lastIndex=end;
                    if(reference.test(source)&&(referenceStart===undefined||end===referenceStart&&at<referenceStart))return true;
                }
                if(quote){if(char===quote)quote='';}
                else if(char==='"'||char==="'")quote=char;
                else if(char==='>'){end++;break;}
            }
            if(end>=source.length)return false;
            at=source.indexOf('<',end);
        }
        return false;
    }
    function normalizeRefs(source,cfg,bump,warn) {
        // The build retains the original implementation under this name.
        // Only its ambiguous raw-attribute case is vetoed; all other callers,
        // stages, options and preservation checks keep their existing paths.
        if(v220RawReferenceAttributeBoundary(source))return source;
        return v220BaselineNormalizeRefs(source,cfg,bump,warn);
    }
    function v220CitationTitle(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const head=splitParts(raw.slice(2,-2))[0].trim().replace(/_/g,' ')
            .replace(/^(?:predefinição|template)\s*:\s*/i,'');
        if(/[{}<>\u0000-\u001f\uE000-\uF8FF]/.test(head))return null;
        return head.charAt(0).toUpperCase()+head.slice(1);
    }
    function v220CitationFields(raw) {
        if(typeof raw!=='string'||/\{\{\{|\uE000|\uF8FF/.test(raw))return null;
        const structure=v24SyntaxTemplates(raw);
        if(structure.unclosed.length)return null;
        const root=structure.nodes.filter(n=>n.depth===0&&n.size===2);
        if(root.length!==1||root[0].start!==0||root[0].end!==raw.length)return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
        const fields=[];
        for(const part of parts.slice(1)){
            const m=/^([ \t\r\n]*)([^=\r\n{}<>]+?)([ \t\r\n]*)=([\s\S]*)$/.exec(part.text),start=part.start+2,end=part.end+2;
            if(!m){fields.push({positional:true,value:part.text,start,end,partStart:start,partEnd:end});continue;}
            const key=m[2];if(key!==key.trim()||!key||/[{}<>\[\]|\u0000-\u001f\uE000-\uF8FF]/.test(key))return null;
            const keyStart=start+m[1].length,keyEnd=keyStart+key.length,valueStart=keyEnd+m[3].length+1;
            fields.push({key,value:m[4],start:valueStart,end,keyStart,keyEnd,partStart:start,partEnd:end,positional:false});
        }
        return fields;
    }
    function v220CitationNamedFields(fields,allowPositional=false) {
        if(!fields||!allowPositional&&fields.some(f=>f.positional))return null;
        const map=new Map();for(const f of fields){if(f.positional)continue;if(map.has(f.key))return null;map.set(f.key,f);}return map;
    }
    function v220CitationEdit(source,start,end,text,ruleId,contract,details={}) {
        return {start,end,text,ruleId,proof:{version:'2.20',sourceHash:v24SyntaxHash(source),
            before:source.slice(start,end),contract,...details}};
    }
    let v220CitationFragmentKeys=null;
    function v220CitationFragmentMayBeParameter(value) {
        const fragment=String(value).trim().replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('pt');
        if(!fragment||/^\d|(?:https?:\/\/|www\.)/i.test(fragment))return true;
        if(!v220CitationFragmentKeys){
            const foreign=Object.values(TRANSLATION_RULES.profiles).filter(profile=>profile.kind==='citation')
                .flatMap(profile=>Object.keys(profile.fields||{}));
            v220CitationFragmentKeys=[...new Set([...CS1_KEYS,...foreign].map(key=>key.replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('pt')))];
        }
        // This is a refusal vocabulary, not a parameter migration. A known
        // field followed by a value may be awaiting an existing missing-equals
        // repair, including when the field arrived from another language.
        return v220CitationFragmentKeys.some(key=>{
            if(key.includes('#')){const pattern=key.split('#').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\d+');
                return new RegExp('^'+pattern+'(?:$|[^\\p{L}\\p{M}])','u').test(fragment);}
            return fragment.startsWith(key)&&!/^[\p{L}\p{M}]/u.test(fragment.slice(key.length));
        });
    }
    function v220CitationCall(raw,cfg={}) {
        const title=v220CitationTitle(raw),fields=v220CitationFields(raw);if(!title||!fields)return null;
        const local=[],rules=[];const edit=(start,end,text,rule)=>{local.push({start,end,text,ruleId:rule});rules.push(rule);};
        const map=v220CitationNamedFields(fields,title==='Harvnb');
        if(title==='Harvnb'&&map&&cfg.references!==false&&cfg.automaticParameterNames!==false&&!(map.has('page')&&map.has('pages'))){
            for(const [from,to] of [['page','p'],['pages','pp']]){
                const f=map.get(from);if(!f||!f.value.trim()||map.has(to)||map.has(to==='p'?'pp':'p')||
                    /[{}<>\uE000-\uF8FF]/.test(f.value))continue;
                // A locator is supplied literally. ps is deliberately absent
                // from this map: punctuation is not a page number.
                edit(f.keyStart,f.keyEnd,to,'v220HarvardLocator');
            }
        }
        if(title==='Citar livro'&&map&&cfg.citations!==false&&cfg.automaticParameterNames!==false){
            const total=map.get('páginas-total');
            if(total&&!map.has('total-páginas')&&!map.has('total-paginas')&&/^\s*[1-9]\d{0,5}\s*$/.test(total.value))
                edit(total.keyStart,total.keyEnd,'total-páginas','v220CitationTotalPages');
            const lay=map.get('layurl'),family=['lay-url','lay-summary','laysummary','resumo','url-resumo','resumo-url'];
            if(lay&&lay.value.trim()&&!family.some(key=>map.has(key))&&/^\s*https?:\/\/[^\s{}<>|]+\s*$/.test(lay.value))
                edit(lay.keyStart,lay.keyEnd,'lay-url','v220CitationDeprecatedAlias');
        }
        if(title==='Citar tweet'&&map&&cfg.citations!==false&&cfg.authors!==false&&cfg.automaticParameterNames!==false){
            const first=map.get('first'),last=map.get('last'),hasAuthor=[...map.keys()].some(k=>/^(?:author|autor|autores|authors|primeiro|ultimo|último|nome|sobrenome)(?:\d+)?$|^(?:first|last)\d+$|^author-(?:first|last)/.test(k)),
                literal=value=>typeof value==='string'&&value.trim().length<=120&&/^[\p{L}\p{M}][\p{L}\p{M} .'’\-]*$/u.test(value.trim());
            if(first&&last&&!hasAuthor&&literal(first.value)&&literal(last.value)){
                const padded=/^(\s*)([\s\S]*?)(\s*)$/.exec(first.value);
                edit(first.keyStart,first.keyEnd,'autor','v220TweetAuthor');
                edit(first.start,first.end,padded[1]+first.value.trim()+' '+last.value.trim()+padded[3],'v220TweetAuthor');
                edit(last.partStart-1,last.partEnd,'','v220TweetAuthor');
            }
        }
        // The native CS1 family has no displayed positional argument. One
        // adjacent, nonempty literal fragment can only follow the sole title.
        if(cfg.citations!==false&&cfg.citationRepairs!==false&&/^[Cc]itar (?:web|livro|jornal|periódico|revista)$/.test(title)&&
            fields.filter(f=>f.positional).length===1){
            const at=fields.findIndex(f=>f.positional),fragment=fields[at],previous=fields[at-1],
                titles=fields.filter(f=>!f.positional&&['titulo','título','title'].includes(f.key));
            if(previous&&titles.length===1&&previous===titles[0]&&previous.value.trim()&&fragment.value.trim()&&
                fragment.value.trim().length<=300&&!/[={}<>\[\]\r\n\uE000-\uF8FF]/.test(fragment.value)&&
                !v220CitationFragmentMayBeParameter(fragment.value)&&fields.every((f,i)=>f.positional||i===at-1||!/^\d+$/.test(f.key))){
                edit(fragment.partStart-1,fragment.partStart,'{{!}}','v220CitationLiteralPipe');
            }
        }
        if(!local.length)return null;
        const ordered=local.sort((a,b)=>a.start-b.start||a.end-b.end);
        for(let i=1;i<ordered.length;i++)if(ordered[i].start<ordered[i-1].end)return null;
        return {text:v24SyntaxApply(raw,ordered),rules:[...new Set(rules)],contract:{title,
            nativeOldid:title==='Harvnb'?50774774:title==='Citar tweet'?69618888:title==='Citar livro'?48159689:null,
            configurationOldid:73016847,whitelistOldid:71860752},fieldEdits:ordered};
    }
    function v220LiteralReferenceBodySafe(source,start,end,shield) {
        const body=source.slice(start,end);
        if(!body.trim()||/<\s*[/\\]?\s*ref\b/i.test(body)||/\{\{\{|\{\{\s*(?:#|subst\s*:|safesubst\s*:)/i.test(body))return false;
        if(shield.ranges.some(r=>r.start<end&&r.end>start&&!['quotation','quotation-markup'].includes(r.kind)))return false;
        const parsed=v24SyntaxTemplates(body);
        if(parsed.unclosed.length||parsed.nodes.some(n=>n.size!==2||!V24_SYNTAX_CITATIONS.has(v24SyntaxName(body.slice(n.start+2,n.end).split(/[|}\n]/,1)[0]))))return false;
        for(let at=body.indexOf('<');at>=0;){
            if(body.startsWith('<!--',at)){const close=body.indexOf('-->',at+4);if(close<0)return false;at=body.indexOf('<',close+3);continue;}
            const tag=v24SyntaxTag(body,at);
            if(!tag&&/^<\s*[/\\]?\s*[a-z]/i.test(body.slice(at,at+128)))return false;
            at=body.indexOf('<',tag?tag.end:at+1);
        }
        return v24SyntaxScan(body).issues.length===0;
    }
    function v220ReferenceOpeningOwnerSafe(source,view,at) {
        // A candidate starts its own malformed ref header. Only an earlier
        // raw header can make that candidate an attribute value instead.
        if(v220RawReferenceAttributeBoundary(source,at))return false;
        const context=v24SyntaxContext(view,at);
        if(context.templates?.length||context.html?.length||context.links?.length||context.external?.length)return false;
        if(context.tables?.length){
            if(context.tables.some(start=>v24SyntaxScan(view).tables.includes(start)))return false;
            const start=source.lastIndexOf('\n',at-1)+1,prefix=source.slice(start,at),cells=v210TableCells(prefix,start);
            if(!cells?.length)return false;
            const cell=cells.at(-1),pipe=cell.view.indexOf('|');
            if(pipe<0){if(/[=]/.test(cell.raw))return false;}
            else if(!v29TableAttributes(cell.raw.slice(0,pipe),cell.start,'cell'))return false;
        }
        return true;
    }
    function v220CitationRefTagEdits(source,cfg={}) {
        if(cfg.references===false||cfg.structuralRepairs===false||cfg.markup===false)return [];
        const shield=v24SyntaxProtected(source),view=shield.view,edits=[],opening=[];
        // Closed double-opening headers, one literal name and optional group.
        // This does not choose a new citation boundary or merge adjacent refs.
        const re=/<ref((?:\s+(?:name|group)\s*=\s*(?:"[^"<>\r\n]*"|'[^'<>\r\n]*')){1,2})\s*<ref\s*>/gi;
        let m;while((m=re.exec(source))){
            if(inRange(m.index,shield.ranges)||!v220ReferenceOpeningOwnerSafe(source,view,m.index))continue;
            const attrs=v24SyntaxAttrs(m[1]);if(!attrs||!attrs.name||/^\d+$/.test(attrs.name)||!v24SyntaxLiteralIdentity(attrs,true))continue;
            const close=/<\/ref\s*>/gi;close.lastIndex=re.lastIndex;const end=close.exec(source);if(!end)continue;
            const body=source.slice(re.lastIndex,end.index);if(!v220LiteralReferenceBodySafe(source,re.lastIndex,end.index,shield)||/<\/?\s*ref(?:\b|name(?=\s*=)|group(?=\s*=))/i.test(body))continue;
            const before=view.slice(0,m.index),tokens=refTokens(before);
            if(tokens.some(ref=>ref.body===null&&!ref.raw.endsWith('/>'))||v219NativeReferenceObserver(before).unclosed.length)continue;
            const peers=v219NativeReferenceObserver(source).refs.filter(ref=>ref.attrs?.name===attrs.name&&ref.group===(attrs.group||'')&&ref.body!==null);
            if(peers.some(ref=>ref.body.trim()!==body.trim()))continue;
            const text='<ref'+m[1]+'>';
            edits.push(v220CitationEdit(source,m.index,re.lastIndex,text,'v220ReferenceDoubleOpening',
                {extension:'Cite',name:attrs.name,group:attrs.group||''},{bodyHash:v24SyntaxHash(body)}));opening.push({start:m.index,end:end.index+end[0].length});
        }
        // A masked opening is still a possible owner. Establish absence of
        // an owner from raw tags as well, never from a quotation/protected mask.
        // Once ownership is ambiguous, leave subsequent closers untouched.
        const rawDuplicateClosers=new Map();let rawDepth=0,rawUncertain=false,rawOpener=null,lastComplete=null;
        const completeBodySafe=owner=>v220LiteralReferenceBodySafe(source,owner.opener.end,owner.closer.start,shield);
        for(let at=source.indexOf('<');at>=0;){
            const repairedOwner=opening.find(range=>range.start<=at&&at<range.end);
            if(repairedOwner){at=source.indexOf('<',repairedOwner.end);continue;}
            const tag=v24SyntaxTag(source,at);
            if(!tag){
                if(/^<\s*[/\\]?\s*[a-z]/i.test(source.slice(at,at+128)))rawUncertain=true;
                at=source.indexOf('<',at+1);continue;
            }
            at=source.indexOf('<',tag.end);
            // Extension tags are recognized before ordinary HTML attributes.
            // A ref-looking token inside another tag may therefore own a
            // native Cite boundary even though this HTML reader consumed it.
            if(/<\s*[/\\]?\s*ref(?=[\s/>]|(?:name|group)\s*=)/i.test(tag.raw.slice(1)))rawUncertain=true;
            if(tag.name!=='ref')continue;
            if(tag.typo||inRange(tag.start,shield.ranges))rawUncertain=true;
            if(!tag.close){
                const attrs=v24SyntaxAttrs(tag.attrs);
                if(!v24SyntaxLiteralIdentity(attrs)||(attrs&&Object.hasOwn(attrs,'name')&&(!attrs.name||/^\d+$/.test(attrs.name))))rawUncertain=true;
                if(rawDepth)rawUncertain=true;
                if(!tag.self){if(!rawDepth)rawOpener=tag;rawDepth++;}
                continue;
            }
            if(tag.typo||tag.self||tag.attrs.trim()){rawUncertain=true;continue;}
            if(rawDepth){
                rawDepth--;
                if(!rawDepth){lastComplete=!rawUncertain&&rawOpener?{opener:rawOpener,closer:tag,end:tag.end}:null;rawOpener=null;}
                continue;
            }
            if(!rawUncertain&&lastComplete&&lastComplete.end===tag.start&&tag.raw==='</ref>'&&lastComplete.closer.raw==='</ref>'&&
                (lastComplete.safe??=completeBodySafe(lastComplete))){
                if(!lastComplete.chain){
                    const closers=[];let end=lastComplete.closer.end,next;
                    while((next=v24SyntaxTag(source,end))&&next.name==='ref'&&next.close){closers.push(next);end=next.end;}
                    lastComplete.chain={safe:closers.length>0&&closers.every(t=>t.raw==='</ref>'),end,count:closers.length};
                }
                if(!lastComplete.chain.safe)continue;
                rawDuplicateClosers.set(tag.start,{openStart:lastComplete.opener.start,closeStart:lastComplete.closer.start,
                    closeEnd:lastComplete.closer.end,chainEnd:lastComplete.chain.end,extraClosers:lastComplete.chain.count,
                    bodyHash:v24SyntaxHash(source.slice(lastComplete.opener.end,lastComplete.closer.start))});
                lastComplete.end=tag.end;
            }
        }
        // An unmatched closing ref is visible literal text. Preserve prose
        // bytes and exclude examples, dynamic template owners and pending refs.
        let depth=0;
        for(let at=view.indexOf('<');at>=0;){
            const repairedOwner=opening.find(range=>range.start<=at&&at<range.end);
            if(repairedOwner){at=view.indexOf('<',repairedOwner.end);continue;}
            const tag=v24SyntaxTag(view,at);if(!tag){
                // Earlier finite rules repair refname="...". Its closing
                // tag already has a prospective owner and must survive this
                // pass. refgroup and incomplete ref headers are uncertain
                // owners too, even when no automatic repair is available.
                const joined=/^<\s*ref(?:name|group)(?=\s*=)/i.exec(view.slice(at,at+128));
                if(joined){const fixed=source.slice(at).replace(/^(<\s*ref)(name|group)/i,'$1 $2'),prospective=v24SyntaxTag(fixed,0);
                    if(!prospective?.self)depth++;
                }else if(/^<\s*ref(?=\s)/i.test(view.slice(at,at+128)))depth++;
                at=view.indexOf('<',at+1);continue;
            }at=view.indexOf('<',tag.end);
            if(tag.name!=='ref'||tag.typo||inRange(tag.start,opening))continue;
            if(!tag.close){if(!tag.self)depth++;continue;}
            if(depth){depth--;continue;}
            if(!rawDuplicateClosers.has(tag.start)||tag.attrs.trim()||tag.self||inRange(tag.start,templates(view).nodes))continue;
            const context=v24SyntaxContext(view,tag.start);
            if(context.templates?.length||context.html?.length||context.tables?.length||context.links?.length||context.external?.length)continue;
            edits.push(v220CitationEdit(source,tag.start,tag.end,'','v220ReferenceOrphanCloser',
                {extension:'Cite',operation:'remove-adjacent-duplicate-closing-tag'},rawDuplicateClosers.get(tag.start)));
        }
        return edits;
    }
    function v220CitationDefinitionInventory(source,cfg={}) {
        if(!v220CitationScope(source,cfg)||cfg.references===false)return [];
        const observed=v219NativeReferenceObserver(source),nodes=templates(observed.view).nodes,result=[],seen=new Set();
        if(observed.unclosed.length||observed.empties.length)return [];
        const literal=value=>typeof value==='string'&&value.trim()===value&&value.length<=255&&
            !/[{}<>\[\]|&"'\r\n\u0000-\u001f\uE000-\uF8FF]/.test(value)&&!v219UncertainReferenceIdentity(value);
        const fieldFor=(node,at)=>{const raw=source.slice(node.start,node.end),fields=v220CitationFields(raw);return fields?.find(f=>f.start<=at-node.start&&at-node.start<f.end)||null;};
        const knownOwner=(at,except=null)=>nodes.filter(n=>n.start<at&&at<n.end&&n!==except).every(node=>{
            const raw=source.slice(node.start,node.end),title=v220CitationTitle(raw),field=fieldFor(node,at);
            if(!field)return false;
            const parts=splitParts(raw.slice(2,-2)),fields=v220CitationFields(raw);if(!fields)return false;
            if(title==='Info/Conflito militar'){
                const profile=INFOBOX_CATALOG['info/conflito militar'];
                // Native 72740211 dados23 emits each supplied commander field
                // verbatim in either the two-column or three-column branch.
                return profile?.oldid===72740211&&!field.positional&&/^comandante[1-3]$/.test(field.key)&&
                    fields.filter(f=>!f.positional&&f.key===field.key).length===1;
            }
            if(title!=='Colunas-lista')return false;
            const slots=new Map();let next=1;
            for(const f of fields){const key=f.positional?String(next++):f.key;if(slots.has(key))return false;slots.set(key,f);}
            // Native body is selected as 2 then 1, including explicit blanks.
            const chosen=slots.get('2')||slots.get('1');
            return !!chosen&&field.start===chosen.start&&field.end===chosen.end&&parts.length<=12;
        });
        const bodyKnown=body=>{
            const visible=v219NativeReferenceObserver(body).view,parsed=templates(visible);if(parsed.unclosed.length)return false;
            const roots=parsed.nodes.filter(n=>n.depth===0);let rest=visible;
            for(const n of roots.slice().sort((a,b)=>b.start-a.start))rest=rest.slice(0,n.start)+rest.slice(n.end);
            if(rest.replace(/<[^>]*>/g,'').trim())return true;
            return roots.length===1&&!!v219NormalizedNativeCitationContext(body.slice(roots[0].start,roots[0].end));
        };
        const add=(name,group,body,start,end,contract)=>{
            if(!name||/^\d+$/.test(name)||!literal(name)||!literal(group)||!body?.trim()||!bodyKnown(body))return;
            const identity=JSON.stringify([group,name]),bodyHash=v24SyntaxHash(body),key=identity+'\u0000'+bodyHash;if(seen.has(key))return;seen.add(key);
            result.push({name,group,start,end,identity,bodyHash:v24SyntaxHash(body),contract});
        };
        for(const ref of observed.refs)if(ref.body!==null&&ref.attrs&&v24SyntaxLiteralIdentity(ref.attrs,true)&&knownOwner(ref.start))
            add(ref.attrs.name,ref.group,ref.body,ref.start,ref.end,{extension:'Cite'});
        for(const node of nodes){
            const raw=source.slice(node.start,node.end),title=v220CitationTitle(raw),fields=v220CitationFields(raw),map=v220CitationNamedFields(fields);
            if(!['Nota de rodapé','Refn','Nre','Efn'].includes(title)||!fields||!knownOwner(node.start,node))continue;
            // Positional body is legal. Duplicate and alias collisions retain
            // their native ambiguity rather than being resolved heuristically.
            const groups=new Set(),values=new Map();let slot=1,valid=true;
            for(const f of fields){const key=f.positional?String(slot++):f.key;if(values.has(key)){valid=false;break;}values.set(key,f.value);}
            if(!valid)continue;
            const keys=title==='Nota de rodapé'?['name','nome','grupo','nota','1']:title==='Refn'?['name','group','1','refn']:
                ['name','nome','group','grupo','1','reference','content','text','referência','conteúdo','texto'];
            if([...values.keys()].some(k=>!keys.includes(k)))continue;
            const choose=keys=>{const present=keys.filter(k=>values.has(k));return present.length===1?values.get(present[0]):present.length?null:undefined;},
                name=choose(title==='Refn'?['name']:['name','nome']),body=choose(title==='Nota de rodapé'?['nota','1']:title==='Refn'?['1','refn']:['1','reference','content','text','referência','conteúdo','texto']);
            if(name===null||body===null)continue;
            let group=choose(title==='Nota de rodapé'?['grupo']:title==='Refn'?['group']:['group','grupo']);if(group===null)continue;
            if(title==='Nota de rodapé')group=group===undefined?'nota':group;
            else if(title==='Refn')group=group||'';
            else{
                const allowed=['nota','upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'];
                if(!allowed.includes((group||'').trim()))group='lower-alpha';
                else if(name&&values.has('grupo'))group='';
            }
            add(name||'',group||'',body,node.start,node.end,V220_CITATION_CONTRACTS[title==='Nota de rodapé'?'footnote':title.toLowerCase()]);
        }
        return result;
    }
    function v220FilterReferenceFindings(source,findings,cfg={}) {
        if(!Array.isArray(findings)||!v220CitationScope(source,cfg)||!findings.some(f=>typeof f==='string'?/^Referência \"/.test(f):f?.code==='missing-definition'))return findings;
        const definitions=v220CitationDefinitionInventory(source,cfg);
        let observed=null;
        const confirmed=(name,group)=>{const matches=definitions.filter(d=>d.name===name&&d.group===group);
            return matches.length>0&&new Set(matches.map(d=>d.bodyHash)).size===1;};
        return findings.filter(f=>{
            const message=typeof f==='string'?f:f?.message;if(typeof message!=='string'||typeof f!=='string'&&f.code!=='missing-definition')return true;
            const legacy=typeof f==='string'&&/^Referência "([^"\r\n]+)" sem definição no texto comum\. Ela pode estar em uma lista ou predefinição\.$/.exec(message),
                match=legacy||/^Referência "([^"\r\n]+)" sem definição(?:, grupo ([^\r\n]+))?\.$/.exec(message);
            if(!match)return true;const name=match[1],group=match[2]||'';
            // The old normalization warning omits the group. It can be
            // dismissed only when every observed use of that exact name has
            // one confirmed native definition in its own group.
            if(legacy){
                observed=observed||v219NativeReferenceObserver(source);
                const refs=observed.refs.filter(ref=>ref.attrs?.name===name),
                    helpers=observed.helpers.filter(helper=>helper.calls?.some(call=>call.value===name));
                if(refs.some(ref=>!ref.attrs||!v24SyntaxLiteralIdentity(ref.attrs,true))||helpers.some(helper=>!helper.eligible))return true;
                const groups=new Set([...refs.map(ref=>ref.group),...helpers.flatMap(helper=>helper.calls.filter(call=>call.value===name).map(call=>call.group))]);
                return groups.size===0||[...groups].some(g=>!confirmed(name,g));
            }
            return !confirmed(name,group);
        });
    }
    function v220FilterCitationSuggestions(source,suggestions,cfg={}) {
        if(!Array.isArray(suggestions))return suggestions;
        return suggestions.filter(proposal=>{
            if(!proposal||typeof proposal.before!=='string')return true;
            // A quote in prose does not establish bibliographic author/title
            // boundaries. Keep the original note, without a format offer.
            if(proposal.label==='Formatar a referência textual, confira autor e título')return false;
            const group=proposal.reviewGroup;
            if(group?.kind==='unsupported-template-parameter'&&group.template==='harvnb'&&group.parameter==='ps')return false;
            return true;
        });
    }
    function v220HeadingReferenceRequests(source,cfg={}) {
        if(!v220CitationScope(source,cfg)||cfg.references===false||cfg.headings===false)return [];
        const shield=v24SyntaxProtected(source),refs=refTokens(source),nodes=templates(shield.view).nodes,edits=[],records=[];
        const re=/^(={2,6})([^\n]*?)\1[ \t]*(?=\r?$)/gm;let m;
        while((m=re.exec(source))){
            if(inRange(m.index,shield.ranges)||inRange(m.index,nodes))continue;
            const insideStart=m.index+m[1].length,insideEnd=m.index+m[0].lastIndexOf(m[1]),
                local=refs.filter(r=>r.start>=insideStart&&r.end<=insideEnd);
            if(local.length!==1)continue;const ref=local[0],attrs=v24SyntaxAttrs(ref.attrs);
            if(!attrs||!v24SyntaxLiteralIdentity(attrs)||ref.body===null&& !attrs.name||
                source.slice(ref.end,insideEnd).trim())continue;
            const title=source.slice(insideStart,ref.start).trim();
            if(!title||title.length>160||/[{}<>\[\]|&=\r\n\u0000-\u001f\uE000-\uF8FF]/.test(title))continue;
            const newline=source.includes('\r\n')?'\r\n':'\n',text=m[1]+' '+title+' '+m[1]+newline+source.slice(ref.start,ref.end);
            records.push({start:m.index,end:re.lastIndex,title,level:m[1].length,ref:source.slice(ref.start,ref.end),before:m[0],after:text});
            edits.push({start:m.index,end:re.lastIndex,text});
        }
        if(!records.length||records.length>20)return [];
        const candidateText=v24SyntaxApply(source,edits);
        return [{kind:'v220-native-heading-reference-request',source,sourceHash:v24SyntaxHash(source),candidateText,
            candidateHash:v24SyntaxHash(candidateText),records,method:'native-parse-both-complete-sources'}];
    }
    function v220HeadingReferenceHtmlProof(source,request,beforeHtml,afterHtml) {
        if(typeof source!=='string'||!request||request.source!==source||request.sourceHash!==v24SyntaxHash(source)||
            typeof beforeHtml!=='string'||typeof afterHtml!=='string'||beforeHtml.length>16777216||afterHtml.length>16777216)return null;
        const fresh=v220HeadingReferenceRequests(source,{})[0];
        if(!fresh||request.kind!==fresh.kind||request.candidateText!==fresh.candidateText||
            request.candidateHash!==fresh.candidateHash||JSON.stringify(request.records)!==JSON.stringify(fresh.records))return null;
        const decode=value=>value.replace(/&#(?:x([\da-f]+)|(\d+));/gi,(_,x,d)=>{const n=x?parseInt(x,16):Number(d);return n>=0&&n<=0x10ffff?String.fromCodePoint(n):'\uFFFD';})
            .replace(/&(amp|quot|apos|lt|gt);/g,(_,n)=>({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'}[n]));
        const read=html=>{const sections=[];for(const m of html.matchAll(/<h([2-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)){
            const ids=[...m[0].matchAll(/\bid="([^"]+)"/g)].map(x=>decode(x[1])).filter(id=>!/^cite[_-]/.test(id)),
                label=decode(m[3].replace(/<sup\b[^>]*class="[^"]*\breference\b[^"]*"[^>]*>[\s\S]*?<\/sup>/gi,'').replace(/<[^>]+>/g,'')).trim();
            sections.push({level:Number(m[1]),ids,label});}
            const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>decode(x[1]));return {sections,ids};};
        const before=read(beforeHtml),after=read(afterHtml);
        if(before.sections.length!==after.sections.length||new Set(before.ids).size!==before.ids.length||new Set(after.ids).size!==after.ids.length)return null;
        const referenceIds=ids=>ids.filter(id=>/^cite[_-]/.test(id)).sort();
        if(JSON.stringify(referenceIds(before.ids))!==JSON.stringify(referenceIds(after.ids)))return null;
        if(before.sections.some((s,i)=>s.label!==after.sections[i].label||s.level!==after.sections[i].level))return null;
        const records=[];
        for(const r of request.records){
            const matches=before.sections.map((s,i)=>s.label===r.title&&s.level===r.level?i:-1).filter(i=>i>=0);
            if(matches.length!==1)return null;const index=matches[0],oldIds=before.sections[index].ids,newIds=after.sections[index].ids;
            if(!oldIds.length||!newIds.length||oldIds.some(id=>!id||id.length>512||/[\u0000-\u001f\u007f]/.test(id)))return null;
            const missing=oldIds.filter(id=>!newIds.includes(id));if(missing.some(id=>after.ids.includes(id)))return null;
            records.push({start:r.start,end:r.end,before:r.before,after:r.after,title:r.title,oldIds,newIds,missing});
        }
        const allowedBefore=new Set(records.flatMap(r=>r.oldIds)),allowedAfter=new Set(records.flatMap(r=>r.newIds));
        if(before.ids.filter(id=>!allowedBefore.has(id)).some(id=>!after.ids.includes(id))||after.ids.filter(id=>!allowedAfter.has(id)).some(id=>!before.ids.includes(id)))return null;
        return {kind:'v220-native-heading-reference-proof',source,sourceHash:request.sourceHash,candidateHash:request.candidateHash,
            beforeHtmlHash:v24SyntaxHash(beforeHtml),afterHtmlHash:v24SyntaxHash(afterHtml),records,
            referenceIdsPreserved:true,otherIdsPreserved:true};
    }
    function v220CitationPlan(source,cfg={}) {
        const base={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],proofs:[]};
        if(!v220CitationScope(source,cfg))return base;
        const shield=v24SyntaxProtected(source),nodes=templates(source).nodes,candidates=[];
        for(const node of nodes){if(inRange(node.start,shield.ranges))continue;
            const raw=source.slice(node.start,node.end),call=v220CitationCall(raw,cfg);if(!call)continue;
            candidates.push({...v220CitationEdit(source,node.start,node.end,call.text,call.rules[0],call.contract,
                {ruleIds:call.rules,fieldEdits:call.fieldEdits}),ruleIds:call.rules});
        }
        candidates.push(...v220CitationRefTagEdits(source,cfg));
        const request=v220HeadingReferenceRequests(source,cfg)[0],proofs=cfg.v220HeadingReferenceProofs;
        if(request&&Array.isArray(proofs)){
            const proof=proofs.find(p=>p?.kind==='v220-native-heading-reference-proof'&&p.source===source&&p.sourceHash===base.sourceHash&&
                p.candidateHash===request.candidateHash&&p.referenceIdsPreserved===true&&p.otherIdsPreserved===true&&Array.isArray(p.records)&&p.records.length===request.records.length);
            if(proof){for(const [i,r] of request.records.entries()){
                const p=proof.records[i];if(!p||p.start!==r.start||p.end!==r.end||p.before!==r.before||p.after!==r.after||!Array.isArray(p.missing)||
                    p.missing.some(id=>typeof id!=='string'||!id||id.length>512||/[\u0000-\u001f\u007f]/.test(id)))continue;
                const escape=value=>value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
                    spans=p.missing.map(id=>'<span id="'+escape(id)+'"></span>').join(''),newline=source.includes('\r\n')?'\r\n':'\n',
                    at=r.after.indexOf(newline),text=r.after.slice(0,at)+newline+spans+(spans?newline:'')+r.after.slice(at+newline.length);
                candidates.push(v220CitationEdit(source,r.start,r.end,text,'v220HeadingReference',{method:'native-paired-parse'},
                    {oldIds:p.oldIds,newIds:p.newIds,insertedIds:p.missing,beforeHtmlHash:proof.beforeHtmlHash,afterHtmlHash:proof.afterHtmlHash}));
            }}
        }
        // Overlapping transactions cannot be applied independently. A heading
        // owner wins only when no nested citation edit is needed in this pass.
        const ordered=candidates.sort((a,b)=>a.start-b.start||b.end-a.end),edits=[];
        for(const edit of ordered){
            if(ordered.some(other=>other!==edit&&edit.start<other.end&&edit.end>other.start&&
                !(other.ruleId==='v220HeadingReference'&&other.start<=edit.start&&other.end>=edit.end&&edit.ruleId!=='v220HeadingReference')))continue;
            edits.push(edit);
        }
        const counts=new Map();for(const edit of edits)for(const id of edit.ruleIds||[edit.ruleId])counts.set(id,(counts.get(id)||0)+1);
        return {...base,text:v24SyntaxApply(source,edits),edits,proofs:edits.map(e=>e.proof),
            changes:[...counts].map(([id,count])=>({id,count}))};
    }
    function v220CitationPlanProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v220CitationPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
