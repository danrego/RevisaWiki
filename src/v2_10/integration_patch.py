"""Integrate 2.10 repairs into source-bound planning and native validation."""


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('2.10 integration anchor absent or repeated: ' + before[:100])
    return source.replace(before, after, 1)


def apply(source):
    source = replace(source, '        automaticReferenceRepairs: true, identifierUrlRepairs: true,',
                     '        referenceGraphRepairs: true, harvardAnchorRepairs: true, tableSyntaxRepairs: true, responsiveTableWrappers: true, independentRepairGroups: true,\n        automaticReferenceRepairs: true, identifierUrlRepairs: true,')
    source = replace(source, "        stage('v283-redundant-birth-category',s=>v283BirthCategoryEdits(s,cfg));",
                     "        stage('v210-harvard-anchors',s=>v210HarvardAnchorEdits(s,cfg));\n        stage('v283-redundant-birth-category',s=>v283BirthCategoryEdits(s,cfg));")
    source = replace(source, "        stage('v272-numeric-cell-quotes',s=>v272TableCellEdits(s,cfg));",
                     "        stage('v210-reference-tag-spacing',s=>v210ReferenceSyntaxEdits(s,cfg));\n        stage('v210-table-syntax',s=>v210TableSyntaxEdits(s,cfg));\n        stage('v272-numeric-cell-quotes',s=>v272TableCellEdits(s,cfg));")
    source = replace(source, "        stage('v29-table-leaf-scopes',s=>v29TableLeafScopeEdits(s,cfg));",
                     "        stage('v29-table-leaf-scopes',s=>v29TableLeafScopeEdits(s,cfg));\n        stage('v210-table-deep-leaf-scopes',s=>v210TableDeepLeafScopeEdits(s,cfg));\n        stage('v210-responsive-table-wrapper',s=>v210ResponsiveTableEdits(s,cfg));\n        stage('v210-reference-conflicts',s=>v210ReferenceConflictEdits(s,cfg));")
    source = replace(source, "stage('v29-reference-repairs',s=>v29ReferenceRepairEdits(s,cfg));stage('adjacent-empty-collectors',v25SafeCollectorEdits);",
                     "stage('v29-reference-repairs',s=>v29ReferenceRepairEdits(s,cfg));stage('v210-reference-banks',s=>v210ReferenceBankEdits(s,cfg));stage('adjacent-empty-collectors',v25SafeCollectorEdits);")
    source = replace(source, "return v29ReferenceRepairProjection(v24SyntaxApply(text,v27SafeAutomationEdits(text,c,'references')),c);",
                     "return v210ReferenceRepairProjection(v29ReferenceRepairProjection(v24SyntaxApply(text,v27SafeAutomationEdits(text,c,'references')),c),c);")
    source = replace(source, '        const v29Tables=v29TableObjectProof(plan,expected,actual);',
                     '        const v210Tables=v210TableObjectProof(plan,expected,actual);if(!v210Tables.accepted)return reject(v210Tables.reason);\n        const v29Tables=v29TableObjectProof(plan,expected,actual);')
    source = replace(source, "            const finite=[['v29-table-extra-quotes',v29TableSyntaxEdits],['v29-reference-closers',v29ReferenceSyntaxEdits],",
                     "            const finite=[['v210-reference-tag-spacing',v210ReferenceSyntaxEdits],['v210-table-syntax',v210TableSyntaxEdits],['v210-table-deep-leaf-scopes',v210TableDeepLeafScopeEdits],['v210-responsive-table-wrapper',v210ResponsiveTableEdits],['v210-reference-conflicts',v210ReferenceConflictEdits],['v210-reference-banks',v210ReferenceBankEdits],['v29-table-extra-quotes',v29TableSyntaxEdits],['v29-reference-closers',v29ReferenceSyntaxEdits],")
    source = replace(source, ' * Em referências completas, reutiliza fontes idênticas com um nome',
                     ' * A versão 2.10 amplia os reparos de tabelas e referências. Corrige\n'
                     ' * separadores e fechamentos nos casos reconhecidos, reutiliza fontes\n'
                     ' * idênticas definidas no rodapé e separa nomes conflitantes quando\n'
                     ' * todas as chamadas contêm a fonte completa. Citações abreviadas\n'
                     ' * recebem um destino local somente após confirmação na prévia.\n'
                     ' * A análise compartilha leituras do mesmo rascunho e pode manter\n'
                     ' * grupos independentes de ajustes que passaram na verificação.\n'
                     ' * Um contêiner de rolagem reconhecido pode receber limites de\n'
                     ' * largura, mantendo a tabela e todos os dados dentro dele.\n *\n'
                     ' * Em referências completas, reutiliza fontes idênticas com um nome')
    source = replace(source, "step.name.startsWith('v28-')&&Array.isArray(edit.proof?.changeRules)",
                     "(step.name.startsWith('v28-')||step.name.startsWith('v210-'))&&Array.isArray(edit.proof?.changeRules)")
    return source
