"""Write the 2.8.1 manual only from completed tests of the pinned files."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.8.0', ROOT / 'docs/2.8.1'
qa_paths = [ROOT / 'artifacts/v281/RELEASE_QA_SUMMARY.json',
            ROOT / 'artifacts/v281/release-test-summary.json',
            ROOT / 'tests/evidence/2.8.1/RELEASE_QA_SUMMARY.json']
qa_path = next((path for path in qa_paths if path.exists()), qa_paths[0])
qa = json.loads(qa_path.read_text())
manifest_path = ROOT / 'tests/expected_release_v281.json'
manifest = json.loads(manifest_path.read_text())
assert manifest['version'] == manifest['runtimeVersion'] == '2.8.1'
assert qa['status'] == 'passed' and qa['version'] == '2.8.1'
assert qa.get('failed', 0) == 0 and not qa.get('failures')
assert qa['releaseManifestSha256'] == hashlib.sha256(manifest_path.read_bytes()).hexdigest()
assert qa['frozenFiles'] == manifest['files']
assert isinstance(qa['portugueseSummary'], str) and qa['portugueseSummary'].strip()
assert qa['groups'] and all(isinstance(group['cases'], int) and isinstance(group['checks'], int)
                            for group in qa['groups'])
OUT.mkdir(parents=True, exist_ok=True)
summary = qa['portugueseSummary']
features = """* Mantém chamadas nativas de citar web quando falta a URL, com os dados e a data de acesso preservados.
* Conserva os endereços de arquivo e os demais campos, sem inventar dados para completar uma fonte.
* Adapta modelos estrangeiros de notícias com equivalência conferida para Citar jornal e preserva chamadas válidas de Citation.
* Reforça a conferência do tipo da citação e da data de acesso, ligadas ao mesmo título e aos mesmos identificadores.
* Mantém os recursos da 2.8.0 e a chamada fixa do common.js."""


def active(text):
    return text.replace('2.8.0', '2.8.1').replace('_v2_8', '_v2_8_1')


original = (BASE / 'Documentacao_RevisaWiki_v2_8.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head = active(head)
head = re.sub(
    r"A versão '''2\.8\.1'''[^\n]+",
    "A versão '''2.8.1''' mantém o modelo e os dados de uma referência quando falta a URL, incluindo a data de acesso. Também adapta modelos estrangeiros de notícias com equivalência conferida para Citar jornal, preservando chamadas válidas de Citation. Os recursos da 2.8.0 continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.",
    head, count=1)
addition = """=== Escolha do modelo da referência ===

Uma chamada nativa de citar web continua nesse modelo quando o campo url falta ou está vazio, com os dados da fonte e a data de acesso preservados. A ferramenta não cria um endereço para preencher o campo nem retira dados por causa dessa ausência.

Na correção anterior, a proteção não alcançava todas as etapas da limpeza e uma chamada nativa sem URL ainda podia terminar como Citation. A 2.8.1 mantém o tipo da referência durante o processamento completo.

Chamadas estrangeiras de notícias só recebem Citar jornal quando a equivalência do modelo foi conferida. Uma chamada válida de Citation já existente permanece nesse modelo, com seu estilo próprio. Modelos sem correspondência confirmada ficam como estavam.

Os valores dos endereços de arquivo, inclusive os recebidos por archive-url, e os demais dados da referência são conservados. As adaptações de nomes de parâmetros continuam limitadas às equivalências já aceitas pela predefinição de destino.

A conferência de preservação compara o tipo da citação e a data de acesso junto com o título e os identificadores da fonte. Ela recusa uma troca indevida de modelo ou a perda da data de consulta. Referências equivalentes ainda podem compartilhar uma definição.

"""
anchor = '=== Nomes inválidos e parâmetros repetidos ==='
assert head.count(anchor) == 1
head = head.replace(anchor, addition + anchor, 1)
start = history.index('=== 2.8.0 ===')
history = history[:start] + '=== 2.8.1 ===\n' + features + '\n\n' + history[start:]
tail = active(tail)
start = tail.index('Os arquivos finais da 2.8.1 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + summary + tail[end:]
manual = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n',
                head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
(OUT / 'Documentacao_RevisaWiki_v2_8_1.wiki').write_text(manual)
installation = active((BASE / 'Instalacao_RevisaWiki_v2_8.txt').read_text())
installation = installation.replace('mesmo que a 2.7.3 já esteja instalada.', 'mesmo que a 2.8.0 já esteja instalada.')
installation = installation.replace(
    'A chamada fixa do common.js permanece idêntica à da correção anterior.',
    'A chamada fixa do common.js permanece idêntica. Quem já a usa mantém esse bloco nas próximas atualizações.')
start = installation.index('Os arquivos finais da 2.8.1 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + summary + installation[end:]
(OUT / 'Instalacao_RevisaWiki_v2_8_1.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_8_1.txt').write_text(
    'RevisaWiki 2.8.1: preservação dos modelos e dados de referências e adaptação de modelos de notícias com equivalência conferida.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_8_1.txt').write_text(
    'Documentação do RevisaWiki 2.8.1, com preservação de referências, critérios de conversão, testes e atualização.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_8_1.txt').write_text(
    'RevisaWiki 2.8.1\n15 de outubro de 2026\n\n' + features.replace('* ', '- ') + '\n\n' + summary +
    '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
(OUT / 'LEIA_PRIMEIRO.txt').write_text(
    'RevisaWiki 2.8.1\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = """RevisaWiki 2.8.1: referência técnica
Programa e dados: 2.8.1
15 de outubro de 2026

A reconstrução usa os sete arquivos 2.8.0 conferidos por SHA-256 e aplica src/v2_8_1/citation_patch.py. O conteúdo dos catálogos anteriores não muda. Os dados, o núcleo e o carregador central precisam declarar a mesma versão.

Uma chamada nativa de citar web permanece no mesmo modelo e conserva a data de acesso quando não há URL. Os campos, os valores e as referências permanecem. As formas estrangeiras de notícias só são adaptadas quando têm equivalência conferida para Citar jornal. Chamadas válidas de Citation continuam aceitas.

A correção anterior não alcançava uma etapa posterior da limpeza, que ainda podia trocar o modelo. Esta versão retira essa conversão e confere o resultado de todo o processamento. Os casos de controle incluem referências sem URL, URLs vazias, endereços de arquivo, modelos estrangeiros e chamadas genéricas que precisam permanecer como estão.

A chamada fixa do common.js continua idêntica. Atualize os dados, o núcleo e o carregador central, nessa ordem. Quem usa a distribuição compartilhada só precisa recarregar depois que esses arquivos forem atualizados. Os testes e o índice não publicam na Wikipédia.

"""
(OUT / 'Referencia_tecnica_RevisaWiki_v2_8_1.txt').write_text(technical + summary + '\n\n' + manual)
lines = ['RevisaWiki 2.8.1: resultados dos testes', '15 de outubro de 2026', '', summary, '',
         'Execuções nos arquivos finais', '']
for group in qa['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' +
                 str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.8.1. As verificações desta versão usam os arquivos finais identificados abaixo. Permutações sintéticas são casos de teste, não artigos distintos.',
          '', 'Os navegadores usam páginas locais e respostas controladas. Os resultados não demonstram todas as combinações possíveis de extensões ou editores em produção.',
          '', 'Arquivos executados', '']
for name, pin in manifest['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.',
          '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_8_1.txt').write_text('\n'.join(lines))
print(json.dumps({'version': '2.8.1', 'documentationFiles': len(list(OUT.iterdir()))}))
