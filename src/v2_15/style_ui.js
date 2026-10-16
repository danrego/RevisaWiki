    async function checkStyles() {
        if(localBusy||onlineBusy)return;
        let session;try{session=onlineSession();}catch(error){message(error.message);return;}
        const audit=templateStylesAudit(session.source),plan=v215StylePlan(session.source),choices=panel.querySelector('.ajg-style-choices');choices.replaceChildren();
        setIssues('styles',audit.findings,session.source);busy(true,session);message('Conferindo seletores, valores e regras do CSS, sem publicar...');
        const native=async source=>{
            const escaped=session.title.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
            const params={action:'parse',formatversion:2,title:'RevisaWiki/Teste de estilos',text:'<templatestyles src="'+escaped+'" />',prop:'text|parsewarnings',templatesandboxtitle:session.title,templatesandboxtext:source,templatesandboxcontentmodel:'sanitized-css',templatesandboxcontentformat:'text/css',preview:true};
            // Small, read-only requests. A long sheet is never sent by POST.
            if(new URLSearchParams(params).toString().length>7000)throw new Error('A folha excede o limite da conferência por leitura.');
            const response=await request(session,'get',params),html=response.parse?.text;if(typeof html!=='string')throw new Error('A API não retornou a folha sanitizada.');
            const doc=new root.DOMParser().parseFromString(html,'text/html'),styles=[...doc.querySelectorAll('style[data-mw-deduplicate]')];
            return {css:styles.map(style=>style.textContent).join('\n'),warnings:(response.parse.parsewarnings||[]).map(warning=>typeof warning==='string'?warning:JSON.stringify(warning)),error:!!doc.querySelector('.error,.mw-ext-cite-error')||styles.length!==1};
        };
        try {
            const original=await native(session.source);session.guard();
            if(plan.edits.length){
                const candidate=await native(plan.text);session.guard();
                const proof={kind:'native-template-styles',method:'GET',source:plan.source,candidate:plan.text,sourceHash:plan.sourceHash,candidateHash:plan.textHash,originalCss:original.css,candidateCss:candidate.css,originalWarnings:original.warnings,candidateWarnings:candidate.warnings,originalError:original.error,candidateError:candidate.error};
                const accepted=v215StyleAcceptance(plan,proof);
                if(accepted.accepted){
                    const adapter=editor();session.guard();adapter.write(accepted.text);if(adapter.read()!==accepted.text)throw new Error('O editor não confirmou a atualização.');
                    rememberEdit(adapter,session.source,accepted.text,'styles','CSS conferido pelo sanitizador');
                    setIssues('styles',[{code:'css-retained',state:'resolved',message:'Seletores, condições, valores e ordem das declarações conferidos no CSS retornado.'}],accepted.text);
                    message(accepted.count+' '+(accepted.count===1?'ajuste aplicado':'ajustes aplicados')+' ao CSS. O texto está no editor para revisão.');return;
                }
            }
            const retained=cssRetention(session.source,original.css),findings=[...audit.findings];
            for(const d of retained.missing)if(!findings.some(f=>f.start===d.start))findings.push({code:'css-declaration-missing',message:'Valor ou contexto não confirmado no CSS retornado: '+d.before+'.',start:d.start,end:d.end});
            for(const rule of retained.selectorsMissing)findings.push({code:'css-selector-missing',message:'Seletor ou condição não confirmado no CSS retornado: '+rule.selectors.join(', ')+'.',start:rule.start,end:rule.end});
            for(const warning of original.warnings)findings.push({code:'css-api-warning',message:warning});
            if(!findings.length&&retained.accepted)findings.push({code:'css-retained',state:'resolved',message:'Seletores, condições, valores e ordem das declarações conferidos no CSS retornado.'});
            setIssues('styles',findings,session.source);message('Conferência de CSS concluída.');
        }catch(error){if(editor()?.read()===session.source)setIssues('styles',[...audit.findings,{code:'css-unavailable',message:'O CSS foi preservado. '+onlineError(error)}],session.source);message(onlineError(error));}
        finally{busy(false);}
    }
