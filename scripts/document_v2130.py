"""Write the 2.13 manual from completed, source-bound release evidence."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/2.13.0'
FEATURES = '''* Repõe uma aspa inicial ausente em rowspan ou colspan quando a tabela completa confirma o reparo.
* Repara um sinal de igual ausente em rowspan ou colspan nos formatos reconhecidos.
* Corrige erros de digitação conferidos nos nomes rowspan e colspan.
* Retira um atributo de ordenação repetido quando os valores são idênticos.
* Retira aspas externas de um campo que contém somente um endereço reconhecido.
* Recupera um identificador de uma ligação externa sem rótulo para o endereço oficial correspondente.
* Corrige nome e grupo para os atributos nativos name e group em referências com identidade local confirmada.
* Fecha uma referência composta somente por uma citação completa, imediatamente antes da lista final correspondente.
* Retira uma chamada ISBN colocada dentro do próprio campo isbn quando há um único identificador válido.
* Retira um sinal de igual inicial excedente em campos conferidos de endereço, data ou identificador.
* Corrige o fechamento malformado de uma referência quando a abertura correspondente está confirmada.
* Corrige aspas retas e tipográficas misturadas em rowspan ou colspan.
* Corrige erros de digitação conferidos nos nomes dos atributos nativos de ordenação.
* Conclui cadeias reconhecidas de reparos de endereços em uma aplicação, incluindo o campo arquivo-url.'''

REFERENCE_SCOPE = '''=== Aspas, identificadores e campos de referências ===

Um campo como <code>url="https://example.test/fonte"</code> pode perder somente as aspas que envolvem o endereço inteiro. A regra exige uma única URL HTTP ou HTTPS, sem rótulo, conteúdo calculado, credenciais ou conflito com outro campo da mesma função. O endereço permanece igual. As funções de endereço principal, arquivo e capítulo continuam separadas.

Um identificador escrito como ligação externa sem rótulo para seu endereço oficial pode passar ao identificador literal aceito pelo campo. A regra confere o domínio, o caminho e o formato do identificador. Não extrai números de endereços desconhecidos nem retira uma versão do identificador quando ela faz parte do original.

Uma chamada <code><nowiki>isbn={{ISBN|9780306406157}}</nowiki></code> pode ficar como <code>isbn=9780306406157</code> dentro de uma citação reconhecida. O identificador precisa ser único e passar pela verificação de seus dígitos. Outros argumentos, comentários e rótulos impedem essa retirada. A regra não retira ISBN de usos normais fora desse campo.

Um sinal de igual digitado a mais no início de um campo pode ser retirado quando o restante forma um endereço, uma data ou um identificador aceito. Por exemplo, <code>url==https://example.test/fonte</code> passa a <code>url=https://example.test/fonte</code>. Sinais de igual que pertencem à consulta de uma URL, a títulos, fórmulas ou texto comum permanecem intactos.

O reparo de protocolos repetidos também cobre arquivo-url e conclui, no mesmo clique, cadeias de dois a quatro protocolos iniciais iguais. Ele não procura endereços na internet nem modifica caminhos, parâmetros de consulta ou partes internas da URL. Uma segunda análise do resultado precisa deixá-lo como está.

=== Abertura, identidade e fechamento das referências ===

Nas etiquetas Cite, os nomes nativos são name e group. Um nome ou grupo escrito em português pode ser corrigido somente quando a leitura completa das definições e chamadas locais confirma a mesma identidade, sem fontes conflitantes ou chamadas sem destino. O formato novo exige um único atributo traduzido em uma única definição. Essa regra não troca o parâmetro grupo da predefinição Referências, que continua em português.

Um fechamento <code>&lt;/ref/&gt;</code> pode passar a <code>&lt;/ref&gt;</code> se houver uma abertura correspondente e nenhuma dúvida sobre o corpo da referência. Referências aninhadas, atributos desconhecidos, exemplos protegidos ou outro código incompleto impedem o reparo.

Há também um caso restrito de fechamento ausente: uma única referência aberta contém somente uma citação completa reconhecida e fica imediatamente antes da única lista final correspondente. Apenas espaços e quebras de linha podem separar a citação da lista. Depois da lista também só pode haver espaçamento. Texto intermediário, outra referência aberta, coletor incompatível ou citação incompleta impedem a inclusão do fechamento. O programa não decide onde termina uma referência que contenha prosa.

Quando o formato já tem uma conversão confirmada de modelo e parâmetros para a ptwiki, os novos reparos podem ser concluídos na mesma aplicação. Os testes conferem essas combinações separadamente e preservam nomes e parâmetros nativos aceitos, sem trocas feitas apenas pela aparência.

Um campo vazio pode ser retirado junto com um reparo somente quando a limpeza existente confirma essa retirada exata. Opções de apresentação ficam preservadas. Campos desconhecidos com conteúdo e valores conflitantes impedem o reparo. O relatório separa as mudanças de datas das correções de endereços, identificadores e outros campos.

Os novos reparos exigem artigo inteiro do domínio principal e conservam o conteúdo das fontes. Usam o botão Ajustar código, com comparação e opção de desfazer. Casos sem confirmação ficam como estão, sem novos avisos genéricos.

'''

TABLE_SCOPE = '''=== Erros de digitação em atributos de tabelas ===

Um atributo rowspan ou colspan pode receber o delimitador que falta ou a correção de seu nome quando houver uma única leitura confirmada para a tabela completa. Os formatos reconhecidos incluem <code>colspan=2"</code>, <code>colspan"2"</code>, <code>colpsan="2"</code> e os correspondentes de rowspan. O número precisa ser literal, de 2 a 999, com um único atributo malformado por tabela e conteúdo simples na célula afetada. A correção precisa conservar o número original e todo o conteúdo das células, com separador explícito e grade regular. O programa não acrescenta células nem completa valores.

Quando as aspas retas e tipográficas se misturam nos limites de um número, o delimitador incompatível pode ser trocado pela aspa correspondente. A regra não troca aspas na prosa, nas legendas ou nos títulos das fontes. Valores calculados, conflitos entre atributos ou mais de uma leitura possível impedem a mudança.

Em tabelas ordenáveis, a repetição idêntica de data-sort-value ou data-sort-type pode perder a cópia excedente. O atributo data-sort-type precisa conter um tipo reconhecido e estar em um cabeçalho. Valores diferentes permanecem para revisão manual. A regra conserva os bytes do atributo mantido.

Uma lista curta de erros de digitação permite corrigir nomes como <code>data-sort-vaule</code> para <code>data-sort-value</code>. A tabela precisa declarar sortable, o valor permanece igual e não pode haver um atributo correto concorrente. Um tipo de ordenação precisa ser reconhecido e estar no cabeçalho adequado. O script não escolhe chaves de ordenação nem deduz o tipo a partir dos dados.

As provas desses reparos comparam a estrutura inteira antes e depois. Uma correção de atributo não autoriza mudar valores de células, legendas ou chaves de ordenação. Casos ambíguos ficam intactos.

'''


def active(text):
    return text.replace('2.12.0', '2.13.0').replace('_v2_12_0', '_v2_13_0')


def single(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


def main():
    manifest_path = ROOT / 'tests/expected_release_v2130.json'
    manifest = json.loads(manifest_path.read_text())
    qa = json.loads((ROOT / 'artifacts/v2130/RELEASE_QA_SUMMARY.json').read_text())
    assert qa['version'] == '2.13.0' and qa['status'] == 'passed'
    assert not qa.get('failed', 0) and not qa.get('failures')
    assert qa['releaseManifestSha256'] == hashlib.sha256(manifest_path.read_bytes()).hexdigest()
    assert qa['frozenFiles'] == manifest['files']
    summary = qa['portugueseSummary']
    base = (ROOT / 'docs/2.12.0/Documentacao_RevisaWiki_v2_12_0.wiki').read_text()
    head, history = base.split('== Histórico das versões ==', 1)
    history, tail = history.split('== Testes e detalhes técnicos ==', 1)
    head, tail = active(head), active(tail)
    head, count = re.subn(r"A versão '''2\.13\.0'''[^\n]+", "A versão '''2.13.0''' acrescenta 14 melhorias aos reparos automáticos de tabelas e referências. Cada regra exige um formato reconhecido e conserva os dados originais. Os recursos das versões anteriores continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.", head, count=1)
    assert count == 1
    assert head.count('=== Destinos das citações abreviadas ===') == head.count('== Ortografia ==') == 1
    head = head.replace('=== Destinos das citações abreviadas ===', REFERENCE_SCOPE + '=== Destinos das citações abreviadas ===', 1)
    head = head.replace('== Ortografia ==', TABLE_SCOPE + '== Ortografia ==', 1)
    history = history.replace('=== 2.12.0 ===', '=== 2.13.0 ===\n' + FEATURES + '\n\n=== 2.12.0 ===', 1)
    start = tail.index('Os arquivos finais da 2.13.0 passaram')
    end = tail.index('\n\n', start)
    tail = tail[:start] + summary + tail[end:]
    manual = single(head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
    historical = lambda text: text.split('=== 2.12.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    assert historical(manual) == historical(base)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'Documentacao_RevisaWiki_v2_13_0.wiki').write_text(manual)
    installation = active((ROOT / 'docs/2.12.0/Instalacao_RevisaWiki_v2_12_0.txt').read_text())
    installation = installation.replace('mesmo que a 2.11.1 já esteja instalada.', 'mesmo que a 2.12.0 já esteja instalada.')
    start = installation.index('Os arquivos finais da 2.13.0 passaram')
    end = installation.index('\n\n', start)
    (OUT / 'Instalacao_RevisaWiki_v2_13_0.txt').write_text(single(installation[:start] + summary + installation[end:]))
    (OUT / 'Resumo_atualizacao_RevisaWiki_v2_13_0.txt').write_text('RevisaWiki 2.13.0: novos reparos automáticos de tabelas e referências, com preservação dos dados e correções encadeadas no mesmo clique.\n')
    (OUT / 'Resumo_documentacao_RevisaWiki_v2_13_0.txt').write_text('Documentação do RevisaWiki 2.13.0: reparos, limites, testes e instalação.\n')
    (OUT / 'Notas_da_versao_RevisaWiki_v2_13_0.txt').write_text(single('RevisaWiki 2.13.0\n16 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
    (OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.13.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
    technical = '''RevisaWiki 2.13.0: referência técnica
16 de outubro de 2026

A reconstrução parte dos sete arquivos fixados da distribuição 2.12.0 e aplica os módulos de src/v2_13. Os arquivos antigos permanecem intactos. Dados, núcleo e carregador central declaram 2.13.0. As duas chamadas fixas continuam idênticas.

Os novos planos são regenerados a partir do texto original e conferidos pelas provas de preservação. Um reparo de sintaxe não permite modificar o conteúdo de uma célula ou de uma fonte. Os testes comparam resultados escritos separadamente, verificam uma segunda aplicação e reconstroem o original a partir do diff.

Erros de nomes e delimitadores de atributos de tabelas têm listas finitas. A prova exige tabela completa e conserva os dados. Atributos de ordenação corrigidos também passam pelo módulo nativo de ordenação nos testes locais. Isso não representa uma reprodução completa de todas as aparências da Wikipédia.

Os reparos de campos usam os modelos e papéis conferidos para a ptwiki, incluindo formatos que já têm conversão confirmada de modelo e parâmetros. ISBN precisa passar pela verificação de dígitos. Endereços de identificadores precisam pertencer aos formatos oficiais reconhecidos. O fechamento de referências não tenta interpretar prosa. Nomes e grupos precisam manter uma ligação local sem conflito.

As cadeias de protocolos repetidos têm limite finito e validação do endereço final. O programa não executa um ciclo irrestrito de todas as regras até obter um resultado. Os limites de colunas continuam em dez referências por lista e seis itens nas listas finais reconhecidas.

Os testes de interface usam páginas locais, respostas controladas e Worker real. As consultas nativas capturadas usam GET anônimo, sem salvar. Projeções sintéticas não equivalem à análise nativa de um artigo inteiro, e casos gerados não são apresentados como artigos distintos.

'''
    (OUT / 'Referencia_tecnica_RevisaWiki_v2_13_0.txt').write_text(single(technical + summary + '\n'))
    lines = ['RevisaWiki 2.13.0: resultados dos testes', '16 de outubro de 2026', '', summary, '', 'Execuções nos arquivos finais', '']
    for group in qa['groups']:
        lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
    lines += ['', 'Casos sintéticos e permutações não são artigos distintos. Os relatórios e os hashes ficam em tests/evidence/2.13.0.', '', 'Arquivos executados', '']
    for name, pin in manifest['files'].items():
        lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
    lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
    (OUT / 'Relatorio_testes_RevisaWiki_v2_13_0.txt').write_text(single('\n'.join(lines)))
    print(json.dumps({'version': '2.13.0', 'documentationFiles': len(list(OUT.iterdir()))}))


if __name__ == '__main__':
    main()
