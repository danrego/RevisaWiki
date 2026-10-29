# RevisaWiki 2.21.4

O botão Ajustar código reúne as correções no rascunho, com Mostrar alterações, Desfazer ajustes e Opções de ajuste no painel. O resumo padrão é Minúcias. A marcação de edição menor respeita a opção desligada e as escolhas manuais.

O quadro abaixo conserva os 76 itens do plano da 2.21.2. Ele distingue as regras ativas das propostas condicionais e não representa uma contagem de todos os recursos da ferramenta. Os limites ficam em [coverage_all.json](../../tests/v2212/coverage_all.json).

## Correções independentes e interface

- A primeira tentativa usa os ajustes selecionados. Se a combinação não passar pelas verificações, o programa pode tentar grupos menores sobre o mesmo rascunho original.
- As tentativas nunca reaproveitam uma saída recusada nem mudam as preferências salvas. O prazo de 60 segundos é compartilhado, sem reiniciar a cada grupo.
- Cada resultado mantém as verificações de conteúdo, referências e sintaxe. Uma recusa confirmada na pré-visualização não pode ser desfeita por uma falha posterior da consulta.
- O painel mostra apenas os ajustes efetivamente aplicados, sua contagem e a diferença em bytes, com Desfazer ajustes e Mostrar alterações do próprio editor.
- Se nada for aplicado, a mensagem é "Nenhuma alteração automática aplicada.". A interface não lista problemas pendentes, sugestões ou motivos de recusa.
- Cancelamento, timeout, mudança do rascunho e falhas operacionais continuam tendo mensagens curtas. Nenhuma resposta antiga pode sobrescrever uma edição posterior.
- Os controles novos comparam nomes literais únicos nos campos de identidade previstos e valores literais de células em posições correspondentes. Não substituem as proteções anteriores para conteúdo complexo ou estruturas diferentes.
- A conversão de um campo ignorado de infocaixa não pode ativar uma referência sem um coletor seguinte do grupo correto, nos casos cobertos pela regra.
- Em referências nomeadas com comentários, planos já previstos de cabeçalho e data podem ser reconhecidos sem alterar o comentário ou os demais argumentos bibliográficos.

## Compatibilidade biográfica mantida

- Campos atuais da Info/Biografia e nomes alternativos conferidos no código nativo.
- Primeiro valor não vazio preservado, inclusive em conflitos de local de nascimento, profissão, tamanho ou legenda.
- Batismo separado de nascimento, gênero literário separado de dados pessoais e campos de trabalho e sepultamento com seus significados próprios.
- Caixas filhas compatíveis sem duplicar a infocaixa externa nem fornecer dados à introdução como se fossem outra pessoa.
- Módulos na sequência `módulo`, `módulo2` até `módulo6`, sem `módulo1`.
- Remoção estrita de `fundo` vazio ou com o valor literal `instrumentista_sem_vocal` na chamada direta de Info/Biografia.
- Correção de `180pxpx` em campo de tamanho aceito, sem valores concorrentes ou marcação adicional.
- Destino local de Ficha de persona atualizado, com conversão conjunta de `nombre` para `nome` apenas para um nome literal único e sem conflito.
- Ajustes independentes preservados quando uma chamada ou um campo não pode ser convertido.

Essas regras não preenchem fatos nem impõem uma migração geral de infocaixas. Uma combinação de caixas precisa conservar seus campos e a estrutura nativa.

## Itens do plano

