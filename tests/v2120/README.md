# Testes da 2.12.0

Os arquivos executados ficam vinculados ao manifesto `tests/expected_release_v2120.json`. A reconstrução usa a distribuição 2.11.1, sem modificar os arquivos antigos. `ADAPTATION_PROVENANCE.json` registra cada adaptação dos testes herdados. As revisões públicas e as respostas nativas mantêm seus hashes e datas de origem.

## Reparos desta versão

- `reference_fields.cjs` cobre os quatro reparos de parâmetros e coletores, com preservação, composição, segunda análise e classificação de edição menor.
- `reference_native_contract.cjs` verifica as respostas nativas capturadas, as famílias de campos e a conservação do conteúdo das fontes.
- `table_safe_expansions.cjs` cobre números formatados, atributos de ordenação, aspas de expansão de células e contêineres de rolagem para larguras fixas. Inclui tabelas acima de 100 KB e controles para mutações de células e chaves de ordenação.
- `test_count_boundaries_v212.cjs` verifica a contagem de separadores vazios e de contêineres, mantendo correções internas separadas.
- `independent_cases.cjs` compara os oito resultados com expectativas escritas separadamente.
- `browser/v212_safe_fixes_flow.cjs` executa os oito reparos e dois controles ambíguos no Worker real, nas distribuições modular e completa, com comparação, segunda análise e desfazer.

As consultas nativas usam GET anônimo e pequenas projeções, sem salvar páginas. As fontes e respostas capturadas ficam vinculadas por hash. As projeções não equivalem à análise nativa de um artigo inteiro.

Os testes executam os arquivos identificados em `tests/expected_release_v2120.json`. As revisões de origem têm URLs permanentes, hashes e indicação de licença nos manifestos. Os casos sintéticos não são contados como artigos distintos.

```sh
node tests/v2120/run_all.cjs
node tests/v2120/run_engine.cjs --complex
node tests/v2120/run_reference_column_geometry.cjs Chrome --bind-release
node tests/v2120/run_reference_column_geometry.cjs Firefox --bind-release
node tests/v2120/run_reference_column_geometry.cjs Safari --bind-release
node tests/v2120/browser/run_release.cjs Chrome dist/2.12.0
node tests/v2120/browser/run_release.cjs Firefox dist/2.12.0
node tests/v2120/browser/run_release.cjs Safari dist/2.12.0
```

Os navegadores precisam dos controladores e dependências locais descritos no guia técnico das versões anteriores. Os testes abrem páginas locais, com respostas públicas guardadas ou simuladas. Eles não usam uma conta da Wikipédia, não enviam edições, não acessam a área de transferência e não produzem capturas de tela.

Os testes herdados cobrem portais, países e modalidades, formatos de obras, campos taxonômicos, perfis de saúde, edição menor, contagem individual e estado dos botões. Os testes herdados também verificam o mínimo de dez entradas por lista, a geometria das colunas em três navegadores, a prova pública de fotografia e o diagnóstico do aviso visual de tamanho. Há controles para conflitos, nomes desconhecidos, campos calculados, caixas repetidas, textos protegidos, alterações manuais e falhas de processamento.

`ADAPTATION_PROVENANCE.json` conserva os hashes dos testes anteriores e registra as substituições de versão e adaptações declaradas. As provas nativas guardadas mantêm as fontes e são verificadas de novo contra a distribuição atual. Isso não equivale a novas consultas online nem a uma auditoria visual completa em produção.

Os resultados finais, separados dos logs de desenvolvimento, ficam em `tests/evidence/2.12.0`. Os relatórios indicam os arquivos executados por SHA-256. As medições de desempenho são locais e não demonstram o tempo de execução em todo computador ou artigo.
