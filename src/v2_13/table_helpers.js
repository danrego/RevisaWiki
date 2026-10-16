    Object.assign(GROUP_LABELS,{
        tableOpeningSpanQuotes:'Aspas iniciais de atributos numéricos da tabela repostas',
        tableSpanEquals:'Sinais de igual dos atributos numéricos da tabela repostos',
        tableSpanAttributeTypos:'Nomes incorretos de atributos numéricos da tabela corrigidos',
        tableMixedSpanQuotes:'Aspas retas e tipográficas misturadas na tabela corrigidas',
        tableDuplicateSortValues:'Atributos idênticos de ordenação repetidos retirados',
        tableSortAttributeTypos:'Nomes incorretos de atributos de ordenação corrigidos'
    });
    const V213_SPAN_TYPOS=Object.freeze({colpan:'colspan',colpsan:'colspan',rowpan:'rowspan',rowpsan:'rowspan'});
    const V213_SORT_TYPOS=Object.freeze({'data-sort-vaule':'data-sort-value','data-srot-value':'data-sort-value','data-sort-tyep':'data-sort-type'});
    function v213TableFiniteTrigger(source) {
        return /\b(?:rowpan|rowpsan|colpan|colpsan|data-sort-vaule|data-srot-value|data-sort-tyep)\b|\b(data-sort-(?:value|type))[ \t]*=[^|\r\n]*\b\1[ \t]*=|\b(?:rowspan|colspan)[ \t]*(?:["'][1-9]\d{0,2}["']|=[ \t]*(?:[1-9]\d{0,2}["']|["'][1-9]\d{0,2}[”’]|[“‘][1-9]\d{0,2}["']))/i.test(source);
    }
    function v213TableCellParsingLine(line) {
        // This length-preserving view only exposes a separator hidden by a
        // mixed quote. Candidates and edits always use the original bytes.
        return line.replace(/\b((?:rowspan|colspan)[ \t]*=[ \t]*)(["'“‘])([1-9]\d{0,2})(["'”’])/gi,(whole,prefix,open,value,close)=>{
            const pairs={'"”':'"','“"':'"',"'’":"'","‘'":"'"},quote=pairs[open+close];return quote?prefix+quote+value+quote:whole;
        });
    }
    function v213TableSpanCandidate(attrs,start,payload) {
        if(!payload.trim()||/["'{}\[\]<>|=&“”‘’]/.test(payload))return null;
        let match=/^([ \t]*)(rowspan|colspan)([ \t]*=[ \t]*)([1-9]\d{0,2})(["'])([ \t]*)$/i.exec(attrs);
        if(match&&+match[4]>1){const at=start+match[1].length+match[2].length+match[3].length;return {start:at,end:at,text:match[5],ruleId:'tableOpeningSpanQuotes',proof:{key:match[2].toLowerCase(),value:match[4]}};}
        match=/^([ \t]*)(rowspan|colspan)([ \t]*)(["'])([1-9]\d{0,2})\4([ \t]*)$/i.exec(attrs);
        if(match&&+match[5]>1){const at=start+match[1].length+match[2].length+match[3].length;return {start:at,end:at,text:'=',ruleId:'tableSpanEquals',proof:{key:match[2].toLowerCase(),value:match[5]}};}
        match=/^([ \t]*)(colpan|colpsan|rowpan|rowpsan)([ \t]*=[ \t]*)(["'])([1-9]\d{0,2})\4([ \t]*)$/i.exec(attrs);
        if(match&&+match[5]>1){const at=start+match[1].length;return {start:at,end:at+match[2].length,text:V213_SPAN_TYPOS[match[2].toLowerCase()],ruleId:'tableSpanAttributeTypos',proof:{key:match[2].toLowerCase(),value:match[5]}};}
        match=/^([ \t]*)(rowspan|colspan)([ \t]*=[ \t]*)(["'“‘])([1-9]\d{0,2})(["'”’])([ \t]*)$/i.exec(attrs);
        if(match&&+match[5]>1){const pair=match[4]+match[6],allowed={'"”':['end','"'],'“"':['start','"'],"'’":['end',"'"],"‘'":[ 'start',"'"]},repair=allowed[pair];if(repair){const at=start+match[1].length+match[2].length+match[3].length+(repair[0]==='end'?1+match[5].length:0);return {start:at,end:at+1,text:repair[1],ruleId:'tableMixedSpanQuotes',proof:{key:match[2].toLowerCase(),value:match[5]}};}}
        return null;
    }
    function v213TableSortCandidate(attrs,start,kind,sortable) {
        if(!sortable||!/[ \t]data-(?:sort-value|sort-type|sort-vaule|srot-value|sort-tyep)[ \t]*=/i.test(' '+attrs))return null;
        const allowed=new Set([...V29_TABLE_ATTRIBUTES.cell,...Object.keys(V213_SORT_TYPOS)]),parsed=v25SafeAttributes(' '+attrs,allowed);
        if(!parsed)return null;
        const edits=[],typos=parsed.entries.filter(entry=>Object.hasOwn(V213_SORT_TYPOS,entry.key));
        if(typos.length>1||parsed.duplicates.some(entry=>!['data-sort-value','data-sort-type'].includes(entry.key)))return null;
        for(const entry of typos){const target=V213_SORT_TYPOS[entry.key];if(parsed.entries.some(other=>other!==entry&&(other.key===target||V213_SORT_TYPOS[other.key]===target)))return null;
            if(target==='data-sort-type'&&(kind!=='!'||!V212_SORT_TYPES.has(entry.value.toLowerCase())))return null;
            if(target==='data-sort-value'&&(!entry.value||entry.value!==entry.value.trim()||entry.value.length>240||/[\u0000-\u001f\u007f`\\]/.test(entry.value)))return null;
            const raw=(' '+attrs).slice(entry.start,entry.end),keyAt=raw.search(/[A-Za-z]/),at=start+entry.start-1+keyAt;
            edits.push({start:at,end:at+entry.key.length,text:target,ruleId:'tableSortAttributeTypos',proof:{key:entry.key,target,value:entry.value}});
        }
        for(const entry of parsed.duplicates){if(entry.key==='data-sort-type'&&(kind!=='!'||!V212_SORT_TYPES.has(entry.value.toLowerCase())))return null;edits.push({start:start+Math.max(0,entry.start-1),end:start+entry.end-1,text:'',ruleId:'tableDuplicateSortValues',proof:{key:entry.key,value:entry.value}});}
        return edits.length?{edits,typos:typos.length}:null;
    }
    function v213TableFiniteRepairEdits(source,cfg={},collectOnly=false) {
        if(!v210TableEnabled(source,cfg)||!v213TableFiniteTrigger(source))return [];
        const edits=[],shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source);
        for(const table of v29TableStaticBounds(source)){
            const sortable=table.attrs.attrs.some(attr=>attr.key==='class'&&/\bsortable\b/.test(attr.value||'')),local=[],structural=[],unknown=[];let invalid=false;
            for(const line of v210TableLines(source,table)){
                const cells=v210TableCells(v213TableCellParsingLine(line.text),line.start);if(cells===null){invalid=true;break;}
                for(const cell of cells){const pipe=cell.view.indexOf('|');if(pipe<0)continue;const attrs=cell.raw.slice(0,pipe),payload=cell.raw.slice(pipe+1);
                    if(shield.ranges.some(range=>range.start<=cell.start&&cell.start<range.end)||markdown.some(range=>range.start<=cell.start&&cell.start<range.end)){invalid=true;break;}
                    const original=source.slice(cell.start,cell.end),span=v213TableSpanCandidate(original.slice(0,pipe),cell.start,original.slice(pipe+1));if(span){Object.assign(span.proof,{attributeStart:cell.start,attributeEnd:cell.start+pipe});structural.push(span);local.push(span);continue;}
                    const sorting=v213TableSortCandidate(attrs,cell.start,cell.kind,sortable);if(sorting){for(const edit of sorting.edits)Object.assign(edit.proof,{attributeStart:cell.start,attributeEnd:cell.start+pipe});local.push(...sorting.edits);if(sorting.typos)unknown.push(...sorting.edits.filter(edit=>edit.ruleId==='tableSortAttributeTypos'));}
                }
                if(invalid)break;
            }
            if(invalid||!local.length||structural.length>1||unknown.length>1||structural.length&&unknown.length)continue;
            const candidate=v210TableCandidate(source,table,local);if(!candidate)continue;
            // The malformed span must be necessary to recover this table. A
            // valid span-one spelling is not rewritten as a style preference.
            if(structural.length&&v29TableModel(source,table))continue;
            edits.push(...(collectOnly?v210TableRawBound(table,local):v210TableBoundEdits(source,table,local,'one finite literal span defect or one native sort-field misspelling; exact equal sort duplicates only; complete regular candidate; all cell payloads, values, order and unrelated attributes retained')));
        }
        return edits;
    }
    function v213TableFiniteRepairPlan(source,cfg={}) {
        const edits=v213TableFiniteRepairEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v213TableFiniteRepairProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const fresh=v213TableFiniteRepairPlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v213TableCountWitnesses(source) {
        if(!v213TableFiniteTrigger(source))return [];
        const joint=v25SafeRepairPlan(source,{...DEFAULTS,namespaceNumber:0}),witnesses=[],seen=new Set();
        for(const step of joint.steps){if(step.name!=='v210-table-syntax')continue;
            const prior=v27RawDiff(source,step.before);
            const take=(edit,current,original,base)=>{
                if(!['tableOpeningSpanQuotes','tableSpanEquals','tableSpanAttributeTypos','tableMixedSpanQuotes','tableDuplicateSortValues','tableSortAttributeTypos'].includes(edit.ruleId))return;
                const local=v27RawDiff(original,current),map=(position,right=false)=>v211CountAnchor(base+v211CountAnchor(position,local,true,right),prior,true,right),start=map(edit.start),end=map(edit.end,true),attributeStart=map(edit.proof.attributeStart),attributeEnd=map(edit.proof.attributeEnd,true);
                if(source.slice(start,end)!==current.slice(edit.start,edit.end)||source.slice(attributeStart,attributeEnd)!==current.slice(edit.proof.attributeStart,edit.proof.attributeEnd))return;
                const key=start+':'+end+':'+edit.ruleId;if(seen.has(key))return;seen.add(key);witnesses.push({...edit,start,end,proof:{...edit.proof,attributeStart,attributeEnd}});
            };
            for(const edit of step.edits){if(edit.ruleId!=='tableSyntaxTransactions'){take(edit,step.before,step.before,0);continue;}
                const original=step.before.slice(edit.start,edit.end);let current=original;
                for(const repair of edit.proof.repairs){for(const member of repair.edits)take(member,current,original,edit.start);current=v24SyntaxApply(current,repair.edits);}
            }
        }
        if(witnesses.some(edit=>edit.ruleId==='tableDuplicateSortValues')){
            const mapped=v27RawDiff(source,joint.text);
            for(const repair of tableAnalysis(joint.text).repairs.filter(item=>item.rule==='tableHeaderScopes')){
                const start=v211CountAnchor(repair.start,mapped,true),end=v211CountAnchor(repair.end,mapped,true,true);
                if(start===end)witnesses.push({start,end,text:repair.after,ruleId:'tableHeaderScopes',proof:{optionalScope:true}});
            }
        }
        return witnesses;
    }
