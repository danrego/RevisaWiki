# RevisaWiki

O RevisaWiki reúne correções de referências, infocaixas, tabelas e sintaxe no botão **Ajustar código**, no editor de código-fonte da Wikipédia em português. As mudanças ficam no rascunho, com opção de desfazer. Use **Mostrar alterações** e a pré-visualização para conferir o resultado antes de publicar.

## Versão 2.21.6

A versão reúne as correções de notas, referências, listas finais e metadados de discussão no mesmo botão. O [catálogo completo](docs/2.21.6/Funcionalidades_RevisaWiki_2_21_6.md) apresenta 146 funcionalidades, com exemplos e as condições de cada ajuste.

- Isola as listas de referências, normaliza chamadas equivalentes e reúne notas e referências quando há um único conjunto compatível.
- Corrige pontuação e chamadas adjacentes duplicadas de referências, preservando definições e reutilizações separadas.
- Transfere a data fornecida de uma ligação inativa para a citação em casos confirmados, mantendo endereços e arquivos.
- Usa técnicas do módulo NomeRefAuto para gerar nomes descritivos, reservando identidades existentes e preservando famílias ambíguas.
- Retira colunas de listas curtas e usa duas colunas a partir de oito itens nas seções finais. Referências têm o mínimo separado de dez entradas.
- Organiza metadados finais, caixas de projetos irmãos e cabeçalhos de discussão. Reconhece o controle de autoridade indireto de modelos compostos.
- Mantém o indicador de atividade e o cancelamento, sem prazo fixo para a análise. Um ajuste não confirmado é omitido e os demais continuam sendo conferidos.

O resumo padrão é **Minúcias**. A marcação de edição menor respeita as escolhas manuais. O painel informa somente os resultados aplicados, com a diferença em bytes, **Mostrar alterações** e **Desfazer**.

[Índice para copiar e colar](dist/2.21.6/INDICE.md) · [Pacote ZIP](dist/2.21.6/RevisaWiki_2.21.6.zip) · [Manual](docs/2.21.6/Documentacao_RevisaWiki_v2_21_6.wiki) · [Instalação](docs/2.21.6/Instalacao_RevisaWiki_v2_21_6.txt)

Os dados continuam protegidos contra mudanças durante o salvamento na Wikipédia. A chamada fixa do common.js permanece igual.

## Instalação

Para usar a distribuição compartilhada, acrescente uma vez a chamada fixa do índice ao seu common.js. Se já a usa, mantenha esse bloco e recarregue sem cache depois da atualização.

Quem mantém a distribuição atualiza **dados, programa, carregador central e documentação**, nessa ordem, pelos arquivos completos do índice. As partes precisam corresponder à mesma versão.

Dados e programa são separados para respeitar o limite de tamanho de cada página. O arquivo `RevisaWiki_v2_21_6_completo.js` excede esse limite e serve para uso local e testes. Não instale a distribuição compartilhada e uma cópia própria ao mesmo tempo.

A instalação na Wikipédia permanece manual. O RevisaWiki não publica páginas. A análise continua até terminar ou ser cancelada. O editor só recebe um resultado completo e verificado para o mesmo rascunho. Alterar o texto durante o processamento invalida o resultado anterior, preservando a edição mais recente.

## Demonstração

[Baixe a demonstração](dist/2.21.6/Demonstracao_RevisaWiki_v2_21_6.html) e abra o arquivo no navegador. O GitHub mostra o código de arquivos HTML. A demonstração funciona offline, usa o mesmo motor distribuído e apresenta 135 exemplos fictícios, incluindo situações que precisam permanecer intactas. Consultas externas não são simuladas como fatos sobre artigos reais.

## Código e testes

A reconstrução verifica os arquivos imutáveis da 2.21.5 e recompõe sua base a partir da 2.21.4, antes de incorporar os módulos de `src/v2_21_6`. O catálogo e os contratos nativos anteriores permanecem no pacote. O construtor substitui trechos identificados da sintaxe e preserva os contratos anteriores. A preparação do código reduz nomes locais, sem compactar algoritmos nem retirar verificações, e protege as strings contra mudanças no pré-salvamento.

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

`npm test` executa os contratos atuais nos dois arquivos distribuídos e confere a interface carregada da fonte. `test:biography` repete os grupos herdados de biografias. Os contratos anteriores de referências, tabelas e fontes ficam em `test:regression`. As execuções de grupos, os cálculos e os artigos únicos são contados separadamente. A pré-gravação e o pacote têm testes próprios. Os arquivos e resultados antigos mantêm seus estados originais.

O [relatório da versão](tests/evidence/2.21.6/QA_SUMMARY.json) separa fontes reais congeladas, controles sintéticos, testes da interface, limites e exemplos da demonstração. O [quadro dos 76 itens](tests/v2212/coverage_all.json) conserva o registro da 2.21.2, com os limites de suas automações. Os comprovantes novos identificam o pacote atual e não reclassificam resultados históricos.

`test:presave:receipt` confere o comprovante já incluído. Uma nova consulta usa `scripts/check_wiki_presave_v2216.py` com um caminho de recibo ainda inexistente; a API é consultada em modo de leitura, sem autenticação nem edições. A montagem recusa uma resposta alterada, uma falha de acesso ou um comprovante de outros arquivos. Os dados e o programa precisam pertencer ao mesmo pacote.

Nenhum teste publica edições na Wikipédia. Os testes de navegador usam o programa real em páginas locais, com editores e respostas de consultas fictícios. A campanha de revisões reais usa fontes congeladas e mantém recusas, erros e timeouts separados dos resultados aceitos. A preservação do rascunho continua obrigatória. Limites externos dos testes e prazos de consultas individuais são registrados separadamente do processamento local, que não tem corte fixo de tempo.

## Versões anteriores

- [2.21.5](dist/2.21.5/INDICE.md): referências, parâmetros, cabeçalhos de discussão e resultados independentes verificados.

- [2.21.4](dist/2.21.4/INDICE.md): recuperação de correções independentes e painel com os resultados aplicados.

- [2.21.3](dist/2.21.3/INDICE.md): campos atuais de biografias, infocaixas incorporadas e prioridades de parâmetros.
- [2.21.2](dist/2.21.2/INDICE.md): referências, portais, campos de infocaixas e simplificação do painel.

- [2.21.1: instalação corrigida](dist/2.21.1-installation.1/INDICE.md): proteção permanente dos dados no pré-salvamento.
- [2.21.1](docs/2.21.1/Notas_da_versao_RevisaWiki_v2_21_1.txt): mínimo de oito itens nas listas finais.

- [2.21.0](docs/2.21.0/Notas_da_versao_RevisaWiki_v2_21_0.txt): campos de infocaixas, referências e sintaxe.
- [2.20.0](docs/2.20.0/Notas_da_versao_RevisaWiki_v2_20_0.txt): parâmetros, infocaixas, referências, portais e fronteiras de preservação.
- [2.19.1](docs/2.19.1/Notas_da_versao_RevisaWiki_v2_19_1.txt): correção da identificação do editor e do erro de objeto cíclico.
- [Histórico completo](docs/2.21.6/Documentacao_RevisaWiki_v2_21_6.wiki): notas das versões em ordem da mais recente para a mais antiga.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Fontes completas da campanha, perfis de navegador, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. Os resultados públicos trazem totais, hashes e limites das provas.

O código próprio usa [CC BY-SA 4.0](LICENSE). Materiais de terceiros conservam suas licenças e as revisões de origem registradas no repositório. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.
