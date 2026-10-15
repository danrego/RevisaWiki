# Testes da 2.7

As fontes são revisões públicas fixadas por identificador e SHA-256. Os cálculos e os testes de navegador usam cópias locais. Nenhum teste entra em uma conta, publica na Wikipédia, usa a área de transferência do sistema ou captura a tela.

## Reconstrução e motor

```sh
python3 scripts/build_v270.py
npm test
npm run test:complex
```

A reconstrução confere os sete arquivos da 2.6.2 e aplica os módulos de `src/v2_7`. Não modifica as versões anteriores. `npm test` confere os arquivos distribuídos, a instalação, os reparos de duplicação, a comparação e as suítes herdadas. `run_engine.cjs` copia as asserções anteriores para uma pasta temporária e troca somente o adaptador de carregamento e relatório.

`test_safe_automation.cjs` tem resultados esperados independentes para infocaixas, portais, DEFAULTSORT e referências nomeadas. Os controles incluem valores conflitantes, campos vazios finais, comentários, grupos, chamadas calculadas, notas e exemplos protegidos. Também há mutações do resultado para verificar que uma remoção autorizada não permite apagar o valor que deveria permanecer.

`test_diff_reporting.cjs` confere reconstrução exata, saldo UTF-8, limites de trabalho, fragmentos inseridos, linhas repetidas, campos indivisíveis e dependências entre chamadas de referência. As buscas indexadas são comparadas à seleção anterior dos mesmos campos. Entradas extensas e controles aleatórios exercitam a comparação, sem atribuir os resultados da 2.6.2 a esta execução.

`test_chat_permutations.cjs` acrescenta combinações sintéticas dos formatos reconhecidos, separadores, limites entre palavras e contextos protegidos nas duas distribuições. Esses casos são permutações de teste, não artigos.

`test_chat_residues.cjs` confere cercas externas completas e marcas exatas de exportação, com controles de exemplos, URLs, citações, nomes de modelos e formatos desconhecidos. `test_no_section_buttons.cjs` e a instalação conferem a retirada dos botões adicionais, a preservação dos links nativos e a inatividade de pedidos antigos de abertura.

Os testes de aspas e etiquetas continuam presentes. O caso fixado das temperaturas deve conservar as seis tabelas, os valores e os rótulos, com diferenças locais. Os controles de código realmente incompleto e exemplos literais permanecem.

## Artigos grandes

`fixtures/large_articles` contém 31 revisões de artigos com mais de 100 KB. O manifesto traz título, revisão, data, ligação permanente e os hashes do texto original e do arquivo gzip. `ATTRIBUTION.txt` informa a licença e o histórico das fontes. Nenhum texto foi alterado para preparar a amostra.

O runner exige os hashes dos dois manifestos, informados explicitamente:

```sh
node tests/v27/run_edited_corpus.cjs --self-test
node tests/v27/run_edited_corpus.cjs --final-pin=SHA256_DO_MANIFESTO_DA_VERSAO --corpus-pin=SHA256_DO_MANIFESTO_DAS_FONTES --run=final_001
```

Os hashes são calculados sobre `tests/expected_release_v270.json` e `tests/v27/fixtures/large_articles/manifest.json`. O teste recusa arquivos diferentes, congela os executáveis antes dos cálculos e confere as duas distribuições, a segunda aplicação, a composição das escolhas e inventários independentes de URLs, imagens, identificadores, trechos protegidos e dados de tabelas. Diagnósticos com o texto completo ficam fora do conjunto publicado.

`npm run test:complex` acrescenta a matriz anterior de 16 artigos grandes e oito variantes por artigo. Os resultados dessa execução ficam separados dos 31 artigos adicionais.

## Navegadores e instalação

Com Chrome, Firefox e Safari instalados no macOS, execute um navegador por vez:

```sh
node tests/v27/browser/run_release.cjs Chrome dist/2.7.0
node tests/v27/browser/run_release.cjs Firefox dist/2.7.0
node tests/v27/browser/run_release.cjs Safari dist/2.7.0
```

O harness usa perfis e sessões próprios. A política de conteúdo bloqueia conexões externas, as respostas da API são locais e qualquer tentativa de publicação é recusada. Ele confere carregamento, Worker, resultado, comparação, rejeição de escolhas, resumo e desfazer, incluindo fontes integrais, as quatro famílias novas e os resíduos de cópia. Nas páginas de leitura, confere que os atalhos adicionais não são criados e que os links nativos permanecem. O agregador soma somente execuções com os mesmos hashes finais e verifica os resultados entre navegadores.

As verificações do ResourceLoader usam o mesmo perfil Peast ES2019 da instalação anterior. `run_server_grammar.mjs` aceita um runtime PHP local por `REVISAWIKI_PHP_MODULES` e a biblioteca por `REVISAWIKI_PEAST`. As dependências não são baixadas por esse teste. O núcleo completo para download ultrapassa o limite de uma página da Wikipédia e não substitui a instalação modular.

O teste do índice verifica conteúdo completo, destinos, resumos, hashes, downloads e a cópia com substituto local para a área de transferência. Os comandos de documentação e privacidade estão no `package.json`.

Tempos de execução são medições locais, sujeitos à carga da máquina. Os testes não demonstram todas as combinações de extensões, editores e wikitexto em produção.
