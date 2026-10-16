"""Build RevisaWiki 2.11.0 from the immutable, tested 2.10.0 distribution."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'dist/2.10.0', ROOT / 'dist/2.11.0'


def patch_module(name):
    path = ROOT / 'src/v2_11' / (name + '_patch.py')
    spec = importlib.util.spec_from_file_location('v2110_' + name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Set REVISAWIKI_NODE or pass --node with a Node.js executable.')
    baseline = json.loads((ROOT / 'tests/expected_release_v2100.json').read_text())
    assert baseline['version'] == baseline['runtimeVersion'] == '2.10.0'
    patches = [patch_module(name) for name in ['portals', 'minor', 'count', 'ui', 'columns', 'image', 'distribution']]
    filenames = {name: name.replace('_v2_10_0', '_v2_11_0') for name in baseline['files']}
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, proof in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], name
        source = raw.decode('utf-8')
        if name.startswith('Carregador_'):
            old = "const loaderRevision = '2.10.0';"
            assert source.count(old) == 1
            source = source.replace(old, "const loaderRevision = '2.11.0-r2';", 1)
        if name in ['RevisaWiki_v2_10_0.js', 'RevisaWiki_v2_10_0_completo.js']:
            for patch in patches:
                source = patch.apply(source)
        source = source.replace('2.10.0', '2.11.0')
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
    for name in ['RevisaWiki_v2_11_0.js', 'RevisaWiki_v2_11_0_dados.js']:
        assert files[name]['bytes'] < 2097152, 'Install modular files.'
    for source in sorted(BASE.glob('Catalogo_*.json')):
        catalog = json.loads(source.read_text())
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.11.0'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_11_0.js']['sha256']
        destination = OUT / source.name.replace('_v2_10_0', '_v2_11_0')
        destination.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {'version': '2.11.0', 'runtimeVersion': '2.11.0', 'distributionRevision': '2.11.0-r2', 'baseVersion': baseline['version'],
              'revises': {'commit': 'f3afc7811f9de221342ea74820896b92764665c7',
                          'releaseManifestSha256': 'c7761126f9d4c5748c948e245736b5f28fd2fd241b17184a7c8c21880b773597'},
              'baseFiles': baseline['files'], 'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v2110.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'version': result['version'], 'files': files}, indent=2))


if __name__ == '__main__':
    main()
