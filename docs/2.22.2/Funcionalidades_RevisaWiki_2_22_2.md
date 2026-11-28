# Recursos do RevisaWiki 2.22.2

A lista inclui correções, condições e cuidados. As entradas não são uma contagem de regras independentes.

## Referências e notas

### Lista de referências em linha própria (REF-01)

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

### Coletores repetidos (REF-02)

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

### Notas e referências juntas (REF-03)

Reúne listas compatíveis em uma chamada de Notas e referências, mesmo com a ordem invertida ou com lacunas entre elas.

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

Confere os grupos, bancos, definições e produtores de notas antes da união. Bancos preenchidos, grupos especiais e títulos com função própria podem exigir coletores separados.

Antes:
```wikitext
Texto<ref>Fonte.</ref>
{{Notas}}
```
Depois:
```wikitext
Texto<ref>Fonte.</ref>

{{Referências}}
```

Quando Notas é o único coletor simples e há fonte padrão real antes dele, restaura diretamente o coletor padrão. Inventário fechado, sem argumentos, banco, outro grupo ou título personalizado.

Antes:
```wikitext
Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>
{{Notas}}
```
Depois:
```wikitext
Texto<ref group="nota">Nota.</ref><ref>Fonte.</ref>

{{Notas e referências}}
```

Mesma prova do coletor único, conservando nota/lower-alpha e as fontes. Outros grupos ou produtores posteriores ficam retidos.

Antes:
```wikitext
Texto.
== Notas ==
{{Notas}}
```
Depois:
```wikitext
Texto.

```

Notas isolada sem argumentos, nenhuma chamada ref/helper e inventário completo de produtores conhecidos. Título personalizado e prosa permanecem, desconhecidos retêm a chamada.

Antes:
```wikitext
Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>
{{Notas}}
{{Notelist|30em}}

{{Referências}}
{{Reflist|30em}}
```
Depois:
```wikitext
Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>

{{Notas e referências}}
```

Os grupos já foram recolhidos pelos primeiros coletores, as listas com largura são posteriores e redundantes. Sem definições internas ou novos produtores entre elas.

Antes:
```wikitext
Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>
== Notas ==
<div class="references"><references group=lower-alpha/></div>

== Referência ==
<references />
```
Depois:
```wikitext
Texto<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>

{{Notas e referências}}
```

Somente div com a classe references, sem outros atributos, id, estilo, conteúdo extra ou definições. Grupos e chamadas conservados. Ligações a âncoras impedem a convergência quando não há prova para mantê-las.

### Formato nativo da lista (REF-04)

Usa Referências nos coletores equivalentes e retira opções apenas de apresentação, sem perder grupos, bancos ou títulos próprios.

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

Reflist|30em e opções como col=2 ou colwidth=30em podem dar lugar ao coletor simples. Em Referências|30em, o argumento 30em é um título nativo e permanece. Um título próprio conserva sua seção e pode exigir nível=0. Subtítulos de níveis 3 a 6, cabeçalhos irmãos ou âncoras podem exigir conservar o cabeçalho existente e usar nível=0.

Antes:
```wikitext
== Referências ==
{{Reflist|30em}}
```
Depois:
```wikitext
{{Referências}}
```

A largura herdada é uma opção de apresentação. A chamada não traz banco, título próprio ou grupo especial.

Antes:
```wikitext
{{Referências|30em}}
```
Depois:
```wikitext
{{Referências|30em}}
```

Nesta predefinição nativa, o argumento posicional é o título da seção, não uma largura.

### Pontuação junto às referências (REF-05)

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

Antes:
```wikitext
Texto. {{sfn|Autor|2020}}
```
Depois:
```wikitext
Texto.{{sfn|Autor|2020}}
```

Só espaço horizontal após pontuação e antes de sfn reconhecida. Não consome nova linha.

### Fontes anônimas idênticas (REF-06)

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

Antes:
```wikitext
A<ref> Fonte. </ref> B<ref>Fonte.</ref>
```
Depois:
```wikitext
A<ref name="ref-auto-1"> Fonte. </ref> B<ref name="ref-auto-1" />
```

Mesmo grupo e região, corpo simples com diferença apenas em espaços externos sem significado. Conserva o corpo da primeira definição e evita nomes ocupados.

### Reutilizações adjacentes iguais (REF-07)

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

### Aviso de ligação inativa no campo próprio (REF-08)

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

### Grupo único de notas explicativas (REF-09)

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

Apenas um grupo explicativo simples, com inventário completo dos seus usos, definições e coletores. Grupos misturados ou com significado próprio não são fundidos por semelhança.

### Coletor que falta para notas (REF-10)

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

### Referência definida na primeira chamada (REF-11)

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

### Nomes numéricos inválidos (REF-12)

Substitui nomes exclusivamente numéricos e todas as suas chamadas por um nome válido.

Antes:
```wikitext
A.<ref name="123">Fonte.</ref> B.<ref name="123" />
```
Depois:
```wikitext
A.<ref name="ref-123">Fonte.</ref> B.<ref name="ref-123" />
```

O nome ilustrado pode receber outro sufixo se já existir. Não altera nomes não numéricos por semelhança. Um nome numérico, por si só, não demonstra ausência de definição, retirar uma reutilização exige outro inventário completo.

### Aspas quebradas no nome da fonte (REF-13)

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

### Sintaxe local das etiquetas ref (REF-14)

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

### Referências com ligação simples (REF-15)

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

### Notas com referência interna (REF-16)

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

### Citações abreviadas e bibliografia (REF-17)

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

### Nomes descritivos de referências (REF-18)

Pode trocar nomes automáticos pouco legíveis por nomes derivados dos dados já presentes na citação.

Antes:
```wikitext
<ref name=":0">{{citar livro|ultimo=Exemplo|titulo=Obra fictícia|ano=2001}}</ref> Texto.<ref name=":0" />
```
Depois:
```wikitext
<ref name="Exemplo2001-1">{{citar livro|ultimo=Exemplo|titulo=Obra fictícia|ano=2001}}</ref> Texto.<ref name="Exemplo2001-1" />
```

Usa os dados da própria citação e evita nomes repetidos. Só muda os nomes quando consegue acompanhar todas as definições e chamadas da fonte. Mantém os nomes se uma predefinição ou um banco de referências impedir essa conferência. Quando reconhece uma chamada simples de URL com endereço externo e texto fixo, preserva a ligação e pode ajustar os nomes das referências.

### Nomes automáticos antigos (REF-19)

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

### Mesma definição em toda a página (REF-20)

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

### Cabeçalhos vazios que repetem o coletor (REF-21)

Retira uma cadeia vazia de títulos que apenas anuncia a mesma lista.

Antes:
```wikitext
== Referências ==
===Notas===
{{Referências}}
```
Depois:
```wikitext
{{Referências}}
```

Os títulos precisam estar junto de seu coletor. Texto de notas, bibliografia e conteúdo entre títulos permanecem.

### Rodapé de notas importado (REF-22)

Adapta um coletor de notas estrangeiro quando todas as notas daquele grupo podem ser conferidas.

Antes:
```wikitext
Texto<ref group="nota">Nota.</ref>
{{NoteFoot}}
```
Depois:
```wikitext
Texto<ref group="nota">Nota.</ref>
{{Notas}}
```

Exige um grupo único observado, sem produtores opacos ou listas com funções diferentes. Não mistura grupos de propósito distinto.

### Definições nomeadas repetidas em pontos separados (REF-23)

Mantém uma definição e usa chamadas no lugar de cópias idênticas da mesma fonte.

Antes:
```wikitext
A.<ref name="a">Fonte.</ref>
B.<ref name="a">Fonte.</ref>
```
Depois:
```wikitext
A.<ref name="a">Fonte.</ref>
B.<ref name="a" />
```

Nome, grupo, atributos e corpo precisam ser equivalentes. A posição de cada chamada é preservada. Fontes com corpos diferentes não são declaradas iguais.

### Metadados complementares da mesma obra (REF-24)

Reúne dados bibliográficos complementares em referências comprovadamente da mesma obra.

Antes:
```wikitext
Duas referências com título, ano, editora, ISBN válido e autoria iguais, uma delas com idioma ou ligação adicional.
```
Depois:
```wikitext
Uma definição com os dados complementares e as mesmas chamadas nos pontos de citação.
```

A união é restrita a livros com identidade exata. Páginas, capítulos, edições ou outros localizadores conflitantes impedem a união.

### Atributos nativos de referência (REF-25)

Adapta nome/grupo para name/group em etiquetas ref literais.

Antes:
```wikitext
A<ref nome="a" grupo="nota">Fonte.</ref> B<ref nome="a" grupo="nota"/>
```
Depois:
```wikitext
A<ref name="a" group="nota">Fonte.</ref> B<ref name="a" group="nota"/>
```

Definição e reutilizações coerentes, sem colisões ou atributos desconhecidos. Conserva corpo e grupo.

### Operadores finitos nos atributos (REF-26)

Repara dois operadores incorretos em atributos conhecidos.

Antes:
```wikitext
A<ref name:"a">Fonte.</ref> B<ref name=="a"/>
```
Depois:
```wikitext
A<ref name="a">Fonte.</ref> B<ref name="a"/>
```

Somente : e == na estrutura comprovada. Exemplos citados, nomes dinâmicos e conflitos permanecem.

### Reutilização sem definição comprovada (REF-27)

Retira só uma chamada cuja falta de definição foi confirmada.

Antes:
```wikitext
Texto<ref name="ausente"/> continua.
```
Depois:
```wikitext
Texto continua.
```

A retirada exige inventário fechado de todos os possíveis produtores, incluindo bancos e auxiliares R. Uma definição possível em modelo não reconhecido ou um trecho incompleto conserva a chamada.

### Coletores sem invólucros apenas visuais (REF-28)

Retira uma coluna ou div simples que envolve somente o coletor de referências.

Antes:
```wikitext
{{Colunas-lista|2|2=<references />}}
```
Depois:
```wikitext
{{Referências}}
```

Só aceita o contêiner conhecido com um único coletor. IDs, prosa, conteúdo extra e estilos com outras funções permanecem.

### Identidades Unicode preservadas (REF-29)

Mantém nomes de referências distintos, mesmo quando têm aparência parecida.

Antes:
```wikitext
<ref name="fonte-α">Fonte A.</ref><ref name="fonte-a">Fonte B.</ref>
```
Depois:
```wikitext
<ref name="fonte-α">Fonte A.</ref><ref name="fonte-a">Fonte B.</ref>
```

Não une identidades por semelhança visual nem por normalização Unicode. Definições e reutilizações precisam continuar ligadas à mesma fonte.

### URLs bibliográficas escritas como ligações completas (RW2222-001)

URLs bibliográficas escritas como ligações completas

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=[https://example.org/a Documento]}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a}}</ref>

{{Referências}}
```

Rótulo idêntico ao título, endereço único, sem perda de texto ou conflito de aliases.

### Barra ausente em protocolo de URL (RW2222-002)

Barra ausente em protocolo de URL

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https:/example.org/a?x=1&y=2#parte}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a?x=1&y=2#parte}}</ref>

{{Referências}}
```

Hostname válido e preservação exata de caminho, consulta e fragmento.

### Referência fechada antes de sua citação (RW2222-003)

Referência fechada antes de sua citação

Antes:
```wikitext
Texto.<ref name="a"/>{{Citar livro|título=Obra|ano=2020}}</ref>
{{Referências}}
```
Depois:
```wikitext
Texto.<ref name="a">{{Citar livro|título=Obra|ano=2020}}</ref>

{{Referências}}
```

Uma citação completa, sem texto intermediário, produtor desconhecido ou definição concorrente.

### URL original recuperada de captura Wayback (RW2222-004)

URL original recuperada de captura Wayback

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|arquivourl=https://web.archive.org/web/20240101000000/https://example.org/a|arquivodata=1 de janeiro de 2024}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|arquivourl=https://web.archive.org/web/20240101000000/https://example.org/a|arquivodata=1 de janeiro de 2024|url=https://example.org/a}}</ref>

{{Referências}}
```

A captura e a data precisam concordar, sem URL concorrente. Preserva arquivo, data e acesso; não cria a URL geral de um livro a partir do endereço próprio de um capítulo.

### PDF oficial do arXiv em campo de identificador (RW2222-005)

PDF oficial do arXiv em campo de identificador

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|arxiv=https://arxiv.org/pdf/2301.01234v2.pdf}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|arxiv=2301.01234v2}}</ref>

{{Referências}}
```

Host, rota e gramática oficiais; sem ID concorrente ou extração de nomes arbitrários.

### Separador de ISSN validado (RW2222-006)

Separador de ISSN validado

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|issn=0378 5955}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|issn=0378-5955}}</ref>

{{Referências}}
```

Preservar os oito caracteres e distinguir ISSN de eISSN.

### Troca recíproca inequívoca de ISBN e ISSN (RW2222-013)

Troca recíproca inequívoca de ISBN e ISSN

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|isbn=0378-5955|issn=9780306406157}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|isbn=9780306406157|issn=0378-5955}}</ref>

{{Referências}}
```

Ambos os valores integrais devem ser válidos exclusivamente no papel oposto, com checksums e campos únicos.

### Tipografia Unicode em identificadores verificáveis (RW2222-014)

Tipografia Unicode em identificadores verificáveis

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|isbn=９７８０３０６４０６１５７}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|isbn=9780306406157}}</ref>

{{Referências}}
```

Lista finita de dígitos de largura completa/separadores dentro de identificador integral; gramática e checksum final válidos.

### Identificador singular literalmente repetido (RW2222-015)

Identificador singular literalmente repetido

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|doi=10.1038/nphys1170; 10.1038/nphys1170}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|doi=10.1038/nphys1170}}</ref>

{{Referências}}
```

Mesmo identificador completo em campo singular e separador inequívoco.

### Resolvedores bibliográficos oficiais adicionais (RW2222-016)

Resolvedores bibliográficos oficiais adicionais

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|jstor=https://www.jstor.org/stable/1234567}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|jstor=1234567}}</ref>

{{Referências}}
```

Apenas host/caminho oficial integral conferido e consumidor tipado comprovado; qualificar cada resolvedor separadamente.

### arXiv explicitamente rotulado com classe de assunto (RW2222-017)

arXiv explicitamente rotulado com classe de assunto

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|arxiv=arXiv:2101.00001v2 [hep-th]}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|arxiv=2101.00001v2|classe=hep-th}}</ref>

{{Referências}}
```

