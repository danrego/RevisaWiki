# RevisaWiki

Script para revisar o código-fonte da Wikipédia em português. Os ajustes ficam no rascunho, com opção de desfazer. A comparação usa Mostrar alterações do editor.

## Versão 2.20

- Corrige parâmetros e separadores de citações nos contextos nativos conferidos.
- Confere a função de cada campo antes de corrigir sites, imagens e outros dados de infocaixas.
- Acrescenta portais a partir de evidências explícitas e mantém sem alteração os campos sem equivalência confirmada.
- Corrige casos delimitados de tabelas, ligações e espaçamento, com testes da ação completa e de entradas que precisam permanecer intactas.
- Protege notas que atravessam atributos HTML ou outros limites incertos.
- Mantém o prazo de 60 segundos, o rascunho integral e as verificações de preservação.

[Índice para copiar e colar](dist/2.20.0/INICIO.html) · [Pacote ZIP](dist/2.20.0/RevisaWiki_2.20.0.zip) · [Manual](docs/2.20.0/Documentacao_RevisaWiki_v2_20_0.wiki) · [Instalação](docs/2.20.0/Instalacao_RevisaWiki_v2_20_0.txt) · [Funcionalidades e limites](docs/2.20.0/Funcionalidades_RevisaWiki_2_20.md) · [Testes](docs/2.20.0/Relatorio_testes_RevisaWiki_v2_20_0.txt)

As 52 decisões foram analisadas. Há 49 frentes de automação, contratos ou verificações de preservação. Os três estudos de migração de `center`, `font` e `big` não foram ativados, pois as contraprovas de CSS mostraram diferenças de apresentação.

## Correção anterior 2.19.1

Corrige o erro "cyclic object value" ao clicar em Ajustar código. A interface passa a guardar um identificador do editor, sem converter o objeto do editor em JSON. As regras aplicadas ao artigo, a conferência de preservação e o prazo de 60 segundos permanecem iguais.

[Índice para copiar e colar](dist/2.19.1/INICIO.html) · [Pacote ZIP](dist/2.19.1/RevisaWiki_2.19.1.zip) · [Manual](docs/2.19.1/Documentacao_RevisaWiki_v2_19_1.wiki) · [Instalação](docs/2.19.1/Instalacao_RevisaWiki_v2_19_1.txt) · [Testes da correção](docs/2.19.1/Relatorio_testes_RevisaWiki_v2_19_1.txt)

Atualize dados, programa, carregador central e documentação pelo índice desta versão. A chamada fixa do common.js continua igual. Depois de atualizar, recarregue sem cache.

Para reconstruir e conferir esta correção, execute `python3 scripts/build_v2191.py` e `npm run test:hotfix`. A reconstrução parte dos arquivos imutáveis da 2.19.0 e confere que as únicas mudanças no programa são a identificação do editor e a versão. Os resultados amplos da 2.19.0 abaixo continuam como histórico, sem serem contados como uma nova execução nesta correção.

## Recursos da versão 2.19

- Marca como edição menor os ajustes feitos exclusivamente pelo programa em artigos completos, respeitando a escolha manual.
- Oferece uma [demonstração interativa](dist/2.20.0/Demonstracao_RevisaWiki_v2_20_0.html) com exemplos e comparação do resultado.
- Confere as regras pelo resultado da ação completa, incluindo opções desligadas, exemplos protegidos e entradas semelhantes que precisam ficar intactas.
- Corrige bloqueios entre a leitura do texto, as etapas de ajuste e as provas de preservação.
- Reorganiza títulos redundantes de notas e referências, mantendo grupos, listas, definições e a posição das citações.
- Conserva nomes e campos já aceitos pela ptwiki, sem trocar uma grafia válida só por preferência.
- Usa o contexto da página inteira quando uma parte incompleta limita os reparos ao começo do texto.
- Vincula consultas, escolhas do relatório e restauração ao rascunho de origem.
- Calcula a contagem de textos grandes numa etapa própria e permite desfazer sem repetir a análise.

A comparação com os três programas de referência distingue ajustes automáticos, comandos, recursos de interface e substituições que não devem ser reproduzidas. Cada regra tem uma disposição no registro técnico. Uma leitura do código ou um teste de um auxiliar não é contado como uma correção completa aplicada a um artigo.

Os adaptadores atendem ao editor clássico, às integrações reconhecidas de CodeMirror e ao modo de código-fonte do editor de 2017. O fluxo visual, a integração com wikEd e a abertura em lote por categorias ou afluentes ficam fora do RevisaWiki. A publicação continua sob controle de quem edita.

