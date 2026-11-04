    // Layout repairs operate on complete top-level owners and retain native templates.
    function v2216LayoutHash(source) {return v24SyntaxHash(source);}
    function v2216LayoutName(raw) {
        const p=parsedTemplate(raw);return p?p.parts[0].trim().replace(/^(?:Predefinição|Template|PRE)\s*:/i,'').replace(/_/g,' '):'';
    }
    function v2216LayoutNamed(raw,names) {const name=v2216LayoutName(raw);return names.some(target=>v215SameTemplateTitle(name,target));}
    function v2216LayoutIdentity(raw) {
        return v2216LayoutName(raw).normalize('NFC').toLocaleLowerCase('pt');
    }
    function v2216LayoutSortOwner(raw) {
        if(/^\{\{\s*(?:DEFAULTSORT|DEFAULTSORTKEY|DEFAULTCATEGORYSORT|ORDENAÇÃO|ORDENACAO)\s*:/i.test(raw))return 'sort';
        return v2216LayoutNamed(raw,['NM','NF'])?'composite':null;
    }
    function v2216LayoutLiteralComposite(raw) {
        if(!v2216LayoutNamed(raw,['NM','NF']))return null;
        const slots=v2216LayoutSlots(raw),p=parsedTemplate(raw);
        if(!slots||slots.size!==3||!['1','2','3'].every(k=>slots.has(k))||!slots.get('3').trim()||
            [...slots.values()].some(value=>/[{}[\]<>\r\n]/.test(value)))return null;
        return p.parts.slice(1).join('|');
    }
    function v2216LayoutPureProgram(raw) {
        const name=v2216LayoutName(raw),p=parsedTemplate(raw);
        if(['!','='].includes(name)||/^(?:BASEPAGENAME|PAGENAME|FULLPAGENAME|SUBPAGENAME|NAMESPACE|NAMESPACENUMBER|TALKPAGENAME|SUBJECTPAGENAME|SITENAME)$/.test(name))return p.parts.length===1;
        if(v2216LayoutNamed(raw,['Colunas-lista','Colunas','Div col','Div col end','Divcol','Divcol end']))return true;
        const literalFamily=v2216LayoutNamed(raw,['Portal','Portal2','Portal3','Controle de autoridade','Controlo de autoridade','Authority control','Authority Control','Controle de autoriade','Artigo bom','Artigo destacado','Featured article'])||
            v2216LayoutSister(raw)||v2216LayoutNamed(raw,['Commonscat em linha','Commonscat-inline','Commons em linha','Commons-inline','Wikisource-inline','Wikiquote em linha','Wikiquote-inline','Wikcionário em linha','Wikivoyage em linha']);
        if(!literalFamily||/[<>]/.test(raw))return false;
        const children=templates(raw).nodes.filter(n=>n.depth>0);
        if(children.some(n=>!/^\{\{(?:BASEPAGENAME|PAGENAME|FULLPAGENAME|SUBPAGENAME)\}\}$/.test(raw.slice(n.start,n.end))))return false;
        const rest=children.reduceRight((text,node)=>text.slice(0,node.start)+text.slice(node.end),raw);
        return !/[{}]/.test(rest.slice(2,-2));
    }
    function v2216LayoutSortEvents(source) {
        const events=[];
        // Raw nested programs are inspected even inside quotations or extension
        // bodies. Inactive examples can conservatively prevent a relocation.
        for(const node of templates(source).nodes){
            const raw=source.slice(node.start,node.end),owner=v2216LayoutSortOwner(raw);
            if(!owner&&v2216LayoutPureProgram(raw))continue;
            const literal=owner==='composite'?v2216LayoutLiteralComposite(raw):owner==='sort'&&v219LiteralDefaultSortCall(raw)?raw:null;
            events.push({start:node.start,end:node.end,kind:owner||'opaque-template',signature:literal===null?raw:owner==='composite'?'{{NM|'+literal+'}}':literal,idempotent:literal!==null});
        }
        const html=new Set(['a','abbr','b','bdi','bdo','big','blockquote','br','caption','center','cite','code','dd','del','div','dl','dt','em','font','h1','h2','h3','h4','h5','h6','hr','i','ins','li','ol','p','q','rp','rt','ruby','s','small','span','strong','sub','sup','table','tbody','td','tfoot','th','thead','tr','u','ul','wbr']);
        for(const match of source.matchAll(/<\/?([A-Za-z][\w:-]*)\b[^<>]*>/g))if(!html.has(match[1].toLowerCase()))events.push({start:match.index,end:match.index+match[0].length,kind:'opaque-extension',signature:match[0],idempotent:false});
        events.sort((a,b)=>a.start-b.start||b.end-a.end);
        return events;
    }
    function v2216LayoutReducedSortEvents(source) {
        const out=[];
        for(const event of v2216LayoutSortEvents(source)){
            const previous=out.at(-1);
            if(previous&&previous.idempotent&&event.idempotent&&previous.signature===event.signature){out[out.length-1]=event;continue;}
            out.push(event);
        }
        return out.map(({kind,signature})=>({kind,signature}));
    }
    function v2216LayoutSortWitness(before,after) {
        const original=v2216LayoutReducedSortEvents(before),candidate=v2216LayoutReducedSortEvents(after),a=JSON.stringify(original),b=JSON.stringify(candidate);
        return {accepted:a===b,sourceHash:v24SyntaxHash(before),candidateHash:v24SyntaxHash(after),
            sourceEventCount:original.length,candidateEventCount:candidate.length,
            sourceEventHash:v24SyntaxHash(a),candidateEventHash:v24SyntaxHash(b)};
    }
    function v2216LayoutCategoryGaps(source) {
        const view=scanProtectedView(source),edits=[],categories=[];
        for(const match of view.matchAll(/^[ \t]*\[\[(?:Categoria|Category):[^{}\[\]\r\n]+\]\][ \t]*\r?$/gmi)){
            const context=v24SyntaxContext(view,match.index);if(context.templates.length||context.html.length||context.tables.length||context.links.length||context.external.length)continue;
            categories.push({start:match.index,end:match.index+match[0].length});
        }
        for(let i=1;i<categories.length;i++){
            const start=categories[i-1].end,end=categories[i].start,gap=source.slice(start,end);
            if(/^\r?\n(?:[ \t]*\r?\n)+$/.test(gap))edits.push({start,end,text:source.includes('\r\n')?'\r\n':'\n',kind:'literal-category-gap',count:1});
        }return edits;
    }
    function v2216LayoutGuardedEdits(source,edits,kind) {
        if(!edits.length)return {text:source,edits:[],sortWitness:null};
        const text=v24SyntaxApply(source,edits),witness=v2216LayoutSortWitness(source,text);
        if(witness.accepted)return {text,edits,sortWitness:witness};
        if(kind==='metadata'){
            const fallback=v2216LayoutCategoryGaps(source),candidate=v24SyntaxApply(source,fallback),proof=v2216LayoutSortWitness(source,candidate);
            return proof.accepted?{text:candidate,edits:fallback,sortWitness:proof}:{text:source,edits:[],sortWitness:v2216LayoutSortWitness(source,source)};
        }
        const groups=new Map();
        for(const edit of edits){const key=edit.kind?.startsWith('authority-before-portals')?'authority-before-portals':edit.kind?.startsWith('sister-project-box-')?'sister-project-box':edit.kind||'other';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(edit);}
        const accepted=[];
        for(const group of groups.values()){
            const proposed=[...accepted,...group].sort((a,b)=>a.start-b.start||a.end-b.end);if(proposed.some((e,i)=>i&&e.start<proposed[i-1].end))continue;
            if(v2216LayoutSortWitness(source,v24SyntaxApply(source,proposed)).accepted)accepted.push(...group);
        }
        accepted.sort((a,b)=>a.start-b.start||a.end-b.end);const candidate=v24SyntaxApply(source,accepted);
        return {text:candidate,edits:accepted,sortWitness:v2216LayoutSortWitness(source,candidate)};
    }
    function v2216ObsoleteOwnerRemovalAllowed(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
        const name=parsedTemplate(raw).name;
        if(!['descrição curta','descricao curta','short description','shortdescription','sem interwiki','seminterwiki','sem interwikis'].includes(name))return false;
        // The approved obsolete owner can disappear. Nested calls are separate
        // programs and remain protected even when their output is not visible.
        for(const node of templates(raw).nodes){
            if(node.start===0&&node.end===raw.length)continue;
            const child=raw.slice(node.start,node.end),p=parsedTemplate(child),header=p.parts[0].trim();
            if(p.parts.length!==1||!(/^(?:BASEPAGENAME|PAGENAME|FULLPAGENAME|SUBPAGENAME|NAMESPACE|NAMESPACENUMBER|TALKPAGENAME|SUBJECTPAGENAME|SITENAME)$/.test(header)||['!','='].includes(header)))return false;
        }
        if(/<\/?[A-Za-z][^<>]*>|\[\[\s*:?(?:Categoria|Category|Ficheiro|Imagem|Arquivo|File|Image)\s*:|__[^_\r\n]+__|\{\||\{\{\{/i.test(raw))return false;
        return true;
    }
    function v2216LayoutSafeRemovals(source,removals) {
        const accepted=[];
        for(const removal of [...removals].sort((a,b)=>b.start-a.start)){
            const next=[...accepted,removal].sort((a,b)=>a.start-b.start||a.end-b.end);
            if(next.some((r,i)=>i&&r.start<next[i-1].end))continue;
            if(v2216LayoutSortWitness(source,v24SyntaxApply(source,next.map(r=>({...r,text:''})))).accepted)accepted.push(removal);
        }
        return accepted.sort((a,b)=>a.start-b.start||a.end-b.end);
    }
    function structuralArticlePlan(source,cfg={}) {
        const plan=v2216BaselineStructuralArticlePlan(source,cfg);
        return {...plan,footerRemovals:v2216LayoutSafeRemovals(source,plan.footerRemovals)};
    }
    function v27SafeDefaultsortEdits(source,cfg,context) {
        const edits=v2216BaselineSafeDefaultsortEdits(source,cfg,context);
        return v2216LayoutSafeRemovals(source,edits);
    }
    function orderFooter(source,cfg,bump,warn) {
        const changes=[],warnings=[],candidate=v2216BaselineOrderFooter(source,cfg,(...args)=>changes.push(args),(...args)=>warnings.push(args));
        if(candidate!==source&&!v2216LayoutSortWitness(source,candidate).accepted)return source;
        changes.forEach(args=>bump(...args));warnings.forEach(args=>warn(...args));return candidate;
    }
    function orderEndSections(source,cfg,bump,warn) {
        const changes=[],warnings=[],candidate=v2216BaselineOrderEndSections(source,cfg,(...args)=>changes.push(args),(...args)=>warnings.push(args));
        if(candidate!==source&&!v2216LayoutSortWitness(source,candidate).accepted)return source;
        changes.forEach(args=>bump(...args));warnings.forEach(args=>warn(...args));return candidate;
    }
    function v2216LayoutScope(source,cfg={}) {
        return typeof source==='string'&&v2215AliasScope(source,cfg,false)&&cfg.markup!==false;
    }
    function v2216LayoutStandalone(source,node,view=scanProtectedView(source)) {
        const begin=source.lastIndexOf('\n',Math.max(0,node.start-1))+1,next=source.indexOf('\n',node.end),end=next<0?source.length:next;
        if(!/^[ \t\r]*$/.test(view.slice(begin,node.start))||!/^[ \t\r]*$/.test(view.slice(node.end,end)))return false;
        const context=v24SyntaxContext(view,node.start);
        return !context.html.length&&!context.tables.length&&!context.links.length&&!context.external.length;
    }
    function v2216LayoutRemoval(source,node) {
        const start=source.lastIndexOf('\n',Math.max(0,node.start-1))+1,next=source.indexOf('\n',node.end),end=next<0?source.length:next;
        return /^[ \t\r]*$/.test(source.slice(start,node.start))&&/^[ \t\r]*$/.test(source.slice(node.end,end))?{start,end:next<0?end:next+1,text:'',ownerStart:node.start}:{start:node.start,end:node.end,text:'',ownerStart:node.start};
    }
    function v2216LayoutSlots(raw) {
        const p=parsedTemplate(raw);if(!p)return null;
        let next=1;const slots=new Map();
        for(const part of p.parts.slice(1)){
            let at=-1;
            const masked=scanProtectedView(part),nested=templates(masked).nodes;
            for(let i=0;i<part.length;i++)if(part[i]==='='&&!nested.some(n=>i>=n.start&&i<n.end)){at=i;break;}
            const key=at<0?String(next++):part.slice(0,at).trim(),value=at<0?part:part.slice(at+1);
            if(!key||slots.has(key))return null;slots.set(key,value);
        }
        return slots;
    }
    function v2216LayoutList(body) {
        const trimmed=body.trim();if(!trimmed)return null;
        const view=scanProtectedView(trimmed),nodes=topNodes(view);let masked=view;
        for(const n of [...nodes].reverse())masked=masked.slice(0,n.start)+masked.slice(n.start,n.end).replace(/[^\r\n]/g,' ')+masked.slice(n.end);
        const rawLines=trimmed.split(/\r?\n/),lines=masked.split(/\r?\n/);let count=0;
        for(let i=0;i<lines.length;i++){
            const l=lines[i];if(/^\*[ \t]*(?!\*)\S/.test(l)||/^\*[ \t]*$/.test(l)&&/^\*[ \t]*\{\{/.test(rawLines[i])){count++;continue;}
            if(!l.trim())continue;
            // Continuation text and nested lists keep their original grouping.
            if(count&&/^\*[*:;]/.test(l))continue;
            if(!count||/^[#;:=!|]/.test(l)||/<(?:div|table|references|ref)\b/i.test(l))return null;
            if(!/^[ \t]+/.test(l))return null;
        }
        return count?{count,body:trimmed}:null;
    }
    function v2216LayoutColumns(source,cfg={}) {
        if(cfg.endMatter===false||cfg.endMatterColumns===false)return [];
        const view=scanProtectedView(source),headings=[...view.matchAll(/^(={2,6})[ \t]*([^\n]*?)[ \t]*\1[ \t]*\r?$/gm)],edits=[];
        for(let h=0;h<headings.length;h++){
            const heading=headings[h],title=heading[2].trim().toLocaleLowerCase('pt'),level=heading[1].length;
            let parent='',ancestorLevel=level;for(let j=h-1;j>=0;j--)if(headings[j][1].length<ancestorLevel){ancestorLevel=headings[j][1].length;const candidate=headings[j][2].trim().toLocaleLowerCase('pt');if(/^(?:ligações externas|bibliografia|leitura adicional|leituras adicionais)$/.test(candidate)){parent=candidate;break;}}
            const eligible=/^(?:ligações externas|bibliografia|leitura adicional|leituras adicionais)$/.test(title)||level>2&&/^(?:ligações externas|bibliografia|leitura adicional|leituras adicionais)$/.test(parent);
            if(!eligible||cfg.externalLinkColumns===false&&(title==='ligações externas'||parent==='ligações externas'))continue;
            const start=heading.index+heading[0].length,end=headings[h+1]?.index??source.length,body=source.slice(start,end),bodyView=scanProtectedView(body),nodes=topNodes(bodyView);
            for(const node of nodes){
                const raw=body.slice(node.start,node.end),name=v2216LayoutIdentity(raw);if(!['colunas-lista','colunas'].includes(name)||!v2216LayoutStandalone(body,node,bodyView))continue;
                const slots=v2216LayoutSlots(raw);if(!slots)continue;let list;
                if(name==='colunas-lista'){
                    if([...slots.keys()].some(k=>!['1','2','colunas'].includes(k)))continue;
                    const columns=(slots.get('colunas')??slots.get('1')??'2').trim();if(!/^\d+$/.test(columns)||+columns<1||+columns>5)continue;
                    const content=slots.has('2')?slots.get('2'):(slots.has('1')&&!/^\d+$/.test(slots.get('1').trim())?slots.get('1'):null);
                    if(content===null)continue;list=v2216LayoutList(content);if(!list)continue;
                }else{
                    const keys=[...slots.keys()];if(!keys.length||keys.some(k=>!/^col[1-9]\d*$/.test(k)))continue;
                    const values=keys.map(k=>({n:+k.slice(3),body:slots.get(k)})).sort((a,b)=>a.n-b.n);
                    if(values.some((x,i)=>x.n!==i+1||!v2216LayoutList(x.body)||x.body.split(/\r?\n/).some(line=>/^\*(?![\*:;])/.test(line)&&!/^\*[ \t]*(?:\[|\{\{(?:[Cc]itar |[Cc]ite |[Cc]itation\b))/.test(line))))continue;
                    list=v2216LayoutList(values.map(x=>x.body.trim()).join('\n'));if(!list)continue;
                }
                const replacement=list.count>=8?'{{Colunas-lista|2|2=\n'+list.body+'\n}}':list.body;
                if(raw!==replacement)edits.push({start:start+node.start,end:start+node.end,text:replacement,kind:list.count>=8?'continuous-list-columns':'short-list-without-columns',count:1});
            }
            // Wrap a complete ordinary list, with native sister boxes kept outside it.
            if(!nodes.some(n=>['colunas','colunas-lista','div col','divcol'].includes(v2216LayoutIdentity(body.slice(n.start,n.end))))){
                const lines=body.split(/\r?\n/);let first=-1,last=-1,offset=0;
                for(const line of lines){if(/^\*[ \t]*\S/.test(line)){if(first<0)first=offset;last=offset+line.length;}offset+=line.length+1;}
                if(first>=0){const content=body.slice(first,last),list=v2216LayoutList(content),prefix=body.slice(0,first),suffix=body.slice(last);
                    const harmless=part=>{let x=scanProtectedView(part);for(const n of [...topNodes(x)].reverse()){if(!v2216LayoutSister(part.slice(n.start,n.end))&&!['stub','navbox','authority','portal','sort'].includes(v2216LayoutFooterRole(part.slice(n.start,n.end))))return false;x=x.slice(0,n.start)+x.slice(n.start,n.end).replace(/[^\r\n]/g,' ')+x.slice(n.end);}return !x.replace(/^\s*\[\[(?:Categoria|Category):[^\n]*\]\]\s*$/gmi,'').trim();};
                    if(list&&list.count>=8&&harmless(prefix)&&harmless(suffix))edits.push({start:start+first,end:start+last,text:'{{Colunas-lista|2|2=\n'+list.body+'\n}}',kind:'long-list-columns',count:1});
                }
            }
        }
        return edits;
    }
    function v2216LayoutSister(raw) {
        return ['commons','commonscat','commons category','wikisource','wikiquote','wikcionário','wikicionário','wikivoyage','wikilivros','wikiversity','wikinews','wikispécies','outros projetos'].includes(v2216LayoutIdentity(raw));
    }
    function v2216LayoutSisterInline(source,cfg={}) {
        if(cfg.endMatter===false)return [];
        const view=scanProtectedView(source),edits=[];
        const families=[
            {names:['Commonscat em linha','Commonscat-inline'],box:'Commonscat',mode:'label'},
            {names:['Commons em linha','Commons-inline'],box:'Commons',mode:'label'},
            {names:['Wikisource-inline'],box:'Wikisource',mode:'label'},
            {names:['Wikiquote em linha','Wikiquote-inline'],box:'Wikiquote',mode:'label'},
            {names:['Wikcionário em linha'],box:'Wikcionário',mode:'word'},
            {names:['Wikivoyage em linha'],box:'Wikivoyage',mode:'voyage'}
        ];
        for(const node of topNodes(view)){
            const raw=source.slice(node.start,node.end),family=families.find(f=>v2216LayoutNamed(raw,f.names));if(!family)continue;
            const before=view.slice(0,node.start),headings=[...before.matchAll(/^(={2,6})[ \t]*([^\n]*?)[ \t]*\1[ \t]*\r?$/gm)],heading=headings.at(-1);if(!heading||!/^(?:ver também|ligações externas)$/i.test(heading[2].trim()))continue;
            const begin=source.lastIndexOf('\n',node.start-1)+1,endLine=source.indexOf('\n',node.end),end=endLine<0?source.length:endLine,prefix=source.slice(begin,node.start),suffix=source.slice(node.end,end);
            if(!/^[ \t]*(?:\*[ \t]*)?$/.test(prefix)||suffix.trim())continue;
            const context=v24SyntaxContext(view,node.start);if(context.html.length||context.tables.length||context.links.length||context.external.length)continue;
            const slots=v2216LayoutSlots(raw);if(!slots||!slots.size)continue;let destination,label;
            if(family.mode==='voyage'){
                if([...slots.keys()].some(k=>!['1','2','3','link'].includes(k)))continue;
                const language=(slots.get('1')??'pt').trim(),target=slots.get('2')?.trim();if(!/^[a-z][a-z-]{1,15}$/.test(language)||!target)continue;
                if(slots.has('3')&&slots.has('link')&&slots.get('3').trim()!==slots.get('link').trim())continue;
                destination=language+':'+target;label=(slots.get('link')??slots.get('3')??target).trim();
            }else{
                if([...slots.keys()].some(k=>!['1','2'].includes(k)))continue;
                destination=slots.get('1')?.trim();if(!destination||destination==='getwikidata')continue;
                label=(slots.get('2')??(family.box==='Commonscat'?'{{BASEPAGENAME}}':family.mode==='word'?'{{BASEPAGENAME}}':destination)).trim();if(family.mode==='word'&&(label!==destination&&(!cfg.pageTitle||label!=='{{BASEPAGENAME}}'||cfg.pageTitle!==destination)))continue;
            }
            if(!destination||!label||/[{}<>\r\n]/.test(destination)||/[<>\r\n]/.test(label)||/[{}]/.test(label)&&label!=='{{BASEPAGENAME}}')continue;
            const text='{{'+family.box+'|1='+destination+(family.mode==='word'?'':'|2='+label)+'}}';
            edits.push({start:begin,end:node.end,text,kind:'native-sister-project-box',count:1});
        }return edits;
    }
    function v2216LayoutAuthority(raw) {
        const name=v2216LayoutIdentity(raw);if(v2216LayoutNamed(raw,['NM','NF']))return 'composite';
        return v2216LayoutNamed(raw,['Controle de autoridade','Controlo de autoridade','Authority control','Authority Control','Controle de autoriade'])?'direct':null;
    }
    function v2216LayoutFooterRole(raw,profiles={}) {
        return v2216LayoutAuthority(raw)?'authority':v2216BaselineFooterRole(raw,profiles);
    }
    function v2216LayoutWrappers(source,cfg={}) {
        const view=scanProtectedView(source),edits=[];
        for(const match of view.matchAll(/<div\b([^<>]*)>[ \t\r\n]*(\{\{[\s\S]*?\}\})[ \t\r\n]*<\/div\s*>/gi)){
            const raw=source.slice(match.index,match.index+match[0].length),opening=/^<div\b([^>]*)>/i.exec(raw);if(!opening)continue;
            const attrs=opening[1],style=/\bstyle\s*=\s*(["'])(.*?)\1/i.exec(attrs);if(!style)continue;
            const declarations=style[2].split(';').filter(x=>x.trim()).map(x=>x.split(':').map(s=>s.trim().toLowerCase()));
            if(declarations.some(([k,v])=>!({ 'max-width':['100%'],'overflow-x':['auto'],'float':['right'],'clear':['right']}[k]||[]).includes(v)))continue;
            if(!declarations.some(([k,v])=>k==='overflow-x'&&v==='auto'))continue;
            let extra=attrs.replace(style[0],'').replace(/\btabindex\s*=\s*(["'])0\1/gi,'').replace(/\brole\s*=\s*(["'])region\1/gi,'').replace(/\baria-label\s*=\s*(["'])[^"']*\1/gi,'');if(extra.trim())continue;
            const content=raw.slice(opening[0].length,raw.lastIndexOf('</')).trim(),nodes=topNodes(scanProtectedView(content));if(nodes.length!==1||nodes[0].start!==0||nodes[0].end!==content.length)continue;
            const name=v2216LayoutIdentity(content),isInfo=/^info\//.test(name),role=v2216LayoutFooterRole(content,cfg.footerProfiles||{});
            if(isInfo&&cfg.infoboxes===false||!isInfo&&cfg.endMatter===false||!isInfo&&!['navbox','authority','portal'].includes(role))continue;
            const infoSlots=isInfo?v2216LayoutSlots(content):null;if(isInfo&&(!infoSlots||[...infoSlots].some(([key,value])=>/^(?:child|embed|embedded|embutido|incorporado|subcaixa)$/i.test(key)&&value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(value.trim()))))continue;
            if(!/^[ \t]*$/.test(source.slice(source.lastIndexOf('\n',match.index-1)+1,match.index)))continue;
            const context=v24SyntaxContext(view,match.index);if(context.html.length||context.tables.length||context.links.length||context.external.length)continue;
            edits.push({start:match.index,end:match.index+match[0].length,text:content,kind:isInfo?'native-infobox-wrapper':'native-footer-wrapper',count:1});
        }
        return edits;
    }
    function v2216LayoutInfoboxLines(source,cfg={}) {
        if(cfg.infoboxes===false)return [];
        const view=scanProtectedView(source),edits=[];
        for(const node of topNodes(view)){
            const raw=source.slice(node.start,node.end);if(!/^info\//.test(v2216LayoutIdentity(raw)))continue;
            const context=v24SyntaxContext(view,node.start);if(context.html.length||context.tables.length||context.links.length||context.external.length)continue;
            if(node.end<source.length&&!/^[ \t]*\r?\n/.test(source.slice(node.end))&&!/^[ \t]*$/.test(source.slice(node.end))){
                const following=/^[ \t]*(?=\S)/.exec(source.slice(node.end));edits.push({start:node.end,end:node.end+(following?.[0].length||0),text:'\n',kind:'infobox-lead-line',count:1});
            }
        }return edits;
    }
    function v2216LayoutQuality(source) {
        const view=scanProtectedView(source),groups=new Map(),edits=[];
        for(const node of topNodes(view)){
            const raw=source.slice(node.start,node.end),name=v2216LayoutNamed(raw,['Artigo destacado','Featured article'])?'artigo destacado':v2216LayoutNamed(raw,['Artigo bom'])?'artigo bom':null;if(!name)continue;
            const context=v24SyntaxContext(view,node.start);if(context.html.length||context.tables.length||context.links.length||context.external.length)continue;
            const begin=view.lastIndexOf('\n',Math.max(0,node.start-1))+1,next=view.indexOf('\n',node.end),end=next<0?view.length:next;let line=view.slice(begin,end);
            for(const other of [...topNodes(line)].reverse())line=line.slice(0,other.start)+line.slice(other.end);if(line.trim())continue;
            const p=parsedTemplate(raw);if(p.parts.slice(1).some(x=>x.trim()))continue;
            if(!groups.has(name))groups.set(name,node);else edits.push({...v2216LayoutRemoval(source,node),kind:'duplicate-quality-marker',count:1});
        }return edits;
    }
    function v2216LayoutMetadata(source,cfg={}) {
        if(cfg.endMatter===false||cfg.categories===false)return [];
        const view=scanProtectedView(source),nodes=topNodes(view),edits=[],sorts=[],categories=[];
        for(const node of nodes)if(/^\{\{\s*(?:DEFAULTSORT|DEFAULTSORTKEY|DEFAULTCATEGORYSORT|ORDENAÇÃO|ORDENACAO)\s*:/i.test(source.slice(node.start,node.end))&&v2216LayoutStandalone(source,node,view))sorts.push({...node,raw:source.slice(node.start,node.end)});
        let mask=view;for(const node of [...nodes].reverse())mask=mask.slice(0,node.start)+mask.slice(node.start,node.end).replace(/[^\r\n]/g,' ')+mask.slice(node.end);
        for(const match of mask.matchAll(/^[ \t]*\[\[(?:Categoria|Category):[^\n]*?\]\][ \t]*\r?$/gmi)){
            const start=match.index,end=start+match[0].length,context=v24SyntaxContext(view,start);if(context.html.length||context.tables.length)continue;
            categories.push({start,end,raw:source.slice(start,end).trim()});
        }
        if(!categories.length)return edits;
        const composite=nodes.filter(n=>v2216LayoutAuthority(source.slice(n.start,n.end))==='composite');
        const conflict=composite.some(n=>{const slots=v2216LayoutSlots(source.slice(n.start,n.end)),key=slots?.get('3')?.trim();return !key||sorts.some(s=>s.raw.replace(/^\{\{[^:]+:/,'').replace(/\}\}$/,'').trim()!==key);});
        // Conflicting dynamic sort owners retain their existing evaluation order.
        const movingSorts=conflict?[]:sorts;
        // Only metadata is moved. All category names and local sort keys remain byte-exact.
        const all=[...movingSorts,...categories].sort((a,b)=>a.start-b.start),removed=v24SyntaxApply(source,all.map(n=>v2216LayoutRemoval(source,n))),block=[...movingSorts.map(n=>n.raw),...categories.map(n=>n.raw)].join('\n');
        const tail=/\n(?:[ \t]*\[\[[a-z][a-z-]{1,20}:[^\n]+\]\][ \t]*\r?\n?)+[ \t\r\n]*$/i.exec(removed),at=tail?tail.index:removed.trimEnd().length;
        let next=removed.slice(0,at).replace(/(?:\r?\n[ \t]*){2,}$/,'\n\n');if(next&&!next.endsWith('\n'))next+='\n';if(next&&!next.endsWith('\n\n'))next+='\n';
        next+=block+(tail?'\n'+removed.slice(at).replace(/^\s*\n/,''):'\n');
        if(next!==source)edits.push({start:0,end:source.length,text:next,kind:'metadata-tail',count:1});return edits;
    }
    function v2216LayoutFooter(source,cfg={}) {
        if(cfg.endMatter===false)return [];
        const view=scanProtectedView(source),nodes=topNodes(view).filter(n=>v2216LayoutStandalone(source,n,view)),edits=[];
        const authorities=nodes.filter(n=>v2216LayoutAuthority(source.slice(n.start,n.end))),composite=authorities.filter(n=>v2216LayoutAuthority(source.slice(n.start,n.end))==='composite'),direct=authorities.filter(n=>v2216LayoutAuthority(source.slice(n.start,n.end))==='direct');
        const eligible=[],seenDirect=new Set();
        for(let i=0;i<composite.length-1;i++){
            const node=composite[i],next=composite[i+1],identity=v2216LayoutLiteralComposite(source.slice(node.start,node.end)),other=v2216LayoutLiteralComposite(source.slice(next.start,next.end));
            if(identity!==null&&identity===other&&/^\s*$/.test(source.slice(node.end,next.start)))edits.push({...v2216LayoutRemoval(source,node),kind:'duplicate-composite-authority',count:1});
        }
        for(const node of direct){const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),identity=p.parts.slice(1).map(x=>x.trim()).join('\u0000'),bare=!p.parts.slice(1).some(x=>x.trim());
            if(bare&&composite.length||seenDirect.has(identity))edits.push({...v2216LayoutRemoval(source,node),kind:'duplicate-authority-display',count:1});else{seenDirect.add(identity);eligible.push(node);}
        }
        for(const node of direct)if(!edits.some(e=>e.start===node.start||e.ownerStart===node.start)&&!v2216LayoutNamed(node.raw||source.slice(node.start,node.end),['Controle de autoridade'])){
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),header=p.parts[0],start=node.start+2,end=start+header.length;
            edits.push({start,end,text:'Controle de autoridade',kind:'native-authority-header',count:1});
        }
        const keep=authorities.filter(n=>!edits.some(e=>e.start===n.start||e.ownerStart===n.start)),portals=nodes.filter(n=>/^portal(?:2|3)?$/.test(v2216LayoutIdentity(source.slice(n.start,n.end))));
        if(keep.length===1&&portals.length===1){const node=keep[0],portal=portals[0],gap=source.slice(node.end,portal.start);
            if(node.end!==portal.start&&(!/^\s*$/.test(gap)||!/^\r?\n$/.test(gap))){
                const tailStart=Math.min(node.start,portal.start),tail=source.slice(tailStart),tailView=scanProtectedView(tail),tailNodes=topNodes(tailView);
                let tailPlain=tailView;for(const owner of [...tailNodes].reverse())tailPlain=tailPlain.slice(0,owner.start)+tailPlain.slice(owner.start,owner.end).replace(/[^\r\n]/g,' ')+tailPlain.slice(owner.end);
                const isMetadataTail=tailNodes.every(owner=>['stub','navbox','authority','portal','sort','project'].includes(v2216LayoutFooterRole(tail.slice(owner.start,owner.end),cfg.footerProfiles||{})))&&tailPlain.replace(/\[\[(?:Categoria|Category):[^\n]*\]\]/gi,'').trim()==='';
                const compositeSort=v2216LayoutAuthority(source.slice(node.start,node.end))==='composite'&&/\{\{\s*(?:DEFAULTSORT|DEFAULTSORTKEY|DEFAULTCATEGORYSORT|ORDENAÇÃO|ORDENACAO)\s*:/i.test(source);
                if(isMetadataTail&&!compositeSort){let raw=source.slice(node.start,node.end);if(v2216LayoutAuthority(raw)==='direct')raw=raw.replace(/^\{\{[^|}]+/,'{{Controle de autoridade');for(let i=edits.length-1;i>=0;i--)if(edits[i].start>=node.start&&edits[i].end<=node.end)edits.splice(i,1);edits.push({...v2216LayoutRemoval(source,node),kind:'authority-before-portals',count:1});edits.push({start:portal.start,end:portal.start,text:raw+'\n',kind:'authority-before-portals-insert',count:0});}
            }
        }
        const heading=[...view.matchAll(/^==[ \t]*Ver tamb[ée]m[ \t]*==[ \t]*\r?$/gmi)];if(heading.length===1){
            const at=heading[0].index+heading[0][0].length,nextHeading=/^={2,6}[^\n]*={2,6}[ \t]*\r?$/gm;nextHeading.lastIndex=at;const next=nextHeading.exec(view),sectionEnd=next?next.index:source.length;
            const boxes=nodes.filter(n=>v2216LayoutSister(source.slice(n.start,n.end)));
            if(boxes.length){
                let cursor=at,aligned=true;
                for(const node of boxes){if(node.start<cursor||!/^\s*$/.test(source.slice(cursor,node.start)))aligned=false;cursor=node.end;}
                if(!aligned){
                    for(const n of boxes)edits.push({...v2216LayoutRemoval(source,n),kind:'sister-project-box-position',count:1});
                    edits.push({start:at,end:at,text:'\n'+boxes.map(n=>source.slice(n.start,n.end)).join('\n'),kind:'sister-project-box-insert',count:0});
                }
            }
        }
        return edits;
    }
    function v2216LayoutPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};if(!v2216LayoutScope(source,cfg))return empty;
        let text=source;const steps=[];
        for(const [kind,fn] of [['wrappers',s=>v2216LayoutWrappers(s,cfg)],['sister-inline',s=>v2216LayoutSisterInline(s,cfg)],['infobox-lines',s=>v2216LayoutInfoboxLines(s,cfg)],['quality',v2216LayoutQuality],['columns',s=>v2216LayoutColumns(s,cfg)],['footer',s=>v2216LayoutFooter(s,cfg)],['metadata',s=>v2216LayoutMetadata(s,cfg)]]){
            const edits=fn(text).sort((a,b)=>a.start-b.start||a.end-b.end);if(edits.some((e,i)=>i&&e.start<edits[i-1].end))continue;
            const guarded=v2216LayoutGuardedEdits(text,edits,kind),next=guarded.text;if(next!==text){steps.push({kind,sourceHash:v24SyntaxHash(text),edits:guarded.edits,sortWitness:guarded.sortWitness});text=next;}
        }
        if(text===source)return empty;return {...empty,text,steps,edits:[{start:0,end:source.length,text,ruleId:'v2216Layout',count:steps.reduce((sum,s)=>sum+s.edits.reduce((n,e)=>n+(e.count??1),0),0),proof:{sourceHash:empty.sourceHash,kinds:steps.map(s=>s.kind)}}]};
    }
    function v2216LayoutProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2216LayoutPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
