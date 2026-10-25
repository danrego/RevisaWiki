"""Build the column-threshold patch delivery from byte-bound QA and prior sources."""
from copy import deepcopy
from pathlib import Path
import argparse
import hashlib
import importlib.util
import io
import json
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.21.1'
STEM = 'v2_21_1'
BASE_VERSION = '2.21.0'
BASE_MANIFEST_SHA256 = 'd9d60417425952e12971e1e4ee94cc1d747ed53ec64c058f98910cddaa382609'
BASE_DELIVERY_SHA256 = '08ab845473104b3c66447cdf093b8f9f6c49f025e39268a99a1eecdd37d22233'
BASE_COVERAGE_SHA256 = 'c4f30dec96e520aceb5f6b5712acecfe7e9c42f38cdc130b3d9db5ba5481fa1f'
DEMO_FIXTURE_SHA256 = 'f07d0d80927824e183d1dd3f6ee9215b529c07370b8867df2a97748c717f06de'
DEMO_EXAMPLES = 95
SOURCE_INPUTS = frozenset(('src/v2_21_1/short_columns.js', 'src/v2_21_1/patches.json', 'scripts/build_v2211.py'))
FIXED_CALLS = ('Chamada_fixa_RevisaWiki_common.js', 'Chamada_fixa_RevisaWiki_copia_propria.js')
RUNTIME_FILES = frozenset((f'RevisaWiki_{STEM}.js', f'RevisaWiki_{STEM}_dados.js', f'RevisaWiki_{STEM}_completo.js', f'Carregador_common_js_RevisaWiki_{STEM}.js', f'Carregador_comunitario_RevisaWiki_{STEM}.js', *FIXED_CALLS))
DOC_NAMES = (f'Documentacao_RevisaWiki_{STEM}.wiki', f'Instalacao_RevisaWiki_{STEM}.txt', f'Notas_da_versao_RevisaWiki_{STEM}.txt', f'Referencia_tecnica_RevisaWiki_{STEM}.txt', f'Relatorio_testes_RevisaWiki_{STEM}.txt', f'Resumo_atualizacao_RevisaWiki_{STEM}.txt', f'Resumo_documentacao_RevisaWiki_{STEM}.txt', 'LEIA_PRIMEIRO.txt', 'Funcionalidades_RevisaWiki_2_21_1.md')
FEATURES = (
    'Acrescenta duas colunas às listas simples das seções finais somente a partir de oito itens do nível principal.',
    'Conta os subitens junto do item a que pertencem, sem usá-los para atingir o mínimo.',
    'Retira invólucros simples de duas colunas de listas curtas quando a estrutura permite preservar todo o conteúdo.',
    'Preserva estilos próprios, tabelas, listas misturadas e estruturas sem correspondência confirmada. As regras de colunas de referências não mudam nesta atualização.',
)
TECHNICAL_SCRIPT_TITLE = 'Usuário:Daniel G Rego/RevisaWiki.js'
OWNER = TECHNICAL_SCRIPT_TITLE.split('/', 1)[0]


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def one(text, before, after):
    if text.count(before) != 1:
        raise ValueError('A reviewed documentation anchor changed')
    return text.replace(before, after, 1)


def rename(text):
    return text.replace('2.21.0', VERSION).replace('_v2_21_0', '_' + STEM).replace('expected_release_v2210', 'expected_release_v2211').replace('build_v2210.py', 'build_v2211.py').replace('tests/v221/README.md', 'tests/v2211/README.md')


