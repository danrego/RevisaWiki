    async function prepareTalkHeader() {
        if(localBusy||onlineBusy||Number(mw.config.get('wgNamespaceNumber'))!==1||editingSection()!==null)return;
        const adapter=editor();if(!adapter)return;
        const source=adapter.read(),openedPanel=panel,title=String(mw.config.get('wgTitle')||'');
        if(!title){message('Não foi possível confirmar o título do artigo.');return;}
        panel.querySelector('.ajg-talk-draft')?.remove();
        const control=panel.querySelector('.ajg-prepare-talk');if(control)control.disabled=true;
        message('Preparando o cabeçalho da discussão...');
        try {
            const response=await new mw.Api().get({action:'query',formatversion:2,titles:title,
                prop:'revisions',rvprop:'ids|content',rvslots:'main',rvlimit:1});
            if(localBusy||onlineBusy||panel!==openedPanel||editor()?.id!==adapter.id||adapter.read()!==source)
                throw new Error('O texto mudou durante a consulta. Tente novamente.');
            const page=response.query?.pages?.[0],revision=page?.revisions?.[0],slot=revision?.slots?.main;
            if(!page||page.missing||page.ns!==0||!slot||typeof slot.content!=='string'||slot.contentmodel&&slot.contentmodel!=='wikitext')
                throw new Error('O código do artigo não ficou disponível. O rascunho foi preservado.');
            const plan=v25TalkPreparationPlan(source,slot.content,{namespaceNumber:1,sectionOnly:false,
                contentModel:mw.config.get('wgPageContentModel')||'wikitext',pageRedirect:!!mw.config.get('wgIsRedirect')});
            if(!plan.changed){message(plan.reason);return;}
            const summary=summaryEditor(),prior=summary?.snapshot(),summaryText=summary?.read()||'';
            // Replace the complete draft. Never insert at a selected position.
            adapter.write(plan.text);
            if(adapter.read()!==plan.text){
                // A mismatching editor adapter must not leave a partial header.
                if(editor()?.id===adapter.id)adapter.write(source);
                throw new Error(adapter.read()===source?'O editor recusou a substituição. O texto anterior foi restaurado.':'O editor não confirmou a substituição. Use Desfazer no editor antes de continuar.');
            }
            rememberEdit(adapter,source,plan.text,'discussion','Cabeçalho e marcas de projeto');
            if(summary&&currentOptions(false).autoSummary!==false&&!summaryText.trim()){
                summary.write(plan.summary);
                if(last)last.summary={id:summary.id,before:prior,after:plan.summary,prefix:''};
            }
            comparisonPlan=null;panel.querySelector('.ajg-diff')?.replaceChildren();
            const undo=panel.querySelector('.ajg-undo');if(undo)undo.disabled=false;
            updateAppliedResult();
            message('Código criado no rascunho. Você pode conferir as alterações ou desfazer.');
        } catch(error){if(panel===openedPanel)message('Não foi possível criar o código da discussão: '+error.message);}
        finally {if(control?.isConnected)control.disabled=localBusy||onlineBusy;}
    }
