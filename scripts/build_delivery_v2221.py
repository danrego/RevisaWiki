"""Assemble only an exact, validated release. Never write to Wikipedia."""
from pathlib import Path
import hashlib
import html
import importlib.util
import io
import json
import re
import sys
import zipfile

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.22.1'
STEM='v2_22_1'
DIST=ROOT/'dist'/VERSION
DOCS=ROOT/'docs'/VERSION
EVIDENCE=ROOT/'tests/evidence'/VERSION
MANIFEST=ROOT/'tests/expected_release_v2221.json'
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

def sha(raw):return hashlib.sha256(raw).hexdigest()
def pin(raw):return {'bytes':len(raw),'sha256':sha(raw)}
def raw_json(value):return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()

def require_zero_counts(record,*fields):
    if any(type(record.get(field))is not int or record[field]!=0 for field in fields):
        raise ValueError('A release counter must be the integer zero')

def literal_pre_code_bodies(source):
    result=[]
    for value in re.findall(r'<pre>([\s\S]*?)</pre>',source):
        text=html.unescape(value)
        # HTML consumes one LF immediately after <pre>, also when emitted by
        # a character reference. Every other leading or terminal byte remains.
        result.append(text[1:]if text.startswith('\n')else text)
    return result

def repository_path(name,kind):
    if not isinstance(name,str)or not name or '\\'in name or '\0'in name:
        raise ValueError('Invalid '+kind+' path')
    path=Path(name)
    if path.is_absolute()or any(part in ('','..','.')for part in name.split('/')):
        raise ValueError('Invalid '+kind+' path')
    target=ROOT/path
    if any(ROOT.joinpath(*path.parts[:i]).is_symlink()for i in range(1,len(path.parts)+1))or not target.is_file():
        raise ValueError('Invalid '+kind+' path')
    return target

def check_pin(path,expected):
    raw=Path(path).read_bytes()
    if pin(raw)!=expected:raise ValueError('A frozen release input changed')
    return raw

def check_sha(path,expected):
    raw=Path(path).read_bytes()
    if sha(raw)!=expected:raise ValueError('A frozen release input changed')
    return raw

def load_gate(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/f'{name}.py')
    module=importlib.util.module_from_spec(spec);sys.modules[name]=module;spec.loader.exec_module(module)
    return module

def checked_runtime_files(manifest):
    base={f'RevisaWiki_{STEM}.js',f'RevisaWiki_{STEM}_dados.js',f'RevisaWiki_{STEM}_catalogo.js',f'RevisaWiki_{STEM}_regras.js',f'RevisaWiki_{STEM}_completo.js',f'Carregador_comunitario_RevisaWiki_{STEM}.js',f'Carregador_common_js_RevisaWiki_{STEM}.js','Chamada_fixa_RevisaWiki_common.js','Chamada_fixa_RevisaWiki_copia_propria.js'}
    files=manifest.get('files')
    if not isinstance(files,dict)or not base<=set(files):raise ValueError('Missing frozen runtime files')
    shards=set(files)-base
    if not shards or any(not re.fullmatch(r'Infocaixas/parte[0-9]{4}\.json',name)for name in shards):
        raise ValueError('Unexpected or missing infobox shard files')
    if len(shards)>64:raise ValueError('Unexpected infobox shard count')
    result={}
    for name,expected in files.items():
        path=repository_path(f'dist/{VERSION}/{name}','runtime')
        raw=check_pin(path,expected)
        if not name.endswith('_completo.js')and len(raw)>=2097152:raise ValueError('Installable page size limit')
        result[name]=raw
    return result

