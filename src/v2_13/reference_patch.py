"""Install finite reference corrections with regenerated source-bound plans."""
from pathlib import Path
import re


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('2.13 reference integration anchor changed: ' + repr(old[:100]))
    return source.replace(old, new, 1)


def apply(source):
    module = Path(__file__).with_name('reference_fields.js').read_text()
    source = once(source, '    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {', module + '\n    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {')
    source = once(source, "        stage('v210-harvard-anchors',s=>v210HarvardAnchorEdits(s,cfg));", "        stage('v213-reference-closer-slash',s=>v213ReferenceCloserEdits(s,cfg));\n        stage('v213-dangling-reference',s=>v213DanglingReferenceEdits(s,cfg));\n        stage('v210-harvard-anchors',s=>v210HarvardAnchorEdits(s,cfg));")
    source = once(source, "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));", "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));\n        stage('v213-reference-fields',s=>v213ReferenceFieldEdits(s,cfg));\n        stage('v213-native-ref-attributes',s=>v213NativeRefAttributeEdits(s,cfg));")
    source = once(source, "        stage('reference-tag-spacing',edits(v210ReferenceSyntaxEdits));", "        stage('v213-reference-closer-slash',edits(v213ReferenceCloserEdits));\n        stage('v213-dangling-reference',edits(v213DanglingReferenceEdits));\n        stage('reference-tag-spacing',edits(v210ReferenceSyntaxEdits));")
    source = once(source, "        stage('v212-reference-fields',s=>v212ReferenceFieldPlan(s,cfg).text);", "        stage('v212-reference-fields',s=>v212ReferenceFieldPlan(s,cfg).text);\n        stage('v213-reference-fields',s=>v213ReferenceFieldPlan(s,cfg).text);\n        stage('v213-native-ref-attributes',edits(v213NativeRefAttributeEdits));")
    source = once(source, '        raw=v212CitationAliasCall(raw,cfg).text;\n', '        raw=v212CitationAliasCall(raw,cfg).text;\n        raw=v213ReferenceCall(raw,cfg).text;\n')
    source = once(source, 'if(cfg.auxiliaryTemplates)next=auxiliaryParameters(next,noop,noop);return automaticParameters(next,cfg,noop);', 'if(cfg.auxiliaryTemplates)next=auxiliaryParameters(next,noop,noop);return v213ReferenceCall(automaticParameters(next,cfg,noop),cfg).text;')
    source = once(source, '    function v281CitationObligation(raw,cfg) {\n', '    function v281CitationObligation(raw,cfg) {\n        raw=v213ReferenceCall(raw,cfg).text;\n')
    source = once(source, "else if (['url', 'arquivourl', 'capítulourl'].includes(k)) newValue = v.replace(/^https?:\\/\\/(?=https?:\\/\\/)/i, '');", "else if (['url', 'arquivourl', 'capítulourl'].includes(k)) newValue = value; // Protocol repairs require the whole-source finite plan.")
    source = once(source, "        v212CollectorGroups:'Grupo da lista em parâmetro nativo',", "        v213URLQuotes:'Aspas externas de endereços retiradas',\n        v213IdentifierLinks:'Identificadores recuperados de ligações oficiais',\n        v213NativeRefAttributes:'Atributos nativos de referências recuperados',\n        v213DanglingRef:'Fechamento de referência recuperado antes da lista',\n        v213NestedISBN:'ISBN recuperado no campo da citação',\n        v213TypedEquals:'Sinal de igual excedente retirado',\n        v213RefCloserSlash:'Barra extra no fechamento de referência retirada',\n        v213ProtocolChains:'Protocolos repetidos de endereços corrigidos',\n        v212CollectorGroups:'Grupo da lista em parâmetro nativo',")
    exports = ','.join(re.findall(r'^    function (v213\w+)\(', module, re.MULTILINE))
    source = once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,', '        ' + exports + ',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
    source = once(source, "(step.name.startsWith('v28-')||step.name.startsWith('v210-'))&&Array.isArray(edit.proof?.changeRules)", "(step.name.startsWith('v28-')||step.name.startsWith('v210-')||step.name.startsWith('v213-'))&&Array.isArray(edit.proof?.changeRules)")
    source = once(source, '        // Reordering the two literal reference identity fields is one opener\n', '''        // A native identity typo has one source-bound attribute correction,
        // even when character alignment splits the attribute name itself.
        for(const edit of v213ReferenceAttributeCountEdits(before)){
            const tag=v24SyntaxTag(before,edit.proof.openingStart),start=v211CountAnchor(tag.start,edits),end=v211CountAnchor(tag.end,edits,false,true),target=v24SyntaxTag(after,start);
            if(!target||target.end!==end||target.name!=='ref'||target.close||target.self!==tag.self)continue;
            const local={start:edit.start-tag.start,end:edit.end-tag.start,text:edit.text},fixed=v24SyntaxApply(tag.raw,[local]),probe=normalizeRefs(fixed+'x</ref>',{...DEFAULTS,moveNamedRefs:false},()=>{},()=>{}),expected=probe.slice(0,probe.indexOf('>')+1);
            if(target.raw!==fixed&&target.raw!==expected)continue;
            const ids=[...new Set([...indices('old',tag.start,tag.end),...indices('new',start,end)])];if(!ids.length||ids.some(i=>claimed.has(i)||!contained(edits[i],'old',tag.start,tag.end)||!contained(edits[i],'new',start,end)))continue;
            emit('reference-attribute','Atributo nativo de referência recuperado',ids,[{start:tag.start,end:tag.end}],[{start,end}]);
        }
        // Reordering the two literal reference identity fields is one opener
''')
    source = once(source, '        // A remoção adjacente de dois atributos continua sendo duas operações.\n', '''        // Each new field correction is counted only when the entire native
        // call equals the freshly regenerated finite source plan.
        for(const n of old.whole.filter(n=>n.kind==='template')){
            const start=v211CountAnchor(n.start,edits),end=v211CountAnchor(n.end,edits,false,true),target=fresh.whole.find(q=>q.kind==='template'&&q.start===start&&q.end===end);
            if(!target)continue;const raw=before.slice(n.start,n.end),plan=v213ReferenceCountCall(raw,{...DEFAULTS,namespaceNumber:0});
            if(!plan.changes.length||plan.text!==after.slice(target.start,target.end))continue;
            const ids=[...new Set([...indices('old',n.start,n.end),...indices('new',target.start,target.end)])];if(!ids.length||ids.some(i=>claimed.has(i)))continue;
            ids.forEach(i=>claimed.add(i));
            for(const change of plan.changes)component(change.kind,GROUP_LABELS[change.ruleId]||'Campo de citação corrigido',n.start,n.end,target.start,target.end);
        }
        // A remoção adjacente de dois atributos continua sendo duas operações.
''')
    return source
