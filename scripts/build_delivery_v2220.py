"""Assemble the exact tested release; never write to Wikipedia."""
from pathlib import Path
import hashlib
import importlib.util
import io
import json
import zipfile

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.22.0';STEM='v2_22_0';DIST=ROOT/'dist'/VERSION;DOCS=ROOT/'docs'/VERSION
EVIDENCE=ROOT/'tests/evidence'/VERSION
WIKI_PREFIX='Usuário:Daniel G Rego/RevisaWiki'
REQUIRED_RUNTIME_EVIDENCE={
    'DIRECTED_QA.json':'manifestSha256',
    'BUILD_REPRODUCTION.json':'runtimeManifestSha256',
    'INFERENCE_AND_DEMO.json':'runtimeManifestSha256',
    'NATIVE_EDITOR_UI.json':'runtimeManifestSha256',
    'FILE_DEMONSTRATION.json':'runtimeManifestSha256',
    'LEGACY_QA.json':'runtimeManifestSha256',
    'CORPUS_QA.json':'runtimeManifestSha256',
}

def raw_json(value):return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
def sha(raw):return hashlib.sha256(raw).hexdigest()
def pin(raw):return {'bytes':len(raw),'sha256':sha(raw)}
def read_json(path):return json.loads(Path(path).read_bytes())
def check_pin(path,expected):
    raw=Path(path).read_bytes()
    if pin(raw)!=expected:raise ValueError('A frozen release input changed')
    return raw
def check_sha(path,expected):
    raw=Path(path).read_bytes()
    if sha(raw)!=expected:raise ValueError('A frozen release input changed')
    return raw

def checked_repository_path(name,kind):
    if not isinstance(name,str)or not name or '\\'in name or '\0'in name:
        raise ValueError('Invalid '+kind+' path')
    path=Path(name)
    if path.is_absolute()or not path.parts or any(part in ('','..','.')for part in name.split('/')):
        raise ValueError('Invalid '+kind+' path')
    target=ROOT/path
    if any(ROOT.joinpath(*path.parts[:i]).is_symlink()for i in range(1,len(path.parts)+1)):
        raise ValueError('Invalid '+kind+' path')
    if not target.is_file():raise ValueError('Invalid '+kind+' path')
    return target

