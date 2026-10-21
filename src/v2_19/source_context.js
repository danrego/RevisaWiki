    // A complete page supplies its own matched token boundaries. Cutting it
    // before reading quotation scopes can turn a closing quote into an opener.
    // Incomplete pages retain the earlier conservative prefix reader.
    function v219BuildSyntaxContextIndex(source) {
        if(typeof source!=='string'||source.length>4194304)return null;
        const scan=v24SyntaxScan(source);
        if(scan.issues.length&&(!/<ref\b/i.test(source)||scan.issues.some(issue=>
            issue.kind!=='quotation'||issue.code!=='syntax-opaque-unclosed')))return null;
        // Ordinary quotation punctuation can cross complete ref attributes.
        // Recheck every structural delimiter below, retaining all write shields.
        const view=scan.issues.length?v219StructuralReadView(source):scan.view,braces=v215BraceStructure(view);
        if(braces.unclosed.length)return null;
        const opens=new Map(braces.nodes.map(node=>[node.start,node]));
        const closes=new Map(braces.nodes.map(node=>[node.end-node.size,node]));
        const templatesStack=[],html=[],tables=[],links=[],external=[],events=[],tokens=[],
            budget=(source.length>=8192?25165824:4194304)-source.length*2-288;
        let estimatedWeight=0;
        const snapshot=at=>{
            estimatedWeight+=136+templatesStack.length*40+
                html.reduce((sum,tag)=>sum+160+tag.raw.length*2,0)+
                (tables.length+links.length+external.length)*8;
            if(events.length>=100000||estimatedWeight>budget)return false;
            const value={at,templates:templatesStack.map(frame=>Object.freeze({...frame})),
                html:html.map(frame=>Object.freeze({...frame})),tables:tables.slice(),
                links:links.slice(),external:external.slice()};
            for(const key of ['templates','html','tables','links','external'])Object.freeze(value[key]);
            events.push(Object.freeze(value));return true;
        };
        snapshot(0);
        for(let at=0;at<view.length;){
            const tag=v24SyntaxTag(view,at);
            if(tag){
                tokens.push({start:at,end:tag.end});
                if(!V24_SYNTAX_VOID.has(tag.name)&&!tag.self){
                    if(!tag.close)html.push({...tag,templateDepth:templatesStack.length,
                        tableDepth:tables.length,linkDepth:links.length+external.length});
                    else if(html.at(-1)?.name===tag.name&&!tag.typo&&!tag.attrs.trim())html.pop();
                    else return null;
                    if(!snapshot(tag.end))return null;
                }
                at=tag.end;continue;
            }
            const opening=opens.get(at),closing=closes.get(at),two=view.slice(at,at+2);
            let changed=false,end=at+1;
            if(opening){templatesStack.push({start:opening.start,size:opening.size});end=at+opening.size;changed=true;}
            else if(closing){if(templatesStack.at(-1)?.start!==closing.start)return null;templatesStack.pop();end=at+closing.size;changed=true;}
            else if(two==='[['){links.push(at);end=at+2;changed=true;}
            else if(two===']]'){if(!links.length)return null;links.pop();end=at+2;changed=true;}
            else if(view[at]==='['&&!links.length&&/^(?:https?:|\/\/)/i.test(view.slice(at+1))){external.push(at);changed=true;}
            else if(view[at]===']'&&external.length){external.pop();changed=true;}
            else if(two==='{|'&&/^[ \t]*$/.test(view.slice(view.lastIndexOf('\n',at-1)+1,at))){tables.push(at);end=at+2;changed=true;}
            else if(two==='|}'&&/^[ \t]*$/.test(view.slice(view.lastIndexOf('\n',at-1)+1,at))){if(!tables.length)return null;tables.pop();end=at+2;changed=true;}
            if(changed){tokens.push({start:at,end});if(!snapshot(end))return null;}
            at=end;
        }
        if(templatesStack.length||html.length||tables.length||links.length||external.length)return null;
        const weight=128+tokens.length*40+events.reduce((sum,event)=>sum+96+
            event.templates.length*40+event.html.reduce((n,tag)=>n+160+tag.raw.length*2,0)+
            (event.tables.length+event.links.length+event.external.length)*8,0);
        return Object.freeze({events:Object.freeze(events),tokens:Object.freeze(tokens.map(token=>Object.freeze(token))),weight,
            sourceHash:v24SyntaxHash(source),complete:true});
    }
    function v219SyntaxContextIndex(source) {
        if(typeof source!=='string')return null;
        const large=source.length>=8192;
        return boundedMemo(large?scanMemoLarge:scanMemoSmall,large?'large':'small',
            large?25165824:4194304,large?12:2048,source,'v219-syntax-context',
            ()=>{const index=v219BuildSyntaxContextIndex(source),budget=large?25165824:4194304;
                return index&&index.weight+source.length*2+160<=budget?index:null;},value=>value?.weight||32);
    }
    function v219IndexedSyntaxContext(source,at) {
        if(!Number.isInteger(at)||at<0||at>source.length)return null;
        const index=v219SyntaxContextIndex(source);if(!index)return null;
        // Preserve prefix behavior when a caller cuts a token itself.
        let low=0,high=index.tokens.length;
        while(low<high){const middle=(low+high)>>>1;if(index.tokens[middle].start<at)low=middle+1;else high=middle;}
        if(low&&index.tokens[low-1].end>at)return null;
        low=0;high=index.events.length;
        while(low<high){const middle=(low+high)>>>1;if(index.events[middle].at<=at)low=middle+1;else high=middle;}
        const state=index.events[low-1];if(!state)return null;
        return {templates:state.templates.map(frame=>({...frame})),html:state.html.map(frame=>({...frame})),
            tables:state.tables.slice(),links:state.links.slice(),external:state.external.slice()};
    }
    const v219BracePartCaches={
        small:{values:new Map(),bytes:0,maximumBytes:4194304,maximumEntries:8192},
        large:{values:new Map(),bytes:0,maximumBytes:16777216,maximumEntries:4}
    };
    function v219CachedBraceParts(body,strict=false) {
        if(typeof body!=='string'||body.length>4194304)return v219LegacyBraceParts(body,strict);
        const cache=body.length>=8192?v219BracePartCaches.large:v219BracePartCaches.small,
            key=(strict?'1':'0')+body,found=cache.values.get(key),
            clone=value=>value===null?null:value.map(part=>({...part}));
        if(found){cache.values.delete(key);cache.values.set(found.key,found);return clone(found.value);}
        const value=v219LegacyBraceParts(body,strict),weight=body.length*4+160+
            (value===null?0:value.length*96);
        if(weight<=cache.maximumBytes){
            const saved=value===null?null:Object.freeze(value.map(part=>Object.freeze({...part,text:JSON.parse(JSON.stringify(part.text))}))),
                storedKey=JSON.parse(JSON.stringify(key));
            cache.values.set(storedKey,{value:saved,weight,key:storedKey});cache.bytes+=weight;
            while(cache.values.size>cache.maximumEntries||cache.bytes>cache.maximumBytes){
                const first=cache.values.keys().next().value;cache.bytes-=cache.values.get(first).weight;cache.values.delete(first);
            }
        }
        return value;
    }
    function v219BracePartCacheStatus() {
        return Object.fromEntries(Object.entries(v219BracePartCaches).map(([name,cache])=>[name,
            {entries:cache.values.size,bytes:cache.bytes,maximumBytes:cache.maximumBytes,maximumEntries:cache.maximumEntries}]));
    }
    const v219RendererContexts=new Map();
    let v219RendererContextBytes=0;
    function v219RendererNodeProfile(source,node) {
        const parts=v24SyntaxParts(source.slice(node.start+2,node.end-2));
        if(!parts||!V24_SYNTAX_RENDERERS.has(v24SyntaxName(parts[0].text)))return {valid:false,group:'',ranges:[]};
        let group='',groupSeen=false;const ranges=[];
        for(const part of parts.slice(1)){
            const match=part.text.match(/^\s*([^=]+)=([\s\S]*)$/);
            if(!match)return {valid:false,group:'',ranges:[]};
            const key=v24SyntaxName(match[1]);
            if(['group','grupo'].includes(key)){
                if(groupSeen||/[{}<>\[\]|&\r\n]/.test(match[2]))return {valid:false,group:'',ranges:[]};
                groupSeen=true;group=match[2].trim();
            }
            if(key==='refs')ranges.push(Object.freeze({start:node.start+2+part.start+part.text.indexOf('=')+1,
                end:node.start+2+part.end}));
        }
        return {valid:true,group,ranges};
    }
    function v219RendererProfile(source,node) {
        const maximumBytes=8388608,maximumEntries=4,key=node.start+':'+node.end;
        let entry=v219RendererContexts.get(source);
        if(entry){
            v219RendererContexts.delete(source);v219RendererContexts.set(source,entry);
            const found=entry.nodes.get(key);if(found)return found;
        }
        const profile=v219RendererNodeProfile(source,node),weight=160+profile.group.length*2+profile.ranges.length*40;
        if(!entry){
            const baseWeight=source.length*2+256;
            if(baseWeight+weight>maximumBytes)return profile;
            entry={nodes:new Map(),weight:baseWeight};v219RendererContexts.set(source,entry);v219RendererContextBytes+=baseWeight;
        }
        if(entry.nodes.size<2048&&entry.weight+weight<=maximumBytes){
            const stored=Object.freeze({...profile,ranges:Object.freeze(profile.ranges)});
            entry.nodes.set(key,stored);entry.weight+=weight;v219RendererContextBytes+=weight;
        }
        while(v219RendererContexts.size>maximumEntries||v219RendererContextBytes>maximumBytes){
            const first=v219RendererContexts.keys().next().value;v219RendererContextBytes-=v219RendererContexts.get(first).weight;v219RendererContexts.delete(first);
        }
        return profile;
    }
    function v219RendererContext(source,at,parsed) {
        if(typeof source!=='string'||source.length>4194304)return v219LegacyRendererContext(source,at,parsed);
        const ancestors=parsed.nodes.filter(node=>node.size===2&&node.start<at&&at<node.end).sort((a,b)=>a.start-b.start);
        if(parsed.unclosed.some(node=>node.start<at)||ancestors.length>1)return {valid:false,group:''};
        if(!ancestors.length)return {valid:true,group:''};
        const node=ancestors[0];
        if(!Number.isInteger(node.start)||!Number.isInteger(node.end))return v219LegacyRendererContext(source,at,parsed);
        const profile=v219RendererProfile(source,node);
        return {valid:profile.valid&&profile.ranges.some(range=>range.start<=at&&at<range.end),group:profile.group};
    }
    function v219RendererCacheStatus() {
        return {entries:v219RendererContexts.size,bytes:v219RendererContextBytes,maximumEntries:4,maximumBytes:8388608,
            nodeProfiles:[...v219RendererContexts.values()].reduce((n,entry)=>n+entry.nodes.size,0)};
    }
    function v219RangeOutside(pos,ranges,start,end) {
        if(ranges.length<64)return ranges.some(range=>range.start<=pos&&pos<range.end&&
            (range.start<start||range.end>end));
        const index=rangeIndex(ranges);
        for(let at=rangePosition(pos,index);at>=0&&index.max[at]>pos;at--){
            const range=index.sorted[at];
            if(range[1]>pos&&(range[0]<start||range[1]>end))return true;
        }
        return false;
    }
    function v219MarkdownLiteralRanges(source) {
        if(!/[`~]{3}/.test(source))return [];
        // Fence-like text inside an existing literal HTML block or comment
        // cannot open a second container outside that block.
        return v27SafeMarkdownRanges(scanProtectedView(source)).map(range=>({...range,kind:'markdown-fence'}));
    }
    function v219StructuralReadView(source) {
        // Structural collectors and duplicate boxes use the same literal
        // Markdown boundary as local syntax stages. Offsets remain exact.
        return v24SyntaxMaskRanges(protectedView(source),v219MarkdownLiteralRanges(source));
    }
    // The original brace reader is pure and returns four flat row arrays.
    // Cache only that exact-source read. No writer, option or source offset
    // is reused, and callers always receive their own mutable containers.
    const v219BraceStructureCaches={
        small:{entries:new Map(),bytes:0,maxBytes:4194304,maxEntries:8192},
        large:{entries:new Map(),bytes:0,maxBytes:67108864,maxEntries:8}
    };
    function v219CloneBraceStructure(value) {
        return {nodes:value.nodes.map(row=>({...row})),unclosed:value.unclosed.map(row=>({...row})),
            unclosedLinks:value.unclosedLinks.map(row=>({...row})),opaque:value.opaque.map(row=>({...row}))};
    }
    function v219CachedBraceStructure(source) {
        if(typeof source!=='string'||source.length>4194304)return v219LegacyBraceStructure(source);
        const cache=source.length>=8192?v219BraceStructureCaches.large:v219BraceStructureCaches.small,
            stored=cache.entries.get(source);
        if(stored!==undefined){
            cache.entries.delete(source);cache.entries.set(stored.key,stored);
            return v219CloneBraceStructure(stored.value);
        }
        const value=v219LegacyBraceStructure(source),rows=Object.values(value).reduce((count,array)=>count+array.length,0),
            weight=source.length*2+rows*128+288;
        if(weight>cache.maxBytes)return value;
        // Detach stored strings from possible substring backing buffers.
        // These records contain only integers, plain string kinds and arrays.
        let storedValue=v219CloneBraceStructure(value);
        const storedKey=JSON.parse(JSON.stringify(source));
        if(storedValue.opaque.length){
            const kinds=['comment','nowiki','pre','syntaxhighlight','source','code','math','chem','score','timeline','graph','templatedata','poem','gallery','hiero','imagemap','mapframe','maplink','inputbox'];
            for(const row of storedValue.opaque){
                const kind=kinds.find(kind=>kind===row.kind);
                if(kind===undefined){storedValue=JSON.parse(JSON.stringify(value));break;}
                row.kind=kind;
            }
        }
        for(const array of Object.values(storedValue)){array.forEach(Object.freeze);Object.freeze(array);}Object.freeze(storedValue);
        while(cache.entries.size&&(cache.bytes+weight>cache.maxBytes||cache.entries.size>=cache.maxEntries)){
            const first=cache.entries.keys().next().value,stored=cache.entries.get(first);
            cache.entries.delete(first);cache.bytes-=stored.weight;
        }
        cache.entries.set(storedKey,{value:storedValue,weight,key:storedKey});cache.bytes+=weight;
        return value;
    }
    function v219BraceStructureCacheStatus() {
        return Object.fromEntries(Object.entries(v219BraceStructureCaches).map(([name,cache])=>[name,
            {entries:cache.entries.size,bytes:cache.bytes,maximumEntries:cache.maxEntries,maximumBytes:cache.maxBytes}]));
    }
    function v219ProtectedSyntax(source) {
        const large=source.length>=8192;
        const stored=boundedMemo(large?scanMemoLarge:scanMemoSmall,large?'large':'small',
            large?25165824:4194304,large?12:2048,source,'v219-protected-syntax',()=>{
                const fences=v219MarkdownLiteralRanges(source),
                    parsed=v219LegacySyntaxProtected(fences.length?v24SyntaxMaskRanges(source,fences):source);
                return Object.freeze({view:parsed.view,ranges:Object.freeze([...parsed.ranges,...fences].map(range=>Object.freeze({...range}))),
                    unclosed:Object.freeze(parsed.unclosed.map(range=>Object.freeze({...range})))});
            },value=>value.view.length*2+(value.ranges.length+value.unclosed.length)*112+160);
        // Several old callers extend their own list. Return independent
        // containers so they cannot change the shared source-bound parse.
        return {view:stored.view,ranges:stored.ranges.map(range=>({...range})),unclosed:stored.unclosed.map(range=>({...range}))};
    }
    function v219MalformedReferenceRanges(source) {
        if(typeof source!=='string'||source.length>4194304||!/<ref\b/i.test(source))return [];
        return refTokens(source).filter(ref=>{
                if(attrsOf(ref.attrs)!==null)return false;
                // Closed literal name/group attributes repeated with exactly
                // the same value are the separate native deduplication
                // contract. They are not garbled quoting or conflicting
                // source ownership. Every other malformed header stays opaque.
                const duplicate=v25SafeAttributes(ref.attrs,V25_SAFE_REFERENCE_ATTRIBUTES);
                return !duplicate||!duplicate.duplicates.length;
            })
            .map(ref=>({start:ref.start,end:ref.end,kind:'malformed-reference-attributes'}));
    }
