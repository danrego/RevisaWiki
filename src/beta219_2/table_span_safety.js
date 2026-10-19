    // A positive rowspan can create implied rows in the native HTML table
    // model. Counting explicit source rows cannot prove a smaller value is
    // equivalent. Keep the diagnostic candidate available to refusal guards,
    // but do not apply that numeric rewrite.
    function v219TableSourceIsLiteral(source,start,end) {
        if(typeof source!=='string'||!Number.isInteger(start)||!Number.isInteger(end)||
            start<0||end<start||end>source.length)return false;
        // Protected owners can hide row-producing templates in an earlier
        // masked view. A literal grid proof cannot infer what they emit.
        return !/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u.test(source.slice(start,end));
    }
    function v219HeaderScopeSourceAllowed(repair,source) {
        if(!repair||repair.rule!=='tableHeaderScopes')return true;
        if(typeof source!=='string'||!Number.isInteger(repair.start)||repair.start<0||repair.start>source.length)return false;
        let end=source.indexOf('\n',repair.start);if(end<0)end=source.length;
        const raw=source.slice(repair.start,end);
        if(!/^\s*[a-zA-Z_:][\w:.-]*\s*=/.test(raw))return true;
        // Native parsing can recover an unterminated attribute quote. Adding
        // a new attribute separator before it would expose that source as
        // cell text. Do not guess a closing quote or reinterpret the prefix.
        const separator=tableCellView(raw).indexOf('|');
        return separator>=0&&tableAttrs(raw.slice(0,separator),repair.start).valid;
    }
    function v219TableAutomaticRepairAllowed(repair,source,analysis) {
        if(!repair||repair.rule==='tableSpanRepairs')return false;
        if(source===undefined)return true;
        if(typeof source!=='string'||!Number.isInteger(repair.start)||!Number.isInteger(repair.end)||
            repair.start<0||repair.end<repair.start||repair.end>source.length||
            !analysis||!Array.isArray(analysis.tables))return false;
        const owners=analysis.tables.filter(table=>Number.isInteger(table.start)&&Number.isInteger(table.end)&&
            table.start<=repair.start&&repair.end<=table.end);
        return owners.length>0&&owners.every(table=>v219TableSourceIsLiteral(source,table.start,table.end))&&
            v219HeaderScopeSourceAllowed(repair,source);
    }
