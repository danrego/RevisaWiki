"""Write the 2.10.0 manual only after final pinned QA has passed."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.9.0', ROOT / 'docs/2.10.0'
qa_paths = [ROOT / 'artifacts/v2100/RELEASE_QA_SUMMARY.json',
            ROOT / 'artifacts/v2100/release-test-summary.json',
            ROOT / 'tests/evidence/2.10.0/RELEASE_QA_SUMMARY.json']
qa_path = next((path for path in qa_paths if path.exists()), qa_paths[0])
qa = json.loads(qa_path.read_text())
manifest_path = ROOT / 'tests/expected_release_v2100.json'
manifest = json.loads(manifest_path.read_text())
assert manifest['version'] == manifest['runtimeVersion'] == '2.10.0'
assert qa['status'] == 'passed' and qa['version'] == '2.10.0'
assert qa.get('failed', 0) == 0 and not qa.get('failures')
assert qa['releaseManifestSha256'] == hashlib.sha256(manifest_path.read_bytes()).hexdigest()
assert qa['frozenFiles'] == manifest['files']
assert isinstance(qa['portugueseSummary'], str) and qa['portugueseSummary'].strip()
assert qa['groups'] and all(isinstance(group['cases'], int) and isinstance(group['checks'], int)
                            for group in qa['groups'])
native = json.loads((ROOT / 'tests/v2100/NATIVE_REPAIR_RENDER_PROOF.json').read_text())
assert native['version'] == '2.10.0' and native['status'] == 'passed'
assert native['frozenFiles'] == manifest['files']
assert native['releaseManifestSha256'] == qa['releaseManifestSha256']
assert native['nativeComparisons'] >= 8
assert native['wikipediaWrites'] == native['accountsUsed'] == 0
birth = json.loads((ROOT / 'tests/v2100/NATIVE_BIRTH_CATEGORY_PROOF.json').read_text())
assert birth['version'] == '2.10.0' and birth['status'] == 'passed'
assert birth['frozenFiles'] == manifest['files']
assert birth['releaseManifestSha256'] == qa['releaseManifestSha256']
assert birth['realBiographyPairs'] >= 6
assert birth['categoryMembershipAndSortKeysUnchanged'] is True
assert birth['wikipediaWrites'] == birth['accountsUsed'] == 0
OUT.mkdir(parents=True, exist_ok=True)
summary = qa['portugueseSummary']
features = """* Corrige separadores ausentes, aspas trocadas, linhas vazias repetidas e fechamentos incompatíveis em tabelas estáticas reconhecidas.
* Acrescenta scope aos cabeçalhos individuais de tabelas com três ou quatro níveis completos e sem associações conflitantes.
* Reutiliza fontes idênticas definidas em references ou refs=, mantendo grupos, páginas e demais campos.
* Separa nomes conflitantes quando cada ocorrência traz a fonte completa e não há chamadas vazias ou indiretas.
* Corrige o espaço ausente em uma abertura refname quando a referência completa tem limites confirmados.
* Restaura um destino Harvard ausente somente com autores e ano exatos e confirmação na pré-visualização nativa.
* Limita a rolagem horizontal de tabelas largas nos formatos reconhecidos, sem apagar suas larguras mínimas ou alterar os dados.
* Compartilha leituras do mesmo rascunho em um cache limitado, descartando posições quando o texto muda.
* Permite conservar conjuntos independentes de ajustes que passaram na conferência, mantendo juntas as mudanças que dependem umas das outras."""


def active(text):
    return text.replace('2.9.0', '2.10.0').replace('_v2_9_0', '_v2_10_0')


def single_spacing(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


original = (BASE / 'Documentacao_RevisaWiki_v2_9_0.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head, tail = active(head), active(tail)
head = re.sub(
    r"A versão '''2\.10\.0'''[^\n]+",
    "A versão '''2.10.0''' amplia os ajustes de tabelas e referências, com conferência dos vínculos entre chamadas, fontes e listas. Também pode limitar a rolagem de tabelas largas nos formatos reconhecidos e conservar conjuntos independentes de mudanças que passaram na verificação. Casos incertos ficam como estão, sem novos avisos. Os recursos das versões anteriores continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.",
    head, count=1)
reference_section = """=== Fontes definidas na lista de referências ===

