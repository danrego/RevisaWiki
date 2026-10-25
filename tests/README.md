# Testes do RevisaWiki

Os comandos atuais executam a versão 2.21.1. O [guia da versão](v2211/README.md) explica os contratos atuais, a regressão histórica, as revisões reais e os testes de navegador. Os arquivos históricos permanecem disponíveis com a identificação dos resultados originais.

Para montar o projeto e executar os testes, use Node.js 24 ou posterior e npm 10 ou posterior. Instale as dependências de desenvolvimento fixadas no arquivo de lock antes de executar a bateria. O parser fica no `node_modules` do projeto, sem precisar de `NODE_PATH`.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run test:focused
npm run test:complex
npm run test:documentation
npm run test:privacy:unit
npm run test:privacy:synthetic
npm run test:privacy
```

Os testes de artigos, catálogos e histórico exigem argumentos explícitos e fontes locais conferidas. Uma execução reduzida serve para diagnóstico e não substitui a campanha completa. Uma falha, uma consulta indisponível ou uma expectativa antiga sem revisão não conta como aprovação.

Os comprovantes públicos apresentam totais, hashes e o alcance das verificações. Capturas reais, logs, perfis de navegador e caminhos locais ficam fora da publicação. As matrizes fictícias podem ser reproduzidas, e nenhum teste edita a Wikipédia ou usa uma conta.
