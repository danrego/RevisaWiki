    // O plano vem sempre do texto recebido, nunca de uma prova fornecida pelo editor.
    function syntaxRepairSourceProof(before,after,options={}) {
        const result={applied:false,accepted:true,ok:true,reason:'',repairs:0};
        if(before===after)return result;
        const cfg=pageContextOptions({...DEFAULTS,...options}),plan=syntaxRepairPlan(before,cfg);
        if(!plan.edits.length)return result;
        result.applied=true;result.repairs=plan.edits.length;result.baseline=plan.text;
        const reject=reason=>({...result,accepted:false,ok:false,reason});
        const next=syntaxRepairPlan(after,cfg);
        if(next.edits.length)return reject('A seleção deixou um reparo de sintaxe incompleto.');
        const approved=syntaxRepairPlan(plan.text,cfg);
        const issueCounts=issues=>issues.reduce((m,i)=>(m[i.code]=(m[i.code]||0)+1,m),Object.create(null));
        const oldIssues=issueCounts(approved.unresolved),newIssues=issueCounts(next.unresolved);
        if(Object.entries(newIssues).some(([code,n])=>n>(oldIssues[code]||0)))
            return reject('A seleção introduziu código sem fechamento ou outra estrutura incompleta.');
        if(approved.unresolved.length&&!after.endsWith(plan.text.slice(approved.safePrefixEnd)))
            return reject('O trecho incompleto preservado foi alterado.');
        const normalize=source=>{
            const c={...DEFAULTS,namespaceNumber:0},noop=()=>{};
            let s=normalizeNumericReferenceNames(source,c,noop,noop);
            s=neutralAutomaticReferenceNames(s,c,noop);
            s=normalizeRefs(s,c,noop,noop);
            return automaticIdenticalReferences(s,c,noop);
        };
        const expected=normalize(plan.text),actual=normalize(after);
        const inventory=syntaxRepairInventoryProof(expected,actual,plan,cfg);
        if(!inventory.accepted)return reject(inventory.reason);
        const markers=source=>{
            const view=protectedView(source),renderers=rendererRanges(view),counts=new Map();
            for(const ref of refTokens(view)){
                if(inRange(ref.start,renderers))continue;
                const a=attrsOf(ref.attrs);if(!a)continue;
                const key=JSON.stringify([a.group||'',a.name||'']);
                counts.set(key,(counts.get(key)||0)+1);
            }
            return counts;
        };
        const newMarkers=markers(actual);
        if([...markers(expected)].some(([key,n])=>(newMarkers.get(key)||0)<n))
            return reject('Uma chamada de referência recuperada pelo reparo foi retirada ou renomeada.');
        return result;
    }
    function syntaxRepairTransactions(before,after,hunks) {
        if(before===after||!syntaxRepairPlan(before,{...DEFAULTS,namespaceNumber:0}).edits.length)return hunks;
        // As regras seguintes dependeram da estrutura reparada. A seleção é atômica.
        return hunks.map(h=>({...h,transaction:'syntax-repair-transaction',dependent:hunks.length>1}));
    }
    function syntaxPrefixOptions(cfg) {
        return {...cfg,syntaxRepairs:false,partialSyntaxRecovery:false,structuralRepairs:false,
            translationResidues:false,review:false,sectionOnly:true,autoMinor:false,
            references:false,numericRefNames:false,neutralReferenceNames:false,moveNamedRefs:false,
            automaticIdenticalReferences:false,referenceColumns:false,unifiedNotesReferences:false,
            endMatter:false,endMatterColumns:false,endTemplateOrder:false,endSectionOrder:false,
            externalLinkColumns:false,authorityControl:false,portals:false,biographyPortal:false,
            automaticBiographyPortals:false,livingBirthAge:false,birthDates:false,occupationCase:false,
            biographyStyleChecks:false,tableChecks:false,automaticTableRepairs:false,headings:false,
            shortDescriptions:false,obsoleteTemplates:false,maintenance:false,categories:false};
    }
    function syntaxPreviewDecision(original,baseline,after,Parser,beforeSource,afterSource,options={}) {
        const proof=syntaxRepairSourceProof(beforeSource,afterSource,options);
        if(!proof.applied)return previewDecision(original,after,Parser,beforeSource,afterSource);
        const reject=reason=>({checked:true,accepted:false,introduced:[reason],resolved:[],syntaxBaselineChecked:false});
        if(!proof.accepted)return reject(proof.reason);
        if(!baseline||baseline.source!==proof.baseline||typeof baseline.text!=='string')
            return reject('A pré-visualização intermediária não corresponde ao reparo de sintaxe confirmado.');
        const decision=previewDecision(baseline,after,Parser,proof.baseline,afterSource);
        const old=renderedAudit(original.text,original.parsewarnings,Parser),now=renderedAudit(after.text,after.parsewarnings,Parser);
        const introduced=decision.introduced.slice();
        for(const finding of now.findings)if(!old.findings.includes(finding)&&!introduced.includes(finding))introduced.push(finding);
        const errors=parsed=>{
            const doc=new Parser().parseFromString(parsed.text,'text/html'),counts=new Map();
            doc.querySelectorAll('.mw-ext-cite-error,.cite-error,.error,.cs1-visible-error,.cs1-hidden-error,.scribunto-error').forEach(e=>{
                const key=e.textContent.replace(/\s+/g,' ').trim();if(key)counts.set(key,(counts.get(key)||0)+1);
            });return counts;
        };
        const previous=errors(original),current=errors(after);
        for(const [key,n]of current)if(n>(previous.get(key)||0)&&!introduced.includes(key))introduced.push(key);
        return {...decision,accepted:introduced.length===0,introduced,
            resolved:old.findings.filter(f=>!now.findings.includes(f)),syntaxBaselineChecked:true,
            syntaxProof:{applied:true,accepted:true,repairs:proof.repairs}};
    }
