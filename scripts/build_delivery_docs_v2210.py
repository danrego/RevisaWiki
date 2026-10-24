"""Write reviewed release documentation only after the byte-bound QA gates pass."""
import argparse
import json
import re
from pathlib import Path
from v221_delivery import (ROOT, DIST, DOCS, STEM, VERSION, checked_manifest, checked_qa,
                           captured, record_path, records_of, commit_payloads)

FEATURES = [
    'Amplia os nomes de campos reconhecidos em infocaixas, com equivalência conferida para cada predefinição.',
    'Distribui em linhas os campos de infocaixas compactas de assentamentos de Marrocos, preservando a ordem e os valores.',
    'Combina correções de referências, aspas e parâmetros na mesma ação, quando as verificações permitem aplicá-las juntas.',
    'Corrige grafias específicas de parâmetros bibliográficos, identificadores e estados de acesso, preservando os valores e as fontes.',
    'Corrige ligações, opções de imagem, atributos de tabela e espaços nos casos já conferidos.',
    'Confirma dados externos antes dos ajustes que dependem de um item, arquivo ou registro bibliográfico.',
    'Conserva o texto quando os limites da marcação são incertos, há campos conflitantes ou falta confirmação.',
    'Mantém a chamada fixa do common.js, a opção de desfazer e o limite de 60 segundos.',
]

