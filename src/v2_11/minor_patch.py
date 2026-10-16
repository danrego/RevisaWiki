"""Source-bound minor-edit classification for the 2.11 release."""


def apply(source):
    start = source.index("    function mechanicalMinorResult(source,options={}) {")
    end = source.index("\n    function shortCitationAudit(source)", start)
    source = source[:start] + r'''    // Each candidate must be reproduced from the saved source using only the
    // finite formatting rules below. Bytes and comparison blocks are not a
    // definition of a minor edit. Content and maintenance additions stay out.
    function v211MinorMechanicalPlan(source,options={}) {
        const cfg={...DEFAULTS,...options,automaticTopicPortals:false,biographyPortal:false,
            automaticBiographyPortals:false,authorityControl:false,portals:false,categories:false,
            maintenance:false,livingBirthAge:false,occupationCase:false,redundantBirthCategories:false},noop=()=>{},steps=[];
        let text=source;
        const stage=(name,run)=>{const before=text;text=run(text);if(text!==before)steps.push({name,before,after:text});};
        const edits=find=>s=>v24SyntaxApply(s,find(s,cfg));
        stage('reference-tag-spacing',edits(v210ReferenceSyntaxEdits));
        stage('table-syntax',edits(v210TableSyntaxEdits));
        stage('table-numeric-quotes',edits(v272TableCellEdits));
        stage('table-extra-quotes',edits(v29TableSyntaxEdits));
        stage('reference-closers',edits(v29ReferenceSyntaxEdits));
        stage('table-equal-attributes',edits(v29TableDuplicateAttributeEdits));
        stage('table-leaf-scopes',edits(v29TableLeafScopeEdits));
        stage('table-deep-scopes',edits(v210TableDeepLeafScopeEdits));
        stage('responsive-table-layout',edits(v210ResponsiveTableEdits));
        stage('reference-conflicts',edits(v210ReferenceConflictEdits));
        if(cfg.references){
            if(cfg.automaticIdenticalReferences)stage('equivalent-reference-bodies',edits(v25SafeCitationReferenceEdits));
            stage('reference-syntax',edits(v29ReferenceRepairEdits));
            stage('reference-bank-reuse',edits(v210ReferenceBankEdits));
        }
        stage('identifier-url-syntax',s=>v29IdentifierPlan(s,cfg).text);
        const shield=maskProtected(text,noop);
        let s=shield.text;
        // Reuse catalog equivalences without translating biography facts,
        // changing ages, inferring professions or adding subject templates.
        s=mapTemplateTree(s,raw=>{
            let next=automaticParameters(raw,cfg,noop);
            next=citation(next,cfg,noop,noop);
            next=extendedCitation(next,cfg,noop,noop);
            return automaticParameters(next,cfg,noop);
        });
        if(cfg.links){s=wikiURLs(s,noop);s=cleanLinks(s,noop);}
        if(cfg.headings)s=cleanHeadings(s,noop,cfg.multilingual);
        if(cfg.references){
            s=normalizeNumericReferenceNames(s,cfg,noop,noop);
            s=neutralAutomaticReferenceNames(s,cfg,noop);
            s=normalizeRefs(s,cfg,noop,noop);
            s=automaticIdenticalReferences(s,cfg,noop);
            s=normalizeLists(s,noop,noop);
        }
        if(cfg.markup)s=markupPass(s,noop);
        // Moving annual subsection titles out of a table is deliberately not
        // part of this classification. Finite cell and scope repairs are.
        s=automaticTables(s,{...cfg,headings:false},noop,noop);
        if(cfg.references)s=refPunctuation(s,noop,noop);
        if(cfg.links)s=cleanLinks(s,noop);
        if(cfg.headings)s=cleanHeadings(s,noop,cfg.multilingual);
        if(cfg.references)s=normalizeLists(s,noop,noop);
        s=referenceColumns(s,cfg,noop);
        s=automaticSpelling(s,cfg,noop,noop);
        s=automaticInfoboxAlignment(s,cfg,noop);
        const restored=shield.restore(s);
        if(restored!==text)steps.push({name:'catalog-and-formatting-equivalences',before:text,after:restored});
        return {source,text:restored,steps};
    }
    function mechanicalMinorResult(source,options={}) {
        return v211MinorMechanicalPlan(source,options).text;
    }
    function v211MinorSubset(before,after,expected,options={}) {
        // A selected subset must contain complete source-bound comparison
        // units. Reference renames and other dependent units move together.
        const hunks=comparison(before,{text:expected},options);
        if(!hunks.length||hunks.length>20000)return false;
        const last=new Map();
        hunks.forEach((h,i)=>{if(h.transaction)last.set(h.transaction,i);});
        let states=[{at:0,choices:new Map()}],cursor=0;
        for(let index=0;index<hunks.length;index++){
            const h=hunks[index],gap=before.slice(cursor,h.start),next=[],seen=new Set();
            for(const state of states){
                if(!after.startsWith(gap,state.at))continue;
                const at=state.at+gap.length,prior=h.transaction?state.choices.get(h.transaction):undefined;
                for(const accepted of [false,true]){
                    if(prior!==undefined&&prior!==accepted)continue;
                    const value=accepted?h.after:h.before;
                    if(!after.startsWith(value,at))continue;
                    const choices=new Map(state.choices);
                    if(h.transaction){if(last.get(h.transaction)>index)choices.set(h.transaction,accepted);else choices.delete(h.transaction);}
                    const end=at+value.length,key=end+'|'+JSON.stringify([...choices]);
                    if(!seen.has(key)){seen.add(key);next.push({at:end,choices});}
                }
            }
            // This bounds only an ambiguous proof search. It does not turn a
            // substantive edit into a minor edit or impose a byte threshold.
            if(!next.length||next.length>4096)return false;
            states=next;cursor=h.end;
        }
        const tail=before.slice(cursor);
        return states.some(state=>state.choices.size===0&&after.slice(state.at)===tail);
    }
    function minorEligibility(before,after,options={}) {
        const metrics=options.metrics||byteMetrics(before,after,options.hunks);
        const result={eligible:false,metrics,reason:''};
        if(before===after){result.reason='Nenhuma alteração.';return result;}
        if(options.namespaceNumber!==0||options.sectionOnly){result.reason='Marcação automática limitada à edição completa de artigos.';return result;}
        if(options.minorBaseConfirmed!==true){result.reason='O rascunho não foi confirmado como alteração exclusiva da revisão de origem.';return result;}
        const expected=mechanicalMinorResult(before,options);
        if(expected!==after&&!v211MinorSubset(before,after,expected,options)){result.reason='Há alterações fora dos ajustes mecânicos confirmados.';return result;}
        return {...result,eligible:true,reason:'Somente ajustes mecânicos confirmados na revisão de origem.'};
    }
''' + source[end:]
    old = "parserCacheStatus, automaticParameters, automaticIdenticalReferences, byteMetrics, minorEligibility, mechanicalMinorResult,"
    if source.count(old) != 1:
        raise ValueError("Minor edit export anchor changed")
    source = source.replace(old, old + " v211MinorMechanicalPlan, v211MinorSubset,")
    label = "'Marcar ajustes pequenos e mecânicos como edição menor'"
    if source.count(label) != 1:
        raise ValueError("Minor edit option label changed")
    return source.replace(label, "'Marcar correções mecânicas confirmadas como edição menor'")