def checked_validation_evidence(manifest,manifest_sha,qa,evidence):
    result={}
    for name in [*REQUIRED_RUNTIME_EVIDENCE,'NATIVE_DOCUMENTATION.json']:
        key=f'tests/evidence/{VERSION}/{name}'
        raw=evidence.get(key)
        if not isinstance(raw,bytes)or pin(raw)!=qa.get('evidencePins',{}).get(key):
            raise ValueError('Missing exact required validation evidence')
        record=json.loads(raw)
        if not isinstance(record,dict)or record.get('version')!=VERSION:
            raise ValueError('Invalid release validation evidence')
        require_zero_counts(record,'wikipediaWrites')
        allowed={'passed'}
        if name=='LEGACY_QA.json':allowed.add('passed-with-precisely-qualified-historical-contracts')
        if name=='CORPUS_QA.json':allowed.add('passed-with-documented-limits')
        if record.get('status')not in allowed:raise ValueError('A required validation class has not passed')
        if name in REQUIRED_RUNTIME_EVIDENCE and record.get(REQUIRED_RUNTIME_EVIDENCE[name])!=manifest_sha:
            raise ValueError('Validation belongs to a different runtime')
        for alias in ('runtimeManifestSha256','manifestSha256'):
            if alias in record and record[alias]!=manifest_sha:raise ValueError('Contradictory runtime pins')
        for field in ('runtimeFiles','files'):
            if field not in record:continue
            values=record[field]
            if not isinstance(values,dict)or not values or any(manifest['files'].get(key)!=expected for key,expected in values.items()):
                raise ValueError('Validation runtime files differ')
        if name=='BUILD_REPRODUCTION.json'and record.get('files')!=manifest['files']:
            raise ValueError('Build reproduction must bind every runtime file and shard')
        for field in ('sourceInputs','runtimeSourceInputs'):
            if field in record and record[field]!=manifest['sourceInputs']:raise ValueError('Validation source inputs differ')
        for field in ('sourcePins','suiteAndDemonstrationSourcePins','harnessPins','testSourcePins'):
            if field not in record:continue
            values=record[field]
            if not isinstance(values,dict)or not values:raise ValueError('Invalid validation source pins')
            if field=='sourcePins'and any(values.get(key)!=expected for key,expected in manifest['sourceInputs'].items()):
                raise ValueError('Validation omits or changes a runtime source input')
            for key,expected in values.items():check_pin(repository_path(key,'validation source'),expected)
        if name=='LEGACY_QA.json':
            require_zero_counts(record,'unqualifiedRawFailedTasks')
            if record.get('historicalTestsAndRawReportsModified')is not False or record.get('runtimeOrPreservationChecksChanged')is not False:
                raise ValueError('Historical failures are unqualified or historical evidence changed')
        if name=='CORPUS_QA.json':
            require_zero_counts(record,'remainingCaptures','unresolvedIntegrityDefects')
            if record.get('historicalStatusesChanged')is not False or record.get('preservationGuardsRemoved')is not False:
                raise ValueError('Corpus integrity or historical result condition failed')
        if name=='NATIVE_DOCUMENTATION.json':
            manual=qa.get('documentationInputs',{}).get(f'Documentacao_RevisaWiki_{STEM}.wiki',{})
            rendered=record.get('renderedCodeExamples')
            manual_path=DOCS/f'Documentacao_RevisaWiki_{STEM}.wiki'
            expected_examples=len(re.findall(r'<pre>[\s\S]*?</pre>',manual_path.read_text()))
            if record.get('sourceSha256')!=manual.get('sha256')or record.get('authenticated')is not False:
                raise ValueError('Native documentation belongs to another manual')
            if not isinstance(rendered,dict)or rendered.get('examples')!=expected_examples or any(rendered.get(k)is not True for k in ('allCodeBodiesByteExact','ownedBrowserSessionClosed','textOnlyScope')):
                raise ValueError('Native code-text presentation is incomplete')
        result[name]=record
    return result