| ID | Ajuste | Estado |
| --- | --- | --- |
| PORTAL-R2-01 | Obras literárias em Info/Livro | Regra ativa, com limites |
| PORTAL-R2-02 | Álbuns musicais em Info/Álbum | Regra ativa, com limites |
| PORTAL-R2-03 | Universidades e instituições de ensino superior | Regra ativa, com limites |
| PORTAL-R2-04 | Redes, canais e emissoras de televisão | Regra ativa, com limites |
| PORTAL-R2-05 | Jornais em Info/Jornal | Regra ativa, com limites |
| PORTAL-R2-06 | Municípios em caixas geográficas nativas | Regra ativa, com limites |
| PORTAL-R2-07 | Rios em Info/Rio | Regra ativa, com limites |
| PORTAL-R2-08 | Ilhas e atóis em Info/Ilha | Regra ativa, com limites |
| PORTAL-R2-09 | Batalhas e conflitos militares | Regra ativa, com limites |
| PORTAL-R2-10 | Software em caixa específica | Regra ativa, com limites |
| PORTAL-R2-11 | Clubes de futebol | Regra ativa, com limites |
| PORTAL-R2-12 | Profissão militar em caixa biográfica própria | Regra ativa, com limites |
| PORTAL-R2-13 | Artistas em caixa biográfica própria | Regra ativa, com limites |
| PORTAL-R2-14 | Revistas científicas | Regra ativa, com limites |
| PORTAL-R2-15 | Computadores e estações de trabalho | Regra ativa, com limites |
| PORTAL-R2-16 | Automóveis em caixa específica | Regra ativa, com limites |
| PORTAL-R2-17 | Moedas em Info/Moeda | Regra ativa, com limites |
| PORTAL-R2-18 | Estádios e instalações esportivas tipadas | Regra ativa, com limites |
| PORTAL-R2-19 | Partidos políticos | Regra ativa, com limites |
| PORTAL-R2-20 | Eventos meteorológicos | Regra ativa, com limites |
| PORTAL-R2-21 | Cerveja e cervejarias tipadas | Regra ativa, com limites |
| PORTAL-R2-22 | Veículos de lançamento espacial | Regra ativa, com limites |
| PORTAL-R2-23 | Sinônimos nativos de formato televisivo | Regra ativa, com limites |
| PORTAL-R2-24 | País explícito por bandeira nativa | Condicional, inativo |
| PORTAL-R2-25 | Argumentos estrangeiros com destino português confirmado | Regra ativa, com limites |
| PORTAL-R2-26 | Disciplinas no campo aceito de cientistas | Regra ativa, com limites |
| PORTAL-R2-27 | Grupos e bandas sem tratá-los como pessoas | Regra ativa, com limites |
| PORTAL-R2-28 | Portais isolados antes de seções finais | Regra ativa, com limites |
| PORTAL-R2-29 | Pessoa comprovada em caixa musical compartilhada | Condicional, inativo |
| IMP-01 | Recuperar marca de falta de fontes importada como cn | Regra ativa, com limites |
| IMP-02 | Fazer o motivo de Clarify chegar à dica de esclarecimento | Regra ativa, com limites |
| IMP-03 | Recuperar imagens copiadas como URL de página de ficheiro | Regra ativa, com limites |
| IMP-04 | Reparar ligação híbrida Markdown com o mesmo URL duplicado | Regra ativa, com limites |
| IMP-05 | Aplicar a correção de colchetes de URL dentro de referência na infocaixa | Regra ativa, com limites |
| IMP-06 | Corrigir widht na Imagem múltipla | Regra ativa, com limites |
| IMP-07 | Exibir nome completo em Info/Artista | Regra ativa, com limites |
| IMP-08 | Corrigir dimensão de logo em Info/Hotel | Regra ativa, com limites |
| IMP-09 | Estudar legenda em Info/Museu quando houver imagem | Condicional, inativo |
| IMP-10 | Usar os campos de legenda e área da Info/Disciplina | Regra ativa, com limites |
| IMP-11 | Completar o nome truncado do ano de evento posterior | Regra ativa, com limites |
| IMP-12 | Corrigir a chave híbrida do sufixo ATC em Info/Droga | Regra ativa, com limites |
| R2-REF-01 | Recuperar o primeiro pipe ausente em chamada de citação | Regra ativa, com limites |
| R2-REF-02 | Retirar rótulo de data copiado para o valor do campo | Regra ativa, com limites |
| R2-REF-03 | Cobrir parâmetros de citação literalmente duplicados e idênticos | Regra ativa, com limites |
| R2-REF-04 | Ampliar o perfil de aliases explicitamente obsoletos de CS1 | Regra ativa, com limites |
| R2-REF-05 | Recuperar campos portugueses ignorados em modelo legado de notas de álbum | Regra ativa, com limites |
| R2-REF-06 | Acrescentar o contrato de coletores upper-alpha à normalização | Regra ativa, com limites |
| R2-REF-C01 | Cite letter para Citar carta com composição de formato e data | Condicional, inativo |
| R2-REF-C02 | Coletor lower-greek possivelmente sem produtores correspondentes | Condicional, inativo |
| R2-REF-C03 | Expandir uma referência legada Cite pmid a partir do registro exato | Condicional, inativo |
| ROOT-R2-01 | Recuperar ligação externa misturada com uma chamada Wayback | Condicional, inativo |
| PORTAL-STUB-01 | Portais a partir de esboços temáticos nativos com classificação concordante | Regra ativa, com limites |
| PAR-R3-01 | Chave de acesso inválida quando o valor já está correto | Regra ativa, com limites |
| PAR-R3-02 | Datas de acesso em referências dentro de imagens e infocaixas | Regra ativa, com limites |
| PAR-R3-03 | URL e data de arquivo traduzidos dentro da infocaixa | Regra ativa, com limites |
| PAR-R3-04 | Número da edição em referência da infocaixa | Regra ativa, com limites |
| PAR-R3-05 | Ano original bloqueado por proteção de contexto | Condicional, inativo |
| PAR-R3-06 | Localizadores bibliográficos além de um parágrafo simples | Regra ativa, com limites |
| PAR-R3-07 | Identificador de artigo sem fingir uma contagem de páginas | Condicional, inativo |
| PAR-R3-08 | Importação italiana parcialmente adaptada | Regra ativa, com limites |
| PAR-R3-09 | Ligação anônima que repete exatamente o título existente | Regra ativa, com limites |
| PAR-R3-10 | Helper arXiv usado como argumento anônimo de citação | Regra ativa, com limites |
| R3-VAL-01 | Ponto final anexado a um ISBN válido | Regra ativa, com limites |
| R3-VAL-02 | Mesmo ISBN repetido dentro de um único valor | Regra ativa, com limites |
| R3-VAL-03 | Preservar ISBN-10 e13 equivalentes em sintaxe aceita | Regra ativa, com limites |
| R3-VAL-04 | Marcador de direção fora da borda de URL literal | Regra ativa, com limites |
| R3-VAL-05 | Data de arquivo explícita no carimbo da captura | Regra ativa, com limites |
| R3-VAL-06 | Uma barra ausente no esquema HTTPS | Condicional, inativo |
| R3-GRAPH-01 | Corrigir delimitadores duplicados em nome de referência | Regra ativa, com limites |
| R3-GRAPH-02 | Transformar nota com referência interna em invólucro nativo | Regra ativa, com limites |
| R3-GRAPH-03 | Recuperar aspa ausente que faz o analisador isolar a infocaixa | Regra ativa, com limites |
| R3-GRAPH-04 | Separar definições completas conflitantes em regiões diferentes | Condicional, inativo |
| R3-GRAPH-C01 | Recuperar helper Harvard francês ausente | Condicional, inativo |
| R3-GRAPH-C02 | Migrar par antigo de nota manual para coletor nativo | Condicional, inativo |
| REF3-LOCAL-01 | Recuperar título ausente de outra citação literal e compatível no mesmo artigo | Regra ativa, com limites |
| REF3-LUA-01 | Contornar falha Lua nos aliases nativos vautores e veditores | Regra ativa, com limites |

## Recursos mantidos

- Correções de citações e nomes de parâmetros conforme o consumidor nativo.
- Referências e notas com preservação de grupos, corpos e ligações entre chamadas e fontes.
- Mapas específicos para infocaixas, datas biográficas, imagens e endereços.
- Reparos delimitados de tabelas, ligações, espaços e resíduos de tradução.
- Duas colunas nas listas simples finais a partir de oito itens principais, com regra própria para referências.
- Preparação de PD e marcas de projeto na discussão de artigos.
- Opções individuais, restauração do rascunho e conferência de respostas antigas antes de aplicar mudanças.

## Conferência da versão

O relatório técnico no GitHub reúne os comprovantes dos arquivos exatos, a regressão, os navegadores e a transformação pré-salvamento. Esse registro de desenvolvimento não é um painel do editor. O limite de 60 segundos e as verificações de preservação não foram retirados. O programa não publica edições na Wikipédia.

