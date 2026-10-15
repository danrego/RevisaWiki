# Controles de interface herdados, RevisaWiki 2.6

Estes testes vieram da versão 2.5 e usam os mesmos casos para conferir os editores, as correções e as funções de comparação e desfazer na versão 2.6. Os nomes de arquivos e a versão esperada foram adaptados. `ADAPTATION.json` registra essas alterações.

Na raiz do repositório, use a distribuição modular:

```sh
REVISAWIKI_NATIVE_SCRIPT=dist/2.6.0/RevisaWiki_v2_6.js python3 tests/inline_v26/legacy_native/run_release.py Chrome
REVISAWIKI_NATIVE_SCRIPT=dist/2.6.0/RevisaWiki_v2_6.js python3 tests/inline_v26/legacy_native/run_release.py Firefox
REVISAWIKI_NATIVE_SCRIPT=dist/2.6.0/RevisaWiki_v2_6.js python3 tests/inline_v26/legacy_native/run_release.py Safari
```

A execução completa reúne sete grupos, com 268 casos por navegador. Eles cobrem edição clássica, CodeMirror, edição em código de 2017, Workers, cancelamento, resumos, instalação, páginas novas e preparação de discussão. Os testes usam páginas locais, interceptam as consultas e recusam publicação. Não há captura de tela.

Instale Node.js e `playwright`, e mantenha os navegadores na pasta Aplicativos do Mac. `REVISAWIKI_NODE` e `REVISAWIKI_PLAYWRIGHT` permitem indicar instalações locais. O Safari precisa ter a automação remota ativada. Execute somente um controlador do Safari de cada vez.

As fontes extensas e as versões usadas estão em `FIXTURE_SOURCES.json`. Os textos da Wikipédia seguem a licença CC BY-SA 4.0, com links permanentes nos manifestos. Os fornecedores de JavaScript mantêm os créditos originais. Os resultados, perfis e arquivos temporários não devem entrar no controle de versão.
