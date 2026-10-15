"""Rebuild RevisaWiki 2.5.0 from the immutable 2.4.0 distribution.

Set REVISAWIKI_NODE or pass --node if Node.js is not on PATH. This script
supports both the workspace layout and the published repository layout.
"""
from pathlib import Path
import argparse,difflib,hashlib,json,os,re,shutil,subprocess

HERE=Path(__file__).resolve()
PORTABLE=HERE.parent.name=='scripts'
R=HERE.parents[1] if PORTABLE else HERE.parents[2]
W=R/'src/v2_5' if PORTABLE else R/'work/revisawiki_v2_5'
O=R/'dist/2.5.0' if PORTABLE else R/'outputs/revisawiki_v2_5'
B=R/'dist/2.4.0' if PORTABLE else R/'outputs/revisawiki_v2_4'
BASE_SHA256='f1b6cafec164840342ec6aa616f003934d07d8757059f6df272042e956d021b1'
PACKED_SHA256='1daf86b796e70e117891abef91e3447ea8c0b211cc03b9966d39920f3f0d4323'
args=argparse.ArgumentParser()
args.add_argument('--prototype',action='store_true')
args.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
args=args.parse_args()
if not args.node: raise SystemExit('Node.js is required. Set REVISAWIKI_NODE or pass --node.')
original=(B/'RevisaWiki_v2_4_completo.js').read_text()
assert hashlib.sha256(original.encode()).hexdigest()==BASE_SHA256,'The immutable 2.4.0 source does not match.'
required=['safe_repairs.js','lead_heading.js','integration_rules.js','integration_builder_snippets.json','module_bootstrap_v2_5.js','protected_quote_lexer.js','infobox_alignment.js','talk_preparation.js','talk_preparation_ui.js']
missing=[name for name in required if not (W/name).is_file()]
if missing: raise SystemExit('Build inputs are not ready: '+', '.join(missing))
s=original.replace('2.4.0','2.5.0')
def replace(before,after):
    global s
    assert s.count(before)==1,(s.count(before),before[:160])
    s=s.replace(before,after)

# These legacy declarations retain their exact implementation. The adapter
# wraps only the approved finite repairs and still calls the old guards.
snippets=json.loads((W/'integration_builder_snippets.json').read_text())
assert snippets['version']=='2.5.0'
lexer=snippets['protectedLexerReplacement']
lex_start=s.index(lexer['start']);lex_end=s.index(lexer['endExclusive'],lex_start)
assert hashlib.sha256(s[lex_start:lex_end].encode()).hexdigest()==lexer['immutable2_4BlockSha256']
s=s[:lex_start]+(W/lexer['replacementFile']).read_text()+s[lex_end:]
for before,after in snippets['declarationRenames']:replace(before,after)
for change in snippets.get('optionPropagationReplacements',[]):
    assert change['expectedOccurrences']==1
    replace(change['before'],change['after'])
anchor=snippets['insertBefore']
replace(anchor, '\n'.join((W/name).read_text() for name in snippets['insertionOrder']+['infobox_alignment.js','talk_preparation.js'])+'\n'+anchor)
replace('    function personalConfig() {', (W/'talk_preparation_ui.js').read_text()+'\n    function personalConfig() {')
replace("        const top = node('div', undefined, 'ajg-top'); top.append(heading, actions);", """        if(namespace===1&&editingSection()===null)actions.append(control('Preparar discussão',prepareTalkHeader,'ajg-prepare-talk','Preparar PD e marcas dos projetos confirmados nos portais do artigo, sem publicar.','prepare-talk'));
        const top = node('div', undefined, 'ajg-top'); top.append(heading, actions);""")
replace('        const syntactic=automaticSyntaxRepairs(source,cfg,bump,warn);', '''        const safeRepairs=automaticSafeRepairs(source,cfg,bump);
        const leadHeading=automaticLeadHeadingCleanup(safeRepairs,cfg,bump);
        const syntactic=automaticSyntaxRepairs(leadHeading,cfg,bump,warn);''')
