# Funcionalidades do RevisaWiki 2.21.6

Este inventário cobre as famílias atuais, com exemplos sintéticos e condições de aplicação. Não é uma lista de promessas para qualquer texto semelhante. O [catálogo completo](Catalogo_modelos_e_regras_2_21_6.json) reúne nomes de modelos, campos, mapas e grafias.

Os exemplos de campos são trechos da chamada, com as condições descritas. Exemplos de comportamento dependem do contexto completo.

## Referências e notas

### REF-01: Lista de referências em linha própria

Separa o coletor do parágrafo, sem mudar o texto ou as fontes.

Antes:

```wikitext
Texto.<ref>Fonte.</ref>{{Referências}}
```

Depois:

```wikitext
Texto.<ref>Fonte.</ref>

{{Referências}}
```

A alteração exige uma ocorrência completa, reconhecida e sem conflito.

### REF-02: Coletores repetidos

Retira uma cópia equivalente do mesmo coletor.

Antes:

```wikitext
Texto.<ref>Fonte.</ref>
{{Referências}}
{{Referências}}
```

Depois:

```wikitext
Texto.<ref>Fonte.</ref>
{{Referências}}
```

Listas com grupos, definições internas ou funções diferentes não são cópias intercambiáveis.

### REF-03: Notas e referências juntas

Usa a chamada conjunta quando as listas podem ser reunidas.

Antes:

```wikitext
Texto{{Nre|Uma explicação.}}.<ref>Uma fonte.</ref>
{{Notas}}

{{Referências}}
```

Depois:

```wikitext
Texto{{Nre|Uma explicação.}}.<ref>Uma fonte.</ref>
{{Notas e referências}}
```

Conserva todos os grupos, notas, definições e destinos.

Opções relacionadas: `references`, `unifiedNotesReferences`.

### REF-04: Formato nativo da lista

Converte coletores equivalentes e retira um título que passaria a ser repetido.

Antes:

```wikitext
Texto.<ref>Fonte.</ref>
== Referências ==
<references/>
```

Depois:

```wikitext
Texto.<ref>Fonte.</ref>
{{Referências}}
```

Abrange Reflist, aliases conferidos e erros exatos previstos. Argumentos técnicos sem equivalente permanecem. Reflist com número de colunas, como Reflist|2, respeita o mínimo de dez entradas; larguras ou bancos próprios só mudam com equivalência confirmada.

Opções relacionadas: `references`, `automaticReferenceCollectorHeadings`.

### REF-05: Pontuação junto às referências

Põe a pontuação existente antes de uma chamada ou sequência de chamadas, nos contextos sem ambiguidade.

Antes:

```wikitext
Uma frase<ref name="fonte" />.
```

Depois:

```wikitext
Uma frase.<ref name="fonte" />
```

Não cria sinais, não muda o corpo das fontes e preserva casos ambíguos com aspas, abreviaturas ou reticências.

### REF-06: Fontes anônimas idênticas

Transforma repetições da mesma fonte em uma definição nomeada e reutilizações.

Antes:

```wikitext
A.<ref>{{citar livro|ultimo=Exemplo|primeiro=Ana|titulo=Obra fictícia|ano=2001}}</ref>
B.<ref>{{citar livro|ultimo=Exemplo|primeiro=Ana|titulo=Obra fictícia|ano=2001}}</ref>
```

Depois:

```wikitext
A.<ref name="Exemplo2001-1">{{citar livro|ultimo=Exemplo|primeiro=Ana|titulo=Obra fictícia|ano=2001}}</ref>
B.<ref name="Exemplo2001-1" />
```

O nome ilustrado depende dos campos presentes e da disponibilidade. Nomes ocupados recebem desambiguação, e definições divergentes não são fundidas. Nomes possíveis presentes como argumentos literais de outras chamadas ficam reservados, inclusive na forma NFC, para que uma definição nova não capture uma identidade existente.

Opções relacionadas: `automaticIdenticalReferences`.

### REF-07: Reutilizações adjacentes iguais

Retira a segunda chamada consecutiva da mesma fonte.

Antes:

```wikitext
Texto.<ref name="a" /><ref name="a" />
```

Depois:

```wikitext
Texto.<ref name="a" />
```

Definições e reutilizações em pontos diferentes do texto ficam intactas.

### REF-08: Aviso de ligação inativa no campo próprio

Leva a data existente do aviso ao campo datali da citação.

Antes:

```wikitext
<ref>{{citar web|url=https://example.invalid/|titulo=Documento}}{{Ligação inativa|data=novembro de 2026}}</ref>
```

Depois:

```wikitext
<ref>{{citar web|url=https://example.invalid/|titulo=Documento|datali=novembro de 2026}}</ref>
```

Exige uma data de calendário reconhecida já informada, uma única citação web ou de jornal associada e URL principal inequívoca. Não inventa datas, remove arquivos ou sobrescreve campos divergentes.

### REF-09: Grupo único de notas explicativas

Adapta um grupo importado quando todos os seus produtores e coletores têm a mesma função.

Antes:

```wikitext
Texto<ref group="note">Explicação.</ref>.<ref>Fonte.</ref>
== Notas ==
<references group="note"/>

<references/>
```

Depois:

```wikitext
Texto<ref group="nota">Explicação.</ref>.<ref>Fonte.</ref>
{{Notas e referências}}
```

Se houver outro grupo específico, numeração própria ou produção indireta não conferida, a identidade dos grupos permanece.

### REF-10: Coletor que falta para notas

Acrescenta a lista de notas reconhecidas quando as chamadas existem e falta o coletor.

Antes:

```wikitext
Texto{{Nre|Explicação.}}.<ref>Fonte.</ref>
{{Referências}}
```

Depois:

```wikitext
Texto{{Nre|Explicação.}}.<ref>Fonte.</ref>
{{Notas e referências}}
```

Exige confirmar o tipo de nota e o lugar em que suas definições podem ser recolhidas.

### REF-11: Referência definida na primeira chamada

Leva uma definição única para sua primeira reutilização, mantendo as chamadas seguintes.

Antes:

```wikitext
A.<ref name="a" />
B.<ref name="a">Fonte.</ref>
```

Depois:

```wikitext
A.<ref name="a">Fonte.</ref>
B.<ref name="a" />
```

Exige a mesma identidade, grupo e conteúdo, sem produção dinâmica ou cópia protegida.

Opções relacionadas: `moveNamedRefs`.

### REF-12: Nomes numéricos inválidos

Substitui nomes exclusivamente numéricos e todas as suas chamadas por um nome válido.

Antes:

```wikitext
A.<ref name="123">Fonte.</ref> B.<ref name="123" />
```

Depois:

```wikitext
A.<ref name="ref-123">Fonte.</ref> B.<ref name="ref-123" />
```

O nome ilustrado pode receber outro sufixo se já existir. Não altera nomes não numéricos por semelhança.

Opções relacionadas: `numericRefNames`.

### REF-13: Aspas quebradas no nome da fonte

Corrige duplicação inequívoca do delimitador do nome.

Antes:

```wikitext
Uma referência com delimitador de nome duplicado e família de chamadas conferida.
```

Depois:

```wikitext
A mesma família com o delimitador corrigido, conservando definição e reutilizações.
```

A correção precisa preservar o vínculo de todas as chamadas.

### REF-14: Sintaxe local das etiquetas ref

Repara grafias ou fechamentos finitos em limites confirmados.

Antes:

```wikitext
Uma etiqueta ref com erro exato de sintaxe e limites inequívocos.
```

Depois:

```wikitext
A mesma etiqueta com sintaxe válida, sem mudar o conteúdo da fonte.
```

Não fecha uma referência a partir de uma suposição sobre onde termina a fonte.

### REF-15: Referências com ligação simples

Adapta uma referência que contém somente um endereço ou uma ligação simples quando há dados suficientes.

Antes:

```wikitext
<ref>[https://example.invalid/ Documento fictício]</ref>
```

Depois:

```wikitext
<ref>{{citar web|url=https://example.invalid/|titulo=Documento fictício}}</ref>
```

Não inventa autoria, data, editora ou data de acesso.

Opções relacionadas: `bareReferences`.

### REF-16: Notas com referência interna

Usa um invólucro nativo nos casos em que uma nota precisa conter outra referência.

Antes:

```wikitext
<ref group="nota">Explicação.<ref>Fonte da explicação.</ref></ref>
```

