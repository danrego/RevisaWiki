"""Publish explicitly prepared, exact-runtime public QA records.

Inputs are fresh public-shaped summaries, not raw corpus logs. A private config
binds every input by hash. This helper preserves original counts and statuses,
rejects private payloads, archives previous public bytes and never creates a
QA_SUMMARY or infers that an unexecuted test passed.
"""
from pathlib import Path
import argparse
import importlib.util
import ipaddress
import json
import re

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.22.0'
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
delivery=module('public_evidence_delivery_gate','build_delivery_v2220.py')
privacy=module('public_evidence_privacy_gate','publication_privacy_gate.py')
PUBLIC_KEYS={
 'DIRECTED_QA.json':set('version kind status manifestSha256 runnerSha256 externalProcessCapMilliseconds productDeadlineChanged historicalTestsModified wikipediaWrites attempts checks cases groups countingNotes privateReceiptSha256'.split()),
 'BUILD_REPRODUCTION.json':set('version kind status runtimeManifestSha256 cachedExpandedBaselineAvailable dependencyInstallation historicalBaselineByteExact allNineFilesByteEqual files wikipediaWrites'.split()),
 'INFERENCE_AND_DEMO.json':set('kind version status runtimeManifestSha256 runtimeFiles runtimeSourceInputs suiteAndDemonstrationSourcePins plannerActionClosure inferenceDirected offlineDemonstration privateEvidenceSha256 historicalEvidenceStatusesChanged runtimeSourcesChangedByValidation wikipediaWrites networkMutations publicNetworkWrites privacy'.split()),
 'NATIVE_EDITOR_UI.json':set('version kind status runtimeManifestSha256 browsers wikipediaWrites realInterval harnessPins'.split()),
 'FILE_DEMONSTRATION.json':set('kind version status runtimeManifestSha256 engineSha256 portableSha256 fixtureSha256 testSourcePins scope nativeBrowsers setupFailuresBeforeBrowserLaunch privateEvidenceSha256 historicalEvidenceStatusesChanged wikipediaWrites publicNetworkWrites runtimeSourcesModified rawPayloadsIncluded privateFilesystemPathsIncluded editorIdentitiesIncluded sourceArticleTitlesIncluded screenshotsIncluded'.split()),
 'LEGACY_QA.json':set('schemaVersion version distributionRevision kind status runtimeManifestSha256 rawSummaryPrivateEvidenceSha256 adjudicatedSummaryPrivateEvidenceSha256 rawStatus rawTasks rawPassedTasks rawFailedTasksRetained qualifiedRawFailedTasks unqualifiedRawFailedTasks rawTaskCalculateCalls rawTaskChecksReported qualificationChecks qualificationCurrentCalculateCalls qualificationHistoricalBaselineCalculateCalls uniqueFiniteBiographyContractCases biographyUnchangedSafeRefusalsPerBundle biographyUnchangedSafeRefusalAutomaticCorrectionCredit biographyExactVerticalPreferencesPerBundle runtimeFiles sourcePins futureRunner tasks historicalTestsAndRawReportsModified runtimeOrPreservationChecksChanged publicPersonalInformationIncluded wikipediaWrites publicationPerformed previousPublicLegacyEvidenceSha256 historicalStatusesModified currentRuntimeRawAndQualificationCompleted'.split()),
 'CORPUS_QA.json':set('schemaVersion version distributionRevision kind status runtimeManifestSha256 runtimeFiles sourceInputs runtimeSourceInputs remainingCaptures unresolvedIntegrityDefects historicalStatusesChanged preservationGuardsRemoved wikipediaWrites counts captureCount capturedRevisions uniquePages distinctSourceHashes articleCount retainedHistoricalFailures documentedLimits sourcePreservation results scopes historicalResults failures performance privateEvidenceSha256 countingNotes guardChecks'.split()),
 'NATIVE_DOCUMENTATION.json':set('version status sourceSha256 responseSha256 warnings hasCitationError templateCount unexpectedActiveTemplates sections authenticated wikipediaWrites error scope renderedCodeExamples receiptHashes proofNotes'.split()),
}
PRIVATE_KEYS=set('source raw text before after title articletitle articletitles article pageid pageids revid revids revisionid username user editor editors account email ipaddress sourcepath outputpath outputfile localpath directory command stdout stderr rawpayload rawsource sourcecode screenshotpath profilepath cookie authorization'.split())
PRIVATE_INCLUDED=set('rawPayloadsIncluded privateFilesystemPathsIncluded editorIdentitiesIncluded sourceArticleTitlesIncluded screenshotsIncluded publicPersonalInformationIncluded'.split())
LOCAL=re.compile(r'(?:^|[\s"\'(])/(?:tmp|private|var|opt|mnt|Users|home)/|[A-Z]:[\\/]Users[\\/]',re.I)
CAPTURE=re.compile(r'\b\d{4,}_\d{5,}(?:\b|_)|\.wiki\.gz\b',re.I)
URL=re.compile(r'https?://[^\s"<>]+',re.I)
IP=re.compile(r'(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])')