## Instalação

[Pacote completo](dist/2.20.0/RevisaWiki_2.20.0.zip) · [Índice para copiar](dist/2.20.0/INICIO.html) · [Instruções](docs/2.20.0/Instalacao_RevisaWiki_v2_20_0.txt) · [Manual](docs/2.20.0/Documentacao_RevisaWiki_v2_20_0.wiki) · [Histórico resumido](docs/2.20.0/Notas_da_versao_RevisaWiki_v2_20_0.txt) · [Testes](docs/2.20.0/Relatorio_testes_RevisaWiki_v2_20_0.txt)

Atualize dados, núcleo, carregador central e documentação, nessa ordem. Quem já usa a chamada fixa mantém o common.js como está. O arquivo completo excede o limite de uma página da Wikipédia, por isso a instalação separa dados e núcleo.

O índice permite copiar o arquivo inteiro, o destino e o resumo, com um link direto para o editor. Ele não salva páginas. O HTML pode ser aberto localmente, mas o GitHub mostra seu código, sem executar o índice.

O aviso que cita o máximo de 102400 bytes pertence ao realce de sintaxe da página. Nesse caso, o visualizador mostra o código sem cores. Esse limite de exibição não impede salvar nem executar JavaScript. O índice oferece um link para conferir o arquivo bruto. Erros de sintaxe ou recusas de publicação exigem uma verificação separada.

A análise em processamento separado tem limite de 60 segundos, que pode ser atingido em textos complexos menores que o caso extremo de aproximadamente 1,9 MB registrado nos testes. Ao atingir esse prazo, o programa mantém o rascunho, o resumo e a marcação de edição menor anteriores. As verificações de preservação continuam ativas, e a edição pode prosseguir normalmente. O relatório distingue esses timeouts das comparações que terminaram.

## Código e verificações

A reconstrução da 2.20 parte dos sete arquivos imutáveis da 2.19.1, conferidos por SHA-256, e aplica os fragmentos de `src/v2_20`. A compactação do núcleo retira espaços e conserva a árvore sintática, os tokens, os comentários e os valores literais. As distribuições anteriores ficam intactas.

Para reconstruir o código e executar os testes, use Python 3, Node.js 24 ou superior e npm 10 ou superior. Na pasta do repositório:

```sh
npm ci
python3 scripts/build_v2200.py
python3 scripts/export_catalogs_v2200.py
npm test
npm run test:privacy
```

O [guia dos testes](tests/v220/README.md) distingue os casos dirigidos, a matriz dos catálogos, as revisões reais, o histórico e os testes de navegador. Os [resultados da versão](docs/2.20.0/Relatorio_testes_RevisaWiki_v2_20_0.txt) trazem as contagens concluídas, os hashes executados e os limites de cada prova. Artigos distintos, situações sintéticas, execuções repetidas e verificações têm denominadores próprios. Nenhum teste salva edições na Wikipédia.

Os resultados públicos trazem totais, hashes e resumos dos testes. As capturas completas, os perfis de navegador e os arquivos temporários ficam locais. A matriz das regras inclui exemplos fictícios e trechos públicos de provas nativas, com a revisão de origem indicada. As contagens de navegador vêm das execuções registradas.

Os oito arquivos `Catalogo_*.json` conservam os dados, as datas e as revisões dos instantâneos herdados. A exportação acrescenta a origem e o hash do núcleo desta distribuição. Ela não consulta novamente as predefinições nem substitui as condições adicionais dos reparos em `src/v2_20`.

## Referências de versões anteriores

A recuperação de modelos de referência da 2.8.2 continua limitada aos casos previamente verificados no catálogo. Dos 154 examinados, 132 receberam correspondência confirmada, com 101 `Citar web`, 29 `Citar jornal` e dois `Citar revista`. Foram recuperadas 103 URLs comprovadas, e 22 chamadas permaneceram como `Citation`. Cada correção exige correspondência com o artigo e a referência registrados. Uma chamada genérica legítima fora desses casos permanece como está.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

O código próprio do RevisaWiki usa [CC BY-SA 4.0](LICENSE). Os arquivos de terceiros conservam suas licenças. Os [casos de referência do MediaWiki](tests/v2150/reader_official_contracts.json) mantêm a indicação GPL-2.0-or-later e a origem registrada no próprio arquivo. As fontes e revisões dos scripts consultados ficam no cabeçalho e no manual.

