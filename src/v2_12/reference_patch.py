"""Install finite native reference-field repairs and source-bound proofs."""
from pathlib import Path
import json


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('2.12 reference integration anchor changed: ' + repr(old[:110]))
    return source.replace(old, new, 1)


def apply(source):
    contracts = json.loads(Path(__file__).with_name('REFERENCE_FIELD_CONTRACTS.json').read_text())
    module = Path(__file__).with_name('reference_fields.js').read_text()
    module = module.replace('__V212_CITATION_ALIASES__', json.dumps(contracts['citationAliasFamilies'], ensure_ascii=False, separators=(',', ':')))
    module = module.replace('__V212_URL_ROLES__', json.dumps(contracts['urlRoles'], ensure_ascii=False, separators=(',', ':')))
    source = once(source, '    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {', module + '\n    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {')
    source = once(source, "        stage('v210-reference-conflicts',s=>v210ReferenceConflictEdits(s,cfg));", "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));\n        stage('v210-reference-conflicts',s=>v210ReferenceConflictEdits(s,cfg));")
    source = once(source, "        stage('reference-conflicts',edits(v210ReferenceConflictEdits));", "        stage('v212-reference-fields',s=>v212ReferenceFieldPlan(s,cfg).text);\n        stage('reference-conflicts',edits(v210ReferenceConflictEdits));")
    source = once(source, '    function v24InventoryTemplate(raw,cfg={}) {\n        raw=v2111CitationFieldCall(raw,cfg).text;', '    function v24InventoryTemplate(raw,cfg={}) {\n        raw=v212CollectorGroupCall(raw,cfg).text;\n        raw=v212CitationAliasCall(raw,cfg).text;\n        raw=v2111CitationFieldCall(raw,cfg).text;')
    source = once(source, "        v2111BlogPublication:'Publicação preservada em parâmetro aceito',", "        v212CollectorGroups:'Grupo da lista em parâmetro nativo',\n        v212CitationAliases:'Campos equivalentes repetidos retirados',\n        v212BracketedURLs:'Colchetes externos do endereço retirados',\n        v212CollectorAttributes:'Atributos idênticos da lista retirados',\n        v2111BlogPublication:'Publicação preservada em parâmetro aceito',")
    source = once(source, '        v2111CitationFieldScope,v2111CitationLiteralFields,v2111CitationFieldCall,v2111CitationFieldEdits,v2111CitationFieldPlan,v2111CitationFieldProof,', '        v212ReferenceFieldScope,v212LiteralCitationFields,v212CollectorGroupCall,v212CitationAliasCall,v212ReferenceFieldEdits,v212ReferenceFieldPlan,v212ReferenceFieldProof,v212NativeRendererGroup,\n        v2111CitationFieldScope,v2111CitationLiteralFields,v2111CitationFieldCall,v2111CitationFieldEdits,v2111CitationFieldPlan,v2111CitationFieldProof,')
    # The native template accepts grupo, whereas the Cite tag accepts group.
    # An unsupported foreign field must not masquerade as a rendered group.
    source = once(source, "        const entries=foreignEntries(p),groups=entries.filter(entry=>['grupo','group'].includes(norm(entry.key)));\n        if(groups.length>1||groups.some(entry=>!v29ReferenceName(entry.value.trim())))return null;\n        const nativeStyle=['referências','referencias'].includes(p.name);", "        const entries=foreignEntries(p),nativeStyle=['referências','referencias'].includes(p.name);\n        if(nativeStyle&&entries.some(entry=>norm(entry.key)==='group'))return null;\n        const groups=entries.filter(entry=>(nativeStyle?['grupo']:['grupo','group']).includes(norm(entry.key)));\n        if(groups.length>1||groups.some(entry=>!v29ReferenceName(entry.value.trim())))return null;")
    source = once(source, "                const {p, map} = fields(raw), group = map.grupo || map.group || '';", "                const {p, map} = fields(raw), group = v212NativeRendererGroup(p);")
    source = once(source, "                else { const {map} = fields(raw); inheritedGroup = map.grupo || map.group || ''; }", "                else { const {p} = fields(raw); inheritedGroup = v212NativeRendererGroup(p); }")
    source = once(source, '        // Inclusões e remoções de campos contíguos não se tornam uma única\n', '''        // A remoção adjacente de dois atributos continua sendo duas operações.
        // Só a abertura nativa literalmente deduplicada recebe essa contagem.
        for(const hit of before.matchAll(/<references\\b[^<>]*>/gi)){
            const at=hit.index;if(old.view.slice(at,at+hit[0].length)!==hit[0])continue;
            const tag=v24SyntaxTag(before,at),attrs=tag&&v25SafeAttributes(tag.attrs,new Set(['group','responsive']));
            if(!tag||tag.close||!attrs?.duplicates.length||attrs.values.has('responsive')&&!['0','1'].includes(attrs.values.get('responsive')))continue;
            const base=tag.raw.indexOf(tag.attrs),local=attrs.duplicates.map(e=>({start:base+e.start,end:base+e.end,text:''})),expected=v24SyntaxApply(tag.raw,local),start=v211CountAnchor(tag.start,edits),end=v211CountAnchor(tag.end,edits,false,true);
            if(after.slice(start,end)!==expected)continue;const ids=[...new Set([...indices('old',tag.start,tag.end),...indices('new',start,end)])];if(!ids.length||ids.some(i=>claimed.has(i)))continue;
            ids.forEach(i=>claimed.add(i));let delta=0;for(const item of local){const a=tag.start+item.start,b=tag.start+item.end,c=start+item.start+delta;component('html-attribute','Retirada de atributo idêntico',a,b,c,c);delta-=item.end-item.start;}
        }
        // O diff pode prender a barra separadora ao campo seguinte. A chamada
        // completa precisa coincidir com o plano nativo antes de contar cada
        // campo retirado ou cada par de colchetes como uma ocorrência.
        for(const n of old.whole.filter(n=>n.kind==='template')){
            const start=v211CountAnchor(n.start,edits),end=v211CountAnchor(n.end,edits,false,true),target=fresh.whole.find(q=>q.kind==='template'&&q.start===start&&q.end===end);
            if(!target)continue;const raw=before.slice(n.start,n.end),plan=v212CitationAliasCall(raw,{...DEFAULTS,namespaceNumber:0});
            if(!plan.changes.length||plan.text!==after.slice(target.start,target.end))continue;
            const ids=[...new Set([...indices('old',n.start,n.end),...indices('new',target.start,target.end)])];if(!ids.length||ids.some(i=>claimed.has(i)))continue;
            ids.forEach(i=>claimed.add(i));let delta=0;
            for(const change of plan.changes){const a=n.start+change.start,b=n.start+change.end,c=target.start+change.start+delta,d=c+change.text.length;
                component(change.ruleId==='v212CitationAliases'?'parameter-field':'parameter-value',change.ruleId==='v212CitationAliases'?'Retirada de campo equivalente':'Endereço sem colchetes externos',a,b,c,d);delta+=change.text.length-(change.end-change.start);}
        }
        // Inclusões e remoções de campos contíguos não se tornam uma única
''')
    return source