def frozen_documentation(qa):
    expected=qa.get('documentationInputs')
    actual={path.name:path for path in DOCS.iterdir()if path.is_file()}
    required={f'{name}_RevisaWiki_{STEM}.{ext}'for name,ext in [('Documentacao','wiki'),('Instalacao','txt'),('Notas_da_versao','txt'),('Referencia_tecnica','txt'),('Relatorio_testes','txt'),('Resumo_atualizacao','txt'),('Resumo_documentacao','txt')]}
    required|={'LEIA_PRIMEIRO.txt','Funcionalidades_RevisaWiki_2_22_1.md','Funcionalidades_RevisaWiki_2_22_1.json','Modelos_e_campos_RevisaWiki_2_22_1.md','Catalogo_modelos_e_regras_2_22_1.json'}
    if not isinstance(expected,dict)or set(actual)!=required or set(expected)!=required:
        raise ValueError('The exact documentation set is not frozen')
    docs={name:check_pin(repository_path(f'docs/{VERSION}/{name}','documentation'),expected[name])for name in actual}
    for raw in docs.values():
        text=raw.decode('utf8')
        if '\r'in text or any(token in text for token in ('{{VALIDACAO_RELEASE}}','VALIDAÇÃO FINAL PENDENTE','QA FINAL PENDENTE')):
            raise ValueError('Draft documentation remains')
    baseline_name='docs/2.22.0/Documentacao_RevisaWiki_v2_22_0.wiki'
    old=check_pin(repository_path(baseline_name,'inherited manual'),qa['evidencePins'][baseline_name]).decode().split('== Histórico das versões ==\n',1)[1]
    new=docs[f'Documentacao_RevisaWiki_{STEM}.wiki'].decode().split('== Histórico das versões ==\n',1)[1]
    if re.findall(r'^=== ([^=]+) ===$',new,re.M)!=[VERSION]+re.findall(r'^=== ([^=]+) ===$',old,re.M):
        raise ValueError('Historical release headings changed')
    feature_raw=docs['Funcionalidades_RevisaWiki_2_22_1.json'];features=json.loads(feature_raw)
    rows=features.get('features')
    if features.get('version')!=VERSION or not isinstance(rows,list)or not rows:raise ValueError('Invalid feature inventory')
    required_text={'id','family','title','description','condition','type','verification'}
    for row in rows:
        if not isinstance(row,dict)or any(not isinstance(row.get(k),str)or not row[k].strip()for k in required_text)or any(not isinstance(row.get(k),str)for k in ('before','after')):
            raise ValueError('Incomplete feature fields or examples')
        if any(not isinstance(row.get(k),list)or any(not isinstance(item,str)or not item.strip()for item in row[k])for k in ('entryPoints','optionKeys')):
            raise ValueError('Incomplete feature metadata')
    baseline_features='docs/2.22.0/Funcionalidades_RevisaWiki_2_22_0.json'
    old_rows=json.loads(check_pin(repository_path(baseline_features,'inherited features'),qa['evidencePins'][baseline_features]))['features']
    ids={row['id']for row in rows}
    if len(ids)!=len(rows)or not {row['id']for row in old_rows}<=ids:raise ValueError('Inherited feature IDs missing')
    if qa.get('documentedFeaturesSha256')!=sha(feature_raw)or qa.get('documentedFeatureCount')!=len(rows):
        raise ValueError('QA does not bind the feature inventory')
    for row in features.get('documentationSources',[]):
        check_pin(repository_path(row['path'],'documentation source'),{'sha256':row['sha256'],'bytes':row['bytes']})
    expected_code=[]
    families=list(dict.fromkeys(row['family']for row in rows))
    for family in families:
        for row in rows:
            if row['family']!=family:continue
            expected_code.extend([row['before'],row['after']])
            for example in row.get('additionalExamples',[]):expected_code.extend([example['before'],example['after']])
    manual_code=literal_pre_code_bodies(docs[f'Documentacao_RevisaWiki_{STEM}.wiki'].decode())
    if manual_code!=expected_code:raise ValueError('The manual examples differ from the frozen feature inventory')
    return docs,features

def frozen_demonstration(qa):
    name=f'Demonstracao_RevisaWiki_{STEM}.html'
    data={name:check_sha(repository_path(f'dist/{VERSION}/{name}','portable demonstration'),qa.get('demonstrationPortableSha256'))}
    assets=qa.get('demonstrationAssets')
    actual={str(path.relative_to(DIST)):path for path in (DIST/'Demonstracao').iterdir()if path.is_file()}
    if not isinstance(assets,dict)or not assets or set(assets)!=set(actual):raise ValueError('Demonstration assets are not frozen')
    data.update({name:check_pin(repository_path(f'dist/{VERSION}/{name}','demonstration asset'),proof)for name,proof in assets.items()})
    return name,data

