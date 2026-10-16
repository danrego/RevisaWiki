"""Write the complete current manual from the final passed release evidence."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.7.2', ROOT / 'docs/2.7.3'
qa_path = ROOT / 'artifacts/v273/RELEASE_QA_SUMMARY.json'
if not qa_path.exists():
    qa_path = ROOT / 'tests/evidence/2.7.3/RELEASE_QA_SUMMARY.json'
qa = json.loads(qa_path.read_text())
manifest = json.loads((ROOT / 'tests/expected_release_v273.json').read_text())
assert qa['status'] == 'passed' and qa['version'] == '2.7.3' and qa['frozenFiles'] == manifest['files']
OUT.mkdir(parents=True, exist_ok=True)
summary = qa['portugueseSummary']
features = """* Formata dados explícitos de casamento com a predefinição nativa, conservando nomes, datas completas e estados civis.
* Cobre 33 infocaixas e nomes alternativos de biografias, com campos de cônjuge conferidos.
* Exige um perfil individual explícito nas caixas musicais e preserva parceiros de duplas esportivas.
* Confere o calendário, as referências e os demais campos da infocaixa antes de aceitar a conversão.
* Mantém os recursos anteriores e a chamada fixa do common.js. Dados, programa e carregador central passam para 2.7.3."""


def active(text):
    return text.replace('2.7.2', '2.7.3').replace('_v2_7_2', '_v2_7_3')


original = (BASE / 'Documentacao_RevisaWiki_v2_7_2.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head = active(head)
old_intro = "A versão '''2.7.3''' corrige casos confirmados de aspas em tabelas e na leitura de trechos em itálico ou negrito. Esses problemas podiam interromper os ajustes antes dos portais. A ferramenta confere novamente a estrutura depois do reparo e conserva os dados das células, as referências e as chamadas válidas de predefinições."
new_intro = "A versão '''2.7.3''' formata anotações explícitas de casamento em campos de cônjuge, preservando os nomes, as datas e o estado civil informado. A cobertura reúne infocaixas de políticos, cientistas, músicos, atores e outros tipos de biografia, com os respectivos campos conferidos. Os reparos de tabelas e os demais recursos anteriores continuam disponíveis."
assert old_intro in head
head = head.replace(old_intro, new_intro)
addition = """=== Casamento em campos de cônjuge ===

