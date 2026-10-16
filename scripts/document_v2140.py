"""Prepare the 2.14.0 manual from completed release-bound evidence."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/2.14.0'
FEATURES = '''* Adapta chamadas reconhecidas de uma enciclopédia importada para Citar enciclopédia, preservando os dados da obra e as indicações de domínio público. A conversão evita as categorias de manutenção estrangeiras geradas pelo modelo antigo.
* Corrige alinhar e alinhar_fonte em Caixa de citação para os nomes nativos correspondentes, quando o valor e a ausência de conflitos confirmam a mudança.
* Recupera campos importados do inglês, espanhol, francês e alemão dentro de infocaixas nativas reconhecidas de medicamentos e substâncias químicas, sem converter unidades nem alterar valores.
* Reduz linhas vazias excedentes entre parágrafos comuns a uma linha vazia, preservando exemplos e estruturas em que o espaçamento pode ter outra função.
* Retira a comparação própria do painel. Mostrar alterações abre o controle nativo do editor quando ele está disponível.
* Agrupa sugestões repetidas pela mesma predefinição e pelo mesmo parâmetro, com a quantidade de ocorrências e os detalhes de cada uma.
* Abre Precisa de revisão por padrão e respeita a escolha de recolher essa seção.
* Guarda a descrição curta retirada em um detalhe dentro de Precisa de revisão, fora da lista principal de ajustes. Avisos genéricos de preservação e sugestões de trocar listas Vancouver válidas deixam de ocupar o relatório.'''

USE = """== Usar, conferir e desfazer ==

# Abra '''Editar código-fonte''' e clique em '''Ajustar código'''. Os ajustes seguros entram no rascunho ao terminar a análise.
# Use '''Mostrar alterações''' do editor para conferir o resultado. O painel oferece um atalho com o mesmo nome quando encontra esse controle nativo.
# Confira a pré-visualização normal da Wikipédia e salve quando terminar de revisar.

O botão '''Ajustar código''' fica no painel superior. No editor clássico e nas integrações reconhecidas de CodeMirror, há outro botão com o mesmo nome e o mesmo verde antes de '''Publicar página''' ou '''Publicar alterações'''. Os dois executam a mesma ação. No editor de código-fonte de 2017, use o botão superior.

'''Desfazer ajustes''' recupera o texto anterior enquanto a alteração ainda pertence à execução atual. Se você editar manualmente o rascunho depois da análise, o resultado antigo não pode sobrescrever essa edição. O resumo acompanha apenas as mudanças mantidas.

Durante o processamento, o painel mostra o andamento e oferece '''Cancelar análise'''. O texto só entra no editor quando o cálculo termina e o rascunho continua sendo o mesmo. O painel não tem uma comparação própria nem seleção de blocos. Se o editor não oferecer um controle nativo reconhecido de Mostrar alterações, o atalho fica oculto. Ele nunca usa Publicar como alternativa.

=== Relatório ===

'''Ajustes aplicados''' conta as correções que permaneceram no texto. Cada ligação simplificada, parâmetro corrigido ou cabeçalho ajustado conta separadamente. A troca do nome de uma predefinição e de três parâmetros conta como quatro correções. Um par de delimitadores que faz uma única conversão conta uma vez. A adaptação completa de uma citação enciclopédica reconhecida conta uma vez. A redução de uma sequência de linhas vazias conta como um ajuste de espaçamento.

Ao lado, o saldo em bytes mostra quanto o texto cresceu ou diminuiu. Aumentos aparecem em verde, reduções em vermelho e saldo zero em cinza, sempre com sinal e descrição que dispensam a leitura da cor. Um saldo zero também pode conter mudanças.

'''Precisa de revisão''' reúne os problemas atuais confirmados e as propostas que ainda dependem de uma escolha. A seção começa aberta e respeita a escolha de recolhê-la. Ocorrências do mesmo parâmetro na mesma predefinição ficam agrupadas, com seus trechos e opções individuais. A descrição curta retirada fica em um detalhe para consulta dentro dessa seção.

