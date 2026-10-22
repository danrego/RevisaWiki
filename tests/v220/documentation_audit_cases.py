"""Counterexamples for documentation auditing, using fictional release records."""
from pathlib import Path
from contextlib import ExitStack
from unittest.mock import patch
import importlib
import json
import re
import shutil
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from delivery_tools import DeliveryTools, REPO

sys.path.insert(0, str(REPO / 'scripts'))
audit_module = importlib.import_module('audit_documentation_v2200')
index_module = importlib.import_module('build_index_v2200')


class DocumentationAudit(unittest.TestCase):
    def setUp(self):
        self.fixture = DeliveryTools('test_manifest_matches_all_files')
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.root = self.fixture.root
        self.docs = self.fixture.manual
        self.dist = self.fixture.dist
        current = REPO / 'docs/2.20.0/Documentacao_RevisaWiki_v2_20_0.wiki'
        self.manual = self.docs / current.name
        self.manual.write_bytes(current.read_bytes())
        older = self.root / 'docs/2.19.1'
        older.mkdir(parents=True)
        shutil.copyfile(REPO / 'docs/2.19.1/Documentacao_RevisaWiki_v2_19_1.wiki',
                        older / 'Documentacao_RevisaWiki_v2_19_1.wiki')
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        for name, value in [('ROOT', self.root), ('DOCS', self.docs), ('DIST', self.dist)]:
            self.stack.enter_context(patch.object(audit_module, name, value))
        self.rebuild()

    def rebuild(self):
        index_module.build_index(self.dist)

    def result(self, name):
        report = audit_module.audit()
        values = [row['passed'] for row in report['results'] if row['name'] == name]
        self.assertEqual(len(values), 1, 'The intended audit check must exist exactly once')
        return values[0]

    def mutate_payload(self, change):
        index = self.dist / 'INICIO.html'
        text = index.read_text(encoding='utf-8')
        pattern = r'(<script type="application/json" id="payloads">)([\s\S]*?)(</script>)'
        match = re.search(pattern, text)
        payloads = json.loads(match[2])
        change(payloads)
        index.write_text(text[:match.start(2)] + json.dumps(payloads, ensure_ascii=False) +
                         text[match.end(2):], encoding='utf-8')

    def test_exact_text_preserves_carriage_returns(self):
        file = self.root / 'literal.txt'
        file.write_bytes(b'first\r\n\r\nlast\r\n')
        self.assertEqual(audit_module.read_exact_text(file).encode(), file.read_bytes())

    def test_historical_entries_are_compared_without_newline_normalization(self):
        name = 'Published earlier history remains byte-identical'
        self.assertTrue(self.result(name))
        raw = self.manual.read_bytes()
        start = raw.index(b'=== 2.19.1 ===')
        changed = raw[:start] + raw[start:].replace(b'\n', b'\r\n')
        self.manual.write_bytes(changed)
        self.rebuild()
        self.assertFalse(self.result(name))

    def test_a_missing_optional_card_fails_the_seven_card_contract(self):
        name = 'Exactly the seven reviewed installation cards are present'
        self.assertTrue(self.result(name))
        self.mutate_payload(lambda payload: payload.pop('chamada-propria'))
        self.assertFalse(self.result(name))

    def test_nonempty_wrong_destination_is_rejected(self):
        name = 'Reviewed filename and destination: programa'
        self.assertTrue(self.result(name))
        self.mutate_payload(lambda payload: payload['programa'].update(destination='Página fictícia incorreta'))
        self.assertFalse(self.result(name))

    def test_nonempty_wrong_summary_is_rejected(self):
        name = 'Reviewed edit summary: programa'
        self.assertTrue(self.result(name))
        self.mutate_payload(lambda payload: payload['programa'].update(summary='Resumo fictício incorreto'))
        self.assertFalse(self.result(name))

    def test_preview_is_not_a_final_qualified_index(self):
        name = 'The audited index is a qualified release, not a preview'
        self.assertTrue(self.result(name))
        metadata = self.dist / 'MANIFESTO.json'
        value = json.loads(metadata.read_text())
        value['status'] = 'local-preview'
        metadata.write_text(json.dumps(value))
        self.assertFalse(self.result(name))

    def test_index_mutation_is_not_hidden_by_other_metadata(self):
        name = 'The index bytes match their delivery record'
        self.assertTrue(self.result(name))
        index = self.dist / 'INICIO.html'
        index.write_bytes(index.read_bytes() + b'\n')
        self.assertFalse(self.result(name))


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(DocumentationAudit)
    result = unittest.TextTestRunner(verbosity=1).run(suite)
    print(json.dumps({'suite': 'v220-documentation-audit-counterexamples',
                      'status': 'passed' if result.wasSuccessful() else 'failed',
                      'tests': result.testsRun, 'failures': len(result.failures),
                      'errors': len(result.errors), 'syntheticPackageFixtures': True,
                      'networkRequests': 0, 'wikipediaWrites': 0}))
    raise SystemExit(0 if result.wasSuccessful() else 1)
