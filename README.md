# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Use o editor de código-fonte da Wikipédia para trabalhar no artigo inteiro ou em uma seção.

## Versão 2.10.0

A versão 2.10.0 amplia os reparos automáticos de tabelas e referências. Os casos incertos ficam como estão, sem novos avisos.

- Corrige separadores ausentes, aspas tipográficas em extensões numéricas, marcadores de linha redundantes e fechamentos misturados de tabelas nos formatos reconhecidos.
- Acrescenta o alcance dos cabeçalhos individuais em tabelas literais com três ou quatro níveis bem delimitados.
- Reutiliza referências idênticas definidas no rodapé e separa nomes conflitantes quando todas as chamadas contêm a fonte completa.
- Corrige a abertura `refname` quando os limites da referência estão completos.
- Restaura um destino de citação Harvard somente após a confirmação da renderização nativa e da correspondência exata de autores e ano.
- Contém a rolagem de tabelas largas nos casos reconhecidos, preservando seus dados e suas larguras mínimas.
- Compartilha leituras do mesmo rascunho em um cache limitado e pode conservar grupos independentes de reparos que passaram na conferência.

Os ajustes das versões anteriores continuam disponíveis. Atualize dados, núcleo e carregador central para 2.10.0. A chamada fixa do common.js permanece igual.

O manual completo explica os limites das regras. A comparação permite conferir as mudanças e Desfazer ajustes restaura o rascunho anterior.

[Arquivos completos da 2.10.0](dist/2.10.0/) · [Instalação](docs/2.10.0/Instalacao_RevisaWiki_v2_10_0.txt) · [Manual para a Wikipédia](docs/2.10.0/Documentacao_RevisaWiki_v2_10_0.wiki) · [Histórico resumido](docs/2.10.0/Notas_da_versao_RevisaWiki_v2_10_0.txt) · [Relatório de testes](docs/2.10.0/Relatorio_testes_RevisaWiki_v2_10_0.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. O índice segue a ordem de atualização e oferece a chamada fixa separadamente para quem instala pela primeira vez. Preserve seus outros scripts.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build_v2100.py
npm test
npm run test:complex
npm run test:reference-repairs
npm run test:table-repairs
npm run test:reference-graph
npm run test:table-structure
npm run test:responsive-tables
npm run test:structural-engine
npm run test:identifier-urls
npm run test:birth-categories
npm run test:birth-category-render
npm run test:documentation
npm run test:privacy
```

`npm test` confere os sete arquivos distribuídos e executa os casos de instalação, as regressões pontuais e os contratos anteriores do motor. `npm run test:complex` acrescenta os artigos maiores. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução parte dos sete arquivos verificados da distribuição 2.9.0 e aplica os módulos de `src/v2_10`. As versões arquivadas ficam intactas. Os testes desta versão estão em `tests/v2100`, com fontes fixadas, controles de falsos positivos e conferência da instalação. O [guia desta versão](tests/v2100/README.md) explica os comandos e os limites. Os testes de interface usam páginas locais, sem edições na Wikipédia.

Os testes de categorias incluem seis biografias em revisões anteriores e posteriores à retirada da categoria redundante. A prova nativa compara as categorias e suas chaves com respostas de consultas anônimas reais, guardadas com hashes. O comando `test:birth-category-render` confere essas respostas contra os arquivos finais, sem fazer novas consultas ou salvar páginas.

## Correção de referências da 2.8.2

A [versão 2.8.2](dist/2.8.2/) acrescentou a recuperação de 132 das 154 chamadas examinadas em NBC News, com 101 `Citar web`, 29 `Citar jornal` e duas `Citar revista`. Ela recupera 103 URLs comprovadas e mantém as outras 22 chamadas como `Citation`, sem escolher fontes pelo nome da publicação. Esse recurso continua disponível na 2.10.0. Seus números e sua evidência histórica permanecem no [manual da 2.8.2](docs/2.8.2/Documentacao_RevisaWiki_v2_8_2.wiki).

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
