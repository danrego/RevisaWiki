# RevisaWiki

Abra o código-fonte, clique em **Ajustar código** e continue a revisão. O RevisaWiki organiza referências, adapta campos conferidos de infocaixas e corrige marcação na Wikipédia em português. As mudanças entram no rascunho, com **Mostrar alterações** e **Desfazer** à mão. A publicação fica com você.

## Versão 2.22.2

- Acrescenta `{{Marca de projeto|?}}` quando falta essa marcação na discussão de um artigo, mesmo sem portais, abaixo de `{{PD}}`.
- Marca a opção nativa **Vigiar página** ao concluir o ajuste, quando ela está disponível e desmarcada.
- Deixa o texto e o resumo prontos enquanto uma contagem residual termina separadamente, sem repetir os reparos ou bloquear os controles.

- Reúne coletores compatíveis em `{{Referências}}` ou `{{Notas e referências}}`, preservando bancos de fontes, títulos personalizados e configurações com função própria.
- Corrige atributos de referências, chamadas sem definição comprovada e repetições elegíveis, sem inventar uma fonte.
- Completa campos bibliográficos conhecidos mesmo ao lado de um parâmetro desconhecido, que permanece no texto.
- Adapta palavras mágicas e opções de imagem pelos aliases nativos conferidos, com `ORDENAÇÃOPADRÃO` e `Ficheiro` nos contextos previstos.
- Amplia os portais a partir de categorias exatas. A categorização nova exige critérios atuais e evidência referenciada; não preenche uma categoria por simples semelhança.
- Organiza os avisos de discussão na ordem PD, Marca de projeto, Traduzido e OKA, mantendo as informações das chamadas.
- Prepara a discussão pelo próprio **Ajustar código**, com uma ação para os projetos e o cabeçalho.
- Mantém listas comuns com menos de oito itens sem colunas e preserva comparações que precisam de colunas separadas.
- Formata infocaixas com campos em linhas separadas e um espaço depois de `=` nos valores preenchidos. As migrações estrangeiras usam contratos específicos e origem comprovada.
- Conserva variantes portuguesas válidas de autoridade, avaliações humanas e caixas com conteúdo estrutural.

O resumo padrão é **Minúcias**. O painel mostra os resultados aplicados, a contagem confirmada e a diferença em bytes. Um reparo que não puder entrar fica de fora sem cancelar os demais ajustes independentes.

[Copiar e instalar](dist/2.22.2/INDICE.md) · [Pacote completo](dist/2.22.2/RevisaWiki_2.22.2.zip) · [Manual com exemplos](docs/2.22.2/Documentacao_RevisaWiki_v2_22_2.wiki) · [Todos os recursos](docs/2.22.2/Funcionalidades_RevisaWiki_2_22_2.md)

## Instalação

Quem já usa a chamada fixa mantém o `common.js`. Após a atualização compartilhada, basta recarregar a página sem cache.

Quem mantém a distribuição precisa atualizar, nesta ordem: **Dados.js, Catalogo.js, partes Infocaixas, Regras.js, programa, carregador central e documentação**. O índice inclui cada parte JSON de infocaixas exigida por esta distribuição. O índice contém o texto completo de cada uma e seu destino. Todas as partes precisam ser do mesmo pacote.

A separação mantém cada arquivo instalável abaixo do limite de sua página e conserva a chamada fixa. `RevisaWiki_v2_22_2_completo.js` reúne o motor para uso local e testes; não é um arquivo para instalar na Wikipédia. Use somente uma instalação compartilhada ou uma cópia própria de cada vez.

## Experimente

[Baixe a demonstração](dist/2.22.2/Demonstracao_RevisaWiki_v2_22_2.html) e abra o arquivo no navegador. Os exemplos fictícios usam o mesmo motor da distribuição e mostram antes e depois. Casos que exigem consultas externas ficam identificados; a demonstração offline não fabrica essa confirmação.

## Código e testes

Com Python 3, Node.js 24 ou superior e npm 10 ou superior:

```sh
npm ci
npm run build
npm test
npm run test:presave:receipt
npm run build:index
npm run test:documentation
npm run test:privacy
```

Os testes dirigidos usam os dois motores distribuídos e incluem controles que devem permanecer intactos. Os testes dos navegadores reais e dos artigos salvos têm comprovantes separados. O [relatório da versão](tests/evidence/2.22.2/QA_SUMMARY.json) distingue exemplos sintéticos, capturas de artigos, páginas únicas, limites de desempenho e resultados inconclusivos.

A montagem confere os arquivos, os exemplos e os comprovantes de pré-salvamento. Um comprovante de outro pacote não é aceito. Os resultados e arquivos históricos conservam seus estados originais. A campanha privada usa capturas já salvas, que não são incluídas no repositório público.

Nenhum teste publica na Wikipédia. A análise do programa não tem corte global de tempo e pode ser cancelada. Limites de consultas e limites externos de recursos dos testes são registrados separadamente; um teste interrompido não conta como aprovado.

## Versões anteriores

- [2.22.1](dist/2.22.1/INDICE.md): referências, infocaixas, portais e organização das discussões.

- [2.22.0](dist/2.22.0/INDICE.md): referências, portais, palavras mágicas e organização do código.

- [2.21.7](dist/2.21.7/INDICE.md): infocaixas, referências, sintaxe, portais e cabeçalhos de discussão.

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
- [Histórico completo](docs/2.22.2/Documentacao_RevisaWiki_v2_22_2.wiki): notas das versões em ordem da mais recente para a mais antiga.


## Privacidade e licença

Código e pacotes passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Fontes completas da campanha, perfis de navegador, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. Os comprovantes públicos trazem totais, hashes e limites das verificações.

O código próprio usa [CC BY-SA 4.0](LICENSE). Os materiais de terceiros conservam suas licenças e revisões de origem, incluindo os [dados de localização Unicode](THIRD_PARTY_NOTICES_2_22_2.md). A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.
