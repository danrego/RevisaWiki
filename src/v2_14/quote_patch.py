"""Add finite native quote-alignment repairs without changing quoted text."""
from pathlib import Path
import re


def once(source, old, new):
    assert source.count(old) == 1, 'Quote-alignment integration anchor changed.'
    return source.replace(old, new, 1)


def apply(source):
    helpers = Path(__file__).with_name('quote_alignment.js').read_text()
    source = once(source, '    function auxiliaryParameters(raw, bump, warn) {',
                  helpers + '\n    function auxiliaryParameters(raw, bump, warn) {')
    source = once(source, "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));",
                  "        stage('v214-quote-alignments',s=>v214QuoteAlignmentEdits(s,cfg));\n" +
                  "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));")
    source = once(source, "        stage('v212-reference-fields',s=>v212ReferenceFieldPlan(s,cfg).text);",
                  "        stage('v214-quote-alignments',s=>v214QuoteAlignmentPlan(s,cfg).text);\n" +
                  "        stage('v212-reference-fields',s=>v212ReferenceFieldPlan(s,cfg).text);")
    source = once(source, "        auxiliaryParameters: 'Parâmetros de predefinições auxiliares',",
                  "        v214QuoteAlignment:'Alinhamento de caixas de citação corrigido',\n" +
                  "        auxiliaryParameters: 'Parâmetros de predefinições auxiliares',")
    source = once(source, '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);',
                  '        const quoteObjects=v214QuoteObjectProof(plan,expected,actual);if(!quoteObjects.accepted)return reject(quoteObjects.reason);\n' +
                  '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);')
    source = once(source, "        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};",
                  "        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};\n" +
                  "        const quoteCount=v214QuoteAlignmentCount(before,after,topics);if(quoteCount)return quoteCount;")
    exports = ','.join(re.findall(r'^    function (v214\w+)\(', helpers, re.MULTILINE))
    assert exports, 'The public helper names must be exported.'
    source = once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,',
                  '        ' + exports + ',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
    return source
