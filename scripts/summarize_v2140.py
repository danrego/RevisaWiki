"""Summarize only completed tests of the exact 2.14.0 executable files."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/v2140'
raw = (ROOT / 'tests/expected_release_v2140.json').read_bytes()
manifest = json.loads(raw)
pin = hashlib.sha256(raw).hexdigest()
groups, reports = [], []
runtime_hashes = {proof['sha256'] for proof in manifest['files'].values()}


def add(relative, label, cases=None):
    path = OUT / relative
    data = path.read_bytes()
    value = json.loads(data)
    assert value.get('status', 'passed') == 'passed' and not value.get('failed') and not value.get('failures'), relative
    assert value.get('version', '2.14.0') == '2.14.0', relative
    if 'frozenFiles' in value:
        assert value['frozenFiles'] == manifest['files'], relative
    for key in ['releaseManifestSha256', 'pinManifestSha256']:
        if key in value:
            assert value[key] == pin, relative
    for key in ['runtimeSha256', 'bundleSha256', 'candidateSha256']:
        if key in value:
            assert value[key] in runtime_hashes, relative
    for bundle in value.get('bundles', []):
        assert bundle['version'] == '2.14.0' and bundle['sha256'] == manifest['files'][bundle['file']]['sha256']
    amount = cases(value) if cases else value.get('cases', value.get('tests', 0))
    amount = len(amount) if isinstance(amount, list) else amount
    checks = value.get('checks', value.get('assertions', 0))
    assert isinstance(amount, int) and isinstance(checks, int) and amount > 0 and checks > 0, relative
    groups.append({'label': label, 'cases': amount, 'checks': checks})
    reports.append({'report': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(data).hexdigest()})
    return value


main = add('final_main/OFFLINE_QA_SUMMARY.json', 'Motor, instalação, regressões e falsos positivos')
complex_cases = complex_checks = 0
for index in range(4):
    path = OUT / ('final_main/complex-shard-' + str(index) + '.json')
    data, value = path.read_bytes(), json.loads(path.read_text())
    assert value['version'] == '2.14.0' and value['status'] == 'passed' and not value['failures']
    assert value['frozenFiles'] == manifest['files']
    complex_cases += len(value['cases'])
    complex_checks += value['checks']
    reports.append({'report': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(data).hexdigest()})
assert complex_cases == 128
groups.append({'label': 'Matriz de artigos complexos', 'cases': complex_cases, 'checks': complex_checks})
large = add('large-corpus/final_v2140/public_report.json', 'Artigos grandes nas duas distribuições', lambda value: value['articleCount'])
assert large['passed'] == large['articleCount'] and not large['networkAttempts']
browser = add('native_browser/NATIVE_BROWSER_SUMMARY.json', 'Interface nativa e imagens em três navegadores reais')
assert browser['imagesIncluded'] and browser['actualWikipediaWrites'] == browser['remoteNetworkRequests'] == 0
assert browser['nativeDiffClickStub'] and not browser['nativeRemoteDiffRenderingTested']
for name, label in [('quote_alignment', 'Alinhamento de caixas de citação'), ('prose_spacing', 'Linhas vazias e composição'),
                    ('spacing_independent', 'Conferência independente do espaçamento'), ('quote_native', 'Alinhamento, projeções nativas guardadas'),
                    ('spacing_native', 'Parágrafos e espaços, projeções nativas guardadas'), ('nsrw_native_parser', 'Citação enciclopédica, projeções nativas guardadas')]:
    add('final_focused/' + name + '.json', label)
for bundle in ['modular', 'complete']:
    for name, label in [('nsrw_native_citation', 'Adaptação enciclopédica'), ('drug_fields', 'Código ATC adicional'),
                        ('drug_import_fields', 'Campos químicos e farmacológicos em quatro idiomas'), ('drug_composition_case', 'Composição química e variantes de maiúsculas'), ('drug_native', 'Infocaixas, projeções nativas guardadas'),
                        ('ui_report', 'Identidade e organização dos avisos')]:
        add('final_focused/' + bundle + '/' + name + '.json', label + ', ' + bundle)
for name in ['chrome', 'firefox', 'safari']:
    for folder, label in [('final_ui_browser', 'Relatório e controles nativos'), ('final_fixes_browser', 'Reparos no editor com Worker')]:
        value = add(folder + '/' + name + '.json', label + ', ' + name)
        assert value['wikipediaWrites'] == value['networkMutations'] == value['clipboardWrites'] == value['screenshots'] == 0
        assert value['cleanup']['ownSessionClosed'] and value['cleanup']['ownProcessExited'] and value['cleanup']['ownProfileRemoved']
        assert not value['cleanup']['unknownSessionsTouched']
performance = add('final_performance/large_performance.json', 'Medições nas duas versões em cinco artigos grandes', lambda value: len(value['rows']))
compatibility = {}
for name in ['native_plan_bridge', 'native_plan_bridge_selfchecks']:
    path = OUT / 'final_main' / (name + '.json')
    data = path.read_bytes()
    value = json.loads(data)
    assert value['status'] == 'passed' and value['version'] == '2.14.0'
    assert value['releaseManifestSha256'] == pin
    assert value['currentNodePlanSha256'] == '82751d531200a3c7cc7eead2bd7cb3140cfe291bb964920f8ae3c3c81f45c97e'
    if name == 'native_plan_bridge':
        assert value['contemporaneousNativeNodePlanSha256'] == '7e6b6cfa59445009256856f73796dea8821c7c375e8d69ab72fa2b21f410f2ac'
        assert value['nativeCoveragePlanSha256'] == 'ab452f08f68b9a748ce870602c6b481f20d5425e6fae5cddd45d7f32c1dc2f81'
        assert value['finiteNodeTransition']['allOtherOldEnvelopeBytesAuthenticated']
        assert not value['behavioralAssertionWaivers'] and not value['frozenSourceOrReportFilesModified']
        assert value['runtimeFilesVerified'] == 7 and value['historicalSourcesVerified'] == 466
    else:
        assert value['checks'] == 25
    proof = {'report': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(data).hexdigest()}
    reports.append(proof)
    compatibility[name] = proof
fmt = lambda number: format(number, ',').replace(',', '.')
focused = sum(group['cases'] for group in groups if group['label'] not in ['Motor, instalação, regressões e falsos positivos', 'Matriz de artigos complexos', 'Artigos grandes nas duas distribuições', 'Interface nativa e imagens em três navegadores reais', 'Medições nas duas versões em cinco artigos grandes'])
summary = (f"Os arquivos finais da 2.14.0 passaram por {fmt(main['cases'])} casos e {fmt(main['checks'])} verificações na rodada principal. "
    f"A matriz complexa acrescentou {complex_cases} casos em 16 artigos de pelo menos 100 KB. Outra rodada conferiu {large['articleCount']} artigos grandes nas duas distribuições. "
    f"Chrome, Firefox e Safari passaram por {browser['cases']} fluxos da interface e das imagens, com {fmt(browser['checks'])} verificações. "
    f"Os testes específicos dos reparos, do relatório e das projeções nativas somaram {fmt(focused)} casos adicionais. "
    "A comparação própria retirada não foi tratada como um recurso ainda testado. O inventário registra as asserções substituídas, e o atalho nativo foi conferido com cliques locais interceptados, sem carregar um diff remoto da Wikipédia. "
    "As expectativas positivas que mudaram pela regra de espaçamento têm diferenças literais registradas, sem mudar os arquivos históricos nem dispensar as verificações de conteúdo. "
    "As projeções nativas conferem os trechos afetados, incluindo fórmulas, identificadores, dados clínicos e espaçamento. Elas não equivalem à análise nativa de artigos inteiros. "
    "Os contratos e as respostas guardadas mantêm sua origem e seus hashes. Casos sintéticos e permutações não contam como artigos distintos. As rodadas finais não tiveram falhas. "
    "O ensaio comparativo mediu duas versões em cinco artigos grandes e não comprova um ganho geral de velocidade. Os resultados e os hashes ficam em tests/evidence/2.14.0. Nenhum teste editou a Wikipédia.")
qa = {'version': '2.14.0', 'status': 'passed', 'frozenFiles': manifest['files'], 'releaseManifestSha256': pin,
      'groups': groups, 'sourceReports': reports, 'totalCases': sum(group['cases'] for group in groups),
      'totalChecks': sum(group['checks'] for group in groups), 'portugueseSummary': summary,
      'nativeParentPlanCompatibility': compatibility, 'additionalProvenanceChecks': 25, 'wikipediaWrites': 0}
(OUT / 'RELEASE_QA_SUMMARY.json').write_text(json.dumps(qa, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': 'passed', 'version': '2.14.0', 'cases': qa['totalCases'], 'checks': qa['totalChecks']}, ensure_ascii=False))
