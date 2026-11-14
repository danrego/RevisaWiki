# Funcionalidades do RevisaWiki 2.22.0

190 entradas de contratos e comportamentos, conservando os 170 IDs anteriores. Os 20 registros adicionais descrevem esta ampliação documental; não são contagens de milhares de regras ou promessas de alterações incondicionais.

Exemplos conceituais/ilustrativos e verificações exatas são identificados separadamente. Testes completos, corpus, prévias e navegador ficam no relatório de validação.

## Referências e notas

### REF-01: Lista de referências em linha própria

Separa o coletor do parágrafo, sem mudar o texto ou as fontes.

**Antes**

```wikitext
Texto.<ref>Fonte.</ref>{{Referências}}
```

**Depois**

```wikitext
Texto.<ref>Fonte.</ref>

{{Referências}}
```

A alteração exige uma ocorrência completa, reconhecida e sem conflito.

### REF-02: Coletores repetidos

Retira uma cópia equivalente do mesmo coletor.

**Antes**

```wikitext
Texto.<ref>Fonte.</ref>
{{Referências}}
{{Referências}}
```

**Depois**

```wikitext
Texto.<ref>Fonte.</ref>
{{Referências}}
```

Listas com grupos, definições internas ou funções diferentes não são cópias intercambiáveis.

### REF-03: Notas e referências juntas

Reúne coletores compatíveis, inclusive ordem invertida e o bloco simples de quatro chamadas.

**Antes**

```wikitext
Texto{{Nre|Uma explicação.}}.<ref>Uma fonte.</ref>
{{Notas}}

{{Referências}}
```

**Depois**

```wikitext
Texto{{Nre|Uma explicação.}}.<ref>Uma fonte.</ref>
{{Notas e referências}}
```

Inventário literal de grupos e produtores, sem perda de definições, conteúdo ou títulos personalizados. Larguras efetivas permanecem; largura de coletor posterior comprovadamente vazio não obriga conservar uma lista redundante.

**Outro caso**

```wikitext
Texto<ref>Fonte.</ref>
{{Notas}}
```

```wikitext
Texto<ref>Fonte.</ref>

{{Referências}}
```

Quando Notas é o único coletor simples e há fonte padrão real antes dele, restaura diretamente o coletor padrão. Inventário fechado, sem argumentos, banco, outro grupo ou título personalizado.

**Outro caso**

```wikitext
Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>
{{Notas}}
```

```wikitext
Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>

{{Notas e referências}}
```

Mesma prova do coletor único, conservando nota/lower-alpha e as fontes. Outros grupos ou produtores posteriores ficam retidos.

**Outro caso**

```wikitext
Texto.
== Notas ==
{{Notas}}
```

```wikitext
Texto.

```

Notas isolada sem argumentos, nenhuma chamada ref/helper e inventário completo de produtores conhecidos. Título personalizado e prosa permanecem; desconhecidos retêm a chamada.

**Outro caso**

```wikitext
Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>
{{Notas}}
{{Notelist|30em}}

{{Referências}}
{{Reflist|30em}}
```

```wikitext
Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>

{{Notas e referências}}
```

Os grupos já foram recolhidos pelos primeiros coletores; as listas com largura são posteriores e redundantes. Sem definições internas ou novos produtores entre elas.

**Outro caso**

```wikitext
Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>
== Notas ==
<div class="references"><references group=lower-alpha/></div>

== Referência ==
<references />
```

```wikitext
Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>

{{Notas e referências}}
```

Somente div com a classe references, sem outros atributos, id, estilo, conteúdo extra ou definições. Grupos e chamadas conservados. Ligações a âncoras impedem a convergência quando não há prova para mantê-las.

### REF-04: Formato nativo da lista

Converte coletores equivalentes e retira um título que passaria a ser repetido.

**Antes**

```wikitext
Texto.<ref>Fonte.</ref>
== Referências ==
<references/>
```

**Depois**

```wikitext
Texto.<ref>Fonte.</ref>
{{Referências}}
```

Somente contratos equivalentes. Título manual personalizado, conteúdo e proprietário da seção permanecem; o coletor usa nível=0 quando necessário. Larguras explícitas da lista efetiva permanecem sem prova de equivalência de apresentação. Grupos, estilos, bancos e opções conflitantes não são descartados.

**Outro caso**

```wikitext
== Fontes ==
{{Reflist|2}}
```

```wikitext
== Fontes ==
{{Referências|nível=0}}
```

Conserva o título personalizado sem criar outro cabeçalho Referências.

**Outro caso**

```wikitext
== Referências ==
{{Reflist|30em}}
```

```wikitext
== Referências ==
{{Reflist|30em}}
```

Largura efetiva explícita conservada; a orientação geral de migração não prova apresentação idêntica neste caso.

### REF-05: Pontuação junto às referências

Põe a pontuação existente antes de uma chamada ou sequência de chamadas, nos contextos sem ambiguidade.

**Antes**

```wikitext
Uma frase<ref name="fonte" />.
```

**Depois**

```wikitext
Uma frase.<ref name="fonte" />
```

Não cria sinais, não muda o corpo das fontes e preserva casos ambíguos com aspas, abreviaturas ou reticências.

**Outro caso**

```wikitext
Texto. {{sfn|Autor|2020}}
```

```wikitext
Texto.{{sfn|Autor|2020}}
```

Só espaço horizontal após pontuação e antes de sfn reconhecida. Não consome nova linha.

### REF-06: Fontes anônimas idênticas

Transforma repetições da mesma fonte em uma definição nomeada e reutilizações.

**Antes**

```wikitext
A.<ref>{{citar livro|ultimo=Exemplo|primeiro=Ana|titulo=Obra fictícia|ano=2001}}</ref>
B.<ref>{{citar livro|ultimo=Exemplo|primeiro=Ana|titulo=Obra fictícia|ano=2001}}</ref>
```

**Depois**

```wikitext
A.<ref name="Exemplo2001-1">{{citar livro|ultimo=Exemplo|primeiro=Ana|titulo=Obra fictícia|ano=2001}}</ref>
B.<ref name="Exemplo2001-1" />
```

O nome ilustrado depende dos campos presentes e da disponibilidade. Nomes ocupados recebem desambiguação, e definições divergentes não são fundidas. Nomes possíveis presentes como argumentos literais de outras chamadas ficam reservados, inclusive na forma NFC, para que uma definição nova não capture uma identidade existente.

**Outro caso**

```wikitext
A<ref> Fonte. </ref> B<ref>Fonte.</ref>
```

```wikitext
A<ref name="ref-auto-1"> Fonte. </ref> B<ref name="ref-auto-1" />
```

Mesmo grupo e região; corpo simples com diferença apenas em espaços externos sem significado. Conserva o corpo da primeira definição e evita nomes ocupados.

### REF-07: Reutilizações adjacentes iguais

Retira a segunda chamada consecutiva da mesma fonte.

**Antes**

```wikitext
Texto.<ref name="a" /><ref name="a" />
```

**Depois**

```wikitext
Texto.<ref name="a" />
```

Definições e reutilizações em pontos diferentes do texto ficam intactas.

### REF-08: Aviso de ligação inativa no campo próprio

Leva a data existente do aviso ao campo datali da citação.

**Antes**

```wikitext
<ref>{{citar web|url=https://example.invalid/|titulo=Documento}}{{Ligação inativa|data=novembro de 2026}}</ref>
```

**Depois**

```wikitext
<ref>{{citar web|url=https://example.invalid/|titulo=Documento|datali=novembro de 2026}}</ref>
```

Exige uma data de calendário reconhecida já informada, uma única citação web ou de jornal associada e URL principal inequívoca. Não inventa datas, remove arquivos ou sobrescreve campos divergentes.

### REF-09: Grupo único de notas explicativas

Adapta um grupo importado quando todos os seus produtores e coletores têm a mesma função.

**Antes**

```wikitext
Texto<ref group="note">Explicação.</ref>.<ref>Fonte.</ref>
== Notas ==
<references group="note"/>

<references/>
```

**Depois**

```wikitext
Texto<ref group="nota">Explicação.</ref>.<ref>Fonte.</ref>
{{Notas e referências}}
```

Se houver outro grupo específico, numeração própria ou produção indireta não conferida, a identidade dos grupos permanece.

### REF-10: Coletor que falta para notas

Acrescenta a lista de notas reconhecidas quando as chamadas existem e falta o coletor.

**Antes**

```wikitext
Texto{{Nre|Explicação.}}.<ref>Fonte.</ref>
{{Referências}}
```

**Depois**

```wikitext
Texto{{Nre|Explicação.}}.<ref>Fonte.</ref>
{{Notas e referências}}
```

Exige confirmar o tipo de nota e o lugar em que suas definições podem ser recolhidas.

### REF-11: Referência definida na primeira chamada

Leva uma definição única para sua primeira reutilização, mantendo as chamadas seguintes.

**Antes**

```wikitext
A.<ref name="a" />
B.<ref name="a">Fonte.</ref>
```

**Depois**

```wikitext
A.<ref name="a">Fonte.</ref>
B.<ref name="a" />
```

Exige a mesma identidade, grupo e conteúdo, sem produção dinâmica ou cópia protegida.

### REF-12: Nomes numéricos inválidos

Substitui nomes exclusivamente numéricos e todas as suas chamadas por um nome válido.

**Antes**

```wikitext
A.<ref name="123">Fonte.</ref> B.<ref name="123" />
```

**Depois**

```wikitext
A.<ref name="ref-123">Fonte.</ref> B.<ref name="ref-123" />
```

O nome ilustrado pode receber outro sufixo se já existir. Não altera nomes não numéricos por semelhança. Um nome numérico, por si só, não demonstra ausência de definição; retirar uma reutilização exige outro inventário completo.

### REF-13: Aspas quebradas no nome da fonte

Corrige duplicação inequívoca do delimitador do nome.

**Antes**

```wikitext
Uma referência com delimitador de nome duplicado e família de chamadas conferida.
```

**Depois**

```wikitext
A mesma família com o delimitador corrigido, conservando definição e reutilizações.
```

A correção precisa preservar o vínculo de todas as chamadas.

### REF-14: Sintaxe local das etiquetas ref

Repara grafias ou fechamentos finitos em limites confirmados.

**Antes**

```wikitext
Uma etiqueta ref com erro exato de sintaxe e limites inequívocos.
```

**Depois**

```wikitext
A mesma etiqueta com sintaxe válida, sem mudar o conteúdo da fonte.
```

Não fecha uma referência a partir de uma suposição sobre onde termina a fonte.

### REF-15: Referências com ligação simples

Adapta uma referência que contém somente um endereço ou uma ligação simples quando há dados suficientes.

**Antes**

```wikitext
<ref>[https://example.invalid/ Documento fictício]</ref>
```

**Depois**

```wikitext
<ref>{{citar web|url=https://example.invalid/|titulo=Documento fictício}}</ref>
```

Não inventa autoria, data, editora ou data de acesso.

### REF-16: Notas com referência interna

Usa um invólucro nativo nos casos em que uma nota precisa conter outra referência.

**Antes**

```wikitext
<ref group="nota">Explicação.<ref>Fonte da explicação.</ref></ref>
```

**Depois**

```wikitext
{{Refn|1=Explicação.<ref>Fonte da explicação.</ref>|group=nota}}
```

A transformação exige conferir o coletor, os atributos e a ligação com o grupo.

### REF-17: Citações abreviadas e bibliografia

Corrige destinos e campos de citações abreviadas nos contratos previstos.

**Antes**

```wikitext
{{harvnb|Exemplo|2001|loc=capítulo 2|pp=10–12}}
```

**Depois**

```wikitext
{{harvnb|Exemplo|2001|loc=capítulo 2|pp=10–12}}
```

Uma chamada válida permanece. Só há reparo quando o destino ou parâmetro pode ser comprovado, sem inventar uma obra.

### REF-18: Nomes descritivos de referências

Substitui famílias automáticas reconhecidas por nomes derivados dos metadados da própria fonte, com as técnicas de NomeRefAuto.

**Antes**

```wikitext
<ref name=":0">{{citar livro|ultimo=Exemplo|titulo=Obra fictícia|ano=2001}}</ref> Texto.<ref name=":0" />
```

