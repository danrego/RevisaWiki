# RevisaWiki 2.20: funcionalidades e limites

O botão **Ajustar código** reúne os reparos que podem entrar no rascunho com o conteúdo preservado. A versão 2.20 amplia essa leitura em referências, infocaixas, imagens, tabelas e seções finais. Cada regra usa o modelo e a função do trecho, com condições para aceitar a mudança e situações em que o código precisa ficar como está.

Use **Mostrar alterações** do editor para conferir o resultado e **Desfazer ajustes** enquanto não tiver modificado o texto depois da execução. A publicação continua nos controles da Wikipédia.

A relação abaixo organiza as 52 decisões analisadas para a versão. São 49 frentes de automação, contratos ou verificações de preservação e três estudos de HTML que não foram ativados. Algumas acrescentam um reparo finito, outras corrigem a leitura ou retiram uma proposta inadequada. Os reparos seguem os limites descritos aqui e nas matrizes de testes. Um caso parecido pode precisar permanecer intacto quando muda o modelo, o papel do parâmetro ou o contexto.

## Leitura e preservação

### 1. Conferência do resultado mantido

As verificações de preservação examinam a ação completa, com os dados e a associação de cada fonte conservados. Uma diferença de formatação não basta para aceitar uma perda de conteúdo. Se o resultado for recusado, o rascunho anterior permanece no editor.

### 2. Leitura do trecho e de quem o exibe

Notas em blocos nativos podem estar ativas mesmo quando esses blocos ficam protegidos contra reescrita. A leitura distingue essas situações pelos campos que realmente encaminham conteúdo à página. Reparos independentes precisam de sua própria região completa, sem uma autorização geral para alterar conteúdo calculado ou de dono desconhecido.

## Referências e citações

### 3. Definições nativas dentro de contêineres

Notas definidas dentro dos blocos nativos conferidos entram na procura de nomes e grupos quando o campo realmente exibe seu conteúdo. O texto das fontes fica igual, e o aviso só sai quando todas as chamadas envolvidas têm uma definição confirmada. Conteúdo calculado, grupos incertos e definições conflitantes continuam para revisão.

### 4. Referência no fim de título de seção

Uma referência completa no fim de um título literal pode passar ao início da seção após duas pré-visualizações completas confirmarem as mesmas marcações e destinos. Âncoras antigas precisam ser conservadas, sem identificadores repetidos. Uma resposta incompleta, uma colisão de âncoras ou uma citação que ainda precise de reparo impede a movimentação.

### 5. Barra literal no título de citação

Uma barra que dividiu um título pode receber `{{!}}` nas citações CS1 reconhecidas, conservando as duas partes. O reparo exige um único fragmento de texto logo depois do campo de título. URLs, argumentos conhecidos, conteúdo calculado e outros parâmetros posicionais impedem a recomposição.

### 6. Limites finitos de tags de referência

Aberturas e fechamentos de `ref` recebem os reparos previstos quando o nome, o grupo e o corpo completo têm limites únicos. O programa confere as definições concorrentes e conserva a nota. Um fechamento extra só pode sair quando duplica o fechamento de uma nota completa comprovada, imediatamente adjacente e na mesma linha. Fechamentos soltos e exemplos em prosa permanecem intactos. Como o token excedente pode aparecer como texto, essa retirada não afirma igualdade visual. Não une notas adjacentes, não escolhe onde cortar prosa englobada por uma etiqueta aberta e mantém exemplos, nomes numéricos e atributos ambíguos.

Marcação de ref dentro de um atributo ou de outra abertura HTML suspende a normalização dessas etiquetas no texto, para conservar os limites reconhecidos pela extensão de referências. Os outros ajustes seguros continuam disponíveis.

### 7. Não converter prosa em bibliografia

Notas explicativas deixam de receber a oferta de virar uma referência bibliográfica apenas por conter aspas. Nenhum autor ou título é deduzido da prosa, e a nota permanece integral.

### 8. Pontuação de Harvnb separada de páginas

