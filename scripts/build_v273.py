"""Build RevisaWiki 2.7.3 from the immutable, tested 2.7.2 distribution."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'dist/2.7.2', ROOT / 'dist/2.7.3'


def patch_module(name):
    path = ROOT / 'src/v2_7_3' / (name + '_patch.py')
    spec = importlib.util.spec_from_file_location('v273_' + name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Set REVISAWIKI_NODE or pass --node with a Node.js executable.')
    baseline = json.loads((ROOT / 'tests/expected_release_v272.json').read_text())
    assert baseline['version'] == baseline['runtimeVersion'] == '2.7.2'
    patches = [patch_module('marriage')]
    filenames = {name: name.replace('_v2_7_2', '_v2_7_3') for name in baseline['files']}
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, proof in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], name
        source = raw.decode('utf-8')
        if name in ['RevisaWiki_v2_7_2.js', 'RevisaWiki_v2_7_2_completo.js']:
            for patch in patches:
                source = patch.apply(source)
            anchor = ' * As limpezas de duplicação conferem infocaixas, portais, ordenação\n'
            assert source.count(anchor) == 1
            source = source.replace(anchor,
                ' * Formata dados explícitos de casamento em campos de cônjuge\n'
                ' * de infocaixas pessoais conferidas. Conserva nomes, datas\n'
                ' * e estados civis sem deduzir informações que não constem do texto.\n'
                ' *\n' + anchor)
        source = source.replace('2.7.2', '2.7.3')
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
    for name in ['RevisaWiki_v2_7_3.js', 'RevisaWiki_v2_7_3_dados.js']:
        assert files[name]['bytes'] < 2097152, 'Install modular files.'
    for source in sorted(BASE.glob('Catalogo_*.json')):
        catalog = json.loads(source.read_text())
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.7.3'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_7_3.js']['sha256']
        destination = OUT / source.name.replace('_v2_7_2', '_v2_7_3')
        destination.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {'version': '2.7.3', 'runtimeVersion': '2.7.3', 'baseVersion': baseline['version'],
              'baseFiles': baseline['files'], 'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v273.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'version': result['version'], 'files': files}, indent=2))


if __name__ == '__main__':
    main()
