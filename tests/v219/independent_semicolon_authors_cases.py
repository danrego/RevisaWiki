"""Source-only legacy author-list constructor with identity mutations."""
import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('independent_corpus', Path(__file__).with_name('independent_corpus.py'))
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)
class NativeAuthorListTests(unittest.TestCase):
    def pair(self, value='Ana Silva; Bruno Costa', extra=''):
        before = 'Texto.<ref name="fonte">{{Citar jornal|autores=' + value + '|título=Fonte fictícia|url=https://example.org/fonte' + extra + '}}</ref> Outro.<ref name="fonte" />\n{{Referências}}'
        after = before.replace('autores=' + value, 'autor=Ana Silva|autor2=Bruno Costa')
        return before, after
    def test_source_declared_person_list(self):
        before, after = self.pair()
        checks = oracle.compare_sources(before, after)
        self.assertTrue(all(row['status'] != 'failed' for row in checks.values()))
        self.assertTrue(any(repair['kind'] == 'supplied-native-semicolon-author-list' for repair in checks['citation_associations']['declaredRepairs']))
        self.assertFalse(checks['citation_associations']['originalRenderingClaimedEquivalent'])
    def test_changed_person_order_and_neighbor_rejected(self):
        before, after = self.pair()
        for mutant in [after.replace('Ana Silva','Ana Santos'), after.replace('autor=Ana Silva|autor2=Bruno Costa','autor=Bruno Costa|autor2=Ana Silva'), after.replace('Fonte fictícia','Outra fonte'), after.replace('example.org/fonte','example.org/outra'), after.replace('name="fonte"','name="outra"',1)]:
            checks = oracle.compare_sources(before, mutant)
            self.assertTrue(any(row['status'] == 'failed' for row in checks.values()))
    def test_competing_and_blank_author_controls_not_borrowed(self):
        for extra in ['|autor=', '|autor2=', '|ultimo=Silva','|display-authors=','|coautor=Ana Souza']:
            before, after = self.pair(extra=extra)
            checks = oracle.compare_sources(before, after)
            self.assertFalse(any(repair['kind'] == 'supplied-native-semicolon-author-list' for row in checks.values() for repair in row.get('declaredRepairs', [])))
    def test_collective_or_etal_source_not_split_by_model(self):
        for value in ['National Foundation; University Society', 'Ana Silva; et al.', 'Ana Silva; 123 Costa', 'Ana Silva; [[Bruno Costa]]']:
            before, after = self.pair(value=value)
            checks = oracle.compare_sources(before, after)
            self.assertFalse(any(repair['kind'] == 'supplied-native-semicolon-author-list' for row in checks.values() for repair in row.get('declaredRepairs', [])))

    def test_inverted_supplied_people_remain_whole(self):
        for first, second in [('Silva, Ana', 'Costa, Bruno'), ('Silva de Souza, Ana Maria', "D'Ávila, B. C."), ('Mareš, Jiří', 'Łukasik, Zofia'), ('Ana Silva', 'Costa, Bruno')]:
            before, _ = self.pair(value=first + '; ' + second)
            after = before.replace('autores=' + first + '; ' + second, 'autor=' + first + '|autor2=' + second)
            checks = oracle.compare_sources(before, after)
            self.assertTrue(all(row['status'] != 'failed' for row in checks.values()))
            self.assertTrue(any(repair['kind'] == 'supplied-native-semicolon-author-list' for repair in checks['citation_associations']['declaredRepairs']))
            self.assertFalse(checks['citation_associations']['originalRenderingClaimedEquivalent'])

    def test_inverted_name_content_order_and_neighbors_bound(self):
        before, _ = self.pair(value='Silva, Ana; Costa, Bruno', extra='|ano=2020|página=12')
        after = before.replace('autores=Silva, Ana; Costa, Bruno', 'autor=Silva, Ana|autor2=Costa, Bruno')
        for mutant in [after.replace('Silva, Ana', 'Ana Silva'), after.replace('autor=Silva, Ana|autor2=Costa, Bruno', 'autor=Costa, Bruno|autor2=Silva, Ana'), after.replace('ano=2020', 'ano=2021'), after.replace('página=12', 'página=13'), after.replace('Fonte fictícia', 'Outra fonte'), after.replace('example.org/fonte', 'example.org/outra')]:
            self.assertTrue(any(row['status'] == 'failed' for row in oracle.compare_sources(before, mutant).values()))

    def test_ambiguous_commas_and_nonpersonal_payload_not_projected(self):
        for value in ['Silva, Ana, Maria; Bruno Costa', 'Silva,; Bruno Costa', ',Ana; Bruno Costa', 'National Foundation, Research; Bruno Costa', 'Silva, Ana; Costa, 123', 'Silva, Ana; [[Costa, Bruno]]', 'Silva, Ana; Costa, Bruno et al.']:
            before, _ = self.pair(value=value)
            first, second = value.split(';', 1)
            after = before.replace('autores=' + value, 'autor=' + first.strip() + '|autor2=' + second.strip())
            self.assertFalse(any(repair['kind'] == 'supplied-native-semicolon-author-list' for _, repairs in [oracle.declared_repair_source(before, after)] for repair in repairs))

    def test_inverted_names_keep_competing_blank_controls(self):
        for extra in ['|autor=', '|authors=', '|autor2=', '|display-authors=', '|colaboração=']:
            before, _ = self.pair(value='Silva, Ana; Costa, Bruno', extra=extra)
            after = before.replace('autores=Silva, Ana; Costa, Bruno', 'autor=Silva, Ana|autor2=Costa, Bruno')
            self.assertFalse(any(repair['kind'] == 'supplied-native-semicolon-author-list' for _, repairs in [oracle.declared_repair_source(before, after)] for repair in repairs))
if __name__ == '__main__':
    unittest.main()
