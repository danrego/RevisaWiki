# Testes do RevisaWiki 2.6.0

Os testes usam cópias locais de revisões públicas. Os arquivos de origem têm título, revisão e SHA-256. Nenhum teste salva edições na Wikipédia.

## Rodada local

```sh
npm test
npm run test:engine
npm run test:complex
npm run test:regression
python3 tests/privacy/test_publication_privacy_gate.py
```

`npm test` confere os hashes distribuídos e executa os contratos atuais, os casos de controle das versões anteriores e a preservação de galerias. Os dois arquivos executáveis, núcleo com dados separados e distribuição completa, devem produzir o mesmo resultado.

`test:engine` confere as correções automáticas herdadas da 2.5 e preservadas na 2.6, incluindo referências, sintaxe, opções desativadas e cache. `test:complex` usa os casos grandes de física e matemática guardados em `tests/v26_engine`. As mutações têm resultados definidos antes da execução. `test:regression` executa as doze suítes herdadas com os ajustes de expectativas documentados em `tests/v25_inherited`, pelo carregador `tests/v26_inherited.cjs`.

Para a rodada de 2.000 revisões, siga a obtenção das fontes em [corpus](corpus/README.txt) e execute os programas de [corpus_v26](corpus_v26/README.md). Os resultados dessa rodada não são uma contagem de testes de interface. Os casos gerados de parâmetros e grafia também têm suas contagens separadas.

`npm run test:additions` confere as novas ligações, grafias, citações abreviadas, portais, escolhas de colunas e limites da edição rápida. Os testes da edição de seção e dos carregadores ficam em `tests/inline_v26`, com os comandos e os requisitos dos navegadores no README próprio.

Os testes de navegador usam páginas locais, os navegadores reais no Mac, respostas controladas da API e interceptação da publicação. Eles conferem os editores, o processamento separado, a alternativa sem Worker, a comparação, o resumo, o cancelamento e o desfazer. Capturas de tela não fazem parte do pacote.

## Evidência e limites

Os relatórios da distribuição ficam em `tests/evidence/2.6.0`. Cada grupo indica a versão e os hashes executados. Resultados de candidatos interrompidos ficam separados da rodada final e não contam como aprovação da distribuição.

As expectativas alteradas têm uma explicação e uma conferência própria. O caso de Pillay, por exemplo, passa a esperar a retirada de uma única chamada consecutiva repetida, com todos os demais bytes preservados. Uma fonte sem acesso ou um teste incompleto não é registrado como aprovado.

Os relatórios das versões anteriores permanecem nos seus diretórios. As regras novas não dispensam a revisão editorial do artigo nem a pré-visualização antes de salvar.
