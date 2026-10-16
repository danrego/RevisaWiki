# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Use o editor de código-fonte da Wikipédia para trabalhar no artigo inteiro ou em uma seção.

## Versão 2.8.2

A versão 2.8.2 corrige trocas de modelos de referência que já tenham sido salvas quando há um caso conferido no catálogo. O primeiro caso é NBC News.

- Recupera 132 das 154 chamadas examinadas: 101 `Citar web`, 29 `Citar jornal` e duas `Citar revista`.
- Acrescenta 103 URLs comprovadas para as mesmas referências, preservando os demais valores atuais.
- Mantém as outras 22 chamadas como `Citation`, pois a fonte exata ainda não foi confirmada.
- Usa um registro de revisões conferidas e compara o artigo e os dados atuais de cada referência. Não consulta o histórico durante o uso nem escolhe endereços apenas pelo nome da publicação.
- Preserva chamadas genéricas legítimas e os ajustes das versões anteriores, sem novos avisos.
- Mantém a chamada fixa do `common.js`. Atualize dados, núcleo e carregador central para 2.8.2.

O manual completo explica os limites das regras. A comparação permite conferir as mudanças e Desfazer ajustes restaura o rascunho anterior.

[Arquivos completos da 2.8.2](dist/2.8.2/) · [Instalação](docs/2.8.2/Instalacao_RevisaWiki_v2_8_2.txt) · [Manual para a Wikipédia](docs/2.8.2/Documentacao_RevisaWiki_v2_8_2.wiki) · [Histórico resumido](docs/2.8.2/Notas_da_versao_RevisaWiki_v2_8_2.txt) · [Relatório de testes](docs/2.8.2/Relatorio_testes_RevisaWiki_v2_8_2.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. O índice segue a ordem de atualização e oferece a chamada fixa separadamente para quem instala pela primeira vez. Preserve seus outros scripts.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build_v282.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

`npm test` confere os sete arquivos distribuídos e executa os casos de instalação, as regressões pontuais e os contratos anteriores do motor. `npm run test:complex` acrescenta os artigos maiores. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução parte dos sete arquivos verificados da distribuição 2.8.1 e aplica o módulo de `src/v2_8_2`. As versões arquivadas ficam intactas. Os testes desta versão estão em `tests/v282`, com fontes fixadas, controles de falsos positivos, conferência da instalação e adaptações explícitas das expectativas afetadas pela nova correção, preservando as suítes anteriores. O [guia desta versão](tests/v282/README.md) explica os comandos e os limites. Os testes de interface usam páginas locais, sem edições na Wikipédia.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
