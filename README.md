# RevisaWiki

Script para revisar o código-fonte da Wikipédia em português. Os ajustes ficam no rascunho, com opção de desfazer. A comparação usa Mostrar alterações do editor.

## Versão 2.19

- Marca como edição menor os ajustes feitos exclusivamente pelo programa em artigos completos, respeitando a escolha manual.
- Oferece uma [demonstração interativa](dist/2.19.0/Demonstracao_RevisaWiki_v2_19_0.html) com exemplos e comparação do resultado.
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

[Pacote completo](dist/2.19.0/RevisaWiki_2.19.0.zip) · [Índice para copiar](dist/2.19.0/INICIO.html) · [Instruções](docs/2.19.0/Instalacao_RevisaWiki_v2_19_0.txt) · [Manual](docs/2.19.0/Documentacao_RevisaWiki_v2_19_0.wiki) · [Histórico resumido](docs/2.19.0/Notas_da_versao_RevisaWiki_v2_19_0.txt) · [Testes](docs/2.19.0/Relatorio_testes_RevisaWiki_v2_19_0.txt)

Atualize dados, núcleo, carregador central e documentação, nessa ordem. Quem já usa a chamada fixa mantém o common.js como está. O arquivo completo excede o limite de uma página da Wikipédia, por isso a instalação separa dados e núcleo.

O índice permite copiar o arquivo inteiro, o destino e o resumo, com um link direto para o editor. Ele não salva páginas. O HTML pode ser aberto localmente, mas o GitHub mostra seu código, sem executar o índice.

O aviso que cita o máximo de 102400 bytes pertence ao realce de sintaxe da página. Nesse caso, o visualizador mostra o código sem cores. Esse limite de exibição não impede salvar nem executar JavaScript. O índice oferece um link para conferir o arquivo bruto. Erros de sintaxe ou recusas de publicação exigem uma verificação separada.

A análise em processamento separado tem limite de 60 segundos, que pode ser atingido em textos complexos menores que o caso extremo de aproximadamente 1,9 MB registrado nos testes. Ao atingir esse prazo, o programa mantém o rascunho, o resumo e a marcação de edição menor anteriores. As verificações de preservação continuam ativas, e a edição pode prosseguir normalmente. O relatório distingue esses timeouts das comparações que terminaram.

## Código e verificações

A reconstrução parte dos sete arquivos da distribuição 2.18.0, conferidos por SHA-256, e aplica os módulos de `src/v2_19`. As versões arquivadas ficam intactas.

Para reconstruir o código e executar os testes, use Python 3, Node.js 24 ou superior e npm 10 ou superior. Na pasta do repositório:

```sh
npm ci
python3 scripts/build_v2190.py
npm test
npm run test:documentation -- --output artifacts/documentation/audit_v2190.json
npm run test:privacy
```

O [guia dos testes](tests/v219/README.md) distingue os casos dirigidos, a matriz dos catálogos, as revisões reais, o histórico e os testes de navegador. Os [resultados da versão](docs/2.19.0/Relatorio_testes_RevisaWiki_v2_19_0.txt) trazem as contagens concluídas, os hashes executados e os limites de cada prova. Artigos distintos, situações sintéticas, execuções repetidas e verificações têm denominadores próprios. Nenhum teste salva edições na Wikipédia.

Os resultados públicos trazem totais, hashes e resumos dos testes. As capturas completas, os perfis de navegador e os arquivos temporários ficam locais. A matriz das regras inclui exemplos fictícios e trechos públicos de provas nativas, com a revisão de origem indicada. As contagens de navegador vêm das execuções registradas.

## Referências de versões anteriores

A recuperação de modelos de referência da 2.8.2 continua limitada aos casos previamente verificados no catálogo. Dos 154 examinados, 132 receberam correspondência confirmada, com 101 `Citar web`, 29 `Citar jornal` e dois `Citar revista`. Foram recuperadas 103 URLs comprovadas, e 22 chamadas permaneceram como `Citation`. Cada correção exige correspondência com o artigo e a referência registrados. Uma chamada genérica legítima fora desses casos permanece como está.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

O código próprio do RevisaWiki usa [CC BY-SA 4.0](LICENSE). Os arquivos de terceiros conservam suas licenças. Os [casos de referência do MediaWiki](tests/v2150/reader_official_contracts.json) mantêm a indicação GPL-2.0-or-later e a origem registrada no próprio arquivo. As fontes e revisões dos scripts consultados ficam no cabeçalho e no manual.

