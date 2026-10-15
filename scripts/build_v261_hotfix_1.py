"""Build the installation correction without changing the frozen 2.6.1 release."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.6.1'
SOURCE = ROOT / 'src/v2_6_1_hotfix_1'
OUT = ROOT / 'dist/2.6.1-hotfix.1'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Node.js is required. Set REVISAWIKI_NODE or pass --node.')
    frozen = json.loads((ROOT / 'tests/expected_release_v261.json').read_text())
    assert frozen['version'] == '2.6.1'
    module_spec = importlib.util.spec_from_file_location('loader_compatibility', SOURCE / 'loader_compatibility.py')
    loader = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(loader)
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, proof in frozen['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], name
        text = raw.decode('utf-8')
        if name.startswith('Carregador_'):
            text = loader.apply(text)
        elif name != 'RevisaWiki_v2_6_1_dados.js':
            fence = '(?:```|' + '~' * 3 + ')'
            assert text.count(fence) == 1
            text = text.replace(fence, '(?:```|~{3})')
            if name == 'RevisaWiki_v2_6_1.js':
                old = "revision+'&action=raw&ctype=text/javascript');"
                new = "revision+'&action=raw&ctype=text/javascript&v='+encodeURIComponent(VERSION+'-'+EXPECTED_HASH));"
                assert text.count(old) == 1
                text = text.replace(old, new)
        (OUT / name).write_text(text)
    for name in ['Chamada_fixa_RevisaWiki_common.js','Chamada_fixa_RevisaWiki_copia_propria.js']:
        shutil.copy2(SOURCE / name, OUT / name)
    for path in sorted(OUT.glob('*.js')):
        subprocess.run([args.node, '--check', str(path)], check=True)
        raw = path.read_bytes()
        assert b'~~~' not in raw, 'Signature expansion trigger in ' + path.name
        files[path.name] = {'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
    for source in BASE.glob('Catalogo_*.json'):
        catalog = json.loads(source.read_text())
        catalog['distributionVersion'] = '2.6.1-hotfix.1'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_6_1.js']['sha256']
        (OUT / source.name).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {'version':'2.6.1-hotfix.1','runtimeVersion':'2.6.1',
              'baseVersion':'2.6.1','baseFiles':frozen['files'],
              'packedCatalogSha256':frozen['packedCatalogSha256'],'files':files}
    (ROOT / 'tests/expected_release_v261_hotfix_1.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
