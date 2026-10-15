# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Na página de leitura, **Editar aqui** abre uma seção para trabalhar no mesmo painel. Somente o clique em **Publicar alterações**, dentro desse editor rápido, inicia o envio.

## Versão 2.6.0

- Abre uma seção na página de leitura, com resumo, prévia visual e os ajustes atuais.
- Mantém a revisão de origem e o rascunho diante de conflitos, falhas de conexão ou saída para o editor completo.
- Reconhece parâmetros aceitos nas referências e corrige os falsos avisos de Harvtxt encontrados em Matriz definida.
- Retira avisos sobre listas curtas e escolhas válidas de colunas, com prazo limitado para a conferência online.
- Acrescenta onze formas confirmadas de ligações e quatro correções exatas de grafia, após examinar revisões públicas.

- Atalhos opcionais que dependiam de páginas pessoais deixaram de ser expandidos.

Os casos ambíguos, as fórmulas, os exemplos e os trechos incompletos têm proteções próprias. O manual explica os limites de cada regra.

[Arquivos completos da 2.6.0](dist/2.6.0/) · [Instalação](docs/2.6.0/Instalacao_RevisaWiki_v2_6.txt) · [Manual para a Wikipédia](docs/2.6.0/Documentacao_RevisaWiki_v2_6.wiki) · [Histórico resumido](docs/2.6.0/Notas_da_versao_RevisaWiki_v2_6.txt) · [Relatório de testes](docs/2.6.0/Relatorio_testes_RevisaWiki_v2_6.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. Nesta atualização, substitua o bloco completo do carregador do RevisaWiki. Mudar apenas o número da versão não acrescenta os controles na página de leitura. Preserve os outros scripts do seu common.js.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build.py
npm test
npm run test:engine
npm run test:complex
npm run test:regression
npm run test:privacy
```

`npm test` confere os arquivos distribuídos e executa os contratos locais. `npm run test:engine` confere as correções de referências e sintaxe, as opções desativadas e os limites do cache. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. Os comandos de testes complexos e de regressão ampliam essa conferência. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução parte da distribuição 2.5.0 preservada no repositório e confere o hash de origem e os catálogos empacotados. As quatro grafias novas ficam num complemento separado. O [guia de testes](tests/README.md) explica como obter as revisões para a rodada completa. A publicação nos testes da interface usa respostas simuladas em páginas locais, sem edições na Wikipédia.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
