# Testes da 2.11.1

Os arquivos executados ficam vinculados ao manifesto `tests/expected_release_v2111.json`. A reconstrução usa a distribuição 2.11.0 r2, sem modificar os arquivos antigos. `ADAPTATION_PROVENANCE.json` registra cada adaptação dos testes herdados. As revisões públicas e as respostas nativas mantêm seus hashes e datas de origem.

## Referências desta versão

- `graph_test.cjs` verifica estilos literais, chamadas nativas sem referências, conflitos de nomes, grupos e controles de chamadas indiretas.
- `citation_fields.cjs` verifica a migração de publicação e a correção do endereço comprovado, incluindo conflitos entre campos, metadados alterados e contextos protegidos.
- `test_warning_identity.cjs` confere um aviso por problema, com preservação de conflitos em grupos diferentes.
- `independent_reference_qa.cjs` compara o artigo inteiro com um resultado escrito separadamente, sem usar o transformador para gerar a expectativa.
- `browser/v2111_reference_flow.cjs` executa o artigo e os controles negativos no Worker real, nas distribuições modular e completa, com segunda análise e desfazer.

O artigo inteiro é conferido por conservação lexical das 82 referências e dos demais dados. As consultas anônimas de análise nativa usam pequenas projeções de referências, com essa limitação indicada nos relatórios. A prova do endereço verifica as duas respostas HTTP, TLS, destino canônico e título. Nenhuma consulta salva páginas.

Os testes executam os arquivos identificados em `tests/expected_release_v2111.json`. As revisões de origem têm URLs permanentes, hashes e indicação de licença nos manifestos. Os casos sintéticos não são contados como artigos distintos.

```sh
node tests/v2111/run_all.cjs
node tests/v2111/run_engine.cjs --complex
node tests/v2111/run_reference_column_geometry.cjs Chrome --bind-release
node tests/v2111/run_reference_column_geometry.cjs Firefox --bind-release
node tests/v2111/run_reference_column_geometry.cjs Safari --bind-release
node tests/v2111/browser/run_release.cjs Chrome dist/2.11.1
node tests/v2111/browser/run_release.cjs Firefox dist/2.11.1
node tests/v2111/browser/run_release.cjs Safari dist/2.11.1
```

Os navegadores precisam dos controladores e dependências locais descritos no guia técnico das versões anteriores. Os testes abrem páginas locais, com respostas públicas guardadas ou simuladas. Eles não usam uma conta da Wikipédia, não enviam edições, não acessam a área de transferência e não produzem capturas de tela.

Os testes herdados cobrem portais, países e modalidades, formatos de obras, campos taxonômicos, perfis de saúde, edição menor, contagem individual e estado dos botões. Os testes herdados também verificam o mínimo de dez entradas por lista, a geometria das colunas em três navegadores, a prova pública de fotografia e o diagnóstico do aviso visual de tamanho. Há controles para conflitos, nomes desconhecidos, campos calculados, caixas repetidas, textos protegidos, alterações manuais e falhas de processamento.

`ADAPTATION_PROVENANCE.json` conserva os hashes dos testes anteriores e registra as substituições de versão e adaptações declaradas. As provas nativas guardadas mantêm as fontes e são verificadas de novo contra a distribuição atual. Isso não equivale a novas consultas online nem a uma auditoria visual completa em produção.

Os resultados finais, separados dos logs de desenvolvimento, ficam em `tests/evidence/2.11.1`. Os relatórios indicam os arquivos executados por SHA-256. As medições de desempenho são locais e não demonstram o tempo de execução em todo computador ou artigo.
