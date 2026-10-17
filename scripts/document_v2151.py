"""Write the patch manual from the exact runtime and completed test receipt."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
FEATURES = '* Move a infocaixa pessoal para antes da abertura quando a posição pode ser confirmada e retira a indentação acidental antes da caixa.\n* Destaca o nome inicial exato do assunto e retira sua ligação para o próprio artigo.\n* Organiza datas e locais já escritos na identificação inicial. Pode completá-los com campos explícitos e referenciados de uma única infocaixa pessoal.\n* Corrige caracteres invisíveis em nomes de campos e um sinal de igual de largura completa quando o campo nativo é confirmado.\n* Corrige a unidade repetida de tamanho da imagem nos campos cujo funcionamento foi conferido.\n* Separa arquivo de imagem, texto alternativo, tamanho e legenda nos campos nativos confirmados, preservando o conteúdo.\n* Conta cada operação mantida e inclui a identificação inicial no resumo quando ela muda. A inserção de dados na abertura não recebe marcação automática de edição menor.\n* Mantém os campos de sepultamento como estavam. Dados conflitantes, referências incertas e estruturas ambíguas ficam intactos.'
SCOPE = "=== Infocaixas e identificação inicial ===\n\nEm artigos completos, uma infocaixa pessoal nativa e isolada pode passar de depois da abertura para antes dela. A abertura precisa identificar o assunto do título da página. A regra exige uma única caixa principal antes da primeira seção e um ponto de inserção confirmado. Avisos iniciais reconhecidos permanecem no lugar. Comentários com posição incerta, caixas múltiplas, tabelas, contêineres de layout, exemplos e construções dinâmicas impedem a movimentação. Uma indentação acidental feita com espaços antes da caixa também pode ser retirada.\n\nDurante a movimentação, o código da caixa e da abertura permanece igual, com suas referências e ligações, e as notas podem mudar de número porque a caixa passa a ser lida primeiro. O programa não reescreve as fontes para manter a numeração anterior. Para desativar essa regra na configuração, use <code>automaticInfoboxOrder: false</code>.\n\nO nome que abre o artigo pode receber negrito quando corresponde exatamente ao assunto do título. Uma ligação inicial para o próprio artigo pode perder apenas a marcação de ligação, conservando o texto exibido. Nomes diferentes, variantes que exigem interpretação e títulos dinâmicos ficam como estavam.\n\nDatas e locais de nascimento e falecimento podem completar a abertura quando estão em campos individuais, explícitos e referenciados de uma única infocaixa pessoal nativa. A identidade da caixa precisa corresponder à abertura. Um campo de nome vazio ou um nome diferente impede a cópia. A ausência desse campo só é aceita nas caixas em que o uso do título da página foi conferido. Cada campo de origem precisa ter seu uso confirmado na definição da caixa. Um nome aceito apenas pelo verificador de parâmetros não basta. Caixas com uso indireto de dados ou condições ainda não conferidas ficam fora dessa cópia automática. \n\nA regra exige datas completas do calendário gregoriano a partir de 1583 e conserva os dados de origem na caixa. Cada dado novo leva sua referência, com reutilização de chamadas nomeadas somente quando a definição é única e válida. Campos duplicados, referências indefinidas, dados futuros ou conflitantes e valores calculados impedem a cópia. Dados já presentes na abertura não são substituídos por outros da caixa.\n\nUma conversão de infocaixa, campo ou data que o programa já suporta pode anteceder essa conferência quando permite um reparo confirmado na mesma execução. Essa preparação também precisa conservar o dado e sua referência de origem. Se não puder comprovar essa correspondência, mantém o caminho anterior de conversão.\n\nA identificação inicial usa os dados aceitos na ordem local e data. Referências de um conjunto inteiro permanecem com esse conjunto. Uma posição de referência que impeça confirmar qual dado ela sustenta bloqueia a reorganização. A inserção de dados na abertura não é marcada automaticamente como edição menor. As demais alterações seguem a conferência de edição menor já usada pelo programa.\n\nCaracteres U+200B e U+FEFF dentro do nome de um campo podem sair quando sua retirada produz um único parâmetro nativo com uso e aliases conferidos, sem colisão com outro campo. O sinal <code>＝</code> pode passar a <code>=</code> nas mesmas condições. A unidade repetida <code>pxpx</code> só é corrigida no contrato de tamanho conferido da família Info/Biografia, sem mudar o número nem impor uma largura geral a outras caixas.\n\nUma imagem escrita como ligação completa pode ser dividida entre os campos de arquivo, texto alternativo, tamanho e legenda da família Info/Biografia quando cada destino foi confirmado. O texto alternativo, a legenda e suas referências permanecem iguais. Opções desconhecidas, texto alternativo vazio ou com espaços que mudariam sua expansão, campos conflitantes e outras famílias sem esse contrato ficam intactos.\n\nOs parâmetros <code>sepultamento</code>, <code>enterro</code>, <code>enterro_local</code> e <code>resting_place</code> permanecem como estavam nesta versão. Não há uma conversão nova desses parâmetros enquanto a discussão da comunidade continua.\n\nEssas regras novas não se aplicam a edições de seção, discussões, exemplos ou definições de predefinições. A alteração fica no rascunho e pode ser conferida em '''Mostrar alterações''' ou revertida com '''Desfazer'''. Para desativar os outros grupos novos, use <code>automaticBiographyLead: false</code>, <code>automaticFieldSyntax: false</code> ou <code>automaticInfoboxImages: false</code>.\n\n"

def clean(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


def main():
    raw = (ROOT / 'tests/expected_release_v2151.json').read_bytes()
    manifest = json.loads(raw)
    qa = json.loads((ROOT / 'artifacts/v2151/QA_SUMMARY.json').read_text())
    assert qa['status'] in ['passed', 'passed-with-preexisting-findings'] and qa['releaseManifestSha256'] == hashlib.sha256(raw).hexdigest()
    summary = qa['portugueseSummary']
    base = (ROOT / 'docs/2.15.0/Documentacao_RevisaWiki_v2_15_0.wiki').read_text()
    head, history = base.split('== Histórico das versões ==', 1)
    history, tail = history.split('== Testes e detalhes técnicos ==', 1)
    head = head.replace('2.15.0', '2.15.1').replace('_v2_15_0', '_v2_15_1')
    head = re.sub(r"A versão '''2\.15\.1'''[^\n]+", "A versão '''2.15.1''' organiza infocaixas e a identificação inicial, corrige erros literais de campos e preserva dados e referências.", head, count=1)
    scope = '\n'.join(line.rstrip(' \t') for line in SCOPE.split('\n'))
    head = head.replace('=== Predefinições, documentação e estilos ===', scope + '=== Predefinições, documentação e estilos ===', 1)
    pos = history.index('=== 2.15.0 ===')
    history = history[:pos] + '=== 2.15.1 ===\n\n' + FEATURES + '\n\n' + history[pos:]
    start = tail.index('Os arquivos finais da versão 2.15.0 passaram')
    end = tail.index('\n\n', start)
    tail = tail[:start] + summary + tail[end:]
    tail = tail.replace('tests/evidence/2.15.0', 'tests/evidence/2.15.1')
    manual = clean(head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
    assert manual.split('=== 2.15.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0] == base.split('=== 2.15.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    out = ROOT / 'docs/2.15.1'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'Documentacao_RevisaWiki_v2_15_1.wiki').write_text(manual)
    installation = (ROOT / 'docs/2.15.0/Instalacao_RevisaWiki_v2_15_0.txt').read_text().replace('2.15.0', '2.15.1').replace('_v2_15_0', '_v2_15_1')
    installation = installation.replace('mesmo que a 2.14.0 já esteja instalada', 'mesmo que a 2.15.0 já esteja instalada')
    start = installation.index('Os arquivos finais da versão 2.15.1 passaram')
    end = installation.index('\n\n', start)
    installation = installation[:start] + summary + installation[end:]
    (out / 'Instalacao_RevisaWiki_v2_15_1.txt').write_text(clean(installation))
    (out / 'Resumo_atualizacao_RevisaWiki_v2_15_1.txt').write_text('RevisaWiki 2.15.1: ajustes de infocaixas, identificação inicial e sintaxe de campos.\n')
    (out / 'Resumo_documentacao_RevisaWiki_v2_15_1.txt').write_text('Documentação do RevisaWiki 2.15.1: ajustes, limites e instalação.\n')
    (out / 'Notas_da_versao_RevisaWiki_v2_15_1.txt').write_text(clean('RevisaWiki 2.15.1\n16 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
    (out / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.15.1\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
    technical = ('RevisaWiki 2.15.1: referência técnica\n16 de outubro de 2026\n\n'
                 'A reconstrução parte da distribuição 2.15.0 fixada por SHA-256 e aplica os módulos de src/v2_15_1. Os arquivos históricos permanecem intactos. O plano de cada reparo é calculado a partir do código de entrada.\n\n' +
                 re.sub(r'</?code>', '', scope.replace('=== Infocaixas e identificação inicial ===\n\n', '')).replace("'''", '') + summary + '\n')
    (out / 'Referencia_tecnica_RevisaWiki_v2_15_1.txt').write_text(clean(technical))
    lines = ['RevisaWiki 2.15.1: resultados dos testes', '16 de outubro de 2026', '', summary, '']
    for row in qa['groups']:
        suffix = ', sem falhas.' if row['status'] == 'passed' else ', com ' + str(row.get('preexistingFindings', 0)) + ' ocorrências idênticas às da versão anterior e nenhuma regressão nova.'
        cases = f"{row['cases']:,}".replace(',', '.')
        checks = f"{row['checks']:,}".replace(',', '.')
        lines.append('- ' + row['label'] + ': ' + cases + (' caso' if row['cases'] == 1 else ' casos') + ' e ' + checks + (' verificação' if row['checks'] == 1 else ' verificações') + suffix)
    lines += ['', 'Casos sintéticos e execuções nas duas distribuições não são artigos distintos. Os resultados e hashes ficam em tests/evidence/2.15.1.', '', 'Arquivos executados', '']
    for name, proof in manifest['files'].items():
        lines += [name + ': ' + str(proof['bytes']) + ' bytes', 'SHA-256: ' + proof['sha256']]
    lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
    (out / 'Relatorio_testes_RevisaWiki_v2_15_1.txt').write_text(clean('\n'.join(lines)))
    print(json.dumps({'version': '2.15.1', 'documentationFiles': len(list(out.iterdir()))}))


if __name__ == '__main__':
    main()
