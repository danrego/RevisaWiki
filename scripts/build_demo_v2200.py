"""Build the offline demonstration with the exact distributed engine bytes."""
from pathlib import Path
import argparse
import base64
import json
import shutil

from v220_delivery import ROOT, VERSION, STEM, DIST, checked_manifest, checked_qa, sha, write_json


def build_demo(output, examples_path=None, manifest_path=None, qa_path=None, preview=False):
    output = output.resolve()
    if preview and output == DIST.resolve():
        raise ValueError('A demonstration preview must use a separate output directory')
    manifest = checked_manifest(manifest_path)
    qa = None if preview else checked_qa(manifest, qa_path)
    examples_path = examples_path or ROOT / 'tests/v220/demo_examples.json'
    examples = json.loads(examples_path.read_text(encoding='utf-8'))
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
    if qa is not None and (qa.get('demonstrationFixtureSha256') != sha(examples_path.read_bytes()) or
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
    output.mkdir(parents=True, exist_ok=True)
    destination = output / 'Demonstracao'
    destination.mkdir(exist_ok=True)
    source_names = {'DEMONSTRACAO.html', 'demonstracao.css', 'demonstracao.js', 'motor.js'}
    for name in source_names:
        source = ROOT / 'src/demo' / name
        if source.is_symlink() or not source.is_file():
            raise ValueError('Missing public demonstration helper')
        text = source.read_text(encoding='utf-8').replace('2.19.0', VERSION).replace('_v2_19_0', '_' + STEM)
        (destination / name).write_text(text, encoding='utf-8')
    engine_name = f'RevisaWiki_{STEM}_completo.js'
    engine_raw = (DIST / engine_name).read_bytes()
    if sha(engine_raw) != manifest['files'][engine_name]['sha256']:
        raise ValueError('The demonstration engine changed after manifest verification')
    if (DIST / engine_name).resolve() != (output / engine_name).resolve():
        shutil.copyfile(DIST / engine_name, output / engine_name)
    book = {
        'version': VERSION, 'engineSha256': sha(engine_raw),
        'fixtureSha256': sha(examples_path.read_bytes()), 'offline': True,
        'externalConfirmationAvailable': False, 'examples': examples,
    }
    write_json(destination / 'exemplos.json', book)
    page = (destination / 'DEMONSTRACAO.html').read_text(encoding='utf-8')
    introduction = 'A demonstração usa o mesmo motor do programa distribuído e funciona sem acessar sua conta na Wikipédia.'
    replacement = ('A demonstração usa o mesmo motor do programa distribuído e funciona sem acessar sua conta na Wikipédia. '
                   'Os exemplos são fixos e não fazem as consultas externas necessárias para algumas confirmações em artigos reais.')
    if page.count(introduction) != 1:
        raise ValueError('The demonstration introduction changed and needs review')
    page = page.replace(introduction, replacement)
    (destination / 'DEMONSTRACAO.html').write_text(page, encoding='utf-8')
    nonce = sha((book['engineSha256'] + 'demo').encode('utf-8'))[:24]
    original_policy = "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    portable_policy = f"default-src 'none'; script-src 'nonce-{nonce}'; worker-src blob:; style-src 'nonce-{nonce}'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    if page.count(original_policy) != 1:
        raise ValueError('The local demonstration CSP changed and needs review')
    page = page.replace(original_policy, portable_policy)
    css_anchor = '<link rel="stylesheet" href="demonstracao.css">'
    if page.count(css_anchor) != 1:
        raise ValueError('The demonstration stylesheet anchor changed')
    page = page.replace(css_anchor, f'<style nonce="{nonce}">' + (destination / 'demonstracao.css').read_text(encoding='utf-8') + '</style>')

    def inert(identifier, value):
        encoded = json.dumps(value, ensure_ascii=True).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
        return f'<script type="application/json" id="{identifier}">{encoded}</script>\n'

    adapter = (destination / 'motor.js').read_text(encoding='utf-8')
    include = f"importScripts('../{engine_name}');"
    if adapter.count(include) != 1:
        raise ValueError('The worker engine include changed and needs review')
    adapter = adapter.replace(include, '// The exact release engine is already present above.')
    javascript = (destination / 'demonstracao.js').read_text(encoding='utf-8')
    if '</script' in javascript.lower():
        raise ValueError('The portable script requires safe embedded-script handling')
    data = inert('demo-book', book) + inert('demo-engine', base64.b64encode(engine_raw).decode('ascii')) + inert('demo-worker', adapter)
    js_anchor = '<script src="demonstracao.js"></script>'
    if page.count(js_anchor) != 1:
        raise ValueError('The demonstration script anchor changed')
    page = page.replace(js_anchor, data + f'<script nonce="{nonce}">' + javascript + '</script>')
    page = page.replace('href="../INICIO.html"', 'href="INICIO.html"')
    portable_name = f'Demonstracao_RevisaWiki_{STEM}.html'
    (output / portable_name).write_text(page, encoding='utf-8')
    if sha((DIST / engine_name).read_bytes()) != book['engineSha256']:
        raise ValueError('The release engine changed during demonstration packaging')
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
