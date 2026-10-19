"""Write the beta manual from completed, current-runtime test receipts."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.19.0-beta.1'
SLUG = 'v2_19_0_beta_1'
DIST = ROOT / 'dist' / VERSION
DOCS = ROOT / 'docs' / VERSION
EVIDENCE = ROOT / 'tests/evidence' / VERSION


def count(value):
    return len(value) if isinstance(value, list) else value or 0


def main():
    manifest = json.loads((ROOT / 'tests/expected_release_beta219.json').read_text())
    for name, pin in manifest['files'].items():
        raw = (DIST / name).read_bytes()
        assert len(raw) == pin['bytes'] and hashlib.sha256(raw).hexdigest() == pin['sha256']
    focused = json.loads((EVIDENCE / 'focused.json').read_text())
    inherited = json.loads((EVIDENCE / 'inherited.json').read_text())
    assert focused['status'] == inherited['status'] == 'passed'
    groups = [{'name': 'Cabeçalhos, identidade das funções e comparação com a base',
               'cases': focused['cases'], 'checks': focused['checks']}]
    for row in inherited['runs']:
        result = row['result']
        assert row['exitCode'] == 0 and result['status'] == 'passed'
        groups.append({'name': row['suite'], 'cases': count(result['cases']), 'checks': result['checks']})
    browsers = []
    for browser in ('chrome', 'firefox'):
        row = json.loads((EVIDENCE / ('browser-' + browser + '.json')).read_text())
        assert row['status'] == 'passed', 'Native browser validation is incomplete'
        browsers.append({'browser': browser, 'version': row['browserVersion'],
                         'cases': len(row['cases']), 'checks': row['checks']})
    safari = json.loads((EVIDENCE / 'browser-safari.json').read_text())
    assert safari['cases'] == [] and safari['checks'] == 0 and safari['status'] == 'failed'
    assert 'timeout' in safari['runnerError']
    summary = {'version': VERSION, 'status': 'passed-beta-scope-with-safari-unavailable', 'scope': manifest['changes'],
               'baseVersion': '2.18.0', 'baseHistoricalFindingsRemainHistorical': True,
               'mainValidationResumed': False, 'final219Qualified': False,
               'frozenFiles': manifest['files'], 'groups': groups, 'browsers': browsers,
               'safari': {'status': 'automation-unavailable-before-product-execution',
                          'originalReceiptStatus': safari['status'], 'testsExecuted': 0},
               'wikipediaWrites': 0, 'giantArticleRepeated': False, 'workerTimeoutMilliseconds': 60000}
    (EVIDENCE / 'QA_SUMMARY.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    DOCS.mkdir(parents=True, exist_ok=True)
    installation = '''RevisaWiki 2.19.0-beta.1

Esta beta usa páginas próprias. Ela não substitui a instalação estável.
O programa e os dados precisam ser instalados por você, nesta ordem:

1. Copie RevisaWiki_v2_19_0_beta_1_dados.js inteiro para:
   Usuário:Daniel G Rego/RevisaWiki/Beta/Dados.js
2. Copie RevisaWiki_v2_19_0_beta_1.js inteiro para:
   Usuário:Daniel G Rego/RevisaWiki/Beta.js
3. Copie Carregador_comunitario_RevisaWiki_v2_19_0_beta_1.js inteiro para:
   Usuário:Daniel G Rego/RevisaWiki/Beta/Carregador.js
4. A documentação tem como destino:
   Usuário:Daniel G Rego/RevisaWiki/Beta
5. No seu common.js, guarde a chamada estável para poder restaurá-la,
   desative essa chamada e acrescente apenas o conteúdo de
   Chamada_fixa_RevisaWiki_beta_common.js. Preserve seus outros scripts.

O índice INICIO.html oferece o código completo, o destino e o resumo
para cada cartão. Abrir ou copiar um cartão não publica nenhuma página.
O arquivo completo reúne programa e dados para download e testes locais.
Ele ultrapassa 2 MiB, por isso não deve ser colado em uma única página.

Se usa uma configuração própria com dataPage, retire o destino da versão
estável ou ajuste-o para User:Daniel G Rego/RevisaWiki/Beta/Dados.js.
O carregador recusa uma combinação de programa e dados de versões diferentes.

Depois de instalar, recarregue sem cache. No Firefox e Chrome para Mac,
use Command + Shift + R. No Safari, use Option + Command + R.
Abra Editar código-fonte e confirme que o painel mostra 2.19.0-beta.1.

Para voltar à versão estável, retire a chamada da beta do common.js,
restaure a chamada anterior e recarregue sem cache. Não carregue ambas
na mesma página. Nenhuma das etapas exige substituir os arquivos estáveis.

Código e versões: https://github.com/danrego/RevisaWiki
'''
    manual = '''Esta é a documentação do ''' + "'''RevisaWiki 2.19.0-beta.1'''" + '''. A beta parte da versão publicada 2.18 e acrescenta um reparo delimitado no cabeçalho de discussão. As demais funções continuam sendo as da 2.18. A validação da versão final 2.19 está pausada.

== O que mudou ==

O botão ''' + "'''Criar código'''" + ''' reconhece os redirecionamentos conferidos de <nowiki>{{PD}}</nowiki>, como <nowiki>{{pd}}</nowiki> e <nowiki>{{Página de discussão}}</nowiki>. Ele conserva a chamada que já está na página, com seus parâmetros. Se encontrar um cabeçalho válido fora do início da discussão, preserva o texto e não acrescenta outro.

A comparação respeita a forma como o MediaWiki lê os títulos. A primeira letra pode variar de caixa e espaços podem ser escritos com sublinhados. Uma grafia incorreta no restante do nome não passa a ser um redirecionamento válido. Uma chamada dentro de um comentário ou exemplo protegido também não conta como cabeçalho da página.

As avaliações de projetos existentes continuam sendo tratadas pela lógica da 2.18. Esta beta não acrescenta a substituição de avaliações automáticas por ponto de interrogação.

== Como usar ==

* Abra ''' + "'''Editar código-fonte'''" + '''. Em artigos, ''' + "'''Ajustar código'''" + ''' mantém os reparos de sintaxe, referências, tabelas e infocaixas da 2.18.
* Na edição completa da discussão de um artigo, ''' + "'''Criar código'''" + ''' prepara o cabeçalho e as marcas de projeto no rascunho. A conversão de portais que já existia continua disponível.
* Use ''' + "'''Mostrar alterações'''" + ''' e ''' + "'''Mostrar previsão'''" + ''' para conferir o resultado. ''' + "'''Desfazer ajustes'''" + ''' restaura o texto anterior enquanto você não tiver feito outras alterações.
* A publicação continua no botão normal do editor. Instalar o script ou copiar arquivos neste índice não publica uma edição.

== Instalação separada ==

# Instale os dados em [[Usuário:Daniel G Rego/RevisaWiki/Beta/Dados.js]].
# Instale o programa em [[Usuário:Daniel G Rego/RevisaWiki/Beta.js]].
# Instale o carregador em [[Usuário:Daniel G Rego/RevisaWiki/Beta/Carregador.js]].
# No seu <code>common.js</code>, desative a chamada estável e use somente a chamada fixa da beta, fornecida no pacote. Preserve seus outros scripts.
# Recarregue sem cache e confirme que o painel mostra <code>2.19.0-beta.1</code>.

Os arquivos estáveis ficam nos destinos anteriores. Para voltar, retire a chamada da beta, restaure a chamada estável e recarregue sem cache. Se usa a opção própria <code>dataPage</code>, ela também precisa apontar para os dados da beta.

O programa e os dados são fornecidos em arquivos separados para respeitar o limite de tamanho da página. O arquivo completo serve para download e testes locais. O aviso visual de 102400 bytes do realce de sintaxe não é o limite de tamanho da página.

== O que testar ==

* Uma discussão que já comece com <nowiki>{{pd}}</nowiki> ou <nowiki>{{Página de discussão}}</nowiki> deve continuar com uma única chamada, sem mudar seus parâmetros.
* Um cabeçalho válido colocado depois de uma conversa não deve receber uma segunda chamada no início.
* Ao criar o cabeçalho com projetos, confira se o texto da conversa e as avaliações existentes foram conservados. Teste também ''' + "'''Desfazer ajustes'''" + '''.
* Em artigos, confira os ajustes habituais pela comparação e pela pré-visualização. Informe a versão, a chamada original e o resultado se encontrar um problema. Retire informações pessoais antes de enviar um relato.

== Limites ==

Esta beta não reúne todas as mudanças em preparação para a 2.19. Os novos reparos de referências, imagens e portais que ainda dependem da validação final ficaram de fora. As limitações e os resultados históricos da 2.18 não foram reclassificados como testes aprovados da beta.

O processamento separado mantém o limite de 60 segundos. Ao atingir esse limite, a análise é interrompida sem aplicar o resultado atrasado. O teste do artigo extremo de aproximadamente 1,9 MB não foi repetido para esta beta. A quantidade de reparos pode variar com a configuração e com a presença de código incompleto.

== Testes desta beta ==

Foram executados os controles do cabeçalho, as comparações das funções com a base publicada e seis suítes de regressão nas duas distribuições. Os controles locais de interface, instalação e edição passaram no Chrome e no Firefox. A automação do Safari não conseguiu iniciar a sessão, portanto os testes nesse navegador ficaram pendentes. O resultado dessa tentativa foi preservado. As versões dos navegadores e os resultados completos acompanham o pacote. Os testes não fizeram edições na Wikipédia.

Os controles desta beta não substituem a rodada extensa da 2.19 final. Os resultados anteriores dessa rodada continuam preservados e o trabalho principal permanece pausado.

== Histórico ==

=== 2.19.0-beta.1 ===

* Instalação separada para testes, com destinos próprios para programa, dados e carregador.
* Reconhecimento dos redirecionamentos conferidos do cabeçalho de discussão, preservando a chamada existente.
* Detecção desse cabeçalho fora do início da página, evitando acrescentar outra chamada.
* Comparação com a 2.18 e novos testes de falsos positivos, interface e instalação.

=== 2.18.0, base desta beta ===

* Reparos de citações completas em contextos reconhecidos, mesmo quando outro trecho está incompleto.
* Correções de campos e valores literais de citações conferidos.
* Limpeza de linhas vazias excedentes na prosa e formatação responsiva das referências.

== Código e documentação ==

* [https://github.com/danrego/RevisaWiki Repositório no GitHub]
* [https://github.com/danrego/RevisaWiki/releases/tag/v2.19.0-beta.1 Código completo, instalação, índice de cópia e relatório desta beta]
* [[Usuário:Daniel G Rego/RevisaWiki|Documentação da versão estável]]
'''
    counts = 'Controles específicos e de identidade: ' + str(focused['cases']) + ' casos, ' + str(focused['checks']) + ' verificações.\n'
    counts += 'Suítes herdadas executadas novamente: ' + str(sum(x['cases'] for x in groups[1:])) + ' casos, ' + str(sum(x['checks'] for x in groups[1:])) + ' verificações.\n'
    counts += '\n'.join(x['browser'] + ' ' + x['version'] + ': ' + str(x['cases']) + ' casos, ' + str(x['checks']) + ' verificações.' for x in browsers)
    report = ('RevisaWiki ' + VERSION + '\n\n' + counts + '\n\n'
              'Os controles de identidade comparam os corpos das funções públicas com a base publicada. Não são contados como artigos. As seis suítes herdadas usam os arquivos reais da beta e não injetam reparos auxiliares.\n\n'
              'A primeira execução da interface antecipava a checagem do Desfazer, que é assíncrono. O teste passou a aguardar a mensagem de conclusão e manteve as mesmas exigências de restauração exata do texto e do resumo. O resultado anterior foi preservado. Não foi necessário alterar o programa.\n\n'
              'Safari: a sessão de automação não iniciou e nenhuma verificação do programa foi executada nesse navegador. O resultado da tentativa permanece como falha de infraestrutura.\n\n'
              'Os controles do índice de cópia são registrados separadamente após a geração do pacote. A rodada final da 2.19 não foi retomada. O artigo extremo não foi repetido. O limite de 60 segundos e as verificações de preservação permanecem. Nenhuma edição na Wikipédia.\n')
    files = {'Documentacao_RevisaWiki_' + SLUG + '.wiki': manual,
             'Instalacao_RevisaWiki_' + SLUG + '.txt': installation,
             'Resumo_atualizacao_RevisaWiki_' + SLUG + '.txt': 'Instalação separada do RevisaWiki 2.19.0-beta.1 para testes do cabeçalho de discussão.\n',
             'Resumo_documentacao_RevisaWiki_' + SLUG + '.txt': 'Documentação e instalação da beta 2.19.0-beta.1 do RevisaWiki.\n',
             'Relatorio_testes_RevisaWiki_' + SLUG + '.txt': report,
             'Notas_da_versao_RevisaWiki_' + SLUG + '.txt': 'RevisaWiki 2.19.0-beta.1\n\nBeta baseada na 2.18, com reconhecimento dos redirecionamentos do cabeçalho de discussão e prevenção de duplicação fora do início da página.\n\nInstalação separada. A 2.18 publicada permanece disponível. A validação da versão final 2.19 continua pausada.\n',
             'LEIA_PRIMEIRO.txt': installation}
    for name, text in files.items():
        assert '\n\n\n' not in text
        (DOCS / name).write_text(text)
        shutil.copyfile(DOCS / name, DIST / name)
    shutil.copyfile(ROOT / 'LICENSE', DIST / 'LICENSE.txt')
    subprocess.run([sys.executable, str(ROOT / 'scripts/build_index_beta219.py')], check=True)


if __name__ == '__main__':
    main()
