"""Combine only completed test reports for the exact final 2.8.3 files."""
from pathlib import Path
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--offline-dir', type=Path, required=True)
parser.add_argument('--native-summary', type=Path, required=True)
parser.add_argument('--corpus-report', type=Path, required=True)
args = parser.parse_args()
manifest_path = ROOT / 'tests/expected_release_v283.json'
manifest_bytes = manifest_path.read_bytes()
manifest = json.loads(manifest_bytes)
pin = hashlib.sha256(manifest_bytes).hexdigest()
assert manifest['version'] == manifest['runtimeVersion'] == '2.8.3'
sources = []


def read(path, status=True):
    raw = path.read_bytes()
    value = json.loads(raw)
    assert value['version'] == '2.8.3', path.name
    if status:
        assert value['status'] == 'passed', path.name
    assert value.get('failed', 0) == 0 and not value.get('failures'), path.name
    if 'frozenFiles' in value:
        assert value['frozenFiles'] == manifest['files'], path.name
    public_name = ('browser/NATIVE_BROWSER_SUMMARY.json' if path == args.native_summary else 'large_articles.json' if path == args.corpus_report else path.name)
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
grammar = read(args.offline_dir / 'server_grammar.json', status=False)
render = read(ROOT / 'tests/v283/NATIVE_BIRTH_CATEGORY_PROOF.json')
assert render['releaseManifestSha256'] == pin and render['realBiographyPairs'] >= 6 and render['categoryMembershipAndSortKeysUnchanged'] is True
assert render['wikipediaWrites'] == render['accountsUsed'] == 0
groups = [
    {'label': 'Motor, instalação, regressões e falsos positivos', 'cases': offline['cases'], 'checks': offline['checks']},
    {'label': 'Matriz de artigos complexos', 'cases': complex_cases, 'checks': complex_checks},
    {'label': 'Artigos grandes adicionais', 'cases': corpus['articleCount'], 'checks': corpus['checks']},
    {'label': 'Navegadores reais no macOS', 'cases': native['cases'], 'checks': native['checks']},
    {'label': 'Compatibilidade dos carregadores e proteção de assinatura', 'cases': grammar['cases'], 'checks': grammar['cases']},
    {'label': 'Categorização real na ptwiki, consultas anônimas de leitura', 'cases': render['cases'], 'checks': render['checks']},
]
number = lambda value: format(value, ',').replace(',', '.')
summary = (
    f"Os arquivos finais da 2.8.3 passaram por {number(offline['cases'])} casos e {number(offline['checks'])} verificações na rodada principal. "
    f"A matriz de artigos complexos acrescentou {complex_cases} casos em 16 artigos de pelo menos 100 KB. "
    f"Outra rodada conferiu {corpus['articleCount']} artigos grandes nas duas distribuições. "
    f"Chrome, Firefox e Safari passaram por {native['cases']} fluxos locais, com {number(native['checks'])} verificações. "
    "A categorização de nascimento foi conferida também na renderização real da ptwiki, com a mesma categoria e chave de ordenação após a retirada da linha redundante. As rodadas finais não tiveram falhas. Os relatórios e os hashes desta execução estão em tests/evidence/2.8.3. Nenhum teste editou a Wikipédia."
)
result = {'version': '2.8.3', 'status': 'passed', 'frozenFiles': manifest['files'],
          'releaseManifestSha256': pin, 'groups': groups, 'sourceReports': sources,
          'totalCases': sum(group['cases'] for group in groups),
          'totalChecks': sum(group['checks'] for group in groups),
          'portugueseSummary': summary, 'wikipediaWrites': 0}
out = ROOT / 'artifacts/v283'
out.mkdir(parents=True, exist_ok=True)
(out / 'RELEASE_QA_SUMMARY.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