O parâmetro `ps` de Harvnb conserva sua função de pontuação e deixa de receber as alternativas `p` e `pp`, destinadas a páginas. A semelhança entre nomes de parâmetros não autoriza trocar suas funções.

### 9. Localizadores nativos de Harvnb

Em Harvnb, `page` pode passar a `p` e `pages` a `pp` quando o valor está explícito e não existe outro localizador concorrente. Autores, ano, destino, `Ref`, `loc` e demais argumentos permanecem como foram escritos. O reparo não se estende a Sfn nem altera `ps`.

### 10. Autoria explícita de Citar tweet

Em Citar tweet, `first` e `last` podem formar `autor` quando os dois valores são literais e não há outro campo de autoria concorrente. Usuário, número, texto, datas e endereços permanecem iguais. Nomes com marcação ou valores conflitantes ficam intactos, sem consulta externa ou regra geral para ordenar nomes.

### 11. Extensão total de livro

Em Citar livro, `páginas-total` numérico pode passar a `total-páginas` quando não há `total-páginas` ou `total-paginas` concorrente. O total da obra continua separado das páginas efetivamente citadas. Expressões vagas e conferência do número em catálogo externo ficam fora do reparo.

### 12. Alias de ligação divulgativa

Em Citar livro, `layurl` com URL HTTP explícita pode passar a `lay-url` quando nenhum outro campo do mesmo papel concorre com ele. O endereço permanece exato, sem mudar o estado de acesso ou afirmar que o documento foi consultado.

As regras anteriores de grafias de parâmetros de citação agora validam separadamente as quebras que só delimitam o campo. Os valores e os validadores por tipo continuam iguais. A verificação após os ajustes legados de data e compactação permite concluir a correção na mesma ação. Uma data completa em `ano` ou `year` só muda de campo com a precisão de dia já exigida, sem aliases concorrentes. Citações diretas, notas literais completas e células comprovadas podem receber o ajuste. Atributos, chamadas de função desconhecida, argumentos e exemplos permanecem protegidos.

## Infocaixas, biografias, imagens e portais

### 13. Portais de empresas

Uma única Info/Empresa ou Info/Empresa/Wikidata principal pode confirmar o portal Empresas quando o nome nativo está correto, não há identificador alternativo preenchido e o rodapé permite a inserção. Uma empresa mencionada na prosa ou uma caixa sem esse contrato não basta.

### 14. Portais de astronomia

Uma cadeia estelar com Starbox begin e Starbox end únicos e completos antes da primeira seção pode confirmar Astronomia. A regra não completa uma cadeia truncada nem usa um nome apenas parecido como evidência.

### 15. Portal de alimentos

A categoria literal Méis pode confirmar Alimentos quando está no artigo, fora de chamadas, referências, exemplos, atributos HTML e marcações de transclusão. Um valor em parâmetro sem função ou uma ligação de exibição para a categoria não confirma o tema. A condição não autoriza acrescentar temas médicos ou toxicológicos.

### 16. Portais de jogos

As caixas principais verificadas de jogo de cartas, jogo de tabuleiro e jogo eletrônico podem confirmar Jogos. O portal não é deduzido de palavras soltas ou de um jogo citado como exemplo em outro assunto.

### 17. Portais de episódios de televisão

A caixa especializada Info/Episódios de The Simpsons, usada como caixa principal, pode confirmar Televisão e Entretenimento. A regra não classifica pessoas ou filmes como episódios por aparecerem no texto.

### 18. Outros perfis temáticos nativos

Perfis exatos de parque, assentamento marroquino, unidade militar, alimento, bebida e astro podem confirmar os temas previstos para cada caixa. A chamada precisa ser principal, sem argumentos duplicados ou subcaixa ativa, e os argumentos posicionais conservam sua numeração. Aliases sem confirmação permanecem fora da regra.

### 19. Biografias e perfis ligados ao Wikidata

