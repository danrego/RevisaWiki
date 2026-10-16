# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Use o editor de código-fonte da Wikipédia para trabalhar no artigo inteiro ou em uma seção.

## Versão 2.8.0

A versão 2.8 corrige campos de infocaixas pessoais a partir dos dados que já estão no artigo. Os ajustes entram no botão **Ajustar código**, com comparação e opção de desfazer.

- Separa arquivo, tamanho e legenda de imagens inseridas como ligações completas nos campos conferidos.
- Corrige erros de digitação previstos numa lista de parâmetros, sem renomear variantes que já funcionam.
- Repara ligações externas malformadas em campos de site, preservando endereço e rótulo.
- Organiza listas simples de profissões e retira negrito redundante de cabeçalhos que já o aplicam.
- Corrige a exibição de idade quando a mesma caixa informa nascimento e morte completos, sem conflito.
- Formata vários casamentos separados, mantendo cada nome, data, estado civil e referência.
- Confere os demais campos da infocaixa e a ligação das referências. Casos ambíguos ficam intactos, sem novos avisos.
- Mantém a chamada fixa do `common.js`. Atualize dados, núcleo e carregador central para 2.8.0.

O manual completo explica os limites das regras. A comparação permite conferir as mudanças e Desfazer ajustes restaura o rascunho anterior.

[Arquivos completos da 2.8.0](dist/2.8.0/) · [Instalação](docs/2.8.0/Instalacao_RevisaWiki_v2_8.txt) · [Manual para a Wikipédia](docs/2.8.0/Documentacao_RevisaWiki_v2_8.wiki) · [Histórico resumido](docs/2.8.0/Notas_da_versao_RevisaWiki_v2_8.txt) · [Relatório de testes](docs/2.8.0/Relatorio_testes_RevisaWiki_v2_8.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. O índice segue a ordem de atualização e oferece a chamada fixa separadamente para quem instala pela primeira vez. Preserve seus outros scripts.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build_v280.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

`npm test` confere os sete arquivos distribuídos e executa os casos de instalação, as regressões pontuais e os contratos anteriores do motor. `npm run test:complex` acrescenta os artigos maiores. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução parte dos sete arquivos verificados da distribuição 2.7.3 e aplica os módulos de `src/v2_8`. As versões arquivadas ficam intactas. Os testes desta versão estão em `tests/v28`, com fontes fixadas, controles de falsos positivos, conferência da instalação e adaptação dos testes anteriores sem mudar suas asserções. O [guia desta versão](tests/v28/README.md) explica os comandos e os limites. Os testes de interface usam páginas locais, sem edições na Wikipédia.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
