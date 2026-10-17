"""Validate a completed private corpus and publish counts and hashes only."""
from collections import Counter, defaultdict
from pathlib import Path
import argparse
import gzip
import hashlib
import json
import re
import statistics


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(value):
    return hashlib.sha256(value).hexdigest()


def read(path):
    return json.loads(path.read_bytes())


def integer(value):
    return type(value) is int and value >= 0


def fingerprint(failure):
    encoded = json.dumps([failure['check'], failure['details']], ensure_ascii=False,
                         separators=(',', ':')).encode('utf-8')
    return sha(encoded)


def aggregate(directory):
    directory = Path(directory).resolve()
    summary = read(directory / 'SUMMARY.json')
    run = read(directory / 'RUN_PRIVATE.json')
    settings = run['settings']
    require(summary.get('version') == '2.16.0' and summary.get('phase') == 'final',
            'A completed final 2.16.0 corpus is required')
    require(summary.get('status') != 'running', 'The corpus has not finished')
    manifest_path = Path(settings['manifest']).resolve()
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    require(sha(manifest_bytes) == summary['corpusSha256'] == run['manifestSha256'],
            'The private source manifest changed')
    require(manifest.get('complete') is True and manifest.get('historyComplete') is True,
            'The historical source collection is incomplete')
    require(summary.get('sourceCollectionComplete') is True and summary.get('sourceHistoryComplete') is True,
            'The completed run does not confirm the complete source collection')
    require(summary.get('failedCaptureEntries') == len(manifest.get('failed', [])),
            'The failed-capture count differs from the source manifest')
    for key in ['startedUTC', 'finishedUTC']:
        require(isinstance(summary.get(key), str) and
                re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z', summary[key]),
                'The corpus timestamps are not canonical UTC values')
    require(integer(summary.get('elapsedMilliseconds')) and type(summary.get('parallelWorkers')) is int
            and 1 <= summary['parallelWorkers'] <= 12, 'Invalid run timing or worker count')
    require(summary['runnerSha256'] == settings['runnerSha256'], 'The corpus runner hashes differ')
    require(summary['runtimeSha256'] == settings['hashes'], 'The corpus runtime hashes differ')
    for key in ['core', 'complete', 'baseline', 'baselineComplete']:
        require(key in settings and key in settings['hashes'], 'A required runtime snapshot is absent')
        require(sha(Path(settings[key]).read_bytes()) == settings['hashes'][key],
                'An immutable runtime snapshot changed')
    for owner, key in [('core', 'coreData'), ('baseline', 'baselineData')]:
        require(key in settings['hashes'], 'A required data snapshot hash is absent')
        data_path = Path(settings[owner]).with_name(Path(settings[owner]).name.replace('.js', '_dados.js'))
        require(sha(data_path.read_bytes()) == settings['hashes'][key], 'An immutable data snapshot changed')

    rows = [row for row in manifest['pages'] if row.get('namespace') == 0 and not row.get('missing')
            and row.get('file') and row.get('revid') and row.get('contentModel', 'wikitext') == 'wikitext']
    identities = {(row['pageid'], row['revid']): row for row in rows}
    require(len(identities) == len(rows), 'The source corpus contains duplicate revision identities')
    require(len({row['pageid'] for row in rows}) == len(rows), 'A historical page was selected twice')
    require(summary.get('manifestPages') == len(manifest['pages']) and
            summary.get('excludedMissingOrOtherNamespaceOrModel') == len(manifest['pages']) - len(rows),
            'The eligible and excluded source counts differ')
    planned = {(row['pageid'], row['revid']): row['sha256'] for row in run['planned']}
    require(len(planned) == len(run['planned']) == len(rows) and
            planned == {key: row['sha256'] for key, row in identities.items()},
            'The final run did not select every eligible historical page')

    checks = changed = confirmed = candidate = redirects = network = failures = 0
    exact = different = new = 0
    failure_pages = set()
    by_check = Counter()
    classifications = Counter()
    old_check_pages = defaultdict(set)
    old_check_counts = Counter()
    source_sizes = []
    known_checks = {'calculate-exception', 'text-endpoint', 'idempotence', 'second-pass-exception',
                    'preservation-audit', 'preservation-exception', 'safe-composition',
                    'composition-exception', 'pipeline-preservation', 'modular-full-parity',
                    'network-attempt', 'capture-or-run-exception', 'page-timeout', 'worker-exit'}
    for identity, row in identities.items():
        source_path = (manifest_path.parent / row['file']).resolve()
        require(source_path.is_relative_to(manifest_path.parent), 'A source capture leaves the corpus directory')
        packed = source_path.read_bytes()
        body = gzip.decompress(packed)
        require(sha(body) == row['sha256'] and len(body) == row['bytes'], 'A captured revision changed')
        if row.get('gzipSha256'):
            require(sha(packed) == row['gzipSha256'], 'A compressed source capture changed')
        text = body.decode('utf-8')
        source_sizes.append(len(body))
        visible = re.sub(r'<!--[\s\S]*?-->', lambda match: ' ' * len(match[0]), text).replace('\ufeff', ' ')
        redirects += int(bool(re.match(r'^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b', visible,
                                      re.IGNORECASE | re.ASCII)))
        page = read(directory / 'pages' / (str(identity[0]) + '_' + str(identity[1]) + '.json'))
        require((page.get('pageid'), page.get('revid')) == identity and
                page.get('sourceSha256') == row['sha256'] and page.get('namespace') == 0,
                'A private page receipt identifies a different revision')
        require(page.get('sourceVerified') is True, 'A page receipt has no verified source')
        require(integer(page.get('checks')), 'A page receipt has an invalid check count')
        checks += page['checks']
        changed += int(bool(page['core'].get('changed')))
        confirmed += int(bool(page.get('biography', {}).get('confirmed')))
        candidate += int(bool(page.get('biography', {}).get('candidate')))
        network += page.get('networkRequests', 0)
        baseline = page.get('baseline', {}).get('failures', [])
        for failure in page.get('failures', []):
            require(failure.get('check') in known_checks, 'An unknown failure label cannot be published')
            require(failure.get('fingerprint') == fingerprint(failure), 'A current failure fingerprint changed')
            for old in baseline:
                require(old.get('fingerprint') == fingerprint(old), 'A baseline failure fingerprint changed')
            matching = [old for old in baseline if old['check'] == failure['check']
                        and old.get('bundle') == failure.get('bundle')]
            expected = ('preexisting-exact' if any(old['fingerprint'] == failure['fingerprint'] for old in matching)
                        else 'baseline-also-fails-different-evidence' if matching else 'new')
            require(failure.get('classification') == expected, 'A baseline comparison was misclassified')
            failures += 1
            by_check[failure['check']] += 1
            classifications[expected] += 1
            if expected == 'preexisting-exact':
                failure_pages.add(identity)
                old_check_pages[failure['check']].add(identity)
                old_check_counts[failure['check']] += 1
    exact = classifications['preexisting-exact']
    different = classifications['baseline-also-fails-different-evidence']
    new = classifications['new']
    totals = {'completedPages': len(rows), 'verifiedSourcePages': len(rows), 'plannedPages': len(rows),
              'eligiblePages': len(rows), 'changedPages': changed, 'biographyBoxesConfirmed': confirmed,
              'biographicalCategoryCandidates': candidate, 'sourceBytes': sum(source_sizes), 'checks': checks,
              'failures': failures, 'preexistingExactFailures': exact, 'baselineAlsoFailsDifferentEvidence': different,
              'newFailures': new, 'networkRequests': network}
    for key, value in totals.items():
        require(summary.get(key) == value, 'A corpus aggregate disagrees with verified page receipts: ' + key)
    require(dict(by_check) == summary['byCheck'], 'The per-check failure aggregate differs')
    require(summary.get('timeoutPages') == 0, 'The completed corpus has a timeout')
    require(summary.get('wikipediaWrites') == 0 and network == 0, 'The corpus attempted a network operation')
    expected_status = 'failed' if new or different else 'passed-with-preexisting-findings' if exact else 'passed'
    require(summary['status'] == expected_status, 'The final corpus status differs from verified findings')
    public = {key: summary[key] for key in [
        'version', 'phase', 'status', 'sourceCollectionComplete', 'failedCaptureEntries', 'manifestPages',
        'excludedMissingOrOtherNamespaceOrModel', 'timeoutPages', 'startedUTC', 'finishedUTC',
        'elapsedMilliseconds', 'parallelWorkers', 'wikipediaWrites']}
    public.update(totals)
    public.update(kind='anonymized-full-page-corpus', sourceCorpusSha256=summary['corpusSha256'],
                  runnerSha256=summary['runnerSha256'],
                  runtimeSha256={key: settings['hashes'][key] for key in ['core', 'complete']},
                  baselineRuntimeSha256={key: settings['hashes'][key] for key in ['baseline', 'baselineComplete']},
                  catalogSha256=settings['hashes']['coreData'], byCheck=dict(by_check),
                  preexistingFindingPages=len(failure_pages),
                  preexistingByCheck={key: {'pages': len(old_check_pages[key]), 'bundleFindings': old_check_counts[key]}
                                      for key in sorted(old_check_counts)},
                  sourceSize={'pagesOver100000Bytes': sum(size > 100000 for size in source_sizes),
                              'pagesOver102400Bytes': sum(size > 102400 for size in source_sizes),
                              'maximumBytes': max(source_sizes, default=0),
                              'medianBytes': statistics.median(source_sizes) if source_sizes else 0},
                  recognizedRedirectPages=redirects, pagesWithoutRecognizedRedirect=len(rows) - redirects,
                  coveragePolicy='Todas as páginas elegíveis do histórico coletado entraram nos testes. A identificação de biografias é uma contagem adicional e não um filtro de seleção.',
                  baselineComparisonMethod='Cada achado foi executado novamente nas duas distribuições da versão anterior, usando a mesma fonte verificada e as mesmas opções. A classificação preexistente exige a mesma verificação, distribuição e evidência exata.',
                  privacyPolicy='O agregado contém somente contagens, hashes e descrições do método. Não contém títulos, identificadores de páginas, fontes dos artigos, caminhos locais ou detalhes dos achados.')
    return public


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    options = parser.parse_args()
    result = aggregate(options.input)
    output = Path(options.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + '.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(output)
    print(json.dumps({key: result[key] for key in ['status', 'completedPages', 'newFailures',
                                                  'preexistingExactFailures', 'baselineAlsoFailsDifferentEvidence']}))


if __name__ == '__main__':
    main()