def checked_inputs():
    manifest_raw=MANIFEST.read_bytes();manifest=json.loads(manifest_raw)
    qa_raw=(EVIDENCE/'QA_SUMMARY.json').read_bytes();qa=json.loads(qa_raw)
    if manifest.get('version')!=VERSION or qa.get('version')!=VERSION or qa.get('releaseGatesPassed')is not True:
        raise ValueError('A final passing release record is required')
    manifest_sha=sha(manifest_raw)
    if qa.get('runtimeManifestSha256')!=manifest_sha or qa.get('frozenFiles')!=manifest.get('files')or qa.get('sourceInputs')!=manifest.get('sourceInputs'):
        raise ValueError('QA does not bind the final runtime and source inputs')
    require_zero_counts(qa,'wikipediaWrites','unresolvedIncorrectWrites')
    if qa.get('workerDeadlineMilliseconds','missing')is not None or qa.get('fixedAnalysisDeadline')is not False:
        raise ValueError('Release integrity requirement failed')
    if manifest.get('limits',{}).get('calculationDeadlineMilliseconds','missing')is not None or manifest.get('limits',{}).get('fixedAnalysisDeadline')is not False:
        raise ValueError('The runtime declares a fixed analysis deadline')
    sources=manifest.get('sourceInputs')
    if not isinstance(sources,dict)or not sources:raise ValueError('Frozen source inputs are required')
    for name,expected in sources.items():check_pin(repository_path(name,'source input'),expected)
    runtime=checked_runtime_files(manifest)
    evidence_pins=qa.get('evidencePins')
    required={'LICENSE','THIRD_PARTY_NOTICES_2_22_1.md','docs/2.22.0/Documentacao_RevisaWiki_v2_22_0.wiki','docs/2.22.0/Funcionalidades_RevisaWiki_2_22_0.json'}
    if not isinstance(evidence_pins,dict)or not required<=set(evidence_pins):raise ValueError('Pinned license and inherited document inputs are required')
    evidence={name:check_pin(repository_path(name,'evidence'),expected)for name,expected in evidence_pins.items()}
    docs,features=frozen_documentation(qa)
    checked_validation_evidence(manifest,manifest_sha,qa,evidence)
    data_receipt=check_sha(EVIDENCE/'PRESAVE_ROUNDTRIP.json',qa.get('presaveRoundtripSha256'))
    gate=load_gate('check_wiki_presave_v2221');gate.validate_receipt(json.loads(data_receipt),MANIFEST,DIST/f'RevisaWiki_{STEM}_dados.js')
    native_receipt=check_sha(EVIDENCE/'NATIVE_INSTALLABLE_SCRIPTS.json',qa.get('nativeInstallableRoundtripSha256'))
    load_gate('check_runtime_presave_v2221').validate_receipt(json.loads(native_receipt),MANIFEST)
    plan_raw=check_sha(EVIDENCE/'PLAN_COVERAGE.json',qa.get('planCoverageSha256'));plan=json.loads(plan_raw)
    require_zero_counts(plan,'unresolvedIntegrityDefects')
    if plan.get('version')!=VERSION or plan.get('trackingEntriesAreFeatureCount')is not False:
        raise ValueError('Consolidated plan coverage is incomplete or miscounted')
    expected_plan_pins={'runtimeManifestSha256':manifest_sha,'documentationManualSha256':sha(docs[f'Documentacao_RevisaWiki_{STEM}.wiki']),'featureInventorySha256':sha(docs['Funcionalidades_RevisaWiki_2_22_1.json'])}
    if not isinstance(plan.get('pins'),dict)or any(plan['pins'].get(key)!=value for key,value in expected_plan_pins.items()):
        raise ValueError('Plan coverage belongs to another runtime or document set')
    active_records=[]
    for name in sorted(runtime):
        if name.startswith('Infocaixas/'):active_records.extend(json.loads(runtime[name])['records'])
    documented=json.loads(docs['Catalogo_modelos_e_regras_2_22_1.json'])['v2221Extensions']['foreignMigrationRegistry']['records']
    if documented!=active_records:raise ValueError('The documented infobox registry differs from the installed shards')
    demo_name,demo=frozen_demonstration(qa)
    return dict(manifest=manifest,manifestRaw=manifest_raw,qa=qa,qaRaw=qa_raw,runtime=runtime,docs=docs,features=features,evidence=evidence,dataReceipt=data_receipt,nativeReceipt=native_receipt,planRaw=plan_raw,demoName=demo_name,demo=demo)

def copy_entries(manifest):
    summary=f'Atualização do RevisaWiki para a versão {VERSION}.'
    rows=[('Dados',f'RevisaWiki_{STEM}_dados.js',WIKI_PREFIX+'/Dados.js',summary),('Catálogo',f'RevisaWiki_{STEM}_catalogo.js',WIKI_PREFIX+'/Catalogo.js',summary)]
    for name in sorted(key for key in manifest['files']if key.startswith('Infocaixas/')):
        rows.append(('Infocaixas, '+Path(name).stem,name,WIKI_PREFIX+'/'+name,summary))
    rows.extend([('Regras',f'RevisaWiki_{STEM}_regras.js',WIKI_PREFIX+'/Regras.js',summary),('Programa',f'RevisaWiki_{STEM}.js',WIKI_PREFIX+'.js',summary),('Carregador central',f'Carregador_comunitario_RevisaWiki_{STEM}.js',WIKI_PREFIX+'/Carregador.js',summary),('Documentação',f'Documentacao_RevisaWiki_{STEM}.wiki',WIKI_PREFIX,f'Documentação do RevisaWiki {VERSION}.'),('Primeira instalação compartilhada','Chamada_fixa_RevisaWiki_common.js','Especial:Minha página/common.js','Instalação da chamada fixa do RevisaWiki.'),('Carregador para cópia própria',f'Carregador_common_js_RevisaWiki_{STEM}.js','Sua página RevisaWiki/Carregador.js',summary),('Primeira instalação da cópia própria','Chamada_fixa_RevisaWiki_copia_propria.js','Especial:Minha página/common.js','Instalação da chamada fixa do RevisaWiki.')])
    return rows

