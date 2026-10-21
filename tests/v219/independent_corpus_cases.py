#!/usr/bin/env python3
"""Fictional positive and mutation cases for the independent AST oracle."""
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("independent_corpus", Path(__file__).with_name("independent_corpus.py"))
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)


class OracleCases(unittest.TestCase):
    def test_exact_unclosed_italic_reference_ast_recovery_is_ambiguity(self):
        body = 'Fonte A. [https://example.invalid/a "Título literal"]. '+"''"+'Publicação literal, 2001'
        before = '<ref name="a"/>\n\nTexto. '+"''literal''"+'.\n\n<ref name="a">'+body+'</ref>\n{{Referências}}'
        after = '<ref name="a">'+body+'</ref>\n\nTexto. '+"''literal''"+'.\n\n<ref name="a"/>\n{{Referências}}'
        for invariant in ['reference_bindings', 'reference_lists']:
            checked = oracle.compare_sources(before, after)[invariant]
            self.assertEqual(checked['status'], 'ambiguous')
            self.assertEqual(checked['metrics']['rawItalicRecoveryBoundary']['exactOrderedRawAssociations'], 2)
            self.assertEqual(checked['metrics']['rawItalicRecoveryBoundary']['sourceRawAssociationSha256'], checked['metrics']['rawItalicRecoveryBoundary']['outputRawAssociationSha256'])
        first = oracle.reference_inventory(oracle.mw.parse(before))[0]
        for changed in [after.replace('Fonte A.', 'Fonte B.'), after.replace('example.invalid/a', 'example.invalid/b'), after.replace('Título literal', 'Outro título'), after.replace('name="a"', 'name="b"', 1), after.replace('<ref name="a"/>', '<ref group="n" name="a"/>'), after.replace('{{Referências}}', '{{Referências|grupo=n}}'), after.replace('<ref name="a"/>', '<ref name="b"/>'), after.replace('\n{{Referências}}', '').replace('Texto.', '{{Referências}}\nTexto.'), after.replace('<ref name="a"/>', '<ref name="a"/><ref name="a"/>')]:
            current = oracle.reference_inventory(oracle.mw.parse(changed))[0]
            self.assertIsNone(oracle.literal_reference_italic_recovery(before, changed, first, current))
            for invariant in ['reference_bindings', 'reference_lists']:
                self.assertNotIn('rawItalicRecoveryBoundary', oracle.compare_sources(before, changed)[invariant]['metrics'])
        closed = before.replace("''Publicação", "''Publicação''")
        self.assertIsNone(oracle.literal_reference_italic_recovery(closed, closed, oracle.reference_inventory(oracle.mw.parse(closed))[0], oracle.reference_inventory(oracle.mw.parse(closed))[0]))

    def test_native_note_helpers_retain_selected_named_source(self):
        for helper, group in [('{{Refn|name=beta}}', ''), ('{{Nre|name=beta|group=nota}}', 'nota'), ('{{Efn|name=beta|group=nota}}', 'nota'), ('{{#tag:ref||name=beta}}', '')]:
            attr = ' group="'+group+'"' if group else ''
            source = 'A.<ref name="alpha"'+attr+'>Fonte literal.</ref> B.<ref name="beta"'+attr+'>Fonte literal.</ref> C.<code>'+helper+'</code>{{Referências'+('|grupo='+group if group else '')+'}}'
            bad = source.replace('<ref name="beta"'+attr+'>Fonte literal.</ref>', '<ref name="alpha"'+attr+'/>')
            for check in ['reference_bindings', 'reference_lists']:
                self.assertEqual(self.status(source, source, check), 'passed')
                self.assertEqual(self.status(source, bad, check), 'failed')
        source = 'A.<ref name="a">Fonte literal.</ref>{{Refn|Outra fonte.|name=b}} C.<ref name="b"/>{{Referências}}'
        for bad in [source.replace('Outra fonte.', 'Fonte alterada.'), source.replace('name=b', 'name=c'), source.replace('name=b', 'name=b|group=n')]:
            self.assertEqual(self.status(source, bad, 'reference_bindings'), 'failed')

    def test_native_note_group_fallback_and_literal_body_priority(self):
        for raw, expected in [('{{Nre|name=b|grupo=nota}}', ('b', '', None)), ('{{Nre|Fonte literal.}}', ('', 'lower-alpha', 'Fonte literal.')), ('{{Refn|name=b|Fonte literal.}}', ('b', '', 'Fonte literal.')), ('{{Efn|nome=b|group=inválido}}', ('b', 'lower-alpha', None))]:
            value = oracle.native_note_template(oracle.mw.parse(raw).filter_templates()[0])
            self.assertTrue(value['eligible'])
            self.assertEqual((value['names'][0], value['group'], value['body']), expected)
        for helper in ['{{Refn|name=b|name=}}', '{{Nre|name=b|nome=c}}', '{{Refn|name=b|{{Fonte calculada}}}}']:
            source = '<ref name="b">Fonte literal.</ref>'+helper+'{{Referências}}'
            self.assertEqual(self.status(source, source, 'reference_bindings'), 'ambiguous')
            self.assertEqual(self.status(source, source.replace('Fonte literal.', 'Outra fonte.'), 'reference_bindings'), 'failed')

    def test_generated_native_reference_identity_is_explicitly_opaque(self):
        for head in ['Sfn', 'Sfnp', 'Sfnm', 'Sfnmp', 'HarvRef']:
            source = '<ref name="a">Fonte literal.</ref><code>{{'+head+'|Exemplo|2001|name=a}}</code>{{Referências}}'
            self.assertEqual(self.status(source, source, 'reference_bindings'), 'ambiguous')
            for target in [source.replace('Fonte literal.', 'Outra fonte.'), source.replace('|name=a', '|name=b'), source.replace('{{Referências}}', '{{Referências|grupo=n}}')]:
                self.assertEqual(self.status(source, target, 'reference_bindings'), 'failed')
        source = '<nowiki>{{Sfn|Exemplo|2001}}</nowiki><ref name="a">Fonte literal.</ref>{{Referências}}'
        self.assertEqual(self.status(source, source, 'reference_bindings'), 'passed')

    def test_native_r_template_calls_require_their_selected_definition(self):
        for helper in ['{{r|beta}}', '{{R|beta}}', '{{Referências múltiplas|beta}}', '{{referências__múltiplas|beta}}', '{{R/ref|beta|}}']:
            source = 'A.<ref name="alpha">Fonte literal.</ref> B.<ref name="beta">Fonte literal.</ref> C.'+helper+'{{Referências}}'
            target = source.replace('<ref name="beta">Fonte literal.</ref>', '<ref name="alpha"/>').replace('|beta', '|alpha')
            orphan = source.replace('<ref name="beta">Fonte literal.</ref>', '<ref name="alpha"/>')
            for check in ['reference_bindings', 'reference_lists']:
                self.assertEqual(self.status(source, target, check), 'passed')
                self.assertEqual(self.status(source, orphan, check), 'failed')
        source = 'A.<ref group="n" name="a">Fonte A.</ref> B.<ref group="n" name="b">Fonte B.</ref>{{r|1=a|3=b|grp=n|p=12|q=Trecho literal}}{{Referências|grupo=n}}'
        for bad in [source.replace('grp=n', 'grp=x'), source.replace('1=a|3=b', '1=b|3=a'), source.replace('p=12', 'p=13'), source.replace('Trecho literal', 'Outro trecho')]:
            self.assertEqual(self.status(source, bad, 'reference_bindings'), 'failed')

    def test_native_r_group_priority_scope_and_argument_identity(self):
        for raw, expected in [('{{r|a|b|group=|grp=n|g=x}}', ['']), ('{{r|a|g=n|grupo=ignorado}}', ['n']), ('{{R/ref|a|n|12|Trecho literal}}', ['n'])]:
            value = oracle.native_reference_template(oracle.mw.parse(raw).filter_templates()[0])
            self.assertTrue(value['eligible'])
            self.assertEqual([value['group']], expected)
        for helper in ['{{r|a&amp;b}}', '{{r|a&eacute;b}}', '{{r|{{Nome calculado}}}}', '{{r|a|campo desconhecido=literal}}', '{{R/ref|a}}']:
            source = 'A.<ref name="a">Fonte literal.</ref>'+helper+'{{Referências}}'
            self.assertEqual(self.status(source, source, 'reference_bindings'), 'ambiguous')
            self.assertEqual(self.status(source, source.replace('Fonte literal.', 'Outra fonte.'), 'reference_bindings'), 'failed')
        source = '<ref name="a">Fonte A.</ref>{{r|a}}{{Referências}}<ref name="a">Fonte B.</ref>{{r|a}}{{Referências}}'
        self.assertEqual(self.status(source, source.replace('Fonte A.', 'TEMP').replace('Fonte B.', 'Fonte A.').replace('TEMP', 'Fonte B.'), 'reference_bindings'), 'failed')
        protected = 'A.<ref name="a">Fonte A.</ref><code>{{r|a}}</code>{{Referências}}'
        self.assertEqual(self.status(protected, protected.replace('name="a"', 'name="b"'), 'reference_bindings'), 'failed')

    def test_native_r_in_html_attribute_has_exact_conservative_scope(self):
        source = 'A.<ref name="a">Fonte literal.</ref><span title="{{r|a}}">Texto.</span>{{Referências}}'
        self.assertEqual(self.status(source, source, 'reference_bindings'), 'ambiguous')
        for target in [source.replace('Fonte literal.', 'Outra fonte.'), source.replace('{{r|a}}', '{{r|b}}'), source.replace('<ref name="a">Fonte literal.</ref>', '')]:
            self.assertEqual(self.status(source, target, 'reference_bindings'), 'failed')
        raw = '<nowiki><span title="{{r|a}}">Texto.</span></nowiki>A.<ref name="a">Fonte literal.</ref>{{Referências}}'
        self.assertEqual(self.status(raw, raw, 'reference_bindings'), 'passed')

    def test_native_active_code_reference_reuse_is_observed(self):
        source = 'A.<ref name="a">Fonte A.</ref> B.<ref name="b">Fonte B.</ref><code>Trecho <ref name="a"/> literal.</code>{{Referências}}'
        target = source.replace('name="a">Fonte A.', 'name="b">Fonte A.').replace('name="b">Fonte B.', 'name="a">Fonte B.')
        self.assertEqual(self.status(source, target, 'reference_bindings'), 'failed')
        self.assertEqual(self.status(source, source, 'reference_bindings'), 'passed')
        self.assertEqual(self.status(source, source, 'protected_literals'), 'passed')

    def test_uncertain_native_identity_is_exact_and_never_html5_guessed(self):
        for encoded, literal in [('&#128;', '€'), ('&#13;', ' '), ('&eacute;', 'é'), ('&nbsp;', '\u00a0'), ('&ZeroWidthSpace;', '\u200b')]:
            source = 'A.<ref name="'+encoded+'">Fonte A.</ref> B.<ref name="'+literal+'">Fonte B.</ref> C.<ref name="'+encoded+'"/> D.<ref name="'+literal+'"/>{{Referências}}'
            result = oracle.compare_sources(source, source)['reference_bindings']
            self.assertEqual(result['status'], 'ambiguous')
            self.assertFalse(result['metrics']['uncertainNativeIdentitySubsystemChanged'])
            for changed in [source.replace('>Fonte A.', '>Outra fonte.'), source.replace('name="'+encoded+'">Fonte A.', 'name="'+literal+'">Fonte A.').replace('name="'+literal+'">Fonte B.', 'name="'+encoded+'">Fonte B.'), source.replace('{{Referências}}', '{{Referências|grupo=outro}}')]:
                self.assertEqual(self.status(source, changed, 'reference_bindings'), 'failed')
        source = '<nowiki><ref name="&eacute;">Exemplo.</ref></nowiki>A.<ref name="a">Fonte.</ref>{{Referências}}'
        self.assertEqual(self.status(source, source, 'reference_bindings'), 'passed')

    def test_uncertain_template_reuse_is_conservative_without_raw_entity_decoding(self):
        for emitter in ['{{r|a&eacute;b}}', '{{refn|name=a&eacute;b|Fonte literal.}}', '{{r|a|g=n&nbsp;g}}']:
            source = 'A.<ref name="aéb">Fonte literal.</ref> B.'+emitter+'{{Referências}}'
            result = oracle.compare_sources(source, source)['reference_bindings']
            self.assertEqual(result['status'], 'ambiguous')
            self.assertFalse(result['metrics']['uncertainNativeIdentitySubsystemChanged'])
            for target in [source.replace('>Fonte literal.', '>Outra fonte.'), source.replace(emitter, ''), source.replace('{{Referências}}', '{{Referências|grupo=outro}}')]:
                self.assertEqual(self.status(source, target, 'reference_bindings'), 'failed')
        source = 'A.<ref name="a">Fonte literal.</ref>{{Referências|grupo=n&nbsp;g}}'
        result = oracle.compare_sources(source, source)['reference_bindings']
        self.assertEqual(result['status'], 'ambiguous')
        self.assertEqual(self.status(source, source.replace('Fonte literal.', 'Outra fonte.'), 'reference_bindings'), 'failed')
        raw = '<nowiki>{{r|a&eacute;b}}</nowiki>A.<ref name="a">Fonte.</ref>{{Referências}}'
        self.assertEqual(self.status(raw, raw, 'reference_bindings'), 'passed')

    def test_uncertain_partial_opening_retains_whole_reference_subsystem(self):
        source = 'A.<ref name="a">Fonte literal.</ref>{{Referências}}\n<ref name="a&nbsp;b">Cauda sem fechamento'
        result = oracle.compare_sources(source, source)['reference_bindings']
        self.assertEqual(result['status'], 'ambiguous')
        for changed in [source.replace('Fonte literal.', 'Outra fonte.'), source.replace('a&nbsp;b', 'outro'), source+'<ref name="a"/>']:
            self.assertEqual(self.status(source, changed, 'reference_bindings'), 'failed')
        empty = 'Texto.<ref/> A.<ref name="a&nbsp;b">Fonte literal.</ref>{{Referências}}'
        self.assertEqual(self.status(empty, empty.replace('<ref/>', ''), 'reference_bindings'), 'failed')

    def test_adjacent_reference_cluster_preserves_first_calls_and_position(self):
        source = '{{Info fictícia|campo=Literal}}A.<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref><ref name="a"/> B.<ref name="a"/> C.<ref name="b"/>{{Referências}}'
        target = source.replace('<ref name="b">Fonte B.</ref><ref name="a"/>', '<ref name="b">Fonte B.</ref>')
        for check in ['reference_bindings', 'reference_lists']:
            self.assertEqual(self.status(source, target, check), 'passed')
            self.assertEqual(self.status(source, target.replace('campo=Literal', 'campo=Outro literal'), check), 'passed')
            for bad in [target.replace('Fonte A.', 'Outra fonte.'), target.replace('name="b"', 'name="c"', 1), source.replace('<ref name="a">Fonte A.</ref>', '')]:
                self.assertNotEqual(self.status(source, bad, check), 'passed')
        between = source.replace('<ref name="b">Fonte B.</ref><ref name="a"/>', '<ref name="b">Fonte B.</ref>Outra afirmação.<ref name="a"/>')
        self.assertFalse(any(row['kind'] == 'adjacent-identical-named-reference-selfcall' for row in oracle.declared_repair_source(between, target)[1]))

    def test_adjacent_cluster_can_retain_unrelated_exact_opaque_reference(self):
        opaque = '<ref name="opaque">{{Citar conferência|título=Fonte literal|conferencia=Congresso literal|url=https://example.invalid/fonte}}</ref>'
        source = 'A.<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref><ref name="a"/> B.'+opaque+' C.<ref name="opaque"/>{{Referências}}'
        target = source.replace('<ref name="b">Fonte B.</ref><ref name="a"/>', '<ref name="b">Fonte B.</ref>')
        for check in ['reference_bindings', 'reference_lists']:
            self.assertEqual(self.status(source, target, check), 'passed')
            for bad in [target.replace('Congresso literal', 'Outro congresso'), target.replace('name="opaque">', 'name="outro">'), target.replace('name="opaque">', 'name="opaque" group="nota">'), target.replace('A.<ref name="a">Fonte A.</ref>', 'A.')]:
                self.assertNotEqual(self.status(source, bad, check), 'passed')
        changed = target.replace('Congresso literal', 'Outro congresso')
        self.assertFalse(any(row['kind'] == 'adjacent-identical-named-reference-selfcall' for row in oracle.declared_repair_source(source, changed)[1]))

    def test_bare_url_adjacent_native_maintenance_has_separate_boundary(self):
        source = 'Texto.<ref>https://example.invalid/fonte.doc{{Dead link|date=January 2001|outro=literal}}</ref>{{Referências}}'
        target = source.replace('Dead link|', 'Ligação inativa|')
        for check in ['reference_bindings', 'reference_lists']:
            self.assertEqual(self.status(source, target, check), 'passed')
            for bad in [target.replace('fonte.doc', 'outra.doc'), target.replace('outro=literal', 'outro=alterado'), target.replace('January 2001', 'January 2002')]:
                self.assertEqual(self.status(source, bad, check), 'failed')
        unknown = source.replace('Dead link|', 'Modelo desconhecido|')
        self.assertNotEqual(self.status(unknown, target, 'reference_bindings'), 'passed')

    def test_paired_empty_reference_forms_are_declared_errors(self):
        for empty in ['<ref></ref>', '<ref> </ref>', '<ref>\n</ref>', '<ref>\t \n\t</ref>']:
            source = 'Texto.'+empty+' Outra.<ref>Fonte.</ref>{{Referências}}'
            target = source.replace(empty, '')
            for check in ['reference_bindings', 'reference_lists']:
                self.assertEqual(self.status(source, target, check), 'passed')
                self.assertEqual(self.status(source, target.replace('Fonte.', 'Outra fonte.'), check), 'failed')
        for empty in ['<ref><!--literal--></ref>', '<ref name="a"></ref>', '<ref group="nota"></ref>', '<ref follow="a"></ref>', '<ref details="literal"></ref>', '<ref desconhecido=""></ref>']:
            source = 'Texto.'+empty+' Outra.<ref>Fonte.</ref>{{Referências}}'
            self.assertFalse(any(row['kind'] == 'attribute-free-invalid-empty-reference-removal' for row in oracle.declared_repair_source(source, source.replace(empty, ''))[1]))

    def test_numeric_page_label_keeps_literal_annotation(self):
        source = '{{Citar livro|título=Fonte literal|páginas=Página 41-43 (Tabela II)|ano=2001}}'
        target = source.replace('Página 41-43', '41-43')
        self.assertEqual(self.status(source, target, 'citation_associations'), 'passed')
        for bad in [target.replace('41-43', '41-44'), target.replace('Tabela II', 'Tabela III'), target.replace(' (Tabela II)', ''), target.replace('2001', '2002')]:
            self.assertEqual(self.status(source, bad, 'citation_associations'), 'failed')
        self.assertFalse(oracle.declared_repair_source(source.replace('|ano=', '|nopp=yes|ano='), target)[1])

    def test_pinned_encyclopedia_wrapper_defaults_are_declared(self):
        source = 'Texto.<ref>{{Cite NSRW|wstitle=Entrada fictícia|display=Rótulo literal}}</ref>{{Referências}}'
        citation = "{{Citar enciclopédia|título=[[s:en:The New Student's Reference Work/Entrada fictícia|Rótulo literal]]|enciclopédia=[[s:en:The New Student's Reference Work|The New Student's Reference Work]]|ano=1914|editor-nome=Chandler B.|editor-sobrenome=Beach|local=Chicago|editora=F. E. Compton and Co}}"
        target = source.replace('{{Cite NSRW|wstitle=Entrada fictícia|display=Rótulo literal}}', citation)
        for check in ['reference_bindings', 'reference_lists', 'citation_associations']:
            result = oracle.compare_sources(source, target)[check]
            self.assertEqual(result['status'], 'passed')
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            self.assertTrue(any(row['kind'] == 'pinned-encyclopedia-wrapper-defaults' for row in result['declaredRepairs']))
            for bad in [target.replace('1914', '1915'), target.replace('Chandler B.', 'Outra pessoa'), target.replace('en:The', 'pt:The'), target.replace('Entrada fictícia', 'Outra entrada'), target.replace('Rótulo literal', 'Outro rótulo')]:
                self.assertNotEqual(self.status(source, bad, check), 'passed')
                self.assertFalse(any(row['kind'] == 'pinned-encyclopedia-wrapper-defaults' for row in oracle.declared_repair_source(source, bad)[1]))
        for extra in ['|volume=2', '|wstitle=Outra entrada', '|ref=identidade', '|display=', '|vb=talvez']:
            changed = source.replace('|display=Rótulo literal', '|display=Rótulo literal' + extra)
            self.assertEqual(oracle.declared_repair_source(changed, target)[1], [])
        attributed = source.replace('|display=Rótulo literal', '|display=Rótulo literal|vb=yes')
        prefix = 'Este artigo incorpora texto de uma publicação em [[domínio público]]: '
        with_prefix = target.replace(citation, prefix + citation)
        self.assertEqual(self.status(attributed, with_prefix, 'reference_bindings'), 'passed')
        self.assertEqual(oracle.declared_repair_source(attributed, target)[1], [])

    def test_invalid_empty_reference_cleanup_keeps_remaining_graph(self):
        source = 'Texto.<ref /> Outra frase.<ref name="a">Fonte literal.</ref><ref name="a"/>{{Referências}}'
        target = source.replace('<ref />', '')
        for check in ['reference_bindings', 'reference_lists']:
            result = oracle.compare_sources(source, target)[check]
            self.assertEqual(result['status'], 'passed')
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            self.assertTrue(any(row['kind'] == 'attribute-free-invalid-empty-reference-removal' for row in result['declaredRepairs']))
            for bad in [target.replace('Fonte literal.', 'Outra fonte.'), target.replace('name="a"', 'name="b"'), target.replace('<ref name="a"/>', ''), target.replace('{{Referências}}', '{{Referências|grupo=nota}}')]:
                self.assertEqual(self.status(source, bad, check), 'failed')
        for raw in ['<ref name="a"/>', '<ref group="nota"/>', '<ref follow="a"/>', '<ref nome="a"/>', '<ref>Texto.</ref>']:
            self.assertEqual(oracle.declared_repair_source(source.replace('<ref />', raw), target)[1], [])
        for start, end in [('<nowiki>', '</nowiki>'), ('{{Modelo desconhecido|', '}}')]:
            self.assertEqual(oracle.declared_repair_source(start + source + end, start + target + end)[1], [])

    def test_unstructured_authors_marker_preserves_its_distinct_native_role(self):
        source = '{{Citar periódico|título=Fonte literal|autores=Pessoa, A.; Outra, B., et al.|ano=2001}}'
        target = source.replace('Outra, B., et al.', 'Outra, B.').replace('|ano=', '|numero-autores=et al|ano=')
        result = oracle.compare_sources(source, target)['citation_associations']
        self.assertEqual(result['status'], 'passed')
        self.assertTrue(result['declaredRepairs'])
        for bad in [target.replace('|autores=', '|autor='), target.replace('Pessoa, A.', 'Pessoa, C.'), target.replace('2001', '2002')]:
            self.assertEqual(self.status(source, bad, 'citation_associations'), 'failed')
        for competing in ['|autor=', '|last=Outra pessoa', '|vauthors=', '|coautores=', '|collaboration=', '|display-authors=']:
            before = source.replace('|ano=', competing + '|ano=')
            self.assertEqual(oracle.declared_repair_source(before, target)[1], [])
        self.assertEqual(self.status('{{Citar web|título=Fonte|autores=Pessoa literal}}', '{{Citar web|título=Fonte|autor=Pessoa literal}}', 'citation_associations'), 'failed')

    def test_crossed_ast_reference_boundary_stays_explicitly_ambiguous(self):
        source = '<ref>{{Citar web|título=Texto </ref> atravessado|url=https://example.invalid/fonte}}</ref>{{Referências}}'
        checks = oracle.compare_sources(source, source)
        self.assertEqual(checks['citation_associations']['status'], 'ambiguous')
        self.assertTrue(any('crosses a literal reference closing boundary' in reason for reason in checks['citation_associations']['ambiguities']))
        literal = '{{Citar web|título=Texto <nowiki></ref></nowiki> literal|url=https://example.invalid/fonte}}'
        self.assertFalse(any('crosses a literal reference closing boundary' in reason for reason in oracle.citation(oracle.mw.parse(literal).filter_templates()[0])[1]))

    def test_declared_span_separator_retains_full_table_endpoint(self):
        source = '{| class="wikitable"\n! style="color:red" | Primeiro\n! rowspan="3" Cabeçalho literal\n|-\n|A\n|-\n|B\n|-\n|C\n|}'
        target = source.replace('rowspan="3" Cabeçalho', 'rowspan="3" | Cabeçalho')
        result = oracle.compare_sources(source, target)['table_cells']
        self.assertEqual(result['status'], 'passed')
        self.assertFalse(result['originalRenderingClaimedEquivalent'])
        self.assertTrue(any(row['kind'] == 'supplied-positive-span-missing-separator' for row in result['declaredRepairs']))
        for bad in [target.replace('rowspan="3"', 'rowspan="2"'), target.replace('Cabeçalho literal', 'Outro cabeçalho'), target.replace('|B', '|D'),
                    target.replace('color:red', 'color:blue'), target.replace('class="wikitable"', 'class="outra"'), target.replace('|A\n|-\n|B', '|B\n|-\n|A')]:
            self.assertEqual(self.status(source, bad, 'table_cells'), 'failed')
        for prefix, suffix in [('<nowiki>', '</nowiki>'), ('{{Modelo desconhecido|', '}}')]:
            self.assertEqual(oracle.declared_repair_source(prefix + source + suffix, prefix + target + suffix)[1], [])

    def test_span_separator_projection_selects_only_complete_witnessed_tables(self):
        table = '{| class="wikitable"\n! rowspan="2" Cabeçalho literal\n|-\n|A\n|-\n|B\n|}'
        other = table.replace('Cabeçalho literal', 'Outro cabeçalho')
        source = table+'\nTexto entre tabelas.\n'+other
        target = table.replace('rowspan="2" Cabeçalho', 'rowspan="2" | Cabeçalho')+'\nTexto entre tabelas.\n'+other
        result = oracle.compare_sources(source, target)['table_cells']
        self.assertEqual(result['status'], 'passed')
        repairs = [row for row in result['declaredRepairs'] if row['kind'] == 'supplied-positive-span-missing-separator']
        self.assertEqual(len(repairs), 1)
        self.assertEqual(len(repairs[0]['edits']), 1)
        for bad in [target.replace('|A', '|C', 1), target.replace('Outro cabeçalho', 'Nome alterado'), target.replace('rowspan="2" |', 'rowspan="3" |')]:
            self.assertEqual(self.status(source, bad, 'table_cells'), 'failed')
        added = oracle.compare_sources(source, target.replace('Texto entre tabelas.', 'Texto entre tabelas.\n'+other))['table_cells']
        self.assertEqual(added['status'], 'ambiguous')
        self.assertTrue(any('table split' in reason for reason in added['ambiguities']))

    def test_duplicate_empty_wiki_marker_recovery_keeps_italic_cell(self):
        source = '{| class="wikitable"\n! Ano !! Título\n|-\n|2001||\'\'Obra fictícia\n|-\n|-\n|2002||Outra obra\n|}'
        target = source.replace('|-\n|-\n', '|-\n')
        self.assertEqual(self.status(source, target, 'table_cells'), 'passed')
        for bad in [target.replace('Obra fictícia', 'Outra criação'), target.replace('2002', '2003'), target.replace('|2002||Outra obra', '|Outra obra||2002')]:
            self.assertEqual(self.status(source, bad, 'table_cells'), 'failed')
        protected = source.replace("''Obra fictícia", '<nowiki>\n|-\n|-\n</nowiki>')
        self.assertEqual(oracle.native_table_line_reset_view(protected), protected)

    def test_finite_native_display_redirects_keep_complete_arguments(self):
        for source, target in [('citation needed', 'Carece de fontes'), ('fact', 'Carece de fontes'), ('Seealso', 'Ver também'), ('See also', 'Ver também')]:
            before = '{| class="wikitable"\n! Cabeçalho\n|-\n| {{' + source + '|Assunto literal|prefixo=Veja|date=agosto de 2020}}\n|}'
            after = before.replace(source, target)
            self.assertEqual(self.status(before, after, 'table_cells'), 'passed')
            for bad in [after.replace('Assunto literal', 'Outro assunto'), after.replace('Veja', 'Leia'), after.replace('2020', '2021')]:
                self.assertEqual(self.status(before, bad, 'table_cells'), 'failed')
        before = '{| class="wikitable"\n! Cabeçalho\n|-\n| {{azul|Texto literal [[Destino]]}}\n|}'
        after = before.replace('{{azul|', '{{Cor do texto|blue|')
        self.assertEqual(self.status(before, after, 'table_cells'), 'passed')
        for bad in [after.replace('blue', 'red'), after.replace('Texto literal', 'Outro texto'), after.replace('Destino', 'Outro destino'), after.replace('}}', '|estilo=display:none}}')]:
            self.assertEqual(self.status(before, bad, 'table_cells'), 'failed')

    def test_adjacent_native_collector_layout_has_exact_transaction(self):
        source = 'Texto.<ref>Fonte um.</ref> Nota.<ref group=nota>Nota literal.</ref> Outro.<ref>Fonte dois.</ref>\n{{Referências}}\n{{Notas}}'
        target = source.replace('{{Referências}}\n{{Notas}}', '{{Notas e referências}}')
        for check in ['reference_bindings', 'reference_lists']:
            result = oracle.compare_sources(source, target)[check]
            self.assertEqual(result['status'], 'passed')
            self.assertTrue(any(row['kind'] == 'adjacent-native-main-notes-collector-layout' for row in result['declaredRepairs']))
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            for bad in [target.replace('Fonte um.', 'Fonte alterada.'), target.replace('group=nota', 'group=outro'),
                        target.replace('<ref>Fonte dois.</ref>', ''), target.replace('Fonte um.', 'Fonte dois.').replace('Outro.<ref>Fonte dois.', 'Outro.<ref>Fonte um.')]:
                self.assertEqual(self.status(source, bad, check), 'failed')
        distant = source.replace('{{Referências}}\n{{Notas}}', '{{Referências}}\nTexto entre listas.\n{{Notas}}')
        self.assertEqual(oracle.declared_repair_source(distant, target)[1], [])
        controlled = source.replace('{{Referências}}', '{{Referências|grupo=outro}}')
        self.assertEqual(oracle.declared_repair_source(controlled, target)[1], [])

    def test_declared_external_label_linebreak_keeps_every_word(self):
        source = 'Texto.<ref>[https://example.invalid/fonte Título literal\ncom outra linha]</ref>{{Referências}}'
        target = 'Texto.<ref>{{Citar web|url=https://example.invalid/fonte|título=Título literal\ncom outra linha}}</ref>{{Referências}}'
        for check in ['reference_bindings', 'reference_lists', 'citation_associations']:
            result = oracle.compare_sources(source, target)[check]
            self.assertEqual(result['status'], 'passed')
            self.assertTrue(any(row['kind'] == 'malformed-bracket-link-newline' for row in result['declaredRepairs']))
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            for bad in [target.replace('/fonte', '/outra'), target.replace('outra linha', 'linha'), target.replace('literal', 'alterado')]:
                self.assertEqual(self.status(source, bad, check), 'failed')
        nbsp = 'Texto.<ref>[https://example.invalid/fonte\u00a0Título literal\ncom outra linha]</ref>{{Referências}}'
        self.assertEqual(oracle.declared_repair_source(nbsp, target)[1], [])

    def test_exact_local_literature_and_document_redirects_keep_family(self):
        for name, target in [('Literatur', 'Citar livro'), ('Cite document', 'Citar periódico')]:
            source = '{{' + name + '|title=Fonte literal|author=Pessoa Exemplo|year=2001|oclc=12345}}'
            expected = source.replace(name, target)
            self.assertEqual(self.status(source, expected, 'citation_associations'), 'passed')
            for bad in [expected.replace('Pessoa Exemplo', 'Outra pessoa'), expected.replace('year=2001', 'year=2002'),
                        expected.replace('oclc=12345', 'oclc=54321'), expected.replace(target, 'Citar web')]:
                self.assertEqual(self.status(source, bad, 'citation_associations'), 'failed')
        unknown = '{{LITERATUR|title=Fonte literal|year=2001}}'
        self.assertNotEqual(self.status(unknown, '{{Citar livro|title=Fonte literal|year=2001}}', 'citation_associations'), 'passed')

    def test_nested_native_citation_retains_complete_typed_payload(self):
        inner = '{{cite book|title=Livro literal|author=Pessoa Exemplo|year=2001|url=https://example.invalid/fonte|isbn=9780306406157}}'
        native = '{{Citar livro|título=Livro literal|autor=Pessoa Exemplo|ano=2001|url=https://example.invalid/fonte|isbn=9780306406157}}'
        source = 'Texto.<ref>{{Citar livro|título=* ' + inner + '|outros=Nota literal}}</ref>{{Referências}}'
        target = source.replace(inner, native)
        for check in ['reference_bindings', 'reference_lists', 'citation_associations']:
            self.assertEqual(self.status(source, target, check), 'passed')
            for bad in [target.replace('Livro literal', 'Outro livro'), target.replace('ano=2001', 'ano=2002'),
                        target.replace('Pessoa Exemplo', 'Outra pessoa'), target.replace('/fonte', '/outra'),
                        target.replace('9780306406157', '9780306406158'), target.replace('Nota literal', ''), target.replace(native, '')]:
                self.assertEqual(self.status(source, bad, check), 'failed')
        unknown = source.replace('cite book', 'Modelo desconhecido')
        self.assertEqual(self.status(unknown, target, 'citation_associations'), 'ambiguous')

    def test_native_column_wrapper_only_emits_its_selected_content(self):
        body = '<ref name=a>Fonte literal.</ref>'
        source = '{{Colunas-lista|1=2|2=Texto.' + body + '}}\n{{Referências}}'
        inventory, uncertainty = oracle.reference_inventory(oracle.mw.parse(source))
        self.assertEqual(uncertainty, [])
        self.assertEqual(inventory['rawMarkers'], 1)
        self.assertEqual(self.status(source, source.replace('Fonte literal', 'Outra fonte'), 'reference_bindings'), 'failed')
        for source in ['{{Colunas-lista|1=Texto.' + body + '|2=}}', '{{Colunas-lista|1=2|2=Texto literal|estilo=' + body + '}}']:
            inventory, uncertainty = oracle.reference_inventory(oracle.mw.parse(source))
            self.assertEqual(uncertainty, [])
            self.assertEqual(inventory['rawMarkers'], 0)
        blocked = '{{Colunas-lista|2=' + body + '|2=}}'
        inventory, uncertainty = oracle.reference_inventory(oracle.mw.parse(blocked))
        self.assertIn('reference inside an unexpanded enclosing template', uncertainty)
        source = '{{Colunas-lista|1=2|2=* {{Citar web|título=Fonte literal|autor=Pessoa Exemplo et al.}}}}'
        target = source.replace('Pessoa Exemplo et al.', 'Pessoa Exemplo').replace('|autor=Pessoa Exemplo}}', '|autor=Pessoa Exemplo|numero-autores=et al}}')
        self.assertEqual(self.status(source, target, 'citation_associations'), 'passed')
        unknown = source.replace('Colunas-lista', 'Modelo desconhecido')
        self.assertEqual(self.status(unknown, target.replace('Colunas-lista', 'Modelo desconhecido'), 'citation_associations'), 'failed')

    def test_supplied_etal_keeps_inverted_name_and_initial_prefix(self):
        contract = json.loads(Path(__file__).with_name('native_person_etal_contract.json').read_text())
        for row in contract['unchangedBodyNativeMarkerEquivalence']['examples'][:3]:
            self.assertEqual(self.status(row['before'], row['after'], 'citation_associations'), 'passed')
            for mutant in [row['after'].replace('Exemplo', 'Alterado'), row['after'].replace('autor=', 'editor='), row['after'].replace('et al', '2')]:
                self.assertEqual(self.status(row['before'], mutant, 'citation_associations'), 'failed')
        source = '{{Citar periódico|título=Fonte literal|autor=X.-D. Exemplo; et al.|doi=10.1000/fonte}}'
        target = '{{Citar periódico|título=Fonte literal|autor=X.-D. Exemplo|doi=10.1000/fonte|numero-autores=et al}}'
        self.assertEqual(self.status(source, target, 'citation_associations'), 'passed')
        for source in [source.replace('X.-D. Exemplo', 'Instituto Exemplo'), source.replace('|doi=', '|numero-autores=|doi='), source.replace('|doi=', '|autor2=Outra Pessoa|doi=')]:
            self.assertEqual(self.status(source, target, 'citation_associations'), 'failed')

    def test_named_references_use_group_specific_collector_intervals(self):
        source = 'A.<ref name=a>Fonte um.</ref><references/>B.<ref name=a>Fonte dois.</ref><references/>'
        inventory, uncertainty = oracle.reference_inventory(oracle.mw.parse(source))
        self.assertEqual(uncertainty, [])
        self.assertEqual(len(inventory['definitions']), 2)
        self.assertEqual(len(inventory['rawNamedDefinitions']), 2)
        self.assertEqual([row[1] for row in inventory['bindings']], ['resolved', 'resolved'])
        for bad in [source.replace('Fonte dois.', 'Fonte alterada.'), source.replace('B.<ref name=a>Fonte dois.</ref>', 'B.<ref name=a/>'),
                    source.replace('<references/>B.', 'B.', 1)]:
            self.assertEqual(self.status(source, bad, 'reference_bindings'), 'failed')
        after = 'A.<ref name=a>Fonte um.</ref><references/>B.<ref name=a/><references/>'
        inventory, uncertainty = oracle.reference_inventory(oracle.mw.parse(after))
        self.assertEqual(uncertainty, [])
        self.assertEqual(inventory['bindings'][1], ['', 'unresolved', 'a'])
        grouped = 'A.<ref name=a group=n>Fonte um.</ref><references/>B.<ref name=a group=n/><references group=n/>'
        inventory, uncertainty = oracle.reference_inventory(oracle.mw.parse(grouped))
        self.assertEqual(uncertainty, [])
        self.assertEqual([row[1] for row in inventory['bindings']], ['resolved', 'resolved'])

    def test_heading_reference_traversal_preserves_all_ordered_bindings(self):
        source = '== Tema<ref name=a/> ==\nTexto.<ref name=a>Fonte literal.</ref>\n{{Referências}}'
        target = '== Tema<ref name=a>Fonte literal.</ref> ==\nTexto.<ref name=a/>\n{{Referências}}'
        for check in ['reference_bindings', 'reference_lists']:
            self.assertEqual(self.status(source, target, check), 'passed')
            for bad in [target.replace('Fonte literal', 'Outra fonte'), target.replace('name=a', 'name=b', 1),
                        target.replace('name=a>', 'group=n name=a>', 1), target.replace('<ref name=a>Fonte literal.</ref>', '')]:
                self.assertEqual(self.status(source, bad, check), 'failed')

    def test_reference_body_concatenates_adjacent_literal_ast_text(self):
        source = 'Texto.<ref>Os [[Destino|Destinos]] são exemplos.</ref>{{Referências}}'
        target = source.replace('[[Destino|Destinos]]', '[[Destino]]s')
        self.assertEqual(self.status(source, target, 'reference_bindings'), 'passed')
        for bad in [target.replace('s são', 'são'), target.replace('exemplos', 'outros'), target.replace('[[Destino]]', '[[Outro destino]]')]:
            self.assertEqual(self.status(source, bad, 'reference_bindings'), 'failed')

    def test_identical_all_blank_noncontrol_roles_have_no_payload(self):
        source = '{{Citar livro|título=Fonte literal|pp=|páginas=}}'
        target = '{{Citar livro|título=Fonte literal|pp=}}'
        self.assertEqual(self.status(source, target, 'citation_associations'), 'passed')
        for source in ['{{Citar livro|título=Fonte literal|pp=|páginas=2}}', '{{Citar livro|título=Fonte literal|pp=2|páginas=}}']:
            self.assertEqual(self.status(source, '{{Citar livro|título=Fonte literal|pp=2}}', 'citation_associations'), 'failed')
        controls = '{{Citar web|título=Fonte literal|urlmorta=|url-status=}}'
        self.assertEqual(self.status(controls, '{{Citar web|título=Fonte literal}}', 'citation_associations'), 'failed')

    def test_native_linked_media_bare_url_does_not_swallow_option_pipes(self):
        contract = json.loads(Path(__file__).with_name('native_linked_media_contract.json').read_text())
        for row in contract['samples']:
            inventory, uncertainty = oracle.media_inventory(oracle.mw.parse(row['source']))
            self.assertEqual(uncertainty, [])
            self.assertEqual(inventory[0][4], ['link=https://example.invalid/x.png'])
            self.assertEqual(inventory[0][2], [['text', 'Legenda literal.']])
        source = '[[Imagem:Example.jpg|link=https://example.invalid/x.png|thumb|Legenda literal.<ref>{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|data=2001-03-04}}</ref>]]'
        target = source.replace('2001-03-04', '4 de março de 2001')
        inventory, uncertainty = oracle.media_inventory(oracle.mw.parse(source))
        self.assertEqual(uncertainty, [])
        self.assertEqual(inventory[0][4], ['link=https://example.invalid/x.png'])
        self.assertEqual(inventory[0][2], [['text', 'Legenda literal.']])
        self.assertEqual(self.status(source, target, 'media'), 'passed')
        for changed in [target.replace('/x.png', '/outra.png'), target.replace('Example.jpg', 'Outra.jpg'),
                        target.replace('Legenda literal', 'Outra legenda')]:
            self.assertEqual(self.status(source, changed, 'media'), 'failed')
        bad_date = target.replace('4 de março', '5 de março')
        self.assertEqual(self.status(source, bad_date, 'citation_associations'), 'failed')
        self.assertEqual(self.status(source, bad_date, 'reference_bindings'), 'failed')
        bracketed = '[[Imagem:Example.jpg|thumb|[https://example.invalid/a|b Texto literal]]]' 
        self.assertNotEqual(self.status(bracketed, bracketed.replace('/a|b', '/a|c'), 'media'), 'passed')

    def test_exact_native_caption_containers_have_no_broader_text_waiver(self):
        contract = json.loads(Path(__file__).with_name('caption_native_container_contract.json').read_text())
        for row in contract['nativeRenderingPairs']:
            self.assertEqual(self.status(row['source'], row['expected'], 'media'), 'passed')
            for changed in [row['expected'].replace('Example.jpg', 'Outra.jpg'), row['expected'].replace('Legenda literal', 'Outra legenda'),
                            row['expected'].replace('2011', '2012').replace('2001-2002', '2001-2003'),
                            row['expected'].replace('valign=top', 'valign=bottom'), row['expected'].replace('Primeiro', 'Alterado')]:
                if changed != row['expected']:
                    self.assertEqual(self.status(row['source'], changed, 'media'), 'failed')
        source = '[[Imagem:Example.jpg|thumb|{{Modelo desconhecido|data=Janeiro de 2011}}]]'
        self.assertEqual(self.status(source, source.replace('Janeiro', 'janeiro'), 'media'), 'failed')
        for target in ['[[Imagine:Example.jpg|thumb|Legenda]]', '[[:File:Example.jpg]]', '[[File:{{Nome}}.jpg|thumb]]']:
            self.assertNotEqual(self.status(target, target.replace('Imagine:', 'Imagem:').replace(':File:', ':Imagem:').replace('{{Nome}}', 'Nome'), 'media'), 'passed')

    def test_caption_ref_punctuation_can_resolve_same_raw_named_definition(self):
        body = '{{Citar web|título=Publicação literal|url=https://example.invalid/fonte|autor=Pessoa fictícia|data=2001-03-04}}'
        source = '[[Imagem:Example.jpg|thumb|Texto literal<ref name=a/>.Frase seguinte.]] Fora.<ref name=a>' + body + '</ref>{{Referências}}'
        target = '[[Imagem:Example.jpg|thumb|Texto literal.<ref name="a">' + body + '</ref> Frase seguinte.]] Fora.<ref name="a" />{{Referências}}'
        self.assertEqual(self.status(source, target, 'media'), 'passed')
        for changed in [target.replace('/fonte', '/outra'), target.replace('2001-03-04', '2001-03-05'),
                        target.replace('Pessoa fictícia', 'Outra pessoa'), target.replace('name="a"', 'name="b"'),
                        target.replace('name="a"', 'group="n" name="a"'), target.replace('Example.jpg', 'Outra.jpg')]:
            self.assertIsNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(source), oracle.mw.parse(changed)))
        duplicate = source + '<ref name=a>Outra fonte.</ref>'
        self.assertIsNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(duplicate), oracle.mw.parse(target)))
        opaque = '[[Imagem:Example.jpg|thumb|Texto literal<ref name=a/>.Frase seguinte.]]<nowiki><ref name=a>' + body + '</ref></nowiki>'
        self.assertIsNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(opaque), oracle.mw.parse(target)))
        unknown = '[[Imagem:Example.jpg|thumb|Texto literal<ref name=a/>.Frase seguinte.]]{{Modelo desconhecido|<ref name=a>' + body + '</ref>}}'
        self.assertIsNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(unknown), oracle.mw.parse(target)))
        source = '[[Imagem:Example.jpg|thumb|Texto<ref name=a/>.Frase<ref name=b/>]]<ref name=a>Primeira fonte.</ref><ref name=b>Segunda fonte.</ref>'
        target = source.replace('Texto<ref name=a/>.Frase', 'Texto.<ref name=a/> Frase')
        self.assertIsNotNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(source), oracle.mw.parse(target)))
        swapped = target.replace('name=a/>', 'name=temporario/>', 1).replace('name=b/>', 'name=a/>', 1).replace('name=temporario/>', 'name=b/>', 1)
        self.assertIsNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(source), oracle.mw.parse(swapped)))

    def test_caption_ref_punctuation_is_exactly_bound_to_supplied_ref(self):
        source = '[[Imagem:Example.jpg|thumb|Texto literal<ref name="a">Fonte literal.</ref>.Frase seguinte.]]'
        target = '[[Imagem:Example.jpg|thumb|Texto literal.<ref name="a">Fonte literal.</ref> Frase seguinte.]]'
        result = oracle.compare_sources(source, target)['media']
        self.assertEqual(result['status'], 'passed')
        self.assertFalse(result['originalRenderingClaimedEquivalent'])
        for changed in [target.replace('Example.jpg', 'Outra.jpg'), target.replace('Fonte literal', 'Outra fonte'),
                        target.replace('name="a"', 'name="b"'), target.replace('Texto literal', 'Outro texto'),
                        target.replace('Frase seguinte', 'Outra frase'), target.replace('thumb|', 'thumb|alt=Outra descrição|')]:
            self.assertIsNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(source), oracle.mw.parse(changed)))
        plain = '[[Imagem:Example.jpg|thumb|Texto literal.Frase seguinte.]]'
        self.assertIsNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(plain), oracle.mw.parse(plain.replace('.Frase', '. Frase'))))
        unknown = '{{Modelo desconhecido|' + source + '}}'
        self.assertIsNone(oracle.caption_reference_punctuation_projection(oracle.mw.parse(unknown), oracle.mw.parse('{{Modelo desconhecido|' + target + '}}')))

    def test_native_image_child_of_unknown_owner_is_not_assumed_rendered(self):
        before = '{{Modelo desconhecido|{{Info/Biografia|imagem=[[Imagem:Example.jpg|250px]]}}}}'
        after = '{{Modelo desconhecido|{{Info/Biografia|imagem=Example.jpg|imagem_tamanho=250px}}}}'
        self.assertEqual(self.status(before, after, 'media'), 'ambiguous')
        self.assertEqual(self.status(before, before, 'media'), 'ambiguous')

    def test_extra_native_person_image_owners_keep_supplied_fields(self):
        for family in ['Info/Ator', 'Info/Escritor', 'Info/Jornalista']:
            source = '{{' + family + '|nome=Pessoa fictícia|imagem=[[Ficheiro:Example.jpg|200px]]}}'
            target = '{{' + family + '|nome=Pessoa fictícia|imagem=Example.jpg|imagem_tamanho=200px}}'
            self.assertEqual(self.status(source, target, 'media'), 'passed')
            for changed in [target.replace('Example.jpg', 'Outra.jpg'), target.replace('200px', '201px')]:
                self.assertEqual(self.status(source, changed, 'media'), 'failed')
            if family == 'Info/Ator':
                self.assertEqual(self.status(source, target.replace('Pessoa fictícia', 'Outra pessoa'), 'media'), 'failed')
        source = '{{Info/Ator|nome=Pessoa fictícia|imagem=Example.jpg|descrição=|legenda=Legenda literal}}'
        self.assertEqual(self.status(source, source, 'media'), 'ambiguous')

    def test_supplied_native_season_month_range_and_month_first_precision(self):
        for before_value, after_value in [('Verão de 2021', 'verão de 2021'), ('Primavera de 2022', 'primavera de 2022'),
                                           ('Maio–Junho de 2005', 'maio–junho de 2005'), ('janeiro–junho 2017', 'janeiro–junho de 2017'),
                                           ('out.–dez. 2019', 'outubro–dezembro de 2019'), ('Jan. 11, 1927', '1927-01-11'),
                                           ('Março 8, 2011', '2011-03-08')]:
            before = '{{Citar livro|título=Publicação literal|data=' + before_value + '}}'
            after = before.replace(before_value, after_value)
            result = oracle.compare_sources(before, after)['citation_associations']
            self.assertEqual(result['status'], 'passed')
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            self.assertIn('same-supplied-native-date-format', [row['kind'] for row in result['declaredRepairs']])
            for changed in [after.replace('2021', '2022').replace('2022', '2023').replace('2005', '2006').replace('2017', '2018').replace('2019', '2020').replace('1927', '1928').replace('2011', '2012'),
                            after.replace('Publicação literal', 'Outra publicação')]:
                self.assertEqual(self.status(before, changed, 'citation_associations'), 'failed')
        for value in ['junho–janeiro de 2017', 'verão austral de 2021', 'primavera de 21', 'Jan. 32, 1927', 'Março 32, 2011']:
            self.assertIsNone(oracle.extended_native_date(value))
        source = '{{Citar livro|título=Publicação literal|data=Verão de 2021|date=}}'
        mutated = '{{Citar livro|título=Publicação literal|date=verão de 2021|data=}}'
        self.assertEqual(self.status(source, mutated, 'citation_associations'), 'failed')

    def test_native_military_displayed_image_contract_keeps_every_payload(self):
        contract = json.loads(Path(__file__).with_name('military_image_contract.json').read_text())
        for row in contract['nativeRenderingPairs']:
            self.assertEqual(self.status(row['source'], row['expected'], 'media'), 'passed')
            for changed in [row['expected'].replace('Example.jpg', 'Outro.jpg'), row['expected'].replace('200px', '201px'),
                            row['expected'][:-2] + '|alt=Outra descrição}}',
                            row['expected'][:-2] + '|imagem_legenda=Outra legenda}}']:
                self.assertNotEqual(self.status(row['source'], changed, 'media'), 'passed')
        for family in ['Info/Militar', 'Info/Combatente militar']:
            ambiguous = '{{' + family + '|imagem=Example.jpg|imagem_legenda=|legenda=Texto literal}}'
            self.assertEqual(self.status(ambiguous, ambiguous, 'media'), 'ambiguous')

    def test_native_table_header_line_reset_keeps_cells_and_bold(self):
        contract = json.loads(Path(__file__).with_name('table_native_edge_contract.json').read_text())
        row = next(row for row in contract['tablePairs'] if row['id'] == 'open-bold-header')
        self.assertEqual(self.status(row['source'], row['expected'], 'table_cells'), 'passed')
        cells, uncertainty = oracle.table_inventory(oracle.mw.parse(row['source']), row['source'])
        self.assertEqual(uncertainty, [])
        self.assertEqual([cell[0] for cell in cells[0]['cells']], ['th', 'th', 'th', 'td', 'td', 'td'])
        for changed in [row['expected'].replace('Outra pessoa', 'Pessoa alterada'),
                        row['expected'].replace('2006', '2007'), row['expected'].replace("|'''Sistema", '|Sistema', 1),
                        row['expected'].replace('Primeiro||Segundo||Terceiro', 'Segundo||Primeiro||Terceiro')]:
            self.assertEqual(self.status(row['source'], changed, 'table_cells'), 'failed')
        bad = next(row for row in contract['tablePairs'] if row['id'] == 'unclosed-style')
        self.assertEqual(self.status(bad['source'], bad['expected'], 'table_cells'), 'failed')

    def test_table_row_membership_and_empty_marker_scope_are_bound(self):
        source = '{| class="wikitable"\n!A!!B\n|-\n|Primeiro||Segundo\n|-\n|Terceiro||Quarto\n|}'
        moved = source.replace('|Primeiro||Segundo\n|-\n|Terceiro||Quarto', '|Primeiro\n|-\n|Segundo||Terceiro||Quarto')
        self.assertEqual(self.status(source, moved, 'table_cells'), 'failed')
        self.assertEqual(self.status(source, source.replace('|-\n|Terceiro', '|- class="outra"\n|Terceiro'), 'table_cells'), 'failed')
        contract = json.loads(Path(__file__).with_name('table_native_edge_contract.json').read_text())
        row = next(row for row in contract['tablePairs'] if row['id'] == 'consecutive-rows')
        self.assertEqual(self.status(row['source'], row['expected'], 'table_cells'), 'passed')
        marked = row['source'].replace('|-\n|-', '|- class="literal"\n|-')
        self.assertEqual(self.status(marked, row['expected'], 'table_cells'), 'failed')
        html = '<table><tr><td rowspan="2">Primeiro</td></tr><tr></tr></table>'
        self.assertEqual(self.status(html, html.replace('<tr></tr>', ''), 'table_cells'), 'failed')

    def test_native_infobox_image_is_bound_to_displayed_field_roles(self):
        contract = json.loads(Path(__file__).with_name('native_image_caption_contract.json').read_text())
        for row in contract['nativeInfoboxRenderProof']['samples']:
            self.assertEqual(self.status(row['source'], row['expected'], 'media'), 'passed')
            for changed in [row['expected'].replace('Example.jpg', 'Outra.jpg'),
                            row['expected'].replace('250px', '251px').replace('300px', '301px').replace('200px', '201px'),
                            row['expected'][:-2] + '|imagem_legenda=Texto acrescentado}}',
                            row['expected'][:-2] + '|alt=Descrição acrescentada}}']:
                self.assertEqual(self.status(row['source'], changed, 'media'), 'failed')
        for family in ['Info/Biografia', 'Info/Político', 'Info/Música/artista']:
            before = '{{' + family + '|imagem=[[Imagem:Example.jpg|thumb]]|imagem_tamanho=250px|legenda=Legenda literal|alt=Descrição literal}}'
            after = '{{' + family + '|imagem=Example.jpg|imagem_tamanho=250px|legenda=Legenda literal|alt=Descrição literal}}'
            self.assertEqual(self.status(before, after, 'media'), 'passed')
            for changed in [after.replace('Legenda literal', 'Outra legenda'), after.replace('Descrição literal', 'Outra descrição'),
                            after.replace('|imagem_tamanho=250px', ''), after.replace('|legenda=Legenda literal', ''),
                            after.replace('|alt=Descrição literal', '')]:
                self.assertEqual(self.status(before, changed, 'media'), 'failed')
        duplicate = '{{Info/Biografia|imagem=|foto=Example.jpg}}'
        self.assertEqual(self.status(duplicate, duplicate, 'media'), 'ambiguous')
        for bad in ['[[Imagem:Example.jpg|left]]', '[[Imagem:Example.jpg|link=Outra página]]',
                    '[[Imagem:Example.jpg|alt=Descrição literal]]', '[[Imagem:Example.jpg|250px|251px]]']:
            source = '{{Info/Biografia|imagem=' + bad + '}}'
            self.assertEqual(self.status(source, source, 'media'), 'ambiguous')
        before = '{{Info/Biografia|imagem=[[Imagem:Example.jpg|miniaturadaimagem]]}}'
        after = '{{Info/Biografia|imagem=Example.jpg|imagem_legenda=miniaturadaimagem}}'
        self.assertEqual(self.status(before, after, 'media'), 'failed')

    def test_language_wikilink_requires_same_exact_target_and_label(self):
        contract = json.loads(Path(__file__).with_name('citation_language_link_contract.json').read_text())
        for row in contract['bindings']:
            values = ['[[' + row['target'] + '|' + label + ']]' for label in row['labels']]
            if row['bareAllowed']:
                values.append('[[' + row['target'] + ']]')
            else:
                self.assertIsNone(oracle.linked_language('[[' + row['target'] + ']]'))
            for value in values:
                before = "{{Citar web|título=Publicação d'água|url=https://example.invalid/fonte|língua=" + value + '|url-status=live}}'
                after = before.replace('|língua=' + value, '|língua=' + row['code'])
                self.assertEqual(oracle.linked_language(value), row['code'])
                result = oracle.compare_sources(before, after)['citation_associations']
                self.assertEqual(result['status'], 'passed')
                self.assertFalse(result['originalRenderingClaimedEquivalent'])
                self.assertIn('complete-language-wikilink', [repair['kind'] for repair in result['declaredRepairs']])
                for changed in [after.replace("Publicação d'água", 'Outra publicação'), after.replace('/fonte', '/outra'),
                                after.replace('|língua=' + row['code'], '|língua=zz'), after.replace('url-status=live', 'urlmorta=não')]:
                    self.assertEqual(self.status(before, changed, 'citation_associations'), 'failed')
                for bad in [value.replace('[[', '[[Template:', 1), value.replace(']]', '#Fragmento]]'),
                            value.replace(']]', ']] texto'), '<span>' + value + '</span>']:
                    self.assertIsNone(oracle.linked_language(bad))
        for row in contract['preserve']:
            for label in row['labels']:
                self.assertIsNone(oracle.linked_language('[[' + row['target'] + '|' + label + ']]'))

    def test_defaultsort_only_identical_values_and_obsolete_category_are_projected(self):
        source = '{{DEFAULTSORT:Chave fictícia}}\n{{DEFAULTSORT:Chave fictícia}}\n[[Categoria:Exemplo fictício|Ordenação literal]]'
        target = source.replace('{{DEFAULTSORT:Chave fictícia}}\n', '', 1)
        self.assertEqual(self.status(source, target, 'category_sort'), 'passed')
        for changed in [target.replace('Chave fictícia', 'Outra chave'), target.replace('Ordenação literal', 'Outra ordenação'),
                        target.replace('Exemplo fictício', 'Outro exemplo')]:
            self.assertEqual(self.status(source, changed, 'category_sort'), 'failed')
        conflict = '{{DEFAULTSORT:Primeira chave}}\n{{DEFAULTSORT:Última chave}}\n[[Categoria:Exemplo fictício]]'
        self.assertEqual(self.status(conflict, conflict.replace('{{DEFAULTSORT:Primeira chave}}\n', ''), 'category_sort'), 'failed')
        obsolete = '[[Categoria:!Artigos com descrição curta]]'
        source = 'Texto literal.\n' + obsolete + '\n[[Categoria:Exemplo fictício|Ordenação literal]]'
        target = source.replace(obsolete, '')
        result = oracle.compare_sources(source, target)['category_sort']
        self.assertEqual(result['status'], 'passed')
        self.assertFalse(result['originalRenderingClaimedEquivalent'])
        self.assertEqual(result['declaredRepairs'][0]['kind'], 'obsolete-short-description-maintenance-category')
        for changed in [target.replace('Exemplo fictício', 'Outro exemplo'), target.replace('Ordenação literal', 'Outra ordenação')]:
            self.assertEqual(self.status(source, changed, 'category_sort'), 'failed')
        for protected in ['<nowiki>' + obsolete + '</nowiki>', '{{Modelo desconhecido|' + obsolete + '}}',
                          '[[Categoria:!Artigos com descrição curta|Ordenação]]']:
            self.assertEqual(oracle.declared_repair_source(protected, '')[1], [])

    def test_literal_embedded_native_image_caption_uses_its_supplied_payload(self):
        contract = json.loads(Path(__file__).with_name('person_image_extra_owner_contract.json').read_text())
        for row in contract['nativeRenderingPairs']:
            self.assertEqual(self.status(row['source'], row['expected'], 'media'), 'passed')
            for changed in [row['expected'].replace('Example.jpg', 'Outra.jpg'), row['expected'].replace('250px', '251px'),
                            row['expected'].replace('Legenda literal', 'Outra legenda')]:
                if changed != row['expected']:
                    self.assertEqual(self.status(row['source'], changed, 'media'), 'failed')
        before = '{{Info/Biografia|imagem=[[Imagem:Example.jpg|250px|Legenda literal]]|legenda=}}'
        self.assertEqual(self.status(before, before, 'media'), 'ambiguous')
        for caption in ['sinmarco', 'borde', 'THUMB']:
            before = '{{Info/Biografia|imagem=[[Imagem:Example.jpg|250px|' + caption + ']]}}'
            bad = '{{Info/Biografia|imagem=Example.jpg|imagem_tamanho=250px}}'
            self.assertEqual(self.status(before, bad, 'media'), 'failed')

    def test_capture_filter_rejects_revision_suffixes_and_empty_entries(self):
        self.assertEqual(oracle.selected_page_ids('12, 34'), {12, 34})
        self.assertEqual(oracle.selected_page_ids(''), set())
        for invalid in ['12_34', '0', '-1', '12,', ',12', '１２', '12.0']:
            with self.assertRaises(ValueError):
                oracle.selected_page_ids(invalid)

    def test_native_media_caption_containers_preserve_nested_values(self):
        contract = json.loads(Path(__file__).with_name('native_media_container_contract.json').read_text())
        for row in contract['samples']:
            result = oracle.compare_sources(row['source'], row['expected'])['media']
            self.assertEqual(result['status'], 'passed' if row['expectedEquivalence'] else 'failed')
        before = '[[Imagem:Example.jpg|thumb|<ul><li>[[Ficheiro:Example.jpg|16px]] Texto literal</li></ul>]]'
        for changed in [before.replace('Texto literal', 'Texto alterado'), before.replace('Example.jpg', 'Outro.jpg', 1),
                        before.replace('<li>', '<li class="outra">')]:
            self.assertEqual(self.status(before, changed, 'media'), 'failed')

    def test_named_reference_media_relocation_keeps_full_body_and_outside_order(self):
        before = 'A.<ref name="a"/> [[Imagem:Primeira.jpg|thumb|Primeira legenda]] B.<ref name="a">Fonte literal. [[Ficheiro:Example.jpg|50px|alt=Descrição literal]]</ref> [[Imagem:Segunda.jpg|thumb|Segunda legenda]]{{Referências}}'
        after = 'A.<ref name="a">Fonte literal. [[Imagem:Example.jpg|50px|alt=Descrição literal]]</ref> [[Imagem:Primeira.jpg|thumb|Primeira legenda]] B.<ref name="a"/> [[Imagem:Segunda.jpg|thumb|Segunda legenda]]{{Referências}}'
        result = oracle.compare_sources(before, after)['media']
        self.assertEqual(result['status'], 'passed')
        self.assertEqual(result['metrics']['sourceBoundNamedReferenceAttachments'], 1)
        for changed in [after.replace('Fonte literal.', 'Outra fonte.'), after.replace('Example.jpg', 'Outra.jpg'),
                        after.replace('50px', '60px'), after.replace('Descrição literal', 'Outra descrição'),
                        after.replace('Primeira.jpg', 'Troca.jpg').replace('Segunda.jpg', 'Primeira.jpg').replace('Troca.jpg', 'Segunda.jpg')]:
            self.assertEqual(self.status(before, changed, 'media'), 'failed')
        conflict = before.replace('{{Referências}}', '<ref name="a">Outra fonte. [[Imagem:Example.jpg|50px]]</ref>{{Referências}}')
        self.assertIsNone(oracle.reference_media_relocation(oracle.mw.parse(conflict), oracle.mw.parse(after)))
        before = '[[Imagem:Example.jpg|thumb|{{refbegin|2}}Texto literal.{{refend}}]]'
        for changed in [before.replace('|2}}', '|3}}'), before.replace('Texto literal', 'Texto alterado'), before.replace('{{refend}}', '')]:
            self.assertEqual(self.status(before, changed, 'media'), 'failed')

    def status(self, before, after, check):
        return oracle.compare_sources(before, after)[check]["status"]

    def test_partial_same_name_definition_change_is_a_new_native_conflict(self):
        ref = '<ref name="a">{{Citar web|título=Fonte literal|url=https://example.invalid/|acessodata=18-03-2007}}</ref>'
        fixed = ref.replace('18-03-2007', '18 de março de 2007')
        for wrap in [lambda text: '{{Modelo fictício|texto=' + text + '}}',
                     lambda text: '{{Citação|' + text + '}}', lambda text: '"' + text + '"']:
            before = 'Texto.' + ref + '\n' + wrap(ref) + '{{Referências}}'
            after = 'Texto.' + fixed + '\n' + wrap(ref) + '{{Referências}}'
            result = oracle.compare_sources(before, after)['reference_bindings']
            self.assertEqual(result['status'], 'failed')
            self.assertEqual(result['metrics']['introducedRawNamedDefinitionSplits'], 1)
            self.assertNotEqual(self.status(before, before, 'reference_bindings'), 'failed')
            together = 'Texto.' + fixed + '\n' + wrap(fixed) + '{{Referências}}'
            self.assertNotEqual(self.status(before, together, 'reference_bindings'), 'failed')
        opaque = 'Texto.' + ref + '<nowiki>' + ref + '</nowiki>{{Referências}}'
        self.assertNotEqual(self.status(opaque, opaque.replace(ref, fixed, 1), 'reference_bindings'), 'failed')

    def test_source_proven_month_year_is_only_a_declared_repair(self):
        call = lambda fields: "{{Citar web|título=Publicação d'água|url=https://example.invalid/fonte|" + fields + "}}"
        for fields, endpoint in [('ano=2001|mês=March', 'data=março de 2001'),
                                 ('month=April|year=2001', 'data=abril de 2001'),
                                 ('ano=2001|mes=March/abril', 'data=março–abril de 2001'),
                                 ('data=2001 March', 'data=março de 2001')]:
            before, after = call(fields), call(endpoint)
            result = oracle.compare_sources(before, after)['citation_associations']
            self.assertEqual(result['status'], 'passed')
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            self.assertIn(result['declaredRepairs'][0]['kind'], {'supplied-year-month-scalar', 'supplied-obsolete-month-year-pair'})
            for changed in [after.replace('2001', '2002'), after.replace('março', 'maio').replace('abril', 'junho'),
                            after.replace('/fonte', '/outra'), after.replace("Publicação d'água", 'Outra fonte')]:
                self.assertNotEqual(self.status(before, changed, 'citation_associations'), 'passed')
        for fields in ['ano=2001|mês=March|year=', 'ano=2001|mês=March|data=', 'ano=2001|mês=March|origdate=',
                       'ano=2001|mês=March|acessomesdia=', 'ano=2001|mês=April/March', 'ano=2001|mês=March/March',
                       'ano=2001|mês=Mar', 'ano=2001|mês=03', 'ano=2001|mês={{Mês fictício}}']:
            self.assertEqual(oracle.declared_repair_source(call(fields), call('data=março de 2001'))[1], [])
        for key in ['data', 'ano']:
            for month in 'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'.split():
                self.assertEqual(oracle.declared_repair_source(call(key + '=2001 ' + month), call('data=' + month + ' de 2001'))[1], [])

    def test_native_redundant_edition_volume_labels_are_declared_repairs(self):
        call = lambda fields: "{{Citar livro|título=Publicação d'água|url=https://example.invalid/fonte|autor=Pessoa literal|isbn=0-201-32839-9|" + fields + "}}"
        for source, target in [('edição=1ª EDIÇÃO', 'edição=1'), ('edição=2nd edition', 'edição=2'),
                               ('volume=v.25 (1833-1834)', 'volume=25 (1833-1834)'), ('volume=vol. 2', 'volume=2')]:
            before, after = call(source), call(target)
            result = oracle.compare_sources(before, after)['citation_associations']
            self.assertEqual(result['status'], 'passed')
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            self.assertEqual(result['declaredRepairs'][0]['kind'], 'native-citation-redundant-value-labels')
            for changed in [after.replace('/fonte', '/outra'), after.replace("Publicação d'água", 'Outra fonte'),
                            after.replace('Pessoa literal', 'Outra pessoa'), after.replace('0-201-32839-9', '0-521-49652-7'),
                            after.replace('edição=1', 'edição=9').replace('edição=2', 'edição=9').replace('volume=25', 'volume=29').replace('volume=2', 'volume=9')]:
                self.assertNotEqual(self.status(before, changed, 'citation_associations'), 'passed')
        for source in ['edição=1ª EDIÇÃO|edition=', 'edição=1ª EDIÇÃO|edição=', 'volume=v.25|volumen=',
                       'volume=v.{{Número fictício}}', 'edição=primeira EDIÇÃO', 'edição=1ª EDIÇÃO anotada']:
            self.assertEqual(oracle.declared_repair_source(call(source), call('edição=1|volume=25'))[1], [])

    def test_exact_local_press_release_redirect_preserves_native_roles(self):
        for prefix in ["", "Template:", "Predefinição:"]:
            before = ('Texto.<ref name="a">{{' + prefix + 'Cite press release|title=Título d\'água'
                      '|url=https://example.invalid/fonte|author=Pessoa literal|date=2001-03-05'
                      '|publisher=Editora literal|url-status=dead}}</ref>{{Referências}}')
            after = before.replace(prefix + 'Cite press release', 'Citar comunicado de imprensa')
            after = after.replace('|title=', '|título=').replace('|author=', '|autor=')
            after = after.replace('|date=', '|data=').replace('|publisher=', '|publicado=')
            for check in ['reference_bindings', 'reference_lists', 'citation_associations']:
                self.assertEqual(self.status(before, after, check), 'passed')
                for changed in [after.replace("Título d'água", 'Outro título'),
                                after.replace('/fonte', '/outra'),
                                after.replace('Pessoa literal', 'Outra pessoa'),
                                after.replace('2001-03-05', '2001-03-06'),
                                after.replace('|publicado=', '|obra='),
                                after.replace('|url-status=dead', '|urlmorta=sim')]:
                    self.assertEqual(self.status(before, changed, check), 'failed')

    def test_primary_local_typed_citation_redirects_preserve_their_class(self):
        for source, target in [('Cite video', 'Citar vídeo'), ('Cite encyclopedia', 'Citar enciclopédia'), ('Cite thesis', 'Citar tese')]:
            before = ('Texto.<ref>{{' + source + '|title=Fonte literal|url=https://example.invalid/fonte'
                      '|author=Pessoa literal|date=2001-03-05|language=inglês|url-status=live}}</ref>{{Referências}}')
            after = before.replace(source, target).replace('|title=', '|título=').replace('|author=', '|autor=')
            after = after.replace('|date=', '|data=').replace('|language=inglês', '|língua=en')
            for check in ['reference_bindings', 'reference_lists', 'citation_associations']:
                self.assertEqual(self.status(before, after, check), 'passed')
                for changed in [after.replace(target, 'Citar web'), after.replace('/fonte', '/outra'),
                                after.replace('Pessoa literal', 'Outra pessoa'), after.replace('2001-03-05', '2001-03-06'),
                                after.replace('|url-status=live', '|urlmorta=não')]:
                    self.assertEqual(self.status(before, changed, check), 'failed')

    def test_press_release_identity_cannot_authorize_unknown_family_or_case(self):
        before = '{{Cite press release|title=Fonte literal|url=https://example.invalid/fonte|url-status=dead}}'
        for unknown in ['Cite Press Release', 'CITE PRESS RELEASE', 'Cita comunicado', 'Press release']:
            source = before.replace('Cite press release', unknown)
            after = before.replace('Cite press release', 'Citar comunicado de imprensa')
            self.assertNotEqual(self.status(source, after, 'citation_associations'), 'passed')
        after = before.replace('Cite press release', 'Citar web')
        self.assertEqual(self.status(before, after, 'citation_associations'), 'failed')

    def test_primary_native_language_name_case_and_state_context(self):
        for name, code in [('inglês', 'en'), ('Checo', 'cs'), ('sueco', 'sv'), ('GREGO', 'el')]:
            before = "{{Citar web|título=Título d'água|url=https://example.invalid/fonte|língua=" + name + '|urlmorta=não}}'
            after = before.replace('|língua=' + name + '|', '|língua=' + code + '|')
            self.assertEqual(self.status(before, after, 'citation_associations'), 'passed')
            for changed in [after.replace('|língua=' + code + '|', '|língua=xx|'),
                            after.replace('|urlmorta=não', '|url-status=live'),
                            after.replace('/fonte', '/outra')]:
                self.assertEqual(self.status(before, changed, 'citation_associations'), 'failed')
        for value in ['inglês.', 'inglês/francês', 'inglês e francês']:
            source = '{{Citar web|título=Fonte literal|url=https://example.invalid/|língua=' + value + '}}'
            self.assertEqual(self.status(source, source.replace(value, 'en'), 'citation_associations'), 'failed')

    def test_native_language_competition_keeps_keys_blanks_and_raw_values(self):
        call = lambda fields: '{{Citar web|título=Fonte literal|url=https://example.invalid/|' + fields + '|url-status=live}}'
        for before, after in [
            ['língua=inglês|language=fr', 'língua=en|language=fr'],
            ['língua=inglês|language=fr', 'language=inglês|língua=fr'],
            ['língua=inglês|language=', 'língua=en|language='],
            ['língua=inglês|língua=', 'língua=en|língua='],
            ['língua=inglês|language=', 'língua=inglês'],
        ]:
            self.assertEqual(self.status(call(before), call(after), 'citation_associations'), 'failed')

    def test_complete_primary_language_catalog_separates_declared_repairs(self):
        catalog = json.loads(Path(__file__).with_name('citation_language_catalog.json').read_text())
        for row in catalog['aliases']:
            before = "{{Citar web|título=Publicação d'água|url=https://example.invalid/fonte|língua=" + row['alias'] + '|url-status=live}}'
            after = before.replace('|língua=' + row['alias'] + '|', '|língua=' + row['code'] + '|')
            result = oracle.compare_sources(before, after)['citation_associations']
            if row['classification'] == 'unproved-quiet-refusal':
                self.assertNotEqual(result['status'], 'passed')
                self.assertEqual(oracle.declared_repair_source(before, after)[1], [])
                continue
            self.assertEqual(result['status'], 'passed')
            if row['classification'] == 'declared-foreign-language-name-repair':
                self.assertFalse(result['originalRenderingClaimedEquivalent'])
                self.assertEqual(result['declaredRepairs'][0]['kind'], 'foreign-literal-language-name')
            else:
                self.assertNotIn('declaredRepairs', result)
            for changed in [after.replace('|língua=' + row['code'] + '|', '|língua=xx|'),
                            after.replace('/fonte', '/outra'),
                            after.replace("Publicação d'água", 'Outra publicação'),
                            after.replace('|url-status=live', '|urlmorta=não')]:
                self.assertNotEqual(self.status(before, changed, 'citation_associations'), 'passed')

    def test_foreign_language_repair_preserves_competition_and_protected_context(self):
        before = '{{Citar web|título=Fonte literal|url=https://example.invalid/|língua=English|urlmorta=no}}'
        after = before.replace('=English', '=en')
        for source in [before.replace('|língua=', '|language=fr|língua='),
                       before.replace('|língua=', '|language=|língua='),
                       before.replace('English', 'English.'),
                       '{{Exemplo desconhecido|' + before + '}}',
                       '<pre>' + before + '</pre>']:
            self.assertEqual(oracle.declared_repair_source(source, source.replace('English', 'en'))[1], [])
        for family in ['Citar comunicado de imprensa', 'Citar conferência', 'Citar relatório']:
            self.assertEqual(self.status(before.replace('Citar web', family), after.replace('Citar web', family), 'citation_associations'), 'passed')

    def test_primary_language_extension_retains_finite_value_and_context(self):
        contract = json.loads(Path(__file__).with_name('citation_language_extension_contract.json').read_text())
        self.assertEqual(len(contract['aliases']), 53)
        for row in contract['aliases']:
            before = '{{Citar web|título=Fonte literal|url=https://example.invalid/|língua=' + row['alias'] + '|url-status=live}}'
            after = before.replace('|língua=' + row['alias'] + '|', '|língua=' + row['code'] + '|')
            result = oracle.compare_sources(before, after)['citation_associations']
            self.assertEqual(result['status'], 'passed')
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            for changed in [after.replace('Fonte literal', 'Outra fonte'), after.replace('=live', '=dead'),
                            after.replace('|língua=' + row['code'] + '|', '|língua=xx|')]:
                self.assertEqual(self.status(before, changed, 'citation_associations'), 'failed')
            competing = before.replace('|língua=', '|language=|língua=')
            self.assertEqual(oracle.declared_repair_source(competing, competing.replace(row['alias'], row['code']))[1], [])
        for value in contract['preserve']:
            before = '{{Citar web|título=Fonte literal|url=https://example.invalid/|língua=' + value + '}}'
            self.assertEqual(oracle.declared_repair_source(before, before.replace('|língua=' + value, '|língua=en'))[1], [])

    def test_supplied_native_person_etal_marker_keeps_publication_binding(self):
        for key, display in [('autor', 'numero-autores'), ('author', 'display-authors'), ('editor', 'numero-editores')]:
            for name in ['J. Pessoa', 'Nome Fictício', 'Nome de Exemplo']:
                before = '{{Citar livro|título=Livro literal|url=https://example.invalid/|isbn=9780306406157|' + key + '=' + name + ' et al.}}'
                after = before.replace(name + ' et al.', name).replace('}}', '|' + display + '=et al}}')
                result = oracle.compare_sources(before, after)['citation_associations']
                self.assertEqual(result['status'], 'passed')
                self.assertFalse(result['originalRenderingClaimedEquivalent'])
                self.assertEqual(result['declaredRepairs'][0]['kind'], 'supplied-native-person-etal-marker')
                for changed in [after.replace(name, 'Outra Pessoa'), after.replace('Livro literal', 'Outro livro'),
                                after.replace('9780306406157', '9783161484100'), after.replace('=et al', '=2')]:
                    self.assertEqual(self.status(before, changed, 'citation_associations'), 'failed')
                competitors = ['editor=', 'editor2=Outra Pessoa', 'editor-first=', 'display-editors=', 'editor-link='] if key == 'editor' else ['autor=', 'autor2=Outra Pessoa', 'primeiro=', 'display-authors=', 'autorlink=']
                for competitor in competitors:
                    source = before.replace('}}', '|' + competitor + '}}')
                    self.assertEqual(oracle.declared_repair_source(source, source.replace(name + ' et al.', name).replace('}}', '|' + display + '=et al}}'))[1], [])

    def test_supplied_person_etal_refuses_unproved_translator_and_institution(self):
        for fields in ['tradutor=Nome Fictício et al.', 'autor=Royal Society et al.', 'autor=Nome Fictício et al. et al.',
                       'autor2=Nome Fictício et al.', 'autor=[[Nome Fictício]] et al.']:
            source = '{{Citar livro|título=Livro literal|' + fields + '}}'
            target = source.replace(' et al.', '').replace('}}', '|numero-autores=et al}}')
            self.assertEqual(oracle.declared_repair_source(source, target)[1], [])

    def test_adjacent_identical_named_selfcall_has_source_bound_whole_graph(self):
        for gap in ['', ' ', '\n']:
            before = 'A.<ref name="a">Fonte literal.</ref>' + gap + '<ref name="a"/><ref name="b">Outra fonte.</ref> B.<ref name="a"/> C.<ref name="b"/>{{Referências}}'
            after = before.replace(gap + '<ref name="a"/>', gap, 1)
            result = oracle.compare_sources(before, after)
            for check in ['reference_bindings', 'reference_lists']:
                self.assertEqual(result[check]['status'], 'passed')
                self.assertFalse(result[check]['originalRenderingClaimedEquivalent'])
                self.assertEqual(result[check]['declaredRepairs'][0]['kind'], 'adjacent-identical-named-reference-selfcall')
            for changed in [after.replace('Fonte literal.', 'Fonte alterada.'), after.replace('name="b"', 'name="c"', 1),
                            after.replace('<ref name="b">Outra fonte.</ref>', ''), after.replace('name="a"', 'group="n" name="a"', 1)]:
                self.assertEqual(self.status(before, changed, 'reference_bindings'), 'failed')

    def test_adjacent_selfcall_refuses_intervening_or_unproved_scopes(self):
        base = 'A.<ref name="a">Fonte literal.</ref><ref name="a"/>{{Referências}}'
        for source in [base.replace('</ref><ref', '</ref>Outra afirmação.<ref'),
                       base.replace('name="a"/>', 'group="n" name="a"/>'),
                       base.replace('name="a"/>', 'name="b"/>'),
                       base.replace('{{Referências}}', '<ref name="a">Fonte conflitante.</ref>{{Referências}}'),
                       '{{Exemplo desconhecido|' + base + '}}', '<nowiki>' + base + '</nowiki>',
                       base.replace('{{Referências}}', '<ref name="a" follow="a">Complemento.</ref>{{Referências}}'),
                       base.replace('{{Referências}}', '<ref name="a" atributo-desconhecido="x"/>{{Referências}}')]:
            target = source.replace('<ref name="a"/>', '', 1)
            self.assertEqual(oracle.declared_repair_source(source, target)[1], [])

    def test_numeric_pages_and_supplied_month_keep_exact_publication(self):
        for source_fields, target_fields in [('páginas=Página 594', 'páginas=594'), ('pages=pp. 10–12', 'pages=10–12'),
                                             ('página=p. 10', 'página=10'), ('data=2019/7', 'data=2019-07')]:
            before = '{{Citar livro|título=Livro literal|url=https://example.invalid/|' + source_fields + '}}'
            after = before.replace(source_fields, target_fields)
            result = oracle.compare_sources(before, after)['citation_associations']
            self.assertEqual(result['status'], 'passed')
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            for changed in [after.replace('594', '595').replace('10', '11').replace('2019-07', '2019-08'),
                            after.replace('Livro literal', 'Outro livro'), after.replace('example.invalid/', 'example.invalid/outra')]:
                self.assertEqual(self.status(before, changed, 'citation_associations'), 'failed')
        for fields, target in [('páginas=Página 594|nopp=', 'páginas=594|nopp='),
                               ('pages=pp. 10|no-pp=yes', 'pages=10|no-pp=yes'),
                               ('data=2019/7|date=', 'data=2019-07|date='),
                               ('acessodata=2019/7', 'acessodata=2019-07'), ('data=2019/13', 'data=2019-12')]:
            source = '{{Citar livro|título=Livro literal|' + fields + '}}'
            self.assertEqual(oracle.declared_repair_source(source, source.replace(fields, target))[1], [])

    def test_whitespace_surrounding_minimal_external_reference(self):
        before = 'A.<ref> \n[https://example.invalid/fonte Título literal] \n</ref>{{Referências}}'
        after = 'A.<ref>{{Citar web|url=https://example.invalid/fonte|título=Título literal}}</ref>{{Referências}}'
        for check in ["reference_bindings", "reference_lists", "citation_associations"]:
            self.assertEqual(self.status(before, after, check), "passed")
            self.assertEqual(self.status(before, after.replace("Título literal", "Título alterado"), check), "failed")
            self.assertEqual(self.status(before, after.replace("/fonte", "/outra"), check), "failed")
        # Additional visible prose or two source links cannot be discarded.
        for extra in ["Mais texto.", "[https://example.invalid/outra Outra fonte]"]:
            self.assertEqual(self.status(before.replace(" \n</ref>", extra + "</ref>"), after, "reference_bindings"), "failed")

    def test_malformed_newline_external_link_is_declared_repair(self):
        before = 'A.<ref name="a">[https://example.invalid/fonte \n"Título literal"]</ref>{{Referências}}'
        after = 'A.<ref name="a">{{Citar web|url=https://example.invalid/fonte|título="Título literal"}}</ref>{{Referências}}'
        result = oracle.compare_sources(before, after)
        for check in ['reference_bindings', 'reference_lists', 'citation_associations']:
            self.assertEqual(result[check]['status'], 'passed')
            self.assertEqual(result[check]['comparisonBasis'], 'source-bound-declared-repairs')
            self.assertFalse(result[check]['originalRenderingClaimedEquivalent'])
            self.assertEqual(result[check]['declaredRepairs'][0]['kind'], 'malformed-bracket-link-newline')
        for changed in [after.replace('/fonte', '/outra'), after.replace('Título literal', 'Outro título'),
                        after.replace('"Título literal"', 'Título literal'), after.replace('name="a"', 'group="n" name="a"')]:
            self.assertNotEqual(self.status(before, changed, 'reference_bindings'), 'passed')
        self.assertEqual(oracle.declared_repair_source(before, before)[1], [])
        self.assertEqual(oracle.declared_repair_source(before + after, before + after)[1], [])
        protected = '<pre>' + before + '</pre>'
        self.assertEqual(oracle.declared_repair_source(protected, protected.replace('Título literal', 'Outro título'))[1], [])

    def test_invalid_native_access_enum_is_declared_exact_repair(self):
        for key in ['url-access', 'acessourl', 'acesso-url']:
            before = '{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|' + key + '=subscription}}'
            after = before.replace('subscription', 'subscrição')
            result = oracle.compare_sources(before, after)['citation_associations']
            self.assertEqual(result['status'], 'passed')
            self.assertEqual(result['declaredRepairs'][0]['configurationOldid'], 73016847)
            self.assertFalse(result['originalRenderingClaimedEquivalent'])
            for changed in [after.replace('/fonte', '/outra'), after.replace('Fonte literal', 'Outra fonte'), after.replace('subscrição', 'limited')]:
                self.assertEqual(self.status(before, changed, 'citation_associations'), 'failed')
            for source in [before.replace('|url=', '|acesso-url=limited|url='),
                           before.replace('=subscription', '=SUBSCRIPTION'),
                           '{{Exemplo desconhecido|texto=' + before + '}}']:
                self.assertEqual(oracle.declared_repair_source(source, source.replace('subscription', 'subscrição'))[1], [])

    def test_unambiguous_numeric_month_first_date(self):
        before = '{{Citar web|título=Título literal|url=https://example.invalid/|data=12-15-2020}}'
        after = before.replace("12-15-2020", "15 de dezembro de 2020")
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        self.assertEqual(self.status(before, after.replace("15 de dezembro", "14 de dezembro"), "citation_associations"), "failed")
        for value in ["02-30-2020", "2020-02-30", "13-15-2020"]:
            self.assertEqual(oracle.date_value(value), value)
        # No month-first guess for ambiguous day/month components.
        self.assertNotEqual(oracle.date_value("03-04-2020"), oracle.date_value("March 4, 2020"))

    def test_year_first_calendar_separators_retain_exact_date(self):
        for value in ['2025.09.15', '2025/09/15', '2025.9.15', '2025/9/15']:
            before = '{{Citar web|título=Título literal|data=' + value + '}}'
            after = before.replace(value, '2025-09-15')
            self.assertEqual(self.status(before, after, 'citation_associations'), 'passed')
            self.assertEqual(self.status(before, after.replace('2025-09-15', '2025-09-16'), 'citation_associations'), 'failed')
        for value in ['2025.02.30', '2025/13/15', '2025.09/15']:
            self.assertEqual(oracle.date_value(value), value)

    def test_invalid_written_calendar_dates_cannot_borrow_iso_identity(self):
        for value in ['31 de fevereiro de 2020', '29 de fevereiro de 1900', '31 de abril de 2020', 'February 30, 2020', 'April 31, 2020']:
            self.assertEqual(oracle.date_value(value), value)
        self.assertEqual(oracle.date_value('29 de fevereiro de 2000'), '2000-02-29')
        self.assertEqual(oracle.date_value('February 29, 2000'), '2000-02-29')

    def test_exact_native_plainlist_redirect_in_table_cells(self):
        before = '{| class="wikitable"\n| {{plainlist|* [[Tema A]]\n* [[Tema B]]}}\n|}'
        after = before.replace("{{plainlist", "{{Lista simples")
        self.assertEqual(self.status(before, after, "table_cells"), "passed")
        for changed in [after.replace("Tema B", "Tema C"), after.replace("* [[Tema B]]", ""),
                        after.replace("|*", "|classe=outra|*"), after.replace("Lista simples", "ListA simples")]:
            self.assertEqual(self.status(before, changed, "table_cells"), "failed")

    def test_native_periodical_publisher_access_and_at_roles(self):
        before = '{{Citar web|título=Título literal|revista=Periódico literal|publicado=Editora literal|acessourl=livre|em=seção literal}}'
        after = before.replace("revista=", "obra=").replace("publicado=", "editora=").replace("acessourl=", "acesso-url=").replace("em=", "at=")
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        for changed in [after.replace("Periódico literal", "Editora literal"), after.replace("Editora literal", "Periódico literal"),
                        after.replace("livre", "restrito"), after.replace("seção literal", "outra seção")]:
            self.assertEqual(self.status(before, changed, "citation_associations"), "failed")

    def test_native_language_names_keep_language_and_citation_association(self):
        for name, code in [("sueco", "sv"), ("grego", "el"), ("checo", "cs")]:
            for spelling in [name, name.capitalize()]:
                before = '{{Citar web|título=Título literal|url=https://example.invalid/|língua=' + spelling + '}}'
                after = before.replace('língua=' + spelling, 'língua=' + code)
                self.assertEqual(self.status(before, after, "citation_associations"), "passed")
                self.assertEqual(self.status(before, after.replace('língua=' + code, 'língua=xx'), "citation_associations"), "failed")
                self.assertEqual(self.status(before, after.replace('Título literal', 'Outra publicação'), "citation_associations"), "failed")

    def test_native_dead_url_and_status_are_distinct_roles(self):
        before = '{{Citar web|título=Título literal|url=https://example.invalid/|arquivourl=https://example.invalid/arquivo|urlmorta=no}}'
        self.assertEqual(self.status(before, before.replace("urlmorta=no", "urlmorta=não"), "citation_associations"), "passed")
        for replacement in ["url-status=live", "url-status=no", "urlmorta=live", "urlmorta=viva", "urlmorta=yes"]:
            self.assertEqual(self.status(before, before.replace("urlmorta=no", replacement), "citation_associations"), "failed")
        chapter = before.replace("|url=https://", "|capítulourl=https://", 1).replace("urlmorta=no", "urlmorta=live")
        self.assertEqual(self.status(chapter, chapter.replace("urlmorta=live", "urlmorta=não"), "citation_associations"), "failed")

    def test_unbulleted_list_ordered_caption_contract(self):
        before = '[[File:Exemplo.svg|thumb|{{unbulleted list|{{color box|red}} [[Tema A]]|{{color box|blue}} [[Tema B]]}}]]'
        after = '[[File:Exemplo.svg|thumb|{{Lista simples|\n* {{color box|red}} [[Tema A]]\n* {{color box|blue}} [[Tema B]]\n}}]]'
        self.assertEqual(self.status(before, after, "media"), "passed")
        for changed in [after.replace('red', 'green'), after.replace('Tema A', 'Tema C'),
                        after.replace('* {{color box|blue}} [[Tema B]]\n', ''),
                        after.replace('{{color box|red}} [[Tema A]]', '{{color box|blue}} [[Tema B]]'),
                        after.replace('Lista simples|', 'Lista simples|classe=outra|')]:
            self.assertEqual(self.status(before, changed, "media"), "failed")
        for source in [before.replace('|{{color box|red}}', '|classe=outra|{{color box|red}}'),
                       before.replace('|{{color box|blue}}', '|3={{color box|blue}}'),
                       before.replace('[[Tema A]]', '[[Tema A]]\n* Outro item')]:
            self.assertNotEqual(self.status(source, after, "media"), "passed")

    def test_native_headingless_bank_payload_and_associations(self):
        before = 'A.<ref group="n" name="a"/>{{Reflist|group=n|refs=<ref name="a">Fonte literal.</ref>}}'
        after = 'A.<ref group="n" name="a"/>{{Referências|grupo=n|refs=<ref name="a">Fonte literal.</ref>|nível=0}}'
        for check in ["reference_bindings", "reference_lists"]:
            self.assertEqual(self.status(before, after, check), "passed")
            for changed in [after.replace('Fonte literal.', 'Fonte alterada.'), after.replace('grupo=n', 'grupo=m'),
                            after.replace('name="a">', 'name="b">')]:
                self.assertEqual(self.status(before, changed, check), "failed")

    def test_native_file_namespace_padding_is_still_an_image(self):
        before = '[[Arquivo : Exemplo.svg|20px|alt=Exemplo literal]]'
        after = '[[Imagem:Exemplo.svg|20px|alt=Exemplo literal]]'
        for check in ["media", "table_cells"]:
            source = '{|\n| ' + before + '\n|}' if check == "table_cells" else before
            target = '{|\n| ' + after + '\n|}' if check == "table_cells" else after
            self.assertEqual(self.status(source, target, check), "passed")
            for changed in [target.replace('Exemplo.svg', 'Outro.svg'), target.replace('Exemplo literal', 'Outra legenda'),
                            target.replace('[[Imagem:', '[[:Imagem:')]:
                self.assertEqual(self.status(source, changed, check), "failed")

    def test_literal_reference_name_binding(self):
        before = 'A.<ref name="a">Fonte A.</ref> B.<ref name="a"/> {{Referências}}'
        self.assertEqual(self.status(before, before, "reference_bindings"), "passed")
        self.assertEqual(self.status(before, before.replace('name="a"/>', 'name="b"/>'), "reference_bindings"), "failed")

    def test_reference_group_case(self):
        before = 'A.<ref group="Nota" name="a">Fonte.</ref>{{Referências|grupo=Nota}}'
        self.assertEqual(self.status(before, before.replace('group="Nota"', 'group="nota"'), "reference_bindings"), "failed")

    def test_reference_list_native_alias_and_group(self):
        before = 'A.<ref group="n" name="a">Fonte literal.</ref>{{Reflist|group=n}}'
        after = 'A.<ref group="n" name="a">Fonte literal.</ref>{{Referências|grupo=n|nível=0}}'
        self.assertEqual(self.status(before, after, "reference_lists"), "passed")
        self.assertEqual(self.status(before, after.replace('|grupo=n', '|grupo=m'), "reference_lists"), "failed")

    def test_reference_list_coverage_deletion_or_movement(self):
        before = 'A.<ref>Fonte A.</ref>{{Referências}}B.<ref>Fonte B.</ref>{{Referências}}'
        self.assertEqual(self.status(before, before, "reference_lists"), "passed")
        for after in [before.replace('{{Referências}}', '', 1),
                      'A.<ref>Fonte A.</ref>B.<ref>Fonte B.</ref>{{Referências}}',
                      '{{Referências}}A.<ref>Fonte A.</ref>B.<ref>Fonte B.</ref>{{Referências}}']:
            self.assertEqual(self.status(before, after, "reference_lists"), "failed")

    def test_new_renderer_consumes_one_exact_pending_group(self):
        before = 'A.<ref group="n">Nota literal.</ref>B.<ref>Fonte literal.</ref>{{Referências}}'
        after = 'A.<ref group="n">Nota literal.</ref>B.<ref>Fonte literal.</ref>{{Notas|grupo=n}}{{Referências}}'
        result = oracle.compare_sources(before, after)["reference_lists"]
        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["metrics"]["newRenderersProvedFromExactPendingGroup"], 1)
        wrong = oracle.compare_sources(before, after.replace('{{Notas|grupo=n}}', '{{Notas|grupo=m}}'))["reference_lists"]
        self.assertEqual(wrong["metrics"]["newRenderersProvedFromExactPendingGroup"], 0)
        self.assertEqual(wrong["metrics"]["outputUnrenderedMarkers"], 1)
        split = 'A.<ref group="n">Nota literal.</ref>{{Notas|grupo=n}}B.<ref group="n">Outra nota.</ref>{{Notas|grupo=n}}'
        original = split.replace('{{Notas|grupo=n}}', '')
        self.assertEqual(self.status(original, split, "reference_lists"), "failed")

    def test_reference_list_keeps_existing_group_order(self):
        before = 'A.<ref group="n">Nota literal.</ref>B.<ref>Fonte literal.</ref>{{Referências|grupo=n}}{{Referências}}'
        after = before.replace('{{Referências|grupo=n}}{{Referências}}', '{{Referências}}{{Referências|grupo=n}}')
        self.assertEqual(self.status(before, after, "reference_lists"), "failed")

    def test_reference_list_bank_payload_and_inherited_group(self):
        before = 'A.<ref group="n" name="a"/>{{Notas|grupo=n|refs=<ref name="a">Fonte literal.</ref>}}'
        after = 'A.<ref group="n" name="a"/><references group="n"><ref name="a">Fonte literal.</ref></references>'
        self.assertEqual(self.status(before, after, "reference_lists"), "passed")
        self.assertEqual(self.status(before, after.replace('group="n"><ref', 'group="m"><ref'), "reference_lists"), "failed")

    def test_reference_list_unknown_emission_requires_exact_scope(self):
        before = 'A.{{sfn|Autoria literal|2020}}{{Referências}}'
        result = oracle.compare_sources(before, before)["reference_lists"]
        self.assertEqual(result["status"], "ambiguous")
        self.assertEqual(result["metrics"]["opaqueScopesProvedByteExact"], 1)
        self.assertEqual(self.status(before, '{{Referências}}'+before, "reference_lists"), "failed")
        self.assertEqual(self.status(before, before.replace('|2020', '|2021'), "reference_lists"), "failed")

    def test_list_defined_bank_inheritance(self):
        before = 'A.<ref group="n" name="a"/>{{Referências|grupo=n|refs=<ref name="a">Fonte.</ref>}}'
        self.assertEqual(self.status(before, before, "reference_bindings"), "passed")
        self.assertEqual(self.status(before, before.replace('|grupo=n', '|grupo=m'), "reference_bindings"), "failed")

    def test_unused_bank_payload_is_retained(self):
        before = '{{Referências|refs=<ref name="a">Fonte literal.</ref>}}'
        after = '{{Referências}}'
        self.assertEqual(self.status(before, after, "reference_bindings"), "failed")

    def test_opaque_body_exact_binding_is_independently_proved(self):
        before = 'A.<ref group="n" name="a">{{Modelo literal|campo=Valor literal}}</ref> B.<ref group="n" name="a"/>{{Referências|grupo=n}}'
        result = oracle.compare_sources(before, before)["reference_bindings"]
        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["metrics"]["opaqueAssociationsProvedByteExact"], 2)
        for after in [before.replace('campo=Valor literal', 'campo=Outro valor'), before.replace('group="n" name="a"/>', 'group="m" name="a"/>')]:
            result = oracle.compare_sources(before, after)["reference_bindings"]
            self.assertEqual(result["status"], "ambiguous")
            self.assertFalse(result["equalWithinFiniteModel"])

    def test_follow_is_not_guessed(self):
        before = 'A.<ref name="a">Fonte.</ref><ref follow="a">Complemento.</ref>{{Referências}}'
        self.assertEqual(self.status(before, before, "reference_bindings"), "ambiguous")

    def test_dedup_is_not_waived_by_compressing_all_calls(self):
        before = 'A.<ref name="a">Fonte.</ref> Outro parágrafo.<ref name="a"/>{{Referências}}'
        after = 'A.<ref name="a">Fonte.</ref> Outro parágrafo.{{Referências}}'
        self.assertEqual(self.status(before, after, "reference_bindings"), "ambiguous")
        self.assertFalse(oracle.compare_sources(before, after)["reference_bindings"]["equalWithinFiniteModel"])

    def test_numeric_reference_name_with_same_binding(self):
        before = 'A.<ref name="1">Fonte.</ref> B.<ref name="1"/>{{Referências}}'
        after = before.replace('name="1"', 'name="ref-1"')
        self.assertEqual(self.status(before, after, "reference_bindings"), "passed")

    def test_definition_relocated_to_earlier_file_caption(self):
        before = '[[Ficheiro:Exemplo.svg|miniatura|Legenda literal.<ref name="a"/>]] Texto.<ref name="a">Fonte literal.</ref>{{Referências}}'
        after = '[[Imagem:Exemplo.svg|miniatura|Legenda literal.<ref name="a">Fonte literal.</ref>]] Texto.<ref name="a"/>{{Referências}}'
        self.assertEqual(self.status(before, after, "reference_bindings"), "passed")
        self.assertEqual(self.status(before, after, "media"), "passed")
        self.assertEqual(self.status(before, after.replace('Fonte literal.', 'Outra fonte.'), "reference_bindings"), "failed")
        self.assertEqual(self.status(before, after.replace('Legenda literal.', 'Outra legenda.'), "media"), "failed")

    def test_numeric_dates_dead_url_and_language_roles(self):
        before = '{{Citar web|título=Publicação literal|data=31/12/2020|acessodata=23-4-2021|urlmorta=yes|língua=inglês}}'
        after = '{{Citar web|título=Publicação literal|data=2020-12-31|acessodata=2021-04-23|urlmorta=sim|língua=en}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        for changed in [after.replace('2020-12-31', '2020-12-30'), after.replace('urlmorta=sim', 'urlmorta=não'), after.replace('língua=en', 'língua=fr')]:
            self.assertEqual(self.status(before, changed, "citation_associations"), "failed")
        self.assertEqual(oracle.date_value('31/02/2020'), '31/02/2020')

    def test_native_publisher_role_is_not_a_periodical(self):
        before = '{{Cite book|title=Livro literal|publisher=Editora literal}}'
        after = '{{Citar livro|título=Livro literal|publicado=Editora literal}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        self.assertEqual(self.status(before, after.replace('publicado=', 'obra='), "citation_associations"), "failed")

    def test_bare_reference_link_to_minimal_web_citation(self):
        before = 'Texto.<ref>[https://example.invalid/documento Título literal]</ref>{{Referências}}'
        after = 'Texto.<ref>{{Citar web|url=https://example.invalid/documento|título=Título literal}}</ref>{{Referências}}'
        for check in ['reference_bindings', 'citation_associations']:
            self.assertEqual(self.status(before, after, check), "passed")
            self.assertEqual(self.status(before, after.replace('Título literal', 'Outro título'), check), "failed")
            self.assertEqual(self.status(before, after.replace('/documento', '/outro'), check), "failed")

    def test_typed_identifier_prefix_equivalence(self):
        for before, after in [
            ('isbn=ISBN 0-521-79540-0', 'isbn=0-521-79540-0'),
            ('doi=https://doi.org/10.1000/example', 'doi=10.1000/example'),
            ('pmc=PMC1234567', 'pmc=1234567'),
            ('pmid=https://pubmed.ncbi.nlm.nih.gov/1234567/', 'pmid=1234567'),
        ]:
            a = '{{Citar livro|título=Publicação literal|' + before + '}}'
            b = '{{Citar livro|título=Publicação literal|' + after + '}}'
            self.assertEqual(self.status(a, b, "citation_associations"), "passed")

    def test_invalid_typed_identifier_prefix_is_not_equivalence(self):
        for a, b in [('isbn=ISBN 0-521-79540-1', 'isbn=0-521-79540-1'),
                     ('doi=doi:not-an-identifier', 'doi=not-an-identifier'),
                     ('pmid=PMID:000123', 'pmid=000123'), ('pmc=PMC12345678901', 'pmc=12345678901')]:
            before = '{{Citar livro|título=Publicação literal|'+a+'}}'
            after = '{{Citar livro|título=Publicação literal|'+b+'}}'
            self.assertEqual(self.status(before, after, "citation_associations"), "failed")

    def test_identifier_title_association_mutation(self):
        before = '{{Citar livro|título=A|doi=10.1000/a}} {{Citar livro|título=B|doi=10.1000/b}}'
        after = '{{Citar livro|título=A|doi=10.1000/b}} {{Citar livro|título=B|doi=10.1000/a}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "failed")

    def test_author_link_separation(self):
        before = '{{Citar web|título=Publicação literal|autor=[[Pessoa literal]]}}'
        after = '{{Citar web|título=Publicação literal|autor=Pessoa literal|autorlink=Pessoa literal}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        self.assertEqual(self.status(before, after.replace('autorlink=Pessoa literal', 'autorlink=Outra pessoa'), "citation_associations"), "failed")

    def test_native_editor_link_separation_requires_exact_person(self):
        before = '{{Citar livro|título=Publicação literal|editor=[[Destino literal|Pessoa literal]]}}'
        after = '{{Citar livro|título=Publicação literal|editor=Pessoa literal|editor-link=Destino literal}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        for changed in [after.replace('Destino literal', 'Outro destino'), after.replace('Pessoa literal', 'Outra pessoa'),
                        after.replace('|editor-link=', '|editor-first=Nome|editor-link='),
                        after.replace('|editor-link=', '|editor-mask=2|editor-link='),
                        after.replace('|editor-link=', '|editor1=Outra pessoa|editor-link='),
                        after.replace('editor-link=Destino literal', 'editor-link=Categoria:Destino literal')]:
            self.assertEqual(self.status(before, changed, "citation_associations"), "failed")

    def test_native_url_state_alias_priority_is_not_a_multiset(self):
        prefix = '{{Citar web|título=Publicação literal|url=https://example.invalid/|'
        for original, replacement in [
            ('li=no|urlmorta=sim', 'urlmorta=no|li=sim'),
            ('li=|urlmorta=sim', 'urlmorta=|li=sim'),
            ('urlmorta=no|urlmorta=sim|urlmorta=no', 'urlmorta=no|urlmorta=no|urlmorta=sim'),
            ('urlmorta=|urlmorta=sim|urlmorta=', 'urlmorta=|urlmorta=|urlmorta=sim'),
            ('url-status=', ''), ('urlmorta=', '')]:
            self.assertEqual(self.status(prefix + original + '}}', prefix + replacement + '}}', "citation_associations"), "failed")
        self.assertEqual(self.status(prefix + 'li=no|urlmorta=no}}', prefix + 'li=no}}', "citation_associations"), "passed")

    def test_native_editor_roles_keep_person_associations(self):
        before = '{{Citar livro|título=Livro literal|editor-first1=Nome A|editor-last1=Sobrenome A|editor2-first=Nome B|editor2-last=Sobrenome B|display-editors=2|series=Coleção literal|others=Revisão literal}}'
        after = '{{Citar livro|título=Livro literal|editor-nome1=Nome A|editor-sobrenome1=Sobrenome A|editor-nome2=Nome B|editor-sobrenome2=Sobrenome B|numero-editores=2|série=Coleção literal|outros=Revisão literal}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        for changed in [after.replace('Nome A', 'Nome C'), after.replace('Sobrenome A', 'Sobrenome B').replace('editor-sobrenome2=Sobrenome B', 'editor-sobrenome2=Sobrenome A'), after.replace('numero-editores=2', 'numero-editores=1')]:
            self.assertEqual(self.status(before, changed, "citation_associations"), "failed")

    def test_publication_emphasis_keeps_target_and_label(self):
        before = "{{Citar web|título=Título literal|publicado=[[Destino literal|''Rótulo literal'']]}}"
        after = "{{Citar web|título=Título literal|publicado=''[[Destino literal|Rótulo literal]]''}}"
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        self.assertEqual(self.status(before, after.replace('Destino literal', 'Outro destino'), "citation_associations"), "failed")

    def test_whole_link_label_emphasis_retains_small_and_attributes(self):
        for marks in ["''", "'''"]:
            before = '{|\n| [[Destino literal|' + marks + '<small class="literal">Rótulo literal</small>' + marks + ']]\n|}'
            after = '{|\n| ' + marks + '[[Destino literal|<small class="literal">Rótulo literal</small>]]' + marks + '\n|}'
            self.assertEqual(self.status(before, after, "table_cells"), "passed")
            for changed in [after.replace('Destino literal', 'Outro destino'), after.replace('Rótulo literal', 'Outro rótulo'),
                            after.replace('class="literal"', 'class="outra"'), after.replace('<small class="literal">', '<big class="literal">').replace('</small>', '</big>'),
                            after.replace('[[Destino literal', '[[:Destino literal'), after.replace(marks + '[[', '[[').replace(']]' + marks, ']]')]:
                self.assertEqual(self.status(before, changed, "table_cells"), "failed")

    def test_unknown_populated_citation_field_needs_exact_opaque_identity(self):
        source = '{{Citar web|título=Publicação literal|campo_desconhecido=Valor literal}}'
        result = oracle.compare_sources(source, source)["citation_associations"]
        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["metrics"]["opaqueCitationCallsProvedByteExact"], 1)
        self.assertEqual(self.status(source, source.replace('Valor literal', 'Outro valor'), "citation_associations"), "ambiguous")

    def test_unknown_emitter_needs_same_literal_and_list_context(self):
        source = 'Afirmação.{{sfn|Autoria literal|2020}}{{Referências}}'
        result = oracle.compare_sources(source, source)["reference_bindings"]
        self.assertEqual(result["status"], "ambiguous")
        self.assertEqual(result["metrics"]["opaqueEmissionsProvedByteExact"], 1)
        self.assertEqual(self.status(source, source.replace('|2020', '|2021'), "reference_bindings"), "failed")
        self.assertEqual(self.status(source, '{{Referências}}' + source, "reference_bindings"), "failed")

    def test_absent_objects_are_not_counted_as_passes(self):
        result = oracle.compare_sources('Texto literal.', 'Texto literal.')
        for key in oracle.CHECKS:
            self.assertEqual(result[key]["status"], "not_applicable")

    def test_alias_date_value(self):
        before = '{{Cite book|title=Publicação literal|date=16 July 2015|publisher=Editora literal}}'
        after = '{{Citar livro|título=Publicação literal|data=16 de julho de 2015|editora=Editora literal}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")

    def test_month_dates_and_abbreviations_keep_precision(self):
        for a, b in [('1997-8', 'agosto de 1997'), ('04-2017', 'abril de 2017'), ('Nov 1899', 'novembro de 1899'),
                     ('Abril de 2010', 'abril de 2010'), ('27 de dez. de 2023', '2023-12-27')]:
            before = '{{Citar web|título=Publicação literal|data='+a+'}}'
            after = '{{Citar web|título=Publicação literal|data='+b+'}}'
            self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        self.assertNotEqual(oracle.date_value('2020'), oracle.date_value('2020-01'))
        self.assertNotEqual(oracle.date_value('2020-01'), oracle.date_value('2020-01-01'))

    def test_archive_decomposition_is_exact(self):
        before = '{{Citar web|título=Título literal|url=https://web.archive.org/web/20200102123456/https://example.invalid/documento}}'
        after = '{{Citar web|título=Título literal|url=https://example.invalid/documento|arquivourl=https://web.archive.org/web/20200102123456/https://example.invalid/documento|arquivodata=2020-01-02}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        self.assertEqual(self.status(before, after.replace('arquivodata=2020-01-02', 'arquivodata=2020-01-03'), "citation_associations"), "failed")
        self.assertEqual(self.status(before, after.replace('url=https://example.invalid/documento', 'url=https://example.invalid/outro'), "citation_associations"), "failed")

    def test_literal_author_sequence_keeps_order_and_names(self):
        before = '{{Citar livro|título=Título literal|autor=Autoria A; Autoria B|editor=Edição A; Edição B}}'
        after = '{{Citar livro|título=Título literal|autor=Autoria A|autor2=Autoria B|editor=Edição A|editor2=Edição B}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")
        self.assertEqual(self.status(before, after.replace('autor2=Autoria B', 'autor2=Autoria C'), "citation_associations"), "failed")

    def test_first_day_ordinal_is_same_typed_date(self):
        before = '{{Citar web|título=Título literal|data=1.º de fevereiro de 2017}}'
        after = '{{Citar web|título=Título literal|data=2017-02-01}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "passed")

    def test_duplicate_roles_keep_empty_override(self):
        before = '{{Citar web|título=Título literal|data=2020-01-01|date=}}'
        after = '{{Citar web|título=Título literal|data=2020-01-01}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "failed")

    def test_duplicate_role_order_and_equal_value_cleanup(self):
        before = '{{Citar web|título=Título A|título=Título B|url=https://example.invalid/}}'
        after = '{{Citar web|título=Título B|título=Título A|url=https://example.invalid/}}'
        self.assertEqual(self.status(before, after, "citation_associations"), "failed")
        repeated = '{{Citar web|título=Título literal|arquivodata=2020-01-01|archive-date=2020-01-01}}'
        cleaned = '{{Citar web|título=Título literal|arquivodata=2020-01-01}}'
        self.assertEqual(self.status(repeated, cleaned, "citation_associations"), "passed")

    def test_table_span_numeric_and_sort_key(self):
        before = '{| class="wikitable"\n|-\n! A !! B\n|-\n| rowspan="2" data-sort-value="10" | Primeiro || Segundo\n|}\n'
        self.assertEqual(self.status(before, before.replace('rowspan="2"', "rowspan='2'"), "table_cells"), "passed")
        for after in [before.replace('rowspan="2"', 'rowspan="3"'), before.replace('value="10"', 'value="20"'), before.replace('Primeiro || Segundo', 'Segundo || Primeiro')]:
            self.assertEqual(self.status(before, after, "table_cells"), "failed")

    def test_table_reference_syntax_has_separate_binding_check(self):
        before = '{|\n| A<ref name="1">Fonte.</ref>\n|}\n{{Referências}}'
        after = before.replace('name="1"', 'name="ref-1"')
        self.assertEqual(self.status(before, after, "table_cells"), "passed")
        self.assertEqual(self.status(before, after, "reference_bindings"), "passed")

    def test_table_native_link_trail_preserves_visible_word(self):
        before = '{|\n| [[Inventônimo|inventônimos]] e [[Hipotetina|hipotetinas]]\n|}'
        after = '{|\n| [[inventônimo]]s e [[hipotetina]]s\n|}'
        self.assertEqual(self.status(before, after, "table_cells"), "passed")
        self.assertEqual(self.status(before, after.replace(']]s e', ']] e'), "table_cells"), "failed")

    def test_table_html_native_media_alias(self):
        before = '{|\n| <div>[[File:Exemplo.jpg|frameless|250px|link=Destino]]</div>\n|}'
        after = '{|\n| <div>[[Imagem:Exemplo.jpg|semmoldura|250px|ligação=Destino]]</div>\n|}'
        self.assertEqual(self.status(before, after, "table_cells"), "passed")
        self.assertEqual(self.status(before, after.replace('ligação=Destino', 'ligação=Outro'), "table_cells"), "failed")

    def test_literal_comment_math_nowiki_are_exact(self):
        for source in ['<!-- Texto literal. -->', '<math>x+y</math>', '<nowiki>{{Exemplo}}</nowiki>', '<code>codigo()</code>']:
            self.assertEqual(self.status(source, source, "protected_literals"), "passed")
            self.assertEqual(self.status(source, source + source, "protected_literals"), "failed")

    def test_interior_markdown_collectors_are_exact_literals(self):
        before = 'Exemplo de código:\n```wikitext\n{{Referências}}Texto.<ref>Fonte literal.</ref>\n```\nFim.'
        after = 'Exemplo de código:\n```wikitext\nTexto.<ref>Fonte literal.</ref>\n```\nFim.\n\n{{Referências}}\n\n'
        self.assertEqual(self.status(before, before, 'protected_literals'), 'passed')
        self.assertEqual(self.status(before, after, 'protected_literals'), 'failed')
        for changed in [before.replace('Fonte literal', 'Outra fonte'), before.replace('```wikitext', '~~~wikitext'), before.replace('```\nFim.', 'Fim.')]:
            self.assertEqual(self.status(before, changed, 'protected_literals'), 'failed')

    def test_markdown_fences_respect_native_opaque_context_and_tail(self):
        for opening, closing in [('```wikitext', '```'), ('~~~~texto', '~~~~~'), ('  ```', '  ```')]:
            before = 'Texto.\n' + opening + '\n{{Modelo fictício|texto=<nowiki>}}\n' + closing + '\nFim.'
            self.assertEqual(self.status(before, before, 'protected_literals'), 'passed')
            self.assertEqual(self.status(before, before.replace('Modelo fictício', 'Outro modelo'), 'protected_literals'), 'failed')
        unfinished = 'Texto.\n```wikitext\n<ref>Fonte literal.'
        self.assertEqual(self.status(unfinished, unfinished, 'protected_literals'), 'passed')
        self.assertEqual(self.status(unfinished, unfinished + '</ref>', 'protected_literals'), 'failed')
        native = '<nowiki>\n```wikitext\n</nowiki>\nFora.\n'
        self.assertEqual(oracle.markdown_literals(oracle.mw.parse(native)), [])
        nested = '{{Modelo fictício|texto=<code>\n~~~\n</code>}}\nFora.\n'
        self.assertEqual(oracle.markdown_literals(oracle.mw.parse(nested)), [])

    def test_removed_whole_page_fence_is_explicitly_unproved(self):
        before = '```wikitext\nTexto.<ref>Fonte literal.</ref>\n{{Referências}}\n```\n'
        after = 'Texto.<ref>Fonte literal.</ref>\n{{Referências}}\n'
        check = oracle.compare_sources(before, after)['protected_literals']
        self.assertEqual(check['status'], 'ambiguous')
        self.assertFalse(check['equalWithinFiniteModel'])
        self.assertEqual(check['metrics']['sourceMarkdownFences'], 1)
        for changed in [before.replace('Fonte literal', 'Outra fonte'), before.replace('```wikitext', '~~~wikitext')]:
            self.assertEqual(self.status(before, changed, 'protected_literals'), 'failed')

    def test_media_alias_and_caption(self):
        before = '[[File:Exemplo.jpg|thumb|300px|alt=Texto alternativo|Legenda [[Destino|literal]].]]'
        after = before.replace('File:', 'Imagem:').replace('|thumb|', '|miniaturadaimagem|')
        self.assertEqual(self.status(before, after, "media"), "passed")
        for changed in [after.replace('Exemplo.jpg', 'Outro.jpg'), after.replace('alternativo', 'alterado'), after.replace('Destino', 'Outro destino'), after.replace('[[Imagem:', '[[:Imagem:')]:
            self.assertEqual(self.status(before, changed, "media"), "failed")

    def test_escaped_implicit_file_label_is_exact(self):
        before = '[[:File:Exemplo.jpg]]'
        after = '[[:Imagem:Exemplo.jpg]]'
        self.assertEqual(self.status(before, after, "media"), "failed")

    def test_category_alias_and_sort_key(self):
        before = '[[Category:Tema literal|Chave]]{{DEFAULTSORT:Chave geral}}'
        after = '[[Categoria:Tema literal|Chave]]{{ORDENAÇÃO:Chave geral}}'
        self.assertEqual(self.status(before, after, "category_sort"), "passed")
        self.assertEqual(self.status(before, after.replace('|Chave', '|Outra chave'), "category_sort"), "failed")


if __name__ == '__main__':
    unittest.main()
