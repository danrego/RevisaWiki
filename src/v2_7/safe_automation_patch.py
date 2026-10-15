"""Apply the finite 2.7 safe-automation rules to the frozen 2.6.2 runtime."""
from pathlib import Path


def replace_once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Safe-automation integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('safe_automation.js').read_text()
    source = replace_once(source, '    function v25SafeRepairPlan(source,cfg={}) {', module + '\n    function v25SafeRepairPlan(source,cfg={}) {')
    source = replace_once(source,
        '        return v25SafeRemember(plan,cacheOptions,allowCache);',
        "        for(const kind of ['infobox','defaultsort','portal'])stage('v27-'+kind,s=>v27SafeAutomationEdits(s,cfg,kind));\n        return v25SafeRemember(plan,cacheOptions,allowCache);")
    source = replace_once(source,
        "stage('consecutive-named-reference-calls',v25SafeAdjacentReferenceEdits);",
        "stage('v27-references',s=>v27SafeAutomationEdits(s,cfg,'references'));stage('consecutive-named-reference-calls',v25SafeAdjacentReferenceEdits);")
    source = replace_once(source,
        '        return shield.restore(automaticIdenticalReferences(text,c,noop));',
        "        text=shield.restore(automaticIdenticalReferences(text,c,noop));\n        return v24SyntaxApply(text,v27SafeAutomationEdits(text,c,'references'));")
    source = replace_once(source,
        "        const wantedTemplates=new Map(),wantedTableIndexes=new Set();let touchedHTMLTable=false;",
        "        const v27Objects=v27SafeObjectProof(plan,expected,actual);if(!v27Objects.accepted)return reject(v27Objects.reason);\n        const wantedTemplates=new Map(),wantedTableIndexes=new Set();let touchedHTMLTable=false;")
    source = replace_once(source,
        '        v25SafeRepairPlan,automaticSafeRepairs,v25SafeRepairEquivalence,',
        '        v27SafeAutomationEdits,v27SafeAutomationPlan,v27SafeAutomationProof,v27SafeReferenceBody,v27SafeObjectProof,\n        v25SafeRepairPlan,automaticSafeRepairs,v25SafeRepairEquivalence,')
    return source