Código e classe integralmente validados, preservando versão, sem classe concorrente.

### DOI explicitamente rotulado no campo id (RW2222-018)

DOI explicitamente rotulado no campo id

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|id=DOI:10.1038/nphys1170}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|doi=10.1038/nphys1170}}</ref>

{{Referências}}
```

Identificador único integral explicitamente rotulado e destino tipado ausente/equivalente.

### Prefixos de paginação alfanumérica e descontínua (RW2222-019)

Prefixos de paginação alfanumérica e descontínua

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|páginas=pp. A1–A3, B5}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|páginas=A1–A3, B5}}</ref>

{{Referências}}
```

Retirar somente rótulo redundante sob gramática explícita, conservando todos os localizadores/separadores/ordem.

### Três ou mais campos de língua explícitos (RW2222-020)

Três ou mais campos de língua explícitos

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|língua=en|língua2=fr|língua3=de}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|língua=en, fr, de}}</ref>

{{Referências}}
```

Estender composição existente com prioridade real do leitor, códigos aceitos e ordem preservada.

### ISBN com qualificador físico explícito (RW2222-021)

ISBN com qualificador físico explícito

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|isbn=9780306406157 (brochura)}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|isbn=9780306406157}} (brochura)</ref>

{{Referências}}
```

Um único ISBN válido, qualificador de vocabulário fechado e representação nativa que preserve associação; nenhum id concorrente.

### Enumerações e positivos explícitos de flags (RW2222-022)

Enumerações e positivos explícitos de flags

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|modo=CS1|páginas=7|nopp=verdadeiro}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|modo=cs1|páginas=7|nopp=sim}}</ref>

{{Referências}}
```

Mapeamentos finitos só em papel efetivamente lido pelo consumidor; confirmar leitor atual.

### Parênteses redundantes de apresentação no formato (RW2222-023)

Parênteses redundantes de apresentação no formato

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a.pdf|formato=(PDF)}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a.pdf|formato=PDF}}</ref>

{{Referências}}
```

Um par externo envolvendo integralmente rótulo conhecido quando consumidor já acrescenta o par.

### Separador incorreto no prefixo de título original (RW2222-024)

Separador incorreto no prefixo de título original

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|título-translit=ja=原題}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|título-translit=ja:原題}}</ref>

{{Referências}}
```

Prefixo explícito de língua aceita e conteúdo original preservado integralmente.

### Índices portugueses de editores (RW2222-040)

Índices portugueses de editores

Antes:
```wikitext
Texto.<ref>{{Citar enciclopédia|título=Documento|editor1-sobrenome=Exemplo|editor1-nome=Pessoa|editor2-sobrenome=Modelo|editor2-nome=Outra}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar enciclopédia|título=Documento|editor-sobrenome1=Exemplo|editor-nome1=Pessoa|editor-sobrenome2=Modelo|editor-nome2=Outra}}</ref>

{{Referências}}
```

editor1-sobrenome/editor1-nome/editor2-sobrenome/editor2-nome para editor-sobrenome1/editor-nome1 etc. A regra já existe, mas não alcança este leitor. Preservar os pares e autores separados. Sem aliases concorrentes.

### Título traduzido guardado em tradtítulo (RW2222-041)

Título traduzido guardado em tradtítulo

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Original|tradtítulo=Tradução}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Original|títulotrad=Tradução}}</ref>

{{Referências}}
```

Mapear chave preenchida para TransTitle/títulotrad somente com consumidor confirmado e sem concorrente. Conservar título original e tradução integral. Não traduzir texto nem confundir subtítulo.

### Cobertura da família de citações de conferências (RW2222-042)

Cobertura da família de citações de conferências

Antes:
```wikitext
Texto.<ref>{{Citar conferência|title=Trabalho|booktitle=Anais|conference=Evento|conferencia-url=https://example.org/evento}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar conferência|título=Trabalho|títulolivro=Anais|conferência=Evento|conferência-url=https://example.org/evento}}</ref>

{{Referências}}
```

Fechar o leitor para normalizar campos conhecidos independentes. Os dois corpos ficaram integrais. Conservar título dos anais, título do trabalho, evento e URL em papéis próprios. Não converter automaticamente para livro; data numérica ambígua permanece.

### Preserva o número eletrônico de um artigo de periódico (RW2222-043)

Preserva o número eletrônico de um artigo de periódico

Antes:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento|article-number=000123}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar periódico|título=Documento}} Artigo 000123</ref>

{{Referências}}
```

Usa a forma literal "Artigo" e mantém o código exato dentro da mesma referência. A conversão exige uma única citação de periódico, sem páginas nem localizador concorrente. Não transforma esse código em número de página.

### Ordinais por extenso no campo de edição (RW2222-044)

Ordinais por extenso no campo de edição

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|edition=Third}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|edição=3.ª}}</ref>

{{Referências}}
```

Vocabulário finito de ordinais como Third→3.ª dentro de Edition único. Não alterar editoras/títulos com Third nem adivinhar edições especiais ou compostas.

### Data original importada (RW2222-045)

Data original importada

Antes:
```wikitext
Texto.<ref>{{Citar jornal|título=Documento|orig-date=August 4, 2025|data=17 de junho de 2026}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar jornal|título=Documento|anooriginal=August 4, 2025|data=17 de junho de 2026}}</ref>

{{Referências}}
```

Mantém a data original completa no campo nativo correspondente, sem substituir a data de publicação. Datas originais conflitantes ou sem correspondência comprovada ficam preservadas.

### Chamadas bibliográficas especializadas importadas (RW2222-046)

Chamadas bibliográficas especializadas importadas

Antes:
```wikitext
Texto.<ref>{{cite APOD|title=Documento|date=24 Junho 2002|access-date=8 Março 2016|apod=020624}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|data=24 de junho de 2002|acessodata=8 de março de 2016|url=https://apod.nasa.gov/apod/ap020624.html|obra=[[Astronomy Picture of the Day]]|publicado=[[NASA]]|editor-sobrenome1=Nemiroff|editor-nome1=R.|editor-sobrenome2=Bonnell|editor-nome2=J.}}</ref>

{{Referências}}
```

Converte chamadas simples e conferidas de APOD e Instagram para o modelo local, preservando título, datas, endereço e créditos. Chamadas com campos adicionais ou concorrentes permanecem intactas.

### Gerador de URL estrangeiro dentro de url (RW2222-047)

Gerador de URL estrangeiro dentro de url

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|url={{google books|id=ExampleId|page=152|text=texto exato|plainurl=yes}}}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|url=https://books.google.com/books?id=ExampleId&pg=PA152&dq=%22texto+exato%22}}</ref>

{{Referências}}
```

Converte o auxiliar Google books somente quando plainurl pede um endereço simples e seus argumentos foram conferidos. Preserva o identificador, a página e toda a consulta.

### Mantém notas e referências reunidas quando a chamada já está correta (RW2222-053)

Mantém notas e referências reunidas quando a chamada já está correta

Antes:
```wikitext
Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>

{{Notas e referências}}
```
Depois:
```wikitext
Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>

{{Notas e referências}}
```

A chamada combinada permanece quando há notas compatíveis e referências. O problema de separação relatado não foi reproduzido nos testes desta versão, e esta entrada documenta a preservação desse comportamento.

### Limpeza de notas vazias não alcança o coletor combinado (RW2222-054)

Limpeza de notas vazias não alcança o coletor combinado

Antes:
```wikitext
Texto.<ref>Fonte</ref>
{{Notas e referências}}
```
Depois:
```wikitext
Texto.<ref>Fonte</ref>

{{Referências}}
```

Converter a chamada unificada em Referências somente quando o grafo fechado comprovar ausência de notas, grupos especiais, argumentos personalizados e âncoras. Preservar a chamada unificada quando houver notas convencionais e referências. Não gerar duas chamadas para resolver este caso.

### Data de arquivo em chave invertida com alias nativo preenchido (RW2222-062)

Data de arquivo em chave invertida com alias nativo preenchido

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a|arquivourl=https://web.archive.org/web/20210109000000/https://example.org/a|dataarquivo=9 de janeiro de 2021|arquivodata=2021-01-09}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a|arquivourl=https://web.archive.org/web/20210109000000/https://example.org/a|arquivodata=2021-01-09}}</ref>

{{Referências}}
```

Tratar dataarquivo/data-arquivo independentemente do erro de URL antigo. Quando dataarquivo e arquivodata são o mesmo dia comprovado, consolidar sem perder data nem captura. Quando só a chave errada existe, mapear apenas se papel e par URL/data forem comprovados. Valores conflitantes, datas ambíguas, mudança de captura e aliases concorrentes retêm ambos. Não escolher data pela aparência nem inventar data de arquivo.

### Crédito de tradutor em sinônimo não consumido (RW2222-063)

Crédito de tradutor em sinônimo não consumido

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|autor=Original|tradutor-sobrenome=Exemplo|tradutor-nome=Pessoa}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|autor=Original|tradutor-ultimo=Exemplo|tradutor-primeiro=Pessoa}}</ref>

{{Referências}}
```

Qualificar tradutor-sobrenome e os índices/companheiros ao papel TranslatorList-Last efetivamente lido, preservando autoria original separada, nome do tradutor e índices. Conferir wrapper e leitor antes de renomear. Não transformar tradutor em autor nem completar nomes. O leitor final pode exigir mudança da predefinição; catálogo de nomes ou preferência de chave não comprova consumo.

### Cabeçalho de citação contaminado por url ou endereço (RW2222-064)

Cabeçalho de citação contaminado por url ou endereço

Antes:
```wikitext
Texto.<ref>{{citar url=https://example.org/a|título=Documento}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{citar url=https://example.org/a|título=Documento}}</ref>

{{Referências}}
```

Preserva o cabeçalho incompleto quando não há indicação comprovada do tipo de fonte. Um endereço, por si só, não permite escolher o modelo bibliográfico.

### Capítulo e intervalo de versículos no campo verso nativo (RW2222-065)

Capítulo e intervalo de versículos no campo verso nativo

Antes:
```wikitext
Texto.<ref>{{Citar bíblia|livro=Atos|verso=28:1-10|citação=Texto}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar bíblia|livro=Atos|verso=1|capítulo=28|verso_final=10|citação=Texto}}</ref>

{{Referências}}
```

Estender a gramática já existente de passagem única capítulo:verso-final ao uso nomeado verso=28:1-10, quando livro é reconhecido e capítulo/verso_final estão ausentes, preservando ambos extremos e edição. Não atravessar capítulos, resolver livros ambíguos, descartar edição/citação ou sobrescrever capítulo/verso_final. Intervalos invertidos ou misturados retêm a chamada.

### Nome de citação jornalística com acento perdido (RW2222-066)

Nome de citação jornalística com acento perdido

Antes:
```wikitext
Texto.<ref>{{citar noticia|title=Documento|url=https://example.org/a}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar jornal|título=Documento|url=https://example.org/a}}</ref>

{{Referências}}
```

Qualificar a variante exata citar noticia contra o leitor da família Citar notícia/Citar jornal, com todos os argumentos conhecidos preservados. Sem reclassificar outra publicação pelo título. Cabeçalho atual não é reconhecido. Não extrapolar remoção de acentos a nomes arbitrários ou trocar modelo desconhecido por Citar web. Deve fechar o contrato do redirecionamento/modelo nativo. Conferir se a grafia sem acento já é um redirecionamento nativo válido antes de classificar a chamada como erro. O não reconhecimento pelo RevisaWiki não prova um erro de exibição na Wikipédia.

### Concluir a conversão de marcas de ligação inativa diante de quebras e redundância (RW2222-077)

Concluir a conversão de marcas de ligação inativa diante de quebras e redundância

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a}}
{{Ligação inativa|data=novembro de 2026}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a|datali=novembro de 2026}}</ref>

{{Referências}}
```

Reconhecer apenas a mesma citação e a mesma marca associada quando uma quebra de linha substitui um espaço. Transportar somente data informada e válida, preservando URL e captura. Para marca sem data ao lado de datali já preenchido, retirar redundância só com equivalência comprovada do consumidor. Nunca inventar datas nem sobrescrever valores conflitantes.

### Aplica os ajustes de citações em páginas de ajuda e de categoria (RW2222-080)

Aplica os ajustes de citações em páginas de ajuda e de categoria

Antes:
```wikitext
Texto.<ref>{{Citar web|title=Documento|website=Sítio|publisher=Editora|url=https://example.org/a}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|obra=Sítio|publicado=Editora|url=https://example.org/a}}</ref>

{{Referências}}
```

O exemplo representa texto ativo de uma página de ajuda. Exemplos protegidos por nowiki ou por blocos de código ficam como estão.

### Localizador explícito preservado com paginação estruturada (RW2222-HOLD-02)

Localizador explícito preservado com paginação estruturada

Antes:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|página=12|em=§ 3}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar livro|título=Documento|página=12}} § 3</ref>

{{Referências}}
```

Uma citação completa isolada no mesmo ref, páginas estruturadas e localizador literal simples, sem texto concorrente.

### Separador ausente após campo autor explícito (RW2222-HOLD-06)

Separador ausente após campo autor explícito

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|autorInstituição Exemplo=|url=https://example.org/a}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|autor=Instituição Exemplo|url=https://example.org/a}}</ref>

{{Referências}}
```

Prefixo autor explícito com nome literal de várias palavras em chave vazia, sem alias conhecido após normalização, rótulo de campo ou autor concorrente.

### Indicador explícito de outros autores (RW2222-HOLD-07)

Indicador explícito de outros autores

Antes:
```wikitext
Texto.<ref>{{Citar relatório|título=Documento|autor=Exemplo|etal=sim|edição=Órgão emissor}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar relatório|título=Documento|autor=Exemplo|numero-autores=etal|edição=Órgão emissor}}</ref>

{{Referências}}
```

etal=sim com pelo menos um autor e sem controles de exibição concorrentes; mantém nomes e demais campos.

## Parâmetros e conteúdo das citações

### Predefinições bibliográficas em português (CIT-01)

Adapta nomes estrangeiros aos modelos nativos com função equivalente.

Antes:
```wikitext
{{cite web|url=https://example.invalid/|title=Documento|access-date=November 1, 2026}}
```
Depois:
```wikitext
{{Citar web|url=https://example.invalid/|título=Documento|acessodata=1 de novembro de 2026}}
```

