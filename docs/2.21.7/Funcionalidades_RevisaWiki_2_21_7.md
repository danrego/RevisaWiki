# Tudo o que o RevisaWiki 2.21.7 faz

Referência completa com exemplos fictícios e condições. As 170 entradas incluem correções, comportamentos da interface e preservação; não são substituições incondicionais.

Os exemplos de campo mostram só a parte relevante. Exemplos de comportamento dependem do contexto descrito. A relação entre cada entrada e os testes exatos fica no JSON.

## Referências e notas

### Lista de referências em linha própria · REF-01

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

### Coletores repetidos · REF-02

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

### Notas e referências juntas · REF-03

Usa a chamada conjunta quando as listas podem ser reunidas.

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

Conserva todos os grupos, notas, definições e destinos.

### Formato nativo da lista · REF-04

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

Abrange Reflist, aliases conferidos e erros exatos previstos. Grupos, bancos de definições e estilos permanecem. Configurações numéricas ou de largura do coletor só mudam quando há uma equivalência técnica comprovada, respeitando o mínimo próprio de referências. Um título manual que delimita a lista permanece quando não pertence à normalização prevista, mesmo que haja texto entre ele e o coletor. A chamada convertida usa nível=0 para não abrir outra seção. A união de notas e referências só ocorre quando preserva a organização dos títulos e o conteúdo entre as listas.

### Pontuação junto às referências · REF-05

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

### Fontes anônimas idênticas · REF-06

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

### Reutilizações adjacentes iguais · REF-07

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

### Aviso de ligação inativa no campo próprio · REF-08

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

### Grupo único de notas explicativas · REF-09

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

### Coletor que falta para notas · REF-10

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

### Referência definida na primeira chamada · REF-11

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

### Nomes numéricos inválidos · REF-12

Substitui nomes exclusivamente numéricos e todas as suas chamadas por um nome válido.

**Antes**
```wikitext
A.<ref name="123">Fonte.</ref> B.<ref name="123" />
```

**Depois**
```wikitext
A.<ref name="ref-123">Fonte.</ref> B.<ref name="ref-123" />
```

O nome ilustrado pode receber outro sufixo se já existir. Não altera nomes não numéricos por semelhança.

### Aspas quebradas no nome da fonte · REF-13

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

### Sintaxe local das etiquetas ref · REF-14

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

### Referências com ligação simples · REF-15

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

### Notas com referência interna · REF-16

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

### Citações abreviadas e bibliografia · REF-17

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

### Nomes descritivos de referências · REF-18

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

### Nomes automáticos antigos · REF-19

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

### Mesma definição em toda a página · REF-20

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

### Cabeçalhos vazios que repetem o coletor · REF-21

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

### Rodapé de notas importado · REF-22

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

### Definições nomeadas repetidas em pontos separados · REF-23

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

### Metadados complementares da mesma obra · REF-24

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

## Parâmetros e conteúdo das citações

### Predefinições bibliográficas em português · CIT-01

Adapta nomes estrangeiros aos modelos nativos com função equivalente.

**Antes**
```wikitext
{{cite web|url=https://example.invalid/|title=Documento|access-date=November 1, 2026}}
```

**Depois**
```wikitext
{{Citar web|url=https://example.invalid/|título=Documento|acessodata=1 de novembro de 2026}}
```

O nome exato e a capitalização da saída seguem o mapa conferido. Não transforma indistintamente toda Citation em Citar web.

### Chaves inglesas também aceitas · CIT-02

Prefere os nomes portugueses conferidos, mesmo quando o alias inglês continua funcionando.

**Antes**
```wikitext
{{citar web|url=https://example.invalid/|title=Documento|access-date=November 1, 2026}}
```

**Depois**
```wikitext
{{citar web|url=https://example.invalid/|título=Documento|acessodata=1 de novembro de 2026}}
```

O destino deve ter a mesma função e prioridade. vauthors e veditors podem permanecer em inglês quando a versão nativa precisa dessas chaves. Os campos nativos url-status=live e url-status=dead são preservados para manter a função dos endereços original e arquivado.

### Autores numerados · CIT-03

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

### Campos repetidos idênticos · CIT-04

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

### Parâmetros inválidos vazios · CIT-05

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

### Erros exatos no nome dos campos · CIT-06

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

### Barra literal no título · CIT-07

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

### Campo caderno e localizadores · CIT-08

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

### Datas bibliográficas literais · CIT-09

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

### Acesso e assinatura · CIT-10

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

### Endereços e datas de arquivo · CIT-11

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

### Data de captura já escrita na URL · CIT-12

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

### DOI com pontuação excedente · CIT-13

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

### ISBN e repetições · CIT-14

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

### Identificadores em ligações · CIT-15

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

### Campo título recuperável localmente · CIT-16

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

### Lista Vancouver e falha Lua · CIT-17

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

### Limites perdidos entre campos · CIT-18

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