def checked_validation_evidence(manifest,manifest_sha,qa,evidence_raw):
    records={};prefix=f'tests/evidence/{VERSION}/'
    for name in [*REQUIRED_RUNTIME_EVIDENCE,'NATIVE_DOCUMENTATION.json']:
        key=prefix+name;raw=evidence_raw.get(key)
        if not isinstance(raw,bytes)or pin(raw)!=qa.get('evidencePins',{}).get(key):
            raise ValueError('Missing or unpinned required validation evidence')
        record=json.loads(raw)
        if not isinstance(record,dict)or record.get('version')!=VERSION or record.get('wikipediaWrites')!=0:
            raise ValueError('Invalid release validation evidence')
        allowed={'passed'}
        if name=='LEGACY_QA.json':allowed.add('passed-with-precisely-qualified-historical-contracts')
        if name=='CORPUS_QA.json':allowed.add('passed-with-documented-limits')
        if not isinstance(record.get('status'),str)or record['status']not in allowed:
            raise ValueError('A required validation class has not passed')
        if name in REQUIRED_RUNTIME_EVIDENCE:
            if record.get(REQUIRED_RUNTIME_EVIDENCE[name])!=manifest_sha:
                raise ValueError('Validation evidence belongs to another runtime')
            for alias in ('runtimeManifestSha256','manifestSha256'):
                if alias in record and record[alias]!=manifest_sha:
                    raise ValueError('Contradictory validation runtime pins')
        for field in ('runtimeFiles','files'):
            if field not in record:continue
            values=record[field]
            if not isinstance(values,dict)or not values or any(manifest['files'].get(key)!=expected for key,expected in values.items()):
                raise ValueError('Validation runtime-file pins do not match')
        if name=='BUILD_REPRODUCTION.json'and record.get('files')!=manifest['files']:
            raise ValueError('Build reproduction must bind every runtime file')
        for field in ('sourceInputs','runtimeSourceInputs'):
            if field in record and record[field]!=manifest['sourceInputs']:
                raise ValueError('Validation source-input pins do not match')
        for field in ('sourcePins','suiteAndDemonstrationSourcePins','harnessPins','testSourcePins'):
            if field not in record:continue
            values=record[field]
            if not isinstance(values,dict)or not values:raise ValueError('Invalid validation source pins')
            if field=='sourcePins'and any(values.get(key)!=expected for key,expected in manifest['sourceInputs'].items()):
                raise ValueError('Validation source pins omit or change a runtime input')
            for key,expected in values.items():check_pin(checked_repository_path(key,'validation source'),expected)
        if name=='LEGACY_QA.json':
            if type(record.get('unqualifiedRawFailedTasks'))is not int or record['unqualifiedRawFailedTasks']!=0:
                raise ValueError('Unqualified historical failures remain')
            if record.get('historicalTestsAndRawReportsModified')is not False or record.get('runtimeOrPreservationChecksChanged')is not False:
                raise ValueError('Historical evidence or preservation checks changed')
        if name=='CORPUS_QA.json':
            if any(type(record.get(key))is not int or record[key]!=0 for key in ('remainingCaptures','unresolvedIntegrityDefects')):
                raise ValueError('Corpus captures or integrity defects remain')
            if record.get('historicalStatusesChanged')is not False or record.get('preservationGuardsRemoved')is not False:
                raise ValueError('Corpus history or preservation guards changed')
        if name=='NATIVE_DOCUMENTATION.json':
            manual=qa.get('documentationInputs',{}).get(f'Documentacao_RevisaWiki_{STEM}.wiki',{})
            rendered=record.get('renderedCodeExamples')
            if not manual or record.get('sourceSha256')!=manual.get('sha256')or record.get('authenticated')is not False:
                raise ValueError('Native documentation does not bind the reviewed manual')
            if not isinstance(rendered,dict)or type(rendered.get('examples'))is not int or rendered['examples']!=422 or any(rendered.get(key)is not True for key in ('allCodeBodiesByteExact','ownedBrowserSessionClosed','textOnlyScope')):
                raise ValueError('Native documentation code-text verification is incomplete')
        records[name]=record
    return records

def checked_plan_coverage_pins(plan,manifest_sha,manual_sha,features_sha):
    pins=plan.get('pins')if isinstance(plan,dict)else None
    if not isinstance(pins,dict)or any(pins.get(key)!=expected for key,expected in {
        'runtimeManifestSha256':manifest_sha,
        'documentationManualSha256':manual_sha,
        'featureInventorySha256':features_sha,
    }.items()):
        raise ValueError('Plan coverage belongs to another runtime or documentation set')

