"""Build the isolated discussion-header beta from the published 2.18 files."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.19.0-beta.1'
SLUG = 'v2_19_0_beta_1'
OUT = ROOT / 'dist' / VERSION
BASE = ROOT / 'dist/2.18.0'
BASE_MANIFEST_SHA = '992cd2efe4a460270601c93f825164771fa50f8ef6c9c916c1ed01319406cb67'
ALIASES = ['Cabeçalho de discussão', 'PD', 'Pd', 'Página de discussão', 'PW-Alvo',
           'BPV', 'Bpv', 'Coisas a não fazer', 'Discussão de portal',
           'Página de discussão/Arquivo 1', 'Portais-aviso']


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def once(text, old, new):
    assert text.count(old) == 1, 'The published integration anchor changed'
    return text.replace(old, new, 1)


def patch(text):
    helper = (ROOT / 'src/beta219/talk_header.js').read_text()
    text = once(text, '    function v25TalkPreparationPlan(source,article=\'\',cfg={}) {',
                helper + '\n    function v25TalkPreparationPlan(source,article=\'\',cfg={}) {')
    text = once(text, "        const pd=headers.filter(h=>['pd','cabeçalho de discussão'].includes(h.name));",
                '        const pdHeader=header=>v219OriginalTemplateHeaderAllowed(header)&&\n'
                '            ' + json.dumps(ALIASES, ensure_ascii=False, separators=(',', ':')) + '\n'
                '                .some(title=>v215SameTemplateTitle(header,title));\n'
                '        const pd=headers.filter(h=>pdHeader(h.p.parts[0]));')
    text = once(text,
        "        const all=templates(scanProtectedView(source)).nodes.filter(item=>{\n"
        "            const name=parsedTemplate(source.slice(item.start,item.end)).name;\n"
        "            return ['pd','cabeçalho de discussão','marca de projeto'].includes(name);\n"
        "        });",
        "        const all=templates(scanProtectedView(source)).nodes.filter(item=>{\n"
        "            const parsed=parsedTemplate(source.slice(item.start,item.end));\n"
        "            return pdHeader(parsed.parts[0])||parsed.name==='marca de projeto';\n"
        "        });")
    start = text.index(' * A versão 2.18 amplia')
    end = text.index(' * Licença:', start)
    text = text[:start] + (
        ' * Beta separada, baseada na versão publicada 2.18. Reconhece os\n'
        ' * redirecionamentos conferidos do cabeçalho de discussão e conserva\n'
        ' * a chamada existente. A detecção fora do cabeçalho evita duplicações.\n'
        ' * As demais funções continuam sendo as da 2.18. A validação ampla\n'
        ' * da 2.19 final está pausada e não foi concluída por esta beta.\n') + text[end:]
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=shutil.which('node'))
    args = parser.parse_args()
    assert args.node, 'Node.js is required'
    raw = (ROOT / 'tests/expected_release_v2180.json').read_bytes()
    assert sha(raw) == BASE_MANIFEST_SHA
    base = json.loads(raw)
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    names = {name: name.replace('v2_18_0', SLUG) for name in base['files']}
    names['Chamada_fixa_RevisaWiki_common.js'] = 'Chamada_fixa_RevisaWiki_beta_common.js'
    names['Chamada_fixa_RevisaWiki_copia_propria.js'] = 'Chamada_fixa_RevisaWiki_beta_copia_propria.js'
    for name, pin in base['files'].items():
        data = (BASE / name).read_bytes()
        assert len(data) == pin['bytes'] and sha(data) == pin['sha256']
        text = data.decode()
        if name in ('RevisaWiki_v2_18_0.js', 'RevisaWiki_v2_18_0_completo.js'):
            text = patch(text)
        text = text.replace('2.18.0', VERSION).replace('v2_18_0', SLUG)
        # Dedicated beta pages. The stable installation addresses are untouched.
        text = text.replace('RevisaWiki/Dados.js', 'RevisaWiki/Beta/Dados.js')
        text = text.replace('RevisaWiki/Carregador.js', 'RevisaWiki/Beta/Carregador.js')
        text = text.replace('RevisaWiki.js', 'RevisaWiki/Beta.js')
        destination = OUT / names[name]
        destination.write_text(text)
        emitted = destination.read_bytes()
        subprocess.run([args.node, '--check', str(destination)], check=True)
        files[destination.name] = {'bytes': len(emitted), 'sha256': sha(emitted)}
    for suffix in ('.js', '_dados.js'):
        assert files['RevisaWiki_' + SLUG + suffix]['bytes'] < 2097152
    manifest = {'version': VERSION, 'baseVersion': '2.18.0',
                'baseCommit': '922e4d35138a409279834c030c5bdd4a5ea39bac',
                'baseManifestSha256': BASE_MANIFEST_SHA,
                'packedCatalogSha256': base['packedCatalogSha256'],
                'changes': ['discussion-header-native-alias-identity',
                            'discussion-header-outside-prefix-duplicate-prevention'],
                'excluded': ['unfinished-final-2.19-runtime-and-catalog-changes'],
                'mainValidationResumed': False, 'files': files}
    (ROOT / 'tests/expected_release_beta219.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'version': VERSION, 'files': files}, indent=2))


if __name__ == '__main__':
    main()
