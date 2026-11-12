"""Read-only final-package review, independent of the delivery builder.

No JavaScript is evaluated, no archive member is extracted, and no network
request or Wikipedia action is issued. Only an explicitly requested receipt
is written. Existing failure records and prior releases remain untouched.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import zipfile

VERSION = '2.21.7'
STEM = 'v2_21_7'
ROOT = Path(__file__).resolve().parents[2]


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def pin(raw):
    return {'bytes': len(raw), 'sha256': digest(raw)}


class Review:
    def __init__(self, root, docs_pst=None, baseline='v2.21.6', docs_pst_response=None):
        self.root = root
        self.dist = root / 'dist' / VERSION
        self.docs_pst = docs_pst
        self.baseline = baseline
        self.docs_pst_response = docs_pst_response
        self.rows = []

    def check(self, condition, code):
        self.rows.append({'id': code, 'passed': bool(condition)})
        if not condition:
            raise ValueError(code)

    def load(self, path):
        return json.loads(path.read_bytes())

    def run(self):
        expected_path = self.root / 'tests/expected_release_v2217.json'
        expected_raw = expected_path.read_bytes()
        expected = json.loads(expected_raw)
        self.check(expected['version'] == VERSION, 'version')
        self.check(expected['limits']['calculationDeadlineMilliseconds'] is None and
                   expected['limits']['fixedAnalysisDeadline'] is False, 'no-fixed-analysis-deadline')
        files = expected['files']
        self.check(len(files) == 7, 'seven-runtime-inputs')
        for name, recorded in files.items():
            self.check(pin((self.dist / name).read_bytes()) == recorded, 'runtime-pin-' + name)
        for name, recorded in expected['sourceInputs'].items():
            path = PurePosixPath(name)
            self.check(not path.is_absolute() and '..' not in path.parts, 'safe-source-path-' + name)
            self.check(pin((self.root / name).read_bytes()) == recorded, 'source-pin-' + name)
        self.check((self.dist / 'MANIFESTO_RUNTIME.json').read_bytes() == expected_raw,
                   'runtime-manifest-byte-equality')
        previous_raw = (self.root / 'tests/expected_release_v2216.json').read_bytes()
        self.check(expected['baseManifestSha256'] == digest(previous_raw), 'prior-runtime-pin')
        archive_path = self.dist / ('RevisaWiki_' + VERSION + '.zip')
        with zipfile.ZipFile(archive_path) as archive:
            self.check(archive.testzip() is None, 'zip-crc')
            names = archive.namelist()
            self.check(len(names) == len(set(names)), 'zip-no-duplicate-members')
            self.check(all(not PurePosixPath(name).is_absolute() and
                           '..' not in PurePosixPath(name).parts for name in names), 'zip-safe-member-names')
            delivery_raw = archive.read('MANIFESTO.json')
            delivery = json.loads(delivery_raw)
            self.check(delivery['version'] == VERSION and delivery['releaseGatesPassed'] is True,
                       'package-release-status')
            self.check(delivery['runtimeManifestSha256'] == digest(expected_raw), 'package-runtime-binding')
            self.check(set(names) == set(delivery['files']) | {'MANIFESTO.json'}, 'zip-complete-member-inventory')
            self.check(delivery_raw == (self.dist / 'MANIFESTO.json').read_bytes(), 'package-manifest-local-equality')
            for name, recorded in delivery['files'].items():
                raw = archive.read(name)
                self.check(pin(raw) == recorded, 'zip-pin-' + name)
                self.check(raw == (self.dist / name).read_bytes(), 'zip-local-byte-equality-' + name)
            inventory = json.loads(archive.read('ARQUIVOS.json'))
            self.check(inventory['version'] == VERSION, 'inventory-version')
            for name, recorded in inventory['files'].items():
                self.check(pin(archive.read(name)) == recorded, 'inventory-pin-' + name)
            qa_raw = archive.read('QA_SUMMARY.json')
            qa = json.loads(qa_raw)
            self.check(delivery['qaSha256'] == digest(qa_raw), 'qa-package-binding')
            self.check(qa['runtimeManifestSha256'] == digest(expected_raw) and
                       qa['frozenFiles'] == files and qa['sourceInputs'] == expected['sourceInputs'],
                       'qa-source-and-runtime-binding')
            self.check(qa['releaseGatesPassed'] is True and qa['unresolvedIncorrectWrites'] == 0 and
                       qa['wikipediaWrites'] == 0, 'qa-integrity-and-no-wiki-writes')
            for name, recorded in qa['evidencePins'].items():
                self.check(pin((self.root / name).read_bytes()) == recorded, 'qa-evidence-pin-' + name)
            for name, recorded in qa['documentationInputs'].items():
                raw = archive.read(name)
                self.check(pin(raw) == recorded and raw == (self.root / 'docs' / VERSION / name).read_bytes(),
                           'documentation-source-equality-' + name)
            payloads = delivery['copyPayloads']
            expected_names = [f'RevisaWiki_{STEM}_dados.js', f'RevisaWiki_{STEM}.js',
                              f'Carregador_comunitario_RevisaWiki_{STEM}.js',
                              f'Documentacao_RevisaWiki_{STEM}.wiki',
                              'Chamada_fixa_RevisaWiki_common.js',
                              f'Carregador_common_js_RevisaWiki_{STEM}.js',
                              'Chamada_fixa_RevisaWiki_copia_propria.js']
            prefix = 'Usuário:Daniel G Rego/RevisaWiki'
            expected_destinations = [prefix + '/Dados.js', prefix + '.js', prefix + '/Carregador.js',
                                     prefix, 'Especial:Minha página/common.js',
                                     'Sua página RevisaWiki/Carregador.js', 'Especial:Minha página/common.js']
            self.check(len(payloads) == 7 and [r['file'] for r in payloads] == expected_names,
                       'seven-copy-payloads-in-installation-order')
            self.check([r['destination'] for r in payloads] == expected_destinations,
                       'seven-exact-destinations-in-order')
            index = archive.read('INDICE.md').decode('utf8')
            position = -1
            for i, row in enumerate(payloads, 1):
                raw = archive.read(row['file'])
                self.check(pin(raw) == {k: row[k] for k in ['bytes', 'sha256']}, 'copy-payload-pin-' + str(i))
                needle = f'| {i}. {row["label"]} |'
                next_position = index.find(needle)
                self.check(next_position > position, 'copy-index-row-' + str(i))
                position = next_position
                self.check(row['destination'] in index and row['editSummary'] in index,
                           'copy-index-destination-and-summary-' + str(i))
            doc_name = f'Documentacao_RevisaWiki_{STEM}.wiki'
            doc_raw = archive.read(doc_name)
            self.check(b'{{VALIDACAO_RELEASE}}' not in doc_raw, 'no-unresolved-documentation-token')
            old = (self.root / 'docs/2.21.6/Documentacao_RevisaWiki_v2_21_6.wiki').read_text().split(
                '== Histórico das versões ==\n', 1)[1]
            current_history = doc_raw.decode('utf8').split('== Histórico das versões ==\n', 1)[1]
            import re
            headings=lambda value:re.findall(r'^=== ([^=]+) ===$',value,re.M)
            self.check(headings(current_history)==[VERSION]+headings(old), 'historical-release-identities-preserved-in-order')
            for name in ['Chamada_fixa_RevisaWiki_common.js', 'Chamada_fixa_RevisaWiki_copia_propria.js']:
                self.check(archive.read(name) == (self.root / 'dist/2.21.6' / name).read_bytes(),
                           'fixed-loader-call-preserved-' + name)
            presave = json.loads(archive.read('PRESAVE_ROUNDTRIP.json'))
            self.check(presave['status'] == 'passed' and presave['runtimeManifestSha256'] == digest(expected_raw),
                       'native-data-presave-binding')
            self.check(presave['decodedDataPreserved'] is True and presave['expectedCataloguePreserved'] is True and
                       presave['sourcePreservedExceptTerminalNewline'] is True and presave['wikipediaWrites'] == 0,
                       'native-data-presave-preservation')
            data_raw = archive.read(expected_names[0])
            self.check({k: presave['inputData'][k] for k in ['bytes', 'sha256']} == pin(data_raw),
                       'native-data-presave-input-bytes')
            self.check(presave['afterPresaveData'] == pin(data_raw.rstrip(b'\n')),
                       'native-data-presave-terminal-newline-only')
            self.check(self.docs_pst is not None and self.docs_pst.is_file(), 'native-documentation-presave-required')
            receipt = self.load(self.docs_pst)
            if receipt.get('kind') == 'full-documentation-native-presave-source-rebinding':
                self.check(receipt.get('reuseExplicitlyAuthorized') is True and receipt.get('freshProductionPSTRequests') == 0,
                           'native-documentation-presave-reuse-qualification')
                reused = receipt.get('reusedCertificate', {})
                reused_path = PurePosixPath(reused.get('file', ''))
                self.check(bool(reused.get('file')) and not reused_path.is_absolute() and '..' not in reused_path.parts,
                           'native-documentation-presave-original-safe-path')
                original_raw = (self.root / str(reused_path)).read_bytes()
                self.check(pin(original_raw) == {k: reused.get(k) for k in ['bytes', 'sha256']},
                           'native-documentation-presave-original-pin')
                original = json.loads(original_raw)
                self.check(original.get('status') == 'passed' and original.get('records') == receipt.get('records') and
                           original.get('response') == receipt.get('response'),
                           'native-documentation-presave-original-exact-source-binding')
            self.check(receipt.get('status') == 'passed' and receipt.get('wikipediaWrites') == 0 and
                       receipt.get('version') == VERSION and receipt.get('runtimeManifestSha256') == digest(expected_raw),
                       'native-documentation-presave-status')
            records = receipt.get('records', [receipt])
            matching = [r for r in records if r.get('file') == doc_name]
            self.check(len(matching) == 1, 'native-documentation-presave-record')
            record = matching[0]
            self.check(record.get('source') == pin(doc_raw), 'native-documentation-presave-input-pin')
            self.check(record.get('passed') is True and record.get('after') in [pin(doc_raw), pin(doc_raw.rstrip(b'\n'))],
                       'native-documentation-presave-byte-equality')
            self.check(self.docs_pst_response is not None and self.docs_pst_response.is_file(),
                       'native-documentation-presave-raw-response-required')
            response_raw = self.docs_pst_response.read_bytes()
            response = json.loads(response_raw)
            self.check('error' not in response and isinstance(response.get('parse'), dict),
                       'native-documentation-presave-response-shape')
            self.check(receipt.get('authoritativeOutputProperty') == 'parse.text', 'native-documentation-presave-authoritative-property')
            returned = response['parse'].get('text')
            if isinstance(returned, dict):
                returned = returned.get('*')
            self.check(isinstance(returned, str), 'native-documentation-presave-returned-text')
            returned_raw = returned.encode('utf8')
            self.check(returned_raw in [doc_raw, doc_raw.rstrip(b'\n')] and pin(returned_raw) == record.get('after'),
                       'native-documentation-presave-extracted-byte-equality')
            response_pin = record.get('responseSha256') or receipt.get('responseSha256') or receipt.get('response', {}).get('sha256')
            self.check(response_pin == digest(response_raw), 'native-documentation-presave-raw-response-binding')
            if isinstance(receipt.get('response'), dict):
                self.check(receipt['response'] == pin(response_raw), 'native-documentation-presave-raw-response-byte-pin')
        changed = subprocess.check_output(['git', 'diff', '--name-status', '--no-renames', self.baseline, '--',
                                          'src', 'docs', 'dist', 'tests'], cwd=self.root, text=True)
        prior_changes = []
        for line in changed.splitlines():
            status, name = line.split('\t', 1)
            exists = subprocess.run(['git', 'cat-file', '-e', self.baseline + ':' + name], cwd=self.root,
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
            if exists:
                prior_changes.append({'status': status, 'fileSha256': digest(name.encode())})
        self.check(not prior_changes, 'all-tracked-prior-release-files-preserved')
        return {'schemaVersion': 1, 'version': VERSION, 'status': 'passed', 'checks': len(self.rows),
                'runtimeManifestSha256': digest(expected_raw), 'archiveSha256': digest(archive_path.read_bytes()),
                'copyPayloads': 7, 'priorFilesBaseline': self.baseline, 'wikipediaWrites': 0,
                'networkRequests': 0, 'results': self.rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--docs-pst', type=Path)
    parser.add_argument('--docs-pst-response', type=Path)
    parser.add_argument('--baseline-ref', default='v2.21.6')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    review = Review(args.root.resolve(), args.docs_pst, args.baseline_ref, args.docs_pst_response)
    try:
        result = review.run()
    except Exception as error:
        result = {'schemaVersion': 1, 'version': VERSION, 'status': 'failed', 'checks': len(review.rows),
                  'failureCode': str(error) if isinstance(error, ValueError) else type(error).__name__,
                  'wikipediaWrites': 0, 'networkRequests': 0, 'results': review.rows}
    text = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.write_text(text)
    print(text, end='')
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
