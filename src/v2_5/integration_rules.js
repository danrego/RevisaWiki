    // The comparison baseline is regenerated from the exact source. It only
    // contains the finite repairs approved by the 2.5 and 2.4 rule sets.
    function v25ApprovedSyntaxPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),safe=v25SafeRepairPlan(source,cfg),heading=v25LeadHeadingPlan(safe.text,cfg),legacy=syntaxRepairPlan(heading.text,cfg);
        return {source,cfg,safe,heading,legacy,preLegacy:heading.text,text:legacy.text,newRepairs:safe.edits.length+heading.edits.length,repairs:safe.edits.length+heading.edits.length+legacy.edits.length};
    }
    function v25ReferenceProofNormalization(source,cfg={}) {
        const c={...DEFAULTS,...cfg,namespaceNumber:0},noop=()=>{},shield=maskProtected(source,noop);let text=shield.text;if(c.bareReferences)text=simpleReferences(text,noop);
        // Use the same literal protection as ordinary cleanup. A reference
        // containing nowiki or another protected block must not acquire a
        // proof-only generated name that the real cleanup cannot assign.
        const edits=[];for(const ref of refTokens(text)){if(ref.body===null)continue;
            let body=mapTemplateTree(ref.body,raw=>{const converted=v24InventoryTemplate(raw,c);return CITE_NAMES[parsedTemplate(converted).name]?converted:raw;});if(c.links){body=wikiURLs(body,noop);body=cleanLinks(body,noop);}
            if(body!==ref.body)edits.push({start:ref.openEnd,end:ref.openEnd+ref.body.length,text:body});}
        text=applyEdits(text,edits);text=normalizeNumericReferenceNames(text,c,noop,noop);text=neutralAutomaticReferenceNames(text,c,noop);text=normalizeRefs(text,c,noop,noop);
        return shield.restore(automaticIdenticalReferences(text,c,noop));
    }
    function v25ReferenceMarkerInventory(source) {
        const view=protectedView(source),renderers=rendererRanges(view),counts=new Map();
        for(const ref of refTokens(view)){if(inRange(ref.start,renderers))continue;const attrs=attrsOf(ref.attrs);if(!attrs)continue;const key=JSON.stringify([attrs.group||'',attrs.name||'']);counts.set(key,(counts.get(key)||0)+1);}
        return counts;
    }
    function v25ReferenceBindingSequence(source,cfg={}) {
        const view=protectedView(source),renderers=rendererRanges(view),refs=refTokens(view),definitions=new Map(),identity=(group,name)=>JSON.stringify([group,name]);
        for(const ref of refs){if(ref.body===null||!ref.body.trim())continue;const attrs=attrsOf(ref.attrs);if(!attrs||!attrs.name)continue;
            const parent=renderers.find(r=>r.start<=ref.start&&ref.start<r.end),group=attrs.group||(parent?v24InventoryRendererGroup(source,parent):''),key=identity(group,attrs.name);
            if(!definitions.has(key))definitions.set(key,new Set());definitions.get(key).add(v24InventoryBody(ref.body,cfg));}
        return refs.filter(ref=>!inRange(ref.start,renderers)).map(ref=>{const attrs=attrsOf(ref.attrs);if(!attrs)return ['unparsed',ref.attrs,ref.body];
            const group=attrs.group||'',name=attrs.name||'';if(ref.body!==null)return [group,'resolved',v24InventoryBody(ref.body,cfg)];
            const bodies=definitions.get(identity(group,name));return bodies?[group,'resolved',...Array.from(bodies).sort()]:[group,'unresolved',name];});
    }
    function v25ProtectedLiteralInventory(source) {
        const shield=maskProtected(source,()=>{}),counts=new Map();for(const token of shield.text.matchAll(/\uE000AJGX*\d+\uE001/g)){
            const key=normalizeGallery(shield.restore(token[0]));counts.set(key,(counts.get(key)||0)+1);}return counts;
    }
    function v25HTMLTableInventory(source,cfg={}) {
        const tokens=v24SyntaxScan(source).tokens,stack=[],keys=[];
        for(const token of tokens){if(token.name!=='table'||token.self)continue;if(!token.close)stack.push(token);else {const opening=stack.pop();if(opening)keys.push(v24InventoryBody(source.slice(opening.end,token.start),cfg));}}
        return v24InventoryCount(keys);
    }
    function v25RepairObjectProof(plan,expected,actual) {
        const result={accepted:true,reason:''},reject=reason=>({...result,accepted:false,reason}),cfg=plan.cfg;
        // Compare against the approved baseline, where the intentional
        // definition/call consolidation has already happened. Multiplicity,
        // groups, names, all citation fields and bodies still participate.
        if(!v24InventoryContains(v24InventoryReferences(expected,cfg),v24InventoryReferences(actual,cfg)))return reject('Uma definição de referência perdeu o nome, grupo, conteúdo ou uma ocorrência fora dos ajustes confirmados.');
        if(!v24InventoryContains(v25ReferenceMarkerInventory(expected),v25ReferenceMarkerInventory(actual)))return reject('Uma chamada de referência foi retirada ou renomeada fora dos ajustes confirmados.');
        if(JSON.stringify(v25ReferenceBindingSequence(expected,cfg))!==JSON.stringify(v25ReferenceBindingSequence(actual,cfg)))return reject('A ordem das chamadas ou a ligação com o conteúdo da referência foi alterada fora dos ajustes confirmados.');
        if(!v24InventoryContains(v25ProtectedLiteralInventory(expected),v25ProtectedLiteralInventory(actual)))return reject('Um exemplo, comentário ou bloco literal foi alterado fora dos ajustes confirmados.');
        const wantedTemplates=new Map(),wantedTableIndexes=new Set();let touchedHTMLTable=false;
        for(const step of plan.safe.steps){
            if(step.name==='mixed-template-closers'){
                const nodes=templates(protectedView(step.after)).nodes,inventory=v24InventoryTemplates(step.after,cfg);
                for(const edit of step.edits){const matches=nodes.filter(n=>n.start<=edit.start&&edit.start<n.end&&parsedTemplate(step.after.slice(n.start,n.end)).name===edit.proof.template).sort((a,b)=>a.end-a.start-(b.end-b.start));
                    if(!matches.length)return reject('A predefinição corrigida não tem um limite confirmado.');const node=matches[0],values=inventory.filter(x=>x.node.start===node.start&&x.node.end===node.end);if(!values.length)return reject('Não foi possível conferir os dados da predefinição corrigida.');for(const value of values)wantedTemplates.set(value.key,value.kind);}
            }
            if(step.name==='duplicate-literal-attributes')for(const edit of step.edits){if(edit.proof.tag==='table')touchedHTMLTable=true;if(edit.proof.tag!=='wikitable')continue;
                const index=tableAnalysis(step.before).tables.findIndex(t=>t.start===edit.proof.openingStart);if(index<0)return reject('A tabela com atributos repetidos não tem um limite confirmado.');wantedTableIndexes.add(index);}
        }
        if(wantedTemplates.size){const before=v24InventoryTemplates(expected,cfg),after=v24InventoryCount(v24InventoryTemplates(actual,cfg).map(x=>x.key));
            for(const [key,kind]of wantedTemplates){const amount=before.filter(x=>x.key===key).length,required=['renderer','portal-slot'].includes(kind)?1:amount;if(!amount||(after.get(key)||0)<required)return reject('Uma predefinição corrigida perdeu a chamada, os dados ou uma ocorrência.');}}
        if(wantedTableIndexes.size){const tables=tableAnalysis(plan.text).tables,wanted=new Set();for(const index of wantedTableIndexes){if(!tables[index])return reject('A tabela corrigida deixou de existir no texto confirmado.');wanted.add(v24InventoryTable(plan.text,tables[index],cfg));}
            const before=v24InventoryCount(tableAnalysis(expected).tables.map(t=>v24InventoryTable(expected,t,cfg)).filter(key=>wanted.has(key))),after=v24InventoryCount(tableAnalysis(actual).tables.map(t=>v24InventoryTable(actual,t,cfg)));
            if(!before.size||!v24InventoryContains(before,after))return reject('A tabela corrigida perdeu uma célula, legenda, conteúdo ou a ordem das linhas.');}
        if(touchedHTMLTable&&!v24InventoryContains(v25HTMLTableInventory(expected,cfg),v25HTMLTableInventory(actual,cfg)))return reject('Uma tabela HTML corrigida perdeu conteúdo ou uma ocorrência.');
        return result;
    }
    function syntaxRepairSourceProof(before,after,options={}) {
        if(before===after)return {applied:false,accepted:true,ok:true,reason:'',repairs:0};
        const plan=v25ApprovedSyntaxPlan(before,options);if(!plan.newRepairs)return v24LegacySyntaxRepairSourceProof(before,after,options);
        const result={applied:true,accepted:true,ok:true,reason:'',repairs:plan.repairs,baseline:plan.text,newRepairs:plan.newRepairs},reject=reason=>({...result,accepted:false,ok:false,reason});
        const next=v25ApprovedSyntaxPlan(after,options);if(next.newRepairs||next.legacy.edits.length)return reject('A seleção deixou um ajuste confirmado incompleto.');
        const legacy=v24LegacySyntaxRepairSourceProof(plan.preLegacy,after,options);if(!legacy.accepted)return reject(legacy.reason);
        const approved=syntaxRepairPlan(plan.text,plan.cfg),current=syntaxRepairPlan(after,plan.cfg),counts=issues=>issues.reduce((out,issue)=>(out[issue.code]=(out[issue.code]||0)+1,out),Object.create(null));
        const oldIssues=counts(approved.unresolved),newIssues=counts(current.unresolved);if(Object.entries(newIssues).some(([key,value])=>value>(oldIssues[key]||0)))return reject('A seleção introduziu código sem fechamento ou outra estrutura incompleta.');
        if(approved.unresolved.length&&!after.endsWith(plan.text.slice(approved.safePrefixEnd)))return reject('O trecho incompleto preservado foi alterado.');
        const objectProof=v25RepairObjectProof(plan,v25ReferenceProofNormalization(plan.text,plan.cfg),v25ReferenceProofNormalization(after,plan.cfg));if(!objectProof.accepted)return reject(objectProof.reason);
        return result;
    }
    function syntaxRepairEquivalenceSource(source,cfg={}) {return v25ApprovedSyntaxPlan(source,cfg).text;}
    function preservationAudit(before,after,options={}) {
        const plan=v25ApprovedSyntaxPlan(before,options);if(!plan.newRepairs)return v24LegacyPreservationAudit(before,after,options);
        const findings=v24LegacyPreservationAudit(plan.preLegacy,after,options),proof=syntaxRepairSourceProof(before,after,options);
        if(!proof.accepted&&!findings.some(f=>f.code==='lost-repaired-reference'))findings.push({code:'lost-repaired-reference',message:proof.reason,start:-1,severity:'warning'});
        return findings;
    }
    function safeComposition(before,after,options={}) {
        const plan=v25ApprovedSyntaxPlan(before,options);if(!plan.newRepairs)return v24LegacySafeComposition(before,after,options);
        const proof=syntaxRepairSourceProof(before,after,options);return proof.accepted?v24LegacySafeComposition(plan.preLegacy,after,options):proof.reason;
    }
    function syntaxRepairTransactions(before,after,hunks,options={}) {
        if(before===after)return hunks;const plan=v25ApprovedSyntaxPlan(before,options);
        if(!plan.newRepairs)return v24LegacySyntaxRepairTransactions(before,after,hunks,options);
        return hunks.map(h=>({...h,transaction:'syntax-repair-transaction',dependent:hunks.length>1}));
    }
