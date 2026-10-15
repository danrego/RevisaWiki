# Evidências da 2.3.0

Os relatórios identificam revisões, fontes, distribuições e saídas por SHA-256. Os dois relatórios completos do corpus estão em JSON comprimido com gzip, com hashes do arquivo e do conteúdo em `compressed_corpus_evidence.json`. A primeira execução encontrou seis casos que foram corrigidos ou receberam provas de conservação específicas antes da revalidação final. Os avisos continuam ativos no programa.

As auditorias reaproveitadas exigem fontes, saídas e relatórios de alterações idênticos, além da comparação estrita das seis substituições de código permitidas. Cada fonte foi processada de novo nas distribuições finais, com segunda aplicação para verificar estabilidade. As fontes modificadas e os casos antes reprovados receberam auditoria integral nova.

O parser independente de tabelas mantém seus diagnósticos brutos de apresentação. Eles não são perdas de dados demonstradas nem foram apagados para produzir um resultado sem avisos. As provas específicas e o relatório de conservação permitem conferir cada caso.

As fontes originais dos 2.000 artigos não integram o GitHub. Os manifestos e o reprodutor GET anônimo em `tests/corpus` permitem reconstruí-las. Use `tests/corpus/README.txt` para os comandos portáteis. `corpus_README.txt` é o registro original do ambiente de trabalho e conserva seus caminhos de origem. Código e evidências não contêm sessão nem credenciais de conta. Nenhuma edição ou publicação foi feita na Wikipédia.