def checked_inputs():
    manifest_path=ROOT/'tests/expected_release_v2220.json';manifest_raw=manifest_path.read_bytes();manifest=json.loads(manifest_raw)
    qa_raw=(EVIDENCE/'QA_SUMMARY.json').read_bytes();qa=json.loads(qa_raw)
    if manifest.get('version')!=VERSION or qa.get('version')!=VERSION or qa.get('releaseGatesPassed')is not True:
        raise ValueError('A final passing release record is required')
    if qa.get('runtimeManifestSha256')!=sha(manifest_raw)or qa.get('frozenFiles')!=manifest['files']or qa.get('sourceInputs')!=manifest['sourceInputs']:
        raise ValueError('QA does not bind the final runtime/source inputs')
    if qa.get('wikipediaWrites')!=0 or 'workerDeadlineMilliseconds'not in qa or qa.get('workerDeadlineMilliseconds')is not None or qa.get('fixedAnalysisDeadline')is not False or qa.get('unresolvedIncorrectWrites')!=0:
        raise ValueError('A release integrity requirement failed')
    if manifest.get('limits',{}).get('calculationDeadlineMilliseconds','missing')is not None or manifest.get('limits',{}).get('fixedAnalysisDeadline')is not False:raise ValueError('The runtime must not declare a fixed analysis deadline')
    required_runtime={f'RevisaWiki_{STEM}.js',f'RevisaWiki_{STEM}_dados.js',f'RevisaWiki_{STEM}_catalogo.js',f'RevisaWiki_{STEM}_regras.js',f'RevisaWiki_{STEM}_completo.js',f'Carregador_comunitario_RevisaWiki_{STEM}.js',f'Carregador_common_js_RevisaWiki_{STEM}.js','Chamada_fixa_RevisaWiki_common.js','Chamada_fixa_RevisaWiki_copia_propria.js'}
    if set(manifest.get('files',{}))!=required_runtime:raise ValueError('Exactly nine frozen runtime files are required')
    for name,expected in manifest['sourceInputs'].items():
        check_pin(checked_repository_path(name,'source input'),expected)
    for name,expected in manifest['files'].items():
        check_pin(DIST/name,expected)
        if not name.endswith('_completo.js')and expected['bytes']>=2097152:raise ValueError('Wiki page size limit')
    spec=importlib.util.spec_from_file_location('presave2216',ROOT/'scripts/check_wiki_presave_v2220.py')
    gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
    receipt=(EVIDENCE/'PRESAVE_ROUNDTRIP.json').read_bytes()
    if qa.get('presaveRoundtripSha256')!=sha(receipt):raise ValueError('Pre-save receipt does not match QA')
    gate.validate_receipt(json.loads(receipt),manifest_path,DIST/f'RevisaWiki_{STEM}_dados.js')
    native_spec=importlib.util.spec_from_file_location('runtime_presave2217',ROOT/'scripts/check_runtime_presave_v2220.py')
    native_gate=importlib.util.module_from_spec(native_spec);native_spec.loader.exec_module(native_gate)
    native_receipt=(EVIDENCE/'NATIVE_INSTALLABLE_SCRIPTS.json').read_bytes()
    if qa.get('nativeInstallableRoundtripSha256')!=sha(native_receipt):raise ValueError('Installable pre-save receipt does not match QA')
    native_gate.validate_receipt(json.loads(native_receipt),manifest_path)
    evidence=qa.get('evidencePins')
    if not isinstance(evidence,dict)or not evidence:raise ValueError('Exact validation evidence is required')
    fixed_inputs={'LICENSE','THIRD_PARTY_NOTICES_2_22_0.md','docs/2.21.7/Documentacao_RevisaWiki_v2_21_7.wiki','docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json'}
    if not fixed_inputs<=set(evidence):raise ValueError('Exact license and inherited-document inputs are required')
    evidence_raw={name:check_pin(checked_repository_path(name,'evidence'),expected)for name,expected in evidence.items()}
    checked_validation_evidence(manifest,sha(manifest_raw),qa,evidence_raw)
    plan_path=EVIDENCE/'PLAN_COVERAGE.json'
    plan_raw=plan_path.read_bytes();plan=json.loads(plan_raw)
    if qa.get('planCoverageSha256')!=sha(plan_raw)or plan.get('version')!=VERSION or plan.get('trackingEntries')!=408 or plan.get('unresolvedIntegrityDefects')!=0:raise ValueError('Consolidated plan coverage is incomplete')
    if plan.get('trackingEntriesAreFeatureCount')is not False:raise ValueError('Plan tracking entries are not feature counts')
    coverage_raw=(ROOT/'tests/v2212/coverage_all.json').read_bytes();coverage=json.loads(coverage_raw)
    if qa.get('coverageSha256')!=sha(coverage_raw):raise ValueError('Coverage changed after review')
    if len(coverage['items'])!=76 or len({r['id']for r in coverage['items']})!=76:raise ValueError('Incomplete choice ledger')
    feature_raw=(DOCS/'Funcionalidades_RevisaWiki_2_22_0.json').read_bytes();features=json.loads(feature_raw)
    feature_rows=features.get('features',[])
    if features.get('version')!=VERSION or not isinstance(feature_rows,list)or not feature_rows or any(not isinstance(row,dict)for row in feature_rows):raise ValueError('Incomplete feature inventory')
    previous_features=read_json(ROOT/'docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json').get('features',[])
    required_text={'id','family','title','description','condition','type','verification'}
    for row in feature_rows:
        if not isinstance(row,dict)or any(not isinstance(row.get(key),str)or not row[key].strip()for key in required_text)or any(not isinstance(row.get(key),str)for key in ('before','after')):
            raise ValueError('Incomplete feature fields or examples')
        if any(not isinstance(row.get(key),list)or any(not isinstance(item,str)or not item.strip()for item in row[key])for key in ('optionKeys','entryPoints')):
            raise ValueError('Incomplete feature option or entry-point metadata')
    ids={row['id']for row in feature_rows}
    if len(ids)!=len(feature_rows):raise ValueError('Incomplete feature inventory')
    previous_ids={row['id']for row in previous_features}
    if len(previous_ids)!=170 or not previous_ids<=ids:raise ValueError('Inherited feature identity missing')
    if qa.get('documentedFeaturesSha256')!=sha(feature_raw)or qa.get('documentedFeatureCount')!=len(feature_rows):raise ValueError('QA does not bind the full feature inventory')
    manual_name=f'Documentacao_RevisaWiki_{STEM}.wiki'
    manual_raw=check_pin(DOCS/manual_name,qa['documentationInputs'][manual_name])
    checked_plan_coverage_pins(plan,sha(manifest_raw),sha(manual_raw),sha(feature_raw))
    example_raw=(ROOT/'tests/v2220/feature_examples.json').read_bytes();examples=json.loads(example_raw).get('examples',[])
    if not examples or len({r.get('id')for r in examples})!=len(examples):raise ValueError('Incomplete documentation examples')
    if qa.get('documentationExamplesSha256')!=sha(example_raw)or qa.get('documentationExamples')!=len(examples)or qa.get('documentationExamplesPassed')!=len(examples):raise ValueError('Documentation example validation is incomplete')
    documentation=qa.get('documentationInputs')
    if not isinstance(documentation,dict)or not documentation:raise ValueError('Exact documentation pins are required')
    actual_docs={p.name:p for p in DOCS.iterdir()if p.is_file()}
    if set(documentation)!=set(actual_docs):raise ValueError('QA does not bind every release document')
    for name,expected in documentation.items():check_pin(actual_docs[name],expected)
    return manifest,qa,qa_raw,receipt,coverage

