# Testes da 2.11.0, distribuição r2

Os testes executam os arquivos identificados em `tests/expected_release_v2110.json`. As revisões de origem têm URLs permanentes, hashes e indicação de licença nos manifestos. Os casos sintéticos não são contados como artigos distintos.

```sh
node tests/v2110/run_all.cjs
node tests/v2110/run_engine.cjs --complex
node tests/v2110/run_reference_column_geometry.cjs Chrome --bind-release
node tests/v2110/run_reference_column_geometry.cjs Firefox --bind-release
node tests/v2110/run_reference_column_geometry.cjs Safari --bind-release
node tests/v2110/browser/run_release.cjs Chrome dist/2.11.0
node tests/v2110/browser/run_release.cjs Firefox dist/2.11.0
node tests/v2110/browser/run_release.cjs Safari dist/2.11.0
```

Os navegadores precisam dos controladores e dependências locais descritos no guia técnico das versões anteriores. Os testes abrem páginas locais, com respostas públicas guardadas ou simuladas. Eles não usam uma conta da Wikipédia, não enviam edições, não acessam a área de transferência e não produzem capturas de tela.

Os novos contratos cobrem portais, países e modalidades, formatos de obras, campos taxonômicos, perfis de saúde, edição menor, contagem individual e estado dos botões. A distribuição r2 também verifica o mínimo de dez entradas por lista, a geometria das colunas em três navegadores, a prova pública de fotografia e o diagnóstico do aviso visual de tamanho. Há controles para conflitos, nomes desconhecidos, campos calculados, caixas repetidas, textos protegidos, alterações manuais e falhas de processamento.

`ADAPTATION_PROVENANCE.json` conserva os hashes dos testes anteriores e registra as substituições de versão e adaptações declaradas. As provas nativas guardadas mantêm as fontes e são verificadas de novo contra a distribuição atual. Isso não equivale a novas consultas online nem a uma auditoria visual completa em produção.

Os resultados finais, separados dos logs de desenvolvimento, ficam em `tests/evidence/2.11.0`. Os relatórios indicam os arquivos executados por SHA-256. As medições de desempenho são locais e não demonstram o tempo de execução em todo computador ou artigo.
