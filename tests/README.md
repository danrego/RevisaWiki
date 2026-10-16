# Testes do RevisaWiki

Os comandos atuais executam a versão 2.14.0. O [guia da versão](v2140/README.md) explica os testes novos, os testes herdados e os limites. Os arquivos históricos permanecem intactos.

```sh
npm test
npm run test:focused
npm run test:complex
npm run test:large-articles
npm run test:documentation
npm run test:privacy:unit
npm run test:privacy
```

Os testes usam cópias locais de revisões públicas, casos sintéticos e navegadores reais em páginas locais. O adaptador confere por hash as fontes históricas antes e depois da execução. As adaptações de versão e de caminhos ficam registradas. A retirada da comparação própria tem um inventário separado das asserções de interface substituídas, com testes do atalho nativo.

A rodada principal continua a conferir referências, tabelas, biografias, portais, instalação, opções desligadas e falsos positivos. Os testes novos verificam os campos importados em quatro idiomas, as citações enciclopédicas, os alinhamentos, o relatório e as linhas vazias. Os valores e os trechos protegidos precisam permanecer preservados. Um segundo clique não deve refazer um ajuste já concluído.

As projeções nativas guardadas têm revisões, origem e hashes. Reexecutar sua conferência não é uma nova consulta à Wikipédia. Essas projeções cobrem os trechos afetados e não equivalem à análise nativa de artigos inteiros. Casos sintéticos e permutações não contam como artigos distintos.

Os resultados finais ficam em [evidence/2.14.0](evidence/2.14.0). Execuções preliminares, logs, perfis de navegador e caminhos privados ficam fora da publicação. Cada relatório identifica a versão e os arquivos executados. Uma falha ou uma consulta indisponível não conta como aprovação. Nenhum teste salva edições na Wikipédia ou usa uma conta.
