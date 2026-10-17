"""Verify the completed frozen execution and unchanged historical sources."""
from pathlib import Path
import hashlib
import json
import subprocess

from summarize_v2180 import (
    BUNDLES, execution_attachments, relative_file, require,
    validate_execution, validate_verification,
)

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/v2180'
sha = lambda data: hashlib.sha256(data).hexdigest()


def version_addresses(version, slug, token):
    return [
        ['expected_release_' + token + '.json', 'expected_release_v2180.json'],
        ['dist/' + version, 'dist/2.18.0'],
        ['RevisaWiki_' + slug, 'RevisaWiki_v2_18_0'],
        ["'" + slug + "'", "'v2_18_0'"],
        ["'" + version + "'", "'2.18.0'"],
        ['artifacts/' + token + '/', 'artifacts/v2180/previous-' + token + '/'],
        ["replaceAll('_" + slug + "',", "replaceAll('_v2_18_0',"],
    ]


def historical_substitutions(filename, method):
    if method == 'version-and-runtime-address-retargeting-only':
        require(filename.startswith('tests/v2140/'), 'Unexpected nested historical source')
        return [
            ['expected_release_v2140.json', 'expected_release_v2180.json'],
            ['v2_14_0', 'v2_18_0'],
            ['2.14.0', '2.18.0'],
        ]
    require(method == 'release-address-and-label-retargeting-only', 'Unknown historical adaptation method')
    for directory, version, slug, token in [
        ('v217', '2.17.0', 'v2_17_0', 'v2170'),
        ('v216', '2.16.0', 'v2_16_0', 'v2160'),
        ('v2151', '2.15.1', 'v2_15_1', 'v2151'),
        ('v2150', '2.15.0', 'v2_15_0', 'v2150'),
    ]:
        if filename.startswith('tests/' + directory + '/'):
            require('/inherited/' not in filename and '/native_browser/' not in filename,
                    'A protected historical source was retargeted')
            return version_addresses(version, slug, token)
    raise ValueError('Unexpected historical adaptation source')


