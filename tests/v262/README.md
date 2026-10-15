# Testes da 2.6.2

As fontes são cópias locais de revisões públicas. Os testes não entram em uma conta, não publicam na Wikipédia e não usam a área de transferência do sistema.

## Motor e instalação

```sh
python3 scripts/build_v262.py
npm test
npm run test:complex
node tests/v262/run_tag_adversarial.cjs
```

O primeiro comando reconstrói os arquivos a partir dos hashes da 2.6.1-hotfix.1 e do módulo em `src/v2_6_2`. Não modifica as distribuições anteriores. `npm test` confere os arquivos finais, a instalação, os casos pontuais de referências e aspas e as cinco suítes herdadas do motor. `run_engine.cjs` copia as asserções anteriores para uma pasta temporária e troca somente o adaptador que carrega a versão testada.

`run_quote_boundaries.cjs` confere aspas em referências completas, nomes e grupos, `dir` e `follow`, rótulos de ligações externas e atributos de tabelas. Os controles incluem estruturas realmente incompletas e exemplos literais de código malformado. As comparações de comportamento já existente ficam identificadas no próprio relatório e não contam como correções novas. A migração de algumas predefinições completas dentro de citações literais já existia antes desta versão e não foi ampliada por este reparo de sintaxe.

O artigo em `fixtures/city_temperature` conserva a revisão e os bytes que reproduzem a falha. O teste exige a análise completa, a aplicação das regras de manutenção já existentes, a preservação de 487 linhas numéricas, 974 linhas de rótulos e seis tabelas. As aspas do original também ficam intactas. A fonte tem link permanente e SHA-256 no manifesto próprio.

`test_quotes.cjs` acrescenta exemplos de código entre aspas, referências de várias linhas, aspas externas com citações ou ligações dentro delas e o controle de muitas aspas sem par. O reconhecimento de células exige uma tabela completa e preserva os casos com continuação em outra linha. Linhas de parâmetros dentro de predefinições não recebem esse tratamento. `run_tag_adversarial.cjs` executa sem mudanças as asserções anteriores de etiquetas e aspas, registrando os hashes do adaptador, do teste original e da distribuição atual.

`test:complex` usa 16 artigos de pelo menos 100 KB e oito variantes por artigo, com cálculos nas duas distribuições, segunda aplicação e conferência de preservação. Os nomes das fontes não substituem a definição dos resultados esperados em cada teste.

Os tempos do relatório são medições locais. A carga da máquina não fica isolada, e eles não estabelecem um limite de desempenho para todo wikitexto possível.

## Navegadores

Com Playwright e Chrome, Firefox e Safari instalados no macOS, execute um navegador de cada vez:

```sh
node tests/v262/browser/run_patch.cjs Chrome dist/2.6.2
node tests/v262/browser/run_patch.cjs Firefox dist/2.6.2
node tests/v262/browser/run_patch.cjs Safari dist/2.6.2
```

Use `REVISAWIKI_PLAYWRIGHT` se o módulo estiver fora do caminho habitual. Para Safari, a automação remota precisa estar ativada. O teste fecha somente a sessão que criou.

As páginas locais conferem os dois caminhos da chamada fixa, carregamento dos dados, botão Ajustar código, processamento em Worker e desfazer. O artigo integral das temperaturas passa pelo editor simulado e deve voltar ao hash original ao desfazer. A API simulada recusa publicações, a política de conteúdo bloqueia conexões externas e os testes não capturam imagens da tela.

## Sintaxe aceita no carregamento

O verificador PHP usa Peast 1.18.0, revisão `9c211ef67a0cf7511f864b6d390fe5939a837d05`, com o perfil ES2019 do ResourceLoader:

```sh
php tests/v262/check_server_grammar.php dist/2.6.2 /caminho/para/peast
```

Também há `run_server_grammar.mjs` para uma instalação local de `@php-wasm/universal` e `@php-wasm/node-8-3`, versão 3.1.58. Defina `REVISAWIKI_PEAST` para a pasta Peast e `REVISAWIKI_PHP_MODULES` para a pasta que contém os módulos instalados. A biblioteca e o runtime ficam fora do pacote público. Nenhuma dependência é baixada por esse teste.

Os atributos de referência consultados estão na [ajuda oficial do Cite, revisão 8650623](https://www.mediawiki.org/w/index.php?oldid=8650623). O reconhecimento dos limites não muda esses atributos nem amplia as regras de reescrita de referências.

## Documentação, índice e privacidade

Depois de fechar os relatórios desta execução:

```sh
python3 scripts/package_v262.py
npm run test:documentation
node tests/v262/test_index.cjs
npm run test:privacy
```

O índice é testado com uma área de transferência em memória e com a alternativa de cópia manual. Os botões de conteúdo, resumo, destino e abertura do editor são conferidos sem abrir a Wikipédia. O pacote final e seus arquivos internos passam pelo verificador de privacidade antes da publicação. Os relatórios atuais ficam em `tests/evidence/2.6.2`. Os resultados anteriores permanecem nos seus diretórios e não são somados como novas execuções.
