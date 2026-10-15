    // 2.4: source retention proof for objects recovered by syntax repair.
    // Inputs expected/actual have already received the same reference-name
    // normalization. This verifies data retention; it does not authorize edits.
    function v24InventoryCount(values) {
        const counts=new Map();for(const value of values)counts.set(value,(counts.get(value)||0)+1);return counts;
    }
    function v24InventoryContains(before,after) {
        for(const [key,count] of before)if((after.get(key)||0)<count)return false;return true;
    }
    function v24InventorySpace(value) { return String(value).replace(/[ \t\r\n]+/g,' ').trim(); }
    function v24InventoryTemplate(raw,cfg={}) {
        const noop=()=>{};let next=automaticCitationRepairs(raw,cfg,noop);
        next=automaticParameters(next,cfg,noop);
        const migrated=multilingualTemplate(next,cfg,noop,noop);if(migrated.handled&&!migrated.blocked)next=migrated.text;
        next=citation(next,cfg,noop,noop);next=extendedCitation(next,cfg,noop,noop);next=auxiliaryTemplate(next,cfg,noop,noop);
        if(cfg.birthDates)next=birthDate(next,noop);if(cfg.obsoleteTemplates)next=obsoleteTemplate(next,noop,noop);
        if(cfg.auxiliaryTemplates)next=auxiliaryParameters(next,noop,noop);return automaticParameters(next,cfg,noop);
    }
    function v24InventoryText(raw,cfg={}) {
        const noop=()=>{};let text=raw;
        if(cfg.links){text=wikiURLs(text,noop);text=cleanLinks(text,noop);text=canonicalPortugueseLinks(text,cfg,noop);}
        return v24InventorySpace(text);
    }
    function v24InventoryBody(raw,cfg={}) {
        const noop=()=>{};let body=raw;
        if(cfg.bareReferences){const refs=refTokens(simpleReferences('<ref>'+body+'</ref>',noop));if(refs.length===1&&refs[0].body!==null)body=refs[0].body;}
        body=mapTemplateTree(body,node=>v24InventoryTemplate(node,cfg));
        body=mapTemplateTree(body,node=>{const p=parsedTemplate(node);if(!CITE_NAMES[p.name])return node;
            const entries=foreignEntries(p).map(e=>[parameterFamily(e.key),v24InventorySpace(e.value)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
            return JSON.stringify([norm(CITE_NAMES[p.name]),entries]);});
        return v24InventoryText(body,cfg);
    }
    function v24InventoryRendererGroup(source,node) {
        const raw=source.slice(node.start,node.end);if(raw.startsWith('<'))return attrsOf(tagAt(raw,0)?.attrs)?.group||'';
        return foreignEntries(parsedTemplate(raw)).find(e=>['grupo','group'].includes(norm(e.key)))?.value.trim()||'';
    }
    function v24InventoryReferences(source,cfg={}) {
        const view=protectedView(source),renderers=rendererRanges(view),keys=[];
        for(const ref of refTokens(view)){if(ref.body===null||!ref.body.trim())continue;const attrs=attrsOf(ref.attrs);if(!attrs)continue;
            const parent=renderers.find(r=>r.start<=ref.start&&ref.start<r.end),group=attrs.group||(parent?v24InventoryRendererGroup(source,parent):'');
            keys.push(JSON.stringify([group,attrs.name||'',v24InventoryBody(ref.body,cfg)]));}
        return v24InventoryCount(keys);
    }
    function v24InventoryPosition(pos,edits,right=false) {
        let shift=0;for(const edit of edits){if(pos<edit.start||pos===edit.start&&!right)break;if(pos<=edit.end)return edit.start+shift+(right?edit.text.length:0);shift+=edit.text.length-(edit.end-edit.start);}return pos+shift;
    }
    function v24InventoryTable(source,table,cfg={}) {
        const rows=[],captions=[];let cells=[];const finish=()=>{if(cells.length){rows.push(cells);cells=[];}};
        const raw=source.slice(table.start,table.end),lines=raw.split(/\r?\n/);lines.shift();
        for(const line of lines){if(/^\s*\|}/.test(line)){finish();break;}if(/^\s*\|-/.test(line)){finish();continue;}
            if(/^\s*\|\+/.test(line)){const part=line.replace(/^\s*\|\+/,''),view=tableCellView(part),at=view.indexOf('|');captions.push(v24InventoryText(at<0?part:part.slice(at+1),cfg));continue;}
            const first=line.match(/^[ \t]*([!|])/);if(!first){if(line.trim()&&cells.length)cells[cells.length-1][1]=v24InventorySpace(cells[cells.length-1][1]+' '+line);continue;}
            const view=tableCellView(line),delimiters=[{at:first[0].length,kind:first[1]}],re=first[1]==='!'?/!!|\|\|/g:/\|\|/g;re.lastIndex=first[0].length;let m;
            while((m=re.exec(view)))delimiters.push({at:m.index+2,kind:m[0]==='!!'?'!':'|'});
            for(let i=0;i<delimiters.length;i++){const d=delimiters[i],end=i+1<delimiters.length?delimiters[i+1].at-2:line.length,attrs=view.slice(d.at,end).indexOf('|'),content=line.slice(d.at+(attrs<0?0:attrs+1),end);cells.push([d.kind,v24InventoryText(content,cfg)]);}}
        finish();return JSON.stringify([captions,rows]);
    }
    function v24InventoryTemplates(source,cfg={}) {
        const view=protectedView(source),out=[];
        for(const node of templates(view).nodes){const raw=source.slice(node.start,node.end);let p=parsedTemplate(v24InventoryTemplate(raw,cfg));const name=p.name;
            if(['portal','portal2','portal3'].includes(name)){
                for(const part of p.parts.slice(1)){const named=part.match(/^\s*\d+\s*=([\s\S]*)$/),value=(named?named[1]:part).trim();if(value&&!/[={}<>\r\n]/.test(value))out.push({node,kind:'portal-slot',key:JSON.stringify(['portal-slot',portalIdentity(value)])});}continue;
            }
            if(V24_SYNTAX_RENDERERS.has(name)){
                const group=foreignEntries(p).find(e=>['grupo','group'].includes(norm(e.key)))?.value.trim()||'';
                out.push({node,kind:'renderer',key:JSON.stringify(['renderer',group])});continue;
            }
            if(name==='dni'){
                const args=p.parts.slice(1).map(x=>x.trim());if(args.length>=3&&args.slice(0,3).every(x=>/^\d+$/.test(x)))out.push({node,kind:'literal-date',key:JSON.stringify(['dni',...args.slice(0,3).map(Number)])});continue;
            }
            if(['small','pequeno','grande','nowrap','nobr','nobreak'].includes(name)){
                const family=['small','pequeno'].includes(name)?'small':['nowrap','nobr','nobreak'].includes(name)?'nowrap':name;
                const args=p.parts.slice(1).map(x=>x.replace(/^\s*1\s*=/,'').trim());out.push({node,kind:'literal-formatting',key:JSON.stringify(['format',family,args.map(x=>v24InventoryText(x,cfg))])});continue;
            }
            if(V24_SYNTAX_CITATIONS.has(name)||CITE_NAMES[name]){
                const entries=foreignEntries(p).map(e=>[parameterFamily(e.key),v24InventoryText(e.value,cfg)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
                out.push({node,kind:'citation',key:JSON.stringify(['citation',norm(CITE_NAMES[name]||name),entries])});
            }
        }
        for(const renderer of rendererRanges(view).filter(r=>source[r.start]==='<'))out.push({node:renderer,kind:'renderer',key:JSON.stringify(['renderer',v24InventoryRendererGroup(source,renderer)])});
        return out;
    }
    function syntaxRepairInventoryProof(expected,actual,plan,cfg={}) {
        const result={applied:!!plan?.edits?.length,accepted:true,reason:'',definitions:0,tables:0,templates:0};if(!result.applied)return result;
        const reject=reason=>({...result,accepted:false,reason});
        // Reference normalization upstream preserves marker multiplicity. This
        // additional multiset retains repeated definitions inside renderer banks.
        const referenceExpected=v24InventoryReferences(expected,cfg),referenceActual=v24InventoryReferences(actual,cfg);result.definitions=[...referenceExpected.values()].reduce((a,b)=>a+b,0);
        if(!v24InventoryContains(referenceExpected,referenceActual))return reject('Uma definição de referência recuperada foi retirada, renomeada, teve o grupo ou conteúdo alterado, ou perdeu uma ocorrência.');
        const baseline=plan.text,baselineTables=tableAnalysis(baseline).tables,actualTables=tableAnalysis(actual).tables,expectedTables=tableAnalysis(expected).tables;
        const tableKeys=new Set();
        for(const edit of plan.edits)for(const rule of edit.proof.rules||[]){if(rule.ruleId!=='syntaxTableClosers')continue;const start=v24InventoryPosition(rule.tableStart,plan.edits),table=baselineTables.find(t=>t.start===start);
            if(!table)return reject('A tabela recuperada não tem um limite confirmado.');tableKeys.add(v24InventoryTable(baseline,table,cfg));result.tables++;}
        if(tableKeys.size){const before=v24InventoryCount(expectedTables.map(t=>v24InventoryTable(expected,t,cfg)).filter(k=>tableKeys.has(k))),after=v24InventoryCount(actualTables.map(t=>v24InventoryTable(actual,t,cfg)));
            if(!before.size||!v24InventoryContains(before,after))return reject('A tabela recuperada perdeu células, uma legenda, conteúdo ou a ordem das linhas.');}
        const targetNodes=[];for(const edit of plan.edits){if(!edit.ruleIds.includes('syntaxTemplateClosers'))continue;const at=v24InventoryPosition(edit.start,plan.edits),names=new Set((edit.proof.rules||[]).filter(r=>r.ruleId==='syntaxTemplateClosers').map(r=>r.template));
            // Adjacent template/ref closers can be one minimal diff span. The
            // template containing its first repaired delimiter is still unique.
            const candidates=templates(protectedView(baseline)).nodes.filter(n=>n.start<=at&&n.end>at&&names.has(parsedTemplate(baseline.slice(n.start,n.end)).name)).sort((a,b)=>(a.end-a.start)-(b.end-b.start));
            if(!candidates.length)return reject('A predefinição recuperada não tem um limite confirmado.');targetNodes.push(candidates[0]);}
        if(targetNodes.length){const allBase=v24InventoryTemplates(baseline,cfg),allExpected=v24InventoryTemplates(expected,cfg),allActual=v24InventoryTemplates(actual,cfg),wanted=new Set();
            for(const node of targetNodes){const values=allBase.filter(x=>x.node.start===node.start&&x.node.end===node.end);if(!values.length)return reject('Não foi possível conferir os dados da predefinição recuperada.');for(const value of values)wanted.add(value.key);result.templates++;}
            const before=new Map(),after=v24InventoryCount(allActual.map(x=>x.key));
            for(const key of wanted){const matches=allExpected.filter(x=>x.key===key),kind=matches[0]?.kind;if(!matches.length)return reject('A predefinição recuperada não corresponde ao texto conferido.');before.set(key,['renderer','portal-slot'].includes(kind)?1:matches.length);}
            if(!v24InventoryContains(before,after))return reject('Uma predefinição recuperada perdeu os dados, a chamada ou uma ocorrência.');}
        return result;
    }
