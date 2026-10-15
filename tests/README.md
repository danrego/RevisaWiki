# Repetir os testes

Com Node.js 18 ou posterior, execute `npm test`. O comando confere os cinco arquivos executáveis, repete os casos de tabelas e apresentação da 2.2 e executa os contratos independentes da 2.3 nas duas distribuições. Eles incluem preservação da estrutura, pontuação junto às referências, cabeçalhos e colunas nos bancos de referências. As revisões reais que revelaram os problemas estão incluídas. Sua ausência interrompe os testes. Não acessa a Wikipédia nem abre navegadores. Não repete automaticamente o corpus de 2.000 artigos.

Execute `python3 scripts/build.py` e depois `npm test` para reconstruir o programa e os dados. Os bytes precisam corresponder aos hashes guardados em `tests/expected_release.json`.

`python3 tests/inherited/run.py` repete separadamente as 12 suítes históricas, com 136.283 casos e suas fontes congeladas incluídas. O comando não faz parte de npm test e não precisa de acesso à Wikipédia. Consulte [as instruções da bateria histórica](inherited/README.md).

## Navegadores no Mac

Instale Playwright, ou indique seu caminho por `REVISAWIKI_PLAYWRIGHT_MODULE`. Os testes usam os aplicativos Firefox, Google Chrome e Safari instalados no Mac, com páginas locais. Para Safari, habilite a automação remota no menu Desenvolvedor e use uma sessão por vez.

`node tests/native/run_native.cjs Chrome` repete os fluxos do botão em um editor simulado. Troque Chrome por Firefox ou Safari. Para os carregadores, use `node tests/native/run_native.cjs Chrome dist/2.3.0/RevisaWiki_v2_3.js install-loaders`.

`node tests/v23_independent/native/run_preview.cjs Chrome` repete as verificações de DOMParser, incluindo as caixas e referências originais do exemplo reduzido do incidente. O HTML foi obtido por GET público e anônimo. Os testes usam cópias locais, recusam rede externa e não abrem contas.

`node tests/v23_independent/native/run_late_regressions.cjs Chrome` repete os casos adicionais de pontuação, números, cabeçalhos e bancos de referências no navegador real. Troque Chrome por Firefox ou Safari. Os resultados e candidatos locais ficam em `tests/v23_independent/artifacts/`, ignorado pelo Git.

O modo `ui` e a parte de artigos grandes do modo `structural-v23` precisam dos corpus locais, que não integram o GitHub. Os manifestos e as evidências identificam os oldids e hashes. `tests/corpus/fetch_fixed_revisions.py` permite baixar o novo conjunto por revisões fixas, mediante consultas públicas somente de leitura. Confira o README do corpus para o caminho de destino e o comando.

Os resultados executados ficam em `tests/evidence/2.3.0`. Testes com API simulada não certificam todos os scripts pessoais ou extensões que possam estar instalados em um editor.
