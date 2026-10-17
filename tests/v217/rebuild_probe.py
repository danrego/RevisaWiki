"""Rebuild in a disposable tree and compare exact release bytes without changing current files."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
HELPERS = ['reference_tables.js', 'infobox_values.js', 'integration.js', 'quiet_report.js']
PATCHES = ['reference_tables_patch.py', 'quiet_report_patch.py']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def oldids(value):
    if isinstance(value, dict):
        return ([value['oldid']] if 'oldid' in value else []) + [item for member in value.values() for item in oldids(member)]
    if isinstance(value, list):
        return [item for member in value for item in oldids(member)]
    return []


def run(node, output):
    raw = (ROOT / 'tests/expected_release_v2170.json').read_bytes()
    manifest = json.loads(raw)
    baseline_raw = (ROOT / 'tests/expected_release_v2160.json').read_bytes()
    baseline = json.loads(baseline_raw)
    baseline_files = [ROOT / 'dist/2.16.0' / name for name in baseline['files']]
    baseline_files += [ROOT / 'dist/2.16.0/ARQUIVOS.json']
    baseline_files += sorted((ROOT / 'dist/2.16.0').glob('Catalogo_*.json'))
    inputs = [ROOT / 'scripts/build_v2170.py', ROOT / 'tests/expected_release_v2160.json'] + baseline_files
    inputs += [ROOT / 'src/v2_17' / name for name in HELPERS + PATCHES]
    current = [ROOT / 'dist/2.17.0' / name for name in manifest['files']]
    current += sorted((ROOT / 'dist/2.17.0').glob('Catalogo_*.json'))
    snapshot = {path: sha(path.read_bytes()) for path in set(inputs + current + [ROOT / 'tests/expected_release_v2170.json'])}
    checks = 0

    def expect(condition, label):
        nonlocal checks
        checks += 1
        if not condition:
            raise ValueError(label)

    expect(manifest['version'] == '2.17.0' and baseline['version'] == '2.16.0', 'The manifests identify the exact current and preceding versions')
    expect(manifest['baseManifestSha256'] == sha(baseline_raw), 'The current release binds the exact preceding manifest')
    expect(len(manifest['files']) == len(baseline['files']) == 7, 'Both releases contain the seven required executable files')
    result = {
        'version': '2.17.0', 'kind': 'independent-isolated-reproducible-build',
        'runnerSha256': sha(Path(__file__).read_bytes()), 'status': 'running',
        'isolation': 'fresh temporary directory containing only required baseline files, helper sources, patch modules, build script and baseline manifest',
        'command': 'python3 scripts/build_v2170.py --node <node-runtime>',
        'runtimeFiles': [], 'catalogs': [], 'helperEmbedding': [],
        'patchModules': [{'file': 'src/v2_17/' + name, 'sha256': sha((ROOT / 'src/v2_17' / name).read_bytes())} for name in PATCHES],
        'inputFiles': [{'file': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes())} for path in inputs],
        'wikipediaWrites': 0, 'networkRequests': 0, 'currentRuntimeWrites': 0,
    }
    with tempfile.TemporaryDirectory(prefix='revisawiki-rebuild-') as directory:
        tree = Path(directory)
        for path in inputs:
            target = tree / path.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, target)
        (tree / 'tests').mkdir(exist_ok=True)
        build = subprocess.run([sys.executable, 'scripts/build_v2170.py', '--node', str(node)], cwd=tree, capture_output=True, check=False)
        expect(build.returncode == 0, 'Isolated build failed')
        result['builderStdoutSha256'] = sha(build.stdout)
        expect(not build.stderr, 'Isolated build produced unexpected error output')
        rebuilt_manifest = (tree / 'tests/expected_release_v2170.json').read_bytes()
        expect(rebuilt_manifest == raw, 'Rebuilt manifest differs from the current release')
        result['manifestSha256'] = sha(raw)
        for name, pin in manifest['files'].items():
            actual = (ROOT / 'dist/2.17.0' / name).read_bytes()
            rebuilt = (tree / 'dist/2.17.0' / name).read_bytes()
            expect(len(actual) == pin['bytes'], 'Current executable byte count differs from the manifest')
            expect(sha(actual) == pin['sha256'], 'Current executable hash differs from the manifest')
            expect(rebuilt == actual, 'Rebuilt executable differs from current bytes')
            if name.startswith('Chamada_fixa_'):
                expect(actual == (ROOT / 'dist/2.16.0' / name).read_bytes(), 'A permanent bootstrap differs from the preceding release')
            result['runtimeFiles'].append({'file': name, 'bytes': len(rebuilt), 'sha256': sha(rebuilt), 'byteIdentical': True})
        catalogs = sorted((ROOT / 'dist/2.17.0').glob('Catalogo_*.json'))
        expected_catalogs = {path.name.replace('_v2_16_0', '_v2_17_0') for path in (ROOT / 'dist/2.16.0').glob('Catalogo_*.json')}
        expect({path.name for path in catalogs} == expected_catalogs and len(expected_catalogs) == 8, 'Catalog inventory differs from the eight preceding catalogs')
        for path in catalogs:
            rebuilt = (tree / 'dist/2.17.0' / path.name).read_bytes()
            actual = path.read_bytes()
            expect(rebuilt == actual, 'Rebuilt catalog differs from the current catalog')
            original = json.loads((ROOT / 'dist/2.16.0' / path.name.replace('_v2_17_0', '_v2_16_0')).read_bytes())
            expected = {**original, 'releaseVersion': '2.17.0', 'distributionVersion': '2.17.0'}
            if 'releaseCoreSha256' in expected:
                expected['releaseCoreSha256'] = manifest['files']['RevisaWiki_v2_17_0.js']['sha256']
            expected_bytes = (json.dumps(expected, ensure_ascii=False, indent=2) + '\n').encode()
            expect(actual == expected_bytes, 'A catalog changed beyond the permitted distribution labels and release hash')
            expect(oldids(json.loads(actual)) == oldids(original), 'A native catalog contract revision changed')
            result['catalogs'].append({'file': path.name, 'bytes': len(rebuilt), 'sha256': sha(rebuilt),
                                       'byteIdentical': True, 'nativeOldidCount': len(oldids(original)), 'nativeOldidsPreserved': True})
        for bundle in ['RevisaWiki_v2_17_0.js', 'RevisaWiki_v2_17_0_completo.js']:
            data = (tree / 'dist/2.17.0' / bundle).read_bytes()
            for name in HELPERS:
                original_helper = (ROOT / 'src/v2_17' / name).read_bytes()
                helper = original_helper.replace(b'2.16.0', b'2.17.0')
                occurrences = data.count(helper)
                expect(occurrences == 1, 'A complete helper source is absent or repeated in the actual executable')
                item = {'bundle': bundle, 'source': 'src/v2_17/' + name, 'sha256': sha(original_helper),
                        'embeddedSha256': sha(helper), 'versionLabelSubstitutions': [['2.16.0', '2.17.0']] if helper != original_helper else [],
                        'occurrences': occurrences}
                if name == 'infobox_values.js':
                    source_contract = re.search(rb'V217_INFOBOX_VALUE_CONTRACTS=Object.freeze\((\{[^\n]+\})\);', original_helper)
                    embedded_contract = re.search(rb'V217_INFOBOX_VALUE_CONTRACTS=Object.freeze\((\{[^\n]+\})\);', helper)
                    expect(source_contract is not None and embedded_contract is not None, 'The reviewed infobox contract is not literal')
                    source_contract = json.loads(source_contract[1])
                    expect(json.loads(embedded_contract[1]) == source_contract, 'An embedded native infobox contract changed')
                    expect(len(source_contract) == 6, 'The embedded runtime contains exactly six reviewed native infobox definitions')
                    item.update(nativeContractOldids=sorted(int(key) for key in source_contract), nativeContractsPreserved=True)
                result['helperEmbedding'].append(item)
    result['temporaryDirectoryRemoved'] = not Path(directory).exists()
    expect(result['temporaryDirectoryRemoved'], 'Disposable build directory was not removed')
    for path, digest in snapshot.items():
        expect(sha(path.read_bytes()) == digest, 'A build input or the current release changed during isolated verification')
    result.update(status='passed', checks=checks)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'checks': checks, 'runtimeFiles': len(result['runtimeFiles']),
                      'catalogs': len(result['catalogs']), 'manifestSha256': result['manifestSha256']}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--node', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'artifacts/v2170/rebuild.json')
    args = parser.parse_args()
    run(args.node, args.output)
