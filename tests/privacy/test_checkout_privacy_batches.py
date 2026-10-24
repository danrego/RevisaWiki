"""Check complete batched checkout coverage with synthetic Git repositories."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('checkout_privacy', ROOT / 'scripts/check_privacy.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
results = []


def check(value, name):
    results.append({'name': name, 'passed': bool(value)})
    if not value:
        raise AssertionError(name)


def git(root, *args):
    completed = subprocess.run(['git', *args], cwd=root, capture_output=True)
    if completed.returncode:
        raise AssertionError('Synthetic Git setup failed')


def repository(directory, files):
    root = Path(directory) / 'checkout'
    root.mkdir()
    git(root, 'init', '--quiet')
    for name, contents in files.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(contents)
    git(root, 'add', '--all')
    return root


def archive(contents, member='content.txt'):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w', compression=zipfile.ZIP_DEFLATED) as output:
        output.writestr(member, contents)
    return stream.getvalue()


with tempfile.TemporaryDirectory(prefix='revisawiki-privacy-tests-') as directory:
    clean = {str(index).zfill(2) + '.txt': b'Public example text.\n' for index in range(7)}
    root = repository(directory, clean)
    report = gate.scan_checkout(root, batch_size=2)
    check(report['status'] == 'passed', 'Clean checkout passes every batch')
    check(report['trackedFiles'] == report['allowlistedFiles'] == 7, 'Every tracked path is allowlisted')
    check(report['batchCount'] == report['completedBatches'] == 4, 'The last partial batch is scanned')
    check([row['allowlistedFiles'] for row in report['batches']] == [2, 2, 2, 1], 'Batch boundaries cover every path once')
    check(report['coverage']['everyTrackedPathExactlyOnce'] is True, 'Exact path coverage is attested')
    check(report['coverage']['trackedInventoryUnchanged'] is True, 'The tracked snapshot remains stable')
    check(report['inspectedMembers'] == 7 and report['archivesInspected'] == 0, 'Member and archive counts are aggregated')
    check(report['inspectedBytes'] == sum(map(len, clean.values())), 'Expanded byte totals include all batches')
    serialized = json.dumps(report)
    check(str(root) not in serialized and directory not in serialized, 'No local checkout or temporary path is reported')
    check(all(name not in serialized for name in clean), 'Public aggregate findings do not expose tracked path literals')
    check(report['matchedPrivateValuesIncluded'] is False and report['localPathsIncluded'] is False, 'The report declares its neutral output policy')
    native_spec = importlib.util.spec_from_file_location('unchanged_publication_scanner', gate.SCANNER)
    native = importlib.util.module_from_spec(native_spec)
    native_spec.loader.exec_module(native)
    check((native.MAX_MEMBER, native.MAX_TOTAL, native.MAX_DEPTH) == (128 * 1024 * 1024, 768 * 1024 * 1024, 4), 'Every scanner invocation retains the existing member, expansion and depth limits')
    actual_run = gate.subprocess.run
    inventories_seen, temporary_paths = [], []
    def inspect_invocation(command, *args, **kwargs):
        if str(gate.SCANNER) in command:
            allowlist = Path(command[command.index('--allowlist') + 1])
            temporary_paths.append(allowlist)
            inventories_seen.append(json.loads(allowlist.read_text()))
            check(root.resolve() not in allowlist.resolve().parents, 'Each explicit allowlist stays outside the publication tree ' + str(len(inventories_seen)))
        return actual_run(command, *args, **kwargs)
    with patch.object(gate.subprocess, 'run', side_effect=inspect_invocation):
        explicit = gate.scan_checkout(root, batch_size=2)
    check(explicit['status'] == 'passed' and len(inventories_seen) == 4, 'Every batch invokes the unchanged scanner with an explicit allowlist')
    check([name for batch in inventories_seen for name in batch] == gate.tracked_paths(root), 'The real scanner allowlists cover the complete tracked list exactly once')
    check(all(not path.exists() for path in temporary_paths), 'Temporary allowlists are removed after the scan')
    token = ('gh' + 'p_' + 'Z' * 31).encode()
    (root / '06.txt').write_bytes(token)
    later = gate.scan_checkout(root, batch_size=2)
    check(later['status'] == 'failed', 'A secret in the final batch blocks publication')
    check(later['findingCount'] == 1 and later['findings'][0]['rule'] == 'secret-token', 'The original token rule remains active')
    check(later['findings'][0]['batch'] == 4, 'A late finding is attributed to the correct batch')
    check(later['completedBatches'] == 4, 'All batches are still inspected after a finding')
    check(token.decode() not in json.dumps(later), 'The matched synthetic secret is never printed')
    (root / '06.txt').write_bytes(clean['06.txt'])
    packed = archive(archive(token, 'hidden.txt'), 'nested.zip')
    (root / '07.zip').write_bytes(packed)
    git(root, 'add', '--all')
    nested = gate.scan_checkout(root, batch_size=3)
    check(nested['status'] == 'failed', 'A secret inside a nested archive blocks publication')
    check(nested['archivesInspected'] == 2 and nested['inspectedMembers'] == 10, 'Nested members and archive totals remain intact')
    check(nested['findings'][0]['rule'] == 'secret-token', 'Nested content uses the unchanged scanner rule')
    check(token.decode() not in json.dumps(nested), 'Nested private matches are never printed')
    check(nested['inspectedBytes'] == sum(map(len, clean.values())) + len(packed) + len(archive(token, 'hidden.txt')) + len(token), 'Nested expanded byte counts are aggregated exactly')
    (root / '07.zip').write_bytes(archive(b'Public archive text.'))
    archive_clean = gate.scan_checkout(root, batch_size=3)
    check(archive_clean['status'] == 'passed' and archive_clean['archivesInspected'] == 1, 'Clean archives remain accepted')
    marker = b'only-local-synthetic-deny-value'
    (root / '06.txt').write_bytes(marker)
    denylist = Path(directory) / 'private-denylist.json'
    denylist.write_text(json.dumps([marker.decode()]))
    denied = gate.scan_checkout(root, batch_size=2, denylist=denylist)
    check(any(item['rule'] == 'private-local-denylist' for item in denied['findings']), 'An explicit private denylist applies to every batch')
    check(marker.decode() not in json.dumps(denied) and str(denylist) not in json.dumps(denied), 'Denylist values and paths remain private')
    (root / '06.txt').write_bytes(clean['06.txt'])
    expected_paths = gate.tracked_paths(root)
    inventories = iter([expected_paths, expected_paths + ['new.txt']])
    with patch.object(gate, 'tracked_paths', side_effect=lambda _: next(inventories)):
        changed = gate.scan_checkout(root, batch_size=2)
    check(changed['status'] == 'failed' and changed['coverage']['trackedInventoryUnchanged'] is False, 'A changing Git inventory fails closed')
    check(any(item['rule'] == 'tracked-inventory-changed-during-scan' for item in changed['findings']), 'Inventory races have a neutral finding')
    with patch.object(gate, 'run_unit_controls', return_value=[{'suite': 'synthetic-control', 'status': 'passed', 'cases': 1}]) as controls:
        saved = Path(directory) / 'report.json'
        captured = io.StringIO()
        with contextlib.redirect_stdout(captured):
            code = gate.run(['--root', str(root), '--batch-size', '2', '--report', str(saved)])
        command_report = json.loads(captured.getvalue())
        check(code == 0 and command_report['status'] == 'passed', 'The command writes a successful optional report')
        check(json.loads(saved.read_text()) == command_report, 'The saved report matches the neutral command output')
        check(controls.call_count == 1, 'Unit controls run before a default command scan')
    for size in [0, -1, True, '2']:
        try:
            gate.scan_checkout(root, batch_size=size)
        except gate.CheckoutError:
            check(True, 'Invalid batch size fails closed ' + str(len(results)))
        else:
            check(False, 'Invalid batch size was accepted')
    for size in [1, 5, gate.DEFAULT_BATCH_SIZE]:
        same = gate.scan_checkout(root, batch_size=size)
        check(same['status'] == 'passed' and same['trackedFiles'] == len(expected_paths), 'Configurable clean batch size covers the same checkout ' + str(size))
        check(same['coverage']['trackedPathInventorySha256'] == archive_clean['coverage']['trackedPathInventorySha256'], 'Coverage inventory does not depend on batch boundaries ' + str(size))

# Default control counts must be positive JSON integers, never Booleans.
for candidate in [True, False, 0, -1, '1', None, 1.5, 1, 18]:
    calls = []
    def controlled_suite(command, *args, **kwargs):
        calls.append(command)
        count = candidate if len(calls) == 3 else 1
        return subprocess.CompletedProcess(command, 0,
                                           json.dumps({'status': 'passed', 'cases': count}), '')
    accepted = False
    try:
        with patch.object(gate.subprocess, 'run', side_effect=controlled_suite):
            schema_result = gate.run_unit_controls()
        accepted = True
    except gate.CheckoutError as error:
        if str(error) != 'privacy-unit-controls-failed':
            raise
    expected = type(candidate) is int and candidate > 0
    check(accepted == expected, 'Default control count schema ' + str(len(results)))
    check(len(calls) == 3, 'The current suite count is validated ' + str(len(results)))

print(json.dumps({'status': 'passed', 'cases': len(results), 'failed': 0,
                  'matchedPrivateValuesIncluded': False, 'localPathsIncluded': False,
                  'networkRequests': 0, 'wikipediaWrites': 0}))
