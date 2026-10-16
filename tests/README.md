# Testes do RevisaWiki

Os testes usam cópias locais de revisões públicas. Os arquivos de origem têm título, revisão e SHA-256. Nenhum teste salva edições na Wikipédia. Os comandos atuais executam a versão 2.8.3. O [guia da versão](v283/README.md) explica os testes de categorias, citações, infocaixas, instalação, navegadores e cópia.

## Rodada local

```sh
npm test
npm run test:engine
npm run test:complex
npm run test:regression
npm run test:birth-categories
npm run test:birth-category-render
python3 tests/privacy/test_publication_privacy_gate.py
```

`npm test` confere os hashes distribuídos e executa a instalação, os casos específicos da correção e as cinco suítes herdadas do motor. Os dois arquivos executáveis, núcleo com dados separados e distribuição completa, devem produzir o mesmo resultado. As suítes anteriores ficam intactas. As adaptações de caminhos e expectativas continuam registradas, incluindo a correção de referências de NBC News da 2.8.2.

`test:engine` e `test:regression` conferem referências, sintaxe, opções desativadas, composição das regras e fontes preservadas em `v26_engine`. `test:complex` usa 16 artigos de pelo menos 100 KB, com oito variantes por artigo. As mutações têm resultados definidos antes da execução. As doze suítes das versões anteriores continuam disponíveis por `tests/v26_inherited.cjs`, com os ajustes de expectativas documentados em `tests/v25_inherited`.

Para reproduzir a rodada histórica de 2.000 revisões da 2.6.0, siga a obtenção das fontes em [corpus](corpus/README.txt) e execute os programas de [corpus_v26](corpus_v26/README.md). Esse resultado permanece no diretório da versão que foi executada e não comprova uma nova rodada da 2.8.3. Os testes de interface e os casos gerados de parâmetros e grafia também têm contagens separadas.

`npm run test:additions` confere as regras de referências, tabelas, infocaixas, datas, casamentos e categorias, com controles de falsos positivos. A suíte de citações usa um leitor independente para comparar os tipos e os dados das fontes, incluindo seis revisões completas de NBC News. A suíte histórica confere separadamente a origem de cada reparo, as URLs recuperadas e os casos que precisam permanecer intactos. A prova de renderização das referências mantém a evidência anônima capturada na 2.8.2, sem tratá-la como uma nova consulta desta versão.

`npm run test:birth-categories` usa respostas controladas para conferir o vínculo entre o texto, a infocaixa e a comprovação da categoria. Cobre provas ausentes ou vencidas, mudanças de página e revisão, chaves próprias, `DEFAULTSORT`, `si`, `nocat=0`, exemplos protegidos e outros casos que precisam permanecer intactos. As seis biografias reais têm as duas revisões completas em `corpus_v283`, sem nomes de contas editoriais.

`npm run test:birth-category-render` confere os arquivos finais contra respostas de consultas anônimas GET à ptwiki. As respostas mostram a renderização nativa das infocaixas das seis biografias, com e sem a categoria explícita, para comparar as categorias e suas chaves. O comando verifica os dados guardados e seus hashes, sem novas consultas ou edições.

Os testes de navegador desta versão ficam em `v283/browser`. Os testes mais amplos da edição rápida anterior continuam em `inline_v26`, com os comandos e os requisitos dos navegadores no README próprio.

Os testes de navegador usam páginas locais, os navegadores reais no Mac, respostas controladas da API e interceptação da publicação. Eles conferem os editores, o processamento separado, a alternativa sem Worker, a comparação, o resumo, o cancelamento e o desfazer. Capturas de tela não fazem parte do pacote.

## Evidência e limites

Os relatórios atuais ficam em `tests/evidence/2.8.3`. Os da 2.8.2, da 2.6.0 e das demais versões permanecem em seus diretórios. Cada grupo indica a versão e os hashes executados. Resultados de candidatos interrompidos ficam separados da rodada final e não contam como aprovação da distribuição.

As expectativas alteradas têm uma explicação e uma conferência própria. O caso de Pillay, por exemplo, passa a esperar a retirada de uma única chamada consecutiva repetida, com todos os demais bytes preservados. Uma fonte sem acesso ou um teste incompleto não é registrado como aprovado.

Os relatórios das versões anteriores permanecem nos seus diretórios. As regras novas não dispensam a revisão editorial do artigo nem a pré-visualização antes de salvar.