Depois:

```wikitext
{{Refn|1=Explicação.<ref>Fonte da explicação.</ref>|group=nota}}
```

A transformação exige conferir o coletor, os atributos e a ligação com o grupo.

### REF-17: Citações abreviadas e bibliografia

Corrige destinos e campos de citações abreviadas nos contratos previstos.

Antes:

```wikitext
{{harvnb|Exemplo|2001|loc=capítulo 2|pp=10–12}}
```

Depois:

```wikitext
{{harvnb|Exemplo|2001|loc=capítulo 2|pp=10–12}}
```

Uma chamada válida permanece. Só há reparo quando o destino ou parâmetro pode ser comprovado, sem inventar uma obra.

Opções relacionadas: `harvardAnchorRepairs`, `shortCitationChecks`.

### REF-18: Nomes descritivos de referências

Substitui famílias automáticas reconhecidas por nomes derivados dos metadados da própria fonte, com as técnicas de NomeRefAuto.

Antes:

```wikitext
<ref name=":0">{{citar livro|ultimo=Exemplo|titulo=Obra fictícia|ano=2001}}</ref> Texto.<ref name=":0" />
```

Depois:

```wikitext
<ref name="Exemplo2001-1">{{citar livro|ultimo=Exemplo|titulo=Obra fictícia|ano=2001}}</ref> Texto.<ref name="Exemplo2001-1" />
```

Prioridade: colaborador, autor, editor, periódico, enciclopédia, título, título do livro e domínio da URL. Usa até quatro nomes e o ano de publicação, nunca o ano de acesso. Conserva nomes descritivos existentes e atualiza a família inteira, com um sufixo numérico para evitar colisões. Não insere predefinições no atributo name nem faz uma consulta externa por referência. Argumentos literais de outras chamadas reservam identidades possíveis. Se uma chamada puder consumir o nome antigo, a família fica intacta. A comparação de nomes ocupados também considera NFC, sem reescrever os nomes existentes. Anos conflitantes ou intervalos sem um ano único mantêm a alternativa neutra.

### REF-19: Nomes automáticos antigos

Retira a identificação antiga do programa dos nomes de fontes e atualiza as chamadas.

Antes:

```wikitext
A.<ref name="RevisaWiki-auto-7">Fonte.</ref> B.<ref name="RevisaWiki-auto-7" />
```

Depois:

```wikitext
A.<ref name="ref-auto-7">Fonte.</ref> B.<ref name="ref-auto-7" />
```

Pode usar um nome derivado da fonte quando há metadados reconhecidos. Na ausência deles, conserva a nomeação neutra e evita colisões.

Opções relacionadas: `neutralReferenceNames`.

### REF-20: Mesma definição em toda a página

Aplica reparos de uma definição nomeada junto das cópias que dependem dela.

Antes:

```wikitext
Duas referências com o mesmo nome e corpos diferentes.
```

Depois:

```wikitext
Os dois corpos continuam distintos, sem declarar fontes diferentes como iguais.
```

Quando há prova suficiente, nomes conflitantes recebem desambiguação e chamadas relacionadas são conservadas. Uma cópia protegida impede alterações incompatíveis nas demais.

## Parâmetros e conteúdo das citações

### CIT-01: Predefinições bibliográficas em português

Adapta nomes estrangeiros aos modelos nativos com função equivalente.

Antes:

```wikitext
{{cite web|url=https://example.invalid/|title=Documento|access-date=November 1, 2026}}
```

Depois:

```wikitext
{{Citar web|url=https://example.invalid/|título=Documento|acessodata=1 de novembro de 2026}}
```

O nome exato e a capitalização da saída seguem o mapa conferido. Não transforma indistintamente toda Citation em Citar web.

Opções relacionadas: `citations`, `multilingual`.

### CIT-02: Chaves inglesas também aceitas

Prefere os nomes portugueses conferidos, mesmo quando o alias inglês continua funcionando.

Antes:

```wikitext
{{citar web|url=https://example.invalid/|title=Documento|access-date=November 1, 2026}}
```

Depois:

```wikitext
{{citar web|url=https://example.invalid/|título=Documento|acessodata=1 de novembro de 2026}}
```

O destino deve ter a mesma função e prioridade. vauthors e veditors podem permanecer em inglês quando a versão nativa precisa dessas chaves.

### CIT-03: Autores numerados

Conserva os índices ao adaptar sobrenome, prenome e ligação de autores.

Antes:

```wikitext
{{citar livro|last1=Exemplo|first1=Ana|last2=Modelo|first2=Bruno|title=Obra}}
```

Depois:

```wikitext
{{citar livro|ultimo1=Exemplo|primeiro1=Ana|ultimo2=Modelo|primeiro2=Bruno|título=Obra}}
```

Só usa campos reconhecidos pela família bibliográfica.

Opções relacionadas: `authors`.

### CIT-04: Campos repetidos idênticos

Consolida um parâmetro repetido com o mesmo valor.

Antes:

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento|titulo=Documento}}
```

Depois:

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento}}
```

Valores divergentes ou com prioridades diferentes permanecem.

Opções relacionadas: `automaticParameterDuplicates`.

### CIT-05: Parâmetros inválidos vazios

Retira um campo vazio que o modelo conhecido não utiliza.

Antes:

```wikitext
Um campo vazio comprovadamente inexistente em um modelo cujo catálogo está completo.
```

Depois:

```wikitext
A mesma chamada sem o campo vazio.
```

Não apaga campos preenchidos para eliminar um aviso. Catálogos parciais não autorizam exclusão genérica.

Opções relacionadas: `automaticEmptyParameters`.

### CIT-06: Erros exatos no nome dos campos

Corrige uma chave com correspondência única no modelo.

Antes:

```wikitext
{{citar web|url=https://example.invalid/|títutlo=Documento}}
```

Depois:

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento}}
```

Usa mapas finitos e o leitor nativo, sem substituir palavras por aproximação livre.

Opções relacionadas: `automaticParameterNames`, `automaticCitationKeyRepairs`.

### CIT-07: Barra literal no título

Recupera um trecho de título partido por uma barra vertical quando os limites são inequívocos.

Antes:

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento | ciência aplicada |data=2024}}
```

