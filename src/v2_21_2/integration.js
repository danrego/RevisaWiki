    // Re-derive every added edit from the current source. The inherited
    // preservation and composition checks remain the final authority.
    function v221RepairPlan(source, options = {}) {
        const cfg = pageContextOptions({...DEFAULTS, ...options});
        cfg.biographyOriginalSource = options.biographyOriginalSource ?? source;
        cfg.citationOriginalSource = options.citationOriginalSource ?? source;
        const plan = {source, sourceHash: v24SyntaxHash(source), text: source, steps: [], edits: []};
        function apply(family, make, prove) {
            const before = plan.text;
            const part = make(before, cfg);
            if (!part || typeof part.text !== 'string') throw new Error('O plano não corresponde ao rascunho.');
            if (part.text === before) return;
            if (!prove(before, part.text, part, cfg)) throw new Error('A conferência do reparo falhou. O rascunho foi preservado.');
            const edits = part.edits || (part.steps || []).flatMap(row => row.plan?.edits || row.edits || []);
            plan.steps.push({family, before, after: part.text, plan: part});
            plan.edits.push(...edits);
            plan.text = part.text;
        }
        apply('2.21.2-structure-prerequisites', v2212StructurePrerequisitePlan, v2212StructurePrerequisiteProof);
        apply('2.21.2-citations-initial', v2212CitationPlan, v2212CitationProof);
        apply('2.21.2-structure-initial', v2212StructurePlan, v2212StructureProof);
        apply('previous-verified-repairs', v2212BaselineRepairPlan, v2212BaselineRepairProof);
        apply('2.21.2-citations-final', v2212CitationPlan, v2212CitationProof);
        apply('2.21.2-structure-final', v2212StructurePlan, v2212StructureProof);
        apply('2.21.2-portals', v2212PortalPlan, v2212PortalProof);
        return plan;
    }
    function v2212BaselineRepairProof(before, after, plan, cfg) {
        if (!plan || plan.source !== before || plan.sourceHash !== v24SyntaxHash(before) || plan.text !== after) return false;
        const fresh = v2212BaselineRepairPlan(before, cfg);
        return fresh.text === after && JSON.stringify(fresh.steps) === JSON.stringify(plan.steps);
    }
