"""Validate the installed manual, release evidence and complete copy payloads."""
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS, DIST = ROOT / 'docs/2.19.0', ROOT / 'dist/2.19.0'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def deadline_and_draft_retention(active):
    heading = '== Preferências e processamento =='
    end = '=== Principais opções pessoais ==='
    if active.count(heading) != 1 or end not in active.split(heading, 1)[1]:
        return False
    scope = active.split(heading, 1)[1].split(end, 1)[0].casefold()
    return all(phrase.casefold() in scope for phrase in [
        'limite de 60 segundos',
        'nenhum ajuste daquela análise é aplicado ao rascunho',
        'as verificações de preservação permanecem ativas',
        'o rascunho completo, o resumo e a marca de edição menor permaneceram intactos',
        'Foi possível continuar digitando e executar outra análise',
    ])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    checks = []

    def check(value, name):
        checks.append({'name': name, 'passed': bool(value)})

    raw = (ROOT / 'tests/expected_release_v2190.json').read_bytes()
    manifest = json.loads(raw)
    qa_raw = (ROOT / 'tests/evidence/2.19.0/QA_SUMMARY.json').read_bytes()
    qa = json.loads(qa_raw)
    manual = (DOCS / 'Documentacao_RevisaWiki_v2_19_0.wiki').read_text()
    previous = (ROOT / 'docs/2.18.0/Documentacao_RevisaWiki_v2_18_0.wiki').read_text()
    active, history = manual.split('== Histórico das versões ==', 1)
    old_history = lambda text: text.split('=== 2.18.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    versions = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
    newest = history.split('=== 2.19.0 ===', 1)[1].split('=== 2.18.0 ===', 1)[0]
    check(qa['releaseGatesPassed'] is True and qa['version'] == '2.19.0', 'Only completed release gates are described')
    check(qa['wikipediaWrites'] == 0 and qa['unresolvedRuntimeFailures'] == 0, 'No untriaged runtime failure or Wikipedia write')
    check(qa['frozenFiles'] == manifest['files'], 'Documentation evidence binds every executable')
    check(qa['releaseManifestSha256'] == sha(raw), 'Exact release manifest is bound')
    check(qa['portugueseSummary'] in manual, 'The manual contains the completed test summary')
    check(versions(manual) == ['2.19.0'] + versions(previous), 'History has one new version, newest first')
    check(old_history(manual) == old_history(previous), 'Published older history remains byte-identical')
    check(5 <= len(re.findall(r'^\* ', newest, re.M)) <= 20, 'The current release has summarized feature bullets')
    check('Testes anteriores da interface' not in manual, 'No detached historical interface blocks')
    check('2.13.1' not in manual, 'No unpublished intermediate release is listed')
    check('https://github.com/danrego/RevisaWiki' in manual, 'The repository is linked')
    check('== Créditos e licença ==' in manual, 'Legal attribution remains present')
    for oldid in [66288743, 72349758, 73087684]:
        check('oldid=' + str(oldid) in manual, 'Anonymous permanent upstream attribution: ' + str(oldid))
    check('CC BY-SA' in manual, 'The license remains explicit')
    check(not re.search(r'</?(?:noinclude|includeonly|onlyinclude)\b', active, re.I), 'Examples cannot alter documentation transclusion')
    check(not re.search('[\u2014\u201c\u201d\u2018\u2019]', manual), 'Plain quotation marks and punctuation')
    check(not re.search(r'\b(?:robusto|robusta|crucial|tapeçaria|pivotal)\b', active, re.I), 'No inflated stock language in active instructions')
    check('não é uma promessa de reproduzir toda substituição' in active and 'editor visual' in active and 'wikEd' in active, 'Source declaration counts are not whole-gadget parity claims')
    check('885 declarações' in active and '881 estão ativas' in active, 'Declaration totals are identified as declarations')
    check('não todas as alternativas' in active, 'Finite witnesses do not imply exhaustive regular-expression coverage')
    for phrase in ["'''Ver o que mudou'''", "'''Escolher alterações'''", "'''Ver ajustes antes de aplicar'''", "'''Informações técnicas'''", "'''Resultados anteriores e conferências'''", "'''Por que alguns ajustes não entraram'''"]:
        check(phrase not in active, 'Retired UI instruction absent: ' + phrase)
    for phrase in ['Mostrar alterações', 'controle nativo', 'atalho fica oculto', 'nunca usa Publicar como alternativa', 'Desfazer ajustes', 'mesmo nome e o mesmo verde']:
        check(phrase in active, 'Current native UI behavior: ' + phrase)
    for phrase in ['não tem uma comparação própria nem seleção de blocos', 'começa aberta', 'escolha de recolhê-la', 'mesmo parâmetro na mesma predefinição', 'opções individuais', 'descrição curta retirada', 'resultados do texto anterior', 'todos os locais e escolhas continuam acessíveis', 'não abre novos painéis']:
        check(phrase.lower() in active.lower(), 'Review behavior remains documented: ' + phrase)
    check('Se a consulta online falhar, Precisa de revisão oferece Mostrar previsão' not in active, 'No retired preview failure advice')
    for language in ['inglês', 'espanhol', 'francês', 'alemão', 'russo', 'ucraniano', 'árabe', 'japonês', 'chinês']:
        check(language in active, 'Language coverage remains explicit: ' + language)
    for title in ['Campos importados de medicamentos e substâncias químicas', 'Linhas vazias na prosa', 'Citações enciclopédicas importadas', 'Alinhamento das caixas de citação', 'Organização dos avisos']:
        check(active.count('=== ' + title + ' ===') == 1, 'One scope section: ' + title)
    for phrase in ['não muda números ou unidades', 'não calcula a massa molar', 'ordem dos campos repetidos', 'wstitle literal e não vazio', 'não apaga categorias avulsas', 'uma única linha vazia', 'poemas', 'formatos misturados', 'discussões', 'apresentação responsiva nativa', 'seis itens principais', 'não define a apresentação das referências', 'conjunto exato de quatro declarações CSS', 'Estilos próprios', 'não envolve as referências em uma Div col']:
        check(phrase in active, 'Preservation and layout boundary: ' + phrase)
    for phrase in ['automaticInfoboxOrder', 'automaticBiographyLead', 'automaticFieldSyntax', 'automaticInfoboxImages', 'automaticBiographyFields', 'automaticInfoboxValues', 'automaticParameterNames', 'automaticReferenceCollectorHeadings', 'automaticSourceCompatibility', 'automaticProseGaps']:
        check(phrase in active, 'Configurable capability: ' + phrase)
    for phrase in ['Na cópia da abertura, um campo explicitamente vazio permanece vazio', 'referência própria', 'sepultamento', 'nomes dinâmicos', 'TemplateData', 'TemplateStyles', 'Subgrupos podem estar balanceados e ainda ter uma organização editorial errada, que precisa de revisão humana.', 'ausentes em vazios']:
        check(phrase in active, 'Field or template safety requirement: ' + phrase)
    check('Ela não depende do tamanho nem do tipo dos ajustes.' in active and 'exclusivamente pelo RevisaWiki' in active, 'Tool-only minor preference is explicit without the retired size/type classifier')
    check('não recebe marcação automática de edição menor' not in active and 'não é marcada automaticamente como edição menor' not in active, 'No obsolete active minor exceptions remain')
    check('PTwiki 2.19.0' in active and "loaderRevision = '2.19.0'" in active, 'Version diagnostics agree')
    check('Não existe uma regra geral' in active or 'preferência' in active, 'Presentation preferences are not universal style mandates')
    check(deadline_and_draft_retention(active), 'The processing section preserves the sixty-second limit, intact draft/form, active preservation checks and continued editing')
    check('não prometer' in active or 'sem prometer' in active, 'Performance is not an unlimited-size guarantee')
    check('Leitura adicional' in active and 'Ver também' in active and 'Ligações externas' in active, 'Portuguese end sections remain documented')
    for name, pin in manifest['files'].items():
        content = (DIST / name).read_bytes()
        check(len(content) == pin['bytes'] and sha(content) == pin['sha256'], 'Exact executable pin: ' + name)
        check(b'~~~' not in content, 'No save-time signature trigger: ' + name)
    for name in ['Chamada_fixa_RevisaWiki_common.js', 'Chamada_fixa_RevisaWiki_copia_propria.js']:
        check((DIST / name).read_bytes() == (ROOT / 'dist/2.18.0' / name).read_bytes(), 'Permanent bootstrap unchanged: ' + name)
    for name in ['RevisaWiki_v2_19_0.js', 'RevisaWiki_v2_19_0_dados.js']:
        check((DIST / name).stat().st_size < 2097152, 'Modular installation stays below page limit: ' + name)
    check(len(list(DOCS.iterdir())) == 8, 'Exactly eight documentation files')
    for file in sorted(DOCS.iterdir()):
        check(file.is_file() and not file.is_symlink(), 'Ordinary documentation file: ' + file.name)
        content = file.read_bytes()
        text = content.decode()
        check(content == (DIST / file.name).read_bytes(), 'Complete distributed documentation: ' + file.name)
        check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'One blank line between paragraphs: ' + file.name)
        check(not re.search(r'\bPENDING\b|TODO|FINAL_AUDITED|/' + 'Users/|/' + r'private/|127\.0\.0\.1:\d+', text), 'No unfinished text or private paths: ' + file.name)
    installation = (DOCS / 'Instalacao_RevisaWiki_v2_19_0.txt').read_text()
    check('mesmo que já use uma versão anterior' in installation, 'Existing installation upgrade is explained')
    check('Mostrar alterações usa o controle nativo' in installation, 'Installation follows the current UI')
    for name in ['Instalacao_RevisaWiki_v2_19_0.txt', 'Notas_da_versao_RevisaWiki_v2_19_0.txt', 'Referencia_tecnica_RevisaWiki_v2_19_0.txt', 'Relatorio_testes_RevisaWiki_v2_19_0.txt']:
        check(qa['portugueseSummary'] in (DOCS / name).read_text(), 'The same completed QA is quoted: ' + name)
    index = (DIST / 'INICIO.html').read_text()
    match = re.search(r'<script type="application/json" id="payloads">([\s\S]*?)</script>', index)
    check(bool(match), 'The index embeds full copy payloads')
    if match:
        payloads = json.loads(match[1])
        check(list(payloads) == ['dados', 'programa', 'central', 'documentacao', 'carregador'], 'Four update cards precede optional first installation')
        for key, item in payloads.items():
            content = (DIST / item['filename']).read_bytes()
            check(item['text'].encode() == content, 'Complete copy text: ' + key)
            check(item['sha256'] == sha(content) and item['bytes'] == len(content), 'Copy hash and byte count: ' + key)
            check(bool(item['destination'].strip()) and bool(item['summary'].strip()), 'Destination and edit summary: ' + key)
        check(payloads['central']['destination'] == 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', 'The central loader destination is exact')
    check(index.count('class="raw-source"') == 5 and 'action=edit' in index, 'Every card has raw source and direct editor links')
    check(active.index('# Copie <code>Documentacao_RevisaWiki_v2_19_0.wiki') < active.index('# Se já usa a chamada fixa acima'), 'Manual order matches the installation index')
    failures = [row for row in checks if not row['passed']]
    report = {'version': '2.19.0', 'status': 'failed' if failures else 'passed', 'checks': len(checks), 'failures': failures,
              'results': checks, 'releaseManifestSha256': sha(raw), 'qaSha256': sha(qa_raw), 'frozenFiles': manifest['files'],
              'priorManualSha256': sha(previous.encode()), 'priorHistorySha256': sha(old_history(previous).encode()),
              'documentationFiles': {file.name: {'bytes': file.stat().st_size, 'sha256': sha(file.read_bytes())} for file in DOCS.iterdir()},
              'indexSha256': sha(index.encode()), 'wikipediaWrites': 0}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': report['status'], 'checks': len(checks), 'failures': failures}, ensure_ascii=False))
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
