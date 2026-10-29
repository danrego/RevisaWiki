/*
 * Interface de ajustes automáticos. A publicação continua sendo manual.
 * A contagem e a aplicação preservam as verificações do rascunho e do resultado.
 */

function v2214OperationalMessage(error,before,adapter,writeStarted=false,confirmedText=null){
 let current;try{current=adapter?.read();}catch{}
 if(confirmedText!==null)return current===confirmedText?'Os ajustes permanecem no editor.':'O texto mudou após os ajustes. Seu texto atual foi mantido.';
 if(writeStarted)return 'O editor não confirmou a atualização.';
 const detail=String(error?.message||error||'');
 if(/^(?:A análise local não confirmou a (?:preservação|composição)|A recuperação não confirmou a preservação|A recuperação não pertence a este rascunho|A análise não corresponde às opções deste rascunho|A confirmação não pertence a este rascunho)/.test(detail))return 'Nenhuma alteração automática aplicada.';
 if(/texto mudou|contexto mudou|contexto de edição|outra revisão|outro editor/i.test(detail))return 'O texto mudou durante a análise. Nenhum resultado foi aplicado.';
 const kept=current===before?'Seu rascunho foi preservado.':'Seu texto atual foi mantido.';
 if(/cancelad|cancelamento/i.test(detail))return 'Análise cancelada. '+kept;
 if(/demorou demais|timeout|tempo limite|limite de 60/i.test(detail))return 'A análise atingiu o limite de 60 segundos. '+kept;
 return 'A análise não terminou. '+kept;
}

function showReport(result){
 const uiContext=result.uiContext||localEditorContext(editor());
 if(!v219UIContextSame(uiContext,localEditorContext(editor())))return;
 lastLocalResult={...result,uiContext};
 syncMinorResult(lastLocalResult);
 updateAppliedResult();
}

function renderIssues(){}

function updateAppliedResult(){
 if(!panel||stylesMode)return;
 v211SyncFreshness();
 const host=panel.querySelector('.ajg-result');
 if(!host)return;
 const adapter=editor(),source=adapter?.read();
 if(last&&!lastEditorContextMatches(adapter)){restoreOwnedSummary(last.summary);restoreOwnedMinor();last=null;}
 if(last&&adapter?.id===last.id&&source!==last.after&&!localBusy&&!onlineBusy){
  restoreOwnedSummary(last.summary);last.summary=null;
  if(source===last.before){restoreOwnedMinor();last=null;}
 }
 const actual=lastEditorContextMatches(adapter)&&source===last.after;
 host.hidden=!actual;
 if(!actual)return;
 const binding=v211FreshnessKey(currentOptions(false));
 if(last.presentationBinding!==binding){last.presentationBinding=binding;last.retainedTypes=null;last.presentationError=false;}
 host.querySelector('.ajg-result-title').textContent='Ajustes aplicados';
 let retained;
 if(last.presentationDeferred){retained=last.retainedTypes;queueAppliedPresentation(last);}
 else retained=last.retainedTypes||(last.retainedTypes=v211RetainedAdjustments(last.before,last.after,last.kinds||[],currentOptions(false)));
 host.querySelector('.ajg-result-count').textContent=retained?retained.text:last.presentationError?'Contagem não concluída':'Contando ajustes...';
 const metrics=last.byteMetrics||(last.byteMetrics=byteMetrics(last.before,last.after));
 showByteBadge(host.querySelector('.ajg-bytes'),metrics);
 const view=host.querySelector('.ajg-show-changes'),nativeDiff=v214NativeDiffControl();
 view.hidden=!nativeDiff;view.disabled=localBusy||onlineBusy||!nativeDiff||nativeDiff.disabled;
 host.querySelector('.ajg-undo').hidden=false;
}

