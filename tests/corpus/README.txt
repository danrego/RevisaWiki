O novo manifesto identifica 1.000 revisões distintas acima de 102.400 bytes. O antigo identifica as outras 1.000 revisões da regressão. Os dois conjuntos não têm títulos ou oldids repetidos entre si. Títulos, datas, tamanhos, hashes e atribuição permanecem nos manifestos.

Na raiz do repositório, para reconstruir os arquivos congelados:
python3 tests/corpus/fetch_fixed_revisions.py --manifest tests/corpus/new_manifest.json --destination tests/corpus/inputs/new
python3 tests/corpus/fetch_fixed_revisions.py --manifest tests/corpus/old_manifest.json --destination tests/corpus/inputs/old

O reprodutor copia manifest.json para cada destino e verifica o tamanho e o SHA-256 de cada fonte. Usa somente HTTPS GET público e anônimo, com validação de certificado, ritmo limitado e retomada. Não publica nada.

Depois, execute:
node tests/corpus/run_dual_corpus.cjs --run=local_2000

Para dividir o trabalho, use nomes distintos de --run, --stride=4 e --start=0 a 3. O harness recusa sobrescrever evidências anteriores. Cada parte copia a distribuição antes de começar. Os cinco casos de avisos de preservação qualificados exigem fonte, revisão, hash e avisos exatos. As provas incluídas explicam cada caso. Os avisos permanecem visíveis no produto, sem permissão geral para retirar prosa, referências ou endereços. As provas ficam em tests/evidence/2.3.0.

Textos da Wikipédia, CC BY-SA, com atribuição pelos links permanentes e históricos dos artigos. Este corpus é somente material de teste.

Auditorias independentes, sem importar o código do RevisaWiki:
Após executar os quatro shards local_2000_part0 até local_2000_part3, com --start=0 a 3 e --stride=4, crie tests/corpus/local_2000. Execute:
python3 tests/corpus/independent_source_guards.py local_2000
python3 tests/corpus/independent_table_data.py local_2000

O primeiro verifica destinos, URLs, identificadores e blocos literais. O segundo compara dados e apresentação das tabelas. Seus diagnósticos brutos precisam ser conferidos, e não significam automaticamente perda de conteúdo. As evidências completas da entrega estão em tests/evidence/2.3.0.
