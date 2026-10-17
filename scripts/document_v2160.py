"""Write the patch manual from the exact runtime and completed test receipt."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
FEATURES = '* Completa campos pessoais ausentes com datas e locais explicitamente referenciados na abertura, mantendo o texto de origem.\n* Separa uma data seguida do local no mesmo campo quando cada parte tem sua referência e o destino foi conferido.\n* Organiza datas completas isoladas sem acrescentar idade ou categorias de nascimento.\n* Retira uma idade manual apenas quando ela repete a idade que Dni mostra na mesma data UTC.\n* Retira uma unidade literal quando a definição conferida da caixa já acrescenta a mesma unidade.\n* Recupera quebras de linha entre itens ligados de uma lista com marcadores explícitos.\n* Retira rótulos copiados nos valores e ligações do cabeçalho para o próprio artigo, preservando o texto exibido.\n* Conclui a retirada de títulos finais vazios depois da movimentação do bloco final, sem precisar de outro clique.'
SCOPE = '=== Dados da abertura e campos pessoais ===\n\nEm artigos completos, datas e locais da identificação inicial podem completar campos ausentes de uma única infocaixa pessoal nativa. A caixa e a abertura precisam identificar a mesma pessoa. Cada dado copiado precisa ter uma referência própria e um campo de destino com funcionamento conferido. O texto da abertura permanece no lugar e as chamadas nomeadas só são reutilizadas quando têm uma definição local única e válida.\n\nNa cópia da abertura, um campo explicitamente vazio permanece vazio. Campos preenchidos não recebem valores diferentes. Um dado que possa vir do Wikidata, uma condição da caixa ainda não conferida, aliases conflitantes, referências indefinidas ou valores calculados impedem a cópia. A regra não procura novos fatos na internet nem deduz nacionalidade, gênero ou estado civil.\n\nUma data seguida do local no campo de data pode passar a campos separados quando cada parte tem sua referência e o local de destino está ausente ou vazio. As referências ficam ligadas aos mesmos dados. Datas e locais conflitantes, um campo de país que exigiria combinar valores e uma separação incerta permanecem como estavam.\n\nDatas completas isoladas podem usar DataExt, que apresenta a data sem acrescentar idade ou categorias. A regra aceita apenas as formas literais conferidas e datas gregorianas válidas a partir de 1583, sem datas futuras. Datas incompletas, aproximadas ou em outro calendário permanecem iguais. Uma chamada válida de Dni ou dni conserva sua grafia.\n\nUma idade manual depois de Dni pode sair quando repete exatamente a idade exibida pela predefinição naquele dia UTC. Uma chamada sem idade, um número diferente ou um texto com outra data não recebe esse ajuste. A confirmação expira na virada do dia e precisa ser refeita antes de reutilizar o resultado.\n\nA correção de unidade fica limitada ao campo de altura de Info/Piloto de automóvel cuja definição acrescenta o símbolo de metro. O número permanece igual. Outras unidades e caixas que esperam a unidade escrita pelo editor ficam como estavam.\n\nNa família conferida de Info/Biografia, uma lista com dois a oito itens explicitamente ligados e iniciados por asteriscos pode receber as quebras de linha ausentes. Os itens conservam ordem, texto, ligações e referências. Fórmulas, notas com asterisco e construções que possam ter outro sentido não são convertidas em listas.\n\nRótulos copiados para dentro de campos podem sair quando repetem o rótulo da linha e o valor restante foi reconhecido. Essa regra cobre os campos conferidos de Info/Biografia e as datas e locais conferidos de Info/Futebolista. Uma ligação no cabeçalho para o próprio artigo pode perder a marcação de ligação sem mudar o texto exibido. Uma ligação para outra pessoa permanece igual.\n\nDepois da organização do bloco final, a conferência retira títulos finais realmente vazios. Comentários, texto, predefinições desconhecidas e subseções continuam pertencendo à seção e impedem sua retirada. Essa passagem final só trata os títulos vazios, sem repetir a movimentação de caixas ou listas de referências.\n\nAs inserções de dados em um novo local de exibição não recebem marcação automática de edição menor. Os ajustes de apresentação continuam sujeitos à comparação com a revisão-base. O resumo e a contagem precisam corresponder ao que foi mantido no rascunho. Nenhuma regra salva a página.\n\nEssas regras novas não se aplicam a edições de seção, discussões, exemplos ou definições de predefinições. Para desativá-las, use <code>automaticBiographyFields: false</code>. Os campos <code>sepultamento</code>, <code>enterro</code>, <code>enterro_local</code> e <code>resting_place</code> permanecem como estavam enquanto a discussão da comunidade continua.\n\n'

def clean(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


def main():
    raw = (ROOT / 'tests/expected_release_v2160.json').read_bytes()
    manifest = json.loads(raw)
    qa = json.loads((ROOT / 'artifacts/v2160/QA_SUMMARY.json').read_text())
    assert qa['status'] in ['passed', 'passed-with-preexisting-findings'] and qa['releaseManifestSha256'] == hashlib.sha256(raw).hexdigest()
    summary = qa['portugueseSummary']
    base = (ROOT / 'docs/2.15.1/Documentacao_RevisaWiki_v2_15_1.wiki').read_text()
    head, history = base.split('== Histórico das versões ==', 1)
    history, tail = history.split('== Testes e detalhes técnicos ==', 1)
    head = head.replace('2.15.1', '2.16.0').replace('_v2_15_1', '_v2_16_0')
    head = re.sub(r"A versão '''2\.16\.0'''[^\n]+", "A versão '''2.16''' completa campos pessoais ausentes com dados referenciados da abertura e corrige datas, listas e repetições nos campos conferidos.", head, count=1)
    scope = '\n'.join(line.rstrip(' \t') for line in SCOPE.split('\n'))
    head = head.replace('=== Infocaixas e identificação inicial ===', scope + '=== Infocaixas e identificação inicial ===', 1)
    pos = history.index('=== 2.15.1 ===')
    history = history[:pos] + '=== 2.16.0 ===\n\n' + FEATURES + '\n\n' + history[pos:]
    start = tail.index('Os arquivos finais da versão 2.15.1 passaram')
    end = tail.index('\n\n', start)
    tail = tail[:start] + summary + tail[end:]
    tail = tail.replace('tests/evidence/2.15.1', 'tests/evidence/2.16.0')
    manual = clean(head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
    assert manual.split('=== 2.15.1 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0] == base.split('=== 2.15.1 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    out = ROOT / 'docs/2.16.0'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'Documentacao_RevisaWiki_v2_16_0.wiki').write_text(manual)
    installation = (ROOT / 'docs/2.15.1/Instalacao_RevisaWiki_v2_15_1.txt').read_text().replace('2.15.1', '2.16.0').replace('_v2_15_1', '_v2_16_0')
    installation = installation.replace('mesmo que a 2.15.0 já esteja instalada', 'mesmo que a 2.15.1 já esteja instalada')
    start = installation.index('Os arquivos finais da versão 2.16.0 passaram')
    end = installation.index('\n\n', start)
    installation = installation[:start] + summary + installation[end:]
    (out / 'Instalacao_RevisaWiki_v2_16_0.txt').write_text(clean(installation))
    (out / 'Resumo_atualizacao_RevisaWiki_v2_16_0.txt').write_text('RevisaWiki 2.16: dados referenciados, datas e preenchimento de infocaixas pessoais.\n')
    (out / 'Resumo_documentacao_RevisaWiki_v2_16_0.txt').write_text('Documentação do RevisaWiki 2.16.0: ajustes, limites e instalação.\n')
    (out / 'Notas_da_versao_RevisaWiki_v2_16_0.txt').write_text(clean('RevisaWiki 2.16.0\n16 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
    (out / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.16.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
    technical = ('RevisaWiki 2.16.0: referência técnica\n16 de outubro de 2026\n\n'
                 'A reconstrução parte da distribuição 2.15.1 fixada por SHA-256 e aplica os módulos de src/v2_16. Os arquivos históricos permanecem intactos. O plano de cada reparo é calculado a partir do código de entrada.\n\n' +
                 re.sub(r'</?code>', '', scope.replace('=== Dados da abertura e campos pessoais ===\n\n', '')).replace("'''", '') + summary + '\n')
    (out / 'Referencia_tecnica_RevisaWiki_v2_16_0.txt').write_text(clean(technical))
    lines = ['RevisaWiki 2.16.0: resultados dos testes', '16 de outubro de 2026', '', summary, '']
    for row in qa['groups']:
        suffix = ', sem falhas.' if row['status'] == 'passed' else ', com ' + str(row.get('preexistingFindings', 0)) + ' ocorrências idênticas às da versão anterior e nenhuma regressão nova.'
        cases = f"{row['cases']:,}".replace(',', '.')
        checks = f"{row['checks']:,}".replace(',', '.')
        lines.append('- ' + row['label'] + ': ' + cases + (' caso' if row['cases'] == 1 else ' casos') + ' e ' + checks + (' verificação' if row['checks'] == 1 else ' verificações') + suffix)
    lines += ['', 'Casos sintéticos e execuções nas duas distribuições não são artigos distintos. Os resultados e hashes ficam em tests/evidence/2.16.0.', '', 'Arquivos executados', '']
    for name, proof in manifest['files'].items():
        lines += [name + ': ' + str(proof['bytes']) + ' bytes', 'SHA-256: ' + proof['sha256']]
    lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
    (out / 'Relatorio_testes_RevisaWiki_v2_16_0.txt').write_text(clean('\n'.join(lines)))
    print(json.dumps({'version': '2.16.0', 'documentationFiles': len(list(out.iterdir()))}))


if __name__ == '__main__':
    main()