replace('    const GROUP_LABELS = {', '''    const GROUP_LABELS = {
        redundantLeadHeading:'Título repetido antes da introdução retirado',
        safeAdjacentReferenceCalls:'Chamadas consecutivas da mesma referência retiradas',
        safeEquivalentCitations:'Citações iguais com campos em outra ordem reutilizadas',
        safeDuplicateAttributes:'Atributos repetidos com valores iguais consolidados',
        safeMixedTemplateClosers:'Fechamentos trocados de predefinições corrigidos',
        safeAdjacentCollectors:'Listas vazias de referências repetidas retiradas',''')
replace("        redundantLeadHeading:'Título repetido antes da introdução retirado',", "        infoboxAlignment:'Alinhamento dos campos da infocaixa',\n        redundantLeadHeading:'Título repetido antes da introdução retirado',")
replace("        checkpoint('Ponto final de legendas');", "        checkpoint('Ponto final de legendas');\n        s=automaticInfoboxAlignment(s,cfg,bump);\n        checkpoint('Alinhamento dos campos da infocaixa');")
replace('    const api = {syntaxRepairPlan,', '''    const api = {v25LeadTitle,v25LeadHeadingPlan,automaticLeadHeadingCleanup,
        v25InfoboxAlignmentPlan,automaticInfoboxAlignment,v25InfoboxAlignmentSourceProof,
        v25TalkPreparationPlan,v25ArticleProjectPortals,
        v25SafeRepairPlan,automaticSafeRepairs,v25SafeRepairEquivalence,v25SafeCitationSignature,v25SafeRepairCacheStatus,v25ApprovedSyntaxPlan,v25RepairObjectProof,
        syntaxRepairPlan,''')
# The wrapper runs the new source-bound repairs, the lead heading, then the
# unchanged legacy syntax pass before legacy incomplete-tail recovery begins.
# Adapter-specific exports and proof integration are supplied in integration_rules.js.
replace("if(kinds.some(k=>/^syntax(?:Template|Tag|Reference|Named|Formatting|Table)/.test(k)))topics.unshift('sintaxe');", "if(kinds.some(k=>/^(?:syntax(?:Template|Tag|Reference|Named|Formatting|Table)|safeMixedTemplateClosers|safeDuplicateAttributes)/.test(k)))topics.unshift('sintaxe');")
replace("preservedUnresolvedTail:'Trecho completo ajustado com cauda incompleta preservada'", "preservedUnresolvedTail:'Trecho completo ajustado sem alterar a parte incompleta'")
replace("trace:cfg.captureTrace&&text!==source?[{label:'Reparos de sintaxe e ajustes locais com cauda preservada'", "trace:cfg.captureTrace&&text!==source?[{label:'Reparos de sintaxe e ajustes locais com parte incompleta preservada'")
start=s.index('/*\n');end=s.index(' */',start)+3
header='''/*
 * RevisaWiki para a ptwiki, versão 2.5.0, 15 de outubro de 2026.
 * Licença: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/
 *
 * Ajustar código corrige os padrões previstos de sintaxe, citações,
 * infocaixas, ligações, notas, seções finais e grafia. A versão 2.5 trata
 * títulos repetidos antes da introdução, chamadas consecutivas da mesma
 * referência, citações iguais com campos em outra ordem, atributos
 * duplicados idênticos e mais fechamentos trocados reconhecidos. Também
 * alinha os campos das infocaixas já escritas com um campo por linha.
 * Preparar discussão monta PD e marcas dos projetos confirmados nos portais
 * do artigo, preservando as avaliações e as mensagens existentes.
 *
 * As alterações ficam no editor. O relatório permite comparar, escolher
 * quais mudanças manter e desfazer o resultado. O script não salva páginas.
 * Referências, tabelas, exemplos e fórmulas têm proteções próprias. Um trecho
 * incompleto não autoriza alterar o conteúdo que não pôde ser lido.
 *
 * Há regras de código para 23 edições: inglês, francês, alemão, espanhol,
 * russo, ucraniano, turco, hebraico, italiano, romeno, coreano, japonês,
 * chinês, cantonês, vietnamita, tailandês, neerlandês, dinamarquês, sueco,
 * norueguês bokmål, norueguês nynorsk, finlandês e árabe. A ferramenta não
 * traduz a prosa nem avalia a qualidade das fontes. Portais e controle de
 * autoridade exigem as confirmações previstas em cada regra.
 *
 * Agradecimentos aos scripts e às revisões anteriores.
 * Fontes e histórico nos links permanentes:
 * https://pt.wikipedia.org/w/index.php?oldid=66288743
 * https://pt.wikipedia.org/w/index.php?oldid=72349758
 * https://pt.wikipedia.org/w/index.php?oldid=73087684
 */'''