async function run(){
 const adapter=editor();
 if(!adapter){message('Abra Editar código-fonte para ajustar o código.');return;}
 const before=adapter.read(),checkedOptions=v211FreshnessKey(currentOptions(false));
 v211CheckedDraft=null;v211SyncFreshness();
 if(last&&(!lastEditorContextMatches(adapter)||last.after!==before)){restoreOwnedSummary(last.summary);restoreOwnedMinor();last=null;}
 const task=beginLocalAnalysis(adapter,before,'Preparando os ajustes...');
 if(!task)return;
 let writeStarted=false,confirmedText=null;
 try{
  const proofs=await v211PrepareLeadImage(task,await prepareAutomaticProofs(task,currentOptions(false)));
  const prepared=await v220PrepareHumanIdentity(task,await prepareBirthCategory(task,await prepareBiographyGender(task,await prepareLivingCategory(task,await prepareEndMatter(task,await prepareReferenceColumns(task,proofs))))));
  let result=await computeLocal(task,{kind:'adjust',source:before,originalSource:appliedBaseline(adapter,before),options:prepared});
  result=await verifyAutomaticResult(task,result,prepared);
  const applySafety=v219AutomaticResultSafety(before,result,v219SafetyTaskContext(task));
  if(!applySafety.accepted)result=await v219AutomaticResultRollback(task,result,prepared,applySafety);
  task.guard();result.proposed=false;
  if(result.text!==before){
   writeStarted=true;adapter.write(result.text);
   if(adapter.read()!==result.text)throw new Error('O editor não confirmou a atualização.');
   confirmedText=result.text;
   rememberEdit(adapter,before,result.text,'syntax',result.changes.map(c=>c.label).join(', '));
  }
  comparisonPlan=null;showReport(result);v211MarkCheckedDraft(adapter,result,false,checkedOptions);
  message(result.text===before?'Nenhuma alteração automática aplicada.':'Código ajustado.');
 }catch(error){
  v211CheckedDraft=null;v211SyncFreshness();
  if(localTask===task)message(v2214OperationalMessage(error,before,adapter,writeStarted,confirmedText));
 }finally{finishLocalAnalysis(task);}
}

async function undo(){if(localTask?.presentation)cancelLocalAnalysis();if(localBusy||onlineBusy)return;const adapter=editor();if(!last||!adapter||!lastEditorContextMatches(adapter)||adapter.read()!==last.after){message('O texto mudou após o ajuste. Use o Desfazer do editor para preservar suas edições posteriores.');return;}const previous=last;try{adapter.write(previous.before);if(adapter.read()!==previous.before)throw new Error('O editor não confirmou a restauração.');restoreOwnedSummary(previous.summary);restoreOwnedMinor();last=null;lastLocalResult=null;comparisonPlan=null;issueStore.clear();v211CheckedDraft=null;v211SyncFreshness();panel.querySelector('.ajg-undo').disabled=true;updateAppliedResult();message('Texto anterior ao ajuste restaurado.');}catch(error){message('Não foi possível desfazer: '+error.message);}}

function queueAppliedPresentation(record){if(!record?.presentationDeferred||record.presentationStarted||record.presentationTimer||record.retainedTypes||record.presentationError||localBusy||onlineBusy)return;record.presentationTimer=root.setTimeout(async()=>{record.presentationTimer=null;const adapter=editor();if(last!==record||!lastEditorContextMatches(adapter)||adapter.read()!==record.after||localBusy||onlineBusy)return;const options=currentOptions(false),binding=v211FreshnessKey(options),summary=summaryEditor(),summaryValue=summary?.read();record.presentationStarted=true;const task=beginLocalAnalysis(adapter,record.after,'Contando os ajustes mantidos...');if(!task){record.presentationStarted=false;return;}task.presentation=true;updateBusyControls();try{const result=await computeLocal(task,{kind:'presentation',source:record.after,originalSource:record.before,presentationKinds:record.kinds,options});task.guard();if(last!==record||binding!==v211FreshnessKey(currentOptions(false))||!v219UIPresentationMatches(result,record.before,record.after,record.kinds,currentOptions(false)))throw new Error('A edição mudou durante a contagem.');record.retainedTypes=result.presentation.retained;record.topics=result.presentation.topics;record.presentationError=false;const currentSummary=summaryEditor();if(summary&&currentSummary?.id===summary.id&&currentSummary.read()===summaryValue){try{record.summary=fillSummary(record.kinds,record.summary,record.topics);}catch(error){root.console.warn('RevisaWiki: não foi possível preencher o resumo.',error);}}updateAppliedResult();message('Código ajustado.');}catch(error){if(last===record&&v219UIContextSame(record.context,localEditorContext(editor()))&&adapter.read()===record.after&&binding===v211FreshnessKey(currentOptions(false)))record.presentationError=true;}finally{record.presentationStarted=false;finishLocalAnalysis(task);}},0);}