Caixas especializadas de biografia e filme ligadas ao Wikidata podem confirmar seus temas quando não usam um identificador alternativo. Info e Infocaixa genéricas só confirmam Biografias com uma prova da fonte e do título exatos, no domínio principal, ligada a uma entidade com sitelink ptwiki e declaração ativa e não qualificada de P31=Q5. Prova ausente, antiga ou de outra entidade não autoriza a adição.

### 20. País de nascimento explícito

Um país literal reconhecido no campo de nascimento pode confirmar seu portal quando os campos preenchidos concordam. A regra não deduz o país pela cidade nem muda a nacionalidade. Um portal estadual já presente continua cobrindo o Brasil.

### 21. Profissão explícita na abertura

Uma profissão de engenharia diretamente ligada e afirmada na abertura pode confirmar Engenharia quando o nome inicial corresponde ao título do artigo. O rótulo da ligação também precisa indicar uma profissão de engenharia da lista finita. Negação, outra pessoa, rótulo incompatível e predicados diferentes impedem a adição.

### 22. Chamadas de portal redundantes

Temas que levam ao mesmo portal podem perder a repetição, e uma chamada adjacente pode sair quando todos os seus temas já estão completos na seguinte. A ordem restante é conservada. Grafias aceitas e posições numeradas não são reescritas apenas para padronização, e parâmetros desconhecidos ou temas ambíguos permanecem intactos.

### 23. Início de ocupações compostas

Certas ocupações compostas recebem inicial minúscula no começo do campo, por um vocabulário finito e com alvo de ligação compatível. Caixas musicais precisam indicar artista solo. Siglas, nomes próprios, palavras no meio da expressão, campos concorrentes e bandas ficam preservados.

### 24. Mês e ano de nascimento parciais

Um mês português literal seguido de Dni com dia e mês vazios pode preencher apenas o mês da chamada quando o ano é válido. O dia continua ausente e a opção de idade permanece igual. Datas completas, intervalos, valores calculados e informações conflitantes não recebem a composição.

### 25. Campos importados com destino nativo

Campos importados podem receber um nome nativo nas caixas pessoais, políticas e de MMA cujo leitor foi conferido, desde que nenhum destino equivalente esteja preenchido. O valor permanece completo. A regra não apaga campos desconhecidos nem presume equivalências para influências, estado civil ou nacionalidade.

### 26. Imagem completa em infocaixas verificadas

Uma imagem completa pode ser separada em arquivo, tamanho e legenda nas caixas verificadas de animal individual, empresa, organização e sítio. A dimensão precisa estar explícita na própria imagem e ser compatível com os campos de tamanho já preenchidos. Uma dimensão malformada, ausente ou conflitante mantém a chamada original, para não ativar um tamanho antes ignorado nem transformar esse valor em texto alternativo. Cada destino precisa estar livre ou conter o mesmo valor. Opções sem destino equivalente, como alt, link e upright nessas novas caixas, impedem a extração, e um token incorreto isolado não vira legenda. Os outros ajustes independentes continuam disponíveis. Uma caixa de animal não confirma uma pessoa.

### 27. Erros finitos de opções de imagem

`semmdolura` só recebe a forma `semmoldura` quando a imagem já usa uma única opção `frameless`, `semmoldura` ou `semborda`, com legenda literal no fim e sem outra moldura concorrente. A correção mantém o formato já ativo. Um número seguido de px não basta para acrescentar esse formato, que pode mudar o tamanho ou apagar uma legenda. A forma `width` seguida do tamanho exige uma única largura de até 500 px, legenda literal no fim e ausência de outra dimensão, upright ou indicação width. Nomes de arquivo, legendas finais, aliases válidos, atributos HTML e exemplos protegidos permanecem iguais. Imagens no corpo de um elemento HTML ou em células completas continuam elegíveis quando cumprem essas condições.

### 28. Token estrangeiro de imagem ignorado

Um token `vertical` anterior à legenda ativa posterior pode sair quando é ignorado pela sintaxe nativa. A legenda final com esse texto permanece igual. A regra nunca transforma o token em upright ou usa essa retirada para redimensionar a imagem.

