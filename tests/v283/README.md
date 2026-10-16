# Testes da 2.8.3

As suítes da 2.8.2 permanecem intactas em `tests/v282`. Esta pasta usa os arquivos fixados em `tests/expected_release_v283.json`, com as adaptações registradas em `ADAPTATION_PROVENANCE.json`.

A nova suíte confere a retirada de categorias de nascimento redundantes em biografias reais e casos sintéticos. O resultado precisa preservar as demais categorias, as chaves de ordenação, as referências e o texto do artigo. Falhas de consulta, datas conflitantes e exemplos protegidos precisam conservar a categoria explícita.

```sh
node tests/v283/run_all.cjs
node tests/v283/run_engine.cjs --complex
node tests/v283/test_birth_categories.cjs
```

Os testes de navegador usam páginas locais, respostas simuladas da API e um Worker real. A prova separada de categorização nativa usa consultas anônimas GET. Os relatórios de renderização das versões anteriores conservam suas datas e seus arquivos de origem. Nenhum teste entra em contas, captura a tela, usa a área de transferência do sistema ou publica na Wikipédia.
