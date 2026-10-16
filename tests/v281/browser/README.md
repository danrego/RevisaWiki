# Navegadores da 2.8.1

`run_release.cjs` executa os fluxos de instalação, artigos completos e infocaixas da versão anterior, com os seletores da 2.8.1. `citation_flow.cjs` acrescenta duas revisões de NBC News e três casos de citações, usando o botão da interface e uma Worker real. Cada caso confere o segundo clique e a restauração do rascunho.

```sh
node tests/v281/browser/build_second_click_contract.cjs
node tests/v281/browser/run_release.cjs Chrome dist/2.8.1
node tests/v281/browser/run_release.cjs Firefox dist/2.8.1
node tests/v281/browser/run_release.cjs Safari dist/2.8.1
node tests/v281/browser/summarize_release.cjs artifacts/v281/browser
```

Os testes usam os navegadores instalados e exigem as dependências locais descritas no executor. As provas históricas de renderização mantêm suas datas e hashes. A prova do segundo clique é gerada novamente, sem reaproveitar resultados de uma distribuição antiga. Nenhum fluxo edita a Wikipédia ou captura a tela do computador.
