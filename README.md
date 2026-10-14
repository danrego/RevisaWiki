# RevisaWiki

O RevisaWiki ajuda a revisar o código das páginas da Wikipédia em português. O botão **Ajustar código** aplica as correções previstas nas regras ao rascunho. **Ver o que mudou** mostra a comparação, e **Desfazer ajustes** recupera o texto anterior. A ferramenta não salva nem publica uma edição.

A versão disponível é **2.1.1**. Corrige sintaxe de referências, campos de citações e infocaixas, grafias exatas e elementos finais reconhecidos. Também verifica restos de sintaxe de traduções. As regras que acrescentam portais, mostram idade ou reorganizam tabelas têm confirmações e limites próprios.

## Instalação

Baixe o repositório pelo botão **Code → Download ZIP**, descompacte e abra [dist/2.1.1/INICIO.html](dist/2.1.1/INICIO.html) no navegador. O índice tem botões para copiar o conteúdo completo, o resumo da edição e o destino.

1. Atualize [o arquivo de dados](dist/2.1.1/RevisaWiki_v2_1_1_dados.js).
2. Atualize [o programa](dist/2.1.1/RevisaWiki_v2_1_1.js).
3. Atualize apenas o carregador do RevisaWiki no `common.js`, preservando os outros scripts.
4. Atualize [a documentação](dist/2.1.1/Documentacao_RevisaWiki_v2_1_1.wiki).

[As instruções completas](dist/2.1.1/Instalacao_RevisaWiki_v2_1_1.txt) incluem o carregador para uma cópia própria e o carregador comunitário. Escolha apenas um. O arquivo `RevisaWiki_v2_1_1_completo.js` reúne programa e dados para download e testes, mas excede o limite de uma única página da ptwiki. A instalação usa as duas partes separadas.

## O que mudou na 2.1.1

Um subtítulo anual que esteja sozinho numa linha de tabela pode passar para fora dela. Os registros de cada ano recebem uma tabela, com repetição apenas dos cabeçalhos estáticos. As linhas de dados, as fontes e os atributos são copiados sem mudanças. Registros repetidos permanecem.

A regra foi preparada a partir da [correção pública na Lista de tornados no Brasil](https://pt.wikipedia.org/w/index.php?diff=73209168&oldid=73209108). Na revisão 73209386, separa 28 subtítulos em sete tabelas e mantém a tabela do Acre já corrigida. Não decide se dois registros descrevem o mesmo tornado. Células que atravessam linhas, tabelas aninhadas ou sem fechamento e modelos que geram linhas continuam para revisão.

## Validação

O núcleo e a cópia completa passaram novamente sobre 1.000 artigos distintos do conjunto congelado, incluindo 538 biografias confirmadas pela prova independente. Foram 2.000 execuções principais. As 12 suítes anteriores passaram em 136.283 verificações. A nova regra teve 61 casos, com 263 verificações.

No Mac, Firefox 158.0, Safari 27.0.1 e Chrome 155.0.8059.40 passaram em 582 fluxos agrupados de interface, carregamento e regras. Os exemplos pequenos da regra anual foram renderizados antes e depois pelo MediaWiki, com as células de dados preservadas. O índice passou em outras 69 verificações, com a área de transferência simulada. Nenhuma edição foi feita na Wikipédia.

Leia [o relatório](dist/2.1.1/Relatorio_testes_RevisaWiki_v2_1_1.txt), [os resultados consolidados](tests/evidence/release_summary.json) e [as instruções para repetir os testes locais](tests/README.md). As contagens de verificações de regras, fluxos de navegador e artigos distintos são diferentes e não devem ser somadas como se fossem páginas.

## Código e licença

Os arquivos distribuídos estão em `dist/2.1.1`. A regra acrescentada está em `src/table_year_sections.js`. `scripts/build.py` reconstrói o núcleo e os dados a partir do arquivo completo validado da própria 2.1.1. Os cinco arquivos executáveis precisam conservar os hashes da versão testada. Não há carregadores de versões anteriores no pacote.

O código e a documentação mantêm **CC BY-SA 4.0**, já indicada nos cabeçalhos do RevisaWiki. As revisões permanentes dos scripts usados permanecem no código. Os textos da Wikipédia usados como exemplos de testes têm suas revisões e atribuição em `tests/fixtures/ATRIBUICAO.txt`. Leia [a licença](LICENSE).
