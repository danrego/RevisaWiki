"""Fictional anti-waiver controls for a nonexpanding raw math-note observer."""
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('oracle103',Path(__file__).with_name('independent_corpus.py'))
o=importlib.util.module_from_spec(spec);spec.loader.exec_module(o)

class OpaqueInlineMath103Cases(unittest.TestCase):
    helper='{{Efn|Nota literal <math display="inline">x+1</math>.}}'
    old_citation='{{Citar web|título=Fonte literal|autor=Pessoa Alfa;Pessoa Beta|volume=Vol. 3|data=1 de janeiro de 2001|url=https://web.archive.org/web/20110102030405/https://example.invalid/fonte}}'
    new_citation='{{Citar web|título=Fonte literal|autor=Pessoa Alfa|autor2=Pessoa Beta|volume=3|data=2001-01-01|url=https://example.invalid/fonte|arquivourl=https://web.archive.org/web/20110102030405/https://example.invalid/fonte|arquivodata=2011-01-02}}'

    def pair(self):
        source='<ref name="a">'+self.old_citation+'</ref>'+self.helper+'<ref name="b">Fonte B.</ref><ref name="a"/><ref>Fonte anônima.</ref>{{Notelist}}{{Referências}}'
        target=source.replace(self.old_citation,self.new_citation).replace('name="a"/>','name="a" />').replace('{{Notelist}}','{{Referências|grupo=lower-alpha|nível=0}}')
        return source,target

    def rejected(self,source,target):
        result=o.compare_sources(source,target)
        for key in ['reference_bindings','reference_lists']:
            self.assertEqual(result[key]['status'],'failed',key)

    def opaque(self,source,target):
        result=o.compare_sources(source,target)
        for key in ['reference_bindings','reference_lists']:
            self.assertEqual(result[key]['status'],'ambiguous',key)
            self.assertTrue(result[key]['equalWithinFiniteModel'])
            self.assertFalse(result[key]['metrics']['nativeOpaqueMathScopeChanged'])
            self.assertIn('native opaque math note body retained without expansion',result[key]['ambiguities'])
        return result

    def test_exact_inline_math_stays_opaque_with_independent_cs1_and_collector_repairs(self):
        source,target=self.pair()
        result=self.opaque(source,target)
        self.assertEqual(result['citation_associations']['status'],'passed')
        self.assertFalse(result['reference_bindings']['metrics'].get('uncertainNativeIdentitySubsystemChanged',False))

    def test_unchanged_inline_math_never_becomes_fully_validated(self):
        source,_=self.pair();self.opaque(source,source)

    def test_math_attribute_and_body_mutations_are_rejected(self):
        source,target=self.pair()
        for old,new in [('display="inline"','display="block"'),('display="inline"','display="inline" id="outro"'),(' display="inline"',''),('x+1','x+2'),('Nota literal','Outra nota')]:
            with self.subTest(change=(old,new)):self.rejected(source,target.replace(old,new))

    def test_helper_loss_duplication_and_unknown_owner_are_rejected(self):
        source,target=self.pair()
        for changed in ['',self.helper+self.helper,'{{Modelo fictício|'+self.helper+'}}',self.helper.replace('Efn','Refn')]:
            with self.subTest(changed=changed):self.rejected(source,target.replace(self.helper,changed))

    def test_outside_resolved_call_name_group_and_anonymous_loss_are_rejected(self):
        source,target=self.pair()
        for changed in [target.replace('<ref name="a" />','<ref name="b" />'),target.replace('<ref name="a" />','<ref name="a" group="nota" />'),target.replace('<ref>Fonte anônima.</ref>',''),target.replace('Fonte B.','Outra fonte.'),target.replace('<ref name="a" />','<ref name="a" />'+'<ref>Fonte nova.</ref>')]:
            with self.subTest(changed=changed):self.rejected(source,changed)

    def test_collector_group_count_and_position_mutations_are_rejected(self):
        source,target=self.pair();collector='{{Referências|grupo=lower-alpha|nível=0}}'
        for changed in [target.replace(collector,''),target.replace(collector,collector+collector),target.replace(collector,'{{Referências|grupo=nota|nível=0}}'),collector+target.replace(collector,''),target.replace('{{Referências}}','')]:
            with self.subTest(changed=changed):self.rejected(source,changed)

    def test_helper_cannot_cross_a_marker_or_collector(self):
        source,target=self.pair();collector='{{Referências|grupo=lower-alpha|nível=0}}'
        for changed in [target.replace(self.helper,'').replace('<ref name="a" />','<ref name="a" />'+self.helper),target.replace(self.helper,'').replace(collector,collector+self.helper)]:
            with self.subTest(changed=changed):self.rejected(source,changed)

    def test_typed_cs1_mutations_are_not_hidden_by_the_opaque_math_note(self):
        source,target=self.pair()
        for old,new in [('título=Fonte literal','título=Outra fonte'),('autor2=Pessoa Beta','autor2=Pessoa Gama'),('volume=3','volume=4'),('data=2001-01-01','data=2001-01-02'),('url=https://example.invalid/fonte','url=https://example.invalid/outra'),('arquivodata=2011-01-02','arquivodata=2011-01-03')]:
            with self.subTest(change=(old,new)):self.rejected(source,target.replace(old,new))

    def test_unknown_math_attributes_retain_the_old_conservative_boundary(self):
        for opening in ['<math display="block">',"<math display='inline'>",'<math display=inline>','<math  display="inline">','<math display="inline" >','<math DISPLAY="inline">','<math display="inline" id="a">','<math display="{{Modo}}">']:
            helper='{{Efn|Nota literal '+opening+'x</math>.}}'
            self.assertFalse(o.opaque_native_math_efn_102(o.mw.parse(helper).filter_templates()[0]))
            source='<ref name="a">{{Citar web|título=Fonte literal|data=1 de janeiro de 2001}}</ref>'+helper+'{{Referências}}'
            with self.subTest(opening=opening):self.rejected(source,source.replace('data=1 de janeiro de 2001','data=2001-01-01'))

    def test_explicit_identity_and_other_rich_helpers_are_not_extended(self):
        for helper in [self.helper[:-2]+'|name=a}}',self.helper[:-2]+'|group=nota}}',self.helper[:-2]+'|1=Outra nota}}',self.helper.replace('Efn','Refn'),self.helper.replace('Nota literal ','Nota {{Valor}} '),self.helper.replace('<math display="inline">x+1</math>','<span>x</span>')]:
            with self.subTest(helper=helper):self.assertFalse(o.opaque_native_math_efn_102(o.mw.parse(helper).filter_templates()[0]))

    def test_math_internal_bytes_are_observed_not_interpreted(self):
        # The preexisting attr-free102 contract already treats all TeX bytes
        # as opaque. Braces inside the math extension are not an outer owner.
        source,target=self.pair()
        source=source.replace('x+1','{{Valor}}');target=target.replace('x+1','{{Valor}}')
        self.opaque(source,target)
        self.rejected(source,target.replace('{{Valor}}','{{Outro valor}}'))

    def test_inline_math_in_true_literal_owner_is_not_an_active_note_scope(self):
        source='<nowiki>'+self.helper+'</nowiki><ref>Fonte literal.</ref>{{Referências}}'
        self.assertIsNone(o.opaque_native_math_efn_scope_102(o.mw.parse(source)))
        changed=source.replace('x+1','x+2')
        self.assertEqual(o.compare_sources(source,changed)['protected_literals']['status'],'failed')

if __name__=='__main__':unittest.main()
