"""Integrate source-bound biography field repairs into the existing safe plan."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Biography integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    base = Path(__file__).parent
    modules = '\n'.join((base / filename).read_text() for filename in
                        ['biography_dates.js', 'biography_fields.js', 'multiple_marriages.js', 'preservation.js'])
    source = replace(source, '    function v25SafeRepairPlan(source,cfg={}) {',
                     modules + '\n    function v25SafeRepairPlan(source,cfg={}) {')
    source = replace(source,
        "        stage('v273-explicit-marriage',s=>v273MarriageEdits(s,cfg));",
        "        stage('v273-explicit-marriage',s=>v273MarriageEdits(s,cfg));\n"
        "        stage('v28-biography-fields',s=>v28BiographyFieldEdits(s,cfg));\n"
        "        stage('v28-biography-dates',s=>v28BiographyDateEdits(s,cfg));\n"
        "        stage('v28-multiple-marriages',s=>v28MultipleMarriageEdits(s,cfg));")
    source = replace(source,
        '        const plan=v25SafeRepairPlan(source,cfg);for(const step of plan.steps)for(const edit of step.edits)bump(edit.ruleId);return plan.text;',
        '        const plan=v25SafeRepairPlan(source,cfg);for(const step of plan.steps)for(const edit of step.edits){const rules=step.name.startsWith(\'v28-\')&&Array.isArray(edit.proof?.changeRules)?edit.proof.changeRules:[edit.ruleId];for(const rule of rules)bump(rule);}return plan.text;')
    source = replace(source,
        '        const marriageObjects=v273MarriageObjectProof(plan,expected,actual);',
        '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);if(!biographyObjects.accepted)return reject(biographyObjects.reason);\n'
        '        const marriageObjects=v273MarriageObjectProof(plan,expected,actual);')
    source = replace(source,
        '        marriageProfiles:V273_MARRIAGE_PROFILES,',
        '        v28BiographyFieldPlan,v28BiographyFieldProof,v28BiographyFieldEdits,\n'
        '        v28BiographyFieldContract,v28BiographyImageValue,v28BiographyWebsiteValue,v28BiographyOccupationValue,\n'
        '        v28PrincipalPersonBox,v28LiteralInfoboxFields,\n'
        '        biographyDateFields:V28_DATE_FIELDS,v28DateValueParts,v28DateNumbers,v28DateTemplate,v28BiographyDateBoxPlan,\n'
        '        v28BiographyDatePlan,v28BiographyDateProof,v28BiographyDateEdits,\n'
        '        v28MultipleMarriagePlan,v28MultipleMarriageProof,v28MultipleMarriageEdits,\n'
        '        v28BiographyObjectProof,\n'
        '        marriageProfiles:V273_MARRIAGE_PROFILES,')
    return source