Resultados antigos e avisos genéricos de que um trecho foi preservado deixam de formar outras seções do painel. Essa redução de avisos não autoriza mudanças em código ambíguo. O programa mantém o trecho quando não consegue confirmar o reparo. Erros confirmados de referências ou de outros elementos continuam visíveis.

=== Mais ferramentas ===

'''Conferir tudo''' lê o código, as tabelas e as datas, depois consulta a pré-visualização, os destinos das ligações e as edições posteriores à revisão aberta. Esse comando não modifica o texto nem o resumo. As consultas também podem ser executadas separadamente.

'''Conferir outras grafias''' abre as escolhas ortográficas e as possíveis palavras repetidas. '''Configurações''' reúne os grupos de ajuste, as opções de ortografia e '''Sobre e diagnóstico'''.

=== Edição de seções ===

Para editar uma seção, use a ligação '''editar''' da própria Wikipédia. O painel mantém Ajustar código, o resumo automático e Desfazer ajustes. A comparação usa Mostrar alterações do editor. Não há botões adicionais Editar aqui.

As regras que exigem o artigo inteiro continuam desligadas na edição de uma seção. Isso evita acrescentar portais no meio do texto ou alterar referências cujo uso depende de outro trecho. A publicação usa os controles do editor da Wikipédia.

