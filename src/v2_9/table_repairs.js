    Object.assign(GROUP_LABELS,{tableDuplicateAttributes:'Atributos idênticos repetidos na tabela retirados',tableExtraAttributeQuotes:'Aspas repetidas de atributos da tabela corrigidas',tableLeafHeaderScopes:'Alcance dos cabeçalhos de coluna informado'});
    const V29_TABLE_ATTRIBUTES=Object.freeze({table:new Set(['class','style','border','cellpadding','cellspacing','width','align','role']),row:new Set(['class','style','align','valign','bgcolor']),caption:new Set(['class','style','align']),cell:new Set(['rowspan','colspan','scope','class','style','align','valign','width','height','bgcolor'])});
    function v29TableEnabled(source,cfg={}) {
        return typeof source==='string'&&cfg.namespaceNumber===0&&cfg.tableChecks!==false&&cfg.automaticTableRepairs!==false&&cfg.markup!==false&&!cfg.sectionOnly&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&v24SyntaxScope(cfg)&&!/~{3,5}/.test(source)&&!discussionProtectionRanges(source,{discussionPage:true}).length;
    }
    function v29TableAttributes(raw,start,kind,duplicates=false) {
        const parsed=v25SafeAttributes(' '+raw,V29_TABLE_ATTRIBUTES[kind]);if(!parsed||!duplicates&&parsed.duplicates.length)return null;
        const entries=parsed.entries.map(entry=>({...entry,start:start+Math.max(0,entry.start-1),end:start+entry.end-1}));
        if(entries.some(entry=>['rowspan','colspan'].includes(entry.key)&&(!/^\d{1,4}$/.test(entry.value)||Number(entry.value)>1000||entry.key==='colspan'&&!Number(entry.value))))return null;
        return {entries,values:parsed.values,duplicates:parsed.duplicates.map(entry=>({...entry,start:start+Math.max(0,entry.start-1),end:start+entry.end-1}))};
    }
    function v29TablePrepared(source) {
        let prepared;const obtain=()=>prepared||(prepared=tableSyntaxView(source));return {view:scanMemo(source,'v29TableView',()=>obtain().view),dynamic:scanMemo(source,'v29TableDynamic',()=>obtain().dynamic)};
    }
    function v29TableStaticBounds(source) {
        const prepared=v272LiteralTables(source),syntax=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),dynamic=v29TablePrepared(source).dynamic;
        return prepared.tables.filter(table=>{
            if(table.nested||table.end-table.start>500000||!table.attrs.valid||!table.attrs.attrs.some(attr=>attr.key==='class'&&/\bwikitable\b/.test(attr.value||''))||table.attrs.attrs.some(attr=>!V29_TABLE_ATTRIBUTES.table.has(attr.key)||attr.key==='class'&&/\b(?:infobox|navbox|toc)\b/.test(attr.value||'')||attr.key==='role'&&['presentation','none'].includes((attr.value||'').toLowerCase())))return false;
            if(syntax.ranges.some(range=>range.start<=table.start&&table.start<range.end)||markdown.some(range=>range.start<=table.start&&table.start<range.end))return false;
            const inside=source.slice(table.openEnd,table.closeStart);return !dynamic.some(range=>range.start<table.end&&range.end>table.start)&&!/<\/?(?:table|tr|td|th|thead|tbody|tfoot)\b/i.test(inside)&&!/^={2,6}/m.test(inside);
        });
    }
    function v29TableModel(source,table,duplicates=false) {
        const prepared=v29TablePrepared(source),rows=[],captions=[],allAttributes=[],boundaries=[];let current=null,offset=table.openEnd,pendingMarker=false;
        const finish=()=>{if(current?.cells.length){rows.push(current);current=null;return true;}return false;};
        for(const original of source.slice(table.openEnd,table.closeStart).match(/[^\n]*(?:\n|$)/g)||[]){if(!original)continue;
            const line=original.replace(/\r?\n$/,''),view=prepared.view.slice(offset,offset+line.length),marker=/^([ \t]*)\|-([\s\S]*)$/.exec(view),caption=/^[ \t]*\|\+/.exec(view);
            if(marker){if(pendingMarker&&!current?.cells.length)return null;finish();const start=offset+marker[1].length+2,attrs=v29TableAttributes(line.slice(start-offset),start,'row',duplicates);if(!attrs)return null;current={start:offset,attrs,cells:[]};allAttributes.push({kind:'row',...attrs});pendingMarker=true;offset+=original.length;continue;}
            if(caption){if(rows.length||current?.cells.length||captions.length)return null;const mask=tableCellView(view.slice(caption[0].length)),pipe=mask.indexOf('|'),start=offset+caption[0].length,attrs=v29TableAttributes(pipe<0?'':line.slice(caption[0].length,caption[0].length+pipe),start,'caption',duplicates);if(!attrs)return null;captions.push({attrs,content:line.slice(caption[0].length+(pipe<0?0:pipe+1))});allAttributes.push({kind:'caption',...attrs});offset+=original.length;continue;}
            const first=/^[ \t]*([!|])/.exec(view);
            if(first){if(!current){const attrs=v29TableAttributes('',offset,'row',duplicates);current={start:offset,attrs,cells:[]};}pendingMarker=false;let invalid=false;const mask=tableCellView(view,()=>{invalid=true;});if(invalid)return null;
                const cuts=[{at:first[0].length,kind:first[1]}],pattern=first[1]==='!'?/!!|\|\|/g:/\|\|/g;pattern.lastIndex=first[0].length;let match;
                while((match=pattern.exec(mask)))cuts.push({at:match.index+2,kind:match[0]==='!!'?'!':'|'});
                for(let index=0;index<cuts.length;index++){const start=cuts[index].at,end=index+1<cuts.length?cuts[index+1].at-2:line.length,pipe=mask.slice(start,end).indexOf('|'),attrsStart=offset+start,attrs=v29TableAttributes(pipe<0?'':line.slice(start,start+pipe),attrsStart,'cell',duplicates);if(!attrs)return null;
                    if(pipe>=0&&line.slice(start,start+pipe)!==view.slice(start,start+pipe))return null;
                    const cell={start:attrsStart,end:offset+end,kind:cuts[index].kind,attrs,attrsEnd:pipe<0?null:attrsStart+pipe,content:line.slice(start+(pipe<0?0:pipe+1),end),rowspan:Number(attrs.values.get('rowspan')??1),colspan:Number(attrs.values.get('colspan')??1)};
                    current.cells.push(cell);allAttributes.push({kind:'cell',...attrs});boundaries.push(cell);if(current.cells.length>200)return null;}
            }else if(line.trim()){if(!current?.cells.length)return null;current.cells[current.cells.length-1].content+='\n'+line;}
            offset+=original.length;if(rows.length>5000)return null;
        }
        if(pendingMarker)return null;finish();if(!rows.length)return null;
        const grid=[],widths=[];let cost=0;
        for(let row=0;row<rows.length;row++){grid[row]||=[];let column=0;for(const cell of rows[row].cells){while(grid[row][column])column++;const span=cell.rowspan||rows.length-row;if(row+span>rows.length)return null;cost+=span*cell.colspan;if(cost>100000)return null;
                for(let r=row;r<row+span;r++){grid[r]||=[];for(let c=column;c<column+cell.colspan;c++){if(grid[r][c])return null;grid[r][c]=true;}}
                cell.column=column;column+=cell.colspan;}widths.push(grid[row].length);}
        const width=Math.max(...widths);if(!width||width>200||widths.some((value,row)=>value!==width||Object.keys(grid[row]).length!==width))return null;
        return {table,rows,captions,attributes:allAttributes,cells:boundaries,width};
    }
    function v29TableModelInventory(model) {
        const attrs=value=>[...value.values].sort((a,b)=>a[0].localeCompare(b[0]));return JSON.stringify([model.width,model.captions.map(caption=>[attrs(caption.attrs),caption.content]),model.rows.map(row=>[attrs(row.attrs),row.cells.map(cell=>[cell.kind,cell.rowspan,cell.colspan,attrs(cell.attrs),cell.content])])]);
    }
    function v29TableDuplicateAttributeEdits(source,cfg={}) {
        if(!v29TableEnabled(source,cfg)||!/^\s*[|!][^\r\n]*=[^\r\n]*=/m.test(source)||v24SyntaxScan(source).issues.length)return [];const edits=[],sourceHash=v24SyntaxHash(source),tables=v29TableStaticBounds(source);
        for(const table of tables){const model=v29TableModel(source,table,true);if(!model)continue;const local=[];for(const attributes of model.attributes)for(const duplicate of attributes.duplicates)local.push({start:duplicate.start,end:duplicate.end,text:'',ruleId:'tableDuplicateAttributes',proof:{sourceHash,tableStart:table.start,tableEnd:table.end,tableIndex:v272LiteralTables(source).tables.findIndex(item=>item.start===table.start),kind:attributes.kind,key:duplicate.key,value:duplicate.value,condition:'one literal complete wikitable; only exact-equal duplicate attributes; full regular grid and ordered content unchanged'}});
            if(!local.length)continue;const next=v24SyntaxApply(source,local),candidate=v29TableStaticBounds(next).find(item=>item.start===table.start),after=candidate&&v29TableModel(next,candidate);if(after&&v29TableModelInventory(model)===v29TableModelInventory(after))edits.push(...local);}
        return edits;
    }
    function v29TableSyntaxEdits(source,cfg={}) {
        if(!v29TableEnabled(source,cfg)||!/^[ \t]*[|!][ \t]*(?:rowspan|colspan)[ \t]*=[ \t]*(["'])[1-9]\d{0,2}\1\1[ \t]*\|/im.test(source))return [];
        const edits=[],sourceHash=v24SyntaxHash(source),shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source);
        for(const table of v29TableStaticBounds(source)){const local=[],inside=source.slice(table.openEnd,table.closeStart),pattern=/^([ \t]*[|!][ \t]*(rowspan|colspan)[ \t]*=[ \t]*)(["'])([1-9]\d{0,2})\3\3([ \t]*\|[ \t]*)([^\r\n]+)$/gmi;let match;
            while((match=pattern.exec(inside))){if(!match[6].trim()||/["'{}\[\]<>|=&]/.test(match[6]))continue;const lineStart=table.openEnd+match.index,at=lineStart+match[1].length+match[4].length+2;if(shield.ranges.some(range=>range.start<=lineStart&&lineStart<range.end)||markdown.some(range=>range.start<=lineStart&&lineStart<range.end))continue;
                local.push({start:at,end:at+1,text:'',ruleId:'tableExtraAttributeQuotes',proof:{sourceHash,tableStart:table.start,tableEnd:table.end,tableIndex:v272LiteralTables(source).tables.findIndex(item=>item.start===table.start),key:match[2].toLowerCase(),value:match[4],quote:match[3],content:match[6],condition:'one extra repeated terminal quote after a sole positive integer span; explicit cell separator and static text; complete regular literal table'}});}
            if(!local.length)continue;const next=v24SyntaxApply(source,local),legacy=v272TableCellEdits(next,cfg),checked=v24SyntaxApply(next,legacy),index=v272LiteralTables(source).tables.findIndex(item=>item.start===table.start),candidate=v272LiteralTables(checked).tables[index];if(!candidate||!v29TableStaticBounds(checked).some(item=>item.start===candidate.start)||!v29TableModel(checked,candidate)||v24SyntaxScan(checked).issues.length)continue;
            edits.push(...local);}
        const next=v24SyntaxApply(source,edits),checked=edits.length?v24SyntaxApply(next,v272TableCellEdits(next,cfg)):next;return edits.length&&v24SyntaxScan(checked).issues.length?[]:edits;
    }
    function v29TableSyntaxPlan(source,cfg={}) {const edits=v29TableSyntaxEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};}
    function v29TableSyntaxProof(before,after,plan,cfg={}) {if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v29TableSyntaxPlan(before,cfg);return plan.text===after&&fresh.text===after&&JSON.stringify(plan.edits)===JSON.stringify(fresh.edits);}
    function v29TableSyntaxProjection(source,cfg={}) {return v29TableSyntaxPlan(source,cfg).text;}
    function v29TableHeaderText(content) {const view=protectedView(content.trim());return tableMaskRanges(view,refTokens(view)).replace(/<[^>]*>/g,'').replace(/[' \t\r\n]/g,'').length>0;}
    function v29TableLeafScopeEdits(source,cfg={}) {
        if(!v29TableEnabled(source,cfg)||cfg.tableAccessibility===false||!/^[ \t]*![^\r\n]*\bcolspan\s*=/im.test(source)||v24SyntaxScan(source).issues.length)return [];const edits=[],sourceHash=v24SyntaxHash(source);
        for(const table of v29TableStaticBounds(source)){const model=v29TableModel(source,table);if(!model||model.width<2||model.width>32||model.rows.length<3||model.cells.some(cell=>cell.rowspan!==1))continue;
            const [groups,leaves,...body]=model.rows;if(!groups.cells.length||groups.cells.some(cell=>cell.kind!=='!'||cell.colspan<2||!cell.attrs.values.has('colspan')||cell.attrs.values.has('scope')||!v29TableHeaderText(cell.content))||leaves.cells.length!==model.width||leaves.cells.some(cell=>cell.kind!=='!'||cell.colspan!==1||!v29TableHeaderText(cell.content)||cell.attrs.values.has('scope')&&cell.attrs.values.get('scope')!=='col')||body.some(row=>row.cells.length!==model.width||row.cells.some((cell,index)=>cell.colspan!==1||index>0&&cell.kind!=='|'||cell.attrs.values.has('scope')&&!(index===0&&cell.kind==='!'&&cell.attrs.values.get('scope')==='row'))))continue;
            for(const cell of leaves.cells){if(cell.attrs.values.has('scope'))continue;const hasAttrs=cell.attrsEnd!==null,text=hasAttrs?' scope="col"'+(/^[ \t]/.test(source.slice(cell.start,cell.start+1))?'':' '):' scope="col" |';edits.push({start:cell.start,end:cell.start,text,ruleId:'tableLeafHeaderScopes',proof:{sourceHash,tableStart:table.start,tableEnd:table.end,tableIndex:v272LiteralTables(source).tables.findIndex(item=>item.start===table.start),column:cell.column,width:model.width,content:cell.content,condition:'two explicit header tiers; top colspan groups exactly cover complete span-one leaf columns; regular literal body; no rowspan, identifiers, header associations or conflicting scope'}});}
        }
        return edits;
    }
    function v29TableRepairPlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};for(const [name,find]of [['v29-table-extra-quotes',v29TableSyntaxEdits],['v29-table-duplicate-attributes',v29TableDuplicateAttributeEdits],['v29-table-leaf-scopes',v29TableLeafScopeEdits]]){const edits=find(plan.text,cfg);if(!edits.length)continue;const before=plan.text;plan.text=v24SyntaxApply(before,edits);plan.steps.push({name,before,after:plan.text,edits});plan.edits.push(...edits);}return plan;
    }
    function v29TableRepairProof(before,after,plan,cfg={}) {if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v29TableRepairPlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(plan.steps)===JSON.stringify(fresh.steps)&&JSON.stringify(plan.edits)===JSON.stringify(fresh.edits);}
    function v29TableProjection(source,cfg={}) {return v29TableRepairPlan(source,cfg).text;}
    function v29TableInventory(source,cfg={}) {return v272TableInventories(source,cfg);}
    function v29TableObjectProof(plan,expected,actual) {
        const steps=(plan.safe?.steps||plan.steps||[]).filter(step=>/^v29-table-/.test(step.name));if(!steps.length)return {accepted:true,reason:''};const cfg=plan.cfg||{},indexes=new Set(steps.flatMap(step=>step.edits.map(edit=>edit.proof.tableIndex))),before=v29TableInventory(expected,cfg),after=v24InventoryCount(v29TableInventory(actual,cfg)),wanted=v24InventoryCount([...indexes].map(index=>before[index]));
        return !wanted.has(undefined)&&v24InventoryContains(wanted,after)?{accepted:true,reason:''}:{accepted:false,reason:'Uma tabela corrigida perdeu ou alterou células, referências, atributos ou a ordem dos dados.'};
    }
