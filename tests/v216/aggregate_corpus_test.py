"""Fictional provenance and privacy checks for the corpus aggregate utility."""
from pathlib import Path
import argparse
import copy
import gzip
import hashlib
import importlib.util
import io
import json
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
TOOL = ROOT / 'scripts/aggregate_corpus_v2160.py'
SPEC = importlib.util.spec_from_file_location('corpus_aggregate', TOOL)
aggregate_module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(aggregate_module)


def sha(value):
    return hashlib.sha256(value).hexdigest()


class AggregateCorpusChecks(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='corpus-aggregate-check-')
        self.root = Path(self.temporary.name)
        self.private = self.root / 'private'
        self.private.mkdir()
        (self.private / 'pages').mkdir()
        runtime = self.private / 'runtime'
        runtime.mkdir()
        self.corpus = self.root / 'captures'
        self.corpus.mkdir()
        self.settings = {'manifest': str(self.corpus / 'manifest.json'),
                         'runnerSha256': 'a' * 64, 'hashes': {}}
        for key, name in [('core', 'Core.js'), ('complete', 'Complete.js'),
                          ('baseline', 'Baseline.js'), ('baselineComplete', 'BaselineComplete.js')]:
            file = runtime / name
            file.write_text('immutable fictional runtime ' + key)
            self.settings[key] = str(file)
            self.settings['hashes'][key] = sha(file.read_bytes())
        for owner, key in [('core', 'coreData'), ('baseline', 'baselineData')]:
            file = Path(self.settings[owner]).with_name(Path(self.settings[owner]).name.replace('.js', '_dados.js'))
            file.write_text('immutable fictional data ' + key)
            self.settings['hashes'][key] = sha(file.read_bytes())
        self.source = b'#REDIRECT [[PRIVATE TARGET SENTINEL]]\n'
        packed = gzip.compress(self.source, mtime=0)
        (self.corpus / 'source.wiki.gz').write_bytes(packed)
        self.row = {'pageid': 1, 'revid': 2, 'namespace': 0, 'title': 'PRIVATE TITLE SENTINEL',
                    'file': 'source.wiki.gz', 'bytes': len(self.source), 'sha256': sha(self.source),
                    'gzipSha256': sha(packed), 'contentModel': 'wikitext'}
        manifest = {'pages': [self.row], 'complete': True, 'historyComplete': True, 'failed': []}
        manifest_bytes = json.dumps(manifest).encode()
        Path(self.settings['manifest']).write_bytes(manifest_bytes)
        self.page = {'pageid': 1, 'revid': 2, 'namespace': 0, 'title': self.row['title'],
                     'sourceSha256': self.row['sha256'], 'sourceVerified': True, 'checks': 16,
                     'core': {'changed': True}, 'complete': {'changed': True},
                     'biography': {'confirmed': True, 'candidate': True}, 'networkRequests': 0, 'failures': []}
        self.summary = {
            'version': '2.16.0', 'phase': 'final', 'status': 'passed', 'corpusSha256': sha(manifest_bytes),
            'runnerSha256': self.settings['runnerSha256'], 'runtimeSha256': self.settings['hashes'],
            'sourceHistoryComplete': True, 'sourceCollectionComplete': True, 'failedCaptureEntries': 0,
            'manifestPages': 1, 'eligiblePages': 1, 'excludedMissingOrOtherNamespaceOrModel': 0,
            'plannedPages': 1, 'completedPages': 1, 'verifiedSourcePages': 1, 'changedPages': 1,
            'biographyBoxesConfirmed': 1, 'biographicalCategoryCandidates': 1, 'sourceBytes': len(self.source),
            'checks': 16, 'failures': 0, 'newFailures': 0, 'preexistingExactFailures': 0,
            'baselineAlsoFailsDifferentEvidence': 0, 'byCheck': {}, 'timeoutPages': 0,
            'networkRequests': 0, 'wikipediaWrites': 0, 'startedUTC': '2026-01-01T00:00:00.000Z',
            'finishedUTC': '2026-01-01T00:00:01.000Z', 'elapsedMilliseconds': 1000,
            'parallelWorkers': 1, 'extraPrivateMetadata': 'PRIVATE METADATA SENTINEL'}
        self.run = {'settings': self.settings, 'manifestSha256': sha(manifest_bytes),
                    'planned': [{key: self.row[key] for key in ['pageid', 'revid', 'sha256']}]}
        self.save()

    def tearDown(self):
        self.temporary.cleanup()

    def save(self):
        for file, value in [('RUN_PRIVATE.json', self.run), ('SUMMARY.json', self.summary),
                            ('pages/1_2.json', self.page)]:
            (self.private / file).write_text(json.dumps(value))

    def add_exact_finding(self):
        failure = {'check': 'preservation-audit', 'details': ['PRIVATE EVIDENCE SENTINEL'], 'bundle': 'core'}
        failure.update(fingerprint=aggregate_module.fingerprint(failure), classification='preexisting-exact')
        self.page['failures'] = [failure]
        self.page['baseline'] = {'failures': [copy.deepcopy(failure)]}
        self.summary.update(status='passed-with-preexisting-findings', failures=1,
                            preexistingExactFailures=1, byCheck={'preservation-audit': 1})
        self.save()

    def test_verified_counts_and_redirects(self):
        result = aggregate_module.aggregate(self.private)
        self.assertEqual(result['completedPages'], 1)
        self.assertEqual(result['recognizedRedirectPages'], 1)
        self.assertEqual(result['pagesWithoutRecognizedRedirect'], 0)
        self.assertEqual(result['sourceSize']['maximumBytes'], len(self.source))

    def test_no_private_metadata_or_evidence_is_published(self):
        self.add_exact_finding()
        encoded = json.dumps(aggregate_module.aggregate(self.private))
        for marker in ['PRIVATE TITLE SENTINEL', 'PRIVATE TARGET SENTINEL', 'PRIVATE METADATA SENTINEL',
                       'PRIVATE EVIDENCE SENTINEL', str(self.root), 'pageid', 'revid']:
            self.assertNotIn(marker, encoded)

    def test_exact_baseline_comparison_has_no_forced_finding_count(self):
        self.add_exact_finding()
        result = aggregate_module.aggregate(self.private)
        self.assertEqual(result['preexistingFindingPages'], 1)
        self.assertEqual(result['preexistingExactFailures'], 1)
        self.assertEqual(result['preexistingByCheck']['preservation-audit'], {'pages': 1, 'bundleFindings': 1})

    def test_misclassification_is_rejected(self):
        self.add_exact_finding()
        self.page['failures'][0]['classification'] = 'new'
        self.save()
        with self.assertRaisesRegex(ValueError, '^A baseline comparison was misclassified$'):
            aggregate_module.aggregate(self.private)

    def test_modified_capture_is_rejected(self):
        (self.corpus / 'source.wiki.gz').write_bytes(gzip.compress(b'Changed fictional capture', mtime=0))
        with self.assertRaisesRegex(ValueError, '^A captured revision changed$'):
            aggregate_module.aggregate(self.private)

    def test_incomplete_page_coverage_is_rejected(self):
        self.summary['completedPages'] = 0
        self.save()
        with self.assertRaisesRegex(ValueError, '^A corpus aggregate disagrees with verified page receipts: completedPages$'):
            aggregate_module.aggregate(self.private)

    def test_modified_runtime_is_rejected(self):
        Path(self.settings['core']).write_text('Changed fictional runtime')
        with self.assertRaisesRegex(ValueError, '^An immutable runtime snapshot changed$'):
            aggregate_module.aggregate(self.private)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output')
    options = parser.parse_args()
    stream = io.StringIO()
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(AggregateCorpusChecks)
    result = unittest.TextTestRunner(stream=stream).run(suite)
    failures = [{'case': test.id().rsplit('.', 1)[-1], 'tracebackSha256': sha(text.encode())}
                for test, text in result.failures + result.errors]
    report = {'version': '2.16.0', 'kind': 'anonymous-corpus-aggregate-selfcheck',
              'status': 'passed' if result.wasSuccessful() else 'failed', 'cases': result.testsRun,
              'checks': result.testsRun, 'failures': failures, 'toolQaOnly': True, 'usesActualCorpus': False,
              'runnerSha256': sha(Path(__file__).read_bytes()), 'aggregateUtilitySha256': sha(TOOL.read_bytes()),
              'networkRequests': 0, 'wikipediaWrites': 0}
    if options.output:
        output = Path(options.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))
    raise SystemExit(0 if result.wasSuccessful() else 1)


if __name__ == '__main__':
    main()
