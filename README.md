# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Na página de leitura, **Editar aqui** abre uma seção para trabalhar no mesmo painel. Somente o clique em **Publicar alterações**, dentro desse editor rápido, inicia o envio.

## Versão 2.6.2

A versão 2.6.2 corrige a leitura de aspas no corpo das referências, nos rótulos de ligações externas e nas células de tabelas. Uma aspa solta podia ser confundida com o início ou o fim de um atributo adiante e fazer uma tabela completa parecer incompleta. O programa passa a respeitar esses limites sem retirar ou completar as aspas do artigo. Trechos com estruturas realmente incompletas continuam protegidos.

O `common.js` mantém a chamada curta e fixa da correção anterior. Ela abre `RevisaWiki/Carregador.js`, onde ficam a versão esperada e as instruções de carregamento. Atualize os dados, o núcleo e esse carregador central para 2.6.2. Os catálogos conservam o conteúdo anterior, mas o arquivo de dados precisa declarar a mesma versão do programa.

- Reconhece `Referência` e `Referencia` como listas existentes e usa `Referências` sem acrescentar uma lista duplicada.
- Troca os redirecionamentos locais `AP`, `Ap` e `Main` por `Artigo principal`, mantendo todos os argumentos.
- Corrige uma leitura de aspas que escondia etiquetas HTML já fechadas e impedia os ajustes no restante do artigo.
- Recolhe a explicação de trechos preservados em um bloco fechado, sem o aviso genérico sobre código incompleto. Estruturas realmente ambíguas continuam protegidas.
- Na discussão de um artigo, **Criar código** prepara e insere `PD` e `Marca de projeto` no rascunho com um clique. Converte os portais confirmados para marcas de projeto, aceita vários rótulos na mesma linha e mantém avaliações e comentários existentes.

- Retira o botão de introdução junto ao título da página e mantém os atalhos de edição das seções.

Os casos ambíguos, as fórmulas, os exemplos e os trechos incompletos têm proteções próprias. O manual explica os limites de cada regra.

[Arquivos completos da 2.6.2](dist/2.6.2/) · [Instalação](docs/2.6.2/Instalacao_RevisaWiki_v2_6_2.txt) · [Manual para a Wikipédia](docs/2.6.2/Documentacao_RevisaWiki_v2_6_2.wiki) · [Histórico resumido](docs/2.6.2/Notas_da_versao_RevisaWiki_v2_6_2.txt) · [Relatório de testes](docs/2.6.2/Relatorio_testes_RevisaWiki_v2_6_2.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. O índice segue a ordem de atualização e oferece a chamada fixa separadamente para quem instala pela primeira vez. Preserve seus outros scripts.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build_v262.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

`npm test` confere os sete arquivos distribuídos e executa os casos de instalação, as regressões pontuais e os contratos anteriores do motor. `npm run test:complex` acrescenta os artigos maiores. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução parte dos sete arquivos verificados da distribuição 2.6.1-hotfix.1 e aplica o módulo de aspas em `src/v2_6_2`. As versões arquivadas ficam intactas. Os testes desta correção estão em `tests/v262`, com a revisão pública que reproduz o problema, controles de falsos positivos, conferência da instalação e adaptação dos testes anteriores sem mudar suas asserções. O [guia desta versão](tests/v262/README.md) explica os comandos e os limites. Os testes de interface usam páginas locais, sem edições na Wikipédia.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