**Depois**

```wikitext
<ref name="Exemplo2001-1">{{citar livro|ultimo=Exemplo|titulo=Obra fictícia|ano=2001}}</ref> Texto.<ref name="Exemplo2001-1" />
```

Prioridade: colaborador, autor, editor, periódico, enciclopédia, título, título do livro e domínio da URL. Usa até quatro nomes e o ano de publicação, nunca o ano de acesso. Conserva nomes descritivos existentes e atualiza a família inteira, com um sufixo numérico para evitar colisões. Não insere predefinições no atributo name nem faz uma consulta externa por referência. Argumentos literais de outras chamadas reservam identidades possíveis. Se uma chamada puder consumir o nome antigo, a família fica intacta. A comparação de nomes ocupados também considera NFC, sem reescrever os nomes existentes. Anos conflitantes ou intervalos sem um ano único mantêm a alternativa neutra.

### REF-19: Nomes automáticos antigos

Retira a identificação antiga do programa dos nomes de fontes e atualiza as chamadas.

**Antes**

```wikitext
A.<ref name="RevisaWiki-auto-7">Fonte.</ref> B.<ref name="RevisaWiki-auto-7" />
```

**Depois**

```wikitext
A.<ref name="ref-auto-7">Fonte.</ref> B.<ref name="ref-auto-7" />
```

Pode usar um nome derivado da fonte quando há metadados reconhecidos. Na ausência deles, conserva a nomeação neutra e evita colisões.

### REF-20: Mesma definição em toda a página

Aplica reparos de uma definição nomeada junto das cópias que dependem dela.

**Antes**

```wikitext
Duas referências com o mesmo nome e corpos diferentes.
```

**Depois**

```wikitext
Os dois corpos continuam distintos, sem declarar fontes diferentes como iguais.
```

Quando há prova suficiente, nomes conflitantes recebem desambiguação e chamadas relacionadas são conservadas. Uma cópia protegida impede alterações incompatíveis nas demais.

### REF-21: Cabeçalhos vazios que repetem o coletor

Retira uma cadeia vazia de títulos que apenas anuncia a mesma lista.

**Antes**

```wikitext
== Referências ==
===Notas===
{{Referências}}
```

**Depois**

```wikitext
{{Referências}}
```

Os títulos precisam estar junto de seu coletor. Texto de notas, bibliografia e conteúdo entre títulos permanecem.

### REF-22: Rodapé de notas importado

Adapta um coletor de notas estrangeiro quando todas as notas daquele grupo podem ser conferidas.

**Antes**

```wikitext
Texto<ref group="nota">Nota.</ref>
{{NoteFoot}}
```

**Depois**

```wikitext
Texto<ref group="nota">Nota.</ref>
{{Notas}}
```

Exige um grupo único observado, sem produtores opacos ou listas com funções diferentes. Não mistura grupos de propósito distinto.

### REF-23: Definições nomeadas repetidas em pontos separados

Mantém uma definição e usa chamadas no lugar de cópias idênticas da mesma fonte.

**Antes**

```wikitext
A.<ref name="a">Fonte.</ref>
B.<ref name="a">Fonte.</ref>
```

**Depois**

```wikitext
A.<ref name="a">Fonte.</ref>
B.<ref name="a" />
```

Nome, grupo, atributos e corpo precisam ser equivalentes. A posição de cada chamada é preservada. Fontes com corpos diferentes não são declaradas iguais.

### REF-24: Metadados complementares da mesma obra

Reúne dados bibliográficos complementares em referências comprovadamente da mesma obra.

**Antes**

```wikitext
Duas referências com título, ano, editora, ISBN válido e autoria iguais, uma delas com idioma ou ligação adicional.
```

**Depois**

```wikitext
Uma definição com os dados complementares e as mesmas chamadas nos pontos de citação.
```

A união é restrita a livros com identidade exata. Páginas, capítulos, edições ou outros localizadores conflitantes impedem a união.

### REF-25: Atributos nativos de referência

Adapta nome/grupo para name/group em etiquetas ref literais.

**Antes**

```wikitext
A<ref nome="a" grupo="nota">Fonte.</ref> B<ref nome="a" grupo="nota"/>
```

**Depois**

```wikitext
A<ref name="a" group="nota">Fonte.</ref> B<ref name="a" group="nota"/>
```

Definição e reutilizações coerentes; sem colisões ou atributos desconhecidos. Conserva corpo e grupo.

### REF-26: Operadores finitos nos atributos

Repara dois operadores incorretos em atributos conhecidos.

**Antes**

```wikitext
A<ref name:"a">Fonte.</ref> B<ref name=="a"/>
```

**Depois**

```wikitext
A<ref name="a">Fonte.</ref> B<ref name="a"/>
```

Somente : e == na estrutura comprovada. Exemplos citados, nomes dinâmicos e conflitos permanecem.

### REF-27: Reutilização sem definição comprovada

Retira só uma chamada cuja falta de definição foi confirmada.

**Antes**

```wikitext
Texto<ref name="ausente"/> continua.
```

**Depois**

```wikitext
Texto continua.
```

Página completa, nome/grupo, definições posteriores, bancos e helpers conferidos. Produtor opaco retém a chamada sem bloquear outros ajustes; nome numérico não prova ausência.

## Parâmetros e conteúdo das citações

### CIT-01: Predefinições bibliográficas em português

Adapta nomes estrangeiros aos modelos nativos com função equivalente.

**Antes**

```wikitext
{{cite web|url=https://example.invalid/|title=Documento|access-date=November 1, 2026}}
```

**Depois**

```wikitext
{{Citar web|url=https://example.invalid/|título=Documento|acessodata=1 de novembro de 2026}}
```

O nome exato e a capitalização da saída seguem o mapa conferido. Não transforma indistintamente toda Citation em Citar web. Um argumento opaco vizinho não impede reparos conhecidos e independentes; seu conteúdo permanece.

### CIT-02: Chaves inglesas também aceitas

Prefere os nomes portugueses conferidos, mesmo quando o alias inglês continua funcionando.

**Antes**

```wikitext
{{citar web|url=https://example.invalid/|title=Documento|access-date=November 1, 2026}}
```

**Depois**

```wikitext
{{citar web|url=https://example.invalid/|título=Documento|acessodata=1 de novembro de 2026}}
```

O destino deve ter a mesma função e prioridade. vauthors e veditors podem permanecer em inglês quando a versão nativa precisa dessas chaves. Os campos nativos url-status=live e url-status=dead são preservados para manter a função dos endereços original e arquivado. Em citações compatíveis, website corresponde a obra e publisher a publicado. Mesmo nome no veículo e na entidade não prova erro ou redundância; URL e aparência do nome não comprovam inversão.

### CIT-03: Autores numerados

Conserva os índices ao adaptar sobrenome, prenome e ligação de autores.

**Antes**

```wikitext
{{citar livro|last1=Exemplo|first1=Ana|last2=Modelo|first2=Bruno|title=Obra}}
```

**Depois**

```wikitext
{{citar livro|ultimo1=Exemplo|primeiro1=Ana|ultimo2=Modelo|primeiro2=Bruno|título=Obra}}
```

Só usa campos reconhecidos pela família bibliográfica.

### CIT-04: Campos repetidos idênticos

Consolida um parâmetro repetido com o mesmo valor.

**Antes**

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento|titulo=Documento}}
```

**Depois**

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento}}
```

Valores divergentes ou com prioridades diferentes permanecem.

### CIT-05: Parâmetros inválidos vazios

Retira um campo vazio que o modelo conhecido não utiliza.

**Antes**

```wikitext
Um campo vazio comprovadamente inexistente em um modelo cujo catálogo está completo.
```

**Depois**

```wikitext
A mesma chamada sem o campo vazio.
```

Não apaga campos preenchidos para eliminar um aviso. Catálogos parciais não autorizam exclusão genérica.

### CIT-06: Erros exatos no nome dos campos

Corrige uma chave com correspondência única no modelo.

**Antes**

```wikitext
{{citar web|url=https://example.invalid/|títutlo=Documento}}
```

