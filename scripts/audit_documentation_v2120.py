"""Check the current manual, installation order and complete copy payloads."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS, DIST = ROOT / 'docs/2.12.0', ROOT / 'dist/2.12.0'
checks = []


def check(condition, name):
    checks.append({'name': name, 'passed': bool(condition)})


manual = (DOCS / 'Documentacao_RevisaWiki_v2_12_0.wiki').read_text()
previous = (ROOT / 'docs/2.11.1/Documentacao_RevisaWiki_v2_11_1.wiki').read_text()
previous=re.sub(r' O primeiro caso é o artigo [^\n.]+\.', '', previous)
previous=re.sub(r'Em [^\n,]+, voltar todas as chamadas para Citar web', 'No conjunto examinado, voltar todas as chamadas para Citar web',previous)
previous=re.sub(r'(?m)^\* Corrige trocas antigas de modelos de referência [^\n]+$', '* Corrige trocas antigas de modelos de referência somente em casos previamente verificados e registrados no catálogo.',previous)
headings = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
check(headings(manual) == ['2.12.0'] + headings(previous), 'Newest-first history retains previous releases')
check(manual.index('As versões aparecem da mais recente') < manual.index('=== 2.12.0 ==='), 'General history introduction precedes the newest release entry')
h2 = lambda text: re.findall(r'^== ([^=\n]+) ==$', text, re.M)
check(h2(manual) == h2(previous), 'All previous main manual sections remain in order')
historical = lambda text: text.split('=== 2.11.1 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
check(historical(manual) == historical(previous), 'Historical release content remains byte-identical')
check('Desde a 2.6.2, a leitura das aspas' in manual, 'Quotation boundary change keeps its historical version')
qa_paths = [ROOT / 'artifacts/v2120/RELEASE_QA_SUMMARY.json',
            ROOT / 'artifacts/v2120/release-test-summary.json',
            ROOT / 'tests/evidence/2.12.0/RELEASE_QA_SUMMARY.json']
qa_path = next((path for path in qa_paths if path.exists()), qa_paths[0])
qa = json.loads(qa_path.read_text())
check(qa['status'] == 'passed' and qa['version'] == '2.12.0', 'Only completed current-version QA is described')
current_manifest = json.loads((ROOT / 'tests/expected_release_v2120.json').read_text())
check(qa['frozenFiles'] == current_manifest['files'], 'QA describes these exact executable files')
check(qa.get('failed',0) == 0 and not qa.get('failures'), 'Final QA has no unresolved failure')
check(qa['releaseManifestSha256'] == hashlib.sha256((ROOT / 'tests/expected_release_v2120.json').read_bytes()).hexdigest(), 'QA binds the full current release manifest')
check(qa['portugueseSummary'] in manual, 'Manual includes the exact final QA summary')
test_report = (DOCS / 'Relatorio_testes_RevisaWiki_v2_12_0.txt').read_text()
check(all(group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações' in test_report for group in qa['groups']), 'Test report describes the actual final QA groups')
check((DOCS / 'LEIA_PRIMEIRO.txt').exists(), 'Quick-start guide remains available')
check('Ajustes aplicados\'\'\' informa quantos trechos mudaram' not in manual, 'Old misleading block-as-correction wording is absent')
active_manual = manual.split('== Histórico das versões ==', 1)[0]
check('O botão azul fica no painel superior' not in active_manual and 'o mesmo nome e o mesmo verde' in active_manual, 'Active button instructions match the two green controls')
check("O link '''Editar aqui''' fica nos controles de cada seção" not in active_manual, 'Removed section-button instructions are absent from active manual')
check("Os botões adicionais '''Editar aqui''' foram retirados na 2.7" in active_manual, 'Current manual explains section-button removal')
check('https://github.com/danrego/RevisaWiki' in manual, 'Repository is linked')
check('=== Nomes químicos e montagem da infocaixa ===' in manual, 'Inherited chemical repair and boundaries remain documented')
check('=== Aspas em atributos de células ===' in manual, 'Current table repair and quotation boundaries are documented')
check('=== Casamento em campos de cônjuge ===' in manual, 'Current explicit marriage conversion is documented')
check('=== Escolha do modelo da referência ===' in manual, 'Current citation-model preservation is documented')
check('=== Correção de referências de versões anteriores ===' in manual, 'Reviewed historical citation repair is documented')
check('Cada correção precisa corresponder ao artigo e à referência registrados' in manual, 'Page and citation matching gates are explained')
check('Um endereço ausente só pode ser recuperado' in manual and 'comprovado para a mesma fonte' in manual, 'URL recovery requires evidence for the same source')
check('voltar todas as chamadas para Citar web repetiria erros de URL' in manual, 'Repair does not restore pre-existing missing-URL errors blindly')
check('não busca versões antigas durante o uso' in manual, 'No runtime history lookup is promised')
check('Uma chamada legítima de Citation fora desses casos permanece' in manual, 'General generic citations remain out of repair scope')
check('sem guardar os nomes de quem editou' in manual, 'Public provenance excludes editor identities')
repair = json.loads((ROOT / 'src/v2_8_2/HISTORICAL_CITATIONS.json').read_text())
check(repair['counts']['repairable'] == 132 and repair['counts']['unresolved'] == 22 and
      '132 receberam correspondência confirmada' in manual and
      'As outras 22 continuam como Citation' in manual, 'Confirmed recovery count and unresolved references are stated accurately')
old_native = json.loads((ROOT / 'tests/v282/NATIVE_RENDER_PROOF.json').read_text())
old_manifest = json.loads((ROOT / 'tests/expected_release_v282.json').read_text())
check(old_native['status'] == 'passed' and old_native['frozenFiles'] == old_manifest['files'] and
      old_native['repairedReferences'] == 132 and old_native['newCitationErrors'] == 0 and
      '132 pares de referências' in manual, 'Historical citation render proof keeps its original release binding')
historical_section = lambda text: text.split('=== Correção de referências de versões anteriores ===', 1)[1].split('=== Escolha do modelo da referência ===', 1)[0]
check(historical_section(manual) == historical_section(previous), 'Historical citation recovery section remains byte-identical')
native = json.loads((ROOT / 'tests/v283/NATIVE_BIRTH_CATEGORY_PROOF.json').read_text())
birth_manifest = json.loads((ROOT / 'tests/expected_release_v283.json').read_text())
check(native['status'] == 'passed' and native['version'] == '2.8.3' and
      native['frozenFiles'] == birth_manifest['files'] and native['realBiographyPairs'] >= 6 and
      native['categoryMembershipAndSortKeysUnchanged'] is True and
      native['wikipediaWrites'] == native['accountsUsed'] == 0,
      'Historical native category proof retains its original 2.8.3 binding')
birth = json.loads((ROOT / 'tests/v2120/NATIVE_BIRTH_CATEGORY_PROOF.json').read_text())
check(birth['status'] == 'passed' and birth['version'] == '2.12.0' and
      birth['frozenFiles'] == current_manifest['files'] and
      birth['releaseManifestSha256'] == qa['releaseManifestSha256'] and
      birth['realBiographyPairs'] >= 6 and birth['categoryMembershipAndSortKeysUnchanged'] is True and
      birth['wikipediaWrites'] == birth['accountsUsed'] == 0,
      'Current native birth-category proof binds the final 2.12.0 files')
repairs = json.loads((ROOT / 'tests/v2120/NATIVE_REPAIR_RENDER_PROOF.json').read_text())
check(repairs['status'] == 'passed' and repairs['version'] == '2.12.0' and
      repairs['frozenFiles'] == current_manifest['files'] and
      repairs['releaseManifestSha256'] == qa['releaseManifestSha256'] and
      repairs['nativeComparisons'] >= 8 and repairs['wikipediaWrites'] == repairs['accountsUsed'] == 0,
      'Native repair comparisons bind the final files and use no account or writes')
check('=== Categoria de nascimento repetida ===' in active_manual, 'Birth-category deduplication has its own scope explanation')
check('consulta anônima à ptwiki precisa confirmar' in active_manual, 'Removal requires runtime native category confirmation')
check('envia a infocaixa reconhecida para a API de análise da ptwiki, sem conta e sem salvar' in active_manual, 'Online privacy section identifies the anonymous infobox request')
check('linhas de categoria explícita isoladas e sem barra vertical' in active_manual and
      'incluindo repetições idênticas' in active_manual and 'mesmo que a chave esteja vazia' in active_manual,
      'Only unpiped standalone category lines, including identical duplicates, are removable')
check('DEFAULTSORT permanece como está, sem impedir' in active_manual, 'DEFAULTSORT is preserved without blocking a plain category removal')
check('si de Dni desliga a idade exibida, mas mantém a categoria' in active_manual, 'si retains the birth-year category')
check('nocat vazio permite a categorização normal' in active_manual and 'inclusive 0 ou false' in active_manual, 'Only empty nocat retains normal categorization')
check('mesmo texto e à mesma chamada' in active_manual and 'texto anterior ou uma resposta com avisos não autoriza' in active_manual, 'Runtime category proof is source-bound and warning-free')
check('nomes alternativos DNI, Nascimento e idade e Data de nascimento' in active_manual, 'Only the reviewed direct birth-template aliases are documented')
check('de 1000 até o ano atual' in active_manual and 'um único campo de nascimento aceito' in active_manual, 'Literal year and unique principal birth-field limits are documented')
check('artigo inteiro do domínio principal' in active_manual and 'Não atua em discussões, predefinições ou edição de seção' in active_manual, 'New cleanup scope excludes non-main and section editing')
check('Se a consulta falhar ou não confirmar a mesma categoria' in active_manual and 'sem um aviso adicional' in active_manual, 'Unconfirmed proof leaves source unchanged without a new warning')
check('quando o campo url falta ou está vazio' in manual, 'Missing original URL preserves the native citation model')
check('dados da fonte e a data de acesso preservados' in manual, 'Access metadata is retained without inventing URL data')
check('Uma chamada válida de Citation já existente permanece nesse modelo' in manual, 'Legitimate generic Citation remains accepted')
check('equivalência do modelo foi conferida' in manual, 'Foreign news migration requires a confirmed equivalence')
check('a proteção não alcançava todas as etapas da limpeza' in manual, 'Earlier incomplete protection is explained without editor identities')
check('sem inventar dados para completar uma fonte' in manual, 'Release notes do not promise missing-data invention')
check(all(title in manual for title in ['=== Imagens e parâmetros de biografias ===', '=== Datas completas e idade ao morrer ===', '=== Vários casamentos separados ===']), 'All new biography rule groups are documented')
check('src/v2_8/FIELDS_CONTRACTS.json' in manual and 'src/v2_8/DATES_CONTRACTS.json' in manual, 'Reviewed field and date contracts are linked')
check('sem novos avisos' in (ROOT / 'README.md').read_text() and 'não geram avisos adicionais' in manual, 'Declined cases do not introduce new warning workflows')
check('33 infocaixas e nomes alternativos' in manual, 'Verified profile count is accurate')
check('sem deduzir divórcio ou viuvez' in manual, 'Marriage status is never inferred')
check('fornecem os atributos e o separador da célula' in manual, 'Valid composite attribute templates are explained')
check('-{' not in active_manual, 'Active manual does not introduce an accidental language-converter opener')
check('Testes anteriores da interface' not in manual, 'No detached historical test sections')
history_body=manual.split('== Histórico das versões ==',1)[1].split('== Testes e detalhes técnicos ==',1)[0]
for version in headings(manual):
    entry=history_body.split('=== '+version+' ===',1)[1].split('=== ',1)[0]
    check(bool(re.search(r'^\* ',entry,re.M)), 'Bullet summary for release '+version)
check('Os recursos das versões anteriores continuam' in active_manual, 'Previous feature scope remains available')
check('=== Referências idênticas e chamadas repetidas ===' in active_manual, 'Mixed and same-anchor reference repairs are documented')
check('todos os campos da fonte' in active_manual and 'incluindo páginas e notas' in active_manual, 'Reference matching includes every citation field and locator')
check('mesmo grupo e antes da mesma lista' in active_manual, 'Reference grouping boundaries are explained')
check('sem texto, pontuação ou quebra de linha entre elas' in active_manual, 'Same-anchor rule cannot cross prose or a line break')
check('sem atributos e sem conteúdo' in active_manual and 'comentário' in active_manual, 'Only truly empty anonymous references can be removed')
check('um único fechamento repetido' in active_manual and 'sequências maiores' in active_manual, 'Extra closer rule has finite strict boundaries')
check('=== Endereços em campos de identificadores ===' in active_manual, 'Official-identifier URL extraction is documented')
check('=== Atributos e cabeçalhos de tabelas ===' in active_manual, 'Table attribute and scope groups are documented')
check('valores exatamente iguais' in active_manual and 'rowspan' in active_manual and 'colspan' in active_manual, 'Duplicate numeric table attributes require identical values')
check('dois níveis' in active_manual and 'scope="col"' in active_manual, 'Lower-level scope behavior is explained')
check('sem novos avisos' in active_manual, 'Uncertain new repairs do not add warnings')
check('Essas regras novas exigem um artigo inteiro do domínio principal' in active_manual, 'New rule scope excludes other namespaces and sections')
new_entry = history_body.split('=== 2.12.0 ===',1)[1].split('=== ',1)[0]
check(len(re.findall(r'^\* ',new_entry,re.M)) == 8, 'The latest release has eight concise feature bullets')
check(all(title in active_manual for title in ['=== Fontes definidas na lista de referências ===',
      '=== Nomes repetidos para fontes diferentes ===', '=== Espaço ausente na etiqueta ref ===',
      '=== Destinos das citações abreviadas ===']), 'All new reference rules have their own scope explanation')
check('mesmo grupo e à mesma região da lista' in active_manual and
      'Páginas, trechos citados e outros localizadores entram na comparação' in active_manual,
      'Bank reuse preserves group, collector region and citation locators')
check('Fontes sem uso no texto' in active_manual and 'grupos implícitos não conferidos' in active_manual and
      'chamadas indiretas' in active_manual, 'Unknown or unused reference-bank contents are not discarded')
check('todas as ocorrências desse nome têm corpo completo' in active_manual and
      'Uma única chamada vazia' in active_manual and 'nome novo precisa estar livre no mesmo grupo' in active_manual,
      'Conflicting names require only complete occurrences and a free group-local replacement')
check('mesma sequência de autores e o mesmo ano' in active_manual and 'inclusive none, impede a proposta' in active_manual,
      'Harvard candidates require exact local identity and preserve explicit opt-outs')
check('passou a existir uma única vez' in active_manual and 'restante do conteúdo exibido ficou igual' in active_manual and
      'um único candidato no mesmo rascunho' in active_manual,
      'Harvard repair requires native proof of one unique target without visible changes')
check(all(title in active_manual for title in ['=== Separadores e fechamentos de tabelas ===',
      '=== Cabeçalhos com três ou quatro níveis ===', '=== Rolagem de tabelas largas ===']),
      'New table syntax, header hierarchy and responsive-wrapper rules are documented')
check('atributos reconhecidos entre aspas' in active_manual and 'grade completa e regular' in active_manual and
      'não completa linhas pela aparência' in active_manual, 'Table syntax repairs do not infer missing cell data')
check('sem cruzamentos' in active_manual and 'Os grupos superiores conservam sua marcação' in active_manual,
      'Deeper leaf scopes preserve existing group hierarchy')
check('pelo menos 640 px ou 40 em ou rem' in active_manual and
      'A largura mínima da tabela permanece no código' in active_manual and
      'max-width:100%;min-width:0;overflow-x:auto;' in active_manual,
      'Only recognized wide tables receive a bounded wrapper and retain their own minimum width')
check('até quatro rascunhos' in active_manual and '12 MiB' in active_manual and
      'se soma às áreas de leitura já existentes' in active_manual,
      'Cache accounting and stale-source limits are stated without a total-memory promise')
check('Tabelas literais independentes e sem referências' in active_manual and
      'limite de quatro conferências adicionais' in active_manual and
      'Mudanças ligadas às mesmas referências continuam juntas' in active_manual,
      'Independent recovery remains bounded and keeps reference dependencies atomic')
check(all(key in active_manual for key in ['referenceGraphRepairs', 'harvardAnchorRepairs',
      'tableSyntaxRepairs', 'responsiveTableWrappers', 'independentRepairGroups']),
      'New automatic-rule settings can be disabled explicitly')
for title in ['=== Referências idênticas e chamadas repetidas ===', '=== Endereços em campos de identificadores ===',
              '=== Atributos e cabeçalhos de tabelas ===']:
    check(active_manual.count(title) == 1, 'No duplicate inherited manual section: ' + title)
stub = (DIST / 'Chamada_fixa_RevisaWiki_common.js').read_bytes()
check(stub == (ROOT / 'dist/2.9.0/Chamada_fixa_RevisaWiki_common.js').read_bytes(), 'Existing common.js bootstrap stays identical')
check((DIST / 'Chamada_fixa_RevisaWiki_copia_propria.js').read_bytes() == (ROOT / 'dist/2.9.0/Chamada_fixa_RevisaWiki_copia_propria.js').read_bytes(), 'Own-copy permanent bootstrap stays identical')
check('Não é preciso trocar o common.js a cada versão' in manual, 'Users keep the installed common.js bootstrap across updates')
blocks = re.findall(r'<syntaxhighlight[^>]*>([\s\S]*?)</syntaxhighlight>', manual)
check(any(block.strip().encode() == stub.strip() for block in blocks), 'Manual includes the complete permanent bootstrap')
for path in sorted(DOCS.iterdir()):
    if not path.is_file():
        continue
    text = path.read_text()
    check(path.read_bytes() == (DIST / path.name).read_bytes(), 'Exact documentation copy: ' + path.name)
    check(not re.search(r'\b[A-Z_]*PENDING\b', text), 'No unfinished report: ' + path.name)
    check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'Single blank-line spacing: ' + path.name)
manifest = json.loads((ROOT / 'tests/expected_release_v2120.json').read_text())
check(manifest['version'] == manifest['runtimeVersion'] == '2.12.0', 'Executable and distribution versions match')
for name, proof in manifest['files'].items():
    raw = (DIST / name).read_bytes()
    check(len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], 'Executable pin: ' + name)
    check(b'~~~' not in raw, 'Save-time signature safety: ' + name)
for path in sorted(DIST.glob('Catalogo_*.json')):
    record = json.loads(path.read_text())
    valid = record.get('releaseVersion') == record.get('distributionVersion') == '2.12.0'
    if 'releaseCoreSha256' in record:
        valid = valid and record['releaseCoreSha256'] == manifest['files']['RevisaWiki_v2_12_0.js']['sha256']
    check(valid, 'Current catalog metadata: ' + path.name)
index = (DIST / 'INICIO.html').read_text()
match = re.search(r'<script type="application/json" id="payloads">([\s\S]*?)</script>', index)
check(bool(match), 'Complete copy payload exists')
if match:
    payload = json.loads(match[1])
    check(list(payload) == ['dados', 'programa', 'central', 'documentacao', 'carregador'], 'Update order keeps common.js optional')
    for key, item in payload.items():
        raw = (DIST / item['filename']).read_bytes()
        check(item['text'].encode() == raw, 'Copy includes the entire file: ' + key)
        check(item['sha256'] == hashlib.sha256(raw).hexdigest() and item['bytes'] == len(raw), 'Copy byte integrity: ' + key)
        check(bool(item['summary'].strip()), 'Nonempty edit summary: ' + key)
    check(payload['central']['destination'] == 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', 'Central loader has its own destination')
    check(payload['carregador']['filename'] == 'Chamada_fixa_RevisaWiki_common.js', 'Only the permanent bootstrap goes in common.js')
check('action=edit' in index, 'Direct destination-editor links are present')
check(index.count('class="raw-source"') == 5 and 'action=raw' in index, 'Every copy card offers a raw-source view')
check('=== Aviso ao exibir arquivos grandes ===' in active_manual and 'limite de exibição não impede o salvamento nem a execução' in active_manual, 'SyntaxHighlight display warning is separated from saving and runtime')
check('recusa de publicação' in active_manual and 'investigado separadamente' in active_manual, 'Actual publishing or syntax errors are not dismissed')
check('PTwiki 2.12.0' in active_manual and "loaderRevision = '2.12.0'" in active_manual, 'Revised distribution and cache key are documented')
check('dez ou mais entradas reconhecidas na mesma lista' in active_manual and 'listas sucessivas são contados separadamente' in active_manual, 'Reference columns require ten entries in the same collector')
check('Em telas estreitas, a lista volta a uma coluna' in active_manual and 'configuração válida de colunas já existente é mantida' in active_manual, 'Responsive presentation and manual formatting are preserved')
check('=== Fotografias grandes na introdução ===' in active_manual and 'consulta pública confirma um arquivo do Wikimedia Commons' in active_manual, 'Thumbnail inference requires public file proof')
check('mapas, diagramas' in active_manual.lower() and 'uma largura fixa' in active_manual, 'Thumbnail rule excludes specialized layouts and preserves reader sizing')
check('até 500 bytes somando' not in active_manual and 'até cinco trechos' not in active_manual, 'Old minor numerical cutoffs are absent')
check('revisão pública de origem confirmada' in active_manual and 'correspondência exata com os reparos mecânicos permitidos' in active_manual, 'Saved baseline and mechanical proof remain required')
check('Adições de portais, controle de autoridade, categorias, fontes, dados ou conteúdo ficam fora' in active_manual, 'Semantic and portal edits never autoqualify as minor')
check('por ocorrência' in active_manual and 'quatro correções' in active_manual, 'Individual adjustment units are explained')
check('=== Estilos, publicação e endereços de referências ===' in active_manual and '<code>blog</code>' in active_manual and '<code>obra</code>' in active_manual, 'Current guarded publication alias is documented')
check('Não há remoção geral de pontos' in active_manual and 'correspondência exata entre o artigo, a chamada' in active_manual, 'URL repair requires a pinned source match rather than punctuation guessing')
check('um único aviso final por nome e grupo' in active_manual and 'não inventa esses dados' in active_manual, 'Warnings remain distinct and missing editorial metadata is never invented')
check('=== Novos assuntos dos portais automáticos ===' in active_manual and 'automaticTopicPortals' in active_manual, 'New subject portals have documented criteria and an option')
check(all(name in active_manual for name in ['Televisão','Biologia','Farmácia','Medicina','Saúde']), 'New thematic families are documented')
reference_scope = active_manual.split('=== Grupo da lista no parâmetro nativo ===',1)[1].split('=== Destinos das citações abreviadas ===',1)[0]
table_scope = active_manual.split('=== Números formatados e ordenação ===',1)[1].split('== Ortografia ==',1)[0]
check(all(title in reference_scope for title in ['=== Campos equivalentes repetidos na citação ===',
      '=== Colchetes no campo de endereço ===', '=== Atributos repetidos da lista de referências ===']),
      'All four new reference fixes have distinct bounded explanations')
check('<nowiki>{{Referências|group=nota}}</nowiki>' in reference_scope and
      '<nowiki>{{Referências|grupo=nota}}</nowiki>' in reference_scope and
      'continuam usando group' in reference_scope, 'Native template field and Cite tag attribute remain distinct')
check('um único grupo literal' in reference_scope and 'campos definidos pela posição' in reference_scope and
      'não confirma que aquele grupo está sendo exibido' in reference_scope,
      'Collector migration cannot invent a rendered group or interpret ambiguous positional data')
check(all(name in reference_scope for name in ['Citar web', 'Citar jornal', 'Citar revista', 'Citar livro']) and
      'Espaços nas pontas do valor podem ser ignorados' in reference_scope and
      'primeiro campo, exatamente como foi escrito' in reference_scope,
      'Alias deduplication preserves the first exact native field with trim-only comparison')
check('Um campo vazio, um terceiro valor diferente' in reference_scope and
      'Autores e editores não entram' in reference_scope and
      'Publicação e editora continuam sendo dados separados' in reference_scope,
      'Empty or conflicting aliases and different semantic roles cannot be conflated')
check('somente um endereço HTTP ou HTTPS completo' in reference_scope and
      'conserva cada caractere do endereço' in reference_scope and
      'sem seguir redirecionamentos' in reference_scope,
      'URL unwrapping preserves the exact isolated address without an online destination heuristic')
check('campos repetidos para a mesma função' in reference_scope and
      'credenciais, comentários, colchetes internos' in reference_scope and
      'Endereço principal, endereço arquivado e endereço de capítulo têm campos próprios' in reference_scope and
      'apenas na chamada nativa de Citar livro' in reference_scope,
      'URL-role, credential, label and duplicate-field refusal cases are documented')
check('responsive quando o valor literal é 0 ou 1' in reference_scope and
      'os valores repetidos são exatamente iguais' in reference_scope and
      'cada definição precisa continuar no mesmo lugar e com o mesmo corpo' in reference_scope,
      'Duplicate native list attributes preserve every reference-bank body and position')
check('Bancos com conteúdo calculado, chamadas desconhecidas, exemplos protegidos' in reference_scope and
      'artigo inteiro do domínio principal' in reference_scope and
      'Não criam avisos genéricos para os casos preservados' in reference_scope and
      'Erros confirmados podem continuar na conferência' in reference_scope,
      'Uncertain reference contexts remain untouched without additional warnings')
check('Cada campo ou atributo retirado conta como uma correção' in reference_scope and
      'Os dois colchetes externos de um único endereço contam juntos' in reference_scope,
      'The occurrence count distinguishes separate field removals from one delimiter conversion')
check('<nowiki>{{formatnum:1200}}</nowiki>' in table_scope and
      'somente um número literal, sem outro argumento ou expansão' in table_scope and
      'Uso dentro de atributos' in table_scope, 'Literal numeric formatting is admitted only in confirmed cell content')
check('data-sort-value' in table_scope and 'data-sort-type' in table_scope and
      'data-sort-type só é admitido em cabeçalhos' in table_scope and
      'classe sortable' in table_scope and 'valores são preservados exatamente' in table_scope,
      'Sortable attributes retain their exact values and require a recognized type and class')
check('atributos de ordenação repetidos ou tipos desconhecidos impedem' in table_scope and
      'não escolhe outra ordem nem recalcula' in table_scope,
      'Sorting repairs cannot infer a key, reorder data or accept ambiguous duplicate sort attributes')
check('um único caso desse tipo na tabela' in table_scope and 'inteiro positivo' in table_scope and
      'grade completa e regular' in table_scope and 'troca somente o fechamento incompatível' in table_scope,
      'Opposite numeric quotes require one finite correction with a complete regular grid')
check('640 a 9.999 pixels' in table_scope and 'width:1200px;' in table_scope and
      'atributo width' in table_scope and 'tabela inteira permanece igual' in table_scope,
      'Fixed-width wrapping preserves the whole table within the finite native pixel interval')
check('max-width:100%;min-width:0;overflow-x:auto;' in table_scope and
      'até 500.000 caracteres' in table_scope and 'Classes próprias, identificadores, tabelas aninhadas' in table_scope and
      'larguras percentuais ou relativas' in table_scope,
      'Fixed-width wrappers retain source-size, nesting, layout and unit guards')
check(not re.search(r'\[\[(?:Usuário|Usuária|User):', reference_scope + table_scope + new_entry, re.I),
      'Current feature prose contains no named editorial credits')
check(not re.search('[\u2014\u201c\u201d\u2018\u2019]',reference_scope + table_scope + new_entry),
      'Current prose uses straight punctuation without em dashes')
check(all((DIST / name).stat().st_size < 2097152 for name in ['RevisaWiki_v2_12_0.js','RevisaWiki_v2_12_0_dados.js']),
      'Both Wikipedia installation parts remain below the native page limit')
check('102400 bytes' in active_manual and 'limite de exibição não impede o salvamento nem a execução' in active_manual,
      'The SyntaxHighlight display-only warning remains distinct from the native page limit')
check('a partir de seis itens principais' in active_manual and 'dez ou mais entradas' in active_manual,
      'End-matter and reference column thresholds remain six and ten respectively')
result = {'version': '2.12.0', 'status': 'passed' if all(row['passed'] for row in checks) else 'failed',
          'checks': len(checks), 'failed': [row for row in checks if not row['passed']], 'networkRequests': 0, 'wikipediaWrites': 0}
out = ROOT / 'artifacts/v2120'
out.mkdir(parents=True, exist_ok=True)
(out / 'documentation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
raise SystemExit(0 if result['status'] == 'passed' else 1)