def main():
    manifest_path = ROOT / 'tests/expected_release_v2180.json'
    manifest_raw = manifest_path.read_bytes()
    manifest = json.loads(manifest_raw)
    manifest_sha = sha(manifest_raw)
    frozen = json.loads((ART / 'FROZEN.json').read_bytes())
    require(frozen['version'] == '2.18.0' and frozen['releaseManifestSha256'] == manifest_sha,
            'The freeze identifies different release files')
    require(frozen['frozenFiles'] == manifest['files'], 'The frozen executable inventory differs')
    for name, pin in manifest['files'].items():
        raw = (ROOT / 'dist/2.18.0' / name).read_bytes()
        require(len(raw) == pin['bytes'] and sha(raw) == pin['sha256'], 'A frozen executable changed')
    bindings = dict(frozen['sourceFiles'])
    bindings['tests/expected_release_v2180.json'] = manifest_sha
    bindings.update({'dist/2.18.0/' + name: pin['sha256'] for name, pin in manifest['files'].items()})
    for name in ['scripts/summarize_v2180.py', 'scripts/verify_execution_v2180.py']:
        bindings[name] = sha(relative_file(ROOT, name).read_bytes())
    for filename, digest in bindings.items():
        require(sha(relative_file(ROOT, filename).read_bytes()) == digest, 'A frozen source changed')

    execution_path = ART / 'final/execution.json'
    execution_raw = execution_path.read_bytes()
    execution = json.loads(execution_raw)
    _, cases, checks = validate_execution(execution, manifest, manifest_sha, BUNDLES, ROOT)
    require(execution.get('kind') == 'frozen-finite-release-execution', 'A complete frozen execution is required')
    attachments = execution_attachments(execution_path, execution, manifest_sha, ROOT)

    historical = {}
    reads = 0
    methods = {'release-address-and-label-retargeting-only': 0,
               'version-and-runtime-address-retargeting-only': 0}
    for source in sorted(execution_path.parent.rglob('adaptation-*.json')):
        require(source.is_file() and not source.is_symlink(), 'A historical report is not ordinary')
        row = json.loads(source.read_bytes())
        require(row.get('status') == 'passed' and row.get('version') == '2.18.0',
                'A historical adaptation did not pass on the current release')
        require(row.get('behavioralAssertionWaivers') == [] and row.get('featureOptionsChanged', []) == [],
                'A historical adaptation changed assertions or feature options')
        require(row.get('wikipediaWrites', 0) == row.get('networkRequests', 0) == 0,
                'A historical adaptation used the network')
        method = row.get('method')
        require(method in methods and isinstance(row.get('records'), list) and row['records'],
                'A historical adaptation has no source records')
        bound = json.loads((source.parent / 'bound_result.json').read_bytes())
        require(bound.get('execution', {}).get('suite') == 'tests/v218/previous.cjs',
                'A historical report has no executed original result')
        methods[method] += 1
        for record in row['records']:
            filename = record.get('file')
            raw = relative_file(ROOT, filename).read_bytes()
            require(sha(raw) == record.get('sourceSha256'), 'An executed historical source changed')
            original = raw.decode('utf-8')
            substitutions = historical_substitutions(filename, method)
            if method == 'release-address-and-label-retargeting-only':
                require(record.get('substitutions') == [pair for pair in substitutions if pair[0] in original],
                        'A historical adaptation used an unapproved substitution')
            else:
                require('substitutions' not in record, 'The nested historical report format changed')
            compiled = original
            for before, after in substitutions:
                compiled = compiled.replace(before, after)
            require(sha(compiled.encode('utf-8')) == record.get('compiledSha256'),
                    'An executed historical source changed beyond version and address substitutions')
            require(filename not in historical or historical[filename] == sha(raw),
                    'One historical source has conflicting executed hashes')
            historical[filename] = sha(raw)
            reads += 1
    previous_runs = [run for run in execution['runs'] if run['suite'] == 'tests/v218/previous.cjs']
    nested_runs = [run for run in previous_runs if run.get('args', [])[:1] == ['previous_release']]
    require(methods['release-address-and-label-retargeting-only'] == len(previous_runs) == 65,
            'A historical invocation lacks its original adaptation report')
    require(methods['version-and-runtime-address-retargeting-only'] == len(nested_runs) == 20,
            'An inherited invocation lacks its nested source proof')
    unchanged = subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', *sorted(historical)], cwd=ROOT,
                               check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    require(unchanged.returncode == 0, 'A historical source differs from its archived repository version')

    stdout = list(execution_path.parent.rglob('PRIVATE_STDOUT.log'))
    stderr = list(execution_path.parent.rglob('PRIVATE_STDERR.log'))
    require(len(stdout) == len(stderr) == len(execution['runs']), 'Private execution logs are incomplete')
    require(sorted(sha(source.read_bytes()) for source in stdout) ==
            sorted(run['outputSha256'] for run in execution['runs']), 'An execution output log changed')
    require(not any(source.is_symlink() for source in stdout + stderr), 'A private log is not ordinary')
    public_logs = sum(len(list((ROOT / directory).rglob('PRIVATE_*.log')))
                      for directory in ['dist/2.18.0', 'docs/2.18.0', 'tests/evidence/2.18.0'])
    require(public_logs == 0, 'Private execution logs are inside a publication directory')
    result = {
        'version': '2.18.0', 'status': 'passed', 'kind': 'independent-execution-verification',
        'releaseManifestSha256': manifest_sha, 'executionSha256': sha(execution_raw),
        'invocations': len(execution['runs']), 'cases': cases, 'checks': checks,
        'frozenSourcesUnchanged': True, 'historicalSourcesUnchanged': True,
        'frozenSourceFilesVerified': len(bindings), 'sourceBindings': bindings,
        'historicalSourceFilesVerified': len(historical), 'historicalSourceBindings': historical,
        'historicalSourceReadsVerified': reads, 'historicalAdaptationReports': methods,
        'privateExecutionLogs': len(stdout) + len(stderr), 'privateLogsInPublicationTree': public_logs,
        'originalBoundResultsVerified': len(execution['runs']),
        'additionalExecutedSidecarsVerified': len(attachments) - len(execution['runs']),
        'wikipediaWrites': 0, 'networkRequests': 0,
    }
    validate_verification(result, execution_raw, execution, cases, checks, manifest, manifest_sha, ROOT)
    for filename, digest in bindings.items():
        require(sha(relative_file(ROOT, filename).read_bytes()) == digest, 'A source changed during independent verification')
    require(sha(execution_path.read_bytes()) == sha(execution_raw), 'The completed execution changed during verification')
    (execution_path.parent / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': 'passed', 'invocations': len(execution['runs']), 'cases': cases,
                      'checks': checks, 'historicalSourceFiles': len(historical), 'historicalSourceReads': reads}))


if __name__ == '__main__':
    main()