def write_frozen_payloads(data):
    for name,raw in data.items():
        path=DIST/name
        if path.exists()and path.read_bytes()!=raw:raise ValueError('Refusing to replace a different existing delivery payload')
    for name,raw in data.items():
        path=DIST/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
    if any((DIST/name).read_bytes()!=raw for name,raw in data.items()):raise ValueError('A written payload differs from its checked bytes')

def build():
    checked=checked_inputs();manifest=checked['manifest'];qa=checked['qa']
    data={**checked['runtime'],**checked['docs'],**checked['demo'],'MANIFESTO_RUNTIME.json':checked['manifestRaw'],'QA_SUMMARY.json':checked['qaRaw'],'PRESAVE_ROUNDTRIP.json':checked['dataReceipt'],'NATIVE_INSTALLABLE_SCRIPTS.json':checked['nativeReceipt'],'PLAN_COVERAGE.json':checked['planRaw']}
    for name in ['LICENSE','THIRD_PARTY_NOTICES_2_22_1.md']:data[name]=checked['evidence'][name]
    rows=[dict(label=label,file=name,destination=destination,editSummary=summary,**pin(data[name]))for label,name,destination,summary in copy_entries(manifest)]
    lines=['# RevisaWiki 2.22.1','','Copie os arquivos completos na ordem abaixo. Quem já usa a chamada fixa mantém o common.js. As partes JSON de infocaixas precisam estar disponíveis antes de Regras.js e do programa.','','| Ordem | Arquivo completo | Destino | Resumo da edição |','| --- | --- | --- | --- |']
    for index,row in enumerate(rows,1):lines.append(f'| {index}. {row["label"]} | [{row["file"]}]({row["file"]}) | `{row["destination"]}` | {row["editSummary"]} |')
    lines+=['',f'[Instalação](Instalacao_RevisaWiki_{STEM}.txt) · [Manual](Documentacao_RevisaWiki_{STEM}.wiki) · [Todos os recursos](Funcionalidades_RevisaWiki_2_22_1.md) · [Modelos e campos](Modelos_e_campos_RevisaWiki_2_22_1.md) · [Catálogo completo](Catalogo_modelos_e_regras_2_22_1.json) · [Testes e limites](Relatorio_testes_RevisaWiki_{STEM}.txt) · [Demonstração local]({checked["demoName"]})','','Depois de atualizar, recarregue sem cache. Firefox e Chrome no Mac usam Command + Shift + R. Safari usa Option + Command + R. Não altere hashes para forçar o carregamento.','','O arquivo completo serve apenas para demonstração e testes locais. A entrega e a publicação no GitHub não fazem edições na Wikipédia.','']
    data['INDICE.md']='\n'.join(lines).encode()
    data['ARQUIVOS.json']=raw_json({'version':VERSION,'files':{name:pin(raw)for name,raw in sorted(data.items())},'wikipediaWrites':0})
    data['MANIFESTO.json']=raw_json({'version':VERSION,'distributionRevision':VERSION,'releaseGatesPassed':True,'runtimeManifestSha256':sha(checked['manifestRaw']),'qaSha256':sha(checked['qaRaw']),'copyPayloads':rows,'files':{name:pin(raw)for name,raw in sorted(data.items())},'wikipediaWrites':0})
    archive=io.BytesIO()
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as target:
        for name,raw in sorted(data.items()):
            entry=zipfile.ZipInfo(name,(2026,11,20,0,0,0));entry.external_attr=0o100644<<16;entry.compress_type=zipfile.ZIP_DEFLATED;target.writestr(entry,raw)
    with zipfile.ZipFile(io.BytesIO(archive.getvalue()))as packed:
        if packed.testzip()or any(packed.read(name)!=raw for name,raw in data.items()):raise ValueError('Archive differs from frozen payloads')
    data[f'RevisaWiki_{VERSION}.zip']=archive.getvalue();write_frozen_payloads(data)
    return {'version':VERSION,'files':len(data),'archiveSha256':sha(archive.getvalue()),'wikipediaWrites':0}

if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False,indent=2))
