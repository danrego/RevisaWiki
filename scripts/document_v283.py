"""Write the 2.8.3 manual only from completed tests of the pinned files."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE, OUT = ROOT / 'docs/2.8.2', ROOT / 'docs/2.8.3'
qa_paths = [ROOT / 'artifacts/v283/RELEASE_QA_SUMMARY.json',
            ROOT / 'artifacts/v283/release-test-summary.json',
            ROOT / 'tests/evidence/2.8.3/RELEASE_QA_SUMMARY.json']
qa_path = next((path for path in qa_paths if path.exists()), qa_paths[0])
qa = json.loads(qa_path.read_text())
manifest_path = ROOT / 'tests/expected_release_v283.json'
manifest = json.loads(manifest_path.read_text())
assert manifest['version'] == manifest['runtimeVersion'] == '2.8.3'
assert qa['status'] == 'passed' and qa['version'] == '2.8.3'
assert qa.get('failed', 0) == 0 and not qa.get('failures')
assert qa['releaseManifestSha256'] == hashlib.sha256(manifest_path.read_bytes()).hexdigest()
assert qa['frozenFiles'] == manifest['files']
assert isinstance(qa['portugueseSummary'], str) and qa['portugueseSummary'].strip()
assert qa['groups'] and all(isinstance(group['cases'], int) and isinstance(group['checks'], int)
                            for group in qa['groups'])
native = json.loads((ROOT / 'tests/v283/NATIVE_BIRTH_CATEGORY_PROOF.json').read_text())
assert native['version'] == '2.8.3' and native['status'] == 'passed'
assert native['frozenFiles'] == manifest['files']
assert native['releaseManifestSha256'] == qa['releaseManifestSha256']
assert native['realBiographyPairs'] >= 6
assert native['categoryMembershipAndSortKeysUnchanged'] is True
assert native['wikipediaWrites'] == native['accountsUsed'] == 0
OUT.mkdir(parents=True, exist_ok=True)
summary = qa['portugueseSummary']
features = """* Retira a categoria explícita de ano de nascimento quando uma chamada ativa e conferida de Dni já gera a mesma categoria.
* Confirma a categoria por consulta anônima à ptwiki antes da retirada.
* Preserva chaves de ordenação, DEFAULTSORT e os casos sem confirmação, sem novos avisos.
* Mantém os recursos da 2.8.2 e a chamada fixa do common.js."""


def active(text):
    return text.replace('2.8.2', '2.8.3').replace('_v2_8_2', '_v2_8_3')


original = (BASE / 'Documentacao_RevisaWiki_v2_8_2.wiki').read_text()
head, history = original.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head = active(head)
# Keep the dated source-recovery evidence exactly as published in 2.8.2.
historical_anchor = '=== Correção de referências de versões anteriores ==='
historical_end = '=== Escolha do modelo da referência ==='
old_historical = original.split(historical_anchor, 1)[1].split(historical_end, 1)[0]
start = head.index(historical_anchor) + len(historical_anchor)
end = head.index(historical_end, start)
head = head[:start] + old_historical + head[end:]
query_anchor = 'Os cálculos de ajuste e ortografia ficam no navegador. As consultas online usam a API pública da Wikipédia, Wikidata ou Crossref conforme o recurso.'
assert head.count(query_anchor) == 1
head = head.replace(query_anchor,
    'A confirmação da categoria de nascimento envia a infocaixa reconhecida para a API de análise da ptwiki, sem conta e sem salvar. O resultado só vale para o texto que foi consultado.\n\n' + query_anchor, 1)
head = re.sub(
    r"A versão '''2\.8\.3'''[^\n]+",
    "A versão '''2.8.3''' retira uma categoria explícita de ano de nascimento quando uma chamada ativa de Dni já gera a mesma categoria, com confirmação da ptwiki. Casos incertos ficam como estão, sem novos avisos. Os recursos da 2.8.2 continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.",
    head, count=1)
addition = """=== Categoria de nascimento repetida ===

Quando a data de nascimento da pessoa está em uma chamada ativa de Dni na infocaixa principal reconhecida, o RevisaWiki pode retirar as linhas de categoria que repetem o mesmo ano. Antes disso, uma consulta anônima à ptwiki precisa confirmar que a chamada gera exatamente essa categoria. A categoria continua no artigo pelo resultado da predefinição. Também são aceitos os nomes alternativos DNI, Nascimento e idade e Data de nascimento.

O ano precisa ter quatro algarismos, de 1000 até o ano atual, com mês e dia válidos quando informados. A infocaixa precisa ter um único campo de nascimento aceito e o nome da mesma pessoa do título do artigo.

A retirada alcança apenas linhas de categoria explícita isoladas e sem barra vertical, incluindo repetições idênticas. Outra chamada ativa da mesma categoria com uma barra vertical impede o ajuste, mesmo que a chave esteja vazia. DEFAULTSORT permanece como está, sem impedir a retirada de uma linha simples. A regra não retira outras categorias nem muda datas ou os dados da infocaixa.

O parâmetro si de Dni desliga a idade exibida, mas mantém a categoria do ano de nascimento. nocat vazio permite a categorização normal, mas qualquer valor preenchido, inclusive 0 ou false, impede esse ajuste. Uma categoria de outro ano, uma data sem confirmação, campos conflitantes, chamadas calculadas, trechos protegidos ou estruturas desconhecidas mantêm a categoria no código.

A resposta precisa corresponder ao mesmo texto e à mesma chamada. Uma confirmação de um texto anterior ou uma resposta com avisos não autoriza a retirada.

O ajuste exige um artigo inteiro do domínio principal. Não atua em discussões, predefinições ou edição de seção. Se a consulta falhar ou não confirmar a mesma categoria, ela permanece no código, sem um aviso adicional. Os outros ajustes podem continuar.

