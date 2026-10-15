    // 2.4: bounded syntax repairs. This file is inserted inside RevisaWikiBoot.
    // Every proposal is tied to the exact input; no parser/network state is used.
    const V24_SYNTAX_RENDERERS = new Set(['referências','referencias','reflist','references','notas','notelist','notas e referências']);
    const V24_SYNTAX_CITATIONS = new Set(['citar web','citar livro','citar periódico','citar periodico','citar jornal','citar notícia','citar noticia','citar enciclopédia','citar conferência','citar tese','citar relatório','citar revista','citar vídeo','citar video','cite web','cite book','cite journal','cite news','citation']);
    const V24_SYNTAX_FORMATTING = new Set(['small','sup','sub','span']);
    const V24_SYNTAX_TYPO_TAGS = new Set(['ref','references','small','sup','sub','span']);
    const V24_SYNTAX_LITERAL = new Set(['nowiki','pre','syntaxhighlight','source','code','math','blockquote','q','chem','score','timeline','graph','templatedata','poem','gallery','hiero','imagemap','mapframe','maplink','inputbox','script','style']);
    const V24_SYNTAX_VOID = new Set(['br','hr','img','wbr','meta','link','input','area','base','col','embed','param','track']);
    const V24_SYNTAX_QUOTES = new Set(['quote','quotation','cquote','blockquote','citação','citar','citação em bloco','epígrafe']);
    const v24SyntaxPlanCache=new Map();let v24SyntaxPlanCacheBytes=0;
    function v24SyntaxRemember(plan) {
        const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};freeze(plan);
        const weight=2*(plan.source.length+plan.text.length)+4096+plan.edits.length*1200;
        if(weight<=4194304){const previous=v24SyntaxPlanCache.get(plan.source);if(previous)v24SyntaxPlanCacheBytes-=previous.weight;v24SyntaxPlanCache.delete(plan.source);v24SyntaxPlanCache.set(plan.source,{plan,weight});v24SyntaxPlanCacheBytes+=weight;
            while(v24SyntaxPlanCache.size>8||v24SyntaxPlanCacheBytes>4194304){const first=v24SyntaxPlanCache.keys().next().value;v24SyntaxPlanCacheBytes-=v24SyntaxPlanCache.get(first).weight;v24SyntaxPlanCache.delete(first);}}
        return plan;
    }
    function v24SyntaxName(value) { return String(value).trim().replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('pt').replace(/^(?:predefinição|template)\s*:\s*/,''); }
    function v24SyntaxHash(source) {
        let a=2166136261,b=2246822507;
        for(let i=0;i<source.length;i++){const n=source.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b^n,3266489909);}
        return source.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);
    }
    function v24SyntaxScope(cfg={}) {
        return cfg.syntaxRepairs!==false&&cfg.structuralRepairs!==false&&!cfg.discussionPage&&!cfg.sectionOnly&&
            (cfg.namespaceNumber===undefined||cfg.namespaceNumber===0)&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
    }
    function v24SyntaxTag(source,start) {
        if(source[start]!=='<')return null;
        if(!/^<\s*[/\\]?\s*[a-z][a-z0-9-]*(?=[\s/>])/i.test(source.slice(start,start+128))||/^<\s+[A-Za-z]\s*</.test(source.slice(start,start+40)))return null;
        let quote='',end=start+1;
        for(;end<source.length;end++){const c=source[end];if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='<')return null;else if(c==='>')break;}
        if(end===source.length)return null;
        const raw=source.slice(start,end+1),m=raw.match(/^<\s*([/\\]?)\s*([a-z][a-z0-9-]*)\b([\s\S]*?)>$/i);
        if(!m)return null;
        return {start,end:end+1,raw,name:m[2].toLowerCase(),close:!!m[1],typo:m[1]==='\\',self:/\/\s*>$/.test(raw),attrs:m[3].replace(/\/\s*$/,'')};
    }
    function v24SyntaxAttrs(raw) {
        const result=Object.create(null),re=/\s+([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'|([^\s"'=<>`]+)))/gi;let m,last=0;
        while((m=re.exec(raw))){if(raw.slice(last,m.index).trim())return null;const key=m[1].toLowerCase();if(Object.hasOwn(result,key))return null;result[key]=m[2]??m[3]??m[4];last=re.lastIndex;}
        return raw.slice(last).trim()?null:result;
    }
    function v24SyntaxLiteralIdentity(attrs,requireName=false) {
        if(!attrs||Object.keys(attrs).some(k=>!['name','group'].includes(k)))return false;
        if(requireName&&(!attrs.name||!attrs.name.trim()))return false;
        return Object.values(attrs).every(v=>v.trim()===v&&!/[{}\[\]<>|&\r\n]/.test(v));
    }
    function v24SyntaxMaskRanges(source,ranges) {
        const chars=source.split('');for(const r of ranges)for(let i=r.start;i<r.end;i++)if(chars[i]!=='\n'&&chars[i]!=='\r')chars[i]=' ';return chars.join('');
    }
    function v24SyntaxTemplates(view) {
        const stack=[],nodes=[];
        for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);if(t){i=t.end;continue;}const top=stack.at(-1);
            if(top&&view.slice(i,i+top.size)==='}'.repeat(top.size)){stack.pop();nodes.push({...top,end:i+top.size,depth:stack.length});i+=top.size;}
            else if(view.slice(i,i+3)==='{{{'){stack.push({start:i,size:3});i+=3;}
            else if(view.slice(i,i+2)==='{{'){stack.push({start:i,size:2});i+=2;}else i++;}
        return {nodes,unclosed:stack};
    }
    function v24SyntaxMarkupQuote(view,start,insideRef=false) {
        if(view[start-1]==="'")return null;const open=view.slice(start).match(/^('{2,5})(?!')/);if(!open)return null;
        const stack=[open[1].length];let i=start+open[1].length,content=false;
        for(;i<view.length;){if(/[\r\n]/.test(view[i]))return null;
            if(insideRef&&view[i]==='<'){const tag=v24SyntaxTag(view,i);if(tag?.name==='ref')return null;}
            if(view[i]!=="'"){content=true;i++;continue;}
            let end=i+1;while(view[end]==="'")end++;const size=end-i;
            if(size===1){content=true;i=end;continue;}
            if(size===stack.at(-1)){stack.pop();if(!stack.length)return content?{end}:null;}
            else if(stack.length===1&&[2,3].includes(stack[0])&&[2,3].includes(size))stack.push(size);
            else return null;i=end;
        }
        return null;
    }
    function v24SyntaxProtected(source) {
        const ranges=[],unclosed=[];
        for(let i=0;i<source.length;){if(source.slice(i,i+4)==='<!--'){const at=source.indexOf('-->',i+4),end=at<0?source.length:at+3;const r={start:i,end,kind:'comment'};ranges.push(r);if(at<0)unclosed.push({...r,code:'syntax-opaque-unclosed'});i=end;continue;}
            const t=v24SyntaxTag(source,i);if(t&&!t.close&&V24_SYNTAX_LITERAL.has(t.name)){let end=t.end,closed=t.self;if(!t.self){const re=new RegExp('<\\s*\\/\\s*'+t.name+'\\s*>','gi');re.lastIndex=t.end;const close=re.exec(source);end=close?re.lastIndex:source.length;closed=!!close;}const r={start:i,end,kind:t.name};ranges.push(r);if(!closed)unclosed.push({...r,code:'syntax-opaque-unclosed'});i=end;continue;}i=t?t.end:i+1;}
        let view=v24SyntaxMaskRanges(source,ranges),parsed=v24SyntaxTemplates(view);
        for(const node of [...parsed.nodes,...parsed.unclosed.map(n=>({...n,end:source.length}))]){if(node.size!==2)continue;const name=v24SyntaxName(view.slice(node.start+2,node.end).split(/[|}\n]/,1)[0]);if(V24_SYNTAX_QUOTES.has(name)){ranges.push({start:node.start,end:node.end,kind:'quotation-template'});if(!parsed.nodes.includes(node))unclosed.push({start:node.start,end:node.end,code:'syntax-opaque-unclosed'});}}
        view=v24SyntaxMaskRanges(source,ranges);
        // Attribute quotes are consumed with their tag. Paired prose quotation
        // marks are opaque, including examples containing malformed syntax.
        let quotedRefDepth=0;
        for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);if(t){if(t.name==='ref'&&!t.self){if(t.close&&!t.typo)quotedRefDepth=Math.max(0,quotedRefDepth-1);else if(!t.close)quotedRefDepth++;}i=t.end;continue;}const c=view[i],closer=c==='"'?'"':c==='“'?'”':c==='«'?'»':null;
            if(closer){const at=view.indexOf(closer,i+1),lineStart=view.lastIndexOf('\n',i-1)+1,tableAttribute=/^\{\|/.test(view.slice(lineStart,i))&&/=[ \t]*$/.test(view.slice(lineStart,i));if(tableAttribute&&at>=0){i=at+1;continue;}if(at>=0){ranges.push({start:i,end:at+1,kind:'quotation'});i=at+1;continue;}const r={start:i,end:source.length,kind:'quotation'};ranges.push(r);unclosed.push({...r,code:'syntax-opaque-unclosed'});break;}
            if(view.slice(i,i+2)==="''"){const m=v24SyntaxMarkupQuote(view,i,quotedRefDepth>0);if(m){ranges.push({start:i,end:m.end,kind:'quotation-markup'});i=m.end;continue;}}i++;}
        view=v24SyntaxMaskRanges(source,ranges);parsed=v24SyntaxTemplates(view);
        let offset=0;for(const line of source.match(/[^\n]*(?:\n|$)/g)||[]){if(!line)continue;if(/^[ \t]+\S/.test(line)&&![...parsed.nodes,...parsed.unclosed.map(n=>({...n,end:source.length}))].some(n=>n.start<=offset&&offset<n.end))ranges.push({start:offset,end:offset+line.length,kind:'preformatted'});offset+=line.length;}
        return {view:v24SyntaxMaskRanges(source,ranges),ranges,unclosed};
    }
    function v24SyntaxParts(body) {
        const parts=[],stack=[];let link=0,external=0,start=0;
        for(let i=0;i<body.length;){const t=v24SyntaxTag(body,i);if(t){i=t.end;continue;}const top=stack.at(-1),two=body.slice(i,i+2);
            if(top&&body.slice(i,i+top)==='}'.repeat(top)){stack.pop();i+=top;}
            else if(body.slice(i,i+3)==='{{{'){stack.push(3);i+=3;}
            else if(two==='{{'){stack.push(2);i+=2;}
            else if(two==='[['){link++;i+=2;}else if(two===']]'){if(!link)return null;link--;i+=2;}
            else if(body[i]==='['&&!link){external++;i++;}else if(body[i]===']'&&!link){if(!external)return null;external--;i++;}
            else if(body[i]==='|'&&!stack.length&&!link&&!external){parts.push({text:body.slice(start,i),start,end:i});start=++i;}else i++;}
        if(stack.length||link||external)return null;parts.push({text:body.slice(start),start,end:body.length});return parts;
    }
    function v24SyntaxScan(source) {
        const shield=v24SyntaxProtected(source),view=shield.view,stack=[],links=[],external=[],tables=[],html=[],issues=shield.unclosed.slice(),boundaries=[0],tokens=[];
        const issue=(code,start,end=start+2)=>issues.push({code,start,end});
        for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);if(t){tokens.push({...t,templateDepth:stack.length,tableDepth:tables.length,linkDepth:links.length+external.length});
                if(!V24_SYNTAX_VOID.has(t.name)&&!t.self){if(!t.close){if(t.name==='ref'&&html.some(x=>x.name==='ref'))issue('syntax-nested-ref',t.start,t.end);html.push(t);}else if(html.at(-1)?.name===t.name&&!t.typo&&!t.attrs.trim())html.pop();else issue('syntax-stray-tag',t.start,t.end);}i=t.end;continue;}
            const two=view.slice(i,i+2),top=stack.at(-1);
            if(top&&view.slice(i,i+top.size)==='}'.repeat(top.size)){stack.pop();i+=top.size;}
            else if(view.slice(i,i+3)==='{{{'){stack.push({start:i,size:3});i+=3;}
            else if(two==='{{'){stack.push({start:i,size:2});i+=2;}
            else if(two==='}}'){issue('syntax-stray-template-close',i);i+=2;}
            else if(two==='[['){links.push(i);i+=2;}else if(two===']]'){if(links.length)links.pop();else issue('syntax-stray-link-close',i);i+=2;}
            else if(view[i]==='['&&!links.length&&/^(?:https?:|\/\/)/i.test(view.slice(i+1))){external.push(i++);}
            else if(view[i]===']'&&external.length){external.pop();i++;}
            else if(two==='{|'&&/^[ \t]*$/.test(view.slice(view.lastIndexOf('\n',i-1)+1,i))){tables.push(i);i+=2;}
            else if(two==='|}'&&/^[ \t]*$/.test(view.slice(view.lastIndexOf('\n',i-1)+1,i))){if(tables.length)tables.pop();else issue('syntax-stray-table-close',i);i+=2;}
            else {if(view[i]==='<'&&/^<\s*[/\\]?\s*(?:ref|references|small|span|sup|sub)\b/i.test(view.slice(i)))issue('syntax-malformed-tag',i);if(view[i]==='\n'&&!stack.length&&!links.length&&!external.length&&!tables.length&&!html.length)boundaries.push(i+1);i++;}}
        stack.forEach(t=>issue('syntax-unclosed-template',t.start));links.forEach(t=>issue('syntax-unclosed-link',t));external.forEach(t=>issue('syntax-unclosed-external',t));tables.forEach(t=>issue('syntax-unclosed-table',t));html.forEach(t=>issue('syntax-unclosed-tag',t.start,t.end));
        if(!issues.length)boundaries.push(source.length);
        return {view,shield,issues:issues.sort((a,b)=>a.start-b.start||a.end-b.end),boundaries,tokens,tables,html,templates:stack,links,external};
    }
    function v24SyntaxContext(view,at) {
        const scan=v24SyntaxScan(view.slice(0,at));return {templates:scan.templates,html:scan.html,tables:scan.tables,links:scan.links,external:scan.external};
    }
    function v24SyntaxBodySafe(raw,allowFormatting=false) {
        if(!raw.trim()||/\{\{\{|\{\{\s*(?:#|subst\s*:|safesubst\s*:)|<\s*[/\\]?\s*(?:ref|references)\b/i.test(raw))return false;
        const s=v24SyntaxScan(raw);
        if(s.issues.some(i=>!(allowFormatting&&i.code==='syntax-unclosed-tag'&&V24_SYNTAX_FORMATTING.has(s.html.find(t=>t.start===i.start)?.name))))return false;
        return !s.templates.length&&!s.links.length&&!s.external.length&&!s.tables.length&&(!s.html.length||allowFormatting&&s.html.every(t=>V24_SYNTAX_FORMATTING.has(t.name)));
    }
    function v24SyntaxProof(ruleId,conditions,extra={}) { return {ruleId,conditions,...extra}; }
    function v24SyntaxTagEdits(source) {
        const scan=v24SyntaxScan(source),edits=[],html=[];
        for(const t of scan.tokens){if(V24_SYNTAX_VOID.has(t.name)||t.self)continue;if(!t.close){html.push(t);continue;}const top=html.at(-1);
            if(!top||top.name!==t.name||t.attrs.trim())continue;if(!t.typo){html.pop();continue;}
            if(!V24_SYNTAX_TYPO_TAGS.has(t.name)||t.templateDepth||t.tableDepth||t.linkDepth||/[{}]/.test(top.attrs)||t.name==='ref'&&html.filter(x=>x.name==='ref').length!==1||/\{\{\{|\{\{\s*(?:#|subst\s*:|safesubst\s*:)/i.test(source.slice(top.end,t.start)))continue;
            if(html.filter(x=>x.name===t.name).length===1&&v24SyntaxFutureClose(scan.view,t.end,t.name))continue;
            const slash=t.start+t.raw.indexOf('\\');edits.push({start:slash,end:slash+1,text:'/',ruleId:'syntaxTagTypos',proof:v24SyntaxProof('syntaxTagTypos',['finite closing-tag typo','matching innermost explicit opening','no attributes or dynamic container'],{tag:t.name,openingStart:top.start})});html.pop();}
        return edits;
    }
    function v24SyntaxTemplateProfile(body) {
        if(/[{}<>\uE000]/.test(body))return null;const parts=v24SyntaxParts(body);if(!parts)return null;
        const name=v24SyntaxName(parts[0].text),args=parts.slice(1).map(p=>p.text.trim());
        if(V24_SYNTAX_RENDERERS.has(name)){
            if(!args.every((arg,i)=>/^\d{1,2}$/.test(arg)&&i===0||/^(?:colunas|cols|columns)\s*=\s*\d{1,2}$/i.test(arg)||/^(?:grupo|group)\s*=\s*[^|=<>\[\]{}\r\n]+$/i.test(arg)||/^(?:nível|nivel)\s*=\s*0$/i.test(arg)||/^(?:largura|width)\s*=\s*\d{1,3}(?:em|px|%)$/i.test(arg)))return null;
            return {name,kind:'reference-renderer'};
        }
        if(V24_SYNTAX_CITATIONS.has(name)){
            if(!args.length)return null;const seen=new Set();for(const arg of args){const m=arg.match(/^([^=\n]+)=([\s\S]*)$/);if(!m||!m[2].trim())return null;const key=v24SyntaxName(m[1]);if(!/^[\p{L}\d _-]+$/u.test(key)||seen.has(key))return null;seen.add(key);}
            if(![...seen].some(k=>/^(?:url|título|titulo|title|doi|isbn|obra|work|jornal|periódico|periodico|livro|book-title)$/.test(k)))return null;
            return {name,kind:'citation'};
        }
        if(['portal','portal2'].includes(name)&&args.length>0&&args.length<=6&&args.every(a=>/^[\p{L}\p{N} _.-]+$/u.test(a)))return {name,kind:'literal-portals'};
        if(['small','pequeno','grande','nowrap','nobr','nobreak'].includes(name)&&args.length===1&&args[0]&&!/[=\[\]{}<>\r\n]/.test(args[0]))return {name,kind:'literal-formatting'};
        if(name==='dni'&&args.length===3&&args.every(a=>/^\d+$/.test(a))){const [d,m,y]=args.map(Number),date=new Date(0);date.setUTCFullYear(y,m-1,d);if(y>0&&m>=1&&m<=12&&d>=1&&d<=31&&date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d)return {name,kind:'literal-date'};}
        return null;
    }
    function v24SyntaxTemplateEdits(source) {
        const shield=v24SyntaxProtected(source),view=shield.view,edits=[],re=/\{\{([^{}]*?)(\]\]|\})(?=[ \t]*(?:<\s*[/\\]\s*(?:ref|references)\s*>|\r?$))/gm;let m;
        while((m=re.exec(view))){const start=m.index,end=re.lastIndex,body=m[1],profile=v24SyntaxTemplateProfile(body);if(!profile)continue;
            if(shield.ranges.some(r=>r.start<end&&r.end>start))continue;
            const prefix=v24SyntaxApply(view.slice(0,start),edits),context=v24SyntaxContext(prefix,prefix.length);if(context.templates.length||context.tables.length||context.links.length||context.external.length||context.html.some(t=>!['ref','references'].includes(t.name)))continue;
            const lineStart=view.lastIndexOf('\n',start-1)+1,before=view.slice(lineStart,start),refPrefix=/^\s*(?:<\s*references\b[^>]*>\s*)?<\s*ref\b[^>]*>\s*$/i.test(before);
            const refBodyStart=profile.kind==='citation'&&context.html.at(-1)?.name==='ref'&&!prefix.slice(context.html.at(-1).end).trim()&&context.html.filter(t=>t.name==='ref').length===1;
            if(before.trim()&&!refPrefix&&!refBodyStart)continue;
            const suffix=view.slice(end).match(/^[ \t]*/)[0].length,follow=v24SyntaxTag(view,end+suffix),inline=!!follow&&follow.close&&['ref','references'].includes(follow.name);
            if(inline&&profile.kind!=='citation')continue;
            if(inline&&follow.name==='references'&&!(context.html.at(-1)?.name==='ref'&&context.html.at(-2)?.name==='references'))continue;
            if(body.includes('\n')&&body.trim().split(/\r?\n/).slice(1).some(line=>line.trim()&&!/^\s*\|/.test(line)))continue;
            const bad=m[2],at=end-bad.length;edits.push({start:bad==='}'?end:at,end:bad==='}'?end:end,text:bad==='}'?'}':'}}',ruleId:'syntaxTemplateClosers',proof:v24SyntaxProof('syntaxTemplateClosers',['finite template profile','isolated line or complete citation at explicit ref boundary','literal balanced fields','single minimum closing-token repair'],{template:profile.name,profile:profile.kind})});
        }
        return edits;
    }
    function v24SyntaxRendererContext(source,at,templates) {
        const ancestors=templates.nodes.filter(n=>n.size===2&&n.start<at&&at<n.end).sort((a,b)=>a.start-b.start);
        if(templates.unclosed.some(n=>n.start<at)||ancestors.length>1)return {valid:false,group:''};if(!ancestors.length)return {valid:true,group:''};
        const n=ancestors[0],parts=v24SyntaxParts(source.slice(n.start+2,n.end-2));if(!parts||!V24_SYNTAX_RENDERERS.has(v24SyntaxName(parts[0].text)))return {valid:false,group:''};
        let group='',groupSeen=false,found=false;for(const part of parts.slice(1)){const m=part.text.match(/^\s*([^=]+)=([\s\S]*)$/);if(!m)return {valid:false,group:''};const key=v24SyntaxName(m[1]);if(['group','grupo'].includes(key)){if(groupSeen||/[{}<>\[\]|&\r\n]/.test(m[2]))return {valid:false,group:''};groupSeen=true;group=m[2].trim();}const valueAt=n.start+2+part.start+part.text.indexOf('=')+1;if(key==='refs'&&valueAt<=at&&at<n.start+2+part.end)found=true;}
        return {valid:found,group};
    }
    function v24SyntaxReferences(source) {
        const shield=v24SyntaxProtected(source),view=shield.view,templates=v24SyntaxTemplates(view),refs=[],empties=[],containers=[],unclosed=[];let active=null;
        for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);if(!t){i++;continue;}i=t.end;
            if(t.name==='references'){
                if(!t.close&&!t.self){const attrs=v24SyntaxAttrs(t.attrs);containers.push({...t,attrs,valid:!!attrs&&Object.keys(attrs).every(k=>['group','responsive'].includes(k))&&Object.values(attrs).every(v=>!/[{}<>\[\]|&\r\n]/.test(v))});}
                else if(t.close&&!t.typo){const c=containers.at(-1);if(active&&c&&active.container===c){unclosed.push({...active,boundary:t,container:c});active=null;}if(c)containers.pop();}continue;}
            if(t.name!=='ref')continue;
            if(t.close){if(active&&!t.typo&&!t.attrs.trim()){refs.push({...active,end:t.end,close:t,body:source.slice(active.end,t.start)});active=null;}continue;}
            const attrs=v24SyntaxAttrs(t.attrs),renderer=v24SyntaxRendererContext(view,t.start,templates),container=containers.at(-1),group=attrs?.group??(container?.attrs?.group??renderer.group??'');
            if(active){if(!source.slice(active.end,t.start).trim())empties.push({...active,next:t});else unclosed.push({...active,boundary:null});active=null;}
            const item={...t,attrs,renderer,container,group,valid:v24SyntaxLiteralIdentity(attrs)&&renderer.valid};if(t.self)refs.push({...item,body:null,close:null});else active=item;
        }
        if(active)unclosed.push({...active,boundary:null,eof:true});return {shield,view,templates,refs,empties,unclosed};
    }
    function v24SyntaxReferenceEdits(source,cfg) {
        const parsed=v24SyntaxReferences(source),edits=[],defs=new Map(),ambiguous=new Set(),ambiguousNames=new Set(),key=r=>(r.group||'')+'\u0000'+(r.attrs?.name||'');
        let dynamicIdentity=false;for(const r of [...parsed.refs,...parsed.empties,...parsed.unclosed]){if(!r.attrs&&/\b(?:name|group)\s*=.*[{}]/i.test(r.attrs??r.raw))dynamicIdentity=true;if(r.attrs?.name&&(!r.renderer.valid||!v24SyntaxLiteralIdentity(r.attrs)))ambiguousNames.add(r.attrs.name);if(/[{}]/.test(r.attrs?.name||''))dynamicIdentity=true;}
        for(const r of parsed.refs){if(!r.attrs?.name||r.body===null||!r.body.trim())continue;const k=key(r);if(!r.valid||!v24SyntaxBodySafe(r.body))ambiguous.add(k);else{if(!defs.has(k))defs.set(k,[]);defs.get(k).push(r);}}
        for(const r of parsed.unclosed)if(r.attrs?.name)ambiguous.add(key(r));
        for(const r of parsed.empties){const k=key(r),matches=defs.get(k)||[];if(dynamicIdentity||!r.valid||!v24SyntaxLiteralIdentity(r.attrs,true)||ambiguous.has(k)||ambiguousNames.has(r.attrs.name)||matches.length!==1)continue;
            edits.push({start:r.end-1,end:r.end-1,text:'/',ruleId:'syntaxNamedRefReuse',proof:v24SyntaxProof('syntaxNamedRefReuse',['literal empty opening immediately before next ref','one nonconflicting closed definition in same effective group','no follow or dynamic identity','no content removed'],{name:r.attrs.name,group:r.group,definitionStart:matches[0].start,nextRefStart:r.next.start,inventory:{definitions:matches.length,namedRefs:parsed.refs.filter(x=>x.attrs?.name).length,anonymousRefs:parsed.refs.filter(x=>!x.attrs?.name).length,emptyOpenings:parsed.empties.length}})});}
        for(const r of parsed.unclosed){if(!r.valid||!v24SyntaxLiteralIdentity(r.attrs)||!r.renderer.valid)continue;
            if(r.boundary){if(!r.container.valid||r.group!==(r.container.attrs.group||'')||!v24SyntaxBodySafe(source.slice(r.end,r.boundary.start))||v24SyntaxFutureClose(parsed.view,r.boundary.end,'ref'))continue;
                edits.push({start:r.boundary.start,end:r.boundary.start,text:'</ref>',ruleId:'syntaxReferenceClosers',proof:v24SyntaxProof('syntaxReferenceClosers',['matching explicit references container','entire nonempty body balanced','no nested ref or dynamic identity','no content removed'],{openingStart:r.start,containerStart:r.container.start,boundary:'explicit-references-close'})});}
            else if(r.eof&&!cfg.sectionOnly&&!r.container){const raw=source.slice(r.end),trimmed=raw.trim();if(!v24SyntaxBodySafe(raw)||parsed.shield.unclosed.some(x=>x.start>=r.end))continue;
                const literalOneLine=!/[\r\n]/.test(trimmed)&&!/^\s*(?:[=*#:;]|\{\||\|)/.test(trimmed),parts=v24SyntaxTemplates(trimmed),oneCitation=parts.unclosed.length===0&&parts.nodes.length===1&&parts.nodes[0].start===0&&parts.nodes[0].end===trimmed.length&&V24_SYNTAX_CITATIONS.has(v24SyntaxName(trimmed.slice(2,-2).split('|',1)[0]));
                if(!literalOneLine&&!oneCitation)continue;
                edits.push({start:source.length,end:source.length,text:'</ref>',ruleId:'syntaxReferenceClosers',proof:v24SyntaxProof('syntaxReferenceClosers',['true whole-page EOF','single literal paragraph or one complete citation','entire body balanced','no content removed'],{openingStart:r.start,boundary:'true-eof'})});}}
        return edits;
    }
    function v24SyntaxFutureClose(view,after,name) {
        for(let i=after;i<view.length;){const t=v24SyntaxTag(view,i);if(!t){i++;continue;}i=t.end;if(t.name===name&&!t.self)return t.close;}return false;
    }
    function v24SyntaxFormattingEdits(source) {
        const parsed=v24SyntaxReferences(source),edits=[];
        for(const r of parsed.refs){if(!r.close||!r.valid||!v24SyntaxBodySafe(r.body,true))continue;
            const scan=v24SyntaxScan(r.body),open=scan.html;if(!open.length||!open.every(t=>V24_SYNTAX_FORMATTING.has(t.name)))continue;
            if(open.some(t=>v24SyntaxFutureClose(parsed.view,r.close.end,t.name)))continue;
            const text=open.slice().reverse().map(t=>'</'+t.name+'>').join('');edits.push({start:r.close.start,end:r.close.start,text,ruleId:'syntaxFormattingClosers',proof:v24SyntaxProof('syntaxFormattingClosers',['formatting opened wholly inside closed ref','only finite formatting tags remain open','proper reverse nesting','no corresponding later outside closer'],{refStart:r.start,tags:open.map(t=>t.name)})});}
        return edits;
    }
    function v24SyntaxTableCells(raw,delimiter) {
        if(/[{}<>]/.test(raw))return null;let view=raw,link=0,external=0;const chars=view.split('');for(let i=0;i<view.length;){if(view.slice(i,i+2)==='[['){link++;chars[i]=chars[i+1]=' ';i+=2;continue;}if(view.slice(i,i+2)===']]'){if(!link)return null;link--;chars[i]=chars[i+1]=' ';i+=2;continue;}if(view[i]==='['&&!link){external++;chars[i++]=' ';continue;}if(view[i]===']'&&!link){if(!external)return null;external--;chars[i++]=' ';continue;}if(link||external)chars[i]=' ';i++;}if(link||external)return null;
        view=chars.join('');const split=delimiter==='!'?'!!':'||',cells=view.split(split);let at=0;for(const cell of cells){if(/[|!]/.test(cell)||!raw.slice(at,at+cell.length).trim())return null;at+=cell.length+split.length;}return cells.length;
    }
    function v24SyntaxTableEdits(source,cfg) {
        if(cfg.sectionOnly)return [];const scan=v24SyntaxScan(source);if(scan.tables.length!==1||scan.issues.some(i=>i.code!=='syntax-unclosed-table'))return [];
        const start=scan.tables[0],context=v24SyntaxContext(source,start);if(context.templates.length||context.html.length||context.links.length||context.external.length||context.tables.length)return [];
        const raw=source.slice(start);if(scan.shield.ranges.some(r=>r.start<source.length&&r.end>start)||/\{\{|\}\}|\{\|/g.test(raw.slice(2)))return [];
        const lines=raw.split(/\r?\n/),head=lines.shift();if(!/^\{\|(?:\s+[\s\S]*)?$/.test(head))return [];
        const attrs=v24SyntaxAttrs(head.slice(2));if(!attrs||Object.keys(attrs).some(k=>!['class','style','border','cellpadding','cellspacing','width','align'].includes(k))||Object.values(attrs).some(v=>/[{}<>\[\]|]/.test(v)))return [];
        const rows=[];let cells=0,kind='',caption=false,seenCell=false,lastSeparator=false;
        for(const line of lines){if(!line.trim())continue;if(/^\|-\s*$/.test(line)){if(cells){rows.push(cells);cells=0;kind='';}else if(lastSeparator)return [];lastSeparator=true;continue;}
            if(/^\|\+/.test(line)){if(caption||seenCell||!line.slice(2).trim()||/[{}<>|]/.test(line.slice(2)))return [];caption=true;continue;}
            if(!/^[!|]/.test(line)||/^\|[}+]/.test(line))return [];const type=line[0];if(kind&&kind!==type)return [];kind=type;const n=v24SyntaxTableCells(line.slice(1),type);if(n===null)return [];cells+=n;seenCell=true;lastSeparator=false;}
        if(lastSeparator||!cells)return [];rows.push(cells);if(!rows.length||rows.some(n=>n!==rows[0]))return [];
        const newline=source.includes('\r\n')?'\r\n':'\n',text=/(?:\r?\n)$/.test(source)?'|}':newline+'|}';return [{start:source.length,end:source.length,text,ruleId:'syntaxTableClosers',proof:v24SyntaxProof('syntaxTableClosers',['true whole-page EOF','one literal top-level table','regular nonempty grid','no nested or dynamic content','no prose after rows'],{tableStart:start,rows:rows.length,columns:rows[0]})}];
    }
    function v24SyntaxApply(source,edits) {
        let out='',last=0;for(const e of edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end)){if(e.start<last||e.start<0||e.end<e.start||e.end>source.length)throw new Error('Invalid syntax repair spans');out+=source.slice(last,e.start)+e.text;last=e.end;}return out+source.slice(last);
    }
    function syntaxRepairPlan(source,cfg={}) {
        if(typeof source!=='string')throw new TypeError('O texto precisa ser uma string.');const sourceHash=v24SyntaxHash(source),base={source,sourceHash,proof:{source,sourceHash,version:'2.4'},edits:[],findings:[],text:source,unresolved:[],safePrefixEnd:0,repairedPrefixEnd:0};
        if(!v24SyntaxScope(cfg))return {...base,disabled:true};
        const cached=v24SyntaxPlanCache.get(source);if(cached){v24SyntaxPlanCache.delete(source);v24SyntaxPlanCache.set(source,cached);return cached.plan;}
        const initialScan=v24SyntaxScan(source);if(!initialScan.issues.length)return v24SyntaxRemember({...base,safePrefixEnd:source.length,repairedPrefixEnd:source.length});
        let current=source,origins=Array.from({length:source.length},(_,i)=>i),owners=Array(source.length).fill(null);
        const stage=edits=>{if(!edits.length)return;const ordered=edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end),newOrigins=[],newOwners=[],pieces=[];
            const originalAt=at=>{while(at<origins.length&&origins[at]<0)at++;return origins[at]??source.length;};let last=0;
            for(const e of ordered){if(e.start<last)continue;const proof={...e.proof,span:{start:originalAt(e.start),end:originalAt(e.end)}};for(const k of ['openingStart','definitionStart','nextRefStart','containerStart','tableStart','refStart'])if(Number.isInteger(proof[k]))proof[k]=originalAt(proof[k]);const owner={...e,proof};
                pieces.push(current.slice(last,e.start),e.text);for(let i=last;i<e.start;i++){newOrigins.push(origins[i]);newOwners.push(owners[i]);}for(let i=0;i<e.text.length;i++){newOrigins.push(-1);newOwners.push(owner);}last=e.end;}
            pieces.push(current.slice(last));for(let i=last;i<current.length;i++){newOrigins.push(origins[i]);newOwners.push(owners[i]);}current=pieces.join('');origins=newOrigins;owners=newOwners;};
        stage(v24SyntaxTagEdits(current));stage(v24SyntaxTemplateEdits(current));stage(v24SyntaxTagEdits(current));stage(v24SyntaxReferenceEdits(current,cfg));stage(v24SyntaxFormattingEdits(current));stage(v24SyntaxReferenceEdits(current,cfg));stage(v24SyntaxTableEdits(current,cfg));
        const edits=[];let cursor=0,text='',proofs=[];
        const emit=end=>{if(text||end>cursor){const unique=[...new Set(proofs)],ruleIds=[...new Set(unique.map(e=>e.ruleId))];edits.push({start:cursor,end,text,ruleId:ruleIds[0],ruleIds,proof:{sourceHash,before:source.slice(cursor,end),rules:unique.map(e=>({...e.proof,sourceHash}))}});}text='';proofs=[];};
        for(let i=0;i<current.length;i++){if(origins[i]>=0){emit(origins[i]);cursor=origins[i]+1;}else{text+=current[i];if(owners[i])proofs.push(owners[i]);}}emit(source.length);
        let scan=v24SyntaxScan(current);
        // Closing one scope must never strand another token that was previously
        // paired. Positions of surviving tokens are mapped to the input.
        const originalIssues=new Set(initialScan.issues.map(i=>i.code+':'+i.start));
        if(scan.issues.some(issue=>{let at=issue.start;while(at<origins.length&&origins[at]<0)at++;return !originalIssues.has(issue.code+':'+(origins[at]??source.length));})){
            const first=initialScan.issues[0]?.start??source.length,cut=initialScan.boundaries.filter(n=>n<=first).at(-1)||0;
            return v24SyntaxRemember({...base,unresolved:initialScan.issues,safePrefixEnd:cut,repairedPrefixEnd:cut});
        }
        if(scan.issues.length){const first=scan.issues[0].start,cut=scan.boundaries.filter(n=>n<=first).at(-1)||0;let originalCut=source.length;for(let i=cut;i<origins.length;i++)if(origins[i]>=0){originalCut=origins[i];break;}
            const retained=edits.filter(e=>e.end<=originalCut&&e.start<originalCut);if(retained.length!==edits.length){current=v24SyntaxApply(source,retained);edits.splice(0,edits.length,...retained);scan=v24SyntaxScan(current);}}
        const first=scan.issues[0]?.start??current.length,repairedPrefixEnd=scan.boundaries.filter(n=>n<=first).at(-1)||0;let safePrefixEnd=repairedPrefixEnd;
        for(const e of edits){if(e.start<safePrefixEnd)safePrefixEnd-=e.text.length-(e.end-e.start);}
        if(!scan.issues.length){safePrefixEnd=source.length;}
        if(source.slice(safePrefixEnd)!==current.slice(repairedPrefixEnd)&&scan.issues.length){safePrefixEnd=0;}
        const findings=edits.map(e=>({code:e.ruleId,start:e.start,end:e.end,severity:'information',ruleIds:e.ruleIds,proof:e.proof}));
        return v24SyntaxRemember({source,sourceHash,proof:base.proof,edits,findings,text:current,unresolved:scan.issues,safePrefixEnd,repairedPrefixEnd});
    }
    function automaticSyntaxRepairs(source,cfg={},bump=()=>{},warn=()=>{}) {
        const plan=syntaxRepairPlan(source,cfg);for(const e of plan.edits)for(const id of e.ruleIds)bump(id);
        if(plan.edits.length&&plan.unresolved.length)warn('Os reparos de sintaxe ficaram limitados ao trecho completo anterior à cauda sem fechamento.');return plan.text;
    }
    function syntaxRepairPrefix(source,cfg={}) {
        const plan=syntaxRepairPlan(source,cfg);return {text:plan.text,prefix:plan.text.slice(0,plan.repairedPrefixEnd),end:plan.safePrefixEnd,repairedEnd:plan.repairedPrefixEnd,tail:source.slice(plan.safePrefixEnd),plan,unresolved:plan.unresolved};
    }
    function syntaxRepairEquivalence(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||plan.proof?.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const regenerated=syntaxRepairPlan(before,cfg);return regenerated.text===after&&plan.text===after&&JSON.stringify(regenerated.edits)===JSON.stringify(plan.edits);
    }
    function syntaxRepairEquivalenceSource(source,cfg={}) { return syntaxRepairPlan(source,cfg).text; }
