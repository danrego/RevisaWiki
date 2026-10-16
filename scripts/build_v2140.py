"""Build RevisaWiki 2.14.0 from the immutable 2.13.0 distribution."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'dist/2.13.0', ROOT / 'dist/2.14.0'
BASE_PIN = '95fb16d2faace1f76b5ff02478659ef8ef3bf8f9203a3d4eb6454b32576eb7e3'
BASE_ARCHIVE_PIN = 'a3770351fe6bd3e899f0526e72ee6a110c38388ca1581ffebf1d2adffdb8f824'


def patch_module(name):
    path = ROOT / 'src/v2_14' / (name + '_patch.py')
    spec = importlib.util.spec_from_file_location('v2140_' + name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Set REVISAWIKI_NODE or pass --node with a Node.js executable.')
    baseline_path = ROOT / 'tests/expected_release_v2130.json'
    assert hashlib.sha256(baseline_path.read_bytes()).hexdigest() == BASE_PIN
    baseline = json.loads(baseline_path.read_text())
    assert baseline['version'] == baseline['runtimeVersion'] == baseline['distributionRevision'] == '2.13.0'
    patches = [patch_module(name) for name in ['quote', 'nsrw', 'drug', 'spacing', 'ui_report']]
    filenames = {name: name.replace('_v2_13_0', '_v2_14_0') for name in baseline['files']}
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, proof in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], name
        source = raw.decode('utf-8')
        if name in ['RevisaWiki_v2_13_0.js', 'RevisaWiki_v2_13_0_completo.js']:
            for patch in patches:
                source = patch.apply(source)
            prior_note = (' *\n * A versão 2.13 corrige mais erros de atributos de tabelas e de\n'
                          ' * campos e etiquetas de referências. As mudanças preservam as fontes e\n'
                          ' * os valores das células, com comparação e opção de desfazer.\n')
            assert source.count(prior_note) == 1
            source = source.replace(prior_note,
                ' *\n * A versão 2.14 corrige campos importados em chamadas reconhecidas\n'
                ' * de medicamentos e substâncias químicas, além de citações e caixas\n'
                ' * de citação. Também reduz linhas vazias excedentes na prosa comum.\n'
                ' * Os ajustes conservam os valores e os trechos protegidos. O relatório\n'
                ' * reúne a revisão atual e usa Mostrar alterações do editor.\n', 1)
            old_controls = (' * As alterações ficam no rascunho,\n'
                            ' * com comparação, escolha das mudanças e opção de desfazer.\n')
            assert source.count(old_controls) == 1
            source = source.replace(old_controls,
                ' * As alterações ficam no rascunho, com opção de desfazer.\n'
                ' * A comparação usa o controle nativo Mostrar alterações do editor.\n', 1)
            old_count = (' * A versão 2.11 permite conferir as ocorrências na comparação, sem\n'
                         ' * apresentar tipos de ajuste ou blocos como quantidades de correções.\n')
            assert source.count(old_count) == 1
            source = source.replace(old_count,
                ' * A contagem individual não apresenta tipos de ajuste ou blocos\n'
                ' * do diff como quantidades de correções.\n', 1)
        source = source.replace('2.13.0', '2.14.0')
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
    for name in ['RevisaWiki_v2_14_0.js', 'RevisaWiki_v2_14_0_dados.js']:
        assert files[name]['bytes'] < 2097152, 'Install modular files.'
    archive_bytes = (BASE / 'ARQUIVOS.json').read_bytes()
    assert hashlib.sha256(archive_bytes).hexdigest() == BASE_ARCHIVE_PIN
    archived_files = json.loads(archive_bytes)['files']
    for source in sorted(BASE.glob('Catalogo_*.json')):
        raw = source.read_bytes()
        proof = archived_files[source.name]
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], source.name
        catalog = json.loads(source.read_text())
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.14.0'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_14_0.js']['sha256']
        destination = OUT / source.name.replace('_v2_13_0', '_v2_14_0')
        destination.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {'version': '2.14.0', 'runtimeVersion': '2.14.0', 'distributionRevision': '2.14.0',
              'baseVersion': baseline['version'], 'baseDistributionRevision': baseline['distributionRevision'],
              'baseManifestSha256': BASE_PIN, 'baseFiles': baseline['files'],
              'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v2140.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'version': result['version'], 'files': files}, indent=2))


if __name__ == '__main__':
    main()