def load_module(path, alias):
    spec = importlib.util.spec_from_file_location(alias, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Delivery:
    def __init__(self, root=ROOT):
        self.root = Path(root).resolve()
        self.dist = self.root / 'dist' / VERSION
        self.docs = self.root / 'docs' / VERSION
        self.qa_path = self.root / 'tests/evidence' / VERSION / 'QA_SUMMARY.json'
        self.shared = load_module(ROOT / 'scripts/v221_delivery.py', '_v2211_delivery_support')
        self.shared.ROOT, self.shared.DIST, self.shared.DOCS = self.root, self.dist, self.docs
        self.shared.VERSION, self.shared.STEM = VERSION, STEM
        self.shared.checked_manifest, self.shared.checked_qa = self.manifest, self.qa

    def manifest(self, path=None):
        s = self.shared
        record = s.record_path(path or self.root / 'tests/expected_release_v2211.json')
        value = json.loads(record['raw'])
        records = [record]
        if value.get('version') != VERSION or value.get('baseVersion') != BASE_VERSION:
            raise ValueError('The patch manifest has an unexpected version or base')
        if set(value.get('files', {})) != RUNTIME_FILES or set(value.get('sourceInputs', {})) != SOURCE_INPUTS:
            raise ValueError('The patch manifest must bind exactly seven runtime files and three build inputs')
        baseline = s.captured(self.root, 'tests/expected_release_v2210.json')
        if baseline['pin']['sha256'] != BASE_MANIFEST_SHA256 or value.get('baseManifestSha256') != BASE_MANIFEST_SHA256:
            raise ValueError('The immutable base manifest has changed')
        base = json.loads(baseline['raw'])
        records.append(baseline)
        for name, expected in base['files'].items():
            records.append(s.captured(self.root / 'dist/2.21.0', name, expected))
        for name, expected in value['files'].items():
            if name != f'RevisaWiki_{STEM}_completo.js' and expected.get('bytes', 2_097_152) >= 2_097_152:
                raise ValueError('An installable runtime file reaches the wiki page-size limit')
            records.append(s.captured(self.dist, name, expected))
        for name, expected in value['sourceInputs'].items():
            records.append(s.captured(self.root, name, expected))
        if value.get('packedCatalogSha256') != base.get('packedCatalogSha256'):
            raise ValueError('The patch must preserve the packed catalogue')
        for name in FIXED_CALLS:
            if value['files'][name] != base['files'][name]:
                raise ValueError('An existing fixed common.js call changed')
        return s.ReleaseRecord(value, records)

    def qa(self, manifest, path=None):
        s = self.shared
        record = s.record_path(path or self.qa_path)
        value = json.loads(record['raw'])
        if value.get('version') != VERSION or value.get('releaseGatesPassed') is not True or value.get('runtimeGatesPassed') is not True:
            raise ValueError('The patch runtime QA has not passed')
        if value.get('frozenFiles') != manifest['files'] or value.get('sourceInputs') != manifest['sourceInputs']:
            raise ValueError('The QA does not bind these runtime and source bytes')
        if value.get('runtimeManifestSha256') != manifest.records[0]['pin']['sha256'] or value.get('baseManifestSha256') != BASE_MANIFEST_SHA256:
            raise ValueError('The QA has different manifest bindings')
        if value.get('workerDeadlineMilliseconds') != 60_000 or value.get('unresolvedIntegrityFailures') != 0 or value.get('wikipediaWrites') != 0:
            raise ValueError('The deadline, integrity or no-Wikipedia-write gate failed')
        return s.ReleaseRecord(value, [record])

    def prior_inputs(self):
        s = self.shared
        record = s.captured(self.root, 'dist/2.21.0/MANIFESTO.json')
        if record['pin']['sha256'] != BASE_DELIVERY_SHA256:
            raise ValueError('The previous delivery manifest changed')
        manifest = json.loads(record['raw'])
        docs, records = {}, [record]
        for name in DOC_NAMES:
            old_name = name.replace('_v2_21_1', '_v2_21_0').replace('_2_21_1.md', '_2_21.md')
            item = s.captured(self.root / 'docs/2.21.0', old_name, manifest['files'][old_name])
            docs[name] = item['raw'].decode('utf-8')
            records.append(item)
        coverage = s.captured(self.root, 'tests/evidence/2.21.0/COVERAGE.json')
        if coverage['pin']['sha256'] != BASE_COVERAGE_SHA256:
            raise ValueError('The previous coverage record changed')
        records.append(coverage)
        return docs, json.loads(coverage['raw']), records

    def coverage(self, previous, manifest):
        items = deepcopy(previous['items'])
        changed = [row for row in items if row['id'] == 'STR-COMP-01']
        if len(changed) != 1:
            raise ValueError('The prior column contract is missing or repeated')
        row = changed[0]
        row['previousSummary'] = row['summary']
        row['previousTests'] = row.get('tests', [])
        row['summary'] = 'Acrescenta duas colunas às listas simples das seções finais a partir de oito itens do nível principal. Subitens não aumentam a contagem. Invólucros simples de listas curtas só são retirados com preservação do conteúdo e da estrutura.'
        row['sourceModules'] = ['src/v2_21_1/short_columns.js', 'src/v2_21_1/patches.json']
        row['tests'] = []
        row['currentValidation'] = 'tests/evidence/2.21.1/QA_SUMMARY.json'
        for item in items:
            item['qualificationOrigin'] = 'changed-in-2.21.1' if item['id'] == 'STR-COMP-01' else 'inherited-2.21.0'
        return {'schemaVersion': 1, 'release': VERSION, 'baseVersion': BASE_VERSION,
                'scope': 'Correção delimitada do mínimo de itens e dos invólucros simples de listas finais. As demais classificações são herdadas da versão anterior, sem anunciar novas execuções de toda a campanha.',
                'runtimeManifestSha256': manifest.records[0]['pin']['sha256'],
                'previousCoverageSha256': BASE_COVERAGE_SHA256, 'planItemCount': len(items),
                'dispositions': previous['dispositions'], 'items': items,
                'minimumTopLevelEndmatterItems': 8, 'referenceColumnRulesChanged': False,
                'sourceModules': manifest['sourceInputs'], 'wikipediaWrites': 0,
                'inheritedQualification': {'version': BASE_VERSION, 'path': 'tests/evidence/2.21.0/COVERAGE.json',
                                           'sha256': BASE_COVERAGE_SHA256, 'historicalResultsRewritten': False}}

    def documents(self, previous, coverage, qa):
        paragraphs = qa.get('docValidationParagraphs')
        if not isinstance(paragraphs, list) or not paragraphs or any(not isinstance(p, str) or not p.strip() for p in paragraphs):
            raise ValueError('Reviewed patch validation paragraphs are required')
        validation = '\n\n'.join(paragraphs)
        feature_list = '\n'.join('* ' + item for item in FEATURES)
        old = previous[f'Documentacao_RevisaWiki_{STEM}.wiki']
        if old.count('== Histórico das versões ==\n') != 1:
            raise ValueError('The previous history boundary changed')
        head, history = old.split('== Histórico das versões ==\n', 1)
        match = re.search(r'^=== [0-9]+\.[0-9]+\.[0-9]+ ===$', history, re.M)
        if not match or len(re.findall(r'^=== [0-9]+\.[0-9]+\.[0-9]+ ===$', history, re.M)) != 48:
            raise ValueError('The previous 48 history entries must remain complete')
        intro, entries = history[:match.start()].strip(), history[match.start():]
        head = rename(head)
        head = one(head, '== Novidades da 2.21 ==', '== Novidades da 2.21.1 ==\n\n' + feature_list + '\n\n== Recursos da ferramenta ==')
        start, end = head.index('== Validação da versão =='), head.index('== Código e licença ==')
        head = head[:start] + '== Validação da versão ==\n\n' + validation + '\n\n' + head[end:]
        head = one(head, 'A reconstrução parte dos arquivos imutáveis da 2.20, confere seus hashes e aplica os módulos da 2.21.',
                   'A reconstrução parte dos sete arquivos imutáveis da 2.21.0, confere seus hashes e aplica a correção delimitada desta versão. Uma prova de reversão confere que as demais mudanças se limitam à identificação da versão.')
        manual = head.rstrip() + '\n\n== Histórico das versões ==\n\n' + intro + '\n\n=== 2.21.1 ===\n\n' + feature_list + '\n\n' + entries
        if not manual.endswith(entries):
            raise ValueError('A previous release entry changed')
        values = {name: rename(text) for name, text in previous.items()}
        values[f'Documentacao_RevisaWiki_{STEM}.wiki'] = manual
        values[f'Notas_da_versao_RevisaWiki_{STEM}.txt'] = 'RevisaWiki 2.21.1\n\n' + '\n'.join('- ' + item for item in FEATURES) + '\n\n' + validation
        values[f'Relatorio_testes_RevisaWiki_{STEM}.txt'] = 'RevisaWiki 2.21.1: testes e limites\n\n' + validation + '\n\nAs validações e os limites da versão 2.21.0 permanecem nos relatórios anteriores. Não foram reclassificados como novos resultados desta atualização.\n\nRegistros atuais: tests/evidence/2.21.1/QA_SUMMARY.json.'
        values[f'Resumo_atualizacao_RevisaWiki_{STEM}.txt'] = 'Correção do mínimo de oito itens para colunas de listas finais no RevisaWiki 2.21.1.'
        values[f'Resumo_documentacao_RevisaWiki_{STEM}.txt'] = 'Atualização da documentação do RevisaWiki 2.21.1, com o mínimo de oito itens nas listas finais e preservação das regras de referências.'
        values['LEIA_PRIMEIRO.txt'] = 'RevisaWiki 2.21.1\n\nComece por dist/2.21.1/INDICE.md. Atualize dados, programa, carregador central e documentação, nessa ordem. Quem já usa a chamada fixa mantém o common.js. A instalação e a publicação na Wikipédia permanecem manuais.'
        values[f'Referencia_tecnica_RevisaWiki_{STEM}.txt'] = 'RevisaWiki 2.21.1\n\nReconstrução: python3 scripts/build_v2211.py\nManifesto: tests/expected_release_v2211.json\nBase imutável: tests/expected_release_v2210.json\nCobertura: tests/evidence/2.21.1/COVERAGE.json\nTestes: tests/v2211/README.md\n\nA atualização parte dos sete arquivos da versão 2.21.0 e preserva o catálogo. A prova de reversão deve recuperar os arquivos de origem ao desfazer a correção delimitada e a identificação da versão. O prazo por cálculo permanece em 60.000 ms, incluindo a conferência final e a serialização. Recusas e falhas preservam o rascunho.'
        values['Funcionalidades_RevisaWiki_2_21_1.md'] = '# RevisaWiki 2.21.1: funcionalidades e limites\n\n' + '\n'.join('- ' + item for item in FEATURES) + '\n\nAs classificações abaixo são herdadas da 2.21.0, com a regra de colunas atualizada em STR-COMP-01. Isso não é uma contagem de novas execuções nem de correções em artigos.\n\n' + '\n'.join('- `' + row['id'] + '`: ' + row['disposition'] + '. ' + row['summary'] for row in coverage['items'])
        return {name: (text.rstrip() + '\n').encode('utf-8') for name, text in values.items()}

    def demonstration(self, output, qa, preview):
        fixture = self.shared.captured(self.root, 'tests/v221/demo_examples.json')
        if fixture['pin']['sha256'] != DEMO_FIXTURE_SHA256 or len(json.loads(fixture['raw'])) != DEMO_EXAMPLES:
            raise ValueError('The frozen demonstration examples changed')
        sentinel = object()
        previous = sys.modules.get('v221_delivery', sentinel)
        sys.modules['v221_delivery'] = self.shared
        try:
            path = ROOT / 'scripts/build_demo_v2210.py'
            source = path.read_text()
            before = "text = record['raw'].decode('utf-8').replace('2.19.0', VERSION).replace('_v2_19_0', '_' + STEM)"
            after = "text = record['raw'].decode('utf-8').replace('2.21.0', VERSION).replace('_v2_21_0', '_' + STEM)"
            source = one(source, before, after)
            spec = importlib.util.spec_from_file_location('_v2211_demo_builder', path)
            demo = importlib.util.module_from_spec(spec)
            exec(compile(source, str(path), 'exec'), demo.__dict__)
        finally:
            if previous is sentinel:
                del sys.modules['v221_delivery']
            else:
                sys.modules['v221_delivery'] = previous
        collected, inputs = {}, []
        def collect(destination, payloads, records):
            if Path(destination) != Path(output):
                raise ValueError('Unexpected demonstration destination')
            collected.update(payloads)
            inputs.extend(records)
        demo.commit_payloads = collect
        result = demo.build_demo(output, manifest_path=self.root / 'tests/expected_release_v2211.json',
                                 qa_path=self.qa_path, preview=preview)
        if qa is not None and (result['fixtureSha256'] != qa.get('demonstrationFixtureSha256') or result['examples'] != qa.get('demonstrationExamples')):
            raise ValueError('The demonstration examples do not match the QA')
        return collected, inputs, result

    def payload_rows(self):
        summary = 'Atualização do RevisaWiki para a versão 2.21.1.'
        return [('Dados', f'RevisaWiki_{STEM}_dados.js', OWNER + '/RevisaWiki/Dados.js', summary),
                ('Programa', f'RevisaWiki_{STEM}.js', OWNER + '/RevisaWiki.js', summary),
                ('Carregador central', f'Carregador_comunitario_RevisaWiki_{STEM}.js', OWNER + '/RevisaWiki/Carregador.js', summary),
                ('Documentação', f'Documentacao_RevisaWiki_{STEM}.wiki', OWNER + '/RevisaWiki', 'Atualização da documentação do RevisaWiki 2.21.1.'),
                ('Primeira instalação compartilhada', FIXED_CALLS[0], 'Especial:Minha página/common.js', 'Instalação da chamada fixa do RevisaWiki.'),
                ('Carregador para cópia própria', f'Carregador_common_js_RevisaWiki_{STEM}.js', 'Sua página RevisaWiki/Carregador.js', summary),
                ('Primeira instalação da cópia própria', FIXED_CALLS[1], 'Especial:Minha página/common.js', 'Instalação da chamada fixa do RevisaWiki.')]

    def package(self, manifest, qa, docs, coverage, demonstration):
        s = self.shared
        data = {name: s.safe_file(self.dist, name).read_bytes() for name in manifest['files']}
        data.update(docs)
        data.update({'LICENSE': s.safe_file(self.root, 'LICENSE').read_bytes(), 'QA_SUMMARY.json': qa.records[0]['raw'], 'COVERAGE.json': json_bytes(coverage), f'Demonstracao_RevisaWiki_{STEM}.html': demonstration[f'Demonstracao_RevisaWiki_{STEM}.html']})
        rows = [{'label': label, 'file': name, 'destination': destination, 'editSummary': summary,
                 'bytes': len(data[name]), 'sha256': sha(data[name])} for label, name, destination, summary in self.payload_rows()]
        lines = ['# RevisaWiki 2.21.1: índice para copiar e colar', '',
                 'Atualize dados, programa, carregador central e documentação, nessa ordem. Copie os arquivos completos. A publicação na Wikipédia continua manual.', '',
                 'Quem já usa a chamada fixa mantém o common.js como está.', '',
                 'Listas simples das seções finais recebem duas colunas a partir de oito itens do nível principal. As regras de colunas de referências permanecem inalteradas.', '',
                 '| Ordem | Arquivo completo | Destino | Resumo da edição |', '| --- | --- | --- | --- |']
        for index, row in enumerate(rows, 1):
            lines.append(f'| {index}. {row["label"]} | [{row["file"]}]({row["file"]}) | `{row["destination"]}` | {row["editSummary"]} |')
        lines += ['', f'[Instalação](Instalacao_RevisaWiki_{STEM}.txt) · [Manual](Documentacao_RevisaWiki_{STEM}.wiki) · [Testes e limites](Relatorio_testes_RevisaWiki_{STEM}.txt) · [Demonstração local](Demonstracao_RevisaWiki_{STEM}.html)', '',
                  'Baixe o HTML da demonstração e abra-o localmente. O GitHub mostra o código dos arquivos HTML.', '',
                  'O motor completo serve para uso local e testes, pois ultrapassa o limite de uma página da Wikipédia. Instale os arquivos separados de dados e programa.', '']
        data['INDICE.md'] = '\n'.join(lines).encode('utf-8')
        pin = lambda raw: {'bytes': len(raw), 'sha256': sha(raw)}
        public = {'version': VERSION, 'distributionRevision': VERSION, 'files': {name: pin(raw) for name, raw in sorted(data.items())}, 'qaSummarySha256': qa.records[0]['pin']['sha256'], 'wikipediaWrites': 0}
        data['ARQUIVOS.json'] = json_bytes(public)
        delivery = {'version': VERSION, 'releaseGatesPassed': True, 'wikipediaWrites': 0,
                    'runtimeManifestSha256': manifest.records[0]['pin']['sha256'], 'qaSha256': qa.records[0]['pin']['sha256'],
                    'copyPayloads': rows, 'files': {name: pin(raw) for name, raw in sorted(data.items())}}
        data['MANIFESTO.json'] = json_bytes(delivery)
        archive = io.BytesIO()
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as target:
            for name, raw in sorted(data.items()):
                entry = zipfile.ZipInfo(name, (2026, 10, 25, 0, 0, 0))
                entry.compress_type, entry.external_attr = zipfile.ZIP_DEFLATED, 0o100644 << 16
                target.writestr(entry, raw, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        with zipfile.ZipFile(io.BytesIO(archive.getvalue())) as zipped:
            if len(zipped.namelist()) != len(data) or zipped.testzip() is not None or any(zipped.read(name) != raw for name, raw in data.items()):
                raise ValueError('The archive does not contain the exact delivery bytes')
        data['RevisaWiki_2.21.1.zip'] = archive.getvalue()
        return data, delivery

    def build(self, preview=None, validation=None):
        s = self.shared
        manifest = self.manifest()
        records = s.records_of(manifest)
        records += [s.record_path(Path(__file__)), s.record_path(ROOT / 'scripts/v221_delivery.py'), s.record_path(ROOT / 'scripts/build_demo_v2210.py'), s.captured(self.root, 'LICENSE')]
        if preview is None:
            if validation is not None:
                raise ValueError('A validation override is only allowed in a separate preview')
            qa = self.qa(manifest)
            records += s.records_of(qa)
            output, docs_output = self.dist, self.docs
        else:
            output = Path(preview).resolve()
            if output == self.dist.resolve() or output == self.docs.resolve() or self.dist.resolve() in output.parents or self.docs.resolve() in output.parents or validation is None:
                raise ValueError('A preview requires separate output and explicit draft validation')
            record = s.record_path(validation)
            records.append(record)
            qa = json.loads(record['raw'])
            if qa.get('version') != VERSION:
                raise ValueError('The preview validation has a different version')
            docs_output = output / 'docs'
        previous, prior_coverage, prior_records = self.prior_inputs()
        records += prior_records
        coverage = self.coverage(prior_coverage, manifest)
        docs = self.documents(previous, coverage, qa)
        for name, raw in docs.items():
            s.checked_text_bytes(raw, name)
        demo, demo_records, demo_result = self.demonstration(output, qa if preview is None else None, preview is not None)
        records += demo_records
        if preview is None:
            package, delivery = self.package(manifest, qa, docs, coverage, demo)
            extra_demo = {name: raw for name, raw in demo.items() if name.startswith('Demonstracao/')}
            package.update(extra_demo)
            destinations = [(self.docs, docs), (self.dist, package), (self.qa_path.parent, {'COVERAGE.json': json_bytes(coverage)})]
        else:
            destinations = [(docs_output, docs), (output, {**demo, 'COVERAGE.json': json_bytes(coverage)})]
        for destination, payloads in destinations:
            s.output_preflight(destination, payloads)
        s.verify_records(records)
        for destination, payloads in destinations:
            s.commit_payloads(destination, payloads, records)
        return {'version': VERSION, 'preview': preview is not None, 'documents': len(docs),
                'demonstration': demo_result, 'runtimeManifestSha256': manifest.records[0]['pin']['sha256'],
                'archiveSha256': sha(package['RevisaWiki_2.21.1.zip']) if preview is None else None,
                'wikipediaWrites': 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preview', type=Path)
    parser.add_argument('--validation', type=Path)
    args = parser.parse_args()
    print(json.dumps(Delivery().build(args.preview, args.validation), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
