"""Write 2.17 documentation only from the frozen release and completed QA."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.17.0'
SLUG = 'v2_17_0'
FEATURES = '''* Mostra na revisão somente problemas confirmados no texto final e escolhas que ainda podem ser aplicadas à ocorrência correta.
* Agrupa ocorrências do mesmo problema, mantendo todos os locais e as opções de cada trecho acessíveis.
* Retira da revisão avisos antigos, limitações de catálogo e consultas opcionais inconclusivas, sem mudar o código para ocultá-los.
* Corrige 21 erros de acentuação de campos conferidos em quatro infocaixas pessoais, mantendo os nomes alternativos que já são aceitos.
* Retira aliases vazios redundantes em dez famílias de campos nativos quando o valor exibido e as referências ficam iguais.
* Corrige nome e grupo em etiquetas de referência quando uma definição ou chamada nativa confirma uma única ligação entre as ocorrências.
* Corrige juntos de dois a quatro nomes de atributos rowspan ou colspan quando apenas uma combinação forma a tabela regular.
* Mantém o painel existente, as proteções de conteúdo e a decisão de publicar sob controle de quem edita.'''
REPORT_SCOPE = """'''Precisa de revisão''' reúne problemas confirmados no texto final e propostas que ainda podem ser aplicadas ao trecho correspondente. A seção começa aberta e respeita a escolha de recolhê-la. Ocorrências do mesmo parâmetro na mesma predefinição ficam agrupadas, com seus trechos e opções individuais. A descrição curta retirada fica em um detalhe para consulta dentro dessa seção.

Nos problemas agrupados, '''Ir ao trecho''' percorre as ocorrências confirmadas e informa a posição na sequência. Nas propostas, abra o grupo e a ocorrência para ver suas opções. Todos os locais e escolhas continuam acessíveis, inclusive depois de resolver uma ocorrência que não era a primeira.

Ao mudar o rascunho, os resultados do texto anterior deixam de ser apresentados como problemas do texto novo. A leitura final também retira da revisão os avisos de um trecho já corrigido ou desfeito. Uma referência sem definição local, um conflito entre fontes ou outro erro confirmado no código final permanece disponível para revisão.

A escolha do que aparece no relatório não muda o código nem as proteções de conteúdo. Avisos de que um modelo não está no catálogo, recusas preventivas de conversão e dados que ainda não puderam ser confirmados deixam de ocupar a revisão. Uma ausência no catálogo não basta para oferecer a retirada de um parâmetro e de seu valor. O trecho continua no rascunho quando não há um reparo comprovado.

