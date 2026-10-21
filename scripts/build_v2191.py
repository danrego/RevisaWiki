"""Build the editor-context hotfix from the immutable 2.19.0 distribution."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.19.0'
OUT = ROOT / 'dist/2.19.1'
PIN = ROOT / 'tests/expected_release_v2190.json'
BASE_MANIFEST_SHA = '57a2787297301d31c473e99b18081d57a91b10bc09ca9f75ff4b057b7f0e5e49'
HELPER = ROOT / 'src/v2_19_1/ui_context_serialization.js'
REPLACEMENTS = (
    ('JSON.stringify(v219UIContext(task.context))', 'v219UIContextKey(task.context)'),
    ('JSON.stringify(v219UIContext(localEditorContext(adapter)))', 'v219UIContextKey(localEditorContext(adapter))'),
    ('v219UIContext,v219UIContextSame,', 'v219UIContext,v219UIContextSame,v219UIContextKey,'),
)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    assert args.node
    pin_bytes = PIN.read_bytes()
    assert sha(pin_bytes) == BASE_MANIFEST_SHA
    base = json.loads(pin_bytes)
    helper_bytes = HELPER.read_bytes()
    OUT.mkdir(parents=True, exist_ok=True)
    files, proofs = {}, []
    for name, pin in base['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == pin['bytes'] and sha(raw) == pin['sha256'], name
        original = text = raw.decode()
        inserted = None
        if name in ('RevisaWiki_v2_19_0.js', 'RevisaWiki_v2_19_0_completo.js'):
            # The compact core is already close to the native page-size limit.
            # Only leading indentation of this new helper is omitted there.
            inserted = helper_bytes.decode()
            if name == 'RevisaWiki_v2_19_0.js':
                inserted = ''.join(line.lstrip(' ') for line in inserted.splitlines(keepends=True))
            anchor = '    function v219UIContext(value) {'
            assert text.count(anchor) == 1
            text = text.replace(anchor, inserted + anchor, 1)
            for before, after in REPLACEMENTS:
                assert text.count(before) == 1, before
                text = text.replace(before, after, 1)
        text = text.replace('2.19.0', '2.19.1').replace('_v2_19_0', '_v2_19_1')
        restored = text.replace('2.19.1', '2.19.0').replace('_v2_19_1', '_v2_19_0')
        if inserted is not None:
            for before, after in reversed(REPLACEMENTS):
                assert restored.count(after) == 1
                restored = restored.replace(after, before, 1)
            assert restored.count(inserted) == 1
            restored = restored.replace(inserted, '', 1)
        assert restored == original, 'Unexpected runtime change: ' + name
        target = OUT / name.replace('_v2_19_0', '_v2_19_1')
        target.write_text(text)
        emitted = target.read_bytes()
        subprocess.run([args.node, '--check', str(target)], check=True)
        if name.startswith('Chamada_fixa_'):
            assert emitted == raw
        files[target.name] = {'bytes': len(emitted), 'sha256': sha(emitted)}
        proofs.append({'file': target.name, 'baseSha256': sha(raw), 'restoredBaseSha256': sha(restored.encode()),
                       'onlyVersionAndEditorTransportChanged': True})
    for name in ('RevisaWiki_v2_19_1.js', 'RevisaWiki_v2_19_1_dados.js'):
        assert files[name]['bytes'] < 2097152, name
    manifest = {'version': '2.19.1', 'runtimeVersion': '2.19.1', 'distributionRevision': '2.19.1',
                'baseVersion': '2.19.0', 'baseManifestSha256': BASE_MANIFEST_SHA,
                'packedCatalogSha256': base['packedCatalogSha256'], 'files': files,
                'sourceInputs': {'src/v2_19_1/ui_context_serialization.js': {
                    'bytes': len(helper_bytes), 'sha256': sha(helper_bytes)}},
                'reversibleChangeProofs': proofs}
    assert HELPER.read_bytes() == helper_bytes
    (ROOT / 'tests/expected_release_v2191.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