function settingsPanel(){const wrap=node('details',undefined,'ajg-settings'),title=node('summary','Opções de ajuste');wrap.appendChild(title);const select=node('select');select.className='ajg-preset';select.setAttribute('aria-label','Conjunto de ajustes');for(const[value,text]of[['all','Todos os ajustes'],['references','Só referências'],['infoboxes','Só infocaixas']]){const option=node('option',text);option.value=value;select.appendChild(option);}select.value=preferences.preset;select.addEventListener('change',()=>{preferences={preset:select.value,overrides:{}};savePreferences();refresh();});wrap.append(select);const choices=node('div',undefined,'ajg-options');wrap.appendChild(choices);function refresh(){choices.replaceChildren();const cfg=currentOptions(false);for(const[key,text]of[['citations','Citações'],['references','Referências'],['structuralRepairs','Corrigir sintaxe, repetições e listas de referências'],['translationResidues','Retirar resíduos conhecidos de tradução'],['referenceColumns','Retirar estilos antigos do RevisaWiki nas referências'],['shortCitationChecks','Integridade de citações abreviadas'],['automaticIdenticalReferences','Reutilizar referências exatamente iguais'],['automaticParameterDuplicates','Consolidar parâmetros repetidos idênticos'],['automaticParameterNames','Corrigir nomes inválidos com equivalência única'],['automaticEmptyParameters','Retirar parâmetros inválidos vazios confirmados'],['autoMinor','Marcar ajustes do RevisaWiki como edição menor'],['tableChecks','Conferir tabelas'],['automaticTableRepairs','Aplicar reparos seguros de tabelas'],['tableAccessibility','Alcance de cabeçalhos simples'],['autoPreview','Conferir automaticamente a pré-visualização'],['registryDoiCheck','Conferir pontuação de DOI na Crossref'],['biographyStyleChecks','Campos de biografias'],['dateChecks','Conferir datas reconhecidas'],['numericRefNames','Corrigir nomes numéricos de referências'],['citationRepairs','Reparos confirmados de cadernos e títulos'],['infoboxes','Infocaixas'],['auxiliaryTemplates','Predefinições auxiliares e navboxes'],['multilingual','Sintaxe importada de outras Wikipédias'],['unifiedNotesReferences','Reunir notas e referências'],['endMatterColumns','Colunas em listas finais com oito ou mais itens principais'],['externalLinkColumns','Colunas de ligações externas'],['links','Ligações'],['headings','Seções'],['portals','Portais'],['biographyPortal','Acrescentar portal de biografias'],['occupationCase','Usar inicial minúscula em profissões comuns da infocaixa'],['automaticBiographyPortals','Acrescentar portais confirmados para biografias'],['automaticTopicPortals','Acrescentar portais temáticos confirmados'],['livingBirthAge','Exibir idade quando confirmada a condição de pessoa viva'],['automaticSpelling','Corrigir grafias inequívocas automaticamente'],['neutralReferenceNames','Simplificar nomes automáticos antigos de referências'],['obsoleteTemplates','Predefinições obsoletas'],['shortDescriptions','Descrição curta'],['authors','Autores'],['dates','Datas de citações'],['singleLineCitations','Citações em uma linha'],['moveNamedRefs','Definição na primeira chamada'],['bareReferences','Referências com ligação simples'],['birthDates','Datas de nascimento'],['markup','Formatação'],['categories','Categorias e imagens'],['endMatter','Seções finais'],['endSectionOrder','Ordenar seções finais'],['endTemplateOrder','Ordenar predefinições finais e categorias'],['authorityControl','Acrescentar autoridade com identificadores do Wikidata'],['maintenance','Predefinições de manutenção'],['shortcuts','Atalhos explícitos'],['autoSummary','Resumo automático']]){const label=node('label'),check=node('input');check.type='checkbox';check.checked= !!cfg[key];check.dataset.option=key;if(Object.hasOwn(personalConfig(),key)){check.disabled=true;label.title='Definido na configuração pessoal do script.';}check.addEventListener('change',()=>{preferences.overrides[key]=check.checked;savePreferences();});label.style.cssText='display:inline-block;margin:4px 12px 4px 0;';label.append(check,node('span',' '+text));choices.appendChild(label);}}refresh();return wrap;}