Fontes completas guardadas em <code>&lt;references&gt;...&lt;/references&gt;</code> ou no parâmetro <code>refs=</code> de uma lista conhecida podem passar a uma única definição quando todos os campos coincidem. A comparação aceita as conversões de citações já conferidas pelo programa. As chamadas precisam pertencer ao mesmo grupo e à mesma região da lista. Páginas, trechos citados e outros localizadores entram na comparação, mesmo quando a URL é igual.

Uma definição completa permanece no código e todas as chamadas reconhecidas recebem o nome correspondente. Fontes sem uso no texto, coletores com opções desconhecidas, grupos implícitos não conferidos, nomes calculados e predefinições que possam criar chamadas indiretas impedem o ajuste. O programa não escolhe entre fontes com dados diferentes.

=== Nomes repetidos para fontes diferentes ===

Um nome usado para duas fontes completas diferentes pode receber um sufixo na segunda fonte, como fonte-2, quando todas as ocorrências desse nome têm corpo completo. O nome novo precisa estar livre no mesmo grupo. Os nomes, as datas e o texto das fontes permanecem como estavam.

Uma única chamada vazia, como <code>&lt;ref name="fonte" /&gt;</code>, impede essa separação porque não permite saber a qual das fontes ela se refere. O mesmo vale para chamadas indiretas, continuações, detalhes, definições dentro de listas e regiões de referências separadas. A correção não escolhe uma fonte pelo assunto do parágrafo.

=== Espaço ausente na etiqueta ref ===

Uma abertura como <code>&lt;refname="fonte"&gt;</code> pode passar a <code>&lt;ref name="fonte"&gt;</code> quando tem atributos literais válidos, um único fechamento correspondente e uma fonte completa. O reparo acrescenta somente o espaço necessário. Exemplos de código, citações, nomes calculados, atributos conflitantes e limites incertos ficam intactos.

=== Destinos das citações abreviadas ===

Uma chamada Harvard pode receber seu destino na bibliografia quando existe uma única obra local com a mesma sequência de autores e o mesmo ano. O programa propõe apenas <code>ref=harv</code> na citação completa, sem trocar autores, anos, títulos ou páginas. Um campo ref já escrito, inclusive none, impede a proposta.

Antes de aplicar, a pré-visualização nativa precisa confirmar que o destino não existia, que passou a existir uma única vez e que o restante do conteúdo exibido ficou igual. A consulta também confere as ligações da citação abreviada. Cada confirmação vale para um único candidato no mesmo rascunho. Se o texto mudar ou a consulta falhar, o código permanece igual, sem um aviso adicional.

"""
anchor = '=== Correção de referências de versões anteriores ==='
assert head.count(anchor) == 1
head = head.replace(anchor, reference_section + anchor, 1)
head = head.replace('Definições em listas, chamadas calculadas, conteúdo protegido e atributos especiais, como follow ou details, impedem as consolidações incertas.',
                    'Fontes definidas em listas têm os critérios próprios explicados abaixo. Chamadas calculadas, conteúdo protegido e atributos especiais, como follow ou details, impedem as consolidações incertas.', 1)
# The identifier section is inherited unchanged from 2.9.0.
table_section = """=== Separadores e fechamentos de tabelas ===

Em uma tabela estática completa, um separador <code>|</code> ausente entre atributos e conteúdo pode ser recolocado quando o campo começa com atributos reconhecidos entre aspas e tem um scope, rowspan ou colspan explícito. Aspas tipográficas emparelhadas em um rowspan ou colspan numérico podem virar aspas retas. Uma linha vazia de separação repetida ou deixada imediatamente antes do fim também pode sair, desde que não tenha atributos, comentário ou conteúdo próprio.

