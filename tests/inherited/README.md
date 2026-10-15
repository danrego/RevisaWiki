# Bateria histórica separada

Na raiz do repositório, execute:

```sh
python3 tests/inherited/run.py
```

O comando usa Node.js no PATH, ou o caminho indicado em REVISAWIKI_NODE. Testa a distribuição completa 2.3.0, sem abrir navegadores, acessar rede ou publicar. As 12 suítes incluem 136.283 casos, muitos deles combinações sistemáticas de campos aceitos e contextos protegidos. Esse número não corresponde a artigos diferentes. A execução pode levar alguns minutos e não faz parte de npm test.

Para indicar outro programa compatível:

```sh
python3 tests/inherited/run.py --version 2.3.0 --file-version v2_3 --script dist/2.3.0/RevisaWiki_v2_3.js --outdir dist/2.3.0
```

As fontes dos testes ficam neste diretório. run.py cria cópias executáveis em artifacts/, junto com os relatórios e candidatos, ignorados pelo Git. Os caminhos portáteis preservam as expectativas e as afirmações originais. portable_sources.json guarda os hashes antes e depois dessa troca de caminhos. As oito fontes de artigos e as duas versões anteriores do programa, necessárias às comparações, estão em fixtures/. Os catálogos e o carregador usados nos testes estão em dist/2.3.0. Arquivos ausentes interrompem a suíte correspondente.

As evidências da execução incluída na versão estão em tests/evidence/2.3.0/inherited_regression_summary.json.