function mount(){inlineController?.mount(root.document);inlineController?.restoreNativeDraft();if(stylesMode)return mountStyles();const adapter=editor();if(localTask&&(!adapter||localTask.adapterId!==adapter.id))cancelLocalAnalysis();mountPublishAdjustment(adapter);if(!adapter){if(panel)panel.remove();panelEditor=null;last=null;comparisonPlan=null;return;}if(panel&&panel.isConnected&&panelEditor===adapter.id){for(const duplicate of root.document.querySelectorAll('#revisawiki-ptwiki'))if(duplicate!==panel)duplicate.remove();return;}if(panel)panel.remove();for(const duplicate of root.document.querySelectorAll('#revisawiki-ptwiki'))duplicate.remove();if(panelEditor!==adapter.id){last=null;comparisonPlan=null;ignoredSuggestions.clear();issueStore.clear();queryCache.clear();cacheBytes=0;}panelEditor=adapter.id;installPanelStyle();panel=node('div');panel.id='revisawiki-ptwiki';panel.setAttribute('role','region');panel.setAttribute('aria-label','RevisaWiki, ajustes de código');const heading=node('div',undefined,'ajg-heading');heading.append(node('strong','RevisaWiki'),node('span','PTwiki '+VERSION,'ajg-version'));const namespace=inlineController?.context()?.namespace??Number(mw.config.get('wgNamespaceNumber'));const introText=namespace>0&&namespace%2===1?'Ajusta o código da discussão e preserva conversas assinadas.':
namespace===10&&!/\/(?:doc|documentação)(?:\/|$)/i.test(currentTitle())?'Ajusta o código da predefinição e preserva referências e variáveis de uso.':
'Aplica ajustes automáticos ao rascunho, sem publicar.';const intro=node('p',introText,'ajg-intro');const actions=node('div',undefined,'ajg-actions');function control(text,action,classes,hint,id){const item=button(text,action,classes);item.title=hint;if(id)item.dataset.action=id;return item;}const back=control('Desfazer ajustes',undo,'ajg-undo','Restaurar o texto anterior aos ajustes do RevisaWiki, se você ainda não tiver feito outras alterações.','undo');back.disabled= !last;const stop=control('Cancelar análise',cancelLocalAnalysis,'ajg-stop','Interromper a análise local antes de aplicar os ajustes.','stop');stop.hidden=true;actions.append(control('Ajustar código',()=>run(),'ajg-run','Aplicar ajustes de código e grafias selecionadas ao texto aberto, sem publicar.','adjust'));if(namespace===1&&editingSection()===null)actions.append(control('Criar código',prepareTalkHeader,'ajg-prepare-talk','Criar PD e marcas de projeto no código da discussão, com opção de desfazer. Não publica a página.','create-talk-code'));const top=node('div',undefined,'ajg-top');top.append(heading,actions);const resultSummary=node('div',undefined,'ajg-result');resultSummary.hidden=true;const resultCopy=node('div',undefined,'ajg-result-copy');resultCopy.append(node('strong','','ajg-result-title'),node('span','','ajg-result-count'),node('span','','ajg-bytes'));resultCopy.querySelector('.ajg-bytes').hidden=true;const resultActions=node('div',undefined,'ajg-result-actions');const changesControl=control('Mostrar alterações',showAppliedChanges,'ajg-show-changes','Usar Mostrar alterações do próprio editor.','changes');changesControl.hidden=!v214NativeDiffControl();resultActions.append(changesControl,back);resultSummary.append(resultCopy,resultActions);const status=node('div','Pronto para ajustar o código-fonte.','ajg-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');const tools=node('div',undefined,'ajg-tools');tools.append(settingsPanel());panel.append(top,intro,status,stop,resultSummary,tools);const classic=root.document.querySelector('#wikiEditor-ui-toolbar, #wpTextbox1');const sourceVE=root.document.querySelector('.ve-init-mw-desktopArticleTarget .ve-ui-surface, .ve-ui-surface');const anchor=inlineController?.context()?.editorSlot?.querySelector('.rw26-source')||sourceVE||classic;if(anchor?.parentNode)anchor.parentNode.insertBefore(panel,anchor);else(root.document.querySelector('#mw-content-text')||root.document.body).prepend(panel);const loadInfo=root.RevisaWikiLoadInfo||root.AjusteGeralPTLoadInfo;if(loadInfo?.expectedVersion&&loadInfo.expectedVersion!==VERSION)
message('Versão '+VERSION+' carregada, mas o carregador pediu '+loadInfo.expectedVersion+'. Confira os arquivos de dados, programa e carregador da mesma versão.');mountPublishAdjustment(adapter);busy(onlineBusy,activeCheck);const openedPanel=panel;const changed=()=>{if(panel===openedPanel){onMinorDraftChange();updateAppliedResult();}};(inlineController?.adapter()?.id||root.document.getElementById('wpTextbox1'))?.addEventListener('input',changed);if(sourceTarget()){const model=sourceTarget().getSurface().getModel();if(typeof model.on==='function')model.on('change',changed);}}

