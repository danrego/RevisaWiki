# Conferência da origem de uma seção durante conflito

Consultado em 15 de outubro de 2026, somente por leitura. Nenhuma edição ou consulta de token foi realizada.

No código público do MediaWiki 1.45.1, `ApiEditPage` transfere `baserevid` para `editRevId`, `basetimestamp` para `wpEdittime` e o identificador da seção para `wpSection`. `EditPage` confere ID e timestamp da revisão atual. Se houver diferença, recompõe a seção na revisão de origem por `replaceSectionAtRev`, usando `editRevId`, antes de tentar a mesclagem. Isso evita aplicar diretamente o texto à mesma posição numérica de uma revisão mais recente.

A implementação do RevisaWiki mantém esses campos fixos. Também confere a revisão por leitura imediatamente antes do envio e não tenta uma nova base por conta própria. A conferência da implementação pública do MediaWiki não substitui os testes locais de conflitos da versão.

Fontes primárias:

- https://doc.wikimedia.org/mediawiki-core/1.45.1/php/ApiEditPage_8php_source.html#l00384
- https://doc.wikimedia.org/mediawiki-core/1.45.1/php/EditPage_8php_source.html#l02317
