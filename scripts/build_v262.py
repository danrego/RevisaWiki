"""Build RevisaWiki 2.6.2 from the pinned installation hotfix."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.6.1-hotfix.1'
OUT = ROOT / 'dist/2.6.2'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Node.js is required. Set REVISAWIKI_NODE or pass --node.')
    baseline = json.loads((ROOT / 'tests/expected_release_v261_hotfix_1.json').read_text())
    assert baseline['version'] == '2.6.1-hotfix.1'
    spec = importlib.util.spec_from_file_location('quote_context_patch', ROOT / 'src/v2_6_2/quotation_patch.py')
    patch = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(patch)
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, proof in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], name
        text = raw.decode('utf-8')
        if name in ['RevisaWiki_v2_6_1.js', 'RevisaWiki_v2_6_1_completo.js']:
            text = patch.apply(text)
            anchor = ' * ligações, notas, seções finais e grafia. As alterações ficam no rascunho,\n'
            assert text.count(anchor) == 1
            text = text.replace(anchor, ' * ligações, notas, seções finais e grafia. A leitura de aspas respeita\n'
                                ' * os limites de referências, ligações externas e células de tabelas.\n'
                                ' * As alterações ficam no rascunho,\n')
        text = text.replace('2.6.1-hotfix.1', '2.6.2').replace('2.6.1', '2.6.2')
        text = text.replace('_v2_6_1', '_v2_6_2')
        destination = OUT / name.replace('_v2_6_1', '_v2_6_2')
        destination.write_text(text)
        subprocess.run([args.node, '--check', str(destination)], check=True)
        emitted = destination.read_bytes()
        assert b'~~~' not in emitted, 'Literal signature trigger in ' + destination.name
        files[destination.name] = {'bytes': len(emitted), 'sha256': hashlib.sha256(emitted).hexdigest()}
    for name in ['RevisaWiki_v2_6_2.js', 'RevisaWiki_v2_6_2_dados.js']:
        assert files[name]['bytes'] < 2097152, 'Install modular files.'
    for source in sorted(BASE.glob('Catalogo_*.json')):
        catalog = json.loads(source.read_text())
        catalog['releaseVersion'] = '2.6.2'
        catalog['distributionVersion'] = '2.6.2'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_6_2.js']['sha256']
        (OUT / source.name.replace('_v2_6_1', '_v2_6_2')).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {'version': '2.6.2', 'runtimeVersion': '2.6.2', 'baseVersion': baseline['version'],
              'baseFiles': baseline['files'], 'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v262.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
