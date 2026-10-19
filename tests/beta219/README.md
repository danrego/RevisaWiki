# Beta 2.19.0-beta.1

Esta beta deriva dos arquivos publicados da 2.18. O único reparo acrescentado está no reconhecimento do cabeçalho de discussão. Os endereços e as versões dos arquivos de instalação são próprios da beta.

`cases.cjs` testa os aliases, a conservação dos parâmetros e das avaliações humanas, a detecção fora do início da discussão, as grafias incorretas e os exemplos protegidos. Também compara os corpos das outras funções públicas e os resultados de artigos fictícios com a base publicada. Essas comparações não são contadas como artigos reais.

`inherited.cjs` executa seis suítes da 2.18 sobre os arquivos reais da beta. Os casos, as opções e os resultados esperados dessas suítes ficam intactos. Os módulos auxiliares não são injetados no programa.

`browser.cjs` usa o editor local de teste, os navegadores instalados e Workers reais. A única adaptação do programa permite a origem de loopback. As requisições da Wikipédia são simuladas localmente e as tentativas de publicação são recusadas. O teste inclui criar e desfazer o cabeçalho, conservar aliases, analisar um artigo e carregar os arquivos pelas páginas separadas da beta.

`index_probe.cjs` testa o índice entregue, com a área de transferência simulada em memória. Confere as quinze cópias, os destinos, os arquivos completos, o fallback de cópia manual e larguras de 320 a 1920 pixels. Não abre links da Wikipédia nem captura imagens.

```sh
python3 scripts/build_beta219.py
node tests/beta219/cases.cjs
node tests/beta219/inherited.cjs
node tests/beta219/browser.cjs chrome
node tests/beta219/browser.cjs firefox
node tests/beta219/browser.cjs safari
python3 scripts/document_beta219.py
node tests/beta219/index_probe.cjs --browser=chrome
node tests/beta219/index_probe.cjs --browser=firefox
python3 scripts/package_beta219.py
```

Os testes de navegador usam Playwright para o Chrome, a conexão BiDi do Firefox e WebDriver no Safari. A variável `REVISAWIKI_PLAYWRIGHT` pode apontar para uma instalação local de Playwright. O Safari precisa permitir automação remota. A tentativa desta beta não conseguiu iniciar sua sessão e não executou testes do programa nesse navegador. Chrome e Firefox passaram.

O primeiro teste de desfazer verificava o texto antes de terminar a operação assíncrona. A execução anterior e a explicação da correção de espera foram preservadas em `tests/evidence/2.19.0-beta.1/history`. O programa não precisou de alteração.

Os comprovantes estão em `tests/evidence/2.19.0-beta.1`. A rodada da 2.19 final continua pausada. Os resultados históricos da 2.18 e da 2.19 não foram alterados ou usados como novos testes aprovados desta beta.
