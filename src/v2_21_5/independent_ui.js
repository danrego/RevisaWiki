/* Complete candidates are checked against the original source before they can be retained. */
function v2215QuickResult(job){
 const source=job.source,cfg=job.options||{},snapshot=job.localSafetyOptionsSnapshot??JSON.stringify(cfg),context=job.localSafetyContext??null;
 if(typeof source!=='string'||snapshot!==JSON.stringify(cfg))throw new Error('O resultado não pertence a este rascunho.');
 if(!v2214RecoveryJobAllowed(job))return v2214PreservedResult(job);
 const plan=v221RepairPlan(source,cfg),text=plan.text;
 const changes=plan.steps.map(step=>({id:step.family,label:'Código normalizado',count:step.plan.edits?.length||1}));
 const result={...v2214PreservedResult(job),text,changes,
  preservation:preservationAudit(source,text,cfg),
  localCompositionSafety:v219CompositionSafetyVerdict(source,text,cfg,snapshot,context),
  v2215Checkpoint:true};
 if(!v219AutomaticResultSafety(source,result,context).accepted)return v2214PreservedResult(job);
 const hunks=diffHunks(source,text),metrics=byteMetrics(source,text,hunks);
 result.byteMetrics=metrics;result.minorCheck=minorEligibility(source,text,{...cfg,hunks,metrics});
 return result;
}
function v2215ProgressIndicator(){
 if(!panel)return;
 let style=root.document.getElementById('revisawiki-progress-style');
 if(!style){style=node('style');style.id='revisawiki-progress-style';style.textContent='@keyframes rw-turn{to{transform:rotate(360deg)}}.ajg-progress-indicator{display:inline-block;width:13px;height:13px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;vertical-align:middle;margin-inline:8px;animation:rw-turn .8s linear infinite}.ajg-progress-indicator[hidden]{display:none}@media(prefers-reduced-motion:reduce){.ajg-progress-indicator{animation:none}}';root.document.head.appendChild(style);}
 let icon=panel.querySelector('.ajg-progress-indicator');
 if(!icon){icon=node('span',undefined,'ajg-progress-indicator');icon.setAttribute('role','status');icon.setAttribute('aria-label','Analisando o código');panel.querySelector('.ajg-heading')?.appendChild(icon);}
 icon.hidden=!(localBusy||onlineBusy);
}
function updateBusyControls(){v2215ProgressIndicator();const any=localBusy||onlineBusy;if(publishAdjustment)publishAdjustment.disabled=any;if(!panel)return;updateAppliedResult();panel.classList.toggle('ajg-local-busy',localBusy);panel.setAttribute('aria-busy',String(any));panel.querySelectorAll('.ajg-check-all,.ajg-select-changes,.ajg-disambig-apply,.ajg-run,.ajg-compare,.ajg-spelling,.ajg-check,.ajg-preview,.ajg-revision,.ajg-resume,.ajg-review,.ajg-ignore,.ajg-spelling-ignore-rule,.ajg-spelling-allow-word,.ajg-change-choice,.ajg-apply-choices').forEach(b=>{b.disabled=any;});const undoControl=panel.querySelector('.ajg-undo');if(undoControl)undoControl.disabled=(any&&!localTask?.presentation)|| !last;const stopControl=panel.querySelector('.ajg-stop');if(stopControl){stopControl.hidden= !localBusy;stopControl.disabled= !localBusy;}for(const b of panel.querySelectorAll('.ajg-disambig-apply'))b.disabled=any|| !b.parentNode.querySelector('.ajg-disambig-target')?.value;const onlineCancel=panel.querySelector('.ajg-cancel');if(onlineCancel){onlineCancel.hidden=!onlineBusy;onlineCancel.disabled=!onlineBusy;}panel.querySelectorAll('.ajg-settings input,.ajg-settings select,.ajg-spelling-settings input,.ajg-spelling-settings button,.ajg-spelling-filter').forEach(e=>{const key=e.dataset.option;e.disabled=any|| !!(key&&Object.hasOwn(personalConfig(),key))||
(e.classList.contains('ajg-spelling-words-clear')&& !spellingPreferences.words.length);});}
async function run(){
 const adapter=editor();
 if(!adapter){message('Abra Editar código-fonte para ajustar o código.');return;}
 const before=adapter.read(),checkedOptions=v211FreshnessKey(currentOptions(false));
 v211CheckedDraft=null;v211SyncFreshness();
 if(last&&(!lastEditorContextMatches(adapter)||last.after!==before)){restoreOwnedSummary(last.summary);restoreOwnedMinor();last=null;}
 const task=beginLocalAnalysis(adapter,before,'Preparando os ajustes...');
 if(!task)return;
 let writeStarted=false,confirmedText=null,prepared=null;
 try{
  const proofs=await v211PrepareLeadImage(task,await prepareAutomaticProofs(task,currentOptions(false)));
  prepared=await v220PrepareHumanIdentity(task,await prepareBirthCategory(task,await prepareBiographyGender(task,await prepareLivingCategory(task,await prepareEndMatter(task,await prepareReferenceColumns(task,proofs))))));
  const early=await computeLocal(task,{kind:'adjust',source:before,originalSource:before,options:prepared,v2215Checkpoint:true});
  const checkedEarly=await verifyAutomaticResult(task,early,prepared);
  task.guard();
  if(checkedEarly.text!==before&&v219AutomaticResultSafety(before,checkedEarly,v219SafetyTaskContext(task)).accepted)task.v2215Checkpoint=checkedEarly;
  let result=await computeLocal(task,{kind:'adjust',source:before,originalSource:appliedBaseline(adapter,before),options:prepared});
  result=await verifyAutomaticResult(task,result,prepared);
  const applySafety=v219AutomaticResultSafety(before,result,v219SafetyTaskContext(task));
  if(!applySafety.accepted)result=await v219AutomaticResultRollback(task,result,prepared,applySafety);
  if(result.text===before&&task.v2215Checkpoint){
   const saved=task.v2215Checkpoint,requested=JSON.parse(task.v2214RequestedOptionsSnapshot);
   if(checkedOptions===v211FreshnessKey(currentOptions(false))&&v219AutomaticResultSafety(before,saved,v219SafetyTaskContext(task)).accepted&&
      v2214EffectiveResultOptions(before,saved,requested,v219SafetyTaskContext(task)))result=saved;
  }
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
  if(localTask===task){
   let retained=false;
   if(!writeStarted&&task.v2215Checkpoint){
    try{
     task.guard();if(checkedOptions!==v211FreshnessKey(currentOptions(false)))throw new Error('As opções mudaram.');const candidate=task.v2215Checkpoint;
     if(!v219AutomaticResultSafety(before,candidate,v219SafetyTaskContext(task)).accepted)throw new Error('Resultado não confirmado.');
     const requested=JSON.parse(task.v2214RequestedOptionsSnapshot),effective=v2214EffectiveResultOptions(before,candidate,requested,v219SafetyTaskContext(task));
     if(!effective)throw new Error('Opções não confirmadas.');
     writeStarted=true;adapter.write(candidate.text);
     if(adapter.read()!==candidate.text)throw new Error('O editor não confirmou a atualização.');
     confirmedText=candidate.text;rememberEdit(adapter,before,candidate.text,'syntax',candidate.changes.map(c=>c.label).join(', '));
     comparisonPlan=null;showReport(candidate);message('Código ajustado.');retained=true;
    }catch{}
   }
   if(!retained)message(v2214OperationalMessage(error,before,adapter,writeStarted,confirmedText));
  }
 }finally{finishLocalAnalysis(task);}
}


function beginLocalAnalysis(adapter,source,messageText){if(localBusy||onlineBusy){message('Há uma conferência em andamento. Aguarde ou cancele antes de iniciar outra.');return null;}const task={v2214Deadline:root.performance.now()+60000,id:++localSerial,adapterId:adapter.id,context:localEditorContext(adapter),source,panel,title:currentTitle(),section:editingSection(),base:baseRevision(),cancelled:false,guard(){const current=editor();if(this.cancelled||localTask!==this)throw new Error('Análise cancelada. Nenhum ajuste foi aplicado.');if(!current|| !v219UIContextSame(this.context,localEditorContext(current))||current.id!==this.adapterId||current.read()!==this.source||panel!==this.panel||
editingSection()!==this.section||baseRevision()!==this.base||currentTitle()!==this.title)
throw new Error('O texto ou o editor mudou durante a análise. Nenhum ajuste foi aplicado. Execute a revisão novamente.');}};localTask=task;localBusy=true;api.processing.active=true;updateBusyControls();message(messageText);return task;}
