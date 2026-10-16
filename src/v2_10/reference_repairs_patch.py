"""Insert the 2.10 reference helpers and their public test API."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Reference helper anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('reference_repairs.js').read_text()
    source = replace(source, '    function v28PrincipalPersonBox(source,cfg={}) {',
                     module + '\n    function v28PrincipalPersonBox(source,cfg={}) {')
    source = replace(source, '    Object.assign(GROUP_LABELS,{v29MixedReferences:',
                     "    Object.assign(GROUP_LABELS,{v210ReferenceTagSpacing:'Espaço ausente na etiqueta de referência corrigido',\n"
                     "        v210ReferenceBanks:'Definições idênticas em listas de referências reutilizadas',\n"
                     "        v210ReferenceConflicts:'Nomes conflitantes de fontes completas separados',\n"
                     "        v210HarvardAnchors:'Destino local de citação abreviada restaurado',\n"
                     '        v29MixedReferences:')
    source = replace(source, '        birthCategoryTTL:V283_BIRTH_CATEGORY_TTL,',
                     '        v210ReferenceScope,v210ReferenceSyntaxEdits,v210ReferenceRenderer,v210ReferenceGraph,v210ReferenceBodyKey,v210ReferenceBankEdits,v210ReferenceConflictEdits,v210HarvardAnchorCandidates,v210HarvardAnchorNativeProof,v210HarvardAnchorEdits,v210ReferenceRepairPlan,v210ReferenceRepairProjection,v210ReferenceRepairProof,\n'
                     '        birthCategoryTTL:V283_BIRTH_CATEGORY_TTL,')
    return source
