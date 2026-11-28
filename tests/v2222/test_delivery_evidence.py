"""Directed evidence cannot hide unqualified raw failures behind a passed label."""
from pathlib import Path
import hashlib
import importlib.util
import tempfile
import unittest
from unittest import mock

ROOT=Path(__file__).resolve().parents[2]
SPEC=importlib.util.spec_from_file_location('delivery_evidence2222',ROOT/'scripts/build_delivery_v2222.py')
DELIVERY=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(DELIVERY)


def evidence_fixture(manual,directed):
    """Valid synthetic neighboring classes isolate the directed counter gate."""
    manifest_sha='a'*64
    manifest={'files':{'synthetic-runtime.js':{'bytes':1,'sha256':'b'*64}},'sourceInputs':{}}
    records={}
    for name in [*DELIVERY.REQUIRED_RUNTIME_EVIDENCE,'NATIVE_DOCUMENTATION.json']:
        record={'version':'2.22.2','status':'passed','wikipediaWrites':0}
        if name in DELIVERY.REQUIRED_RUNTIME_EVIDENCE:
            record[DELIVERY.REQUIRED_RUNTIME_EVIDENCE[name]]=manifest_sha
        if name=='DIRECTED_QA.json':
            record.update(directed)
        elif name=='BUILD_REPRODUCTION.json':
            record['files']=manifest['files']
        elif name=='LEGACY_QA.json':
            record.update(unqualifiedRawFailedTasks=0,historicalTestsAndRawReportsModified=False,runtimeOrPreservationChecksChanged=False)
        elif name=='CORPUS_QA.json':
            record.update(remainingCaptures=0,unresolvedIntegrityDefects=0,historicalStatusesChanged=False,preservationGuardsRemoved=False)
        elif name=='NATIVE_DOCUMENTATION.json':
            record.update(sourceSha256=hashlib.sha256(manual).hexdigest(),authenticated=False,
                renderedCodeExamples={'examples':1,'allCodeBodiesByteExact':True,'ownedBrowserSessionClosed':True,'textOnlyScope':True})
        records['tests/evidence/2.22.2/'+name]=DELIVERY.raw_json(record)
    qa={'evidencePins':{name:DELIVERY.pin(raw)for name,raw in records.items()},
        'documentationInputs':{'Documentacao_RevisaWiki_v2_22_2.wiki':{'sha256':hashlib.sha256(manual).hexdigest()}}}
    return manifest,manifest_sha,qa,records


class DirectedEvidenceFailureCounts(unittest.TestCase):
    def setUp(self):
        temporary=tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        directory=Path(temporary.name)
        self.manual=b'<pre>Exemplo</pre>'
        (directory/'Documentacao_RevisaWiki_v2_22_2.wiki').write_bytes(self.manual)
        self.patcher=mock.patch.object(DELIVERY,'DOCS',directory)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def validate(self,directed):
        return DELIVERY.checked_validation_evidence(*evidence_fixture(self.manual,directed))

    def test_raw_pass_with_integer_zero_is_accepted(self):
        result=self.validate({'rawStatus':'passed','unqualifiedRawFailedTasks':0})
        self.assertEqual(result['DIRECTED_QA.json']['rawStatus'],'passed')

    def test_precisely_qualified_raw_failure_with_integer_zero_is_accepted(self):
        result=self.validate({'rawStatus':'failed','qualifiedRawFailedTasks':1,'unqualifiedRawFailedTasks':0})
        self.assertEqual(result['DIRECTED_QA.json']['rawStatus'],'failed')
        self.assertEqual(result['DIRECTED_QA.json']['qualifiedRawFailedTasks'],1)

    def test_positive_unqualified_raw_failures_are_rejected(self):
        with self.assertRaises(ValueError):
            self.validate({'rawStatus':'failed','unqualifiedRawFailedTasks':3})

    def test_missing_negative_and_noninteger_counts_are_rejected(self):
        for value in [-1,False,True,0.0,'0',None,[],{}]:
            with self.subTest(value=value),self.assertRaises(ValueError):
                self.validate({'rawStatus':'failed','unqualifiedRawFailedTasks':value})
        with self.assertRaises(ValueError):
            self.validate({'rawStatus':'failed'})


if __name__=='__main__':unittest.main()