Um fechamento isolado <code>&lt;/table&gt;</code> pode passar a <code>|}</code> quando encerra uma única wikitable literal e não há tabela HTML ou tabela interna que explique aquela etiqueta. Os reparos precisam produzir uma grade completa e regular, preservando as linhas, os rótulos, as referências e os dados das células. O programa não completa linhas pela aparência nem decide quantas células deveriam existir.

=== Cabeçalhos com três ou quatro níveis ===

Cabeçalhos individuais de coluna podem receber <code>scope="col"</code> sob três ou quatro níveis de grupos explícitos de colspan. Cada grupo precisa cobrir exatamente os grupos ou colunas abaixo dele, sem cruzamentos. A fileira inferior deve ter uma célula por coluna e o corpo precisa manter uma grade regular. Rowspan, associações headers, identificadores próprios ou escopos conflitantes impedem o acréscimo. Os grupos superiores conservam sua marcação.

=== Rolagem de tabelas largas ===

Uma tabela larga pode receber um contêiner de rolagem quando tem o formato estático reconhecido, com width de 100%, table-layout fixo e uma largura mínima explícita de pelo menos 640 px ou 40 em ou rem. O contêiner recebe <code>max-width:100%;min-width:0;overflow-x:auto;</code>. Uma caixa simples de rolagem já existente também pode receber esses limites quando envolve somente aquela tabela.

A largura mínima da tabela permanece no código, assim como todas as células e seus dados. A mudança limita a caixa de rolagem à área disponível, sem impor uma largura nova a cada coluna. Tabelas aninhadas, contêineres próprios, atributos fora da lista reconhecida e estruturas calculadas ficam como estavam. A existência de uma tabela grande, por si só, não autoriza reescrever sua apresentação.

