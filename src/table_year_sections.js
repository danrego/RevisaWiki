    // Uma linha com apenas um subtítulo anual pode virar uma seção fora da tabela.
    // Os blocos de dados permanecem byte a byte. Não deduplica registros ou preenche células.
    function tableYearSectionCandidates(source) {
        const report={edits:[],findings:[],proofs:[]};
        if(!/^={3,5}[ \t]*[12]\d{3}[ \t]*={3,5}[ \t]*$/m.test(source)||!/^\s*\|[ \t]*colspan[ \t]*=/m.test(source))return report;
        const prepared=tableSyntaxView(source),view=prepared.view,stack=[],tables=[];
        for(const match of view.matchAll(/^[ \t]*(\{\||\|\})([^\r\n]*)(?:\r?\n|$)/gm)){
            if(match[1]==='{|'){
                if(stack.length)for(const t of stack)t.nested=true;
                stack.push({start:match.index,openEnd:match.index+match[0].length,nested:stack.length>0});
            }else if(stack.length){const t=stack.pop();t.closeStart=match.index;t.end=match.index+match[0].length;if(!stack.length)tables.push(t);}
        }
        const heading=body=>{
            const m=body.match(/^[ \t]*\|[ \t]*colspan[ \t]*=[ \t]*(?:"(\d+)"|'(\d+)'|(\d+))[ \t]*\|[ \t]*\r?\n(?:[ \t]*\r?\n)*(={3,5})[ \t]*([12]\d{3})[ \t]*\4[ \t]*(?:\r?\n[ \t]*\|[ \t]*)?[\r\n \t]*$/);
            if(!m)return null;
            const original=body.split(/\r?\n/).find(line=>/^[ \t]*={3,5}/.test(line));
            return {year:m[5],span:Number(m[1]||m[2]||m[3]),heading:original.trim()};
        };
        for(const t of tables){
            const inside=view.slice(t.openEnd,t.closeStart);
            if(!/^={3,5}[ \t]*[12]\d{3}[ \t]*={3,5}[ \t]*$/m.test(inside))continue;
            const finding={code:'table-year-heading',message:'Subtítulo anual dentro de uma tabela. Confira a separação das seções e a posição das células.',start:t.start,end:t.start+2,severity:'warning'};
            report.findings.push(finding);
            if(t.nested||t.end-t.start>500000||report.edits.length>=100)continue;
            const open=source.slice(t.start,t.openEnd),attrs=tableAttrs(open.replace(/^[ \t]*\{\|/,'').trim(),t.start);
            if(!attrs.valid||!attrs.attrs.some(a=>a.key==='class'&&/\bwikitable\b/.test(a.value||''))||attrs.attrs.some(a=>a.key==='class'&&/\b(?:infobox|navbox|toc)\b/.test(a.value||''))||attrs.attrs.some(a=>['id','role','headers'].includes(a.key)))continue;
            const markers=[...inside.matchAll(/^[ \t]*\|-([^\r\n]*)(?:\r?\n|$)/gm)].map(m=>({start:t.openEnd+m.index,end:t.openEnd+m.index+m[0].length,attrs:m[1]}));
            if(!markers.length||markers.length>5000)continue;
            const header=source.slice(t.openEnd,markers[0].start),headerView=view.slice(t.openEnd,markers[0].start);
            const headerLines=headerView.split(/\r?\n/).filter(line=>line.trim());
            if(!headerLines.length||headerLines.some(line=>!/^\s*!/.test(line))||/[{}]|<|<!--/.test(header)||/\b(?:rowspan|colspan|id|headers)\s*=/i.test(header))continue;
            let width=0;
            for(const line of headerLines)width+=1+(tableCellView(line).match(/!!|\|\|/g)||[]).length;
            if(width<2||width>32)continue;
            const rows=markers.map((marker,i)=>({...marker,stop:markers[i+1]?.start??t.closeStart,
                raw:source.slice(marker.start,markers[i+1]?.start??t.closeStart),
                body:source.slice(marker.end,markers[i+1]?.start??t.closeStart),
                bodyView:view.slice(marker.end,markers[i+1]?.start??t.closeStart)}));
            const sections=[];let section=null,valid=true;
            for(const row of rows){
                const group=heading(row.body);
                if(group){
                    if(row.attrs.trim()||![width,width-1].includes(group.span)||section&&!section.rows.length){valid=false;break;}
                    section={...group,rows:[],start:row.start};sections.push(section);
                }else{
                    if(!section||/^\s*={2,6}/m.test(row.bodyView)||/\browspan\s*=/i.test(row.bodyView)||/<\/?(?:table|tr|td|th|thead|tbody|tfoot)\b/i.test(row.bodyView)) {valid=false;break;}
                    const rowAttrs=tableAttrs(row.attrs,row.start+2);
                    if(!rowAttrs.valid||rowAttrs.attrs.some(a=>['id','headers'].includes(a.key))){valid=false;break;}
                    // A análise não pode garantir onde terminam linhas geradas por modelos.
                    const dynamic=prepared.dynamic.filter(n=>n.start<row.stop&&n.end>row.end);
                    for(const node of dynamic){
                        const raw=source.slice(node.start,node.end),lineStart=source.lastIndexOf('\n',node.start-1)+1,lineEnd=source.indexOf('\n',node.end);
                        const line=source.slice(lineStart,lineEnd<0?source.length:lineEnd),at=node.start-lineStart;
                        const inStyle=[...line.matchAll(/\bstyle\s*=\s*"[^"]*"/gi)].some(m=>at>m.index&&at+raw.length<m.index+m[0].length);
                        if(!/^\{\{\s*(?:Cor[ _]tempestade|Storm[ _]colour)\s*\|\s*[a-z0-9 -]+\s*\}\}$/i.test(raw)||!inStyle){valid=false;break;}
                    }
                    if(!valid)break;
                    section.rows.push(row.raw);
                }
            }
            if(!valid||!sections.length||!section.rows.length||sections.length>200)continue;
            const close=source.slice(t.closeStart,t.end);
            if(!/^[ \t]*\|}[ \t]*(?:\r?\n)?$/.test(close))continue;
            const parts=sections.map(s=>s.heading+'\n'+open+header+s.rows.join('')+close);
            const after=parts.join(close.endsWith('\n')?'\n':'\n\n');
            // The original data blocks and all their occurrences are copied verbatim.
            const dataRows=sections.flatMap(s=>s.rows);
            if(dataRows.join('')!==rows.filter(r=>!heading(r.body)).map(r=>r.raw).join(''))continue;
            report.edits.push({start:t.start,end:t.end,text:after,rule:'tableYearSections'});
            report.proofs.push({start:t.start,end:t.end,sections:sections.length,years:sections.map(s=>s.year),dataRows:dataRows.length,header,bodyBlocks:sections.map(s=>s.rows.join(''))});
            finding.message='Subtítulos anuais podem ser colocados fora da tabela, conservando todos os registros e referências.';finding.severity='info';
        }
        return report;
    }
    function automaticTableYearSections(source,cfg,bump,warn) {
        if(cfg.headings===false)return source;
        const report=tableYearSectionCandidates(source);
        if(!report.edits.length)return source;
        const after=applyEdits(source,report.edits);
        if(preservationAudit(source,after).length){warn('Separação anual da tabela preservada para revisão porque a conferência indicou possível perda de conteúdo.');return source;}
        for(const proof of report.proofs)for(let i=0;i<proof.sections;i++)bump('tableYearSections');
        return after;
    }
