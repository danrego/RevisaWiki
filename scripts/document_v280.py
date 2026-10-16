"""Write the current manual from the final passed 2.8.0 evidence."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.7.3', ROOT / 'docs/2.8.0'
qa_path = ROOT / 'artifacts/v280/RELEASE_QA_SUMMARY.json'
if not qa_path.exists():
    qa_path = ROOT / 'tests/evidence/2.8.0/RELEASE_QA_SUMMARY.json'
qa = json.loads(qa_path.read_text())
manifest = json.loads((ROOT / 'tests/expected_release_v280.json').read_text())
assert qa['status'] == 'passed' and qa['version'] == '2.8.0' and qa['frozenFiles'] == manifest['files']
OUT.mkdir(parents=True, exist_ok=True)
summary = qa['portugueseSummary']
features = """* Separa arquivo, tamanho e legenda de imagens inseridas como ligações completas em campos de infocaixas conferidas.
* Corrige uma lista conferida de erros nos nomes dos parâmetros e repara links malformados de sites oficiais.
* Organiza listas simples de profissões e retira negrito externo redundante de cabeçalhos que já o aplicam.
* Impede a idade atual em datas de nascimento quando a mesma caixa informa uma data de morte completa e válida. Usa as datas existentes para calcular a idade ao morrer.
* Formata vários casamentos separados quando cada item traz seu próprio nome, data e situação conjugal explícita.
* Preserva campos preenchidos, nomes, referências e casos ambíguos. Mantém o botão Ajustar código e a chamada fixa do common.js."""


def active(text):
    return text.replace('2.7.3', '2.8.0').replace('_v2_7_3', '_v2_8')


original = (BASE / 'Documentacao_RevisaWiki_v2_7_3.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head = active(head)
head = re.sub(r"A versão '''2\.8\.0'''[^\n]+", "A versão '''2.8.0''' corrige campos de infocaixas pessoais com base no que já está escrito: imagens, parâmetros, sites, profissões, datas e casamentos separados. Cada regra confere os campos aceitos pela caixa e conserva as referências. Os ajustes entram no mesmo botão Ajustar código, com comparação e opção de desfazer.", head, count=1)
head = head.replace('Referências no meio do nome ou da data, múltiplos cônjuges, listas, datas aproximadas e construções ambíguas ficam como estavam.', 'Referências no meio do nome ou da data, datas aproximadas e construções ambíguas ficam como estavam. Listas de cônjuges só são convertidas nos casos separados e explícitos explicados abaixo.')
head = head.replace('=== Relatório e comparação ===\n\n', '=== Relatório e comparação ===\n\nAlguns reparos precisam permanecer juntos para que o código e a conferência de dados continuem válidos. Nesses casos, aceitar ou rejeitar um trecho também muda a escolha dos demais trechos do mesmo grupo. Desfazer ajustes recupera o rascunho completo anterior.\n\n', 1)
addition = """=== Imagens e parâmetros de biografias ===

