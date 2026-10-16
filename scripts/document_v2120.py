"""Generate the tested 2.12 manual without changing archived release entries."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/2.12.0'
MANIFEST = ROOT / 'tests/expected_release_v2120.json'
QA_PATH = ROOT / 'artifacts/v2120/RELEASE_QA_SUMMARY.json'
FEATURES = '''* Corrige group para grupo nas listas nativas de Referências quando o campo é único e literal.
* Retira campos equivalentes repetidos das citações quando os valores coincidem, sem misturar funções diferentes.
* Retira os colchetes de um campo de endereço que contém somente uma URL HTTP ou HTTPS, sem rótulo.
* Retira atributos idênticos repetidos em listas references, conservando as definições e os grupos.
* Permite os reparos de tabelas quando formatnum contém apenas um número literal no conteúdo de uma célula.
* Preserva os atributos de ordenação reconhecidos enquanto aplica os demais reparos confirmados da tabela.
* Corrige uma aspa incompatível em rowspan ou colspan quando há uma única correção e a grade completa confere.
* Acrescenta rolagem local a tabelas reconhecidas com largura fixa de 640 a 9.999 pixels, sem alterar os dados.'''

REFERENCE_SCOPE = '''=== Grupo da lista no parâmetro nativo ===

Uma chamada como <code><nowiki>{{Referências|group=nota}}</nowiki></code> pode passar a <code><nowiki>{{Referências|grupo=nota}}</nowiki></code>. O nome em português é o campo aceito pela predefinição. A mudança exige um único grupo literal, sem outro parâmetro grupo, campos definidos pela posição ou argumentos calculados. O texto do grupo permanece igual. As etiquetas <code>&lt;ref group="nota"&gt;</code> e <code>&lt;references group="nota" /&gt;</code> continuam usando group, que é o atributo nativo dessas etiquetas.

Um campo group ignorado pela predefinição não confirma que aquele grupo está sendo exibido, pois o atributo da etiqueta e o parâmetro da predefinição têm contratos diferentes. Uma chamada com grupos diferentes ou dados que não possam ser lidos com segurança permanece intacta.

=== Campos equivalentes repetidos na citação ===

Em Citar web, Citar jornal, Citar revista e Citar livro, campos que a implementação nativa trata como o mesmo dado podem perder as repetições. Por exemplo, <code>jornal=Publicação X</code> e <code>obra=Publicação X</code> ficam com o primeiro campo, exatamente como foi escrito. A regra compara todos os campos daquela família. Espaços nas pontas do valor podem ser ignorados na comparação, mas o valor mantido não é reescrito.

Um campo vazio, um terceiro valor diferente ou conteúdo calculado impede a retirada daquela família. Autores e editores não entram nessa consolidação. Publicação e editora continuam sendo dados separados, mesmo quando têm o mesmo nome. O modelo, os demais parâmetros e os valores da fonte permanecem iguais. O catálogo aceita somente nomes de campos conferidos na implementação nativa.

=== Colchetes no campo de endereço ===

Um campo como <code>url=[https://example.test/fonte]</code> pode ficar como <code>url=https://example.test/fonte</code> se os colchetes envolverem somente um endereço HTTP ou HTTPS completo, sem rótulo. A regra conserva cada caractere do endereço, sem seguir redirecionamentos, retirar pontuação ou tentar reconstruir uma ligação.

Um rótulo junto ao endereço, campos repetidos para a mesma função, credenciais, comentários, colchetes internos ou sintaxe calculada impedem a mudança. Endereço principal, endereço arquivado e endereço de capítulo têm campos próprios e não são trocados entre si. Os campos de capítulo recebem esse ajuste apenas na chamada nativa de Citar livro, onde a função foi conferida. O restante dos dados da citação permanece igual.

=== Atributos repetidos da lista de referências ===

Uma etiqueta <code>&lt;references group="nota" group="nota" /&gt;</code> pode ficar com um único atributo group quando todos os atributos são reconhecidos e os valores repetidos são exatamente iguais. O mesmo vale para responsive quando o valor literal é 0 ou 1. Um atributo desconhecido, uma aspa incompleta ou valores diferentes impedem o reparo.

Quando a lista guarda fontes completas, cada definição precisa continuar no mesmo lugar e com o mesmo corpo. Bancos com conteúdo calculado, chamadas desconhecidas, exemplos protegidos ou estrutura ambígua permanecem como estão. A regra não transfere referências nem decide a qual fonte pertence uma chamada.

Esses quatro ajustes exigem artigo inteiro do domínio principal e usam Ajustar código, com comparação e opção de desfazer. Não criam avisos genéricos para os casos preservados. Erros confirmados podem continuar na conferência. Cada campo ou atributo retirado conta como uma correção. Os dois colchetes externos de um único endereço contam juntos, como uma conversão.

'''

TABLE_SCOPE = '''=== Números formatados e ordenação ===

Uma chamada como <code><nowiki>{{formatnum:1200}}</nowiki></code> no conteúdo de uma célula pode permanecer na tabela sem impedir os demais reparos. A chamada precisa conter somente um número literal, sem outro argumento ou expansão. O programa não calcula nem substitui o número. Uso dentro de atributos, antes de um separador ausente ou em partes que possam mudar a estrutura continua impedindo o reparo que depende dessa leitura.

Tabelas ordenáveis podem conservar <code>data-sort-value</code> e <code>data-sort-type</code> enquanto recebem os reparos já confirmados para a grade. Os valores são preservados exatamente. O tipo precisa pertencer à lista reconhecida, e data-sort-type só é admitido em cabeçalhos. A tabela também precisa declarar a classe sortable. Chaves calculadas, atributos de ordenação repetidos ou tipos desconhecidos impedem esses reparos. O script não escolhe outra ordem nem recalcula as chaves das células.

=== Aspas incompatíveis em extensões numéricas ===

Em um atributo como <code>colspan="2'</code>, a aspa final pode virar <code>"</code> quando essa troca resolve o único caso incompatível e produz uma grade completa e regular. O mesmo princípio vale para rowspan e para uma abertura com aspa simples. A regra conserva a aspa de abertura e troca somente o fechamento incompatível.

É preciso haver um único caso desse tipo na tabela, com inteiro positivo, separador explícito e conteúdo literal. A correção precisa produzir uma grade completa e regular. Números fracionários, valores calculados, outra leitura possível ou linhas que continuem incompatíveis impedem a mudança. A regra não acrescenta células para completar a tabela.

=== Largura fixa e telas pequenas ===

Uma tabela nativa com classe wikitable e largura fixa de 640 a 9.999 pixels pode receber um contêiner de rolagem. A largura pode estar no atributo width ou num estilo simples, como <code>width:1200px;</code>. Tabelas ordenáveis também podem receber o contêiner quando os atributos e a grade foram confirmados. A tabela inteira permanece igual entre a abertura e o fechamento novos.

O contêiner usa <code>max-width:100%;min-width:0;overflow-x:auto;</code>. Quando a tabela não cabe, a rolagem fica nessa área. A mudança não reduz a fonte, esconde colunas ou corta células. Em telas maiores, a mesma tabela mantém os dados e a largura que já tinha.

A regra nova exige tabela inteira, isolada no nível principal do artigo, com até 500.000 caracteres. Classes próprias, identificadores, tabelas aninhadas, contêineres já existentes, larguras percentuais ou relativas, posições especiais e estilos fora do conjunto reconhecido impedem esse novo ajuste. Uma tabela estreita não recebe rolagem por esse critério. Os reparos anteriores de largura mínima continuam disponíveis nos formatos já conferidos.

'''


def active(text):
    return text.replace('2.11.1', '2.12.0').replace('_v2_11_1', '_v2_12_0')


def single(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


def main():
    manifest = json.loads(MANIFEST.read_text())
    qa = json.loads(QA_PATH.read_text())
    assert qa['version'] == '2.12.0' and qa['status'] == 'passed'
    assert not qa.get('failed', 0) and not qa.get('failures')
    assert qa['releaseManifestSha256'] == hashlib.sha256(MANIFEST.read_bytes()).hexdigest()
    assert qa['frozenFiles'] == manifest['files']
    summary = qa['portugueseSummary']
    base = (ROOT / 'docs/2.11.1/Documentacao_RevisaWiki_v2_11_1.wiki').read_text()
    head, history = base.split('== Histórico das versões ==', 1)
    history, tail = history.split('== Testes e detalhes técnicos ==', 1)
    head, tail = active(head), active(tail)
    head, count = re.subn(r"A versão '''2\.12\.0'''[^\n]+", "A versão '''2.12.0''' amplia os reparos automáticos de tabelas e referências, com os dados originais preservados e critérios separados para cada formato. Os recursos das versões anteriores continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.", head, count=1)
    assert count == 1
    reference_anchor = '=== Destinos das citações abreviadas ==='
    table_anchor = '== Ortografia =='
    assert head.count(reference_anchor) == head.count(table_anchor) == 1
    head = head.replace(reference_anchor, REFERENCE_SCOPE + reference_anchor, 1)
    head = head.replace(table_anchor, TABLE_SCOPE + table_anchor, 1)
    history = history.replace('=== 2.11.1 ===', '=== 2.12.0 ===\n' + FEATURES + '\n\n=== 2.11.1 ===', 1)
    start = tail.index('Os arquivos finais da 2.12.0 passaram')
    end = tail.index('\n\n', start)
    tail = tail[:start] + summary + tail[end:]
    manual = single(head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
    previous_history = base.split('=== 2.11.1 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    new_history = manual.split('=== 2.11.1 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    assert previous_history == new_history
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'Documentacao_RevisaWiki_v2_12_0.wiki').write_text(manual)
    installation = active((ROOT / 'docs/2.11.1/Instalacao_RevisaWiki_v2_11_1.txt').read_text())
    installation = installation.replace('mesmo que a 2.11.0 já esteja instalada.', 'mesmo que a 2.11.1 já esteja instalada.')
    start = installation.index('Os arquivos finais da 2.12.0 passaram')
    end = installation.index('\n\n', start)
    installation = single(installation[:start] + summary + installation[end:])
    (OUT / 'Instalacao_RevisaWiki_v2_12_0.txt').write_text(installation)
    (OUT / 'Resumo_atualizacao_RevisaWiki_v2_12_0.txt').write_text('RevisaWiki 2.12.0: reparos automáticos de tabelas e referências, com preservação dos dados, endereços e ordenação.\n')
    (OUT / 'Resumo_documentacao_RevisaWiki_v2_12_0.txt').write_text('Documentação do RevisaWiki 2.12.0: novos reparos de tabelas e referências, limites, testes e instalação.\n')
    (OUT / 'Notas_da_versao_RevisaWiki_v2_12_0.txt').write_text(single('RevisaWiki 2.12.0\n16 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
    (OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.12.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
    technical = '''RevisaWiki 2.12.0: referência técnica
16 de outubro de 2026

A reconstrução parte dos sete arquivos fixados da distribuição 2.11.1 e aplica os módulos de src/v2_12. Os arquivos arquivados permanecem intactos. Dados, núcleo e carregador central declaram 2.12.0. As duas chamadas fixas continuam idênticas.

Os campos de referências seguem os contratos nativos registrados em REFERENCE_FIELD_CONTRACTS.json. grupo pertence à predefinição Referências, enquanto group continua nas etiquetas Cite. A retirada de aliases exige todos os valores preenchidos e iguais após retirar somente espaços das pontas para comparar. O primeiro campo e seus bytes ficam no código. Autores e editores não entram nessa regra, e publicação e editora conservam papéis diferentes.

A retirada de colchetes aceita somente um endereço HTTP ou HTTPS isolado num campo nativo conferido. O endereço original permanece byte por byte. URL principal, arquivo e capítulo têm papéis separados. A regra de capítulo exige Citar livro. Atributos repetidos em references precisam ser nativos, literais e idênticos. O corpo e a posição das definições da lista permanecem iguais.

As provas de tabelas reconhecem formatnum apenas com número literal dentro de uma célula. data-sort-value e data-sort-type mantêm seus valores, com tipo reconhecido no cabeçalho e classe sortable explícita. A troca de uma aspa oposta em rowspan ou colspan exige inteiro positivo, separador literal, um único candidato e grade completa. O plano não inventa células nem interpreta conteúdo calculado.

O contêiner de largura fixa aceita tabelas wikitable reconhecidas entre 640 e 9.999 pixels, com ou sem a classe sortable. Exige uma única largura num atributo ou estilo simples e até 500.000 caracteres. Os bytes da tabela permanecem iguais dentro do contêiner. Tabelas aninhadas, identificadores, classes próprias, outras formas de apresentação e contêineres existentes impedem essa regra.

Os novos planos reproduzem as alterações a partir do texto de origem. A conferência de preservação e a decisão de edição menor usam suas próprias provas. O contador registra cada campo ou atributo retirado e cada endereço convertido, sem confundir blocos do diff com ocorrências. Os limites de colunas permanecem em dez referências por lista e seis itens nas listas finais reconhecidas.

As consultas nativas capturadas usam GET anônimo, sem salvar. Seus arquivos conservam os hashes dos contratos e das pequenas projeções. Testes locais verificam os artigos completos e os controles de falsos positivos. Uma projeção não é apresentada como análise nativa de um artigo inteiro. Casos sintéticos não são apresentados como artigos distintos.

'''
    (OUT / 'Referencia_tecnica_RevisaWiki_v2_12_0.txt').write_text(single(technical + summary + '\n\n' + manual))
    lines = ['RevisaWiki 2.12.0: resultados dos testes', '16 de outubro de 2026', '', summary, '', 'Execuções nos arquivos finais', '']
    for group in qa['groups']:
        lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
    lines += ['', 'Casos sintéticos e permutações não são artigos distintos. Os navegadores usam páginas locais com respostas controladas. Os relatórios e os hashes ficam em tests/evidence/2.12.0.', '', 'Arquivos executados', '']
    for name, pin in manifest['files'].items():
        lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
    lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
    (OUT / 'Relatorio_testes_RevisaWiki_v2_12_0.txt').write_text(single('\n'.join(lines)))
    print(json.dumps({'version': '2.12.0', 'documentationFiles': len(list(OUT.iterdir()))}))


if __name__ == '__main__':
    main()