### Formatação compacta de citações · CIT-19

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

### Obras históricas e modelos importados · CIT-20

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

### Citation com consumidor português confirmado · CIT-21

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

### Edição bibliográfica em português · CIT-22

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

### Referências bíblicas com intervalos preservados · CIT-23

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

### Destinos bibliográficos com identidade confirmada · CIT-24

Corrige um destino importado de autor, editor ou obra quando o equivalente português foi conferido.

**Antes**
```wikitext
Um campo bibliográfico com ligação para uma obra estrangeira e identidade de destino português comprovada.
```

**Depois**
```wikitext
O mesmo campo aponta para o destino português equivalente, com o rótulo e os dados da fonte preservados.
```

A identidade precisa fazer parte do mapa verificado. Não traduz nomes por semelhança nem elimina ligações vermelhas legítimas.

## Infocaixas e biografias

### Campos de infocaixas conforme cada modelo · BIO-01

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

### Prioridade dos nomes alternativos · BIO-02

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

### Infocaixa antes da introdução · BIO-03

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

### Linha própria depois da infocaixa · BIO-04

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

### Infocaixa legível em linhas · BIO-05

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

### Alinhamento e espaço depois do igual · BIO-06

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

### Cabeçalho sem negrito redundante · BIO-07

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

### Profissões comuns com inicial minúscula · BIO-08

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

### Flexão de profissões confirmada · BIO-09

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

### Listas de ocupações e campos · BIO-10

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

### Datas de nascimento e morte · BIO-11

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

### Idade de pessoa viva · BIO-12

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

### Nascimento e morte na abertura · BIO-13

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

### Dados da abertura em campos separados · BIO-14

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

### Categoria de nascimento redundante · BIO-15

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

### Casamento com datas e estado civil · BIO-16

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

### Site oficial conforme o leitor da caixa · BIO-17

Corrige sintaxe de endereço, protocolo repetido e apresentação conforme o campo nativo.

**Antes**
```wikitext
|website=[[https://example.invalid/|Sítio oficial]]
```

**Depois**
```wikitext
|site=[https://example.invalid/ Sítio oficial]
```

Algumas caixas esperam uma URL pura, outras aceitam ligação rotulada. A regra respeita o leitor, sem trocar o domínio.

### Arquivo, tamanho e legenda em campos próprios · BIO-18

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

### Texto alternativo da imagem · BIO-19

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

### Tamanho de imagem com unidade repetida · BIO-20

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

### Campos de unidades nativas · BIO-21

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

### Caixas incorporadas · BIO-22

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

### Caixas principais repetidas · BIO-23

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

### Campos com significado próprio · BIO-24

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

### Cabeçalho e campos estrangeiros migrados juntos · BIO-25

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

### Grupos étnicos com todos os dados visíveis · BIO-26

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

### Infocaixa manual com estrutura certificada · BIO-27

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

### Ani e efeitos da data preservados · BIO-28

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

### Biografias confirmadas · POR-01

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

### País sem duplicar o estado · POR-02

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

### Mulheres · POR-03

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

### Profissão e esporte · POR-04

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

### Artes e ciências · POR-05

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

### Filmes, séries e obras musicais · POR-06

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

### Biologia e saúde · POR-07

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

### Demais assuntos · POR-08

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

### Esboço com assunto confirmado · POR-09

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

### Nomes de portais importados · POR-10

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

### Posições e repetições em Portal3 · POR-11

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

### Posição do portal no rodapé · POR-12

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

### Autoridade com algo para exibir · POR-13

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

### Uma chamada efetiva de autoridade · FOOT-04

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

### Biografia reconhecida sem depender da tradução inteira · POR-14

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

### Países em vários idiomas e escritas · POR-15

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

### País e guerra de uma unidade militar · POR-16

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

## Imagens e ligações

### Espaços de nomes e opções de imagem · IMG-01

Adapta Image e thumb no contexto de uma imagem reconhecida.

**Antes**
```wikitext
[[Image:Exemplo.jpg|thumb|220px|Uma paisagem.]]
```

**Depois**
```wikitext
[[Imagem:Exemplo.jpg|miniatura|220px|Uma paisagem.]]
```

Mantém arquivo, largura, legenda, texto alternativo e destino. Não traduz a legenda.

### Miniaturada e erros previstos · IMG-02

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

### Arquivo importado como endereço · IMG-03

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

### Tamanhos e sintaxe de opção · IMG-04

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

### Ligações internas sem pipe redundante · LNK-01

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

### Flexão simples fora da ligação · LNK-02

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

### Fechamento único de ligação · LNK-03

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

### Ligações externas com sintaxe interna · LNK-04

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

### Rótulo externo partido · LNK-05

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

### Protocolos e ampersands previstos · LNK-06

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

### Título de seção com ligação · LNK-07

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

### Uma imagem por linha · IMG-05

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

## Tabelas e sintaxe