s=s[:start]+header+s[end:]
if args.prototype:
    target=W/'prototype_current.js';target.write_text(s)
    subprocess.run([args.node,'--check',str(target)],check=True)
    print('Prototype built. No distribution file changed.');raise SystemExit(0)
O.mkdir(parents=True,exist_ok=True)
(O/'RevisaWiki_v2_5_completo.js').write_text(s)
(O/'Alteracoes_codigo_v2_4_para_v2_5.diff').write_text(''.join(difflib.unified_diff(original.splitlines(True),s.splitlines(True),fromfile='RevisaWiki_2.4.0',tofile='RevisaWiki_2.5.0')))
data={'version':'2.5.0','schema':1,'catalogDate':'2026-10-14','packed':{}}
patterns=[(r'^    const PACKED_PTWIKI_CATALOG = (.*);$','ptwiki','    const PACKED_PTWIKI_CATALOG = root.RevisaWikiDataV2.packed.ptwiki;'),(r'^    const TRANSLATION_RULES = unpackTranslationData\((.*)\);$','translations','    const TRANSLATION_RULES = unpackTranslationData(root.RevisaWikiDataV2.packed.translations);'),(r'^    const SPELLING_RULES = Object.freeze\(unpackSpellingRows\((.*)\)\);$','spelling','    const SPELLING_RULES = Object.freeze(unpackSpellingRows(root.RevisaWikiDataV2.packed.spelling));')]
for pattern,key,replacement in patterns:
    match=re.search(pattern,s,re.M);assert match,key
    data['packed'][key]=json.loads(match.group(1));s=s[:match.start()]+replacement+s[match.end():]
canonical=lambda obj:json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':'))
assert hashlib.sha256(canonical(data['packed']).encode()).hexdigest()==PACKED_SHA256,'Catalog content changed.'
(O/'RevisaWiki_v2_5_dados.js').write_text('/* RevisaWiki 2.5.0, dados. CC BY-SA 4.0. */\n(function(root){const data='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';if(typeof module === "object" && module.exports) module.exports=data;else root.RevisaWikiDataV2=data;})(typeof globalThis !== "undefined" ? globalThis : this);\n')
s=s.replace("const blob = new root.Blob(['(' + RevisaWikiBoot.toString() + ')(globalThis);']", "const blob = new root.Blob(['globalThis.RevisaWikiDataV2='+JSON.stringify(root.RevisaWikiDataV2)+';\\n(' + RevisaWikiBoot.toString() + ')(globalThis);']")
bootstrap=(W/'module_bootstrap_v2_5.js').read_text();assert bootstrap.count('__CORE_BOOT__')==1
assert PACKED_SHA256 in bootstrap and "const VERSION = '2.5.0'" in bootstrap
(O/'RevisaWiki_v2_5.js').write_text(bootstrap.replace('__CORE_BOOT__',s))
for kind in ['common_js','comunitario']:
    (O/f'Carregador_{kind}_RevisaWiki_v2_5.js').write_text((B/f'Carregador_{kind}_RevisaWiki_v2_4.js').read_text().replace('2.4.0','2.5.0'))
for p in B.glob('Catalogo_*_v2_4.json'):
    catalog=json.loads(p.read_text());catalog['releaseVersion']='2.5.0'
    (O/p.name.replace('_v2_4','_v2_5')).write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
for p in O.glob('*.js'):subprocess.run([args.node,'--check',str(p)],check=True)
files={p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in O.glob('*.js')}
assert files['RevisaWiki_v2_5.js']['bytes']<2097152 and files['RevisaWiki_v2_5_dados.js']['bytes']<2097152
freeze={'version':'2.5.0','baseSha256':BASE_SHA256,'packedCatalogSha256':PACKED_SHA256,'files':files}
if not PORTABLE:
    (W/'final_test_freeze.json').write_text(json.dumps(freeze,indent=2)+'\n')
print(json.dumps(freeze,indent=2))
