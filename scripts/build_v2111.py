"""Build RevisaWiki 2.11.1 from the immutable 2.11.0 r2 distribution."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'dist/2.11.0', ROOT / 'dist/2.11.1'
BASE_PIN = '4817f492e57e660b0ba0b99b6f5d200c8172b464e3d825975c2ca445af776b36'
BASE_ARCHIVE_PIN = '0f54c58b620c90b934721621914a22ad85354d71447d1d6d39e9b18d4086b356'


def patch_module(name):
    path = ROOT / 'src/v2_11_1' / (name + '_patch.py')
    spec = importlib.util.spec_from_file_location('v2111_' + name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Set REVISAWIKI_NODE or pass --node with a Node.js executable.')
    baseline_path = ROOT / 'tests/expected_release_v2110.json'
    assert hashlib.sha256(baseline_path.read_bytes()).hexdigest() == BASE_PIN
    baseline = json.loads(baseline_path.read_text())
    assert baseline['version'] == baseline['runtimeVersion'] == '2.11.0'
    assert baseline['distributionRevision'] == '2.11.0-r2'
    patches = [patch_module(name) for name in ['graph', 'citation', 'warnings']]
    filenames = {name: name.replace('_v2_11_0', '_v2_11_1') for name in baseline['files']}
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, proof in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], name
        source = raw.decode('utf-8')
        if name in ['RevisaWiki_v2_11_0.js', 'RevisaWiki_v2_11_0_completo.js']:
            for patch in patches:
                source = patch.apply(source)
            for old, new in [
                ("'PTwiki ' + VERSION + ' · r2'", "'PTwiki ' + VERSION"),
                ("', distribuição r2. Catálogo: '", "'. Catálogo: '")
            ]:
                assert source.count(old) == 1, old
                source = source.replace(old, new, 1)
        source = source.replace('2.11.0-r2', '2.11.1').replace('2.11.0', '2.11.1')
        for old_name, new_name in filenames.items():
            source = source.replace(old_name, new_name)
        destination = OUT / filenames[name]
        destination.write_text(source)
        subprocess.run([args.node, '--check', str(destination)], check=True)
        emitted = destination.read_bytes()
        assert b'~~~' not in emitted, 'Literal save-time signature trigger: ' + destination.name
        if name.startswith('Chamada_fixa_'):
            assert emitted == raw, 'The permanent bootstrap must remain unchanged.'
        files[destination.name] = {'bytes': len(emitted), 'sha256': hashlib.sha256(emitted).hexdigest()}
    for name in ['RevisaWiki_v2_11_1.js', 'RevisaWiki_v2_11_1_dados.js']:
        assert files[name]['bytes'] < 2097152, 'Install modular files.'
    archive_bytes = (BASE / 'ARQUIVOS.json').read_bytes()
    assert hashlib.sha256(archive_bytes).hexdigest() == BASE_ARCHIVE_PIN
    archived_files = json.loads(archive_bytes)['files']
    for source in sorted(BASE.glob('Catalogo_*.json')):
        raw = source.read_bytes()
        proof = archived_files[source.name]
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], source.name
        catalog = json.loads(source.read_text())
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.11.1'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_11_1.js']['sha256']
        destination = OUT / source.name.replace('_v2_11_0', '_v2_11_1')
        destination.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {'version': '2.11.1', 'runtimeVersion': '2.11.1', 'distributionRevision': '2.11.1',
              'baseVersion': baseline['version'], 'baseDistributionRevision': baseline['distributionRevision'],
              'baseManifestSha256': BASE_PIN, 'baseFiles': baseline['files'],
              'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v2111.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'version': result['version'], 'files': files}, indent=2))


if __name__ == '__main__':
    main()
