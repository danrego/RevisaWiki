"""Write the 2.9.0 manual only after final pinned QA has passed."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.8.3', ROOT / 'docs/2.9.0'
qa_paths = [ROOT / 'artifacts/v290/RELEASE_QA_SUMMARY.json',
            ROOT / 'artifacts/v290/release-test-summary.json',
            ROOT / 'tests/evidence/2.9.0/RELEASE_QA_SUMMARY.json']
qa_path = next((path for path in qa_paths if path.exists()), qa_paths[0])
qa = json.loads(qa_path.read_text())
manifest_path = ROOT / 'tests/expected_release_v290.json'
manifest = json.loads(manifest_path.read_text())
assert manifest['version'] == manifest['runtimeVersion'] == '2.9.0'
assert qa['status'] == 'passed' and qa['version'] == '2.9.0'
assert qa.get('failed', 0) == 0 and not qa.get('failures')
assert qa['releaseManifestSha256'] == hashlib.sha256(manifest_path.read_bytes()).hexdigest()
assert qa['frozenFiles'] == manifest['files']
assert isinstance(qa['portugueseSummary'], str) and qa['portugueseSummary'].strip()
assert qa['groups'] and all(isinstance(group['cases'], int) and isinstance(group['checks'], int)
                            for group in qa['groups'])
native = json.loads((ROOT / 'tests/v290/NATIVE_REPAIR_RENDER_PROOF.json').read_text())
assert native['version'] == '2.9.0' and native['status'] == 'passed'
assert native['frozenFiles'] == manifest['files']
assert native['releaseManifestSha256'] == qa['releaseManifestSha256']
assert native['nativeComparisons'] >= 8
assert native['wikipediaWrites'] == native['accountsUsed'] == 0
birth = json.loads((ROOT / 'tests/v290/NATIVE_BIRTH_CATEGORY_PROOF.json').read_text())
assert birth['version'] == '2.9.0' and birth['status'] == 'passed'
assert birth['frozenFiles'] == manifest['files']
assert birth['releaseManifestSha256'] == qa['releaseManifestSha256']
assert birth['realBiographyPairs'] >= 6
assert birth['categoryMembershipAndSortKeysUnchanged'] is True
assert birth['wikipediaWrites'] == birth['accountsUsed'] == 0
OUT.mkdir(parents=True, exist_ok=True)
summary = qa['portugueseSummary']
features = """* Reutiliza uma fonte sem nome quando todos os campos coincidem com uma referência já nomeada.
* Retira chamadas repetidas da mesma referência no mesmo ponto do texto.
* Retira etiquetas de referência sem atributos e sem conteúdo.
* Corrige um único fechamento de referência repetido quando o limite está completo.
* Retira atributos idênticos repetidos em células, linhas e legendas de tabelas completas.
* Corrige uma aspa de fechamento repetida em rowspan ou colspan nos casos literais reconhecidos.
* Acrescenta scope de coluna aos cabeçalhos inferiores de tabelas simples com dois níveis.
* Extrai o identificador de um endereço oficial preenchido em pmc ou arxiv, preservando sua versão."""


def active(text):
    return text.replace('2.8.3', '2.9.0').replace('_v2_8_3', '_v2_9_0')


def single_spacing(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


original = (BASE / 'Documentacao_RevisaWiki_v2_8_3.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head, tail = active(head), active(tail)
head = re.sub(
    r"A versão '''2\.9\.0'''[^\n]+",
    "A versão '''2.9.0''' acrescenta reparos em referências e tabelas completas, com limites para preservar fontes, páginas e células. Casos incertos ficam como estão, sem novos avisos. Os recursos das versões anteriores continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.",
    head, count=1)
reference_section = """=== Referências idênticas e chamadas repetidas ===

Uma fonte sem nome pode reutilizar uma referência já nomeada quando todos os campos da fonte coincidem, incluindo páginas e notas. A comparação aceita as mesmas conversões de citações já usadas pelo programa, como Cite web para Citar web. As duas chamadas precisam estar no mesmo grupo e antes da mesma lista de referências. O conteúdo da definição mantida não é descartado nem substituído por uma fonte apenas parecida.

Uma sequência de referências no mesmo ponto pode perder uma chamada repetida, sem texto, pontuação ou quebra de linha entre elas. Por exemplo, uma sequência A, B, A mantém A e B na ordem original. A regra também reconhece uma definição imediatamente seguida de outra chamada da própria referência. Pelo menos uma definição completa precisa permanecer no artigo.