**Depois**

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento}}
```

Usa mapas finitos e o leitor nativo, sem substituir palavras por aproximação livre.

**Outro caso**

```wikitext
{{Citar livro|url_seção=https://example.invalid/capitulo}}
```

```wikitext
{{Citar livro|capítulourl=https://example.invalid/capitulo}}
```

Modelo e papel nativo comprovados; sem inventar capitulo-url ou sobrescrever alvo conflitante.

**Outro caso**

```wikitext
{{Citar web|status-url=dead}}
```

```wikitext
{{Citar web|urlmorta=sim}}
```

Caso finito status-url=dead. Não é substituição geral de url-status ou nomes parecidos.

### CIT-07: Barra literal no título

Recupera um trecho de título partido por uma barra vertical quando os limites são inequívocos.

**Antes**

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento | ciência aplicada |data=2024}}
```

**Depois**

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento {{!}} ciência aplicada |data=2024}}
```

Um argumento que também pode ser um parâmetro ou campo separado não é absorvido por suposição.

### CIT-08: Campo caderno e localizadores

Migra um campo de caderno somente para o campo nativo que mantém sua função.

**Antes**

```wikitext
|caderno=Ciência
```

**Depois**

```wikitext
|departamento=Ciência
```

Exige jornal e domínio concordantes, caderno previsto e campo de destino aceito. Não migra um caderno de publicação desconhecida nem trata capítulo, página, seção e número de artigo como sinônimos.

**Outro caso**

```wikitext
{{Citar livro|páginas=pág. 12–14}}
```

```wikitext
{{Citar livro|páginas=12–14}}
```

Rótulo inequívoco e localizador numérico ou romano aceito; intervalo e outros localizadores permanecem.

### CIT-09: Datas bibliográficas literais

Normaliza datas completas ou parciais reconhecidas e mantém sua precisão.

**Antes**

```wikitext
{{citar web|titulo=Documento|data=April 3, 2020}}
```

**Depois**

```wikitext
{{citar web|titulo=Documento|data=3 de abril de 2020}}
```

Datas impossíveis ou numéricas ambíguas permanecem. O campo de embargo pode exigir ISO.

### CIT-10: Acesso e assinatura

Adapta a chave e os valores de acesso reconhecidos sem remover a informação de assinatura.

**Antes**

```wikitext
{{citar web|titulo=Documento|url=https://example.invalid/|url-access=subscription}}
```

**Depois**

```wikitext
{{citar web|titulo=Documento|url=https://example.invalid/|acessourl=subscrição}}
```

A equivalência depende dos valores aceitos pelo modelo nativo. Um valor não reconhecido não é apagado.

### CIT-11: Endereços e datas de arquivo

Adapta campos de arquivamento, preservando os endereços e a data informada.

**Antes**

```wikitext
{{citar web|title=Documento|archive-url=https://example.invalid/arquivo|archive-date=April 3, 2020}}
```

**Depois**

```wikitext
{{citar web|título=Documento|arquivourl=https://example.invalid/arquivo|arquivodata=3 de abril de 2020}}
```

Não substitui uma data de arquivo por uma data de publicação.

**Outro caso**

```wikitext
{{Citar web|arquivodata=https://example.invalid/arquivo|arquivourl=2020-04-03}}
```

```wikitext
{{Citar web|arquivodata=2020-04-03|arquivourl=https://example.invalid/arquivo}}
```

Par complementar na mesma citação, com valores preservados e sem conflito. Não inventa datas.

### CIT-12: Data de captura já escrita na URL

Aproveita um carimbo Wayback completo e válido quando o endereço original corresponde.

**Antes**

```wikitext
{{citar web|url=https://example.invalid/a|titulo=Documento|arquivourl=https://web.archive.org/web/20200403000000/https://example.invalid/a}}
```

**Depois**

```wikitext
{{citar web|url=https://example.invalid/a|titulo=Documento|arquivourl=https://web.archive.org/web/20200403000000/https://example.invalid/a|arquivodata=2020-04-03}}
```

Sem carimbo completo, correspondência de endereço e ausência de conflito, nenhuma data é preenchida.

### CIT-13: DOI com pontuação excedente

Retira pontuação final apenas quando o identificador correto é confirmado.

**Antes**

```wikitext
|doi=10.0000/exemplo.
```

**Depois**

```wikitext
|doi=10.0000/exemplo
```

O exemplo representa o campo. Exige confirmação do identificador, não elimina pontuação válida de DOI.

### CIT-14: ISBN e repetições

Retira um ponto final ou uma repetição quando resta um ISBN válido.

**Antes**

```wikitext
|isbn=9780306406157.
```

**Depois**

```wikitext
|isbn=9780306406157
```

Pares válidos de ISBN-10 e ISBN-13 e números diferentes não são eliminados.

**Outro caso**

```wikitext
[[ISBN]] [[Special:BookSources/9780306406157|978-0-306-40615-7]]
```

```wikitext
{{ISBN|978-0-306-40615-7}}
```

Mesmo número nas duas ligações e dígito verificador válido; mantém a grafia exibida.

### CIT-15: Identificadores em ligações

Reconhece as formas previstas de DOI, PMID, PMC, arXiv e identificadores bibliográficos sem alterar seus valores.

**Antes**

```wikitext
|doi=https://doi.org/10.0000/exemplo
```

**Depois**

```wikitext
|doi=10.0000/exemplo
```

Só normaliza uma forma literal cuja equivalência é confirmada.

### CIT-16: Campo título recuperável localmente

Recupera um título ausente de outra citação compatível da mesma fonte na página.

**Antes**

```wikitext
{{citar web|url=https://example.invalid/a}}
```

**Depois**

```wikitext
{{citar web|url=https://example.invalid/a|titulo=Documento fictício}}
```

Exige uma ocorrência local inequívoca com esse título e os mesmos campos de identidade. Não cria o título a partir do endereço.

### CIT-17: Lista Vancouver e falha Lua

Usa a chave que o módulo nativo realmente lê para listas Vancouver.

**Antes**

```wikitext
{{citar periódico|vautores=Exemplo A|titulo=Artigo}}
```

**Depois**

```wikitext
{{citar periódico|vauthors=Exemplo A|titulo=Artigo}}
```

A exceção em inglês evita a falha conferida do módulo. Não troca autoria por inferência.

### CIT-18: Limites perdidos entre campos

Recupera separadores e rótulos de campo colados nos casos finitos previstos.

**Antes**

```wikitext
{{citar web url=https://example.invalid/|titulo=Documento}}
```

**Depois**

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento}}
```

Só há reparo quando modelo, chave e limites são únicos.

### CIT-19: Formatação compacta de citações

Coloca citações reconhecidas em uma linha sem juntar conteúdo que depende de quebras.

**Antes**

```wikitext
{{citar web
|url=https://example.invalid/
|titulo=Documento
}}
```

**Depois**

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento}}
```

Protege listas, comentários, código e valores em que a quebra tem função.

### CIT-20: Obras históricas e modelos importados

Migra as famílias históricas conferidas sem manter categorias técnicas inglesas indevidas.

**Antes**

```wikitext
Uma citação histórica importada com obra, verbete e ano completos.
```

**Depois**

```wikitext
Uma citação nativa equivalente, com os mesmos dados bibliográficos.
```

A família e os campos precisam constar do catálogo. Não é uma remoção geral de categorias desconhecidas.

### CIT-21: Citation com consumidor português confirmado

Converte a chamada genérica para o modelo nativo do tipo de publicação identificado.

**Antes**

```wikitext
{{Citation|titulo=Obra|publicado=Editora|ano=2005}}
```

**Depois**

```wikitext
{{Citar livro|titulo=Obra|publicado=Editora|ano=2005|ref=harv}}
```

Exige dados suficientes para distinguir livro, web, jornal, periódico ou revista, sem perder a função de campos. Mantém as âncoras Harvard implícitas por ref=harv quando necessário.

### CIT-22: Edição bibliográfica em português

Adapta ordinais estrangeiros reconhecidos ao valor português.

**Antes**

```wikitext
|edição=2nd
```

**Depois**

```wikitext
|edição=2.ª
```

O número e o sufixo precisam formar um ordinal válido no campo de edição de uma citação reconhecida. Texto livre e combinações inválidas permanecem.

### CIT-23: Referências bíblicas com intervalos preservados

Adapta livros e intervalos de versículos previstos para Citar bíblia.

**Antes**

```wikitext
{{Bibleverse|Titus|2:1–3}}
```

**Depois**

```wikitext
{{Citar bíblia|livro=Tito|capítulo=2|verso=1|verso_final=3}}
```

O mapeamento é finito e conserva os dois extremos no mesmo capítulo. Versões sem equivalente, intervalos entre capítulos e chamadas ambíguas permanecem.

### CIT-24: Destinos bibliográficos com identidade confirmada

Corrige um destino importado de autor, editor ou obra quando o equivalente português foi conferido.

**Antes**

```wikitext
Ligação bibliográfica com homônimo cujo destino e identidade já foram comprovados.
```

**Depois**

```wikitext
A mesma ligação com o destino canônico conferido.
```

Somente destinos finitos de identidade confirmada. Não escolhe homônimos pelo nome nem inventa identidade para o exemplo.

### CIT-25: Resíduos acidentais no título simples

Troca quebra acidental por espaço e retira U+200B acidental no contexto confirmado.

**Antes**

```wikitext
{{Citar web|título=Parte
seguinte}}
```

**Depois**

```wikitext
{{Citar web|título=Parte seguinte}}
```

Títulos latinos simples; marcação, URLs, múltiplos parágrafos e separadores de outras escritas ficam. Sem limpeza global de invisíveis.

### CIT-26: Campos conhecidos junto de um campo opaco

Completa reparos independentes conservando o argumento desconhecido.

**Antes**

```wikitext
{{Ouvrage|titre=Obra|année=2024|champinconnu=valor}}
```

**Depois**

```wikitext
{{Citar livro|título=Obra|ano=2024|champinconnu=valor}}
```

Exemplo ilustrativo. Só campos com papel comprovado mudam; valores opacos e conflitos permanecem.

### CIT-27: Prefixo PMC sem o teto antigo

Normaliza o prefixo literal mantendo todos os dígitos.

**Antes**

```wikitext
{{Citar periódico|pmc=PMC10730720}}
```

**Depois**

```wikitext
{{Citar periódico|pmc=10730720}}
```

Normalização do código; não prova existência ou correção bibliográfica do identificador.

## Infocaixas e biografias

### BIO-01: Campos de infocaixas conforme cada modelo

Adapta chaves estrangeiras ou traduzidas incorretamente ao nome aceito pela caixa específica.

**Antes**

```wikitext
{{Info/Biografia|birth_place=Cidade fictícia}}
```

**Depois**

```wikitext
{{Info/Biografia|local_nascimento=Cidade fictícia}}
```

O mesmo campo inglês pode ter destinos diferentes em caixas diferentes. Nenhum valor preenchido é descartado para silenciar um aviso.

### BIO-02: Prioridade dos nomes alternativos

Preserva o valor que a caixa nativa efetivamente escolhe.

**Antes**

```wikitext
{{Info/Biografia|ocupação=pesquisadora|ocupações=}}
```

**Depois**

```wikitext
{{Info/Biografia|ocupação=pesquisadora}}
```

Campos conflitantes ou alternativas com função diferente não são fundidos.

### BIO-03: Infocaixa antes da introdução

Move uma única caixa principal que ficou depois da abertura para o começo do artigo.

**Antes**

```wikitext
'''Pessoa fictícia''' foi pesquisadora.
{{Info/Biografia|nome=Pessoa fictícia}}
```

**Depois**

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
'''Pessoa fictícia''' foi pesquisadora.
```

Não reorganiza uma caixa que pertence a outra pessoa, outra seção ou a uma sequência de caixas com função distinta.

### BIO-04: Linha própria depois da infocaixa

Separa uma caixa fechada do texto da abertura.

**Antes**

```wikitext
{{Info/Biografia/Wikidata}}'''Pessoa fictícia''' foi pesquisadora.
```

**Depois**

```wikitext
{{Info/Biografia/Wikidata}}
'''Pessoa fictícia''' foi pesquisadora.
```

Não altera o conteúdo da caixa ou da frase.

### BIO-05: Infocaixa legível em linhas

Distribui os campos nomeados de infocaixas reconhecidas em linhas e mantém sua ordem, inclusive em caixas filhas elegíveis.

**Antes**

```wikitext
{{Info/Assentamento/Marrocos|com|nome=Local fictício|população_total=1000}}
```

**Depois**

```wikitext
{{Info/Assentamento/Marrocos|com
|nome=Local fictício
|população_total=1000
}}
```

Exige uma chamada completa e campos literais legíveis. Preserva parâmetros posicionais, nomes dinâmicos, valores e espaços com significado. O reconhecimento de uma caixa não autoriza traduzir todos os seus campos.

### BIO-06: Alinhamento e espaço depois do igual

Alinha os campos nos modelos previstos e retira o espaço horizontal depois de = em argumentos reconhecidos.

**Antes**

```wikitext
|nome                  = Pessoa fictícia
```

**Depois**

```wikitext
|nome                  =Pessoa fictícia
```

Retira somente espaços ASCII de formatação em argumentos nomeados reconhecidos. Espaços inseparáveis e outros espaços que fazem parte do valor são mantidos.

### BIO-07: Cabeçalho sem negrito redundante

Retira negrito do nome quando a caixa já o aplica.

**Antes**

```wikitext
{{Info/Biografia|nome='''Pessoa fictícia'''}}
```

**Depois**

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
```

Só alcança o campo de cabeçalho conferido, não o nome em negrito da introdução.

### BIO-08: Profissões comuns com inicial minúscula

Corrige a capitalização em campos de profissão reconhecidos.

**Antes**

```wikitext
|ocupação=Jornalista
```

**Depois**

```wikitext
|ocupação=jornalista
```

Nomes próprios, títulos, siglas, citações e valores ambíguos são preservados.

### BIO-09: Flexão de profissões confirmada

Corrige formas comuns incompatíveis com a identidade feminina ou masculina explicitamente confirmada.

**Antes**

```wikitext
|ocupação=jornalista e redator
```

**Depois**

```wikitext
|ocupação=jornalista e redatora
```

O exemplo exige identidade feminina confirmada e profissão prevista no mapa. Não deduz gênero só pelo nome.

### BIO-10: Listas de ocupações e campos

Organiza listas simples que foram coladas em um campo.

**Antes**

```wikitext
|ocupação=ator, cantor
```

**Depois**

```wikitext
|ocupação=ator<br />cantor
```

Exige uma lista de termos reconhecidos, sem transformar uma frase explicativa.

### BIO-11: Datas de nascimento e morte

Adapta formatos literais e predefinições estrangeiras de data ao campo nativo.

**Antes**

```wikitext
|nascimento_data=1900-01-02
```

**Depois**

```wikitext
|nascimento_data={{DataExt|2|1|1900}}
```

Conserva precisão, calendário, referências e incertezas. Não inventa dia ou mês. Ani e grafias válidas de dni/Dni não mudam por preferência de estilo; uma conversão de data também precisa preservar idade e efeitos de categorização.

### BIO-12: Idade de pessoa viva

Retira a supressão de idade quando a condição de pessoa viva está confirmada.

**Antes**

```wikitext
{{Dni|2|1|1990|si}}
```

**Depois**

```wikitext
{{Dni|2|1|1990}}
```

Não altera uma pessoa morta ou de estado vital incerto. Não muda dni para Dni apenas por capitalização.

### BIO-13: Nascimento e morte na abertura

Leva dados já presentes e referenciados da infocaixa à abertura quando falta a apresentação biográfica.

**Antes**

```wikitext
'''Pessoa fictícia''' foi pesquisadora.
```

**Depois**

```wikitext
'''Pessoa fictícia''' ({{DataExt|2|1|1900}}<ref>Fonte da data.</ref>) foi pesquisadora.
```

O exemplo exige a data e a mesma referência na caixa principal. Sem fonte, com conflito ou caixa filha de outra pessoa, o dado não é copiado.

### BIO-14: Dados da abertura em campos separados

Separa data e local que foram unidos em um campo e aproveita dados inequívocos da abertura.

**Antes**

```wikitext
|nascimento_data={{DataExt|2|1|1900}}, [[Cidade fictícia]]
```

**Depois**

```wikitext
|nascimento_data={{DataExt|2|1|1900}}
|nascimento_local=[[Cidade fictícia]]
```

Preserva as referências de cada componente e não substitui um campo preenchido divergente.

### BIO-15: Categoria de nascimento redundante

Retira a categoria anual escrita à mão quando a chamada de data já a produz.

**Antes**

```wikitext
{{Dni|2|1|1900|si}}
[[Categoria:Nascidos em 1900]]
```

**Depois**

```wikitext
{{Dni|2|1|1900|si}}
```

Exige confirmar a categorização nativa no mesmo contexto e preservar chave de ordenação ou diferença funcional.

### BIO-16: Casamento com datas e estado civil

Usa Casamento para formatos literais completos previstos, sem alterar nome, datas ou motivo do término.

**Antes**

```wikitext
|cônjuge=Pessoa Exemplo (casamento em 2000; divórcio em 2010)
```

**Depois**

```wikitext
|cônjuge={{casamento|Pessoa Exemplo|2000|2010|fim=divórcio}}
```

Só converte as formas e os campos conferidos. Relações incertas, datas ambíguas ou múltiplas pessoas sem limites ficam como estão.

### BIO-17: Site oficial conforme o leitor da caixa

Corrige sintaxe de endereço, protocolo repetido e apresentação conforme o campo nativo.

**Antes**

```wikitext
|website=[[https://example.invalid/|Sítio oficial]]
```

**Depois**

```wikitext
|site=[https://example.invalid/ Sítio oficial]
```

Algumas caixas esperam uma URL pura, outras aceitam ligação rotulada. A regra respeita o leitor, sem trocar o domínio. As preferências conferidas por modelo são exatas: website/homepage→site em Info/Empresa e website→sítio em Info/Assentamento, sem aliases concorrentes. Não há website→obra em infocaixas.

### BIO-18: Arquivo, tamanho e legenda em campos próprios

Separa uma imagem completa colocada no campo que espera o nome do arquivo.

**Antes**

```wikitext
|imagem=[[Ficheiro:Retrato fictício.jpg|220px|Retrato em 2000]]
```

**Depois**

```wikitext
|imagem=Retrato fictício.jpg
|imagem_tamanho=220px
|imagem_legenda=Retrato em 2000
```

Exige campos de destino conferidos e ausência de legenda ou tamanho concorrente.

### BIO-19: Texto alternativo da imagem

Conserva e, quando possível, separa alt para o campo nativo equivalente.

**Antes**

```wikitext
|imagem=[[Ficheiro:Retrato fictício.jpg|220px|alt=Retrato frontal]]
```

**Depois**

```wikitext
|imagem=Retrato fictício.jpg
|alt=Retrato frontal
|imagem_tamanho=220px
```

Não redige uma descrição visual nova nem a infere do arquivo.

### BIO-20: Tamanho de imagem com unidade repetida

Corrige unidades repetidas em campos confirmados.

**Antes**

```wikitext
|imagem_tamanho=220pxpx
```

**Depois**

```wikitext
|imagem_tamanho=220px
```

Não impõe uma largura universal nem altera um valor válido só por preferência.

### BIO-21: Campos de unidades nativas

Retira uma unidade repetida quando a caixa a acrescenta por conta própria.

**Antes**

```wikitext
{{Info/Piloto de automóvel|altura=1,80 m}}
```

**Depois**

```wikitext
{{Info/Piloto de automóvel|altura=1,80}}
```

A unidade deve ser confirmada para o campo, sem converter o valor numérico.

### BIO-22: Caixas incorporadas

Reconhece módulos internos compatíveis e mantém os dados de cada caixa.

**Antes**

```wikitext
{{Info/Biografia|nome=Pessoa fictícia|módulo={{Info/Cientista|incorporar=sim}}}}
```

**Depois**

```wikitext
{{Info/Biografia|nome=Pessoa fictícia|módulo={{Info/Cientista|incorporar=sim}}}}
```

A caixa filha precisa aceitar incorporação. A Info/Biografia usa módulo e módulo2 a módulo6, sem criar módulo1. Os campos da filha podem ser separados em linhas sem extrair a filha de seu campo.

### BIO-23: Caixas principais repetidas

Retira uma cópia de infocaixa comprovadamente redundante.

**Antes**

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
{{Info/Biografia|nome=Pessoa fictícia}}
```

**Depois**

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
```

Não escolhe entre caixas com fatos diferentes nem remove caixas de assuntos diferentes.

### BIO-24: Campos com significado próprio

Mantém campos cuja migração mudaria o fato descrito.

**Antes**

```wikitext
|batismo=2 de janeiro de 1900
|instituições=Instituição fictícia
```

**Depois**

```wikitext
|batismo=2 de janeiro de 1900
|instituições=Instituição fictícia
```

Batismo não vira nascimento. Instituição, empregador, gênero literário, influência e sepultamento dependem do contrato de cada modelo.

### BIO-25: Cabeçalho e campos estrangeiros migrados juntos

Migra uma infocaixa estrangeira ou parcialmente traduzida como uma unidade, com seus campos equivalentes.

**Antes**

```wikitext
{{Infobox person|birth_name=Pessoa Exemplo Completa|education=[[Universidade Exemplo]]|citizenship={{hlist|[[United Kingdom]]|[[Italy]]}}}}
```

**Depois**

```wikitext
Uma chamada Info/Biografia com nome_nascimento, educação e cidadania, mantendo os dois membros de hlist e seus destinos portugueses confirmados.
```

Cada campo precisa ter consumidor nativo verificado. Campos desconhecidos preenchidos ou aliases concorrentes impedem essa migração conjunta. Auxiliares válidos, folhas de estilo e ligações de instituições permanecem.

**Outro caso**

```wikitext
{{Infobox person|name=Pessoa fictícia|image_size=300px}}
```

```wikitext
{{Info/Biografia|nome=Pessoa fictícia|imagem_tamanho=300px}}
```

Ilustra a migração conjunta: image_size já não bloqueia sozinho a adaptação; os outros campos e o contrato da caixa continuam necessários.

### BIO-26: Grupos étnicos com todos os dados visíveis

Usa uma infocaixa genérica nos formatos estrangeiros certificados em que uma caixa específica deixaria campos sem exibição.

**Antes**

```wikitext
{{Infobox ethnic group|grupo=Grupo Exemplo|image=|população=20,074|regiões=[[Região Exemplo]]}}
```

**Depois**

```wikitext
Uma Infocaixa com Grupo Exemplo no cabeçalho e linhas próprias de População e Regiões, conservando 20,074 e a ligação.
```

A forma precisa corresponder ao padrão conferido, com imagem vazia e sem campos adicionais desconhecidos. Não interpreta separadores numéricos nem descarta regiões.

### BIO-27: Infocaixa manual com estrutura certificada

Adapta um padrão restrito de tabela manual para Infocaixa, mantendo os dados apresentados.

**Antes**

```wikitext
Uma tabela infobox vcard com cabeçalho, âncora e pares simples de rótulo e dado.
```

**Depois**

```wikitext
A mesma informação em Infocaixa, com âncora, rótulos, dados e ligações preservados.
```

Não converte qualquer tabela ou HTML parecido com uma caixa. Atributos, mesclagens, tabelas internas ou linhas fora do padrão impedem a conversão.

### BIO-28: Ani e efeitos da data preservados

Mantém uma chamada Ani válida quando a troca alteraria idade, categorias ou outro efeito do modelo.

**Antes**

```wikitext
{{Info/Biografia|data_nascimento={{Ani|1972|5|24}}}}
```

**Depois**

```wikitext
A chamada Ani permanece no campo, mesmo se a formatação externa da infocaixa mudar.
```

Uma semelhança visual não prova equivalência. As formas nativas de datas de pessoas falecidas também precisam conservar o estado vital e a idade ao falecer.

## Portais e controle de autoridade

### POR-01: Biografias confirmadas

Acrescenta Biografias quando há uma pessoa e um perfil confirmado, inclusive caixas Wikidata.

**Antes**

```wikitext
{{Portal3|Política}}
```

**Depois**

```wikitext
{{Portal3|Política|Biografias}}
```

Usa as famílias individuais verificadas e os aliases cadastrados, inclusive Info/Titular de cargo e caixas Wikidata elegíveis. Uma caixa genérica ou um título parecido não bastam. O reconhecimento da pessoa não depende de migrar todos os campos da caixa.

### POR-02: País sem duplicar o estado

Acrescenta o país apenas quando o dado é explícito e não há um portal regional que o torne redundante.

**Antes**

```wikitext
{{Portal3|Biografias|Goiás}}
```

**Depois**

```wikitext
{{Portal3|Biografias|Goiás}}
```

Usa campos explícitos de cidadania, nacionalidade ou nascimento conforme a infocaixa. Países homônimos e abreviaturas ambíguas de estados não são inferidos. Um portal regional reconhecido pode tornar o país redundante.

### POR-03: Mulheres

Acrescenta o portal nos perfis em que a identidade está confirmada.

**Antes**

```wikitext
{{Portal3|Biografias}}
```

**Depois**

```wikitext
{{Portal3|Biografias|Mulheres}}
```

Não deduz a identidade pelo prenome ou por uma palavra isolada.

### POR-04: Profissão e esporte

Acrescenta os portais previstos por profissão, área de trabalho ou modalidade explicitamente indicada.

**Antes**

```wikitext
Uma pessoa com caixa individual de futebolista, modalidade e país confirmados.
```

**Depois**

```wikitext
Portal3 com Biografias, Esportes, Futebol e o país elegível, além dos portais já existentes.
```

Preserva portais mais específicos e não classifica uma banda como uma pessoa.

### POR-05: Artes e ciências

Reconhece os perfis conferidos de artistas, músicos, escritores, militares e cientistas.

**Antes**

```wikitext
Uma caixa principal de cientista com disciplina confirmada.
```

**Depois**

```wikitext
Acrescenta somente os portais previstos para essa disciplina e Biografias.
```

Profissão, gênero artístico e instituição não são tratados como a mesma evidência.

### POR-06: Filmes, séries e obras musicais

Usa os modelos próprios de obras para reconhecer Cinema, Televisão e Música.

**Antes**

```wikitext
Um artigo com uma caixa nativa de álbum ou episódio de televisão.
```

**Depois**

```wikitext
Acrescenta os portais temáticos correspondentes, sem Biografias para a obra.
```

Requer caixa e perfil nativos, não apenas palavras no título.

### POR-07: Biologia e saúde

Usa perfis de taxonomia, medicamentos, doenças e demais caixas conferidas.

**Antes**

```wikitext
Uma caixa taxonômica de animal com classe confirmada.
```

**Depois**

```wikitext
Acrescenta os portais compatíveis, como Animais e a classe prevista no mapa.
```

Não identifica classe biológica, indicação clínica ou especialidade pela aparência do nome.

### POR-08: Demais assuntos

Reconhece livros, universidades, jornais, revistas científicas, municípios, rios, ilhas, conflitos, software, empresas, clubes, estádios, automóveis, moedas, partidos, eventos meteorológicos, cerveja e veículos espaciais nos perfis cadastrados.

**Antes**

```wikitext
Uma caixa nativa de rio ou software sem Portal3.
```

**Depois**

```wikitext
Acrescenta o portal específico previsto e conserva os já presentes.
```

O catálogo de perfis indica exatamente os modelos e condições ativados.

### POR-09: Esboço com assunto confirmado

Aproveita combinações conferidas de esboço e categoria para um portal temático.

**Antes**

```wikitext
Um artigo sem infocaixa, com esboço temático e categoria concordantes.
```

**Depois**

```wikitext
Acrescenta somente o portal que essa combinação confirma.
```

Um esboço genérico ou uma categoria isolada não autorizam classificação livre.

### POR-10: Nomes de portais importados

Troca nomes estrangeiros ou erros previstos por destinos portugueses existentes.

**Antes**

```wikitext
{{Portal3|Biography|Football}}
```

**Depois**

```wikitext
{{Portal3|Biografias|Futebol}}
```

Não traduz nomes ambíguos nem inventa portais inexistentes.

### POR-11: Posições e repetições em Portal3

Reúne portais equivalentes e normaliza posições reconhecidas sem criar 5= desnecessário.

**Antes**

```wikitext
{{Portal3|Biografias|Futebol|3=Brasil}}
```

**Depois**

```wikitext
{{Portal3|Biografias|Futebol|Brasil}}
```

Preserva opções nomeadas e a ordem válida. Não ultrapassa a capacidade confirmada de Portal3.

### POR-12: Posição do portal no rodapé

Move uma chamada isolada fora de lugar para o rodapé confirmado.

**Antes**

```wikitext
Texto.
{{Portal3|Ciência}}
== Referências ==
<references/>
```

**Depois**

```wikitext
Texto.
{{Referências}}

{{Portal3|Ciência}}
```

Não atravessa uma estrutura desconhecida, bloco protegido ou limite de seção sem prova.

### POR-13: Autoridade com algo para exibir

Acrescenta o controle apenas após confirmar identificadores que a chamada mostrará.

**Antes**

```wikitext
Rodapé de artigo com identificadores de autoridade confirmados no item correspondente.
```

**Depois**

```wikitext
{{Controle de autoridade}}
{{Portal3|Biografias}}
```

A presença de um item do Wikidata não basta. Sem identificadores exibíveis, não acrescenta uma caixa vazia.

### FOOT-04: Uma chamada efetiva de autoridade

Evita caixas duplicadas, inclusive por chamadas indiretas conferidas.

**Antes**

```wikitext
{{Controle de autoridade}}
{{Authority control}}
{{Portal3|Biografias}}
```

**Depois**

```wikitext
{{Controle de autoridade}}
{{Portal3|Biografias}}
```

NM e NF só são considerados quando sua expansão realmente fornece a mesma caixa. Seus anos e chave de ordenação ficam preservados. Cópias literais idênticas e adjacentes podem manter a última chamada. Uma chamada de ordenação ou um programa desconhecido entre as cópias impede tratá-las como duplicação simples. A mudança de posição também conserva a ordem de avaliação.

**Outro caso**

```wikitext
{{Controlo de autoria|VIAF=00123}}
```

```wikitext
{{Controle de autoridade|VIAF=00123}}
```

Alias exato, com identificadores, zeros e opções preservados. NM/NF conservam seus efeitos próprios.

### POR-14: Biografia reconhecida sem depender da tradução inteira

Permite que as regras biográficas atuem nas famílias pessoais e aliases verificados, ainda que outros campos estrangeiros precisem permanecer.

**Antes**

```wikitext
Uma Info/Titular de cargo individual reconhecida, sem Portal3.
```

**Depois**

```wikitext
O rodapé recebe Biografias e outros temas que os campos explícitos confirmarem.
```

As famílias são classificadas pelo modelo e sua identidade. Empresa, unidade militar, grupo étnico, animal e personagem não viram pessoa por terem campos parecidos.

### POR-15: Países em vários idiomas e escritas

Reconhece nomes portugueses, estrangeiros, endônimos, códigos e variantes conferidas para portais de países e territórios existentes.

**Antes**

```wikitext
Uma pessoa com cidadania=日本 em campo reconhecido, sem portal do país.
```

**Depois**

```wikitext
O rodapé pode receber Japão, além de Biografias e dos temas já existentes.
```

O mapa contém 197 destinos de países e territórios, não 197 países soberanos. Gentílicos são lidos em nacionalidade ou cidadania. Cidades, estados, abreviaturas postais e nomes ambíguos não bastam. Erros de uma letra só são aceitos no campo apropriado quando o destino é único.

### POR-16: País e guerra de uma unidade militar

Acrescenta o país da unidade e um conflito explicitamente indicado nos campos pertinentes.

**Antes**

```wikitext
{{Info/Unidade Militar|nome=Unidade Exemplo|país=Austrália|guerras/batalhas=[[Segunda Guerra Mundial]]}}
```

**Depois**

```wikitext
A unidade conserva seus dados e recebe Portal3 com Guerra, Austrália e Segunda Guerra Mundial.
```

O país deve estar no campo da unidade e o conflito no campo de guerras ou batalhas. Datas de atividade e países mencionados em legendas ou campanhas não servem como prova. Não acrescenta Biografias à unidade.

### POR-17: Portais por categorias exatas

Reúne portais compatíveis a partir da categoria real do assunto.

**Antes**

```wikitext
Artigo sobre futebol com [[Categoria:Futebol]], sem portal final.
```

**Depois**

```wikitext
Mesmo artigo com {{Portal3|Futebol|Esportes}} e a categoria preservada.
```

8337 categorias/540 destinos, não palavras soltas. Biografias exige categoria humana individual; equipes, organizações, listas e personagens não viram pessoas. Ambiguidade ou redirecionamento insuficiente retém o candidato.

### CAT-01: Categorias com prova referenciada

Acrescenta categoria existente com todos os critérios ancorados ao rascunho.

**Antes**

```wikitext
Artigo sem categorias temáticas, com tópico e fonte comprovados no perfil habilitado.
```

**Depois**

```wikitext
Mesmo artigo com a categoria existente específica permitida.
```

Exige ausência de qualquer categoria nativa reconhecida, incluindo as geradas por modelos. 10359 contratos/9913 destinos/43 perfis; só 171 contratos de 9 perfis possuem produtor P19/P31 materializado. Os demais, inclusive livros/filmes/esportes, ficam condicionais. A informação citada, a entidade e o tipo de categoria precisam coincidir com uma declaração referenciada do Wikidata que use o mesmo endereço de fonte. Essa comparação não inclui a leitura automática do corpo externo da referência. Não inverte o mapa de portais.

## Imagens e ligações

### IMG-01: Espaços de nomes e opções de imagem

Adapta Image e thumb no contexto de uma imagem reconhecida.

**Antes**

```wikitext
[[Image:Exemplo.jpg|thumb|220px|Uma paisagem.]]
```

**Depois**

```wikitext
[[Ficheiro:Exemplo.jpg|miniatura|220px|Uma paisagem.]]
```

Conserva arquivo, largura, legenda, alt e destino. File/Image locais podem usar Ficheiro. Ficheiro/Imagem/Arquivo portugueses válidos permanecem. Opções mudam apenas no consumidor verificado; galerias e texto livre não herdam tradução genérica.

### IMG-02: Miniaturada e erros previstos

Corrige opções digitadas incorretamente quando não são parte da legenda.

**Antes**

```wikitext
[[Imagem:Exemplo.jpg|miniaturada|220px|Uma paisagem.]]
```

**Depois**

```wikitext
[[Imagem:Exemplo.jpg|miniatura|220px|Uma paisagem.]]
```

Um termo dentro da legenda não é tratado como opção.

### IMG-03: Arquivo importado como endereço

Reconhece endereços de página de arquivo nos campos conferidos.

**Antes**

```wikitext
|imagem=https://commons.wikimedia.org/wiki/File:Exemplo.jpg
```

**Depois**

```wikitext
|imagem=Exemplo.jpg
```

Exige confirmar o mesmo arquivo e o formato esperado pelo campo.

### IMG-04: Tamanhos e sintaxe de opção

Repara unidades duplicadas e delimitadores previstos sem impor um tamanho a todas as imagens.

**Antes**

```wikitext
[[Imagem:Exemplo.jpg|miniatura|220pxpx|Legenda]]
```

**Depois**

```wikitext
[[Imagem:Exemplo.jpg|miniatura|220px|Legenda]]
```

Mantém opções funcionais e tamanhos válidos.

**Outro caso**

```wikitext
[[Ficheiro:Exemplo.svg|３００px|Legenda ３００]]
```

```wikitext
[[Ficheiro:Exemplo.svg|300px|Legenda ３００]]
```

Somente a dimensão reconhecida muda; nome, legenda e demais dígitos permanecem.

### LNK-01: Ligações internas sem pipe redundante

Simplifica uma ligação cujo rótulo é igual ao destino.

**Antes**

```wikitext
[[Ecossistema|Ecossistema]]
```

**Depois**

```wikitext
[[Ecossistema]]
```

Não retira rótulos com capitalização, flexão ou sentido diferente.

### LNK-02: Flexão simples fora da ligação

Põe uma terminação simples depois do link quando a leitura e o destino não mudam.

**Antes**

```wikitext
[[ecossistema|ecossistemas]]
```

**Depois**

```wikitext
[[ecossistema]]s
```

Depende do padrão confirmado. Não aplica um algoritmo livre de flexão.

### LNK-03: Fechamento único de ligação

Recupera um colchete faltante quando o limite é único.

**Antes**

```wikitext
Consulte [[Tema fictício] neste exemplo.
```

**Depois**

```wikitext
Consulte [[Tema fictício]] neste exemplo.
```

Várias aberturas ou limites concorrentes impedem a correção.

### LNK-04: Ligações externas com sintaxe interna

Corrige a marcação inequívoca de um endereço externo.

**Antes**

```wikitext
[[https://example.invalid/|Sítio oficial]]
```

**Depois**

```wikitext
[https://example.invalid/ Sítio oficial]
```

Uma barra que pertence à consulta da URL não é separador de rótulo.

### LNK-05: Rótulo externo partido

Substitui uma quebra indevida por espaço quando endereço e rótulo estão completos.

**Antes**

```wikitext
[https://example.invalid/
Documento fictício]
```

**Depois**

```wikitext
[https://example.invalid/ Documento fictício]
```

Não funde uma lista ou uma URL com limites incertos.

### LNK-06: Protocolos e ampersands previstos

Corrige repetições e codificação duplicada em padrões literais.

**Antes**

```wikitext
https://https://example.invalid/
```

**Depois**

```wikitext
https://example.invalid/
```

Não reescreve caminhos, parâmetros ou protocolos desconhecidos.

**Outro caso**

```wikitext
[https://https://example.invalid/a?id=2#sec Rótulo]
```

```wikitext
[https://example.invalid/a?id=2#sec Rótulo]
```

Protocolo igual repetido; preserva rótulo, consulta e fragmento, sem reinterpretar URLs aninhadas ou de arquivo.

### LNK-07: Título de seção com ligação

Retira a ligação do título e usa uma remissão principal quando essa equivalência está confirmada.

**Antes**

```wikitext
== [[Tema fictício]] ==
```

**Depois**

```wikitext
== Tema fictício ==
{{Artigo principal|Tema fictício}}
```

Exige destino existente, não ambíguo e diferente do próprio artigo, com equivalência confirmada. Não duplica remissão já presente, nem presume que todo link misturado no título seja o assunto principal.

### IMG-05: Uma imagem por linha

Separa incorporações de imagem no corpo e mantém uma linha vazia entre o conjunto e a prosa.

**Antes**

```wikitext
Texto.
[[Ficheiro:Example.jpg]] [[Ficheiro:Example2.jpg]]Outro texto.

```

**Depois**

```wikitext
Texto.

[[Ficheiro:Example.jpg]]
[[Ficheiro:Example2.jpg]]

Outro texto.

```

Não insere linha vazia entre imagens consecutivas. Preserva opções, legendas e imagens funcionais em galerias, tabelas, campos, listas e ícones em linha. Uma imagem ligada a referência ou auxiliar adjacente conserva o contexto.

### IMG-06: Bandeira decorativa para nome ligado

Substitui formas exatas de país nos campos civis habilitados.

**Antes**

```wikitext
Na Info/Biografia: |nacionalidade={{BRA}}
```

**Depois**

```wikitext
Na Info/Biografia: |nacionalidade=[[Brasil]]
```

Piloto: nacionalidade/cidadania em Info/Biografia; nacionalidade em Info/Político e Info/Ator. 1928 formas/195 entradas não são todas as variantes. Preserva contextos militares, esportivos, navais, históricos, geográficos ou disputados. Flag|BRA mantém BRA em [[Brasil|BRA]].

### LNK-08: Destino UTF-8 com rótulo conservado

Decodifica escapes não ASCII do destino sem alterar o rótulo.

**Antes**

```wikitext
[[Hist%C3%B3ria#Idade_M%C3%A9dia|Idade Média]]
```

**Depois**

```wikitext
[[História#Idade_Média|Idade Média]]
```

Só destino de artigo, rótulo explícito não vazio e UTF-8 válido. Preserva fragmento/rótulo. Não altera unpiped, arquivo, categoria, interwiki, ASCII codificado ou delimitador reservado. Quatro pares nativos tiveram HTML igual.

## Tabelas e sintaxe

### TAB-01: Aberturas e fechamentos de tabelas

Corrige erros finitos nos delimitadores quando cada tabela e cada célula continuam identificáveis.

**Antes**

```wikitext
Uma tabela completa com um delimitador digitado incorretamente e fechamento único.
```

**Depois**

```wikitext
A mesma tabela com o delimitador correto e as mesmas células.
```

Não fecha uma tabela arbitrariamente no fim do artigo nem corta células para caber na tela.

### TAB-02: Aspas dos atributos

Troca aspas tipográficas por delimitadores válidos de atributo.

**Antes**

```wikitext
! scope=“col” | Nome
```

**Depois**

```wikitext
! scope="col" | Nome
```

Conserva o texto das células e as strings em que as aspas são conteúdo.

### TAB-03: Cabeçalhos simples acessíveis

Acrescenta scope aos cabeçalhos elegíveis.

**Antes**

```wikitext
! Nome !! Valor
```

**Depois**

```wikitext
! scope="col" | Nome !! scope="col" | Valor
```

Exige uma grade simples e papel de cabeçalho inequívoco. Tabelas complexas não recebem suposições de alcance.

### TAB-04: Atributos antigos equivalentes

Retira um atributo redundante quando o CSS existente já fornece exatamente o mesmo valor.

**Antes**

```wikitext
|- style="text-align:left;" align="left"
```

**Depois**

```wikitext
|- style="text-align:left;"
```

Conflitos de valores e regras com apresentação não equivalente permanecem.

### TAB-05: Formatação esquecida dentro da célula

Fecha marcação local quando o limite da célula prova onde deve terminar.

**Antes**

```wikitext
| <small>Alfa
| Beta
```

**Depois**

```wikitext
| <small>Alfa</small>
| Beta
```

Se o fechamento posterior for intencional ou o limite for incerto, preserva a marcação.

### TAB-06: Texto deslocado pelo leitor de tabelas

Tira de dentro da abertura uma legenda de lista que já seria exibida antes da tabela.

**Antes**

```wikitext
{| class="wikitable"
;Explicação
! Nome
| Alfa
|}
```

**Depois**

```wikitext
;Explicação
{| class="wikitable"
! Nome
| Alfa
|}
```

Exige confirmação do resultado nativo, sem mover texto de uma célula legítima.

### TAB-07: Mesclagens e atributos com erro finito

Corrige atributos previstos de linha e coluna sem alterar a grade lógica.

**Antes**

```wikitext
Uma célula com grafia incorreta inequívoca de um atributo conhecido.
```

**Depois**

```wikitext
A mesma célula com atributo aceito, conservando conteúdo e extensão.
```

A grade antes e depois precisa corresponder. Não reorganiza dados para forçar uma comparação.

### TAB-08: Tabelas largas e apresentação responsiva

Trata estilos e contenção nos perfis de tabela confirmados, sem aplicar invólucros genéricos ao artigo.

**Antes**

```wikitext
Uma tabela com configuração de largura comprovadamente defeituosa e perfil suportado.
```

**Depois**

```wikitext
A mesma tabela com apresentação corrigida, conservando fórmulas, unidades e células.
```

Largura grande não basta para autorizar mudança. Infocaixas, navecaixas e portais continuam usando suas chamadas nativas.

### SYN-01: Chaves e colchetes em limites únicos

Repara trocas previstas de fechamentos quando há uma única estrutura reconhecida.

**Antes**

```wikitext
Uma chamada conhecida com fechamento trocado e limites inequívocos.
```

**Depois**

```wikitext
A mesma chamada com fechamento correspondente.
```

O reparo usa nomes e estruturas conhecidas e precisa de limites inequívocos. Não substitui chaves, colchetes ou parênteses globalmente e preserva fórmulas, ligações, código e exemplos.

### SYN-02: Trecho completo anterior a marcação incerta

Aplica correções locais independentes em trechos verificáveis.

**Antes**

```wikitext
Uma ligação simples com erro antes de um bloco incompleto independente.
```

**Depois**

```wikitext
A ligação corrigida e o bloco incompleto preservado.
```

Trechos independentes continuam elegíveis mesmo se outro ponto contiver marcação incerta. Um fechamento HTML isolado pode ser ignorado apenas na leitura estrutural, mantendo os bytes originais do texto.

### SYN-03: Resíduos de cópia de chat

Retira cercas Markdown que envolvem somente o artigo completo e marcas técnicas conhecidas de cópia.

**Antes**

````wikitext
```wikitext
'''Vila Aurora''' é uma povoação.

== Geografia ==
Texto da seção.
{{Referências}}
```
````

**Depois**

```wikitext
'''Vila Aurora''' é uma povoação.

== Geografia ==
Texto da seção.
{{Referências}}
```

Exige abertura de artigo, seção e elementos de estrutura confirmados. Exemplos de código, citações literais e artigos sobre a própria marcação ficam intactos.

### SYN-04: Negrito e itálico Markdown

Converte ênfase inequívoca para a marcação wiki.

**Antes**

```wikitext
O termo **rede óptica** aparece no texto.
```

**Depois**

```wikitext
O termo '''rede óptica''' aparece no texto.
```

Não modifica listas aninhadas, fórmulas, código ou exemplos sobre a marcação.

### SYN-05: Múltiplas linhas vazias

Reduz espaçamento redundante em trechos de prosa e entre estruturas completas.

**Antes**

```wikitext
Primeiro parágrafo.

 	
Segundo parágrafo.
```

**Depois**

```wikitext
Primeiro parágrafo.

Segundo parágrafo.
```

Protege poemas, blocos preformatados, código, listas e contextos em que a quebra tem função.

### SYN-06: Começo sem linhas vazias

Retira linhas vazias do começo do artigo, inclusive após remover Descrição curta.

**Antes**

```wikitext


Texto do artigo.
```

**Depois**

```wikitext
Texto do artigo.
```

Retira apenas linhas iniciais sem conteúdo em artigos. Não remove indentação funcional nem conteúdo de exemplos protegidos.

### SYN-07: Título redundante na abertura

Retira o título inicial que apenas repete o título da página.

**Antes**

```wikitext
== Tema fictício ==
Texto da introdução.
```

**Depois**

```wikitext
Texto da introdução.
```

Exige correspondência com a página e abertura normal, sem apagar uma seção legítima.

### SYN-08: Lista com itens vazios no final

Retira marcadores vazios que não têm subitens ou outra função.

**Antes**

```wikitext
* Primeiro item
*
*
```

**Depois**

```wikitext
* Primeiro item
```

Um marcador com filhos ou efeito de estrutura permanece.

### SYN-09: Erros ortográficos exatos

Corrige grafias previstas por uma lista finita, sem reescrever frases.

**Antes**

```wikitext
As espectativas cresceram quando o filme estreiou.
```

**Depois**

```wikitext
As expectativas cresceram quando o filme estreou.
```

Protege nomes próprios, links, títulos bibliográficos, citações, itálico, parênteses e exemplos nos contextos previstos.

### SYN-10: Descrição curta e modelos obsoletos

Retira Descrição curta do artigo e trata os modelos obsoletos com ação expressa no catálogo.

**Antes**

```wikitext
{{Descrição curta|Um tema fictício}}

Texto do artigo.
```

**Depois**

```wikitext
Texto do artigo.
```

Uma chamada interna que possa definir categorias, ordenação ou outros metadados impede a remoção da predefinição inteira. Programas ou chamadas internas sem equivalência confirmada ficam preservados, sem impedir ajustes independentes. Um modelo desconhecido não é considerado obsoleto só por não constar do catálogo.

### SYN-11: Categorias e palavras mágicas importadas

Adapta as palavras mágicas e os prefixos previstos, conservando seus argumentos.

**Antes**

```wikitext
{{DEFAULTSORT:Exemplo, Tema}}
```

**Depois**

```wikitext
{{DEFAULTSORT:Exemplo, Tema}}
```

Uma chamada nativa válida permanece. Só há adaptação com alias ou palavra mágica de origem confirmada. Palavras mágicas exigem o mesmo ID nativo ativo e a forma de chamada correta. Operandos, valores e efeitos permanecem. A preferência de ordenação é ORDENAÇÃOPADRÃO. PAGESINNAMESPACE/PAGESINNS ficam retidos sem consumidor ativo comprovado; prefixos de homônimos não transformam modelos em comandos.

### SYN-12: Coordenadas duplicadas

Retira uma chamada de título redundante sem perder a mais completa.

**Antes**

```wikitext
{{Coord|1|2|N|3|4|E|display=title}}
{{Coord|1|2|N|3|4|E|display=title|type=city}}
```

**Depois**

```wikitext
{{Coord|1|2|N|3|4|E|display=title|type=city}}
```

Coordenadas, opções ou funções conflitantes permanecem.

### TAB-09: Tabelas abertas por predefinição nativa

Reconhece pares conferidos que abrem uma tabela por predefinição e a fecham com marcação literal ou um auxiliar nativo.

**Antes**

```wikitext
{{Começa caixa}}
{{S-inc|recente}}
|}
```

**Depois**

```wikitext
O bloco continua intacto e ajustes independentes depois dele podem ser aplicados.
```

A leitura depende do par nativo conhecido. Não inventa uma abertura para um fechamento avulso nem reescreve qualquer produtor de tabela.

### TAB-10: Célula já produzida pela predefinição

Retira um separador de célula redundante antes de um produtor nativo conferido.

**Antes**

```wikitext
{| class="wikitable"
|-
|{{Td fmtn|1}}
|}
```

**Depois**

```wikitext
{| class="wikitable"
|-
{{Td fmtn|1}}
|}
```

Exige tabela literal reconhecida e Td fmtn com um único número literal. Atributos concorrentes, valores dinâmicos e outros produtores permanecem.

### TAB-11: Partido no consumidor eleitoral correto

Usa o nome português previsto no campo de partido de modelos eleitorais conferidos.

**Antes**

```wikitext
{{Election box candidate with party link no change|candidate=Pessoa Exemplo|party=Democratic Party (United States)|votes=12,345|percentage=4.5}}
```

**Depois**

```wikitext
{{Election box candidate with party link no change|candidate=Pessoa Exemplo|party=Partido Democrata (Estados Unidos)|votes=12,345|percentage=4.5}}
```

O mapeamento é específico do consumidor e do valor. Preserva candidato, votos, porcentagem e cores. Não traduz party em uma predefinição desconhecida.

### SYN-13: Modelos de bloco em linhas próprias

Separa chamadas independentes coladas para facilitar a leitura do código.

**Antes**

```wikitext
{{Em construção}}{{Evento atual|Este artigo}}
Texto.
```

**Depois**

```wikitext
{{Em construção}}
{{Evento atual|Este artigo}}
Texto.
```

Usa os papéis de bloco reconhecidos. Datas, idiomas e outros auxiliares de frase continuam em linha; valores de campos, referências, tabelas e exemplos protegidos conservam seu contexto.

### SYN-14: Noinclude vazio sem função no artigo

Retira um par vazio de noinclude no artigo e as linhas iniciais sem conteúdo que sobrarem.

**Antes**

```wikitext
<noinclude>
 </noinclude>

Texto.
```

**Depois**

```wikitext
Texto.
```

O bloco só pode conter espaços. Controles de inclusão com conteúdo, definições de predefinição e exemplos protegidos permanecem.

### SYN-15: Espaços horizontais em prosa

Ajusta espaços antes de vírgula/ponto e dentro de parênteses simples.

**Antes**

```wikitext
Uma frase , outra ( palavra ).
```

**Depois**

```wikitext
Uma frase, outra (palavra).
```

Só prosa delimitada; números, fórmulas, títulos, citações, código, URLs, links, modelos e parágrafos ficam.

### SYN-16: BR entre itens comuns

Retira BR final antes do próximo item comum do mesmo nível.

**Antes**

```wikitext
* Alfa<br>
* Beta
```

**Depois**

```wikitext
* Alfa
* Beta
```

Não atravessa sublistas, prefixos de definição, modelos, tabelas, versos ou exemplos.

### SYN-17: Fechamento small inequívoco

Repara a forma autocontida usada como fechamento.

**Antes**

```wikitext
<small>Texto<small/>
```

**Depois**

```wikitext
<small>Texto</small>
```

Uma abertura correspondente, fechamento sem atributos e nenhum small posterior ambíguo. Atributos da abertura ficam.

### SYN-18: Título HTML literal para sintaxe wiki

Padroniza H2–H6 simples e únicos.

**Antes**

```wikitext
<h2>Seção simples</h2>
```

**Depois**

```wikitext
== Seção simples ==
```

Sem atributos, marcação ou proprietário protegido; título único. Pares nativos conservaram nível, texto, IDs e sumário. Invólucro e metadados de edição da seção mudam; não é HTML idêntico.

### SYN-19: Prefixo de predefinição conhecida

Retira namespace literal de citações/infocaixas nativas exatas.

**Antes**

```wikitext
{{Predefinição:Citar livro|título=Obra}}
```

**Depois**

```wikitext
{{Citar livro|título=Obra}}
```

Modelo, argumentos, capitalização e espaços restantes conservados. Homônimos de palavras mágicas, nomes calculados e modelos desconhecidos mantêm o prefixo.

### SYN-20: Lacunas entre itens simples

Retira linhas vazias entre itens simples da lista não numerada.

**Antes**

```wikitext
* item1

* item2
```

**Depois**

```wikitext
* item1
* item2
```

Só itens * simples, sem sublistas, modelos, citações, tabelas ou continuação de parágrafo. Listas numeradas conservam suas separações.

### TAB-12: Atributos indevidos no fechamento de tabela

Retira atributos de fechamento cujo par está comprovado.

**Antes**

```wikitext
<table><tr><td>Texto</td class="copiado"></tr></table>
```

**Depois**

```wikitext
<table><tr><td>Texto</td></tr></table>
```

Abertura e pilha inequívocas; conserva atributos das aberturas, células, conteúdo e referências.

## Seções finais, colunas e projetos irmãos

### COL-01: Duas colunas a partir de oito itens

Usa Colunas-lista em listas simples de Ligações externas, Bibliografia ou Leitura adicional.

**Antes**

```wikitext
== Ligações externas ==
* Item 1
* Item 2
* Item 3
* Item 4
* Item 5
* Item 6
* Item 7
* Item 8
```

**Depois**

```wikitext
== Ligações externas ==
{{Colunas-lista|2|2=
* Item 1
* Item 2
* Item 3
* Item 4
* Item 5
* Item 6
* Item 7
* Item 8
}}
```

Conta itens principais por seção ou subseção. Subitens não aumentam o total, e listas separadas não são somadas.

### COL-02: Lista curta sem colunas

Retira um invólucro simples de duas colunas quando há menos de oito itens.

**Antes**

```wikitext
== Bibliografia ==
{{Colunas-lista|2|2=
* Uma obra
}}
```

**Depois**

```wikitext
== Bibliografia ==
* Uma obra
```

Preserva estilos e configurações com função própria, tabelas ou estruturas sem equivalência.

### COL-03: Colunas manuais sem col1 e col2

Transforma blocos simples de colunas manuais em uma lista contínua.

**Antes**

```wikitext
{{Colunas|col1=
* [https://example.invalid/a Item A]
|col2=
* [https://example.invalid/b Item B]
}}
```

**Depois**

```wikitext
* [https://example.invalid/a Item A]
* [https://example.invalid/b Item B]
```

Exige itens simples de ligações ou citações bibliográficas reconhecidas e preserva a sequência e os subitens. Comparações, listas com títulos ou funções diferentes e estilos próprios permanecem. Usa duas colunas apenas se a lista completa atingir oito itens, sem somar seções diferentes.

### COL-04: Colunas de referências com mínimo próprio

Usa duas colunas quando há ao menos dez entradas elegíveis.

**Antes**

```wikitext
{{Referências}} com dez referências distintas.
```

**Depois**

```wikitext
Lista de referências em duas colunas, com as mesmas fontes.
```

Não conta chamadas repetidas da mesma entrada como fontes novas. Configurações técnicas próprias podem permanecer.

### FOOT-01: Ordem das seções e do rodapé

Organiza blocos finais reconhecidos, respeitando suas dependências.

**Antes**

```wikitext
Categoria ou navecaixa inserida entre o título de Referências e seu coletor.
```

**Depois**

```wikitext
Coletor junto da seção e elementos de rodapé na posição correspondente.
```

Ver também pode ocupar as posições nativas permitidas. Uma lista precisa vir depois das chamadas que deve recolher. A reorganização conserva a ordem de avaliação das chamadas que podem definir a ordenação das categorias, inclusive dentro de outras predefinições ou extensões. Um movimento sem essa prova é omitido, enquanto os reparos independentes continuam.

### FOOT-02: Chave de ordenação antes das categorias

Move DEFAULTSORT para antes do conjunto de categorias.

**Antes**

```wikitext
[[Categoria:Temas fictícios]]
{{DEFAULTSORT:Tema fictício}}
```

**Depois**

```wikitext
{{DEFAULTSORT:Tema fictício}}
[[Categoria:Temas fictícios]]
```

Exige conservar a ordem de avaliação de DEFAULTSORT, NM, NF e outras chamadas que podem definir a ordenação. Uma predefinição ou extensão desconhecida não é presumida neutra, e chamadas internas também são conferidas. Quando mover a chave pode mudar a ordenação efetiva, ela permanece no lugar, sem impedir outros reparos.

### FOOT-03: Categorias consecutivas

Retira linhas vazias entre categorias adjacentes.

**Antes**

```wikitext
[[Categoria:Temas fictícios]]

[[Categoria:Exemplos]]
```

**Depois**

```wikitext
[[Categoria:Temas fictícios]]
[[Categoria:Exemplos]]
```

Não apaga texto ou predefinições que estejam entre as categorias. A retirada de espaços entre categorias simples continua elegível quando não é possível mover DEFAULTSORT com segurança.

**Outro caso**

```wikitext
{{Esboço-livro}}[[Categoria:Alfa]][[Categoria:Beta]]
```

```wikitext
{{Esboço-livro}}
[[Categoria:Alfa]]
[[Categoria:Beta]]
```

Separa limites conservando nomes, ordem e chaves. O layout geral pode manter uma linha em branco antes do bloco; não entre categorias consecutivas.

### LAY-01: Navecaixas e portais sem div redundante

Retira um invólucro genérico de rolagem quando a chamada nativa já fornece o bloco.

**Antes**

```wikitext
<div style="max-width:100%;overflow-x:auto" tabindex="0" role="region" aria-label="Navegação: Exemplo">
{{Portal3|Ciência}}
</div>
```

**Depois**

```wikitext
{{Portal3|Ciência}}
```

Só remove um contêiner equilibrado e demonstravelmente redundante. Contenção funcional permanece.

### LAY-02: Infocaixa sem div redundante

Retira o invólucro genérico de flutuação e rolagem em volta de uma caixa elegível.

**Antes**

```wikitext
<div style="float:right;clear:right;max-width:100%;overflow-x:auto" tabindex="0" role="region" aria-label="Informações de Exemplo">
{{Info/Biografia|nome=Pessoa fictícia}}
</div>
```

**Depois**

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
```

Não remove recipientes que controlam conteúdo adicional, alinhamento especial ou apresentação necessária.

### FOOT-05: Projetos irmãos abaixo de Ver também

Posiciona as caixas de projetos irmãos elegíveis após o título Ver também.

**Antes**

```wikitext
== Ver também ==
* [[Tema fictício]]

== Ligações externas ==
{{Commonscat|Example}}
* Ligação externa
```

**Depois**

```wikitext
== Ver também ==
{{Commonscat|Example}}
* [[Tema fictício]]

== Ligações externas ==
* Ligação externa
```

A posição depende de uma seção Ver também válida e da preservação da ordem de avaliação das demais chamadas. Uma caixa não atravessa uma chamada que possa mudar a ordenação sem equivalência confirmada. Não cria itens de Ver também ou conteúdo novo para justificar a caixa.

**Outro caso**

```wikitext
== Ver também ==
* Item anterior.
{{Correlatos|título=<h2>Outra seção</h2>|commonscat=Example}}
```

```wikitext
== Ver também ==
* Item anterior.
{{Correlatos|título=<h2>Outra seção</h2>|commonscat=Example}}
```

HTML, títulos ou modelos dinâmicos podem alterar a estrutura. Nesses casos, a caixa mantém sua posição e os ajustes independentes continuam possíveis.

### FOOT-06: Ligação de projeto irmão em caixa

Converte as formas em linha previstas para a caixa correspondente.

**Antes**

```wikitext
{{Commonscat-inline|Example}}
```

**Depois**

```wikitext
{{Commonscat|Example}}
```

As formas em linha conferidas são Commonscat, Commons, Wikiquote, Wikisource, Wikcionário e Wikivoyage. Exige par nativo equivalente, alvo e rótulo preservados. Não converte qualquer ligação interprojeto em caixa.

### QUAL-01: Indicador de qualidade duplicado

Mantém uma chamada válida do mesmo indicador de artigo bom ou destacado.

**Antes**

```wikitext
{{Artigo bom}}
{{Artigo bom}}
Texto fictício.
```

**Depois**

```wikitext
{{Artigo bom}}
Texto fictício.
```

Não promove, rebaixa ou escolhe entre estatutos conflitantes. Parâmetros com função diferente permanecem.

### FOOT-07: Nomes das seções finais

Adapta títulos estrangeiros e variantes previstos para o nome português.

**Antes**

```wikitext
== See also ==
```

**Depois**

```wikitext
== Ver também ==
```

Exige uma correspondência explícita. Um título apenas parecido não é reescrito por inferência.

**Outro caso**

```wikitext
== {{Veja também}} ==
```

```wikitext
== Ver também ==
```

Somente chamada inteira sem argumentos. Links externos prefere Ligações externas pelo mesmo contrato; coletores não viram simples texto de seção.

### FOOT-08: Sucessão preservada como bloco do rodapé

Reconhece o conjunto completo de sucessão ao organizar portais e outros elementos finais.

**Antes**

```wikitext
Uma caixa nativa de sucessão completa antes das categorias.
```

**Depois**

```wikitext
A sucessão permanece inteira, com os portais na posição elegível do rodapé.
```

A abertura e o fechamento precisam corresponder aos auxiliares nativos conhecidos. O reconhecimento do bloco não altera os dados dos cargos.

### FOOT-09: Taxonbar e autoridade no rodapé

Posiciona Taxonbar/autoridade após navegações e antes de portais.

**Antes**

```wikitext
Taxonbar, navegação e Portal3 num rodapé reconhecido.
```

**Depois**

```wikitext
Navegação, Taxonbar e Portal3, conservando os dados.
```

Taxonbar é distinto de Controle de autoridade. Sem cruzar prosa/chamadas opacas ou mudar efeitos de NM/NF.

## Discussões e predefinições

### TALK-01: Um PD no início

Reúne chamadas equivalentes conferidas e põe PD na primeira linha.

**Antes**

```wikitext
{{pd}}
{{Página de discussão}}
== Uma conversa ==
Texto.
```

**Depois**

```wikitext
{{PD}}
== Uma conversa ==
Texto.
```

Preserva argumentos configurados. Configurações conflitantes e exemplos literais não são descartados.

### TALK-02: Uma Marca de projeto com todos os projetos

Reúne os projetos e suas avaliações compatíveis em uma chamada.

**Antes**

```wikitext
{{Marca de projeto|?|Ciência|?}}
{{Marca de projeto|?|Tecnologia|?}}
```

**Depois**

```wikitext
{{Marca de projeto|?|Ciência|?|Tecnologia|?}}
```

Preserva parâmetros adicionais e avaliações humanas. Conflitos entre avaliações não são resolvidos por adivinhação.

### TALK-03: Avaliação automática marcada por bot

Quando a Marca de projeto contém o parâmetro bot, retira bot e rev e usa ? na avaliação geral.

**Antes**

```wikitext
{{PD}}
{{Marca de projeto|1|Ciência|3|bot=?/20131103|rev=20140530}}
```

**Depois**

```wikitext
{{PD}}
{{Marca de projeto|?|Ciência|3}}
```

A presença do parâmetro nomeado bot é o sinal usado nesta regra. As importâncias dos projetos e os demais campos são preservados. Sem bot, a avaliação e rev permanecem, sem consulta ao histórico.

### TALK-04: Traduzido no formato nativo

Adapta os campos e a ordem da chamada de tradução conforme a predefinição portuguesa.

**Antes**

```wikitext
{{Traduzido|en|Tema fictício|oldid=12345|data=1 de novembro de 2026}}
```

**Depois**

```wikitext
{{Traduzido|página=Tema fictício|cód_idioma=en|oldid=12345|data=1 de novembro de 2026}}
```

Não inventa revisão, data ou origem de tradução.

### TALK-05: Criar código a partir dos portais

Lê os portais do artigo e prepara PD e Marca de projeto no rascunho da discussão.

**Antes**

```wikitext
Discussão sem cabeçalho de projeto e artigo com Física, Tecnologia e Ciência.
```

**Depois**

```wikitext
{{PD}}
{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}
```

Requer discussão inteira de artigo e consulta bem-sucedida. Não publica a página.

### TALK-06: Variantes de portal coladas na discussão

Converte os portais reconhecidos para a estrutura de projetos em discussão.

**Antes**

```wikitext
Portal da física Portal da tecnologia Portal da ciência
```

**Depois**

```wikitext
{{PD}}
{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}
```

Abrange os portais aceitos no mapa, não apenas esses exemplos. Texto de conversa e exemplos protegidos ficam intactos.

### TPL-01: Definições de predefinição

Aplica os reparos finitos previstos a includeonly, noinclude e chamadas conhecidas.

**Antes**

```wikitext
Uma definição com delimitador incorreto inequívoco em um bloco de inclusão.
```

**Depois**

```wikitext
A mesma definição com limites de inclusão preservados e sintaxe corrigida.
```

Parâmetros triplos, funções parser, Lua e exemplos não são tratados como prosa de artigo.

### TPL-02: Navecaixa com chamada duplicada de chaves

Retira um nível redundante nas navecaixas literais expressamente reconhecidas.

**Antes**

```wikitext
{{{{Navecaixa reconhecida}}}}
```

**Depois**

```wikitext
{{Navecaixa reconhecida}}
```

O nome deve estar no mapa. Indireção dinâmica ou uma predefinição desconhecida permanece.

### TPL-03: TemplateStyles

Ajusta CSS pelo fluxo próprio, conferido pelo sanitizador nativo.

**Antes**

```wikitext
Uma declaração CSS com um erro exato e reparo aceito pelo sanitizador.
```

**Depois**

```wikitext
A declaração corrigida, com as demais regras preservadas.
```

Não converte propriedades rejeitadas para valores aleatórios nem altera o CSS geral de outra página.

### TPL-04: Campos de sucessão com nomes nativos

Adapta argumentos importados nos auxiliares de sucessão conferidos.

**Antes**

```wikitext
{{S-bef|before=Pessoa Exemplo}}
{{S-inc|recent}}
```

**Depois**

```wikitext
{{S-bef|antes=Pessoa Exemplo}}
{{S-inc|recente}}
```

Before e suas posições numeradas só mudam quando não há parâmetro português concorrente. Recent precisa ser o único argumento posicional previsto. Reason e reason2 não são tratados como erros.

### TALK-07: Avisos no topo da discussão

Organiza o cabeçalho antes das conversas, preservando atribuições e avisos distintos.

**Antes**

```wikitext
{{OKA}}
{{Traduzido|página=Tema Exemplo|cód_idioma=en|oldid=12345}}
{{Marca de projeto|3|Ciência|2|rev=20260101}}
{{PD}}
```

**Depois**

```wikitext
{{PD}}
{{Marca de projeto|3|Ciência|2|rev=20260101}}
{{Traduzido|página=Tema Exemplo|cód_idioma=en|oldid=12345}}
{{OKA}}
```

Ordem atual: PD, Marca de projeto, Traduzido e OKA, uma chamada por linha. Outros avisos vêm depois. O novo ordenador não atravessa comentários, assinaturas, prosa ou avisos desconhecidos. Avaliações humanas, importâncias e atribuição permanecem.

### TPL-05: Título no ramo próprio de YouTube

Usa titulo no vídeo comum que lê esse campo.

**Antes**

```wikitext
{{YouTube|abcdefghijk|título=Exemplo}}
```

**Depois**

```wikitext
{{YouTube|abcdefghijk|titulo=Exemplo}}
```

ID comum de vídeo, sem canal/playlist ou título concorrente. Outros ramos não mudam por semelhança.

### TALK-08: Sentinela x no primeiro campo

Troca só x ou "x" literais por ?.

**Antes**

```wikitext
{{Marca de projeto|"x"|Mulheres|3}}
```

**Depois**

```wikitext
{{Marca de projeto|?|Mulheres|3}}
```

3 continua importância; ? mantém a estimativa automática. Não presume bot. Notas humanas, rev e ausência de bot ficam; campos concorrentes/dinâmicos são retidos.

## Uso, segurança e distribuição

### UI-01: Um botão para ajustar

Executa as correções escolhidas no rascunho aberto.

**Antes**

```wikitext
Rascunho ainda não analisado.
```

**Depois**

```wikitext
Correções confirmadas no mesmo rascunho.
```

O botão superior e o botão junto de Publicar executam a mesma ação. Publicação continua manual.

### UI-02: Contagem do que foi aplicado

Mostra os ajustes aplicados e a diferença em bytes. O número de ajustes aparece somente quando a contagem exata está confirmada.

**Antes**

```wikitext
Texto com várias correções independentes.
```

**Depois**

```wikitext
Número de ajustes e bytes quando a contagem é exata. Sem contagem confirmada, mensagem de ajustes aplicados e acesso à comparação.
```

Quando a contagem exata não pode ser confirmada, informa que houve ajustes sem estimar um total. Não inclui propostas descartadas. Um bloco da comparação não é necessariamente um único ajuste.

### UI-03: Mostrar alterações e desfazer

Usa a comparação do editor e permite restaurar o rascunho anterior.

**Antes**

```wikitext
Rascunho ajustado.
```

**Depois**

```wikitext
Rascunho anterior restaurado por Desfazer ajustes.
```

Uma alteração manual posterior impede restaurar uma versão que sobrescreveria esse trabalho.

### UI-04: Evitar análise repetida sem mudanças

Reconhece o texto já conferido e atualiza o estado dos botões.

**Antes**

```wikitext
Mesmo texto e mesmas opções depois da análise.
```

**Depois**

```wikitext
Botão indica o estado conferido.
```

Uma edição ou mudança nas opções permite nova análise.

### UI-05: Resumo Minúcias e edição menor

Preenche o resumo padrão e marca os ajustes automáticos como edição menor.

**Antes**

```wikitext
Resumo vazio e aplicação automática confirmada.
```

**Depois**

```wikitext
Resumo: Minúcias. Edição menor marcada.
```

Preserva resumo e escolha manuais, além da opção desligada. Não depende do tamanho da diferença. Nas discussões, Criar código mantém seu resumo próprio de PD e Marca de projeto e também marca a alteração automática como menor, respeitando a escolha manual.

### UI-06: Opções por família

Permite escolher Todos os ajustes, Só referências ou Só infocaixas e desligar grupos específicos.

**Antes**

```wikitext
Opção de uma família desligada.
```

**Depois**

```wikitext
Essa família fica sem alteração; as demais continuam elegíveis.
```

Uma opção técnica de segurança não pode ser removida para forçar uma correção.

### UI-07: Andamento e cancelamento

Mostra atividade e permite cancelar sem alterar o rascunho.

**Antes**

```wikitext
Análise em andamento.
```

**Depois**

```wikitext
Cancelamento encerra a aplicação e mantém o texto aberto.
```

O indicador respeita a preferência de menos movimento. Não apresenta uma porcentagem inventada.

### UI-08: Sem corte global de 60 segundos

Permite que a análise continue além de um minuto enquanto trabalha.

**Antes**

```wikitext
Análise com mais de 60 segundos.
```

**Depois**

```wikitext
A execução continua, podendo ser cancelada.
```

Consultas externas mantêm limites próprios. Cancelamento, mudança de contexto e alteração manual impedem respostas antigas de sobrescrever o rascunho.

### SAFE-01: Uma falha local não cancela tudo

Mantém correções independentes que passaram pela preservação.

**Antes**

```wikitext
Campo não elegível na infocaixa e erro de referência independente no corpo.
```

**Depois**

```wikitext
Campo preservado e referência corrigida.
```

Uma chamada ausente de referências pode ser preparada antes das etapas que dependem dela, sem impedir portais elegíveis. Trechos não comprovados permanecem e não cancelam ajustes independentes que passaram pela preservação.

### SAFE-02: Preservação de conteúdo e referências

Compara texto, campos, grupos, referências, células, fórmulas, unidades e destinos para impedir perdas na transformação.

**Antes**

```wikitext
Um plano eliminaria parte de uma fonte ou uma célula.
```

**Depois**

```wikitext
Esse plano não é aplicado.
```

As verificações são de preservação do código e dos dados. Não verificam a veracidade das afirmações, a qualidade das fontes ou a notoriedade do tema.

### SAFE-03: Resultado vinculado ao rascunho

Evita que uma resposta atrasada substitua texto escrito depois.

**Antes**

```wikitext
A análise começou, mas o texto foi editado manualmente.
```

**Depois**

```wikitext
A resposta antiga não sobrescreve o novo texto.
```

Também confere página, revisão, seção, editor e opções.

### SAFE-04: Contextos e regiões protegidas

Distingue artigo, rascunho, discussão, predefinição e CSS.

**Antes**

```wikitext
<nowiki>{{Reflist}}</nowiki>
```

**Depois**

```wikitext
<nowiki>{{Reflist}}</nowiki>
```

Código, citações de marcação, comentários e trechos de exemplo não recebem as mesmas regras da prosa.

### DIST-01: Carregador fixo

Mantém a chamada de instalação no common.js entre as atualizações.

**Antes**

```wikitext
Chamada fixa já instalada corretamente.
```

**Depois**

```wikitext
A mesma chamada depois de atualizar núcleo, dados e carregador compartilhado.
```

Não exige substituir o common.js inteiro nem apagar outros scripts.

### DIST-02: Dados conferidos após o salvamento

Confere a versão e o conteúdo do catálogo antes de iniciar.

**Antes**

```wikitext
Dados e núcleo de distribuições diferentes ou texto transformado no pré-salvamento.
```

**Depois**

```wikitext
O pacote incompatível não é iniciado.
```

Não altera o hash para mascarar a diferença. Arquivos da mesma distribuição e destinos corretos resolvem a instalação.

### DIST-03: Sem edições automáticas na Wikipédia

As correções ficam no editor até a ação de publicação da pessoa.

**Antes**

```wikitext
Ajustar código ou Criar código concluído.
```

**Depois**

```wikitext
Rascunho aberto, sem publicação automática.
```

A pré-visualização pode enviar o rascunho para processamento sem salvar uma edição. Não há edições periódicas.

## Condicionais e limites

- Remoção genérica de rastreadores em hosts não comprovados, URLs assinadas, opacas ou arquivadas.
- Retirada de cite sem prova de apresentação dispensável; mudança genérica de artigos gramaticais ou aspas dos rótulos.
- Retirar imdb_id sem prova de que o mesmo ID, com zeros, esteja efetivamente exibido noutro consumidor.
- sous-titre→subtítulo, Ani→Dni ou campos de instituições, influência, sepultamento e unidades por semelhança.
- Apagar DISPLAYTITLE funcional, comando isolado de sumário válido, campo opaco ou a cauda inteira de URL.
- Headings com atributos/marcação ou duplicados, percentuais sem rótulo explícito e delimitadores codificados.
- Categorizar todos os destinos só por existirem no catálogo ou completar dimensões de artigo já categorizado.
- Retirar Notas isolada sem inventário fechado e prova de ausência; reordenação genérica de coletores que precisam continuar separados.
- Retirar switches de sumário duplicados sem prova do mesmo ID ativo e contexto de inclusão.
