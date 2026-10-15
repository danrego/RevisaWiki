from pathlib import Path
import difflib,hashlib,json,re,subprocess,sys,os,shutil
R=Path(__file__).resolve().parents[1];W=R/'build';O=R/'dist/2.4.0'
expected=json.loads((R/'tests/expected_release.json').read_text())
assert expected['version']=='2.4.0'
B=R/'dist/2.3.0'
NODE=os.environ.get('REVISAWIKI_NODE') or shutil.which('node') or 'node'
original=(B/'RevisaWiki_v2_3_completo.js').read_text()
assert hashlib.sha256(original.encode()).hexdigest()=='b6edace347c04d978b0beb3bd89f03f8a9dccc3f243b90ea4fbb2134497238a9'
s=original.replace('2.3.0','2.4.0')
def replace(before,after):
 global s
 assert s.count(before)==1,(s.count(before),before[:120])
 s=s.replace(before,after)
replace('        structuralRepairs: true, translationResidues: true,','        syntaxRepairs: true, partialSyntaxRecovery: true, structuralRepairs: true, translationResidues: true,')
replace('    const GROUP_LABELS = {', '''    const GROUP_LABELS = {
        syntaxTemplateClosers:'Fechamentos de predefinições recuperados', syntaxTagTypos:'Fechamentos de etiquetas corrigidos',
        syntaxReferenceClosers:'Referências sem fechamento recuperadas', syntaxNamedRefReuse:'Chamadas nominais de referências recuperadas',
        syntaxFormattingClosers:'Formatação interna de referências fechada', syntaxTableClosers:'Tabelas simples fechadas no fim da página',
        preservedUnresolvedTail:'Trecho completo ajustado com cauda incompleta preservada',''')
replace('    function normalizeLists(s, bump, warn) {',(R/'src/syntax_repairs.js').read_text()+'\n'+(R/'src/sourceproof_inventory.js').read_text()+'\n'+(R/'src/integration_rules.js').read_text()+'\n    function normalizeLists(s, bump, warn) {')
replace('        const residues=removeKnownTranslationResidues(source,cfg,bump,warn);', '''        const syntactic=automaticSyntaxRepairs(source,cfg,bump,warn);
        const recovery=syntaxRepairPrefix(syntactic,cfg);
        if(cfg.partialSyntaxRecovery!==false&&recovery.unresolved.length&&recovery.end>0&&recovery.end<syntactic.length){
            yield 'Conferindo o trecho completo anterior ao código sem fechamento...';
            const prefix=syntactic.slice(0,recovery.end),tail=syntactic.slice(recovery.end);
            const guarded=maskProtected(prefix,()=>{},refTokens(protectedView(prefix)).filter(r=>{
                const a=attrsOf(r.attrs);return a&&(a.name||a.follow);
            }));
            const local=yield* cleanupStages(guarded.text,syntaxPrefixOptions(cfg));
            local.text=guarded.restore(local.text);
            const ending=prefix.match(/(?:\\r?\\n)[ \\t\\r\\n]*$/)?.[0]||'';
            const prefixText=ending?local.text.replace(/[ \\t\\r\\n]*$/,'')+ending:local.text;
            for(const c of local.changes||[])counts.set(c.id,(counts.get(c.id)||0)+c.count);
            if(prefixText!==prefix)bump('preservedUnresolvedTail');
            const text=prefixText+tail;
            for(const message of local.warnings||[])warn(message);
            warn('O código incompleto e tudo o que vem depois dele foram preservados. Os ajustes ficaram no trecho completo anterior.');
            return {text,changes:[...counts].map(([id,count])=>({id,label:GROUP_LABELS[id]||id,count})),
                warnings:[...warnings],removedDescriptions:[],suggestions:[],audit:referenceAudit(text,cfg),
                syntaxIsolation:{start:recovery.end,tailUnchanged:tail===syntactic.slice(recovery.end)},
                trace:cfg.captureTrace&&text!==source?[{label:'Reparos de sintaxe e ajustes locais com cauda preservada',before:source,after:text}]:[]};
        }
        const residues=removeKnownTranslationResidues(syntactic,cfg,bump,warn);''')
replace("        checkpoint('Notas, resíduos de tradução e estrutura do artigo inteiro');","        checkpoint('Sintaxe, notas, resíduos de tradução e estrutura do artigo inteiro');")
newTypos=json.loads((R/'src/parameter_typos_v2_4.json').read_text())
for key in newTypos:
 assert re.search(r'\b'+re.escape(key)+r'\s*:',s) is None,'Existing alias should not be added twice: '+key
replace('    const V20_PARAMETER_TYPOS = Object.freeze(ownDictionary({','    const V20_PARAMETER_TYPOS = Object.freeze(ownDictionary({\n        '+', '.join(json.dumps(k)+':'+json.dumps(v)for k,v in newTypos.items())+',')
replace('entries.some(x=>x!==e&&parameterFamily(x.key)===parameterFamily(target)))continue;',
        'entries.some(x=>x!==e&&parameterFamily(mappedParam(V20_PARAMETER_TYPOS[norm(x.key)]||x.key,p.name))===parameterFamily(mappedParam(target,p.name))))continue;')
