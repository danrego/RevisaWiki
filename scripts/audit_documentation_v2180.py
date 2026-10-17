"""Check the current manual, native UI contract and full copy payloads."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS, DIST = ROOT / 'docs/2.18.0', ROOT / 'dist/2.18.0'
checks = []
scope_path = ROOT / 'artifacts/v2180/DOCUMENTATION_SCOPE.json'
if not scope_path.exists():
    scope_path = ROOT / 'tests/evidence/2.18.0/DOCUMENTATION_SCOPE.json'
scope = json.loads(scope_path.read_text())
assert scope['version'] == '2.18.0' and scope['status'] == 'approved'


def check(value, name):
    checks.append({'name': name, 'passed': bool(value)})


manual = (DOCS / 'Documentacao_RevisaWiki_v2_18_0.wiki').read_text()
base = (ROOT / 'docs/2.17.0/Documentacao_RevisaWiki_v2_17_0.wiki').read_text()
active = manual.split('== Histórico das versões ==', 1)[0]
check(not re.search(r'</?(?:noinclude|includeonly|onlyinclude)\b', active, re.I), 'Inclusion-tag examples cannot control manual transclusion')
history = lambda text: text.split('=== 2.17.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
versions = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
headings = lambda text: re.findall(r'^== ([^=\n]+) ==$', text, re.M)
check(versions(manual) == ['2.18.0'] + versions(base), 'Newest-first history with no unpublished intermediate release')
check(history(manual) == history(base), 'Published historical release notes remain byte-identical')
check(headings(manual) == headings(base), 'All main manual sections remain in order')
check('Testes anteriores da interface' not in manual, 'No detached historical testing blocks')
check(manual.index('As versões aparecem da mais recente') < manual.index('=== 2.18.0 ==='), 'Chronological history introduction precedes the latest version')
for phrase in ["'''Ver o que mudou'''", "'''Escolher alterações'''", "'''Ver ajustes antes de aplicar'''", "'''Informações técnicas'''", "'''Resultados anteriores e conferências'''", "'''Por que alguns ajustes não entraram'''"]:
    check(phrase not in active, 'Retired UI instructions absent: ' + phrase)
for phrase in ['Mostrar alterações', 'controle nativo', 'atalho fica oculto', 'nunca usa Publicar como alternativa', 'Desfazer ajustes', 'mesmo nome e o mesmo verde']:
    check(phrase in active, 'Current native UI instruction: ' + phrase)
check('não tem uma comparação própria nem seleção de blocos' in active, 'Custom diff and hunk-selection retirement is explicit')
check('começa aberta' in active and 'escolha de recolhê-la' in active, 'Review expansion and user preference are documented')
check('mesmo parâmetro na mesma predefinição' in active and 'opções individuais' in active, 'Exact review grouping retains occurrence details')
check('descrição curta retirada' in active and 'detalhe' in active, 'Quiet description recovery remains available')
for title in ['Campos importados de medicamentos e substâncias químicas', 'Linhas vazias na prosa', 'Citações enciclopédicas importadas', 'Alinhamento das caixas de citação', 'Organização dos avisos']:
    check(active.count('=== ' + title + ' ===') == 1, 'One scope explanation: ' + title)
check(all(language in active for language in ['inglês', 'espanhol', 'francês', 'alemão']), 'All four audited source languages are named')
check('não muda números ou unidades' in active and 'não calcula a massa molar' in active and 'já funcionam permanecem iguais' in active, 'Chemical values and working native names are protected')
check('não apaga categorias avulsas' in active and 'wstitle literal e não vazio' in active, 'Encyclopedia migration is finite and does not delete categories generally')
check('Texto citado' in active or 'texto citado' in active, 'Quoted-text preservation is documented')
check('ordem dos campos repetidos' in active, 'Duplicate-field precedence is preserved')
check('Essas linhas podem conter apenas espaços ou tabulações' in active and 'uma única linha vazia' in active, 'Only proved ASCII blank runs are reduced')
check(all(word in active for word in ['poemas', 'tabulações', 'formatos misturados', 'discussões']), 'Spacing exclusions are documented')
check('apresentação responsiva nativa' in active and 'deixa de acrescentar um número fixo de colunas' in active, 'References use native responsive layout instead of a fixed threshold')
check('seis itens principais' in active and 'não define a apresentação das referências' in active, 'External and bibliographic list rules remain distinct')
new_entry = manual.split('=== 2.18.0 ===', 1)[1].split('=== ', 1)[0]
check(len(re.findall(r'^\* ', new_entry, re.M)) == len(scope['features']), 'Latest release includes only its approved feature bullets')
check(not re.search('[\u2014\u201c\u201d\u2018\u2019]', new_entry), 'New release prose uses plain straight punctuation')
check('https://github.com/danrego/RevisaWiki' in manual, 'Repository is linked')
for term in ['Predefinições, documentação e estilos', 'nomes dinâmicos', 'TemplateData', 'TemplateStyles', 'ausentes em vazios', 'subgrupos']:
    check(term.lower() in active.lower(), 'Template-release scope: ' + term)
check('2.13.1' not in manual, 'Unpublished patch is not listed as released')


for phrase in ['Infocaixas e identificação inicial', 'automaticInfoboxOrder', 'automaticBiographyLead', 'automaticFieldSyntax', 'automaticInfoboxImages', '1583', 'referenciados', 'sepultamento']:
    check(phrase.lower() in active.lower(), 'New repair scope and limits: ' + phrase)
check('não é marcada automaticamente como edição menor' in active, 'Copying facts is not automatically minor')
check('automaticBiographyFields' in active, 'New field automation has its own documented setting')
check('Na cópia da abertura, um campo explicitamente vazio permanece vazio' in active, 'Explicit empty native parameters are protected')
check('Wikidata' in active and 'referência própria' in active, 'Fact copying requires a proved local destination and individual source')
check('dois a oito' in active and 'itens explicitamente ligados' in active, 'List repair scope is finite and literal')
check('Info/Piloto de automóvel' in active and 'símbolo de metro' in active, 'Unit correction is limited to its proved template field')
check('naquele dia UTC' in active and 'expira na virada do dia' in active, 'Age equivalence expires at the native UTC day boundary')
check('DataExt' in active and 'sem acrescentar idade ou categorias' in active, 'Standalone date formatting adds no demographic category')
check('campos <code>sepultamento</code>' in active, 'Frozen burial scope remains explicit')

check('dados conflitantes' in active.lower() or 'dados futuros ou conflitantes' in active.lower(), 'Conflicting facts are not chosen')

raw = (ROOT / 'tests/expected_release_v2180.json').read_bytes()
manifest = json.loads(raw)
qa_path = ROOT / 'artifacts/v2180/QA_SUMMARY.json'
if not qa_path.exists():
    qa_path = ROOT / 'tests/evidence/2.18.0/QA_SUMMARY.json'
qa = json.loads(qa_path.read_text())
check(qa['version'] == '2.18.0' and qa['status'] in ['passed', 'passed-with-preexisting-findings'], 'Only completed current QA is described')
check(qa['releaseManifestSha256'] == hashlib.sha256(raw).hexdigest() and qa['frozenFiles'] == manifest['files'], 'QA binds every exact current executable')
check(qa['portugueseSummary'] in manual, 'Manual includes the actual completed QA summary')
for name, proof in manifest['files'].items():
    content = (DIST / name).read_bytes()
    check(len(content) == proof['bytes'] and hashlib.sha256(content).hexdigest() == proof['sha256'], 'Executable pin: ' + name)
    check(b'~~~' not in content, 'No literal save-time signature trigger: ' + name)
for name in ['Chamada_fixa_RevisaWiki_common.js', 'Chamada_fixa_RevisaWiki_copia_propria.js']:
    check((DIST / name).read_bytes() == (ROOT / 'dist/2.17.0' / name).read_bytes(), 'Permanent bootstrap unchanged: ' + name)
for name in ['RevisaWiki_v2_18_0.js', 'RevisaWiki_v2_18_0_dados.js']:
    check((DIST / name).stat().st_size < 2097152, 'Modular install file below page limit: ' + name)
for file in DOCS.iterdir():
    if not file.is_file():
        continue
    text = file.read_text()
    check(file.read_bytes() == (DIST / file.name).read_bytes(), 'Complete documentation copy: ' + file.name)
    check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'Only one blank line: ' + file.name)
    private_path_pattern = r'\bPENDING\b|TODO|/' + 'Users/|/' + r'private/|127\.0\.0\.1:\d+'
    check(not re.search(private_path_pattern, text), 'No unfinished text or local paths: ' + file.name)
installation = (DOCS / 'Instalacao_RevisaWiki_v2_18_0.txt').read_text()
check('mesmo que a 2.17.0 já esteja instalada' in installation, 'Existing distribution update is explained')
check('Mostrar alterações usa o controle nativo' in installation, 'Installation text matches the new UI')
index = (DIST / 'INICIO.html').read_text()
match = re.search(r'<script type="application/json" id="payloads">([\s\S]*?)</script>', index)
check(bool(match), 'Full copy payload is present')
if match:
    payload = json.loads(match[1])
    check(list(payload) == ['dados', 'programa', 'central', 'documentacao', 'carregador'], 'Installation order with optional common.js')
    for key, item in payload.items():
        content = (DIST / item['filename']).read_bytes()
        check(item['text'].encode() == content, 'Full file copied: ' + key)
        check(item['sha256'] == hashlib.sha256(content).hexdigest() and item['bytes'] == len(content), 'Copy integrity: ' + key)
        check(bool(item['destination'].strip()) and bool(item['summary'].strip()), 'Copy destination and edit summary: ' + key)
    check(payload['central']['destination'] == 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', 'Central loader has the correct destination')
check(index.count('class="raw-source"') == 5 and 'action=edit' in index, 'Each card has raw-source and editor links')
check('PTwiki 2.18.0' in active and "loaderRevision = '2.18.0'" in active, 'Version is consistent in installation diagnostics')
# Retain the previous 131 checks, with current version addresses and current UI semantics.
retargeted_checks = len(checks)
check(retargeted_checks == 131, 'The 131 preceding documentation checks remain present')
check('todas as referências nomeadas ficam protegidas' not in active and 'trechos que passam por uma conferência própria' in active and 'Os nomes das referências, seus grupos e as chamadas relacionadas permanecem intactos' in active, 'Partial-source guidance matches the bounded citation-island repair')
check('Os 241 itens são regras de substituição no texto de artigos' in active and 'não abrangem todas as funções do programa de origem' in active, 'The descriptor count does not promise whole-gadget parity')
check(all(term in active for term in ['abertura em lote', 'editor visual', 'wikEd', 'CodeMirror', 'código-fonte do editor de 2017']), 'Supported source editors and excluded original gadget flows are explicit')
check('Em testes de versões anteriores, um artigo de quase 2 MiB' in active, 'The older large-browser timeout result is not presented as current performance evidence')
extra_summary = qa.get('alertReduction', {}).get('portugueseSummary')
check(not extra_summary or extra_summary in manual, 'Optional measured alert results match completed QA')
for name in ['Instalacao_RevisaWiki_v2_18_0.txt', 'Notas_da_versao_RevisaWiki_v2_18_0.txt',
             'Referencia_tecnica_RevisaWiki_v2_18_0.txt', 'Relatorio_testes_RevisaWiki_v2_18_0.txt']:
    check(qa['portugueseSummary'] in (DOCS / name).read_text() and
          (not extra_summary or extra_summary in (DOCS / name).read_text()),
          'Actual completed QA and optional alert totals: ' + name)
check('Consultas opcionais indisponíveis ou incompletas não são apresentadas como erros do artigo' in active,
      'Optional unavailable checks do not become page errors')
check('Se a consulta online falhar, Precisa de revisão oferece Mostrar previsão' not in active,
      'No retired review-area preview advice')
check('no texto final' in active and 'resultados do texto anterior' in active,
      'Visible review is bound to the actual final draft')
check('todos os locais e escolhas continuam acessíveis' in active.lower() and
      'ocorrência que não era a primeira' in active and 'percorre as ocorrências' in active,
      'Every grouped source location and independent choice remains reachable')
check('não muda o código nem as proteções de conteúdo' in active and 'não abre novos painéis' in active,
      'Quiet review changes neither source nor protection guards and adds no panels')
check('Quando uma sugestão já apresenta um parâmetro desconhecido' not in active,
      'No obsolete catalog-only removal suggestion is documented')
check('Uma ausência no catálogo não basta para oferecer a retirada de um parâmetro e de seu valor' in active,
      'Catalog absence alone cannot authorize data deletion')
check('21 erros de acentuação' in active and 'Dez famílias de campos' in active and
      'seis definições nativas' in active and 'automaticInfoboxValues' in active,
      'The exact enabled native infobox inventory and opt-out are documented')
check('ocupação=|ocupações=Escritora' in active and 'impede que o valor de ocupações apareça' in active,
      'The explicitly empty higher-precedence occupation remains frozen')
check('um nome alternativo já aceito' in active.lower() and 'um valor vazio impede essa troca' in active,
      'Accepted aliases and explicit empty typo fields are preserved')
check('uma única definição e uma única lista correspondente' in active and
      'somente os atributos traduzidos não bastam para autorizar uma à outra' in active,
      'Translated reference attributes require native binding and one definition and collector')
check('O conjunto de referências precisa ser inteiramente legível' in active and
      'inclusive por meio de uma infocaixa ou do Wikidata' in active,
      'Unknown reference emissions do not authorize a guessed native graph')
check('de dois a quatro nomes digitados incorretamente' in active and
      'apenas a correção de todos forme uma grade regular' in active,
      'Joint span misspellings require the unique complete regular interpretation')
check('Os números, o conteúdo e a ordem das células precisam continuar iguais' in active,
      'Joint table repair retains all ordered cell payloads')
check('2.18.0/Relatorio_testes_RevisaWiki_v2_18_0.txt Relatório de testes 2.18.0' in manual and
      '2.18.0/Referencia_tecnica_RevisaWiki_v2_18_0.txt' in manual,
      'Current test and technical links address this exact release')
contract_review = json.loads((ROOT / 'src/v2_17/infobox_contract_review.json').read_text())
check(contract_review['runtimeCounts'] == {'accentMappings': 21, 'presenceAliasGroups': 10,
      'accentTemplateDefinitions': 4, 'aliasTemplateDefinitions': 4},
      'Published feature totals match reviewed native evidence')
check(sum(bool(row['accents'] or row['aliases']) for row in contract_review['contracts']) == 6,
      'Six pinned native definitions form the exact runtime union')
check(len(re.findall(r'^- ', (DOCS / 'Notas_da_versao_RevisaWiki_v2_18_0.txt').read_text(), re.M)) == len(scope['features']),
      'Release notes repeat every approved feature bullet')
check(len(list(DOCS.iterdir())) == 8 and all(path.is_file() and not path.is_symlink() for path in DOCS.iterdir()),
      'The documentation set contains exactly eight ordinary files')

check('Os comprovantes originais são conferidos antes de gerar os resumos públicos' in manual, 'Public summaries are distinguished from private original case receipts')
check(active.index('# Copie <code>Documentacao_RevisaWiki_v2_18_0.wiki') < active.index('# Se já usa a chamada fixa acima'), 'The manual follows the same four update cards before the optional bootstrap step')
check(scope['intro'] in active, 'The current introduction matches approved source-audit scope')
for feature in scope['features']:
    check('* ' + feature in new_entry, 'Approved release feature: ' + feature)
for paragraph in scope['compatibilityScope']:
    check(paragraph in active, 'Approved bounded-citation scope is complete')
check('automaticProseGaps' in active and 'preserva a indentação' in active,
      'The new spacing rule has an opt-out and preserves indentation')
check('Uma referência completa dentro do parágrafo pode conter uma predefinição de citação' in active,
      'Complete inline references no longer prevent outside whitespace repair')
check('63785697' in active and '69333097' in active,
      'Native reference-layout guidance names permanent anonymous source revisions')
check('conjunto exato de quatro declarações CSS' in active and 'Estilos próprios' in active,
      'Only the complete earlier generated layout style is removed')
check('não envolve as referências em uma Div col' in active,
      'Reference layout cannot inherit external-list column wrappers')
check('O programa só retira linhas completamente vazias' not in active and
      'Linhas que contêm espaços ou tabulações, o início e o fim da página' not in active,
      'Narrow superseded whitespace guidance is removed from active instructions')
for obsolete in ['exige dez ou mais entradas reconhecidas na mesma lista',
                 'Listas com até nove entradas não recebem colunas fixas',
                 'Esse mínimo de dez é um critério do script',
                 'O estilo novo permite até duas colunas']:
    check(obsolete not in active, 'Retired fixed-reference-column guidance: ' + obsolete)
check(not re.search(r'2\.17\.0[^\n]*(?:passaram|páginas medidas)', manual.split('== Testes e detalhes técnicos ==', 1)[1]),
      'Prior measured totals are not presented as current release QA')

failed = [row for row in checks if not row['passed']]
out = ROOT / 'artifacts/v2180'
out.mkdir(parents=True, exist_ok=True)
report = {'version': '2.18.0', 'status': 'failed' if failed else 'passed', 'checks': len(checks),
    'failed': len(failed), 'failures': failed, 'results': checks,
    'releaseManifestSha256': hashlib.sha256(raw).hexdigest(), 'frozenFiles': manifest['files'],
    'retargetedBaselineChecks': retargeted_checks,
    'priorManualSha256': hashlib.sha256(base.encode()).hexdigest(),
    'priorHistorySha256': hashlib.sha256(history(base).encode()).hexdigest(),
    'documentationFiles': {file.name: {'bytes': file.stat().st_size,
        'sha256': hashlib.sha256(file.read_bytes()).hexdigest()} for file in DOCS.iterdir() if file.is_file()},
    'indexSha256': hashlib.sha256((DIST / 'INICIO.html').read_bytes()).hexdigest(),
    'scopeSha256': hashlib.sha256(scope_path.read_bytes()).hexdigest(),
    'wikipediaWrites': 0}
(out / 'documentation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': report['status'], 'checks': len(checks), 'failed': failed}, ensure_ascii=False))
if failed:
    raise SystemExit(1)
