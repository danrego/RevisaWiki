"""Apply the finite chemical literal-brace and InChI wrapping repairs to the pinned 2.7 runtime."""
from pathlib import Path


def _replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Chemical-syntax integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('chemical_syntax.js').read_text()
    source = _replace(source, '    function v25SafeRepairPlan(source,cfg={}) {', module + '\n    function v25SafeRepairPlan(source,cfg={}) {')
    source = _replace(source,
        "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));",
        "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));\n        stage('v271-chemical-literal-braces',s=>v271ChemicalBraceEdits(s,cfg));\n        stage('v271-chemical-inchi-wrapping',s=>v271ChemicalInchiEdits(s,cfg));")
    source = _replace(source,
        '        const v27Objects=v27SafeObjectProof(plan,expected,actual);',
        '        const chemicalObjects=v271ChemicalInventoryProof(plan,expected,actual);if(!chemicalObjects.accepted)return reject(chemicalObjects.reason);\n        const v27Objects=v27SafeObjectProof(plan,expected,actual);')
    source = _replace(source,
        '        v27SafeAutomationEdits,v27SafeAutomationPlan,v27SafeAutomationProof,',
        '        v271ChemicalBoxes,v271ChemicalFields,v271ChemicalInchiEdits,v271ChemicalBraceOffsets,v271ChemicalBraceEdits,v271ChemicalSyntaxPlan,v271ChemicalSyntaxProof,v271ChemicalInventoryProof,\n        v27SafeAutomationEdits,v27SafeAutomationPlan,v27SafeAutomationProof,')
    source = _replace(source,
        '                infoboxes: signature(n => !!INFOBOX_CATALOG[n]),',
        "                infoboxes: signature(n => !!INFOBOX_CATALOG[n] || n === 'infocaixa'),")
    return source
