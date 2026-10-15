"""Apply the bounded numeric table-attribute and quotation-reader fixes."""
from pathlib import Path


def replace(source,before,after):
    if source.count(before)!=1:
        raise ValueError('Table-syntax integration anchor is absent or repeated')
    return source.replace(before,after,1)


def apply(source):
    module=Path(__file__).with_name('table_syntax.js').read_text()
    source=replace(source,'    function v25SafeRepairPlan(source,cfg={}) {',module+'\n    function v25SafeRepairPlan(source,cfg={}) {')
    source=replace(source,
        'if(m){const range={start:i,end:m.end,kind:\'quotation-markup\'};ranges.push(range);quotationScopes.protected.push(range);i=m.end;continue;}',
        'if(m){const end=v272MarkupQuotationEnd(view,i,m.end),range={start:i,end,kind:\'quotation-markup\'};ranges.push(range);quotationScopes.protected.push(range);i=end;continue;}')
    source=replace(source,
        "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));",
        "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));\n        stage('v272-numeric-cell-quotes',s=>v272TableCellEdits(s,cfg));")
    source=replace(source,
        '        const chemicalObjects=v271ChemicalInventoryProof(plan,expected,actual);',
        '        const tableObjects=v272TableObjectProof(plan,expected,actual);if(!tableObjects.accepted)return reject(tableObjects.reason);\n        const chemicalObjects=v271ChemicalInventoryProof(plan,expected,actual);')
    source=replace(source,
        '        v271ChemicalBoxes,v271ChemicalFields,',
        '        v272MarkupQuotationEnd,v272LiteralTables,v272TableCellEdits,v272TableSyntaxPlan,v272TableSyntaxProof,v272TableInventories,v272TableObjectProof,\n        v271ChemicalBoxes,v271ChemicalFields,')
    return source