"""
anchor = '== Ortografia =='
assert head.count(anchor) == 1
head = head.replace(anchor, table_section + anchor, 1)
old = 'Alguns reparos precisam permanecer juntos para que o código e a conferência de dados continuem válidos. Nesses casos, aceitar ou rejeitar um trecho também muda a escolha dos demais trechos do mesmo grupo. Desfazer ajustes recupera o rascunho completo anterior.'
assert head.count(old) == 1
head = head.replace(old, 'Alguns reparos precisam permanecer juntos para que o código e a conferência de dados continuem válidos. Nesses casos, aceitar ou rejeitar um trecho também muda a escolha dos demais trechos do mesmo grupo. Tabelas literais independentes e sem referências podem ter seus próprios conjuntos. Quando um conjunto falha na conferência nativa, o programa pode conservar outros que passaram, com um limite de quatro conferências adicionais. Mudanças ligadas às mesmas referências continuam juntas. Desfazer ajustes recupera o rascunho completo anterior.', 1)
old = 'Os cálculos de ajuste e ortografia ficam no navegador. As consultas online usam a API pública da Wikipédia, Wikidata ou Crossref conforme o recurso.'
assert head.count(old) == 1
head = head.replace(old, 'Os cálculos de ajuste e ortografia ficam no navegador. A restauração de um destino Harvard pode comparar o rascunho e uma única proposta na API de pré-visualização, sem conta e sem salvar. As consultas online usam a API pública da Wikipédia, Wikidata ou Crossref conforme o recurso.', 1)
anchor = '=== Principais opções pessoais ==='
assert head.count(anchor) == 1
head = head.replace(anchor, 'A leitura estrutural da 2.10 compartilha os resultados de referências, tabelas e predefinições do mesmo texto. Esse cache mantém até quatro rascunhos e estima um teto de 12 MiB para seus próprios dados. Ele se soma às áreas de leitura já existentes. Uma alteração no rascunho invalida as posições anteriores. O cache reduz leituras repetidas, sem prometer que um artigo de qualquer tamanho terminará dentro do prazo.\n\n' + anchor, 1)
old = 'Use <code>false</code> para desligar uma opção.'
assert head.count(old) == 1
head = head.replace(old, 'As opções <code>referenceGraphRepairs</code>, <code>harvardAnchorRepairs</code>, <code>tableSyntaxRepairs</code>, <code>responsiveTableWrappers</code> e <code>independentRepairGroups</code> controlam, respectivamente, os vínculos de referências, os destinos Harvard, a sintaxe de tabelas, os contêineres de rolagem e os conjuntos independentes de mudanças.\n\n' + old, 1)
history_anchor = '=== 2.9.0 ==='
assert history.count(history_anchor) == 1
history = history.replace(history_anchor, '=== 2.10.0 ===\n' + features + '\n\n' + history_anchor, 1)
start = tail.index('Os arquivos finais da 2.10.0 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + summary + tail[end:]
manual = single_spacing(head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
(OUT / 'Documentacao_RevisaWiki_v2_10_0.wiki').write_text(manual)
installation = active((BASE / 'Instalacao_RevisaWiki_v2_9_0.txt').read_text())
installation = installation.replace('mesmo que a 2.8.3 já esteja instalada.', 'mesmo que a 2.9.0 já esteja instalada.')
start = installation.index('Os arquivos finais da 2.10.0 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + summary + installation[end:]
(OUT / 'Instalacao_RevisaWiki_v2_10_0.txt').write_text(single_spacing(installation))
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_10_0.txt').write_text(
    'RevisaWiki 2.10.0: reparos de sintaxe e cabeçalhos de tabelas, vínculos de referências, destinos Harvard confirmados e rolagem limitada nos formatos reconhecidos.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_10_0.txt').write_text(
    'Documentação do RevisaWiki 2.10.0, com ajustes de tabelas e referências, limites das consultas, testes e atualização.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_10_0.txt').write_text(single_spacing(
    'RevisaWiki 2.10.0\n16 de outubro de 2026\n\n' + features.replace('* ', '- ') + '\n\n' + summary +
    '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
(OUT / 'LEIA_PRIMEIRO.txt').write_text(
    'RevisaWiki 2.10.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = """RevisaWiki 2.10.0: referência técnica
Programa e dados: 2.10.0
16 de outubro de 2026

A reconstrução usa os arquivos 2.9.0 conferidos por SHA-256 e aplica os módulos de src/v2_10. Os dados, o núcleo e o carregador central precisam declarar a mesma versão. A chamada fixa do common.js continua idêntica.

Os planos de referências guardam o texto de origem e os intervalos de cada troca. As definições em listas usam o mesmo normalizador determinístico de citações já presente no programa. A comparação inclui todos os campos e localizadores. O grupo efetivo e o intervalo entre coletores precisam coincidir. Uma definição completa permanece, as chamadas são atualizadas juntas e fontes sem uso no texto são preservadas. Coletores desconhecidos, predefinições que possam gerar chamadas e conteúdo calculado impedem essas regras.

A separação de nomes conflitantes só atua quando cada ocorrência contém o próprio corpo completo, sem chamadas vazias, indiretas, follow, details ou fontes guardadas em listas. Os corpos continuam iguais e recebem nomes livres no respectivo grupo. O reparo de refname exige um par completo e sem conflito, acrescentando somente o espaço entre o nome da etiqueta e seu atributo.

Uma proposta Harvard exige a mesma sequência literal de autores e ano e uma única obra local. Um ref explícito impede a proposta. A consulta nativa confere a passagem de zero para um destino, conserva as ligações e exige HTML igual após retirar somente o novo atributo id. O comprovante se vincula ao texto, à página e à proposta exata. Uma falha de consulta não autoriza aplicar a mudança nem cria um novo alerta.