Uma etiqueta de referência sem atributos e sem conteúdo pode sair do código, como <code>&lt;ref /&gt;</code> ou <code>&lt;ref&gt;&lt;/ref&gt;</code>. Uma chamada com nome, grupo, comentário, predefinição ou qualquer outro conteúdo permanece. Um nome explicitamente vazio também não é usado para escolher outra definição.

Quando uma referência completa termina com um único fechamento repetido, como <code>&lt;/ref&gt;&lt;/ref&gt;</code>, o segundo pode sair. A referência precisa ter corpo e limites completos, com o restante do código balanceado. Referências aninhadas, sequências maiores de fechamentos, exemplos e etiquetas malformadas ficam como estão.

Essas regras novas exigem um artigo inteiro do domínio principal. Definições em listas, chamadas calculadas, conteúdo protegido e atributos especiais, como follow ou details, impedem as consolidações incertas. Não há tentativa de descobrir uma fonte ausente por semelhança de nome ou endereço, nem novos avisos para os casos preservados.

"""
anchor = '=== Correção de referências de versões anteriores ==='
assert head.count(anchor) == 1
head = head.replace(anchor, reference_section + anchor, 1)
identifier_section = """=== Endereços em campos de identificadores ===

Quando pmc ou arxiv contém um endereço oficial no formato reconhecido, o RevisaWiki pode deixar somente o identificador que já estava nesse endereço. Um valor como <code>https://arxiv.org/abs/2501.12345v2</code> conserva <code>2501.12345v2</code>, incluindo a versão v2. O endereço da fonte em url permanece como está.

A regra aceita caminhos exatos dos domínios oficiais conferidos para PMC e arXiv. Endereços com redirecionadores, consultas, fragmentos, credenciais, códigos calculados ou campos conflitantes permanecem. O programa não procura outro identificador nem consulta se o trabalho existe. O reparo só corrige o formato do campo, dentro dos limites aceitos pela predefinição nativa.

"""
anchor = '=== Citações abreviadas ==='
assert head.count(anchor) == 1
head = head.replace(anchor, identifier_section + anchor, 1)
table_section = """=== Atributos e cabeçalhos de tabelas ===

Em células, linhas e legendas de tabelas literais completas, atributos repetidos podem ficar com uma única ocorrência quando têm valores exatamente iguais. Por exemplo, <code>colspan="2" colspan="2"</code> mantém <code>colspan="2"</code>. Valores diferentes não são escolhidos pelo programa. A grade, a ordem dos dados e o conteúdo das células precisam permanecer iguais.

Uma aspa de fechamento repetida em rowspan ou colspan pode sair quando há um único atributo numérico, um separador explícito e texto simples na célula. A regra não tenta completar células nem escolher quantas colunas uma tabela deveria ter. Tabelas calculadas, aninhadas, incompletas ou com estrutura incerta ficam como estão.

Em um cabeçalho simples com dois níveis, a fileira superior pode agrupar colunas com colspan e a inferior pode receber <code>scope="col"</code>. Os grupos precisam cobrir exatamente as colunas inferiores, e o corpo precisa formar uma grade regular. A mudança informa aos leitores de tela quais células são cabeçalhos de coluna, sem alterar os nomes ou os valores exibidos.

Esse acréscimo não muda o alcance dos grupos superiores e não substitui associações já definidas. Cabeçalhos com rowspan, identificadores próprios, associações headers ou escopos conflitantes impedem a mudança. As novas regras de tabela atuam somente na edição completa de artigos do domínio principal.

"""
anchor = '== Ortografia =='
assert head.count(anchor) == 1
head = head.replace(anchor, table_section + anchor, 1)
history_anchor = '=== 2.8.3 ==='
assert history.count(history_anchor) == 1
history = history.replace(history_anchor, '=== 2.9.0 ===\n' + features + '\n\n' + history_anchor, 1)
start = tail.index('Os arquivos finais da 2.9.0 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + summary + tail[end:]
manual = single_spacing(head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
(OUT / 'Documentacao_RevisaWiki_v2_9_0.wiki').write_text(manual)
installation = active((BASE / 'Instalacao_RevisaWiki_v2_8_3.txt').read_text())
installation = installation.replace('mesmo que a 2.8.2 já esteja instalada.', 'mesmo que a 2.8.3 já esteja instalada.')
start = installation.index('Os arquivos finais da 2.9.0 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + summary + installation[end:]
(OUT / 'Instalacao_RevisaWiki_v2_9_0.txt').write_text(single_spacing(installation))
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_9_0.txt').write_text(
    'RevisaWiki 2.9.0: reparos automáticos em referências, atributos e cabeçalhos de tabelas e campos de identificadores, com preservação dos casos incertos.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_9_0.txt').write_text(
    'Documentação do RevisaWiki 2.9.0, com reparos de referências e tabelas, limites dos ajustes, testes e atualização.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_9_0.txt').write_text(single_spacing(
    'RevisaWiki 2.9.0\n16 de outubro de 2026\n\n' + features.replace('* ', '- ') + '\n\n' + summary +
    '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
(OUT / 'LEIA_PRIMEIRO.txt').write_text(
    'RevisaWiki 2.9.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = """RevisaWiki 2.9.0: referência técnica
