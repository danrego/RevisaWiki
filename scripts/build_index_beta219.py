"""Build the full-content copy index for RevisaWiki 2.19.0-beta.1."""
from pathlib import Path

path = Path(__file__).with_name('build_index.py')
source = path.read_text().replace('2.6.0', '2.19.0-beta.1').replace('_v2_6', '_v2_19_0_beta_1')
source = source.replace('tests/expected_release.json', 'tests/expected_release_beta219.json')
start = source.index('rows = [')
end = source.index('\nassert not re.search', start)
source = source[:start] + '''rows = [
    ('dados', '1. Dados', 'RevisaWiki_v2_19_0_beta_1_dados.js', 'Usuário:Daniel G Rego/RevisaWiki/Beta/Dados.js', 'Resumo_atualizacao_RevisaWiki_v2_19_0_beta_1.txt', 'Os dados precisam declarar a mesma versão do programa. Copie o arquivo inteiro.'),
    ('programa', '2. Programa', 'RevisaWiki_v2_19_0_beta_1.js', 'Usuário:Daniel G Rego/RevisaWiki/Beta.js', 'Resumo_atualizacao_RevisaWiki_v2_19_0_beta_1.txt', 'Substitua o núcleo inteiro pela versão corrigida.'),
    ('central', '3. Carregador central', 'Carregador_comunitario_RevisaWiki_v2_19_0_beta_1.js', 'Usuário:Daniel G Rego/RevisaWiki/Beta/Carregador.js', 'Resumo_atualizacao_RevisaWiki_v2_19_0_beta_1.txt', 'Atualize esta página para carregar o programa e os dados da mesma versão. Este carregador usa apenas as páginas separadas da beta.'),
    ('documentacao', '4. Documentação', 'Documentacao_RevisaWiki_v2_19_0_beta_1.wiki', 'Usuário:Daniel G Rego/RevisaWiki/Beta', 'Resumo_documentacao_RevisaWiki_v2_19_0_beta_1.txt', 'Copie o manual completo, com o histórico da versão e as instruções de instalação.'),
    ('carregador', 'Chamada fixa, somente na primeira instalação', 'Chamada_fixa_RevisaWiki_beta_common.js', 'Especial:Minha página/common.js', 'Resumo_atualizacao_RevisaWiki_v2_19_0_beta_1.txt', 'Para testar a beta, desative a chamada da versão estável e use somente esta. Preserve seus outros scripts. Para voltar, restaure a chamada estável e recarregue a página.'),
]''' + source[end:]
source = source.replace('Para compartilhar com outros editores', 'Primeira instalação')
source = source.replace("    cards.append(f'''<article", "    raw_href = 'https://pt.wikipedia.org/w/index.php?' + urlencode({'title': destination, 'action': 'raw', 'ctype': 'text/javascript' if filename.endswith('.js') else 'text/plain'})\n    cards.append(f'''<article", 1)
source = source.replace('<a href="{html.escape(href)}" target="_blank" rel="noopener noreferrer">Abrir edição ↗</a>', '<a href="{html.escape(href)}" target="_blank" rel="noopener noreferrer">Abrir edição ↗</a><a class="raw-source" href="{html.escape(raw_href)}" target="_blank" rel="noopener noreferrer">Ver código bruto ↗</a>', 1)
source = source.replace('Atualize primeiro os dados e o programa. Depois, atualize o carregador para 2.18.0. No <strong>common.js</strong>, preserve seus outros scripts. Este índice não salva nenhuma página.',
    'Siga os quatro cartões na ordem: dados, programa, carregador central e documentação. Use a chamada da beta no <strong>common.js</strong> enquanto testar. Desative a chamada estável para não carregar as duas versões. Este índice não salva nenhuma página.')
source = source.replace('<p class="status" id="status"', '<details class="notice"><summary>O aviso de tamanho do código</summary><p>A mensagem que cita o máximo de 102400 bytes vem do realce de sintaxe usado para mostrar arquivos grandes. Esse aviso visual não impede o salvamento nem a execução do JavaScript. O link <strong>Ver código bruto</strong> abre o conteúdo sem esse realce. Um erro de sintaxe ou uma recusa de publicação precisa ser investigado separadamente.</p><p>Depois de atualizar os arquivos, recarregue sem cache: Command + Shift + R no Firefox ou Chrome, Option + Command + R no Safari. O painel deve mostrar <strong>PTwiki 2.19.0-beta.1</strong>. As instruções completas explicam como conferir a instalação.</p></details>\n<p class="status" id="status"', 1)
exec(compile(source, str(path), 'exec'))