"""

SCOPE = '''=== Campos importados de medicamentos e substâncias químicas ===

A versão 2.14 confere campos em inglês, espanhol, francês e alemão que tenham sido colocados dentro de chamadas nativas reconhecidas. O nome estrangeiro pode passar ao nome aceito pela ptwiki quando os dois campos têm a mesma função e o valor segue o formato conferido. As chamadas reconhecidas incluem Info/Droga, Info/Química e determinadas seções nativas de Chembox.

Os nomes de campos que já funcionam permanecem iguais, mesmo quando estão em inglês. A regra não traduz nomes de substâncias, não muda números ou unidades, não calcula a massa molar e não procura fatos para preencher a caixa. Campos repetidos ou concorrentes impedem a escolha automática daquele valor. Um produto comercial não passa a ser uma substância química apenas por usar uma infocaixa estrangeira.

Quando um campo acrescenta um prefixo ao identificador exibido, a troca por outro que mostre o valor literalmente exige uma correspondência conferida para esse formato. Valores codificados, como letras que escolhem descrições prontas, exigem uma correspondência própria. Campos sem destino confirmado permanecem no código. Isso inclui dados clínicos para os quais a infocaixa nativa escolhida não tem um campo equivalente.

=== Linhas vazias na prosa ===

Entre parágrafos comuns de um artigo, duas ou mais linhas vazias podem passar a uma única linha vazia. A separação dos parágrafos permanece. O programa só retira linhas completamente vazias e confere novamente o resultado depois das outras limpezas, para não exigir outro clique quando a retirada de uma marca ou predefinição deixa um espaço excedente. Linhas que contêm espaços ou tabulações, o início e o fim da página e trechos com quebras de linha de formatos misturados ficam como estão.

As linhas dentro de predefinições, referências, tabelas, citações, exemplos, código, poemas, ligações e elementos HTML permanecem intactas. Limites de listas, texto pré-formatado e outros elementos de apresentação também impedem a mudança. A regra exige o artigo inteiro e uma estrutura completa. Não retira espaçamento de conversas nem de documentação de predefinições.

=== Citações enciclopédicas importadas ===

Uma chamada reconhecida de Cite NSRW pode passar a Citar enciclopédia quando contém um wstitle literal e não vazio, sem parâmetros repetidos ou desconhecidos. O programa torna explícitos os dados que o modelo antigo já fornecia e mantém o verbete, o rótulo e as opções de forma curta reconhecidas. As ligações para a obra e o verbete passam a indicar a Wikisource em inglês. Quando a chamada contém uma indicação explícita de aproveitamento de texto em domínio público, essa indicação permanece em português.

As duas categorias de manutenção em inglês deixam de ser geradas porque o artigo passa a usar a citação nativa. A regra não apaga categorias avulsas nem procura nomes de categorias para removê-los. Chamadas sem wstitle, com campos bibliográficos adicionais, valores calculados ou opções fora da lista conferida permanecem intactas. Os modelos e módulos usados na verificação têm suas revisões registradas no código e nos testes.

A substituição completa desse modelo conta como uma adaptação de citação. Os dados antes implícitos não são contados como fatos novos. Como a mudança também corrige o destino de uma ligação, ela não recebe classificação automática de edição menor.

=== Alinhamento das caixas de citação ===

Em Caixa de citação, alinhar pode passar a posição e alinhar_fonte pode passar a posição-autor. A mudança fica limitada aos valores literais de esquerda, direita e centro, em português ou inglês. O valor none também é aceito para a posição da caixa. Nomes e valores nativos que já funcionam continuam como estão.

Um parâmetro repetido ou outro nome concorrente para o mesmo alinhamento impede a conversão desse campo. O programa não escolhe entre valores conflitantes nem interpreta instruções de estilo. Cada nome corrigido conta como um ajuste. O texto citado, a fonte, as referências e as quebras de parágrafo precisam permanecer preservados. A conferência também conserva a ordem dos campos repetidos, pois o último valor pode determinar o que a página exibe.

=== Organização dos avisos ===

Precisa de revisão abre na primeira exibição de um resultado que tenha itens para conferir. A seção pode ser recolhida, e essa escolha permanece durante a atualização do mesmo painel. As sugestões do mesmo parâmetro na mesma predefinição aparecem em um grupo com sua quantidade. Cada ocorrência mantém o trecho, as alternativas e a opção de ignorá-la. Parâmetros diferentes, predefinições diferentes e erros de referências não são fundidos em um único aviso.

Quando uma sugestão já apresenta um parâmetro desconhecido, o mesmo aviso não é repetido na lista ao lado. A descrição curta retirada fica guardada em um detalhe próprio dentro de Precisa de revisão. O texto pode ser consultado ou aproveitado no Wikidata, sem ocupar a mensagem principal de ajustes. Esse agrupamento não modifica a contagem dos ajustes aplicados.

'''


def active(text):
    return text.replace('2.13.0', '2.14.0').replace('_v2_13_0', '_v2_14_0')


def single(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


def main():
    pin_path = ROOT / 'tests/expected_release_v2140.json'
    manifest = json.loads(pin_path.read_text())
    qa = json.loads((ROOT / 'artifacts/v2140/RELEASE_QA_SUMMARY.json').read_text())
    assert qa['version'] == '2.14.0' and qa['status'] == 'passed'
    assert qa['releaseManifestSha256'] == hashlib.sha256(pin_path.read_bytes()).hexdigest()
    assert qa['frozenFiles'] == manifest['files']
    summary = qa['portugueseSummary']
    base = (ROOT / 'docs/2.13.0/Documentacao_RevisaWiki_v2_13_0.wiki').read_text()
    head, history = base.split('== Histórico das versões ==', 1)
    history, tail = history.split('== Testes e detalhes técnicos ==', 1)
    head, tail = active(head), active(tail)
    head, count = re.subn(r"A versão '''2\.14\.0'''[^\n]+",
        "A versão '''2.14.0''' recupera campos importados de medicamentos e substâncias químicas, adapta uma citação enciclopédica importada e corrige alinhamentos de caixas de citação. Também reduz linhas vazias excedentes na prosa comum. O relatório reúne os itens atuais de revisão, e a comparação passa a usar Mostrar alterações do editor.", head, count=1)
    assert count == 1
    old_use, after_use = head.split('== Usar, conferir e desfazer ==', 1)
    _, remaining = after_use.split('=== Preparar a discussão de um artigo ===', 1)
    head = old_use + USE + '=== Preparar a discussão de um artigo ===' + remaining
    head = head.replace('Você pode comparar o resultado, rejeitar mudanças ou desfazer a execução.', 'Você pode conferir o resultado em Mostrar alterações do editor e desfazer a execução.')
    head = head.replace("Confira o texto em '''Ver o que mudou'''", "Confira o texto em '''Mostrar alterações''' do editor")
    head = head.replace('para que a comparação não separe ou perca informações.', 'para não separar nem perder informações.')
    head = head.replace('A comparação mostra a troca', 'Mostrar alterações do editor mostra a troca')
    head = head.replace('com comparação e opção de desfazer', 'com conferência em Mostrar alterações do editor e opção de desfazer')
    head = head.replace('Leia a comparação e a pré-visualização normal', 'Confira Mostrar alterações do editor e a pré-visualização normal')
    head = head.replace('Se a consulta online falhar, uma indicação discreta oferece Mostrar previsão. A falha não entra na contagem de problemas do artigo nem é apresentada como uma conferência bem-sucedida.', 'Se a consulta online falhar, Precisa de revisão oferece Mostrar previsão. O aviso informa que a conferência ficou incompleta, sem afirmar que o artigo tem um erro ou que a consulta terminou.')
    head = re.sub(r'Quando outros ajustes dependem[^\n]+', 'Quando reparos dependem uns dos outros, o programa exige que o conjunto preserve as referências e os demais dados. Se não consegue confirmar isso, mantém o conjunto anterior. Desfazer ajustes recupera o rascunho completo anterior.', head)
    assert head.count('=== Destinos das citações abreviadas ===') == 1
    head = head.replace('=== Destinos das citações abreviadas ===', SCOPE + '=== Destinos das citações abreviadas ===', 1)
    history_intro, published_history = history.split('=== 2.13.0 ===', 1)
    new_history = history_intro + '=== 2.14.0 ===\n' + FEATURES + '\n\n=== 2.13.0 ===' + published_history
    start = tail.index('Os arquivos finais da 2.14.0 passaram')
    end = tail.index('\n\n', start)
    tail = tail[:start] + summary + tail[end:]
    manual = single(head + '== Histórico das versões ==' + new_history + '== Testes e detalhes técnicos ==' + tail)
    assert manual.split('=== 2.13.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0] == base.split('=== 2.13.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'Documentacao_RevisaWiki_v2_14_0.wiki').write_text(manual)
    installation = active((ROOT / 'docs/2.13.0/Instalacao_RevisaWiki_v2_13_0.txt').read_text())
    installation = installation.replace('mesmo que a 2.12.0 já esteja instalada.', 'mesmo que a 2.13.0 já esteja instalada.')
    installation = installation.replace('A comparação e Desfazer ajustes ficam no painel.', 'Desfazer ajustes fica no painel. Mostrar alterações usa o controle nativo do editor, com atalho no painel somente quando esse controle está disponível.')
    installation = installation.replace('Confira a comparação e a pré-visualização antes de publicar', 'Confira Mostrar alterações do editor e a pré-visualização antes de publicar')
    start = installation.index('Os arquivos finais da 2.14.0 passaram')
    end = installation.index('\n\n', start)
    (OUT / 'Instalacao_RevisaWiki_v2_14_0.txt').write_text(single(installation[:start] + summary + installation[end:]))
    (OUT / 'Resumo_atualizacao_RevisaWiki_v2_14_0.txt').write_text('RevisaWiki 2.14.0: campos importados de medicamentos e química, citações, alinhamentos, linhas vazias e relatório simplificado.\n')
    (OUT / 'Resumo_documentacao_RevisaWiki_v2_14_0.txt').write_text('Documentação do RevisaWiki 2.14.0: correções, relatório, limites e instalação.\n')
    (OUT / 'Notas_da_versao_RevisaWiki_v2_14_0.txt').write_text(single('RevisaWiki 2.14.0\n16 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
    (OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.14.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
    technical = '''RevisaWiki 2.14.0: referência técnica
16 de outubro de 2026

A reconstrução parte dos sete arquivos fixados da distribuição 2.13.0 e aplica os módulos de src/v2_14. Os arquivos históricos permanecem intactos. Dados, núcleo e carregador central declaram 2.14.0. As duas chamadas fixas continuam idênticas.

Os reparos de caixas de citação trocam apenas os nomes dos campos de alinhamento com valores literais reconhecidos. A prova do texto original conserva os valores, a ordem dos campos repetidos e as quebras de parágrafo. Os testes rejeitam alterações no texto citado, na fonte ou no alinhamento que não façam parte do reparo.

Os campos de medicamentos e substâncias químicas usam correspondências conferidas no código nativo e nas origens em quatro idiomas. As regras recuperam nomes de campos dentro de chamadas já nativas. Não fazem uma migração geral de infocaixas estrangeiras, não convertem unidades e não inferem dados clínicos ausentes. A conservação inclui os valores completos e a precedência dos campos repetidos.

O reparo de linhas vazias troca somente sequências literais entre prosa comum ou títulos, fora de qualquer estrutura protegida. Uma linha vazia permanece. A regra não altera linhas que contêm espaços, código, citações ou elementos de apresentação.

A adaptação enciclopédica exige uma chamada literal de Cite NSRW com wstitle não vazio e opções reconhecidas. Ela torna explícitos os mesmos dados bibliográficos, conserva o aproveitamento de texto em domínio público quando indicado e corrige o destino de idioma das ligações. Não remove categorias globalmente. Campos desconhecidos ou repetidos impedem a conversão.

O agrupamento dos avisos usa a identidade do parâmetro e da predefinição fornecida pelo próprio produtor da sugestão. Não compara trechos de texto para tentar adivinhar se avisos diferentes pertencem ao mesmo caso. Cada ocorrência conserva suas alternativas, seu trecho e seu controle de descarte.

A interface deixa de construir o diff próprio e de oferecer seleção de blocos ou preparação antes de aplicar. O atalho Mostrar alterações aciona apenas um controle nativo wpDiff reconhecido dentro de editform. Não há alternativa por submissão genérica ou botão de publicação. Os testes da interface antiga que exigiam os recursos retirados têm sua substituição registrada. Os demais controles de aplicação, desfazer, contagens, resumo e Worker continuam cobertos.

As regras anteriores continuam ativas, com os mesmos limites para tabelas, referências, biografias e portais. As colunas continuam limitadas a listas com pelo menos dez referências ou seis itens nas listas finais reconhecidas.

Os testes herdados são executados contra os arquivos novos com adaptações registradas. Os arquivos históricos permanecem intactos. Quando a nova regra de espaçamento muda uma expectativa positiva, o exemplo novo fica separado, com a diferença literal e os hashes antes e depois. As verificações de conteúdo e de falsos positivos permanecem ativas. Os ensaios dos navegadores usam páginas locais e Worker real. As projeções nativas de trechos usam respostas de consultas GET anônimas. Elas não equivalem à análise nativa de artigos inteiros.

'''
    (OUT / 'Referencia_tecnica_RevisaWiki_v2_14_0.txt').write_text(single(technical + summary + '\n'))
    lines = ['RevisaWiki 2.14.0: resultados dos testes', '16 de outubro de 2026', '', summary, '', 'Execuções nos arquivos finais', '']
    for group in qa['groups']:
        lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
    lines += ['', 'Casos sintéticos e permutações não são artigos distintos. Os relatórios e os hashes ficam em tests/evidence/2.14.0.', '', 'Arquivos executados', '']
    for name, proof in manifest['files'].items():
        lines += [name + ': ' + str(proof['bytes']) + ' bytes', 'SHA-256: ' + proof['sha256']]
    lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
    (OUT / 'Relatorio_testes_RevisaWiki_v2_14_0.txt').write_text(single('\n'.join(lines)))
    print(json.dumps({'version': '2.14.0', 'documentationFiles': len(list(OUT.iterdir()))}))


if __name__ == '__main__':
    main()
