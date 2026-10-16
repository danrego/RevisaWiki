"""Apply only source-bound, render-confirmed redundant birth categories."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Birth category integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('birth_categories.js').read_text()
    source = replace(source, '    function preservationAudit(before,after,options={}) {',
                     '    function v283PreviousPreservationAudit(before,after,options={}) {')
    source = replace(source, '    function safeComposition(before,after,options={}) {',
                     '    function v283PreviousSafeComposition(before,after,options={}) {')
    source = replace(source, '        historicalCitationRepairs: true, citations: true,',
                     '        redundantBirthCategories: true, historicalCitationRepairs: true, citations: true,')
    source = replace(source, '    function v28PrincipalPersonBox(source,cfg={}) {', module + '\n    function v28PrincipalPersonBox(source,cfg={}) {')
    source = replace(source,
                     "const allowCache=!Array.isArray(cfg.doiRepairProofs)||cfg.doiRepairProofs.length===0,cacheOptions=", "const allowCache=(!Array.isArray(cfg.doiRepairProofs)||cfg.doiRepairProofs.length===0)&&!cfg.birthCategoryProof,cacheOptions=")
    source = replace(source, "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));", "        stage('v283-redundant-birth-category',s=>v283BirthCategoryEdits(s,cfg));\n        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));")
    source = replace(source, '        historicalCitationManifest:V282_HISTORICAL_CITATIONS,',
                     '        birthCategoryTTL:V283_BIRTH_CATEGORY_TTL,birthCategoryGetLimit:V283_BIRTH_CATEGORY_GET_LIMIT,v283Dni,v283BirthCategoryCandidate,v283BirthCategoryContext,v283BirthCategoryProof,v283BirthCategoryEdits,v283BirthCategoryPlan,v283BirthCategoryPlanProof,v283BirthCategoryProjection,v283BirthCategoryInventory,v283BirthCategoryRetention,\n        historicalCitationManifest:V282_HISTORICAL_CITATIONS,')
    return source
