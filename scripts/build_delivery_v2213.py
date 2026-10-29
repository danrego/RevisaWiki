"""Assemble the exact tested release; never write to Wikipedia."""
from pathlib import Path
import hashlib
import importlib.util
import io
import json
import zipfile

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.21.3';STEM='v2_21_3';DIST=ROOT/'dist'/VERSION;DOCS=ROOT/'docs'/VERSION
EVIDENCE=ROOT/'tests/evidence'/VERSION
BASE_SCRIPT='Usuário:Daniel G Rego/RevisaWiki'

def raw_json(value):return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
def sha(raw):return hashlib.sha256(raw).hexdigest()
def pin(raw):return {'bytes':len(raw),'sha256':sha(raw)}
def read_json(path):return json.loads(Path(path).read_bytes())
def check_pin(path,expected):
    raw=Path(path).read_bytes()
    if pin(raw)!=expected:raise ValueError('A frozen release input changed')
    return raw

def checked_inputs():
    manifest_path=ROOT/'tests/expected_release_v2213.json';manifest_raw=manifest_path.read_bytes();manifest=json.loads(manifest_raw)
    qa_raw=(EVIDENCE/'QA_SUMMARY.json').read_bytes();qa=json.loads(qa_raw)
    if manifest.get('version')!=VERSION or qa.get('version')!=VERSION or qa.get('releaseGatesPassed')is not True:
        raise ValueError('A final passing release record is required')
    if qa.get('runtimeManifestSha256')!=sha(manifest_raw)or qa.get('frozenFiles')!=manifest['files']or qa.get('sourceInputs')!=manifest['sourceInputs']:
        raise ValueError('QA does not bind the final runtime/source inputs')
    if qa.get('wikipediaWrites')!=0 or qa.get('workerDeadlineMilliseconds')!=60000 or qa.get('unresolvedIncorrectWrites')!=0:
        raise ValueError('A release integrity requirement failed')
    for name,expected in manifest['sourceInputs'].items():check_pin(ROOT/name,expected)
    for name,expected in manifest['files'].items():
        check_pin(DIST/name,expected)
        if not name.endswith('_completo.js')and expected['bytes']>=2097152:raise ValueError('Wiki page size limit')
    spec=importlib.util.spec_from_file_location('presave2212',ROOT/'scripts/check_wiki_presave_v2213.py')
    gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
    receipt=(EVIDENCE/'PRESAVE_ROUNDTRIP.json').read_bytes()
    if qa.get('presaveRoundtripSha256')!=sha(receipt):raise ValueError('Pre-save receipt does not match QA')
    gate.validate_receipt(json.loads(receipt),manifest_path,DIST/f'RevisaWiki_{STEM}_dados.js')
    evidence=qa.get('evidencePins')
    if not isinstance(evidence,dict)or not evidence:raise ValueError('Exact validation evidence is required')
    for name,expected in evidence.items():
        path=Path(name)
        if path.is_absolute()or '..'in path.parts:raise ValueError('Invalid evidence path')
        check_pin(ROOT/path,expected)
    coverage=read_json(ROOT/'tests/v2212/coverage_all.json')
    if qa.get('coverageSha256')!=sha((ROOT/'tests/v2212/coverage_all.json').read_bytes()):raise ValueError('Coverage changed after review')
    if len(coverage['items'])!=76 or len({r['id']for r in coverage['items']})!=76:raise ValueError('Incomplete choice ledger')
    return manifest,qa,qa_raw,receipt,coverage