O nome exato e a capitalização da saída seguem o mapa conferido. Não transforma indistintamente toda Citation em Citar web. Um argumento opaco vizinho não impede reparos conhecidos e independentes, seu conteúdo permanece.

### Chaves inglesas também aceitas (CIT-02)

Prefere os nomes portugueses conferidos, mesmo quando o alias inglês continua funcionando.

Antes:
```wikitext
{{citar web|url=https://example.invalid/|title=Documento|access-date=November 1, 2026}}
```
Depois:
```wikitext
{{citar web|url=https://example.invalid/|título=Documento|acessodata=1 de novembro de 2026}}
```

O papel de cada campo é conferido no leitor da família. Funções especializadas, como developer em Citar jogo eletrônico, usam seu próprio campo nativo e não são transformadas em autoria. website corresponde a obra e publisher a publicado nos leitores compatíveis. Chaves de estado da URL permanecem ligadas aos seus valores e conflitos.

Antes:
```wikitext
|developer=Estúdio Exemplo
```
Depois:
```wikitext
|desenvolvedor=Estúdio Exemplo
```

O exemplo pertence a Citar jogo eletrônico e usa o leitor nativo conferido. O valor é mantido.

### Autores numerados (CIT-03)

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

### Campos repetidos idênticos (CIT-04)

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

### Parâmetros inválidos vazios (CIT-05)

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

### Erros exatos no nome dos campos (CIT-06)

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

Antes:
```wikitext
{{Citar livro|url_seção=https://example.invalid/capitulo}}
```
Depois:
```wikitext
{{Citar livro|capítulourl=https://example.invalid/capitulo}}
```

Modelo e papel nativo comprovados, sem inventar capitulo-url ou sobrescrever alvo conflitante.

Antes:
```wikitext
{{Citar web|status-url=dead}}
```
Depois:
```wikitext
{{Citar web|urlmorta=sim}}
```

Caso finito status-url=dead. Não é substituição geral de url-status ou nomes parecidos.

### Barra literal no título (CIT-07)

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

### Campo caderno e localizadores (CIT-08)

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

Antes:
```wikitext
{{Citar livro|páginas=pág. 12–14}}
```
Depois:
```wikitext
{{Citar livro|páginas=12–14}}
```

Rótulo inequívoco e localizador numérico ou romano aceito, intervalo e outros localizadores permanecem.

### Datas bibliográficas literais (CIT-09)

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

### Acesso e assinatura (CIT-10)

Adapta a chave e os valores de acesso reconhecidos quando o ramo do leitor nativo conserva a informação de assinatura.

Antes:
```wikitext
|url-access=subscription
```
Depois:
```wikitext
|acessourl=subscrição
```

Nos ramos conferidos de web e periódico que aceitam os valores localizados, subscription ou assinatura usa subscrição, registration usa registro, e limited ou limitado usa limitada. Em citações arquivadas, um ramo nativo pode exigir o token original em inglês; a proteção de acesso original conserva esse token. Um valor não reconhecido permanece. A chave de estado da URL não é confundida com o tipo de acesso.

### Endereços e datas de arquivo (CIT-11)

Adapta campos de arquivamento, preservando os endereços e a data informada. Estado explícito de ligação arquivada em português.

Antes:
```wikitext
{{citar web|title=Documento|archive-url=https://example.invalid/arquivo|archive-date=April 3, 2020}}
```
Depois:
```wikitext
{{citar web|título=Documento|arquivourl=https://example.invalid/arquivo|arquivodata=3 de abril de 2020}}
```

Não substitui uma data de arquivo por uma data de publicação.

Antes:
```wikitext
{{Citar web|arquivodata=https://example.invalid/arquivo|arquivourl=2020-04-03}}
```
Depois:
```wikitext
{{Citar web|arquivodata=2020-04-03|arquivourl=https://example.invalid/arquivo}}
```

Par complementar na mesma citação, com valores preservados e sem conflito. Não inventa datas.

