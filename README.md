# RevisaWiki

O RevisaWiki reúne correções de referências, infocaixas, tabelas e sintaxe no botão **Ajustar código**, no editor de código-fonte da Wikipédia em português. As mudanças ficam no rascunho, com opção de desfazer. Use **Mostrar alterações** e a pré-visualização para conferir o resultado antes de publicar.

## Versão 2.21.4

Quando a primeira combinação de ajustes não passa pelas verificações, a atualização tenta aproveitar correções de outros grupos. A interface mostra somente o resultado que foi aplicado.

- A tentativa de recuperação sempre começa no rascunho original, com opções apenas mais restritivas e uma nova prova de preservação.
- Referências, nomes literais nos campos de identidade previstos e conteúdo literal de células em posições correspondentes têm verificações independentes das opções dos escritores.
- O painel mostra os ajustes aplicados, a quantidade e a diferença em bytes, com **Desfazer** e o atalho do editor para **Mostrar alterações**.
- Avisos de revisão, sugestões, motivos de recusa e chamadas a um relatório foram retirados do fluxo automático.
- O limite compartilhado de 60 segundos continua valendo quando uma execução precisa isolar um grupo de correções.

O resumo padrão continua **Minúcias**, com marcação de edição menor quando os ajustes são aplicados, respeitando as escolhas manuais. O painel mantém **Opções de ajuste**, **Mostrar alterações** e **Desfazer**.

[Índice para copiar e colar](dist/2.21.4/INDICE.md) · [Pacote ZIP](dist/2.21.4/RevisaWiki_2.21.4.zip) · [Manual](docs/2.21.4/Documentacao_RevisaWiki_v2_21_4.wiki) · [Instalação](docs/2.21.4/Instalacao_RevisaWiki_v2_21_4.txt)

O arquivo de dados continua protegido contra mudanças durante o salvamento na Wikipédia. O pacote exige o teste de pré-salvamento dos arquivos finais. A chamada fixa do common.js permanece igual.

## Instalação

Para usar a distribuição compartilhada, acrescente uma vez a chamada fixa do índice ao seu common.js. Se já a usa, mantenha esse bloco e recarregue sem cache depois da atualização.

Quem mantém a distribuição atualiza **dados, programa, carregador central e documentação**, nessa ordem, pelos arquivos completos do índice. As partes precisam corresponder à mesma versão.

Dados e programa são separados para respeitar o limite de tamanho de cada página. O arquivo `RevisaWiki_v2_21_4_completo.js` excede esse limite e serve para uso local e testes. Não instale a distribuição compartilhada e uma cópia própria ao mesmo tempo.

A instalação na Wikipédia permanece manual. O RevisaWiki não publica páginas. Se a análise atingir 60 segundos, o rascunho, o resumo e os controles anteriores são preservados, e a edição pode continuar.

## Demonstração

[Baixe a demonstração](dist/2.21.4/Demonstracao_RevisaWiki_v2_21_4.html) e abra o arquivo no navegador. O GitHub mostra o código de arquivos HTML. A demonstração funciona offline, usa o mesmo motor distribuído e apresenta 109 exemplos fictícios, incluindo situações que precisam permanecer intactas. Consultas externas não são simuladas como fatos sobre artigos reais.

## Código e testes

A reconstrução parte dos sete arquivos imutáveis da 2.21.3 e dos módulos de `src/v2_21_4`. O catálogo e os contratos nativos anteriores permanecem no pacote. O construtor substitui trechos identificados da sintaxe e remove apenas funções antigas de interface sem consumidores restantes.

Com Python 3, Node.js 24 ou superior e npm 10 ou superior:

```sh
npm ci
npm run build
npm test
npm run test:legacy:2214
npm run test:presave:receipt
npm run build:index
npm run test:documentation
npm run test:privacy
```

`npm test` executa oito grupos nos dois arquivos distribuídos, totalizando 16 execuções de grupo, e roda uma vez o contrato da interface carregado da fonte. `test:biography` repete sete grupos herdados nas duas distribuições, totalizando 14 execuções. Os contratos anteriores de referências, tabelas e fontes ficam em `test:legacy:2214`. Esses números são execuções de grupos, não quantidades de artigos ou de casos únicos. A pré-gravação e o pacote têm testes próprios. Os arquivos e resultados antigos mantêm seus estados originais.

O [relatório da versão](tests/evidence/2.21.4/QA_SUMMARY.json) separa fontes reais congeladas, controles sintéticos, testes da interface, limites e exemplos da demonstração. O [quadro dos 76 itens](tests/v2212/coverage_all.json) conserva o registro da 2.21.2, com os limites de suas automações. Os comprovantes novos identificam o pacote atual e não reclassificam resultados históricos.

`test:presave:receipt` confere o comprovante já incluído. Uma nova consulta usa `scripts/check_wiki_presave_v2214.py` com um caminho de recibo ainda inexistente; a API é consultada em modo de leitura, sem autenticação nem edições. A montagem recusa uma resposta alterada, uma falha de acesso ou um comprovante de outros arquivos. Os dados e o programa precisam pertencer ao mesmo pacote.

Nenhum teste publica edições na Wikipédia. Os testes de navegador usam o programa real em páginas locais, com editores e respostas de consultas fictícios. A campanha de revisões reais usa fontes congeladas e mantém recusas, erros e timeouts separados dos resultados aceitos. Os 60 segundos e a preservação do rascunho continuam obrigatórios.

## Versões anteriores

- [2.21.3](dist/2.21.3/INDICE.md): campos atuais de biografias, infocaixas incorporadas e prioridades de parâmetros.
- [2.21.2](dist/2.21.2/INDICE.md): referências, portais, campos de infocaixas e simplificação do painel.

- [2.21.1: instalação corrigida](dist/2.21.1-installation.1/INDICE.md): proteção permanente dos dados no pré-salvamento.
- [2.21.1](docs/2.21.1/Notas_da_versao_RevisaWiki_v2_21_1.txt): mínimo de oito itens nas listas finais.

- [2.21.0](docs/2.21.0/Notas_da_versao_RevisaWiki_v2_21_0.txt): campos de infocaixas, referências e sintaxe.
- [2.20.0](docs/2.20.0/Notas_da_versao_RevisaWiki_v2_20_0.txt): parâmetros, infocaixas, referências, portais e fronteiras de preservação.
- [2.19.1](docs/2.19.1/Notas_da_versao_RevisaWiki_v2_19_1.txt): correção da identificação do editor e do erro de objeto cíclico.
- [Histórico completo](docs/2.21.4/Documentacao_RevisaWiki_v2_21_4.wiki): notas das versões em ordem da mais recente para a mais antiga.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Fontes completas da campanha, perfis de navegador, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. Os resultados públicos trazem totais, hashes e limites das provas.

O código próprio usa [CC BY-SA 4.0](LICENSE). Materiais de terceiros conservam suas licenças e as revisões de origem registradas no repositório. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.