replace('    function preservationAudit(before, after) {','    function preservationAudit(before, after, options={}) {')
replace("        const knownSyntax=text=>repairCenturySyntax(residueEquivalenceSource(text),{markup:true,namespaceNumber:0});",'''        const repairProof=syntaxRepairSourceProof(before,after,options);
        if(repairProof.applied&&!repairProof.accepted)issue('lost-repaired-reference',repairProof.reason);
        const knownSyntax=text=>repairCenturySyntax(residueEquivalenceSource(syntaxRepairEquivalenceSource(text,pageContextOptions({...DEFAULTS,...options}))),{markup:true,namespaceNumber:0});''')
replace('        result.preservation = preservationAudit(verifiedDOIExpectedSource(expectedSpelling,cfg),result.text);','        result.preservation = preservationAudit(verifiedDOIExpectedSource(expectedSpelling,cfg),result.text,cfg);')
replace("""        const shield = maskProtected(before, () => {});
        for (const m of shield.text.matchAll(/\\uE000AJGX*\\d+\\uE001/g)) {
            const originalLiteral = shield.restore(m[0]), literal = normalizeGallery(originalLiteral);
            const count = (s, piece) => s.split(piece).length - 1;
            if (count(after, literal) < count(before, originalLiteral)) issue('lost-protected', 'Um exemplo, comentário ou bloco literal foi alterado pelo ajuste.');
        }""", """        const literalCounts=source=>{
            const shield=maskProtected(source,()=>{}),counts=new Map();
            for(const token of shield.text.matchAll(/\\uE000AJGX*\\d+\\uE001/g)){
                const key=normalizeGallery(shield.restore(token[0]));counts.set(key,(counts.get(key)||0)+1);
            }return counts;
        };
        const literalsAfter=literalCounts(after);
        for(const [literal,n]of literalCounts(before))if((literalsAfter.get(literal)||0)<n)
            issue('lost-protected','Um exemplo, comentário ou bloco literal foi alterado pelo ajuste.');""")
replace('    function safeComposition(before, after) {','''    function safeComposition(before, after) {
        const syntaxProof=syntaxRepairSourceProof(before,after);
        if(syntaxProof.applied&&!syntaxProof.accepted)return syntaxProof.reason;''')
replace('        return referenceTransactions(before, result.text, diffHunks(before, result.text).map((h, index) => {','        return syntaxRepairTransactions(before,result.text,referenceTransactions(before, result.text, diffHunks(before, result.text).map((h, index) => {')
replace('        }));\n    }\n    function comparison(before, result) {','        })));\n    }\n    function comparison(before, result) {')
replace('        if (summarySpellingChanged(before, after)) topics.push(\'ortografia\');',"        if(kinds.some(k=>/^syntax(?:Template|Tag|Reference|Named|Formatting|Table)/.test(k)))topics.unshift('sintaxe');\n        if (summarySpellingChanged(before, after)) topics.push('ortografia');")
replace("const loss = (result.preservation||[]).filter(f=>/^lost-(?:url|image|identifier|protected|prose)$/.test(f.code));","const loss = (result.preservation||[]).filter(f=>/^lost-(?:url|image|identifier|protected|prose|repaired-reference)$/.test(f.code));")
replace('            let decision = previewDecision(before,after,root.DOMParser,task.source,result.text);', '''            const syntaxProof=syntaxRepairSourceProof(task.source,result.text,options);
            let syntaxBaseline=null;
            if(syntaxProof.applied&&syntaxProof.accepted){
                message('Conferindo a estrutura recuperada, sem salvar...');
                syntaxBaseline={...await taskParse(task,syntaxProof.baseline),source:syntaxProof.baseline};
            }
            let decision=syntaxPreviewDecision(before,syntaxBaseline,after,root.DOMParser,task.source,result.text,options);
            const initialDecision=decision;''')
replace('                decision = previewDecision(before,parsed,root.DOMParser,task.source,candidate);','                decision=syntaxPreviewDecision(before,syntaxBaseline,parsed,root.DOMParser,task.source,candidate,options);')
replace('introduced:result.previewCheck?.introduced || previewDecision(before,after,root.DOMParser,task.source,result.text).introduced,','introduced:initialDecision.introduced,')
replace('let body=mapTemplateTree(r.body,raw=>extendedCitation(citation(raw,cfg,()=>{},()=>{}),cfg,()=>{},()=>{}));','let body=mapTemplateTree(r.body,raw=>extendedCitation(citation(automaticCitationRepairs(raw,cfg,()=>{}),cfg,()=>{},()=>{}),cfg,()=>{},()=>{}));')
replace('    const api = {structuralArticlePlan,','''    const api = {syntaxRepairPlan,automaticSyntaxRepairs,syntaxRepairPrefix,syntaxRepairEquivalence,syntaxRepairEquivalenceSource,
        syntaxRepairSourceProof,syntaxRepairInventoryProof,syntaxPreviewDecision,syntaxRepairTransactions,syntaxPrefixOptions,
        syntaxRepairCacheStatus:()=>({entries:v24SyntaxPlanCache.size,estimatedBytes:v24SyntaxPlanCacheBytes,maximumEstimatedBytes:4194304}),
        structuralArticlePlan,''')
