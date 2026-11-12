# RevisaWiki

O RevisaWiki reúne correções de referências, infocaixas, tabelas e sintaxe no botão **Ajustar código**, no editor de código-fonte da Wikipédia em português. As mudanças ficam no rascunho, com opção de desfazer. Use **Mostrar alterações** e a pré-visualização para conferir o resultado antes de publicar.

## Versão 2.21.7

A versão amplia a revisão de infocaixas, referências e cabeçalhos de discussão. O [catálogo completo](docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.md) apresenta 170 recursos e comportamentos, com exemplos e as condições de cada ajuste.

- Formata infocaixas reconhecidas em linhas, adapta campos conferidos e preserva caixas filhas, links e fontes.
- Usa os campos efetivamente aceitos pela caixa e sua prioridade de aliases antes de acrescentar portais biográficos ou temáticos.
- Reconhece países e territórios por variantes conferidas, sem transformar um nome de estado ou um dado conflitante em país.
- Repara delimitadores digitados incorretamente em chamadas identificáveis, preservando links válidos, fórmulas e exemplos literais.
- Adapta modelos bibliográficos e citações simples com assinatura confirmada. Conserva níveis de títulos, bancos de fontes e casos ambíguos.
- Organiza PD, tradução, projetos e avisos de fusão. O marcador explícito de bot permite limpar sua avaliação, conservando projetos e importâncias.
- Mantém os reparos anteriores de notas, referências, listas finais e rodapé, com resultados aplicados no mesmo rascunho.
O resumo padrão é **Minúcias**. A marcação de edição menor respeita as escolhas manuais. O painel informa somente os resultados aplicados, com a diferença em bytes, **Mostrar alterações** e **Desfazer**.

[Índice para copiar e colar](dist/2.21.7/INDICE.md) · [Pacote ZIP](dist/2.21.7/RevisaWiki_2.21.7.zip) · [Manual](docs/2.21.7/Documentacao_RevisaWiki_v2_21_7.wiki) · [Instalação](docs/2.21.7/Instalacao_RevisaWiki_v2_21_7.txt)

Os dados continuam protegidos contra mudanças durante o salvamento na Wikipédia. A chamada fixa do common.js permanece igual.

## Instalação

Para usar a distribuição compartilhada, acrescente uma vez a chamada fixa do índice ao seu common.js. Se já a usa, mantenha esse bloco e recarregue sem cache depois da atualização.

Quem mantém a distribuição atualiza **dados, programa, carregador central e documentação**, nessa ordem, pelos arquivos completos do índice. As partes precisam corresponder à mesma versão.

Dados e programa são separados para respeitar o limite de tamanho de cada página. O arquivo `RevisaWiki_v2_21_7_completo.js` excede esse limite e serve para uso local e testes. Não instale a distribuição compartilhada e uma cópia própria ao mesmo tempo.

A instalação na Wikipédia permanece manual. O RevisaWiki não publica páginas. A análise continua até terminar ou ser cancelada. O editor só recebe um resultado completo e verificado para o mesmo rascunho. Alterar o texto durante o processamento invalida o resultado anterior, preservando a edição mais recente.

## Demonstração

[Baixe a demonstração](dist/2.21.7/Demonstracao_RevisaWiki_v2_21_7.html) e abra o arquivo no navegador. O GitHub mostra o código de arquivos HTML. A demonstração funciona offline, usa o mesmo motor distribuído e apresenta 147 exemplos fictícios, incluindo situações que precisam permanecer intactas. Consultas externas não são simuladas como fatos sobre artigos reais.

## Código e testes

A reconstrução confere os arquivos imutáveis da 2.21.6 e reconstitui essa base antes de incorporar os módulos de `src/v2_21_7`. O catálogo e os contratos nativos anteriores permanecem no pacote. O construtor substitui trechos identificados da sintaxe e preserva os contratos anteriores. A preparação do código reduz nomes locais, sem compactar algoritmos nem retirar verificações, e protege as strings contra mudanças no pré-salvamento.

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