A conversão cobre 33 infocaixas e nomes alternativos. A lista conferida fica em [https://github.com/danrego/RevisaWiki/blob/main/src/v2_7_3/CONTRACTS.json contratos das infocaixas]. Ela abrange biografias gerais, cientistas, políticos, atores, escritores, jornalistas, músicos e algumas modalidades esportivas. A ferramenta só trabalha no artigo inteiro do domínio principal, com uma única infocaixa pessoal no início do texto e um campo de cônjuge reconhecido.

Um nome seguido de uma anotação como "casados em 2000" pode receber a predefinição de casamento. O nome, a ligação e a data permanecem nos argumentos. A forma escrita no campo determina o parâmetro de concordância. O programa não procura o gênero pelo nome nem completa dados com a data de morte da pessoa.

<syntaxhighlight lang="wikitext">
| cônjuge = [[Pessoa de exemplo]] (casados em 2000)
</syntaxhighlight>

O campo passa a usar:

<syntaxhighlight lang="wikitext">
| cônjuge = {{casamento|tipo=c|()=pequeno|[[Pessoa de exemplo]]|2000}}
</syntaxhighlight>

Anotações com "casado", "casada" ou "casados" precisam trazer uma data literal. São aceitos anos de quatro algarismos entre 1000 e 9999, datas completas por extenso e datas ISO, como 2000-03-15. O calendário é validado antes da conversão. As datas completas ficam escritas da mesma forma nos argumentos e nos detalhes que a predefinição exibe ao passar o ponteiro sobre o ano.

Um intervalo explícito com "de" e "a" ou "entre" e "e" conserva as duas datas, sem deduzir divórcio ou viuvez. Uma indicação de divórcio, separação ou viuvez precisa ter sua própria data e concordar com a forma inicial. O estado civil é mantido no parâmetro fim. Se não houver data final, a ferramenta conserva apenas a data inicial e não acrescenta "presente".

Referências colocadas depois de toda a anotação permanecem no mesmo ponto, com o conteúdo e a ordem preservados. Referências no meio do nome ou da data, múltiplos cônjuges, listas, datas aproximadas e construções ambíguas ficam como estavam. Um nome seguido apenas de anos também fica preservado, pois eles podem ser datas de nascimento e morte. Chamadas de casamento já existentes não são reescritas.

Nas caixas musicais, o campo fundo precisa indicar explicitamente cantor solo, instrumentista sem vocal ou pessoa sem performances. O nome da caixa, sozinho, não basta para distinguir uma pessoa de uma banda. Nas caixas esportivas, parceiro de dupla não é cônjuge. A regra não cria campos que a infocaixa não exibe.

Se a leitura de um trecho posterior ficar incompleta no analisador, a ferramenta pode conferir separadamente a infocaixa completa no início do artigo. Ela exige que os limites da mesma caixa sejam confirmados nas duas leituras, conserva o trecho protegido e não usa seu conteúdo para completar dados. Uma possível segunda infocaixa nesse trecho impede a conversão.

A conversão aproveita apenas as correções de parâmetros já permitidas pelas regras anteriores. Quando a tradução de uma infocaixa ou de um campo estrangeiro já tem equivalência aprovada, ela pode ser concluída no mesmo clique, desde que o destino seja uma das 33 caixas conferidas. A opção de tradução precisa estar habilitada. Campos de cônjuge conflitantes e rótulos personalizados impedem esse ajuste. A conferência do resultado também vincula o casamento aos demais campos da mesma infocaixa, para que a comparação não separe ou perca informações. Desfazer ajustes restaura o rascunho original.

"""
anchor = '== Portais e elementos finais =='
assert head.count(anchor) == 1
head = head.replace(anchor, addition + anchor)
start = history.index('=== 2.7.2 ===')
history = history[:start] + '=== 2.7.3 ===\n' + features + '\n\n' + history[start:]
tail = active(tail)
start = tail.index('Os arquivos finais da 2.7.3 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + summary + tail[end:]
manual = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
(OUT / 'Documentacao_RevisaWiki_v2_7_3.wiki').write_text(manual)
installation = active((BASE / 'Instalacao_RevisaWiki_v2_7_2.txt').read_text()).replace('mesmo que a 2.7.1 já esteja instalada.', 'mesmo que a 2.7.2 já esteja instalada.')
start = installation.index('Os arquivos finais da 2.7.3 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + summary + installation[end:]
(OUT / 'Instalacao_RevisaWiki_v2_7_3.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_7_3.txt').write_text('RevisaWiki 2.7.3: formatação de casamento em infocaixas, preservando nomes, datas e estado civil.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_7_3.txt').write_text('Documentação do RevisaWiki 2.7.3, com conversão de casamento, infocaixas abrangidas, testes e instalação.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_7_3.txt').write_text('RevisaWiki 2.7.3\n15 de outubro de 2026\n\n' + features.replace('* ', '- ') + '\n\n' + summary + '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
(OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.7.3\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = """RevisaWiki 2.7.3: referência técnica
Programa e dados: 2.7.3
15 de outubro de 2026

A reconstrução usa os sete arquivos 2.7.2 conferidos por SHA-256 e aplica src/v2_7_3/marriage.js. O conteúdo dos catálogos anteriores não muda. Os dados, o núcleo e o carregador central precisam declarar a mesma versão.

O registro contém 33 nomes de infocaixas com campos de cônjuge conferidos. As revisões de origem, os nomes alternativos e os contratos dos campos ficam em src/v2_7_3/CONTRACTS.json. A caixa musical exige um campo fundo individual explícito. A regra não considera parceiros de modalidades esportivas como cônjuges.

O plano exige uma única caixa pessoal principal e uma anotação literal de casamento. Nomes, datas, intervalos e estados civis são validados antes da chamada nativa. As referências finais ficam fora da substituição. Os demais campos da caixa participam da conferência de preservação, com sua relação e multiplicidade.

A normalização inicial da caixa usa somente as regras de parâmetros e traduções já existentes e só é emitida quando uma conversão de casamento foi confirmada. Uma migração estrangeira precisa estar habilitada, não ter conflitos e terminar em uma das 33 caixas conferidas. Isso permite concluir no mesmo clique uma correção de alias já aprovada, sem aceitar campos conflitantes. O plano é regenerado a partir dos bytes de origem antes da composição do diff.

Uma caixa anterior a um trecho opaco pode ser conferida em um contexto local que termina no fechamento da própria caixa. O corte original do trecho protegido e o fim do contexto local são registrados separadamente no plano. O texto integral, as posições e os hashes continuam vinculados à prova. A regra não modifica a leitura geral do artigo nem libera o trecho protegido.

A data final não é deduzida da morte da pessoa. O gênero não é obtido de nomes ou profissões. Formas com datas incompletas, intervalos sem indicação de casamento, listas ou chamadas complexas permanecem intactas. Datas numéricas com barras não são passadas à predefinição, pois podem gerar erro de data.

A comparação informa a mudança na infocaixa, e Desfazer ajustes restaura o texto original. A chamada fixa do common.js continua idêntica. Nenhuma rotina de instalação publica na Wikipédia.

"""
(OUT / 'Referencia_tecnica_RevisaWiki_v2_7_3.txt').write_text(technical + summary + '\n\n' + manual)
lines = ['RevisaWiki 2.7.3: resultados dos testes', '15 de outubro de 2026', '', summary, '', 'Execuções nos arquivos finais', '']
for group in qa['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.7.3. Os testes conferem idempotência, preservação das fontes e dos demais campos da infocaixa, limites de atuação e falsos positivos. Permutações sintéticas são casos de teste, não artigos distintos.', '', 'As prévias públicas conferem o comportamento da predefinição com datas e estados civis. Os testes dos navegadores usam páginas locais e respostas controladas. Eles não demonstram todas as combinações possíveis de extensões ou editores em produção.', '', 'Arquivos executados', '']
for name, pin in manifest['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.', '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_7_3.txt').write_text('\n'.join(lines))
print(json.dumps({'version': '2.7.3', 'documentationFiles': len(list(OUT.iterdir()))}))