def build(preview=None, validation=None):
    manifest = checked_manifest()
    destination = DOCS
    records = records_of(manifest)
    if preview is not None:
        preview = Path(preview)
        if preview == DOCS.resolve() or validation is None:
            raise ValueError('A documentation preview needs separate output and explicit validation text')
        if preview.resolve() == DOCS.resolve():
            raise ValueError('A documentation preview must not replace final documentation')
        destination = preview
        validation_record = record_path(validation)
        records.append(validation_record)
        qa = json.loads(validation_record['raw'])
    else:
        if validation is not None: raise ValueError('Validation override is for a separate preview only')
        qa = checked_qa(manifest)
        records += records_of(qa)
    payloads = {}
    def write(name, text):
        payloads[name] = (text.rstrip() + '\n').encode('utf-8')
    paragraphs = qa.get('docValidationParagraphs')
    if not isinstance(paragraphs, list) or not paragraphs or any(not isinstance(p, str) or not p.strip() for p in paragraphs):
        raise ValueError('Reviewed validation paragraphs are required')
    validation = '\n\n'.join(paragraphs)
    feature_list = '\n'.join('* ' + text for text in FEATURES)
    previous_record = captured(ROOT, 'docs/2.20.0/Documentacao_RevisaWiki_v2_20_0.wiki')
    records.append(previous_record)
    previous = previous_record['raw'].decode('utf-8')
    history = previous.split('== Histórico das versões ==\n', 1)[1].split('== Como as regras são verificadas ==', 1)[0].rstrip()
    # Historical release entries are retained as history, not relabelled as new tests.
    history_match = re.search(r'^=== [0-9]+\.[0-9]+\.[0-9]+ ===$', history, re.MULTILINE)
    if history_match is None:
        raise ValueError('Historical release headings are required')
    history_intro = history[:history_match.start()].strip()
    history_entries = history[history_match.start():]
    history = ((history_intro + '\n\n') if history_intro else '') + '=== 2.21.0 ===\n\n' + feature_list + '\n\n' + history_entries
    manual = """{{Info/Software
| nome = RevisaWiki
| última_versão = 2.21.0
| plataforma = Wikipédia em português
| linguagem = JavaScript
| idioma = Português
| gênero = Ferramenta de revisão de código wiki
| licença = [[Creative Commons|CC BY-SA 4.0]]
| repositório = [https://github.com/danrego/RevisaWiki GitHub]
| website = [[Usuário:Daniel G Rego/RevisaWiki/Carregador.js|Carregador de instalação]]
}}
O '''RevisaWiki''' reúne correções de referências, infocaixas, tabelas e sintaxe no botão '''Ajustar código''', disponível no editor de código-fonte da Wikipédia em português. As mudanças ficam no rascunho, com opção de desfazer e de conferir o resultado em '''Mostrar alterações'''. Você decide quando publicar.

O programa reconhece nomes de predefinições e parâmetros copiados de outras Wikipédias, trata grafias inequívocas e organiza elementos das seções finais. As correções de campos seguem mapas montados a partir de revisões conferidas das predefinições. Informações conflitantes, exemplos de código e trechos sem correspondência confirmada permanecem intactos.

== Novidades da 2.21 ==

FEATURE_LIST

=== Infocaixas e biografias ===

Os mapas de campos abrangem predefinições pessoais, profissionais e temáticas. Cada mapa está ligado à revisão conferida da predefinição e aos parâmetros que ela realmente recebe. A troca conserva o valor completo, incluindo referências. Um campo válido não muda apenas por preferência de grafia.

Nas infocaixas de assentamentos de Marrocos que estão inteiramente em uma linha, o programa pode colocar cada campo em sua própria linha e alinhar os sinais de igual. Os nomes, a ordem e os valores dos campos são preservados. Chamadas com argumentos posicionais sem comportamento confirmado, campos repetidos ou conteúdo protegido ficam como estavam.

Se houver campos concorrentes, valores calculados ou uma caixa dentro de outra, o programa mantém os campos que não puder converter com segurança. Uma largura ou legenda só é ajustada se a predefinição realmente usar o campo da imagem. Nas regras que dependem de dados externos, a confirmação precisa corresponder ao artigo, ao item e ao rascunho em análise. Uma consulta sem resposta conserva o texto.

A retirada de dados redundantes exige uma correspondência inequívoca. Datas, nomes, condições de exibição e opções desligadas continuam protegidos. Os mapas novos não tornam válidos todos os campos de toda infocaixa nem transferem dados de uma pessoa para outra.

=== Referências e citações ===

Os reparos cobrem as grafias previstas de acesso, edição, autoria, páginas, arquivo e identificadores nas predefinições de citação conferidas. O estado de acesso à fonte é conservado ao corrigir a chave ou o valor aceito pela ptwiki. O parâmetro não é apagado apenas para retirar um aviso.

O programa mantém a chamada original quando a conversão faria uma predefinição da Wikipédia falhar ou perder dados. Uma ligação simples só é transformada em citação quando o nome da página, o título da fonte e o endereço permitem conservar os dados bibliográficos. Valores que já existiam não são reescritos para contornar uma falha do módulo da Wikipédia.

A leitura associa cada nome e grupo ao corpo da referência. Uma correção de aspas precisa conservar essa associação, e um atributo malformado só recebe reparo quando o resultado tem limites estruturais completos. Notas distintas não são reunidas por semelhança.

As correções de nomes de predefinições e parâmetros podem ser compostas na mesma ação. Uma lista padrão ausente só entra quando a posição, o grupo e todas as referências envolvidas permitem confirmar a inserção. Listas de referências com configurações próprias, referências dentro de predefinições que o programa não consegue interpretar com segurança e código incompleto são conservados.

Uma confirmação bibliográfica externa não substitui a fonte. Os reparos que a usam exigem o identificador e o título completos correspondentes ao rascunho. O programa não decide se uma publicação sustenta a afirmação do artigo.

=== Ligações, imagens, tabelas e espaços ===

Os reparos delimitados incluem protocolos digitados incorretamente, separadores de ligações, opções de imagens e certos atributos de cabeçalhos de tabela. Legendas, tamanhos, destinos e texto das células são conservados. O programa analisa separadamente galerias, ligações dentro de outras ligações e atributos HTML para não aplicar a mesma troca em situações diferentes.

Linhas vazias excedentes e títulos alternativos de seções finais só recebem as normalizações previstas. As regras preservam fórmulas, unidades, código literal e âncoras usadas no artigo. A proteção de ênfase pode conservar uma ligação que outra ferramenta apenas reformataria, evitando alterar os limites de negrito ou itálico.

== Usar e conferir ==

# Abra '''Editar código-fonte''' e clique em '''Ajustar código'''.
# Confira '''Mostrar alterações''' e a pré-visualização normal do editor.
# Publique quando terminar sua revisão. O RevisaWiki não publica por você.

No editor clássico e nas integrações reconhecidas de CodeMirror, o botão também aparece perto dos controles de publicação. Os botões superior e inferior executam a mesma ação. No modo de código-fonte do editor de 2017, use o painel superior. Depois da análise, o botão fica desativado enquanto o texto não mudar.

'''Desfazer ajustes''' restaura o rascunho anterior enquanto o resultado pertence à execução atual. Uma resposta atrasada ou uma análise antiga não pode sobrescrever mudanças manuais feitas depois. Texto, resumo e marca de edição menor são conferidos com o contexto do editor.

Em artigos completos, mudanças feitas exclusivamente pelo programa podem marcar '''Edição menor''', sem depender da quantidade de bytes. Uma escolha manual, um rascunho já alterado ou a edição de uma seção mantêm a decisão com você. Essa marcação pode ser desativada nas configurações.

=== Outras funções ===

Na discussão de um artigo, com a página inteira aberta no editor, '''Criar código''' consulta o artigo e prepara o cabeçalho com <code><nowiki>{{PD}}</nowiki></code> e as marcas de projeto reconhecidas. O resultado vai para o rascunho e pode ser desfeito, sem publicar a página.

Em '''Mais ferramentas''', '''Conferir outras grafias''' apresenta sugestões de ortografia com contexto. O texto só muda quando você aceita uma substituição.

Em '''Configurações''', abra '''Opções de ajuste''' para escolher '''Todos os ajustes''', '''Só referências''' ou '''Só infocaixas'''. As opções individuais permitem desligar grupos de correções e os ajustes de portais, sem editar o código do programa.

== Instalação e atualização ==

O [https://github.com/danrego/RevisaWiki/blob/main/dist/2.21.0/INDICE.md índice de instalação] reúne os arquivos completos, os destinos e os resumos da edição. A instalação continua manual. Dados e programa são separados para respeitar o limite de tamanho de cada página.

Quem mantém a distribuição compartilhada deve atualizar, nesta ordem:

# <code>RevisaWiki_v2_21_0_dados.js</code> em [[Usuário:Daniel G Rego/RevisaWiki/Dados.js]].
# <code>RevisaWiki_v2_21_0.js</code> em [[Usuário:Daniel G Rego/RevisaWiki.js]].
# <code>Carregador_comunitario_RevisaWiki_v2_21_0.js</code> em [[Usuário:Daniel G Rego/RevisaWiki/Carregador.js]].
# Este manual em [[Usuário:Daniel G Rego/RevisaWiki]].

As três partes de código precisam ser da mesma versão. Substitua o conteúdo completo pelos arquivos correspondentes. O arquivo <code>RevisaWiki_v2_21_0_completo.js</code> serve para uso local e testes, pois excede o limite de uma página da Wikipédia.

Se o realce de sintaxe mostrar um aviso sobre o limite de 102400 bytes, ele se refere à exibição do código com cores. Confira o arquivo bruto. Erros de sintaxe ou uma recusa ao salvar precisam de verificação separada.

Se você já usa a chamada fixa no common.js, mantenha-a. Quem instala pela primeira vez pode acrescentar somente este bloco, preservando seus outros scripts:

<syntaxhighlight lang="javascript">
FIXED_CALL
</syntaxhighlight>

Mantenha uma única chamada do RevisaWiki. Depois da atualização, recarregue sem cache e confira '''2.21.0''' em '''Sobre e diagnóstico'''. No Firefox e Chrome para Mac, use '''Command + Shift + R'''. No Safari, use '''Option + Command + R'''. A chave de cache da chamada fixa muda ao abrir ou recarregar uma página, em intervalos de cinco minutos. Ela não gera edições nem consulta atualizações continuamente.

Para manter uma cópia própria, use os arquivos de dados e programa na sua conta e o <code>Carregador_common_js_RevisaWiki_v2_21_0.js</code> no seu carregador central. Na primeira instalação, acrescente <code>Chamada_fixa_RevisaWiki_copia_propria.js</code> ao common.js. Não carregue a cópia própria e a distribuição compartilhada ao mesmo tempo.

== Demonstração e limites ==

A demonstração acompanha o pacote no [https://github.com/danrego/RevisaWiki GitHub]. Ela usa o mesmo motor distribuído em exemplos fictícios, funciona localmente e permite comparar o código antes e depois. Os exemplos também mostram situações que precisam ficar intactas. Não há acesso à sua conta nem publicação.

Alguns ajustes dependem de consultas públicas a destinos, arquivos, registros bibliográficos ou dados de itens. Os exemplos condicionais usam dados fictícios para mostrar essas regras, sem consultar o Commons ou confirmar fatos sobre artigos reais. No uso normal do programa, a pré-visualização pode enviar o rascunho à Wikipédia para processamento, sem salvar uma edição.

O cálculo dos ajustes, a conferência final e a preparação da resposta têm um limite de '''60 segundos'''. Consultas públicas e pré-visualização têm seus próprios prazos de espera. Textos excepcionalmente grandes ou complexos podem atingir o limite do cálculo. Nesse caso, o programa mantém integralmente o rascunho e os controles anteriores, permitindo continuar a edição. O limite e as verificações de preservação não foram ampliados nem retirados para obter aprovação nos testes.

O programa não traduz prosa, confirma notoriedade, verifica o conteúdo de todas as fontes ou resolve conflitos editoriais. Confira sempre o resultado antes de publicar.

== Validação da versão ==

VALIDATION

O [https://github.com/danrego/RevisaWiki/blob/main/docs/2.21.0/Relatorio_testes_RevisaWiki_v2_21_0.txt relatório de testes] separa artigos, revisões, cenários sintéticos, chamadas reais e verificações. Os estudos sem prova suficiente permanecem identificados como estudos. Resultados históricos não foram renomeados como testes aprovados desta versão.

== Código e licença ==

O código e o histórico de versões estão no [https://github.com/danrego/RevisaWiki GitHub]. A reconstrução parte dos arquivos imutáveis da 2.20, confere seus hashes e aplica os módulos da 2.21. A separação entre dados e programa conserva os valores literais, e as duas distribuições são testadas.

O código próprio usa [https://creativecommons.org/licenses/by-sa/4.0/ CC BY-SA 4.0]. Os materiais de terceiros conservam suas licenças e as revisões de origem indicadas no repositório. Os registros públicos omitem caminhos locais, dados de contas e capturas de tela do computador.

== Histórico das versões ==

HISTORY
"""
    fixed_record = captured(DIST, 'Chamada_fixa_RevisaWiki_common.js', manifest['files']['Chamada_fixa_RevisaWiki_common.js'])
    records.append(fixed_record)
    fixed = fixed_record['raw'].decode('utf-8').rstrip()
    manual = manual.replace('FEATURE_LIST', feature_list).replace('FIXED_CALL', fixed).replace('VALIDATION', validation).replace('HISTORY', history)
    write(f'Documentacao_RevisaWiki_{STEM}.wiki', manual)
    installation = f'''RevisaWiki {VERSION}: instalação

Código e versões: https://github.com/danrego/RevisaWiki
Índice com arquivos, destinos e resumos: dist/{VERSION}/INDICE.md

Atualize a distribuição compartilhada nesta ordem:
1. RevisaWiki_{STEM}_dados.js → Usuário:Daniel G Rego/RevisaWiki/Dados.js
2. RevisaWiki_{STEM}.js → Usuário:Daniel G Rego/RevisaWiki.js
3. Carregador_comunitario_RevisaWiki_{STEM}.js → Usuário:Daniel G Rego/RevisaWiki/Carregador.js
4. Documentacao_RevisaWiki_{STEM}.wiki → Usuário:Daniel G Rego/RevisaWiki

Substitua o conteúdo completo. Dados, programa e carregador precisam corresponder à mesma versão. As partes instaláveis foram conferidas individualmente contra o limite de 2.097.152 bytes. O arquivo completo ultrapassa esse limite e serve somente para uso local e testes.

O aviso de 102400 bytes do realce de sintaxe se refere à exibição com cores. Confira o arquivo bruto. Erros de sintaxe ou uma recusa ao salvar precisam de verificação separada.

Quem já usa a chamada fixa no common.js mantém esse bloco. Na primeira instalação, acrescente Chamada_fixa_RevisaWiki_common.js ao common.js, preservando os demais scripts. Mantenha apenas uma chamada.

Para uma cópia própria, use os mesmos dados e programa na sua conta, Carregador_common_js_RevisaWiki_{STEM}.js no seu RevisaWiki/Carregador.js e Chamada_fixa_RevisaWiki_copia_propria.js no common.js. Escolha uma instalação.

Depois da atualização, recarregue sem cache e confira {VERSION} em Sobre e diagnóstico. Firefox e Chrome no Mac: Command + Shift + R. Safari: Option + Command + R.

Os links e arquivos não publicam na Wikipédia. Confira a comparação e a pré-visualização antes de salvar. Se a análise atingir 60 segundos, o rascunho permanece no editor.
'''
    write(f'Instalacao_RevisaWiki_{STEM}.txt', installation)
    notes = f'RevisaWiki {VERSION}\n\n' + '\n'.join('- ' + text for text in FEATURES) + '\n\n' + validation
    write(f'Notas_da_versao_RevisaWiki_{STEM}.txt', notes)
    write(f'Relatorio_testes_RevisaWiki_{STEM}.txt', f'RevisaWiki {VERSION}: testes e limites\n\n' + validation + '\n\nRegistros agregados e hashes: tests/evidence/2.21.0/QA_SUMMARY.json. As fontes completas e os perfis dos navegadores ficam locais. Nenhuma edição foi publicada na Wikipédia.')
    write(f'Referencia_tecnica_RevisaWiki_{STEM}.txt', f'RevisaWiki {VERSION}\n\nReconstrução: python3 scripts/build_v2210.py\nManifesto: tests/expected_release_v2210.json\nCobertura: tests/evidence/2.21.0/COVERAGE.json\nTestes: tests/v221/README.md\n\nO núcleo e o catálogo usam JSON vinculado por hash. A distribuição completa conserva os mesmos valores para testes locais. A compactação de espaços do JavaScript conserva árvore sintática, tokens e comentários. A transferência de valores para o catálogo é conferida separadamente. Esses controles não substituem a renderização do wikitexto no MediaWiki. O prazo por artigo, incluindo a conferência final e a serialização, permanece em 60.000 ms. Falhas e recusas não autorizam aplicar a proposta.\n')
    write(f'Resumo_atualizacao_RevisaWiki_{STEM}.txt', 'Atualização do RevisaWiki para a versão 2.21.0, com reparos de infocaixas, referências e sintaxe e verificações de preservação.')
    write(f'Resumo_documentacao_RevisaWiki_{STEM}.txt', 'Atualização da documentação do RevisaWiki 2.21.0, com instalação, funcionalidades, testes e limitações.')
    write('LEIA_PRIMEIRO.txt', f'RevisaWiki {VERSION}\n\nComece por dist/{VERSION}/INDICE.md. Ele reúne arquivos completos, destinos e resumos. A chamada fixa do common.js continua igual. A instalação e a publicação na Wikipédia permanecem manuais.\n')
    coverage_record = captured(ROOT, 'tests/evidence/2.21.0/COVERAGE.json')
    records.append(coverage_record)
    coverage = json.loads(coverage_record['raw'])
    write('Funcionalidades_RevisaWiki_2_21.md', '# RevisaWiki 2.21: funcionalidades e limites\n\n' + '\n'.join('- ' + text for text in FEATURES) + '\n\nAs 144 fichas aprovadas têm uma disposição individual no registro de cobertura. Uma ficha pode ser uma automação, um contrato, um defeito de composição ou um estudo preservado. Esses totais não são contagens de correções em artigos.\n\n' + '\n'.join(f"- `{row['id']}`: {row['disposition']}. {row['summary']}" for row in coverage['items']))
    commit_payloads(destination, payloads, records)
    print(json.dumps({'version': VERSION, 'documents': len(payloads), 'runtimeManifestMatched': True, 'releaseQaPassed': preview is None}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preview', type=Path); parser.add_argument('--validation', type=Path)
    args = parser.parse_args(); build(args.preview, args.validation)
