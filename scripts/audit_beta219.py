"""Verify the saved beta package, complete copy payloads and documentation."""
from pathlib import Path
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.19.0-beta.1'
DIST = ROOT / 'dist' / VERSION


def main():
    manifest = json.loads((ROOT / 'tests/expected_release_beta219.json').read_text())
    for name, pin in manifest['files'].items():
        raw = (DIST / name).read_bytes()
        assert len(raw) == pin['bytes'] and hashlib.sha256(raw).hexdigest() == pin['sha256']
    page = (DIST / 'INICIO.html').read_text()
    match = re.search(r'<script type="application/json" id="payloads">(.*?)</script>', page, re.S)
    assert match
    payloads = json.loads(match[1])
    assert list(payloads) == ['dados', 'programa', 'central', 'documentacao', 'carregador']
    for key, item in payloads.items():
        assert item['text'].encode() == (DIST / item['filename']).read_bytes()
        assert hashlib.sha256(item['text'].encode()).hexdigest() == item['sha256']
        assert '/Beta' in item['destination'] or item['destination'] == 'Especial:Minha página/common.js'
    manual_name = 'Documentacao_RevisaWiki_v2_19_0_beta_1.wiki'
    manual = (DIST / manual_name).read_text()
    assert manual == (ROOT / 'docs' / VERSION / manual_name).read_text()
    assert manual.index('=== 2.19.0-beta.1 ===') < manual.index('=== 2.18.0, base desta beta ===')
    assert 'Safari' in manual and 'ficaram pendentes' in manual
    assert 'https://github.com/danrego/RevisaWiki' in manual
    for path in (ROOT / 'docs' / VERSION).iterdir():
        text = path.read_text()
        assert '\n\n\n' not in text
        assert all(token not in text for token in ['—', '@@QA@@', 'PENDING', 'Testes anteriores da interface'])
    inventory = json.loads((DIST / 'ARQUIVOS.json').read_text())
    for name, pin in inventory['files'].items():
        raw = (DIST / name).read_bytes()
        assert len(raw) == pin['bytes'] and hashlib.sha256(raw).hexdigest() == pin['sha256']
    with zipfile.ZipFile(DIST / ('RevisaWiki_' + VERSION + '.zip')) as package:
        assert set(package.namelist()) == set(inventory['files']) | {'ARQUIVOS.json'}
        for name in package.namelist():
            assert package.read(name) == (DIST / name).read_bytes()
    result = {'version': VERSION, 'status': 'passed', 'runtimeFiles': len(manifest['files']),
              'copyPayloads': len(payloads), 'archiveMembers': len(inventory['files']) + 1,
              'mainValidationResumed': False, 'wikipediaWrites': 0}
    (ROOT / 'tests/evidence' / VERSION / 'DELIVERY_AUDIT.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
