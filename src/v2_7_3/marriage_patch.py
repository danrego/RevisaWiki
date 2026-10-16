"""Integrate source-bound conversion of explicit spouse dates in person infoboxes."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Marriage integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('marriage.js').read_text()
    source = replace(source, '    function v25SafeRepairPlan(source,cfg={}) {', module + '\n    function v25SafeRepairPlan(source,cfg={}) {')
    source = replace(source,
        "        for(const kind of ['infobox','defaultsort','portal'])stage('v27-'+kind,s=>v27SafeAutomationEdits(s,cfg,kind));",
        "        for(const kind of ['infobox','defaultsort','portal'])stage('v27-'+kind,s=>v27SafeAutomationEdits(s,cfg,kind));\n        stage('v273-explicit-marriage',s=>v273MarriageEdits(s,cfg));")
    source = replace(source,
        '        const tableObjects=v272TableObjectProof(plan,expected,actual);',
        '        const marriageObjects=v273MarriageObjectProof(plan,expected,actual);if(!marriageObjects.accepted)return reject(marriageObjects.reason);\n        const tableObjects=v272TableObjectProof(plan,expected,actual);')
    source = replace(source,
        '        v272MarkupQuotationEnd,v272LiteralTables,',
        '        marriageProfiles:V273_MARRIAGE_PROFILES,v273MarriageDate,v273MarriageName,v273MarriageValue,v273MarriageFields,v273MarriageEdits,v273MarriagePlan,v273MarriageProof,v273MarriageInventory,v273MarriageObjectProof,\n        v272MarkupQuotationEnd,v272LiteralTables,')
    return source
