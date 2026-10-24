# Evidências da versão 2.21.0

Os registros deste diretório separam os testes do programa, a verificação dos métodos de análise e a conferência da entrega. Um teste do método não equivale a uma análise de artigo. Os conjuntos podem compartilhar casos, por isso suas contagens não devem ser somadas como se fossem artigos distintos.

| Registro | O que documenta |
| --- | --- |
| `COVERAGE.json` | Os 144 itens aprovados, suas decisões e os arquivos de código aos quais se referem. Uma decisão de estudo ou preservação não é uma correção automática. |
| `BIOGRAPHY_VALIDATION.json` | Casos de biografias executados nos motores separado e completo, com controles de preservação. |
| `BIOGRAPHY_EMPTY_DESTINATION_QUALIFICATION.json` | Conferência específica de campos vazios, incluindo reparos adicionais aceitos pelo renderizador. |
| `BIOGRAPHY_UI_VALIDATION.json` | Fluxos da interface de uma rodada anterior, com os hashes originais do programa e páginas locais. Não substitui o agregado atual dos navegadores. |
| `CITATION_VALIDATION.json` | Validação preliminar de referências e composição, vinculada à versão do programa indicada no próprio registro. |
| `structure_summary.json` | Validação de estrutura e sintaxe, com limites e resultados de timeout discriminados. |
| `legacy_summary.json` | Execução das suítes anteriores, preservando as falhas brutas e as qualificações independentes das divergências. |
| `DEMONSTRATION_VALIDATION.json` | Exemplos e execução da demonstração em uma rodada anterior, com os hashes e resultados originais. |
| `CURRENT_RUNTIME18_NATIVE_BROWSER_QUALIFICATION.json` | Agregado atual de interface e demonstração nos três navegadores, vinculado ao código final examinado. Confirma esse escopo, sem aprovar a campanha inteira. |
| `INDEPENDENT_OBSERVER_METHOD_VALIDATION.json` | Controles do analisador independente de referências, tabelas, trechos protegidos, imagens e categorias. |
| `SCIENTIFIC_OBSERVER_METHOD_VALIDATION.json` | Controles da conferência adicional de fórmulas e chamadas científicas. |
| `INITIAL_REFERENCE_AMBIGUITY_ADJUDICATION.json` | Conferência individual do primeiro lote de resultados ambíguos, sem reclassificar os registros brutos. |
| `ADDITIONAL_REFERENCE_CONTEXT_QUALIFICATIONS.json` | Dois contextos de referências em infocaixas, com entradas e respostas de renderização vinculadas e revisão independente. |
| `INHERITED_CITATION_RESTORATION_QUALIFICATION.json` | Um reparo histórico cujos arquivos completos de entrada e saída continuam idênticos aos já qualificados, com conferência atual de cada referência. A prova nativa antiga não conta como nova execução. |
| `PUBLIC_RELEASE_READER_VALIDATION.json` | Contrato dos arquivos de entrega com o leitor do WikiManager, incluindo rejeição de arquivos incorretos. |

O arquivo `tests/v221/citation_evidence_summary.json` conserva um registro preliminar produzido durante o desenvolvimento. O relatório final `QA_SUMMARY.json` identifica as provas que correspondem ao código distribuído e separa os registros anteriores. Os resultados anteriores permanecem preservados com suas versões e seus estados originais.

Os testes de navegador usam o programa real em páginas locais, com respostas de API e componentes de edição preparados para teste. Eles não comprovam uma edição no editor público. As verificações de renderização usam a instalação local do MediaWiki e distinguem dependências ausentes de erros no artigo.

Uma qualificação independente explica uma divergência para os arquivos exatos examinados. Ela não transforma uma falha bruta em um teste originalmente aprovado, nem autoriza ignorar divergências semelhantes em outros arquivos. As limitações de cada método ficam nos seus respectivos registros.

Os dados completos dos artigos, os caminhos locais e os registros privados da campanha não fazem parte da distribuição pública. Nenhum destes testes publica uma edição na Wikipédia.
