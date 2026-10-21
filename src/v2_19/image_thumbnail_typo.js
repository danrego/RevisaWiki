    // An exact discarded nonfinal caption token can express this supplied typo.
    // This changes display format deliberately. It is not alias equivalence.
    function v219ImageThumbnailTypoOption(raw) {
        if(typeof raw!=='string'||raw!==raw.trim()||!raw)return null;
        const allowed=new Set(['img_width','img_alt','img_link','img_left','img_right','img_center','img_none']);
        for(const [kind,aliases]of Object.entries(V219_NATIVE_IMAGE_OPTIONS))for(const alias of aliases){
            if(!allowed.has(kind))continue;
            let matches=raw===alias;
            if(alias.includes('$1')){
                const [prefix,suffix]=alias.split('$1'),value=raw.slice(prefix.length,suffix?-suffix.length:undefined);
                matches=raw.startsWith(prefix)&&raw.endsWith(suffix)&&!!value&&
                    (kind!=='img_width'||/^(?:[1-9]\d{0,3}(?:x[1-9]\d{0,3})?|x[1-9]\d{0,3})$/.test(value));
            }
            if(matches)return ['img_left','img_right','img_center','img_none'].includes(kind)?'horizontal':kind;
        }
        return null;
    }
    function v219ImageThumbnailTypoPlan(source,options={}) {
        const cfg={...DEFAULTS,...options},empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||!/\|miniaturada(?:-imagem| imagem)?\|/.test(source)||!cfg.markup||!cfg.links||
            cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||cfg.pageRedirect||cfg.pageDisambiguation||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||!v20AutomationAllowed(source,cfg))return empty;
        const edits=[],typos=new Set(['miniaturada','miniaturada-imagem','miniaturada imagem']),images=[],lines=new Map(),prefixContexts=new Map();
        let sourceShield=null;
        const rootLine=(start,end)=>{
            if(start>16384||end-start>16384)return false;
            if(prefixContexts.has(start))return prefixContexts.get(start);
            if(prefixContexts.size>=16)return false;
            prefixContexts.set(start,false);
            const prefix=source.slice(0,start),whole=sourceShield||(sourceShield=v24SyntaxProtected(source)),local=v24SyntaxProtected(prefix);
            if(local.unclosed.length||local.view!==whole.view.slice(0,start)||whole.ranges.some(range=>range.start<end&&start<range.end))return false;
            const index=v219SyntaxContextIndex(prefix),context=index&&v219IndexedSyntaxContext(prefix,prefix.length);
            if(!index?.complete||!context||['templates','html','tables','links','external'].some(key=>context[key].length))return false;
            const consumed=mergeEditorialRanges([...local.ranges,...index.tokens.filter(token=>prefix[token.start]==='<')]);
            let cursor=0;
            for(const match of prefix.matchAll(/[<>]/g)){
                while(cursor<consumed.length&&consumed[cursor].end<=match.index)cursor++;
                if(!consumed[cursor]||consumed[cursor].start>match.index)return false;
            }
            prefixContexts.set(start,true);return true;
        };
        const read=range=>{
            const raw=source.slice(range.start,range.end),inside=raw.slice(2,-2);
            if(raw.length>8192||/[{}<>\r\n&"\u0000-\u001f\u007f-\u009f\p{Cf}\p{Zl}\p{Zp}\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\uE000-\uF8FF]/u.test(inside))return null;
            const parts=v24SyntaxParts(inside),head=parts&&/^(?:Ficheiro|Imagem|Arquivo|File|Image):([^:#|]+\.(?:jpe?g|png|gif|webp|tiff?|svg))$/i.exec(parts[0].text);
            if(!head||head[1]!==head[1].trim()||!v219LiteralMediaFilename(head[1])||parts.length<3)return null;
            const caption=parts.at(-1).text;
            if(!caption||caption!==caption.trim()||typos.has(caption)||/[='\"]/.test(caption)||v219NativeImageOption(caption))return null;
            let plain='',last=0;
            for(const link of editorialWikiLinkRanges(caption).sort((a,b)=>a.start-b.start)){
                if(link.start<last)return null;
                const value=caption.slice(link.start,link.end),match=/^\[\[([^\[\]{}<>|:#\r\n]+)(?:\|([^\[\]{}<>|\r\n]+))?\]\]$/.exec(value);
                if(!match||match[1]!==match[1].trim()||match[2]!==undefined&&match[2]!==match[2].trim())return null;
                plain+=caption.slice(last,link.start);last=link.end;
            }
            plain+=caption.slice(last);if(/[\[\]]/.test(plain))return null;
            const kinds=new Set();let typo=null,thumbnail=null;
            for(const part of parts.slice(1,-1)){
                const value=part.text;if(/[\[\]']/.test(value))return null;
                if(typos.has(value)){if(typo)return null;typo=part;continue;}
                const native=V219_NATIVE_IMAGE_OPTIONS.img_thumbnail.includes(value),kind=native?'img_thumbnail':v219ImageThumbnailTypoOption(value);
                if(!kind||kinds.has(kind))return null;kinds.add(kind);if(native)thumbnail=value;
            }
            const start=source.lastIndexOf('\n',range.start-1)+1,next=source.indexOf('\n',range.end),end=next<0?source.length:next;
            if((sourceShield||(sourceShield=v24SyntaxProtected(source))).ranges.some(owner=>['quotation','quotation-markup','quotation-template'].includes(owner.kind)&&owner.start<range.end&&range.start<owner.end))return null;
            let context=v219IndexedSyntaxContext(source,range.start);
            if(!context&&thumbnail&&rootLine(start,end))context={templates:[],html:[],tables:[],links:[],external:[]};
            if(!context||['templates','html','tables','links','external'].some(key=>context[key].length))return null;
            return {range,raw,caption,typo,thumbnail,start,end};
        };
        for(const range of editorialWikiLinkRanges(source)){
            const image=read(range);if(!image)continue;images.push(image);
            if(!lines.has(image.start))lines.set(image.start,{end:image.end,images:[],safe:null});
            lines.get(image.start).images.push(image);
        }
        for(const image of images){
            if(!image.typo)continue;
            const {range,raw,caption,typo,thumbnail,start,end}=image;
            if(!/^[ \t\r]*$/.test(source.slice(start,range.start))||!/^[ \t\r]*$/.test(source.slice(range.end,end))){
                if(!thumbnail||end-start>16384)continue;
                const line=lines.get(start);
                if(line.safe===null){
                    let at=start;line.safe=true;
                    for(const sibling of line.images.sort((a,b)=>a.range.start-b.range.start)){
                        if(!sibling.thumbnail||sibling.end!==end||sibling.range.start<at||!/^[ \t\r]*$/.test(source.slice(at,sibling.range.start))){line.safe=false;break;}
                        at=sibling.range.end;
                    }
                    if(!/^[ \t\r]*$/.test(source.slice(at,end)))line.safe=false;
                }
                if(!line.safe)continue;
            }
            const at=range.start+2+typo.start;
            edits.push({start:at-(thumbnail?1:0),end:range.start+2+typo.end,text:thumbnail?'':'miniatura',ruleId:'v219ImageThumbnailTypo',
                proof:{sourceHash:empty.sourceHash,raw,start:range.start,end:range.end,caption,
                    originalToken:typo.text,targetToken:thumbnail?'':'miniatura',existingThumbnail:thumbnail,minorSafe:false,
                    kind:thumbnail?'redundant-discarded-option-with-native-thumbnail':'intended-supplied-image-format-typo',
                    primary:'ptwiki-siteinfo-img_thumbnail; Help:Images8595270',retainedOtherBytes:true}});
        }
        const allowed=v219StageSafeEdits(source,edits,'v219-image-thumbnail-typo',cfg);
        return {...empty,edits:allowed,text:v24SyntaxApply(source,allowed)};
    }
    function v219ImageThumbnailTypoProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219ImageThumbnailTypoPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219AutomaticImageThumbnailTypo(source,cfg,bump=()=>{}) {
        const plan=v219ImageThumbnailTypoPlan(source,cfg);
        if(!plan.edits.length||!v219ImageThumbnailTypoProof(source,plan.text,plan,cfg))return source;
        for(const edit of plan.edits)bump(edit.ruleId);
        return plan.text;
    }
