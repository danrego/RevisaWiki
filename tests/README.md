# Repetir os testes

Com Node.js 18 ou posterior, execute `npm test` na raiz. O comando confere os hashes dos cinco arquivos executáveis e executa os 61 casos da nova regra, incluindo as três revisões da lista de tornados. São 263 verificações. Os testes não consultam nem editam a Wikipédia.

Para reconstruir o núcleo e os dados, execute `python3 scripts/build.py`. O comando usa o arquivo completo validado da própria versão 2.1.1. Em seguida, execute `npm test` para conferir se o resultado tem os mesmos bytes da entrega. Os carregadores publicados também são da 2.1.1.

`tests/evidence` contém resultados da validação maior, com 1.000 artigos, 538 biografias e os testes locais dos navegadores. A coleção completa e os ambientes de testes nativos estão no pacote local de reprodução. Executar `npm test` neste repositório não repete o teste de 1.000 artigos nem abre os três navegadores.

Os artefatos gerados pelos testes ficam em `tests/artifacts` e não precisam entrar em commits.
