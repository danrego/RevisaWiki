    // A protected object's placeholder is unread evidence. Test the raw
    // value before the ordinary reader can blank a placeholder's contents.
    function v219OpaquePortalEvidence(value) {
        if(typeof value!=='string')return true;
        if(!/[\uE000-\uF8FF]/.test(value))return false;
        // A reference's contents do not supply the subject classification.
        // Its complete source annotation and comments may contain hard code
        // examples without making the surrounding literal country uncertain.
        const ignored=refTokens(value).filter(ref=>!ref.unclosed).map(ref=>({start:ref.start,end:ref.end}));
        for(const match of value.matchAll(/<!--[\s\S]*?-->/g))ignored.push({start:match.index,end:match.index+match[0].length});
        const visible=applyEdits(value,mergeEditorialRanges(ignored).map(range=>({...range,text:' '.repeat(range.end-range.start)})));
        return /[\uE000-\uF8FF]/.test(visible);
    }
    function v219LatePortalPass(source,cfg={},bump=()=>{},warn=()=>{}) {
        if(typeof source!=='string'||!cfg.endMatter||!cfg.portals||cfg.sectionOnly)return source;
        const protectedSource=v24SyntaxProtected(source);
        if(protectedSource.unclosed.length)return source;
        // Comments and complete reference annotations retain their native
        // reader behavior. Unknown child calls stay visible and uncertain.
        // Only literal code, quotations and preformatted source are masked.
        const ranges=mergeEditorialRanges([
            ...protectedSource.ranges.filter(range=>range.kind!=='comment'),
            ...v219QuotedTemplateRanges(source),...v219MarkdownLiteralRanges(source)
        ]);
        // A preformatted source line may overlap a comment delimiter.
        // Masking only its closer would turn the rest of the analysis into a
        // comment and hide an existing portal. Preserve the late pass in that
        // boundary case. The ordinary original-source portal pass remains available.
        const comments=protectedSource.ranges.filter(range=>range.kind==='comment');
        if(comments.some(comment=>ranges.some(range=>
            !(range.start<=comment.start&&range.end>=comment.end)&&
            (range.start<comment.start+4&&comment.start<range.end||
             range.start<comment.end&&comment.end-3<range.end))))return source;
        let prefix='\uE000RWP';while(source.includes(prefix))prefix+='X';
        const saved=[],masked=applyEdits(source,ranges.map(range=>{
            const index=saved.push(source.slice(range.start,range.end))-1;
            return {...range,text:prefix+index+'\uE001'};
        }));
        let result=addBiographyPortal(masked,cfg,bump,warn);
        result=addAutomaticBiographyPortals(result,cfg,bump);
        result=addAutomaticTopicPortals(result,cfg,bump);
        const expression=new RegExp(prefix+'(\\d+)\\uE001','g');
        return result.replace(expression,(_,index)=>saved[Number(index)]);
    }
    // A normalized catalog key does not prove a native template's literal
    // identity. Topic inference needs the exact native family, even when
    // only its generic subject is known and a classification field is opaque.
    function v219NativeTopicBoxIdentity(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
        const parsed=parsedTemplate(raw),name=parsed.name.replace(/^(?:predefinição|template)\s*:\s*/,''),
            profile=INFOBOX_CATALOG[name];
        if(profile)return v215LiteralTemplateIdentity(raw,profile);
        const title=v219NativeTopicEmitterTitle(parsed.parts[0]);
        return !!title&&Object.prototype.hasOwnProperty.call(V219_NATIVE_TAXON_EMITTERS,title);
    }