def assert_public(value,path=()):
    if isinstance(value,dict):
        for key,item in value.items():
            if not isinstance(key,str):raise ValueError('Non-text public metadata key')
            normalized=re.sub(r'[-_\s]','',key).lower()
            if normalized in PRIVATE_KEYS:raise ValueError('Raw private metadata is not public evidence')
            if key in PRIVATE_INCLUDED and item is not False:raise ValueError('Private material was included')
            assert_public(key,path+('key',));assert_public(item,path+(key,))
    elif isinstance(value,list):
        for item in value:assert_public(item,path)
    elif isinstance(value,str):
        if LOCAL.search(value)or CAPTURE.search(value)or privacy.EMAIL.search(value)or any(pattern.search(value)for pattern in privacy.RULES.values())or privacy.identity_findings(value):
            raise ValueError('Private data is not permitted in a public QA record')
        for match in URL.finditer(value):
            url=match.group().rstrip('.,;')
            if url!='https://pt.wikipedia.org/w/api.php'and not(url=='https://github.com/danrego/RevisaWiki'or url.startswith('https://github.com/danrego/RevisaWiki/')):
                raise ValueError('Article or unreviewed external URL in public QA metadata')
        if path and path[-1]not in ('version','browserVersion'):
            for match in IP.finditer(value):
                try:ipaddress.ip_address(match.group())
                except ValueError:continue
                raise ValueError('Network identity in public QA metadata')
        if path and path[-1]=='file'and(Path(value).is_absolute()or '\\'in value or '..'in Path(value).parts):
            raise ValueError('Private file identity in public QA metadata')
    elif value is not None and type(value)not in (bool,int,float):raise ValueError('Unsupported public QA metadata')

def checked_manifest(path,expected_sha):
    raw=delivery.check_sha(path,expected_sha);manifest=json.loads(raw)
    if manifest.get('version')!=VERSION or manifest.get('distributionRevision')!=VERSION:
        raise ValueError('Wrong final runtime version')
    expected={f'RevisaWiki_v2_22_0{suffix}'for suffix in ('.js','_dados.js','_catalogo.js','_regras.js','_completo.js')}|{'Carregador_comunitario_RevisaWiki_v2_22_0.js','Carregador_common_js_RevisaWiki_v2_22_0.js','Chamada_fixa_RevisaWiki_common.js','Chamada_fixa_RevisaWiki_copia_propria.js'}
    if set(manifest.get('files',{}))!=expected:raise ValueError('All nine final runtime files are required')
    for name,pin in manifest['files'].items():
        if Path(name).name!=name:raise ValueError('Invalid runtime filename')
        delivery.check_pin(ROOT/'dist'/VERSION/name,pin)
    for name,pin in manifest['sourceInputs'].items():delivery.check_pin(delivery.checked_repository_path(name,'source input'),pin)
    return raw,manifest

