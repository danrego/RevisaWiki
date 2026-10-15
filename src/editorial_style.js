    const PORTUGUESE_LINK_EQUIVALENTS = Object.freeze({'Al-Kindi':'Alquindi','Ibn Muqla':'Ibne Mucla','Ibn al-Bawwab':'Ibne Albauabe','Vitruvius':'Vitrúvio','Avicenna':'Avicena','Nimrud':'Ninrude','Lente de Nimrud':'Lente de Ninrude'});
    function mergeEditorialRanges(ranges) {
        const out=[];
        for(const r of ranges.filter(r=>Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.end>r.start).sort((a,b)=>a.start-b.start||b.end-a.end)){
            if(out.length&&r.start<=out.at(-1).end)out.at(-1).end=Math.max(out.at(-1).end,r.end);else out.push({start:r.start,end:r.end});
        }
        return out;
    }
    function editorialWikiLinkRanges(source) {
        const out=[],stack=[];
        for(let i=0;i<source.length;i++){
            if(source.slice(i,i+2)==='[['){stack.push(i);i++;}
            else if(source.slice(i,i+2)===']]'&&stack.length){const start=stack.pop();out.push({start,end:i+2});i++;}
        }
        if(stack.length)out.push({start:stack[0],end:source.length});
        return out;
    }
    function portugueseEquivalent(target,label) {
        const canonical=v20WikiTarget(target);
        for(const [old,correct]of Object.entries(PORTUGUESE_LINK_EQUIVALENTS)){
            if((canonical===old||canonical===correct)&&label.trim().toLocaleLowerCase('pt')===old.toLocaleLowerCase('pt')){
                const first=label.trim()[0];return first===first.toLocaleLowerCase('pt')?correct[0].toLocaleLowerCase('pt')+correct.slice(1):correct;
            }
        }
        return null;
    }
    function canonicalPortugueseLinks(source,cfg,bump=()=>{}) {
        if(!cfg.links||!v20AutomationAllowed(source,cfg))return source;
        const protectedRanges=refTokens(source).map(r=>({start:r.start,end:r.end}));
        for(const n of templates(source).nodes)if(CITE_NAMES[parsedTemplate(source.slice(n.start,n.end)).name])protectedRanges.push(n);
        const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...protectedRanges])),edits=[];
        for(const m of shield.text.matchAll(/\[\[([^\[\]|\n]+)(?:\|([^\[\]\n]+))?\]\]/g)){
            const label=m[2]??m[1],next=portugueseEquivalent(m[1],label);
            if(!next)continue;
            const canonical=Object.entries(PORTUGUESE_LINK_EQUIVALENTS).find(([old,correct])=>v20WikiTarget(m[1])===old||v20WikiTarget(m[1])===correct)?.[1];
            const visible=next[0]===next[0].toLocaleLowerCase('pt')?canonical[0].toLocaleLowerCase('pt')+canonical.slice(1):canonical;
            const text='[['+visible+']]';if(text===m[0])continue;
            edits.push({start:m.index,end:m.index+m[0].length,text});bump('portugueseLinkNames');
        }
        return shield.restore(applyEdits(shield.text,edits));
    }
    function validRomanCentury(value) {
        const rows=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX'];
        return rows.includes(value)&&value!=='';
    }
    function repairCenturySyntax(source,cfg,bump=()=>{}) {
        if(!cfg.markup||!v20AutomationAllowed(source,cfg))return source;
        const ranges=refTokens(source).map(r=>({start:r.start,end:r.end}));
        const parsed=templates(source);
        for(const n of parsed.nodes)if(CITE_NAMES[parsedTemplate(source.slice(n.start,n.end)).name])ranges.push(n);
        for(const match of source.matchAll(/\{\{[ \t]*([^|{}\n]+)\|/g)){
            if(CITE_NAMES[norm(match[1])]&&!parsed.nodes.some(n=>n.start===match.index))ranges.push({start:match.index,end:source.length});
        }
        const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...ranges]));
        const fixed=shield.text.replace(/(?:\{\[([Ss]éc)\|([IVXLCDM]+)\}\}|\{\{([Ss]éc)\|([IVXLCDM]+)\}\])/g,(all,openName,openValue,closeName,closeValue)=>{
            const name=openName??closeName,value=openValue??closeValue;if(!validRomanCentury(value))return all;
            bump('centurySyntax');return '{{'+name+'|'+value+'}}';
        });
        return shield.restore(fixed);
    }
    function historicalDateMarkup(source,cfg,bump=()=>{}) {
        if(!cfg.markup||!v20AutomationAllowed(source,cfg))return source;
        let from=0;
        const tableRanges=literalOuterTables(source).map(raw=>{const start=source.indexOf(raw,from);from=start+raw.length;return{start,end:from};});
        const quoteRanges=[...source.matchAll(/"[^"\n]*"|“[^”\n]*”|'{2,3}[^\n]*?'{2,3}/g)].map(m=>({start:m.index,end:m.index+m[0].length}));
        const headingRanges=[...source.matchAll(/^(={2,6})[^\n]*?\1[ \t]*$/gm)].map(m=>({start:m.index,end:m.index+m[0].length}));
        const ranges=[...refTokens(source).map(r=>({start:r.start,end:r.end})),...templates(source).nodes,...editorialWikiLinkRanges(source),...tableRanges,...quoteRanges,...headingRanges];
        const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...ranges]));
        let text=shield.text.replace(/\bséculo[ \t]+([IVXLCDM]+)\b/g,(all,value)=>{if(!validRomanCentury(value))return all;bump('historicalDates');return '{{séc|'+value+'}}';});
        text=text.replace(/\b([1-9]\d{0,3}|[IVXLCDM]+)[ \t]+a\.C\.(?![\p{L}\p{N}])/gu,(all,value)=>{
            if(!/^\d+$/.test(value)&&!validRomanCentury(value))return all;
            bump('historicalDates');return '{{AC|'+value+'|x}}';
        });
        return shield.restore(text);
    }
    function captionTerminalPeriods(source,cfg,bump=()=>{}) {
        if(!cfg.markup||!v20AutomationAllowed(source,cfg))return source;
        const protectedRanges=refTokens(source).map(r=>({start:r.start,end:r.end}));
        for(const n of templates(source).nodes)if(CITE_NAMES[parsedTemplate(source.slice(n.start,n.end)).name])protectedRanges.push(n);
        const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...protectedRanges])),s=shield.text,stack=[],nodes=[];
        for(let i=0;i<s.length;i++){
            if(s.slice(i,i+2)==='[['){stack.push(i);i++;}
            else if(s.slice(i,i+2)===']]'&&stack.length){const start=stack.pop();if(!stack.length)nodes.push({start,end:i+2});i++;}
        }
        const edits=[];
        for(const node of nodes){
            const raw=s.slice(node.start,node.end);if(!/^\[\[\s*(?:Imagem|Ficheiro|Arquivo|File|Image)\s*:/i.test(raw))continue;
            const parts=splitParts(raw.slice(2,-2));if(parts.length<2)continue;
            if(!/\.(?:png|jpe?g|svg|gif|webp|tiff?)$/i.test(parts[0].trim()))continue;
            const caption=parts.at(-1),trimmed=caption.trim();
            if(preservationImageOption(caption)||/[\r\n\uE000]|<|https?:\/\//i.test(caption)||!trimmed.endsWith('.')||trimmed.endsWith('...'))continue;
            const word=trimmed.match(/([\p{L}]+)\.$/u)?.[1];
            if(word&&(word.length<3||/^(?:etc|aprox|prof|profa|pág|págs|vol|ed|fig|dr|dra|sr|sra)$/i.test(word)))continue;
            if(!word&&!/(?:\]\]|\}\}|\b[12]\d{3})\.$/.test(trimmed))continue;
            parts[parts.length-1]=caption.replace(/\.(\s*)$/,'$1');
            edits.push({...node,text:'[['+parts.join('|')+']]'});bump('captionPeriods');
        }
        return shield.restore(applyEdits(s,edits));
    }
    function technicalFinding(finding) {
        return finding.severity==='info'||/^table-(?:dynamic|nested|large|complex|year-heading|header-scope)$/.test(finding.code||'');
    }
    function groupedTechnicalFindings(findings) {
        const groups=new Map();
        for(const item of findings){const key=(item.domain||'')+'|'+(item.code||'')+'|'+item.message;
            if(groups.has(key))groups.get(key).occurrences++;else groups.set(key,{...item,occurrences:1});}
        return [...groups.values()].map(item=>({...item,message:item.message+(item.occurrences>1?' ('+item.occurrences+' ocorrências.)':'')}));
    }
