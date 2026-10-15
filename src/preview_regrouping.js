    function literalOuterTables(source) {
        const view=tableSyntaxView(source).view,stack=[],out=[];
        for(const m of view.matchAll(/^[ \t]*(\{\||\|\})[^\r\n]*(?:\r?\n|$)/gm)){
            if(m[1]==='{|')stack.push(m.index);
            else if(stack.length){const start=stack.pop();if(!stack.length)out.push(source.slice(start,m.index+m[0].length));}
        }
        if(stack.length)out.push(source.slice(stack[0]));
        return out;
    }
    function tableSourceWithoutScopes(source) {
        return source.replace(/^([ \t]*!)([^\r\n]*)/gm,(all,lead,body)=>{
            const view=tableCellView(body),cuts=[...view.matchAll(/!!/g)].map(m=>m.index);
            const starts=[0,...cuts.map(i=>i+2)],ends=[...cuts,body.length];
            const cleaned=starts.map((start,i)=>{
                const raw=body.slice(start,ends[i]),mask=tableCellView(raw),at=mask.indexOf('|');
                if(at<0)return raw;
                const attrs=raw.slice(0,at),rest=raw.slice(at);
                if(!/\bscope="(?:col|row)"/.test(attrs))return raw;
                const clean=attrs.replace(/(?:^|\s+)scope="(?:col|row)"/g,'');
                return clean.trim()?clean+rest:rest.slice(1);
            });
            return lead+cleaned.join('!!');
        });
    }
    function staticRenderedHeader(header,Parser) {
        const out=[];
        for(const line of header.split(/\r?\n/).filter(x=>x.trim())){
            const body=line.replace(/^[ \t]*!/,''),view=tableCellView(body),cuts=[...view.matchAll(/!!|\|\|/g)].map(m=>m.index),starts=[0,...cuts.map(i=>i+2)],ends=[...cuts,body.length];
            for(let i=0;i<starts.length;i++){
                let raw=body.slice(starts[i],ends[i]),mask=tableCellView(raw),pipe=mask.indexOf('|');
                if(pipe>=0)raw=raw.slice(pipe+1);
                raw=raw.replace(/\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g,(_,target,label)=>label??target).replace(/'{2,5}/g,'');
                const doc=new Parser().parseFromString(raw,'text/html');out.push(doc.body.textContent.replace(/\s+/g,' ').trim());
            }
        }
        return out;
    }
    function renderedTableRegroupingProof(beforeHtml,afterHtml,Parser,sourceBefore,sourceAfter) {
        if(typeof sourceBefore!=='string'||typeof sourceAfter!=='string'||sourceBefore===sourceAfter)return {accepted:false};
        const plan=tableYearSectionCandidates(sourceBefore);
        if(!plan.edits.length)return {accepted:false};
        const expectedSource=applyEdits(sourceBefore,plan.edits);
        const expectedTables=literalOuterTables(expectedSource).map(tableSourceWithoutScopes),actualTables=literalOuterTables(sourceAfter).map(tableSourceWithoutScopes);
        if(JSON.stringify(expectedTables)!==JSON.stringify(actualTables))return {accepted:false};
        const remaining=plan.proofs.map(p=>({...p,headerCells:staticRenderedHeader(p.header,Parser)}));
        const doc=new Parser().parseFromString(beforeHtml,'text/html'),expected=[];let matched=0;
        const cells=row=>[...row.children].filter(c=>/^(?:TD|TH)$/.test(c.tagName)).map(cell=>{
            const copy=cell.cloneNode(true);copy.querySelectorAll('.reference,.mw-editsection,script,style').forEach(n=>n.remove());return copy.textContent.replace(/\s+/g,' ').trim();
        });
        for(const table of [...doc.querySelectorAll('table.wikitable')].filter(t=>!t.closest('.navbox,.infobox'))){
            const rows=[...table.querySelectorAll('tr')].filter(r=>r.closest('table')===table),values=rows.map(cells);
            const groups=[];let current=null,valid=values.length>0;
            for(let index=1;index<rows.length;index++){
                const row=rows[index],heads=[...row.querySelectorAll('h3,h4,h5')].filter(h=>h.closest('tr')===row);
                const head=heads.length===1&&heads[0].cloneNode(true);
                if(head)head.querySelectorAll('.mw-editsection,script,style').forEach(n=>n.remove());
                const year=head&&head.textContent.replace(/\s+/g,' ').trim();
                if(year&&/^[12]\d{3}$/.test(year)&&values[index].filter(Boolean).length===1&&values[index].includes(year)){
                    current={year,rows:[]};groups.push(current);
                }else if(current)current.rows.push(values[index]);else {valid=false;break;}
            }
            const years=groups.map(g=>g.year),index=valid?remaining.findIndex(p=>JSON.stringify(p.years)===JSON.stringify(years)&&JSON.stringify(p.headerCells)===JSON.stringify(values[0])):-1;
            if(index<0){expected.push(values);continue;}
            remaining.splice(index,1);matched++;
            for(const group of groups)expected.push([values[0],...group.rows]);
        }
        const actual=renderedTableCells(afterHtml,Parser);
        return {accepted:remaining.length===0&&matched===plan.edits.length&&JSON.stringify(expected)===JSON.stringify(actual),tables:matched,years:plan.proofs.reduce((n,p)=>n+p.sections,0)};
    }