### Aberturas e fechamentos de tabelas · TAB-01

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

### Aspas dos atributos · TAB-02

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

### Cabeçalhos simples acessíveis · TAB-03

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

### Atributos antigos equivalentes · TAB-04

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

### Formatação esquecida dentro da célula · TAB-05

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

### Texto deslocado pelo leitor de tabelas · TAB-06

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

### Mesclagens e atributos com erro finito · TAB-07

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

### Tabelas largas e apresentação responsiva · TAB-08

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

### Chaves e colchetes em limites únicos · SYN-01

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

### Trecho completo anterior a marcação incerta · SYN-02

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

### Resíduos de cópia de chat · SYN-03

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

### Negrito e itálico Markdown · SYN-04

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

### Múltiplas linhas vazias · SYN-05

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

### Começo sem linhas vazias · SYN-06

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

### Título redundante na abertura · SYN-07

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

### Lista com itens vazios no final · SYN-08

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

### Erros ortográficos exatos · SYN-09

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

### Descrição curta e modelos obsoletos · SYN-10

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

### Categorias e palavras mágicas importadas · SYN-11

Adapta as palavras mágicas e os prefixos previstos, conservando seus argumentos.

**Antes**
```wikitext
{{DEFAULTSORT:Exemplo, Tema}}
```

**Depois**
```wikitext
{{DEFAULTSORT:Exemplo, Tema}}
```

Uma chamada nativa válida permanece. Só há adaptação com alias ou palavra mágica de origem confirmada.

### Coordenadas duplicadas · SYN-12

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

### Tabelas abertas por predefinição nativa · TAB-09

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

### Célula já produzida pela predefinição · TAB-10

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

### Partido no consumidor eleitoral correto · TAB-11

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

### Modelos de bloco em linhas próprias · SYN-13

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

### Noinclude vazio sem função no artigo · SYN-14

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

## Seções finais, colunas e projetos irmãos

### Duas colunas a partir de oito itens · COL-01

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

### Lista curta sem colunas · COL-02

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

### Colunas manuais sem col1 e col2 · COL-03

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

### Colunas de referências com mínimo próprio · COL-04

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

### Ordem das seções e do rodapé · FOOT-01

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

### Chave de ordenação antes das categorias · FOOT-02

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

### Categorias consecutivas · FOOT-03

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

### Navecaixas e portais sem div redundante · LAY-01

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

### Infocaixa sem div redundante · LAY-02

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

### Projetos irmãos abaixo de Ver também · FOOT-05

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

### Ligação de projeto irmão em caixa · FOOT-06

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

### Indicador de qualidade duplicado · QUAL-01

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

### Nomes das seções finais · FOOT-07

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

### Sucessão preservada como bloco do rodapé · FOOT-08

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

## Discussões e predefinições

### Um PD no início · TALK-01

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

### Uma Marca de projeto com todos os projetos · TALK-02

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

### Avaliação automática marcada por bot · TALK-03

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

### Traduzido no formato nativo · TALK-04

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

### Criar código a partir dos portais · TALK-05

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

### Variantes de portal coladas na discussão · TALK-06

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

### Definições de predefinição · TPL-01

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

### Navecaixa com chamada duplicada de chaves · TPL-02

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

### TemplateStyles · TPL-03

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

### Campos de sucessão com nomes nativos · TPL-04

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

### Avisos no topo da discussão · TALK-07

Organiza o cabeçalho antes das conversas, preservando atribuições e avisos distintos.

**Antes**
```wikitext
{{Marca de projeto|?|Ciência|?}}
{{Traduzido|página=Tema Exemplo|cód_idioma=en|oldid=12345}}
{{PD}}
```

**Depois**
```wikitext
{{PD}}
{{Traduzido|página=Tema Exemplo|cód_idioma=en|oldid=12345}}
{{Marca de projeto|?|Ciência|?}}

```

A ordem é PD, Traduzido, Marca de projeto, avisos de fusão reconhecidos e conversa. Traduções diferentes, parâmetros e comentários permanecem. Não reorganiza exemplos ou conteúdo da conversa.

## Uso, segurança e distribuição

### Um botão para ajustar · UI-01

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

### Contagem do que foi aplicado · UI-02

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

### Mostrar alterações e desfazer · UI-03

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

### Evitar análise repetida sem mudanças · UI-04

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

### Resumo Minúcias e edição menor · UI-05

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

### Opções por família · UI-06

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

### Andamento e cancelamento · UI-07

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

### Sem corte global de 60 segundos · UI-08

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

### Uma falha local não cancela tudo · SAFE-01

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

### Preservação de conteúdo e referências · SAFE-02

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

### Resultado vinculado ao rascunho · SAFE-03

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

### Contextos e regiões protegidas · SAFE-04

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

### Carregador fixo · DIST-01

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

### Dados conferidos após o salvamento · DIST-02

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

### Sem edições automáticas na Wikipédia · DIST-03

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
