    Object.assign(GROUP_LABELS,{tableSyntaxTransactions:'Sintaxe de tabelas corrigida',tableEmptyRowMarkers:'Separadores de linha sem conteúdo retirados',tableAttributeSeparators:'Separadores de atributos e células repostos',tableTypographicSpanQuotes:'Aspas de atributos numéricos da tabela corrigidas',tableMixedClosers:'Fechamento incompatível da tabela corrigido',tableDeepLeafScopes:'Alcance dos cabeçalhos individuais de coluna informado'});
    const V210_TABLE_STAGE_NAMES=Object.freeze(['v210-table-syntax','v210-table-deep-leaf-scopes']);
    function v210TableEnabled(source,cfg={}) {return v29TableEnabled(source,cfg)&&cfg.tableSyntaxRepairs!==false;}
    function v210TableLines(source,table) {
        const result=[];let start=table.openEnd;
        for(const raw of source.slice(table.openEnd,table.closeStart).match(/[^\n]*(?:\n|$)/g)||[]){if(!raw)continue;result.push({start,end:start+raw.length,raw,text:raw.replace(/\r?\n$/,'')});start+=raw.length;}
        return result;
    }
    function v210TableCells(line,offset=0) {
        const first=/^[ \t]*([!|])/.exec(line);if(!first||/^\s*\|[-+}]/.test(line))return [];
        let invalid=false;const mask=tableCellView(line,()=>{invalid=true;});if(invalid)return null;
        const cuts=[{at:first[0].length,kind:first[1]}],pattern=first[1]==='!'?/!!|\|\|/g:/\|\|/g;pattern.lastIndex=first[0].length;let match;
        while((match=pattern.exec(mask)))cuts.push({at:match.index+2,kind:match[0]==='!!'?'!':'|'});
        return cuts.map((cut,index)=>{const end=index+1<cuts.length?cuts[index+1].at-2:line.length;return {kind:cut.kind,start:offset+cut.at,end:offset+end,raw:line.slice(cut.at,end),view:mask.slice(cut.at,end)};});
    }
    function v210TableCandidate(source,table,edits) {
        if(!edits.length)return null;const next=v24SyntaxApply(source,edits),candidate=v29TableStaticBounds(next).find(item=>item.start===table.start);
        if(!candidate||v24SyntaxScan(next.slice(candidate.start,candidate.end)).issues.length)return null;
        const model=v29TableModel(next,candidate);return model?{text:next,table:candidate,model,index:v272LiteralTables(next).tables.findIndex(item=>item.start===candidate.start)}:null;
    }
    function v210TableBoundEdits(source,table,edits,condition) {
        const result=v210TableCandidate(source,table,edits);if(!result)return [];
        return edits.map(edit=>({...edit,proof:{sourceHash:v24SyntaxHash(source),tableStart:table.start,tableEnd:table.end,tableIndex:result.index,condition,...edit.proof}}));
    }
    function v210TableRawBound(table,edits) {return edits.map(edit=>({...edit,proof:{tableStart:table.start,tableEnd:table.end,...edit.proof}}));}
    function v210TableEmptyRowEdits(source,cfg={},collectOnly=false) {
        if(!v210TableEnabled(source,cfg)||!/^\s*\|-[ \t]*\r?\n(?:[ \t]*\r?\n)*[ \t]*\|[-}]/m.test(source))return [];
        const edits=[];
        for(const table of v29TableStaticBounds(source)){
            const lines=v210TableLines(source,table),local=[];let previous=null;
            for(const line of lines){
                if(/^[ \t]*\|-[ \t]*$/.test(line.text)){
                    if(previous)local.push({start:line.start,end:line.end,text:'',ruleId:'tableEmptyRowMarkers',proof:{marker:'consecutive'}});
                    else previous=line;
                }else if(line.text.trim())previous=null;
            }
            if(previous)local.push({start:previous.start,end:previous.end,text:'',ruleId:'tableEmptyRowMarkers',proof:{marker:'terminal'}});
            const unique=[...new Map(local.map(edit=>[edit.start,edit])).values()];
            edits.push(...(collectOnly?v210TableRawBound(table,unique):v210TableBoundEdits(source,table,unique,'attribute-free adjacent or final row marker; no intervening content; complete static table and unchanged ordered nonempty rows')));
        }
        return edits;
    }
    function v210TableCurlyQuoteEdits(source,cfg={},collectOnly=false) {
        if(!v210TableEnabled(source,cfg)||!/\b(?:rowspan|colspan)[ \t]*=[ \t]*[“‘]/i.test(source))return [];
        const edits=[];
        for(const table of v29TableStaticBounds(source)){
            const local=[];
            for(const line of v210TableLines(source,table)){
                const cells=v210TableCells(line.text,line.start);if(!cells)continue;
                for(const cell of cells){
                    const pipe=cell.view.indexOf('|'),normalizedRaw=cell.raw.replace(/\b(rowspan|colspan)([ \t]*=[ \t]*)(?:“([1-9]\d{0,2})”|‘([1-9]\d{0,2})’)/gi,(_,key,equal,a,b)=>key+equal+'"'+(a||b)+'"'),missing=pipe<0?v210TableMissingBarPrefix(normalizedRaw):null;
                    if(pipe<0&&!missing)continue;const attrs=cell.raw.slice(0,pipe<0?missing.at:pipe);
                    if(/[{}\[\]<>|&\r\n]/.test(attrs))continue;
                    const matches=[...attrs.matchAll(/\b(rowspan|colspan)([ \t]*=[ \t]*)(“([1-9]\d{0,2})”|‘([1-9]\d{0,2})’)/gi)];if(!matches.length)continue;
                    const normalized=attrs.replace(/\b(rowspan|colspan)([ \t]*=[ \t]*)(?:“([1-9]\d{0,2})”|‘([1-9]\d{0,2})’)/gi,(_,key,equal,a,b)=>key+equal+'"'+(a||b)+'"');
                    if(!v29TableAttributes(normalized,cell.start,'cell'))continue;
                    for(const match of matches){const at=cell.start+match.index+match[1].length+match[2].length,value=match[4]||match[5];local.push({start:at,end:at+value.length+2,text:'"'+value+'"',ruleId:'tableTypographicSpanQuotes',proof:{key:match[1].toLowerCase(),value}});}
                }
            }
            edits.push(...(collectOnly?v210TableRawBound(table,local):v210TableBoundEdits(source,table,local,'paired typographic quotes surround a positive literal integer span in an explicit attribute field; complete regular table and unchanged cell content')));
        }
        return edits;
    }
    function v210TableMissingBarPrefix(raw) {
        let at=0,meaningful=false,count=0;const attributes=[];
        while(at<raw.length){
            const match=/^[ \t]*([A-Za-z][A-Za-z0-9_-]*)[ \t]*=[ \t]*(?:"([^"<>\r\n]*)"|'([^'<>\r\n]*)')/.exec(raw.slice(at));
            if(!match)break;const key=match[1].toLowerCase();if(!V29_TABLE_ATTRIBUTES.cell.has(key))return null;
            attributes.push([key,match[2]??match[3]]);meaningful||=['scope','rowspan','colspan'].includes(key);at+=match[0].length;count++;
            if(!/^[ \t]+/.test(raw.slice(at)))return null;
        }
        if(!count||!meaningful||!at)return null;
        const rest=raw.slice(at),label=rest.trim();
        if(!label||/[{}<>|&\r\n“”‘’]/.test(label)||/^[A-Za-z][\w:-]*\s*=/.test(label)||/^["']|["']$/.test(label)||/^(?:rowspan|colspan|scope|class|style|align|valign|width|height|bgcolor)\b/i.test(label))return null;
        const parsed=v29TableAttributes(raw.slice(0,at),0,'cell');if(!parsed)return null;
        const scope=parsed.values.get('scope');if(scope&&!['col','row'].includes(scope))return null;
        return {at,attributes,label,prefix:raw.slice(0,at)};
    }
    function v210TableMissingBarEdits(source,cfg={},collectOnly=false) {
        if(!v210TableEnabled(source,cfg)||!/^[ \t]*[!|][^\r\n]*\b(?:scope|rowspan|colspan)[ \t]*=[ \t]*["']/im.test(source))return [];
        const edits=[];
        for(const table of v29TableStaticBounds(source)){
            const local=[];
            for(const line of v210TableLines(source,table)){
                const cells=v210TableCells(line.text,line.start);if(!cells)continue;
                for(const cell of cells){
                    if(cell.view.includes('|'))continue;
                    const prefix=v210TableMissingBarPrefix(cell.raw);if(!prefix)continue;
                    const scope=prefix.attributes.find(([key])=>key==='scope')?.[1];if(scope&&cell.kind!=='!')continue;
                    local.push({start:cell.start+prefix.at,end:cell.start+prefix.at,text:' |',ruleId:'tableAttributeSeparators',proof:{attributes:prefix.attributes,label:prefix.label,kind:cell.kind}});
                }
            }
            edits.push(...(collectOnly?v210TableRawBound(table,local):v210TableBoundEdits(source,table,local,'only a fully quoted recognized attribute prefix with an explicit scope or span; exactly one missing content bar; complete regular grid and unchanged following label')));
        }
        return edits;
    }
    function v210TableMixedCloserEdits(source,cfg={},collectOnly=false) {
        if(!v210TableEnabled(source,cfg)||!/^\s*<\/table[ \t]*>[ \t]*$/im.test(source))return [];
        const prepared=v29TablePrepared(source),protectedRanges=v24SyntaxProtected(source).ranges,markdown=v27SafeMarkdownRanges(source),stack=[],candidates=[];
        for(const match of prepared.view.matchAll(/^[ \t]*(\{\|[^\r\n]*|\|\}[^\r\n]*|<\/table[ \t]*>[ \t]*)(?:\r?\n|$)/gmi)){
            const token=match[1],start=match.index,end=start+match[0].length;
            if(token.startsWith('{|')){
                if(stack.length)for(const item of stack)item.nested=true;
                const opening=source.slice(start,end),attrs=tableAttrs(opening.replace(/^[ \t]*\{\|/,'').trim(),start);stack.push({start,openEnd:end,nested:stack.length>0,attrs});
            }else if(token.startsWith('|}')){if(stack.length)stack.pop();}
            else if(stack.length){
                const table=stack.pop();if(table.nested||stack.length)continue;table.closeStart=start;table.end=end;
                const inside=source.slice(table.openEnd,start);if(!table.attrs.valid||inside.length>500000||/<\/?(?:table|tr|td|th|thead|tbody|tfoot)\b/i.test(inside)||protectedRanges.some(range=>range.start<=table.start&&table.start<range.end)||markdown.some(range=>range.start<=table.start&&table.start<range.end))continue;
                const local=[{start:start+match[0].indexOf('<'),end:start+match[0].indexOf('>')+1,text:'|}',ruleId:'tableMixedClosers',proof:{closer:'</table>'}}];
                candidates.push(...(collectOnly?v210TableRawBound(table,local):v210TableBoundEdits(source,table,local,'one explicit unmatched literal wikitable; isolated HTML closing tag without any HTML table opening or nested table; candidate closes the same complete regular grid')));
            }
        }
        return candidates;
    }
    function v210TableSyntaxEdits(source,cfg={}) {
        if(!v210TableEnabled(source,cfg)||!/^\s*\|-[ \t]*\r?\n(?:[ \t]*\r?\n)*[ \t]*\|[-}]|\b(?:rowspan|colspan)[ \t]*=[ \t]*[“‘]|^[ \t]*[!|][^\r\n]*\b(?:scope|rowspan|colspan)[ \t]*=[ \t]*["']|^\s*<\/table[ \t]*>[ \t]*$/im.test(source))return [];
        const tables=v29TableStaticBounds(source).slice(),mixed=v210TableMixedCloserEdits(source,cfg,true);
        for(const edit of mixed)if(!tables.some(table=>table.start===edit.proof.tableStart))tables.push({start:edit.proof.tableStart,end:edit.proof.tableEnd});
        tables.sort((a,b)=>a.start-b.start);const transactions=[],sourceHash=v24SyntaxHash(source);
        for(const table of tables){
            const original=source.slice(table.start,table.end);let current=original;const repairs=[];
            for(const find of [v210TableMixedCloserEdits,v210TableEmptyRowEdits,v210TableCurlyQuoteEdits,v210TableMissingBarEdits]){
                const edits=find(current,cfg,true);if(!edits.length)continue;const before=current;current=v24SyntaxApply(current,edits);repairs.push({beforeHash:v24SyntaxHash(before),afterHash:v24SyntaxHash(current),edits});
            }
            if(current===original)continue;
            for(const find of [v272TableCellEdits,v29TableSyntaxEdits,v29TableDuplicateAttributeEdits]){const edits=find(current,cfg);if(!edits.length)continue;const before=current;current=v24SyntaxApply(before,edits);repairs.push({beforeHash:v24SyntaxHash(before),afterHash:v24SyntaxHash(current),edits});}
            const bounded=v29TableStaticBounds(current);if(bounded.length!==1||bounded[0].start!==0||bounded[0].end!==current.length||v24SyntaxScan(current).issues.length||!v29TableModel(current,bounded[0]))continue;
            transactions.push({start:table.start,end:table.end,text:current,ruleId:'tableSyntaxTransactions',ruleIds:[...new Set(repairs.flatMap(step=>step.edits.map(edit=>edit.ruleId)))],proof:{sourceHash,tableStart:table.start,tableEnd:table.end,repairs,changeRules:repairs.flatMap(step=>step.edits.map(edit=>edit.ruleId)),condition:'one complete independently bounded literal table; all finite syntax repairs jointly yield a regular grid; every byte outside the table remains unchanged'}});
        }
        const projected=v24SyntaxApply(source,transactions),afterTables=v272LiteralTables(projected).tables;let delta=0;
        for(const edit of transactions){const start=edit.start+delta;edit.proof.tableIndex=afterTables.findIndex(table=>table.start===start);delta+=edit.text.length-(edit.end-edit.start);}
        return transactions.filter(edit=>edit.proof.tableIndex>=0);
    }
    function v210TableDeepLeafScopeEdits(source,cfg={}) {
        if(!v210TableEnabled(source,cfg)||cfg.tableAccessibility===false||!/^[ \t]*![^\r\n]*\bcolspan[ \t]*=/im.test(source))return [];
        const edits=[];
        for(const table of v29TableStaticBounds(source)){
            const model=v29TableModel(source,table);if(!model||v24SyntaxScan(source.slice(table.start,table.end)).issues.length||model.width<4||model.width>32||model.rows.length<4||model.cells.some(cell=>cell.rowspan!==1||cell.attrs.values.has('rowspan')))continue;
            let tierCount=0;while(tierCount<model.rows.length&&model.rows[tierCount].cells.every(cell=>cell.kind==='!'))tierCount++;
            if(tierCount<3||tierCount>4||tierCount>=model.rows.length)continue;
            const tiers=model.rows.slice(0,tierCount),groups=tiers.slice(0,-1),leaves=tiers.at(-1),body=model.rows.slice(tierCount);
            if(groups.some(row=>!row.cells.length||row.cells.some(cell=>cell.colspan<2||!cell.attrs.values.has('colspan')||cell.attrs.values.has('scope')||!v29TableHeaderText(cell.content))))continue;
            if(leaves.cells.length!==model.width||leaves.cells.some(cell=>cell.colspan!==1||!v29TableHeaderText(cell.content)||cell.attrs.values.has('scope')&&cell.attrs.values.get('scope')!=='col'))continue;
            if(body.some(row=>row.cells.length!==model.width||row.cells.some((cell,index)=>cell.colspan!==1||index>0&&cell.kind!=='|'||cell.attrs.values.has('scope')&&!(index===0&&cell.kind==='!'&&cell.attrs.values.get('scope')==='row'))))continue;
            let strictSplit=false,valid=true;
            for(let index=1;index<groups.length;index++){
                const above=groups[index-1].cells;
                for(const cell of groups[index].cells){const containers=above.filter(parent=>parent.column<=cell.column&&parent.column+parent.colspan>=cell.column+cell.colspan);if(containers.length!==1){valid=false;break;}if(containers[0].colspan>cell.colspan)strictSplit=true;}
                if(!valid)break;
            }
            if(!valid||!strictSplit)continue;
            const index=v272LiteralTables(source).tables.findIndex(item=>item.start===table.start);
            for(const cell of leaves.cells){if(cell.attrs.values.has('scope'))continue;const hasAttrs=cell.attrsEnd!==null,text=hasAttrs?' scope="col"'+(/^[ \t]/.test(source.slice(cell.start,cell.start+1))?'':' '):' scope="col" |';edits.push({start:cell.start,end:cell.start,text,ruleId:'tableDeepLeafScopes',proof:{sourceHash:v24SyntaxHash(source),tableStart:table.start,tableEnd:table.end,tableIndex:index,column:cell.column,width:model.width,tiers:tierCount,content:cell.content,condition:'three or four explicit header tiers; noncrossing nested colspan partitions; complete span-one leaf columns and regular literal body; no rowspan, custom associations or conflicting scope'}});}
        }
        return edits;
    }
    function v210TableRepairPlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};
        const rules=[[V210_TABLE_STAGE_NAMES[0],v210TableSyntaxEdits],[V210_TABLE_STAGE_NAMES[1],v210TableDeepLeafScopeEdits]];
        for(const [name,find]of rules){const edits=find(plan.text,cfg);if(!edits.length)continue;const before=plan.text;plan.text=v24SyntaxApply(before,edits);plan.steps.push({name,before,after:plan.text,edits});plan.edits.push(...edits);}
        return plan;
    }
    function v210TableRepairProof(before,after,plan,cfg={}) {if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v210TableRepairPlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(plan.steps)===JSON.stringify(fresh.steps)&&JSON.stringify(plan.edits)===JSON.stringify(fresh.edits);}
    function v210TableProjection(source,cfg={}) {return v210TableRepairPlan(source,cfg).text;}
    function v210TableObjectProof(plan,expected,actual) {
        const steps=(plan.safe?.steps||plan.steps||[]).filter(step=>V210_TABLE_STAGE_NAMES.includes(step.name));if(!steps.length)return {accepted:true,reason:''};
        const cfg=plan.cfg||{},indexes=new Set(steps.flatMap(step=>step.edits.map(edit=>edit.proof.tableIndex))),before=v272TableInventories(expected,cfg),after=v24InventoryCount(v272TableInventories(actual,cfg)),wanted=v24InventoryCount([...indexes].map(index=>before[index]));
        return !wanted.has(undefined)&&v24InventoryContains(wanted,after)?{accepted:true,reason:''}:{accepted:false,reason:'Uma tabela corrigida perdeu ou alterou células, referências, atributos ou a ordem dos dados.'};
    }
