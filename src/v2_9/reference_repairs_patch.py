"""Install only the 2.9 pure reference rules, labels and public test API."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Reference repair integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('reference_repairs.js').read_text()
    source = replace(source, '    function v28PrincipalPersonBox(source,cfg={}) {',
                     module + '\n    function v28PrincipalPersonBox(source,cfg={}) {')
    source = replace(source, "    Object.assign(GROUP_LABELS,{redundantBirthCategory:'Categoria de nascimento já gerada pela data retirada'});",
                     "    Object.assign(GROUP_LABELS,{v29MixedReferences:'Referências idênticas reutilizadas com um nome existente',\n"
                     "        v29AnchorReferences:'Chamadas repetidas no mesmo ponto retiradas',\n"
                     "        v29EmptyReferences:'Etiquetas de referência vazias retiradas',\n"
                     "        v29ReferenceClosers:'Fechamento repetido de referência corrigido',\n"
                     "        redundantBirthCategory:'Categoria de nascimento já gerada pela data retirada'});")
    source = replace(source, '        birthCategoryTTL:V283_BIRTH_CATEGORY_TTL,',
                     '        v29ReferenceScope,v29ReferenceName,v29ReferenceBody,v29ReferenceSyntaxEdits,v29ReferenceSyntaxPlan,v29ReferenceRepairEdits,v29ReferenceRepairPlan,v29ReferenceRepairProjection,v29ReferenceRepairProof,v29ReferenceRepairInventory,v29ReferenceRepairRetention,\n'
                     '        birthCategoryTTL:V283_BIRTH_CATEGORY_TTL,')
    return source
