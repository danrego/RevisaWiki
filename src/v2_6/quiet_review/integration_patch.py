"""Keep deliberate formatting choices out of the actionable review list."""
def apply(source):
    def once(old,new):
        nonlocal source
        assert source.count(old)==1,old[:100]
        source=source.replace(old,new,1)
    start=source.index('    function notAppliedReasons(source, options = {}) {')
    end=source.index('    function noteReferenceColumnConfirmation',start)
    source=source[:start]+'''    function notAppliedReasons(source, options = {}) {
        const cfg = {...DEFAULTS, ...options};
        // An explicit layout or a short list is not an error to review.
        return referenceColumnPlans(source,cfg).filter(p=>p.code==='columns-legacy')
            .map(p=>({code:p.code,message:p.message,start:p.start})).slice(0,12);
    }
'''+source[end:]
    old="""                else {
                    const count = lineRows(start, end).filter(isEntry).length;
                    if (count > 0 && count < END_MATTER_COLUMN_MINIMUM && layout.some(n => {
                        const p = parsedTemplate(s.slice(n.start, n.end));
                        return p.name === 'div col' || ['inícioref','inicioref','refbegin'].includes(p.name) && p.parts.slice(1).some(part =>
                            /^\\s*(?:colwidth|larguracol|largcol)\\s*=\\s*\\S/i.test(part) || !part.includes('=') && part.trim() && part.trim() !== '1');
                    })) warnings.push('Lista de ' + section + ' com menos de seis itens e configuração própria de colunas. A formatação foi preservada para revisão.');
                }
"""
    once(old,'')
    once("            result.warnings.push('A pré-visualização automática não terminou. Os ajustes locais precisam ser conferidos na pré-visualização normal.');\n",'')
    once('        if (!task.previewSession) task.previewSession = onlineSession();', '''        if (!task.previewSession) {
            task.previewSession = onlineSession();
            task.previewSession.client = new mw.Api({ajax:{timeout:8000}});
        }''')
    once("        try {\n            message('Conferindo os ajustes na pré-visualização, sem salvar...');", """        let previewTimer=null;
        try {
            task.previewDeadlinePromise=new Promise((resolve,reject)=>{
                previewTimer=root.setTimeout(()=>{
                    task.previewTimedOut=true;
                    for(const pending of task.previewSession?.requests || [])pending.abort?.();
                    reject(new Error('Tempo de consulta online encerrado.'));
                },12000);
            });
            message('Conferindo os ajustes na pré-visualização, sem salvar...');""")
    once('''            const before = task.previewBaseline || await taskParse(task,task.source);
            const after = await taskParse(task,result.text);''', '''            const [before,after] = await Promise.all([
                task.previewBaseline || taskParse(task,task.source),
                taskParse(task,result.text)
            ]);''')
    once('''        task.guard();
        if (!task.previewSession) {''','''        task.guard();
        if(task.previewTimedOut)throw new Error('Tempo de consulta online encerrado.');
        if (!task.previewSession) {''')
    once('        const parsed = await parseDraft(session, source);','''        const pending=parseDraft(session,source);
        const parsed=await (task.previewDeadlinePromise?Promise.race([pending,task.previewDeadlinePromise]):pending);''')
    once('        } finally { task.previewSession = null; task.preflightRequests = []; }', '''        } finally {
            if(previewTimer!==null)root.clearTimeout(previewTimer);
            if(task.previewSession)task.previewSession.cancelled=true;
            for(const pending of task.previewSession?.requests || [])pending.abort?.();
            task.previewDeadlinePromise=null;
            task.previewSession = null; task.preflightRequests = [];
        }''')
    marker="        if(result.previewCheck?.checked) setIssues('automatic-preview',"
    start=source.index(marker);end=source.index('\n',start)
    line=source[start:end]
    source=source[:start]+'''        detail.querySelector('.ajg-preview-status')?.remove();
        if (result.previewCheck?.status === 'incomplete') {
            const status=node('p','Conferência online indisponível. Use Mostrar previsão para ver o resultado.','ajg-preview-status');
            status.dataset.status='incomplete';automatic.append(status);
        }
'''+line+source[end:]
    return source
