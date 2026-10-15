"""Write the complete 2.7.1 manual from the final, passed release evidence."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.7.0', ROOT / 'docs/2.7.1'
QA_PATH = ROOT / 'artifacts/v271/RELEASE_QA_SUMMARY.json'
if not QA_PATH.exists():
    QA_PATH = ROOT / 'tests/evidence/2.7.1/RELEASE_QA_SUMMARY.json'
QA = json.loads(QA_PATH.read_text())
assert QA['status'] == 'passed' and QA['version'] == '2.7.1'
MANIFEST = json.loads((ROOT / 'tests/expected_release_v271.json').read_text())
assert QA['frozenFiles'] == MANIFEST['files']
OUT.mkdir(parents=True, exist_ok=True)

FEATURES = '''* Corrige nomes químicos cuja notação fazia a infocaixa aparecer como código no artigo, nos campos IUPAC conferidos.
* Quebra de linha de identificadores InChI literais muito longos em infocaixas genéricas, sem cortar nem modificar o identificador.
* Preservação do nome exibido, dos dados e das referências da infocaixa. Conversões de idioma válidas, campos calculados e exemplos ficam como estão.
* Conferência dos limites da regra, da comparação e da opção de desfazer.
* Programa, dados e carregador central na versão 2.7.1. A chamada fixa do common.js permanece igual.'''
SUMMARY = QA['portugueseSummary']


def active_versions(text):
    return text.replace('2.7.0', '2.7.1').replace('_v2_7', '_v2_7_1')


original = (BASE / 'Documentacao_RevisaWiki_v2_7.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head = active_versions(head)
old_intro = "A versão '''2.7.1''' melhora a comparação de artigos grandes e acrescenta reparos de duplicação em infocaixas, portais, ordenação de categorias e referências. O resultado informa os tipos de ajuste que ficaram no texto. Um bloco da comparação pode conter muitas mudanças e deixa de funcionar como contador de correções."
new_intro = "A versão '''2.7.1''' corrige um caso em que a notação de um nome químico impede a montagem da infocaixa. A chave literal passa a usar uma entidade HTML, sem mudar o nome exibido. Também permite a quebra de linha de um identificador InChI longo que alargava a caixa no Firefox. Os reparos de duplicação e a comparação da 2.7 continuam disponíveis."
assert old_intro in head
head = head.replace(old_intro, new_intro)
anchor = '== Citações e parâmetros =='
assert head.count(anchor) == 1
addition = '''=== Nomes químicos e montagem da infocaixa ===

Um hífen seguido de uma chave de abertura pode iniciar uma conversão de idioma no MediaWiki. Quando essa sequência pertence a um nome químico e não recebe o fechamento de uma conversão, a infocaixa pode aparecer como código no artigo.

O RevisaWiki confere nome_IUPAC de Info/Droga e IUPACName ou SystematicName de Info/Química. Também confere um campo dadosN de Info ou Infocaixa quando há um único rótuloN com o texto literal Nome IUPAC. Se as chaves do nome estão pareadas e não há conversão válida, conteúdo calculado ou código protegido, a chave de abertura passa a ser escrita como entidade HTML. O texto visível continua igual.

A regra exige o artigo inteiro no domínio principal. Campos duplicados ou ambíguos, exemplos, discussões, fórmulas e nomes com predefinições internas ficam preservados. A comparação mostra a troca e Desfazer ajustes restaura o código anterior.

Em Info e Infocaixa, um identificador InChI literal e muito longo pode receber um elemento de apresentação que permite quebrar a linha. O identificador precisa estar em um par único de rótulo e dados, com o rótulo literal InChI ou InChI (forma hidratada). O valor precisa começar por 1S/, ter pelo menos 80 caracteres e formar um único trecho ASCII, sem espaços ou formatação. Caixas com classes ou estilos próprios ficam como estão. O programa não corta o texto, não insere espaços no identificador e não muda a largura escolhida para a caixa. Campos já formatados ficam como estão.

'''
head = head.replace(anchor, addition + anchor)
old_history_start = history.index('=== 2.7.0 ===')
history = history[:old_history_start] + '=== 2.7.1 ===\n' + FEATURES + '\n\n' + history[old_history_start:]
tail = active_versions(tail)
start = tail.index('Os arquivos finais da 2.7.1 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + SUMMARY + tail[end:]
manual = head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail
manual = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', manual)
(OUT / 'Documentacao_RevisaWiki_v2_7_1.wiki').write_text(manual)

installation = active_versions((BASE / 'Instalacao_RevisaWiki_v2_7.txt').read_text())
start = installation.index('Os arquivos finais da 2.7.1 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + SUMMARY + installation[end:]
installation = installation.replace('mesmo que a 2.6.2 já esteja instalada.', 'mesmo que a 2.7.0 já esteja instalada.')
(OUT / 'Instalacao_RevisaWiki_v2_7_1.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_7_1.txt').write_text('RevisaWiki 2.7.1: reparos de nomes químicos e de identificadores longos que alargam infocaixas.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_7_1.txt').write_text('Documentação do RevisaWiki 2.7.1, com reparos de nomes químicos e largura, limites, testes e instalação.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_7_1.txt').write_text('RevisaWiki 2.7.1\n15 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + SUMMARY + '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
(OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.7.1\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = '''RevisaWiki 2.7.1: referência técnica
Programa e dados: 2.7.1
15 de outubro de 2026

A reconstrução usa os sete arquivos 2.7.0 conferidos por SHA-256 e aplica os módulos de src/v2_7_1. As distribuições anteriores permanecem intactas. O conteúdo dos catálogos não muda. Os dados, o núcleo e o carregador central precisam declarar a mesma versão.

O reparo de nomes químicos depende do campo e da estrutura literal de entrada. A execução confirma novamente a origem e o conteúdo de cada mudança antes de aceitá-la. A conferência compara os campos preenchidos de cada caixa e suas ocorrências, impedindo mudanças além da codificação ou da formatação confirmada.

O reparo de largura envolve somente um identificador InChI literal confirmado. Um elemento span com overflow-wrap:anywhere permite a quebra visual sem modificar os caracteres. A estrutura da caixa, as imagens e as referências são preservadas. Não há troca automática de modelo nem imposição de largura fixa.

Uma conversão de idioma válida não recebe o reparo de chaves. Discussões assinadas, exemplos, campos calculados, campos duplicados e trechos incompletos continuam protegidos. As escolhas do diff precisam preservar o campo inteiro e Desfazer ajustes precisa restaurar todos os bytes originais.

As chamadas fixas do common.js permanecem idênticas. A atualização substitui os dados, o núcleo e o carregador central. Nenhuma rotina de instalação publica na Wikipédia.

'''
(OUT / 'Referencia_tecnica_RevisaWiki_v2_7_1.txt').write_text(technical + SUMMARY + '\n\n' + manual)
lines = ['RevisaWiki 2.7.1: resultados dos testes', '15 de outubro de 2026', '', SUMMARY, '', 'Execuções nos arquivos finais', '']
for group in QA['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.7.1. A seleção inclui artigos extensos e assuntos diferentes. Os testes conferem idempotência, preservação das fontes e dos dados de tabelas, limites de atuação e falsos positivos.', '', 'As medições de tempo são locais e variam com a carga da máquina. Os testes dos navegadores usam páginas locais e respostas controladas. Eles não demonstram todas as combinações possíveis de extensões ou editores em produção.', '', 'Arquivos executados', '']
for name, pin in MANIFEST['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.', '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_7_1.txt').write_text('\n'.join(lines))
print(json.dumps({'version': '2.7.1', 'documentationFiles': len(list(OUT.iterdir()))}))
