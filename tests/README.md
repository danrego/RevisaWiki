# Repetir os testes

Com Node.js 18 ou posterior, execute `npm test`. O comando confere os cinco arquivos executáveis, compara o código das regras e os catálogos com a 2.2.0 e repete os 61 casos de tabelas por ano e 91 casos de apresentação. Não acessa a Wikipédia nem abre os navegadores.

Para reconstruir o programa e os dados, execute `python3 scripts/build.py` e depois `npm test`. Os bytes resultantes precisam corresponder aos hashes guardados em `tests/expected_release.json`.

## Navegadores no Mac

Os testes locais do novo botão estão em `tests/native/run_native.cjs`. Eles servem arquivos em 127.0.0.1, usam uma API simulada e recusam ações de escrita. Somente a cópia de teste aceita o endereço local. A distribuição mantém sua verificação de pt.wikipedia.org.

Instale a biblioteca Playwright, ou indique seu caminho por `REVISAWIKI_PLAYWRIGHT_MODULE`. São usados os aplicativos Firefox, Google Chrome e Safari já instalados no Mac. Para Safari, habilite a automação remota no menu Desenvolvedor. Use uma sessão de Safari por vez.

Execute `node tests/native/run_native.cjs Chrome`, `node tests/native/run_native.cjs Firefox` e `node tests/native/run_native.cjs Safari` para os 25 fluxos do novo botão em cada navegador. Para repetir os carregadores, acrescente o caminho `dist/2.2.1/RevisaWiki_v2_2_1.js` e o modo `install-loaders` ao comando. Esses comandos não abrem sua conta nem enviam edições.

O modo histórico `ui` também usa três artigos grandes do corpus local anterior, que não integra este repositório. Seus resultados executados estão em `tests/evidence/2.2.1`. Os testes de navegador usam respostas simuladas e não certificam toda extensão ou script pessoal que possa estar instalado no editor.
