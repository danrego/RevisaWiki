"""Build the offline demonstration with the exact distributed engine bytes."""
from pathlib import Path
import argparse
import base64
import json
from v221_delivery import ROOT, ReleaseRecord, sha, captured, record_path, records_of, commit_payloads
VERSION='2.21.3'
STEM='v2_21_3'
DIST=ROOT/'dist'/VERSION

def checked_manifest(path=None):
    item=record_path(path or ROOT/'tests/expected_release_v2213.json')
    value=json.loads(item['raw'])
    if value.get('version')!=VERSION:raise ValueError('Wrong demonstration runtime')
    records=[item]
    for name,pin in value['files'].items():records.append(captured(DIST,name,pin))
    return ReleaseRecord(value,records)

def checked_qa(manifest,path=None):
    item=record_path(path or ROOT/'tests/evidence/2.21.3/QA_SUMMARY.json')
    value=json.loads(item['raw'])
    if value.get('releaseGatesPassed')is not True or value.get('runtimeManifestSha256')!=sha(manifest.records[0]['raw']):
        raise ValueError('The demonstration requires exact-version passing QA')
    return ReleaseRecord(value,[item])


def build_demo(output, examples_path=None, manifest_path=None, qa_path=None, preview=False):
    output = Path(output)
    if preview and output.resolve() == DIST.resolve():
        raise ValueError('A demonstration preview must use a separate output directory')
    manifest = checked_manifest(manifest_path)
    qa = None if preview else checked_qa(manifest, qa_path)
    records = records_of(manifest, qa)
    examples_path = examples_path or ROOT / 'tests/v2213/demo_examples.json'
    examples_record = record_path(examples_path)
    records.append(examples_record)
    examples = json.loads(examples_record['raw'])
    if not isinstance(examples, list) or not examples:
        raise ValueError('A nonempty list of public demonstration fixtures is required')
    for item in examples:
        if not isinstance(item, dict):
            raise ValueError('Each demonstration fixture must be an object')
        if any(not isinstance(item.get(field), str) or not item[field].strip()
               for field in ('id', 'family', 'title', 'explanation')):
            raise ValueError('Each demonstration needs a nonempty identifier, family, title and explanation')
    if len({item['id'] for item in examples}) != len(examples):
        raise ValueError('Demonstration identifiers must be unique')
    if qa is not None and (qa.get('demonstrationFixtureSha256') != examples_record['pin']['sha256'] or
                           qa.get('demonstrationExamples') != len(examples)):
        raise ValueError('The final QA is not bound to this set of demonstration examples')
    for item in examples:
        if not isinstance(item.get('source'), str) or not isinstance(item.get('expected'), str):
            raise ValueError('A demonstration source or expected endpoint is missing')
        if len(item['source']) > 2_200 or len(item['expected']) > 2_600:
            raise ValueError('A demonstration is too long for the bounded example viewer')
        if item.get('operation', 'adjust') not in {'adjust', 'talkHeader'}:
            raise ValueError('Unsupported demonstration operation')
        options = item.get('options')
        if not isinstance(options, dict) or options.get('autoPreview') is not False or options.get('registryDoiCheck') is not False:
            raise ValueError('Offline examples must explicitly disable online previews and DOI requests')
    payloads = {}
    source_names = {'DEMONSTRACAO.html', 'demonstracao.css', 'demonstracao.js', 'motor.js'}
    for name in source_names:
        record = captured(ROOT, 'src/demo_v221/' + name)
        records.append(record)
        text = record['raw'].decode('utf-8').replace('2.19.0', VERSION).replace('2.21.0', VERSION).replace('_v2_19_0', '_' + STEM).replace('_v2_21_0', '_' + STEM)
        payloads['Demonstracao/' + name] = text.encode('utf-8')
    engine_name = f'RevisaWiki_{STEM}_completo.js'
    engine_record = captured(DIST, engine_name, manifest['files'][engine_name])
    records.append(engine_record)
    engine_raw = engine_record['raw']
    if (DIST / engine_name).resolve() != (output / engine_name).resolve():
        payloads[engine_name] = engine_raw
    book = {
        'version': VERSION, 'engineSha256': sha(engine_raw),
        'fixtureSha256': examples_record['pin']['sha256'], 'offline': True,
        'externalConfirmationAvailable': False, 'examples': examples,
    }
    payloads['Demonstracao/exemplos.json'] = (json.dumps(book, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    page = payloads['Demonstracao/DEMONSTRACAO.html'].decode('utf-8')
    introduction = 'A demonstração usa o mesmo motor do programa distribuído e funciona sem acessar sua conta na Wikipédia.'
    replacement = ('A demonstração usa o mesmo motor do programa distribuído e funciona sem acessar sua conta na Wikipédia. '
                   'Os exemplos são fixos e não fazem as consultas externas necessárias para algumas confirmações em artigos reais.')
    if page.count(introduction) != 1:
        raise ValueError('The demonstration introduction changed and needs review')
    page = page.replace(introduction, replacement)
    payloads['Demonstracao/DEMONSTRACAO.html'] = page.encode('utf-8')
    nonce = sha((book['engineSha256'] + 'demo').encode('utf-8'))[:24]
    original_policy = "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    portable_policy = f"default-src 'none'; script-src 'nonce-{nonce}'; worker-src blob:; style-src 'nonce-{nonce}'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    if page.count(original_policy) != 1:
        raise ValueError('The local demonstration CSP changed and needs review')
    page = page.replace(original_policy, portable_policy)
    css_anchor = '<link rel="stylesheet" href="demonstracao.css">'
    if page.count(css_anchor) != 1:
        raise ValueError('The demonstration stylesheet anchor changed')
    page = page.replace(css_anchor, f'<style nonce="{nonce}">' + payloads['Demonstracao/demonstracao.css'].decode('utf-8') + '</style>')

    def inert(identifier, value):
        encoded = json.dumps(value, ensure_ascii=True).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
        return f'<script type="application/json" id="{identifier}">{encoded}</script>\n'

    adapter = payloads['Demonstracao/motor.js'].decode('utf-8')
    include = f"importScripts('../{engine_name}');"
    if adapter.count(include) != 1:
        raise ValueError('The worker engine include changed and needs review')
    adapter = adapter.replace(include, '// The exact release engine is already present above.')
    javascript = payloads['Demonstracao/demonstracao.js'].decode('utf-8')
    if '</script' in javascript.lower():
        raise ValueError('The portable script requires safe embedded-script handling')
    data = inert('demo-book', book) + inert('demo-engine', base64.b64encode(engine_raw).decode('ascii')) + inert('demo-worker', adapter)
    js_anchor = '<script src="demonstracao.js"></script>'
    if page.count(js_anchor) != 1:
        raise ValueError('The demonstration script anchor changed')
    page = page.replace(js_anchor, data + f'<script nonce="{nonce}">' + javascript + '</script>')
    page = page.replace('href="../INICIO.html"', 'href="INDICE.md"')
    portable_name = f'Demonstracao_RevisaWiki_{STEM}.html'
    portable_raw = page.encode('utf-8')
    if qa is not None and qa.get('demonstrationPortableSha256') != sha(portable_raw):
        raise ValueError('The generated offline demonstration differs from final QA')
    payloads[portable_name] = portable_raw
    commit_payloads(output, payloads, records)
    return {'version': VERSION, 'examples': len(examples), 'fixtureSha256': book['fixtureSha256'],
            'engineSha256': book['engineSha256'], 'engineModified': False,
            'portableFile': portable_name, 'portableSha256': sha(page.encode('utf-8')),
            'offline': True, 'wikipediaWrites': 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DIST)
    parser.add_argument('--examples', type=Path)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--qa', type=Path)
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build_demo(args.output, args.examples, args.manifest, args.qa, args.preview), ensure_ascii=False))


if __name__ == '__main__':
    main()