def frozen_documentation(qa):
    expected=qa.get('documentationInputs')
    if not isinstance(expected,dict)or not expected:raise ValueError('Exact documentation pins are required')
    actual={p.name:p for p in DOCS.iterdir()if p.is_file()}
    if set(actual)!=set(expected):raise ValueError('The documentation set changed after QA')
    return {name:check_pin(actual[name],proof)for name,proof in expected.items()}

def frozen_package_inputs(qa,qa_raw,receipt,coverage):
    # Return the bytes that were actually checked; later assembly never reopens
    # these paths to obtain an unverified replacement.
    evidence=qa['evidencePins']
    return {
        'MANIFESTO_RUNTIME.json':check_sha(ROOT/'tests/expected_release_v2220.json',qa['runtimeManifestSha256']),
        'LICENSE':check_pin(checked_repository_path('LICENSE','evidence'),evidence['LICENSE']),
        'THIRD_PARTY_NOTICES_2_22_0.md':check_pin(checked_repository_path('THIRD_PARTY_NOTICES_2_22_0.md','evidence'),evidence['THIRD_PARTY_NOTICES_2_22_0.md']),
        'QA_SUMMARY.json':qa_raw,
        'COVERAGE.json':raw_json(coverage),
        'PLAN_COVERAGE.json':check_sha(EVIDENCE/'PLAN_COVERAGE.json',qa['planCoverageSha256']),
        'PRESAVE_ROUNDTRIP.json':receipt,
        'NATIVE_INSTALLABLE_SCRIPTS.json':check_sha(EVIDENCE/'NATIVE_INSTALLABLE_SCRIPTS.json',qa['nativeInstallableRoundtripSha256']),
    }

