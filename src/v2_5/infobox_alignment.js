    // Alinha somente o espaço antes de "=" em infocaixas já abertas em linhas.
    // Os nomes, valores e a ordem dos campos ficam como estavam.
    function v25InfoboxAlignmentPlan(source,cfg={}) {
        const plan={source,text:source,edits:[],boxes:[]};
        if(cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||
            cfg.discussionPage||cfg.infoboxes===false||cfg.markup===false||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext'||
            !/\{\{[^\r\n|{}]+\r?\n[ \t]*\|/.test(source))return plan;
        const shield=maskProtected(source,()=>{});
        if(shield.unclosed)return plan;
        let view=scanProtectedView(source);
        if(malformedRefs(view))return plan;
        view=v24SyntaxMaskRanges(view,refTokens(view));
        const inventory=templates(view);
        if(inventory.unclosed.length)return plan;
        for(const node of inventory.nodes.filter(n=>n.depth===0)) {
            const raw=source.slice(node.start,node.end),visible=view.slice(node.start,node.end),p=parsedTemplate(visible);
            if(!Object.prototype.hasOwnProperty.call(INFOBOX_CATALOG,p.name)||
                !/^[ \t]*$/.test(source.slice(source.lastIndexOf('\n',node.start-1)+1,node.start))||
                !/^[ \t]*(?:\r?\n|$)/.test(source.slice(node.end))||!/\r?\n[ \t]*\}\}$/.test(raw)||
                !/^[^\r\n]+\r?\n[ \t]*$/.test(p.parts[0])||p.parts.length<2)continue;
            const fields=[];let offset=2+p.parts[0].length,valid=true,width=22,indentation=null;
            for(let index=1;index<p.parts.length;index++) {
                const part=raw.slice(offset+1,offset+1+p.parts[index].length),pipe=node.start+offset;
                // A top-level pipe must open its own physical source line.
                const indent=source.slice(source.lastIndexOf('\n',pipe-1)+1,pipe);
                if(!/^[ \t]*$/.test(indent)||indentation!==null&&indent!==indentation) {valid=false;break;}
                indentation=indent;
                const key=part.match(/^( *)([\p{L}\p{N}_ /().:-]+?)([ \t]*)=([\s\S]*)$/u);
                if(!key||!key[2].trim()||/[\r\n]/.test(key[4].replace(/\r?\n[ \t]*$/,''))) {valid=false;break;}
                const prefix=key[1]+key[2],length=Array.from(prefix).length;
                width=Math.max(width,length+1);
                if(width>48) {valid=false;break;}
                fields.push({name:key[2],value:key[4],prefix,length,
                    start:pipe+1+prefix.length,end:pipe+1+prefix.length+key[3].length});
                offset+=1+p.parts[index].length;
            }
            if(!valid||fields.length!==p.parts.length-1)continue;
            const edits=fields.map(field=>({start:field.start,end:field.end,text:' '.repeat(width-field.length),
                ruleId:'infoboxAlignment'})).filter(edit=>source.slice(edit.start,edit.end)!==edit.text);
            if(!edits.length)continue;
            const next=applyEdits(raw,edits.map(edit=>({...edit,start:edit.start-node.start,end:edit.end-node.start}))),
                beforeParts=splitParts(visible.slice(2,-2)),afterView=scanProtectedView(next),
                afterParts=splitParts(v24SyntaxMaskRanges(afterView,refTokens(afterView)).slice(2,-2));
            // A second parse must have exactly the same field boundaries and data.
            if(beforeParts.length!==afterParts.length||beforeParts.some((part,index)=>index===0?part!==afterParts[index]:
                part.replace(/[ \t]*=/,'=')!==afterParts[index].replace(/[ \t]*=/,'=')))continue;
            plan.edits.push(...edits);
            plan.boxes.push({start:node.start,end:node.end,name:p.name,width,fields:fields.length});
        }
        plan.text=applyEdits(source,plan.edits);return plan;
    }
    function automaticInfoboxAlignment(source,cfg={},bump=()=>{}) {
        const plan=v25InfoboxAlignmentPlan(source,cfg);
        for(const box of plan.boxes)bump('infoboxAlignment');
        return plan.text;
    }
    function v25InfoboxAlignmentSourceProof(source,result,cfg={}) {
        const plan=v25InfoboxAlignmentPlan(source,cfg);
        return {accepted:result===plan.text,applied:plan.edits.length>0,boxes:plan.boxes.length,
            reason:result===plan.text?'Only the exact planned infobox key padding changed.':'Candidate differs from the source-bound spacing plan.'};
    }
