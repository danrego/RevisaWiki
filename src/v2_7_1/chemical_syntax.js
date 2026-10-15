    Object.assign(GROUP_LABELS,{chemicalLiteralBraces:'Notação literal de nomes químicos na infocaixa',chemicalInchiWrapping:'Quebra de linha de identificadores InChI na infocaixa'});
    const V271_CHEMICAL_FIELDS=Object.freeze({'info/droga':['nome_IUPAC'],'info/química':['IUPACName','SystematicName']});
    function v271ChemicalBoxes(source,cfg={}) {
        if(cfg.namespaceNumber!==0||cfg.infoboxes===false||cfg.pageRedirect||cfg.pageDisambiguation||!v24SyntaxScope(cfg)||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||/~{3,5}/.test(source)||discussionProtectionRanges(source,{discussionPage:true}).length||v24SyntaxScan(source).issues.length)return [];
        const shield=v24SyntaxProtected(source);if(shield.unclosed.length)return [];
        const view=shield.view,blocked=shield.ranges.concat(v27SafeMarkdownRanges(source)),context=structuralRanges(view),boxes=[];
        for(const node of topNodes(view)){
            if(source[node.start-1]==='{'||source[node.end]==='}')continue;
            if(blocked.some(r=>r.start<=node.start&&r.end>node.start)||inRangeExcept(node.start,context,node.start,node.end))continue;
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),profile=V271_CHEMICAL_FIELDS[p.name];if(!profile&&!['info','infocaixa'].includes(p.name))continue;
            const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)continue;const entries=[];let invalid=false;
            for(const part of parts.slice(1)){
                const match=/^(\s*)([^=]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
                if(!match||!/^\p{L}[\p{L}\d _/-]*$/u.test(match[2].trim())){invalid=true;break;}
                entries.push({key:match[2].trim(),value:match[4],start:node.start+2+part.start+match[1].length+match[2].length+match[3].length});
            }
            if(invalid)continue;
            boxes.push({template:p.name,profile,entries,nodeStart:node.start,nodeEnd:node.end,blocked});
        }
        return boxes;
    }
    function v271ChemicalFields(source,cfg={},kind='iupac') {
        const fields=[];
        for(const box of v271ChemicalBoxes(source,cfg)){
            const generic=['info','infocaixa'].includes(box.template),entries=box.entries;let wanted=kind==='iupac'?box.profile||[]:[];
            if(generic){
                const labels=entries.filter(e=>/^rótulo[1-9]\d{0,2}$/.test(e.key)&&(kind==='iupac'?e.value.trim()==='Nome IUPAC':['InChI','InChI (forma hidratada)'].includes(e.value.trim())));
                const counts=new Map();for(const e of labels)counts.set(e.value.trim(),(counts.get(e.value.trim())||0)+1);
                wanted=labels.filter(e=>counts.get(e.value.trim())===1&&entries.filter(x=>x.key===e.key).length===1).map(e=>'dados'+e.key.slice(6));
                if(kind==='iupac'&&labels.length!==1)continue;
                if(kind==='inchi'&&entries.some(e=>e.value.trim()&&/(?:estilo|style|classe)/i.test(e.key)))continue;
            }
            for(const key of wanted){const found=entries.filter(e=>e.key===key);if(found.length!==1)continue;
                fields.push({...found[0],template:box.template,nodeStart:box.nodeStart,nodeEnd:box.nodeEnd,blocked:box.blocked});}
        }
        return fields;
    }
    function v271ChemicalBraceOffsets(value) {
        const text=value.trim();
        if(!text||/[\r\n]/.test(text)||/\{\{|\}\}|\[\[|\]\]|<!--|\}-|(?:https?:\/\/|\/\/|\bwww\.)/i.test(text)||/<\s*\/?\s*(?:ref|references|math|code|nowiki|pre|source|syntaxhighlight|blockquote|q)\b/i.test(text))return [];
        const stack=[],groups=[],tagSpans=[];
        for(let i=0;i<value.length;){const tag=v24SyntaxTag(value,i);if(tag){tagSpans.push({start:i,end:tag.end});i=tag.end;continue;}
            if(value[i]==='{')stack.push(i);
            else if(value[i]==='}'){
                if(!stack.length)return [];const start=stack.pop();groups.push({start,end:i});
            }i++;
        }
        if(stack.length)return [];
        const candidates=groups.filter(g=>value[g.start-1]==='-');if(!candidates.length)return [];
        if(candidates.some(g=>/[:;|]|=>/.test(decodedReferenceName(value.slice(g.start+1,g.end)))))return [];
        return candidates.map(g=>g.start).filter(start=>!tagSpans.some(t=>t.start<=start&&start<t.end)).sort((a,b)=>a-b);
    }
    function v271ChemicalBraceEdits(source,cfg={}) {
        if(!source.includes('-{'))return [];
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const field of v271ChemicalFields(source,cfg)){
            const positions=v271ChemicalBraceOffsets(field.value);if(!positions.length)continue;
            const absolute=positions.map(i=>field.start+i);if(absolute.some(at=>field.blocked.some(r=>r.start<=at&&at<r.end)))continue;
            for(const at of absolute)edits.push({start:at,end:at+1,text:'&#123;',ruleId:'chemicalLiteralBraces',proof:{sourceHash,template:field.template,key:field.key,fieldStart:field.start,fieldValue:field.value,positions,condition:'one verified literal chemical-name field; balanced braces; no language-converter terminator, maps, dynamic syntax or protected source'}});
        }
        return edits;
    }
    function v271ChemicalInchiEdits(source,cfg={}) {
        if(!source.includes('InChI')||!source.includes('1S/'))return [];
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const field of v271ChemicalFields(source,cfg,'inchi')){
            const token=field.value.trim();
            if(token.length<80||!/^1S\/[A-Za-z0-9/().,;*+\-]+$/.test(token))continue;
            const start=field.start+field.value.indexOf(token),end=start+token.length;
            if(field.blocked.some(r=>r.start<end&&r.end>start))continue;
            edits.push({start,end,text:'<span style="overflow-wrap:anywhere;">'+token+'</span>',ruleId:'chemicalInchiWrapping',proof:{sourceHash,template:field.template,key:field.key,fieldStart:field.start,fieldValue:field.value,token,condition:'one verified literal InChI label/data pair; raw single-line ASCII 1S/ token of at least 80 characters; no pre-existing markup, classes or styles'}});
        }
        return edits;
    }
    function v271ChemicalSyntaxPlan(source,cfg={}) {
        const edits=v271ChemicalBraceEdits(source,cfg).concat(v271ChemicalInchiEdits(source,cfg));return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v271ChemicalSyntaxProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const fresh=v271ChemicalSyntaxPlan(before,cfg);return plan.text===after&&fresh.text===after&&JSON.stringify(plan.edits)===JSON.stringify(fresh.edits);
    }
    function v271ChemicalInventoryProof(plan,expected,actual) {
        const steps=plan.safe.steps.filter(s=>['v271-chemical-literal-braces','v271-chemical-inchi-wrapping'].includes(s.name));if(!steps.length)return {accepted:true,reason:''};
        const wanted=new Set(steps.flatMap(s=>s.edits.map(e=>e.proof.template))),cfg=plan.cfg;
        const inventory=source=>{const out=[],noop=()=>{};
            for(const box of v271ChemicalBoxes(source,cfg).filter(b=>wanted.has(b.template))){
                const raw=source.slice(box.nodeStart,box.nodeEnd),normalized=infobox(automaticParameters(raw,cfg,noop),noop,noop),p=parsedTemplate(normalized);
                const fields=templateEntries(p).filter(e=>e.value.trim()).map(e=>[e.key,v24InventoryBody(e.value,cfg)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
                out.push(JSON.stringify([p.name,fields]));
            }return v24InventoryCount(out);};
        const duplicateBoxes=structuralArticlePlan(expected,cfg).boxRemovals;
        const approvedExpected=duplicateBoxes.length?v24SyntaxApply(expected,duplicateBoxes.map(n=>({start:n.start,end:n.end,text:''}))):expected;
        if(!v24InventoryContains(inventory(approvedExpected),inventory(actual)))return {accepted:false,reason:'Uma informação da infocaixa foi alterada além da codificação literal ou da formatação confirmada do identificador químico.'};
        return {accepted:true,reason:''};
    }
