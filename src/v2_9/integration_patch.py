"""Wire 2.9 rules into existing source-bound stages and retention guards."""


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Shared 2.9 integration anchor is absent or repeated: ' + before[:80])
    return source.replace(before, after, 1)


def apply(source):
    source = replace(source, ' * Também retira cercas externas de Markdown e marcas exatas de',
                     ' * Em referências completas, reutiliza fontes idênticas com um nome\n'
                     ' * existente, retira chamadas repetidas no mesmo ponto e etiquetas\n'
                     ' * vazias sem nome, e corrige um fechamento repetido confirmado.\n'
                     ' * Em tabelas literais, retira atributos idênticos repetidos, corrige\n'
                     ' * uma aspa extra em extensões numéricas e acrescenta escopos em\n'
                     ' * cabeçalhos simples de dois níveis. URLs oficiais em campos de\n'
                     ' * identificadores PMC e arXiv viram o identificador que já contêm.\n'
                     ' * Casos incertos permanecem como estão, sem novos avisos.\n *\n'
                     ' * Também retira cercas externas de Markdown e marcas exatas de')
    source = replace(source, '        redundantBirthCategories: true,',
                     '        automaticReferenceRepairs: true, identifierUrlRepairs: true, redundantBirthCategories: true,')
    source = replace(source, '        infoboxAlignment:',
                     "        v29IdentifierUrls:'URLs de identificadores PMC e arXiv simplificadas',\n        infoboxAlignment:")
    source = replace(source, "        stage('v272-numeric-cell-quotes',s=>v272TableCellEdits(s,cfg));",
                     "        stage('v272-numeric-cell-quotes',s=>v272TableCellEdits(s,cfg));\n"
                     "        stage('v29-table-extra-quotes',s=>v29TableSyntaxEdits(s,cfg));\n"
                     "        stage('v29-reference-closers',s=>v29ReferenceSyntaxEdits(s,cfg));")
    source = replace(source, "        stage('duplicate-literal-attributes',s=>v25SafeDuplicateAttributeEdits(s,cfg));",
                     "        stage('duplicate-literal-attributes',s=>v25SafeDuplicateAttributeEdits(s,cfg));\n"
                     "        stage('v29-table-duplicate-attributes',s=>v29TableDuplicateAttributeEdits(s,cfg));\n"
                     "        stage('v29-table-leaf-scopes',s=>v29TableLeafScopeEdits(s,cfg));")
    source = replace(source, "        stage('v282-historical-citations',s=>v282HistoricalCitationEdits(s,cfg));",
                     "        stage('v29-identifier-urls',s=>v29IdentifierPlan(s,cfg).edits);\n        stage('v282-historical-citations',s=>v282HistoricalCitationEdits(s,cfg));")
    source = replace(source, "stage('consecutive-named-reference-calls',v25SafeAdjacentReferenceEdits);stage('adjacent-empty-collectors',v25SafeCollectorEdits);",
                     "stage('consecutive-named-reference-calls',v25SafeAdjacentReferenceEdits);stage('v29-reference-repairs',s=>v29ReferenceRepairEdits(s,cfg));stage('adjacent-empty-collectors',v25SafeCollectorEdits);")
    source = replace(source, '        const tableObjects=v272TableObjectProof(plan,expected,actual);',
                     '        const v29Tables=v29TableObjectProof(plan,expected,actual);if(!v29Tables.accepted)return reject(v29Tables.reason);\n        const tableObjects=v272TableObjectProof(plan,expected,actual);')
    source = replace(source, "return v24SyntaxApply(text,v27SafeAutomationEdits(text,c,'references'));",
                     "return v29ReferenceRepairProjection(v24SyntaxApply(text,v27SafeAutomationEdits(text,c,'references')),c);")
    source = replace(source, '        return v25SafeRemember(plan,cacheOptions,allowCache);',
                     "        // Reuse a completed legacy repair only if it immediately enables\n"
                     "        // a finite new correction. Old-only repairs keep their old route.\n"
                     "        const completed=syntaxRepairPlan(plan.text,cfg);\n"
                     "        if(completed.edits.length&&!completed.unresolved.length){\n"
                     "            const finite=[['v29-table-extra-quotes',v29TableSyntaxEdits],['v29-reference-closers',v29ReferenceSyntaxEdits],\n"
                     "                ['v29-table-duplicate-attributes',v29TableDuplicateAttributeEdits],['v29-table-leaf-scopes',v29TableLeafScopeEdits],\n"
                     "                ['v29-reference-repairs',v29ReferenceRepairEdits],['v29-identifier-urls',(s,c)=>v29IdentifierPlan(s,c).edits]];\n"
                     "            let projected=completed.text,enabled=false;\n"
                     "            for(const [,find]of finite){const edits=find(projected,cfg);if(edits.length){enabled=true;projected=v24SyntaxApply(projected,edits);}}\n"
                     "            if(enabled){stage('v29-confirmed-legacy-syntax',s=>syntaxRepairPlan(s,cfg).edits);for(const [name,find]of finite)stage(name,s=>find(s,cfg));}\n"
                     "        }\n"
                     "        return v25SafeRemember(plan,cacheOptions,allowCache);")
    return source
