"""Check the current manual, installation order and complete copy payloads."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS, DIST = ROOT / 'docs/2.8.3', ROOT / 'dist/2.8.3'
checks = []


def check(condition, name):
    checks.append({'name': name, 'passed': bool(condition)})


manual = (DOCS / 'Documentacao_RevisaWiki_v2_8_3.wiki').read_text()
previous = (ROOT / 'docs/2.8.2/Documentacao_RevisaWiki_v2_8_2.wiki').read_text()
headings = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
check(headings(manual) == ['2.8.3'] + headings(previous), 'Newest-first history retains previous releases')
check(manual.index('As versões aparecem da mais recente') < manual.index('=== 2.8.3 ==='), 'General history introduction precedes the newest release entry')
h2 = lambda text: re.findall(r'^== ([^=\n]+) ==$', text, re.M)
check(h2(manual) == h2(previous), 'All previous main manual sections remain in order')
historical = lambda text: text.split('=== 2.8.2 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
check(historical(manual) == historical(previous), 'Historical release content remains byte-identical')
check('Desde a 2.6.2, a leitura das aspas' in manual, 'Quotation boundary change keeps its historical version')
qa_paths = [ROOT / 'artifacts/v283/RELEASE_QA_SUMMARY.json',
            ROOT / 'artifacts/v283/release-test-summary.json',
            ROOT / 'tests/evidence/2.8.3/RELEASE_QA_SUMMARY.json']
qa_path = next((path for path in qa_paths if path.exists()), qa_paths[0])
qa = json.loads(qa_path.read_text())
check(qa['status'] == 'passed' and qa['version'] == '2.8.3', 'Only completed current-version QA is described')
current_manifest = json.loads((ROOT / 'tests/expected_release_v283.json').read_text())
check(qa['frozenFiles'] == current_manifest['files'], 'QA describes these exact executable files')
check(qa.get('failed',0) == 0 and not qa.get('failures'), 'Final QA has no unresolved failure')
check(qa['releaseManifestSha256'] == hashlib.sha256((ROOT / 'tests/expected_release_v283.json').read_bytes()).hexdigest(), 'QA binds the full current release manifest')
check(qa['portugueseSummary'] in manual, 'Manual includes the exact final QA summary')
test_report = (DOCS / 'Relatorio_testes_RevisaWiki_v2_8_3.txt').read_text()
check(all(group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações' in test_report for group in qa['groups']), 'Test report describes the actual final QA groups')
check((DOCS / 'LEIA_PRIMEIRO.txt').exists(), 'Quick-start guide remains available')
check('Ajustes aplicados\'\'\' informa quantos trechos mudaram' not in manual, 'Old misleading block-as-correction wording is absent')
active_manual = manual.split('== Histórico das versões ==', 1)[0]
check("O link '''Editar aqui''' fica nos controles de cada seção" not in active_manual, 'Removed section-button instructions are absent from active manual')
check("Os botões adicionais '''Editar aqui''' foram retirados na 2.7" in active_manual, 'Current manual explains section-button removal')
check('https://github.com/danrego/RevisaWiki' in manual, 'Repository is linked')
check('=== Nomes químicos e montagem da infocaixa ===' in manual, 'Inherited chemical repair and boundaries remain documented')
check('=== Aspas em atributos de células ===' in manual, 'Current table repair and quotation boundaries are documented')
check('=== Casamento em campos de cônjuge ===' in manual, 'Current explicit marriage conversion is documented')
check('=== Escolha do modelo da referência ===' in manual, 'Current citation-model preservation is documented')
check('=== Correção de referências de versões anteriores ===' in manual, 'Reviewed historical citation repair is documented')
check('O primeiro caso é o artigo NBC News' in manual, 'First registered repair page has an explicit scope')
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
check(native['status'] == 'passed' and native['version'] == '2.8.3' and
      native['frozenFiles'] == current_manifest['files'] and
      native['releaseManifestSha256'] == qa['releaseManifestSha256'] and
      native['realBiographyPairs'] >= 6 and
      native['categoryMembershipAndSortKeysUnchanged'] is True and
      native['wikipediaWrites'] == native['accountsUsed'] == 0,
      'Current native category proof binds these exact files and preserves categories and sorting')
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
check('2.8.2' in active_manual and 'Os recursos da 2.8.2 continuam' in active_manual, 'Previous feature scope remains correctly dated')
stub = (DIST / 'Chamada_fixa_RevisaWiki_common.js').read_bytes()
check(stub == (ROOT / 'dist/2.8.2/Chamada_fixa_RevisaWiki_common.js').read_bytes(), 'Existing common.js bootstrap stays identical')
check((DIST / 'Chamada_fixa_RevisaWiki_copia_propria.js').read_bytes() == (ROOT / 'dist/2.8.2/Chamada_fixa_RevisaWiki_copia_propria.js').read_bytes(), 'Own-copy permanent bootstrap stays identical')
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
manifest = json.loads((ROOT / 'tests/expected_release_v283.json').read_text())
check(manifest['version'] == manifest['runtimeVersion'] == '2.8.3', 'Executable and distribution versions match')
for name, proof in manifest['files'].items():
    raw = (DIST / name).read_bytes()
    check(len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], 'Executable pin: ' + name)
    check(b'~~~' not in raw, 'Save-time signature safety: ' + name)
for path in sorted(DIST.glob('Catalogo_*.json')):
    record = json.loads(path.read_text())
    valid = record.get('releaseVersion') == record.get('distributionVersion') == '2.8.3'
    if 'releaseCoreSha256' in record:
        valid = valid and record['releaseCoreSha256'] == manifest['files']['RevisaWiki_v2_8_3.js']['sha256']
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
result = {'version': '2.8.3', 'status': 'passed' if all(row['passed'] for row in checks) else 'failed',
          'checks': len(checks), 'failed': [row for row in checks if not row['passed']], 'networkRequests': 0, 'wikipediaWrites': 0}
out = ROOT / 'artifacts/v283'
out.mkdir(parents=True, exist_ok=True)
(out / 'documentation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
raise SystemExit(0 if result['status'] == 'passed' else 1)
