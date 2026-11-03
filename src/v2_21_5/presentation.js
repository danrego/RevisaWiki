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
 const count=host.querySelector('.ajg-result-count'),precise=retained?.exact===true&&Number.isSafeInteger(retained.count);count.hidden=!!last.presentationError||!!retained&&!precise;count.textContent=precise?retained.count+' ajuste'+(retained.count===1?'':'s')+' aplicado'+(retained.count===1?'':'s'):'';
 const metrics=last.byteMetrics||(last.byteMetrics=byteMetrics(last.before,last.after));
 showByteBadge(host.querySelector('.ajg-bytes'),metrics);
 const view=host.querySelector('.ajg-show-changes'),nativeDiff=v214NativeDiffControl();
 view.hidden=!nativeDiff;view.disabled=localBusy||onlineBusy||!nativeDiff||nativeDiff.disabled;
 host.querySelector('.ajg-undo').hidden=false;
}

