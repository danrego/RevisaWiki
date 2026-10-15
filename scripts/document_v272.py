"""Write the complete 2.7.2 manual from the final, passed release evidence."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.7.1', ROOT / 'docs/2.7.2'
QA_PATH = ROOT / 'artifacts/v272/RELEASE_QA_SUMMARY.json'
if not QA_PATH.exists():
    QA_PATH = ROOT / 'tests/evidence/2.7.2/RELEASE_QA_SUMMARY.json'
QA = json.loads(QA_PATH.read_text())
assert QA['status'] == 'passed' and QA['version'] == '2.7.2'
MANIFEST = json.loads((ROOT / 'tests/expected_release_v272.json').read_text())
assert QA['frozenFiles'] == MANIFEST['files']
OUT.mkdir(parents=True, exist_ok=True)

FEATURES = '''* Fecha aspas ausentes em atributos numéricos de células quando a estrutura completa confirma o ponto do reparo.
* Corrige a leitura de aspas que atravessam o limite do itálico ou negrito, sem alterar a redação ou a formatação do artigo.
* Depois do reparo confirmado, permite os ajustes finais e a adição dos portais que atendem aos critérios existentes.
* Preserva chamadas válidas de predefinições que fornecem atributos e o separador da célula, como Ind e Venceu.
* Programa, dados e carregador central na versão 2.7.2. A chamada fixa do common.js permanece igual.'''
SUMMARY = QA['portugueseSummary']


def active_versions(text):
    return text.replace('2.7.1', '2.7.2').replace('_v2_7_1', '_v2_7_2')


original = (BASE / 'Documentacao_RevisaWiki_v2_7_1.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head = active_versions(head)
old_intro = "A versão '''2.7.2''' corrige um caso em que a notação de um nome químico impede a montagem da infocaixa. A chave literal passa a usar uma entidade HTML, sem mudar o nome exibido. Também permite a quebra de linha de um identificador InChI longo que alargava a caixa no Firefox. Os reparos de duplicação e a comparação da 2.7 continuam disponíveis."
new_intro = "A versão '''2.7.2''' corrige casos confirmados de aspas em tabelas e na leitura de trechos em itálico ou negrito. Esses problemas podiam interromper os ajustes antes dos portais. A ferramenta confere novamente a estrutura depois do reparo e conserva os dados das células, as referências e as chamadas válidas de predefinições."
assert old_intro in head
head = head.replace(old_intro, new_intro)
anchor = '== Ortografia =='
assert head.count(anchor) == 1
addition = '''=== Aspas em atributos de células ===

Em uma tabela completa, uma aspa ausente no valor numérico de rowspan ou colspan pode ser acrescentada quando o separador seguinte e a estrutura da célula confirmam onde ela deve fechar. A regra exige o artigo inteiro no domínio principal, uma wikitable literal fora de outras tabelas e um único rowspan ou colspan antes do separador. O valor precisa ser um inteiro positivo, e o conteúdo da célula precisa ser fixo e ocupar uma só linha. Atributos calculados, trechos protegidos e estruturas ambíguas ficam preservados. Se uma segunda leitura expõe outro reparo que não pôde ser confirmado junto do primeiro, o código permanece como estava.

Algumas predefinições de resultados, como Ind e Venceu, fornecem os atributos e o separador da célula. Uma linha com rowspan seguido de uma dessas chamadas pode estar correta. O programa conserva essa composição e não acrescenta um separador antes da chamada.

As aspas que começam dentro de um trecho em itálico ou negrito e terminam logo depois dele passam a ser lidas em conjunto. Essa mudança pertence ao analisador e mantém o texto do artigo idêntico.

Depois dos reparos confirmados, a ferramenta verifica novamente se o trecho final pode ser ajustado. Os portais continuam dependendo dos critérios de biografia, assunto e dados confirmados descritos neste manual. Uma tabela ainda incompleta não autoriza alterações no trecho protegido.

'''
head = head.replace(anchor, addition + anchor)
old_history_start = history.index('=== 2.7.1 ===')
history = history[:old_history_start] + '=== 2.7.2 ===\n' + FEATURES + '\n\n' + history[old_history_start:]
tail = active_versions(tail)
start = tail.index('Os arquivos finais da 2.7.2 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + SUMMARY + tail[end:]
manual = head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail
manual = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', manual)
(OUT / 'Documentacao_RevisaWiki_v2_7_2.wiki').write_text(manual)

installation = active_versions((BASE / 'Instalacao_RevisaWiki_v2_7_1.txt').read_text())
start = installation.index('Os arquivos finais da 2.7.2 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + SUMMARY + installation[end:]
installation = installation.replace('mesmo que a 2.7.0 já esteja instalada.', 'mesmo que a 2.7.1 já esteja instalada.')
(OUT / 'Instalacao_RevisaWiki_v2_7_2.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_7_2.txt').write_text('RevisaWiki 2.7.2: reparos confirmados de aspas em tabelas e leitura de itálico para permitir os ajustes finais.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_7_2.txt').write_text('Documentação do RevisaWiki 2.7.2, com reparos de tabelas, limites, testes e instalação.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_7_2.txt').write_text('RevisaWiki 2.7.2\n15 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + SUMMARY + '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
(OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.7.2\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = '''RevisaWiki 2.7.2: referência técnica
Programa e dados: 2.7.2
15 de outubro de 2026

A reconstrução usa os sete arquivos 2.7.1 conferidos por SHA-256 e aplica os módulos de src/v2_7_2. As distribuições anteriores permanecem intactas. O conteúdo dos catálogos não muda. Os dados, o núcleo e o carregador central precisam declarar a mesma versão.

O reparo de aspas numéricas depende da posição da célula, do valor literal e de uma tabela completa. A execução confere o texto de origem de cada inserção e verifica novamente a estrutura antes de liberar as etapas seguintes. Os valores das células e as relações entre elas precisam permanecer iguais.

A leitura de aspas junto do itálico ou negrito muda somente a proteção interna do analisador. Ela não retira aspas nem reescreve a formatação. Chamadas que produzem atributos e separadores de tabela continuam válidas e permanecem intactas.

Os portais continuam usando as confirmações anteriores. Reparar uma tabela não autoriza inferir gênero pelo nome, pela profissão ou pela aparência. A comparação apresenta os reparos e Desfazer ajustes restaura os bytes do rascunho original.

As chamadas fixas do common.js permanecem idênticas. A atualização substitui os dados, o núcleo e o carregador central. Nenhuma rotina de instalação publica na Wikipédia.

'''
(OUT / 'Referencia_tecnica_RevisaWiki_v2_7_2.txt').write_text(technical + SUMMARY + '\n\n' + manual)
lines = ['RevisaWiki 2.7.2: resultados dos testes', '15 de outubro de 2026', '', SUMMARY, '', 'Execuções nos arquivos finais', '']
for group in QA['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.7.2. Os testes conferem idempotência, preservação das fontes e dos dados de tabelas, limites de atuação e falsos positivos. Permutações sintéticas são casos de teste, não artigos distintos.', '', 'As medições de tempo são locais e variam com a carga da máquina. Os testes dos navegadores usam páginas locais e respostas controladas. Eles não demonstram todas as combinações possíveis de extensões ou editores em produção.', '', 'Arquivos executados', '']
for name, pin in MANIFEST['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.', '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_7_2.txt').write_text('\n'.join(lines))
print(json.dumps({'version': '2.7.2', 'documentationFiles': len(list(OUT.iterdir()))}))
