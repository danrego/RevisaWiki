    function v2211ShortEndMatterColumns(source,cfg,bump) {
        if(!/\{\{[ \t]*(?:[Cc]olunas-lista|[Dd]iv col)\b/.test(source)||!v220StructureScope(source,cfg)||cfg.endMatter===false||cfg.endMatterColumns===false)return source;
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),edits=[],
            roles=new Set(['ligações externas','bibliografia','leitura adicional','leitura complementar',
                'bibliografia complementar','bibliografia adicional','leituras complementares']),
            heads=[...source.matchAll(/^(={2,6})[ \t]*(.*?)[ \t]*\1[ \t]*\r?$/gm)]
                .filter(h=>!c.blocked(h.index,h.index+h[0].length));
        function standalone(n) {
            const start=source.lastIndexOf('\n',n.start-1)+1,end=source.indexOf('\n',n.end);
            return start===n.start&&/^[ \t\r]*$/.test(source.slice(n.end,end<0?source.length:end));
        }
        function shortList(body) {
            if(/[{}<>\uE000\uE001]/.test(body))return false;
            let count=0;
            for(const line of body.split(/\r?\n/)) {
                if(/^[ \t]*$/.test(line))continue;
                if(/^\*(?![*#:;])[ \t]*\S/.test(line))count++;
                else if(!count||!/^\*[*#:;]/.test(line))return false;
            }
            return count>0&&count<8;
        }
        let changes=0;
        for(let i=0;i<heads.length;i++) {
            const h=heads[i];if(!roles.has(norm(h[2])))continue;
            const start=h.index+h[0].length,end=heads[i+1]?.index??source.length,
                nodes=c.nodes.filter(n=>n.depth===0&&n.start>=start&&n.end<=end),
                layouts=nodes.filter(n=>/^(?:div col|div col fim|-fim|inícioref|inicioref|refbegin|colunas(?:-lista)?|multicol|column|col-break)$/.test(parsedTemplate(source.slice(n.start,n.end)).name));
            if(layouts.length===1) {
                const n=layouts[0],p=parsedTemplate(source.slice(n.start,n.end));
                if(!standalone(n)||c.blocked(n.start,n.end,true)||p.parts.length!==3||!/^[ \t\r\n]*[Cc]olunas-lista[ \t\r\n]*$/.test(p.parts[0])||!/^[ \t\r\n]*(?:1[ \t]*=[ \t]*)?2[ \t\r\n]*$/.test(p.parts[1]))continue;
                const key=/^[ \t\r\n]*2[ \t]*=/.exec(p.parts[2]);if(!key)continue;
                const body=p.parts[2].slice(key[0].length);if(!shortList(body))continue;
                edits.push({start:n.start,end:n.end,text:body});changes++;
            } else if(layouts.length===2) {
                const [a,b]=layouts,p=parsedTemplate(source.slice(a.start,a.end)),q=parsedTemplate(source.slice(b.start,b.end));
                if(!standalone(a)||!standalone(b)||c.blocked(a.start,a.end,true)||c.blocked(b.start,b.end,true)||p.parts.length!==2||q.parts.length!==1||!/^[ \t\r\n]*[Dd]iv col[ \t\r\n]*$/.test(p.parts[0])||!/^[ \t\r\n]*colunas[ \t]*=[ \t]*2[ \t\r\n]*$/.test(p.parts[1])||!/^[ \t\r\n]*[Dd]iv col fim[ \t\r\n]*$/.test(q.parts[0]))continue;
                if(!shortList(source.slice(a.end,b.start)))continue;
                edits.push({start:a.start,end:a.end,text:''},{start:b.start,end:b.end,text:''});changes++;
            }
        }
        for(let i=0;i<changes;i++)bump('endMatterColumns');
        return applyEdits(source,edits);
    }
