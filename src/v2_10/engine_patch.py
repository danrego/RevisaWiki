"""Install exact-source shared reads and dependency-bound recovery."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('2.10 engine anchor missing or repeated: ' + before[:90])
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('engine.js').read_text()
    source = replace(source, '    function v25SafeRepairPlan(source,cfg={}) {', module + '\n    function v25SafeRepairPlan(source,cfg={}) {')
    source = replace(source, '    function v29TableStaticBounds(source) {',
                     "    function v29TableStaticBounds(source) {return v210Memo(source,'v29-static-tables',()=>v210UncachedTableBounds(source));}\n    function v210UncachedTableBounds(source) {")
    source = replace(source, '    function v29TableModel(source,table,duplicates=false) {',
                     "    function v29TableModel(source,table,duplicates=false) {return v210Memo(source,'table-model:'+table.start+':'+table.end+':'+duplicates+':'+v24SyntaxHash(JSON.stringify(table)),()=>v210UncachedTableModel(source,table,duplicates));}\n    function v210UncachedTableModel(source,table,duplicates=false) {")
    source = replace(source, '        if (cfg.registryDoiCheck === false || !cfg.citations || !cfg.citationRepairs ||',
                     '        await v210PrepareHarvardProofs(task,cfg);\n        if (cfg.registryDoiCheck === false || !cfg.citations || !cfg.citationRepairs ||')
    source = replace(source, '            let isolated = null;',
                     '            let isolated = await v210VerifyIndependentGroups(task,options,before,initialDecision);')
    source = replace(source, '        let previewTimer=null;', '        let previewTimer=null,v210PreviewRejected=false;')
    source = replace(source, '            const initialDecision=decision;', '            const initialDecision=decision;v210PreviewRejected=!decision.accepted;')
    source = replace(source, "                omitted:isolated?.key || 'Todos os ajustes desta execução'};",
                     "                omitted:isolated?.key || 'Todos os ajustes desta execução',independentGroups:isolated?.decision?.independentGroups||null};")
    source = replace(source, "            result.previewCheck = {checked:false,status:'incomplete',reason:onlineError(error)};",
                     "            if(v210PreviewRejected){\n"
                     "                const fresh=await computeLocal(task,{kind:'refresh',source:task.source,originalSource:appliedBaseline(editor(),task.source),options});\n"
                     "                task.guard();fresh.previewCheck={checked:true,status:'rollback',accepted:true,omitted:'Ajustes não confirmados após uma falha de pré-visualização'};return fresh;\n"
                     "            }\n"
                     "            result.previewCheck = {checked:false,status:'incomplete',reason:onlineError(error)};")
    source = replace(source, '            for (const key of (preferred.length ? preferred : keys).slice(0,2)) {',
                     '            for (const key of (isolated?[]:(preferred.length ? preferred : keys).slice(0,2))) {')
    source = replace(source, "        const allowCache=(!Array.isArray(cfg.doiRepairProofs)||cfg.doiRepairProofs.length===0)&&!cfg.birthCategoryProof,", 
                     "        const allowCache=(!Array.isArray(cfg.doiRepairProofs)||cfg.doiRepairProofs.length===0)&&(!Array.isArray(cfg.harvardAnchorProofs)||cfg.harvardAnchorProofs.length===0)&&!cfg.birthCategoryProof,")
    source = replace(source, '    function syntaxRepairSourceProof(before,after,options={}) {',
                     "    function syntaxRepairSourceProof(before,after,options={}) {\n        const independent=v210IndependentSubsetProof(before,after,options);if(independent.accepted)return independent;")
    source = replace(source, '    function v281PreviousPreservationAudit(before,after,options={}) {',
                     "    function v281PreviousPreservationAudit(before,after,options={}) {\n        if(v210IndependentSubsetProof(before,after,options).accepted)return [];")
    source = replace(source, '    function v281PreviousSafeComposition(before,after,options={}) {',
                     "    function v281PreviousSafeComposition(before,after,options={}) {\n        if(v210IndependentSubsetProof(before,after,options).accepted)return '';")
    source = replace(source, '        v29TableEnabled,v29TableAttributes,',
                     '        v210SerializableOptions:serializableOptions,v210Memo,v210StructuralIndex,v210StructuralCacheStatus,v210ClearStructuralCache,v210IndependentRepairPlan,v210IndependentProjection,v210IndependentSubsetProof,\n        v29TableEnabled,v29TableAttributes,')
    source = replace(source, "'discussionPage','doiRepairProofs','noteRendererProofs'",
                     "'discussionPage','doiRepairProofs','harvardAnchorProofs','noteRendererProofs'")
    source = replace(source, "text: context.text, contentmodel: 'wikitext', prop: 'text|images|templates|parsewarnings', preview: true});",
                     "text: context.text, contentmodel: 'wikitext', prop: 'text|images|templates|parsewarnings', preview: true, disablelimitreport: true});")
    return source