### 29. Sites conforme o leitor nativo

O reparo de sites usa o papel do campo na infocaixa. Um host sem protocolo só usa o endereço oficial literal, explícito e único já presente no corpo ou nas ligações externas, com o mesmo host, caminho, consulta e fragmento. O rótulo inteiro da ligação precisa ser Página oficial, Site oficial, Sítio oficial, Website oficial ou oficial, sem palavras adicionais. Encontrar a expressão numa frase, inclusive numa negação ou crítica, não confirma o endereço. Chamadas, referências, exemplos, atributos HTML e marcações de transclusão não fornecem essa prova. Em URL, um endereço literal com `=` pode receber posições explícitas sem conflito, conservando o rótulo e os bytes do endereço. Consumidores de URL crua, valores de supressão, múltiplas ligações e conteúdo calculado ficam preservados. Em citações, website pode ser o título da publicação.

As novas adições e limpezas de portais exigem uma fronteira completa do rodapé. Uma chamada, ligação, tabela ou etiqueta aberta impede essas mudanças, sem retirar os ajustes independentes já confirmados em campos anteriores. O rodapé incerto fica preservado, sem aviso adicional.

## Tabelas, ligações, espaços e marcação

### 30. Linhas e itens vazios no fim da lista

Um item vazio de nível único pode sair após um item preenchido e antes de um rodapé conhecido, seção final ou fim da página. Linhas excedentes ficam reduzidas a uma linha vazia. Marcadores intermediários, descendentes e listas dentro de tabelas, referências ou predefinições permanecem intactos.

### 31. Atributos de apresentação da tabela

Numa tabela literal completa e regular, a ferramenta só retira um atributo redundante quando a mesma linha ou célula já contém a propriedade CSS inline correspondente, com valor finito válido e idêntico. Isso vale para align com text-align e bgcolor com background-color em linhas ou células. Para valign com vertical-align e width com width, a retirada fica restrita às células. A regra não cria CSS nem muda sua prioridade. Estilos com conflito, propriedades repetidas ou !important, valores calculados, legendas e fronteiras incertas ficam preservados. Essa verificação não afirma equivalência visual para qualquer folha de estilos.

### 32. Estudo de center, não ativado

A conversão nova de center para div não foi ativada. Regras de CSS da página podem dar aos dois elementos apresentações diferentes, mesmo em trechos simples. O código original permanece intacto por esta frente de trabalho.

### 33. Estudo de font, não ativado

A conversão nova de font para span não foi ativada. Cor, família e tamanho podem depender do CSS e do contexto em que o elemento aparece. Esta frente preserva os elementos originais, incluindo os que estão em legendas.

### 34. Estudo de big, não ativado

A conversão nova de big para span não foi ativada. As regras de tamanho e o CSS da página não permitem afirmar uma equivalência geral de apresentação. Esta frente mantém o elemento original e seu conteúdo.

### 35. Aspas curvas no atributo scope

Aspas tipográficas completas ao redor de row, col, rowgroup ou colgroup podem virar delimitadores aceitos no atributo scope, com separação explícita. A regra usa uma tabela literal completa ou uma célula local confirmada, sem completar a tabela nem trocar aspas de legendas, parâmetros ou outros atributos.

### 36. Rótulo na abertura da tabela

Um único termo de definição literal logo após a abertura da tabela pode passar para antes dela quando esse limite de bloco está confirmado. São movidos os mesmos bytes. Legendas, parágrafos, tabelas aninhadas, conteúdo calculado e rótulos com marcação ambígua ficam no lugar.

### 37. Formatação dentro da própria célula

Uma abertura small, b ou i sem atributos, no início de uma única célula literal, pode receber fechamento no fim físico inequívoco da célula. Um fechamento concorrente, formatação que atravesse células ou estrutura calculada impede o ajuste.

### 38. Separador de ligação externa

