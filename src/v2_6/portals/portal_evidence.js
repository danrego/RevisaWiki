    // Lê apenas as listas literais conferidas, sem expandir outras predefinições.
    function v26PortalOccupationList(value) {
        let view=protectedView(value);
        if(malformedRefs(view))return null;
        view=applyEdits(view,refTokens(view).map(r=>({start:r.start,end:r.end,text:''}))).trim();
        if(!view.startsWith('{{'))return value;
        const nodes=topNodes(view),node=nodes.length===1?nodes[0]:null;
        if(!node||node.start!==0||node.end!==view.length)return null;
        const p=parsedTemplate(view),fields=new Map();let next=1;
        if(!['hlist','lista horizontal'].includes(p.name))return null;
        for(const part of p.parts.slice(1)){
            const named=biographyNamedPart(part),key=named?named.key:String(next++),text=named?named.value:part;
            if(!/^[1-9]\d*$/.test(key)||Number(key)>20||fields.has(Number(key))||/[{}<>\uE000\uE001]/.test(text.replace(/<br\s*\/?\s*>/gi,'')))return null;
            fields.set(Number(key),text);
        }
        if(!fields.size||p.name==='lista horizontal'&&fields.size!==1)return null;
        const values=[];
        for(let i=1;i<=Math.max(...fields.keys());i++){if(!fields.has(i))return null;values.push(fields.get(i));}
        return values.join('\n');
    }
    function v26NationalityTemplate(value) {
        let view=protectedView(value);
        if(malformedRefs(view))return null;
        view=applyEdits(view,refTokens(view).map(r=>({start:r.start,end:r.end,text:''}))).trim();
        const nodes=topNodes(view),node=nodes.length===1?nodes[0]:null;
        if(!node||node.start!==0||node.end!==view.length)return null;
        const p=parsedTemplate(view);
        if(p.name!=='rusn'||p.parts.length!==2)return null;
        const named=biographyNamedPart(p.parts[1]);
        if(named&&named.key!=='1')return null;
        return ['o','a'].includes((named?named.value:p.parts[1]).trim())?['Rússia']:null;
    }
