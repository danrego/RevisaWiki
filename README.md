# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Use o editor de código-fonte da Wikipédia para trabalhar no artigo inteiro ou em uma seção.

## Versão 2.7.0

A versão 2.7.0 acrescenta limpezas de duplicação e melhora a comparação de artigos grandes. O resultado informa os tipos de ajuste mantidos no rascunho. Um bloco extenso do diff deixa de aparecer como se fosse uma única correção.

O `common.js` mantém a chamada curta e fixa da correção anterior. Ela abre `RevisaWiki/Carregador.js`, onde ficam a versão esperada e as instruções de carregamento. Atualize os dados, o núcleo e esse carregador central para 2.7.0. Os catálogos conservam o conteúdo anterior, mas o arquivo de dados precisa declarar a mesma versão do programa.

- Retira nomes literalmente repetidos em listas simples de `Portal3`.
- Reúne chamadas `DEFAULTSORT` exatamente iguais no bloco final, mantendo a última.
- Retira campos vazios anteriores e repetidos de infocaixas quando a última ocorrência está preenchida.
- Reutiliza referências nomeadas equivalentes, com atualização conjunta das chamadas e conferência dos grupos, das definições e dos limites das listas.
- Separa diferenças locais em artigos extensos e conserva as dependências necessárias para rejeitar alterações com segurança.
- Refaz o resultado a partir do texto mantido, com saldo UTF-8 exato e indicação de precisão no detalhamento técnico dos bytes.
- Retira os botões adicionais **Editar aqui** das seções e mantém os links de edição da própria Wikipédia.
- Limpa cercas externas com rótulos de wikitexto digitados errado e marcas exatas de citação copiadas de chats, preservando referências e exemplos.

Os recursos anteriores continuam disponíveis, incluindo ortografia, adaptação de predefinições, revisão de citações e infocaixas, notas e colunas e preparação da discussão. A leitura de aspas da 2.6.2 permanece. O manual completo explica os critérios e os casos preservados.

Os casos ambíguos, as fórmulas, os exemplos e os trechos incompletos têm proteções próprias. O manual explica os limites de cada regra.

[Arquivos completos da 2.7.0](dist/2.7.0/) · [Instalação](docs/2.7.0/Instalacao_RevisaWiki_v2_7.txt) · [Manual para a Wikipédia](docs/2.7.0/Documentacao_RevisaWiki_v2_7.wiki) · [Histórico resumido](docs/2.7.0/Notas_da_versao_RevisaWiki_v2_7.txt) · [Relatório de testes](docs/2.7.0/Relatorio_testes_RevisaWiki_v2_7.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. O índice segue a ordem de atualização e oferece a chamada fixa separadamente para quem instala pela primeira vez. Preserve seus outros scripts.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build_v270.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

`npm test` confere os sete arquivos distribuídos e executa os casos de instalação, as regressões pontuais e os contratos anteriores do motor. `npm run test:complex` acrescenta os artigos maiores. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução parte dos sete arquivos verificados da distribuição 2.6.2 e aplica os módulos de automação e comparação em `src/v2_7`. As versões arquivadas ficam intactas. Os testes desta versão estão em `tests/v27`, com fontes fixadas, controles de falsos positivos, conferência da instalação e adaptação dos testes anteriores sem mudar suas asserções. O [guia desta versão](tests/v27/README.md) explica os comandos e os limites. Os testes de interface usam páginas locais, sem edições na Wikipédia.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