Uma barra entre a URL de um documento e um rótulo de mais de uma palavra pode virar espaço quando o endereço termina em pdf, html, htm, asp ou aspx, sem consulta ou fragmento. Barras que possam fazer parte do endereço, de um parâmetro ou de um rótulo ambíguo permanecem iguais.

### 39. Rótulo de ligação externa em nova linha

Uma única quebra de linha entre a URL completa e um rótulo literal pode virar espaço numa ligação externa completa. O reparo não atravessa parâmetro, lista, tabela, outra quebra ou conteúdo calculado.

### 40. Erro finito de protocolo

O prefixo inválido hhttps:// pode perder a letra excedente numa ligação externa completa. Host, caminho e rótulo permanecem iguais, sem tentativa de corrigir protocolos arbitrários ou pesquisar outro destino.

### 41. Grafias exatas de nomes de modelos

As chamadas isoladas Referências; e Portal 3 recebem os nomes confirmados Referências e Portal3 nas condições previstas. A primeira precisa estar sem argumentos, e a segunda conserva seus parâmetros. Não há retirada geral de pontuação ou espaços de outros nomes.

### 42. Fechamento único de ligação interna

Uma ligação interna pode receber o fechamento quando há uma única abertura restante na linha, destino literal e demais ligações balanceadas. Alvos com namespace, barra vertical, sinal de igualdade, outra abertura ou fim de palavra ambíguo ficam preservados.

### 43. Grafias inequívocas em prosa

As formas minúsculas espectativas e estreiou podem passar a expectativas e estreou na prosa comum. Nomes ligados, citações, itálicos, títulos bibliográficos, trechos técnicos e variantes válidas ficam protegidos. A regra não faz uma revisão gramatical livre.

### 44. Coordenada redundante no título

Uma chamada posterior de Coord pode tornar redundante outra exibição apenas no título quando as coordenadas posicionais são literalmente iguais e todos os parâmetros preenchidos são retidos. A leitura distingue posições de argumentos nomeados intercalados. Exibição no corpo da página, valores divergentes, argumentos duplicados e metadados não retidos impedem a retirada.

### 45. Aviso genérico redundante

Evento atual genérico sem argumentos pode sair quando há exatamente uma chamada temática literal que já o cobre. A regra não reúne avisos arbitrários nem escolhe entre temas ou avaliações concorrentes.

### 46. Bibliografia complementar

Uma seção chamada Bibliografia complementar pode receber colunas com seis ou mais entradas completas de nível único e sem apresentação própria. O título da seção e as citações permanecem iguais. Prosa, listas menores e agrupamentos que criariam argumentos de predefinição ficam fora do reparo.

### 47. Intervalo após coletor de referências

Linhas vazias excedentes depois de um coletor nativo completo e isolado podem sair antes de prosa ou título completos. O corpo das referências e o conteúdo calculado não são atravessados.

### 48. Ênfase de Markdown dentro da prosa

Um par completo de asteriscos duplos pode virar ênfase wiki nos contextos de prosa conferidos ou após um único marcador de lista. O par simples fica restrito a títulos de duas a quatro palavras com iniciais maiúsculas. Listas, variáveis, potências, fórmulas, explicações de Markdown e citações permanecem como estavam.

### 49. Camada externa indevida numa navecaixa literal

Uma chamada literal de navecaixa com quatro chaves pode perder a camada externa indevida quando o modelo consta do contrato finito, sua expansão foi conferida e depois da chamada há somente categorias. Nomes calculados válidos, funções de análise e modelos fora desse contrato permanecem intactos.

### 50. Intervalo após tabela completa

Linhas vazias excedentes após uma tabela literal completa podem sair antes de prosa ou cabeçalho completos. O corpo e todas as fronteiras da tabela permanecem byte a byte iguais. Tabelas abertas, aninhadas ou calculadas continuam fora da regra.

### 51. Intervalos após estruturas inline completas

O limite de um parágrafo pode ser conferido mesmo quando a linha vizinha contém uma referência completa, um aviso inline conhecido ou math completo. Esses trechos são ocultados apenas durante a leitura e voltam com os mesmos bytes. Nada é retirado de dentro das notas, fórmulas ou predefinições.

