"""Write the template-release manual using completed, pinned QA results."""
from pathlib import Path
import hashlib
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
FEATURES = '''* Reconhece construções válidas de chaves e nomes dinâmicos antes de procurar erros de sintaxe.
* Confirma o nome da predefinição antes de aplicar regras de parâmetros. Nomes e aliases nativos aceitos permanecem iguais.
* Separa definições, documentação e testes dos ajustes destinados a artigos.
* Corrige erros mecânicos conferidos em funções, campos e chamadas de documentação, sem escolher entre valores conflitantes.
* Confere o encaminhamento de parâmetros entre predefinições nos casos registrados, mantendo as entradas públicas e sua precedência.
* Valida TemplateData separadamente e repara os erros de JSON e de ordenação reconhecidos.
* Confere TemplateStyles pelo conteúdo que o sanitizador conserva, incluindo valores, seletores e regras de tela.
* Acrescenta testes de predefinições, transclusão, falsos positivos e apresentação em telas de tamanhos diferentes.'''

SCOPE = '''=== Predefinições, documentação e estilos ===

A versão 2.15 distingue o código de uma predefinição das páginas de documentação, dos testes e dos exemplos. Os ajustes destinados a artigos não passam a valer nesses locais apenas porque o texto contém uma infocaixa, uma categoria ou uma chamada de portal. Exemplos em blocos literais continuam protegidos.

Ao reconhecer parâmetros e nomes dinâmicos, a leitura conserva sequências válidas de cinco chaves, sem usá-las como prova de um fechamento ausente. Um reparo de delimitadores exige uma interpretação confirmada. O programa conserva fragmentos e construções ambíguas.

As regras de parâmetros usam os nomes e redirecionamentos conferidos para cada predefinição. A mesma grafia pode funcionar em uma família e ser inválida em outra. Nomes nativos e aliases válidos ficam iguais. Modelos importados ainda podem receber as conversões específicas já conferidas. A ausência de um campo no TemplateData, por si só, não autoriza sua remoção, pois o código ou um módulo pode aceitá-lo. Se um parâmetro nomeado aparece repetido com exatamente o mesmo nome e valor, o reparo conserva a última ocorrência. Aliases diferentes e valores conflitantes não são reunidos.

Espaços entre o nome de uma função reconhecida e os dois-pontos podem ser retirados quando impedem sua execução. Os espaços dos argumentos permanecem iguais. O programa não transforma parâmetros ausentes em vazios, não acrescenta valores padrão e não simplifica condições. Zero, espaço em branco e valor ausente não são tratados como equivalentes.

Uma chamada literal de <code><nowiki>{{Documentação}}</nowiki></code>, sem argumentos, isolada no fim e fora de outras chamadas, pode receber <code>&lt;noinclude&gt;</code>. Blocos adjacentes e idênticos de documentação podem ficar em uma ocorrência, preservando os espaços externos. Um único <code>&lt;/noinclude&gt;</code> extra no fim só sai quando o bloco anterior já está completo. Etiquetas trocadas não são reconstruídas por tentativa. As categorias da própria predefinição, da documentação e dos artigos têm funções diferentes, por isso não há uma mudança global de etiquetas.

O encaminhamento de campos entre predefinições exige uma regra específica. A entrada que outras páginas já usam permanece disponível. A mudança conserva o valor enviado, os valores padrão e a prioridade de uma entrada explícita. Campos desconhecidos não são apagados para esconder avisos.

Os reparos de TemplateData passam por um leitor de JSON que rejeita chaves repetidas e exige uma estrutura aceita antes de alterar os metadados. Ele retira vírgulas finais indevidas. Em um <code>paramOrder</code> já existente, retira nomes repetidos e acrescenta ao fim os parâmetros declarados que faltam, na ordem textual original, inclusive nomes numéricos. Chaves repetidas, campos desconhecidos e formatos não reconhecidos ficam intactos. O programa não inventa descrições, tipos, aliases nem campos obrigatórios. Os metadados do editor não substituem a implementação da predefinição.

Em TemplateStyles, o navegador aceitar uma declaração não prova que a Wikipédia a conservará. A conferência usa o CSS sanitizado e considera a propriedade, o valor, o seletor e o contexto da regra. Uma variável de cor só permite a conversão conferida quando corresponde a uma única cor. Erros que dependem da intenção do desenho ficam preservados.

As verificações de apresentação incluem telas estreitas, temas claro e escuro e caixas recolhidas ou abertas. Não existe um limite de largura único aplicado a toda navbox ou infocaixa. O programa não insere quebras de linha nos rótulos nem retira nowrap de forma geral. Subgrupos podem estar balanceados e ainda ter uma organização editorial errada, que precisa de revisão humana.

A formatação de chamadas simples vem ativada nas definições elegíveis do espaço de predefinições. Ela separa os parâmetros nomeados de chamadas literais em uma linha das famílias Navbox, Sidebar e Info conferidas, conservando seus valores. Argumentos posicionais, listas, tabelas, comentários e condições impedem esse ajuste. Para desativá-lo na configuração, use <code>templateReadableFormatting: false</code>.

'''

