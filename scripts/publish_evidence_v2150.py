"""Prepare an explicit final QA publication set, excluding logs and private captures."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import tempfile

from summarize_v2150 import ROOT, OUT, VERSION, FINAL_PIN, collect, local, require, zero_activity

DESTINATION = ROOT / 'tests/evidence/2.15.0'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def prepare(packaging):
    summary_path = OUT / 'RELEASE_QA_SUMMARY.json'
    summary_raw = summary_path.read_bytes()
    summary = json.loads(summary_raw)
    require(summary['status'] == 'passed' and summary['releaseManifestSha256'] == FINAL_PIN, 'Final QA summary is not pinned and passed')
    # Re-read each selected report and all final executables. A stale summary is not sufficient.
    current = collect(summary['mainSourceDirectory'], summary['realSourceReport'])
    require(current == summary, 'Final QA inputs changed after aggregation')
    inputs = []
    targets = set()

    def append(path, target, expected=None, size=None):
        source = local(path)
        source_name = source.relative_to(ROOT).as_posix()
        finite_sources = {'tests/v2150/inherited/qa_semantic_snapshot/' + name for name in ('old_adapter.cjs', 'new_adapter.cjs', 'old_prepare.cjs', 'new_prepare.cjs')}
        require(source.suffix in ('.json', '.md') or source_name in finite_sources, 'Unapproved evidence format')
        require(not Path(target).is_absolute() and '..' not in Path(target).parts, 'Invalid evidence target')
        require(target not in targets and target != 'EVIDENCE_INDEX.json', 'Duplicate evidence target')
        raw = source.read_bytes()
        if expected is not None:
            require(digest(raw) == expected and len(raw) == size, 'Final evidence input changed: ' + source.relative_to(ROOT).as_posix())
        if source.suffix == '.json':
            json.loads(raw)
        targets.add(target)
        inputs.append((source, target, raw))

    for row in summary['sourceReports']:
        append(row['report'], row['evidenceTarget'], row['sha256'], row['bytes'])
    append(summary_path, 'RELEASE_QA_SUMMARY.json', digest(summary_raw), len(summary_raw))
    manifest_path = ROOT / 'tests/expected_release_v2150.json'
    manifest_raw = manifest_path.read_bytes()
    append(manifest_path, 'runtime_manifest.json', FINAL_PIN, len(manifest_raw))
    require({Path(name).name for name in packaging} == {'documentation.json', 'copy_index.json', 'rebuild.json'} and len(packaging) == 3, 'Exactly the three final packaging receipts are required')
    for name in packaging:
        path = local(name)
        require(path.parent == OUT, 'Packaging receipts must be canonical 2.15 artifact files')
        value = json.loads(path.read_text())
        require(value.get('status') == 'passed' and value.get('version') == VERSION, 'Packaging receipt not passed: ' + path.name)
        require(not value.get('failed') and not value.get('failures'), 'Packaging failure recorded')
        for key in ('releaseManifestSha256', 'pinManifestSha256'):
            if key in value:
                require(value[key] == FINAL_PIN, 'Packaging receipt belongs to another runtime')
        if 'frozenFiles' in value:
            require(value['frozenFiles'] == summary['frozenFiles'], 'Packaging executable inventory changed')
        if path.name == 'documentation.json':
            require(value.get('releaseManifestSha256') == FINAL_PIN and value.get('frozenFiles') == summary['frozenFiles'], 'Documentation audit is not bound to the frozen runtime')
        elif path.name == 'copy_index.json':
            require(value['manifestSha256'] == FINAL_PIN and value['indexSha256'] == digest((ROOT / 'dist/2.15.0/INICIO.html').read_bytes()), 'Copy index audit is stale')
            require(not value['pageErrors'] and value['systemClipboardWrites'] == value['externalRequests'] == 0, 'Copy index browser activity or errors')
            for proof in value['payloadHashes'].values():
                filename = proof['filename']
                require(Path(filename).name == filename, 'Invalid copy payload filename')
                raw = (ROOT / 'dist/2.15.0' / filename).read_bytes()
                require(digest(raw) == proof['sha256'] and len(raw) == proof['bytes'], 'Copy payload changed after audit')
        elif path.name == 'rebuild.json':
            require(all(value['files'].get(filename) == expected for filename, expected in summary['frozenFiles'].items()), 'Rebuild did not include every final executable')
            require(set(value['files']) == {p.name for p in (ROOT / 'dist/2.15.0').iterdir() if p.is_file()}, 'Package inventory changed after rebuild')
            for filename, proof in value['files'].items():
                require(Path(filename).name == filename, 'Invalid rebuilt package filename')
                raw = (ROOT / 'dist/2.15.0' / filename).read_bytes()
                require(digest(raw) == proof['sha256'] and len(raw) == proof['bytes'], 'Package bytes changed after rebuild')
        zero_activity(value, path.name)
        append(path, 'packaging/' + path.name)

    inventory = {name: {'bytes': len(raw), 'sha256': digest(raw)} for _, name, raw in inputs}
    index = {'version': VERSION, 'status': 'passed', 'releaseManifestSha256': FINAL_PIN,
             'qaSummarySha256': digest(summary_raw), 'files': inventory,
             'sourceSelection': 'Explicit sourceReports in the final QA summary, exact actual-plan snapshots and separately named passed packaging receipts.',
             'scope': 'Final JSON reports and read-only provenance snapshots only. The passed input-amendment preflight is retained as provenance and excluded from product totals. No withdrawn-candidate runs, unrelated preliminary runs, raw private captures, logs, profiles, credentials, account data, screenshots or machine-local paths are selected. Product totals count aggregate reports once. The publication privacy gate runs separately on the final upload set.',
             'wikipediaWrites': 0, 'accountUse': False}
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    require(not DESTINATION.is_symlink(), 'Evidence destination is a symlink')
    if DESTINATION.exists():
        old_index = DESTINATION / 'EVIDENCE_INDEX.json'
        require(old_index.exists() and not old_index.is_symlink(), 'Existing evidence directory has no managed index')
        old = json.loads(old_index.read_text())
        allowed = set(old['files']) | {'EVIDENCE_INDEX.json'}
        actual = {p.relative_to(DESTINATION).as_posix() for p in DESTINATION.rglob('*') if p.is_file() or p.is_symlink()}
        require(actual <= allowed, 'Unmanaged existing evidence files would be left behind')
        require(not any(p.is_symlink() for p in DESTINATION.rglob('*')), 'Existing evidence directory contains a symlink')
    stage = Path(tempfile.mkdtemp(prefix='.evidence-2.15.0-', dir=DESTINATION.parent))
    try:
        for _, name, raw in inputs:
            target = stage / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
        (stage / 'EVIDENCE_INDEX.json').write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
        # Only a previously indexed evidence set can be replaced.
        if DESTINATION.exists():
            shutil.rmtree(DESTINATION)
        stage.rename(DESTINATION)
    except BaseException:
        if stage.exists():
            shutil.rmtree(stage)
        raise
    return index


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--packaging-receipt', action='append', default=None,
                        help='Exact repository-local canonical packaging receipt, repeatable')
    args = parser.parse_args()
    packaging = args.packaging_receipt or ['artifacts/v2150/documentation.json', 'artifacts/v2150/copy_index.json', 'artifacts/v2150/rebuild.json']
    index = prepare(packaging)
    print(json.dumps({'version': VERSION, 'status': 'passed', 'reports': len(index['files']), 'wikipediaWrites': 0}))


if __name__ == '__main__':
    main()
