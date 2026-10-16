# Navegadores da 2.8.2

Os testes usam o editor de código-fonte simulado em páginas locais e os navegadores instalados. A revisão de NBC News que contém as conversões indevidas precisa produzir o reparo esperado na interface, com dados preservados, segundo clique estável e Desfazer exato. Uma chamada genérica legítima continua no modelo original.

```sh
node tests/v282/browser/build_second_click_contract.cjs
node tests/v282/browser/run_release.cjs Chrome dist/2.8.2
node tests/v282/browser/run_release.cjs Firefox dist/2.8.2
node tests/v282/browser/run_release.cjs Safari dist/2.8.2
node tests/v282/browser/summarize_release.cjs artifacts/v282/final_browser
```

A comparação com a renderização real da ptwiki tem um relatório separado, obtido por consultas anônimas de leitura. Os testes locais não salvam páginas nem carregam as contas dos navegadores pessoais.