Antes:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a|arquivourl=https://web.archive.org/web/20240101000000/https://example.org/a|arquivodata=2024-01-01|url-status=dead}}</ref>

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>{{Citar web|título=Documento|url=https://example.org/a|arquivourl=https://web.archive.org/web/20240101000000/https://example.org/a|arquivodata=2024-01-01|urlmorta=sim}}</ref>

{{Referências}}
```

Em citar web, citar livro e citar periódico, converte um estado explícito importado em urlmorta=sim ou urlmorta=não quando a URL original, o arquivo Wayback e a data comprovada coincidem. Preserva endereços, datas de consulta e valores de acesso. Âncoras ou modos dinâmicos, datas ambíguas, conflitos e estados desconhecidos impedem apenas essa conversão; os outros ajustes seguros continuam. A ativação de um estado antes ignorado pode passar a exibir o arquivo como destino principal.

### Data de captura já escrita na URL (CIT-12)

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

### DOI com pontuação excedente (CIT-13)

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

### ISBN e repetições (CIT-14)

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

Antes:
```wikitext
[[ISBN]] [[Special:BookSources/9780306406157|978-0-306-40615-7]]
```
Depois:
```wikitext
{{ISBN|978-0-306-40615-7}}
```

Mesmo número nas duas ligações e dígito verificador válido, mantém a grafia exibida.

### Identificadores em ligações (CIT-15)

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

### Campo título recuperável localmente (CIT-16)

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

### Lista Vancouver e falha Lua (CIT-17)

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

### Limites perdidos entre campos (CIT-18)

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

### Formatação compacta de citações (CIT-19)

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

### Obras históricas e modelos importados (CIT-20)

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

### Citation com consumidor português confirmado (CIT-21)

Converte a chamada genérica para o modelo nativo do tipo de publicação identificado.

Antes:
```wikitext
{{Citation|titulo=Obra|publicado=Editora|ano=2005}}
```
Depois:
```wikitext
{{Citar livro|titulo=Obra|publicado=Editora|ano=2005|ref=harv}}
```

Exige dados suficientes para distinguir livro, web, jornal, periódico ou revista, sem perder a função de campos. Mantém as âncoras Harvard implícitas por ref=harv quando necessário.

### Edição bibliográfica em português (CIT-22)

Adapta ordinais estrangeiros reconhecidos ao valor português.

Antes:
```wikitext
|edição=2nd
```
Depois:
```wikitext
|edição=2.ª
```

O número e o sufixo precisam formar um ordinal válido no campo de edição de uma citação reconhecida. Texto livre e combinações inválidas permanecem.

### Referências bíblicas com intervalos preservados (CIT-23)

Adapta livros e intervalos de versículos previstos para Citar bíblia.

Antes:
```wikitext
{{Bibleverse|Titus|2:1–3}}
```
Depois:
```wikitext
{{Citar bíblia|livro=Tito|capítulo=2|verso=1|verso_final=3}}
```

O mapeamento é finito e conserva os dois extremos no mesmo capítulo. Versões sem equivalente, intervalos entre capítulos e chamadas ambíguas permanecem.

### Destinos bibliográficos com identidade confirmada (CIT-24)

Corrige um destino importado de autor, editor ou obra quando o equivalente português foi conferido.

Antes:
```wikitext
Ligação bibliográfica com homônimo cujo destino e identidade já foram comprovados.
```
Depois:
```wikitext
A mesma ligação com o destino canônico conferido.
```

Somente destinos finitos de identidade confirmada. Não escolhe homônimos pelo nome nem inventa identidade para o exemplo.

### Resíduos acidentais no título simples (CIT-25)

Troca quebra acidental por espaço e retira U+200B acidental no contexto confirmado.

Antes:
```wikitext
{{Citar web|título=Parte
seguinte}}
```
Depois:
```wikitext
{{Citar web|título=Parte seguinte}}
```

Títulos latinos simples, marcação, URLs, múltiplos parágrafos e separadores de outras escritas ficam. Sem limpeza global de invisíveis.

### Campos conhecidos junto de um campo opaco (CIT-26)

Completa reparos independentes conservando o argumento desconhecido.

Antes:
```wikitext
{{Ouvrage|titre=Obra|année=2024|champinconnu=valor}}
```
Depois:
```wikitext
{{Citar livro|título=Obra|ano=2024|champinconnu=valor}}
```

Exemplo ilustrativo. Só campos com papel comprovado mudam, valores opacos e conflitos permanecem.

### Prefixo PMC sem o teto antigo (CIT-27)

Normaliza o prefixo literal mantendo todos os dígitos.

Antes:
```wikitext
{{Citar periódico|pmc=PMC10730720}}
```
Depois:
```wikitext
{{Citar periódico|pmc=10730720}}
```

Normalização do código, não prova existência ou correção bibliográfica do identificador.

### Endereço sem invólucro redundante (CIT-28)

Retira aspas pareadas ou um auxiliar URL exato usado no lugar de um endereço literal.

Antes:
```wikitext
|url={{URL|https://example.org/fonte}}
```
Depois:
```wikitext
|url=https://example.org/fonte
```

Exige uma URL inteira de HTTP ou HTTPS, sem rótulo, credenciais, fragmento incompleto ou argumentos adicionais. Não recorta apenas uma parte do endereço.

### Chamada vazia diante de uma fonte completa (CIT-29)

Retira uma chamada de citação inteiramente vazia quando a mesma referência já contém a fonte completa.

Antes:
```wikitext
<ref>{{Citar web}}[https://example.org/fonte Fonte de exemplo]</ref>
```
Depois:
```wikitext
<ref>[https://example.org/fonte Fonte de exemplo]</ref>
```

O conteúdo restante precisa trazer um endereço completo e rótulo, ou uma citação compatível preenchida. A definição, o nome da referência e todo o texto da fonte são preservados.

## Infocaixas e biografias

### Campos de infocaixas conforme cada modelo (BIO-01)

Adapta chaves estrangeiras ou traduzidas incorretamente ao nome aceito pela caixa específica.

Antes:
```wikitext
{{Info/Biografia|birth_place=Cidade fictícia}}
```
Depois:
```wikitext
{{Info/Biografia|local_nascimento=Cidade fictícia}}
```

O mesmo campo inglês pode ter destinos diferentes em caixas diferentes. Nenhum valor preenchido é descartado para silenciar um aviso. O reparo de campo com referências literais do grupo padrão e a inclusão do coletor que falta formam uma alteração dependente. O conjunto finito abrange 137 destinos de 25 modelos nativos e 154 grafias de origem: 116 destinos de texto direto, 11 com ramos condicionais, quatro em subinfocaixas, quatro de legendas cuja avaliação registra referências, um de número inteiro e um seletor com saída textual. Cada destino conserva seu leitor, prioridade e condições; esses números não são conversões de caixas inteiras nem títulos de seção. As condições seguem o leitor nativo: comentários completos podem equivaler a vazio; uma chave fisicamente presente pode suprimir o alias seguinte, enquanto Se vazio permite a alternativa quando o primeiro valor é comprovadamente vazio. Valores dinâmicos sem prova mantêm a composição retida. Rótulos, autoridades taxonômicas e datas de versão exigem os dados que abrem seu ramo. O título de Software com referências exige as versões estável e beta canônicas e ausência dos aliases e opções que acionariam outros consumidores. O contrato numérico não interpreta separadores de milhar ou decimais; referências em largura de imagem ou texto alternativo não viram legendas. Os redirecionamentos nativos conferidos Info/Cientista e Info/Escritor para Info/Biografia usam somente os 15 destinos finitos de Biografia listados no catálogo, com os mesmos aliases e condições. Isso não autoriza outros campos nem conversão de chamadas inteiras. Exige inventário fechado dos produtores e fontes literais conferidas; produtor desconhecido impede essa composição. Uma legenda suprimida ainda pode registrar a fonte, mas isso não a transforma em texto visível nem autoriza um coletor vazio. Os 25 casos sintéticos retidos têm critérios por entrada: 20 dependem de um ramo não alcançado e cinco têm valor inadequado ao papel nativo. A retenção recebe zero crédito de correção; a validação da distribuição final consta do relatório separado.

### Prioridade dos nomes alternativos (BIO-02)

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

### Infocaixa antes da introdução (BIO-03)

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

### Linha própria depois da infocaixa (BIO-04)

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

### Infocaixa legível em linhas (BIO-05)

Distribui os campos de uma infocaixa reconhecida em linhas próprias, mantendo a ordem e os valores.

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

A chamada precisa estar completa e o modelo precisa ter leitor conhecido. Caixas filhas, campos dinâmicos e funções de inclusão mantêm seu contexto.

### Alinhamento e espaço depois do igual (BIO-06)

Alinha os campos previstos e usa um espaço depois de = quando o valor está preenchido.

Antes:
```wikitext
|nome                  =Pessoa Exemplo
```
Depois:
```wikitext
|nome                  = Pessoa Exemplo
```

O espaço é de formatação de um argumento nomeado reconhecido. Campo vazio não ganha preenchimento artificial. Espaços funcionais, referências e o conteúdo do valor são preservados.

### Cabeçalho sem negrito redundante (BIO-07)

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

### Profissões comuns com inicial minúscula (BIO-08)

Põe em minúscula o rótulo de profissões comuns reconhecidas, inclusive quando há uma ligação com rótulo próprio.

Antes:
```wikitext
|ocupação = [[Maquiagem|Maquilhadora]]
```
Depois:
```wikitext
|ocupação = [[Maquiagem|maquilhadora]]
```

Mantém o destino da ligação, as referências e a variante portuguesa do rótulo. Nomes próprios e ocupações não comprovadas permanecem.

### Flexão de profissões confirmada (BIO-09)

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

### Listas de ocupações e campos (BIO-10)

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

### Datas de nascimento e morte (BIO-11)

Adapta formatos literais e predefinições estrangeiras de data ao campo nativo.

Antes:
```wikitext
|nascimento_data=1900-01-02
```
Depois:
```wikitext
|nascimento_data={{DataExt|2|1|1900}}
```

Conserva precisão, calendário, referências e incertezas. Não inventa dia ou mês. Ani e grafias válidas de dni/Dni não mudam por preferência de estilo, uma conversão de data também precisa preservar idade e efeitos de categorização.

### Idade de pessoa viva (BIO-12)

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

### Nascimento e morte na abertura (BIO-13)

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

### Dados da abertura em campos separados (BIO-14)

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

### Categoria de nascimento redundante (BIO-15)

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

### Casamento com datas e estado civil (BIO-16)

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

### Site oficial conforme o leitor da caixa (BIO-17)

Corrige sintaxe de endereço, protocolo repetido e apresentação conforme o campo nativo.

Antes:
```wikitext
|website=[[https://example.invalid/|Sítio oficial]]
```
Depois:
```wikitext
|site=[https://example.invalid/ Sítio oficial]
```

Usa o campo realmente lido em cada família. Nas caixas de empresa previstas, website, homepage, pagina ou página podem dar lugar a site quando esse destino está ausente. Endereços, rótulos, múltiplos sites e conflitos não são apagados.

### Arquivo, tamanho e legenda em campos próprios (BIO-18)

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

### Texto alternativo da imagem (BIO-19)

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

### Tamanho de imagem com unidade repetida (BIO-20)

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

### Campos de unidades nativas (BIO-21)

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

### Caixas incorporadas (BIO-22)

Reconhece módulos internos compatíveis e mantém os dados de cada caixa.

Antes:
```wikitext
{{Info/Biografia|nome=Pessoa fictícia|módulo={{Info/Cientista|child=sim}}}}
```
Depois:
```wikitext
{{Info/Biografia|nome=Pessoa fictícia|módulo={{Info/Cientista|child=sim}}}}
```

A filha precisa aceitar o modo incorporado. A Info/Biografia lê child ou embed e usa módulo e módulo2 a módulo6, sem módulo1. O conteúdo e o modo da filha são preservados. O programa pode formatar seus campos em linhas separadas sem retirá-la do módulo.

### Caixas principais repetidas (BIO-23)

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

### Campos com significado próprio (BIO-24)

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

### Cabeçalho e campos estrangeiros migrados juntos (BIO-25)

Pode migrar uma chamada estrangeira completa quando há um contrato específico que cobre todos os seus argumentos.

Antes:
```wikitext
{{Infobox football biography|name=Pessoa Exemplo|position=Forward}}
```
Depois:
```wikitext
{{Info/Futebolista|nome=Pessoa Exemplo|posição=atacante}}
```

O catálogo de migração reúne seis registros: cinco ativos e uma colisão de cabeçalho preservada. Dos ativos, dois cuidam da interface portuguesa, um reparo de Info/Biografia e um wrapper Infobox person, e três descrevem subconjuntos ingleses de pessoa, cientista e futebolista. O reconhecimento de 170 cabeçalhos serve para localizar contratos, sem prometer 170 conversões. Uma caixa estrangeira só migra quando o contrato cobre todos os seus argumentos e o contexto de uso. Campo desconhecido, fonte ambígua, referência sem coletor comprovado ou modo de incorporação incompatível conserva a caixa afetada. Os demais ajustes independentes continuam.

Antes:
```wikitext
{{Infobox person|name=Pessoa Exemplo|birth_name=Nome anterior}}
```
Depois:
```wikitext
{{Info/Biografia|nome=Pessoa Exemplo|nome_nascimento=Nome anterior}}
```

Exige origem inglesa comprovada. Sem essa origem, mantém birth_name. O wrapper português tem interface própria e não recebe o significado do modelo inglês.

### Grupos étnicos com todos os dados visíveis (BIO-26)

Usa uma infocaixa genérica nos formatos estrangeiros certificados em que uma caixa específica deixaria campos sem exibição.

Antes:
```wikitext
{{Infobox ethnic group|grupo=Grupo Exemplo|image=|população=20,074|regiões=[[Região Exemplo]]}}
```
Depois:
```wikitext
Uma Infocaixa com Grupo Exemplo no cabeçalho e linhas próprias de População e Regiões, conservando 20,074 e a ligação.
```

A forma precisa corresponder ao padrão conferido, com imagem vazia e sem campos adicionais desconhecidos. Não interpreta separadores numéricos nem descarta regiões.

### Infocaixa manual com estrutura certificada (BIO-27)

Adapta um padrão restrito de tabela manual para Infocaixa, mantendo os dados apresentados.

Antes:
```wikitext
Uma tabela infobox vcard com cabeçalho, âncora e pares simples de rótulo e dado.
```
Depois:
```wikitext
A mesma informação em Infocaixa, com âncora, rótulos, dados e ligações preservados.
```

Não converte qualquer tabela ou HTML parecido com uma caixa. Atributos, mesclagens, tabelas internas ou linhas fora do padrão impedem a conversão.

### Ani e efeitos da data preservados (BIO-28)

Mantém uma chamada Ani válida quando a troca alteraria idade, categorias ou outro efeito do modelo.

Antes:
```wikitext
{{Info/Biografia|data_nascimento={{Ani|1972|5|24}}}}
```
Depois:
```wikitext
A chamada Ani permanece no campo, mesmo se a formatação externa da infocaixa mudar.
```

Uma semelhança visual não prova equivalência. As formas nativas de datas de pessoas falecidas também precisam conservar o estado vital e a idade ao falecer.

### Campos nativos recuperados na família certa (BIO-29)

Corrige aliases específicos quando a implementação nativa confirma o campo de destino.

Antes:
```wikitext
|lançamento = 2010
```
Depois:
```wikitext
|lançado = 2010
```

Neste exemplo, o modelo é Info/Álbum. O destino não pode conflitar com um valor já preenchido. O catálogo também contém reparos próprios de Museu, Aeronave, empresas, lutador e caixas genéricas.

### Contratos separados para origens diferentes (BIO-30)

Distingue uma caixa nativa de uma chamada estrangeira que usa o mesmo nome.

Antes:
```wikitext
{{Infobox person|name=Pessoa Exemplo|occupation=escritor}}
```
Depois:
```wikitext
{{Info/Biografia|nome=Pessoa Exemplo|ocupação=escritor}}
```

Este resultado exige origem e perfil comprovados. Sem essa confirmação, a colisão entre nomes conserva a chamada. A cobertura ativa é finita e não equivale a converter todas as caixas de seis Wikipédias.

### Grafias locais específicas de país de nascimento e atividade, mais fundador de empresa (RW2222-007)

Grafias locais específicas de país de nascimento e atividade, mais fundador de empresa.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|nascimento_pais=Brasil|periodo_atividade=2000–2020}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|nascimento_país       = Brasil
|período_atividade     = 2000–2020
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias|Brasil}}

```

Dono confirmado, sem qualquer alias concorrente, valor e referências preservados. Não é substituição genérica por remoção de acentos.

### Instituições de trabalho, orientação, alunos e campo científico, incluindo subconjunto EN Infobox scientist (RW2222-008)

Instituições de trabalho, orientação, alunos e campo científico, incluindo subconjunto EN Infobox scientist.

Antes:
```wikitext
{{Infobox scientist|name=Exemplo|workplaces=[[Instituição]]|doctoral_advisor=Pessoa A|doctoral_students=Pessoa B|fields=Física}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|instituicoes_trabalho = [[Instituição]]
|orientador            = Pessoa A
|orientados            = Pessoa B
|campo                 = Física
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Cada papel tem destino próprio. Sem fundir orientador com aluno, formação com emprego ou campos conflitantes; blocos estrangeiros exigem todos os campos representados.

### Intervalos completos e cargos numerados em Info/Titular de cargo (RW2222-009)

Intervalos completos e cargos numerados em Info/Titular de cargo.

Antes:
```wikitext
{{Info/Titular de cargo|nome=Exemplo|office2=Prefeito|term_start2=2000|term_end2=2004|predecessor2=Pessoa A|successor2=Pessoa B}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Titular de cargo
|nome                  = Exemplo
|título2               = Prefeito
|mandato2              = 2000 – 2004
|antes2                = Pessoa A
|depois2               = Pessoa B
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias|Política}}

```

Índices coerentes de 1 a 8, datas preservadas, aliases concorrentes preservados, sucedido em todas as linhas respeitado. Término não é inventado. Não é migração completa de toda Info officeholder.

### Carreiras profissionais, juventude e seleção com linhas alinhadas em futebolistas (RW2222-010)

Carreiras profissionais, juventude e seleção com linhas alinhadas em futebolistas.

Antes:
```wikitext
{{Infobox football biography|name=Exemplo|years1=2000–2001|clubs1=[[Clube]]|caps1=0|goals1=0}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Futebolista
|nome                  = Exemplo
|ano                   = 2000–2001
|clubes                = [[Clube]]
|jogos(gols)           = 0 (0)
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias|Esportes|Futebol}}

```

Índices contíguos, pares completos, zeros e empréstimos preservados. Estatísticas literais numéricas. Blocos incompletos ficam intactos sem bloquear os demais.

### Preservar IMDb de filme por ligação na seção apropriada antes de retirar campo obsoleto (RW2222-011)

Preservar IMDb de filme por ligação na seção apropriada antes de retirar campo obsoleto.

Antes:
```wikitext
{{Info/Filme|nome=Exemplo|imdb_id=1234567}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Filme
|nome                  = Exemplo
}}
'''Exemplo''' é um assunto de teste.

== Ligações externas ==
* {{IMDb título|tt1234567}}

{{Portal3|Cinema|Entretenimento}}

```

Um identificador inequívoco de 7 ou 8 dígitos, sem IDs conflitantes; usa IMDb título. Valores maiores ou ambíguos continuam preservados.

### Compor a normalização de data já feita pelo programa com a migração biográfica (RW2222-025)

Compor a normalização de data já feita pelo programa com a migração biográfica.

Antes:
```wikitext
{{Infobox person|name=Exemplo|birth_date={{Dni|29|2|2000}}}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|nascimento_data       = {{Dni|29|2|2000}}
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Helpers Dni/DataExt completos em nascimento e Morte/DataExt em falecimento, calendário gregoriano válido e origem EN confiável. Não muda idade, precisão nem interpreta data parcial.

### Nome de nascimento no campo próprio (RW2222-026)

Nome de nascimento no campo próprio.

Antes:
```wikitext
{{Infobox person|name=Exemplo|birth_name=Nome anterior}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|nome_nascimento       = Nome anterior
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Origem EN confiável. Preservar batismo, nome completo e aliases nativos concorrentes como papéis distintos. Wrapper PT continua com sua interface anterior.

### Cidadania sem confundir com nacionalidade (RW2222-027)

Cidadania sem confundir com nacionalidade.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|citizenship=[[França]]}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|cidadania             = [[França]]
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias|França}}

```

Sem inferir um país nem substituir nacionalidade; não sobrescreve cidadania existente.

### Sepultamento e causa de morte separados (RW2222-028)

Sepultamento e causa de morte separados.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|resting_place=[[Cemitério]]}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|sepultamento          = [[Cemitério]]
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Aliases e burial/resting concorrentes ficam preservados; não inventar data de enterro nem converter coordenadas. Campos que ativariam programas desconhecidos, auxiliares aninhados não demonstrados ou HTML com atributos de apresentação permanecem no campo original. Comentários e conteúdo realmente literal continuam protegidos.

### Conhecido por, obras, obras notáveis e créditos mantêm funções distintas (RW2222-029)

Conhecido por, obras, obras notáveis e créditos mantêm funções distintas.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|known_for=Uma descoberta}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|conhecido_por         = Uma descoberta
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Retém combinações que suprimem campos na origem, incluindo works/credits e aliases concorrentes; não ativa conteúdo oculto por troca de nome.

### Atividade, empregador e organização como campos separados (RW2222-030)

Atividade, empregador e organização como campos separados.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|years_active=2000–2020}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|período_atividade     = 2000–2020
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Não unir organizações distintas nem trocar prioridade de aliases; fontes diferentes para mesmo destino bloqueiam só a conversão daquele papel.

### Nome nativo e código de idioma em campos próprios (RW2222-031)

Nome nativo e código de idioma em campos próprios.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|native_name=名前|native_name_lang=ja}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|nome_nativo           = 名前
|nome_nativo_lang      = ja
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Idioma precisa ser código literal compatível; texto, ref ou programa nesse campo fica preservado, sem ativar atributo HTML inválido.

### Encaminhar módulos biográficos comprovados sem migrar uma filha estrangeira desconhecida (RW2222-032)

Encaminhar módulos biográficos comprovados sem migrar uma filha estrangeira desconhecida.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|module={{Info/Biografia|child=sim|nome=Filha}}}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|módulo                = {{Info/Biografia
|child                 = sim
|nome                  = Filha
}}
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Somente filha nativa conhecida com child/embed positivo explícito, destino sem colisão e estrutura preservada; modo desconhecido fica intacto. Formatação previamente existente da filha pode ocorrer independentemente. Campos que ativariam programas desconhecidos, auxiliares aninhados não demonstrados ou HTML com atributos de apresentação permanecem no campo original. Comentários e conteúdo realmente literal continuam protegidos.

### Sítio oficial isolado não impede migração simples (RW2222-033)

Sítio oficial isolado não impede migração simples.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|website=https://example.org/?a=1&b=2}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|site                  = https://example.org/?a=1&b=2
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

website→site mantém mesmo URL, rótulo, consultas e referências. Qualquer alias concorrente, mesmo vazio, conserva a prioridade existente.

### Expandir troca de bandeiras por país escrito em biografias civis comprovadas (RW2222-034)

Expandir troca de bandeiras por país escrito em biografias civis comprovadas.

Antes:
```wikitext
{{Info/Cientista|nome=Exemplo|nacionalidade={{BRA}}|ocupação=cientista}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Cientista
|nome                  = Exemplo
|nacionalidade         = [[Brasil]]
|ocupação              = cientista
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias|Brasil|Ciência}}

```

Novas famílias: Cientista e Escritor por redirecionamentos exatos, e nacionalidade de Titular de cargo. Mantém exceções militares, de conflito e esporte e o rótulo/ref do país. Campos que ativariam programas desconhecidos, auxiliares aninhados não demonstrados ou HTML com atributos de apresentação permanecem no campo original. Comentários e conteúdo realmente literal continuam protegidos.

### Campos náuticos sem acento (RW2222-048)

Campos náuticos sem acento.

Antes:
```wikitext
{{Info/Navio|nome=Exemplo|propulsao=Vapor|tripulacao=300}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Navio
|nome                  = Exemplo
|propulsão             = Vapor
|tripulação            = 300
}}
'''Exemplo''' é um assunto de teste.

```

Somente Navio e destinos sem aliases concorrentes; não reinterpretar número, unidade, propulsão nem carreira.

### Fechamento do museu no campo encaminhado ao edifício (RW2222-049)

Fechamento do museu no campo encaminhado ao edifício.

Antes:
```wikitext
{{Info/Museu|nome=Exemplo|fechamento=2000}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Museu
|nome                  = Exemplo
|encerramento          = 2000
}}
'''Exemplo''' é um assunto de teste.

```

Preservar data exata e aliases de encerramento/dissolução/extinção; fundador continua aguardando suporte nativo.

### Nome local, administração, inauguração e altitude de aeroporto (RW2222-050)

Nome local, administração, inauguração e altitude de aeroporto.

Antes:
```wikitext
{{Info/Aeroporto|nome=Exemplo|elevacao_m=52}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Aeroporto
|nome                  = Exemplo
|altitude              = 52
}}
'''Exemplo''' é um assunto de teste.

```

Altitude só numérica em metros, sem unidade/ref/programa; cidade não é presumida como área servida.

### Pistas completas em auxiliar nativo (RW2222-051)

Pistas completas em auxiliar nativo.

Antes:
```wikitext
{{Info/Aeroporto|nome=Exemplo|pista1_numero=07/25|pista1_comprimento_m=1861|pista1_superficie=Asfalto/Concreto}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Aeroporto
|nome                  = Exemplo
|pistas                = {{Info/Aeroporto/Pistas
|cabeceira             = 07/25
|comprimento           = 1861
|superfície            = ASPH/CONC
}}
}}
'''Exemplo''' é um assunto de teste.

```

Cabeceiras preservadas como texto; comprimento numérico em metros e superfície em mapa finito comprovado; índices alinhados, destino ausente, sem parâmetros adicionais ou referências no cálculo.

### Profissões femininas de mapa finito quando a identidade estiver confirmada (RW2222-056)

Profissões femininas de mapa finito quando a identidade estiver confirmada.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|ocupação=Jornalista e Redator}}
'''Exemplo''' é um assunto de teste.
[[Categoria:Mulheres]]

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|ocupação              = jornalista e redatora
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias|Jornalismo|Mulheres}}

