    Object.assign(GROUP_LABELS,{syntaxTableAttributeQuotes:'Aspas de atributos da tabela fechadas'});
    // Formatting can enclose the opening quote while its paired closing quote
    // immediately follows the formatting marks. Protect that complete pair.
    function v272MarkupQuotationEnd(view,start,end) {
        const marks=view.slice(start).match(/^'{2,5}(?!')/);if(!marks)return end;
        const opening=start+marks[0].length,closer={'"':'"','“':'”','«':'»'}[view[opening]];
        return closer&&view[end]===closer&&view.indexOf(closer,opening+1)===end?end+1:end;
    }
    function v272LiteralTables(source) {
        const prepared=tableSyntaxView(source),stack=[],tables=[];
        for(const match of prepared.view.matchAll(/^[ \t]*(\{\||\|\})([^\r\n]*)(?:\r?\n|$)/gm)){
            if(match[1]==='{|'){
                if(stack.length)for(const table of stack)table.nested=true;
                const opening=source.slice(match.index,match.index+match[0].length),attrs=tableAttrs(opening.replace(/^[ \t]*\{\|/,'').trim(),match.index);
                stack.push({start:match.index,openEnd:match.index+match[0].length,nested:stack.length>0,attrs});
            }else if(stack.length){const table=stack.pop();table.closeStart=match.index;table.end=match.index+match[0].length;
                if(!stack.length&&/^[ \t]*$/.test(match[2]))tables.push(table);}
        }
        return {tables,view:prepared.view};
    }
    function v272TableCandidateEdits(source,cfg={}) {
        if(!/^[ \t]*[|!][ \t]*(?:rowspan|colspan)[ \t]*=[ \t]*["'][1-9]\d{0,2}[ \t]*\|/im.test(source)||cfg.namespaceNumber!==0||cfg.tableChecks===false||cfg.automaticTableRepairs===false||cfg.markup===false||cfg.pageRedirect||cfg.pageDisambiguation||!v24SyntaxScope(cfg)||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||/~{3,5}/.test(source)||discussionProtectionRanges(source,{discussionPage:true}).length)return [];
        const shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),prepared=v272LiteralTables(source),edits=[],sourceHash=v24SyntaxHash(source);
        const blocked=(at,allowQuote)=>shield.ranges.some(range=>range.start<=at&&at<range.end&&!(allowQuote&&range.kind==='quotation'&&range.start===allowQuote&&shield.unclosed.some(x=>x.start===allowQuote&&x.kind==='quotation')))||markdown.some(range=>range.start<=at&&at<range.end);
        for(const [tableIndex,table]of prepared.tables.entries()){
            if(table.nested||!table.attrs.valid||!table.attrs.attrs.some(attr=>attr.key==='class'&&/\bwikitable\b/.test(attr.value||''))||table.attrs.attrs.some(attr=>attr.key==='class'&&/\b(?:infobox|navbox|toc)\b/.test(attr.value||''))||table.attrs.attrs.some(attr=>attr.key==='role'&&['presentation','none'].includes((attr.value||'').toLowerCase()))||blocked(table.start)||/<\/?(?:table|tr|td|th|thead|tbody|tfoot)\b/i.test(prepared.view.slice(table.openEnd,table.closeStart))||/^={2,6}/m.test(prepared.view.slice(table.openEnd,table.closeStart)))continue;
            const inside=source.slice(table.openEnd,table.closeStart),pattern=/^([ \t]*[|!][ \t]*(rowspan|colspan)[ \t]*=[ \t]*)(["'])([1-9]\d{0,2})([ \t]*)(\|)([ \t]*)([^\r\n]+)$/gmi;let match;
            while((match=pattern.exec(inside))){
                const text=match[8];if(!text.trim()||/["'{}\[\]<>|=&]/.test(text))continue;
                const lineStart=table.openEnd+match.index,quoteStart=lineStart+match[1].length,start=quoteStart+1+match[4].length;
                if(blocked(lineStart)||blocked(quoteStart,quoteStart)||source.slice(lineStart,lineStart+match[0].length)!==prepared.view.slice(lineStart,lineStart+match[0].length))continue;
                edits.push({start,end:start,text:match[3],ruleId:'syntaxTableAttributeQuotes',proof:{sourceHash,tableIndex,tableStart:table.start,tableEnd:table.end,lineStart,key:match[2].toLowerCase(),value:match[4],quote:match[3],content:text,condition:'complete top-level literal wikitable; sole positive-integer cell span; existing separator and static single-line content; one missing closing attribute quote'}});
            }
        }
        return edits;
    }
    function v272TableCellEdits(source,cfg={}) {
        const edits=v272TableCandidateEdits(source,cfg);if(!edits.length)return [];
        const next=v24SyntaxApply(source,edits);if(v24SyntaxScan(next).issues.length||v272TableCandidateEdits(next,cfg).length)return [];
        const spans=tableAnalysis(next).repairs.filter(repair=>repair.rule==='tableSpanRepairs');
        if(spans.some(repair=>edits.some(edit=>{const p=edit.proof,start=v24InventoryPosition(p.tableStart,edits),end=v24InventoryPosition(p.tableEnd,edits,true);return start<=repair.start&&repair.start<end;})))return [];
        return edits;
    }
    function v272TableSyntaxPlan(source,cfg={}) {
        const edits=v272TableCellEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v272TableSyntaxProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const fresh=v272TableSyntaxPlan(before,cfg);return plan.text===after&&fresh.text===after&&JSON.stringify(plan.edits)===JSON.stringify(fresh.edits);
    }
    function v272TableInventories(source,cfg={}) {
        const scopes=cfg.tableChecks!==false&&cfg.automaticTableRepairs!==false&&cfg.tableAccessibility!==false?tableAnalysis(source).repairs.filter(repair=>repair.rule==='tableHeaderScopes'):[];
        const text=scopes.length?v24SyntaxApply(source,scopes.map(repair=>({start:repair.start,end:repair.end,text:repair.after}))):source,prepared=v272LiteralTables(text),out=[];
        const attributes=(raw,start)=>{const parsed=tableAttrs(raw,start);return parsed.valid?parsed.attrs.map(attr=>[attr.key,attr.value===undefined?null:attr.value]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))):['literal',v24InventoryBody(raw,cfg)];};
        for(const table of prepared.tables){
            const rows=[],captions=[];let cells=[],rowAttrs=[];
            const finish=()=>{if(cells.length){rows.push([rowAttrs,cells.map(cell=>[cell.kind,cell.attrs,v24InventoryBody(cell.content,cfg)])]);cells=[];}rowAttrs=[];};
            let offset=table.openEnd;
            for(const original of text.slice(table.openEnd,table.closeStart).match(/[^\n]*(?:\n|$)/g)||[]){if(!original)continue;
                const line=original.replace(/[\r\n]+$/,''),view=prepared.view.slice(offset,offset+line.length),row=view.match(/^[ \t]*\|-([\s\S]*)$/),caption=view.match(/^[ \t]*\|\+/);
                if(row){finish();rowAttrs=attributes(line.slice(row[0].length-row[1].length),offset+row[0].length-row[1].length);offset+=original.length;continue;}
                if(caption){const mask=tableCellView(view.slice(caption[0].length)),pipe=mask.indexOf('|'),start=caption[0].length;captions.push([pipe<0?[]:attributes(line.slice(start,start+pipe),offset+start),v24InventoryBody(line.slice(start+(pipe<0?0:pipe+1)),cfg)]);offset+=original.length;continue;}
                const first=view.match(/^[ \t]*([!|])/);
                if(first){const mask=tableCellView(view),cuts=[{at:first[0].length,kind:first[1]}],pattern=first[1]==='!'?/!!|\|\|/g:/\|\|/g;pattern.lastIndex=first[0].length;let match;
                    while((match=pattern.exec(mask)))cuts.push({at:match.index+2,kind:match[0]==='!!'?'!':'|'});
                    for(let i=0;i<cuts.length;i++){const start=cuts[i].at,end=i+1<cuts.length?cuts[i+1].at-2:line.length,pipe=mask.slice(start,end).indexOf('|');
                        cells.push({kind:cuts[i].kind,attrs:pipe<0?[]:attributes(line.slice(start,start+pipe),offset+start),content:line.slice(start+(pipe<0?0:pipe+1),end)});}
                }else if(line.trim()&&cells.length)cells.at(-1).content+='\n'+line;
                offset+=original.length;
            }
            finish();out.push(JSON.stringify([attributes(text.slice(table.start,table.openEnd).replace(/^[ \t]*\{\|/,'').trim(),table.start),captions,rows]));
        }
        return out;
    }
    function v272TableObjectProof(plan,expected,actual) {
        const steps=plan.safe.steps.filter(step=>step.name==='v272-numeric-cell-quotes');if(!steps.length)return {accepted:true,reason:''};
        const cfg=plan.cfg,indexes=new Set(steps.flatMap(step=>step.edits.map(edit=>edit.proof.tableIndex))),before=v272TableInventories(expected,cfg),after=v272TableInventories(actual,cfg);
        const wanted=new Set([...indexes].map(index=>before[index]));if(wanted.has(undefined))return {accepted:false,reason:'A tabela corrigida deixou de ter um limite confirmado.'};
        const prior=v24InventoryCount(before.filter(key=>wanted.has(key))),current=v24InventoryCount(after);
        if(!v24InventoryContains(prior,current))return {accepted:false,reason:'A tabela corrigida perdeu dados, referências, atributos ou a ordem das células.'};
        return {accepted:true,reason:''};
    }
