"""Build the installation revision only after its native pre-save check passes."""
from copy import deepcopy
from pathlib import Path
import argparse
import hashlib
import importlib.util
import io
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.21.1'
REVISION = '2.21.1-installation.1'
STEM = 'v2_21_1'
MANIFEST = 'tests/expected_release_v2211_installation1.json'
BASE_MANIFEST = 'tests/expected_release_v2211.json'
BASE_MANIFEST_SHA256 = 'a4c21bf8ac9a007755dc199b61f73f41aaf1fea88278315b6c18ba60157740a8'
BASE_DELIVERY_SHA256 = '9f028f5e997229bfaa8854a181926b2fd52bd6a4596064ca72421d98601c2672'
BASE_COVERAGE_SHA256 = '4dcf2afe75ad36d7f990fa88c886a9763f0b550a1b5bf444ad3b26ec94afa1f2'
PACKED_SHA256 = 'daac113c09d861d141090d42e332a194b33a85d5b5831602329671ffd5aad011'
PRESAVE_RECORD = 'tests/evidence/' + REVISION + '/PRESAVE_ROUNDTRIP.json'
DEMO_AUXILIARY_PINS = {
    'Demonstracao/DEMONSTRACAO.html': {'bytes': 2536, 'sha256': '24c17c163cd1b21bcd38c0ce0160f9a7e13db3e88b52c5767936eb7ae948986b'},
    'Demonstracao/demonstracao.css': {'bytes': 2716, 'sha256': '99954175d4878bc63a79dd2c04d0a8c08ef211edc2b636210e1dd493f9d40867'},
    'Demonstracao/demonstracao.js': {'bytes': 6557, 'sha256': 'ebf28578b7b5808796965bdcfe664964a881d601094e37f074a7bb123b21d35f'},
    'Demonstracao/exemplos.json': {'bytes': 304825, 'sha256': '5e0958c49582b634df0bdbdeb3e4fa99e170a03dbeb7fa788301889df7ea4fb0'},
    'Demonstracao/motor.js': {'bytes': 1755, 'sha256': '23ae9cbebe03175b86f56f6deafbba97d6ebace2b7c80bc95e7727e1655f0907'},
}
FEATURES = (
    'Protege as strings do arquivo de dados contra normalização Unicode e substituições durante o salvamento na Wikipédia.',
    'Exige a comparação do catálogo completo após a transformação pré-salvamento antes de montar o pacote final.',
    'Conserva o catálogo decodificado, o hash esperado, o núcleo, os carregadores e as chamadas fixas da 2.21.1.',
    'Identifica os arquivos e seus destinos no índice para distinguir o programa do carregador.',
)