Programa e dados: 2.9.0
16 de outubro de 2026

A reconstrução usa os arquivos 2.8.3 conferidos por SHA-256 e aplica os módulos de src/v2_9. Os dados, o núcleo e o carregador central precisam declarar a mesma versão. A chamada fixa do common.js continua idêntica.

Os planos de referências guardam o texto de origem e os intervalos de cada troca. A reutilização compara todos os campos pelo normalizador de citações já usado no programa, sem equivalência por URL isolada. Definições conflitantes, grupos diferentes, referências emitidas por outras predefinições e regiões separadas por coletores não são consolidadas. Chamadas repetidas só saem de uma sequência sem prosa, pontuação ou quebra de linha. A retirada de uma definição repetida precisa deixar outra definição completa do mesmo nome e corpo.

Etiquetas vazias só saem quando não têm atributos nem conteúdo além de espaços. Comentários não contam como conteúdo vazio. A correção de fechamento aceita um único token extra adjacente após uma referência completa. Sequências maiores, referências aninhadas e outras falhas de sintaxe impedem esse reparo.

As novas regras de tabelas exigem uma wikitable literal completa, com grade regular e atributos da lista conferida. Atributos repetidos precisam ter valores exatamente iguais. A aspa extra só pode ocorrer no fim de um único rowspan ou colspan com inteiro positivo e texto estático. O scope de coluna é acrescentado somente na segunda fileira de cabeçalhos, sob grupos explícitos de colspan que cobrem todas as colunas. Rowspan, cabeçalhos identificados, associações headers, escopos conflitantes e tabelas calculadas impedem esse acréscimo.

Os endereços de identificadores só são reduzidos quando o campo nativo aceita o identificador e o caminho corresponde ao contrato registrado. PMC usa o número já presente no caminho oficial, dentro dos limites do CS1 conferido. arXiv conserva a categoria antiga ou o formato numérico reconhecido, incluindo a versão. Não há busca de existência ou de metadados por esse recurso.

As oito regras novas exigem um artigo inteiro do domínio principal, respeitam as opções de referências, tabelas e citações e não acrescentam avisos para casos incertos. Os critérios completos ficam em src/v2_9 e nos respectivos contratos. A comparação, a seleção de mudanças e a opção de desfazer continuam usando os dados do rascunho que foi analisado.

O arquivo tests/v290/NATIVE_REPAIR_RENDER_PROOF.json confere os reparos no processamento nativo do MediaWiki e vincula os arquivos executados por hash. O arquivo NATIVE_BIRTH_CATEGORY_PROOF.json da mesma pasta repete a conferência das categorias de nascimento com esta distribuição. As consultas são anônimas e não salvam páginas. Os resultados da 2.8.2 sobre referências históricas permanecem com sua origem e data, sem serem contados como recursos novos.

Atualize dados, núcleo e carregador central, nessa ordem. Quem usa a distribuição compartilhada só precisa recarregar depois que esses arquivos forem atualizados. Os testes e o índice não publicam na Wikipédia.

"""
(OUT / 'Referencia_tecnica_RevisaWiki_v2_9_0.txt').write_text(single_spacing(technical + summary + '\n\n' + manual))
lines = ['RevisaWiki 2.9.0: resultados dos testes', '16 de outubro de 2026', '', summary, '',
         'Execuções nos arquivos finais', '']
for group in qa['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' +
                 str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.9.0. As verificações desta versão usam os arquivos finais identificados abaixo. Permutações sintéticas são casos de teste, não artigos distintos.',
          '', 'Os navegadores usam páginas locais e respostas controladas. Os resultados não demonstram todas as combinações possíveis de extensões ou editores em produção.',
          '', 'Arquivos executados', '']
for name, pin in manifest['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.',
          '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_9_0.txt').write_text(single_spacing('\n'.join(lines)))
print(json.dumps({'version': '2.9.0', 'documentationFiles': len(list(OUT.iterdir()))}))
