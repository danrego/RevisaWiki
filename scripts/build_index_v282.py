"""Build the full-content copy index for RevisaWiki 2.8.2."""
from pathlib import Path

path = Path(__file__).with_name('build_index.py')
source = path.read_text().replace('2.6.0', '2.8.2').replace('_v2_6', '_v2_8_2')
source = source.replace('tests/expected_release.json', 'tests/expected_release_v282.json')
start = source.index('rows = [')
end = source.index('\nassert not re.search', start)
source = source[:start] + '''rows = [
    ('dados', '1. Dados', 'RevisaWiki_v2_8_2_dados.js', 'Usuário:Daniel G Rego/RevisaWiki/Dados.js', 'Resumo_atualizacao_RevisaWiki_v2_8_2.txt', 'Os dados precisam declarar a mesma versão do programa. Copie o arquivo inteiro.'),
    ('programa', '2. Programa', 'RevisaWiki_v2_8_2.js', 'Usuário:Daniel G Rego/RevisaWiki.js', 'Resumo_atualizacao_RevisaWiki_v2_8_2.txt', 'Substitua o núcleo inteiro pela versão corrigida.'),
    ('central', '3. Carregador central', 'Carregador_comunitario_RevisaWiki_v2_8_2.js', 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', 'Resumo_atualizacao_RevisaWiki_v2_8_2.txt', 'Atualize esta página para carregar o programa e os dados da mesma versão. A chamada fixa do common.js continua igual.'),
    ('documentacao', '4. Documentação', 'Documentacao_RevisaWiki_v2_8_2.wiki', 'Usuário:Daniel G Rego/RevisaWiki', 'Resumo_documentacao_RevisaWiki_v2_8_2.txt', 'Copie o manual completo, com o histórico da versão e as instruções de instalação.'),
    ('carregador', 'Chamada fixa, somente na primeira instalação', 'Chamada_fixa_RevisaWiki_common.js', 'Especial:Minha página/common.js', 'Resumo_atualizacao_RevisaWiki_v2_8_2.txt', 'Se já usa a chamada fixa, pule este cartão. Na primeira instalação, acrescente uma única chamada e preserve seus outros scripts.'),
]''' + source[end:]
source = source.replace('Para compartilhar com outros editores', 'Primeira instalação')
source = source.replace('Atualize primeiro os dados e o programa. Depois, atualize o carregador para 2.8.2. No <strong>common.js</strong>, preserve seus outros scripts. Este índice não salva nenhuma página.',
    'Siga os quatro cartões na ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o <strong>common.js</strong> como está. Este índice não salva nenhuma página.')
exec(compile(source, str(path), 'exec'))
