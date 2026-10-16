"""Insert the finite 2.9 table helpers. Shared pipeline hooks belong to the release builder."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Table repair integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('table_repairs.js').read_text()
    source = replace(source, '    function v25SafeRepairPlan(source,cfg={}) {',
                     module + '\n    function v25SafeRepairPlan(source,cfg={}) {')
    source = replace(source, '        v272MarkupQuotationEnd,v272LiteralTables,',
                     '        v29TableEnabled,v29TableAttributes,v29TableStaticBounds,v29TableModel,v29TableModelInventory,v29TableDuplicateAttributeEdits,v29TableSyntaxEdits,v29TableSyntaxPlan,v29TableSyntaxProof,v29TableSyntaxProjection,v29TableLeafScopeEdits,v29TableRepairPlan,v29TableRepairProof,v29TableProjection,v29TableInventory,v29TableObjectProof,\n        v272MarkupQuotationEnd,v272LiteralTables,')
    return source
