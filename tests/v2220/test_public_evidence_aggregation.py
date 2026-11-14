"""Synthetic metadata only; never aggregate current public runtime evidence."""
from pathlib import Path
import copy
import importlib.util
import json
import tempfile
import unittest
from unittest import mock
from tests.v2220 import test_delivery_freeze as freeze

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('aggregation2220',ROOT/'scripts/aggregate_public_evidence_v2220.py')
aggregate=importlib.util.module_from_spec(spec);spec.loader.exec_module(aggregate)

class PublicAggregation(unittest.TestCase):
    def setUp(self):
        self.fixture=freeze.ValidationEvidenceFreeze();self.fixture.setUp();self.repo=self.fixture.root
        self.temp=tempfile.TemporaryDirectory();self.private=Path(self.temp.name)
        self.patches=[mock.patch.object(value,'ROOT',self.repo)for value in (aggregate,aggregate.delivery)]
        for patch in self.patches:patch.start()
        names=[f'RevisaWiki_v2_22_0{s}'for s in ('.js','_dados.js','_catalogo.js','_regras.js','_completo.js')]+['Carregador_comunitario_RevisaWiki_v2_22_0.js','Carregador_common_js_RevisaWiki_v2_22_0.js','Chamada_fixa_RevisaWiki_common.js','Chamada_fixa_RevisaWiki_copia_propria.js']
        self.manifest=copy.deepcopy(self.fixture.manifest);self.manifest.update(version='2.22.0',distributionRevision='2.22.0');self.manifest['files']={}
        for name in names:
            path=self.repo/'dist/2.22.0'/name;path.parent.mkdir(parents=True,exist_ok=True);raw=('fictional metadata fixture '+name).encode();path.write_bytes(raw);self.manifest['files'][name]=aggregate.delivery.pin(raw)
        self.manifest_path=self.private/'manifest.json';self.manifest_path.write_bytes(aggregate.delivery.raw_json(self.manifest));self.sha=aggregate.delivery.sha(self.manifest_path.read_bytes())
        self.records=copy.deepcopy(self.fixture.records)
        for name,field in aggregate.delivery.REQUIRED_RUNTIME_EVIDENCE.items():self.records[name][field]=self.sha
        self.records['BUILD_REPRODUCTION.json']['files']=copy.deepcopy(self.manifest['files'])
        self.records['INFERENCE_AND_DEMO.json']['runtimeFiles']=copy.deepcopy(self.manifest['files'])
        self.records['LEGACY_QA.json']['runtimeFiles']={names[0]:self.manifest['files'][names[0]]}
        self.records['LEGACY_QA.json'].update(previousPublicLegacyEvidenceSha256='f'*64,historicalStatusesModified=False,currentRuntimeRawAndQualificationCompleted=True)
        manual=self.repo/'docs/2.22.0/Documentacao_RevisaWiki_v2_22_0.wiki';manual.parent.mkdir(parents=True);manual.write_bytes(b'Frozen manual.\n')
        self.output=self.repo/'tests/evidence/2.22.0';self.output.mkdir(parents=True)
        self.config={'runtimeManifestSha256':self.sha,'records':{}}
        self.save_records()

    def tearDown(self):
        for patch in reversed(self.patches):patch.stop()
        self.fixture.tearDown();self.temp.cleanup()

    def save_records(self):
        for name,value in self.records.items():
            path=self.private/name;path.write_bytes(aggregate.delivery.raw_json(value));self.config['records'][name]={'path':str(path),'sha256':aggregate.delivery.sha(path.read_bytes())}

    def test_exact_counts_and_statuses_are_preserved_and_old_bytes_archived(self):
        prior=b'{"status":"historical raw failure"}\n';(self.output/'DIRECTED_QA.json').write_bytes(prior)
        result=aggregate.aggregate(self.manifest_path,self.sha,self.config,self.output,self.private/'archive')
        self.assertFalse(result['globalQACreated']);self.assertEqual(len(result['files']),8)
        self.assertEqual((self.private/'archive/DIRECTED_QA.json').read_bytes(),prior)
        for name,record in self.records.items():self.assertEqual(json.loads((self.output/name).read_bytes()),record)
        self.assertFalse((self.output/'QA_SUMMARY.json').exists())

    def test_stale_runtime_missing_class_and_changed_input_fail_before_writes(self):
        changed=copy.deepcopy(self.config);changed['runtimeManifestSha256']='0'*64
        with self.assertRaises(ValueError):aggregate.prepare(self.manifest_path,self.sha,changed)
        changed=copy.deepcopy(self.config);del changed['records']['CORPUS_QA.json']
        with self.assertRaises(ValueError):aggregate.prepare(self.manifest_path,self.sha,changed)
        (self.private/'DIRECTED_QA.json').write_bytes(b'Changed input.')
        with self.assertRaises(ValueError):aggregate.prepare(self.manifest_path,self.sha,self.config)
        self.assertEqual(list(self.output.iterdir()),[])

    def test_private_paths_identifiers_payloads_and_article_urls_are_rejected(self):
        private_path='/'+'Users'+'/'+'Example'+'/capture.json'
        email='example'+'@'+'invalid.example'
        for value in [private_path,email,'https://pt.wikipedia.org/wiki/Fictional_article','123456_98765432.wiki.gz']:
            with self.subTest(kind='private text'),self.assertRaises(ValueError):aggregate.assert_public({'countingNotes':[value]})
        for key in ('source','before','after','pageid','editor','sourcePath','stdout'):
            with self.subTest(key=key),self.assertRaises(ValueError):aggregate.assert_public({key:'not public'})
        with self.assertRaises(ValueError):aggregate.assert_public({'privateFilesystemPathsIncluded':True})

    def test_unknown_top_level_metadata_is_not_silently_published(self):
        self.records['DIRECTED_QA.json']['unknownPrivateDetail']='must be reviewed';self.save_records()
        with self.assertRaises(ValueError):aggregate.prepare(self.manifest_path,self.sha,self.config)

    def test_legacy_provenance_accepts_only_the_exact_digest_and_boolean_contract(self):
        valid=self.records['LEGACY_QA.json'];self.assertIs(aggregate.checked_public_record('LEGACY_QA.json',valid),valid)
        mutations={
            'previousPublicLegacyEvidenceSha256':[None,0,'a'*63,'a'*65,'g'*64,'A'*64,{'sha256':'a'*64}],
            'historicalStatusesModified':[True,0,None,'false'],
            'currentRuntimeRawAndQualificationCompleted':[False,1,None,'true'],
        }
        for key,values in mutations.items():
            for value in values:
                with self.subTest(key=key,value=value):
                    changed=copy.deepcopy(valid);changed[key]=value
                    with self.assertRaises(ValueError):aggregate.checked_public_record('LEGACY_QA.json',changed)
            changed=copy.deepcopy(valid);del changed[key]
            with self.assertRaises(ValueError):aggregate.checked_public_record('LEGACY_QA.json',changed)

    def test_archive_is_immutable_and_must_stay_outside_public_repository(self):
        (self.output/'old.json').write_bytes(b'Frozen old evidence.');archive=self.private/'archive'
        first=aggregate.preserve_existing(self.output,archive);self.assertEqual(aggregate.preserve_existing(self.output,archive),first)
        (archive/'old.json').write_bytes(b'Changed backup.')
        with self.assertRaises(ValueError):aggregate.preserve_existing(self.output,archive)
        with self.assertRaises(ValueError):aggregate.preserve_existing(self.output,self.repo/'private-backup')

if __name__=='__main__':unittest.main()
