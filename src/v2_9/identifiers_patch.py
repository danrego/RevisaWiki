"""Install the literal identifier URL helper without renaming native aliases."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Identifier integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('identifiers.js').read_text()
    source = replace(source, '    function citation(raw, cfg, bump, warn) {',
                     module + '\n    function citation(raw, cfg, bump, warn) {')
    source = replace(source, '    function v24InventoryTemplate(raw,cfg={}) {',
                     '    function v24InventoryTemplate(raw,cfg={}) {\n        raw=v29IdentifierCitation(raw,cfg);')
    source = replace(source, '        birthCategoryTTL:V283_BIRTH_CATEGORY_TTL,',
                     '        v29IdentifierValue,v29IdentifierEnabled,v29IdentifierCitation,v29IdentifierPlan,v29IdentifierProjection,v29IdentifierPlanProof,\n        birthCategoryTTL:V283_BIRTH_CATEGORY_TTL,')
    return source
