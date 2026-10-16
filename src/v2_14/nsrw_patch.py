"""Install a source-bound native citation expansion, without category deletion."""
from pathlib import Path


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('2.14.0 native citation anchor changed: ' + repr(old[:100]))
    return source.replace(old, new, 1)


def apply(source):
    module = Path(__file__).with_name('nsrw_citation.js').read_text()
    source = once(source, '    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {', module + '\n    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {')
    source = once(source, "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));", "        stage('v214-nsrw-native-citation',s=>v214NSRWEdits(s,cfg));\n        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));")
    source = once(source, "        v213URLQuotes:'Aspas externas de endereços retiradas',", "        v214NSRWCitation:'Citação de enciclopédia adaptada sem categorias estrangeiras',\n        v213URLQuotes:'Aspas externas de endereços retiradas',")
    source = once(source, '        v213ReferenceScope,v213LiteralURL,', '        v214NSRWCall,v214NSRWEdits,v214NSRWPlan,v214NSRWProof,v214NSRWInventory,v214NSRWRetention,v214NSRWCount,\n        v213ReferenceScope,v213LiteralURL,')
    source = once(source, '        // A transposition in one proved literal attribute name is one\n', '''        // The complete source-bound wrapper expansion is one citation
        // migration. Its default fields are not separately inferred content.
        for(const n of old.whole.filter(n=>n.kind==='template')){
            const call=v214NSRWCall(before.slice(n.start,n.end),{...DEFAULTS,namespaceNumber:0});if(!call.accepted)continue;
            const start=v211CountAnchor(n.start,edits),end=v211CountAnchor(n.end,edits,false,true);if(after.slice(start,end)!==call.text)continue;
            const ids=[...new Set([...indices('old',n.start,n.end),...indices('new',start,end)])];if(!ids.length||ids.some(i=>claimed.has(i)))continue;
            emit('citation-structure','Citação de enciclopédia adaptada',ids,[{start:n.start,end:n.end}],[{start,end}]);
        }
        // A transposition in one proved literal attribute name is one
''')
    source = once(source, "        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};", "        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};\n        const nsrwCount=v214NSRWCount(before,after,topics);if(nsrwCount)return nsrwCount;")
    source = once(source, '    function preservationAudit(before,after,options={}) {\n        const findings=v283PreviousPreservationAudit(before,after,options),proof=v283BirthCategoryRetention(before,after,options);', '    function preservationAudit(before,after,options={}) {\n        const nativeCitation=v214NSRWRetention(before,after,options);\n        const findings=v283PreviousPreservationAudit(before,after,options),proof=v283BirthCategoryRetention(before,after,options);\n        if(!nativeCitation.accepted)findings.push({code:"lost-native-encyclopedia-citation",message:nativeCitation.reason,start:-1,severity:"warning"});')
    source = once(source, '    function safeComposition(before,after,options={}) {\n        const proof=v283BirthCategoryRetention(before,after,options);', '    function safeComposition(before,after,options={}) {\n        const nativeCitation=v214NSRWRetention(before,after,options);if(!nativeCitation.accepted)return nativeCitation.reason;\n        const proof=v283BirthCategoryRetention(before,after,options);')
    return source
