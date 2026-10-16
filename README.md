# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Use o editor de código-fonte da Wikipédia para trabalhar no artigo inteiro ou em uma seção.

## Versão 2.7.3

A versão 2.7.3 formata anotações explícitas de casamento nos campos de cônjuge de infocaixas pessoais. A regra conserva o nome, as datas e o estado civil escrito no campo, sem completar informações sobre gênero, divórcio ou viuvez.

- Cobre 33 infocaixas e nomes alternativos de políticos, cientistas, atores, músicos e outros tipos de biografia, com campos conferidos.
- Valida o calendário e mantém datas completas por extenso ou em formato ISO.
- Preserva referências finais e confere os demais campos da mesma infocaixa antes de aceitar a mudança.
- Exige um perfil individual explícito nas caixas musicais. Parceiros de duplas esportivas e campos ambíguos permanecem como estavam.
- Mantém os reparos de tabelas, nomes químicos, a comparação e os recursos anteriores.
- Conserva a chamada fixa do `common.js`. Atualize os dados, o núcleo e o carregador central para 2.7.3.

O manual completo explica os limites das regras. A comparação permite conferir as mudanças e Desfazer ajustes restaura o rascunho anterior.

[Arquivos completos da 2.7.3](dist/2.7.3/) · [Instalação](docs/2.7.3/Instalacao_RevisaWiki_v2_7_3.txt) · [Manual para a Wikipédia](docs/2.7.3/Documentacao_RevisaWiki_v2_7_3.wiki) · [Histórico resumido](docs/2.7.3/Notas_da_versao_RevisaWiki_v2_7_3.txt) · [Relatório de testes](docs/2.7.3/Relatorio_testes_RevisaWiki_v2_7_3.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. O índice segue a ordem de atualização e oferece a chamada fixa separadamente para quem instala pela primeira vez. Preserve seus outros scripts.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build_v273.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

`npm test` confere os sete arquivos distribuídos e executa os casos de instalação, as regressões pontuais e os contratos anteriores do motor. `npm run test:complex` acrescenta os artigos maiores. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução parte dos sete arquivos verificados da distribuição 2.7.2 e aplica os módulos de `src/v2_7_3`. As versões arquivadas ficam intactas. Os testes desta versão estão em `tests/v273`, com fontes fixadas, controles de falsos positivos, conferência da instalação e adaptação dos testes anteriores sem mudar suas asserções. O [guia desta versão](tests/v273/README.md) explica os comandos e os limites. Os testes de interface usam páginas locais, sem edições na Wikipédia.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