[[Categoria:Mulheres]]

```

Categoria feminina verificada ou prova P21/Q5 já validada; não inferir pelo nome. Preservar títulos, nomes, aspas, variantes PT-PT e trilhas de ligação; não prometer flexão universal ou direção masculina não implementada.

### Formatação vertical sem escolher parâmetros duplicados (RW2222-057)

Formatação vertical sem escolher parâmetros duplicados.

Antes:
```wikitext
{{Info/Biografia|nome=Exemplo|ocupação=ator|ocupação=escritor}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Biografia
|nome                  = Exemplo
|ocupação              = ator
|ocupação              = escritor
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Biografias}}

```

Mantém ambas as ocorrências, ordem, valores e prioridade efetiva. Só quebra linhas e padroniza espaçamento de apresentação.

### Profundidades média e máxima separadas (RW2222-067)

Profundidades média e máxima separadas.

Antes:
```wikitext
{{Info/Corpo de água|nome=Exemplo|prof_med=2600|prof_max=4694}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Corpo de água
|nome                  = Exemplo
|profundidade          = 2600
|profundidade_max      = 4694
}}
'''Exemplo''' é um assunto de teste.

```

Mesmo dono e destino correspondente, valores e unidades intactos; não calcular nem trocar média por máxima.

### Mapa de corpo de água em campo consumido (RW2222-068)

Mapa de corpo de água em campo consumido.

Antes:
```wikitext
{{Info/Corpo de água|nome=Exemplo|mapa=Example.png}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Corpo de água
|nome                  = Exemplo
|imagem_mapa           = Example.png
}}
'''Exemplo''' é um assunto de teste.

```

Nome de arquivo simples, sem destino concorrente; foto principal e legendas/tamanhos já existentes continuam independentes.

### Localidade mais próxima de área protegida (RW2222-069)

Localidade mais próxima de área protegida.

Antes:
```wikitext
{{Info/Área protegida|nome=Exemplo|cidade_proxima=[[Localidade]]}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Área protegida
|nome                  = Exemplo
|localidade            = [[Localidade]]
}}
'''Exemplo''' é um assunto de teste.

```

Somente uma localidade literal/ligação única, sem cidade/localidade concorrente. Não converter coordenadas ou localização administrativa.

### Alimentação elétrica em energia (RW2222-070)

Alimentação elétrica em energia.

Antes:
```wikitext
{{Info/Computador|nome=Exemplo|alimentacao=Micro USB}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Computador
|nome                  = Exemplo
|energia               = Micro USB
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Tecnologias de informação}}

```

Só o papel explícito de alimentação, preservando conector, números e unidades. Entrada não é tratada como sinônimo.

### Unidades militares numeradas em seus campos nativos (RW2222-071)

Unidades militares numeradas em seus campos nativos.

Antes:
```wikitext
{{Info/Conflito militar|nome=Exemplo|units1=[[Unidade]]}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Conflito militar
|nome                  = Exemplo
|unidade1              = [[Unidade]]
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Guerra}}

```

Preserva lados/listas; primeiro subconjunto de texto ou ligações completas. Auxiliares estrangeiros desconhecidos e suas refs permanecem protegidos.

### Tamanho literal da imagem em conflito militar (RW2222-072)

Tamanho literal da imagem em conflito militar.

Antes:
```wikitext
{{Info/Conflito militar|nome=Exemplo|imagem_tamanho=300px}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Conflito militar
|nome                  = Exemplo
|imagem-tamanho        = 300px
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Guerra}}

```

Só corrige chave conhecida, sem redimensionamento nem prioridade nova. Conflito imagem-tamanho/imagens_tamanho impede a troca.

### Identificador de país em aeroporto com auxiliar explícito sem parâmetros (RW2222-HOLD05)

Identificador de país em aeroporto com auxiliar explícito sem parâmetros.

Antes:
```wikitext
{{Info/Aeroporto|nome=Exemplo|pais={{GBR}}}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Aeroporto
|nome                  = Exemplo
|país                  = GBR
}}
'''Exemplo''' é um assunto de teste.

```

Somente {{GBR}} inequívoco e país ausente; auxiliares rotulados e outros países aguardam prova própria.

### SoC com rótulo próprio em observações, por escolha expressa do usuário (RW2222-HOLD08)

SoC com rótulo próprio em observações, por escolha expressa do usuário.

Antes:
```wikitext
{{Info/Computador|nome=Exemplo|soc=Chip X|obs=}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Computador
|nome                  = Exemplo
|obs                   = SoC: Chip X
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Tecnologias de informação}}

```

obs ausente ou vazio e sem outra informação; não substituir processador. Referência sem coletor depende do pré-requisito nativo comprovado.

### Fundador de museu continua preservado aguardando suporte nativo (RW2222-HOLD04)

Fundador de museu continua preservado aguardando suporte nativo.

Antes:
```wikitext
{{Info/Museu|nome=Exemplo|fundador=Pessoa}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Museu
|nome                  = Exemplo
|fundador              = Pessoa
}}
'''Exemplo''' é um assunto de teste.

```

Escolha expressa: continuar aguardando, sem proposta ou fallback.

### locator_x/y preservados (RW2222-HOLD09)

locator_x/y preservados.

Antes:
```wikitext
{{Info/Área protegida|nome=Exemplo|locator_x=40.178775|locator_y=-8.697013}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Área protegida
|nome                  = Exemplo
|locator_x             = 40.178775
|locator_y             = -8.697013
}}
'''Exemplo''' é um assunto de teste.

```

Não são convertidos em latitude/longitude nem substituídos por P625 com divergência espacial.

### Campos alt/image_upright preservados no programa. Proposta nativa local separada, testada e não publicada (RW2222-HOLD10)

Campos alt/image_upright preservados no programa. Proposta nativa local separada, testada e não publicada.

Antes:
```wikitext
{{Info/Conflito militar|nome=Exemplo|imagem=Example.jpg|alt=Descrição|image_upright=0.5}}
'''Exemplo''' é um assunto de teste.

```
Depois:
```wikitext
{{Info/Conflito militar
|nome                  = Exemplo
|imagem                = Example.jpg
|alt                   = Descrição
|image_upright         = 0.5
}}
'''Exemplo''' é um assunto de teste.

{{Portal3|Guerra}}