Os reparos de tabela trabalham em estruturas literais completas e preservam os dados fora dos tokens de sintaxe conferidos. A inserção do separador exige atributos reconhecidos entre aspas com scope, rowspan ou colspan e um rótulo literal. Aspas tipográficas só são convertidas em spans numéricos positivos. Separadores de linha sem atributos podem sair quando estão repetidos ou no fim da tabela. O fechamento HTML só pode ser convertido quando encerra uma única wikitable, sem tabela HTML ou interna que explique a etiqueta. O conjunto precisa formar uma grade regular antes de entrar no rascunho.

O acréscimo de scope em tabelas com três ou quatro níveis exige partições não cruzadas de colspan, uma célula inferior para cada coluna e corpo regular. Rowspan, identificadores próprios, headers ou escopos conflitantes impedem a conversão. A marcação dos grupos superiores permanece como está.

A rolagem só reconhece uma wikitable de nível superior com class e style explícitos, width:100%, table-layout:fixed e min-width literal. Tabelas sem contêiner exigem pelo menos 640px ou 40em/rem para receber uma caixa de rolagem. Um contêiner existente deve ser a caixa simples reconhecida de overflow-x:auto. A caixa ganha max-width:100% e min-width:0, sem apagar ou reduzir o min-width da própria tabela. Os bytes da tabela permanecem completos. Uma tabela interna larga já pode estar contida em uma caixa de rolagem, sem alargar a página. A regra não pretende resolver todo tipo de estouro de largura.

O cache estrutural novo usa o texto exato como chave, até quatro rascunhos e uma estimativa máxima de 12 MiB. As opções de escopo são conferidas antes de ler o cache. Os índices de referência distinguem a leitura que admite citações Harvard da leitura usada para separar nomes de fontes. O teto se aplica a essa área, além dos caches anteriores.

Tabelas estáticas independentes, sem referências, identificadores próprios ou associações externas, podem ficar em conjuntos separados. Mudanças de fontes e demais dependências permanecem juntas. Cada subconjunto aceito precisa corresponder exatamente a conjuntos completos do plano aprovado. A recuperação nativa faz até quatro conferências adicionais e conserva apenas o que passou, sem publicar na Wikipédia.

As regras novas exigem um artigo inteiro do domínio principal, respeitam as opções de referências, tabelas e citações e não acrescentam avisos para casos incertos. Os critérios completos ficam em src/v2_10 e nos respectivos contratos. A comparação, a seleção de mudanças e a opção de desfazer continuam usando os dados do rascunho que foi analisado.

O arquivo tests/v2100/NATIVE_REPAIR_RENDER_PROOF.json confere os reparos no processamento nativo do MediaWiki e vincula os arquivos executados por hash. O arquivo NATIVE_BIRTH_CATEGORY_PROOF.json da mesma pasta repete a conferência das categorias de nascimento com esta distribuição. As consultas são anônimas e não salvam páginas. Os resultados da 2.8.2 sobre referências históricas permanecem com sua origem e data, sem serem contados como recursos novos.

Atualize dados, núcleo e carregador central, nessa ordem. Quem usa a distribuição compartilhada só precisa recarregar depois que esses arquivos forem atualizados. Os testes e o índice não publicam na Wikipédia.

"""
(OUT / 'Referencia_tecnica_RevisaWiki_v2_10_0.txt').write_text(single_spacing(technical + summary + '\n\n' + manual))
lines = ['RevisaWiki 2.10.0: resultados dos testes', '16 de outubro de 2026', '', summary, '',
         'Execuções nos arquivos finais', '']
for group in qa['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' +
                 str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.10.0. As verificações desta versão usam os arquivos finais identificados abaixo. Permutações sintéticas são casos de teste, não artigos distintos.',
          '', 'Os navegadores usam páginas locais e respostas controladas. Os resultados não demonstram todas as combinações possíveis de extensões ou editores em produção.',
          '', 'Arquivos executados', '']
for name, pin in manifest['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.',
          '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_10_0.txt').write_text(single_spacing('\n'.join(lines)))
print(json.dumps({'version': '2.10.0', 'documentationFiles': len(list(OUT.iterdir()))}))