### 52. Linhas vazias com espaços ou tabulações

Linhas que contêm apenas espaços ou tabulações podem ser vazias num limite de prosa confirmado. O formato LF ou CRLF é conservado. A regra não apara a indentação de conteúdo, código ou blocos preformatados.

## Complementos de verificação

### Instituições de trabalho

Em `Info/Cientista`, `instituições` pode passar a `instituicao_trabalho` quando existe um campo científico preenchido e nenhum dos destinos de instituição de trabalho já tem conteúdo. A mudança conserva o valor e suas referências. Formação, empregador ou afiliações não são escolhidos por semelhança de nome.

Os campos de influência que não são lidos pela caixa, ou que uma caixa intermediária encaminha para um destino ignorado, precisam de correção na predefinição. A ferramenta não inverte influências recebidas e pessoas influenciadas para fazer um campo aparecer.

Os aliases nativos `sepultamento`, `enterro` e `enterro_local` permanecem válidos e conservam sua grafia. Não há migração nova de `resting_place` nem conversão de companheiro em cônjuge.

### Linha inicial após descrição curta

A retirada de uma descrição curta pode deixar uma linha vazia antes da primeira estrutura do artigo. A limpeza desse início conserva a primeira chamada, o texto e os exemplos protegidos. Não acrescenta uma introdução nem reescreve o conteúdo que estava depois da descrição.

## Preferências e revisão

As opções do painel continuam controlando os grupos de ajuste. Desligar os portais impede a inserção de portais. Desligar um reparo de referência não desliga a preservação do rascunho. As regras que exigem o artigo inteiro permanecem desligadas na edição de seção e nos outros espaços de nomes.

Uma prova de consulta vale para o texto, título e contexto usados na sua criação. Dados antigos do cache não podem autorizar uma mudança num rascunho diferente. Um resultado que chegou depois de uma edição manual precisa ser descartado ou receber nova conferência.

A contagem distingue os campos efetivamente alterados e os portais efetivamente acrescentados. Alguns resultados de separação de imagem em campos não recebem número exato no contador da interface, porque a comparação não consegue separar todos os trechos. Nesses casos, a ferramenta pede a comparação sem exibir uma precisão que não confirmou.

## Como a validação é registrada

Os casos de teste têm entrada, opções e resultado esperado escritos separadamente. Há pares positivos e negativos, conflitos de campos, nomes válidos e inválidos, referências em grupos, caixas pessoais e não pessoais, regiões protegidas e provas antigas. Os testes de ação completa usam o mesmo cálculo e as mesmas verificações de preservação que antecedem a aplicação no editor.

As duas distribuições têm comprovantes próprios ligados aos hashes dos arquivos. Os testes de navegador usam páginas locais e adaptadores fictícios de APIs de leitura. A validação da interface distingue uma prova realmente criada pelo fluxo de consulta de uma prova fornecida diretamente a uma função isolada.

Resultados aceitos, recusas e falhas de execução têm registros separados. Um timeout não recebe o estado de teste aprovado. O limite continua em 60 segundos, e o caso extremo de aproximadamente 1,9 MB permanece como limitação conhecida. A edição precisa continuar disponível com o rascunho inteiro intacto.

Os resultados das versões anteriores conservam seus hashes e estados históricos. Eles não contam como nova validação da 2.20. As matrizes de cobertura descrevem condições de aplicação e não substituem os comprovantes de execução.

