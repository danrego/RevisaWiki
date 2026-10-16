"""Write the 2.8.2 manual only from completed tests of the pinned files."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.8.1', ROOT / 'docs/2.8.2'
qa_paths = [ROOT / 'artifacts/v282/RELEASE_QA_SUMMARY.json',
            ROOT / 'artifacts/v282/release-test-summary.json',
            ROOT / 'tests/evidence/2.8.2/RELEASE_QA_SUMMARY.json']
qa_path = next((path for path in qa_paths if path.exists()), qa_paths[0])
qa = json.loads(qa_path.read_text())
manifest_path = ROOT / 'tests/expected_release_v282.json'
manifest = json.loads(manifest_path.read_text())
assert manifest['version'] == manifest['runtimeVersion'] == '2.8.2'
assert qa['status'] == 'passed' and qa['version'] == '2.8.2'
assert qa.get('failed', 0) == 0 and not qa.get('failures')
assert qa['releaseManifestSha256'] == hashlib.sha256(manifest_path.read_bytes()).hexdigest()
assert qa['frozenFiles'] == manifest['files']
assert isinstance(qa['portugueseSummary'], str) and qa['portugueseSummary'].strip()
assert qa['groups'] and all(isinstance(group['cases'], int) and isinstance(group['checks'], int)
                            for group in qa['groups'])
native = json.loads((ROOT / 'tests/v282/NATIVE_RENDER_PROOF.json').read_text())
assert native['version'] == '2.8.2' and native['status'] == 'passed'
assert native['frozenFiles'] == manifest['files']
assert native['releaseManifestSha256'] == qa['releaseManifestSha256']
assert native['repairedReferences'] == 132 and native['newCitationErrors'] == 0
assert native['negativeControl']['expectedErrors'] == len(native['negativeControl']['errors']) == 1
assert native['wikipediaWrites'] == native['accountsUsed'] == 0
OUT.mkdir(parents=True, exist_ok=True)
summary = qa['portugueseSummary']
repair = json.loads((ROOT / 'src/v2_8_2/HISTORICAL_CITATIONS.json').read_text())
assert repair['status'] == 'verified' and repair['title'] == 'NBC News'
assert repair['counts']['repairable'] == 132 and repair['counts']['unresolved'] == 22
assert repair['counts']['targets'] == {'Citar web': 101, 'Citar jornal': 29, 'Citar revista': 2}
features = """* Corrige trocas antigas de modelos de referência com um registro de casos conferidos, começando por NBC News.
* Escolhe o modelo nativo pela fonte original e recupera endereços apenas quando o vínculo com a mesma referência foi confirmado.
* Confere o título do artigo e os dados da fonte antes de aplicar cada correção, preservando os demais valores atuais.
* Mantém chamadas legítimas de Citation fora dos casos registrados e não consulta o histórico durante o uso.
* Mantém os recursos da 2.8.1 e a chamada fixa do common.js."""


def active(text):
    return text.replace('2.8.1', '2.8.2').replace('_v2_8_1', '_v2_8_2')


original = (BASE / 'Documentacao_RevisaWiki_v2_8_1.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head = active(head)
head = head.replace(
    'Na correção anterior, a proteção não alcançava todas as etapas da limpeza e uma chamada nativa sem URL ainda podia terminar como Citation. A 2.8.2 mantém o tipo da referência durante o processamento completo.',
    'Antes da 2.8.1, a proteção não alcançava todas as etapas da limpeza e uma chamada nativa sem URL ainda podia terminar como Citation. A 2.8.1 passou a manter o tipo da referência durante o processamento completo.')
head = re.sub(
    r"A versão '''2\.8\.2'''[^\n]+",
    "A versão '''2.8.2''' corrige trocas antigas de modelos de referência quando há um caso conferido no catálogo. O primeiro registro é de NBC News, com o tipo da fonte e os endereços confirmados no artigo de origem. Os recursos da 2.8.1 continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.",
    head, count=1)
addition = """=== Correção de referências de versões anteriores ===

A 2.8.1 impede novas trocas indevidas de modelos, mas não desfaz uma troca que já tenha sido salva. A 2.8.2 acrescenta um catálogo de casos conferidos para corrigir essas referências pelo botão Ajustar código. O primeiro caso é o artigo NBC News.

Cada correção precisa corresponder ao artigo e à referência registrados. O título e os identificadores da fonte são conferidos com o registro, e diferenças nesses campos ou uma correspondência ambígua impedem a correção. O catálogo usa revisões públicas com número de revisão e hash, sem guardar os nomes de quem editou.

O modelo de destino vem da referência conferida no artigo de origem. Notícias recebem Citar jornal, páginas web recebem Citar web e referências de revistas recebem Citar revista quando essa correspondência foi confirmada. Um endereço ausente só pode ser recuperado quando o mesmo endereço estiver comprovado para a mesma fonte. Os demais dados atuais ficam como estavam.

Em NBC News, voltar todas as chamadas para Citar web repetiria erros de URL que já existiam antes da troca. A correção usa o tipo de cada fonte e os endereços conferidos para evitar esse resultado. Referências sem correspondência confirmada ficam como estão.