async function checkStyles(){
 if(localBusy||onlineBusy)return;
 let session;
 try{session=onlineSession();}catch(error){message('Não foi possível iniciar a análise do CSS.');return;}
 const plan=v215StylePlan(session.source);
 if(!plan.edits.length){message('Nenhuma alteração automática aplicada.');return;}
 busy(true,session);message('Conferindo os ajustes de CSS...');
 let writeStarted=false,confirmedText=null;
 const native=async source=>{
  const escaped=session.title.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const params={action:'parse',formatversion:2,title:'RevisaWiki/Teste de estilos',text:'<templatestyles src="'+escaped+'" />',prop:'text|parsewarnings',templatesandboxtitle:session.title,templatesandboxtext:source,templatesandboxcontentmodel:'sanitized-css',templatesandboxcontentformat:'text/css',preview:true};
  if(new URLSearchParams(params).toString().length>7000)throw new Error('A folha excede o limite da conferência por leitura.');
  const response=await request(session,'get',params),html=response.parse?.text;
  if(typeof html!=='string')throw new Error('A API não retornou a folha sanitizada.');
  const doc=new root.DOMParser().parseFromString(html,'text/html'),styles=[...doc.querySelectorAll('style[data-mw-deduplicate]')];
  return{css:styles.map(style=>style.textContent).join('\n'),warnings:(response.parse.parsewarnings||[]).map(warning=>typeof warning==='string'?warning:JSON.stringify(warning)),error:!!doc.querySelector('.error,.mw-ext-cite-error')||styles.length!==1};
 };
 try{
  const original=await native(session.source);session.guard();
  const candidate=await native(plan.text);session.guard();
  const proof={kind:'native-template-styles',method:'GET',source:plan.source,candidate:plan.text,sourceHash:plan.sourceHash,candidateHash:plan.textHash,originalCss:original.css,candidateCss:candidate.css,originalWarnings:original.warnings,candidateWarnings:candidate.warnings,originalError:original.error,candidateError:candidate.error};
  const accepted=v215StyleAcceptance(plan,proof);
  if(!accepted.accepted){message('Nenhuma alteração automática aplicada.');return;}
  const adapter=editor();session.guard();writeStarted=true;adapter.write(accepted.text);
  if(adapter.read()!==accepted.text)throw new Error('O editor não confirmou a atualização.');
  confirmedText=accepted.text;
  rememberEdit(adapter,session.source,accepted.text,'styles','CSS conferido pelo sanitizador');
  const metrics=byteMetrics(session.source,accepted.text);
  message(accepted.count+' '+(accepted.count===1?'ajuste aplicado':'ajustes aplicados')+' ao CSS · '+(metrics.delta>0?'+':metrics.delta<0?'−':'')+Math.abs(metrics.delta)+' bytes.');
 }catch(error){message(v2214OperationalMessage(error,session.source,editor(),writeStarted,confirmedText));}
 finally{busy(false);}
}

function mountStyles(){
 const adapter=editor();
 if(!adapter||panel&&panel.isConnected&&panelEditor===adapter.id)return;
 if(panel)panel.remove();
 if(panelEditor!==adapter.id){last=null;queryCache.clear();cacheBytes=0;}
 panelEditor=adapter.id;issueStore.clear();installPanelStyle();panel=node('div');panel.id='revisawiki-ptwiki';
 panel.setAttribute('role','region');panel.setAttribute('aria-label','RevisaWiki, ajustes de TemplateStyles');
 const actions=node('div',undefined,'ajg-actions');
 actions.append(button('Ajustar CSS',checkStyles,'mw-ui-progressive ajg-check'),button('Desfazer',undoStyle,'ajg-undo'),button('Cancelar análise',cancelCheck,'ajg-cancel'));
 const status=node('div','Aplica ajustes de CSS confirmados pelo sanitizador, sem publicar.','ajg-status');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 panel.append(node('strong','RevisaWiki '+VERSION+' · TemplateStyles'),actions,status);
 const anchor=root.document.querySelector('#wikiEditor-ui-toolbar,#wpTextbox1');
 if(anchor?.parentNode)anchor.parentNode.insertBefore(panel,anchor);
 busy(false);
}

function undoStyle(){
 const adapter=editor();
 if(!last||!adapter||!lastEditorContextMatches(adapter)||last.after!==adapter.read()){message('O CSS mudou. Use o Desfazer do editor.');return;}
 const previous=last;
 adapter.write(previous.before);
 if(adapter.read()!==previous.before){message('O editor não confirmou a restauração.');return;}
 restoreOwnedSummary(previous.summary);last=null;issueStore.clear();busy(false);message('CSS anterior restaurado.');
}

function cancelCheck(){
 if(!activeCheck)return;
 activeCheck.cancelled=true;
 for(const pending of activeCheck.requests)if(typeof pending.abort==='function')pending.abort();
 message('Cancelando a análise...');
}
