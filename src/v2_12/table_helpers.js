    Object.assign(GROUP_LABELS,{tableOppositeSpanQuotes:'Aspas incompatíveis de atributos numéricos da tabela corrigidas'});
    // Numeric formatting is opaque to the table grid, but only in an explicit
    // physical cell payload. Attribute and structural expansions stay dynamic.
    function v212TableLiteralFormatnum(source,range) {
        const raw=source.slice(range.start,range.end);
        if(!/^\{\{formatnum:[ \t]*[+\-]?\d{1,24}(?:\.\d{1,24})?[ \t]*\}\}$/i.test(raw)||!v2111ReferenceFreeTemplate(raw))return false;
        const start=source.lastIndexOf('\n',range.start-1)+1,following=source.indexOf('\n',range.end),end=following<0?source.length:following;
        if(/[\r\n]/.test(source.slice(range.start,range.end))||range.end>end)return false;
        const line=v29TablePrepared(source).view.slice(start,end),cells=v210TableCells(line,start);
        if(!cells)return false;
        const cell=cells.find(item=>item.start<=range.start&&range.end<=item.end);
        if(!cell)return false;
        const pipe=cell.view.indexOf('|');
        if(pipe>=0)return range.start>cell.start+pipe;
        // An attribute-shaped prefix without its separator cannot establish a
        // content boundary, even if the expansion itself would be numeric.
        return !/\b[a-z][a-z0-9_:-]*[ \t]*=/i.test(source.slice(cell.start,range.start));
    }
    const V212_SORT_TYPES=new Set(['currency','number','isodate','time','ipaddress','uslongdate','date','text','url']);
    function v212SortAttributes(entries,duplicates,kind) {
        const sorting=entries.filter(entry=>entry.key==='data-sort-value'||entry.key==='data-sort-type');
        if(!sorting.length)return true;
        if(kind!=='cell'||duplicates.some(entry=>entry.key==='data-sort-value'||entry.key==='data-sort-type'))return false;
        return sorting.every(entry=>entry.key==='data-sort-type'?V212_SORT_TYPES.has(entry.value.toLowerCase()):entry.value.length>0&&entry.value.length<=240&&entry.value===entry.value.trim()&&!/[\u0000-\u001f\u007f`\\]/.test(entry.value));
    }
    function v212TableOppositeSpanQuoteEdits(source,cfg={},collectOnly=false) {
        if(!v210TableEnabled(source,cfg)||!/^\s*[|!][ \t]*(?:rowspan|colspan)[ \t]*=[ \t]*(?:"[1-9]\d{0,2}'|'[1-9]\d{0,2}")[ \t]*\|/im.test(source))return [];
        const edits=[],shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source);
        for(const table of v29TableStaticBounds(source)){
            const inside=source.slice(table.openEnd,table.closeStart),matches=[...inside.matchAll(/^([ \t]*[|!][ \t]*(rowspan|colspan)[ \t]*=[ \t]*)(["'])([1-9]\d{0,2})(["'])([ \t]*\|[ \t]*)([^\r\n]+)$/gmi)].filter(match=>match[3]!==match[5]);
            if(matches.length!==1)continue;
            const match=matches[0];if(match[3]===match[5]||!match[7].trim()||/["'{}\[\]<>|=&]/.test(match[7]))continue;
            const lineStart=table.openEnd+match.index,at=lineStart+match[1].length+1+match[4].length;
            if(shield.ranges.some(range=>range.start<=lineStart&&lineStart<range.end)||markdown.some(range=>range.start<=lineStart&&lineStart<range.end))continue;
            const local=[{start:at,end:at+1,text:match[3],ruleId:'tableOppositeSpanQuotes',proof:{key:match[2].toLowerCase(),value:match[4],openingQuote:match[3],replacedQuote:match[5],content:match[7]}}];
            edits.push(...(collectOnly?v210TableRawBound(table,local):v210TableBoundEdits(source,table,local,'sole positive integer span and one opposite terminal quote; explicit separator and nonempty static payload; unique complete regular grid; only the closing quote changes')));
        }
        return edits;
    }
    function v212FixedTableWidth(table) {
        if(!table.attrs.valid||table.attrs.attrs.some(attr=>!['class','style','width'].includes(attr.key)))return null;
        const classes=table.attrs.attrs.filter(attr=>attr.key==='class'),styles=table.attrs.attrs.filter(attr=>attr.key==='style'),widths=table.attrs.attrs.filter(attr=>attr.key==='width');
        if(classes.length!==1||styles.length>1||widths.length>1||!/^(?:wikitable(?: sortable)?|sortable wikitable)$/.test(classes[0].value||''))return null;
        const css=new Map(),raw=styles[0]?.value||'';
        if(/[{}\[\]<>\\]|\/\*|\*\//.test(raw))return null;
        for(const part of raw.split(';')){if(!part.trim())continue;const match=/^\s*([a-z-]+)\s*:\s*([^;]+?)\s*$/i.exec(part);if(!match)return null;const key=match[1].toLowerCase(),value=match[2].toLowerCase();if(css.has(key)||!['width','table-layout'].includes(key))return null;css.set(key,value);}
        if(css.has('table-layout')&&css.get('table-layout')!=='fixed'||widths.length&&css.has('width'))return null;
        const value=widths.length?widths[0].value:css.get('width'),pattern=widths.length?/^[1-9]\d{2,3}$/:/^[1-9]\d{2,3}px$/;
        if(typeof value!=='string'||!pattern.test(value))return null;
        const pixels=parseInt(value,10);return pixels>=640?{pixels,kind:widths.length?'native-width':'css-width'}:null;
    }
    function v212FixedWidthTableEdits(source,cfg={}) {
        if(!v29TableEnabled(source,cfg)||cfg.responsiveTableWrappers===false||v24SyntaxScan(source).issues.length)return [];
        const edits=[],prepared=v272LiteralTables(source),shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),hash=v24SyntaxHash(source);
        for(const [tableIndex,table]of prepared.tables.entries()){
            const width=v212FixedTableWidth(table);if(!width||table.nested||table.end-table.start>500000||!v210ResponsiveTopLevel(source,table.start)||!v29TableStaticBounds(source).some(item=>item.start===table.start)||!v29TableModel(source,table))continue;
            if(shield.ranges.some(range=>range.start<=table.start&&range.end>table.start)||markdown.some(range=>range.start<=table.start&&range.end>table.start)||/<\/?(?:table|tr|td|th|thead|tbody|tfoot|div)\b/i.test(prepared.view.slice(table.openEnd,table.closeStart)))continue;
            const newline=source.slice(table.start,table.end).includes('\r\n')?'\r\n':'\n';if(source.slice(table.end-newline.length,table.end)!==newline)continue;
            const proof={sourceHash:hash,tableIndex,tableStart:table.start,tableEnd:table.end,tableSourceHash:v24SyntaxHash(source.slice(table.start,table.end)),widthPixels:width.pixels,widthKind:width.kind,condition:'unwrapped complete top-level regular literal wikitable; sole fixed pixel width of at least 640px; no HTML ancestor, custom style, presentation or nested table; exact original table bytes retained in bounded scroll container'};
            edits.push({start:table.start,end:table.start,text:'<div style="max-width:100%;min-width:0;overflow-x:auto;">'+newline,ruleId:'responsiveTableWrapper',proof},{start:table.end,end:table.end,text:'</div>'+newline,ruleId:'responsiveTableWrapper',proof});
        }
        return edits;
    }
