    async function prepareTalkHeader() {
        if(localBusy||onlineBusy||Number(mw.config.get('wgNamespaceNumber'))!==1||editingSection()!==null)return;
        const adapter=editor();if(!adapter)return;
        const source=adapter.read(),openedPanel=panel,title=String(mw.config.get('wgTitle')||'');
        if(!title){message('Não foi possível confirmar o título do artigo.');return;}
        const old=panel.querySelector('.ajg-talk-draft');if(old)old.remove();
        const control=panel.querySelector('.ajg-prepare-talk');if(control)control.disabled=true;
        message('Consultando os portais do artigo, sem publicar...');
        try {
            const response=await new mw.Api().get({action:'query',formatversion:2,titles:title,
                prop:'revisions',rvprop:'ids|content',rvslots:'main',rvlimit:1});
            if(panel!==openedPanel||editor()?.id!==adapter.id||adapter.read()!==source)throw new Error('O texto mudou durante a consulta. Tente novamente.');
            const page=response.query?.pages?.[0],revision=page?.revisions?.[0],slot=revision?.slots?.main;
            if(!page||page.missing||page.ns!==0||!slot||typeof slot.content!=='string'||slot.contentmodel&&slot.contentmodel!=='wikitext')
                throw new Error('O código do artigo não ficou disponível. O rascunho foi preservado.');
            const plan=v25TalkPreparationPlan(source,slot.content,{namespaceNumber:1,sectionOnly:false,
                contentModel:mw.config.get('wgPageContentModel')||'wikitext',pageRedirect:!!mw.config.get('wgIsRedirect')});
            if(!plan.changed){message(plan.reason);return;}
            const wrap=node('div',undefined,'ajg-talk-draft');
            wrap.append(node('p','Cabeçalho proposto. Projetos confirmados: '+(plan.projects.join(', ')||'nenhum nos portais reconhecidos')+'.'));
            wrap.append(snippet(plan.text));
            wrap.append(node('p','Resumo da edição: '+plan.summary));
            const apply=button('Aplicar ao editor',()=>{
                if(localBusy||onlineBusy||panel!==openedPanel||editor()?.id!==adapter.id||adapter.read()!==source){
                    message('O texto mudou. Prepare a discussão novamente.');return;
                }
                const summary=summaryEditor(),prior=summary?.snapshot(),summaryText=summary?.read()||'';
                adapter.write(plan.text);
                if(adapter.read()!==plan.text){message('O editor não confirmou a alteração. Confira o rascunho.');return;}
                rememberEdit(adapter,source,plan.text,'discussion','Cabeçalho e marcas de projeto');
                // A ação tem um resumo próprio. Nunca substitua o resumo manual.
                if(summary&&currentOptions(false).autoSummary!==false&&!summaryText.trim()){
                    summary.write(plan.summary);
                    if(last)last.summary={id:summary.id,before:prior,after:plan.summary,prefix:''};
                }
                wrap.remove();updateAppliedResult();
                message('Cabeçalho aplicado ao rascunho. Confira o resultado antes de salvar.');
            },'ajg-talk-apply');
            const dismiss=button('Fechar',()=>wrap.remove(),'ajg-talk-dismiss');
            wrap.append(apply,dismiss);panel.querySelector('.ajg-status').after(wrap);
            message(plan.reason);
        } catch(error){if(panel===openedPanel)message('Não foi possível preparar a discussão: '+error.message);}
        finally {if(control?.isConnected)control.disabled=localBusy||onlineBusy;}
    }
