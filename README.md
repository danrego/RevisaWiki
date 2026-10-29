# RevisaWiki

O RevisaWiki reúne correções de referências, infocaixas, tabelas e sintaxe no botão **Ajustar código**, no editor de código-fonte da Wikipédia em português. As mudanças ficam no rascunho, com opção de desfazer. Use **Mostrar alterações** e a pré-visualização para conferir o resultado antes de publicar.

## Versão 2.21.2

O painel mantém **Opções de ajuste** junto dos controles de revisão e retira os menus Mais ferramentas e Configurações. O resumo padrão passa a ser **Minúcias**, com marcação automática de edição menor quando os ajustes são aplicados, respeitando a opção desligada e as escolhas manuais.

- Amplia reparos delimitados em referências, parâmetros bibliográficos, marcas importadas e campos de infocaixas.
- Acrescenta portais a assuntos confirmados por caixas nativas ou esboços e categorias concordantes, com confirmação dos destinos.
- Conserva os valores de fontes e identificadores, e a ligação entre as chamadas e suas referências.
- Mantém oito itens principais como mínimo para duas colunas nas listas finais e dez referências nas regras correspondentes.
- Dos 76 itens analisados, 63 têm automação ativada dentro dos limites publicados. Os outros 13 permanecem condicionais, sem correções presumidas.

[Índice para copiar e colar](dist/2.21.2/INDICE.md) · [Pacote ZIP](dist/2.21.2/RevisaWiki_2.21.2.zip) · [Manual](docs/2.21.2/Documentacao_RevisaWiki_v2_21_2.wiki) · [Instalação](docs/2.21.2/Instalacao_RevisaWiki_v2_21_2.txt)

O arquivo de dados continua protegido contra mudanças durante o salvamento na Wikipédia. O pacote exige o teste de pré-salvamento dos arquivos finais. A chamada fixa do common.js permanece igual.

## Instalação

Para usar a distribuição compartilhada, acrescente uma vez a chamada fixa do índice ao seu common.js. Se já a usa, mantenha esse bloco e recarregue sem cache depois da atualização.

Quem mantém a distribuição atualiza **dados, programa, carregador central e documentação**, nessa ordem, pelos arquivos completos do índice. As partes precisam corresponder à mesma versão.

Dados e programa são separados para respeitar o limite de tamanho de cada página. O arquivo `RevisaWiki_v2_21_2_completo.js` excede esse limite e serve para uso local e testes. Não instale a distribuição compartilhada e uma cópia própria ao mesmo tempo.

A instalação na Wikipédia permanece manual. O RevisaWiki não publica páginas. Se a análise atingir 60 segundos, o rascunho, o resumo e os controles anteriores são preservados, e a edição pode continuar.

## Demonstração

[Baixe a demonstração](dist/2.21.2/Demonstracao_RevisaWiki_v2_21_2.html) e abra o arquivo no navegador. O GitHub mostra o código de arquivos HTML. A demonstração funciona offline, usa o mesmo motor distribuído e apresenta 109 exemplos fictícios, incluindo situações que precisam permanecer intactas. Consultas externas não são simuladas como fatos sobre artigos reais.

## Código e testes

A reconstrução parte dos sete arquivos imutáveis da revisão de instalação anterior e dos módulos de `src/v2_21_2`. O catálogo anterior é preservado, com os novos mapas estáticos separados em Dados.js para manter cada página instalável abaixo do limite.

Com Python 3, Node.js 24 ou superior e npm 10 ou superior:

```sh
npm ci
npm run build
npm test
npm run test:legacy:2212
npm run test:presave
npm run build:index
npm run test:documentation
npm run test:privacy
```

`npm test` repete os contratos sintéticos atuais nos dois arquivos distribuídos, os valores dos mapas, os controles de empacotamento e a demonstração. A regressão herdada fica em `test:legacy:2212`. Os testes antigos e seus resultados permanecem nos diretórios de cada versão, com os estados originais.

O [relatório da versão](tests/evidence/2.21.2/QA_SUMMARY.json) separa fontes reais congeladas, controles sintéticos, testes da interface, limites e exemplos da demonstração. O [quadro dos 76 itens](tests/v2212/coverage_all.json) informa o que cada automação pode corrigir e o que ficou inativo.

`test:presave` consulta a transformação pré-salvamento pela API em modo de leitura, sem autenticação nem edições. A montagem recusa uma resposta alterada, uma falha de acesso ou um comprovante de outros arquivos. Os dados e o programa precisam pertencer ao mesmo pacote.

Nenhum teste publica edições na Wikipédia. Os testes de navegador usam o programa real em páginas locais, com editores e respostas de consultas fictícios. A campanha de revisões reais usa fontes congeladas e mantém recusas, erros e timeouts separados dos resultados aceitos. Os 60 segundos e a preservação do rascunho continuam obrigatórios.

## Versões anteriores

- [2.21.1: instalação corrigida](dist/2.21.1-installation.1/INDICE.md): proteção permanente dos dados no pré-salvamento.
- [2.21.1](docs/2.21.1/Notas_da_versao_RevisaWiki_v2_21_1.txt): mínimo de oito itens nas listas finais.

- [2.21.0](docs/2.21.0/Notas_da_versao_RevisaWiki_v2_21_0.txt): campos de infocaixas, referências e sintaxe.
- [2.20.0](docs/2.20.0/Notas_da_versao_RevisaWiki_v2_20_0.txt): parâmetros, infocaixas, referências, portais e fronteiras de preservação.
- [2.19.1](docs/2.19.1/Notas_da_versao_RevisaWiki_v2_19_1.txt): correção da identificação do editor e do erro de objeto cíclico.
- [Histórico completo](docs/2.21.2/Documentacao_RevisaWiki_v2_21_2.wiki): notas das versões em ordem da mais recente para a mais antiga.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Fontes completas da campanha, perfis de navegador, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. Os resultados públicos trazem totais, hashes e limites das provas.

O código próprio usa [CC BY-SA 4.0](LICENSE). Materiais de terceiros conservam suas licenças e as revisões de origem registradas no repositório. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.