def checked_public_record(name,record):
    if not isinstance(record,dict)or set(record)-PUBLIC_KEYS[name]:raise ValueError('Prepare the explicit public schema before aggregation')
    if name=='LEGACY_QA.json':
        previous=record.get('previousPublicLegacyEvidenceSha256')
        if not isinstance(previous,str)or re.fullmatch(r'[0-9a-f]{64}',previous)is None or record.get('historicalStatusesModified')is not False or record.get('currentRuntimeRawAndQualificationCompleted')is not True:
            raise ValueError('Legacy provenance must bind the prior receipt and completed current validation')
    assert_public(record)
    return record

def prepare(manifest_path,manifest_sha,config):
    manifest_raw,manifest=checked_manifest(manifest_path,manifest_sha)
    if config.get('runtimeManifestSha256')!=manifest_sha or set(config.get('records',{}))!=set(PUBLIC_KEYS):
        raise ValueError('The config must bind every final public QA class')
    payloads={};input_pins={}
    for name,descriptor in config['records'].items():
        if not isinstance(descriptor,dict)or set(descriptor)!={'path','sha256'}:raise ValueError('Each input needs an explicit path and exact hash')
        raw=delivery.check_sha(Path(descriptor['path']),descriptor['sha256']);record=json.loads(raw)
        checked_public_record(name,record);payloads[name]=delivery.raw_json(record);input_pins[name]=delivery.pin(raw)
    manual=ROOT/'docs'/VERSION/'Documentacao_RevisaWiki_v2_22_0.wiki'
    qa={'documentationInputs':{manual.name:delivery.pin(manual.read_bytes())},'evidencePins':{f'tests/evidence/{VERSION}/'+name:delivery.pin(raw)for name,raw in payloads.items()}}
    delivery.checked_validation_evidence(manifest,manifest_sha,qa,{f'tests/evidence/{VERSION}/'+name:raw for name,raw in payloads.items()})
    checked_manifest(manifest_path,manifest_sha)
    return payloads,{'version':VERSION,'runtimeManifestSha256':delivery.sha(manifest_raw),'inputs':input_pins,'files':{name:delivery.pin(raw)for name,raw in payloads.items()},'globalQACreated':False,'wikipediaWrites':0}

def preserve_existing(output,archive):
    output=Path(output).resolve();archive=Path(archive).resolve()
    repository=ROOT.resolve()
    if archive==repository or repository in archive.parents:raise ValueError('Keep the historical archive outside the public repository')
    manifest_file=archive/'ARCHIVE_MANIFEST_PRIVATE.json'
    if archive.exists():
        record=json.loads(manifest_file.read_bytes())
        for name,pin in record['files'].items():
            if Path(name).name!=name:raise ValueError('Invalid archive filename')
            delivery.check_pin(archive/name,pin)
        return delivery.pin(manifest_file.read_bytes())
    old={p.name:p.read_bytes()for p in sorted(output.glob('*.json'))}
    archive.mkdir(parents=True)
    for name,raw in old.items():(archive/name).write_bytes(raw)
    record={'kind':'immutable-public-evidence-before-replacement','files':{name:delivery.pin(raw)for name,raw in old.items()},'historicalStatusesModified':False}
    manifest_file.write_bytes(delivery.raw_json(record))
    for name,raw in old.items():
        if (archive/name).read_bytes()!=raw or (output/name).read_bytes()!=raw:raise ValueError('Historical evidence changed during backup')
    return delivery.pin(manifest_file.read_bytes())

def aggregate(manifest_path,manifest_sha,config,output,archive):
    payloads,receipt=prepare(manifest_path,manifest_sha,config)
    receipt['previousPublicArchive']=preserve_existing(output,archive)
    delivery.write_frozen_payloads(Path(output),payloads)
    return receipt

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest',type=Path,default=ROOT/'tests/expected_release_v2220.json')
    parser.add_argument('--manifest-sha256',required=True)
    parser.add_argument('--config',type=Path,required=True)
    parser.add_argument('--output',type=Path,default=ROOT/'tests/evidence'/VERSION)
    parser.add_argument('--archive',type=Path,required=True)
    args=parser.parse_args();result=aggregate(args.manifest,args.manifest_sha256,json.loads(args.config.read_bytes()),args.output,args.archive)
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
