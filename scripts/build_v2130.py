"""Build RevisaWiki 2.13.0 from the immutable 2.12.0 distribution."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'dist/2.12.0', ROOT / 'dist/2.13.0'
BASE_PIN = 'd3f50b141ac5c41f4b915f65c62b7c935084c1ec4f998f0e030e7c87fdfa3983'
BASE_ARCHIVE_PIN = '255f206ed44b3cbf67db3a1118424154f8434dc2697f979228251df31cf691be'


def patch_module(name):
    path = ROOT / 'src/v2_13' / (name + '_patch.py')
    spec = importlib.util.spec_from_file_location('v2130_' + name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Set REVISAWIKI_NODE or pass --node with a Node.js executable.')
    baseline_path = ROOT / 'tests/expected_release_v2120.json'
    assert hashlib.sha256(baseline_path.read_bytes()).hexdigest() == BASE_PIN
    baseline = json.loads(baseline_path.read_text())
    assert baseline['version'] == baseline['runtimeVersion'] == baseline['distributionRevision'] == '2.12.0'
    patches = [patch_module(name) for name in ['reference', 'table']]
    filenames = {name: name.replace('_v2_12_0', '_v2_13_0') for name in baseline['files']}
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, proof in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], name
        source = raw.decode('utf-8')
        if name in ['RevisaWiki_v2_12_0.js', 'RevisaWiki_v2_12_0_completo.js']:
            for patch in patches:
                source = patch.apply(source)
            prior_note = (' *\n * Esta versão amplia os reparos de referências e tabelas. Conserva os\n'
                          ' * dados das fontes, os valores de ordenação e as chamadas numéricas\n'
                          ' * reconhecidas, com correções limitadas a estruturas conferidas.\n')
            assert source.count(prior_note) == 1
            source = source.replace(prior_note, '', 1)
            header = ' * RevisaWiki para a ptwiki, versão 2.12.0, 16 de outubro de 2026.\n'
            assert source.count(header) == 1
            source = source.replace(header, header +
                ' *\n * A versão 2.13 corrige mais erros de atributos de tabelas e de\n'
                ' * campos e etiquetas de referências. As mudanças preservam as fontes e\n'
                ' * os valores das células, com comparação e opção de desfazer.\n', 1)
        source = source.replace('2.12.0', '2.13.0')
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
    for name in ['RevisaWiki_v2_13_0.js', 'RevisaWiki_v2_13_0_dados.js']:
        assert files[name]['bytes'] < 2097152, 'Install modular files.'
    archive_bytes = (BASE / 'ARQUIVOS.json').read_bytes()
    assert hashlib.sha256(archive_bytes).hexdigest() == BASE_ARCHIVE_PIN
    archived_files = json.loads(archive_bytes)['files']
    for source in sorted(BASE.glob('Catalogo_*.json')):
        raw = source.read_bytes()
        proof = archived_files[source.name]
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], source.name
        catalog = json.loads(source.read_text())
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.13.0'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_13_0.js']['sha256']
        destination = OUT / source.name.replace('_v2_12_0', '_v2_13_0')
        destination.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {'version': '2.13.0', 'runtimeVersion': '2.13.0', 'distributionRevision': '2.13.0',
              'baseVersion': baseline['version'], 'baseDistributionRevision': baseline['distributionRevision'],
              'baseManifestSha256': BASE_PIN, 'baseFiles': baseline['files'],
              'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v2130.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'version': result['version'], 'files': files}, indent=2))


if __name__ == '__main__':
    main()
