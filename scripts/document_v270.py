"""Write the complete 2.7.0 manual from current, passed QA evidence."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.6.2', ROOT / 'docs/2.7.0'
QA_PATH = ROOT / 'artifacts/v270/RELEASE_QA_SUMMARY.json'
if not QA_PATH.exists():
    QA_PATH = ROOT / 'tests/evidence/2.7.0/RELEASE_QA_SUMMARY.json'
QA = json.loads(QA_PATH.read_text())
assert QA['status'] == 'passed' and QA['version'] == '2.7.0'
MANIFEST = json.loads((ROOT / 'tests/expected_release_v270.json').read_text())
assert QA['frozenFiles'] == MANIFEST['files']
OUT.mkdir(parents=True, exist_ok=True)

FEATURES = '''* Comparação de artigos grandes com mudanças locais separadas, sem contar um bloco extenso como se fosse uma única correção.
* Resultado com os tipos de ajuste que permaneceram no texto. O número de blocos pertence à comparação e não é apresentado como total de correções.
* Retirada de nomes de portais literalmente repetidos em chamadas simples de Portal3, preservando a ordem dos demais.
* Reunião de chamadas DEFAULTSORT exatamente iguais no bloco final, com manutenção da última chamada.
* Retirada de um campo vazio duplicado de infocaixa quando a última ocorrência do mesmo campo está preenchida.
* Reutilização de referências nomeadas com conteúdo exatamente igual, quando todas as definições e chamadas podem ser conferidas juntas.
* Retirada dos botões adicionais Editar aqui das seções. Ajustar código continua no editor de código-fonte.
* Limpeza de cercas externas com os rótulos wiketext e wikitex e de marcas exatas de citação copiadas de chats, com preservação de referências e exemplos.
* Programa, dados e carregador central na versão 2.7.0. A chamada fixa do common.js permanece igual.'''
SUMMARY = QA['portugueseSummary']


def active_versions(text):
    return text.replace('2.6.2', '2.7.0').replace('_v2_6_2', '_v2_7')


original = (BASE / 'Documentacao_RevisaWiki_v2_6_2.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head = active_versions(head)
head = head.replace('Na 2.7.0, a leitura das aspas', 'Desde a 2.6.2, a leitura das aspas')
old_intro = "A versão '''2.7.0''' corrige a leitura de aspas em citações e ligações externas quando há etiquetas ou atributos de tabelas por perto. Esse erro podia marcar tabelas completas como incompletas e limitar os ajustes. As aspas e o texto do artigo são preservados. O programa, os dados e a versão esperada no carregador central passam a '''2.7.0'''."
new_intro = "A versão '''2.7.0''' melhora a comparação de artigos grandes e acrescenta reparos de duplicação em infocaixas, portais, ordenação de categorias e referências. O resultado informa os tipos de ajuste que ficaram no texto. Um bloco da comparação pode conter muitas mudanças e deixa de funcionar como contador de correções."
assert old_intro in head
head = head.replace(old_intro, new_intro)
old_result = "'''Ajustes aplicados''' informa quantos trechos mudaram. Ao lado, o contador mostra a diferença de tamanho em bytes. Aumentos aparecem em verde, reduções em vermelho e saldo zero em cinza, sempre com sinal e descrição que dispensam a leitura da cor. Um saldo zero também pode conter mudanças."
new_result = "'''Ajustes aplicados''' informa os tipos de ajuste que permaneceram no texto, como referências ou tabelas. A contagem é refeita depois das escolhas da comparação. Os blocos do diff não representam a quantidade de correções. Ao lado, o saldo em bytes mostra quanto o texto cresceu ou diminuiu. Aumentos aparecem em verde, reduções em vermelho e saldo zero em cinza, sempre com sinal e descrição que dispensam a leitura da cor. Um saldo zero também pode conter mudanças."
assert old_result in head
head = head.replace(old_result, new_result)
copy_anchor = 'Cercas de Markdown que envolvem um artigo inteiro reconhecido podem ser retiradas quando têm abertura e fechamento compatíveis. Blocos internos, exemplos de programação e cercas incompletas permanecem. A retirada conserva o código do artigo dentro delas.'
assert head.count(copy_anchor) == 1
head = head.replace(copy_anchor, copy_anchor + '\n\nA limpeza também reconhece os erros exatos de rótulo wiketext e wikitex. Marcas completas de citação deixadas ao exportar uma resposta de chat podem ser retiradas da prosa comum quando pertencem aos formatos conferidos. Referências, títulos, URLs, código, citações e exemplos ficam protegidos. Palavras como ChatGPT, Claude e Gemini não são apagadas por essa regra.')
start = head.index('=== Edição rápida na página de leitura ===')
end = head.index('=== Preparar a discussão de um artigo ===', start)
head = head[:start] + """=== Edição de seções ===

Os botões adicionais '''Editar aqui''' foram retirados na 2.7. Para editar uma seção, use a ligação '''editar''' da própria Wikipédia. No editor de código-fonte, o painel mantém '''Ajustar código''', a comparação, o resumo automático e '''Desfazer ajustes'''.

As regras que exigem o artigo inteiro continuam desligadas na edição de uma seção. Isso evita acrescentar portais no meio do texto ou alterar referências cujo uso depende de outro trecho. A publicação usa os controles do editor da Wikipédia.

