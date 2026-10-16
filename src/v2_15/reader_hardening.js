    // Read brace runs before deciding which pairs belong to a template.
    // Five braces can be an outer call and an inner parameter. No source is
    // rewritten here, and a missing or empty parameter default stays distinct.
    function v215BraceStructure(source) {
        const groups=[],nodes=[],opaque=[];let at=0,noMoreGT=false;
        while(at<source.length){
            if(source.slice(at,at+4)==='<!--'){
                const close=source.indexOf('-->',at+4),end=close<0?source.length:close+3;
                opaque.push({start:at,end,kind:'comment'});at=end;continue;
            }
            if(source[at]==='<'&&!noMoreGT&&source.indexOf('>',at+1)<0)noMoreGT=true;
            const tag=noMoreGT?null:tagAt(source,at);if(tag){
                if(!tag.close&&!tag.self&&['nowiki','pre','syntaxhighlight','source','code','math','chem','score','timeline','graph','templatedata','poem','gallery','hiero','imagemap','mapframe','maplink','inputbox'].includes(tag.name)){
                    const closing=new RegExp('<\\s*\\/\\s*'+tag.name+'\\s*>','gi');closing.lastIndex=tag.end;
                    const end=closing.exec(source)?closing.lastIndex:source.length;
                    opaque.push({start:at,end,kind:tag.name});at=end;continue;
                }
                at=tag.end;continue;
            }
            if(source.slice(at,at+2)==='[['){
                let end=at+2;while(source[end]==='[')end++;
                groups.push({start:at,count:end-at,kind:'link'});at=end;continue;
            }
            if(source.slice(at,at+2)===']]'){
                let end=at+2;while(source[end]===']')end++;
                let left=end-at;
                while(left>=2&&groups.at(-1)?.kind==='link'){
                    const group=groups.at(-1);group.count-=2;left-=2;if(group.count<2)groups.pop();
                }
                at=end;continue;
            }
            if(source[at]==='{'){
                let end=at+1;while(source[end]==='{')end++;
                const count=end-at;if(count>=2)groups.push({start:at,count,kind:'brace'});at=end;continue;
            }
            if(source[at]==='}'){
                let end=at+1;while(source[end]==='}')end++;
                let cursor=at,left=end-at;
                while(left>=2&&groups.length&&groups.at(-1).kind==='brace'){
                    const group=groups.at(-1),size=group.count>=3&&left>=3?3:2;
                    if(group.count<size)break;
                    const start=group.start+group.count-size;
                    nodes.push({start,end:cursor+size,size,depth:0});
                    group.count-=size;cursor+=size;left-=size;
                    if(group.count<2)groups.pop();
                }
                at=end;continue;
            }
            at++;
        }
        const unclosed=[],unclosedLinks=[];
        for(const group of groups){
            if(group.kind==='link'){unclosedLinks.push({start:group.start,count:group.count});continue;}
            let count=group.count;const pending=[];
            while(count>=2){const size=count>=3?3:2;pending.push({start:group.start+count-size,size});count-=size;}
            unclosed.push(...pending.reverse());
        }
        const ancestors=[];
        for(const item of [...nodes,...unclosed.map(n=>({...n,end:source.length,unclosed:true}))].sort((a,b)=>a.start-b.start||b.end-a.end)){
            while(ancestors.length&&ancestors.at(-1).end<=item.start)ancestors.pop();
            while(ancestors.length&&ancestors.at(-1).end<item.end)ancestors.pop();
            item.depth=ancestors.length;
            ancestors.push(item);
        }
        return {nodes,unclosed,unclosedLinks,opaque};
    }
    function v215BraceParts(body,strict=false) {
        const parsed=v215BraceStructure(body);
        if(strict&&(parsed.unclosed.length||parsed.unclosedLinks.length))return null;
        const ranges=[...parsed.nodes,...parsed.unclosed.map(n=>({...n,end:body.length})),...parsed.opaque]
            .sort((a,b)=>a.start-b.start||b.end-a.end);
        const outer=[];let maximum=-1;
        for(const range of ranges)if(range.start>=maximum){outer.push(range);maximum=range.end;}
        const starts=new Map(outer.map(n=>[n.start,n])),parts=[];let start=0,link=0,bracket=0,noMoreGT=false;
        for(let at=0;at<body.length;){
            const range=starts.get(at);if(range){at=range.end;continue;}
            if(body[at]==='<'&&!noMoreGT&&body.indexOf('>',at+1)<0)noMoreGT=true;
            const tag=noMoreGT?null:tagAt(body,at);if(tag){at=tag.end;continue;}
            const two=body.slice(at,at+2);
            if(two==='[['){link++;at+=2;continue;}
            if(two===']]'){if(link)link--;else if(strict)return null;at+=2;continue;}
            if(body[at]==='['&&!link){bracket++;at++;continue;}
            if(body[at]===']'&&!link){if(bracket)bracket--;else if(strict)return null;at++;continue;}
            if(body[at]==='|'&&!link&&!bracket){parts.push({text:body.slice(start,at),start,end:at});start=at+1;}
            at++;
        }
        if(strict&&(link||bracket))return null;
        parts.push({text:body.slice(start),start,end:body.length});return parts;
    }
    function v215TemplatePageContext(cfg={}) {
        const namespace=cfg.namespaceNumber,title=String(cfg.pageTitle||'').replace(/_/g,' ');
        const parts=title.split('/').slice(1),documentation=namespace===10&&parts.some(part=>/^(?:doc|documentação|documentacao)$/i.test(part)),
            test=namespace===10&&parts.some(part=>/^(?:test|tests|teste|testes|testcases|sandbox|rascunho|demonstração|demonstracao)$/i.test(part));
        const kind=namespace===0?'article':namespace===10?test?'test':documentation?'documentation':'definition':'other';
        return {kind,namespace10:namespace===10,definition:kind==='definition',documentation:kind==='documentation',test:kind==='test'};
    }
    function v215TemplateTitle(value) {
        return String(value||'').replace(/_/g,' ').trim().replace(/[ \t]+/g,' ')
            .replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
    }
    function v215SameTemplateTitle(actual,expected) {
        actual=v215TemplateTitle(actual);expected=v215TemplateTitle(expected);
        return !!actual&&!!expected&&actual[0].toLocaleUpperCase('pt')===expected[0].toLocaleUpperCase('pt')&&actual.slice(1)===expected.slice(1);
    }
    const V215_LEGACY_LITERAL_NAMES=Object.freeze({
        'short description':'Short description',shortdescription:'Shortdescription',
        'descricao curta':'Descricao curta',referencias:'Referencias',references:'References'
    });
    function v215LiteralTemplateIdentity(raw,profile=null) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
        const parts=splitParts(raw.slice(2,-2)),literal=parts[0].trim();
        if(!literal||/[{}<>\uE000\r\n]/.test(literal)||literal.startsWith('#')||/^(?:subst|safesubst|int|msg|msgnw|raw)\s*:/i.test(literal))return false;
        const name=nameOf(literal),native=profile||INFOBOX_CATALOG[name]||TEMPLATE_CATALOG[name];
        if(native?.title)return v215SameTemplateTitle(literal,native.title);
        if(isVerifiedReferenceRedirect(literal))return true;
        const obsolete=OBSOLETE_CATALOG[name];
        if(obsolete?.source){
            try{const title=new URL(obsolete.source).searchParams.get('title');if(title)return v215SameTemplateTitle(literal,title);}catch{}
            return false;
        }
        if(V215_LEGACY_LITERAL_NAMES[name])return v215SameTemplateTitle(literal,V215_LEGACY_LITERAL_NAMES[name]);
        const foreign=TRANSLATION_RULES.profiles[name];
        if(foreign){
            const source=String(foreign.source?.title||'').replace(/^[^:]+:/,'');
            if(v215SameTemplateTitle(literal,source))return true;
            // An explicit foreign namespace is part of this finite profile's
            // source identity. Its local name still has to match exactly.
            const prefix=literal.indexOf(':');
            if(prefix>0&&TRANSLATION_RULES.profiles[norm(literal)])return v215SameTemplateTitle(literal.slice(prefix+1),source);
            return v215SameTemplateTitle(literal,name);
        }
        return !!(CITE_NAMES[name]||DIRECT_TEMPLATE_ALIASES[name]||MAINTENANCE[name])&&v215SameTemplateTitle(literal,name);
    }
    function v215TemplateLookupName(raw,normalized) {
        // Keep unknown and calculated names, parser functions and magic words
        // on their existing path. Only a known profile can be disqualified by
        // an unverified internal title case; the original title is never lost.
        if(!normalized||normalized.startsWith('#')||/[{}<>\uE000]/.test(normalized))return normalized;
        const recognized=INFOBOX_CATALOG[normalized]||TEMPLATE_CATALOG[normalized]||CITE_NAMES[normalized]||
            OBSOLETE_CATALOG[normalized]||MAINTENANCE[normalized]||DIRECT_TEMPLATE_ALIASES[normalized]||
            TRANSLATION_RULES.profiles[normalized]||V215_LEGACY_LITERAL_NAMES[normalized];
        return recognized&&!v215LiteralTemplateIdentity(raw)?'unverified-template-title:'+normalized:normalized;
    }
    function v215DefinitionProtectedRanges(source,cfg={}) {
        const context=v215TemplatePageContext(cfg);
        if(context.documentation||context.test)return source.length?[{start:0,end:source.length}]:[];
        if(!context.definition)return [];
        const ranges=[],stack=[];let at=0;
        while(at<source.length){
            if(source.slice(at,at+4)==='<!--'){const end=source.indexOf('-->',at+4);at=end<0?source.length:end+3;continue;}
            const tag=tagAt(source,at);if(!tag){at++;continue;}at=tag.end;
            if(tag.name!=='noinclude'||tag.self)continue;
            if(!tag.close)stack.push(tag);else if(stack.length){const open=stack.pop();if(!stack.length)ranges.push({start:open.start,end:tag.end});}
        }
        if(stack.length)ranges.push({start:stack[0].start,end:source.length});
        return ranges;
    }