def clean(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)

def current(text):
    return text.replace('2.14.0', '2.15.0').replace('_v2_14_0', '_v2_15_0')

def plain_scope():
    text = SCOPE.replace('=== Predefinições, documentação e estilos ===\n\n', '')
    return html.unescape(re.sub(r'</?(?:code|nowiki)>', '', text))

def main():
    manifest_raw = (ROOT / 'tests/expected_release_v2150.json').read_bytes()
    manifest = json.loads(manifest_raw)
    qa = json.loads((ROOT / 'artifacts/v2150/RELEASE_QA_SUMMARY.json').read_text())
    assert qa['status'] == 'passed' and qa['version'] == '2.15.0'
    assert qa['releaseManifestSha256'] == hashlib.sha256(manifest_raw).hexdigest()
    assert qa['frozenFiles'] == manifest['files']
    summary = qa['portugueseSummary']
    base = (ROOT / 'docs/2.14.0/Documentacao_RevisaWiki_v2_14_0.wiki').read_text()
    head, history = base.split('== Histórico das versões ==', 1)
    history, tail = history.split('== Testes e detalhes técnicos ==', 1)
    head, tail = current(head), current(tail)
    head, count = re.subn(r"A versão '''2\.15\.0'''[^\n]+", "A versão '''2.15.0''' amplia a revisão de predefinições, com leitura de chaves, proteção de documentação, reparos conferidos de parâmetros e validação própria de TemplateData e TemplateStyles.", head, count=1)
    assert count == 1
    head = head.replace('=== Campos importados de medicamentos e substâncias químicas ===', SCOPE + '=== Campos importados de medicamentos e substâncias químicas ===', 1)
    head = head.replace('Pode ajustar a prosa de /doc e /documentação, preservando exemplos e código protegido.', 'Preserva a prosa e os exemplos de /doc e /documentação. O bloco literal de TemplateData pode receber os reparos específicos de metadados.')
    head = head.replace('Os reparos estruturais exigem o artigo inteiro e ficam desligados em discussões, predefinições e edição de seção.', 'Os reparos de referências, tabelas e delimitadores de artigos descritos nesta seção exigem o artigo inteiro e ficam desligados em discussões, predefinições e edição de seção.')
    css_start = head.index('== TemplateStyles ==')
    css_end = head.index('\n== ', css_start + 3)
    css_text = """== TemplateStyles ==

Em páginas do espaço de predefinições com conteúdo '''CSS sanitizado''', há um painel menor com '''Conferir CSS''' e '''Desfazer'''. O modelo de conteúdo da página determina esse modo, não apenas a extensão .css no título. Os controles de artigos não aparecem ali.

'''Conferir CSS''' pode aplicar dois reparos limitados após a confirmação do sanitizador. Uma cor de borda com a variável conferida pode passar a quatro propriedades, uma para cada lado, conservando valor, prioridade e posição. O erro literal <code>24 px</code> pode passar a <code>24px</code> nos campos de dimensão conferidos. Outros valores ou defeitos concorrentes impedem esse reparo de unidade. A regra não ativa larguras enormes a partir de declarações antes ignoradas.

A conferência envia a folha original e a proposta por consultas de leitura ao TemplateSandbox, sem salvar. Compara os seletores, as condições, os valores e a ordem das declarações devolvidas. Só aplica a proposta quando a perda original corresponde exatamente aos reparos previstos e a folha corrigida conserva o restante. Uma folha grande demais para essa consulta ou uma resposta incompleta permanece no editor sem alteração. Esse ensaio não confirma a aparência em toda página que usa a predefinição.

'''Desfazer''' recupera o CSS anterior e o resumo gerado pela execução, desde que você não tenha feito outra alteração nesse texto. A conferência não publica a página.<ref>[https://www.mediawiki.org/wiki/Help:TemplateStyles/pt Documentação de TemplateStyles]. [https://www.mediawiki.org/wiki/Extension:TemplateSandbox Documentação de TemplateSandbox].</ref>
"""
    head = head[:css_start] + css_text + head[css_end:]
    intro, old_entries = history.split('=== 2.14.0 ===', 1)
    history = intro + '=== 2.15.0 ===\n\n' + FEATURES + '\n\n=== 2.14.0 ===' + old_entries
    start = tail.index('Os arquivos finais da 2.15.0 passaram')
    end = tail.index('\n\n', start)
    tail = tail[:start] + summary + tail[end:]
    manual = clean(head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
    assert manual.split('=== 2.14.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0] == base.split('=== 2.14.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    out = ROOT / 'docs/2.15.0'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'Documentacao_RevisaWiki_v2_15_0.wiki').write_text(manual)
    installation = current((ROOT / 'docs/2.14.0/Instalacao_RevisaWiki_v2_14_0.txt').read_text())
    installation = installation.replace('mesmo que a 2.13.0 já esteja instalada', 'mesmo que a 2.14.0 já esteja instalada')
    start = installation.index('Os arquivos finais da 2.15.0 passaram')
    end = installation.index('\n\n', start)
    (out / 'Instalacao_RevisaWiki_v2_15_0.txt').write_text(clean(installation[:start] + summary + installation[end:]))
    (out / 'Resumo_atualizacao_RevisaWiki_v2_15_0.txt').write_text('RevisaWiki 2.15.0: revisão de predefinições, parâmetros, documentação, TemplateData e TemplateStyles.\n')
    (out / 'Resumo_documentacao_RevisaWiki_v2_15_0.txt').write_text('Documentação do RevisaWiki 2.15.0: predefinições, reparos, limites e instalação.\n')
    (out / 'Notas_da_versao_RevisaWiki_v2_15_0.txt').write_text(clean('RevisaWiki 2.15.0\n16 de outubro de 2026\n\n' + FEATURES.replace('* ', '- ') + '\n\n' + summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
    (out / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.15.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
    technical = 'RevisaWiki 2.15.0: referência técnica\n16 de outubro de 2026\n\nA reconstrução parte dos sete executáveis fixados da distribuição 2.14.0 e aplica os módulos de src/v2_15. Os arquivos históricos permanecem intactos. Os testes históricos ficam arquivados sem alteração. As adaptações de versão, as correções finitas de nomes gerados nas entradas e as mudanças de expectativa para nomes não confirmados ficam registradas separadamente. Os nomes válidos e as grafias recusadas têm verificações próprias.\n\n' + plain_scope() + summary + '\n'
    (out / 'Referencia_tecnica_RevisaWiki_v2_15_0.txt').write_text(clean(technical))
    lines = ['RevisaWiki 2.15.0: resultados dos testes', '16 de outubro de 2026', '', summary, '']
    for group in qa['groups']:
        lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
    lines += ['', 'Casos sintéticos e permutações não são artigos distintos. Os resultados e os hashes ficam em tests/evidence/2.15.0.', '', 'Arquivos executados', '']
    for name, pin in manifest['files'].items():
        lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
    lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
    (out / 'Relatorio_testes_RevisaWiki_v2_15_0.txt').write_text(clean('\n'.join(lines)))
    print(json.dumps({'version': '2.15.0', 'documentationFiles': len(list(out.iterdir()))}))

if __name__ == '__main__':
    main()