`npm test` executa os contratos atuais nos dois arquivos distribuídos, sem abrir navegadores. `test:biography` confere o catálogo de infocaixas e as identidades de países e territórios. `test:regression` repete contratos herdados e conserva diferenças declaradas de preferência e formatação. Os testes dos navegadores reais e a campanha privada de artigos têm comprovantes separados. As execuções de grupos, os cálculos e os artigos únicos são contados separadamente. A pré-gravação e o pacote têm testes próprios. Os arquivos e resultados antigos mantêm seus estados originais.

O [relatório da versão](tests/evidence/2.21.7/QA_SUMMARY.json) separa fontes reais congeladas, controles sintéticos, testes da interface, limites e exemplos da demonstração. O [quadro dos 76 itens](tests/v2212/coverage_all.json) conserva o registro da 2.21.2, com os limites de suas automações. Os comprovantes novos identificam o pacote atual e não reclassificam resultados históricos.

`test:presave:receipt` confere o comprovante já incluído. Uma nova consulta usa `scripts/check_wiki_presave_v2217.py` com um caminho de recibo ainda inexistente; a API é consultada em modo de leitura, sem autenticação nem edições. A montagem recusa uma resposta alterada, uma falha de acesso ou um comprovante de outros arquivos. Os dados e o programa precisam pertencer ao mesmo pacote.

Nenhum teste publica edições na Wikipédia. Os testes de navegador usam o programa real em páginas locais, com editores e respostas de consultas fictícios. A campanha de revisões reais usa fontes congeladas e mantém recusas, erros e timeouts separados dos resultados aceitos. A preservação do rascunho continua obrigatória. Limites externos dos testes e prazos de consultas individuais são registrados separadamente do processamento local, que não tem corte fixo de tempo.

## Versões anteriores

- [2.21.6](dist/2.21.6/INDICE.md): notas, referências, listas finais, rodapé e metadados de discussão.

- [2.21.5](dist/2.21.5/INDICE.md): referências, parâmetros, cabeçalhos de discussão e resultados independentes verificados.

- [2.21.4](dist/2.21.4/INDICE.md): recuperação de correções independentes e painel com os resultados aplicados.

- [2.21.3](dist/2.21.3/INDICE.md): campos atuais de biografias, infocaixas incorporadas e prioridades de parâmetros.
- [2.21.2](dist/2.21.2/INDICE.md): referências, portais, campos de infocaixas e simplificação do painel.

- [2.21.1: instalação corrigida](dist/2.21.1-installation.1/INDICE.md): proteção permanente dos dados no pré-salvamento.
- [2.21.1](docs/2.21.1/Notas_da_versao_RevisaWiki_v2_21_1.txt): mínimo de oito itens nas listas finais.

- [2.21.0](docs/2.21.0/Notas_da_versao_RevisaWiki_v2_21_0.txt): campos de infocaixas, referências e sintaxe.
- [2.20.0](docs/2.20.0/Notas_da_versao_RevisaWiki_v2_20_0.txt): parâmetros, infocaixas, referências, portais e fronteiras de preservação.
- [2.19.1](docs/2.19.1/Notas_da_versao_RevisaWiki_v2_19_1.txt): correção da identificação do editor e do erro de objeto cíclico.
- [Histórico completo](docs/2.21.7/Documentacao_RevisaWiki_v2_21_7.wiki): notas das versões em ordem da mais recente para a mais antiga.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Fontes completas da campanha, perfis de navegador, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. Os resultados públicos trazem totais, hashes e limites das provas.

O código próprio usa [CC BY-SA 4.0](LICENSE). Materiais de terceiros conservam suas licenças e as revisões de origem registradas no repositório, incluindo os [dados de localização Unicode](THIRD_PARTY_NOTICES_2_21_7.md). A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.
