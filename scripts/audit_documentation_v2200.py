"""Check the final manual, history, copy payloads and runtime bindings."""
from pathlib import Path
import argparse
import hashlib
import json
import re

from v220_delivery import ROOT, DIST, DOCS, VERSION, checked_manifest, checked_qa, safe_file


PASTE_CONTRACT = {
    'dados': ('RevisaWiki_v2_20_0_dados.js', 'Usuário:Daniel G Rego/RevisaWiki/Dados.js'),
    'programa': ('RevisaWiki_v2_20_0.js', 'Usuário:Daniel G Rego/RevisaWiki.js'),
    'central': ('Carregador_comunitario_RevisaWiki_v2_20_0.js', 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js'),
    'documentacao': ('Documentacao_RevisaWiki_v2_20_0.wiki', 'Usuário:Daniel G Rego/RevisaWiki'),
    'chamada': ('Chamada_fixa_RevisaWiki_common.js', 'Especial:Minha página/common.js'),
    'central-propria': ('Carregador_common_js_RevisaWiki_v2_20_0.js', 'Especial:Minha página/RevisaWiki/Carregador.js'),
    'chamada-propria': ('Chamada_fixa_RevisaWiki_copia_propria.js', 'Especial:Minha página/common.js'),
}


def read_exact_text(path):
    """Decode the saved bytes without universal-newline normalization."""
    return path.read_bytes().decode('utf-8')


def history_blocks(tail):
    end = re.search(r'^== [^=\n].*? ==[ \t]*$', tail, re.M)
    return tail[:end.start()] if end else tail


def audit():
    manifest = checked_manifest()
    qa = checked_qa(manifest)
    rows = []

    def check(value, name):
        rows.append(dict(name=name, passed=bool(value)))

    manual = read_exact_text(DOCS / 'Documentacao_RevisaWiki_v2_20_0.wiki')
    active, history_tail = manual.split('== Histórico das versões ==', 1)
    previous = read_exact_text(ROOT / 'docs/2.19.1/Documentacao_RevisaWiki_v2_19_1.wiki')
    history = history_blocks(history_tail)
    old_history = history_blocks(previous.split('== Histórico das versões ==', 1)[1])
    versions = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
    check(versions(history) == [VERSION] + versions(old_history), 'History is newest first, with one new release')
    old_start = old_history.find('=== ')
    check(old_start >= 0 and history[history.index('=== ' + versions(old_history)[0] + ' ==='):] == old_history[old_start:],
          'Published earlier history remains byte-identical')
    newest = history.split('=== ' + VERSION + ' ===', 1)[1].split('=== ' + versions(old_history)[0] + ' ===', 1)[0]
    check(5 <= len(re.findall(r'^\* ', newest, re.M)) <= 20, 'Release history uses concise feature bullets')
    check('PTwiki 2.20.0' in active and "loaderRevision = '2.20.0'" in active, 'Installation diagnostics match this release')
    check('https://github.com/danrego/RevisaWiki' in active, 'Repository is linked')
    check(qa['docValidationSummary'] in manual, 'The manual contains the final reviewed validation summary')
    check(qa.get('unresolvedIntegrityFailures') == 0, 'No unresolved integrity failure is described as a release pass')
    check(qa.get('workerDeadlineMilliseconds') == 60000, 'The production deadline remains sixty seconds')
    for phrase in ['limite de 60 segundos', 'as verificações de preservação permanecem ativas',
                   'Foi possível continuar digitando e executar outra análise', 'rascunho completo',
                   'resumo', 'edição menor', 'exclusivamente pelo RevisaWiki',
                   'apresentação responsiva nativa', 'Mostrar alterações', 'Desfazer ajustes',
                   'começa aberta', 'common.js', 'TemplateStyles', 'sepultamento']:
        check(phrase.casefold() in active.casefold(), 'Explicit operating boundary: ' + phrase)
    for phrase in ['Testes anteriores da interface', "'''Ver o que mudou'''", "'''Escolher alterações'''",
                   "'''Informações técnicas'''", "'''Resultados anteriores e conferências'''",
                   "'''Por que alguns ajustes não entraram'''"]:
        check(phrase not in active, 'Retired UI wording is absent: ' + phrase)
    check('52 decisões' in active and 'três estudos de HTML não ativados' in active,
          'Reviewed proposals and released automation are distinguished')
    check(all('<code>' + tag + '</code>' in active for tag in ['center', 'font', 'big']),
          'Withheld HTML migrations are explicit')
    check(not re.search('[\u2014\u201c\u201d\u2018\u2019]', manual), 'Plain quotation marks and punctuation')
    check(not re.search(r'\b(?:robusto|robusta|crucial|tapeçaria|pivotal)\b', active, re.I),
          'Active documentation avoids stock promotional language')
    for file in sorted(DOCS.iterdir()):
        if not file.is_file():
            continue
        raw = file.read_bytes()
        text = raw.decode('utf-8')
        check(not file.is_symlink(), 'Ordinary documentation file: ' + file.name)
        check((DIST / file.name).read_bytes() == raw, 'Distributed documentation agrees: ' + file.name)
        check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'One blank line: ' + file.name)
        check(not re.search(r'\b(?:TODO|FIXME|PENDING)\b|/Users/|127\.0\.0\.1:\d+', text),
              'No unfinished text or machine paths: ' + file.name)
    index = read_exact_text(DIST / 'INICIO.html')
    metadata = json.loads(read_exact_text(DIST / 'MANIFESTO.json'))
    check(metadata.get('status') == 'release-validated', 'The audited index is a qualified release, not a preview')
    check(metadata.get('runtimeFiles') == manifest['files'], 'The index metadata names the qualified runtime files')
    check(metadata.get('indexSha256') == hashlib.sha256((DIST / 'INICIO.html').read_bytes()).hexdigest(),
          'The index bytes match their delivery record')
    match = re.search(r'<script type="application/json" id="payloads">([\s\S]*?)</script>', index)
    check(bool(match), 'The index embeds complete copy payloads')
    if match:
        payloads = json.loads(match[1])
        check(set(payloads) == set(PASTE_CONTRACT), 'Exactly the seven reviewed installation cards are present')
        check(list(payloads)[:4] == ['dados', 'programa', 'central', 'documentacao'],
              'Update order is data, program, loader and documentation')
        for key, item in payloads.items():
            expected = PASTE_CONTRACT.get(key)
            check(expected is not None and (item.get('filename'), item.get('destination')) == expected,
                  'Reviewed filename and destination: ' + key)
            raw = safe_file(DIST, item['filename']).read_bytes()
            check(item['text'].encode() == raw and item['sha256'] == hashlib.sha256(raw).hexdigest()
                  and item['bytes'] == len(raw), 'Exact copy payload: ' + key)
            summary_name = ('Resumo_documentacao_RevisaWiki_v2_20_0.txt' if key == 'documentacao'
                            else 'Resumo_atualizacao_RevisaWiki_v2_20_0.txt')
            check(item['summary'] == read_exact_text(DOCS / summary_name).strip(),
                  'Reviewed edit summary: ' + key)
            check('_completo.js' not in item['filename'], 'Oversized local bundle is not an installation card: ' + key)
    check('Não o cole numa página .js' in index, 'The local-only bundle warning is visible')
    failures = [row for row in rows if not row['passed']]
    return dict(version=VERSION, status='failed' if failures else 'passed', checks=len(rows),
                failures=failures, results=rows, frozenFiles=manifest['files'], wikipediaWrites=0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    report = audit()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ['status', 'checks', 'failures']}, ensure_ascii=False))
    if report['failures']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
