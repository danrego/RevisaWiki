"""Package the demonstration separately from the unchanged release engine."""
from pathlib import Path
import argparse
import base64
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--examples', type=Path, default=ROOT / 'tests/v219/demo_examples.json')
    args = parser.parse_args()
    examples = json.loads(args.examples.read_text())
    assert isinstance(examples, list) and examples
    assert len({row['id'] for row in examples}) == len(examples)
    for row in examples:
        assert isinstance(row['source'], str) and isinstance(row['expected'], str)
        assert len(row['source']) <= 2200 and len(row['expected']) <= 2600
        assert row.get('operation', 'adjust') in ('adjust', 'talkHeader')
    destination = ROOT / 'dist/2.19.0/Demonstracao'
    destination.mkdir(exist_ok=True)
    for source in (ROOT / 'src/demo').iterdir():
        assert source.is_file() and not source.is_symlink()
        shutil.copyfile(source, destination / source.name)
    engine = ROOT / 'dist/2.19.0/RevisaWiki_v2_19_0_completo.js'
    book = {'version': '2.19.0', 'engineSha256': hashlib.sha256(engine.read_bytes()).hexdigest(), 'examples': examples}
    (destination / 'exemplos.json').write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n')
    # The portable page embeds the exact distributed engine as inert data.
    # It can run from file:// without fetching a script, account or API.
    nonce = hashlib.sha256((book['engineSha256'] + 'demo').encode()).hexdigest()[:24]
    page = (destination / 'DEMONSTRACAO.html').read_text()
    original_policy = "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    portable_policy = f"default-src 'none'; script-src 'nonce-{nonce}'; worker-src blob:; style-src 'nonce-{nonce}'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    assert page.count(original_policy) == 1
    page = page.replace(original_policy, portable_policy)
    page = page.replace('<link rel="stylesheet" href="demonstracao.css">', '<style nonce="' + nonce + '">' + (destination / 'demonstracao.css').read_text() + '</style>')
    def data_tag(identifier, value):
        text = json.dumps(value, ensure_ascii=True).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
        return '<script type="application/json" id="' + identifier + '">' + text + '</script>\n'
    adapter = (destination / 'motor.js').read_text()
    include = "importScripts('../RevisaWiki_v2_19_0_completo.js');"
    assert adapter.count(include) == 1
    adapter = adapter.replace(include, '// The unmodified release engine is already present above.')
    inert = data_tag('demo-book', book) + data_tag('demo-engine', base64.b64encode(engine.read_bytes()).decode()) + data_tag('demo-worker', adapter)
    javascript = (destination / 'demonstracao.js').read_text()
    assert '</script' not in javascript.lower()
    page = page.replace('<script src="demonstracao.js"></script>', inert + '<script nonce="' + nonce + '">' + javascript + '</script>')
    page = page.replace('href="../INICIO.html"', 'href="INICIO.html"')
    portable = destination.parent / 'Demonstracao_RevisaWiki_v2_19_0.html'
    portable.write_text(page)
    print(json.dumps({'examples': len(examples), 'engineSha256': book['engineSha256'], 'engineModified': False}))


if __name__ == '__main__':
    main()
