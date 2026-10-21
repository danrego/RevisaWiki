import importlib.util, unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('oracle102',Path(__file__).with_name('independent_corpus.py'))
o=importlib.util.module_from_spec(spec);spec.loader.exec_module(o)

class NativeCollector102Cases(unittest.TestCase):
    def statuses(self,before,after):
        r=o.compare_sources(before,after)
        return [r[k]['status'] for k in ['reference_bindings','reference_lists']]

    def reject(self,before,after):
        self.assertEqual(self.statuses(before,after),['failed','failed'])

    def test_bare_native_notelist_same_group_headless(self):
        before='<ref name="a" group="lower-alpha">Fonte literal.</ref><ref name="a" group="lower-alpha"/>{{Notelist}}'
        after=before.replace('{{Notelist}}','{{Referências|grupo=lower-alpha|nível=0}}')
        self.assertEqual(self.statuses(before,after),['passed','passed'])
        for target in [after.replace('grupo=lower-alpha','grupo=nota'),after.replace('{{Referências|grupo=lower-alpha|nível=0}}',''),after.replace('name="a" group="lower-alpha"/>','name="b" group="lower-alpha"/>')]:
            self.assertIn('failed',self.statuses(before,target))

    def test_native_notelist_source_role_priority_and_blanks(self):
        for raw,expected in [
            ('{{Notelist}}',('lower-alpha','')),
            ('{{Notelist|group=|grupo=nota|refs=|notes=<ref>Campo inativo.</ref>}}',('lower-alpha','')),
            ('{{Notelist|group=nota|grupo=upper-alpha|notes=<ref>Fonte literal.</ref>}}',('nota','<ref>Fonte literal.</ref>')),
            ('{{Notelist|group=note}}',('lower-alpha','')),
        ]:
            model=o.collector(o.mw.parse(raw).filter_templates()[0])
            self.assertEqual((model['bank'],model['selectedBank']),expected)
        for raw in ['{{Notelist|group=nota|group=nota}}','{{Notelist|group={{Grupo}}}}','{{Notelist|group=&nbsp;}}']:
            self.assertTrue(o.collector(o.mw.parse(raw).filter_templates()[0])['ambiguous'])

    def test_listaref_header_only_preserves_ignored_group_and_bank_fields(self):
        before='<ref name="a">Fonte literal.</ref>{{Sfn|Nome|2001}}{{listaref|group=lower-alpha|referencias=<ref name="inativo">Fonte inativa.</ref>|refs=}}'
        after=before.replace('{{listaref','{{Referências')
        result=o.compare_sources(before,after)
        self.assertTrue(all(result[k]['equalWithinFiniteModel'] for k in ['reference_bindings','reference_lists']))
        self.assertEqual(self.statuses(before,after),['ambiguous','ambiguous'])
        self.assertEqual(o.collector(o.mw.parse('{{listaref|group=lower-alpha}}').filter_templates()[0])['groups'],[''])
        for target in [after.replace('group=lower-alpha','group=nota'),after.replace('referencias=','refs=',1),after.replace('Fonte inativa.','Campo mudado.'),after.replace('name="a"','name="b"')]:
            # This source retains the existing uncertain generated helper.
            # Every raw ref/argument stays exact under its quarantine.
            self.reject(before,target)

    def test_both_new_collectors_have_exact_native_identity(self):
        for head in ['Listaref','listaref','_Listaref','Listaref_','Template_:_Listaref','Predefinição:Listaref']:
            self.assertIsNotNone(o.native_collector_102(o.mw.parse('{{'+head+'}}').filter_templates()[0]))
        for head in ['LISTAREF','ListaRef','Listaref\u00a0','\x0bListaref','Listaref\x85','Lístaref','Listaref{{Nome}}']:
            self.assertIsNone(o.native_collector_102(o.mw.parse('{{'+head+'}}').filter_templates()[0]))

    def test_rich_math_efn_remains_explicitly_opaque(self):
        before='A.<ref name="a">{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|data=1 de janeiro de 2001}}</ref>{{Efn|Nota literal <math>x</math>.}} B.<ref name="a"/>{{Notelist}}{{Referências}}'
        after=before.replace('data=1 de janeiro de 2001','data=2001-01-01').replace('name="a"/>','name="a" />').replace('{{Notelist}}','{{Referências|grupo=lower-alpha|nível=0}}')
        self.before,self.after=before,after
        result=o.compare_sources(before,after)
        for key in ['reference_bindings','reference_lists']:
            self.assertEqual(result[key]['status'],'ambiguous')
            self.assertTrue(result[key]['equalWithinFiniteModel'])
            self.assertFalse(result[key]['metrics']['nativeOpaqueMathScopeChanged'])
            self.assertIn('native opaque math note body retained without expansion',result[key]['ambiguities'])

    def math_pair(self):
        before='<ref name="a">Fonte A.</ref>{{Efn|Nota literal <math>x</math>.}}<ref name="a"/>{{Notelist}}{{Referências}}'
        return before,before.replace('{{Notelist}}','{{Referências|grupo=lower-alpha|nível=0}}')

    def test_opaque_math_body_unknown_owner_and_helper_loss_mutants(self):
        before,after=self.math_pair()
        helper='{{Efn|Nota literal <math>x</math>.}}'
        for target in [after.replace('<math>x</math>','<math>y</math>'),after.replace(helper,'{{Dono desconhecido|'+helper+'}}'),after.replace(helper,''),after.replace(helper,'{{Outro helper|Nota literal <math>x</math>.}}')]:
            self.reject(before,target)

    def test_opaque_math_name_group_and_anonymous_loss_mutants(self):
        before,after=self.math_pair()
        for target in [after.replace('<ref name="a">','<ref name="b">'),after.replace('<ref name="a"/>','<ref name="b"/>'),after.replace('<ref name="a"/>','<ref name="a" group="n"/>'),after.replace('Fonte A.','Fonte B.'),after.replace('<ref name="a"/>',''),after.replace('<ref name="a"/>','<ref>Nova fonte.</ref>')]:
            self.reject(before,target)

    def test_opaque_math_marker_and_collector_crossing_mutants(self):
        before,after=self.math_pair();helper='{{Efn|Nota literal <math>x</math>.}}';collector='{{Referências|grupo=lower-alpha|nível=0}}'
        for target in [after.replace(helper,'').replace('<ref name="a"/>','<ref name="a"/>'+helper),after.replace(collector,''),after.replace(collector,'{{Referências|grupo=nota|nível=0}}'),collector+after.replace(collector,''),after.replace(collector,collector+collector)]:
            self.reject(before,target)

    def test_math_subset_never_relaxes_named_dynamic_or_other_rich_helpers(self):
        for helper in ['{{Efn|Nota <math>x</math>.|name=a}}','{{Efn|Nota <math>x</math>.|group=nota}}','{{Efn|Nota <math>x</math>.|1=Outra nota}}','{{Efn|Nota {{Dono}} <math>x</math>.}}','{{Refn|Nota <math>x</math>.}}','{{Efn|Nota <span>x</span>.}}']:
            t=o.mw.parse(helper).filter_templates()[0]
            self.assertFalse(o.opaque_native_math_efn_102(t))
            source='<ref name="a">Fonte literal.</ref>'+helper+'{{Referências}}'
            self.reject(source,source.replace('Fonte literal.','Outra fonte.'))

    def test_inert_math_efn_is_not_an_active_scope(self):
        source='<nowiki>{{Efn|Nota <math>x</math>.}}</nowiki><ref>Fonte literal.</ref>{{Referências}}'
        self.assertIsNone(o.opaque_native_math_efn_scope_102(o.mw.parse(source)))

    def test_math_scope_retains_complete_native_cs1_associations(self):
        citation='{{Citar web|título=Fonte literal|autor=Pessoa Alfa;Pessoa Beta|volume=Vol. 3|data=1 de janeiro de 2001|url=https://web.archive.org/web/20110102030405/https://example.invalid/fonte}}'
        repaired='{{Citar web|título=Fonte literal|autor=Pessoa Alfa|autor2=Pessoa Beta|volume=3|data=2001-01-01|url=https://example.invalid/fonte|arquivourl=https://web.archive.org/web/20110102030405/https://example.invalid/fonte|arquivodata=2011-01-02}}'
        before='<ref name="a">'+citation+'</ref>{{Efn|Nota <math>x</math>.}}<ref name="a"/>{{Notelist}}{{Referências}}'
        after=before.replace(citation,repaired).replace('{{Notelist}}','{{Referências|grupo=lower-alpha|nível=0}}')
        for key in ['reference_bindings','reference_lists']:
            result=o.compare_sources(before,after)[key]
            self.assertEqual(result['status'],'ambiguous')
            self.assertTrue(result['equalWithinFiniteModel'])
        for target in [after.replace('Fonte literal','Outro título'),after.replace('Pessoa Beta','Pessoa Gama'),after.replace('2001-01-01','2002-01-01'),after.replace('volume=3','volume=4'),after.replace('https://example.invalid/fonte|','https://example.invalid/outra|'),after.replace('arquivodata=2011-01-02','arquivodata=2011-02-02')]:
            self.reject(before,target)

if __name__=='__main__':unittest.main()