def build():
    manifest,qa,qa_raw,receipt,coverage=checked_inputs()
    docs={p.name:p.read_bytes()for p in DOCS.iterdir()if p.is_file()}
    required=[f'{name}_RevisaWiki_{STEM}.{ext}'for name,ext in [('Documentacao','wiki'),('Instalacao','txt'),('Notas_da_versao','txt'),('Referencia_tecnica','txt'),('Relatorio_testes','txt'),('Resumo_atualizacao','txt'),('Resumo_documentacao','txt')]]+['LEIA_PRIMEIRO.txt','Funcionalidades_RevisaWiki_2_21_3.md']
    if set(docs)!=set(required):raise ValueError('Missing or unexpected release documents')
    for name,raw in docs.items():
        text=raw.decode('utf8')
        if '{{VALIDACAO_RELEASE}}'in text or 'aguardando QA'in text or '\r'in text:raise ValueError('Draft documentation remains')
    old=(ROOT/'docs/2.21.2/Documentacao_RevisaWiki_v2_21_2.wiki').read_text().split('== Histórico das versões ==\n',1)[1]
    new=docs[f'Documentacao_RevisaWiki_{STEM}.wiki'].decode().split('== Histórico das versões ==\n',1)[1]
    first_old=old.index('=== 2.21.2 ===');first_new=new.index('=== 2.21.3 ===')
    if new[:first_new]!=old[:first_old]or not new.endswith(old[first_old:]):raise ValueError('A historical release entry or shared introduction changed')
    data={name:check_pin(DIST/name,expected)for name,expected in manifest['files'].items()};data.update(docs)
    data.update({'MANIFESTO_RUNTIME.json':(ROOT/'tests/expected_release_v2213.json').read_bytes(),'LICENSE':(ROOT/'LICENSE').read_bytes(),'QA_SUMMARY.json':qa_raw,'COVERAGE.json':raw_json(coverage),'PRESAVE_ROUNDTRIP.json':receipt})
    demo=DIST/f'Demonstracao_RevisaWiki_{STEM}.html'
    if sha(demo.read_bytes())!=qa.get('demonstrationPortableSha256'):raise ValueError('The demonstration differs from QA')
    data[demo.name]=demo.read_bytes()
    assets=qa.get('demonstrationAssets')
    if not isinstance(assets,dict)or not assets:raise ValueError('Exact demonstration assets are required')
    actual={str(p.relative_to(DIST)):p for p in (DIST/'Demonstracao').iterdir()if p.is_file()}
    if set(assets)!=set(actual):raise ValueError('Missing or unexpected demonstration assets')
    for name,p in sorted(actual.items()):data[name]=check_pin(p,assets[name])
    summary='Atualização do RevisaWiki para a versão 2.21.3.'
    entries=[('Dados',f'RevisaWiki_{STEM}_dados.js',BASE_SCRIPT+'/Dados.js',summary),('Programa',f'RevisaWiki_{STEM}.js',BASE_SCRIPT+'.js',summary),('Carregador central',f'Carregador_comunitario_RevisaWiki_{STEM}.js',BASE_SCRIPT+'/Carregador.js',summary),('Documentação',f'Documentacao_RevisaWiki_{STEM}.wiki',BASE_SCRIPT,'Atualização da documentação do RevisaWiki 2.21.3.'),('Primeira instalação compartilhada','Chamada_fixa_RevisaWiki_common.js','Especial:Minha página/common.js','Instalação da chamada fixa do RevisaWiki.'),('Carregador para cópia própria',f'Carregador_common_js_RevisaWiki_{STEM}.js','Sua página RevisaWiki/Carregador.js',summary),('Primeira instalação da cópia própria','Chamada_fixa_RevisaWiki_copia_propria.js','Especial:Minha página/common.js','Instalação da chamada fixa do RevisaWiki.')]
    rows=[{'label':label,'file':name,'destination':destination,'editSummary':edit,**pin(data[name])}for label,name,destination,edit in entries]
    lines=['# RevisaWiki 2.21.3','','Atualize dados, programa, carregador central e documentação, nessa ordem. Copie os arquivos completos. A instalação e a publicação na Wikipédia continuam manuais.','','Quem já usa a chamada fixa mantém o common.js como está. Não altere o hash para contornar uma falha de carregamento.','','| Ordem | Arquivo completo | Destino | Resumo da edição |','| --- | --- | --- | --- |']
    for i,row in enumerate(rows,1):lines.append(f'| {i}. {row["label"]} | [{row["file"]}]({row["file"]}) | `{row["destination"]}` | {row["editSummary"]} |')
    lines+=['',f'[Instalação](Instalacao_RevisaWiki_{STEM}.txt) · [Manual](Documentacao_RevisaWiki_{STEM}.wiki) · [Testes e limites](Relatorio_testes_RevisaWiki_{STEM}.txt) · [Demonstração local]({demo.name})','','O motor completo serve somente para uso local e testes. O núcleo e Dados.js são separados e ficam abaixo do limite de cada página.','','Depois de salvar, recarregue sem cache. Firefox e Chrome no Mac: Command + Shift + R. Safari: Option + Command + R. Não é necessário fechar o navegador.','']
    data['INDICE.md']='\n'.join(lines).encode()
    data['ARQUIVOS.json']=raw_json({'version':VERSION,'files':{n:pin(v)for n,v in sorted(data.items())},'wikipediaWrites':0})
    delivery={'version':VERSION,'distributionRevision':VERSION,'releaseGatesPassed':True,'runtimeManifestSha256':sha(data['MANIFESTO_RUNTIME.json']),'qaSha256':sha(qa_raw),'copyPayloads':rows,'files':{n:pin(v)for n,v in sorted(data.items())},'wikipediaWrites':0}
    data['MANIFESTO.json']=raw_json(delivery)
    archive=io.BytesIO()
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as target:
        for name,raw in sorted(data.items()):
            entry=zipfile.ZipInfo(name,(2026,10,28,0,0,0));entry.external_attr=0o100644<<16;entry.compress_type=zipfile.ZIP_DEFLATED;target.writestr(entry,raw)
    with zipfile.ZipFile(io.BytesIO(archive.getvalue()))as packed:
        if packed.testzip()or any(packed.read(n)!=v for n,v in data.items()):raise ValueError('Archive mismatch')
    data['RevisaWiki_2.21.3.zip']=archive.getvalue()
    for name,raw in data.items():
        p=DIST/name;p.parent.mkdir(exist_ok=True,parents=True);p.write_bytes(raw)
    return {'version':VERSION,'files':len(data),'archiveSha256':sha(archive.getvalue()),'wikipediaWrites':0}

if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False,indent=2))
