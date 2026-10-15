"""Build the focused 2.6.1 patch from the verified anonymous 2.6.0 release."""

from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.6.0'
SOURCE = ROOT / 'src/v2_6_1'
OUT = ROOT / 'dist/2.6.1'


def load_patch(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Node.js is required. Set REVISAWIKI_NODE or pass --node.')
    baseline = json.loads((ROOT / 'tests/expected_release.json').read_text())
    assert baseline['version'] == '2.6.0'
    for name, record in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == record['bytes'] and hashlib.sha256(raw).hexdigest() == record['sha256'], name
    patches = [
        load_patch('reference_alias_patch', SOURCE / 'references/integration_patch.py'),
        load_patch('diagnostic_tag_patch', SOURCE / 'parser/integration_patch.py'),
        load_patch('automation_reporting_patch', SOURCE / 'automation_patch.py'),
        load_patch('discussion_draft_patch', SOURCE / 'talk/integration_patch.py'),
    ]
    lead_patch = load_patch('section_controls_patch', SOURCE / 'lead/integration_patch.py')
    project_patch = load_patch('general_project_marks_patch', SOURCE / 'all_portals/integration_patch.py')
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name in baseline['files']:
        text = (BASE / name).read_text()
        if name in ['RevisaWiki_v2_6.js', 'RevisaWiki_v2_6_completo.js']:
            for patch in patches:
                text = patch.apply(text)
            text = lead_patch.apply_core(text)
            text = project_patch.apply(text)
        elif name.startswith('Carregador_'):
            text = lead_patch.apply_loader(text)
        text = text.replace('2.6.0', '2.6.1').replace('RevisaWiki_v2_6_dados.js', 'RevisaWiki_v2_6_1_dados.js')
        destination = OUT / name.replace('_v2_6', '_v2_6_1')
        destination.write_text(text)
        subprocess.run([args.node, '--check', str(destination)], check=True)
        raw = destination.read_bytes()
        files[destination.name] = {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}
    for name in ['RevisaWiki_v2_6_1.js', 'RevisaWiki_v2_6_1_dados.js']:
        assert files[name]['bytes'] < 2097152, 'Use the modular files for installation.'
    for original in BASE.glob('Catalogo_*_v2_6.json'):
        catalog = json.loads(original.read_text())
        catalog['releaseVersion'] = '2.6.1'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_6_1.js']['sha256']
        (OUT / original.name.replace('_v2_6', '_v2_6_1')).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    result = {
        'version': '2.6.1',
        'baseVersion': '2.6.0',
        'baseFiles': baseline['files'],
        'packedCatalogSha256': baseline['packedCatalogSha256'],
        'files': files,
    }
    (ROOT / 'tests/expected_release_v261.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