Das 154 chamadas examinadas nesse caso, 132 receberam correspondência confirmada, com 101 chamadas de Citar web, 29 de Citar jornal e duas de Citar revista. As outras 22 continuam como Citation porque os dados disponíveis não bastam para confirmar a mesma fonte. A ferramenta não escolhe um endereço apenas pelo nome da publicação ou pela posição da referência no texto.

Os 132 pares de referências, antes e depois da correção, foram conferidos na pré-visualização nativa da ptwiki por consultas anônimas, sem novos erros de citação. Um caso de controle com Citar web sem URL produziu o erro esperado.

Uma chamada legítima de Citation fora desses casos permanece no mesmo modelo. A ferramenta não busca versões antigas durante o uso nem aplica essa correção a outro artigo por semelhança de título ou de publicação.

"""
anchor = '=== Escolha do modelo da referência ==='
assert head.count(anchor) == 1
head = head.replace(anchor, addition + anchor, 1)
start = history.index('=== 2.8.1 ===')
history = history[:start] + '=== 2.8.2 ===\n' + features + '\n\n' + history[start:]
tail = active(tail)
start = tail.index('Os arquivos finais da 2.8.2 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + summary + tail[end:]
manual = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n',
                head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
(OUT / 'Documentacao_RevisaWiki_v2_8_2.wiki').write_text(manual)
installation = active((BASE / 'Instalacao_RevisaWiki_v2_8_1.txt').read_text())
installation = installation.replace('mesmo que a 2.8.0 já esteja instalada.', 'mesmo que a 2.8.1 já esteja instalada.')
installation = installation.replace(
    'A chamada fixa do common.js permanece idêntica à da correção anterior.',
    'A chamada fixa do common.js permanece idêntica. Quem já a usa mantém esse bloco nas próximas atualizações.')
start = installation.index('Os arquivos finais da 2.8.2 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + summary + installation[end:]
(OUT / 'Instalacao_RevisaWiki_v2_8_2.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_8_2.txt').write_text(
    'RevisaWiki 2.8.2: correção de trocas antigas de modelos de referência com fontes e endereços conferidos, começando por NBC News.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_8_2.txt').write_text(
    'Documentação do RevisaWiki 2.8.2, com correção de referências antigas, limites do catálogo, testes e atualização.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_8_2.txt').write_text(
    'RevisaWiki 2.8.2\n15 de outubro de 2026\n\n' + features.replace('* ', '- ') + '\n\n' + summary +
    '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
(OUT / 'LEIA_PRIMEIRO.txt').write_text(
    'RevisaWiki 2.8.2\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = """RevisaWiki 2.8.2: referência técnica
Programa e dados: 2.8.2
15 de outubro de 2026

A reconstrução usa os arquivos 2.8.1 conferidos por SHA-256 e aplica src/v2_8_2/historical_patch.py. Os dados, o núcleo e o carregador central precisam declarar a mesma versão.

O registro src/v2_8_2/HISTORICAL_CITATIONS.json liga o título do artigo e a referência atual a uma correção conferida. As revisões públicas e os hashes tornam a origem da correção verificável. O primeiro registro usa as revisões 73221157 e 73221177 de NBC News, comparadas com referências do artigo em inglês.

O modelo de destino depende da família da fonte conferida. Endereços só são acrescentados quando foram comprovados para a mesma referência. Os demais valores atuais são preservados. Identificadores incompatíveis ou correspondências ambíguas impedem a correção. Não há conversão geral de Citation nem consulta ao histórico durante o uso.

A renderização dos 132 pares foi conferida por GET action=parse na ptwiki, sem conta e sem salvar páginas. O arquivo tests/v282/NATIVE_RENDER_PROOF.json guarda os hashes e os resultados, incluindo o controle de URL ausente.

A chamada fixa do common.js continua idêntica. Atualize os dados, o núcleo e o carregador central, nessa ordem. Quem usa a distribuição compartilhada só precisa recarregar depois que esses arquivos forem atualizados. Os testes e o índice não publicam na Wikipédia.

"""
(OUT / 'Referencia_tecnica_RevisaWiki_v2_8_2.txt').write_text(technical + summary + '\n\n' + manual)
lines = ['RevisaWiki 2.8.2: resultados dos testes', '15 de outubro de 2026', '', summary, '',
         'Execuções nos arquivos finais', '']
for group in qa['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' +
                 str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.8.2. As verificações desta versão usam os arquivos finais identificados abaixo. Permutações sintéticas são casos de teste, não artigos distintos.',
          '', 'Os navegadores usam páginas locais e respostas controladas. Os resultados não demonstram todas as combinações possíveis de extensões ou editores em produção.',
          '', 'Arquivos executados', '']
for name, pin in manifest['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.',
          '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_8_2.txt').write_text('\n'.join(lines))
print(json.dumps({'version': '2.8.2', 'documentationFiles': len(list(OUT.iterdir()))}))
