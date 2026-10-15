"""Build the copy index for the permanent loader and installation correction."""
from pathlib import Path

path = Path(__file__).with_name('build_index.py')
source = path.read_text().replace('2.6.0','2.6.1-hotfix.1').replace('_v2_6','_v2_6_1')
source = source.replace('tests/expected_release.json','tests/expected_release_v261_hotfix_1.json')
start = source.index('rows = [')
end = source.index('\nassert not re.search', start)
source = source[:start] + '''rows = [
    ('dados', '1. Dados', 'RevisaWiki_v2_6_1_dados.js', 'Usuário:Daniel G Rego/RevisaWiki/Dados.js', 'Resumo_atualizacao_RevisaWiki_v2_6_1.txt', 'Se já instalou os dados da 2.6.1, pule este cartão. O arquivo continua igual.'),
    ('programa', '2. Programa corrigido', 'RevisaWiki_v2_6_1.js', 'Usuário:Daniel G Rego/RevisaWiki.js', 'Resumo_atualizacao_RevisaWiki_v2_6_1.txt', 'Substitua o núcleo inteiro para retirar o trecho alterado pela assinatura automática.'),
    ('central', '3. Carregador central', 'Carregador_comunitario_RevisaWiki_v2_6_1.js', 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', 'Resumo_atualizacao_RevisaWiki_v2_6_1.txt', 'Crie esta página com o carregador completo. As atualizações do carregamento passam a ficar aqui.'),
    ('carregador', '4. Chamada fixa no common.js', 'Chamada_fixa_RevisaWiki_common.js', 'Usuário:Daniel G Rego/common.js', 'Resumo_atualizacao_RevisaWiki_v2_6_1.txt', 'Substitua somente o bloco antigo do RevisaWiki. Preserve seus outros scripts. Esta chamada fica igual nas próximas atualizações.'),
    ('documentacao', '5. Documentação', 'Documentacao_RevisaWiki_v2_6_1.wiki', 'Usuário:Daniel G Rego/RevisaWiki', 'Resumo_documentacao_RevisaWiki_v2_6_1.txt', 'Copie o manual completo, com as instruções da chamada fixa. Outros editores usam a mesma chamada no próprio common.js.'),
]''' + source[end:]
source = source.replace('Para compartilhar com outros editores','Manual e compartilhamento')
source = source.replace('Atualize primeiro os dados e o programa. Depois, atualize o carregador para 2.6.1-hotfix.1. No <strong>common.js</strong>, preserve seus outros scripts. Este índice não salva nenhuma página.',
    'Os dados da 2.6.1 continuam iguais. Para corrigir a instalação atual, siga os cartões 2, 3 e 4. Depois desta migração, atualize os arquivos centrais e mantenha a chamada fixa no <strong>common.js</strong>. Preserve seus outros scripts. Este índice não salva nenhuma página.')
exec(compile(source, str(path), 'exec'))