replace("['structuralRepairs', 'Corrigir repetições e listas de referências fora do lugar']","['structuralRepairs', 'Corrigir sintaxe, repetições e listas de referências']")
replace(' * A versão 2.3 confere cópias idênticas de infocaixas e chamadas finais,',''' * A versão 2.4 recupera fechamentos de sintaxe em padrões comprovados,
 * antes de executar os ajustes normais. Referências e tabelas exigem
 * limites reconhecidos. Um trecho incompleto preservado não autoriza
 * mudanças no seu conteúdo nem nas famílias de referências que o cruzam.
 * Os reparos aparecem na comparação, no relatório e no resumo da edição.
 *
 * A versão 2.3 confere cópias idênticas de infocaixas e chamadas finais,''')
if '--prototype' in sys.argv:
 (W/'prototype_current.js').write_text(s)
 subprocess.run([NODE,'--check',str(W/'prototype_current.js')],check=True)
 print('Prototype only; no released file changed.');raise SystemExit(0)
O.mkdir(exist_ok=True)
(O/'RevisaWiki_v2_4_completo.js').write_text(s)
(O/'Alteracoes_codigo_v2_3_para_v2_4.diff').write_text(''.join(difflib.unified_diff(original.splitlines(True),s.splitlines(True),fromfile='RevisaWiki_2.3.0',tofile='RevisaWiki_2.4.0')))
data={'version':'2.4.0','schema':1,'catalogDate':'2026-10-14','packed':{}}
for pattern,key,replacement in [(r'^    const PACKED_PTWIKI_CATALOG = (.*);$','ptwiki','    const PACKED_PTWIKI_CATALOG = root.RevisaWikiDataV2.packed.ptwiki;'),(r'^    const TRANSLATION_RULES = unpackTranslationData\((.*)\);$','translations','    const TRANSLATION_RULES = unpackTranslationData(root.RevisaWikiDataV2.packed.translations);'),(r'^    const SPELLING_RULES = Object.freeze\(unpackSpellingRows\((.*)\)\);$','spelling','    const SPELLING_RULES = Object.freeze(unpackSpellingRows(root.RevisaWikiDataV2.packed.spelling));')]:
 m=re.search(pattern,s,re.M);assert m,key;data['packed'][key]=json.loads(m.group(1));s=s[:m.start()]+replacement+s[m.end():]
(O/'RevisaWiki_v2_4_dados.js').write_text('/* RevisaWiki 2.4.0, dados. CC BY-SA 4.0. */\n(function(root){const data='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';if(typeof module === "object" && module.exports) module.exports=data;else root.RevisaWikiDataV2=data;})(typeof globalThis !== "undefined" ? globalThis : this);\n')
s=s.replace("const blob = new root.Blob(['(' + RevisaWikiBoot.toString() + ')(globalThis);']","const blob = new root.Blob(['globalThis.RevisaWikiDataV2='+JSON.stringify(root.RevisaWikiDataV2)+';\\n(' + RevisaWikiBoot.toString() + ')(globalThis);']")
bootstrap=(R/'build/module_bootstrap_v2_3.js').read_text().replace('2.3.0','2.4.0').replace('_v2_3','_v2_4')
(W/'module_bootstrap_v2_4.js').write_text(bootstrap)
(O/'RevisaWiki_v2_4.js').write_text(bootstrap.replace('__CORE_BOOT__',s))
for kind in ['common_js','comunitario']:
 (O/f'Carregador_{kind}_RevisaWiki_v2_4.js').write_text((B/f'Carregador_{kind}_RevisaWiki_v2_3.js').read_text().replace('2.3.0','2.4.0'))
for p in B.glob('Catalogo_*_v2_3.json'):(O/p.name.replace('_v2_3','_v2_4')).write_bytes(p.read_bytes())
for p in O.glob('*.js'):subprocess.run([NODE,'--check',str(p)],check=True)
files={p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in O.glob('*.js')}
assert files['RevisaWiki_v2_4.js']['bytes']<2097152 and files['RevisaWiki_v2_4_dados.js']['bytes']<2097152
assert files==expected['files'],'Generated bytes differ from the tested release.'
print(json.dumps({'version':'2.4.0','files':files},indent=2))

print('Rebuilt the exact tested 2.4.0 program and data. Expected hashes were not changed.')