def load_module(path, alias):
    spec = importlib.util.spec_from_file_location(alias, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


previous_builder = load_module(ROOT / 'scripts/build_delivery_v2211.py', '_installation_previous_delivery')
sha = previous_builder.sha
json_bytes = previous_builder.json_bytes
RUNTIME_FILES = previous_builder.RUNTIME_FILES
DOC_NAMES = previous_builder.DOC_NAMES
FIXED_CALLS = previous_builder.FIXED_CALLS
OWNER = previous_builder.OWNER


class Delivery(previous_builder.Delivery):
    def __init__(self, root=ROOT):
        super().__init__(root)
        self.dist = self.root / 'dist' / REVISION
        self.docs = self.root / 'docs' / REVISION
        self.qa_path = self.root / 'tests/evidence' / REVISION / 'QA_SUMMARY.json'
        self.shared.DIST, self.shared.DOCS = self.dist, self.docs
        self.shared.checked_manifest, self.shared.checked_qa = self.manifest, self.qa

    def manifest(self, path=None):
        s = self.shared
        record = s.record_path(path or self.root / MANIFEST)
        value = json.loads(record['raw'])
        baseline = s.captured(self.root, BASE_MANIFEST)
        if baseline['pin']['sha256'] != BASE_MANIFEST_SHA256:
            raise ValueError('The published runtime manifest changed')
        base = json.loads(baseline['raw'])
        if value.get('version') != VERSION or value.get('distributionRevision') != REVISION:
            raise ValueError('The installation revision has unexpected metadata')
        if set(value.get('files', {})) != RUNTIME_FILES or value.get('packedCatalogSha256') != PACKED_SHA256:
            raise ValueError('The installation revision must preserve the complete catalogue and seven runtime files')
        inputs = value.get('sourceInputs')
        expected_inputs = {'src/v2_21_1/short_columns.js', 'src/v2_21_1/patches.json', 'scripts/build_v2211.py', 'scripts/wiki_safe_data.py'}
        if not isinstance(inputs, dict) or set(inputs) != expected_inputs:
            raise ValueError('The installation build inputs are missing or unexpected')
        records = [record, baseline]
        for name, expected in base['files'].items():
            records.append(s.captured(self.root / 'dist/2.21.1', name, expected))
            if name != f'RevisaWiki_{STEM}_dados.js' and value['files'][name] != expected:
                raise ValueError('The installation revision may change only the data representation')
        for name, expected in value['files'].items():
            if name != f'RevisaWiki_{STEM}_completo.js' and expected.get('bytes', 2_097_152) >= 2_097_152:
                raise ValueError('An installable runtime file reaches the wiki page-size limit')
            records.append(s.captured(self.dist, name, expected))
        for name, expected in inputs.items():
            records.append(s.captured(self.root, name, expected))
        return s.ReleaseRecord(value, records)

    def qa(self, manifest, path=None):
        s = self.shared
        record = s.record_path(path or self.qa_path)
        value = json.loads(record['raw'])
        if value.get('version') != VERSION or value.get('distributionRevision') != REVISION:
            raise ValueError('The installation QA has unexpected metadata')
        if value.get('releaseGatesPassed') is not True or value.get('runtimeGatesPassed') is not True:
            raise ValueError('The installation QA has not passed')
        if value.get('frozenFiles') != manifest['files'] or value.get('sourceInputs') != manifest['sourceInputs']:
            raise ValueError('The installation QA does not bind these exact runtime and source bytes')
        if value.get('runtimeManifestSha256') != manifest.records[0]['pin']['sha256']:
            raise ValueError('The installation QA has a different manifest binding')
        if value.get('workerDeadlineMilliseconds') != 60_000 or value.get('unresolvedIntegrityFailures') != 0 or value.get('wikipediaWrites') != 0:
            raise ValueError('The deadline, integrity or no-Wikipedia-write gate failed')
        receipt = s.captured(self.root, PRESAVE_RECORD)
        if value.get('presaveRoundtripSha256') != receipt['pin']['sha256']:
            raise ValueError('The installation QA must bind the native pre-save receipt')
        gate_record = s.captured(self.root, 'scripts/check_wiki_presave.py')
        gate = load_module(self.root / 'scripts/check_wiki_presave.py', '_installation_native_gate')
        gate.validate_receipt(json.loads(receipt['raw']), self.root / MANIFEST,
                              self.dist / f'RevisaWiki_{STEM}_dados.js', self.root / BASE_MANIFEST)
        return s.ReleaseRecord(value, [record, receipt, gate_record])

    def prior_inputs(self):
        s = self.shared
        record = s.captured(self.root, 'dist/2.21.1/MANIFESTO.json')
        if record['pin']['sha256'] != BASE_DELIVERY_SHA256:
            raise ValueError('The previous delivery manifest changed')
        manifest = json.loads(record['raw'])
        docs, records = {}, [record]
        for name in DOC_NAMES:
            item = s.captured(self.root / 'docs/2.21.1', name, manifest['files'][name])
            docs[name] = item['raw'].decode('utf-8')
            records.append(item)
        coverage = s.captured(self.root, 'tests/evidence/2.21.1/COVERAGE.json')
        if coverage['pin']['sha256'] != BASE_COVERAGE_SHA256:
            raise ValueError('The previous coverage record changed')
        records.append(coverage)
        return docs, json.loads(coverage['raw']), records

    def coverage(self, previous, manifest):
        value = deepcopy(previous)
        value['distributionRevision'] = REVISION
        value['runtimeManifestSha256'] = manifest.records[0]['pin']['sha256']
        value['previousCoverageSha256'] = BASE_COVERAGE_SHA256
        value['scope'] = 'Revisão da representação dos dados durante a instalação. As regras automáticas e as classificações anteriores são conservadas.'
        value['installationQualification'] = {'nativePresaveReceipt': PRESAVE_RECORD,
                                              'decodedCatalogueUnchanged': True,
                                              'automaticRulesChanged': False,
                                              'historicalResultsRewritten': False}
        return value

    def documents(self, previous, coverage, qa):
        paragraphs = qa.get('docValidationParagraphs')
        if not isinstance(paragraphs, list) or not paragraphs or any(not isinstance(p, str) or not p.strip() for p in paragraphs):
            raise ValueError('Reviewed installation validation paragraphs are required')
        validation = '\n\n'.join(paragraphs)
        feature_list = '\n'.join('* ' + item for item in FEATURES)
        values = dict(previous)
        old = previous[f'Documentacao_RevisaWiki_{STEM}.wiki']
        if old.count('== Histórico das versões ==\n') != 1:
            raise ValueError('The previous history boundary changed')
        head, history = old.split('== Histórico das versões ==\n', 1)
        match = re.search(r'^=== 2\.21\.1 ===$', history, re.M)
        if not match or len(re.findall(r'^=== [0-9]+\.[0-9]+\.[0-9]+ ===$', history, re.M)) != 49:
            raise ValueError('All 49 previous history entries must remain complete')
        intro, entries = history[:match.start()].strip(), history[match.start():]
        note = ('Esta distribuição é a revisão de instalação 1 da versão 2.21.1. O arquivo de dados foi protegido para conservar seu conteúdo ao ser salvo na Wikipédia. '
                'O programa, o catálogo em execução e as regras automáticas continuam na 2.21.1.')
        marker = '== Novidades da 2.21.1 =='
        if head.count(marker) != 1:
            raise ValueError('The current feature heading changed')
        head = head.replace(marker, '== Revisão de instalação 1 ==\n\n' + note + '\n\n' + feature_list + '\n\n' + marker, 1)
        head = head.replace('blob/main/dist/2.21.1/INDICE.md', 'blob/main/dist/' + REVISION + '/INDICE.md')
        before = 'As três partes de código precisam ser da mesma versão. Substitua o conteúdo completo pelos arquivos correspondentes.'
        after = (before + ' O carregador central tem cerca de 10 KB e recebe somente o arquivo de carregador. O núcleo, com cerca de 2 MB, pertence à página RevisaWiki.js. '
                 'Não altere o hash esperado para contornar uma falha de carregamento. Reinstale os arquivos correspondentes da revisão atual.')
        if head.count(before) != 1:
            raise ValueError('The installation file-role anchor changed')
        head = head.replace(before, after, 1)
        start, end = head.index('== Validação da versão =='), head.index('== Código e licença ==')
        head = head[:start] + '== Validação da versão ==\n\n' + validation + '\n\n' + head[end:]
        before = 'A separação entre dados e programa conserva os valores literais, e as duas distribuições são testadas.'
        after = ('A montagem também protege a escrita das strings de dados contra normalização Unicode e substituições antes do salvamento. '
                 'A transformação pré-salvamento é consultada pela API somente de leitura, e o pacote final exige a igualdade de todos os valores decodificados e do hash esperado. '
                 'Uma falha ou um resultado pertencente a outro arquivo impede a montagem.')
        if head.count(before) != 1:
            raise ValueError('The build-validation anchor changed')
        head = head.replace(before, after, 1)
        manual = head.rstrip() + '\n\n== Histórico das versões ==\n\n' + intro + '\n\n=== 2.21.1: revisão de instalação 1 ===\n\n' + feature_list + '\n\n' + entries
        if not manual.endswith(entries):
            raise ValueError('A previous history entry changed')
        values[f'Documentacao_RevisaWiki_{STEM}.wiki'] = manual
        values[f'Instalacao_RevisaWiki_{STEM}.txt'] = ('RevisaWiki 2.21.1: revisão de instalação 1\n\n'
            'Código e versões: https://github.com/danrego/RevisaWiki\nÍndice com arquivos, destinos e resumos: dist/' + REVISION + '/INDICE.md\n\n'
            'Atualize os arquivos completos da distribuição compartilhada, nesta ordem:\n'
            '1. RevisaWiki_v2_21_1_dados.js → ' + OWNER + '/RevisaWiki/Dados.js\n'
            '2. RevisaWiki_v2_21_1.js → ' + OWNER + '/RevisaWiki.js\n'
            '3. Carregador_comunitario_RevisaWiki_v2_21_1.js → ' + OWNER + '/RevisaWiki/Carregador.js\n'
            '4. Documentacao_RevisaWiki_v2_21_1.wiki → ' + OWNER + '/RevisaWiki\n\n'
            'O carregador central tem cerca de 10 KB. O núcleo, com cerca de 2 MB, pertence à página RevisaWiki.js. Não cole o núcleo no destino do carregador. '
            'Os dados protegidos conservam o catálogo e o hash original. Se o hash do núcleo foi alterado para contornar o aviso, substitua o núcleo pelo arquivo completo deste pacote.\n\n'
            'A chamada fixa no common.js permanece igual. Na primeira instalação, acrescente Chamada_fixa_RevisaWiki_common.js preservando os demais scripts. Mantenha apenas uma chamada.\n\n'
            'Depois de salvar, recarregue sem cache. Firefox e Chrome no Mac: Command + Shift + R. Safari: Option + Command + R. A versão exibida continua 2.21.1. '
            'Não é necessário fechar o navegador.\n\n'
            'Cada parte instalável foi conferida contra o limite de 2.097.152 bytes. O arquivo completo ultrapassa esse limite e serve somente para uso local e testes. '
            'O aviso de 102400 bytes do realce de sintaxe se refere à exibição com cores, não à integridade do catálogo.\n\n'
            'Para uma cópia própria, instale dados e programa na sua conta e use Carregador_common_js_RevisaWiki_v2_21_1.js no seu carregador central. '
            'Na primeira instalação, use Chamada_fixa_RevisaWiki_copia_propria.js no common.js. Escolha apenas uma instalação.\n\n'
            'Os arquivos não publicam na Wikipédia. A edição e a instalação permanecem manuais. O limite de análise de 60 segundos e a preservação do rascunho continuam iguais.')
        values[f'Notas_da_versao_RevisaWiki_{STEM}.txt'] = 'RevisaWiki 2.21.1: revisão de instalação 1\n\n' + '\n'.join('- ' + item for item in FEATURES) + '\n\n' + validation
        values[f'Referencia_tecnica_RevisaWiki_{STEM}.txt'] = ('RevisaWiki 2.21.1: revisão de instalação 1\n\n'
            'Distribuição: ' + REVISION + '\nMontagem dos arquivos: python3 scripts/build_v2211.py\n'
            'Repetir a transformação pré-salvamento: python3 scripts/verify_current_presave.py\n'
            'Montagem da entrega: python3 scripts/build_delivery_v2211_installation1.py\nManifesto: ' + MANIFEST + '\n'
            'Validação: tests/evidence/' + REVISION + '/QA_SUMMARY.json\nPré-salvamento: ' + PRESAVE_RECORD + '\n\n'
            'A representação textual das strings usa escapes JavaScript para conservar os valores durante normalização Unicode e substituições do salvamento. '
            'O objeto completo deve ser idêntico ao catálogo da distribuição original. O hash esperado permanece ' + PACKED_SHA256 + '. '
            'A transformação pré-salvamento consulta action=parse com onlypst, sem autenticação ou ação de edição. A resposta precisa pertencer aos bytes atuais e preservar os dados e o código, admitindo apenas a retirada de uma quebra de linha terminal. '
            'O pacote recusa recibos ausentes, inválidos ou referentes a outros arquivos. O núcleo, o motor completo, os carregadores e as chamadas fixas conservam seus hashes anteriores.')
        values[f'Relatorio_testes_RevisaWiki_{STEM}.txt'] = ('RevisaWiki 2.21.1: revisão de instalação 1, testes e limites\n\n' + validation + '\n\n'
            'Os resultados anteriores permanecem nos relatórios das distribuições originais. Eles não foram substituídos por testes desta revisão. '
            'Os casos históricos de timeout não foram repetidos, e o limite de 60 segundos permanece.\n\nRegistros atuais: tests/evidence/' + REVISION + '/QA_SUMMARY.json e ' + PRESAVE_RECORD + '.')
        values[f'Resumo_atualizacao_RevisaWiki_{STEM}.txt'] = 'Proteção permanente dos dados do RevisaWiki 2.21.1 contra transformações durante o salvamento, preservando o catálogo e a verificação de integridade.'
        values[f'Resumo_documentacao_RevisaWiki_{STEM}.txt'] = 'Atualização da instalação e da documentação do RevisaWiki 2.21.1, com o teste de pré-salvamento e os destinos corretos de cada arquivo.'
        values['LEIA_PRIMEIRO.txt'] = ('RevisaWiki 2.21.1: revisão de instalação 1\n\nComece por dist/' + REVISION + '/INDICE.md. '
            'Atualize dados, programa, carregador central e documentação, nessa ordem. Use somente os arquivos desta revisão. '
            'A chamada fixa do common.js permanece igual. A instalação e a publicação na Wikipédia continuam manuais.')
        values['Funcionalidades_RevisaWiki_2_21_1.md'] = ('# RevisaWiki 2.21.1: revisão de instalação 1\n\n' + '\n'.join('- ' + item for item in FEATURES) + '\n\n'
            'A regra de colunas exige oito itens principais nas listas finais compatíveis. As regras de referências permanecem iguais. '
            'Esta revisão protege a instalação e não acrescenta nem retira regras de correção de artigos.\n\n'
            'As classificações de recursos abaixo são conservadas da distribuição original. Elas não são novas contagens de testes.\n\n' +
            '\n'.join('- `' + row['id'] + '`: ' + row['disposition'] + '. ' + row['summary'] for row in coverage['items']))
        return {name: (text.rstrip() + '\n').encode('utf-8') for name, text in values.items()}

    def demonstration(self, output, qa, preview):
        if preview:
            raise ValueError('The corrected package requires the final native pre-save check')
        s = self.shared
        manifest_record = s.captured(self.root, 'dist/2.21.1/MANIFESTO.json')
        if manifest_record['pin']['sha256'] != BASE_DELIVERY_SHA256:
            raise ValueError('The original demonstration manifest changed')
        manifest = json.loads(manifest_record['raw'])
        names = [f'Demonstracao_RevisaWiki_{STEM}.html', 'Demonstracao/DEMONSTRACAO.html', 'Demonstracao/demonstracao.css', 'Demonstracao/demonstracao.js', 'Demonstracao/motor.js', 'Demonstracao/exemplos.json']
        payloads, records = {}, [manifest_record]
        for name in names:
            item = s.captured(self.root / 'dist/2.21.1', name, DEMO_AUXILIARY_PINS.get(name) or manifest['files'][name])
            payloads[name] = item['raw']
            records.append(item)
        if sha(payloads[names[0]]) != qa.get('demonstrationPortableSha256'):
            raise ValueError('The unchanged demonstration does not match the reviewed QA')
        return payloads, records, {'version': VERSION, 'unchangedFromPublished2211': True, 'examples': 95, 'portableSha256': sha(payloads[names[0]])}

    def payload_rows(self):
        rows = super().payload_rows()
        replacements = ['Proteção dos dados do RevisaWiki 2.21.1 contra transformações durante o salvamento.',
                        'Restauração do núcleo e da assinatura original do catálogo do RevisaWiki 2.21.1.',
                        'Instalação do carregador da revisão de instalação 1 do RevisaWiki 2.21.1.',
                        'Atualização da documentação da revisão de instalação 1 do RevisaWiki 2.21.1.']
        return [(label, name, destination, replacements[i] if i < 4 else summary) for i, (label, name, destination, summary) in enumerate(rows)]

    def package(self, manifest, qa, docs, coverage, demonstration):
        s = self.shared
        data = {name: s.safe_file(self.dist, name).read_bytes() for name in manifest['files']}
        data.update(docs)
        data.update({'LICENSE': s.safe_file(self.root, 'LICENSE').read_bytes(), 'QA_SUMMARY.json': qa.records[0]['raw'],
                     'COVERAGE.json': json_bytes(coverage), 'PRESAVE_ROUNDTRIP.json': s.safe_file(self.root, PRESAVE_RECORD).read_bytes(),
                     f'Demonstracao_RevisaWiki_{STEM}.html': demonstration[f'Demonstracao_RevisaWiki_{STEM}.html']})
        rows = [{'label': label, 'file': name, 'destination': destination, 'editSummary': summary,
                 'bytes': len(data[name]), 'sha256': sha(data[name])} for label, name, destination, summary in self.payload_rows()]
        lines = ['# RevisaWiki 2.21.1: revisão de instalação 1', '',
                 'Atualize dados, programa, carregador central e documentação, nessa ordem. Copie os arquivos completos. A publicação na Wikipédia continua manual.', '',
                 'O carregador central tem cerca de 10 KB. O núcleo de cerca de 2 MB pertence à página RevisaWiki.js. Cada linha abaixo indica um arquivo e seu destino.', '',
                 'Quem já usa a chamada fixa mantém o common.js como está. A versão exibida pelo programa continua 2.21.1.', '',
                 'Os dados protegidos preservam o catálogo e a assinatura original. Não altere o hash esperado para contornar um aviso de carregamento.', '',
                 '| Ordem | Arquivo completo | Destino | Resumo da edição |', '| --- | --- | --- | --- |']
        for i, row in enumerate(rows, 1):
            lines.append(f'| {i}. {row["label"]} | [{row["file"]}]({row["file"]}) | `{row["destination"]}` | {row["editSummary"]} |')
        lines += ['', f'[Instalação](Instalacao_RevisaWiki_{STEM}.txt) · [Manual](Documentacao_RevisaWiki_{STEM}.wiki) · [Testes e limites](Relatorio_testes_RevisaWiki_{STEM}.txt) · [Demonstração local](Demonstracao_RevisaWiki_{STEM}.html)', '',
                  'Listas finais simples só recebem duas colunas a partir de oito itens principais. As regras de referências permanecem iguais.', '',
                  'O motor completo serve para uso local e testes. Ele ultrapassa o limite de uma página da Wikipédia.', '',
                  'Depois de salvar, recarregue sem cache: Command + Shift + R no Firefox ou Chrome para Mac. No Safari, Option + Command + R.', '']
        data['INDICE.md'] = '\n'.join(lines).encode('utf-8')
        pin = lambda raw: {'bytes': len(raw), 'sha256': sha(raw)}
        data['ARQUIVOS.json'] = json_bytes({'version': VERSION, 'distributionRevision': REVISION,
            'files': {name: pin(raw) for name, raw in sorted(data.items())}, 'qaSummarySha256': qa.records[0]['pin']['sha256'],
            'presaveRoundtripSha256': qa['presaveRoundtripSha256'], 'wikipediaWrites': 0})
        delivery = {'version': VERSION, 'distributionRevision': REVISION, 'releaseGatesPassed': True, 'wikipediaWrites': 0,
                    'runtimeManifestSha256': manifest.records[0]['pin']['sha256'], 'qaSha256': qa.records[0]['pin']['sha256'],
                    'presaveRoundtripSha256': qa['presaveRoundtripSha256'], 'copyPayloads': rows,
                    'files': {name: pin(raw) for name, raw in sorted(data.items())}}
        data['MANIFESTO.json'] = json_bytes(delivery)
        archive = io.BytesIO()
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as target:
            for name, raw in sorted(data.items()):
                entry = zipfile.ZipInfo(name, (2026, 10, 26, 0, 0, 0))
                entry.compress_type, entry.external_attr = zipfile.ZIP_DEFLATED, 0o100644 << 16
                target.writestr(entry, raw, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        with zipfile.ZipFile(io.BytesIO(archive.getvalue())) as zipped:
            if len(zipped.namelist()) != len(data) or zipped.testzip() is not None or any(zipped.read(name) != raw for name, raw in data.items()):
                raise ValueError('The archive does not contain the exact delivery bytes')
        data['RevisaWiki_' + REVISION + '.zip'] = archive.getvalue()
        return data, delivery

    def build(self):
        s = self.shared
        manifest = self.manifest()
        qa = self.qa(manifest)
        records = s.records_of(manifest, qa)
        records += [s.record_path(Path(__file__)), s.record_path(ROOT / 'scripts/build_delivery_v2211.py'), s.record_path(ROOT / 'scripts/v221_delivery.py'), s.record_path(ROOT / 'scripts/verify_current_presave.py'), s.captured(self.root, 'LICENSE')]
        previous, old_coverage, prior_records = self.prior_inputs()
        records += prior_records
        coverage = self.coverage(old_coverage, manifest)
        docs = self.documents(previous, coverage, qa)
        for name, raw in docs.items():
            s.checked_text_bytes(raw, name)
        demo, demo_records, demo_result = self.demonstration(self.dist, qa, False)
        records += demo_records
        package, delivery = self.package(manifest, qa, docs, coverage, demo)
        package.update({name: raw for name, raw in demo.items() if name.startswith('Demonstracao/')})
        destinations = [(self.docs, docs), (self.dist, package), (self.qa_path.parent, {'COVERAGE.json': json_bytes(coverage)})]
        for destination, payloads in destinations:
            s.output_preflight(destination, payloads)
        s.verify_records(records)
        for destination, payloads in destinations:
            s.commit_payloads(destination, payloads, records)
        return {'version': VERSION, 'distributionRevision': REVISION, 'documents': len(docs),
                'demonstration': demo_result, 'runtimeManifestSha256': manifest.records[0]['pin']['sha256'],
                'archiveSha256': sha(package['RevisaWiki_' + REVISION + '.zip']), 'wikipediaWrites': 0}


def main():
    argparse.ArgumentParser(description=__doc__).parse_args()
    print(json.dumps(Delivery().build(), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