Depois:

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento {{!}} ciência aplicada |data=2024}}
```

Um argumento que também pode ser um parâmetro ou campo separado não é absorvido por suposição.

### CIT-08: Campo caderno e localizadores

Migra um campo de caderno somente para o campo nativo que mantém sua função.

Antes:

```wikitext
|caderno=Ciência
```

Depois:

```wikitext
|departamento=Ciência
```

Exige jornal e domínio concordantes, caderno previsto e campo de destino aceito. Não migra um caderno de publicação desconhecida nem trata capítulo, página, seção e número de artigo como sinônimos.

Opções relacionadas: `citationRepairs`.

### CIT-09: Datas bibliográficas literais

Normaliza datas completas ou parciais reconhecidas e mantém sua precisão.

Antes:

```wikitext
{{citar web|titulo=Documento|data=April 3, 2020}}
```

Depois:

```wikitext
{{citar web|titulo=Documento|data=3 de abril de 2020}}
```

Datas impossíveis ou numéricas ambíguas permanecem. O campo de embargo pode exigir ISO.

Opções relacionadas: `dates`, `automaticCitationDateValues`.

### CIT-10: Acesso e assinatura

Adapta a chave e os valores de acesso reconhecidos sem remover a informação de assinatura.

Antes:

```wikitext
{{citar web|titulo=Documento|url=https://example.invalid/|url-access=subscription}}
```

Depois:

```wikitext
{{citar web|titulo=Documento|url=https://example.invalid/|acessourl=subscrição}}
```

A equivalência depende dos valores aceitos pelo modelo nativo. Um valor não reconhecido não é apagado.

### CIT-11: Endereços e datas de arquivo

Adapta campos de arquivamento, preservando os endereços e a data informada.

Antes:

```wikitext
{{citar web|title=Documento|archive-url=https://example.invalid/arquivo|archive-date=April 3, 2020}}
```

Depois:

```wikitext
{{citar web|título=Documento|arquivourl=https://example.invalid/arquivo|arquivodata=3 de abril de 2020}}
```

Não substitui uma data de arquivo por uma data de publicação.

### CIT-12: Data de captura já escrita na URL

Aproveita um carimbo Wayback completo e válido quando o endereço original corresponde.

Antes:

```wikitext
{{citar web|url=https://example.invalid/a|titulo=Documento|arquivourl=https://web.archive.org/web/20200403000000/https://example.invalid/a}}
```

Depois:

```wikitext
{{citar web|url=https://example.invalid/a|titulo=Documento|arquivourl=https://web.archive.org/web/20200403000000/https://example.invalid/a|arquivodata=2020-04-03}}
```

Sem carimbo completo, correspondência de endereço e ausência de conflito, nenhuma data é preenchida.

### CIT-13: DOI com pontuação excedente

Retira pontuação final apenas quando o identificador correto é confirmado.

Antes:

```wikitext
|doi=10.0000/exemplo.
```

Depois:

```wikitext
|doi=10.0000/exemplo
```

O exemplo representa o campo. Exige confirmação do identificador, não elimina pontuação válida de DOI.

Opções relacionadas: `identifierUrlRepairs`, `registryDoiCheck`.

### CIT-14: ISBN e repetições

Retira um ponto final ou uma repetição quando resta um ISBN válido.

Antes:

```wikitext
|isbn=9780306406157.
```

Depois:

```wikitext
|isbn=9780306406157
```

Pares válidos de ISBN-10 e ISBN-13 e números diferentes não são eliminados.

### CIT-15: Identificadores em ligações

Reconhece as formas previstas de DOI, PMID, PMC, arXiv e identificadores bibliográficos sem alterar seus valores.

Antes:

```wikitext
|doi=https://doi.org/10.0000/exemplo
```

Depois:

```wikitext
|doi=10.0000/exemplo
```

Só normaliza uma forma literal cuja equivalência é confirmada.

Opções relacionadas: `identifierUrlRepairs`.

### CIT-16: Campo título recuperável localmente

Recupera um título ausente de outra citação compatível da mesma fonte na página.

Antes:

```wikitext
{{citar web|url=https://example.invalid/a}}
```

Depois:

```wikitext
{{citar web|url=https://example.invalid/a|titulo=Documento fictício}}
```

Exige uma ocorrência local inequívoca com esse título e os mesmos campos de identidade. Não cria o título a partir do endereço.

### CIT-17: Lista Vancouver e falha Lua

Usa a chave que o módulo nativo realmente lê para listas Vancouver.

Antes:

```wikitext
{{citar periódico|vautores=Exemplo A|titulo=Artigo}}
```

Depois:

```wikitext
{{citar periódico|vauthors=Exemplo A|titulo=Artigo}}
```

A exceção em inglês evita a falha conferida do módulo. Não troca autoria por inferência.

### CIT-18: Limites perdidos entre campos

Recupera separadores e rótulos de campo colados nos casos finitos previstos.

Antes:

```wikitext
{{citar web url=https://example.invalid/|titulo=Documento}}
```

Depois:

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento}}
```

Só há reparo quando modelo, chave e limites são únicos.

### CIT-19: Formatação compacta de citações

Coloca citações reconhecidas em uma linha sem juntar conteúdo que depende de quebras.

Antes:

```wikitext
{{citar web
|url=https://example.invalid/
|titulo=Documento
}}
```

Depois:

```wikitext
{{citar web|url=https://example.invalid/|titulo=Documento}}
```

Protege listas, comentários, código e valores em que a quebra tem função.

Opções relacionadas: `singleLineCitations`.

### CIT-20: Obras históricas e modelos importados

Migra as famílias históricas conferidas sem manter categorias técnicas inglesas indevidas.

Antes:

```wikitext
Uma citação histórica importada com obra, verbete e ano completos.
```

Depois:

```wikitext
Uma citação nativa equivalente, com os mesmos dados bibliográficos.
```

A família e os campos precisam constar do catálogo. Não é uma remoção geral de categorias desconhecidas.

Opções relacionadas: `historicalCitationRepairs`.

## Infocaixas e biografias

### BIO-01: Campos de infocaixas conforme cada modelo

Adapta chaves estrangeiras ou traduzidas incorretamente ao nome aceito pela caixa específica.

Antes:

```wikitext
{{Info/Biografia|birth_place=Cidade fictícia}}
```

Depois:

```wikitext
{{Info/Biografia|nascimento_local=Cidade fictícia}}
```

O mesmo campo inglês pode ter destinos diferentes em caixas diferentes. Nenhum valor preenchido é descartado para silenciar um aviso.

Opções relacionadas: `infoboxes`, `automaticBiographyFields`, `automaticParameterNames`.

### BIO-02: Prioridade dos nomes alternativos

Preserva o valor que a caixa nativa efetivamente escolhe.

Antes:

```wikitext
{{Info/Biografia|ocupação=pesquisadora|ocupações=}}
```

Depois:

```wikitext
{{Info/Biografia|ocupação=pesquisadora}}
```

Campos conflitantes ou alternativas com função diferente não são fundidos.

### BIO-03: Infocaixa antes da introdução

Move uma única caixa principal que ficou depois da abertura para o começo do artigo.

Antes:

```wikitext
'''Pessoa fictícia''' foi pesquisadora.
{{Info/Biografia|nome=Pessoa fictícia}}
```

Depois:

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
'''Pessoa fictícia''' foi pesquisadora.
```

Não reorganiza uma caixa que pertence a outra pessoa, outra seção ou a uma sequência de caixas com função distinta.

Opções relacionadas: `automaticInfoboxOrder`.

### BIO-04: Linha própria depois da infocaixa

Separa uma caixa fechada do texto da abertura.

Antes:

```wikitext
{{Info/Biografia/Wikidata}}'''Pessoa fictícia''' foi pesquisadora.
```

Depois:

```wikitext
{{Info/Biografia/Wikidata}}
'''Pessoa fictícia''' foi pesquisadora.
```

Não altera o conteúdo da caixa ou da frase.

### BIO-05: Infocaixa legível em linhas

Distribui campos de uma caixa compacta por linhas, mantendo sua ordem.

Antes:

```wikitext
{{Info/Assentamento/Marrocos|com|nome=Local fictício|população_total=1000}}
```

Depois:

```wikitext
{{Info/Assentamento/Marrocos|com
|nome=Local fictício
|população_total=1000
}}
```

A formatação usa os modelos e limites conferidos, sem distribuir automaticamente qualquer predefinição.

Opções relacionadas: `templateReadableFormatting`.

### BIO-06: Alinhamento e espaço depois do igual

Alinha os campos nos modelos previstos e retira o espaço horizontal depois de = em argumentos reconhecidos.

Antes:

```wikitext
|nome                  = Pessoa fictícia
```

Depois:

```wikitext
|nome                  =Pessoa fictícia
```

Quebras de linha, espaços internos dos valores e contextos em que a indentação tem função permanecem.

Opções relacionadas: `automaticFieldSyntax`.

### BIO-07: Cabeçalho sem negrito redundante

Retira negrito do nome quando a caixa já o aplica.

Antes:

```wikitext
{{Info/Biografia|nome='''Pessoa fictícia'''}}
```

Depois:

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
```

Só alcança o campo de cabeçalho conferido, não o nome em negrito da introdução.

### BIO-08: Profissões comuns com inicial minúscula

Corrige a capitalização em campos de profissão reconhecidos.

Antes:

```wikitext
|ocupação=Jornalista
```

Depois:

```wikitext
|ocupação=jornalista
```

Nomes próprios, títulos, siglas, citações e valores ambíguos são preservados.

Opções relacionadas: `occupationCase`.

### BIO-09: Flexão de profissões confirmada

Corrige formas comuns incompatíveis com a identidade feminina ou masculina explicitamente confirmada.

Antes:

```wikitext
|ocupação=jornalista e redator
```

Depois:

```wikitext
|ocupação=jornalista e redatora
```

O exemplo exige identidade feminina confirmada e profissão prevista no mapa. Não deduz gênero só pelo nome.

### BIO-10: Listas de ocupações e campos

Organiza listas simples que foram coladas em um campo.

Antes:

```wikitext
|ocupação=ator, cantor
```

Depois:

```wikitext
|ocupação=ator<br />cantor
```

Exige uma lista de termos reconhecidos, sem transformar uma frase explicativa.

### BIO-11: Datas de nascimento e morte

Adapta formatos literais e predefinições estrangeiras de data ao campo nativo.

Antes:

```wikitext
|nascimento_data=1900-01-02
```

Depois:

```wikitext
|nascimento_data={{DataExt|2|1|1900}}
```

Conserva precisão, calendário, referências e incertezas. Não inventa dia ou mês.

Opções relacionadas: `birthDates`.

### BIO-12: Idade de pessoa viva

Retira a supressão de idade quando a condição de pessoa viva está confirmada.

Antes:

```wikitext
{{Dni|2|1|1990|si}}
```

Depois:

```wikitext
{{Dni|2|1|1990}}
```

Não altera uma pessoa morta ou de estado vital incerto. Não muda dni para Dni apenas por capitalização.

Opções relacionadas: `livingBirthAge`.

### BIO-13: Nascimento e morte na abertura

Leva dados já presentes e referenciados da infocaixa à abertura quando falta a apresentação biográfica.

Antes:

```wikitext
'''Pessoa fictícia''' foi pesquisadora.
```

Depois:

```wikitext
'''Pessoa fictícia''' ({{DataExt|2|1|1900}}<ref>Fonte da data.</ref>) foi pesquisadora.
```

O exemplo exige a data e a mesma referência na caixa principal. Sem fonte, com conflito ou caixa filha de outra pessoa, o dado não é copiado.

Opções relacionadas: `automaticBiographyLead`.

### BIO-14: Dados da abertura em campos separados

Separa data e local que foram unidos em um campo e aproveita dados inequívocos da abertura.

Antes:

```wikitext
|nascimento_data={{DataExt|2|1|1900}}, [[Cidade fictícia]]
```

Depois:

```wikitext
|nascimento_data={{DataExt|2|1|1900}}
|nascimento_local=[[Cidade fictícia]]
```

Preserva as referências de cada componente e não substitui um campo preenchido divergente.

Opções relacionadas: `automaticBiographyFields`.

### BIO-15: Categoria de nascimento redundante

Retira a categoria anual escrita à mão quando a chamada de data já a produz.

Antes:

```wikitext
{{Dni|2|1|1900|si}}
[[Categoria:Nascidos em 1900]]
```

Depois:

```wikitext
{{Dni|2|1|1900|si}}
```

Exige confirmar a categorização nativa no mesmo contexto e preservar chave de ordenação ou diferença funcional.

Opções relacionadas: `redundantBirthCategories`.

### BIO-16: Casamento com datas e estado civil

Usa Casamento para formatos literais completos previstos, sem alterar nome, datas ou motivo do término.

Antes:

```wikitext
|cônjuge=Pessoa Exemplo (casamento em 2000; divórcio em 2010)
```

Depois:

```wikitext
|cônjuge={{casamento|Pessoa Exemplo|2000|2010|fim=divórcio}}
```

Só converte as formas e os campos conferidos. Relações incertas, datas ambíguas ou múltiplas pessoas sem limites ficam como estão.

### BIO-17: Site oficial conforme o leitor da caixa

Corrige sintaxe de endereço, protocolo repetido e apresentação conforme o campo nativo.

Antes:

```wikitext
|website=[[https://example.invalid/|Sítio oficial]]
```

Depois:

```wikitext
|site=[https://example.invalid/ Sítio oficial]
```

Algumas caixas esperam uma URL pura, outras aceitam ligação rotulada. A regra respeita o leitor, sem trocar o domínio.

### BIO-18: Arquivo, tamanho e legenda em campos próprios

Separa uma imagem completa colocada no campo que espera o nome do arquivo.

Antes:

```wikitext
|imagem=[[Ficheiro:Retrato fictício.jpg|220px|Retrato em 2000]]
```

Depois:

```wikitext
|imagem=Retrato fictício.jpg
|imagem_tamanho=220px
|imagem_legenda=Retrato em 2000
```

Exige campos de destino conferidos e ausência de legenda ou tamanho concorrente.

Opções relacionadas: `automaticInfoboxImages`.

### BIO-19: Texto alternativo da imagem

Conserva e, quando possível, separa alt para o campo nativo equivalente.

Antes:

```wikitext
|imagem=[[Ficheiro:Retrato fictício.jpg|220px|alt=Retrato frontal]]
```

Depois:

```wikitext
|imagem=Retrato fictício.jpg
|alt=Retrato frontal
|imagem_tamanho=220px
```

Não redige uma descrição visual nova nem a infere do arquivo.

### BIO-20: Tamanho de imagem com unidade repetida

Corrige unidades repetidas em campos confirmados.

Antes:

```wikitext
|imagem_tamanho=220pxpx
```

Depois:

```wikitext
|imagem_tamanho=220px
```

Não impõe uma largura universal nem altera um valor válido só por preferência.

### BIO-21: Campos de unidades nativas

Retira uma unidade repetida quando a caixa a acrescenta por conta própria.

Antes:

```wikitext
{{Info/Piloto de automóvel|altura=1,80 m}}
```

Depois:

```wikitext
{{Info/Piloto de automóvel|altura=1,80}}
```

A unidade deve ser confirmada para o campo, sem converter o valor numérico.

### BIO-22: Caixas incorporadas

Reconhece módulos internos compatíveis e mantém os dados de cada caixa.

Antes:

```wikitext
{{Info/Biografia|nome=Pessoa fictícia|módulo={{Info/Cientista|incorporar=sim}}}}
```

Depois:

```wikitext
{{Info/Biografia|nome=Pessoa fictícia|módulo={{Info/Cientista|incorporar=sim}}}}
```

A caixa filha precisa aceitar incorporação. A Info/Biografia usa módulo e módulo2 a módulo6, sem criar módulo1.

### BIO-23: Caixas principais repetidas

Retira uma cópia de infocaixa comprovadamente redundante.

Antes:

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
{{Info/Biografia|nome=Pessoa fictícia}}
```

Depois:

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
```

Não escolhe entre caixas com fatos diferentes nem remove caixas de assuntos diferentes.

### BIO-24: Campos com significado próprio

Mantém campos cuja migração mudaria o fato descrito.

Antes:

```wikitext
|batismo=2 de janeiro de 1900
|instituições=Instituição fictícia
```

Depois:

```wikitext
|batismo=2 de janeiro de 1900
|instituições=Instituição fictícia
```

Batismo não vira nascimento. Instituição, empregador, gênero literário, influência e sepultamento dependem do contrato de cada modelo.

## Portais e controle de autoridade

### POR-01: Biografias confirmadas

Acrescenta Biografias quando há uma pessoa e um perfil confirmado, inclusive caixas Wikidata.

Antes:

```wikitext
{{Portal3|Política}}
```

Depois:

```wikitext
{{Portal3|Política|Biografias}}
```

A presença de uma caixa genérica sem identidade confirmada não basta. A grafia e a ordem finais seguem o mapa nativo.

Opções relacionadas: `biographyPortal`.

### POR-02: País sem duplicar o estado

Acrescenta o país apenas quando o dado é explícito e não há um portal regional que o torne redundante.

Antes:

```wikitext
{{Portal3|Biografias|Goiás}}
```

Depois:

```wikitext
{{Portal3|Biografias|Goiás}}
```

Nascer, trabalhar e morrer em um país não são dados intercambiáveis. Não acrescenta Brasil quando o estado brasileiro já atende ao perfil.

### POR-03: Mulheres

Acrescenta o portal nos perfis em que a identidade está confirmada.

Antes:

```wikitext
{{Portal3|Biografias}}
```

Depois:

```wikitext
{{Portal3|Biografias|Mulheres}}
```

Não deduz a identidade pelo prenome ou por uma palavra isolada.

### POR-04: Profissão e esporte

Acrescenta os portais previstos por profissão, área de trabalho ou modalidade explicitamente indicada.

Antes:

```wikitext
Uma pessoa com caixa individual de futebolista, modalidade e país confirmados.
```

Depois:

```wikitext
Portal3 com Biografias, Esportes, Futebol e o país elegível, além dos portais já existentes.
```

Preserva portais mais específicos e não classifica uma banda como uma pessoa.

Opções relacionadas: `automaticBiographyPortals`.

### POR-05: Artes e ciências

Reconhece os perfis conferidos de artistas, músicos, escritores, militares e cientistas.

Antes:

```wikitext
Uma caixa principal de cientista com disciplina confirmada.
```

Depois:

```wikitext
Acrescenta somente os portais previstos para essa disciplina e Biografias.
```

Profissão, gênero artístico e instituição não são tratados como a mesma evidência.

### POR-06: Filmes, séries e obras musicais

Usa os modelos próprios de obras para reconhecer Cinema, Televisão e Música.

Antes:

```wikitext
Um artigo com uma caixa nativa de álbum ou episódio de televisão.
```

Depois:

```wikitext
Acrescenta os portais temáticos correspondentes, sem Biografias para a obra.
```

Requer caixa e perfil nativos, não apenas palavras no título.

Opções relacionadas: `automaticTopicPortals`.

### POR-07: Biologia e saúde

Usa perfis de taxonomia, medicamentos, doenças e demais caixas conferidas.

Antes:

```wikitext
Uma caixa taxonômica de animal com classe confirmada.
```

Depois:

```wikitext
Acrescenta os portais compatíveis, como Animais e a classe prevista no mapa.
```

Não identifica classe biológica, indicação clínica ou especialidade pela aparência do nome.

### POR-08: Demais assuntos

Reconhece livros, universidades, jornais, revistas científicas, municípios, rios, ilhas, conflitos, software, empresas, clubes, estádios, automóveis, moedas, partidos, eventos meteorológicos, cerveja e veículos espaciais nos perfis cadastrados.

Antes:

```wikitext
Uma caixa nativa de rio ou software sem Portal3.
```

Depois:

```wikitext
Acrescenta o portal específico previsto e conserva os já presentes.
```

O catálogo de perfis indica exatamente os modelos e condições ativados.

### POR-09: Esboço com assunto confirmado

Aproveita combinações conferidas de esboço e categoria para um portal temático.

Antes:

```wikitext
Um artigo sem infocaixa, com esboço temático e categoria concordantes.
```

Depois:

```wikitext
Acrescenta somente o portal que essa combinação confirma.
```

Um esboço genérico ou uma categoria isolada não autorizam classificação livre.

### POR-10: Nomes de portais importados

Troca nomes estrangeiros ou erros previstos por destinos portugueses existentes.

Antes:

```wikitext
{{Portal3|Biography|Football}}
```

Depois:

```wikitext
{{Portal3|Biografias|Futebol}}
```

Não traduz nomes ambíguos nem inventa portais inexistentes.

### POR-11: Posições e repetições em Portal3

Reúne portais equivalentes e normaliza posições reconhecidas sem criar 5= desnecessário.

Antes:

```wikitext
{{Portal3|Biografias|Futebol|3=Brasil}}
```

Depois:

```wikitext
{{Portal3|Biografias|Futebol|Brasil}}
```

Preserva opções nomeadas e a ordem válida. Não ultrapassa a capacidade confirmada de Portal3.

### POR-12: Posição do portal no rodapé

Move uma chamada isolada fora de lugar para o rodapé confirmado.

Antes:

```wikitext
Texto.
{{Portal3|Ciência}}
== Referências ==
<references/>
```

Depois:

```wikitext
Texto.
{{Referências}}

{{Portal3|Ciência}}
```

Não atravessa uma estrutura desconhecida, bloco protegido ou limite de seção sem prova.

### POR-13: Autoridade com algo para exibir

Acrescenta o controle apenas após confirmar identificadores que a chamada mostrará.

Antes:

```wikitext
Rodapé de artigo com identificadores de autoridade confirmados no item correspondente.
```

Depois:

```wikitext
{{Controle de autoridade}}
{{Portal3|Biografias}}
```

A presença de um item do Wikidata não basta. Sem identificadores exibíveis, não acrescenta uma caixa vazia.

Opções relacionadas: `authorityControl`.

### FOOT-04: Uma chamada efetiva de autoridade

Evita caixas duplicadas, inclusive por chamadas indiretas conferidas.

Antes:

```wikitext
{{Controle de autoridade}}
{{Authority control}}
{{Portal3|Biografias}}
```

Depois:

```wikitext
{{Controle de autoridade}}
{{Portal3|Biografias}}
```

NM e NF só são considerados quando sua expansão realmente fornece a mesma caixa. Seus anos e chave de ordenação ficam preservados. Cópias literais idênticas e adjacentes podem manter a última chamada. Uma chamada de ordenação ou um programa desconhecido entre as cópias impede tratá-las como duplicação simples. A mudança de posição também conserva a ordem de avaliação.

## Imagens e ligações

### IMG-01: Espaços de nomes e opções de imagem

Adapta Image e thumb no contexto de uma imagem reconhecida.

Antes:

```wikitext
[[Image:Exemplo.jpg|thumb|220px|Uma paisagem.]]
```

Depois:

```wikitext
[[Imagem:Exemplo.jpg|miniatura|220px|Uma paisagem.]]
```

Mantém arquivo, largura, legenda, texto alternativo e destino. Não traduz a legenda.

### IMG-02: Miniaturada e erros previstos

Corrige opções digitadas incorretamente quando não são parte da legenda.

Antes:

```wikitext
[[Imagem:Exemplo.jpg|miniaturada|220px|Uma paisagem.]]
```

Depois:

```wikitext
[[Imagem:Exemplo.jpg|miniatura|220px|Uma paisagem.]]
```

Um termo dentro da legenda não é tratado como opção.

### IMG-03: Arquivo importado como endereço

Reconhece endereços de página de arquivo nos campos conferidos.

Antes:

```wikitext
|imagem=https://commons.wikimedia.org/wiki/File:Exemplo.jpg
```

Depois:

```wikitext
|imagem=Exemplo.jpg
```

Exige confirmar o mesmo arquivo e o formato esperado pelo campo.

### IMG-04: Tamanhos e sintaxe de opção

Repara unidades duplicadas e delimitadores previstos sem impor um tamanho a todas as imagens.

Antes:

```wikitext
[[Imagem:Exemplo.jpg|miniatura|220pxpx|Legenda]]
```

Depois:

```wikitext
[[Imagem:Exemplo.jpg|miniatura|220px|Legenda]]
```

Mantém opções funcionais e tamanhos válidos.

### LNK-01: Ligações internas sem pipe redundante

Simplifica uma ligação cujo rótulo é igual ao destino.

Antes:

```wikitext
[[Ecossistema|Ecossistema]]
```

Depois:

```wikitext
[[Ecossistema]]
```

Não retira rótulos com capitalização, flexão ou sentido diferente.

Opções relacionadas: `links`.

### LNK-02: Flexão simples fora da ligação

Põe uma terminação simples depois do link quando a leitura e o destino não mudam.

Antes:

```wikitext
[[ecossistema|ecossistemas]]
```

Depois:

```wikitext
[[ecossistema]]s
```

Depende do padrão confirmado. Não aplica um algoritmo livre de flexão.

### LNK-03: Fechamento único de ligação

Recupera um colchete faltante quando o limite é único.

Antes:

```wikitext
Consulte [[Tema fictício] neste exemplo.
```

Depois:

```wikitext
Consulte [[Tema fictício]] neste exemplo.
```

Várias aberturas ou limites concorrentes impedem a correção.

Opções relacionadas: `syntaxRepairs`.

### LNK-04: Ligações externas com sintaxe interna

Corrige a marcação inequívoca de um endereço externo.

Antes:

```wikitext
[[https://example.invalid/|Sítio oficial]]
```

Depois:

```wikitext
[https://example.invalid/ Sítio oficial]
```

Uma barra que pertence à consulta da URL não é separador de rótulo.

### LNK-05: Rótulo externo partido

Substitui uma quebra indevida por espaço quando endereço e rótulo estão completos.

Antes:

```wikitext
[https://example.invalid/
Documento fictício]
```

Depois:

```wikitext
[https://example.invalid/ Documento fictício]
```

Não funde uma lista ou uma URL com limites incertos.

### LNK-06: Protocolos e ampersands previstos

Corrige repetições e codificação duplicada em padrões literais.

Antes:

```wikitext
https://https://example.invalid/
```

Depois:

```wikitext
https://example.invalid/
```

Não reescreve caminhos, parâmetros ou protocolos desconhecidos.

### LNK-07: Título de seção com ligação

Retira a ligação do título e usa uma remissão principal quando essa equivalência está confirmada.

Antes:

```wikitext
== [[Tema fictício]] ==
```

Depois:

```wikitext
== Tema fictício ==
{{Artigo principal|Tema fictício}}
```

Exige destino existente, não ambíguo e diferente do próprio artigo, com equivalência confirmada. Não duplica remissão já presente, nem presume que todo link misturado no título seja o assunto principal.

Opções relacionadas: `headings`.

## Tabelas e sintaxe

### TAB-01: Aberturas e fechamentos de tabelas

Corrige erros finitos nos delimitadores quando cada tabela e cada célula continuam identificáveis.

Antes:

```wikitext
Uma tabela completa com um delimitador digitado incorretamente e fechamento único.
```

Depois:

```wikitext
A mesma tabela com o delimitador correto e as mesmas células.
```

Não fecha uma tabela arbitrariamente no fim do artigo nem corta células para caber na tela.

Opções relacionadas: `tableSyntaxRepairs`, `automaticTableRepairs`.

### TAB-02: Aspas dos atributos

Troca aspas tipográficas por delimitadores válidos de atributo.

Antes:

```wikitext
! scope=“col” | Nome
```

Depois:

```wikitext
! scope="col" | Nome
```

Conserva o texto das células e as strings em que as aspas são conteúdo.

### TAB-03: Cabeçalhos simples acessíveis

Acrescenta scope aos cabeçalhos elegíveis.

Antes:

```wikitext
! Nome !! Valor
```

Depois:

```wikitext
! scope="col" | Nome !! scope="col" | Valor
```

Exige uma grade simples e papel de cabeçalho inequívoco. Tabelas complexas não recebem suposições de alcance.

Opções relacionadas: `tableAccessibility`.

### TAB-04: Atributos antigos equivalentes

Retira um atributo redundante quando o CSS existente já fornece exatamente o mesmo valor.

Antes:

```wikitext
|- style="text-align:left;" align="left"
```

Depois:

```wikitext
|- style="text-align:left;"
```

Conflitos de valores e regras com apresentação não equivalente permanecem.

### TAB-05: Formatação esquecida dentro da célula

Fecha marcação local quando o limite da célula prova onde deve terminar.

Antes:

```wikitext
| <small>Alfa
| Beta
```

Depois:

```wikitext
| <small>Alfa</small>
| Beta
```

Se o fechamento posterior for intencional ou o limite for incerto, preserva a marcação.

### TAB-06: Texto deslocado pelo leitor de tabelas

Tira de dentro da abertura uma legenda de lista que já seria exibida antes da tabela.

Antes:

```wikitext
{| class="wikitable"
;Explicação
! Nome
| Alfa
|}
```

Depois:

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

Antes:

```wikitext
Uma célula com grafia incorreta inequívoca de um atributo conhecido.
```

Depois:

```wikitext
A mesma célula com atributo aceito, conservando conteúdo e extensão.
```

A grade antes e depois precisa corresponder. Não reorganiza dados para forçar uma comparação.

### TAB-08: Tabelas largas e apresentação responsiva

Trata estilos e contenção nos perfis de tabela confirmados, sem aplicar invólucros genéricos ao artigo.

Antes:

```wikitext
Uma tabela com configuração de largura comprovadamente defeituosa e perfil suportado.
```

Depois:

```wikitext
A mesma tabela com apresentação corrigida, conservando fórmulas, unidades e células.
```

Largura grande não basta para autorizar mudança. Infocaixas, navecaixas e portais continuam usando suas chamadas nativas.

Opções relacionadas: `responsiveTableWrappers`.

### SYN-01: Chaves e colchetes em limites únicos

Repara trocas previstas de fechamentos quando há uma única estrutura reconhecida.

Antes:

```wikitext
Uma chamada conhecida com fechamento trocado e limites inequívocos.
```

Depois:

```wikitext
A mesma chamada com fechamento correspondente.
```

Não usa uma troca global entre }} e ]] nem completa estruturas arbitrárias.

Opções relacionadas: `syntaxRepairs`.

### SYN-02: Trecho completo anterior a marcação incerta

Aplica correções locais independentes em trechos verificáveis.

Antes:

```wikitext
Uma ligação simples com erro antes de um bloco incompleto independente.
```

Depois:

```wikitext
A ligação corrigida e o bloco incompleto preservado.
```

As partes completas precisam permanecer independentes do bloco incerto.

Opções relacionadas: `partialSyntaxRecovery`, `independentRepairGroups`.

### SYN-03: Resíduos de cópia de chat

Retira cercas Markdown que envolvem somente o artigo completo e marcas técnicas conhecidas de cópia.

Antes:

````wikitext
```wikitext
'''Vila Aurora''' é uma povoação.

== Geografia ==
Texto da seção.
{{Referências}}
```
````

Depois:

```wikitext
'''Vila Aurora''' é uma povoação.

== Geografia ==
Texto da seção.
{{Referências}}
```

Exige abertura de artigo, seção e elementos de estrutura confirmados. Exemplos de código, citações literais e artigos sobre a própria marcação ficam intactos.

Opções relacionadas: `translationResidues`.

### SYN-04: Negrito e itálico Markdown

Converte ênfase inequívoca para a marcação wiki.

Antes:

```wikitext
O termo **rede óptica** aparece no texto.
```

Depois:

```wikitext
O termo '''rede óptica''' aparece no texto.
```

Não modifica listas aninhadas, fórmulas, código ou exemplos sobre a marcação.

Opções relacionadas: `markup`.

### SYN-05: Múltiplas linhas vazias

Reduz espaçamento redundante em trechos de prosa e entre estruturas completas.

Antes:

```wikitext
Primeiro parágrafo.

 	
Segundo parágrafo.
```

Depois:

```wikitext
Primeiro parágrafo.

Segundo parágrafo.
```

Protege poemas, blocos preformatados, código, listas e contextos em que a quebra tem função.

### SYN-06: Começo sem linhas vazias

Retira linhas vazias do começo do artigo, inclusive após remover Descrição curta.

Antes:

```wikitext


Texto do artigo.
```

Depois:

```wikitext
Texto do artigo.
```

Preserva a indentação do primeiro conteúdo quando ela tem função.

### SYN-07: Título redundante na abertura

Retira o título inicial que apenas repete o título da página.

Antes:

```wikitext
== Tema fictício ==
Texto da introdução.
```

Depois:

```wikitext
Texto da introdução.
```

Exige correspondência com a página e abertura normal, sem apagar uma seção legítima.

### SYN-08: Lista com itens vazios no final

Retira marcadores vazios que não têm subitens ou outra função.

Antes:

```wikitext
* Primeiro item
*
*
```

Depois:

```wikitext
* Primeiro item
```

Um marcador com filhos ou efeito de estrutura permanece.

### SYN-09: Erros ortográficos exatos

Corrige grafias previstas por uma lista finita, sem reescrever frases.

Antes:

```wikitext
As espectativas cresceram quando o filme estreiou.
```

Depois:

```wikitext
As expectativas cresceram quando o filme estreou.
```

Protege nomes próprios, links, títulos bibliográficos, citações, itálico, parênteses e exemplos nos contextos previstos.

Opções relacionadas: `automaticSpelling`.

### SYN-10: Descrição curta e modelos obsoletos

Retira Descrição curta do artigo e trata os modelos obsoletos com ação expressa no catálogo.

Antes:

```wikitext
{{Descrição curta|Um tema fictício}}

Texto do artigo.
```

Depois:

```wikitext
Texto do artigo.
```

Uma chamada interna que possa definir categorias, ordenação ou outros metadados impede a remoção da predefinição inteira. Programas ou chamadas internas sem equivalência confirmada ficam preservados, sem impedir ajustes independentes. Um modelo desconhecido não é considerado obsoleto só por não constar do catálogo.

Opções relacionadas: `shortDescriptions`, `obsoleteTemplates`.

### SYN-11: Categorias e palavras mágicas importadas

Adapta as palavras mágicas e os prefixos previstos, conservando seus argumentos.

Antes:

```wikitext
{{DEFAULTSORT:Exemplo, Tema}}
```

Depois:

```wikitext
{{DEFAULTSORT:Exemplo, Tema}}
```

Uma chamada nativa válida permanece. Só há adaptação com alias ou palavra mágica de origem confirmada.

Opções relacionadas: `multilingual`.

### SYN-12: Coordenadas duplicadas

Retira uma chamada de título redundante sem perder a mais completa.

Antes:

```wikitext
{{Coord|1|2|N|3|4|E|display=title}}
{{Coord|1|2|N|3|4|E|display=title|type=city}}
```

Depois:

```wikitext
{{Coord|1|2|N|3|4|E|display=title|type=city}}
```

Coordenadas, opções ou funções conflitantes permanecem.

## Seções finais, colunas e projetos irmãos

### COL-01: Duas colunas a partir de oito itens

Usa Colunas-lista em listas simples de Ligações externas, Bibliografia ou Leitura adicional.

Antes:

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

Depois:

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

Opções relacionadas: `endMatterColumns`, `externalLinkColumns`.

### COL-02: Lista curta sem colunas

Retira um invólucro simples de duas colunas quando há menos de oito itens.

Antes:

```wikitext
== Bibliografia ==
{{Colunas-lista|2|2=
* Uma obra
}}
```

Depois:

```wikitext
== Bibliografia ==
* Uma obra
```

Preserva estilos e configurações com função própria, tabelas ou estruturas sem equivalência.

### COL-03: Colunas manuais sem col1 e col2

Transforma blocos simples de colunas manuais em uma lista contínua.

Antes:

```wikitext
{{Colunas|col1=
* [https://example.invalid/a Item A]
|col2=
* [https://example.invalid/b Item B]
}}
```

Depois:

```wikitext
* [https://example.invalid/a Item A]
* [https://example.invalid/b Item B]
```

Exige itens simples de ligações ou citações bibliográficas reconhecidas e preserva a sequência e os subitens. Comparações, listas com títulos ou funções diferentes e estilos próprios permanecem. Usa duas colunas apenas se a lista completa atingir oito itens, sem somar seções diferentes.

### COL-04: Colunas de referências com mínimo próprio

Usa duas colunas quando há ao menos dez entradas elegíveis.

Antes:

```wikitext
{{Referências}} com dez referências distintas.
```

Depois:

```wikitext
Lista de referências em duas colunas, com as mesmas fontes.
```

Não conta chamadas repetidas da mesma entrada como fontes novas. Configurações técnicas próprias podem permanecer.

Opções relacionadas: `referenceColumns`.

### FOOT-01: Ordem das seções e do rodapé

Organiza blocos finais reconhecidos, respeitando suas dependências.

Antes:

```wikitext
Categoria ou navecaixa inserida entre o título de Referências e seu coletor.
```

Depois:

```wikitext
Coletor junto da seção e elementos de rodapé na posição correspondente.
```

Ver também pode ocupar as posições nativas permitidas. Uma lista precisa vir depois das chamadas que deve recolher. A reorganização conserva a ordem de avaliação das chamadas que podem definir a ordenação das categorias, inclusive dentro de outras predefinições ou extensões. Um movimento sem essa prova é omitido, enquanto os reparos independentes continuam.

Opções relacionadas: `endMatter`, `endSectionOrder`, `endTemplateOrder`.

### FOOT-02: Chave de ordenação antes das categorias

Move DEFAULTSORT para antes do conjunto de categorias.

Antes:

```wikitext
[[Categoria:Temas fictícios]]
{{DEFAULTSORT:Tema fictício}}
```

Depois:

```wikitext
{{DEFAULTSORT:Tema fictício}}
[[Categoria:Temas fictícios]]
```

Exige conservar a ordem de avaliação de DEFAULTSORT, NM, NF e outras chamadas que podem definir a ordenação. Uma predefinição ou extensão desconhecida não é presumida neutra, e chamadas internas também são conferidas. Quando mover a chave pode mudar a ordenação efetiva, ela permanece no lugar, sem impedir outros reparos.

### FOOT-03: Categorias consecutivas

Retira linhas vazias entre categorias adjacentes.

Antes:

```wikitext
[[Categoria:Temas fictícios]]

[[Categoria:Exemplos]]
```

Depois:

```wikitext
[[Categoria:Temas fictícios]]
[[Categoria:Exemplos]]
```

Não apaga texto ou predefinições que estejam entre as categorias. A retirada de espaços entre categorias simples continua elegível quando não é possível mover DEFAULTSORT com segurança.

### LAY-01: Navecaixas e portais sem div redundante

Retira um invólucro genérico de rolagem quando a chamada nativa já fornece o bloco.

Antes:

```wikitext
<div style="max-width:100%;overflow-x:auto" tabindex="0" role="region" aria-label="Navegação: Exemplo">
{{Portal3|Ciência}}
</div>
```

Depois:

```wikitext
{{Portal3|Ciência}}
```

Só remove um contêiner equilibrado e demonstravelmente redundante. Contenção funcional permanece.

### LAY-02: Infocaixa sem div redundante

Retira o invólucro genérico de flutuação e rolagem em volta de uma caixa elegível.

Antes:

```wikitext
<div style="float:right;clear:right;max-width:100%;overflow-x:auto" tabindex="0" role="region" aria-label="Informações de Exemplo">
{{Info/Biografia|nome=Pessoa fictícia}}
</div>
```

Depois:

```wikitext
{{Info/Biografia|nome=Pessoa fictícia}}
```

Não remove recipientes que controlam conteúdo adicional, alinhamento especial ou apresentação necessária.

### FOOT-05: Projetos irmãos abaixo de Ver também

Posiciona as caixas de projetos irmãos elegíveis após o título Ver também.

Antes:

```wikitext
== Ver também ==
* [[Tema fictício]]

== Ligações externas ==
{{Commonscat|Example}}
* Ligação externa
```

Depois:

```wikitext
== Ver também ==
{{Commonscat|Example}}
* [[Tema fictício]]

== Ligações externas ==
* Ligação externa
```

A posição depende de uma seção Ver também válida e da preservação da ordem de avaliação das demais chamadas. Uma caixa não atravessa uma chamada que possa mudar a ordenação sem equivalência confirmada. Não cria itens de Ver também ou conteúdo novo para justificar a caixa.

### FOOT-06: Ligação de projeto irmão em caixa

Converte as formas em linha previstas para a caixa correspondente.

Antes:

```wikitext
{{Commonscat-inline|Example}}
```

Depois:

```wikitext
{{Commonscat|Example}}
```

As formas em linha conferidas são Commonscat, Commons, Wikiquote, Wikisource, Wikcionário e Wikivoyage. Exige par nativo equivalente, alvo e rótulo preservados. Não converte qualquer ligação interprojeto em caixa.

### QUAL-01: Indicador de qualidade duplicado

Mantém uma chamada válida do mesmo indicador de artigo bom ou destacado.

Antes:

```wikitext
{{Artigo bom}}
{{Artigo bom}}
Texto fictício.
```

Depois:

```wikitext
{{Artigo bom}}
Texto fictício.
```

Não promove, rebaixa ou escolhe entre estatutos conflitantes. Parâmetros com função diferente permanecem.

### FOOT-07: Nomes das seções finais

Adapta títulos estrangeiros e variantes previstos para o nome português.

Antes:

```wikitext
== See also ==
```

Depois:

```wikitext
== Ver também ==
```

Exige uma correspondência explícita. Um título apenas parecido não é reescrito por inferência.

Opções relacionadas: `headings`.

## Discussões e predefinições

### TALK-01: Um PD no início

Reúne chamadas equivalentes conferidas e põe PD na primeira linha.

Antes:

```wikitext
{{pd}}
{{Página de discussão}}
== Uma conversa ==
Texto.
```

Depois:

```wikitext
{{PD}}
== Uma conversa ==
Texto.
```

Preserva argumentos configurados. Configurações conflitantes e exemplos literais não são descartados.

### TALK-02: Uma Marca de projeto com todos os projetos

Reúne os projetos e suas avaliações compatíveis em uma chamada.

Antes:

```wikitext
{{Marca de projeto|?|Ciência|?}}
{{Marca de projeto|?|Tecnologia|?}}
```

Depois:

```wikitext
{{Marca de projeto|?|Ciência|?|Tecnologia|?}}
```

Preserva parâmetros adicionais e avaliações humanas. Conflitos entre avaliações não são resolvidos por adivinhação.

### TALK-03: Avaliação automática identificada

Substitui por ? apenas a avaliação com prova de autoria automática vinculada à revisão examinada.

Antes:

```wikitext
Campo 1 ou qualidade e campo rev com prova de que foram definidos automaticamente.
```

Depois:

```wikitext
A avaliação confirmada vira ? e a data automática é retirada. Avaliações humanas e outros campos permanecem.
```

Exige localizar a revisão que introduziu o valor, confirmar que essa mesma edição recebeu a marca bot e que a conta pertence ao grupo bot. A prova fica ligada ao texto, à chamada e ao valor exato. Sem confirmação, preserva os campos. Uma nota, uma data ou a associação atual da conta ao grupo bot, sozinhas, não provam uma avaliação automática.

### TALK-04: Traduzido no formato nativo

Adapta os campos e a ordem da chamada de tradução conforme a predefinição portuguesa.

Antes:

```wikitext
{{Traduzido|en|Tema fictício|oldid=12345|data=1 de novembro de 2026}}
```

Depois:

```wikitext
{{Traduzido|página=Tema fictício|cód_idioma=en|oldid=12345|data=1 de novembro de 2026}}
```

Não inventa revisão, data ou origem de tradução.

### TALK-05: Criar código a partir dos portais

Lê os portais do artigo e prepara PD e Marca de projeto no rascunho da discussão.

Antes:

```wikitext
Discussão sem cabeçalho de projeto e artigo com Física, Tecnologia e Ciência.
```

Depois:

```wikitext
{{PD}}
{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}
```

Requer discussão inteira de artigo e consulta bem-sucedida. Não publica a página.

### TALK-06: Variantes de portal coladas na discussão

Converte os portais reconhecidos para a estrutura de projetos em discussão.

Antes:

```wikitext
Portal da física Portal da tecnologia Portal da ciência
```

Depois:

```wikitext
{{PD}}
{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}
```

Abrange os portais aceitos no mapa, não apenas esses exemplos. Texto de conversa e exemplos protegidos ficam intactos.

### TPL-01: Definições de predefinição

Aplica os reparos finitos previstos a includeonly, noinclude e chamadas conhecidas.

Antes:

```wikitext
Uma definição com delimitador incorreto inequívoco em um bloco de inclusão.
```

Depois:

```wikitext
A mesma definição com limites de inclusão preservados e sintaxe corrigida.
```

Parâmetros triplos, funções parser, Lua e exemplos não são tratados como prosa de artigo.

Opções relacionadas: `templateDefinitionRepairs`.

### TPL-02: Navecaixa com chamada duplicada de chaves

Retira um nível redundante nas navecaixas literais expressamente reconhecidas.

Antes:

```wikitext
{{{{Navecaixa reconhecida}}}}
```

Depois:

```wikitext
{{Navecaixa reconhecida}}
```

O nome deve estar no mapa. Indireção dinâmica ou uma predefinição desconhecida permanece.

### TPL-03: TemplateStyles

Ajusta CSS pelo fluxo próprio, conferido pelo sanitizador nativo.

Antes:

```wikitext
Uma declaração CSS com um erro exato e reparo aceito pelo sanitizador.
```

Depois:

```wikitext
A declaração corrigida, com as demais regras preservadas.
```

Não converte propriedades rejeitadas para valores aleatórios nem altera o CSS geral de outra página.

## Uso, segurança e distribuição

### UI-01: Um botão para ajustar

Executa as correções escolhidas no rascunho aberto.

Antes:

```wikitext
Rascunho ainda não analisado.
```

Depois:

```wikitext
Correções confirmadas no mesmo rascunho.
```

O botão superior e o botão junto de Publicar executam a mesma ação. Publicação continua manual.

### UI-02: Contagem do que foi aplicado

Mostra os ajustes aplicados e a diferença em bytes. O número de ajustes aparece somente quando a contagem exata está confirmada.

Antes:

```wikitext
Texto com várias correções independentes.
```

Depois:

```wikitext
Número de ajustes e bytes quando a contagem é exata. Sem contagem confirmada, mensagem de ajustes aplicados e acesso à comparação.
```

Quando a contagem exata não pode ser confirmada, informa que houve ajustes sem estimar um total. Não inclui propostas descartadas. Um bloco da comparação não é necessariamente um único ajuste.

### UI-03: Mostrar alterações e desfazer

Usa a comparação do editor e permite restaurar o rascunho anterior.

Antes:

```wikitext
Rascunho ajustado.
```

Depois:

```wikitext
Rascunho anterior restaurado por Desfazer ajustes.
```

Uma alteração manual posterior impede restaurar uma versão que sobrescreveria esse trabalho.

### UI-04: Evitar análise repetida sem mudanças

Reconhece o texto já conferido e atualiza o estado dos botões.

Antes:

```wikitext
Mesmo texto e mesmas opções depois da análise.
```

Depois:

```wikitext
Botão indica o estado conferido.
```

Uma edição ou mudança nas opções permite nova análise.

### UI-05: Resumo Minúcias e edição menor

Preenche o resumo padrão e marca os ajustes automáticos como edição menor.

Antes:

```wikitext
Resumo vazio e aplicação automática confirmada.
```

Depois:

```wikitext
Resumo: Minúcias. Edição menor marcada.
```

Preserva resumo e escolha manuais, além da opção desligada. Não depende do tamanho da diferença.

Opções relacionadas: `autoSummary`, `autoMinor`.

### UI-06: Opções por família

Permite escolher Todos os ajustes, Só referências ou Só infocaixas e desligar grupos específicos.

Antes:

```wikitext
Opção de uma família desligada.
```

Depois:

```wikitext
Essa família fica sem alteração; as demais continuam elegíveis.
```

Uma opção técnica de segurança não pode ser removida para forçar uma correção.

### UI-07: Andamento e cancelamento

Mostra atividade e permite cancelar sem alterar o rascunho.

Antes:

```wikitext
Análise em andamento.
```

Depois:

```wikitext
Cancelamento encerra a aplicação e mantém o texto aberto.
```

O indicador respeita a preferência de menos movimento. Não apresenta uma porcentagem inventada.

### UI-08: Sem corte global de 60 segundos

Permite que a análise continue além de um minuto enquanto trabalha.

Antes:

```wikitext
Análise com mais de 60 segundos.
```

Depois:

```wikitext
A execução continua, podendo ser cancelada.
```

Consultas externas mantêm limites próprios. Cancelamento, mudança de contexto e alteração manual impedem respostas antigas de sobrescrever o rascunho.

### SAFE-01: Uma falha local não cancela tudo

Mantém correções independentes que passaram pela preservação.

Antes:

```wikitext
Campo não elegível na infocaixa e erro de referência independente no corpo.
```

Depois:

```wikitext
Campo preservado e referência corrigida.
```

Uma alteração não comprovada continua recusada. O painel mostra somente o que entrou, sem fila de avisos.

### SAFE-02: Preservação de conteúdo e referências

Confere fatos, palavras, campos, grupos, células, fórmulas, unidades e destinos antes de aplicar.

Antes:

```wikitext
Um plano eliminaria parte de uma fonte ou uma célula.
```

Depois:

```wikitext
Esse plano não é aplicado.
```

Não desativa verificações para conseguir um resultado ou esconder um erro.

### SAFE-03: Resultado vinculado ao rascunho

Evita que uma resposta atrasada substitua texto escrito depois.

Antes:

```wikitext
A análise começou, mas o texto foi editado manualmente.
```

Depois:

```wikitext
A resposta antiga não sobrescreve o novo texto.
```

Também confere página, revisão, seção, editor e opções.

### SAFE-04: Contextos e regiões protegidas

Distingue artigo, rascunho, discussão, predefinição e CSS.

Antes:

```wikitext
<nowiki>{{Reflist}}</nowiki>
```

Depois:

```wikitext
<nowiki>{{Reflist}}</nowiki>
```

Código, citações de marcação, comentários e trechos de exemplo não recebem as mesmas regras da prosa.

### DIST-01: Carregador fixo

Mantém a chamada de instalação no common.js entre as atualizações.

Antes:

```wikitext
Chamada fixa já instalada corretamente.
```

Depois:

```wikitext
A mesma chamada depois de atualizar núcleo, dados e carregador compartilhado.
```

Não exige substituir o common.js inteiro nem apagar outros scripts.

### DIST-02: Dados conferidos após o salvamento

Confere a versão e o conteúdo do catálogo antes de iniciar.

Antes:

```wikitext
Dados e núcleo de distribuições diferentes ou texto transformado no pré-salvamento.
```

Depois:

```wikitext
O pacote incompatível não é iniciado.
```

Não altera o hash para mascarar a diferença. Arquivos da mesma distribuição e destinos corretos resolvem a instalação.

### DIST-03: Sem edições automáticas na Wikipédia

As correções ficam no editor até a ação de publicação da pessoa.

Antes:

```wikitext
Ajustar código ou Criar código concluído.
```

Depois:

```wikitext
Rascunho aberto, sem publicação automática.
```

A pré-visualização pode enviar o rascunho para processamento sem salvar uma edição. Não há edições periódicas.

