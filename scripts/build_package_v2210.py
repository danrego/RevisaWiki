"""Assemble the manual copy index and archive from QA-bound release files."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import zipfile
from v221_delivery import (ROOT, DIST, DOCS, STEM, VERSION, FIXED_CALLS, REQUIRED_DOCS,
                          checked_manifest, checked_qa, checked_text_bytes, safe_file, pin,
                          captured, records_of, commit_payloads)

TECHNICAL_SCRIPT_TITLE = 'Usuário:Daniel G Rego/RevisaWiki.js'
OWNER = TECHNICAL_SCRIPT_TITLE.split('/', 1)[0]
SUMMARY = 'Atualização do RevisaWiki para a versão 2.21.0.'

def payloads():
    return [
        ('Dados', f'RevisaWiki_{STEM}_dados.js', OWNER + '/RevisaWiki/Dados.js', SUMMARY),
        ('Programa', f'RevisaWiki_{STEM}.js', OWNER + '/RevisaWiki.js', SUMMARY),
        ('Carregador central', f'Carregador_comunitario_RevisaWiki_{STEM}.js', OWNER + '/RevisaWiki/Carregador.js', SUMMARY),
        ('Documentação', f'Documentacao_RevisaWiki_{STEM}.wiki', OWNER + '/RevisaWiki', 'Atualização da documentação do RevisaWiki 2.21.0.'),
        ('Primeira instalação compartilhada', FIXED_CALLS[0], 'Especial:Minha página/common.js', 'Instalação da chamada fixa do RevisaWiki.'),
        ('Carregador para cópia própria', f'Carregador_common_js_RevisaWiki_{STEM}.js', 'Sua página RevisaWiki/Carregador.js', SUMMARY),
        ('Primeira instalação da cópia própria', FIXED_CALLS[1], 'Especial:Minha página/common.js', 'Instalação da chamada fixa do RevisaWiki.'),
    ]

def build(output=None):
    manifest = checked_manifest()
    qa = checked_qa(manifest)
    output = Path(output or DIST)
    records = records_of(manifest, qa)
    payload_data = {}
    names = []
    for name in manifest['files']:
        record = captured(DIST, name, manifest['files'][name])
        records.append(record)
        payload_data[name] = record['raw']
        names.append(name)
    for name in REQUIRED_DOCS:
        record = captured(DOCS, name)
        records.append(record)
        checked_text_bytes(record['raw'], name)
        payload_data[name] = record['raw']; names.append(name)
    for name, source in [('LICENSE', 'LICENSE'), ('QA_SUMMARY.json', 'tests/evidence/2.21.0/QA_SUMMARY.json'),
                         ('COVERAGE.json', 'tests/evidence/2.21.0/COVERAGE.json')]:
        record = captured(ROOT, source, qa.records[0]['pin'] if name == 'QA_SUMMARY.json' else None)
        records.append(record)
        payload_data[name] = record['raw']; names.append(name)
    demo = f'Demonstracao_RevisaWiki_{STEM}.html'
    demo_record = captured(DIST, demo)
    records.append(demo_record)
    demo_raw = demo_record['raw']
    if hashlib.sha256(demo_raw).hexdigest() != qa.get('demonstrationPortableSha256'):
        raise ValueError('The offline demonstration is not bound to the final QA')
    payload_data[demo] = demo_raw
    names.append(demo)
    index = [f'# RevisaWiki {VERSION}: índice para copiar e colar', '',
             'Atualize dados, programa, carregador central e documentação, nessa ordem. '
             'Abra cada arquivo e use o controle de cópia do GitHub, ou o botão de copiar do pacote registrado no WikiManager. '
             'Copie o arquivo inteiro, sem cercas de Markdown. A publicação na Wikipédia continua manual.', '',
             'Quem já usa a chamada fixa mantém o common.js como está.', '',
             '| Ordem | Arquivo completo | Destino | Resumo da edição |', '| --- | --- | --- | --- |']
    for number, (label, filename, destination, summary) in enumerate(payloads(), 1):
        raw = payload_data[filename]
        index.append(f'| {number}. {label} | [{filename}]({filename}) | `{destination}` | {summary} |')
        if not raw: raise ValueError('An empty installation payload is not allowed')
    index += ['', f'[Instalação detalhada](Instalacao_RevisaWiki_{STEM}.txt) · '
                  f'[Manual](Documentacao_RevisaWiki_{STEM}.wiki) · '
                  f'[Funcionalidades](Funcionalidades_RevisaWiki_2_21.md) · '
                  f'[Testes e limites](Relatorio_testes_RevisaWiki_{STEM}.txt) · '
                  f'[Demonstração local]({demo})', '',
              'A demonstração deve ser baixada e aberta localmente. O GitHub mostra o código de arquivos HTML.', '',
              'O arquivo completo do motor serve para testes locais. Ele ultrapassa o limite de uma página da Wikipédia. '
              'Instale os arquivos separados de dados e programa. Confira 2.21.0 em Sobre e diagnóstico depois de recarregar sem cache.', '',
              'Os arquivos publicados não incluem fontes completas da campanha, perfis de navegador, caminhos locais ou capturas do computador.', '']
    payload_data['INDICE.md'] = '\n'.join(index).encode('utf-8'); names.append('INDICE.md')
    def raw_pin(raw):
        return {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    payload_records = [{'label': label, 'file': name, 'destination': destination, 'editSummary': summary,
                        **raw_pin(payload_data[name])} for label, name, destination, summary in payloads()]
    # Keep the public reader contract used by existing release consumers.
    public_manifest = {'version': VERSION, 'distributionRevision': VERSION,
                       'files': {name: raw_pin(payload_data[name]) for name in sorted(names)},
                       'qaSummarySha256': qa.records[0]['pin']['sha256'], 'wikipediaWrites': 0}
    payload_data['ARQUIVOS.json'] = (json.dumps(public_manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    names.append('ARQUIVOS.json')
    delivery = {'version': VERSION, 'releaseGatesPassed': True, 'wikipediaWrites': 0,
                'runtimeManifestSha256': manifest.records[0]['pin']['sha256'],
                'qaSha256': qa.records[0]['pin']['sha256'],
                'copyPayloads': payload_records, 'files': {name: raw_pin(payload_data[name]) for name in sorted(names)}}
    payload_data['MANIFESTO.json'] = (json.dumps(delivery, ensure_ascii=False, indent=2) + '\n').encode('utf-8'); names.append('MANIFESTO.json')
    archive_name = f'RevisaWiki_{VERSION}.zip'
    archive_bytes = io.BytesIO()
    with zipfile.ZipFile(archive_bytes, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as target:
        for name in sorted(names):
            raw = payload_data[name]
            info = zipfile.ZipInfo(name, (2026, 10, 23, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = 0o100644 << 16
            target.writestr(info, raw, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    with zipfile.ZipFile(io.BytesIO(archive_bytes.getvalue())) as source:
        if source.namelist() != sorted(names) or source.testzip() is not None:
            raise ValueError('The release archive does not contain the exact checked file list')
        for name in names:
            if source.read(name) != payload_data[name]:
                raise ValueError('The archived payload differs from its copy file')
    payload_data[archive_name] = archive_bytes.getvalue()
    commit_payloads(output, payload_data, records)
    for name, raw in payload_data.items():
        if safe_file(output, name).read_bytes() != raw:
            raise ValueError('A committed delivery payload differs from its snapshot')
    print(json.dumps({'version': VERSION, 'files': len(names), 'copyPayloads': len(payload_records),
                      'archive': archive_name, 'archivePin': raw_pin(payload_data[archive_name]), 'wikipediaWrites': 0}, indent=2))
    return delivery

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('--output', type=Path)
    build(parser.parse_args().output)