def frozen_demonstration(qa):
    demo=DIST/f'Demonstracao_RevisaWiki_{STEM}.html'
    data={demo.name:check_sha(demo,qa.get('demonstrationPortableSha256'))}
    assets=qa.get('demonstrationAssets')
    if not isinstance(assets,dict)or not assets:raise ValueError('Exact demonstration assets are required')
    actual={str(p.relative_to(DIST)):p for p in (DIST/'Demonstracao').iterdir()if p.is_file()}
    if set(assets)!=set(actual):raise ValueError('Missing or unexpected demonstration assets')
    for name,p in sorted(actual.items()):data[name]=check_pin(p,assets[name])
    return demo.name,data

def write_frozen_payloads(output,data):
    for name,raw in data.items():
        p=output/name;p.parent.mkdir(exist_ok=True,parents=True);p.write_bytes(raw)
    for name,raw in data.items():
        if (output/name).read_bytes()!=raw:raise ValueError('A written release payload differs from its frozen bytes')

def build():
    manifest,qa,qa_raw,receipt,coverage=checked_inputs()
    docs=frozen_documentation(qa)
    required=[f'{name}_RevisaWiki_{STEM}.{ext}'for name,ext in [('Documentacao','wiki'),('Instalacao','txt'),('Notas_da_versao','txt'),('Referencia_tecnica','txt'),('Relatorio_testes','txt'),('Resumo_atualizacao','txt'),('Resumo_documentacao','txt')]]+['LEIA_PRIMEIRO.txt','Funcionalidades_RevisaWiki_2_22_0.md','Funcionalidades_RevisaWiki_2_22_0.json','Modelos_e_campos_RevisaWiki_2_22_0.md','Catalogo_modelos_e_regras_2_22_0.json']
    if set(docs)!=set(required):raise ValueError('Missing or unexpected release documents')
    for name,raw in docs.items():
        text=raw.decode('utf8')
        if any(token in text for token in ('{{VALIDACAO_RELEASE}}','aguardando QA','QA FINAL PENDENTE'))or '\r'in text:raise ValueError('Draft documentation remains')
    old_name='docs/2.21.7/Documentacao_RevisaWiki_v2_21_7.wiki'
    old=check_pin(checked_repository_path(old_name,'evidence'),qa['evidencePins'][old_name]).decode().split('== Histórico das versões ==\n',1)[1]
    new=docs[f'Documentacao_RevisaWiki_{STEM}.wiki'].decode().split('== Histórico das versões ==\n',1)[1]
    import re
    old_versions=re.findall(r'^=== ([^=]+) ===$',old,re.M)
    new_versions=re.findall(r'^=== ([^=]+) ===$',new,re.M)
    if new_versions!=[VERSION]+old_versions:raise ValueError('Missing or reordered historical release heading')
    data={name:check_pin(DIST/name,expected)for name,expected in manifest['files'].items()};data.update(docs)
    data.update(frozen_package_inputs(qa,qa_raw,receipt,coverage))
    demo_name,demo=frozen_demonstration(qa);data.update(demo)
    summary='Atualização do RevisaWiki para a versão 2.22.0.'
    entries=[('Dados',f'RevisaWiki_{STEM}_dados.js',WIKI_PREFIX+'/Dados.js',summary),('Catálogo',f'RevisaWiki_{STEM}_catalogo.js',WIKI_PREFIX+'/Catalogo.js',summary),('Regras',f'RevisaWiki_{STEM}_regras.js',WIKI_PREFIX+'/Regras.js',summary),('Programa',f'RevisaWiki_{STEM}.js',WIKI_PREFIX+'.js',summary),('Carregador central',f'Carregador_comunitario_RevisaWiki_{STEM}.js',WIKI_PREFIX+'/Carregador.js',summary),('Documentação',f'Documentacao_RevisaWiki_{STEM}.wiki',WIKI_PREFIX,'Atualização da documentação do RevisaWiki 2.22.0.'),('Primeira instalação compartilhada','Chamada_fixa_RevisaWiki_common.js','Especial:Minha página/common.js','Instalação da chamada fixa do RevisaWiki.'),('Carregador para cópia própria',f'Carregador_common_js_RevisaWiki_{STEM}.js','Sua página RevisaWiki/Carregador.js',summary),('Primeira instalação da cópia própria','Chamada_fixa_RevisaWiki_copia_propria.js','Especial:Minha página/common.js','Instalação da chamada fixa do RevisaWiki.')]
    rows=[{'label':label,'file':name,'destination':destination,'editSummary':edit,**pin(data[name])}for label,name,destination,edit in entries]
    lines=['# RevisaWiki 2.22.0','','Atualize dados, catálogo, regras, programa, carregador central e documentação, nessa ordem. Copie os arquivos completos. A instalação e a publicação na Wikipédia continuam manuais.','','Quem já usa a chamada fixa mantém o common.js como está. Não altere o hash para contornar uma falha de carregamento.','','| Ordem | Arquivo completo | Destino | Resumo da edição |','| --- | --- | --- | --- |']
    for i,row in enumerate(rows,1):lines.append(f'| {i}. {row["label"]} | [{row["file"]}]({row["file"]}) | `{row["destination"]}` | {row["editSummary"]} |')
    lines+=['',f'[Instalação](Instalacao_RevisaWiki_{STEM}.txt) · [Manual](Documentacao_RevisaWiki_{STEM}.wiki) · [Testes e limites](Relatorio_testes_RevisaWiki_{STEM}.txt) · [Demonstração local]({demo_name}) · [Todas as funcionalidades](Funcionalidades_RevisaWiki_2_22_0.md) · [Modelos e campos](Modelos_e_campos_RevisaWiki_2_22_0.md) · [Catálogo completo](Catalogo_modelos_e_regras_2_22_0.json)','','O motor completo serve somente para uso local e testes. O núcleo, Dados.js, Catalogo.js e Regras.js são separados e ficam abaixo do limite de cada página.','','Depois de salvar, recarregue sem cache. Firefox e Chrome no Mac: Command + Shift + R. Safari: Option + Command + R. Não é necessário fechar o navegador.','']
    data['INDICE.md']='\n'.join(lines).encode()
    data['ARQUIVOS.json']=raw_json({'version':VERSION,'files':{n:pin(v)for n,v in sorted(data.items())},'wikipediaWrites':0})
    delivery={'version':VERSION,'distributionRevision':VERSION,'releaseGatesPassed':True,'runtimeManifestSha256':sha(data['MANIFESTO_RUNTIME.json']),'qaSha256':sha(qa_raw),'copyPayloads':rows,'files':{n:pin(v)for n,v in sorted(data.items())},'wikipediaWrites':0}
    data['MANIFESTO.json']=raw_json(delivery)
    archive=io.BytesIO()
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as target:
        for name,raw in sorted(data.items()):
            entry=zipfile.ZipInfo(name,(2026,11,13,0,0,0));entry.external_attr=0o100644<<16;entry.compress_type=zipfile.ZIP_DEFLATED;target.writestr(entry,raw)
    with zipfile.ZipFile(io.BytesIO(archive.getvalue()))as packed:
        if packed.testzip()or any(packed.read(n)!=v for n,v in data.items()):raise ValueError('Archive mismatch')
    data['RevisaWiki_2.22.0.zip']=archive.getvalue()
    write_frozen_payloads(DIST,data)
    return {'version':VERSION,'files':len(data),'archiveSha256':sha(archive.getvalue()),'wikipediaWrites':0}

if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False,indent=2))