Os campos e as revisões conferidos ficam nas listas de [https://github.com/danrego/RevisaWiki/blob/main/src/v2_8/FIELDS_CONTRACTS.json imagens, parâmetros e apresentação] e [https://github.com/danrego/RevisaWiki/blob/main/src/v2_8/DATES_CONTRACTS.json datas]. Uma regra só atua quando há correspondência explícita para a infocaixa usada.

Quando o campo imagem contém uma única ligação simples de arquivo, a ferramenta pode separar o nome do arquivo, o tamanho e a legenda. Isso depende dos campos aceitos pela infocaixa. Uma legenda já preenchida com outro texto impede a conversão. Opções de recorte, destino da imagem, texto alternativo ou composição que a regra não compreende também mantêm o campo original.

Erros como nacimento_data e nacionaldade têm correções próprias nas caixas conferidas. A regra não escolhe o parâmetro mais parecido. Nomes alternativos válidos continuam como estão, e um campo de destino preenchido não é sobrescrito.

Uma ligação como [[https://example.org|Site oficial]] pode virar uma ligação externa no campo de site. Protocolos repetidos, como https://https://example.org, podem ser reduzidos ao protocolo único correspondente. O endereço, o caminho e o texto do link são conservados. A regra não troca HTTP por HTTPS nem escolhe outro domínio.

Listas curtas de profissões conhecidas, separadas por vírgulas, podem receber quebras de linha. Cada item precisa ser uma profissão completa reconhecida. A ordem, as ligações e as referências são preservadas. Uma vírgula dentro de um nome ou uma expressão que a regra não reconhece impede a conversão.

O negrito externo de um campo de nome só é retirado quando a infocaixa já exibe todo esse cabeçalho em negrito e não há estilos próprios. Outros nomes, nomes completos em campos secundários e ênfase em apenas parte do texto ficam como estavam.

=== Datas completas e idade ao morrer ===

Uma data de nascimento com idade atual pode receber si quando a mesma infocaixa traz uma data de morte completa e válida. A ferramenta também pode usar nascimento e morte completos para preparar a chamada de Morte com idade ao morrer. Ela confere o calendário, a ordem das datas e a ausência de conflito com a categoria Pessoas vivas.

As datas precisam estar explícitas em campos aceitos, sem valores concorrentes. Datas aproximadas, incompletas, futuras, calendários indicados separadamente e formatos desconhecidos ficam intactos. Referências depois da data permanecem no lugar. A ferramenta não presume a morte pela idade nem busca datas para completar o campo.

=== Vários casamentos separados ===

Uma lista de cônjuges pode ser convertida quando cada item está separado por uma quebra de linha HTML ou por um marcador de lista e tem sua própria anotação explícita de casamento. O nome, as datas e o estado civil continuam associados ao mesmo item, com as referências no mesmo ponto.

Todos os itens precisam passar pela conferência. Um nome seguido apenas de anos, uma data solta ou uma indicação ambígua mantém a lista original. Vírgulas e a palavra e não são usadas para dividir nomes de cônjuges. A regra não deduz divórcio ou viuvez a partir de outro casamento ou da morte da pessoa.

As regras novas atuam no artigo inteiro, em uma única infocaixa pessoal principal com limites completos. Exemplos em comentários, código, citações, páginas de discussão e caixas incorporadas não são usados como dados da pessoa. Casos recusados por essas regras não geram avisos adicionais.

"""
# Keep example wikitext literal rather than rendering a malformed link in the manual.
addition = addition.replace('[[https://example.org|Site oficial]]', '<code><nowiki>[[https://example.org|Site oficial]]</nowiki></code>')
head = head.replace('== Portais e elementos finais ==', addition + '== Portais e elementos finais ==', 1)
start = history.index('=== 2.7.3 ===')
history = history[:start] + '=== 2.8.0 ===\n' + features + '\n\n' + history[start:]
tail = active(tail)
start = tail.index('Os arquivos finais da 2.8.0 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + summary + tail[end:]
manual = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
(OUT / 'Documentacao_RevisaWiki_v2_8.wiki').write_text(manual)
installation = active((BASE / 'Instalacao_RevisaWiki_v2_7_3.txt').read_text()).replace('mesmo que a 2.7.2 já esteja instalada.', 'mesmo que a 2.7.3 já esteja instalada.')
start = installation.index('Os arquivos finais da 2.8.0 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + summary + installation[end:]
(OUT / 'Instalacao_RevisaWiki_v2_8.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_8.txt').write_text('RevisaWiki 2.8: correções de imagens, parâmetros, sites, profissões, datas e casamentos em infocaixas pessoais.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_8.txt').write_text('Documentação do RevisaWiki 2.8, com regras de biografias, testes, histórico e instalação.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_8.txt').write_text('RevisaWiki 2.8.0\n15 de outubro de 2026\n\n' + features.replace('* ', '- ') + '\n\n' + summary + '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
(OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.8.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = """RevisaWiki 2.8.0: referência técnica
Programa e dados: 2.8.0
15 de outubro de 2026

A reconstrução usa os sete arquivos 2.7.3 conferidos por SHA-256 e aplica os módulos de src/v2_8. O conteúdo dos catálogos anteriores não muda. Os dados, o núcleo e o carregador central precisam declarar a mesma versão.

As regras novas usam uma única infocaixa pessoal principal, campos nativos conferidos e planos vinculados ao texto original. A comparação de preservação confere os demais campos, as referências e os blocos protegidos. Não há consulta a fatos novos nem dedução por nomes pessoais.

As datas só são usadas quando completas, válidas e sem conflito. Os itens de casamento são separados por limites explícitos e precisam passar todos pela conferência. As imagens exigem opções conhecidas e destinos sem conteúdo conflitante. As correções de parâmetros vêm de uma lista finita.

A comparação informa a mudança na infocaixa, e Desfazer ajustes restaura o texto original. A chamada fixa do common.js continua idêntica. Os testes novos conferem composição, idempotência, recusa de falsos positivos e restauração exata nos navegadores.

"""
(OUT / 'Referencia_tecnica_RevisaWiki_v2_8.txt').write_text(technical + summary + '\n\n' + manual)
lines = ['RevisaWiki 2.8.0: resultados dos testes', '15 de outubro de 2026', '', summary, '', 'Execuções nos arquivos finais', '']
for group in qa['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.8.0. Os testes conferem idempotência, preservação de fontes e campos, limites de atuação e falsos positivos. Permutações sintéticas são casos de teste, não artigos distintos.', '', 'Os navegadores usam páginas locais e respostas controladas. Os resultados não demonstram todas as combinações possíveis de extensões ou editores em produção.', '', 'Arquivos executados', '']
for name, pin in manifest['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.', '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_8.txt').write_text('\n'.join(lines))
print(json.dumps({'version': '2.8.0', 'documentationFiles': len(list(OUT.iterdir()))}))
