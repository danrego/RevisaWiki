RevisaWiki 2.3.0: testes locais em 2.000 artigos

Nenhum programa desta pasta publica edições, envia mensagens ou usa a conta do
usuário. Os testes leem revisões locais congeladas. A coleta pública anônima
fica em ../corpus_collection, e não faz parte da execução dos testes.

Fontes

O corpus novo contém 1.000 artigos distintos do domínio principal da ptwiki,
todos com mais de 102.400 bytes UTF-8. Não há sobreposição de títulos, pageids
ou oldids com os 1.000 artigos do corpus anterior. O manifesto novo e os
arquivos completos ficam em ../corpus_new. O anterior fica em
../../revisawiki_v2_1/corpus. Cada entrada tem oldid, data, tamanho e SHA-256.
As fontes não são modificadas pelos testes. validate_corpus.py, na pasta de
coleta, verifica essas identidades sem importar o RevisaWiki.

Os dois lotes usam authorityControl=false e endTemplateOrder=false, domínio
principal e minorBaseConfirmed=false. A validação é local, sem consulta a
Wikidata ou confirmação da revisão aberta no editor. Os outros caminhos têm
testes próprios na entrega, fora deste conjunto de corpus.

Etapas e contagem

release_001 é um diagnóstico parcial antigo. Não deve ser apresentado como
uma execução completa de 2.000 artigos.

release_final_001 é a primeira execução completa dos dois corpora. Cada artigo
passa pelas distribuições modular e completa, com cálculo, segunda aplicação,
auditoria de conservação, referências, sintaxe, limite do cache, contabilização
de bytes, marcação de edição menor e equivalência das distribuições. Foram
48.000 verificações, com 1.994 aprovações e seis falhas brutas. Três artigos
expuseram problemas corrigidos em refPunctuation, normalizeLists e
referenceColumnPlans. As outras três falhas eram avisos conservadores sobre
mudanças anteriores de apresentação ou de escrita de URL/ISBN. Os relatórios
originais permanecem intactos, incluindo suas falhas.

final_revalidation_001 executa o código final sobre todas as 2.000 fontes,
nas duas distribuições, e repete a aplicação para conferir estabilidade.
O programa valida seis substituições exatas em três funções. Todo o restante
do código e o arquivo de dados precisam ser idênticos ao snapshot anterior.
Só reutiliza a auditoria anterior se fonte, resultado e lista de ajustes forem
exatamente iguais e a auditoria anterior tiver sido aprovada. Saídas alteradas
ou casos que falharam recebem uma auditoria completa com o código final.

O relatório separa verificações novas e provas reutilizadas. As 48.000
verificações anteriores não são somadas como se tivessem sido executadas
outra vez. O resumo final fica em final_revalidation_001/summary.json. Todos
os resultados por artigo ficam em combined_results.json e nos quatro shards.

Avisos de conservação

qualified_source_warnings.json contém apenas cinco revisões exatas, com
SHA-256 da entrada, lista exata de avisos e provas independentes. Quatro casos
também têm SHA-256 esperado da saída. Os avisos continuam visíveis no programa.
Esta lista não libera genericamente perdas de palavras, URLs ou identificadores.
Ela explica casos de opções de imagem, namespace, prefixo duplicado de URL
e prefixo ISBN. Os arquivos de prova são verificados pelo agregador final.

Verificações independentes

independent_source_guards.py não importa o RevisaWiki. Em cada saída final,
confere imagens, categorias, destinos de ligações, URLs, blocos literais,
fórmulas e identificadores de publicações. Admite somente os nomes equivalentes
documentados no arquivo e dois reparos de URL/ISBN vinculados a hashes exatos.
Informa separadamente se a escrita literal da URL ou do identificador mudou.

independent_table_data.py compara as tabelas com outro leitor de wikitexto.
Tabelas aninhadas e partes que não consegue interpretar continuam explícitas
como não resolvidas. Um valor achatado pode diferir por apresentação mesmo
sem perda de dados. Por isso os diagnósticos brutos permanecem no relatório.
probe_table_presentations.cjs compara os nove casos com a versão 2.2.1.
A igualdade com uma versão anterior informa a origem da mudança, mas não é
usada como autorização genérica para ignorar perdas de conteúdo.

Como reproduzir

É necessário Node.js e Python 3, sem pacotes adicionais. Execute a partir da
raiz deste projeto. Cada execução exige um nome novo e recusa sobrescrever
evidência existente. Para repetir a validação final, mantenha os relatórios e
snapshots anteriores, pois os hashes são conferidos antes da reutilização.

  node work/revisawiki_v2_3/corpus_qa/run_parallel.cjs NOVA_EXECUCAO
  python3 work/revisawiki_v2_3/corpus_qa/aggregate_results.py NOVA_EXECUCAO

A comparação final desta entrega usa o snapshot release_final_001 definido
em approved_code_delta.json:

  node work/revisawiki_v2_3/corpus_qa/run_revalidation_parallel.cjs NOVA_FINAL release_final_001
  python3 work/revisawiki_v2_3/corpus_qa/aggregate_revalidation.py NOVA_FINAL
  python3 work/revisawiki_v2_3/corpus_qa/independent_source_guards.py NOVA_FINAL
  python3 work/revisawiki_v2_3/corpus_qa/independent_table_data.py NOVA_FINAL
  node work/revisawiki_v2_3/corpus_qa/probe_table_presentations.cjs NOVA_FINAL

Os testes de interface e dos navegadores ficam em outras pastas da entrega.
Uma execução Node local não comprova o comportamento da interface no Firefox,
Safari ou Chrome, nem o resultado de todas as expansões de predefinições da wiki.