""" + head[end:]
head = head.replace("Na página de leitura, '''Editar aqui''' aparece nos controles de seção compatíveis. ", '')
head = head.replace('Na edição rápida, somente o clique em Publicar alterações inicia o envio. A decisão de publicar continua com o editor.', 'A decisão de publicar continua com o editor, pelos controles da Wikipédia.')
addition = '''=== Duplicações tratadas na 2.7 ===

Em uma chamada simples de Portal3, o programa retira as repetições literais e mantém a primeira ocorrência. A regra também compõe essa limpeza com a conversão já existente de Portal para Portal3. Os demais portais ficam na mesma ordem. Chamadas com campos nomeados, opções, posições vazias ou valores calculados ficam como estão.

Chamadas DEFAULTSORT exatamente iguais podem ser reunidas quando pertencem ao bloco final confirmado. A última chamada permanece. Chaves diferentes, opções e chamadas calculadas não recebem essa limpeza.

Em uma infocaixa reconhecida, um campo vazio anterior pode ser retirado quando a última ocorrência do mesmo nome contém um valor literal preenchido. A regra não retira um campo vazio que esteja por último, não escolhe entre dois valores preenchidos e não trata comentários como conteúdo vazio.

Referências com nomes diferentes podem passar a usar uma única definição quando o conteúdo é exatamente igual ou fica igual após as conversões de citações já conferidas. Todos os campos, a pontuação e os localizadores entram nessa comparação. A conferência exige nomes estáticos, definições sem conflito, o mesmo grupo e a mesma região de lista. Todas as chamadas precisam ser atualizadas juntas. Referências com páginas diferentes, continuação, conteúdo calculado ou limites incertos permanecem separadas.

As quatro regras exigem o artigo inteiro no domínio principal. Comentários, exemplos literais e discussões assinadas permanecem protegidos.

'''
anchor = '== Citações e parâmetros =='
assert head.count(anchor) == 1
head = head.replace(anchor, addition + anchor)
old_history_start = history.index('=== 2.6.2 ===')
history = history[:old_history_start] + '=== 2.7.0 ===\n' + FEATURES + '\n\n' + history[old_history_start:]
tail = active_versions(tail)
start = tail.index('Os arquivos finais da 2.7.0 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + SUMMARY + tail[end:]
manual = head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail
manual = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', manual)
(OUT / 'Documentacao_RevisaWiki_v2_7.wiki').write_text(manual)

installation = active_versions((BASE / 'Instalacao_RevisaWiki_v2_6_2.txt').read_text())
start = installation.index('Os arquivos finais da 2.7.0 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + SUMMARY + installation[end:]
assert installation.count('Atualize-o mesmo que os dados da 2.6.1 já estejam instalados.') == 1
installation = installation.replace('Atualize-o mesmo que os dados da 2.6.1 já estejam instalados.', 'Atualize-o junto do núcleo, mesmo que a 2.6.2 já esteja instalada.')
installation = installation.replace('Os links Editar aqui continuam nos controles das seções.', 'Os botões adicionais Editar aqui foram retirados. Os links de edição da própria Wikipédia permanecem.')
installation = installation.replace('Na edição rápida, somente Publicar alterações inicia um envio por clique deliberado.', 'A publicação usa os controles do editor da Wikipédia.')
(OUT / 'Instalacao_RevisaWiki_v2_7.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_7.txt').write_text('RevisaWiki 2.7: novas limpezas de duplicação, comparação de artigos grandes e relatório dos ajustes mantidos.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_7.txt').write_text('Documentação do RevisaWiki 2.7, com novas regras de duplicação, comparação, instalação e histórico das versões.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_7.txt').write_text('RevisaWiki 2.7.0\n15 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + SUMMARY + '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
(OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.7.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = '''RevisaWiki 2.7.0: referência técnica
Programa e dados: 2.7.0
15 de outubro de 2026

A reconstrução usa os arquivos 2.6.2 conferidos por SHA-256 e aplica os módulos de src/v2_7. As versões anteriores permanecem intactas. O conteúdo dos catálogos não muda. Os dados, o núcleo e o carregador central precisam declarar a mesma versão.

O comparador separa mudanças locais com limites de trabalho. As escolhas continuam respeitando campos indivisíveis e famílias de referências. Se não houver precisão suficiente para medir os bytes inseridos e retirados separadamente, o saldo total continua exato e a edição não recebe marcação automática de menor com base nessa estimativa.

O resultado usa os tipos de ajuste presentes na diferença final. Os contadores internos de passagens não são somados como se fossem correções independentes. Rejeitar escolhas, desfazer ou modificar o rascunho precisa atualizar ou invalidar a apresentação anterior.

As novas regras exigem estruturas estáticas e provas vinculadas ao texto de entrada. As remoções de duplicações não autorizam apagar valores preenchidos distintos, interpretar nomes semelhantes como iguais ou reunir referências separadas por grupos ou listas diferentes.

As chamadas fixas do common.js permanecem idênticas. A atualização substitui os dados, o núcleo e o carregador central. Nenhuma rotina de instalação publica na Wikipédia.

'''
(OUT / 'Referencia_tecnica_RevisaWiki_v2_7.txt').write_text(technical + SUMMARY + '\n\n' + manual)
lines = ['RevisaWiki 2.7.0: resultados dos testes', '15 de outubro de 2026', '', SUMMARY, '', 'Execuções nos arquivos finais', '']
for group in QA['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.7.0. A seleção inclui artigos extensos e assuntos diferentes. Os testes conferem idempotência, preservação das fontes e dos dados de tabelas, limites de atuação e falsos positivos.', '', 'As medições de tempo são locais e variam com a carga da máquina. Os testes dos navegadores usam páginas locais e respostas controladas. Eles não demonstram todas as combinações possíveis de extensões ou editores em produção.', '', 'Arquivos executados', '']
for name, pin in MANIFEST['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.', '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_7.txt').write_text('\n'.join(lines))
print(json.dumps({'version': '2.7.0', 'documentationFiles': len(list(OUT.iterdir()))}))