```

Sem migração forçada para arquivo; proposta depende de alteração comunitária da predefinição.

## Portais e controle de autoridade

### Biografias confirmadas (POR-01)

Acrescenta Biografias quando há uma pessoa e um perfil confirmado, inclusive caixas Wikidata.

Antes:
```wikitext
{{Portal3|Política}}
```
Depois:
```wikitext
{{Portal3|Política|Biografias}}
```

Usa as famílias individuais verificadas e os aliases cadastrados, inclusive Info/Titular de cargo e caixas Wikidata elegíveis. Uma caixa genérica ou um título parecido não bastam. O reconhecimento da pessoa não depende de migrar todos os campos da caixa.

### País sem duplicar o estado (POR-02)

Acrescenta o país apenas quando o dado é explícito e não há um portal regional que o torne redundante.

Antes:
```wikitext
{{Portal3|Biografias|Goiás}}
```
Depois:
```wikitext
{{Portal3|Biografias|Goiás}}
```

Usa campos explícitos de cidadania, nacionalidade ou nascimento conforme a infocaixa. Países homônimos e abreviaturas ambíguas de estados não são inferidos. Um portal regional reconhecido pode tornar o país redundante.

### Mulheres (POR-03)

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

### Profissão e esporte (POR-04)

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

### Artes e ciências (POR-05)

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

### Filmes, séries e obras musicais (POR-06)

Usa os modelos próprios de obras para reconhecer Cinema, Televisão e Música.

Antes:
```wikitext
Um artigo com uma caixa nativa de álbum ou episódio de televisão.
```
Depois:
```wikitext
Acrescenta os portais temáticos correspondentes, sem Biografias para a obra.
```

Exige uma infocaixa principal e um assunto comprovados. Info/Álbum pode indicar Música. Um filme pode indicar Cinema e Entretenimento, com o país explícito de produção. Não deduz o país de uma obra pela nacionalidade de uma pessoa citada.

### Biologia e saúde (POR-07)

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

### Demais assuntos (POR-08)

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

### Esboço com assunto confirmado (POR-09)

Aproveita combinações conferidas de esboço e categoria para um portal temático.

Antes:
```wikitext
Um artigo sem infocaixa, com esboço temático e categoria concordantes.
```
Depois:
```wikitext
Acrescenta somente o portal que essa combinação confirma.
```

Apenas esboços específicos incluídos no mapa conferido. Não cria um esboço para obter um portal nem usa uma inferência nova como segunda confirmação.

### Nomes de portais importados (POR-10)

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

### Posições e repetições em Portal3 (POR-11)

Reúne chamadas compatíveis de Portal3 em uma lista contínua de temas, preservando os portais já presentes.

Antes:
```wikitext
{{Portal3|Biografias|Futebol|3=Brasil}}
```
Depois:
```wikitext
{{Portal3|Biografias|Futebol|Brasil}}
```

Mantém todos os temas existentes e opções compatíveis. Uma mesma opção com valores diferentes impede somente essa união. Não usa uma lista nova de exclusão para apagar portais.

### Posição do portal no rodapé (POR-12)

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

### Autoridade com algo para exibir (POR-13)

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

### Uma chamada efetiva de autoridade (FOOT-04)

Remove duplicatas equivalentes do controle de autoridade e mantém a grafia portuguesa da chamada conservada.

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

Controle de autoridade e Controlo de autoridade são formas válidas preservadas. IDs e opções diferentes permanecem. NM/NF podem gerar categorias e ordenação, por isso não são apagados como controles puros.

Antes:
```wikitext
{{Controlo de autoria|VIAF=00123}}
```
Depois:
```wikitext
{{Controle de autoridade|VIAF=00123}}
```

Alias exato, com identificadores, zeros e opções preservados. NM/NF conservam seus efeitos próprios.

### Biografia reconhecida sem depender da tradução inteira (POR-14)

Permite que as regras biográficas atuem nas famílias pessoais e aliases verificados, ainda que outros campos estrangeiros precisem permanecer.

Antes:
```wikitext
Uma Info/Titular de cargo individual reconhecida, sem Portal3.
```
Depois:
```wikitext
O rodapé recebe Biografias e outros temas que os campos explícitos confirmarem.
```

As famílias são classificadas pelo modelo e sua identidade. Empresa, unidade militar, grupo étnico, animal e personagem não viram pessoa por terem campos parecidos.

### Países em vários idiomas e escritas (POR-15)

Reconhece nomes portugueses, estrangeiros, endônimos, códigos e variantes conferidas para portais de países e territórios existentes.

Antes:
```wikitext
Uma pessoa com cidadania=日本 em campo reconhecido, sem portal do país.
```
Depois:
```wikitext
O rodapé pode receber Japão, além de Biografias e dos temas já existentes.
```

O mapa contém 197 destinos de países e territórios, não 197 países soberanos. Gentílicos são lidos em nacionalidade ou cidadania. Cidades, estados, abreviaturas postais e nomes ambíguos não bastam. Erros de uma letra só são aceitos no campo apropriado quando o destino é único.

### País e guerra de uma unidade militar (POR-16)

Acrescenta o país da unidade e um conflito explicitamente indicado nos campos pertinentes.

Antes:
```wikitext
{{Info/Unidade Militar|nome=Unidade Exemplo|país=Austrália|guerras/batalhas=[[Segunda Guerra Mundial]]}}
```
Depois:
```wikitext
A unidade conserva seus dados e recebe Portal3 com Guerra, Austrália e Segunda Guerra Mundial.
```

O país deve estar no campo da unidade e o conflito no campo de guerras ou batalhas. Datas de atividade e países mencionados em legendas ou campanhas não servem como prova. Não acrescenta Biografias à unidade.

### Portais por categorias exatas (POR-17)

Reúne portais compatíveis a partir da categoria real do assunto.

Antes:
```wikitext
Artigo sobre futebol com [[Categoria:Futebol]], sem portal final.
```
Depois:
```wikitext
Mesmo artigo com {{Portal3|Futebol|Esportes}} e a categoria preservada.
```

8337 categorias/540 destinos, não palavras soltas. Biografias exige categoria humana individual, equipes, organizações, listas e personagens não viram pessoas. Ambiguidade ou redirecionamento insuficiente retém o candidato.

### Categorias com prova referenciada (CAT-01)

Acrescenta categoria existente com todos os critérios ancorados ao rascunho.

Antes:
```wikitext
Artigo sem categorias temáticas, com tópico e fonte comprovados no perfil habilitado.
```
Depois:
```wikitext
Mesmo artigo com a categoria existente específica permitida.
```

Exige ausência de qualquer categoria nativa reconhecida, incluindo as geradas por modelos. 10359 contratos/9913 destinos/43 perfis, só 171 contratos de 9 perfis possuem produtor P19/P31 materializado. Os demais, inclusive livros/filmes/esportes, ficam condicionais. A informação citada, a entidade e o tipo de categoria precisam coincidir com uma declaração referenciada do Wikidata que use o mesmo endereço de fonte. Essa comparação não inclui a leitura automática do corpo externo da referência. Não inverte o mapa de portais.

## Imagens e ligações

### Espaços de nomes e opções de imagem (IMG-01)

Adapta Image e thumb no contexto de uma imagem reconhecida.

Antes:
```wikitext
[[Image:Exemplo.jpg|thumb|220px|Uma paisagem.]]
```
Depois:
```wikitext
[[Ficheiro:Exemplo.jpg|miniatura|220px|Uma paisagem.]]
```

Conserva arquivo, largura, legenda, alt e destino. File/Image locais podem usar Ficheiro. Ficheiro/Imagem/Arquivo portugueses válidos permanecem. Opções mudam apenas no consumidor verificado, galerias e texto livre não herdam tradução genérica.

### Miniaturada e erros previstos (IMG-02)

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

### Arquivo importado como endereço (IMG-03)

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

### Tamanhos e sintaxe de opção (IMG-04)

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

Antes:
```wikitext
[[Ficheiro:Exemplo.svg|３００px|Legenda ３００]]
```
Depois:
```wikitext
[[Ficheiro:Exemplo.svg|300px|Legenda ３００]]
```

Somente a dimensão reconhecida muda, nome, legenda e demais dígitos permanecem.

### Ligações internas sem pipe redundante (LNK-01)

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

### Flexão simples fora da ligação (LNK-02)

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

### Fechamento único de ligação (LNK-03)

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

### Ligações externas com sintaxe interna (LNK-04)

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

### Rótulo externo partido (LNK-05)

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

### Protocolos e ampersands previstos (LNK-06)

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

Antes:
```wikitext
[https://https://example.invalid/a?id=2#sec Rótulo]
```
Depois:
```wikitext
[https://example.invalid/a?id=2#sec Rótulo]
```

Protocolo igual repetido, preserva rótulo, consulta e fragmento, sem reinterpretar URLs aninhadas ou de arquivo.

### Título de seção com ligação (LNK-07)

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

### Uma imagem por linha (IMG-05)

Separa incorporações de imagem no corpo e mantém uma linha vazia entre o conjunto e a prosa.

Antes:
```wikitext
Texto.
[[Ficheiro:Example.jpg]] [[Ficheiro:Example2.jpg]]Outro texto.

```
Depois:
```wikitext
Texto.

[[Ficheiro:Example.jpg]]
[[Ficheiro:Example2.jpg]]

Outro texto.

```

Não insere linha vazia entre imagens consecutivas. Preserva opções, legendas e imagens funcionais em galerias, tabelas, campos, listas e ícones em linha. Uma imagem ligada a referência ou auxiliar adjacente conserva o contexto.

### Bandeira decorativa para nome ligado (IMG-06)

Substitui formas exatas de país nos campos civis habilitados.

Antes:
```wikitext
Na Info/Biografia: |nacionalidade={{BRA}}
```
Depois:
```wikitext
Na Info/Biografia: |nacionalidade=[[Brasil]]
```

Piloto: nacionalidade/cidadania em Info/Biografia, nacionalidade em Info/Político e Info/Ator. 1928 formas/195 entradas não são todas as variantes. Preserva contextos militares, esportivos, navais, históricos, geográficos ou disputados. Flag|BRA mantém BRA em [[Brasil|BRA]].

### Destino UTF-8 com rótulo conservado (LNK-08)

Decodifica escapes não ASCII do destino sem alterar o rótulo.

Antes:
```wikitext
[[Hist%C3%B3ria#Idade_M%C3%A9dia|Idade Média]]
```
Depois:
```wikitext
[[História#Idade_Média|Idade Média]]
```

Só destino de artigo, rótulo explícito não vazio e UTF-8 válido. Preserva fragmento/rótulo. Não altera unpiped, arquivo, categoria, interwiki, ASCII codificado ou delimitador reservado. Quatro pares nativos tiveram HTML igual.

## Tabelas e sintaxe

### Aberturas e fechamentos de tabelas (TAB-01)

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

### Aspas dos atributos (TAB-02)

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

### Cabeçalhos simples acessíveis (TAB-03)

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

### Atributos antigos equivalentes (TAB-04)

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

### Formatação esquecida dentro da célula (TAB-05)

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

### Texto deslocado pelo leitor de tabelas (TAB-06)

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

### Mesclagens e atributos com erro finito (TAB-07)

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

### Tabelas largas e apresentação responsiva (TAB-08)

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

### Chaves e colchetes em limites únicos (SYN-01)

Repara trocas previstas de fechamentos quando há uma única estrutura reconhecida.

Antes:
```wikitext
Uma chamada conhecida com fechamento trocado e limites inequívocos.
```
Depois:
```wikitext
A mesma chamada com fechamento correspondente.
```

O reparo usa nomes e estruturas conhecidas e precisa de limites inequívocos. Não substitui chaves, colchetes ou parênteses globalmente e preserva fórmulas, ligações, código e exemplos.

### Trecho completo anterior a marcação incerta (SYN-02)

Aplica correções locais independentes em trechos verificáveis.

Antes:
```wikitext
Uma ligação simples com erro antes de um bloco incompleto independente.
```
Depois:
```wikitext
A ligação corrigida e o bloco incompleto preservado.
```

Trechos independentes continuam elegíveis mesmo se outro ponto contiver marcação incerta. Um fechamento HTML isolado pode ser ignorado apenas na leitura estrutural, mantendo os bytes originais do texto.

### Resíduos de cópia de chat (SYN-03)

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

### Negrito e itálico Markdown (SYN-04)

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

### Múltiplas linhas vazias (SYN-05)

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

### Começo sem linhas vazias (SYN-06)

Retira linhas vazias do começo do artigo, inclusive após remover Descrição curta.

Antes:
```wikitext


Texto do artigo.
```
Depois:
```wikitext
Texto do artigo.
```

Retira apenas linhas iniciais sem conteúdo em artigos. Não remove indentação funcional nem conteúdo de exemplos protegidos.

### Título redundante na abertura (SYN-07)

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

### Lista com itens vazios no final (SYN-08)

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

### Erros ortográficos exatos (SYN-09)

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

### Descrição curta e modelos obsoletos (SYN-10)

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

### Categorias e palavras mágicas importadas (SYN-11)

Adapta as palavras mágicas e os prefixos previstos, conservando seus argumentos.

Antes:
```wikitext
{{DEFAULTSORT:Exemplo, Tema}}
```
Depois:
```wikitext
{{DEFAULTSORT:Exemplo, Tema}}
```

Uma chamada nativa válida permanece. Só há adaptação com alias ou palavra mágica de origem confirmada. Palavras mágicas exigem o mesmo ID nativo ativo e a forma de chamada correta. Operandos, valores e efeitos permanecem. A preferência de ordenação é ORDENAÇÃOPADRÃO. PAGESINNAMESPACE/PAGESINNS ficam retidos sem consumidor ativo comprovado, prefixos de homônimos não transformam modelos em comandos.

### Coordenadas duplicadas (SYN-12)

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

### Tabelas abertas por predefinição nativa (TAB-09)

Reconhece pares conferidos que abrem uma tabela por predefinição e a fecham com marcação literal ou um auxiliar nativo.

Antes:
```wikitext
{{Começa caixa}}
{{S-inc|recente}}
|}
```
Depois:
```wikitext
O bloco continua intacto e ajustes independentes depois dele podem ser aplicados.
```

A leitura depende do par nativo conhecido. Não inventa uma abertura para um fechamento avulso nem reescreve qualquer produtor de tabela.

### Célula já produzida pela predefinição (TAB-10)

Retira um separador de célula redundante antes de um produtor nativo conferido.

Antes:
```wikitext
{| class="wikitable"
|-
|{{Td fmtn|1}}
|}
```
Depois:
```wikitext
{| class="wikitable"
|-
{{Td fmtn|1}}
|}
```

Exige tabela literal reconhecida e Td fmtn com um único número literal. Atributos concorrentes, valores dinâmicos e outros produtores permanecem.

### Partido no consumidor eleitoral correto (TAB-11)

Usa o nome português previsto no campo de partido de modelos eleitorais conferidos.

Antes:
```wikitext
{{Election box candidate with party link no change|candidate=Pessoa Exemplo|party=Democratic Party (United States)|votes=12,345|percentage=4.5}}
```
Depois:
```wikitext
{{Election box candidate with party link no change|candidate=Pessoa Exemplo|party=Partido Democrata (Estados Unidos)|votes=12,345|percentage=4.5}}
```

O mapeamento é específico do consumidor e do valor. Preserva candidato, votos, porcentagem e cores. Não traduz party em uma predefinição desconhecida.

### Modelos de bloco em linhas próprias (SYN-13)

Separa chamadas independentes coladas para facilitar a leitura do código.

Antes:
```wikitext
{{Em construção}}{{Evento atual|Este artigo}}
Texto.
```
Depois:
```wikitext
{{Em construção}}
{{Evento atual|Este artigo}}
Texto.
```

Usa os papéis de bloco reconhecidos. Datas, idiomas e outros auxiliares de frase continuam em linha, valores de campos, referências, tabelas e exemplos protegidos conservam seu contexto.

### Noinclude vazio sem função no artigo (SYN-14)

Retira um par vazio de noinclude no artigo e as linhas iniciais sem conteúdo que sobrarem.

Antes:
```wikitext
<noinclude>
 </noinclude>

Texto.
```
Depois:
```wikitext
Texto.
```

O bloco só pode conter espaços. Controles de inclusão com conteúdo, definições de predefinição e exemplos protegidos permanecem.

### Espaços horizontais em prosa (SYN-15)

Ajusta espaços antes de vírgula/ponto e dentro de parênteses simples.

Antes:
```wikitext
Uma frase , outra ( palavra ).
```
Depois:
```wikitext
Uma frase, outra (palavra).
```

Somente espaços horizontais acidentais na prosa. Mantém referências, fórmulas, código, títulos, URLs, números e unidades. Pontos finais bibliográficos não são apagados genericamente.

### BR entre itens comuns (SYN-16)

Retira BR final antes do próximo item comum do mesmo nível.

Antes:
```wikitext
* Alfa<br>
* Beta
```
Depois:
```wikitext
* Alfa
* Beta
```

Não atravessa sublistas, prefixos de definição, modelos, tabelas, versos ou exemplos.

### Fechamento small inequívoco (SYN-17)

Repara a forma autocontida usada como fechamento.

Antes:
```wikitext
<small>Texto<small/>
```
Depois:
```wikitext
<small>Texto</small>
```

Uma abertura correspondente, fechamento sem atributos e nenhum small posterior ambíguo. Atributos da abertura ficam.

### Título HTML literal para sintaxe wiki (SYN-18)

Padroniza H2–H6 simples e únicos.

Antes:
```wikitext
<h2>Seção simples</h2>
```
Depois:
```wikitext
== Seção simples ==
```

Sem atributos, marcação ou proprietário protegido, título único. Pares nativos conservaram nível, texto, IDs e sumário. Invólucro e metadados de edição da seção mudam, não é HTML idêntico.

### Prefixo de predefinição conhecida (SYN-19)

Retira namespace literal de citações/infocaixas nativas exatas.

Antes:
```wikitext
{{Predefinição:Citar livro|título=Obra}}
```
Depois:
```wikitext
{{Citar livro|título=Obra}}
```

Modelo, argumentos, capitalização e espaços restantes conservados. Homônimos de palavras mágicas, nomes calculados e modelos desconhecidos mantêm o prefixo.

### Lacunas entre itens simples (SYN-20)

Retira lacunas acidentais entre itens irmãos de Ver também, mantendo a sequência em uma lista contínua.

Antes:
```wikitext
* item1

* item2
```
Depois:
```wikitext
* item1
* item2
```

Não soma subitens para alcançar o mínimo de colunas e não une listas separadas por prosa, subtítulos ou comentários funcionais.

### Atributos indevidos no fechamento de tabela (TAB-12)

Retira atributos de fechamento cujo par está comprovado.

Antes:
```wikitext
<table><tr><td>Texto</td class="copiado"></tr></table>
```
Depois:
```wikitext
<table><tr><td>Texto</td></tr></table>
```

Abertura e pilha inequívocas, conserva atributos das aberturas, células, conteúdo e referências.

## Seções finais, colunas e projetos irmãos

### Duas colunas a partir de oito itens (COL-01)

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

### Lista curta sem colunas (COL-02)

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

### Colunas manuais sem col1 e col2 (COL-03)

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

Exige colN consecutivos com uma mesma lista contínua. Preserva a ordem, trata corpo implícito ou 2= e mantém caixas de projetos irmãos e rodapé fora das colunas. Prosa e campos não reconhecidos permanecem. Parâmetros de coluna com texto bibliográfico ou URL são preservados; não são apagados para ajustar o leiaute. A pontuação pode ser corrigida de forma independente, quando as demais condições permitem.

### Apresentação nativa das referências (COL-04)

Prefere o coletor Referências sem acrescentar opções manuais de colunas.

Antes:
```wikitext
{{Referências|col=2}}
```
Depois:
```wikitext
{{Referências}}
```

O limiar de oito vale para listas comuns, não para contar chamadas repetidas de uma referência. Títulos nativos, grupos e bancos com função própria continuam na chamada.

### Ordem das seções e do rodapé (FOOT-01)

Organiza o rodapé em navegações e identificadores, portal, esboço existente, coordenadas gerais, ordenação e categorias.

Antes:
```wikitext
Categoria ou navecaixa inserida entre o título de Referências e seu coletor.
```
Depois:
```wikitext
Coletor junto da seção e elementos de rodapé na posição correspondente.
```

Só move chamadas soltas de papel comprovado. Conteúdo de tabelas, infocaixas, listas e exemplos mantém o seu contexto. Conflitos de ordenação ou dados exclusivos conservam o trecho afetado.

### Chave de ordenação antes das categorias (FOOT-02)

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

Chaves literais idênticas podem ser reunidas. Chaves distintas, donos dinâmicos, NM/NF e programas que possam alterar a ordenação conservam sua ordem de avaliação.

### Categorias consecutivas (FOOT-03)

Põe cada categoria ativa em sua própria linha e retira lacunas acidentais entre categorias consecutivas.

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

Preserva o nome, a ordem e a chave local de cada categoria. Não transforma uma ligação explicativa para uma categoria em categorização.

Antes:
```wikitext
{{Esboço-livro}}[[Categoria:Alfa]][[Categoria:Beta]]
```
Depois:
```wikitext
{{Esboço-livro}}
[[Categoria:Alfa]]
[[Categoria:Beta]]
```

Separa limites conservando nomes, ordem e chaves. O layout geral pode manter uma linha em branco antes do bloco, não entre categorias consecutivas.

### Navecaixas e portais sem div redundante (LAY-01)

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

### Infocaixa sem div redundante (LAY-02)

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

### Projetos irmãos na seção disponível (FOOT-05)

Move Commonscat, Correlatos e caixas de projetos irmãos previstas para a primeira seção adequada que já existe.

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

Usa Ver também, depois Ligações externas, depois Leitura adicional. Sem essas seções, a caixa pode ficar junto do coletor principal de referências. Não cria uma seção vazia. Modelos dinâmicos e títulos ambíguos permanecem.

Antes:
```wikitext
== Ver também ==
* Item anterior.
{{Correlatos|título=<h2>Outra seção</h2>|commonscat=Example}}
```
Depois:
```wikitext
== Ver também ==
* Item anterior.
{{Correlatos|título=<h2>Outra seção</h2>|commonscat=Example}}
```

HTML, títulos ou modelos dinâmicos podem alterar a estrutura. Nesses casos, a caixa mantém sua posição e os ajustes independentes continuam possíveis.

### Ligação de projeto irmão em caixa (FOOT-06)

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

### Indicador de qualidade duplicado (QUAL-01)

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

### Nomes das seções finais (FOOT-07)

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

Antes:
```wikitext
== {{Veja também}} ==
```
Depois:
```wikitext
== Ver também ==
```

Somente chamada inteira sem argumentos. Links externos prefere Ligações externas pelo mesmo contrato, coletores não viram simples texto de seção.

### Sucessão preservada como bloco do rodapé (FOOT-08)

Reconhece o conjunto completo de sucessão ao organizar portais e outros elementos finais.

Antes:
```wikitext
Uma caixa nativa de sucessão completa antes das categorias.
```
Depois:
```wikitext
A sucessão permanece inteira, com os portais na posição elegível do rodapé.
```

A abertura e o fechamento precisam corresponder aos auxiliares nativos conhecidos. O reconhecimento do bloco não altera os dados dos cargos.

### Taxonbar e autoridade no rodapé (FOOT-09)

Mantém Taxonbar depois das navegações e antes do portal, como um bloco de identificadores.

Antes:
```wikitext
Taxonbar, navegação e Portal3 num rodapé reconhecido.
```
Depois:
```wikitext
Navegação, Taxonbar e Portal3, conservando os dados.
```

Taxonbar e controle de autoridade não são aliases universais. Suas chamadas e argumentos permanecem distintos.

### Navegações reunidas em Navboxes (FOOT-10)

Pode agrupar quatro ou mais navegações independentes em uma caixa nativa.

Antes:
```wikitext
{{Navegação A}}
{{Navegação B}}
{{Navegação C}}
{{Navegação D}}
{{Controlo de autoridade}}
```
Depois:
```wikitext
{{Navboxes|título=Tema|lista=
{{Navegação A}}
{{Navegação B}}
{{Navegação C}}
{{Navegação D}}
{{Controlo de autoridade}}
}}
```

Os nomes do exemplo representam navegações com papel já comprovado. O agrupamento exige página de artigo e não usa o título de uma página de usuário. Mantém cada chamada, põe a autoridade por último dentro do grupo e deixa portais, esboço e coordenadas fora dele.

### Um esboço existente (FOOT-11)

Mantém no máximo um esboço que já esteja na página. Havendo mais de um específico, conserva o primeiro; não acrescenta um esboço ausente.

Antes:
```wikitext
{{Esboço-livro}}
{{Esboço-livro}}
```
Depois:
```wikitext
{{Esboço-livro}}
```

Chamadas independentes, reconhecidas e completas. A escolha entre esboços existentes não fornece prova nova de portal ou categoria. As regras específicas de esboços verificados continuam independentes.

### Coordenadas gerais perto das categorias (FOOT-12)

Move a chamada geral de coordenadas para depois do esboço existente.

Antes:
```wikitext
{{Coord|1|2|display=title}}
{{Portal3|Ciência}}
{{Esboço-ciência}}
```
Depois:
```wikitext
{{Portal3|Ciência}}

{{Esboço-ciência}}

{{Coord|1|2|display=title}}
```

Só move uma chamada solta com exibição geral confirmada. Coordenadas de infocaixas, tabelas, listas, legendas e texto explicativo permanecem onde têm função.

## Discussões e predefinições

### Um PD no início (TALK-01)

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

Reconhece apenas os aliases válidos conferidos. Configurações incompatíveis e exemplos protegidos não são apagados. Discussões de usuário não recebem um cabeçalho de artigo inventado.

### Uma Marca de projeto com todos os projetos (TALK-02)

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

Reúne projetos e parâmetros compatíveis, preservando importâncias e avaliações humanas. Valores humanos conflitantes ou dados exclusivos impedem somente a mescla que perderia informação.

### Avaliação automática marcada por bot (TALK-03)

Retira bot e todas as ocorrências de rev quando existe bot. Sem bot, retira uma revisão de data válida anterior a 2021. Conserva as importâncias e avaliações humanas separadas.

Antes:
```wikitext
{{PD}}
{{Marca de projeto|1|Ciência|3|bot=?/20131103|rev=20140530}}
```
Depois:
```wikitext
{{PD}}
{{Marca de projeto|?|Ciência|3}}
```

O corte é estritamente anterior a 1 de janeiro de 2021. Datas inválidas ou atuais sem bot são preservadas.

### Traduzido no formato nativo (TALK-04)

Adapta os campos e a ordem da chamada de tradução conforme a predefinição portuguesa.

Antes:
```wikitext
{{Traduzido|en|Tema fictício|oldid=12345|data=1 de novembro de 2026}}
```
Depois:
```wikitext
{{Traduzido|página=Tema fictício|cód_idioma=en|oldid=12345|data=1 de novembro de 2026}}
```

A conversão usa somente idioma, página, revisão, data e autoria já presentes. Pode recuperar oldid de uma URL coerente com esses dados. Conflitos ficam no texto e nenhuma revisão ou data é inventada.

### Projetos do artigo no mesmo Ajustar código (TALK-05)

Na discussão de um artigo, Ajustar código também pode ler os portais do artigo e preparar PD e Marca de projeto.

Antes:
```wikitext
Discussão sem cabeçalho de projeto e artigo com Física, Tecnologia e Ciência.
```
Depois:
```wikitext
{{PD}}
{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}
```

Requer uma discussão inteira de artigo e uma consulta de leitura bem-sucedida. Uma falha nessa consulta não impede a limpeza local do cabeçalho. O antigo botão Criar código deixa de ser necessário.

### Variantes de portal coladas na discussão (TALK-06)

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

### Definições de predefinição (TPL-01)

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

### Navecaixa com chamada duplicada de chaves (TPL-02)

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

### TemplateStyles (TPL-03)

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

### Campos de sucessão com nomes nativos (TPL-04)

Adapta argumentos importados nos auxiliares de sucessão conferidos.

Antes:
```wikitext
{{S-bef|before=Pessoa Exemplo}}
{{S-inc|recent}}
```
Depois:
```wikitext
{{S-bef|antes=Pessoa Exemplo}}
{{S-inc|recente}}
```

Before e suas posições numeradas só mudam quando não há parâmetro português concorrente. Recent precisa ser o único argumento posicional previsto. Reason e reason2 não são tratados como erros.

### Avisos no topo da discussão (TALK-07)

Organiza o cabeçalho antes das conversas, preservando atribuições e avisos distintos.

Antes:
```wikitext
{{OKA}}
{{Traduzido|página=Tema Exemplo|cód_idioma=en|oldid=12345}}
{{Marca de projeto|3|Ciência|2|rev=20260101}}
{{PD}}
```
Depois:
```wikitext
{{PD}}
{{Marca de projeto|3|Ciência|2|rev=20260101}}
{{Traduzido|página=Tema Exemplo|cód_idioma=en|oldid=12345}}
{{OKA}}
```

Ordem atual, em linhas separadas: PD, Marca de projeto, Traduzido, OKA e outros avisos. Conserva a conversa, assinaturas, comentários, atribuições e avaliações humanas.

### Título no ramo próprio de YouTube (TPL-05)

Usa titulo no vídeo comum que lê esse campo.

Antes:
```wikitext
{{YouTube|abcdefghijk|título=Exemplo}}
```
Depois:
```wikitext
{{YouTube|abcdefghijk|titulo=Exemplo}}
```

ID comum de vídeo, sem canal/playlist ou título concorrente. Outros ramos não mudam por semelhança.

### Marcadores vazios de avaliação (TALK-08)

Troca placeholders como x, "x" ou qualidade por ? no campo geral de Marca de projeto.

Antes:
```wikitext
{{Marca de projeto|qualidade|Aviação|?|rev=20200709}}
```
Depois:
```wikitext
{{Marca de projeto|?|Aviação|?}}
```

Retira rev órfão quando não há avaliação humana válida. Qualidades humanas e parâmetros conflitantes permanecem.

### AvançarDiscussão fora do cabeçalho (TALK-09)

Retira a chamada ativa de AvançarDiscussão.

Antes:
```wikitext
{{PD}}
{{AvançarDiscussão}}
== Tema ==
Mensagem.
```
Depois:
```wikitext
{{PD}}
== Tema ==
Mensagem.
```

Preserva exemplos literais, assinaturas, comentários e o restante da conversa.

## Uso, segurança e distribuição

### Um botão para ajustar (UI-01)

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

### Contagem do que foi aplicado (UI-02)

Mostra os ajustes mantidos e a diferença em bytes. Quando resta uma contagem mais trabalhosa, o texto já pode ser editado ou publicado enquanto ela termina separadamente, sem refazer os reparos.

Antes:
```wikitext
Texto com várias correções independentes.
```
Depois:
```wikitext
Número de ajustes e bytes quando a contagem é exata. Sem contagem confirmada, mensagem de ajustes aplicados e acesso à comparação.
```

Quando a contagem exata não pode ser confirmada, informa que houve ajustes sem estimar um total. Não inclui propostas descartadas. Um bloco da comparação não é necessariamente um único ajuste.

### Mostrar alterações e desfazer (UI-03)

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

### Evitar análise repetida sem mudanças (UI-04)

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

### Resumo Minúcias e edição menor (UI-05)

Preenche o resumo padrão e marca os ajustes automáticos como edição menor.

Antes:
```wikitext
Resumo vazio e aplicação automática confirmada.
```
Depois:
```wikitext
Resumo: Minúcias. Edição menor marcada.
```

Preserva resumo e escolha manuais, além da opção desligada. Não depende do tamanho da diferença. Nas discussões, Ajustar código reúne a preparação e a limpeza do cabeçalho na mesma ação e também marca as mudanças automáticas como menores, respeitando a escolha manual.

### Opções por família (UI-06)

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

### Andamento e cancelamento (UI-07)

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

### Sem corte global de 60 segundos (UI-08)

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

### Uma falha local não cancela tudo (SAFE-01)

Mantém correções independentes que passaram pela preservação.

Antes:
```wikitext
Campo não elegível na infocaixa e erro de referência independente no corpo.
```
Depois:
```wikitext
Campo preservado e referência corrigida.
```

Cada componente confere seu próprio plano e rascunho. Um campo, modelo ou grupo não comprovado fica preservado sem cancelar correções independentes. O painel relata o que entrou, sem exigir um relatório de recusas para continuar.

### Preservação de conteúdo e referências (SAFE-02)

Compara texto, campos, grupos, referências, células, fórmulas, unidades e destinos para impedir perdas na transformação.

Antes:
```wikitext
Um plano eliminaria parte de uma fonte ou uma célula.
```
Depois:
```wikitext
Esse plano não é aplicado.
```

As verificações são de preservação do código e dos dados. Não verificam a veracidade das afirmações, a qualidade das fontes ou a notoriedade do tema.

### Resultado vinculado ao rascunho (SAFE-03)

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

### Contextos e regiões protegidas (SAFE-04)

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

### Carregador fixo (DIST-01)

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

### Dados conferidos após o salvamento (DIST-02)

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

### Sem edições automáticas na Wikipédia (DIST-03)

As correções ficam no editor até a ação de publicação da pessoa.

Antes:
```wikitext
Ajustar código concluído.
```
Depois:
```wikitext
Rascunho aberto, sem publicação automática.
```

A pré-visualização pode enviar o rascunho para processamento sem salvar uma edição. Não há edições periódicas.

### Catálogo de infocaixas em partes (DIST-04)

Carrega somente as partes necessárias do catálogo de contratos conferidos.

Antes:
```wikitext
Um arquivo único com todos os contratos.
```
Depois:
```wikitext
Infocaixas/parte0001.json e índice conferido em Regras.js.
```

Quem mantém a distribuição instala as partes antes de Regras.js e do programa. O índice, as versões e os hashes continuam sendo conferidos. A chamada fixa do common.js permanece. As partes funcionam tanto em uma página de conteúdo wikitexto preservado quanto no modelo JSON. Como o pré-save do modelo JSON pode reindentar e desescapar strings, sua autenticação usa o conteúdo JSON canônico, sem depender da formatação externa. Código e dados JavaScript continuam exigindo identidade, salvo a quebra de linha terminal.

## Organização do código

### Rodapés biográficos com as chamadas compostas preservadas (RW2222-035)

Rodapés biográficos com as chamadas compostas preservadas

Antes:
```wikitext
Texto.
{{Portal3|Biografias}}
{{NM|1900|1980|Exemplo}}
[[Categoria:Exemplos]]
```
Depois:
```wikitext
Texto.

{{NM|1900|1980|Exemplo}}

{{Portal3|Biografias}}

[[Categoria:Exemplos]]

```

Organiza portais e esboços existentes sem mover NM/NF nem alterar a ordem de classificação das categorias. Rodapés incompletos ou com efeitos incertos permanecem protegidos.

### Coordenadas gerais com variações válidas de display (RW2222-039)

Coordenadas gerais com variações válidas de display

Antes:
```wikitext
{{Coord|1|N|2|E|display=TITLE}}
{{Controle de autoridade}}
{{Portal3|Geografia}}
{{Esboço}}
[[Categoria:Exemplos]]
```
Depois:
```wikitext
{{Controle de autoridade}}

{{Portal3|Geografia}}

{{Esboço}}

{{Coord|1|N|2|E|display=TITLE}}

[[Categoria:Exemplos]]

```

Reconhece diferenças de maiúsculas nos valores nativos já aceitos. Mantém coordenadas explicativas no texto, nas tabelas e nas infocaixas.

### Caixas de projetos irmãos no lugar escolhido (RW2222-052)

Caixas de projetos irmãos no lugar escolhido

Antes:
```wikitext
== Ver também ==
* [[Tema de exemplo]]

== Ligações externas ==
{{Wikiversidade|Curso de exemplo/Unidade introdutória}}
* [https://example.org Recurso de exemplo]
```
Depois:
```wikitext
== Ver também ==
{{Wikiversidade|Curso de exemplo/Unidade introdutória}}

* [[Tema de exemplo]]

== Ligações externas ==

* [https://example.org Recurso de exemplo]
```

Move caixas independentes para Ver também, com as alternativas já definidas quando essa seção não existe. Inclui Wikiversidade, preserva caminhos completos e não arrasta as listas. Converte formas em linha de Commonscat somente quando seus destinos, rótulos e opções mantêm o mesmo efeito.

### Títulos de remissões reconhecidos antes das referências (RW2222-058)

Títulos de remissões reconhecidos antes das referências

Antes:
```wikitext
Texto.<ref>Fonte.</ref>

== Veja também ==
* [[Tema de exemplo]]

{{Referências}}
```
Depois:
```wikitext
Texto.<ref>Fonte.</ref>

== Ver também ==
* [[Tema de exemplo]]

{{Referências}}
```

Normaliza as grafias previstas de Ver também quando a seção contém apenas remissões. Reconhece a chamada de referências como limite da lista e preserva âncoras ou contextos ambíguos.

### No máximo um esboço que já estava no artigo (RW2222-059)

No máximo um esboço que já estava no artigo

Antes:
```wikitext
{{Esboço}}
{{Esboço-astronomia|data=2020}}
{{Esboço-química}}
```
Depois:
```wikitext
{{Esboço-astronomia|data=2020}}

```

Mantém o primeiro esboço específico, com seus parâmetros. Se houver apenas marcas genéricas, mantém a primeira. Não acrescenta esboços a artigos sem essa marca e preserva avisos de seção.

### Um Portal3 sem perder comentários (RW2222-060)

Um Portal3 sem perder comentários

Antes:
```wikitext
{{Portal3|Ciência<!-- comentário A -->}}
<!-- comentário B -->
{{Portal3|História}}
```
Depois:
```wikitext
<!-- comentário A -->
<!-- comentário B -->

{{Portal3|Ciência|História}}

```

Reúne chamadas compatíveis, conserva a ordem dos temas e mantém cada comentário. Não mistura opções conflitantes nem argumentos dinâmicos.

### Fechamento incorreto de uma data biográfica (RW2222-061)

Fechamento incorreto de uma data biográfica

Antes:
```wikitext
'''Pessoa de exemplo''' ({{Dni|1|2|1900]]) é uma pessoa.
```
Depois:
```wikitext
'''Pessoa de exemplo''' ({{Dni|1|2|1900}}) é uma pessoa.
```

Corrige um fechamento inequívoco de uma chamada nativa com data numérica válida. Preserva os parênteses externos e mantém protegidos exemplos, referências e formas ambíguas.

### JavaScript e Lua protegidos também fora da interface (RW2222-076)

JavaScript e Lua protegidos também fora da interface

Antes:
```wikitext
// [[Brasil|Brasil]]
const exemplo="{{Cite web|title=Fonte}}";
```
Depois:
```wikitext
// [[Brasil|Brasil]]
const exemplo="{{Cite web|title=Fonte}}";
```

A API de ajustes preserva integralmente o código quando o tipo declarado não é wikitexto, inclusive em recuperação e processamento em segundo plano. TemplateStyles continua com sua conferência própria de CSS.

### Sintaxe de funções nativas com o espaço no lugar errado (HOLD11)

Sintaxe de funções nativas com o espaço no lugar errado

Antes:
```wikitext
{{#se :1|A|B}}
```
Depois:
```wikitext
{{#se:1|A|B}}
```

Retira apenas o espaço entre o nome de uma função nativa confirmada e os dois-pontos, preservando seus argumentos. Exemplos, noinclude e chamadas dentro de programas desconhecidos permanecem protegidos.

## Portais e categorias

### Portais de Astronomia e Química a partir de esboços específicos (RW2222-036)

Portais de Astronomia e Química a partir de esboços específicos

Antes:
```wikitext
Texto.
{{Esboço-astronomia}}
```
Depois:
```wikitext
Texto.

{{Portal3|Astronomia}}

{{Esboço-astronomia}}

```

Reconhece uma única marca de esboço nativa, sem argumentos, com tema confirmado. Preserva a marca existente e acrescenta o portal apenas se o destino estiver disponível.

### Evita acrescentar um país já coberto pelo portal de uma região (RW2222-037)

Evita acrescentar um país já coberto pelo portal de uma região

Antes:
```wikitext
Texto.

{{Portal3|Califórnia}}

```
Depois:
```wikitext
Texto.

{{Portal3|Califórnia}}

```

A nova cobertura inclui Califórnia, Ontário e Quebec, além das regras anteriores. Não retira países que já estavam no artigo nem aplica relações territoriais históricas ou disputadas.

### Categorias para romances e aberturas de xadrez com comprovação (RW2222-038)

Categorias para romances e aberturas de xadrez com comprovação

Antes:
```wikitext
'''Obra de teste''' é um [[Romance|romance]] publicado em 1950.<ref>{{citar web|url=https://example.org/fonte|título=Fonte}}</ref>

{{Referências}}

```
Depois:
```wikitext
'''Obra de teste''' é um [[romance]] publicado em 1950.<ref>{{citar web|url=https://example.org/fonte|título=Fonte}}</ref>

{{Referências}}

[[Categoria:Romances]]

```

Acrescenta a categoria nativa somente com definição, identidade do assunto, fontes compartilhadas e ausência de categorias confirmadas. Romances também precisam de comprovação de publicação passada. As demais famílias dependem de contratos próprios.

## Páginas de discussão

### Revisão de origem em atribuições parciais (RW2222-073)

Revisão de origem em atribuições parciais

Antes:
```wikitext
{{PD}}
{{Marca de projeto|?}}
{{Traduzido|página=Página de exemplo#Parte|cód_idioma=en|oldid original=[[:en:Special:PermaLink/123#Parte|123]]|data=1 de janeiro de 2020}}
```
Depois:
```wikitext
{{PD}}
{{Marca de projeto|?}}
{{Traduzido|página=Página de exemplo#Parte|cód_idioma=en|data=1 de janeiro de 2020|oldid=123}}
```

Reconhece ligações permanentes interwiki verificadas e preserva página, idioma, seção, revisão, data e comentários. Mantém também o suporte anterior às ligações permanentes externas.

### Estado das fontes no parâmetro que a predefinição lê (RW2222-074)

Estado das fontes no parâmetro que a predefinição lê

Antes:
```wikitext
{{PD}}
{{Marca de projeto|?}}
{{Traduzido|cód_idioma=en|página=Página de exemplo|NT}}
```
Depois:
```wikitext
{{PD}}
{{Marca de projeto|?}}
{{Traduzido|página=Página de exemplo|cód_idioma=en|fontes=NT}}
```

Reposiciona um código V, NV, SEM ou NT que já estava na atribuição, quando não existe conflito. Não inventa verificação de fontes nem interpreta datas ambíguas.

### Cabeçalho de discussão organizado, sem metadados de bot (RW2222-075)

Cabeçalho de discussão organizado, sem metadados de bot

Antes:
```wikitext
{{PD}}
{{Traduzido|página=Página de exemplo|cód_idioma=en|oldid= 123
|data= 1 de janeiro de 2020
}}
{{Marca de projeto|1|Ciência|4|bot=sim|rev=20190101|rev=20260101|Mulheres|4}}
```
Depois:
```wikitext
{{PD}}
{{Marca de projeto|?|Ciência|4|Mulheres|4}}
{{Traduzido|página=Página de exemplo|cód_idioma=en|oldid=123|data=1 de janeiro de 2020}}
```

Mantém PD, Marca de projeto, Traduzido e OKA em linhas separadas, nessa ordem. Remove bot e todas as ocorrências de rev no mesmo bloco com bot, preservando a importância dos projetos. Sem bot, retira apenas datas rev válidas anteriores a 2021. Converte uma marca antiga de projeto somente quando o encaminhamento nativo é equivalente. Preserva também os comentários desses campos, sem transformar seu conteúdo em código ativo.

### Atribuição antiga sem apagar sua função (RW2222-083)

Atribuição antiga sem apagar sua função

Antes:
```wikitext
{{PD}}
{{Marca de projeto|?}}
{{Tradução|página=Página de exemplo|cód_idioma=en|oldid=123}}
```
Depois:
```wikitext
{{PD}}
{{Marca de projeto|?}}
{{Traduzido|página=Página de exemplo|cód_idioma=en|oldid=123}}
```

Padroniza aliases nativos confirmados de Traduzido e conserva todos os dados da origem. Avisos independentes, mensagens humanas, créditos e traduções parciais permanecem distintos.

### Cabeçalho de discussão completo (POST-SCOPE-ARTICLE-TALK-HEADER)

Completa o cabeçalho das discussões de artigos com {{PD}} e uma {{Marca de projeto|?}} quando faltarem, mesmo sem portais no artigo.

Antes:
```wikitext

```
Depois:
```wikitext
{{PD}}
{{Marca de projeto|?}}
```

Apenas discussões completas de artigos no domínio 1, em wikitext e com os ajustes de predefinições ativados. Preserva projetos e avaliações existentes, inclusive o redirecionamento português Marca de projecto, comentários e exemplos. Não acrescenta esta marca às discussões de usuários ou predefinições. A chamada usa ? no campo de qualidade. A própria predefinição da Wikipédia pode então mostrar uma qualidade estimada automaticamente, mesmo sem projetos específicos.

## Texto e sintaxe

### Ortografia com proteção no trecho certo (RW2222-078)

Ortografia com proteção no trecho certo

Antes:
```wikitext
Uma excessão foi registrada.

'''excessão'''
```
Depois:
```wikitext
Uma exceção foi registrada.

'''excessão'''
```

Preserva os próprios nomes, destaques e exemplos, sem usar qualquer negrito posterior como autorização para ignorar a mesma grafia no artigo inteiro. Frases metalinguísticas só liberam uma continuação comum quando a separação é inequívoca.

### Separação de palavras em um contexto confirmado (RW2222-079)

Separação de palavras em um contexto confirmado

Antes:
```wikitext
É um medicamento utilizado parao tratamento da condição.
```
Depois:
```wikitext
É um medicamento utilizado para o tratamento da condição.
```

Corrige a sequência medicamento utilizado parao tratamento para medicamento utilizado para o tratamento em prosa comum. Não aplica uma troca genérica em nomes, citações, referências ou código.

## Interface e resumo

### Reaproveitamento da análise na conclusão (RW2222-012)

Reaproveitamento da análise na conclusão

Antes:
```wikitext
Análise → aplicação → nova reconstrução dos reparos para contar
```
Depois:
```wikitext
Análise → texto e resumo aplicados → contagem residual independente, quando necessária
```

A contagem residual usa apenas os dois textos confirmados, sem reconstruir reparos. O texto e os controles ficam livres antes dela. As verificações de preservação anteriores à aplicação continuam; não há promessa de tempo fixo.

### Mensagem operacional sem atribuição incorreta de 60 segundos (RW2222-055)

Mensagem operacional sem atribuição incorreta de 60 segundos

Antes:
```wikitext
A análise atingiu o limite de 60 segundos.
```
Depois:
```wikitext
A análise não terminou.
```

Não há corte global de 60 segundos no produto. Limites externos dos testes e prazos próprios de requisições não são esse corte.

### Contagem junto do resultado, sem segunda espera obrigatória (RW2222-081)

Contagem junto do resultado, sem segunda espera obrigatória

Antes:
```wikitext
Resultado aplicado → segunda análise de contagem → resumo
```
Depois:
```wikitext
Texto e resumo aplicados; contagem exata em separado quando necessária
```

O número conta componentes efetivamente diferentes nos dois textos confirmados, sem somar propostas recusadas nem blocos da comparação. Se a contagem residual exigir mais trabalho, ela termina em separado sem impedir a edição, a publicação ou o desfazer. Uma resposta desatualizada é descartada.

### Resumo da discussão conforme os cabeçalhos alterados (RW2222-082)

Resumo da discussão conforme os cabeçalhos alterados

Antes:
```wikitext
PD e Marca de projeto alterados no rascunho
```
Depois:
```wikitext
{{PD}}{{Marca de projeto}}
```

Usa a revisão exata carregada para detectar atribuição acrescentada antes do clique. Conserva resumo manual, prefixo da seção e alterações manuais ao desfazer.

### Vigiar página após o ajuste (UI-WATCH-01)

Vigiar página após o ajuste

Antes:
```wikitext
Vigiar página: desmarcado
```
Depois:
```wikitext
Vigiar página: marcado
```

Marca a caixa nativa habilitada ao concluir Ajustar código, mesmo sem mudanças no texto. Conserva uma caixa já marcada. Cancelamento, resultado desatualizado ou recusado não marcam a caixa; desfazer o texto não a desmarca. Não envia ação de vigilância nem publica.
