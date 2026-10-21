"""Produce the complete manual from pinned text and completed release evidence."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION, SLUG = '2.19.0', 'v2_19_0'
DOCS = ROOT / 'docs' / VERSION


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def clean(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text).strip() + '\n'


def main():
    manifest = json.loads((ROOT / 'tests/expected_release_v2190.json').read_text())
    qa_file = ROOT / 'tests/evidence/2.19.0/QA_SUMMARY.json'
    qa = json.loads(qa_file.read_text())
    assert qa['version'] == VERSION and qa['releaseGatesPassed'] is True
    assert qa['frozenFiles'] == manifest['files']
    assert qa['wikipediaWrites'] == 0 and qa['unresolvedRuntimeFailures'] == 0
    summary = qa['portugueseSummary']
    assert isinstance(summary, str) and summary.strip() == summary and len(summary) > 100
    for name, pin in manifest['files'].items():
        raw = (ROOT / 'dist' / VERSION / name).read_bytes()
        assert len(raw) == pin['bytes'] and sha(raw) == pin['sha256']
    changes = json.loads((ROOT / 'src/v2_19/documentation_changes.json').read_text())
    base = (ROOT / changes['baseFile']).read_bytes()
    assert sha(base) == changes['baseSha256']
    lines = base.decode().splitlines(keepends=True)
    prior_end = len(lines) + 1
    for edit in reversed(changes['edits']):
        start, end = edit['startLine'], edit['endLine']
        assert 0 <= start <= end < prior_end
        assert sha(''.join(lines[start:end]).encode()) == edit['sourceSha256']
        lines[start:end] = [edit['text']]
        prior_end = start
    manual = ''.join(lines)
    token = changes['qaSubstitutionToken']
    assert manual.count(token) == 1
    manual = clean(manual.replace(token, summary))
    active, history = manual.split('== Histórico das versões ==', 1)
    for change in json.loads((ROOT / 'src/v2_19/documentation_minor_changes.json').read_text())['changes']:
        assert sha(change['source'].encode()) == change['sourceSha256']
        assert active.count(change['source']) == 1
        active = active.replace(change['source'], change['text'], 1)
    manual = active + '== Histórico das versões ==' + history
    intro = (ROOT / 'src/v2_19/documentation_intro.wiki').read_text()
    minor = (ROOT / 'src/v2_19/documentation_minor.wiki').read_text()
    assert manual.count('== Instalação ==') == 1
    manual = clean(intro + '\n' + minor + '\n' + '== Instalação ==' + manual.split('== Instalação ==', 1)[1])
    editorial_corrections = {
        'Use <code>automaticProseGaps: false</code> para desligar a ampliação de espaços em branco desta versão.':
            'Use <code>automaticProseGaps: false</code> para desligar essa limpeza adicional de linhas vazias.',
        'Os nomes completos e os detalhes de cada família de regras ficam na [https://github.com/danrego/RevisaWiki/blob/main/docs/2.19.0/Referencia_tecnica_RevisaWiki_v2_19_0.txt referência técnica].':
            'As seções deste manual explicam os limites de cada grupo de ajustes. A [https://github.com/danrego/RevisaWiki/blob/main/docs/2.19.0/Referencia_tecnica_RevisaWiki_v2_19_0.txt referência técnica] apresenta a composição dos arquivos e os critérios dos testes.',
    }
    for before, after in editorial_corrections.items():
        assert manual.count(before) == 1
        manual = manual.replace(before, after, 1)
    assert '@@' not in manual and 'FINAL_AUDITED' not in manual
    assert '== Créditos e licença ==' in manual
    assert all('oldid=' + str(oldid) in manual for oldid in [66288743, 72349758, 73087684])
    history = manual.split('== Histórico das versões ==', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    features = history.split('=== 2.19.0 ===', 1)[1].split('=== 2.18.0 ===', 1)[0]
    bullets = re.findall(r'^\* (.+)$', features, re.M)
    assert 5 <= len(bullets) <= 20
    previous_installation = (ROOT / 'docs/2.18.0/Instalacao_RevisaWiki_v2_18_0.txt').read_text()
    installation = previous_installation.split('\nTESTES\n', 1)[0]
    installation = installation.replace('2.18.0', VERSION).replace('_v2_18_0', '_' + SLUG)
    installation = installation.replace(
        'Os catálogos continuam iguais aos da versão anterior, mas este arquivo passa a declarar 2.19.0. Atualize-o junto do núcleo, mesmo que a 2.17.0 já esteja instalada.',
        'O arquivo contém as regras e as revisões conferidas para 2.19.0. Atualize-o junto do núcleo, mesmo que já use uma versão anterior.')
    installation += '\nTESTES\n\n' + summary + '\n\nCONSULTAS E PUBLICAÇÃO\n\n'
    installation += previous_installation.split('\nCONSULTAS E PUBLICAÇÃO\n', 1)[1]
    technical = '\n\n'.join(qa['technicalParagraphs'])
    report = '\n\n'.join([summary, *qa['testReportParagraphs']])
    hashes = '\n\n'.join(name + ': ' + str(pin['bytes']) + ' bytes\nSHA-256: ' + pin['sha256']
                          for name, pin in manifest['files'].items())
    contents = {
        'Documentacao_RevisaWiki_v2_19_0.wiki': manual,
        'Instalacao_RevisaWiki_v2_19_0.txt': installation,
        'Notas_da_versao_RevisaWiki_v2_19_0.txt': 'RevisaWiki 2.19.0\n\n' + '\n'.join('- ' + bullet for bullet in bullets) + '\n\n' + summary,
        'Referencia_tecnica_RevisaWiki_v2_19_0.txt': 'RevisaWiki 2.19.0: referência técnica\n\n' + technical + '\n\n' + summary,
        'Relatorio_testes_RevisaWiki_v2_19_0.txt': 'RevisaWiki 2.19.0: resultados dos testes\n\n' + report + '\n\nArquivos executados\n\n' + hashes,
        'Resumo_atualizacao_RevisaWiki_v2_19_0.txt': 'Atualização do RevisaWiki para 2.19.0, com revisão das regras, correções de aplicação e testes de preservação.',
        'Resumo_documentacao_RevisaWiki_v2_19_0.txt': 'Atualização do manual do RevisaWiki 2.19.0, com instalação, critérios dos ajustes e resultados dos testes.',
        'LEIA_PRIMEIRO.txt': 'RevisaWiki 2.19.0\n\nAbra INICIO.html. Atualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js permanece igual.\n\nO índice oferece cópia completa, destino, resumo, editor e download. Ele não publica páginas. Use os arquivos separados de dados e programa para respeitar o limite por página da ptwiki.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n\n' + summary,
    }
    DOCS.mkdir(parents=True, exist_ok=True)
    for name, text in contents.items():
        text = clean(text)
        assert not re.search(r'\bPENDING\b|TODO|FINAL_AUDITED|/' + 'Users/|/' + r'private/|127\.0\.0\.1:\d+', text)
        assert not re.search('[\u2014\u201c\u201d\u2018\u2019]', text)
        (DOCS / name).write_text(text)
    print(json.dumps({'version': VERSION, 'files': len(contents), 'qaSha256': sha(qa_file.read_bytes())}))


if __name__ == '__main__':
    main()
