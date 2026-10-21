    // Pure-reader fast paths. Invalid or coercive inputs retain the original algorithm.
    var v219TemplateTitleCache;
    function v219TemplateTitle(value) {
        if(typeof value!=='string'||value.length>512)return v219LegacyTemplateTitle(value);
        v219TemplateTitleCache||=new Map();
        if(v219TemplateTitleCache.has(value))return v219TemplateTitleCache.get(value);
        const result=v219LegacyTemplateTitle(value);
        if(v219TemplateTitleCache.size>=2048)v219TemplateTitleCache.delete(v219TemplateTitleCache.keys().next().value);
        v219TemplateTitleCache.set(value,result);return result;
    }
    function v219MaskRanges(source,ranges) {
        if(typeof source!=='string'||!Array.isArray(ranges)||Object.getPrototypeOf(ranges)!==Array.prototype||
            Object.hasOwn(ranges,Symbol.iterator))return v219LegacyMaskRanges(source,ranges);
        const valid=[];
        for(let i=0;i<ranges.length;i++){
            const item=Object.getOwnPropertyDescriptor(ranges,String(i));
            if(!item||!Object.hasOwn(item,'value'))return v219LegacyMaskRanges(source,ranges);
            const r=item.value,a=r&&Object.getOwnPropertyDescriptor(r,'start'),b=r&&Object.getOwnPropertyDescriptor(r,'end');
            if(!a||!b||!Object.hasOwn(a,'value')||!Object.hasOwn(b,'value')||!Number.isInteger(a.value)||
                !Number.isInteger(b.value)||a.value<0||b.value<a.value||b.value>source.length)return v219LegacyMaskRanges(source,ranges);
            if(a.value!==b.value)valid.push([a.value,b.value]);
        }
        if(!valid.length)return source;
        valid.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
        const merged=[];for(const r of valid){const last=merged[merged.length-1];if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push(r);}
        const out=[];let at=0;
        for(const [start,end]of merged){out.push(source.slice(at,start),source.slice(start,end).replace(/[^\r\n]+/g,value=>' '.repeat(value.length)));at=end;}
        out.push(source.slice(at));return out.join('');
    }
    function v219ReaderPerformanceStatus() {
        return {templateTitles:{entries:v219TemplateTitleCache?.size||0,maximumEntries:2048,maximumKeyLength:512}};
    }
