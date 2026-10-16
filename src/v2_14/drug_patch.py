"""Install native drug-field recovery while retaining every source value."""
from pathlib import Path
import re
import json


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('Drug-field integration anchor changed: ' + repr(old[:100]))
    return source.replace(old, new, 1)


def apply(source):
    module = Path(__file__).with_name('drug_fields.js').read_text()
    contract = json.loads(Path(__file__).with_name('drug_contracts.json').read_text())
    module = module.replace('/*__DRUG_FIELD_CONTRACT__*/', json.dumps(contract['runtime'], ensure_ascii=False, separators=(',', ':')))
    source = once(source, '    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {', module + '\n    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {')
    source = once(source, "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));", "        stage('v214-drug-fields',s=>v214DrugEdits(s,cfg));\n        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));")
    source = once(source, "        v213URLQuotes:'Aspas externas de endereços retiradas',", "        v214DrugATCSupplement:'Parâmetro de código ATC adicional recuperado',\n        v214DrugParameters:'Parâmetros químicos e farmacológicos recuperados',\n        v213URLQuotes:'Aspas externas de endereços retiradas',")
    source = once(source, '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);', '        const drugObjects=v214DrugObjectProof(plan,expected,actual);if(!drugObjects.accepted)return reject(drugObjects.reason);\n        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);')
    source = once(source, "        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};", "        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};\n        const drugCount=v214DrugCount(before,after,topics);if(drugCount)return drugCount;")
    source = once(source, "                    e.key=candidates[0];changed=true;bump('automaticParameterNames');", "                    if(v214DrugCaseRefusal(raw,e.key,candidates[0],cfg))continue;\n                    e.key=candidates[0];changed=true;bump('automaticParameterNames');")
    exports = ','.join(re.findall(r'^    function (v214Drug\w+)\(', module, re.MULTILINE))
    source = once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,', '        '+exports+',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
    return source
