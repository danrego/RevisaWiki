"""Integrate finite template-definition repairs, proofs and retained counts."""
from pathlib import Path
import json
import re


def once(source, old, new):
    assert source.count(old) == 1, 'Template-definition integration anchor changed: ' + old[:90]
    return source.replace(old, new, 1)


def apply(source):
    helpers = Path(__file__).with_name('template_definition.js').read_text()
    contract = json.loads(Path(__file__).with_name('template_contracts.json').read_text())
    helpers = helpers.replace('/*__TEMPLATE_DEFINITION_CONTRACT__*/', json.dumps(contract['runtime'], ensure_ascii=False, separators=(',', ':')))
    source = once(source, '    function auxiliaryParameters(raw, bump, warn) {', helpers + '\n    function auxiliaryParameters(raw, bump, warn) {')
    source = once(source, '        syntaxRepairs: true, partialSyntaxRecovery: true,',
                  '        templateDefinitionRepairs: true, templateReadableFormatting: true,\n        syntaxRepairs: true, partialSyntaxRecovery: true,')
    source = once(source, "'minorBaseConfirmed','livingCategoryConfirmed','discussionPage'",
                  "'templateDefinitionInputEnabled','minorBaseConfirmed','livingCategoryConfirmed','discussionPage'")
    source = once(source, "            'spellingAllowedWords','spellingIgnoredRules'];",
                  "            'spellingAllowedWords','spellingIgnoredRules','templateDefinitionInputEnabled'];")
    source = once(source, '        if(!v24SyntaxScope(cfg))return {...plan,disabled:true};',
                  '        if(v215TemplateDataScope(cfg))return v215TemplateSafePlan(source,cfg);\n        if(!v24SyntaxScope(cfg))return {...plan,disabled:true};')
    source = once(source, "step.name.startsWith('v213-'))&&Array.isArray(edit.proof?.changeRules)",
                  "step.name.startsWith('v213-')||step.name.startsWith('v215-'))&&Array.isArray(edit.proof?.changeRules)")
    labels = {
        'v215TemplateDefinitions': 'Código da predefinição corrigido',
        'v215FunctionTokens': 'Espaços indevidos no nome de funções retirados',
        'v215DocumentationIsolation': 'Documentação isolada da transclusão',
        'v215DocumentationClosers': 'Fechamento extra de documentação retirado',
        'v215DocumentationDuplicates': 'Blocos idênticos de documentação consolidados',
        'v215DefinitionParameters': 'Grafias inválidas de parâmetros nativos corrigidas',
        'v215DefinitionDuplicates': 'Parâmetros nativos idênticos consolidados',
        'v215DefinitionForwarding': 'Encaminhamento de coordenadas corrigido',
        'v215TemplateDataJSON': 'Vírgulas finais indevidas do TemplateData retiradas',
        'v215TemplateDataOrder': 'Ordem declarada de parâmetros do TemplateData corrigida',
        'v215TemplateReadableFields': 'Campos literais da predefinição separados em linhas'
    }
    source = once(source, '        auxiliaryParameters:', ''.join('        ' + key + ':' + json.dumps(value, ensure_ascii=False) + ',\n' for key, value in labels.items()) + '        auxiliaryParameters:')
    source = once(source, '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);',
                  '        const templateObjects=v215TemplateObjectProof(plan,expected,actual);if(!templateObjects.accepted)return reject(templateObjects.reason);\n' +
                  '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);')
    source = once(source, "        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};",
                  "        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};\n" +
                  '        const templateCount=v215TemplateCount(before,after,topics);if(templateCount)return templateCount;')
    exports = ','.join(re.findall(r'^    function (v215\w+)\(', helpers, re.MULTILINE))
    source = once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,', '        ' + exports + ',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
    return source