- [Código e distribuições](https://github.com/danrego/RevisaWiki)
- [Testes e matrizes da 2.20](https://github.com/danrego/RevisaWiki/tree/main/tests/v220)
- [Instalação e documentação da 2.20](https://github.com/danrego/RevisaWiki/tree/main/docs/2.20.0)

## Mapa técnico das frentes

Os identificadores abaixo correspondem às matrizes de testes e permitem localizar os critérios completos de cada reparo.

| Identificador | Funcionalidade |
| --- | --- |
| `preservation-gate-correctness` | Conferência do resultado mantido |
| `native-reader-boundary` | Leitura do trecho e de quem o exibe |
| `reference-definition-reachability` | Definições nativas dentro de contêineres |
| `heading-reference-relocation` | Referência no fim de título de seção |
| `citation-title-literal-pipe` | Barra literal no título de citação |
| `reference-tag-finite-boundaries` | Limites finitos de tags de referência |
| `r2-citation-note-formatting-false-positive` | Não converter prosa em bibliografia |
| `r2-citation-parameter-suggestion-semantic-types` | Pontuação de Harvnb separada de páginas |
| `r2-harvnb-explicit-page-parameter-migration` | Localizadores nativos de Harvnb |
| `r2-tweet-native-author-composition` | Autoria explícita de Citar tweet |
| `r2-citation-total-pages-verified-key` | Extensão total de livro |
| `r2-citation-deprecated-alias-preserving-rendering` | Alias de ligação divulgativa |
| `portal-company-profiles` | Portais de empresas |
| `portal-astronomy-profiles` | Portais de astronomia |
| `portal-food-evidence` | Portal de alimentos |
| `portal-games-profiles` | Portais de jogos |
| `portal-tv-episode-profiles` | Portais de episódios de televisão |
| `portal-other-native-profiles` | Outros perfis temáticos nativos |
| `portal-wikidata-bound-profiles` | Biografias e perfis ligados ao Wikidata |
| `portal-explicit-birth-country` | País de nascimento explícito |
| `portal-explicit-lead-profession` | Profissão explícita na abertura |
| `portal-call-cleanup` | Chamadas de portal redundantes |
| `occupation-finite-case` | Início de ocupações compostas |
| `partial-personal-date-composition` | Mês e ano de nascimento parciais |
| `infobox-native-field-contracts` | Campos importados com destino nativo |
| `named-animal-image-fields` | Imagem completa em infocaixas verificadas |
| `image-finite-option-typos` | Erros finitos de opções de imagem |
| `image-foreign-option-contracts` | Token estrangeiro de imagem ignorado |
| `r2-website-values-native-consumer-contracts` | Sites conforme o leitor nativo |
| `final-list-cleanup` | Linhas e itens vazios no fim da lista |
| `legacy-table-attributes` | Atributos de apresentação da tabela |
| `legacy-center-elements` | Estudo de center, não ativado |
| `legacy-font-elements` | Estudo de font, não ativado |
| `legacy-big-elements` | Estudo de big, não ativado |
| `table-attribute-quote-delimiters` | Aspas curvas no atributo scope |
| `fostered-table-intro-label` | Rótulo na abertura da tabela |
| `cell-local-formatting-closure` | Formatação dentro da própria célula |
| `external-link-pipe-delimiter` | Separador de ligação externa |
| `external-link-newline-label` | Rótulo de ligação externa em nova linha |
| `external-protocol-finite-typos` | Erro finito de protocolo |
| `template-name-exact-typos` | Grafias exatas de nomes de modelos |
| `wikilink-unique-closing-boundary` | Fechamento único de ligação interna |
| `finite-portuguese-spelling` | Grafias inequívocas em prosa |
| `duplicate-coordinate-displays` | Coordenada redundante no título |
| `duplicate-maintenance-template` | Aviso genérico redundante |
| `r2-bibliography-heading-role-extension` | Bibliografia complementar |
| `r2-gap-after-reference-collector` | Intervalo após coletor de referências |
| `r2-inline-markdown-emphasis` | Ênfase de Markdown dentro da prosa |
| `r2-literal-navbox-redundant-indirection` | Camada externa indevida numa navecaixa literal |
| `r2-prose-gap-after-complete-table` | Intervalo após tabela completa |
| `r2-prose-gap-after-inline-structure` | Intervalos após estruturas inline completas |
| `r2-whitespace-only-blankline-variant` | Linhas vazias com espaços ou tabulações |