Consultas opcionais indisponíveis ou incompletas não são apresentadas como erros do artigo. '''Conferir tudo''', '''Conferir destinos''' e a pré-visualização do editor continuam disponíveis. A redução de avisos não confirma que toda a página foi validada e não abre novos painéis."""
INFOBOX_SCOPE = '''=== Acentos e aliases vazios de infocaixas ===

Uma lista conferida de 21 erros de acentuação corrige campos de Info/Biografia, Info/Futebolista, Info/Ator e Info/Político. Por exemplo, <code>posicao</code> pode passar a <code>posição</code> em Info/Futebolista. O valor e suas referências permanecem iguais. Um nome alternativo já aceito, um campo concorrente ou um valor vazio impede essa troca.

Dez famílias de campos conferidos de Info/Biografia, Info/Político, Info/Militar e Info/Modelo permitem retirar um alias que só contém espaços quando um campo de maior precedência já fornece o valor exibido. As duas regras cobrem seis definições nativas ao todo. A retirada exige a mesma exibição e as mesmas referências nas comparações nativas, sem usar a ausência de um nome no catálogo como motivo para apagar dados.

Em <code><nowiki>{{Info/Biografia|ocupação=|ocupações=Escritora}}</nowiki></code>, o campo ocupação explicitamente vazio impede que o valor de ocupações apareça. Esse código permanece como estava. A regra também conserva campos que controlam valores padrão ou dados do Wikidata, valores preenchidos diferentes e famílias sem confirmação.

A correção de um nome antes ignorado pode fazer um dado aparecer na infocaixa e não recebe marcação automática de edição menor. A retirada de um alias vazio com exibição idêntica pode receber essa marcação quando as demais condições também forem atendidas. Os ajustes exigem um artigo inteiro, uma única infocaixa pessoal principal e os campos nativos conferidos. Use <code>automaticInfoboxValues: false</code> para desligar essas duas regras. Os campos <code>sepultamento</code>, <code>enterro</code>, <code>enterro_local</code> e <code>resting_place</code> permanecem como estavam.

'''
REFERENCE_SCOPE = '''Nas etiquetas Cite, os nomes nativos são <code>name</code> e <code>group</code>. Os atributos <code>nome</code> e <code>grupo</code> podem ser corrigidos juntos quando cada etiqueta alterada tem uma definição nativa ou uma chamada nativa correspondente, com o mesmo nome e grupo. Uma definição e uma chamada que usam somente os atributos traduzidos não bastam para autorizar uma à outra.

Depois da correção, cada família precisa ter uma única definição e uma única lista correspondente depois das chamadas, sem atravessar outra região de referências. O corpo da fonte, o nome e o grupo permanecem iguais. Nomes calculados, atributos concorrentes, definições repetidas e chamadas sem uma definição confirmada impedem o reparo. O conjunto de referências precisa ser inteiramente legível. Uma predefinição que possa acrescentar fontes, inclusive por meio de uma infocaixa ou do Wikidata, pode impedir essa confirmação. Essa regra não troca o parâmetro grupo da predefinição Referências, que continua em português.'''
TABLE_SCOPE = '''Também podem ser corrigidos juntos de dois a quatro nomes digitados incorretamente de rowspan ou colspan na mesma tabela. A regra testa as combinações de corrigir ou deixar cada atributo sem efeito e exige que apenas a correção de todos forme uma grade regular. Se outra combinação também funcionar, a tabela permanece como estava. Os números, o conteúdo e a ordem das células precisam continuar iguais. Esse conjunto não é combinado com uma correção incerta de ordenação.'''


def clean(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


def once(text, old, new):
    assert text.count(old) == 1, 'Documentation anchor differs: ' + old[:100]
    return text.replace(old, new, 1)


def qa_receipt():
    raw = (ROOT / 'tests/expected_release_v2170.json').read_bytes()
    manifest = json.loads(raw)
    qa = json.loads((ROOT / 'artifacts/v2170/QA_SUMMARY.json').read_text())
    assert qa['version'] == VERSION and qa['status'] in ['passed', 'passed-with-preexisting-findings']
    assert qa['releaseManifestSha256'] == hashlib.sha256(raw).hexdigest()
    assert qa['frozenFiles'] == manifest['files']
    for name, pin in manifest['files'].items():
        content = (ROOT / 'dist/2.17.0' / name).read_bytes()
        assert len(content) == pin['bytes'] and hashlib.sha256(content).hexdigest() == pin['sha256'], name
    summary = qa['portugueseSummary']
    alert_summary = qa['alertReduction']['portugueseSummary']
    assert isinstance(summary, str) and summary.strip()
    assert isinstance(alert_summary, str) and alert_summary.strip()
    for text in [summary, alert_summary]:
        assert not re.search(r'\bPENDING\b|TODO|/' + 'Users/|/' + 'private/', text)
    for row in qa['groups']:
        assert row['status'] in ['passed', 'passed-with-preexisting-findings']
        assert isinstance(row['cases'], int) and row['cases'] >= 0
        assert isinstance(row['checks'], int) and row['checks'] >= 0
    return manifest, qa, summary, alert_summary


def main():
    manifest, qa, summary, alert_summary = qa_receipt()
    base = (ROOT / 'docs/2.16.0/Documentacao_RevisaWiki_v2_16_0.wiki').read_text()
    head, history = base.split('== Histórico das versões ==', 1)
    history, tail = history.split('== Testes e detalhes técnicos ==', 1)
    head = head.replace('2.16.0', VERSION).replace('_v2_16_0', '_' + SLUG)
    head = once(head, "A versão '''2.16''' completa campos pessoais ausentes com dados referenciados da abertura e corrige datas, listas e repetições nos campos conferidos.",
                "A versão '''2.17''' reduz os avisos da revisão e acrescenta reparos conferidos de campos de infocaixas, atributos de referências e tabelas.")
    old_report = head.split("'''Precisa de revisão'''", 1)[1].split('=== Mais ferramentas ===', 1)[0]
    head = once(head, "'''Precisa de revisão'''" + old_report, REPORT_SCOPE + '\n\n')
    head = once(head, '=== Dados da abertura e campos pessoais ===', INFOBOX_SCOPE + '=== Dados da abertura e campos pessoais ===')
    old_ref = 'Nas etiquetas Cite, os nomes nativos são name e group. Um nome ou grupo escrito em português pode ser corrigido somente quando a leitura completa das definições e chamadas locais confirma a mesma identidade, sem fontes conflitantes ou chamadas sem destino. O formato novo exige um único atributo traduzido em uma única definição. Essa regra não troca o parâmetro grupo da predefinição Referências, que continua em português.'
    head = once(head, old_ref, REFERENCE_SCOPE)
    head = once(head, 'As provas desses reparos comparam a estrutura inteira antes e depois.', TABLE_SCOPE + '\n\nAs provas desses reparos comparam a estrutura inteira antes e depois.')
    head = once(head, 'O número precisa ser literal, de 2 a 999, com um único atributo malformado por tabela e conteúdo simples na célula afetada.',
                'Nos reparos de delimitadores, a tabela precisa ter um único atributo malformado, com número literal de 2 a 999 e conteúdo simples na célula afetada. Os erros de nome conferidos podem ser corrigidos em conjunto nas condições abaixo.')
    old_grouping = head.split('=== Organização dos avisos ===', 1)[1].split('=== Destinos das citações abreviadas ===', 1)[0]
    grouping = ('\n\nPrecisa de revisão abre na primeira exibição de um resultado que tenha itens para conferir. A seção pode ser recolhida, e essa escolha permanece durante a atualização do mesmo painel. Problemas da mesma família ficam agrupados, com a quantidade de ocorrências, os locais e as opções correspondentes. Famílias diferentes continuam separadas. Cada ocorrência que tem uma proposta mantém o trecho, as alternativas e a opção de ignorá-la.\n\n'
                'Quando uma proposta já oferece a solução de um problema confirmado, o mesmo problema não recebe outra linha de aviso. Um nome fora do catálogo, sozinho, não oferece uma proposta para apagar o campo. A descrição curta retirada fica guardada em um detalhe próprio dentro de Precisa de revisão. O texto pode ser consultado ou aproveitado no Wikidata, sem ocupar a mensagem principal de ajustes. Esse agrupamento não modifica a contagem dos ajustes aplicados.\n\n')
    head = once(head, old_grouping, grouping)
    old_preview = 'Se a consulta online falhar, Precisa de revisão oferece Mostrar previsão. O aviso informa que a conferência ficou incompleta, sem afirmar que o artigo tem um erro ou que a consulta terminou.'
    head = once(head, old_preview, 'Se a consulta online falhar, a conferência fica incompleta, sem acrescentar um erro do artigo em Precisa de revisão. Use Mostrar previsão no editor para conferir a página.')
    head = once(head, '| <code>automaticParameterDuplicates</code>, <code>automaticParameterNames</code>, <code>automaticEmptyParameters</code> ||',
                '| <code>automaticInfoboxValues</code> || Acentos de campos nativos e aliases vazios com exibição idêntica.\n|-\n| <code>automaticParameterDuplicates</code>, <code>automaticParameterNames</code>, <code>automaticEmptyParameters</code> ||')
    pos = history.index('=== 2.16.0 ===')
    new_history = history[:pos] + '=== 2.17.0 ===\n\n' + FEATURES + '\n\n' + history[pos:]
    old_summary = tail.split('\n\n', 2)[1]
    assert old_summary.startswith('Os arquivos finais da versão 2.16.0 passaram')
    tail = once(tail, old_summary, summary + '\n\n' + alert_summary)
    tail = tail.replace('docs/2.15.0/Relatorio_testes_RevisaWiki_v2_15_0.txt Relatório de testes 2.15.0',
                        'docs/2.17.0/Relatorio_testes_RevisaWiki_v2_17_0.txt Relatório de testes 2.17.0')
    tail = tail.replace('docs/2.15.0/Referencia_tecnica_RevisaWiki_v2_15_0.txt',
                        'docs/2.17.0/Referencia_tecnica_RevisaWiki_v2_17_0.txt')
    manual = clean(head) + '== Histórico das versões ==' + new_history + '== Testes e detalhes técnicos ==' + clean(tail)
    prior_history = lambda text: text.split('=== 2.16.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    assert prior_history(manual) == prior_history(base), 'Published history must remain byte-identical'
    out = ROOT / 'docs/2.17.0'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'Documentacao_RevisaWiki_v2_17_0.wiki').write_text(manual)
    installation = (ROOT / 'docs/2.16.0/Instalacao_RevisaWiki_v2_16_0.txt').read_text().replace('2.16.0', VERSION).replace('_v2_16_0', '_' + SLUG)
    installation = once(installation, 'mesmo que a 2.15.1 já esteja instalada', 'mesmo que a 2.16.0 já esteja instalada')
    old_steps = installation.split('ATUALIZAR A DISTRIBUIÇÃO\n\n', 1)[1].split('\n\nAtualize os dados', 1)[0]
    steps = old_steps.splitlines()
    assert len(steps) == 6
    steps[3], steps[4] = '4. ' + steps[4][3:], '5. ' + steps[3][3:]
    installation = once(installation, old_steps, '\n'.join(steps))
    start = installation.index('Os arquivos finais da versão 2.17.0 passaram')
    end = installation.index('\n\n', start)
    installation = installation[:start] + summary + '\n\n' + alert_summary + installation[end:]
    install_report = ('O relatório Precisa de revisão mostra somente problemas confirmados no rascunho final e propostas que ainda correspondem ao trecho. Problemas repetidos ficam agrupados, com todos os locais e escolhas acessíveis. Avisos antigos, lacunas de catálogo e consultas opcionais incompletas não são apresentados como erros do artigo. Esse filtro não altera o código nem desliga as proteções de conteúdo.\n\n')
    installation = once(installation, 'Se o painel não aparecer, confira os destinos', install_report + 'Se o painel não aparecer, confira os destinos')
    (out / 'Instalacao_RevisaWiki_v2_17_0.txt').write_text(clean(installation))
    (out / 'Resumo_atualizacao_RevisaWiki_v2_17_0.txt').write_text('RevisaWiki 2.17: revisão sem avisos antigos e reparos conferidos de infocaixas, referências e tabelas.\n')
    (out / 'Resumo_documentacao_RevisaWiki_v2_17_0.txt').write_text('Documentação do RevisaWiki 2.17.0: revisão, reparos, limites e instalação.\n')
    (out / 'Notas_da_versao_RevisaWiki_v2_17_0.txt').write_text(clean('RevisaWiki 2.17.0\n16 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + summary + '\n\n' + alert_summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
    (out / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.17.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga os quatro cartões: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
    scope = INFOBOX_SCOPE + REFERENCE_SCOPE + '\n\n' + TABLE_SCOPE
    scope = re.sub(r'</?code>|</?nowiki>', '', scope).replace('=== Acentos e aliases vazios de infocaixas ===\n\n', '')
    technical = ('RevisaWiki 2.17.0: referência técnica\n16 de outubro de 2026\n\n'
                 'A reconstrução parte da distribuição 2.16.0 fixada por SHA-256 e aplica os módulos de src/v2_17. Os arquivos históricos permanecem intactos. Cada plano de reparo fica vinculado ao código de entrada e ao resultado previsto.\n\n' +
                 scope + '\n\nO relatório visível é calculado a partir do rascunho final. Os resultados técnicos originais permanecem disponíveis aos testes. Agrupar ou ocultar um aviso não altera o código, as referências, as recusas de reparo nem a verificação de preservação. A origem de cada proposta e suas posições precisam continuar válidas antes de uma escolha ser aplicada.\n\n' +
                 'As famílias de acentos e aliases vazios estão fixadas em src/v2_17/infobox_contract_review.json. As fontes nativas e as comparações de referências e tabelas ficam em tests/v217/native. Os testes novos usam exemplos fictícios e executam o programa publicado, sem inserir auxiliares no código.\n\n' +
                 summary + '\n\n' + alert_summary + '\n')
    (out / 'Referencia_tecnica_RevisaWiki_v2_17_0.txt').write_text(clean(technical))
    lines = ['RevisaWiki 2.17.0: resultados dos testes', '16 de outubro de 2026', '', summary, '', alert_summary, '']
    for row in qa['groups']:
        suffix = ', sem falhas.' if row['status'] == 'passed' else ', com ' + str(row.get('preexistingFindings', 0)) + ' ocorrências idênticas às da versão anterior e nenhuma regressão nova.'
        cases, checks = (f"{row[key]:,}".replace(',', '.') for key in ['cases', 'checks'])
        quantities = []
        if row['cases']:
            quantities.append(cases + (' caso' if row['cases'] == 1 else ' casos'))
        if row['checks']:
            quantities.append(checks + (' verificação' if row['checks'] == 1 else ' verificações'))
        lines.append('- ' + row['label'] + ': ' + (' e '.join(quantities) if quantities else 'sem contagem de casos ou verificações') + suffix)
    lines += ['', 'Casos sintéticos e execuções nas duas distribuições não são artigos distintos. Os resultados e hashes ficam em tests/evidence/2.17.0. Os comprovantes nativos anteriores mantêm sua origem e não são contados como consultas novas.', '', 'Arquivos executados', '']
    for name, proof in manifest['files'].items():
        lines += [name + ': ' + str(proof['bytes']) + ' bytes', 'SHA-256: ' + proof['sha256']]
    lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
    (out / 'Relatorio_testes_RevisaWiki_v2_17_0.txt').write_text(clean('\n'.join(lines)))
    assert len(list(out.iterdir())) == 8
    print(json.dumps({'version': VERSION, 'documentationFiles': 8, 'releaseManifestSha256': qa['releaseManifestSha256']}))


if __name__ == '__main__':
    main()
