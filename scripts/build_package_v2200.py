"""Package a validated release without touching archived distributions."""
from pathlib import Path
import argparse
import json
import shutil
import tempfile
import zipfile

from v220_delivery import (
    ROOT, VERSION, STEM, DIST, DOCS, REQUIRED_DOCS,
    checked_manifest, checked_qa, checked_text, safe_file, pin, sha, write_json,
)
from build_demo_v2200 import build_demo
from build_index_v2200 import build_index
from publication_privacy_gate import Scanner


def inspect_publication(root):
    scanner = Scanner([])
    files = []
    for path in sorted(root.rglob('*')):
        if path.is_symlink():
            raise ValueError('A delivery symlink is not permitted')
        if path.is_file():
            name = path.relative_to(root).as_posix()
            files.append(name)
            scanner.scan(name, path.read_bytes())
    if scanner.findings:
        # The scanner deliberately reports rules and filenames, not matched values.
        raise ValueError(json.dumps({'status': 'failed', 'privacyFindings': scanner.findings}, ensure_ascii=False))
    return {'status': 'passed', 'files': len(files), 'inspectedMembers': scanner.files,
            'archivesInspected': scanner.archives, 'findingCount': 0}


def build_package(output, manifest_path=None, qa_path=None, examples_path=None):
    output = output.resolve()
    manifest = checked_manifest(manifest_path)
    qa = checked_qa(manifest, qa_path)
    qa_file = qa_path or ROOT / 'tests/evidence/2.20.0/QA_SUMMARY.json'
    for name in REQUIRED_DOCS:
        checked_text(safe_file(DOCS, name))
    catalog_pins = qa.get('catalogFiles', {})
    if not isinstance(catalog_pins, dict):
        raise ValueError('Unexpected public catalog manifest format')
    for name, expected in catalog_pins.items():
        if not name.startswith('Catalogo_') or not name.endswith(f'_{STEM}.json'):
            raise ValueError('An unexpected catalog name was requested')
        if pin(safe_file(DIST, name)) != expected:
            raise ValueError('Public catalog bytes differ from QA')
    # Build the publication set in an isolated staging directory. A failed gate
    # leaves the existing distribution and all historical releases untouched.
    with tempfile.TemporaryDirectory(prefix='revisawiki-delivery-') as temporary:
        stage = Path(temporary)
        for name in {**manifest['files'], **catalog_pins}:
            shutil.copyfile(safe_file(DIST, name), stage / name)
        for name in REQUIRED_DOCS:
            shutil.copyfile(safe_file(DOCS, name), stage / name)
        shutil.copyfile(safe_file(ROOT, 'LICENSE'), stage / 'LICENSE.txt')
        demo = build_demo(stage, examples_path, manifest_path, qa_path)
        index = build_index(stage, manifest_path, qa_path)
        metadata = json.loads((stage / 'MANIFESTO.json').read_text(encoding='utf-8'))
        metadata['demonstration'] = demo
        metadata['qaSummarySha256'] = pin(qa_file)['sha256']
        write_json(stage / 'MANIFESTO.json', metadata)
        files = {path.relative_to(stage).as_posix(): pin(path) for path in sorted(stage.rglob('*')) if path.is_file()}
        write_json(stage / 'ARQUIVOS.json', {
            'version': VERSION, 'distributionRevision': VERSION, 'files': files,
            'qaSummarySha256': pin(qa_file)['sha256'], 'wikipediaWrites': 0,
        })
        before_zip = inspect_publication(stage)
        archive = f'RevisaWiki_{VERSION}.zip'
        with zipfile.ZipFile(stage / archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
            for path in sorted(stage.rglob('*')):
                if not path.is_file() or path.name == archive:
                    continue
                member = path.relative_to(stage).as_posix()
                info = zipfile.ZipInfo(member, date_time=(2026, 10, 21, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                package.writestr(info, path.read_bytes())
        after_zip = inspect_publication(stage)
        # Do not silently leave private or stale files in the destination.
        expected_paths = {path.relative_to(stage).as_posix() for path in stage.rglob('*') if path.is_file()}
        if output.exists():
            existing = {path.relative_to(output).as_posix() for path in output.rglob('*') if path.is_file()}
            if existing - expected_paths:
                raise ValueError('The destination contains unexpected files; review it before packaging')
            if any(path.is_symlink() for path in output.rglob('*')):
                raise ValueError('The destination contains an unsupported symlink')
        output.mkdir(parents=True, exist_ok=True)
        for path in sorted(stage.rglob('*')):
            if path.is_file():
                destination = output / path.relative_to(stage)
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(path, destination)
        for name, expected in files.items():
            if pin(output / name) != expected:
                raise ValueError('A delivered file differs from its archive record')
        # Recheck original runtime bytes after packaging to detect a concurrent build.
        if checked_manifest(manifest_path)['files'] != manifest['files']:
            raise ValueError('The frozen runtime changed during packaging')
        archive_pin = pin(output / archive)
        return {'version': VERSION, 'status': 'packaged', 'files': len(expected_paths),
                'archive': archive, **archive_pin, 'copyCards': index['cards'],
                'demonstrationExamples': demo['examples'], 'privacyBeforeArchive': before_zip,
                'privacyWithArchive': after_zip, 'wikipediaWrites': 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DIST)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--qa', type=Path)
    parser.add_argument('--examples', type=Path)
    args = parser.parse_args()
    print(json.dumps(build_package(args.output, args.manifest, args.qa, args.examples), ensure_ascii=False))


if __name__ == '__main__':
    main()
