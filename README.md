# RevisaWiki

O RevisaWiki ajusta wikitexto da Wikipédia em português. O botão **Ajustar código** deixa as mudanças no editor, com comparação e opção de desfazer. O script não publica páginas.

## Versão 2.5.0

- Retira títulos redundantes antes da introdução quando a abertura confirma o assunto.
- Reutiliza citações iguais com campos em outra ordem e retira chamadas consecutivas repetidas da mesma referência.
- Corrige atributos idênticos repetidos, fechamentos mistos reconhecidos e listas vazias de notas repetidas do mesmo grupo.
- Alinha os sinais de igual em infocaixas já escritas com um campo por linha, preservando os valores.
- O botão **Preparar discussão** monta `{{PD}}` e as marcas dos projetos confirmados nos portais do artigo. A proposta só entra no editor depois de **Aplicar ao editor**.
- Reúne o histórico de versões em ordem decrescente e separa os detalhes de testes das instruções de uso.

Os casos ambíguos, as fórmulas, os exemplos e os trechos incompletos têm proteções próprias. O manual explica os limites de cada regra.

[Arquivos completos da 2.5.0](dist/2.5.0/) · [Instalação](docs/2.5.0/Instalacao_RevisaWiki_v2_5.txt) · [Manual para a Wikipédia](docs/2.5.0/Documentacao_RevisaWiki_v2_5.wiki) · [Histórico resumido](docs/2.5.0/Notas_da_versao_RevisaWiki_v2_5.txt) · [Relatório de testes](docs/2.5.0/Relatorio_testes_RevisaWiki_v2_5.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. Preserve os outros scripts do seu common.js.

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

A reconstrução parte da distribuição 2.4.0 preservada no repositório e confere o hash de origem e o conteúdo dos catálogos. O [guia de testes](tests/README.md) explica como obter as revisões para a rodada completa.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
