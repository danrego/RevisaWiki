"""Run privacy controls and scan every tracked path in bounded batches.

The underlying publication scanner retains all of its rules and limits. Each
invocation receives an explicit temporary allowlist outside the publication
tree. Aggregate reports contain counts and hashed finding paths, never matched
values, local allowlist paths or raw subprocess errors.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

CODE_ROOT = Path(__file__).resolve().parents[1]
SCANNER = CODE_ROOT / 'scripts/publication_privacy_gate.py'
DEFAULT_BATCH_SIZE = 250


class CheckoutError(Exception):
    """A neutral error code that does not carry private command output."""


def digest(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def tracked_paths(root):
    root = Path(root).resolve()
    top = subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=root,
                         capture_output=True)
    if top.returncode:
        raise CheckoutError('not-a-git-checkout')
    try:
        top_path = Path(top.stdout.decode('utf-8').strip()).resolve()
    except (UnicodeDecodeError, ValueError):
        raise CheckoutError('unreadable-git-root') from None
    if top_path != root:
        raise CheckoutError('root-is-not-checkout-top')
    listing = subprocess.run(['git', 'ls-files', '-z'], cwd=root, capture_output=True)
    if listing.returncode:
        raise CheckoutError('tracked-path-inventory-failed')
    try:
        raw = listing.stdout.decode('utf-8')
    except UnicodeDecodeError:
        raise CheckoutError('non-utf8-tracked-path') from None
    if raw and not raw.endswith('\0'):
        raise CheckoutError('incomplete-tracked-path-inventory')
    paths = raw.split('\0')[:-1] if raw else []
    if len(paths) != len(set(paths)):
        raise CheckoutError('duplicate-tracked-path')
    return paths


def neutral_finding(finding, batch):
    name = finding.get('file', '')
    name = name if isinstance(name, str) else ''
    rule = finding.get('rule', 'invalid-scanner-finding')
    if not isinstance(rule, str) or not re.fullmatch(r'[a-z0-9-]{1,100}', rule):
        rule = 'invalid-scanner-finding'
    result = {'batch': batch, 'fileSha256': digest(name),
              'trackedFileSha256': digest(name.split('!/', 1)[0]), 'rule': rule,
              'matches': finding.get('matches', 1)}
    if not isinstance(result['matches'], int) or result['matches'] < 1:
        result['matches'] = 1
    if isinstance(finding.get('line'), int) and finding['line'] > 0:
        result['line'] = finding['line']
    return result


def scan_checkout(root, batch_size=DEFAULT_BATCH_SIZE, denylist=None):
    if not isinstance(batch_size, int) or isinstance(batch_size, bool) or batch_size < 1:
        raise CheckoutError('invalid-batch-size')
    root = Path(root).resolve()
    paths = tracked_paths(root)
    batches = [paths[start:start + batch_size] for start in range(0, len(paths), batch_size)]
    flattened = [name for batch in batches for name in batch]
    if flattened != paths or collections.Counter(flattened) != collections.Counter(paths):
        raise CheckoutError('tracked-path-coverage-failed')
    result = {'status': 'passed', 'batchSize': batch_size, 'trackedFiles': len(paths),
              'allowlistedFiles': 0, 'batchCount': len(batches), 'completedBatches': 0,
              'inspectedMembers': 0, 'archivesInspected': 0, 'inspectedBytes': 0,
              'findingCount': 0, 'findings': [], 'batches': [],
              'coverage': {'expectedTrackedPaths': len(paths), 'allowlistedPaths': len(flattened),
                           'everyTrackedPathExactlyOnce': True,
                           'trackedPathInventorySha256': digest('\0'.join(paths)),
                           'trackedInventoryUnchanged': False},
              'matchedPrivateValuesIncluded': False, 'localPathsIncluded': False,
              'scannerRulesAndLimitsChanged': False,
              'scannerSha256': hashlib.sha256(SCANNER.read_bytes()).hexdigest(),
              'networkRequests': 0, 'wikipediaWrites': 0}
    with tempfile.TemporaryDirectory(prefix='revisawiki-privacy-batches-') as directory:
        temporary = Path(directory).resolve()
        if temporary == root or root in temporary.parents:
            raise CheckoutError('temporary-allowlist-inside-publication-tree')
        for index, names in enumerate(batches, 1):
            allowlist = temporary / ('batch-' + str(index) + '.json')
            allowlist.write_text(json.dumps(names, ensure_ascii=False) + '\n')
            command = [sys.executable, str(SCANNER), '--root', str(root),
                       '--allowlist', str(allowlist)]
            if denylist is not None:
                command += ['--denylist', str(Path(denylist).resolve())]
            completed = subprocess.run(command, cwd=CODE_ROOT, capture_output=True, text=True)
            try:
                report = json.loads(completed.stdout)
                valid = (completed.returncode in (0, 1) and
                         report.get('status') in ('passed', 'failed') and
                         report.get('allowlistedFiles') == len(names) and
                         isinstance(report.get('findings'), list) and
                         report.get('findingCount') == len(report['findings']) and
                         all(isinstance(report.get(key), int) and report[key] >= 0
                             for key in ['inspectedMembers', 'archivesInspected', 'inspectedBytes']) and
                         all(isinstance(item, dict) for item in report['findings']) and
                         report.get('matchedPrivateValuesIncluded') is False and
                         report.get('networkRequests') == report.get('wikipediaWrites') == 0 and
                         (completed.returncode == 0) == (report['status'] == 'passed') and
                         (not report['findings']) == (report['status'] == 'passed'))
            except (ValueError, TypeError, AttributeError):
                valid = False
                report = {}
            batch = {'batch': index, 'allowlistedFiles': len(names),
                     'trackedPathInventorySha256': digest('\0'.join(names)),
                     'status': report.get('status') if valid else 'failed',
                     'scannerCompleted': valid}
            result['allowlistedFiles'] += len(names)
            if valid:
                result['completedBatches'] += 1
                for key in ['inspectedMembers', 'archivesInspected', 'inspectedBytes']:
                    batch[key] = report[key]
                    result[key] += report[key]
                batch['findingCount'] = len(report['findings'])
                result['findings'].extend(neutral_finding(item, index) for item in report['findings'])
            else:
                batch['findingCount'] = 1
                result['findings'].append({'batch': index, 'rule': 'scanner-invocation-failed', 'matches': 1})
            result['batches'].append(batch)
    final_paths = tracked_paths(root)
    result['coverage']['trackedInventoryUnchanged'] = final_paths == paths
    if final_paths != paths:
        result['findings'].append({'rule': 'tracked-inventory-changed-during-scan', 'matches': 1})
    result['findingCount'] = len(result['findings'])
    if result['findings'] or result['completedBatches'] != len(batches):
        result['status'] = 'failed'
    return result


def run_unit_controls():
    results = []
    for name in ['test_publication_privacy_gate.py', 'test_checkout_privacy_batches.py']:
        command = [sys.executable, str(CODE_ROOT / 'tests/privacy' / name)]
        completed = subprocess.run(command, cwd=CODE_ROOT, capture_output=True, text=True)
        try:
            value = json.loads(completed.stdout)
            valid = completed.returncode == 0 and value.get('status') == 'passed'
            cases = value.get('cases')
            valid = valid and isinstance(cases, int) and cases > 0
        except (ValueError, TypeError, AttributeError):
            valid, cases = False, 0
        results.append({'suite': name, 'status': 'passed' if valid else 'failed', 'cases': cases})
        if not valid:
            raise CheckoutError('privacy-unit-controls-failed')
    return results


def positive_batch(value):
    try:
        number = int(value)
    except (ValueError, TypeError):
        raise argparse.ArgumentTypeError('batch size must be a positive integer') from None
    if number < 1:
        raise argparse.ArgumentTypeError('batch size must be a positive integer')
    return number


def run(argv=None):
    parser = argparse.ArgumentParser(prog='check_privacy.py', description=__doc__)
    parser.add_argument('--root', type=Path, default=CODE_ROOT)
    parser.add_argument('--batch-size', type=positive_batch, default=DEFAULT_BATCH_SIZE)
    parser.add_argument('--denylist', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args(argv)
    try:
        controls = run_unit_controls()
        result = scan_checkout(args.root, args.batch_size, args.denylist)
        result['unitControls'] = controls
    except Exception as error:
        result = {'status': 'failed', 'errorType': type(error).__name__,
                  'errorCode': str(error) if isinstance(error, CheckoutError) else 'privacy-check-failed',
                  'matchedPrivateValuesIncluded': False, 'localPathsIncluded': False,
                  'networkRequests': 0, 'wikipediaWrites': 0}
    if args.report:
        try:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        except OSError:
            result = {'status': 'failed', 'errorCode': 'privacy-report-write-failed',
                      'matchedPrivateValuesIncluded': False, 'localPathsIncluded': False,
                      'networkRequests': 0, 'wikipediaWrites': 0}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    sys.exit(run())