"""
anchor = '=== Datas completas e idade ao morrer ==='
assert head.count(anchor) == 1
head = head.replace(anchor, addition + anchor, 1)
start = history.index('=== 2.8.2 ===')
history = history[:start] + '=== 2.8.3 ===\n' + features + '\n\n' + history[start:]
tail = active(tail)
start = tail.index('Os arquivos finais da 2.8.3 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + summary + tail[end:]
manual = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n',
                head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
(OUT / 'Documentacao_RevisaWiki_v2_8_3.wiki').write_text(manual)
installation = active((BASE / 'Instalacao_RevisaWiki_v2_8_2.txt').read_text())
installation = installation.replace('mesmo que a 2.8.1 já esteja instalada.', 'mesmo que a 2.8.2 já esteja instalada.')
installation = installation.replace('Os recursos de destinos, portais e DOI podem fazer as consultas públicas explicadas no manual.',
    'Os recursos de destinos, portais, DOI e confirmação de categorias de nascimento podem fazer as consultas públicas explicadas no manual.')
start = installation.index('Os arquivos finais da 2.8.3 passaram')
end = installation.index('\n\n', start)
installation = installation[:start] + summary + installation[end:]
(OUT / 'Instalacao_RevisaWiki_v2_8_3.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_8_3.txt').write_text(
    'RevisaWiki 2.8.3: retirada de categorias explícitas de nascimento já geradas por Dni, com confirmação da ptwiki e preservação dos casos incertos.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_8_3.txt').write_text(
    'Documentação do RevisaWiki 2.8.3, com categorias de nascimento repetidas, limites do ajuste, testes e atualização.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_8_3.txt').write_text(
    'RevisaWiki 2.8.3\n16 de outubro de 2026\n\n' + features.replace('* ', '- ') + '\n\n' + summary +
    '\n\nAbra INICIO.html e siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
(OUT / 'LEIA_PRIMEIRO.txt').write_text(
    'RevisaWiki 2.8.3\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nO arquivo completo reúne o código para download e testes locais. Na Wikipédia, instale os dados e o núcleo separados. O índice não salva nem publica alterações.\n\nCódigo, documentação, testes e versões anteriores: https://github.com/danrego/RevisaWiki\n')
technical = """RevisaWiki 2.8.3: referência técnica
Programa e dados: 2.8.3
16 de outubro de 2026

A reconstrução usa os arquivos 2.8.2 conferidos por SHA-256 e aplica o módulo de src/v2_8_3. Os dados, o núcleo e o carregador central precisam declarar a mesma versão.

A retirada de uma categoria explícita de ano de nascimento exige Dni ativo no campo de nascimento da infocaixa principal reconhecida. Uma consulta anônima confirma a categoria gerada pela mesma chamada. Apenas linhas simples e sem barra vertical da mesma categoria podem sair, incluindo repetições idênticas.

Uma chamada ativa da mesma categoria com barra vertical impede o ajuste. DEFAULTSORT permanece byte a byte e não impede a retirada de uma categoria simples. nocat vazio permite a categorização, mas valores preenchidos, inclusive 0 e false, impedem o ajuste. si mantém a categoria do ano. Conflitos, valores calculados, trechos protegidos e estruturas sem confirmação permanecem. Em outros domínios ou na edição de seção, essa regra fica desligada. A comprovação precisa corresponder ao mesmo texto e à mesma chamada, sem avisos, e expira após cinco minutos. A consulta GET tem limite de 6.500 caracteres no endereço e prazo de quatro segundos. Falhas de consulta preservam a categoria sem novos avisos.

O arquivo tests/v283/NATIVE_BIRTH_CATEGORY_PROOF.json guarda a comprovação nativa das categorias, com os arquivos executados vinculados por hash. As consultas não usam conta nem salvam páginas. A documentação mantém os números e a origem da correção de referências da 2.8.2, sem contá-los como um recurso novo.

Os limites e as revisões das predefinições conferidas estão em src/v2_8_3/BIRTH_CATEGORY_CONTRACTS.json. Os campos nativos de nascimento seguem src/v2_8/DATES_CONTRACTS.json. Marcas de transclusão ativas, como includeonly, noinclude ou onlyinclude, também impedem essa retirada.

A chamada fixa do common.js continua idêntica. Atualize os dados, o núcleo e o carregador central, nessa ordem. Quem usa a distribuição compartilhada só precisa recarregar depois que esses arquivos forem atualizados. Os testes e o índice não publicam na Wikipédia.

"""
(OUT / 'Referencia_tecnica_RevisaWiki_v2_8_3.txt').write_text(technical + summary + '\n\n' + manual)
lines = ['RevisaWiki 2.8.3: resultados dos testes', '16 de outubro de 2026', '', summary, '',
         'Execuções nos arquivos finais', '']
for group in qa['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' +
                 str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'As revisões de artigos, os hashes das entradas e os arquivos executados ficam em tests/evidence/2.8.3. As verificações desta versão usam os arquivos finais identificados abaixo. Permutações sintéticas são casos de teste, não artigos distintos.',
          '', 'Os navegadores usam páginas locais e respostas controladas. Os resultados não demonstram todas as combinações possíveis de extensões ou editores em produção.',
          '', 'Arquivos executados', '']
for name, pin in manifest['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia. O pacote, o índice e a documentação têm conferências próprias. Os resultados históricos não foram contados como novas execuções.',
          '', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_8_3.txt').write_text('\n'.join(lines))
print(json.dumps({'version': '2.8.3', 'documentationFiles': len(list(OUT.iterdir()))}))
