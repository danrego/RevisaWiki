# Repetir os testes

Com Node.js 18 ou posterior, execute `npm test`. O comando confere os hashes dos cinco arquivos executáveis, os 61 casos anuais e os 91 casos da versão 2.2.0. Não consulta nem edita a Wikipédia.

`python3 scripts/build.py` reconstrói núcleo e dados usando o arquivo completo testado da própria 2.2.0. Depois, repita `npm test` para conferir os mesmos bytes.

Os relatórios da validação maior ficam em `tests/evidence`. A coleção de 1.000 artigos e os testes dos navegadores estão no pacote local de reprodução. Os seis arquivos de HTML em `tests/fixtures` foram renderizados pelo MediaWiki e usados nos testes nativos da pré-visualização. `npm test` não repete esses testes de navegador.

Os artefatos de teste ficam em `tests/artifacts`, fora dos commits.
