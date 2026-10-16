# Navegadores da 2.8.3

Os testes usam páginas locais e os navegadores instalados. Conferem a aplicação da regra de categoria redundante no editor, a consulta anônima simulada, a recusa silenciosa quando faltam dados, o segundo clique e o Desfazer exato. A prova com o servidor real fica separada, em `NATIVE_BIRTH_CATEGORY_PROOF.json`.

```sh
node tests/v283/browser/build_second_click_contract.cjs
node tests/v283/browser/run_release.cjs Chrome dist/2.8.3
node tests/v283/browser/run_release.cjs Firefox dist/2.8.3
node tests/v283/browser/run_release.cjs Safari dist/2.8.3
node tests/v283/browser/summarize_release.cjs artifacts/v283/final_browser
```

Os testes não salvam páginas nem carregam contas dos navegadores pessoais.
