# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Use o editor de código-fonte da Wikipédia para trabalhar no artigo inteiro ou em uma seção.

## Versão 2.7.1

A versão 2.7.1 repara a notação literal de nomes químicos que pode impedir a montagem de uma infocaixa. Um hífen antes de uma chave pode abrir uma conversão de idioma por acidente. Nos campos IUPAC conferidos, a chave passa a usar uma entidade HTML e o nome exibido continua igual.

- Confere os campos de nome IUPAC de `Info/Droga` e `Info/Química` e o par literal `rótuloN=Nome IUPAC` com `dadosN` de `Info` ou `Infocaixa`.
- Permite a quebra de linha de identificadores InChI literais muito longos em caixas genéricas, corrigindo o alargamento no Firefox sem mudar o valor ou impor uma largura fixa.
- Preserva conversões de idioma válidas, nomes calculados, campos ambíguos e exemplos.
- Mantém as regras de duplicação, a comparação de artigos extensos, a preparação da discussão e os demais recursos anteriores.
- Conserva a chamada fixa do `common.js`. Atualize os dados, o núcleo e o carregador central para 2.7.1.

O manual completo explica os limites das regras. A comparação permite conferir as mudanças e Desfazer ajustes restaura o rascunho anterior.

[Arquivos completos da 2.7.1](dist/2.7.1/) · [Instalação](docs/2.7.1/Instalacao_RevisaWiki_v2_7_1.txt) · [Manual para a Wikipédia](docs/2.7.1/Documentacao_RevisaWiki_v2_7_1.wiki) · [Histórico resumido](docs/2.7.1/Notas_da_versao_RevisaWiki_v2_7_1.txt) · [Relatório de testes](docs/2.7.1/Relatorio_testes_RevisaWiki_v2_7_1.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. O índice segue a ordem de atualização e oferece a chamada fixa separadamente para quem instala pela primeira vez. Preserve seus outros scripts.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build_v271.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

`npm test` confere os sete arquivos distribuídos e executa os casos de instalação, as regressões pontuais e os contratos anteriores do motor. `npm run test:complex` acrescenta os artigos maiores. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução parte dos sete arquivos verificados da distribuição 2.7.0 e aplica os módulos de `src/v2_7_1`. As versões arquivadas ficam intactas. Os testes desta versão estão em `tests/v271`, com fontes fixadas, controles de falsos positivos, conferência da instalação e adaptação dos testes anteriores sem mudar suas asserções. O [guia desta versão](tests/v271/README.md) explica os comandos e os limites. Os testes de interface usam páginas locais, sem edições na Wikipédia.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
