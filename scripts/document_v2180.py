"""Write 2.18 documentation only after approved scope and frozen completed QA."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION, SLUG = '2.18.0', 'v2_18_0'
SCOPE_FILE = ROOT / 'artifacts/v2180/DOCUMENTATION_SCOPE.json'
SPACING_SCOPE = '''Entre parágrafos comuns de um artigo, duas ou mais linhas vazias passam a uma única linha vazia quando a estrutura e os limites do trecho estão completos. Essas linhas podem conter apenas espaços ou tabulações. O texto dos parágrafos e suas referências permanecem iguais. A mesma limpeza pode ocorrer antes de uma chamada nativa reconhecida de referências, portais ou controle de autoridade, ou de uma linha de categoria.

Uma referência completa dentro do parágrafo pode conter uma predefinição de citação sem impedir essa limpeza. O programa conserva o código da fonte e usa apenas os limites da referência para reconhecer o texto ao redor. Depois dos outros ajustes, ele confere novamente o espaçamento, para concluir no mesmo clique a limpeza de um espaço deixado pela retirada de uma marca obsoleta.

As linhas dentro de predefinições, referências, tabelas, citações, exemplos, código, poemas, ligações e elementos HTML permanecem intactas. Limites de listas e texto pré-formatado também impedem a mudança. A regra preserva a indentação, uma única linha vazia já existente, o início e o fim da página e as quebras de linha de formatos misturados. Não retira espaçamento de discussões nem de documentação de predefinições. Use <code>automaticProseGaps: false</code> para desligar a ampliação de espaços em branco desta versão.'''
END_LIST_SCOPE = '''Listas contínuas de ''' + "'''Ligações externas''', '''Bibliografia''', '''Leitura adicional''' e '''Leitura complementar'''" + ''' recebem duas colunas a partir de seis itens principais. Subitens não entram na contagem. Listas simples com até cinco itens ficam numa coluna. Pares simples de Div col já presentes podem ser retirados dessas listas curtas, sem modificar os itens. Estilos próprios e estruturas complexas ficam preservados. Listas curtas e escolhas válidas de formatação não geram avisos de revisão.

O ajuste usa <code><nowiki>{{Div col|colunas=2}}</nowiki></code> e <code><nowiki>{{Div col fim}}</nowiki></code> apenas em torno da lista. Commons, portais, caixas de navegação, controle de autoridade e categorias ficam fora. InícioRef mantém a formatação bibliográfica sem ser tratado como uma definição de colunas. Essa regra de seis itens vale para essas listas finais e não define a apresentação das referências.'''
PUBLIC_EVIDENCE_SCOPE = 'Os resultados públicos trazem os totais, os arquivos executados e os hashes dos comprovantes validados. Os relatórios individuais, as coordenadas dos casos, as capturas reais e os registros de execução ficam locais. Os comprovantes originais são conferidos antes de gerar os resumos públicos. Os exemplos fictícios das provas nativas e a matriz de regras ficam disponíveis para reprodução.'
REFERENCE_LAYOUT_SCOPE = '''As referências usam a apresentação responsiva nativa da Wikipédia, que adapta a lista à largura disponível. O programa deixa de acrescentar um número fixo de colunas ou um estilo externo a partir de dez entradas. A quantidade de referências, sozinha, não decide quantas colunas a tela deve mostrar.<ref>[https://pt.wikipedia.org/w/index.php?oldid=69333097 Orientação sobre referências em colunas, revisão 69333097]. [https://pt.wikipedia.org/w/index.php?oldid=63785697 Implementação nativa de Referências, revisão 63785697].</ref>

O conjunto exato de quatro declarações CSS que versões anteriores do programa acrescentavam ao envoltório de Referências pode ser retirado para deixar a lista nativa ajustar sua largura. A regra reconhece o conjunto inteiro, com os valores conferidos, antes de remover o argumento. Estilos próprios, argumentos posicionais que possam renumerar outros valores e conjuntos diferentes ficam como estavam.

Parâmetros antigos que a implementação nativa conferida ignora também podem ser retirados. O conteúdo da lista, as definições em <code>refs=</code>, os nomes, os grupos e os demais argumentos permanecem iguais. A limpeza não envolve as referências em uma Div col e não muda a quantidade ou a ordem das fontes. Notas e referências conserva a apresentação da própria predefinição, sem receber parâmetros novos de colunas.'''


def clean(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


def once(text, old, new):
    assert text.count(old) == 1, 'Documentation anchor differs: ' + old[:100]
    return text.replace(old, new, 1)


def section(text, title, next_title, content):
    before, remainder = text.split('=== ' + title + ' ===', 1)
    old, after = remainder.split('=== ' + next_title + ' ===', 1)
    assert old.strip(), 'The baseline section cannot be empty'
    return before + '=== ' + title + ' ===\n\n' + content.strip() + '\n\n=== ' + next_title + ' ===' + after


def plain_text(text):
    assert isinstance(text, str) and text.strip() and text == text.strip()
    assert not re.search(r'\bPENDING\b|TODO|/' + 'Users/|/' + r'private/|127\.0\.0\.1:\d+', text)
    assert not re.search('[\u2014\u201c\u201d\u2018\u2019]', text)
    return text


def scope_receipt():
    scope = json.loads(SCOPE_FILE.read_text())
    assert scope['version'] == VERSION and scope['status'] == 'approved'
    assert re.fullmatch(r'\d{1,2} de [a-zç]+ de 2026', scope['releaseDatePT'])
    plain_text(scope['intro'])
    assert scope['intro'].startswith("A versão '''2.18'''")
    assert isinstance(scope['features'], list) and 3 <= len(scope['features']) <= 20
    for feature in scope['features']:
        plain_text(feature)
        assert '\n' not in feature and not feature.startswith(('*', '-'))
    for key in ['compatibilityScope', 'technicalScope']:
        assert isinstance(scope[key], list) and scope[key]
        for paragraph in scope[key]:
            plain_text(paragraph)
    return scope


def qa_receipt():
    raw = (ROOT / 'tests/expected_release_v2180.json').read_bytes()
    manifest = json.loads(raw)
    qa = json.loads((ROOT / 'artifacts/v2180/QA_SUMMARY.json').read_text())
    assert qa['version'] == VERSION and qa['status'] in ['passed', 'passed-with-preexisting-findings']
    assert qa['releaseManifestSha256'] == hashlib.sha256(raw).hexdigest()
    assert qa['frozenFiles'] == manifest['files']
    for name, pin in manifest['files'].items():
        content = (ROOT / 'dist/2.18.0' / name).read_bytes()
        assert len(content) == pin['bytes'] and hashlib.sha256(content).hexdigest() == pin['sha256'], name
    summaries = [plain_text(qa['portugueseSummary'])]
    if qa.get('alertReduction', {}).get('portugueseSummary'):
        summaries.append(plain_text(qa['alertReduction']['portugueseSummary']))
    for row in qa['groups']:
        assert row['status'] in ['passed', 'passed-with-preexisting-findings']
        assert isinstance(row['cases'], int) and row['cases'] >= 0
        assert isinstance(row['checks'], int) and row['checks'] >= 0
    return manifest, qa, summaries


def main():
    scope = scope_receipt()
    manifest, qa, summaries = qa_receipt()
    summary = '\n\n'.join(summaries)
    base = (ROOT / 'docs/2.17.0/Documentacao_RevisaWiki_v2_17_0.wiki').read_text()
    head, history = base.split('== Histórico das versões ==', 1)
    history, tail = history.split('== Testes e detalhes técnicos ==', 1)
    head = head.replace('2.17.0', VERSION).replace('_v2_17_0', '_' + SLUG)
    head = once(head, "A versão '''2.17''' reduz os avisos da revisão e acrescenta reparos conferidos de campos de infocaixas, atributos de referências e tabelas.", scope['intro'])
    head = once(head,
        'Se uma estrutura continuar incompleta, o texto a partir do último limite confirmado fica igual. Alguns ajustes locais podem continuar na parte completa anterior. Nessa passagem, todas as referências nomeadas ficam protegidas para não mudar apenas parte de uma família que também pode aparecer adiante. O programa não acrescenta nem reorganiza portais, categorias ou listas finais com base numa leitura incompleta.',
        'Quando uma estrutura continua incompleta, o programa mantém seus delimitadores e só aplica reparos nos trechos que passam por uma conferência própria, incluindo citações completas nas condições explicadas adiante. Os nomes das referências, seus grupos e as chamadas relacionadas permanecem intactos. O programa não acrescenta nem reorganiza portais, categorias ou listas finais com base numa leitura incompleta.')
    head = once(head,
        'Um artigo de quase 2 MiB atingiu esse limite no Firefox e no Safari e manteve o rascunho original, como também ocorria na versão 2.4.0.',
        'Em testes de versões anteriores, um artigo de quase 2 MiB atingiu esse limite no Firefox e no Safari e manteve o rascunho original, como também ocorria na versão 2.4.0.')
    steps_block = head.split('=== Atualizar as páginas da distribuição ===', 1)[1].split('=== Aviso ao exibir arquivos grandes ===', 1)[0]
    steps = re.findall(r'^# .+$', steps_block, re.M)
    assert len(steps) == 6
    assert 'chamada fixa' in steps[3] and 'Documentacao_' in steps[4]
    head = once(head, '\n'.join(steps), '\n'.join(steps[:3] + [steps[4], steps[3], steps[5]]))
    head = section(head, 'Linhas vazias na prosa', 'Citações enciclopédicas importadas', SPACING_SCOPE)
    columns_start = head.index('=== Quando usar duas colunas ===')
    columns_end = head.index('=== Lista que mostra apenas um número ===', columns_start)
    head = head[:columns_start] + '=== Listas finais em duas colunas ===\n\n' + END_LIST_SCOPE + '\n\n=== Apresentação das referências ===\n\n' + REFERENCE_LAYOUT_SCOPE + '\n\n' + head[columns_end:]
    compatibility = '=== Ajustes de citações em trechos independentes ===\n\n' + '\n\n'.join(scope['compatibilityScope']) + '\n\n'
    head = once(head, '=== Campos importados de medicamentos e substâncias químicas ===', compatibility + '=== Campos importados de medicamentos e substâncias químicas ===')
    head = once(head, '| <code>referenceColumns</code>, <code>endMatterColumns</code>, <code>externalLinkColumns</code> || Colunas de referências, ajuste das listas finais e propostas de colunas quando o automático está desligado.',
                '| <code>referenceColumns</code>, <code>endMatterColumns</code>, <code>externalLinkColumns</code> || Apresentação nativa das referências, ajuste das listas finais e propostas de colunas quando o automático está desligado.\n|-\n| <code>automaticProseGaps</code> || Ampliação da limpeza de linhas vazias na prosa e nos limites finais reconhecidos.')
    features = '\n'.join('* ' + feature for feature in scope['features'])
    pos = history.index('=== 2.17.0 ===')
    new_history = history[:pos] + '=== 2.18.0 ===\n\n' + features + '\n\n' + history[pos:]
    tests_end = tail.index('\n\nOs testes usam revisões fixadas')
    tail = '\n\n' + summary + '\n\n' + PUBLIC_EVIDENCE_SCOPE + tail[tests_end:]
    tail = tail.replace('docs/2.17.0/Relatorio_testes_RevisaWiki_v2_17_0.txt Relatório de testes 2.17.0', 'docs/2.18.0/Relatorio_testes_RevisaWiki_v2_18_0.txt Relatório de testes 2.18.0')
    tail = tail.replace('docs/2.17.0/Referencia_tecnica_RevisaWiki_v2_17_0.txt', 'docs/2.18.0/Referencia_tecnica_RevisaWiki_v2_18_0.txt')
    manual = clean(head) + '== Histórico das versões ==' + new_history + '== Testes e detalhes técnicos ==' + clean(tail)
    prior_history = lambda text: text.split('=== 2.17.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    assert prior_history(manual) == prior_history(base), 'Published history must remain byte-identical'
    out = ROOT / 'docs/2.18.0'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'Documentacao_RevisaWiki_v2_18_0.wiki').write_text(manual)
    installation = (ROOT / 'docs/2.17.0/Instalacao_RevisaWiki_v2_17_0.txt').read_text().replace('2.17.0', VERSION).replace('_v2_17_0', '_' + SLUG)
    installation = once(installation, 'mesmo que a 2.16.0 já esteja instalada', 'mesmo que a 2.17.0 já esteja instalada')
    old_test = installation.split('TESTES\n\n', 1)[1].split('\n\nCONSULTAS E PUBLICAÇÃO', 1)[0]
    installation = once(installation, old_test, summary)
    (out / 'Instalacao_RevisaWiki_v2_18_0.txt').write_text(clean(installation))
    (out / 'Resumo_atualizacao_RevisaWiki_v2_18_0.txt').write_text('RevisaWiki 2.18: ajustes de citações, linhas vazias e apresentação nativa das referências.\n')
    (out / 'Resumo_documentacao_RevisaWiki_v2_18_0.txt').write_text('Documentação do RevisaWiki 2.18.0: ajustes, limites, testes e instalação.\n')
    (out / 'Notas_da_versao_RevisaWiki_v2_18_0.txt').write_text(clean('RevisaWiki 2.18.0\n' + scope['releaseDatePT'] + '\n\n' + features.replace('* ', '- ') + '\n\n' + summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
    (out / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.18.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga os quatro cartões: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
    technical = ('RevisaWiki 2.18.0: referência técnica\n' + scope['releaseDatePT'] + '\n\nA reconstrução parte da distribuição 2.17.0 fixada por SHA-256 e aplica os módulos de src/v2_18. Os arquivos históricos permanecem intactos. Cada plano de reparo fica vinculado ao código de entrada e ao resultado previsto.\n\n' + '\n\n'.join(scope['technicalScope']) + '\n\n' + SPACING_SCOPE + '\n\n' + REFERENCE_LAYOUT_SCOPE + '\n\n' + PUBLIC_EVIDENCE_SCOPE + '\n\n' + summary + '\n')
    technical = re.sub(r'<ref>.*?</ref>', '', technical, flags=re.S)
    technical = re.sub(r'</?(?:code|nowiki)>', '', technical)
    (out / 'Referencia_tecnica_RevisaWiki_v2_18_0.txt').write_text(clean(technical))
    lines = ['RevisaWiki 2.18.0: resultados dos testes', scope['releaseDatePT'], '', summary, '']
    for row in qa['groups']:
        suffix = ', sem falhas.' if row['status'] == 'passed' else ', com ' + str(row.get('preexistingFindings', 0)) + ' ocorrências idênticas às da versão anterior e nenhuma regressão nova.'
        quantities = []
        for key, singular, plural in [('cases', 'caso', 'casos'), ('checks', 'verificação', 'verificações')]:
            if row[key]:
                quantities.append(f"{row[key]:,}".replace(',', '.') + ' ' + (singular if row[key] == 1 else plural))
        lines.append('- ' + row['label'] + ': ' + (' e '.join(quantities) if quantities else 'sem contagem de casos ou verificações') + suffix)
    lines += ['', PUBLIC_EVIDENCE_SCOPE, '', 'Casos sintéticos e execuções nas duas distribuições não são artigos distintos. Os resultados e hashes ficam em tests/evidence/2.18.0. Os comprovantes nativos anteriores mantêm sua origem e não são contados como consultas novas.', '', 'Arquivos executados', '']
    for name, proof in manifest['files'].items():
        lines += [name + ': ' + str(proof['bytes']) + ' bytes', 'SHA-256: ' + proof['sha256']]
    lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
    (out / 'Relatorio_testes_RevisaWiki_v2_18_0.txt').write_text(clean('\n'.join(lines)))
    assert len(list(out.iterdir())) == 8
    print(json.dumps({'version': VERSION, 'documentationFiles': 8, 'releaseManifestSha256': qa['releaseManifestSha256'], 'scopeSha256': hashlib.sha256(SCOPE_FILE.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
