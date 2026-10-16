"""Combine only completed test reports for the exact final 2.10.0 files."""
from pathlib import Path
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--offline-dir', type=Path, required=True)
parser.add_argument('--native-summary', type=Path, required=True)
parser.add_argument('--corpus-report', type=Path, required=True)
parser.add_argument('--performance-report', type=Path, required=True)
args = parser.parse_args()
manifest_path = ROOT / 'tests/expected_release_v2100.json'
manifest_bytes = manifest_path.read_bytes()
manifest = json.loads(manifest_bytes)
pin = hashlib.sha256(manifest_bytes).hexdigest()
assert manifest['version'] == manifest['runtimeVersion'] == '2.10.0'
sources = []


def read(path, status=True):
    raw = path.read_bytes()
    value = json.loads(raw)
    assert value['version'] == '2.10.0', path.name
    if status:
        assert value['status'] == 'passed', path.name
    assert value.get('failed', 0) == 0 and not value.get('failures'), path.name
    if 'frozenFiles' in value:
        assert value['frozenFiles'] == manifest['files'], path.name
    public_name = ('browser/NATIVE_BROWSER_SUMMARY.json' if path == args.native_summary else 'large_articles.json' if path == args.corpus_report else 'large_performance.json' if path == args.performance_report else path.name)
    sources.append({'report': public_name, 'originalFilename': path.name, 'sha256': hashlib.sha256(raw).hexdigest()})
    return value


offline = read(args.offline_dir / 'OFFLINE_QA_SUMMARY.json')
complex_cases = complex_checks = 0
for shard in range(4):
    value = read(args.offline_dir / ('complex-shard-' + str(shard) + '.json'))
    complex_cases += len(value['cases'])
    complex_checks += value['checks']
adapter = read(args.offline_dir / 'engine_complex_adapter.json', status=False)
assert adapter['results'] and all(row['exitCode'] == 0 for row in adapter['results'])
native = read(args.native_summary)
assert native['pinManifestSha256'] == pin
corpus = read(args.corpus_report)
assert corpus['releaseManifestSha256'] == pin
assert corpus['passed'] == corpus['articleCount'] == len(corpus['articles'])
assert corpus['networkAttempts'] == corpus['wikipediaWrites'] == 0
performance = read(args.performance_report)
assert performance['releaseManifestSha256'] == pin
assert performance['networkAttempts'] == performance['wikipediaWrites'] == 0
assert len(performance['rows']) == 10
timings = {}
for version in ['2.9.0', '2.10.0']:
    rows = [row for row in performance['rows'] if row['version'] == version]
    assert len(rows) == 5
    timings[version] = sum(row['coldMilliseconds'] for row in rows)
cold_change = (timings['2.10.0'] / timings['2.9.0'] - 1) * 100
assert cold_change > 0
performance_sentence = (f"Na comparação com a 2.9 em cinco artigos grandes, a primeira análise levou, somada, {cold_change:.1f}% a mais, e as repetições ficaram praticamente iguais. Esse ensaio não comprovou ganho geral de velocidade. ").replace(f'{cold_change:.1f}', f'{cold_change:.1f}'.replace('.', ','))
grammar = read(args.offline_dir / 'server_grammar.json', status=False)
render = read(ROOT / 'tests/v2100/NATIVE_BIRTH_CATEGORY_PROOF.json')
assert render['releaseManifestSha256'] == pin and render['realBiographyPairs'] >= 6 and render['categoryMembershipAndSortKeysUnchanged'] is True
assert render['wikipediaWrites'] == render['accountsUsed'] == 0
repairs = read(ROOT / 'tests/v2100/NATIVE_REPAIR_RENDER_PROOF.json')
assert repairs['releaseManifestSha256'] == pin and repairs['nativeComparisons'] >= 8
assert repairs['wikipediaWrites'] == repairs['accountsUsed'] == 0
structure = read(ROOT / 'tests/v2100/NATIVE_STRUCTURE_RENDER_PROOF.json')
assert structure['releaseManifestSha256'] == pin and structure['nativeComparisons'] == 10
assert structure['wikipediaWrites'] == structure['accountsUsed'] == 0
groups = [
    {'label': 'Motor, instalação, regressões e falsos positivos', 'cases': offline['cases'], 'checks': offline['checks']},
    {'label': 'Matriz de artigos complexos', 'cases': complex_cases, 'checks': complex_checks},
    {'label': 'Artigos grandes adicionais', 'cases': corpus['articleCount'], 'checks': corpus['checks']},
    {'label': 'Navegadores reais no macOS', 'cases': native['cases'], 'checks': native['checks']},
    {'label': 'Compatibilidade dos carregadores e proteção de assinatura', 'cases': grammar['cases'], 'checks': grammar['cases']},
    {'label': 'Categorização real na ptwiki, consultas anônimas de leitura', 'cases': render['cases'], 'checks': render['checks']},
    {'label': 'Reparos anteriores no MediaWiki, respostas anônimas conferidas', 'cases': repairs['nativeComparisons'], 'checks': repairs['checks']},
    {'label': 'Novos reparos no MediaWiki, exemplos sintéticos anônimos', 'cases': structure['nativeComparisons'], 'checks': structure['checks']},
    {'label': 'Medições em cinco artigos grandes, incluindo a versão anterior', 'cases': len(performance['rows']), 'checks': performance['checks']},
]
number = lambda value: format(value, ',').replace(',', '.')
summary = (
    f"Os arquivos finais da 2.10.0 passaram por {number(offline['cases'])} casos e {number(offline['checks'])} verificações na rodada principal. "
    f"A matriz de artigos complexos acrescentou {complex_cases} casos em 16 artigos de pelo menos 100 KB. "
    f"Outra rodada conferiu {corpus['articleCount']} artigos grandes nas duas distribuições. "
    f"Chrome, Firefox e Safari passaram por {native['cases']} fluxos locais, com {number(native['checks'])} verificações. "
    f"Os reparos tiveram ainda {repairs['nativeComparisons'] + structure['nativeComparisons']} comparações na renderização real da ptwiki. A matriz de telas e tamanhos de texto cobriu {native['responsiveGeometryCases']} cenários locais nos três navegadores. A categorização de nascimento conservou a mesma categoria e chave de ordenação após a retirada da linha redundante. "
    + performance_sentence + "As rodadas finais não tiveram falhas. Os relatórios e os hashes desta execução estão em tests/evidence/2.10.0. Nenhum teste editou a Wikipédia."
)
result = {'version': '2.10.0', 'status': 'passed', 'frozenFiles': manifest['files'],
          'releaseManifestSha256': pin, 'groups': groups, 'sourceReports': sources,
          'totalCases': sum(group['cases'] for group in groups),
          'totalChecks': sum(group['checks'] for group in groups),
          'portugueseSummary': summary, 'wikipediaWrites': 0}
out = ROOT / 'artifacts/v2100'
out.mkdir(parents=True, exist_ok=True)
(out / 'RELEASE_QA_SUMMARY.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
