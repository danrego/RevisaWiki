"""Build RevisaWiki 2.7.0 from the pinned 2.6.2 distribution."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'dist/2.6.2', ROOT / 'dist/2.7.0'


def patch_module(name):
    path = ROOT / 'src/v2_7' / (name + '_patch.py')
    spec = importlib.util.spec_from_file_location('v270_' + name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Set REVISAWIKI_NODE or pass --node with a Node.js executable.')
    baseline = json.loads((ROOT / 'tests/expected_release_v262.json').read_text())
    assert baseline['version'] == '2.6.2'
    patches = [patch_module('safe_automation'), patch_module('diff_reporting'), patch_module('chat_residues')]
    section_buttons = patch_module('section_buttons')
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, proof in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], name
        text = raw.decode('utf-8')
        if name in ['RevisaWiki_v2_6_2.js', 'RevisaWiki_v2_6_2_completo.js']:
            for patch in patches:
                text = patch.apply(text)
            text = section_buttons.apply_core(text)
            anchor = ' * Editar aqui abre uma seção na página de leitura, com resumo, prévia\n'
            assert text.count(anchor) == 1
            start, end = text.index(anchor), text.index(' * Há regras de código para inglês,', text.index(anchor))
            text = text[:start] + (
                ' * As limpezas de duplicação conferem infocaixas, portais, ordenação\n'
                ' * de categorias e referências nomeadas. A comparação separa mudanças\n'
                ' * locais em artigos extensos, e o resultado informa os tipos de\n'
                ' * ajuste mantidos no texto, sem contar blocos como correções.\n *\n'
                ' * Também retira cercas externas de Markdown e marcas exatas de\n'
                ' * citações exportadas por chat, preservando nomes e exemplos.\n *\n'
                ' * O painel funciona no editor de código-fonte. Os botões adicionais\n'
                ' * Editar aqui foram retirados das seções. A publicação usa os\n'
                ' * controles do editor da Wikipédia e depende da ação do editor.\n *\n'
            ) + text[end:]
        elif name.startswith('Carregador_'):
            text = section_buttons.apply_loader(text)
        text = text.replace('2.6.2', '2.7.0').replace('_v2_6_2', '_v2_7')
        destination = OUT / name.replace('_v2_6_2', '_v2_7')
        destination.write_text(text)
        subprocess.run([args.node, '--check', str(destination)], check=True)
        emitted = destination.read_bytes()
        assert b'~~~' not in emitted, 'Literal save-time signature trigger: ' + destination.name
        files[destination.name] = {'bytes': len(emitted), 'sha256': hashlib.sha256(emitted).hexdigest()}
    for name in ['RevisaWiki_v2_7.js', 'RevisaWiki_v2_7_dados.js']:
        assert files[name]['bytes'] < 2097152, 'Install modular files.'
    for source in sorted(BASE.glob('Catalogo_*.json')):
        catalog = json.loads(source.read_text())
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.7.0'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_7.js']['sha256']
        destination = OUT / source.name.replace('_v2_6_2', '_v2_7')
        destination.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {'version': '2.7.0', 'runtimeVersion': '2.7.0', 'baseVersion': baseline['version'],
              'baseFiles': baseline['files'], 'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v270.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'version': result['version'], 'files': files}, indent=2))


if __name__ == '__main__':
    main()
